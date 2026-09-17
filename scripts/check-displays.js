const { app, screen } = require('electron');

app.whenReady().then(() => {
  const primary = screen.getPrimaryDisplay();
  const all = screen.getAllDisplays();
  console.log('PRIMARY_DISPLAY:', JSON.stringify({
    id: primary.id,
    label: primary.label,
    bounds: primary.bounds,
    internal: primary.internal,
  }));
  console.log('ALL_DISPLAYS:', JSON.stringify(all.map(d => ({
    id: d.id,
    label: d.label,
    bounds: d.bounds,
    internal: d.internal,
  }))));
  app.quit();
});
