import { parse } from '@babel/parser';
import * as t from '@babel/types';
import * as fs from 'fs';
import * as path from 'path';

export interface FunctionInfo {
  name: string;
  params: string[];
  returnType?: string;
  description?: string;
  location: { file: string; line: number };
  isExported: boolean;
  isAsync: boolean;
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: string[];
  extends?: string;
  location: { file: string; line: number };
}

export interface InterfaceInfo {
  name: string;
  properties: string[];
  methods: FunctionInfo[];
  location: { file: string; line: number };
}

export interface TypeInfo {
  name: string;
  type: 'primitive' | 'object' | 'array' | 'function' | 'enum';
  values?: string[];
  location?: { file: string; line: number };
}

export interface CodeStructure {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
  imports: string[];
}

/**
 * Parse JavaScript/TypeScript file and extract code structure
 */
export function parseFile(filePath: string): CodeStructure {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const structure: CodeStructure = {
    functions: [],
    classes: [],
    interfaces: [],
    types: [],
    imports: [],
  };

  // Traverse AST
  const visitor = {
    // Extract imports
    ImportDeclaration(path: any) {
      if (path.node.source?.value) {
        structure.imports.push(path.node.source.value);
      }
    },

    // Extract function declarations
    FunctionDeclaration(path: any) {
      const node = path.node;
      const funcInfo: FunctionInfo = {
        name: node.id?.name || 'anonymous',
        params: node.params.map((p: any) => p.name || p.type?.name || '').join(', '),
        returnType: node.returnType?.type?.name,
        location: { file: filePath, line: node.loc?.start.line || 0 },
        isExported: false,
        isAsync: node.async || false,
      };
      structure.functions.push(funcInfo);
    },

    // Export named functions
    ExportNamedDeclaration(path: any) {
      const node = path.node.declaration;
      if (node?.type === 'FunctionDeclaration') {
        const funcInfo: FunctionInfo = {
          name: node.id?.name || 'anonymous',
          params: node.params.map((p: any) => p.name || '').join(', ''),
          returnType: node.returnType?.type?.name,
          location: { file: filePath, line: node.loc?.start.line || 0 },
          isExported: true,
          isAsync: node.async || false,
        };
        structure.functions.push(funcInfo);
      }
    },

    // Extract class declarations
    ClassDeclaration(path: any) {
      const node = path.node;
      const classInfo: ClassInfo = {
        name: node.id?.name || 'Anonymous',
        methods: [],
        properties: [],
        extends: node.superClass?.name,
        location: { file: filePath, line: node.loc?.start.line || 0 },
      };
      structure.classes.push(classInfo);
    },

    // Extract class methods
    ClassMethod(path: any) {
      const node = path.node;
      const methodInfo: FunctionInfo = {
        name: node.key?.name || 'method',
        params: node.params?.map((p: any) => p.name || p.type?.name || '').join(', ') || '',
        returnType: node.returnType?.type?.name,
        location: { file: filePath, line: node.loc?.start.line || 0 },
        isExported: false,
        isAsync: node.async || false,
      };

      // Find parent class and add method
      const parent = path.findParent((p: any) => p.type === 'ClassDeclaration');
      if (parent?.node?.name) {
        const parentClass = structure.classes.find(c => c.name === parent.node.name);
        if (parentClass) {
          parentClass.methods.push(methodInfo);
        }
      }
    },

    // Extract interface declarations
    TSInterfaceDeclaration(path: any) {
      const node = path.node;
      const interfaceInfo: InterfaceInfo = {
        name: node.id?.name || 'Unnamed',
        properties: [],
        methods: [],
        location: { file: filePath, line: node.loc?.start.line || 0 },
      };
      structure.interfaces.push(interfaceInfo);
    },

    // Extract interface properties
    TSPropertySignature(path: any) {
      const node = path.node;
      const propertyName = node.key?.name || 'unnamed';
      const parent = path.findParent((p: any) => p.type === 'TSInterfaceDeclaration');
      if (parent?.node?.name) {
        const parentInterface = structure.interfaces.find(i => i.name === parent.node.name);
        if (parentInterface) {
          parentInterface.properties.push(propertyName);
        }
      }
    },

    // Extract type aliases
    TSTypeAliasDeclaration(path: any) {
      const node = path.node;
      const typeInfo: TypeInfo = {
        name: node.id?.name || 'Unnamed',
        type: 'object', // Simplified for now
        location: { file: filePath, line: node.loc?.start.line || 0 },
      };
      structure.types.push(typeInfo);
    },
  };

  // Walk the AST
  // @ts-ignore - visitor types
  // @ts-ignore - traverse function
  // @ts-ignore
  (ast as any).traverse(visitor);

  return structure;
}

/**
 * Scan directory recursively and parse all matching files
 */
export function scanDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): CodeStructure {
  const structure: CodeStructure = {
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

/**
 * Get all files in directory recursively
 */
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];

  function scan(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries as any[]) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
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
