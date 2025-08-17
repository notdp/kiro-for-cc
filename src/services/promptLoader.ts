import * as Handlebars from 'handlebars';
import { 
  PromptTemplate, 
  PromptMetadata, 
  PromptFrontmatter,
  ValidationResult 
} from '../types/prompt.types';

// Import all prompts from index
import * as prompts from '../prompts/target';

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
   * Initialize the loader by loading all prompts
   */
  public initialize(): void {
    // Clear existing data
    this.prompts.clear();
    this.compiledTemplates.clear();

    // Load all prompts
    const promptModules = Object.values(prompts);

    // Register each prompt
    for (const module of promptModules) {
      if (module.frontmatter && module.content) {
        this.registerPrompt(module as PromptTemplate);
      }
    }
  }

  /**
   * Register a prompt template
   */
  private registerPrompt(template: PromptTemplate): void {
    const { id } = template.frontmatter;
    
    // Store the template
    this.prompts.set(id, template);
    
    // Compile the template
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

    // Validate required variables
    const validation = this.validateVariables(template.frontmatter, variables);
    if (!validation.valid) {
      throw new Error(`Variable validation failed: ${validation.errors?.join(', ')}`);
    }

    // Render the template
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
      const category = id.split('-')[0]; // Extract category from ID
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