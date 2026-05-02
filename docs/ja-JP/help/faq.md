---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - ユーザーから報告された問題を、より詳細なデバッグの前にトリアージする
summary: OpenClaw のセットアップ、構成、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-02T20:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

短い回答と、実運用環境（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けの詳しいトラブルシューティング。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/サービス到達性、エージェント/セッション、プロバイダー設定 + ランタイム問題（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは伏せ字）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   対応している場合はチャンネルプローブを含む、ライブ Gateway ヘルスプローブを実行します
   （到達可能な gateway が必要です）。[ヘルス](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追跡する**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行する（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示します
   ```

   実行中の gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回の Q&A — インストール、オンボーディング、認証経路、サブスクリプション、初期エラー —
は [初回 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは、ひと言で言うと何ですか？">
    OpenClaw は、自分のデバイス上で実行する個人用 AI アシスタントです。すでに使っているメッセージング画面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネル Plugin）で返信でき、対応プラットフォームでは音声 + ライブ Canvas も使えます。**Gateway** は常時稼働する制御プレーンで、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「ただの Claude ラッパー」ではありません。これは **ローカルファーストの制御プレーン**であり、すでに使っているチャットアプリから到達できる
    高機能なアシスタントを **自分のハードウェア** 上で実行でき、
    ステートフルなセッション、メモリ、ツールを使えます。ワークフローの制御をホスト型
    SaaS に渡す必要はありません。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、
      ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実チャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      さらに対応プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティング
      とフェイルオーバーで使用できます。
    - **ローカルのみの選択肢:** ローカルモデルを実行すれば、必要に応じて **すべてのデータを自分のデバイス上に保持** できます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとにエージェントを分け、それぞれに独自の
      ワークスペースとデフォルトを設定できます。
    - **オープンソースで改造可能:** ベンダーロックインなしで検査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway), [チャンネル](/ja-JP/channels), [マルチエージェント](/ja-JP/concepts/multi-agent),
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです - 最初に何をすべきですか？">
    最初のプロジェクトとして適しているもの:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリのプロトタイプを作る（概要、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分けて
    並列作業にサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な用途トップ 5 は何ですか？">
    日常的に効果が出やすい用途は、通常次のようなものです。

    - **個人向けブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **調査と下書き:** メールやドキュメント向けの簡単な調査、要約、初稿。
    - **リマインダーとフォローアップ:** Cron や Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス間連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **調査、評価、下書き** には有効です。サイトをスキャンし、候補リストを作成し、
    見込み客を要約し、アウトリーチや広告コピーの下書きを書けます。

    **アウトリーチや広告配信** では、人間を関与させてください。スパムを避け、地域の法律と
    プラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、
    OpenClaw に下書きさせ、自分で承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発における Claude Code との違いと利点は何ですか？">
    OpenClaw は **個人用アシスタント** であり調整レイヤーであって、IDE の代替ではありません。
    リポジトリ内で最速の直接コーディングループには Claude Code や Codex を使ってください。永続的なメモリ、
    デバイス横断アクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたぐ **永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働 Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用の **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理対象の上書きを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、管理対象の上書きは git に触れずに同梱 skills より優先されます。skill をグローバルにインストールする必要があるが一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。リポジトリに置いて PR として出すべきなのは、上流に取り込む価値がある編集だけです。
  </Accordion>

  <Accordion title="カスタムフォルダーから skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを追加します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。skill を特定のエージェントにだけ見せる必要がある場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現時点で対応しているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` 上書きを設定できます。
    - **サブエージェント**: デフォルトモデルが異なる別エージェントにタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中に bot が固まります。どうやってオフロードできますか？">
    長時間または並列のタスクには **サブエージェント** を使います。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    bot に「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が今何をしているか（およびビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord ではスレッド紐付けのサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットに紐付けることで、そのスレッド内のフォローアップメッセージを紐付け先セッションに維持できます。

    基本フロー:

    - `sessions_spawn` で `thread: true` を使って起動します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動で紐付けます。
    - `/agents` で紐付け状態を確認します。
    - 自動フォーカス解除を制御するには `/session idle <duration|off>` と `/session max-age <duration|off>` を使います。
    - スレッドを切り離すには `/unfocus` を使います。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
    - Discord 上書き: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動紐付け: `channels.discord.threadBindings.spawnSessions` のデフォルトは `true` です。スレッド紐付けセッションの起動を無効にするには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [設定リファレンス](/ja-JP/gateway/configuration-reference), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了更新が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決済みの依頼元ルートを確認します。

    - 完了モードのサブエージェント配信では、紐付け済みスレッドまたは会話ルートが存在する場合、それを優先します。
    - 完了元にチャンネルしか含まれていない場合、OpenClaw は依頼元セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が成功する可能性があります。
    - 紐付け済みルートも使用可能な保存済みルートも存在しない場合、直接配信は失敗する可能性があり、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューフォールバックまたは最終配信失敗が強制される場合があります。
    - 子の最後に見える assistant 返信が正確なサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い進捗を投稿する代わりに意図的にアナウンスを抑制します。
    - 子がツール呼び出しだけの後にタイムアウトした場合、アナウンスは生のツール出力を再生する代わりに、短い部分進捗要約にまとめられることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks), [セッションツール](/ja-JP/concepts/session-tool)。

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

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は発火したのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が想定されていないことを意味します。
    - アナウンス先（`channel` / `to`）がない、または無効な場合、ランナーは外向き配信をスキップします。
    - チャンネル認証の失敗（`unauthorized`、`Forbidden`）は、ランナーが配信を試みたものの、認証情報によりブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、ランナーはキュー済みのフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャット経路が利用可能な場合、エージェントは `message`
    ツールで直接送信できます。`--announce` が制御するのは、エージェントがまだ送信していない
    最終テキストに対するランナーのフォールバック経路だけです。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行がモデルを切り替えたり、一度リトライしたりしたのはなぜですか？">
    それは通常、重複スケジュールではなく、ライブのモデル切り替え経路です。

    分離 Cron は、アクティブな実行が `LiveSessionModelSwitchError` をスローしたときに、
    ランタイムモデルの引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルを保持し、その切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合、
    Cron はリトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデルオーバーライドが最優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済み Cron セッションのモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の切り替えリトライ後、
    Cron は永久にループする代わりに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、ワークスペースに Skills を配置します。macOS の Skills UI は Linux では利用できません。
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
    ディレクトリに書き込みます。自分の Skills を公開または同期したい場合にのみ、別個の `clawhub` CLI をインストールしてください。
    エージェント間で共有インストールするには、Skill を `~/.openclaw/skills` の下に置き、
    どのエージェントから見えるかを絞りたい場合は `agents.defaults.skills` または
    `agents.list[].skills` を使います。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに従って、またはバックグラウンドで継続的にタスクを実行できますか？">
    はい。Gateway スケジューラーを使用してください。

    - **Cron ジョブ**: スケジュール済みまたは繰り返しタスク用（再起動後も保持されます）。
    - **Heartbeat**: 「メインセッション」の定期チェック用。
    - **分離ジョブ**: 要約を投稿したりチャットへ配信したりする自律エージェント用。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必須バイナリによって制限され、Skills は **Gateway ホスト**で利用可能な場合にのみシステムプロンプトに表示されます。Linux では、ゲート制御をオーバーライドしない限り、`darwin` 専用 Skills（`apple-notes`、`apple-reminders`、`things-mac` など）は読み込まれません。

    サポートされるパターンは 3 つあります。

    **オプション A - Gateway を Mac で実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac の **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必須バイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を利用可能として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（高度）。**
    Gateway は Linux に置いたまま、必須 CLI バイナリが Mac 上で実行される SSH ラッパーに解決されるようにします。その後、Skill をオーバーライドして Linux を許可し、利用可能な状態に保ちます。

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

    4. Skills スナップショットが更新されるように新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion または HeyGen 連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API があります）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、シンプルなパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、それらの API を対象とする Skill を作成してください。

    Skills をインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で Skills を共有するには、`~/.openclaw/skills/<name>/SKILL.md` に配置します。共有インストールを一部のエージェントだけに見せる場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定します。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する組み込みの `user` ブラウザープロファイルを使用します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使いたい場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシンで Node ホストを実行するか、代わりにリモート CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルのみ対応しています
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker が制限されているように感じます - すべての機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、または同梱ブラウザーは含まれません。より完全なセットアップには:

    - キャッシュが保持されるように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに焼き込みます。
    - 同梱 CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい - プライベートトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非 main キー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、サンドボックス化されたセッションで利用可能なツールを `tools.sandbox.tools` で制限します。

    セットアップ手順 + 設定例: [グループ: 個人 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性のあるものには `:ro` を使用し、バインドはサンドボックスのファイルシステム壁を迂回することを忘れないでください。

    OpenClaw は、正規化されたパスと、存在する最も深い祖先を通じて解決された正準パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は閉じた状態で失敗し、シンボリックリンク解決後も許可ルートのチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)と[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の厳選された長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は、自動 Compaction の前に永続的なノートを書くようモデルに促すため、
    **サイレントな Compaction 前メモリフラッシュ**も実行します。これはワークスペースが
    書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これは現在も改善中の領域です。記憶を保存するようモデルに思い出させると役立ちます。
    モデルは何をすべきか把握します。忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、
    ストレージです。**セッションコンテキスト**は引き続きモデルのコンテキストウィンドウに
    制限されるため、長い会話は compact または切り詰められる可能性があります。そのため、
    メモリ検索が存在します - 関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings**を使用する場合のみ必要です。Codex OAuth はチャット/補完を対象とし、
    embeddings アクセスは**付与しません**。そのため、**Codex でサインイン（OAuth または
    Codex CLI ログイン）**しても、セマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    Provider を明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    Provider を自動選択します（auth profiles、`models.providers.*.apiKey`、または env vars）。
    OpenAI キーが解決できる場合は OpenAI を優先し、そうでなければ Gemini キーが
    解決できる場合は Gemini、次に Voyage、次に Mistral を使用します。リモートキーが
    利用できない場合、設定するまでメモリ検索は無効のままです。ローカルモデルパスが
    設定済みで存在する場合、OpenClaw は
    `local`を優先します。Ollama は
    `memorySearch.provider = "ollama"`を明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"`を設定します（必要に応じて
    `memorySearch.fallback = "none"`も設定します）。Gemini embeddings を使用したい場合は、
    `memorySearch.provider = "gemini"`を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** embedding
    モデルをサポートしています。セットアップの詳細は[Memory](/ja-JP/concepts/memory)を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置場所

<AccordionGroup>
  <Accordion title="OpenClaw で使用されるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、config、workspace は Gateway ホスト上にあります
      （`~/.openclaw` + workspace ディレクトリ）。
    - **必要によりリモート:** モデル Provider（Anthropic/OpenAI など）へ送信するメッセージは
      それらの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      サーバーに保存します。
    - **フットプリントは制御可能:** ローカルモデルを使用するとプロンプトは自分のマシン上に留まりますが、channel
      トラフィックは引き続き channel のサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべては`$OPENCLAW_STATE_DIR`配下にあります（デフォルト: `~/.openclaw`）:

    | Path                                                            | 目的                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン config（JSON5）                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に auth profiles へコピー）   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API キー、任意の `keyRef`/`tokenRef`）       |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef Provider 用の任意のファイル-backed secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリは scrub 済み）     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent ごとの state（agentDir + sessions）                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と state（agent ごと）                                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata（agent ごと）                                     |

    レガシーの単一 agent パス: `~/.openclaw/agent/*`（`openclaw doctor`により移行）。

    **workspace**（AGENTS.md、memory files、skills など）は別で、`agents.defaults.workspace`経由で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは`~/.openclaw`ではなく、**agent workspace**に置きます。

    - **Workspace（agent ごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の`HEARTBEAT.md`。
      小文字の root `memory.md`はレガシー修復入力専用です。両方のファイルが存在する場合、`openclaw doctor --fix`
      で`MEMORY.md`にマージできます。
    - **State dir（`~/.openclaw`）**: config、channel/provider state、auth profiles、sessions、logs、
      shared skills（`~/.openclaw/skills`）。

    デフォルト workspace は`~/.openclaw/workspace`で、次のように設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が毎回同じ
    workspace を使用して起動していることを確認してください（また、remote mode では自分のローカル laptop ではなく、**gateway host の**
    workspace が使われることに注意してください）。

    ヒント: 永続的な動作や preference が必要な場合は、chat history に頼るのではなく、ボットにそれを
    **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace)と[Memory](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace**を**private** git repo に置き、どこか private な場所
    （たとえば GitHub private）にバックアップしてください。これにより memory + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「mind」を復元できます。

    `~/.openclaw`配下のもの（credentials、sessions、tokens、encrypted secrets payloads）は**コミットしないでください**。
    完全復元が必要な場合は、workspace と state directory の両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    Docs: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="Agents は workspace の外で作業できますか？">
    はい。workspace は**デフォルト cwd**であり memory anchor ですが、厳密な sandbox ではありません。
    相対パスは workspace 内で解決されますが、sandboxing が有効でない限り、絶対パスは他の
    host location にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)または agent ごとの sandbox settings を使用してください。Repo をデフォルトの作業ディレクトリにしたい場合は、その agent の
    `workspace`を repo root に向けます。OpenClaw repo は単なるソースコードです。agent にそこで作業させる意図がない限り、
    workspace は分けておいてください。

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

  <Accordion title="Remote mode: session store はどこにありますか？">
    Session state は**gateway host**が所有します。remote mode の場合、重要な session store は自分のローカル laptop ではなく、リモートマシン上にあります。[Session management](/ja-JP/concepts/session)を参照してください。
  </Accordion>
