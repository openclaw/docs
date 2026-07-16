---
read_when:
    - Configurando o OpenClaw pela primeira vez
    - Procurando padrões comuns de configuração
    - Navegação para seções específicas da configuração
summary: 'Visão geral da configuração: tarefas comuns, configuração rápida e links para a referência completa'
title: Configuração
x-i18n:
    generated_at: "2026-07-16T12:31:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lê uma configuração opcional <Tooltip tip="JSON5 oferece suporte a comentários e vírgulas finais">**JSON5**</Tooltip> de `~/.openclaw/openclaw.json`. Se o arquivo não existir, o OpenClaw usará padrões seguros.

O caminho da configuração ativa deve ser um arquivo comum. As gravações feitas pelo OpenClaw o substituem atomicamente (renomeando para o caminho), portanto, se `openclaw.json` for um link simbólico, seu destino será substituído em vez de receber a gravação por meio do link — evite layouts de configuração com links simbólicos. Se a configuração ficar fora do diretório de estado padrão, aponte `OPENCLAW_CONFIG_PATH` diretamente para o arquivo real.

Motivos comuns para adicionar uma configuração:

- Conectar canais e controlar quem pode enviar mensagens ao bot
- Definir modelos, ferramentas, isolamento ou automação (cron, hooks)
- Ajustar sessões, mídia, rede ou interface

Consulte a [referência completa](/pt-BR/gateway/configuration-reference) para ver todos os campos disponíveis.

Agentes e automações devem usar `config.schema.lookup` para consultar a documentação
exata de cada campo antes de editar a configuração. Use esta página para obter orientações voltadas a tarefas e
a [Referência de configuração](/pt-BR/gateway/configuration-reference) para consultar o mapa mais abrangente
de campos e valores padrão.

<Tip>
**Primeiros passos com a configuração?** Comece com `openclaw onboard` para uma configuração interativa ou consulte o guia de [Exemplos de configuração](/pt-BR/gateway/configuration-examples) para obter configurações completas prontas para copiar e colar.
</Tip>

## Configuração mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Edição da configuração

