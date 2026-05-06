---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Plugin を最新の Plugin アーキテクチャに更新しています
    - 外部の OpenClaw Plugin を保守している
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新の plugin SDK に移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-05-06T05:15:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーから、焦点を絞った文書化済みの import を備えた最新の Plugin
アーキテクチャへ移行しました。新しいアーキテクチャ以前に Plugin を構築していた場合、
このガイドが移行を支援します。

## 変更点

古い Plugin システムは、Plugin が単一のエントリポイントから必要なものを
何でも import できる、2 つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** - 数十個の
  ヘルパーを再 export する単一の import です。新しい Plugin アーキテクチャの構築中に、古い hook ベースの Plugin を動作させ続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、配信キュー、fetch/proxy ヘルパー、
  ファイルヘルパー、承認型、無関係なユーティリティを混在させた、広範な runtime ヘルパー barrel です。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中に非推奨の直接 load/write ヘルパーをまだ保持している、
  広範な config 互換性 barrel です。
- **`openclaw/extension-api`** - embedded agent runner のような host 側ヘルパーへ Plugin が直接アクセスできるようにする
  bridge です。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの embedded-runner イベントを監視できた、
  削除済みの Pi 専用 bundled
  extension hook です。

広範な import サーフェスは現在 **非推奨** です。runtime ではまだ動作しますが、
新しい Plugin はこれらを使用してはならず、既存の Plugin は
次のメジャーリリースで削除される前に移行する必要があります。Pi 専用の embedded extension factory
登録 API は削除されました。代わりに tool-result middleware を使用してください。

OpenClaw は、置き換えを導入する同じ変更で、文書化済みの Plugin 動作を
削除したり再解釈したりしません。破壊的な contract 変更は、まず
互換 adapter、diagnostics、docs、非推奨期間を経る必要があります。
これは SDK import、manifest field、setup API、hook、runtime
登録動作に適用されます。

<Warning>
  後方互換性レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している Plugin は、その時点で壊れます。
  Pi 専用の embedded extension factory registration は、すでに load されなくなっています。
</Warning>

## 変更理由

古いアプローチには問題がありました。

- **起動が遅い** - 1 つのヘルパーを import すると、数十個の無関係な module が load される
- **循環依存** - 広範な re-export により import cycle を作りやすい
- **不明瞭な API サーフェス** - どの export が stable で、どれが internal か判別できない

最新の Plugin SDK はこれを解決します。各 import path (`openclaw/plugin-sdk/\<subpath\>`)
は、明確な目的と文書化済み contract を持つ、小さく自己完結した module です。

bundled channel 向けの従来の provider convenience seam も廃止されました。
channel ブランドの helper seam は private mono-repo の shortcut であり、stable な
Plugin contract ではありません。代わりに狭い generic SDK subpath を使用してください。bundled
Plugin workspace 内では、provider 所有の helper をその Plugin 自身の `api.ts` または
`runtime-api.ts` に保持してください。

現在の bundled provider の例:

- Anthropic は Claude 固有の stream helper を自身の `api.ts` /
  `contract-api.ts` seam に保持しています
- OpenAI は provider builder、default-model helper、realtime provider
  builder を自身の `api.ts` に保持しています
- OpenRouter は provider builder と onboarding/config helper を自身の
  `api.ts` に保持しています

## Talk と realtime voice の移行計画

Realtime voice、telephony、meeting、browser Talk code は、
surface-local な turn bookkeeping から、`openclaw/plugin-sdk/realtime-voice` が export する共有 Talk session controller へ移行しています。
新しい controller は、共通の Talk event envelope、active turn state、capture state、output-audio state、recent
event history、stale-turn rejection を所有します。Provider Plugin は
vendor 固有の realtime session を引き続き所有し、surface Plugin は capture、
playback、telephony、meeting の quirks を引き続き所有する必要があります。

この Talk 移行は、意図的に breaking-clean です。

1. 共有 controller/runtime primitive を
   `plugin-sdk/realtime-voice` に保持します。
2. bundled surface を共有 controller へ移行します: browser relay、
   managed-room handoff、voice-call realtime、voice-call streaming STT、Google
   Meet realtime、native push-to-talk。
3. 古い Talk RPC family を最終版の `talk.session.*` と
   `talk.client.*` API に置き換えます。
