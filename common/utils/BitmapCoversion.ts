import { Buffer } from 'buffer';
import RNFS from 'react-native-fs';
import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';

/**
 * Convert raw fingerprint data to a displayable image in React Native
 * Using only available packages
 */
export const convertToBitmap = async (data: Uint8Array | Buffer): Promise<string> => {
  try {
    // Dimensions - adjust based on your scanner's specifications
    const width = 256;
    const height = 288;

    // Create BMP file from scratch
    // Create pixel data buffer (BMP uses BGRA format)
    const pixelData = Buffer.alloc(width * height * 4);

    // Fill the buffer with the fingerprint data (convert grayscale to BGRA)
    for (let i = 0; i < data.length && i < width * height; i++) {
      const value = data[i]; // Grayscale value
      const offset = i * 4;
      pixelData[offset] = value;     // B
      pixelData[offset + 1] = value; // G
      pixelData[offset + 2] = value; // R
      pixelData[offset + 3] = 255;   // Alpha
    }

    // Create BMP header (14 bytes) + DIB header (40 bytes)
    const fileSize = 54 + pixelData.length; // Header size + pixel data size
    const header = Buffer.alloc(54);

    // BMP signature
    header.write('BM', 0);
    // File size in bytes
    header.writeUInt32LE(fileSize, 2);
    // Reserved fields (zeros)
    header.writeUInt32LE(0, 6);
    // Offset to pixel data
    header.writeUInt32LE(54, 10);

    // DIB Header
    header.writeUInt32LE(40, 14);    // Header size
    header.writeInt32LE(width, 18);  // Width
    header.writeInt32LE(-height, 22); // Height (negative for top-down)
    header.writeUInt16LE(1, 26);     // Color planes
    header.writeUInt16LE(32, 28);    // Bits per pixel (32 for BGRA)
    header.writeUInt32LE(0, 30);     // No compression
    header.writeUInt32LE(pixelData.length, 34); // Image size
    header.writeInt32LE(2835, 38);   // Horizontal resolution (72 DPI)
    header.writeInt32LE(2835, 42);   // Vertical resolution (72 DPI)
    header.writeUInt32LE(0, 46);     // Color palette size
    header.writeUInt32LE(0, 50);     // All colors are important

    // Combine header and pixel data
    const bmpData = Buffer.concat([header, pixelData]);

    // Save the BMP to a temporary file
    const tempBmpPath = `${RNFS.CachesDirectoryPath}/fingerprint_${Date.now()}.bmp`;
    await RNFS.writeFile(tempBmpPath, bmpData.toString('base64'), 'base64');

    // Check if react-native-image-resizer is available and use it to convert BMP to PNG
    try {
      const ImageResizer = require('react-native-image-resizer');
      const processedImage = await ImageResizer.createResizedImage(
        `file://${tempBmpPath}`,
        width,
        height,
        'PNG',
        100, // quality
        0,   // rotation
        null, // output path (null = temp file)
      );
      console.log('=================Image Response===================');
      console.log(tempBmpPath)
      console.log('====================================');  
      // Delete the temporary BMP file
      await RNFS.unlink(tempBmpPath);

      return processedImage.uri;
    } catch (resizeError) {
      console.warn('Image resizing failed, returning BMP file:', resizeError);
      return `file://${tempBmpPath}`; // Return BMP path directly
    }
  } catch (error) {
    console.error('Error creating bitmap:', error);

    // Fallback: Create a base64 data URI of raw data
    // This won't display properly but helps with debugging
    const base64Data = Buffer.from(data).toString('base64');
    return `data:application/octet-stream;base64,${base64Data}`;
  }
};

/**
 * Alternative method using a simple native module
 * You would need to create this native module for your project
 */
