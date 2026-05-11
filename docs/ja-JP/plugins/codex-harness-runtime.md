---
read_when:
    - Codex ハーネスのランタイムサポート契約が必要です
    - ネイティブ Codex ツール、フック、Compaction、またはフィードバックアップロードをデバッグしている
    - PI と Codex ハーネスのターン全体で plugin の動作を変更しています
summary: Codex ハーネスのランタイム境界、フック、ツール、権限、診断
title: Codex ハーネスランタイム
x-i18n:
    generated_at: "2026-05-11T20:33:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

このページでは、Codex harness ターンのランタイム契約を説明します。セットアップと
ルーティングについては、[Codex harness](/ja-JP/plugins/codex-harness) から始めてください。設定フィールドについては、
[Codex harness reference](/ja-JP/plugins/codex-harness-reference) を参照してください。

## 概要

Codex モードは、下層のモデル呼び出しだけが異なる PI ではありません。Codex は
ネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin、
ツール、セッション、診断のサーフェスを適応させます。

OpenClaw は引き続き、チャネルルーティング、セッションファイル、表示メッセージ配信、
OpenClaw 動的ツール、承認、メディア配信、トランスクリプトミラーを所有します。
Codex は正規のネイティブスレッド、ネイティブモデルループ、ネイティブツールの
継続、ネイティブ Compaction を所有します。

## スレッドバインディングとモデル変更

OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンでは
現在選択されている OpenAI モデル、承認ポリシー、サンドボックス、サービス階層が
再び app-server に送信されます。`openai/gpt-5.5` から
`openai/gpt-5.2` に切り替えてもスレッドバインディングは維持されますが、Codex には
新しく選択されたモデルで続行するよう要求します。

## 表示返信と Heartbeat

ソースチャットターンが Codex harness を通る場合、デプロイメントで
`messages.visibleReplies` が明示的に設定されていなければ、表示返信はデフォルトで
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開のまま
終了できます。チャネルに投稿するのは `message(action="send")` を呼び出した場合だけです。
直接チャットの最終返信を従来の自動配信パスに維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンも、デフォルトで検索可能な OpenClaw ツールカタログに
`heartbeat_respond` を取得するため、エージェントは最終テキストにその制御フローを
埋め込まずに、ウェイクを静かにしておくべきか通知すべきかを記録できます。

Heartbeat 固有の主体的行動ガイダンスは、Heartbeat ターン自体で Codex の
コラボレーションモード開発者指示として送信されます。通常のチャットターンでは、
通常のランタイムプロンプトに Heartbeat の考え方を引き継ぐのではなく、Codex Default
モードに戻します。

## フック境界

Codex harness には 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex harness 間の製品/Plugin 互換性。                        |
| Codex app-server 拡張ミドルウェア     | OpenClaw 同梱 Plugin     | OpenClaw 動的ツールの周辺におけるターンごとのアダプター動作。       |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使って
OpenClaw Plugin の動作をルーティングしません。サポートされるネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用の
スレッドごとの Codex 設定を注入します。

Codex app-server 承認が有効な場合、つまり `approvalPolicy` が `"never"` ではない場合、
デフォルトで注入されるネイティブフック設定は `PermissionRequest` を省略し、Codex の
app-server レビュー担当と OpenClaw の承認ブリッジが、レビュー後の実際のエスカレーションを
処理します。互換性リレーが必要な場合、オペレーターは `nativeHookRelay.events` に
`permission_request` を明示的に追加できます。

`SessionStart` や `UserPromptSubmit` などの他の Codex フックは、Codex レベルの制御のままです。
これらは v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを
実行するため、OpenClaw は harness アダプター内で自分が所有する Plugin と
ミドルウェアの動作を発火します。Codex ネイティブツールについては、Codex が正規の
ツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が
app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、
ネイティブ Codex スレッドを書き換えることはできません。

