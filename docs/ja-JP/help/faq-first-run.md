---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーのサブスクリプションを選ぶ
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが停止する
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期の失敗'
title: 'FAQ: 初回実行セットアップ'
x-i18n:
    generated_at: "2026-04-25T18:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  クイックスタートと初回実行に関する Q&A です。日常的な操作、モデル、認証、セッション、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まりました。最速で抜け出す方法は？">
    **自分のマシンを見られる**ローカル AI エージェントを使ってください。これは Discord で質問するよりもはるかに効果的です。というのも、「行き詰まった」というケースのほとんどは、リモートの支援者では調査できない**ローカルの設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリを読み、コマンドを実行し、ログを調べ、マシンレベルのセットアップ（PATH、サービス、権限、認証ファイル）の修正を支援できます。hackable（git）インストールを使って、**完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、OpenClaw が**git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み、実行中の正確なバージョンについて推論できます。後で `--install-method git` なしでインストーラーを再実行すれば、いつでも stable に戻せます。

    ヒント: エージェントには、修正を**計画して監督**するよう依頼してください（ステップごとに）。そのうえで、必要なコマンドだけを実行します。こうすると変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue の作成や PR の送信をお願いします:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めてください（助けを求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: Gateway / エージェントの健全性と基本設定の簡単なスナップショット。
    - `openclaw models status`: プロバイダー認証とモデル可用性を確認します。
    - `openclaw doctor`: 一般的な設定 / 状態の問題を検証して修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    すぐに試せるデバッグ手順: [何か壊れているときの最初の 60 秒](#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [Install](/ja-JP/install)、[Installer flags](/ja-JP/install/installer)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある Heartbeat のスキップ理由:

    - `quiet-hours`: 設定された active-hours ウィンドウの外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけのひな形しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、タスク間隔のどれもまだ期限に達していない
    - `alerts-disabled`: Heartbeat の可視性がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプが進むのは実際の Heartbeat 実行が完了したあとだけです。
    スキップされた実行では、タスクは完了済みとしてマークされません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストール方法とセットアップ方法は？">
    このリポジトリでは、ソースから実行し、オンボーディングを使う方法を推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットを自動でビルドすることもできます。オンボーディング後は、通常、ポート **18789** で Gateway を実行します。

    ソースから（コントリビューター / 開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールしていない場合は、`pnpm openclaw onboard` で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くには？">
    ウィザードは、オンボーディング直後にクリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、概要にもそのリンクを表示します。そのタブは開いたままにしてください。起動しなかった場合は、同じマシン上で表示された URL をコピーして貼り付けてください。
  </Accordion>

  <Accordion title="localhost とリモートで、ダッシュボードの認証はどう違いますか？">
    **localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンの参照元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの参照元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - 共有シークレットがまだ設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: バインドは loopback のままにし、`openclaw gateway --tailscale serve` を実行して、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、ID ヘッダーが Control UI / WebSocket 認証を満たします（共有シークレットの貼り付け不要、信頼された Gateway ホストを前提）。ただし、HTTP API は、意図的に private-ingress `none` または trusted-proxy HTTP auth を使わない限り、引き続き共有シークレット認証が必要です。
      同じクライアントからの誤った Serve 認証試行が同時に発生した場合、失敗認証リミッターが記録する前に直列化されるため、2 回目の失敗した再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）、`http://<tailscale-ip>:18789/` を開く、その後ダッシュボード設定に一致する共有シークレットを貼り付けます。
    - **ID 認識型リバースプロキシ**: Gateway を非 loopback の trusted proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定し、その後プロキシ URL を開きます。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開きます。トンネル越しでも共有シークレット認証は適用されるため、求められたら設定済みのトークンまたはパスワードを貼り付けてください。

    バインドモードと認証の詳細は [Dashboard](/ja-JP/web/dashboard) および [Web surfaces](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec approval の設定が 2 つあるのはなぜですか？">
    それぞれ制御するレイヤーが異なります。

    - `approvals.exec`: 承認プロンプトをチャットの宛先へ転送する
    - `channels.<channel>.execApprovals`: そのチャネルを exec approval 用のネイティブ承認クライアントとして動作させる

    ホスト側の exec ポリシーが依然として実際の承認ゲートです。チャット設定は、承認プロンプトをどこに表示するか、そして人がどう応答できるかだけを制御します。

    ほとんどのセットアップでは、**両方は不要**です。

    - チャットがすでにコマンドと返信をサポートしているなら、同じチャット内の `/approve` は共有パス経由で動作します。
    - サポートされるネイティブチャネルが approver を安全に推定できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM-first のネイティブ承認を自動で有効にします。
    - ネイティブの承認カード / ボタンが利用可能な場合、そのネイティブ UI が主要な経路です。ツール結果がチャット承認は利用できない、または手動承認だけが唯一の経路だと示した場合にのみ、エージェントは手動の `/approve` コマンドを含めるべきです。
    - プロンプトを他のチャットや明示的な ops room にも転送する必要がある場合にのみ、`approvals.exec` を使います。
    - 承認プロンプトを元のルーム / トピックにも投稿したい場合にのみ、`channels.<channel>.execApprovals.target: "channel"` または `"both"` を使います。
    - Plugin の承認はさらに別です。デフォルトでは同じチャット内の `/approve` を使い、任意で `approvals.plugin` 転送を使い、一部のネイティブチャネルだけがその上に plugin 承認ネイティブ処理を維持します。

    要するに、転送はルーティング用、ネイティブクライアント設定はより豊かなチャネル固有 UX 用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway には Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用なら **512MB-1GB RAM**、**1 コア**、約 **500MB** のディスクで十分とされており、**Raspberry Pi 4 で動作可能**と記載されています。

    もう少し余裕が欲しい場合（ログ、メディア、他のサービス）、**2GB を推奨**しますが、
    これは厳密な最低要件ではありません。

    ヒント: 小型の Pi / VPS で Gateway をホストし、ローカル画面 / カメラ / canvas やコマンド実行のために、ノート PC / 電話で **Node** をペアリングできます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi へのインストールで何かコツはありますか？">
    要するに、動きますが、多少の粗さはあると思ってください。

    - **64-bit** OS を使い、Node は 22 以上を維持してください。
    - ログを見たり素早く更新したりできるよう、**hackable（git）インストール**を推奨します。
    - チャネル / Skills なしで始めて、あとから 1 つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まります / オンボーディングが hatch しません。どうすればいいですか？">
    この画面は、Gateway に到達できて認証も通ることに依存しています。TUI は最初の hatch 時に
    「Wake up, my friend!」も自動送信します。この行が表示されているのに**返信がなく**、
    トークンが 0 のままなら、エージェントは一度も実行されていません。

    1. Gateway を再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. 状態と認証を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも止まる場合は、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gateway がリモートにある場合は、トンネル / Tailscale 接続が有効で、UI が正しい Gateway を向いていることを確認してください。[Remote access](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="セットアップを新しいマシン（Mac mini）に移行して、オンボーディングをやり直さずに済ませられますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーしてから、Doctor を 1 回実行してください。これにより、**両方**の場所をコピーする限り、ボットを「まったく同じ状態」（メモリ、セッション履歴、認証、チャネル状態）で維持できます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモートモードの場合、セッションストアとワークスペースを所有するのは gateway host であることを忘れないでください。

    **重要:** ワークスペースだけを GitHub に commit / push しても、バックアップされるのは
    **メモリ + ブートストラップファイル**だけで、**セッション履歴や認証**は含まれません。これらは
    `~/.openclaw/` 配下にあります（例: `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [Migrating](/ja-JP/install/migrating)、[ディスク上での保存場所](#where-things-live-on-disk)、
    [Agent workspace](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンで何が新しいかはどこで見られますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭セクションが **Unreleased** とマークされている場合は、次の日付付きセクションが最新のリリース版です。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs / その他のセクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。これを無効にするか、`docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    こちらで報告して、ブロック解除にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントは GitHub にもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tag** です。

    - `latest` = stable
    - `beta` = テスト用の早期ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格ステップによって同じバージョンが `latest` に移されます。必要に応じて、メンテナーが
    直接 `latest` に公開することもできます。そのため、昇格後には beta と stable が**同じバージョン**を指すことがあります。

    何が変わったかを見るには:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと、beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta バージョンをインストールする方法と、beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag の `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動する先頭（git）で、公開されると npm dist-tag の `dev` を使います。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [Development channels](/ja-JP/install/development-channels) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のものを試すにはどうすればいいですか？">
    方法は 2 つあります。

    1. **Dev チャネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチへ切り替わり、ソースから更新されます。

    2. **Hackable install（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これで編集可能なローカルリポジトリが手に入り、その後は git 経由で更新できます。

    手動でクリーンな clone を行いたい場合は、次を使ってください。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[Development channels](/ja-JP/install/development-channels)、
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらいかかりますか？">
    おおよその目安:

    - **Install:** 2〜5 分
    - **オンボーディング:** 設定するチャネル / モデルの数に応じて 5〜15 分

    止まった場合は、[インストーラーが止まる](#quick-start-and-first-run-setup)
    と、[行き詰まりました](#quick-start-and-first-run-setup) の高速デバッグ手順を使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まります。より多くのフィードバックを得るには？">
    **詳細出力**付きでインストーラーを再実行してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付き beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    hackable（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等手順:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグがありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows で git not found や openclaw not recognized と表示される">
    Windows でよくある問題は 2 つあります。

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH にあることを確認してください。
    - PowerShell を閉じて開き直し、その後インストーラーを再実行してください。

    **2) インストール後に openclaw is not recognized と表示される**

    - npm のグローバル bin フォルダーが PATH にありません。
    - 次のパスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` 接尾辞は不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH を更新したら、PowerShell を閉じて開き直してください。

    Windows で最もスムーズにセットアップしたい場合は、ネイティブ Windows ではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします。どうすればいいですか？">
    これは通常、ネイティブ Windows シェルでのコンソールコードページ不一致です。

    症状:

    - `system.run` / `exec` の出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShell での簡単な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gateway を再起動してコマンドを再試行してください。

    ```powershell
    openclaw gateway restart
    ```

    それでも最新の OpenClaw で再現する場合は、次で追跡 / 報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした。よりよい回答を得るには？">
    **hackable（git）インストール**を使って、ソースとドキュメント一式をローカルに置き、そのフォルダーから
    ボット（または Claude/Codex）に質問してください。そうすれば、リポジトリを読んで正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするには？">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行してください。

    - Linux の最短手順 + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするには？">
    どの Linux VPS でも動作します。サーバーにインストールし、その後 SSH / Tailscale で Gateway にアクセスします。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド / VPS のインストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめた**ホスティングハブ**があります。1 つ選んでガイドに従ってください。

    - [VPS hosting](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で実行**され、ノート PC / 電話から
    Control UI（または Tailscale / SSH）経由でアクセスします。状態とワークスペースは
    サーバー上にあるため、ホストを単一の正とみなし、バックアップしてください。

    ローカル画面 / カメラ / canvas へのアクセスや、Gateway をクラウドに置いたまま
    ノート PC 上でコマンドを実行するために、そのクラウド Gateway に **Node**（Mac/iOS/Android/headless）
    をペアリングできます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    Nodes: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨しません**。更新フローは Gateway を再起動することがあり
    （その場合、アクティブなセッションが切れます）、クリーンな git checkout が必要になる可能性があり、
    確認を求めることもあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

    CLI を使ってください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    エージェントから自動化しなければならない場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングでは実際に何をしますか？">
    `openclaw onboard` は推奨セットアップ手順です。**ローカルモード**では次を案内します。

    - **モデル / 認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース**の場所 + ブートストラップファイル
    - **Gateway 設定**（bind / port / auth / tailscale）
    - **チャネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャネル Plugin）
    - **デーモンインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定済みモデルが不明、または認証が不足している場合には警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル**で実行できるため、データを自分のデバイスに保持できます。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、それらのプロバイダーを認証するための任意の方法です。

    OpenClaw での Anthropic について、実際の区分は次のとおりです。

    - **Anthropic API key**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude subscription auth**: Anthropic スタッフが、
      この利用は再び許可されていると伝えており、Anthropic が新しい
      ポリシーを公開しない限り、OpenClaw はこの統合における `claude -p`
      の使用を認可済みとして扱っています

    長期間稼働する gateway host では、Anthropic API キーの方が依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツール向けに明示的にサポートされています。

    OpenClaw は、その他のホスト型サブスクリプション形式のオプションとして
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan** もサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [Local models](/ja-JP/gateway/local-models)、[Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使えますか？">
    はい。

    Anthropic スタッフは、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えているため、
    Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude subscription auth と `claude -p` の使用を
    この統合に対して認可済みとして扱います。最も予測しやすいサーバー側セットアップが必要なら、
    代わりに Anthropic API キーを使ってください。

  </Accordion>

  <Accordion title="Claude subscription auth（Claude Pro または Max）はサポートしていますか？">
    はい。

    Anthropic スタッフは、この利用は再び許可されていると伝えているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、
    Claude CLI の再利用と `claude -p` の使用をこの統合に対して認可済みとして扱います。

    Anthropic setup-token も引き続きサポートされる OpenClaw のトークン経路として利用できますが、利用可能な場合、OpenClaw は現在 Claude CLI の再利用と `claude -p` を優先します。
    本番運用やマルチユーザーのワークロードでは、Anthropic API キー認証の方が依然として
    より安全で予測しやすい選択です。OpenClaw でその他のサブスクリプション形式のホスト型
    オプションが必要な場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および [GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic の quota / rate limit** を使い切ったことを意味します。
    **Claude CLI** を使っている場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。
    **Anthropic API key** を使っている場合は、Anthropic Console
    で使用量 / 課金を確認し、必要に応じて上限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキスト beta（`context1m: true`）を使おうとしています。これは、
    その認証情報が長文コンテキスト課金の対象である場合にのみ動作します（API キー課金、または
    Extra Usage が有効な OpenClaw Claude-login パス）。

    ヒント: **フォールバックモデル**を設定すると、プロバイダーがレート制限中でも OpenClaw は応答を続けられます。
    [Models](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)
    を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には同梱の **Amazon Bedrock (Converse)** プロバイダーがあります。AWS の env マーカーが存在する場合、OpenClaw はストリーミング / テキスト用 Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとしてマージできます。そうでない場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動でプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。マネージドキーのフローを使いたい場合は、Bedrock の前段に OpenAI 互換プロキシを置くのも有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートしています。デフォルトの PI ランナー経由で Codex OAuth を使う場合は
    `openai-codex/gpt-5.5` を使用してください。直接 OpenAI API キーでアクセスする場合は
    `openai/gpt-5.5` を使用してください。GPT-5.5 は、`openai-codex/gpt-5.5` による
    subscription / OAuth、または `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"` による
    ネイティブ Codex app-server 実行も利用できます。
    [Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="なぜ OpenClaw はまだ openai-codex に言及するのですか？">
    `openai-codex` は ChatGPT / Codex OAuth 用のプロバイダーおよび auth profile id です。
    また、Codex OAuth 用の明示的な PI モデル接頭辞でもあります。

    - `openai/gpt-5.5` = PI での現在の直接 OpenAI API キー経路
    - `openai-codex/gpt-5.5` = PI での Codex OAuth 経路
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = ネイティブ Codex app-server 経路
    - `openai-codex:...` = モデル参照ではなく auth profile id

    直接 OpenAI Platform の課金 / 制限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT / Codex の subscription auth を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインし、
    PI 実行では `openai-codex/*` のモデル参照を使用してください。

  </Accordion>

  <Accordion title="なぜ Codex OAuth の上限は ChatGPT web と異なることがあるのですか？">
    Codex OAuth は、OpenAI 管理のプラン依存 quota window を使用します。実際には、
    同じアカウントに紐付いていても、それらの上限は ChatGPT の Web / アプリ体験と異なる場合があります。

    OpenClaw は、現在見えているプロバイダーの使用量 / quota window を
    `openclaw models status` に表示できますが、ChatGPT Web の
    entitlement を直接 API アクセス向けに作り出したり正規化したりはしません。直接 OpenAI Platform の
    課金 / 制限経路が必要な場合は、API キー付きで `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI subscription auth（Codex OAuth）はサポートしていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) subscription OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール / ワークフローでの subscription OAuth 利用を
    明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定すればよいですか？">
    Gemini CLI は、`openclaw.json` の client id や secret ではなく、**Plugin 認証フロー**を使います。

    手順:

    1. `gemini` が `PATH` に入るように Gemini CLI をローカルにインストールする
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化する: `openclaw plugins enable google`
    3. ログインする: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway host で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定する

    これにより、OAuth トークンは gateway host 上の認証プロファイルに保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="ローカルモデルは気軽なチャット用途に問題ありませんか？">
    通常はいいえ。OpenClaw は大きなコンテキストと強力な安全性を必要とするため、小さなモデルは切り捨てや漏れを起こします。どうしても使うなら、ローカルで実行できる**最大の**モデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小さい / 量子化モデルは prompt injection リスクを高めます。詳しくは [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定リージョン内に保つには？">
    リージョン固定のエンドポイントを選んでください。OpenRouter は MiniMax、Kimi、GLM 向けに US ホスト版オプションを提供しています。データをリージョン内に保つには US-hosted バリアントを選択してください。`models.mode: "merge"` を使えば、選択したリージョン固定プロバイダーを尊重しつつ、Anthropic / OpenAI も併記してフォールバックを利用可能なままにできます。
  </Accordion>

  <Accordion title="これをインストールするのに Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux で動作します（Windows は WSL2 経由）。Mac mini は任意です。常時稼働ホストとして購入する人もいますが、小さな VPS、ホームサーバー、または Raspberry Pi 級のマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**のためだけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles サーバーは任意の Mac で動作し、Gateway は Linux や別の場所で動作できます。ほかの macOS 専用ツールが必要なら、Gateway を Mac 上で実行するか、macOS Node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、[Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか？">
    Messages にサインインした **何らかの macOS デバイス**が必要です。**Mac mini である必要はなく**、
    任意の Mac で構いません。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux や別の場所で動作できます。

    よくある構成:

    - Gateway は Linux / VPS 上で動かし、BlueBubbles サーバーは Messages にサインインした任意の Mac 上で動かす。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてをその Mac 上で動かす。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、MacBook Pro から接続できますか？">
    はい。**Mac mini が Gateway を実行**し、MacBook Pro は
    **Node**（コンパニオンデバイス）として接続できます。Nodes は Gateway を実行しません。代わりに、そのデバイス上の screen / camera / canvas や `system.run` などの追加機能を提供します。

    よくあるパターン:

    - Gateway は Mac mini 上（常時稼働）。
    - MacBook Pro は macOS アプリまたは node host を実行し、Gateway にペアリングする。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使う。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した Gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、WhatsApp / Telegram なしの非本番 Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram user ID**（数値）です。ボットの username ではありません。

    セットアップでは数値の user ID のみを受け付けます。設定内にレガシーの `@username` エントリがすでにある場合は、`openclaw doctor --fix` で解決を試みることができます。

    より安全な方法（サードパーティーボット不要）:

    - 自分のボットに DM を送り、その後 `openclaw logs --follow` を実行して `from.id` を読む。

    公式 Bot API:

    - 自分のボットに DM を送り、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読む。

    サードパーティー利用（プライバシーはやや低い）:

    - `@userinfobot` または `@getidsbot` に DM を送る。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が 1 つの WhatsApp 番号を、それぞれ別の OpenClaw インスタンスで使えますか？">
    はい。**multi-agent ルーティング**で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者の E.164 形式、例 `+15551234567`）を異なる `agentId` にバインドすれば、各人が専用のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送られ、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。multi-agent ルーティングを使ってください。各エージェントに独自のデフォルトモデルを設定し、受信ルート（プロバイダーアカウントまたは特定の peer）を各エージェントにバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。[Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Linux で Homebrew は使えますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。簡単なセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw を systemd 経由で実行する場合は、非ログインシェルでも `brew` でインストールしたツールを解決できるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または自分の brew prefix）を含めてください。
    最近のビルドでは、Linux の systemd サービスで一般的なユーザー bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`, `~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="hackable git install と npm install の違い">
    - **Hackable（git）install:** 完全なソースチェックアウトで、編集可能、コントリビューターに最適です。
      ローカルでビルドを実行でき、コード / ドキュメントにパッチを当てられます。
    - **npm install:** グローバル CLI インストールで、リポジトリはなく、「とにかく実行したい」用途に最適です。
      更新は npm dist-tag から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとから npm install と git install を切り替えられますか？">
    はい。もう一方の形式をインストールしてから Doctor を実行すると、gateway service が新しい entrypoint を指すようになります。
    これで**データは削除されません**。変更されるのは OpenClaw コードのインストールだけです。状態
    （`~/.openclaw`）とワークスペース（`~/.openclaw/workspace`）はそのまま残ります。

    npm から git へ:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git から npm へ:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor は gateway service の entrypoint 不一致を検出し、現在のインストールに合わせて service 設定を書き換えることを提案します（自動化では `--repair` を使用）。

    バックアップのヒント: [バックアップ戦略](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノート PC と VPS のどちらで実行すべきですか？">
    短い答え: **24 時間 365 日の信頼性が必要なら VPS を使ってください**。最小の手間を重視し、スリープや再起動を許容できるならローカル実行でも構いません。

    **ノート PC（ローカル Gateway）**

    - **長所:** サーバー費用不要、ローカルファイルへ直接アクセス可能、ブラウザーウィンドウが見える。
    - **短所:** スリープ / ネットワーク断で切断、OS 更新 / 再起動で中断、常に起動しておく必要がある。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題なし、稼働維持が容易。
    - **短所:** 多くはヘッドレス運用（スクリーンショットを使用）、ファイルアクセスはリモートのみ、更新時は SSH が必要。

    **OpenClaw 固有の注意:** WhatsApp / Telegram / Slack / Mattermost / Discord はすべて VPS 上で問題なく動作します。実際のトレードオフは **ヘッドレスブラウザー** か可視ウィンドウか、という点だけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に gateway の切断があったなら VPS。ローカルは、Mac をアクティブに使っていて、ローカルファイルアクセスや可視ブラウザーでの UI 自動化が欲しいときに最適です。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで動かすことはどれくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨**されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ / 再起動による中断が少ない、権限が整理しやすい、稼働維持が容易。
    - **共用のノート PC / デスクトップ:** テストやアクティブ利用にはまったく問題ありませんが、マシンのスリープや更新時に一時停止が起こることがあります。

    両方の利点を取りたい場合は、Gateway は専用ホストに置き、ノート PC をローカルの screen / camera / exec ツール用の **Node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティガイダンスについては、[Security](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="最小 VPS 要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャネルなら:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB のディスク。
    - **推奨:** 余裕のために 1〜2 vCPU、2GB RAM 以上（ログ、メディア、複数チャネル）。Node ツールやブラウザー自動化はリソースを多く消費することがあります。

    OS は **Ubuntu LTS**（または任意の最新 Debian/Ubuntu）を使ってください。Linux のインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を動かせますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にしたチャネルを動かすのに十分な
    RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを動かす場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS またはその他の最新 Debian/Ubuntu。

    Windows の場合、**WSL2 が最も簡単な VM 風セットアップ**で、ツール互換性も最も高いです。
    [Windows](/ja-JP/platforms/windows)、[VPS hosting](/ja-JP/vps) を参照してください。
    VM 上で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、Gateway、Security など）
- [Install overview](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [Troubleshooting](/ja-JP/help/troubleshooting)
