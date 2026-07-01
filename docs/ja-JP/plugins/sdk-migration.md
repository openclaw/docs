---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Plugin を最新の Plugin アーキテクチャに更新している
    - 外部の OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新のPlugin SDKへ移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-07-01T12:48:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換レイヤーから、焦点を絞ったドキュメント化済み import を備えた最新の Plugin
アーキテクチャへ移行しました。あなたの Plugin が新しいアーキテクチャ以前に構築されたものなら、
このガイドが移行を支援します。

## 変更点

旧 Plugin システムは、Plugin が必要なものを単一のエントリーポイントから何でも import できる
2 つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個の
  ヘルパーを再エクスポートする単一の import です。新しい Plugin アーキテクチャが構築されている間、
  古いフックベースの Plugin を動作させ続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、配送キュー、fetch/proxy ヘルパー、
  ファイルヘルパー、承認型、無関係なユーティリティを混在させた、広範なランタイムヘルパーバレルです。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中に非推奨の直接 load/write ヘルパーをまだ保持している、
  広範な設定互換バレルです。
- **`openclaw/extension-api`** - 埋め込みエージェントランナーのようなホスト側ヘルパーへ Plugin が直接アクセスできるようにする
  ブリッジです。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの埋め込みランナーイベントを監視できた、
  削除済みの埋め込みランナー専用バンドル拡張フックです。

広範な import サーフェスは現在 **非推奨** です。ランタイムではまだ動作しますが、
新しい Plugin はこれらを使用してはならず、既存の Plugin は次のメジャーリリースで削除される前に
移行する必要があります。埋め込みランナー専用の拡張ファクトリ登録 API は削除されました。代わりにツール結果ミドルウェアを使用してください。

OpenClaw は、置き換えを導入するのと同じ変更で、ドキュメント化された Plugin の動作を削除したり再解釈したりしません。
破壊的な契約変更は、まず互換アダプター、診断、ドキュメント、非推奨期間を経る必要があります。
これは SDK import、マニフェストフィールド、セットアップ API、フック、ランタイム登録動作に適用されます。

<Warning>
  後方互換レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している Plugin は、その時点で壊れます。
  レガシーの埋め込み拡張ファクトリ登録は、すでに読み込まれなくなっています。
</Warning>

## 変更理由

旧アプローチには問題がありました。

- **起動が遅い** - 1 つのヘルパーを import すると、数十個の無関係なモジュールが読み込まれる
- **循環依存** - 広範な再エクスポートにより、import サイクルを作りやすい
- **不明確な API サーフェス** - どの export が安定版で、どれが内部用かを判断する方法がない

最新の Plugin SDK はこれを修正します。各 import パス（`openclaw/plugin-sdk/\<subpath\>`）は、
明確な目的とドキュメント化された契約を持つ、小さな自己完結型モジュールです。

バンドルチャンネル向けのレガシー provider 便利シームも廃止されました。
チャンネルブランド付きヘルパーシームは非公開のモノレポショートカットであり、安定した
Plugin 契約ではありません。代わりに、狭い汎用 SDK サブパスを使用してください。バンドルされた
Plugin ワークスペース内では、provider 所有のヘルパーをその Plugin 自身の `api.ts` または
`runtime-api.ts` に保持してください。

現在のバンドル provider 例:

- Anthropic は Claude 固有のストリームヘルパーを自身の `api.ts` /
  `contract-api.ts` シームに保持します
- OpenAI は provider ビルダー、デフォルトモデルヘルパー、リアルタイム provider
  ビルダーを自身の `api.ts` に保持します
- OpenRouter は provider ビルダーとオンボーディング/設定ヘルパーを自身の
  `api.ts` に保持します

## Talk とリアルタイム音声の移行計画

