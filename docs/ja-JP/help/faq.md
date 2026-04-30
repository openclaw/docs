---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - より深いデバッグに入る前にユーザーから報告された問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-30T05:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

クイック回答に加えて、実運用のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）向けのより深いトラブルシューティング。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル概要: OS + 更新、gateway/service 到達性、agents/sessions、provider config + runtime issues（gateway に到達可能な場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは伏せ字）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor runtime と RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い config を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャンネルプローブを含め、live gateway health probe を実行します
   （到達可能な gateway が必要）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追尾**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   config/state を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + config path を表示
   ```

   実行中の gateway に完全なスナップショットを要求します（WS のみ）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回 Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期障害）は
[初回 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw は、自分のデバイス上で動かす個人用 AI アシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネル Plugin）で返信でき、対応プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは **ローカルファーストのコントロールプレーン**であり、ホスト型 SaaS にワークフローの制御を渡すことなく、すでに使っているチャットアプリから到達可能な高性能アシスタントを **自分のハードウェア** 上で実行し、ステートフルなセッション、メモリ、ツールを利用できます。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、workspace + session history をローカルに保持します。
    - **Web サンドボックスではなく実チャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、対応プラットフォームでモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティングとフェイルオーバー付きで使用できます。
    - **ローカル専用オプション:** ローカルモデルを実行すれば、望む場合は **すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとにエージェントを分け、それぞれ独自の workspace とデフォルトを持たせられます。
    - **オープンソースで改造しやすい:** ベンダーロックインなしで調査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[Channels](/ja-JP/channels)、[Multi-agent](/ja-JP/concepts/multi-agent)、
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    最初に取り組むとよいプロジェクト:

    - Web サイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリをプロトタイプする（概要、画面、API 計画）。
    - ファイルとフォルダを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも処理できますが、フェーズに分割し、
    並列作業に sub agents を使うと最もうまく機能します。

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    日常的な効果は、たいてい次のような形になります。

    - **個人向けブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **調査と下書き:** メールやドキュメント向けの簡単な調査、要約、初稿。
    - **リマインダーとフォローアップ:** Cron や Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザ自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携:** スマートフォンからタスクを送信し、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **リサーチ、選定、下書き作成**には役立ちます。サイトをスキャンし、候補リストを作成し、
    見込み客を要約し、アウトリーチや広告コピーの下書きを書けます。

    **アウトリーチや広告配信**では、人間が確認する流れにしてください。スパムを避け、現地の法律と
    プラットフォームポリシーに従い、送信前に必ずレビューしてください。最も安全なパターンは、
    OpenClaw に下書きを作らせ、あなたが承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **パーソナルアシスタント**かつ調整レイヤーであり、IDE の代替ではありません。リポジトリ内で最速の直接的なコーディングループを回すには
    Claude Code または Codex を使ってください。永続的なメモリ、デバイスをまたいだアクセス、
    ツールのオーケストレーションが必要なときに OpenClaw を使ってください。

    利点:

    - セッションをまたぐ **永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス** (WhatsApp, Telegram, TUI, WebChat)
    - **ツールのオーケストレーション** (ブラウザ、ファイル、スケジューリング、フック)
    - **常時稼働の Gateway** (VPS 上で実行し、どこからでも操作)
    - ローカルのブラウザ/画面/カメラ/実行用の **Node**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを dirty にせずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理対象のオーバーライドを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます (または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダを追加します)。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み → `skills.load.extraDirs` なので、管理対象のオーバーライドは git に触れずにバンドル済み Skills より優先されます。Skill をグローバルにインストールする必要があるが、一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で表示範囲を制御してください。上流に取り込む価値のある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを追加してください (最も低い優先順位)。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次回セッションでそれを `<workspace>/skills` として扱います。Skill を特定のエージェントだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: タスクを、異なるデフォルトモデルを持つ別々のエージェントにルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうやってオフロードできますか？">
    長時間または並列のタスクには **サブエージェント**を使ってください。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    ボットに「このタスク用のサブエージェントを生成して」と依頼するか、`/subagents` を使ってください。
    チャットで `/status` を使うと、Gateway が現在何をしているか (およびビジーかどうか) を確認できます。

    トークンのヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定してください。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord ではスレッドに紐づくサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットにバインドすると、そのスレッド内のフォローアップメッセージはバインド先のセッションに留まります。

    基本フロー:

    - `thread: true` を指定して `sessions_spawn` で生成します (永続的なフォローアップには任意で `mode: "session"` も指定します)。
    - または `/focus <target>` で手動バインドします。
    - `/agents` を使ってバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` を使って自動フォーカス解除を制御します。
    - `/unfocus` を使ってスレッドを切り離します。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了更新が違う場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決済みのリクエスター経路を確認してください。

    - 完了モードのサブエージェント配信は、バインド済みスレッドまたは会話経路が存在する場合、それを優先します。
    - 完了元がチャンネルのみを持つ場合、OpenClaw はリクエスターセッションに保存された経路 (`lastChannel` / `lastTo` / `lastAccountId`) にフォールバックするため、直接配信が引き続き成功できます。
    - バインド済み経路も使用可能な保存済み経路も存在しない場合、直接配信は失敗する可能性があり、結果はチャットへ即時投稿される代わりに、キュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューへのフォールバックや最終配信の失敗が発生することがあります。
    - 子の最後の表示可能なアシスタント返信が正確にサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い以前の進捗を投稿する代わりに、意図的にアナウンスを抑制します。
    - 子がツール呼び出しだけの後にタイムアウトした場合、アナウンスは生のツール出力を再生する代わりに、それを短い部分的な進捗要約へ畳み込むことがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効 (`cron.enabled`) で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24 時間 365 日稼働していることを確認します (スリープ/再起動なし)。
    - ジョブのタイムゾーン設定を確認します (`--tz` とホストのタイムゾーン)。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron が発火しましたが、チャンネルに何も送信されませんでした。なぜですか?">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、runner のフォールバック送信が期待されないことを意味します。
    - announce ターゲット (`channel` / `to`) がない、または無効な場合、runner は外部配信をスキップしています。
    - チャンネル認証失敗 (`unauthorized`, `Forbidden`) は、runner が配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな分離結果 (`NO_REPLY` / `no_reply` のみ) は、意図的に配信不可として扱われるため、runner はキュー済みのフォールバック配信も抑制します。

    分離 cron ジョブでは、チャットルートが利用可能な場合、エージェントは `message`
    ツールで引き続き直接送信できます。`--announce` は、エージェントがまだ送信していない
    最終テキストに対する runner のフォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 cron 実行がモデルを切り替えたり、1 回リトライしたりしたのはなぜですか?">
    それは通常、重複スケジュールではなく、ライブモデル切り替え経路です。

    分離 cron は、アクティブな実行が `LiveSessionModelSwitchError` を投げたときに、
    ランタイムのモデル引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    provider/model が維持され、切り替えに新しい認証プロファイル上書きが含まれていた場合は、
    cron はリトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデル上書きが最初に優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの cron セッションモデル上書き。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の切り替えリトライ後、
    cron は永久にループするのではなく中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか?">
    ネイティブの `openclaw skills` コマンドを使うか、Skills をワークスペースに配置します。macOS の Skills UI は Linux では利用できません。
    Skills は [https://clawhub.ai](https://clawhub.ai) で参照できます。

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
    ディレクトリに書き込みます。別個の `clawhub` CLI は、自分の skills を公開または
    同期したい場合にのみインストールしてください。エージェント間で共有インストールする場合は、
    skill を `~/.openclaw/skills` の下に置き、どのエージェントから見えるかを絞りたい場合は
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに沿って、またはバックグラウンドで継続的にタスクを実行できますか?">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ**: スケジュール済みまたは繰り返しタスク用 (再起動後も永続化)。
    - **Heartbeat**: 「メインセッション」の定期チェック用。
    - **分離ジョブ**: 要約を投稿したりチャットに配信したりする自律エージェント用。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化とタスク](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか?">
    直接はできません。macOS skills は `metadata.openclaw.os` と必要なバイナリによって制御され、Skills は **Gateway ホスト** で適格な場合にのみシステムプロンプトに表示されます。Linux では、`darwin` 専用 skills (`apple-notes`, `apple-reminders`, `things-mac` など) は、ゲート制御を上書きしない限り読み込まれません。

    サポートされるパターンは 3 つあります。

    **オプション A - Gateway を Mac で実行する (最も簡単)。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から [リモートモード](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使う (SSH なし)。**
    Linux で Gateway を実行し、macOS Node (メニューバーアプリ) をペアリングして、Mac 側の **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 skills を適格として扱えます。エージェントは `nodes` ツール経由でそれらの skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが allowlist に追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする (上級)。**
    Gateway は Linux に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーに解決されるようにします。そのうえで、skill を上書きして Linux を許可し、適格な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します (例: Apple Notes 用の `memo`)。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホストの `PATH` にラッパーを置きます (例: `~/bin/memo`)。
    3. skill メタデータ (ワークスペースまたは `~/.openclaw/skills`) を上書きして Linux を許可します。

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットを更新するために新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion や HeyGen 連携はありますか?">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム skill / plugin:** 信頼性の高い API アクセスに最適です (Notion/HeyGen はどちらも API があります)。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを維持したい場合 (代理店ワークフロー)、単純なパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ (コンテキスト + 設定 + 進行中の作業)。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを作成するか、それらの API を対象にした skill を
    構築してください。

    Skills をインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で shared skills を使う場合は、`~/.openclaw/skills/<name>/SKILL.md` に置きます。一部のエージェントだけが共有インストールを見られるようにする場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の skills は Homebrew 経由でインストールされたバイナリを想定します。Linux では Linuxbrew を意味します (上記の Homebrew Linux FAQ 項目を参照)。[Skills](/ja-JP/tools/skills), [Skills 設定](/ja-JP/tools/skills-config), [ClawHub](/ja-JP/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか?">
    Chrome DevTools MCP 経由でアタッチする組み込みの `user` ブラウザープロファイルを使用します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名が必要な場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザーまたは接続されたブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーのマシンで Node ホストを実行するか、代わりにリモート CDP を使用します。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロード傍受、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか?">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ (Docker 内の完全な Gateway またはサンドボックスイメージ) については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker が制限されているように感じます。全機能を有効にするにはどうすればよいですか?">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドル済みブラウザーは含まれません。より完全なセットアップにするには:

    - キャッシュが残るように `OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに組み込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします。
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker), [ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人的に保ち、グループは公開/サンドボックス化できますか?">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション (non-main キー) は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人的な DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか?">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定します (例: `"/home/user/src:/src:ro"`)。グローバルとエージェントごとの binds はマージされます。`scope: "shared"` の場合、エージェントごとの binds は無視されます。機密性の高いものには `:ro` を使用し、binds はサンドボックスのファイルシステム境界を迂回することを覚えておいてください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正準パスの両方に対して bind ソースを検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は安全側で失敗し、シンボリックリンク解決後も許可ルートチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか?">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の厳選された長期ノート (メイン/プライベートセッションのみ)

    OpenClaw は、auto-compaction の前に永続的なノートを書き込むようモデルに促すため、
    **サイレントな pre-compaction memory flush** も実行します。これはワークスペースが
    書き込み可能な場合にのみ実行されます (読み取り専用サンドボックスではスキップされます)。[メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか?">
    ボットに **その事実をメモリに書き込む** よう依頼します。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。メモリを保存するようモデルに促すと役立ちます。
    モデルは何をすればよいか理解します。それでも忘れ続ける場合は、Gateway がすべての実行で同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory), [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか? 制限は何ですか?">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、
    ストレージです。**セッションコンテキスト** は引き続きモデルのコンテキストウィンドウによって
    制限されるため、長い会話は compact または truncate されることがあります。そのため
    メモリ検索が存在します。関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory), [コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuth はチャット/補完を対象とし、
    embeddings へのアクセスは付与しないため、**Codex でサインインしても（OAuth または
    Codex CLI ログイン）**セマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）
    が必要です。

    provider を明示的に設定していない場合、OpenClaw は API キーを解決できるときに
    provider を自動選択します（auth profiles、`models.providers.*.apiKey`、または env vars）。
    OpenAI キーが解決できる場合は OpenAI を優先し、そうでなければ Gemini キーが
    解決できる場合は Gemini、次に Voyage、次に Mistral を選びます。リモートキーが
    利用できない場合、設定するまでメモリ検索は無効のままです。ローカルモデルパスが
    設定済みで存在する場合、OpenClaw は `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"` を設定します
    （必要に応じて `memorySearch.fallback = "none"` も設定）。Gemini embeddings を
    使いたい場合は、`memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`
    （または `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の embedding
    モデルをサポートしています。セットアップの詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置

<AccordionGroup>
  <Accordion title="OpenClaw で使うすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスは送信された内容を引き続き確認できます**。

    - **デフォルトではローカル:** セッション、メモリファイル、config、workspace は Gateway ホスト
      （`~/.openclaw` + workspace ディレクトリ）にあります。
    - **必要上リモート:** model provider（Anthropic/OpenAI など）に送信するメッセージは
      それぞれの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）は
      メッセージデータをそれぞれのサーバーに保存します。
    - **フットプリントは制御可能:** ローカルモデルを使うとプロンプトは自分のマシン上に保たれますが、
      channel トラフィックは引き続き channel のサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン config（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に auth profiles へコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys、任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers 用の任意のファイルバック secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` entries はスクラブ済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + sessions）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **workspace**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**agent workspace** に置きます。

    - **Workspace（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **State dir（`~/.openclaw`）**: config、channel/provider state、auth profiles、sessions、logs、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルト workspace は `~/.openclaw/workspace` で、以下により設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後に bot が「忘れる」場合は、Gateway が毎回同じ
    workspace を使って起動していることを確認してください（また、リモートモードでは自分のローカル laptop ではなく
    **gateway host の** workspace が使われる点に注意してください）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、bot に
    **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace** を **private** git repo に置き、どこか private な場所
    （たとえば GitHub private）へバックアップします。これにより memory + AGENTS/SOUL/USER
    ファイルを捕捉でき、後でアシスタントの「mind」を復元できます。

    `~/.openclaw` 配下のもの（credentials、sessions、tokens、暗号化された secrets payloads）は
    **コミットしないでください**。
    完全復元が必要な場合は、workspace と state directory の両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントは workspace の外で作業できますか？">
    はい。workspace は**デフォルト cwd** とメモリの基準点であり、厳格な sandbox ではありません。
    相対パスは workspace 内で解決されますが、sandboxing が有効でない限り、絶対パスで他の
    host locations にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとの sandbox settings を使ってください。repo をデフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` を repo root に向けます。OpenClaw repo は単なる source code です。
    エージェントにその中で作業させたい意図がない限り、workspace は分けてください。

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

  <Accordion title="リモートモード: session store はどこにありますか？">
    Session state は **gateway host** が所有します。リモートモードの場合、重要な session store は自分のローカル laptop ではなくリモートマシン上にあります。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## Config の基本

<AccordionGroup>
  <Accordion title="config の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** config を読み取ります。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` のデフォルト workspace を含む）を使います。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら、何も listen しない / UI が unauthorized と表示する'>
    非 loopback bind には**有効な gateway auth path が必要です**。実際には次を意味します。

    - shared-secret auth: token または password
    - 正しく設定された identity-aware reverse proxy の背後にある `gateway.auth.mode: "trusted-proxy"`

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

    注:

    - `gateway.remote.token` / `.password` は、それだけでは local gateway auth を有効にしません。
    - Local call paths は、`gateway.auth.*` が未設定の場合のみ `gateway.remote.*` を fallback として使用できます。
    - password auth では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、resolution は fail closed になります（remote fallback による masking はありません）。
    - Shared-secret Control UI setups は `connect.params.auth.token` または `connect.params.auth.password`（app/UI settings に保存）で認証します。Tailscale Serve や `trusted-proxy` のような identity-bearing modes は、代わりに request headers を使います。共有 secrets を URLs に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、same-host loopback reverse proxies に明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback entry が必要です。

  </Accordion>

  <Accordion title="なぜ localhost でも token が必要になったのですか？">
    OpenClaw は loopback を含め、デフォルトで gateway auth を強制します。通常のデフォルトパスでは、これは token auth を意味します。明示的な auth path が設定されていない場合、gateway startup は token mode に解決され、token を自動生成して `gateway.auth.token` に保存するため、**local WS clients は認証が必要です**。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の auth path を好む場合は、password mode（または identity-aware reverse proxies の場合は `trusted-proxy`）を明示的に選べます。**本当に** open loopback にしたい場合は、config で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="config 変更後に再起動する必要がありますか？">
    Gateway は config を監視し、hot-reload をサポートします。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply し、重要な変更では再起動します
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="面白い CLI tagline を無効にするには？">
    config で `cli.banner.taglineMode` を設定します。

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: tagline text を非表示にしますが、banner title/version line は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節ごとの tagline をローテーションします（デフォルト動作）。
    - banner 自体を完全に消したい場合は、env `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="web search（および web fetch）を有効にするには？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    provider に依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API-backed providers では、通常の API key setup が必要です。
    - Ollama Web Search は key-free ですが、設定済みの Ollama host を使い、`ollama signin` が必要です。
    - DuckDuckGo は key-free ですが、非公式の HTML-based integration です。
    - SearXNG は key-free/self-hosted です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行して provider を選びます。
    環境変数の代替:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` または `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY`
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

    プロバイダー固有の Web 検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` の下にあります。
    互換性のため、従来の `tools.web.search.*` プロバイダーパスも一時的に読み込まれますが、新しい設定では使用しないでください。
    Firecrawl の Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    注記:

    - 許可リストを使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化しない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、最初に準備済みの取得フォールバックプロバイダーを自動検出します。現在、バンドルされているプロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消去しました。復旧して回避するにはどうすればよいですか？">
    `config.apply` は **設定全体**を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw 所有の設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway は最後に正常だった設定を復元し、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。
    - メインエージェントは復旧後に起動警告を受け取るため、不正な設定を盲目的に再書き込みしません。

    復旧:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`、`Config write rejected:`、または `config reload restored last-known-good config` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - 復元されたアクティブな設定が機能する場合はそれを保持し、意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - `openclaw config validate` と `openclaw doctor` を実行します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - これが予期しない挙動だった場合は、バグを報告し、最後に確認できている設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構成できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。これは浅いスキーマノードに加えて、掘り下げ用の直下の子要素サマリーを返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換え専用にしてください。
    - エージェント実行からオーナー専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security` への書き込み（同じ保護対象の exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）は拒否されます。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいで専門ワーカーを使う中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **ノード**と**エージェント**を組み合わせる構成です。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Macs/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner 運用」、「個人データ」）向けの別々の頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要なときに、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [ノード](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザーはヘッドレスで実行できますか？">
    はい。設定オプションです。

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

    デフォルトは `false`（ヘッドフル）です。ヘッドレスは、一部のサイトでボット対策チェックを誘発しやすくなります。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトは、ヘッドレスモードでの自動化に対してより厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="Telegram、Gateway、ノード間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、
    ノードツールが必要な場合にのみ、**Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → エージェント → `node.*` → ノード → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しのみを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントはどうやって私のコンピューターにアクセスできますか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働するホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して、
       Node として登録できるようにします。
    5. Gateway で Node を承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。Node は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS Node をペアリングすると、そのマシンで `system.run` が許可されます。信頼できるデバイスのみを
    ペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Gateway protocol](/ja-JP/gateway/protocol)、[macOS remote mode](/ja-JP/platforms/mac/remote)、[Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続済みなのに返信がありません。どうすればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway の正常性: `openclaw status`
    - チャンネルの正常性: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動していて、正しいポートを指していることを確認します。
    - 許可リスト（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[Remote access](/ja-JP/gateway/remote)、[Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス（ローカル + VPS）は互いに通信できますか？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送信し、その後 Bot B が通常どおり返信するようにします。

    **CLI ブリッジ（汎用）:** 他方のボットが待ち受けるチャットを対象に、
    `openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行します。
    片方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます
    （[Remote access](/ja-JP/gateway/remote) を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないようにガードレールを追加してください（メンション時のみ、チャンネルの
    許可リスト、または「ボットのメッセージには返信しない」ルールなど）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストできます。それぞれに専用のワークスペース、モデルのデフォルト、
    ルーティングを持たせられます。これが通常の構成であり、エージェントごとに 1 台の VPS を実行するよりも
    はるかに安価で簡単です。

    強い分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合にのみ、別々の VPS を使用してください。
    それ以外の場合は 1 つの Gateway のままにし、複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人用ラップトップ上の Node を使う利点はありますか？">
    はい。Node はリモート Gateway からラップトップに到達するための第一級の方法であり、
    シェルアクセス以上の機能を利用できます。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスのボックスで十分です。4 GB RAM で十分です）。そのため、一般的な
    構成は、常時稼働するホストと、Node としてのラップトップの組み合わせです。

    - **受信 SSH は不要です。** Node は Gateway WebSocket にアウトバウンド接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上の Node 許可リスト/承認によって制御されます。
    - **より多くのデバイスツール。** Node は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS に置いたまま、ラップトップ上の Node ホストを通じて Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH は一時的なシェルアクセスには問題ありませんが、継続的なエージェントワークフローと
    デバイス自動化には Node の方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Node は Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き、ホストごとに **1 つの gateway** のみを実行してください（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）。Node は gateway に接続する周辺機器です
    （iOS/Android Node、またはメニューバーアプリの macOS 「node mode」）。ヘッドレス Node
    ホストと CLI 制御については、[Node host CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子の概要とともに確認します
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 設定全体を検証して置き換えます。可能な場合はホットリロードし、必要な場合は再起動します
    - owner-only の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。レガシーの `tools.bash.*` エイリアスは、同じ保護された exec パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限の妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これはワークスペースを設定し、誰がボットを起動できるかを制限します。

  </Accordion>

  <Accordion title="VPS で Tailscale を設定し、Mac から接続するにはどうすればよいですか？">
    最小限の手順:

    1. **VPS にインストールしてログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効化（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS が安定した名前を持つようにします。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使います:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより、gateway は loopback にバインドされたままになり、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **Remote モードで macOS アプリを使います**（SSH ターゲットには tailnet ホスト名を使えます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. gateway で**ノードを承認**します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノート PC にインストールすべきですか、それともノードを追加するだけでよいですか？">
    2台目のノート PC で **local tools**（screen/camera/exec）だけが必要な場合は、
    **ノード**として追加します。これにより単一の Gateway を維持し、設定の重複を避けられます。ローカルノードツールは
    現在 macOS のみ対応ですが、他の OS にも拡張する予定です。

    **強い分離**または完全に別個のボットが2つ必要な場合にのみ、2つ目の Gateway をインストールしてください。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに以下を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）にあるグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。

    設定内でインライン環境変数を定義することもできます（プロセス環境に存在しない場合にのみ適用されます）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位とソースについては [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    よくある修正は2つあります:

    1. サービスが shell 環境を継承しない場合でも拾われるように、不足しているキーを `~/.openclaw/.env` に入れます。
    2. shell インポートを有効にします（オプトインの利便機能）:

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

    これはログイン shell を実行し、不足している想定キーのみをインポートします（上書きはしません）。同等の環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off"
    は環境変数が不足しているという意味では**ありません**。単に OpenClaw が
    ログイン shell を自動的に読み込まないという意味です。

    Gateway がサービス（launchd/systemd）として実行されている場合、shell
    環境は継承されません。次のいずれかで修正します:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell インポートを有効にします（`env.shellEnv.enabled: true`）。
    3. または設定の `env` ブロックに追加します（不足している場合にのみ適用）。

    その後、gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    単独のメッセージとして `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルトは **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効な場合、アイドル期間後の**次の**
    メッセージによって、そのチャットキーの新しいセッション ID が開始されます。
    これによってトランスクリプトは削除されず、新しいセッションが開始されるだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1人の CEO と多数のエージェント）を作る方法はありますか？">
    はい、**マルチエージェントルーティング**と**サブエージェント**で実現できます。1つのコーディネーター
    エージェントと、それぞれ独自のワークスペースとモデルを持つ複数のワーカーエージェントを作成できます。

    とはいえ、これは**楽しい実験**として見るのが最適です。トークン消費が大きく、別々のセッションで1つのボットを使うより
    効率が悪いことがよくあります。私たちが想定する典型的なモデルは、1つのボットと会話し、並行作業には異なるセッションを使う形です。その
    ボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルにより、Compaction や切り詰めが発生することがあります。

    役立つこと:

    - ボットに現在の状態を要約してファイルに書き込むよう依頼します。
    - 長いタスクの前に `/compact` を使い、話題を切り替えるときは `/new` を使います。
    - 重要なコンテキストはワークスペースに保持し、ボットに読み戻すよう依頼します。
    - 長時間または並行の作業にはサブエージェントを使い、メインのチャットを小さく保ちます。
    - これが頻繁に起きる場合は、より大きなコンテキストウィンドウを持つモデルを選びます。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    reset コマンドを使います:

    ```bash
    openclaw reset
    ```

    非対話型の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - 既存の設定が見つかった場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir をリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発用設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ます。リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使います:

    - **Compact**（会話を維持しつつ古いターンを要約します）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約の方針を指定します。

    - **Reset**（同じチャットキーに対する新しいセッション ID）:

      ```
      /new
      /reset
      ```

    これが続く場合:

    - 古いツール出力を削るため、**session pruning**（`agents.defaults.contextPruning`）を有効化または調整します。
    - より大きなコンテキストウィンドウを持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これは provider のバリデーションエラーです。モデルが必須の `input` を持たない `tool_use` ブロックを出力しました。
    通常は、セッション履歴が古いか破損していることを意味します（長いスレッドや
    ツール/スキーマ変更の後によく起きます）。

    修正: `/new`（単独メッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが来るのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごと（OAuth 認証を使う場合は **1h**）に実行されます。調整または無効化できます:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在するが実質的に空（空行と `# Heading` のような markdown
    見出しのみ）の場合、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップします。
    ファイルがない場合でも heartbeat は実行され、モデルが何をするかを判断します。

    エージェントごとの上書きには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「bot account」を追加する必要がありますか？'>
    いいえ。OpenClaw は**あなた自身のアカウント**で動作するため、あなたがグループにいれば OpenClaw はそれを確認できます。
    デフォルトでは、送信者を許可するまで（`groupPolicy: "allowlist"`）グループ返信はブロックされます。

    **あなた**だけがグループ返信を起動できるようにしたい場合:

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
    オプション 1（最速）: ログを tail し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに設定済み/allowlist 済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は2つあります:

    - メンションゲートが有効です（デフォルト）。ボットを @mention する（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist に入っていません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションに集約されます。グループ/チャンネルには独自のセッションキーがあり、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="いくつのワークスペースとエージェントを作成できますか？">
    厳密な上限はありません。数十（さらには数百）でも問題ありませんが、次に注意してください:

    - **ディスク増加:** セッション + トランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** エージェントが多いほど、同時モデル使用量が増えます。
    - **運用上の手間:** エージェントごとの auth profile、ワークスペース、チャンネルルーティング。

    ヒント:

    - エージェントごとに1つの**アクティブな**ワークスペースを保ちます（`agents.defaults.workspace`）。
    - ディスクが増える場合は、古いセッションを prune します（JSONL または store entries を削除）。
    - 迷子のワークスペースやプロファイル不一致を見つけるには `openclaw doctor` を使います。

  </Accordion>

  <Accordion title="複数のボットまたはチャットを同時に実行できますか (Slack)。どのように設定すればよいですか?">
    はい。**マルチエージェントルーティング**を使用して、複数の分離されたエージェントを実行し、受信メッセージを
    チャンネル/アカウント/ピア別にルーティングします。Slack はチャンネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使用するか、
    実際にブラウザーを実行しているマシンで CDP を使用します。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト (VPS/Mac mini)。
    - 役割ごとに 1 つのエージェント (バインディング)。
    - それらのエージェントにバインドされた Slack チャンネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [ブラウザー](/ja-JP/tools/browser), [ノード](/ja-JP/nodes).

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は [モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか?">
    `gateway.port` は WebSocket + HTTP (Control UI、フックなど) の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" なのに "Connectivity probe: failed" と表示するのはなぜですか?'>
    「running」は**スーパーバイザー**側の見え方 (launchd/systemd/schtasks) だからです。接続プローブは、CLI が実際に gateway WebSocket に接続しています。

    `openclaw gateway status` を使用し、次の行を信頼してください:

    - `Probe target:` (プローブが実際に使用した URL)
    - `Listening:` (ポートに実際にバインドされているもの)
    - `Last gateway error:` (プロセスは生きているがポートでリッスンしていない場合の一般的な根本原因)

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか?'>
    サービスが別の設定ファイルで実行されている一方で、別の設定ファイルを編集しています (多くの場合 `--profile` / `OPENCLAW_STATE_DIR` の不一致)。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使用させたい同じ `--profile` / 環境からこれを実行します。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" は何を意味しますか?'>
    OpenClaw は起動直後に WebSocket リスナーをバインドすることでランタイムロックを強制します (デフォルト `ws://127.0.0.1:18789`)。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでにリッスンしていることを示す `GatewayLockError` をスローします。

    修正: 他のインスタンスを停止し、ポートを解放するか、`openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード (クライアントが別の場所の Gateway に接続) で実行するにはどうすればよいですか?">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート資格情報を使って、リモート WebSocket URL を指定します:

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

    - `openclaw gateway` は `gateway.mode` が `local` の場合にのみ起動します (または上書きフラグを渡した場合)。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート資格情報のみです。それ自体でローカル gateway 認証を有効にするものではありません。

  </Accordion>

  <Accordion title='Control UI が "unauthorized" と表示します (または再接続を繰り返します)。次に何をすればよいですか?'>
    gateway の認証パスと UI の認証方式が一致していません。

    事実 (コードから):

    - Control UI は現在のブラウザータブセッションと選択した gateway URL について `sessionStorage` にトークンを保持するため、同じタブでの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、gateway が再試行ヒント (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) を返した場合、信頼済みクライアントはキャッシュ済みデバイストークンで 1 回の制限付き再試行を試みることができます。
    - そのキャッシュトークン再試行は、デバイストークンとともに保存されたキャッシュ済み承認スコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承する代わりに、引き続き要求したスコープセットを保持します。
    - その再試行パスの外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップオペレーター許可リストはオペレーター要求のみを満たします。ノードやその他の非オペレーターロールには、引き続き自身のロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard` (ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します)。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、先にトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であること、また Tailscale ID ヘッダーをバイパスする生のループバック/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の gateway URL ではなく、設定済みの ID 認識プロキシ経由でアクセスしていることを確認します。同一ホストのループバックプロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の 2 点を確認します:
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自分自身の**デバイスのみをローテーションできます
      - 明示的な `--scope` 値は呼び出し元の現在のオペレータースコープを超えることはできません
    - まだ解決しませんか? `openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、バインドできず何もリッスンしません">
    `tailnet` バインドはネットワークインターフェイスから Tailscale IP を選択します (100.64.0.0/10)。マシンが Tailscale 上にない場合 (またはインターフェイスがダウンしている場合)、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動します (100.x アドレスを持つようにする)、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet のみにバインドしたい場合は `gateway.bind: "tailnet"` を使用してください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか?">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長性 (例: 救援ボット) または厳密な分離が必要な場合にのみ使用してください。

    可能ですが、分離する必要があります:

    - `OPENCLAW_CONFIG_PATH` (インスタンスごとの設定)
    - `OPENCLAW_STATE_DIR` (インスタンスごとの状態)
    - `agents.defaults.workspace` (ワークスペースの分離)
    - `gateway.port` (一意のポート)

    クイック設定 (推奨):

    - インスタンスごとに `openclaw --profile <name> ...` を使用します (`~/.openclaw-<name>` を自動作成します)。
    - 各プロファイル設定で一意の `gateway.port` を設定します (または手動実行では `--port` を渡します)。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にも接尾辞を付けます (`ai.openclaw.<profile>`、従来の `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)。
    完全なガイド: [複数 Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 は何を意味しますか?'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信すると、**コード 1008**
    (ポリシー違反) で接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL (`http://...`) を開いた。
    - 間違ったポートまたはパスを使用した。
    - プロキシまたはトンネルが認証ヘッダーを削除したか、非 Gateway リクエストを送信した。

    クイック修正:

    1. WS URL を使用します: `ws://<host>:18789` (HTTPS の場合は `wss://...`)。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証が有効な場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使用している場合、URL は次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか?">
    ファイルログ (構造化):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で安定したパスを設定できます。ファイルログレベルは `logging.level` で制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追尾:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ (gateway が launchd/systemd 経由で実行されている場合):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log` (デフォルト: `~/.openclaw/logs/...`; プロファイルは `~/.openclaw-<profile>/logs/...` を使用)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか?">
    gateway ヘルパーを使用します:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じてしまいました。OpenClaw を再起動するにはどうすればよいですか?">
    **2 つの Windows インストールモード**があります:

    **1) WSL2 (推奨):** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入り、再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスをインストールしていない場合は、フォアグラウンドで起動します:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows (非推奨):** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行している場合 (サービスなし) は、次を使用します:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信がまったく届きません。何を確認すべきですか?">
    まず簡単なヘルス確認から始めます:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - **gateway ホスト**でモデル認証がロードされていない (`models status` を確認)。
    - チャンネルのペアリング/許可リストが返信をブロックしている (チャンネル設定 + ログを確認)。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が稼働しており、
    Gateway WebSocket に到達可能であることを確認します。

    ドキュメント: [チャンネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 次に何をすればよいですか?'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください:

    1. Gatewayは実行中ですか？ `openclaw gateway status`
    2. Gatewayは正常ですか？ `openclaw status`
    3. UIに正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscaleリンクは有効ですか？

    次にログを追跡します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [ダッシュボード](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommandsが失敗します。何を確認すべきですか？">
    ログとチャンネルの状態から始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegramメニューの項目が多すぎます。OpenClawはすでにTelegramの制限に合わせて切り詰め、コマンド数を減らして再試行しますが、それでも一部のメニュー項目を削除する必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, または類似のネットワークエラー: VPS上またはプロキシの背後にいる場合は、送信HTTPSが許可され、`api.telegram.org` のDNSが機能していることを確認してください。

    Gatewayがリモートの場合は、Gatewayホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUIに出力が表示されません。何を確認すべきですか？">
    まずGatewayに到達でき、エージェントを実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUIでは、`/status` を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gatewayを完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは**監視対象サービス**（macOSではlaunchd、Linuxではsystemd）を停止/起動します。
    Gatewayがデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は、Ctrl-Cで停止してから、次を実行します。

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gatewayサービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="5歳児向け説明: openclaw gateway restartとopenclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションのためにgatewayを**フォアグラウンド**で実行します。

    サービスをインストールしている場合は、gatewayコマンドを使います。一回限りの
    フォアグラウンド実行が必要な場合は、`openclaw gateway` を使います。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    より詳しいコンソール情報を得るには、`--verbose` でGatewayを起動します。その後、チャンネル認証、モデルルーティング、RPCエラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分のskillが画像/PDFを生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>` 行（単独行）が含まれている必要があります。[OpenClawアシスタントのセットアップ](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください。

    - 対象チャンネルが送信メディアに対応しており、許可リストによってブロックされていない。
    - ファイルがプロバイダーのサイズ制限内にある（画像は最大2048pxにリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読み取れるホストローカルファイルを `MEDIA:` で送信できるようにしますが、メディアと安全なドキュメントタイプ（画像、音声、動画、PDF、Officeドキュメント）のみに限られます。プレーンテキストや秘密情報のようなファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClawを受信DMに公開しても安全ですか？">
    受信DMは信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています。

    - DM対応チャンネルでのデフォルト動作は**ペアリング**です:
      - 未知の送信者にはペアリングコードが送られ、ボットはそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルごとに3件**に制限されています。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DMを公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクの高いDMポリシーを表示するには、`openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか？">
    いいえ。プロンプトインジェクションは、ボットにDMできる人だけではなく、**信頼できないコンテンツ**に関する問題です。
    アシスタントが外部コンテンツ（Web検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれることがあります。これは**送信者が自分だけ**であっても起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて
    コンテキストを外部に持ち出したり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「リーダー」エージェントを使う
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はどちらも、抽出テキストを生のファイルテキストとして渡すのではなく、
      明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リスト

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="自分のボットには専用のメール、GitHubアカウント、電話番号を持たせるべきですか？">
    ほとんどのセットアップでは、はい。ボットを別のアカウントや電話番号で分離すると、
    何か問題が起きた場合の影響範囲を減らせます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを与え、必要になったら
    後で拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです。

    - DMは**ペアリングモード**または厳格な許可リストに保つ。
    - 代理でメッセージ送信させたい場合は、**別の番号またはアカウント**を使う。
    - 下書きさせてから、**送信前に承認**する。

    試す場合は、専用アカウントで行い、分離した状態を保ってください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で、入力が信頼できる**場合**です。小さいティアは
    指示の乗っ取りを受けやすいため、ツール有効エージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegramで/startを実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードが送られるのは、未知の送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効になっている場合**のみ**です。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者IDを許可リストに追加するか、そのアカウントの
    `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどのように機能しますか？">
    いいえ。デフォルトのWhatsApp DMポリシーは**ペアリング**です。未知の送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClawは、受信したチャットまたはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: 自分のDMを許可するための**許可リスト/所有者**を設定するために使われます。自動送信には使われません。個人のWhatsApp番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージまたはツールメッセージは、そのセッションで**verbose**、**trace**、または**reasoning**が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもノイズが多い場合は、Control UIのセッション設定を確認し、verboseを
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使っていないことも確認してください。

    ドキュメント: [思考とverbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを**単独のメッセージとして**送信します（スラッシュなし）。

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

    これらは中止トリガーです（スラッシュコマンドではありません）。

    バックグラウンドプロセス（execツールからのもの）については、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる**単独の**メッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は許可リストに入っている送信者ならインラインでも機能します。

  </Accordion>

  <Accordion title='TelegramからDiscordメッセージを送るにはどうすればよいですか？（「Cross-context messaging denied」）'>
    OpenClawはデフォルトで**クロスプロバイダー**メッセージングをブロックします。ツール呼び出しが
    Telegramにバインドされている場合、明示的に許可しない限りDiscordには送信されません。

    エージェントでクロスプロバイダーメッセージングを有効にします。

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

    設定を編集した後、gatewayを再起動します。

  </Accordion>

  <Accordion title='ボットが連続メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、新しいメッセージが実行中のrunとどのように相互作用するかを制御します。モードを変更するには `/queue` を使います。

    - `steer` - 現在のrun内の次のモデル境界まで、保留中のステアリングをすべてキューに入れます
    - `queue` - 従来の1件ずつのステアリング
    - `followup` - メッセージを1件ずつ実行します
    - `collect` - メッセージをバッチ化し、一度だけ返信します
    - `steer-backlog` - 今すぐステアリングし、その後バックログを処理します
    - `interrupt` - 現在のrunを中止して新しく開始します

    デフォルトモードは `steer` です。followupモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う場合の Anthropic のデフォルトモデルは何ですか?'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを auth profiles に保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば、`anthropic/claude-sonnet-4-6` または `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントの想定される `auth-profiles.json` で Gateway が Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか? [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、auth profiles
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状を起点にしたトリアージ
