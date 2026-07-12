---
read_when:
    - Você quer executar uma auditoria rápida de segurança na configuração e no estado
    - Você quer aplicar sugestões de "correção" seguras (permissões, tornar os padrões mais restritivos)
summary: Referência da CLI para `openclaw security` (auditar e corrigir armadilhas comuns de segurança)
title: Segurança
x-i18n:
    generated_at: "2026-07-12T15:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Ferramentas de segurança: auditoria e correções seguras opcionais. Consulte também: [Segurança](/pt-BR/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Modos de auditoria

O `security audit` simples permanece no caminho de configuração/sistema de arquivos/somente leitura sem inicialização: ele não descobre coletores de segurança do runtime de Plugins, portanto, as auditorias rotineiras não carregam o runtime de todos os Plugins instalados. `--deep` adiciona sondagens ativas de melhor esforço no Gateway e coletores de auditoria de segurança pertencentes aos Plugins (chamadores internos explícitos também podem optar por esses coletores quando já têm um escopo de runtime apropriado).

Se a autenticação por senha do Gateway for fornecida somente na inicialização, passe o mesmo valor com `--auth password --password <password>` para que a auditoria possa verificá-lo em relação a `hooks.token`.

## O que é verificado

**Modelo de confiança/MD**

- Avisa quando vários remetentes de MD compartilham a sessão principal e recomenda o modo seguro de MD: `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` para canais com várias contas) para caixas de entrada compartilhadas. Isso é um reforço de segurança para cooperação/caixa de entrada compartilhada, não isolamento para operadores mutuamente não confiáveis; nesse caso, separe os limites de confiança com gateways distintos (ou usuários/hosts de SO distintos).
- Emite `security.trust_model.multi_user_heuristic` quando a configuração sugere uma provável entrada de usuários compartilhados (por exemplo, política aberta de MD/grupo, destinos de grupo configurados ou regras de remetente com curinga) — o modelo de confiança padrão do OpenClaw é de assistente pessoal (um operador), não de isolamento multi-inquilino hostil. Para configurações intencionais com usuários compartilhados: coloque todas as sessões em sandbox, mantenha o acesso ao sistema de arquivos restrito ao espaço de trabalho e não inclua identidades ou credenciais pessoais/privadas nesse runtime.
- Avisa quando modelos pequenos (parâmetros `<=300B`) são usados sem sandbox e com ferramentas de web/navegador habilitadas.

**Webhook/hooks**

A inicialização registra um aviso de segurança não fatal, e a auditoria sinaliza a reutilização, por `hooks.token`, de valores ativos de autenticação por segredo compartilhado do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Também avisa quando:

- `hooks.token` é curto
- `hooks.path="/"`
- `hooks.defaultSessionKey` não está definido
- `hooks.allowedAgentIds` não tem restrições
- substituições de `sessionKey` da solicitação estão habilitadas
- substituições estão habilitadas sem `hooks.allowedSessionKeyPrefixes`

Execute `openclaw doctor --fix` para rotacionar um `hooks.token` persistido e reutilizado e, em seguida, atualize os remetentes externos de hooks para usar o novo token.

**Sandbox/ferramentas**

- Avisa quando as configurações do Docker da sandbox estão definidas enquanto o modo sandbox está desativado.
- Avisa quando `gateway.nodes.denyCommands` usa entradas desconhecidas ou semelhantes a padrões que são ineficazes (a correspondência considera somente o nome exato do comando do Node, não filtra texto do shell).
- Avisa quando `gateway.nodes.allowCommands` habilita explicitamente comandos perigosos do Node.
- Avisa quando o `tools.profile="minimal"` global é substituído pelos perfis de ferramentas dos agentes.
- Avisa quando as ferramentas de gravação/edição estão desabilitadas, mas `exec` continua disponível sem um limite restritivo do sistema de arquivos da sandbox.
- Avisa quando MDs ou grupos abertos expõem ferramentas de runtime/sistema de arquivos sem proteções de sandbox/espaço de trabalho.
- Avisa quando ferramentas de Plugins instalados podem estar acessíveis sob uma política de ferramentas permissiva.

**Navegador da sandbox**

