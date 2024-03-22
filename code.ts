figma.showUI(__html__, { width: 240, height: 100 });

figma.ui.onmessage = async msg => {
  if (msg.type === 'export-images') {
    const selectedNodes = figma.currentPage.selection;
    console.log('Selected Nodes:', selectedNodes.length); // Debugging log

    const imageLayers: SceneNode[] = [];

    function findImageLayers(nodes: ReadonlyArray<SceneNode>): void {
      for (const node of nodes) {
        if ("fills" in node) {
          const fills = node.fills as ReadonlyArray<Paint>;
          for (const fill of fills) {
            if (fill.type === "IMAGE") {
              imageLayers.push(node);
              console.log('Found image layer:', node.name); // Debugging log
              break; // Found an image, no need to check other fills
            }
          }
        }
        if ("children" in node) {
          findImageLayers(node.children);
        }
      }
    }

    findImageLayers(selectedNodes);

    if (imageLayers.length === 0) {
      console.log('No images found in the selected frames.'); // Debugging log
      figma.ui.postMessage({ type: 'no-images-found' });
      return;
    }

    const promises = imageLayers.map(async layer => {
      try {
        const imageBytes = await layer.exportAsync({ format: 'PNG' });
        return {
          name: layer.name,
          data: JSON.stringify(Array.from(imageBytes))
        };
      } catch (error) {
        console.error('Error exporting image:', layer.name, error); // Error handling
        return null;
      }
    });

    Promise.all(promises).then(images => {
      const validImages = images.filter(image => image !== null);
      if (validImages.length > 0) {
        console.log('Sending batch-image-data message with images:', validImages); // Debugging log
        figma.ui.postMessage({ type: 'batch-image-data', images: validImages });
      } else {
        figma.ui.postMessage({ type: 'no-images-found' });
      }
    });
  }
};
