// Simple test script to verify the unified frontend setup
console.log('🧪 Testing Unified Frontend Setup...\n');

// Test 1: Check if all main files exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tailwind.config.js',
    'tsconfig.json',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/components/Layout.tsx',
    'src/lib/api.ts',
    'src/lib/validation.ts'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Test 2: Check if all page directories exist
const pageDirectories = [
    'src/pages/financial',
    'src/pages/event', 
    'src/pages/feedback',
    'src/pages/transport',
    'src/pages/user'
];

console.log('\n📂 Checking page directories...');
pageDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}`);
    } else {
        console.log(`❌ ${dir} - MISSING`);
        allFilesExist = false;
    }
});

// Test 3: Check if all UI components exist
const uiComponents = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Input.tsx',
    'src/components/ui/Select.tsx',
    'src/components/ui/Table.tsx',
    'src/components/ui/Badge.tsx',
    'src/components/ui/PageHeader.tsx',
    'src/components/ui/PieChart.tsx',
    'src/components/ui/BarChart.tsx'
];

console.log('\n🎨 Checking UI components...');
uiComponents.forEach(component => {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
        console.log(`✅ ${component}`);
    } else {
        console.log(`❌ ${component} - MISSING`);
        allFilesExist = false;
    }
});

// Test 4: Check package.json dependencies
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'tailwindcss', 'typescript', 'vite'];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
            console.log(`✅ ${dep}`);
        } else {
            console.log(`❌ ${dep} - MISSING`);
            allFilesExist = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json');
    allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 All tests passed! Unified frontend is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run dev');
    console.log('3. Open: http://localhost:3000');
} else {
    console.log('❌ Some tests failed. Please check the missing files.');
}
console.log('='.repeat(50));
