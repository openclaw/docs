---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Plugin をモダンな Plugin アーキテクチャに更新しています
    - 外部 OpenClaw Plugin を保守している
sidebarTitle: Migrate to SDK
summary: レガシーな後方互換性レイヤーから最新のPlugin SDKへ移行する
title: Plugin SDKの移行
x-i18n:
    generated_at: "2026-05-10T19:46:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーから、焦点を絞った文書化済み import を備えるモダンな Plugin
アーキテクチャへ移行しました。あなたの Plugin が新しいアーキテクチャ以前に
作られたものなら、このガイドが移行を支援します。

## 何が変わるのか

古い Plugin システムは、Plugin が単一のエントリーポイントから必要なものを
何でも import できる、2 つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個のヘルパーを再エクスポートする単一の import。
  新しい Plugin アーキテクチャの構築中に、古いフックベースの Plugin を動かし続けるために
  導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、heartbeat 状態、配信キュー、
  fetch/proxy ヘルパー、ファイルヘルパー、承認型、無関係なユーティリティを混在させた
  広範なランタイムヘルパーバレル。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中、非推奨の直接 load/write ヘルパーを
  まだ含んでいる広範な設定互換バレル。
- **`openclaw/extension-api`** - 埋め込みエージェントランナーのようなホスト側ヘルパーへ
  Plugin が直接アクセスできるようにするブリッジ。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの埋め込みランナーイベントを
  監視できた、削除済みの Pi 専用バンドル拡張フック。

広範な import サーフェスは現在 **非推奨** です。ランタイムではまだ動作しますが、
新しい Plugin はこれらを使ってはならず、既存の Plugin は次のメジャーリリースで
削除される前に移行する必要があります。Pi 専用の埋め込み拡張ファクトリ登録 API は
削除されました。代わりに tool-result ミドルウェアを使用してください。

OpenClaw は、置き換えを導入する同じ変更で、文書化済みの Plugin 動作を削除したり
再解釈したりしません。破壊的な契約変更は、まず互換アダプター、診断、ドキュメント、
非推奨期間を経る必要があります。これは SDK import、manifest フィールド、セットアップ API、
フック、ランタイム登録動作に適用されます。

<Warning>
  後方互換性レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している Plugin は、その時点で壊れます。
  Pi 専用の埋め込み拡張ファクトリ登録は、すでに読み込まれなくなっています。
</Warning>

## なぜ変更されたのか

古いアプローチには問題がありました。

- **起動が遅い** - 1 つのヘルパーを import すると、数十個の無関係なモジュールが読み込まれる
- **循環依存** - 広範な再エクスポートにより import サイクルを作りやすかった
- **不明確な API サーフェス** - どの export が安定版で、どれが内部用かを判別する方法がなかった

モダンな Plugin SDK はこれを解決します。各 import パス（`openclaw/plugin-sdk/\<subpath\>`）は、
明確な目的と文書化済みの契約を持つ、小さく自己完結したモジュールです。

バンドルチャンネル向けのレガシーなプロバイダー利便性シームも削除されました。
チャンネル名付きのヘルパーシームは、安定した Plugin 契約ではなく、非公開のモノレポ内
ショートカットでした。代わりに、狭い汎用 SDK サブパスを使用してください。バンドル
Plugin ワークスペース内では、プロバイダー所有のヘルパーをその Plugin 自身の `api.ts` または
`runtime-api.ts` に置いてください。

現在のバンドルプロバイダー例:

- Anthropic は Claude 固有のストリームヘルパーを自分の `api.ts` /
  `contract-api.ts` シームに保持します
- OpenAI はプロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダー
  ビルダーを自分の `api.ts` に保持します
- OpenRouter はプロバイダービルダーとオンボーディング/設定ヘルパーを自分の
  `api.ts` に保持します

## Talk と realtime 音声の移行計画

