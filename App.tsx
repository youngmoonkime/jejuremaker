import React, { useState, useEffect } from 'react';
import Discovery from './components/Discovery';
import ProjectDetail from './components/ProjectDetail';
import Workspace from './components/Workspace';
import AdminUpload from './components/AdminUpload';
import { Project } from './types';

// Supabase Configuration
const supabaseUrl = 'https://jbkfsvinitavzyflcuwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia2ZzdmluaXRhdnp5ZmxjdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDAxOTUsImV4cCI6MjA4NDk3NjE5NX0.Nn3_-8Oky-yZ7VwFiiWbhxKdWfqOSz1ddj93fztfMak';

type ViewState = 'discovery' | 'detail' | 'workspace' | 'upload';
export type Language = 'ko' | 'en';

const INITIAL_PROJECTS: Project[] = [
  { id: 'static-1', title: 'Woven Denim Lounge Chair', maker: 'Sarah Jenkins', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtuenibBf4tw0iA0QWK8b6MCSPdrIgd9OKyJFEM3Q1RZjfbdUV5IdvWoTr3iwlxvRv7B2cLyEVdYNtgm8ddX8ATCWblrjXyz3i8jkgVPeyDK4fkz9iYlwxoRL87lbw1aWnJ2Mr3Vjee0NQTCLC5wOSWUN7uQAMVoJW4DUQUaC5ogiHbuKIjW9T0dMbLTnY2OeYVTLb0dFN0S_QSbmDHLoc2-8Htk-PBcoWvLEaXmuMvLddz3lhrEALUEfbgz0Bf79PtYDSrLIc84U', category: 'Textile', time: '4h 30m', difficulty: 'Easy', isAiRemix: true, description: 'An ergonomic lounge chair woven from discarded denim strips.', steps: [{title: 'Frame', desc: 'Build frame from wood.'}, {title: 'Weaving', desc: 'Weave denim strips.'}] },
  { id: 'static-2', title: 'Minimalist Pallet Coffee Table', maker: 'WoodWorkStudio', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtfkCp1u6RQE75IVa1qBK32C6pkRhi_PH7cCop_nLGn1AJzuIT2NqbxN3xYFzGlSG5iMaECKw8rR-g-rwEfhmKPElX1u7y9pUVSXtX2Mm6SGUOmqXZXzz0jmRzh7-t5REfwx67KwSY-8O35EhrDKkvFoeG_cFfhiPg5T1_G0wQ-I62haamEoI0pimhPN_dipCKopy86n4sjsWh610Q3OQaytpYR4o_dxHMh9XGT9FbwxYW17UmqN_HwBJ75w2Sr7jj-o43G4eec6I', category: 'Wood', time: '12h', difficulty: 'Medium', description: 'Simple coffee table made from reclaimed pallets.' },
  { id: 'static-3', title: 'Geometric Glass Bottle Lamp', maker: 'EcoLightz', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlS4kFqDJmMraQ5iv0a245PyOXT8XYd8MBlFFLxPJtdrqUn0u9yxkKxvyyNEdCK6sw0qi0Fdj8KvbWO1W6eYKENQoUuZ7R_PyP-FnTHwQQ1DGW23HkSA-3NeRWPI9u_wt6EPThHJdVowcxji27rda8BeClTySETj_QVB7Tk6dHVnNktPdhJAJgowciBu-oL8alTxfx51rcqoM8sUGo-bbFebqRgQITmWy5eXs9X0QHF40H5VidAwilMdOawkCfpDg5JjhzrI1hXro', category: 'Glass', time: '6h 15m', difficulty: 'Hard', isAiIdea: true },
  { id: 'static-4', title: 'PLA Recycled Vase - Voronoi', maker: 'PrintMaster', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQHmmS6kEqwz9kbWlPRhdyy0rta4aHB3GAgK5Rm_Qn8cb3YVvFE_AFKoQxAy6eIUhnKcvD0ObXAigxK1BXehW9yFwrQTZyEDYslhE6bU6NnjaEr1HEeUwZ0raaBM2qGGcSGpOm3sTBZmH3Fv14XlpRwZkMJ6kOdSxOkearaFWYepnSc8NbJOpnhPBFGTwpju8j0-Ya9eTYL7vBbJekMVO1pl53Yp0dc0jlW6Wph2dNUDIQPVdyr5HGMvKYU0l4ZUuLaHpHLFQHjI', category: '3D Print', time: '8h', difficulty: 'Easy' },
  { id: 'static-5', title: 'Upcycled Mold Concrete Planters', maker: 'UrbanJungle', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb0TA0SOf0Uqj3J-p97g6i8C8z3O_0HdMCVan6SsH2SyoTgZzI6LaxF_7LO9qAAaZBZfalY7ilHXKsBfofkNIERYAFM2CAcgUirkA3GBJJ7T9JlAaDJ1aCz8GWGOUVEfs8VyyErsFOT-bkXyoOSmdyi_w1_YfCkprIPFY7-exWQDDvYlNqjboJDdoNjK5MX6XhoXAPlH1e5OoxeqDbPfVfTWUuxSTaD4QsIY4KRo1QpflpBRCqALG9THR1Fy-fTon6zft8CyjiiV4', category: 'Concrete', time: '24h', difficulty: 'Medium' },
  { id: 'static-6', title: 'Floating Pipe Bookshelves', maker: 'IndustrialChic', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ocu_BWmKGyU8AtIO6vbX0pwjEFsRYpFZHC1NMf3qHUjpB_Bop6bu4OmI0RJzUwWwF7aunaTQvgHSa7SMrAbU2P43_55-IhbPRNPVf4wSHgYEgkT5JpDAfhEKcorGuIKgTehD4tE5hT4PPH-MfgL6LfB_03cpMyTpoPs8kNOYNo5et5VZ87v8L5MlUy-vXYtVLg0jMZ9TyArh2gpfvBjuRuDqUw_wqyX2_xuGzz_Oc1RXxMJwkA2rzJTSiEpkfNF7kTkQ0FRysbM', category: 'Metal', time: '2h', difficulty: 'Medium', isAiRemix: true },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('discovery');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch projects from Supabase on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/items?select=*&order=created_at.desc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Map DB items to Project type
          const mappedProjects: Project[] = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            maker: 'Master Kim', // Default maker for new uploads
            image: item.image_url,
            category: item.category,
            time: item.estimated_time || '2h',
            difficulty: (item.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            isAiRemix: item.is_ai_generated,
            description: item.title + ' - Custom project', // Simplified fallback
            steps: item.metadata?.fabrication_guide || []
          }));
          
          setProjects([...mappedProjects, ...INITIAL_PROJECTS]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'ko' ? 'en' : 'ko');

  const handleUploadComplete = (newProject: Project) => {
    // Add new project to state immediately for responsiveness
    setProjects(prev => [newProject, ...prev]);
    setCurrentView('discovery');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  };

  // Simple view router
  const renderView = () => {
    switch (currentView) {
      case 'discovery':
        return (
          <Discovery 
            onNavigate={(view) => setCurrentView(view)} 
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            projects={projects}
          />
        );
      case 'detail':
        return (
          <ProjectDetail 
            project={selectedProject}
            onBack={() => setCurrentView('discovery')} 
            onOpenWorkspace={() => setCurrentView('workspace')} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
          />
        );
      case 'workspace':
        return (
          <Workspace 
            onExit={() => setCurrentView('detail')} 
            language={language}
          />
        );
      case 'upload':
        return (
          <AdminUpload 
            onBack={() => setCurrentView('discovery')}
            onUploadComplete={handleUploadComplete}
            language={language}
          />
        );
      default:
        return (
          <Discovery 
            onNavigate={(view) => setCurrentView(view)} 
            onProjectSelect={handleProjectSelect}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            language={language}
            toggleLanguage={toggleLanguage}
            projects={projects}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-background-dark' : 'bg-background-light'}`}>
      {renderView()}
    </div>
  );
};

export default App;