- Avisa quando o navegador da sandbox usa a rede `bridge` do Docker sem `sandbox.browser.cdpSourceRange`.
- Sinaliza modos perigosos de rede do Docker da sandbox, incluindo `host` e associações a namespaces `container:*`.
- Avisa quando contêineres Docker existentes do navegador da sandbox têm rótulos de hash ausentes/desatualizados (por exemplo, contêineres anteriores à migração sem `openclaw.browserConfigEpoch`) e recomenda `openclaw sandbox recreate --browser --all`.

**Rede/descoberta**

- Sinaliza `gateway.allowRealIpFallback=true` (risco de falsificação de cabeçalhos se os proxies estiverem configurados incorretamente).
- Sinaliza `discovery.mdns.mode="full"` (vazamento de metadados por meio de registros TXT de mDNS).
- Avisa quando `gateway.auth.mode="none"` deixa as APIs HTTP do Gateway acessíveis sem um segredo compartilhado (`/tools/invoke` e qualquer endpoint `/v1/*` habilitado).

**Plugins/canais**

- Avisa quando os registros de instalação de plugins/hooks baseados em npm não estão fixados, não têm metadados de integridade ou divergem das versões dos pacotes atualmente instalados.
- Avisa quando as listas de permissões de canais dependem de nomes/e-mails/tags mutáveis em vez de IDs estáveis (Discord, Slack, Google Chat, Microsoft Teams, Mattermost e escopos de IRC, quando aplicável).

As configurações prefixadas com `dangerous`/`dangerously` são substituições explícitas de emergência pelo operador; habilitar uma delas não constitui, por si só, um relato de vulnerabilidade de segurança. Para ver o inventário completo de parâmetros perigosos, consulte "Resumo de flags inseguras ou perigosas" em [Segurança](/pt-BR/gateway/security).

## Comportamento de SecretRef

`security audit` resolve as SecretRefs compatíveis no modo somente leitura para os caminhos visados. Se uma SecretRef não estiver disponível no caminho do comando atual, a auditoria continuará e relatará `secretDiagnostics` em vez de falhar. `--token` e `--password` substituem apenas a autenticação da verificação aprofundada para essa invocação do comando; eles não reescrevem a configuração nem os mapeamentos de SecretRef.

## Supressões

Aceite constatações permanentes intencionais com `security.audit.suppressions`. Cada supressão corresponde a um `checkId` exato e pode ser restringida com substrings `titleIncludes` e/ou `detailIncludes`, sem diferenciação entre maiúsculas e minúsculas:

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

As constatações suprimidas são removidas do `summary` ativo e da lista `findings`. A saída JSON as mantém em `suppressedFindings` para fins de auditoria. Quando há supressões configuradas, a saída ativa também mantém uma constatação informativa `security.audit.suppressions.active` que não pode ser suprimida, para que os leitores saibam que a auditoria foi filtrada. Os sinalizadores de configuração perigosos são emitidos individualmente, um por constatação, portanto aceitar um sinalizador perigoso não oculta outros sinalizadores habilitados que compartilham o mesmo checkId `config.insecure_or_dangerous_flags`.

Como as supressões podem ocultar riscos persistentes, adicioná-las ou removê-las por meio de comandos de shell executados pelo agente exige aprovação de execução, a menos que a execução já esteja em andamento com `security="full"` e `ask="off"` para automação local confiável.

## Saída JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Com `--fix --json`, a saída inclui tanto as ações de correção quanto o relatório final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## O que `--fix` altera

Aplica correções seguras e determinísticas:

- altera ocorrências comuns de `groupPolicy="open"` para `groupPolicy="allowlist"` (incluindo variantes de conta nos canais compatíveis)
- quando a política de grupos do WhatsApp é alterada para `allowlist`, preenche `groupAllowFrom` com base no arquivo `allowFrom` armazenado quando essa lista existe e a configuração ainda não define `allowFrom`
- altera `logging.redactSensitive` de `"off"` para `"tools"`
- restringe as permissões do estado, da configuração e de arquivos confidenciais comuns (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` e artefatos de sessão legados)
- também restringe as permissões dos arquivos de inclusão de configuração referenciados em `openclaw.json`
- usa `chmod` em hosts POSIX e redefinições com `icacls` no Windows

`--fix` **não**:

- rotaciona tokens, senhas ou chaves de API
- desativa ferramentas (`gateway`, `cron`, `exec` etc.)
- altera as opções de vinculação, autenticação ou exposição de rede do Gateway
- remove ou reescreve plugins/Skills

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Auditoria de segurança](/pt-BR/gateway/security)
