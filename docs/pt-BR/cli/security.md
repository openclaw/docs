---
read_when:
    - Você quer executar uma auditoria de segurança rápida na configuração/estado
    - Você quer aplicar sugestões seguras de "correção" (permissões, restringir padrões)
summary: Referência da CLI para `openclaw security` (audite e corrija armadilhas comuns de segurança)
title: Segurança
x-i18n:
    generated_at: "2026-06-27T17:21:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

O `security audit` simples permanece no caminho frio de configuração/sistema de arquivos/somente leitura. Ele não descobre coletores de segurança do runtime de plugins por padrão, portanto auditorias de rotina não carregam todos os runtimes de plugins instalados. Use `--deep` para incluir sondagens live do Gateway em modo de melhor esforço e coletores de auditoria de segurança pertencentes aos plugins; chamadores internos explícitos também podem optar por esses coletores pertencentes aos plugins quando já tiverem um escopo de runtime apropriado.

A auditoria avisa quando vários remetentes de DM compartilham a sessão principal e recomenda o **modo de DM seguro**: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com várias contas) para caixas de entrada compartilhadas.
Isso serve para endurecimento cooperativo/de caixas de entrada compartilhadas. Um único Gateway compartilhado por operadores mutuamente não confiáveis/adversariais não é uma configuração recomendada; separe limites de confiança com gateways separados (ou usuários/hosts de SO separados).
Ela também emite `security.trust_model.multi_user_heuristic` quando a configuração sugere provável entrada de usuários compartilhados (por exemplo, política aberta de DM/grupo, destinos de grupo configurados ou regras de remetente curinga), e lembra que o OpenClaw é, por padrão, um modelo de confiança de assistente pessoal.
Para configurações intencionais de usuários compartilhados, a orientação da auditoria é isolar todas as sessões em sandbox, manter o acesso ao sistema de arquivos limitado ao workspace e manter identidades ou credenciais pessoais/privadas fora desse runtime.
Ela também avisa quando modelos pequenos (`<=300B`) são usados sem sandboxing e com ferramentas web/navegador habilitadas.
Para ingresso por Webhook, a inicialização registra um aviso de segurança não fatal e a auditoria sinaliza a reutilização de `hooks.token` de valores ativos de autenticação por segredo compartilhado do Gateway, incluindo `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` e `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Ela também avisa quando:

- `hooks.token` é curto
- `hooks.path="/"`
- `hooks.defaultSessionKey` não está definido
- `hooks.allowedAgentIds` é irrestrito
- substituições de `sessionKey` da solicitação estão habilitadas
- substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`

Se a autenticação por senha do Gateway for fornecida apenas na inicialização, passe o mesmo valor para `openclaw security audit --auth password --password <password>` para que a auditoria possa compará-lo com `hooks.token`.
Execute `openclaw doctor --fix` para rotacionar um `hooks.token` persistido e reutilizado; depois atualize remetentes externos de hooks para usar o novo token de hook.

Ela também avisa quando configurações de sandbox Docker estão configuradas enquanto o modo sandbox está desativado, quando `gateway.nodes.denyCommands` usa entradas ineficazes semelhantes a padrões/desconhecidas (apenas correspondência exata de nome de comando do nó, não filtragem de texto de shell), quando `gateway.nodes.allowCommands` habilita explicitamente comandos de nó perigosos, quando `tools.profile="minimal"` global é sobrescrito por perfis de ferramentas de agentes, quando ferramentas de escrita/edição estão desabilitadas, mas `exec` ainda está disponível sem um limite restritivo de sistema de arquivos em sandbox, quando DMs ou grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/workspace, e quando ferramentas de plugins instalados podem estar acessíveis sob uma política permissiva de ferramentas.
Ela também sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalho se proxies estiverem mal configurados) e `discovery.mdns.mode="full"` (vazamento de metadados via registros TXT de mDNS).
Ela também avisa quando o navegador em sandbox usa a rede Docker `bridge` sem `sandbox.browser.cdpSourceRange`.
Ela também sinaliza modos perigosos de rede Docker em sandbox (incluindo `host` e junções de namespace `container:*`).
Ela também avisa quando contêineres Docker existentes do navegador em sandbox têm rótulos de hash ausentes/obsoletos (por exemplo, contêineres pré-migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.
Ela também avisa quando registros de instalação de plugins/hooks baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões de pacote instaladas atualmente.
Ela avisa quando allowlists de canais dependem de nomes/e-mails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, escopos IRC quando aplicável).
Ela avisa quando `gateway.auth.mode="none"` deixa as APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` mais qualquer endpoint `/v1/*` habilitado).
Configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de emergência para operadores; habilitar uma delas não é, por si só, um relatório de vulnerabilidade de segurança.
Para o inventário completo de parâmetros perigosos, consulte a seção "Resumo de flags inseguras ou perigosas" em [Segurança](/pt-BR/gateway/security).

Achados intencionais permanentes podem ser aceitos com `security.audit.suppressions`.
Cada supressão corresponde a um `checkId` exato e pode ser restringida com substrings sem diferenciação de maiúsculas/minúsculas em
`titleIncludes` e/ou `detailIncludes`:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Achados suprimidos são removidos do `summary` ativo e da lista `findings`.
A saída JSON os mantém em `suppressedFindings` para auditabilidade.
Quando supressões estão configuradas, a saída ativa também mantém um achado informativo
`security.audit.suppressions.active` não suprimível, para que leitores saibam que a auditoria
foi filtrada. Flags de configuração perigosas são emitidas uma flag por achado, portanto
aceitar uma flag perigosa não oculta outras flags habilitadas que compartilham o
mesmo `checkId` `config.insecure_or_dangerous_flags`.
Como supressões podem ocultar risco permanente, adicioná-las ou removê-las por meio de
comandos de shell executados por agente exige aprovação de exec, a menos que exec já esteja rodando
com `security="full"` e `ask="off"` para automação local confiável.

Comportamento de SecretRef:

- `security audit` resolve SecretRefs compatíveis em modo somente leitura para seus caminhos direcionados.
- Se uma SecretRef estiver indisponível no caminho do comando atual, a auditoria continua e relata `secretDiagnostics` (em vez de falhar).
- `--token` e `--password` apenas sobrescrevem a autenticação de sondagem profunda para essa invocação de comando; eles não reescrevem a configuração nem os mapeamentos de SecretRef.

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

- muda `groupPolicy="open"` comum para `groupPolicy="allowlist"` (incluindo variantes por conta em canais compatíveis)
- quando a política de grupo do WhatsApp muda para `allowlist`, semeia `groupAllowFrom` a partir
  do arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não
  define `allowFrom`
- define `logging.redactSensitive` de `"off"` para `"tools"`
- restringe permissões para estado/configuração e arquivos sensíveis comuns
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl` de
  sessão)
- também restringe arquivos de inclusão de configuração referenciados por `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições com `icacls` no Windows

`--fix` **não**:

- rotaciona tokens/senhas/chaves de API
- desabilita ferramentas (`gateway`, `cron`, `exec`, etc.)
- altera escolhas de bind/autenticação/exposição de rede do Gateway
- remove ou reescreve plugins/Skills

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Auditoria de segurança](/pt-BR/gateway/security)
