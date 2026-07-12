---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - 認証とプロバイダーのサブスクリプションの選択
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが進まない
sidebarTitle: First-run FAQ
summary: FAQ：クイックスタートと初回セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期エラー
title: FAQ：初回セットアップ
x-i18n:
    generated_at: "2026-07-12T14:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8f5234a5ae52fd57a89b3140473049c37f8495875e4a5d9a89d87e55d8fb2f7e
    source_path: help/faq-first-run.md
    workflow: 16
---

  クイックスタートと初回実行に関するQ&Aです。日常的な操作、モデル、認証、セッション、
  トラブルシューティングについては、メインの[よくある質問](/ja-JP/help/faq)を参照してください。

  ## クイックスタートと初回実行のセットアップ

  <AccordionGroup>
  <Accordion title="行き詰まったときに最速で解決する方法">
    **自分のマシンを確認できる**ローカルAIエージェントを使用してください。「行き詰まった」ケースの大半は、
    リモートの支援者では確認できない**ローカル設定または環境の問題**であるため、
    Discordで質問するより効果的です。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    エージェントがコードとドキュメントを読み、実行中の正確なバージョンについて判断できるように、
    カスタマイズ可能な（git）インストールで完全なソースチェックアウトを渡してください。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    エージェントに修正を段階的に計画して監督するよう依頼し、その後で必要なコマンドだけを
    実行してください。差分が小さいほど監査しやすくなります。

    サポートを求める際（DiscordまたはGitHub Issue）には、次の出力を共有してください。

    | コマンド | 表示内容 |
    | --- | --- |
    | `openclaw status` | Gateway/エージェントの状態と基本設定のスナップショット |
    | `openclaw status --all` | 貼り付け可能な完全な読み取り専用診断 |
    | `openclaw models status` | プロバイダー認証とモデルの利用可否 |
    | `openclaw doctor` | 一般的な設定や状態の問題を検証して修復 |
    | `openclaw logs --follow` | リアルタイムのログ末尾表示 |
    | `openclaw gateway status --deep` | Gateway/設定/Pluginの詳細な状態チェック |
    | `openclaw health --verbose` | 詳細な状態レポート |

    実際のバグや修正を見つけた場合は、Issueを作成するかPRを送信してください。
    [Issue](https://github.com/openclaw/openclaw/issues) /
    [プルリクエスト](https://github.com/openclaw/openclaw/pulls)。

    クイックデバッグ手順: [問題が発生した場合の最初の60秒](/ja-JP/help/faq#first-60-seconds-if-something-is-broken)。
    インストールドキュメント: [インストール](/ja-JP/install)、[インストーラーフラグ](/ja-JP/install/installer)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeatがスキップされ続けます。スキップ理由は何を意味しますか？">
    | スキップ理由 | 意味 |
    | --- | --- |
    | `quiet-hours` | 設定されたアクティブ時間帯の範囲外 |
    | `empty-heartbeat-file` | `HEARTBEAT.md`は存在するが、空白、コメント、ヘッダー、フェンス、または空のチェックリストの雛形しか含まれていない |
    | `no-tasks-due` | タスクモードは有効だが、実行期限に達したタスク間隔がまだない |
    | `alerts-disabled` | Heartbeatの表示がすべて無効（`showOk`、`showAlerts`、`useIndicator`がすべて無効） |

    タスクモードでは、実際のHeartbeat実行が完了した後にのみ期限タイムスタンプが進みます。
    スキップされた実行では、タスクは完了として記録されません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClawの推奨インストールおよびセットアップ方法">
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

    まだグローバルインストールしていない場合は、代わりに`pnpm openclaw onboard`を実行してください。Control UIアセットが
    見つからない場合、オンボーディングは自動でビルドを試み、失敗時には`pnpm ui:build`にフォールバックします。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くにはどうすればよいですか？">
    オンボーディングは、セットアップ直後にクリーンな（トークンを含まない）ダッシュボードURLをブラウザーで開き、
    サマリーにリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、
    表示されたURLを同じマシンでコピーして貼り付けてください。
  </Accordion>

  <Accordion title="localhostとリモートでダッシュボードを認証するにはどうすればよいですか？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/`を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードをControl UIの設定に貼り付けます。
    - トークンの取得元: `gateway.auth.token`（または`OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの取得元: `gateway.auth.password`（または`OPENCLAW_GATEWAY_PASSWORD`）。
    - 共有シークレットがまだ設定されていない場合は、`openclaw doctor --generate-gateway-token`（または`openclaw doctor --fix --generate-gateway-token`）を実行します。

    **Localhost以外:**

    - **Tailscale Serve**（推奨）: バインドをループバックのままにして`openclaw gateway --tailscale serve`を実行し、`https://<magicdns>/`を開きます。`gateway.auth.allowTailscale: true`の場合、IDヘッダーによってControl UI/WebSocket認証が満たされます（共有シークレットの貼り付けは不要で、信頼できるGatewayホストを前提とします）。ただし、プライベートイングレスで意図的に`none`を使用するか、信頼済みプロキシのHTTP認証を使用しない限り、HTTP APIには引き続き共有シークレット認証が必要です。
      同じクライアントから同時に行われた不正認証のServe試行は、認証失敗リミッターに記録される前に直列化されるため、2回目の不正な再試行ですでに`retry later`と表示される場合があります。
    - **Tailnetバインド**: `openclaw gateway --bind tailnet --token "<token>"`を実行（またはパスワード認証を設定）し、`http://<tailscale-ip>:18789/`を開いて、一致する共有シークレットをダッシュボード設定に貼り付けます。
    - **ID認識型リバースプロキシ**: Gatewayを信頼済みプロキシの背後に置き、`gateway.auth.mode: "trusted-proxy"`を設定して、プロキシURLを開きます。同一ホストのループバックプロキシでは、`gateway.auth.trustedProxy.allowLoopback: true`を明示的に設定する必要があります。
    - **SSHトンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`を実行し、`http://127.0.0.1:18789/`を開きます。トンネル経由でも共有シークレット認証が適用されます。求められた場合は、設定済みのトークンまたはパスワードを貼り付けてください。

    バインドモードと認証の詳細については、[ダッシュボード](/ja-JP/web/dashboard)と[Webサーフェス](/ja-JP/web)を参照してください。

  </Accordion>

  <Accordion title="チャット承認用のexec承認設定が2つあるのはなぜですか？">
    これらは異なるレイヤーを制御します。

    - `approvals.exec` - 承認プロンプトをチャットの送信先へ転送します。
    - `channels.<channel>.execApprovals` - そのチャンネルをexec承認のネイティブ承認クライアントにします。

    ホストのexecポリシーが引き続き実際の承認ゲートであり、チャット設定はプロンプトの
    表示先と、ユーザーが回答する方法だけを制御します。

    両方が必要になることはほとんどありません。

    - チャットがすでにコマンドと返信に対応している場合、同じチャットでの`/approve`は共有パスを通じて機能します。
    - 対応しているネイティブチャネルが承認者を安全に推測できる場合、`channels.<channel>.execApprovals.enabled`が未設定または`"auto"`なら、OpenClawはDM優先のネイティブ承認を自動的に有効にします。
    - ネイティブの承認カードやボタンが利用できる場合は、そのUIが優先されます。ツールの結果でチャット承認が利用できないと示された場合にのみ、手動の`/approve`コマンドについて言及してください。
    - プロンプトを他のチャットや明示的な運用ルームにも送る必要がある場合にのみ、`approvals.exec`を使用します。
    - 承認プロンプトを発生元のルームやトピックにも投稿したい場合にのみ、`channels.<channel>.execApprovals.target: "channel"`または`"both"`を使用します。
    - Pluginの承認は別です。デフォルトでは同じチャットの`/approve`を使用し、必要に応じて`approvals.plugin`で転送できます。また、一部のネイティブチャネルのみ、それらについてもネイティブ処理を維持します。

    要約：転送はルーティング用、ネイティブクライアント設定はチャネル固有のより高度なUX用です。
    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **22.19+**が必要です（Node 24を推奨）。`pnpm`はリポジトリのパッケージマネージャーです。
    GatewayでのBunの使用は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Piで動作しますか？">
    はい。ただし、まずRAMを確認してください。Pi 5とPi 4（2 GB以上）が最適です。Pi 3B+（1 GB）でも動作しますが低速です。Pi Zero 2 W（512 MB）は推奨されません。

    | モデル | RAM | 適合度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最適 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | 使用可能、スワップを追加 |
    | Pi 4 | 1 GB | 厳しい |
    | Pi 3B+ | 1 GB | 低速 |
    | Pi Zero 2 W | 512 MB | 非推奨 |

    絶対最小要件：RAM 1 GB、1コア、空きディスク容量500 MB、64ビットOS。Piで実行するのは
    Gatewayだけであり（モデルはクラウドAPIを呼び出します）、控えめな性能のPiでも負荷を処理できます。

    小型のPi/VPSではGatewayだけをホストし、ノートPCやスマートフォン上の**ノード**を
    ペアリングして、ローカルの画面、カメラ、キャンバス、またはコマンド実行を利用することもできます。[ノード](/ja-JP/nodes)を参照してください。

    完全なセットアップ手順：[Raspberry Pi](/ja-JP/install/raspberry-pi)。

  </Accordion>

  <Accordion title="Raspberry Piへのインストールに関するヒントはありますか？">
    - **64ビット**OSを使用してください。32ビットのRaspberry Pi OSは使用しないでください。
    - 2 GB以下のボードではスワップを追加してください。
    - パフォーマンスと寿命のため、SDカードよりも**USB SSD**を推奨します。
    - ログを確認し、迅速に更新できるよう、変更可能な（git）インストールを推奨します。
    - 最初はチャネルやSkillsを使用せず、1つずつ追加してください。
    - 不可解なバイナリ障害（「exec format error」）は、通常、オプションのSkillツールにARM64ビルドがないことが原因です。

    完全なガイド：[Raspberry Pi](/ja-JP/install/raspberry-pi)。[Linux](/ja-JP/platforms/linux)も参照してください。

  </Accordion>

  <Accordion title="「wake up my friend」で停止する／オンボーディングが開始されません。どうすればよいですか？">
    この画面は、Gatewayに到達でき、認証済みであることに依存します。モデルプロバイダーが設定されている場合、TUIは
    最初の起動時に「Wake up, my friend!」も自動的に送信します。モデル／認証のセットアップを
    スキップした場合、オンボーディングには「Model auth missing」という注記が表示され、何も送信せずに
    TUIが開きます。`openclaw configure --section model`でプロバイダーを追加してください。
    起動メッセージが表示されても**返信がなく**、トークン数が0のままなら、エージェントは一度も実行されていません。

    1. Gatewayを再起動します。

    ```bash
    openclaw gateway restart
    ```

    2. ステータスと認証を確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. まだ停止したままの場合は、次を実行します。

    ```bash
    openclaw doctor
    ```

    Gatewayがリモートにある場合は、トンネル／Tailscale接続が有効であり、UIが
    正しいGatewayを参照していることを確認してください。[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、セットアップを新しいマシンへ移行できますか？">
    はい。**状態ディレクトリ**と**ワークスペース**をコピーしてから、Doctorを一度実行します。

    1. 新しいマシンにOpenClawをインストールします。
    2. 古いマシンから`$OPENCLAW_STATE_DIR`（デフォルト：`~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト：`~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor`を実行し、Gatewayサービスを再起動します。

    これにより、設定、認証プロファイル、WhatsAppの認証情報、セッション、メモリが保持されます。**両方**の場所をコピーすれば、
    ボットはまったく同じ状態に保たれます。リモートモードでは、
    Gatewayホストがセッションストアとワークスペースを所有します。

    **重要：**ワークスペースだけをGitHubにコミット／プッシュした場合、バックアップされるのは
    **メモリとブートストラップファイル**だけであり、セッション履歴や認証は含まれません。これらは
    `~/.openclaw/`配下（例：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`）にあります。

    関連項目：[移行](/ja-JP/install/migrating)、[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)、
    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、
    [リモートモード](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHubの変更履歴を確認してください。
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリが先頭にあります。先頭のセクションが**未リリース**の場合、その次の日付付き
    セクションが、リリース済みの最新バージョンです。エントリは**ハイライト**、**変更**、
    **修正**に分類されます（必要に応じてドキュメントやその他のセクションもあります）。

  </Accordion>

  <Accordion title="docs.openclaw.aiにアクセスできない（SSLエラー）">
    一部のComcast/Xfinity接続では、Xfinity
    Advanced Securityによって`docs.openclaw.ai`が誤ってブロックされます。これを無効にするか、`docs.openclaw.ai`を許可リストに追加してから、再試行してください。
    ブロック解除にご協力ください：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    まだ解決しませんか？ドキュメントは GitHub にもミラーされています：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="安定版とベータ版の違い">
    **安定版**と**ベータ版**は別々のコードラインではなく、**npm dist-tag**です：

    - `latest` = 安定版
    - `beta` = テスト用の早期ビルド（ベータ版が存在しない場合、または現在の安定版リリースより古い場合は `latest` にフォールバック）

    通常、安定版リリースはまず **ベータ版**として公開され、その後、明示的な昇格手順によって
    バージョン番号を変更せずに同じバージョンが `latest` に移されます。メンテナーが
    直接 `latest` に公開することもできます。そのため、昇格後はベータ版と安定版が
    **同じバージョン**を指す場合があります。

    変更内容を確認する：[CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

    インストール用ワンライナーとベータ版と dev の違いについては、次のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="ベータ版をインストールする方法と、ベータ版と dev の違いは？">
    **ベータ版**は npm dist-tag の `beta` です（昇格後は `latest` と一致する場合があります）。
    **Dev** は `main`（git）の更新され続ける最新状態です。npm に公開される場合は dist-tag `dev` を使用します。

    ワンライナー（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）：`iwr -useb https://openclaw.ai/install.ps1 | iex`

    詳細：[開発チャンネル](/ja-JP/install/development-channels)と[インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビルドを試すには？">
    2 つの方法があります：

    1. **Dev チャンネル（既存のインストール）：**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` の git チェックアウトに切り替わり、upstream にリベースしてビルドし、
    そのチェックアウトから CLI がインストールされます。

    2. **変更可能な（git）インストール（新しいマシン）：**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    手動でのクローンを推奨します：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント：[更新](/ja-JP/cli/update)、[開発チャンネル](/ja-JP/install/development-channels)、[インストール](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらい時間がかかりますか？">
    おおよその目安：

    - **インストール：** 2-5 分。
    - **クイックスタートのオンボーディング：** 数分（loopback Gateway、自動トークン、デフォルトワークスペース）。
    - **高度な／完全なオンボーディング：** プロバイダーへのサインイン、チャンネルのペアリング、デーモンのインストール、ネットワークからのダウンロード、または Skills に追加設定が必要な場合は、さらに時間がかかります。

    ウィザードは最初にこの所要時間の目安を表示します。任意の手順はスキップし、後で
    `openclaw configure` を使用して再開できます。

    進まない場合は、上記の[行き詰まった場合](#quick-start-and-first-run-setup)を参照してください。

  </Accordion>

  <Accordion title="インストーラーが停止していますか？詳細な情報を得るには？">
    `--verbose` を付けて再実行します：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` には専用の verbose スイッチがありません。代わりに `Set-PSDebug -Trace 1` /
    `-Trace 0` で囲んでください。すべてのフラグのリファレンス：[インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows で「git が見つからない」または「openclaw が認識されない」と表示される">
    Windows でよくある問題は 2 つあります：

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に含まれていることを確認します。
    - PowerShell を閉じて再度開き、インストーラーを再実行します。

    **2) インストール後に openclaw が認識されない**

    - npm のグローバル bin フォルダーが PATH に含まれていません。
    - 次のコマンドで確認します：`npm config get prefix`。
    - そのディレクトリをユーザーの PATH に追加します（`\bin` サフィックスは不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PowerShell を閉じて再度開きます。

    デスクトップアプリを使用する場合は **Windows Hub** を利用してください。ターミナルのみでのセットアップでは、PowerShell
    インストーラーと WSL2 Gateway のどちらの方法もサポートされています。ドキュメント：[Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語が文字化けします。どうすればよいですか？">
    通常は、Windows ネイティブシェルにおけるコンソールコードページの不一致が原因です。

    症状：`system.run`/`exec` の出力で中国語が文字化けしますが、同じコマンドを
    別のターミナルプロファイルで実行すると正しく表示されます。

    PowerShell での回避策：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gateway を再起動して再試行します：

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも引き続き再現する場合は、こちらで追跡／報告してください：[Issue #30640](https://github.com/openclaw/openclaw/issues/30640)。

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした。より適切な回答を得るには？">
    完全なソースとドキュメントをローカルで参照できるように変更可能な（git）インストールを使用し、
    ボット（または Claude/Codex）に**そのフォルダーから**質問してください。これにより、リポジトリを読み取って正確に回答できます。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細：[インストール](/ja-JP/install)と[インストーラーフラグ](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするには？">
    - Linux のクイック手順とサービスのインストール：[Linux](/ja-JP/platforms/linux)。
    - 完全な手順：[はじめに](/ja-JP/start/getting-started)。
    - インストーラーと更新：[インストールと更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするには？">
    任意の Linux VPS を使用できます。サーバーにインストールし、SSH/Tailscale 経由で Gateway にアクセスします。

    ガイド：[exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。
    リモートアクセス：[Gateway のリモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド／VPS のインストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめたホスティングハブ：

    - [VPS ホスティング](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでは、**Gateway はサーバー上で実行され**、ノートパソコン／スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態とワークスペースはサーバー上に存在するため、
    ホストを信頼できる唯一の情報源として扱い、バックアップしてください。

    **Node**（Mac/iOS/Android/ヘッドレス）をそのクラウド Gateway とペアリングすると、Gateway を
    クラウド上で実行したまま、ノートパソコンのローカル画面／カメラ／キャンバスの利用やコマンド実行が可能になります。

    ハブ：[プラットフォーム](/ja-JP/platforms)。リモートアクセス：[Gateway のリモートアクセス](/ja-JP/gateway/remote)。
    Node：[Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自身を更新させることはできますか？">
    可能ですが、推奨されません。更新フローでは Gateway が再起動される可能性があり（アクティブな
    セッションが切断されます）、クリーンな git チェックアウトが必要になる場合や、確認を求められる場合があります。
    オペレーターとしてシェルから更新を実行する方が安全です。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    エージェントから自動化する場合：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント：[更新](/ja-JP/cli/update)、[アップデート](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングでは実際に何が行われますか？">
    `openclaw onboard` は推奨されるセットアップ方法です。**ローカルモード**では次の手順を案内します：

    1. **モデル／認証** - プロバイダーの OAuth、API キー、または手動認証（LM Studio などのローカルオプションを含む）。デフォルトモデルを選択します。
    2. **ワークスペース** - 場所とブートストラップファイル。
    3. **Gateway** - ポート、バインドアドレス、認証モード、Tailscale への公開。
    4. **チャンネル** - 組み込みおよび公式 Plugin のチャットチャンネル：iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp など。
    5. **デーモン** - LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、または Windows ネイティブの Scheduled Task。
    6. **ヘルスチェック** - Gateway を起動し、実行中であることを確認します。
    7. **Skills** - 推奨 Skills と任意の依存関係をインストールします。

    最初に所要時間の目安を示し、設定済みのモデルが不明な場合や
    認証がない場合は警告します。詳細な内訳：[オンボーディング（CLI）](/ja-JP/start/wizard)。

  </Accordion>

  <Accordion title="実行するために Claude または OpenAI のサブスクリプションは必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）または**ローカルのみのモデル**で
    実行できるため、データをデバイス上に保持できます。サブスクリプション（Claude Pro/Max、ChatGPT/Codex）は、
    それらのプロバイダーで認証するための任意の方法です。

    Anthropic の場合、**API キー**では標準の従量課金が適用されます。**Claude CLI** は
    同じホスト上の既存の Claude Code ログインを再利用します。Anthropic は現在、
    Claude CLI の非対話型 `claude -p` パスを Agent SDK／プログラム利用として扱っており、
    引き続きサブスクリプションプランの上限を消費します。サブスクリプションの動作を前提にする前に、
    現在の Anthropic の請求ドキュメントを確認してください。長期間稼働する Gateway ホストや共有
    自動化では、Anthropic API キーの方が予測しやすい選択肢です。

    OpenAI Codex OAuth（ChatGPT/Codex サブスクリプション）は、エージェントモデルで完全にサポートされています。
    OpenClaw は、**Qwen Cloud
    Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**など、ホスト型のサブスクリプション形式のオプションもサポートしています。

    ドキュメント：[Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、
    [Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI（GLM）](/ja-JP/providers/zai)、
    [ローカルモデル](/ja-JP/gateway/local-models)、[モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使用できますか？">
    はい。OpenClaw は Pro/Max/Team/Enterprise プランで Claude CLI の再利用をサポートしています。Anthropic
    は現在、OpenClaw が使用する `claude -p` パスをサブスクリプションプランの上限が適用される利用として
    扱っており、別枠の無料利用とは見なしていません。現在の請求の詳細と
    Anthropic 自身のサポート記事へのリンクについては、
    [Anthropic](/ja-JP/providers/anthropic)を参照してください。サーバー側で最も予測しやすいセットアップにするには、代わりに
    Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title="Claude のサブスクリプション認証（Claude Pro または Max）をサポートしていますか？">
    はい、Claude CLI の再利用を通じてサポートしています。Anthropic による `claude -p`／Agent SDK 利用の請求上の扱いは
    時間の経過とともに変更されています。特定の請求動作を前提にする前に、
    現在の状況と Anthropic のサポート記事への日付付きリンクについて
    [Anthropic](/ja-JP/providers/anthropic)を参照してください。

    Anthropic の setup-token 認証も、トークンを使用する方法として引き続きサポートされていますが、OpenClaw は
    利用可能な場合、Claude CLI の再利用と `claude -p` を優先します。本番環境または複数ユーザーの
    ワークロードでは、Anthropic API キーが引き続き、より安全で予測しやすい選択肢です。その他の
    サブスクリプション形式のホスト型オプション：[OpenAI](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI（GLM）](/ja-JP/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Anthropic で HTTP 429 rate_limit_error が表示されるのはなぜですか？">
    現在の期間における **Anthropic のクォータ／レート制限**を使い切っています。**Claude
    CLI** では、期間がリセットされるまで待つか、プランをアップグレードしてください。**Anthropic API キー**では、
    Anthropic Console で使用量／請求を確認し、必要に応じて上限を引き上げてください。

    メッセージが特に `Extra usage is required for long context requests` の場合、
    リクエストは Anthropic の 1M コンテキストウィンドウ（GA 対応の 1M Claude 4.x
    モデル、または従来の `params.context1m: true` 設定）を使用しようとしていますが、現在の認証情報は
    ロングコンテキストの課金対象として利用できません。

    プロバイダーがレート制限されている間も OpenClaw が応答を続けられるように、**フォールバックモデル**を設定してください。
    [モデル](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [ロングコンテキストで追加使用量が必要となる Anthropic 429](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には **Amazon Bedrock (Converse)** プロバイダーが同梱されています。AWS の環境
    マーカー（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、`AWS_BEARER_TOKEN_BEDROCK`）が存在する場合、
    OpenClaw はモデル検出用の暗黙的な Bedrock プロバイダーを自動的に有効化します。それ以外の場合は、
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true` を設定するか、手動で
    プロバイダーエントリを追加してください。[Amazon Bedrock](/ja-JP/providers/bedrock)および[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
    管理されたキーフローを希望する場合は、Bedrock の前段に OpenAI 互換プロキシを配置する方法も引き続き有効です。
  </Accordion>

  <Accordion title="Codex の認証はどのように機能しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Codex** をサポートします。プライマリ
    モデルがない新規セットアップでは、ChatGPT/Codex サブスクリプション認証とネイティブ Codex
    app-server 実行に正確に `openai/gpt-5.6-sol` を使用します。
    再認証時には、`openai/gpt-5.5` を含む既存の明示的なモデルが維持されます。
    Codex ワークスペースで GPT-5.6 が公開されていない場合は、
    `openai/gpt-5.5` を明示的に選択してください。OpenClaw が暗黙的にダウングレードすることはありません。従来の
    Codex プレフィックス付きモデル参照は、`openclaw doctor
    --fix` によって修復される従来設定です。OpenAI API キーによる直接アクセスは、エージェント以外の OpenAI
    API サーフェスで引き続き利用でき、順序付けされた `openai` API キープロファイルを通じてエージェント
    モデルでも利用できます。[モデルプロバイダー](/ja-JP/concepts/model-providers)および
    [オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
  </Accordion>

  <Accordion title="OpenClaw が従来の OpenAI Codex プレフィックスにまだ言及するのはなぜですか？">
    `openai` は、OpenAI API キーと ChatGPT/Codex OAuth の両方に使用する現在のプロバイダーおよび
    認証プロファイル ID です。OpenAI Codex はこれに統合されています。古い設定や移行警告では、
    従来の `openai-codex` プレフィックスが引き続き表示される場合があります。

    - `openai/gpt-5.6-sol` = エージェントターンでネイティブ Codex ランタイムを使用する、新規の ChatGPT/Codex サブスクリプションセットアップ。
    - `openai/gpt-5.5` = 既存の設定、または GPT-5.6 にアクセスできないアカウント向けの明示的にサポートされた選択肢。
    - 従来の `openai-codex/*` モデル参照 = `openclaw doctor --fix` によって修復される従来のルート。
    - `openai/gpt-5.5` と順序付けされた `openai` API キープロファイル = OpenAI エージェントモデルの API キー認証。
    - 従来の `openai-codex` 認証プロファイル ID = `openclaw doctor --fix` によって移行される従来の ID。

    OpenAI Platform による直接請求を利用しますか？`OPENAI_API_KEY` を設定してください。ChatGPT/Codex
    サブスクリプション認証を利用しますか？`openclaw models auth login --provider openai` を実行してください。
    モデル参照は正規の `openai/*` プロバイダー配下に置いてください。新規のサブスクリプション
    セットアップでは正確に `openai/gpt-5.6-sol` を使用します。doctor は、明示的に選択された
    `openai/gpt-5.5` をアップグレードせずに、従来の Codex プレフィックス付き参照を修復します。

  </Accordion>

  <Accordion title="Codex OAuth の上限が ChatGPT Web と異なることがあるのはなぜですか？">
    Codex OAuth では OpenAI が管理するプラン依存のクォータ期間が使用され、同じアカウントでも
    ChatGPT の Web サイト／アプリでの利用体験とは異なる場合があります。

    `openclaw models status` は、現在確認できるプロバイダーの使用量／クォータ期間を表示しますが、
    ChatGPT Web の利用資格を作り出したり、直接 API アクセスとして正規化したりすることはありません。
    OpenAI Platform の直接請求／上限の経路を利用するには、API キーとともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされていますか？">
    はい、完全にサポートされています。OpenAI は、OpenClaw のような外部
    ツール／ワークフローでのサブスクリプション OAuth の使用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[モデルプロバイダー](/ja-JP/concepts/model-providers)、および[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどのようにセットアップしますか？">
    Gemini CLI は `openclaw.json` 内のクライアント ID やシークレットではなく、**Plugin 認証フロー**を使用します。

    1. `gemini` が `PATH` に含まれるよう、Gemini CLI をローカルにインストールします。
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google/gemini-3.1-pro-preview`（ランタイムは `google-gemini-cli`）
    5. ログイン後にリクエストが失敗しますか？Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定し、再試行してください。

    OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細は [Google](/ja-JP/providers/google)、[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。

  </Accordion>

  <Accordion title="カジュアルなチャットにローカルモデルを使用しても問題ありませんか？">
    通常は推奨されません。OpenClaw には大きなコンテキストと強力な安全性が必要です。小容量のカードではコンテキストが切り詰められ、
    プロバイダー側の安全フィルターが適用されません。どうしても必要な場合は、ローカルで実行できる**最大の**モデルビルドを
    （LM Studio で）実行してください。[ローカルモデル](/ja-JP/gateway/local-models)を参照してください。小型／量子化
    モデルではプロンプトインジェクションのリスクが高まります。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョン内に維持するにはどうすればよいですか？">
    リージョン固定のエンドポイントを選択してください。OpenRouter は MiniMax、Kimi、
    GLM 向けに米国ホストの選択肢を提供しています。データをリージョン内に維持するには、米国ホストのバリアントを選択してください。
    `models.mode: "merge"` を使用すれば、これらと並べて Anthropic/OpenAI を引き続き一覧に含めることができ、
    選択したリージョン指定プロバイダーを尊重しながらフォールバックを利用可能に保てます。
  </Accordion>

  <Accordion title="これをインストールするために Mac mini を購入する必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows では WSL2 経由）で動作します。Mac mini は人気のある
    常時稼働ホストの選択肢ですが、小型 VPS、ホームサーバー、または Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**を使用する場合だけです。iMessage では、Messages にサインイン済みの任意の Mac 上で
    `imsg` とともに [iMessage](/ja-JP/channels/imessage) を使用してください。Gateway が Linux など別の場所で動作している場合は、
    `channels.imessage.cliPath` に、その Mac 上で `imsg` を実行する SSH ラッパーを設定してください。その他の
    macOS 専用ツールでは、Mac 上で Gateway を実行するか、macOS Node をペアリングしてください。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Node](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage をサポートするには Mac mini が必要ですか？">
    Messages にサインイン済みの **macOS デバイス**がいずれか必要ですが、Mac mini である必要はなく、どの
    Mac でも構いません。`imsg` とともに [iMessage](/ja-JP/channels/imessage) を使用してください。Gateway はその
    Mac 上で実行することも、SSH ラッパーを `cliPath` に指定して別の場所で実行することもできます。

    一般的な構成:

    - Gateway を Linux/VPS 上で実行し、`channels.imessage.cliPath` に、Messages にサインイン済みの Mac 上で `imsg` を実行する SSH ラッパーを設定する。
    - 最もシンプルな単一マシン構成として、すべてを 1 台の Mac 上で実行する。

    ドキュメント: [iMessage](/ja-JP/channels/imessage)、[Node](/ja-JP/nodes)、[Mac リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を実行するために Mac mini を購入した場合、MacBook Pro に接続できますか？">
    はい。**Mac mini で Gateway を実行**し、MacBook Pro を **Node**
    （コンパニオンデバイス）として接続できます。Node は Gateway を実行するのではなく、そのデバイス上の
    画面／カメラ／キャンバスや `system.run` などの機能を追加します。

    一般的な構成: 常時稼働の Mac mini 上で Gateway を実行し、MacBook Pro では macOS アプリまたは
    Node ホストを実行して Gateway とペアリングします。`openclaw nodes status` / `openclaw nodes list` で確認してください。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun を使用できますか？">
    推奨されません。Bun にはランタイムの不具合があり、特に WhatsApp と Telegram で問題が発生します。安定した Gateway には
    **Node** を使用してください。それでも試したい場合は、WhatsApp/Telegram を使用しない
    非本番環境の Gateway で行ってください。
  </Accordion>

  <Accordion title="Telegram: allowFrom には何を指定しますか？">
    `channels.telegram.allowFrom` は、ボットのユーザー名ではなく、**人間の送信者の Telegram ユーザー ID**（数値）です。
    セットアップでは数値のユーザー ID のみを求めます。`openclaw doctor --fix` は、従来の
    `@username` エントリの解決を試みることができます。

    より安全な方法（サードパーティ製ボット不要）: 自分のボットに DM を送り、`openclaw logs --follow` を実行して、`from.id` を確認します。

    公式 Bot API: 自分のボットに DM を送り、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して、`message.from.id` を確認します。

    サードパーティ（プライバシーが低い）: `@userinfobot` または `@getidsbot` に DM を送ります。

    [Telegram のアクセス制御](/ja-JP/channels/telegram#access-control-and-activation)を参照してください。

  </Accordion>

  <Accordion title="複数の人が、異なる OpenClaw インスタンスで 1 つの WhatsApp 番号を使用できますか？">
    はい、**マルチエージェントルーティング**を使用します。各送信者の WhatsApp DM（`peer: { kind: "direct", id: "+15551234567" }`）を異なる `agentId` にバインドし、各ユーザーに専用のワークスペースとセッションストアを割り当てます。返信元は引き続き**同じ WhatsApp アカウント**です。DM のアクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）はアカウントごとにグローバルです。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)および [WhatsApp](/ja-JP/channels/whatsapp)を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使用します。各エージェントに独自のデフォルトモデルを設定し、受信
    ルート（プロバイダーアカウントまたは特定のピア）を各エージェントにバインドします。設定例:
    [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)。[モデル](/ja-JP/concepts/models)および
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

    systemd 経由で OpenClaw を実行する場合は、非ログインシェルでも `brew` でインストールしたツールを
    解決できるよう、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用している brew プレフィックス）が含まれていることを確認してください。
    最近のビルドでは、Linux の systemd サービスで一般的なユーザー bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、
    `~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加され、設定されている場合は `PNPM_HOME`、`NPM_CONFIG_PREFIX`、
    `BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` が尊重されます。

  </Accordion>

  <Accordion title="変更可能な git インストールと npm インストールの違い">
    - **変更可能な（git）インストール:** ソース全体をチェックアウトするため編集可能で、コントリビューターに最適です。ローカルでビルドし、コード／ドキュメントにパッチを適用できます。
    - **npm インストール:** リポジトリを伴わないグローバル CLI インストールで、「そのまま実行したい」場合に最適です。更新は npm dist-tag から提供されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[更新](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか？">
    はい、既存のインストールで `openclaw update --channel ...` を使用して切り替えられます。これによって**データが
    削除されることはありません**。変更されるのは OpenClaw のコードインストールだけです。状態（`~/.openclaw`）と
    ワークスペース（`~/.openclaw/workspace`）は変更されません。

    npm から git:

    ```bash
    openclaw update --channel dev
    ```

    git から npm:

    ```bash
    openclaw update --channel stable
    ```

    まず `--dry-run` を追加して、予定されているモード切り替えをプレビューします。アップデーターは Doctor
    のフォローアップを実行し、対象チャネルのプラグインソースを更新して、Gateway を再起動します。
    ただし、`--no-restart` を渡した場合は再起動しません。

    インストーラーでいずれかのモードを強制することもできます。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント：[ディスク上の保存場所](/ja-JP/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="Gateway はノートパソコンと VPS のどちらで実行すべきですか？">
    24時間365日の信頼性が必要ですか？**VPS** を使用してください。手軽さを最優先し、
    スリープや再起動を許容できる場合は、ローカルで実行してください。

    **ノートパソコン（ローカル Gateway）**

    - **長所：** サーバー費用が不要、ローカルファイルへ直接アクセス可能、ブラウザーウィンドウを表示可能。
    - **短所：** スリープやネットワーク切断で接続が途切れる、OS の更新や再起動で中断する、スリープさせない必要がある。

    **VPS / クラウド**

    - **長所：** 常時稼働、安定したネットワーク、ノートパソコンのスリープによる問題がない、稼働を維持しやすい。
    - **短所：** 多くの場合ヘッドレス（スクリーンショットを使用）、ファイルにはリモートからのみアクセス可能、更新には SSH が必要。

    WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS から問題なく動作します。実際の
    トレードオフは、ヘッドレスブラウザーか表示可能なウィンドウかという点です。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    デフォルトの推奨事項：以前に Gateway の切断が発生したことがある場合は VPS を使用してください。
    Mac を頻繁に使用していて、ローカルファイルへのアクセスや、ブラウザー UI を表示する
    自動化が必要な場合は、ローカル実行が最適です。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで実行することは、どの程度重要ですか？">
    必須ではありませんが、信頼性と分離性のために推奨されます。

    - **専用ホスト（VPS/Mac mini/Raspberry Pi）：** 常時稼働、スリープや再起動による中断が少ない、権限管理が明確、稼働を維持しやすい。
    - **共用のノートパソコン/デスクトップ：** テストや使用中の運用には問題ありませんが、マシンのスリープや更新時には一時停止が発生します。

    両方の利点を得るには、Gateway を専用ホストで稼働させ、ノートパソコンをローカルの
    画面/カメラ/実行ツール用の **Node** としてペアリングします。[Node](/ja-JP/nodes)と[セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="VPS の最小要件と推奨 OS は何ですか？">
    - **絶対最小要件：** 1 vCPU、1 GB RAM、約500 MBのディスク。
    - **推奨：** 余裕を持たせるために 1～2 vCPU、2 GB 以上の RAM（ログ、メディア、複数チャネル）。Node ツールやブラウザー自動化は多くのリソースを消費する場合があります。

    OS：**Ubuntu LTS**（または最新の Debian/Ubuntu）— 最も十分にテストされている Linux のインストール方法です。

    ドキュメント：[Linux](/ja-JP/platforms/linux)、[VPS ホスティング](/ja-JP/vps)。

  </Accordion>

  <Accordion title="OpenClaw を VM で実行できますか？また、要件は何ですか？">
    はい。VM は VPS と同様に扱ってください。常時稼働し、アクセス可能で、Gateway と
    有効にするチャネルに十分な RAM が必要です。

    - **絶対最小要件：** 1 vCPU、1 GB RAM。
    - **推奨：** 複数チャネル、ブラウザー自動化、またはメディアツールを使用する場合は 2 GB 以上の RAM。
    - **OS：** Ubuntu LTS またはその他の最新の Debian/Ubuntu。

    Windows では、デスクトップのセットアップには **Windows Hub** を使用するか、幅広いツールとの互換性を備えた
    Linux 形式の Gateway VM として WSL2 を使用してください。[Windows](/ja-JP/platforms/windows)、[VPS ホスティング](/ja-JP/vps)を参照してください。
    macOS を VM で実行する場合は、[macOS VM](/ja-JP/install/macos-vm)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [よくある質問](/ja-JP/help/faq) - メインの FAQ（モデル、セッション、Gateway、セキュリティなど）
- [インストールの概要](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [トラブルシューティング](/ja-JP/help/troubleshooting)
