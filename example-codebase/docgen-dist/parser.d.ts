export interface FunctionInfo {
    name: string;
    params: string[];
    returnType?: string;
    description?: string;
    location: {
        file: string;
        line: number;
    };
    isExported: boolean;
    isAsync: boolean;
}
export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: string[];
    extends?: string;
    location: {
        file: string;
        line: number;
    };
}
export interface InterfaceInfo {
    name: string;
    properties: string[];
    methods: FunctionInfo[];
    location: {
        file: string;
        line: number;
    };
}
export interface TypeInfo {
    name: string;
    type: 'primitive' | 'object' | 'array' | 'function' | 'enum';
    values?: string[];
    location?: {
        file: string;
        line: number;
    };
}
export interface CodeStructure {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
    imports: string[];
}
export declare function parseFile(filePath: string): CodeStructure;
export declare function scanDirectory(dirPath: string, extensions?: string[]): CodeStructure;
//# sourceMappingURL=parser.d.ts.map