---
read_when:
    - Você precisa chamar auxiliares centrais a partir de um plugin (TTS, STT, geração de imagens, pesquisa na web, subagente, nós)
    - Você quer entender o que api.runtime expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- os auxiliares de tempo de execução injetados disponíveis para plugins
title: Auxiliares de runtime de Plugin
x-i18n:
    generated_at: "2026-06-30T13:54:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referência para o objeto `api.runtime` injetado em cada plugin durante o registro. Use estes auxiliares em vez de importar internos do host diretamente.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/pt-BR/plugins/sdk-channel-plugins">
    Guia passo a passo que usa estes auxiliares em contexto para plugins de canal.
  </Card>
  <Card title="Provider plugins" href="/pt-BR/plugins/sdk-provider-plugins">
    Guia passo a passo que usa estes auxiliares em contexto para plugins de provedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Carregamento e gravações de configuração

Prefira a configuração que já foi passada para o caminho de chamada ativo, por exemplo `api.config` durante o registro ou um argumento `cfg` em callbacks de canal/provedor. Isso mantém um snapshot de processo fluindo pelo trabalho em vez de reanalisar a configuração em caminhos críticos.

Use `api.runtime.config.current()` somente quando um handler de longa duração precisar do snapshot atual do processo e nenhuma configuração tiver sido passada para essa função. O valor retornado é somente leitura; clone ou use um auxiliar de mutação antes de editar.

Fábricas de ferramentas recebem `ctx.runtimeConfig` mais `ctx.getRuntimeConfig()`. Use o getter dentro do callback `execute` de uma ferramenta de longa duração quando a configuração puder mudar depois que a definição da ferramenta tiver sido criada.

Persista alterações com `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Cada gravação deve escolher uma política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` deixa o planejador de recarregamento do gateway decidir.
- `afterWrite: { mode: "restart", reason: "..." }` força uma reinicialização limpa quando o gravador sabe que o recarregamento a quente não é seguro.
- `afterWrite: { mode: "none", reason: "..." }` suprime recarregamento/reinicialização automáticos somente quando o chamador é dono do acompanhamento.

