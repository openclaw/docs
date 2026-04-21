---
read_when:
    - よくあるセットアップ、インストール、オンボーディング、またはランタイムサポートの質問に答える
    - より詳細なデバッグの前に、ユーザーから報告された問題をトリアージする
summary: OpenClawのセットアップ、設定、および使用法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-21T04:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bde531507540bc91bc131c3e27d72a8be76cc53ef46a5e01aaeaf02a71cc8a2
    source_path: help/faq.md
    workflow: 15
---

# よくある質問

ローカル開発、VPS、マルチagent、OAuth/APIキー、モデルフェイルオーバーなど、実運用のセットアップ向けの簡潔な回答と、より深いトラブルシューティング。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全なconfigリファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 問題が起きたときの最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/service 到達性、agents/sessions、provider 設定 + ランタイムの問題（gateway に到達できる場合）。

2. **貼り付け可能なレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   ログ末尾を含む読み取り専用の診断（トークンはマスクされます）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor のランタイムと RPC 到達性、プローブ対象URL、サービスが使用した可能性が高いconfigを表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   ライブ gateway ヘルスプローブを実行し、サポートされている場合はチャネルプローブも含みます
   （到達可能な gateway が必要）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追跡する**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、代わりに次を使ってください:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行する（修復）**

   ```bash
   openclaw doctor
   ```

   config/state の修復・移行とヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象URL + configパスを表示
   ```

   実行中の gateway に完全なスナップショットを問い合わせます（WSのみ）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

<AccordionGroup>
  <Accordion title="詰まったとき、最速で抜け出す方法">
    **あなたのマシンを見られる**ローカルAI agent を使ってください。これは Discord で尋ねるよりはるかに効果的です。なぜなら、「詰まった」ケースのほとんどは、リモートの支援者には調べられない**ローカルのconfigや環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、repo を読んで、コマンドを実行し、ログを調べ、マシンレベルの
    セットアップ（PATH、services、権限、auth ファイル）を直す手助けができます。ハッカブルな（git）インストールで
    **完全なソースチェックアウト**を渡してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw が **git チェックアウトから**インストールされるため、agent はコード + ドキュメントを読み、
    実行中の正確なバージョンをもとに推論できます。あとでいつでも `--install-method git` なしで
    installer を再実行して stable に戻せます。

    ヒント: agent に修正を**計画して監督**させ（段階的に）、必要なコマンドだけを実行してください。
    そうすれば変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけたら、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めてください（助けを求めるときは出力を共有してください）:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの内容:

    - `openclaw status`: gateway/agent の健全性 + 基本configのクイックスナップショット。
    - `openclaw models status`: provider 認証 + モデル利用可否を確認します。
    - `openclaw doctor`: よくあるconfig/state 問題を検証して修復します。

    ほかに役立つCLI確認: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`。

    クイックデバッグループ: [問題が起きたときの最初の60秒](#問題が起きたときの最初の60秒)。
    インストールドキュメント: [Install](/ja-JP/install), [Installer flags](/ja-JP/install/installer), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある Heartbeat のスキップ理由:

    - `quiet-hours`: 設定されたアクティブ時間帯の外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけの雛形しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、どのタスク間隔もまだ期限になっていない
    - `alerts-disabled`: Heartbeat の可視性がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際の Heartbeat 実行が
    完了した後にのみ進みます。スキップされた実行ではタスクは完了扱いになりません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw をインストールしてセットアップする推奨方法は？">
    repo では、ソースから実行し、オンボーディングを使うことを推奨しています:

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
    ウィザードは、オンボーディング直後にクリーンな（トークン付きでない）ダッシュボードURLをブラウザで開き、要約にもそのリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシン上で表示されたURLをコピーして貼り付けてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボードを認証するには？">
    **localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI の設定に貼り付けてください。
    - トークンの取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットが設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成してください。

    **localhost ではない場合:**

    - **Tailscale Serve**（推奨）: bind は loopback のままにし、`openclaw gateway --tailscale serve` を実行して `https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、identity ヘッダーが Control UI/WebSocket 認証を満たします（共有シークレットの貼り付け不要、信頼された gateway ホストを前提）。HTTP API は、意図的に private-ingress `none` または trusted-proxy HTTP auth を使わない限り、引き続き共有シークレット認証が必要です。
      同じクライアントからの不正な同時 Serve 認証試行は、failed-auth limiter に記録される前に直列化されるため、2回目の不正リトライではすでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行するか（またはパスワード認証を設定し）、`http://<tailscale-ip>:18789/` を開いて、ダッシュボード設定に一致する共有シークレットを貼り付けてください。
    - **identity-aware reverse proxy**: Gateway を non-loopback trusted proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、proxy URL を開きます。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開きます。トンネル越しでも共有シークレット認証は適用されるため、求められたら設定済みのトークンまたはパスワードを貼り付けてください。

    bind モードと認証の詳細は [Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用の exec 承認configが2つあるのはなぜですか？">
    それぞれ別のレイヤーを制御します:

    - `approvals.exec`: 承認プロンプトをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec 承認用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、実際の承認ゲートです。チャットconfigは、承認
    プロンプトがどこに表示され、どう答えられるかだけを制御します。

    ほとんどのセットアップでは、**両方とも**は不要です:

    - チャットがすでにコマンドと返信をサポートしていれば、同一チャットでの `/approve` は共有パス経由で動作します。
    - サポートされるネイティブチャネルが承認者を安全に推測できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のときに、DM優先のネイティブ承認を自動有効化するようになりました。
    - ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブUIが主要経路です。agent は、ツール結果でチャット承認が利用できないと示された場合、または手動承認が唯一の経路である場合にのみ、手動 `/approve` コマンドを含めるべきです。
    - プロンプトを他のチャットや明示的な ops room にも転送する必要がある場合にのみ `approvals.exec` を使ってください。
    - 承認プロンプトを元の room/topic にも投稿したい場合にのみ `channels.<channel>.execApprovals.target: "channel"` または `"both"` を使ってください。
    - plugin 承認はさらに別です: デフォルトでは同一チャットの `/approve` を使い、任意の `approvals.plugin` 転送があり、一部のネイティブチャネルだけがその上に plugin-approval-native の処理を維持しています。

    要するに、転送はルーティング用、ネイティブクライアントconfigはより豊かなチャネル固有UX用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway に Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか？">
    はい。Gateway は軽量です。ドキュメントでは、個人利用なら **512MB-1GB RAM**、**1コア**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4 で動作可能**と記載されています。

    余裕を持たせたい場合（ログ、メディア、他のサービス）には、**2GBを推奨**しますが、
    これは厳密な最低要件ではありません。

    ヒント: 小型の Pi/VPS で Gateway をホストし、ノートPCやスマホ上の **Node**
    をペアリングして、ローカル画面/カメラ/canvas やコマンド実行を使えます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi へのインストールのコツはありますか？">
    短く言うと、動きますが、多少荒い部分はあります。

    - **64-bit** OS を使い、Node >= 22 を維持してください。
    - ログを見やすく、すばやく更新できるように、**ハッカブルな（git）インストール**を推奨します。
    - channels/Skills なしで始めて、あとから1つずつ追加してください。
    - 変なバイナリ問題に当たった場合、たいていは **ARM互換性** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まります / オンボーディングが hatch しません。どうすればいいですか？">
    この画面は Gateway が到達可能で認証されていることに依存します。TUI も、最初の hatch 時に
    「Wake up, my friend!」を自動送信します。その行が表示されているのに**返信がなく**
    トークンが 0 のままなら、agent は一度も実行されていません。

    1. Gateway を再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. status + auth を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも止まる場合は、次を実行してください:

    ```bash
    openclaw doctor
    ```

    Gateway がリモートにある場合は、トンネル/Tailscale 接続が有効で、UI
    が正しい Gateway を指していることを確認してください。[Remote access](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずに、セットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**state ディレクトリ**と**workspace**をコピーしてから、Doctor を1回実行してください。これで
    **両方**の場所をコピーしている限り、ボットを「まったく同じ状態」（メモリ、セッション履歴、認証、チャネル
    状態）で維持できます:

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway service を再起動します。

    それにより config、auth profiles、WhatsApp 認証情報、sessions、memory が保持されます。remote mode の場合は、
    gateway ホストがセッションストアと workspace を所有していることを忘れないでください。

    **重要:** workspace だけを GitHub に commit/push している場合、バックアップしているのは
    **memory + bootstrap ファイル**であり、**セッション履歴や認証**ではありません。これらは
    `~/.openclaw/` 配下にあります（たとえば `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [移行](/ja-JP/install/migrating), [ディスク上の保存場所](#ディスク上の保存場所),
    [Agent workspace](/ja-JP/concepts/agent-workspace), [Doctor](/ja-JP/gateway/doctor),
    [remote mode](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub の changelog を確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新の項目は先頭にあります。先頭セクションが **Unreleased** と表示されている場合、
    次の日付付きセクションが最新のリリース済みバージョンです。項目は **Highlights**、**Changes**、
    **Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSLエラー）">
    一部の Comcast/Xfinity 接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。これを無効化するか、
    `docs.openclaw.ai` を許可リストに追加してから、再試行してください。
    次の場所からブロック解除の報告に協力してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    それでもサイトに到達できない場合、docs は GitHub にもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は別のコードラインではなく、**npm dist-tag** です:

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な
    昇格ステップによってその同じバージョンが `latest` に移されます。必要に応じて
    maintainer が直接 `latest` に公開することもあります。そのため、昇格後は beta と stable が
    **同じバージョン**を指すことがあります。

    変更内容の確認先:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta版はどうインストールしますか？また beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag の `beta` です（昇格後は `latest` と同じになることがあります）。
    **Dev** は `main` の移動する先頭（git）で、公開時には npm dist-tag `dev` を使用します。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows installer（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [Development channels](/ja-JP/install/development-channels) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新の変更を試すにはどうすればいいですか？">
    2つの方法があります:

    1. **Dev channel（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチへ切り替わり、ソースから更新されます。

    2. **ハッカブルインストール（installer サイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これでローカル repo が手に入り、編集してから git 経由で更新できます。

    きれいな clone を手動で行いたい場合は、次を使ってください:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/cli/update), [Development channels](/ja-JP/install/development-channels),
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングは通常どのくらいかかりますか？">
    おおよその目安:

    - **インストール:** 2〜5分
    - **オンボーディング:** 設定する channels/models の数に応じて 5〜15分

    固まった場合は [Installer stuck](#クイックスタートと初回セットアップ)
    と [詰まったとき、最速で抜け出す方法](#クイックスタートと初回セットアップ) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="Installer が固まりました。もっと詳しい情報を出すには？">
    **詳細出力**付きで installer を再実行してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    beta インストールを verbose で:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    ハッカブルな（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での相当手順:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows で install 時に git not found または openclaw not recognized と表示される">
    Windows でよくある2つの問題です:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH にあることを確認してください。
    - PowerShell を閉じて再度開き、installer を再実行してください。

    **2) install 後に openclaw is not recognized**

    - npm のグローバル bin フォルダーが PATH にありません。
    - パスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` 接尾辞は不要です。ほとんどの環境では `%AppData%\npm` です）。
    - PATH 更新後に PowerShell を閉じて再度開いてください。

    最もスムーズな Windows セットアップを望むなら、ネイティブ Windows ではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語が文字化けします。どうすればいいですか？">
    これは通常、ネイティブ Windows シェルでのコンソールコードページ不一致です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShell での一時対処:

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

    最新の OpenClaw でも再現する場合は、次で追跡/報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="docs を読んでも答えが見つかりません。よりよい回答を得るには？">
    **ハッカブルな（git）インストール**を使って、ソースと docs 一式をローカルに置き、
    そのフォルダーから bot（または Claude/Codex）に質問してください。そうすれば repo を読んで
    正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするには？">
    短く言うと、Linux ガイドに従ってからオンボーディングを実行してください。

    - Linux のクイック手順 + service install: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - installer + 更新: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするには？">
    任意の Linux VPS で動作します。サーバーにインストールしてから、SSH/Tailscale で Gateway にアクセスしてください。

    ガイド: [exe.dev](/ja-JP/install/exe-dev), [Hetzner](/ja-JP/install/hetzner), [Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS のインストールガイドはどこですか？">
    よく使うプロバイダーをまとめた **hosting hub** を用意しています。1つ選んでガイドに従ってください:

    - [VPS hosting](/ja-JP/vps)（すべてのプロバイダーを1か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    cloud での動作: **Gateway はサーバー上で動作**し、あなたは
    ノートPC/スマホから Control UI（または Tailscale/SSH）経由でアクセスします。state + workspace は
    サーバー上にあるので、ホストを信頼できる唯一の情報源として扱い、バックアップしてください。

    cloud Gateway に **Node**（Mac/iOS/Android/headless）をペアリングして、
    Gateway は cloud に置いたまま、ローカル画面/カメラ/canvas へのアクセスや
    ノートPC上でのコマンド実行を行えます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    Nodes: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw 自身に更新させることはできますか？">
    短く言うと、**可能ですが、推奨はしません**。更新フローは
    Gateway を再起動することがあり（アクティブセッションが切れる）、クリーンな git checkout が
    必要になることがあり、確認を求める場合もあります。より安全なのは、オペレーターとしてシェルから更新することです。

    CLI を使ってください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    どうしても agent から自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/cli/update), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際に何をするのですか？">
    `openclaw onboard` は推奨されるセットアップ手順です。**local mode** では次を案内します:

    - **モデル/認証設定**（provider OAuth、APIキー、Anthropic setup-token、LM Studio などのローカルモデルオプション）
    - **Workspace** の場所 + bootstrap ファイル
    - **Gateway設定**（bind/port/auth/tailscale）
    - **Channels**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、および QQ Bot のような同梱チャネル plugin）
    - **デーモンのインストール**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定されたモデルが不明または認証が不足している場合には警告します。

  </Accordion>

  <Accordion title="これを動かすのに Claude や OpenAI のサブスクリプションは必要ですか？">
    いいえ。OpenClaw は **APIキー**（Anthropic/OpenAI/その他）でも、
    データをデバイス上にとどめる **ローカル専用モデル**でも動作します。サブスクリプション（Claude
    Pro/Max や OpenAI Codex）は、それらの provider を認証するための任意の方法です。

    OpenClaw での Anthropic について、実用上の区分は次のとおりです:

    - **Anthropic API key**: 通常の Anthropic API 課金
    - **Claude CLI / OpenClaw での Claude サブスクリプション認証**: Anthropic のスタッフ
      から、この使い方は再び許可されていると伝えられており、Anthropic が新しい
      ポリシーを公開しない限り、OpenClaw はこの統合における `claude -p`
      の利用を認可済みとして扱います

    長期間稼働する gateway ホストでは、Anthropic API key の方が依然として
    予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部
    ツール向けに明示的にサポートされています。

    OpenClaw は、他のホスト型サブスクリプション系オプションとして
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan** もサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic), [OpenAI](/ja-JP/providers/openai),
    [Qwen Cloud](/ja-JP/providers/qwen),
    [MiniMax](/ja-JP/providers/minimax), [GLM Models](/ja-JP/providers/glm),
    [ローカルモデル](/ja-JP/gateway/local-models), [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="APIキーなしで Claude Max サブスクリプションを使えますか？">
    はい。

    Anthropic のスタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられたため、
    OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この統合において
    Claude サブスクリプション認証と `claude -p` の利用を認可済みとして扱います。最も予測しやすい
    サーバー側セットアップが必要な場合は、代わりに Anthropic API key を使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）をサポートしていますか？">
    はい。

    Anthropic のスタッフから、この利用は再び許可されていると伝えられたため、OpenClaw は
    Anthropic が新しいポリシーを公開しない限り、この統合において
    Claude CLI の再利用と `claude -p` の利用を認可済みとして扱います。

    Anthropic setup-token は引き続きサポートされる OpenClaw のトークン経路として利用可能ですが、OpenClaw は現在、利用可能であれば Claude CLI の再利用と `claude -p` を優先します。
    本番運用またはマルチユーザーのワークロードでは、Anthropic API key 認証の方が依然として
    より安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および [GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic から HTTP 429 rate_limit_error が表示されるのはなぜですか？">
これは、現在の時間枠における **Anthropic のクォータ/レート制限** を使い切ったことを意味します。
**Claude CLI** を使っている場合は、時間枠がリセットされるのを待つか、プランをアップグレードしてください。
**Anthropic API key** を使っている場合は、Anthropic Console
で使用量/課金を確認し、必要に応じて上限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests`、そのリクエストは
    Anthropic の 1M コンテキスト beta（`context1m: true`）を使おうとしています。これは、
    その認証情報が長文脈課金の対象である場合にのみ動作します（API key 課金、または
    Extra Usage が有効な OpenClaw の Claude ログイン経路）。

    ヒント: **フォールバックモデル**を設定すると、provider がレート制限中でも OpenClaw が応答を続けられます。
    [Models](/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw には同梱の **Amazon Bedrock (Converse)** provider があります。AWS の環境マーカーが存在する場合、OpenClaw はストリーミング/テキスト Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` provider としてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動で provider 項目を追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。マネージドなキー運用を好む場合、Bedrock の前段に OpenAI 互換 proxy を置く方法も引き続き有効です。
  </Accordion>

  <Accordion title="Codex 認証はどのように動作しますか？">
    OpenClaw は **OpenAI Code (Codex)** を OAuth（ChatGPT サインイン）経由でサポートします。オンボーディングで OAuth フローを実行でき、適切な場合はデフォルトモデルを `openai-codex/gpt-5.4` に設定します。[Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 では OpenClaw の openai/gpt-5.4 が使えるようにならないのはなぜですか？">
    OpenClaw ではこの2つの経路を別物として扱います:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 直接の OpenAI Platform API

    OpenClaw では、ChatGPT/Codex サインインは `openai-codex/*` 経路に結び付けられており、
    直接の `openai/*` 経路には結び付けられていません。OpenClaw で直接 API 経路を
    使いたい場合は、`OPENAI_API_KEY`（または同等の OpenAI provider config）を設定してください。
    OpenClaw で ChatGPT/Codex サインインを使いたい場合は、`openai-codex/*` を使用してください。

  </Accordion>

  <Accordion title="Codex OAuth の上限が ChatGPT web と異なることがあるのはなぜですか？">
    `openai-codex/*` は Codex OAuth 経路を使っており、利用可能なクォータ時間枠は
    OpenAI によって管理され、プラン依存です。実際には、両方が同じアカウントに結び付いていても、
    それらの上限は ChatGPT website/app の体験と異なることがあります。

    OpenClaw は、現在見えている provider の使用量/クォータ時間枠を
    `openclaw models status` に表示できますが、ChatGPT-web の
    権限を直接 API アクセスへ勝手に作り直したり正規化したりはしません。直接の OpenAI Platform
    課金/上限経路を使いたい場合は、API key 付きで `openai/*` を使ってください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション認証（Codex OAuth）をサポートしていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
    OpenAI は、OpenClaw のような外部ツール/ワークフローでの
    サブスクリプション OAuth 利用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定しますか？">
    Gemini CLI は **plugin 認証フロー** を使用し、`openclaw.json` の client id や secret は使いません。

    手順:

    1. `gemini` が `PATH` 上に来るように Gemini CLI をローカルにインストールする
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. plugin を有効化する: `openclaw plugins enable google`
    3. ログインする: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway ホスト上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定する

    これにより、OAuth トークンは gateway ホスト上の auth profiles に保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="軽い雑談用途ならローカルモデルでも大丈夫ですか？">
    通常は違います。OpenClaw には大きなコンテキストと強い安全性が必要です。小さなカードでは切り詰めや情報漏れが起きます。どうしても使うなら、ローカルで動かせる**最大の**モデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を確認してください。小さい/量子化されたモデルはプロンプトインジェクションのリスクを高めます。詳しくは [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルの通信を特定リージョン内に保つには？">
    リージョン固定のエンドポイントを選んでください。OpenRouter は MiniMax、Kimi、GLM 向けに US ホストのオプションを公開しています。データをリージョン内に保つには US ホスト版を選択してください。Anthropic/OpenAI などを並べて使いたい場合でも、`models.mode: "merge"` を使えば、選択したリージョン provider を尊重しつつフォールバックを維持できます。
  </Accordion>

  <Accordion title="これをインストールするには Mac Mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です。常時稼働ホストとして買う人もいますが、小さな VPS、ホームサーバー、または Raspberry Pi 級のマシンでも動作します。

    Mac が必要なのは **macOS 専用ツール**を使う場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles サーバーは任意の Mac 上で動作し、Gateway は Linux など別の場所で動かせます。他の macOS 専用ツールを使いたい場合は、Gateway を Mac 上で動かすか、macOS Node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes), [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage サポートには Mac mini が必要ですか？">
    **Messages にサインインした macOS デバイス**が必要です。Mac mini である必要はなく、
    どの Mac でも構いません。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles サーバーは macOS 上で動作し、Gateway は Linux など別の場所で動かせます。

    よくある構成:

    - Gateway は Linux/VPS 上で動かし、BlueBubbles サーバーは Messages にサインインした任意の Mac 上で動かす。
    - 最も簡単な単一マシン構成にしたいなら、すべてをその Mac 上で動かす。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes),
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を動かすために Mac mini を買った場合、MacBook Pro から接続できますか？">
    はい。**Mac mini が Gateway を実行**し、MacBook Pro は
    **Node**（コンパニオンデバイス）として接続できます。Nodes は Gateway を実行せず、
    そのデバイス上で screen/camera/canvas や `system.run` のような追加機能を提供します。

    よくある構成:

    - Gateway は Mac mini 上（常時稼働）。
    - MacBook Pro は macOS アプリまたは node host を実行して Gateway にペアリング。
    - `openclaw nodes status` / `openclaw nodes list` で確認できます。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp と Telegram でランタイムの不具合が確認されています。
    安定した Gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、WhatsApp/Telegram なしの
    非本番 gateway で行ってください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れればいいですか？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram ユーザーID**（数値）です。ボットのユーザー名ではありません。

    セットアップでは数値ユーザーIDのみを求めます。config にすでに従来の `@username` 項目がある場合、`openclaw doctor --fix` で解決を試せます。

    より安全な方法（サードパーティボット不要）:

    - ボットにDMを送ってから、`openclaw logs --follow` を実行し、`from.id` を読んでください。

    公式 Bot API:

    - ボットにDMを送ってから、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を読んでください。

    サードパーティ（プライバシーは低め）:

    - `@userinfobot` または `@getidsbot` にDMを送る。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="1つの WhatsApp 番号を複数人が別々の OpenClaw インスタンスで使えますか？">
    はい。**マルチagentルーティング**で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者の E.164 形式 `+15551234567` など）を別々の `agentId` にバインドすれば、それぞれが独自の workspace とセッションストアを持てます。返信は引き続き**同じ WhatsApp アカウント**から送信され、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウントごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」agent と「コーディング用 Opus」agent を並行して使えますか？'>
    はい。マルチagentルーティングを使ってください。各 agent にそれぞれ独自のデフォルトモデルを設定し、その後、受信ルート（provider アカウントまたは特定 peer）を各 agent にバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。[Models](/ja-JP/concepts/models) と [設定](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux でも動きますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw を systemd 経由で実行する場合は、service の PATH に `/home/linuxbrew/.linuxbrew/bin`（またはあなたの brew prefix）が含まれていることを確認してください。そうしないと、`brew` でインストールしたツールが非ログインシェルで解決されません。
    最近のビルドでは、Linux の systemd services に一般的なユーザー bin ディレクトリ（たとえば `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も前置し、`PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` が設定されている場合はそれらも尊重します。

  </Accordion>

  <Accordion title="ハッカブルな git install と npm install の違い">
    - **ハッカブルな（git）インストール:** 完全なソースチェックアウト。編集可能で、コントリビューターに最適です。
      ローカルでビルドを実行でき、コード/docs にパッチを当てられます。
    - **npm install:** グローバル CLI インストール。repo はなく、「とにかく動かしたい」用途に最適です。
      更新は npm dist-tags から取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="あとから npm install と git install を切り替えられますか？">
    はい。もう一方の方式をインストールしてから、gateway service が新しいエントリポイントを指すように Doctor を実行してください。
    これで**データは削除されません**。変わるのは OpenClaw のコードインストールだけです。state
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

    Doctor は gateway service のエントリポイント不一致を検出し、現在の install に合わせて service config を書き換えることを提案します（自動化では `--repair` を使ってください）。

    バックアップのヒント: [バックアップ戦略](#ディスク上の保存場所) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノートPCで動かすべきですか、それとも VPS ですか？">
    短く言うと、**24時間365日の信頼性**が欲しいなら **VPS を使ってください**。手軽さを優先し、
    スリープや再起動を許容できるならローカル実行で構いません。

    **ノートPC（ローカル Gateway）**

    - **長所:** サーバー費用なし、ローカルファイルへ直接アクセスできる、ブラウザーウィンドウが見える。
    - **短所:** スリープ/ネットワーク切断 = 切断、OS 更新/再起動で中断、起動し続けている必要がある。

    **VPS / cloud**

    - **長所:** 常時稼働、安定したネットワーク、ノートPCのスリープ問題なし、稼働状態を維持しやすい。
    - **短所:** 多くは headless で動く（スクリーンショットを使う）、ファイルアクセスはリモートのみ、更新には SSH が必要。

    **OpenClaw 固有の注記:** WhatsApp/Telegram/Slack/Mattermost/Discord はいずれも VPS 上で問題なく動作します。実際のトレードオフは **headless browser** と可視ブラウザーウィンドウの違いです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に gateway 切断を経験しているなら VPS。ローカルは、Mac を積極的に使っていてローカルファイルアクセスや可視ブラウザーでの UI 自動化が欲しいときに最適です。

  </Accordion>

  <Accordion title="専用マシンで OpenClaw を動かす重要性はどのくらいですか？">
    必須ではありませんが、**信頼性と分離性のために推奨**されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ/再起動による中断が少ない、権限が整理しやすい、運用を維持しやすい。
    - **共有ノートPC/デスクトップ:** テストやアクティブ利用にはまったく問題ありませんが、マシンのスリープや更新で停止することがあります。

    両方の利点を取りたいなら、Gateway は専用ホストに置き、ノートPC はローカルの screen/camera/exec ツール用の **Node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティの指針については [Security](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="最小の VPS 要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1つのチャットチャネルなら:

    - **絶対最小:** 1 vCPU、1GB RAM、約500MB ディスク。
    - **推奨:** 1〜2 vCPU、2GB RAM 以上の余裕（ログ、メディア、複数チャネル用）。Node ツールやブラウザー自動化はリソースを消費することがあります。

    OS は **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使ってください。Linux のインストール経路はそこで最もよく検証されています。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を動かせますか？要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、十分な
    RAM があり、Gateway と有効にする各チャネルを動かせる必要があります。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを使う場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または最新の Debian/Ubuntu 系。

    Windows の場合、**WSL2 が最も簡単な VM 形式のセットアップ**で、ツール互換性も最良です。
    [Windows](/ja-JP/platforms/windows), [VPS hosting](/ja-JP/vps) を参照してください。
    macOS を VM で動かす場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw とは、一言で言うと何ですか？">
    OpenClaw は、自分のデバイス上で動かす個人用AIアシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、および QQ Bot のような同梱チャネル plugin）で返信でき、対応プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働のコントロールプレーンであり、製品そのものはアシスタントです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。**ローカルファーストのコントロールプレーン**であり、
    **自分のハードウェア**上で高機能なアシスタントを動かし、普段使っているチャットアプリからアクセスでき、
    状態を持つ sessions、memory、tools を使いながら、ワークフローの制御をホスト型
    SaaS に明け渡さずに済みます。

    特長:

    - **自分のデバイス、自分のデータ:** Gateway は好きな場所（Mac、Linux、VPS）で動かし、
      workspace + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではない実チャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      加えて対応プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、agent ごとのルーティング
      やフェイルオーバー付きで使えます。
    - **ローカル専用オプション:** ローカルモデルを使えば、望むなら **すべてのデータをデバイス上にとどめられます**。
    - **マルチagentルーティング:** チャネル、アカウント、タスクごとに agent を分離し、それぞれが独自の
      workspace とデフォルトを持てます。
    - **オープンソースでハック可能:** inspect、拡張、self-host ができ、ベンダーロックインがありません。

    ドキュメント: [Gateway](/ja-JP/gateway), [Channels](/ja-JP/channels), [Multi-agent](/ja-JP/concepts/multi-agent),
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすればいいですか？">
    最初のプロジェクトとしておすすめなのは:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリを試作する（概要、画面、API 計画）。
    - ファイルやフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail をつないで、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分けて
    sub agents を並列作業に使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な上位5つのユースケースは何ですか？">
    日常で効果が出やすいのは、たいてい次のような使い方です:

    - **個人向けブリーフィング:** inbox、calendar、気になるニュースの要約。
    - **調査と下書き:** 素早い調査、要約、メールや docs の初稿作成。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の通知やチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、繰り返しの Web 作業。
    - **クロスデバイス連携:** スマホからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="SaaS 向けのリード獲得、アウトリーチ、広告、ブログに OpenClaw は役立ちますか？">
    **調査、選別、下書き**には役立ちます。サイトを調べて候補リストを作り、
    見込み客を要約し、アウトリーチや広告文の下書きを作成できます。

    **アウトリーチや広告配信**については、人間をループに残してください。スパムを避け、
    地域の法令やプラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なのは、
    OpenClaw に下書きさせて人間が承認する形です。

    ドキュメント: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人用アシスタント**であり調整レイヤーであって、IDE の置き換えではありません。repo 内で最速の直接コーディングループが欲しいなら
    Claude Code や Codex を使ってください。OpenClaw は、永続的な memory、クロスデバイスアクセス、tool オーケストレーションが欲しいときに使います。

    利点:

    - sessions をまたぐ **永続的な memory + Workspace**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **tool オーケストレーション**（browser、files、scheduling、hooks）
    - **常時稼働 Gateway**（VPS で動かし、どこからでも対話可能）
    - ローカルの browser/screen/camera/exec 用の **Nodes**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="repo を汚さずに Skills をカスタマイズするには？">
    repo 内のコピーを直接編集するのではなく、管理されたオーバーライドを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加してください。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱版 → `skills.load.extraDirs` なので、管理されたオーバーライドは git に触れずに同梱 Skills より優先されます。skill をグローバルにインストールしつつ特定の agent にだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。上流に送る価値がある編集だけを repo に置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。追加ディレクトリは `~/.openclaw/openclaw.json` の `skills.load.extraDirs` で指定できます（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱版 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールされ、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。特定の agent にだけ skill を見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うには？">
    現在サポートされているパターンは次のとおりです:

    - **Cron jobs**: 分離されたジョブごとに `model` オーバーライドを設定できます。
    - **Sub-agents**: デフォルトモデルの異なる別 agent にタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って現在のセッションモデルをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い処理をしている間にボットが固まります。どうやってオフロードすればいいですか？">
    長時間または並列のタスクには **sub-agents** を使ってください。sub-agents は独自の session で動作し、
    要約を返し、メインチャットの応答性を維持します。

    bot に「このタスク用に sub-agent を起動して」と頼むか、`/subagents` を使ってください。
    チャットで `/status` を使うと、Gateway が今何をしているか（そして忙しいかどうか）を確認できます。

    トークンのヒント: 長いタスクも sub-agents もどちらもトークンを消費します。コストが気になるなら、
    `agents.defaults.subagents.model` で sub-agents 用により安いモデルを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに束縛された subagent session はどう動作しますか？">
    スレッドバインディングを使います。Discord スレッドを subagent または session ターゲットにバインドすると、そのスレッド内の後続メッセージはそのバインド済み session に留まります。

    基本フロー:

    - `sessions_spawn` を `thread: true` 付きで起動します（永続的な後続処理には必要に応じて `mode: "session"` も指定）。
    - または `/focus <target>` で手動バインドします。
    - バインディング状態の確認には `/agents` を使います。
    - 自動フォーカス解除の制御には `/session idle <duration|off>` と `/session max-age <duration|off>` を使います。
    - スレッドを切り離すには `/unfocus` を使います。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [Configuration Reference](/ja-JP/gateway/configuration-reference), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagent は終了したのに、完了通知が違う場所に行った、または投稿されませんでした。何を確認すべきですか？">
    まず解決された依頼元ルートを確認してください:

    - 完了モードの subagent 配信は、バインドされたスレッドまたは会話ルートがあればそれを優先します。
    - 完了起点がチャネル情報しか持たない場合、OpenClaw は依頼元セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックし、直接配信を引き続き成功させられるようにします。
    - バインド済みルートも使用可能な保存済みルートもない場合、直接配信は失敗し、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックすることがあります。
    - 無効または古いターゲットでも、キューフォールバックや最終配信失敗を引き起こすことがあります。
    - 子の最後に見える assistant 返信が、厳密にサイレントトークン `NO_REPLY` / `no_reply`、または厳密に `ANNOUNCE_SKIP` の場合、OpenClaw は古い進捗を投稿する代わりに、その通知を意図的に抑制します。
    - 子がツール呼び出しだけでタイムアウトした場合、通知は生のツール出力をそのまま再掲せず、短い部分進捗要約へまとめられることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks), [Session Tools](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron やリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に動いていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効であること（`cron.enabled`）と、`OPENCLAW_SKIP_CRON` が設定されていないことを確認する。
    - Gateway が 24時間365日稼働していることを確認する（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストタイムゾーン）を確認する。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は発火したのに、チャネルに何も送られませんでした。なぜですか？">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` は、外部メッセージが期待されないことを意味します。
    - 通知先（`channel` / `to`）が欠けているか無効な場合、runner は送信配信をスキップします。
    - チャネル認証失敗（`unauthorized`, `Forbidden`）は、runner が配信を試みたが認証情報によりブロックされたことを意味します。
    - サイレントな isolated 結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、runner もキューフォールバック配信を抑制します。

    isolated cron jobs では、runner が最終配信を担当します。agent は、
    runner が送信するためのプレーンテキスト要約を返すことが期待されています。`--no-deliver` は
    その結果を内部に留めるものであり、代わりに agent が
    message tool で直接送れるようにするものではありません。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="isolated cron 実行でモデルが切り替わったり1回再試行されたのはなぜですか？">
    それは通常、重複スケジューリングではなくライブモデル切り替え経路です。

    isolated cron は、アクティブな
    実行が `LiveSessionModelSwitchError` を投げたとき、ランタイムモデル引き継ぎを永続化して再試行できます。再試行では切り替え後の
    provider/model を維持し、切り替えに新しい auth profile オーバーライドが含まれていた場合は、cron
    は再試行前にそれも永続化します。

    関連する選択ルール:

    - Gmail hook モデルオーバーライドは、該当する場合に最優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済み cron-session モデルオーバーライド。
    - その後、通常の agent/default モデル選択。

    再試行ループには上限があります。初回実行に加えて 2 回の切り替え再試行後は、
    cron は無限ループせず中断します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするには？">
    ネイティブの `openclaw skills` コマンドを使うか、workspace に skills を配置してください。macOS の Skills UI は Linux では利用できません。
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

    ネイティブの `openclaw skills install` は、アクティブな workspace の `skills/`
    ディレクトリに書き込みます。自分の skills を公開または
    同期したい場合にのみ、別の `clawhub` CLI をインストールしてください。agent 間で共有するインストールには、skill を
    `~/.openclaw/skills` 配下に置き、どの agent に見せるかを絞りたい場合は `agents.defaults.skills` または
    `agents.list[].skills` を使ってください。

  </Accordion>

  <Accordion title="OpenClaw はスケジュール実行や継続的なバックグラウンド実行ができますか？">
    はい。Gateway スケジューラーを使ってください:

    - **Cron jobs** はスケジュール済みまたは繰り返しタスク向けです（再起動後も保持されます）。
    - **Heartbeat** は「メインセッション」の定期チェック向けです。
    - **Isolated jobs** は、要約を投稿したりチャットへ配信したりする自律 agent 向けです。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple の macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制御されており、skills は **Gateway ホスト**上で適格な場合にのみ system prompt に表示されます。Linux では、`darwin` 専用 skills（`apple-notes`、`apple-reminders`、`things-mac` など）は、その制御を上書きしない限り読み込まれません。

    サポートされるパターンは3つあります:

    **Option A - Gateway を Mac 上で動かす（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を動かし、その後 Linux から [remote mode](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続してください。Gateway ホストが macOS なので、skills は通常どおり読み込まれます。

    **Option B - macOS Node を使う（SSH不要）。**
    Gateway を Linux 上で動かし、macOS Node（メニューバーアプリ）をペアリングして、Mac 上で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 skills を適格として扱えます。agent は `nodes` tool 経由でそれらの skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **Option C - SSH 経由で macOS バイナリを proxy する（上級者向け）。**
    Gateway は Linux に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーへ解決されるようにします。その後、skill を上書きして Linux も許可し、適格状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ラッパーを Linux ホスト上の `PATH` に置きます（例: `~/bin/memo`）。
    3. Linux を許可するように skill metadata を上書きします（workspace または `~/.openclaw/skills`）:

       ```markdown
       ---
       name: apple-notes
       description: memo CLI を使って macOS 上の Apple Notes を管理します。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットが更新されるよう、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion や HeyGen との統合はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム skill / plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API を持っています）。
    - **ブラウザー自動化:** コード不要で動きますが、遅く壊れやすいです。

    クライアントごとにコンテキストを保ちたい場合（代理店ワークフローなど）は、単純なパターンとして:

    - クライアントごとに Notion ページを1つ作る（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時にそのページを取得するよう agent に依頼する。

    ネイティブ統合が欲しい場合は、機能リクエストを出すか、それらの API を対象にした skill
    を作ってください。

    Skills のインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブな workspace の `skills/` ディレクトリに配置されます。agent 間で共有する skills は `~/.openclaw/skills/<name>/SKILL.md` に置いてください。共有インストールを一部の agent にだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部の skills は Homebrew でインストールされたバイナリを前提としており、Linux では Linuxbrew を意味します（上の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills), [Skills config](/ja-JP/tools/skills-config), [ClawHub](/ja-JP/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うには？">
    組み込みの `user` browser profile を使ってください。これは Chrome DevTools MCP 経由で接続します:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を付けたい場合は、明示的な MCP profile を作成してください:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路ではローカルホストの browser も、接続済み browser Node も使えます。Gateway が別の場所で動いている場合は、browser マシンで node host を実行するか、代わりに remote CDP を使ってください。

    `existing-session` / `user` の現在の制限:

    - アクションは CSS セレクター駆動ではなく ref 駆動です
    - アップロードには `ref` / `inputRef` が必要で、現在は1回に1ファイルのみ対応しています
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションには、引き続き managed browser または raw CDP profile が必要です

  </Accordion>
</AccordionGroup>

## サンドボックスと memory

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 内の完全な gateway やサンドボックスイメージ）については [Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker だと機能が制限されているように感じます。フル機能を有効にするには？">
    デフォルトイメージはセキュリティ優先で `node` ユーザーとして動作するため、
    system packages、Homebrew、同梱 browser を含みません。より完全なセットアップにするには:

    - キャッシュを保持するために `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化する。
    - `OPENCLAW_DOCKER_APT_PACKAGES` で system deps をイメージに焼き込む。
    - 同梱 CLI で Playwright browser をインストールする:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにする。

    ドキュメント: [Docker](/ja-JP/install/docker), [Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="DM は個人的なままにして、グループは公開/サンドボックス化にできますか？1つの agent で">
    はい。プライベートな通信が **DM** で、公開したい通信が **グループ** なら可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使ってください。これにより、グループ/チャネルセッション（非メインキー）は設定されたサンドボックス backend で実行され、メイン DM セッションはホスト上に残ります。backend を指定しない場合のデフォルトは Docker です。その後、サンドボックス化されたセッションで利用可能な tools を `tools.sandbox.tools` で制限してください。

    セットアップ手順 + 設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主な config リファレンス: [Gateway configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスに bind するには？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定してください。グローバル + agent ごとの bind はマージされます。`scope: "shared"` の場合、agent ごとの bind は無視されます。機密性の高いものには `:ro` を使い、bind はサンドボックスのファイルシステム境界を迂回することを忘れないでください。

    OpenClaw は、bind ソースを正規化パスと、最も深い既存祖先を通じて解決された正規パスの両方に対して検証します。つまり、最後のパスセグメントがまだ存在しなくても、symlink 親経由のエスケープは引き続きフェイルクローズドとなり、許可ルートのチェックも symlink 解決後に適用されます。

    例と安全上の注意については [Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="memory はどのように動作しますか？">
    OpenClaw の memory は、agent workspace 内の Markdown ファイルにすぎません:

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の厳選された長期ノート（main/private sessions のみ）

    OpenClaw はまた、モデルに
    自動 Compaction 前に永続的なノートを書かせるための、**サイレントな pre-compaction memory flush** も実行します。これは workspace
    が書き込み可能な場合にのみ動作します（読み取り専用サンドボックスではスキップされます）。[Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="memory がすぐ忘れます。定着させるにはどうすればいいですか？">
    その事実を **memory に書く**よう bot に頼んでください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これは今も改善中の領域です。モデルに memory を保存するよう促すと役立ちます。
    何をすべきかは理解しています。それでも忘れる場合は、Gateway が毎回同じ
    workspace を使っていることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="memory はずっと保持されますか？制限はありますか？">
    memory ファイルはディスク上にあり、削除するまで保持されます。制限は
    モデルではなくストレージです。ただし **セッションコンテキスト** は依然としてモデルの
    コンテキストウィンドウに制限されるため、長い会話は Compaction または切り詰めが起こり得ます。そのため
    memory search が存在します。関連部分だけをコンテキストに戻します。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Context](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティック memory search には OpenAI API key が必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuth はチャット/completions を対象としており、
    embeddings アクセスは付与しません。したがって **Codex でサインインしても（OAuth または
    Codex CLI ログイン）**、セマンティック memory search には役立ちません。OpenAI embeddings には
    引き続き実際の API key（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    provider を明示的に設定しない場合、OpenClaw は API key を解決できたときに
    自動で provider を選択します（auth profiles、`models.providers.*.apiKey`、または env vars）。
    OpenAI key が解決できれば OpenAI を優先し、そうでなければ Gemini、次に Voyage、
    その次に Mistral を選びます。リモート key が利用できない場合、memory
    search は設定されるまで無効のままです。ローカルモデル経路が
    設定済みで利用可能なら、OpenClaw
    は `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"`（必要なら
    `memorySearch.fallback = "none"` も）を設定してください。Gemini embeddings を使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。embedding
    モデルとして **OpenAI、Gemini、Voyage、Mistral、Ollama、または local** をサポートしています。セットアップの詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使うデータはすべてローカルに保存されますか？">
    いいえ。**OpenClaw の state はローカル**ですが、**外部サービスは送信された内容を引き続き見ることができます**。

    - **デフォルトでローカル:** sessions、memory ファイル、config、workspace は Gateway ホスト上にあります
      （`~/.openclaw` + あなたの workspace ディレクトリ）。
    - **必然的にリモート:** モデル provider（Anthropic/OpenAI など）へ送るメッセージは
      その API に送信され、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      それらのサーバーに保存します。
    - **範囲は自分で制御できます:** ローカルモデルを使えばプロンプトは自分のマシン上に残せますが、チャネル
      トラフィックは引き続きそのチャネルのサーバーを経由します。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace), [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はどこにデータを保存しますか？">
    すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります:

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン config（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 従来の OAuth import（初回利用時に auth profiles にコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys、および任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 用の任意のファイルベース秘密ペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 従来互換ファイル（静的 `api_key` 項目はスクラブ済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | agent ごとの state（agentDir + sessions）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と state（agent ごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（agent ごと）                                       |

    従来の単一 agent パス: `~/.openclaw/agent/*`（`openclaw doctor` で移行されます）。

    **workspace**（AGENTS.md、memory ファイル、skills など）は別で、`agents.defaults.workspace`（デフォルト: `~/.openclaw/workspace`）で設定します。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**agent workspace** に置きます。

    - **Workspace（agent ごと）**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`（`MEMORY.md` がない場合は従来のフォールバック `memory.md`）、
      `memory/YYYY-MM-DD.md`, 任意の `HEARTBEAT.md`。
    - **State dir（`~/.openclaw`）**: config、チャネル/provider state、auth profiles、sessions、logs、
      および共有 skills（`~/.openclaw/skills`）。

    デフォルト workspace は `~/.openclaw/workspace` で、次で設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後に bot が「忘れる」場合は、Gateway が毎回同じ
    workspace を使って起動していることを確認してください（また、remote mode では **gateway ホストの**
    workspace が使われ、ローカルノートPCのものではないことに注意してください）。

    ヒント: 永続的な振る舞いや設定を持たせたい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む**よう bot に頼んでください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace** は **private** git repo に入れ、どこか
    private な場所（たとえば GitHub private）にバックアップしてください。これにより memory + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、sessions、tokens、または暗号化された secrets ペイロード）は **commit しないでください**。
    完全復元が必要なら、workspace と state directory の両方を
    それぞれ別にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="agent は workspace 外でも動けますか？">
    はい。workspace は **デフォルト cwd** と memory のアンカーであり、厳密なサンドボックスではありません。
    相対パスは workspace 内で解決されますが、絶対パスは他の
    ホスト上の場所にもアクセスできます。分離が必要なら、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) または agent ごとのサンドボックス設定を使ってください。repo を
    デフォルト作業ディレクトリにしたい場合は、その agent の
    `workspace` を repo ルートに向けてください。OpenClaw repo は単なるソースコードです。意図的にその中で agent を動かしたい場合を除き、
    workspace は別にしておいてください。

    例（repo をデフォルト cwd にする）:

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

  <Accordion title="remote mode: セッションストアはどこにありますか？">
    セッション state は **gateway ホスト**が所有します。remote mode では、重要なのはローカルノートPCではなく、リモートマシン上のセッションストアです。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## config の基本

<AccordionGroup>
  <Accordion title="config の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** config を読みます:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` をデフォルト workspace に含む）を使用します。

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`（または `"tailnet"`）を設定したら、何も listen しない / UI に unauthorized と出ます'>
    non-loopback bind には **有効な gateway 認証経路** が必要です。実際には次のいずれかを意味します:

    - 共有シークレット認証: token または password
    - 正しく設定された non-loopback の identity-aware reverse proxy の背後での `gateway.auth.mode: "trusted-proxy"`

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

    注記:

    - `gateway.remote.token` / `.password` だけではローカル gateway 認証は有効になりません。
    - ローカル呼び出し経路は、`gateway.auth.*` が未設定の場合にのみ、フォールバックとして `gateway.remote.*` を使えます。
    - password 認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示設定され、未解決の場合、解決はフェイルクローズドになります（remote フォールバックで隠蔽されません）。
    - 共有シークレットの Control UI セットアップは `connect.params.auth.token` または `connect.params.auth.password`（app/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような identity 付与モードは代わりにリクエストヘッダーを使います。共有シークレットを URL に入れるのは避けてください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback reverse proxy でも trusted-proxy 認証は満たしません。trusted proxy は設定済みの non-loopback ソースである必要があります。

  </Accordion>

  <Accordion title="localhost でも token が必要になったのはなぜですか？">
    OpenClaw は loopback を含め、デフォルトで gateway 認証を強制します。通常のデフォルト経路では token 認証を意味します。明示的な認証経路が設定されていない場合、gateway 起動は token モードに解決され、自動生成された token を `gateway.auth.token` に保存するため、**ローカル WS クライアントも認証が必要**になります。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証経路を使いたい場合は、password モード（または、non-loopback identity-aware reverse proxies 用の `trusted-proxy`）を明示的に選べます。本当に loopback をオープンにしたいなら、config に `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="config を変更したら再起動は必要ですか？">
    Gateway は config を監視しており、ホットリロードをサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動
    - `hot`, `restart`, `off` もサポートされています

  </Accordion>

  <Accordion title="面白い CLI タグラインを無効にするには？">
    config で `cli.banner.taglineMode` を設定してください:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグライン文言を隠しますが、バナーのタイトル/バージョン行は残します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節もののタグラインをローテーションします（デフォルト動作）。
    - バナー自体を出したくない場合は、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

  </Accordion>

  <Accordion title="web search（および web fetch）を有効にするには？">
    `web_fetch` は API key なしで動作します。`web_search` は選択した
    provider に依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API ベース provider には、通常どおりの API key 設定が必要です。
    - Ollama Web Search は key 不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo は key 不要ですが、非公式の HTML ベース統合です。
    - SearXNG は key 不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行して provider を選んでください。
    環境変数の代替:

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
              provider: "firecrawl", // 任意。自動検出するなら省略
            },
          },
        },
    }
    ```

    provider 固有の web-search config は現在 `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。
    旧 `tools.web.search.*` provider パスも互換性のため一時的に読み込まれますが、新しい config では使わないでください。
    Firecrawl の web-fetch フォールバック config は `plugins.entries.firecrawl.config.webFetch.*` 配下にあります。

    注記:

    - 許可リストを使っている場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化しない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、最初に準備できている fetch フォールバック provider を自動検出します。現在の同梱 provider は Firecrawl です。
    - デーモンは `~/.openclaw/.env`（または service 環境）から env vars を読みます。

    ドキュメント: [Web tools](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で config が消えました。どう復旧し、どう防げばいいですか？">
    `config.apply` は **config 全体** を置き換えます。部分オブジェクトを送ると、それ以外は
    すべて削除されます。

    現在の OpenClaw は、多くの事故的な上書きを保護します:

    - OpenClaw 所有の config 書き込みは、書き込み前に変更後の完全な config を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集で起動またはホットリロードが壊れた場合、Gateway は last-known-good config を復元し、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。
    - 復旧後、main agent はブート警告を受け取るため、再びその不正な config を盲目的に書き戻しません。

    復旧方法:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`、`Config write rejected:`、または `config reload restored last-known-good config` を確認してください。
    - アクティブ config の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認してください。
    - 復元済みのアクティブ config が動いているならそれを維持し、意図したキーだけを `openclaw config set` または `config.patch` で戻してください。
    - `openclaw config validate` と `openclaw doctor` を実行してください。
    - last-known-good または rejected ペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行して channels/models を再設定してください。
    - 想定外の事象だった場合は、バグ報告を行い、最後に分かっている config またはバックアップを含めてください。
    - ローカルのコーディング agent なら、ログや履歴から動作する config を再構築できることがよくあります。

    防止方法:

    - 小さな変更には `openclaw config set` を使ってください。
    - 対話的編集には `openclaw configure` を使ってください。
    - 正確なパスやフィールド形状に自信がない場合は、まず `config.schema.lookup` を使ってください。浅いスキーマノードと直下の子要約が返り、段階的に掘り下げられます。
    - 部分的な RPC 編集には `config.patch` を使い、`config.apply` は完全な config 置換専用にしてください。
    - agent 実行から owner 専用の `gateway` tool を使っている場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは引き続き拒否されます（同じ保護された exec パスに正規化される旧 `tools.bash.*` エイリアスを含む）。

    ドキュメント: [Config](/cli/config), [Configure](/cli/configure), [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="複数デバイスにまたがる専用ワーカー付きの中央 Gateway を動かすには？">
    一般的なパターンは **1つの Gateway**（例: Raspberry Pi）+ **Nodes** + **agents** です:

    - **Gateway（中央）:** channels（Signal/WhatsApp）と、ルーティング、sessions を所有。
    - **Nodes（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカル tools（`system.run`, `canvas`, `camera`）を公開。
    - **Agents（ワーカー）:** 特定の役割（例: 「Hetzner ops」「個人データ」）向けの別々の頭脳/workspaces。
    - **Sub-agents:** main agent から並列化したいときにバックグラウンド作業を起動。
    - **TUI:** Gateway に接続して agents/sessions を切り替え。

    ドキュメント: [Nodes](/ja-JP/nodes), [Remote access](/ja-JP/gateway/remote), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw browser は headless で実行できますか？">
    はい。config オプションです:

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

    デフォルトは `false`（headful）です。headless は一部サイトでアンチボット検査を引き起こしやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    headless は **同じ Chromium エンジン** を使い、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違い:

    - ブラウザーウィンドウが見えない（視覚確認が必要ならスクリーンショットを使ってください）。
    - 一部サイトは headless モードでの自動化により厳格です（CAPTCHA、アンチボット）。
      たとえば X/Twitter は headless セッションをしばしばブロックします。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うには？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium 系ブラウザー）に設定して、Gateway を再起動してください。
    完全な config 例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## remote gateway と Nodes

<AccordionGroup>
  <Accordion title="Telegram、gateway、Nodes の間でコマンドはどう伝播しますか？">
    Telegram メッセージは **gateway** で処理されます。gateway が agent を実行し、
    Node tool が必要になったときに初めて **Gateway WebSocket** 経由で nodes を呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes は受信 provider トラフィックを見ません。受け取るのは node RPC 呼び出しだけです。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、agent はどうやって自分のコンピューターにアクセスできますか？">
    短く言うと、**自分のコンピューターを Node としてペアリング**してください。Gateway は別の場所で動いていても、
    Gateway WebSocket 経由でローカルマシン上の `node.*` tools（screen、camera、system）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行する。
    2. Gateway ホストとあなたのコンピューターを同じ tailnet に置く。
    3. Gateway WS が到達可能であることを確認する（tailnet bind または SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）
       で接続して、Node として登録できるようにする。
    5. Gateway で Node を承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。Nodes は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS Node をペアリングすると、そのマシンで `system.run` が可能になります。信頼できるデバイスだけを
    ペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Gateway protocol](/ja-JP/gateway/protocol), [macOS remote mode](/ja-JP/platforms/mac/remote), [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続済みなのに返信がありません。どうすればいいですか？">
    まず基本を確認してください:

    - Gateway が動いている: `openclaw gateway status`
    - Gateway の健全性: `openclaw status`
    - Channel の健全性: `openclaw channels status`

    次に認証とルーティングを確認します:

    - Tailscale Serve を使っている場合、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。
    - SSH トンネル経由で接続している場合、ローカルトンネルが有効で正しいポートを向いていることを確認してください。
    - 許可リスト（DM またはグループ）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale), [Remote access](/ja-JP/gateway/remote), [Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2つの OpenClaw インスタンス同士を会話させられますか（ローカル + VPS）？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます:

    **最も簡単:** 両方の bot がアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使います。
    Bot A から Bot B にメッセージを送り、その後は Bot B が通常どおり返信するようにします。

    **CLI ブリッジ（汎用）:** スクリプトで相手の Gateway に
    `openclaw agent --message ... --deliver` を呼び、相手の bot が
    監視しているチャットをターゲットにします。片方の bot がリモート VPS 上にある場合は、その remote Gateway を
    SSH/Tailscale 経由で CLI が参照するようにしてください（[Remote access](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象 Gateway に到達できるマシン上で実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つの bot が無限ループしないようにガードレールを追加してください（メンションのみ、チャネル
    許可リスト、または「bot メッセージには返信しない」ルール）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数 agent に別々の VPS は必要ですか？">
    いいえ。1つの Gateway で複数の agents をホストでき、それぞれが独自の workspace、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップであり、agent ごとに
    1台ずつ VPS を立てるよりずっと安く簡単です。

    別々の VPS が必要なのは、強い分離（セキュリティ境界）や、共有したくない非常に
    異なる config が必要な場合だけです。それ以外は、1つの Gateway を維持し、
    複数の agents または sub-agents を使ってください。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人のノートPCで Node を使う利点はありますか？">
    はい。Node は、remote Gateway からノートPCへ到達するための第一級の方法で、
    シェルアクセス以上のことを可能にします。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi 級のマシンで十分で、4 GB RAM なら余裕があります）。そのため、常時稼働ホスト +
    ノートPCを Node とする構成が一般的です。

    - **受信 SSH 不要。** Nodes は外向きに Gateway WebSocket へ接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run` は、そのノートPC上での Node の許可リスト/承認によって制御されます。
    - **より多くのデバイス tools。** Nodes は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカル browser 自動化。** Gateway は VPS に置いたまま、ノートPC上の node host 経由でローカル Chrome を使うか、Chrome MCP 経由でホスト上のローカル Chrome に接続できます。

    SSH は一時的なシェルアクセスには問題ありませんが、継続的な agent ワークフローや
    デバイス自動化には Node の方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Nodes は gateway service を実行しますか？">
    いいえ。意図的に分離プロファイルを実行するのでない限り、**1ホストにつき1 gateway** のみを実行すべきです（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）。Nodes は gateway に接続する周辺機器です
    （iOS/Android Nodes、またはメニューバーアプリの macOS「node mode」）。headless の node
    host と CLI 制御については [Node host CLI](/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="config を適用する API / RPC 手段はありますか？">
    はい。

    - `config.schema.lookup`: 書き込む前に、1つの config サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子要約とともに確認
    - `config.get`: 現在のスナップショット + hash を取得
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能ならホットリロードし、必要なら再起動
    - `config.apply`: 検証して完全な config を置換。可能ならホットリロードし、必要なら再起動
    - owner 専用の `gateway` ランタイム tool は、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。旧 `tools.bash.*` エイリアスは同じ保護された exec パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最低限まともな config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これで workspace が設定され、誰が bot をトリガーできるかが制限されます。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定して Mac から接続するには？">
    最小手順:

    1. **VPS にインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストール + ログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効化（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を付けます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS 上で Tailscale Serve を使ってください:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback に bind したまま、Tailscale 経由で HTTPS を公開します。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac Node を remote Gateway（Tailscale Serve）に接続するには？">
    Serve は **Gateway Control UI + WS** を公開します。Nodes は同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS と Mac が同じ tailnet にあることを確認する**。
    2. **macOS アプリを Remote mode で使う**（SSH ターゲットには tailnet ホスト名を使えます）。
       アプリが Gateway ポートをトンネルし、Node として接続します。
    3. gateway 上で Node を承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol), [Discovery](/ja-JP/gateway/discovery), [macOS remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノートPCには install すべきですか、それとも Node を追加するだけでいいですか？">
    2台目のノートPCで必要なのが **ローカル tools**（screen/camera/exec）だけなら、
    **Node** として追加してください。これにより Gateway は1つで済み、config の重複も避けられます。ローカルの Node tools は
    現在 macOS 専用ですが、今後ほかの OS にも拡張予定です。

    **強い分離** または完全に別々の bot が必要な場合にのみ、2つ目の Gateway をインストールしてください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## env vars と .env 読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどう読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から env vars を読み取り、さらに次も読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも、既存の env vars を上書きしません。

    config 内にインライン env vars を定義することもできます（プロセス env にない場合のみ適用）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位とソースは [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="service 経由で Gateway を起動したら env vars が消えました。どうすればいいですか？">
    よくある修正は2つです:

    1. 欠けているキーを `~/.openclaw/.env` に入れて、service が shell env を継承しない場合でも拾われるようにする。
    2. shell import を有効にする（オプトインの利便機能）:

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

    これによりログイン shell を実行し、必要な欠落キーだけを取り込みます（上書きはしません）。env var 相当:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='`COPILOT_GITHUB_TOKEN` を設定したのに、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は、**shell env import** が有効かどうかを表示します。"Shell env: off"
    は **env vars が欠けている** ことを意味するのではなく、OpenClaw が
    ログイン shell を自動読み込みしないことを意味します。

    Gateway が service（launchd/systemd）として動いている場合、shell
    環境は継承されません。次のいずれかで修正してください:

    1. token を `~/.openclaw/.env` に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効にする。
    3. または config の `env` ブロックに追加する（欠けている場合のみ適用）。

    その後 gateway を再起動して再確認してください:

    ```bash
    openclaw models status
    ```

    Copilot token は `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## sessions と複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるには？">
    `/new` または `/reset` を単独メッセージとして送信してください。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="`/new` を一度も送らなければ sessions は自動でリセットされますか？">
    sessions は `session.idleMinutes` 後に期限切れにできますが、これは **デフォルトで無効**（デフォルト **0**）です。
    有効にするには正の値を設定してください。有効時は、アイドル期間後の**次の**
    メッセージで、そのチャットキーに対する新しい session id が開始されます。
    これは transcript を削除するのではなく、新しい session を始めるだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（CEO 1人と多数の agent）を作る方法はありますか？">
    はい。**マルチagentルーティング** と **sub-agents** によって可能です。1つの調整役
    agent と、独自の workspace とモデルを持つ複数の worker agents を作れます。

    ただし、これは **楽しい実験** と考えるのが最適です。トークン消費が大きく、
    多くの場合、1つの bot を別々の sessions で使うより効率が下がります。私たちが
    想定する典型的なモデルは、あなたが会話する bot は1つで、並列作業用に異なる sessions を持つ形です。その
    bot は必要に応じて sub-agents を起動することもできます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="なぜタスクの途中で context が切り詰められたのですか？どう防げますか？">
    セッション context はモデルのウィンドウに制限されています。長いチャット、大きな tool 出力、多数の
    ファイルにより Compaction や切り詰めが発生することがあります。

    有効な対策:

    - 現在の状態を要約してファイルに書くよう bot に頼む。
    - 長いタスクの前に `/compact` を使い、話題を変えるときには `/new` を使う。
    - 重要な context は workspace に保持し、それを読み返すよう bot に頼む。
    - 長時間または並列作業には sub-agents を使い、メインチャットを小さく保つ。
    - 頻繁に起こる場合は、より大きい context window を持つモデルを選ぶ。

  </Accordion>

  <Accordion title="OpenClaw を完全にリセットしつつ install は残すには？">
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

    注記:

    - 既存 config がある場合、オンボーディングでも **Reset** が提示されます。[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
    - profiles（`--profile` / `OPENCLAW_PROFILE`）を使っている場合は、各 state dir をリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用 reset: `openclaw gateway --dev --reset`（開発専用。開発用 config + credentials + sessions + workspace を消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。どうやって reset または compact しますか？'>
    次のいずれかを使ってください:

    - **Compact**（会話は維持しつつ古いターンを要約）:

      ```
      /compact
      ```

      または要約を誘導する `/compact <instructions>`。

    - **Reset**（同じチャットキーに対する新しい session ID）:

      ```
      /new
      /reset
      ```

    それでも繰り返す場合:

    - 古い tool 出力を削るため、**session pruning**（`agents.defaults.contextPruning`）を有効化または調整する。
    - より大きい context window を持つモデルを使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction), [Session pruning](/ja-JP/concepts/session-pruning), [Session management](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    これは provider の検証エラーです。モデルが必須の
    `input` を持たない `tool_use` ブロックを出力したことを意味します。通常はセッション履歴が古いか壊れていることが原因です（長いスレッド
    や tool/schema 変更の後によく起こります）。

    修正: `/new`（単独メッセージ）で新しい session を開始してください。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが来るのはなぜですか？">
    Heartbeat はデフォルトで **30分** ごとに実行されます（OAuth 認証使用時は **1時間**）。調整または無効化するには:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // または無効化するなら "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在していても実質的に空（空行と
    `# Heading` のような markdown ヘッダーだけ）の場合、OpenClaw は API 呼び出し節約のため
    Heartbeat 実行をスキップします。
    ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするか決めます。

    agent ごとのオーバーライドは `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「bot アカウント」を追加する必要はありますか？'>
    いいえ。OpenClaw は **あなた自身のアカウント** で動作するため、あなたがそのグループにいれば、OpenClaw もそのグループを見られます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    **自分だけ**がグループ返信をトリガーできるようにしたい場合:

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

  <Accordion title="WhatsApp グループの JID はどう取得しますか？">
    Option 1（最速）: ログを追跡し、そのグループでテストメッセージを送ります:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探してください。例:
    `1234567890-1234567890@g.us`。

    Option 2（すでに設定済み/許可リスト済みの場合）: config からグループ一覧を表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs)。

  </Accordion>

  <Accordion title="なぜ OpenClaw はグループで返信しないのですか？">
    よくある原因は2つです:

    - メンションゲートが有効です（デフォルト）。ボットを @メンションする必要があります（または `mentionPatterns` に一致させる）。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが許可リストに入っていません。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM と context を共有しますか？">
    ダイレクトチャットはデフォルトで main session に集約されます。グループ/チャネルはそれぞれ独自の session key を持ち、Telegram topics / Discord threads も別セッションです。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="workspace と agent はいくつ作れますか？">
    ハード上限はありません。数十、場合によっては数百でも問題ありませんが、次には注意してください:

    - **ディスク増加:** sessions + transcripts は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** agent が増えるほど、同時モデル使用量も増えます。
    - **運用負荷:** agent ごとの auth profiles、workspaces、チャネルルーティング。

    ヒント:

    - agent ごとに1つの **アクティブな** workspace（`agents.defaults.workspace`）を維持する。
    - ディスクが増えたら古い sessions を削除する（JSONL またはストア項目を削除）。
    - `openclaw doctor` で stray workspace や profile 不一致を見つける。

  </Accordion>

  <Accordion title="複数の bot やチャットを同時に動かせますか（Slack）？また、どう設定すべきですか？">
    はい。**Multi-Agent Routing** を使えば、複数の分離された agent を動かし、
    チャネル/アカウント/peer ごとに受信メッセージをルーティングできます。Slack はチャネルとしてサポートされており、特定の agent にバインドできます。

    browser アクセスは強力ですが、「人間ができることを何でもできる」わけではありません。アンチボット、CAPTCHA、MFA は
    依然として自動化をブロックする可能性があります。最も信頼性の高い browser 制御には、ホスト上のローカル Chrome MCP を使うか、
    実際に browser を動かしているマシン上で CDP を使ってください。

    ベストプラクティスのセットアップ:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - 役割ごとに1 agent（bindings）。
    - それらの agent にバインドされた Slack チャネル。
    - 必要に応じて Chrome MCP または Node 経由のローカル browser。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [Browser](/ja-JP/tools/browser), [Nodes](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## Models: デフォルト、選択、エイリアス、切り替え

<AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルとは、次に設定したものです:

    ```
    agents.defaults.model.primary
    ```

    Models は `provider/model` 形式で参照されます（例: `openai/gpt-5.4`）。provider を省略した場合、OpenClaw はまずエイリアスを試し、その後、その正確なモデル ID に対する一意の設定済み provider 一致を試し、それでもだめなら、非推奨の互換経路として設定済みデフォルト provider にフォールバックします。その provider がもはや設定済みデフォルトモデルを公開していない場合、OpenClaw は古くなった削除済み provider デフォルトを表に出す代わりに、最初の設定済み provider/model にフォールバックします。それでも、**明示的に** `provider/model` を設定すべきです。

  </Accordion>

  <Accordion title="どの model をおすすめしますか？">
    **推奨デフォルト:** 利用している provider スタックで使える、最新世代の最も強力な model を使ってください。
    **tool 有効または信頼できない入力を扱う agent 向け:** コストより model の強さを優先してください。
    **日常的/低リスクのチャット向け:** より安いフォールバックモデルを使い、agent の役割ごとにルーティングしてください。

    MiniMax には専用ドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安としては、高リスクな作業には **払える範囲で最良の model** を使い、日常の
    チャットや要約にはより安い model を使ってください。agent ごとに model をルーティングでき、長いタスクは sub-agents で
    並列化できます（各 sub-agent はトークンを消費します）。[Models](/ja-JP/concepts/models) と
    [Sub-agents](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱い/過度に量子化されたモデルは、プロンプト
    インジェクションや危険な挙動に対してより脆弱です。[Security](/ja-JP/gateway/security) を参照してください。

    さらに詳しく: [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="config を消さずに model を切り替えるには？">
    **model コマンド**を使うか、**model** フィールドだけを編集してください。完全な config 置換は避けてください。

    安全な方法:

    - チャット内で `/model`（手早く、セッション単位）
    - `openclaw models set ...`（model config だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    config 全体を置き換えるつもりがない限り、部分オブジェクトで `config.apply` は使わないでください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードは、正規化パス、浅いスキーマの docs/制約、直下の子要約を返します。
    部分更新向けです。
    もし config を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/ja-JP/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="self-hosted models（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルへの最も簡単な経路は Ollama です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストール
    2. `ollama pull gemma4` のようにローカル model を pull
    3. cloud models も使いたい場合は `ollama signin` を実行
    4. `openclaw onboard` を実行して `Ollama` を選択
    5. `Local` または `Cloud + Local` を選択

    注記:

    - `Cloud + Local` では、cloud models とローカル Ollama models の両方が使えます
    - `kimi-k2.5:cloud` のような cloud models にはローカル pull は不要です
    - 手動切り替えには `openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ注記: 小さいモデルや強く量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。tools を使える bot には **大きなモデル** を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格な tool 許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama), [ローカルモデル](/ja-JP/gateway/local-models),
    [Model providers](/ja-JP/concepts/model-providers), [Security](/ja-JP/gateway/security),
    [Sandboxing](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill は何の model を使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定の provider 推奨はありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティ重視/tool 有効な agents には、利用可能な最新世代で最も強い model を使ってください。
  </Accordion>

  <Accordion title="再起動せずにその場で model を切り替えるには？">
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

    利用可能な models は `/model`、`/model list`、または `/model status` で一覧表示できます。

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します:

    ```
    /model 3
    ```

    provider 用に特定の auth profile を強制することもできます（セッション単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` では、どの agent がアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの auth profile が試されるかが表示されます。
    利用可能な場合は、設定済み provider endpoint（`baseUrl`）と API mode（`api`）も表示されます。

    **`@profile` で固定した profile を解除するには？**

    `@profile` 接尾辞なしで `/model` を再実行してください:

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか、`/model <default provider/model>` を送ってください。
    どの auth profile がアクティブかは `/model status` で確認してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.2 を使い、コーディングには Codex 5.3 を使えますか？">
    はい。1つをデフォルトに設定し、必要に応じて切り替えてください:

    - **クイック切り替え（セッション単位）:** 日常タスクには `/model gpt-5.4`、Codex OAuth でのコーディングには `/model openai-codex/gpt-5.4`。
    - **デフォルト + 切り替え:** `agents.defaults.model.primary` を `openai/gpt-5.4` に設定し、コーディング時だけ `openai-codex/gpt-5.4` に切り替える（またはその逆）。
    - **Sub-agents:** コーディングタスクを別のデフォルト model を持つ sub-agents にルーティングする。

    [Models](/ja-JP/concepts/models) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.4 の fast mode はどう設定しますか？">
    セッショントグルか config デフォルトのどちらかを使ってください:

    - **セッション単位:** セッションが `openai/gpt-5.4` または `openai-codex/gpt-5.4` を使っている間に `/fast on` を送る。
    - **model ごとのデフォルト:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` を `true` に設定する。
    - **Codex OAuth でも:** `openai-codex/gpt-5.4` も使うなら、そちらにも同じフラグを設定する。

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

    OpenAI では、fast mode は対応するネイティブ Responses リクエストで `service_tier = "priority"` にマッピングされます。セッションの `/fast` オーバーライドは config デフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) と [OpenAI fast mode](/ja-JP/providers/openai#openai-fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッションオーバーライドの **許可リスト** になります。その一覧にない model を選ぶと、次が返されます:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは通常の返信**の代わりに**返されます。対処法: その model を
    `agents.defaults.models` に追加するか、許可リストを削除するか、`/model list` から model を選んでください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは **provider が設定されていない** ことを意味します（MiniMax provider config または auth
    profile が見つからなかったため）、その model を解決できません。

    修正チェックリスト:

    1. 現在の OpenClaw リリースへアップグレードするか、ソースの `main` から実行して、その後 gateway を再起動してください。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax の認証情報が
       env/auth profiles に存在し、対応する provider が注入できることを確認してください
       （`minimax` 用の `MINIMAX_API_KEY`、`minimax-portal` 用の `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証経路に対応する正確な model id（大文字小文字を区別）を使ってください:
       API key
       セットアップなら `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、
       OAuth セットアップなら `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します:

       ```bash
       openclaw models list
       ```

       そして一覧から選んでください（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [Models](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**にして、必要時に **セッションごと**に model を切り替えてください。
    フォールバックは **エラー** 用であり、「難しいタスク」用ではないため、`/model` または別 agent を使ってください。

    **Option A: セッションごとに切り替える**

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

    **Option B: agent を分ける**

    - Agent A のデフォルト: MiniMax
    - Agent B のデフォルト: OpenAI
    - agent ごとにルーティングするか、`/agent` で切り替える

    ドキュメント: [Models](/ja-JP/concepts/models), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [MiniMax](/ja-JP/providers/minimax), [OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト省略名が同梱されています（`agents.defaults.models` にその model が存在する場合にのみ適用されます）:

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自の alias を設定した場合は、あなたの値が優先されます。

  </Accordion>

  <Accordion title="model ショートカット（エイリアス）を定義/上書きするには？">
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

    その後 `/model sonnet`（またはサポートされる場合は `/<alias>`）で、その model ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI のような他 provider の models を追加するには？">
    OpenRouter（従量課金、多数の models）:

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

    provider/model を参照していても必要な provider key が欠けている場合は、ランタイム認証エラーになります（例: `No API key found for provider "zai"`）。

    **新しい agent を追加した後に No API key found for provider と出る**

    これは通常、**新しい agent** の auth ストアが空であることを意味します。auth は agent ごとで、
    次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に auth を設定する。
    - または、main agent の `agentDir` にある `auth-profiles.json` を、新しい agent の `agentDir` にコピーする。

    agents 間で `agentDir` を使い回してはいけません。auth/session の衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどう動作しますか？">
    フェイルオーバーは2段階で行われます:

    1. 同じ provider 内での **auth profile rotation**。
    2. `agents.defaults.model.fallbacks` 内の次の model への **model fallback**。

    失敗した profile にはクールダウン（指数バックオフ）が適用されるため、provider がレート制限中または一時的に失敗していても、OpenClaw は応答を続けられます。

    レート制限バケットには、単なる `429` レスポンス以上のものが含まれます。OpenClaw
    は `Too many concurrent requests`、
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`、および定期的な
    使用ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバーに値する
    レート制限として扱います。

    一見課金由来に見えるレスポンスの中には `402` でないものもあり、また一部の HTTP `402`
    レスポンスもこの一時的バケットにとどまります。provider が
    `401` または `403` で明示的な課金テキストを返した場合、OpenClaw はそれを
    課金レーンに維持できますが、provider 固有のテキストマッチャーは、それを所有する
    provider に限定されます（たとえば OpenRouter の `Key limit exceeded`）。もし `402`
    メッセージが代わりに再試行可能な使用ウィンドウや
    organization/workspace の利用上限（`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期課金無効ではなく `rate_limit` として扱います。

    context overflow エラーは別扱いです。たとえば
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, または `ollama error: context length
    exceeded` のようなシグネチャは、model
    fallback を進める代わりに Compaction/再試行経路にとどまります。

    汎用サーバーエラーテキストは、「unknown/error を含むものは何でも」という扱いより意図的に狭くなっています。OpenClaw は
    Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような stop-reason エラー、一時的なサーバーテキストを持つ JSON `api_error` ペイロード
    （`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`）、および `ModelNotReadyException` のような provider-busy エラーを、
    provider コンテキストが一致する場合に、フェイルオーバーに値する timeout/overloaded シグナルとして扱います。
    一方、`LLM request failed with an unknown
    error.` のような一般的な内部フォールバック文言は保守的に扱われ、それ単体では model fallback を引き起こしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とは何を意味しますか？'>
    これは、システムが auth profile ID `anthropic:default` を使おうとしたが、期待される auth ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **auth profiles の保存場所を確認する**（新旧パス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 従来: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **env var が Gateway に読み込まれていることを確認する**
      - `ANTHROPIC_API_KEY` を shell に設定していても、Gateway を systemd/launchd 経由で動かしていると継承されない場合があります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しい agent を編集していることを確認する**
      - マルチagent構成では、`auth-profiles.json` が複数存在し得ます。
    - **model/auth ステータスを簡易確認する**
      - `openclaw models status` を使うと、設定済み models と provider が認証済みかどうかを確認できます。

    **「No credentials found for profile anthropic」向け修正チェックリスト**

    これは、その実行が Anthropic auth profile に固定されているが、Gateway
    が auth ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - gateway ホスト上で `openclaw models auth login --provider anthropic --method cli --set-default` を実行してください。
    - **代わりに API key を使いたい場合**
      - **gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れてください。
      - 存在しない profile を強制する固定順序をクリアしてください:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **gateway ホスト上でコマンドを実行していることを確認する**
      - remote mode では、auth profiles はローカルノートPCではなく gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    model config に Google Gemini がフォールバックとして含まれている場合（または Gemini の省略名に切り替えた場合）、OpenClaw は model fallback 中にそれを試します。Google 認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正方法: Google auth を提供するか、`agents.defaults.model.fallbacks` / aliases から Google models を削除または回避して、フォールバックがそちらに向かわないようにしてください。

    **LLM request rejected: thinking signature required (Google Antigravity)**

    原因: セッション履歴に **署名のない thinking ブロック** が含まれています（多くは
    中断/部分ストリーム由来）。Google Antigravity では thinking ブロックに署名が必要です。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名のない thinking ブロックを削除します。それでも表示される場合は、**新しい session** を開始するか、その agent に対して `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## Auth profiles: それが何かと管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="auth profile とは何ですか？">
    auth profile は、provider に結び付いた名前付き認証情報レコード（OAuth または API key）です。profiles は次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的な profile ID には何がありますか？">
    OpenClaw は provider 接頭辞付き ID を使います。たとえば:

    - `anthropic:default`（email identity がない場合によくある）
    - OAuth identity 用の `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの auth profile を最初に試すか制御できますか？">
    はい。config は、profiles の任意メタデータと provider ごとの順序（`auth.order.<provider>`）をサポートします。これに秘密情報は保存されず、ID を provider/mode に対応付け、rotation 順を設定します。

    OpenClaw は、profile が短い **cooldown**（レート制限/タイムアウト/認証失敗）中、またはより長い **disabled** 状態（課金/残高不足）中であれば、一時的にそれをスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認してください。調整項目: `auth.cooldowns.billingBackoffHours*`。

    レート制限 cooldown は model ごとの場合があります。ある model に対して cooldown 中の profile でも、
    同じ provider の兄弟 model では利用可能な場合があります。一方、課金/disabled 状態は引き続き profile 全体をブロックします。

    CLI で **agent ごとの** 順序オーバーライド（その agent の `auth-state.json` に保存）も設定できます:

    ```bash
    # 設定済みデフォルト agent が対象（--agent を省略）
    openclaw models auth order get --provider anthropic

    # rotation を単一 profile に固定（これだけ試す）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定（provider 内フォールバック）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # オーバーライドをクリア（config auth.order / round-robin に戻る）
    openclaw models auth order clear --provider anthropic
    ```

    特定の agent を対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるか確認するには、次を使ってください:

    ```bash
    openclaw models status --probe
    ```

    保存済み profile が明示順序から外れている場合、probe は
    その profile を黙って試す代わりに `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API key の違いは何ですか？">
    OpenClaw は両方をサポートしています:

    - **OAuth** は、該当する場合、サブスクリプションアクセスを活用することが多いです。
    - **API keys** は、トークン従量課金を使います。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、API keys を明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## Gateway: ポート、「already running」、remote mode

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、hooks など）用の単一多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='なぜ openclaw gateway status で "Runtime: running" なのに "Connectivity probe: failed" なのですか？'>
    それは「running」が **supervisor** の見方（launchd/systemd/schtasks）だからです。connectivity probe は CLI が実際に gateway WebSocket へ接続している結果です。

    `openclaw gateway status` を使い、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使った URL）
    - `Listening:`（そのポートで実際に bind されているもの）
    - `Last gateway error:`（プロセスは生きているのにポートが listen していないときの、よくある根本原因）

  </Accordion>

  <Accordion title='なぜ openclaw gateway status で "Config (cli)" と "Config (service)" が違うのですか？'>
    編集している config ファイルと、service が実際に動かしているものが違います（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    service に使わせたいものと同じ `--profile` / 環境でこれを実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とは何を意味しますか？'>
    OpenClaw は、起動時にすぐ WebSocket listener を bind することでランタイムロックを強制します（デフォルト `ws://127.0.0.1:18789`）。この bind が `EADDRINUSE` で失敗すると、別インスタンスがすでに listen 中であることを示す `GatewayLockError` を投げます。

    修正: もう一方のインスタンスを停止し、ポートを解放するか、`openclaw gateway --port <port>` で実行してください。

  </Accordion>

  <Accordion title="OpenClaw を remote mode（別の場所の Gateway に client が接続する）で動かすには？">
    `gateway.mode: "remote"` を設定し、remote WebSocket URL を指定します。必要なら共有シークレットの remote 認証情報も指定できます:

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

    注記:

    - `openclaw gateway` は `gateway.mode` が `local` のときのみ起動します（または override フラグを渡した場合）。
    - macOS アプリは config ファイルを監視し、これらの値が変わると live にモードを切り替えます。
    - `gateway.remote.token` / `.password` は client 側の remote 認証情報専用であり、それ自体では local gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI に "unauthorized" と出る（または再接続を繰り返す）のはどうすればいいですか？'>
    gateway の認証経路と UI の認証方法が一致していません。

    事実（コード上）:

    - Control UI は token を現在のブラウザータブセッションと選択された gateway URL に対して `sessionStorage` に保持するため、同じタブでのリフレッシュは、長期の localStorage token 永続化を復元しなくても継続動作します。
    - `AUTH_TOKEN_MISMATCH` の場合、trusted clients は、gateway が再試行ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返すと、キャッシュ済み device token で1回だけ制限付き再試行を行えます。
    - そのキャッシュ token 再試行は、現在では device token と一緒に保存されたキャッシュ済み承認 scopes を再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ scopes を継承せず、要求した scope セットを維持します。
    - この再試行経路以外では、connect auth の優先順位は、明示的な shared token/password が先、次に明示的な `deviceToken`、次に保存済み device token、最後に bootstrap token です。
    - Bootstrap token の scope チェックには role プレフィックスが付きます。組み込みの bootstrap operator 許可リストは operator リクエストのみを満たし、node やその他の non-operator role では引き続き自分の role プレフィックス配下の scopes が必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示 + コピーし、開こうとします。headless なら SSH ヒントを表示）。
    - まだ token がない場合: `openclaw doctor --generate-gateway-token`。
    - remote の場合は、まずトンネル: `ssh -N -L 18789:127.0.0.1:18789 user@host` を張ってから `http://127.0.0.1:18789/` を開く。
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、Control UI 設定に一致する secret を貼り付ける。
    - Tailscale Serve mode: `gateway.auth.allowTailscale` が有効であること、そして Tailscale identity ヘッダーを迂回する生の loopback/tailnet URL ではなく Serve URL を開いていることを確認する。
    - trusted-proxy mode: 同一ホストの loopback proxy や生の gateway URL ではなく、設定済み non-loopback identity-aware proxy 経由で来ていることを確認する。
    - 1回の再試行後も不一致が続く場合は、ペアリング済み device token をローテーション/再承認する:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - その rotate 呼び出しが denied になる場合は、次の2点を確認する:
      - ペアリング済みデバイスセッションは、自分自身の device だけをローテーションできます。ただし `operator.admin` がある場合は除く
      - 明示的な `--scope` 値は、呼び出し元の現在の operator scopes を超えられません
    - まだ詰まる場合は、`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [Dashboard](/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定したのに bind できず、何も listen しません">
    `tailnet` bind は、ネットワークインターフェースから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale に接続されていない（またはインターフェースがダウンしている）場合、bind できる先がありません。

    修正:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注記: `tailnet` は明示指定です。`auto` は loopback を優先します。tailnet のみに bind したい場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateways を実行できますか？">
    通常は不要です。1つの Gateway で複数のメッセージングチャネルと agents を実行できます。複数 Gateways は、冗長性（例: rescue bot）や強い分離が必要な場合にのみ使ってください。

    はい、ただし次を分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの config）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの state）
    - `agents.defaults.workspace`（workspace 分離）
    - `gateway.port`（固有ポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使う（`~/.openclaw-<name>` を自動作成）。
    - 各 profile config で固有の `gateway.port` を設定する（または手動実行では `--port` を渡す）。
    - profile ごとの service をインストールする: `openclaw --profile <name> gateway install`。

    profiles は service 名にも接尾辞を付けます（`ai.openclaw.<profile>`、旧 `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`）。
    完全ガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 とは何ですか？'>
    Gateway は **WebSocket server** であり、最初のメッセージとして
    `connect` フレームが来ることを期待します。それ以外を受け取ると、
    **code 1008**（ポリシー違反）で接続を閉じます。

    よくある原因:

    - ブラウザーで **HTTP** URL（`http://...`）を開いた。WS client ではありません。
    - ポートまたはパスが間違っている。
    - proxy またはトンネルが auth ヘッダーを剥がしたか、Gateway でないリクエストを送った。

    クイック修正:

    1. WS URL を使う: `ws://<host>:18789`（HTTPS なら `wss://...`）。
    2. WS ポートを通常のブラウザータブで開かない。
    3. auth が有効なら、`connect` フレームに token/password を含める。

    CLI または TUI を使う場合、URL は次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコル詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## Logging とデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    安定パスは `logging.file` で設定できます。ファイルログレベルは `logging.level` で制御されます。コンソール詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    service/supervisor ログ（gateway を launchd/systemd 経由で動かしている場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。profiles では `~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway service を開始/停止/再起動するには？">
    gateway helper を使ってください:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じてしまいました。OpenClaw を再起動するには？">
    Windows には **2つの install モード** があります:

    **1) WSL2（推奨）:** Gateway は Linux 内で動作します。

    PowerShell を開き、WSL に入ってから再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    service をインストールしていない場合は、フォアグラウンドで起動します:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows 上で直接動作します。

    PowerShell を開いて次を実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動実行（service なし）の場合は次を使います:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動しているのに返信が来ません。何を確認すべきですか？">
    まず簡単な健全性確認から始めてください:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - **gateway ホスト**に model auth が読み込まれていない（`models status` を確認）。
    - channel の pairing/allowlist が返信をブロックしている（channel config + ログを確認）。
    - WebChat/Dashboard が正しい token なしで開かれている。

    remote の場合は、トンネル/Tailscale 接続が有効で、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [Remote access](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" と出ます。どうすればいいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください:

    1. Gateway は動いているか？ `openclaw gateway status`
    2. Gateway は健全か？ `openclaw status`
    3. UI に正しい token が入っているか？ `openclaw dashboard`
    4. remote の場合、トンネル/Tailscale 接続は生きているか？

    その後、ログを追ってください:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/web/dashboard), [Remote access](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram の setMyCommands が失敗します。何を確認すべきですか？">
    まずログと channel status から始めてください:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに応じて確認してください:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目数が多すぎます。OpenClaw はすでに Telegram の上限まで削減して再試行しますが、それでも一部メニュー項目を落とす必要があります。plugin/skill/custom コマンドを減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上または proxy の背後にいる場合は、外向き HTTPS が許可され、`api.telegram.org` の DNS が正しく動作していることを確認してください。

    Gateway が remote の場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [Channel troubleshooting](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に何も表示されません。何を確認すべきですか？">
    まず Gateway に到達でき、agent が実行できることを確認してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では `/status` を使うと現在の状態を確認できます。チャット
    チャネルで返信を期待している場合は、配信が有効であることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/web/tui), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するには？">
    service をインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これで **監視された service**（macOS では launchd、Linux では systemd）が停止/開始されます。
    Gateway をデーモンとしてバックグラウンド実行しているときはこれを使ってください。

    フォアグラウンド実行中なら、Ctrl-C で停止してから:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway の違い">
    - `openclaw gateway restart`: **バックグラウンド service**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで gateway を **フォアグラウンド** 実行します。

    service をインストールしているなら gateway コマンド群を使ってください。一時的なフォアグラウンド実行が必要なときに `openclaw gateway` を使います。

  </Accordion>

  <Accordion title="何か失敗したときに最速で詳細を増やす方法">
    `--verbose` を付けて Gateway を起動すると、コンソール詳細が増えます。その後、チャネル認証、model ルーティング、RPC エラーはログファイルを確認してください。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="skill が画像/PDF を生成したのに、何も送られませんでした">
    agent からの送信添付ファイルには、`MEDIA:<path-or-url>` 行を含める必要があります（単独行）。[OpenClaw assistant setup](/ja-JP/start/openclaw) と [Agent send](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    あわせて次も確認してください:

    - 対象チャネルが送信メディアをサポートしており、allowlists によってブロックされていない。
    - ファイルが provider のサイズ上限内である（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` では、ローカルパス送信は workspace、temp/media-store、および sandbox 検証済みファイルに限定されます。
    - `tools.fs.workspaceOnly=false` では、`MEDIA:` は agent がすでに読めるホストローカルファイルを送れますが、対象はメディア + 安全なドキュメント型（画像、音声、動画、PDF、Office 文書）に限られます。プレーンテキストや secret らしいファイルは引き続きブロックされます。

    [Images](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="受信 DM に OpenClaw を公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスク低減を意図しています:

    - DM 対応チャネルのデフォルト動作は **pairing**:
      - 未知の送信者には pairing code が送られ、bot はそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中リクエストは **チャネルごとに3件** に制限されます。code が届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開で開放するには、明示的なオプトイン（`dmPolicy: "open"` と allowlist `"*"`）が必要です。

    危険な DM ポリシーを見つけるには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開 bot にだけ関係する問題ですか？">
    いいえ。プロンプトインジェクションは **信頼できないコンテンツ** の問題であり、誰が bot に DM できるかだけの話ではありません。
    assistant が外部コンテンツ（web search/fetch、browser ページ、emails、
    docs、attachments、貼り付けログ）を読むなら、そのコンテンツには
    モデルを乗っ取ろうとする命令が含まれている可能性があります。これは **送信者が自分だけ** でも起こり得ます。

    最大のリスクは tools が有効な場合です。モデルがだまされて
    コンテキストを流出させたり、あなたの代わりに tools を呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用または tool 無効の「reader」agent を使う
    - tool 有効な agents では `web_search` / `web_fetch` / `browser` をオフにする
    - デコード済みファイル/ドキュメントテキストも信頼しないものとして扱う: OpenResponses
      の `input_file` とメディア添付抽出はどちらも、抽出テキストを生のファイルテキストとして渡すのではなく、
      明示的な外部コンテンツ境界マーカーで包みます
    - サンドボックス化と厳格な tool 許可リストを使う

    詳細: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="bot 専用のメール、GitHub アカウント、電話番号を持たせるべきですか？">
    はい。ほとんどの構成ではそうすべきです。bot を別アカウントや別電話番号で分離すると、
    問題が起きたときの影響範囲を小さくできます。また、
    個人アカウントに影響を与えずに認証情報をローテーションしたり、アクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要な tools とアカウントにだけアクセスを与え、
    必要なら後で広げてください。

    ドキュメント: [Security](/ja-JP/gateway/security), [Pairing](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージへの自律権を与えられますか？それは安全ですか？">
    個人メッセージに対して完全な自律性を与えることは **推奨しません**。最も安全なパターンは次のとおりです:

    - DM は **pairing mode** または厳格な allowlist のままにする。
    - 代理送信させたい場合は **別の番号またはアカウント** を使う。
    - 下書きさせて、**送信前に承認する**。

    試すなら、専用アカウントで行い、分離を維持してください。[Security](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタント用途に安い model を使えますか？">
    はい。ただし、その agent がチャット専用で、入力が信頼できる場合に限ります。小さいティアは
    命令ハイジャックを受けやすいため、tool 有効な agents や
    信頼できないコンテンツを読む場合には避けてください。どうしても小さい model を使うなら、
    tools を厳しく制限し、サンドボックス内で実行してください。[Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を送ったのに pairing code が来ませんでした">
    pairing code は、未知の送信者が bot にメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合に**のみ**送られます。`/start` だけでは code は生成されません。

    保留中リクエストを確認してください:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分の sender id を allowlist に入れるか、そのアカウントで `dmPolicy: "open"`
    を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先に勝手にメッセージしますか？pairing はどう動作しますか？">
    いいえ。WhatsApp DM のデフォルトポリシーは **pairing** です。未知の送信者には pairing code だけが送られ、そのメッセージは **処理されません**。OpenClaw は、自分が受信したチャット、または自分で明示的にトリガーした送信にのみ返信します。

    pairing の承認方法:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中リクエストの一覧:

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは **allowlist/owner** を設定して、自分自身の DM を許可するために使われます。自動送信用ではありません。個人の WhatsApp 番号で運用している場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスク中断、「止まらない」

<AccordionGroup>
  <Accordion title="内部 system メッセージがチャットに表示されないようにするには？">
    ほとんどの内部または tool メッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効なときにのみ表示されます。

    表示されているチャットで次を実行してください:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもうるさい場合は、Control UI の session 設定を確認し、verbose
    を **inherit** にしてください。また、config で `verboseDefault` が
    `on` に設定された bot profile を使っていないことも確認してください。

    ドキュメント: [Thinking and verbose](/ja-JP/tools/thinking), [Security](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするには？">
    次のいずれかを **単独メッセージとして** 送ってください（スラッシュ不要）:

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

    これらは中断トリガーです（slash commands ではありません）。

    バックグラウンドプロセス（exec tool 由来）の場合は、agent に次を実行するよう頼めます:

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands の概要は [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは、`/` で始まる **単独メッセージ** として送る必要がありますが、一部のショートカット（`/status` など）は allowlist 済み送信者ならインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord にメッセージを送るには？（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで **cross-provider** メッセージングをブロックします。tool 呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord へは送信しません。

    agent に対して cross-provider メッセージングを有効にしてください:

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

    config 編集後に gateway を再起動してください。

  </Accordion>

  <Accordion title='bot が高速連投メッセージを「無視している」ように感じるのはなぜですか？'>
    queue mode は、新しいメッセージが進行中 run とどう相互作用するかを制御します。`/queue` でモードを変更してください:

    - `steer` - 新しいメッセージが現在のタスクをリダイレクト
    - `followup` - メッセージを1つずつ実行
    - `collect` - メッセージをまとめて1回返信（デフォルト）
    - `steer-backlog` - 今すぐ steer し、その後 backlog を処理
    - `interrupt` - 現在の run を中断して新しく開始

    followup モードでは `debounce:2s cap:25 drop:summarize` のようなオプションも追加できます。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='Anthropic で API key を使う場合のデフォルト model は何ですか？'>
    OpenClaw では、認証情報と model 選択は別です。`ANTHROPIC_API_KEY` を設定しても（または Anthropic API key を auth profiles に保存しても）認証が有効になるだけで、実際のデフォルト model は `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合は、Gateway が実行中の agent に期待される `auth-profiles.json` で Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ詰まっていますか？ [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。
