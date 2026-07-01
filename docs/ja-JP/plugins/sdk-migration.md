---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Plugin を最新の Plugin アーキテクチャに更新している
    - 外部 OpenClaw Plugin を保守している
sidebarTitle: Migrate to SDK
summary: レガシーの後方互換性レイヤーから最新の plugin SDK に移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-07-01T07:51:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーから、焦点を絞ったドキュメント化済みインポートを備えたモダンな Plugin
アーキテクチャへ移行しました。新しいアーキテクチャ以前に Plugin を構築していた場合、このガイドが移行に役立ちます。

## 変更点

古い Plugin システムは、Plugin が必要なものを単一のエントリーポイントから何でもインポートできる、広く開かれた 2 つのサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個のヘルパーを再エクスポートする単一のインポートです。新しい Plugin
  アーキテクチャの構築中に、古いフックベースの Plugin を動作させ続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、配信キュー、フェッチ/プロキシヘルパー、
  ファイルヘルパー、承認型、無関係なユーティリティを混在させていた広範なランタイムヘルパーバレルです。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中に非推奨の直接読み込み/書き込みヘルパーをまだ保持している、
  広範な設定互換性バレルです。
- **`openclaw/extension-api`** - 埋め込みエージェントランナーのようなホスト側ヘルパーへ Plugin が直接アクセスできるようにする
  ブリッジです。
- **`api.registerEmbeddedExtensionFactory(...)`** - 削除済みの埋め込みランナー専用バンドル済み
  拡張フックで、`tool_result` などの埋め込みランナーイベントを監視できました。

広範なインポートサーフェスは現在 **非推奨** です。ランタイムではまだ動作しますが、
新しい Plugin はこれらを使用してはならず、既存の Plugin は次のメジャーリリースで削除される前に移行する必要があります。埋め込みランナー専用の拡張ファクトリー登録 API は削除されました。代わりにツール結果ミドルウェアを使用してください。

OpenClaw は、代替を導入する同じ変更で、ドキュメント化済みの Plugin の振る舞いを削除したり再解釈したりしません。
契約を破る変更は、まず互換性アダプター、診断、ドキュメント、非推奨期間を経る必要があります。
これは SDK インポート、マニフェストフィールド、セットアップ API、フック、ランタイム登録の振る舞いに適用されます。

<Warning>
  後方互換性レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだインポートしている Plugin は、その時点で壊れます。
  レガシーの埋め込み拡張ファクトリー登録は、すでに読み込まれなくなっています。
</Warning>

## 変更理由

古いアプローチには問題がありました。

- **起動が遅い** - 1 つのヘルパーをインポートすると、無関係な数十個のモジュールが読み込まれる
- **循環依存** - 広範な再エクスポートにより、インポートサイクルを作りやすかった
- **不明確な API サーフェス** - どのエクスポートが安定版で、どれが内部向けかを判別する方法がなかった

モダンな Plugin SDK はこれを修正します。各インポートパス（`openclaw/plugin-sdk/\<subpath\>`）は、
明確な目的とドキュメント化済みの契約を持つ、小さく自己完結したモジュールです。

バンドル済みチャンネル向けのレガシープロバイダー便利シームも削除されています。
チャンネルブランドのヘルパーシームは、安定した Plugin 契約ではなく、プライベートなモノレポ内ショートカットでした。
代わりに狭い汎用 SDK サブパスを使用してください。バンドル済み
Plugin ワークスペース内では、プロバイダー所有のヘルパーをその Plugin 自身の `api.ts` または
`runtime-api.ts` に保持してください。

現在のバンドル済みプロバイダーの例:

- Anthropic は Claude 固有のストリームヘルパーを自身の `api.ts` /
  `contract-api.ts` シームに保持します
- OpenAI はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
  ビルダーを自身の `api.ts` に保持します
- OpenRouter はプロバイダービルダーとオンボーディング/設定ヘルパーを自身の
  `api.ts` に保持します

## Talk とリアルタイム音声の移行計画

