import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeAttribute, sanitizeRichText, richInline, richTextToPlain } from '../js/utilities.js';
import { getPmiIconSvg } from '../js/pmi-icons.js';

/**
 * Callout & Alert Matrix Component
 * @typedef {Object} CalloutBoxConfig
 * @property {string} [title] - Header title
 * @property {string} [content] - Explanatory caption / instructions
 * @property {'stacked'|'grid-2'|'grid-3'} [layout] - Layout presentation mode
 * @property {boolean} [requireAcknowledgment] - Whether items include an interactive acknowledge toggle
 * @property {Array<{title: string, content: string, tone?: 'info'|'warning'|'primary'|'tip'|'security', badgeLabel?: string}>} items
 */

export const id = 'callout-box';
export const name = 'Callout & Alert Matrix';
export const category = 'cards';

/** @type {CalloutBoxConfig} */
export const defaultConfig = {
  title: 'Project Governance Essentials',
  content: 'Review the key delivery standards and governance expectations before you start project work.',
  layout: 'grid-2',
  requireAcknowledgment: true,
  items: [
    {
      title: 'Confirm Sponsor Approval',
      content: 'Every project charter must be approved by the sponsor before the team commits people, budget or vendor contracts.',
      tone: 'security',
      badgeLabel: 'Policy Requirement'
    },
    {
      title: 'Escalate Risks Early',
      content: 'Raise any risk that could move the critical path by more than a week with your sponsor within one business day, not at the next status meeting.',
      tone: 'warning',
      badgeLabel: 'Risk Warning'
    },
    {
      title: 'Change Control Cadence',
      content: 'Requests that change scope, schedule or budget go to the weekly change board, and approved changes are logged before work begins.',
      tone: 'info',
      badgeLabel: 'Governance Guideline'
    },
    {
      title: 'Keep One Source of Truth',
      content: 'Update the shared project plan rather than a private copy so the whole team works from the same schedule and scope.',
      tone: 'tip',
      badgeLabel: 'Pro Tip'
    }
  ]
};

export const editorSchema = getEditorSchema(id);

const ICONS = {
  info: getPmiIconSvg('information-circle-filled', { width: 22, height: 22, ariaHidden: true }),
  warning: getPmiIconSvg('exclamation-triangle-filled', { width: 22, height: 22, ariaHidden: true }),
  primary: getPmiIconSvg('verified', { width: 22, height: 22, ariaHidden: true }),
  tip: getPmiIconSvg('check-circle-filled', { width: 22, height: 22, ariaHidden: true }),
  security: getPmiIconSvg('check-shield', { width: 22, height: 22, ariaHidden: true })
};

const checkIcon = getPmiIconSvg('check', { width: 16, height: 16, ariaHidden: true });

