---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが停止している
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'FAQ: 初回起動時のセットアップ'
x-i18n:
    generated_at: "2026-06-28T20:43:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行の Q&A。日常運用、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最短で抜け出す方法">
    **あなたのマシンを見られる** ローカル AI エージェントを使ってください。Discord で質問するよりもはるかに効果的です。
    多くの「行き詰まった」ケースは、リモートの支援者が確認できない
    **ローカル設定や環境の問題** だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンドの実行、ログの確認、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正支援ができます。hackable（git）インストールで
    **完全なソースチェックアウト** を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw は **git チェックアウトから** インストールされるため、エージェントはコードとドキュメントを読み取り、
    実行中の正確なバージョンについて推論できます。後で安定版に戻したい場合は、
    `--install-method git` なしでインストーラーを再実行すればいつでも戻せます。

    ヒント: エージェントには修正を **計画して監督** するよう依頼し（ステップごと）、
    必要なコマンドだけを実行してください。これにより変更を小さく保ち、監査しやすくなります。

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

    - `openclaw status`: gateway/agent の健全性と基本設定の簡易スナップショット。
    - `openclaw models status`: プロバイダー認証とモデルの利用可否を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証して修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の 60 秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    一般的な Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の外です
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在しますが、空白、コメント、ヘッダー、フェンス、または空のチェックリストの足場だけを含んでいます
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効ですが、まだ期限に達したタスク間隔がありません
    - `alerts-disabled`: Heartbeat の可視性がすべて無効です（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進められます。スキップされた実行ではタスクは完了扱いになりません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストールとセットアップ方法">
    リポジトリでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動的にビルドできます。オンボーディング後は、通常 Gateway をポート **18789** で実行します。

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
    ウィザードはオンボーディング直後に、クリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、概要にもリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、表示された URL を同じマシンでコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンの取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットが設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: バインドは loopback のままにし、`openclaw gateway --tailscale serve` を実行して、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、ID ヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付けは不要、信頼済み Gateway ホストを前提）。HTTP API は、意図的に private-ingress の `none` または trusted-proxy HTTP 認証を使わない限り、引き続き共有シークレット認証が必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、失敗認証リミッターに記録される前に直列化されるため、2 回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet バインド**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）と、`http://<tailscale-ip>:18789/` を開いてから、一致する共有シークレットをダッシュボード設定に貼り付けます。
    - **ID 認識リバースプロキシ**: Gateway を信頼済みプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます。トンネル越しでも共有シークレット認証は適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けます。

    バインドモードと認証の詳細は、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が 2 つあるのはなぜですか？">
    それぞれ異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先に転送します
    - `channels.<channel>.execApprovals`: そのチャンネルを exec 承認用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが引き続き実際の承認ゲートです。チャット設定は、承認
    プロンプトがどこに表示され、利用者がどのように回答できるかだけを制御します。

    ほとんどのセットアップでは、両方は **不要** です。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` は共有パスを通じて機能します。
    - サポート対象のネイティブチャンネルが承認者を安全に推論できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、OpenClaw は DM 優先のネイティブ承認を自動的に有効化します。
    - ネイティブの承認カード/ボタンが利用可能な場合、そのネイティブ UI が主要な経路です。エージェントは、ツール結果でチャット承認が利用できない、または手動承認が唯一の経路だと示される場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ、`approvals.exec` を使います。
    - 承認プロンプトを発信元のルーム/トピックに投稿し戻すことを明示的に望む場合にのみ、`channels.<channel>.execApprovals.target: "channel"` または `"both"` を使います。
    - Plugin 承認はまた別です。デフォルトでは同じチャットの `/approve` を使い、任意で `approvals.plugin` 転送を使います。一部のネイティブチャンネルだけが、その上に Plugin 承認ネイティブ処理を維持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はチャンネル固有のより豊かな UX 用です。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway には Bun は **推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です - ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 コア**、
    約 **500MB** のディスクで十分とされており、**Raspberry Pi 4 で実行可能** と記載されています。

    余裕（ログ、メディア、他のサービス）が欲しい場合は **2GB を推奨** しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Raspberry Pi/VPS で Gateway をホストし、ローカルの画面/カメラ/canvas やコマンド実行のために
    ラップトップ/電話の **ノード** とペアリングできます。[ノード](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのコツはありますか？">
    短く言うと、動作しますが、荒い部分があることは想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持してください。
    - ログを確認し、すばやく更新できるように、**hackable（git）インストール** を推奨します。
    - チャンネル/skills なしで始めてから、1 つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、たいていは **ARM 互換性** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが hatch しません。どうすればよいですか？">
    その画面は、Gateway に到達でき、認証されていることに依存します。TUI も初回 hatch 時に
    「Wake up, my friend!」を自動送信します。その行が表示されても **返信がなく**、
    トークンが 0 のままなら、エージェントは一度も実行されていません。

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

    3. まだハングする場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が有効で、UI が正しい Gateway を
    指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**状態ディレクトリ** と **ワークスペース** をコピーしてから、Doctor を一度実行してください。これにより、
    **両方** の場所をコピーする限り、ボットは「まったく同じ」（メモリ、セッション履歴、認証、チャンネル
    状態）に保たれます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモートモードの場合は、
    gateway ホストがセッションストアとワークスペースを所有することを忘れないでください。

    **重要:** ワークスペースだけを GitHub にコミット/プッシュしている場合、バックアップしているのは
    **メモリ + ブートストラップファイル** ですが、セッション履歴や認証は **含まれません**。それらは
    `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の配置](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください。
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは先頭にあります。先頭セクションが **Unreleased** と示されている場合、次の日付付き
    セクションが最新の出荷済みバージョンです。エントリは **Highlights**、**Changes**、
    **Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。
    無効化するか、`docs.openclaw.ai` を許可リストに追加してから再試行してください。
    解除に協力するため、こちらで報告してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    サイトにまだアクセスできない場合、ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は、別々のコードラインではなく **npm dist-tags** です:

    - `latest` = stable
    - `beta` = テスト用の早期ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格ステップによって同じバージョンが `latest` に移動されます。メンテナーは必要に応じて
    直接 `latest` に公開することもできます。そのため、昇格後に beta と stable が
    **同じバージョン** を指す場合があります。

    変更点を見る:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta バージョンのインストール方法と、beta と dev の違いは何ですか?">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動する先頭（git）です。公開される場合は、npm dist-tag `dev` を使用します。

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

  <Accordion title="最新のビットを試すにはどうすればよいですか?">
    2 つの選択肢があります:

    1. **Dev チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **変更しやすいインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集可能なローカルリポジトリが作成され、その後 git で更新できます。

    手動でクリーンにクローンしたい場合は、次を使用します:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[Development channels](/ja-JP/install/development-channels)、
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どのくらい時間がかかりますか?">
    目安:

    - **インストール:** 2-5 分
    - **QuickStart オンボーディング:** 通常は数分
    - **フルオンボーディング:** プロバイダーのサインイン、チャンネルのペアリング、デーモンのインストール、
      ネットワークダウンロード、Skills、または任意の plugins に追加設定が必要な場合は長くなります

    CLI ウィザードは、このタイムラインを最初に表示します。任意の手順はスキップでき、
    後で `openclaw configure` から戻れます。

    ハングする場合は、[インストーラーが止まる](#quick-start-and-first-run-setup)
    と [詰まっています](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが止まりますか? もっとフィードバックを得るにはどうすればよいですか?">
    **詳細出力** 付きでインストーラーを再実行します:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きの beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    変更しやすい（git）インストールの場合:

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

    その他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git が見つからない、または openclaw が認識されないと表示される">
    Windows でよくある問題は 2 つあります:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に含まれていることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH にありません。
    - パスを確認します:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH の更新後、PowerShell を閉じて開き直します。

    デスクトップセットアップには、ネイティブの **Windows Hub** アプリを使用してください。ターミナルのみの
    セットアップでは、PowerShell インストーラーと WSL2 Gateway パスの両方がサポートされています。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力に文字化けした中国語テキストが表示されます - どうすればよいですか?">
    これは通常、ネイティブ Windows シェルでのコンソールコードページの不一致です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けとして表示される
    - 同じコマンドが別のターミナルプロファイルでは問題なく見える

    PowerShell での簡単な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    次に Gateway を再起動し、コマンドを再試行します:

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡または報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした - より良い回答を得るにはどうすればよいですか?">
    **変更しやすい（git）インストール** を使用して、完全なソースとドキュメントをローカルに用意し、
    そのフォルダーからボット（または Claude/Codex）に質問してください。そうすればリポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか?">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行します。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか?">
    どの Linux VPS でも動作します。サーバーにインストールし、SSH/Tailscale を使って Gateway に到達します。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS インストールガイドはどこにありますか?">
    一般的なプロバイダーをまとめた **ホスティングハブ** を用意しています。1 つ選び、ガイドに従ってください:

    - [VPS hosting](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの仕組み: **Gateway はサーバー上で実行** され、Control UI（または Tailscale/SSH）経由で
    ノート PC/スマートフォンからアクセスします。状態 + ワークスペースは
    サーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングして、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり
    ノート PC 上でコマンドを実行したりできます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    ノード: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか?">
    短い答え: **可能ですが、推奨しません**。更新フローは
    Gateway を再起動する場合があり（アクティブセッションが切断されます）、クリーンな git checkout が必要になったり、
    確認を求められたりすることがあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

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

    ドキュメント: [Update](/ja-JP/cli/update)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何をしますか?">
    `openclaw onboard` は推奨されるセットアップパスです。**ローカルモード** では、次の手順を案内します:

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などの同梱チャンネル plugins）
    - **デーモンインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
    - **ヘルスチェック** と **skills** の選択

    また、メインのプロンプトが始まる前に所要時間の見込みを設定し、
    設定済みモデルが不明または認証不足の場合に警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか?">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル** で実行できるため、データはデバイス上に残ります。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、これらのプロバイダーを認証する任意の方法です。

    OpenClaw での Anthropic について、実用上の分け方は次のとおりです:

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この使用が再び許可されたと聞いており、Anthropic が新しい
      ポリシーを公開しない限り、OpenClaw は `claude -p`
      の使用をこの統合で認可されたものとして扱います

    長期間稼働する Gateway ホストでは、Anthropic API キーのほうが依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツールで明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション形式のオプションもサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI (GLM)](/ja-JP/providers/zai)、
    [Local models](/ja-JP/gateway/local-models)、[Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか?">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用が再び許可されたと聞いているため、
    OpenClaw は Claude サブスクリプション認証と `claude -p` の使用を、
    Anthropic が新しいポリシーを公開しない限り、この統合で認可されたものとして扱います。最も予測しやすい
    サーバー側セットアップが必要な場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）はサポートしていますか?">
    はい。

    Anthropic スタッフから、この使用が再び許可されたと聞いているため、OpenClaw は
    Claude CLI の再利用と `claude -p` の使用を、この統合で認可されたものとして扱います。
    ただし、Anthropic が新しいポリシーを公開した場合はその限りではありません。

    Anthropic setup-token は、サポートされている OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境または複数ユーザーのワークロードでは、Anthropic API キー認証のほうが
    より安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および [GLM
    Models](/ja-JP/providers/zai) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限**を使い切ったことを意味します。**Claude CLI** を
    使用している場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API key** を
    使用している場合は、Anthropic Console
    で使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキストウィンドウ（GA 対応の 1M Claude 4.x モデル、またはレガシーの
    `context1m: true` 設定）を使用しようとしています。これは、資格情報がロングコンテキスト課金の対象である場合にのみ機能します
    （API key 課金、または Extra Usage が有効な OpenClaw Claude ログインパス）。

    ヒント: **フォールバックモデル**を設定すると、プロバイダーがレート制限中でも OpenClaw が応答を続けられます。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には、バンドルされた **Amazon Bedrock (Converse)** プロバイダーがあります。AWS env マーカーが存在する場合、OpenClaw はストリーミング/テキストの Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動のプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理されたキーフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを置くことも有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように機能しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップでは
    `openai/gpt-5.5` を使用します。ChatGPT/Codex サブスクリプション認証と
    ネイティブ Codex アプリサーバー実行です。レガシー Codex GPT 参照は、
    `openclaw doctor --fix` によって修復されるレガシー設定です。直接の OpenAI API key
    アクセスは、非エージェントの OpenAI API サーフェス、および順序付きの `openai` API key プロファイルを通じたエージェントモデルで引き続き利用できます。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだレガシーの OpenAI Codex プレフィックスに言及するのはなぜですか？">
    `openai` は、OpenAI API key と
    ChatGPT/Codex OAuth の両方で使われるプロバイダーおよび認証プロファイル ID です。レガシー設定や
    移行警告では、レガシーの OpenAI Codex プレフィックスがまだ表示される場合があります。
    古い設定では、モデルプレフィックスとしても使われていました。

    - `openai/gpt-5.5` = エージェントターン用のネイティブ Codex ランタイムを伴う ChatGPT/Codex サブスクリプション認証
    - レガシー Codex GPT-5.5 参照 = `openclaw doctor --fix` によって修復されるレガシーモデルルート
    - `openai/gpt-5.5` に順序付きの `openai` API key プロファイルを組み合わせる = OpenAI エージェントモデル向けの API key 認証
    - レガシー Codex 認証プロファイル ID = `openclaw doctor --fix` によって移行されるレガシー認証プロファイル ID

    直接の OpenAI Platform 請求/制限パスを使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai` でサインインします。モデル参照は
    `openai/gpt-5.5` のままにしてください。レガシー Codex モデル参照は、
    `openclaw doctor --fix` が書き換えるレガシー設定です。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか？">
    Codex OAuth は、OpenAI が管理するプラン依存のクォータウィンドウを使用します。実際には、
    同じアカウントに紐づいている場合でも、これらの制限は ChatGPT のウェブサイト/アプリの体験と異なることがあります。

    OpenClaw は、現在可視化されているプロバイダーの使用量/クォータウィンドウを
    `openclaw models status` で表示できますが、ChatGPT web の権利を直接 API アクセスへ
    作り出したり正規化したりはしません。直接の OpenAI Platform
    請求/制限パスを使いたい場合は、API key とともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートしていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth 使用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth を設定するにはどうすればよいですか？">
    Gemini CLI は **Plugin 認証フロー**を使用し、`openclaw.json` 内のクライアント ID やシークレットは使用しません。

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

  <Accordion title="ローカルモデルは気軽なチャットに適していますか？">
    通常はいいえ。OpenClaw には大きなコンテキストと強力な安全性が必要です。小さいカードでは切り詰めや漏えいが発生します。どうしても使う必要がある場合は、ローカルで実行できる**最大**のモデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。より小さいモデルや量子化モデルはプロンプトインジェクションリスクを高めます - [セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョンに保つにはどうすればよいですか？">
    リージョン固定のエンドポイントを選んでください。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストのオプションを提供しています。データをリージョン内に保つには、米国ホストのバリアントを選択してください。`models.mode: "merge"` を使用すれば、選択したリージョン対応プロバイダーを尊重しながら、Anthropic/OpenAI も並べて一覧に残し、フォールバックを利用可能にできます。
  </Accordion>

  <Accordion title="これをインストールするために Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です - 常時稼働ホストとして購入する人もいますが、小型 VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage では、Messages にサインイン済みの任意の Mac 上で `imsg` とともに [iMessage](/ja-JP/channels/imessage) を使用します。Gateway が Linux など別の場所で動作している場合は、その Mac 上で `imsg` を実行する SSH ラッパーに `channels.imessage.cliPath` を設定します。ほかの macOS 専用ツールを使いたい場合は、Gateway を Mac 上で実行するか、macOS ノードをペアリングしてください。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか？">
    Messages にサインイン済みの **何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません** -
    どの Mac でも動作します。**[iMessage](/ja-JP/channels/imessage) を使用**し、`imsg` を使ってください。Gateway はその Mac 上で実行することも、SSH ラッパー `cliPath` を使って別の場所で実行することもできます。

    一般的なセットアップ:

    - Gateway を Linux/VPS 上で実行し、Messages にサインイン済みの Mac 上で `imsg` を実行する SSH ラッパーに `channels.imessage.cliPath` を設定します。
    - 最も単純な単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **ノード**（コンパニオンデバイス）として接続できます。ノードは Gateway を実行しません - そのデバイス上の画面/カメラ/キャンバスや `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway（常時稼働）。
    - MacBook Pro が macOS アプリまたはノードホストを実行し、Gateway とペアリングします。
    - 確認するには `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムのバグが見られます。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、WhatsApp/Telegram を使用しない非本番 Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram ユーザー ID**（数値）です。bot のユーザー名ではありません。

    セットアップでは数値のユーザー ID のみを求めます。設定にレガシーの `@username` エントリがすでにある場合、`openclaw doctor --fix` が解決を試みることができます。

    より安全（サードパーティ bot なし）:

    - bot に DM し、`openclaw logs --follow` を実行して `from.id` を読み取ります。

    公式 Bot API:

    - bot に DM し、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読み取ります。

    サードパーティ（プライバシーは低め）:

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が、異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**経由で可能です。各送信者の WhatsApp **DM**（ピア `kind: "direct"`、送信者 E.164 形式の `+15551234567` など）を別々の `agentId` にバインドすると、各人が自分専用のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを設定し、受信ルート（プロバイダーアカウントまたは特定のピア）を各エージェントにバインドします。設定例は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) にあります。[モデル](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールしたツールを解決できるように、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用している brew プレフィックス）が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ（例: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な（git）インストール:** 完全なソースチェックアウトで、編集可能です。コントリビューターに最適です。
      ローカルでビルドを実行し、コード/ドキュメントにパッチを当てられます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリは不要です。「ただ実行したい」場合に最適です。
      更新は npm dist-tags から提供されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使用します。
    これは**データを削除しません** - OpenClaw のコードインストールだけを変更します。
    状態（`~/.openclaw`）とワークスペース（`~/.openclaw/workspace`）はそのまま残ります。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    `--dry-run` を追加すると、予定されているモード切り替えを先にプレビューできます。アップデーターは
    Doctor のフォローアップを実行し、対象チャネルの Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでも、どちらのモードも強制できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はラップトップと VPS のどちらで実行すべきですか？">
    短い答え: **24時間365日の信頼性が必要なら VPS を使ってください**。手間を最小限にしたく、
    スリープや再起動を許容できるなら、ローカルで実行してください。

    **ラップトップ (ローカル Gateway)**

    - **利点:** サーバー費用が不要、ローカルファイルへ直接アクセスできる、ブラウザーウィンドウを表示できる。
    - **欠点:** スリープやネットワーク切断 = 接続断、OS 更新や再起動で中断する、起動したままにする必要がある。

    **VPS / クラウド**

    - **利点:** 常時稼働、安定したネットワーク、ラップトップのスリープ問題がない、実行し続けやすい。
    - **欠点:** 多くの場合ヘッドレスで実行する (スクリーンショットを使う)、リモートファイルアクセスのみ、更新には SSH が必要。

    **OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。実質的なトレードオフは **ヘッドレスブラウザー** と表示可能なウィンドウの違いだけです。[ブラウザー](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に Gateway の切断があった場合は VPS。Mac をアクティブに使っていて、ローカルファイルアクセスや表示可能なブラウザーでの UI 自動化が必要な場合は、ローカルが適しています。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで実行することはどのくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨されます**。

    - **専用ホスト (VPS/Mac mini/Raspberry Pi):** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、実行し続けやすい。
    - **共有ラップトップ/デスクトップ:** テストやアクティブな利用にはまったく問題ありませんが、マシンがスリープまたは更新されると一時停止が発生します。

    両方の利点を得たい場合は、Gateway を専用ホストに置き、ローカルの画面/カメラ/exec ツール用にラップトップを **node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティのガイダンスについては、[セキュリティ](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB のディスク。
    - **推奨:** 余裕を持たせるために 1-2 vCPU、2GB RAM 以上 (ログ、メディア、複数チャネル)。Node ツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS** (または任意のモダンな Debian/Ubuntu) を使用してください。Linux のインストールパスはそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、
    Gateway と有効にするすべてのチャネルに十分な RAM が必要です。

    基本的なガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別のモダンな Debian/Ubuntu。

    Windows を使用している場合は、デスクトップセットアップには **Windows Hub** を使うか、
    幅広いツール互換性を持つ Linux 風の Gateway VM が特に必要な場合は
    WSL2 を使ってください。[Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps) を参照してください。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ (モデル、セッション、Gateway、セキュリティ、その他)
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
