---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、サブエージェント、ノード）を呼び出す必要がある
    - api.runtime が何を公開しているかを理解したい場合
    - Plugin コードから config、agent、または media ヘルパーにアクセスしています
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin で利用できる注入済みランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-05-10T19:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

`api.runtime` オブジェクトのリファレンスです。このオブジェクトは、登録時にすべての plugin に注入されます。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

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

アクティブな呼び出し経路にすでに渡されている設定を優先してください。たとえば、登録時の `api.config` や、チャネル/プロバイダーのコールバックにある `cfg` 引数です。これにより、ホットパスで設定を再パースするのではなく、1つのプロセススナップショットを作業全体に流せます。

長期間存続するハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ、`api.runtime.config.current()` を使用してください。返される値は読み取り専用です。編集する前にクローンするか、ミューテーションヘルパーを使用してください。

ツールファクトリは `ctx.runtimeConfig` と `ctx.getRuntimeConfig()` を受け取ります。ツール定義が作成された後に設定が変わる可能性がある場合は、長期間存続するツールの `execute` コールバック内で getter を使用してください。

変更は `api.runtime.config.mutateConfigFile(...)` または `api.runtime.config.replaceConfigFile(...)` で永続化します。各書き込みでは、明示的な `afterWrite` ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }` は、gateway のリロードプランナーに判断を委ねます。
- `afterWrite: { mode: "restart", reason: "..." }` は、書き込み側がホットリロードは安全でないと分かっている場合に、クリーンな再起動を強制します。
- `afterWrite: { mode: "none", reason: "..." }` は、呼び出し元が後続処理を所有している場合にのみ、自動リロード/再起動を抑制します。

ミューテーションヘルパーは `afterWrite` と型付きの `followUp` サマリーを返すため、呼び出し元は再起動を要求したかどうかをログ出力またはテストできます。その再起動が実際にいつ行われるかは、引き続き gateway が所有します。

`api.runtime.config.loadConfig()` と `api.runtime.config.writeConfigFile(...)` は、`runtime-config-load-write` 配下の非推奨の互換性ヘルパーです。これらは実行時に一度だけ警告し、移行期間中は古い外部 plugin のために引き続き利用できます。バンドル plugin はこれらを使用してはなりません。plugin コードがこれらを呼び出したり、plugin SDK サブパスからこれらのヘルパーをインポートしたりすると、設定境界ガードが失敗します。

直接 SDK インポートを行う場合は、幅広い
`openclaw/plugin-sdk/config-runtime` 互換性バレルの代わりに、焦点を絞った設定サブパスを使用してください。型には `config-contracts`、読み込み済み設定のアサーションと plugin エントリ検索には `plugin-config-runtime`、現在のプロセススナップショットには `runtime-config-snapshot`、書き込みには `config-mutation` を使用します。バンドル plugin テストでは、幅広い互換性バレルをモックする代わりに、これらの焦点を絞ったサブパスを直接モックしてください。

内部 OpenClaw ランタイムコードでも方針は同じです。CLI、gateway、またはプロセス境界で設定を一度読み込み、その値を渡していきます。ミューテーションの書き込みに成功すると、プロセスランタイムスナップショットが更新され、その内部リビジョンが進みます。長期間存続するキャッシュは、設定をローカルでシリアライズする代わりに、ランタイムが所有するキャッシュキーを基準にする必要があります。長期間存続するランタイムモジュールには、周囲からの `loadConfig()` 呼び出しを許容しないスキャナーがあります。渡された `cfg`、リクエストの `context.getRuntimeConfig()`、または明示的なプロセス境界での `getRuntimeConfig()` を使用してください。

プロバイダーとチャネルの実行経路では、設定の読み戻しや編集のために返されたファイルスナップショットではなく、アクティブなランタイム設定スナップショットを使用する必要があります。ファイルスナップショットは、UI と書き込みのために SecretRef マーカーなどのソース値を保持します。プロバイダーコールバックには、解決済みのランタイムビューが必要です。ヘルパーがアクティブなソーススナップショットまたはアクティブなランタイムスナップショットのどちらでも呼び出される可能性がある場合は、認証情報を読む前に `selectApplicableRuntimeConfig()` を通してください。

## ランタイム名前空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    エージェント ID、ディレクトリ、セッション管理。

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

    `runEmbeddedAgent(...)` は、plugin コードから通常の OpenClaw エージェントターンを開始するための中立的なヘルパーです。チャネルによってトリガーされる返信と同じプロバイダー/モデル解決とエージェントハーネス選択を使用します。

    `runEmbeddedPiAgent(...)` は互換性エイリアスとして残っています。

    `resolveThinkingPolicy(...)` は、プロバイダー/モデルがサポートする thinking レベルと任意のデフォルトを返します。プロバイダー plugin は thinking フックを通じてモデル固有のプロファイルを所有するため、ツール plugin はプロバイダー一覧をインポートまたは複製する代わりに、このランタイムヘルパーを呼び出す必要があります。

    `normalizeThinkingLevel(...)` は、`on`、`x-high`、`extra high` などのユーザーテキストを、解決済みポリシーと照合する前に、正規の保存レベルに変換します。

    **セッションストアヘルパー**は `api.runtime.agent.session` 配下にあります。

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    ランタイム書き込みには `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。これらは Gateway が所有するセッションストアライターを経由し、並行更新を保持し、ホットキャッシュを再利用します。`saveSessionStore(...)` は互換性とオフライン保守形式の書き換えのために引き続き利用できます。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    デフォルトのモデルとプロバイダー定数:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    プロバイダー内部をインポートしたり、OpenClaw のモデル/認証/base URL 準備を複製したりせずに、ホスト所有のテキスト補完を実行します。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    このヘルパーは、OpenClaw の組み込みランタイムと同じシンプル補完の準備経路、およびホスト所有のランタイム設定スナップショットを使用します。コンテキストエンジンは、セッションに束縛された `llm.complete` capability を受け取るため、モデル呼び出しはアクティブセッションのエージェントを使用し、デフォルトエージェントへ暗黙にフォールバックしません。結果には、プロバイダー/モデル/エージェントの帰属情報に加えて、利用可能な場合は正規化されたトークン、キャッシュ、推定コストの使用量が含まれます。

    <Warning>
    モデルオーバーライドには、設定で `plugins.entries.<id>.llm.allowModelOverride: true` を指定してオペレーターがオプトインする必要があります。信頼済み plugin を特定の正規 `provider/model` ターゲットに制限するには、`plugins.entries.<id>.llm.allowedModels` を使用してください。エージェントをまたぐ補完には `plugins.entries.<id>.llm.allowAgentIdOverride: true` が必要です。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    バックグラウンドのサブエージェント実行を起動および管理します。

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
    モデルオーバーライド（`provider`/`model`）には、設定で `plugins.entries.<id>.subagent.allowModelOverride: true` を指定してオペレーターがオプトインする必要があります。信頼されていない plugin でもサブエージェントを実行できますが、オーバーライド要求は拒否されます。
    </Warning>

    `deleteSession(...)` は、同じ plugin が `api.runtime.subagent.run(...)` を通じて作成したセッションを削除できます。任意のユーザーまたはオペレーターのセッションを削除するには、引き続き管理者スコープの Gateway リクエストが必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway に読み込まれた plugin コード、または plugin CLI コマンドから、接続済みノードを一覧表示し、ノードホストコマンドを呼び出します。plugin がペアリング済みデバイス上のローカル作業を所有する場合、たとえば別の Mac 上のブラウザーまたはオーディオブリッジを扱う場合に使用します。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 内では、このランタイムはインプロセスです。plugin CLI コマンド内では、設定済みの Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` などのコマンドはターミナルからペアリング済みノードを検査できます。ノードコマンドは引き続き、通常の Gateway ノードペアリング、コマンド許可リスト、plugin ノード呼び出しポリシー、ノードローカルのコマンド処理を通ります。

    危険なノードホストコマンドを公開する plugin は、`api.registerNodeInvokePolicy(...)` でノード呼び出しポリシーを登録する必要があります。このポリシーは、コマンド許可リストチェックの後、コマンドがノードへ転送される前に Gateway 内で実行されるため、直接の `node.invoke` 呼び出しと上位レベルの plugin ツールは同じ強制経路を共有します。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow ランタイムを既存の OpenClaw セッションキーまたは信頼済みツールコンテキストにバインドし、各呼び出しで所有者を渡さずに Task Flow を作成および管理します。

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

    独自のバインディング層から信頼済みの OpenClaw セッションキーをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使用します。生のユーザー入力からバインドしないでください。

  </Accordion>
  <Accordion title="api.runtime.tts">
    テキスト読み上げ合成。

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

    コアの `messages.tts` 設定とプロバイダー選択を使用します。PCM 音声バッファーとサンプルレートを返します。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    画像、音声、動画の解析。

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

    出力が生成されない場合（例: スキップされた入力）、`{ text: undefined }` を返します。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換エイリアスとして残っています。
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
    現在のランタイム設定スナップショットとトランザクション型の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先してください。ハンドラーがプロセススナップショットを直接必要とする場合にのみ、`current()` を使用します。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値を返します。たとえば `{ mode: "restart", requiresRestart: true, reason }` です。これは、Gateway から再起動制御を奪うことなく、書き込み側の意図を記録します。

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
    状態ディレクトリの解決と、SQLite ベースのキー付きストレージ。

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

    キー付きストアは再起動後も保持され、ランタイムにバインドされた Plugin ID ごとに分離されます。アトミックな重複排除の要求には `registerIfAbsent(...)` を使用します。キーが存在しない、または期限切れで登録された場合は `true` を返し、ライブ値がすでに存在していて、その値、作成時刻、TTL を上書きしない場合は `false` を返します。制限: 名前空間ごとの `maxEntries`、Plugin ごとに 1,000 件のライブ行、64KB 未満の JSON 値、省略可能な TTL 期限切れ。

    <Warning>
    このリリースではバンドル済み Plugin のみです。
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
    チャンネル固有のランタイムヘルパー（チャンネル Plugin が読み込まれている場合に利用可能）。

    `api.runtime.channel.mentions` は、ランタイムインジェクションを使用するバンドル済みチャンネル Plugin 向けの、共有された受信メンションポリシーサーフェスです。

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

`register` コールバックの外部で使用するために、`createPluginRuntimeStore` を使用してランタイム参照を保存します。

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
ランタイムストアの識別には `pluginId` を優先してください。低レベルの `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とするまれなケース向けです。
</Note>

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します。

<ParamField path="api.id" type="string">
  Plugin ID。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin の表示名。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  現在の設定スナップショット（利用可能な場合は、アクティブなインメモリのランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からの Plugin 固有の設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付きロガー（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード。`"setup-runtime"` は、完全なエントリの前に実行される軽量な起動/セットアップウィンドウです。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートからの相対パスを解決します。
</ParamField>

## 関連

- [Plugin 内部](/ja-JP/plugins/architecture) — capability モデルとレジストリ
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスリファレンス
