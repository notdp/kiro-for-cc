import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import matter from 'gray-matter';
import { 
  PromptTemplate, 
  PromptMetadata, 
  PromptFrontmatter,
  ValidationResult 
} from '../types/prompt.types';


/**
 * Service for loading and rendering prompt templates
 */
export class PromptLoader {
  private static instance: PromptLoader;
  private prompts: Map<string, PromptTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PromptLoader {
    if (!PromptLoader.instance) {
      PromptLoader.instance = new PromptLoader();
    }
    return PromptLoader.instance;
  }

  /**
   * Initialize the loader by loading all prompts from the filesystem
   */
  public initialize(): void {
    this.prompts.clear();
    this.compiledTemplates.clear();

    const promptsDir = path.join(__dirname, '..', 'prompts');
    const files = glob.sync('**/*.md', { cwd: promptsDir });

    for (const file of files) {
        const filePath = path.join(promptsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        const frontmatter = data as PromptFrontmatter;

        if (frontmatter && frontmatter.id && content) {
            this.registerPrompt({ frontmatter, content });
        }
    }
  }

  /**
   * Register a prompt template
   */
  private registerPrompt(template: PromptTemplate): void {
    const { id } = template.frontmatter;
    
    this.prompts.set(id, template);
    
    try {
      const compiled = Handlebars.compile(template.content);
      this.compiledTemplates.set(id, compiled);
    } catch (error) {
      console.error(`Failed to compile template ${id}:`, error);
    }
  }

  /**
   * Load a prompt template by ID
   */
  public loadPrompt(promptId: string): PromptTemplate {
    const template = this.prompts.get(promptId);
    if (!template) {
      throw new Error(`Prompt not found: ${promptId}. Available prompts: ${Array.from(this.prompts.keys()).join(', ')}`);
    }
    return template;
  }

  /**
   * Render a prompt with variables
   */
  public renderPrompt(promptId: string, variables: Record<string, any> = {}): string {
    const template = this.loadPrompt(promptId);
    const compiled = this.compiledTemplates.get(promptId);
    
    if (!compiled) {
      throw new Error(`Compiled template not found: ${promptId}`);
    }

    const validation = this.validateVariables(template.frontmatter, variables);
    if (!validation.valid) {
      throw new Error(`Variable validation failed: ${validation.errors?.join(', ')}`);
    }

    try {
      return compiled(variables);
    } catch (error) {
      throw new Error(`Failed to render template ${promptId}: ${error}`);
    }
  }

  /**
   * Validate variables against template requirements
   */
  private validateVariables(frontmatter: PromptFrontmatter, variables: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    if (frontmatter.variables) {
      for (const [name, definition] of Object.entries(frontmatter.variables)) {
        if (definition.required && !(name in variables)) {
          errors.push(`Missing required variable: ${name}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * List all available prompts
   */
  public listPrompts(): PromptMetadata[] {
    const metadata: PromptMetadata[] = [];

    for (const [id, template] of this.prompts) {
      const category = id.split('-')[0];
      metadata.push({
        id,
        name: template.frontmatter.name,
        version: template.frontmatter.version,
        description: template.frontmatter.description,
        category
      });
    }

    return metadata;
  }
}