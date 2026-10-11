
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const API_URL =
  'https://cart-detective-api.ceemacdee.workers.dev/';

export default function App() {
  const [store, setStore] = useState('');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');

  async function runAudit() {
    if (!store.trim() || !product.trim()) {
      setReport('Enter your store name and product first.');
      return;
    }

    setLoading(true);
    setReport('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            storeName: store,
            name: product,
            price: price,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'The audit request failed.');
      }

      setReport(
        typeof data.audit === 'string'
          ? data.audit
          : typeof data.report === 'string'
          ? data.report
          : JSON.stringify(data.report || data, null, 2)
      );
    } catch (error) {
      setReport(`Error: ${error.message}\n\nDetails: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>CART DETECTIVE</Text>
        <Text style={styles.title}>Find the leaks.</Text>
        <Text style={styles.subtitle}>
          AI-powered analysis for your online store.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>STORE NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. My Shopify store"
            placeholderTextColor="#85899a"
            value={store}
            onChangeText={setStore}
          />

          <Text style={styles.label}>PRODUCT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Strawberry plush"
            placeholderTextColor="#85899a"
            value={product}
            onChangeText={setProduct}
          />

          <Text style={styles.label}>PRODUCT PRICE (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 19.95 AUD"
            placeholderTextColor="#85899a"
            value={price}
            onChangeText={setPrice}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={runAudit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Run AI Audit →</Text>
            )}
          </TouchableOpacity>
        </View>

        {report !== '' && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>YOUR AUDIT</Text>
            <Text style={styles.reportText}>{report}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          CART DETECTIVE · AI STORE ANALYSIS
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { padding: 22, paddingTop: 38 },
  brand: {
    color: '#6257e8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#17182b',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 15,
  },
  subtitle: {
    color: '#696d80',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 26,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 19,
    borderWidth: 1,
    borderColor: '#e7e8f0',
  },
  label: {
    color: '#55596d',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 13,
  },
  input: {
    backgroundColor: '#f7f7fb',
    borderWidth: 1,
    borderColor: '#e5e6ef',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 15,
    color: '#17182b',
  },
  button: {
    backgroundColor: '#6257e8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 23,
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  reportCard: {
    backgroundColor: '#ffffff',
    padding: 19,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e7e8f0',
  },
  reportTitle: {
    color: '#6257e8',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 12,
  },
  reportText: { color: '#292b40', fontSize: 14, lineHeight: 23 },
  footer: {
    textAlign: 'center',
    color: '#85899a',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 20,
  },
});

