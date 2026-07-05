---
read_when:
    - ブラウザーから Gateway を操作したい
    - SSH トンネルなしで Tailnet アクセスを使いたい
sidebarTitle: Control UI
summary: Gateway 用のブラウザベースの制御 UI（チャット、アクティビティ、ノード、設定）
title: Control UI
x-i18n:
    generated_at: "2026-07-05T01:57:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a0be69835dd1f06484eaaa11935875156ebc2c489a99bea4049feabd17f0380
    source_path: web/control-ui.md
    workflow: 16
---

Control UI は、Gateway によって提供される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- オプションのプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

同じポートで **Gateway WebSocket** と直接通信します。

## すばやく開く (ローカル)

Gateway が同じコンピューターで実行されている場合は、次を開きます。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (または [http://localhost:18789/](http://localhost:18789/))

ページの読み込みに失敗する場合は、まず Gateway を起動します: `openclaw gateway`。

<Note>
ネイティブ Windows の LAN バインドでは、Gateway ホスト上で `127.0.0.1` が機能していても、Windows Firewall または組織管理の Group Policy によって、通知された LAN URL がブロックされることがあります。Windows ホストで `openclaw gateway status --deep` を実行してください。ブロックされている可能性のあるポート、プロファイルの不一致、ポリシーが無視する可能性のあるローカルファイアウォールルールが報告されます。
</Note>

認証は、WebSocket ハンドシェイク中に次の方法で提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択された Gateway URL 用のトークンを保持します。パスワードは永続化されません。オンボーディングでは通常、初回接続時に共有シークレット認証用の Gateway トークンが生成されますが、`gateway.auth.mode` が `"password"` の場合はパスワード認証も機能します。

## デバイスのペアリング (初回接続)

新しいブラウザーまたはデバイスから Control UI に接続すると、Gateway は通常、**1 回限りのペアリング承認**を要求します。これは、不正アクセスを防ぐためのセキュリティ対策です。

**表示される内容:** 「切断されました (1008): ペアリングが必要です」

<Steps>
  <Step title="保留中のリクエストを一覧表示する">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="リクエスト ID で承認する">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

ブラウザーが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから書き込み/管理者アクセスへ変更した場合、これはサイレントな再接続ではなく承認アップグレードとして扱われます。OpenClaw は古い承認を有効なまま保持し、より広い権限での再接続をブロックして、新しいスコープセットを明示的に承認するよう求めます。

承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。トークンローテーションと取り消しについては、[デバイス CLI](/ja-JP/cli/devices) を参照してください。

`openclaw_gateway` アダプター経由で接続する Paperclip エージェントは、同じ初回実行時の承認フローを使用します。最初の接続試行後、`openclaw devices approve --latest` を実行して保留中のリクエストをプレビューし、出力された `openclaw devices approve <requestId>` コマンドを再実行して承認します。リモート Gateway には明示的な `--url` と `--token` の値を渡してください。再起動をまたいで承認を安定させるには、実行ごとに新しい一時的なデバイス ID を生成させるのではなく、Paperclip で永続的な `adapterConfig.devicePrivateKeyPem` を設定します。

<Note>
- 直接の local loopback ブラウザー接続 (`127.0.0.1` / `localhost`) は自動承認されます。
- `gateway.auth.allowTailscale: true` で、Tailscale ID が検証され、ブラウザーがデバイス ID を提示する場合、Tailscale Serve は Control UI オペレーターセッションのペアリング往復を省略できます。
- 直接の Tailnet バインド、LAN ブラウザー接続、デバイス ID のないブラウザープロファイルでは、引き続き明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイス ID を生成するため、ブラウザーを切り替えたりブラウザーデータを消去したりすると、再ペアリングが必要になります。

</Note>

## モバイルデバイスをペアリングする

すでにペアリング済みの管理者は、ターミナルを開かずに iOS/Android 接続 QR を作成できます。

<Steps>
  <Step title="モバイルペアリングを開く">
    **ノード**を選択し、**デバイス**カードで **モバイルデバイスをペアリング**をクリックします。
  </Step>
  <Step title="スマートフォンを接続する">
    OpenClaw モバイルアプリで、**設定** → **Gateway** を開き、QR コードをスキャンします。代わりにセットアップコードをコピーして貼り付けることもできます。
  </Step>
  <Step title="接続を確認する">
    公式 iOS/Android アプリは自動的に接続します。**デバイス**に保留中のリクエストが表示される場合は、承認前にそのロールとスコープを確認してください。
  </Step>
</Steps>

セットアップコードの作成には `operator.admin` が必要です。これを持たないセッションではボタンが無効になります。セットアップコードには短命のブートストラップ認証情報が含まれるため、有効な間は QR とコピーしたコードをパスワードのように扱ってください。リモートペアリングでは、Gateway は `wss://` に解決される必要があります (たとえば Tailscale Serve/Funnel 経由)。プレーンな `ws://` はループバックとプライベート LAN アドレスに限定されます。完全なセキュリティとフォールバックの詳細については、[ペアリング](/ja-JP/channels/pairing#pair-from-the-control-ui-recommended) を参照してください。

## 個人 ID (ブラウザーローカル)

Control UI は、共有セッションでの帰属表示のために、送信メッセージへ付与されるブラウザーごとの個人 ID (表示名とアバター) をサポートします。これはブラウザーストレージに保存され、現在のブラウザープロファイルにスコープされます。他のデバイスには同期されず、実際に送信したメッセージ上の通常のトランスクリプト著者メタデータを除き、サーバー側には永続化されません。サイトデータを消去したりブラウザーを切り替えたりすると、空にリセットされます。

同じブラウザーローカルのパターンは、アシスタントアバターのオーバーライドにも適用されます。アップロードされたアシスタントアバターは、ローカルブラウザー上でのみ Gateway が解決した ID に重ねられ、`config.patch` を通じて往復することはありません。共有 `ui.assistant.avatar` config フィールドは、スクリプト化された Gateway やカスタムダッシュボードなど、フィールドへ直接書き込む非 UI クライアント向けには引き続き利用できます。

## ランタイム設定エンドポイント

Control UI は、ランタイム設定を `/control-ui-config.json` から取得します。これは Gateway の Control UI ベースパスからの相対で解決されます (たとえば UI が `/__openclaw__/` の下で提供される場合は `/__openclaw__/control-ui-config.json`)。そのエンドポイントは、HTTP サーフェスの他の部分と同じ Gateway 認証で保護されます。未認証のブラウザーは取得できず、取得に成功するには、すでに有効な Gateway トークン/パスワード、Tailscale Serve ID、または信頼済みプロキシ ID のいずれかが必要です。

## 言語サポート

Control UI は、初回読み込み時にブラウザーのロケールに基づいて自身をローカライズできます。後で上書きするには、**概要 -> Gateway アクセス -> 言語**を開きます。ロケールピッカーは外観ではなく Gateway アクセスカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 英語以外の翻訳はブラウザーで遅延読み込みされます。
- 選択したロケールはブラウザーストレージに保存され、以降の訪問で再利用されます。
- 不足している翻訳キーは英語にフォールバックします。

Docs の翻訳は同じ英語以外のロケールセット向けに生成されますが、docs サイトに組み込まれた Mintlify 言語ピッカーは Mintlify が受け入れるロケールコードに制限されます。タイ語 (`th`) とペルシア語 (`fa`) の docs も publish repo に生成されますが、Mintlify がこれらのコードをサポートするまで、そのピッカーには表示されない場合があります。

## 外観テーマ

外観パネルには、組み込みの Claw、Knot、Dash テーマに加えて、ブラウザーローカルの tweakcn インポートスロットが 1 つあります。テーマをインポートするには、[tweakcn editor](https://tweakcn.com/editor/theme) を開き、テーマを選択または作成し、**共有**をクリックして、コピーしたテーマリンクを外観に貼り付けます。インポーターは `https://tweakcn.com/r/themes/<id>` レジストリ URL、`https://tweakcn.com/editor/theme?theme=amethyst-haze` のようなエディター URL、相対 `/themes/<id>` パス、生のテーマ ID、`amethyst-haze` などのデフォルトテーマ名も受け入れます。

外観には、ブラウザーローカルのテキストサイズ設定も含まれます。この設定は Control UI の他の設定と一緒に保存され、チャットテキスト、コンポーザーテキスト、ツールカード、チャットサイドバーに適用されます。また、モバイル Safari がフォーカス時に自動ズームしないよう、テキスト入力は少なくとも 16px に保たれます。

インポートされたテーマは、現在のブラウザープロファイルにのみ保存されます。Gateway config には書き込まれず、デバイス間で同期されません。インポートされたテーマを置き換えると、1 つのローカルスロットが更新されます。選択中のテーマがインポートされたテーマだった場合、それを消去するとアクティブなテーマは Claw に戻ります。

## できること (現在)

<AccordionGroup>
  <Accordion title="チャットと音声会話">
    - Gateway WS 経由でモデルとチャットします (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)。
    - チャット履歴の更新では、メッセージごとのテキスト上限を持つ境界付きの最近のウィンドウを要求するため、大きなセッションでも、チャットが使えるようになる前にブラウザーへ完全なトランスクリプトペイロードのレンダリングを強制しません。
    - ブラウザーのリアルタイムセッションを通じて音声会話します。OpenAI は直接 WebRTC を使用し、Google Live は WebSocket 上の制約付き 1 回限りブラウザートークンを使用し、バックエンド専用のリアルタイム音声 Plugin は Gateway リレートランスポートを使用します。クライアント所有のプロバイダーセッションは `talk.client.create` で開始し、Gateway リレーセッションは `talk.session.create` で開始します。リレーはプロバイダー認証情報を Gateway 上に保持し、ブラウザーが `talk.session.appendAudio` を通じてマイク PCM をストリーミングする間、Gateway ポリシーと、設定されたより大きな OpenClaw モデルのために `openclaw_agent_consult` プロバイダーツール呼び出しを `talk.client.toolCall` 経由で転送し、アクティブ実行の音声ステアリングを `talk.client.steer` または `talk.session.steer` 経由でルーティングします。
    - チャット内でツール呼び出しとライブツール出力カードをストリーミングします (エージェントイベント)。
    - 既存の `session.tool` / ツールイベント配信から、ライブツール活動のブラウザーローカルで編集優先の要約を表示するアクティビティタブ。

  </Accordion>
  <Accordion title="チャンネル、インスタンス、セッション、Dreaming">
    - チャンネル: 組み込みおよびバンドル/外部 Plugin チャンネルのステータス、QR ログイン、チャンネルごとの config (`channels.status`, `web.login.*`, `config.patch`)。
    - チャンネルプローブの更新では、遅いプロバイダーチェックが完了するまで前回のスナップショットを表示したままにし、プローブまたは監査が UI 予算を超えた場合は部分スナップショットにラベルを付けます。
    - インスタンス: プレゼンス一覧と更新 (`system-presence`)。
    - セッション: デフォルトで設定済みエージェントセッションを一覧表示し、頻繁に使うセッションをピン留めし、名前変更し、非アクティブなセッションをアーカイブまたは復元し、古い未設定エージェントセッションキーからフォールバックし、セッションごとのモデル/thinking/fast/verbose/trace/reasoning オーバーライドを適用します (`sessions.list`, `sessions.patch`)。ピン留めされたセッションは最近の未ピン留めセッションより上に並びます。アーカイブされたセッションはセッションページのアーカイブビューにあり、トランスクリプトを保持します。
    - Dreams: Dreaming ステータス、有効/無効トグル、Dream Diary リーダー (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)。

  </Accordion>
  <Accordion title="Cron、Skills、ノード、exec 承認">
    - Cron ジョブ: 一覧/追加/編集/実行/有効化/無効化と実行履歴 (`cron.*`)。
    - Skills: ステータス、有効化/無効化、インストール、API キー更新 (`skills.*`)。
    - ノード: 一覧と caps (`node.list`)、モバイルセットアップコードの作成、デバイスペアリングの承認 (`device.pair.*`)。
    - Exec 承認: `exec host=gateway/node` の Gateway またはノードの許可リストと ask policy を編集します (`exec.approvals.*`)。

  </Accordion>
  <Accordion title="設定">
    - `~/.openclaw/openclaw.json` を表示/編集します (`config.get`, `config.set`)。
    - MCP には、設定済みサーバー、有効化、OAuth/フィルター/並列サマリー、一般的なオペレーターコマンド、スコープ付き `mcp` 設定エディターのための専用設定ページがあります。
    - 検証付きで適用 + 再起動し (`config.apply`)、最後のアクティブセッションを起動します。
    - 書き込みには、同時編集の上書きを防ぐためのベースハッシュガードが含まれます。
    - 書き込み (`config.set`/`config.apply`/`config.patch`) は、送信された設定ペイロード内の参照について、アクティブな SecretRef 解決を事前確認します。送信された未解決のアクティブ参照は、書き込み前に拒否されます。
    - フォーム保存では、保存済み設定から復元できない古い墨消しプレースホルダーを破棄し、保存済みシークレットにまだ対応している墨消し値は保持します。
    - スキーマ + フォームレンダリング (`config.schema` / `config.schema.lookup`、フィールド `title` / `description`、一致した UI ヒント、直下の子要素サマリー、ネストされたオブジェクト/ワイルドカード/配列/合成ノード上のドキュメントメタデータ、さらに利用可能な場合は Plugin + チャンネルスキーマを含む)。Raw JSON エディターは、スナップショットが安全な raw ラウンドトリップを持つ場合にのみ利用できます。
    - スナップショットが raw テキストを安全にラウンドトリップできない場合、Control UI はそのスナップショットでフォームモードを強制し、Raw モードを無効にします。
    - Raw JSON エディターの「保存済みにリセット」は、フラット化されたスナップショットを再レンダリングする代わりに、raw で作成された形状 (書式、コメント、`$include` レイアウト) を保持するため、スナップショットが安全にラウンドトリップできる場合、外部編集はリセット後も残ります。
    - 構造化された SecretRef オブジェクト値は、誤ってオブジェクトから文字列へ破損するのを防ぐため、フォームテキスト入力では読み取り専用としてレンダリングされます。

  </Accordion>
  <Accordion title="デバッグ、ログ、更新">
    - デバッグ: status/health/models スナップショット + イベントログ + 手動 RPC 呼び出し (`status`, `health`, `models.list`)。
    - イベントログには、Control UI の更新/RPC タイミング、遅いチャット/設定レンダリングのタイミング、ブラウザーがそれらの PerformanceObserver エントリータイプを公開している場合の長いアニメーションフレームまたは長いタスクに関するブラウザー応答性エントリーが含まれます。
    - ログ: フィルター/エクスポート付きで Gateway ファイルログをライブテールします (`logs.tail`)。
    - 更新: 再起動レポート付きでパッケージ/git 更新 + 再起動を実行し (`update.run`)、再接続後に `update.status` をポーリングして実行中の Gateway バージョンを確認します。

  </Accordion>
  <Accordion title="Cron ジョブパネルの注記">
    - 分離ジョブでは、配信のデフォルトはサマリーの通知です。内部専用の実行にしたい場合は none に切り替えられます。
    - 通知が選択されている場合、チャンネル/ターゲットフィールドが表示されます。
    - Webhook モードでは、`delivery.mode = "webhook"` を使い、`delivery.to` に有効な HTTP(S) webhook URL を設定します。
    - メインセッションジョブでは、webhook と none の配信モードを利用できます。
    - 高度な編集コントロールには、実行後削除、エージェントオーバーライドのクリア、cron の exact/stagger オプション、エージェントモデル/thinking オーバーライド、ベストエフォート配信トグルが含まれます。
    - フォーム検証はフィールドレベルのエラーとしてインライン表示されます。無効な値がある場合、修正されるまで保存ボタンは無効になります。
    - 専用の bearer token を送信するには `cron.webhookToken` を設定します。省略した場合、webhook は auth ヘッダーなしで送信されます。
    - 非推奨のフォールバック: `notify: true` を持つ保存済みのレガシージョブを `cron.webhook` から明示的なジョブごとの webhook または完了配信へ移行するには、`openclaw doctor --fix` を実行します。

  </Accordion>
</AccordionGroup>

## MCP ページ

専用 MCP ページは、`mcp.servers` 配下の OpenClaw 管理 MCP サーバーのためのオペレータービューです。これ自体は MCP トランスポートを開始しません。保存済み設定の検査と編集に使用し、ライブサーバーの証明が必要な場合は `openclaw mcp doctor --probe` を使います。

一般的なワークフロー:

1. サイドバーから **MCP** を開きます。
2. 合計、有効、OAuth、フィルター済みサーバー数についてサマリーカードを確認します。
3. 各サーバー行で、トランスポート、有効化、認証、フィルター、タイムアウト、コマンドヒントを確認します。
4. サーバーの設定は残すがランタイム検出から除外しておく必要がある場合は、有効化を切り替えます。
5. サーバー定義、ヘッダー、TLS/mTLS パス、OAuth メタデータ、ツールフィルター、Codex 投影メタデータについて、スコープ付き `mcp` 設定セクションを編集します。
6. 設定を書き込むには **保存** を使用し、実行中の Gateway に変更後の設定を適用させる場合は **保存して公開** を使用します。
7. 編集したプロセスに静的診断、ライブ証明、またはキャッシュされたランタイムの破棄が必要な場合は、ターミナルから `openclaw mcp status --verbose`、`openclaw mcp doctor --probe`、または `openclaw mcp reload` を実行します。

このページは、認証情報を含む URL 風の値をレンダリング前に墨消しし、コマンドスニペット内のサーバー名を引用符で囲むため、コピーしたコマンドはスペースやシェルメタ文字を含む場合でも動作します。完全な CLI と設定リファレンスは [MCP](/ja-JP/cli/mcp) にあります。

## アクティビティタブ

アクティビティタブは、ライブツールアクティビティのための一時的なブラウザーローカルのオブザーバーです。これはチャットのツールカードを支える同じ Gateway `session.tool` / ツールイベントストリームから派生します。別の Gateway イベントファミリー、エンドポイント、永続的なアクティビティストア、メトリクスフィード、外部オブザーバーストリームを追加するものではありません。

アクティビティエントリーは、サニタイズ済みサマリーと、墨消しされ切り詰められた出力プレビューのみを保持します。ツール引数の値はアクティビティ状態に保存されません。UI は引数が非表示であることを示し、引数フィールド数のみを記録します。インメモリリストは現在のブラウザータブに従い、Control UI 内のナビゲーション後も残り、ページリロード、セッション切り替え、または **クリア** でリセットされます。

## オペレーターターミナル

ドッキング可能なオペレーターターミナルはデフォルトで無効です。有効にするには、`gateway.terminal.enabled: true` を設定して Gateway を再起動します。ターミナルには `operator.admin` 接続が必要で、アクティブなエージェントワークスペース内でホスト PTY を開きます。新しいタブは現在選択されているチャットエージェントに従います。

<Warning>
ターミナルは制限のないホストシェルであり、Gateway プロセス環境を継承します。信頼できるオペレーターデプロイでのみ有効にしてください。OpenClaw は `sandbox.mode: "all"` のエージェントに対するターミナルセッションを拒否します。アクティブなエージェントをそのモードに変更すると、その既存および進行中のターミナルセッションは閉じられます。
</Warning>

**Ctrl + backtick** を使用してドックを切り替えます。レイアウトは下部と右側のドッキングに対応し、ブラウザービューポートに合わせてサイズ変更され、複数のシェルタブを保持します。`gateway.terminal.enabled` と任意の `gateway.terminal.shell` オーバーライドについては、[Gateway 設定](/ja-JP/gateway/configuration-reference#gateway) を参照してください。

セッションは切断後も存続します。ページリロード、ラップトップのスリープ、またはネットワークの一時的な切断ではセッションを終了せず、Gateway 上でデタッチします。同じブラウザータブは再接続時に再アタッチし、最近の出力が再生されます。デタッチされたセッションは `gateway.terminal.detachedSessionTimeoutSeconds` 後に終了されます (デフォルト 300 秒。`0` は切断時終了を復元します)。`terminal.list` はアタッチ可能なセッションを表示し、`terminal.attach` はその 1 つを採用し (tmux スタイルの引き継ぎ)、`terminal.text` はアタッチせずにセッションの最近の出力をプレーンテキストとして読み取ります。これはエージェント/ツーリング向けの機能です。

## チャットの動作

<AccordionGroup>
  <Accordion title="送信と履歴のセマンティクス">
    - `chat.send` は**ノンブロッキング**です。即座に `{ runId, status: "started" }` で ACK し、レスポンスは `chat` イベント経由でストリーミングされます。信頼済みの Control UI クライアントは、ローカル診断用の任意の ACK タイミングメタデータも受け取ることがあります。
    - チャットのアップロードは、画像と非動画ファイルを受け付けます。画像はネイティブの画像パスを保持し、それ以外のファイルは管理対象メディアとして保存され、履歴では添付リンクとして表示されます。
    - 同じ `idempotencyKey` で再送信すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` が返ります。
    - `chat.history` のレスポンスは、UI の安全性のためサイズ制限されています。トランスクリプトエントリが大きすぎる場合、Gateway は長いテキストフィールドを切り詰め、重いメタデータブロックを省略し、過大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えることがあります。
    - 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、サイドリーダーは必要に応じて、`sessionKey`、必要な場合はアクティブな `agentId`、およびトランスクリプトの `messageId` を使って、`chat.message.get` から表示正規化済みの完全なトランスクリプトエントリを取得できます。Gateway がそれでも追加内容を返せない場合、リーダーは切り詰められたプレビューを黙って繰り返す代わりに、明示的な利用不可状態を表示します。
    - アシスタント/生成画像は管理対象メディア参照として永続化され、認証済み Gateway メディア URL 経由で返されるため、再読み込みは生の base64 画像ペイロードがチャット履歴レスポンスに残っていることに依存しません。
    - `chat.history` をレンダリングするとき、Control UI は表示されるアシスタントテキストから、表示専用のインライン指示タグ（例: `[[reply_to_*]]` と `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角のモデル制御トークンを取り除き、表示可能なテキスト全体が厳密に無音トークン `NO_REPLY` / `no_reply` または Heartbeat 応答トークン `HEARTBEAT_OK` だけであるアシスタントエントリを省略します。
    - アクティブな送信中および最終履歴更新時に、`chat.history` が一時的に古いスナップショットを返した場合でも、チャットビューはローカルの楽観的なユーザー/アシスタントメッセージを表示し続けます。Gateway 履歴が追いつくと、正規のトランスクリプトがそれらのローカルメッセージを置き換えます。
    - ライブの `chat` イベントは配信状態であり、`chat.history` は永続化されたセッショントランスクリプトから再構築されます。ツール最終イベントの後、Control UI は履歴を再読み込みし、小さな楽観的末尾だけをマージします。トランスクリプト境界は [WebChat](/ja-JP/web/webchat) に記載されています。
    - `chat.inject` はアシスタントノートをセッショントランスクリプトに追加し、UI 専用更新用の `chat` イベントをブロードキャストします（エージェント実行なし、チャネル配信なし）。
    - サイドバーには、New Session アクション、All Sessions リンク、セッション検索ボタン付きで最近のセッションが一覧表示されます。セッション検索ボタンは完全なセッションピッカーを開きます（選択されたエージェントでスコープされ、検索とページネーション付き）。新しいダッシュボードセッションには、最初の非コマンドメッセージから簡潔な生成タイトルが非同期で付与されます。明示的な名前が置き換えられることはありません。この別モデル呼び出しを低コストモデルにルーティングするには、`agents.defaults.utilityModel`（または `agents.list[].utilityModel`）を設定します。エージェントを切り替えると、そのエージェントに紐づくセッションだけが表示され、保存済みダッシュボードセッションがまだない場合はそのエージェントのメインセッションにフォールバックします。
    - 各セッションピッカー行では、セッションの名前変更、ピン留め、アーカイブができます。アクティブな実行とエージェントのメインセッションはアーカイブできません。現在選択中のセッションをアーカイブすると、Chat はそのエージェントのメインセッションに戻ります。
    - デスクトップ幅では、チャットコントロールはコンパクトな 1 行に留まり、トランスクリプトを下にスクロールすると折りたたまれます。上にスクロールする、先頭に戻る、または末尾に到達すると、コントロールが復元されます。
    - 連続する重複したテキストのみのメッセージは、件数バッジ付きの 1 つのバブルとしてレンダリングされます。画像、添付、ツール出力、またはキャンバスプレビューを含むメッセージは折りたたまれません。
    - チャットヘッダーのモデルピッカーと思考ピッカーは、`sessions.patch` 経由でアクティブセッションに即座にパッチを適用します。これらは永続的なセッションオーバーライドであり、1 ターン限りの送信オプションではありません。
    - 同じセッションのモデルピッカー変更がまだ保存中の間にメッセージを送信した場合、コンポーザーは `chat.send` を呼び出す前にそのセッションパッチを待つため、送信には選択されたモデルが使われます。
    - Control UI で `/new` と入力すると、New Chat と同じ新しいダッシュボードセッションが作成され、そのセッションに切り替わります。ただし、`session.dmScope: "main"` が設定されていて、現在の親がエージェントのメインセッションである場合は、その場でメインセッションをリセットします。`/reset` と入力すると、現在のセッションに対する Gateway の明示的なインプレースリセットが維持されます。
    - チャットモデルピッカーは、Gateway の設定済みモデルビューを要求します。`agents.defaults.models` が存在する場合、その許可リストがピッカーを駆動します。これにはプロバイダースコープのカタログを動的に保つ `provider/*` エントリも含まれます。それ以外の場合、ピッカーは明示的な `models.providers.*.models` エントリと、利用可能な認証を持つプロバイダーを表示します。完全なカタログは、`view: "all"` を指定したデバッグ用 `models.list` RPC 経由で引き続き利用できます。
    - 最新の Gateway セッション使用量レポートに現在のコンテキストトークンが含まれている場合、チャットコンポーザーツールバーには使用率を示す小さなコンテキスト使用量リングが表示されます。完全なトークン詳細はそのツールチップにあります。コンテキスト圧力が高いとリングは警告スタイルに切り替わり、推奨 Compaction レベルでは通常のセッション Compaction パスを実行するコンパクトなボタンが表示されます。古いトークンスナップショットは、Gateway が再び新しい使用量を報告するまで非表示になります。

  </Accordion>
  <Accordion title="トークモード（ブラウザーリアルタイム）">
    トークモードは、登録済みのリアルタイム音声プロバイダーを使用します。OpenAI は、`talk.realtime.provider: "openai"` と `openai` API キー認証プロファイル、`talk.realtime.providers.openai.apiKey`、または `OPENAI_API_KEY` を組み合わせて設定します。OpenAI OAuth プロファイルでは Realtime 音声は設定されません。Google は、`talk.realtime.provider: "google"` と `talk.realtime.providers.google.apiKey` を組み合わせて設定します。ブラウザーが標準のプロバイダー API キーを受け取ることはありません。OpenAI には WebRTC 用の一時的な Realtime クライアントシークレットが渡されます。Google Live には、ブラウザー WebSocket セッション用の 1 回限りの制約付き Live API 認証トークンが渡され、指示とツール宣言は Gateway によってそのトークン内にロックされます。バックエンドのリアルタイムブリッジだけを公開するプロバイダーは、Gateway リレートランスポートを通じて実行されるため、認証情報とベンダーソケットはサーバー側に留まり、ブラウザー音声は認証済み Gateway RPC 経由で移動します。Realtime セッションプロンプトは Gateway によって組み立てられます。`talk.client.create` は呼び出し元から提供される指示オーバーライドを受け付けません。

    Chat コンポーザーには、Talk 開始/停止ボタンの横に Talk オプションボタンがあります。オプションは次の Talk セッションに適用され、プロバイダー、トランスポート、モデル、音声、推論エフォート、VAD しきい値、無音時間、プレフィックスパディングをオーバーライドできます。オプションが空の場合、Gateway は利用可能であれば設定済みデフォルトを、そうでなければプロバイダーのデフォルトを使用します。Gateway リレーを選択するとバックエンドリレーパスが強制されます。WebRTC を選択するとセッションはクライアント所有のままになり、プロバイダーがブラウザーセッションを作成できない場合、リレーへ黙ってフォールバックする代わりに失敗します。

    Chat コンポーザーでは、Talk コントロールはマイクディクテーションボタンの横にある波形ボタンです。Talk が開始すると、音声接続中はコンポーザーのステータス行に `Connecting Talk...`、続いて `Talk live` が表示されます。または、リアルタイムツール呼び出しが `talk.client.toolCall` 経由で設定済みのより大きなモデルに問い合わせている間は `Asking OpenClaw...` が表示されます。

    メンテナー向けライブスモーク: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` は、OpenAI バックエンド WebSocket ブリッジ、OpenAI ブラウザー WebRTC SDP 交換、Google Live 制約付きトークンのブラウザー WebSocket セットアップ、およびフェイクマイクメディアを使った Gateway リレーのブラウザーアダプターを検証します。このコマンドはプロバイダーのステータスのみを出力し、シークレットはログに記録しません。

  </Accordion>
  <Accordion title="停止と中止">
    - **停止**をクリックします（`chat.abort` を呼び出します）。
    - 実行がアクティブな間、通常のフォローアップはキューに入ります。キュー内のメッセージで **Steer** をクリックすると、そのフォローアップを実行中のターンに注入できます。
    - `/stop`（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）を入力すると、帯域外で中止します。
    - `chat.abort` は、そのセッションのすべてのアクティブな実行を中止するために `{ sessionKey }`（`runId` なし）をサポートします。

  </Accordion>
  <Accordion title="中止時の部分保持">
    - 実行が中止されると、部分的なアシスタントテキストが UI に表示されることがあります。
    - Gateway は、バッファリングされた出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化します。
    - 永続化されたエントリには中止メタデータが含まれるため、トランスクリプトの利用側は中止時の部分出力を通常の完了出力と区別できます。

  </Accordion>
</AccordionGroup>

## PWA インストールと Web Push

Control UI は `manifest.webmanifest` とサービスワーカーを同梱しているため、モダンブラウザーではスタンドアロン PWA としてインストールできます。Web Push により、タブやブラウザーウィンドウが開いていない場合でも、Gateway は通知でインストール済み PWA を起動できます。

OpenClaw の更新直後にページで**プロトコル不一致**が表示される場合は、まず `openclaw dashboard` でダッシュボードを開き直し、ページをハードリフレッシュします。それでも失敗する場合は、ダッシュボードオリジンのサイトデータを消去するか、プライベートブラウザーウィンドウでテストしてください。古いタブやブラウザーのサービスワーカーキャッシュにより、更新前の Control UI バンドルが新しい Gateway に対して実行され続けることがあります。

| サーフェス                                            | 動作内容                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA マニフェスト。到達可能になると、ブラウザーが「アプリをインストール」を提示します。 |
| `ui/public/sw.js`                                     | `push` イベントと通知クリックを処理するサービスワーカー。 |
| `push/vapid-keys.json`（OpenClaw 状態ディレクトリ配下） | Web Push ペイロードの署名に使われる、自動生成された VAPID キーペア。 |
| `push/web-push-subscriptions.json`                    | 永続化されたブラウザーサブスクリプションエンドポイント。 |

キーを固定したい場合（マルチホストデプロイ、シークレットローテーション、またはテスト用）は、Gateway プロセスの環境変数で VAPID キーペアをオーバーライドします。

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（デフォルトは `https://openclaw.ai`）

Control UI は、ブラウザーサブスクリプションの登録とテストに、これらのスコープゲート付き Gateway メソッドを使用します。

- `push.web.vapidPublicKey` — アクティブな VAPID 公開鍵を取得します。
- `push.web.subscribe` — `endpoint` と `keys.p256dh`/`keys.auth` を登録します。
- `push.web.unsubscribe` — 登録済みエンドポイントを削除します。
- `push.web.test` — 呼び出し元のサブスクリプションにテスト通知を送信します。

<Note>
Web Push は、iOS APNS リレーパス（リレー支援プッシュについては [設定](/ja-JP/gateway/configuration) を参照）および既存の `push.test` メソッドから独立しています。これらはネイティブモバイルのペアリングを対象とします。
</Note>

## ホスト埋め込み

アシスタントメッセージは、`[embed ...]` ショートコードを使ってホストされた Web コンテンツをインラインでレンダリングできます。iframe サンドボックスポリシーは `gateway.controlUi.embedSandbox` で制御されます。

<Tabs>
  <Tab title="strict">
    ホスト埋め込み内のスクリプト実行を無効にします。
  </Tab>
  <Tab title="scripts（デフォルト）">
    オリジン分離を維持しながらインタラクティブな埋め込みを許可します。これはデフォルトであり、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です。
  </Tab>
  <Tab title="trusted">
    より強い権限を意図的に必要とする同一サイト文書向けに、`allow-scripts` に加えて `allow-same-origin` を追加します。
  </Tab>
</Tabs>

例:

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
埋め込まれたドキュメントが本当に同一オリジン動作を必要とする場合にのみ、`trusted` を使用してください。ほとんどのエージェント生成ゲームやインタラクティブキャンバスでは、`scripts` のほうが安全な選択です。
</Warning>

絶対外部 `http(s)` 埋め込み URL は、デフォルトではブロックされたままです。意図的に `[embed url="https://..."]` でサードパーティページを読み込みたい場合は、`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## チャットメッセージ幅

グループ化されたチャットメッセージには、読みやすいデフォルトの最大幅が使用されます。ワイドモニター環境では、`gateway.controlUi.chatMessageMaxWidth` を設定することで、バンドル済み CSS にパッチを当てずに上書きできます。

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

この値はブラウザーに届く前に検証されます。サポートされる値には、`960px` や `82%` のような単純な長さとパーセンテージに加え、制約付きの `min(...)`、`max(...)`、`clamp(...)`、`calc(...)`、`fit-content(...)` 幅式が含まれます。

## Tailnet アクセス（推奨）

<Tabs>
  <Tab title="統合 Tailscale Serve（推奨）">
    Gateway を loopback に維持し、Tailscale Serve に HTTPS でプロキシさせます。

    ```bash
    openclaw gateway --tailscale serve
    ```

    開く先:

    - `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

    デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket Serve リクエストは Tailscale ID ヘッダー（`tailscale-user-login`）で認証できます。OpenClaw は `tailscale whois` で `x-forwarded-for` アドレスを解決し、それをヘッダーと照合することで ID を検証します。また、リクエストが Tailscale の `x-forwarded-*` ヘッダー付きで loopback に到達した場合にのみ受け入れます。ブラウザーデバイス ID を持つ Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復もスキップされます。デバイスなしのブラウザーとノードロール接続は、引き続き通常のデバイスチェックに従います。Serve トラフィックでも明示的な共有シークレット認証情報を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。そのうえで `gateway.auth.mode: "token"` または `"password"` を使用します。

    この非同期 Serve ID パスでは、同じクライアント IP と認証スコープに対する認証失敗は、レート制限書き込みの前に直列化されます。そのため、同じブラウザーからの同時の不正な再試行では、2 つの単純な不一致が並行して競合する代わりに、2 番目のリクエストで `retry later` が表示されることがあります。

    <Warning>
    トークンなし Serve 認証は、Gateway ホストが信頼されていることを前提にしています。そのホストで信頼できないローカルコードが実行される可能性がある場合は、トークン/パスワード認証を必須にしてください。
    </Warning>

  </Tab>
  <Tab title="tailnet にバインド + トークン">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    その後、次を開きます。

    - `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

    一致する共有シークレットを UI 設定に貼り付けます（`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

  </Tab>
</Tabs>

## 安全でない HTTP

プレーン HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、ブラウザーは **非セキュアコンテキスト** で実行され、WebCrypto をブロックします。デフォルトでは、OpenClaw はデバイス ID のない Control UI 接続を **ブロック** します。

ドキュメント化されている例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の安全でない HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` によるオペレーター Control UI 認証の成功
- 緊急回避用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使用するか、UI をローカルで開きます。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gateway ホスト上）

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

    - 非セキュア HTTP コンテキストで、localhost Control UI セッションがデバイス ID なしで進行できるようにします。
    - ペアリングチェックはバイパスしません。
    - リモート（localhost 以外）のデバイス ID 要件は緩和しません。

  </Accordion>
  <Accordion title="緊急回避専用">
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
    `dangerouslyDisableDeviceAuth` は Control UI のデバイス ID チェックを無効化し、重大なセキュリティ低下を招きます。緊急使用後は速やかに元に戻してください。
    </Warning>

  </Accordion>
  <Accordion title="信頼済みプロキシの注記">
    - 信頼済みプロキシ認証に成功すると、デバイス ID なしで **オペレーター** Control UI セッションを許可できます。
    - これはノードロール Control UI セッションには拡張されません。
    - 同一ホストの loopback リバースプロキシでも、信頼済みプロキシ認証は満たされません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

  </Accordion>
</AccordionGroup>

HTTPS セットアップのガイダンスについては、[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## コンテンツセキュリティポリシー

Control UI には厳格な `img-src` ポリシーが同梱されています。許可されるのは **同一オリジン** アセット、`data:` URL、ローカル生成の `blob:` URL のみです。リモート `http(s)` およびプロトコル相対画像 URL はブラウザーによって拒否され、ネットワークフェッチは発行されません。

実際には、これは次を意味します。

- 相対パス（例: `/avatars/<id>`）配下で提供されるアバターと画像は、UI が取得してローカル `blob:` URL に変換する認証付きアバタールートも含めて、引き続きレンダリングされます。
- インライン `data:image/...` URL は引き続きレンダリングされます（プロトコル内ペイロードに有用です）。
- Control UI によって作成されたローカル `blob:` URL は引き続きレンダリングされます。
- チャンネルメタデータによって出力されたリモートアバター URL は、Control UI のアバターヘルパーで取り除かれ、組み込みロゴ/バッジに置き換えられます。そのため、侵害された、または悪意のあるチャンネルが、オペレーターブラウザーから任意のリモート画像フェッチを強制することはできません。

この動作を得るために変更は不要です。常に有効で、設定できません。

## アバタールート認証

Gateway 認証が設定されている場合、Control UI アバターエンドポイントには API の他の部分と同じ Gateway トークンが必要です。

- `GET /avatar/<agentId>` は、認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は、同じルールの下でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（兄弟のアシスタントメディアルートと一致します）。これにより、それ以外は保護されているホストで、アバタールートがエージェント ID を漏えいすることを防ぎます。
- Control UI 自体は、アバター取得時に Gateway トークンをベアラーヘッダーとして転送し、認証済み blob URL を使用するため、画像はダッシュボード内で引き続きレンダリングされます。

Gateway 認証を無効にした場合（共有ホストでは推奨されません）、Gateway の他の部分と同様に、アバタールートも未認証になります。

## アシスタントメディアルート認証

Gateway 認証が設定されている場合、アシスタントのローカルメディアプレビューは 2 段階のルートを使用します。

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` には、通常の Control UI オペレーター認証が必要です。ブラウザーは可用性を確認するとき、Gateway トークンをベアラーヘッダーとして送信します。
- 成功したメタデータレスポンスには、その正確なソースパスにスコープされた短命の `mediaTicket` が含まれます。
- ブラウザーでレンダリングされる画像、音声、動画、ドキュメント URL は、アクティブな Gateway トークンやパスワードの代わりに `mediaTicket=<ticket>` を使用します。チケットは短時間で期限切れになり、別のソースを認可することはできません。

これにより、再利用可能な Gateway 認証情報を可視のメディア URL に入れずに、通常のメディアレンダリングをブラウザー標準のメディア要素と互換に保てます。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセット URL が必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別個の開発サーバー）:

```bash
pnpm ui:dev
```

その後、UI を Gateway WS URL（例: `ws://127.0.0.1:18789`）に向けます。

## 空白の Control UI ページ

ブラウザーが空白のダッシュボードを読み込み、DevTools に有用なエラーが表示されない場合、拡張機能または早期コンテンツスクリプトが JavaScript モジュールアプリの評価を妨げた可能性があります。静的ページには、起動後に `<openclaw-app>` が登録されていない場合に表示されるプレーン HTML のリカバリーパネルが含まれています。

ブラウザー環境を変更した後、パネルの **再試行** アクションを使用するか、次の確認後に手動で再読み込みします。

- すべてのページに注入する拡張機能、特に `<all_urls>` コンテンツスクリプトを持つ拡張機能を無効にします。
- プライベートウィンドウ、クリーンなブラウザープロファイル、または別のブラウザーを試します。
- Gateway を実行したままにし、ブラウザー変更後に同じダッシュボード URL を確認します。

## デバッグ/テスト: 開発サーバー + リモート Gateway

Control UI は静的ファイルです。WebSocket ターゲットは設定可能で、HTTP オリジンと異なっていても構いません。これは、Vite 開発サーバーをローカルで使いながら Gateway を別の場所で実行したい場合に便利です。

<Steps>
  <Step title="UI 開発サーバーを起動">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl 付きで開く">
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
  <Accordion title="注記">
    - `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
    - `gatewayUrl` 経由で完全な `ws://` または `wss://` エンドポイントを渡す場合は、ブラウザーがクエリ文字列を正しく解析できるように `gatewayUrl` 値を URL エンコードしてください。
    - 可能な限り、`token` は URL フラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログや Referer の漏えいを避けられます。従来の `?token=` クエリパラメーターも互換性のために一度だけインポートされますが、フォールバックとしてのみ使用され、ブートストラップ直後に取り除かれます。
    - `password` はメモリ内にのみ保持されます。
    - `gatewayUrl` が設定されている場合、UI は設定や環境の認証情報にフォールバックしません。`token`（または `password`）を明示的に指定してください。明示的な認証情報がない場合はエラーです。
    - Gateway が TLS（Tailscale Serve、HTTPS プロキシなど）の背後にある場合は、`wss://` を使用してください。
    - `gatewayUrl` は、クリックジャッキングを防ぐため、トップレベルウィンドウ（埋め込みではない）でのみ受け入れられます。
    - 公開の非 loopback Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定する必要があります（完全なオリジン）。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベート同一オリジン LAN/Tailnet 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
    - Gateway 起動時に、有効なランタイムバインドとポートから `http://localhost:<port>` や `http://127.0.0.1:<port>` などのローカルオリジンがシードされる場合がありますが、リモートブラウザーオリジンには引き続き明示的なエントリが必要です。
    - 厳密に制御されたローカルテストを除き、`gateway.controlUi.allowedOrigins: ["*"]` は使用しないでください。これは「使用しているホストに一致させる」ではなく、任意のブラウザーオリジンを許可することを意味します。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーオリジンフォールバックモードを有効にしますが、危険なセキュリティモードです。

  </Accordion>
</AccordionGroup>

例:

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
