from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.supabase_client import (
    insert_data, get_data, update_data, delete_data,
    get_paginated_data, get_assignments_with_details
)
from app.schemas import (
    AssignmentCreate, AssignmentResponse, AssignmentUpdate,
    AssignmentListResponse, PaginationResponse, BaseResponse,
    BulkAssignRequest, BulkOperationResponse
)
from app.routes.auth import get_current_user, require_roles
from app.services.notification_service import NotificationService
from typing import List, Optional, Literal
import logging
import math

logger = logging.getLogger(__name__)
router = APIRouter()


def _process_assignment_data(assignment_data: dict) -> dict:
    """Process raw assignment data to include additional fields."""
    # Handle staff profile data
    if assignment_data.get("staff"):
        assignment_data["staff_name"] = assignment_data["staff"].get("full_name")
        assignment_data["staff_department"] = assignment_data["staff"].get("department")
        del assignment_data["staff"]
    
    # Handle assigned_by profile data
    if assignment_data.get("assigned_by_profile"):
        assignment_data["assigned_by_name"] = assignment_data["assigned_by_profile"].get("full_name")
        del assignment_data["assigned_by_profile"]
    
    # Handle issue data
    if assignment_data.get("issues"):
        assignment_data["issue_title"] = assignment_data["issues"].get("title")
        assignment_data["issue_category"] = assignment_data["issues"].get("category")
        del assignment_data["issues"]
    
    return assignment_data


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment: AssignmentCreate,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Create a new assignment (admin/supervisor only)."""
    try:
        user_role = current_user["profile"]["role"]
        user_id = current_user["profile"]["id"]
        
        # Check if issue exists
        issues = get_data("issues", {"id": assignment.issue_id})
        if not issues:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )
        
        issue = issues[0]
        
        # Check if staff user exists
        staff = get_data("profiles", {"id": assignment.staff_id})
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found"
            )
        
        staff_member = staff[0]
        if staff_member.get("role") != "staff":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a staff member"
            )
        
        # Check department permissions for supervisors
        if user_role == "supervisor":
            user_department = current_user["profile"]["department"]
            staff_department = staff_member.get("department")
            
            if user_department != staff_department:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot assign to staff outside your department"
                )
        
        # Check if issue is already assigned to the same staff member
        existing_assignments = get_data("issue_assignments", {
            "issue_id": assignment.issue_id,
            "staff_id": assignment.staff_id,
            "status": ["assigned", "in_progress"]
        })
        
        if existing_assignments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Issue is already assigned to this staff member"
            )
        
        # Set assigned_by to current user
        assignment_data = assignment.dict()
        assignment_data["assigned_by"] = user_id
        
        # Create assignment
        result = insert_data("issue_assignments", assignment_data)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create assignment"
            )
        
        # Update issue status to in_progress if it was pending
        if issue["status"] == "pending":
            update_data("issues", {"id": assignment.issue_id}, {"status": "in_progress"})
        
        # Get the created assignment with related data
        created_assignment = get_data(
            "issue_assignments",
            {"id": result[0]["id"]},
            select_fields="""
            *, 
            staff:profiles!staff_id(full_name, department),
            assigned_by_profile:profiles!assigned_by(full_name),
            issues!issue_id(title, category)
            """
        )
        
        if not created_assignment:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created assignment"
            )
        
        assignment_response_data = _process_assignment_data(created_assignment[0])
        
        # Send notification
        try:
            NotificationService.notify_issue_assigned(
                issue, assignment_response_data, staff_member
            )
        except Exception as e:
            logger.warning(f"Failed to send assignment notification: {str(e)}")
        
        logger.info(f"Assignment created: issue {assignment.issue_id} assigned to {assignment.staff_id} by {user_id}")
        return AssignmentResponse(**assignment_response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create assignment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assignment"
        )


@router.get("/", response_model=AssignmentListResponse)
async def list_assignments(
    staff_id: Optional[str] = Query(None, description="Filter by staff ID"),
    issue_id: Optional[int] = Query(None, description="Filter by issue ID"),
    status_filter: Optional[Literal["assigned", "in_progress", "completed"]] = Query(None, alias="status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """List assignments with filtering and pagination."""
    try:
        filters = {}
        user_role = current_user["profile"]["role"]
        user_id = current_user["profile"]["id"]
        
        # Role-based filtering
        if user_role == "staff":
            filters["staff_id"] = user_id
        elif user_role == "supervisor":
            # Supervisors can see assignments in their department
            user_department = current_user["profile"]["department"]
            dept_staff = get_data("profiles", {"department": user_department, "role": "staff"})
            dept_staff_ids = [s["id"] for s in dept_staff]
            if dept_staff_ids:
                filters["staff_id"] = dept_staff_ids
            else:
                # No staff in department, return empty
                return AssignmentListResponse(
                    success=True,
                    assignments=[],
                    pagination=PaginationResponse(
                        total=0, page=page, per_page=per_page, 
                        total_pages=1, has_next=False, has_prev=False
                    )
                )
        elif staff_id:
            filters["staff_id"] = staff_id
        
        # Apply other filters
        if issue_id:
            filters["issue_id"] = issue_id
        if status_filter:
            filters["status"] = status_filter
        
        # Department filtering (admin only)
        if department and user_role == "admin":
            dept_staff = get_data("profiles", {"department": department, "role": "staff"})
            dept_staff_ids = [s["id"] for s in dept_staff]
            if dept_staff_ids:
                if "staff_id" in filters:
                    # Intersect with existing staff_id filter
                    if isinstance(filters["staff_id"], list):
                        filters["staff_id"] = [sid for sid in filters["staff_id"] if sid in dept_staff_ids]
                    else:
                        filters["staff_id"] = [filters["staff_id"]] if filters["staff_id"] in dept_staff_ids else []
                else:
                    filters["staff_id"] = dept_staff_ids
        
        # Get assignments with pagination
        assignments, total = get_assignments_with_details(
            filters=filters,
            page=page,
            per_page=per_page
        )
        
        # Process assignments data
        processed_assignments = []
        for assignment in assignments:
            assignment_data = _process_assignment_data(assignment)
            processed_assignments.append(AssignmentResponse(**assignment_data))
        
        # Calculate pagination metadata
        total_pages = math.ceil(total / per_page) if total > 0 else 1
        
        pagination = PaginationResponse(
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
        logger.info(f"Listed {len(processed_assignments)} assignments for {user_role}")
        return AssignmentListResponse(
            success=True,
            assignments=processed_assignments,
            pagination=pagination
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch assignments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assignments"
        )


@router.get("/my", response_model=AssignmentListResponse)
async def get_my_assignments(
    status_filter: Optional[Literal["assigned", "in_progress", "completed"]] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_roles(["staff"]))
):
    """Get current user's assignments (staff only)."""
    try:
        user_id = current_user["profile"]["id"]
        
        filters = {"staff_id": user_id}
        if status_filter:
            filters["status"] = status_filter
        
        assignments, total = get_assignments_with_details(
            filters=filters,
            page=page,
            per_page=per_page
        )
        
        processed_assignments = []
        for assignment in assignments:
            assignment_data = _process_assignment_data(assignment)
            processed_assignments.append(AssignmentResponse(**assignment_data))
        
        total_pages = math.ceil(total / per_page) if total > 0 else 1
        pagination = PaginationResponse(
            total=total, page=page, per_page=per_page, total_pages=total_pages,
            has_next=page < total_pages, has_prev=page > 1
        )
        
        return AssignmentListResponse(
            success=True,
            assignments=processed_assignments,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error(f"Failed to get user assignments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assignments"
        )


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int, 
    current_user: dict = Depends(get_current_user)
):
    """Get assignment by ID."""
    try:
        assignments = get_data(
            "issue_assignments",
            {"id": assignment_id},
            select_fields="""
            *, 
            staff:profiles!staff_id(full_name, department),
            assigned_by_profile:profiles!assigned_by(full_name),
            issues!issue_id(title, category)
            """
        )
        
        if not assignments:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = assignments[0]
        user_role = current_user["profile"]["role"]
        user_id = current_user["profile"]["id"]
        
        # Permission check
        if user_role == "staff" and assignment["staff_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this assignment"
            )
        elif user_role == "supervisor":
            # Supervisors can only see assignments in their department
            staff_data = get_data("profiles", {"id": assignment["staff_id"]})
            if staff_data and staff_data[0].get("department") != current_user["profile"]["department"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view assignments outside your department"
                )
        
        assignment_data = _process_assignment_data(assignment)
        return AssignmentResponse(**assignment_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch assignment {assignment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assignment"
        )


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update assignment status."""
    try:
        # Check if assignment exists
        existing_assignments = get_data("issue_assignments", {"id": assignment_id})
        if not existing_assignments:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        existing_assignment = existing_assignments[0]
        user_role = current_user["profile"]["role"]
        user_id = current_user["profile"]["id"]
        
        # Permission check
        if user_role == "staff" and existing_assignment["staff_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this assignment"
            )
        elif user_role == "supervisor":
            # Check if staff is in supervisor's department
            staff_data = get_data("profiles", {"id": existing_assignment["staff_id"]})
            if staff_data and staff_data[0].get("department") != current_user["profile"]["department"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update assignments outside your department"
                )
        
        # Update assignment
        update_dict = assignment_update.dict(exclude_unset=True)
        updated_assignments = update_data("issue_assignments", {"id": assignment_id}, update_dict)
        
        if not updated_assignments:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update assignment"
            )
        
        # Update issue status based on assignment status
        issue_id = existing_assignment["issue_id"]
        if assignment_update.status == "completed":
            # Check if all assignments for this issue are completed
            all_assignments = get_data("issue_assignments", {"issue_id": issue_id})
            all_completed = all(a["status"] == "completed" for a in all_assignments)
            
            if all_completed:
                update_data("issues", {"id": issue_id}, {"status": "resolved"})
                
                # Send resolution notification
                try:
                    issue_data = get_data("issues", {"id": issue_id})
                    citizen_data = get_data("profiles", {"id": issue_data[0]["citizen_id"]})
                    if issue_data and citizen_data:
                        NotificationService.notify_issue_resolved(issue_data[0], citizen_data[0])
                except Exception as e:
                    logger.warning(f"Failed to send resolution notification: {str(e)}")
        elif assignment_update.status == "in_progress":
            # Ensure issue is marked as in_progress
            update_data("issues", {"id": issue_id}, {"status": "in_progress"})
        
        # Get updated assignment with related data
        updated_assignment = get_data(
            "issue_assignments",
            {"id": assignment_id},
            select_fields="""
            *, 
            staff:profiles!staff_id(full_name, department),
            assigned_by_profile:profiles!assigned_by(full_name),
            issues!issue_id(title, category)
            """
        )
        
        if not updated_assignment:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated assignment"
            )
        
        assignment_data = _process_assignment_data(updated_assignment[0])
        
        logger.info(f"Assignment {assignment_id} updated by {user_id}")
        return AssignmentResponse(**assignment_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update assignment {assignment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assignment"
        )


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int, 
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Delete assignment (admin/supervisor only)."""
    try:
        user_role = current_user["profile"]["role"]
        
        # Check if assignment exists
        existing_assignments = get_data("issue_assignments", {"id": assignment_id})
        if not existing_assignments:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = existing_assignments[0]
        
        # Permission check for supervisors
        if user_role == "supervisor":
            staff_data = get_data("profiles", {"id": assignment["staff_id"]})
            if staff_data and staff_data[0].get("department") != current_user["profile"]["department"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete assignments outside your department"
                )
        
        # Delete assignment
        delete_data("issue_assignments", {"id": assignment_id})
        
        # Update issue status if no more assignments exist
        issue_id = assignment["issue_id"]
        remaining_assignments = get_data("issue_assignments", {"issue_id": issue_id})
        
        if not remaining_assignments:
            update_data("issues", {"id": issue_id}, {"status": "pending"})
        
        logger.info(f"Assignment {assignment_id} deleted by {current_user['profile']['id']}")
        return BaseResponse(success=True, message="Assignment deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete assignment {assignment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete assignment"
        )


@router.post("/bulk-assign", response_model=BulkOperationResponse)
async def bulk_assign_issues(
    bulk_request: BulkAssignRequest,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Assign multiple issues to a staff member."""
    try:
        user_role = current_user["profile"]["role"]
        user_id = current_user["profile"]["id"]
        
        # Validate staff member
        staff = get_data("profiles", {"id": bulk_request.staff_id})
        if not staff or staff[0].get("role") != "staff":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found"
            )
        
        staff_member = staff[0]
        
        # Check department permissions for supervisors
        if user_role == "supervisor":
            user_department = current_user["profile"]["department"]
            staff_department = staff_member.get("department")
            
            if user_department != staff_department:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot assign to staff outside your department"
                )
        
        processed = 0
        failed = 0
        errors = []
        
        for issue_id in bulk_request.issue_ids:
            try:
                # Check if issue exists
                issues = get_data("issues", {"id": issue_id})
                if not issues:
                    errors.append(f"Issue {issue_id} not found")
                    failed += 1
                    continue
                
                # Check if already assigned
                existing = get_data("issue_assignments", {
                    "issue_id": issue_id,
                    "staff_id": bulk_request.staff_id,
                    "status": ["assigned", "in_progress"]
                })
                
                if existing:
                    errors.append(f"Issue {issue_id} already assigned to this staff member")
                    failed += 1
                    continue
                
                # Create assignment
                assignment_data = {
                    "issue_id": issue_id,
                    "staff_id": bulk_request.staff_id,
                    "assigned_by": user_id,
                    "notes": bulk_request.notes
                }
                
                result = insert_data("issue_assignments", assignment_data)
                if result:
                    # Update issue status
                    issue = issues[0]
                    if issue["status"] == "pending":
                        update_data("issues", {"id": issue_id}, {"status": "in_progress"})
                    processed += 1
                else:
                    errors.append(f"Failed to create assignment for issue {issue_id}")
                    failed += 1
                    
            except Exception as e:
                errors.append(f"Issue {issue_id}: {str(e)}")
                failed += 1
        
        logger.info(f"Bulk assignment: {processed} successful, {failed} failed by {user_id}")
        return BulkOperationResponse(
            success=True,
            message=f"Bulk assignment completed: {processed} successful, {failed} failed",
            processed=processed,
            failed=failed,
            errors=errors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to bulk assign issues: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk assign issues"
        )


@router.get("/stats/department")
async def get_department_assignment_stats(
    department: Optional[str] = Query(None, description="Department filter"),
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Get assignment statistics by department."""
    try:
        user_role = current_user["profile"]["role"]
        
        # Filter by department for supervisors
        if user_role == "supervisor":
            department = current_user["profile"]["department"]
        
        # Get staff in department(s)
        filters = {"role": "staff"}
        if department:
            filters["department"] = department
        
        staff_members = get_data("profiles", filters=filters)
        staff_ids = [s["id"] for s in staff_members]
        
        if not staff_ids:
            return {
                "department": department,
                "total_staff": 0,
                "assignment_stats": {
                    "total_assignments": 0,
                    "assigned": 0,
                    "in_progress": 0,
                    "completed": 0
                },
                "staff_workload": []
            }
        
        # Get all assignments for these staff members
        all_assignments = get_data("issue_assignments", {"staff_id": staff_ids})
        
        # Calculate stats
        assignment_stats = {
            "total_assignments": len(all_assignments),
            "assigned": len([a for a in all_assignments if a["status"] == "assigned"]),
            "in_progress": len([a for a in all_assignments if a["status"] == "in_progress"]),
            "completed": len([a for a in all_assignments if a["status"] == "completed"])
        }
        
        # Calculate individual staff workload
        staff_workload = []
        for staff in staff_members:
            staff_assignments = [a for a in all_assignments if a["staff_id"] == staff["id"]]
            staff_workload.append({
                "staff_id": staff["id"],
                "name": staff.get("full_name", "Unknown"),
                "total_assignments": len(staff_assignments),
                "active_assignments": len([a for a in staff_assignments if a["status"] in ["assigned", "in_progress"]]),
                "completed_assignments": len([a for a in staff_assignments if a["status"] == "completed"])
            })
        
        return {
            "department": department or "All Departments",
            "total_staff": len(staff_members),
            "assignment_stats": assignment_stats,
            "staff_workload": sorted(staff_workload, key=lambda x: x["active_assignments"], reverse=True)
        }
        
    except Exception as e:
        logger.error(f"Failed to get department assignment stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch department statistics"
        )


@router.get("/stats/workload")
async def get_workload_distribution(
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Get workload distribution across staff members."""
    try:
        user_role = current_user["profile"]["role"]
        
        # Get staff members based on role
        if user_role == "supervisor":
            user_department = current_user["profile"]["department"]
            staff_members = get_data("profiles", {"role": "staff", "department": user_department})
        else:
            staff_members = get_data("profiles", {"role": "staff"})
        
        if not staff_members:
            return {
                "total_staff": 0,
                "avg_workload": 0,
                "workload_distribution": []
            }
        
        workload_data = []
        total_active_assignments = 0
        
        for staff in staff_members:
            # Get active assignments
            active_assignments = get_data("issue_assignments", {
                "staff_id": staff["id"],
                "status": ["assigned", "in_progress"]
            })
            
            total_assignments = get_data("issue_assignments", {"staff_id": staff["id"]})
            completed_assignments = get_data("issue_assignments", {
                "staff_id": staff["id"],
                "status": "completed"
            })
            
            active_count = len(active_assignments)
            total_active_assignments += active_count
            
            workload_data.append({
                "staff_id": staff["id"],
                "name": staff.get("full_name", "Unknown"),
                "department": staff.get("department", "Unknown"),
                "active_assignments": active_count,
                "total_assignments": len(total_assignments),
                "completed_assignments": len(completed_assignments),
                "completion_rate": round(
                    (len(completed_assignments) / len(total_assignments) * 100) if total_assignments else 0, 
                    1
                )
            })
        
        avg_workload = round(total_active_assignments / len(staff_members), 1) if staff_members else 0
        
        # Sort by active assignments (highest first)
        workload_data.sort(key=lambda x: x["active_assignments"], reverse=True)
        
        return {
            "total_staff": len(staff_members),
            "total_active_assignments": total_active_assignments,
            "avg_workload": avg_workload,
            "workload_distribution": workload_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get workload distribution: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workload distribution"
        )