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
        const functionMatch = trimmed.match(/(?:export\s+(?:async\s+)?function\s+|async\s+|)(\w+)\s*\(([^)]*)\)\s*(?::\s*(\w+))?/);
        if (functionMatch) {
            const isAsync = functionMatch[2]?.includes('async');
            const name = functionMatch[3] || functionMatch[4];
            const paramsStr = functionMatch[5] || '';
            const params = paramsStr ? paramsStr.split(',').map((p) => p.trim()) : [];
            const returnType = functionMatch[6] || 'void';
            const isExport = trimmed.includes('export');
            structure.functions.push({
                name,
                params,
                returnType,
                location: { file: filePath, line: i + 1 },
                isExport,
                isAsync,
            });
            continue;
        }
        const classMatch = trimmed.match(/(?:export\s+class\s+|class\s+)(\w+)(?:\s+extends\s+(\w+))?/);
        if (classMatch) {
            const isExport = trimmed.includes('export');
            const name = classMatch[2] || classMatch[3];
            const extendsClass = classMatch[4] || undefined;
            structure.classes.push({
                name,
                methods: [],
                properties: [],
                extends: extendsClass,
                location: { file: filePath, line: i + 1 },
                isExport,
            });
            continue;
        }
        const interfaceMatch = trimmed.match(/(?:export\s+interface\s+|interface\s+)(\w+)\s*\{/);
        if (interfaceMatch) {
            const isExport = trimmed.includes('export');
            const name = interfaceMatch[2] || interfaceMatch[3];
            structure.interfaces.push({
                name,
                properties: [],
                methods: [],
                location: { file: filePath, line: i + 1 },
            });
            continue;
        }
        const typeMatch = trimmed.match(/(?:export\s+type\s+|type\s+)(\w+)\s*=\s*(.+?);/);
        if (typeMatch) {
            const name = typeMatch[2] || typeMatch[3];
            const typeDef = typeMatch[4] || 'any';
            structure.types.push({
                name,
                type: typeDef.includes('interface') ? 'object' : 'primitive',
                location: { file: filePath, line: i + 1 },
            });
            continue;
        }
        const importMatch = trimmed.match(/import\s+(?:\{[^}]+\}|\w+(?:\s*,\s*\w+)*)\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
            const imported = importMatch[1] || importMatch[2];
            structure.imports.push(imported);
            continue;
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