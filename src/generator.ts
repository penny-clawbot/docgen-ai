import * as fs from 'fs';
import * as path from 'path';
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

  writeReadme(structure, options);

  if (structure.functions.length > 0) {
    writeAPISection(structure, options);
  }

  if (structure.classes.length > 0) {
    writeClassSection(structure, options);
  }

  if (structure.interfaces.length > 0) {
    writeInterfaceSection(structure, options);
  }
}

function generateLibraryDocs(
  structure: CodeStructure,
  options: GenerationOptions
): string {
  let docs = '';

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

  if (structure.interfaces.length > 0) {
    docs += '\n## Interfaces\n\n';
    for (const iface of structure.interfaces) {
      docs += `### ${iface.name}\n\n`;
      docs += `Location: \`${iface.location.file}:${iface.location.line}\`\n\n`;
    }
  }

  const exported = structure.functions.filter((f: any) => f.isExported);
  if (exported.length > 0) {
    docs += '\n## Functions\n\n';
    for (const func of exported) {
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

  const exported = structure.functions.filter((f: any) => f.isExported);

  for (const func of exported) {
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

function writeReadme(structure: CodeStructure, options: GenerationOptions): void {
  let readme = '# Project Documentation\n\n';
  readme += `> Generated automatically by [DocGen.ai](https://docgen.ai)\n\n`;
  readme += 'This documentation was generated automatically from codebase.\n\n';

  readme += '## Overview\n\n';
  readme += `- **Classes:** ${structure.classes.length}\n`;
  readme += `- **Interfaces:** ${structure.interfaces.length}\n`;
  readme += `- **Exported Functions:** ${structure.functions.filter((f: any) => f.isExported).length}\n`;
  readme += `- **Internal Functions:** ${structure.functions.filter((f: any) => !f.isExported).length}\n\n`;

  readme += '## Usage\n\n';

  if (structure.classes.length > 0) {
    readme += '### Classes\n\n';
    for (const cls of structure.classes) {
      readme += `\`\`\`typescript\nconst instance = new ${cls.name}();\n\`\`\`\n\n`;
    }
  }

  const exported = structure.functions.filter((f: any) => f.isExported);
  if (exported.length > 0) {
    readme += '### Functions\n\n';
    for (const func of exported.slice(0, 3)) {
      const params = func.params.length > 0 ? func.params.join(', ') : '';
      readme += `\`\`\`typescript\nimport { ${func.name} } from './module';\n\n${func.name}(${params});\n\`\`\`\n\n`;
    }
  }

  const readmePath = path.join(options.outputDir, 'README.md');
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(readmePath, readme);
  console.log(`Generated README: ${readmePath}`);
}

function writeAPISection(structure: CodeStructure, options: GenerationOptions): void {
  const docs = generateAPIDocs(structure, options);
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'API.md'), docs);
  console.log(`Generated API docs: ${path.join(options.outputDir, 'API.md')}`);
}

function writeClassSection(structure: CodeStructure, options: GenerationOptions): void {
  const docs = generateLibraryDocs(structure, options);
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'CLASSES.md'), docs);
  console.log(`Generated class docs: ${path.join(options.outputDir, 'CLASSES.md')}`);
}

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

  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'INTERFACES.md'), docs);
  console.log(`Generated interface docs: ${path.join(options.outputDir, 'INTERFACES.md')}`);
}
