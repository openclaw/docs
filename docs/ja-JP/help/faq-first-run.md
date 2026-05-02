---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行時のセットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回セットアップ'
x-i18n:
    generated_at: "2026-05-02T04:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回起動の Q&A。日常的な操作、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回起動セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まった場合に最速で解決する方法">
    **自分のマシンを確認できる**ローカル AI エージェントを使ってください。Discord で質問するよりはるかに効果的です。
    ほとんどの「行き詰まった」ケースは、リモートの支援者が確認できない**ローカル設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールはリポジトリを読み取り、コマンドを実行し、ログを確認し、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正を支援できます。ハック可能な（git）インストールで
    **完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これは OpenClaw を **git チェックアウトから**インストールするため、エージェントはコードとドキュメントを読み取り、
    実行中の正確なバージョンについて推論できます。あとで安定版に戻すには、
    `--install-method git` なしでインストーラーを再実行します。

    ヒント: エージェントには修正を**計画して監督**（ステップごと）するよう依頼し、必要なコマンドだけを実行してください。
    これにより変更が小さくなり、監査しやすくなります。

    本物のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください。
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まず次のコマンドから始めてください（支援を求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: gateway/agent の健全性と基本設定の簡単なスナップショット。
    - `openclaw models status`: プロバイダー認証とモデル可用性を確認します。
    - `openclaw doctor`: よくある設定/状態の問題を検証し、修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の 60 秒](#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の範囲外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけのスキャフォールドしか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効だが、どのタスク間隔もまだ期限に達していない
    - `alerts-disabled`: すべての Heartbeat 表示が無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行では、タスクは完了としてマークされません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストールとセットアップ方法">
    リポジトリでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動的にビルドできます。オンボーディング後は通常、Gateway をポート **18789** で実行します。

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールがない場合は、`pnpm openclaw onboard` 経由で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くにはどうすればよいですか？">
    ウィザードはオンボーディング直後に、クリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、サマリーにもリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、表示された URL を同じマシンでコピー/ペーストしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するにはどうすればよいですか？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められたら、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - shared secret がまだ設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: bind を loopback のままにし、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、ID ヘッダーが Control UI/WebSocket 認証を満たします（shared secret の貼り付けは不要、信頼された gateway ホストを前提）。HTTP API では、private-ingress `none` または trusted-proxy HTTP 認証を意図的に使わない限り、shared-secret 認証が引き続き必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth リミッターに記録される前に直列化されるため、2 回目の不正な再試行ですでに `retry later` が表示される場合があります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）し、`http://<tailscale-ip>:18789/` を開いて、ダッシュボード設定に一致する shared secret を貼り付けます。
    - **ID 対応リバースプロキシ**: Gateway を信頼されたプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます。トンネル越しでも shared-secret 認証は適用されます。求められたら設定済みのトークンまたはパスワードを貼り付けてください。

    bind モードと認証の詳細は、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が 2 つあるのはなぜですか？">
    それらは異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャット送信先に転送します
    - `channels.<channel>.execApprovals`: そのチャンネルを exec 承認のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、依然として実際の承認ゲートです。チャット設定は、承認
    プロンプトがどこに表示されるか、そして人がどう回答できるかだけを制御します。

    ほとんどのセットアップでは、**両方**は必要ありません。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` は共有パス経由で機能します。
    - サポートされているネイティブチャンネルが承認者を安全に推定できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、OpenClaw は DM 優先のネイティブ承認を自動的に有効にします。
    - ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI が主な経路です。エージェントは、ツール結果でチャット承認が利用できない、または手動承認が唯一の経路だと示された場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ使用します。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発信元のルーム/トピックへ明示的に投稿したい場合にのみ使用します。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve` を使い、任意で `approvals.plugin` 転送を使います。一部のネイティブチャンネルだけが、その上に plugin-approval-native 処理を維持します。

    短く言えば、転送はルーティング用、ネイティブクライアント設定はチャンネル固有のよりリッチな UX 用です。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway に Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 コア**、約 **500MB**
    のディスクで十分で、**Raspberry Pi 4 で実行可能**と記載しています。

    余裕（ログ、メディア、他のサービス）が欲しい場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小型の Pi/VPS で Gateway をホストし、ローカル画面/カメラ/canvas やコマンド実行のために
    ラップトップ/スマートフォンの**ノード**をペアリングできます。[ノード](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか？">
    短く言えば、動作しますが、粗い部分があることを想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持してください。
    - ログを確認してすばやく更新できるよう、**ハック可能な（git）インストール**を推奨します。
    - チャンネル/Skills なしで始め、1 つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが開始されません。どうすればよいですか？">
    その画面は、Gateway に到達可能で認証済みであることに依存します。TUI も最初の hatch 時に
    「Wake up, my friend!」を自動送信します。**返信なし**でその行が表示され、
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

    3. それでも停止する場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が有効で、UI が正しい Gateway を指していることを確認してください。
    [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーしてから、Doctor を一度実行してください。これにより、
    **両方**の場所をコピーしている限り、ボットを「まったく同じ」状態（メモリ、セッション履歴、認証、チャンネル
    状態）に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモートモードの場合は、
    gateway ホストがセッションストアとワークスペースを所有することを忘れないでください。

    **重要:** ワークスペースだけを GitHub にコミット/プッシュしている場合、バックアップされるのは
    **メモリ + ブートストラップファイル**であり、セッション履歴や認証は**含まれません**。それらは
    `~/.openclaw/` 配下にあります（例: `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは上部にあります。最上部のセクションが **Unreleased** と表示されている場合、次の日付付き
    セクションが最新のリリース済みバージョンです。エントリは **Highlights**、**Changes**、
    **Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。
    それを無効にするか、`docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    ブロック解除にご協力ください。こちらから報告できます: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータの違い">
    **安定版** と **ベータ** は、別々のコードラインではなく **npm dist-tags** です。

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド

    通常、安定版リリースはまず **beta** に入り、その後明示的な
    昇格手順によって同じバージョンが `latest` に移動されます。メンテナーは必要に応じて
    `latest` へ直接公開することもできます。そのため、昇格後はベータと安定版が
    **同じバージョン** を指す場合があります。

    変更内容を見る:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用のワンライナーと、ベータと開発版の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版をインストールするにはどうすればよく、ベータと開発版の違いは何ですか?">
    **ベータ** は npm dist-tag `beta` です (昇格後は `latest` と一致する場合があります)。
    **開発版** は `main` の移動する先頭 (git) です。公開される場合は、npm dist-tag `dev` を使います。

    ワンライナー (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [開発チャネル](/ja-JP/install/development-channels) と [インストーラーのフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビットを試すにはどうすればよいですか?">
    2つの選択肢があります。

    1. **開発チャネル (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    これは `main` ブランチに切り替え、ソースから更新します。

    2. **編集可能なインストール (インストーラーサイトから):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集可能なローカルリポジトリが作成され、その後 git 経由で更新できます。

    手動でクリーンに clone したい場合は、次を使います。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[開発チャネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらい時間がかかりますか?">
    目安:

    - **インストール:** 2-5分
    - **オンボーディング:** 設定するチャネル/モデルの数に応じて5-15分

    ハングする場合は、[インストーラーが止まる](#quick-start-and-first-run-setup) と
    [詰まった場合](#quick-start-and-first-run-setup) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まります。より詳しいフィードバックを得るにはどうすればよいですか?">
    **詳細出力** 付きでインストーラーを再実行します。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きのベータインストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    編集可能な (git) インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) での同等の方法:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [インストーラーのフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示される">
    よくある Windows の問題は2つあります。

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に含まれていることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH に含まれていません。
    - パスを確認します。

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します (Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です)。
    - PATH を更新した後、PowerShell を閉じて開き直します。

    最もスムーズな Windows セットアップにしたい場合は、ネイティブ Windows ではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします。どうすればよいですか?">
    これは通常、ネイティブ Windows シェルでのコンソールコードページの不一致です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けとして表示される
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

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

    最新の OpenClaw でもまだ再現する場合は、次で追跡/報告してください。

    - [イシュー #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした。よりよい回答を得るにはどうすればよいですか?">
    **編集可能な (git) インストール** を使うと、完全なソースとドキュメントをローカルに置けます。その後、
    ボット (または Claude/Codex) に _そのフォルダーから_ 質問すれば、リポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [インストール](/ja-JP/install) と [インストーラーのフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか?">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行します。

    - Linux の短い手順 + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか?">
    どの Linux VPS でも動作します。サーバーにインストールし、その後 SSH/Tailscale を使って Gateway に到達します。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか?">
    一般的なプロバイダーをまとめた **ホスティングハブ** を用意しています。1つ選んでガイドに従ってください。

    - [VPS ホスティング](/ja-JP/vps) (すべてのプロバイダーを1か所に集約)
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で実行され**、ノートPC/スマートフォンから
    Control UI (または Tailscale/SSH) 経由でアクセスします。状態 + ワークスペースは
    サーバー上に存在するため、そのホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード** (Mac/iOS/Android/headless) をそのクラウド Gateway にペアリングすると、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり、
    ノートPC上でコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自身を更新させることはできますか?">
    短い答え: **可能ですが、推奨しません**。更新フローは
    Gateway を再起動する場合があり (アクティブなセッションが切断されます)、
    クリーンな git checkout が必要になることがあり、
    確認を求める場合もあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

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

  <Accordion title="オンボーディングは実際に何をしますか?">
    `openclaw onboard` は推奨されるセットアップ経路です。**ローカルモード** では、次を順に案内します。

    - **モデル/認証のセットアップ** (プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション)
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定** (bind/port/auth/tailscale)
    - **チャネル** (WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャネル Plugin)
    - **デーモンインストール** (macOS では LaunchAgent、Linux/WSL2 では systemd ユーザーユニット)
    - **ヘルスチェック** と **Skills** の選択

    設定されたモデルが不明な場合や認証が不足している場合にも警告します。

  </Accordion>

  <Accordion title="これを実行するために Claude または OpenAI のサブスクリプションは必要ですか?">
    いいえ。OpenClaw は **API キー** (Anthropic/OpenAI/その他) または
    **ローカル専用モデル** で実行できるため、データをデバイス上に保持できます。サブスクリプション (Claude
    Pro/Max または OpenAI Codex) は、それらのプロバイダーを認証するための任意の方法です。

    OpenClaw での Anthropic については、実務上の分け方は次のとおりです。

    - **Anthropic API キー**: 通常の Anthropic API 請求
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この利用は再び許可されていると伝えられており、OpenClaw は Anthropic が新しい
      ポリシーを公開しない限り、この統合での `claude -p`
      利用を認可済みとして扱います

    長期間稼働する Gateway ホストでは、Anthropic API キーの方が依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツールで明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション形式のオプションにも対応しています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使えますか?">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられているため、
    OpenClaw は Anthropic が新しいポリシーを公開しない限り、
    この統合での Claude サブスクリプション認証と `claude -p` 利用を認可済みとして扱います。
    最も予測しやすいサーバー側セットアップにしたい場合は、代わりに Anthropic API キーを使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証 (Claude Pro または Max) をサポートしていますか?">
    はい。

    Anthropic スタッフから、この利用は再び許可されていると伝えられているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合での
    Claude CLI 再利用と `claude -p` 利用を認可済みとして扱います。

    Anthropic setup-token は、サポートされる OpenClaw トークン経路として引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI 再利用と `claude -p` を優先します。
    本番環境や複数ユーザーのワークロードでは、Anthropic API キー認証の方が依然として
    安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか?">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限** を使い切ったことを意味します。
    **Claude CLI** を使っている場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。
    **Anthropic API キー** を使っている場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキストベータ (`context1m: true`) を使おうとしています。これは、
    認証情報が長コンテキスト請求の対象である場合 (API キー請求、または
    Extra Usage が有効になっている OpenClaw Claude ログイン経路) にのみ機能します。

    ヒント: **フォールバックモデル**を設定すると、プロバイダーがレート制限中でも OpenClaw は返信を続けられます。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか?">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーがバンドルされています。AWS 環境マーカーが存在する場合、OpenClaw はストリーミング/テキストの Bedrock カタログを自動検出し、暗黙的な `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動でプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理されたキーのフローを使いたい場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか?">
    OpenClaw は OAuth (ChatGPT サインイン) 経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップでは、
    `agentRuntime.id: "codex"` とともに `openai/gpt-5.5` を使用します:
    ChatGPT/Codex サブスクリプション認証に加え、ネイティブ Codex アプリサーバー実行です。デフォルトの
    PI ランナー経由で Codex OAuth を使いたい場合のみ
    `openai-codex/gpt-5.5` を使用します。直接の OpenAI API キーアクセスには、
    Codex ランタイムのオーバーライドなしで `openai/gpt-5.5` を使用します。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及するのはなぜですか?">
    `openai-codex` は ChatGPT/Codex OAuth のプロバイダーおよび認証プロファイル ID です。
    これは Codex OAuth の明示的な PI モデルプレフィックスでもあります:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ネイティブ Codex ランタイムによる ChatGPT/Codex サブスクリプション認証
    - `openai-codex/gpt-5.5` = PI 内の Codex OAuth ルート
    - Codex ランタイムのオーバーライドなしの `openai/gpt-5.5` = PI 内の直接 OpenAI API キールート
    - `openai-codex:...` = 認証プロファイル ID、モデル参照ではありません

    直接の OpenAI Platform の課金/制限パスを使いたい場合は、
    `OPENAI_API_KEY` を設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインします。ネイティブ Codex
    ランタイムでは、モデル参照を `openai/gpt-5.5` のままにして、
    `agentRuntime.id: "codex"` を設定します。`openai-codex/*` モデル参照は PI
    実行でのみ使用してください。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか?">
    Codex OAuth は OpenAI 管理の、プラン依存のクォータウィンドウを使用します。実際には、
    同じアカウントに紐づいている場合でも、それらの制限は ChatGPT ウェブサイト/アプリの体験と異なることがあります。

    OpenClaw は `openclaw models status` で現在表示可能なプロバイダーの使用量/クォータウィンドウを表示できますが、
    ChatGPT-web の権利を直接 API アクセスとして作り出したり正規化したりはしません。直接の OpenAI Platform
    の課金/制限パスを使いたい場合は、API キーとともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証 (Codex OAuth) はサポートしていますか?">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth 利用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのように設定しますか?">
    Gemini CLI は **Plugin 認証フロー**を使用し、`openclaw.json` 内のクライアント ID やシークレットは使用しません。

    手順:

    1. `gemini` が `PATH` 上にあるように、Gemini CLI をローカルにインストールします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使ってもよいですか?">
    通常はいいえ。OpenClaw には大きなコンテキストと強力な安全性が必要です。小さなカードは切り詰められ、漏えいします。どうしても必要な場合は、ローカルで実行できる**最大の**モデルビルド (LM Studio) を実行し、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小型/量子化モデルはプロンプトインジェクションのリスクを高めます - [セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョン内に保つにはどうすればよいですか?">
    リージョン固定のエンドポイントを選択します。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストの選択肢を公開しています。データをリージョン内に保つには、米国ホストのバリアントを選択します。`models.mode: "merge"` を使用すれば、選択したリージョン指定プロバイダーを尊重しながら、フォールバックを利用可能なままにして Anthropic/OpenAI をこれらと並べて一覧表示できます。
  </Accordion>

  <Accordion title="これをインストールするために Mac Mini を購入する必要がありますか?">
    いいえ。OpenClaw は macOS または Linux (Windows は WSL2 経由) で動作します。Mac mini は任意です - 常時稼働ホストとして購入する人もいますが、小さな VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles) (推奨) を使用してください - BlueBubbles サーバーは任意の Mac で動作し、Gateway は Linux などで実行できます。他の macOS 専用ツールを使いたい場合は、Gateway を Mac で実行するか、macOS ノードをペアリングします。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか?">
    Messages にサインインした**何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません** -
    どの Mac でも動作します。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles) を使用してください** (推奨) - BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux などで実行できます。

    一般的なセットアップ:

    - Gateway を Linux/VPS で実行し、BlueBubbles サーバーを Messages にサインインした任意の Mac で実行します。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[ノード](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を購入した場合、MacBook Pro に接続できますか?">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **ノード** (コンパニオンデバイス) として接続できます。ノードは Gateway を実行しません - そのデバイス上で画面/カメラ/キャンバスや `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway (常時稼働)。
    - MacBook Pro が macOS アプリまたはノードホストを実行し、Gateway にペアリングします。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか?">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、WhatsApp/Telegram を使わない非本番 Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか?">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram ユーザー ID** (数値) です。ボットのユーザー名ではありません。

    セットアップでは数値のユーザー ID のみを求めます。設定に既存のレガシー `@username` エントリがある場合、`openclaw doctor --fix` で解決を試みることができます。

    より安全 (サードパーティボットなし):

    - ボットに DM してから、`openclaw logs --follow` を実行し、`from.id` を読み取ります。

    公式 Bot API:

    - ボットに DM してから、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読み取ります。

    サードパーティ (プライバシーは低め):

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか?">
    はい、**マルチエージェントルーティング**経由で可能です。各送信者の WhatsApp **DM** (peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など) を別々の `agentId` にバインドすると、各ユーザーが自身のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御 (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか?'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを与え、受信ルート (プロバイダーアカウントまたは特定のピア) を各エージェントにバインドします。設定例は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) にあります。[モデル](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか?">
    はい。Homebrew は Linux (Linuxbrew) をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールしたツールが解決されるように、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin` (または使用中の brew プレフィックス) が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ (例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`) も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な (git) インストール:** 完全なソースチェックアウトで、編集可能。コントリビューターに最適です。
      ローカルでビルドを実行し、コード/ドキュメントにパッチを当てられます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリは不要。「とにかく実行する」用途に最適です。
      更新は npm dist-tags から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか?">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使用します。
    これは**データを削除しません** - OpenClaw コードのインストールだけを変更します。
    状態 (`~/.openclaw`) とワークスペース (`~/.openclaw/workspace`) はそのまま残ります。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    予定されているモード切り替えを先にプレビューするには、`--dry-run` を追加します。アップデーターは
    Doctor のフォローアップを実行し、対象チャネルの Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらのモードも強制できます:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はラップトップと VPS のどちらで実行すべきですか?">
    短い答え: **24/7 の信頼性が必要なら VPS を使用してください**。最小限の手間で、スリープ/再起動を許容できるなら、ローカルで実行します。

    **ラップトップ (ローカル Gateway)**

    - **利点:** サーバー費用なし、ローカルファイルへ直接アクセス、ライブブラウザーウィンドウ。
    - **欠点:** スリープ/ネットワーク切断 = 切断、OS 更新/再起動で中断、起動状態を維持する必要があります。

    **VPS / クラウド**

    - **メリット:** 常時稼働、安定したネットワーク、ノートパソコンのスリープ問題がない、稼働を維持しやすい。
    - **デメリット:** ヘッドレスで実行することが多い（スクリーンショットを使用）、リモートファイルアクセスのみ、更新には SSH が必要。

    **OpenClaw 固有の注記:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。唯一の実質的なトレードオフは、**ヘッドレスブラウザー**か表示されるウィンドウかです。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    **推奨デフォルト:** 以前に Gateway の切断があった場合は VPS。Mac をアクティブに使用していて、ローカルファイルアクセスや表示されるブラウザーでの UI 自動化が必要な場合は、ローカルが最適です。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどれくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨されます**。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、稼働を維持しやすい。
    - **共有ノートパソコン/デスクトップ:** テストやアクティブな使用にはまったく問題ありませんが、マシンがスリープまたは更新されると一時停止が発生することを想定してください。

    両方の利点を得たい場合は、Gateway を専用ホストに置き、ノートパソコンをローカル画面/カメラ/実行ツール用の**ノード**としてペアリングします。[ノード](/ja-JP/nodes)を参照してください。
    セキュリティガイダンスについては、[セキュリティ](/ja-JP/gateway/security)を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャンネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 余裕（ログ、メディア、複数チャンネル）のために 1-2 vCPU、2GB RAM 以上。Node ツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS**（または現代的な Debian/Ubuntu）を使用してください。Linux のインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にするチャンネルに十分な
    RAM が必要です。

    ベースラインガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャンネル、ブラウザー自動化、またはメディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別の現代的な Debian/Ubuntu。

    Windows を使用している場合、**WSL2 が最も簡単な VM 形式のセットアップ**で、ツールの
    互換性も最も高くなります。[Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps)を参照してください。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、Gateway、セキュリティ、その他）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
