---
read_when:
    - Você precisa chamar auxiliares do núcleo a partir de um Plugin (TTS, STT, geração de imagens, pesquisa na web, subagente, nós)
    - Você quer entender o que api.runtime expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- os auxiliares de tempo de execução injetados disponíveis para plugins
title: Auxiliares de tempo de execução do Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referência para o objeto `api.runtime` injetado em cada Plugin durante o registro. Use estes auxiliares em vez de importar diretamente os componentes internos do host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/pt-BR/plugins/sdk-channel-plugins">
    Guia passo a passo que usa estes auxiliares em contexto para plugins de canal.
  </Card>
  <Card title="Plugins de provedor" href="/pt-BR/plugins/sdk-provider-plugins">
    Guia passo a passo que usa estes auxiliares em contexto para plugins de provedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Carregamento e gravações de configuração

Prefira a configuração que já foi passada para o caminho de chamada ativo, por exemplo `api.config` durante o registro ou um argumento `cfg` em callbacks de canal/provedor. Isso mantém um snapshot do processo fluindo pelo trabalho em vez de reanalisar a configuração em caminhos críticos.

Use `api.runtime.config.current()` somente quando um handler de longa duração precisar do snapshot atual do processo e nenhuma configuração tiver sido passada para essa função. O valor retornado é somente leitura; clone ou use um auxiliar de mutação antes de editar.

Fábricas de ferramentas recebem `ctx.runtimeConfig` mais `ctx.getRuntimeConfig()`. Use o getter dentro do callback `execute` de uma ferramenta de longa duração quando a configuração puder mudar depois que a definição da ferramenta tiver sido criada.

Persista alterações com `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Cada gravação deve escolher uma política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` permite que o planejador de recarregamento do Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` força uma reinicialização limpa quando o gravador sabe que o hot reload não é seguro.
- `afterWrite: { mode: "none", reason: "..." }` suprime recarregamento/reinicialização automática somente quando o chamador é responsável pelo acompanhamento.

Os auxiliares de mutação retornam `afterWrite` mais um resumo `followUp` tipado para que chamadores possam registrar em log ou testar se solicitaram uma reinicialização. O Gateway ainda é responsável por quando essa reinicialização realmente acontece.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` são auxiliares de compatibilidade obsoletos em `runtime-config-load-write`. Eles avisam uma vez em runtime e permanecem disponíveis para plugins externos antigos durante a janela de migração. Plugins empacotados não devem usá-los; as proteções da fronteira de configuração falham se o código do plugin os chamar ou importar esses auxiliares de subcaminhos do SDK de plugin.

Para importações diretas do SDK, use os subcaminhos de configuração focados em vez do barrel de compatibilidade amplo
`openclaw/plugin-sdk/config-runtime`: `config-types` para
tipos, `plugin-config-runtime` para asserções de configuração já carregada e
busca de entrada de plugin, `runtime-config-snapshot` para snapshots do processo atual e
`config-mutation` para gravações. Testes de plugins empacotados devem mockar esses subcaminhos focados
diretamente em vez de mockar o barrel de compatibilidade amplo.

O código interno de runtime do OpenClaw segue a mesma direção: carregue a configuração uma vez na CLI, no Gateway ou na fronteira do processo, então passe esse valor adiante. Gravações de mutação bem-sucedidas atualizam o snapshot de runtime do processo e avançam sua revisão interna; caches de longa duração devem usar como chave a chave de cache pertencente ao runtime em vez de serializar a configuração localmente. Módulos de runtime de longa duração têm um scanner de tolerância zero para chamadas ambientais a `loadConfig()`; use um `cfg` passado, um `context.getRuntimeConfig()` de requisição ou `getRuntimeConfig()` em uma fronteira explícita do processo.

Caminhos de execução de provedor e canal devem usar o snapshot ativo de configuração de runtime, não um snapshot de arquivo retornado para releitura ou edição da configuração. Snapshots de arquivo preservam valores de origem, como marcadores SecretRef para UI e gravações; callbacks de provedor precisam da visão de runtime resolvida. Quando um auxiliar puder ser chamado com o snapshot de origem ativo ou com o snapshot de runtime ativo, roteie por `selectApplicableRuntimeConfig()` antes de ler credenciais.

