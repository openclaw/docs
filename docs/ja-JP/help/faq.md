---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - より深いデバッグの前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-12T00:58:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

実運用のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのクイック回答と、より深いトラブルシューティングです。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/service の到達性、agents/sessions、provider config + runtime issues（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは秘匿）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor runtime と RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャネルプローブを含め、ライブ Gateway ヘルスプローブを実行します
   （到達可能な Gateway が必要）。[ヘルス](/ja-JP/gateway/health)を参照してください。

5. **最新ログを追尾**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復・移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health)を参照してください。

## クイックスタートと初回セットアップ

初回の Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期エラー）は、[初回 FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは、ひとことで言うと何ですか？">
    OpenClaw は、自分のデバイス上で動かすパーソナル AI アシスタントです。普段使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャネル Plugin）で返信でき、サポート対象プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。既に使っているチャットアプリから到達可能な、**自分のハードウェア**上で高性能なアシスタントを実行できる、**ローカルファーストのコントロールプレーン**です。ステートフルなセッション、メモリ、ツールを備え、ワークフローの制御をホスト型 SaaS に渡さずに利用できます。

    主な特長:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、ワークスペース + セッション履歴をローカルに保てます。
    - **Web サンドボックスではない実チャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、サポート対象プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティングとフェイルオーバー付きで使用できます。
    - **ローカル専用オプション:** 必要ならローカルモデルを実行して、**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** チャネル、アカウント、タスクごとに別々のエージェントを使い、それぞれに独自のワークスペースとデフォルトを持たせられます。
    - **オープンソースでハック可能:** ベンダーロックインなしで、調査、拡張、セルフホストができます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトとして適しているもの:

    - Web サイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリのプロトタイプを作る（アウトライン、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail に接続し、要約やフォローアップを自動化する。

    大きなタスクも処理できますが、フェーズに分割し、並列作業にサブエージェントを使うと最もうまく機能します。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    日常的な効果は、たいてい次のような形で現れます。

    - **個人向けブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **リサーチと下書き:** すばやいリサーチ、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **リサーチ、選定、下書き**には使えます。サイトをスキャンし、候補リストを作成し、見込み客を要約し、アウトリーチ文や広告コピーの下書きを作成できます。

    **アウトリーチや広告配信**では、人間を必ず関与させてください。スパムを避け、地域の法律とプラットフォームポリシーに従い、送信前に必ずレビューしてください。最も安全なパターンは、OpenClaw に下書きを作らせ、自分が承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発において Claude Code と比べた利点は何ですか？">
    OpenClaw は **パーソナルアシスタント**であり、連携レイヤーです。IDE の代替ではありません。リポジトリ内で最速の直接コーディングループが必要なら、Claude Code や Codex を使ってください。永続メモリ、デバイス横断アクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたいだ**永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働 Gateway**（VPS 上で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用の **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに Skills をカスタマイズするには？">
    リポジトリ側のコピーを編集する代わりに、管理された上書きを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` なので、管理された上書きは git に触れずに同梱 Skills より優先されます。Skill をグローバルにインストールする必要はあるが一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で表示範囲を制御します。上流に送る価値がある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定できます（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでそれを `<workspace>/skills` として扱います。その Skill を特定のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うには？">
    現在サポートされているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` 上書きを設定できます。
    - **サブエージェント**: デフォルトモデルが異なる別エージェントにタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えられます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="重い作業中に bot が固まります。どうやってオフロードできますか？">
    長時間または並列タスクには**サブエージェント**を使います。サブエージェントは独自のセッションで実行され、要約を返し、メインチャットの応答性を保ちます。

    bot に「このタスク用にサブエージェントを spawn して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が今何をしているか（そしてビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクもサブエージェントもトークンを消費します。コストが気になる場合は、`agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐づいたサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットにバインドすると、そのスレッド内の後続メッセージはバインドされたセッションに留まります。

    基本フロー:

    - `thread: true` を指定して `sessions_spawn` で spawn します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動 unfocus を制御します。
    - `/unfocus` でスレッドを切り離します。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 上書き: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - spawn 時の自動バインド: `channels.discord.threadBindings.spawnSessions` のデフォルトは `true` です。スレッドに紐づくセッション spawn を無効にするには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントが完了したのに、完了更新が間違った場所に送られた、または投稿されませんでした。何を確認すべきですか？">
    まず解決されたリクエスターのルートを確認します。

    - completion-mode のサブエージェント配信は、バインドされたスレッドまたは会話ルートが存在する場合、それを優先します。
    - 完了元がチャネルしか持っていない場合、OpenClaw はリクエスターセッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）へフォールバックするため、直接配信が成功する可能性があります。
    - バインドされたルートも利用可能な保存済みルートも存在しない場合、直接配信は失敗し、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックすることがあります。
    - 無効または古いターゲットでも、キューへのフォールバックまたは最終配信失敗が強制されることがあります。
    - 子の最後に見える assistant 返信が正確なサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い進捗を投稿する代わりに意図的に通知を抑制します。
    - 子がツール呼び出しだけでタイムアウトした場合、通知は生のツール出力を再生する代わりに、それを短い部分進捗要約へ畳み込むことがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24 時間 365 日稼働していることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストのタイムゾーン）を確認します。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は実行されたのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認します。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が想定されていないことを意味します。
    - 通知先（`channel` / `to`）がない、または無効な場合、ランナーは外向き配信をスキップします。
    - チャンネル認証の失敗（`unauthorized`、`Forbidden`）は、ランナーが配信しようとしたものの、認証情報によりブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、ランナーはキューに入ったフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャットルートが利用できる場合、エージェントは引き続き `message`
    ツールで直接送信できます。`--announce` は、エージェントがまだ送信していない最終テキストに対するランナーの
    フォールバック経路のみを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行でモデルが切り替わったり、1 回リトライされたりしたのはなぜですか？">
    通常、それは重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離 Cron は、アクティブな実行が `LiveSessionModelSwitchError` を投げたときに、ランタイムのモデル引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルが維持され、切り替えで新しい認証プロファイルのオーバーライドが渡された場合は、Cron
    がリトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデルオーバーライドが最優先されます。
    - 次にジョブ単位の `model`。
    - 次に保存済みの Cron セッションモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行と 2 回の切り替えリトライの後、Cron は無限ループせずに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使用するか、ワークスペースに Skills を配置します。macOS の Skills UI は Linux では利用できません。
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
    ディレクトリに書き込みます。別個の `clawhub` CLI は、自分の Skills を公開または
    同期したい場合にのみインストールしてください。エージェント間で共有インストールする場合は、Skill を
    `~/.openclaw/skills` の下に配置し、どのエージェントが参照できるかを絞り込みたい場合は
    `agents.defaults.skills` または
    `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュール実行やバックグラウンドでの継続実行ができますか？">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ** は、スケジュールされたタスクまたは繰り返しタスクに使います（再起動後も保持されます）。
    - **Heartbeat** は、「メインセッション」の定期チェックに使います。
    - **分離ジョブ** は、要約を投稿したりチャットへ配信したりする自律エージェントに使います。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによってゲートされ、Skills は **Gateway ホスト** 上で適格な場合にのみシステムプロンプトに表示されます。Linux では、ゲートをオーバーライドしない限り、`darwin` 専用 Skills（`apple-notes`、`apple-reminders`、`things-mac` など）は読み込まれません。

    サポートされるパターンは 3 つあります。

    **オプション A - Gateway を Mac で実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、その後 Linux から [リモートモード](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングし、Mac で **Node 実行コマンド** を「常に確認」または「常に許可」に設定します。必要なバイナリが Node に存在する場合、OpenClaw は macOS 専用 Skills を適格として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「常に確認」を選んだ場合、プロンプトで「常に許可」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - macOS バイナリを SSH 経由でプロキシする（高度）。**
    Gateway は Linux 上に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill をオーバーライドして Linux を許可し、適格な状態に保ちます。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホスト上の `PATH` にラッパーを配置します（例: `~/bin/memo`）。
    3. Skill メタデータ（ワークスペースまたは `~/.openclaw/skills`）をオーバーライドして Linux を許可します。

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットが更新されるように、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion や HeyGen の統合はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API を提供しています）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、シンプルなパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ統合が必要な場合は、機能リクエストを開くか、それらの API を対象にした Skill
    を作成してください。

    Skills をインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で Skills を共有する場合は、`~/.openclaw/skills/<name>/SKILL.md` に配置します。一部のエージェントだけが共有インストールを参照すべき場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定しています。Linux では、それは Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使用するにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する、組み込みの `user` ブラウザープロファイルを使用します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名が必要な場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザーまたは接続済みのブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシンで Node ホストを実行するか、代わりにリモート CDP を使用します。

    `existing-session` / `user` の現在の制限:

    - アクションは CSS セレクター駆動ではなく、ref 駆動です
    - アップロードには `ref` / `inputRef` が必要で、現時点では一度に 1 つのファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker は制限が多く感じます。すべての機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、システムパッケージ、Homebrew、バンドルされたブラウザーは含まれません。より完全なセットアップにするには:

    - `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化し、キャッシュが残るようにします。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに焼き込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されることを確認します。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非メインキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用できるツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人用 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定します（例: `"/home/user/src:/src:ro"`）。グローバルとエージェント単位のバインドはマージされます。`scope: "shared"` の場合、エージェント単位のバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスのファイルシステム壁を迂回することを忘れないでください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正準パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は失敗クローズとなり、許可ルートチェックはシンボリックリンク解決後にも適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。

    - 日次ノートは `memory/YYYY-MM-DD.md`
    - キュレートされた長期ノートは `MEMORY.md`（メイン/プライベートセッションのみ）

    OpenClaw は、モデルに自動 Compaction 前に永続的なノートを書くよう促すため、**サイレントな Compaction 前メモリフラッシュ**も実行します。これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md`、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入れます。

    これはまだ改善中の領域です。モデルにメモリを保存するようリマインドすると役立ちます。
    モデルは何をすべきかを理解しています。それでも忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、ストレージです。**セッションコンテキスト**は引き続きモデルのコンテキストウィンドウによって制限されるため、長い会話では圧縮または切り捨てが発生することがあります。そのためメモリ検索が存在します。関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか?">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuth が対象にするのはチャット/補完であり、
    embeddings へのアクセス権は付与**しない**ため、**Codex でサインインしても (OAuth または
    Codex CLI ログイン)** セマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際の API キー (`OPENAI_API_KEY` または `models.providers.openai.apiKey`) が必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    プロバイダーを自動選択します (認証プロファイル、`models.providers.*.apiKey`、または環境変数)。
    OpenAI キーを解決できる場合は OpenAI を優先し、それ以外では Gemini キーを
    解決できる場合は Gemini、その後 Voyage、Mistral の順に選びます。リモートキーがない場合、
    メモリ検索は設定するまで無効のままです。ローカルモデルパスが
    設定済みで存在する場合、OpenClaw
    は `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

    ローカルにとどめたい場合は、`memorySearch.provider = "local"` を設定します (任意で
    `memorySearch.fallback = "none"` も設定できます)。Gemini embeddings を使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY` (または
    `memorySearch.remote.apiKey`) を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の embedding
    モデルをサポートしています。設定の詳細は [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上での保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか?">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      (`~/.openclaw` + ワークスペースディレクトリ)。
    - **必要によりリモート:** モデルプロバイダー (Anthropic/OpenAI など) に送るメッセージは
      それらの API に送信され、チャットプラットフォーム (WhatsApp/Telegram/Slack など) はメッセージデータを
      それぞれのサーバーに保存します。
    - **フットプリントは制御できます:** ローカルモデルを使うとプロンプトは自分のマシン上に残りますが、チャンネル
      トラフィックは引き続きそのチャンネルのサーバーを通ります。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか?">
    すべて `$OPENCLAW_STATE_DIR` 配下に置かれます (デフォルト: `~/.openclaw`)。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定 (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート (初回使用時に認証プロファイルへコピー)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル (OAuth、API キー、任意の `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー向けの任意のファイル backed シークレットペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル (静的な `api_key` エントリはスクラブ済み)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態 (例: `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態 (agentDir + セッション)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態 (エージェントごと)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ (エージェントごと)                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*` (`openclaw doctor` により移行)。

    **ワークスペース** (AGENTS.md、メモリファイル、skills など) は別で、`agents.defaults.workspace` により設定されます (デフォルト: `~/.openclaw/workspace`)。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか?">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース (エージェントごと)**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **状態ディレクトリ (`~/.openclaw`)**: 設定、チャンネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills (`~/.openclaw/skills`)。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、毎回の起動で Gateway が同じ
    ワークスペースを使っていることを確認してください (そして、リモートモードではローカルのノート PC ではなく
    **gateway ホストの**ワークスペースを使うことを覚えておいてください)。

    ヒント: 永続的な挙動や設定を残したい場合は、チャット履歴に頼るのではなく、ボットに
    **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**プライベート**な git リポジトリに置き、どこか
    プライベートな場所 (たとえば GitHub private) にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの (認証情報、セッション、トークン、暗号化されたシークレットペイロード) は**コミットしないでください**。
    完全復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください (上の移行に関する質問を参照)。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには?">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか?">
    はい。ワークスペースは**デフォルト cwd**でありメモリのアンカーですが、強制的なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスは他の
    ホスト上の場所にもアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。リポジトリをデフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。エージェントにその中で作業させたい意図がない限り、
    ワークスペースは分けておいてください。

    例 (デフォルト cwd としてのリポジトリ):

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

  <Accordion title="リモートモード: セッションストアはどこにありますか?">
    セッション状態は**gateway ホスト**が所有します。リモートモードの場合、重要なセッションストアはローカルのノート PC ではなくリモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか? どこにありますか?">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から任意の **JSON5** 設定を読み込みます (デフォルト: `~/.openclaw/openclaw.json`)。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、ある程度安全なデフォルト (デフォルトワークスペース `~/.openclaw/workspace` を含む) を使います。

  </Accordion>

  <Accordion title='gateway.bind: "lan" (または "tailnet") を設定したら何も listen しない / UI が unauthorized と表示します'>
    非 loopback バインドには**有効な gateway 認証パスが必要**です。実際には次のいずれかを意味します。

    - shared-secret 認証: トークンまたはパスワード
    - 正しく設定された identity-aware リバースプロキシ背後の `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` は、それだけではローカル gateway 認証を有効化**しません**。
    - ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合に限り `gateway.remote.*` をフォールバックとして使えます。
    - パスワード認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password` (または `OPENCLAW_GATEWAY_PASSWORD`) を設定します。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は fail closed します (リモートフォールバックによる隠蔽なし)。
    - shared-secret の Control UI セットアップは `connect.params.auth.token` または `connect.params.auth.password` (アプリ/UI 設定に保存) で認証します。Tailscale Serve や `trusted-proxy` のような identity-bearing モードでは、代わりにリクエストヘッダーを使います。共有シークレットを URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback リバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="なぜ今は localhost でもトークンが必要なのですか?">
    OpenClaw は loopback を含め、デフォルトで gateway 認証を強制します。通常のデフォルトパスでは、これはトークン認証を意味します。明示的な認証パスが設定されていない場合、gateway 起動時にトークンモードへ解決され、その起動専用の runtime-only トークンが生成されるため、**ローカル WS クライアントは認証が必要**です。再起動をまたいで安定したシークレットがクライアントに必要な場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを使いたい場合は、パスワードモード (または identity-aware リバースプロキシ向けの `trusted-proxy`) を明示的に選べます。どうしても open loopback にしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定変更後に再起動する必要はありますか?">
    Gateway は設定を監視し、hot-reload をサポートしています。

    - `gateway.reload.mode: "hybrid"` (デフォルト): 安全な変更を hot-apply し、重要な変更では再起動
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="CLI の面白いタグラインを無効にするには?">
    設定で `cli.banner.taglineMode` を設定します。

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグラインテキストを非表示にしますが、バナータイトル/バージョン行は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節性のあるタグラインをローテーションします (デフォルトの挙動)。
    - バナーをまったく表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="web search (および web fetch) を有効にするには?">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API-backed プロバイダーには通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML-based integration です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行してプロバイダーを選択します。
    環境変数での代替:

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
    互換性のため、従来の `tools.web.search.*` プロバイダーパスも一時的に読み込まれますが、新しい設定には使用しないでください。
    Firecrawl Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    注:

    - 許可リストを使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` が省略された場合、OpenClaw は利用可能な認証情報から最初に準備できた取得フォールバックプロバイダーを自動検出します。現在の同梱プロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消去しました。どう復旧し、回避すればよいですか？">
    `config.apply` は **設定全体**を置き換えます。部分的なオブジェクトを送ると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の設定全体を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動やホットリロードが壊れた場合、Gateway はフェイルクローズするかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担い、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、最後に正常だった設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の隣にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - `openclaw config set` または `config.patch` で、意図したキーだけを戻します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャネル/モデルを再設定します。
    - これが想定外だった場合は、バグを報告し、最後に把握している設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。これは浅いスキーマノードと、ドリルダウン用の直下の子要素サマリーを返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換えだけに使用してください。
    - エージェント実行から所有者専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護された exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [設定](/ja-JP/cli/config)、[構成](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいで専門ワーカーを使う中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **ノード** と **エージェント** を組み合わせる構成です。

    - **Gateway（中央）:** チャネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Macs/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner 運用」、「個人データ」）向けの別個の頭脳/ワークスペースです。
    - **サブエージェント:** 並列化したい場合に、メインエージェントからバックグラウンド作業を起動します。
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

    デフォルトは `false`（ヘッドフル）です。一部のサイトでは、ヘッドレスはボット対策チェックを引き起こしやすくなります。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用してください）。
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
  <Accordion title="コマンドは Telegram、Gateway、ノードの間でどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、
    ノードツールが必要な場合にだけ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → エージェント → `node.*` → ノード → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントが自分のコンピューターにアクセスするにはどうすればよいですか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    典型的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して、
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティ注意事項: macOS ノードをペアリングすると、そのマシンで `system.run` が可能になります。信頼するデバイスだけをペアリングし、[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが、返信がありません。次に何を確認すればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway の健全性: `openclaw status`
    - チャネルの健全性: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動していて正しいポートを指していることを確認します。
    - 許可リスト（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス（ローカル + VPS）同士で通信できますか？">
    はい。組み込みの「ボット間」ブリッジはありませんが、いくつかの信頼できる方法で接続できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送り、その後は通常どおり Bot B に返信させます。

    **CLI ブリッジ（汎用）:** 他方のボットが待ち受けているチャットを対象に、
    `openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行します。一方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないようにガードレールを追加します（メンション時のみ、チャネル許可リスト、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、それぞれが独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップであり、エージェントごとに 1 つの VPS を実行するよりもずっと安価で簡単です。

    別々の VPS を使用するのは、強い分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合だけです。それ以外は、1 つの Gateway を維持し、
    複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、自分の個人用ノートパソコンをノードとして使う利点はありますか？">
    はい。ノードはリモート Gateway からノートパソコンに到達するための第一級の方法であり、
    シェルアクセス以上の機能を解放します。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスのボックスで十分です。4 GB RAM で十分です）。そのため、一般的な
    セットアップは常時稼働ホストと、ノードとしてのノートパソコンです。

    - **受信 SSH は不要です。** ノードは Gateway WebSocket に外向きに接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのノートパソコン上のノード許可リスト/承認によって制御されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ノートパソコン上のノードホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH は一時的なシェルアクセスには問題ありませんが、継続的なエージェントワークフローや
    デバイス自動化にはノードの方が簡単です。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き（[複数 Gateway](/ja-JP/gateway/multiple-gateways)を参照）、ホストごとに実行すべき **Gateway** は 1 つだけです。ノードは Gateway に接続する周辺機器です
    （iOS/Android ノード、またはメニューバーアプリの macOS「ノードモード」）。ヘッドレスノード
    ホストと CLI 制御については、[ノードホスト CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、およびホストされた Plugin サーフェスの変更には、完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーについて、その浅いスキーマノード、一致した UI ヒント、直下の子の要約を調べる
    - `config.get`: 現在のスナップショット + ハッシュを取得する
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動する
    - `config.apply`: 設定全体を検証 + 置換する。可能な場合はホットリロードし、必要な場合は再起動する
    - オーナー専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否する。従来の `tools.bash.*` エイリアスは同じ保護された exec パスに正規化される

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これにより、ワークスペースを設定し、誰がボットを起動できるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale をセットアップし、Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストール + ログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS が安定した名前を持つようにします。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしでコントロール UI を使いたい場合は、VPS で Tailscale Serve を使います:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback にバインドされたままになり、HTTPS が Tailscale 経由で公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway コントロール UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **リモートモードで macOS アプリを使います**（SSH ターゲットには tailnet ホスト名を指定できます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. gateway で**ノードを承認**します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか、それともノードを追加するだけでよいですか？">
    2 台目のノート PC で **ローカルツール**（画面/カメラ/exec）だけが必要な場合は、**ノード**として追加します。これにより単一の Gateway を維持でき、設定の重複を避けられます。ローカルノードツールは現在 macOS のみですが、他の OS にも拡張する予定です。

    2 台目の Gateway は、**強い分離**または完全に別々の 2 つのボットが必要な場合にだけインストールしてください。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに以下を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。

    設定内でインライン環境変数を定義することもできます（プロセス環境にない場合にのみ適用されます）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    優先順位とソースの完全な説明は [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    よくある修正は 2 つあります:

    1. 不足しているキーを `~/.openclaw/.env` に入れると、サービスが shell 環境を継承しない場合でも取得されます。
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

    これによりログイン shell が実行され、不足している想定キーだけがインポートされます（上書きはしません）。同等の環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、モデルのステータスに "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell 環境インポート**が有効かどうかを報告します。"Shell env: off" は、環境変数がないことを意味しません。OpenClaw がログイン shell を自動的に読み込まないことを意味するだけです。

    Gateway がサービス（launchd/systemd）として実行されている場合、shell 環境を継承しません。次のいずれかで修正します:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell インポートを有効にします（`env.shellEnv.enabled: true`）。
    3. または設定の `env` ブロックに追加します（ない場合にのみ適用されます）。

    その後 gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（または `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    単独のメッセージとして `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` 後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルトは **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効な場合、アイドル期間後の**次の**メッセージで、そのチャットキーの新しいセッション ID が開始されます。
    これはトランスクリプトを削除しません。新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を作る方法はありますか？">
    はい、**マルチエージェントルーティング**と**サブエージェント**を使います。1 つのコーディネーターエージェントと、それぞれ独自のワークスペースとモデルを持つ複数のワーカーエージェントを作成できます。

    とはいえ、これは**楽しい実験**として見るのが最適です。トークン消費が大きく、多くの場合、別々のセッションを持つ 1 つのボットを使うより効率が低くなります。私たちが想定する典型的なモデルは、話しかけるボットが 1 つあり、並列作業には異なるセッションを使う形です。そのボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルウィンドウによって制限されます。長いチャット、大きなツール出力、多数のファイルは、compaction や切り詰めを引き起こすことがあります。

    役立つこと:

    - 現在の状態を要約してファイルに書き込むようボットに依頼する。
    - 長いタスクの前に `/compact` を使い、トピックを切り替えるときは `/new` を使う。
    - 重要なコンテキストをワークスペースに置き、ボットに読み返すよう依頼する。
    - 長い作業や並列作業にはサブエージェントを使い、メインチャットを小さく保つ。
    - これが頻繁に起こる場合は、より大きいコンテキストウィンドウを持つモデルを選ぶ。

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

    - 既存の設定を検出した場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っている場合は、各 state dir をリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ています。リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使います:

    - **Compact**（会話を維持しつつ、古いターンを要約します）:

      ```
      /compact
      ```

      または、要約を誘導するために `/compact <instructions>` を使います。

    - **Reset**（同じチャットキーに対する新しいセッション ID）:

      ```
      /new
      /reset
      ```

    繰り返し発生する場合:

    - **セッション pruning**（`agents.defaults.contextPruning`）を有効化または調整し、古いツール出力をトリムします。
    - より大きいコンテキストウィンドウを持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これはプロバイダーの検証エラーです。モデルが必要な `input` なしで `tool_use` ブロックを出力しました。
    通常、セッション履歴が古いか破損していることを意味します（多くの場合、長いスレッドやツール/スキーマ変更の後）。

    修正: `/new`（単独メッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth 認証を使う場合は **1h**）。調整または無効化します:

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

    `HEARTBEAT.md` が存在していても実質的に空（空行と `# Heading` のような markdown ヘッダーのみ）の場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。
    ファイルがない場合でも Heartbeat は実行され、モデルが何をするかを決定します。

    エージェントごとの上書きは `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要はありますか？'>
    いいえ。OpenClaw は**自分自身のアカウント**で動作するため、あなたがグループにいる場合、OpenClaw はそれを見ることができます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

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

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります:

    - メンションゲートが有効です（デフォルト）。ボットを @mention する（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist にありません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションに折りたたまれます。グループ/チャンネルは独自のセッションキーを持ち、Telegram トピック / Discord スレッドは別々のセッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な制限はありません。数十個（場合によっては数百個）でも問題ありませんが、次の点に注意してください。

    - **ディスク増加:** セッションとトランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** エージェントが増えるほど、同時実行されるモデル利用も増えます。
    - **運用負荷:** エージェントごとの認証プロファイル、ワークスペース、チャネルルーティング。

    ヒント:

    - エージェントごとに **アクティブな** ワークスペースを 1 つ保ちます（`agents.defaults.workspace`）。
    - ディスクが増えてきたら、古いセッションを整理します（JSONL またはストアエントリを削除）。
    - `openclaw doctor` を使って、不要なワークスペースやプロファイルの不一致を見つけます。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）、またどのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使って、複数の分離されたエージェントを実行し、受信メッセージを
    チャネル/アカウント/ピアごとにルーティングできます。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることなら何でもできる」わけではありません。アンチボット、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザーを実行しているマシン上で CDP を使います。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに 1 つのエージェント（バインディング）。
    - それらのエージェントにバインドされた Slack チャネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [ブラウザー](/ja-JP/tools/browser), [ノード](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は [モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「already running」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" なのに "Connectivity probe: failed" と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**の視点（launchd/systemd/schtasks）だからです。接続性プローブは、CLI が実際に Gateway WebSocket に接続した結果です。

    `openclaw gateway status` を使い、次の行を信頼してください。

    - `Probe target:`（プローブが実際に使った URL）
    - `Listening:`（ポートで実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートが待ち受けていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    サービスが別の設定ファイルで実行されている一方で、あなたは別の設定ファイルを編集しています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" とはどういう意味ですか？'>
    OpenClaw は起動直後に WebSocket リスナーをバインドすることで実行時ロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでに待ち受けていることを示す `GatewayLockError` を投げます。

    修正: もう一方のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート認証情報とともにリモート WebSocket URL を指定します。

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

    注:

    - `openclaw gateway` は `gateway.mode` が `local` の場合（または上書きフラグを渡した場合）にのみ起動します。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報にすぎません。それ自体ではローカル Gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI が "unauthorized" と表示します（または再接続を繰り返します）。どうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザータブセッションと選択中の Gateway URL について、トークンを `sessionStorage` に保持します。そのため、同じタブの更新は、長期間保持される localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、信頼済みクライアントは、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返した場合に、キャッシュされたデバイストークンで 1 回だけ制限付き再試行を試せます。
    - そのキャッシュトークン再試行では、デバイストークンと一緒に保存されたキャッシュ済みの承認済みスコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを維持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップオペレーター許可リストはオペレーター要求だけを満たします。ノードやその他の非オペレーターロールには、引き続き自身のロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、先にトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であること、Tailscale ID ヘッダーをバイパスする生の loopback/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、設定済みの ID 対応プロキシを経由していることを確認します。同一ホストの loopback プロキシでは `gateway.auth.trustedProxy.allowLoopback = true` も必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテート/再承認します。
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテート呼び出しが拒否されたと表示する場合は、次の 2 点を確認してください。
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自身の**デバイスだけをローテートできます
      - 明示的な `--scope` 値は、呼び出し元の現在のオペレータースコープを超えられません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが、バインドできず何も待ち受けません">
    `tailnet` バインドはネットワークインターフェースから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale 上にない場合（またはインターフェースがダウンしている場合）、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用バインドにしたい場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。冗長性（例: レスキューボット）や強い分離が必要な場合にのみ、複数の Gateway を使ってください。

    可能ですが、分離する必要があります。

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル設定で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にも接尾辞を付けます（`ai.openclaw.<profile>`、レガシー `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信すると、
    **コード 1008**（ポリシー違反）で接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使った。
    - プロキシまたはトンネルが認証ヘッダーを削除した、または Gateway ではないリクエストを送信した。

    クイック修正:

    1. WS URL を使います: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証がオンの場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使っている場合、URL は次のようになります。

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログ記録とデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で安定したパスを設定できます。ファイルログレベルは `logging.level` で制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ（Gateway が launchd/systemd 経由で実行されている場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`、プロファイルでは `~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    Gateway ヘルパーを使います。

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合は、`openclaw gateway --force` でポートを回収できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するにはどうすればよいですか？">
    **Windows のインストールモードは 2 つ**あります。

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入ってから再起動します。

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスをインストールしていない場合は、フォアグラウンドで起動します。

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します。

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行する場合（サービスなし）は、次を使います。

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信が届きません。何を確認すべきですか？">
    まず簡単なヘルスチェックから始めます。

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - **Gateway ホスト**でモデル認証が読み込まれていない（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定とログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が稼働しており、
    Gateway WebSocket に到達できることを確認してください。

    Docs: [チャンネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway から切断されました: 理由なし" - 次は何をすべきですか?'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください。

    1. Gateway は実行中ですか? `openclaw gateway status`
    2. Gateway は正常ですか? `openclaw status`
    3. UI は正しいトークンを持っていますか? `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは稼働していますか?

    次にログを tail します。

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか?">
    ログとチャンネルステータスから始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の制限まで切り詰め、より少ないコマンドで再試行しますが、一部のメニュー項目はまだ削除する必要があります。plugin/skill/カスタムコマンドを減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, または類似のネットワークエラー: VPS 上またはプロキシの背後にいる場合は、送信 HTTPS が許可され、`api.telegram.org` の DNS が機能することを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    Docs: [Telegram](/ja-JP/channels/telegram), [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか?">
    まず Gateway に到達でき、エージェントが実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    Docs: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか?">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは**監視付きサービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は Ctrl-C で停止し、次に実行します。

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway サービスランブック](/ja-JP/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで Gateway を**フォアグラウンド**実行します。

    サービスをインストールしている場合は、Gateway コマンドを使用します。一度限りの
    フォアグラウンド実行が必要な場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を最も早く得る方法">
    より詳しいコンソール出力を得るには、`--verbose` 付きで Gateway を起動します。次に、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分の skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>` 行（単独の行）が含まれている必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください。

    - 対象チャンネルが送信メディアをサポートしており、許可リストによってブロックされていない。
    - ファイルがプロバイダーのサイズ制限内にある（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、一時/メディアストア、サンドボックス検証済みファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読み取れるホストローカルファイルを `MEDIA:` で送信できるようにしますが、対象はメディアと安全なドキュメントタイプ（画像、音声、動画、PDF、Office ドキュメント）のみに限られます。プレーンテキストやシークレットのようなファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか?">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています。

    - DM 対応チャンネルのデフォルト動作は**ペアリング**です。
      - 不明な送信者はペアリングコードを受け取り、ボットはそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルごとに 3 件**に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには明示的なオプトインが必要です（`dmPolicy: "open"` と許可リスト `"*"`）。

    リスクのある DM ポリシーを表示するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか?">
    いいえ。プロンプトインジェクションは、ボットに DM できる相手だけでなく、**信頼できないコンテンツ**に関する問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    docs、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれている可能性があります。これは**送信者が自分だけ**の場合でも起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を小さくするには:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」エージェントを使用する
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はいずれも、未加工のファイルテキストを渡す代わりに、
      抽出したテキストを明示的な外部コンテンツ境界マーカーでラップします
    - サンドボックス化と厳格なツール許可リスト

    詳細: [セキュリティ](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="ボットには専用のメール、GitHub アカウント、電話番号を持たせるべきですか?">
    はい、ほとんどのセットアップではそうです。ボットを別アカウントや別電話番号で分離すると、
    何か問題が起きた場合の影響範囲を小さくできます。また、個人アカウントに影響を与えずに
    資格情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを与え、
    必要になった場合に後から拡張します。

    Docs: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing).

  </Accordion>

  <Accordion title="自分のテキストメッセージに対する自律性を与えてもよいですか? それは安全ですか?">
    個人メッセージに対する完全な自律性は推奨**しません**。最も安全なパターンは次のとおりです。

    - DM は**ペアリングモード**または厳格な許可リストに保つ。
    - 自分の代わりにメッセージを送らせたい場合は、**別の番号またはアカウント**を使用する。
    - 下書きを作成させ、**送信前に承認**する。

    試したい場合は専用アカウントで行い、分離した状態を保ってください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントタスクに安価なモデルを使用できますか?">
    はい、エージェントがチャット専用で、入力が信頼できる**場合**は可能です。小さい階層のモデルは
    指示の乗っ取りを受けやすいため、ツール有効エージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに追加するか、そのアカウントで `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 自分の連絡先にメッセージを送りますか? ペアリングはどのように機能しますか?">
    いいえ。デフォルトの WhatsApp DM ポリシーは**ペアリング**です。不明な送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClaw は受信したチャット、またはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: 自分の DM を許可するための**許可リスト/所有者**の設定に使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使用し、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか?">
    ほとんどの内部メッセージまたはツールメッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    まだノイズが多い場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使用していないことも確認してください。

    Docs: [思考と verbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか?">
    次のいずれかを**単独メッセージ**として送信します（スラッシュなし）。

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

    バックグラウンドプロセス（exec ツールからのもの）については、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる**単独**メッセージとして送信する必要がありますが、一部のショートカット（`/status` など）は許可リスト済み送信者であればインラインでも機能します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るにはどうすればよいですか?（「Cross-context messaging denied」）'>
    OpenClaw はデフォルトで**クロスプロバイダー**メッセージングをブロックします。ツール呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。

    エージェントのクロスプロバイダーメッセージングを有効にします。

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

    設定を編集した後、Gateway を再起動してください。

  </Accordion>

  <Accordion title='連続メッセージを送るとボットが「無視」しているように感じるのはなぜですか?'>
    キューモードは、新しいメッセージが実行中のランとどのように相互作用するかを制御します。モードを変更するには `/queue` を使用します。

    - `steer` - 現在のラン内の次のモデル境界に向けて、保留中のすべての誘導をキューに入れる
    - `queue` - 従来の一度に 1 件の誘導
    - `followup` - メッセージを 1 件ずつ実行する
    - `collect` - メッセージをまとめて 1 回だけ返信する
    - `steer-backlog` - 今すぐ誘導し、その後バックログを処理する
    - `interrupt` - 現在のランを中止して新しく開始する

    デフォルトモードは `steer` です。フォローアップモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う Anthropic のデフォルトモデルは何ですか?'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを認証プロファイルに保存する）と認証は有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合は、Gateway が実行中のエージェントに対して想定される `auth-profiles.json` 内で Anthropic の認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか? [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期エラー
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
