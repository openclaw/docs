---
read_when:
    - Você quer executar uma auditoria de segurança rápida em configuração/estado
    - Você quer aplicar sugestões seguras de "correção" (permissões, padrões mais restritivos)
summary: Referência da CLI para `openclaw security` (audite e corrija armadilhas comuns de segurança)
title: Segurança
x-i18n:
    generated_at: "2026-05-10T19:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
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

O `security audit` simples permanece no caminho frio de configuração/sistema de arquivos/somente leitura. Ele não descobre coletores de segurança de runtime de plugins por padrão, para que auditorias de rotina não carreguem todos os runtimes de plugins instalados. Use `--deep` para incluir sondagens em tempo real de melhor esforço do Gateway e coletores de auditoria de segurança pertencentes a plugins; chamadores internos explícitos também podem optar por esses coletores pertencentes a plugins quando já tiverem um escopo de runtime apropriado.

A auditoria avisa quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo de DM seguro**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com várias contas) para caixas de entrada compartilhadas.
Isso serve para reforço de caixas de entrada cooperativas/compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe limites de confiança com gateways separados (ou usuários/hosts de SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere entrada provável de usuários compartilhados (por exemplo, política aberta de DM/grupo, destinos de grupo configurados ou regras de remetente com curinga) e lembra que o OpenClaw usa por padrão um modelo de confiança de assistente pessoal.
Para configurações intencionais com usuários compartilhados, a orientação da auditoria é isolar todas as sessões em sandbox, manter o acesso ao sistema de arquivos restrito ao workspace e manter identidades ou credenciais pessoais/privadas fora desse runtime.
Ela também avisa quando modelos pequenos (`<=300B`) são usados sem sandboxing e com ferramentas web/navegador habilitadas.
Para entrada por webhook, ela avisa quando `hooks.token` reutiliza o token do Gateway, quando `hooks.token` é curto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` não está definido, quando `hooks.allowedAgentIds` está irrestrito, quando substituições de `sessionKey` por requisição estão habilitadas e quando substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`.
Ela também avisa quando configurações de Docker do sandbox estão configuradas enquanto o modo sandbox está desativado, quando `gateway.nodes.denyCommands` usa entradas ineficazes semelhantes a padrões/desconhecidas (somente correspondência exata do nome de comando de nó, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos de nó perigosos, quando o `tools.profile="minimal"` global é substituído por perfis de ferramentas de agentes, quando ferramentas de escrita/edição estão desabilitadas mas `exec` ainda está disponível sem um limite restritivo de sistema de arquivos do sandbox, quando grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace e quando ferramentas de plugins instalados podem ser acessíveis sob uma política permissiva de ferramentas.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados por registros TXT mDNS).
Ela também avisa quando o navegador do sandbox usa a rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos de rede Docker perigosos do sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também avisa quando contêineres Docker existentes do navegador do sandbox têm rótulos de hash ausentes/obsoletos (por exemplo, contêineres pré-migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também avisa quando registros de instalação de plugins/hooks baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões de pacotes atualmente instaladas.
Ela avisa quando allowlists de canais dependem de nomes/e-mails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos de IRC quando aplicável).
Ela avisa quando `gateway.auth.mode="none"` deixa as APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de emergência do operador; habilitar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, consulte a seção "Resumo de flags inseguras ou perigosas" em [Segurança](/pt-BR/gateway/security).

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos direcionados.
- Se uma SecretRef estiver indisponível no caminho do comando atual, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` substituem apenas a autenticação da sondagem profunda para aquela invocação do comando; eles não reescrevem a configuração nem os mapeamentos de SecretRef.

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

- altera `groupPolicy="open"` comum para `groupPolicy="allowlist"` (incluindo variantes de conta em canais compatíveis)
- quando a política de grupos do WhatsApp muda para `allowlist`, preenche `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- reforça permissões de arquivos de estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessão
  `*.jsonl`)
- também reforça arquivos de inclusão de configuração referenciados por `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições de `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita ferramentas (`gateway`, `cron`, `exec`, etc.)
- altera escolhas de exposição de bind/autenticação/rede do gateway
- remove nem reescreve plugins/skills

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Auditoria de segurança](/pt-BR/gateway/security)