Realtime 音声、電話、会議、ブラウザー Talk コードは、サーフェスローカルなターン管理から、
`openclaw/plugin-sdk/realtime-voice` が export する共有 Talk セッションコントローラーへ移行しています。
新しいコントローラーは、共通の Talk イベントエンベロープ、アクティブターン状態、キャプチャ状態、
出力音声状態、最近のイベント履歴、古いターンの拒否を所有します。プロバイダー Plugin は
ベンダー固有の realtime セッションを引き続き所有し、サーフェス Plugin はキャプチャ、再生、
電話、会議の癖を引き続き所有する必要があります。

この Talk 移行は、意図的に破壊的かつクリーンなものです。

1. 共有コントローラー/ランタイムプリミティブを
   `plugin-sdk/realtime-voice` に保持します。
2. バンドルサーフェスを共有コントローラーへ移動します: ブラウザーリレー、
   managed-room ハンドオフ、voice-call realtime、voice-call streaming STT、Google
   Meet realtime、ネイティブ push-to-talk。
3. 古い Talk RPC ファミリーを最終的な `talk.session.*` と
   `talk.client.*` API に置き換えます。
4. Gateway `hello-ok.features.events` で 1 つのライブ Talk イベントチャンネル
   `talk.event` を通知します。
5. 古い realtime HTTP エンドポイントと、リクエスト時の instruction
   override パスを削除します。

新しいコードは、低レベルアダプターまたはテストフィクスチャを実装している場合を除き、
`createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有コントローラーを優先してください。
これにより、ターン ID なしでターンスコープイベントが送信されることを防ぎ、古い `turnEnd` /
`turnCancel` 呼び出しが新しいアクティブターンを消去することを防ぎ、出力音声ライフサイクル
イベントを電話、会議、ブラウザーリレー、managed-room ハンドオフ、ネイティブ Talk クライアント間で
一貫させます。

対象となる公開 API 形状は次のとおりです。

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
```

ブラウザー所有の WebRTC/provider-websocket セッションは `talk.client.create` を使用します。
これは、ブラウザーがプロバイダーのネゴシエーションとメディアトランスポートを所有し、Gateway が
認証情報、instructions、ツールポリシーを所有するためです。`talk.session.*` は、gateway-relay realtime、
gateway-relay transcription、managed-room ネイティブ STT/TTS セッション向けの共通 Gateway 管理サーフェスです。

`talk.provider` / `talk.providers` の横に realtime selector を配置していたレガシー設定は、
`openclaw doctor --fix` で修復する必要があります。ランタイム Talk は、speech/TTS プロバイダー設定を
realtime プロバイダー設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に小さくなっています。

| モード          | トランスポート  | ブレイン        | 所有者             | メモ                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway を介してブリッジされる全二重プロバイダー音声。ツール呼び出しは agent-consult ツール経由でルーティングされます。 |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT のみ。呼び出し元は入力音声を送信し、transcript イベントを受信します。                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ/client room | クライアントがキャプチャ/再生を所有し、Gateway がターン状態を所有する push-to-talk と walkie-talkie スタイルの room。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ネイティブ/client room | Gateway ツールアクションを直接実行する、信頼済みファーストパーティサーフェス向けの管理者専用 room モード。       |

削除されたメソッド対応表:

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

