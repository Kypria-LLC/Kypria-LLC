/**
 * 👑 CREST ASSIGNMENT ENGINE
 * 
 * Determines sponsor tier based on pledge amount and source,
 * applying sacred tier mappings from the Living Canon.
 */

import { CrestTier, SponsorRecord } from '../models';
import fs from 'fs';
import path from 'path';

export class CrestAssignment {
  private tierConfig: TierConfig;

  constructor(configPath?: string) {
    const defaultPath = path.join(__dirname, '../../config/tier-mapping.json');
    const config = fs.readFileSync(configPath || defaultPath, 'utf8');
    this.tierConfig = JSON.parse(config);
  }

  /**
   * Determine crest tier based on amount and source
   */
  determineTier(amount: number, source: string): CrestTier {
    const sourceTiers = this.tierConfig[source];
    
    if (!sourceTiers) {
      throw new Error(`No tier configuration for source: ${source}`);
    }

    // Sort tiers by threshold descending
    const sortedTiers = sourceTiers.tiers
      .sort((a, b) => b.threshold - a.threshold);

    // Find first tier where amount meets threshold
    for (const tier of sortedTiers) {
      if (amount >= tier.threshold) {
        return {
          name: tier.name,
          level: tier.level,
          color: tier.color,
          badgeUrl: tier.badgeUrl,
          benefits: tier.benefits
        };
      }
    }

    // Fallback to base tier if no match
    return this.getBaseTier(source);
  }

  /**
   * Get base (minimum) tier for a source
   */
  private getBaseTier(source: string): CrestTier {
    const sourceTiers = this.tierConfig[source];
    const baseTier = sourceTiers.tiers
      .sort((a, b) => a.threshold - b.threshold)[0];

    return {
      name: baseTier.name,
      level: baseTier.level,
      color: baseTier.color,
      badgeUrl: baseTier.badgeUrl,
      benefits: baseTier.benefits
    };
  }

  /**
   * Get all available tiers for a source
   */
  getAvailableTiers(source: string): CrestTier[] {
    const sourceTiers = this.tierConfig[source];
    
    if (!sourceTiers) {
      return [];
    }

    return sourceTiers.tiers.map(tier => ({
      name: tier.name,
      level: tier.level,
      color: tier.color,
      badgeUrl: tier.badgeUrl,
      benefits: tier.benefits
    }));
  }

  /**
   * Calculate upgrade requirements
   */
  calculateUpgrade(current: CrestTier, target: CrestTier, source: string): UpgradeInfo {
    const sourceTiers = this.tierConfig[source];
    const targetTierConfig = sourceTiers.tiers.find(t => t.name === target.name);
    const currentTierConfig = sourceTiers.tiers.find(t => t.name === current.name);

    if (!targetTierConfig || !currentTierConfig) {
      throw new Error('Invalid tier comparison');
    }

    const amountNeeded = targetTierConfig.threshold - currentTierConfig.threshold;

    return {
      currentTier: current,
      targetTier: target,
      amountNeeded: Math.max(0, amountNeeded),
      newBenefits: target.benefits.filter(
        b => !current.benefits.includes(b)
      )
    };
  }

  /**
   * Validate tier configuration integrity
   */
  validateConfig(): ConfigValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [source, config] of Object.entries(this.tierConfig)) {
      // Check for duplicate thresholds
      const thresholds = config.tiers.map(t => t.threshold);
      const uniqueThresholds = new Set(thresholds);
      
      if (thresholds.length !== uniqueThresholds.size) {
        errors.push(`${source}: Duplicate threshold values found`);
      }

      // Check for missing required fields
      for (const tier of config.tiers) {
        if (!tier.name || tier.threshold === undefined || !tier.badgeUrl) {
          errors.push(`${source}: Tier missing required fields`);
        }
      }

      // Warning for gaps in tier coverage
      const sortedThresholds = [...thresholds].sort((a, b) => a - b);
      for (let i = 0; i < sortedThresholds.length - 1; i++) {
        const gap = sortedThresholds[i + 1] - sortedThresholds[i];
        if (gap > 50) {
          warnings.push(`${source}: Large gap between $${sortedThresholds[i]} and $${sortedThresholds[i + 1]}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Type definitions
interface TierConfig {
  [source: string]: {
    tiers: {
      name: string;
      level: number;
      threshold: number;
      color: string;
      badgeUrl: string;
      benefits: string[];
    }[];
  };
}

interface UpgradeInfo {
  currentTier: CrestTier;
  targetTier: CrestTier;
  amountNeeded: number;
  newBenefits: string[];
}

interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export default CrestAssignment;