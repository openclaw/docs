---
read_when:
    - 新規インストール、オンボーディングが進まない場合、または初回実行エラー
    - 認証とプロバイダのサブスクリプションを選ぶ場合
    - docs.openclaw.ai にアクセスできない、dashboard を開けない、インストールが止まる შემთხვევაში
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期障害'
title: 'FAQ: 初回実行セットアップ'
x-i18n:
    generated_at: "2026-04-24T05:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  初回セットアップとクイックスタートに関する Q&A です。日常運用、モデル、認証、セッション、
  トラブルシューティングについてはメインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回セットアップ

  <AccordionGroup>
  <Accordion title="詰まった。最速で抜け出す方法は？">
    **あなたのマシンを見られる** ローカル AI エージェントを使ってください。これは Discord で質問するより
    はるかに効果的です。というのも、「詰まった」ケースの大半は **ローカル設定または環境の問題** であり、
    リモートの支援者には確認できないからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリを読み、コマンドを実行し、ログを確認し、マシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正を手伝えます。ハッカブルな
    （git）インストールを使って、**ソース一式のチェックアウト** を渡してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw は **git チェックアウトから** インストールされるため、エージェントはコードとドキュメントを読んで、
    現在実行している正確なバージョンに基づいて推論できます。あとで `--install-method git` なしで
    インストーラーを再実行すれば、いつでも stable に戻せます。

    ヒント: エージェントには、修正を **計画して監督** するよう依頼してください（ステップごと）。そのうえで
    必要なコマンドだけを実行します。そうすると変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけたら、ぜひ GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まず次のコマンドから始めてください（助けを求めるときは出力を共有してください）:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: gateway/agent の状態と基本設定の簡易スナップショット。
    - `openclaw models status`: プロバイダ認証とモデル可用性を確認します。
    - `openclaw doctor`: よくある設定/状態の問題を検証し、修復します。

    その他の便利な CLI チェック: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`。

    クイックデバッグループ: [何か壊れているときの最初の 60 秒](#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [Install](/ja-JP/install), [Installer flags](/ja-JP/install/installer), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続ける。スキップ理由は何を意味する？">
    よくある Heartbeat スキップ理由:

    - `quiet-hours`: 設定された active-hours ウィンドウ外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空かヘッダーだけの雛形しかない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、どのタスク間隔もまだ期限に達していない
    - `alerts-disabled`: Heartbeat の可視性がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行では、タスクは完了としてマークされません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法は？">
    リポジトリでは、ソースから実行しオンボーディングを使うことを推奨しています:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    このウィザードは UI アセットも自動でビルドできます。オンボーディング後、通常はポート **18789** で Gateway を実行します。

    ソースから（コントリビューター/開発者向け）:

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

  <Accordion title="オンボーディング後に dashboard を開くには？">
    ウィザードはオンボーディング直後に、クリーンな（トークン付きではない）dashboard URL でブラウザを開き、概要にもそのリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシン上で表示された URL をコピーして貼り付けてください。
  </Accordion>

  <Accordion title="localhost とリモートで dashboard を認証するには？">
    **localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められたら、設定済みの token または password を Control UI 設定に貼り付けます。
    - token の取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - password の取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ shared secret が設定されていない場合は、`openclaw doctor --generate-gateway-token` で token を生成してください。

    **localhost 以外:**

    - **Tailscale Serve**（推奨）: bind を loopback のままにし、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` なら、identity header が Control UI / WebSocket 認証を満たします（shared secret を貼り付ける必要はありません。信頼できる gateway ホストを前提とします）。ただし、意図的に private-ingress の `none` または trusted-proxy HTTP auth を使っていない限り、HTTP API には引き続き shared-secret 認証が必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth limiter に記録される前に直列化されるため、2 回目の不正リトライではすでに `retry later` と表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行するか（または password 認証を設定し）、`http://<tailscale-ip>:18789/` を開き、その後 dashboard 設定に一致する shared secret を貼り付けます。
    - **ID 認識リバースプロキシ**: Gateway を non-loopback の trusted proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、その proxy URL を開きます。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます。トンネル経由でも shared-secret 認証は引き続き適用されるため、求められたら設定済み token または password を貼り付けてください。

    bind モードと認証の詳細は [Dashboard](/ja-JP/web/dashboard) と [Web surfaces](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用に exec approval 設定が 2 つあるのはなぜ？">
    それぞれ別のレイヤーを制御しています:

    - `approvals.exec`: 承認プロンプトをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec 承認用のネイティブ承認クライアントとして動作させます

    ホスト exec ポリシーが依然として実際の承認ゲートです。チャット設定は、承認プロンプトがどこに表示され、
    人がどう応答できるかだけを制御します。

    ほとんどのセットアップでは **両方は不要** です:

    - チャットがすでにコマンドと返信をサポートしているなら、同一チャットの `/approve` が共有パス経由で動作します。
    - サポートされたネイティブチャネルが approver を安全に推定できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM 優先のネイティブ承認を自動有効化します。
    - ネイティブ承認カード/ボタンが使えるときは、そのネイティブ UI が主要経路です。エージェントは、ツール結果がチャット承認不可と示す場合、または手動承認が唯一の経路である場合にのみ、手動 `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な ops ルームにも転送する必要がある場合にのみ使ってください。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発信元のルーム/トピックにも明示的に投稿したい場合にのみ使ってください。
    - Plugin 承認はさらに別です。デフォルトでは同一チャットの `/approve` を使い、必要なら `approvals.plugin` 転送を使い、一部のネイティブチャネルだけがその上に plugin-approval-native 処理を維持します。

    短く言うと、転送はルーティング用、ネイティブクライアント設定はより豊かなチャネル固有 UX 用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway に Bun は **推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動く？">
    はい。Gateway は軽量です。ドキュメントでは個人利用に **512MB〜1GB RAM**、**1 コア**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で動作可能** とも書かれています。

    余裕（ログ、メディア、他サービス）が欲しいなら **2GB 推奨** ですが、
    これは絶対的な最小条件ではありません。

    ヒント: 小型の Pi / VPS で Gateway をホストし、ローカルの screen / camera / canvas
    やコマンド実行のために、ノート PC / 電話上の **nodes** をペアリングできます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのコツはある？">
    短く言うと、動きますが、多少の荒さは覚悟してください。

    - **64-bit** OS を使い、Node は 22 以上を維持してください。
    - ログ確認や迅速な更新のため、**ハッカブル（git）インストール** を推奨します。
    - 最初は channels / Skills なしで始めて、1 つずつ追加してください。
    - 変なバイナリ問題に当たったら、たいていは **ARM 互換性** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / onboarding が hatch しない。どうすればいい？">
    その画面は、Gateway に到達できて認証されていることを前提にしています。TUI も
    初回 hatch 時に「Wake up, my friend!」を自動送信します。この行が表示されて **返信がなく**、
    token が 0 のままなら、エージェントは実行されていません。

    1. Gateway を再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. status と認証を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも止まるなら、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gateway がリモートにある場合は、トンネル / Tailscale 接続が生きていることと、UI が
    正しい Gateway を向いていることを確認してください。[Remote access](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="セットアップを新しいマシン（Mac mini）へ移して、オンボーディングをやり直さずに済ませられる？">
    はい。**状態ディレクトリ** と **workspace** をコピーし、その後 Doctor を 1 回実行してください。これで
    **両方の場所** をコピーする限り、ボットを「まったく同じ状態」（memory、セッション履歴、認証、チャネル
    状態）で維持できます:

    1. 新しいマシンに OpenClaw をインストールします。
    2. 旧マシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これで設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。リモート
    モードの場合は、セッションストアと workspace を所有するのは gateway ホストであることを忘れないでください。

    **重要:** workspace だけを GitHub に commit / push している場合、それでバックアップしているのは
    **memory + ブートストラップファイル** だけであり、**セッション履歴や認証** ではありません。それらは
    `~/.openclaw/` 配下（たとえば `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [Migrating](/ja-JP/install/migrating), [ディスク上での保存場所](#where-things-live-on-disk),
    [Agent workspace](/ja-JP/concepts/agent-workspace), [Doctor](/ja-JP/gateway/doctor),
    [Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新版で何が新しいかはどこで分かる？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新エントリは上にあります。先頭セクションが **Unreleased** と表示されている場合は、次の日付付き
    セクションが最新のリリース版です。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs / その他のセクション）で
    グループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできない（SSL エラー）">
    一部の Comcast / Xfinity 回線では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。無効化するか `docs.openclaw.ai` を許可リストに追加して、再試行してください。
    解除に協力していただける場合は、こちらで報告してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    それでもサイトに到達できない場合、ドキュメントは GitHub にもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違いは？">
    **Stable** と **beta** は、別々のコードラインではなく **npm dist-tag** です:

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格ステップで同じバージョンが `latest` に移されます。必要に応じて、メンテナーが
    直接 `latest` に公開することもあります。だからこそ、昇格後は beta と stable が
    **同じバージョン** を指すことがあります。

    変更内容はこちら:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta 版をインストールする方法と、beta と dev の違いは？">
    **Beta** は npm dist-tag の `beta` です（昇格後は `latest` と同じになることがあります）。
    **Dev** は `main` の移動する先端（git）です。公開される場合は npm dist-tag `dev` を使います。

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

  <Accordion title="最新のものを試すには？">
    方法は 2 つあります:

    1. **Dev チャネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチへ切り替わり、ソースから更新されます。

    2. **ハッカブルインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これによりローカルリポジトリが得られ、自分で編集し、その後 git 経由で更新できます。

    手動でクリーンな clone を行いたい場合は、次を使ってください:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/ja-JP/cli/update), [Development channels](/ja-JP/install/development-channels),
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングは通常どのくらいかかる？">
    おおよその目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 設定するチャネル/モデル数によって 5〜15 分

    ハングした場合は [Installer stuck](#quick-start-and-first-run-setup)
    と [I am stuck](#quick-start-and-first-run-setup) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まる。もっと情報を出すには？">
    **verbose 出力** 付きでインストーラーを再実行してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose 付き beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    ハッカブル（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等手順:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git not found または openclaw not recognized と言われる">
    よくある Windows の問題は 2 つあります:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に入っていることを確認してください。
    - PowerShell を閉じて開き直し、その後インストーラーを再実行してください。

    **2) インストール後に openclaw is not recognized と言われる**

    - npm のグローバル bin フォルダが PATH に入っていません。
    - パスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` サフィックスは不要です。大半のシステムでは `%AppData%\npm` です）。
    - PATH 更新後、PowerShell を閉じて開き直してください。

    もっともスムーズな Windows セットアップを望むなら、ネイティブ Windows ではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語テキストが文字化けする。どうすればいい？">
    これは通常、ネイティブ Windows シェルでのコンソールコードページ不一致です。

    症状:

    - `system.run` / `exec` 出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShell での一時回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gateway を再起動してコマンドを再試行してください:

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡 / 報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントに答えがなかった。より良い答えを得るには？">
    **ハッカブル（git）インストール** を使ってソースとドキュメント一式をローカルに置き、そのフォルダから
    あなたのボット（または Claude/Codex）に質問してください。そうすればリポジトリを読んで正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするには？">
    短く言うと、Linux ガイドに従い、その後オンボーディングを実行してください。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするには？">
    どの Linux VPS でも動作します。サーバーにインストールし、SSH / Tailscale を使って Gateway に到達してください。

    ガイド: [exe.dev](/ja-JP/install/exe-dev), [Hetzner](/ja-JP/install/hetzner), [Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS インストールガイドはどこ？">
    一般的なプロバイダをまとめた **hosting hub** があります。1 つ選んでガイドに従ってください:

    - [VPS hosting](/ja-JP/vps)（全プロバイダを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で動作** し、そこへノート PC / 電話から
    Control UI（または Tailscale / SSH）でアクセスします。状態 + workspace は
    サーバー上にあるため、ホストをソースオブトゥルースとして扱い、バックアップを取ってください。

    cloud Gateway に **nodes**（Mac / iOS / Android / headless）をペアリングして、
    Gateway はクラウドに置いたまま、ローカルの screen / camera / canvas へアクセスしたり、
    ノート PC 上でコマンドを実行したりできます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    Nodes: [Nodes](/ja-JP/nodes), [Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させられる？">
    短く言うと: **可能ですが、推奨しません**。更新フローで
    Gateway が再起動されることがあり（その場合アクティブセッションが切れます）、
    クリーンな git checkout が必要になる場合もあり、
    確認プロンプトも出ることがあります。より安全なのは、オペレーターとしてシェルから更新することです。

    CLI を使ってください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    どうしてもエージェントから自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/ja-JP/cli/update), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際に何をする？">
    `openclaw onboard` は推奨セットアップ経路です。**ローカルモード** では、次を順に案内します:

    - **モデル / 認証セットアップ**（プロバイダ OAuth、API キー、Anthropic setup-token、さらに LM Studio などのローカルモデルオプション）
    - **Workspace** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind / port / auth / tailscale）
    - **チャネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、および QQ Bot などの同梱チャネル Plugin）
    - **daemon インストール**（macOS では LaunchAgent、Linux / WSL2 では systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定したモデルが未知または認証未設定の場合にも警告します。

  </Accordion>

  <Accordion title="これを動かすのに Claude や OpenAI のサブスクリプションは必要？">
    いいえ。OpenClaw は **API キー**（Anthropic / OpenAI / その他）でも、
    **ローカル専用モデル** でも動かせるため、データをデバイス上に留められます。サブスクリプション（Claude
    Pro / Max または OpenAI Codex）は、それらのプロバイダへ認証するための任意の方法です。

    OpenClaw における Anthropic について、実際的な区分は次のとおりです:

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから
      この使い方は再度許可されていると伝えられており、Anthropic が新しいポリシーを公開しない限り、
      OpenClaw はこの統合における `claude -p` 利用を認可済みとして扱います

    長期間稼働する gateway ホストでは、依然として Anthropic API キーのほうが
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツール向けに明示的にサポートされています。

    OpenClaw は他にも、ホスト型サブスクリプション系オプションとして
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** をサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic), [OpenAI](/ja-JP/providers/openai),
    [Qwen Cloud](/ja-JP/providers/qwen),
    [MiniMax](/ja-JP/providers/minimax), [GLM Models](/ja-JP/providers/glm),
    [ローカルモデル](/ja-JP/gateway/local-models), [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使える？">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられているため、
    Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude サブスクリプション認証と
    `claude -p` 利用をこの統合向けに認可済みとして扱います。もっとも予測しやすいサーバーサイドセットアップが必要なら、
    代わりに Anthropic API キーを使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）をサポートしている？">
    はい。

    Anthropic スタッフから、この使い方は再度許可されていると伝えられているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、
    Claude CLI 再利用と `claude -p` 利用をこの統合向けに認可済みとして扱います。

    Anthropic setup-token も、サポートされた OpenClaw トークン経路として引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI 再利用と `claude -p` を優先します。
    本番運用またはマルチユーザーワークロードでは、Anthropic API キー認証のほうが
    依然として安全で予測しやすい選択です。OpenClaw の他のサブスクリプション系ホスト型
    オプションについては、[OpenAI](/ja-JP/providers/openai), [Qwen / Model
    Cloud](/ja-JP/providers/qwen), [MiniMax](/ja-JP/providers/minimax), [GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が出るのはなぜ？">
    それは、現在のウィンドウで **Anthropic のクォータ / レート制限** を使い切ったことを意味します。**Claude CLI** を
    使っている場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API キー** を
    使っている場合は、Anthropic Console で使用量 / 課金を確認し、
    必要に応じて上限を引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropic の 1M コンテキスト beta（`context1m: true`）を使おうとしています。これは
    あなたの認証情報が長文コンテキスト課金対象である場合にのみ動作します（API キー課金、または
    Extra Usage が有効な OpenClaw Claude-login パス）。

    ヒント: **フォールバックモデル** を設定しておくと、あるプロバイダがレート制限に達しても OpenClaw は返信を続けられます。
    [Models](/ja-JP/cli/models), [OAuth](/ja-JP/concepts/oauth), および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされている？">
    はい。OpenClaw には同梱の **Amazon Bedrock (Converse)** プロバイダがあります。AWS の env マーカーが存在すれば、OpenClaw はストリーミング/テキスト対応の Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダとしてマージできます。そうでない場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動のプロバイダエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。管理されたキー経路を好むなら、Bedrock の前段に OpenAI 互換プロキシを置く方法も有効です。
  </Accordion>

  <Accordion title="Codex 認証はどう動く？">
    OpenClaw は **OpenAI Code (Codex)** を OAuth（ChatGPT サインイン）経由でサポートしています。デフォルト PI ランナー経由の Codex OAuth には
    `openai-codex/gpt-5.5` を使ってください。現在の直接 OpenAI API キーアクセスには
    `openai/gpt-5.4` を使ってください。GPT-5.5 の直接
    API キーアクセスは、OpenAI が公開 API で有効化し次第サポートされます。現時点では
    GPT-5.5 は `openai-codex/gpt-5.5` によるサブスクリプション/OAuth、または
    `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"` によるネイティブ Codex
    app-server 実行を使います。
    [Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="なぜ OpenClaw はまだ openai-codex に言及するの？">
    `openai-codex` は ChatGPT/Codex OAuth 用のプロバイダおよび auth-profile ID です。
    これは Codex OAuth 用の明示的な PI モデル接頭辞でもあります:

    - `openai/gpt-5.4` = PI における現在の直接 OpenAI API キー経路
    - `openai/gpt-5.5` = OpenAI が API で GPT-5.5 を有効化した後の将来の直接 API キー経路
    - `openai-codex/gpt-5.5` = PI における Codex OAuth 経路
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = ネイティブ Codex app-server 経路
    - `openai-codex:...` = auth profile ID であり、モデル参照ではありません

    OpenAI Platform の直接課金/上限経路を使いたい場合は、
    `OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション認証を使いたい場合は、
    `openclaw models auth login --provider openai-codex` でサインインし、
    PI 実行には `openai-codex/*` モデル参照を使ってください。

  </Accordion>

  <Accordion title="なぜ Codex OAuth の制限は ChatGPT Web と異なることがあるの？">
    Codex OAuth は、OpenAI 管理のプラン依存クォータウィンドウを使います。実際には、
    両方が同じアカウントに紐付いていても、その制限は ChatGPT ウェブサイト / アプリの体験と
    異なることがあります。

    OpenClaw は `openclaw models status` で、現在見えているプロバイダの使用量 / クォータウィンドウを
    表示できますが、ChatGPT Web の権利を直接 API アクセスとして
    発明したり正規化したりはしません。OpenAI Platform の直接課金/上限経路を使いたいなら、
    API キー付きの `openai/*` を使ってください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされている？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール / ワークフローでのサブスクリプション OAuth 利用を
    明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth), [Model providers](/ja-JP/concepts/model-providers), および [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどうセットアップする？">
    Gemini CLI は **Plugin 認証フロー** を使い、`openclaw.json` に client id や secret を書く方式ではありません。

    手順:

    1. Gemini CLI をローカルにインストールし、`gemini` が `PATH` 上にあるようにします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway ホストに `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください

    これにより OAuth トークンは gateway ホスト上の auth profile に保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="ローカルモデルは気軽なチャット用途なら大丈夫？">
    通常はだめです。OpenClaw には大きなコンテキストと強い安全性が必要であり、小さい GPU では切り詰めと漏洩が起きます。どうしても使うなら、ローカルで実行できる **最大** のモデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。より小さい / 量子化モデルはプロンプトインジェクションリスクを高めます。 [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定リージョンに留めるには？">
    リージョン固定エンドポイントを選んでください。OpenRouter は MiniMax、Kimi、GLM に対して米国内ホストなどの選択肢を提供しています。データをそのリージョン内に留めるには US-hosted バリアントを選んでください。`models.mode: "merge"` を使えば Anthropic / OpenAI を並べて保持できるため、選択したリージョン指定プロバイダを尊重しつつ、フォールバックも利用可能なままにできます。
  </Accordion>

  <Accordion title="これをインストールするのに Mac Mini を買う必要がある？">
    いいえ。OpenClaw は macOS または Linux で動作します（Windows は WSL2 経由）。Mac mini は任意です。常時稼働ホストとして買う人もいますが、小型 VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動きます。

    Mac が必要なのは **macOS 専用ツール** の場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles サーバーは任意の Mac 上で動作し、Gateway は Linux など別の場所で動かせます。その他の macOS 専用ツールが必要なら、Gateway を Mac 上で動かすか、macOS node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes), [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要？">
    Messages にサインインした **何らかの macOS デバイス** が必要です。Mac mini である必要はなく、
    どの Mac でも構いません。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux など別の場所で動かせます。

    よくある構成:

    - Gateway は Linux / VPS 上で動かし、BlueBubbles サーバーは Messages にサインインした任意の Mac 上で動かす。
    - もっとも単純な 1 台構成にしたいなら、すべてをその Mac 上で動かす。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes),
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を動かすために Mac mini を買った場合、MacBook Pro につなげられる？">
    はい。**Mac mini で Gateway を動かし**、MacBook Pro を
    **node**（コンパニオンデバイス）として接続できます。node は Gateway を実行するのではなく、
    そのデバイス上の screen / camera / canvas や `system.run` のような追加機能を提供します。

    よくある構成:

    - Mac mini 上に Gateway（常時稼働）。
    - MacBook Pro で macOS アプリまたは node host を動かし、Gateway とペアリングする。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使う。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使える？">
    Bun は **推奨されません**。特に WhatsApp と Telegram でランタイムバグが見られます。
    安定した gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、WhatsApp / Telegram を使わない
    非本番 gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れる？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram user ID**（数値）です。bot の username ではありません。

    セットアップでは数値 user ID のみを求めます。すでに設定に旧来の `@username` エントリがある場合は、`openclaw doctor --fix` で解決を試みられます。

    より安全な方法（サードパーティ bot なし）:

    - bot に DM を送り、その後 `openclaw logs --follow` を実行し、`from.id` を読み取る。

    公式 Bot API:

    - bot に DM を送り、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読み取る。

    サードパーティ（プライバシーは低い）:

    - `@userinfobot` または `@getidsbot` に DM する。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数人が 1 つの WhatsApp 番号を使って、別々の OpenClaw インスタンスを使える？">
    はい。**multi-agent ルーティング** を使えば可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を別の `agentId` にバインドすれば、各人が自分専用の workspace とセッションストアを持てます。返信は引き続き **同じ WhatsApp アカウント** から送られ、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）はその WhatsApp アカウント単位でグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを分けて動かせる？'>
    はい。multi-agent ルーティングを使ってください。各エージェントに独自のデフォルトモデルを持たせ、そのうえで受信ルート（プロバイダアカウントまたは特定 peer）を各エージェントにバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。 [Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux でも動く？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw を systemd 経由で動かす場合は、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（またはあなたの brew prefix）が含まれていることを確認してください。そうしないと、`brew` でインストールしたツールが非ログインシェルで解決されません。
    最近のビルドでは、Linux systemd サービス上で一般的なユーザー bin ディレクトリ（たとえば `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も prepend し、`PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` が設定されていればそれも尊重します。

  </Accordion>

  <Accordion title="ハッカブル git install と npm install の違いは？">
    - **ハッカブル（git）インストール:** ソース一式の checkout。編集可能。コントリビューター向けに最適。
      ローカルでビルドし、コード / ドキュメントを修正できます。
    - **npm install:** グローバル CLI インストール。リポジトリなし。「とにかく動かす」用途に最適。
      更新は npm dist-tag から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとで npm と git install を切り替えられる？">
    はい。もう一方の方法でインストールし、その後 Doctor を実行して gateway サービスが新しいエントリポイントを指すようにしてください。
    これで **データは削除されません**。変わるのは OpenClaw コードのインストール方法だけです。状態
    （`~/.openclaw`）と workspace（`~/.openclaw/workspace`）はそのまま残ります。

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

    Doctor は gateway サービスのエントリポイント不一致を検出し、現在のインストールに合わせてサービス設定を書き換えることを提案します（自動化では `--repair` を使ってください）。

    バックアップのヒント: [Backup strategy](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノート PC と VPS のどちらで動かすべき？">
    短く言うと、**24/7 の信頼性が欲しいなら VPS** です。もっとも手軽さを優先し、スリープ / 再起動を許容できるならローカルで動かしてください。

    **ノート PC（ローカル Gateway）**

    - **利点:** サーバー費用なし、ローカルファイルへ直接アクセス、ライブのブラウザウィンドウ。
    - **欠点:** スリープ / ネットワーク切断 = 切断、OS 更新 / 再起動で中断、起動し続ける必要がある。

    **VPS / cloud**

    - **利点:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題なし、稼働維持が容易。
    - **欠点:** headless で動かすことが多い（スクリーンショット利用）、ファイルアクセスはリモートのみ、更新には SSH が必要。

    **OpenClaw 固有の注記:** WhatsApp / Telegram / Slack / Mattermost / Discord はすべて VPS から問題なく動作します。実際のトレードオフは **headless browser** と可視ブラウザウィンドウの違いだけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に gateway 切断があったなら VPS。ローカルファイルアクセスや可視ブラウザを使った UI 自動化が必要で、Mac を積極的に使っているときはローカルが最適です。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで動かすことはどれくらい重要？">
    必須ではありませんが、**信頼性と分離のために推奨** です。

    - **専用ホスト（VPS / Mac mini / Pi）:** 常時稼働、スリープ / 再起動による中断が少ない、権限が整理しやすい、稼働維持が容易。
    - **共有ノート PC / デスクトップ:** テストやアクティブ利用にはまったく問題ありませんが、マシンがスリープしたり更新されたりすると停止が発生します。

    いいとこ取りをしたいなら、Gateway は専用ホストに置き、ノート PC はローカルの screen / camera / exec ツール用 **node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティガイダンスは [Security](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は？">
    OpenClaw は軽量です。基本的な Gateway + 1 チャットチャネルなら:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 1〜2 vCPU、2GB RAM 以上（ログ、メディア、複数チャネルの余裕のため）。Node ツールや browser 自動化はリソースを食うことがあります。

    OS は **Ubuntu LTS**（または最近の Debian / Ubuntu 系）を使ってください。Linux のインストール経路はそこで最もよく検証されています。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を動かせる？ 必要条件は？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能であり、
    Gateway と有効化するチャネルに十分な RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、browser 自動化、メディアツールを使うなら 2GB RAM 以上。
    - **OS:** Ubuntu LTS または最近の Debian / Ubuntu 系。

    Windows の場合、**WSL2 がもっとも簡単な VM 風セットアップ** であり、ツール互換性も最良です。[Windows](/ja-JP/platforms/windows), [VPS hosting](/ja-JP/vps) を参照してください。
    macOS を VM 上で動かしている場合は [macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（モデル、セッション、gateway、セキュリティなど）
- [Install overview](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [Troubleshooting](/ja-JP/help/troubleshooting)
