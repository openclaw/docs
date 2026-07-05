---
read_when:
    - Plugin からコアヘルパーを呼び出す必要がある場合（TTS、STT、画像生成、Web検索、サブエージェント、ノード）
    - api.runtime が何を公開しているかを理解したい
    - Pluginコードからconfig、agent、またはmediaヘルパーにアクセスしている
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin で利用できる注入されたランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-07-05T11:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8341516832d7876e7f1412b443e7582a090b7f94893303560b3713ee7a7e6aa
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

`api.runtime` オブジェクトのリファレンスです。このオブジェクトは登録時にすべてのPluginへ注入されます。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ja-JP/plugins/sdk-channel-plugins">
    チャンネルPluginでこれらのヘルパーを文脈の中で使用するためのステップバイステップガイドです。
  </Card>
  <Card title="Provider plugins" href="/ja-JP/plugins/sdk-provider-plugins">
    プロバイダーPluginでこれらのヘルパーを文脈の中で使用するためのステップバイステップガイドです。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` は現在のOpenClaw製品バージョンです。共有バージョンリゾルバーから取得されるため、PluginにはCLIが報告する値と同じ値が見えます。

## 設定の読み込みと書き込み

アクティブな呼び出しパスにすでに渡されている設定を優先してください。たとえば登録時の `api.config` や、チャンネル/プロバイダーコールバックの `cfg` 引数です。これにより、ホットパスで設定を再解析する代わりに、1つのプロセススナップショットを作業全体に流せます。

`api.runtime.config.current()` は、長寿命ハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ使用してください。返される値は読み取り専用です。編集する前にクローンするか、変更用ヘルパーを使用してください。

ツールファクトリは `ctx.runtimeConfig` と `ctx.getRuntimeConfig()` を受け取ります。ツール定義の作成後に設定が変わる可能性がある場合は、長寿命ツールの `execute` コールバック内でgetterを使用してください。

変更は `api.runtime.config.mutateConfigFile(...)` または `api.runtime.config.replaceConfigFile(...)` で永続化してください。各書き込みでは明示的な `afterWrite` ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }` はGatewayのリロードプランナーに判断させます。
- `afterWrite: { mode: "restart", reason: "..." }` は、書き込み側がホットリロードは安全でないと知っている場合にクリーンな再起動を強制します。
- `afterWrite: { mode: "none", reason: "..." }` は、呼び出し元が後続処理を所有している場合にのみ、自動リロード/再起動を抑制します。

変更ヘルパーは `afterWrite` と型付きの `followUp` 要約を返すため、呼び出し元は再起動を要求したかどうかをログに記録したりテストしたりできます。その再起動が実際にいつ行われるかは、引き続きGatewayが所有します。

<Warning>
`api.runtime.config.loadConfig()` と `api.runtime.config.writeConfigFile(...)` は非推奨です。実行時にPluginごとに一度警告し、移行期間中の古い外部Pluginのためにのみ利用可能な状態で残されています。バンドルPluginはこれらを使用してはいけません。Pluginコードがこれらを呼び出すか、Plugin SDKサブパスからこれらのヘルパーをインポートすると、内部設定境界ガードによりビルドが失敗します。代わりに `current()`、渡された `cfg`、`mutateConfigFile(...)`、または `replaceConfigFile(...)` を使用してください。
</Warning>

直接SDKインポートでは、広範な `openclaw/plugin-sdk/config-runtime` 互換barrelよりも、焦点を絞った設定サブパスを優先してください。型には `config-contracts`、すでに読み込まれた設定のアサーションとPluginエントリ検索には `plugin-config-runtime`、現在のプロセススナップショットには `runtime-config-snapshot`、書き込みには `config-mutation` を使用します。バンドルPluginテストでは、広範な互換barrelをモックする代わりに、これらの焦点を絞ったサブパスを直接モックしてください。

内部OpenClawランタイムコードも同じ方向に従います。CLI、Gateway、またはプロセス境界で設定を一度読み込み、その値を渡していきます。成功した変更書き込みはプロセスランタイムスナップショットを更新し、その内部リビジョンを進めます。長寿命キャッシュは、設定をローカルでシリアライズする代わりに、ランタイム所有のキャッシュキーを基準にしてください。長寿命ランタイムモジュールには、周囲の `loadConfig()` 呼び出しを一切許容しないスキャナーがあります。渡された `cfg`、リクエストの `context.getRuntimeConfig()`、または明示的なプロセス境界での `getRuntimeConfig()` を使用してください。