リアルタイム音声、電話、会議、ブラウザー Talk コードは、
サーフェスローカルのターン記録から、`openclaw/plugin-sdk/realtime-voice` がエクスポートする共有 Talk セッションコントローラーへ移行しています。
新しいコントローラーは、共通の Talk イベントエンベロープ、アクティブターン状態、キャプチャ状態、出力音声状態、最近の
イベント履歴、古いターンの拒否を所有します。Provider Plugin はベンダー固有のリアルタイムセッションを引き続き所有し、
サーフェス Plugin はキャプチャ、再生、電話、会議の癖を引き続き所有する必要があります。

この Talk 移行は、意図的に破壊的かつクリーンです。

1. 共有コントローラー/ランタイムプリミティブを
   `plugin-sdk/realtime-voice` に保持します。
2. バンドルされたサーフェスを共有コントローラーへ移行します: ブラウザーリレー、
   管理ルームハンドオフ、音声通話リアルタイム、音声通話ストリーミング STT、Google
   Meet リアルタイム、ネイティブ push-to-talk。
3. 古い Talk RPC ファミリーを最終版の `talk.session.*` と
   `talk.client.*` API に置き換えます。
4. Gateway
   `hello-ok.features.events` で、1 つのライブ Talk イベントチャンネル `talk.event` を通知します。
5. 古いリアルタイム HTTP エンドポイントと、リクエスト時の命令
   override パスを削除します。

