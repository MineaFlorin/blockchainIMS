import 'dart:convert'; // Provides utilities for encoding and decoding JSON.
import 'package:http/http.dart' as http; // Provides tools for making HTTP requests.

class HttpService {
  // Base URL for the client Node.js backend API to connect mobile app
  final String baseUrl = 'http://10.0.2.2:3001';

  // Method to send a QR code, along with an item ID and name, to the server.
  Future<http.Response> sendQRCode(
      String itemId, String itemName, String qrCodeBase64) async {

    // Construct the full URL for the client Node.js backend API to connect mobile app
    final url = Uri.parse('$baseUrl/api/mobile/history');

    try {
      // Send a POST request from the mobile app to Node.js backend API
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'}, // Specify that the content is JSON.
        body: json.encode({
          'itemId': itemId, // Item identifier.
          'itemName': itemName, // Name of the item.
          'qrCode': qrCodeBase64, // The QR code as a Base64-encoded string.
        }),
      );

      // Return the response for further processing
      return response;
    }


    catch (e) {
      // Log the error for debugging purposes.
      print('Error sending data: $e');

      // Rethrow the error so it can be handled by the calling method.
      rethrow;
    }
  }
}