| メソッド                        | 適用対象                                                | 契約                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションへ base64 PCM 音声チャンクを追加します。                                                                                               |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room ユーザーターンを開始します。                                                                                                                                                 |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 古いターンの検証後にアクティブターンを終了します。                                                                                                                                       |
| `talk.session.cancelTurn`       | すべての Gateway 所有セッション                        | ターンに対するアクティブなキャプチャ/プロバイダー/エージェント/TTS 作業をキャンセルします。                                                                                             |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 必ずしもユーザーターンを終了せずに、アシスタントの音声出力を停止します。                                                                                                                |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | リレーが送信したプロバイダーツール呼び出しを完了します。中間出力には `options.willContinue` を、別のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡します。 |
| `talk.session.close`            | すべての統一セッション                                  | リレーセッションを停止するか managed-room 状態を取り消し、その後、統一セッション ID を忘れます。                                                                                        |

  これを機能させるために、プロバイダーやプラットフォーム固有の特例をコアに導入しない。
  コアは Talk セッションのセマンティクスを所有する。Provider Plugin はベンダーセッションのセットアップを所有する。
  Voice-call と Google Meet はテレフォニー/会議アダプターを所有する。ブラウザーとネイティブ
  アプリはデバイスのキャプチャ/再生 UX を所有する。

  ## 互換性ポリシー

  外部 Plugin の互換性対応は、次の順序に従う。

  1. 新しいコントラクトを追加する
  2. 古い動作を互換性アダプター経由で接続したままにする
  3. 古いパスと置き換え先を示す診断または警告を出力する
  4. テストで両方のパスをカバーする
  5. 非推奨化と移行パスを文書化する
  6. 予告した移行期間の後にのみ削除する。通常はメジャーリリースで行う

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できる。コンパクトな件数には `pnpm plugins:boundary-report:summary` を使用し、1 つの Plugin または互換性オーナーには `--owner <id>` を使用し、期限到来の互換性レコード、オーナー横断の予約済み SDK インポート、または未使用の予約済み SDK
  サブパスで CI ゲートを失敗させるべき場合は
  `pnpm plugins:boundary-report:ci` を使用する。このレポートは、非推奨の互換性レコードを削除日ごとにグループ化し、ローカルのコード/ドキュメント参照を数え、オーナー横断の予約済み SDK インポートを明示し、プライベートなメモリホスト SDK ブリッジを要約することで、互換性のクリーンアップが場当たり的な検索に依存せず明示的に保たれるようにする。予約済み SDK サブパスには、追跡されたオーナー使用が必要である。未使用の予約済みヘルパーエクスポートは公開 SDK から削除するべきである。

  マニフェストフィールドがまだ受け付けられている場合、Plugin 作者はドキュメントと診断が別の指示をするまで使い続けることができる。新しいコードでは文書化された置き換え先を優先するべきだが、既存の Plugin が通常のマイナーリリース中に壊れてはならない。

  ## 移行方法

  <Steps>
  <Step title="ランタイム設定の読み込み/書き込みヘルパーを移行する">
    バンドル Plugin は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきである。アクティブな呼び出しパスにすでに渡されている設定を優先する。現在のプロセススナップショットが必要な長寿命ハンドラーは `api.runtime.config.current()` を使用できる。長寿命のエージェントツールは、設定書き込み前に作成されたツールでも更新後のランタイム設定を参照できるように、`execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用するべきである。

    設定書き込みはトランザクションヘルパーを経由し、書き込み後ポリシーを選択しなければならない。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元が、その変更にはクリーンな Gateway 再起動が必要だと分かっている場合は `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元がフォローアップを所有し、リロードプランナーを意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用する。
    ミューテーション結果には、テストとロギング用の型付き `followUp` サマリーが含まれる。
    Gateway は引き続き、再起動の適用またはスケジュールを担当する。
    `loadConfig` と `writeConfigFile` は移行期間中、外部 Plugin 向けの非推奨互換性ヘルパーとして残り、
    `runtime-config-load-write` 互換性コードで一度だけ警告する。バンドル Plugin とリポジトリのランタイムコードは
    `pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` のスキャナーガードレールで保護される。新しい本番 Plugin での使用は即座に失敗し、直接の設定書き込みも失敗し、Gateway サーバーメソッドはリクエストランタイムスナップショットを使わなければならず、ランタイムのチャンネル send/action/client ヘルパーは境界から設定を受け取らなければならず、長寿命ランタイムモジュールには許可されたアンビエント `loadConfig()` 呼び出しが 0 件でなければならない。

    新しい Plugin コードでは、広範な
    `openclaw/plugin-sdk/config-runtime` 互換性バレルのインポートも避けるべきである。作業に一致する狭い SDK サブパスを使用する。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig` などの設定型 | `openclaw/plugin-sdk/config-contracts` |
    | 読み込み済み設定のアサーションと Plugin エントリ設定の検索 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在のランタイムスナップショットの読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシーランタイムヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力の解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッションのオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル Plugin とそのテストは、広範なバレルに対してスキャナーでガードされているため、インポートとモックは必要な動作に対してローカルに保たれる。広範なバレルは外部互換性のためにまだ存在するが、新しいコードはそれに依存するべきではない。

  </Step>

  <Step title="Pi ツール結果拡張をミドルウェアに移行する">
    バンドル Plugin は、Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを、ランタイム中立のミドルウェアに置き換えなければならない。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時に Plugin マニフェストも更新する。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugin はツール結果ミドルウェアを登録できない。これは、モデルが見る前に高信頼のツール出力を書き換えられるためである。

  </Step>

  <Step title="approval-native ハンドラーを capability facts に移行する">
    承認対応チャンネル Plugin は、現在、`approvalCapability.nativeRuntime` と共有ランタイムコンテキストレジストリを通じて、ネイティブ承認動作を公開する。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の認証/配信を、レガシーの `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開チャンネル Plugin
      コントラクトから削除された。delivery/native/render フィールドは `approvalCapability` に移す
    - `plugin.auth` はチャンネルのログイン/ログアウトフロー専用として残る。そこにある承認認証フックは、コアではもう読み取られない
    - クライアント、トークン、Bolt
      アプリなど、チャンネルが所有するランタイムオブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ承認ハンドラーから Plugin 所有のリルート通知を送信しない。コアは実際の配信結果から routed-elsewhere 通知を所有するようになった
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、実際の `createPluginRuntime().channel` サーフェスを提供する。部分的なスタブは拒否される。

    現在の承認 capability レイアウトについては `/plugins/sdk-channel-plugins` を参照する。

  </Step>

  <Step title="Windows ラッパーフォールバック動作を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、解決されない Windows
    `.cmd`/`.bat` ラッパーは、明示的に
    `allowShellFallback: true` を渡さない限り、現在はフェイルクローズする。

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

    呼び出し元がシェルフォールバックに意図的に依存していない場合は、
    `allowShellFallback` を設定せず、代わりにスローされたエラーを処理する。

  </Step>

  <Step title="非推奨インポートを見つける">
    Plugin 内で、いずれかの非推奨サーフェスからのインポートを検索する。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点を絞ったインポートに置き換える">
    古いサーフェスからの各エクスポートは、特定の現代的なインポートパスに対応する。

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

    ホスト側ヘルパーについては、直接インポートする代わりに、注入された Plugin ランタイムを使用する。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも適用される。

    | 古いインポート | 現代的な同等物 |
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
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在するが、新しいコードでは実際に必要な焦点を絞ったヘルパーサーフェスをインポートするべきである。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat ウェイク、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャンネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリ重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシとガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードとコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 制限付き非同期タスク並行性 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値型強制 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドル Plugin は `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが広範なバレルへ逆戻りすることはできない。

  </Step>

  <Step title="チャンネルルートヘルパーを移行する">
    新しいチャンネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用するべきである。
    古い route-key 名と comparable-target 名は移行期間中、互換性エイリアスとして残るが、新しい Plugin は動作を直接説明するルート名を使用するべきである:

    | 古いヘルパー | 最新のヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、
    cron配信、セッションルーティング全体で、`{ channel, to, accountId, threadId }`を
    一貫して正規化します。Pluginがカスタムターゲット文法を所有している場合は、
    `resolveChannelRouteTargetWithParser(...)`を使用して、その
    パーサーを同じルートターゲット契約に適合させます。

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## インポートパスリファレンス

  <Accordion title="Common import path table">
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の Plugin エントリーヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャンネルエントリー定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダー用エントリーヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャンネルエントリー定義とビルダーに特化 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | 許可リストプロンプト、セットアップ状態ビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | インポート安全なセットアップパッチアダプター、ルックアップノートヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウントリスト/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウントIDヘルパー | `DEFAULT_ACCOUNT_ID`, アカウントIDの正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 範囲を絞ったアカウントヘルパー | アカウントリスト/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリと DM アクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャンネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | 同梱設定スキーマ | OpenClaw が保守する同梱 Plugin のみ。新しい Plugin は Plugin ローカルのスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨の同梱設定スキーマ | 互換性エイリアスのみ。保守中の同梱 Plugin には `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウント状態とドラフトストリームのライフサイクルヘルパー | `createAccountStatusSink`, ドラフトプレビューの確定ヘルパー |
  | `plugin-sdk/inbound-envelope` | インバウンドエンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | インバウンド返信ヘルパー | 共有の記録およびディスパッチヘルパー |
  | `plugin-sdk/messaging-targets` | メッセージングターゲットの解析 | ターゲット解析/マッチングヘルパー |
  | `plugin-sdk/outbound-media` | アウトバウンドメディアヘルパー | 共有アウトバウンドメディア読み込み |
  | `plugin-sdk/outbound-send-deps` | アウトバウンド送信依存関係ヘルパー | 完全なアウトバウンドランタイムをインポートせずに使える軽量な `resolveOutboundSendDep` 検索 |
  | `plugin-sdk/outbound-runtime` | アウトバウンドランタイムヘルパー | アウトバウンド配信、ID/送信デリゲート、セッション、整形、ペイロード計画ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト向けエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャンネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続 Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ログ/バックアップ/Plugin インストールヘルパー |
  | `plugin-sdk/runtime-env` | 範囲を絞ったランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、再試行、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin ランタイムヘルパー | Plugin コマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有 Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有 exec ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンド整形、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアント、イベントループ準備完了の開始ヘルパー、チャンネル状態パッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を推奨 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | 同梱 Telegram コントラクトサーフェスが利用できない場合のフォールバック安定な Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | Exec/Plugin 承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化された承認表示パス整形 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ exec 承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共有承認 Gateway 解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャンネルエントリーポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway の継ぎ目を推奨 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | Exec/Plugin 承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャンネルランタイムコンテキストヘルパー | 汎用チャンネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DM ゲーティング、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | 固定ディスパッチャー、保護付き fetch、SSRF ポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat ヘルパー | Heartbeat ウェイク、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | メモリ内重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップされた fetch/プロキシヘルパー | `resolveFetch`, プロキシヘルパー、EnvHttpProxyAgent オプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 再試行ヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リスト整形 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 許可リスト入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェスヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、動的引数メニュー整形を含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンド状態/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook 本文ガードヘルパー | リクエスト本文の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | インバウンドディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 範囲を絞った返信ディスパッチヘルパー | 確定、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdown チャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-at ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態ディレクトリと OAuth ディレクトリのヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャンネル状態ヘルパー | チャンネル/アカウント状態サマリービルダー、ランタイム状態デフォルト、問題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | リクエスト風入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout/stderr を持つ時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール/CLI パラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正準の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdownテーブルヘルパー | Markdownテーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | キュレーション済みローカル/セルフホストプロバイダーセットアップヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換セルフホストプロバイダー用の特化セットアップヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイムAPIキー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキーセットアップヘルパー | APIキーオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準OAuth認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生のプロバイダー設定マージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデルID正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダーHTTPヘルパー | 音声文字起こしのマルチパートフォームヘルパーを含む、汎用プロバイダーHTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダーWebフェッチヘルパー | Webフェッチプロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダーWeb検索設定ヘルパー | Plugin有効化の配線を必要としないプロバイダー向けの限定Web検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダーWeb検索コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの限定Web検索設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダーWeb検索ヘルパー | Web検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Geminiスキーマクリーンアップと診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付きフェッチ、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア取得/変換/保存ヘルパー、ffprobeベースの動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core`を使用 |
  | `plugin-sdk/text-chunking` | テキスト分割ヘルパー | 送信テキスト分割ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI互換TTSビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有WebSocketセッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェントトークバックキュー、トランスクリプト/イベントヘルス、エコー抑制、高速コンテキスト参照ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と、画像アセット/データURLヘルパー、OpenAI互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 限定チャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプレリュード | 共有チャンネルPluginプレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータススナップショット/要約ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm` | 直接DMヘルパー | 共有直接DM認証/ガードヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル/ステータスとアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhookターゲットヘルパー | Webhookターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨のWebhookパスエイリアス | `plugin-sdk/webhook-ingress`を使用 |
  | `plugin-sdk/web-media` | 共有Webメディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨のZod互換再エクスポート | `zod`から`zod`を直接インポート |
  | `plugin-sdk/memory-core` | バンドル済みmemory-coreヘルパー | メモリマネージャー/設定/ファイル/CLIヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーは、それぞれの所有Pluginに存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホストQMDエンジン | メモリホストQMDエンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | 非推奨のメモリイベントエイリアス | `plugin-sdk/memory-host-events`を使用 |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストCLIランタイム | メモリホストCLIランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダー中立のメモリホストコアランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダー中立のメモリホストイベントジャーナルヘルパーエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files`を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理Markdownヘルパー | メモリ隣接Plugin向け共有管理Markdownヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory検索ファサード | 遅延Active Memory検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status`を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures`など、焦点を絞ったリポジトリローカルのテストサブパスを使用 |
</Accordion>

この表は意図的に共通の移行サブセットを示しており、完全な SDK
サーフェスではありません。コンパイラーのエントリーポイント一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージのエクスポートは
公開サブセットから生成されます。

予約済みのバンドル済み Plugin ヘルパーシームは、非推奨の `plugin-sdk/discord`
シムのような、公開済みの `@openclaw/discord@2026.3.13` パッケージ向けに保持されている
明示的に文書化された互換ファサードを除き、公開 SDK エクスポートマップから廃止されています。
所有者固有のヘルパーは、それを所有する Plugin パッケージ内にあります。共有ホストの動作は、
`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、
`plugin-sdk/plugin-config-runtime` などの汎用 SDK 契約を通すべきです。