Os auxiliares de mutação retornam `afterWrite` mais um resumo `followUp` tipado para que os chamadores possam registrar ou testar se solicitaram uma reinicialização. O gateway ainda é dono de quando essa reinicialização realmente acontece.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` são auxiliares de compatibilidade obsoletos em `runtime-config-load-write`. Eles avisam uma vez em tempo de execução e permanecem disponíveis para plugins externos antigos durante a janela de migração. Plugins incluídos não devem usá-los; os guardas do limite de configuração falham se o código do plugin os chama ou importa esses auxiliares de subcaminhos do SDK de plugin.

Para importações diretas do SDK, use os subcaminhos de configuração focados em vez do barrel amplo de compatibilidade
`openclaw/plugin-sdk/config-runtime`: `config-contracts` para
tipos, `plugin-config-runtime` para asserções de configuração já carregada e busca de
entrada de plugin, `runtime-config-snapshot` para snapshots do processo atual e
`config-mutation` para gravações. Testes de plugins incluídos devem simular esses subcaminhos focados
diretamente em vez de simular o barrel amplo de compatibilidade.

O código interno de runtime do OpenClaw segue a mesma direção: carregue a configuração uma vez no limite da CLI, do gateway ou do processo, depois passe esse valor adiante. Gravações de mutação bem-sucedidas atualizam o snapshot de runtime do processo e avançam sua revisão interna; caches de longa duração devem usar como chave a chave de cache pertencente ao runtime em vez de serializar a configuração localmente. Módulos de runtime de longa duração têm um scanner de tolerância zero para chamadas ambientes de `loadConfig()`; use um `cfg` passado, um `context.getRuntimeConfig()` da solicitação ou `getRuntimeConfig()` em um limite de processo explícito.

Caminhos de execução de provedor e canal devem usar o snapshot de configuração de runtime ativo, não um snapshot de arquivo retornado para releitura ou edição de configuração. Snapshots de arquivo preservam valores de origem, como marcadores SecretRef, para UI e gravações; callbacks de provedor precisam da visão de runtime resolvida. Quando um auxiliar puder ser chamado com o snapshot de origem ativo ou o snapshot de runtime ativo, roteie por `selectApplicableRuntimeConfig()` antes de ler credenciais.

## Utilitários de runtime reutilizáveis

Use fatos `botLoopProtection` de entrada para mensagens de entrada escritas por bots. O núcleo aplica o guarda compartilhado de janela deslizante em memória antes do registro e despacho da sessão, sem vincular a política a um canal. O guarda rastreia chaves `(scopeId, conversationId, participant pair)`, conta ambas as direções de um par em conjunto, aplica um cooldown quando o orçamento da janela é excedido e remove entradas inativas oportunisticamente.

Plugins de canal que expõem esse comportamento a operadores devem preferir o formato compartilhado `channels.defaults.botLoopProtection` para orçamentos de base e, em seguida, aplicar substituições específicas de canal/provedor por cima. A configuração compartilhada usa segundos porque é voltada ao usuário:

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
personalizados de duas partes que não passam pelo executor compartilhado de resposta de entrada.

## Namespaces de runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidade do agente, diretórios e gerenciamento de sessão.

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

    `resolveThinkingPolicy(...)` retorna os níveis de thinking compatíveis do provedor/modelo e o padrão opcional. Plugins de provedor são donos do perfil específico de modelo por meio de seus hooks de thinking, portanto plugins de ferramenta devem chamar este auxiliar de runtime em vez de importar ou duplicar listas de provedores.

    `normalizeThinkingLevel(...)` converte texto do usuário como `on`, `x-high` ou `extra high` para o nível armazenado canônico antes de verificá-lo contra a política resolvida.

    **Auxiliares de armazenamento de sessão** ficam em `api.runtime.agent.session`:

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
    ```

    Prefira `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para workflows de sessão. Esses auxiliares endereçam sessões por identidade de agente/sessão para que plugins não dependam do formato legado de armazenamento `sessions.json`. Use `preserveActivity: true` para patches apenas de metadados que não devem atualizar a atividade da sessão, e `replaceEntry: true` somente quando o callback retorna uma entrada completa e campos excluídos devem permanecer excluídos.

    Para leituras e gravações de transcrição, importe `openclaw/plugin-sdk/session-transcript-runtime` e use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` ou `withSessionTranscriptWriteLock(...)` com `{ agentId, sessionKey, sessionId }`. Essas APIs permitem que plugins identifiquem uma transcrição, leiam seus eventos, acrescentem mensagens, publiquem atualizações e executem operações relacionadas sob o mesmo bloqueio de gravação da transcrição. Passar `sessionFile`, usar `resolveSessionTranscriptLegacyFileTarget(...)` ou importar `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` de baixo nível de `openclaw/plugin-sdk/agent-harness-runtime` é obsoleto; esses caminhos existem somente para código legado que já recebe um artefato de transcrição ativo.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` e `resolveAndPersistSessionFile(...)` são auxiliares de compatibilidade obsoletos para plugins que ainda dependem intencionalmente do formato legado de armazenamento inteiro ou de arquivo de transcrição. Código novo de plugin não deve usar esses auxiliares, e chamadores existentes devem migrar para auxiliares de entrada e auxiliares de identidade de transcrição.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes padrão de modelo e provedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Execute uma conclusão de texto pertencente ao host sem importar internos de provedor ou
    duplicar a preparação de modelo/autenticação/URL base do OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    O auxiliar usa o mesmo caminho de preparação de conclusão simples que o runtime
    integrado do OpenClaw e o snapshot de configuração de runtime pertencente ao host. Mecanismos de contexto
    recebem uma capacidade `llm.complete` vinculada à sessão, então chamadas de modelo usam o
    agente da sessão ativa e não recorrem silenciosamente ao agente padrão. O
    resultado inclui atribuição de provedor/modelo/agente mais uso normalizado de tokens,
    cache e custo estimado quando disponível.

    <Warning>
    Substituições de modelo exigem opt-in do operador via `plugins.entries.<id>.llm.allowModelOverride: true` na configuração. Use `plugins.entries.<id>.llm.allowedModels` para restringir plugins confiáveis a destinos canônicos específicos `provider/model`. Conclusões entre agentes exigem `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Substituições de modelo (`provider`/`model`) exigem opt-in do operador por meio de `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração. Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
    </Warning>

    `deleteSession(...)` pode excluir sessões criadas pelo mesmo Plugin por meio de `api.runtime.subagent.run(...)`. Excluir sessões arbitrárias de usuário ou operador ainda exige uma solicitação do Gateway com escopo de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste nós conectados e invoque um comando do host do nó a partir de código de Plugin carregado pelo Gateway ou de comandos de CLI do Plugin. Use isto quando um Plugin possuir trabalho local em um dispositivo pareado, por exemplo uma ponte de navegador ou áudio em outro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Dentro do Gateway, este runtime é em processo. Em comandos de CLI do Plugin, ele chama o Gateway configurado por RPC, de modo que comandos como `openclaw googlemeet recover-tab` podem inspecionar nós pareados a partir do terminal. Comandos de nó ainda passam pelo pareamento normal de nós do Gateway, allowlists de comandos, políticas de invocação de nó do Plugin e tratamento de comandos local ao nó.

    Plugins que expõem comandos perigosos do host do nó devem registrar uma política de invocação de nó com `api.registerNodeInvokePolicy(...)`. A política é executada no Gateway após as verificações de allowlist de comandos e antes de o comando ser encaminhado ao nó, de modo que chamadas diretas a `node.invoke` e ferramentas de Plugin de nível mais alto compartilham o mesmo caminho de aplicação.

    <Warning>
    O campo opcional `scopes` solicita escopos de operador do Gateway para a invocação. O OpenClaw o honra apenas para Plugins integrados e instalações confiáveis de Plugins oficiais; solicitações de outros Plugins não elevam a chamada. Use-o somente quando um Plugin confiável precisar invocar um comando de nó com um escopo mais estrito do Gateway, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Vincule um runtime TaskFlow a uma chave de sessão existente do OpenClaw ou a um contexto de ferramenta confiável, depois crie e gerencie TaskFlows sem passar um proprietário em cada chamada.

    TaskFlow acompanha estado durável de workflows de várias etapas. Ele não é um agendador:
    use Cron ou `api.session.workflow.scheduleSessionTurn(...)` para despertares
    futuros, depois use `managedFlows` a partir do turno agendado quando esse trabalho
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
    `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Pesquisa na Web.

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
    Snapshot da configuração atual do runtime e gravações transacionais de configuração. Prefira
    a configuração que já foi passada para o caminho de chamada ativo; use
    `current()` somente quando o handler precisar diretamente do snapshot do processo.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` e `replaceConfigFile(...)` retornam um valor
    `followUp`, por exemplo `{ mode: "restart", requiresRestart: true, reason }`,
    que registra a intenção do gravador sem tirar o controle de reinicialização do
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitários de nível de sistema.

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

    `runCommandWithTimeout(...)` retorna `stdout` e `stderr` capturados, contagens
    opcionais de truncamento, `code`, `signal`, `killed`, `termination` e
    `noOutputTimedOut`. Resultados de timeout e timeout por ausência de saída relatam `code: 124`
    quando o processo filho não fornece um código de saída diferente de zero. Saídas por sinal
    sem timeout ainda podem retornar `code: null`, então use `termination` e
    `noOutputTimedOut` para distinguir os motivos de timeout.

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
    Registro de logs.

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
    Resolução de diretório de estado e armazenamento chaveado respaldado por SQLite.

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

    Stores com chave sobrevivem a reinicializações e são isolados pelo id do Plugin vinculado ao tempo de execução. Use `registerIfAbsent(...)` para reivindicações atômicas de deduplicação: ele retorna `true` quando a chave estava ausente ou expirada e foi registrada, ou `false` quando um valor ativo já existe sem sobrescrever seu valor, hora de criação ou TTL. Limites: `maxEntries` por namespace, 6.000 linhas ativas por Plugin, valores JSON abaixo de 64 KB e expiração TTL opcional. Quando uma escrita excederia o limite de linhas do Plugin, o tempo de execução pode remover as linhas ativas mais antigas do namespace em gravação; namespaces irmãos não são removidos para essa escrita, e a escrita ainda falha se o namespace não conseguir liberar linhas suficientes.

    <Warning>
    Apenas Plugins empacotados nesta versão.
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
    Auxiliares de tempo de execução específicos de canal (disponíveis quando um Plugin de canal é carregado).

    `api.runtime.channel.media` é a superfície preferida para downloads e armazenamento de mídia de canal:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` quando uma URL remota deve se tornar mídia do OpenClaw. Use `saveResponseMedia(...)` quando o Plugin já buscou uma `Response` com tratamento de autenticação, redirecionamento ou lista de permissões pertencente ao Plugin. Use `readRemoteMediaBuffer(...)` somente quando o Plugin precisar de bytes brutos para inspeção, transformações, descriptografia ou novo upload. `fetchRemoteMedia(...)` continua sendo um alias de compatibilidade obsoleto para `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` é a superfície compartilhada de política de menções de entrada para Plugins de canal empacotados que usam injeção de tempo de execução:

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

## Armazenamento de referências de tempo de execução

Use `createPluginRuntimeStore` para armazenar a referência de tempo de execução para uso fora do callback `register`:

<Steps>
  <Step title="Criar o store">
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
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Prefira `pluginId` para a identidade do runtime-store. A forma `key` de nível mais baixo é para casos incomuns em que um Plugin intencionalmente precisa de mais de um slot de tempo de execução.
</Note>

## Outros campos `api` de nível superior

Além de `api.runtime`, o objeto de API também fornece:

<ParamField path="api.id" type="string">
  Id do Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome de exibição do Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot de configuração atual (snapshot ativo em memória do tempo de execução quando disponível).
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

## Relacionados

- [Componentes internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidade e registro
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry`
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência de subcaminhos
