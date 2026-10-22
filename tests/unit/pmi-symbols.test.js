// PMI symbols: the eight supplied shapes, the pattern rules from the identity guidelines, and the
// header accent (on by default, decorative, never behind text).
import { describe, expect, test } from 'vitest';
import { generateIframeContent } from '../../js/preview.js';
import { COMPONENT_REGISTRY, getComponentById, getDefaultConfig } from '../../js/component-registry.js';
import { BUILT_IN_THEMES, DEFAULT_THEME_ID, applyThemeToConfig } from '../../js/themes.js';
import { sanitizePreviewConfig, toRgba } from '../../js/utilities.js';
import {
  PMI_SYMBOL_COLORS, PMI_SYMBOL_KEYS, SYMBOL_PATTERN_GAP_RATIO, SYMBOL_PATTERN_MAX_COVERAGE,
  autoSymbolFor, layoutSymbolPattern, resolveHeaderSymbol, symbolPatternCoverage, symbolPatternSvg, symbolSvg
} from '../../js/pmi-symbols.js';

const theme = BUILT_IN_THEMES.find(entry => entry.id === DEFAULT_THEME_ID);
const registry = Object.fromEntries(COMPONENT_REGISTRY.map(entry => [entry.id, { ...entry.renderer, version: entry.version }]));

function compile(componentId, overrides = {}) {
  const entry = getComponentById(COMPONENT_REGISTRY, componentId);
  const config = applyThemeToConfig({
    blockTitle: 'LABEL', blockHeadline: 'Headline', blockDesc: 'Description',
    ...getDefaultConfig(entry), ...overrides
  }, theme);
  return generateIframeContent({ selectedComponent: { id: componentId }, activeTheme: theme, componentOverrides: {}, config, currentProjectId: 'p' }, registry, toRgba);
}

describe('the supplied symbols', () => {
  test('all eight are present and render as decorative inline SVG', () => {
    expect(PMI_SYMBOL_KEYS).toEqual(['anvil', 'circles', 'four-triangles', 'half-circles', 'pentagram', 'square', 'two-triangles-angled', 'two-triangles-stacked']);
    for (const key of PMI_SYMBOL_KEYS) {
      const svg = symbolSvg(key, { color: 'violet', size: 40 });
      expect(svg, key).toContain('aria-hidden="true"');
      expect(svg, key).toContain('focusable="false"');
      expect(svg, key).toContain(`fill="${PMI_SYMBOL_COLORS.violet}"`);
      expect(svg, key).toMatch(/<path d="M/);
    }
    expect(symbolSvg('not-a-symbol')).toBe('');
  });

  test('colours are exactly the three core colours', () => {
    expect(Object.keys(PMI_SYMBOL_COLORS)).toEqual(['violet', 'aqua', 'tangerine']);
    expect(symbolSvg('anvil', { color: 'tangerine' })).toContain(`fill="${PMI_SYMBOL_COLORS.tangerine}"`);
    expect(symbolSvg('anvil')).toContain('fill="currentColor"');
  });
});

describe('the symbol pattern follows the PMI rules', () => {
  test('spacing between symbols is exactly 1/7 of a symbol width', () => {
    const layout = layoutSymbolPattern({ cols: 4, rows: 3, size: 70 });
    expect(SYMBOL_PATTERN_GAP_RATIO).toBeCloseTo(1 / 7, 10);
    expect(layout.gap).toBeCloseTo(10, 10);
    const [a, b] = layout.cells;
    expect(b.x - (a.x + layout.size)).toBeCloseTo(layout.gap, 10);
    const below = layout.cells.find(c => c.col === 0 && c.row === 1);
    expect(below.y - (a.y + layout.size)).toBeCloseTo(layout.gap, 10);
  });

  test('no two horizontally or vertically adjacent symbols share a colour, at any size', () => {
    for (const [cols, rows] of [[2, 2], [3, 2], [4, 3], [5, 5], [7, 4]]) {
      const { cells } = layoutSymbolPattern({ cols, rows });
      const at = (c, r) => cells.find(cell => cell.col === c && cell.row === r);
      for (const cell of cells) {
        const right = at(cell.col + 1, cell.row);
        const below = at(cell.col, cell.row + 1);
        if (right) expect(right.color, `${cols}x${rows} (${cell.col},${cell.row}) right`).not.toBe(cell.color);
        if (below) expect(below.color, `${cols}x${rows} (${cell.col},${cell.row}) below`).not.toBe(cell.color);
      }
    }
  });

  test('a corner pattern stays well under the 75% coverage ceiling', () => {
    const layout = layoutSymbolPattern({ cols: 3, rows: 2, size: 48 });
    expect(symbolPatternCoverage(layout, 720, 200)).toBeLessThan(SYMBOL_PATTERN_MAX_COVERAGE);
  });

  test('the pattern is one decorative element carrying every symbol', () => {
    const svg = symbolPatternSvg({ cols: 3, rows: 2, size: 48 });
    expect(svg.match(/<svg/g)).toHaveLength(1);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg.match(/<g /g)).toHaveLength(6);
  });
});

