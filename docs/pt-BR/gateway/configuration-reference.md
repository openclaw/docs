---
read_when:
    - Você precisa de semântica ou padrões de configuração exatos em nível de campo
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, valores padrão e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-07-02T00:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referência de configuração principal para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Abrange as principais superfícies de configuração do OpenClaw e aponta para referências mais profundas quando um subsistema tem a sua própria. Catálogos de comandos pertencentes a canais e plugins e ajustes profundos de memória/QMD ficam em suas próprias páginas, não nesta.

Fonte de verdade do código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e Control UI, com metadados de pacotes/plugin/canal mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de esquema com escopo de caminho para ferramentas de detalhamento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de linha de base da documentação de configuração contra a superfície de esquema atual

Caminho de busca do agente: use a ação de ferramenta `gateway` `config.schema.lookup` para
documentação e restrições exatas em nível de campo antes das edições. Use
[Configuração](/pt-BR/gateway/configuration) para orientação orientada a tarefas e esta página
para o mapa de campos mais amplo, padrões e links para referências de subsistemas.

Referências profundas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + incluídos
- páginas dos canais/plugins proprietários para superfícies de comandos específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais - o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada - consulte
[Configuração - canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos (autenticação, controle de acesso, múltiplas contas, bloqueio por menção).

## Padrões de agente, multiagente, sessões e mensagens

Movido para uma página dedicada - consulte
[Configuração - agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, raciocínio, heartbeat, memória, mídia, skills, sandbox)
- `multiAgent.*` (roteamento e vínculos multiagente)
- `session.*` (ciclo de vida da sessão, compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: substituição do nível de raciocínio para a execução completa do agente OpenClaw por trás das consultas em tempo real do Control UI Talk
  - `talk.consultFastMode`: substituição pontual de modo rápido para consultas em tempo real do Control UI Talk
  - `talk.speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback de retransmissão do Gateway para transcrições finalizadas em tempo real do Talk que pulam `openclaw_agent_consult`

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas apoiadas por provedor e configuração de
provedor personalizado / URL base foram movidas para uma página dedicada - consulte
[Configuração - ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Modelos

Definições de provedores, listas de permissões de modelos e configuração de provedor personalizado ficam em
[Configuração - ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls).
A raiz `models` também controla o comportamento global do catálogo de modelos.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados indexado por id de provedor.
- `models.providers.*.localService`: gerenciador de processos sob demanda opcional para
  servidores de modelo locais. O OpenClaw verifica o endpoint de integridade configurado, inicia
  o `command` absoluto quando necessário, aguarda a prontidão e então envia a solicitação do
  modelo. Consulte [Serviços de modelo locais](/pt-BR/gateway/local-model-services).
- `models.pricing.enabled`: controla a inicialização de preços em segundo plano que
  começa depois que sidecars e canais chegam ao caminho pronto do Gateway. Quando `false`,
  o Gateway pula buscas de catálogos de preços do OpenRouter e LiteLLM; valores
  `models.providers.*.models[].cost` configurados continuam funcionando para estimativas de custo locais.

## MCP

Definições de servidor MCP gerenciadas pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo OpenClaw incorporado e outros adaptadores de runtime. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam este bloco sem se conectar ao
servidor de destino durante edições de configuração.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definições nomeadas de servidores MCP stdio ou remotos para runtimes que
  expõem ferramentas MCP configuradas.
  Entradas remotas usam `transport: "streamable-http"` ou `transport: "sse"`;
  `type: "http"` é um alias nativo da CLI que `openclaw mcp set` e
  `openclaw doctor --fix` normalizam para o campo canônico `transport`.
- `mcp.servers.<name>.enabled`: defina `false` para manter uma definição de servidor salva
  enquanto a exclui da descoberta MCP incorporada do OpenClaw e da projeção de ferramentas.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout de solicitação MCP por servidor
  em segundos ou milissegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout de conexão por servidor
  em segundos ou milissegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: dica de concorrência opcional para
  adaptadores que podem escolher se emitem chamadas paralelas de ferramentas MCP.
- `mcp.servers.<name>.auth`: defina `"oauth"` para servidores MCP HTTP que exigem
  OAuth. Execute `openclaw mcp login <name>` para armazenar tokens no estado do OpenClaw.
- `mcp.servers.<name>.oauth`: substituições opcionais de escopo OAuth, URL de redirecionamento e URL de
  metadados do cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS HTTP
  para endpoints privados e TLS mútuo.
- `mcp.servers.<name>.toolFilter`: seleção opcional de ferramentas por servidor. `include`
  limita as ferramentas MCP descobertas a nomes correspondentes; `exclude` oculta nomes
  correspondentes. Entradas são nomes exatos de ferramentas MCP ou globs `*` simples. Servidores com
  recursos ou prompts também geram nomes de ferramentas utilitárias (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), e esses nomes usam o
  mesmo filtro.
- `mcp.servers.<name>.codex`: controles opcionais de projeção do servidor de app Codex.
  Este bloco é metadado do OpenClaw apenas para threads do servidor de app Codex; ele não
  afeta sessões ACP, configuração genérica do harness Codex ou outros adaptadores de runtime.
  `codex.agents` não vazio limita o servidor aos ids de agente OpenClaw listados.
  Listas de agentes com escopo vazias, em branco ou inválidas são rejeitadas pela validação de configuração
  e omitidas pelo caminho de projeção de runtime em vez de se tornarem globais.
  `codex.defaultToolsApprovalMode` emite o
  `default_tools_approval_mode` nativo do Codex para esse servidor. O OpenClaw remove o bloco `codex`
  antes de passar a configuração nativa `mcp_servers` para o Codex. Omita o bloco para
  manter o servidor projetado para todos os agentes de servidor de app Codex com o
  comportamento padrão de aprovação MCP do Codex.
- `mcp.sessionIdleTtlMs`: TTL ocioso para runtimes MCP incluídos com escopo de sessão.
  Execuções incorporadas pontuais solicitam limpeza no fim da execução; este TTL é a proteção para
  sessões de longa duração e chamadores futuros.
- Alterações em `mcp.*` são aplicadas a quente descartando runtimes MCP de sessão em cache.
  A próxima descoberta/uso de ferramenta os recria a partir da nova configuração, então entradas
  `mcp.servers` removidas são recolhidas imediatamente em vez de esperar pelo TTL ocioso.
- A descoberta de runtime também respeita notificações de alteração da lista de ferramentas MCP descartando
  o catálogo em cache dessa sessão. Servidores que anunciam recursos ou
  prompts recebem ferramentas utilitárias para listar/ler recursos e listar/buscar
  prompts. Falhas repetidas de chamada de ferramenta pausam brevemente o servidor afetado antes
  de outra chamada ser tentada.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends de CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento de runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permissões opcional apenas para skills incluídas (skills gerenciadas/workspace não afetadas).
- `load.extraDirs`: raízes extras de skills compartilhadas (menor precedência).
- `load.allowSymlinkTargets`: raízes de destino reais confiáveis para as quais symlinks de skill podem
  resolver quando o link fica fora da raiz de origem configurada.
- `workshop.allowSymlinkTargetWrites`: permite que a aplicação do Skill Workshop grave
  por destinos de symlink já confiáveis (padrão: false).
- `install.preferBrew`: quando true, prefira instaladores Homebrew quando `brew` estiver
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes Gateway `operator.admin` confiáveis
  instalem arquivos zip privados preparados por `skills.upload.*`
  (padrão: false). Isso habilita apenas o caminho de arquivo enviado; instalações normais do ClawHub
  não exigem isso.
- `entries.<skillKey>.enabled: false` desabilita uma skill mesmo se ela estiver incluída/instalada.
- `entries.<skillKey>.apiKey`: conveniência para skills que declaram uma variável de ambiente primária (string em texto puro ou objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados a partir de diretórios de pacotes ou bundles em `~/.openclaw/extensions` e `<workspace>/.openclaw/extensions`, além de arquivos ou diretórios listados em `plugins.load.paths`.
- Coloque arquivos de Plugin independentes em `plugins.load.paths`; raízes de extensões descobertas automaticamente ignoram arquivos `.js`, `.mjs` e `.ts` no nível superior para que scripts auxiliares nessas raízes não bloqueiem a inicialização.
- A descoberta aceita Plugins nativos do OpenClaw, além de bundles compatíveis do Codex e do Claude, incluindo bundles sem manifesto no layout padrão do Claude.
- **Alterações de configuração exigem reinicialização do Gateway.**
- `allow`: lista de permissões opcional (somente os Plugins listados carregam). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência para chave de API no nível do Plugin (quando compatível com o Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que alteram prompts do `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de Plugins nativos e a diretórios de hooks fornecidos por bundles compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, Plugins confiáveis não incluídos em bundle podem ler conteúdo bruto de conversas a partir de hooks tipados, como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições de `provider` e `model` por execução em execuções de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permissões opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` somente quando você quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permissões opcional de destinos canônicos `provider/model` para substituições confiáveis de conclusão de LLM do Plugin. Use `"*"` somente quando você quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confia explicitamente neste Plugin para executar `api.runtime.llm.complete` em relação a um id de agente não padrão.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo Plugin (validado pelo esquema de Plugin nativo do OpenClaw quando disponível).
- Configurações de conta/runtime de Plugins de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do Plugin proprietário, não por um registro central de opções do OpenClaw.

### Configuração do Plugin de harness do Codex

O Plugin `codex` incluído em bundle é responsável pelas configurações nativas do harness de app-server do Codex em
`plugins.entries.codex.config`. Consulte a
[referência do harness do Codex](/pt-BR/plugins/codex-harness-reference) para a superfície completa de configuração
e [harness do Codex](/pt-BR/plugins/codex-harness) para o modelo de runtime.

`codexPlugins` aplica-se somente a sessões que selecionam o harness nativo do Codex.
Ele não habilita Plugins do Codex para execuções de provedor do OpenClaw, associações de conversa ACP
nem qualquer harness que não seja do Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita suporte nativo a
  Plugin/app do Codex para o harness do Codex. Padrão: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política padrão de ações destrutivas para solicitações migradas de apps de Plugin.
  Use `true` para aceitar esquemas seguros de aprovação do Codex sem solicitar confirmação, `false`
  para recusá-los, `"auto"` para rotear aprovações exigidas pelo Codex por meio de aprovações de Plugin do OpenClaw,
  ou `"ask"` para solicitar confirmação para toda ação de escrita/destrutiva de Plugin
  sem aprovação durável. O modo `"ask"` limpa substituições duráveis de aprovação por ferramenta do Codex
  para o app afetado e seleciona o revisor humano de aprovações para esse app antes que a thread do Codex seja iniciada.
  Padrão: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita uma
  entrada de Plugin migrada quando `codexPlugins.enabled` global também é verdadeiro.
  Padrão: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidade estável do marketplace. A V1 só oferece suporte a `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidade estável
  do Plugin do Codex proveniente da migração, por exemplo `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  substituição de ação destrutiva por Plugin. Quando omitida, o valor global
  `allow_destructive_actions` é usado. O valor por Plugin aceita as mesmas políticas
  `true`, `false`, `"auto"` ou `"ask"`.

Cada app de Plugin admitido que usa `"ask"` roteia as solicitações de aprovação desse app
para o revisor humano. Outros apps e aprovações de thread que não sejam de app mantêm seu
revisor configurado, portanto políticas mistas de Plugin não herdam o comportamento `"ask"`.

`codexPlugins.enabled` é a diretiva global de habilitação. Entradas explícitas de Plugin
gravadas pela migração são o conjunto durável de elegibilidade de instalação e reparo.
`plugins["*"]` não é compatível, não há chave `install`, e valores locais
de `marketplacePath` não são campos de configuração intencionalmente porque são
específicos do host.

Verificações de prontidão de `app/list` são armazenadas em cache por uma hora e atualizadas
assincronamente quando ficam obsoletas. A configuração de app da thread do Codex é calculada no estabelecimento
da sessão do harness do Codex, não a cada turno; use `/new`, `/reset` ou uma reinicialização
do Gateway depois de alterar a configuração nativa de Plugin.

- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web do Firecrawl.
  - `apiKey`: chave de API opcional do Firecrawl para limites mais altos (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados/internos).
  - `onlyMainContent`: extrai somente o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (pesquisa web Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a ser usado para pesquisa (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave geral de Dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - `model`: substituição opcional de modelo do subagente Dream Diary. Exige `plugins.entries.memory-core.subagent.allowModelOverride: true`; combine com `allowedModels` para restringir destinos. Erros de modelo indisponível tentam novamente uma vez com o modelo padrão da sessão; falhas de confiança ou lista de permissões não fazem fallback silenciosamente.
  - política de fases e limites são detalhes de implementação (não chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de bundle do Claude habilitados também podem contribuir padrões incorporados do OpenClaw a partir de `settings.json`; o OpenClaw aplica esses valores como configurações de agente sanitizadas, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolha o id do Plugin de memória ativo, ou `"none"` para desabilitar Plugins de memória.
- `plugins.slots.contextEngine`: escolha o id do Plugin de mecanismo de contexto ativo; o padrão é `"legacy"`, a menos que você instale e selecione outro mecanismo.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Compromissos

`commitments` controla a memória inferida de acompanhamento: o OpenClaw pode detectar check-ins a partir de turnos de conversa e entregá-los por meio de execuções de Heartbeat.

- `commitments.enabled`: habilita extração LLM oculta, armazenamento e entrega via Heartbeat para compromissos inferidos de acompanhamento. Padrão: `false`.
- `commitments.maxPerDay`: máximo de compromissos inferidos de acompanhamento entregues por sessão de agente em um dia móvel. Padrão: `3`.

Consulte [Compromissos inferidos](/pt-BR/concepts/commitments).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera abas rastreadas do agente primário após tempo ocioso ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desabilitar esses modos de limpeza individuais.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado quando não definido, então a navegação do navegador permanece restrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de acessibilidade/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como um alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente anexação (iniciar/parar/redefinir desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket DevTools direta.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam à acessibilidade CDP remota e
  `attachOnly`, além de solicitações de abertura de abas. Perfis loopback
  gerenciados mantêm os padrões CDP locais.
- Se um serviço CDP gerenciado externamente estiver acessível por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw trata a porta loopback como um
  perfil de navegador local gerenciado e pode relatar erros de propriedade de porta local.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se anexar no
  host selecionado ou por meio de um Node de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil
  específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` podem definir `cdpUrl` quando o Chrome já estiver em execução
  atrás de um endpoint de descoberta HTTP(S) DevTools ou de um endpoint WS(S) direto. Nesse
  modo, o OpenClaw passa o endpoint para o Chrome MCP em vez de usar conexão automática;
  `userDataDir` é ignorado nos argumentos de inicialização do Chrome MCP.
- Perfis `existing-session` mantêm os limites atuais da rota Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks de upload
  de um arquivo, sem substituições de timeout de diálogo, sem `wait --load networkidle` e sem
  `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` locais gerenciados atribuem `cdpPort` e `cdpUrl` automaticamente; defina
  `cdpUrl` explicitamente apenas para perfis CDP remotos ou anexação de endpoint
  existing-session.
- Perfis locais gerenciados podem definir `executablePath` para substituir o
  `browser.executablePath` global desse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis locais gerenciados usam `browser.localLaunchTimeoutMs` para descoberta HTTP do Chrome CDP
  após o início do processo e `browser.localCdpReadyTimeoutMs` para
  prontidão do websocket CDP após a inicialização. Aumente-os em hosts mais lentos onde o Chrome
  inicia com sucesso, mas as verificações de prontidão competem com a inicialização. Ambos os valores devem ser
  inteiros positivos até `120000` ms; valores de configuração inválidos são rejeitados.
- Ordem de detecção automática: navegador padrão se baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` aceitam
  `~` e `~/...` para o diretório home do seu SO antes da inicialização do Chromium.
  `userDataDir` por perfil em perfis `existing-session` também é expandido com til.
- Serviço de controle: apenas loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização à inicialização local do Chromium (por exemplo
  `--disable-gpu`, dimensionamento de janela ou flags de depuração).

---

## IU

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: cor de destaque para a interface nativa do aplicativo (tom do balão do Talk Mode etc.).
- `assistant`: substituição da identidade da Control UI. Recorre à identidade do agente ativo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do Gateway">

- `mode`: `local` (executar gateway) ou `remote` (conectar ao gateway remoto). O Gateway se recusa a iniciar a menos que seja `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases de bind legados**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: exigida por padrão. Binds não loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso ciente de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e de instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use somente para configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação de navegador/usuário a um proxy reverso ciente de identidade e confia em cabeçalhos de identidade de `gateway.trustedProxies` (veja [Autenticação por Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **não loopback** por padrão; proxies reversos loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito. Chamadores internos no mesmo host podem usar `gateway.auth.password` como fallback direto local; `gateway.auth.token` continua mutuamente exclusivo com o modo trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da UI de Controle/WebSocket (verificada via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação de cabeçalho do Tailscale; em vez disso, seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token presume que o host do gateway é confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP de cliente e por escopo de autenticação (shared-secret e device-token são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da UI de Controle via Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Portanto, tentativas ruins simultâneas do mesmo cliente podem acionar o limitador na segunda requisição, em vez de ambas passarem competindo como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` por padrão; defina `false` quando você intencionalmente quiser que tráfego localhost também sofra limitação de taxa (para configurações de teste ou implantações de proxy estritas).
- Tentativas de autenticação WS com origem em navegador são sempre limitadas com isenção de loopback desativada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios com origem em navegador são isolados por valor
  normalizado de `Origin`, então falhas repetidas de uma origem localhost não bloqueiam automaticamente
  uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind loopback) ou `funnel` (público, exige autenticação).
- `tailscale.serviceName`: nome opcional de Serviço Tailscale para o modo Serve, como
  `svc:openclaw`. Quando definido, o OpenClaw o passa para `tailscale serve
--service` para que a UI de Controle possa ser exposta por meio de um Serviço nomeado em vez
  do nome de host do dispositivo. O valor deve usar o formato de nome de Serviço
  `svc:<dns-label>` do Tailscale; a inicialização informa a URL de Serviço derivada.
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, o OpenClaw
  verifica `tailscale funnel status` antes de reaplicar Serve na inicialização e pula
  isso se uma rota Funnel configurada externamente já cobrir a porta do gateway.
  Padrão `false`.
- `controlUi.allowedOrigins`: lista de permissão explícita de origens de navegador para conexões WebSocket do Gateway. Exigida para origens de navegador públicas não loopback. Carregamentos privados de UI de mesma origem em LAN/Tailnet a partir de loopback, RFC1918/link-local, `.local`, `.ts.net` ou hosts CGNAT do Tailscale são aceitos sem habilitar fallback de cabeçalho Host.
- `controlUi.chatMessageMaxWidth`: largura máxima opcional para mensagens de chat agrupadas da UI de Controle. Aceita valores de largura CSS restritos, como `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que intencionalmente dependem de política de origem por cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `wss://` para hosts públicos; `ws://` em texto claro é aceito somente para hosts loopback, LAN, link-local, `.local`, `.ts.net` e CGNAT do Tailscale.
- `remote.remotePort`: porta do gateway no host SSH remoto. O padrão é `18789`; use isso quando a porta do túnel local for diferente da porta do gateway remoto.
- `gateway.remote.token` / `.password` são campos de credenciais de cliente remoto. Eles não configuram autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para o relay APNs externo usado depois que builds iOS com suporte a relay publicam registros no gateway. Builds públicos da App Store/TestFlight usam o relay hospedado do OpenClaw. URLs de relay personalizadas devem corresponder a um caminho de build/implantação iOS deliberadamente separado cuja URL de relay aponta para esse relay.
- `gateway.push.apns.relay.timeoutMs`: tempo limite de envio do gateway para o relay em milissegundos. O padrão é `10000`.
- Registros com suporte a relay são delegados a uma identidade específica do gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao gateway uma concessão de envio com escopo de registro. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias de env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente de desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.handshakeTimeoutMs`: tempo limite do handshake WebSocket do Gateway antes da autenticação, em milissegundos. Padrão: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tem precedência quando definido. Aumente isso em hosts carregados ou de baixa potência onde clientes locais conseguem se conectar enquanto o aquecimento da inicialização ainda está se estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canal em minutos. Defina `0` para desativar reinícios do monitor de integridade globalmente. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinícios do monitor de integridade por canal/conta em uma janela móvel de uma hora. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativação por canal dos reinícios do monitor de integridade, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição em nível de canal.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` for configurado explicitamente via SecretRef e não resolvido, a resolução falha fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que encerram TLS ou injetam cabeçalhos de cliente encaminhado. Liste somente proxies que você controla. Entradas loopback ainda são válidas para configurações de proxy/detecção local no mesmo host (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam requisições loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento de falha fechada.
- `gateway.nodes.pairing.autoApproveCidrs`: lista de permissão CIDR/IP opcional para aprovar automaticamente o pareamento inicial de dispositivo de nó sem escopos solicitados. Fica desativada quando não definida. Isso não aprova automaticamente pareamento de operador/navegador/UI de Controle/WebChat, e não aprova automaticamente atualizações de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelagem global de permissão/negação para comandos de nó declarados depois do pareamento e da avaliação da lista de permissão da plataforma. Use `allowCommands` para optar por comandos perigosos de nó, como `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` remove um comando mesmo que um padrão de plataforma ou permissão explícita o incluísse de outra forma. Depois que um nó altera sua lista de comandos declarados, rejeite e reaprove esse pareamento de dispositivo para que o gateway armazene o snapshot de comandos atualizado.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueadas para HTTP `POST /tools/invoke` (estende a lista de negação padrão).
- `gateway.tools.allow`: remove nomes de ferramentas da lista de negação HTTP padrão para
  chamadores owner/admin. Isso não eleva chamadores `operator.write` portadores de identidade
  a acesso owner/admin; `cron`, `gateway` e `nodes` continuam
  indisponíveis para chamadores não owner mesmo quando incluídos na lista de permissão.

</Accordion>

### Endpoints compatíveis com OpenAI

- RPC HTTP Admin: desativado por padrão como o Plugin `admin-http-rpc`. Habilite o Plugin para registrar `POST /api/v1/admin/rpc`. Veja [RPC HTTP Admin](/pt-BR/plugins/admin-http-rpc).
- Chat Completions: desativado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada por URL da Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Listas de permissão vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar busca por URL.
- Cabeçalho opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina somente para origens HTTPS que você controla; veja [Autenticação por Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute múltiplos gateways em um host com portas e dirs de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Veja [Múltiplos Gateways](/pt-BR/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: habilita terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par de certificado/chave local autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do bundle de CA para verificação de cliente ou cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla como as edições de configuração são aplicadas em tempo de execução.
  - `"off"`: ignora edições ao vivo; as alterações exigem uma reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do Gateway quando a configuração muda.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta recarregamento a quente primeiro; recorre à reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes de as alterações de configuração serem aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para aguardar operações em andamento antes de forçar uma reinicialização ou recarregamento a quente do canal. Omita para usar a espera limitada padrão (`300000`); defina como `0` para aguardar indefinidamente e registrar avisos periódicos de pendências ainda em andamento.

---

## Ganchos

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticação: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de gancho em query string são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser diferente da autenticação active Gateway shared-secret (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); a inicialização registra um aviso de segurança não fatal quando detecta reutilização.
- `openclaw security audit` sinaliza reutilização de autenticação de gancho/Gateway como um achado crítico, incluindo autenticação por senha do Gateway fornecida apenas no momento da auditoria (`--auth password --password <password>`). Execute `openclaw doctor --fix` para rotacionar um `hooks.token` persistido e reutilizado; depois atualize emissores externos de ganchos para usar o novo token de gancho.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Se um mapeamento ou preset usa um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves de mapeamento estáticas não exigem essa adesão explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da solicitação é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de gancho.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessia são rejeitados).
  - Mantenha `hooks.transformsDir` em `~/.openclaw/hooks/transforms`; diretórios de Skills do workspace são rejeitados. Se `openclaw doctor` relatar esse caminho como inválido, mova o módulo de transformação para o diretório de transformações de ganchos ou remova `hooks.transformsDir`.
- `agentId` roteia para um agente específico; IDs desconhecidos recorrem ao agente padrão.
- `allowedAgentIds`: restringe o roteamento efetivo de agentes, incluindo o caminho do agente padrão quando `agentId` é omitido (`*` ou omitido = permitir todos, `[]` = negar todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente por gancho sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamento orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: lista de permissão opcional de prefixos para valores explícitos de `sessionKey` (solicitação + mapeamento), por exemplo, `["hook:"]`. Ela se torna obrigatória quando qualquer mapeamento ou preset usa um `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` por padrão.
- `model` substitui o LLM para esta execução de gancho (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset integrado do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo, `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, substitua o preset por um `sessionKey` estático em vez do padrão com template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.
- Não execute um `gog gmail watch serve` separado junto com o Gateway.

---

## Host do plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Serve HTML/CSS/JS editáveis por agentes e A2UI por HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Associações que não sejam loopback: rotas de canvas exigem autenticação do Gateway (token/senha/proxy confiável), assim como outras superfícies HTTP do Gateway.
- Node WebViews normalmente não enviam cabeçalhos de autenticação; depois que um nó é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de nó para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do nó e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta o cliente de recarregamento ao vivo no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem uma reinicialização do Gateway.
- Desative o recarregamento ao vivo para diretórios grandes ou erros `EMFILE`.

---

## Descoberta

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (padrão quando o plugin `bonjour` incluído está habilitado): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`; a publicidade multicast em LAN ainda exige que o plugin `bonjour` incluído esteja habilitado.
- `off`: suprime a publicidade multicast em LAN sem alterar a habilitação do plugin.
- O plugin `bonjour` incluído inicia automaticamente em hosts macOS e é opt-in no Linux, Windows e implantações containerizadas do Gateway.
- O nome do host usa por padrão o nome do host do sistema quando ele é um rótulo DNS válido, recorrendo a `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Área ampla (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + DNS dividido do Tailscale.

Configuração: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variáveis de ambiente inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Variáveis de ambiente inline só são aplicadas se a variável de ambiente do processo não tiver a chave.
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum deles substitui variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do seu perfil de shell de login.
- Consulte [Ambiente](/pt-BR/help/environment) para a precedência completa.

### Substituição de variáveis de ambiente

Referencie variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Somente nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram um erro no carregamento da configuração.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

Referências a segredos são aditivas: valores em texto simples ainda funcionam.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de id de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id de `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (compatível com seletores no estilo AWS `secret#json_key`)
- IDs de `source: "exec"` não podem conter segmentos de caminho delimitados por barra `.` ou `..` (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` mira caminhos de credenciais compatíveis em `openclaw.json`.
- Referências de `auth-profiles.json` estão incluídas na resolução em runtime e na cobertura de auditoria.

### Configuração de provedores de segredos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Observações:

- O provedor `file` é compatível com `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de provedores file e exec falham de forma fechada quando a verificação de ACL do Windows está indisponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não possam ser verificados.
- O provedor `exec` exige um caminho absoluto de `command` e usa cargas de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos de symlink enquanto valida o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe as variáveis necessárias explicitamente com `passEnv`.
- Referências a segredos são resolvidas no momento da ativação em um snapshot em memória; depois, os caminhos de solicitação leem apenas o snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: referências não resolvidas em superfícies habilitadas fazem a inicialização/recarga falhar, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de autenticação

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` oferece suporte a referências em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciais estáticas.
- Mapas planos legados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, não são um formato de runtime; `openclaw doctor --fix` os reescreve para perfis canônicos de chave de API `provider:default` com um backup `.legacy-flat.*.bak`.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação baseadas em SecretRef.
- Credenciais estáticas de runtime vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são removidas quando descobertas.
- Importações OAuth legadas vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento do runtime de segredos e ferramentas `audit/configure/apply`: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: recuo base em horas quando um perfil falha devido a erros reais
  de cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas correspondedores de texto específicos
  do provedor permanecem restritos ao provedor que os possui (por exemplo, OpenRouter
  `Key limit exceeded`). Mensagens HTTP `402` recuperáveis de janela de uso ou
  limite de gastos de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de recuo de cobrança.
- `billingMaxHours`: limite em horas para crescimento exponencial do recuo de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: recuo base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para crescimento do recuo `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela deslizante em horas usada para contadores de recuo (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de perfil de autenticação do mesmo provedor para erros de sobrecarga antes de alternar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado, como `ModelNotReadyException`, caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de perfil de autenticação do mesmo provedor para erros de limite de taxa antes de alternar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto formatado pelo provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registro em logs

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para um caminho estável.
- `consoleLevel` sobe para `debug` quando `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log ativo em bytes antes da rotação (inteiro positivo; padrão: `104857600` = 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo.
- `redactSensitive` / `redactPatterns`: mascaramento de melhor esforço para saída do console, logs de arquivo, registros de log OTLP e texto persistido de transcrição de sessão. `redactSensitive: "off"` desativa apenas esta política geral de logs/transcrições; superfícies de segurança de UI/ferramentas/diagnóstico ainda redigem segredos antes da emissão.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: alternância mestra para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de sinalizadores que ativam saída de log direcionada (oferece suporte a curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade sem progresso em ms para classificar sessões de processamento de longa duração como `session.long_running`, `session.stalled` ou `session.stuck`. Respostas, ferramentas, status, blocos e progresso ACP reiniciam o temporizador; diagnósticos `session.stuck` repetidos aplicam recuo enquanto não houver alterações.
- `stuckSessionAbortMs`: limite de idade sem progresso em ms antes que trabalho ativo travado elegível possa ser abortado e drenado para recuperação. Quando não definido, o OpenClaw usa a janela mais segura e estendida de execução embutida de pelo menos 5 minutos e 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura um snapshot de estabilidade redigido pré-OOM quando a pressão de memória atinge `critical` (padrão: `false`). Defina como `true` para adicionar a varredura/gravação do arquivo de pacote de estabilidade mantendo eventos normais de pressão de memória.
- `otel.enabled`: ativa o pipeline de exportação OpenTelemetry (padrão: `false`). Para a configuração completa, catálogo de sinais e modelo de privacidade, consulte [exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` apenas para esse sinal.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: ativam exportação de traces, métricas ou logs.
- `otel.logsExporter`: destino de exportação de logs: `"otlp"` (padrão), `"stdout"` para um objeto JSON por linha de stdout, ou `"both"`.
- `otel.sampleRate`: taxa de amostragem de trace `0`-`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `otel.captureContent`: captura de conteúdo bruto por opt-in para atributos de span OTEL. O padrão é desativado. Booleano `true` captura conteúdo de mensagens/ferramentas não sistêmicas; a forma de objeto permite ativar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` e `toolDefinitions` explicitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: alternância de ambiente para o formato experimental mais recente de span de inferência GenAI, incluindo nomes de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` e `gen_ai.provider.name` em vez do legado `gen_ai.system`. Por padrão, spans mantêm `openclaw.model.call` e `gen_ai.system` para compatibilidade; métricas GenAI usam atributos semânticos delimitados.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância de ambiente para hosts que já registraram um SDK OpenTelemetry global. O OpenClaw então pula a inicialização/desligamento do SDK pertencente ao Plugin, mantendo listeners de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de configuração correspondente não está definida.
- `cacheTrace.enabled`: registra snapshots de trace de cache para execuções embutidas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de trace de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de trace de cache (todos padrão: `true`).

---

## Atualização

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de lançamento para instalações npm/git - `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: ativa atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máx.: `168`).
- `auto.stableJitterHours`: janela extra de distribuição de rollout no canal estável em horas (padrão: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: com que frequência as verificações do canal beta são executadas em horas (padrão: `1`; máx.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate global do recurso ACP (padrão: `true`; defina `false` para ocultar dispatch ACP e recursos de spawn).
- `dispatch.enabled`: gate independente para dispatch de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
  Instale o Plugin de backend primeiro e, se `plugins.allow` estiver definido, inclua o id do Plugin de backend (por exemplo, `acpx`) ou o backend ACP não será carregado.
- `defaultAgent`: id do agente ACP de destino fallback quando spawns não especificam um destino explícito.
- `allowedAgents`: allowlist de ids de agentes permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ocioso em ms para texto transmitido por streaming.
- `stream.maxChunkChars`: tamanho máximo de chunk antes de dividir a projeção de bloco transmitida por streaming.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` armazena em buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos de ferramenta ocultos (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade para eventos transmitidos por streaming.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de limpeza elegível.
- `runtime.installCommand`: comando de instalação opcional a ser executado ao inicializar um ambiente de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla o estilo do slogan do banner:
  - `"random"` (padrão): slogans engraçados/sazonais rotativos.
  - `"default"`: slogan neutro fixo (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de slogan (título/versão do banner ainda exibidos).
- Para ocultar o banner inteiro (não apenas os slogans), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente

Metadados gravados por fluxos guiados de configuração da CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identidade

Consulte os campos de identidade de `agents.list` em [Padrões do agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Ponte (legado, removida)

As builds atuais não incluem mais a ponte TCP. Os nós se conectam pelo WebSocket do Gateway. As chaves `bridge.*` não fazem mais parte do esquema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração de ponte legada (referência histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções isoladas de cron antes de removê-las de `sessions.json`. Também controla a limpeza de transcrições arquivadas de cron excluído. Padrão: `24h`; defina `false` para desabilitar.
- `runLog.maxBytes`: aceito para compatibilidade com logs de execução de cron mais antigos baseados em arquivo. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes do histórico de execuções em SQLite retidas por trabalho. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook de cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook legada obsoleta de fallback (http/https) usada por `openclaw doctor --fix` para migrar trabalhos armazenados que ainda têm `notify: true`; a entrega em runtime usa `delivery.mode="webhook"` por trabalho mais `delivery.to`, ou `delivery.completionDestination` ao preservar entrega de anúncio.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: máximo de novas tentativas para trabalhos de cron em erros transitórios (padrão: `3`; intervalo: `0`-`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa (padrão: `[30000, 60000, 300000]`; 1-10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente todos os tipos transitórios.

Trabalhos de execução única permanecem habilitados até que as tentativas se esgotem, então são desabilitados mantendo o estado de erro final. Trabalhos recorrentes usam a mesma política de novas tentativas transitórias para executar novamente após o backoff antes do próximo horário agendado; erros permanentes ou novas tentativas transitórias esgotadas voltam para o agendamento recorrente normal com backoff de erro.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de falha para trabalhos de cron (padrão: `false`).
- `after`: falhas consecutivas antes de disparar um alerta (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para o mesmo trabalho (inteiro não negativo).
- `includeSkipped`: conta execuções consecutivas ignoradas para o limite de alerta (padrão: `false`). Execuções ignoradas são rastreadas separadamente e não afetam o backoff de erro de execução.
- `mode`: modo de entrega - `"announce"` envia por mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: conta opcional ou id de canal para delimitar a entrega do alerta.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino padrão para notificações de falha de cron em todos os trabalhos.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega de anúncio. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito de anúncio ou URL de Webhook. Obrigatório para o modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por trabalho substitui esse padrão global.
- Quando nenhum destino de falha global nem por trabalho é definido, trabalhos que já entregam via `announce` recorrem a esse destino primário de anúncio em caso de falha.
- `delivery.failureDestination` só é compatível com trabalhos `sessionTarget="isolated"`, a menos que o `delivery.mode` primário do trabalho seja `"webhook"`.

Consulte [Trabalhos de Cron](/pt-BR/automation/cron-jobs). Execuções isoladas de cron são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template do modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem de entrada             |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador do destino                          |
| `{{MessageSid}}`   | id da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia de entrada                    |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | Transcrição de áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Máximo de caracteres de saída resolvido para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia de membros do grupo (melhor esforço)       |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica de provedor (whatsapp, telegram, discord etc.) |

---

## Includes de configuração (`$include`)

Divida a configuração em vários arquivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento de mesclagem:**

- Arquivo único: substitui o objeto que o contém.
- Array de arquivos: mesclado profundamente em ordem (posteriores substituem anteriores).
- Chaves irmãs: mescladas após os includes (substituem valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas somente quando ainda resolvem dentro desse limite. Caminhos não podem conter bytes nulos e devem ser estritamente menores que 4096 caracteres antes e depois da resolução.
- Gravações de propriedade do OpenClaw que alteram apenas uma seção de nível superior respaldada por um include de arquivo único gravam diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes na raiz, arrays de include e includes com substituições irmãs são somente leitura para gravações de propriedade do OpenClaw; essas gravações falham de modo fechado em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise, includes circulares, formato de caminho inválido e comprimento excessivo.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
