---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、Gateway、サブエージェント、ノード）を呼び出す必要がある場合
    - api.runtime が公開する内容を理解したい場合
    - Plugin コードから設定、エージェント、またはメディアのヘルパーにアクセスしている
sidebarTitle: Runtime helpers
summary: api.runtime -- Pluginで利用可能な注入済みランタイムヘルパー
title: Pluginランタイムヘルパー
x-i18n:
    generated_at: "2026-07-12T14:44:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

登録時に各Pluginへ注入される`api.runtime`オブジェクトのリファレンスです。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

<CardGroup cols={2}>
  <Card title="チャンネルPlugin" href="/ja-JP/plugins/sdk-channel-plugins">
    チャンネルPluginでこれらのヘルパーを使用する手順を、具体的な文脈に沿って説明するガイドです。
  </Card>
  <Card title="プロバイダーPlugin" href="/ja-JP/plugins/sdk-provider-plugins">
    プロバイダーPluginでこれらのヘルパーを使用する手順を、具体的な文脈に沿って説明するガイドです。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version`は現在のOpenClaw製品バージョンです。共有バージョンリゾルバーから取得されるため、PluginにはCLIが報告する値と同じ値が渡されます。

## 設定の読み込みと書き込み

登録時の`api.config`や、チャンネル／プロバイダーのコールバックに渡される`cfg`引数など、アクティブな呼び出しパスへすでに渡されている設定を優先してください。これにより、ホットパスで設定を再解析せず、単一のプロセススナップショットを処理全体で引き継げます。

長時間稼働するハンドラーが現在のプロセススナップショットを必要とし、その関数に設定が渡されていない場合にのみ、`api.runtime.config.current()`を使用してください。返される値は読み取り専用です。編集する前にクローンするか、変更ヘルパーを使用してください。

ツールファクトリーには`ctx.runtimeConfig`と`ctx.getRuntimeConfig()`が渡されます。ツール定義の作成後に設定が変更される可能性がある場合は、長時間稼働するツールの`execute`コールバック内でゲッターを使用してください。

変更を永続化するには、`api.runtime.config.mutateConfigFile(...)`または`api.runtime.config.replaceConfigFile(...)`を使用します。書き込みごとに明示的な`afterWrite`ポリシーを選択する必要があります。

- `afterWrite: { mode: "auto" }`では、Gatewayのリロードプランナーが判断します。
- `afterWrite: { mode: "restart", reason: "..." }`では、書き込み側がホットリロードは安全でないと判断している場合に、クリーンな再起動を強制します。
- `afterWrite: { mode: "none", reason: "..." }`では、呼び出し元が後続処理を担う場合に限り、自動リロード／再起動を抑止します。

変更ヘルパーは`afterWrite`に加えて、型付きの`followUp`サマリーを返すため、呼び出し元は再起動を要求したかどうかをログに記録したり、テストしたりできます。実際にいつ再起動するかは、引き続きGatewayが管理します。

<Warning>
`api.runtime.config.loadConfig()`と`api.runtime.config.writeConfigFile(...)`は非推奨です。実行時にPluginごとに一度警告を発し、移行期間中の古い外部Pluginのためにのみ提供されています。バンドルPluginでは使用してはいけません。Pluginコードがこれらを呼び出したり、Plugin SDKのサブパスからこれらのヘルパーをインポートしたりすると、内部設定境界ガードによってビルドが失敗します。代わりに、`current()`、渡された`cfg`、`mutateConfigFile(...)`、または`replaceConfigFile(...)`を使用してください。
</Warning>

SDKから直接インポートする場合は、広範な`openclaw/plugin-sdk/config-runtime`互換バレルよりも、用途を限定した設定サブパスを優先してください。型には`config-contracts`、読み込み済み設定のアサーションとPluginエントリーの検索には`plugin-config-runtime`、現在のプロセススナップショットには`runtime-config-snapshot`、書き込みには`config-mutation`を使用します。バンドルPluginのテストでは、広範な互換バレルをモックする代わりに、これらの用途を限定したサブパスを直接モックしてください。

OpenClaw内部のランタイムコードも同じ方針に従います。CLI、Gateway、またはプロセス境界で設定を一度読み込み、その値を引き回します。変更の書き込みに成功すると、プロセスのランタイムスナップショットが更新され、内部リビジョンが進みます。長時間保持されるキャッシュでは、設定をローカルでシリアライズする代わりに、ランタイムが所有するキャッシュキーを使用してください。長時間稼働するランタイムモジュールには、暗黙的な`loadConfig()`呼び出しを一切許容しないスキャナーがあります。渡された`cfg`、リクエストの`context.getRuntimeConfig()`、または明示的なプロセス境界で`getRuntimeConfig()`を使用してください。

プロバイダーとチャンネルの実行パスでは、設定の読み戻しや編集用に返されたファイルスナップショットではなく、アクティブなランタイム設定スナップショットを使用する必要があります。ファイルスナップショットは、UIと書き込みのためにSecretRefマーカーなどのソース値を保持しますが、プロバイダーのコールバックには解決済みのランタイムビューが必要です。アクティブなソーススナップショットとアクティブなランタイムスナップショットのどちらでもヘルパーが呼び出される可能性がある場合は、認証情報を読み取る前に`selectApplicableRuntimeConfig()`を経由してください。

## 再利用可能なランタイムユーティリティ

ボットが作成した受信メッセージには、受信した`botLoopProtection`情報を使用してください。コアは、ポリシーを特定のチャンネルに結び付けることなく、セッションの記録とディスパッチの前に共有のインメモリスライディングウィンドウガードを適用します。このガードは`(scopeId, conversationId, participant pair)`キーを追跡し、ペアの両方向をまとめてカウントし、ウィンドウの上限を超えるとクールダウンを適用し、非アクティブなエントリーを適宜削除します。

この動作を運用者に公開するチャンネルPluginでは、基準となる上限値に共有の`channels.defaults.botLoopProtection`構造を優先し、その上にチャンネル／プロバイダー固有のオーバーライドを重ねてください。共有設定はユーザー向けであるため、秒単位を使用します。

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

正規化されたボットペア情報を、解決済みのターンとともに渡してください。コアがデフォルト値、単位変換、および`enabled`のセマンティクスを解決します。

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

共有の受信返信ランナーを経由しない、カスタムの
二者間イベントループでのみ、`openclaw/plugin-sdk/pair-loop-guard-runtime`を直接使用してください。

## ランタイム名前空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    エージェントの識別情報、ディレクトリ、およびセッション管理。

    ```typescript
    // エージェントの作業ディレクトリを解決する（agentIdは必須）
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // エージェントのワークスペースを解決する
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // エージェントの識別情報を取得する
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // デフォルトの思考レベルを取得する
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // ユーザーが指定した思考レベルをアクティブなプロバイダープロファイルに照らして検証する
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 埋め込み実行にレベルを渡す
    }

    // エージェントのタイムアウトを取得する
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // ワークスペースが存在することを保証する
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 埋め込みエージェントターンを実行する
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "最新の変更を要約してください",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)`は、Pluginコードから通常のOpenClawエージェントターンを開始するための中立的なヘルパーです。チャンネルからトリガーされる返信と同じプロバイダー／モデル解決およびエージェントハーネス選択を使用します。

    `runEmbeddedPiAgent(...)`は、既存のPlugin向けに非推奨の互換エイリアスとして残されています。新しいコードでは`runEmbeddedAgent(...)`を使用してください。

    `resolveThinkingPolicy(...)`は、プロバイダー／モデルがサポートする思考レベルと、任意のデフォルト値を返します。プロバイダーPluginは思考フックを通じてモデル固有のプロファイルを所有するため、ツールPluginではプロバイダーのリストをインポートまたは複製せず、このランタイムヘルパーを呼び出してください。

    `normalizeThinkingLevel(...)`は、`on`、`x-high`、`extra high`などのユーザーテキストを、解決済みポリシーと照合する前に、保存用の正規レベルへ変換します。

    **セッションストアヘルパー**は`api.runtime.agent.session`の下にあります。

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // 従来のsessions.json構造に依存せず、セッション行を反復処理する。
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // セッションを作成または更新してから、許可されたエージェント実行にsignalを渡す。
      },
    );
    ```

    セッションのワークフローには、`getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)`、または`upsertSessionEntry(...)`を優先してください。これらのヘルパーはエージェント／セッションの識別情報によってセッションを参照するため、Pluginは従来の`sessions.json`ストレージ構造に依存しません。セッションのアクティビティを更新しないメタデータのみのパッチには`preserveActivity: true`を使用し、コールバックが完全なエントリーを返し、削除したフィールドを削除済みのまま維持する必要がある場合にのみ`replaceEntry: true`を使用してください。Doctorおよび移行パスでは、`fallbackEntry`、`skipMaintenance`、`requireWriteSuccess`を組み合わせて、正規ストアをアトミックに修復できます。

    `createSessionEntry(...)`は、新しい正規セッション行とトランスクリプトを作成します。信頼済みの`initialEntry`で指定できる範囲は意図的に限定されています。空でない`agentHarnessId`、任意の`modelSelectionLocked: true`、および任意の`pluginExtensions`です。注入されたランタイムは、呼び出し元のPluginが`registerAgentHarness(...)`を介して所有するハーネスIDのみを受け入れます。これは所有権の不変条件であり、プロセス内Plugin間のサンドボックスではありません。既存の行がある場合は拒否されます。`label`と`spawnedCwd`は、信頼済みエントリーへのパッチではなく、個別の作成フィールドです。

    作成処理は`afterCreate`の完了までセッションライフサイクル変更フェンスを保持するため、Pluginが所有する初期化の完了まで新しい作業は待機し、既存の許可済み作業がある場合は作成に失敗します。コールバックには、作成された状態のクローンが渡されます。コールバックがパッチを返す場合、そのパッチに含められるのは`pluginExtensions`のみで、その値が最終的な`pluginExtensions`フィールド全体になります。コールバックまたは最終永続化が失敗すると、変更されていない新しい行とトランスクリプトがロールバックされます。ガード付きロールバックでは、同時に変更または取得された行は保持されます。`recoverMatchingInitialEntry: true`は、永続化された信頼済みフィールドが完全に一致する場合に中断された初期化を再試行する目的にのみ使用でき、復旧には`afterCreate`が最終パッチを返す必要があります。

    Pluginが永続化されたセッションで作業を開始する場合は、`runWithWorkAdmission(...)`を使用してください。コールバックは、アーカイブ済みまたは同時に置き換えられたセッションを拒否し、完了までアーカイブ／リセット／削除の変更を協調させ、エージェント実行へ転送する必要がある`AbortSignal`を受け取ります。ハーネスは、実験的な`delegatedExecutionPluginIds`登録フィールドを通じて、信頼済みの実行デリゲートを明示的に指定できます。デリゲートが許可および実行できるのは、完全に一致する既存のモデルロック済みセッションのみです。すべてのセッション変更は引き続きハーネス所有者に制限されます。[エージェントハーネスPlugin](/ja-JP/plugins/sdk-agent-harness#delegated-execution)を参照してください。

    メンテナンスおよび修復用Pluginでは、スコープされた単一のセッションエントリに `deleteSessionEntry(...)`、ライフサイクルが所有する一時セッションに `cleanupSessionLifecycleArtifacts(...)`、ストアを変更する前に `resolveSessionStoreBackupPaths(...)` を使用できます。これらのヘルパーは限定的な修復／ライフサイクル用サーフェスであり、汎用的なストア削除APIではありません。

    `resolveStorePath(...)` と `updateSessionStoreEntry(...)` は、セッションヘルパーを補完します。`resolveStorePath` は指定されたスコープのセッションストアパスを解決し、`updateSessionStoreEntry({ storePath, sessionKey, update })` は、呼び出し元がそのパスをすでに把握している場合に、ストアパスを指定して1つのエントリを直接更新します。

    `loadTranscriptEventsSync(...)` は、非同期のトランスクリプトランタイムを使用できない同期的なdoctorおよび修復パスで利用できます。これは生の `SessionStoreTranscriptEvent` レコードを返します。通常のPluginランタイムコードでは、`openclaw/plugin-sdk/session-transcript-runtime` を優先してください。

    `formatSqliteSessionFileMarker(...)`、`parseSqliteSessionFileMarker(...)`、`sqliteSessionFileMarkerMatchesSession(...)` は、`sessionFile` という名前のレガシーフィールドを引き続き受け取るコード向けの移行用ヘルパーです。解析されたSQLiteマーカーは、稼働中のSQLiteトランスクリプトターゲットを識別するものであり、ファイルシステムパスではありません。新しいAPIでは、マーカー文字列ではなく、型付けされたセッションID情報を渡してください。

    トランスクリプトの読み書きには、`openclaw/plugin-sdk/session-transcript-runtime` をインポートし、`{ agentId, sessionKey, sessionId }` とともに `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`readVisibleSessionTranscriptMessageEntries(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)`、または `withSessionTranscriptWriteLock(...)` を使用します。これらのAPIにより、Pluginは稼働中のトランスクリプトファイルパスに依存せずに、トランスクリプトの識別、生イベントまたはブランチセーフな可視メッセージエントリの読み取り、メッセージの追加、更新の公開、および同じトランスクリプト書き込みロック下での関連操作の実行が可能になります。`readVisibleSessionTranscriptMessageEntries(...)` は順序付きの読み取りメタデータを返します。その `seq` フィールドは再開可能なカーソルではありません。

    レガシーなストア全体および稼働中トランスクリプトファイル用のヘルパーは、Plugin SDKからエクスポートされなくなりました。セッションメタデータにはスコープされたエントリヘルパーを使用し、稼働中トランスクリプトの操作にはトランスクリプトIDヘルパーを使用してください。ファイル成果物を必要とするアーカイブ／サポートワークフローでは、稼働中のセッションランタイムAPIではなく、専用のアーカイブサーフェスを使用してください。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    デフォルトのモデルおよびプロバイダー定数：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例："gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // 例："openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    プロバイダー内部をインポートしたり、OpenClawのモデル／認証／ベースURLの準備処理を重複させたりせずに、ホスト所有のテキスト補完を実行します。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "このトランスクリプトを要約してください。" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    プロバイダーのオーケストレーションでは、HTTPリクエストを発行する前に、設定済みローカルサービスのライフサイクルを取得することもできます。

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // プロバイダーリクエストを送信し、完全に消費します。
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` は、安定した汎用プロバイダーサービスSDK契約です。ホストは `models.providers.<providerId>.localService` からプロセス設定を解決します。呼び出し元は、コマンド、引数、環境、またはライフサイクルポリシーを指定できません。プロセスの起動、準備状態、診断、およびアイドル停止ポリシーは、引き続きホスト内部で管理されます。

    設定済みの正確なプロバイダーIDと、解決済みのリクエストベースURLを渡してください。エイリアスをアダプターIDに置き換えないでください。別々のエイリアスが、別々のローカルGPUホストを参照している場合があります。ホストは、OllamaおよびLM Studioアダプターで使用される `/v1` 正規化を除き、設定済みのプロバイダーベースURLと一致しないエンドポイントを拒否します。ホストは、起動の直列化、準備状態プローブ、リクエストリース、中断処理、およびアイドル時のシャットダウンを管理します。

    このヘルパーは、OpenClawの組み込みランタイムと同じ単純補完準備パス、およびホスト所有のランタイム設定スナップショットを使用します。コンテキストエンジンにはセッションに紐付けられた `llm.complete` 機能が渡されるため、モデル呼び出しはアクティブセッションのエージェントを使用し、暗黙にデフォルトエージェントへフォールバックすることはありません。利用可能な場合、結果にはプロバイダー／モデル／エージェントの帰属情報に加え、正規化されたトークン、キャッシュ、および推定コストの使用量が含まれます。

    <Warning>
    モデルのオーバーライドには、設定で `plugins.entries.<id>.llm.allowModelOverride: true` を指定し、オペレーターがオプトインする必要があります。信頼済みPluginを特定の正規 `provider/model` ターゲットに制限するには、`plugins.entries.<id>.llm.allowedModels` を使用します。エージェントをまたぐ補完には、`plugins.entries.<id>.llm.allowAgentIdOverride: true` が必要です。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    現在のPluginの信頼済みランタイムIDを維持したまま、同一プロセス内の別のGatewayメソッドを呼び出します。これは、ループバックWebSocket接続を開かずに、Plugin所有のGateway機能を組み合わせるバンドル済みまたは信頼済みの公式Pluginを対象としています。

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    リクエストは `operator.write` スコープを使用し、管理者スコープは付与されません。任意の外部Pluginからの呼び出しは拒否されます。メソッドが失敗すると `GatewayClientRequestError` がスローされ、復旧フロー向けに構造化された `details`、再試行メタデータ、およびGatewayエラーコードが保持されます。スタンドアロンのエージェントプロセスでも実行できるツールからこのパスを選択する前に、`isAvailable()` を使用してください。

  </Accordion>
  <Accordion title="api.runtime.subagent">
    バックグラウンドのサブエージェント実行を開始および管理します。

    ```typescript
    // サブエージェント実行を開始
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "このクエリを、対象を絞った追加検索に展開してください。",
      provider: "openai", // 任意のオーバーライド
      model: "gpt-5.6-sol", // 任意のオーバーライド
      deliver: false,
    });

    // 完了を待機
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // セッションメッセージを読み取り
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // セッションを削除
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    モデルのオーバーライド（`provider`／`model`）には、設定で `plugins.entries.<id>.subagent.allowModelOverride: true` を指定し、オペレーターがオプトインする必要があります。信頼されていないPluginでもサブエージェントを実行できますが、オーバーライド要求は拒否されます。
    </Warning>

    `deleteSession(...)` は、同じPluginが `api.runtime.subagent.run(...)` を通じて作成したセッションを削除できます。任意のユーザーまたはオペレーターのセッションを削除するには、引き続き管理者スコープのGatewayリクエストが必要です。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gatewayによって読み込まれたPluginコード、またはPluginのCLIコマンドから、接続済みNodeを一覧表示し、Nodeホストのコマンドを呼び出します。別のMac上のブラウザーやオーディオブリッジなど、ペアリングされたデバイス上のローカル処理をPluginが所有する場合に使用します。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` には、各接続済みNodeがPluginまたはMCPベースのツールをエージェントに公開している場合、そのNodeが通知する `nodePluginTools` 記述子が含まれます。これらの記述子は接続のライブ状態です。Nodeが切断されるとGatewayはそれらを破棄し、ローカルのPlugin／MCPインベントリが変更された後、Nodeは `node.pluginTools.update` でそれらを置き換えることができます。

    Gateway内部では、このランタイムは同一プロセス内で動作します。PluginのCLIコマンドでは、RPC経由で設定済みのGatewayを呼び出すため、`openclaw googlemeet recover-tab` などのコマンドから、ターミナル上でペアリング済みNodeを確認できます。Nodeコマンドは引き続き、通常のGateway Nodeペアリング、コマンド許可リスト、PluginのNode呼び出しポリシー、およびNodeローカルのコマンド処理を経由します。

    Nodeでホストされるエージェントツールを公開するPluginでは、デフォルトで許可リストに追加すべき危険性のないコマンドに対して `agentTool.defaultPlatforms` を設定できます。オペレーターが `gateway.nodes.allowCommands` でオプトインする必要がある場合は、省略してください。危険なNodeホストコマンドでは、`api.registerNodeInvokePolicy(...)` を使用してNode呼び出しポリシーを登録してください。このポリシーは、コマンド許可リストの確認後、コマンドがNodeに転送される前にGateway内で実行されるため、直接の `node.invoke` 呼び出し、NodeでホストされるPluginツール、および上位レベルのPluginツールで同じ適用パスが共有されます。

    <Warning>
    任意指定の `scopes` フィールドは、呼び出し用のGatewayオペレータースコープを要求します。OpenClawがこれを受け入れるのは、バンドル済みPluginおよび信頼済みの公式Pluginインストールのみです。その他のPluginからの要求で呼び出し権限が昇格することはありません。`operator.admin` など、より厳格なGatewayスコープで信頼済みPluginがNodeコマンドを呼び出す必要がある場合にのみ使用してください。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Task FlowおよびTask Runの状態を、既存のOpenClawセッションキーまたは信頼済みツールコンテキストに紐付けます。

    - `api.runtime.tasks.managedFlows` は変更可能です。Task Flowの作成、進行、キャンセルができます。
    - `api.runtime.tasks.flows` と `api.runtime.tasks.runs` は、一覧表示およびステータス検索用の読み取り専用DTOビューです。どちらも `bindSession(...)`／`fromToolContext(...)` に加えて、`get`、`list`、`findLatest`、`resolve` を公開します。
    - `api.runtime.tasks.flow` は `managedFlows` の非推奨エイリアスです。

    Task Flowは、永続的な複数ステップのワークフロー状態を追跡します。スケジューラーではありません。将来のウェイクアップにはCronまたは `api.session.workflow.scheduleSessionTurn(...)` を使用し、その処理でフロー状態、子タスク、待機、またはキャンセルが必要な場合は、スケジュールされたターンから `managedFlows` を使用します。

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "新しいプルリクエストをレビューする",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "PR #123をレビューする",
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

    独自のバインディングレイヤーから信頼済みのOpenClawセッションキーをすでに取得している場合は、`bindSession({ sessionKey, requesterOrigin })` を使用します。生のユーザー入力からバインドしないでください。

  </Accordion>
  <Accordion title="api.runtime.tts">
    テキスト読み上げ合成。

    ```typescript
    // 標準 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "OpenClaw からこんにちは",
      cfg: api.config,
    });

    // 電話向けに最適化された TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "OpenClaw からこんにちは",
      cfg: api.config,
    });

    // 利用可能な音声を一覧表示
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    コアの `messages.tts` 設定とプロバイダー選択を使用します。PCM 音声バッファとサンプルレートを返します。ストリーミング合成には `textToSpeechStream` も利用できます。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    画像、音声、動画の分析。

    ```typescript
    // 画像を説明
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // 音声を文字起こし
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // 省略可能。MIME を推測できない場合に使用
    });

    // 動画を説明
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 汎用ファイル分析
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // 特定のプロバイダー／モデルによる構造化画像抽出。
    // 画像を少なくとも 1 つ含めます。テキスト入力は補足コンテキストです。
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "手書きのメモよりも印刷された合計額を優先してください。" },
      ],
      instructions: "販売元、合計額、検索可能なタグを抽出してください。",
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

    出力が生成されなかった場合（入力がスキップされた場合など）は、`{ text: undefined }` を返します。

    `describeImageFileWithModel(...)` は、すでに画像であると判明しているファイルを特定のプロバイダー／モデルで説明し、`describeImageFile(...)` が使用するデフォルトのアクティブモデル解決を迂回します。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換性エイリアスとして引き続き利用できます。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    画像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "夕日を描くロボット",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    画像生成と同じ形式の動画生成。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "日の出の海岸線上空を飛行するドローン映像",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    画像生成と同じ形式の音楽生成。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "コーディングセッション向けの明るいローファイトラック",
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
    現在のランタイム設定スナップショットとトランザクション形式の設定書き込み。アクティブな呼び出しパスにすでに渡されている設定を優先し、ハンドラーがプロセスのスナップショットを直接必要とする場合にのみ `current()` を使用してください。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` と `replaceConfigFile(...)` は `followUp` 値（たとえば `{ mode: "restart", requiresRestart: true, reason }`）を返します。この値は、再起動の制御を Gateway から奪うことなく、書き込み側の意図を記録します。

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 非推奨の互換性エイリアス。
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` は通常の集約タイマーを迂回し、単一の Heartbeat サイクルを直ちに実行します。デフォルトの `target: "none"` による抑制ではなく、最後にアクティブだったチャネルへ強制的に配信するには、`{ heartbeat: { target: "last" } }` を渡します。

    `runCommandWithTimeout(...)` は、キャプチャされた `stdout` と `stderr`、省略可能な切り詰め件数、`code`、`signal`、`killed`、`termination`、`noOutputTimedOut` を返します。子プロセスが 0 以外の終了コードを返さない場合、タイムアウトおよび無出力タイムアウトの結果では `code: 124` が報告されます。タイムアウト以外のシグナル終了でも `code: null` が返される可能性があるため、タイムアウトの理由を区別するには `termination` と `noOutputTimedOut` を使用してください。

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
    モデルおよびプロバイダーの認証解決。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // プロバイダーのランタイム交換（OAuth 更新など）を含む、リクエスト実行可能な認証
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状態ディレクトリの解決と、SQLite を基盤とするキー付きストレージ。

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

    キー付きストアは再起動後も保持され、ランタイムに関連付けられた Plugin ID ごとに分離されます。アトミックな重複排除の確保には `registerIfAbsent(...)` を使用します。キーが存在しないか期限切れで、新たに登録された場合は `true` を返します。有効な値がすでに存在する場合は、その値、作成時刻、TTL を上書きせずに `false` を返します。制限は、名前空間ごとに `maxEntries`、Plugin ごとに有効な行 50,000 件、64KB 未満の JSON 値、および省略可能な TTL の有効期限です。デフォルトでは、いずれかの行数制限に達した状態で書き込むと、書き込み対象の名前空間から最も古い有効な行が削除されます。この書き込みによって兄弟名前空間から行が削除されることはなく、名前空間内で十分な行を解放できない場合は書き込みが失敗します。決して削除されてはならない永続的な所有権レコードには、`overflowPolicy: "reject-new"` を設定してください。いずれかの制限に達すると新しいキーは失敗しますが、既存のキーは引き続き更新できます。

    `openSyncKeyedStore<T>(...)` は、待機できない呼び出し元向けに、同期メソッドを備えた同じ形式のストアを返します（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` はすべて、Promise ではなく値を直接返します）。

    `openChannelIngressQueue<TPayload>(...)` は、呼び出し元の Plugin をスコープとする永続化された受信キューを開きます。これは、再起動をまたいで少なくとも 1 回の処理が必要な受信イベントをバッファリングするためのものです。古い確保の復旧で `shouldRecover` を使用する場合、破損した確保済みペイロードを隔離する必要があるなら `shouldRecoverCorrupt` も指定してください。そのペイロードに依存しない確保 ID により、キューが行をトゥームストーン化する前に、Plugin は有効な所有者とレーンのポリシーを維持できます。

    <Warning>
    このリリースでは、`openKeyedStore`、`openSyncKeyedStore`、`openChannelIngressQueue` は、同梱 Plugin および信頼された公式 Plugin のインストールでのみ利用できます。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    チャネル固有のランタイムヘルパー（チャネル Plugin が読み込まれている場合に利用可能）。関心事ごとに分類されています。

    | グループ | 目的 |
    | --- | --- |
    | `text` | チャンク分割（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、制御コマンドの検出、Markdown テーブルの変換。 |
    | `reply` | バッファリングされたブロック応答のディスパッチ、エンベロープの書式設定、有効なメッセージ／人間らしい遅延設定の解決。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、許可リストの読み取り、ペアリングリクエストのアップサート。 |
    | `media` | リモートメディアのダウンロード／保存（下記参照）。 |
    | `activity` | チャネルの最終アクティビティを記録／読み取り。 |
    | `session` | 受信イベントからのセッションメタデータ、最終ルートの更新。 |
    | `mentions` | メンションポリシーのヘルパー（下記参照）。 |
    | `reactions` | 処理中インジケーター用の確認リアクションハンドル。 |
    | `groups` | グループポリシーとメンション必須設定の解決。 |
    | `debounce` | 受信メッセージのデバウンス。 |
    | `commands` | コマンドの認可とテキストコマンドのゲーティング。 |
    | `outbound` | チャネルの送信アダプターを読み込む。 |
    | `inbound` | 受信イベントコンテキストを構築し、共有の受信イベント／応答カーネルを実行する。 |
    | `threadBindings` | バインドされたセッションスレッドのアイドルタイムアウト／最大存続期間を調整する。 |
    | `runtimeContexts` | プロセスローカルなチャネル／アカウント／ケイパビリティごとのコンテキストを登録、読み取り、監視する。 |

    `api.runtime.channel.media` は、チャネルメディアのダウンロードと保存に推奨されるサーフェスです。

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    リモート URL を OpenClaw メディアにする場合は、`saveRemoteMedia(...)` を使用します。Plugin が Plugin 所有の認証、リダイレクト、または許可リスト処理を使用してすでに `Response` を取得済みの場合は、`saveResponseMedia(...)` を使用します。Plugin が検査、変換、復号、または再アップロードのために生のバイト列を必要とする場合にのみ、`readRemoteMediaBuffer(...)` を使用します。`fetchRemoteMedia(...)` は、引き続き `readRemoteMediaBuffer(...)` の非推奨互換エイリアスです。

    `api.runtime.channel.mentions` は、ランタイム注入を使用する同梱チャネル Plugin 向けの共有受信メンションポリシーサーフェスです。

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

    利用可能なメンションヘルパー：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` は、意図的に旧式の `resolveMentionGating*` 互換ヘルパーを公開していません。正規化された `{ facts, policy }` パスを優先してください。

    `reply`、`session`、`inbound` 配下のいくつかのフィールドには、現在のチャネルターンカーネルまたはチャネル送信アダプターを指すフィールドごとの `@deprecated` 注記があります。新しいコードを特定のヘルパー上に構築する前に、そのヘルパーのインライン JSDoc を確認してください。

  </Accordion>
