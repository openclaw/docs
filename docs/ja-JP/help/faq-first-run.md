---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行エラー
    - 認証とプロバイダーサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが止まっている
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー'
title: 'よくある質問: 初回セットアップ'
x-i18n:
    generated_at: "2026-07-05T11:29:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d84968e13ae48ff730e0107363d4d44abc644b9dccf12d05888f1c51ed1ed5
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行の Q&A。日常的な操作、モデル、認証、セッション、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回実行セットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で抜け出す方法">
    **あなたのマシンを見られる**ローカル AI エージェントを使ってください。「行き詰まった」ケースの多くは、
    リモートの支援者が確認できない**ローカル設定または環境の問題**なので、
    Discord で質問するより効果的です。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    hackable (git) インストールでエージェントに完全なソースチェックアウトを渡し、
    コード + ドキュメントを読ませて、実行している正確なバージョンについて推論できるようにします。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    エージェントに修正を段階的に計画・監督させ、その後で必要なコマンドだけを実行してください。
    差分が小さいほど監査しやすくなります。

    支援を求めるときは、これらの出力を共有してください（Discord または GitHub issue）。

    | コマンド | 表示内容 |
    | --- | --- |
    | `openclaw status` | Gateway/エージェントの健全性 + 基本設定スナップショット |
    | `openclaw status --all` | 貼り付け可能な、完全な読み取り専用診断 |
    | `openclaw models status` | プロバイダー認証 + モデルの利用可否 |
    | `openclaw doctor` | 一般的な設定/状態の問題を検証して修復 |
    | `openclaw logs --follow` | ライブログの末尾表示 |
    | `openclaw gateway status --deep` | Gateway/設定/Plugin の詳細な健全性チェック |
    | `openclaw health --verbose` | 詳細な健全性レポート |

    実際のバグや修正を見つけましたか？issue を作成するか PR を送ってください。
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls)。

    クイックデバッグループ: [何かが壊れているときの最初の60秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーのフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続ける。スキップ理由は何を意味しますか？">
    | スキップ理由 | 意味 |
    | --- | --- |
    | `quiet-hours` | 設定されたアクティブ時間帯の外 |
    | `empty-heartbeat-file` | `HEARTBEAT.md` は存在するが、空白、コメント、ヘッダー、フェンス、または空のチェックリストのひな形しかない |
    | `no-tasks-due` | タスクモードは有効だが、まだ期限に達したタスク間隔がない |
    | `alerts-disabled` | Heartbeat の表示がすべてオフ（`showOk`、`showAlerts`、`useIndicator` がすべて無効） |

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が完了した後にのみ進みます。
    スキップされた実行は、タスクを完了済みとしてマークしません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールしていない場合は、代わりに `pnpm openclaw onboard` を実行してください。Control UI アセットが
    見つからない場合、オンボーディングはそれらを自動でビルドしようとし、失敗した場合は `pnpm ui:build` にフォールバックします。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くには？">
    オンボーディングは、セットアップ直後にクリーンな（トークン化されていない）ダッシュボード URL をブラウザーで開き、
    サマリーにリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、
    表示された URL を同じマシンでコピー/貼り付けしてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットを設定していない場合は、`openclaw doctor --generate-gateway-token`（または `openclaw doctor --fix --generate-gateway-token`）を実行します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: バインドは loopback のままにし、`openclaw gateway --tailscale serve` を実行して、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale: true` の場合、ID ヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付けは不要で、信頼された Gateway ホストを前提とします）。HTTP API では、private-ingress `none` または trusted-proxy HTTP 認証を意図的に使わない限り、引き続き共有シークレット認証が必要です。
      同じクライアントからの同時の不正認証 Serve 試行は、失敗認証リミッターに記録される前に直列化されるため、2回目の不正な再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet バインド**: `openclaw gateway --bind tailnet --token "<token>"` を実行（またはパスワード認証を設定）し、`http://<tailscale-ip>:18789/` を開いて、一致する共有シークレットをダッシュボード設定に貼り付けます。
    - **ID 対応リバースプロキシ**: Gateway を信頼済みプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定して、プロキシ URL を開きます。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback: true` が必要です。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。トンネル越しでも共有シークレット認証は適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けてください。

    バインドモードと認証の詳細は、[ダッシュボード](/ja-JP/web/dashboard) と [Web サーフェス](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認に exec 承認設定が2つあるのはなぜですか？">
    それぞれ異なる層を制御します。

    - `approvals.exec` - 承認プロンプトをチャット送信先へ転送します。
    - `channels.<channel>.execApprovals` - そのチャンネルを exec 承認のネイティブ承認クライアントにします。

    ホストの exec ポリシーが引き続き実際の承認ゲートです。チャット設定は、プロンプトをどこに表示し、
    どのように回答するかだけを制御します。

    両方が必要になることはほとんどありません。

    - チャットがすでにコマンドと返信に対応している場合、同じチャットの `/approve` は共有パスを通じて機能します。
    - 対応しているネイティブチャンネルが承認者を安全に推論できる場合、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` なら、OpenClaw は DM 優先のネイティブ承認を自動で有効にします。
    - ネイティブ承認カード/ボタンが利用できる場合、その UI が主になります。手動の `/approve` コマンドに言及するのは、ツール結果がチャット承認を利用できないと示す場合だけです。
    - プロンプトを他のチャットや明示的な運用ルームにも届ける必要がある場合にのみ、`approvals.exec` を使います。
    - 承認プロンプトを発信元のルーム/トピックへ投稿したい場合にのみ、`channels.<channel>.execApprovals.target: "channel"` または `"both"` を使います。
    - Plugin 承認は別です。既定では同じチャットの `/approve`、任意の `approvals.plugin` 転送があり、一部のネイティブチャンネルだけがそれらにもネイティブ処理を維持します。

    短く言うと、転送はルーティングのため、ネイティブクライアント設定はより豊かなチャンネル固有 UX のためです。
    [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは？">
    Node **22.19+** が必要です（Node 24 推奨）。`pnpm` はリポジトリのパッケージマネージャーです。
    Bun は Gateway には**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか？">
    はい。ただし、まず RAM を確認してください。Pi 5 と Pi 4（2 GB+）が最適です。Pi 3B+（1 GB）は動作しますが遅く、Pi Zero 2 W（512 MB）は推奨されません。

    | モデル | RAM | 適合度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最適 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | OK、swap を追加 |
    | Pi 4 | 1 GB | 厳しい |
    | Pi 3B+ | 1 GB | 遅い |
    | Pi Zero 2 W | 512 MB | 非推奨 |

    絶対最小要件: 1 GB RAM、1 コア、500 MB の空きディスク、64-bit OS。Pi は
    Gateway だけを実行するため（モデルはクラウド API を呼び出します）、控えめな Pi でも負荷を処理できます。

    小さな Pi/VPS で Gateway だけをホストし、ローカル画面/カメラ/canvas またはコマンド実行のために
    ラップトップ/スマートフォン上の**ノード**をペアリングすることもできます。[ノード](/ja-JP/nodes) を参照してください。

    完全なセットアップ手順: [Raspberry Pi](/ja-JP/install/raspberry-pi)。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのヒントはありますか？">
    - **64-bit** OS を使ってください。32-bit Raspberry Pi OS は使わないでください。
    - 2 GB 以下のボードでは swap を追加してください。
    - パフォーマンスと寿命のために、SD カードより **USB SSD** を推奨します。
    - ログを確認して素早く更新できるように、hackable (git) インストールを推奨します。
    - チャンネル/Skills なしで開始し、1つずつ追加してください。
    - 奇妙なバイナリ失敗（「exec format error」）は、通常、任意の skill ツールに ARM64 ビルドがないことが原因です。

    完全ガイド: [Raspberry Pi](/ja-JP/install/raspberry-pi)。[Linux](/ja-JP/platforms/linux) も参照してください。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが hatch しない。どうすればよいですか？">
    その画面は Gateway に到達可能で、認証済みであることに依存します。TUI も初回 hatch 時に
    「Wake up, my friend!」を自動送信します。その行が表示されても**返信がなく**、
    トークンが 0 のままなら、エージェントは実行されていません。

    1. Gateway を再起動します。

    ```bash
    openclaw gateway restart
    ```

    2. ステータス + 認証を確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. まだ止まっていますか？次を実行してください。

    ```bash
    openclaw doctor
    ```

    Gateway がリモートの場合は、トンネル/Tailscale 接続が起動しており、UI が正しい Gateway を
    指していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、セットアップを新しいマシンへ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーし、その後 Doctor を一度実行します。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（既定: `~/.openclaw`）をコピーします。
    3. ワークスペース（既定: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。
    **両方**の場所をコピーする限り、ボットはまったく同じ状態のままです。リモートモードでは、
    Gateway ホストがセッションストアとワークスペースを所有します。

    **重要:** ワークスペースだけを GitHub に commit/push した場合、バックアップされるのは
    **メモリ + bootstrap ファイル**であり、セッション履歴や認証は含まれません。それらは
    `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [移行](/ja-JP/install/migrating)、[ディスク上の配置場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリは上部にあります。最上部のセクションが **Unreleased** の場合、次の日付付き
    セクションが最新のリリース済みバージョンです。エントリは **Highlights**、**Changes**、
    **Fixes**（必要に応じて docs/その他のセクションも）にグループ化されます。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできない（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security により `docs.openclaw.ai` が誤ってブロックされます。これを無効にするか `docs.openclaw.ai` を許可リストに追加し、再試行してください。ブロック解除に協力してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    まだブロックされていますか？ドキュメントは GitHub にミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tags** です:

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド（beta がない場合、または現在の安定リリースより古い場合は `latest` にフォールバック）

    安定リリースは通常、まず **beta** に入り、その後、明示的な昇格ステップで
    バージョン番号を変えずに同じバージョンを `latest` に移します。メンテナーは
    `latest` に直接公開することもできます。そのため、昇格後は beta と stable が
    **同じバージョン** を指す場合があります。

    変更内容を見る: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

    インストール用のワンライナーと beta と dev の違いについては、次のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta バージョンをインストールするにはどうすればよく、beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動する先端（git）です。npm に公開される場合は dist-tag `dev` を使います。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）: `iwr -useb https://openclaw.ai/install.ps1 | iex`

    詳細: [開発チャンネル](/ja-JP/install/development-channels) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビットを試すにはどうすればよいですか？">
    2 つの選択肢があります。

    1. **Dev チャンネル（既存のインストール）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` の git checkout に切り替え、upstream に rebase し、ビルドして、その checkout から
    CLI をインストールします。

    2. **変更しやすい（git）インストール（新しいマシン）:**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    手動 clone を優先する場合:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どのくらいかかりますか？">
    目安:

    - **インストール:** 2〜5 分。
    - **クイックスタートのオンボーディング:** 数分（loopback gateway、自動トークン、デフォルト workspace）。
    - **高度/完全なオンボーディング:** provider のサインイン、チャンネルのペアリング、daemon のインストール、ネットワークダウンロード、または Skills に追加セットアップが必要な場合は長くなります。

    ウィザードはこのタイムラインを最初に表示します。任意ステップはスキップし、後で
    `openclaw configure` で戻れます。

    止まっていますか？上の [行き詰まっています](#quick-start-and-first-run-setup) を参照してください。

  </Accordion>

  <Accordion title="インストーラーが止まっていますか？より詳しいフィードバックを得るにはどうすればよいですか？">
    `--verbose` を付けて再実行します。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` には専用の verbose スイッチがありません。代わりに `Set-PSDebug -Trace 1` /
    `-Trace 0` でラップしてください。完全なフラグリファレンス: [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows のインストールで git が見つからない、または openclaw が認識されないと表示されます">
    Windows でよくある問題は 2 つあります。

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH 上にあることを確認します。
    - PowerShell を閉じて開き直し、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm global bin フォルダーが PATH 上にありません。
    - 確認する: `npm config get prefix`。
    - そのディレクトリをユーザー PATH に追加します（`\bin` サフィックスは不要です。多くのシステムでは `%AppData%\npm` です）。
    - PowerShell を閉じて開き直します。

    デスクトップアプリを使いたいですか？**Windows Hub** を使ってください。ターミナルのみのセットアップでは、PowerShell
    インストーラーと WSL2 Gateway パスの両方がサポートされています。Docs: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec の出力で中国語テキストが文字化けします - どうすればよいですか？">
    通常はネイティブ Windows シェルでのコンソールコードページの不一致です。

    症状: `system.run`/`exec` の出力で中国語が文字化けして表示されます。同じコマンドは
    別のターミナルプロファイルでは正常に見えます。

    PowerShell での回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後 Gateway を再起動して再試行します。

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でもまだ再現しますか？追跡/報告してください: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)。

  </Accordion>

  <Accordion title="Docs では質問が解決しませんでした - よりよい回答を得るにはどうすればよいですか？">
    変更しやすい（git）インストールを使い、完全なソースと docs をローカルに用意してから、
    bot（または Claude/Codex）に **そのフォルダーから** 質問してください。repo を読んで正確に回答できます。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [インストール](/ja-JP/install) と [インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか？">
    - Linux のクイックパス + service インストール: [Linux](/ja-JP/platforms/linux)。
    - 完全なウォークスルー: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか？">
    どの Linux VPS でも使えます。サーバーにインストールし、その後 SSH/Tailscale 経由で Gateway に到達します。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS インストールガイドはどこにありますか？">
    一般的な provider をまとめたホスティングハブ:

    - [VPS ホスティング](/ja-JP/vps)（すべての provider を 1 か所に）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    cloud では、**Gateway はサーバー上で実行**され、ラップトップ/スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態 + workspace はサーバー上にあるため、
    その host を信頼できるソースとして扱い、バックアップしてください。

    **nodes**（Mac/iOS/Android/headless）をその cloud Gateway にペアリングすると、Gateway を
    cloud に置いたまま、ラップトップ上でローカルの screen/camera/canvas またはコマンド実行を使えます。

    ハブ: [プラットフォーム](/ja-JP/platforms)。リモートアクセス: [Gateway リモート](/ja-JP/gateway/remote)。
    ノード: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか？">
    可能ですが、推奨しません。更新フローは Gateway を再起動する場合があり（アクティブセッションが切断されます）、
    clean な git checkout が必要になる場合があり、確認を求める場合もあります。
    operator として shell から更新を実行する方が安全です。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    agent から自動化する場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [更新](/ja-JP/cli/update)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際に何をしますか？">
    `openclaw onboard` は推奨されるセットアップパスです。**local mode** では次を順に案内します。

    1. **Model/Auth** - provider OAuth、API keys、または手動 auth（LM Studio などのローカルオプションを含む）。デフォルトモデルを選びます。
    2. **Workspace** - 場所 + bootstrap files。
    3. **Gateway** - port、bind address、auth mode、Tailscale exposure。
    4. **Channels** - built-in および公式 Plugin の chat channels: iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp など。
    5. **Daemon** - LaunchAgent（macOS）、systemd user unit（Linux/WSL2）、または native Windows Scheduled Task。
    6. **Health check** - Gateway を起動し、実行中であることを検証します。
    7. **Skills** - 推奨 skills と任意 dependencies をインストールします。

    最初に所要時間の目安を示し、設定済みモデルが不明、または auth がない場合は警告します。
    完全な内訳: [オンボーディング（CLI）](/ja-JP/start/wizard)。

  </Accordion>

  <Accordion title="これを実行するには Claude または OpenAI のサブスクリプションが必要ですか？">
    いいえ。**API keys**（Anthropic/OpenAI/その他）または **local-only models** で OpenClaw を実行でき、
    データはデバイス上に残ります。サブスクリプション（Claude Pro/Max、ChatGPT/Codex）は
    それらの provider を認証する任意の方法です。

    Anthropic について: **API key** は標準の従量課金を提供します。**Claude CLI** は同じ host 上の既存の Claude Code login を再利用します。Anthropic は現在、
    Claude CLI の非対話型 `claude -p` パスを Agent SDK/programmatic usage として扱い、
    それでもサブスクリプションのプラン制限から消費されます。サブスクリプションの挙動に依存する前に、現在の Anthropic billing
    docs を確認してください。長期間稼働する gateway hosts や共有
    automation では、Anthropic API key の方が予測しやすい選択です。

    OpenAI Codex OAuth（ChatGPT/Codex サブスクリプション）は agent models で完全にサポートされています。
    OpenClaw は **Qwen Cloud
    Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan** など、hosted subscription-style options もサポートしています。

    Docs: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI (GLM)](/ja-JP/providers/zai)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API key なしで Claude Max サブスクリプションを使えますか？">
    はい。OpenClaw は Pro/Max/Team/Enterprise プランで Claude CLI 再利用をサポートしています。Anthropic は
    現在、OpenClaw が使う `claude -p` パスを、個別の無料枠ではなく、プラン制限の対象となる subscription-plan usage として扱っています。
    現在の billing の詳細と Anthropic 自身のサポート記事へのリンクについては
    [Anthropic](/ja-JP/providers/anthropic) を参照してください。最も予測しやすいサーバー側セットアップには、代わりに
    Anthropic API key を使ってください。
  </Accordion>

  <Accordion title="Claude サブスクリプション auth（Claude Pro または Max）はサポートされていますか？">
    はい、Claude CLI 再利用経由です。Anthropic の `claude -p`/Agent SDK usage の billing 扱いは
    時間とともに変わってきました。特定の billing 挙動に依存する前に、現在の状態と
    Anthropic のサポート記事への日付付きリンクについて [Anthropic](/ja-JP/providers/anthropic) を参照してください。

    Anthropic setup-token auth も引き続きサポートされている token path ですが、OpenClaw は
    利用可能な場合、Claude CLI 再利用と `claude -p` を優先します。本番環境または multi-user
    workloads では、Anthropic API key が引き続きより安全で予測しやすい選択です。その他の
    subscription-style hosted options: [OpenAI](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI (GLM)](/ja-JP/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    現在の window で **Anthropic quota/rate limit** を使い切っています。**Claude
    CLI** では、window がリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API key** では、
    Anthropic Console で usage/billing を確認し、必要に応じて limits を引き上げてください。

    メッセージが具体的に `Extra usage is required for long context requests` の場合、
    そのリクエストは Anthropic の 1M コンテキストウィンドウ（GA 対応の 1M Claude 4.x
    モデル、またはレガシーの `params.context1m: true` 設定）を使おうとしており、現在の認証情報は
    ロングコンテキスト課金の対象ではありません。

    **フォールバックモデル**を設定すると、プロバイダーがレート制限されている間も OpenClaw は応答を続けます。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [ロングコンテキストで Anthropic 429 extra usage required が必要](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーがバンドルされています。AWS env
    マーカー（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、`AWS_BEARER_TOKEN_BEDROCK`）が存在する場合、
    OpenClaw はモデル検出のために暗黙の Bedrock プロバイダーを自動的に有効化します。それ以外の場合は
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定するか、手動の
    プロバイダーエントリを追加します。[Amazon Bedrock](/ja-JP/providers/bedrock) と [モデルプロバイダー](/ja-JP/providers/models)を参照してください。
    マネージドなキーフローを好む場合は、Bedrock の前段に OpenAI 互換プロキシを置くことも有効な選択肢です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Codex** をサポートします。デフォルト設定では `openai/gpt-5.5`
    を使用します。ChatGPT/Codex サブスクリプション認証に加え、ネイティブ Codex アプリサーバー
    実行が使われます。レガシーの Codex プレフィックス付きモデル参照は、
    `openclaw doctor --fix` によって修復されるレガシー設定です。直接の OpenAI API キーアクセスは、非エージェントの
    OpenAI API サーフェス向けにも、順序付きの `openai` API キープロファイル経由でエージェントモデル向けにも
    引き続き利用できます。[モデルプロバイダー](/ja-JP/concepts/model-providers) と [オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。
  </Accordion>

  <Accordion title="OpenClaw がまだレガシー OpenAI Codex プレフィックスに言及するのはなぜですか？">
    `openai` は、OpenAI API キーと ChatGPT/Codex OAuth の両方に対する現在のプロバイダーおよび認証プロファイル ID です。OpenAI Codex はそこに統合されています。古い設定や移行警告では、レガシーの
    `openai-codex` プレフィックスがまだ表示される場合があります。

    - `openai/gpt-5.5` = エージェントターン向けのネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション認証。
    - レガシー `openai-codex/*` モデル参照 = `openclaw doctor --fix` によって修復されるレガシールート。
    - `openai/gpt-5.5` に順序付きの `openai` API キープロファイルを加えたもの = OpenAI エージェントモデル向けの API キー認証。
    - レガシー `openai-codex` 認証プロファイル ID = `openclaw doctor --fix` によって移行されるレガシー ID。

    直接 OpenAI Platform 課金を使いたいですか？`OPENAI_API_KEY` を設定してください。ChatGPT/Codex
    サブスクリプション認証を使いたいですか？`openclaw models auth login --provider openai` を実行してください。モデル
    参照は `openai/gpt-5.5` のままにします。レガシーの Codex プレフィックス付き参照は、`openclaw doctor --fix` が書き換える対象です。

  </Accordion>

  <Accordion title="Codex OAuth の制限が ChatGPT web と異なることがあるのはなぜですか？">
    Codex OAuth は OpenAI 管理のプラン依存のクォータウィンドウを使用し、同じアカウントであっても
    ChatGPT Web サイト/アプリの体験とは異なる場合があります。

    `openclaw models status` は現在見えているプロバイダーの使用量/クォータウィンドウを表示しますが、
    ChatGPT web の権利を直接 API アクセスに作り出したり正規化したりはしません。直接の OpenAI Platform
    課金/制限パスでは、API キーとともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされていますか？">
    はい、完全にサポートしています。OpenAI は、OpenClaw のような外部
    ツール/ワークフローでのサブスクリプション OAuth 使用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、[オンボーディング (CLI)](/ja-JP/start/wizard)を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのように設定しますか？">
    Gemini CLI は `openclaw.json` 内のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    1. `gemini` が `PATH` に入るように Gemini CLI をローカルにインストールします。
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google/gemini-3.1-pro-preview`（ランタイム `google-gemini-cli`）
    5. ログイン後にリクエストが失敗しますか？Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。

    OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [Google](/ja-JP/providers/google)、[モデルプロバイダー](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルは問題ありませんか？">
    通常はいいえ。OpenClaw には大きなコンテキストと強い安全性が必要です。小さなカードではコンテキストが切り詰められ、
    プロバイダー側の安全フィルターもスキップされます。どうしても必要な場合は、ローカルで実行できる**最大の**モデルビルド
    （LM Studio）を実行してください。[ローカルモデル](/ja-JP/gateway/local-models)を参照してください。小型/量子化済み
    モデルはプロンプトインジェクションのリスクを高めます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョン内に保つにはどうすればよいですか？">
    リージョン固定のエンドポイントを選択します。OpenRouter は MiniMax、Kimi、
    GLM 向けに米国ホストの選択肢を公開しています。データをリージョン内に保つには米国ホストのバリアントを選んでください。選択したリージョン化プロバイダーを尊重しながら
    フォールバックを利用できるよう、`models.mode: "merge"` で Anthropic/OpenAI をこれらと並べて一覧できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は人気のある
    常時稼働ホストの選択肢ですが、小さな VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**の場合だけです。iMessage では、Messages にサインイン済みの任意の Mac 上で `imsg` とともに [iMessage](/ja-JP/channels/imessage)
    を使用します。Gateway が Linux などで動作している場合は、その Mac 上で `imsg` を実行する SSH ラッパーに
    `channels.imessage.cliPath` を設定します。その他の macOS 専用ツールでは、Gateway を Mac 上で実行するか macOS ノードとペアリングします。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートに Mac mini は必要ですか？">
    Messages にサインイン済みの**何らかの macOS デバイス**が必要です。Mac mini である必要はなく、任意の
    Mac で動作します。[iMessage](/ja-JP/channels/imessage) を `imsg` とともに使用します。Gateway はその
    Mac 上で実行することも、SSH ラッパー `cliPath` を使って別の場所で実行することもできます。

    一般的な構成:

    - Gateway を Linux/VPS 上に置き、`channels.imessage.cliPath` を Messages にサインイン済みの Mac 上で `imsg` を実行する SSH ラッパーに設定する。
    - 最も単純な単一マシン構成として、すべてを 1 台の Mac 上で動かす。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[ノード](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を買う場合、自分の MacBook Pro に接続できますか？">
    はい。**Mac mini は Gateway を実行**でき、MacBook Pro は**ノード**
    （コンパニオンデバイス）として接続します。ノードは Gateway を実行しません。そのデバイス上の
    画面/カメラ/キャンバスや `system.run` などの機能を追加します。

    一般的なパターン: 常時稼働の Mac mini 上に Gateway を置き、MacBook Pro は macOS アプリまたは
    ノードホストを実行して Gateway にペアリングします。`openclaw nodes status` / `openclaw nodes list` で確認します。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    推奨されません。Bun にはランタイムのバグがあり、特に WhatsApp と Telegram で問題があります。安定した Gateway には
    **Node** を使用してください。それでも試したい場合は、WhatsApp/Telegram を使わない
    非本番 Gateway で行ってください。
  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は bot のユーザー名ではなく、**人間の送信者の Telegram ユーザー ID**（数値）です。
    セットアップでは数値ユーザー ID のみを尋ねます。`openclaw doctor --fix`
    はレガシーの `@username` エントリの解決を試みることができます。

    より安全な方法（サードパーティ bot なし）: 自分の bot に DM し、`openclaw logs --follow` を実行して `from.id` を読み取ります。

    公式 Bot API: 自分の bot に DM し、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読み取ります。

    サードパーティ（プライバシーは低め）: `@userinfobot` または `@getidsbot` に DM します。

    [Telegram アクセス制御](/ja-JP/channels/telegram#access-control-and-activation)を参照してください。

  </Accordion>

  <Accordion title="複数の人がそれぞれ異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使えますか？">
    はい、**マルチエージェントルーティング**を使います。各送信者の WhatsApp DM（`peer: { kind: "direct", id: "+15551234567" }`）を別々の `agentId` にバインドし、
    それぞれに専用のワークスペースとセッションストアを与えます。返信は引き続き**同じ WhatsApp アカウント**から送信されます。DM アクセス制御
    （`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）はアカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp)を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを与え、受信
    ルート（プロバイダーアカウントまたは特定のピア）を各エージェントにバインドします。設定例:
    [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)。[モデル](/ja-JP/concepts/models) と
    [設定](/ja-JP/gateway/configuration)も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux で動作しますか？">
    はい、Linuxbrew 経由で動作します。

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd 経由で OpenClaw を実行する場合: `brew` でインストールされたツールが
    非ログインシェルで解決されるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`
    （または使用している brew プレフィックス）が含まれていることを確認してください。最近のビルドでは、Linux
    systemd サービスで一般的なユーザー bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、
    `~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加し、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、
    `BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` を尊重します。

  </Accordion>

  <Accordion title="変更可能な git インストールと npm インストールの違い">
    - **変更可能な (git) インストール:** 完全なソースチェックアウトで編集可能。コントリビューターに最適です。ローカルでビルドし、コード/ドキュメントにパッチを当てられます。
    - **npm インストール:** グローバル CLI インストールで、リポジトリは不要。「ただ実行する」用途に最適です。更新は npm dist-tags から提供されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとで npm インストールと git インストールを切り替えられますか？">
    はい、既存のインストールで `openclaw update --channel ...` を使用します。これは**データを削除しません**。変更されるのは OpenClaw コードのインストールだけです。状態（`~/.openclaw`）と
    ワークスペース（`~/.openclaw/workspace`）はそのままです。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    まず計画されたモード切り替えをプレビューするには `--dry-run` を追加します。アップデーターは Doctor
    フォローアップを実行し、対象チャンネルの Plugin ソースを更新し、`--no-restart` を渡さない限り Gateway を再起動します。

    インストーラーでもどちらかのモードを強制できます。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [ディスク上の配置場所](/ja-JP/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="Gateway は自分のラップトップと VPS のどちらで実行すべきですか？">
    24/7 の信頼性が必要ですか？**VPS** を使用してください。最小限の手間を望み、スリープ/再起動を許容できるなら、
    ローカルで実行してください。

    **ラップトップ（ローカル Gateway）**

    - **長所:** サーバー費用なし、ローカルファイルへの直接アクセス、ライブブラウザーウィンドウ。
    - **短所:** スリープ/ネットワーク切断で接続が切れ、OS 更新/再起動で中断され、起動状態を維持する必要があります。

    **VPS / クラウド**

    - **メリット:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題なし、稼働を維持しやすい。
    - **デメリット:** ヘッドレスであることが多い（スクリーンショットを使用）、リモートファイルアクセスのみ、更新には SSH が必要。

    WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します - 実際の
    トレードオフはヘッドレスブラウザか表示されるウィンドウかです。[ブラウザ](/ja-JP/tools/browser)を参照してください。

    デフォルトの推奨: 以前に Gateway の切断があった場合は VPS。Mac を能動的に使用していて、ローカルファイルアクセスや表示されるブラウザ UI
    自動化が必要な場合はローカルが適しています。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を実行することはどの程度重要ですか？">
    必須ではありませんが、信頼性と分離のために推奨されます。

    - **専用ホスト（VPS/Mac mini/Raspberry Pi）:** 常時稼働、スリープや再起動による中断が少ない、権限が整理しやすい、稼働を維持しやすい。
    - **共有ノート PC/デスクトップ:** テストやアクティブな使用には問題ありませんが、マシンがスリープまたは更新されると一時停止が発生することを想定してください。

    両方の長所を活かすには、Gateway を専用ホストで維持し、ノート PC をローカルの画面/カメラ/exec ツール用の
    **ノード**としてペアリングします。[ノード](/ja-JP/nodes)と[セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="最小 VPS 要件と推奨 OS は何ですか？">
    - **絶対最小:** 1 vCPU、1 GB RAM、約 500 MB ディスク。
    - **推奨:** 余裕を持つために 1-2 vCPU、2 GB 以上の RAM（ログ、メディア、複数チャンネル）。Node ツールとブラウザ自動化はリソースを多く消費する場合があります。

    OS: **Ubuntu LTS**（または任意の最新 Debian/Ubuntu） - 最もよくテストされている Linux インストールパスです。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？要件は何ですか？">
    はい。VM は VPS と同じように扱います。常時稼働し、到達可能で、Gateway と有効化する任意のチャンネルに十分な RAM
    が必要です。

    - **絶対最小:** 1 vCPU、1 GB RAM。
    - **推奨:** 複数チャンネル、ブラウザ自動化、またはメディアツールには 2 GB 以上の RAM。
    - **OS:** Ubuntu LTS または別の最新 Debian/Ubuntu。

    Windows では、デスクトップセットアップには **Windows Hub** を使用するか、幅広いツール互換性を持つ Linux 風の Gateway VM
    には WSL2 を使用します。[Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps)を参照してください。
    VM で macOS を実行する場合: [macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) - メイン FAQ（モデル、セッション、Gateway、セキュリティなど）
- [インストール概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