リアルタイム音声、テレフォニー、ミーティング、ブラウザーの Talk コードは、
サーフェスローカルなターン管理から、`openclaw/plugin-sdk/realtime-voice` がエクスポートする共有 Talk セッションコントローラーへ移行しています。新しいコントローラーは、共通の Talk
イベントエンベロープ、アクティブターン状態、キャプチャ状態、出力音声状態、直近の
イベント履歴、古いターンの拒否を所有します。プロバイダー Plugin はベンダー固有のリアルタイムセッションを引き続き所有し、サーフェス Plugin はキャプチャ、
再生、テレフォニー、ミーティング固有の癖を引き続き所有する必要があります。

この Talk 移行は、意図的に破壊的かつクリーンなものです。

1. 共有コントローラー/ランタイムプリミティブを
   `plugin-sdk/realtime-voice` に保持します。
2. バンドル済みサーフェスを共有コントローラーへ移行します: ブラウザーリレー、
   管理ルームのハンドオフ、音声通話リアルタイム、音声通話ストリーミング STT、Google
   Meet リアルタイム、ネイティブのプッシュトゥトーク。
3. 古い Talk RPC ファミリーを最終版の `talk.session.*` と
   `talk.client.*` API に置き換えます。
4. Gateway
   `hello-ok.features.events` で 1 つのライブ Talk イベントチャンネル `talk.event` を告知します。
5. 古いリアルタイム HTTP エンドポイントと、リクエスト時の命令
   オーバーライドパスを削除します。

