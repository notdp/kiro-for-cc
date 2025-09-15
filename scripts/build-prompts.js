#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 递归查找所有 .md 文件
function findMarkdownFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// 将 Markdown 文件转换为 TypeScript 模块
function convertMarkdownToTypeScript(mdPath, outputDir) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const { data, content: body } = matter(content);
  
  // 生成 TypeScript 代码
  const tsContent = `// Auto-generated from ${path.relative(process.cwd(), mdPath)}
// DO NOT EDIT MANUALLY

export const frontmatter = ${JSON.stringify(data, null, 2)};

export const content = ${JSON.stringify(body)};

export default {
  frontmatter,
  content
};
`;
  
  // 计算输出路径 - 保持相对目录结构
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const relativePath = path.relative(promptsDir, mdPath);
  const tsFileName = relativePath.replace(/\.md$/, '.ts');
  const tsPath = path.join(outputDir, tsFileName);
  
  // 确保输出目录存在
  const tsDir = path.dirname(tsPath);
  if (!fs.existsSync(tsDir)) {
    fs.mkdirSync(tsDir, { recursive: true });
  }
  
  // 写入文件
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Generated: ${path.relative(process.cwd(), tsPath)}`);
}

// 主函数
function main() {
  const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
  const outputDir = path.join(__dirname, '..', 'src', 'prompts', 'target');
  
  // 确保目录存在
  if (!fs.existsSync(promptsDir)) {
    console.log('Creating prompts directory...');
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    console.log('Creating prompts target directory...');
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 查找并转换所有 Markdown 文件
  const mdFiles = findMarkdownFiles(promptsDir);
  
  if (mdFiles.length === 0) {
    console.log('No markdown files found in', promptsDir);
    return;
  }
  
  console.log(`Converting ${mdFiles.length} markdown files...`);
  mdFiles.forEach(mdFile => convertMarkdownToTypeScript(mdFile, outputDir));
  
  console.log('Build complete!');
}

// 运行
main();