プロバイダーとチャンネルの実行パスでは、設定の読み返しや編集用に返されたファイルスナップショットではなく、アクティブなランタイム設定スナップショットを使用する必要があります。ファイルスナップショットは、UIや書き込みのためにSecretRefマーカーなどのソース値を保持します。プロバイダーコールバックには解決済みのランタイムビューが必要です。ヘルパーがアクティブなソーススナップショットまたはアクティブなランタイムスナップショットのどちらでも呼ばれる可能性がある場合は、認証情報を読む前に `selectApplicableRuntimeConfig()` を通してください。

## 再利用可能なランタイムユーティリティ

ボットが作成した受信メッセージには、受信した `botLoopProtection` ファクトを使用してください。コアは、ポリシーを特定のチャンネルに結び付けることなく、セッション記録とディスパッチの前に共有インメモリスライディングウィンドウガードを適用します。このガードは `(scopeId, conversationId, participant pair)` キーを追跡し、ペアの両方向をまとめてカウントし、ウィンドウ予算を超えたらクールダウンを適用し、非アクティブなエントリを機会的に刈り込みます。

この動作をオペレーターへ公開するチャンネルPluginは、ベースライン予算として共有の `channels.defaults.botLoopProtection` 形状を優先し、その上にチャンネル/プロバイダー固有の上書きを重ねてください。共有設定はユーザー向けであるため秒を使用します。

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

正規化されたボットペアのファクトを、解決済みターンと一緒に渡してください。コアはデフォルト、単位変換、`enabled` セマンティクスを解決します。

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

共有受信返信ランナーを経由しないカスタムの二者間イベントループにのみ、`openclaw/plugin-sdk/pair-loop-guard-runtime` を直接使用してください。

