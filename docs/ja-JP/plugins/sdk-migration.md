---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Pluginを最新のPluginアーキテクチャに更新している
    - 外部 OpenClaw Plugin をメンテナンスしている
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新の Plugin SDK へ移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-06-27T12:32:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換レイヤーから、対象を絞った文書化済み import を備えるモダンな Plugin アーキテクチャへ移行しました。新しいアーキテクチャ以前に Plugin を構築していた場合、このガイドが移行に役立ちます。

## 何が変わるか

古い Plugin システムは、Plugin が必要なものを単一のエントリポイントから何でも import できる、2つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個のヘルパーを再エクスポートする単一の import です。新しい Plugin アーキテクチャの構築中に、古いフックベースの Plugin を動作させ続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、配信キュー、fetch/proxy ヘルパー、ファイルヘルパー、承認型、無関係なユーティリティを混在させた、広範なランタイムヘルパーバレルです。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中に非推奨の直接 load/write ヘルパーをまだ保持している、広範な設定互換バレルです。
- **`openclaw/extension-api`** - 組み込みエージェントランナーのようなホスト側ヘルパーへ Plugin が直接アクセスできるようにするブリッジです。
- **`api.registerEmbeddedExtensionFactory(...)`** - 削除済みの、組み込みランナー専用のバンドル extension フックです。`tool_result` などの組み込みランナーイベントを監視できました。

広範な import サーフェスは現在 **非推奨** です。ランタイムでは引き続き動作しますが、新しい Plugin は使用してはならず、既存の Plugin は次のメジャーリリースで削除される前に移行する必要があります。組み込みランナー専用の extension factory 登録 API は削除されました。代わりに tool-result ミドルウェアを使用してください。

OpenClaw は、代替手段を導入する同じ変更で、文書化済みの Plugin 動作を削除したり再解釈したりしません。破壊的な契約変更は、まず互換アダプター、診断、ドキュメント、非推奨期間を経る必要があります。これは SDK import、manifest フィールド、setup API、フック、ランタイム登録動作に適用されます。

<Warning>
  後方互換レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している Plugin は、その時点で壊れます。
  レガシーの組み込み extension factory 登録は、すでに読み込まれなくなっています。
</Warning>

## 変更理由

古いアプローチには問題がありました。

- **起動が遅い** - 1つのヘルパーを import すると、数十個の無関係なモジュールが読み込まれる
- **循環依存** - 広範な再エクスポートにより、import サイクルを作りやすい
- **不明確な API サーフェス** - どの export が安定版で、どれが内部用かを見分ける方法がない

モダンな Plugin SDK はこれを修正します。各 import パス（`openclaw/plugin-sdk/\<subpath\>`）は、明確な目的と文書化済みの契約を持つ、小さく自己完結したモジュールです。

バンドル済みチャネル向けのレガシー provider 便利シームも廃止されました。
チャネル名付きのヘルパーシームは、安定した Plugin 契約ではなく、プライベートなモノレポショートカットでした。代わりに、範囲を絞った汎用 SDK サブパスを使用してください。バンドル済み Plugin ワークスペース内では、provider 所有のヘルパーをその Plugin 自身の `api.ts` または `runtime-api.ts` に置いてください。

現在のバンドル済み provider の例:

- Anthropic は Claude 固有のストリームヘルパーを自分の `api.ts` / `contract-api.ts` シームに保持します
- OpenAI は provider ビルダー、デフォルトモデルヘルパー、realtime provider ビルダーを自分の `api.ts` に保持します
- OpenRouter は provider ビルダーとオンボーディング/設定ヘルパーを自分の `api.ts` に保持します

## Talk と realtime voice の移行計画

