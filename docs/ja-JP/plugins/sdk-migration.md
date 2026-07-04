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
    generated_at: "2026-07-04T10:28:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーから、焦点を絞った文書化済み import を備えたモダンな Plugin
アーキテクチャへ移行しました。Plugin が新しいアーキテクチャ以前に作られていた場合、このガイドが移行を支援します。

## 変更内容

古い Plugin システムは、Plugin が必要なものを単一のエントリポイントから何でも import できる、広く開かれた 2 つのサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個のヘルパーを再 export する単一の import です。
  新しい Plugin アーキテクチャが構築されている間、古い hook ベースの Plugin を動かし続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、配信キュー、fetch/proxy ヘルパー、
  ファイルヘルパー、承認タイプ、無関係なユーティリティを混在させた、広範なランタイムヘルパー barrel です。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中、非推奨の直接 load/write ヘルパーをまだ含んでいる、
  広範な設定互換 barrel です。
- **`openclaw/extension-api`** - 組み込みエージェントランナーのようなホスト側ヘルパーへ Plugin が直接アクセスできるようにする
  ブリッジです。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの埋め込みランナーイベントを監視できた、
  削除済みの埋め込みランナー専用バンドル extension hook です。

広範な import サーフェスは現在 **非推奨** です。ランタイムではまだ動作しますが、
新しい Plugin は使用してはならず、既存の Plugin は次のメジャーリリースで削除される前に移行する必要があります。
埋め込みランナー専用の extension factory 登録 API は削除されました。代わりに tool-result middleware を使用してください。

OpenClaw は、置き換えを導入するのと同じ変更で、文書化済みの Plugin 動作を削除したり再解釈したりしません。
契約を破る変更は、まず互換アダプター、診断、ドキュメント、非推奨期間を経る必要があります。
これは SDK import、manifest フィールド、setup API、hook、ランタイム登録動作に適用されます。

<Warning>
  後方互換性レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している Plugin は、その時点で壊れます。
  レガシーの埋め込み extension factory 登録は、すでに読み込まれなくなっています。
</Warning>

## 変更理由

古いアプローチには問題がありました。

- **起動が遅い** - 1 つのヘルパーを import すると、無関係なモジュールが数十個読み込まれる
- **循環依存** - 広範な再 export によって import cycle を作りやすかった
- **API サーフェスが不明確** - どの export が安定していて、どれが内部向けなのか判断できなかった

モダンな Plugin SDK はこれを解決します。各 import パス（`openclaw/plugin-sdk/\<subpath\>`）は、
明確な目的と文書化済みの契約を持つ、小さく自己完結したモジュールです。

バンドル済み channel 向けのレガシーな provider convenience seam も廃止されました。
channel ブランドの helper seam はプライベートな monorepo ショートカットであり、安定した
Plugin 契約ではありません。代わりに、狭い汎用 SDK subpath を使用してください。バンドル済み
Plugin ワークスペース内では、provider 所有のヘルパーをその Plugin 自身の `api.ts` または
`runtime-api.ts` に置いてください。

現在のバンドル済み provider 例:

- Anthropic は Claude 固有の stream ヘルパーを自身の `api.ts` /
  `contract-api.ts` seam に保持します
- OpenAI は provider builder、default-model ヘルパー、realtime provider
  builder を自身の `api.ts` に保持します
- OpenRouter は provider builder とオンボーディング/config ヘルパーを自身の
  `api.ts` に保持します

## Talk とリアルタイム音声の移行計画

リアルタイム音声、テレフォニー、ミーティング、ブラウザーの Talk コードは、
サーフェスローカルの turn bookkeeping から、`openclaw/plugin-sdk/realtime-voice` が export する共有 Talk session controller へ移行しています。
新しい controller は、共通の Talk event envelope、active turn state、capture state、output-audio state、recent
event history、stale-turn rejection を所有します。Provider Plugin は vendor 固有の realtime session を所有し続けるべきです。
surface Plugin は capture、playback、telephony、meeting の癖を所有し続けるべきです。

この Talk 移行は、意図的に breaking-clean です。

1. 共有 controller/runtime primitive を
   `plugin-sdk/realtime-voice` に保持します。
2. バンドル済み surface を共有 controller へ移行します: browser relay、
   managed-room handoff、voice-call realtime、voice-call streaming STT、Google
   Meet realtime、native push-to-talk。
3. 古い Talk RPC family を最終版の `talk.session.*` と
   `talk.client.*` API に置き換えます。