4. Gateway
   `hello-ok.features.events` で 1 つの live Talk event channel を告知します: `talk.event`。
5. 古い realtime HTTP endpoint と request-time instruction
   override path を削除します。

新しい code は、low-level adapter または test fixture を実装している場合を除き、
`createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有 controller を優先すると、
turn-scoped event が turn id なしで emit されることを防ぎ、古い `turnEnd` /
`turnCancel` call がより新しい active turn を clear できず、telephony、meeting、browser relay、managed-room
handoff、native Talk client 全体で output-audio lifecycle
event の一貫性を保てます。

対象となる public API shape は次のとおりです。

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

browser 所有の WebRTC/provider-websocket session は `talk.client.create` を使用します。
browser が provider negotiation と media transport を所有し、
Gateway が credentials、instructions、tool policy を所有するためです。`talk.session.*` は、
gateway-relay realtime、gateway-relay
transcription、managed-room native STT/TTS session 向けの共通 Gateway-managed surface です。

`talk.provider` /
`talk.providers` の隣に realtime selector を置いていた legacy config は、`openclaw doctor --fix` で修復する必要があります。runtime Talk
は speech/TTS provider config を realtime provider config として再解釈しません。

サポートされる `talk.session.create` の組み合わせは意図的に少数です。

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway 経由で bridge される full-duplex provider audio。tool call は agent-consult tool 経由で route されます。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT のみ。caller は input audio を送信し、transcript event を受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | client が capture/playback を所有し、Gateway が turn state を所有する、push-to-talk および walkie-talkie style の room。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway tool action を直接実行する trusted first-party surface 向けの admin-only room mode。                  |

削除された method map:

| Old                              | New                                                      |
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

統一された control vocabulary も意図的に狭くしています。

| Method                          | Applies to                                              | Contract                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway connection が所有する provider session に base64 PCM audio chunk を append します。 |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room user turn を開始します。                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn validation 後に active turn を終了します。                                              |
| `talk.session.cancelTurn`       | すべての Gateway-owned session                              | turn の active capture/provider/agent/TTS work を cancel します。                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 必ずしも user turn を終了せずに assistant audio output を停止します。                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay が emit した provider tool call を complete します。                                           |
| `talk.session.close`            | すべての unified session                                    | relay session を停止するか managed-room state を revoke し、その後 unified session id を忘れます。         |

これを実現するために、core に provider や platform の special case を導入しないでください。
Core は Talk session semantics を所有します。Provider Plugin は vendor session setup を所有します。
Voice-call と Google Meet は telephony/meeting adapter を所有します。Browser と native
app は device capture/playback UX を所有します。

## 互換性ポリシー

external Plugin では、互換性対応は次の順序に従います。

1. 新しい contract を追加する
2. 古い動作を compatibility adapter 経由で接続したままにする
3. 古い path と replacement を示す diagnostic または warning を emit する
4. 両方の path を test で cover する
5. 非推奨と移行 path を文書化する
6. 告知済みの移行期間後にのみ削除する。通常はメジャーリリースで行う

  メンテナーは現在の移行キューを
  `pnpm plugins:boundary-report` で監査できます。コンパクトな件数には
  `pnpm plugins:boundary-report:summary` を、1 つの Plugin または互換性オーナーには
  `--owner <id>` を、期限を迎えた互換性レコード、オーナーをまたぐ予約済み SDK インポート、または未使用の予約済み SDK サブパスで CI ゲートを失敗させる必要がある場合は
  `pnpm plugins:boundary-report:ci` を使用してください。レポートは、非推奨の
  互換性レコードを削除日でグループ化し、ローカルのコード/ドキュメント参照を数え、
  オーナーをまたぐ予約済み SDK インポートを表示し、プライベートな
  メモリホスト SDK ブリッジを要約するため、互換性クリーンアップを
  場当たり的な検索に頼らず明示的に保てます。予約済み SDK サブパスには、追跡されたオーナー使用状況が必要です。
  未使用の予約済みヘルパーエクスポートは公開 SDK から削除してください。

  マニフェストフィールドがまだ受け入れられている場合、Plugin 作者は
  ドキュメントと診断が別の指示を出すまで使い続けられます。新しいコードではドキュメント化された
  置き換えを優先するべきですが、既存の plugins が通常のマイナー
  リリース中に壊れないようにしてください。

  ## 移行方法

  <Steps>
  <Step title="ランタイム設定の読み込み/書き込みヘルパーを移行する">
    バンドルされた plugins は
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめるべきです。アクティブな呼び出しパスに
    すでに渡されている設定を優先してください。現在のプロセススナップショットを必要とする
    長寿命ハンドラーは `api.runtime.config.current()` を使用できます。長寿命の
    エージェントツールは、設定書き込み前に作成されたツールでも更新後の
    ランタイム設定を見られるように、`execute` 内でツールコンテキストの `ctx.getRuntimeConfig()` を使用してください。

    設定の書き込みはトランザクション型ヘルパーを通し、書き込み後ポリシーを選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元が変更にはクリーンな Gateway 再起動が必要だと分かっている場合は
    `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元が
    後続処理を所有していてリロードプランナーを意図的に抑制したい場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用してください。
    ミューテーション結果には、テストとロギング用の型付き `followUp` 要約が含まれます。
    再起動の適用またはスケジュールは引き続き Gateway が担当します。
    `loadConfig` と `writeConfigFile` は、移行期間中、外部 plugins 向けの非推奨の互換性
    ヘルパーとして残り、`runtime-config-load-write` 互換性コードで一度だけ警告します。
    バンドルされた plugins とリポジトリのランタイムコードは、
    `pnpm check:deprecated-internal-config-api` と
    `pnpm check:no-runtime-action-load-config` のスキャナーガードレールで保護されています。新しい本番 Plugin 使用は
    即座に失敗し、直接の設定書き込みは失敗し、Gateway サーバーメソッドは
    リクエストのランタイムスナップショットを使用する必要があり、ランタイムチャンネルの send/action/client ヘルパーは
    境界から設定を受け取る必要があり、長寿命のランタイムモジュールで許可されるアンビエントな
    `loadConfig()` 呼び出しはゼロです。

    新しい Plugin コードでは、広範な
    `openclaw/plugin-sdk/config-runtime` 互換性バレルのインポートも避けるべきです。作業に合う狭い
    SDK サブパスを使用してください。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig` などの設定型 | `openclaw/plugin-sdk/config-types` |
    | 読み込み済み設定のアサーションと Plugin エントリー設定の検索 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在のランタイムスナップショット読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシーランタイムヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力の解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッションオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドルされた plugins とそのテストは、広範な
    バレルに対してスキャナーでガードされているため、インポートとモックは必要な挙動に対してローカルなままになります。広範な
    バレルは外部互換性のためにまだ存在しますが、新しいコードは
    それに依存するべきではありません。

  </Step>

  <Step title="Pi ツール結果拡張をミドルウェアへ移行する">
    バンドルされた plugins は、Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを
    ランタイム中立のミドルウェアに置き換える必要があります。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時に Plugin マニフェストを更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 plugins は、モデルが見る前に高信頼のツール出力を書き換えられるため、
    ツール結果ミドルウェアを登録できません。

  </Step>

  <Step title="承認ネイティブハンドラーをケイパビリティファクトへ移行する">
    承認対応チャンネル plugins は、`approvalCapability.nativeRuntime` と共有ランタイムコンテキストレジストリを通じて
    ネイティブ承認の挙動を公開するようになりました。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の認証/配信を、レガシーの `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開チャンネル Plugin
      契約から削除されました。delivery/native/render フィールドを `approvalCapability` へ移してください
    - `plugin.auth` はチャンネルのログイン/ログアウトフロー専用として残ります。そこでの承認認証
      フックは core からはもう読み取られません
    - クライアント、トークン、Bolt
      apps などのチャンネル所有ランタイムオブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください
    - ネイティブ承認ハンドラーから Plugin 所有の再ルーティング通知を送信しないでください。
      core は実際の配信結果から routed-elsewhere 通知を所有するようになりました
    - `channelRuntime` を `createChannelManager(...)` に渡す場合は、実際の
      `createPluginRuntime().channel` サーフェスを提供してください。部分スタブは拒否されます。

    現在の承認ケイパビリティレイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows ラッパーフォールバックの挙動を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決の Windows
    `.cmd`/`.bat` ラッパーは、明示的に
    `allowShellFallback: true` を渡さない限り閉じた状態で失敗するようになりました。

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
    `allowShellFallback` を設定せず、代わりにスローされたエラーを処理してください。

  </Step>

  <Step title="非推奨インポートを見つける">
    いずれかの非推奨サーフェスからのインポートを Plugin 内で検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点を絞ったインポートに置き換える">
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

    ホスト側ヘルパーでは、直接インポートする代わりに注入された Plugin ランタイムを使用してください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他のレガシーブリッジヘルパーにも適用されます。

    | 古いインポート | モダンな相当物 |
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
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、
    新しいコードでは実際に必要な焦点を絞ったヘルパーサーフェスをインポートするべきです。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat イベントと可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キュードレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャンネルアクティビティテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | メモリ内重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシとガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードとコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク同時実行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値強制変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドルされた plugins は `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが
    広範なバレルへ後退することはできません。

  </Step>

  <Step title="チャンネルルートヘルパーを移行する">
    新しいチャンネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用するべきです。
    古い route-key 名と comparable-target 名は、移行期間中は互換性
    エイリアスとして残りますが、新しい plugins では挙動を直接説明するルート
    名を使用してください。

    | 古いヘルパー | モダンなヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、インバウンド重複排除、cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }`
    を一貫して正規化します。Plugin がカスタムターゲット文法を所有している場合は、`resolveChannelRouteTargetWithParser(...)` を使用して、その
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

  <Accordion title="共通インポートパステーブル">
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPluginエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 特化したチャネルエントリ定義とビルダー | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | Allowlistプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | インポート安全なセットアップパッチアダプター、lookup-noteヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委任セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | セットアップアダプターヘルパー | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウント一覧/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウントIDヘルパー | `DEFAULT_ACCOUNT_ID`、アカウントID正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 限定的なアカウントヘルパー | アカウント一覧/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーとDMアクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClawが保守するバンドルPluginのみ。新しいPluginはPluginローカルスキーマを定義する必要がある |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守対象のバンドルPluginには `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウントステータスと下書きストリームのライフサイクルヘルパー | `createAccountStatusSink`、下書きプレビュー最終化ヘルパー |
  | `plugin-sdk/inbound-envelope` | インバウンドエンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | インバウンド返信ヘルパー | 共有の記録およびディスパッチヘルパー |
  | `plugin-sdk/messaging-targets` | メッセージングターゲットの解析 | ターゲット解析/マッチングヘルパー |
  | `plugin-sdk/outbound-media` | アウトバウンドメディアヘルパー | 共有アウトバウンドメディア読み込み |
  | `plugin-sdk/outbound-send-deps` | アウトバウンド送信依存関係ヘルパー | 完全なアウトバウンドランタイムをインポートしない軽量な `resolveOutboundSendDep` 検索 |
  | `plugin-sdk/outbound-runtime` | アウトバウンドランタイムヘルパー | アウトバウンド配信、ID/送信デリゲート、セッション、フォーマット、ペイロード計画ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト用のエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果タイプ | 返信結果タイプ |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
  | `plugin-sdk/runtime-env` | 限定的なランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムヘルパー | Pluginコマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有execヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンドフォーマット、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアント、イベントループ準備済み開始ヘルパー、チャネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-types`、`plugin-config-runtime`、`runtime-config-snapshot`、`config-mutation` を推奨 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドルされたTelegram契約サーフェスが利用できない場合のフォールバック安定なTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | Exec/Plugin承認ペイロード、承認機能/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブexec承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認機能/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共有承認Gateway解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gatewayシームを推奨 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | Exec/Plugin承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DMゲーティング、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホストAllowlistとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | 固定ディスパッチャー、保護付きfetch、SSRFポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeatヘルパー | Heartbeatイベントと可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリ重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーフォーマットヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`、エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/プロキシヘルパー | `resolveFetch`、プロキシヘルパー、EnvHttpProxyAgentオプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`、ポリシーランナー |
  | `plugin-sdk/allow-from` | Allowlistフォーマット | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェスヘルパー | `resolveControlCommandGate`、送信者承認ヘルパー、動的引数メニューフォーマットを含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook本文ガードヘルパー | リクエスト本文の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | インバウンドディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 限定的な返信ディスパッチヘルパー | 最終化、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdownチャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + 更新日時ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態およびOAuthディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネルステータスヘルパー | チャネル/アカウントステータス要約ビルダー、ランタイム状態デフォルト、問題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエストURLヘルパー | リクエスト風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化されたstdout/stderrを備えた時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール/CLIパラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化済みペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダー設定ヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダーに特化した設定ヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダー API キー設定ヘルパー | API キーオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-auth-login` | プロバイダー対話型ログインヘルパー | 共有の対話型ログインヘルパー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動プロバイダー選択と生プロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/再生ヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有再生ポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 音声文字起こしのマルチパートフォームヘルパーを含む、汎用プロバイダー HTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダー Web フェッチヘルパー | Web フェッチプロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | Plugin 有効化配線を必要としないプロバイダー向けの限定的な Web 検索設定/資格情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き資格情報セッター/ゲッターなどの限定的な Web 検索設定/資格情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini スキーマクリーンアップ + 診断、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
  | `plugin-sdk/provider-usage` | プロバイダー使用状況ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用状況ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付きフェッチ、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア取得/変換/保存ヘルパー、ffprobe に基づく動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル不足メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 共有テキストヘルパー | アシスタント可視テキストの除去、Markdown レンダリング/チャンク化/テーブルヘルパー、秘匿化ヘルパー、ディレクティブタグヘルパー、安全なテキストユーティリティ、関連するテキスト/ロギングヘルパー |
  | `plugin-sdk/text-chunking` | テキストチャンク化ヘルパー | 送信テキストチャンク化ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェント応答キュー、トランスクリプト/イベント健全性、エコー抑制、高速コンテキスト参照ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | 対話型返信ヘルパー | 対話型返信ペイロードの正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 限定的なチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプレリュード | 共有チャンネル Plugin プレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータススナップショット/サマリーヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm` | ダイレクト DM ヘルパー | 共有ダイレクト DM 認証/ガードヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル/ステータスとアンビエントプロキシヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | Webhook パスヘルパー | Webhook パス正規化ヘルパー |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | Zod 再エクスポート | Plugin SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドルされたメモリコアヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーは所有元の plugins に存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー | メモリホストイベントジャーナルヘルパー |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダー中立のメモリホストコアランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダー中立のメモリホストイベントジャーナルヘルパーエイリアス |
  | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムエイリアス | ベンダー中立のメモリホストファイル/ランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ隣接 plugins 向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | アクティブメモリ検索ファサード | 遅延アクティブメモリ検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | メモリホストステータスエイリアス | ベンダー中立のメモリホストステータスヘルパーエイリアス |
  | `plugin-sdk/testing` | テストユーティリティ | レガシーの広範な互換バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの対象を絞ったテストサブパスを優先 |
