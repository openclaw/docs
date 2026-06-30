---
read_when:
    - プラグインからコアヘルパーを呼び出す必要がある（TTS、STT、画像生成、Web検索、サブエージェント、ノード）
    - api.runtime が何を公開しているかを理解したい
    - Plugin コードから設定、エージェント、またはメディアヘルパーにアクセスしています
sidebarTitle: Runtime helpers
summary: api.runtime -- Pluginで利用可能な注入済みランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-06-30T13:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

すべてのPluginの登録時に注入される `api.runtime` オブジェクトのリファレンスです。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ja-JP/plugins/sdk-channel-plugins">
    channel pluginsでこれらのヘルパーを文脈の中で使用するステップごとのガイド。
  </Card>
  <Card title="Provider plugins" href="/ja-JP/plugins/sdk-provider-plugins">
    provider pluginsでこれらのヘルパーを文脈の中で使用するステップごとのガイド。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定の読み込みと書き込み

アクティブな呼び出しパスにすでに渡されている設定を優先してください。たとえば、登録時の `api.config` や、channel/providerコールバックの `cfg` 引数です。これにより、ホットパスで設定を再解析する代わりに、1つのプロセススナップショットを作業全体に流せます。

`api.runtime.config.current()` は、長寿命のハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ使用してください。返される値は読み取り専用です。編集する前にクローンするか、変更ヘルパーを使用してください。

ツールファクトリーは `ctx.runtimeConfig` と `ctx.getRuntimeConfig()` を受け取ります。ツール定義の作成後に設定が変わる可能性がある場合は、長寿命ツールの `execute` コールバック内でgetterを使用してください。

