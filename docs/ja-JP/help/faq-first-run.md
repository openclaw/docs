---
read_when:
    - 新規インストール、オンボーディングで止まる、または初回実行時のエラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが止まっている
sidebarTitle: First-run FAQ
summary: 'よくある質問: クイックスタートと初回実行時のセットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回セットアップ'
x-i18n:
    generated_at: "2026-05-12T00:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行のQ&A。日常的な運用、モデル、認証、セッション、
  トラブルシューティングについては、メインの[FAQ](/ja-JP/help/faq)を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で抜け出す方法">
    **あなたのマシンを確認できる**ローカルAIエージェントを使います。これは Discord で質問するよりはるかに効果的です。
    ほとんどの「行き詰まった」ケースは、リモートの支援者が確認できない**ローカル設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールはリポジトリを読み、コマンドを実行し、ログを調べ、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正を支援できます。ハック可能な（git）インストールで
    **完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw が **git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み、
    実行中の正確なバージョンについて推論できます。あとで安定版に戻したい場合は、
    `--install-method git` なしでインストーラーを再実行すればいつでも切り替えられます。

    ヒント: エージェントには修正を**計画し、監督する**よう依頼し（ステップごとに）、必要なコマンドだけを実行してください。
    そうすると変更が小さくなり、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください。
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めます（支援を求めるときは出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: Gateway/エージェントの健全性と基本設定の簡単なスナップショット。
    - `openclaw models status`: プロバイダー認証とモデルの利用可否を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証し、修復します。

    その他の便利なCLIチェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の60秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    一般的な Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけの足場しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効だが、まだ期限に達したタスク間隔がない
    - `alerts-disabled`: Heartbeat の可視性がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行はタスクを完了済みとしてマークしません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストールとセットアップ方法">
    リポジトリでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードはUIアセットも自動でビルドできます。オンボーディング後は、通常 Gateway をポート **18789** で実行します。

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
    ウィザードはオンボーディング直後に、クリーンな（トークン化されていない）ダッシュボードURLでブラウザーを開き、サマリーにもリンクを出力します。そのタブは開いたままにしてください。起動しなかった場合は、同じマシンで出力されたURLをコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - 共有シークレットがまだ設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: バインドはループバックのままにし、`openclaw gateway --tailscale serve` を実行して、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、IDヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付けは不要、信頼された Gateway ホストであることが前提）。HTTP API では、private-ingress の `none` または trusted-proxy HTTP 認証を意図的に使わない限り、共有シークレット認証が引き続き必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、失敗認証リミッターに記録される前に直列化されるため、2回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet バインド**: `openclaw gateway --bind tailnet --token "<token>"` を実行するか（またはパスワード認証を設定し）、`http://<tailscale-ip>:18789/` を開いてから、一致する共有シークレットをダッシュボード設定に貼り付けます。
    - **ID対応リバースプロキシ**: Gateway を信頼されたプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシURLを開きます。同一ホストのループバックプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから、`http://127.0.0.1:18789/` を開きます。共有シークレット認証はトンネル経由でも適用されます。求められたら、設定済みのトークンまたはパスワードを貼り付けてください。

    バインドモードと認証の詳細は、[ダッシュボード](/ja-JP/web/dashboard)と[Web サーフェス](/ja-JP/web)を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が2つあるのはなぜですか？">
    それぞれ異なるレイヤーを制御します。

    - `approvals.exec`: 承認プロンプトをチャットの送信先に転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec 承認のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、実際の承認ゲートであることに変わりはありません。チャット設定は、承認
    プロンプトをどこに表示するか、そして人がどう回答できるかだけを制御します。

    ほとんどのセットアップでは、両方は**不要**です。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャット内の `/approve` は共有パスを通じて機能します。
    - サポートされているネイティブチャネルが承認者を安全に推定できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、OpenClaw はDM優先のネイティブ承認を自動で有効化します。
    - ネイティブの承認カード/ボタンが利用できる場合、そのネイティブUIが主要な経路です。エージェントは、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示している場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ使います。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発生元のルーム/トピックに投稿し戻したい場合にのみ使います。
    - Plugin 承認はさらに別です。デフォルトでは同じチャット内の `/approve` を使い、任意の `approvals.plugin` 転送を使えます。また、一部のネイティブチャネルだけが、その上に Plugin 承認のネイティブ処理を維持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はチャネル固有のよりリッチなUX用です。
    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Bun は Gateway には**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動作しますか？">
    はい。Gateway は軽量です。ドキュメントでは個人利用には **512MB-1GB RAM**、**1 core**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で実行可能**とも記載されています。

    追加の余裕（ログ、メディア、他のサービス）がほしい場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Pi/VPS で Gateway をホストし、ノートPC/スマートフォン上の**ノード**をペアリングして、
    ローカル画面/カメラ/キャンバスやコマンド実行を行えます。[ノード](/ja-JP/nodes)を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi へのインストールのヒントはありますか？">
    短く言うと、動作しますが、粗い部分は想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持します。
    - ログを確認し、素早く更新できるよう、**ハック可能な（git）インストール**を推奨します。
    - チャネル/Skills なしで開始し、その後1つずつ追加します。
    - 奇妙なバイナリ問題に遭遇した場合、通常は **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まっている / オンボーディングが孵化しません。次に何をすればよいですか？">
    その画面は、Gateway に到達でき、認証されていることに依存します。TUI も最初の孵化時に
    「Wake up, my friend!」を自動送信します。その行が表示されても**返信がなく**、
    トークンが0のままなら、エージェントは実行されていません。

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

    Gateway がリモートの場合は、トンネル/Tailscale 接続が稼働しており、UI が正しい
    Gateway を指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーし、その後 Doctor を1回実行します。
    これにより、**両方**の場所をコピーしている限り、ボットは「まったく同じ」（メモリ、セッション履歴、認証、チャネル
    状態）に保たれます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより設定、認証プロファイル、WhatsApp 資格情報、セッション、メモリが保持されます。リモート
    モードの場合は、Gateway ホストがセッションストアとワークスペースを所有することを忘れないでください。

    **重要:** ワークスペースを GitHub に commit/push するだけでは、
    **メモリ + ブートストラップファイル**はバックアップされますが、セッション履歴や認証は**バックアップされません**。
    それらは `~/.openclaw/` 配下にあります（例: `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub の変更履歴を確認してください。
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは上部にあります。最上部のセクションが **Unreleased** とマークされている場合、次の日付付き
    セクションが最新の出荷済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/その他のセクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできない（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。
    無効化するか、`docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    ブロック解除に協力するため、こちらで報告してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントは GitHub にミラーされています。
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータ版の違い">
    **安定版**と**ベータ版**は、別々のコードラインではなく、**npm dist-tags**です。

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド

    通常、安定版リリースはまず **beta** に入り、その後、明示的な
    昇格ステップで同じバージョンが `latest` に移動されます。メンテナーは必要に応じて
    直接 `latest` に公開することもできます。そのため、昇格後にベータ版と安定版が
    **同じバージョン**を指すことがあります。

    変更内容を確認:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと、ベータ版と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版をインストールするにはどうすればよく、ベータ版と dev の違いは何ですか？">
    **ベータ版**は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
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

    詳細: [開発チャンネル](/ja-JP/install/development-channels) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビットを試すにはどうすればよいですか？">
    2 つの選択肢があります。

    1. **Dev チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **編集可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集可能なローカルリポジトリが作成され、その後 git で更新できます。

    手動でクリーンなクローンを使いたい場合は、次を使用します。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どのくらいかかりますか？">
    目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 設定するチャンネルやモデルの数に応じて 5〜15 分

    固まる場合は、[インストーラーが止まる](#quick-start-and-first-run-setup)
    と [行き詰まった場合](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが止まります。より詳しいフィードバックを得るにはどうすればよいですか？">
    **詳細出力**付きでインストーラーを再実行します。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細出力付きのベータ版インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    編集可能な（git）インストールの場合:

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

  <Accordion title="Windows のインストールで git が見つからない、または openclaw が認識されないと表示される">
    Windows でよくある問題は 2 つあります。

    **1) npm error spawn git / git が見つからない**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH 上にありません。
    - パスを確認します。

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH を更新した後、PowerShell を閉じて開き直します。

    最もスムーズな Windows セットアップを望む場合は、ネイティブ Windows ではなく **WSL2** を使用してください。
    Docs: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします。どうすればよいですか？">
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

    その後、Gateway を再起動してコマンドを再試行します。

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡または報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Docs で疑問が解決しませんでした。よりよい回答を得るにはどうすればよいですか？">
    完全なソースと Docs をローカルに持てるように、**編集可能な（git）インストール**を使用し、その後
    そのフォルダーからボット（または Claude/Codex）に尋ねてください。そうすればリポジトリを読んで正確に回答できます。

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
    どの Linux VPS でも動作します。サーバーにインストールし、その後 SSH/Tailscale を使って Gateway に到達します。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめた**ホスティングハブ**があります。1 つ選んでガイドに従ってください。

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で実行**され、ラップトップ/スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態 + ワークスペースは
    サーバー上に存在するため、ホストを信頼できるソースとして扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングすると、
    Gateway をクラウドに置いたまま、ローカルの画面/カメラ/canvas にアクセスしたり、
    ラップトップ上でコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨されません**。更新フローでは
    Gateway が再起動される場合があり（アクティブセッションが切断されます）、
    クリーンな git checkout が必要になることや、確認を求められることがあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

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

    Docs: [更新](/ja-JP/cli/update)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングでは実際に何が行われますか？">
    `openclaw onboard` は推奨されるセットアップパスです。**ローカルモード**では次の手順を案内します。

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース**の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などのバンドルされたチャンネルプラグイン）
    - **デーモンインストール**（macOS の LaunchAgent、Linux/WSL2 の systemd ユーザーユニット）
    - **ヘルスチェック**と**Skills**の選択

    また、設定済みモデルが不明または認証不足の場合にも警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカルのみのモデル**で実行できるため、データを自分のデバイス上に保持できます。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、これらのプロバイダーを認証するための任意の方法です。

    OpenClaw での Anthropic について、実用上の分け方は次のとおりです。

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この使用は再び許可されたと伝えられており、OpenClaw は Anthropic が新しい
      ポリシーを公開しない限り、この統合での `claude -p`
      使用を認可済みとして扱います

    長期間稼働する Gateway ホストでは、Anthropic API キーのほうが引き続き
    予測可能なセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツール向けに明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション形式のオプションもサポートしています。

    Docs: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか？">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されたと伝えられています。そのため
    OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この統合での
    Claude サブスクリプション認証と `claude -p` 使用を認可済みとして扱います。最も予測可能なサーバーサイドのセットアップを望む場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）はサポートされていますか？">
    はい。

    Anthropic スタッフから、この使用は再び許可されたと伝えられています。そのため OpenClaw は、
    Anthropic が新しいポリシーを公開しない限り、この統合での
    Claude CLI の再利用と `claude -p` 使用を認可済みとして扱います。

    Anthropic setup-token は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境またはマルチユーザーワークロードでは、Anthropic API キー認証が引き続き
    より安全で予測可能な選択肢です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限**を使い切ったことを意味します。
    **Claude CLI** を使用している場合は、ウィンドウがリセットされるまで待つか、プランをアップグレードしてください。
    **Anthropic API キー**を使用している場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキストベータ（`context1m: true`）を使用しようとしています。これは、
    認証情報が長文コンテキスト課金の対象である場合（API キー課金、または
    Extra Usage が有効な OpenClaw Claude-login パス）にのみ機能します。

    ヒント: プロバイダーがレート制限されている間も OpenClaw が返信を続けられるように、**フォールバックモデル**を設定します。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーが同梱されています。AWS 環境マーカーが存在する場合、OpenClaw はストリーミング/テキスト用の Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動でプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models) を参照してください。管理されたキーのフローを利用したい場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように機能しますか？">
    OpenClaw は OAuth (ChatGPT サインイン) 経由で **OpenAI Code (Codex)** をサポートします。一般的なセットアップには
    `openai/gpt-5.5` を使用します。これは ChatGPT/Codex サブスクリプション認証に加えて、
    ネイティブの Codex アプリサーバー実行を使う構成です。`openai-codex/gpt-*` モデル参照は、
    `openclaw doctor --fix` によって修復されるレガシー設定です。直接の OpenAI API キー
    アクセスは、非エージェントの OpenAI API サーフェスと、順序付きの `openai-codex` API キープロファイル経由のエージェント
    モデルで引き続き利用できます。
    [モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだ openai-codex に言及するのはなぜですか？">
    `openai-codex` は ChatGPT/Codex OAuth 用のプロバイダーおよび認証プロファイル ID です。
    古い設定ではモデルプレフィックスとしても使用されていました。

    - `openai/gpt-5.5` = エージェントターンにネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション認証
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` によって修復されるレガシーモデルルート
    - `openai/gpt-5.5` と順序付きの `openai-codex` API キープロファイル = OpenAI エージェントモデル用の API キー認証
    - `openai-codex:...` = 認証プロファイル ID であり、モデル参照ではありません

    直接の OpenAI Platform 課金/制限パスを使いたい場合は、
    `OPENAI_API_KEY` を設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインします。モデル参照は
    `openai/gpt-5.5` のままにしてください。`openai-codex/*` モデル参照は
    `openclaw doctor --fix` が書き換えるレガシー設定です。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか？">
    Codex OAuth は、OpenAI が管理するプラン依存のクォータウィンドウを使用します。実際には、
    どちらも同じアカウントに紐づいていても、これらの制限は ChatGPT ウェブサイト/アプリの体験とは異なる場合があります。

    OpenClaw は `openclaw models status` で現在表示可能なプロバイダーの使用量/クォータウィンドウを
    表示できますが、ChatGPT web の権利を直接 API アクセスとして作り出したり正規化したりはしません。
    直接の OpenAI Platform 課金/制限パスを使いたい場合は、API キー付きの `openai/*` を使用します。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証 (Codex OAuth) はサポートしていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth 利用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定しますか？">
    Gemini CLI は `openclaw.json` のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    手順:

    1. `gemini` が `PATH` に入るように、Gemini CLI をローカルにインストールします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使ってもよいですか？">
    通常はおすすめしません。OpenClaw には大きなコンテキストと強い安全性が必要です。小さなカードでは切り詰められ、漏えいします。どうしても必要な場合は、ローカルで実行できる**最大**のモデルビルド (LM Studio) を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小型/量子化モデルはプロンプトインジェクションのリスクを高めます。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョンに留めるにはどうすればよいですか？">
    リージョン固定エンドポイントを選びます。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストのオプションを提供しています。データをリージョン内に保つには、米国ホストのバリアントを選択します。`models.mode: "merge"` を使用すれば、選択したリージョン指定プロバイダーを尊重しながら、フォールバックを利用可能なまま Anthropic/OpenAI を併記することもできます。
  </Accordion>

  <Accordion title="これをインストールするために Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux (Windows は WSL2 経由) で動作します。Mac mini は任意です。常時稼働ホストとして購入する人もいますが、小型 VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**を使う場合だけです。iMessage では、Messages にサインインした任意の Mac 上で `imsg` とともに [iMessage](/ja-JP/channels/imessage) を使用します。Gateway を Linux など別の場所で実行する場合は、`channels.imessage.cliPath` を、その Mac 上で `imsg` を実行する SSH ラッパーに設定します。その他の macOS 専用ツールを使いたい場合は、Gateway を Mac で実行するか、macOS ノードをペアリングします。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか？">
    Messages にサインインした**何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません**。
    どの Mac でも使えます。`imsg` とともに **[iMessage](/ja-JP/channels/imessage) を使用**します。Gateway はその Mac 上で実行することも、SSH ラッパー `cliPath` を使って別の場所で実行することもできます。

    一般的なセットアップ:

    - Gateway を Linux/VPS で実行し、`channels.imessage.cliPath` を、Messages にサインインした Mac 上で `imsg` を実行する SSH ラッパーに設定します。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、それを MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **ノード** (コンパニオンデバイス) として接続できます。ノードは Gateway を実行しません。そのデバイス上の
    画面/カメラ/キャンバスや `system.run` などの追加機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway (常時稼働)。
    - MacBook Pro は macOS アプリまたはノードホストを実行し、Gateway にペアリングします。
    - `openclaw nodes status` / `openclaw nodes list` で確認します。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、本番ではない Gateway で、
    WhatsApp/Telegram なしで行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram ユーザー ID** (数値) です。bot のユーザー名ではありません。

    セットアップでは数値ユーザー ID のみを求めます。設定にすでにレガシーの `@username` エントリがある場合、`openclaw doctor --fix` で解決を試みることができます。

    より安全な方法 (サードパーティ bot なし):

    - bot に DM し、`openclaw logs --follow` を実行して `from.id` を読み取ります。

    公式 Bot API:

    - bot に DM し、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読み取ります。

    サードパーティ (プライバシーは低め):

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が、異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**を使います。各送信者の WhatsApp **DM** (ピア `kind: "direct"`、送信者 E.164 形式の `+15551234567` など) を異なる `agentId` にバインドすると、各人が自分専用のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御 (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) は WhatsApp アカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
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

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールしたツールを解決できるように、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin` (または使用している brew プレフィックス) が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービスで一般的なユーザー bin ディレクトリ (例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`) も先頭に追加され、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な (git) インストール:** 完全なソースチェックアウトで、編集可能です。コントリビューターに最適です。
      ローカルでビルドを実行し、コード/ドキュメントにパッチを当てることができます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリはありません。「とにかく実行したい」場合に最適です。
      更新は npm dist-tags から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使用します。
    これは**データを削除しません**。OpenClaw のコードインストールだけを変更します。
    状態 (`~/.openclaw`) とワークスペース (`~/.openclaw/workspace`) はそのまま残ります。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    予定されているモード切り替えを先にプレビューするには `--dry-run` を追加します。アップデーターは
    Doctor のフォローアップを実行し、対象チャンネルの Plugin ソースを更新し、
    `--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらのモードも強制できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [バックアップ戦略](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はラップトップと VPS のどちらで実行すべきですか？">
    短い答え: **24/7 の信頼性が必要なら VPS を使ってください**。摩擦を最小限にしたく、
    スリープ/再起動を許容できるなら、ローカルで実行してください。

    **ラップトップ (ローカル Gateway)**

    - **長所:** サーバー費用が不要、ローカルファイルへ直接アクセス可能、ライブのブラウザーウィンドウ。
    - **短所:** スリープ/ネットワーク切断 = 切断、OS 更新/再起動で中断、起動したままにする必要があります。

    **VPS / クラウド**

    - **長所:** 常時稼働、安定したネットワーク、ノートパソコンのスリープ問題なし、稼働を維持しやすい。
    - **短所:** 多くの場合ヘッドレスで実行する（スクリーンショットを使う）、リモートファイルアクセスのみ、更新には SSH が必要。

    **OpenClaw固有の注記:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。実質的なトレードオフは、**ヘッドレスブラウザー**か可視ウィンドウかだけです。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    **推奨されるデフォルト:** 以前に Gateway の切断があった場合は VPS。Mac を能動的に使っていて、ローカルファイルアクセスや可視ブラウザーでの UI 自動化が必要な場合はローカルが適しています。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどのくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨**されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ/再起動による中断が少ない、権限が整理しやすい、稼働を維持しやすい。
    - **共有のノートパソコン/デスクトップ:** テストや能動的な利用にはまったく問題ありませんが、マシンがスリープまたは更新されると停止が発生することを想定してください。

    両方の利点を得たい場合は、Gateway を専用ホストに置き、ノートパソコンをローカルの画面/カメラ/execツール用の**ノード**としてペアリングしてください。[ノード](/ja-JP/nodes)を参照してください。
    セキュリティガイダンスについては、[セキュリティ](/ja-JP/gateway/security)を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1つのチャットチャネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約500MBディスク。
    - **推奨:** ログ、メディア、複数チャネルの余裕を考慮して、1-2 vCPU、2GB RAM 以上。Nodeツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS**（または最新の Debian/Ubuntu）を使用してください。Linux のインストールパスはそこで最もよくテストされています。

    Docs: [Linux](/ja-JP/platforms/linux)、[VPSホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にするチャネルに十分な
    RAM が必要です。

    基本的なガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを実行する場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または別の最新の Debian/Ubuntu。

    Windows を使用している場合、**WSL2 が最も簡単な VM スタイルのセットアップ**で、ツール互換性も最良です。[Windows](/ja-JP/platforms/windows)、[VPSホスティング](/ja-JP/vps)を参照してください。
    VM で macOS を実行している場合は、[macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、Gateway、セキュリティ、その他）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