新しいコードは、低レベルアダプターまたはテストフィクスチャを実装している場合を除き、`createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有コントローラーを優先することで、
ターン ID なしでターンスコープのイベントを送出できず、古い `turnEnd` /
`turnCancel` 呼び出しが新しいアクティブターンをクリアできず、出力音声ライフサイクル
イベントがテレフォニー、ミーティング、ブラウザーリレー、管理ルーム
ハンドオフ、ネイティブ Talk クライアント間で一貫します。

対象の公開 API 形状は次のとおりです。

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

ブラウザー所有の WebRTC/プロバイダー WebSocket セッションは `talk.client.create` を使用します。
これは、ブラウザーがプロバイダー交渉とメディア転送を所有し、一方で
Gateway が認証情報、命令、ツールポリシーを所有するためです。`talk.session.*` は、
gateway-relay リアルタイム、gateway-relay
文字起こし、管理ルームのネイティブ STT/TTS セッションに共通する Gateway 管理サーフェスです。

`talk.provider` /
`talk.providers` の横にリアルタイムセレクターを配置していたレガシー設定は、`openclaw doctor --fix` で修復してください。ランタイム Talk
は、音声/TTS プロバイダー設定をリアルタイムプロバイダー設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に小さく保たれています。

| モード            | 転送            | Brain           | 所有者             | 注記                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 全二重のプロバイダー音声を Gateway 経由でブリッジします。ツール呼び出しは agent-consult ツールを通じてルーティングされます。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | ストリーミング STT のみ。呼び出し元は入力音声を送信し、文字起こしイベントを受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ/クライアントルーム | クライアントがキャプチャ/再生を所有し、Gateway がターン状態を所有するプッシュトゥトークおよびウォーキートーキー形式のルームです。 |
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

統一された制御語彙も、意図的に狭く保たれています。

  | 方法                            | 適用対象                                                | コントラクト                                                                                                                                                                             |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションに、base64 PCM 音声チャンクを追加します。                                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room のユーザーターンを開始します。                                                                                                                                              |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 古いターンの検証後、アクティブなターンを終了します。                                                                                                                                     |
  | `talk.session.cancelTurn`       | すべての Gateway 所有セッション                         | ターンのアクティブなキャプチャ/プロバイダー/エージェント/TTS 作業をキャンセルします。                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずに、アシスタントの音声出力を停止します。                                                                                                                 |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | リレーが発行したプロバイダーのツール呼び出しを完了します。途中出力には `options.willContinue` を渡し、追加のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡します。 |
  | `talk.session.steer`            | エージェントに支えられた Talk セッション                | Talk セッションから解決されたアクティブな埋め込み実行に、音声の `status`、`steer`、`cancel`、または `followup` 制御を送信します。                                                        |
  | `talk.session.close`            | すべての統合セッション                                  | リレーセッションを停止するか managed-room 状態を取り消し、その後、統合セッション ID を忘れます。                                                                                        |

  これを動作させるために、コアへプロバイダーやプラットフォーム固有の特例を導入しないでください。
  コアは Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。
  音声通話と Google Meet は電話/会議アダプターを所有します。ブラウザーとネイティブ
  アプリはデバイスのキャプチャ/再生 UX を所有します。

  ## 互換性ポリシー

  外部 Plugin の場合、互換性対応は次の順序に従います。

  1. 新しいコントラクトを追加する
  2. 古い動作を互換性アダプター経由で配線したままにする
  3. 古いパスと置き換え先の名前を示す診断または警告を出す
  4. 両方のパスをテストでカバーする
  5. 非推奨化と移行パスを文書化する
  6. 通知済みの移行期間後、通常はメジャーリリースでのみ削除する

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できます。コンパクトな件数には `pnpm plugins:boundary-report:summary` を使い、1 つの Plugin または互換性オーナーには `--owner <id>` を使い、期限到来の互換性レコード、オーナーをまたぐ予約済み SDK インポート、または未使用の予約済み SDK サブパスで CI ゲートを失敗させる必要がある場合は
  `pnpm plugins:boundary-report:ci` を使います。このレポートは、非推奨の互換性レコードを削除日ごとにグループ化し、ローカルのコード/ドキュメント参照を数え、オーナーをまたぐ予約済み SDK インポートを表面化し、プライベートな
  memory-host SDK ブリッジを要約するため、互換性のクリーンアップはアドホック検索に頼らず明示的なまま保たれます。予約済み SDK サブパスには追跡されたオーナー使用が必要です。
  未使用の予約済みヘルパーエクスポートは公開 SDK から削除する必要があります。

  manifest フィールドがまだ受け入れられている場合、Plugin 作者はドキュメントと診断が別の指示を出すまでそれを使い続けられます。新しいコードでは文書化された置き換え先を優先するべきですが、既存の Plugin が通常のマイナーリリース中に壊れてはなりません。

  ## 移行方法

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    バンドル済み Plugin は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきです。アクティブな呼び出しパスへすでに渡されている config を優先してください。現在のプロセススナップショットが必要な長寿命ハンドラーは `api.runtime.config.current()` を使用できます。長寿命のエージェントツールは、config 書き込み前に作成されたツールでも更新後の runtime config を見られるように、`execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用するべきです。

    Config 書き込みはトランザクションヘルパーを経由し、書き込み後ポリシーを選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元がその変更にはクリーンな Gateway 再起動が必要だと分かっている場合は `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元がフォローアップを所有し、リロードプランナーを意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用します。
    ミューテーション結果には、テストとロギング用の型付き `followUp` サマリーが含まれます。
    Gateway は再起動の適用またはスケジュールを引き続き担当します。
    `loadConfig` と `writeConfigFile` は、移行期間中は外部 Plugin 向けの非推奨互換性ヘルパーとして残り、
    `runtime-config-load-write` 互換性コードで一度だけ警告します。バンドル済み Plugin とリポジトリの runtime コードは、
    `pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` のスキャナーガードレールで保護されています。新しい本番 Plugin 使用は即座に失敗し、直接 config 書き込みは失敗し、Gateway サーバーメソッドはリクエスト runtime スナップショットを使用する必要があり、runtime チャネル送信/action/client ヘルパーは境界から config を受け取る必要があり、長寿命 runtime モジュールでは ambient な `loadConfig()` 呼び出しは 1 つも許可されません。

    新しい Plugin コードでは、広範な
    `openclaw/plugin-sdk/config-runtime` 互換性 barrel のインポートも避けるべきです。作業に合う狭い
    SDK サブパスを使用してください。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig` などの config 型 | `openclaw/plugin-sdk/config-contracts` |
    | すでにロード済みの config アサーションと Plugin エントリ config 検索 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在の runtime スナップショット読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシー runtime ヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret 入力解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッションのオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル済み Plugin とそのテストは、広範な
    barrel に対してスキャナーでガードされているため、インポートとモックは必要な動作に対してローカルなままになります。広範な
    barrel は外部互換性のためにまだ存在しますが、新しいコードはそれに依存するべきではありません。

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    バンドル済み Plugin は、埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを、runtime 中立のミドルウェアに置き換える必要があります。

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時に Plugin manifest も更新します。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    インストール済み Plugin も、明示的に有効化され、対象 runtime をすべて
    `contracts.agentToolResultMiddleware` で宣言している場合は、ツール結果ミドルウェアを登録できます。未宣言のインストール済みミドルウェア登録は拒否されます。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    承認対応チャネル Plugin は、`approvalCapability.nativeRuntime` と共有 runtime-context レジストリを通じて、ネイティブ承認動作を公開するようになりました。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の auth/delivery をレガシーの `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開チャネル Plugin コントラクトから削除されています。delivery/native/render フィールドを `approvalCapability` へ移してください
    - `plugin.auth` はチャネルのログイン/ログアウトフロー専用として残ります。そこにある承認 auth
      フックはコアによって読まれなくなりました
    - client、token、Bolt
      app などのチャネル所有 runtime オブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ承認ハンドラーから Plugin 所有の再ルート通知を送信しないでください。
      コアは実際の配信結果から routed-elsewhere 通知を所有するようになりました
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、実際の `createPluginRuntime().channel` サーフェスを提供してください。部分的なスタブは拒否されます。

    現在の承認 capability レイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決の Windows
    `.cmd`/`.bat` ラッパーは、明示的に
    `allowShellFallback: true` を渡さない限り fail closed するようになりました。

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
    `allowShellFallback` を設定せず、代わりに投げられたエラーを処理してください。

  </Step>

  <Step title="Find deprecated imports">
    Plugin 内で、次のいずれかの非推奨サーフェスからのインポートを検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    古いサーフェスからの各エクスポートは、特定のモダンなインポートパスに対応します。

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

    ホスト側ヘルパーについては、直接インポートする代わりに注入された Plugin runtime を使用してください:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも適用されます。

    | 古いインポート | 最新の同等機能 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | セッションストアヘルパー | `api.runtime.agent.session.*` |

  </Step>

  <Step title="広範な infra-runtime インポートを置き換える">
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、新しいコードでは実際に必要な絞り込まれたヘルパーサーフェスをインポートする必要があります。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat の wake、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャンネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリ重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシとガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードとコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラーフォーマットヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク並行処理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値の型強制 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドルされたPluginは `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが広範な barrel に戻ることはありません。

  </Step>

  <Step title="チャンネルルートヘルパーを移行する">
    新しいチャンネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用する必要があります。
    古い route-key 名と comparable-target 名は、移行期間中は互換性エイリアスとして残りますが、新しいPluginでは挙動を直接説明するルート名を使用する必要があります。

    | 古いヘルパー | 最新のヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、Cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーに基づく loaded-route ヘルパー（`parseExplicitTargetForLoadedChannel` または `resolveRouteTargetForLoadedChannel`）、または `plugin-sdk/channel-route` の `resolveChannelRouteTargetWithParser(...)` の新しい使用を追加しないでください。
    これらのフックは非推奨であり、移行期間中に古いPluginのためだけに残されています。新しいチャンネルPluginでは、ターゲット ID の正規化とディレクトリ未検出時のフォールバックには `messaging.targetResolver.resolveTarget(...)` を、コアが早期にピア種別を必要とする場合には `messaging.inferTargetChatType(...)` を、プロバイダーのネイティブセッションとスレッド識別には `messaging.resolveOutboundSessionRoute(...)` を使用する必要があります。

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## インポートパスリファレンス

  <Accordion title="一般的なインポートパス表">
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPluginエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーのエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャネルエントリ定義とビルダーに特化 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップ翻訳器、許可リストプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | `createSetupTranslator`、インポート安全なセットアップパッチアダプター、検索メモヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime`を使用 |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントヘルパー | アカウント一覧/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウントIDヘルパー | `DEFAULT_ACCOUNT_ID`、アカウントID正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 狭い範囲のアカウントヘルパー | アカウント一覧/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、さらに `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリとDMアクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClawが保守するバンドルPluginのみ。新しいPluginはPluginローカルスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守対象のバンドルPluginには`plugin-sdk/bundled-channel-config-schema`を使用 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound`を使用 |
  | `plugin-sdk/inbound-envelope` | インバウンドエンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/channel-inbound` | インバウンド受信ヘルパー | コンテキスト構築、整形、ルート、ランナー、準備済み返信ディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには`plugin-sdk/channel-targets`、ルート比較には`plugin-sdk/channel-route`、プロバイダー固有のターゲット解決にはPlugin所有の`messaging.targetResolver` / `messaging.resolveOutboundSessionRoute`を使用 |
  | `plugin-sdk/outbound-media` | アウトバウンドメディアヘルパー | 共有アウトバウンドメディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound`を使用 |
  | `plugin-sdk/channel-outbound` | アウトバウンドメッセージライフサイクルヘルパー | メッセージアダプター、受領、永続送信ヘルパー、ライブプレビュー/ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、アウトバウンドID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound`を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound`を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト向けエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
  | `plugin-sdk/runtime-env` | 狭い範囲のランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムヘルパー | Pluginコマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有execヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンド整形、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアント、イベントループ準備済み開始ヘルパー、チャネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot`、`config-mutation`を優先 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドルTelegram契約サーフェスが利用できない場合のフォールバック安定なTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | Exec/Plugin承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化された承認表示パス整形 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブexec承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共有承認Gateway解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gatewayの継ぎ目を優先 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | Exec/Plugin承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DMゲート、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | 固定ディスパッチャー、保護付きfetch、SSRFポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeatヘルパー | Heartbeatウェイク、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリ重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲートヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`、エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/プロキシヘルパー | `resolveFetch`、プロキシヘルパー、EnvHttpProxyAgentオプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`、ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リスト整形と入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲートとコマンドサーフェスヘルパー | `resolveControlCommandGate`、送信者承認ヘルパー、動的引数メニュー整形を含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook本文ガードヘルパー | リクエスト本文読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | インバウンドディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 狭い範囲の返信ディスパッチヘルパー | 確定、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`。`buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled`などの非推奨マップヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdownチャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-atヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態とOAuthディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーのヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャンネルステータスのヘルパー | チャンネル/アカウントのステータスサマリービルダー、ランタイム状態のデフォルト、課題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲット解決ヘルパー | 共有ターゲット解決ヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエストURLヘルパー | リクエスト風の入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された標準出力/標準エラー出力を備えた時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール/CLIパラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdownテーブルヘルパー | Markdownテーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダー設定ヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換セルフホストプロバイダー向けの特化設定ヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイムAPIキー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキー設定ヘルパー | APIキーのオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準OAuth認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生プロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数ルックアップヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデルID正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダーHTTPヘルパー | 音声文字起こしのマルチパートフォームヘルパーを含む、汎用プロバイダーHTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダーWebフェッチヘルパー | Webフェッチプロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダーWeb検索設定ヘルパー | Plugin有効化配線を必要としないプロバイダー向けの限定的なWeb検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダーWeb検索コントラクトヘルパー | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの限定的なWeb検索設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダーWeb検索ヘルパー | Web検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAIスキーマのクリーンアップと診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、ストリームラッパー型、共有のAnthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付きフェッチ、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディアの取得/変換/保存ヘルパー、ffprobeベースの動画寸法調査、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル未指定メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向けの画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキストチャンク化ヘルパー | 送信用テキストチャンク化ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI互換TTSビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有WebSocketセッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェント折り返し発話キュー、アクティブ実行の音声制御、トランスクリプト/イベントの健全性、エコー抑制、相談質問マッチング、強制相談の調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と、画像アセット/データURLヘルパー、OpenAI互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダールックアップ、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダールックアップ、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 限定的なチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネル前置部 | 共有チャンネルPlugin前置部エクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータススナップショット/サマリーヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | ダイレクトDMガードヘルパー | 暗号化前の限定的なガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル/ステータスとアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhookターゲットヘルパー | Webhookターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨のWebhookパスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有Webメディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨のZod互換再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドルされたメモリコアヘルパー | メモリマネージャー/設定/ファイル/CLIヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量メモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーは所有元Pluginに存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホストQMDエンジン | メモリホストQMDエンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | 非推奨のメモリイベントエイリアス | `plugin-sdk/memory-host-events` を使用 |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストCLIランタイム | メモリホストCLIランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダー中立のメモリホストコアランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダー中立のメモリホストイベントジャーナルヘルパーエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象Markdownヘルパー | メモリ隣接Plugin向けの共有管理対象Markdownヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory検索ファサード | 遅延Active Memory検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` などの特化したリポジトリローカルテストサブパスを使用 |
