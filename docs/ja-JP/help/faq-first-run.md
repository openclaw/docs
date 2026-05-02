---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行エラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回起動セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回実行時のセットアップ'
x-i18n:
    generated_at: "2026-05-02T22:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行のQ&A。日常的な操作、モデル、認証、セッション、
  トラブルシューティングについては、メインの[FAQ](/ja-JP/help/faq)を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="詰まっている場合に最速で抜け出す方法">
    **あなたのマシンを見られる**ローカルAIエージェントを使用してください。これは Discord で質問するよりはるかに効果的です。
    「詰まった」ケースの多くは、リモートの支援者が確認できない**ローカル設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールはリポジトリを読み取り、コマンドを実行し、ログを調べ、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正を手伝えます。hackable (git) インストールを使って、
    **完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw は **git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み取り、
    実行中の正確なバージョンについて推論できます。あとで安定版に戻したい場合は、
    `--install-method git` なしでインストーラーを再実行すればいつでも戻せます。

    ヒント: エージェントには修正を**計画して監督**（ステップごと）するよう依頼し、その後で
    必要なコマンドだけを実行してください。これにより変更を小さく保ち、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずはこれらのコマンドから始めてください（助けを求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    これらの役割:

    - `openclaw status`: gateway/agent の健全性と基本設定の簡単なスナップショット。
    - `openclaw models status`: provider 認証とモデルの可用性を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証して修復します。

    その他の便利なCLIチェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の60秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップし続けます。スキップ理由は何を意味しますか？">
    一般的な heartbeat スキップ理由:

    - `quiet-hours`: 設定された active-hours ウィンドウの外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーのみの足場しか含まない
    - `no-tasks-due`: `HEARTBEAT.md` タスクモードは有効だが、まだ期限になっているタスク間隔がない
    - `alerts-disabled`: heartbeat の表示がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の heartbeat 実行が
    完了した後にのみ進められます。スキップされた実行はタスクを完了済みとしてマークしません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法">
    リポジトリでは、ソースから実行し、オンボーディングを使用することを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードはUIアセットも自動的にビルドできます。オンボーディング後は、通常 Gateway をポート **18789** で実行します。

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
    ウィザードは、オンボーディング直後にクリーンな（トークン化されていない）ダッシュボードURLでブラウザを開き、サマリーにもリンクを出力します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシンで出力されたURLをコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ shared secret が設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: bind は loopback のままにし、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、identity headers が Control UI/WebSocket 認証を満たします（shared secret の貼り付け不要、信頼済み gateway ホストであることが前提）。HTTP APIs は、意図的に private-ingress `none` または trusted-proxy HTTP auth を使用しない限り、引き続き shared-secret 認証を必要とします。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth リミッターが記録する前に直列化されるため、2回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行（またはパスワード認証を設定）し、`http://<tailscale-ip>:18789/` を開いてから、ダッシュボード設定に一致する shared secret を貼り付けます。
    - **Identity-aware reverse proxy**: Gateway を信頼済み proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから proxy URL を開きます。同一ホストの loopback proxies には明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます。トンネル経由でも shared-secret 認証は適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けてください。

    bind モードと認証の詳細については、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec approval 設定が2つあるのはなぜですか？">
    それらは異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャンネルを exec approvals のネイティブ承認クライアントとして動作させます

    ホストの exec policy が引き続き実際の承認ゲートです。チャット設定は、承認
    プロンプトがどこに表示され、人がどう回答できるかだけを制御します。

    ほとんどのセットアップでは、**両方は不要**です。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` は共有パスを通じて動作します。
    - サポートされているネイティブチャンネルが approver を安全に推測できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、OpenClaw は DM-first のネイティブ承認を自動的に有効にします。
    - ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブUIが主経路です。agent は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示している場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な ops rooms にも転送する必要がある場合にのみ使用します。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発生元の room/topic に投稿し直したい場合にのみ使用します。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve` を使い、任意の `approvals.plugin` 転送を使い、一部のネイティブチャンネルだけがその上に plugin-approval-native 処理を保持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はよりリッチなチャンネル固有UX用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要な runtime は何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway では Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは個人利用に十分なものとして **512MB-1GB RAM**、**1 core**、約 **500MB**
    のディスクを挙げており、**Raspberry Pi 4 で実行可能**だと記載しています。

    余裕（ログ、メディア、他のサービス）が欲しい場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Pi/VPS で Gateway をホストし、local screen/camera/canvas やコマンド実行用に
    ラップトップ/スマートフォンの **nodes** をペアリングできます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか？">
    短く言うと、動作しますが、粗い部分は想定してください。

    - **64-bit** OS を使用し、Node >= 22 を保ってください。
    - ログを見て素早く更新できるように、**hackable (git) install** を優先してください。
    - channels/skills なしで始め、1つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM compatibility** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが hatch しません。どうすればいいですか？">
    その画面は、Gateway に到達でき、認証されていることに依存します。TUI も初回 hatch 時に
    "Wake up, my friend!" を自動送信します。この行が表示されて**返信がなく**、
    tokens が 0 のままなら、agent は実行されていません。

    1. Gateway を再起動します。

    ```bash
    openclaw gateway restart
    ```

    2. status と auth を確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも停止する場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が稼働していること、UI が
    正しい Gateway を指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーし、その後 Doctor を一度実行してください。これにより、
    **両方**の場所をコピーしている限り、bot を「まったく同じ」（memory、session history、auth、channel
    state）に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 旧マシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより config、auth profiles、WhatsApp creds、sessions、memory が保持されます。remote mode の場合は、
    gateway ホストが session store と workspace を所有することを忘れないでください。

    **重要:** ワークスペースだけを GitHub に commit/push している場合、バックアップされるのは
    **memory + bootstrap files** ですが、session history や auth は**含まれません**。それらは
    `~/.openclaw/` の下にあります（例: `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [Agent workspace](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭セクションが **Unreleased** とマークされている場合、その次の日付付き
    セクションが最新のリリース済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。無効化するか `docs.openclaw.ai` を allowlist に追加してから、再試行してください。
    ここで報告して、ブロック解除に協力してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    サイトにまだアクセスできない場合、ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータ版の違い">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tags** です:

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド

    通常、安定版リリースはまず **beta** に入り、その後、明示的な
    昇格ステップによって同じバージョンが `latest` に移されます。メンテナーは必要に応じて
    直接 `latest` に公開することもできます。そのため、昇格後はベータ版と安定版が
    **同じバージョン** を指すことがあります。

    変更内容を確認:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用のワンライナーと、ベータ版と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版はどうインストールしますか。また、ベータ版と dev の違いは何ですか?">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動する先頭（git）です。公開される場合は npm dist-tag `dev` を使用します。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [開発チャネル](/ja-JP/install/development-channels) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビットを試すにはどうすればよいですか?">
    2つの選択肢があります:

    1. **Dev チャネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **ハック可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    編集可能なローカルリポジトリが作成され、その後 git で更新できます。

    手動でクリーンにクローンしたい場合は、次を使用してください:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[開発チャネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どのくらいかかりますか?">
    目安:

    - **インストール:** 2〜5分
    - **オンボーディング:** 設定するチャネルやモデルの数に応じて5〜15分

    ハングした場合は、[インストーラーが停止している](#quick-start-and-first-run-setup)
    と、[詰まっています](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが停止していますか? もっと詳しいフィードバックを得るにはどうすればよいですか?">
    **詳細出力** 付きでインストーラーを再実行します:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きのベータ版インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    ハック可能な（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等コマンド:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示されます">
    Windows でよくある問題は2つあります:

    **1) npm エラー spawn git / git が見つからない**

    - **Git for Windows** をインストールし、`git` が PATH にあることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH にありません。
    - パスを確認します:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH を更新した後、PowerShell を閉じて開き直します。

    Windows で最もスムーズにセットアップしたい場合は、ネイティブ Windows ではなく **WSL2** を使用してください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語の文字化けが表示されます - どうすればよいですか?">
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

    その後、Gateway を再起動してコマンドを再試行します:

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡または報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした - より良い回答を得るにはどうすればよいですか?">
    **ハック可能な（git）インストール** を使用すると、完全なソースとドキュメントをローカルに持てます。そのうえで
    ボット（または Claude/Codex）に _そのフォルダーから_ 質問すれば、リポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [インストール](/ja-JP/install) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか?">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行します。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか?">
    どの Linux VPS でも動作します。サーバーにインストールし、SSH/Tailscale を使って Gateway にアクセスします。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか?">
    一般的なプロバイダー向けの **ホスティングハブ** を用意しています。1つ選んでガイドに従ってください:

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを1か所にまとめています）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの仕組み: **Gateway はサーバー上で実行** され、ノートPC/スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態 + ワークスペースは
    サーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングすると、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり
    ノートPCでコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか?">
    短い答え: **可能ですが、推奨されません**。更新フローでは
    Gateway が再起動される可能性があり（アクティブなセッションが切断されます）、
    クリーンな git checkout が必要になる場合や、確認を求められる場合があります。
    より安全なのは、オペレーターとしてシェルから更新を実行することです。

    CLI を使用します:

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

  <Accordion title="オンボーディングは実際には何をしますか?">
    `openclaw onboard` は推奨されるセットアップ手順です。**ローカルモード** では、次を順番に案内します:

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャネル Plugin）
    - **デーモンインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd ユーザーユニット）
    - **ヘルスチェック** と **skills** の選択

    設定されたモデルが不明または認証なしの場合にも警告します。

  </Accordion>

  <Accordion title="実行するには Claude や OpenAI のサブスクリプションが必要ですか?">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル** で実行できるため、データはデバイス上に留まります。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、これらのプロバイダーを認証するための任意の方法です。

    OpenClaw における Anthropic の実用的な区分は次のとおりです:

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この利用が再び許可されたと聞いており、Anthropic が新しいポリシーを公開しない限り、
      OpenClaw はこの連携での `claude -p` の利用を認可されたものとして扱います

    長期間稼働する Gateway ホストでは、Anthropic API キーの方が引き続き
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツールで明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション形式のオプションにも対応しています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか?">
    はい。

    Anthropic スタッフから OpenClaw 形式の Claude CLI 利用が再び許可されたと聞いているため、
    Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携での
    Claude サブスクリプション認証と `claude -p` の利用を認可されたものとして扱います。
    最も予測しやすいサーバー側セットアップが必要な場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）に対応していますか?">
    はい。

    Anthropic スタッフからこの利用が再び許可されたと聞いているため、Anthropic が新しい
    ポリシーを公開しない限り、OpenClaw はこの連携での Claude CLI の再利用と
    `claude -p` の利用を認可されたものとして扱います。

    Anthropic setup-token は、サポートされている OpenClaw のトークン経路として引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境または複数ユーザーのワークロードでは、Anthropic API キー認証の方が引き続き
    安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか?">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限** を使い切ったことを意味します。**Claude CLI** を
    使用している場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API キー** を
    使用している場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests`、そのリクエストは
    Anthropic の 1M コンテキストベータ（`context1m: true`）を使おうとしています。これは、認証情報が長コンテキスト課金の対象である場合（API キー課金、または Extra Usage が有効な
    OpenClaw Claude ログイン経路）にのみ機能します。

    ヒント: **フォールバックモデル**を設定すると、プロバイダーがレート制限中でも OpenClaw が返信を継続できます。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーがバンドルされています。AWS 環境マーカーが存在する場合、OpenClaw はストリーミング/テキストの Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとしてマージできます。そうでない場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効化するか、手動のプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理されたキーのフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップでは、`agentRuntime.id: "codex"` とともに
    `openai/gpt-5.5` を使用します。
    ChatGPT/Codex サブスクリプション認証に加えて、ネイティブ Codex アプリサーバー実行を使います。デフォルトの
    PI ランナー経由で Codex OAuth を使いたい場合にのみ
    `openai-codex/gpt-5.5` を使用します。直接の OpenAI API キーアクセスには、Codex ランタイムのオーバーライドなしで
    `openai/gpt-5.5` を使用します。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及するのはなぜですか？">
    `openai-codex` は ChatGPT/Codex OAuth 用のプロバイダーおよび認証プロファイル ID です。
    また、Codex OAuth 用の明示的な PI モデル接頭辞でもあります。

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション認証
    - `openai-codex/gpt-5.5` = PI 内の Codex OAuth ルート
    - Codex ランタイムのオーバーライドなしの `openai/gpt-5.5` = PI 内の直接 OpenAI API キールート
    - `openai-codex:...` = 認証プロファイル ID であり、モデル参照ではありません

    直接の OpenAI Platform 課金/制限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインしてください。ネイティブ Codex
    ランタイムでは、モデル参照を `openai/gpt-5.5` のままにし、
    `agentRuntime.id: "codex"` を設定します。`openai-codex/*` のモデル参照は PI
    実行にのみ使用してください。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか？">
    Codex OAuth は、OpenAI が管理するプラン依存のクォータウィンドウを使用します。実際には、
    両方が同じアカウントに紐づいている場合でも、それらの制限は ChatGPT のウェブサイト/アプリ体験と異なることがあります。

    OpenClaw は現在可視のプロバイダー使用量/クォータウィンドウを
    `openclaw models status` で表示できますが、ChatGPT web の権利を直接 API アクセスに作り替えたり正規化したりはしません。直接の OpenAI Platform
    課金/制限経路を使いたい場合は、API キーとともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth の使用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのように設定しますか？">
    Gemini CLI は `openclaw.json` 内のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    手順:

    1. `gemini` が `PATH` 上にあるよう、Gemini CLI をローカルにインストールします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使っても問題ありませんか？">
    通常は推奨されません。OpenClaw には大きなコンテキストと強い安全性が必要です。小さいカードは切り詰めや漏えいを起こします。どうしても使う必要がある場合は、ローカルで実行できる**最大の**モデルビルド（LM Studio）を実行し、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小型/量子化モデルはプロンプトインジェクションのリスクを高めます - [セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョン内に保つにはどうすればよいですか？">
    リージョン固定のエンドポイントを選択します。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストのオプションを提供しています。データをリージョン内に保つには、米国ホストのバリアントを選択してください。`models.mode: "merge"` を使用すれば、選択したリージョン指定プロバイダーを尊重しながらフォールバックを利用可能にしたまま、Anthropic/OpenAI も併せて一覧できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です - 常時稼働ホストとして購入する人もいますが、小規模な VPS、ホームサーバー、または Raspberry Pi クラスの機器でも動作します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使用してください - BlueBubbles サーバーは任意の Mac で動作し、Gateway は Linux など別の場所で実行できます。他の macOS 専用ツールを使いたい場合は、Gateway を Mac で実行するか、macOS ノードをペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか？">
    Messages にサインインした**何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません** -
    どの Mac でも動作します。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles) を使用してください**（推奨） - BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux など別の場所で実行できます。

    一般的なセットアップ:

    - Gateway を Linux/VPS で実行し、Messages にサインインした任意の Mac で BlueBubbles サーバーを実行します。
    - 最も単純な単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[ノード](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、それを MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **ノード**（コンパニオンデバイス）として接続できます。ノードは Gateway を実行しません - そのデバイス上の画面/カメラ/canvas や `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway（常時稼働）。
    - MacBook Pro が macOS アプリまたはノードホストを実行し、Gateway にペアリングします。
    - 確認するには `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、WhatsApp/Telegram なしの本番以外の Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram ユーザー ID**（数値）です。ボットのユーザー名ではありません。

    セットアップでは数値ユーザー ID のみを求めます。すでにレガシーな `@username` エントリが設定にある場合、`openclaw doctor --fix` がそれらの解決を試みることができます。

    より安全（サードパーティボットなし）:

    - ボットに DM し、その後 `openclaw logs --follow` を実行して `from.id` を確認します。

    公式 Bot API:

    - ボットに DM し、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を確認します。

    サードパーティ（プライバシーは低め）:

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が、異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**経由で可能です。各送信者の WhatsApp **DM**（ピア `kind: "direct"`、送信者 E.164 形式、例: `+15551234567`）を異なる `agentId` にバインドすると、それぞれの人が自分専用のワークスペースとセッションストアを得られます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを与え、その後、受信ルート（プロバイダーアカウントまたは特定のピア）を各エージェントにバインドします。設定例は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) にあります。[モデル](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルで `brew` によってインストールされたツールが解決されるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用中の brew プレフィックス）が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な (git) インストール:** 完全なソースチェックアウトで、編集可能です。コントリビューターに最適です。
      ビルドをローカルで実行し、コード/ドキュメントにパッチを当てることができます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリはありません。「とにかく実行する」用途に最適です。
      更新は npm dist-tag から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後で npm インストールと git インストールを切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使用します。
    これにより**データは削除されません** - OpenClaw のコードインストールだけが変更されます。
    状態（`~/.openclaw`）とワークスペース（`~/.openclaw/workspace`）は変更されません。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    まず計画されたモード切り替えをプレビューするには、`--dry-run` を追加します。アップデーターは
    Doctor のフォローアップを実行し、ターゲットチャネル向けに Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらのモードを強制できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノートパソコンと VPS のどちらで実行すべきですか？">
    短い答え: **24 時間 365 日の信頼性が必要なら、VPS を使用してください**。最小限の手間を重視し、スリープ/再起動を許容できるなら、ローカルで実行してください。

    **ノートパソコン（ローカル Gateway）**

    - **長所:** サーバー費用が不要、ローカルファイルへ直接アクセスできる、ライブのブラウザーウィンドウを使える。
    - **短所:** スリープやネットワーク切断で接続が切れる、OS 更新や再起動で中断される、常に起動しておく必要がある。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題がない、実行状態を維持しやすい。
    - **短所:** ヘッドレスで実行することが多い（スクリーンショットを使用）、リモートファイルアクセスのみ、更新には SSH が必要。

    **OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作する。実際のトレードオフは、**ヘッドレスブラウザー**か表示されるウィンドウかだけ。詳しくは [ブラウザー](/ja-JP/tools/browser) を参照。

    **推奨デフォルト:** 以前に Gateway の切断があった場合は VPS。Mac を能動的に使用していて、ローカルファイルアクセスや表示されるブラウザーでの UI 自動化が必要な場合は、ローカルが最適。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどの程度重要ですか？">
    必須ではないが、**信頼性と分離のために推奨**。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープや再起動による中断が少ない、権限が整理される、実行状態を維持しやすい。
    - **共有ノート PC/デスクトップ:** テストや能動的な使用にはまったく問題ないが、マシンがスリープまたは更新されると一時停止することを想定する。

    両方の利点を得たい場合は、専用ホストで Gateway を維持し、ノート PC をローカル画面/カメラ/exec ツール用の **Node** としてペアリングする。[Node](/ja-JP/nodes) を参照。
    セキュリティガイダンスについては、[セキュリティ](/ja-JP/gateway/security) を読む。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量。基本的な Gateway + 1 つのチャットチャネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 余裕を持たせるために 1〜2 vCPU、2GB RAM 以上（ログ、メディア、複数チャネル）。Node ツールとブラウザー自動化はリソースを多く消費する場合がある。

    OS: **Ubuntu LTS**（または最新の Debian/Ubuntu）を使用する。Linux インストールパスはそこで最もよくテストされている。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    可能。VM は VPS と同じように扱う: 常時稼働し、到達可能で、Gateway と有効にするチャネルに十分な
    RAM が必要。

    基本ガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、メディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別の最新の Debian/Ubuntu。

    Windows を使用している場合、**WSL2 が最も簡単な VM スタイルのセットアップ**で、ツール互換性も最も高い。
    [Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps) を参照。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、Gateway、セキュリティなど）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
