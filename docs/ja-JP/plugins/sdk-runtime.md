---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、サブエージェント、ノード）を呼び出す必要がある
    - api.runtime が公開するものを理解したい
    - Plugin コードから config、agent、または media ヘルパーにアクセスしている
sidebarTitle: Runtime helpers
summary: api.runtime -- Pluginで利用できる注入済みランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-06-27T12:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

すべてのプラグインの登録時に注入される `api.runtime` オブジェクトのリファレンスです。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="チャネルプラグイン" href="/ja-JP/plugins/sdk-channel-plugins">
    チャネルプラグイン向けに、これらのヘルパーを文脈の中で使用するステップバイステップガイド。
  </Card>
  <Card title="プロバイダープラグイン" href="/ja-JP/plugins/sdk-provider-plugins">
    プロバイダープラグイン向けに、これらのヘルパーを文脈の中で使用するステップバイステップガイド。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定の読み込みと書き込み

アクティブな呼び出しパスにすでに渡されている設定を優先してください。たとえば、登録時の `api.config` や、チャネル/プロバイダーのコールバックの `cfg` 引数です。これにより、ホットパスで設定を再解析するのではなく、1つのプロセススナップショットを処理全体に流せます。

長寿命のハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ、`api.runtime.config.current()` を使用してください。返される値は読み取り専用です。編集する前にクローンするか、ミューテーションヘルパーを使用してください。

ツールファクトリは `ctx.runtimeConfig` と `ctx.getRuntimeConfig()` を受け取ります。ツール定義の作成後に設定が変更される可能性がある場合は、長寿命ツールの `execute` コールバック内でゲッターを使用してください。