export function generateHTML(config, instanceId) {
  const layout = ['stacked', 'grid-2', 'grid-3'].includes(config.layout) ? config.layout : 'grid-2';
  const requireAck = config.requireAcknowledgment !== false;
  const items = Array.isArray(config.items) && config.items.length ? config.items : defaultConfig.items;

  const itemsHtml = items.map((item, idx) => {
    const tone = ['info', 'warning', 'primary', 'tip', 'security'].includes(item.tone) ? item.tone : 'info';
    const iconSvg = ICONS[tone] || ICONS.info;

    return `
      <div class="callout-item-card tone-${tone}" id="${instanceId}-item-${idx}" role="region" aria-label="${escapeAttribute(richTextToPlain(item.title) || `Callout ${idx + 1}`)}">
        <div class="callout-item-header">
          <div class="callout-item-icon tone-${tone}">
            ${iconSvg}
          </div>
          <div class="callout-item-meta">
            <span class="callout-item-badge tone-${tone}">${richInline(item.badgeLabel, tone.toUpperCase())}</span>
            <h4 class="callout-item-title">${richInline(item.title, '')}</h4>
          </div>
        </div>
        <div class="callout-item-body">
          ${sanitizeRichText(item.content || '')}
        </div>
        ${requireAck ? `
          <div class="callout-item-footer">
            <button type="button" class="callout-ack-btn"
              id="${instanceId}-ack-${idx}"
              data-item-index="${idx}"
              aria-pressed="false">
              <span class="callout-ack-icon">${checkIcon}</span>
              <span class="callout-ack-text">Mark as Acknowledged</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="callout-matrix-card" id="${instanceId}-matrix-card">
      ${config.title ? `<h3 class="callout-title">${richInline(config.title)}</h3>` : ''}
      ${config.content ? `<p class="callout-description">${sanitizeRichText(config.content)}</p>` : ''}
      <div class="callout-matrix-grid layout-${layout}" id="${instanceId}-grid">
        ${itemsHtml}
      </div>
    </div>
  `;
}

export function generateCSS() {
  return `
    .callout-matrix-card {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--pmi-radius-lg, var(--border-radius, 20px));
      box-shadow: var(--shadow-style);
      padding: var(--pmi-space-5, 24px);
      display: flex;
      flex-direction: column;
      gap: var(--pmi-space-4, 16px);
    }
    .callout-title {
      font-size: var(--pmi-fs-h3, 1.25rem);
      font-weight: var(--pmi-fw-bold, 700);
      line-height: var(--pmi-lh-heading, 1.25);
      color: var(--text-main);
      text-wrap: pretty;
      margin: 0;
    }
    .callout-description {
      font-size: var(--pmi-fs-body, 1rem);
      line-height: var(--pmi-lh-body, 1.5);
      color: var(--text-main);
      margin: 0;
    }
    .callout-matrix-grid {
      display: grid;
      gap: var(--pmi-space-4, 16px);
      width: 100%;
    }
    .callout-matrix-grid.layout-stacked {
      grid-template-columns: 1fr;
    }
    .callout-matrix-grid.layout-grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .callout-matrix-grid.layout-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 992px) {
      .callout-matrix-grid.layout-grid-3 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 640px) {
      .callout-matrix-grid.layout-grid-2,
      .callout-matrix-grid.layout-grid-3 {
        grid-template-columns: 1fr;
      }
    }
    .callout-item-card {
      background-color: var(--bg-card, #FFFFFF);
      border: 1px solid var(--border-color, #E7E4DC);
      border-left: 4px solid var(--border-color, #E7E4DC);
      border-radius: var(--pmi-radius-md, 16px);
      padding: var(--pmi-space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--pmi-space-3, 12px);
      transition: all 180ms ease;
    }
    .callout-item-card.tone-info {
      border-left-color: var(--pmi-aqua, #00799E);
    }
    .callout-item-card.tone-primary {
      border-left-color: var(--primary, #4F17A8);
    }
    .callout-item-card.tone-warning {
      border-left-color: var(--border-color, #E7E4DC);
    }
    .callout-item-card.tone-tip {
      border-left-color: var(--pmi-green, #197F10);
    }
    .callout-item-card.tone-security {
      border-left-color: var(--pmi-aqua, #00799E);
    }
    .callout-item-header {
      display: flex;
      align-items: flex-start;
      gap: var(--pmi-space-3, 12px);
    }
    .callout-item-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--pmi-radius-sm, 12px);
      background-color: var(--bg-body, #F7F4EF);
      flex-shrink: 0;
      color: var(--text-main);
    }
    .callout-item-icon.tone-info {
      color: var(--pmi-aqua, #00799E);
    }
    .callout-item-icon.tone-primary {
      color: var(--primary, #4F17A8);
    }
    .callout-item-icon.tone-warning {
      color: var(--text-muted, #200F3B);
    }
    .callout-item-icon.tone-tip {
      color: var(--pmi-green, #197F10);
    }
    .callout-item-icon.tone-security {
      color: var(--pmi-aqua, #00799E);
    }
    .callout-item-meta {
      display: flex;
      flex-direction: column;
      gap: var(--pmi-space-1, 4px);
    }
    .callout-item-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 2px var(--pmi-space-2, 8px);
      border-radius: 9999px;
      font-size: var(--pmi-fs-xs, 0.8125rem);
      font-weight: var(--pmi-fw-bold, 700);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background-color: var(--bg-body, #F7F4EF);
      color: var(--text-muted, #200F3B);
    }
    .callout-item-badge.tone-info {
      background-color: var(--bg-body, #F7F4EF);
      color: var(--pmi-aqua, #00799E);
    }
    .callout-item-badge.tone-primary {
      background-color: var(--primary, #4F17A8);
      color: #FFFFFF;
    }
    .callout-item-badge.tone-warning {
      background-color: var(--bg-body, #F7F4EF);
      color: var(--text-main);
    }
    .callout-item-badge.tone-tip {
      background-color: var(--bg-body, #F7F4EF);
      color: var(--primary, #4F17A8);
    }
    .callout-item-badge.tone-security {
      background-color: var(--pmi-aqua, #00799E);
      color: #FFFFFF;
    }
    .callout-item-title {
      font-size: var(--pmi-fs-h3, 1.125rem);
      font-weight: var(--pmi-fw-bold, 700);
      line-height: var(--pmi-lh-heading, 1.3);
      color: var(--text-main);
      margin: 0;
    }
    .callout-item-body {
      font-size: var(--pmi-fs-body, 1rem);
      line-height: var(--pmi-lh-body, 1.5);
      color: var(--text-main);
    }
    .callout-item-footer {
      margin-top: auto;
      padding-top: var(--pmi-space-2, 8px);
      display: flex;
    }
    .callout-ack-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--pmi-space-2, 8px);
      padding: var(--pmi-space-2, 8px) var(--pmi-space-3, 12px);
      border-radius: var(--pmi-radius-sm, 12px);
      border: 1px solid var(--border-color, #E7E4DC);
      background-color: var(--bg-card, #FFFFFF);
      color: var(--text-main);
      font-family: var(--pmi-font-sans, sans-serif);
      font-size: var(--pmi-fs-xs, 0.8125rem);
      font-weight: var(--pmi-fw-bold, 700);
      cursor: pointer;
      min-height: 44px;
      transition: all 180ms ease;
    }
    .callout-ack-btn:hover {
      border-color: var(--primary, #4F17A8);
      background-color: var(--bg-body, #F7F4EF);
    }
    .callout-ack-btn:focus-visible {
      outline: 3px solid var(--primary, #4F17A8);
      outline-offset: 2px;
    }
    .callout-ack-btn.is-acknowledged {
      background-color: var(--primary, #4F17A8);
      border-color: var(--primary, #4F17A8);
      color: #FFFFFF;
    }
    .callout-ack-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `;
}

export function generateJS(config, instanceId) {
  return `
    function initComponent() {
      var root = document.getElementById('${instanceId}-matrix-card');
      if (!root) return;

      var ackButtons = root.querySelectorAll('.callout-ack-btn');
      var totalAck = ackButtons.length;

      function onAckClick(e) {
        var btn = e.currentTarget;
        var idx = Number(btn.dataset.itemIndex);
        var isNowAck = !btn.classList.contains('is-acknowledged');

        btn.classList.toggle('is-acknowledged', isNowAck);
        btn.setAttribute('aria-pressed', isNowAck ? 'true' : 'false');
        var textSpan = btn.querySelector('.callout-ack-text');
        if (textSpan) {
          textSpan.textContent = isNowAck ? 'Acknowledged' : 'Mark as Acknowledged';
        }

        if (isNowAck) {
          viewedItems.add(idx);
          updateProgress();
        }
      }

      ackButtons.forEach(function(btn) {
        btn.addEventListener('click', onAckClick);
      });

      if (!totalAck) {
        viewedItems.add(0);
        updateProgress();
      }
    }
  `;
}

export function validate(config) {
  const errors = [];
  if (!config.items || !config.items.length) {
    errors.push('Callout & Alert Matrix requires at least one callout item.');
  }
  if (config.layout && !['stacked', 'grid-2', 'grid-3'].includes(config.layout)) {
    errors.push('Layout must be one of: stacked, grid-2, grid-3.');
  }
  return { valid: errors.length === 0, errors };
}
