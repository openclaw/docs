---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando para seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-26T11:28:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

O OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 suporta comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho de configuração ativo precisa ser um arquivo regular. Layouts de
`openclaw.json` com symlink não são compatíveis com gravações de propriedade do OpenClaw; uma gravação atômica pode substituir
o caminho em vez de preservar o symlink. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Consulte a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

Agentes e automação devem usar `config.schema.lookup` para documentação exata em nível de campo
antes de editar a configuração. Use esta página para orientação baseada em tarefas e a
[Referência de configuração](/pt-BR/gateway/configuration-reference) para o mapa mais amplo de campos e padrões.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para configuração interativa ou consulte o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para configurações completas prontas para copiar e colar.
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
  <Tab title="Assistente interativo">
    ```bash
    openclaw onboard       # fluxo completo de onboarding
    openclaw configure     # assistente de configuração
    ```
  </Tab>
  <Tab title="CLI (comandos de uma linha)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Control UI renderiza um formulário a partir do schema de configuração ativo, incluindo
    metadados de documentação `title` / `description` dos campos, além de schemas de Plugin e canal quando
    disponíveis, com um editor **Raw JSON** como escape hatch. Para UIs de drill-down
    e outras ferramentas, o gateway também expõe `config.schema.lookup` para
    buscar um nó do schema com escopo de caminho mais resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (consulte [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondam totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela Control UI
e pela validação. `config.schema.lookup` busca um único nó com escopo de caminho mais
resumos dos filhos para ferramentas de drill-down. Os metadados de documentação `title`/`description`
dos campos se propagam por objetos aninhados, curingas (`*`), itens de array (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Schemas de Plugin e canal em runtime são mesclados quando o
registro de manifests é carregado.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway mantém uma cópia confiável do último estado válido após cada inicialização bem-sucedida.
Se `openclaw.json` falhar na validação depois (ou perder `gateway.mode`, reduzir
drasticamente ou tiver uma linha de log estranha anexada no início), o OpenClaw preserva o arquivo com problema
como `.clobbered.*`, restaura a última cópia válida e registra o motivo da recuperação
em log. A próxima rodada do agente também recebe um aviso por system-event para que o agente principal não regrave cegamente a configuração restaurada. A promoção a último estado válido
é ignorada quando um candidato contém placeholders de segredo redigidos, como `***`.
Quando todos os problemas de validação estiverem no escopo de `plugins.entries.<id>...`, o OpenClaw
não faz recuperação do arquivo inteiro. Ele mantém a configuração atual ativa e
expõe a falha local do Plugin para que um desencontro entre schema de Plugin ou versão do host
não reverta configurações do usuário não relacionadas.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
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

  <Accordion title="Escolher e configurar modelos">
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

    - `agents.defaults.models` define o catálogo de modelos e funciona como allowlist para `/model`.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à allowlist sem remover modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que você passe `--replace`.
    - Refs de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagens da transcrição/ferramentas (padrão `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Consulte [CLI de modelos](/pt-BR/concepts/models) para trocar modelos no chat e [Failover de modelo](/pt-BR/concepts/model-failover) para comportamento de rotação de autenticação e fallback.
    - Para providers personalizados/self-hosted, consulte [Providers personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código único de pareamento para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de permissão pareado)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Consulte a [referência completa](/pt-BR/gateway/config-channels#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar gate de menções em chat de grupo">
    Mensagens de grupo exigem **menção obrigatória** por padrão. Configure padrões por agente:

    ```json5
    {
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

    - **Menções por metadados**: @menções nativas (WhatsApp tocar para mencionar, Telegram @bot etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Consulte a [referência completa](/pt-BR/gateway/config-channels#group-chat-mention-gating) para substituições por canal e modo de autochat.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` para uma base compartilhada e depois substitua agentes específicos com `agents.list[].skills`:

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
    - Defina `agents.list[].skills: []` para não ter Skills.
    - Consulte [Skills](/pt-BR/tools/skills), [configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de saúde de canais do gateway">
    Controle quão agressivamente o gateway reinicia canais que parecem obsoletos:

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

    - Defina `gateway.channelHealthCheckMinutes: 0` para desativar globalmente reinicializações por monitoramento de saúde.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desativar reinicializações automáticas para um canal ou conta sem desativar o monitor global.
    - Consulte [Health Checks](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
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
    - `threadBindings`: padrões globais para roteamento de sessão vinculado a thread (o Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulte [Gerenciamento de sessões](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
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

    Compile a imagem primeiro: `scripts/sandbox-setup.sh`

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/config-agents#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Ativar push com suporte de relay para builds oficiais do iOS">
    O push com suporte de relay é configurado em `openclaw.json`.

    Defina isto na configuração do gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Padrão: 10000
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

    - Permite que o gateway envie `push.test`, toques de ativação e ativações de reconexão por meio do relay externo.
    - Usa uma permissão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay válido para toda a implantação.
    - Vincula cada registro com suporte de relay à identidade do gateway com a qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds locais/manuais do iOS em APNs direto. Envios com suporte de relay se aplicam apenas a builds oficiais distribuídas que se registraram por meio do relay.
    - Deve corresponder à URL base do relay incorporada na build oficial/TestFlight do iOS, para que o registro e o tráfego de envio cheguem à mesma implantação do relay.

    Fluxo completo de ponta a ponta:

    1. Instale uma build oficial/TestFlight do iOS que tenha sido compilada com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Faça o pareamento do app iOS com o gateway e permita que as sessões de node e operador se conectem.
    4. O app iOS busca a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e então publica o payload `push.apns.register` com suporte de relay no gateway pareado.
    5. O gateway armazena o identificador do relay e a permissão de envio e então os usa para `push.test`, toques de ativação e ativações de reconexão.

    Observações operacionais:

    - Se você trocar o app iOS para outro gateway, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse gateway.
    - Se você distribuir uma nova build do iOS que aponte para uma implantação de relay diferente, o app atualiza seu registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma válvula de escape de desenvolvimento restrita a loopback; não persista URLs HTTP de relay na configuração.

    Consulte [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo completo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

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

  <Accordion title="Configurar tarefas Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: remove sessões concluídas de execuções isoladas de `sessions.json` (padrão `24h`; defina `false` para desativar).
    - `runLog`: remove dados de `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para visão geral do recurso e exemplos de CLI.

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
    - Trate todo conteúdo de payload de hook/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize o token compartilhado do Gateway.
    - A autenticação de hook é apenas por cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens na query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desativadas as flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração com escopo estrito.
    - Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por hook, prefira camadas modernas e fortes de modelo e política estrita de ferramentas (por exemplo, apenas mensagens mais sandboxing sempre que possível).

    Consulte a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

  </Accordion>

  <Accordion title="Configurar roteamento com vários agentes">
    Execute vários agentes isolados com workspaces e sessões separadas:

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

    Consulte [Multi-Agent](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/config-agents#multi-agent-routing) para regras de binding e perfis de acesso por agente.

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
    - **Array de arquivos**: deep-merge em ordem (o último prevalece)
    - **Chaves irmãs**: mescladas após os includes (substituem valores incluídos)
    - **Includes aninhados**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Gravações de propriedade do OpenClaw**: quando uma gravação altera apenas uma única seção de nível superior
      com suporte de include de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through não compatível**: includes na raiz, arrays de include e includes
      com substituições de chaves irmãs falham de forma segura para gravações de propriedade do OpenClaw em vez de
      achatar a configuração
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de análise e includes circulares

  </Accordion>
</AccordionGroup>

## Hot reload da configuração

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente — não é necessário reiniciar manualmente para a maioria das configurações.

Edições diretas no arquivo são tratadas como não confiáveis até serem validadas. O watcher aguarda
a estabilização de churn de gravação temporária/renomeação do editor, lê
o arquivo final e rejeita edições externas inválidas restaurando a última configuração válida. Gravações de configuração de propriedade do OpenClaw
usam o mesmo gate de schema antes de gravar; sobrescritas destrutivas como
remover `gateway.mode` ou reduzir o arquivo em mais da metade são rejeitadas
e salvas como `.rejected.*` para inspeção.

Falhas locais de validação de Plugin são a exceção: se todos os problemas estiverem em
`plugins.entries.<id>...`, o reload mantém a configuração atual e relata o problema do Plugin
em vez de restaurar `.last-good`.

Se você vir `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` nos logs, inspecione o arquivo
`.clobbered.*` correspondente ao lado de `openclaw.json`, corrija o payload rejeitado e então execute
`openclaw config validate`. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config)
para a checklist de recuperação.

### Modos de reload

| Modo                   | Comportamento                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão)  | Aplica mudanças seguras instantaneamente. Reinicia automaticamente para as críticas. |
| **`hot`**              | Aplica apenas mudanças seguras. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.             |
| **`off`**              | Desativa a observação de arquivos. As alterações entram em vigor na próxima reinicialização manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado a quente vs o que exige reinicialização

A maioria dos campos é aplicada a quente sem downtime. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria            | Campos                                                            | Precisa reiniciar? |
| ------------------- | ----------------------------------------------------------------- | ------------------ |
| Canais              | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de Plugin | Não            |
| Agente e modelos    | `agent`, `agents`, `models`, `routing`                            | Não                |
| Automação           | `hooks`, `cron`, `agent.heartbeat`                                | Não                |
| Sessões e mensagens | `session`, `messages`                                             | Não                |
| Ferramentas e mídia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Não                |
| UI e diversos       | `ui`, `logging`, `identity`, `bindings`                           | Não                |
| Servidor Gateway    | `gateway.*` (porta, bind, autenticação, tailscale, TLS, HTTP)     | **Sim**            |
| Infraestrutura      | `discovery`, `canvasHost`, `plugins`                              | **Sim**            |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** aciona reinicialização.
</Note>

### Planejamento de reload

Quando você edita um arquivo-fonte referenciado por meio de `$include`, o OpenClaw planeja
o reload a partir do layout criado no código-fonte, não da visão achatada em memória.
Isso mantém previsíveis as decisões de hot-reload (aplicar a quente vs reiniciar), mesmo quando uma
única seção de nível superior vive em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento de reload falha de forma segura se o
layout de origem for ambíguo.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam configuração pela API do gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó superficial do schema + resumos
  dos filhos)
- `config.get` para buscar o snapshot atual mais `hash`
- `config.patch` para atualizações parciais (JSON merge patch: objetos se mesclam, `null`
  exclui, arrays substituem)
- `config.apply` apenas quando você pretende substituir a configuração inteira
- `update.run` para autoatualização explícita mais reinicialização

Agentes devem tratar `config.schema.lookup` como a primeira parada para documentação exata
e restrições em nível de campo. Use a [Referência de configuração](/pt-BR/gateway/configuration-reference)
quando precisarem do mapa mais amplo da configuração, padrões ou links para referências
dedicadas de subsistemas.

<Note>
Gravações do plano de controle (`config.apply`, `config.patch`, `update.run`) são
limitadas a 3 requisições por 60 segundos por `deviceId+clientIp`. Solicitações de reinicialização
são agrupadas e então aplicam um cooldown de 30 segundos entre ciclos de reinicialização.
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

O OpenClaw lê variáveis de ambiente do processo pai mais:

- `.env` do diretório de trabalho atual (se presente)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos substitui variáveis de ambiente já existentes. Você também pode definir variáveis de ambiente inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de env do shell (opcional)">
  Se ativado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente por variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- Apenas nomes em maiúsculas são reconhecidos: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram um erro no momento do carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRefs (env, file, exec)">
  Para campos que oferecem suporte a objetos SecretRef, você pode usar:

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

Os detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Os caminhos de credenciais compatíveis estão listados em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Consulte [Ambiente](/pt-BR/help/environment) para precedência e fontes completas.

## Referência completa

Para a referência completa campo por campo, consulte **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Guia operacional do Gateway](/pt-BR/gateway)