Codex app-server のアイテム通知は、ネイティブ `PostToolUse` リレーでまだカバーされていない
ネイティブツール完了について、非同期の `after_tool_call` 観測も提供します。これらの観測は
テレメトリと Plugin 互換性専用です。ネイティブツール呼び出しをブロック、遅延、変更することは
できません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、
Codex app-server 通知と OpenClaw アダプター状態から得られます。OpenClaw の
`before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントは、
Codex の内部リクエストや Compaction ペイロードのバイト単位のキャプチャではなく、
アダプターレベルの観測です。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                    | サポート                                                                         | 理由                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート                                                                         | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                             |
| OpenClaw チャネルルーティングと配信           | サポート                                                                         | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                     |
| OpenClaw 動的ツール                           | サポート                                                                         | Codex がこれらのツールの実行を OpenClaw に要求するため、OpenClaw は実行パス内に留まります。                                                                                                               |
| プロンプトとコンテキスト Plugin               | サポート                                                                         | OpenClaw はスレッドを開始または再開する前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンへ投影します。                                                                                   |
| コンテキストエンジンのライフサイクル          | サポート                                                                         | Assemble、ingest、ターン後メンテナンス、コンテキストエンジンの Compaction 調整が Codex ターンで実行されます。                                                                                           |
| 動的ツールフック                              | サポート                                                                         | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアが、OpenClaw 所有の動的ツールの周囲で実行されます。                                                                                         |
| ライフサイクルフック                          | アダプター観測としてサポート                                                     | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火します。                                                                            |
| 最終回答改訂ゲート                            | ネイティブフックリレー経由でサポート                                             | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は最終化の前に Codex にもう 1 回モデルパスを要求します。                                                                               |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート                                             | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、確定済みネイティブツールサーフェスにリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | Codex app-server 承認と互換性ネイティブフックリレー経由でサポート                | Codex app-server 承認要求は、Codex レビュー後に OpenClaw を通じてルーティングされます。`PermissionRequest` ネイティブフックリレーは、Codex が guardian レビュー前にそれを発行するため、ネイティブ承認モードではオプトインです。 |
| App-server 軌跡キャプチャ                     | サポート                                                                         | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                     |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                          | V1 境界                                                                                                                                          | 将来のパス                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                          | Codex ネイティブの事前ツールフックはブロックできますが、OpenClaw は Codex ネイティブツール引数を書き換えません。                               | 置換ツール入力に対する Codex フック/スキーマサポートが必要です。                        |
| 編集可能な Codex ネイティブトランスクリプト履歴     | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部状態を変更すべきではありません。 | ネイティブスレッド手術が必要な場合は、明示的な Codex app-server API を追加します。      |
| Codex ネイティブツールレコード向け `tool_result_persist` | そのフックは、Codex ネイティブツールレコードではなく、OpenClaw 所有のトランスクリプト書き込みを変換します。                                    | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。 |
| リッチなネイティブ Compaction メタデータ            | OpenClaw は Compaction の開始と完了を観測しますが、安定した保持/削除リスト、トークン差分、要約ペイロードは受け取りません。                    | よりリッチな Codex Compaction イベントが必要です。                                      |
| Compaction 介入                                     | 現在の OpenClaw Compaction フックは Codex モードでは通知レベルです。                                                                            | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の事前/事後 Compaction フックを追加します。 |
| バイト単位のモデル API リクエストキャプチャ         | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex core が最終的な OpenAI API リクエストを内部で構築します。                 | Codex のモデルリクエストトレースイベントまたはデバッグ API が必要です。                 |

## ネイティブ権限と MCP elicitations

`PermissionRequest` について、OpenClaw はポリシーが決定した場合にのみ、明示的な許可または拒否の決定を返します。
決定なしの結果は許可ではありません。Codex はそれをフック決定なしとして扱い、自身の guardian または
ユーザー承認パスへフォールスルーします。

Codex app-server の承認モードは、既定ではこのネイティブ hook を省略します。この挙動は、`permission_request` が
`nativeHookRelay.events` に明示的に含まれている場合、または互換ランタイムがそれをインストールする場合に適用されます。

オペレーターが Codex のネイティブ権限リクエストで `allow-always` を選択すると、OpenClaw はその正確なプロバイダー/セッション/ツール入力/cwd フィンガープリントを、制限されたセッション期間にわたって記憶します。記憶された判断は意図的に完全一致のみです。コマンド、引数、ツールペイロード、cwd のいずれかが変わると、新しい承認が作成されます。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` としてマークした場合、OpenClaw の plugin 承認フローを経由してルーティングされます。Codex の `request_user_input` プロンプトは元のチャットに送り返され、次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導される代わりに、そのネイティブサーバーリクエストへの回答になります。その他の MCP elicitation リクエストはクローズドに失敗します。

## キュー誘導

アクティブ実行中のキュー誘導は、Codex app-server の `turn/steer` に対応します。既定の `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏ウィンドウ内でキューに入ったチャットメッセージをまとめ、到着順に 1 件の `turn/steer` リクエストとして送信します。従来の `queue` モードは、個別の `turn/steer` リクエストを送信します。

Codex のレビューターンと手動 Compaction ターンは、同一ターンの誘導を拒否することがあります。その場合、選択されたモードでフォールバックが許可されていれば、OpenClaw はフォローアップキューを使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

## Codex フィードバックアップロード

ネイティブ Codex ハーネスを使用するセッションで `/diagnostics [note]` が承認されると、OpenClaw は関連する Codex スレッドについて Codex app-server の `feedback/upload` も呼び出します。このアップロードは、一覧に含まれる各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に依頼します。

アップロードは、Codex の通常のフィードバック経路を通じて OpenAI サーバーに送られます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server のエラーを返します。完了した診断返信には、送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。

承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力せず、Codex フィードバックも送信しません。このアップロードは、ローカル Gateway 診断エクスポートを置き換えるものではありません。承認、プライバシー、ローカルバンドル、グループチャットでの挙動については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在接続されているスレッドの Codex フィードバックアップロードだけが特に必要な場合にのみ、`/codex diagnostics [note]` を使用してください。

## Compaction とトランスクリプトミラー

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は Codex app-server に委譲されます。OpenClaw は、チャンネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのために、トランスクリプトミラーを保持します。

ミラーには、ユーザープロンプト、最終的なアシスタントテキスト、app-server が出力した場合の軽量な Codex 推論または計画レコードが含まれます。現在、OpenClaw はネイティブ Compaction の開始シグナルと完了シグナルのみを記録します。人間が読める Compaction サマリーや、Compaction 後に Codex が保持したエントリの監査可能な一覧は、まだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在、Codex ネイティブのツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用されます。

## メディアと配信

OpenClaw は引き続き、メディア配信とメディアプロバイダーの選択を所有します。画像、動画、音楽、PDF、TTS、メディア理解では、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、
`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル設定を使用します。

テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信経路を引き続き通ります。メディア生成に PI は不要です。Codex が `savedPath` を含むネイティブ画像生成アイテムを出力した場合、Codex ターンにアシスタントテキストがなくても、OpenClaw はその正確なファイルを通常の返信メディア経路で転送します。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)
- [Plugin hooks](/ja-JP/plugins/hooks)
- [エージェントハーネス plugins](/ja-JP/plugins/sdk-agent-harness)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [Trajectory エクスポート](/ja-JP/tools/trajectory)
