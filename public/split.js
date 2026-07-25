const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');

// Using regex to find the blocks in the first instance of the code (before line 1500)
// Themes are at the top (lines 1 to 166)
const themesEnd = css.indexOf('* {');
const themesCss = css.substring(0, themesEnd);

const restCss = css.substring(themesEnd);

fs.writeFileSync('css/themes.css', themesCss);

// Now I will just copy the entire style.css to css/legacy.css to not lose anything
fs.writeFileSync('css/legacy.css', css);

// And we create empty placeholders for the pages as the user requested
const pages = ['dashboard', 'estoque', 'produtos', 'historico', 'configuracoes'];
for (const page of pages) {
    if (!fs.existsSync(`css/${page}.css`)) {
        fs.writeFileSync(`css/${page}.css`, `/* Estilos especificos para ${page} */\n`);
    }
}
