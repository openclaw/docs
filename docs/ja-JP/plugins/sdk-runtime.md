---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、サブエージェント、ノード）を呼び出す必要がある
    - api.runtime が何を公開しているかを理解したい
    - Plugin コードから設定、エージェント、またはメディアヘルパーにアクセスしています
sidebarTitle: Runtime helpers
summary: api.runtime -- Pluginで利用できる注入済みランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-04-30T05:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

登録時にすべてのpluginへ注入される`api.runtime`オブジェクトのリファレンスです。ホスト内部を直接importする代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ja-JP/plugins/sdk-channel-plugins">
    channel pluginsの文脈でこれらのヘルパーを使用する手順ガイド。
  </Card>
  <Card title="Provider plugins" href="/ja-JP/plugins/sdk-provider-plugins">
    provider pluginsの文脈でこれらのヘルパーを使用する手順ガイド。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定の読み込みと書き込み

アクティブな呼び出し経路にすでに渡されている設定を優先してください。たとえば、登録時の`api.config`や、channel/providerコールバックの`cfg`引数です。これにより、ホットパスで設定を再パースするのではなく、1つのプロセススナップショットを処理全体に流せます。

`api.runtime.config.current()`は、長期間存続するハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ使用してください。返される値はreadonlyです。編集する前にcloneするか、mutationヘルパーを使用してください。

ツールファクトリは`ctx.runtimeConfig`に加えて`ctx.getRuntimeConfig()`を受け取ります。ツール定義の作成後に設定が変わる可能性がある場合は、長期間存続するツールの`execute`コールバック内でgetterを使用してください。

