---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando até seções específicas da configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-04-23T14:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuração

O OpenClaw lê uma configuração opcional em <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts de
`openclaw.json` com symlink não são compatíveis com gravações feitas pelo OpenClaw; uma gravação atômica pode substituir
o caminho em vez de preservar o symlink. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usa padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (Cron, hooks)
- Ajustar sessões, mídia, rede ou interface

Veja a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

<Tip>
**Novo na configuração?** Comece com `openclaw onboard` para a configuração interativa ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para ver configurações completas prontas para copiar e colar.
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
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interface de controle">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Interface de controle renderiza um formulário a partir do schema de configuração ativo, incluindo metadados de documentação de campo
    `title` / `description`, além de schemas de plugin e canal quando
    disponíveis, com um editor de **JSON bruto** como rota de escape. Para interfaces
    de navegação detalhada e outras ferramentas, o gateway também expõe `config.schema.lookup` para
    buscar um único nó do schema com escopo de caminho e resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (veja [recarregamento dinâmico](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw só aceita configurações que correspondam totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela Interface de controle
e pela validação. `config.schema.lookup` busca um único nó com escopo de caminho mais
resumos dos filhos para ferramentas de navegação detalhada. Metadados de documentação `title`/`description`
de campos são propagados por objetos aninhados, curingas (`*`), itens de array (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Schemas de plugin e canal em runtime são mesclados quando o
registro de manifestos é carregado.

Quando a validação falha:

- O Gateway não inicia
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway mantém uma cópia confiável do último estado válido após cada inicialização bem-sucedida.
Se `openclaw.json` falhar na validação depois (ou remover `gateway.mode`, encolher
muito, ou tiver uma linha solta de log adicionada no início), o OpenClaw preserva o arquivo
quebrado como `.clobbered.*`, restaura a última cópia válida conhecida e registra o motivo
da recuperação. A próxima rodada do agente também recebe um aviso de evento do sistema para que o agente
principal não reescreva cegamente a configuração restaurada. A promoção para último estado válido conhecido
é ignorada quando um candidato contém placeholders redigidos de segredo, como `***`.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Veja a página dedicada do canal para as etapas de configuração:

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

    - `agents.defaults.models` define o catálogo de modelos e atua como allowlist para `/model`.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à allowlist sem remover modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que você passe `--replace`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla a redução de escala de imagens de transcrição/ferramentas (padrão `1200`); valores menores normalmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Veja [CLI de modelos](/pt-BR/concepts/models) para trocar modelos no chat e [Failover de modelo](/pt-BR/concepts/model-failover) para comportamento de rotação de autenticação e fallback.
    - Para providers personalizados/hospedados por conta própria, veja [Providers personalizados](/pt-BR/gateway/configuration-reference#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso a DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código único de emparelhamento para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de permissão emparelhado)
    - `"open"`: permite todas as DMs recebidas (exige `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar bloqueio por menção no chat em grupo">
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

    - **Menções de metadados**: @-mentions nativos (tocar para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#group-chat-mention-gating) para substituições por canal e modo de conversa consigo mesmo.

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
          { id: "writer" }, // herda github, weather
          { id: "docs", skills: ["docs-search"] }, // substitui os padrões
          { id: "locked-down", skills: [] }, // sem Skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para nenhum Skill.
    - Veja [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de configuração](/pt-BR/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento de integridade de canais do gateway">
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

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar globalmente reinicializações por monitor de integridade.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar reinicializações automáticas de um canal ou conta sem desabilitar o monitor global.
    - Veja [Verificações de integridade](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
    Sessões controlam continuidade e isolamento de conversa:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para vários usuários
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

    - `dmScope`: `main` (compartilhada) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para roteamento de sessão com binding de thread (o Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Veja [Gerenciamento de sessão](/pt-BR/concepts/session) para escopo, links de identidade e política de envio.
    - Veja a [referência completa](/pt-BR/gateway/configuration-reference#session) para todos os campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Execute sessões do agente em runtimes isolados de sandbox:

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

    Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push com relay para compilações oficiais do iOS">
    O push com relay é configurado em `openclaw.json`.

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

    - Permite que o gateway envie `push.test`, ativações de wake e wake de reconexão por meio do relay externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS emparelhado. O gateway não precisa de um token de relay de toda a implantação.
    - Vincula cada registro com relay à identidade do gateway com a qual o app iOS foi emparelhado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém compilações locais/manuais do iOS em APNs direto. Envios com relay se aplicam apenas a compilações oficiais distribuídas que se registraram por meio do relay.
    - Deve corresponder à URL base do relay embutida na compilação oficial/TestFlight do iOS, para que o tráfego de registro e envio chegue à mesma implantação do relay.

    Fluxo de ponta a ponta:

    1. Instale uma compilação oficial/TestFlight do iOS que tenha sido compilada com a mesma URL base do relay.
    2. Configure `gateway.push.apns.relay.baseUrl` no gateway.
    3. Emparelhe o app iOS com o gateway e permita que as sessões do Node e do operador se conectem.
    4. O app iOS busca a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e depois publica o payload `push.apns.register` com relay para o gateway emparelhado.
    5. O gateway armazena o identificador do relay e a concessão de envio, e depois os usa para `push.test`, ativações de wake e wakes de reconexão.

    Observações operacionais:

    - Se você trocar o app iOS para outro gateway, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse gateway.
    - Se você distribuir uma nova compilação iOS que aponte para outra implantação de relay, o app atualiza seu registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por variável de ambiente.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma rota de escape de desenvolvimento apenas para loopback; não persista URLs HTTP de relay na configuração.

    Veja [App iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para o fluxo completo de ponta a ponta e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para o modelo de segurança do relay.

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
    - `target`: `last` | `none` | `<channel-id>` (por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Veja [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

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

    - `sessionRetention`: remove sessões concluídas de execuções isoladas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: remove `cron/runs/<jobId>.jsonl` por tamanho e linhas retidas.
    - Veja [Tarefas Cron](/pt-BR/automation/cron-jobs) para a visão geral dos recursos e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Habilite endpoints HTTP de Webhook no Gateway:

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
    - A autenticação de hook é apenas por cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha desabilitadas as flags de bypass de conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), a menos que esteja fazendo depuração com escopo bem restrito.
    - Se você habilitar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por hook, prefira camadas modernas fortes de modelo e política rígida de ferramentas (por exemplo, apenas mensagens, com sandboxing quando possível).

    Veja a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e a integração com Gmail.

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

    Veja [Multi-Agent](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/configuration-reference#multi-agent-routing) para regras de binding e perfis de acesso por agente.

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
    - **Array de arquivos**: mesclado em profundidade em ordem (o posterior prevalece)
    - **Chaves irmãs**: mescladas após os includes (substituem valores incluídos)
    - **Includes aninhados**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Gravações feitas pelo OpenClaw**: quando uma gravação altera apenas uma seção de nível superior
      respaldada por um include de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through não compatível**: includes na raiz, arrays de include e includes
      com substituições em chaves irmãs falham em modo fechado para gravações feitas pelo OpenClaw em vez de
      achatar a configuração
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de parsing e includes circulares

  </Accordion>
</AccordionGroup>

## Recarregamento dinâmico da configuração

O Gateway observa `~/.openclaw/openclaw.json` e aplica alterações automaticamente — não é necessário reinício manual para a maioria das configurações.

Edições diretas no arquivo são tratadas como não confiáveis até serem validadas. O observador espera
a agitação de gravação temporária/renomeação do editor se estabilizar, lê
o arquivo final e rejeita edições externas inválidas restaurando a última configuração válida conhecida. Gravações de configuração
feitas pelo OpenClaw usam a mesma barreira de schema antes de gravar; sobrescritas destrutivas como
remover `gateway.mode` ou reduzir o arquivo em mais da metade são rejeitadas
e salvas como `.rejected.*` para inspeção.

Se você vir `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` nos logs, inspecione o arquivo
`.clobbered.*` correspondente ao lado de `openclaw.json`, corrija o payload rejeitado e então execute
`openclaw config validate`. Veja [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config)
para a lista de verificação de recuperação.

### Modos de recarregamento

| Modo                   | Comportamento                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão)  | Aplica dinamicamente alterações seguras instantaneamente. Reinicia automaticamente para alterações críticas. |
| **`hot`**              | Aplica dinamicamente apenas alterações seguras. Registra um aviso quando é necessário reiniciar — você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.                |
| **`off`**              | Desabilita a observação de arquivos. As alterações entram em vigor no próximo reinício manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado dinamicamente vs. o que precisa de reinício

A maioria dos campos é aplicada dinamicamente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinício são tratadas automaticamente.

| Categoria            | Campos                                                            | Precisa reiniciar? |
| -------------------- | ----------------------------------------------------------------- | ------------------ |
| Canais               | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de plugin | Não           |
| Agente e modelos     | `agent`, `agents`, `models`, `routing`                            | Não                |
| Automação            | `hooks`, `cron`, `agent.heartbeat`                                | Não                |
| Sessões e mensagens  | `session`, `messages`                                             | Não                |
| Ferramentas e mídia  | `tools`, `browser`, `skills`, `audio`, `talk`                     | Não                |
| UI e diversos        | `ui`, `logging`, `identity`, `bindings`                           | Não                |
| Servidor Gateway     | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)             | **Sim**            |
| Infraestrutura       | `discovery`, `canvasHost`, `plugins`                              | **Sim**            |

<Note>
`gateway.reload` e `gateway.remote` são exceções — alterá-los **não** aciona reinício.
</Note>

### Planejamento de recarregamento

Quando você edita um arquivo-fonte referenciado por `$include`, o OpenClaw planeja
o recarregamento a partir do layout criado na fonte, não da visualização em memória já achatada.
Isso mantém previsíveis as decisões de recarregamento dinâmico (aplicar dinamicamente vs reiniciar) mesmo quando
uma única seção de nível superior vive em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento de recarregamento falha em modo fechado se o
layout de origem for ambíguo.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam configuração pela API do gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó raso do schema + resumos
  dos filhos)
- `config.get` para buscar o snapshot atual mais `hash`
- `config.patch` para atualizações parciais (JSON merge patch: objetos se mesclam, `null`
  exclui, arrays substituem)
- `config.apply` apenas quando você pretende substituir a configuração inteira
- `update.run` para autoatualização explícita mais reinício

<Note>
Gravações do plano de controle (`config.apply`, `config.patch`, `update.run`) têm
limite de taxa de 3 solicitações por 60 segundos por `deviceId+clientIp`. Solicitações de reinício
são agrupadas e então aplicam um cooldown de 30 segundos entre ciclos de reinício.
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

- `.env` do diretório de trabalho atual (se existir)
- `~/.openclaw/.env` (fallback global)

Nenhum dos dois arquivos substitui variáveis de ambiente já existentes. Você também pode definir variáveis de ambiente inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de variáveis de ambiente do shell (opcional)">
  Se estiver habilitado e as chaves esperadas não estiverem definidas, o OpenClaw executará seu shell de login e importará apenas as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente em variável de ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substituição de variáveis de ambiente em valores de configuração">
  Faça referência a variáveis de ambiente em qualquer valor de string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Apenas nomes em maiúsculas são aceitos: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram erro no carregamento
- Escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Refs de segredo (env, file, exec)">
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

Os detalhes de SecretRef (incluindo `secrets.providers` para `env`/`file`/`exec`) estão em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Os caminhos de credencial compatíveis estão listados em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Accordion>

Veja [Ambiente](/pt-BR/help/environment) para a precedência completa e as fontes.

## Referência completa

Para a referência completa campo por campo, veja **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_
