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
export declare function generateDocs(structure: CodeStructure, options: GenerationOptions): void;
//# sourceMappingURL=generator.d.ts.map