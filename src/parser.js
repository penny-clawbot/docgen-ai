import * as fs from 'fs';
import * as path from 'path';

export function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const lines = code.split('\n');

  const structure = {
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    imports: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    const isExported = trimmed.startsWith('export ');

    if (isExported && trimmed.match(/function\s+\w+/)) {
      const match = trimmed.match(/function\s+(\w+)\s*\(([^)]*)\)(?:\s*::\s*(\w+))?/);
      if (match) {
        const name = match[1];
        const paramsStr = match[2] || '';
        const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
        const returnType = match[3] || 'void';
        const isAsync = trimmed.includes('async');

        structure.functions.push({ name, params, returnType, location: { file: filePath, line: i + 1 }, isExported, isAsync });
      }
      continue;
    }

    if (isExported && trimmed.match(/class\s+\w+/)) {
      const match = trimmed.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);
      if (match) {
        const name = match[1];
        const extendsClass = match[2] || undefined;
        structure.classes.push({ name, methods: [], properties: [], extends: extendsClass, location: { file: filePath, line: i + 1 }, isExported });
      }
      continue;
    }

    if (isExported && trimmed.match(/interface\s+\w+/)) {
      const match = trimmed.match(/interface\s+(\w+)\s*\{/);
      if (match) {
        const name = match[1];
        structure.interfaces.push({ name, properties: [], methods: [], location: { file: filePath, line: i + 1 }, isExported });
      }
      continue;
    }

    if (isExported && trimmed.match(/type\s+\w+/)) {
      const match = trimmed.match(/type\s+(\w+)\s*=\s*(.+?);/);
      if (match) {
        const name = match[1];
        const typeDef = match[2] || 'any';
        structure.types.push({ name, type: typeDef.includes('interface') ? 'object' : 'primitive', location: { file: filePath, line: i + 1 } });
      }
      continue;
    }

    const importMatch = trimmed.match(/import\s+(?:\{[^}]+\}|\w+(?:\s*,\s*\w+)*)\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const imported = importMatch[1] || importMatch[2];
      structure.imports.push(imported);
    }
  }

  return structure;
}

export function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const structure = {
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    imports: [],
  };

  const files = getAllFiles(dirPath, extensions);

  for (const file of files) {
    try {
      const fileStructure = parseFile(file);
      structure.functions.push(...fileStructure.functions);
      structure.classes.push(...fileStructure.classes);
      structure.interfaces.push(...fileStructure.interfaces);
      structure.types.push(...fileStructure.types);
      structure.imports.push(...fileStructure.imports);
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error);
    }
  }

  return structure;
}

function getAllFiles(dirPath, extensions) {
  const files = [];

  function scan(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  scan(dirPath);
  return files;
}
