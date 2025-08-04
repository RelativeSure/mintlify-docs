import fs from 'fs/promises';
import path from 'path';

const DOCS_JSON_PATH = path.resolve(process.cwd(), 'docs.json');
const TARGET_DIRECTORIES = new Set();
const EXCLUDED_DIRECTORIES = ['about']; // Add any directories to exclude here

async function getDirectoriesFromDocsJson() {
  try {
    const docsJsonContent = await fs.readFile(DOCS_JSON_PATH, 'utf-8');
    const docsJson = JSON.parse(docsJsonContent);
    const dropdowns = docsJson.navigation?.dropdowns || [];

    for (const dropdown of dropdowns) {
      const groups = dropdown.groups || [];
      for (const group of groups) {
        const pages = group.pages || [];
        for (const page of pages) {
          const dir = path.dirname(page);
          if (dir !== '.' && !dir.startsWith('http')) {
            TARGET_DIRECTORIES.add(dir);
            let parentDir = dir;
            while (parentDir !== '.') {
              parentDir = path.dirname(parentDir);
              if (parentDir !== '.') {
                TARGET_DIRECTORIES.add(parentDir);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading or parsing docs.json:', error);
  }
}

async function getTitleFromMdx(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/title:\s*['"]?(.*?)['"]?$/m);
      if (titleMatch) {
        return titleMatch[1];
      }
    }
  } catch (error) {
    // Could be a directory, or file without title. That's fine.
  }
  return null;
}

function formatNameToTitle(name) {
  return name
    .replace(/\.mdx$/, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function generateIndexPage(dir) {
  const indexPath = path.join(dir, 'index.mdx');
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const cards = await Promise.all(
    entries
      .filter(entry => {
        const isIndex = entry.name === 'index.mdx';
        const isHidden = entry.name.startsWith('.');
        return !isIndex && !isHidden;
      })
      .map(async entry => {
        const entryPath = path.join(dir, entry.name);
        const href = `/${path.join(dir, entry.name).replace(/\.mdx$/, '')}`;
        let title = await getTitleFromMdx(entryPath);
        if (!title) {
          title = formatNameToTitle(entry.name);
        }
        const icon = entry.isDirectory() ? 'folder' : 'file-text';
        return `<Card title="${title}" icon="${icon}" href="${href}"></Card>`;
      })
  );

  if (cards.length === 0) {
    console.log(`No items to index in ${dir}, skipping.`);
    return;
  }

  const mdxContent = `---
title: 'Overview of ${formatNameToTitle(path.basename(dir))}'
---

import { Card, Columns } from 'mintlify';

<Columns>
  ${cards.join('\n  ')}
</Columns>
`;

  await fs.writeFile(indexPath, mdxContent);
  console.log(`Generated index page for ${dir}`);
}

async function cleanupExcludedDirectories() {
  for (const dir of EXCLUDED_DIRECTORIES) {
    const indexPath = path.join(dir, 'index.mdx');
    try {
      await fs.unlink(indexPath);
      console.log(`Removed index page from excluded directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error removing index page from ${dir}:`, error);
      }
    }
  }
}

async function main() {
  await getDirectoriesFromDocsJson();
  await cleanupExcludedDirectories();

  const finalTargetDirectories = Array.from(TARGET_DIRECTORIES).filter(
    dir => !EXCLUDED_DIRECTORIES.includes(dir)
  );

  console.log('Generating index pages for:', finalTargetDirectories);
  for (const dir of finalTargetDirectories) {
    try {
      await generateIndexPage(dir);
    } catch (error) {
      console.error(`Failed to generate index for ${dir}:`, error);
    }
  }
}

main();
