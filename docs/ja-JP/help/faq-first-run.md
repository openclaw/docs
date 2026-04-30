---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行エラー
    - 認証とプロバイダーのサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回セットアップ'
x-i18n:
    generated_at: "2026-04-30T05:17:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行の Q&A。日常運用、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まった場合に最速で抜け出す方法">
    **自分のマシンを見られる**ローカル AI エージェントを使ってください。Discord で質問するよりもはるかに効果的です。ほとんどの「行き詰まった」ケースは、リモートの支援者が調査できない**ローカル設定または環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンド実行、ログ調査、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正支援ができます。hackable (git) インストールを使って、**完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw が **git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み取り、実行中の正確なバージョンについて推論できます。後で安定版に戻したい場合は、`--install-method git` なしでインストーラーを再実行すれば切り替えられます。

    ヒント: エージェントには修正を**計画して監督**するよう依頼し（ステップごとに）、必要なコマンドだけを実行してください。これにより変更が小さくなり、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください。
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずこれらのコマンドから始めてください（助けを求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    各コマンドの役割:

    - `openclaw status`: gateway/agent のヘルスと基本設定の簡易スナップショット。
    - `openclaw models status`: provider 認証とモデルの利用可否を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証して修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の 60 秒](#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の範囲外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけの足場しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効だが、まだ期限が来ているタスク間隔がない
    - `alerts-disabled`: heartbeat の可視性がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、実際の heartbeat 実行が完了した後にのみ期限タイムスタンプが進みます。スキップされた実行は、タスクを完了済みとしてマークしません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法">
    リポジトリでは、ソースから実行してオンボーディングを使うことを推奨しています。

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
    ウィザードは、オンボーディング直後にクリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、概要にもリンクを出力します。そのタブは開いたままにしてください。起動しなかった場合は、出力された URL を同じマシンでコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ shared secret が設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: bind は loopback のままにし、`openclaw gateway --tailscale serve` を実行して `https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、identity headers が Control UI/WebSocket 認証を満たします（shared secret の貼り付け不要。信頼された gateway ホストを前提とします）。HTTP API は、private-ingress `none` または trusted-proxy HTTP auth を意図的に使わない限り、引き続き shared-secret 認証を必要とします。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth limiter が記録する前に直列化されるため、2 回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）と、`http://<tailscale-ip>:18789/` を開き、対応する shared secret をダッシュボード設定に貼り付けます。
    - **Identity-aware reverse proxy**: Gateway を信頼されたプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開きます。shared-secret 認証は tunnel 越しでも適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けてください。

    bind モードと認証の詳細については、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が 2 つあるのはなぜですか？">
    それぞれ別のレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先に転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec 承認用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、引き続き実際の承認ゲートです。チャット設定は、承認プロンプトをどこに表示し、人々がそれにどう回答できるかだけを制御します。

    ほとんどのセットアップでは、両方は**不要**です。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` は共有パス経由で動作します。
    - サポートされているネイティブチャネルが承認者を安全に推測できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM-first のネイティブ承認を自動で有効にします。
    - ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI が主要パスです。ツール結果でチャット承認が利用不可、または手動承認が唯一のパスであると示されている場合にのみ、エージェントは手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な ops ルームにも転送する必要がある場合にのみ使用してください。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発信元のルーム/トピックに投稿し返したい場合にのみ使ってください。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve`、任意の `approvals.plugin` 転送を使い、一部のネイティブチャネルだけがその上で plugin-approval-native handling を維持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はよりリッチなチャネル固有 UX 用です。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Bun は Gateway には**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 core**、約 **500MB** のディスクで十分とされ、**Raspberry Pi 4 で実行可能**とも記載されています。

    追加の余裕（ログ、メディア、他のサービス）が必要な場合は **2GB を推奨**しますが、必須の最小値ではありません。

    ヒント: 小型の Pi/VPS で Gateway をホストし、ラップトップ/スマートフォン上の **nodes** をペアリングして、ローカル画面/カメラ/canvas やコマンド実行を扱えます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか？">
    短く言うと、動作しますが、粗い部分があることは想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持してください。
    - ログを確認し、すばやく更新できるように、**hackable (git) install** を優先してください。
    - channels/skills なしで開始し、その後 1 つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM compatibility** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="「wake up my friend」で止まる / オンボーディングが hatch しません。どうすればよいですか？">
    その画面は Gateway に到達でき、認証済みであることに依存します。TUI は最初の hatch 時に
    「Wake up, my friend!」も自動送信します。その行が表示されても**返信がなく**、
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

    Gateway がリモートの場合は、tunnel/Tailscale 接続が稼働しており、UI が正しい Gateway を指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**state directory** と **workspace** をコピーしてから、Doctor を一度実行してください。**両方**の場所をコピーする限り、bot を「まったく同じ」状態（メモリ、セッション履歴、認証、チャネル状態）に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、config、auth profiles、WhatsApp creds、sessions、memory が保持されます。remote mode の場合は、gateway ホストが session store と workspace を所有することを覚えておいてください。

    **重要:** workspace だけを GitHub に commit/push している場合、バックアップされるのは
    **memory + bootstrap files** ですが、**session history や auth** は含まれません。これらは
    `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](#where-things-live-on-disk)、
    [Agent workspace](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭セクションが **Unreleased** とマークされている場合、次の日付付きセクションが最新の出荷済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。無効にするか `docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    ブロック解除のため、こちらから報告にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tags** です。

    - `latest` = stable
    - `beta` = テスト用の早期ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格ステップで同じバージョンが `latest` に移動します。メンテナーは必要に応じて
    直接 `latest` に公開することもできます。そのため、昇格後に beta と stable が
    **同じバージョン** を指すことがあります。

    変更内容を見る:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta バージョンをインストールするにはどうすればよく、beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動する先端（git）です。公開される場合は npm dist-tag `dev` を使用します。

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
    2つの方法があります。

    1. **Dev チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **変更可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより編集可能なローカルリポジトリが得られ、その後 git で更新できます。

    手動でクリーンなクローンを使いたい場合は、次を使用してください。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらい時間がかかりますか？">
    目安:

    - **インストール:** 2〜5分
    - **オンボーディング:** 設定するチャンネル/モデルの数に応じて5〜15分

    停止している場合は、[インストーラーが止まった](#quick-start-and-first-run-setup)
    と [詰まっています](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが止まりましたか？より多くのフィードバックを得るにはどうすればよいですか？">
    **詳細出力** を付けてインストーラーを再実行します。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きの beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    変更可能な（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等の手順:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示されます">
    Windows でよくある問題は2つあります。

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて再度開き、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されません**

    - npm のグローバル bin フォルダーが PATH 上にありません。
    - パスを確認します。

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH を更新した後、PowerShell を閉じて再度開きます。

    最もスムーズな Windows セットアップにしたい場合は、ネイティブ Windows ではなく **WSL2** を使用してください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします - どうすればよいですか？">
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

    その後、Gateway を再起動してコマンドを再試行します。

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、以下で追跡/報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした - より良い回答を得るにはどうすればよいですか？">
    **変更可能な（git）インストール** を使用して、完全なソースとドキュメントをローカルに用意し、そのフォルダーから
    ボット（または Claude/Codex）に尋ねると、リポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか？">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行します。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか？">
    どの Linux VPS でも動作します。サーバーにインストールし、その後 SSH/Tailscale を使って Gateway にアクセスします。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめた **ホスティングハブ** を用意しています。1つ選んでガイドに従ってください。

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを1か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの仕組み: **Gateway はサーバー上で実行され**、Control UI（または Tailscale/SSH）経由で
    ノートPC/スマートフォンからアクセスします。状態 + ワークスペースは
    サーバー上に存在するため、ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングすると、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり、
    ノートPCでコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨しません**。更新フローは
    Gateway を再起動する可能性があり（アクティブなセッションが切断されます）、クリーンな git checkout が必要になる場合や、
    確認を求める場合があります。より安全なのは、操作者としてシェルから更新を実行することです。

    CLI を使用します。

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

    ドキュメント: [Update](/ja-JP/cli/update)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際に何をしますか？">
    `openclaw onboard` は推奨されるセットアップ手順です。**ローカルモード** では、次の内容を順に設定します。

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot のような同梱チャンネル plugins）
    - **デーモンインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd ユーザーユニット）
    - **ヘルスチェック** と **skills** の選択

    また、設定済みモデルが不明または認証不足の場合に警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル** で実行できるため、データをデバイス上に保持できます。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、それらのプロバイダーを認証するための任意の方法です。

    OpenClaw における Anthropic では、実用上の使い分けは次のとおりです。

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この利用は再び許可されたと伝えられており、OpenClaw は Anthropic が新しい
      ポリシーを公開しない限り、この統合での `claude -p`
      利用を認可されたものとして扱います

    長期間稼働する gateway ホストでは、Anthropic API キーのほうが依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は OpenClaw のような外部
    ツールで明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** など、その他のホスト型サブスクリプション形式のオプションにも対応しています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか？">
    はい。

    Anthropic スタッフから OpenClaw 形式の Claude CLI 利用は再び許可されたと伝えられているため、
    OpenClaw は Anthropic が新しいポリシーを公開しない限り、
    この統合での Claude サブスクリプション認証と `claude -p` 利用を認可されたものとして扱います。
    最も予測しやすいサーバー側セットアップにしたい場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）をサポートしていますか？">
    はい。

    Anthropic スタッフからこの利用は再び許可されたと伝えられているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合での
    Claude CLI の再利用と `claude -p` 利用を認可されたものとして扱います。

    Anthropic setup-token は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境または複数ユーザーのワークロードでは、Anthropic API キー認証のほうが依然として
    より安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限** を使い切ったことを意味します。**Claude CLI** を
    使用している場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。
    **Anthropic API キー** を使用している場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M context beta（`context1m: true`）を使用しようとしています。これは、
    資格情報がロングコンテキスト課金の対象である場合（API キー課金、または
    Extra Usage が有効な OpenClaw Claude-login パス）にのみ機能します。

    ヒント: プロバイダーがレート制限中でも OpenClaw が返信を続けられるように、**フォールバックモデル**を設定してください。
    [Models](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーが同梱されています。AWS の環境マーカーが存在する場合、OpenClaw はストリーミング/テキストの Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効化するか、手動のプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理型キーのフローを使いたい場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効です。
  </Accordion>

  <Accordion title="Codex の認証はどのように動作しますか？">
    OpenClaw は OAuth (ChatGPT サインイン) 経由で **OpenAI Code (Codex)** をサポートします。デフォルトの PI ランナー経由で Codex OAuth を使うには
    `openai-codex/gpt-5.5` を使用します。直接の OpenAI API キーアクセスには
    `openai/gpt-5.5` を使用します。GPT-5.5 は
    `openai-codex/gpt-5.5` 経由のサブスクリプション/OAuth、または `openai/gpt-5.5` と `agentRuntime.id: "codex"` を使うネイティブ Codex アプリサーバー実行も利用できます。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及しているのはなぜですか？">
    `openai-codex` は ChatGPT/Codex OAuth 用のプロバイダーおよび認証プロファイル ID です。
    Codex OAuth 用の明示的な PI モデルプレフィックスでもあります。

    - `openai/gpt-5.5` = PI における現在の直接 OpenAI API キールート
    - `openai-codex/gpt-5.5` = PI における Codex OAuth ルート
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ネイティブ Codex アプリサーバールート
    - `openai-codex:...` = 認証プロファイル ID であり、モデル参照ではありません

    直接の OpenAI Platform の課金/制限パスを使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインし、PI 実行には
    `openai-codex/*` モデル参照を使用してください。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT Web と異なることがあるのはなぜですか？">
    Codex OAuth は、OpenAI が管理するプラン依存のクォータウィンドウを使用します。実際には、
    同じアカウントに紐づいている場合でも、これらの制限は ChatGPT のウェブサイト/アプリでの体験と異なることがあります。

    OpenClaw は `openclaw models status` で現在表示可能なプロバイダーの使用量/クォータウィンドウを表示できますが、ChatGPT Web の権利を直接 API アクセスとして作成したり正規化したりはしません。直接の OpenAI Platform の課金/制限パスを使いたい場合は、API キー付きで `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証 (Codex OAuth) はサポートされていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth 利用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、[オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのように設定しますか？">
    Gemini CLI は `openclaw.json` 内のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    手順:

    1. ローカルに Gemini CLI をインストールし、`gemini` が `PATH` 上にあるようにします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使っても問題ありませんか？">
    通常はいいえ。OpenClaw には大きなコンテキストと強力な安全性が必要です。小さなカードでは切り詰めや漏えいが発生します。どうしても使う場合は、ローカルで実行できる**最大**のモデルビルド (LM Studio) を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小さいモデルや量子化モデルはプロンプトインジェクションのリスクを高めます - [セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョンに留めるにはどうすればよいですか？">
    リージョン固定のエンドポイントを選択します。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストのオプションを公開しています。データをリージョン内に留めるには、米国ホストのバリアントを選択してください。`models.mode: "merge"` を使えば、選択したリージョン指定プロバイダーを尊重しつつ、フォールバックを利用可能なままにして、Anthropic/OpenAI も併せて一覧できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を購入する必要がありますか？">
    いいえ。OpenClaw は macOS または Linux (Windows は WSL2 経由) で動作します。Mac mini は任意です。一部の人は常時稼働ホストとして購入しますが、小さな VPS、自宅サーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles) (推奨) を使用してください。BlueBubbles サーバーは任意の Mac で動作し、Gateway は Linux などで実行できます。他の macOS 専用ツールを使いたい場合は、Gateway を Mac 上で実行するか、macOS Node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Node](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか？">
    Messages にサインインした**何らかの macOS デバイス**が必要です。Mac mini である必要はありません。任意の Mac で動作します。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles) を使用してください** (推奨)。BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux などで実行できます。

    一般的な構成:

    - Gateway を Linux/VPS 上で実行し、Messages にサインインした任意の Mac 上で BlueBubbles サーバーを実行します。
    - 最も単純な単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Node](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を購入した場合、MacBook Pro に接続できますか？">
    はい。**Mac mini で Gateway を実行**でき、MacBook Pro は
    **Node** (コンパニオンデバイス) として接続できます。Node は Gateway を実行しません。そのデバイス上で screen/camera/canvas や `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway (常時稼働)。
    - MacBook Pro が macOS アプリまたは Node ホストを実行し、Gateway にペアリングします。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、本番ではない Gateway で、WhatsApp/Telegram なしで行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram ユーザー ID** (数値) です。Bot のユーザー名ではありません。

    セットアップでは数値ユーザー ID のみを求められます。設定に従来の `@username` エントリがすでにある場合、`openclaw doctor --fix` で解決を試行できます。

    より安全 (サードパーティ Bot なし):

    - Bot に DM し、その後 `openclaw logs --follow` を実行して `from.id` を読み取ります。

    公式 Bot API:

    - Bot に DM し、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読み取ります。

    サードパーティ (プライバシーは低め):

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が別々の OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**経由で可能です。各送信者の WhatsApp **DM** (ピア `kind: "direct"`、送信者 E.164 形式、例 `+15551234567`) を別々の `agentId` にバインドすると、各人が自分専用のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御 (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを設定し、受信ルート (プロバイダーアカウントまたは特定のピア) を各エージェントにバインドします。設定例は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) にあります。[モデル](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい。Homebrew は Linux (Linuxbrew) をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールしたツールを解決できるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin` (または使用している brew プレフィックス) が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ (例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`) も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な (git) インストール:** 完全なソースチェックアウトで、編集可能。コントリビューターに最適です。
      ビルドをローカルで実行し、コード/ドキュメントをパッチできます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリはありません。「とにかく実行する」のに最適です。
      更新は npm dist-tag から提供されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとから npm インストールと git インストールを切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は `openclaw update --channel ...` を使用します。
    これは**データを削除しません**。OpenClaw のコードインストールだけを変更します。
    状態 (`~/.openclaw`) とワークスペース (`~/.openclaw/workspace`) はそのままです。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    まず計画されたモード切り替えをプレビューするには `--dry-run` を追加します。アップデーターは
    Doctor のフォローアップを実行し、対象チャネルの Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらのモードも強制できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はラップトップと VPS のどちらで実行すべきですか？">
    短い答え: **24/7 の信頼性が必要なら VPS を使ってください**。最小限の手間を重視し、スリープ/再起動を許容できるなら、ローカルで実行してください。

    **ラップトップ (ローカル Gateway)**

    - **長所:** サーバー費用なし、ローカルファイルへの直接アクセス、ライブブラウザーウィンドウ。
    - **短所:** スリープ/ネットワーク切断 = 接続断、OS 更新/再起動で中断、起動状態を維持する必要があります。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ラップトップのスリープ問題なし、稼働維持が容易。
    - **短所:** 多くの場合ヘッドレスで実行 (スクリーンショットを使用)、リモートファイルアクセスのみ、更新には SSH が必要です。

    **OpenClaw 固有の注記:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。実質的なトレードオフは**ヘッドレスブラウザー**か表示ウィンドウかだけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨される既定:** 以前に Gateway の切断があった場合は VPS。Mac を能動的に使っていて、ローカルファイルアクセスや表示されるブラウザーでの UI 自動化が必要な場合は、ローカルが適しています。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどの程度重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨**されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働でき、スリープや再起動による中断が少なく、権限が整理され、稼働状態を維持しやすい。
    - **共有ラップトップ/デスクトップ:** テストや能動的な利用にはまったく問題ありませんが、マシンがスリープしたり更新されたりすると一時停止が発生することがあります。

    両方の利点を得たい場合は、Gateway を専用ホストに置き、ラップトップをローカルの画面/カメラ/exec ツール用の **node** としてペアリングします。[ノード](/ja-JP/nodes) を参照してください。
    セキュリティのガイダンスについては、[セキュリティ](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャンネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 余裕を持たせるために 1〜2 vCPU、2GB RAM 以上（ログ、メディア、複数チャンネル）。Node ツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS**（または任意の最新 Debian/Ubuntu）を使用してください。Linux のインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にするチャンネルに十分な
    RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャンネル、ブラウザー自動化、またはメディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別の最新 Debian/Ubuntu。

    Windows を使用している場合、**WSL2 が最も簡単な VM 形式のセットアップ**であり、ツール互換性も最も優れています。
    [Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps) を参照してください。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、Gateway、セキュリティ、その他）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
