---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、サブエージェント、ノード）を呼び出す必要がある
    - api.runtime が公開する内容を理解したい場合
    - Plugin コードから設定、エージェント、またはメディアのヘルパーにアクセスしています
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin で利用できる注入されたランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-05-04T09:37:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c968f30052ecba4359bdaa9b1c640c1220268933ce01ccef06bcade225b50b7d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

`api.runtime` オブジェクトのリファレンスです。このオブジェクトは登録時にすべての plugin に注入されます。ホスト内部を直接 import する代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="チャネル plugin" href="/ja-JP/plugins/sdk-channel-plugins">
    チャネル plugin の文脈でこれらのヘルパーを使用する手順ガイド。
  </Card>
  <Card title="プロバイダー plugin" href="/ja-JP/plugins/sdk-provider-plugins">
    プロバイダー plugin の文脈でこれらのヘルパーを使用する手順ガイド。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定の読み込みと書き込み

アクティブな呼び出しパスにすでに渡されている設定を優先してください。たとえば、登録時の `api.config` や、チャネル/プロバイダー callback の `cfg` 引数です。これにより、ホットパスで設定を再解析するのではなく、1つのプロセススナップショットが処理全体に流れ続けます。

長時間生存する handler が現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ、`api.runtime.config.current()` を使用してください。返される値は readonly です。編集する前に clone するか、mutation ヘルパーを使用してください。

ツール factory は `ctx.runtimeConfig` と `ctx.getRuntimeConfig()` を受け取ります。ツール定義の作成後に設定が変わる可能性がある場合は、長時間生存するツールの `execute` callback 内で getter を使用してください。

変更は `api.runtime.config.mutateConfigFile(...)` または `api.runtime.config.replaceConfigFile(...)` で永続化します。各書き込みでは明示的な `afterWrite` policy を選択する必要があります。

- `afterWrite: { mode: "auto" }` は gateway reload planner に判断を委ねます。
- `afterWrite: { mode: "restart", reason: "..." }` は、書き込み側が hot reload は安全でないと分かっている場合に clean restart を強制します。
- `afterWrite: { mode: "none", reason: "..." }` は、呼び出し元が後続処理を所有している場合にのみ、自動 reload/restart を抑制します。

mutation ヘルパーは `afterWrite` と型付きの `followUp` summary を返すため、呼び出し元は restart を要求したかどうかを log または test できます。実際に restart がいつ発生するかは、引き続き gateway が所有します。

`api.runtime.config.loadConfig()` と `api.runtime.config.writeConfigFile(...)` は、`runtime-config-load-write` 配下の非推奨の互換ヘルパーです。runtime で一度だけ警告し、移行期間中は古い外部 plugin 向けに引き続き利用できます。バンドル plugin はこれらを使用してはいけません。plugin code がこれらを呼び出したり、plugin SDK subpath からこれらのヘルパーを import したりすると、設定 boundary guard が失敗します。

直接 SDK import する場合は、広範な `openclaw/plugin-sdk/config-runtime` 互換 barrel ではなく、焦点を絞った設定 subpath を使用してください。型には `config-types`、読み込み済み設定の assertion と plugin entry lookup には `plugin-config-runtime`、現在のプロセススナップショットには `runtime-config-snapshot`、書き込みには `config-mutation` を使用します。バンドル plugin の test では、広範な互換 barrel を mock するのではなく、これらの焦点を絞った subpath を直接 mock してください。

内部の OpenClaw runtime code も同じ方向性です。CLI、gateway、またはプロセス boundary で設定を一度読み込み、その値を渡していきます。mutation 書き込みが成功すると、プロセス runtime スナップショットが更新され、内部 revision が進みます。長時間生存する cache は、設定をローカルで serialize するのではなく、runtime が所有する cache key を基準にするべきです。長時間生存する runtime module には、周辺的な `loadConfig()` 呼び出しに対するゼロトレランス scanner があります。渡された `cfg`、request の `context.getRuntimeConfig()`、または明示的なプロセス boundary の `getRuntimeConfig()` を使用してください。

プロバイダーとチャネルの実行パスでは、設定の readback や編集用に返されたファイルスナップショットではなく、アクティブな runtime 設定スナップショットを使用する必要があります。ファイルスナップショットは、UI と書き込みのために SecretRef marker などのソース値を保持します。プロバイダー callback には解決済みの runtime view が必要です。ヘルパーがアクティブなソーススナップショットまたはアクティブな runtime スナップショットのどちらでも呼び出される可能性がある場合は、認証情報を読み取る前に `selectApplicableRuntimeConfig()` を経由してください。

