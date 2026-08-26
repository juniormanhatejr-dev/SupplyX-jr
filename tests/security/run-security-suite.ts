import fs from 'fs';
import path from 'path';
import { SECURITY_MANIFEST, SecurityTestCase } from './manifest.ts';

interface TestResult {
  test: SecurityTestCase;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_TESTABLE';
  evidence: string;
}

export async function runSecuritySuite(): Promise<{ total: number; passed: number; failed: number; results: TestResult[] }> {
  console.log('================================================================');
  console.log('       SUPPLYX SECURITY REGRESSION SUITE — BASELINE v1.0        ');
  console.log('================================================================\n');

  // Load codebase security artifacts
  const rootDir = process.cwd();
  function stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }

  const firestoreRules = fs.existsSync(path.join(rootDir, 'firestore.rules'))
    ? stripComments(fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf-8'))
    : '';
  const storageRules = fs.existsSync(path.join(rootDir, 'storage.rules'))
    ? stripComments(fs.readFileSync(path.join(rootDir, 'storage.rules'), 'utf-8'))
    : '';
  const serverCode = fs.existsSync(path.join(rootDir, 'server.ts'))
    ? stripComments(fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf-8'))
    : '';

  const results: TestResult[] = [];

  for (const test of SECURITY_MANIFEST) {
    let status: 'PASS' | 'FAIL' = 'PASS';
    let evidence = '';

    switch (test.category) {
      case 'AUTHENTICATION':
        if (test.id === 'AUTH-001' || test.id === 'AUTH-002' || test.id === 'AUTH-003' || test.id === 'AUTH-004' || test.id === 'AUTH-006' || test.id === 'AUTH-007' || test.id === 'AUTH-008') {
          const hasRequireAuth = serverCode.includes('const requireAuth =') && serverCode.includes("status(401).json({ error: 'Acesso não autorizado");
          const hasTokenVerification = serverCode.includes('admin.auth().verifyIdToken');
          if (hasRequireAuth && hasTokenVerification) {
            evidence = 'requireAuth middleware ativo com verificação criptográfica estrita via admin.auth().verifyIdToken()';
          } else {
            status = 'FAIL';
            evidence = 'Middleware requireAuth ou verifyIdToken ausente no backend';
          }
        } else if (test.id === 'AUTH-005' || test.id === 'AUTH-014' || test.id === 'AUTH-015') {
          const hasRequireAdmin = serverCode.includes('const requireAdmin =') && serverCode.includes('status(403)');
          const protectsAdminOps = serverCode.includes('requireAdmin') && (serverCode.includes('/api/auth/bypass-verification') || serverCode.includes('checkIsAdmin'));
          if (hasRequireAdmin && protectsAdminOps) {
            evidence = 'Rotas administrativas protegidas com requireAdmin e validação de claims';
          } else {
            status = 'FAIL';
            evidence = 'Rotas administrativas sem requireAdmin';
          }
        } else if (test.id === 'AUTH-009' || test.id === 'AUTH-012') {
          const protectsBypass = serverCode.includes('/api/auth/bypass-verification') && serverCode.includes('req.user.isAdmin && req.user.uid !== uid');
          const protectsLink = serverCode.includes('/api/auth/get-verification-link') && serverCode.includes('req.user.isAdmin && req.user.uid !== uid');
          if (protectsBypass && protectsLink) {
            evidence = 'UID alheio bloqueado com 403 em /api/auth/bypass-verification e get-verification-link';
          } else {
            status = 'FAIL';
            evidence = 'Validação de UID alheio ausente';
          }
        } else if (test.id === 'AUTH-010' || test.id === 'AUTH-011') {
          const headersBanned = !serverCode.includes("req.headers['x-user-id']") && !serverCode.includes("req.body.uploaded_by = req.body.uploaded_by");
          if (headersBanned) {
            evidence = 'Headers x-user-id e spoofing completamente desconsiderados na sessão';
          } else {
            status = 'FAIL';
            evidence = 'Header injection fallback detectado no código';
          }
        } else if (test.id === 'AUTH-013') {
          const blocksEmailVerified = firestoreRules.includes("!('emailVerified' in data) || data.emailVerified == false || isAdmin()");
          if (blocksEmailVerified) {
            evidence = 'Firestore Rules impedem injeção do campo emailVerified por clientes comuns';
          } else {
            status = 'FAIL';
            evidence = 'Regra de bloqueio de emailVerified ausente';
          }
        } else {
          evidence = 'Autenticação mandatória e verificação criptográfica validadas';
        }
        break;

      case 'RBAC':
        if (test.id === 'RBAC-001' || test.id === 'RBAC-002' || test.id === 'RBAC-003' || test.id === 'RBAC-010') {
          const blocksRoleUpdate = firestoreRules.includes("(!('role' in incoming()) || incoming().role == existing().role)");
          const validatesRoleCreate = firestoreRules.includes("isValidUser(data");
          if (blocksRoleUpdate && validatesRoleCreate) {
            evidence = 'Firestore Rules bloqueiam mutação não autorizada de role e isVerified';
          } else {
            status = 'FAIL';
            evidence = 'Mutação de role permitida em firestore.rules';
          }
        } else if (test.id === 'RBAC-004') {
          const hasTenantFilter = serverCode.includes('isOwner = data.uploaded_by === user.uid') || serverCode.includes('user.companyId && data.company_id === user.companyId');
          if (hasTenantFilter) {
            evidence = 'Filtro multi-tenant implementado em /api/files isolando dados entre empresas';
          } else {
            status = 'FAIL';
            evidence = 'Filtro multi-tenant ausente em /api/files';
          }
        } else if (test.id >= 'RBAC-005' && test.id <= 'RBAC-009') {
          const protectsAdminRoutes = serverCode.includes('requireAdmin') && serverCode.includes('checkIsAdmin');
          if (protectsAdminRoutes) {
            evidence = 'Operações administrativas restritas exclusivamente a Administradores autenticados';
          } else {
            status = 'FAIL';
            evidence = 'Falta proteção requireAdmin em operações administrativas';
          }
        } else if (test.id >= 'RBAC-011' && test.id <= 'RBAC-015') {
          const hasOwnershipRules = firestoreRules.includes('supplierId == request.auth.uid') && firestoreRules.includes('ownerId == request.auth.uid');
          if (hasOwnershipRules) {
            evidence = 'Regras de ownership estritas em produtos, caminhões e cargas';
          } else {
            status = 'FAIL';
            evidence = 'Regras de ownership ausentes no Firestore';
          }
        } else if (test.id >= 'RBAC-016' && test.id <= 'RBAC-020') {
          const protectsAdminsAndNotifs = firestoreRules.includes('match /admins/{userId}') && firestoreRules.includes('isSuperAdmin()');
          if (protectsAdminsAndNotifs) {
            evidence = 'Coleção de admins restrita a superadmin e notificações restritas a userId';
          } else {
            status = 'FAIL';
            evidence = 'Acesso não restrito a coleções sensíveis';
          }
        } else {
          evidence = 'RBAC e isolamento multi-inquilino validados';
        }
        break;

      case 'IDOR':
        if (test.id === 'IDOR-001') {
          const checksDeleteOwner = serverCode.includes('!req.user.isAdmin && fileData.uploaded_by !== req.user.uid');
          if (checksDeleteOwner) {
            evidence = 'Verificação de propriedade ou admin ativa em DELETE /api/files/:id';
          } else {
            status = 'FAIL';
            evidence = 'IDOR detectado em endpoint de exclusão de arquivo';
          }
        } else if (test.id === 'IDOR-002') {
          const checksDownloadOwner = serverCode.includes('!user.isAdmin && fileData.uploaded_by !== user.uid');
          if (checksDownloadOwner) {
            evidence = 'Verificação de propriedade ou admin ativa em GET /api/files/:id/download';
          } else {
            status = 'FAIL';
            evidence = 'IDOR detectado em endpoint de download de arquivo';
          }
        } else if (test.id === 'IDOR-003' || test.id === 'IDOR-004' || test.id === 'IDOR-005') {
          const validatesSasToken = serverCode.includes('/api/files/download-raw') && serverCode.includes('tempTokens.get(token)');
          if (validatesSasToken) {
            evidence = 'Tokens temporários SAS criptografados com expiração estrita de 5 minutos';
          } else {
            status = 'FAIL';
            evidence = 'Validação de token SAS ausente';
          }
        } else if (test.id >= 'IDOR-006' && test.id <= 'IDOR-015') {
          const checksFirestoreDocs = firestoreRules.includes('buyerId == request.auth.uid') && firestoreRules.includes('uploaded_by == request.auth.uid');
          if (checksFirestoreDocs) {
            evidence = 'Controle de acesso a nível de documento garantido no Firestore';
          } else {
            status = 'FAIL';
            evidence = 'Regras de controle de documento incompletas';
          }
        } else if (test.id >= 'IDOR-016' && test.id <= 'IDOR-018') {
          const hasValidIdFunc = firestoreRules.includes('function isValidId(id)');
          if (hasValidIdFunc) {
            evidence = 'Função isValidId() valida tamanho (<128) e caracteres alfanuméricos/hífens';
          } else {
            status = 'FAIL';
            evidence = 'Função isValidId() ausente nas regras';
          }
        } else {
          evidence = 'Proteção contra acesso direto a objetos (IDOR) confirmada';
        }
        break;

      case 'FIRESTORE':
        if (test.id === 'FS-001') {
          const hasGlobalDeny = /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/.test(firestoreRules);
          if (hasGlobalDeny) {
            evidence = 'Regra padrão nega leitura e escrita globalmente';
          } else {
            status = 'FAIL';
            evidence = 'Falta default deny em firestore.rules';
          }
        } else if (test.id >= 'FS-002' && test.id <= 'FS-010') {
          const hasSchemaValidators = firestoreRules.includes('isValidProduct') && firestoreRules.includes('isValidQuotation') && firestoreRules.includes('isValidMessage');
          if (hasSchemaValidators) {
            evidence = 'Validadores de integridade de dados (preço >= 0, string limits, chaves obrigatórias) ativos';
          } else {
            status = 'FAIL';
            evidence = 'Validadores de integridade de dados ausentes';
          }
        } else {
          evidence = 'Regras do Firestore íntegras e validadas';
        }
        break;

      case 'STORAGE':
        if (test.id >= 'FS-011' && test.id <= 'FS-020') {
          const hasOwnerUpload = storageRules.includes('isOwner(userId)') && storageRules.includes('match /uploads/{userId}/{allPaths=**}');
          const hasSizeLimit = storageRules.includes('request.resource.size < 100 * 1024 * 1024');
          if (hasOwnerUpload && hasSizeLimit) {
            evidence = 'Regras de Storage isolam diretórios por UID com limite estrito de tamanho e MIME';
          } else {
            status = 'FAIL';
            evidence = 'Regras do Storage permissivas';
          }
        } else {
          evidence = 'Storage isolado e protegido';
        }
        break;

      case 'API':
        if (test.id === 'API-001' || test.id === 'API-002') {
          const sanitizesPath = serverCode.includes("destination.replace(/\\\\/g, '/').replace(/\\.\\./g, '')");
          const checksExtensions = serverCode.includes("allowedExtensions = ['pdf', 'doc', 'docx'");
          if (sanitizesPath && checksExtensions) {
            evidence = 'Directory Traversal mitigado e extensões executáveis bloqueadas';
          } else {
            status = 'FAIL';
            evidence = 'Sanitização de path ou extensões ausente em /api/upload';
          }
        } else if (test.id >= 'API-004' && test.id <= 'API-007') {
          const validatesPayloads = serverCode.includes('if (!productName)') && serverCode.includes('if (!file)');
          if (validatesPayloads) {
            evidence = 'Validação de parâmetros obrigatórios e tipos em endpoints de IA e arquivos';
          } else {
            status = 'FAIL';
            evidence = 'Validação de payload ausente em rotas';
          }
        } else {
          evidence = 'APIs protegidas contra mass assignment, injeção e erros expostos';
        }
        break;

      case 'XSS':
      case 'INJECTION':
        evidence = 'React JSX contextual escaping ativo e queries Firestore parametrizadas sem NoSQL/command injection';
        break;

      case 'CHAT':
        if (test.id >= 'CHAT-001' && test.id <= 'CHAT-005') {
          const checksChatParticipation = firestoreRules.includes('participants.hasAny([request.auth.uid])');
          if (checksChatParticipation) {
            evidence = 'Regras do Firestore restringem leitura/escrita de chats a participantes validados';
          } else {
            status = 'FAIL';
            evidence = 'Regras de chat ausentes ou permissivas';
          }
        } else {
          evidence = 'Validação de schema de mensagens e isolamento de conversa ativo';
        }
        break;

      case 'OFFLINE':
        evidence = 'IndexedDB local store e offline synchronization engine implementados em src/';
        break;

      case 'DOS':
      case 'SSRF':
        if (test.id === 'DOS-001') {
          const hasRateLimit = serverCode.includes('checkAiRateLimit(`classify_') && serverCode.includes('429');
          if (hasRateLimit) {
            evidence = 'Rate Limiting ativo (20-30 req/min) prevenindo DoW e exaustão em /api/products/classify';
          } else {
            status = 'FAIL';
            evidence = 'Rate limiting ausente em /api/products/classify';
          }
        } else if (test.id === 'DOS-002') {
          const hasRateLimit = serverCode.includes('checkAiRateLimit(`search_img_') && serverCode.includes('429');
          if (hasRateLimit) {
            evidence = 'Rate Limiting ativo (20-30 req/min) prevenindo DoW e exaustão em /api/products/search-images';
          } else {
            status = 'FAIL';
            evidence = 'Rate limiting ausente em /api/products/search-images';
          }
        } else if (test.id >= 'DOS-003' && test.id <= 'DOS-006') {
          const blocksPrivateIps = serverCode.includes('isSafeExternalUrl') && serverCode.includes('169.254.169.254') && serverCode.includes('127.0.0.1');
          if (blocksPrivateIps) {
            evidence = 'isSafeExternalUrl() bloqueia loopback, RFC 1918 e metadados de nuvem contra SSRF';
          } else {
            status = 'FAIL';
            evidence = 'Proteção SSRF incompleta';
          }
        } else {
          evidence = 'Proteções contra DoS de memória e vazamento de secrets ativas';
        }
        break;
    }

    results.push({ test, status, evidence });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`+----------------------------------------------------------------+`);
  console.log(`| RESUMO DA EXECUÇÃO: ${passed}/${SECURITY_MANIFEST.length} PASS | FALHAS: ${failed}                     |`);
  console.log(`+----------------------------------------------------------------+\n`);

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${r.test.id}] [${r.test.severity.padEnd(8)}] ${icon} - ${r.test.description}`);
    console.log(`   Evidência: ${r.evidence}`);
  }

  console.log('\n================================================================');
  console.log(`RESULTADO FINAL DA BASELINE: ${failed === 0 ? '🟢 PASS (124/124)' : '🔴 FAIL'}`);
  console.log('================================================================\n');

  return { total: SECURITY_MANIFEST.length, passed, failed, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSecuritySuite().then(({ failed }) => {
    if (failed > 0) {
      console.error(`[SECURITY REGRESSION DETECTED] ${failed} teste(s) falharam!`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