## ランタイム名前空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    エージェントID、ディレクトリ、セッション管理です。

    ```typescript
    // Resolve the agent's working directory (agentId is required)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

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
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` は、Pluginコードから通常のOpenClawエージェントターンを開始するための中立的なヘルパーです。チャンネルからトリガーされる返信と同じプロバイダー/モデル解決、およびエージェントハーネス選択を使用します。

    `runEmbeddedPiAgent(...)` は、既存Plugin向けの非推奨の互換エイリアスとして残っています。新しいコードでは `runEmbeddedAgent(...)` を使用してください。

    `resolveThinkingPolicy(...)` は、プロバイダー/モデルがサポートするthinkingレベルと任意のデフォルトを返します。プロバイダーPluginはthinkingフックを通じてモデル固有プロファイルを所有するため、ツールPluginはプロバイダーリストをインポートまたは複製する代わりに、このランタイムヘルパーを呼び出すべきです。

    `normalizeThinkingLevel(...)` は、`on`、`x-high`、`extra high` などのユーザーテキストを、解決済みポリシーと照合する前に、正規の保存レベルへ変換します。

    **セッションストアヘルパー** は `api.runtime.agent.session` の下にあります。

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

    セッションワークフローには `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)`、または `upsertSessionEntry(...)` を優先してください。これらのヘルパーはエージェント/セッションIDでセッションを指定するため、Pluginは従来の `sessions.json` ストレージ形状に依存しません。セッションアクティビティを更新すべきでないメタデータのみのパッチには `preserveActivity: true` を使用し、コールバックが完全なエントリを返し、削除されたフィールドを削除されたままにする必要がある場合にのみ `replaceEntry: true` を使用してください。

    Pluginが永続化セッションで作業を開始する場合は、`runWithWorkAdmission(...)` を使用してください。コールバックはアーカイブ済みまたは同時に置き換えられたセッションを拒否し、アーカイブ/リセット/削除の変更を完了まで連携させ、エージェント実行へ転送する必要がある `AbortSignal` を受け取ります。

    トランスクリプトの読み書きでは、`openclaw/plugin-sdk/session-transcript-runtime` をインポートし、`{ agentId, sessionKey, sessionId }` とともに `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)`、または `withSessionTranscriptWriteLock(...)` を使用してください。これらのAPIにより、Pluginはトランスクリプトを識別し、そのイベントを読み、メッセージを追加し、更新を公開し、関連操作を同じトランスクリプト書き込みロックの下で実行できます。`sessionFile` を渡すこと、`resolveSessionTranscriptLegacyFileTarget(...)` を使用すること、または低レベルの `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` を `openclaw/plugin-sdk/agent-harness-runtime` からインポートすることは非推奨です。これらのパスは、アクティブなトランスクリプトアーティファクトをすでに受け取っているレガシーコードのためにのみ存在します。

    `resolveStorePath(...)` と `updateSessionStoreEntry(...)` はセッションヘルパーを補完します。`resolveStorePath` は指定されたスコープのセッションストアパスを解決し、`updateSessionStoreEntry({ storePath, sessionKey, update })` は呼び出し元がすでにストアパスを知っている場合に、そのストアパスで1つのエントリを直接パッチします。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionFilePath(...)` は、従来のストア全体またはトランスクリプトファイル形状にまだ意図的に依存しているPlugin向けの非推奨の互換ヘルパーです。新しいPluginコードではこれらのヘルパーを使用してはならず、既存の呼び出し元はエントリヘルパーとトランスクリプトIDヘルパーへ移行すべきです。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    デフォルトモデルとプロバイダー定数です。

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "gpt-5.5"
    const provider = api.runtime.agent.defaults.provider; // e.g. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    プロバイダー内部をインポートしたり、OpenClawのモデル/認証/base URL準備を複製したりせずに、ホスト所有のテキスト補完を実行します。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    このヘルパーは、OpenClaw の組み込みランタイムとホスト所有のランタイム設定スナップショットと同じ、シンプル補完の準備パスを使用します。コンテキストエンジンはセッションにバインドされた `llm.complete` capability を受け取るため、モデル呼び出しはアクティブセッションのエージェントを使用し、デフォルトエージェントへ暗黙にフォールバックしません。結果には、プロバイダー/モデル/エージェントの帰属に加え、利用可能な場合は正規化されたトークン、キャッシュ、推定コストの使用量が含まれます。

    <Warning>
    モデルのオーバーライドには、設定で `plugins.entries.<id>.llm.allowModelOverride: true` を指定してオペレーターが明示的に有効化する必要があります。信頼済み Plugin を特定の正規 `provider/model` ターゲットに制限するには、`plugins.entries.<id>.llm.allowedModels` を使用します。エージェント間の補完には `plugins.entries.<id>.llm.allowAgentIdOverride: true` が必要です。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    バックグラウンドのサブエージェント実行を起動して管理します。

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-5.5", // optional override
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
    モデルのオーバーライド（`provider`/`model`）には、設定で `plugins.entries.<id>.subagent.allowModelOverride: true` を指定してオペレーターが明示的に有効化する必要があります。信頼されていない Plugin でもサブエージェントは実行できますが、オーバーライド要求は拒否されます。
    </Warning>

    `deleteSession(...)` は、同じ Plugin が `api.runtime.subagent.run(...)` を通じて作成したセッションを削除できます。任意のユーザーセッションやオペレーターセッションを削除するには、引き続き管理者スコープの Gateway 要求が必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway に読み込まれた Plugin コード、または Plugin CLI コマンドから、接続済みノードを一覧表示し、ノードホストコマンドを呼び出します。Plugin がペアリング済みデバイス上のローカル作業を所有している場合、たとえば別の Mac 上のブラウザーや音声ブリッジに使用します。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 内では、このランタイムはプロセス内で動作します。Plugin CLI コマンドでは、設定済みの Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` のようなコマンドはターミナルからペアリング済みノードを検査できます。Node コマンドは引き続き、通常の Gateway ノードペアリング、コマンド許可リスト、Plugin のノード呼び出しポリシー、ノードローカルのコマンド処理を経由します。

    危険なノードホストコマンドを公開する Plugin は、`api.registerNodeInvokePolicy(...)` でノード呼び出しポリシーを登録するべきです。このポリシーは、コマンド許可リストのチェック後、コマンドがノードへ転送される前に Gateway で実行されるため、直接の `node.invoke` 呼び出しと上位レベルの Plugin ツールは同じ強制パスを共有します。

    <Warning>
    任意の `scopes` フィールドは、呼び出しに対する Gateway オペレータースコープを要求します。OpenClaw がこれを尊重するのは、バンドル済み Plugin と信頼済み公式 Plugin インストールの場合のみです。他の Plugin からの要求は呼び出しを昇格しません。信頼済み Plugin が `operator.admin` など、より厳格な Gateway スコープでノードコマンドを呼び出す必要がある場合にのみ使用してください。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Task Flow と Task Run の状態を、既存の OpenClaw セッションキーまたは信頼済みツールコンテキストにバインドします。

    - `api.runtime.tasks.managedFlows` は変更可能です。Task Flow の作成、進行、キャンセルを行います。
    - `api.runtime.tasks.flows` と `api.runtime.tasks.runs` は、一覧表示とステータス検索のための読み取り専用 DTO ビューです。どちらも `bindSession(...)` / `fromToolContext(...)` に加え、`get`、`list`、`findLatest`、`resolve` を公開します。
    - `api.runtime.tasks.flow` は `managedFlows` の非推奨エイリアスです。

    Task Flow は、永続的な複数ステップのワークフロー状態を追跡します。これはスケジューラーではありません。将来のウェイクアップには Cron または `api.session.workflow.scheduleSessionTurn(...)` を使用し、その作業でフロー状態、子タスク、待機、キャンセルが必要になった場合は、スケジュールされたターンから `managedFlows` を使用してください。

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

    自分のバインディング層から信頼済みの OpenClaw セッションキーをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使用します。生のユーザー入力からバインドしないでください。

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

    コアの `messages.tts` 設定とプロバイダー選択を使用します。PCM オーディオバッファーとサンプルレートを返します。ストリーミング合成には `textToSpeechStream` も利用できます。

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

    `describeImageFileWithModel(...)` は、すでに既知の画像を特定のプロバイダー/モデルを通じて説明し、`describeImageFile(...)` が使用するデフォルトのアクティブモデル解決を迂回します。

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
  <Accordion title="api.runtime.videoGeneration">
    動画生成。画像生成と同じ形に対応しています。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "A drone shot flying over a coastline at sunrise",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音楽生成。画像生成と同じ形に対応しています。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "An upbeat lo-fi track for a coding session",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
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
    現在のランタイム設定スナップショットと、トランザクション対応の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先してください。ハンドラーがプロセススナップショットを直接必要とする場合にのみ、`current()` を使用します。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値を返します。たとえば `{ mode: "restart", requiresRestart: true, reason }` のような値で、Gateway から再起動制御を奪うことなく、書き込み側の意図を記録します。

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 非推奨の互換エイリアス。
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` は、通常の合流タイマーをバイパスして、単一の Heartbeat サイクルを即座に実行します。既定の `target: "none"` 抑制ではなく、最後のアクティブなチャンネルへの配信を強制するには、`{ heartbeat: { target: "last" } }` を渡します。

    `runCommandWithTimeout(...)` は、キャプチャされた `stdout` と `stderr`、任意の
    切り詰め件数、`code`、`signal`、`killed`、`termination`、および
    `noOutputTimedOut` を返します。子プロセスがゼロ以外の終了コードを提供しない場合、タイムアウトおよび無出力タイムアウトの結果は `code: 124`
    を報告します。タイムアウト以外の
    シグナル終了では引き続き `code: null` が返ることがあるため、タイムアウト理由を区別するには
    `termination` と
    `noOutputTimedOut` を使用します。

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

    // プロバイダーのランタイム交換（例: OAuth 更新）を含む、リクエスト準備済みの認証
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状態ディレクトリの解決と SQLite ベースのキー付きストレージ。

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

    キー付きストアは再起動後も保持され、ランタイムにバインドされた Plugin id によって分離されます。アトミックな重複排除の要求には `registerIfAbsent(...)` を使用します。キーが存在しないか期限切れで登録された場合は `true` を返し、ライブ値がすでに存在する場合は、その値、作成時刻、TTL を上書きせずに `false` を返します。制限: namespace ごとの `maxEntries`、Plugin ごとに 50,000 のライブ行、64KB 未満の JSON 値、および任意の TTL 期限切れ。書き込みによって Plugin の行上限を超える場合、ランタイムは書き込み対象の namespace から最も古いライブ行を削除します。兄弟 namespace はその書き込みでは削除されず、namespace が十分な行を解放できない場合は書き込みが引き続き失敗します。

    `openSyncKeyedStore<T>(...)` は、await できない呼び出し元向けに、同期メソッド（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` はすべて Promise ではなく値を直接返す）を持つ同じストア形状を返します。

    `openChannelIngressQueue<TPayload>(...)` は、呼び出し元 Plugin にスコープされた永続化済み ingress キューを開き、再起動をまたいで at-least-once 処理が必要な受信イベントをバッファリングします。

    <Warning>
    このリリースでは、`openKeyedStore`、`openSyncKeyedStore`、および `openChannelIngressQueue` は、バンドル Plugin と信頼済みの公式 Plugin インストールでのみ利用できます。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    チャンネル固有のランタイムヘルパー（チャンネル Plugin が読み込まれている場合に利用可能）。関心ごとにグループ化されています。

    | グループ | 目的 |
    | --- | --- |
    | `text` | チャンク化（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、制御コマンド検出、Markdown テーブル変換。 |
    | `reply` | バッファリングされたブロック返信ディスパッチ、エンベロープ整形、有効なメッセージ/人間遅延設定の解決。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、許可リスト読み取り、ペアリングリクエストの upsert。 |
    | `media` | リモートメディアのダウンロード/保存（下記参照）。 |
    | `activity` | 最後のチャンネルアクティビティを記録/読み取り。 |
    | `session` | 受信イベントからのセッションメタデータ、last-route 更新。 |
    | `mentions` | メンションポリシーヘルパー（下記参照）。 |
    | `reactions` | 処理中インジケーター用の ack-reaction ハンドル。 |
    | `groups` | グループポリシーと require-mention の解決。 |
    | `debounce` | 受信メッセージのデバウンス。 |
    | `commands` | コマンド認可とテキストコマンドのゲート。 |
    | `outbound` | チャンネルの送信アダプターを読み込み。 |
    | `inbound` | 受信イベントコンテキストを構築し、共有の受信イベント/返信カーネルを実行。 |
    | `threadBindings` | バインド済みセッションスレッドのアイドルタイムアウト/最大経過時間を調整。 |
    | `runtimeContexts` | プロセスローカルのチャンネル/アカウント/ケイパビリティ別コンテキストを登録、読み取り、監視。 |

    `api.runtime.channel.media` は、チャンネルメディアのダウンロードとストレージに推奨されるサーフェスです。

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    リモート URL を OpenClaw メディアにする必要がある場合は `saveRemoteMedia(...)` を使用します。Plugin 所有の認証、リダイレクト、または許可リスト処理ですでに `Response` を取得済みの場合は、`saveResponseMedia(...)` を使用します。Plugin が検査、変換、復号、または再アップロードのために生バイトを必要とする場合にのみ、`readRemoteMediaBuffer(...)` を使用します。`fetchRemoteMedia(...)` は、`readRemoteMediaBuffer(...)` の非推奨の互換エイリアスとして残っています。

    `api.runtime.channel.mentions` は、ランタイム注入を使用するバンドルチャンネル Plugin 向けの共有受信メンションポリシーサーフェスです。

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

    `reply`、`session`、および `inbound` の配下にある複数のフィールドには、現在のチャンネルターンカーネルまたはチャンネル送信アダプターを指すフィールド単位の `@deprecated` 注記があります。新しいコードをその上に構築する前に、該当ヘルパーのインライン JSDoc を確認してください。

  </Accordion>
</AccordionGroup>

## ランタイム参照の保存

`register` コールバックの外部で使用するためにランタイム参照を保存するには、`createPluginRuntimeStore` を使用します。

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
  <Step title="エントリーポイントへ接続">
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
      return store.getRuntime(); // 初期化されていない場合は throw
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 初期化されていない場合は null を返す
    }
    ```

  </Step>
</Steps>

<Note>
runtime-store の識別子には `pluginId` を優先してください。低レベルの `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とするまれなケース向けです。
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
  現在の設定スナップショット（利用可能な場合はアクティブなメモリ内ランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からの Plugin 固有の設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付きロガー（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード: `"full"`（ライブ有効化）、`"discovery"` / `"tool-discovery"`（読み取り専用ケイパビリティ検出）、`"setup-only"`（軽量セットアップエントリー）、`"setup-runtime"`（ランタイムチャンネルエントリーも必要なセットアップフロー）、または `"cli-metadata"`（CLI コマンドメタデータ収集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートからの相対パスを解決します。
</ParamField>

## 関連

- [Plugin 内部](/ja-JP/plugins/architecture) — ケイパビリティモデルとレジストリ
- [SDK エントリーポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` オプション
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスリファレンス
