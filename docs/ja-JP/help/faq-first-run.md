---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回実行時のセットアップ'
x-i18n:
    generated_at: "2026-05-10T19:38:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行の Q&A。日常的な運用、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で抜け出す方法">
    **自分のマシンを見られる**ローカル AI エージェントを使ってください。Discord で質問するよりもはるかに効果的です。
    ほとんどの「行き詰まった」ケースは、リモートの支援者が確認できない
    **ローカル設定または環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンドの実行、ログの確認、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正支援ができます。ハック可能な（git）インストールで
    **完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これは OpenClaw を **git チェックアウトから**インストールするため、エージェントはコードとドキュメントを読み、
    実行中の正確なバージョンについて推論できます。後でいつでも、`--install-method git` なしでインストーラーを再実行すれば
    stable に戻せます。

    ヒント: エージェントには修正を**計画して監督**（段階的に）するよう依頼し、その後で必要な
    コマンドだけを実行してください。これにより変更が小さくなり、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください。
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めてください（助けを求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: Gateway/エージェントの健全性と基本設定の簡易スナップショット。
    - `openclaw models status`: プロバイダー認証とモデル可用性を確認します。
    - `openclaw doctor`: よくある設定/状態の問題を検証し、修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の 60 秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    一般的な Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の範囲外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけの足場しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効だが、まだ期限に達したタスク間隔がない
    - `alerts-disabled`: すべての Heartbeat 表示が無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が完了した後にのみ
    進みます。スキップされた実行は、タスクを完了としてマークしません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法">
    リポジトリでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動でビルドできます。オンボーディング後、通常は Gateway をポート **18789** で実行します。

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

  <Accordion title="オンボーディング後にダッシュボードを開くにはどうすればよいですか？">
    ウィザードはオンボーディング直後にクリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、概要にもリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシンで表示された URL をコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するにはどうすればよいですか？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットが設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost 以外:**

    - **Tailscale Serve**（推奨）: bind は loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、ID ヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付けは不要、信頼された Gateway ホストを前提）。HTTP API は、private-ingress `none` または trusted-proxy HTTP auth を意図的に使わない限り、引き続き共有シークレット認証が必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth リミッターに記録される前に直列化されるため、2 回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）し、`http://<tailscale-ip>:18789/` を開いて、ダッシュボード設定に一致する共有シークレットを貼り付けます。
    - **ID 対応リバースプロキシ**: Gateway を信頼されたプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます。トンネル越しでも共有シークレット認証は適用されます。求められたら設定済みのトークンまたはパスワードを貼り付けます。

    bind モードと認証の詳細については、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec approval 設定が 2 つあるのはなぜですか？">
    これらは異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャットの宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャンネルを exec approval のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、引き続き実際の承認ゲートです。チャット設定は、承認
    プロンプトをどこに表示し、人がどう回答できるかだけを制御します。

    ほとんどのセットアップでは、**両方**は必要ありません。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` が共有パス経由で機能します。
    - サポート対象のネイティブチャンネルが承認者を安全に推測できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` なら、OpenClaw は DM 優先のネイティブ承認を自動で有効化します。
    - ネイティブ承認カード/ボタンが利用できる場合、そのネイティブ UI が主要な経路です。ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示している場合にのみ、エージェントは手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ使用します。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発信元のルーム/トピックに投稿し戻したい場合にのみ使用します。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve` を使い、任意の `approvals.plugin` 転送があり、一部のネイティブチャンネルだけがその上で plugin-approval-native 処理を維持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はよりリッチなチャンネル固有 UX 用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="どのランタイムが必要ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway で Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは個人利用には **512MB-1GB RAM**、**1 コア**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で実行可能**と記載されています。

    追加の余裕（ログ、メディア、他のサービス）が必要な場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Pi/VPS で Gateway をホストし、ノート PC/スマートフォン上の **ノード**をペアリングして、
    ローカルの画面/カメラ/canvas やコマンド実行に使えます。[ノード](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか？">
    短く言うと、動作しますが、粗い部分は想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持してください。
    - ログを確認して素早く更新できるように、**ハック可能な（git）インストール**を優先してください。
    - チャンネル/Skills なしで開始し、その後 1 つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが hatch しません。どうすればよいですか？">
    その画面は、Gateway に到達でき、認証されていることに依存しています。TUI も初回 hatch 時に
    「Wake up, my friend!」を自動送信します。その行が表示されて**返信がなく**、
    tokens が 0 のままなら、エージェントは実行されていません。

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

    3. まだハングする場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が有効で、UI が正しい Gateway を
    指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、セットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーし、その後 Doctor を 1 回実行してください。これにより、
    **両方**の場所をコピーする限り、bot を「まったく同じ」状態（memory、セッション履歴、認証、チャンネル
    状態）に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp creds、セッション、memory が保持されます。リモートモードの場合は、
    Gateway ホストがセッションストアとワークスペースを所有することを忘れないでください。

    **重要:** ワークスペースだけを GitHub に commit/push している場合、バックアップされるのは
    **memory + bootstrap ファイル**ですが、セッション履歴や認証は**含まれません**。それらは
    `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上で各種データが置かれる場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください。
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭セクションが **Unreleased** とマークされている場合、次の日付付き
    セクションが最新の出荷済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**
    （必要に応じて docs/その他のセクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。無効にするか `docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    こちらで報告し、ブロック解除にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **stable** と **beta** は、別々のコードラインではなく **npm dist-tags** です:

    - `latest` = stable
    - `beta` = テスト用の早期ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格手順によって同じバージョンが `latest` に移動されます。メンテナーは必要に応じて
    `latest` に直接公開することもできます。そのため、昇格後は beta と stable が
    **同じバージョン**を指す場合があります。

    変更内容を確認する:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用のワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta 版をインストールするにはどうすればよく、beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main`（git）の移動する先頭です。公開時には npm dist-tag `dev` を使用します。

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

  <Accordion title="最新のビットを試すにはどうすればよいですか？">
    2 つの選択肢があります:

    1. **Dev チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチへ切り替わり、ソースから更新されます。

    2. **変更可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより編集可能なローカルリポジトリが得られ、その後 git 経由で更新できます。

    手動でクリーンなクローンを使いたい場合は、次を使用します:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どのくらい時間がかかりますか？">
    目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 設定するチャンネルやモデルの数に応じて 5〜15 分

    停止したように見える場合は、[インストーラーが停止した場合](#quick-start-and-first-run-setup)
    と [行き詰まった場合](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが停止しましたか？より多くのフィードバックを得るにはどうすればよいですか？">
    **詳細出力**付きでインストーラーを再実行します:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きの Beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    変更可能な（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）相当:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示される">
    Windows でよくある問題は 2 つあります:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて再度開き、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm グローバル bin フォルダーが PATH にありません。
    - パスを確認します:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH の更新後、PowerShell を閉じて再度開きます。

    最もスムーズな Windows セットアップが必要な場合は、ネイティブ Windows ではなく **WSL2** を使用してください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします - どうすればよいですか？">
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

  <Accordion title="ドキュメントで質問が解決しませんでした - より良い回答を得るにはどうすればよいですか？">
    **変更可能な（git）インストール**を使用して、完全なソースとドキュメントをローカルに用意し、
    そのフォルダーからボット（または Claude/Codex）に質問してください。そうすればリポジトリを読んで正確に回答できます。

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

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか？">
    一般的なプロバイダー向けの **ホスティングハブ**を用意しています。1 つ選んでガイドに従ってください:

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの仕組み: **Gateway はサーバー上で実行**され、Control UI（または Tailscale/SSH）を介して
    ノート PC/スマートフォンからアクセスします。状態とワークスペースはサーバー上にあるため、
    ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングして、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり、
    ノート PC でコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨されません**。更新フローは
    Gateway を再起動する場合があり（アクティブなセッションが切断されます）、
    クリーンな git checkout が必要になることがあり、確認プロンプトが出る場合もあります。
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

  <Accordion title="オンボーディングは実際には何をしますか？">
    `openclaw onboard` は推奨されるセットアップ手順です。**ローカルモード**では、次を順に案内します:

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース**の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャンネルプラグイン）
    - **デーモンインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd ユーザーユニット）
    - **ヘルスチェック**と **skills** の選択

    設定済みモデルが不明または認証不足の場合にも警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか？">
    いいえ。**API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル**で OpenClaw を実行できるため、データはデバイス上に保持されます。
    サブスクリプション（Claude Pro/Max または OpenAI Codex）は、それらのプロバイダーに認証するための任意の方法です。

    OpenClaw における Anthropic の実用的な区分は次のとおりです:

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw の Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから、
      この利用は再び許可されていると伝えられており、OpenClaw は Anthropic が新しいポリシーを公開しない限り、
      この統合での `claude -p` の使用を認可されたものとして扱っています

    長期間稼働する Gateway ホストでは、Anthropic API キーの方が依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部ツール向けに明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** など、その他のホスト型サブスクリプション形式のオプションもサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか？">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられているため、
    OpenClaw は Anthropic が新しいポリシーを公開しない限り、
    この統合での Claude サブスクリプション認証と `claude -p` の使用を認可されたものとして扱います。
    最も予測しやすいサーバー側セットアップが必要な場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）をサポートしていますか？">
    はい。

    Anthropic スタッフから、この利用は再び許可されていると伝えられているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合での
    Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。

    Anthropic setup-token は引き続きサポートされる OpenClaw トークン経路として利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境またはマルチユーザーワークロードでは、Anthropic API キー認証の方が依然として
    より安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型オプションが必要な場合は、
    [OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限**を使い切ったことを意味します。**Claude CLI** を
    使用している場合は、ウィンドウがリセットされるまで待つか、プランをアップグレードしてください。
    **Anthropic API キー**を使用している場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests` の場合、リクエストは
    Anthropic の 1M context beta (`context1m: true`) を使おうとしています。これは、
    認証情報が長コンテキスト課金の対象である場合にのみ機能します (API キー課金、または
    Extra Usage が有効な OpenClaw Claude ログイン経路)。

    ヒント: **fallback model** を設定すると、プロバイダーがレート制限中でも OpenClaw が返信を続けられます。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか?">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーがバンドルされています。AWS env マーカーが存在する場合、OpenClaw はストリーミング/テキストの Bedrock カタログを自動検出し、暗黙的な `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動でプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理されたキーのフローを好む場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか?">
    OpenClaw は OAuth (ChatGPT サインイン) 経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップでは
    `openai/gpt-5.5` を使います。これは ChatGPT/Codex サブスクリプション認証に加えて、
    ネイティブの Codex アプリサーバー実行を使います。`openai-codex/gpt-*` モデル参照は、
    `openclaw doctor --fix` によって修復されるレガシー設定です。直接の OpenAI API キー
    アクセスは、非エージェントの OpenAI API サーフェス、および順序付きの `openai-codex` API キープロファイルを通じた
    エージェントモデルで引き続き利用できます。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及するのはなぜですか?">
    `openai-codex` は ChatGPT/Codex OAuth のプロバイダーおよび認証プロファイル ID です。
    古い設定では、これをモデルプレフィックスとしても使っていました:

    - `openai/gpt-5.5` = エージェントターン向けのネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション認証
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` によって修復されるレガシーモデルルート
    - `openai/gpt-5.5` に順序付きの `openai-codex` API キープロファイルを加えたもの = OpenAI エージェントモデル向けの API キー認証
    - `openai-codex:...` = 認証プロファイル ID であり、モデル参照ではありません

    直接の OpenAI Platform 課金/制限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインします。モデル参照は
    `openai/gpt-5.5` のままにしてください。`openai-codex/*` モデル参照は、
    `openclaw doctor --fix` が書き換えるレガシー設定です。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT Web と異なることがあるのはなぜですか?">
    Codex OAuth は OpenAI が管理する、プラン依存のクォータウィンドウを使います。実際には、
    同じアカウントに紐づいていても、これらの制限は ChatGPT の Web サイト/アプリ体験と
    異なる場合があります。

    OpenClaw は `openclaw models status` で現在見えているプロバイダーの使用量/クォータウィンドウを
    表示できますが、ChatGPT Web の権利を直接 API アクセスとして作り出したり正規化したりはしません。
    直接の OpenAI Platform 課金/制限経路を使いたい場合は、API キー付きで `openai/*` を使ってください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証 (Codex OAuth) はサポートされていますか?">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートします。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth の使用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定しますか?">
    Gemini CLI は `openclaw.json` 内のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使います。

    手順:

    1. `gemini` が `PATH` に入るように Gemini CLI をローカルにインストールします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効にします: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使っても問題ありませんか?">
    通常はいいえ。OpenClaw には大きなコンテキストと強力な安全性が必要です。小さいカードは切り詰めを起こし、漏えいにつながります。どうしても必要な場合は、ローカルで実行できる**最大の**モデルビルド (LM Studio) を実行し、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小型/量子化モデルはプロンプトインジェクションのリスクを高めます。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョンに保つにはどうすればよいですか?">
    リージョン固定のエンドポイントを選びます。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストの選択肢を提供しています。データをリージョン内に保つには、米国ホストのバリアントを選んでください。`models.mode: "merge"` を使えば、選択したリージョン指定プロバイダーを尊重しながら、フォールバックを利用可能なまま Anthropic/OpenAI も並べて一覧表示できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか?">
    いいえ。OpenClaw は macOS または Linux (Windows は WSL2 経由) で動作します。Mac mini は任意です。一部の人は常時稼働ホストとして購入しますが、小さな VPS、自宅サーバー、または Raspberry Pi クラスの機器でも機能します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage では、Messages にサインイン済みの任意の Mac 上で `imsg` とともに [iMessage](/ja-JP/channels/imessage) を使います。Gateway が Linux など別の場所で動作している場合は、`channels.imessage.cliPath` を、その Mac 上で `imsg` を実行する SSH ラッパーに設定します。他の macOS 専用ツールを使いたい場合は、Gateway を Mac で実行するか、macOS Node をペアリングします。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Node](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか?">
    Messages にサインイン済みの**何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません**。
    どの Mac でも機能します。`imsg` とともに **[iMessage](/ja-JP/channels/imessage) を使います**。Gateway はその Mac 上で実行することも、SSH ラッパー `cliPath` を使って別の場所で実行することもできます。

    一般的なセットアップ:

    - Gateway を Linux/VPS で実行し、Messages にサインイン済みの Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に設定します。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Node](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、MacBook Pro に接続できますか?">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **Node** (コンパニオンデバイス) として接続できます。Node は Gateway を実行しません。そのデバイス上の画面/カメラ/キャンバスや `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway (常時稼働)。
    - MacBook Pro は macOS アプリまたは Node ホストを実行し、Gateway とペアリングします。
    - 確認するには `openclaw nodes status` / `openclaw nodes list` を使います。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか?">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムのバグが見られます。
    安定した Gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、WhatsApp/Telegram なしの非本番 Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか?">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram ユーザー ID** (数値) です。Bot のユーザー名ではありません。

    セットアップでは数値のユーザー ID のみを求めます。設定にレガシーの `@username` エントリが既にある場合、`openclaw doctor --fix` がそれらの解決を試みることができます。

    より安全 (サードパーティ Bot なし):

    - 自分の Bot に DM してから、`openclaw logs --follow` を実行し、`from.id` を読み取ります。

    公式 Bot API:

    - 自分の Bot に DM してから、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読み取ります。

    サードパーティ (プライバシーは低め):

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が別々の OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか?">
    はい、**マルチエージェントルーティング**で可能です。各送信者の WhatsApp **DM** (peer `kind: "direct"`、送信者 E.164 形式は `+15551234567` など) を別々の `agentId` にバインドすると、各人が自分専用のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御 (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか?'>
    はい。マルチエージェントルーティングを使います。各エージェントに独自のデフォルトモデルを設定し、受信ルート (プロバイダーアカウントまたは特定のピア) を各エージェントにバインドします。設定例は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) にあります。[モデル](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか?">
    はい。Homebrew は Linux (Linuxbrew) をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールされたツールを解決できるように、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin` (または自分の brew プレフィックス) が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービスで一般的なユーザー bin ディレクトリ (例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`) も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="変更可能な git インストールと npm インストールの違い">
    - **変更可能な (git) インストール:** 完全なソースチェックアウトで、編集可能です。コントリビューターに最適です。
      ビルドをローカルで実行でき、コード/ドキュメントにパッチを当てられます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリはありません。「ただ実行したい」場合に最適です。
      更新は npm dist-tag から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後で npm インストールと git インストールを切り替えられますか?">
    はい。OpenClaw が既にインストールされている場合は、`openclaw update --channel ...` を使います。
    これは**データを削除しません**。OpenClaw コードのインストールだけを変更します。
    状態 (`~/.openclaw`) とワークスペース (`~/.openclaw/workspace`) はそのまま残ります。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    予定されているモード切り替えを先にプレビューするには、`--dry-run` を追加します。更新プログラムは
    Doctor のフォローアップを実行し、対象チャネル用に Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらかのモードを強制できます:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="GatewayはノートパソコンとVPSのどちらで実行すべきですか？">
    短い答え: **24時間365日の信頼性が必要なら、VPSを使ってください**。手間を最小限にしたく、スリープや再起動を許容できるなら、ローカルで実行してください。

    **ノートパソコン（ローカルGateway）**

    - **長所:** サーバー費用が不要、ローカルファイルに直接アクセスできる、ブラウザーウィンドウを表示できる。
    - **短所:** スリープやネットワーク切断 = 切断、OS更新や再起動で中断される、起動したままにしておく必要がある。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ノートパソコンのスリープ問題がない、稼働状態を保ちやすい。
    - **短所:** 多くの場合ヘッドレスで実行する（スクリーンショットを使う）、リモートファイルアクセスのみ、更新にはSSHが必要。

    **OpenClaw固有の注記:** WhatsApp/Telegram/Slack/Mattermost/DiscordはいずれもVPSから問題なく動作します。実質的なトレードオフは**ヘッドレスブラウザー**か表示ウィンドウかだけです。[Browser](/ja-JP/tools/browser)を参照してください。

    **推奨デフォルト:** 以前にGatewayの切断があった場合はVPS。Macを能動的に使っていて、ローカルファイルアクセスや表示ブラウザーでのUI自動化が必要な場合は、ローカルが適しています。

  </Accordion>

  <Accordion title="OpenClawを専用マシンで実行することはどのくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨されます**。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、稼働状態を保ちやすい。
    - **共有ノートパソコン/デスクトップ:** テストや能動的な利用にはまったく問題ありませんが、マシンがスリープしたり更新されたりすると一時停止が発生します。

    両方の利点を得たい場合は、Gatewayを専用ホストに置き、ノートパソコンをローカル画面/カメラ/execツール用の**ノード**としてペアリングしてください。[Nodes](/ja-JP/nodes)を参照してください。
    セキュリティのガイダンスについては、[Security](/ja-JP/gateway/security)を読んでください。

  </Accordion>

  <Accordion title="VPSの最小要件と推奨OSは何ですか？">
    OpenClawは軽量です。基本的なGateway + 1つのチャットチャンネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約500MBディスク。
    - **推奨:** 余裕を持たせるために1〜2 vCPU、2GB RAM以上（ログ、メディア、複数チャンネル）。Nodeツールとブラウザー自動化はリソースを多く消費することがあります。

    OS: **Ubuntu LTS**（または最新のDebian/Ubuntu）を使ってください。Linuxのインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPSホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClawをVMで実行できますか？要件は何ですか？">
    はい。VMはVPSと同じように扱ってください。常時稼働し、到達可能で、Gatewayと有効にするチャンネルに十分なRAMが必要です。

    基本ガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャンネル、ブラウザー自動化、メディアツールを実行する場合は2GB RAM以上。
    - **OS:** Ubuntu LTSまたは別の最新のDebian/Ubuntu。

    Windowsを使っている場合、**WSL2が最も簡単なVM形式のセットアップ**であり、ツール互換性も最良です。[Windows](/ja-JP/platforms/windows)、[VPSホスティング](/ja-JP/vps)を参照してください。
    VMでmacOSを実行している場合は、[macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メインFAQ（モデル、セッション、Gateway、セキュリティ、その他）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