新しいコードは、低レベルアダプターまたはテストフィクスチャを実装している場合を除き、
`createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有コントローラーを優先することで、
ターン id なしでターンスコープイベントが発行されず、古い `turnEnd` /
`turnCancel` 呼び出しが新しいアクティブターンをクリアできず、出力音声ライフサイクル
イベントが電話、会議、ブラウザーリレー、管理ルームハンドオフ、ネイティブ Talk クライアント間で一貫します。

目標とする公開 API 形状は次のとおりです。

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ブラウザー所有の WebRTC/provider-websocket セッションは `talk.client.create` を使用します。
ブラウザーが provider ネゴシエーションとメディアトランスポートを所有し、Gateway が認証情報、命令、ツールポリシーを所有するためです。
`talk.session.*` は、gateway-relay リアルタイム、gateway-relay
文字起こし、管理ルームのネイティブ STT/TTS セッション向けの共通 Gateway 管理サーフェスです。

`talk.provider` /
`talk.providers` の横にリアルタイムセレクターを配置していたレガシー設定は、`openclaw doctor --fix` で修復する必要があります。ランタイム Talk
は、音声/TTS provider 設定をリアルタイム provider 設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは意図的に小さくなっています。

| モード            | トランスポート       | ブレイン           | 所有者              | 注記                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 全二重 provider 音声を Gateway 経由でブリッジします。ツール呼び出しは agent-consult ツール経由でルーティングされます。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | ストリーミング STT のみ。呼び出し元は入力音声を送信し、文字起こしイベントを受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ/クライアントルーム | クライアントがキャプチャ/再生を所有し、Gateway がターン状態を所有する、push-to-talk とトランシーバー形式のルームです。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ネイティブ/クライアントルーム | Gateway ツールアクションを直接実行する、信頼済みファーストパーティサーフェス向けの管理者専用ルームモードです。                  |

削除されたメソッドの対応表:

| 旧                               | 新                                                       |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` または `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一された制御語彙も、意図的に狭くなっています。

  | メソッド                        | 適用先                                                  | 契約                                                                                                                                                                                   |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションに base64 PCM 音声チャンクを追加します。                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room のユーザーターンを開始します。                                                                                                                                           |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn 検証後にアクティブなターンを終了します。                                                                                                                                   |
  | `talk.session.cancelTurn`       | すべての Gateway 所有セッション                         | ターンのアクティブなキャプチャ/プロバイダー/エージェント/TTS 作業をキャンセルします。                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずにアシスタント音声出力を停止します。                                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | リレーが発行したプロバイダーツール呼び出しを完了します。中間出力には `options.willContinue` を渡し、別のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡します。 |
  | `talk.session.steer`            | エージェントに裏付けられた Talk セッション              | Talk セッションから解決されたアクティブな埋め込み実行に、音声の `status`、`steer`、`cancel`、または `followup` 制御を送信します。                                                     |
  | `talk.session.close`            | すべての統合セッション                                  | リレーセッションを停止するか managed-room 状態を取り消してから、統合セッション ID を忘れます。                                                                                       |

  これを機能させるために、プロバイダーやプラットフォーム固有の特例を core に導入しないでください。
  core は Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。
  音声通話と Google Meet はテレフォニー/会議アダプターを所有します。ブラウザーとネイティブ
  アプリはデバイスのキャプチャ/再生 UX を所有します。

  ## 互換性ポリシー

  外部 Plugin の互換性作業は、次の順序に従います。

  1. 新しい契約を追加する
  2. 互換性アダプター経由で古い動作を接続したままにする
  3. 古いパスと置き換え先を名指しする診断または警告を出力する
  4. 両方のパスをテストでカバーする
  5. 非推奨化と移行パスを文書化する
  6. 告知済みの移行期間後、通常はメジャーリリースでのみ削除する

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できます。コンパクトな件数には
  `pnpm plugins:boundary-report:summary`、1 つの Plugin または互換性オーナーには
  `--owner <id>`、期限到来の互換性レコード、オーナーをまたぐ予約済み SDK インポート、または未使用の予約済み SDK
  サブパスで CI gate を失敗させる必要がある場合は
  `pnpm plugins:boundary-report:ci` を使用します。このレポートは、非推奨の
  互換性レコードを削除日ごとにグループ化し、ローカルのコード/ドキュメント参照を数え、
  オーナーをまたぐ予約済み SDK インポートを表示し、プライベートな
  memory-host SDK ブリッジを要約するため、互換性クリーンアップを
  その場限りの検索に頼らず明示的に保てます。予約済み SDK サブパスには追跡されたオーナー使用状況が必要です。
  未使用の予約済みヘルパーエクスポートは公開 SDK から削除するべきです。

  manifest フィールドがまだ受け入れられている場合、Plugin 作者は
  ドキュメントと診断が別の指示を出すまで使い続けられます。新しいコードでは文書化された
  置き換え先を優先するべきですが、既存の Plugin は通常のマイナー
  リリース中に壊れるべきではありません。

  ## 移行方法

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    bundled Plugin は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきです。アクティブな呼び出しパスに
    すでに渡されている config を優先してください。現在のプロセススナップショットが必要な長寿命ハンドラーは
    `api.runtime.config.current()` を使用できます。長寿命の
    エージェントツールは、config 書き込み前に作成されたツールでも更新済みの
    runtime config を見られるように、`execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用するべきです。

    config 書き込みはトランザクションヘルパーを経由し、
    書き込み後ポリシーを選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元がその変更にはクリーンな Gateway 再起動が必要だと分かっている場合は
    `afterWrite: { mode: "restart", reason: "..." }` を使用し、
    呼び出し元が後続処理を所有していてリロードプランナーを意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用してください。
    ミューテーション結果には、テストとロギング用の型付き `followUp` サマリーが含まれます。
    再起動の適用またはスケジュールは Gateway が引き続き責任を持ちます。
    `loadConfig` と `writeConfigFile` は、移行期間中の外部 Plugin 向けの非推奨互換性
    ヘルパーとして残り、
    `runtime-config-load-write` 互換性コードで一度だけ警告します。bundled Plugin とリポジトリの
    runtime コードは、
    `pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` の scanner guardrails によって保護されます。新しい production Plugin の使用は
    即座に失敗し、直接 config 書き込みも失敗します。Gateway server メソッドは
    request runtime snapshot を使う必要があり、runtime channel send/action/client helper は
    境界から config を受け取る必要があり、長寿命 runtime module では
    ambient な `loadConfig()` 呼び出しは一切許可されません。

    新しい Plugin コードでは、広範な
    `openclaw/plugin-sdk/config-runtime` 互換性 barrel のインポートも避けるべきです。用途に合う狭い
    SDK サブパスを使用してください。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig` などの Config 型 | `openclaw/plugin-sdk/config-contracts` |
    | ロード済み config アサーションと plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在の runtime snapshot の読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 書き込み | `openclaw/plugin-sdk/config-mutation` |
    | Session store helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helper | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session override | `openclaw/plugin-sdk/model-session-runtime` |

    bundled Plugin とそのテストは、広範な
    barrel に対して scanner で保護されているため、インポートと mock は必要な動作にローカルなままになります。広範な
    barrel は外部互換性のためにまだ存在しますが、新しいコードはそれに
    依存するべきではありません。

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    bundled Plugin は、embedded-runner 専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを、
    runtime-neutral middleware に置き換える必要があります。

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時に Plugin manifest を更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    installed Plugin も、明示的に有効化され、
    `contracts.agentToolResultMiddleware` に対象 runtime をすべて宣言している場合は、
    ツール結果 middleware を登録できます。宣言されていない installed middleware
    登録は拒否されます。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    approval 対応 channel Plugin は、現在
    `approvalCapability.nativeRuntime` と共有 runtime-context registry を通じてネイティブ approval 動作を公開します。

    主な変更:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval 固有の auth/delivery を legacy `plugin.auth` /
      `plugin.approvals` wiring から `approvalCapability` に移す
    - `ChannelPlugin.approvals` は公開 channel-plugin
      契約から削除されました。delivery/native/render フィールドを `approvalCapability` に移してください
    - `plugin.auth` は channel の login/logout フロー専用として残ります。そこにある approval auth
      hook は core によってもう読み取られません
    - client、token、Bolt
      app などの channel 所有 runtime object は `openclaw/plugin-sdk/channel-runtime-context` 経由で登録する
    - native approval handler から Plugin 所有の reroute notice を送信しないでください。
      core は現在、実際の delivery result から routed-elsewhere notice を所有します
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` surface を提供してください。部分的な stub は拒否されます。

    現在の approval capability
    layout については `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決の Windows
    `.cmd`/`.bat` wrapper は、明示的に
    `allowShellFallback: true` を渡さない限り fail closed になりました。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    呼び出し元が shell fallback に意図的に依存していない場合は、
    `allowShellFallback` を設定せず、代わりにスローされた error を処理してください。

  </Step>

  <Step title="Find deprecated imports">
    Plugin で、次のいずれかの非推奨 surface からのインポートを検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    古い surface からの各 export は、特定の現代的な import path に対応します。

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host 側の helper には、直接インポートする代わりに
    注入された Plugin runtime を使用してください:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同じパターンは他のレガシーブリッジヘルパーにも適用されます。

    | 古い import | 最新の同等機能 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | セッションストアヘルパー | `api.runtime.agent.session.*` |

  </Step>

  <Step title="広範な infra-runtime import を置き換える">
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、新しいコードでは、実際に必要な対象を絞ったヘルパーサーフェスを import する必要があります。

    | 必要なもの | Import |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat の wake、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューの drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリ重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | dispatcher 対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよび保護付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードおよびコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク並行実行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドル済み Plugin は `infra-runtime` に対してスキャナーで保護されているため、リポジトリコードが広範な barrel に回帰することはありません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用する必要があります。
    古い route-key 名と comparable-target 名は移行期間中の互換性エイリアスとして残りますが、新しい Plugin では、動作を直接説明するルート名を使用する必要があります。

    | 古いヘルパー | 最新のヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、Cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーに基づく loaded-route ヘルパー（`parseExplicitTargetForLoadedChannel` または `resolveRouteTargetForLoadedChannel`）、または `plugin-sdk/channel-route` の `resolveChannelRouteTargetWithParser(...)` の新しい使用を追加しないでください。
    これらのフックは非推奨であり、移行期間中に古い Plugin のためだけに残されています。新しいチャネル Plugin では、ターゲット ID の正規化とディレクトリミス時のフォールバックに `messaging.targetResolver.resolveTarget(...)`、core が早期にピア種別を必要とする場合に `messaging.inferTargetChatType(...)`、provider ネイティブのセッションおよびスレッド ID に `messaging.resolveOutboundSessionRoute(...)` を使用する必要があります。

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import パスリファレンス

  <Accordion title="一般的なインポートパス表">
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の Plugin エントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャンネルエントリ定義/ビルダー用のレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャンネルエントリ定義とビルダーに特化 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | `createSetupTranslator`, インポート安全なセットアップパッチアダプター、検索メモヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委任セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウントリスト/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウント ID ヘルパー | `DEFAULT_ACCOUNT_ID`, アカウント ID 正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 限定的なアカウントヘルパー | アカウントリスト/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 加えて `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーと DM アクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャンネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClaw が保守するバンドル Plugin のみ。新しい Plugin は Plugin ローカルのスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守されているバンドル Plugin には `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/channel-inbound` | 受信補助ヘルパー | コンテキスト構築、フォーマット、ルート、ランナー、準備済み返信ディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決には Plugin 所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共有送信メディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | 送信メッセージライフサイクルヘルパー | メッセージアダプター、受領、耐久送信ヘルパー、ライブプレビュー/ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、送信 ID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト用のエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャンネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続的な Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/Plugin インストールヘルパー |
  | `plugin-sdk/runtime-env` | 限定的なランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin ランタイムヘルパー | Plugin コマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有 Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有実行ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンドフォーマット、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアント、イベントループ準備済み開始ヘルパー、公開 LAN ホスト解決、チャンネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を優先 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | バンドル Telegram 契約サーフェスが利用できない場合のフォールバック安定な Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | 実行/Plugin 承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ実行承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共有承認 Gateway 解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャンネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gateway 境界を優先 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | 実行/Plugin 承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャンネルランタイムコンテキストヘルパー | 汎用チャンネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DM ゲーティング、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | 固定ディスパッチャー、保護付き fetch、SSRF ポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat ヘルパー | Heartbeat ウェイク、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリ重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 実行承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーフォーマットヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済み fetch/プロキシヘルパー | `resolveFetch`, プロキシヘルパー、EnvHttpProxyAgent オプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リストのフォーマットと入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェスヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、動的引数メニューフォーマットを含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook 本文ガードヘルパー | リクエスト本文の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信ディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 限定的な返信ディスパッチヘルパー | ファイナライズ、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの非推奨マップヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdown チャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-at ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態と OAuth ディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキー ヘルパー | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネルステータスヘルパー | チャネル/アカウントステータスの概要ビルダー、ランタイム状態のデフォルト、Issue メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | Slug/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | リクエスト風の入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout/stderr を備えた時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通のツール/CLI パラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から標準送信ターゲットフィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダーセットアップヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダーに特化したセットアップヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダー API キーセットアップヘルパー | API キーのオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生のプロバイダー設定マージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 音声文字起こしの multipart フォームヘルパーを含む、汎用プロバイダー HTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダー web-fetch ヘルパー | web-fetch プロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | Plugin 有効化配線を必要としないプロバイダー向けの限定的な Web 検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索契約ヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの限定的な Web 検索設定/認証情報契約ヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダー転送ヘルパー | ガード付き fetch、ツール結果テキスト抽出、転送メッセージ変換、書き込み可能な転送イベントストリームなどのネイティブプロバイダー転送ヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア取得/変換/保存ヘルパー、ffprobe ベースの動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成の共有フェイルオーバーヘルパー、候補選択、不足モデルメッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキスト分割ヘルパー | 送信テキスト分割ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェント応答キュー、アクティブ実行の音声制御、トランスクリプト/イベント健全性、エコー抑制、相談質問マッチング、強制相談調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と、画像アセット/data URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | チャネル設定プリミティブ | 限定的なチャネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャネル設定書き込みヘルパー | チャネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャネルプレリュード | 共有チャネル Plugin プレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャネルステータスヘルパー | 共有チャネルステータススナップショット/概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | Allowlist 設定ヘルパー | Allowlist 設定編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM ガードヘルパー | 暗号化前の限定的なガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャネル/ステータスと環境プロキシヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨の Webhook パスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨の Zod 互換再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドル済み memory-core ヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーはそれぞれの所有 Plugin に存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | 非推奨のメモリイベントエイリアス | `plugin-sdk/memory-host-events` を使用 |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダー中立のメモリホストコアランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダー中立のメモリホストイベントジャーナルヘルパーエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ隣接 Plugin 向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | アクティブメモリ検索ファサード | 遅延 active-memory 検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの特化したリポジトリローカルテストサブパスを使用 |
