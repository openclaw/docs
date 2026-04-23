---
read_when:
    - Você quer executar uma auditoria rápida de segurança na configuração/estado
    - Você quer aplicar sugestões seguras de “correção” (permissões, endurecer padrões)
summary: Referência da CLI para `openclaw security` (auditar e corrigir falhas comuns de segurança)
title: segurança
x-i18n:
    generated_at: "2026-04-23T14:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Ferramentas de segurança (auditoria + correções opcionais).

Relacionado:

- Guia de segurança: [Segurança](/pt-BR/gateway/security)

## Auditoria

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

A auditoria alerta quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo DM seguro**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com múltiplas contas) para caixas de entrada compartilhadas.
Isso serve para endurecimento de segurança de caixas de entrada cooperativas/compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversários não é uma configuração recomendada; separe os limites de confiança com gateways distintos (ou usuários/hosts de SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere provável entrada de vários usuários compartilhados (por exemplo, política aberta de DM/grupo, destinos de grupo configurados ou regras curinga de remetente) e lembra que o OpenClaw usa, por padrão, um modelo de confiança de assistente pessoal.
Para configurações intencionais com usuários compartilhados, a orientação da auditoria é colocar todas as sessões em sandbox, manter o acesso ao sistema de arquivos limitado ao espaço de trabalho e manter identidades pessoais/privadas ou credenciais fora desse runtime.
Ela também alerta quando modelos pequenos (`<=300B`) são usados sem sandbox e com ferramentas web/navegador habilitadas.
Para entrada por Webhook, ela alerta quando `hooks.token` reutiliza o token do Gateway, quando `hooks.token` é curto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` não está definido, quando `hooks.allowedAgentIds` não está restrito, quando substituições de `sessionKey` da requisição estão habilitadas e quando substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`.
Ela também alerta quando configurações Docker de sandbox estão definidas enquanto o modo sandbox está desativado, quando `gateway.nodes.denyCommands` usa entradas ineficazes do tipo padrão/desconhecidas (correspondência exata apenas pelo nome do comando do Node, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos perigosos de Node, quando `tools.profile="minimal"` global é substituído por perfis de ferramentas do agente, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/espaço de trabalho e quando ferramentas de plugins instalados podem estar acessíveis sob uma política permissiva de ferramentas.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de spoofing de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados por registros TXT de mDNS).
Ela também alerta quando o navegador do sandbox usa rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos perigosos de rede Docker do sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também alerta quando contêineres Docker existentes do navegador sandbox têm rótulos de hash ausentes/obsoletos (por exemplo, contêineres anteriores à migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também alerta quando registros de instalação de plugin/hook baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões de pacote atualmente instaladas.
Ela alerta quando allowlists de canal dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos de IRC quando aplicável).
Ela alerta quando `gateway.auth.mode="none"` deixa APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de operador para casos de emergência; habilitar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, veja a seção "Insecure or dangerous flags summary" em [Segurança](/pt-BR/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos-alvo.
- Se um SecretRef não estiver disponível no caminho atual do comando, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` apenas substituem a autenticação de sondagem profunda para essa invocação do comando; eles não reescrevem a configuração nem os mapeamentos de SecretRef.

## Saída JSON

Use `--json` para verificações de CI/política:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` forem combinados, a saída inclui tanto as ações de correção quanto o relatório final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## O que `--fix` altera

`--fix` aplica correções seguras e determinísticas:

- muda `groupPolicy="open"` comum para `groupPolicy="allowlist"` (incluindo variantes por conta em canais compatíveis)
- quando a política de grupo do WhatsApp muda para `allowlist`, inicializa `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- restringe permissões para estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão
  `*.jsonl`)
- também restringe arquivos de inclusão de configuração referenciados por `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita ferramentas (`gateway`, `cron`, `exec` etc.)
- altera escolhas de bind/autenticação/exposição de rede do gateway
- remove nem reescreve plugins/Skills
