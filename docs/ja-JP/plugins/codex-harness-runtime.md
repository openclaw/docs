---
read_when:
    - Codex ハーネスのランタイムサポート契約が必要です
    - ネイティブ Codex ツール、フック、Compaction、またはフィードバックのアップロードをデバッグしている
    - OpenClaw と Codex ハーネスのターン全体で Plugin の動作を変更しています
summary: Codex ハーネスのランタイム境界、フック、ツール、権限、診断
title: Codex ハーネスランタイム
x-i18n:
    generated_at: "2026-07-05T11:35:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcf458cfae804655e4544682ff7c12643bccf298b868d918b7c115ae5d075eae
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex ハーネスターンのランタイム契約。セットアップとルーティングについては
[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。設定フィールドについては
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## 概要

Codex はネイティブモデルループ、ネイティブスレッド再開、ネイティブツール
継続、ネイティブ Compaction を所有します。OpenClaw はチャネルルーティング、セッション
ファイル、可視メッセージ配信、OpenClaw 動的ツール、承認、メディア
配信、およびその境界まわりのトランスクリプトミラーを所有します。

プロンプトのルーティングは、プロバイダー文字列だけでなく、選択されたランタイムに従います。
ネイティブ Codex ターンは Codex app-server 開発者指示を受け取り、明示的な
OpenClaw 互換ルートは、Codex 風の OpenAI 認証またはトランスポートを使う場合でも
通常の OpenClaw システムプロンプトを保持します。

OpenClaw は Codex の組み込み
パーソナリティを無効化（`personality: "none"`）してネイティブ Codex スレッドを開始および再開するため、ワークスペースのパーソナリティファイル
と OpenClaw エージェント ID が権威を保ちます。それ以外の場合、ネイティブ Codex は Codex 所有の
ベース/モデル指示とプロジェクトドキュメント読み込みを維持します。軽量な
OpenClaw 実行（たとえば cron）では、引き続きプロジェクトドキュメント読み込みを抑制します。

OpenClaw 開発者指示は、OpenClaw ランタイム上の関心事を対象にします: ソースチャネル
配信、OpenClaw 動的ツール、ACP 委譲、アダプターコンテキスト、および
アクティブなエージェントワークスペースプロファイルファイルです。Skills カタログとツール経由の
`MEMORY.md` ポインターは、ターンスコープのコラボレーション開発者
指示として投影されます。メモリツールが利用できない場合、アクティブな `BOOTSTRAP.md` 内容
と完全な `MEMORY.md` は、代わりにプレーンなターン入力コンテキストへフォールバックします。

## スレッドバインディングとモデル変更

OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次の
ターンでは、現在選択されているモデル、承認ポリシー、サンドボックス、
承認レビュアー、およびサービスティアを app-server に再送信します。
`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、スレッドバインディングは維持されますが、Codex には
新しく選択されたモデルで続行するよう求めます。

## 可視返信と Heartbeat

Codex ハーネス経由の直接/ソースチャットターンは、内部 WebChat サーフェスではデフォルトで自動的に最終
アシスタント配信を行い、Pi ハーネス
契約に一致します: エージェントは通常どおり返信し、OpenClaw は最終テキストを
ソース会話に投稿します。最終アシスタントテキストを、エージェントが `message(action="send")` を呼び出すまで非公開に保つには、`messages.visibleReplies: "message_tool"` を設定します。

Codex Heartbeat ターンでは、エージェントがウェイクを静かなままにするか
通知するかを記録できるように、デフォルトで検索可能な OpenClaw ツール
カタログに `heartbeat_respond` が含まれます。Heartbeat イニシアチブガイダンスは、Heartbeat ターンにスコープされた Codex コラボレーションモード
開発者指示として送信されます。通常のチャットターンは
Codex Default mode のままです。`HEARTBEAT.md` が空でない場合、Heartbeat
指示は内容をインライン化する代わりに Codex にそのファイルを指し示します。

## フック境界

| レイヤー                              | 所有者                    | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                 | OpenClaw                 | OpenClaw と Codex ハーネス間のプロダクト/Plugin 互換性。            |
| Codex app-server 拡張ミドルウェア | OpenClaw バンドル Plugin | OpenClaw 動的ツールまわりのターンごとのアダプター動作。             |
| Codex ネイティブフック                    | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、Plugin 動作をルーティングするためにプロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。ネイティブツールと権限ブリッジについて、OpenClaw は
`PreToolUse`、`PostToolUse`、`PermissionRequest`、
および `Stop` のスレッドごとの Codex 設定を注入します。

Codex app-server 承認が有効（`approvalPolicy` が
`"never"` ではない）な場合、デフォルトで注入されるネイティブフック設定は `PermissionRequest` を省略するため、Codex の app-server レビュアーと OpenClaw の承認ブリッジがレビュー後の実際の
エスカレーションを処理します。互換リレーを強制するには、
`nativeHookRelay.events` に `permission_request` を追加します。`SessionStart` や `UserPromptSubmit` などの他の Codex
フックは Codex レベルの
制御のままであり、v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が
呼び出しを要求した後に OpenClaw がツールを実行するため、Plugin とミドルウェアの動作はハーネスアダプター内で実行されます。Codex ネイティブツールについては、Codex が正規のツールレコードを所有します。OpenClaw は
選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバック経由でそれを公開しない限り、ネイティブスレッドを書き換えることはできません。

Codex app-server レポートモードの `PreToolUse` イベントは、Plugin 承認を
対応する app-server 承認に委ねます。OpenClaw の `before_tool_call` フックが
`requireApproval` を返し、同時にネイティブペイロードが `openclaw_approval_mode:
"report"` を設定している場合、ネイティブフックリレーは Plugin 承認要件を記録し、
ネイティブ判定を返しません。後で Codex が同じツール使用について app-server 承認
リクエストを送信すると、OpenClaw は Plugin 承認プロンプトを開き、
判定を Codex にマッピングします。Codex `PermissionRequest` イベントは
別の承認パスであり、そのブリッジ用に設定されている場合は引き続き OpenClaw 承認経由でルーティングできます。

Codex app-server 項目通知は、ネイティブ
`PostToolUse` リレーでまだカバーされていないネイティブツール完了について、非同期の `after_tool_call`
観測も提供します。これらはテレメトリ/互換性のみを目的とします。ネイティブツール呼び出しを
ブロック、遅延、または変更することはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、Codex app-server
通知と OpenClaw アダプター状態から取得されます。
`before_compaction`、`after_compaction`、`llm_input`、および `llm_output` は
アダプターレベルの観測であり、Codex の内部
リクエストまたは Compaction ペイロードのバイト単位のキャプチャではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして
投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex ランタイム v1 でサポートされるもの:

| Surface                                       | Support                                                                          | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ               | サポートされています                                                                        | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw チャネルルーティングと配信         | サポートされています                                                                        | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw 動的ツール                        | サポートされています                                                                        | Codex はこれらのツールの実行を OpenClaw に依頼するため、OpenClaw は実行パス内に留まります。                                                                                                                                                                                                                                                                                                                                                                                                |
| プロンプトとコンテキスト Plugin                    | サポートされています                                                                        | OpenClaw は OpenClaw 固有のプロンプト/コンテキストを Codex ターンに投影しつつ、Codex が所有するベース、モデル、構成済みプロジェクトドキュメントのプロンプトはネイティブ Codex レーンに残します。OpenClaw はネイティブスレッドでは Codex の組み込みパーソナリティを無効化し、エージェントワークスペースのパーソナリティファイルを権威あるものとして保ちます。ネイティブ Codex 開発者指示は、`codex_app_server` に明示的にスコープされたコマンドガイダンスのみを受け入れます。レガシーのグローバルコマンドヒントは、Codex 以外のプロンプトサーフェス向けに残ります。 |
| コンテキストエンジンのライフサイクル                      | サポートされています                                                                        | 組み立て、取り込み、ターン後メンテナンスは Codex ターンの前後で実行されます。コンテキストエンジンはネイティブ Codex Compaction を置き換えません。                                                                                                                                                                                                                                                                                                                                                        |
| 動的ツールフック                            | サポートされています                                                                        | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは OpenClaw 所有の動的ツールの前後で実行されます。                                                                                                                                                                                                                                                                                                                                                                          |
| ライフサイクルフック                               | アダプター観測としてサポートされています                                                | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は正確な Codex モードペイロードで発火します。                                                                                                                                                                                                                                                                                                                                                           |
| 最終回答の改訂ゲート                    | ネイティブフックリレー経由でサポートされています                                              | Codex `Stop` は `before_agent_finalize` に中継されます。`revise` は最終化の前にもう 1 回モデルパスを実行するよう Codex に依頼します。                                                                                                                                                                                                                                                                                                                                                                |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポートされています                                              | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降での MCP ペイロードを含め、コミット済みのネイティブツールサーフェスについて中継されます。ブロックはサポートされていますが、引数の書き換えはサポートされていません。                                                                                                                                                                                                                                                                               |
| ネイティブ権限ポリシー                      | Codex app-server 承認と互換性ネイティブフックリレー経由でサポートされています | Codex app-server 承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされます。`PermissionRequest` ネイティブフックリレーは、Codex がガーディアンレビュー前にそれを発行するため、ネイティブ承認モードではオプトインです。                                                                                                                                                                                                                                                                          |
| App-server 軌跡キャプチャ                 | サポートされています                                                                        | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                                                                                                                                                                                                                                                                                    |

Codex ランタイム v1 でサポートされていないもの:

| Surface                                             | V1 boundary                                                                                                                                     | Future path                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブ事前ツールフックはブロックできますが、OpenClaw は Codex ネイティブツール引数を書き換えません。                                               | 置換ツール入力に対する Codex フック/スキーマサポートが必要です。                            |
| 編集可能な Codex ネイティブトランスクリプト履歴            | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部構造を変更すべきではありません。 | ネイティブスレッド手術が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw 所有のトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではありません。                                                           | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw はネイティブ Compaction をリクエストできますが、安定した保持/削除リスト、トークン差分、完了サマリー、サマリーペイロードは受け取りません。   | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction 介入                             | OpenClaw は、Plugin やコンテキストエンジンがネイティブ Codex Compaction を拒否、書き換え、置換することを許可しません。                                             | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex 事前/事後 Compaction フックを追加します。 |
| バイト単位で一致するモデル API リクエストキャプチャ             | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex core は最終的な OpenAI API リクエストを内部で構築します。                      | Codex モデルリクエストトレースイベントまたはデバッグ API が必要です。                                   |

## ネイティブ権限と MCP elicitation

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の
判断を返します。判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、
自身のガーディアンまたはユーザー承認パスにフォールスルーします。

Codex app-server 承認モードでは、デフォルトでこのネイティブフックは省略されます。これは、
`permission_request` が `nativeHookRelay.events` に明示的に含まれている場合、または互換性ランタイムが
それをインストールする場合を除き適用されます。

オペレーターが Codex ネイティブ権限リクエストに対して `allow-always` を選択すると、OpenClaw はその正確な
プロバイダー/セッション/ツール入力/cwd フィンガープリントを、境界付きセッションウィンドウ内で記憶します。
記憶された判断は意図的に完全一致のみです。コマンド、引数、ツールペイロード、または
cwd が変わると、新しい承認が作成されます。

Codex MCP ツール承認 elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、
OpenClaw の Plugin 承認フロー経由でルーティングされます。Codex
`request_user_input` プロンプトは元のチャットに送り返され、次にキューに入ったフォローアップメッセージは、
追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。
その他の MCP elicitation リクエストは fail closed します。

これらのプロンプトを運ぶ一般的な Plugin 承認フローについては、
[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests) を参照してください。

## キュー誘導

アクティブ実行キュー誘導は Codex app-server `turn/steer` に対応付けられます。
デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は構成済みの静穏ウィンドウ中に steer モードのチャット
メッセージをバッチ処理し、到着順に 1 つの `turn/steer`
リクエストとして送信します。

Codex レビューと手動 Compaction ターンは、同一ターンのステアリングを拒否することがあります。その
場合、OpenClaw はアクティブな実行が終了するのを待ってから
プロンプトを開始します。デフォルトでメッセージをステアリングではなくキューに入れる必要がある場合は、
`/queue followup` または `/queue collect` を使用します。[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

## Codex フィードバックアップロード

ネイティブ Codex ハーネス上のセッションで `/diagnostics [note]` が承認されると、
OpenClaw は関連する Codex スレッドに対して Codex app-server `feedback/upload` も呼び出します。
これには、一覧に含まれる各スレッドのログと、利用可能な場合は生成された Codex
サブスレッドが含まれます。

アップロードは、Codex の通常のフィードバック経路を通じて OpenAI サーバーに送信されます。その
app-server で Codex フィードバックが無効になっている場合、コマンドは
app-server エラーを返します。完了した診断応答には、送信されたスレッドの
チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>`
コマンドが一覧表示されます。

承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力せず、
Codex フィードバックも送信しません。このアップロードは、ローカルの
Gateway 診断エクスポートを置き換えるものではありません。承認、プライバシー、ローカルバンドル、
グループチャットの挙動については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex フィードバックアップロードだけが必要な場合にのみ、
`/codex diagnostics [note]` を使用します。

## Compaction とトランスクリプトミラー

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は
Codex app-server に属します。OpenClaw は Codex ターンに対してプリフライト Compaction を実行せず、
Codex Compaction をコンテキストエンジン Compaction に置き換えず、ネイティブ Compaction を開始できない場合に
OpenClaw または公開 OpenAI 要約へフォールバックしません。OpenClaw はチャンネル履歴、検索、
`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。

`/compact` や Plugin が要求した手動
compact 操作などの明示的な Compaction 要求は、`thread/compact/start` でネイティブ Codex Compaction を開始します。
OpenClaw は、Codex が対応する `contextCompaction` 完了アイテムを発行するまで
要求と共有クライアントリースを開いたままにし、その後 Compaction
ターンを完了として報告します。その終端ターンが設定された Compaction
タイムアウトを超えた場合、OpenClaw はネイティブターンの割り込みを要求します。リースとスレッドごとの
Compaction フェンスは、Codex が終端状態を報告するか
割り込み RPC を確認するまで保持されます。Codex が割り込み猶予期間内に確認しない場合、
OpenClaw はフェンスを解放する前に接続を廃止します。リモート接続では、
対応するスレッドバインディングも切り離すため、後続の作業が未確認のリモートターンと
重なることはありません。廃止された接続上の他のターンは失敗し、新しいクライアントで再試行できます。
クライアントの終了、要求のキャンセル、または失敗した Compaction ターンは、失敗した操作を返します。
自動的なコンテキスト圧迫 Compaction は Codex の役割です。OpenClaw は手動で要求されたトリガーに対してのみ
ネイティブ Compaction を開始します。

コンテキストエンジンが Codex スレッドブートストラップ投影を要求すると、OpenClaw は
ツール呼び出しの名前と ID、入力形状、マスク済みのツール結果
コンテンツを新しい Codex スレッドに投影します。その投影に生のツール呼び出し引数値は
コピーしません。

ミラーには、app-server が発行した場合、ユーザープロンプト、最終的なアシスタントテキスト、
軽量な Codex 推論または計画レコードが含まれます。OpenClaw は
ネイティブ Compaction の開始と終端ステータスを記録しますが、人間が読める
Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能な一覧は
公開しません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は
Codex ネイティブのツール結果レコードを書き換えません。これは OpenClaw が
OpenClaw 所有のセッショントランスクリプトのツール結果を書き込む場合にのみ適用されます。

## メディアと配信

OpenClaw は引き続きメディア配信とメディアプロバイダー選択を所有します。画像、
動画、音楽、PDF、TTS、メディア理解では、`agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル
設定を使用します。

テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の
OpenClaw 配信経路を引き続き通過します。メディア生成にレガシーランタイムは必要ありません。
Codex が `savedPath` を含むネイティブ画像生成アイテムを発行した場合、
Codex ターンにアシスタントテキストがなくても、OpenClaw はその正確なファイルを通常の返信メディア
経路で転送します。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Plugin フック](/ja-JP/plugins/hooks)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [軌跡エクスポート](/ja-JP/tools/trajectory)
