// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSettingsEditor } from '../../js/post-publish/editors/settings-editor.js';
import { createDefaultPostPublishConfig } from '../../js/post-publish/schema.js';

// 27 September 2026 functional audit, section 4: "Correct PMI's Aqua (#4F17A8) option so its
// name and actual color match. Check the selected default and exported launcher CSS/config, not
// only the dropdown text." The "Brand Theme Color" dropdown in the Style & Position editor
// (js/post-publish/editors/settings-editor.js) previously labelled the `default` theme "Aqua
// (#4F17A8)" even though #4F17A8 is PMI Violet, and the actual exported launcher CSS
// (js/post-publish/runtime/rcb-ppt-styles.css) renders `default` with --rcb-ppt-blue, which is
// also #4F17A8 — Violet, never Aqua. Separately, the `cyan` theme's real hex (#00799E) is PMI's
// canonical Aqua 500, not any color named "Cyan" in the PMI palette. This test reads the actual
// runtime CSS (not just the dropdown markup) so a future edit that changes one but not the other
// is caught.

const cssPath = join(process.cwd(), 'js', 'post-publish', 'runtime', 'rcb-ppt-styles.css');
const runtimeCss = readFileSync(cssPath, 'utf8');

function cssVar(name) {
  const match = runtimeCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1].toUpperCase() : null;
}

// What each `.rcb-ppt-theme-<value>` class actually sets `.rcb-ppt-launcher-btn`'s
// background-color to, per rcb-ppt-styles.css — `default` has no override rule, so it falls
// through to the base `.rcb-ppt-launcher-btn` rule's `--rcb-ppt-blue`.
const actualRenderedHex = {
  default: cssVar('rcb-ppt-blue'),
  cobalt: cssVar('rcb-ppt-cobalt'),
  navy: cssVar('rcb-ppt-navy'),
  cyan: cssVar('rcb-ppt-cyan')
};

function themeOptions() {
  const container = createSettingsEditor(createDefaultPostPublishConfig(), () => {});
  return [...container.querySelectorAll('.select-launcher-theme option')].map(opt => ({
    value: opt.value,
    label: opt.textContent.trim()
  }));
}

describe('Post-Publish launcher "Brand Theme Color" labels', () => {
  it('every option\'s displayed hex matches what the exported launcher CSS actually renders for that theme', () => {
    const options = themeOptions();
    expect(options.length).toBeGreaterThanOrEqual(4);
    for (const { value, label } of options) {
      const shown = label.match(/#([0-9a-fA-F]{6})/);
      expect(shown, `option "${value}" (${label}) has no hex in its label`).not.toBeNull();
      expect(`#${shown[1].toUpperCase()}`).toBe(actualRenderedHex[value]);
    }
  });

  it('the default theme is never called "Aqua" — its rendered color is PMI Violet (#4F17A8)', () => {
    const defaultOption = themeOptions().find(o => o.value === 'default');
    expect(actualRenderedHex.default).toBe('#4F17A8');
    expect(defaultOption.label).toContain('#4F17A8');
    expect(defaultOption.label).toContain('Violet');
    expect(defaultOption.label).not.toContain('Aqua');
  });

  it('the theme actually rendered in #00799E is named Aqua, not "Cyan" (no such PMI color)', () => {
    const cyanOption = themeOptions().find(o => o.value === 'cyan');
    expect(actualRenderedHex.cyan).toBe('#00799E');
    expect(cyanOption.label).toContain('#00799E');
    expect(cyanOption.label).toContain('Aqua');
    expect(cyanOption.label).not.toContain('PMI Cyan');
  });
});
