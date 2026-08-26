export interface SecurityTestCase {
  id: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  attackScenario: string;
  precondition: string;
  action: string;
  expectedResult: string;
}

export const SECURITY_MANIFEST: SecurityTestCase[] = [
  // 1. AUTHENTICATION & SESSION (15 tests)
  {
    id: 'AUTH-001',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    description: 'Acesso sem autenticação a endpoint privado',
    attackScenario: 'Atacante envia requisição GET para /api/files sem header de autorização',
    precondition: 'Nenhuma credencial fornecida',
    action: 'GET /api/files sem token',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-002',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Token JWT malformado ou inválido',
    attackScenario: 'Atacante envia token com formato corrompido em /api/files',
    precondition: 'Header Authorization contém string inválida',
    action: 'GET /api/files com Bearer fake.token.data',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-003',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Token expirado',
    attackScenario: 'Atacante reutiliza token JWT após expiração de exp timestamp',
    precondition: 'Token com timestamp expirado',
    action: 'GET /api/files com token expirado',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-004',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    description: 'Token com assinatura criptográfica adulterada',
    attackScenario: 'Atacante altera o payload de claims e mantém assinatura desatualizada',
    precondition: 'Token adulterado',
    action: 'GET /api/files com token com assinatura incorreta',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-005',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Token de usuário comum em endpoint restrito a administradores',
    attackScenario: 'Comprador tenta acessar /api/synonyms (POST) para cadastrar termos globais',
    precondition: 'Usuário autenticado sem role admin',
    action: 'POST /api/synonyms',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'AUTH-006',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Acesso com token revogado no Firebase Auth',
    attackScenario: 'Usuário desativado ou com credenciais redefinidas tenta acessar a API',
    precondition: 'Revogação de token ativa',
    action: 'GET /api/files com token revogado',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-007',
    category: 'AUTHENTICATION',
    severity: 'MEDIUM',
    description: 'Download de arquivo sem autenticação prévia',
    attackScenario: 'Atacante desautenticado tenta gerar token temporário em /api/files/:id/download',
    precondition: 'Sessão anônima',
    action: 'GET /api/files/sample-id/download sem token',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-008',
    category: 'AUTHENTICATION',
    severity: 'MEDIUM',
    description: 'Sessão antiga após alteração de credenciais',
    attackScenario: 'Sessão suspensa tenta operações de escrita',
    precondition: 'Sessão invalidada',
    action: 'POST /api/files/upload com credenciais invalidadas',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-009',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    description: 'Firebase UID manipulado no corpo da requisição',
    attackScenario: 'Atacante envia body { uid: "victim-uid" } em /api/auth/get-verification-link',
    precondition: 'Atacante autenticado como user-A',
    action: 'POST /api/auth/get-verification-link com uid=user-B',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'AUTH-010',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    description: 'Spoofing via header x-user-id',
    attackScenario: 'Atacante injeta header x-user-id: admin para burlar auth',
    precondition: 'Header injetado sem token legítimo',
    action: 'GET /api/files com header x-user-id: admin',
    expectedResult: 'HTTP 401 Unauthorized (Header ignorado)'
  },
  {
    id: 'AUTH-011',
    category: 'AUTHENTICATION',
    severity: 'CRITICAL',
    description: 'Spoofing via header uploaded_by',
    attackScenario: 'Atacante injeta header uploaded_by para assumir autoria de arquivos',
    precondition: 'Header injetado',
    action: 'POST /api/files/upload com header uploaded_by: admin',
    expectedResult: 'HTTP 401 Unauthorized ou autor de token verificado'
  },
  {
    id: 'AUTH-012',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Bypass de email verification em conta alheia',
    attackScenario: 'Atacante tenta forçar verificação de email de terceiro via /api/auth/bypass-verification',
    precondition: 'Atacante autenticado com uid-A',
    action: 'POST /api/auth/bypass-verification com uid=uid-B',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'AUTH-013',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Injeção de emailVerified diretamente no Firestore',
    attackScenario: 'Usuário tenta atualizar seu próprio documento com emailVerified: true',
    precondition: 'Cliente conectado no Firestore',
    action: 'update doc /users/{uid} com emailVerified: true',
    expectedResult: 'Regra Firestore rejeita escrita'
  },
  {
    id: 'AUTH-014',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Acesso a endpoint administrativo sem autenticação',
    attackScenario: 'Requisição anônima para /api/suggestions/:id/approve',
    precondition: 'Sem token',
    action: 'POST /api/suggestions/sug-1/approve',
    expectedResult: 'HTTP 401 Unauthorized'
  },
  {
    id: 'AUTH-015',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'Acesso a endpoint administrativo com usuário comum',
    attackScenario: 'Usuário comprador envia POST para /api/suggestions/:id/reject',
    precondition: 'Autenticado com role buyer',
    action: 'POST /api/suggestions/sug-1/reject',
    expectedResult: 'HTTP 403 Forbidden'
  },

  // 2. RBAC & MULTI-TENANCY (20 tests)
  {
    id: 'RBAC-001',
    category: 'RBAC',
    severity: 'CRITICAL',
    description: 'Comprador tenta alterar próprio campo role para admin',
    attackScenario: 'Comprador executa update em /users/{uid} enviando role: "admin"',
    precondition: 'Usuário autenticado como buyer',
    action: 'update doc /users/{buyerUid} com { role: "admin" }',
    expectedResult: 'Regra Firestore rejeita a mutação'
  },
  {
    id: 'RBAC-002',
    category: 'RBAC',
    severity: 'CRITICAL',
    description: 'Fornecedor tenta alterar próprio campo role para superadmin',
    attackScenario: 'Fornecedor executa update em /users/{uid} enviando role: "superadmin"',
    precondition: 'Usuário autenticado como supplier',
    action: 'update doc /users/{supplierUid} com { role: "superadmin" }',
    expectedResult: 'Regra Firestore rejeita a mutação'
  },
  {
    id: 'RBAC-003',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Transportador tenta auto-aprovar verificação da empresa (isVerified: true)',
    attackScenario: 'Transportador executa update em /users/{uid} enviando isVerified: true',
    precondition: 'Usuário autenticado como carrier',
    action: 'update doc /users/{carrierUid} com { isVerified: true }',
    expectedResult: 'Regra Firestore rejeita a mutação'
  },
  {
    id: 'RBAC-004',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Leitura cross-tenant de arquivos corporativos via API',
    attackScenario: 'Usuário da Empresa A tenta listar arquivos da Empresa B via query param',
    precondition: 'Usuário autenticado Empresa A',
    action: 'GET /api/files?companyId=empresa-b',
    expectedResult: 'Retorna apenas arquivos próprios/autorizados'
  },
  {
    id: 'RBAC-005',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Usuário comum tenta criar sinônimo de catálogo',
    attackScenario: 'Comprador envia POST /api/synonyms',
    precondition: 'Autenticado sem privilégios admin',
    action: 'POST /api/synonyms com dados válidos',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'RBAC-006',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Usuário comum tenta atualizar sinônimo de catálogo',
    attackScenario: 'Fornecedor envia PUT /api/synonyms/:id',
    precondition: 'Autenticado como supplier',
    action: 'PUT /api/synonyms/syn-1',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'RBAC-007',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Usuário comum tenta remover sinônimo de catálogo',
    attackScenario: 'Transportador envia DELETE /api/synonyms/:id',
    precondition: 'Autenticado como carrier',
    action: 'DELETE /api/synonyms/syn-1',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'RBAC-008',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Usuário comum tenta aprovar sugestão de sinônimo',
    attackScenario: 'Comprador envia POST /api/suggestions/:id/approve',
    precondition: 'Autenticado como buyer',
    action: 'POST /api/suggestions/sug-1/approve',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'RBAC-009',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Usuário comum tenta rejeitar sugestão de sinônimo',
    attackScenario: 'Fornecedor envia POST /api/suggestions/:id/reject',
    precondition: 'Autenticado como supplier',
    action: 'POST /api/suggestions/sug-1/reject',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'RBAC-010',
    category: 'RBAC',
    severity: 'CRITICAL',
    description: 'Injeção de role privilegiada durante criação de usuário',
    attackScenario: 'Novo usuário registra-se enviando role: "admin" no documento inicial',
    precondition: 'Usuário recém-criado sem privilégios',
    action: 'create doc /users/{uid} com { role: "admin" }',
    expectedResult: 'Regra Firestore rejeita criação com role privilegiada'
  },
  {
    id: 'RBAC-011',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Fornecedor A tenta atualizar produto de Fornecedor B',
    attackScenario: 'Fornecedor A envia update em /products/{prodB_id}',
    precondition: 'Fornecedor A não é dono do produto B',
    action: 'update doc /products/{prodB_id}',
    expectedResult: 'Regra Firestore rejeita por ausência de ownership'
  },
  {
    id: 'RBAC-012',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Fornecedor A tenta deletar produto de Fornecedor B',
    attackScenario: 'Fornecedor A envia delete em /products/{prodB_id}',
    precondition: 'Fornecedor A não é dono do produto B',
    action: 'delete doc /products/{prodB_id}',
    expectedResult: 'Regra Firestore rejeita por ausência de ownership'
  },
  {
    id: 'RBAC-013',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Alteração de supplierId em produto existente',
    attackScenario: 'Fornecedor tenta transferir ownership do produto para terceiro',
    precondition: 'Produto existente',
    action: 'update doc /products/{prod_id} com novo supplierId',
    expectedResult: 'Regra Firestore exige imutabilidade de supplierId'
  },
  {
    id: 'RBAC-014',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Alteração de ownerId em caminhão de transportadora alheia',
    attackScenario: 'Transportador A tenta mudar ownerId de caminhão pertencente a B',
    precondition: 'Caminhão registrado por B',
    action: 'update doc /trucks/{truck_id} com outro ownerId',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'RBAC-015',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Alteração de carrierId em carga alheia',
    attackScenario: 'Transportador tenta reatribuir carga de outro para si',
    precondition: 'Carga existente',
    action: 'update doc /loads/{load_id} com carrierId manipulado',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'RBAC-016',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Acesso a notificações de terceiro',
    attackScenario: 'Usuário A tenta ler doc em /notifications/{notif_B}',
    precondition: 'Notificação pertence a B',
    action: 'get doc /notifications/{notif_B}',
    expectedResult: 'Regra Firestore restringe a userId == auth.uid'
  },
  {
    id: 'RBAC-017',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Modificação de notificação de terceiro',
    attackScenario: 'Usuário A tenta marcar notificação de B como lida',
    precondition: 'Notificação pertence a B',
    action: 'update doc /notifications/{notif_B}',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'RBAC-018',
    category: 'RBAC',
    severity: 'HIGH',
    description: 'Leitura não autorizada da coleção de administradores',
    attackScenario: 'Usuário comum tenta ler documentos na coleção /admins',
    precondition: 'Usuário autenticado não é superadmin',
    action: 'get doc /admins/{adminUid}',
    expectedResult: 'Regra Firestore bloqueia leitura'
  },
  {
    id: 'RBAC-019',
    category: 'RBAC',
    severity: 'CRITICAL',
    description: 'Escrita direta na coleção /admins',
    attackScenario: 'Usuário comum tenta criar documento em /admins/{uid} para virar admin',
    precondition: 'Usuário sem privilégios de superadmin',
    action: 'create doc /admins/{uid}',
    expectedResult: 'Regra Firestore rejeita escrita'
  },
  {
    id: 'RBAC-020',
    category: 'RBAC',
    severity: 'MEDIUM',
    description: 'Leitura anônima de dados de usuários',
    attackScenario: 'Cliente desautenticado tenta ler /users/{uid}',
    precondition: 'Sem autenticação',
    action: 'get doc /users/{uid}',
    expectedResult: 'Regra Firestore exige isSignedIn()'
  },

  // 3. IDOR & ACCESS CONTROL (20 tests)
  {
    id: 'IDOR-001',
    category: 'IDOR',
    severity: 'CRITICAL',
    description: 'Exclusão de arquivo pertencente a outro usuário',
    attackScenario: 'Usuário A envia DELETE /api/files/{fileB_id}',
    precondition: 'Arquivo pertence a B',
    action: 'DELETE /api/files/{fileB_id}',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'IDOR-002',
    category: 'IDOR',
    severity: 'CRITICAL',
    description: 'Geração de token de download para arquivo de terceiro',
    attackScenario: 'Usuário A solicita link SAS para arquivo privado de B',
    precondition: 'Arquivo pertence a B e outra empresa',
    action: 'GET /api/files/{fileB_id}/download',
    expectedResult: 'HTTP 403 Forbidden'
  },
  {
    id: 'IDOR-003',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Download com token SAS expirado',
    attackScenario: 'Atacante tenta baixar arquivo após 5 minutos do token gerado',
    precondition: 'Token SAS expirou',
    action: 'GET /api/files/download-raw/sample?token=expired',
    expectedResult: 'HTTP 403 Token expirado'
  },
  {
    id: 'IDOR-004',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Download com token SAS arbitrário/forjado',
    attackScenario: 'Atacante chuta token em /api/files/download-raw/sample?token=fake123',
    precondition: 'Token forjado',
    action: 'GET /api/files/download-raw/sample?token=fake123',
    expectedResult: 'HTTP 403 Token inválido'
  },
  {
    id: 'IDOR-005',
    category: 'IDOR',
    severity: 'MEDIUM',
    description: 'Download de arquivo com ID inexistente',
    attackScenario: 'Usuário solicita download de arquivo com ID randômico inexistente',
    precondition: 'ID não registrado',
    action: 'GET /api/files/inexistente-123/download',
    expectedResult: 'HTTP 404 Not Found'
  },
  {
    id: 'IDOR-006',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Deleção de cotação de terceiros no Firestore',
    attackScenario: 'Usuário C tenta deletar cotação entre A e B',
    precondition: 'C não é buyer nem supplier da cotação',
    action: 'delete doc /quotations/{quot_id}',
    expectedResult: 'Regra Firestore rejeita deleção'
  },
  {
    id: 'IDOR-007',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Leitura de cotação privada de terceiros',
    attackScenario: 'Usuário C tenta ler cotação de A e B',
    precondition: 'C não participa da negociação',
    action: 'get doc /quotations/{quot_id}',
    expectedResult: 'Regra Firestore rejeita acesso'
  },
  {
    id: 'IDOR-008',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Modificação de ordem de frete de terceiro',
    attackScenario: 'Transportador A tenta modificar frete atribuído a B',
    precondition: 'Ordem de frete atribuída a B',
    action: 'update doc /freight_orders/{fo_id}',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'IDOR-009',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Deleção de ocorrência logística de outro transportador',
    attackScenario: 'Usuário tenta deletar ocorrência reportada por terceiro',
    precondition: 'Ocorrência registrada por terceiro',
    action: 'delete doc /occurrences/{occ_id}',
    expectedResult: 'Regra Firestore rejeita deleção'
  },
  {
    id: 'IDOR-010',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Modificação de atribuição de motorista alheia',
    attackScenario: 'Motorista A tenta alterar status da atribuição de B',
    precondition: 'Atribuição pertence a B',
    action: 'update doc /transportAssignments/{ta_id}',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'IDOR-011',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Deleção de atribuição de transporte alheia',
    attackScenario: 'Usuário tenta excluir atribuição de transporte de outro',
    precondition: 'Sem ownership da atribuição',
    action: 'delete doc /transportAssignments/{ta_id}',
    expectedResult: 'Regra Firestore rejeita deleção'
  },
  {
    id: 'IDOR-012',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Modificação de lance (bid) de outra transportadora',
    attackScenario: 'Transportador A tenta alterar valor do lance do Transportador B',
    precondition: 'Lance submetido por B',
    action: 'update doc /carrier_bids/{bid_id}',
    expectedResult: 'Regra Firestore rejeita mutação'
  },
  {
    id: 'IDOR-013',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Deleção de lance (bid) de outra transportadora',
    attackScenario: 'Transportador A tenta deletar lance concorrente de B',
    precondition: 'Lance submetido por B',
    action: 'delete doc /carrier_bids/{bid_id}',
    expectedResult: 'Regra Firestore rejeita deleção'
  },
  {
    id: 'IDOR-014',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Modificação de metadados de arquivo no Firestore por terceiro',
    attackScenario: 'Usuário A tenta alterar uploaded_by no doc /files/{id}',
    precondition: 'Arquivo pertence a B',
    action: 'update doc /files/{fileB_id}',
    expectedResult: 'Regra Firestore exige uploaded_by == auth.uid'
  },
  {
    id: 'IDOR-015',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Deleção de metadados de arquivo no Firestore por terceiro',
    attackScenario: 'Usuário A tenta deletar doc /files/{fileB_id}',
    precondition: 'Arquivo pertence a B',
    action: 'delete doc /files/{fileB_id}',
    expectedResult: 'Regra Firestore bloqueia deleção'
  },
  {
    id: 'IDOR-016',
    category: 'IDOR',
    severity: 'MEDIUM',
    description: 'ID de produto inválido com caracteres de injeção',
    attackScenario: 'Atacante tenta criar produto com ID "../../etc/passwd"',
    precondition: 'ID malformado',
    action: 'create doc /products/../../etc/passwd',
    expectedResult: 'Regra isValidId() rejeita o ID'
  },
  {
    id: 'IDOR-017',
    category: 'IDOR',
    severity: 'MEDIUM',
    description: 'ID de cotação com comprimento excessivo (>128 chars)',
    attackScenario: 'Atacante envia ID de 500 caracteres para causar DoS em índices',
    precondition: 'ID gigante',
    action: 'create doc /quotations/{long_id}',
    expectedResult: 'Regra isValidId() rejeita o ID'
  },
  {
    id: 'IDOR-018',
    category: 'IDOR',
    severity: 'MEDIUM',
    description: 'ID de ordem de frete vazio ou whitespace',
    attackScenario: 'Atacante envia ID "   "',
    precondition: 'ID em branco',
    action: 'create doc /freight_orders/   ',
    expectedResult: 'Regra isValidId() rejeita o ID'
  },
  {
    id: 'IDOR-019',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Acesso a relatório confidencial de vendas de concorrente',
    attackScenario: 'Fornecedor A tenta acessar transações de Fornecedor B',
    precondition: 'Transação pertence a B',
    action: 'get doc /transactions/{tx_B}',
    expectedResult: 'Regra Firestore rejeita acesso'
  },
  {
    id: 'IDOR-020',
    category: 'IDOR',
    severity: 'HIGH',
    description: 'Manipulação de status em documento alheio',
    attackScenario: 'Comprador tenta mudar status de pedido de outro comprador para cancelado',
    precondition: 'Pedido pertence a outro comprador',
    action: 'update doc /orders/{order_B} com status="cancelled"',
    expectedResult: 'Regra Firestore rejeita mutação'
  },

  // 4. FIRESTORE & STORAGE (20 tests)
  {
    id: 'FS-001',
    category: 'FIRESTORE',
    severity: 'CRITICAL',
    description: 'Regra global nega leitura/escrita não autorizada por padrão',
    attackScenario: 'Consulta direta a coleções não declaradas',
    precondition: 'Coleção arbitrária /secret_data',
    action: 'get /secret_data/123',
    expectedResult: 'Regra padrão match /{document=**} nega o acesso'
  },
  {
    id: 'FS-002',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Validação de schema de produto (preço negativo)',
    attackScenario: 'Fornecedor tenta cadastrar produto com preço -50.00',
    precondition: 'Payload com preço negativo',
    action: 'create doc /products/{id} com price: -50',
    expectedResult: 'Regra isValidProduct() rejeita preço negativo'
  },
  {
    id: 'FS-003',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Validação de schema de produto (tamanho de nome excessivo)',
    attackScenario: 'Fornecedor tenta cadastrar produto com nome de 5000 caracteres',
    precondition: 'Nome > 256 caracteres',
    action: 'create doc /products/{id} com nome gigante',
    expectedResult: 'Regra isValidProduct() rejeita produto'
  },
  {
    id: 'FS-004',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Validação de schema de cotação (campos obrigatórios ausentes)',
    attackScenario: 'Comprador envia cotação sem buyerId ou items',
    precondition: 'Campos obrigatórios omitidos',
    action: 'create doc /quotations/{id} incompleto',
    expectedResult: 'Regra isValidQuotation() rejeita a cotação'
  },
  {
    id: 'FS-005',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Injeção de campos desconhecidos em produto',
    attackScenario: 'Atacante injeta campos de bypass em produto',
    precondition: 'Payload com propriedades arbitrárias',
    action: 'create doc /products/{id} com campos extras',
    expectedResult: 'Regra de chaves permitidas valida o schema'
  },
  {
    id: 'FS-006',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Imutabilidade de buyerId em cotações',
    attackScenario: 'Atacante tenta alterar buyerId após cotação gerada',
    precondition: 'Cotação existente',
    action: 'update doc /quotations/{id} com novo buyerId',
    expectedResult: 'Regra Firestore rejeita alteração de buyerId'
  },
  {
    id: 'FS-007',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Imutabilidade de supplierId em cotações',
    attackScenario: 'Atacante tenta alterar supplierId após cotação gerada',
    precondition: 'Cotação existente',
    action: 'update doc /quotations/{id} com novo supplierId',
    expectedResult: 'Regra Firestore rejeita alteração de supplierId'
  },
  {
    id: 'FS-008',
    category: 'FIRESTORE',
    severity: 'MEDIUM',
    description: 'Prevenção de status inválido em ordem de frete',
    attackScenario: 'Transportador define status = "hack_approved"',
    precondition: 'Status fora do enum permitido',
    action: 'update doc /freight_orders/{id} com status inválido',
    expectedResult: 'Regra isValidFreightOrder() rejeita status'
  },
  {
    id: 'FS-009',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Validação de schema de chat (mensagens com tamanho > 5000 chars)',
    attackScenario: 'Atacante envia mensagem de chat com 50.000 caracteres',
    precondition: 'Mensagem gigante',
    action: 'create doc /chats/{id}/messages/{msg_id} com payload gigante',
    expectedResult: 'Regra isValidMessage() rejeita mensagem'
  },
  {
    id: 'FS-010',
    category: 'FIRESTORE',
    severity: 'HIGH',
    description: 'Validação de timestamp futuro absurdo em ocorrência',
    attackScenario: 'Atacante injeta data de 2099 para burlar ordem de logs',
    precondition: 'Timestamp inválido',
    action: 'create doc /occurrences/{id} com timestamp manipulado',
    expectedResult: 'Validação de schema de ocorrência rejeita doc'
  },
  {
    id: 'FS-011',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Escrita em pasta de outro usuário no Firebase Storage',
    attackScenario: 'Usuário A tenta gravar arquivo em /uploads/userB_uid/doc.pdf',
    precondition: 'Usuário A autenticado',
    action: 'upload no Storage em /uploads/{userB_uid}/doc.pdf',
    expectedResult: 'Regra isOwner(userId) rejeita a gravação'
  },
  {
    id: 'FS-012',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Upload de arquivo desautenticado no Storage',
    attackScenario: 'Atacante anônimo envia arquivo diretamente ao bucket',
    precondition: 'Sem autenticação',
    action: 'upload no Storage sem token',
    expectedResult: 'Regra isSignedIn() rejeita o upload'
  },
  {
    id: 'FS-013',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Exclusão de arquivo de outro usuário no Storage',
    attackScenario: 'Usuário A tenta deletar arquivo em /uploads/{userB_uid}/avatar.png',
    precondition: 'Arquivo pertence a B',
    action: 'delete no Storage em /uploads/{userB_uid}/avatar.png',
    expectedResult: 'Regra isOwner(userId) bloqueia a deleção'
  },
  {
    id: 'FS-014',
    category: 'STORAGE',
    severity: 'MEDIUM',
    description: 'Upload de arquivo gigante acima do limite permitido (>100MB)',
    attackScenario: 'Atacante tenta subir arquivo de 250MB para esgotar storage',
    precondition: 'Tamanho > 100MB',
    action: 'upload no Storage com arquivo de 250MB',
    expectedResult: 'Regra size < 100 * 1024 * 1024 rejeita upload'
  },
  {
    id: 'FS-015',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Path traversal no nome do arquivo no Storage',
    attackScenario: 'Atacante tenta subir arquivo com nome "../../../system.dat"',
    precondition: 'Nome com sequências de traversal',
    action: 'upload no Storage com path traversal',
    expectedResult: 'Storage SDK e regras barram escape de diretório'
  },
  {
    id: 'FS-016',
    category: 'STORAGE',
    severity: 'MEDIUM',
    description: 'MIME Type inválido no upload de avatar de perfil',
    attackScenario: 'Atacante tenta subir arquivo .exe como avatar',
    precondition: 'ContentType = application/x-msdownload',
    action: 'upload no Storage em /users/{uid}/avatar.exe',
    expectedResult: 'Regra contentType.matches("image/.*") rejeita arquivo'
  },
  {
    id: 'FS-017',
    category: 'STORAGE',
    severity: 'MEDIUM',
    description: 'Upload de avatar com tamanho superior a 10MB',
    attackScenario: 'Atacante tenta subir imagem de 25MB como avatar',
    precondition: 'Tamanho > 10MB',
    action: 'upload no Storage em /users/{uid}/avatar.png',
    expectedResult: 'Regra size < 10 * 1024 * 1024 rejeita avatar'
  },
  {
    id: 'FS-018',
    category: 'STORAGE',
    severity: 'MEDIUM',
    description: 'Upload de anexo de chat superior a 50MB',
    attackScenario: 'Usuário tenta enviar arquivo de 80MB no chat',
    precondition: 'Tamanho > 50MB',
    action: 'upload no Storage em /chats/{chatId}/anexo.zip',
    expectedResult: 'Regra size < 50 * 1024 * 1024 rejeita anexo'
  },
  {
    id: 'FS-019',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Escrita de anexo de chat por usuário desautenticado',
    attackScenario: 'Atacante tenta injetar arquivo em /chats/{chatId}/',
    precondition: 'Sem token',
    action: 'upload no Storage em /chats/{chatId}/file.pdf',
    expectedResult: 'Regra isSignedIn() rejeita o anexo'
  },
  {
    id: 'FS-020',
    category: 'STORAGE',
    severity: 'HIGH',
    description: 'Deleção de anexo de chat por usuário desautenticado',
    attackScenario: 'Atacante tenta apagar arquivo em /chats/{chatId}/',
    precondition: 'Sem token',
    action: 'delete no Storage em /chats/{chatId}/file.pdf',
    expectedResult: 'Regra isSignedIn() rejeita a deleção'
  },

  // 5. EXPRESS API & INPUT VALIDATION (15 tests)
  {
    id: 'API-001',
    category: 'API',
    severity: 'HIGH',
    description: 'Directory Traversal no endpoint de upload proxy (/api/upload)',
    attackScenario: 'Atacante envia destination: "../../../etc/passwd" no multipart body',
    precondition: 'Path traversal no campo path',
    action: 'POST /api/upload com path traversal',
    expectedResult: 'Path é sanitizado para uploads/ e sequências .. removidas'
  },
  {
    id: 'API-002',
    category: 'API',
    severity: 'HIGH',
    description: 'Upload de extensão não permitida (.exe, .sh, .bat)',
    attackScenario: 'Atacante tenta subir script malicioso payload.sh em /api/upload',
    precondition: 'Arquivo com extensão executável',
    action: 'POST /api/upload com arquivo payload.sh',
    expectedResult: 'HTTP 400 Extensão de arquivo não permitida'
  },
  {
    id: 'API-003',
    category: 'API',
    severity: 'HIGH',
    description: 'Mass assignment em endpoint de criação de sinônimos',
    attackScenario: 'Atacante injeta campos { isAdmin: true, status: "approved" } no body',
    precondition: 'Campos privilegiados no payload',
    action: 'POST /api/synonyms com campos extras',
    expectedResult: 'Apenas campos canonicalName, synonyms, language e country são gravados'
  },
  {
    id: 'API-004',
    category: 'API',
    severity: 'MEDIUM',
    description: 'Validação de payload vazio em /api/products/classify',
    attackScenario: 'Atacante envia body {} sem productName',
    precondition: 'Corpo da requisição vazio',
    action: 'POST /api/products/classify com {}',
    expectedResult: 'HTTP 400 productName is required'
  },
  {
    id: 'API-005',
    category: 'API',
    severity: 'MEDIUM',
    description: 'Validação de payload vazio em /api/products/search-images',
    attackScenario: 'Atacante envia body {} sem productName',
    precondition: 'Corpo da requisição vazio',
    action: 'POST /api/products/search-images com {}',
    expectedResult: 'HTTP 400 productName is required'
  },
  {
    id: 'API-006',
    category: 'API',
    severity: 'MEDIUM',
    description: 'Validação de payload vazio em /api/products/store-image',
    attackScenario: 'Atacante envia body {} sem imageUrl',
    precondition: 'Corpo da requisição vazio',
    action: 'POST /api/products/store-image com {}',
    expectedResult: 'HTTP 400 Missing imageUrl'
  },
  {
    id: 'API-007',
    category: 'API',
    severity: 'MEDIUM',
    description: 'Validação de payload com JSON malformado',
    attackScenario: 'Atacante envia string truncada com Content-Type application/json',
    precondition: 'JSON quebrado',
    action: 'POST /api/products/classify com { productName: ',
    expectedResult: 'Express body-parser rejeita com HTTP 400'
  },
  {
    id: 'API-008',
    category: 'API',
    severity: 'HIGH',
    description: 'Ocultação de stack traces e dados sensíveis em respostas de erro 500',
    attackScenario: 'Forçar exceção no backend e inspecionar corpo da resposta',
    precondition: 'Erro interno simulado',
    action: 'GET /api/files com falha interna',
    expectedResult: 'Resposta contém apenas mensagem genérica sem stack trace ou caminhos'
  },
  {
    id: 'API-009',
    category: 'API',
    severity: 'HIGH',
    description: 'Isolamento de rotas de sugestões de catálogo a administradores',
    attackScenario: 'Comprador tenta invocar POST /api/suggestions/:id/approve',
    precondition: 'Usuário não é admin',
    action: 'POST /api/suggestions/sug-1/approve',
    expectedResult: 'HTTP 403 Privilégios de Administrador requeridos'
  },
  {
    id: 'API-010',
    category: 'API',
    severity: 'HIGH',
    description: 'Isolamento de rotas de rejeição de sugestões a administradores',
    attackScenario: 'Fornecedor tenta invocar POST /api/suggestions/:id/reject',
    precondition: 'Usuário não é admin',
    action: 'POST /api/suggestions/sug-1/reject',
    expectedResult: 'HTTP 403 Privilégios de Administrador requeridos'
  },
  {
    id: 'API-011',
    category: 'API',
    severity: 'HIGH',
    description: 'Isolamento de rotas de criação de sinônimos a administradores',
    attackScenario: 'Usuário comum tenta invocar POST /api/synonyms',
    precondition: 'Usuário não é admin',
    action: 'POST /api/synonyms',
    expectedResult: 'HTTP 403 Privilégios de Administrador requeridos'
  },
  {
    id: 'API-012',
    category: 'API',
    severity: 'HIGH',
    description: 'Isolamento de rotas de edição de sinônimos a administradores',
    attackScenario: 'Usuário comum tenta invocar PUT /api/synonyms/:id',
    precondition: 'Usuário não é admin',
    action: 'PUT /api/synonyms/syn-1',
    expectedResult: 'HTTP 403 Privilégios de Administrador requeridos'
  },
  {
    id: 'API-013',
    category: 'API',
    severity: 'HIGH',
    description: 'Isolamento de rotas de deleção de sinônimos a administradores',
    attackScenario: 'Usuário comum tenta invocar DELETE /api/synonyms/:id',
    precondition: 'Usuário não é admin',
    action: 'DELETE /api/synonyms/syn-1',
    expectedResult: 'HTTP 403 Privilégios de Administrador requeridos'
  },
  {
    id: 'API-014',
    category: 'API',
    severity: 'HIGH',
    description: 'Prevenção de obtenção de link de verificação para outro UID',
    attackScenario: 'Usuário A tenta obter link de verificação de B em /api/auth/get-verification-link',
    precondition: 'Usuário A autenticado',
    action: 'POST /api/auth/get-verification-link com uid de B',
    expectedResult: 'HTTP 403 Acesso negado'
  },
  {
    id: 'API-015',
    category: 'API',
    severity: 'HIGH',
    description: 'Prevenção de bypass de verificação para outro UID',
    attackScenario: 'Usuário A tenta validar e-mail de B em /api/auth/bypass-verification',
    precondition: 'Usuário A autenticado',
    action: 'POST /api/auth/bypass-verification com uid de B',
    expectedResult: 'HTTP 403 Acesso negado'
  },

  // 6. XSS & INJECTION DEFENSE (14 tests)
  {
    id: 'XSS-001',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Injeção de script HTML no nome de produto',
    attackScenario: 'Atacante cadastra produto com nome "<script>alert(1)</script>"',
    precondition: 'Nome do produto contém tags de script',
    action: 'Renderização do nome no catálogo',
    expectedResult: 'React e JSX escapam o conteúdo e impedem execução de script'
  },
  {
    id: 'XSS-002',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Injeção de handler onerror em imagem de produto',
    attackScenario: 'Atacante envia imageUrl: "x\" onerror=\"alert(1)"',
    precondition: 'Payload malicioso em URL de imagem',
    action: 'Renderização da imagem de produto',
    expectedResult: 'Tag img renderiza com atributo sanitizado sem execução de JS'
  },
  {
    id: 'XSS-003',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Injeção de payload javascript: em links de produtos',
    attackScenario: 'Atacante envia link "javascript:fetch(\'/api/keys\')"',
    precondition: 'Link com esquema javascript:',
    action: 'Clique no link do produto',
    expectedResult: 'Esquema javascript: bloqueado ou neutralizado pelo app'
  },
  {
    id: 'XSS-004',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Injeção de script em mensagens de chat',
    attackScenario: 'Atacante envia mensagem "<svg/onload=alert(document.cookie)>"',
    precondition: 'Mensagem de chat com payload SVG/XSS',
    action: 'Exibição da mensagem no ChatView',
    expectedResult: 'Conteúdo renderizado como texto puro escapado'
  },
  {
    id: 'XSS-005',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de HTML no nome da empresa do fornecedor',
    attackScenario: 'Atacante cadastra empresa com nome "<b>Hacked</b>"',
    precondition: 'Nome de empresa com tags HTML',
    action: 'Exibição na lista de fornecedores',
    expectedResult: 'Texto exibido literalmente como <b>Hacked</b>'
  },
  {
    id: 'XSS-006',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de script em comentários de cotação',
    attackScenario: 'Atacante envia notas com "<iframe src=javascript:alert(1)>"',
    precondition: 'Notas de cotação com iframe malicioso',
    action: 'Exibição em QuotationDocument',
    expectedResult: 'Tags escapadas pelo React sem renderização de iframe'
  },
  {
    id: 'XSS-007',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de payload em termos de busca de catálogo',
    attackScenario: 'Atacante pesquisa por "<script>alert(1)</script>"',
    precondition: 'Termo de busca com payload',
    action: 'Exibição do termo pesquisado no UI',
    expectedResult: 'Termo exibido de forma segura e escapada'
  },
  {
    id: 'XSS-008',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de payload em nomes de arquivos enviados',
    attackScenario: 'Atacante envia arquivo com nome "<img src=x onerror=alert(1)>.pdf"',
    precondition: 'Nome de arquivo com HTML/XSS',
    action: 'Exibição do nome na lista de arquivos',
    expectedResult: 'Nome do arquivo sanitizado no backend e escapado no frontend'
  },
  {
    id: 'XSS-009',
    category: 'INJECTION',
    severity: 'HIGH',
    description: 'NoSQL query manipulation em parâmetros de busca',
    attackScenario: 'Atacante envia objeto { $ne: null } como parâmetro de busca',
    precondition: 'Query Firestore tipada',
    action: 'GET /api/files?search[$ne]=null',
    expectedResult: 'Query Firestore trata parâmetro como string e não executa operador'
  },
  {
    id: 'XSS-010',
    category: 'INJECTION',
    severity: 'HIGH',
    description: 'Command injection em operações de arquivo',
    attackScenario: 'Atacante envia nome de arquivo com "sample.pdf; cat /etc/passwd"',
    precondition: 'Nome com caracteres shell',
    action: 'Processamento de arquivo no backend',
    expectedResult: 'Backend utiliza APIs seguras de fs sem invocar subprocessos de shell'
  },
  {
    id: 'XSS-011',
    category: 'INJECTION',
    severity: 'MEDIUM',
    description: 'Header injection em respostas de download de arquivo',
    attackScenario: 'Atacante envia nome com CRLF "\\r\\nSet-Cookie: admin=true"',
    precondition: 'Nome de arquivo com caracteres CRLF',
    action: 'Download de arquivo via /api/files/download-raw',
    expectedResult: 'Express e sanitização removem CRLF impedindo injeção de headers'
  },
  {
    id: 'XSS-012',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de script em sugestões de sinônimos',
    attackScenario: 'Atacante envia canonicalName com script',
    precondition: 'Sugestão com payload XSS',
    action: 'Exibição na lista de sugestões',
    expectedResult: 'Texto escapado pelo React sem execução de script'
  },
  {
    id: 'XSS-013',
    category: 'INJECTION',
    severity: 'HIGH',
    description: 'Path injection em nomes de arquivos salvos localmente',
    attackScenario: 'Atacante tenta salvar arquivo com nome "../config/secret.json"',
    precondition: 'Nome com traversal',
    action: 'Salvamento de arquivo em uploads/',
    expectedResult: 'Sanitização substitui caracteres perigosos por underscore'
  },
  {
    id: 'XSS-014',
    category: 'XSS',
    severity: 'MEDIUM',
    description: 'Injeção de tags em relatórios exportados',
    attackScenario: 'Atacante inclui payload em campos exportados para PDF/Excel',
    precondition: 'Dados com caracteres especiais',
    action: 'Exportação de relatório em ReportsView',
    expectedResult: 'Dados tratados como texto simples sem interpretação de código'
  },

  // 7. CHAT & PRIVACY (10 tests)
  {
    id: 'CHAT-001',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Usuário A tenta abrir chat restrito de Usuário B',
    attackScenario: 'Usuário A tenta escutar /chats/{chat_B} onde não é participante',
    precondition: 'Usuário A não está no array participants',
    action: 'get doc /chats/{chat_B}',
    expectedResult: 'Regra Firestore restringe a request.auth.uid in resource.data.participants'
  },
  {
    id: 'CHAT-002',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Usuário A tenta enviar mensagem em sala restrita de Usuário B',
    attackScenario: 'Usuário A envia mensagem em /chats/{chat_B}/messages/{msg_id}',
    precondition: 'Usuário A não participa da conversa',
    action: 'create doc /chats/{chat_B}/messages/{msg_id}',
    expectedResult: 'Regra Firestore bloqueia o envio'
  },
  {
    id: 'CHAT-003',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Usuário A tenta apagar mensagem enviada por Usuário B',
    attackScenario: 'Usuário A envia delete no doc /chats/{id}/messages/{msg_B_id}',
    precondition: 'Mensagem pertence a B',
    action: 'delete doc /chats/{id}/messages/{msg_B_id}',
    expectedResult: 'Regra Firestore restringe deleção a senderId == auth.uid'
  },
  {
    id: 'CHAT-004',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Usuário A tenta alterar conteúdo de mensagem enviada por Usuário B',
    attackScenario: 'Usuário A envia update no doc /chats/{id}/messages/{msg_B_id}',
    precondition: 'Mensagem pertence a B',
    action: 'update doc /chats/{id}/messages/{msg_B_id}',
    expectedResult: 'Regra Firestore restringe alteração a senderId == auth.uid'
  },
  {
    id: 'CHAT-005',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Usuário tenta anexar arquivo no Storage em sala de chat alheia',
    attackScenario: 'Usuário A tenta subir arquivo em /chats/{chat_B}/anexo.pdf',
    precondition: 'Usuário A não participa do chat B',
    action: 'upload no Storage em /chats/{chat_B}/',
    expectedResult: 'Regras de chat e storage isolam permissões'
  },
  {
    id: 'CHAT-006',
    category: 'CHAT',
    severity: 'MEDIUM',
    description: 'Tentativa de enumeração de IDs de salas de chat',
    attackScenario: 'Atacante consulta coleção /chats sem filtro de participante',
    precondition: 'Consulta global de chats',
    action: 'list /chats',
    expectedResult: 'Firestore Rules retornam apenas chats onde o usuário é participante'
  },
  {
    id: 'CHAT-007',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Acesso a histórico de mensagens após remoção de participante',
    attackScenario: 'Usuário removido da sala tenta ler novas mensagens',
    precondition: 'Usuário não está mais em participants',
    action: 'get /chats/{chatId}/messages',
    expectedResult: 'Regra Firestore bloqueia leitura'
  },
  {
    id: 'CHAT-008',
    category: 'CHAT',
    severity: 'HIGH',
    description: 'Manipulação indevida do array de participantes',
    attackScenario: 'Participante não-autorizado tenta adicionar terceiros à conversa',
    precondition: 'Tentativa de mutação de participants',
    action: 'update doc /chats/{chatId} com novos participantes',
    expectedResult: 'Regra Firestore valida integridade do chat'
  },
  {
    id: 'CHAT-009',
    category: 'CHAT',
    severity: 'MEDIUM',
    description: 'Validação de schema de mensagem (senderId vazio)',
    attackScenario: 'Atacante envia mensagem com senderId: "" ou nulo',
    precondition: 'senderId ausente',
    action: 'create doc /chats/{id}/messages/{msg_id} sem senderId',
    expectedResult: 'Regra isValidMessage() rejeita a mensagem'
  },
  {
    id: 'CHAT-010',
    category: 'CHAT',
    severity: 'MEDIUM',
    description: 'Prevenção de spam de mensagens no chat com payload excessivo',
    attackScenario: 'Atacante envia mensagem com 1MB de texto no chat',
    precondition: 'Texto de mensagem > 5000 caracteres',
    action: 'create doc /chats/{id}/messages/{msg_id} com texto gigante',
    expectedResult: 'Regra isValidMessage() bloqueia mensagem'
  },

  // 8. OFFLINE-FIRST & SYNCHRONIZATION (10 tests)
  {
    id: 'OFF-001',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Criação local de cotação em modo offline e persistência em IndexedDB',
    attackScenario: 'Usuário sem conexão cria nova cotação no app',
    precondition: 'Navegador offline',
    action: 'Criar cotação no client',
    expectedResult: 'Cotação armazenada com sucesso no IndexedDB local sem perda de dados'
  },
  {
    id: 'OFF-002',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Edição de produto localmente em modo offline',
    attackScenario: 'Fornecedor edita preço e estoque offline',
    precondition: 'Navegador offline',
    action: 'Atualizar produto localmente',
    expectedResult: 'Mutação gravada na fila de sincronização do IndexedDB'
  },
  {
    id: 'OFF-003',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Sincronização automática de mutações após reconexão à internet',
    attackScenario: 'Navegador transita de offline para online com fila pendente',
    precondition: 'Mutações pendentes na fila local',
    action: 'Disparo do evento online de rede',
    expectedResult: 'Mutações enviadas sequencialmente ao Firestore com sucesso'
  },
  {
    id: 'OFF-004',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Resolução de conflito em múltiplos dispositivos (Multi-Device)',
    attackScenario: 'Dispositivo A atualiza versão 2 e Dispositivo B atualiza versão 3 offline',
    precondition: 'Mutações concorrentes offline',
    action: 'Sincronização de ambos os dispositivos',
    expectedResult: 'Resolução determinística baseada em timestamp updatedAt sem corrupção'
  },
  {
    id: 'OFF-005',
    category: 'OFFLINE',
    severity: 'MEDIUM',
    description: 'Prevenção de duplicação de ordens na fila de sincronização offline',
    attackScenario: 'Tentativa de submissão duplicada de ordem durante reconexão instável',
    precondition: 'Reconexão intermitente',
    action: 'Sync engine processa fila de ordens',
    expectedResult: 'Idempotência preservada via ID único e sem duplicação de documentos'
  },
  {
    id: 'OFF-006',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Resiliência a crash da aplicação durante sincronização de dados',
    attackScenario: 'Aba do navegador fechada no meio do envio da fila de sync',
    precondition: 'Interrupção forçada no sync',
    action: 'Reabertura do app e retentativa de sync',
    expectedResult: 'Fila local permanece intacta no IndexedDB e retoma do ponto correto'
  },
  {
    id: 'OFF-007',
    category: 'OFFLINE',
    severity: 'MEDIUM',
    description: 'Integridade de cache local de catálogo de produtos',
    attackScenario: 'Consulta de catálogo enquanto offline',
    precondition: 'App sem conexão de rede',
    action: 'Navegação para ProductsView',
    expectedResult: 'Catálogo servido do cache local/IndexedDB com dados íntegros'
  },
  {
    id: 'OFF-008',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Validação de regras de negócio antes de enfileirar mutação offline',
    attackScenario: 'Usuário tenta cadastrar quantidade negativa offline',
    precondition: 'App offline',
    action: 'Submissão de pedido com quantidade negativa',
    expectedResult: 'Validação de schema no cliente rejeita antes de enfileirar no IndexedDB'
  },
  {
    id: 'OFF-009',
    category: 'OFFLINE',
    severity: 'MEDIUM',
    description: 'Notificação visual de status offline para o usuário',
    attackScenario: 'App desconecta da rede',
    precondition: 'navigator.onLine = false',
    action: 'Verificação do indicador de status',
    expectedResult: 'App exibe badge/indicador claro de modo offline e enfileiramento'
  },
  {
    id: 'OFF-010',
    category: 'OFFLINE',
    severity: 'HIGH',
    description: 'Manutenção de integridade relacional entre cotação e itens no sync',
    attackScenario: 'Sync de cotação composta por múltiplos itens',
    precondition: 'Cotação com lista de produtos',
    action: 'Processamento de sync em lote',
    expectedResult: 'Estrutura de cotação e itens sincronizada atomicamente'
  },

  // 9. DOS, SSRF & RATE LIMITING (10 tests)
  {
    id: 'DOS-001',
    category: 'DOS',
    severity: 'HIGH',
    description: 'Rate limiting no endpoint de classificação de IA (/api/products/classify)',
    attackScenario: 'Bot envia 50 requisições consecutivas em 10 segundos para esgotar cota de IA',
    precondition: 'IP dispara requisições acima do limite de 20 req/min',
    action: 'POST /api/products/classify em loop rápido',
    expectedResult: 'HTTP 429 Limite de requisições excedido'
  },
  {
    id: 'DOS-002',
    category: 'DOS',
    severity: 'HIGH',
    description: 'Rate limiting no endpoint de busca de imagens de IA (/api/products/search-images)',
    attackScenario: 'Bot envia 60 requisições simultâneas em /api/products/search-images',
    precondition: 'IP ultrapassa limite de 30 req/min',
    action: 'POST /api/products/search-images em loop rápido',
    expectedResult: 'HTTP 429 Limite de requisições excedido'
  },
  {
    id: 'DOS-003',
    category: 'SSRF',
    severity: 'CRITICAL',
    description: 'Prevenção de SSRF para loopback (127.0.0.1 / localhost)',
    attackScenario: 'Atacante envia imageUrl: "http://127.0.0.1:3000/api/files" em /api/products/store-image',
    precondition: 'Tentativa de requisição a serviço local',
    action: 'POST /api/products/store-image com URL loopback',
    expectedResult: 'HTTP 400 URL inválida ou não permitida por políticas SSRF'
  },
  {
    id: 'DOS-004',
    category: 'SSRF',
    severity: 'CRITICAL',
    description: 'Prevenção de SSRF para metadados de nuvem (169.254.169.254)',
    attackScenario: 'Atacante tenta ler credenciais GCP via "http://169.254.169.254/computeMetadata/v1/"',
    precondition: 'Tentativa de acesso ao IP de metadados',
    action: 'POST /api/products/store-image com IP 169.254.169.254',
    expectedResult: 'HTTP 400 Bloqueado por política SSRF'
  },
  {
    id: 'DOS-005',
    category: 'SSRF',
    severity: 'CRITICAL',
    description: 'Prevenção de SSRF para subredes privadas RFC 1918 (10.0.0.0/8)',
    attackScenario: 'Atacante envia imageUrl apontando para banco interno "http://10.0.1.5:5432"',
    precondition: 'Tentativa de scan na subrede 10.x',
    action: 'POST /api/products/store-image com IP 10.0.1.5',
    expectedResult: 'HTTP 400 Bloqueado por política SSRF'
  },
  {
    id: 'DOS-006',
    category: 'SSRF',
    severity: 'CRITICAL',
    description: 'Prevenção de SSRF para subredes privadas (172.16.0.0/12 e 192.168.0.0/16)',
    attackScenario: 'Atacante envia imageUrl "http://192.168.1.1/admin"',
    precondition: 'Tentativa de acesso a rede local 192.168.x',
    action: 'POST /api/products/store-image com IP 192.168.1.1',
    expectedResult: 'HTTP 400 Bloqueado por política SSRF'
  },
  {
    id: 'DOS-007',
    category: 'DOS',
    severity: 'HIGH',
    description: 'Proteção contra payloads gigantes em corpo JSON (DoS de Memória)',
    attackScenario: 'Atacante envia payload JSON de 50MB em endpoint de texto',
    precondition: 'Payload > limite configurado',
    action: 'POST /api/products/classify com payload de 50MB',
    expectedResult: 'Express body parser rejeita payload com HTTP 413 Payload Too Large'
  },
  {
    id: 'DOS-008',
    category: 'DOS',
    severity: 'MEDIUM',
    description: 'Isolamento de API keys e segredos contra vazamento em logs',
    attackScenario: 'Inspecionar saídas do servidor e respostas de erro',
    precondition: 'Execução de requisições de IA e autenticação',
    action: 'Verificação de logs e respostas',
    expectedResult: 'Nenhuma chave de API (Gemini, Firebase Secret) exposta no client ou logs'
  },
  {
    id: 'DOS-009',
    category: 'DOS',
    severity: 'HIGH',
    description: 'Prevenção de esgotamento de memória em limpeza periódica de rate limit',
    attackScenario: 'Múltiplos IPs realizam requisições durante longo período',
    precondition: 'Operação contínua do servidor',
    action: 'Execução do coletor periódico setInterval()',
    expectedResult: 'Mapas de rate limit expiram e liberam memória a cada 15 minutos'
  },
  {
    id: 'DOS-010',
    category: 'DOS',
    severity: 'HIGH',
    description: 'Timeout e proteção contra requisições externas lentas (Slowloris/Hung fetch)',
    attackScenario: 'Imagem externa em store-image demora indefinidamente para responder',
    precondition: 'Servidor remoto lento',
    action: 'POST /api/products/store-image com servidor lento',
    expectedResult: 'Requisição aborta ou rejeita com tratamento seguro de erro'
  }
];
