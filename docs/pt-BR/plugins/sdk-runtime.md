---
read_when:
    - Você precisa chamar auxiliares do núcleo a partir de um Plugin (TTS, STT, geração de imagens, pesquisa na web, subagente, nós)
    - Você quer entender o que api.runtime expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- os auxiliares de tempo de execução injetados disponíveis para plugins
title: Auxiliares de runtime de Plugin
x-i18n:
    generated_at: "2026-07-04T20:28:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referência para o objeto `api.runtime` injetado em cada plugin durante o registro. Use estes auxiliares em vez de importar diretamente componentes internos do host.

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

Prefira a configuração que já foi passada para o caminho de chamada ativo, por exemplo `api.config` durante o registro ou um argumento `cfg` em callbacks de canal/provedor. Isso mantém um único snapshot de processo fluindo pelo trabalho em vez de reanalisar a configuração em caminhos críticos.

Use `api.runtime.config.current()` somente quando um manipulador de longa duração precisar do snapshot atual do processo e nenhuma configuração tiver sido passada para essa função. O valor retornado é somente leitura; clone-o ou use um auxiliar de mutação antes de editar.

Fábricas de ferramentas recebem `ctx.runtimeConfig` mais `ctx.getRuntimeConfig()`. Use o getter dentro do callback `execute` de uma ferramenta de longa duração quando a configuração puder mudar depois que a definição da ferramenta tiver sido criada.

Persista alterações com `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Cada gravação deve escolher uma política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` deixa o planejador de recarregamento do gateway decidir.
- `afterWrite: { mode: "restart", reason: "..." }` força uma reinicialização limpa quando o gravador sabe que o recarregamento a quente não é seguro.
- `afterWrite: { mode: "none", reason: "..." }` suprime recarregamento/reinicialização automáticos somente quando o chamador é responsável pelo acompanhamento.

Os auxiliares de mutação retornam `afterWrite` mais um resumo tipado `followUp`, para que os chamadores possam registrar ou testar se solicitaram uma reinicialização. O gateway ainda controla quando essa reinicialização realmente acontece.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` são auxiliares de compatibilidade obsoletos em `runtime-config-load-write`. Eles emitem um aviso uma vez em runtime e permanecem disponíveis para plugins externos antigos durante a janela de migração. Plugins incluídos não devem usá-los; as proteções de limite de configuração falham se o código do plugin chamá-los ou importar esses auxiliares de subcaminhos do SDK de plugins.

Para importações diretas do SDK, use os subcaminhos de configuração focados em vez do barril amplo de compatibilidade
`openclaw/plugin-sdk/config-runtime`: `config-contracts` para
tipos, `plugin-config-runtime` para asserções de configuração já carregada e busca de
entrada de plugin, `runtime-config-snapshot` para snapshots atuais do processo e
`config-mutation` para gravações. Testes de plugins incluídos devem simular esses subcaminhos focados
diretamente em vez de simular o barril amplo de compatibilidade.

O código de runtime interno do OpenClaw segue a mesma direção: carregue a configuração uma vez no limite da CLI, do gateway ou do processo e então passe esse valor adiante. Gravações de mutação bem-sucedidas atualizam o snapshot de runtime do processo e avançam sua revisão interna; caches de longa duração devem usar a chave de cache pertencente ao runtime em vez de serializar a configuração localmente. Módulos de runtime de longa duração têm um scanner de tolerância zero para chamadas ambientes a `loadConfig()`; use um `cfg` passado, um `context.getRuntimeConfig()` de requisição ou `getRuntimeConfig()` em um limite explícito de processo.

Caminhos de execução de provedores e canais devem usar o snapshot de configuração de runtime ativo, não um snapshot de arquivo retornado para releitura ou edição de configuração. Snapshots de arquivo preservam valores de origem, como marcadores SecretRef para UI e gravações; callbacks de provedor precisam da visão de runtime resolvida. Quando um auxiliar puder ser chamado com o snapshot de origem ativo ou o snapshot de runtime ativo, roteie por `selectApplicableRuntimeConfig()` antes de ler credenciais.

## Utilitários de runtime reutilizáveis

Use fatos `botLoopProtection` de entrada para mensagens de entrada criadas por bot. O núcleo aplica a proteção compartilhada de janela deslizante em memória antes do registro de sessão e do despacho, sem vincular a política a um único canal. A proteção rastreia chaves `(scopeId, conversationId, participant pair)`, conta as duas direções de um par em conjunto, aplica um período de espera quando o orçamento da janela é excedido e remove entradas inativas de forma oportunista.

Plugins de canal que expõem esse comportamento a operadores devem preferir a forma compartilhada `channels.defaults.botLoopProtection` para orçamentos básicos e então aplicar substituições específicas de canal/provedor por cima. A configuração compartilhada usa segundos porque é voltada ao usuário:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Passe fatos normalizados de par de bots com o turno resolvido. O núcleo resolve padrões, conversão de unidades e semântica de `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Use `openclaw/plugin-sdk/pair-loop-guard-runtime` diretamente somente para loops de eventos
personalizados entre duas partes que não passam pelo executor compartilhado de respostas de entrada.