describe('header accent setting', () => {
  test('auto is stable per component, none disables, a real key wins, junk falls back to auto', () => {
    expect(autoSymbolFor('accordion')).toBe(autoSymbolFor('accordion'));
    expect(PMI_SYMBOL_KEYS).toContain(autoSymbolFor('anything'));
    expect(resolveHeaderSymbol('none', 'accordion')).toBeNull();
    expect(resolveHeaderSymbol('pentagram', 'accordion')).toBe('pentagram');
    expect(resolveHeaderSymbol('bogus', 'accordion')).toBe(autoSymbolFor('accordion'));
    expect(resolveHeaderSymbol(undefined, 'accordion')).toBe(autoSymbolFor('accordion'));
  });

  test('sanitising keeps valid values and replaces invalid ones', () => {
    const clean = config => sanitizePreviewConfig(config, 'accordion');
    expect(clean({ headerSymbol: 'circles', headerSymbolColor: 'violet' })).toMatchObject({ headerSymbol: 'circles', headerSymbolColor: 'violet' });
    expect(clean({ headerSymbol: 'none' }).headerSymbol).toBe('none');
    expect(clean({ headerSymbol: '<script>', headerSymbolColor: '#123456' })).toMatchObject({ headerSymbol: 'auto', headerSymbolColor: 'aqua' });
    expect(clean({})).toMatchObject({ headerSymbol: 'auto', headerSymbolColor: 'aqua' });
  });

  test('the accent is ON by default: one decorative symbol in the header, with space reserved for it', () => {
    const html = compile('accordion');
    expect(html).toMatch(/class="block-header header-minimal has-symbol"/);
    expect(html.match(/class="block-symbol"/g)).toHaveLength(1);
    expect(html).toMatch(/<div class="block-symbol" aria-hidden="true"><svg [^>]*aria-hidden="true"/);
    expect(html).toContain('.block-header.has-symbol { padding-right: 88px;');
    expect(html).toContain('pointer-events: none;');
    expect(html).toContain('@media (forced-colors: active)');
    // It is a decorative sibling placed before the text, never inside the heading or label.
    const header = html.slice(html.indexOf('class="block-header'), html.indexOf('</h2>'));
    expect(header.indexOf('block-symbol')).toBeLessThan(header.indexOf('block-label'));
    expect(header).not.toMatch(/<h2[^>]*>[^<]*<div class="block-symbol"/);
  });

  test('none removes it entirely, and a chosen symbol and colour are honoured', () => {
    const off = compile('accordion', { headerSymbol: 'none' });
    expect(off).not.toContain('class="block-symbol"');
    expect(off).not.toContain('has-symbol"');
    const chosen = compile('accordion', { headerSymbol: 'pentagram', headerSymbolColor: 'tangerine' });
    expect(chosen).toContain(`fill="${PMI_SYMBOL_COLORS.tangerine}"`);
    expect(chosen).toContain('class="block-symbol"');
  });

  test('the accent works for every component, not just the Accordion', () => {
    for (const entry of COMPONENT_REGISTRY) {
      const html = compile(entry.id);
      expect(html, entry.id).toContain('class="block-symbol"');
    }
  });

  test('no header renders when there is no header text, so no orphan symbol appears', () => {
    const html = compile('accordion', { blockTitle: '', blockHeadline: '', blockDesc: '' });
    expect(html).not.toContain('class="block-symbol"');
  });
});

