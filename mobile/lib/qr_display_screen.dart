import 'dart:convert';
import 'package:flutter/material.dart';

class QRDisplayScreen extends StatelessWidget {
  final String responseBody;

  const QRDisplayScreen({super.key, required this.responseBody});

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic> responseData = {};

    // Decode response body safely
    try {
      responseData = json.decode(responseBody);
    } catch (e) {
      print('Error parsing response body: $e');
    }

    // Extract top-level information
    final String itemId = responseData['itemId'] ?? 'Unknown ID';
    final List<dynamic> revisions = responseData['history']['updates'] ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('QR Code History')),
      body: responseData.isEmpty
          ? const Center(
        child: Text(
          'No data available',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      )
          : Padding(
        padding: const EdgeInsets.all(12.0),
        child: ListView(
          children: [
            // General Title and Static ID
            const Center(
              child: Text(
                'HISTORY',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Item ID: $itemId',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Revisions as individual cards
            ...revisions.map((revision) {
              final String revisionId = revision['_rev'] ?? 'Unknown Revision';
              final String timestamp = revision['timestamp'] ?? 'No Timestamp';
              final Map<String, dynamic> changes =
              (revision['changes'] ?? {}) as Map<String, dynamic>;

              return Card(
                elevation: 2.0,
                margin: const EdgeInsets.symmetric(vertical: 5.0),
                child: Padding(
                  padding: const EdgeInsets.only(left: 12.0, right: 12.0, top: 4.0, bottom: 4.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Revision ID: $revisionId',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Timestamp: $timestamp',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Changes:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      ...changes.entries.map((entry) {
                        final String key = entry.key;
                        final dynamic value = entry.value;

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$key: ',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 12,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  value.toString(),
                                  style: const TextStyle(
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