## Namespaces de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidade, diretórios e gerenciamento de sessão do agente.

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` é o auxiliar neutro para iniciar um turno normal de agente do OpenClaw a partir do código de plugin. Ele usa a mesma resolução de provedor/modelo e seleção de harness de agente que as respostas acionadas por canal.

    `runEmbeddedPiAgent(...)` permanece como um alias de compatibilidade obsoleto para plugins existentes. Código novo deve usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` retorna os níveis de raciocínio compatíveis do provedor/modelo e o padrão opcional. Plugins de provedor são responsáveis pelo perfil específico do modelo por meio de seus hooks de raciocínio, portanto plugins de ferramenta devem chamar este auxiliar de runtime em vez de importar ou duplicar listas de provedores.

    `normalizeThinkingLevel(...)` converte texto de usuário, como `on`, `x-high` ou `extra high`, para o nível armazenado canônico antes de verificá-lo contra a política resolvida.

    **Auxiliares do armazenamento de sessão** ficam em `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Prefira `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para fluxos de trabalho de sessão. Esses auxiliares endereçam sessões por identidade de agente/sessão para que plugins não dependam da forma legada de armazenamento `sessions.json`. Use `preserveActivity: true` para patches somente de metadados que não devem atualizar a atividade da sessão, e `replaceEntry: true` somente quando o callback retornar uma entrada completa e campos excluídos precisarem permanecer excluídos.

    Use `runWithWorkAdmission(...)` quando um plugin inicia trabalho em uma sessão persistida. O callback rejeita sessões arquivadas ou substituídas concorrentemente, mantém mutações de arquivamento/redefinição/exclusão coordenadas até a conclusão e recebe um `AbortSignal` que deve ser encaminhado para a execução do agente.

    Para leituras e gravações de transcrição, importe `openclaw/plugin-sdk/session-transcript-runtime` e use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` ou `withSessionTranscriptWriteLock(...)` com `{ agentId, sessionKey, sessionId }`. Essas APIs permitem que plugins identifiquem uma transcrição, leiam seus eventos, anexem mensagens, publiquem atualizações e executem operações relacionadas sob o mesmo bloqueio de gravação de transcrição. Passar `sessionFile`, usar `resolveSessionTranscriptLegacyFileTarget(...)` ou importar `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` de baixo nível de `openclaw/plugin-sdk/agent-harness-runtime` está obsoleto; esses caminhos existem apenas para código legado que já recebe um artefato de transcrição ativo.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` e `resolveAndPersistSessionFile(...)` são auxiliares de compatibilidade obsoletos para plugins que ainda dependem intencionalmente da forma legada de armazenamento completo ou arquivo de transcrição. Código novo de plugin não deve usar esses auxiliares, e chamadores existentes devem migrar para auxiliares de entrada e auxiliares de identidade de transcrição.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes padrão de modelo e provedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Execute uma conclusão de texto pertencente ao host sem importar componentes internos de provedor nem
    duplicar a preparação de modelo/autenticação/URL base do OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    O auxiliar usa o mesmo caminho de preparação de conclusão simples do runtime
    integrado do OpenClaw e o snapshot de configuração de runtime pertencente ao host. Mecanismos de contexto
    recebem uma capacidade `llm.complete` vinculada à sessão, então chamadas de modelo usam o
    agente da sessão ativa e não recorrem silenciosamente ao agente padrão. O
    resultado inclui atribuição de provedor/modelo/agente mais uso normalizado de tokens,
    cache e custo estimado quando disponível.

    <Warning>
    Substituições de modelo exigem adesão explícita do operador via `plugins.entries.<id>.llm.allowModelOverride: true` na configuração. Use `plugins.entries.<id>.llm.allowedModels` para restringir plugins confiáveis a destinos canônicos `provider/model` específicos. Conclusões entre agentes exigem `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

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
    Substituições de modelo (`provider`/`model`) exigem adesão explícita do operador via `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração. Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
    </Warning>

    `deleteSession(...)` pode excluir sessões criadas pelo mesmo plugin por meio de `api.runtime.subagent.run(...)`. Excluir sessões arbitrárias de usuário ou operador ainda exige uma solicitação ao Gateway com escopo de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste nós conectados e invoque um comando hospedado em nó a partir de código de plugin carregado pelo Gateway ou de comandos de CLI do plugin. Use isto quando um plugin for proprietário de trabalho local em um dispositivo pareado, por exemplo uma ponte de navegador ou áudio em outro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro do Gateway, este runtime é no processo. Em comandos de CLI do plugin, ele chama o Gateway configurado por RPC, então comandos como `openclaw googlemeet recover-tab` podem inspecionar nós pareados a partir do terminal. Comandos de Node ainda passam pelo pareamento normal de nós do Gateway, listas de permissões de comandos, políticas de invocação de nó do plugin e tratamento de comandos locais ao nó.

    Plugins que expõem comandos perigosos hospedados em nó devem registrar uma política de invocação de nó com `api.registerNodeInvokePolicy(...)`. A política é executada no Gateway após verificações da lista de permissões de comandos e antes de o comando ser encaminhado ao nó, então chamadas diretas de `node.invoke` e ferramentas de plugin de nível mais alto compartilham o mesmo caminho de imposição.

    <Warning>
    O campo opcional `scopes` solicita escopos de operador do Gateway para a invocação. O OpenClaw o respeita apenas para plugins integrados e instalações confiáveis de plugins oficiais; solicitações de outros plugins não elevam a chamada. Use-o apenas quando um plugin confiável precisar invocar um comando de nó com um escopo de Gateway mais estrito, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincule um runtime de Task Flow a uma chave de sessão existente do OpenClaw ou a um contexto de ferramenta confiável e, em seguida, crie e gerencie Task Flows sem passar um proprietário em cada chamada.

    O Task Flow rastreia estado durável de workflow em várias etapas. Ele não é um agendador:
    use Cron ou `api.session.workflow.scheduleSessionTurn(...)` para futuros
    despertares e, em seguida, use `managedFlows` a partir do turno agendado quando esse trabalho
    precisar de estado de fluxo, tarefas filhas, esperas ou cancelamento.

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

    Use `bindSession({ sessionKey, requesterOrigin })` quando você já tiver uma chave de sessão confiável do OpenClaw da sua própria camada de vinculação. Não vincule a partir de entrada bruta do usuário.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Síntese de texto para fala.

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

    Usa a configuração principal `messages.tts` e seleção de provedor. Retorna buffer de áudio PCM + taxa de amostragem.

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

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Geração de imagens.

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
    Snapshot atual da configuração de runtime e gravações transacionais de configuração. Prefira
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
    gateway.

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

    `runCommandWithTimeout(...)` retorna `stdout` e `stderr` capturados, contagens opcionais
    de truncamento, `code`, `signal`, `killed`, `termination` e
    `noOutputTimedOut`. Resultados de timeout e timeout sem saída relatam `code: 124`
    quando o processo filho não fornece um código de saída diferente de zero. Saídas por sinal
    sem timeout ainda podem retornar `code: null`, então use `termination` e
    `noOutputTimedOut` para distinguir motivos de timeout.

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
    Registro em log.

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
    Resolução do diretório de estado e armazenamento chaveado com suporte em SQLite.

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

    Armazenamentos chaveados sobrevivem a reinicializações e são isolados pelo id do plugin vinculado ao runtime. Use `registerIfAbsent(...)` para reivindicações atômicas de deduplicação: ele retorna `true` quando a chave estava ausente ou expirada e foi registrada, ou `false` quando um valor ativo já existe sem sobrescrever seu valor, horário de criação ou TTL. Limites: `maxEntries` por namespace, 6.000 linhas ativas por plugin, valores JSON abaixo de 64 KB e expiração TTL opcional. Quando uma gravação excederia o limite de linhas do plugin, o runtime pode remover as linhas ativas mais antigas do namespace em gravação; namespaces irmãos não são removidos nessa gravação, e a gravação ainda falha se o namespace não puder liberar linhas suficientes.

    <Warning>
    Apenas plugins empacotados nesta versão.
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
    Auxiliares de runtime específicos de canal (disponíveis quando um plugin de canal é carregado).

    `api.runtime.channel.media` é a superfície preferida para downloads e armazenamento de mídia de canal:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` quando uma URL remota deve se tornar mídia do OpenClaw. Use `saveResponseMedia(...)` quando o plugin já buscou uma `Response` com autenticação, redirecionamento ou tratamento de lista de permissões próprios do plugin. Use `readRemoteMediaBuffer(...)` somente quando o plugin precisar de bytes brutos para inspeção, transformações, descriptografia ou reenvio. `fetchRemoteMedia(...)` permanece como um alias de compatibilidade obsoleto para `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` é a superfície compartilhada de política de menções de entrada para plugins de canal empacotados que usam injeção de runtime:

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

    `api.runtime.channel.mentions` intencionalmente não expõe os auxiliares de compatibilidade `resolveMentionGating*` mais antigos. Prefira o caminho normalizado `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Armazenamento de referências de runtime

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
  <Step title="Acessar de outros arquivos">
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
Prefira `pluginId` para a identidade do armazenamento de runtime. A forma de nível mais baixo `key` é para casos incomuns em que um plugin precisa intencionalmente de mais de um slot de runtime.
</Note>

## Outros campos `api` de nível superior

Além de `api.runtime`, o objeto de API também fornece:

<ParamField path="api.id" type="string">
  Id do plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome de exibição do plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot da configuração atual (snapshot de runtime ativo em memória quando disponível).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuração específica do plugin de `plugins.entries.<id>.config`.
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

## Relacionado

- [Elementos internos do plugin](/pt-BR/plugins/architecture) — modelo de capacidades e registro
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry`
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência de subcaminhos
