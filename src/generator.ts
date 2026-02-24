import { CodeStructure } from './parser.js';

export interface TemplateConfig {
  name: string;
  description?: string;
}

export interface GenerationOptions {
  outputDir: string;
  template?: 'api' | 'library' | 'app';
  includePrivate?: boolean;
}

/**
 * Generate documentation from code structure
 */
export function generateDocs(
  structure: CodeStructure,
  options: GenerationOptions
): void {
  const templates = {
    api: generateAPIDocs,
    library: generateLibraryDocs,
    app: generateAppDocs,
  };

  const generator = templates[options.template || 'library'];
  const docs = generator(structure, options);

  // Write README
  writeReadme(structure, options);

  // Write API docs if there are functions
  if (structure.functions.length > 0) {
    writeAPISection(structure, options);
  }

  // Write class docs
  if (structure.classes.length > 0) {
    writeClassSection(structure, options);
  }

  // Write interface docs
  if (structure.interfaces.length > 0) {
    writeInterfaceSection(structure, options);
  }
}

/**
 * Generate library documentation
 */
function generateLibraryDocs(
  structure: CodeStructure,
  options: GenerationOptions
): string {
  let docs = '';

  // Classes
  if (structure.classes.length > 0) {
    docs += '\n## Classes\n\n';
    for (const cls of structure.classes) {
      docs += `### ${cls.name}`;
      if (cls.extends) {
        docs += ` *extends ${cls.extends}*\n`;
      }
      docs += `\nLocation: \`${cls.location.file}:${cls.location.line}\`\n\n`;
    }
  }

  // Interfaces
  if (structure.interfaces.length > 0) {
    docs += '\n## Interfaces\n\n';
    for (const iface of structure.interfaces) {
      docs += `### ${iface.name}\n\n`;
      docs += `Location: \`${iface.location.file}:${iface.location.line}\`\n\n`;
    }
  }

  // Functions
  const exportedFunctions = structure.functions.filter(f => f.isExported);
  if (exportedFunctions.length > 0) {
    docs += '\n## Functions\n\n';
    for (const func of exportedFunctions) {
      docs += `### ${func.name}\n\n`;
      docs += `**Parameters:** ${func.params.join(', ') || 'none'}\n\n`;
      if (func.returnType) {
        docs += `**Returns:** \`${func.returnType}\`\n\n`;
      }
      docs += `**Location:** \`${func.location.file}:${func.location.line}\`\n\n`;
    }
  }

  return docs;
}

/**
 * Generate API documentation
 */
function generateAPIDocs(
  structure: CodeStructure,
  options: GenerationOptions
): string {
  let docs = '# API Reference\n\n';
  docs += `Generated automatically by DocGen.ai\n\n`;

  if (structure.functions.length === 0) {
    docs += '> No exported functions found.\n';
    return docs;
  }

  // Group functions by category/location
  const exportedFunctions = structure.functions.filter(f => f.isExported);

  for (const func of exportedFunctions) {
    docs += `## ${func.name}\n\n`;
    docs += `\`\`\`typescript\n${func.name}(${func.params.join(', ')}): ${func.returnType || 'void'}\n\`\`\`\n\n`;

    if (func.description) {
      docs += `${func.description}\n\n`;
    }

    docs += `**Parameters:**\n\n`;
    if (func.params.length > 0) {
      for (const param of func.params) {
        docs += `- \`${param}\`\n`;
      }
    } else {
      docs += 'None\n';
    }

    docs += `\n**Returns:** \`${func.returnType || 'void'}\`\n\n`;
    docs += `**Location:** \`${func.location.file}:${func.location.line}\`\n\n`;
    docs += `---\n\n`;
  }

  return docs;
}

/**
 * Generate app documentation
 */