## Namespaces de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidade do agente, diretórios e gerenciamento de sessões.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` é o auxiliar neutro para iniciar um turno normal de agente OpenClaw a partir do código do plugin. Ele usa a mesma resolução de provedor/modelo e seleção de harness de agente que respostas acionadas por canal.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidade.

    `resolveThinkingPolicy(...)` retorna os níveis de raciocínio compatíveis do provedor/modelo e o padrão opcional. Plugins de provedor são responsáveis pelo perfil específico do modelo por meio de seus hooks de raciocínio, então plugins de ferramenta devem chamar este auxiliar de runtime em vez de importar ou duplicar listas de provedores.

    `normalizeThinkingLevel(...)` converte texto do usuário como `on`, `x-high` ou `extra high` para o nível armazenado canônico antes de verificá-lo contra a política resolvida.

    **Auxiliares de armazenamento de sessões** ficam em `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Prefira `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` para gravações em runtime. Eles roteiam pelo gravador de armazenamento de sessões pertencente ao Gateway, preservam atualizações concorrentes e reutilizam o cache quente. `saveSessionStore(...)` permanece disponível para compatibilidade e reescritas de manutenção offline.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes de modelo e provedor padrão:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie e gerencie execuções de subagentes em segundo plano.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Substituições de modelo (`provider`/`model`) exigem opt-in do operador via `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração. Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
    </Warning>

    `deleteSession(...)` pode excluir sessões criadas pelo mesmo plugin por meio de `api.runtime.subagent.run(...)`. Excluir sessões arbitrárias de usuário ou operador ainda exige uma requisição ao Gateway com escopo de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste nós conectados e invoque um comando hospedado em nó a partir de código de plugin carregado pelo Gateway ou de comandos CLI de plugin. Use isto quando um plugin for responsável por trabalho local em um dispositivo pareado, por exemplo uma ponte de navegador ou áudio em outro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro do Gateway, este runtime é no processo. Em comandos CLI de plugin, ele chama o Gateway configurado por RPC, então comandos como `openclaw googlemeet recover-tab` podem inspecionar nós pareados pelo terminal. Comandos de Node ainda passam pelo pareamento normal de nós do Gateway, listas de permissão de comandos, políticas node-invoke do plugin e tratamento de comandos locais do nó.

    Plugins que expõem comandos perigosos hospedados em nó devem registrar uma política node-invoke com `api.registerNodeInvokePolicy(...)`. A política roda no Gateway depois das verificações de lista de permissão de comandos e antes de o comando ser encaminhado ao nó, então chamadas diretas de `node.invoke` e ferramentas de plugin de nível mais alto compartilham o mesmo caminho de aplicação.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincule um runtime de TaskFlow a uma chave de sessão OpenClaw existente ou a um contexto de ferramenta confiável, então crie e gerencie TaskFlows sem passar um proprietário em cada chamada.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Use `bindSession({ sessionKey, requesterOrigin })` quando você já tiver uma chave de sessão OpenClaw confiável da sua própria camada de vinculação. Não vincule a partir de entrada bruta do usuário.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Síntese de texto em fala.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Usa a configuração central `messages.tts` e a seleção de provedor. Retorna buffer de áudio PCM + taxa de amostragem.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Análise de imagem, áudio e vídeo.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Geração de imagem.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Pesquisa na web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilitários de mídia de baixo nível.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Snapshot da configuração de runtime atual e escritas transacionais de configuração. Prefira
    a configuração que já foi passada para o caminho de chamada ativo; use
    `current()` apenas quando o manipulador precisar diretamente do snapshot do processo.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` e `replaceConfigFile(...)` retornam um valor `followUp`,
    por exemplo `{ mode: "restart", requiresRestart: true, reason }`,
    que registra a intenção do escritor sem tirar o controle de reinicialização do
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitários no nível do sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Assinaturas de eventos.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Logs.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolução de autenticação de modelo e provedor.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolução de diretório de estado e armazenamento chaveado baseado em SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Armazenamentos chaveados sobrevivem a reinicializações e são isolados pelo ID do Plugin vinculado ao runtime. Use `registerIfAbsent(...)` para reivindicações atômicas de desduplicação: ele retorna `true` quando a chave estava ausente ou expirada e foi registrada, ou `false` quando um valor ativo já existe sem sobrescrever seu valor, horário de criação ou TTL. Limites: `maxEntries` por namespace, 1.000 linhas ativas por Plugin, valores JSON abaixo de 64 KB e expiração TTL opcional.

    <Warning>
    Apenas Plugins agrupados nesta versão.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fábricas de ferramentas de memória e CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helpers de runtime específicos do canal (disponíveis quando um Plugin de canal é carregado).

    `api.runtime.channel.mentions` é a superfície compartilhada de política de menções de entrada para Plugins de canal agrupados que usam injeção de runtime:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Helpers de menção disponíveis:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intencionalmente não expõe os helpers de compatibilidade `resolveMentionGating*` mais antigos. Prefira o caminho normalizado `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Armazenamento de referências de runtime

Use `createPluginRuntimeStore` para armazenar a referência de runtime para uso fora do callback `register`:

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Access from other files">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Prefira `pluginId` para a identidade do runtime-store. A forma `key` de nível mais baixo é para casos incomuns em que um Plugin precisa intencionalmente de mais de um slot de runtime.
</Note>

## Outros campos `api` de nível superior

Além de `api.runtime`, o objeto API também fornece:

<ParamField path="api.id" type="string">
  ID do Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome de exibição do Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot da configuração atual (snapshot de runtime em memória ativo quando disponível).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuração específica do Plugin de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger com escopo (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolve um caminho relativo à raiz do Plugin.
</ParamField>

## Relacionado

- [Internos do Plugin](/pt-BR/plugins/architecture) — modelo de capacidades e registro
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry`
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência de subcaminhos