const createFingerprintNativeModule = () => {
  // This is example code for what you would put in your native module
  // implementation (separate files)

  // Android (MainActivity.java or a custom module):
  /*
  // Create package: FingerprintImagePackage.java
  public class FingerprintImagePackage implements ReactPackage {
      @Override
      public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
          List<NativeModule> modules = new ArrayList<>();
          modules.add(new FingerprintImageModule(reactContext));
          return modules;
      }
      
      @Override
      public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
          return Collections.emptyList();
      }
  }
  
  // Create module: FingerprintImageModule.java
  public class FingerprintImageModule extends ReactContextBaseJavaModule {
      public FingerprintImageModule(ReactApplicationContext reactContext) {
          super(reactContext);
      }
      
      @Override
      public String getName() {
          return "FingerprintImageConverter";
      }
      
      @ReactMethod
      public void convertRawToImage(String base64Data, int width, int height, Promise promise) {
          try {
              byte[] rawData = Base64.decode(base64Data, Base64.DEFAULT);
              Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
              
              for (int y = 0; y < height; y++) {
                  for (int x = 0; x < width; x++) {
                      int index = y * width + x;
                      if (index < rawData.length) {
                          byte value = rawData[index];
                          int color = Color.rgb(value & 0xff, value & 0xff, value & 0xff);
                          bitmap.setPixel(x, y, color);
                      }
                  }
              }
              
              File outputFile = new File(getReactApplicationContext().getCacheDir(), 
                  "fingerprint_" + System.currentTimeMillis() + ".png");
              FileOutputStream fos = new FileOutputStream(outputFile);
              bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
              fos.close();
              
              promise.resolve(outputFile.getAbsolutePath());
          } catch (Exception e) {
              promise.reject("CONVERT_ERROR", e.getMessage());
          }
      }
  }
  */

  // iOS (would be implemented in Objective-C or Swift)
};

// Process the fingerprint response
export const processFingerprint = async (response: Buffer) => {
  try {
    // Check if the response starts with 'FT'
    if (response[0] !== 'F'.charCodeAt(0) || response[1] !== 'T'.charCodeAt(0)) {
      console.error("Invalid response format");
      return null;
    }

    // Extract the data portion
    const dataLength = response[5] + (response[6] << 8);
    const imageData = response.slice(7, 7 + dataLength);

    // Try to convert to an image
    return await convertToBitmap(imageData);
  } catch (error) {
    console.error("Failed to process fingerprint:", error);
    return null;
  }
};

// Fingerprint Scanner Component
// const FingerprintScanner = () => {
//   const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
//   const [isScanning, setIsScanning] = useState<boolean>(false);

//   const scanFingerprint = async () => {
//     try {
//       setIsScanning(true);

//       // Send command to get fingerprint data
//       const response = await sendCommand(CMD_GETCHAR);

//       if (response) {
//         console.log("Got response, processing...");
//         const imageUri = await processFingerprintResponse(response);
//         if (imageUri) {
//           setFingerprintImage(imageUri);
//           console.log("Fingerprint image created:", imageUri);
//         }
//       }
//     } catch (error) {
//       console.error("Scan error:", error);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   return (
//     <View style= { styles.container } >
//     <TouchableOpacity 
//         style={ styles.button }
//   onPress = { scanFingerprint }
//   disabled = { isScanning }
//     >
//     <Text style={ styles.buttonText }>
//       { isScanning? "Scanning...": "Scan Fingerprint" }
//       </Text>
//       </TouchableOpacity>

//   {
//     fingerprintImage && (
//       <View style={ styles.imageContainer }>
//         <Text style={ styles.label }> Fingerprint Image: </Text>
//           < Image
//     source = {{ uri: fingerprintImage }
//   }
//   style = { styles.fingerprintImage }
//   resizeMode = "contain"
//     />
//     </View>
//       )}
// </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   button: {
//     backgroundColor: '#2196F3',
//     padding: 15,
//     borderRadius: 5,
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   imageContainer: {
//     width: '100%',
//     alignItems: 'center',
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 5,
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 10,
//     fontWeight: 'bold',
//   },
//   fingerprintImage: {
//     width: 256,
//     height: 288,
//     backgroundColor: '#f0f0f0',
//   },
// });

// export default FingerprintScanner;