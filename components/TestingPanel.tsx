/**
 * Testing Panel Component
 * Provides UI for running Step 16 tests during development
 * Only included in development builds
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppTheme } from '../theme/AppTheme';
import { runStep16Tests, generateStep16Report } from '../tests/testRunner';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

export const TestingPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);
    
    try {
      console.log('🧪 Starting Step 16 tests from UI...');
      const report = await runStep16Tests();
      
      const results = report.suiteResults.map(suite => ({
        suite: suite.suite,
        passed: suite.passed,
        failed: suite.failed,
        warnings: suite.warnings,
        total: suite.total
      }));
      
      setTestResults(results);
      setSummary(report.summary);
      
      Alert.alert(
        'Tests Complete',
        `${report.summary.totalPassed}/${report.summary.totalTests} tests passed (${report.summary.overallSuccessRate}% success rate)`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Test execution failed:', error);
      Alert.alert('Test Error', `Failed to run tests: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const generateReport = async () => {
    try {
      const markdownReport = await generateStep16Report();
      console.log('\n📄 FULL TEST REPORT:');
      console.log(markdownReport);
      
      Alert.alert(
        'Report Generated',
        'Full test report has been output to console. Check your development console for details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Report Error', `Failed to generate report: ${error.message}`);
    }
  };

  if (__DEV__ === false) {
    // Only show in development builds
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Step 16: Testing & Validation</Text>
        <Text style={styles.subtitle}>WebView Metronome Test Suite</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '⏳ Running Tests...' : '▶️ Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={generateReport}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>📄 Generate Report</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>📊 Test Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalTests}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.passedText]}>{summary.totalPassed}</Text>
              <Text style={styles.summaryLabel}>Passed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.failedText]}>{summary.totalFailed}</Text>
              <Text style={styles.summaryLabel}>Failed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.warningText]}>{summary.totalWarnings}</Text>
              <Text style={styles.summaryLabel}>Warnings</Text>
            </View>
          </View>
          <View style={styles.successRateContainer}>
            <Text style={styles.successRate}>
              Success Rate: {summary.overallSuccessRate}%
            </Text>
          </View>
        </View>
      )}

      {testResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>🧪 Test Suite Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.suiteName}>{result.suite}</Text>
              <View style={styles.resultStats}>
                <Text style={[styles.stat, styles.passedText]}>✅ {result.passed}</Text>
                <Text style={[styles.stat, styles.failedText]}>❌ {result.failed}</Text>
                <Text style={[styles.stat, styles.warningText]}>⚠️ {result.warnings}</Text>
                <Text style={styles.stat}>📊 {result.total}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Check console for detailed test output and logs
        </Text>
        <Text style={styles.footerText}>
          📱 Manual device testing still required
        </Text>
      </View>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: AppTheme.colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppTheme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AppTheme.colors.icon,
    textAlign: 'center',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: AppTheme.colors.accent,
  },
  secondaryButton: {
    backgroundColor: AppTheme.colors.icon,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: AppTheme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppTheme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: AppTheme.colors.icon,
    marginTop: 4,
  },
  successRateContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.icon + '30',
  },
  successRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppTheme.colors.accent,
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: AppTheme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppTheme.colors.text,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppTheme.colors.icon + '20',
  },
  suiteName: {
    fontSize: 14,
    color: AppTheme.colors.text,
    flex: 1,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    fontSize: 12,
    fontWeight: '600',
  },
  passedText: {
    color: '#4CAF50', // Green
  },
  failedText: {
    color: '#F44336', // Red
  },
  warningText: {
    color: '#FF9800', // Orange
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.icon + '30',
  },
  footerText: {
    fontSize: 12,
    color: AppTheme.colors.icon,
    textAlign: 'center',
    marginBottom: 4,
  },
};