4. Gateway
   `hello-ok.features.events` で 1 つの live Talk event channel を通知します: `talk.event`。
5. 古い realtime HTTP endpoint と、request-time instruction
   override path を削除します。

低レベル adapter または test fixture を実装している場合を除き、新しいコードは `createTalkEventSequencer(...)` を直接呼び出すべきではありません。
共有 controller を優先してください。これにより、turn id なしで turn-scoped event が emit されることを防ぎ、
stale な `turnEnd` /
`turnCancel` 呼び出しが新しい active turn をクリアできなくなり、output-audio lifecycle
event が telephony、meeting、browser relay、managed-room
handoff、native Talk client 間で一貫します。

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

ブラウザー所有の WebRTC/provider-websocket session は `talk.client.create` を使用します。
これは、ブラウザーが provider negotiation と media transport を所有し、Gateway が credentials、instructions、tool policy を所有するためです。
`talk.session.*` は、gateway-relay realtime、gateway-relay
transcription、managed-room native STT/TTS session のための共通の Gateway 管理 surface です。

`talk.provider` /
`talk.providers` の横に realtime selector を置いていたレガシー config は、`openclaw doctor --fix` で修復する必要があります。ランタイムの Talk は、
speech/TTS provider config を realtime provider config として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に小さくしています。

| モード            | トランスポート       | Brain           | 所有者              | 注記                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway 経由で橋渡しされる全二重 provider 音声。tool call は agent-consult tool 経由で routing されます。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT のみ。caller は入力音声を送信し、transcript event を受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | client が capture/playback を所有し、Gateway が turn state を所有する push-to-talk および walkie-talkie style room。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway tool action を直接実行する、信頼された first-party surface 向けの admin-only room mode。                  |

削除された method の対応表:

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

