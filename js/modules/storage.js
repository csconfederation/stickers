export class StorageManager {
  constructor() {
    this.storageKey = 'csc_signature_projects';
    this.currentProjectKey = 'csc_signature_current';
  }

  saveProject(projectData) {
    const project = {
      id: Date.now().toString(),
      name: projectData.name || `Project ${new Date().toLocaleDateString()}`,
      state: projectData.state,
      signature: projectData.signature,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    // Save to current
    localStorage.setItem(this.currentProjectKey, JSON.stringify(project));
    
    // Add to projects list
    const projects = this.getProjects();
    projects.unshift(project);
    
    // Keep only last 10 projects
    if (projects.length > 10) {
      projects.pop();
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
    
    return project.id;
  }

  loadProject(projectId) {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId);
  }

  loadCurrentProject() {
    const saved = localStorage.getItem(this.currentProjectKey);
    return saved ? JSON.parse(saved) : null;
  }

  getProjects() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  deleteProject(projectId) {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  exportProject(projectData) {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `csc_signature_project_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importProject(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target.result);
          resolve(project);
        } catch (err) {
          reject(new Error('Invalid project file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}