変更は `api.runtime.config.mutateConfigFile(...)` または `api.runtime.config.replaceConfigFile(...)` で永続化します。各書き込みでは明示的な `afterWrite` ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }` はgatewayのリロードプランナーに判断を任せます。
- `afterWrite: { mode: "restart", reason: "..." }` は、書き手がホットリロードは安全でないと判断している場合にクリーンな再起動を強制します。
- `afterWrite: { mode: "none", reason: "..." }` は、呼び出し元が後続処理を所有している場合にのみ、自動リロード/再起動を抑制します。

変更ヘルパーは `afterWrite` と型付きの `followUp` サマリーを返すため、呼び出し元は再起動を要求したかどうかをログ記録またはテストできます。その再起動が実際にいつ発生するかは、引き続きGatewayが所有します。

`api.runtime.config.loadConfig()` と `api.runtime.config.writeConfigFile(...)` は、`runtime-config-load-write` 配下の非推奨の互換ヘルパーです。実行時に一度だけ警告し、移行期間中は古い外部Plugin向けに引き続き利用できます。バンドルPluginはこれらを使用してはいけません。Pluginコードがこれらを呼び出すか、plugin SDKサブパスからこれらのヘルパーをインポートすると、設定境界ガードが失敗します。

直接SDKインポートでは、広範な
`openclaw/plugin-sdk/config-runtime` 互換barrelではなく、焦点を絞った設定サブパスを使用してください。型には `config-contracts`、読み込み済み設定のアサーションとPluginエントリ検索には `plugin-config-runtime`、現在のプロセススナップショットには `runtime-config-snapshot`、書き込みには `config-mutation` を使用します。バンドルPluginのテストでは、広範な互換barrelをモックする代わりに、これらの焦点を絞ったサブパスを直接モックしてください。

OpenClaw内部ランタイムコードも同じ方針です。CLI、gateway、またはプロセス境界で設定を一度読み込み、その値を受け渡します。成功した変更書き込みはプロセスランタイムスナップショットを更新し、その内部リビジョンを進めます。長寿命キャッシュは、設定をローカルでシリアライズする代わりに、ランタイム所有のキャッシュキーをキーにするべきです。長寿命ランタイムモジュールには、周辺的な `loadConfig()` 呼び出しに対するゼロトレランスのスキャナーがあります。渡された `cfg`、リクエストの `context.getRuntimeConfig()`、または明示的なプロセス境界での `getRuntimeConfig()` を使用してください。

Providerとchannelの実行パスでは、設定の読み戻しや編集のために返されたファイルスナップショットではなく、アクティブなランタイム設定スナップショットを使用する必要があります。ファイルスナップショットは、UIや書き込みのためにSecretRefマーカーなどのソース値を保持します。providerコールバックには、解決済みのランタイムビューが必要です。ヘルパーがアクティブなソーススナップショットまたはアクティブなランタイムスナップショットのどちらでも呼び出される可能性がある場合は、資格情報を読む前に `selectApplicableRuntimeConfig()` を経由してください。

## 再利用可能なランタイムユーティリティ

bot作成のインバウンドメッセージには、受信した `botLoopProtection` ファクトを使用してください。Coreは、ポリシーを1つのchannelに結びつけずに、セッション記録とディスパッチの前に共有のインメモリ・スライディングウィンドウガードを適用します。このガードは `(scopeId, conversationId, participant pair)` キーを追跡し、ペアの両方向をまとめてカウントし、ウィンドウ予算を超えるとクールダウンを適用し、非アクティブなエントリを機会的に刈り込みます。

この動作をオペレーターに公開するchannel pluginsは、ベースライン予算には共有の `channels.defaults.botLoopProtection` 形状を優先し、その上にchannel/provider固有のオーバーライドを重ねてください。共有設定はユーザー向けであるため、秒を使用します。

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

解決済みターンとともに、正規化されたbotペアのファクトを渡してください。Coreはデフォルト、単位変換、`enabled` セマンティクスを解決します。

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
二者間イベントループでのみ、`openclaw/plugin-sdk/pair-loop-guard-runtime` を直接使用してください。

## ランタイム名前空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    エージェントID、ディレクトリ、セッション管理。

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

    `runEmbeddedAgent(...)` は、Pluginコードから通常のOpenClawエージェントターンを開始するための中立的なヘルパーです。channel起点の返信と同じprovider/model解決とエージェントハーネス選択を使用します。

    `runEmbeddedPiAgent(...)` は、既存Plugin向けの非推奨の互換エイリアスとして残っています。新しいコードでは `runEmbeddedAgent(...)` を使用してください。

    `resolveThinkingPolicy(...)` は、provider/modelがサポートするthinkingレベルと任意のデフォルトを返します。Provider pluginsはthinkingフックを通じてモデル固有のプロファイルを所有するため、ツールPluginはproviderリストをインポートまたは重複させる代わりに、このランタイムヘルパーを呼び出すべきです。

    `normalizeThinkingLevel(...)` は、`on`、`x-high`、`extra high` などのユーザーテキストを、解決済みポリシーと照合する前に、正規の保存レベルへ変換します。

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

    セッションワークフローには、`getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)`、または `upsertSessionEntry(...)` を優先してください。これらのヘルパーはエージェント/セッションIDでセッションを扱うため、Pluginはレガシーな `sessions.json` ストレージ形状に依存しません。セッションアクティビティを更新すべきでないメタデータのみのパッチには `preserveActivity: true` を使用し、コールバックが完全なエントリを返し、削除済みフィールドを削除済みのままにする必要がある場合にのみ `replaceEntry: true` を使用してください。

    transcriptの読み取りと書き込みでは、`openclaw/plugin-sdk/session-transcript-runtime` をインポートし、`{ agentId, sessionKey, sessionId }` とともに `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)`、または `withSessionTranscriptWriteLock(...)` を使用してください。これらのAPIにより、Pluginはtranscriptを識別し、そのイベントを読み取り、メッセージを追加し、更新を公開し、関連操作を同じtranscript書き込みロックの下で実行できます。`sessionFile` を渡すこと、`resolveSessionTranscriptLegacyFileTarget(...)` を使用すること、または `openclaw/plugin-sdk/agent-harness-runtime` から低レベルの `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` をインポートすることは非推奨です。これらのパスは、アクティブなtranscript成果物をすでに受け取っているレガシーコードのためにのみ存在します。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionFilePath(...)`、`resolveAndPersistSessionFile(...)` は、レガシーなストア全体またはtranscriptファイル形状にまだ意図的に依存しているPlugin向けの非推奨互換ヘルパーです。新しいPluginコードはこれらのヘルパーを使用してはならず、既存の呼び出し元はエントリヘルパーとtranscript IDヘルパーへ移行するべきです。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    デフォルトのモデルとprovider定数:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    provider内部をインポートしたり、OpenClawのmodel/auth/base URL準備を重複させたりせずに、ホスト所有のテキスト補完を実行します。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    このヘルパーは、OpenClawの組み込みランタイムと同じ単純補完準備パス、およびホスト所有のランタイム設定スナップショットを使用します。コンテキストエンジンはセッションにバインドされた `llm.complete` capabilityを受け取るため、モデル呼び出しはアクティブセッションのエージェントを使用し、デフォルトエージェントへ暗黙にフォールバックしません。結果にはprovider/model/agentの帰属情報に加えて、利用可能な場合は正規化されたトークン、キャッシュ、推定コスト使用量が含まれます。

    <Warning>
    モデルオーバーライドには、設定内の `plugins.entries.<id>.llm.allowModelOverride: true` によるオペレーターのオプトインが必要です。信頼済みPluginを特定の正規 `provider/model` ターゲットに制限するには、`plugins.entries.<id>.llm.allowedModels` を使用してください。エージェントをまたぐ補完には `plugins.entries.<id>.llm.allowAgentIdOverride: true` が必要です。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    バックグラウンドのsubagent実行を起動して管理します。

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
    モデルの上書き（`provider`/`model`）には、設定の `plugins.entries.<id>.subagent.allowModelOverride: true` によるオペレーターのオプトインが必要です。信頼されていない Plugin も subagent を実行できますが、上書きリクエストは拒否されます。
    </Warning>

    `deleteSession(...)` は、同じ Plugin が `api.runtime.subagent.run(...)` を通じて作成したセッションを削除できます。任意のユーザーまたはオペレーターのセッションを削除するには、引き続き管理者スコープの Gateway リクエストが必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    接続済みノードを一覧表示し、Gateway に読み込まれた Plugin コードまたは Plugin CLI コマンドからノードホストコマンドを呼び出します。Plugin がペアリング済みデバイス上のローカル作業を所有する場合に使用します。たとえば別の Mac 上のブラウザーや音声ブリッジです。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 内では、このランタイムはインプロセスです。Plugin CLI コマンドでは、設定済みの Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` のようなコマンドでターミナルからペアリング済みノードを検査できます。ノードコマンドは引き続き通常の Gateway ノードペアリング、コマンド許可リスト、Plugin のノード呼び出しポリシー、ノードローカルのコマンド処理を通過します。

    危険なノードホストコマンドを公開する Plugin は、`api.registerNodeInvokePolicy(...)` でノード呼び出しポリシーを登録する必要があります。このポリシーは、コマンド許可リストのチェック後、コマンドがノードに転送される前に Gateway 内で実行されるため、直接の `node.invoke` 呼び出しと上位レベルの Plugin ツールは同じ強制パスを共有します。

    <Warning>
    任意の `scopes` フィールドは、その呼び出しに対する Gateway オペレータースコープをリクエストします。OpenClaw は、バンドル済み Plugin と信頼された公式 Plugin インストールに対してのみこれを尊重します。他の Plugin からのリクエストは呼び出しを昇格しません。信頼された Plugin が `operator.admin` のようなより厳格な Gateway スコープでノードコマンドを呼び出す必要がある場合にのみ使用してください。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    タスクフローランタイムを既存の OpenClaw セッションキーまたは信頼されたツールコンテキストにバインドし、各呼び出しで所有者を渡さずにタスクフローを作成および管理します。

    タスクフローは、永続的な複数ステップのワークフロー状態を追跡します。これはスケジューラーではありません。
    将来のウェイクアップには Cron または `api.session.workflow.scheduleSessionTurn(...)` を使用し、その作業にフロー状態、子タスク、待機、またはキャンセルが必要な場合は、スケジュールされたターンから `managedFlows` を使用します。

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

    独自のバインディング層から信頼された OpenClaw セッションキーをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使用します。生のユーザー入力からバインドしないでください。

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

    出力が生成されない場合（例: 入力がスキップされた場合）は `{ text: undefined }` を返します。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換エイリアスとして残ります。
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
    現在のランタイム設定スナップショットとトランザクション型の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先します。ハンドラーがプロセススナップショットを直接必要とする場合にのみ `current()` を使用してください。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値を返します。たとえば `{ mode: "restart", requiresRestart: true, reason }` です。これは、Gateway から再起動制御を奪わずに、書き込み側の意図を記録します。

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

    `runCommandWithTimeout(...)` は、取得した `stdout` と `stderr`、任意の切り詰め件数、`code`、`signal`、`killed`、`termination`、`noOutputTimedOut` を返します。タイムアウトおよび無出力タイムアウトの結果では、子プロセスが非ゼロ終了コードを提供しない場合に `code: 124` が報告されます。タイムアウトではないシグナル終了でも `code: null` が返る場合があるため、タイムアウト理由を区別するには `termination` と `noOutputTimedOut` を使用してください。

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
    状態ディレクトリの解決と SQLite バックエンドのキー付きストレージ。

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

    キー付きストアは再起動後も保持され、ランタイムに紐づく Plugin id によって分離されます。アトミックな重複排除の要求には `registerIfAbsent(...)` を使用します。キーが存在しないか期限切れで登録された場合は `true` を返し、ライブ値がすでに存在する場合はその値、作成時刻、TTL を上書きせずに `false` を返します。制限: 名前空間ごとに `maxEntries`、Plugin ごとに 6,000 件のライブ行、64KB 未満の JSON 値、省略可能な TTL 有効期限。書き込みによって Plugin の行上限を超える場合、ランタイムは書き込み対象の名前空間から最も古いライブ行を退避することがあります。同階層の名前空間はその書き込みでは退避されず、その名前空間で十分な行を解放できない場合、書き込みは引き続き失敗します。

    <Warning>
    このリリースではバンドル済み Plugin のみです。
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
    チャンネル固有のランタイムヘルパーです（チャンネル Plugin が読み込まれている場合に利用可能）。

    `api.runtime.channel.media` は、チャンネルメディアのダウンロードと保存に推奨されるサーフェスです。

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    リモート URL を OpenClaw メディアにする必要がある場合は `saveRemoteMedia(...)` を使用します。Plugin がすでに Plugin 所有の認証、リダイレクト、または許可リスト処理で `Response` を取得している場合は `saveResponseMedia(...)` を使用します。Plugin が検査、変換、復号、または再アップロードのために生バイトを必要とする場合にのみ `readRemoteMediaBuffer(...)` を使用します。`fetchRemoteMedia(...)` は、`readRemoteMediaBuffer(...)` の非推奨の互換エイリアスとして残っています。

    `api.runtime.channel.mentions` は、ランタイム注入を使用するバンドル済みチャンネル Plugin 向けの共有インバウンドメンションポリシーサーフェスです。

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

`register` コールバックの外部で使用するためにランタイム参照を保存するには、`createPluginRuntimeStore` を使用します。

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
runtime-store の識別には `pluginId` を優先してください。低レベルの `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とする、まれなケース向けです。
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
  現在の設定スナップショット（利用可能な場合は、アクティブなメモリ内ランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からの Plugin 固有設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付きロガー（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード。`"setup-runtime"` は、完全なエントリの前に実行される軽量な起動/セットアップ期間です。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートを基準にしたパスを解決します。
</ParamField>

## 関連

- [Plugin 内部](/ja-JP/plugins/architecture) — ケイパビリティモデルとレジストリ
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスリファレンス
