// src/screens/CameraReportScreen.js
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { StorageService } from '../../utils/storage';

const API_BASE_URL = 'http://192.168.1.103:8000/api'; // Replace with your backend URL

// Categories matching your backend
const categories = [
  { value: 'roads', label: 'Roads & Infrastructure' },
  { value: 'waste', label: 'Waste Management' },
  { value: 'water', label: 'Water & Drainage' },
  { value: 'streetlight', label: 'Street Lighting' },
  { value: 'other', label: 'Other' }
];

export default function CameraReportScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [location, setLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Get location permissions and current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let locationResult = await Location.getCurrentPositionAsync({});
        setCurrentLocation(locationResult);
        // Set a default location string (you'll replace this with reverse geocoding later)
        setLocation(`${locationResult.coords.latitude.toFixed(6)}, ${locationResult.coords.longitude.toFixed(6)}`);
      }
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        console.log('📷 Photo taken:', photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  }

  function retakePicture() {
    setCapturedImage(null);
  }

  async function submitReport() {
    console.log('🔄 Starting report submission with image...');

    if (!capturedImage) {
      Alert.alert('Error', 'Please take a photo before submitting.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please provide a title for the issue.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token
      const token = await StorageService.getAuthToken();
      console.log('🔑 Auth token retrieved successfully');

      if (!token) {
        Alert.alert('Error', 'Please log in again.');
        router.replace('/(auth)/login');
        return;
      }

      // Step 1: Upload image
      console.log('📷 Uploading image to Supabase...');
      const formData = new FormData();
      formData.append('file', {
        uri: capturedImage,
        type: 'image/jpeg',
        name: 'issue_image.jpg',
      });
      formData.append('compress', 'true');

      const imageResponse = await fetch(`${API_BASE_URL}/files/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📷 Image upload response status:', imageResponse.status);

      if (!imageResponse.ok) {
        const errorData = await imageResponse.text();
        console.error('Image upload failed:', errorData);
        throw new Error('Failed to upload image');
      }

      const imageData = await imageResponse.json();
      console.log('✅ Image uploaded successfully:', imageData.file_url);

      // Step 2: Create issue with image URL
      const issueData = {
        title: title.trim(),
        description: description.trim(),
        category: category,
        image_url: imageData.file_url, // Use image_url not image_urls
        latitude: currentLocation?.coords.latitude || null,
        longitude: currentLocation?.coords.longitude || null,
        location_description: location.trim() || null,
        priority: 'medium',
        status: 'pending',
        upvotes: 0
      };

      console.log('📝 Creating issue with data:', issueData);

      const issueResponse = await fetch(`${API_BASE_URL}/issues/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      console.log('📝 Issue creation response status:', issueResponse.status);

      if (!issueResponse.ok) {
        const errorData = await issueResponse.text();
        console.error('Issue creation failed:', errorData);
        throw new Error('Failed to create issue');
      }

      const createdIssue = await issueResponse.json();
      console.log('✅ Issue created successfully:', createdIssue);

      Alert.alert(
        'Success!', 
        'Your report has been submitted successfully. You will receive updates on its progress.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setCapturedImage(null);
              setTitle('');
              setDescription('');
              setCategory('roads');
              // Keep location as it might be the same
              router.push('/(tabs)/my-reports'); // Navigate to my reports
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (capturedImage) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Issue Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Brief title describing the issue"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <TouchableOpacity 
                style={styles.categoryButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.categoryButtonText}>
                  {categories.find(cat => cat.value === category)?.label || 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.categoryDropdown}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={styles.categoryOption}
                      onPress={() => {
                        setCategory(cat.value);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.categoryOptionText}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe the issue in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter location details"
                value={location}
                onChangeText={setLocation}
              />
              {currentLocation && (
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <Text style={styles.locationText}>
                    GPS: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={submitReport}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Report Issue</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.controlButton}>
              {/* Empty space for alignment */}
            </View>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.controlButton}>
              {/* Empty space for alignment */}
            </View>
          </View>

          <Text style={styles.instructionText}>
            Position the issue in the frame and tap the capture button
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  capturedImage: {
    width: '100%',
    height: 250,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  formFields: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  categoryDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    maxHeight: 200,
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 100,
    textAlignVertical: 'top',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});