## Runtime namespace

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent identity、directory、session 管理。

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

    `runEmbeddedAgent(...)` は、plugin code から通常の OpenClaw agent turn を開始するための中立的なヘルパーです。チャネルがトリガーした返信と同じプロバイダー/model 解決および agent-harness selection を使用します。

    `runEmbeddedPiAgent(...)` は互換 alias として残ります。

    `resolveThinkingPolicy(...)` は、プロバイダー/model がサポートする thinking level と任意の default を返します。プロバイダー plugin は thinking hook を通じて model 固有の profile を所有するため、ツール plugin はプロバイダー list を import したり重複定義したりする代わりに、この runtime ヘルパーを呼び出すべきです。

    `normalizeThinkingLevel(...)` は、`on`、`x-high`、`extra high` などのユーザーテキストを、解決済み policy と照合する前に、保存される正規 level に変換します。

    **Session store ヘルパー**は `api.runtime.agent.session` 配下にあります。

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    runtime 書き込みには `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。これらは Gateway が所有する session-store writer を経由し、並行更新を保持し、hot cache を再利用します。`saveSessionStore(...)` は互換性および offline maintenance 形式の rewrite のために引き続き利用できます。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    default model とプロバイダー定数:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    background subagent run を起動および管理します。

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
    model override (`provider`/`model`) には、設定の `plugins.entries.<id>.subagent.allowModelOverride: true` による operator の opt-in が必要です。信頼されていない plugin も subagent を実行できますが、override request は拒否されます。
    </Warning>

    `deleteSession(...)` は、同じ plugin が `api.runtime.subagent.run(...)` を通じて作成した session を削除できます。任意の user session または operator session を削除するには、引き続き admin scope の Gateway request が必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    接続済み Node を一覧表示し、Gateway が読み込んだ plugin code または plugin CLI command から node-host command を呼び出します。plugin がペアリング済み device 上の local work を所有している場合、たとえば別の Mac 上の browser や audio bridge の場合に使用します。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 内では、この runtime は in-process です。plugin CLI command では、設定済み Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` のような command は terminal からペアリング済み Node を検査できます。Node command は引き続き、通常の Gateway node pairing、command allowlist、plugin node-invoke policy、node-local command handling を経由します。

    危険な node-host command を公開する plugin は、`api.registerNodeInvokePolicy(...)` で node-invoke policy を登録するべきです。この policy は Gateway 内で command allowlist check の後、command が Node に転送される前に実行されるため、直接の `node.invoke` 呼び出しと高レベルの plugin tool は同じ enforcement path を共有します。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow runtime を既存の OpenClaw session key または信頼済み tool context に bind し、各呼び出しで owner を渡さずに Task Flow を作成および管理します。

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

    自分の binding layer から信頼済み OpenClaw session key をすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使用してください。生の user input から bind してはいけません。

  </Accordion>
  <Accordion title="api.runtime.tts">
    Text-to-speech synthesis。

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

    core の `messages.tts` configuration とプロバイダー選択を使用します。PCM audio buffer と sample rate を返します。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    画像、音声、動画の分析。

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
    `api.runtime.stt.transcribeAudioFile(...)` は `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換性エイリアスとして残っています。
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
    ウェブ検索。

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
    現在のランタイム設定スナップショットと、トランザクション方式の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先してください。ハンドラーがプロセススナップショットを直接必要とする場合にのみ `current()` を使用してください。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp`
    値（たとえば `{ mode: "restart", requiresRestart: true, reason }`）を返します。これは、Gateway から再起動制御を奪わずに書き込み側の意図を記録します。

  </Accordion>
  <Accordion title="api.runtime.system">
    システムレベルのユーティリティ。

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
    イベント購読。

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
    モデルとプロバイダー認証の解決。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状態ディレクトリの解決と、SQLite をバックエンドにしたキー付きストレージ。

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

    キー付きストアは再起動後も保持され、ランタイムに紐づいた Plugin ID で分離されます。アトミックな重複排除の獲得には `registerIfAbsent(...)` を使用してください。キーが存在しない、または期限切れで登録された場合は `true` を返し、有効な値がすでに存在する場合は、その値、作成時刻、TTL を上書きせずに `false` を返します。制限: 名前空間ごとに `maxEntries`、Plugin ごとに有効な行は 1,000 件、JSON 値は 64KB 未満、任意の TTL 有効期限。

    <Warning>
    このリリースでは同梱 Plugin のみです。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    メモリツールファクトリーと CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    チャネル固有のランタイムヘルパー（チャネル Plugin が読み込まれている場合に利用可能）。

    `api.runtime.channel.mentions` は、ランタイム注入を使用する同梱チャネル Plugin 向けの共有受信メンションポリシーサーフェスです:

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

## ランタイム参照の保存

`register` コールバックの外で使用するために、`createPluginRuntimeStore` を使ってランタイム参照を保存します:

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
  <Step title="エントリポイントに接続">
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
ランタイムストアの識別子には `pluginId` を優先してください。低レベルの `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とするまれなケース向けです。
</Note>

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します:

<ParamField path="api.id" type="string">
  Plugin ID。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 表示名。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  現在の設定スナップショット（利用可能な場合は、アクティブなメモリ内ランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` の Plugin 固有設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付きロガー（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード。`"setup-runtime"` は、完全なエントリの前にある軽量な起動/セットアップ期間です。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートを基準にパスを解決します。
</ParamField>

## 関連

- [Plugin 内部](/ja-JP/plugins/architecture) — ケイパビリティモデルとレジストリ
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスリファレンス
