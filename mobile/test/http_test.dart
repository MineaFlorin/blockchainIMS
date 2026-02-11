// import 'dart:convert';
// import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';
// import 'package:flutter_test/flutter_test.dart';
// import 'package:http/http.dart' as http;
// import 'package:qr_code_reader/http_service.dart';
//
// void main() {
//   test('Send concurrent requests for the actual assets', () async {
//     // Initialize the HttpService instance
//     final httpService = HttpService();
//
//     // Load the QR codes from assets
//     List<Map<String, dynamic>> qrCodes = [];
//     try {
//       final jsonString = await rootBundle.loadString('assets/qrcodes.txt');
//       final jsonData = json.decode(jsonString) as List<dynamic>;
//       qrCodes = jsonData.map((e) => e as Map<String, dynamic>).toList();
//     } catch (e) {
//       print('Error loading QR data: $e');
//       return;
//     }
//
//     // Create a list of Future requests for concurrent execution
//     List<Future> requestFutures = [];
//     for (var item in qrCodes) {
//       final String itemId = item['itemId'] ?? 'Unknown ID';
//       final String itemName = item['itemName'] ?? 'Unknown Name';
//       final String qrCodeBase64 = item['qrCodeBase64'] ?? '';
//
//       // Adding each request to the list of Futures
//       requestFutures.add(
//         httpService.sendQRCode(itemId, itemName, qrCodeBase64).then((response) {
//           if (response.statusCode == 200) {
//             // Decode and print the response if successful
//             Map<String, dynamic> responseData = json.decode(response.body);
//             print('API Response for Item ID: $itemId');
//             print(jsonEncode(responseData)); // Print the response in pretty format
//             print('Item ID: ${responseData['itemId']}');
//             print('History: ${responseData['history']}');
//           } else {
//             print('Failed to fetch data for Item ID: $itemId: ${response.body}');
//           }
//         }).catchError((e) {
//           print('Error sending data for Item ID: $itemId: $e');
//         }),
//       );
//     }
//
//     // Wait for all requests to complete
//     await Future.wait(requestFutures);
//
//     print('All requests completed.');
//   });
// }

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:qr_code_reader/http_service.dart';

void main() {
  test('Send concurrent requests for the actual assets', () async {
    // Initialize the HttpService instance
    final httpService = HttpService();

    // Load the QR codes from assets
    List<Map<String, dynamic>> qrCodes = [];
    try {
      final jsonString = await rootBundle.loadString('assets/qrcodes.txt');
      final jsonData = json.decode(jsonString) as List<dynamic>;
      qrCodes = jsonData.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      print('Error loading QR data: $e');
      return;
    }

    // Metrics for performance tracking
    int totalRequests = 0;
    int successfulResponses = 0;
    int failedResponses = 0;
    int totalResponseTime = 0; // in milliseconds
    int minResponseTime = double.maxFinite.toInt();
    int maxResponseTime = 0;

    // Create a list of Future requests for concurrent execution
    List<Future> requestFutures = [];

    // Filter or update to use specific Item ID
    String targetItemId = '5c99a7fa0f6e35a58f26b76bb4001a2b';  // Use the specific itemId you want

    for (var item in qrCodes) {
      final String itemId = item['itemId'] ?? 'Unknown ID';
      if (itemId != targetItemId) continue; // Skip the other items

      final String itemName = item['itemName'] ?? 'Unknown Name';
      final String qrCodeBase64 = item['qrCodeBase64'] ?? '';

      totalRequests++;
      final stopwatch = Stopwatch()..start();

      // Send request for the current item
      requestFutures.add(
        httpService.sendQRCode(itemId, itemName, qrCodeBase64).then((response) {
          stopwatch.stop();
          final responseTime = stopwatch.elapsedMilliseconds;
          totalResponseTime += responseTime;
          minResponseTime = responseTime < minResponseTime ? responseTime : minResponseTime;
          maxResponseTime = responseTime > maxResponseTime ? responseTime : maxResponseTime;

          if (response.statusCode == 200) {
            successfulResponses++;
            // Decode and print the response if successful
            Map<String, dynamic> responseData = json.decode(response.body);
            print('API Response for Item ID: $itemId');
            print(jsonEncode(responseData)); // Print the response in pretty format
            print('Item ID: ${responseData['itemId']}');
            print('History: ${responseData['history']}');
          } else {
            failedResponses++;
            print('Failed to fetch data for Item ID: $itemId: ${response.body}');
          }
        }).catchError((e) {
          failedResponses++;
          print('Error sending data for Item ID: $itemId: $e');
        }),
      );
    }

    // Wait for all requests to complete
    await Future.wait(requestFutures);

    // Calculate metrics
    final averageResponseTime =
    totalRequests > 0 ? (totalResponseTime / totalRequests).toStringAsFixed(2) : 'N/A';

    // Print summary of results
    print('--- Performance Metrics ---');
    print('Total Requests Sent: $totalRequests');
    print('Successful Responses: $successfulResponses');
    print('Failed Responses: $failedResponses');
    print('Min Response Time: ${minResponseTime}ms');
    print('Max Response Time: ${maxResponseTime}ms');
    print('Average Response Time: $averageResponseTime ms');
    print('All requests completed.');
  });
}