統一された control vocabulary も、意図的に狭くしています。

  | メソッド                          | 適用対象                                              | 契約                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | base64 PCM 音声チャンクを、同じ Gateway 接続が所有するプロバイダーセッションに追加する。                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room のユーザーターンを開始する。                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn 検証の後、アクティブなターンを終了する。                                                                                                                                         |
  | `talk.session.cancelTurn`       | すべての Gateway 所有セッション                              | あるターンのアクティブなキャプチャ、プロバイダー、エージェント、TTS の作業をキャンセルする。                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずに、アシスタント音声出力を停止する。                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay が発行したプロバイダーのツール呼び出しを完了する。暫定出力には `options.willContinue` を渡し、別のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡す。 |
  | `talk.session.steer`            | エージェントに裏付けられた Talk セッション                              | Talk セッションから解決されたアクティブな埋め込み実行へ、音声による `status`、`steer`、`cancel`、または `followup` 制御を送信する。                                                                |
  | `talk.session.close`            | すべての統合セッション                                    | relay セッションを停止するか managed-room 状態を取り消し、その後、統合セッション ID を忘れる。                                                                                                    |

  これを機能させるために、コアへプロバイダーやプラットフォーム固有の特例を導入しないでください。
  コアは Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。
  音声通話と Google Meet は電話/会議アダプターを所有します。ブラウザーとネイティブ
  アプリはデバイスのキャプチャ/再生 UX を所有します。

  ## 互換性ポリシー

  外部 Plugin の互換性作業は、次の順序に従います。

  1. 新しい契約を追加する
  2. 古い動作を互換性アダプター経由で接続したままにする
  3. 古いパスと置き換え先を明示する診断または警告を出す
  4. 両方のパスをテストでカバーする
  5. 非推奨化と移行パスを文書化する
  6. 通知済みの移行期間後、通常はメジャーリリースでのみ削除する

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できます。
  コンパクトな件数には `pnpm plugins:boundary-report:summary` を、単一の Plugin または互換性オーナーには `--owner <id>` を、
  期限到来の互換性レコード、オーナーをまたぐ予約済み SDK インポート、または未使用の予約済み SDK サブパスで CI ゲートを失敗させる必要がある場合は
  `pnpm plugins:boundary-report:ci` を使用します。レポートは、削除日ごとに非推奨の
  互換性レコードをグループ化し、ローカルコード/ドキュメント参照を数え、
  オーナーをまたぐ予約済み SDK インポートを表面化し、プライベートな
  memory-host SDK ブリッジを要約するため、互換性のクリーンアップを
  場当たり的な検索に頼るのではなく明示的に保てます。予約済み SDK サブパスには追跡されたオーナー使用が必要です。
  未使用の予約済みヘルパーエクスポートは、公開 SDK から削除する必要があります。

  manifest フィールドがまだ受け入れられている場合、Plugin 作者は
  ドキュメントと診断が別のことを示すまで使い続けられます。新しいコードでは文書化された
  置き換え先を優先すべきですが、既存の Plugin が通常のマイナー
  リリース中に壊れてはなりません。

  ## 移行方法

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    バンドル済み Plugin は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきです。アクティブな呼び出しパスに
    すでに渡されている config を優先してください。現在のプロセススナップショットを必要とする
    長寿命ハンドラーは `api.runtime.config.current()` を使用できます。長寿命の
    エージェントツールは、config 書き込み前に作成されたツールでも更新後の
    runtime config を参照できるように、`execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用してください。

    Config 書き込みはトランザクションヘルパーを通し、書き込み後ポリシーを選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元が変更にクリーンな gateway 再起動が必要だと分かっている場合は
    `afterWrite: { mode: "restart", reason: "..." }` を使用し、
    呼び出し元がフォローアップを所有し、reload planner を意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用してください。
    変更結果には、テストとロギング用の型付き `followUp` サマリーが含まれます。
    gateway は再起動の適用またはスケジュールを引き続き担当します。
    `loadConfig` と `writeConfigFile` は移行期間中、外部 Plugin 向けの非推奨互換性
    ヘルパーとして残り、`runtime-config-load-write` 互換性コードで一度だけ警告します。バンドル済み Plugin とリポジトリの
    runtime コードは
    `pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` のスキャナーガードレールで保護されています。新しい本番 Plugin 使用は
    即座に失敗し、直接 config 書き込みは失敗し、gateway サーバーメソッドは
    リクエスト runtime スナップショットを使用する必要があり、runtime channel send/action/client ヘルパーは
    境界から config を受け取る必要があり、長寿命 runtime モジュールに許可される周辺的な `loadConfig()` 呼び出しは
    ゼロです。

    新しい Plugin コードでは、広範な
    `openclaw/plugin-sdk/config-runtime` 互換性バレルのインポートも避けるべきです。作業に合った狭い
    SDK サブパスを使用してください。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig` などの Config 型 | `openclaw/plugin-sdk/config-contracts` |
    | 読み込み済み config アサーションと plugin-entry config 参照 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在の runtime スナップショット読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシー runtime ヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッションオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル済み Plugin とそのテストは、広範な
    バレルに対してスキャナーでガードされるため、インポートとモックは必要な動作に対してローカルに保たれます。広範な
    バレルは外部互換性のためにまだ存在しますが、新しいコードはそれに
    依存すべきではありません。

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    バンドル済み Plugin は、埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを
    runtime 中立のミドルウェアに置き換える必要があります。

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

    インストール済み Plugin は、明示的に有効化され、
    対象の runtime すべてを
    `contracts.agentToolResultMiddleware` で宣言している場合にも、ツール結果ミドルウェアを登録できます。宣言されていないインストール済みミドルウェアの
    登録は拒否されます。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    承認対応 channel Plugin は現在、
    `approvalCapability.nativeRuntime` と共有 runtime-context レジストリを通じてネイティブ承認動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の認証/配信を従来の `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` に移す
    - `ChannelPlugin.approvals` は公開 channel-plugin
      契約から削除されました。delivery/native/render フィールドを `approvalCapability` に移してください
    - `plugin.auth` は channel のログイン/ログアウトフロー専用として残ります。そこにある承認認証
      フックはコアからはもう読み取られません
    - クライアント、トークン、Bolt
      アプリなど、channel 所有の runtime オブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ承認ハンドラーから Plugin 所有の再ルーティング通知を送信しないでください。
      コアは実際の配信結果に基づく routed-elsewhere 通知を所有するようになりました
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実体のある `createPluginRuntime().channel` サーフェスを提供してください。部分的な stub は拒否されます。

    現在の承認 capability
    レイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、解決できない Windows
    `.cmd`/`.bat` ラッパーは、明示的に
    `allowShellFallback: true` を渡さない限り、fail closed になりました。

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
    `allowShellFallback` を設定せず、代わりに送出されたエラーを処理してください。

  </Step>

  <Step title="Find deprecated imports">
    Plugin 内で、いずれかの非推奨サーフェスからのインポートを検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    古いサーフェスからの各エクスポートは、特定の現代的なインポートパスに対応します。

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

    ホスト側ヘルパーには、直接インポートする代わりに注入された Plugin runtime を使用してください:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも適用されます。

    | 古いインポート | 現代的な同等機能 |
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
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、新しいコードでは実際に必要な、焦点を絞ったヘルパーサーフェスをインポートする必要があります。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat の wake、event、visibility ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリおよび永続バックエンド付き重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよびガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードおよびコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク並行実行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値の強制変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドル済み Plugin は `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが広範なバレルへ回帰することはありません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用する必要があります。
    古い route-key 名と comparable-target 名は、移行期間中は互換性エイリアスとして残りますが、新しい Plugin では動作を直接表す route 名を使用する必要があります。

    | 古いヘルパー | 現代的なヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代的なルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーをバックエンドに持つ loaded-route ヘルパー（`parseExplicitTargetForLoadedChannel` または `resolveRouteTargetForLoadedChannel`）、または `plugin-sdk/channel-route` の `resolveChannelRouteTargetWithParser(...)` の新しい使用を追加しないでください。
    これらのフックは非推奨であり、移行期間中に古い Plugin のためだけに残されています。新しいチャネル Plugin では、ターゲット ID の正規化とディレクトリミス時のフォールバックには `messaging.targetResolver.resolveTarget(...)` を、コアが早期に peer kind を必要とする場合には `messaging.inferTargetChatType(...)` を、プロバイダーネイティブのセッションおよびスレッド ID には `messaging.resolveOutboundSessionRoute(...)` を使用する必要があります。

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
  | `plugin-sdk/plugin-entry` | 正規の Plugin エントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャネルエントリ定義とビルダーに特化したもの | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップ翻訳器、許可リストプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | `createSetupTranslator`, インポート安全なセットアップパッチアダプター、lookup-note ヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントヘルパー | アカウントリスト/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウント ID ヘルパー | `DEFAULT_ACCOUNT_ID`, アカウント ID 正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 狭いアカウントヘルパー | アカウントリスト/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の接続 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーと DM アクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClaw が保守するバンドル Plugin のみ。新しい Plugin は Plugin ローカルのスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守対象のバンドル Plugin には `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | インバウンドエンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/channel-inbound` | インバウンド受信ヘルパー | コンテキスト構築、整形、ルート、ランナー、準備済み返信ディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決には Plugin 所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | アウトバウンドメディアヘルパー | 共有アウトバウンドメディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | アウトバウンドメッセージライフサイクルヘルパー | メッセージアダプター、受領、永続送信ヘルパー、ライブプレビュー/ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、アウトバウンド ID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト向けエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続 Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/Plugin インストールヘルパー |
  | `plugin-sdk/runtime-env` | 狭いランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、再試行、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin ランタイムヘルパー | Plugin コマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有 Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有 exec ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンド整形、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアント、イベントループ準備済み開始ヘルパー、広告済み LAN ホスト解決、チャネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を推奨 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | バンドル Telegram 契約サーフェスが利用できない場合の、フォールバック安定な Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | Exec/Plugin 承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パス整形 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ exec 承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共有承認 Gateway 解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway 境界を推奨 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | Exec/Plugin 承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録/get/watch ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DM ゲート、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | 固定ディスパッチャー、保護付き fetch、SSRF ポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat ヘルパー | Heartbeat ウェイク、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリおよび永続バックエンド付き重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備状態ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲートヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済み fetch/プロキシヘルパー | `resolveFetch`, プロキシヘルパー、EnvHttpProxyAgent オプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 再試行ヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リスト整形と入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲートとコマンドサーフェスヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、動的引数メニュー整形を含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook 本文ガードヘルパー | リクエスト本文の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | インバウンドディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 狭い返信ディスパッチヘルパー | ファイナライズ、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの非推奨マップヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdown チャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-at ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態および OAuth ディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキー ヘルパー | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネルステータスヘルパー | チャネル/アカウントステータス概要ビルダー、ランタイム状態のデフォルト、issue メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | request 風の入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout/stderr を備えた時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通のツール/CLI パラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーとリダクションヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト provider セットアップヘルパー | セルフホスト provider 検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト provider に特化したセットアップヘルパー | 同じセルフホスト provider 検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | provider ランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | provider API キーセットアップヘルパー | API キーオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | provider 認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | provider 選択ヘルパー | 設定済みまたは自動の provider 選択と生の provider 設定のマージ |
  | `plugin-sdk/provider-env-vars` | provider 環境変数ヘルパー | provider 認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有 provider モデル/リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、provider エンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有 provider カタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider オンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | provider HTTP ヘルパー | 音声文字起こしの multipart フォームヘルパーを含む、汎用 provider HTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch ヘルパー | web-fetch provider 登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search 設定ヘルパー | Plugin 有効化配線を必要としない provider 向けの狭い web-search 設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | provider web-search コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの狭い web-search 設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | provider web-search ヘルパー | web-search provider 登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | provider ツール/スキーマ互換性ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
  | `plugin-sdk/provider-usage` | provider 使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他の provider 使用量ヘルパー |
  | `plugin-sdk/provider-stream` | provider ストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | provider トランスポートヘルパー | guarded fetch、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブ provider トランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア fetch/変換/保存ヘルパー、ffprobe ベースの動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解 provider 型と、provider 向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換性エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキストチャンク化ヘルパー | 送信用テキストチャンク化ヘルパー |
  | `plugin-sdk/speech` | Speech ヘルパー | Speech provider 型に加え、provider 向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有 Speech コア | Speech provider 型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | provider 型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | provider 型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェント応答キュー、アクティブ実行音声制御、トランスクリプト/イベントヘルス、エコー抑制、相談質問マッチング、強制相談調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成 provider 型に加え、画像アセット/data URL ヘルパーと OpenAI 互換画像 provider ビルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成 provider/request/result 型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、provider 検索、model-ref 解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成 provider/request/result 型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、provider 検索、model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | チャネル設定プリミティブ | 狭いチャネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャネル設定書き込みヘルパー | チャネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャネルプレリュード | 共有チャネル Plugin プレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャネルステータスヘルパー | 共有チャネルステータススナップショット/概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | allowlist 設定ヘルパー | allowlist 設定編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM ガードヘルパー | crypto 前の狭いガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャネル/ステータスと ambient proxy ヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨の Webhook パスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨の Zod 互換性再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドル済み memory-core ヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量なメモリ埋め込み provider レジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカル provider、汎用バッチ/リモートヘルパー。具体的なリモート provider は所有する Plugin 内にある |
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
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダーニュートラルなメモリホストコアランタイムヘルパーのエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダーニュートラルなメモリホストイベントジャーナルヘルパーのエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ隣接 Plugin 向けの共有 managed-markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory 検索ファサード | 遅延 Active Memory search-manager ランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換性バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの目的別リポジトリローカルテストサブパスを使用 |
</Accordion>

この表は、SDK サーフェス全体ではなく、意図的に共通の移行サブセットに絞っています。コンパイラのエントリポイントインベントリは
`scripts/lib/plugin-sdk-entrypoints.json` にあり、パッケージのエクスポートは公開サブセットから生成されます。

予約済みのバンドル Plugin ヘルパーの継ぎ目は、公開 SDK エクスポートマップから廃止されました。ただし、公開済みの
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の `plugin-sdk/discord` シムのような、明示的に文書化された互換性ファサードは例外です。所有者固有のヘルパーは、それを所有する Plugin パッケージ内にあります。共有ホストの動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` のような汎用 SDK コントラクトを通す必要があります。

