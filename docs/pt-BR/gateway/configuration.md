---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegando para seções específicas de configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-07-02T08:02:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lê uma configuração opcional <Tooltip tip="JSON5 aceita comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json`
com symlink não são compatíveis para escritas pertencentes ao OpenClaw; uma escrita atômica pode substituir
o caminho em vez de preservar o symlink. Se você mantiver a configuração fora do
diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Se o arquivo estiver ausente, o OpenClaw usará padrões seguros. Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, sandboxing ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou UI

Consulte a [referência completa](/pt-BR/gateway/configuration-reference) para todos os campos disponíveis.

Agentes e automação devem usar `config.schema.lookup` para obter a documentação exata
em nível de campo antes de editar a configuração. Use esta página para orientações orientadas a tarefas e a
[referência de configuração](/pt-BR/gateway/configuration-reference) para o mapa de campos
mais amplo e os padrões.

<Tip>
**Novo em configuração?** Comece com `openclaw onboard` para a configuração interativa, ou confira o guia [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para configurações completas prontas para copiar e colar.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (comandos curtos)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A Control UI renderiza um formulário a partir do schema de configuração ativo, incluindo metadados
    de documentação `title` / `description` de campos, além de schemas de plugins e canais quando
    disponíveis, com um editor **Raw JSON** como rota de escape. Para UIs de detalhamento
    e outras ferramentas, o Gateway também expõe `config.schema.lookup` para
    buscar um nó de schema com escopo por caminho mais resumos imediatos dos filhos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway observa o arquivo e aplica as alterações automaticamente (consulte [recarga a quente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondem totalmente ao schema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que editores possam anexar metadados de JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela Control UI
e pela validação. `config.schema.lookup` busca um único nó com escopo por caminho mais
resumos dos filhos para ferramentas de detalhamento. Metadados de documentação de campo `title`/`description`
são preservados em objetos aninhados, wildcard (`*`), item de array (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Schemas de plugins e canais em tempo de execução são mesclados quando o
registro de manifesto é carregado.

Quando a validação falha:

- O Gateway não inicializa
- Apenas comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (ou `--yes`) para aplicar reparos

O Gateway mantém uma cópia confiável da última configuração válida conhecida após cada inicialização bem-sucedida,
mas a inicialização e a recarga a quente não a restauram automaticamente. Se `openclaw.json`
falhar na validação (incluindo validação local de plugin), a inicialização do Gateway falha ou
a recarga é ignorada e o runtime atual mantém a última configuração aceita.
Execute `openclaw doctor --fix` (ou `--yes`) para reparar configurações prefixadas/sobrescritas ou
restaurar a cópia da última configuração válida conhecida. A promoção para a última configuração válida conhecida é ignorada quando uma
candidata contém placeholders de segredos redigidos, como `***`.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
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

    - `agents.defaults.models` define o catálogo de modelos e atua como allowlist para `/model`; entradas `provider/*` filtram `/model`, `/models` e seletores de modelo para provedores selecionados, enquanto ainda usam descoberta dinâmica de modelos.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à allowlist sem remover modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que você passe `--replace`.
    - Referências de modelo usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla o redimensionamento de imagens de transcrição/ferramenta (padrão `1200`); valores menores normalmente reduzem o uso de tokens de visão em execuções com muitos screenshots.
    - Consulte [CLI de modelos](/pt-BR/concepts/models) para alternar modelos no chat e [Failover de modelo](/pt-BR/concepts/model-failover) para rotação de autenticação e comportamento de fallback.
    - Para provedores personalizados/auto-hospedados, consulte [Provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso por DM é controlado por canal via `dmPolicy`:

    - `"pairing"` (padrão): remetentes desconhecidos recebem um código de pareamento único para aprovação
    - `"allowlist"`: apenas remetentes em `allowFrom` (ou no armazenamento de permissões pareadas)
    - `"open"`: permite todas as DMs recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as DMs

    Para grupos, use `groupPolicy` + `groupAllowFrom` ou allowlists específicas do canal.

    Consulte a [referência completa](/pt-BR/gateway/config-channels#dm-and-group-access) para detalhes por canal.

  </Accordion>

  <Accordion title="Configurar gating de menções em chat de grupo">
    Mensagens de grupo exigem **menção** por padrão. Configure padrões de acionamento por agente. Respostas normais de grupo/canal são publicadas automaticamente; habilite o caminho da ferramenta de mensagem para salas compartilhadas onde o agente deve decidir quando falar:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Menções por metadados**: @-menções nativas (toque para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões regex seguros em `mentionPatterns`
    - **Respostas visíveis**: `messages.visibleReplies` pode exigir envios por ferramenta de mensagem globalmente; `messages.groupChat.visibleReplies` substitui isso para grupos/canais.
    - Consulte a [referência completa](/pt-BR/gateway/config-channels#group-chat-mention-gating) para modos de resposta visível, substituições por canal e modo de self-chat.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` para uma linha de base compartilhada e, em seguida, substitua em agentes
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

    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para nenhuma Skill.
    - Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

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

    - Defina `gateway.channelHealthCheckMinutes: 0` para desabilitar reinicializações do monitor de integridade globalmente.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desabilitar reinicializações automáticas para um canal ou conta sem desabilitar o monitor global.
    - Consulte [Verificações de integridade](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para todos os campos.

  </Accordion>

  <Accordion title="Ajustar o tempo limite do handshake WebSocket do gateway">
    Dê mais tempo a clientes locais para concluir o handshake WebSocket pré-autenticação em
    hosts carregados ou de baixo desempenho:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - O padrão é `15000` milissegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ainda tem precedência para substituições pontuais de serviço ou shell.
    - Prefira corrigir primeiro travamentos de inicialização/event loop; este controle é para hosts que estão saudáveis, mas lentos durante o aquecimento.

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
    - `threadBindings`: padrões globais para roteamento de sessões vinculadas a threads (Discord oferece suporte a `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulte [Gerenciamento de sessões](/pt-BR/concepts/session) para escopo, vínculos de identidade e política de envio.
    - Consulte a [referência completa](/pt-BR/gateway/config-agents#session) para todos os campos.

  </Accordion>

  <Accordion title="Habilitar isolamento em sandbox">
    Execute sessões de agentes em runtimes de sandbox isolados:

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

    Crie a imagem primeiro - a partir de um checkout do código-fonte, execute `scripts/sandbox-setup.sh`; ou, a partir de uma instalação npm, consulte o comando `docker build` embutido em [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup).

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo e a [referência completa](/pt-BR/gateway/config-agents#agentsdefaultssandbox) para todas as opções.

  </Accordion>

  <Accordion title="Habilitar push apoiado por relay para builds oficiais do iOS">
    O push apoiado por relay para builds públicos da App Store usa o relay hospedado do OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Implantações de relay personalizadas exigem um caminho de build/implantação iOS deliberadamente separado, cuja URL de relay corresponda à URL de relay do Gateway. Se você estiver usando um build de relay personalizado, defina isto na configuração do gateway:

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

    - Permite que o gateway envie `push.test`, estímulos de ativação e ativações de reconexão pelo relay externo.
    - Usa uma concessão de envio com escopo de registro encaminhada pelo app iOS pareado. O gateway não precisa de um token de relay amplo da implantação.
    - Vincula cada registro apoiado por relay à identidade do gateway com a qual o app iOS foi pareado, para que outro gateway não possa reutilizar o registro armazenado.
    - Mantém builds iOS locais/manuais em APNs direto. Envios apoiados por relay se aplicam apenas a builds distribuídos oficiais registrados pelo relay.
    - Deve corresponder à URL base de relay incorporada ao build iOS, para que o tráfego de registro e envio chegue à mesma implantação de relay.

    Fluxo de ponta a ponta:

    1. Instale o app iOS oficial.
    2. Opcional: configure `gateway.push.apns.relay.baseUrl` no gateway somente ao usar um build de relay personalizado deliberadamente separado.
    3. Pareie o app iOS com o gateway e permita que as sessões de nó e operador se conectem.
    4. O app iOS busca a identidade do gateway, registra-se no relay usando App Attest mais o recibo do app e então publica a carga `push.apns.register` apoiada por relay no gateway pareado.
    5. O gateway armazena o identificador de relay e a concessão de envio, depois os usa para `push.test`, estímulos de ativação e ativações de reconexão.

    Observações operacionais:

    - Se você trocar o app iOS para outro gateway, reconecte o app para que ele possa publicar um novo registro de relay vinculado a esse gateway.
    - Se você enviar um novo build iOS que aponta para uma implantação de relay diferente, o app atualiza seu registro de relay em cache em vez de reutilizar a origem de relay antiga.

    Observação de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias de env.
    - URLs de relay de gateway personalizadas devem corresponder à URL base de relay incorporada ao build iOS. A faixa de lançamento pública da App Store rejeita substituições de URL de relay iOS personalizadas.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma válvula de escape de desenvolvimento apenas para loopback; não persista URLs de relay HTTP na configuração.

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

    - `every`: string de duração (`30m`, `2h`). Defina `0m` para desabilitar.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Consulte [Heartbeat](/pt-BR/gateway/heartbeat) para o guia completo.

  </Accordion>

  <Accordion title="Configurar tarefas Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: remove sessões de execução isoladas concluídas de `sessions.json` (padrão `24h`; defina `false` para desabilitar).
    - `runLog`: remove linhas retidas do histórico de execuções de Cron por tarefa. `maxBytes` continua aceito para logs de execução antigos baseados em arquivo.
    - Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para a visão geral do recurso e exemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
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
    - Trate todo o conteúdo de payload de hook/Webhook como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize segredos ativos de autenticação do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - A autenticação de hook é somente por cabeçalho (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens em query string são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhook em um subcaminho dedicado, como `/hooks`.
    - Mantenha os flags de desvio de conteúdo inseguro desabilitados (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), exceto ao fazer depuração com escopo bem restrito.
    - Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para limitar chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por hook, prefira tiers de modelos modernos fortes e política de ferramentas estrita (por exemplo, somente mensagens mais sandboxing quando possível).

    Consulte a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para todas as opções de mapeamento e integração com Gmail.

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

  <Accordion title="Dividir configuração em vários arquivos ($include)">
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
    - **Array de arquivos**: mesclado profundamente em ordem (o posterior vence)
    - **Chaves irmãs**: mescladas após includes (substituem valores incluídos)
    - **Includes aninhados**: compatíveis até 10 níveis de profundidade
    - **Caminhos relativos**: resolvidos em relação ao arquivo que inclui
    - **Formato de caminho**: caminhos de include não devem conter bytes nulos e devem ter estritamente menos de 4096 caracteres antes e depois da resolução
    - **Escritas pertencentes ao OpenClaw**: quando uma escrita altera apenas uma seção de nível superior
      apoiada por um include de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e deixa `openclaw.json` intacto
    - **Write-through sem suporte**: includes raiz, arrays de include e includes
      com substituições irmãs falham de forma fechada para escritas pertencentes ao OpenClaw, em vez de
      achatar a configuração
    - **Confinamento**: caminhos `$include` devem ser resolvidos abaixo do diretório que contém
      `openclaw.json`. Para compartilhar uma árvore entre máquinas ou usuários, defina
      `OPENCLAW_INCLUDE_ROOTS` como uma lista de caminhos (`:` no POSIX, `;` no Windows) de
      diretórios adicionais que includes podem referenciar. Symlinks são resolvidos
      e verificados novamente, portanto um caminho que lexicalmente fica em um diretório de configuração, mas cujo
      destino real escapa de toda raiz permitida, ainda é rejeitado.
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de análise, includes circulares, formato de caminho inválido e comprimento excessivo

  </Accordion>
</AccordionGroup>

## Recarga a quente da configuração

O Gateway monitora `~/.openclaw/openclaw.json` e aplica alterações automaticamente - nenhuma reinicialização manual é necessária para a maioria das configurações.

Edições diretas de arquivo são tratadas como não confiáveis até serem validadas. O monitor aguarda
a agitação de escrita temporária/renomeação do editor se estabilizar, lê o arquivo final e rejeita
edições externas inválidas sem reescrever `openclaw.json`. Escritas de configuração
pertencentes ao OpenClaw usam o mesmo gate de esquema antes de escrever; substituições destrutivas, como
remover `gateway.mode` ou reduzir o arquivo em mais da metade, são rejeitadas e
salvas como `.rejected.*` para inspeção.

Se você vir `config reload skipped (invalid config)` ou a inicialização relatar `Invalid
config`, inspecione a configuração, execute `openclaw config validate` e então execute `openclaw
doctor --fix` para reparo. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config)
para a checklist.

### Modos de recarga

| Modo                   | Comportamento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica alterações seguras a quente instantaneamente. Reinicia automaticamente para as críticas.           |
| **`hot`**              | Aplica somente alterações seguras a quente. Registra um aviso quando uma reinicialização é necessária - você cuida disso. |
| **`restart`**          | Reinicia o Gateway em qualquer alteração de configuração, segura ou não.                                 |
| **`off`**              | Desabilita o monitoramento de arquivo. As alterações entram em vigor na próxima reinicialização manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que aplica a quente vs. o que precisa de reinicialização

A maioria dos campos é aplicada a quente sem indisponibilidade. No modo `hybrid`, alterações que exigem reinicialização são tratadas automaticamente.

| Categoria           | Campos                                                            | Reinício necessário? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canais              | `channels.*`, `web` (WhatsApp) - todos os canais integrados e de plugin | Não             |
| Agente e modelos    | `agent`, `agents`, `models`, `routing`                            | Não             |
| Automação           | `hooks`, `cron`, `agent.heartbeat`                                | Não             |
| Sessões e mensagens | `session`, `messages`                                             | Não             |
| Ferramentas e mídia | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Não             |
| UI e diversos       | `ui`, `logging`, `identity`, `bindings`                           | Não             |
| Servidor Gateway    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Sim**         |
| Infraestrutura      | `discovery`, `plugins`                                            | **Sim**         |

<Note>
`gateway.reload` e `gateway.remote` são exceções - alterá-los **não** aciona um reinício.
</Note>

### Planejamento de recarregamento

Quando você edita um arquivo de origem referenciado por `$include`, o OpenClaw planeja
o recarregamento a partir do layout criado na origem, não da visualização achatada em memória.
Isso mantém as decisões de recarregamento a quente (aplicação a quente vs reinício) previsíveis, mesmo quando uma
única seção de nível superior vive em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento de recarregamento falha de forma fechada se o
layout de origem for ambíguo.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam configuração pela API do Gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó de esquema superficial + resumos de
  filhos)
- `config.get` para buscar o snapshot atual mais `hash`
- `config.patch` para atualizações parciais (patch de mesclagem JSON: objetos são mesclados, `null`
  exclui, arrays são substituídos quando explicitamente confirmados com `replacePaths` se
  entradas seriam removidas)
- `config.apply` somente quando você pretende substituir a configuração inteira
- `update.run` para autoatualização explícita mais reinício; inclua `continuationMessage` quando a sessão pós-reinício deve executar uma rodada de acompanhamento
- `update.status` para inspecionar o sentinela de reinício da atualização mais recente e verificar a versão em execução após um reinício

Agentes devem tratar `config.schema.lookup` como o primeiro ponto de consulta para documentação e restrições
exatas em nível de campo. Use [Referência de configuração](/pt-BR/gateway/configuration-reference)
quando precisarem do mapa de configuração mais amplo, padrões ou links para referências dedicadas
de subsistemas.

<Note>
Gravações do plano de controle (`config.apply`, `config.patch`, `update.run`) são
limitadas a 3 solicitações por 60 segundos por `deviceId+clientIp`. Solicitações de reinício
são agrupadas e, em seguida, aplicam um período de espera de 30 segundos entre ciclos de reinício.
`update.status` é somente leitura, mas tem escopo de administrador, porque o sentinela de reinício pode
incluir resumos de etapas de atualização e trechos finais da saída de comandos.
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

`config.patch` também aceita `replacePaths`, um array de caminhos de configuração cuja substituição de array
é intencional. Se um patch substituísse ou excluísse um array existente
com menos entradas, o Gateway rejeita a gravação, a menos que esse caminho exato apareça
em `replacePaths`; arrays aninhados sob entradas de array usam `[]`, como
`agents.list[].skills`. Isso impede que snapshots truncados de `config.get`
sobrescrevam silenciosamente arrays de roteamento ou listas de permissões. Use `config.apply` quando você
pretende substituir a configuração completa.

## Variáveis de ambiente

O OpenClaw lê variáveis de ambiente do processo pai mais:

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

<Accordion title="Importação de ambiente do shell (opcional)">
  Se habilitado e as chaves esperadas não estiverem definidas, o OpenClaw executa seu shell de login e importa apenas as chaves ausentes:

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

- Somente nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram um erro no momento do carregamento
- Faça escape com `$${VAR}` para saída literal
- Funciona dentro de arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referências a segredos (env, file, exec)">
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

Consulte [Ambiente](/pt-BR/help/environment) para precedência e origens completas.

## Referência completa

Para a referência completa campo por campo, consulte **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionado: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Runbook do Gateway](/pt-BR/gateway)
