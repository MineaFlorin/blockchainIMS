// import 'dart:convert';
// import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';
// import 'http_service.dart';
// import 'qr_display_screen.dart'; // Import the QRDisplayScreen
//
// void main() {
//   runApp(const mobileQR_IMS());
// }
//
// class mobileQR_IMS extends StatelessWidget {
//   const mobileQR_IMS({super.key});
//
//   @override
//   Widget build(BuildContext context) {
//     return const MaterialApp(
//       debugShowCheckedModeBanner: false,
//       home: QRCodeScreen(),
//     );
//   }
// }
//
// class QRCodeScreen extends StatefulWidget {
//   const QRCodeScreen({super.key});
//
//   @override
//   _QRCodeScreenState createState() => _QRCodeScreenState();
// }
//
// class _QRCodeScreenState extends State<QRCodeScreen> {
//   List<Map<String, dynamic>> qrCodes = [];
//   final HttpService httpService = HttpService();
//
//   @override
//   void initState() {
//     super.initState();
//     loadQRData();
//   }
//
//   void loadQRData() async {
//     try {
//       final jsonString = await rootBundle.loadString('assets/qrcodes.txt');
//       final jsonData = json.decode(jsonString) as List<dynamic>;
//       setState(() {
//         qrCodes = jsonData.map((e) => e as Map<String, dynamic>).toList();
//       });
//     } catch (e) {
//       print('Error loading QR data: $e');
//     }
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: const Text('QR Code Reader')),
//       body: qrCodes.isEmpty
//           ? const Center(child: CircularProgressIndicator())
//           : ListView.builder(
//         itemCount: qrCodes.length,
//         itemBuilder: (context, index) {
//           final item = qrCodes[index];
//           final String itemId = item['itemId'] ?? 'Unknown ID';
//           final String itemName = item['itemName'] ?? 'Unknown Name';
//           final String qrCodeBase64 = item['qrCodeBase64'] ?? '';
//
//           final String shortItemId = itemId.length > 10
//               ? '${itemId.substring(0, 5)}...${itemId.substring(itemId.length - 5)}'
//               : itemId;
//
//           return Padding(
//             padding: const EdgeInsets.symmetric(
//                 vertical: 8.0, horizontal: 16.0),
//             child: Card(
//               elevation: 4.0,
//               child: Padding(
//                 padding: const EdgeInsets.all(8.0),
//                 child: Row(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     // QR code image
//                     if (qrCodeBase64.isNotEmpty)
//                       Image.memory(
//                         base64Decode(
//                             qrCodeBase64.split(',').last.trim()),
//                         height: 100,
//                         width: 100,
//                         fit: BoxFit.contain,
//                       )
//                     else
//                       const SizedBox(
//                         height: 100,
//                         width: 100,
//                         child: Center(
//                           child: Text(
//                             'No QR\nImage',
//                             textAlign: TextAlign.center,
//                             style: TextStyle(color: Colors.grey),
//                           ),
//                         ),
//                       ),
//                     const SizedBox(width: 16),
//                     // Details and button
//                     Expanded(
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         children: [
//                           Text(
//                             'QR Code ${index + 1}',
//                             style: const TextStyle(
//                                 fontWeight: FontWeight.bold),
//                           ),
//                           Text(
//                             'ID: $shortItemId',
//                             style:
//                             TextStyle(color: Colors.grey[700]),
//                           ),
//                           Text(
//                             'Name: $itemName',
//                             style:
//                             TextStyle(color: Colors.grey[700]),
//                           ),
//                           const SizedBox(height: 10),
//                           ElevatedButton(
//                             onPressed: () async {
//                               try {
//                                 final response = await httpService
//                                     .sendQRCode(itemId, itemName,
//                                     qrCodeBase64);
//
//                                 if (response.statusCode == 200) {
//                                   Navigator.push(
//                                     context,
//                                     MaterialPageRoute(
//                                       builder: (context) =>
//                                           QRDisplayScreen(
//                                             responseBody: response.body,
//                                           ),
//                                     ),
//                                   );
//                                   print(
//                                       'Successful fetch history: ${response.body}');
//                                 } else {
//                                   print(
//                                       'Failed to fetch history: ${response.body}');
//                                 }
//                               } catch (e) {
//                                 print('Error fetching history: $e');
//                               }
//                             },
//                             child: const Text('Item History'),
//                           ),
//                         ],
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           );
//         },
//       ),
//     );
//   }
// }

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'http_service.dart';
import 'qr_display_screen.dart'; // Import the QRDisplayScreen

