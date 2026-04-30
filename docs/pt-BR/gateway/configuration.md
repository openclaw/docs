---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Buscando padrões comuns de configuração
    - Navegando para seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-30T09:47:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json`
com links simbólicos não são compatíveis com escritas gerenciadas pelo OpenClaw; uma escrita atômica pode substituir
o caminho em vez de preservar o link simbólico. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Consulte a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

Agentes e automação devem usar `config.schema.lookup` para obter a documentação exata
em nível de campo antes de editar a configuração. Use esta página para orientação orientada a tarefas e
a [Referência de configuração](/pt-BR/gateway/configuration-reference) para o mapa de campos
mais amplo e os padrões.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para uma configuração interativa, ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para configurações completas para copiar e colar.
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
    A Control UI renderiza um formulário a partir do esquema de configuração ativo, incluindo metadados
    de documentação `title` / `description` dos campos, além de esquemas de plugin e canal quando
    disponíveis, com um editor **Raw JSON** como rota de escape. Para UIs de detalhamento
    e outras ferramentas, o Gateway também expõe `config.schema.lookup` para
    buscar um nó de esquema com escopo por caminho mais resumos dos filhos imediatos.
  </Tab>
  <Tab title="Direct edit">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway monitora o arquivo e aplica alterações automaticamente (veja [recarga automática](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondem totalmente ao esquema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem com que o Gateway **se recuse a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela Control UI
e pela validação. `config.schema.lookup` busca um único nó com escopo por caminho, mais
resumos dos filhos para ferramentas de detalhamento. Metadados de documentação de campo `title`/`description`
são propagados por objetos aninhados, curinga (`*`), item de array (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Esquemas de plugin e canal em runtime são mesclados quando o
registro de manifesto é carregado.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway mantém uma cópia confiável do último estado válido conhecido após cada inicialização bem-sucedida.
Se `openclaw.json` falhar posteriormente na validação (ou remover `gateway.mode`, encolher
bruscamente, ou tiver uma linha de log avulsa prefixada), o OpenClaw preserva o arquivo quebrado
como `.clobbered.*`, restaura a última cópia válida conhecida e registra o motivo da recuperação
nos logs. A próxima interação do agente também recebe um aviso de evento do sistema para que o agente
principal não reescreva cegamente a configuração restaurada. A promoção para o último estado válido conhecido
é ignorada quando um candidato contém placeholders de segredos redigidos, como `***`.
Quando todos os problemas de validação têm escopo em `plugins.entries.<id>...`, o OpenClaw
não executa recuperação do arquivo inteiro. Ele mantém a configuração atual ativa e
expõe a falha local do plugin para que um esquema de plugin ou incompatibilidade de versão do host
não reverta configurações de usuário não relacionadas.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Consulte a página dedicada do canal para as etapas de configuração:

    - [WhatsApp](/pt-BR/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/pt-BR/channels/telegram) — `channels.telegram`
    - [Discord](/pt-BR/channels/discord) — `channels.discord`
    - [Feishu](/pt-BR/channels/feishu) — `channels.feishu`
    - [Google Chat](/pt-BR/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/pt-BR/channels/msteams) — `channels.msteams`
    - [Slack](/pt-BR/channels/slack) — `channels.slack`
    - [Signal](/pt-BR/channels/signal) — `channels.signal`
    - [iMessage](/pt-BR/channels/imessage) — `channels.imessage`
    - [Mattermost](/pt-BR/channels/mattermost) — `channels.mattermost`

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
    Defina o modelo primário e fallbacks opcionais:

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
    - `agents.defaults.imageMaxDimensionPx` controla a redução de escala de imagens de transcript/ferramentas (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Consulte [CLI de modelos](/pt-BR/concepts/models) para alternar modelos no chat e [Failover de modelo](/pt-BR/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para provedores personalizados/auto-hospedados, consulte [Provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Control who can message the bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento de uso único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de permissão pareado)
    - `"open"`: permite todas as DMs recebidas (exige `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Consulte a [referência completa](/pt-BR/gateway/config-channels#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Mensagens de grupo têm como padrão **exigir menção**. Configure padrões de gatilho por agente e mantenha respostas visíveis em salas no caminho padrão de ferramenta de mensagem, a menos que você queira intencionalmente respostas finais automáticas legadas:

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

    - **Menções por metadados**: @-menções nativas (menção por toque do WhatsApp, @bot do Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - **Respostas visíveis**: `messages.visibleReplies` pode exigir envios por ferramenta de mensagem globalmente; `messages.groupChat.visibleReplies` sobrescreve isso para grupos/canais.
    - Consulte a [referência completa](/pt-BR/gateway/config-channels#group-chat-mention-gating) para modos de resposta visível, substituições por canal e modo de chat consigo mesmo.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Use `agents.defaults.skills` para uma linha de base compartilhada e, depois, substitua agentes
    específicos com `agents.list[].skills`:

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

    - Omita `agents.defaults.skills` para Skills irrestritos por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para nenhum Skills.
    - Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    Controle com que agressividade o Gateway reinicia canais que parecem obsoletos:

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

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar reinicializações do monitor de integridade globalmente.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar reinicializações automáticas de um canal ou conta sem desabilitar o monitor global.
    - Consulte [Verificações de integridade](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Dê mais tempo aos clientes locais para concluir o handshake WebSocket pré-autenticação em
    hosts carregados ou de baixa potência:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - O padrão é `15000` milissegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ainda tem precedência para substituições pontuais de serviço ou shell.
    - Prefira corrigir travamentos de inicialização/event loop primeiro; este ajuste é para hosts que estão saudáveis, mas lentos durante o aquecimento.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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
    - `threadBindings`: padrões globais para roteamento de sessões vinculadas a conversas (`thread-bound`) (Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulte [Gerenciamento de sessões](/pt-BR/concepts/session) para escopo, vínculos de identidade e política de envio.
    - Consulte a [referência completa](/pt-BR/gateway/config-agents#session) para todos os campos.

  </Accordion>

  <Accordion title="Habilitar isolamento em sandbox">
    Execute sessões de agentes em ambientes de execução sandbox isolados:

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

    Crie a imagem primeiro: `scripts/sandbox-setup.sh`

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/config-agents#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push com suporte por retransmissor para builds oficiais do iOS">
    O push com suporte por retransmissor é configurado em `openclaw.json`.

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

    - Permite que o Gateway envie `push.test`, nudges de despertar e despertares de reconexão por meio do retransmissor externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS pareado. O Gateway não precisa de um token de retransmissor para toda a implantação.
    - Vincula cada registro com suporte por retransmissor à identidade do Gateway com a qual o app iOS foi pareado, para que outro Gateway não possa reutilizar o registro armazenado.
    - Mantém builds iOS locais/manuais em APNs diretos. Envios com suporte por retransmissor se aplicam apenas a builds oficiais distribuídos que se registraram pelo retransmissor.
    - Deve corresponder à URL base do retransmissor incorporada ao build oficial/TestFlight do iOS, para que o tráfego de registro e envio chegue à mesma implantação do retransmissor.

    Fluxo de ponta a ponta:

    1. Instale um build oficial/TestFlight do iOS compilado com a mesma URL base do retransmissor.
    2. Configure `gateway.push.apns.relay.baseUrl` no Gateway.
    3. Pareie o app iOS com o Gateway e permita que as sessões de nó e operador se conectem.
    4. O app iOS busca a identidade do Gateway, registra-se no retransmissor usando App Attest mais o recibo do app e, então, publica o payload `push.apns.register` com suporte por retransmissor no Gateway pareado.
    5. O Gateway armazena o identificador do retransmissor e a concessão de envio e depois os usa para `push.test`, nudges de despertar e despertares de reconexão.

    Observações operacionais:

    - Se você alternar o app iOS para um Gateway diferente, reconecte o app para que ele possa publicar um novo registro de retransmissor vinculado a esse Gateway.
    - Se você distribuir um novo build iOS que aponta para uma implantação de retransmissor diferente, o app atualiza o registro de retransmissor em cache em vez de reutilizar a origem antiga do retransmissor.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por variáveis de ambiente.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma válvula de escape de desenvolvimento apenas para loopback; não persista URLs HTTP de retransmissor na configuração.

    Consulte [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do retransmissor.

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

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desabilitar.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo, `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Consulte [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar tarefas Cron">
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

    - `sessionRetention`: remove sessões de execução isoladas concluídas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: remove `cron/runs/<jobId>.jsonl` por tamanho e linhas mantidas.
    - Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para uma visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (ganchos)">
    Habilite endpoints de Webhook HTTP no Gateway:

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
    - Trate todo conteúdo de payload de gancho/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de ganchos usa apenas cabeçalhos (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhooks em um subcaminho dedicado, como `/hooks`.
    - Mantenha as flags de bypass de conteúdo inseguro desabilitadas (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), exceto para depuração com escopo bem restrito.
    - Se você habilitar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por ganchos, prefira categorias de modelos modernos fortes e política de ferramentas estrita (por exemplo, apenas mensagens mais sandboxing quando possível).

    Consulte a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento multiagente">
    Execute vários agentes isolados com espaços de trabalho e sessões separados:

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

    - **Arquivo único**: substitui o objeto que o contém
    - **Array de arquivos**: mesclado profundamente na ordem (o posterior vence)
    - **Chaves irmãs**: mescladas após inclusões (substituem valores incluídos)
    - **Inclusões aninhadas**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que faz a inclusão
    - **Gravações pertencentes ao OpenClaw**: quando uma gravação altera apenas uma seção de nível superior
      apoiada por uma inclusão de arquivo único como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through sem suporte**: inclusões raiz, arrays de inclusão e inclusões
      com substituições irmãs falham fechadas para gravações pertencentes ao OpenClaw em vez de
      achatar a configuração
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de análise e inclusões circulares

  </Accordion>
</AccordionGroup>

## Recarga dinâmica da configuração

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente — sem necessidade de reinicialização manual para a maioria das configurações.

Edições diretas de arquivo são tratadas como não confiáveis até serem validadas. O observador aguarda
a instabilidade de gravação temporária/renomeação do editor se estabilizar, lê o arquivo final e rejeita
edições externas inválidas restaurando a última configuração válida conhecida. Gravações de configuração
pertencentes ao OpenClaw usam o mesmo gate de esquema antes de gravar; sobrescritas destrutivas
como remover `gateway.mode` ou reduzir o arquivo em mais da metade são rejeitadas
e salvas como `.rejected.*` para inspeção.

Falhas de validação locais de Plugin são a exceção: se todos os problemas estiverem sob
`plugins.entries.<id>...`, a recarga mantém a configuração atual e relata o problema do Plugin
em vez de restaurar `.last-good`.

Se você vir `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` nos logs, inspecione o arquivo
`.clobbered.*` correspondente ao lado de `openclaw.json`, corrija o payload rejeitado e então execute
`openclaw config validate`. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config)
para a lista de verificação de recuperação.

### Modos de recarga

| Modo                   | Comportamento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica dinamicamente alterações seguras instantaneamente. Reinicia automaticamente para alterações críticas.           |
| **`hot`**              | Aplica dinamicamente apenas alterações seguras. Registra um aviso quando uma reinicialização é necessária — você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.                                 |
| **`off`**              | Desabilita a observação de arquivos. As alterações entram em vigor na próxima reinicialização manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado dinamicamente versus o que precisa de reinicialização

A maioria dos campos é aplicada dinamicamente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria            | Campos                                                            | Precisa reiniciar? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canais            | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de Plugin | Não              |
| Agente e modelos      | `agent`, `agents`, `models`, `routing`                            | Não              |
| Automação          | `hooks`, `cron`, `agent.heartbeat`                                | Não              |
| Sessões e mensagens | `session`, `messages`                                             | Não              |
| Ferramentas e mídia       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Não              |
| IU e diversos           | `ui`, `logging`, `identity`, `bindings`                           | Não              |
| Servidor Gateway      | `gateway.*` (porta, bind, autenticação, Tailscale, TLS, HTTP)              | **Sim**         |
| Infraestrutura      | `discovery`, `canvasHost`, `plugins`                              | **Sim**         |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** aciona uma reinicialização.
</Note>

### Planejamento de recarga

Ao editar um arquivo de origem referenciado por `$include`, o OpenClaw planeja
o recarregamento a partir do layout criado na origem, não da visualização
achatada em memória. Isso mantém as decisões de recarregamento a quente
(aplicação a quente vs reinicialização) previsíveis mesmo quando uma única seção
de nível superior reside em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento de recarregamento falha de modo fechado se o
layout de origem for ambíguo.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam configuração pela API do Gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó de esquema superficial + resumos de filhos)
- `config.get` para buscar o snapshot atual mais `hash`
- `config.patch` para atualizações parciais (JSON merge patch: objetos são mesclados, `null`
  exclui, arrays substituem)
- `config.apply` somente quando você pretende substituir toda a configuração
- `update.run` para autoatualização explícita mais reinicialização
- `update.status` para inspecionar o sentinela de reinicialização da atualização mais recente e verificar a versão em execução após uma reinicialização

Agentes devem tratar `config.schema.lookup` como a primeira parada para a documentação e as restrições exatas
em nível de campo. Use [Referência de configuração](/pt-BR/gateway/configuration-reference)
quando precisarem do mapa de configuração mais amplo, padrões ou links para referências dedicadas
de subsistemas.

<Note>
Gravações do plano de controle (`config.apply`, `config.patch`, `update.run`) são
limitadas a 3 solicitações por 60 segundos por `deviceId+clientIp`. Solicitações de
reinicialização são consolidadas e então impõem um intervalo de espera de 30 segundos entre ciclos de reinicialização.
`update.status` é somente leitura, mas escopado a administradores, porque o sentinela de reinicialização pode
incluir resumos de etapas de atualização e finais de saída de comandos.
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

O OpenClaw lê variáveis de ambiente do processo pai e também de:

- `.env` do diretório de trabalho atual (se existir)
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
  Se ativado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa somente as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variável de ambiente equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Referencie variáveis de ambiente em qualquer valor de string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Somente nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referências de segredos (env, arquivo, exec)">
  Para campos que aceitam objetos SecretRef, você pode usar:

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
Os caminhos de credenciais compatíveis estão listados em [Superfície de credenciais de SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Consulte [Ambiente](/pt-BR/help/environment) para a precedência e as fontes completas.

## Referência completa

Para a referência completa campo a campo, consulte **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Runbook do Gateway](/pt-BR/gateway)
