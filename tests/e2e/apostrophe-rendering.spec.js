import { expect, test } from '@playwright/test';

// User-authored apostrophes must render as apostrophes everywhere the app builds markup from
// names (see tests/unit/html-entities.test.js for the regression this guards).

const NAMES = { project: "Kim's course", section: "Manager's Module", component: "Owner's Lesson" };

async function seedCourse(page) {
  await page.goto('/?dashboard');
  await page.evaluate(async names => {
    const { buildProjectSchemaV3, createComponentInstance, createSection } = await import('/js/project-schema.js');
    const { saveProject } = await import('/js/storage.js');
    const cfg = { blockTitle: 'M', blockHeadline: 'H', items: [{ title: 'One', content: 'Body' }], colorPrimary: '#4F17A8', colorAccent: '#00799E', colorBg: '#FFFFFF', colorText: '#200F3B', borderRadius: '8', shadowDepth: 'none', iconStyle: 'chevron' };
    const component = createComponentInstance({ id: 'c1', name: names.component, type: 'accordion', config: cfg });
    saveProject(buildProjectSchemaV3({
      name: names.project, sectionOrder: ['s1'],
      sections: { s1: createSection({ id: 's1', name: names.section, componentOrder: ['c1'] }) },
      components: { c1: component }
    }));
  }, NAMES);
  await page.reload();
}

// U+0002 is what a browser produces from the broken `&#2A0C5A;` reference.
const hasControlCharacter = text => [...text].some(ch => ch.charCodeAt(0) < 9);
const clean = text => {
  expect(hasControlCharacter(text)).toBe(false);
  expect(text).not.toMatch(/A0C5A|&#/);
};

test('the dashboard and the course outline show apostrophes in names intact', async ({ page }) => {
  await seedCourse(page);
  const card = page.locator('.project-card').first();
  await expect(card).toContainText(NAMES.project);
  clean(await card.innerText());

  await card.locator('[data-action="open"]').first().click();
  const overview = page.locator('#project-overview-workspace');
  await expect(overview).toContainText(NAMES.component);
  await expect(overview).toContainText(NAMES.section);
  clean(await overview.innerText());
});

test('the QA view shows apostrophes intact, including inside its own preflight messages', async ({ page }) => {
  await seedCourse(page);
  await page.locator('.project-card').first().locator('[data-action="open"]').first().click();
  await page.getByText('QA Preflight').first().click();
  const qa = page.locator('#project-qa-workspace');
  await expect(qa).toContainText(NAMES.component);
  // The clipping-risk message contains "block's", "Builder's" and "Rise's".
  await expect(qa).toContainText("Builder's own preview", { timeout: 20000 });
  clean(await qa.innerText());
});