</Accordion>

この表は意図的に共通の移行サブセットのみを示しており、SDK
サーフェス全体ではありません。コンパイラーのエントリーポイント目録は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、
公開サブセットから生成されます。

予約済みのバンドル Plugin ヘルパー継ぎ目は、公開 SDK
エクスポートマップから廃止されました。ただし、公開済みの
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の
`plugin-sdk/discord` shim など、明示的に文書化された互換性ファサードは例外です。
所有者固有のヘルパーは、所有する Plugin パッケージ内にあります。共有ホストの
挙動は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、
`plugin-sdk/plugin-config-runtime` などの汎用 SDK 契約を通すべきです。

用途に合う最も狭いインポートを使用してください。エクスポートが見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、どの汎用契約がそれを所有すべきかを
メンテナーに確認してください。

## アクティブな非推奨

Plugin SDK、プロバイダー契約、ランタイムサーフェス、マニフェスト全体に適用される、
より狭い非推奨項目です。各項目は現在も動作しますが、将来のメジャーリリースで
削除されます。各項目の下のエントリーは、古い API を正規の置き換え先へ対応付けます。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。より狭いサブパスからインポートするだけです。`command-auth`
    は互換性 stub としてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="メンションゲートヘルパー → resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` の
    `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })` - 2 つに分かれた
    呼び出しではなく、単一の判定オブジェクトを返します。

    下流のチャンネル Plugin (Slack、Discord、Matrix、MS Teams) はすでに
    切り替え済みです。

  </Accordion>

  <Accordion title="チャンネルランタイム shim とチャンネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は古いチャンネル Plugin 向けの互換性 shim です。
    新しいコードからはインポートしないでください。ランタイムオブジェクトの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    生の「actions」チャンネルエクスポートとともに非推奨です。代わりに、
    セマンティックな `presentation` サーフェスを通じて機能を公開してください。
    チャンネル Plugin は、受け入れる生のアクション名ではなく、何をレンダリングするか
    (カード、ボタン、セレクト) を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーツールの tool() ヘルパー → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` ファクトリー。

    **新**: プロバイダー Plugin 上で `createTool(...)` を直接実装します。
    OpenClaw はツールラッパーの登録に SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキストのチャンネルエンベロープ → BodyForAgent">
    **旧**: 受信チャンネルメッセージからフラットなプレーンテキストのプロンプト
    エンベロープを構築する `formatInboundEnvelope(...)` (および
    `ChannelMessageForAgent.channelEnvelope`)。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャンネル
    Plugin は、ルーティングメタデータ (スレッド、トピック、返信先、リアクション) を
    プロンプト文字列に連結するのではなく、型付きフィールドとして付与します。
    `formatAgentEnvelope(...)` ヘルパーは、合成されたアシスタント向けエンベロープでは
    引き続きサポートされていますが、受信プレーンテキストエンベロープは廃止へ向かっています。

    影響範囲: `inbound_claim`、`message_received`、および `channelEnvelope` テキストを
    後処理していたカスタムチャンネル Plugin。

  </Accordion>

  <Accordion title="deactivate フック → gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。イベントとコンテキストは同じシャットダウン
    クリーンアップ契約です。変更されるのはフック名だけです。

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` は、2026-08-16 以降まで非推奨の互換性エイリアスとして
    配線されたままです。

  </Accordion>

  <Accordion title="subagent_spawning フック → core thread binding">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: core に、チャンネル session-binding アダプターを通じて `thread: true` の
    サブエージェント binding を準備させます。起動後の観測にのみ
    `api.on("subagent_spawned", handler)` を使用してください。

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult`、および
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` は、外部 Plugin の移行中に限り、
    非推奨の互換性サーフェスとして残ります。

  </Accordion>

  <Accordion title="プロバイダー discovery 型 → プロバイダーカタログ型">
    4 つの discovery 型エイリアスは、現在ではカタログ時代の型を薄く包むだけです。

    | 旧エイリアス              | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、レガシーの `ProviderCapabilities` 静的バッグがあります。プロバイダー Plugin は、
    静的オブジェクトではなく、`buildReplayPolicy`、`normalizeToolSchemas`、
    `wrapStreamFn` などの明示的なプロバイダーフックを使用すべきです。

  </Accordion>

  <Accordion title="Thinking ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の 3 つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、および順位付きレベルリストを持つ
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は古い保存値をプロファイル順位に基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意でマージ済みの `reasoning`、
    および任意でマージ済みのモデル `compat` facts が含まれます。プロバイダー Plugin は、
    設定されたリクエスト契約が対応している場合に限り、それらのカタログ facts を使って
    モデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作しますが、
    プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部認証プロバイダー → contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに外部認証フックを実装すること。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー env-var ルックアップ → setup.providers[].envVars">
    **旧**マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var ルックアップを、マニフェスト上の `setup.providers[].envVars` に
    ミラーします。これにより、setup/status の env メタデータが 1 か所に統合され、
    env-var ルックアップに答えるためだけに Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプター経由で
    サポートされます。

  </Accordion>

  <Accordion title="Memory Plugin 登録 → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: memory-state API 上の 1 回の呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じスロットを、単一の登録呼び出しで扱います。追加型のプロンプトおよびコーパスヘルパー
    (`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`) は影響を受けません。

  </Accordion>

  <Accordion title="Memory embedding プロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用 embedding プロバイダー契約は memory 以外でも再利用でき、新しいプロバイダーで
    サポートされる経路です。memory 固有の登録 API は、既存プロバイダーの移行中は
    非推奨の互換性として配線されたままです。Plugin 検査は、非バンドルの使用を互換性負債として
    報告します。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` からまだエクスポートされている 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は、`getSessionMessages` を優先する形で非推奨です。
    同じシグネチャです。古いメソッドは新しいメソッドへ委譲します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow` (単数形) は live task-flow アクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、flow から子タスクを作成、更新、キャンセル、
    または実行する Plugin 向けに、管理対象 TaskFlow 変更ランタイムを保持します。Plugin が
    DTO ベースの読み取りだけを必要とする場合は、`runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み extension ファクトリー → エージェント tool-result middleware">
    上記の「移行方法 → 埋め込み tool-result extension を middleware へ移行する」で説明しています。
    完全性のためここにも含めます。削除された embedded-runner 専用の
    `api.registerEmbeddedExtensionFactory(...)` 経路は、`contracts.agentToolResultMiddleware` の
    明示的なランタイムリストを伴う `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在では
    `OpenClawConfig` への 1 行エイリアスです。正規名を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドルされたチャンネル/プロバイダー Plugin 内にある extension レベルの
非推奨項目は、それぞれの `api.ts` および `runtime-api.ts` barrel 内で追跡されています。
それらはサードパーティ Plugin 契約には影響せず、ここには記載していません。
バンドル Plugin のローカル barrel を直接利用している場合は、アップグレード前にその barrel 内の
非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 起こること                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 非推奨のサーフェスが実行時警告を発します                               |
| **次のメジャーリリース** | 非推奨のサーフェスは削除され、それらをまだ使用しているPluginは失敗します |

すべてのコアPluginはすでに移行済みです。外部Pluginは
次のメジャーリリース前に移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な逃げ道であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初のPluginを構築する
- [SDK の概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) - チャネルPluginの構築
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダーPluginの構築
- [Plugin 内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