Realtime voice、telephony、meeting、browser Talk コードは、サーフェスローカルの turn 簿記から、`openclaw/plugin-sdk/realtime-voice` が export する共有 Talk セッションコントローラーへ移行しています。新しいコントローラーは、共通の Talk イベントエンベロープ、アクティブな turn 状態、capture 状態、output-audio 状態、最近のイベント履歴、古い turn の拒否を所有します。Provider Plugin はベンダー固有の realtime セッションを引き続き所有し、surface Plugin は capture、playback、telephony、meeting の癖を引き続き所有する必要があります。

この Talk 移行は、意図的に破壊的かつクリーンなものです。

1. 共有 controller/runtime プリミティブを `plugin-sdk/realtime-voice` に保持します。
2. バンドル済みサーフェスを共有コントローラーへ移行します: browser relay、managed-room handoff、voice-call realtime、voice-call streaming STT、Google Meet realtime、native push-to-talk。
3. 古い Talk RPC ファミリーを最終版の `talk.session.*` と `talk.client.*` API に置き換えます。
4. Gateway `hello-ok.features.events` で、1つのライブ Talk イベントチャネル `talk.event` を通知します。
5. 古い realtime HTTP エンドポイントと、リクエスト時の instruction override パスを削除します。

低レベルアダプターまたはテストフィクスチャを実装している場合を除き、新しいコードは `createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有コントローラーを優先してください。これにより、turn id なしで turn スコープイベントを emit できなくなり、古い `turnEnd` / `turnCancel` 呼び出しが新しいアクティブ turn をクリアできなくなり、output-audio ライフサイクルイベントが telephony、meetings、browser relay、managed-room handoff、native Talk clients 全体で一貫します。

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ブラウザー所有の WebRTC/provider-websocket セッションは `talk.client.create` を使用します。これは、ブラウザーが provider negotiation と media transport を所有し、Gateway が credentials、instructions、tool policy を所有するためです。`talk.session.*` は、gateway-relay realtime、gateway-relay transcription、managed-room native STT/TTS セッション向けの、共通の Gateway 管理サーフェスです。

`talk.provider` / `talk.providers` の横に realtime selector を配置していたレガシー設定は、`openclaw doctor --fix` で修復する必要があります。ランタイム Talk は、speech/TTS provider 設定を realtime provider 設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に小さくしています。

| モード            | トランスポート       | Brain           | 所有者              | 注記                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway 経由でブリッジされる全二重 provider audio。tool call は agent-consult tool を通じてルーティングされます。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT のみ。呼び出し元は input audio を送信し、transcript event を受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | クライアントが capture/playback を所有し、Gateway が turn 状態を所有する、push-to-talk および walkie-talkie スタイルの room。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway tool action を直接実行する、信頼済みファーストパーティサーフェス向けの管理者専用 room モード。                  |

削除されたメソッドの対応表:

| 旧                               | 新                                                       |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一された control vocabulary も、意図的に狭くしています。

  | メソッド                          | 適用先                                              | コントラクト                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションに base64 PCM 音声チャンクを追加します。                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room のユーザーターンを開始します。                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn 検証後にアクティブなターンを終了します。                                                                                                                                         |
  | `talk.session.cancelTurn`       | すべての Gateway 所有セッション                              | ターンに対するアクティブなキャプチャ/プロバイダー/エージェント/TTS 作業をキャンセルします。                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずに、アシスタントの音声出力を停止します。                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | リレーが発行したプロバイダーツール呼び出しを完了します。中間出力には `options.willContinue` を渡し、別のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡します。 |
  | `talk.session.steer`            | エージェントを基盤とする Talk セッション                              | Talk セッションから解決されたアクティブな埋め込み実行に、音声の `status`、`steer`、`cancel`、または `followup` 制御を送信します。                                                                |
  | `talk.session.close`            | すべての統合セッション                                    | リレーセッションを停止するか managed-room 状態を取り消し、その後、統合セッション ID を忘れます。                                                                                                    |

  これを動作させるために、プロバイダーやプラットフォーム固有の特例を core に導入しないでください。
  core は Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。
  音声通話と Google Meet は電話/会議アダプターを所有します。ブラウザーとネイティブ
  アプリはデバイスのキャプチャ/再生 UX を所有します。

  ## 互換性ポリシー

  外部 Plugin では、互換性作業は次の順序に従います。

  1. 新しいコントラクトを追加する
  2. 互換性アダプターを通じて古い動作を維持する
  3. 古いパスと置き換え先を示す診断または警告を出力する
  4. 両方のパスをテストでカバーする
  5. 非推奨化と移行パスを文書化する
  6. 告知した移行期間の後にのみ削除する。通常はメジャーリリースで行う

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できます。コンパクトな件数には
  `pnpm plugins:boundary-report:summary`、1 つの Plugin または互換性オーナーには
  `--owner <id>`、期限を迎えた互換性レコード、オーナーをまたぐ予約済み SDK import、または未使用の予約済み SDK サブパスで CI ゲートを失敗させる必要がある場合は
  `pnpm plugins:boundary-report:ci` を使用します。このレポートは、非推奨の
  互換性レコードを削除日ごとにグループ化し、ローカルのコード/ドキュメント参照を数え、
  オーナーをまたぐ予約済み SDK import を表面化し、private
  memory-host SDK ブリッジを要約します。これにより、互換性クリーンアップはアドホックな検索に頼らず明示的なままになります。予約済み SDK サブパスには、追跡されたオーナー使用が必要です。
  未使用の予約済みヘルパー export は public SDK から削除するべきです。

  manifest フィールドがまだ受け付けられている場合、Plugin 作者は
  ドキュメントと診断が別のことを示すまで使い続けられます。新しいコードは文書化された
  置き換え先を優先するべきですが、既存 Plugin は通常のマイナー
  リリース中に壊れるべきではありません。

  ## 移行方法

  <Steps>
  <Step title="ランタイム config の load/write ヘルパーを移行する">
    バンドル Plugin は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきです。アクティブな呼び出しパスに
    すでに渡されている config を優先してください。現在のプロセススナップショットが必要な長寿命ハンドラーは
    `api.runtime.config.current()` を使用できます。長寿命の
    エージェントツールは `execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用するべきです。
    これにより、config 書き込み前に作成されたツールでも、更新された
    runtime config を参照できます。

    config の書き込みはトランザクションヘルパーを経由し、
    after-write ポリシーを選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元が変更にはクリーンな gateway 再起動が必要だと分かっている場合は
    `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元が後続処理を所有し、
    reload planner を意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用します。
    mutation 結果には、テストとロギング用の型付き `followUp` 要約が含まれます。
    gateway は引き続き、再起動の適用またはスケジュールを担当します。
    `loadConfig` と `writeConfigFile` は、移行期間中の外部 Plugin 向けに非推奨の互換性
    ヘルパーとして残り、`runtime-config-load-write` 互換性コードで一度だけ警告します。
    バンドル Plugin とリポジトリのランタイムコードは、
    `pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` の scanner ガードレールで保護されています。新しい production Plugin の使用は
    即時に失敗し、直接 config 書き込みも失敗します。gateway server メソッドは
    request runtime snapshot を使用する必要があり、runtime channel send/action/client ヘルパーは
    境界から config を受け取る必要があり、長寿命 runtime モジュールでは
    ambient な `loadConfig()` 呼び出しの許可数はゼロです。

    新しい Plugin コードでは、広い
    `openclaw/plugin-sdk/config-runtime` 互換性 barrel の import も避けるべきです。用途に合う狭い
    SDK サブパスを使用してください。

    | 必要なもの | Import |
    | --- | --- |
    | `OpenClawConfig` などの config 型 | `openclaw/plugin-sdk/config-contracts` |
    | ロード済み config アサーションと plugin-entry config ルックアップ | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在の runtime snapshot の読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | config 書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシー runtime ヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッション override | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル Plugin とそのテストは、広い
    barrel に対して scanner で保護されているため、import と mock は必要な動作に対してローカルに保たれます。広い
    barrel は外部互換性のためにまだ存在しますが、新しいコードはそれに
    依存するべきではありません。

  </Step>

  <Step title="埋め込み tool-result extension を middleware に移行する">
    バンドル Plugin は、embedded-runner 専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-result ハンドラーを
    runtime-neutral な middleware に置き換える必要があります。

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

    インストール済み Plugin も、明示的に有効化され、
    `contracts.agentToolResultMiddleware` ですべての対象 runtime を宣言している場合に
    tool-result middleware を登録できます。宣言されていないインストール済み middleware
    登録は拒否されます。

  </Step>

  <Step title="approval-native ハンドラーを capability facts に移行する">
    承認対応 channel Plugin は、`approvalCapability.nativeRuntime` と共有 runtime-context registry を通じて
    ネイティブ承認動作を公開するようになりました。

    主な変更:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の auth/delivery を legacy `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は public channel-plugin
      コントラクトから削除されました。delivery/native/render フィールドを `approvalCapability` に移してください
    - `plugin.auth` は channel の login/logout フロー専用として残ります。そこにある approval auth
      hook は core ではもう読み取られません
    - client、token、Bolt
      app などの channel 所有 runtime オブジェクトを `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ approval ハンドラーから Plugin 所有の reroute 通知を送信しないでください。
      core は実際の delivery 結果から routed-elsewhere 通知を所有するようになりました
    - `channelRuntime` を `createChannelManager(...)` に渡す場合は、
      実際の `createPluginRuntime().channel` surface を提供してください。部分的な stub は拒否されます。

    現在の approval capability
    レイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback 動作を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決の Windows
    `.cmd`/`.bat` wrapper は、明示的に
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
    `allowShellFallback` を設定せず、代わりにスローされたエラーを処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    Plugin で、いずれかの非推奨 surface からの import を検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="focused import に置き換える">
    古い surface の各 export は、特定のモダンな import path に対応します。

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

    host-side ヘルパーには、直接 import する代わりに注入された Plugin runtime を使用します:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも適用されます。

    | 旧インポート | 最新の同等機能 |
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
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、新しいコードでは実際に必要な対象を絞ったヘルパーサーフェスをインポートする必要があります。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat のウェイク、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリ重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよびガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードおよびコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラーフォーマットヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク並行処理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値強制変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドル済み Plugin は `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが広範なバレルへ戻ることはできません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用する必要があります。
    古い route-key 名と comparable-target 名は、移行期間中は互換性エイリアスとして残りますが、新しい Plugin では動作を直接説明するルート名を使用する必要があります。

    | 旧ヘルパー | 最新ヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、インバウンド重複排除、cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーに基づくロード済みルートヘルパー（`parseExplicitTargetForLoadedChannel` または `resolveRouteTargetForLoadedChannel`）、または `plugin-sdk/channel-route` の `resolveChannelRouteTargetWithParser(...)` の新規使用を追加しないでください。
    これらのフックは非推奨であり、移行期間中に古い Plugin のためだけに残されています。新しいチャネル Plugin では、ターゲット ID の正規化とディレクトリ未検出時のフォールバックに `messaging.targetResolver.resolveTarget(...)`、コアが早期にピア種別を必要とする場合に `messaging.inferTargetChatType(...)`、プロバイダー固有のセッションおよびスレッド ID に `messaging.resolveOutboundSessionRoute(...)` を使用する必要があります。

  </Step>

  <Step title="ビルドしてテストする">
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
  | `plugin-sdk/plugin-entry` | 正規のPluginエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャンネルエントリ定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャンネルエントリ定義とビルダーに特化 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | `createSetupTranslator`、インポート安全なセットアップパッチアダプター、検索メモヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウント一覧/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウントIDヘルパー | `DEFAULT_ACCOUNT_ID`、アカウントID正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 狭いアカウントヘルパー | アカウント一覧/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、さらに `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーとDMアクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャンネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClawが保守するバンドルPluginのみ。新規PluginはPluginローカルのスキーマを定義する必要がある |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換エイリアスのみ。保守対象のバンドルPluginには `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/channel-inbound` | 受信ヘルパー | コンテキスト構築、整形、ルート、ランナー、準備済み返信ディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決にはPlugin所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共有送信メディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | 送信メッセージライフサイクルヘルパー | メッセージアダプター、受領情報、耐久送信ヘルパー、ライブプレビュー/ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、送信ID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト向けのエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換シム | レガシーチャンネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ログ/バックアップ/Pluginインストールヘルパー |
  | `plugin-sdk/runtime-env` | 狭いランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムヘルパー | Pluginコマンド/フック/http/対話ヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有execヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンド整形、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアント、イベントループ準備済み開始ヘルパー、チャンネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換シム | `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot`、`config-mutation` を優先 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドルTelegram契約サーフェスが利用できない場合のフォールバック安定なTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | exec/Plugin承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パス整形 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブexec承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共有承認Gateway解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャンネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。より狭いアダプター/Gatewayの継ぎ目で十分な場合はそれを優先 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | exec/Plugin承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャンネルランタイムコンテキストヘルパー | 汎用チャンネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DMゲート、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | 固定ディスパッチャー、保護付きfetch、SSRFポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeatヘルパー | Heartbeatのウェイク、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | メモリ内重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備状態ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | exec承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲートヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`、エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/プロキシヘルパー | `resolveFetch`、プロキシヘルパー、EnvHttpProxyAgentオプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`、ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リスト整形と入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲートとコマンドサーフェスヘルパー | `resolveControlCommandGate`、送信者認可ヘルパー、動的引数メニュー整形を含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook本文ガードヘルパー | リクエスト本文読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信ディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 狭い返信ディスパッチヘルパー | 完了処理、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`。`buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` などの非推奨マップヘルパー互換エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdownチャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-atヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態とOAuthディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーのヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャンネルステータスのヘルパー | チャンネル/アカウントステータスの概要ビルダー、ランタイム状態のデフォルト、Issueメタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーのヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエストURLヘルパー | リクエスト風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | タイムアウト付きコマンドヘルパー | 正規化されたstdout/stderrを持つタイムアウト付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール/CLIパラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化済みペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から標準の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーとリダクションヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdownテーブルヘルパー | Markdownテーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダー設定ヘルパー | セルフホストプロバイダー検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換セルフホストプロバイダー設定に特化したヘルパー | 同じセルフホストプロバイダー検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイムAPIキー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキー設定ヘルパー | APIキーオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準OAuth認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生プロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデルID正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダーHTTPヘルパー | 音声文字起こしのmultipart formヘルパーを含む、汎用プロバイダーHTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダーWeb取得ヘルパー | Web取得プロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダーWeb検索設定ヘルパー | Plugin有効化配線を必要としないプロバイダー向けの狭いWeb検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダーWeb検索コントラクトヘルパー | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの狭いWeb検索設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダーWeb検索ヘルパー | Web検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAIスキーマクリーンアップ + 診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、ストリームラッパー型、共有Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付きfetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア取得/変換/保存ヘルパー、ffprobeベースの動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型とプロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core`を使用 |
  | `plugin-sdk/text-chunking` | テキスト分割ヘルパー | 送信用テキスト分割ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI互換TTSビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有WebSocketセッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェント折り返し発話キュー、アクティブ実行音声制御、トランスクリプト/イベント健全性、エコー抑制、相談質問マッチング、強制相談の調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と画像アセット/データURLヘルパー、OpenAI互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 狭いチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプレリュード | 共有チャンネルPluginプレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータススナップショット/概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード | `plugin-sdk/channel-inbound`を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DMガードヘルパー | 狭い暗号化前ガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル/ステータスとアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhookターゲットヘルパー | Webhookターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨のWebhookパスエイリアス | `plugin-sdk/webhook-ingress`を使用 |
  | `plugin-sdk/web-media` | 共有Webメディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨のZod互換再エクスポート | `zod`から`zod`を直接インポート |
  | `plugin-sdk/memory-core` | バンドルされたmemory-coreヘルパー | メモリマネージャー/設定/ファイル/CLIヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーは所有するPluginsに存在 |
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
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files`を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象Markdownヘルパー | メモリ隣接Plugins向けの共有管理対象Markdownヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory検索ファサード | 遅延Active Memory検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status`を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures`などの特化したリポジトリローカルテストサブパスを使用 |
</Accordion>

