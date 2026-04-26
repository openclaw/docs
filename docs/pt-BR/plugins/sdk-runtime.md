---
read_when:
    - Você precisa chamar auxiliares do core a partir de um plugin (TTS, STT, geração de imagem, pesquisa na web, subagente, nodes)
    - Você quer entender o que `api.runtime` expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- os auxiliares de runtime injetados disponíveis para plugins
title: Auxiliares de runtime de Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referência do objeto `api.runtime` injetado em cada plugin durante o registro. Use estes auxiliares em vez de importar diretamente internos do host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/pt-BR/plugins/sdk-channel-plugins">
    Guia passo a passo que usa esses auxiliares em contexto para plugins de canal.
  </Card>
  <Card title="Plugins de provedor" href="/pt-BR/plugins/sdk-provider-plugins">
    Guia passo a passo que usa esses auxiliares em contexto para plugins de provedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespaces de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidade do agente, diretórios e gerenciamento de sessão.

    ```typescript
    // Resolve o diretório de trabalho do agente
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve o workspace do agente
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Obtém a identidade do agente
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Obtém o nível padrão de raciocínio
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // Obtém o timeout do agente
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Garante que o workspace exista
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Executa um turno de agente embutido
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

    `runEmbeddedAgent(...)` é o auxiliar neutro para iniciar um turno normal de agente OpenClaw a partir do código do plugin. Ele usa a mesma resolução de provedor/modelo e a mesma seleção de harness de agente que respostas acionadas por canal.

    `runEmbeddedPiAgent(...)` permanece como alias de compatibilidade.

    **Auxiliares do armazenamento de sessão** ficam em `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes de modelo e provedor padrão:

    ```typescript
    const model = api.runtime.agent.defaults.model; // por exemplo "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // por exemplo "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie e gerencie execuções de subagente em segundo plano.

    ```typescript
    // Inicia uma execução de subagente
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // substituição opcional
      model: "gpt-4.1-mini", // substituição opcional
      deliver: false,
    });

    // Aguarda a conclusão
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Lê mensagens da sessão
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Exclui uma sessão
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Substituições de modelo (`provider`/`model`) exigem opt-in do operador via `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração. Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste nodes conectados e invoque um comando node-host a partir de código de plugin carregado pelo Gateway ou de comandos CLI do plugin. Use isto quando um plugin é responsável por trabalho local em um dispositivo pareado, por exemplo um navegador ou bridge de áudio em outro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro do Gateway, esse runtime é in-process. Em comandos CLI do plugin, ele chama o Gateway configurado via RPC, então comandos como `openclaw googlemeet recover-tab` podem inspecionar nodes pareados a partir do terminal. Comandos de node ainda passam pelo pareamento normal de nodes do Gateway, allowlists de comando e tratamento de comando local ao node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Vincule um runtime de TaskFlow a uma chave de sessão OpenClaw existente ou a um contexto confiável de ferramenta e então crie e gerencie TaskFlows sem passar um owner em cada chamada.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

    Use `bindSession({ sessionKey, requesterOrigin })` quando você já tiver uma chave de sessão OpenClaw confiável da sua própria camada de binding. Não faça bind a partir de entrada bruta do usuário.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Síntese de texto para fala.

    ```typescript
    // TTS padrão
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // TTS otimizado para telefonia
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Lista vozes disponíveis
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
    // Descreve uma imagem
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcreve áudio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // opcional, para quando o MIME não puder ser inferido
    });

    // Descreve um vídeo
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Análise genérica de arquivo
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Carregamento e gravação de configuração.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitários no nível do sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    Logging.

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
    Resolução do diretório de estado.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

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
    Auxiliares de runtime específicos de canal (disponíveis quando um plugin de canal é carregado).

    `api.runtime.channel.mentions` é a superfície compartilhada de política de menção de entrada para plugins de canal empacotados que usam injeção de runtime:

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

    Auxiliares de menção disponíveis:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intencionalmente não expõe os auxiliares legados de compatibilidade `resolveMentionGating*`. Prefira o caminho normalizado `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Armazenando referências de runtime

Use `createPluginRuntimeStore` para armazenar a referência de runtime para uso fora do callback `register`:

<Steps>
  <Step title="Criar o armazenamento">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Conectar ao ponto de entrada">
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
  <Step title="Acessar a partir de outros arquivos">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // lança erro se não inicializado
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // retorna null se não inicializado
    }
    ```

  </Step>
</Steps>

<Note>
Prefira `pluginId` para a identidade do runtime-store. A forma de nível mais baixo `key` é para casos incomuns em que um plugin intencionalmente precisa de mais de um slot de runtime.
</Note>

## Outros campos de nível superior de `api`

Além de `api.runtime`, o objeto da API também fornece:

<ParamField path="api.id" type="string">
  Id do plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome de exibição do plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot atual da configuração (snapshot ativo do runtime em memória quando disponível).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuração específica do plugin em `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger com escopo (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolve um caminho relativo à raiz do plugin.
</ParamField>

## Relacionados

- [Internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidades e registro
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry`
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência de subcaminhos
