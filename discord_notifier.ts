/**
 * 📢 DISCORD NOTIFIER
 * 
 * Sends ceremonial announcements to Discord channels
 * when sponsors are crested with new tiers.
 */

import { SponsorRecord, CrestTier } from '../models';
import fs from 'fs';
import path from 'path';

export class DiscordNotifier {
  private webhookUrl: string;
  private templates: NotificationTemplates;

  constructor(config: DiscordConfig) {
    this.webhookUrl = config.webhookUrl;
    
    const templatePath = path.join(__dirname, '../../config/notification-templates.json');
    const templates = fs.readFileSync(templatePath, 'utf8');
    this.templates = JSON.parse(templates);
  }

  /**
   * Announce new sponsorship to Discord
   */
  async announceSponsorship(
    sponsor: SponsorRecord,
    tier: CrestTier,
    badgeUrl: string
  ): Promise<NotificationResult> {
    const embed = this.buildEmbed(sponsor, tier, badgeUrl);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'Treasury Herald',
          avatar_url: 'https://raw.githubusercontent.com/Kypria-LLC/crest-vault/main/assets/herald-avatar.png',
          embeds: [embed]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord webhook failed: ${response.status} - ${error}`);
      }

      return {
        success: true,
        messageId: response.headers.get('x-discord-message-id'),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Build Discord embed based on tier template
   */
  private buildEmbed(
    sponsor: SponsorRecord,
    tier: CrestTier,
    badgeUrl: string
  ): DiscordEmbed {
    const template = this.templates[tier.name] || this.templates.default;
    
    // Replace template variables
    const title = template.title
      .replace('{tier}', tier