void main() {
  runApp(const mobileQR_IMS());

  // Trigger the test on app startup
  runTest();
}

// This will execute the test method automatically when the app starts
void runTest() {
  test('Test API and display data in terminal', () async {
    // Initialize the HttpService instance (use the real HttpService).
    final httpService = HttpService(); // Replace with your actual service instance.

    // Item data to send (Updated with the actual itemId you want to test)
    String itemId = '5c99a7fa0f6e35a58f26b76bb4001a2b';  // This is the item you want to test
    String itemName = 'Dell Desktop Revision Seventh';
    String qrCodeBase64 = ''; // Can be an empty string or an actual base64 string.

    Stopwatch stopwatch = Stopwatch();
    stopwatch.start();

    // Call the API and fetch the response
    try {
      final response = await httpService.sendQRCode(itemId, itemName, qrCodeBase64);

      stopwatch.stop(); // Stop stopwatch after receiving the response
      final responseTime = stopwatch.elapsedMilliseconds;

      if (response.statusCode == 200) {
        // Decode the response and print it in the terminal
        Map<String, dynamic> responseData = json.decode(response.body);

        // Print the response in pretty format
        print('API Response for Item ID: $itemId');
        print(jsonEncode(responseData));

        // Print specific data (such as history)
        print('Item ID: ${responseData['itemId']}');
        print('History: ${responseData['history']}');

        // Print performance metrics
        print('Response Time for $itemId: ${responseTime}ms');
        print('Successful fetch for Item ID: $itemId');
      } else {
        print('Failed to fetch data for Item ID: $itemId: ${response.body}');
      }
    } catch (e) {
      print('Error fetching data for Item ID: $itemId: $e');
    }
  });
}

class mobileQR_IMS extends StatelessWidget {
  const mobileQR_IMS({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: QRCodeScreen(),
    );
  }
}

class QRCodeScreen extends StatefulWidget {
  const QRCodeScreen({super.key});

  @override
  _QRCodeScreenState createState() => _QRCodeScreenState();
}

class _QRCodeScreenState extends State<QRCodeScreen> {
  List<Map<String, dynamic>> qrCodes = [];
  final HttpService httpService = HttpService();

  @override
  void initState() {
    super.initState();
    loadQRData();
  }

  void loadQRData() async {
    try {
      final jsonString = await rootBundle.loadString('assets/qrcodes.txt');
      final jsonData = json.decode(jsonString) as List<dynamic>;
      setState(() {
        qrCodes = jsonData.map((e) => e as Map<String, dynamic>).toList();
      });
    } catch (e) {
      print('Error loading QR data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QR Code Reader')),
      body: qrCodes.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
        itemCount: qrCodes.length,
        itemBuilder: (context, index) {
          final item = qrCodes[index];
          final String itemId = item['itemId'] ?? 'Unknown ID';
          final String itemName = item['itemName'] ?? 'Unknown Name';
          final String qrCodeBase64 = item['qrCodeBase64'] ?? '';

          final String shortItemId = itemId.length > 10
              ? '${itemId.substring(0, 5)}...${itemId.substring(itemId.length - 5)}'
              : itemId;

          return Padding(
            padding: const EdgeInsets.symmetric(
                vertical: 8.0, horizontal: 16.0),
            child: Card(
              elevation: 4.0,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // QR code image
                    if (qrCodeBase64.isNotEmpty)
                      Image.memory(
                        base64Decode(
                            qrCodeBase64.split(',').last.trim()),
                        height: 100,
                        width: 100,
                        fit: BoxFit.contain,
                      )
                    else
                      const SizedBox(
                        height: 100,
                        width: 100,
                        child: Center(
                          child: Text(
                            'No QR\nImage',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                      ),
                    const SizedBox(width: 16),
                    // Details and button
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'QR Code ${index + 1}',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'ID: $shortItemId',
                            style:
                            TextStyle(color: Colors.grey[700]),
                          ),
                          Text(
                            'Name: $itemName',
                            style:
                            TextStyle(color: Colors.grey[700]),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () async {
                              try {
                                final response = await httpService
                                    .sendQRCode(itemId, itemName,
                                    qrCodeBase64);

                                if (response.statusCode == 200) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          QRDisplayScreen(
                                            responseBody: response.body,
                                          ),
                                    ),
                                  );
                                  print(
                                      'Successful fetch history: ${response.body}');
                                } else {
                                  print(
                                      'Failed to fetch history: ${response.body}');
                                }
                              } catch (e) {
                                print('Error fetching history: $e');
                              }
                            },
                            child: const Text('Item History'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