</AccordionGroup>

## ランタイム参照の保存

`register` コールバックの外部で使用するランタイム参照を保存するには、`createPluginRuntimeStore` を使用します。

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
      return store.getRuntime(); // 初期化されていない場合は例外をスローする
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 初期化されていない場合は null を返す
    }
    ```

  </Step>
</Steps>

<Note>
ランタイムストアの識別子には `pluginId` を優先してください。低レベルの `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とする、まれなケース向けです。
</Note>

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは以下も提供します。

<ParamField path="api.id" type="string">
  Plugin ID。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin の表示名。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  現在の設定スナップショット（利用可能な場合は、アクティブなメモリ内ランタイムスナップショット）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` から取得した Plugin 固有の設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  スコープ付きロガー（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在の読み込みモード：`"full"`（ライブ有効化）、`"discovery"`／`"tool-discovery"`（読み取り専用のケイパビリティ検出）、`"setup-only"`（軽量なセットアップエントリ）、`"setup-runtime"`（ランタイムチャネルエントリも必要とするセットアップフロー）、または `"cli-metadata"`（CLI コマンドメタデータの収集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin ルートを基準にパスを解決します。
</ParamField>

## 関連項目

- [Plugin の内部構造](/ja-JP/plugins/architecture) — ケイパビリティモデルとレジストリ
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` のオプション
- [SDK の概要](/ja-JP/plugins/sdk-overview) — サブパスリファレンス
