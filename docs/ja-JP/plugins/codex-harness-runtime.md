---
read_when:
    - Codex ハーネスのランタイムサポートコントラクトが必要です
    - ネイティブ Codex ツール、フック、Compaction、またはフィードバックアップロードをデバッグしている
    - PI と Codex ハーネスのターン全体でプラグインの動作を変更している
summary: Codex ハーネスのランタイム境界、フック、ツール、権限、診断
title: Codex ハーネスランタイム
x-i18n:
    generated_at: "2026-05-10T19:42:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

このページでは、Codex ハーネスのターンにおけるランタイム契約を説明します。セットアップと
ルーティングについては、[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## 概要

Codex モードは、内部のモデル呼び出しだけを変えた PI ではありません。Codex は
ネイティブモデルループのより多くの部分を所有し、OpenClaw はその境界に合わせて Plugin、ツール、セッション、
診断の各サーフェスを適応させます。

OpenClaw は引き続き、チャネルルーティング、セッションファイル、可視メッセージ配信、
OpenClaw 動的ツール、承認、メディア配信、トランスクリプトミラーを所有します。
Codex は、正規のネイティブスレッド、ネイティブモデルループ、ネイティブツール継続、
ネイティブ Compaction を所有します。

## スレッドバインディングとモデル変更

OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンでは、
現在選択されている OpenAI モデル、承認ポリシー、サンドボックス、サービス階層が
再び app-server に送信されます。`openai/gpt-5.5` から
`openai/gpt-5.2` に切り替えると、スレッドバインディングは維持されますが、
新しく選択されたモデルで継続するよう Codex に要求します。

## 可視返信と Heartbeat

ソースチャットのターンが Codex ハーネスを通過する場合、デプロイメントで
`messages.visibleReplies` が明示的に設定されていなければ、可視返信はデフォルトで
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開のまま完了できます。
チャネルへ投稿されるのは、`message(action="send")` を呼び出した場合だけです。
直接チャットの最終返信を従来の自動配信パスに維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンには、検索可能な OpenClaw ツールカタログ内で
デフォルトで `heartbeat_respond` も提供されるため、エージェントはウェイクを静かに保つか
通知するかを、最終テキストにその制御フローをエンコードせずに記録できます。

Heartbeat 固有の自律的なガイダンスは、その Heartbeat ターン自体で
Codex コラボレーションモードの開発者指示として送信されます。通常のチャットターンでは、
通常のランタイムプロンプトに Heartbeat の思想を持ち越すのではなく、
Codex Default モードに戻ります。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネスをまたぐ製品/Plugin 互換性。                    |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターン単位のアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定による低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするためにプロジェクトまたはグローバルの
Codex `hooks.json` ファイルを使用しません。サポート対象のネイティブツールと権限ブリッジについては、
OpenClaw が `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用の
スレッド単位の Codex 設定を注入します。

Codex app-server 承認が有効な場合、つまり `approvalPolicy` が
`"never"` ではない場合、デフォルトで注入されるネイティブフック設定では
`PermissionRequest` が省略されるため、Codex の app-server レビュアーと OpenClaw の承認ブリッジが
レビュー後の実際のエスカレーションを処理します。互換性リレーが必要な場合、オペレーターは
`nativeHookRelay.events` に `permission_request` を明示的に追加できます。

`SessionStart` や `UserPromptSubmit` などの他の Codex フックは、
Codex レベルの制御として残ります。これらは v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェアの動作を発火します。
Codex ネイティブツールについては、Codex が正規のツールレコードを所有します。
OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックの
コールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、
Codex app-server 通知と OpenClaw アダプター状態から得られます。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、
`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや
Compaction ペイロードをバイト単位で捕捉したものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex ランタイム v1 でサポート対象:

| サーフェス                                    | サポート                                                                         | 理由                                                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート対象                                                                     | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                               |
| OpenClaw チャネルルーティングと配信           | サポート対象                                                                     | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                       |
| OpenClaw 動的ツール                           | サポート対象                                                                     | Codex が OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行パス内に留まります。                                                                                                                |
| プロンプトとコンテキストの Plugin             | サポート対象                                                                     | OpenClaw はプロンプトオーバーレイを構築し、スレッドの開始または再開前にコンテキストを Codex ターンへ投影します。                                                                                           |
| コンテキストエンジンのライフサイクル          | サポート対象                                                                     | 組み立て、取り込み、ターン後メンテナンス、コンテキストエンジンの Compaction 調整が Codex ターンに対して実行されます。                                                                                      |
| 動的ツールフック                              | サポート対象                                                                     | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアが、OpenClaw 所有の動的ツールの周辺で実行されます。                                                                                            |
| ライフサイクルフック                          | アダプター観測としてサポート対象                                                 | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードのペイロードで発火します。                                                                           |
| 最終回答の修正ゲート                          | ネイティブフックリレー経由でサポート対象                                         | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は、最終化前にもう 1 回モデルパスを行うよう Codex に要求します。                                                                          |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート対象                                         | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みのネイティブツールサーフェスに対してリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | Codex app-server 承認と互換性ネイティブフックリレー経由でサポート対象            | Codex app-server の承認リクエストは、Codex レビュー後に OpenClaw を通じてルーティングされます。`PermissionRequest` ネイティブフックリレーは、Codex がガーディアンレビュー前にそれを発行するため、ネイティブ承認モードではオプトインです。 |
| App-server 軌跡キャプチャ                     | サポート対象                                                                     | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                       |

Codex ランタイム v1 でサポート対象外:

| サーフェス                                          | V1 境界                                                                                                                                          | 今後の道筋                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| ネイティブツール引数の変更                          | Codex ネイティブのツール前フックはブロックできますが、OpenClaw は Codex ネイティブツールの引数を書き換えません。                               | 置換ツール入力に対する Codex フック/スキーマサポートが必要です。                           |
| 編集可能な Codex ネイティブのトランスクリプト履歴   | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部を変更すべきではありません。 | ネイティブスレッド手術が必要な場合は、明示的な Codex app-server API を追加します。         |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw 所有のトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではありません。          | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。 |
| 豊富なネイティブ Compaction メタデータ              | OpenClaw は Compaction の開始と完了を観測しますが、安定した保持/破棄リスト、トークン差分、要約ペイロードは受け取りません。                    | より豊富な Codex Compaction イベントが必要です。                                           |
| Compaction 介入                                     | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                           | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位のモデル API リクエストキャプチャ         | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex コアが最終的な OpenAI API リクエストを内部で構築します。                 | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                        |

## ネイティブ権限と MCP 要求

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の判断を返します。
判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、
自身のガーディアンまたはユーザー承認パスへフォールスルーします。

Codex app-server 承認モードでは、このネイティブフックはデフォルトで省略されます。この動作は、
`permission_request` が `nativeHookRelay.events` に明示的に含まれている場合、
または互換性ランタイムがそれをインストールしている場合に適用されます。

オペレーターが Codex ネイティブ権限リクエストで `allow-always` を選択すると、
OpenClaw はその正確なプロバイダー/セッション/ツール入力/cwd フィンガープリントを、
制限付きセッションウィンドウの間記憶します。記憶された判断は意図的に完全一致の
みに限定されています。コマンド、引数、ツールペイロード、または cwd が変わると、
新しい承認が作成されます。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じて
ルーティングされます。Codex `request_user_input` プロンプトは発信元のチャットに
送り返され、次にキューされたフォローアップメッセージは追加コンテキストとして
誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。
その他の MCP elicitation リクエストはフェイルクローズします。

## キュー誘導

アクティブ実行のキュー誘導は、Codex app-server `turn/steer` に対応します。
デフォルトの `messages.queue.mode: "steer"` では、OpenClaw はキューされた
チャットメッセージを設定済みの静穏ウィンドウの間バッチ化し、到着順に 1 つの
`turn/steer` リクエストとして送信します。レガシーの `queue` モードでは、
個別の `turn/steer` リクエストを送信します。

Codex のレビューおよび手動 Compaction ターンは、同一ターンの誘導を拒否する
場合があります。その場合、選択されたモードがフォールバックを許可していれば、
OpenClaw はフォローアップキューを使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

## Codex フィードバックアップロード

ネイティブ Codex ハーネスを使用しているセッションで `/diagnostics [note]` が
承認されると、OpenClaw は関連する Codex スレッドに対して Codex app-server
`feedback/upload` も呼び出します。このアップロードは、一覧に含まれる各スレッドと、
利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に
要求します。

アップロードは、Codex の通常のフィードバックパスを通じて OpenAI サーバーへ
送信されます。その app-server で Codex フィードバックが無効化されている場合、
このコマンドは app-server エラーを返します。完了した診断の返信には、送信された
スレッドについて、チャンネル、OpenClaw セッション ID、Codex スレッド ID、および
ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。

承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力せず、
Codex フィードバックも送信しません。このアップロードはローカルの Gateway
診断エクスポートを置き換えるものではありません。承認、プライバシー、
ローカルバンドル、およびグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドに対する
Codex フィードバックアップロードだけを明示的に必要とする場合にのみ、
`/codex diagnostics [note]` を使用してください。

## Compaction とトランスクリプトミラー

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの
Compaction は Codex app-server に委任されます。OpenClaw はチャンネル履歴、
検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために、
トランスクリプトミラーを保持します。

このミラーには、ユーザープロンプト、最終的なアシスタントのテキスト、および
app-server が出力する場合は軽量な Codex 推論または計画レコードが含まれます。
現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルのみを
記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持した
エントリの監査可能な一覧は、まだ公開していません。

Codex が正規のネイティブスレッドを所有しているため、`tool_result_persist` は
現在 Codex ネイティブのツール結果レコードを書き換えません。これは OpenClaw が
OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用されます。

## メディアと配信

OpenClaw は引き続きメディア配信とメディアプロバイダー選択を所有します。画像、
動画、音楽、PDF、TTS、およびメディア理解は、`agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル
設定を使用します。

テキスト、画像、動画、音楽、TTS、承認、およびメッセージングツール出力は、
通常の OpenClaw 配信パスを通じて継続されます。メディア生成には PI は不要です。
Codex が `savedPath` を含むネイティブ画像生成アイテムを出力した場合、OpenClaw は
Codex ターンにアシスタントテキストがなくても、その正確なファイルを通常の
返信メディアパスを通じて転送します。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins)
- [Plugin フック](/ja-JP/plugins/hooks)
- [エージェントハーネス plugins](/ja-JP/plugins/sdk-agent-harness)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [トラジェクトリエクスポート](/ja-JP/tools/trajectory)