</AccordionGroup>

## Config の基本

<AccordionGroup>
  <Accordion title="Config の形式は何ですか？どこにありますか？">
    OpenClaw は任意の**JSON5** config を`$OPENCLAW_CONFIG_PATH`から読み込みます（デフォルト: `~/.openclaw/openclaw.json`）:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace`のデフォルト workspace を含む）を使用します。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら、何も listen しない / UI が unauthorized と表示します'>
    Non-loopback bind には**有効な gateway auth path が必要**です。実際には次を意味します:

    - shared-secret auth: token または password
    - 正しく設定された identity-aware reverse proxy の背後での`gateway.auth.mode: "trusted-proxy"`

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

    Notes:

    - `gateway.remote.token` / `.password`は、それだけでは local gateway auth を有効にしません。
    - Local call paths は、`gateway.auth.*`が未設定の場合にのみ fallback として`gateway.remote.*`を使用できます。
    - Password auth の場合は、代わりに`gateway.auth.mode: "password"`と`gateway.auth.password`（または`OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password`が SecretRef 経由で明示的に設定され、未解決の場合、解決は fail closed します（remote fallback による masking はありません）。
    - Shared-secret Control UI setups は、`connect.params.auth.token`または`connect.params.auth.password`（app/UI settings に保存）で認証します。Tailscale Serve や`trusted-proxy`のような identity-bearing modes は、代わりに request headers を使用します。URL に shared secrets を入れないでください。
    - `gateway.auth.mode: "trusted-proxy"`では、same-host loopback reverse proxies には明示的な`gateway.auth.trustedProxy.allowLoopback = true`と、`gateway.trustedProxies`内の loopback entry が必要です。

  </Accordion>

  <Accordion title="なぜ今は localhost でも token が必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで gateway auth を強制します。通常のデフォルトパスでは token auth を意味します。明示的な auth path が設定されていない場合、gateway startup は token mode に解決され、自動生成した token を`gateway.auth.token`に保存するため、**local WS clients は認証が必要**です。これにより、他の local processes が Gateway を呼び出すことを防ぎます。

    別の auth path を希望する場合は、password mode（または identity-aware reverse proxies 用に`trusted-proxy`）を明示的に選択できます。**本当に** open loopback にしたい場合は、config で`gateway.auth.mode: "none"`を明示的に設定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="Config を変更した後に再起動する必要がありますか？">
    Gateway は config を監視し、hot-reload をサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply し、重要な変更では再起動します
    - `hot`、`restart`、`off`もサポートされています

  </Accordion>

  <Accordion title="面白い CLI taglines を無効にするには？">
    Config で`cli.banner.taglineMode`を設定します:

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
    - `default`: 毎回`All your chats, one OpenClaw.`を使用します。
    - `random`: ローテーションする面白い/季節向け taglines（デフォルト動作）。
    - バナーをまったく表示したくない場合は、env `OPENCLAW_HIDE_BANNER=1`を設定します。

  </Accordion>

  <Accordion title="Web search（および web fetch）を有効にするには？">
    `web_fetch`は API キーなしで動作します。`web_search`は選択した
    Provider に依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API-backed Provider には、通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama host を使用し、`ollama signin`が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML-based integration です。
    - SearXNG はキー不要/self-hosted です。`SEARXNG_BASE_URL`または`plugins.entries.searxng.config.webSearch.baseUrl`を設定してください。

    **推奨:** `openclaw configure --section web`を実行し、Provider を選択してください。
    Environment alternatives:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY`または`MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または`MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY`または`OPENROUTER_API_KEY`
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

    - 許可リストを使う場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、最初に準備完了している取得フォールバックプロバイダーを自動検出します。現在、バンドルされているプロバイダーは Firecrawl です。
    - デーモンは環境変数を `~/.openclaw/.env`（またはサービス環境）から読み込みます。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で設定が消えました。どう復旧し、どう回避できますか？">
    `config.apply` は**設定全体**を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みでは、書き込み前に変更後の設定全体を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway は最後に正常と確認された設定を復元し、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。
    - メインエージェントは復旧後に起動警告を受け取り、不正な設定を盲目的に再度書き込まないようにします。

    復旧:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`、`Config write rejected:`、または `config reload restored last-known-good config` を確認します。
    - 有効な設定の隣にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - 復元された有効な設定が動作する場合はそのまま保持し、意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - `openclaw config validate` と `openclaw doctor` を実行します。
    - 最後に正常と確認された設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - これが予期しない動作だった場合は、バグを報告し、最後に把握している設定またはバックアップを含めます。
    - ローカルのコーディングエージェントは、多くの場合ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。これは浅いスキーマノードと、掘り下げ用の直下の子要約を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置換専用にしてください。
    - エージェント実行から所有者専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護対象の実行パスへ正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定ウィザード](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="専用ワーカーを複数デバイスにまたがって使う中央 Gateway を実行するには？">
    一般的な構成は、**1 つの Gateway**（例: Raspberry Pi）と**ノード**および**エージェント**です。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特殊な役割（例: 「Hetzner 運用」、「個人データ」）向けの分離された頭脳/ワークスペースです。
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

    デフォルトは `false`（表示あり）です。ヘッドレスは、一部のサイトでボット対策チェックを誘発しやすくなります。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトでは、ヘッドレスモードでの自動化により厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うには？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースブラウザー）に設定し、Gateway を再起動します。
    詳細な設定例は[ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser)を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="コマンドは Telegram、Gateway、ノード間でどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、
    ノードツールが必要な場合にのみ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → エージェント → `node.*` → ノード → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノードはノード RPC 呼び出しだけを受信します。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは自分のコンピューターにどうアクセスできますか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**SSH 経由のリモート**モード（または直接 tailnet）で接続し、
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS ノードをペアリングすると、そのマシンで `system.run` が許可されます。信頼できるデバイスだけをペアリングし、[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続済みですが返信がありません。次に何をすればよいですか？">
    基本事項を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway のヘルス: `openclaw status`
    - チャンネルのヘルス: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動していて正しいポートを指していることを確認します。
    - 許可リスト（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士（ローカル + VPS）は通信できますか？">
    はい。組み込みの「ボット間」ブリッジはありませんが、信頼できる方法でいくつか接続できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    ボット A からボット B にメッセージを送信し、その後は通常どおりボット B に返信させます。

    **CLI ブリッジ（汎用）:** 他方の Gateway を `openclaw agent --message ... --deliver` で呼び出すスクリプトを実行し、
    他方のボットが待ち受けているチャットを対象にします。片方のボットがリモート VPS 上にある場合は、
    SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限にループしないよう、ガードレールを追加します（メンション時のみ、チャンネル許可リスト、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントには別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、それぞれ独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップで、エージェントごとに 1 つの VPS を実行するよりもはるかに安価でシンプルです。

    強い分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定が必要な場合にのみ、別々の VPS を使用します。それ以外の場合は 1 つの Gateway を維持し、
    複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人用ラップトップ上のノードを使う利点はありますか？">
    はい。ノードはリモート Gateway からラップトップに到達するための第一級の方法であり、
    シェルアクセス以上のものを可能にします。Gateway は macOS/Linux（Windows は WSL2 経由）で実行でき、
    軽量です（小さな VPS や Raspberry Pi クラスの箱で十分です。4 GB RAM で十分です）。そのため、常時稼働ホストとラップトップをノードにする構成が一般的です。

    - **受信 SSH は不要です。** ノードは Gateway WebSocket へ外向きに接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上のノード許可リスト/承認によって制限されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置きつつ、ラップトップ上のノードホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続できます。

    SSH はアドホックなシェルアクセスには問題ありませんが、継続的なエージェントワークフローとデバイス自動化にはノードのほうがシンプルです。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き、ホストごとに実行すべき **Gateway は 1 つだけ**です（[複数の Gateway](/ja-JP/gateway/multiple-gateways)を参照）。ノードは Gateway に接続する周辺機器です（iOS/Android ノード、または macOS メニューバーアプリの「ノードモード」）。ヘッドレスノードホストと CLI 制御については、[ノードホスト CLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子要約とともに調べます
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 設定全体を検証 + 置換します。可能な場合はホットリロードし、必要な場合は再起動します
    - 所有者専用の `gateway` ランタイムツールは引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは同じ保護対象の実行パスへ正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限の妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これによりワークスペースを設定し、誰が bot をトリガーできるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale をセットアップして Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストールしてログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログインする**
       - Tailscale アプリを使用し、同じ tailnet にサインインします。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にして、VPS が安定した名前を持つようにします。
    4. **tailnet ホスト名を使用する**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使用します:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより Gateway は loopback にバインドされたままになり、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac Node をリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。Node は同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS と Mac が同じ tailnet 上にあることを確認します**。
    2. **リモートモードで macOS アプリを使用します**（SSH ターゲットには tailnet ホスト名を使用できます）。
       アプリは Gateway ポートをトンネルし、Node として接続します。
    3. Gateway で **Node を承認**します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか、それとも Node を追加するだけでよいですか？">
    2 台目のノート PC で **ローカルツール**（画面/カメラ/exec）だけが必要な場合は、**Node** として追加します。これにより単一の Gateway を維持でき、設定の重複を避けられます。ローカル Node ツールは現在 macOS のみですが、他の OS にも拡張する予定です。

    2 つ目の Gateway をインストールするのは、**強い分離**または完全に分かれた 2 つの bot が必要な場合だけです。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに以下を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）からのグローバル fallback `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。

    config で inline env vars を定義することもできます（process env に存在しない場合のみ適用）:

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

  <Accordion title="service 経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    一般的な修正は 2 つあります:

    1. 不足しているキーを `~/.openclaw/.env` に入れて、service が shell env を継承しない場合でも取得されるようにします。
    2. shell import を有効にします（opt-in の利便機能）:

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

    これはログイン shell を実行し、不足している想定キーのみを import します（決して上書きしません）。対応する env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off" は環境変数が不足しているという意味ではありません。OpenClaw がログイン shell を自動的に読み込まないという意味です。

    Gateway が service（launchd/systemd）として実行されている場合、shell 環境は継承されません。次のいずれかで修正します:

    1. token を `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効にします。
    3. または config の `env` block に追加します（存在しない場合のみ適用）。

    その後 Gateway を再起動し、再確認します:

    ```bash
    openclaw models status
    ```

    Copilot token は `COPILOT_GITHUB_TOKEN`（また `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数の chat

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    standalone message として `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送らない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` 後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルトは **0**）。
    idle expiry を有効にするには正の値を設定します。有効な場合、idle period 後の**次の**メッセージで、その chat key の新しい session id が開始されます。
    これは transcript を削除しません。単に新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数の agent）を作る方法はありますか？">
    はい、**multi-agent routing** と **sub-agent** を使います。1 つの coordinator agent と、独自の workspace と model を持つ複数の worker agent を作成できます。

    とはいえ、これは**楽しい実験**として見るのが最適です。token を多く消費し、個別の session を持つ 1 つの bot を使うより効率が低いことがよくあります。私たちが想定する典型的な model は、会話する bot は 1 つで、parallel work には別々の session を使う形です。その bot は必要に応じて sub-agent を生成することもできます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent)、[Sub-agent](/ja-JP/tools/subagents)、[Agents CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="task の途中で context が切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    session context は model window によって制限されます。長い chat、大きな tool output、多数の file によって Compaction や truncation が発生することがあります。

    役立つこと:

    - bot に現在の状態を要約して file に書くよう依頼します。
    - 長い task の前に `/compact` を使い、topic を切り替えるときは `/new` を使います。
    - 重要な context は workspace に保持し、bot に読み返すよう依頼します。
    - 長い作業や並列作業には sub-agent を使い、main chat を小さく保ちます。
    - これが頻繁に起きる場合は、より大きな context window を持つ model を選びます。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    reset command を使用します:

    ```bash
    openclaw reset
    ```

    非対話式の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後 setup を再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - 既存の config が見つかった場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - profile（`--profile` / `OPENCLAW_PROFILE`）を使用していた場合は、各 state dir を reset してください（デフォルトは `~/.openclaw-<profile>`）。
    - Dev reset: `openclaw gateway --dev --reset`（dev のみ。dev config + credentials + sessions + workspace を消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ています。reset または compact するにはどうすればよいですか？'>
    次のいずれかを使用します:

    - **Compact**（会話を保持しながら古い turn を要約します）:

      ```
      /compact
      ```

      または summary を誘導するには `/compact <instructions>`。

    - **Reset**（同じ chat key の新しい session ID）:

      ```
      /new
      /reset
      ```

    続く場合:

    - 古い tool output を trim するために **session pruning**（`agents.defaults.contextPruning`）を有効化または調整します。
    - より大きな context window を持つ model を使用します。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[Session pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これは provider validation error です。model が必須の `input` を持たない `tool_use` block を出力したことを意味します。通常は session history が古いか破損していることを示します（長い thread や tool/schema の変更後によく発生します）。

    修正: `/new`（standalone message）で新しい session を開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat message が届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth auth を使用する場合は **1h**）。調整または無効化できます:

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

    `HEARTBEAT.md` が存在していても実質的に空（空行と `# Heading` のような markdown header のみ）の場合、OpenClaw は API call を節約するため Heartbeat run をスキップします。
    file が存在しない場合でも Heartbeat は実行され、model が何をするかを決定します。

    agent ごとの override には `agents.list[].heartbeat` を使用します。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp group に "bot account" を追加する必要がありますか？'>
    いいえ。OpenClaw は**あなた自身のアカウント**で実行されるため、あなたが group に参加していれば OpenClaw はそれを見ることができます。
    デフォルトでは、sender を許可するまで group reply はブロックされます（`groupPolicy: "allowlist"`）。

    **あなた**だけが group reply をトリガーできるようにしたい場合:

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

  <Accordion title="WhatsApp group の JID を取得するにはどうすればよいですか？">
    オプション 1（最速）: log を tail し、group で test message を送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに設定済み/allowlist 済みの場合）: config から group を一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[Log](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw が group で返信しないのはなぜですか？">
    一般的な原因は 2 つあります:

    - mention gating が on です（デフォルト）。bot に @mention する必要があります（または `mentionPatterns` に一致させる必要があります）。
    - `channels.whatsapp.groups` を `"*"` なしで設定していて、その group が allowlist されていません。

    [Group](/ja-JP/channels/groups) と [Group message](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="group/thread は DM と context を共有しますか？">
    direct chat はデフォルトで main session に集約されます。group/channel には独自の session key があり、Telegram topic / Discord thread は別 session です。[Group](/ja-JP/channels/groups) と [Group message](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="いくつの workspace と agent を作成できますか？">
    厳密な制限はありません。数十（数百でも）問題ありませんが、次に注意してください:

    - **Disk growth:** session + transcript は `~/.openclaw/agents/<agentId>/sessions/` 配下に置かれます。
    - **Token cost:** agent が増えるほど同時 model usage が増えます。
    - **Ops overhead:** agent ごとの auth profile、workspace、channel routing。

    Tips:

    - agent ごとに **active** workspace を 1 つ保持します（`agents.defaults.workspace`）。
    - disk が増えた場合は古い session を prune します（JSONL または store entry を削除）。
    - stray workspace や profile mismatch を見つけるには `openclaw doctor` を使用します。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）。また、どう設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャンネル/アカウント/ピアごとにルーティングできます。Slack はチャンネルとしてサポートされ、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることは何でもできる」わけではありません。アンチボット、CAPTCHA、MFA により、
    自動化がまだブロックされる場合があります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザーを実行しているマシンで CDP を使ってください。

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

モデルの Q&A（デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル）は、
[モデル FAQ](/ja-JP/help/faq-models)にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が「Runtime: running」と表示するのに「Connectivity probe: failed」と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**の視点（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に gateway WebSocket へ接続する確認です。

    `openclaw gateway status` を使い、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使用した URL）
    - `Listening:`（ポート上で実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートがリッスンしていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が異なるのはなぜですか？'>
    ある config ファイルを編集している一方で、サービスは別のものを実行しています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は起動時に WebSocket リスナーを即座にバインドすることで、実行時ロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでにリッスンしていることを示す `GatewayLockError` をスローします。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するには？">
    `gateway.mode: "remote"` を設定し、リモート WebSocket URL を指定します。必要に応じて共有シークレットのリモート認証情報も指定できます:

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

    - `openclaw gateway` は `gateway.mode` が `local` の場合のみ起動します（またはオーバーライドフラグを渡した場合）。
    - macOS アプリは config ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報のみです。それだけでローカル Gateway 認証が有効になるわけではありません。

  </Accordion>

  <Accordion title='Control UI が「unauthorized」と表示します（または再接続を繰り返します）。どうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザータブセッションと選択された gateway URL 用のトークンを `sessionStorage` に保持するため、同じタブの更新は、長期間保持される localStorage のトークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返す場合、信頼済みクライアントはキャッシュされたデバイストークンで 1 回だけ制限付きの再試行を試みることができます。
    - そのキャッシュトークン再試行では、デバイストークンと一緒に保存されたキャッシュ済み承認スコープが再利用されるようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを引き続き保持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップ operator 許可リストは operator リクエストだけを満たします。node やその他の非 operator ロールには、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、先にトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、対応するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効になっていること、Tailscale ID ヘッダーを迂回する生の loopback/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の gateway URL ではなく、設定済みの ID 対応プロキシ経由でアクセスしていることを確認します。同一ホストの loopback プロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、2 点を確認してください:
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自分自身の**デバイスだけをローテーションできます
      - 明示的な `--scope` 値は、呼び出し元の現在の operator スコープを超えることはできません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting)に従ってください。認証の詳細は[ダッシュボード](/ja-JP/web/dashboard)を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、バインドできず何もリッスンしません">
    `tailnet` バインドは、ネットワークインターフェースから Tailscale IP を選びます（100.64.0.0/10）。マシンが Tailscale 上にない（またはインターフェースがダウンしている）場合、バインド先はありません。

    修正:

    - そのホストで Tailscale を起動します（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet のみのバインドが必要な場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホスト上で複数の Gateway を実行できますか？">
    通常は不要です。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長性（例: レスキューボット）や厳密な分離が必要な場合にのみ使ってください。

    可能ですが、分離が必要です:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの config）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイック設定（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル config で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にも接尾辞を付けます（`ai.openclaw.<profile>`、レガシー `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信した場合、接続を
    **コード 1008**（ポリシー違反）で閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使った。
    - プロキシまたはトンネルが認証ヘッダーを削除した、または Gateway ではないリクエストを送信した。

    クイック修正:

    1. WS URL を使います: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証が有効な場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使っている場合、URL は次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ロギングとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で安定したパスを設定できます。ファイルログレベルは `logging.level` で制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追尾:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ（gateway が launchd/systemd 経由で実行されている場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。プロファイルは `~/.openclaw-<profile>/logs/...` を使います）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを起動/停止/再起動するには？">
    gateway ヘルパーを使います:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway)を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するには？">
    **2 つの Windows インストールモード**があります:

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

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

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行する場合（サービスなし）は、次を使います:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows)、[Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信が届きません。何を確認すべきですか？">
    まず簡単なヘルスチェックから始めます:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - モデル認証が **gateway ホスト**に読み込まれていない（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル config + ログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が起動しており、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャンネル](/ja-JP/channels)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)、[リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」 - どうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください:

    1. Gateway は実行中ですか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI に正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは有効ですか？

    次にログを追跡します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ログとチャネルの状態から始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の制限まで切り詰め、コマンド数を減らして再試行しますが、それでも一部のメニュー項目を削除する必要があります。plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上、またはプロキシ配下にいる場合は、送信 HTTPS が許可され、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず Gateway に到達でき、エージェントが実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では `/status` を使って現在の状態を確認します。チャット
    チャネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールした場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視付きサービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は Ctrl-C で停止してから、次を実行します。

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway サービス runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで Gateway を **フォアグラウンド** 実行します。

    サービスをインストールした場合は、gateway コマンドを使用します。一度限りの
    フォアグラウンド実行が必要な場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を素早く取得する方法">
    より詳しいコンソール情報を得るには、`--verbose` を付けて Gateway を起動します。次に、チャネル認証、モデルルーティング、RPC エラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="Skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、（単独行の）`MEDIA:<path-or-url>` 行を含める必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI での送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください。

    - 対象チャネルが送信メディアをサポートしており、許可リストでブロックされていないこと。
    - ファイルがプロバイダーのサイズ制限内であること（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読み取れるホストローカルファイルを `MEDIA:` で送信できるようにしますが、対象はメディアと安全なドキュメント種類（画像、音声、動画、PDF、Office ドキュメント）のみです。プレーンテキストやシークレットらしいファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを下げるように設計されています。

    - DM 対応チャネルでのデフォルト動作は **ペアリング** です。
      - 不明な送信者にはペアリングコードが送られます。bot はそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは **チャネルごとに 3 件** に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクの高い DM ポリシーを表示するには `openclaw doctor` を実行します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開 bot だけの問題ですか？">
    いいえ。プロンプトインジェクションは、bot に DM できる人だけでなく、**信頼できないコンテンツ** の問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは **送信者が自分だけ** の場合でも起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を小さくするには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「reader」エージェントを使用する
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses の
      `input_file` とメディア添付ファイル抽出は、抽出したテキストを生のファイルテキストとして渡すのではなく、
      明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リスト

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="bot には専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    はい、多くのセットアップでは推奨されます。bot を別アカウントや別電話番号で分離すると、
    何か問題が起きた場合の影響範囲を小さくできます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたり、アクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントだけにアクセスを与え、
    必要になったら後で拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は **推奨しません**。最も安全なパターンは次のとおりです。

    - DM を **ペアリングモード** または厳密な許可リストに保つ。
    - 自分の代わりにメッセージを送らせたい場合は、**別の番号またはアカウント** を使用する。
    - 下書きさせてから、**送信前に承認** する。

    試したい場合は、専用アカウントで行い、分離したままにしてください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で入力が信頼できる場合に限ります。小さいティアは
    指示の乗っ取りを受けやすいため、ツール有効エージェントや信頼できないコンテンツを読む場合には
    避けてください。小さいモデルを使う必要がある場合は、ツールをロックダウンし、
    サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードが送信されるのは、不明な送信者が bot にメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合 **のみ** です。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに追加するか、そのアカウントで `dmPolicy: "open"` を設定します。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどのように機能しますか？">
    いいえ。デフォルトの WhatsApp DM ポリシーは **ペアリング** です。不明な送信者はペアリングコードだけを受け取り、そのメッセージは **処理されません**。OpenClaw は、受信したチャット、またはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: 自分の DM を許可するための **許可リスト/所有者** を設定するために使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージやツールメッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもノイズが多い場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定します。また、config で `verboseDefault` が `on` に設定された bot プロファイルを使用していないことも確認してください。

    ドキュメント: [思考と verbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを **単独のメッセージ**（スラッシュなし）として送信します。

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

    （exec ツールからの）バックグラウンドプロセスについては、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる **単独** のメッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は、許可リストに含まれる送信者であればインラインでも機能します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るにはどうすればよいですか？（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで **プロバイダー間** メッセージングをブロックします。ツール呼び出しが
    Telegram に紐付いている場合、明示的に許可しない限り Discord には送信されません。

    エージェントのプロバイダー間メッセージングを有効にします。

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

    config を編集したら Gateway を再起動してください。

  </Accordion>

  <Accordion title='bot が連続メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、新しいメッセージが実行中の run とどう相互作用するかを制御します。モードを変更するには `/queue` を使用します。

    - `steer` - 現在の run の次のモデル境界に向けて、保留中の steering をすべてキューに入れる
    - `queue` - 従来の 1 回ずつの steering
    - `followup` - メッセージを 1 つずつ実行する
    - `collect` - メッセージをまとめて 1 回返信する
    - `steer-backlog` - 今すぐ steer し、その後 backlog を処理する
    - `interrupt` - 現在の run を中止して新しく開始する

    デフォルトモードは `steer` です。followup モードでは、`debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [Steering キュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='Anthropic で API キーを使う場合のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または auth profiles に Anthropic API キーを保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものになります（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合は、実行中のエージェント用の想定される `auth-profiles.json` 内で、Gateway が Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しない場合は、[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、auth profiles
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
