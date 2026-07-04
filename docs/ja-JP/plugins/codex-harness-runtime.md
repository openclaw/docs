---
read_when:
    - Codex ハーネスのランタイムサポート契約が必要です
    - ネイティブの Codex ツール、フック、Compaction、またはフィードバックアップロードをデバッグしている
    - OpenClaw と Codex ハーネスのターン全体で Plugin の動作を変更している
summary: Codexハーネスのランタイム境界、フック、ツール、権限、診断
title: Codex ハーネスランタイム
x-i18n:
    generated_at: "2026-07-04T20:25:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

このページでは、Codex ハーネスのターンに関するランタイム契約を説明します。セットアップと
ルーティングについては、[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## 概要

Codex モードは、内部のモデル呼び出しだけを変えた OpenClaw ではありません。Codex は
ネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin、ツール、セッション、
診断サーフェスを適応させます。

OpenClaw は引き続き、チャネルルーティング、セッションファイル、可視メッセージ配信、
OpenClaw 動的ツール、承認、メディア配信、トランスクリプトミラーを所有します。
Codex は、正規のネイティブスレッド、ネイティブモデルループ、ネイティブツールの
継続、ネイティブ Compaction を所有します。

プロンプトのルーティングは、プロバイダー文字列だけでなく、選択されたランタイムに従います。
ネイティブ Codex ターンは Codex app-server の開発者指示を受け取り、一方で
明示的な OpenClaw 互換ルートは、Codex 風の OpenAI 認証またはトランスポートを使う場合でも
通常の OpenClaw システムプロンプトを維持します。

ネイティブ Codex は、アクティブな Codex スレッド設定に従って、Codex 所有のベース/モデル指示とプロジェクトドキュメント動作を保持します。OpenClaw は、ワークスペースの
パーソナリティファイルと OpenClaw エージェント ID が権威を持ち続けるように、Codex の組み込みパーソナリティを無効にした状態でネイティブ
Codex スレッドを開始および再開します。軽量な
OpenClaw 実行では、既存のプロジェクトドキュメント抑制も引き続き保持されます。OpenClaw の
開発者指示は、ソースチャネル配信、OpenClaw 動的ツール、ACP 委譲、アダプターコンテキスト、
アクティブなエージェントワークスペースのプロファイルファイルなど、OpenClaw ランタイム上の関心事を扱います。OpenClaw の Skills カタログとツール経由の
`MEMORY.md` ポインターは、ネイティブ Codex 向けのターンスコープのコラボレーション開発者指示として投影されます。アクティブな `BOOTSTRAP.md` の内容と完全な
`MEMORY.md` フォールバック注入は、引き続きターン入力の参照コンテキストを使用します。

## スレッドバインディングとモデル変更

OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンでは
現在選択されている OpenAI モデル、承認ポリシー、サンドボックス、サービス階層が app-server に再送信されます。`openai/gpt-5.5` から
`openai/gpt-5.2` へ切り替えると、スレッドバインディングは維持されますが、
新しく選択されたモデルで継続するよう Codex に要求します。

## 可視返信と Heartbeat

直接/ソースチャットのターンが Codex ハーネスを通じて実行される場合、可視返信は
内部 WebChat サーフェス向けに、デフォルトで最終アシスタント応答の自動配信になります。
これにより、Codex は Pi ハーネスのプロンプト契約と整合します。エージェントは
通常どおり返信し、OpenClaw は最終テキストをソース会話に投稿します。直接/ソースチャットで
エージェントが `message(action="send")` を呼び出さない限り、最終アシスタントテキストを意図的に非公開にしておきたい場合は、
`messages.visibleReplies: "message_tool"` を設定します。

Codex Heartbeat ターンでは、デフォルトで検索可能な OpenClaw
ツールカタログにも `heartbeat_respond` が含まれるため、エージェントは最終テキストにその制御フローをエンコードせずに、
起動を静かに保つべきか通知すべきかを記録できます。

Heartbeat 固有のイニシアチブガイダンスは、Heartbeat ターン自体に Codex コラボレーションモードの
開発者指示として送信されます。通常のチャットターンでは、
通常のランタイムプロンプトに Heartbeat の哲学を持ち越すのではなく、Codex Default モードに戻します。
空でない `HEARTBEAT.md` が存在する場合、Heartbeat の
コラボレーションモード指示は、その内容をインライン展開する代わりに Codex にそのファイルを参照させます。

## フック境界

Codex ハーネスには 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | OpenClaw と Codex ハーネス間のプロダクト/Plugin 互換性。            |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。               |
| Codex ネイティブフック                | Codex                    | Codex 設定に基づく低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされるネイティブツールと権限ブリッジについては、
OpenClaw は `PreToolUse`、`PostToolUse`、
`PermissionRequest`、`Stop` 用のスレッドごとの Codex 設定を注入します。

Codex app-server の承認が有効な場合、つまり `approvalPolicy` が
`"never"` ではない場合、デフォルトで注入されるネイティブフック設定では `PermissionRequest` が省略されるため、
Codex の app-server レビュアーと OpenClaw の承認ブリッジが、レビュー後の実際の
エスカレーションを処理します。互換リレーが必要な場合、オペレーターは
`nativeHookRelay.events` に `permission_request` を明示的に追加できます。

`SessionStart` や `UserPromptSubmit` などの他の Codex フックは、
Codex レベルの制御として残ります。これらは v1
契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェア動作を発火します。Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。
OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフック
コールバックを通じてその操作を公開しない限り、ネイティブ Codex
スレッドを書き換えることはできません。

Codex app-server のレポートモード `PreToolUse` イベントは、Plugin 承認リクエストを
対応する app-server 承認に委ねます。OpenClaw の `before_tool_call` フックが
`requireApproval` を返し、ネイティブペイロードがレポート承認モード
（`openclaw_approval_mode` が `"report"`）を設定している場合、ネイティブフックリレーは
Plugin 承認要件を記録し、ネイティブ決定を返しません。Codex が
同じツール使用に対して app-server 承認リクエストを送信すると、OpenClaw は Plugin
承認プロンプトを開き、その決定を Codex にマッピングして返します。Codex の `PermissionRequest`
イベントは別の承認パスであり、そのブリッジ向けにランタイムが設定されている場合は、引き続き OpenClaw
承認を経由してルーティングできます。

Codex app-server のアイテム通知は、ネイティブ `PostToolUse` リレーですでにカバーされていない
ネイティブツール完了について、非同期の `after_tool_call`
観測も提供します。これらの観測はテレメトリと Plugin
互換性のためだけのものであり、ネイティブツール呼び出しをブロック、遅延、変更することはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、Codex app-server
通知と OpenClaw アダプター状態から得られます。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output`
イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードを
バイト単位でキャプチャしたものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                    | サポート                                                                         | 理由                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート                                                                         | Codex app-server が OpenAI ターン、ネイティブスレッドの再開、ネイティブツールの継続を所有します。                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenClaw チャネルルーティングと配信          | サポート                                                                         | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                                                                                                                                                                                                                                                                                               |
| OpenClaw 動的ツール                          | サポート                                                                         | Codex はこれらのツールの実行を OpenClaw に依頼するため、OpenClaw は実行パスに留まります。                                                                                                                                                                                                                                                                                                                                                                                          |
| プロンプトとコンテキスト Plugin              | サポート                                                                         | OpenClaw は OpenClaw 固有のプロンプト/コンテキストを Codex ターンに投影しつつ、Codex が所有するベース、モデル、設定済みプロジェクトドキュメントのプロンプトはネイティブ Codex レーンに残します。OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化するため、エージェントワークスペースのパーソナリティファイルが引き続き信頼できる情報源になります。ネイティブ Codex 開発者指示は、`codex_app_server` に明示的にスコープされたコマンドガイダンスのみを受け入れます。レガシーなグローバルコマンドヒントは、非 Codex プロンプトサーフェス向けに残ります。 |
| コンテキストエンジンのライフサイクル        | サポート                                                                         | 組み立て、取り込み、ターン後メンテナンスは Codex ターンの前後で実行されます。コンテキストエンジンはネイティブ Codex Compaction を置き換えません。                                                                                                                                                                                                                                                                                                                                    |
| 動的ツールフック                              | サポート                                                                         | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw が所有する動的ツールの前後で実行されます。                                                                                                                                                                                                                                                                                                                                                                |
| ライフサイクルフック                          | アダプター観測としてサポート                                                     | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火します。                                                                                                                                                                                                                                                                                                                                                       |
| 最終回答の修正ゲート                          | ネイティブフックリレー経由でサポート                                             | Codex `Stop` は `before_agent_finalize` に中継されます。`revise` は、確定前にもう 1 回モデルパスを実行するよう Codex に依頼します。                                                                                                                                                                                                                                                                                                                                                   |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート                                             | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降での MCP ペイロードを含む、コミット済みネイティブツールサーフェス向けに中継されます。ブロックはサポートされますが、引数の書き換えはサポートされません。                                                                                                                                                                                                                                                     |
| ネイティブ権限ポリシー                        | Codex app-server 承認と互換性ネイティブフックリレー経由でサポート                | Codex app-server の承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされます。`PermissionRequest` ネイティブフックリレーは、Codex が guardian レビュー前にそれを発行するため、ネイティブ承認モードではオプトインです。                                                                                                                                                                                                                                              |
| App-server トラジェクトリキャプチャ          | サポート                                                                         | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                                                                                                                                                                                                                                                                                              |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                          | V1 境界                                                                                                                                         | 今後のパス                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数のミューテーション             | Codex ネイティブ pre-tool フックはブロックできますが、OpenClaw は Codex ネイティブツール引数を書き換えません。                                | 置換ツール入力に対する Codex フック/スキーマサポートが必要です。                         |
| 編集可能な Codex ネイティブトランスクリプト履歴    | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、未サポートの内部を変更すべきではありません。 | ネイティブスレッド手術が必要な場合は、明示的な Codex app-server API を追加します。        |
| Codex ネイティブツール記録の `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブツール記録ではありません。                      | 変換済み記録をミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。  |
| リッチなネイティブ Compaction メタデータ           | OpenClaw はネイティブ Compaction をリクエストできますが、安定した保持/削除リスト、トークン差分、完了サマリー、サマリーペイロードは受け取りません。 | よりリッチな Codex Compaction イベントが必要です。                                       |
| Compaction 介入                                    | OpenClaw は Plugin やコンテキストエンジンがネイティブ Codex Compaction を拒否、書き換え、置換することを許可しません。                         | Plugin がネイティブ Compaction の拒否または書き換えを必要とする場合は、Codex pre/post Compaction フックを追加します。 |
| バイト単位で一致するモデル API リクエストキャプチャ | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex コアが最終的な OpenAI API リクエストを内部で構築します。                 | Codex モデルリクエストトレースイベントまたはデバッグ API が必要です。                    |

## ネイティブ権限と MCP 要求

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の判断を返します。判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、自身の guardian またはユーザー承認パスにフォールスルーします。

Codex app-server 承認モードは、デフォルトでこのネイティブフックを省略します。この動作は、`permission_request` が `nativeHookRelay.events` に明示的に含まれている場合、または互換性ランタイムがそれをインストールする場合に適用されます。

オペレーターが Codex ネイティブ権限リクエストに対して `allow-always` を選択すると、OpenClaw はその正確なプロバイダー/セッション/ツール入力/cwd フィンガープリントを、限定されたセッションウィンドウ内で記憶します。記憶された判断は意図的に完全一致のみです。コマンド、引数、ツールペイロード、または cwd が変更されると、新しい承認が作成されます。

Codex MCP ツール承認要求は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フロー経由でルーティングされます。Codex `request_user_input` プロンプトは送信元チャットに送り返され、次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP 要求リクエストは fail closed します。

これらのプロンプトを運ぶ一般的な Plugin 承認フローについては、[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests) を参照してください。

## キュー誘導

アクティブ実行キュー誘導は Codex app-server `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏ウィンドウ中に steer モードのチャットメッセージをバッチ化し、到着順に 1 つの `turn/steer` リクエストとして送信します。

Codex レビューと手動 Compaction ターンは、同一ターンのステアリングを拒否することがあります。その
場合、OpenClaw はアクティブな実行が終了してからプロンプトを開始します。
メッセージをステアリングではなくデフォルトでキューに入れる必要がある場合は、
`/queue followup` または `/queue collect` を使用します。
[ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

## Codex フィードバックアップロード

ネイティブ Codex ハーネスを使用しているセッションで `/diagnostics [note]` が承認されると、
OpenClaw は関連する Codex スレッドに対して Codex app-server の `feedback/upload` も呼び出します。
このアップロードは、一覧に含まれる各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に要求します。

アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex
フィードバックが無効になっている場合、コマンドは app-server
エラーを返します。完了した診断返信には、送信されたスレッドのチャンネル、OpenClaw セッション ID、
Codex スレッド ID、およびローカルの `codex resume <thread-id>` コマンドが一覧表示されます。

承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示せず、
Codex フィードバックも送信しません。このアップロードはローカル Gateway
診断エクスポートを置き換えるものではありません。承認、プライバシー、ローカルバンドル、グループチャットの動作については
[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

現在接続されているスレッドについて、完全な Gateway
診断バンドルなしで Codex フィードバックアップロードだけを明示的に行いたい場合にのみ、
`/codex diagnostics [note]` を使用します。

## Compaction とトランスクリプトミラー

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は
Codex app-server が所有します。OpenClaw は Codex ターンに対して事前 Compaction を実行せず、
Codex Compaction をコンテキストエンジンの Compaction で置き換えず、ネイティブ Codex
Compaction を開始できない場合に OpenClaw または公開 OpenAI 要約へフォールバックしません。
OpenClaw は、チャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために、
トランスクリプトミラーを保持します。

`/compact` や Plugin が要求した手動 compact 操作などの明示的な Compaction リクエストは、
`thread/compact/start` でネイティブ Codex Compaction を開始します。
OpenClaw は、Codex が一致する `contextCompaction` 完了項目を発行するまで、リクエストと共有クライアントリースを開いたままにし、
その後 Compaction ターンを完了として報告します。その終端ターンが設定された Compaction タイムアウトを超えた場合、
OpenClaw はネイティブターンの割り込みを要求します。リースとスレッド単位の Compaction
フェンスは、Codex が終端状態を報告するか、割り込み RPC を確認するまで保持されます。
Codex が割り込み猶予期間内に確認しない場合、OpenClaw はフェンスを解放する前に接続を廃止します。
リモート接続では、一致するスレッドバインディングも切り離されるため、後続の作業が未確認のリモートターンと重なることはありません。
廃止された接続上の他のターンは失敗し、新しいクライアントで再試行できます。
クライアントのクローズ、リクエストのキャンセル、または失敗した Compaction ターンは、失敗した操作を返します。

コンテキストエンジンが Codex スレッドブートストラップ投影を要求すると、OpenClaw は
ツール呼び出し名と ID、入力形状、および編集済みのツール結果内容を新しい Codex スレッドへ投影します。
その投影に生のツール呼び出し引数値はコピーしません。

ミラーには、ユーザープロンプト、最終アシスタントテキスト、および app-server が発行した場合の軽量な Codex
推論または計画レコードが含まれます。OpenClaw はネイティブ Compaction の開始と終端ステータスを記録しますが、
人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能な一覧は公開しません。

Codex が正準のネイティブスレッドを所有するため、`tool_result_persist` は現在、
Codex ネイティブのツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッション
トランスクリプトツール結果を書き込む場合にのみ適用されます。

## メディアと配信

OpenClaw は引き続きメディア配信とメディアプロバイダー選択を所有します。画像、
動画、音楽、PDF、TTS、メディア理解では、`agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel`、`messages.tts` など、一致するプロバイダー/モデル設定を使用します。

テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、引き続き通常の OpenClaw
配信経路を通ります。メディア生成にレガシーランタイムは必要ありません。
Codex が `savedPath` を持つネイティブ画像生成項目を発行した場合、OpenClaw は
Codex ターンにアシスタントテキストがない場合でも、その正確なファイルを通常の返信メディア経路で転送します。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Plugin フック](/ja-JP/plugins/hooks)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [軌跡エクスポート](/ja-JP/tools/trajectory)
