---
read_when:
    - ブラウザーからGatewayを操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、アクティビティ、ノード、設定）
title: コントロール UI
x-i18n:
    generated_at: "2026-07-05T11:54:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ae0d8bd066edaab2d58f7eec53ee125a792577fb8a3f2af1d7b5e8c75480657
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway から配信される小さな **Vite + Lit** シングルページアプリです。

- 既定: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

同じポートで **Gateway WebSocket に直接** 通信します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行中の場合は、[http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）を開きます。

ページを読み込めない場合は、先に Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が動作していても、Windows Firewall や組織管理の Group Policy が通知された LAN URL をブロックする場合があります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性のあるポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールが報告されます。
</Note>

認証は WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択した Gateway URL に対してトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスから接続する場合、通常は **1 回限りのペアリング承認** が必要で、`disconnected (1008): pairing required` と表示されます。

<Steps>
  <Step title="保留中のリクエストを一覧表示">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="リクエスト ID で承認">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

ブラウザーが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認する前に `openclaw devices list` を再実行してください。

すでにペアリング済みのブラウザーを読み取りアクセスから書き込み/管理者アクセスに切り替える場合、サイレント再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックし、新しいスコープセットを明示的に承認するよう求めます。

承認されるとデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーション、取り消し、Paperclip / `openclaw_gateway` の初回実行承認フローについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

<Note>
- 直接の local loopback ブラウザー接続（`127.0.0.1` / `localhost`）は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復をスキップできます。デバイスなしブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーの切り替えやブラウザーデータの消去には再ペアリングが必要です。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続用 QR を作成できます。

<Steps>
  <Step title="モバイルペアリングを開く">
    **ノード** を選択し、**デバイス** カードの **モバイルデバイスをペアリング** をクリックします。
  </Step>
  <Step title="スマートフォンを接続する">
    OpenClaw モバイルアプリで **設定** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="接続を確認する">
    公式 iOS/Android アプリは自動的に接続します。**デバイス** に保留中リクエストが表示される場合は、承認する前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードの作成には `operator.admin` が必要です。この権限のないセッションではボタンは無効になります。セットアップコードには短命のブートストラップ認証情報が含まれるため、QR とコピーしたコードは有効な間パスワードと同様に扱ってください。リモートペアリングでは、Gateway は `wss://` に解決される必要があります（たとえば Tailscale Serve/Funnel 経由）。平文の `ws://` は loopback とプライベート LAN アドレスに限定されます。セキュリティとフォールバックの詳細については、[ペアリング](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID（ブラウザーローカル）

Control UI は、共有セッションでの帰属表示のため、送信メッセージに付与されるブラウザーごとの個人 ID（表示名とアバター）をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、送信したメッセージの通常のトランスクリプト著者メタデータを超えてサーバー側に永続化されることもありません。サイトデータを消去するかブラウザーを切り替えると空にリセットされます。

アシスタントアバターの上書きも同じブラウザーローカルパターンに従います。アップロードした上書きは、Gateway で解決された ID にローカルで重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` 設定フィールドは、そのフィールドを直接書き込む非 UI クライアント向けに引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/control-ui-config.json` から取得します。これは Gateway の Control UI ベースパスに対して相対的に解決されます（たとえばベースパス `/__openclaw__/` の下では `/__openclaw__/control-ui-config.json`）。このエンドポイントは、他の HTTP サーフェスと同じ Gateway 認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID が必要です。

## 言語サポート

Control UI は初回読み込み時にブラウザーロケールに基づいてローカライズされます。後で上書きするには、**概要 -> Gateway アクセス -> 言語** を開きます（ピッカーは Appearance ではなく Gateway アクセスカード内にあります）。

- サポートされるロケール: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以後のアクセスで再利用されます。
- 欠落している翻訳キーは英語にフォールバックします。

Docs 翻訳は同じ英語以外のロケールセットに対して生成されますが、Docs サイトに組み込まれた Mintlify 言語ピッカーには、Mintlify が受け付けるロケールコードのみが表示されます。タイ語（`th`）とペルシア語（`fa`）の Docs は公開リポジトリで引き続き生成されますが、Mintlify がそれらのコードをサポートするまでは、そのピッカーに表示されない場合があります。

## 外観テーマ

Appearance パネルには、組み込みの Claw、Knot、Dash テーマ（Claw が既定）に加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn エディター](https://tweakcn.com/editor/theme)を開き、テーマを選択または作成して **共有** をクリックし、コピーしたリンクを Appearance に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などの既定テーマ名も受け付けます。

インポートされたテーマは現在のブラウザープロファイルにのみ保存されます。Gateway 設定には書き込まれず、デバイス間で同期されません。インポート済みテーマを置き換えると、1 つのローカルスロットが更新されます。消去すると、インポート済みテーマが有効だった場合は Claw に戻ります。

Appearance には、ブラウザーローカルのテキストサイズ設定もあります。これは他の Control UI 設定と一緒に保存されます。チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用され、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力は少なくとも 16px に保たれます。

## できること（現在）

<AccordionGroup>
  <Accordion title="チャットとトーク">
    - Gateway WS（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）経由でモデルとチャットします。
    - チャット履歴の更新では、メッセージごとのテキスト上限付きで範囲を限定した最近のウィンドウを要求するため、大きなセッションでもチャットが使用可能になる前にブラウザーが完全なトランスクリプトペイロードをレンダリングする必要はありません。
    - ブラウザーのリアルタイムセッションでトークします。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 経由の制約付き 1 回限りのブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始します。Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway に保持しながら、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングし、`openclaw_agent_consult` プロバイダーツール呼び出しを Gateway ポリシーとより大きな設定済み OpenClaw モデルのために `talk.client.toolCall` 経由で転送し、アクティブ実行の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします（エージェントイベント）。
    - 既存の `session.tool` / ツールイベント配信からライブツールアクティビティのブラウザーローカルでリダクション優先の概要を表示する Activity タブ。

  </Accordion>
  <Accordion title="チャネル、インスタンス、セッション、ドリーム">
    - チャネル: 組み込みおよびバンドル/外部 Plugin チャネルのステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）。
    - チャネルプローブの更新では、低速なプロバイダーチェックが完了するまで前回のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルを付けます。
    - インスタンス: プレゼンス一覧と更新（`system-presence`）。
    - セッション: 既定で設定済みエージェントセッションを一覧表示し、頻繁に使うセッションをピン留めし、名前を変更し、非アクティブなセッションをアーカイブまたは復元し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/思考/高速/詳細/トレース/推論上書きを適用します（`sessions.list`, `sessions.patch`）。ピン留めされたセッションは最近の未ピン留めセッションより上に並びます。アーカイブされたセッションは Sessions ページのアーカイブビューにあり、トランスクリプトを保持します。
    - ドリーム: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴（`cron.*`）。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新（`skills.*`）。
    - ノード: 一覧と上限（`node.list`）、モバイルセットアップコードの作成、デバイスペアリングの承認（`device.pair.*`）。
    - exec 承認: Gateway またはノードの許可リストを編集し、`exec host=gateway/node` のポリシーを要求します（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します（`config.get`, `config.set`）。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列概要、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディター用の専用設定ページがあります。
    - 検証付きで適用して再起動し（`config.apply`）、最後にアクティブだったセッションを起動します。
    - 書き込みには、同時編集による上書きを防ぐ base-hash ガードが含まれます。
    - 書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内の参照に対してアクティブな SecretRef 解決を事前チェックします。未解決のアクティブな送信参照は、書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古いリダクト済みプレースホルダーを破棄しつつ、保存済みシークレットにまだ対応するリダクト済み値は保持します。
    - スキーマとフォームレンダリングは `config.schema` / `config.schema.lookup` から提供されます。フィールドの `title`/`description`、一致した UI ヒント、直接の子要素の概要、ネストされたオブジェクト/ワイルドカード/配列/合成ノードの Docs メタデータに加え、利用可能な場合は Plugin とチャネルのスキーマが含まれます。生 JSON エディターは、スナップショットが安全な生の往復を持つ場合にのみ利用できます。それ以外の場合、Control UI はフォームモードを強制します。
    - 生 JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングするのではなく、生で作成された形状（書式、コメント、`$include` レイアウト）を保持するため、スナップショットが安全に往復できる場合、外部編集はリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ壊れることを防ぐため、フォームのテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: ステータス/ヘルス/モデルのスナップショット、イベントログ、手動 RPC 呼び出し（`status`、`health`、`models.list`）。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、ブラウザがそれらの PerformanceObserver エントリタイプを公開している場合の長いアニメーションフレームや長いタスクに関するブラウザ応答性エントリが含まれます。
    - ログ: フィルター/エクスポート付きの Gateway ファイルログのライブテール（`logs.tail`）。
    - 更新: パッケージ/git 更新と再起動（`update.run`）を再起動レポート付きで実行し、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注意事項">
    - 分離ジョブでは、配信のデフォルトは要約のアナウンスです。内部専用の実行では none に切り替えます。
    - announce が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、`delivery.mode = "webhook"` を使用し、`delivery.to` に有効な HTTP(S) Webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを使用できます。
    - 高度な編集コントロールには、実行後削除、エージェント上書きのクリア、cron の exact/stagger オプション、エージェントのモデル/thinking 上書き、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインラインで表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、Webhook は認証ヘッダーなしで送信されます。
    - `cron.webhook` は非推奨のレガシーフォールバックです。まだ `notify: true` を使用している保存済みジョブを、ジョブごとの明示的な Webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行します。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用の MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー向けのオペレータービューです。このページ自体は MCP トランスポートを開始しません。保存済み設定の確認と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使用します。

一般的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. 合計、有効、OAuth、フィルター済みサーバー数のサマリーカードを確認します。
3. 各サーバー行で、トランスポート、有効化状態、認証、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーの設定は残すがランタイム検出からは除外したい場合、有効化状態を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex プロジェクションメタデータについて、スコープされた `mcp` 設定セクションを編集します。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更後の設定を適用させる場合は **保存して公開** を使用します。
7. 静的診断、ライブ証明、またはキャッシュ済みランタイムの破棄を行うには、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、資格情報を含む URL 風の値をレンダリング前にマスクし、コマンドスニペット内のサーバー名を引用符で囲むため、スペースやシェルのメタ文字を含む名前でもコピーしたコマンドが機能します。完全な CLI と設定リファレンス: [MCP](/ja-JP/cli/mcp)。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティ用の一時的なブラウザローカルオブザーバーであり、チャットのツールカードを動かしているものと同じ Gateway の `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームは追加しません。

アクティビティエントリには、サニタイズ済みの要約と、マスクされ切り詰められた出力プレビューのみが保持されます。ツール引数の値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。メモリ内リストは現在のブラウザタブに従い、Control UI 内のナビゲーションでは保持され、ページの再読み込み、セッション切り替え、または **クリア** でリセットされます。

## オペレーターターミナル

ドッキング可能なオペレーターターミナルはデフォルトで無効です。有効にするには、`gateway.terminal.enabled: true` を設定して Gateway を再起動します。ターミナルには `operator.admin` 接続が必要で、アクティブなエージェントワークスペース内でホスト PTY を開きます。新しいタブは、現在選択されているチャットエージェントに従います。

<Warning>
ターミナルは制限のないホストシェルであり、Gateway プロセス環境を継承します。信頼できるオペレーターデプロイでのみ有効にしてください。OpenClaw は `sandbox.mode: "all"` のエージェントに対するターミナルセッションを拒否します。アクティブなエージェントをそのモードに変更すると、既存および進行中のターミナルセッションが閉じられます。
</Warning>

ドックの切り替えには **Ctrl + backtick** を使用します。レイアウトは下部と右側へのドッキングに対応し、ブラウザビューポートに合わせてリサイズされ、複数のシェルタブを保持します。`gateway.terminal.enabled` と任意の `gateway.terminal.shell` 上書きについては、[Gateway 設定](/ja-JP/gateway/configuration-reference#gateway)を参照してください。

セッションは切断後も維持されます。ページの再読み込み、ノートパソコンのスリープ、ネットワークの瞬断では、セッションは終了されず Gateway 上でデタッチされ、同じブラウザタブが再接続時に再アタッチして最近の出力を再生します。デタッチされたセッションは `gateway.terminal.detachedSessionTimeoutSeconds` 後に終了されます（デフォルト 300 秒。`0` は切断時終了を復元します）。`terminal.list` はアタッチ可能なセッションを表示し、`terminal.attach` はその 1 つを採用し（tmux 風の引き継ぎ）、`terminal.text` はアタッチせずにセッションの最近の出力をプレーンテキストとして読み取ります。これはエージェント/ツール向けの便宜機能です。

ターミナルは `/?view=terminal` で全画面のターミナル専用ドキュメントとしても利用できます。iOS と Android アプリはこのページをターミナル画面に埋め込み、保存済みの Gateway 資格情報を再利用します。利用可否は同じ `gateway.terminal.enabled` と `operator.admin` ゲートに従い、接続先 Gateway がターミナルを提供していない場合はページに通知が表示されます。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は **非ブロッキング** です。`{ runId, status: "started" }` ですぐに ACK し、レスポンスは `chat` イベントを通じてストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用に任意の ACK タイミングメタデータも受け取る場合があります。
    - チャットアップロードは画像と動画以外のファイルを受け付けます。画像はネイティブ画像パスを保持し、その他のファイルは管理対象メディアとして保存され、履歴には添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }` が返り、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` レスポンスは UI 安全性のためサイズ制限されます。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示されるアシスタントメッセージが `chat.history` で切り詰められていた場合、サイドリーダーは `sessionKey`、必要に応じてアクティブな `agentId`、およびトランスクリプト `messageId` を使用して、表示正規化済みの完全なトランスクリプトエントリを `chat.message.get` からオンデマンドで取得できます。Gateway がそれでもさらに返せない場合、リーダーは切り詰められたプレビューを黙って繰り返すのではなく、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL を通じて返されるため、再読み込みは生の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` のレンダリング時、Control UI は表示されるアシスタントテキストから、表示専用のインラインディレクティブタグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、および漏れた ASCII/全角のモデル制御トークンを除去します。表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` または Heartbeat 確認トークン `HEARTBEAT_OK` のみであるアシスタントエントリは省略します。
    - アクティブな送信中と最後の履歴更新中、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示したままにします。Gateway 履歴が追いつくと、正規トランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブ `chat` イベントは配信状態であり、`chat.history` は永続セッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾のみをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新用の `chat` イベントをブロードキャストします（エージェント実行なし、チャンネル配信なし）。
    - サイドバーには、最近のセッション、New Session アクション、All Sessions リンク、完全なセッションピッカーを開くセッション検索ボタン（選択中のエージェントでスコープされ、検索とページネーション付き）が表示されます。新しいダッシュボードセッションは、最初の非コマンドメッセージから簡潔な生成タイトルを非同期で取得します。明示的な名前は置き換えられません。この個別のモデル呼び出しを低コストモデルにルーティングするには、`agents.defaults.utilityModel`（または `agents.list[].utilityModel`）を設定します。エージェントを切り替えると、そのエージェントに紐づくセッションのみが表示され、そのエージェントに保存済みダッシュボードセッションがまだない場合は、そのエージェントのメインセッションにフォールバックします。
    - 各セッションピッカー行では、セッションの名前変更、ピン留め、アーカイブができます。アクティブな実行とエージェントのメインセッションはアーカイブできません。現在選択中のセッションをアーカイブすると、チャットはそのエージェントのメインセッションに戻ります。
    - デスクトップ幅では、チャットコントロールは 1 つのコンパクトな行に留まり、トランスクリプトを下へスクロールしている間は折りたたまれます。上へスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つの吹き出しとしてレンダリングされます。画像、添付ファイル、ツール出力、キャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと thinking ピッカーは、`sessions.patch` を通じてアクティブセッションを即座にパッチします。これらは永続的なセッション上書きであり、1 ターン限りの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待機するため、送信には選択されたモデルが使用されます。
    - `/new` を入力すると、New Chat と同じ新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合は、そのメインセッションをその場でリセットします。`/reset` を入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットを維持します。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューをリクエストします。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動し、プロバイダー単位のカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーには明示的な `models.providers.*.models` エントリと、使用可能な認証を持つプロバイダーが表示されます。完全なカタログは、`view: "all"` を指定したデバッグ用 `models.list` RPC から引き続き利用できます。
    - 新しい Gateway セッション使用状況レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザーツールバーには使用率を示す小さなコンテキスト使用量リングが表示されます。完全なトークン詳細はそのツールチップにあります。リングはコンテキスト圧力が高いと警告スタイルに切り替わり、推奨される Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンを表示します。古いトークンスナップショットは、Gateway が新しい使用状況を再度報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` に加えて `openai` API キー認証プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` で構成します。OpenAI OAuth プロファイルでは Realtime 音声は構成されません。Google は、`talk.realtime.provider: "google"` に加えて `talk.realtime.providers.google.apiKey` で構成します。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI は WebRTC 用の一時的な Realtime クライアントシークレットを受け取り、Google Live はブラウザー WebSocket セッション用の使い捨ての制約付き Live API 認証トークンを受け取ります。このトークンには、Gateway によって命令とツール宣言が固定されます。バックエンドのリアルタイムブリッジのみを公開するプロバイダーは Gateway リレートランスポートを通るため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済みの Gateway RPC を通じて移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元指定の命令オーバーライドを受け付けません。

    Chat コンポーザーには、Talk 開始/停止ボタンの隣に Talk オプションボタンがあります。オプションは次の Talk セッションに適用され、プロバイダー、トランスポート、モデル、音声、推論エフォート、VAD しきい値、無音時間、プレフィックスパディングをオーバーライドできます。空のオプションは、構成済みのデフォルトまたはプロバイダーのデフォルトにフォールバックします。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままになり、プロバイダーがブラウザーセッションを作成できない場合は、リレーへ暗黙にフォールバックするのではなく失敗します。

    Talk コントロール自体は、マイク音声入力ボタンの隣にある波形ボタンです。Talk が開始すると、コンポーザーのステータス行には、音声が接続されている間はまず `Connecting Talk...`、次に `Talk live` が表示されます。または、リアルタイムツール呼び出しが `talk.client.toolCall` を通じて構成済みの大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、偽のマイクメディアを使った Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止**をクリックします（`chat.abort` を呼び出します）。
    - 実行中の間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止できます。
    - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブな実行を中止します。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止された場合でも、アシスタントの部分テキストは UI に表示されることがあります。
    - バッファされた出力がある場合、Gateway は中止されたアシスタントの部分テキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止部分と通常完了の出力を区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web プッシュ

Control UI には `manifest.webmanifest` とサービスワーカーが含まれているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw 更新直後にページに **Protocol mismatch** が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ハードリフレッシュしてください。それでも失敗する場合は、ダッシュボードオリジンのサイトデータをクリアするか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュが、更新前の Control UI バンドルを新しい Gateway に対して実行し続けることがあります。

| サーフェス                                            | 役割                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーは「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使われる自動生成の VAPID キーペア。       |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。                          |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、テストなど）は、Gateway プロセス上の環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `https://openclaw.ai`）

Control UI は、これらのスコープで制限された Gateway メソッドを使ってブラウザーサブスクリプションを登録およびテストします。

- `push.web.vapidPublicKey` はアクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` は `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` は登録済みエンドポイントを削除します。
- `push.web.test` は呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は iOS APNS リレーパス（リレー支援のプッシュについては [構成](/ja-JP/gateway/configuration) を参照）およびネイティブモバイルペアリングを対象とする `push.test` メソッドとは独立しています。
</Note>

## ホスト型埋め込み

アシスタントメッセージは `[embed ...]` ショートコードで、ホストされた Web コンテンツをインライン表示できます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト型埋め込み内でのスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts (デフォルト)">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイトドキュメント向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
埋め込みドキュメントが同一オリジン動作を本当に必要とする場合にのみ `trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` の方が安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL はデフォルトでブロックされたままです。`[embed url="https://..."]` でサードパーティページを読み込めるようにするには、`gateway.controlUi.allowExternalEmbedUrls: true` を設定します。

## Chat メッセージ幅

グループ化された Chat メッセージには、読みやすいデフォルトの最大幅が使われます。ワイドモニターのデプロイでは、バンドル CSS をパッチせずに `gateway.controlUi.chatMessageMaxWidth` を設定して上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに到達する前に検証されます。サポートされる形式には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` の幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway をループバックに維持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）を開きます。

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `x-forwarded-for` アドレスを `tailscale whois` で解決し、それをヘッダーと照合することで ID を検証します。また、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きでループバックに到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスなしブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックであっても明示的な共有シークレット認証情報を要求したい場合は、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

    その非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗の試行は、レート制限の書き込み前に直列化されます。そのため、同じブラウザーからの並行した不正な再試行では、2 つの単純な不一致が並行して競合する代わりに、2 回目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなしの Serve 認証は、ゲートウェイホストが信頼されていることを前提とします。そのホストで信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    `http://<tailscale-ip>:18789/`（または構成済みの `gateway.controlUi.basePath`）を開きます。

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは**非セキュアコンテキスト**で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 専用の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` を通じたオペレーター Control UI 認証の成功
- 緊急時用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで `https://<magicdns>/`（Serve）または `http://127.0.0.1:18789/`（ゲートウェイホスト上）で開きます。

<AccordionGroup>
  <Accordion title="安全でない認証トグルの動作">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` はローカル互換性トグルのみです。

    - 非セキュア HTTP コンテキストで、localhost Control UI セッションがデバイス ID なしで続行できるようにします。
    - ペアリングチェックをバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件を緩和しません。

  </Accordion>
  <Accordion title="緊急時のみ">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、深刻なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで**オペレーター** Control UI セッションを許可できます。
    - これはノードロールの Control UI セッションには拡張されません。
    - 同一ホストのループバックリバースプロキシは、依然として信頼済みプロキシ認証を満たしません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップガイダンスについては [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが含まれています。許可されるのは**同一オリジン**アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモートの `http(s)` およびプロトコル相対の画像 URL はブラウザーによって拒否され、ネットワーク取得は発行されません。

実際には:

- 相対パス（たとえば `/avatars/<id>`）で配信されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証済みアバタールートを含めて、引き続き表示されます。
- インラインの `data:image/...` URL は引き続き表示されます。
- Control UI によって作成されたローカル `blob:` URL は引き続き表示されます。
- チャンネルメタデータが出力するリモートアバター URL は、Control UI のアバターヘルパーで除去され、組み込みのロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像取得を強制することはできません。

これは常に有効で、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI のアバターエンドポイントには API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は認証済みの呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じルールでアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されるため（隣接する assistant-media ルートと同様）、それ以外は保護されているホスト上でアバタールートがエージェント ID を漏えいすることはありません。
- Control UI はアバター取得時に Gateway トークンをベアラーヘッダーとして転送し、認証済み blob URL を使うため、ダッシュボードでも画像が引き続き表示されます。

Gateway 認証を無効にすると（共有ホストでは非推奨）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## assistant-media ルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には通常の Control UI オペレーター認証が必要です。ブラウザーは利用可能性を確認するときに Gateway トークンをベアラーヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメントの URL は、アクティブな Gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットはすぐに期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れずに、ブラウザー標準のメディア要素との互換性を保ってメディアをレンダリングできます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発（別の開発サーバー）:

```bash
pnpm ui:dev
```

次に、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期のコンテンツスクリプトが JavaScript モジュールアプリの評価を妨げている可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML のリカバリーパネルが含まれています。

ブラウザー環境を変更した後にパネルの **再試行** アクションを使用するか、次の確認後に手動で再読み込みしてください。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンとは異なっていてもかまいません。これは、Vite 開発サーバーをローカルで使い、Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    任意の 1 回限りの認証（必要な場合）:

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように値を URL エンコードしてください。
    - `token` は可能な限り URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のために 1 回だけインポートされますが、フォールバックとしてのみ使用され、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS の背後にある場合（Tailscale Serve、HTTPS プロキシなど）は `wss://` を使用してください。
    - `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け入れられます。
    - 公開された非ループバックの Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベートな same-origin LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
    - Gateway 起動時に、有効なランタイムのバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーのオリジンには引き続き明示的なエントリが必要です。
    - 厳密に管理されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは任意のブラウザーオリジンを許可するという意味であり、「使用中のホストに何でも一致させる」という意味ではありません。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモートアクセスのセットアップ詳細: [リモートアクセス](/ja-JP/gateway/remote)。

## 関連

- [ダッシュボード](/ja-JP/web/dashboard) — Gateway ダッシュボード
- [ヘルスチェック](/ja-JP/gateway/health) — Gateway ヘルス監視
- [TUI](/ja-JP/web/tui) — ターミナルユーザーインターフェイス
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェイス
