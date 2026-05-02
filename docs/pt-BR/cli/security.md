---
read_when:
    - Você quer executar uma auditoria rápida de segurança em config/state
    - Você quer aplicar sugestões seguras de “correção” (permissões, tornar os padrões mais restritivos)
summary: Referência da CLI para `openclaw security` (auditar e corrigir armadilhas comuns de segurança)
title: Segurança
x-i18n:
    generated_at: "2026-05-02T05:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
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

O `security audit` simples permanece no caminho frio de configuração/sistema de arquivos/somente leitura. Ele não descobre coletores de segurança de runtime de plugins por padrão, portanto auditorias de rotina não carregam todos os runtimes de plugins instalados. Use `--deep` para incluir sondagens live de Gateway em melhor esforço e coletores de auditoria de segurança pertencentes a plugins; chamadores internos explícitos também podem optar por esses coletores pertencentes a plugins quando já tiverem um escopo de runtime apropriado.

A auditoria avisa quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo DM seguro**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais multi-conta) para caixas de entrada compartilhadas.
Isso é para reforço de caixas de entrada cooperativas/compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe limites de confiança com gateways separados (ou usuários/hosts de SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere ingresso provável de usuários compartilhados (por exemplo política aberta de DM/grupo, alvos de grupo configurados ou regras curinga de remetente), e lembra que OpenClaw usa um modelo de confiança de assistente pessoal por padrão.
Para configurações intencionais de usuários compartilhados, a orientação da auditoria é colocar todas as sessões em sandbox, manter o acesso ao sistema de arquivos limitado ao workspace e manter identidades ou credenciais pessoais/privadas fora desse runtime.
Ela também avisa quando modelos pequenos (`<=300B`) são usados sem sandboxing e com ferramentas web/navegador habilitadas.
Para ingresso por Webhook, ela avisa quando `hooks.token` reutiliza o token do Gateway, quando `hooks.token` é curto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` não está definido, quando `hooks.allowedAgentIds` não tem restrições, quando substituições de `sessionKey` da requisição estão habilitadas e quando substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`.
Ela também avisa quando configurações Docker de sandbox estão configuradas enquanto o modo sandbox está desligado, quando `gateway.nodes.denyCommands` usa entradas ineficazes com aparência de padrão/desconhecidas (apenas correspondência exata de nomes de comandos de nós, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos de nós perigosos, quando `tools.profile="minimal"` global é substituído por perfis de ferramentas de agentes, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace e quando ferramentas de plugins instalados podem ficar acessíveis sob uma política permissiva de ferramentas.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalhos se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados via registros mDNS TXT).
Ela também avisa quando o navegador em sandbox usa a rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos perigosos de rede Docker de sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também avisa quando contêineres Docker de navegador em sandbox existentes têm rótulos de hash ausentes/desatualizados (por exemplo contêineres pré-migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também avisa quando registros de instalação de plugins/hooks baseados em npm não estão fixados, não têm metadados de integridade ou divergiram das versões de pacotes atualmente instaladas.
Ela avisa quando allowlists de canais dependem de nomes/emails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos de IRC quando aplicável).
Ela avisa quando `gateway.auth.mode="none"` deixa APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de emergência do operador; habilitar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, consulte a seção "Resumo de flags inseguras ou perigosas" em [Segurança](/pt-BR/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos direcionados.
- Se uma SecretRef estiver indisponível no caminho do comando atual, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` apenas substituem a autenticação de sondagem profunda para essa invocação de comando; eles não reescrevem a configuração nem os mapeamentos de SecretRef.

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

`--fix` aplica remediações seguras e determinísticas:

- altera `groupPolicy="open"` comuns para `groupPolicy="allowlist"` (incluindo variantes de conta em canais compatíveis)
- quando a política de grupo do WhatsApp muda para `allowlist`, preenche `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- restringe permissões de arquivos de estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl`
  de sessão)
- também restringe arquivos de inclusão de configuração referenciados a partir de `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita ferramentas (`gateway`, `cron`, `exec` etc.)
- altera escolhas de bind/autenticação/exposição de rede do gateway
- remove ou reescreve plugins/skills

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Auditoria de segurança](/pt-BR/gateway/security)
