---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - より深いデバッグの前に、ユーザーから報告された問題をトリアージすること
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-21T13:35:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# よくある質問

実際のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）に向けた簡潔な回答と、より詳しいトラブルシューティングをまとめています。ランタイム診断については [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 問題が起きたときの最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、Gateway/サービス到達性、エージェント/セッション、プロバイダー設定 + ランタイムの問題（Gateway に到達できる場合）。

2. **共有しやすいレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは秘匿化）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーのランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   ライブ Gateway ヘルスプローブを実行します。サポートされている場合はチャネルプローブも含まれます
   （到達可能な Gateway が必要です）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追跡**

   ```bash
   openclaw logs --follow
   ```

   RPC がダウンしている場合は、代わりに次を使ってください:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/ja-JP/logging) と [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復または移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

<AccordionGroup>
  <Accordion title="行き詰まりました。最速で抜け出す方法は？">
    **あなたのマシンを見られる** ローカル AI エージェントを使ってください。これは Discord で質問するよりはるかに効果的です。なぜなら、「行き詰まった」というケースの多くは、リモートの支援者には調べられない **ローカル設定や環境の問題** だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンドの実行、ログの調査、そしてマシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正支援ができます。hackable（git）インストールを通じて
    **完全なソースチェックアウト** を渡してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw が **git チェックアウトから** インストールされるため、エージェントはコードとドキュメントを読めて、
    実行中の正確なバージョンについて推論できます。あとで `--install-method git` なしで
    インストーラーを再実行すれば、いつでも stable に戻せます。

    ヒント: 修正はエージェントに **計画と監督**（段階的）をさせ、必要なコマンドだけを実行してください。
    そうすると変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    助けを求めるときは、まず次のコマンドから始めて出力を共有してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: Gateway/エージェントの健全性 + 基本設定のクイックスナップショット。
    - `openclaw models status`: プロバイダー認証 + モデル可用性を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証し修復します。

    そのほかに役立つ CLI チェック: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    クイックデバッグループ: [問題が起きたときの最初の 60 秒](#問題が起きたときの最初の-60-秒)。
    インストールドキュメント: [Install](/ja-JP/install), [Installer flags](/ja-JP/install/installer), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由の意味は何ですか？">
    よくある Heartbeat のスキップ理由:

    - `quiet-hours`: 設定された active-hours の時間帯外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけのひな形しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、どのタスク間隔もまだ期限に達していない
    - `alerts-disabled`: Heartbeat の可視性がすべて無効（`showOk`, `showAlerts`, `useIndicator` がすべて off）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進められます。スキップされた実行では、タスクは完了扱いになりません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストール方法とセットアップ方法は？">
    リポジトリでは、ソースから実行し、オンボーディングを使う方法を推奨しています:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動でビルドできます。オンボーディング後は、通常 Gateway を **18789** 番ポートで実行します。

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
    ウィザードはオンボーディング直後に、クリーンな（トークン化されていない）ダッシュボード URL でブラウザーを開き、概要にもそのリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシン上で表示された URL をコピー＆ペーストしてください。
  </Accordion>

  <Accordion title="localhost とリモートでは、ダッシュボード認証はどう違いますか？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret 認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。
    - トークンの取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ shared secret が設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: bind は loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、identity header が Control UI/WebSocket 認証を満たします（shared secret の貼り付けは不要で、信頼された Gateway ホストを前提とします）。ただし HTTP API では、意図的に private-ingress `none` や trusted-proxy HTTP 認証を使わない限り、引き続き shared-secret 認証が必要です。
      同一クライアントからの不正な同時 Serve 認証試行は、failed-auth limiter に記録される前に直列化されるため、2 回目の不正リトライですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行するか（またはパスワード認証を設定し）、`http://<tailscale-ip>:18789/` を開いてから、ダッシュボード設定に対応する shared secret を貼り付けます。
    - **Identity-aware reverse proxy**: Gateway を非 loopback の trusted proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、その proxy URL を開きます。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。トンネル経由でも shared-secret 認証は引き続き適用されるため、求められたら設定済みトークンまたはパスワードを貼り付けてください。

    bind モードと認証の詳細については [Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用に exec approval の設定が 2 つあるのはなぜですか？">
    それぞれ異なる層を制御します:

    - `approvals.exec`: 承認プロンプトをチャット送信先へ転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec approval 用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、依然として実際の承認ゲートです。チャット設定は、承認
    プロンプトをどこに表示するか、そして人がどう応答できるかだけを制御します。

    多くのセットアップでは **両方は不要** です:

    - そのチャットがすでにコマンドと返信をサポートしている場合、同一チャットでの `/approve` は共有パス経由で動作します。
    - サポートされたネイティブチャネルが approver を安全に推定できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM 優先のネイティブ承認を自動有効化します。
    - ネイティブの承認カード/ボタンが利用可能な場合、そのネイティブ UI が主経路です。チャット承認が利用不可、または手動承認のみが唯一の経路だとツール結果が示した場合にのみ、エージェントは手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的な ops ルームにも転送する必要がある場合にのみ使ってください。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを元のルーム/トピックにも明示的に投稿したい場合にのみ使ってください。
    - Plugin 承認はさらに別です。デフォルトでは同一チャットの `/approve` を使い、任意で `approvals.plugin` 転送を使え、さらに一部のネイティブチャネルだけがその上に plugin 承認のネイティブ処理を維持します。

    要するに、転送はルーティングのため、ネイティブクライアント設定はより豊かなチャネル固有 UX のためです。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway には Bun は **非推奨** です。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 コア**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で動作可能** と明記されています。

    追加の余裕（ログ、メディア、他サービス）が欲しい場合は **2GB を推奨** しますが、
    これは厳密な最小要件ではありません。

    ヒント: 小型の Pi/VPS で Gateway をホストし、ノート PC/スマートフォン上の **nodes** を組み合わせて
    ローカルの画面/カメラ/canvas やコマンド実行を行えます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi へのインストールのコツはありますか？">
    短く言うと、動きますが、多少の荒さは想定してください。

    - **64-bit** OS を使い、Node は 22 以上を維持してください。
    - ログ確認や高速更新ができるよう、**hackable（git）インストール** を優先してください。
    - チャネルや Skills なしで始めて、そこから 1 つずつ追加してください。
    - 不思議なバイナリ問題に遭遇した場合、たいていは **ARM 互換性** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まります / オンボーディングが hatch しません。どうすればよいですか？">
    その画面は、Gateway に到達できて認証されていることが前提です。TUI も初回 hatch 時に
    自動で「Wake up, my friend!」を送信します。その行が表示されても **返信がなく**、
    トークンが 0 のままなら、エージェントは実行されていません。

    1. Gateway を再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. ステータスと認証を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも止まる場合は、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gateway がリモートにある場合は、トンネル/Tailscale 接続が有効で、UI
    が正しい Gateway を指していることを確認してください。[Remote access](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、新しいマシン（Mac mini）へセットアップを移行できますか？">
    はい。**状態ディレクトリ** と **ワークスペース** をコピーし、その後 Doctor を 1 回実行してください。これにより、
    **両方** の場所をコピーしさえすれば、ボットを「まったく同じ状態」（メモリ、セッション履歴、認証、チャネル
    状態）で維持できます:

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. ワークスペース（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway サービスを再起動します。

    これにより、設定、認証プロファイル、WhatsApp 認証情報、セッション、メモリが保持されます。もし
    リモートモードを使っている場合は、Gateway ホストがセッションストアとワークスペースを所有していることを忘れないでください。

    **重要:** ワークスペースだけを GitHub にコミット/プッシュしている場合、バックアップしているのは
    **メモリ + ブートストラップファイル** だけであり、**セッション履歴や認証** は含まれません。これらは
    `~/.openclaw/` 配下にあります（たとえば `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [Migrating](/ja-JP/install/migrating), [ディスク上の保存場所](#ディスク上の保存場所),
    [Agent workspace](/ja-JP/concepts/agent-workspace), [Doctor](/ja-JP/gateway/doctor),
    [Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新の項目は上部にあります。最上部のセクションが **Unreleased** と表示されている場合、
    次の日付付きセクションが最新のリリース済みバージョンです。項目は **Highlights**、**Changes**、**Fixes**
    （必要に応じて docs/other セクションも）ごとにまとまっています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。これを無効にするか、
    `docs.openclaw.ai` を許可リストに追加してから再試行してください。
    解除に向けて、こちらから報告にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    それでもサイトにアクセスできない場合、ドキュメントは GitHub 上にもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **stable** と **beta** は、別々のコードラインではなく **npm dist-tag** です:

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格手順で同じバージョンが `latest` に移されます。メンテナーは必要に応じて
    直接 `latest` に公開することもあります。そのため、昇格後は beta と stable が
    **同じバージョン** を指すことがあります。

    変更内容はこちらで確認できます:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta 版はどうインストールしますか？ beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag `beta` です（昇格後は `latest` と同じになることがあります）。
    **Dev** は `main`（git）の移動中の先頭で、公開されると npm dist-tag `dev` を使います。

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

  <Accordion title="最新の機能を試すにはどうすればよいですか？">
    方法は 2 つあります:

    1. **Dev チャネル（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチへ切り替わり、ソースから更新されます。

    2. **Hackable install（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これでローカルのリポジトリが手に入り、編集したうえで git 経由で更新できます。

    手動でクリーンに clone したい場合は、次を使ってください:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/cli/update), [Development channels](/ja-JP/install/development-channels),
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらいかかりますか？">
    目安:

    - **Install:** 2〜5 分
    - **Onboarding:** 設定するチャネル/モデルの数に応じて 5〜15 分

    途中で止まる場合は、[Installer stuck](#クイックスタートと初回セットアップ)
    と [行き詰まりました](#クイックスタートと初回セットアップ) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まります。もっと詳しい出力を見るには？">
    **詳細出力** を付けてインストーラーを再実行してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose 付き beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    hackable（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等操作:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグがありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    そのほかのオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows でインストール時に git not found や openclaw not recognized と表示されます">
    Windows でよくある問題は 2 つあります:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に入っていることを確認してください。
    - PowerShell を閉じて開き直し、その後インストーラーを再実行してください。

    **2) インストール後に openclaw is not recognized と表示される**

    - npm のグローバル bin フォルダーが PATH に入っていません。
    - パスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` 接尾辞は不要です。ほとんどのシステムでは `%AppData%\npm` です）。
    - PATH 更新後は PowerShell を閉じて開き直してください。

    最もスムーズな Windows セットアップにしたい場合は、ネイティブ Windows ではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語が文字化けします。どうすればよいですか？">
    これは通常、ネイティブ Windows シェルでのコンソールコードページ不一致です。

    症状:

    - `system.run`/`exec` 出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShell での簡単な回避策:

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

    最新の OpenClaw でもまだ再現する場合は、次で追跡/報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントで疑問が解決しませんでした。どうすればもっとよい答えを得られますか？">
    完全なソースとドキュメントをローカルで持てるよう **hackable（git）インストール** を使い、
    そのフォルダー _から_ あなたの bot（または Claude/Codex）に質問してください。そうすればリポジトリを読んで
    より正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするにはどうすればよいですか？">
    短い答え: Linux ガイドに従い、その後オンボーディングを実行してください。

    - Linux のクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + 更新: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするにはどうすればよいですか？">
    Linux VPS であればどれでも動作します。サーバーにインストールし、その後 SSH/Tailscale で Gateway にアクセスしてください。

    ガイド: [exe.dev](/ja-JP/install/exe-dev), [Hetzner](/ja-JP/install/hetzner), [Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPS のインストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめた **ホスティングハブ** を用意しています。1 つ選んでガイドに従ってください:

    - [VPS hosting](/ja-JP/vps)（すべてのプロバイダーを 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作: **Gateway はサーバー上で動作** し、ラップトップ/スマートフォンから
    Control UI（または Tailscale/SSH）経由でアクセスします。状態 + ワークスペースは
    サーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    そのクラウド Gateway に **nodes**（Mac/iOS/Android/headless）をペアリングして、
    Gateway はクラウドに置いたまま、ローカルの画面/カメラ/canvas へのアクセスや
    ラップトップ上でのコマンド実行を行えます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    Nodes: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw に自分自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨しません**。更新フローでは
    Gateway が再起動することがあり（アクティブセッションが切断されます）、クリーンな git checkout が必要になる場合があり、
    確認を求められることもあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

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

    ドキュメント: [Update](/cli/update), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何をしますか？">
    `openclaw onboard` は推奨されるセットアップ経路です。**ローカルモード** では、次の内容を順に案内します:

    - **モデル/認証のセットアップ**（プロバイダー OAuth、API キー、Anthropic setup-token、LM Studio などのローカルモデルオプション）
    - **ワークスペース** の場所 + ブートストラップファイル
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **チャネル**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、および QQ Bot のような同梱チャネル Plugin）
    - **デーモンのインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定済みモデルが不明または認証不足の場合は警告も表示します。

  </Accordion>

  <Accordion title="これを動かすのに Claude や OpenAI のサブスクリプションは必要ですか？">
    いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）でも、
    データをデバイス上に留める **ローカル専用モデル** でも実行できます。サブスクリプション（Claude
    Pro/Max や OpenAI Codex）は、そうしたプロバイダーを認証するための任意の手段です。

    OpenClaw における Anthropic では、実務上の区分は次のとおりです:

    - **Anthropic API キー**: 通常の Anthropic API 課金
    - **OpenClaw における Claude CLI / Claude サブスクリプション認証**: Anthropic のスタッフから、
      この使い方は再び許可されていると伝えられており、Anthropic が新しい
      ポリシーを公開しない限り、OpenClaw は `claude -p`
      の使用をこの統合において許可されたものとして扱います

    長期間稼働する Gateway ホストでは、Anthropic API キーの方が依然として
    より予測しやすいセットアップです。OpenAI Codex OAuth は OpenClaw のような外部
    ツール向けに明示的にサポートされています。

    OpenClaw はほかにも、以下のようなホスト型のサブスクリプション形式オプションをサポートしています:
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan**。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic), [OpenAI](/ja-JP/providers/openai),
    [Qwen Cloud](/ja-JP/providers/qwen),
    [MiniMax](/ja-JP/providers/minimax), [GLM Models](/ja-JP/providers/glm),
    [Local models](/ja-JP/gateway/local-models), [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API キーなしで Claude Max サブスクリプションを使えますか？">
    はい。

    Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられているため、
    OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この統合において
    Claude サブスクリプション認証と `claude -p` の使用を許可されたものとして扱います。
    サーバー側で最も予測しやすいセットアップを望む場合は、代わりに Anthropic API キーを使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）はサポートしていますか？">
    はい。

    Anthropic のスタッフから、この使い方は再び許可されていると伝えられているため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合において
    Claude CLI の再利用と `claude -p` の使用を許可されたものとして扱います。

    Anthropic setup-token はサポートされた OpenClaw のトークン経路として引き続き利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
    本番環境またはマルチユーザーのワークロードでは、Anthropic API キー認証の方が依然として
    より安全で予測しやすい選択肢です。OpenClaw でほかのサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="なぜ Anthropic から HTTP 429 rate_limit_error が表示されるのですか？">
これは、現在のウィンドウで **Anthropic のクォータ/レート制限** を使い切ったことを意味します。**Claude CLI** を
使っている場合は、ウィンドウがリセットされるのを待つか、プランをアップグレードしてください。**Anthropic API キー** を
使っている場合は、使用量/課金について Anthropic Console を確認し、
必要に応じて制限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests`、そのリクエストは
    Anthropic の 1M コンテキストベータ（`context1m: true`）を使おうとしています。これは、
    使用中の認証情報が長文コンテキスト課金に対応している場合にのみ動作します（API キー課金、または
    Extra Usage を有効にした OpenClaw の Claude-login 経路）。

    ヒント: **フォールバックモデル** を設定すると、あるプロバイダーがレート制限中でも OpenClaw が返信を続けられます。
    [Models](/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には同梱の **Amazon Bedrock (Converse)** プロバイダーがあります。AWS 環境マーカーが存在する場合、OpenClaw はストリーミング/テキスト Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` プロバイダーとして統合できます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動のプロバイダーエントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。管理されたキー方式を好む場合は、Bedrock の前段に OpenAI 互換プロキシを置く方法も引き続き有効です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートしています。オンボーディングは OAuth フローを実行でき、適切な場合はデフォルトモデルを `openai-codex/gpt-5.4` に設定します。[Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="なぜ ChatGPT GPT-5.4 では OpenClaw の openai/gpt-5.4 が有効にならないのですか？">
    OpenClaw はこの 2 つの経路を別々に扱います:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 直接の OpenAI Platform API

    OpenClaw では、ChatGPT/Codex サインインは `openai-codex/*` 経路に接続されており、
    直接の `openai/*` 経路には接続されていません。OpenClaw で直接 API 経路を
    使いたい場合は、`OPENAI_API_KEY`（または同等の OpenAI プロバイダー設定）を設定してください。
    OpenClaw で ChatGPT/Codex サインインを使いたい場合は、`openai-codex/*` を使ってください。

  </Accordion>

  <Accordion title="なぜ Codex OAuth の制限は ChatGPT Web と異なることがあるのですか？">
    `openai-codex/*` は Codex OAuth 経路を使い、その利用可能なクォータウィンドウは
    OpenAI によって管理され、プラン依存です。実際には、両方が同じアカウントに紐付いていても、
    それらの制限は ChatGPT Web サイト/アプリの体験と異なる場合があります。

    OpenClaw は現在見えているプロバイダー使用量/クォータウィンドウを
    `openclaw models status` に表示できますが、ChatGPT Web の
    権限を直接 API アクセスへ変換したり正規化したりはしません。直接の OpenAI Platform
    課金/制限経路が必要な場合は、API キー付きの `openai/*` を使ってください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）はサポートされていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでの
    サブスクリプション OAuth の使用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定しますか？">
    Gemini CLI は、`openclaw.json` 内の client id や secret ではなく、**Plugin 認証フロー** を使います。

    手順:

    1. ローカルに Gemini CLI をインストールして、`gemini` が `PATH` に入るようにします
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化します: `openclaw plugins enable google`
    3. ログインします: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください

    これにより OAuth トークンは Gateway ホスト上の認証プロファイルに保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="軽い雑談ならローカルモデルでも大丈夫ですか？">
    通常はいいえ。OpenClaw には大きなコンテキストと強い安全性が必要です。小さなモデルでは切り詰めや漏れが起きます。どうしても使うなら、ローカルで実行できる **最大** のモデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。より小さい/量子化されたモデルは prompt injection リスクを高めます。詳しくは [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定リージョン内に留めるにはどうすればよいですか？">
    リージョン固定のエンドポイントを選んでください。OpenRouter は MiniMax、Kimi、GLM に対して US ホスト型オプションを提供しているため、データをリージョン内に留めたい場合は US ホスト版を選択してください。選択したリージョン付きプロバイダーを尊重しつつフォールバックを利用できるよう、`models.mode: "merge"` を使って Anthropic/OpenAI を並べて一覧化することもできます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux で動作します（Windows は WSL2 経由）。Mac mini は任意です。常時稼働ホストとして
    購入する人もいますが、小型の VPS、ホームサーバー、または Raspberry Pi 級のマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール** を使う場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles サーバーは任意の Mac 上で動作し、Gateway は Linux や別の場所で動作できます。ほかの macOS 専用ツールが必要なら、Gateway を Mac 上で動かすか、macOS Node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes), [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか？">
    Messages にサインインしている **何らかの macOS デバイス** が必要です。Mac mini である必要はなく、
    どの Mac でも構いません。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux や別の場所で動作できます。

    よくある構成:

    - Linux/VPS 上で Gateway を動かし、Messages にサインインしている任意の Mac 上で BlueBubbles サーバーを動かす。
    - 最も単純な単一マシン構成にしたい場合は、すべてを Mac 上で動かす。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes),
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を動かすために Mac mini を買った場合、MacBook Pro から接続できますか？">
    はい。**Mac mini で Gateway を動かし**、MacBook Pro は
    **Node**（コンパニオンデバイス）として接続できます。Node は Gateway を実行せず、
    そのデバイス上の画面/カメラ/canvas や `system.run` などの追加機能を提供します。

    よくあるパターン:

    - Gateway は Mac mini 上（常時稼働）。
    - MacBook Pro は macOS アプリまたは Node ホストを実行し、Gateway にペアリングする。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使う。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は **非推奨** です。特に WhatsApp や Telegram でランタイムの不具合が見られます。
    安定した Gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、本番用ではない Gateway で、
    WhatsApp/Telegram なしの構成で試してください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れればよいですか？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram ユーザー ID**（数値）です。bot のユーザー名ではありません。

    セットアップでは数値ユーザー ID のみを受け付けます。すでに設定にレガシーな `@username` エントリがある場合、`openclaw doctor --fix` で解決を試みられます。

    より安全な方法（サードパーティ bot 不要）:

    - bot に DM を送り、その後 `openclaw logs --follow` を実行して `from.id` を確認します。

    公式 Bot API:

    - bot に DM を送り、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を確認します。

    サードパーティ（プライバシー性は低い）:

    - `@userinfobot` または `@getidsbot` に DM します。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が 1 つの WhatsApp 番号を使い、それぞれ別の OpenClaw インスタンスを使うことはできますか？">
    はい。**マルチエージェントルーティング** によって可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を別々の `agentId` にバインドすれば、それぞれが独自のワークスペースとセッションストアを持てます。返信は引き続き **同じ WhatsApp アカウント** から送られ、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用 Opus」エージェントを実行できますか？'>
    はい。マルチエージェントルーティングを使ってください。各エージェントに独自のデフォルトモデルを割り当て、その後、受信ルート（プロバイダーアカウントまたは特定の peer）を各エージェントにバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。あわせて [Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux でも動作しますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw を systemd 経由で実行する場合は、サービスの PATH に `/home/linuxbrew/.linuxbrew/bin`（または使用中の brew prefix）が含まれていることを確認してください。そうしないと、非ログインシェルで `brew` によってインストールされたツールが解決されません。
    最近のビルドでは、Linux の systemd サービスで一般的なユーザー bin ディレクトリ（たとえば `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加され、`PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` が設定されていればそれらも尊重されます。

  </Accordion>

  <Accordion title="hackable git install と npm install の違い">
    - **Hackable（git）install:** 完全なソースチェックアウト付きで編集可能、コントリビューターに最適です。
      ローカルでビルドを実行でき、コード/ドキュメントを修正できます。
    - **npm install:** グローバル CLI インストールで、リポジトリは含まれず、「とにかく動かしたい」場合に最適です。
      更新は npm dist-tag から取得します。

    ドキュメント: [はじめに](/ja-JP/start/getting-started), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとから npm install と git install を切り替えられますか？">
    はい。もう一方の方式をインストールしてから、Gateway サービスが新しいエントリーポイントを指すよう Doctor を実行してください。
    これによって **データが削除されることはありません**。変更されるのは OpenClaw のコードインストールだけです。状態
    （`~/.openclaw`）とワークスペース（`~/.openclaw/workspace`）はそのまま残ります。

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

    Doctor は Gateway サービスのエントリーポイント不一致を検出し、現在のインストールに合わせてサービス設定を書き換えることを提案します（自動化では `--repair` を使ってください）。

    バックアップのヒント: [バックアップ戦略](#ディスク上の保存場所) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノート PC と VPS のどちらで実行すべきですか？">
    短い答え: **24 時間 365 日の信頼性が必要なら VPS を使ってください**。最小の手間を優先し、
    スリープや再起動を許容できるなら、ローカルで実行してください。

    **ノート PC（ローカル Gateway）**

    - **利点:** サーバー費用が不要、ローカルファイルへ直接アクセスできる、ブラウザーウィンドウを表示したまま使える。
    - **欠点:** スリープ/ネットワーク切断 = 接続断、OS 更新/再起動で中断される、起動したままにしておく必要がある。

    **VPS / クラウド**

    - **利点:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題がない、稼働を維持しやすい。
    - **欠点:** 多くはヘッドレスで動作する（スクリーンショットを使う）、ファイルアクセスはリモートのみ、更新には SSH が必要。

    **OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost/Discord はいずれも VPS で問題なく動作します。実際のトレードオフは **ヘッドレスブラウザー** か表示ブラウザーか、という点だけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨のデフォルト:** 以前に Gateway の切断を経験しているなら VPS。ローカルファイルアクセスや表示ブラウザーでの UI 自動化が必要で、普段から Mac を使っているならローカルは非常に便利です。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を動かすことはどれくらい重要ですか？">
    必須ではありませんが、**信頼性と分離のために推奨** されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ/再起動による中断が少ない、権限が整理しやすい、動かし続けやすい。
    - **共用ノート PC/デスクトップ:** テストや能動的な利用にはまったく問題ありませんが、マシンのスリープや更新時に停止が発生する前提になります。

    両方の利点を取りたいなら、Gateway は専用ホストに置き、ノート PC をローカルの画面/カメラ/exec ツール用の **Node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティガイダンスについては [Security](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="最小 VPS 要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャネルなら:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB のディスク。
    - **推奨:** 1〜2 vCPU、2GB RAM 以上の余裕（ログ、メディア、複数チャネル向け）。Node ツールやブラウザー自動化はリソースを多く使うことがあります。

    OS: **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使ってください。Linux インストール経路はそこで最もよく検証されています。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を実行できますか？ 要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、十分な
    RAM を持ち、Gateway と有効化したチャネルを実行できる必要があります。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを使うなら 2GB RAM 以上。
    - **OS:** Ubuntu LTS またはその他の最新 Debian/Ubuntu 系。

    Windows を使っている場合、**WSL2 が最も簡単な VM 風セットアップ** であり、ツール互換性も最も高いです。[Windows](/ja-JP/platforms/windows), [VPS hosting](/ja-JP/vps) を参照してください。
    VM 上で macOS を動かしている場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは何か、1 段落で教えてください">
    OpenClaw は、自分のデバイス上で動かす個人用 AI アシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、および QQ Bot などの同梱チャネル Plugin）で返信でき、サポートされるプラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働のコントロールプレーンであり、アシスタントが製品そのものです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは **ローカルファーストなコントロールプレーン** であり、
    **自分のハードウェア** 上で有能なアシスタントを動かし、普段使っているチャットアプリからアクセスでき、
    状態を持つセッション、メモリ、ツールを使いつつ、ワークフローの制御をホスト型
    SaaS に渡さずに済みます。

    主な特長:

    - **自分のデバイス、自分のデータ:** Gateway は好きな場所（Mac、Linux、VPS）で動かせ、ワークスペース + セッション履歴はローカルに保持できます。
    - **Web サンドボックスではなく実際のチャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、サポートされるプラットフォームではモバイル音声と Canvas も使えます。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティング
      とフェイルオーバー付きで利用できます。
    - **ローカル専用オプション:** ローカルモデルを実行すれば、必要に応じて **すべてのデータを自分のデバイス上に留められます**。
    - **マルチエージェントルーティング:** チャネル、アカウント、またはタスクごとにエージェントを分けられ、それぞれが独自の
      ワークスペースとデフォルト設定を持てます。
    - **オープンソースで hackable:** ベンダーロックインなしで調査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway), [Channels](/ja-JP/channels), [Multi-agent](/ja-JP/concepts/multi-agent),
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトとしておすすめなのは:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリを試作する（構成、画面、API 計画）。
    - ファイルやフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分け、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な用途トップ 5 は何ですか？">
    日常的な成果は、たいてい次のような形です:

    - **個人向けブリーフィング:** 受信箱、カレンダー、気になるニュースの要約。
    - **調査とドラフト作成:** 手早い調査、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ:** Cron や Heartbeat による通知やチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web 作業の反復。
    - **デバイス間連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS 向けのリード獲得、営業、広告、ブログに役立ちますか？">
    はい、**調査、選別、ドラフト作成** には役立ちます。サイトを巡回し、候補リストを作り、
    見込み客を要約し、営業文や広告コピーの下書きを書けます。

    **営業送信や広告配信** については、人間をループ内に残してください。スパムを避け、現地の法律と
    プラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、
    OpenClaw に下書きを作らせて、あなたが承認することです。

    ドキュメント: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発では Claude Code と比べてどんな利点がありますか？">
    OpenClaw は **個人アシスタント** と調整レイヤーであり、IDE の置き換えではありません。リポジトリ内で
    最速の直接的なコーディングループが必要なら Claude Code や Codex を使ってください。永続的なメモリ、
    デバイス横断アクセス、ツールオーケストレーションが欲しいときに OpenClaw を使ってください。

    利点:

    - セッションをまたいだ **永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、hook）
    - **常時稼働 Gateway**（VPS 上で動かし、どこからでも操作可能）
    - ローカルのブラウザー/画面/カメラ/exec 用の **Nodes**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理対象のオーバーライドを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加してください。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱版 → `skills.load.extraDirs` なので、管理対象のオーバーライドは git に触れずに同梱 Skills より優先されます。Skill をグローバルにインストールしつつ、一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。上流に取り込む価値のある編集だけをリポジトリに入れ、PR として送ってください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。追加ディレクトリは `~/.openclaw/openclaw.json` の `skills.load.extraDirs` で指定できます（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱版 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。その Skill を特定のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです:

    - **Cron jobs**: 分離されたジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: 異なるデフォルトモデルを持つ別々のエージェントへタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って現在のセッションモデルをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中に bot が固まります。どうオフロードすればよいですか？">
    長時間または並列のタスクには **サブエージェント** を使ってください。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    bot に「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使ってください。
    Gateway が今何をしているか（そしてビジーかどうか）を見るには、チャットで `/status` を使ってください。

    トークンのヒント: 長いタスクもサブエージェントもどちらもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord で thread に紐付いたサブエージェントセッションはどう動作しますか？">
    thread binding を使ってください。Discord の thread をサブエージェントまたはセッション対象にバインドできるため、その thread 内の後続メッセージはそのバインドされたセッション上に留まります。

    基本フロー:

    - `sessions_spawn` を `thread: true` とともに使って起動します（永続的な後続処理には、必要に応じて `mode: "session"` も指定）。
    - または `/focus <target>` で手動バインドします。
    - バインド状態の確認には `/agents` を使います。
    - 自動 unfocus の制御には `/session idle <duration|off>` と `/session max-age <duration|off>` を使います。
    - thread を切り離すには `/unfocus` を使います。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定します。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [Configuration Reference](/ja-JP/gateway/configuration-reference), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了したのに、完了通知が間違った場所に送られた、または投稿されませんでした。何を確認すべきですか？">
    まず解決された requester route を確認してください:

    - 完了モードのサブエージェント配信では、バインドされた thread または会話ルートが存在する場合、それが優先されます。
    - 完了元に channel しか含まれていない場合、OpenClaw は requester セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）へフォールバックするため、ダイレクト配信が成功することがあります。
    - バインドされたルートも利用可能な保存済みルートも存在しない場合、ダイレクト配信は失敗し、結果は即時にチャットへ投稿される代わりにキューされたセッション配信へフォールバックします。
    - 無効または古い target でも、キューフォールバックや最終配信失敗が起こることがあります。
    - 子の最後の可視アシスタント返信が厳密なサイレントトークン `NO_REPLY` / `no_reply`、または厳密に `ANNOUNCE_SKIP` の場合、OpenClaw は古い以前の進捗を投稿しないよう、意図的に通知を抑制します。
    - 子がツール呼び出しだけでタイムアウトした場合、その通知は生のツール出力を再掲する代わりに、短い部分進捗サマリーへ要約されることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks), [Session Tools](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron やリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に動いていない場合、
    スケジュールされたジョブは実行されません。

    チェックリスト:

    - Cron が有効であることを確認してください（`cron.enabled`）、また `OPENCLAW_SKIP_CRON` が設定されていないことを確認してください。
    - Gateway が 24 時間 365 日動作していることを確認してください（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストタイムゾーン）を確認してください。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は発火したのに、チャネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` の場合、runner フォールバック送信は想定されません。
    - `channel` / `to` の通知先が不足している、または無効な場合、runner は送信をスキップします。
    - チャネル認証エラー（`unauthorized`, `Forbidden`）は、runner が送信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな isolated result（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、runner もキューされたフォールバック配信を抑制します。

    isolated cron jobs では、チャットルートが利用可能であれば、エージェントは `message`
    ツールを使って直接送信することもできます。`--announce` は、エージェントがまだ送信していない
    最終テキストに対する runner フォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="なぜ isolated cron 実行でモデルが切り替わったり、一度リトライしたりしたのですか？">
    それは通常、重複スケジューリングではなく、ライブモデル切り替え経路です。

    isolated cron は、アクティブな実行が `LiveSessionModelSwitchError` を投げたときに、
    ランタイムのモデル引き継ぎを永続化してリトライできます。そのリトライでは切り替え後の
    provider/model が維持され、切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合、
    cron はそれもリトライ前に永続化します。

    関連する選択ルール:

    - 該当する場合、まず Gmail hook のモデルオーバーライドが優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの cron-session モデルオーバーライド。
    - 最後に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の switch retry の後は、
    cron は無限ループする代わりに中断します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、Skills をワークスペースに配置してください。macOS の Skills UI は Linux では利用できません。
    Skills は [https://clawhub.ai](https://clawhub.ai) で閲覧できます。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    ネイティブの `openclaw skills install` は、アクティブなワークスペースの `skills/`
    ディレクトリに書き込みます。別途 `clawhub` CLI をインストールするのは、自分の Skills を公開または
    同期したい場合だけで構いません。エージェント間で共有するインストールには、Skill を
    `~/.openclaw/skills` 配下に置き、必要に応じて `agents.defaults.skills` または
    `agents.list[].skills` を使って、どのエージェントが参照できるかを絞り込んでください。

  </Accordion>

  <Accordion title="OpenClaw はスケジュール実行や継続的なバックグラウンド実行ができますか？">
    はい。Gateway スケジューラーを使ってください:

    - **Cron jobs** はスケジュール済みまたは繰り返しのタスク向けです（再起動後も保持されます）。
    - **Heartbeat** は「メインセッション」の定期チェック向けです。
    - **Isolated jobs** は要約を投稿したりチャットへ配信したりする自律エージェント向けです。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple の macOS 専用 Skills を実行できますか？">
    直接にはできません。macOS Skills は `metadata.openclaw.os` と必要バイナリによって制御され、Skills は **Gateway ホスト** 上で対象条件を満たす場合にのみシステムプロンプトに表示されます。Linux では、`darwin` 専用の Skills（`apple-notes`、`apple-reminders`、`things-mac` など）は、制御条件を上書きしない限り読み込まれません。

    サポートされている方法は 3 つあります:

    **オプション A - Gateway を Mac 上で動かす（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を動かし、Linux からは [remote mode](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS であるため、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使う（SSH なし）。**
    Linux 上で Gateway を動かし、macOS Node（メニューバーアプリ）をペアリングして、Mac 上で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を利用可能として扱えます。エージェントはそれらの Skills を `nodes` ツール経由で実行します。「Always Ask」を選んだ場合、プロンプト内で「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級者向け）。**
    Gateway は Linux 上に維持しつつ、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。そのうえで、Skill を上書きして Linux を許可し、対象条件を満たすようにします。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. そのラッパーを Linux ホストの `PATH` 上に置きます（例: `~/bin/memo`）。
    3. Skill の metadata を上書きして Linux を許可します（ワークスペースまたは `~/.openclaw/skills`）:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 新しいセッションを開始して、Skills スナップショットを更新します。

  </Accordion>

  <Accordion title="Notion や HeyGen の統合はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 安定した API アクセスには最適です（Notion/HeyGen はどちらも API があります）。
    - **ブラウザー自動化:** コード不要で動きますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを維持したい場合（代理店ワークフローなど）の
    シンプルなパターンは次のとおりです:

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時にそのページを取得するようエージェントに依頼する。

    ネイティブ統合が欲しい場合は、機能要望を出すか、それらの API を対象にした Skill
    を作成してください。

    Skills のインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールはアクティブなワークスペースの `skills/` ディレクトリに入ります。エージェント間で共有する Skills には、`~/.openclaw/skills/<name>/SKILL.md` に配置してください。共有インストールを一部のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部の Skills は Homebrew でインストールされたバイナリを前提とします。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照してください）。[Skills](/ja-JP/tools/skills), [Skills config](/ja-JP/tools/skills-config), [ClawHub](/ja-JP/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する組み込みの `user` browser profile を使ってください:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    独自名を付けたい場合は、明示的な MCP profile を作成してください:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路ではローカルホストのブラウザーまたは接続済み browser Node を利用できます。Gateway が別の場所で動いている場合は、ブラウザーマシン上で Node ホストを実行するか、代わりにリモート CDP を使ってください。

    `existing-session` / `user` の現在の制限:

    - アクションは CSS セレクター駆動ではなく ref 駆動です
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルだけをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードの割り込み、バッチアクションは、引き続き managed browser または raw CDP profile が必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか？">
    はい。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway やサンドボックスイメージ）については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker が制限されているように感じます。フル機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で `node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、同梱ブラウザーは含まれていません。より完全なセットアップにするには:

    - キャッシュが残るように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` を使ってシステム依存をイメージに組み込みます。
    - 同梱 CLI で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker), [Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで、DM は個人用のままにしつつ、グループは公開/サンドボックス化できますか？">
    はい。プライベートなトラフィックが **DM**、公開トラフィックが **グループ** であれば可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使うと、グループ/チャネルセッション（非メインキー）は設定済みのサンドボックスバックエンド内で実行され、メインの DM セッションはホスト上に残ります。バックエンドを選ばない場合のデフォルトは Docker です。次に、サンドボックス化されたセッションで利用可能なツールを `tools.sandbox.tools` で制限してください。

    セットアップ手順 + 設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主な設定リファレンス: [Gateway configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスに bind するにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定してください（例: `"/home/user/src:/src:ro"`）。グローバル + エージェントごとの bind はマージされます。`scope: "shared"` の場合、エージェントごとの bind は無視されます。機密性の高いものには `:ro` を使い、bind はサンドボックスのファイルシステム境界を迂回することを忘れないでください。

    OpenClaw は bind source を、正規化パスと、最も深い既存祖先を通じて解決された canonical path の両方に対して検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、symlink 親を使ったエスケープは fail closed し、許可ルートのチェックも symlink 解決後に引き続き適用されます。

    例と安全上の注意については、[Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように動作しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルにすぎません:

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` のキュレーションされた長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は **サイレントな pre-compaction メモリフラッシュ** も実行し、
    自動 Compaction の前に永続的なノートを書くようモデルに促します。これはワークスペースが
    書き込み可能な場合にのみ動作します（読み取り専用サンドボックスではスキップされます）。[Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリがすぐ忘れます。定着させるにはどうすればよいですか？">
    その事実を **メモリに書く** よう bot に依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。モデルにメモリを保存するよう促すと効果があります。
    モデルは何をすべきか理解しています。それでも忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使っていることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリはずっと保持されますか？ 制限はありますか？">
    メモリファイルはディスク上に保存され、削除するまで保持されます。制限はモデルではなく
    ストレージです。ただし **セッションコンテキスト** は依然としてモデルの
    コンテキストウィンドウに制限されるため、長い会話では Compaction や切り詰めが発生することがあります。そのため
    メモリ検索が存在します。関連する部分だけをコンテキストに戻すためです。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Context](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使う場合に限ります。Codex OAuth は chat/completions をカバーしますが、
    embeddings へのアクセスは付与しません。したがって **Codex でサインインしても（OAuth または
    Codex CLI ログインでも）** セマンティックメモリ検索には役立ちません。OpenAI embeddings
    には依然として実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    自動でプロバイダーを選択します（auth profile、`models.providers.*.apiKey`、または環境変数）。
    OpenAI キーを解決できる場合は OpenAI を優先し、そうでなければ Gemini キーが
    解決できる場合は Gemini、その次に Voyage、その次に Mistral を選びます。リモートキーが利用できない場合、
    メモリ検索は設定するまで無効のままです。ローカルモデル経路が
    設定されていて存在する場合、OpenClaw は
    `local` を優先します。Ollama は `memorySearch.provider = "ollama"` を
    明示的に設定した場合にサポートされます。

    ローカルに留めたい場合は、`memorySearch.provider = "local"`（必要に応じて
    `memorySearch.fallback = "none"` も）を設定してください。Gemini embeddings を使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。embedding
    モデルとして **OpenAI、Gemini、Voyage、Mistral、Ollama、または local** をサポートしています。セットアップ詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル** ですが、**外部サービスは送信した内容を引き続き見ることができます**。

    - **デフォルトでローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      （`~/.openclaw` + あなたのワークスペースディレクトリ）。
    - **必然的にリモート:** モデルプロバイダー（Anthropic/OpenAI など）へ送るメッセージは
      それらの API に送信され、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      自社サーバー上に保存します。
    - **影響範囲は自分で制御できます:** ローカルモデルを使えばプロンプトを自分のマシン内に留められますが、チャネル
      トラフィックは依然としてそのチャネルのサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace), [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はどこにデータを保存しますか？">
    すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります:

    | Path                                                            | 目的                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に auth profile へコピー）    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | auth profile（OAuth、API キー、および任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 用の任意のファイルバック secret payload  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的 `api_key` エントリは除去済み）          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + sessions）                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                           |

    レガシー単一エージェントのパス: `~/.openclaw/agent/*`（`openclaw doctor` で移行されます）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース** に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`（`MEMORY.md` がない場合はレガシーフォールバックの `memory.md`）,
      `memory/YYYY-MM-DD.md`, 任意で `HEARTBEAT.md`。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャネル/プロバイダー状態、auth profile、sessions、logs、
      および共有 Skills（`~/.openclaw/skills`）。

    デフォルトワークスペースは `~/.openclaw/workspace` で、以下で設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後に bot が「忘れる」場合は、Gateway が毎回同じ
    ワークスペースを使って起動していることを確認してください（また、remote mode では **gateway host**
    のワークスペースが使われ、ローカルのノート PC ではないことも忘れないでください）。

    ヒント: 永続的な振る舞いや設定を持たせたい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む** よう bot に依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース** は **非公開** git リポジトリに入れて、
    どこか非公開の場所（たとえば GitHub private）にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化された secret payload）は
    **コミットしないでください**。
    完全な復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外でも作業できますか？">
    はい。ワークスペースは **デフォルトの cwd** とメモリアンカーであり、厳密なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、絶対パスは
    サンドボックス化が有効でない限り、ホスト上の他の場所にもアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。リポジトリをデフォルトの作業ディレクトリにしたい場合は、その
    エージェントの `workspace` をリポジトリルートに向けてください。OpenClaw リポジトリは単なる
    ソースコードです。意図的にその中でエージェントを動かしたいのでない限り、
    ワークスペースは分けてください。

    例（リポジトリをデフォルト cwd にする）:

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode: セッションストアはどこにありますか？">
    セッション状態は **gateway host** によって所有されます。remote mode の場合、重要なのはローカルのノート PC ではなく、リモートマシン上のセッションストアです。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定ファイルの形式は何ですか？ どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から
    オプションの **JSON5** 設定を読み込みます:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルが存在しない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` をデフォルトワークスペースとする設定を含む）が使われます。

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`（または `"tailnet"`）を設定したら、何も listen しなくなった / UI で unauthorized と表示される'>
    非 loopback bind には **有効な gateway 認証経路** が必要です。実際には次のいずれかを意味します:

    - shared-secret 認証: token または password
    - 正しく設定された非 loopback の identity-aware reverse proxy の背後にある `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    注意:

    - `gateway.remote.token` / `.password` だけではローカル gateway 認証は有効になりません。
    - ローカル呼び出し経路では、`gateway.auth.*` が未設定のときに限って `gateway.remote.*` をフォールバックとして使えます。
    - password 認証には、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて未解決の場合、解決は fail closed します（リモートフォールバックで隠されることはありません）。
    - shared-secret の Control UI 構成では、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような identity 付きモードでは、代わりにリクエストヘッダーを使います。shared secret を URL に入れるのは避けてください。
    - `gateway.auth.mode: "trusted-proxy"` の場合、同一ホストの loopback reverse proxy でも trusted-proxy 認証は満たされません。trusted proxy は設定済みの非 loopback source である必要があります。

  </Accordion>

  <Accordion title="なぜ今は localhost でも token が必要なのですか？">
    OpenClaw は loopback を含めて、デフォルトで gateway 認証を強制します。通常のデフォルト経路では token 認証になります。明示的な認証経路が設定されていない場合、gateway 起動時に token mode に解決され、自動生成された token が `gateway.auth.token` に保存されるため、**ローカル WS クライアントも認証が必要** です。これにより、ほかのローカルプロセスが Gateway を呼び出すのを防ぎます。

    別の認証経路を使いたい場合は、password mode（または非 loopback の identity-aware reverse proxy 向けの `trusted-proxy`）を明示的に選べます。**本当に** open loopback にしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定変更後に再起動は必要ですか？">
    Gateway は設定を監視しており、ホットリロードをサポートしています:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更は再起動します
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="CLI のおもしろいタグラインを無効にするにはどうすればよいですか？">
    設定で `cli.banner.taglineMode` を指定してください:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグラインテキストを隠しますが、バナータイトル/バージョン行は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: おもしろい/季節のタグラインをローテーションします（デフォルト動作）。
    - バナー自体をまったく表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

  </Accordion>

  <Accordion title="Web 検索（と Web fetch）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API ベースのプロバイダーでは、通常どおり API キーの設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行してプロバイダーを選んでください。
    環境変数での代替:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` または `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, または `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    プロバイダー固有の web-search 設定は現在 `plugins.entries.<plugin>.config.webSearch.*` にあります。
    レガシーな `tools.web.search.*` プロバイダー経路も一時的に互換性のため読み込まれますが、新しい設定では使うべきではありません。
    Firecrawl の web-fetch フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` にあります。

    注意:

    - allowlist を使っている場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化しない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、最初に準備できた fetch フォールバックプロバイダーを自動検出します。現時点での同梱プロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web tools](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で設定が消えました。どう復旧し、どう防げばよいですか？">
    `config.apply` は **設定全体** を置き換えます。部分オブジェクトを送ると、それ以外は
    すべて削除されます。

    現在の OpenClaw は多くの意図しない破壊的上書きから保護します:

    - OpenClaw 所有の設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動やホットリロードが壊れた場合、Gateway は last-known-good 設定を復元し、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。
    - 復旧後、メインエージェントは起動警告を受け取るため、同じ不正設定を再度盲目的に書き込むことはありません。

    復旧手順:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`、`Config write rejected:`、または `config reload restored last-known-good config` を確認してください。
    - アクティブ設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認してください。
    - 復元されたアクティブ設定が動作するならそれを保持し、意図したキーだけを `openclaw config set` または `config.patch` で戻してください。
    - `openclaw config validate` と `openclaw doctor` を実行してください。
    - last-known-good や拒否ペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャネル/モデルを再設定してください。
    - 予想外の動作だった場合は、最後に分かっている設定またはバックアップを添えてバグ報告してください。
    - ローカルのコーディングエージェントなら、ログや履歴から動作する設定を再構築できることがよくあります。

    防ぐには:

    - 小さな変更には `openclaw config set` を使ってください。
    - 対話的な編集には `openclaw configure` を使ってください。
    - 正確なパスやフィールド形状に自信がない場合は、まず `config.schema.lookup` を使ってください。浅いスキーマノードと、その直下の子要約が返るので、掘り下げやすくなります。
    - 部分的な RPC 編集には `config.patch` を使い、`config.apply` は完全設定の置き換えにのみ使ってください。
    - エージェント実行から owner-only の `gateway` ツールを使っている場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは引き続き拒否されます（同じ保護された exec パスに正規化されるレガシー `tools.bash.*` エイリアスを含みます）。

    ドキュメント: [Config](/cli/config), [Configure](/cli/configure), [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイス間で特化ワーカーを使いながら中央 Gateway を動かすにはどうすればよいですか？">
    一般的なパターンは **1 つの Gateway**（例: Raspberry Pi）+ **Nodes** + **Agents** です:

    - **Gateway（中央）:** channels（Signal/WhatsApp）、routing、sessions を所有します。
    - **Nodes（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`, `canvas`, `camera`）を公開します。
    - **Agents（ワーカー）:** 特化した役割（例: 「Hetzner ops」、「Personal data」）向けの別々の頭脳/ワークスペースです。
    - **サブエージェント:** 並列化したいときに、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [Nodes](/ja-JP/nodes), [Remote access](/ja-JP/gateway/remote), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw のブラウザーはヘッドレスで実行できますか？">
    はい。設定オプションです:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    デフォルトは `false`（ヘッドフル）です。ヘッドレスは一部のサイトで anti-bot チェックを受けやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    ヘッドレスは **同じ Chromium エンジン** を使い、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです:

    - 目に見えるブラウザーウィンドウがありません（視覚確認が必要ならスクリーンショットを使ってください）。
    - 一部のサイトでは、ヘッドレスモードでの自動化により厳しく反応します（CAPTCHA、anti-bot）。
      たとえば、X/Twitter はヘッドレスセッションをよくブロックします。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースブラウザー）に設定し、Gateway を再起動してください。
    完全な設定例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と Nodes

<AccordionGroup>
  <Accordion title="Telegram、gateway、nodes の間でコマンドはどう伝播しますか？">
    Telegram メッセージは **gateway** によって処理されます。gateway がエージェントを実行し、
    Node ツールが必要な場合にのみ **Gateway WebSocket** 経由で Node を呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node は受信プロバイダートラフィックを見ません。受け取るのは node RPC 呼び出しだけです。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントはどうやって自分のコンピューターにアクセスできますか？">
    短い答え: **自分のコンピューターを Node としてペアリング** してください。Gateway は別の場所で動いていても、
    Gateway WebSocket 経由で、ローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を動かします。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達できることを確認します（tailnet bind または SSH トンネル）。
    4. ローカルで macOS アプリを開き、**Remote over SSH** モード（または直接 tailnet）
       で接続して、Node として登録できるようにします。
    5. Gateway 上で Node を承認します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。Node は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS Node をペアリングすると、そのマシン上で `system.run` が可能になります。信頼できるデバイスだけを
    ペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Gateway protocol](/ja-JP/gateway/protocol), [macOS remote mode](/ja-JP/platforms/mac/remote), [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されているのに返信がありません。どうすればよいですか？">
    まず基本を確認してください:

    - Gateway が動作中か: `openclaw gateway status`
    - Gateway ヘルス: `openclaw status`
    - Channel ヘルス: `openclaw channels status`

    次に認証とルーティングを確認してください:

    - Tailscale Serve を使っている場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが有効で、正しいポートを指していることを確認してください。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale), [Remote access](/ja-JP/gateway/remote), [Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス（ローカル + VPS）は互いに会話できますか？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます:

    **最も簡単:** 両方の bot がアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使います。
    Bot A から Bot B にメッセージを送り、その後 Bot B が通常どおり返信するようにします。

    **CLI ブリッジ（汎用）:** スクリプトを実行して、もう一方の Gateway に
    `openclaw agent --message ... --deliver` を呼び出し、もう一方の bot が
    監視しているチャットを対象にします。どちらかの bot がリモート VPS 上にある場合は、
    SSH/Tailscale 経由で CLI の接続先をそのリモート Gateway に向けてください（[Remote access](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象 Gateway に到達できるマシンで実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つの bot が無限ループしないように、ガードレールを追加してください（メンション時のみ、channel
    allowlist、または「bot メッセージには返信しない」ルール）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数エージェントに別々の VPS は必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、それぞれに独自の workspace、model defaults、
    routing を持たせられます。これが通常のセットアップであり、
    エージェントごとに 1 台ずつ VPS を動かすよりも、はるかに安価で簡単です。

    hard isolation（セキュリティ境界）や、共有したくない
    大きく異なる設定が必要な場合にのみ、別々の VPS を使ってください。それ以外では、1 つの Gateway を維持し、
    複数エージェントまたはサブエージェントを使ってください。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人のノート PC で Node を使う利点はありますか？">
    はい。リモート Gateway からノート PC に到達するための第一級の方法が Node であり、
    シェルアクセス以上のことができます。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi 級のマシンで十分で、4 GB RAM もあれば余裕があります）。そのため、常時稼働ホスト + ノート PC を Node とする構成が一般的です。

    - **受信 SSH が不要です。** Node は Gateway WebSocket へ外向きに接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run` はそのノート PC 上の Node の allowlist/承認で制御されます。
    - **より多くのデバイスツール。** Node は `system.run` に加え、`canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ノート PC 上の Node ホスト経由でローカル Chrome を使うか、ホスト上のローカル Chrome に Chrome MCP 経由で接続できます。

    SSH は一時的なシェルアクセスには問題ありませんが、継続的なエージェントワークフローや
    デバイス自動化には Node の方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Node は Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを動かしている場合を除き、ホストごとに実行すべき **gateway は 1 つだけ** です（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）。Node は gateway に接続する周辺機器です
    （iOS/Android Node、またはメニューバーアプリの macOS「node mode」）。ヘッドレスな Node
    ホストや CLI 制御については、[Node host CLI](/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーについて浅いスキーマノード、一致した UI ヒント、直下の子要約を確認します
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能ならホットリロードし、必要なら再起動します
    - `config.apply`: 完全な設定を検証して置き換えます。可能ならホットリロードし、必要なら再起動します
    - owner-only の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。レガシーな `tools.bash.*` エイリアスは同じ保護された exec パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これでワークスペースを設定し、誰が bot を起動できるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定して、Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS でインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac でインストール + ログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効化（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を付けます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使ってください:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback に bind されたまま、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac Node をリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。Node も同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS と Mac が同じ tailnet 上にあることを確認します**。
    2. **macOS アプリを Remote mode で使います**（SSH ターゲットには tailnet ホスト名を使えます）。
       これによりアプリは Gateway ポートをトンネルし、Node として接続します。
    3. gateway 上で **Node を承認します**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol), [Discovery](/ja-JP/gateway/discovery), [macOS remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか？ それとも Node を追加するだけでよいですか？">
    2 台目のノート PC で必要なのが **ローカルツール**（画面/カメラ/exec）だけなら、
    **Node** として追加してください。これにより Gateway は 1 つのままで、設定の重複を避けられます。ローカル Node ツールは
    現在 macOS のみですが、今後ほかの OS にも拡張する予定です。

    **hard isolation** または完全に別々の 2 つの bot が必要な場合にのみ、2 つ目の Gateway をインストールしてください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに次も読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。

    設定内でインラインの環境変数を定義することもできます（プロセス環境に存在しない場合にのみ適用）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位と読み込み元については [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    よくある修正方法は 2 つあります:

    1. 足りないキーを `~/.openclaw/.env` に入れてください。そうすれば、サービスがシェル環境を引き継がなくても読み込まれます。
    2. shell import を有効化します（オプトインの利便機能）:

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    これによりログインシェルが実行され、不足している想定キーだけがインポートされます（上書きはしません）。対応する環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='`COPILOT_GITHUB_TOKEN` を設定したのに、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを表示します。"Shell env: off"
    は、環境変数が存在しないという意味ではなく、OpenClaw が
    ログインシェルを自動で読み込まないという意味にすぎません。

    Gateway をサービス（launchd/systemd）として動かしている場合、シェル
    環境は継承されません。次のいずれかで修正してください:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効化します。
    3. または設定の `env` ブロックに追加します（不足時のみ適用）。

    その後、gateway を再起動して再確認してください:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるにはどうすればよいですか？">
    `/new` または `/reset` を単独メッセージとして送信してください。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送らなければ、セッションは自動でリセットされますか？">
    セッションは `session.idleMinutes` 後に期限切れにできますが、これは **デフォルトで無効** です（デフォルト **0**）。
    有効にするには正の値を設定してください。有効時は、アイドル期間後の **次の**
    メッセージで、そのチャットキーに対する新しいセッション ID が始まります。
    これはトランスクリプトを削除するのではなく、新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を作る方法はありますか？">
    はい。**マルチエージェントルーティング** と **サブエージェント** によって可能です。1 つの調整役
    エージェントと、独自のワークスペースとモデルを持つ複数のワーカーエージェントを作れます。

    ただし、これは **楽しい実験** として捉えるのが最適です。トークン消費が大きく、
    1 つの bot を別々のセッションで使うより効率が悪いことがよくあります。私たちが
    想定している典型的なモデルは、1 つの bot と対話し、並列作業には異なるセッションを使う形です。その
    bot は必要に応じてサブエージェントも起動できます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="なぜタスクの途中でコンテキストが切り詰められたのですか？ どう防げばよいですか？">
    セッションコンテキストはモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルは Compaction や切り詰めを引き起こすことがあります。

    効果的な対策:

    - 現在の状態を要約してファイルに書くよう bot に依頼してください。
    - 長いタスクの前に `/compact` を使い、話題を切り替えるときは `/new` を使ってください。
    - 重要なコンテキストはワークスペースに保持し、それを読み返すよう bot に依頼してください。
    - 長時間または並列の作業にはサブエージェントを使い、メインチャットを小さく保ってください。
    - これが頻発する場合は、より大きなコンテキストウィンドウを持つモデルを選んでください。

  </Accordion>

  <Accordion title="OpenClaw を完全にリセットしつつ、インストールは残すにはどうすればよいですか？">
    reset コマンドを使ってください:

    ```bash
    openclaw reset
    ```

    非対話の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップをやり直します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - 既存の設定を検出すると、オンボーディングでも **Reset** を提案します。[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
    - profile（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各状態ディレクトリをリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。dev 設定 + credentials + sessions + workspace を消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。どうリセットまたは Compaction すればよいですか？'>
    次のいずれかを使ってください:

    - **Compaction**（会話は維持しつつ、古いターンを要約します）:

      ```
      /compact
      ```

      または、要約の方針を指定する `/compact <instructions>`。

    - **Reset**（同じチャットキーに対して新しいセッション ID を開始します）:

      ```
      /new
      /reset
      ```

    それでも繰り返す場合:

    - **session pruning**（`agents.defaults.contextPruning`）を有効化または調整して、古いツール出力を削減してください。
    - より大きなコンテキストウィンドウを持つモデルを使ってください。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction), [Session pruning](/ja-JP/concepts/session-pruning), [Session management](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='なぜ「LLM request rejected: messages.content.tool_use.input field required」と表示されるのですか？'>
    これはプロバイダーの検証エラーです。モデルが必須の
    `input` なしで `tool_use` ブロックを出力しました。通常は、セッション履歴が古いか破損していることを意味します（長い thread
    やツール/スキーマ変更の後によく起こります）。

    対処法: `/new`（単独メッセージ）で新しいセッションを開始してください。

  </Accordion>

  <Accordion title="なぜ 30 分ごとに Heartbeat メッセージが届くのですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth 認証使用時は **1h**）。調整または無効化するには:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // または無効化には "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在していても、実質的に空（空行と `# Heading` のような markdown
    ヘッダーだけ）の場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。
    ファイルが存在しない場合でも、Heartbeat は実行され、何をするかはモデルが判断します。

    エージェントごとのオーバーライドには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「bot アカウント」を追加する必要はありますか？'>
    いいえ。OpenClaw は **自分のアカウント** 上で動作するため、あなたがグループにいれば、OpenClaw はそれを見られます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    **自分だけ** がグループ返信をトリガーできるようにしたい場合:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="WhatsApp グループの JID を取得するにはどうすればよいですか？">
    方法 1（最速）: ログを追跡しながら、グループでテストメッセージを送ります:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探してください。たとえば:
    `1234567890-1234567890@g.us`。

    方法 2（すでに設定済み/allowlist 済みの場合）: 設定からグループ一覧を表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs)。

  </Accordion>

  <Accordion title="なぜ OpenClaw はグループで返信しないのですか？">
    よくある原因は 2 つあります:

    - mention gating が有効です（デフォルト）。bot を @mention する必要があります（または `mentionPatterns` に一致させる必要があります）。
    - `channels.whatsapp.groups` を `"*"` なしで設定していて、そのグループが allowlist に入っていません。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションに集約されます。グループ/チャネルは独自のセッションキーを持ち、Telegram topic / Discord thread は別セッションです。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="ワークスペースやエージェントは何個まで作れますか？">
    ハード制限はありません。数十個、場合によっては数百個でも問題ありませんが、次の点には注意してください:

    - **ディスク増加:** sessions + transcripts は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** エージェントが増えるほど、同時モデル使用量も増えます。
    - **運用負荷:** エージェントごとの auth profile、workspace、channel routing。

    ヒント:

    - エージェントごとに **1 つのアクティブ** workspace（`agents.defaults.workspace`）を維持してください。
    - ディスクが増えてきたら、古い sessions を削除してください（JSONL または store entries）。
    - `openclaw doctor` を使うと、迷子の workspace や profile の不一致を見つけられます。

  </Accordion>

  <Accordion title="複数の bot やチャットを同時に実行できますか（Slack）？ どう設定すべきですか？">
    はい。**Multi-Agent Routing** を使うと、複数の独立したエージェントを実行し、
    channel/account/peer ごとに受信メッセージをルーティングできます。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。anti-bot、CAPTCHA、MFA によって
    自動化が妨げられることはあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザーを実行しているマシン上で CDP を使ってください。

    ベストプラクティスのセットアップ:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - 役割ごとに 1 つのエージェント（bindings）。
    - それらのエージェントにバインドされた Slack channel。
    - 必要に応じて、Chrome MCP または Node 経由のローカルブラウザー。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [Browser](/ja-JP/tools/browser), [Nodes](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル: デフォルト、選択、エイリアス、切り替え

<AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次で設定したものです:

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` 形式で参照されます（例: `openai/gpt-5.4`）。provider を省略した場合、OpenClaw はまずエイリアスを試し、次にその正確な model id に対する一意の configured-provider 一致を試し、それでもだめなら非推奨の互換経路として設定済みのデフォルト provider にフォールバックします。その provider が設定済みのデフォルトモデルをもはや公開していない場合、OpenClaw は古くなった削除済み provider のデフォルトを表示する代わりに、最初の設定済み provider/model にフォールバックします。それでも **明示的に** `provider/model` を設定するべきです。

  </Accordion>

  <Accordion title="どのモデルをおすすめしますか？">
    **推奨デフォルト:** プロバイダースタックで利用可能な、最も強力な最新世代モデルを使ってください。
    **ツール有効または信頼できない入力を扱うエージェント向け:** コストよりもモデル性能を優先してください。
    **日常的/低リスクのチャット向け:** より安価なフォールバックモデルを使い、エージェントの役割ごとにルーティングしてください。

    MiniMax には専用ドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [Local models](/ja-JP/gateway/local-models)。

    目安: 重要な作業には **負担できる範囲で最良のモデル** を使い、日常チャットや要約にはより安価な
    モデルを使ってください。モデルはエージェントごとにルーティングでき、長いタスクはサブエージェントで
    並列化できます（各サブエージェントはトークンを消費します）。[Models](/ja-JP/concepts/models) と
    [Sub-agents](/ja-JP/tools/subagents) を参照してください。

    強い警告: より弱い/量子化しすぎたモデルは prompt
    injection や危険な挙動に対してより脆弱です。[Security](/ja-JP/gateway/security) を参照してください。

    詳細: [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **モデルコマンド** を使うか、**モデル** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な方法:

    - チャットで `/model`（手早く、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話型）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換えるつもりでない限り、部分オブジェクトでの `config.apply` は避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup のペイロードには、正規化されたパス、浅いスキーマのドキュメント/制約、直下の子要約が含まれます。
    部分更新向けです。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/ja-JP/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールします
    2. `ollama pull gemma4` のようにローカルモデルを pull します
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行します
    4. `openclaw onboard` を実行して `Ollama` を選びます
    5. `Local` または `Cloud + Local` を選びます

    注意:

    - `Cloud + Local` ではクラウドモデルとローカル Ollama モデルの両方が使えます
    - `kimi-k2.5:cloud` のようなクラウドモデルはローカル pull を必要としません
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使います

    セキュリティ上の注意: 小さいモデルや大きく量子化されたモデルは prompt
    injection に対してより脆弱です。ツールを使える bot には **大きなモデル** を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール allowlist を有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama), [Local models](/ja-JP/gateway/local-models),
    [Model providers](/ja-JP/concepts/model-providers), [Security](/ja-JP/gateway/security),
    [Sandboxing](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はモデルに何を使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わることもあります。固定の推奨プロバイダーはありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティに敏感な/ツール有効のエージェントには、利用可能な最も強力な最新世代モデルを使ってください。
  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか？">
    `/model` コマンドを単独メッセージとして使ってください:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みエイリアスです。カスタムエイリアスは `agents.defaults.models` で追加できます。

    利用可能なモデルは `/model`、`/model list`、または `/model status` で確認できます。

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します:

    ```
    /model 3
    ```

    プロバイダーに対して特定の auth profile を強制することもできます（セッション単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` には、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの auth profile が試されるかが表示されます。
    利用可能な場合は、設定済みプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示されます。

    **`@profile` で設定した profile の固定を解除するには？**

    `@profile` 接尾辞を付けずに `/model` を再実行してください:

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選択するか（または `/model <default provider/model>` を送信してください）。
    どの auth profile がアクティブかは `/model status` で確認してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.2、コーディングには Codex 5.3 を使えますか？">
    はい。1 つをデフォルトに設定し、必要に応じて切り替えてください:

    - **クイック切り替え（セッション単位）:** 日常タスクには `/model gpt-5.4`、Codex OAuth でのコーディングには `/model openai-codex/gpt-5.4`。
    - **デフォルト + 切り替え:** `agents.defaults.model.primary` を `openai/gpt-5.4` に設定し、コーディング時に `openai-codex/gpt-5.4` へ切り替えます（またはその逆）。
    - **サブエージェント:** コーディングタスクを別のデフォルトモデルを持つサブエージェントへルーティングします。

    [Models](/ja-JP/concepts/models) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.4 の fast mode はどう設定しますか？">
    セッショントグルまたは設定デフォルトのどちらかを使ってください:

    - **セッション単位:** セッションが `openai/gpt-5.4` または `openai-codex/gpt-5.4` を使っている間に `/fast on` を送信します。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` を `true` に設定します。
    - **Codex OAuth でも:** `openai-codex/gpt-5.4` も使う場合は、そちらにも同じフラグを設定します。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI では、fast mode はサポートされたネイティブ Responses リクエストで `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) と [OpenAI fast mode](/ja-JP/providers/openai#openai-fast-mode) を参照してください。

  </Accordion>

  <Accordion title='なぜ「Model ... is not allowed」と表示され、その後返信がないのですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッションオーバーライドの **allowlist** になります。その一覧にないモデルを選ぶと、次が返されます:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは、通常の返信の **代わりに** 返されます。対処法: そのモデルを
    `agents.defaults.models` に追加する、allowlist を削除する、または `/model list` からモデルを選んでください。

  </Accordion>

  <Accordion title='なぜ「Unknown model: minimax/MiniMax-M2.7」と表示されるのですか？'>
    これは **プロバイダーが設定されていない** ことを意味します（MiniMax のプロバイダー設定または auth
    profile が見つからなかったため）、そのモデルを解決できません。

    修正チェックリスト:

    1. 現在の OpenClaw リリースに更新するか（またはソースの `main` から実行し）、その後 gateway を再起動してください。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax 認証が
       env/auth profile に存在し、対応するプロバイダーが注入できることを確認してください
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証経路に合った正確な model id（大文字小文字を区別）を使ってください:
       API キー構成では `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、
       OAuth 構成では `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します:

       ```bash
       openclaw models list
       ```

       その一覧から選んでください（またはチャットで `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [Models](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト** にして、必要に応じて **セッションごと** にモデルを切り替えてください。
    フォールバックは **エラー時** のためのものであり、「難しいタスク」用ではありません。そのため、`/model` または別エージェントを使ってください。

    **方法 A: セッションごとに切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    その後:

    ```
    /model gpt
    ```

    **方法 B: エージェントを分ける**

    - Agent A のデフォルト: MiniMax
    - Agent B のデフォルト: OpenAI
    - エージェントごとにルーティングするか、`/agent` で切り替える

    ドキュメント: [Models](/ja-JP/concepts/models), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [MiniMax](/ja-JP/providers/minimax), [OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名があります（`agents.defaults.models` にそのモデルが存在する場合にのみ適用されます）:

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、自分の値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするにはどうすればよいですか？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から来ます。例:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    その後、`/model sonnet`（またはサポートされている場合は `/<alias>`）でその model ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI のような他プロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（従量課金、多数のモデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM models）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model を参照しても、必要なプロバイダーキーがない場合は、ランタイム認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後に No API key found for provider が出る**

    これは通常、**新しいエージェント** の auth store が空であることを意味します。認証はエージェントごとで、
    次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    対処方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定する。
    - または、メインエージェントの `agentDir` にある `auth-profiles.json` を新しいエージェントの `agentDir` にコピーする。

    エージェント間で `agentDir` を共有しては **いけません**。認証/セッションの衝突が起こります。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します:

    1. 同じプロバイダー内での **auth profile rotation**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの **model fallback**。

    失敗した profile にはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗していても、OpenClaw は応答を継続できます。

    レート制限バケットには単純な `429` レスポンス以上のものが含まれます。OpenClaw
    は `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバーすべき
    レート制限として扱います。

    一見課金由来に見えるレスポンスの中には `402` でないものもあり、一方で一部の HTTP `402`
    レスポンスもその一時的バケットに残ります。プロバイダーが
    `401` または `403` で明示的な課金テキストを返した場合、OpenClaw はそれを
    課金レーンに留められますが、プロバイダー固有のテキストマッチャーはそれを所有する
    プロバイダーに限定されます（たとえば OpenRouter の `Key limit exceeded`）。もし `402`
    メッセージが代わりに再試行可能な使用量ウィンドウや
    組織/ワークスペース支出制限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）に見える場合、OpenClaw はそれを
    長期の課金停止ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは別です。たとえば
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` のようなシグネチャは、モデル
    フォールバックを進める代わりに Compaction/リトライ経路に留まります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものすべて」よりも意図的に狭くなっています。OpenClaw は、Anthropic の生の `An unknown error occurred`、OpenRouter の生の
    `Provider returned error`、
    `Unhandled stop reason:
    error` のような stop-reason エラー、一時的なサーバーテキストを含む JSON `api_error` ペイロード
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）、および `ModelNotReadyException` のような provider-busy エラーを、
    プロバイダー文脈が一致する場合にフェイルオーバーすべき timeout/overloaded シグナルとして扱います。
    汎用的な内部フォールバックテキストである `LLM request failed with an unknown
    error.` は保守的に扱われ、それ単体ではモデルフォールバックを引き起こしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とは何を意味しますか？'>
    これは、システムが auth profile ID `anthropic:default` を使おうとしたものの、想定される auth store にその認証情報が見つからなかったことを意味します。

    **修正チェックリスト:**

    - **auth profile の保存場所を確認する**（新旧パス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - `ANTHROPIC_API_KEY` をシェルに設定していても、Gateway を systemd/launchd 経由で実行している場合は継承されないことがあります。`~/.openclaw/.env` に置くか、`env.shellEnv` を有効化してください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在し得ます。
    - **モデル/認証状態をざっと確認する**
      - `openclaw models status` を使い、設定済みモデルとプロバイダーが認証済みかどうかを確認してください。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、その実行が Anthropic の auth profile に固定されているが、Gateway
    が auth store 内にそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - Gateway ホスト上で `openclaw models auth login --provider anthropic --method cli --set-default` を実行してください。
    - **代わりに API キーを使いたい場合**
      - **gateway host** 上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れてください。
      - 存在しない profile を強制する pinned order を解除してください:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **gateway host 上でコマンドを実行していることを確認する**
      - remote mode では、auth profile はローカルのノート PC ではなく gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試されて失敗したのですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の短縮名に切り替えた場合）、OpenClaw はモデルフォールバック時にそれを試します。Google の認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    対処法: Google 認証を設定するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避して、フォールバックがそこへ向かわないようにしてください。

    **LLM request rejected: thinking signature required (Google Antigravity)**

    原因: セッション履歴に **署名のない thinking block** が含まれています（多くは
    中断された/部分的なストリーム由来です）。Google Antigravity は thinking block に署名を要求します。

    対処法: OpenClaw は現在、Google Antigravity Claude 用に署名なし thinking block を除去します。それでも出る場合は、**新しいセッション** を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## Auth profiles: それが何かと管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="auth profile とは何ですか？">
    auth profile は、プロバイダーに紐付いた名前付き認証レコード（OAuth または API キー）です。profile は次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="一般的な profile ID にはどんなものがありますか？">
    OpenClaw は、次のような provider 接頭辞付き ID を使います:

    - `anthropic:default`（メール ID が存在しない場合によくある）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの auth profile を最初に試すか制御できますか？">
    はい。設定は、profile の任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これは secret 自体は保存せず、ID を provider/mode に対応付けて rotation 順序を設定します。

    OpenClaw は、profile が短い **cooldown**（レート制限/タイムアウト/認証失敗）中、または長めの **disabled** 状態（課金/クレジット不足）にある場合、一時的にその profile をスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を見てください。調整項目: `auth.cooldowns.billingBackoffHours*`。

    レート制限の cooldown はモデル単位になる場合があります。ある profile が
    1 つのモデルでは cooldown 中でも、同じプロバイダー上の兄弟モデルではまだ利用可能なことがあります。
    一方、課金/無効化ウィンドウは依然として profile 全体をブロックします。

    CLI で **エージェント単位** の順序オーバーライド（そのエージェントの `auth-state.json` に保存）を設定することもできます:

    ```bash
    # 設定済みのデフォルトエージェントが対象（--agent は省略可）
    openclaw models auth order get --provider anthropic

    # rotation を単一 profile に固定（これだけを試す）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定（プロバイダー内フォールバック）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # オーバーライドを解除（config auth.order / round-robin に戻る）
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるかを確認するには、次を使ってください:

    ```bash
    openclaw models status --probe
    ```

    保存済み profile が明示的な順序から外れている場合、probe は
    その profile を黙って試す代わりに `excluded_by_auth_order` と報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています:

    - **OAuth** は、該当する場合、サブスクリプションアクセスを活用することが多いです。
    - **API キー** は従量課金です。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## Gateway: ポート、「already running」、remote mode

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、hook など）の単一多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > デフォルト 18789
    ```

  </Accordion>

  <Accordion title='なぜ openclaw gateway status では "Runtime: running" なのに "Connectivity probe: failed" なのですか？'>
    それは、「running」が **supervisor**（launchd/systemd/schtasks）から見た状態だからです。一方 connectivity probe は、CLI が実際に gateway WebSocket に接続して確認した結果です。

    `openclaw gateway status` を使い、次の行を重視してください:

    - `Probe target:`（probe が実際に使った URL）
    - `Listening:`（そのポートに実際に bind されているもの）
    - `Last gateway error:`（プロセスは生きているがポートが listen していない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='なぜ openclaw gateway status では "Config (cli)" と "Config (service)" が違うのですか？'>
    1 つの設定ファイルを編集している一方で、サービスは別の設定ファイルを使って動いています（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    これは、サービスに使わせたい `--profile` / 環境のもとで実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とは何を意味しますか？'>
    OpenClaw は、起動直後に WebSocket listener を即座に bind することでランタイムロックを強制します（デフォルト `ws://127.0.0.1:18789`）。`EADDRINUSE` で bind に失敗すると、別のインスタンスがすでに listen していることを示す `GatewayLockError` を投げます。

    対処法: もう一方のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行してください。

  </Accordion>

  <Accordion title="OpenClaw を remote mode（クライアントが別の場所の Gateway に接続するモード）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて shared-secret の remote credentials を含むリモート WebSocket URL を指定してください:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    注意:

    - `openclaw gateway` は `gateway.mode` が `local` のときだけ起動します（または override flag を渡した場合）。
    - macOS アプリは設定ファイルを監視し、これらの値が変わると live にモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側の remote credentials にすぎず、それ自体ではローカル gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI に "unauthorized" と表示される（または再接続を繰り返す）のですが、どうすればよいですか？'>
    gateway の認証経路と、UI の認証方式が一致していません。

    事実（コードから）:

    - Control UI は、現在のブラウザータブセッションと選択された gateway URL に対して token を `sessionStorage` に保持するため、同じタブでの再読み込みは、長期の localStorage token 永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、gateway が retry ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュ済み device token を使って 1 回だけ制限付きリトライを試せます。
    - そのキャッシュ token リトライは、現在、device token とともに保存された承認済み scope のキャッシュも再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し側は、キャッシュ scope を継承せず、要求した scope set を維持します。
    - そのリトライ経路以外では、connect auth の優先順位は、明示的な shared token/password、次に明示的な `deviceToken`、次に保存済み device token、最後に bootstrap token です。
    - bootstrap token の scope チェックは role 接頭辞付きです。組み込みの bootstrap operator allowlist は operator リクエストだけを満たします。node やその他の non-operator role は、依然として自身の role 接頭辞の scope が必要です。

    対処法:

    - 最速: `openclaw dashboard`（dashboard URL を表示 + コピーし、開こうとします。headless なら SSH ヒントを表示）。
    - まだ token がない場合: `openclaw doctor --generate-gateway-token`。
    - remote の場合は、先にトンネル: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、その対応する secret を Control UI 設定に貼り付けます。
    - Tailscale Serve mode: `gateway.auth.allowTailscale` が有効になっており、Tailscale identity header を迂回する raw loopback/tailnet URL ではなく、Serve URL を開いていることを確認してください。
    - trusted-proxy mode: 同一ホストの loopback proxy や raw gateway URL ではなく、設定済みの非 loopback identity-aware proxy 経由で来ていることを確認してください。
    - 1 回のリトライ後も不一致が続く場合は、ペアリング済み device token を rotate/re-approve してください:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - その rotate 呼び出しが拒否された場合は、次の 2 点を確認してください:
      - paired-device session は、自分自身の device だけを rotate できます。ただし `operator.admin` がある場合は除きます
      - 明示的な `--scope` 値は、呼び出し元の現在の operator scope を超えられません
    - まだ解決しない場合は、`openclaw status --all` を実行し、[Troubleshooting](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [Dashboard](/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定したのに bind できず、何も listen しません">
    `tailnet` bind は、ネットワークインターフェースから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale 上にない（またはインターフェースがダウンしている）場合、bind 先がありません。

    対処法:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注意: `tailnet` は明示指定です。`auto` は loopback を優先します。tailnet のみに bind したい場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホスト上で複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。複数の Gateway が必要なのは、冗長化（例: rescue bot）または hard isolation が必要な場合だけです。

    ただし、次を分離すれば可能です:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（workspace の分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使ってください（`~/.openclaw-<name>` を自動作成します）。
    - 各 profile 設定で一意の `gateway.port` を設定するか、手動実行では `--port` を渡してください。
    - profile ごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    profile によりサービス名にも接尾辞が付きます（`ai.openclaw.<profile>`、レガシー `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全ガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 とは何を意味しますか？'>
    Gateway は **WebSocket サーバー** であり、最初のメッセージとして
    `connect` フレームが来ることを想定しています。それ以外を受け取ると、接続を
    **code 1008**（ポリシー違反）で閉じます。

    よくある原因:

    - ブラウザーで **HTTP** URL（`http://...`）を開いてしまった。WS クライアントではありません。
    - 間違ったポートまたはパスを使っている。
    - プロキシやトンネルが認証ヘッダーを削除したか、Gateway 以外のリクエストを送った。

    クイック修正:

    1. WS URL を使ってください: `ws://<host>:18789`（HTTPS なら `wss://...`）。
    2. WS ポートを通常のブラウザータブで開かないでください。
    3. 認証が有効なら、`connect` フレームに token/password を含めてください。

    CLI や TUI を使っている場合、URL は次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコル詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    安定したパスは `logging.file` で設定できます。ファイルログレベルは `logging.level` で制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    サービス/supervisor ログ（gateway を launchd/systemd 経由で実行している場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。profile 使用時は `~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    gateway helper を使ってください:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合は、`openclaw gateway --force` でポートを奪い返せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じてしまいました。OpenClaw を再起動するにはどうすればよいですか？">
    Windows には **2 つのインストールモード** があります:

    **1) WSL2（推奨）:** Gateway は Linux 内で動作します。

    PowerShell を開き、WSL に入り、その後再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスをまだインストールしていない場合は、フォアグラウンドで起動してください:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows 上で直接動作します。

    PowerShell を開いて次を実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動実行（サービスなし）の場合は、次を使ってください:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動しているのに、返信がまったく届きません。何を確認すべきですか？">
    まずクイックヘルス確認から始めてください:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - モデル認証が **gateway host** に読み込まれていない（`models status` を確認）。
    - Channel のペアリング/allowlist により返信がブロックされている（channel 設定 + ログを確認）。
    - WebChat/Dashboard が正しい token なしで開かれている。

    remote の場合は、トンネル/Tailscale 接続が有効で、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels), [Troubleshooting](/ja-JP/gateway/troubleshooting), [Remote access](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" と表示されます。どうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください:

    1. Gateway は動いていますか？ `openclaw gateway status`
    2. Gateway は健全ですか？ `openclaw status`
    3. UI には正しい token がありますか？ `openclaw dashboard`
    4. remote の場合、トンネル/Tailscale 接続は有効ですか？

    その後、ログを追跡してください:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/web/dashboard), [Remote access](/ja-JP/gateway/remote), [Troubleshooting](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram の setMyCommands が失敗します。何を確認すべきですか？">
    まずログと channel status から始めてください:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに応じて確認してください:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限に合わせて削減し、より少ないコマンドで再試行しますが、それでも一部のメニュー項目は削除が必要です。plugin/skill/custom command を減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上またはプロキシ背後で動かしている場合は、外向き HTTPS が許可されており、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートにある場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [Channel troubleshooting](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に何も出力されません。何を確認すべきですか？">
    まず Gateway に到達できて、エージェントが実行できることを確認してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認してください。チャット
    channel に返信が来ることを期待している場合は、配信が有効であることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/web/tui), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから開始するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監督下のサービス**（macOS では launchd、Linux では systemd）を停止/開始します。
    Gateway がバックグラウンドデーモンとして動いている場合に使ってください。

    フォアグラウンドで動かしている場合は、Ctrl-C で停止し、その後:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway の違い">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッション用に gateway を **フォアグラウンドで** 実行します。

    サービスをインストールしている場合は、gateway コマンド群を使ってください。`openclaw gateway` は
    一時的にフォアグラウンド実行したい場合に使ってください。

  </Accordion>

  <Accordion title="何か失敗したときに、最速でもっと詳しい情報を得る方法">
    Gateway を `--verbose` 付きで起動すると、コンソールの詳細度が上がります。その後、ログファイルを確認して、channel auth、model routing、RPC エラーを調べてください。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="skill が画像/PDF を生成したのに、何も送信されませんでした">
    エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>` 行を含める必要があります（単独の行として）。[OpenClaw assistant setup](/ja-JP/start/openclaw) と [Agent send](/ja-JP/tools/agent-send) を参照してください。

    CLI での送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    あわせて次も確認してください:

    - 対象 channel が送信メディアをサポートしており、allowlist によってブロックされていない。
    - ファイルがプロバイダーのサイズ上限内にある（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` では、ローカルパス送信は workspace、temp/media-store、および sandbox で検証されたファイルに限定されます。
    - `tools.fs.workspaceOnly=false` では、`MEDIA:` はエージェントがすでに読めるホストローカルファイルも送信できますが、対象はメディアと安全な文書タイプ（画像、音声、動画、PDF、Office 文書）に限られます。プレーンテキストや secret に見えるファイルは依然としてブロックされます。

    [Images](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルト設定はリスクを減らすよう設計されています:

    - DM 対応 channel のデフォルト動作は **pairing** です:
      - 不明な送信者には pairing code が返され、bot はそのメッセージを処理しません。
      - 承認には次を使います: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中リクエストは **チャネルごとに 3 件** に制限されます。コードが届かない場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を一般公開するには、明示的な opt-in が必要です（`dmPolicy: "open"` と allowlist `"*"`）。

    リスクの高い DM ポリシーを表面化するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="prompt injection は public bot だけの問題ですか？">
    いいえ。prompt injection は、誰が DM できるかだけではなく、**信頼できないコンテンツ** の問題です。
    アシスタントが外部コンテンツ（web search/fetch、browser ページ、メール、
    ドキュメント、添付ファイル、貼り付けたログ）を読むなら、そのコンテンツには
    モデルを乗っ取ろうとする命令が含まれている可能性があります。これは **送信者が自分だけ** でも起こり得ます。

    最大のリスクはツールが有効な場合です。モデルが
    コンテキストを流出させたり、あなたの代わりにツールを呼び出したりするよう誘導される可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` を無効にしておく
    - デコードされたファイル/ドキュメントテキストも信頼しない: OpenResponses の
      `input_file` とメディア添付の抽出は、どちらも生のファイルテキストをそのまま渡すのではなく、
      明示的な external-content boundary marker で囲んだ抽出テキストとして渡します
    - サンドボックス化と厳格なツール allowlist を使う

    詳細: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="bot 専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    はい。多くの構成ではそうするべきです。bot を別アカウントや別番号で分離すると、
    問題が起きたときの影響範囲を小さくできます。また、個人アカウントに影響を与えずに
    認証情報のローテーションやアクセス取り消しがしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを与え、
    必要になったら後で広げてください。

    ドキュメント: [Security](/ja-JP/gateway/security), [Pairing](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="自分のテキストメッセージに対して自律性を持たせても安全ですか？">
    個人メッセージに対する完全な自律性は **推奨しません**。最も安全なパターンは次のとおりです:

    - DM は **pairing mode** または厳しい allowlist のままにする。
    - 自分の代わりに送信させたいなら、**別の番号またはアカウント** を使う。
    - 下書きはさせても、**送信前に承認する**。

    試したい場合は、専用アカウントで行い、分離を保ってください。[Security](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタント用途なら安いモデルを使えますか？">
    はい。ただし、エージェントがチャット専用で、入力が信頼できる場合に限ります。小さい層は
    命令乗っ取りを受けやすいため、ツール有効エージェントや
    信頼できないコンテンツを読む場合には避けてください。どうしても小さいモデルを使うなら、
    ツールを厳しく制限し、サンドボックス内で実行してください。[Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行したのに pairing code が届きません">
    pairing code は、不明な送信者が bot にメッセージを送り、
    `dmPolicy: "pairing"` が有効なときに **のみ** 送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認してください:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分の sender id を allowlist に入れるか、その account で `dmPolicy: "open"`
    を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先に勝手にメッセージを送りますか？ pairing はどう動きますか？">
    いいえ。WhatsApp DM ポリシーのデフォルトは **pairing** です。不明な送信者には pairing code だけが返され、そのメッセージは **処理されません**。OpenClaw が返信するのは、受信したチャットか、自分で明示的にトリガーした送信だけです。

    pairing の承認:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中リクエストの一覧:

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは自分自身の **allowlist/owner** を設定し、自分の DM を許可するために使われます。自動送信用ではありません。個人の WhatsApp 番号で運用する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスク中断、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    内部メッセージやツールメッセージの多くは、そのセッションで **verbose**、**trace**、または **reasoning** が有効なときにだけ表示されます。

    表示されているチャットで次を実行してください:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもうるさい場合は、Control UI のセッション設定を確認し、verbose
    を **inherit** にしてください。また、設定で `verboseDefault` が `on`
    になっている bot profile を使っていないことも確認してください。

    ドキュメント: [Thinking and verbose](/ja-JP/tools/thinking), [Security](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを **単独メッセージ** として送ってください（スラッシュなし）:

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    これらは中断トリガーです（スラッシュコマンドではありません）。

    exec ツール由来のバックグラウンドプロセスについては、エージェントに次を実行させられます:

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは、`/` で始まる **単独** メッセージとして送る必要がありますが、allowlist 済み送信者では `/status` のような一部のショートカットはインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord にメッセージを送るにはどうすればよいですか？（「Cross-context messaging denied」）'>
    OpenClaw はデフォルトで **クロスプロバイダー** メッセージングをブロックします。ツール呼び出しが
    Telegram に紐付いている場合、明示的に許可しない限り Discord には送信しません。

    そのエージェントでクロスプロバイダーメッセージングを有効にしてください:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    設定編集後は gateway を再起動してください。

  </Accordion>

  <Accordion title='なぜ bot が高速連投メッセージを「無視している」ように感じるのですか？'>
    queue mode は、新しいメッセージが進行中の実行とどう相互作用するかを制御します。モード変更には `/queue` を使ってください:

    - `steer` - 新しいメッセージが現在のタスクを方向転換させる
    - `followup` - メッセージを 1 件ずつ実行する
    - `collect` - メッセージをまとめて 1 回で返信する（デフォルト）
    - `steer-backlog` - 今すぐ方向転換し、その後 backlog を処理する
    - `interrupt` - 現在の実行を中断して新しく開始する

    followup モードには `debounce:2s cap:25 drop:summarize` のようなオプションも追加できます。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='Anthropic の API キーを使う場合のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は分離されています。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを auth profile に保存する）と認証は有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` と表示される場合、それは Gateway が実行中のエージェント向けに想定される `auth-profiles.json` 内で Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？ [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を作成してください。