</Accordion>

この表は意図的に、SDK サーフェス全体ではなく、共通の移行サブセットを示しています。コンパイラーエントリーポイントのインベントリは
`scripts/lib/plugin-sdk-entrypoints.json` にあり、パッケージエクスポートは公開サブセットから生成されます。

予約済みのバンドル Plugin ヘルパー境界は、公開 SDK エクスポートマップから廃止されています。ただし、公開済みの
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の `plugin-sdk/discord` shim など、明示的にドキュメント化された互換性ファサードは除きます。所有者固有のヘルパーは、所有する Plugin パッケージ内にあります。共有ホストの動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトを通す必要があります。

用途に合う最も狭いインポートを使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかをメンテナーに尋ねてください。

## 有効な非推奨項目

Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体に適用される、より狭い非推奨項目です。各項目は現在も動作しますが、将来のメジャーリリースで削除されます。各項目の下のエントリーは、古い API を正規の置き換え先に対応付けています。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。より狭いサブパスからインポートするだけです。`command-auth`
    は互換性スタブとしてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="メンションゲーティングヘルパー → resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` からの
    `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })` - 2 つの分割呼び出しではなく、単一の決定オブジェクトを返します。

    下流のチャンネル Plugin (Slack、Discord、Matrix、MS Teams) はすでに切り替え済みです。

  </Accordion>

  <Accordion title="チャンネルランタイム shim とチャンネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は、古いチャンネル Plugin 向けの互換性 shim です。新しいコードからインポートしないでください。ランタイムオブジェクトの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、生の「actions」チャンネルエクスポートとあわせて非推奨です。代わりに、セマンティックな `presentation` サーフェスを通じて機能を公開してください。チャンネル Plugin は、受け付ける生のアクション名ではなく、何をレンダリングするか (カード、ボタン、セレクト) を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーツール tool() ヘルパー → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` からの `tool()` ファクトリー。

    **新**: プロバイダー Plugin に `createTool(...)` を直接実装します。
    OpenClaw はツールラッパーを登録するために SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキストチャンネルエンベロープ → BodyForAgent">
    **旧**: 受信チャンネルメッセージからフラットなプレーンテキストプロンプトエンベロープを構築する
    `formatInboundEnvelope(...)` (および
    `ChannelMessageForAgent.channelEnvelope`)。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャンネル
    Plugin は、ルーティングメタデータ (スレッド、トピック、返信先、リアクション) をプロンプト文字列に連結するのではなく、型付きフィールドとして添付します。
    `formatAgentEnvelope(...)` ヘルパーは、合成されたアシスタント向けエンベロープでは引き続きサポートされますが、受信プレーンテキストエンベロープは廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および `channelEnvelope` テキストを後処理していたカスタムチャンネル Plugin。

  </Accordion>

  <Accordion title="deactivate フック → gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。イベントとコンテキストは同じシャットダウンクリーンアップコントラクトです。変更されるのはフック名だけです。

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

    `deactivate` は 2026-08-16 以降まで、非推奨の互換性エイリアスとして引き続き配線されています。

  </Accordion>

  <Accordion title="subagent_spawning フック → コアスレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: コアに、チャンネルセッションバインディングアダプターを通じて `thread: true` サブエージェントバインディングを準備させます。起動後の観測にのみ
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` は、外部 Plugin が移行する間のみ、非推奨の互換性サーフェスとして残ります。

  </Accordion>

  <Accordion title="プロバイダー検出型 → プロバイダーカタログ型">
    4 つの検出型エイリアスは、現在ではカタログ時代の型の薄いラッパーです。

    | 古いエイリアス            | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、レガシーな `ProviderCapabilities` 静的バッグも対象です。プロバイダー Plugin は、静的オブジェクトではなく、`buildReplayPolicy`、`normalizeToolSchemas`、`wrapStreamFn` などの明示的なプロバイダーフックを使用する必要があります。

  </Accordion>

  <Accordion title="Thinking ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の 3 つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、およびランク付けされたレベルリストを含む
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。OpenClaw は、古い保存値をプロファイルランクに基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意でマージされた `reasoning`、および任意でマージされたモデル `compat` ファクトが含まれます。プロバイダー Plugin は、設定済みリクエストコントラクトがサポートする場合にのみ、それらのカタログファクトを使ってモデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作し続けますが、プロファイル結果とは合成されません。

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

  <Accordion title="プロバイダー環境変数ルックアップ → setup.providers[].envVars">
    **旧** マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ環境変数ルックアップを、マニフェスト上の `setup.providers[].envVars` に反映します。これにより、セットアップ/ステータスの環境メタデータが 1 か所に統合され、環境変数ルックアップに答えるためだけに Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプターを通じて引き続きサポートされます。

  </Accordion>

  <Accordion title="メモリ Plugin 登録 → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: メモリ状態 API 上の 1 つの呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じスロットを、単一の登録呼び出しで扱います。追加型のプロンプトおよびコーパスヘルパー
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) は影響を受けません。

  </Accordion>

  <Accordion title="メモリ埋め込みプロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用埋め込みプロバイダーコントラクトはメモリ外でも再利用でき、新しいプロバイダー向けにサポートされるパスです。メモリ固有の登録 API は、既存プロバイダーが移行する間、非推奨の互換性として引き続き配線されています。
    Plugin 検査では、非バンドルの使用は互換性負債として報告されます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` から引き続きエクスポートされる 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は非推奨となり、
    `getSessionMessages` が推奨されます。同じシグネチャで、古いメソッドは新しいメソッドへ呼び出しを渡します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow` (単数形) はライブのタスクフローアクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行する Plugin 向けに、管理対象 TaskFlow ミューテーションランタイムを保持します。Plugin が DTO ベースの読み取りだけを必要とする場合は、`runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリー → エージェントツール結果ミドルウェア">
    上記の「移行方法 → 埋め込みツール結果拡張をミドルウェアへ移行する」で扱っています。完全性のためにここにも含めます。削除された埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` の明示的なランタイムリストを伴う
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在では
    `OpenClawConfig` の 1 行エイリアスです。正規の名前を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドルされたチャンネル/プロバイダー Plugin 内にある拡張レベルの非推奨項目は、それぞれの `api.ts` および `runtime-api.ts`
バレル内で追跡されています。それらはサードパーティ Plugin コントラクトには影響せず、ここには記載されていません。バンドル Plugin のローカルバレルを直接利用している場合は、アップグレード前にそのバレル内の非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 何が起こるか                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 非推奨のサーフェスは実行時警告を出力します                               |
| **次のメジャーリリース** | 非推奨のサーフェスは削除されます。まだそれらを使用しているPluginは失敗します |

すべてのコアPluginはすでに移行済みです。外部Pluginは
次のメジャーリリース前に移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定します。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な退避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初のPluginを構築する
- [SDK の概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins) - チャンネルPluginの構築
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダーPluginの構築
- [Plugin の内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