</Accordion>

この表は意図的に共通移行サブセットであり、SDK サーフェス全体ではありません。200 以上のエントリポイントの完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約済みのバンドル Plugin ヘルパーシームは、公開済み SDK エクスポートマップから廃止されています。ただし、公開済みの
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の `plugin-sdk/discord` shim など、明示的に文書化された互換ファサードは例外です。所有者固有のヘルパーは、所有する Plugin パッケージ内にあります。共有ホスト動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトを通じて移動する必要があります。

作業に合う最も狭い import を使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかをメンテナーに確認してください。

## 有効な非推奨項目

Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体に適用される、より狭い非推奨項目です。各項目は現在も動作しますが、将来のメジャーリリースで削除されます。各項目の下にあるエントリは、古い API を正規の置き換え先に対応付けます。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。ただし、より狭いサブパスから import します。`command-auth`
    は互換スタブとしてそれらを再エクスポートします。

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

    **新**: `resolveInboundMentionDecision({ facts, policy })` - 分割された
    2 つの呼び出しではなく、単一の判定オブジェクトを返します。

    下流のチャネル Plugin (Slack、Discord、Matrix、MS Teams) はすでに
    切り替え済みです。

  </Accordion>

  <Accordion title="チャネルランタイム shim とチャネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は古いチャネル Plugin 向けの互換
    shim です。新しいコードから import しないでください。ランタイム
    オブジェクトの登録には `openclaw/plugin-sdk/channel-runtime-context`
    を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    raw な「actions」チャネルエクスポートとともに非推奨です。代わりに、セマンティックな
    `presentation` サーフェスを通じて機能を公開してください。チャネル Plugin は、受け付ける
    raw アクション名ではなく、レンダリングするもの (カード、ボタン、セレクト) を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーツールの tool() ヘルパー → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` ファクトリー。

    **新**: プロバイダー Plugin で `createTool(...)` を直接実装します。
    OpenClaw はツールラッパーを登録するための SDK ヘルパーを不要にしました。

  </Accordion>

  <Accordion title="プレーンテキストのチャネルエンベロープ → BodyForAgent">
    **旧**: inbound チャネルメッセージからフラットなプレーンテキストプロンプト
    エンベロープを構築するための `formatInboundEnvelope(...)` (および
    `ChannelMessageForAgent.channelEnvelope`)。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネル
    Plugin は、ルーティングメタデータ (スレッド、トピック、返信先、リアクション) を
    プロンプト文字列に連結する代わりに、型付きフィールドとして付与します。
    `formatAgentEnvelope(...)` ヘルパーは合成されたアシスタント向けエンベロープでは引き続きサポートされますが、inbound プレーンテキストエンベロープは廃止予定です。

    影響を受ける領域: `inbound_claim`、`message_received`、および
    `channelEnvelope` テキストを後処理していた任意のカスタムチャネル Plugin。

  </Accordion>

  <Accordion title="プロバイダー探索型 → プロバイダーカタログ型">
    4 つの探索型エイリアスは、現在ではカタログ時代の型の薄いラッパーです。

    | 古いエイリアス            | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、レガシーな `ProviderCapabilities` 静的バッグがあります。プロバイダー
    Plugin は静的オブジェクトではなく、`buildReplayPolicy`、
    `normalizeToolSchemas`、`wrapStreamFn` などの明示的なプロバイダーフックを使用する必要があります。

  </Accordion>

  <Accordion title="Thinking ポリシーフック → resolveThinkingProfile">
    **旧** (`ProviderThinkingPolicy` 上の 3 つの個別フック):
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、およびランク付けされたレベル一覧を持つ
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は、保存済みの古い値をプロファイルランクに基づいて自動的にダウングレードします。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作しますが、
    プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部 OAuth プロバイダーのフォールバック → contracts.externalAuthProviders">
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

  <Accordion title="プロバイダー env-var 参照 → setup.providers[].envVars">
    **旧** マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var 参照をマニフェスト上の `setup.providers[].envVars`
    にミラーします。これにより、セットアップ/ステータスの env メタデータを 1 か所に統合し、
    env-var 参照に答えるだけのために Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換アダプターを通じてサポートされます。

  </Accordion>

  <Accordion title="Memory Plugin 登録 → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **新**: memory-state API 上の 1 つの呼び出し -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    同じスロット、単一の登録呼び出しです。追加型のメモリヘルパー
    (`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`) は影響を受けません。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名前変更">
    `src/plugins/runtime/types.ts` から引き続きエクスポートされている 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は `getSessionMessages` に置き換えられ、非推奨です。
    同じシグネチャで、古いメソッドは新しいメソッドに委譲します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow` (単数形) はライブ task-flow アクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行する
    Plugin 向けに、管理対象 TaskFlow 変更ランタイムを保持します。Plugin が DTO ベースの読み取りだけを必要とする場合は
    `runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリー → エージェントツール結果ミドルウェア">
    上記の「移行方法 → Pi ツール結果拡張をミドルウェアへ移行する」で扱っています。
    完全性のためここにも含めます。削除された Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` 内の明示的なランタイム
    一覧を伴う `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、現在では
    `OpenClawConfig` の 1 行エイリアスです。正規名を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドル済みチャネル/プロバイダー Plugin 内にある拡張レベルの非推奨項目は、それぞれ独自の `api.ts` と `runtime-api.ts`
バレル内で追跡されています。それらはサードパーティ Plugin コントラクトには影響せず、ここには記載していません。バンドル済み Plugin のローカルバレルを直接使用している場合は、アップグレード前にそのバレル内の非推奨コメントを読んでください。
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

これは一時的な退避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初の Plugin を構築する
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパス import リファレンス
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - チャネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築
- [Plugin 内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
