import { parse } from '@babel/parser';
import * as fs from 'fs';
import * as path from 'path';
export function parseFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    const structure = {
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        imports: [],
    };
    const visitor = {
        ImportDeclaration(path) {
            if (path.node.source?.value) {
                structure.imports.push(path.node.source.value);
            }
        },
        FunctionDeclaration(path) {
            const node = path.node;
            const funcInfo = {
                name: node.id?.name || 'anonymous',
                params: node.params.map((p) => p.name || p.type?.name || '').join(', '),
                returnType: node.returnType?.type?.name,
                location: { file: filePath, line: node.loc?.start.line || 0 },
                isExported: false,
                isAsync: node.async || false,
            };
            structure.functions.push(funcInfo);
        },
        ExportNamedDeclaration(path) {
            const node = path.node.declaration;
            if (node?.type === 'FunctionDeclaration') {
                const funcInfo = {
                    name: node.id?.name || 'anonymous',
                    params: node.params.map((p) => p.name || '').join(', '),
                    returnType: node.returnType?.type?.name,
                    location: { file: filePath, line: node.loc?.start.line || 0 },
                    isExported: true,
                    isAsync: node.async || false,
                };
                structure.functions.push(funcInfo);
            }
        },
        ClassDeclaration(path) {
            const node = path.node;
            const classInfo = {
                name: node.id?.name || 'Anonymous',
                methods: [],
                properties: [],
                extends: node.superClass?.name,
                location: { file: filePath, line: node.loc?.start.line || 0 },
            };
            structure.classes.push(classInfo);
        },
        ClassMethod(path) {
            const node = path.node;
            const methodInfo = {
                name: node.key?.name || 'method',
                params: node.params?.map((p) => p.name || p.type?.name || '').join(', '),
                returnType: node.returnType?.type?.name,
                location: { file: filePath, line: node.loc?.start.line || 0 },
                isExported: false,
                isAsync: node.async || false,
            };
            const parent = path.findParent((p) => p.type === 'ClassDeclaration');
            if (parent?.node?.name) {
                const parentClass = structure.classes.find(c => c.name === parent.node.name);
                if (parentClass) {
                    parentClass.methods.push(methodInfo);
                }
            }
        },
        TSInterfaceDeclaration(path) {
            const node = path.node;
            const interfaceInfo = {
                name: node.id?.name || 'Unnamed',
                properties: [],
                methods: [],
                location: { file: filePath, line: node.loc?.start.line || 0 },
            };
            structure.interfaces.push(interfaceInfo);
        },
        TSPropertySignature(path) {
            const node = path.node;
            const propertyName = node.key?.name || 'unnamed';
            const parent = path.findParent((p) => p.type === 'TSInterfaceDeclaration');
            if (parent?.node?.name) {
                const parentInterface = structure.interfaces.find(i => i.name === parent.node.name);
                if (parentInterface) {
                    parentInterface.properties.push(propertyName);
                }
            }
        },
        TSTypeAliasDeclaration(path) {
            const node = path.node;
            const typeInfo = {
                name: node.id?.name || 'Unnamed',
                type: 'object',
                location: { file: filePath, line: node.loc?.start.line || 0 },
            };
            structure.types.push(typeInfo);
        },
    };
    ast.traverse(visitor);
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
        }
        catch (error) {
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
            }
            else if (extensions.some(ext => entry.name.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    }
    scan(dirPath);
    return files;
}
//# sourceMappingURL=parser.js.map