この表は意図的に、完全な SDK サーフェスではなく共通の移行サブセットにしています。コンパイラーのエントリーポイントインベントリは
`scripts/lib/plugin-sdk-entrypoints.json` にあり、パッケージのエクスポートは公開サブセットから生成されます。

予約済みのバンドルプラグイン用ヘルパー境界は、公開 SDK エクスポートマップから廃止されました。ただし、公開済みの
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の `plugin-sdk/discord` shim など、明示的に文書化された互換性ファサードは例外です。所有者固有のヘルパーは、所有元のプラグインパッケージ内に置かれます。共有ホスト動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトを通す必要があります。

用途に合う最も狭い import を使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかをメンテナーに確認してください。

## アクティブな非推奨項目

プラグイン SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体に適用される、より狭い非推奨項目です。各項目は現在も動作しますが、将来のメジャーリリースで削除されます。各項目の下のエントリーは、古い API を標準の置き換え先に対応付けます。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じエクスポートです。より狭いサブパスから import するだけです。`command-auth` は互換性スタブとしてそれらを再エクスポートします。

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
    `shouldDropInboundForMention(...)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })`。2 つに分かれた呼び出しではなく、単一の判定オブジェクトを返します。

    下流のチャネルプラグイン (Slack、Discord、Matrix、MS Teams) はすでに切り替え済みです。

  </Accordion>

  <Accordion title="チャネルランタイム shim とチャネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は、古いチャネルプラグイン向けの互換性 shim です。新しいコードから import しないでください。ランタイムオブジェクトの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、生の「actions」チャネルエクスポートとあわせて非推奨です。代わりに意味的な `presentation` サーフェスを通じて機能を公開してください。チャネルプラグインは、受け付ける生のアクション名ではなく、何をレンダリングするか (カード、ボタン、セレクト) を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーツールの tool() ヘルパー → プラグイン上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` ファクトリ。

    **新**: プロバイダープラグイン上で `createTool(...)` を直接実装します。OpenClaw はツールラッパーを登録するための SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキストのチャネルエンベロープ → BodyForAgent">
    **旧**: 受信チャネルメッセージから平坦なプレーンテキストのプロンプトエンベロープを構築する `formatInboundEnvelope(...)` (および
    `ChannelMessageForAgent.channelEnvelope`)。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネルプラグインは、ルーティングメタデータ (スレッド、トピック、返信先、リアクション) をプロンプト文字列に連結するのではなく、型付きフィールドとして添付します。合成されたアシスタント向けエンベロープでは
    `formatAgentEnvelope(...)` ヘルパーが引き続きサポートされますが、受信プレーンテキストエンベロープは廃止へ向かっています。

    影響範囲: `inbound_claim`、`message_received`、および `channelEnvelope` テキストを後処理していたカスタムチャネルプラグイン。

  </Accordion>

  <Accordion title="deactivate フック → gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。イベントとコンテキストは同じシャットダウンクリーンアップコントラクトです。変更されるのはフック名のみです。

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

    `deactivate` は、2026-08-16 以降まで非推奨の互換性エイリアスとして接続されたままです。

  </Accordion>

  <Accordion title="subagent_spawning フック → コアスレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: コアがチャネルセッションバインディングアダプターを通じて `thread: true` のサブエージェントバインディングを準備するようにします。起動後の観察にのみ
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

    外部プラグインが移行する間、`subagent_spawning`、
    `PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult`、および
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` は非推奨の互換性サーフェスとしてのみ残ります。

  </Accordion>

  <Accordion title="プロバイダー検出型 → プロバイダーカタログ型">
    4 つの検出型エイリアスは、現在ではカタログ時代の型の薄いラッパーです。

    | 旧エイリアス                | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、レガシーな静的バッグ `ProviderCapabilities` も該当します。プロバイダープラグインは、静的オブジェクトではなく、`buildReplayPolicy`、`normalizeToolSchemas`、`wrapStreamFn` などの明示的なプロバイダーフックを使用する必要があります。

  </Accordion>

  <Accordion title="Thinking ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の 3 つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 標準の `id`、任意の `label`、ランク付けされたレベルリストを持つ
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。OpenClaw は、古い保存済み値をプロファイルランクに基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意でマージ済みの `reasoning`、および任意でマージ済みのモデル `compat` ファクトが含まれます。プロバイダープラグインは、それらのカタログファクトを使用して、設定されたリクエストコントラクトがサポートする場合にのみモデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作しますが、プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部認証プロバイダー → contracts.externalAuthProviders">
    **旧**: プラグインマニフェストでプロバイダーを宣言せずに外部認証フックを実装する。

    **新**: プラグインマニフェストで `contracts.externalAuthProviders` を宣言し、**かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー env-var 参照 → setup.providers[].envVars">
    **旧** マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var 参照をマニフェスト上の `setup.providers[].envVars` にミラーします。これにより、セットアップ/ステータス用の env メタデータが 1 か所に統合され、env-var 参照に答えるためだけにプラグインランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプターを通じてサポートされ続けます。

  </Accordion>

  <Accordion title="メモリプラグイン登録 → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: メモリ状態 API 上の 1 回の呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じスロットを、単一の登録呼び出しで扱います。追加的なプロンプトおよびコーパスヘルパー
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) には影響しません。

  </Accordion>

  <Accordion title="メモリ埋め込みプロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用の埋め込みプロバイダーコントラクトはメモリ以外でも再利用でき、新しいプロバイダー向けにサポートされる経路です。既存プロバイダーが移行する間、メモリ固有の登録 API は非推奨の互換性として接続されたままです。プラグイン検査では、非バンドルでの使用が互換性負債として報告されます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名前変更">
    `src/plugins/runtime/types.ts` から引き続きエクスポートされている 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は非推奨で、`getSessionMessages` が推奨されます。同じシグネチャで、古いメソッドは新しいメソッドへ委譲します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow` (単数形) は、ライブのタスクフローアクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行するプラグイン向けに、管理対象 TaskFlow 変更ランタイムを保持します。プラグインが DTO ベースの読み取りだけを必要とする場合は `runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリ → エージェントツール結果ミドルウェア">
    上記の「移行方法 → 埋め込みツール結果拡張をミドルウェアに移行する」で扱っています。完全性のためにここにも含めます。削除された埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` 経路は、`contracts.agentToolResultMiddleware` の明示的なランタイムリストを伴う
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在では `OpenClawConfig` の 1 行エイリアスです。標準名を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドル済みチャネル/プロバイダープラグイン内にある拡張レベルの非推奨項目は、それぞれの `api.ts` と `runtime-api.ts` バレル内で追跡されます。それらはサードパーティープラグインのコントラクトには影響せず、ここには記載していません。バンドル済みプラグインのローカルバレルを直接使用している場合は、アップグレード前にそのバレル内の非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 起こること                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 非推奨サーフェスはランタイム警告を出します                               |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらをまだ使用しているPluginは失敗します |

すべてのコアPluginはすでに移行済みです。外部Pluginは
次のメジャーリリースまでに移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定します。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な退避策であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初のPluginを構築する
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) - チャネルPluginの構築
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダーPluginの構築
- [Plugin 内部](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
