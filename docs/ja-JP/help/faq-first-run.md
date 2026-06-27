---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが止まっている
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回起動セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'FAQ: 初回実行セットアップ'
x-i18n:
    generated_at: "2026-06-27T11:41:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行セットアップの Q&A。日常的な運用、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で抜け出す方法">
    **自分のマシンを見られる**ローカル AI エージェントを使ってください。Discord で質問するよりもはるかに効果的です。
    ほとんどの「行き詰まった」ケースは、リモートの支援者が確認できない**ローカル設定または環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールはリポジトリを読み、コマンドを実行し、ログを調べ、マシンレベルの
    セットアップ (PATH、サービス、権限、認証ファイル) の修正を支援できます。ハック可能な (git)
    インストールで、**完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw が **git チェックアウトから**インストールされるため、エージェントはコードとドキュメントを読み、
    実行中の正確なバージョンについて推論できます。あとで安定版に戻したい場合は、
    `--install-method git` なしでインストーラーを再実行すればいつでも戻せます。

    ヒント: エージェントには修正を**計画して監督**するよう依頼し (ステップごとに)、必要なコマンドだけを実行してください。
    そうすると変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めてください (助けを求めるときは出力を共有してください):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: gateway/エージェントの健全性と基本設定の簡単なスナップショット。
    - `openclaw models status`: プロバイダー認証とモデルの利用可否を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証して修復します。

    その他の便利な CLI チェック: `openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れている場合の最初の 60 秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか?">
    一般的な Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の外にあります
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在しますが、空白、コメント、ヘッダー、フェンス、または空のチェックリストの足場だけを含んでいます
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードは有効ですが、まだ期限に達したタスク間隔がありません
    - `alerts-disabled`: すべての Heartbeat 表示が無効です (`showOk`、`showAlerts`、`useIndicator` がすべてオフ)

    タスクモードでは、期限のタイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行ではタスクは完了扱いになりません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストールとセットアップ方法">
    リポジトリでは、ソースから実行してオンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動的にビルドできます。オンボーディング後は、通常 Gateway をポート **18789** で実行します。

    ソースから (コントリビューター/開発者向け):

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

  <Accordion title="オンボーディング後にダッシュボードを開くには?">
    ウィザードはオンボーディング直後に、クリーンな (トークン化されていない) ダッシュボード URL でブラウザーを開き、サマリーにもリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、表示された URL を同じマシンでコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには?">
    **Localhost (同じマシン):**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token` (または `OPENCLAW_GATEWAY_TOKEN`)。
    - パスワードのソース: `gateway.auth.password` (または `OPENCLAW_GATEWAY_PASSWORD`)。
    - 共有シークレットがまだ設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve** (推奨): バインドは local loopback のままにし、`openclaw gateway --tailscale serve` を実行して、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、ID ヘッダーが Control UI/WebSocket 認証を満たします (共有シークレットの貼り付け不要、信頼済み Gateway ホストを前提)。HTTP API には、private-ingress の `none` または trusted-proxy HTTP 認証を意図的に使わない限り、共有シークレット認証が引き続き必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、失敗認証リミッターに記録される前に直列化されるため、2 回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet バインド**: `openclaw gateway --bind tailnet --token "<token>"` を実行する (またはパスワード認証を設定する) と、`http://<tailscale-ip>:18789/` を開き、ダッシュボード設定に一致する共有シークレットを貼り付けます。
    - **ID 対応リバースプロキシ**: Gateway を信頼済みプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開きます。共有シークレット認証はトンネル越しでも適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けます。

    バインドモードと認証の詳細は、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が 2 つあるのはなぜですか?">
    それぞれ別の層を制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec 承認のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、引き続き実際の承認ゲートです。チャット設定は、承認
    プロンプトをどこに表示し、人がどのように回答できるかだけを制御します。

    ほとんどのセットアップでは、**両方は必要ありません**。

    - チャットがすでにコマンドと返信をサポートしている場合、同じチャットの `/approve` は共有パスを通じて動作します。
    - サポート済みのネイティブチャネルが承認者を安全に推定できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` なら、OpenClaw は DM 優先のネイティブ承認を自動的に有効にします。
    - ネイティブ承認カード/ボタンが利用できる場合、そのネイティブ UI が主要な経路です。エージェントは、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路だと示す場合にのみ、手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な運用ルームにも転送する必要がある場合にのみ使います。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発信元のルーム/トピックへ明示的に投稿したい場合にのみ使います。
    - Plugin 承認はさらに別です。デフォルトでは同じチャットの `/approve` を使い、任意で `approvals.plugin` 転送を使います。また、一部のネイティブチャネルだけがその上に Plugin 承認のネイティブ処理を保持します。

    短く言うと、転送はルーティング用で、ネイティブクライアント設定はよりリッチなチャネル固有 UX 用です。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか?">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway では Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか?">
    はい。Gateway は軽量です。ドキュメントでは個人利用には **512MB-1GB RAM**、**1 コア**、
    約 **500MB** のディスクで十分とされ、**Raspberry Pi 4 で実行可能**と記載されています。

    余裕 (ログ、メディア、他のサービス) が欲しい場合は **2GB を推奨**しますが、
    厳密な最小要件ではありません。

    ヒント: 小さな Raspberry Pi/VPS で Gateway をホストし、ノート PC/スマートフォン上の**ノード**をペアリングして、
    ローカルの画面/カメラ/canvas やコマンド実行を扱えます。[ノード](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか?">
    短く言うと、動作しますが、粗い部分は想定してください。

    - **64-bit** OS を使い、Node >= 22 を維持します。
    - ログを確認してすばやく更新できるように、**ハック可能な (git) インストール**を推奨します。
    - まずチャネル/Skills なしで始め、1 つずつ追加します。
    - 奇妙なバイナリ問題に当たった場合、通常は **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが孵化しません。どうすればよいですか?">
    その画面は、Gateway に到達でき認証済みであることに依存します。TUI は初回の孵化時に
    "Wake up, my friend!" も自動送信します。その行が表示されても**返信がなく**、
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

    Gateway がリモートの場合は、トンネル/Tailscale 接続が稼働していること、UI が正しい Gateway を
    指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン (Mac mini) へ移行できますか?">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーし、その後 Doctor を 1 回実行してください。これにより、
    **両方**の場所をコピーしている限り、ボットを「まったく同じ」状態 (メモリ、セッション履歴、認証、チャネル状態)
    に保てます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR` (デフォルト: `~/.openclaw`) をコピーします。
    3. ワークスペース (デフォルト: `~/.openclaw/workspace`) をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモートモードの場合は、
    gateway ホストがセッションストアとワークスペースを所有していることを忘れないでください。

    **重要:** ワークスペースだけを GitHub にコミット/プッシュしている場合、バックアップされるのは
    **メモリ + ブートストラップファイル**ですが、セッション履歴や認証は**含まれません**。それらは
    `~/.openclaw/` の下にあります (例: `~/.openclaw/agents/<agentId>/sessions/`)。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか?">
    GitHub の changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは一番上にあります。最上部のセクションが **Unreleased** とマークされている場合、次の日付付き
    セクションが最新のリリース済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**
    (必要に応じて docs/その他のセクション) でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません (SSL エラー)">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。
    これを無効化するか `docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    ブロック解除のため、こちらから報告に協力してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    サイトにまだアクセスできない場合、ドキュメントは GitHub にミラーされています。
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータ版の違い">
    **安定版** と **ベータ版** は、別々のコードラインではなく **npm dist-tags** です。

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド

    通常、安定版リリースはまず **beta** に入り、その後、明示的な
    昇格ステップで同じバージョンが `latest` に移動されます。メンテナーは必要に応じて
    `latest` に直接公開することもできます。そのため、昇格後はベータ版と安定版が
    **同じバージョン** を指すことがあります。

    変更内容を確認:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用のワンライナーと、ベータ版と開発版の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版をインストールするにはどうすればよく、ベータ版と開発版の違いは何ですか?">
    **ベータ版** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **開発版** は `main`（git）の移動する先頭です。公開される場合は、npm dist-tag `dev` を使用します。

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

  <Accordion title="最新のビットを試すにはどうすればよいですか?">
    2 つの選択肢があります。

    1. **開発チャンネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **ハック可能なインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより編集可能なローカルリポジトリが得られ、その後 git で更新できます。

    クリーンなクローンを手動で行いたい場合は、次を使用してください。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、
    [インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらい時間がかかりますか?">
    目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 設定するチャンネル/モデルの数に応じて 5〜15 分

    ハングする場合は、[インストーラーが止まる](#quick-start-and-first-run-setup)
    と [詰まっている](#quick-start-and-first-run-setup) の高速デバッグループを使用してください。

  </Accordion>

  <Accordion title="インストーラーが止まりますか? より多くのフィードバックを得るにはどうすればよいですか?">
    **詳細出力** 付きでインストーラーを再実行します。

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

    Windows（PowerShell）での同等の方法:

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

    **1) npm error spawn git / git が見つからない**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて再度開き、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH 上にありません。
    - パスを確認します。

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH 更新後、PowerShell を閉じて再度開きます。

    デスクトップセットアップには、ネイティブの **Windows Hub** アプリを使用してください。ターミナル専用の
    セットアップでは、PowerShell インストーラーと WSL2 Gateway パスの両方がサポートされています。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けします - どうすればよいですか?">
    これは通常、ネイティブ Windows シェルでのコンソールコードページの不一致です。

    症状:

    - `system.run`/`exec` 出力で中国語が文字化けとして表示される
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

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントでは質問に答えられませんでした - より良い回答を得るにはどうすればよいですか?">
    **ハック可能な（git）インストール** を使用して、完全なソースとドキュメントをローカルに用意し、その後
    ボット（または Claude/Codex）に _そのフォルダーから_ 質問すると、リポジトリを読んで正確に回答できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [インストール](/ja-JP/install) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか?">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行してください。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 詳細な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか?">
    任意の Linux VPS が使えます。サーバーにインストールし、SSH/Tailscale を使用して Gateway にアクセスします。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS インストールガイドはどこにありますか?">
    一般的なプロバイダーをまとめた **ホスティングハブ** を用意しています。1 つ選んでガイドに従ってください。

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを 1 か所に）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの仕組み: **Gateway はサーバー上で実行され**、ノート PC/スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態 + ワークスペースは
    サーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    **ノード**（Mac/iOS/Android/headless）をそのクラウド Gateway にペアリングして、
    ローカルの画面/カメラ/canvas にアクセスしたり、Gateway をクラウドに置いたまま
    ノート PC 上でコマンドを実行したりできます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか?">
    短い答え: **可能ですが、推奨されません**。更新フローでは
    Gateway が再起動される可能性があり（アクティブなセッションが切断されます）、
    クリーンな git checkout が必要になる場合があり、確認を求めることがあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

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

    ドキュメント: [更新](/ja-JP/cli/update)、[更新中](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何をしますか?">
    `openclaw onboard` は推奨されるセットアップパスです。**ローカルモード** では、次を順に案内します。

    - **モデル/認証セットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャンネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot などのバンドルチャンネル Plugin）
    - **デーモンインストール**（macOS の LaunchAgent、Linux/WSL2 の systemd ユーザーユニット）
    - **ヘルスチェック** と **Skills** の選択

    設定済みモデルが不明な場合や認証が欠けている場合にも警告します。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか?">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル** で実行できるため、データはデバイス上に残ります。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、これらのプロバイダーを認証するための任意の方法です。

    OpenClaw における Anthropic の実用的な使い分けは次のとおりです。

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフは
      この使用が再び許可されていると伝えており、OpenClaw は Anthropic が新しい
      ポリシーを公開しない限り、この統合に対する `claude -p`
      の使用を認可済みとして扱っています

    長期間稼働する Gateway ホストでは、Anthropic API キーのほうが依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は OpenClaw などの外部
    ツール向けに明示的にサポートされています。

    OpenClaw は、**Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan** など、他のホスト型サブスクリプション形式のオプションもサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI (GLM)](/ja-JP/providers/zai)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか?">
    はい。

    Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されていると伝えているため、
    OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合に対する Claude サブスクリプション認証と `claude -p` の使用を認可済みとして扱います。最も予測しやすいサーバー側セットアップを求める場合は、代わりに Anthropic API キーを使用してください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）をサポートしていますか?">
    はい。

    Anthropic スタッフは、この使用が再び許可されていると伝えているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合に対する Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。

    Anthropic setup-token は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境や複数ユーザーのワークロードでは、Anthropic API キー認証のほうが依然として
    より安全で予測しやすい選択肢です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを求める場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および [GLM
    Models](/ja-JP/providers/zai) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか?">
    これは、現在のウィンドウで **Anthropic のクォータ/レート制限** が使い切られたことを意味します。**Claude CLI** を
    使用している場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API キー** を
    使用している場合は、Anthropic Console で
    使用量/請求を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests`、リクエストは
    Anthropic の 1M コンテキストウィンドウ（GA 対応の 1M Claude 4.x モデルまたはレガシーの
    `context1m: true` 設定）を使用しようとしています。これは、認証情報が
    長コンテキスト課金（API キー課金、または Extra Usage が有効な OpenClaw Claude ログイン経路）
    の対象である場合にのみ機能します。

    ヒント: **フォールバックモデル**を設定すると、プロバイダーがレート制限中でも OpenClaw が返信を続けられます。
    [Models](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーがバンドルされています。AWS env マーカーが存在する場合、OpenClaw はストリーミング/テキスト Bedrock カタログを自動検出し、暗黙的な `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動のプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。管理されたキーのフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように機能しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートします。
    一般的なセットアップでは `openai/gpt-5.5` を使用します。つまり、ChatGPT/Codex サブスクリプション認証と
    ネイティブ Codex アプリサーバー実行です。レガシー Codex GPT 参照は、
    `openclaw doctor --fix` によって修復されるレガシー設定です。直接の OpenAI API キー
    アクセスは、非エージェントの OpenAI API サーフェス、および順序付きの `openai` API キープロファイルを通じたエージェント
    モデルで引き続き利用できます。
    [Model providers](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="なぜ OpenClaw はまだレガシー OpenAI Codex プレフィックスに言及するのですか？">
    `openai` は、OpenAI API キーと
    ChatGPT/Codex OAuth の両方に対するプロバイダーおよび認証プロファイル ID です。レガシー設定や
    移行警告では、レガシー OpenAI Codex プレフィックスがまだ表示される場合があります。
    古い設定では、モデルプレフィックスとしても使用されていました。

    - `openai/gpt-5.5` = エージェントターンでネイティブ Codex ランタイムを使用する ChatGPT/Codex サブスクリプション認証
    - レガシー Codex GPT-5.5 参照 = `openclaw doctor --fix` によって修復されるレガシーモデルルート
    - `openai/gpt-5.5` に順序付きの `openai` API キープロファイルを加えたもの = OpenAI エージェントモデルの API キー認証
    - レガシー Codex 認証プロファイル ID = `openclaw doctor --fix` によって移行されるレガシー認証プロファイル ID

    直接の OpenAI Platform 課金/制限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai` でサインインしてください。モデル参照は
    `openai/gpt-5.5` のままにしてください。レガシー Codex モデル参照は、
    `openclaw doctor --fix` が書き換えるレガシー設定です。

  </Accordion>

  <Accordion title="なぜ Codex OAuth の制限は ChatGPT Web と異なることがあるのですか？">
    Codex OAuth は、OpenAI が管理するプラン依存のクォータウィンドウを使用します。実際には、
    両方が同じアカウントに紐付いていても、これらの制限は ChatGPT Web サイト/アプリの体験と異なる場合があります。

    OpenClaw は `openclaw models status` で、現在表示可能なプロバイダーの使用量/クォータウィンドウを表示できますが、
    ChatGPT Web の権利を直接 API アクセスとして作り出したり正規化したりはしません。直接の OpenAI Platform
    課金/制限経路を使いたい場合は、API キーで `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証 (Codex OAuth) はサポートされていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでのサブスクリプション OAuth 利用を明示的に許可しています。
    オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのように設定しますか？">
    Gemini CLI は `openclaw.json` のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    手順:

    1. ローカルに Gemini CLI をインストールし、`gemini` が `PATH` にあるようにします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します

    これにより、OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使っても問題ありませんか？">
    通常はいいえ。OpenClaw には大きなコンテキストと強い安全性が必要です。小さなカードは切り詰めや漏洩を起こします。どうしても必要な場合は、ローカルで実行できる**最大**のモデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。小型/量子化モデルはプロンプトインジェクションのリスクを高めます - [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定リージョン内に保つにはどうすればよいですか？">
    リージョン固定のエンドポイントを選択してください。OpenRouter は MiniMax、Kimi、GLM 向けに米国ホストの選択肢を提供しています。データをリージョン内に保つには、米国ホストのバリアントを選んでください。`models.mode: "merge"` を使用すれば、選択したリージョン指定プロバイダーを尊重しつつ、フォールバックを利用可能なまま Anthropic/OpenAI も並べて一覧できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です。一部の人は
    常時稼働ホストとして購入しますが、小さな VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも機能します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage では、Messages にサインイン済みの任意の Mac 上で `imsg` とともに [iMessage](/ja-JP/channels/imessage) を使用します。Gateway が Linux または他の場所で実行されている場合は、`channels.imessage.cliPath` を、その Mac 上で `imsg` を実行する SSH ラッパーに設定します。他の macOS 専用ツールを使いたい場合は、Gateway を Mac 上で実行するか、macOS ノードをペアリングしてください。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Nodes](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか？">
    Messages にサインイン済みの**何らかの macOS デバイス**が必要です。Mac mini である必要は**ありません**。
    任意の Mac で機能します。`imsg` とともに **[iMessage](/ja-JP/channels/imessage) を使用**してください。Gateway はその Mac 上で実行することも、SSH ラッパーの `cliPath` を使って別の場所で実行することもできます。

    一般的なセットアップ:

    - Gateway を Linux/VPS 上で実行し、Messages にサインイン済みの Mac 上で `imsg` を実行する SSH ラッパーに `channels.imessage.cliPath` を設定します。
    - 最も単純な単一マシン構成にしたい場合は、すべてを Mac 上で実行します。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Nodes](/ja-JP/nodes)、
    [Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買った場合、MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は
    **ノード**（コンパニオンデバイス）として接続できます。ノードは Gateway を実行しません。そのデバイス上の画面/カメラ/キャンバスや `system.run` などの追加
    機能を提供します。

    一般的なパターン:

    - Mac mini 上の Gateway（常時稼働）。
    - MacBook Pro が macOS アプリまたはノードホストを実行し、Gateway にペアリングします。
    - 確認するには `openclaw nodes status` / `openclaw nodes list` を使用します。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムバグが確認されています。
    安定した Gateway には **Node** を使用してください。

    それでも Bun を試したい場合は、WhatsApp/Telegram を使わない非本番 Gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は**人間の送信者の Telegram ユーザー ID**（数値）です。ボットのユーザー名ではありません。

    セットアップでは数値のユーザー ID のみを求めます。設定にレガシーの `@username` エントリがすでにある場合、`openclaw doctor --fix` が解決を試みることができます。

    より安全（サードパーティボットなし）:

    - ボットに DM してから、`openclaw logs --follow` を実行し、`from.id` を読み取ります。

    公式 Bot API:

    - ボットに DM してから、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読み取ります。

    サードパーティ（プライバシーは低め）:

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**で可能です。各送信者の WhatsApp **DM**（ピア `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を異なる `agentId` にバインドすると、各人がそれぞれ自分のワークスペースとセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用してください。各エージェントに独自のデフォルトモデルを与え、受信ルート（プロバイダーアカウントまたは特定のピア）を各エージェントにバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。[Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルで `brew` によりインストールされたツールが解決されるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用している brew プレフィックス）が含まれていることを確認してください。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="ハック可能な git インストールと npm インストールの違い">
    - **ハック可能な (git) インストール:** 完全なソースチェックアウトで、編集可能。コントリビューターに最適です。
      ローカルでビルドを実行でき、コード/ドキュメントをパッチできます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリなし。「ただ実行する」用途に最適です。
      更新は npm dist-tags から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使用します。
    これは**データを削除しません**。OpenClaw のコードインストールだけを変更します。
    状態（`~/.openclaw`）とワークスペース（`~/.openclaw/workspace`）はそのままです。

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

    インストーラーでも、どちらのモードも強制できます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [Backup strategy](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="GatewayはラップトップとVPSのどちらで実行すべきですか？">
    短い答え: **24時間365日の信頼性が必要なら、VPSを使ってください**。手間を最小限にしたく、
    スリープや再起動を許容できるなら、ローカルで実行します。

    **ラップトップ（ローカルGateway）**

    - **利点:** サーバー費用が不要、ローカルファイルへ直接アクセスできる、ブラウザーウィンドウを表示できる。
    - **欠点:** スリープやネットワーク切断 = 切断、OSアップデートや再起動で中断される、起動したままにする必要がある。

    **VPS / クラウド**

    - **利点:** 常時稼働、安定したネットワーク、ラップトップのスリープ問題がない、稼働状態を維持しやすい。
    - **欠点:** 多くの場合ヘッドレスで実行する（スクリーンショットを使う）、リモートファイルアクセスのみ、更新にはSSHが必要。

    **OpenClaw固有の注記:** WhatsApp/Telegram/Slack/Mattermost/DiscordはいずれもVPSから問題なく動作します。実質的なトレードオフは**ヘッドレスブラウザー**と表示されるウィンドウの違いだけです。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    **推奨デフォルト:** 以前にGatewayの切断が発生したことがあるならVPS。Macをアクティブに使っていて、ローカルファイルアクセスや表示されるブラウザーでのUI自動化が必要な場合は、ローカルが適しています。

  </Accordion>

  <Accordion title="専用マシンでOpenClawを実行することはどのくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨**します。

    - **専用ホスト（VPS/Mac mini/Raspberry Pi）:** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、稼働状態を維持しやすい。
    - **共有ラップトップ/デスクトップ:** テストやアクティブな利用にはまったく問題ありませんが、マシンがスリープまたは更新されると一時停止が発生することを想定してください。

    両方の利点を得たい場合は、Gatewayを専用ホストに置き、ローカルの画面/カメラ/実行ツール用にラップトップを**ノード**としてペアリングします。[ノード](/ja-JP/nodes)を参照してください。
    セキュリティガイダンスについては、[セキュリティ](/ja-JP/gateway/security)を読んでください。

  </Accordion>

  <Accordion title="VPSの最小要件と推奨OSは何ですか？">
    OpenClawは軽量です。基本的なGateway + 1つのチャットチャンネルの場合:

    - **絶対最小:** 1 vCPU、1GB RAM、約500MBディスク。
    - **推奨:** 余裕（ログ、メディア、複数チャンネル）のために1〜2 vCPU、2GB以上のRAM。Nodeツールとブラウザー自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS**（または最新のDebian/Ubuntu）を使ってください。Linuxのインストール手順はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPSホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClawをVMで実行できますか？要件は何ですか？">
    はい。VMはVPSと同じように扱ってください。常時稼働し、到達可能であり、有効にするGatewayと各チャンネルに十分な
    RAMが必要です。

    ベースラインのガイダンス:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャンネル、ブラウザー自動化、またはメディアツールを実行する場合は2GB以上のRAM。
    - **OS:** Ubuntu LTSまたは別の最新Debian/Ubuntu。

    Windowsを使っている場合は、デスクトップセットアップには**Windows Hub**を使います。または、幅広いツール互換性を備えた
    LinuxスタイルのGateway VMが特に必要な場合はWSL2を使います。
    [Windows](/ja-JP/platforms/windows)、[VPSホスティング](/ja-JP/vps)を参照してください。
    VMでmacOSを実行している場合は、[macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メインFAQ（モデル、セッション、gateway、セキュリティなど）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
