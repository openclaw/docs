---
read_when:
    - Codex ハーネスのランタイムサポート契約が必要です
    - ネイティブの Codex ツール、フック、Compaction、またはフィードバックアップロードをデバッグしている
    - OpenClaw と Codex ハーネスのターン全体にわたって Plugin の動作を変更しています
summary: Codex ハーネスのランタイム境界、フック、ツール、権限、診断
title: Codex ハーネスランタイム
x-i18n:
    generated_at: "2026-06-27T12:12:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

このページでは、Codex ハーネスのターンに対するランタイム契約を説明します。セットアップと
ルーティングについては、[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## 概要

Codex モードは、下層のモデル呼び出しを別のものにした OpenClaw ではありません。Codex は
ネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin、ツール、セッション、
診断サーフェスを適応させます。

OpenClaw は引き続き、チャネルルーティング、セッションファイル、可視メッセージ配信、
OpenClaw 動的ツール、承認、メディア配信、トランスクリプトミラーを所有します。
Codex は、正規のネイティブスレッド、ネイティブモデルループ、ネイティブツールの
継続、ネイティブ Compaction を所有します。

プロンプトルーティングは、プロバイダー文字列だけでなく、選択されたランタイムに従います。
ネイティブ Codex ターンは Codex app-server の開発者指示を受け取り、一方で
明示的な OpenClaw 互換ルートでは、Codex 風の OpenAI 認証やトランスポートを使う場合でも
通常の OpenClaw システムプロンプトを維持します。

ネイティブ Codex は、有効な Codex スレッド設定に従って、Codex が所有するベース/モデル指示と
プロジェクトドキュメント動作を維持します。OpenClaw は、ワークスペースの
パーソナリティファイルと OpenClaw エージェントID が権威を保つように、Codex の組み込み
パーソナリティを無効にしてネイティブ Codex スレッドを開始および再開します。軽量な
OpenClaw 実行では、既存のプロジェクトドキュメント抑制も維持されます。OpenClaw の
開発者指示は、ソースチャネル配信、OpenClaw 動的ツール、ACP 委任、
アダプターコンテキスト、有効なエージェントワークスペースプロファイルファイルなどの
OpenClaw ランタイム上の関心事を扱います。OpenClaw の Skills カタログとツール経由の
`MEMORY.md` ポインターは、ネイティブ Codex 向けのターンスコープの共同作業用
開発者指示として投影されます。有効な `BOOTSTRAP.md` 内容と完全な
`MEMORY.md` フォールバック注入は、引き続きターン入力の参照コンテキストを使用します。

## スレッドバインディングとモデル変更

OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンでは
現在選択されている OpenAI モデル、承認ポリシー、サンドボックス、サービスタイアを
app-server に再度送信します。`openai/gpt-5.5` から
`openai/gpt-5.2` に切り替えてもスレッドバインディングは維持されますが、
新しく選択されたモデルで続行するよう Codex に要求します。

## 可視返信と Heartbeat

直接/ソースチャットターンが Codex ハーネス経由で実行される場合、可視返信は
内部 WebChat サーフェス向けに、デフォルトで最終アシスタント応答の自動配信になります。
これにより Codex は Pi ハーネスのプロンプト契約と揃います。エージェントは通常どおり返信し、
OpenClaw は最終テキストをソース会話に投稿します。直接/ソースチャットで、
エージェントが `message(action="send")` を呼び出さない限り最終アシスタントテキストを
意図的に非公開にしておく必要がある場合は、`messages.visibleReplies: "message_tool"` を設定してください。

Codex Heartbeat ターンでは、デフォルトで検索可能な OpenClaw ツールカタログにも
`heartbeat_respond` が含まれるため、エージェントはその起床を静かに保つべきか、
通知すべきかを、最終テキストにその制御フローをエンコードせずに記録できます。

Heartbeat 固有の主体的行動ガイダンスは、Heartbeat ターン自体で Codex 共同作業モードの
開発者指示として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに
Heartbeat の思想を持ち越すのではなく、Codex Default モードに戻します。空でない
`HEARTBEAT.md` が存在する場合、Heartbeat 共同作業モードの指示は、その内容を
インライン化する代わりに Codex にそのファイルを示します。

## フック境界

Codex ハーネスには3つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | OpenClaw と Codex ハーネス間の製品/Plugin 互換性。                  |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定に基づく低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin 動作のルーティングに、プロジェクトまたはグローバルの
Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 向けに
スレッドごとの Codex 設定を注入します。

Codex app-server 承認が有効な場合、つまり `approvalPolicy` が
`"never"` ではない場合、デフォルトで注入されるネイティブフック設定では
`PermissionRequest` を省略し、Codex の app-server レビュアーと OpenClaw の承認ブリッジが
レビュー後の実際のエスカレーションを処理します。互換リレーが必要な場合、オペレーターは
`nativeHookRelay.events` に `permission_request` を明示的に追加できます。

`SessionStart` や `UserPromptSubmit` などの他の Codex フックは、Codex レベルの
制御のままです。これらは v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェアの動作を発火します。
Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。OpenClaw は
選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを
通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Codex app-server のレポートモード `PreToolUse` イベントは、Plugin 承認要求を
対応する app-server 承認に委ねます。OpenClaw の `before_tool_call` フックが
`requireApproval` を返し、同時にネイティブペイロードがレポート承認モードを設定している場合
（`openclaw_approval_mode` が `"report"`）、ネイティブフックリレーは
Plugin 承認要件を記録し、ネイティブ決定を返しません。Codex が同じツール使用に対して
app-server 承認要求を送信すると、OpenClaw は Plugin 承認プロンプトを開き、
その決定を Codex にマップします。Codex `PermissionRequest` イベントは別の承認経路であり、
そのブリッジ向けにランタイムが設定されている場合は、引き続き OpenClaw 承認を経由できます。

Codex app-server のアイテム通知は、ネイティブ `PostToolUse` リレーですでにカバーされていない
ネイティブツール完了に対して、非同期の `after_tool_call` 観測も提供します。
これらの観測はテレメトリと Plugin 互換性のためだけのものであり、ネイティブツール呼び出しを
ブロック、遅延、変更することはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、
Codex app-server 通知と OpenClaw アダプター状態から得られます。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントは
アダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードを
バイト単位でそのままキャプチャしたものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                  | サポート                                                                         | 理由                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポートあり                                                                     | Codex アプリサーバーが OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有する。                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw チャネルルーティングと配信           | サポートあり                                                                     | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まる。                                                                                                                                                                                                                                                                                                                                                                                        |
| OpenClaw 動的ツール                           | サポートあり                                                                     | Codex は OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行パス内に留まる。                                                                                                                                                                                                                                                                                                                                                                                                |
| プロンプトとコンテキスト Plugin               | サポートあり                                                                     | OpenClaw は OpenClaw 固有のプロンプト/コンテキストを Codex ターンへ投影しつつ、Codex が所有するベース、モデル、設定済みプロジェクトドキュメントのプロンプトはネイティブ Codex レーンに残す。OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効化し、エージェントワークスペースのパーソナリティファイルが権威を持ち続けるようにする。ネイティブ Codex 開発者指示は、`codex_app_server` に明示的にスコープされたコマンドガイダンスのみを受け付ける。レガシーのグローバルコマンドヒントは、非 Codex プロンプトサーフェス用に残る。 |
| コンテキストエンジンのライフサイクル          | サポートあり                                                                     | Codex ターンの周囲で、組み立て、取り込み、ターン後メンテナンスが実行される。コンテキストエンジンはネイティブ Codex Compaction を置き換えない。                                                                                                                                                                                                                                                                                                                                            |
| 動的ツールフック                              | サポートあり                                                                     | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周囲で実行される。                                                                                                                                                                                                                                                                                                                                                                      |
| ライフサイクルフック                          | アダプター観測としてサポートあり                                                 | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火する。                                                                                                                                                                                                                                                                                                                                                           |
| 最終回答の修正ゲート                          | ネイティブフックリレー経由でサポートあり                                         | Codex `Stop` は `before_agent_finalize` にリレーされる。`revise` は、確定前にもう 1 回モデルパスを実行するよう Codex に依頼する。                                                                                                                                                                                                                                                                                                                                                        |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポートあり                                         | Codex `PreToolUse` と `PostToolUse` は、Codex アプリサーバー `0.125.0` 以降の MCP ペイロードを含む、確定したネイティブツールサーフェスにリレーされる。ブロックはサポートされるが、引数の書き換えはサポートされない。                                                                                                                                                                                                                                                                               |
| ネイティブ権限ポリシー                        | Codex アプリサーバー承認と互換性ネイティブフックリレー経由でサポートあり         | Codex アプリサーバーの承認リクエストは、Codex レビュー後に OpenClaw を経由してルーティングされる。`PermissionRequest` ネイティブフックリレーは、Codex がガーディアンレビュー前にそれを発行するため、ネイティブ承認モードではオプトインである。                                                                                                                                                                                                                                            |
| アプリサーバー軌跡キャプチャ                  | サポートあり                                                                     | OpenClaw は、アプリサーバーに送信したリクエストと、受信したアプリサーバー通知を記録する。                                                                                                                                                                                                                                                                                                                                                                                              |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                          | V1 境界                                                                                                                                        | 将来のパス                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                          | Codex ネイティブ事前ツールフックはブロックできるが、OpenClaw は Codex ネイティブツール引数を書き換えない。                                    | 置換ツール入力に対する Codex フック/スキーマサポートが必要。                              |
| 編集可能な Codex ネイティブトランスクリプト履歴     | Codex が正規のネイティブスレッド履歴を所有する。OpenClaw はミラーを所有し、将来のコンテキストを投影できるが、サポートされない内部を変更すべきではない。 | ネイティブスレッド操作が必要な場合は、明示的な Codex アプリサーバー API を追加する。      |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではない。            | 変換済みレコードをミラーできる可能性はあるが、正規の書き換えには Codex サポートが必要。   |
| リッチなネイティブ Compaction メタデータ            | OpenClaw はネイティブ Compaction をリクエストできるが、安定した保持/破棄リスト、トークン差分、完了サマリー、サマリーペイロードは受け取らない。 | よりリッチな Codex Compaction イベントが必要。                                            |
| Compaction 介入                                     | OpenClaw は、Plugin やコンテキストエンジンにネイティブ Codex Compaction の拒否、書き換え、置換を許可しない。                                  | Plugin がネイティブ Compaction の拒否または書き換えを必要とする場合は、Codex の事前/事後 Compaction フックを追加する。 |
| バイト単位で一致するモデル API リクエストキャプチャ | OpenClaw はアプリサーバーのリクエストと通知をキャプチャできるが、Codex コアは最終的な OpenAI API リクエストを内部で構築する。                  | Codex モデルリクエストトレースイベントまたはデバッグ API が必要。                        |

## ネイティブ権限と MCP 引き出し

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、
明示的な許可または拒否の決定を返す。決定なしの結果は許可ではない。Codex は
それをフック決定なしとして扱い、独自のガーディアンまたはユーザー承認パスに
フォールスルーする。

Codex アプリサーバー承認モードでは、デフォルトでこのネイティブフックを省略する。この動作は、
`permission_request` が `nativeHookRelay.events` に明示的に含まれる場合、または
互換性ランタイムがそれをインストールする場合に適用される。

オペレーターが Codex ネイティブ権限リクエストに対して `allow-always` を選択すると、
OpenClaw はその正確なプロバイダー/セッション/ツール入力/cwd フィンガープリントを、
制限付きセッションウィンドウの間記憶する。記憶された決定は意図的に完全一致のみである:
コマンド、引数、ツールペイロード、または cwd が変わると、新しい承認が作成される。

Codex MCP ツール承認の引き出しは、Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フロー経由で
ルーティングされる。Codex `request_user_input` プロンプトは元のチャットに送り返され、
次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、
そのネイティブサーバーリクエストへの回答になる。その他の MCP 引き出しリクエストは
フェイルクローズする。

これらのプロンプトを運ぶ一般的な Plugin 承認フローについては、
[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests) を参照。

## キューステアリング

アクティブ実行キューステアリングは、Codex アプリサーバー `turn/steer` に対応付けられる。
デフォルトの `messages.queue.mode: "steer"` では、OpenClaw はステアモードのチャット
メッセージを設定済みの静穏ウィンドウでバッチ化し、到着順に 1 つの `turn/steer`
リクエストとして送信する。

Codex レビューと手動 Compaction ターンは、同一ターンのステアリングを拒否することがあります。その
場合、OpenClaw はアクティブな実行が完了するのを待ってからプロンプトを開始します。
ステアリングではなく、デフォルトでメッセージをキューに入れる必要がある場合は、`/queue followup` または `/queue collect` を使用します。
[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

## Codex フィードバックアップロード

ネイティブ Codex
ハーネスを使用するセッションで `/diagnostics [note]` が承認されると、OpenClaw は関連する
Codex スレッドに対して Codex app-server `feedback/upload` も呼び出します。このアップロードは、一覧に含まれる各スレッド
および生成された Codex サブスレッドが利用可能な場合、それらのログを含めるよう app-server に要求します。

アップロードは、Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex
フィードバックが無効になっている場合、コマンドは app-server
エラーを返します。完了した診断返信には、送信されたスレッドについて、チャンネル、OpenClaw セッション ID、
Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。

承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示せず、
Codex フィードバックも送信しません。このアップロードは、ローカル Gateway
診断エクスポートを置き換えるものではありません。承認、プライバシー、ローカルバンドル、グループチャットでの動作については、
[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway
診断バンドルなしで、現在アタッチされているスレッドの Codex
フィードバックアップロードだけを明示的に行いたい場合にのみ、`/codex diagnostics [note]` を使用します。

## Compaction とトランスクリプトミラー

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は
Codex app-server が担います。OpenClaw は Codex ターンに対してプリフライト Compaction を実行せず、
Codex Compaction を context-engine Compaction に置き換えず、ネイティブ Codex
Compaction を開始できない場合にも OpenClaw または公開 OpenAI 要約へフォールバックしません。OpenClaw は、チャンネル履歴、
検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために、トランスクリプトミラーを保持します。

`/compact` や Plugin が要求した手動
compact 操作などの明示的な Compaction 要求は、`thread/compact/start` によってネイティブ Codex Compaction を開始します。
OpenClaw はそのネイティブ操作を開始した後に戻ります。完了を待たず、
別個の OpenClaw タイムアウトを課さず、共有 Codex
app-server を再起動せず、その操作を OpenClaw が完了した Compaction として記録しません。

コンテキストエンジンが Codex スレッドブートストラップ投影を要求すると、OpenClaw は
ツール呼び出し名と ID、入力形状、編集済みのツール結果内容を新しい Codex スレッドへ投影します。
生のツール呼び出し引数値をその投影へコピーすることはありません。

ミラーには、ユーザープロンプト、最終的なアシスタントテキスト、app-server が発行する場合は軽量な Codex
推論または計画レコードが含まれます。現在、OpenClaw は Compaction を要求したときにのみ、
明示的なネイティブ Compaction 開始シグナルを記録します。人間が読める Compaction 要約や、
Compaction 後に Codex が保持したエントリの監査可能な一覧は公開しません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在、
Codex ネイティブのツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッショントランスクリプト
ツール結果を書き込む場合にのみ適用されます。

## メディアと配信

OpenClaw は引き続き、メディア配信とメディアプロバイダー選択を所有します。画像、
動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、
`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル設定を使用します。

テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信経路を引き続き通ります。メディア生成にレガシーランタイムは必要ありません。
Codex が `savedPath` を含むネイティブ画像生成項目を発行すると、Codex
ターンにアシスタントテキストがない場合でも、OpenClaw はその正確なファイルを通常の返信メディア経路で転送します。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Plugin フック](/ja-JP/plugins/hooks)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [軌跡エクスポート](/ja-JP/tools/trajectory)
