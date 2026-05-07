---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Como navegar até seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-05-07T13:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lê uma configuração opcional <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json`
com link simbólico não são compatíveis com gravações pertencentes ao OpenClaw; uma gravação atômica pode substituir
o caminho em vez de preservar o link simbólico. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Consulte a [referência completa](/pt-BR/gateway/configuration-reference) para ver todos os campos disponíveis.

Agentes e automação devem usar `config.schema.lookup` para obter a documentação exata
em nível de campo antes de editar a configuração. Use esta página para orientação orientada a tarefas e a
[Referência de configuração](/pt-BR/gateway/configuration-reference) para o mapa mais amplo
de campos e padrões.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para uma configuração interativa, ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para configurações completas prontas para copiar e colar.
</Tip>

## Configuração mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editando a configuração

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Control UI renderiza um formulário a partir do esquema de configuração ativo, incluindo metadados de documentação
    `title` / `description` dos campos, além de esquemas de Plugin e canal quando
    disponíveis, com um editor **Raw JSON** como saída alternativa. Para UIs de detalhamento
    e outras ferramentas, o Gateway também expõe `config.schema.lookup` para
    buscar um nó de esquema com escopo de caminho mais resumos imediatos dos filhos.
  </Tab>
  <Tab title="Direct edit">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (consulte [recarga dinâmica](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondam totalmente ao esquema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem com que o Gateway **se recuse a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela Control UI
e pela validação. `config.schema.lookup` busca um único nó com escopo de caminho, além de
resumos dos filhos, para ferramentas de detalhamento. Os metadados de documentação dos campos `title`/`description`
são propagados por objetos aninhados, curinga (`*`), item de array (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Esquemas de Plugin e canal em tempo de execução são mesclados quando o
registro de manifesto é carregado.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway mantém uma cópia confiável da última configuração válida conhecida após cada inicialização bem-sucedida,
mas a inicialização e a recarga dinâmica não a restauram automaticamente. Se `openclaw.json`
falhar na validação (incluindo validação local de Plugin), a inicialização do Gateway falha ou
a recarga é ignorada, e o runtime atual mantém a última configuração aceita.
Execute `openclaw doctor --fix` (ou `--yes`) para reparar uma configuração prefixada/sobrescrita ou
restaurar a última cópia válida conhecida. A promoção para a última configuração válida conhecida é ignorada quando um
candidato contém placeholders de segredos redigidos, como `***`.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Consulte a página dedicada do canal para ver as etapas de configuração:

    - [WhatsApp](/pt-BR/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/pt-BR/channels/telegram) - `channels.telegram`
    - [Discord](/pt-BR/channels/discord) - `channels.discord`
    - [Feishu](/pt-BR/channels/feishu) - `channels.feishu`
    - [Google Chat](/pt-BR/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/pt-BR/channels/msteams) - `channels.msteams`
    - [Slack](/pt-BR/channels/slack) - `channels.slack`
    - [Signal](/pt-BR/channels/signal) - `channels.signal`
    - [iMessage](/pt-BR/channels/imessage) - `channels.imessage`
    - [Mattermost](/pt-BR/channels/mattermost) - `channels.mattermost`

    Todos os canais compartilham o mesmo padrão de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    Defina o modelo principal e fallbacks opcionais:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define o catálogo de modelos e atua como allowlist para `/model`.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à allowlist sem remover modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que você passe `--replace`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla a redução de escala de imagens de transcrição/ferramenta (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Consulte [CLI de modelos](/pt-BR/concepts/models) para alternar modelos no chat e [Failover de modelo](/pt-BR/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para provedores personalizados/auto-hospedados, consulte [Provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controle quem pode enviar mensagens para o bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: somente remetentes em `allowFrom` (ou no armazenamento de permissões pareado)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou listas de permissão específicas do canal.

    Consulte a [referência completa](/pt-BR/gateway/config-channels#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configure o controle de menções em chats de grupo">
    Mensagens de grupo, por padrão, **exigem menção**. Configure padrões de acionamento por agente e mantenha respostas visíveis em salas no caminho padrão da ferramenta de mensagens, a menos que você queira intencionalmente respostas finais automáticas legadas:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menções de metadados**: @menções nativas (toque para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - **Respostas visíveis**: `messages.visibleReplies` pode exigir envios pela ferramenta de mensagens globalmente; `messages.groupChat.visibleReplies` substitui isso para grupos/canais.
    - Consulte a [referência completa](/pt-BR/gateway/config-channels#group-chat-mention-gating) para modos de resposta visível, substituições por canal e modo de chat consigo mesmo.

  </Accordion>

  <Accordion title="Restrinja Skills por agente">
    Use `agents.defaults.skills` para uma base compartilhada e, em seguida, substitua agentes específicos com `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para nenhuma Skills.
    - Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de Configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuste o monitoramento de integridade dos canais do Gateway">
    Controle a agressividade com que o Gateway reinicia canais que parecem obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar globalmente reinicializações pelo monitoramento de integridade.
    - `channelStaleEventThresholdMinutes` deve ser maior que ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar reinicializações automáticas de um canal ou conta sem desabilitar o monitor global.
    - Consulte [Verificações de Integridade](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Ajuste o tempo limite do handshake WebSocket do Gateway">
    Dê a clientes locais mais tempo para concluir o handshake WebSocket de pré-autenticação em hosts carregados ou de baixa potência:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - O padrão é `15000` milissegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ainda tem precedência para substituições pontuais de serviço ou shell.
    - Prefira corrigir travamentos de inicialização/loop de eventos primeiro; este ajuste é para hosts que estão saudáveis, mas lentos durante o aquecimento.

  </Accordion>

  <Accordion title="Configure sessões e redefinições">
    Sessões controlam a continuidade e o isolamento da conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartilhado) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para roteamento de sessão vinculado a thread (Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulte [Gerenciamento de Sessões](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
    - Consulte a [referência completa](/pt-BR/gateway/config-agents#session) para todos os campos.

  </Accordion>

  <Accordion title="Ativar sandboxing">
    Execute sessões de agente em runtimes de sandbox isolados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Crie a imagem primeiro - a partir de um checkout do código-fonte, execute `scripts/sandbox-setup.sh`; ou, a partir de uma instalação npm, veja o comando `docker build` inline em [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup).

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e [referência completa](/pt-BR/gateway/config-agents#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Ativar push com suporte de relay para builds oficiais do iOS">
    O push com suporte de relay é configurado em `openclaw.json`.

    Defina isto na configuração do Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente na CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    O que isso faz:

    - Permite que o Gateway envie `push.test`, sinais de ativação e ativações de reconexão pelo relay externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS pareado. O Gateway não precisa de um token de relay para toda a implantação.
    - Vincula cada registro com suporte de relay à identidade do Gateway com a qual o app iOS foi pareado, para que outro Gateway não consiga reutilizar o registro armazenado.
    - Mantém builds locais/manuais do iOS em APNs diretos. Envios com suporte de relay se aplicam apenas a builds oficiais distribuídos que se registraram pelo relay.
    - Deve corresponder à URL base do relay incorporada ao build oficial/TestFlight do iOS, para que o tráfego de registro e envio chegue à mesma implantação de relay.

    Fluxo de ponta a ponta:

    1. Instale um build oficial/TestFlight do iOS que foi compilado com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no Gateway.
    3. Pareie o app iOS com o Gateway e deixe as sessões de node e operador se conectarem.
    4. O app iOS busca a identidade do Gateway, registra-se no relay usando App Attest mais o recibo do app e, em seguida, publica o payload `push.apns.register` com suporte de relay no Gateway pareado.
    5. O Gateway armazena o identificador do relay e a concessão de envio e depois os usa para `push.test`, sinais de ativação e ativações de reconexão.

    Observações operacionais:

    - Se você alternar o app iOS para um Gateway diferente, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse Gateway.
    - Se você publicar um novo build do iOS que aponta para uma implantação de relay diferente, o app atualiza seu registro de relay em cache em vez de reutilizar a origem de relay antiga.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma rota de escape de desenvolvimento apenas para loopback; não persista URLs de relay HTTP na configuração.

    Consulte [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (check-ins periódicos)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desativar.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Consulte [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar trabalhos Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: remove sessões isoladas de execuções concluídas de `sessions.json` (padrão `24h`; defina `false` para desativar).
    - `runLog`: reduz `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Consulte [trabalhos Cron](/pt-BR/automation/cron-jobs) para a visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Ative endpoints HTTP de Webhook no Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Observação de segurança:
    - Trate todo o conteúdo de payload de hook/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook usa apenas cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha as flags de bypass de conteúdo inseguro desativadas (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), exceto ao fazer depuração com escopo estrito.
    - Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para delimitar chaves de sessão escolhidas pelo chamador.
    - Para agentes acionados por hook, prefira camadas de modelo modernas e fortes e uma política de ferramentas estrita (por exemplo, apenas mensagens mais sandboxing quando possível).

    Consulte a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e a integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multiagente">
    Execute vários agentes isolados com workspaces e sessões separados:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Consulte [Multiagente](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/config-agents#multi-agent-routing) para regras de vinculação e perfis de acesso por agente.

  </Accordion>

  <Accordion title="Dividir a configuração em vários arquivos ($include)">
    Use `$include` para organizar configurações grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Arquivo único**: substitui o objeto contêiner
    - **Array de arquivos**: mesclados profundamente em ordem (o posterior vence)
    - **Chaves irmãs**: mescladas após includes (sobrescrevem valores incluídos)
    - **Includes aninhados**: compatíveis com até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que faz a inclusão
    - **Gravações pertencentes ao OpenClaw**: quando uma gravação altera apenas uma seção de nível superior
      apoiada por um include de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through sem suporte**: includes na raiz, arrays de includes e includes
      com sobrescritas irmãs falham de modo fechado para gravações pertencentes ao OpenClaw, em vez de
      achatar a configuração
    - **Confinamento**: caminhos `$include` devem resolver sob o diretório que contém
      `openclaw.json`. Para compartilhar uma árvore entre máquinas ou usuários, defina
      `OPENCLAW_INCLUDE_ROOTS` como uma lista de caminhos (`:` no POSIX, `;` no Windows) de
      diretórios adicionais que includes podem referenciar. Symlinks são resolvidos
      e verificados novamente, portanto um caminho que lexicalmente fica em um diretório de configuração, mas cujo
      destino real escapa de toda raiz permitida, ainda é rejeitado.
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de análise e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga a quente da configuração

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente - não é necessária reinicialização manual para a maioria das configurações.

Edições diretas de arquivo são tratadas como não confiáveis até serem validadas. O watcher espera
a movimentação de gravação temporária/renomeação do editor se estabilizar, lê o arquivo final e rejeita
edições externas inválidas sem regravar `openclaw.json`. Gravações de configuração pertencentes ao OpenClaw
usam o mesmo gate de esquema antes de gravar; sobrescritas destrutivas, como
remover `gateway.mode` ou reduzir o arquivo em mais da metade, são rejeitadas e
salvas como `.rejected.*` para inspeção.

Se você vir `config reload skipped (invalid config)` ou a inicialização relatar `Invalid
config`, inspecione a configuração, execute `openclaw config validate` e então execute `openclaw
doctor --fix` para reparo. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config)
para a checklist.

### Modos de recarga

| Modo                   | Comportamento                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica a quente alterações seguras instantaneamente. Reinicia automaticamente para alterações críticas. |
| **`hot`**              | Aplica a quente apenas alterações seguras. Registra um aviso quando uma reinicialização é necessária - você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.                     |
| **`off`**              | Desativa o monitoramento de arquivos. As alterações entram em vigor na próxima reinicialização manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que aplica a quente versus o que precisa de reinicialização

A maioria dos campos aplica a quente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria           | Campos                                                            | Precisa reiniciar? |
| ------------------- | ----------------------------------------------------------------- | ------------------ |
| Canais              | `channels.*`, `web` (WhatsApp) - todos os canais integrados e de Plugin | Não                |
| Agente e modelos    | `agent`, `agents`, `models`, `routing`                            | Não                |
| Automação           | `hooks`, `cron`, `agent.heartbeat`                                | Não                |
| Sessões e mensagens | `session`, `messages`                                             | Não                |
| Ferramentas e mídia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Não                |
| UI e diversos       | `ui`, `logging`, `identity`, `bindings`                           | Não                |
| Servidor do Gateway | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)             | **Sim**            |
| Infraestrutura      | `discovery`, `plugins`                                            | **Sim**            |

<Note>
`gateway.reload` e `gateway.remote` são exceções - alterá-los **não** aciona uma reinicialização.
</Note>

### Planejamento de recarga

Quando você edita um arquivo-fonte referenciado por meio de `$include`, o OpenClaw planeja
o recarregamento a partir do layout criado na fonte, não da visualização nivelada em memória.
Isso mantém as decisões de recarregamento a quente (aplicação a quente vs reinicialização) previsíveis mesmo quando uma
única seção de nível superior vive em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento de recarregamento falha de modo fechado se o
layout da fonte for ambíguo.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam configurações pela API do Gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó de esquema raso + resumos
  dos filhos)
- `config.get` para buscar o snapshot atual mais o `hash`
- `config.patch` para atualizações parciais (patch de mesclagem JSON: objetos são mesclados, `null`
  exclui, arrays substituem)
- `config.apply` somente quando você pretende substituir a configuração inteira
- `update.run` para autoatualização explícita mais reinicialização; inclua `continuationMessage` quando a sessão pós-reinicialização deve executar um turno de acompanhamento
- `update.status` para inspecionar o sentinel de reinicialização da atualização mais recente e verificar a versão em execução após uma reinicialização

Agentes devem tratar `config.schema.lookup` como o primeiro ponto de consulta para documentação e restrições exatas
em nível de campo. Use [Referência de configuração](/pt-BR/gateway/configuration-reference)
quando precisarem do mapa de configuração mais amplo, padrões ou links para referências dedicadas
de subsistemas.

<Note>
Gravações no plano de controle (`config.apply`, `config.patch`, `update.run`) são
limitadas a 3 requisições por 60 segundos por `deviceId+clientIp`. Solicitações de reinicialização
são agrupadas e então impõem um intervalo de espera de 30 segundos entre ciclos de reinicialização.
`update.status` é somente leitura, mas tem escopo administrativo porque o sentinel de reinicialização pode
incluir resumos das etapas de atualização e finais de saída de comandos.
</Note>

Exemplo de patch parcial:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` quanto `config.patch` aceitam `raw`, `baseHash`, `sessionKey`,
`note` e `restartDelayMs`. `baseHash` é obrigatório para ambos os métodos quando uma
configuração já existe.

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai, além de:

- `.env` do diretório de trabalho atual (se presente)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos substitui variáveis de ambiente existentes. Você também pode definir variáveis de ambiente inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de env do shell (opcional)">
  Se habilitado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente de variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Referencie variáveis de ambiente em qualquer valor de string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram um erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referências secretas (env, arquivo, exec)">
  Para campos compatíveis com objetos SecretRef, você pode usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Os caminhos de credenciais compatíveis estão listados em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Consulte [Ambiente](/pt-BR/help/environment) para precedência e fontes completas.

## Referência completa

Para a referência completa campo a campo, consulte **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Runbook do Gateway](/pt-BR/gateway)
