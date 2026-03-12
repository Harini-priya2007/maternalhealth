/**
 * Cardiovascular PPG Analyzer (Placeholder)
 * 
 * This file will be replaced with your friend's custom ML model.
 * Keep the same function signature for seamless integration.
 */

class CardioAnalyzer {
  /**
   * Analyze PPG signal for cardiovascular health
   * @param {Array<number>} ppgSignal - PPG waveform data
   * @param {number} samplingRate - Sampling rate in Hz (default: 50)
   * @returns {Object} Cardiovascular metrics
   */
  static analyzePPG(ppgSignal, samplingRate = 50) {
    if (!ppgSignal || ppgSignal.length === 0) {
      throw new Error('Invalid PPG signal');
    }

    try {
      // Extract heart rate from PPG signal
      const heartRate = this.extractHeartRate(ppgSignal, samplingRate);
      
      // Estimate blood pressure from signal characteristics
      const { systolic, diastolic } = this.estimateBloodPressure(ppgSignal);
      
      // Estimate oxygen saturation
      const spO2 = this.estimateSpO2(ppgSignal);
      
      // Calculate signal quality
      const signalQuality = this.calculateSignalQuality(ppgSignal);
      
      // Determine health status
      const status = this.classifyHealthStatus(heartRate, systolic, diastolic);

      return {
        heartRate: Math.round(heartRate),
        systolic: Math.round(systolic),
        diastolic: Math.round(diastolic),
        spO2: parseFloat(spO2.toFixed(1)),
        signalQuality: Math.round(signalQuality),
        status: status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cardiovascular analysis error:', error);
      throw error;
    }
  }

  /**
   * Extract heart rate from PPG signal using frequency analysis
   */
  static extractHeartRate(ppgSignal, samplingRate) {
    // Simple peak detection for beats
    let peaks = 0;
    const threshold = this.calculateThreshold(ppgSignal);

    for (let i = 1; i < ppgSignal.length - 1; i++) {
      if (
        ppgSignal[i] > ppgSignal[i - 1] &&
        ppgSignal[i] > ppgSignal[i + 1] &&
        ppgSignal[i] > threshold
      ) {
        peaks++;
      }
    }

    // Convert peaks to BPM
    const duration = (ppgSignal.length / samplingRate) / 60; // duration in minutes
    const bpm = peaks / duration;

    // Clamp to physiological range (40-200 BPM)
    return Math.max(40, Math.min(200, bpm));
  }

  /**
   * Estimate blood pressure from signal amplitude and characteristics
   */
  static estimateBloodPressure(ppgSignal) {
    const mean = this.calculateMean(ppgSignal);
    const amplitude = Math.max(...ppgSignal) - Math.min(...ppgSignal);
    const variance = this.calculateVariance(ppgSignal, mean);

    // Signal-based estimation (simplified)
    const amplitudeNorm = (amplitude / mean) * 100;
    
    // Systolic: 100 + (amplitude_normalized × 0.15)
    const systolic = 100 + (amplitudeNorm * 0.15) + (variance * 0.02);
    
    // Diastolic: 65 + (variance × 0.01)
    const diastolic = 65 + (variance * 0.01);

    return {
      systolic: Math.max(95, Math.min(160, systolic)),
      diastolic: Math.max(55, Math.min(105, diastolic))
    };
  }

  /**
   * Estimate peripheral oxygen saturation (SpO2)
   */
  static estimateSpO2(ppgSignal) {
    // Base measurement + variation based on signal properties
    const mean = this.calculateMean(ppgSignal);
    const std = Math.sqrt(this.calculateVariance(ppgSignal, mean));
    const ratio = std / mean;

    // SpO2 typically 95-100% at sea level
    const baseSpO2 = 97;
    const adjustment = (ratio - 0.1) * 10; // Adjust based on signal variability

    return Math.max(92, Math.min(100, baseSpO2 - adjustment));
  }

  /**
   * Calculate overall signal quality score (0-100%)
   */
  static calculateSignalQuality(ppgSignal) {
    try {
      // Check for signal stability
      const mean = this.calculateMean(ppgSignal);
      const variance = this.calculateVariance(ppgSignal, mean);
      const std = Math.sqrt(variance);
      
      // Coefficient of variation (lower is better)
      const cv = (std / mean) * 100;
      
      // Quality score: 100 - (CV × 3)
      // Good PPG signals have CV ~10-15%
      const qualityScore = Math.max(0, Math.min(100, 100 - (cv * 1.5)));

      return qualityScore;
    } catch (error) {
      return 50; // Default quality if calculation fails
    }
  }

  /**
   * Classify cardiovascular health status
   */
  static classifyHealthStatus(heartRate, systolic, diastolic) {
    // Elevated heart rate
    if (heartRate > 100) return 'Elevated HR';
    if (heartRate < 60) return 'Low HR';

    // High blood pressure
    if (systolic > 130 || diastolic > 85) return 'Elevated BP';

    // Normal range
    return 'Normal';
  }

  /**
   * Helper: Calculate mean of array
   */
  static calculateMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Helper: Calculate variance
   */
  static calculateVariance(arr, mean) {
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  /**
   * Helper: Calculate signal threshold
   */
  static calculateThreshold(arr) {
    const mean = this.calculateMean(arr);
    const variance = this.calculateVariance(arr, mean);
    return mean + Math.sqrt(variance) * 0.5;
  }

  /**
   * Generate sample PPG signal for testing
   */
  static generateSampleSignal(length = 256) {
    const signal = [];
    const baseFrequency = 1.2; // Normal heart rate ~72 BPM
    const noiseLevel = 0.15;

    for (let i = 0; i < length; i++) {
      const t = i / 50;
      const pulse = Math.sin(2 * Math.PI * baseFrequency * t);
      const noise = (Math.random() - 0.5) * noiseLevel;
      signal.push(100 + pulse * 50 + noise * 30);
    }

    return signal;
  }
}

module.exports = CardioAnalyzer;
