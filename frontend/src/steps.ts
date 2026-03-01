import { Step, StepType } from './types';

// Global counter to ensure unique step IDs across multiple parseXml calls
let globalStepId = 1;

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */
export function parseXml(response: string): Step[] {
    // Preprocess: strip thinking tags (Gemini 2.5 models)
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Strip markdown code fences that may wrap the XML
    cleaned = cleaned.replace(
      /```(?:xml|html|tsx|jsx|typescript|javascript)?\s*\n?([\s\S]*?)```/g,
      '$1',
    );

    // Extract the XML content between <boltArtifact> tags (greedy to handle large content)
    const xmlMatch = cleaned.match(/<boltArtifact[^>]*>([\s\S]*)<\/boltArtifact>/);
    
    if (!xmlMatch) {
      console.warn('[parseXml] No <boltArtifact> found in response');
      return [];
    }
  
    const xmlContent = xmlMatch[1];
    const steps: Step[] = [];
  
    // Extract artifact title
    const titleMatch = cleaned.match(/<boltArtifact[^>]*title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';
  
    // Add initial artifact step
    steps.push({
      id: globalStepId++,
      title: artifactTitle,
      description: '',
      type: StepType.CreateFolder,
      status: 'pending'
    });
  
    // Robust regex: extract full boltAction tag, then parse attributes separately
    const actionRegex = /<boltAction\s+([^>]*)>([\s\S]*?)<\/boltAction>/g;
    
    let match;
    while ((match = actionRegex.exec(xmlContent)) !== null) {
      const [, attrs, content] = match;

      // Parse attributes from the tag
      const typeMatch = attrs.match(/type="([^"]*)"/);
      const filePathMatch = attrs.match(/filePath="([^"]*)"/);

      const type = typeMatch?.[1];
      const filePath = filePathMatch?.[1];

      if (type === 'file') {
        // File creation step
        steps.push({
          id: globalStepId++,
          title: `Create ${filePath || 'file'}`,
          description: '',
          type: StepType.CreateFile,
          status: 'pending',
          code: content.trim(),
          path: filePath
        });
      } else if (type === 'shell') {
        // Shell command step
        steps.push({
          id: globalStepId++,
          title: `Run command`,
          description: '',
          type: StepType.RunScript,
          status: 'pending',
          code: content.trim()
        });
      }
    }
  
    return steps;
  }