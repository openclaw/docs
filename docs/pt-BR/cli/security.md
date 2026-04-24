---
read_when:
    - Você quer executar uma auditoria rápida de segurança na configuração/estado
    - Você quer aplicar sugestões seguras de “correção” (permissões, reforçar padrões)
summary: Referência da CLI para `openclaw security` (auditar e corrigir armadilhas comuns de segurança)
title: Segurança
x-i18n:
    generated_at: "2026-04-24T05:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
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

A auditoria avisa quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo seguro de DM**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com múltiplas contas) para caixas de entrada compartilhadas.
Isso é para reforço de caixas de entrada cooperativas/compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe limites de confiança com gateways separados (ou usuários/hosts de SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere provável entrada de usuários compartilhados (por exemplo, política aberta de DM/grupo, destinos de grupo configurados ou regras curinga de remetente) e lembra que o OpenClaw é, por padrão, um modelo de confiança de assistente pessoal.
Para configurações intencionais de usuários compartilhados, a orientação da auditoria é colocar todas as sessões em sandbox, manter o acesso ao sistema de arquivos limitado ao workspace e manter identidades ou credenciais pessoais/privadas fora desse runtime.
Ela também avisa quando modelos pequenos (`<=300B`) são usados sem sandbox e com ferramentas web/navegador habilitadas.
Para entrada por Webhook, ela avisa quando `hooks.token` reutiliza o token do Gateway, quando `hooks.token` é curto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` não está definido, quando `hooks.allowedAgentIds` é irrestrito, quando substituições de `sessionKey` da solicitação estão habilitadas e quando substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`.
Ela também avisa quando configurações Docker de sandbox estão configuradas enquanto o modo sandbox está desligado, quando `gateway.nodes.denyCommands` usa entradas ineficazes do tipo pattern/desconhecidas (somente correspondência exata de nome de comando do Node, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos perigosos do Node, quando `tools.profile="minimal"` global é substituído por perfis de ferramentas de agentes, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace e quando ferramentas de Plugin instaladas podem ficar acessíveis sob política permissiva de ferramentas.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados por registros TXT de mDNS).
Ela também avisa quando o navegador em sandbox usa a rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos perigosos de rede Docker de sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também avisa quando contêineres Docker existentes do navegador em sandbox têm rótulos de hash ausentes/obsoletos (por exemplo, contêineres anteriores à migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também avisa quando registros de instalação de Plugin/hook baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões de pacote instaladas atualmente.
Ela avisa quando listas de permissão de canais dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos de IRC quando aplicável).
Ela avisa quando `gateway.auth.mode="none"` deixa APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações com prefixo `dangerous`/`dangerously` são substituições explícitas de último recurso do operador; habilitar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, consulte a seção "Insecure or dangerous flags summary" em [Segurança](/pt-BR/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos de destino.
- Se um SecretRef estiver indisponível no caminho de comando atual, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` substituem apenas a autenticação da probe profunda para essa invocação do comando; eles não regravam a configuração nem os mapeamentos de SecretRef.

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

- altera `groupPolicy="open"` comum para `groupPolicy="allowlist"` (incluindo variantes por conta em canais compatíveis)
- quando a política de grupo do WhatsApp muda para `allowlist`, inicializa `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- reforça permissões para estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão
  `*.jsonl`)
- também reforça arquivos incluídos de configuração referenciados por `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita ferramentas (`gateway`, `cron`, `exec` etc.)
- altera escolhas de bind/auth/exposição de rede do gateway
- remove ou regrava Plugins/Skills

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Auditoria de segurança](/pt-BR/gateway/security)