目的に合う最も狭いインポートを使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかをメンテナーに確認してください。

## 有効な非推奨項目

Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体に適用される、より範囲の狭い非推奨項目です。いずれも現在はまだ動作しますが、将来のメジャーリリースで削除されます。各項目の下のエントリは、古い API を正規の置き換え先に対応付けています。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。より狭いサブパスからインポートするだけです。`command-auth`
    は互換性スタブとしてこれらを再エクスポートします。

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

    **新**: `resolveInboundMentionDecision({ facts, policy })` - 2 つに分かれた呼び出しではなく、単一の判断オブジェクトを返します。

    下流のチャネル Plugin (Slack、Discord、Matrix、MS Teams) はすでに切り替え済みです。

  </Accordion>

  <Accordion title="チャネルランタイムシムとチャネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は古いチャネル Plugin 向けの互換性シムです。新しいコードからはインポートしないでください。ランタイムオブジェクトの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、生の「actions」チャネルエクスポートとともに非推奨です。代わりに、セマンティックな `presentation` サーフェスを通じて機能を公開してください。チャネル Plugin は、受け付ける生のアクション名ではなく、何をレンダリングするか (カード、ボタン、選択) を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーツールの tool() ヘルパー → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` からの `tool()` ファクトリ。

    **新**: プロバイダー Plugin 上で `createTool(...)` を直接実装します。
    OpenClaw はツールラッパーを登録するために SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキストのチャネルエンベロープ → BodyForAgent">
    **旧**: 受信チャネルメッセージからフラットなプレーンテキストのプロンプトエンベロープを構築するための `formatInboundEnvelope(...)` (および
    `ChannelMessageForAgent.channelEnvelope`)。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネル
    Plugin は、ルーティングメタデータ (スレッド、トピック、返信先、リアクション) をプロンプト文字列に連結するのではなく、型付きフィールドとして添付します。
    `formatAgentEnvelope(...)` ヘルパーは、合成されたアシスタント向けエンベロープでは引き続きサポートされますが、受信プレーンテキストエンベロープは廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および `channelEnvelope` テキストを後処理していた任意のカスタムチャネル Plugin。

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

    `deactivate` は、2026-08-16 以降まで非推奨の互換性エイリアスとして配線されたままです。

  </Accordion>

  <Accordion title="subagent_spawning フック → コアのスレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: コアがチャネルのセッションバインディングアダプターを通じて `thread: true` のサブエージェントバインディングを準備するようにします。起動後の観測にのみ
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

    さらに、レガシーな `ProviderCapabilities` 静的バッグがあります。プロバイダー Plugin は、静的オブジェクトではなく、`buildReplayPolicy`、
    `normalizeToolSchemas`、`wrapStreamFn` のような明示的なプロバイダーフックを使用する必要があります。

  </Accordion>

  <Accordion title="思考ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の 3 つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、およびランク付けされたレベル一覧を持つ
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。OpenClaw は、古い保存値をプロファイルのランクに基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意でマージされた `reasoning`、および任意でマージされたモデルの `compat` 事実が含まれます。プロバイダー Plugin は、設定済みのリクエストコントラクトが対応している場合にのみ、これらのカタログ事実を使ってモデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作し続けますが、プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部認証プロバイダー → contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに外部認証フックを実装する。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、**かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー環境変数ルックアップ → setup.providers[].envVars">
    **旧**マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ環境変数ルックアップをマニフェスト上の `setup.providers[].envVars` にミラーします。これにより、セットアップとステータスの環境メタデータが 1 か所に統合され、環境変数ルックアップに答えるためだけに Plugin ランタイムを起動することを避けられます。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプター経由で引き続きサポートされます。

  </Accordion>

  <Accordion title="メモリ Plugin 登録 → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: メモリ状態 API 上の 1 つの呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じスロットを単一の登録呼び出しで扱います。追加型のプロンプトおよびコーパスヘルパー
    (`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`) には影響しません。

  </Accordion>

  <Accordion title="メモリ埋め込みプロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用の埋め込みプロバイダーコントラクトはメモリの外でも再利用でき、新しいプロバイダーでサポートされるパスです。メモリ固有の登録 API は、既存プロバイダーが移行する間、非推奨の互換性として配線されたままです。
    Plugin 検査では、非バンドルでの使用が互換性負債として報告されます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` からまだエクスポートされている 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は非推奨で、`getSessionMessages` が推奨されます。同じシグネチャで、古いメソッドは新しいメソッドへ呼び出しを通します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow` (単数形) はライブのタスクフローアクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行する Plugin 向けに、管理対象の TaskFlow 変更ランタイムを保持します。Plugin が DTO ベースの読み取りだけを必要とする場合は `runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリ → エージェント tool-result ミドルウェア">
    上記の「移行方法 → 埋め込み tool-result 拡張をミドルウェアに移行する」で扱っています。完全性のためここにも含めています。削除された埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` 内の明示的なランタイム一覧を伴う
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在では
    `OpenClawConfig` への 1 行エイリアスです。正規の名前を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドル済みチャネル/プロバイダー Plugin 内にある拡張レベルの非推奨項目は、それぞれの `api.ts` と `runtime-api.ts` バレル内で追跡されています。これらはサードパーティ Plugin のコントラクトには影響せず、ここには記載していません。バンドル済み Plugin のローカルバレルを直接利用している場合は、アップグレード前にそのバレル内の非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 何が起こるか                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 非推奨サーフェスは実行時警告を出します                               |
| **次のメジャーリリース** | 非推奨サーフェスは削除されます。それらをまだ使用しているプラグインは失敗します |

すべてのコアプラグインはすでに移行済みです。外部プラグインは
次のメジャーリリースまでに移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定します。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避策であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初のプラグインを作成する
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [チャネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) - チャネルプラグインの作成
- [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) - プロバイダープラグインの作成
- [Plugin の内部](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
