import html2canvas from 'html2canvas';

export async function exportCanvasToPNG(projectName: string = 'Xteon_Rig_Schematic'): Promise<void> {
  const flowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!flowElement) {
    alert('Canvas element not found for export.');
    return;
  }

  try {
    const canvas = await html2canvas(flowElement, {
      backgroundColor: '#07090E',
      scale: 2, // High-definition 2x capture
      useCORS: true,
      logging: false,
      ignoreElements: (el) => {
        // Exclude zoom controls and minimap from clean schematic export
        return el.classList.contains('react-flow__controls') || el.classList.contains('react-flow__minimap');
      },
    });

    const safeTitle = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_Schematic_${new Date().toISOString().split('T')[0]}.png`;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export canvas to PNG:', err);
    alert('Could not export canvas image.');
  }
}