describe('media holding shapes (images cropped into a PMI symbol)', () => {
  const imageMedia = extra => ({
    type: 'image', sourceType: 'url', src: 'https://learn.example.org/photo.jpg', alt: 'A trainer at a whiteboard',
    placement: 'above', aspectRatio: 'original', fit: 'contain', ...extra
  });
  const accordionWith = media => compile('accordion', { items: [{ title: 'One', content: 'Body', media }] });

  test('a shaped image gets the mask, a square crop, and unchanged alt text and caption', async () => {
    const html = accordionWith(imageMedia({ holdingShape: 'circles', caption: 'Figure 1' }));
    expect(html).toMatch(/<figure class="item-media-figure [^"]*item-media-shaped"/);
    expect(html).toContain('--item-media-mask: url(');
    expect(html).toContain('alt="A trainer at a whiteboard"');
    expect(html).toContain('Figure 1');
    expect(html).toMatch(/\.item-media-shaped \.item-media-img\s*{[^}]*aspect-ratio: 1 \/ 1/);
    expect(html).toMatch(/\.item-media-shaped \.item-media-img\s*{[^}]*mask: var\(--item-media-mask\)/);
    expect(html).toContain('@media (forced-colors: active)');
  });

  test('the mask value is safe inside a double-quoted style attribute', async () => {
    const { symbolMaskCssUrl, PMI_SYMBOL_KEYS } = await import('../../js/pmi-symbols.js');
    for (const key of PMI_SYMBOL_KEYS) {
      const css = symbolMaskCssUrl(key);
      expect(css, key).toMatch(/^url\('data:image\/svg\+xml,[^'"]+'\)$/);
    }
    expect(symbolMaskCssUrl('nope')).toBe('');
  });

  test('without a shape, output is unchanged: no shaped class, no mask variable', () => {
    for (const media of [imageMedia({}), imageMedia({ holdingShape: 'none' }), imageMedia({ holdingShape: 'bogus' })]) {
      const html = accordionWith(media);
      expect(html).not.toMatch(/<figure class="item-media-figure [^"]*item-media-shaped"/);
      expect(html).not.toContain('--item-media-mask: url(');
    }
  });

  test('only images can be shaped, and the value is validated when sanitising', () => {
    const clean = items => sanitizePreviewConfig({ items }, 'accordion').items[0].media;
    expect(clean([{ title: 'a', media: imageMedia({ holdingShape: 'pentagram' }) }]).holdingShape).toBe('pentagram');
    expect(clean([{ title: 'a', media: imageMedia({ holdingShape: '"><script>' }) }]).holdingShape).toBe('none');
    const audio = accordionWith({ type: 'audio', sourceType: 'url', src: 'https://learn.example.org/a.mp3', holdingShape: 'circles', placement: 'above' });
    expect(audio).not.toMatch(/<figure class="item-media-figure [^"]*item-media-shaped"/);
    expect(audio).not.toContain('--item-media-mask: url(');
  });

  test('preflight reminds authors to check the subject, as a recommendation only', async () => {
    const { runPreflight, SEVERITY } = await import('../../js/validation.js');
    const entry = getComponentById(COMPONENT_REGISTRY, 'accordion');
    const config = { ...getDefaultConfig(entry), blockTitle: 'T', blockHeadline: 'H', items: [{ title: 'One', content: 'Body', media: imageMedia({ holdingShape: 'half-circles' }) }] };
    const issues = await runPreflight({ componentId: 'accordion', schema: entry.editorSchema, config, theme, componentOverrides: {}, settings: {} });
    const found = issues.find(i => i.ruleId === 'media-holding-shape-check');
    expect(found).toBeDefined();
    expect(found.severity).toBe(SEVERITY.RECOMMENDATION);
    expect(found.explanation).toMatch(/Half Circles/);
    expect(found.explanation).toMatch(/subject/);
    const none = await runPreflight({ componentId: 'accordion', schema: entry.editorSchema, config: { ...config, items: [{ title: 'One', content: 'Body', media: imageMedia({ holdingShape: 'none' }) }] }, theme, componentOverrides: {}, settings: {} });
    expect(none.some(i => i.ruleId === 'media-holding-shape-check')).toBe(false);
  });
});
