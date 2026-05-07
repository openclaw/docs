---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行エラー
    - 認証とプロバイダーのサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回起動時のセットアップ'
x-i18n:
    generated_at: "2026-05-07T13:18:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行のQ&A。日常的な操作、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行の設定

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で解決する方法">
    **自分のマシンを確認できる**ローカルAIエージェントを使用してください。これは Discord で質問するよりはるかに効果的です。ほとんどの「行き詰まった」ケースは、リモートの支援者が確認できない**ローカル設定または環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンドの実行、ログの確認、マシンレベルの
    設定（PATH、サービス、権限、認証ファイル）の修正支援ができます。ハック可能な（git）インストールで
    **完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw は **git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み取り、
    実行中の正確なバージョンについて推論できます。あとで安定版に戻したい場合は、
    `--install-method git` なしでインストーラーを再実行すれば切り替えられます。

    ヒント: エージェントには修正を**計画して監督**（段階的に）させ、その後で必要なコマンドだけを実行してください。これにより変更を小さく保ち、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずはこれらのコマンドから始めてください（支援を求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの動作:

    - `openclaw status`: gateway/agent の健全性と基本設定の簡易スナップショット。
    - `openclaw models status`: プロバイダー認証とモデルの利用可否を確認します。
    - `openclaw doctor`: よくある設定/状態の問題を検証し、修復します。

    その他の便利なCLI確認: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    簡易デバッグループ: [何かが壊れているときの最初の60秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の外にあります
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在しますが、空行/ヘッダーのみの足場しか含まれていません
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効ですが、まだ期限に達したタスク間隔がありません
    - `alerts-disabled`: すべての heartbeat 表示が無効です（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行ではタスクは完了扱いになりません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールして設定する推奨方法">
    リポジトリでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動でビルドできます。オンボーディング後は、通常 Gateway をポート **18789** で実行します。

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールがない場合は、`pnpm openclaw onboard` で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くには？">
    ウィザードはオンボーディング直後に、クリーンな（トークン化されていない）ダッシュボードURLでブラウザーを開き、概要にもリンクを出力します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシンで出力されたURLをコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットが設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: バインドは loopback のままにし、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、IDヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付け不要、信頼済み gateway ホストを前提）。HTTP API は、意図的に private-ingress `none` または trusted-proxy HTTP 認証を使わない限り、引き続き shared-secret 認証が必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth リミッターに記録される前に直列化されるため、2回目の不正リトライですでに `retry later` が表示されることがあります。
    - **Tailnet バインド**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）と、`http://<tailscale-ip>:18789/` が開き、その後で一致する共有シークレットをダッシュボード設定に貼り付けます。
    - **ID対応リバースプロキシ**: Gateway を信頼済みプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシURLを開きます。同一ホストの loopback プロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから、`http://127.0.0.1:18789/` を開きます。トンネル経由でも shared-secret 認証は適用されます。求められた場合は設定済みのトークンまたはパスワードを貼り付けてください。

    バインドモードと認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用の exec 承認設定が2つあるのはなぜですか？">
    それぞれ異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャンネルを exec 承認用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、引き続き実際の承認ゲートです。チャット設定は、承認
    プロンプトがどこに表示されるか、また人がどう回答できるかだけを制御します。

    ほとんどの設定では、両方は**不要**です。

    - チャットがすでにコマンドと返信に対応している場合、同じチャットの `/approve` は共有パス経由で機能します。
    - 対応するネイティブチャンネルが承認者を安全に推定できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、OpenClaw は DM 優先のネイティブ承認を自動で有効化するようになりました。
    - ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI が主要パスです。エージェントは、ツール結果がチャット承認を利用できない、または手動承認が唯一のパスであると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ `approvals.exec` を使用してください。
    - 承認プロンプトを送信元のルーム/トピックに投稿し直したいことが明示的な場合にのみ、`channels.<channel>.execApprovals.target: "channel"` または `"both"` を使用してください。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve` を使い、任意で `approvals.plugin` 転送を使います。また一部のネイティブチャンネルだけが、その上に plugin-approval-native 処理を維持します。

    短く言うと、転送はルーティング用、ネイティブクライアント設定はよりリッチなチャンネル固有UX用です。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Bun は Gateway には**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 core**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で実行できる**と記載されています。

    余裕（ログ、メディア、他のサービス）が必要な場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Pi/VPS で Gateway をホストし、ローカル画面/カメラ/canvas やコマンド実行のために
    ラップトップ/スマートフォン上の**ノード**をペアリングできます。[ノード](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのコツはありますか？">
    短く言うと、動作しますが、粗い部分があることは想定してください。

    - **64-bit** OS を使用し、Node >= 22 を維持してください。
    - ログを確認し、素早く更新できるように、**ハック可能な（git）インストール**を推奨します。
    - チャンネル/skills なしで開始し、その後1つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM compatibility** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが hatch しません。どうすればよいですか？">
    その画面は Gateway に到達でき、認証されていることに依存します。TUI も最初の hatch 時に
    "Wake up, my friend!" を自動送信します。その行が表示されて**返信がなく**、
    トークンが 0 のままなら、エージェントは実行されていません。

    1. Gateway を再起動します。

    ```bash
    openclaw gateway restart
    ```

    2. ステータスと認証を確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでもハングする場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が有効で、UI が正しい
    Gateway を指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、新しいマシン（Mac mini）へ設定を移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーしてから、Doctor を一度実行してください。これにより、**両方**の場所をコピーしている限り、
    bot を「まったく同じ」状態（メモリ、セッション履歴、認証、チャンネル状態）に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモートモードの場合は、gateway ホストがセッションストアとワークスペースを所有することを忘れないでください。

    **重要:** ワークスペースだけを GitHub に commit/push している場合、バックアップされるのは
    **メモリ + bootstrap ファイル**ですが、**セッション履歴や認証**は含まれません。それらは
    `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭のセクションが **Unreleased** とマークされている場合は、次の日付付き
    セクションが最新のリリース済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/その他のセクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。これを無効にするか、`docs.openclaw.ai` を allowlist に追加してから再試行してください。
    ブロック解除のため、こちらから報告に協力してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合は、ドキュメントが GitHub にミラーされています。
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータの違い">
    **安定版** と **ベータ** は別々のコードラインではなく、**npm dist-tags** です。

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド

    通常、安定版リリースはまず **ベータ** に入ってから、明示的な昇格手順によって同じバージョンが `latest` に移動されます。メンテナーは必要に応じて `latest` へ直接公開することもできます。そのため、昇格後はベータと安定版が **同じバージョン** を指すことがあります。

    変更内容はこちらを参照してください。
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと、ベータと開発版の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版のインストール方法と、ベータと開発版の違いは何ですか？">
    **ベータ** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **開発版** は `main` の移動する先頭（git）です。公開される場合は、npm dist-tag `dev` を使います。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [開発チャンネル](/ja-JP/install/development-channels) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビルドを試すにはどうすればよいですか？">
    2 つの選択肢があります。

    1. **開発チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **編集可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより編集可能なローカルリポジトリが作成され、その後 git で更新できます。

    手動でクリーンにクローンしたい場合は、次を使います。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらい時間がかかりますか？">
    目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 設定するチャンネルやモデルの数に応じて 5〜15 分

    固まった場合は、[インストーラーが止まる](#quick-start-and-first-run-setup)
    と [行き詰まった場合](#quick-start-and-first-run-setup) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まります。もっとフィードバックを得るにはどうすればよいですか？">
    **詳細出力** を有効にしてインストーラーを再実行します。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きのベータインストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    編集可能な（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等手順:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示されます">
    Windows でよくある問題は 2 つあります。

    **1) npm エラー spawn git / git が見つからない**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH 上にありません。
    - パスを確認します。

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。多くのシステムでは `%AppData%\npm` です）。
    - PATH 更新後、PowerShell を閉じて開き直します。

    最もスムーズな Windows セットアップにしたい場合は、ネイティブ Windows ではなく **WSL2** を使用してください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします。どうすればよいですか？">
    これは通常、ネイティブ Windows シェルでのコンソールコードページの不一致です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けとして表示される
    - 同じコマンドが別のターミナルプロファイルでは正常に表示される

    PowerShell での簡単な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後 Gateway を再起動し、コマンドを再試行します。

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡または報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しません。より良い回答を得るにはどうすればよいですか？">
    **編集可能な（git）インストール** を使用して、完全なソースとドキュメントをローカルに用意し、そのフォルダーからボット（または Claude/Codex）に質問してください。リポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [インストール](/ja-JP/install) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか？">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行します。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか？">
    任意の Linux VPS で動作します。サーバーにインストールし、SSH/Tailscale を使って Gateway にアクセスします。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS のインストールガイドはどこにありますか？">
    一般的なプロバイダー向けの **ホスティングハブ** を用意しています。1 つ選んでガイドに従ってください。

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で実行** され、ラップトップ/電話から Control UI（または Tailscale/SSH）経由でアクセスします。状態 + ワークスペースはサーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングすると、Gateway をクラウドに置いたまま、ローカルの画面/カメラ/キャンバスにアクセスしたり、ラップトップ上でコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨しません**。更新フローでは Gateway が再起動されることがあり（アクティブなセッションが切断されます）、クリーンな git checkout が必要になる場合や、確認を求められる場合があります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

    CLI を使います。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    エージェントから自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何をしますか？">
    `openclaw onboard` は推奨されるセットアップ手順です。**ローカルモード** では次を順に設定します。

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャンネル Plugin）
    - **デーモンインストール**（macOS の LaunchAgent、Linux/WSL2 の systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    設定されたモデルが不明、または認証が不足している場合も警告します。

  </Accordion>

  <Accordion title="これを実行するのに Claude または OpenAI のサブスクリプションは必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または **ローカル専用モデル** で実行できるため、データをデバイス上に保持できます。サブスクリプション（Claude Pro/Max または OpenAI Codex）は、それらのプロバイダーを認証するための任意の方法です。

    OpenClaw における Anthropic の実用上の分け方は次のとおりです。

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから、この使用は再び許可されたと伝えられており、OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合における `claude -p` の使用を認可済みとして扱います

    長期稼働する Gateway ホストでは、Anthropic API キーの方が依然としてより予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部ツール向けに明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション風オプションにも対応しています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使えますか？">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されたと伝えられているため、OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合における Claude サブスクリプション認証と `claude -p` の使用を認可済みとして扱います。最も予測しやすいサーバーサイドセットアップにしたい場合は、代わりに Anthropic API キーを使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）に対応していますか？">
    はい。

    Anthropic スタッフから、この使用は再び許可されたと伝えられているため、OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合における Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。

    Anthropic setup-token は引き続きサポートされている OpenClaw のトークン経路として利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境や複数ユーザーのワークロードでは、Anthropic API キー認証の方が依然としてより安全で予測しやすい選択です。OpenClaw で他のサブスクリプション風ホスト型オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限** を使い切ったことを意味します。**Claude CLI** を使っている場合は、ウィンドウがリセットされるまで待つか、プランをアップグレードしてください。**Anthropic API キー** を使っている場合は、Anthropic Console で使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に:
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキストベータ (`context1m: true`) を使用しようとしています。これは、使用している
    認証情報がロングコンテキスト課金の対象である場合（API キー課金、または
    Extra Usage が有効な OpenClaw Claude ログイン経路）にのみ機能します。

    ヒント: **fallback model** を設定すると、provider がレート制限されている間も OpenClaw が応答を続けられます。
    [Models](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** provider がバンドルされています。AWS env marker が存在する場合、OpenClaw は streaming/text Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` provider としてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動の provider エントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。管理されたキーのフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップでは、
    `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用します:
    ChatGPT/Codex サブスクリプション認証に加え、ネイティブ Codex アプリサーバー実行です。
    デフォルトの Codex ランタイムを通じて Codex OAuth を使いたい場合にのみ
    `openai-codex/gpt-5.5` を使用してください。直接の OpenAI API キーアクセスは、非 agent の
    OpenAI API surface、および順序付きの `openai-codex` API キープロファイル経由の agent model で引き続き利用できます。
    [Model providers](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及するのはなぜですか？">
    `openai-codex` は ChatGPT/Codex OAuth 用の provider および auth-profile id です。
    古い config では、model prefix としても使われていました:

    - `openai/gpt-5.5` = agent turn でネイティブ Codex runtime を使う ChatGPT/Codex サブスクリプション認証
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` によって修復されるレガシー model route
    - `openai/gpt-5.5` と順序付きの `openai-codex` API キープロファイル = OpenAI agent model の API キー認証
    - `openai-codex:...` = auth profile id であり、model ref ではありません

    直接の OpenAI Platform 課金/制限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインします。model ref は
    `openai/gpt-5.5` のままにしてください。`openai-codex/*` model ref は、
    `openclaw doctor --fix` によって書き換えられるレガシー config です。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか？">
    Codex OAuth は OpenAI 管理の、プランに依存するクォータウィンドウを使用します。実際には、
    同じアカウントに紐づいている場合でも、これらの制限は ChatGPT website/app の体験と異なることがあります。

    OpenClaw は現在可視の provider 使用量/クォータウィンドウを
    `openclaw models status` で表示できますが、ChatGPT web の権利を直接 API アクセスに作り出したり正規化したりはしません。直接の OpenAI Platform
    課金/制限経路を使いたい場合は、API キー付きで `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートします。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth の使用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのようにセットアップしますか？">
    Gemini CLI は `openclaw.json` 内の client id や secret ではなく、**plugin auth flow** を使用します。

    手順:

    1. `gemini` が `PATH` に入るように Gemini CLI をローカルにインストールします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効にします: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルト model: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway host で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth token は gateway host 上の auth profile に保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカル model は適していますか？">
    通常は適していません。OpenClaw には大きなコンテキストと強力な安全性が必要です。小さなカードでは切り詰められ、漏えいします。どうしても必要な場合は、ローカルで実行できる**最大**の model build（LM Studio）を使用し、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小さい model や量子化された model はプロンプトインジェクションのリスクを高めます - [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="hosted model のトラフィックを特定のリージョンに保つにはどうすればよいですか？">
    リージョン固定の endpoint を選びます。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストのオプションを提供しています。データをリージョン内に保つには、米国ホストの variant を選択してください。`models.mode: "merge"` を使えば、選択したリージョン指定 provider を尊重しつつ、fallback を利用可能な状態に保ったまま Anthropic/OpenAI も並べて一覧できます。
  </Accordion>

  <Accordion title="これをインストールするために Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です - 常時稼働 host として購入する人もいますが、小さな VPS、ホームサーバー、または Raspberry Pi クラスの機器でも動作します。

    Mac が必要なのは **macOS 専用ツール** の場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使用してください - BlueBubbles server は任意の Mac で動作し、Gateway は Linux や他の場所で実行できます。他の macOS 専用ツールを使いたい場合は、Gateway を Mac で実行するか、macOS node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、[Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか？">
    Messages にサインイン済みの **何らかの macOS device** が必要です。Mac mini である必要は**ありません** -
    任意の Mac で動作します。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles) を使用してください**（推奨）- BlueBubbles server は macOS で動作し、Gateway は Linux や他の場所で実行できます。

    一般的なセットアップ:

    - Gateway を Linux/VPS で実行し、Messages にサインイン済みの任意の Mac で BlueBubbles server を実行します。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてを Mac で実行します。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、自分の MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **node**（コンパニオンデバイス）として接続できます。Node は Gateway を実行しません - その device 上で screen/camera/canvas や `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini（常時稼働）で Gateway。
    - MacBook Pro が macOS app または node host を実行し、Gateway とペアリング。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram で runtime bug が見られます。
    安定した gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、WhatsApp/Telegram なしの非本番 gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram user ID**（数値）です。bot username ではありません。

    セットアップでは数値の user ID のみを求めます。すでに legacy の `@username` エントリが config にある場合、`openclaw doctor --fix` で解決を試みることができます。

    より安全（サードパーティ bot なし）:

    - bot に DM してから `openclaw logs --follow` を実行し、`from.id` を読み取ります。

    公式 Bot API:

    - bot に DM してから `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読み取ります。

    サードパーティ（プライバシーは低め）:

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数人が別々の OpenClaw instance で 1 つの WhatsApp 番号を使用できますか？">
    はい、**multi-agent routing** 経由で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、sender E.164 形式の `+15551234567` など）を別々の `agentId` にバインドすると、各人が自分専用の workspace と session store を得られます。返信は引き続き**同じ WhatsApp account** から送信され、DM access control（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp account ごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」agent と「コーディング用 Opus」agent を実行できますか？'>
    はい。multi-agent routing を使用します。各 agent に独自の default model を指定し、inbound route（provider account または特定の peer）をそれぞれの agent にバインドします。config 例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。[Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートします。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログイン shell でも `brew` でインストールされた tool が解決されるよう、service PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用している brew prefix）が含まれていることを確認してください。
    最近の build では、Linux systemd service 上で一般的な user bin dir（例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="hackable git install と npm install の違い">
    - **Hackable (git) install:** 完全な source checkout で、編集可能です。contributor に最適です。
      build をローカルで実行し、code/docs を patch できます。
    - **npm install:** global CLI install で、repo はありません。「とにかく実行したい」場合に最適です。
      update は npm dist-tag から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後で npm install と git install を切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は `openclaw update --channel ...` を使用します。
    これは**データを削除しません** - OpenClaw の code install だけを変更します。
    state（`~/.openclaw`）と workspace（`~/.openclaw/workspace`）はそのまま残ります。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    予定されている mode switch を先に preview するには `--dry-run` を追加します。updater は
    Doctor follow-up を実行し、target channel の plugin source を更新し、
    `--no-restart` を渡さない限り gateway を再起動します。

    installer でもどちらかの mode を強制できます:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [Backup strategy](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway は laptop と VPS のどちらで実行すべきですか？">
    短い答え: **24/7 の信頼性が必要なら VPS を使用してください**。最小限の手間でよく、sleep/restart を許容できるなら、ローカルで実行してください。

    **ノートPC (ローカル Gateway)**

    - **長所:** サーバー費用がかからない、ローカルファイルへ直接アクセスできる、表示されているブラウザーウィンドウを使える。
    - **短所:** スリープやネットワーク切断 = 接続解除、OS 更新や再起動で中断される、起動したままにしておく必要がある。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ノートPCのスリープ問題がない、稼働を維持しやすい。
    - **短所:** 多くの場合ヘッドレスで実行する (スクリーンショットを使う)、リモートファイルアクセスのみ、更新には SSH が必要。

    **OpenClaw 固有の注記:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。実際のトレードオフは **ヘッドレスブラウザー** か表示されるウィンドウかだけです。[ブラウザー](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に gateway の接続解除があった場合は VPS。Mac をアクティブに使っていて、ローカルファイルアクセスや表示されるブラウザーでの UI 自動化が必要な場合はローカルが適しています。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどの程度重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨**されます。

    - **専用ホスト (VPS/Mac mini/Pi):** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、稼働を維持しやすい。
    - **共有ノートPC/デスクトップ:** テストやアクティブな利用にはまったく問題ありませんが、マシンがスリープしたり更新されたりすると一時停止が発生します。

    両方の利点が必要な場合は、Gateway を専用ホストに置き、ノートPCをローカル画面/カメラ/実行ツール用の **ノード** としてペアリングします。[ノード](/ja-JP/nodes) を参照してください。
    セキュリティガイダンスについては、[セキュリティ](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 余裕を持たせるために 1-2 vCPU、2GB RAM 以上 (ログ、メディア、複数チャネル)。Node ツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS** (または最新の Debian/Ubuntu) を使用してください。Linux のインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にするチャネルに十分な
    RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、メディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別の最新の Debian/Ubuntu。

    Windows を使っている場合、**WSL2 が最も簡単な VM 形式のセットアップ**であり、ツール互換性も最も優れています。
    [Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps) を参照してください。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ (モデル、セッション、gateway、セキュリティ、その他)
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