変更は`api.runtime.config.mutateConfigFile(...)`または`api.runtime.config.replaceConfigFile(...)`で永続化します。各書き込みでは、明示的な`afterWrite`ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }`は、gateway reload plannerに判断を任せます。
- `afterWrite: { mode: "restart", reason: "..." }`は、writerがhot reloadは安全でないと分かっている場合にクリーンなrestartを強制します。
- `afterWrite: { mode: "none", reason: "..." }`は、callerが後続処理を所有している場合にのみ、自動reload/restartを抑制します。

mutationヘルパーは`afterWrite`に加えて型付きの`followUp`サマリーを返すため、callerはrestartを要求したかどうかをログ出力またはテストできます。実際にそのrestartをいつ実行するかは、引き続きgatewayが所有します。

`api.runtime.config.loadConfig()`と`api.runtime.config.writeConfigFile(...)`は、`runtime-config-load-write`配下の非推奨の互換ヘルパーです。実行時に一度だけ警告し、migration window中は古い外部plugins向けに引き続き利用できます。bundled pluginsはこれらを使用してはいけません。plugin codeがこれらを呼び出したり、plugin SDK subpathsからこれらのヘルパーをimportしたりすると、config boundary guardsが失敗します。

直接SDKをimportする場合は、広範な`openclaw/plugin-sdk/config-runtime`互換barrelではなく、対象を絞ったconfig subpathsを使用してください。typesには`config-types`、読み込み済みconfig assertionsとplugin entry lookupには`plugin-config-runtime`、現在のプロセススナップショットには`runtime-config-snapshot`、書き込みには`config-mutation`を使用します。bundled plugin testsでは、広範な互換barrelをmockするのではなく、これらの対象を絞ったsubpathsを直接mockするべきです。

内部OpenClaw runtime codeも同じ方針です。CLI、Gateway、またはprocess boundaryでconfigを一度読み込み、その値を渡していきます。mutation書き込みが成功すると、プロセスruntimeスナップショットがrefreshされ、内部revisionが進みます。長期間存続するcacheは、configをローカルでserializeするのではなく、runtimeが所有するcache keyをキーにするべきです。長期間存続するruntime modulesには、周囲からの`loadConfig()`呼び出しを一切許容しないscannerがあります。渡された`cfg`、requestの`context.getRuntimeConfig()`、または明示的なprocess boundaryでの`getRuntimeConfig()`を使用してください。

providerとchannelの実行経路では、config readbackや編集のために返されるfile snapshotではなく、アクティブなruntime config snapshotを使用する必要があります。file snapshotは、UIと書き込みのためにSecretRef markersなどのsource valuesを保持します。provider callbacksには、解決済みのruntime viewが必要です。ヘルパーがアクティブなsource snapshotまたはアクティブなruntime snapshotのどちらでも呼び出される可能性がある場合は、credentialsを読み取る前に`selectApplicableRuntimeConfig()`を経由してください。

## Runtime namespsaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    agent identity、directories、session management。

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

    `runEmbeddedAgent(...)`は、plugin codeから通常のOpenClaw agent turnを開始するための中立的なヘルパーです。channel-triggered repliesと同じprovider/model解決およびagent-harness選択を使用します。

    `runEmbeddedPiAgent(...)`は互換aliasとして残っています。

    `resolveThinkingPolicy(...)`は、provider/modelが対応するthinking levelsと任意のdefaultを返します。Provider pluginsはthinking hooksを通じてmodel-specific profileを所有するため、tool pluginsはprovider listsをimportまたは複製する代わりに、このruntime helperを呼び出すべきです。

    `normalizeThinkingLevel(...)`は、`on`、`x-high`、`extra high`などのuser textを、解決済みpolicyに照合する前にcanonical stored levelへ変換します。

    **Session store helpers**は`api.runtime.agent.session`配下にあります。

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    default modelとprovider constants:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    background subagent runsを起動して管理します。

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
    model overrides（`provider`/`model`）には、configの`plugins.entries.<id>.subagent.allowModelOverride: true`によるoperator opt-inが必要です。信頼されていないpluginsもsubagentsを実行できますが、override requestsは拒否されます。
    </Warning>

    `deleteSession(...)`は、同じpluginが`api.runtime.subagent.run(...)`を通じて作成したsessionsを削除できます。任意のuser sessionsまたはoperator sessionsを削除するには、引き続きadmin-scoped Gateway requestが必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    接続済みnodesを一覧表示し、Gateway-loaded plugin codeまたはplugin CLI commandsからnode-host commandを呼び出します。pluginがpaired device上のlocal workを所有している場合に使用してください。たとえば、別のMac上のbrowserやaudio bridgeです。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway内部では、このruntimeはin-processです。plugin CLI commandsでは、設定済みGatewayをRPC経由で呼び出すため、`openclaw googlemeet recover-tab`などのcommandsでterminalからpaired nodesを検査できます。Node commandsは引き続き、通常のGateway node pairing、command allowlists、plugin node-invoke policies、node-local command handlingを通ります。

    危険なnode-host commandsを公開するpluginsは、`api.registerNodeInvokePolicy(...)`でnode-invoke policyを登録するべきです。このpolicyはGateway内で、command allowlist checksの後、commandがnodeへ転送される前に実行されます。そのため、直接の`node.invoke`呼び出しと高レベルのplugin toolsは同じenforcement pathを共有します。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow runtimeを既存のOpenClaw session keyまたはtrusted tool contextにbindし、すべての呼び出しでownerを渡さずにTask Flowsを作成・管理します。

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

    独自のbinding layerからtrusted OpenClaw session keyをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })`を使用してください。raw user inputからbindしてはいけません。

  </Accordion>
  <Accordion title="api.runtime.tts">
    text-to-speech synthesis。

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

    core `messages.tts` configurationとprovider selectionを使用します。PCM audio buffer + sample rateを返します。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    image、audio、video analysis。

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

    出力が生成されない場合（例: 入力がスキップされた場合）は `{ text: undefined }` を返します。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換性エイリアスとして残っています。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    画像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web 検索。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    低レベルのメディアユーティリティ。

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
    現在のランタイム設定スナップショットと、トランザクション形式の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先してください。ハンドラーがプロセスのスナップショットを直接必要とする場合にのみ `current()` を使用します。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値を返します。たとえば `{ mode: "restart", requiresRestart: true, reason }` です。これは、Gateway から再起動の制御を奪わずに、書き込み側の意図を記録します。

  </Accordion>
  <Accordion title="api.runtime.system">
    システムレベルのユーティリティ。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    イベントサブスクリプション。

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
    ロギング。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    モデルとプロバイダーの認証解決。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状態ディレクトリの解決と、SQLite に基づくキー付きストレージ。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    キー付きストアは再起動後も保持され、runtime にバインドされた Plugin id によって分離されます。制限: 名前空間ごとの `maxEntries`、Plugin ごとに 1,000 件のライブ行、64KB 未満の JSON 値、および任意の TTL 期限切れ。

    <Warning>
    このリリースではバンドルされた Plugin のみです。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    メモリーツールファクトリと CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    チャンネル固有の runtime ヘルパー（チャンネル Plugin が読み込まれている場合に利用可能）。

    `api.runtime.channel.mentions` は、runtime injection を使用するバンドル済みチャンネル Plugin 向けの共有インバウンドメンションポリシーサーフェスです。

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

    利用可能なメンションヘルパー:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` は、古い `resolveMentionGating*` 互換ヘルパーを意図的に公開していません。正規化された `{ facts, policy }` パスを優先してください。

  </Accordion>
</AccordionGroup>

## runtime 参照の保存

`register` コールバックの外部で runtime 参照を使用するために、`createPluginRuntimeStore` を使って保存します。

<Steps>
  <Step title="ストアを作成">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="エントリーポイントに配線">
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
  <Step title="他のファイルからアクセス">
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
runtime-store の identity には `pluginId` を優先してください。より低レベルの `key` 形式は、1 つの Plugin が意図的に複数の runtime スロットを必要とするまれなケース向けです。
</Note>

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します。

<ParamField path="api.id" type="string">
  Plugin id。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 表示名。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  現在の config スナップショット（利用可能な場合はアクティブなインメモリ runtime スナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からの Plugin 固有 config。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付き logger（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在のロードモード。`"setup-runtime"` は、full entry の前にある軽量な startup/setup ウィンドウです。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートからの相対パスを解決します。
</ParamField>

## 関連

- [Plugin 内部](/ja-JP/plugins/architecture) — capability model と registry
- [SDK エントリーポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — subpath リファレンス