<Tabs>
  <Tab title="Assistente interativo">
    ```bash
    openclaw onboard       # fluxo completo de integração
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
  <Tab title="Interface de controle">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) e use a aba **Config**.
    A interface de controle renderiza um formulário com base no esquema de configuração ativo, incluindo os metadados
    de documentação de campo `title` / `description`, além dos esquemas de plugins e canais quando
    disponíveis, com um editor **Raw JSON** como alternativa. Para interfaces
    de detalhamento e outras ferramentas, o Gateway também expõe `config.schema.lookup` para
    buscar um nó de esquema restrito a um caminho, junto com resumos dos filhos imediatos.
  </Tab>
  <Tab title="Edição direta">
    Edite `~/.openclaw/openclaw.json` diretamente. O Gateway monitora o arquivo e aplica as alterações automaticamente (consulte [recarga dinâmica](#config-hot-reload)).
  </Tab>
</Tabs>

## Validação estrita

<Warning>
O OpenClaw aceita apenas configurações que correspondam totalmente ao esquema. Chaves desconhecidas, tipos malformados ou valores inválidos fazem o Gateway **se recusar a iniciar**. A única exceção no nível raiz é `$schema` (string), para que os editores possam anexar metadados do JSON Schema.
</Warning>

`openclaw config schema` imprime o JSON Schema canônico usado pela interface de controle
e pela validação. `config.schema.lookup` busca um único nó restrito a um caminho, junto com
resumos dos filhos para ferramentas de detalhamento. Os metadados de documentação de campo `title`/`description`
são propagados por objetos aninhados, curingas (`*`), itens de matriz (`[]`) e ramificações `anyOf`/
`oneOf`/`allOf`. Os esquemas de plugins e canais em tempo de execução são mesclados quando o
registro de manifestos é carregado.

Quando a validação falha:

- O Gateway não é inicializado
- Somente os comandos de diagnóstico funcionam (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Execute `openclaw doctor` para ver os problemas exatos
- Execute `openclaw doctor --fix` (`--repair` é a mesma opção; `--yes` ignora as solicitações de confirmação) para aplicar os reparos

O Gateway mantém uma cópia confiável da última configuração válida após cada inicialização bem-sucedida,
mas a inicialização e a recarga dinâmica não a restauram automaticamente — somente `openclaw doctor --fix`
faz isso. Se `openclaw.json` não passar na validação (incluindo a validação local de plugins), a inicialização do Gateway
falhará ou a recarga será ignorada, e o ambiente de execução atual manterá a última
configuração aceita. Uma gravação rejeitada também é salva como `<path>.rejected.<timestamp>` para inspeção.
O Gateway bloqueia gravações que pareçam sobrescritas acidentais — remover `gateway.mode`,
perder o bloco `meta` ou reduzir o arquivo em mais da metade — a menos que a gravação
permita explicitamente alterações destrutivas. A promoção para a última configuração válida é ignorada quando uma
configuração candidata contém um espaço reservado de segredo ocultado, como `***` ou `[redacted]`.

## Tarefas comuns

<AccordionGroup>
  <Accordion title="Configurar um canal (WhatsApp, Telegram, Discord etc.)">
    Cada canal tem sua própria seção de configuração em `channels.<provider>`. Consulte a página específica do canal para ver as etapas de configuração:

    - [Discord](/pt-BR/channels/discord) — `channels.discord`
    - [Feishu](/pt-BR/channels/feishu) — `channels.feishu`
    - [Google Chat](/pt-BR/channels/googlechat) — `channels.googlechat`
    - [iMessage](/pt-BR/channels/imessage) — `channels.imessage`
    - [Mattermost](/pt-BR/channels/mattermost) — `channels.mattermost`
    - [Microsoft Teams](/pt-BR/channels/msteams) — `channels.msteams`
    - [Signal](/pt-BR/channels/signal) — `channels.signal`
    - [Slack](/pt-BR/channels/slack) — `channels.slack`
    - [Telegram](/pt-BR/channels/telegram) — `channels.telegram`
    - [WhatsApp](/pt-BR/channels/whatsapp) — `channels.whatsapp`

    Todos os canais compartilham o mesmo padrão de política de mensagens diretas:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pareamento | lista de permissões | aberto | desativado
          allowFrom: ["tg:123"], // somente para lista de permissões/aberto
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Escolher e configurar modelos">
    Defina o modelo principal e os fallbacks opcionais:

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

    - `agents.defaults.models` define o catálogo de modelos e atua como a lista de permissões para `/model`; as entradas de `provider/*` filtram `/model`, `/models` e os seletores de modelos para os provedores selecionados, ainda usando a descoberta dinâmica de modelos.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas à lista de permissões sem remover os modelos existentes. Substituições simples que removeriam entradas são rejeitadas, a menos que `--replace` seja fornecido.
    - As referências de modelos usam o formato `provider/model` (por exemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla a redução de resolução de imagens de transcrições/ferramentas (padrão: `1200`); valores menores geralmente reduzem o uso de tokens de visão em execuções com muitas capturas de tela.
    - Consulte a [CLI de modelos](/pt-BR/concepts/models) para alternar modelos no chat e [Failover de modelos](/pt-BR/concepts/model-failover) para saber mais sobre a rotação de autenticação e o comportamento de fallback.
    - Para provedores personalizados/hospedados localmente, consulte [Provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls) na referência.

  </Accordion>

  <Accordion title="Controlar quem pode enviar mensagens ao bot">
    O acesso a mensagens diretas é controlado por canal por meio de `dmPolicy` (padrão: `"pairing"`):

    - `"pairing"`: remetentes desconhecidos recebem um código de pareamento de uso único para aprovação
    - `"allowlist"`: somente remetentes em `allowFrom` (ou no armazenamento de permissões pareadas)
    - `"open"`: permite todas as mensagens diretas recebidas (requer `allowFrom: ["*"]`)
    - `"disabled"`: ignora todas as mensagens diretas

    Para grupos, use `groupPolicy` (`"allowlist" | "open" | "disabled"`) junto com `groupAllowFrom` ou listas de permissões específicas do canal.

    Consulte a [referência completa](/pt-BR/gateway/config-channels#dm-and-group-access) para ver os detalhes de cada canal.

  </Accordion>

  <Accordion title="Configurar o controle de menções em chats em grupo">
    Por padrão, mensagens em grupo **exigem menção**. Configure os padrões de acionamento por agente. Respostas normais de grupos/canais são publicadas automaticamente; ative o caminho da ferramenta de mensagens para salas compartilhadas nas quais o agente deve decidir quando falar:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // defina como "message_tool" para exigir envios pela ferramenta de mensagens em todos os lugares
        groupChat: {
          visibleReplies: "message_tool", // opção habilitada; a saída visível exige message(action=send)
          unmentionedInbound: "room_event", // conversas contínuas em grupo sem menção são um contexto silencioso
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

    - **Menções nos metadados**: @menções nativas (tocar para mencionar no WhatsApp, @bot no Telegram etc.)
    - **Padrões de texto**: padrões seguros de expressões regulares em `mentionPatterns`
    - **Respostas visíveis**: `messages.visibleReplies` pode exigir envios pela ferramenta de mensagens globalmente; `messages.groupChat.visibleReplies` substitui essa configuração para grupos/canais.
    - Consulte a [referência completa](/pt-BR/gateway/config-channels#group-chat-mention-gating) para ver os modos de resposta visível, as substituições específicas por canal e o modo de conversa consigo mesmo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Use `agents.defaults.skills` como uma linha de base compartilhada e depois substitua a configuração de
    agentes específicos com `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // herda github, weather
          { id: "docs", skills: ["docs-search"] }, // substitui os padrões
          { id: "locked-down", skills: [] }, // nenhuma skill
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para permitir Skills sem restrições por padrão.
    - Omita `agents.list[].skills` para herdar os padrões.
    - Defina `agents.list[].skills: []` para não permitir nenhuma skill.
    - Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e
      a [Referência de configuração](/pt-BR/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar o monitoramento da integridade dos canais do Gateway">
    Controle com que agressividade o Gateway reinicia canais que parecem inativos:

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

    - Os valores exibidos são os padrões. Defina `gateway.channelHealthCheckMinutes: 0` para desativar globalmente as reinicializações do monitor de integridade.
    - `channelStaleEventThresholdMinutes` deve ser maior ou igual ao intervalo de verificação.
    - Use `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desativar as reinicializações automáticas de um canal ou uma conta sem desativar o monitor global.
    - Consulte [Verificações de integridade](/pt-BR/gateway/health) para depuração operacional e a [referência completa](/pt-BR/gateway/configuration-reference#gateway) para ver todos os campos.

  </Accordion>

  <Accordion title="Ajustar o tempo limite do handshake WebSocket do Gateway">
    Dê aos clientes locais mais tempo para concluir o handshake WebSocket anterior à autenticação em
    hosts sobrecarregados ou de baixo consumo:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - O padrão é `15000` milissegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ainda tem precedência para substituições pontuais de serviço ou shell.
    - Prefira corrigir primeiro os bloqueios na inicialização/no loop de eventos; este ajuste destina-se a hosts que estão íntegros, mas lentos durante o aquecimento.

  </Accordion>

  <Accordion title="Configurar sessões e redefinições">
    As sessões controlam a continuidade e o isolamento das conversas:

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

    - `dmScope`: `main` (compartilhado) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: padrões globais para o roteamento de sessões vinculadas a threads. `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age` vinculam, desvinculam, listam e ajustam isso por sessão (o Discord vincula threads; o Telegram vincula tópicos/conversas).
    - Consulte [Gerenciamento de sessões](/pt-BR/concepts/session) para saber mais sobre escopo, vínculos de identidade e política de envio.
    - Consulte a [referência completa](/pt-BR/gateway/config-agents#session) para ver todos os campos.

  </Accordion>

  <Accordion title="Ativar o isolamento em sandbox">
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

    Primeiro, compile a imagem — em um checkout do código-fonte, execute `scripts/sandbox-setup.sh`; em uma instalação pelo npm, consulte o comando `docker build` embutido em [Sandbox § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup).

    Consulte [Sandbox](/pt-BR/gateway/sandboxing) para ver o guia completo e a [referência completa](/pt-BR/gateway/config-agents#agentsdefaultssandbox) para conhecer todas as opções.

  </Accordion>

  <Accordion title="Ativar push com suporte de relay para builds oficiais do iOS">
    O push com suporte de relay para builds públicos da App Store usa o relay hospedado do OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Implantações de relay personalizadas exigem um caminho deliberadamente separado de build/implantação do iOS cuja URL de relay corresponda à URL de relay do Gateway. Se estiver usando um build com relay personalizado, defina isto na configuração do Gateway:

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

    - Permite que o Gateway envie `push.test`, sinais de ativação e ativações de reconexão pelo relay externo.
    - Usa uma concessão de envio limitada ao registro, encaminhada pelo aplicativo iOS emparelhado. O Gateway não precisa de um token de relay válido para toda a implantação.
    - Vincula cada registro com suporte de relay à identidade do Gateway com o qual o aplicativo iOS foi emparelhado, impedindo que outro Gateway reutilize o registro armazenado.
    - Mantém builds locais/manuais do iOS usando APNs diretamente. Os envios com suporte de relay aplicam-se somente a builds distribuídos oficiais registrados pelo relay.
    - Deve corresponder à URL base do relay incorporada ao build do iOS, para que o tráfego de registro e envio chegue à mesma implantação do relay.

    Fluxo completo:

    1. Instale o aplicativo iOS oficial.
    2. Opcional: configure `gateway.push.apns.relay.baseUrl` no Gateway somente ao usar um build de relay personalizado e deliberadamente separado.
    3. Emparelhe o aplicativo iOS com o Gateway e permita que as sessões do Node e do operador se conectem.
    4. O aplicativo iOS obtém a identidade do Gateway, registra-se no relay usando o App Attest e o recibo do aplicativo e, em seguida, publica o payload `push.apns.register` com suporte de relay no Gateway emparelhado.
    5. O Gateway armazena o identificador do relay e a concessão de envio e depois os utiliza para `push.test`, sinais de ativação e ativações de reconexão.

    Notas operacionais:

    - Se você mudar o aplicativo iOS para outro Gateway, reconecte-o para que ele possa publicar um novo registro de relay vinculado a esse Gateway.
    - Se você distribuir um novo build do iOS que aponte para uma implantação de relay diferente, o aplicativo atualizará o registro de relay em cache em vez de reutilizar a origem antiga do relay.

    Nota de compatibilidade:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` ainda funcionam como substituições temporárias por variáveis de ambiente.
    - URLs de relay personalizadas do Gateway devem corresponder à URL base do relay incorporada ao build do iOS; o fluxo de lançamento público da App Store rejeita substituições personalizadas da URL de relay do iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continua sendo uma alternativa de desenvolvimento limitada ao loopback; não persista URLs HTTP de relay na configuração.

    Consulte [Aplicativo iOS](/pt-BR/platforms/ios#relay-backed-push-for-official-builds) para ver o fluxo completo e [Fluxo de autenticação e confiança](/pt-BR/platforms/ios#authentication-and-trust-flow) para conhecer o modelo de segurança do relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (verificações periódicas)">
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

    - `every`: string de duração (`30m`, `2h`). Defina como `0m` para desativar. Padrão: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (por exemplo, `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (padrão) ou `block` para destinos de Heartbeat no estilo DM
    - Consulte [Heartbeat](/pt-BR/gateway/heartbeat) para ver o guia completo.

  </Accordion>

  <Accordion title="Configurar tarefas Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // padrão; despacho do Cron + execução isolada do turno do agente Cron
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: remove das linhas de sessão do SQLite as sessões concluídas de execuções isoladas (padrão: `24h`; defina como `false` para desativar).
    - O histórico de execuções mantém automaticamente as 2000 linhas terminais mais recentes por tarefa; as linhas perdidas mantêm sua janela de limpeza de 24 horas.
    - Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para ver uma visão geral do recurso e exemplos da CLI.

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

    Nota de segurança:
    - Trate todo o conteúdo dos payloads de hooks/Webhooks como entrada não confiável.
    - Use um `hooks.token` dedicado; não reutilize segredos ativos de autenticação do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - A autenticação de hooks usa somente cabeçalhos (`Authorization: Bearer ...` ou `x-openclaw-token`); tokens na string de consulta são rejeitados.
    - `hooks.path` não pode ser `/`; mantenha a entrada de Webhooks em um subcaminho dedicado, como `/hooks`.
    - Mantenha desativadas as opções que ignoram a proteção contra conteúdo inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), exceto durante depurações com escopo rigorosamente limitado.
    - Se ativar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para limitar as chaves de sessão selecionadas pelo chamador.
    - Para agentes acionados por hooks, prefira níveis de modelos modernos e robustos, além de uma política rigorosa de ferramentas (por exemplo, somente mensagens com isolamento em sandbox quando possível).

    Consulte a [referência completa](/pt-BR/gateway/configuration-reference#hooks) para ver todas as opções de mapeamento e a integração com o Gmail.

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

    Consulte [Multiagente](/pt-BR/concepts/multi-agent) e a [referência completa](/pt-BR/gateway/config-agents#multi-agent-routing) para conhecer as regras de vinculação e os perfis de acesso por agente.

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
    - **Matriz de arquivos**: mesclada profundamente em ordem (o último prevalece), com até 10 níveis de aninhamento
    - **Chaves irmãs**: mescladas após as inclusões (sobrescrevem os valores incluídos)
    - **Caminhos relativos**: resolvidos em relação ao arquivo que realiza a inclusão
    - **Formato do caminho**: os caminhos de inclusão não podem conter bytes nulos e devem ter estritamente menos de 4096 caracteres antes e depois da resolução
    - **Gravações realizadas pelo OpenClaw**: quando uma gravação altera apenas uma seção de nível superior
      respaldada por uma inclusão de arquivo único, como `plugins: { $include: "./plugins.json5" }`,
      o OpenClaw atualiza esse arquivo incluído e mantém `openclaw.json` intacto
    - **Gravação propagada não compatível**: inclusões na raiz, matrizes de inclusões e inclusões
      com substituições em chaves irmãs falham de forma segura nas gravações realizadas pelo OpenClaw, em vez de
      achatar a configuração
    - **Confinamento**: os caminhos de `$include` devem ser resolvidos dentro do diretório que contém
      `openclaw.json`. Para compartilhar uma árvore entre máquinas ou usuários, defina
      `OPENCLAW_INCLUDE_ROOTS` como uma lista de caminhos (`:` no POSIX, `;` no Windows) de
      diretórios adicionais que as inclusões podem referenciar. Links simbólicos são resolvidos
      e verificados novamente; portanto, um caminho que lexicalmente esteja em um diretório de configuração, mas cujo
      destino real saia de todas as raízes permitidas, ainda será rejeitado.
    - **Tratamento de erros**: erros claros para arquivos ausentes, erros de análise, inclusões circulares, formato de caminho inválido e comprimento excessivo

  </Accordion>
</AccordionGroup>

## Recarga dinâmica da configuração

O Gateway monitora `~/.openclaw/openclaw.json` e aplica as alterações automaticamente — não é necessário reiniciar manualmente para a maioria das configurações.

Edições diretas no arquivo são tratadas como não confiáveis até serem validadas. O monitor aguarda
a estabilização das operações temporárias de gravação/renomeação do editor, lê o arquivo final e rejeita
edições externas inválidas sem regravar `openclaw.json`. As gravações de configuração realizadas pelo OpenClaw
usam a mesma validação de esquema antes de gravar (consulte [Validação rigorosa](#strict-validation)
para conhecer as regras de sobrescrita/rollback aplicáveis a todas as gravações).

Se você vir `config reload skipped (invalid config)` ou se a inicialização informar `Invalid
config`, inspecione a configuração, execute `openclaw config validate` e depois execute `openclaw
doctor --fix` para repará-la. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config)
para ver a lista de verificação.

### Modos de recarga

| Modo                   | Comportamento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (padrão) | Aplica alterações seguras a quente instantaneamente. Reinicia automaticamente para alterações críticas.           |
| **`hot`**              | Aplica somente alterações seguras a quente. Registra um aviso quando uma reinicialização é necessária — ela fica por sua conta. |
| **`restart`**          | Reinicia o Gateway após qualquer alteração de configuração, seja ela segura ou não.                                 |
| **`off`**              | Desativa o monitoramento de arquivos. As alterações entram em vigor na próxima reinicialização manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### O que é aplicado a quente e o que exige reinicialização

A maioria dos campos é aplicada a quente sem indisponibilidade; algumas seções aplicadas a quente reiniciam apenas esse
subsistema (canal, cron, heartbeat, monitor de integridade), em vez de todo o Gateway. No modo
`hybrid`, as alterações que exigem a reinicialização do Gateway são tratadas automaticamente.

| Categoria            | Campos                                                                  | Exige reinicialização do Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Canais            | `channels.*`, `web` (WhatsApp) — todos os canais integrados e de plugins       | Não (reinicia esse canal)   |
| Agente e modelos      | `agent`, `agents`, `models`, `routing`                                  | Não                           |
| Automação          | `hooks`, `cron`, `agent.heartbeat`                                      | Não (reinicia esse subsistema) |
| Sessões e mensagens | `session`, `messages`                                                   | Não                           |
| Ferramentas e mídia       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Não                           |
| Configuração de plugins       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Não (recarrega o runtime do plugin)  |
| Interface e outros           | `ui`, `logging`, `identity`, `bindings`                                 | Não                           |
| Servidor do Gateway      | `gateway.*` (porta, associação, autenticação, Tailscale, TLS, HTTP, push)              | **Sim**                      |
| Infraestrutura      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sim**                      |

<Note>
`gateway.reload` e `gateway.remote` são exceções em `gateway.*` — alterá-los **não** aciona uma reinicialização. Plugins individuais também podem substituir esta tabela: um plugin carregado pode declarar seus próprios prefixos de configuração que acionam reinicializações (por exemplo, o plugin Canvas integrado reinicia o Gateway para `plugins.enabled`, `plugins.allow` e `plugins.deny`, não apenas para seu próprio `plugins.entries.canvas`), portanto, o comportamento real depende dos plugins ativos.
</Note>

### Planejamento do recarregamento

Ao editar um arquivo de origem referenciado por meio de `$include`, o OpenClaw planeja
o recarregamento com base na estrutura definida no código-fonte, e não na visualização nivelada em memória.
Isso mantém previsíveis as decisões de recarregamento a quente (aplicar a quente ou reiniciar), mesmo quando uma
única seção de nível superior reside em seu próprio arquivo incluído, como
`plugins: { $include: "./plugins.json5" }`. O planejamento do recarregamento falha de forma segura se a
estrutura de origem for ambígua.

## RPC de configuração (atualizações programáticas)

Para ferramentas que gravam a configuração pela API do Gateway, prefira este fluxo:

- `config.schema.lookup` para inspecionar uma subárvore (nó de esquema superficial + resumos
  dos filhos)
- `config.get` para obter o snapshot atual mais `hash`
- `config.patch` para atualizações parciais (patch de mesclagem JSON: objetos são mesclados, `null`
  exclui, arrays são substituídos quando explicitamente confirmados com `replacePaths` caso
  entradas sejam removidas)
- `config.apply` somente quando houver a intenção de substituir toda a configuração
- `update.run` para uma autoatualização explícita seguida de reinicialização; inclua `continuationMessage` quando a sessão pós-reinicialização precisar executar um turno de acompanhamento
- `update.status` para inspecionar o sentinela de reinicialização da atualização mais recente e verificar a versão em execução após uma reinicialização

Os agentes devem tratar `config.schema.lookup` como o primeiro recurso para consultar a documentação e as restrições exatas
no nível dos campos. Use a [Referência de configuração](/pt-BR/gateway/configuration-reference)
quando precisarem do mapa de configuração mais abrangente, dos valores padrão ou de links para referências
específicas dos subsistemas.

<Note>
As gravações do plano de controle (`config.apply`, `config.patch`, `update.run`) são
limitadas a 3 solicitações por 60 segundos por `deviceId+clientIp`. As solicitações de reinicialização
são agrupadas e, em seguida, impõem um período de espera de 30 segundos entre os ciclos de reinicialização.
`update.status` é somente leitura, mas restrito a administradores, pois o sentinela de reinicialização pode
incluir resumos das etapas de atualização e trechos finais da saída de comandos.
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
`note` e `restartDelayMs`. `baseHash` é obrigatório para ambos os métodos quando um
arquivo de configuração já existe (uma primeira gravação sem configuração existente ignora a verificação).

`config.patch` também aceita `replacePaths`, um array de caminhos de configuração cuja substituição do array
é intencional. Se um patch substituir ou excluir um array existente
por outro com menos entradas, o Gateway rejeitará a gravação, a menos que esse caminho exato apareça
em `replacePaths`; arrays aninhados em entradas de arrays usam `[]`, como
`agents.list[].skills`. Isso impede que snapshots truncados de `config.get`
sobrescrevam silenciosamente arrays de roteamento ou listas de permissões. Use `config.apply` quando houver
a intenção de substituir toda a configuração.

## Variáveis de ambiente

O OpenClaw lê as variáveis de ambiente do processo pai, além de:

- `.env` do diretório de trabalho atual (se presente)
- `~/.openclaw/.env` (fallback global)

Nenhum dos arquivos substitui variáveis de ambiente existentes. Também é possível definir variáveis de ambiente inline na configuração:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importação de variáveis de ambiente do shell (opcional)">
  Se estiver habilitado e as chaves esperadas não estiverem definidas, o OpenClaw executará o shell de login e importará somente as chaves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variável de ambiente equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` padrão: `15000`.
</Accordion>

<Accordion title="Substituição de variáveis de ambiente nos valores de configuração">
  Referencie variáveis de ambiente em qualquer valor de string da configuração com `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regras:

- Somente nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`
- Variáveis ausentes/vazias geram um erro durante o carregamento
- Use escape com `$${VAR}` para obter uma saída literal
- Funciona em arquivos `$include`
- Substituição inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referências de segredos (ambiente, arquivo, execução)">
  Para campos compatíveis com objetos SecretRef, é possível usar:

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

Consulte [Ambiente](/pt-BR/help/environment) para obter a precedência e as fontes completas.

## Referência completa

Para consultar a referência completa campo por campo, consulte a **[Referência de configuração](/pt-BR/gateway/configuration-reference)**.

---

_Relacionados: [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Referência de configuração](/pt-BR/gateway/configuration-reference) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Runbook do Gateway](/pt-BR/gateway)
