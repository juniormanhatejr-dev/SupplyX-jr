import fs from 'fs';
import path from 'path';

export interface ArchitectureCheckResult {
  passed: boolean;
  checks: { name: string; status: 'PASS' | 'FAIL'; details: string }[];
}

export function checkArchitectureIntegrity(): ArchitectureCheckResult {
  console.log('================================================================');
  console.log('         SUPPLYX ARCHITECTURE INTEGRITY CHECK v1.0              ');
  console.log('================================================================\n');

  const rootDir = process.cwd();
  const checks: { name: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  // 1. Framework Check
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const reactVer = pkg.dependencies?.react || '';
    const hasTypeScript = !!pkg.devDependencies?.typescript;
    const hasVite = !!pkg.dependencies?.vite || !!pkg.devDependencies?.vite;
    const hasExpress = !!pkg.dependencies?.express;

    if (reactVer.includes('19') && hasTypeScript && hasVite && hasExpress) {
      checks.push({
        name: 'Core Stack (React 19 + TypeScript + Vite + Express)',
        status: 'PASS',
        details: `React: ${reactVer}, TypeScript: Present, Vite: Present, Express: ${pkg.dependencies?.express}`
      });
    } else {
      checks.push({
        name: 'Core Stack',
        status: 'FAIL',
        details: 'Versão de tecnologias principais divergente da baseline original'
      });
    }

    // 2. Database & Auth
    const hasFirebase = !!pkg.dependencies?.firebase;
    const hasFirebaseAdmin = !!pkg.dependencies?.['firebase-admin'];
    if (hasFirebase && hasFirebaseAdmin) {
      checks.push({
        name: 'Database & Auth (Cloud Firestore + Firebase Auth)',
        status: 'PASS',
        details: 'Firebase SDK & Firebase Admin SDK ativos'
      });
    } else {
      checks.push({
        name: 'Database & Auth',
        status: 'FAIL',
        details: 'SDKs do Firebase ausentes no package.json'
      });
    }
  } else {
    checks.push({
      name: 'package.json Check',
      status: 'FAIL',
      details: 'package.json não encontrado'
    });
  }

  // 3. Security Rules
  const hasFirestoreRules = fs.existsSync(path.join(rootDir, 'firestore.rules'));
  const hasStorageRules = fs.existsSync(path.join(rootDir, 'storage.rules'));
  if (hasFirestoreRules && hasStorageRules) {
    checks.push({
      name: 'Security Rules Files (firestore.rules & storage.rules)',
      status: 'PASS',
      details: 'Arquivos de regras declarativas presentes no root'
    });
  } else {
    checks.push({
      name: 'Security Rules Files',
      status: 'FAIL',
      details: 'firestore.rules ou storage.rules ausente'
    });
  }

  // 4. Server Entry Point & Port
  const serverPath = path.join(rootDir, 'server.ts');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf-8');
    const bindsPort3000 = serverContent.includes('3000') && serverContent.includes('0.0.0.0');
    const hasViteMiddleware = serverContent.includes('createViteServer');
    if (bindsPort3000 && hasViteMiddleware) {
      checks.push({
        name: 'Backend Architecture (server.ts with port 3000 & Vite Middleware)',
        status: 'PASS',
        details: 'Servidor escuta em 0.0.0.0:3000 com middleware Vite integrado'
      });
    } else {
      checks.push({
        name: 'Backend Architecture',
        status: 'FAIL',
        details: 'server.ts não está configurado para porta 3000 ou falta middleware Vite'
      });
    }
  } else {
    checks.push({
      name: 'Server Entry',
      status: 'FAIL',
      details: 'server.ts não encontrado'
    });
  }

  // 5. Frontend Entry & Offline Engine
  const hasMain = fs.existsSync(path.join(rootDir, 'src/main.tsx'));
  const hasApp = fs.existsSync(path.join(rootDir, 'src/App.tsx'));
  const hasIndexHtml = fs.existsSync(path.join(rootDir, 'index.html'));
  if (hasMain && hasApp && hasIndexHtml) {
    checks.push({
      name: 'Frontend Entry Points (index.html, main.tsx, App.tsx)',
      status: 'PASS',
      details: 'Estrutura SPA Vite padrão intacta'
    });
  } else {
    checks.push({
      name: 'Frontend Entry Points',
      status: 'FAIL',
      details: 'Arquivos fundamentais do frontend ausentes'
    });
  }

  for (const c of checks) {
    const icon = c.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[ARCHITECTURE] ${icon} - ${c.name}`);
    console.log(`   Detalhes: ${c.details}`);
  }

  const passed = checks.every(c => c.status === 'PASS');
  console.log('\n================================================================');
  console.log(`STATUS DA ARQUITETURA: ${passed ? '🟢 PRESERVADA (UNCHANGED)' : '🔴 ARCHITECTURE_CHANGE_DETECTED'}`);
  console.log('================================================================\n');

  return { passed, checks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { passed } = checkArchitectureIntegrity();
  if (!passed) {
    console.error('[ARCHITECTURE_CHANGE_DETECTED] Modificação arquitetural detectada!');
    process.exit(1);
  } else {
    process.exit(0);
  }
}