作業に合う最も狭い import を使用してください。エクスポートが見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、どの汎用契約がそれを所有すべきかをメンテナーに尋ねてください。

## 有効な非推奨

Plugin SDK、プロバイダー契約、ランタイムサーフェス、マニフェスト全体に適用される、より狭い非推奨です。
それぞれは現在も動作しますが、将来のメジャーリリースで削除されます。
各項目の下のエントリーは、古い API から正規の置き換え先への対応を示します。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。より狭いサブパスから import するだけです。`command-auth` は
    互換スタブとしてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="メンションゲーティングヘルパー → resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` の
    `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`.

    **新**: `resolveInboundMentionDecision({ facts, policy })` - 分割された2つの呼び出しではなく、
    単一の判定オブジェクトを返します。

    下流のチャネル Plugin（Slack、Discord、Matrix、MS Teams）はすでに
    切り替え済みです。

  </Accordion>

  <Accordion title="チャネルランタイムシムとチャネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は古いチャネル Plugin 向けの互換シムです。
    新しいコードから import しないでください。ランタイムオブジェクトの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    生の「actions」チャネルエクスポートとともに非推奨です。代わりに意味的な
    `presentation` サーフェスを通じて機能を公開してください。チャネル Plugin は、
    受け付ける生のアクション名ではなく、何をレンダリングするか（カード、ボタン、セレクト）を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダー tool() ヘルパー → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` ファクトリー。

    **新**: プロバイダー Plugin に直接 `createTool(...)` を実装します。
    OpenClaw はツールラッパーを登録するために SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキストチャネルエンベロープ → BodyForAgent">
    **旧**: 受信チャネルメッセージからフラットなプレーンテキストのプロンプトエンベロープを構築する
    `formatInboundEnvelope(...)`（および
    `ChannelMessageForAgent.channelEnvelope`）。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネル
    Plugin は、ルーティングメタデータ（スレッド、トピック、返信先、リアクション）を
    プロンプト文字列に連結するのではなく、型付きフィールドとして添付します。
    `formatAgentEnvelope(...)` ヘルパーは、合成されたアシスタント向けエンベロープでは
    引き続きサポートされますが、受信プレーンテキストエンベロープは廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および `channelEnvelope` テキストを
    後処理していたカスタムチャネル Plugin。

  </Accordion>

  <Accordion title="プロバイダー discovery 型 → プロバイダーカタログ型">
    4つの discovery 型エイリアスは、現在はカタログ時代の型の薄いラッパーです。

    | 旧エイリアス              | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに従来の `ProviderCapabilities` 静的バッグも対象です。プロバイダー Plugin は、
    静的オブジェクトではなく、`buildReplayPolicy`、`normalizeToolSchemas`、
    `wrapStreamFn` などの明示的なプロバイダーフックを使用すべきです。

  </Accordion>

  <Accordion title="Thinking ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の3つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`.

    **新**: 正規の `id`、任意の `label`、順位付けされたレベル一覧を含む
    `ProviderThinkingProfile` を返す、単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は、保存済みの古い値をプロファイル順位に基づいて自動的にダウングレードします。

    3つではなく1つのフックを実装してください。従来のフックは非推奨期間中も動作しますが、
    プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部 OAuth プロバイダーフォールバック → contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに
    `resolveExternalOAuthProfiles(...)` を実装すること。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装します。古い「auth
    fallback」パスはランタイムで警告を出し、削除される予定です。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー env-var lookup → setup.providers[].envVars">
    **旧** マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **新**: 同じ env-var lookup をマニフェスト上の `setup.providers[].envVars` に
    ミラーリングします。これにより、セットアップ/ステータスの env メタデータが一箇所に統合され、
    env-var lookup に答えるためだけに Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換アダプターを通じてサポートされます。

  </Accordion>

  <Accordion title="メモリ Plugin 登録 → registerMemoryCapability">
    **旧**: 3つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **新**: メモリ状態 API 上の1回の呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    同じスロットを単一の登録呼び出しで扱います。追加的なメモリヘルパー
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) は影響を受けません。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` からまだエクスポートされている2つの従来型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は、`getSessionMessages` を推奨する形で非推奨です。
    同じシグネチャです。古いメソッドは新しいメソッドへ呼び出しを渡します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow`（単数）はライブのタスクフローアクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、
    または実行する Plugin 向けに、管理対象 TaskFlow 変更ランタイムを保持します。
    Plugin が DTO ベースの読み取りだけを必要とする場合は `runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み extension ファクトリー → エージェントのツール結果ミドルウェア">
    上記の「移行方法 → Pi ツール結果 extension をミドルウェアへ移行する」で説明されています。
    完全性のためここにも含めます。削除された Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` の明示的なランタイム一覧とともに
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在は
    `OpenClawConfig` の1行エイリアスです。正規名を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
extension レベルの非推奨（`extensions/` 配下のバンドル済みチャネル/プロバイダー Plugin 内）は、
それぞれの `api.ts` および `runtime-api.ts` バレル内で追跡されます。
これらはサードパーティ Plugin 契約には影響せず、ここには記載されていません。
バンドル済み Plugin のローカルバレルを直接利用している場合は、アップグレード前に
そのバレル内の非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 起こること                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**               | 非推奨サーフェスはランタイム警告を出します                               |
| **次のメジャーリリース** | 非推奨サーフェスは削除されます。それらをまだ使用している Plugin は失敗します |

すべてのコア Plugin はすでに移行済みです。外部 Plugin は次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な逃げ道であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初の Plugin を作成する
- [SDK 概要](/ja-JP/plugins/sdk-overview) - サブパス import の完全リファレンス
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - チャネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築
- [Plugin 内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