変更を永続化するには、`api.runtime.config.mutateConfigFile(...)` または `api.runtime.config.replaceConfigFile(...)` を使用します。各書き込みでは明示的な `afterWrite` ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }` は、Gateway の再読み込みプランナーに判断を委ねます。
- `afterWrite: { mode: "restart", reason: "..." }` は、書き込み側がホットリロードは安全でないと判断している場合に、クリーンな再起動を強制します。
- `afterWrite: { mode: "none", reason: "..." }` は、呼び出し元が後続処理を所有している場合にのみ、自動再読み込み/再起動を抑制します。

ミューテーションヘルパーは、`afterWrite` に加えて型付きの `followUp` サマリーを返すため、呼び出し元は再起動を要求したかどうかをログ出力またはテストできます。実際にその再起動がいつ行われるかは、引き続き Gateway が所有します。

`api.runtime.config.loadConfig()` と `api.runtime.config.writeConfigFile(...)` は、`runtime-config-load-write` 配下の非推奨の互換ヘルパーです。これらは実行時に一度だけ警告し、移行期間中は古い外部プラグイン向けに利用可能なままです。バンドルプラグインはこれらを使用してはいけません。プラグインコードがこれらを呼び出すか、Plugin SDK サブパスからこれらのヘルパーをインポートすると、設定境界ガードが失敗します。

SDK を直接インポートする場合は、広範な
`openclaw/plugin-sdk/config-runtime` 互換バレルではなく、焦点を絞った設定サブパスを使用してください。型には `config-contracts`、読み込み済み設定のアサーションとプラグインエントリーの検索には `plugin-config-runtime`、現在のプロセススナップショットには `runtime-config-snapshot`、書き込みには `config-mutation` を使用します。バンドルプラグインのテストでは、広範な互換バレルをモックするのではなく、これらの焦点を絞ったサブパスを直接モックしてください。

OpenClaw の内部ランタイムコードも同じ方針です。CLI、Gateway、またはプロセス境界で設定を一度読み込み、その値を渡していきます。成功したミューテーション書き込みはプロセスランタイムスナップショットを更新し、その内部リビジョンを進めます。長寿命キャッシュは、設定をローカルでシリアライズするのではなく、ランタイムが所有するキャッシュキーを基準にするべきです。長寿命ランタイムモジュールには、周囲の `loadConfig()` 呼び出しに対するゼロトレランスのスキャナーがあります。渡された `cfg`、リクエストの `context.getRuntimeConfig()`、または明示的なプロセス境界での `getRuntimeConfig()` を使用してください。

プロバイダーとチャネルの実行パスでは、設定の読み戻しや編集用に返されたファイルスナップショットではなく、アクティブなランタイム設定スナップショットを使用する必要があります。ファイルスナップショットは、UI と書き込み用に SecretRef マーカーなどのソース値を保持します。プロバイダーコールバックには、解決済みのランタイムビューが必要です。ヘルパーがアクティブなソーススナップショットまたはアクティブなランタイムスナップショットのいずれかで呼び出される可能性がある場合は、認証情報を読み取る前に `selectApplicableRuntimeConfig()` を経由してください。

## 再利用可能なランタイムユーティリティ

ボットが作成したインバウンドメッセージには、受信した `botLoopProtection` ファクトを使用してください。Core は、ポリシーを特定のチャネルに結び付けずに、セッション記録とディスパッチの前に共有のインメモリスライディングウィンドウガードを適用します。このガードは `(scopeId, conversationId, participant pair)` キーを追跡し、ペアの両方向をまとめてカウントし、ウィンドウの予算を超えるとクールダウンを適用し、非アクティブなエントリーを機会的に刈り込みます。

この動作をオペレーターに公開するチャネルプラグインでは、ベースライン予算として共有の `channels.defaults.botLoopProtection` 形状を優先し、その上にチャネル/プロバイダー固有の上書きを重ねるべきです。共有設定はユーザー向けであるため、秒単位を使用します。

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

解決済みターンとともに、正規化済みのボットペアファクトを渡します。Core はデフォルト、単位変換、`enabled` セマンティクスを解決します。

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

共有インバウンド返信ランナーを経由しないカスタムの
二者間イベントループに限り、`openclaw/plugin-sdk/pair-loop-guard-runtime` を直接使用してください。

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

    `runEmbeddedAgent(...)` は、プラグインコードから通常の OpenClaw エージェントターンを開始するための中立的なヘルパーです。チャネルからトリガーされる返信と同じプロバイダー/モデル解決およびエージェントハーネス選択を使用します。

    `runEmbeddedPiAgent(...)` は、既存プラグイン向けの非推奨の互換エイリアスとして残っています。新しいコードでは `runEmbeddedAgent(...)` を使用してください。

    `resolveThinkingPolicy(...)` は、プロバイダー/モデルがサポートする thinking レベルと任意のデフォルトを返します。プロバイダープラグインは thinking フックを通じてモデル固有のプロファイルを所有するため、ツールプラグインはプロバイダーリストをインポートまたは重複させるのではなく、このランタイムヘルパーを呼び出すべきです。

    `normalizeThinkingLevel(...)` は、`on`、`x-high`、`extra high` などのユーザーテキストを、解決済みポリシーと照合する前に正規の保存レベルへ変換します。

    **セッションストアヘルパー** は `api.runtime.agent.session` 配下にあります。

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

    セッションワークフローには、`getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)`、または `upsertSessionEntry(...)` を優先してください。これらのヘルパーはエージェント/セッション ID でセッションを参照するため、プラグインはレガシーな `sessions.json` ストレージ形状に依存しません。セッションアクティビティを更新すべきでないメタデータのみのパッチには `preserveActivity: true` を使用し、コールバックが完全なエントリーを返し、削除済みフィールドを削除済みのままにする必要がある場合にのみ `replaceEntry: true` を使用してください。

    トランスクリプトの読み取りと書き込みには、`openclaw/plugin-sdk/session-transcript-runtime` をインポートし、`resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)`、または `withSessionTranscriptWriteLock(...)` を `{ agentId, sessionKey, sessionId }` とともに使用してください。これらの API により、プラグインはトランスクリプトを識別し、そのイベントを読み取り、メッセージを追加し、更新を公開し、同じトランスクリプト書き込みロックの下で関連操作を実行できます。すでにアクティブなトランスクリプトアーティファクトを受け取るコードを適応していて、各ヘルパーをその同じアーティファクト上で動作させる必要がある場合にのみ、`sessionFile` を渡してください。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionFilePath(...)` は、レガシーなストア全体またはトランスクリプトファイル形状にまだ意図的に依存しているプラグイン向けの互換ヘルパーです。新しいプラグインコードではこれらのヘルパーを使用してはならず、既存の呼び出し元はエントリーヘルパーへ移行するべきです。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    デフォルトのモデルおよびプロバイダー定数:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    プロバイダー内部をインポートしたり、OpenClaw のモデル/認証/base URL の準備を重複させたりせずに、ホスト所有のテキスト補完を実行します。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    このヘルパーは、OpenClaw の組み込みランタイムと同じシンプル補完準備パス、およびホスト所有のランタイム設定スナップショットを使用します。コンテキストエンジンはセッションに紐づく `llm.complete` ケイパビリティを受け取るため、モデル呼び出しはアクティブセッションのエージェントを使用し、デフォルトエージェントへ暗黙にフォールバックしません。結果には、利用可能な場合、プロバイダー/モデル/エージェントの帰属に加えて、正規化済みのトークン、キャッシュ、推定コスト使用量が含まれます。

    <Warning>
    モデル上書きには、設定の `plugins.entries.<id>.llm.allowModelOverride: true` によるオペレーターの明示的な許可が必要です。信頼済みプラグインを特定の正規 `provider/model` ターゲットに制限するには、`plugins.entries.<id>.llm.allowedModels` を使用してください。エージェントをまたぐ補完には `plugins.entries.<id>.llm.allowAgentIdOverride: true` が必要です。
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
    モデルのオーバーライド（`provider`/`model`）には、設定内の `plugins.entries.<id>.subagent.allowModelOverride: true` によるオペレーターの明示的な有効化が必要です。信頼されていない Plugin もサブエージェントを実行できますが、オーバーライド要求は拒否されます。
    </Warning>

    `deleteSession(...)` は、同じ Plugin が `api.runtime.subagent.run(...)` を通じて作成したセッションを削除できます。任意のユーザーセッションまたはオペレーターセッションの削除には、引き続き管理者スコープの Gateway 要求が必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    接続済みノードを一覧表示し、Gateway に読み込まれた Plugin コードまたは Plugin CLI コマンドからノードホストコマンドを呼び出します。たとえば、別の Mac 上のブラウザーやオーディオブリッジなど、ペアリング済みデバイス上のローカル作業を Plugin が所有している場合に使用します。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 内では、このランタイムはインプロセスです。Plugin CLI コマンドでは、設定済みの Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` などのコマンドはターミナルからペアリング済みノードを検査できます。ノードコマンドは引き続き、通常の Gateway ノードペアリング、コマンド許可リスト、Plugin のノード呼び出しポリシー、ノードローカルのコマンド処理を通過します。

    危険なノードホストコマンドを公開する Plugin は、`api.registerNodeInvokePolicy(...)` でノード呼び出しポリシーを登録する必要があります。このポリシーは、コマンド許可リストのチェック後、コマンドがノードへ転送される前に Gateway 内で実行されるため、直接の `node.invoke` 呼び出しと上位レベルの Plugin ツールは同じ適用経路を共有します。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow ランタイムを既存の OpenClaw セッションキーまたは信頼済みツールコンテキストにバインドし、各呼び出しで所有者を渡さずに Task Flow を作成および管理します。

    Task Flow は、永続的な複数ステップのワークフロー状態を追跡します。これはスケジューラーではありません。
    将来のウェイクアップには Cron または `api.session.workflow.scheduleSessionTurn(...)` を使用し、その作業でフロー状態、子タスク、待機、キャンセルが必要な場合は、スケジュールされたターンから `managedFlows` を使用します。

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

    コアの `messages.tts` 設定とプロバイダー選択を使用します。PCM オーディオバッファーとサンプルレートを返します。

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

    出力が生成されない場合（入力がスキップされた場合など）は、`{ text: undefined }` を返します。

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
    現在のランタイム設定スナップショットと、トランザクション形式の設定書き込みです。アクティブな呼び出し経路にすでに渡されている設定を優先してください。ハンドラーがプロセスのスナップショットを直接必要とする場合にのみ、`current()` を使用します。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値を返します。たとえば `{ mode: "restart", requiresRestart: true, reason }` は、再起動制御を Gateway から奪わずに書き込み側の意図を記録します。

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

    `runCommandWithTimeout(...)` は、キャプチャされた `stdout` と `stderr`、任意の切り詰め件数、`code`、`signal`、`killed`、`termination`、`noOutputTimedOut` を返します。タイムアウトおよび無出力タイムアウトの結果では、子プロセスが非ゼロの終了コードを提供しない場合に `code: 124` が報告されます。タイムアウトではないシグナル終了でも `code: null` が返る場合があるため、タイムアウト理由を区別するには `termination` と `noOutputTimedOut` を使用します。

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
    ログ記録。

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
    状態ディレクトリ解決と、SQLite によって裏付けられたキー付きストレージ。

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

    Keyed store は再起動後も保持され、ランタイムに紐づくプラグイン ID によって分離されます。アトミックな重複排除クレームには `registerIfAbsent(...)` を使用します。キーが存在しないか期限切れで登録された場合は `true` を返し、ライブ値がすでに存在する場合は、その値、作成時刻、TTL を上書きせずに `false` を返します。制限: namespace ごとに `maxEntries`、プラグインごとにライブ行 6,000 件、64KB 未満の JSON 値、および任意の TTL 期限切れ。書き込みによってプラグインの行上限を超える場合、ランタイムは書き込み対象の namespace から最も古いライブ行を退避することがあります。兄弟 namespace はその書き込みでは退避されず、namespace が十分な行を解放できない場合、その書き込みは引き続き失敗します。

    <Warning>
    このリリースではバンドルされたプラグインのみです。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    メモリツールファクトリと CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    チャンネル固有のランタイムヘルパー（チャンネルプラグインが読み込まれている場合に利用可能）。

    `api.runtime.channel.media` は、チャンネルメディアのダウンロードと保存に推奨されるサーフェスです。

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    リモート URL を OpenClaw メディアにする必要がある場合は `saveRemoteMedia(...)` を使用します。プラグインがプラグイン所有の認証、リダイレクト、または allowlist 処理を使ってすでに `Response` を取得している場合は `saveResponseMedia(...)` を使用します。プラグインが検査、変換、復号、または再アップロードのために生バイトを必要とする場合にのみ `readRemoteMediaBuffer(...)` を使用します。`fetchRemoteMedia(...)` は `readRemoteMediaBuffer(...)` の非推奨の互換エイリアスとして残っています。

    `api.runtime.channel.mentions` は、ランタイム注入を使用するバンドル済みチャンネルプラグイン向けの共有 inbound メンションポリシーサーフェスです。

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

`register` コールバックの外で使用するランタイム参照を保存するには、`createPluginRuntimeStore` を使用します。

<Steps>
  <Step title="ストアを作成する">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="エントリポイントに接続する">
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
  <Step title="他のファイルからアクセスする">
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
runtime-store の識別には `pluginId` を優先してください。低レベルの `key` 形式は、1 つのプラグインが意図的に複数のランタイムスロットを必要とするまれなケース向けです。
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
  現在の config スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からのプラグイン固有の config。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付き logger（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード。`"setup-runtime"` は、完全な entry の前にある軽量な起動/セットアップ期間です。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  プラグインルートからの相対パスを解決します。
</ParamField>

## 関連

- [プラグイン内部](/ja-JP/plugins/architecture) — capability モデルと registry
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — subpath リファレンス
