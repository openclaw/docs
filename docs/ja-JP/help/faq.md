---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - 詳細なデバッグの前に、ユーザーから報告された問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-07T13:20:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

実環境のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）向けの簡潔な回答と詳細なトラブルシューティングです。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル概要: OS + 更新、gateway/サービスの到達性、エージェント/セッション、プロバイダー設定 + ランタイムの問題（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾を含む読み取り専用の診断（トークンは伏せ字）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor ランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャンネルプローブを含む、ライブ gateway ヘルスプローブを実行します
   （到達可能な gateway が必要です）。[ヘルス](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追尾する**

   ```bash
   openclaw logs --follow
   ```

   RPC が落ちている場合は、次にフォールバックします:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ログ](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行する（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
   ```

   実行中の gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回の Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期エラー）は
[初回 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw を一段落で説明すると何ですか？">
    OpenClaw は、自分のデバイスで実行する個人用 AI アシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネル Plugin）で返信でき、サポートされているプラットフォームでは音声 + ライブ Canvas も使えます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「ただの Claude ラッパー」ではありません。すでに使っているチャットアプリから到達できる
    高機能なアシスタントを **自分のハードウェア** で実行できる、**ローカルファーストのコントロールプレーン** です。
    ステートフルなセッション、メモリ、ツールを備え、ワークフローの制御をホスト型
    SaaS に渡す必要がありません。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、
      ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実チャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      さらにサポート対象プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティング
      とフェイルオーバーで使用できます。
    - **ローカル専用オプション:** 望む場合はローカルモデルを実行し、**すべてのデータを自分のデバイスに留める** ことができます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとにエージェントを分け、それぞれに独自の
      ワークスペースとデフォルトを持たせられます。
    - **オープンソースで改造可能:** ベンダーロックインなしで、検査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャンネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすればよいですか？">
    最初のプロジェクトとして適しているもの:

    - Web サイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリをプロトタイプする（概要、画面、API 計画）。
    - ファイルとフォルダを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分割し、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    日常的な成果は通常、次のような形になります:

    - **パーソナルブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **リサーチと下書き:** メールやドキュメント向けの簡単なリサーチ、要約、初稿。
    - **リマインダーとフォローアップ:** cron または Heartbeat による通知とチェックリスト。
    - **ブラウザ自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **クロスデバイス調整:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **リサーチ、適格性評価、下書き** には役立ちます。サイトをスキャンし、候補リストを作成し、
    見込み客を要約し、アウトリーチや広告コピーの下書きを書けます。

    **アウトリーチや広告配信** では、人間をループ内に置いてください。スパムを避け、地域の法律と
    プラットフォームポリシーに従い、送信前に必ずレビューしてください。最も安全なパターンは、
    OpenClaw に下書きさせ、自分が承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発における Claude Code との比較での利点は何ですか？">
    OpenClaw は **個人用アシスタント** であり調整レイヤーであって、IDE の代替ではありません。リポジトリ内で最速の直接コーディングループには
    Claude Code または Codex を使ってください。永続的なメモリ、クロスデバイスアクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたいだ **永続的なメモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザ、ファイル、スケジューリング、フック）
    - **常時稼働の Gateway**（VPS 上で実行し、どこからでも操作）
    - ローカルのブラウザ/画面/カメラ/exec 用の **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリのコピーを編集する代わりに、管理対象のオーバーライドを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、管理対象のオーバーライドは git に触れずに同梱 Skills より優先されます。Skill をグローバルにインストールする必要があるが一部のエージェントにだけ表示したい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。リポジトリに置いて PR として出すべきなのは、上流に取り込む価値がある編集だけです。
  </Accordion>

  <Accordion title="カスタムフォルダから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを追加します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでそれを `<workspace>/skills` として扱います。Skill を特定のエージェントにだけ表示したい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです:

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: タスクを、異なるデフォルトモデルを持つ別々のエージェントにルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうすればオフロードできますか？">
    長時間または並列のタスクには **サブエージェント** を使います。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    ボットに「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が今何をしているか（そしてビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント向けに安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐づいたサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットにバインドすると、そのスレッド内の後続メッセージはバインドされたセッションに留まります。

    基本フロー:

    - `thread: true` を指定して `sessions_spawn` で起動します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動 unfocus を制御します。
    - `/unfocus` でスレッドを切り離します。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSessions` のデフォルトは `true` です。スレッドに紐づいたセッション起動を無効にするには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了したのに、完了更新が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決済みのリクエスター経路を確認します:

    - 完了モードのサブエージェント配信は、存在する場合はバインドされたスレッドまたは会話経路を優先します。
    - 完了元にチャンネルしか含まれていない場合、OpenClaw はリクエスターセッションに保存された経路（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が引き続き成功することがあります。
    - バインド済み経路も利用可能な保存済み経路も存在しない場合、直接配信は失敗し、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューフォールバックや最終配信失敗が強制されることがあります。
    - 子の最後に見える assistant 返信が完全に無音トークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` である場合、OpenClaw は古い進捗を投稿する代わりに意図的にアナウンスを抑制します。
    - 子がツール呼び出しだけの後にタイムアウトした場合、アナウンスは生のツール出力を再生する代わりに、それを短い部分進捗要約へ折りたたむことがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron やリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 稼働していることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストのタイムゾーン）を確認します。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は起動したのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が想定されていないことを意味します。
    - アナウンス先（`channel` / `to`）がない、または無効な場合、ランナーは外向き配信をスキップします。
    - チャンネル認証エラー（`unauthorized`, `Forbidden`）は、ランナーが配信を試みたものの認証情報でブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不能として扱われるため、ランナーはキュー済みフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャットルートが利用できる場合、エージェントは引き続き `message`
    ツールで直接送信できます。`--announce` は、エージェントがまだ送信していない最終テキストに対するランナーの
    フォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行でモデルが切り替わったり、1 回再試行されたりしたのはなぜですか？">
    通常これは重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離 Cron は、アクティブな実行が `LiveSessionModelSwitchError` をスローしたときに、ランタイムモデルの引き継ぎを永続化して再試行できます。再試行では切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイルオーバーライドが含まれていた場合、Cron は
    再試行前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデルオーバーライドが最初に優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済み Cron セッションのモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    再試行ループには上限があります。初回試行に加えて 2 回の切り替え再試行後、
    Cron は無限ループせずに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、ワークスペースに Skills を配置してください。macOS の Skills UI は Linux では利用できません。
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
    ディレクトリに書き込みます。別個の `clawhub` CLI は、自分の Skills を公開または
    同期したい場合にだけインストールしてください。エージェント間で共有インストールする場合は、Skill を
    `~/.openclaw/skills` 配下に置き、どのエージェントから見えるかを絞りたい場合は
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はタスクをスケジュール実行したり、バックグラウンドで継続実行したりできますか？">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ** はスケジュール済みまたは定期タスク用です（再起動後も保持されます）。
    - **Heartbeat** は「メインセッション」の定期チェック用です。
    - **分離ジョブ** は、要約を投稿したりチャットへ配信したりする自律エージェント用です。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化とタスク](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリで制限されており、Skills は **Gateway ホスト**で適格な場合にのみシステムプロンプトに表示されます。Linux では、ゲート制御をオーバーライドしない限り、`apple-notes`, `apple-reminders`, `things-mac` のような `darwin` 専用 Skills はロードされません。

    サポートされるパターンは 3 つあります。

    **オプション A - Mac で Gateway を実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおりロードされます。

    **オプション B - macOS Node を使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac 側で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を適格として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選択した場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級者向け）。**
    Gateway は Linux 上に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill をオーバーライドして Linux を許可し、適格な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホストの `PATH` にラッパーを置きます（例: `~/bin/memo`）。
    3. Skill メタデータ（ワークスペースまたは `~/.openclaw/skills`）をオーバーライドして Linux を許可します。

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットを更新するため、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion や HeyGen との統合はありますか？">
    現在は組み込まれていません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API があります）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、簡単なパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + アクティブな作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ統合が必要な場合は、機能リクエストを開くか、それらの API を対象にした Skill を
    作成してください。

    Skills のインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で Skills を共有する場合は、`~/.openclaw/skills/<name>/SKILL.md` に配置します。一部のエージェントにだけ共有インストールを見せる場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部の Skills は Homebrew でインストールされたバイナリを想定しています。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    組み込みの `user` ブラウザープロファイルを使用します。これは Chrome DevTools MCP 経由で接続します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使いたい場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザー Node を使用できます。Gateway が別の場所で動作している場合は、ブラウザーのマシンで Node ホストを実行するか、代わりにリモート CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - アクションは CSS セレクター駆動ではなく、ref 駆動です
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルのみ対応しています
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker だと制限が多く感じます。全機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドル済みブラウザーは含まれません。より完全なセットアップにするには:

    - `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化し、キャッシュを保持します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに焼き込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker), [ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のまま、グループは公開/サンドボックス化できますか？">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合に可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非メインキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に留まります。バックエンドを選ばない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化セッションで利用できるツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人用 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定します（例: `"/home/user/src:/src:ro"`）。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスファイルシステムの壁を迂回することを覚えておいてください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正規パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出はフェイルクローズされ、許可ルートチェックはシンボリックリンク解決後にも引き続き適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)と[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw メモリは、エージェントワークスペース内の Markdown ファイルです。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` のキュレーション済み長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は **サイレントな事前 Compaction メモリフラッシュ** も実行し、モデルに
    自動 Compaction 前に永続ノートを書くよう促します。これはワークスペースが書き込み可能な場合にのみ実行されます
    （読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書く**よう依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。メモリを保存するようモデルに思い出させると役立ちます。
    モデルは何をすべきか理解します。忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory), [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永続的に残りますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、
    ストレージです。**セッションコンテキスト** は引き続きモデルのコンテキストウィンドウに制限されるため、
    長い会話は compact または切り詰められることがあります。そのためメモリ検索が存在します。関連する部分だけをコンテキストへ戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory), [コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索にはOpenAI APIキーが必要ですか？">
    **OpenAI embeddings**を使用する場合のみ必要です。Codex OAuthはチャット/補完を対象とし、
    embeddingsアクセスは許可しないため、**Codexでサインイン（OAuthまたは
    Codex CLIログイン）**してもセマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際のAPIキー（`OPENAI_API_KEY`または`models.providers.openai.apiKey`）が必要です。

    providerを明示的に設定しない場合、OpenClawはAPIキーを解決できるときに
    providerを自動選択します（auth profiles、`models.providers.*.apiKey`、またはenv vars）。
    OpenAIキーが解決できる場合はOpenAIを優先し、そうでなければGeminiキーが
    解決できる場合はGemini、次にVoyage、次にMistralを優先します。リモートキーが利用できない場合、
    設定するまでメモリ検索は無効のままです。localモデルパスが
    設定済みで存在する場合、OpenClawは
    `local`を優先します。Ollamaは明示的に
    `memorySearch.provider = "ollama"`を設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"`を設定します（任意で
    `memorySearch.fallback = "none"`も設定します）。Gemini embeddingsを使いたい場合は、
    `memorySearch.provider = "gemini"`を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、local** embedding
    modelsをサポートしています。セットアップの詳細は[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClawで使用されるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClawの状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、config、workspaceはGatewayホスト
      （`~/.openclaw` + workspaceディレクトリ）上にあります。
    - **必要によりリモート:** モデルprovider（Anthropic/OpenAIなど）に送るメッセージは
      それらのAPIに送信され、チャットプラットフォーム（WhatsApp/Telegram/Slackなど）はメッセージデータを
      それぞれのサーバーに保存します。
    - **フットプリントは制御可能:** localモデルを使うとプロンプトは自分のマシン上に留まりますが、channel
      trafficは引き続きchannelのサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClawはデータをどこに保存しますか？">
    すべては`$OPENCLAW_STATE_DIR`配下にあります（デフォルト: `~/.openclaw`）:

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メインconfig（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシーOAuthインポート（初回使用時にauth profilesへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、APIキー、任意の`keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers向けの任意のファイル-backed secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（static `api_key` entriesはスクラブ済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + sessions）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor`により移行）。

    **workspace**（AGENTS.md、メモリファイル、Skillsなど）は別で、`agents.defaults.workspace`（デフォルト: `~/.openclaw/workspace`）経由で設定されます。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.mdはどこに置くべきですか？">
    これらのファイルは`~/.openclaw`ではなく、**agent workspace**にあります。

    - **Workspace（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の`HEARTBEAT.md`。
      小文字のルート`memory.md`はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix`で`MEMORY.md`へマージできます。
    - **State dir（`~/.openclaw`）**: config、channel/provider state、auth profiles、sessions、logs、
      共有Skills（`~/.openclaw/skills`）。

    デフォルトworkspaceは`~/.openclaw/workspace`で、次のように設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にbotが「忘れる」場合は、Gatewayが毎回同じ
    workspaceを使用していることを確認してください（そして注意: remote modeではローカルのラップトップではなく、
    **gateway hostの**workspaceが使われます）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、
    botに**AGENTS.mdまたはMEMORY.mdへ書き込む**よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace)と[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace**を**private** git repoに置き、privateな場所
    （例: GitHub private）にバックアップします。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「mind」を復元できます。

    `~/.openclaw`配下のもの（credentials、sessions、tokens、暗号化されたsecrets payloads）は**コミットしないでください**。
    完全復元が必要な場合は、workspaceとstate directoryの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClawを完全にアンインストールするには？">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはworkspaceの外で動作できますか？">
    はい。workspaceは**デフォルトcwd**でありメモリのアンカーであって、厳格なsandboxではありません。
    相対パスはworkspace内で解決されますが、sandboxingが有効でない限り、絶対パスは他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)またはエージェントごとのsandbox設定を使用してください。
    repoをデフォルト作業ディレクトリにしたい場合は、そのエージェントの
    `workspace`をrepo rootに向けます。OpenClaw repoは単なるソースコードです。
    エージェントをその中で動作させる意図がない限り、workspaceは分けておいてください。

    例（デフォルトcwdとしてのrepo）:

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

  <Accordion title="Remote mode: session storeはどこにありますか？">
    Session stateは**gateway host**が所有します。remote modeの場合、重要なsession storeはローカルのラップトップではなくリモートマシン上にあります。[Session management](/ja-JP/concepts/session)を参照してください。
  </Accordion>
</AccordionGroup>

## Configの基本

<AccordionGroup>
  <Accordion title="configの形式は何ですか？どこにありますか？">
    OpenClawは`$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の**JSON5** configを読み取ります:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace`のデフォルトworkspaceを含む）を使用します。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または"tailnet"）を設定したら、何もlistenされない / UIがunauthorizedと表示する'>
    Non-loopback bindには**有効なgateway auth pathが必要**です。実際には次を意味します:

    - shared-secret auth: tokenまたはpassword
    - 正しく設定されたidentity-aware reverse proxyの背後の`gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password`は、それだけではlocal gateway authを有効にしません。
    - Local call pathsは、`gateway.auth.*`が未設定の場合にのみ`gateway.remote.*`をfallbackとして使用できます。
    - password authでは、代わりに`gateway.auth.mode: "password"`に加えて`gateway.auth.password`（または`OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定され、解決できない場合、resolutionはfail closedになります（remote fallbackによるマスクなし）。
    - Shared-secret Control UIセットアップは、`connect.params.auth.token`または`connect.params.auth.password`（app/UI settingsに保存）で認証します。Tailscale Serveや`trusted-proxy`のようなidentity-bearing modesでは、代わりにrequest headersを使用します。shared secretsをURLに入れないでください。
    - `gateway.auth.mode: "trusted-proxy"`では、同一ホストのloopback reverse proxiesに明示的な`gateway.auth.trustedProxy.allowLoopback = true`と`gateway.trustedProxies`内のloopback entryが必要です。

  </Accordion>

  <Accordion title="なぜ今localhostでtokenが必要なのですか？">
    OpenClawはloopbackを含め、デフォルトでgateway authを強制します。通常のデフォルトパスでは、これはtoken authを意味します。明示的なauth pathが設定されていない場合、gateway startupはtoken modeに解決され、そのstartup用のruntime-only tokenを生成するため、**local WS clientsは認証が必要**です。再起動をまたいでclientsが安定したsecretを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または`OPENCLAW_GATEWAY_PASSWORD`を明示的に設定してください。これにより、他のローカルプロセスがGatewayを呼び出すのを防げます。

    別のauth pathを希望する場合は、password mode（またはidentity-aware reverse proxiesでは`trusted-proxy`）を明示的に選択できます。**本当に**open loopbackにしたい場合は、configで`gateway.auth.mode: "none"`を明示的に設定してください。Doctorはいつでもtokenを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="config変更後に再起動する必要がありますか？">
    Gatewayはconfigを監視し、hot-reloadをサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はhot-applyし、重要な変更では再起動する
    - `hot`、`restart`、`off`もサポートされています

  </Accordion>

  <Accordion title="面白いCLI taglineを無効にするには？">
    configで`cli.banner.taglineMode`を設定します:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: tagline textを非表示にしますが、banner title/version lineは維持します。
    - `default`: 毎回`All your chats, one OpenClaw.`を使用します。
    - `random`: 面白い/季節ごとのtaglineをローテーションします（デフォルト動作）。
    - bannerをまったく表示したくない場合は、env `OPENCLAW_HIDE_BANNER=1`を設定します。

  </Accordion>

  <Accordion title="web search（およびweb fetch）を有効にするには？">
    `web_fetch`はAPIキーなしで動作します。`web_search`は選択した
    providerに依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、TavilyなどのAPI-backed providersには、通常のAPIキーセットアップが必要です。
    - Ollama Web Searchはkey-freeですが、設定済みのOllama hostを使用し、`ollama signin`が必要です。
    - DuckDuckGoはkey-freeですが、非公式のHTML-based integrationです。
    - SearXNGはkey-free/self-hostedです。`SEARXNG_BASE_URL`または`plugins.entries.searxng.config.webSearch.baseUrl`を設定してください。

    **推奨:** `openclaw configure --section web`を実行し、providerを選択します。
    Environment alternatives:

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

    プロバイダー固有の Web 検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。
    従来の `tools.web.search.*` プロバイダーパスは互換性のため一時的にまだ読み込まれますが、新しい設定では使用しないでください。
    Firecrawl Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` 配下にあります。

    注記:

    - allowlist を使う場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から最初に準備済みの取得フォールバックプロバイダーを自動検出します。現時点で同梱されているプロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み込みます。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消去しました。どう復旧し、これを避ければよいですか？">
    `config.apply` は **設定全体**を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの意図しない上書きを防ぎます。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の設定全体を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway はフェイルクローズするかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担い、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、最後に正常と分かっている設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 最後に正常と分かっている設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - これが予期しない挙動だった場合は、バグを報告し、最後に分かっている設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が分からない場合は、まず `config.schema.lookup` を使用します。これは、浅いスキーマノードに加えて、ドリルダウン用の直下の子要約を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換え専用にしてください。
    - エージェント実行から所有者専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護対象の exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは引き続き拒否されます。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイス間で特化したワーカーを使う中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **ノード**と**エージェント**を組み合わせるものです。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Macs/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner 運用」、「個人データ」）向けの別々の頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要な場合に、メインエージェントからバックグラウンド作業を生成します。
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

    デフォルトは `false`（ヘッドフル）です。一部のサイトでは、ヘッドレスの方がボット対策チェックを引き起こしやすくなります。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトでは、ヘッドレスモードの自動化に対してより厳しくなります（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="Telegram、gateway、ノードの間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **gateway** によって処理されます。gateway がエージェントを実行し、ノードツールが必要な場合にのみ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → エージェント → `node.*` → ノード → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントはどのように自分のコンピューターへアクセスできますか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    典型的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続し、
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティの注意: macOS ノードをペアリングすると、そのマシンで `system.run` が可能になります。信頼するデバイスだけをペアリングし、[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが、返信がありません。次に何をすればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway の健全性: `openclaw status`
    - チャンネルの健全性: `openclaw channels status`

    次に、認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続する場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認します。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士（ローカル + VPS）を会話させられますか？">
    はい。組み込みの「ボット間」ブリッジはありませんが、いくつかの信頼できる方法で接続できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送り、あとは通常どおり Bot B に返信させます。

    **CLI ブリッジ（汎用）:** `openclaw agent --message ... --deliver` で別の Gateway を呼び出すスクリプトを実行し、もう一方のボットが待ち受けているチャットを対象にします。一方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないようにガードレールを追加します（メンション時のみ、チャンネル allowlist、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、それぞれが独自のワークスペース、モデルのデフォルト、ルーティングを持てます。これが通常のセットアップであり、エージェントごとに 1 つの VPS を実行するよりもはるかに安価で簡単です。

    別々の VPS は、強い分離（セキュリティ境界）が必要な場合や、共有したくない大きく異なる設定が必要な場合にのみ使用します。それ以外の場合は、1 つの Gateway を維持し、複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人用ラップトップ上のノードを使う利点はありますか？">
    はい。ノードはリモート Gateway からラップトップへ到達するための第一級の方法であり、シェルアクセス以上の機能を解放します。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、軽量です（小さな VPS や Raspberry Pi クラスの箱で十分です。4 GB RAM で十分です）。そのため、常時稼働ホストに加えて、ラップトップをノードとして使う構成が一般的です。

    - **受信 SSH は不要です。** ノードは Gateway WebSocket へ外向きに接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上のノード allowlist/承認によって制御されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ラップトップ上のノードホストを通じて Chrome をローカルで実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH はアドホックなシェルアクセスには問題ありませんが、継続的なエージェントワークフローとデバイス自動化にはノードの方が簡単です。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは gateway サービスを実行しますか？">
    いいえ。分離されたプロファイルを意図的に実行する場合（[複数の gateway](/ja-JP/gateway/multiple-gateways) を参照）を除き、ホストごとに実行する **gateway** は 1 つだけにしてください。ノードは gateway に接続する周辺機器です（iOS/Android ノード、またはメニューバーアプリの macOS「ノードモード」）。ヘッドレスノードホストと CLI 制御については、[Node ホスト CLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、ホストされた Plugin サーフェスの変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子要素の要約とともに確認する
    - `config.get`: 現在のスナップショット + ハッシュを取得する
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動する
    - `config.apply`: 設定全体を検証 + 置換する。可能な場合はホットリロードし、必要な場合は再起動する
    - オーナー専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否する。レガシーの `tools.bash.*` エイリアスは、同じ保護対象の exec パスに正規化される

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これはワークスペースを設定し、ボットをトリガーできる相手を制限する。

  </Accordion>

  <Accordion title="VPS で Tailscale を設定し、Mac から接続するには？">
    最小手順:

    1. **VPS にインストール + ログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストール + ログインする**
       - Tailscale アプリを使い、同じ tailnet にサインインする。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にすると、VPS に安定した名前が付く。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使う:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback にバインドされたままになり、Tailscale 経由で HTTPS が公開される。[Tailscale](/ja-JP/gateway/tailscale) を参照。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するには？">
    Serve は **Gateway Control UI + WS** を公開する。ノードは同じ Gateway WS エンドポイント経由で接続する。

    推奨設定:

    1. **VPS + Mac が同じ tailnet 上にあることを確認する**。
    2. **macOS アプリをリモートモードで使う**（SSH ターゲットには tailnet ホスト名を使用できる）。
       アプリは Gateway ポートをトンネルし、ノードとして接続する。
    3. **gateway でノードを承認する**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のラップトップにインストールするべきか、それともノードを追加するだけでよいか？">
    2台目のラップトップで **ローカルツール**（画面/カメラ/exec）だけが必要な場合は、
    **ノード**として追加する。これにより単一の Gateway を維持し、設定の重複を避けられる。ローカルノードツールは
    現在 macOS のみ対応だが、他の OS にも拡張する予定。

    **強い分離**または完全に別個の2つのボットが必要な場合にのみ、2つ目の Gateway をインストールする。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込むか？">
    OpenClaw は親プロセス（シェル、launchd/systemd、CI など）から環境変数を読み取り、さらに次を読み込む:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）からのグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしない。

    設定内でインライン環境変数を定義することもできる（プロセス環境に存在しない場合にのみ適用される）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位とソースについては [/environment](/ja-JP/help/environment) を参照。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えた。どうすればよいか？">
    よくある修正は2つ:

    1. 不足しているキーを `~/.openclaw/.env` に置く。これにより、サービスがシェル環境を継承しない場合でも取得される。
    2. シェルインポートを有効にする（任意の利便機能）:

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

    これはログインシェルを実行し、不足している想定キーだけをインポートする（上書きはしない）。対応する環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定したが、モデルのステータスに「Shell env: off.」と表示される。なぜ？'>
    `openclaw models status` は **シェル環境インポート** が有効かどうかを報告する。「Shell env: off」
    は環境変数が不足しているという意味では**ない**。OpenClaw がログインシェルを
    自動的に読み込まないという意味にすぎない。

    Gateway がサービス（launchd/systemd）として実行されている場合、シェル
    環境は継承されない。次のいずれかで修正する:

    1. トークンを `~/.openclaw/.env` に置く:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. またはシェルインポートを有効にする（`env.shellEnv.enabled: true`）。
    3. または設定の `env` ブロックに追加する（不足している場合にのみ適用）。

    その後 gateway を再起動して再確認する:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られる。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するには？">
    単独のメッセージとして `/new` または `/reset` を送信する。[セッション管理](/ja-JP/concepts/session) を参照。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされるか？">
    セッションは `session.idleMinutes` 後に期限切れにできるが、これは**デフォルトでは無効**（デフォルトは **0**）。
    アイドル期限切れを有効にするには、正の値に設定する。有効にすると、アイドル期間後の**次の**
    メッセージが、そのチャットキーに対して新しいセッション ID を開始する。
    これは transcript を削除しない。新しいセッションを開始するだけ。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を作る方法はありますか？">
    はい、**マルチエージェントルーティング**と**サブエージェント**で可能です。1 つのコーディネーター
    エージェントと、それぞれ独自のワークスペースとモデルを持つ複数のワーカーエージェントを作成できます。

    とはいえ、これは**楽しい実験**として捉えるのが最適です。トークン消費が大きく、多くの場合、
    セッションを分けた 1 つのボットを使うより効率が落ちます。私たちが想定している典型的なモデルは、
    1 つのボットと会話し、並列作業には異なるセッションを使う形です。その
    ボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルがあると、Compaction や切り詰めが発生することがあります。

    役立つこと:

    - 現在の状態を要約してファイルに書き込むようボットに依頼する。
    - 長いタスクの前に `/compact` を使い、トピックを切り替えるときは `/new` を使う。
    - 重要なコンテキストをワークスペースに置き、ボットに読み返すよう依頼する。
    - 長い作業や並列作業にはサブエージェントを使い、メインチャットを小さく保つ。
    - これが頻繁に起きる場合は、より大きなコンテキストウィンドウを持つモデルを選ぶ。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    reset コマンドを使います:

    ```bash
    openclaw reset
    ```

    非対話式の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    次にセットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注記:

    - 既存の設定がある場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir をリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発用設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます - リセットまたはコンパクト化するにはどうすればよいですか？'>
    次のいずれかを使います:

    - **コンパクト化**（会話は保持しつつ、古いターンを要約します）:

      ```
      /compact
      ```

      または、要約の方針を指定するために `/compact <instructions>` を使います。

    - **リセット**（同じチャットキーに対して新しいセッション ID を使います）:

      ```
      /new
      /reset
      ```

    繰り返し発生する場合:

    - 古いツール出力を削るために、**セッションプルーニング**（`agents.defaults.contextPruning`）を有効化または調整する。
    - より大きなコンテキストウィンドウを持つモデルを使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッションプルーニング](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    これはプロバイダーのバリデーションエラーです。モデルが必須の
    `input` なしで `tool_use` ブロックを出力しました。通常、セッション履歴が古いか破損していることを意味します（長いスレッド
    やツール/スキーマ変更の後によく発生します）。

    修正: `/new` を使って新しいセッションを開始します（単独メッセージ）。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth 認証を使う場合は **1h**）。調整または無効化できます:

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

    `HEARTBEAT.md` が存在していても実質的に空（空行と `# Heading` のような markdown
    見出しだけ）の場合、OpenClaw は API 呼び出しを節約するために Heartbeat 実行をスキップします。
    ファイルがない場合でも Heartbeat は実行され、モデルが何をするかを判断します。

    エージェントごとの上書きには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClaw は**あなた自身のアカウント**で動作するため、あなたがグループに入っていれば OpenClaw はそれを認識できます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    グループ返信をトリガーできるのを**自分だけ**にしたい場合:

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
    オプション 1（最速）: ログを追尾し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに設定済み/許可リスト済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります:

    - メンションゲートが有効（デフォルト）。ボットを @メンションする（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが許可リストに入っていない。

    [グループ](/ja-JP/channels/groups)と[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションに統合されます。グループ/チャンネルには独自のセッションキーがあり、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups)と[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な上限はありません。数十個（数百個でも）問題ありませんが、次に注意してください。

    - **ディスク増加:** セッションとトランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下にあります。
    - **トークンコスト:** エージェントが増えるほど、同時並行のモデル使用量が増えます。
    - **運用負荷:** エージェントごとの認証プロファイル、ワークスペース、チャンネルルーティング。

    ヒント:

    - エージェントごとに **アクティブ** なワークスペースを 1 つに保ちます（`agents.defaults.workspace`）。
    - ディスクが増える場合は、古いセッションを削除します（JSONL またはストアエントリを削除）。
    - `openclaw doctor` を使って、不要なワークスペースやプロファイルの不一致を見つけます。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）、またどう設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャンネル/アカウント/相手ごとにルーティングできます。Slack はチャンネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザーを実行するマシンで CDP を使います。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに 1 つのエージェント（バインディング）。
    - Slack チャンネルをそれらのエージェントにバインド。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、
    [ブラウザー](/ja-JP/tools/browser)、[ノード](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は [モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" なのに "Connectivity probe: failed" と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**側の見え方（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に Gateway WebSocket へ接続するものです。

    `openclaw gateway status` を使い、次の行を信頼してください。

    - `Probe target:`（プローブが実際に使用した URL）
    - `Listening:`（そのポートで実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートが待ち受けていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    サービスが別の設定ファイルで実行されている間に、別の設定ファイルを編集しています（多くの場合 `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" は何を意味しますか？'>
    OpenClaw は、起動直後に WebSocket リスナーをバインドすることでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでに待ち受けていることを示す `GatewayLockError` をスローします。

    修正: もう一方のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、リモート WebSocket URL を指定します。必要に応じて共有シークレットのリモート認証情報も指定できます。

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

    - `openclaw gateway` は、`gateway.mode` が `local` の場合のみ起動します（または上書きフラグを渡した場合）。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報のみです。それ自体ではローカル Gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI が "unauthorized" と表示する（または再接続し続ける）場合はどうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は、現在のブラウザータブセッションと選択された Gateway URL 用にトークンを `sessionStorage` に保持します。そのため、同じタブでの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュ済みデバイストークンで 1 回だけ制限付きの再試行を試みることができます。
    - そのキャッシュ済みトークンによる再試行では、デバイストークンと一緒に保存されたキャッシュ済み承認スコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを維持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、保存済みデバイストークン、最後にブートストラップトークンです。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップオペレーター許可リストはオペレーター要求のみを満たします。ノードやその他の非オペレーターロールには、引き続き自身のロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host`、その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であること、かつ Tailscale ID ヘッダーを迂回する生のループバック/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、設定済みの ID 対応プロキシ経由で来ていることを確認します。同一ホストのループバックプロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します。
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の 2 点を確認してください。
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、自分**自身**のデバイスしかローテーションできません
      - 明示的な `--scope` 値は、呼び出し元の現在のオペレータースコープを超えることはできません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが、バインドできず、何も待ち受けません">
    `tailnet` バインドは、ネットワークインターフェイスから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale 上にない（またはインターフェイスが停止している）場合、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動します（100.x アドレスを持つようにします）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用のバインドが必要な場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateways を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。冗長性（例: レスキューボット）や強い分離が必要な場合にのみ、複数の Gateways を使います。

    可能ですが、分離する必要があります。

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル設定で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`、レガシー `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 は何を意味しますか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信すると、**コード 1008**
    （ポリシー違反）で接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使用した。
    - プロキシまたはトンネルが認証ヘッダーを取り除いた、または Gateway ではない要求を送信した。

    クイック修正:

    1. WS URL を使います: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証が有効な場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使用している場合、URL は次のようになります。

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で安定したパスを設定できます。ファイルログレベルは `logging.level` によって制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` によって制御されます。

    最速のログ追尾:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーのログ（Gateway が launchd/systemd 経由で実行される場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。プロファイルは `~/.openclaw-<profile>/logs/...` を使用）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    Gateway ヘルパーを使用します。

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました - OpenClaw を再起動するにはどうすればよいですか？">
    **Windows のインストールモードは 2 つ**あります。

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入り、再起動します。

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

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows)、[Gateway サービス運用手順](/ja-JP/gateway)。

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

    - **Gateway ホスト**でモデル認証が読み込まれていません（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしています（チャンネル設定とログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれています。

    リモートの場合は、トンネル/Tailscale 接続が稼働しており、
    Gateway WebSocket に到達できることを確認してください。

    Docs: [チャンネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 次にどうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認事項:

    1. Gateway は実行中ですか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI に正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは稼働していますか？

    次にログを tail します:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ログとチャンネルステータスから始めます:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーと照合します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限まで減らし、より少ないコマンドで再試行しますが、それでも一部のメニュー項目を削除する必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上またはプロキシ配下にいる場合は、送信 HTTPS が許可され、`api.telegram.org` の DNS が機能することを確認してください。

    Gateway がリモートにある場合は、Gateway ホスト上のログを見ていることを確認してください。

    Docs: [Telegram](/ja-JP/channels/telegram), [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず、Gateway に到達でき、エージェントが実行できることを確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    Docs: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視対象サービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は、Ctrl-C で停止し、その後:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway サービスランブック](/ja-JP/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで Gateway を**フォアグラウンド**実行します。

    サービスをインストールしている場合は、Gateway コマンドを使用してください。一度だけの
    フォアグラウンド実行が必要な場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を最速で取得する方法">
    コンソールの詳細を増やすには、`--verbose` を付けて Gateway を起動します。次に、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分の skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、（独立した行として）`MEDIA:<path-or-url>` 行を含める必要があります。[OpenClaw アシスタント設定](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください:

    - 対象チャンネルが送信メディアに対応しており、許可リストによってブロックされていないこと。
    - ファイルがプロバイダーのサイズ制限内であること（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読み取れるホストローカルファイルを `MEDIA:` で送信できるようにしますが、メディアと安全なドキュメント種別（画像、音声、動画、PDF、Office ドキュメント）のみに限られます。プレーンテキストやシークレットらしきファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています:

    - DM 対応チャンネルでのデフォルト動作は**ペアリング**です:
      - 不明な送信者はペアリングコードを受け取り、ボットはそのメッセージを処理しません。
      - 承認: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルごとに 3 件**に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクのある DM ポリシーを表面化するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか？">
    いいえ。プロンプトインジェクションは、誰がボットに DM できるかだけでなく、**信頼できないコンテンツ**に関するものです。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは**送信者が自分だけ**でも起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを持ち出したり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はどちらも、抽出したテキストを生のファイルテキストとして渡すのではなく、
      明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リストを使う

    詳細: [セキュリティ](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="ボットに専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    ほとんどの設定では、はい。ボットを別のアカウントや電話番号で分離すると、
    問題が発生した場合の影響範囲が小さくなります。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを付与し、必要になったら
    後で拡張します。

    Docs: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing).

  </Accordion>

  <Accordion title="自分のテキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです:

    - DM は**ペアリングモード**または厳格な許可リストに保つ。
    - あなたの代わりにメッセージを送らせたい場合は、**別の番号またはアカウント**を使用する。
    - 下書きを作らせてから、**送信前に承認**する。

    試す場合は、専用アカウントで行い、分離したままにしてください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントタスクに安価なモデルを使用できますか？">
    はい、エージェントがチャット専用で、入力が信頼できる**場合**です。小さいティアは
    指示の乗っ取りに弱いため、ツール有効エージェントや信頼できないコンテンツを読む場合には避けてください。
    小さいモデルを使う必要がある場合は、ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに追加するか、そのアカウントで `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどのように機能しますか？">
    いいえ。デフォルトの WhatsApp DM ポリシーは**ペアリング**です。不明な送信者はペアリングコードを受け取るだけで、そのメッセージは**処理されません**。OpenClaw は、受信したチャットまたはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認します:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します:

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは自分の DM を許可するための**許可リスト/所有者**を設定するために使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージまたはツールメッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効な場合にのみ表示されます。

    表示されているチャットで修正します:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでも多すぎる場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使用していないことも確認してください。

    Docs: [思考と verbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを**単独のメッセージ**として送信します（スラッシュなし）:

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

    バックグラウンドプロセス（exec ツールからのもの）の場合は、エージェントに次を実行するよう依頼できます:

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は許可リストに含まれる送信者であればインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るにはどうすればよいですか？（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで**プロバイダー間**メッセージングをブロックします。ツール呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。

    エージェントのプロバイダー間メッセージングを有効にします:

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

  <Accordion title='ボットが連続メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、新しいメッセージが実行中の run とどのように相互作用するかを制御します。モードを変更するには `/queue` を使用します:

    - `steer` - 現在の run の次のモデル境界に向けて、保留中のすべてのステアリングをキューに入れる
    - `queue` - 従来の 1 件ずつのステアリング
    - `followup` - メッセージを 1 件ずつ実行する
    - `collect` - メッセージをまとめて 1 回だけ返信する
    - `steer-backlog` - 今すぐステアし、その後バックログを処理する
    - `interrupt` - 現在の run を中止し、新しく開始する

    デフォルトモードは `steer` です。フォローアップモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)と[Steering キュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う Anthropic のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを認証プロファイルに保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです（たとえば、`anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントに対応する想定された `auth-profiles.json` 内で、Gateway が Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？[Discord](https://discord.com/invite/clawd)で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions)を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期エラー
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状から始めるトリアージ
