// VSCode configuration namespace for this extension
export const VSC_CONFIG_NAMESPACE = 'spec-ai-coder';

// File names
export const CONFIG_FILE_NAME = 'spec-ai-coder-settings.json';

// Default configuration
export const DEFAULT_CONFIG = {
    paths: {
        specs: '.claude/specs',
        steering: '.claude/steering',
        settings: '.claude/settings'
    },
    views: {
        specs: true,
        steering: true,
        mcp: true,
        hooks: true,
        settings: false
    }
} as const;

// Legacy exports for backward compatibility (can be removed after updating all references)
export const DEFAULT_PATHS = DEFAULT_CONFIG.paths;
export const DEFAULT_VIEW_VISIBILITY = DEFAULT_CONFIG.views;