import fs from 'fs/promises';
import path from 'path';

const DOCS_JSON_PATH = path.resolve(process.cwd(), 'docs.json');
const ROOT_DIRECTORIES = new Set();

async function getRootDirectoriesFromDocsJson() {
  try {
    const docsJsonContent = await fs.readFile(DOCS_JSON_PATH, 'utf-8');
    const docsJson = JSON.parse(docsJsonContent);
    const dropdowns = docsJson.navigation?.dropdowns || [];

    for (const dropdown of dropdowns) {
      const groups = dropdown.groups || [];
      for (const group of groups) {
        const pages = group.pages || [];
        for (const page of pages) {
          if (page && !page.startsWith('http')) {
            const parts = page.split('/');
            if (parts.length > 1) {
              ROOT_DIRECTORIES.add(parts[0]);
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
    // Fine if it fails, we'll use the formatted name.
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

async function buildDirectoryTree(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const tree = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'index.mdx') {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      tree.push({
        type: 'directory',
        name: entry.name,
        path: entryPath,
        children: await buildDirectoryTree(entryPath),
      });
    } else if (entry.name.endsWith('.mdx')) {
      const title = await getTitleFromMdx(entryPath) || formatNameToTitle(entry.name);
      tree.push({
        type: 'file',
        name: entry.name,
        path: entryPath,
        title: title,
      });
    }
  }
  return tree;
}

function generateMdxForTree(tree, level = 0) {
  let mdx = '';
  for (const node of tree) {
    const href = `/${node.path.replace(/\.mdx$/, '')}`;
    if (node.type === 'directory') {
      const title = formatNameToTitle(node.name);
      mdx += `<Accordion title="${title}" icon="folder">\n`;
      mdx += generateMdxForTree(node.children, level + 1);
      mdx += `</Accordion>\n`;
    } else {
      mdx += `<Card title="${node.title}" icon="file-text" href="${href}"></Card>\n`;
    }
  }
  return mdx;
}

async function cleanupOldIndexFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await cleanupOldIndexFiles(entryPath);
        } else if (entry.name === 'index.mdx' && dir !== '.') {
            // Don't delete the root index files we are about to create.
            // This is a simple check, we can make it more robust if needed.
            const isRootIndex = Array.from(ROOT_DIRECTORIES).some(rootDir => path.resolve(rootDir) === path.resolve(dir));
            if (!isRootIndex) {
                 try {
                    await fs.unlink(entryPath);
                    console.log(`Removed old index file: ${entryPath}`);
                } catch (error) {
                    console.error(`Error removing old index file ${entryPath}:`, error);
                }
            }
        }
    }
}


async function main() {
  await getRootDirectoriesFromDocsJson();

  // Clean up all old index files first
  for (const dir of ROOT_DIRECTORIES) {
      await cleanupOldIndexFiles(dir);
  }


  console.log('Generating overview pages for:', Array.from(ROOT_DIRECTORIES));

  for (const dir of ROOT_DIRECTORIES) {
    const tree = await buildDirectoryTree(dir);
    const mdxContent = generateMdxForTree(tree);
    const indexPath = path.join(dir, 'index.mdx');

    const finalMdx = `---
title: 'Overview of ${formatNameToTitle(dir)}'
---

import { Accordion, Card } from 'mintlify';

${mdxContent}
`;

    await fs.writeFile(indexPath, finalMdx);
    console.log(`Generated overview page for ${dir}`);
  }
}

main();