function generateAppDocs(
  structure: CodeStructure,
  options: GenerationOptions
): string {
  let docs = '# App Structure\n\n';
  docs += `Generated automatically by DocGen.ai\n\n`;

  if (structure.classes.length > 0) {
    docs += '## Components/Classes\n\n';
    for (const cls of structure.classes) {
      docs += `### ${cls.name}\n\n`;
      docs += `Location: \`${cls.location.file}:${cls.location.line}\`\n\n`;
    }
  }

  if (structure.functions.length > 0) {
    docs += '## Functions/Utils\n\n';
    for (const func of structure.functions) {
      docs += `### ${func.name}\n\n`;
      docs += `Location: \`${func.location.file}:${func.location.line}\`\n\n`;
    }
  }

  return docs;
}

/**
 * Write README.md
 */
function writeReadme(structure: CodeStructure, options: GenerationOptions): void {
  let readme = '# Project Documentation\n\n';
  readme += `> Generated automatically by [DocGen.ai](https://docgen.ai)\n\n`;
  readme += 'This documentation was generated automatically from the codebase.\n\n';

  readme += '## Overview\n\n';
  readme += `- **Classes:** ${structure.classes.length}\n`;
  readme += `- **Interfaces:** ${structure.interfaces.length}\n`;
  readme += `- **Exported Functions:** ${structure.functions.filter(f => f.isExported).length}\n`;
  readme += `- **Internal Functions:** ${structure.functions.filter(f => !f.isExported).length}\n\n`;

  // Usage
  readme += '## Usage\n\n';
  if (structure.classes.length > 0) {
    readme += '### Classes\n\n';
    for (const cls of structure.classes) {
      readme += `\`\`\`typescript\nconst instance = new ${cls.name}();\n\`\`\`\n\n`;
    }
  }

  if (structure.functions.filter(f => f.isExported).length > 0) {
    readme += '### Functions\n\n';
    for (const func of structure.functions.filter(f => f.isExported).slice(0, 3)) {
      const params = func.params.length > 0 ? func.params.join(', ') : '';
      readme += `\`\`\`typescript\nimport { ${func.name} } from './module';\n\n${func.name}(${params});\n\`\`\`\n\n`;
    }
  }

  const readmePath = `${options.outputDir}/README.md`;
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(readmePath, readme);
  console.log(`✓ Generated README: ${readmePath}`);
}

/**
 * Write API section
 */
function writeAPISection(structure: CodeStructure, options: GenerationOptions): void {
  const docs = generateAPIDocs(structure, options);
  const fs = require('fs');
  const path = require('path');
  const apiPath = path.join(options.outputDir, 'API.md');
  fs.writeFileSync(apiPath, docs);
  console.log(`✓ Generated API docs: ${apiPath}`);
}

/**
 * Write class section
 */
function writeClassSection(structure: CodeStructure, options: GenerationOptions): void {
  const docs = generateLibraryDocs(structure, options);
  const fs = require('fs');
  const path = require('path');
  const classPath = path.join(options.outputDir, 'CLASSES.md');
  fs.writeFileSync(classPath, docs);
  console.log(`✓ Generated class docs: ${classPath}`);
}

/**
 * Write interface section
 */
function writeInterfaceSection(structure: CodeStructure, options: GenerationOptions): void {
  let docs = '# Interfaces\n\n';
  docs += `Generated automatically by DocGen.ai\n\n`;

  for (const iface of structure.interfaces) {
    docs += `## ${iface.name}\n\n`;
    docs += `**Properties:**\n\n`;
    if (iface.properties.length > 0) {
      for (const prop of iface.properties) {
        docs += `- \`${prop}\`\n`;
      }
    } else {
      docs += 'None\n';
    }
    docs += `\n---\n\n`;
  }

  const fs = require('fs');
  const path = require('path');
  const ifacePath = path.join(options.outputDir, 'INTERFACES.md');
  fs.writeFileSync(ifacePath, docs);
  console.log(`✓ Generated interface docs: ${ifacePath}`);
}
