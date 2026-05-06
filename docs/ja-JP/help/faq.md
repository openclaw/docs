---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイム サポートに関する質問への回答
    - 詳細なデバッグの前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-06T17:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

実運用のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのクイック回答と、より深いトラブルシューティングです。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル概要: OS + 更新、gateway/service 到達性、agents/sessions、provider config + runtime issues（gateway に到達可能な場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは秘匿）。

3. **Daemon + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor ランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャネルプローブを含め、Gateway のライブヘルスプローブを実行します
   （到達可能な Gateway が必要）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追跡**

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

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回実行セットアップ

初回実行の Q&A — インストール、オンボーディング、認証ルート、サブスクリプション、初期失敗 —
は [初回実行 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw は、自分のデバイス上で実行する個人用 AI アシスタントです。普段使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、および QQ Bot などのバンドル済みチャネル Plugin）で返信でき、サポート対象プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働のコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw は「単なる Claude ラッパー」ではありません。すでに使っているチャットアプリから到達可能な、高性能なアシスタントを **自分のハードウェア** 上で実行できる **ローカルファーストのコントロールプレーン** です。ステートフルなセッション、メモリ、ツールを備え、ワークフローの制御をホスト型 SaaS に渡さずに利用できます。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、ワークスペース + セッション履歴をローカルに保持します。
    - **Web サンドボックスではなく実チャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、サポート対象プラットフォームでモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティングとフェイルオーバーで利用できます。
    - **ローカル専用オプション:** 必要であればローカルモデルを実行し、**すべてのデータを自分のデバイス上に保持** できます。
    - **マルチエージェントルーティング:** チャネル、アカウント、タスクごとにエージェントを分け、それぞれ独自のワークスペースとデフォルトを持たせます。
    - **オープンソースで改造可能:** ベンダーロックインなしで、確認、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    最初のプロジェクトとして適しているもの:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリをプロトタイプする（概要、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも処理できますが、フェーズに分け、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    日常的な成果は、通常次のようなものです。

    - **個人ブリーフィング:** 受信トレイ、カレンダー、関心のあるニュースの要約。
    - **調査と下書き:** 簡単な調査、要約、メールやドキュメントの初稿。
    - **リマインダーとフォローアップ:** Cron や Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **クロスデバイス連携:** 電話からタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取ります。

  </Accordion>

  <Accordion title="Can OpenClaw help with lead gen, outreach, ads, and blogs for a SaaS?">
    **調査、評価、下書き** には対応できます。サイトをスキャンし、候補リストを作成し、
    見込み客を要約し、アウトリーチや広告コピーの下書きを作成できます。

    **アウトリーチや広告配信** では、人間をループに入れてください。スパムを避け、地域の法律と
    プラットフォームポリシーに従い、送信前にすべて確認してください。最も安全なパターンは、
    OpenClaw に下書きさせ、あなたが承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="What are the advantages vs Claude Code for web development?">
    OpenClaw は **個人アシスタント** であり調整レイヤーであって、IDE の置き換えではありません。リポジトリ内で最速の直接コーディングループを行うには
    Claude Code または Codex を使ってください。永続メモリ、クロスデバイスアクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたぐ **永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働 Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用 **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="How do I customize skills without keeping the repo dirty?">
    リポジトリのコピーを編集する代わりに、管理対象のオーバーライドを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` なので、管理対象オーバーライドは git に触れずにバンドル済み Skills より優先されます。Skills をグローバルにインストールする必要があるものの一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。リポジトリに置いて PR として出すべきなのは、上流に取り込む価値がある編集だけです。
  </Accordion>

  <Accordion title="Can I load skills from a custom folder?">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを追加します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでそれを `<workspace>/skills` として扱います。その Skills を特定のエージェントにだけ見せる必要がある場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="How can I use different models for different tasks?">
    現在サポートされているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: デフォルトモデルが異なる別エージェントにタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="The bot freezes while doing heavy work. How do I offload that?">
    長時間または並列のタスクには **サブエージェント** を使います。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    bot に「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が現在何をしているか（およびビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="How do thread-bound subagent sessions work on Discord?">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットにバインドできるため、そのスレッド内のフォローアップメッセージはバインドされたセッションに残ります。

    基本フロー:

    - `thread: true` を使って `sessions_spawn` で起動します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインド状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動 unfocus を制御します。
    - `/unfocus` でスレッドを切り離します。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSessions` はデフォルトで `true` です。スレッドバインドのセッション起動を無効化するには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="A subagent finished, but the completion update went to the wrong place or never posted. What should I check?">
    まず解決済みの requester ルートを確認します。

    - 完了モードのサブエージェント配信では、バインドされたスレッドまたは会話ルートが存在する場合、それが優先されます。
    - 完了元がチャネルだけを持つ場合、OpenClaw は requester セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信は引き続き成功できます。
    - バインド済みルートも使用可能な保存済みルートも存在しない場合、直接配信は失敗することがあり、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューフォールバックまたは最終的な配信失敗を強制する場合があります。
    - 子の最後に表示された assistant 返信が正確なサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` である場合、OpenClaw は古い進捗を投稿する代わりに意図的にアナウンスを抑制します。
    - 子がツール呼び出しだけの後でタイムアウトした場合、アナウンスは生のツール出力を再生する代わりに、短い部分進捗要約へ折りたたまれることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron or reminders do not fire. What should I check?">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 実行されていることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定を確認します（`--tz` とホストタイムゾーン）。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は発火したのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が期待されないことを意味します。
    - 通知先（`channel` / `to`）がない、または無効な場合、ランナーはアウトバウンド配信をスキップします。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、ランナーが配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は、意図的に配信不可として扱われるため、ランナーはキュー済みのフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャットルートが利用できる場合、エージェントは `message`
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
    通常これは重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離 Cron は、アクティブな実行が `LiveSessionModelSwitchError` をスローした場合、
    実行時モデルのハンドオフを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合、
    Cron はリトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデルオーバーライドが最初に優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済み Cron セッションのモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の切り替えリトライ後、
    Cron は永久にループせず中止します。

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
    ディレクトリに書き込みます。別個の `clawhub` CLI は、自分の Skills を公開または
    同期したい場合にのみインストールしてください。エージェント間で共有インストールする場合は、Skill を
    `~/.openclaw/skills` の下に置き、どのエージェントから見えるかを絞りたい場合は
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに従って、または継続的にバックグラウンドでタスクを実行できますか？">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ**: スケジュール済みまたは定期的なタスク用（再起動後も保持されます）。
    - **Heartbeat**: 「メインセッション」の定期チェック用。
    - **分離ジョブ**: 要約を投稿したりチャットに配信したりする自律エージェント用。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接は実行できません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限されており、Skills は **Gateway ホスト**で利用可能な場合にのみシステムプロンプトに表示されます。Linux では、ゲートをオーバーライドしない限り、`apple-notes`、`apple-reminders`、`things-mac` のような `darwin` 専用 Skills は読み込まれません。

    サポートされているパターンは 3 つあります。

    **オプション A - Mac で Gateway を実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使う（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングし、Mac で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node に存在する場合、OpenClaw は macOS 専用 Skills を利用可能として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級）。**
    Gateway は Linux 上に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill をオーバーライドして Linux を許可し、利用可能な状態に保ちます。

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

    4. Skills スナップショットが更新されるように、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion や HeyGen 連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API があります）。
    - **ブラウザー自動化:** コードなしで機能しますが、遅く壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、単純なパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + アクティブな作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼する。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、
    それらの API を対象にした Skill を構築してください。

    Skills をインストールする:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で共有する Skills は、`~/.openclaw/skills/<name>/SKILL.md` に配置します。共有インストールを一部のエージェントだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定しています。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="OpenClaw で既存のサインイン済み Chrome を使うにはどうすればよいですか？">
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

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーのあるマシンで Node ホストを実行するか、代わりにリモート CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - アクションは CSS セレクター駆動ではなく、ref 駆動です
    - アップロードには `ref` / `inputRef` が必要で、現時点では一度に 1 ファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker が制限されているように感じます。全機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で `node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドル済みブラウザーは含まれていません。より完全なセットアップにするには:

    - キャッシュが保持されるように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに焼き込みます。
    - バンドル済み CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されることを確認します。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい。プライベートな通信が **DM** で、公開通信が **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非メインキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選ばない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルバインドとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスのファイルシステム境界を迂回することを忘れないでください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正準パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は安全側で失敗し、シンボリックリンク解決後も許可ルートチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)と[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の精選された長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は、auto-compaction の前に永続的なノートを書くようモデルに促すため、
    **サイレントな事前 Compaction メモリフラッシュ**も実行します。これはワークスペースが
    書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。メモリを保存するようモデルに促すと役立ちます。
    モデルは何をすべきかを理解しています。忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上にあり、削除するまで保持されます。制限になるのはモデルではなく
    ストレージです。**セッションコンテキスト**は依然としてモデルのコンテキストウィンドウによって
    制限されるため、長い会話は compact されたり切り詰められたりすることがあります。そのため
    メモリ検索があります。関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI 埋め込み**を使う場合のみ必要です。Codex OAuth は chat/completions を対象とし、
    embeddings へのアクセス権は**付与しません**。そのため、**Codex でサインインしても（OAuth または
    Codex CLI login）**セマンティックメモリ検索には役立ちません。OpenAI 埋め込みには、
    依然として実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    プロバイダーを自動選択します（認証プロファイル、`models.providers.*.apiKey`、または環境変数）。
    OpenAI キーを解決できる場合は OpenAI を優先し、そうでなければ Gemini キーを
    解決できる場合は Gemini、その次に Voyage、その次に Mistral を選びます。リモートキーが
    利用できない場合、メモリ検索は設定されるまで無効のままです。ローカルモデルのパスが
    設定され、存在している場合、OpenClaw は
    `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"` を設定します（任意で
    `memorySearch.fallback = "none"` も設定できます）。Gemini 埋め込みを使う場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の埋め込み
    モデルをサポートしています。セットアップの詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスは送信された内容を引き続き確認できます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      （`~/.openclaw` + ワークスペースディレクトリ）。
    - **必要上リモート:** モデルプロバイダー（Anthropic/OpenAI など）へ送信するメッセージは
      それらの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      各社のサーバーに保存します。
    - **フットプリントは制御可能:** ローカルモデルを使うとプロンプトは自分のマシン上に留まりますが、チャンネルの
      トラフィックは引き続きそのチャンネルのサーバーを通過します。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべては `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー用の任意のファイル backed シークレットペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリはスクラブ済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、`openclaw doctor --fix` は
      それを `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャンネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が毎回同じ
    ワークスペースを使って起動していることを確認してください（そして、リモートモードではローカルのノート PC ではなく
    **Gateway ホストの**ワークスペースが使われることを覚えておいてください）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む**ようボットに依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**プライベート**な git リポジトリに置き、どこか
    プライベートな場所（たとえば GitHub private）にバックアップしてください。これにより、メモリ + AGENTS/SOUL/USER
    ファイルを取得でき、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。
    完全な復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルト cwd**でありメモリの基点ですが、厳格なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスで他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。
    リポジトリをデフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。エージェントにその中で作業させる意図がない限り、
    ワークスペースは分離しておいてください。

    例（デフォルト cwd としてのリポジトリ）:

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

  <Accordion title="リモートモード: セッションストアはどこにありますか？">
    セッション状態は**Gateway ホスト**が所有します。リモートモードの場合、重要なセッションストアはローカルのノート PC ではなく、リモートマシン上にあります。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から任意の **JSON5** 設定を読み込みます（デフォルト: `~/.openclaw/openclaw.json`）。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` のデフォルトワークスペースを含む）を使います。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら、何も listen しない / UI に unauthorized と表示される'>
    非 loopback バインドには**有効な Gateway 認証パスが必要**です。実際には次を意味します。

    - 共有シークレット認証: トークンまたはパスワード
    - 正しく設定された identity-aware リバースプロキシの背後での `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` は、それだけではローカル Gateway 認証を有効にしません。
    - ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
    - パスワード認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は fail closed します（リモートフォールバックで隠されません）。
    - 共有シークレットの Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` などの identity-bearing モードは、代わりにリクエストヘッダーを使います。共有シークレットを URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback リバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="なぜ今 localhost でトークンが必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで Gateway 認証を強制します。通常のデフォルトパスでは、これはトークン認証を意味します。明示的な認証パスが設定されていない場合、Gateway 起動時にトークンモードへ解決され、その起動専用のランタイムトークンが生成されるため、**ローカル WS クライアントは認証する必要があります**。クライアントが再起動をまたいで安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを好む場合は、パスワードモード（または identity-aware リバースプロキシでは `trusted-proxy`）を明示的に選択できます。**本当に** open loopback にしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定変更後に再起動する必要がありますか？">
    Gateway は設定を監視し、ホットリロードをサポートします。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply し、重要な変更では再起動
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="面白い CLI タグラインを無効にするにはどうすればよいですか？">
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

    - `off`: タグラインテキストを非表示にしますが、バナーのタイトル/バージョン行は維持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナー自体を表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web 取得）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API backed プロバイダーには、それぞれ通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行し、プロバイダーを選択してください。
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

    プロバイダー固有の web 検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` にあります。
    互換性のため、従来の `tools.web.search.*` プロバイダーパスも一時的に読み込まれますが、新しい設定では使用しないでください。
    Firecrawl web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` にあります。

    注:

    - allowlist を使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、準備済みの最初の取得フォールバックプロバイダーを自動検出します。現在バンドルされているプロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消去しました。どう復旧し、どう回避すればよいですか？">
    `config.apply` は**設定全体**を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの意図しない上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway は安全側に失敗するかリロードをスキップします。`openclaw.json` を書き換えることはありません。
    - `openclaw doctor --fix` が修復を担当し、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、最後に正常だった設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認します。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - これが予期しない動作だった場合は、バグを報告し、最後に把握している設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。これは浅いスキーマノードと、ドリルダウン用の直下の子要素の概要を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換えにのみ使用してください。
    - エージェント実行から owner 専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護対象 exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [Config](/ja-JP/cli/config)、[Configure](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイス間で専門ワーカーを使う中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **Node** と**エージェント**を組み合わせる構成です。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **Node（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner 運用」、「個人データ」）向けの別個の頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要な場合に、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [Node](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザーはヘッドレスで実行できますか？">
    はい。これは設定オプションです。

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

    デフォルトは `false`（ヘッドあり）です。一部のサイトでは、ヘッドレスのほうがボット対策チェックを引き起こしやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用してください）。
    - 一部のサイトでは、ヘッドレスモードの自動化に対してより厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と Node

<AccordionGroup>
  <Accordion title="コマンドは Telegram、Gateway、Node の間でどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、Node ツールが必要な場合にのみ、**Gateway WebSocket** 経由で Node を呼び出します。

    Telegram → Gateway → エージェント → `node.*` → Node → Gateway → Telegram

    Node は受信プロバイダートラフィックを見ません。Node RPC 呼び出しだけを受信します。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは自分のコンピューターにどうアクセスできますか？">
    短い答え: **コンピューターを Node としてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して、Node として登録できるようにします。
    5. Gateway で Node を承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。Node は Gateway WebSocket 経由で接続します。

    セキュリティに関する注意: macOS Node をペアリングすると、そのマシンで `system.run` が可能になります。信頼するデバイスだけをペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Node](/ja-JP/nodes)、[Gateway protocol](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが返信がありません。次に何をすればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway のヘルス: `openclaw status`
    - チャンネルのヘルス: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認してください。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンスは互いに通信できますか（ローカル + VPS）？">
    はい。組み込みの「ボット間」ブリッジはありませんが、いくつかの信頼できる方法で配線できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A に Bot B へメッセージを送信させ、その後 Bot B が通常どおり返信するようにします。

    **CLI ブリッジ（汎用）:** 他方の Gateway を呼び出すスクリプトを `openclaw agent --message ... --deliver` で実行し、他方のボットが待ち受けているチャットを対象にします。一方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote) を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないよう、ガードレールを追加してください（メンション時のみ、チャンネル allowlist、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway は、それぞれ独自のワークスペース、モデルデフォルト、ルーティングを持つ複数のエージェントをホストできます。これが通常のセットアップであり、エージェントごとに 1 つの VPS を実行するよりもはるかに安価で簡単です。

    強い分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合にのみ、別々の VPS を使用してください。それ以外の場合は、1 つの Gateway を維持し、複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに個人用ラップトップで Node を使う利点はありますか？">
    はい。Node はリモート Gateway からラップトップに到達するための第一級の方法であり、シェルアクセス以上の機能を解放します。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、軽量です（小さな VPS または Raspberry Pi クラスのマシンで十分です。4 GB RAM で十分です）。そのため、よくある構成は、常時稼働ホストと、Node としてのラップトップの組み合わせです。

    - **受信 SSH は不要です。** Node は Gateway WebSocket にアウトバウンド接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上の Node allowlist/承認によって制御されます。
    - **より多くのデバイスツール。** Node は `system.run` に加えて、`canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ラップトップ上の Node ホストを通じて Chrome をローカルで実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH は単発のシェルアクセスには適していますが、継続的なエージェントワークフローとデバイス自動化には Node のほうが簡単です。

    ドキュメント: [Node](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Node は Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き（[複数の Gateway](/ja-JP/gateway/multiple-gateways) を参照）、ホストごとに実行する Gateway は **1 つだけ**にしてください。Node は Gateway に接続する周辺機器です（iOS/Android Node、またはメニューバーアプリの macOS「Node モード」）。ヘッドレス Node ホストと CLI 制御については、[Node host CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子要素の要約とともに調べる
    - `config.get`: 現在のスナップショット + ハッシュを取得する
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動する
    - `config.apply`: 設定全体を検証 + 置換する。可能な場合はホットリロードし、必要な場合は再起動する
    - 所有者専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否する。従来の `tools.bash.*` エイリアスは同じ保護対象の exec パスに正規化される

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これにより、ワークスペースを設定し、誰が bot をトリガーできるかを制限します。

  </Accordion>

  <Accordion title="VPS で Tailscale を設定し、Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストール + ログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストール + ログインする**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効化する（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効化し、VPS が安定した名前を持つようにします。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使います:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより Gateway は loopback にバインドされたままになり、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac Node をリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。Node は同じ Gateway WS エンドポイント経由で接続します。

    推奨設定:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **macOS アプリをリモートモードで使用します**（SSH ターゲットには tailnet ホスト名を使用できます）。
       アプリは Gateway ポートをトンネルし、Node として接続します。
    3. **Gateway で Node を承認します**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノート PC にインストールすべきですか、それとも Node を追加するだけでよいですか？">
    2台目のノート PC で **ローカルツール**（screen/camera/exec）だけが必要な場合は、
    **Node** として追加します。これにより Gateway は1つのままになり、設定の重複を避けられます。ローカル Node ツールは
    現在 macOS のみ対応ですが、他の OS にも拡張する予定です。

    **強い分離**または完全に別々の bot が2つ必要な場合にのみ、2つ目の Gateway をインストールしてください。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から env vars を読み込み、さらに次を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env` のグローバル fallback `.env`（別名 `$OPENCLAW_STATE_DIR/.env`）

    どちらの `.env` ファイルも既存の env vars を上書きしません。

    設定内でインライン env vars を定義することもできます（プロセス env に存在しない場合のみ適用されます）:

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

  <Accordion title="サービス経由で Gateway を起動したら env vars が消えました。どうすればよいですか？">
    よくある修正は2つです:

    1. 不足しているキーを `~/.openclaw/.env` に入れます。これにより、サービスが shell env を継承しない場合でも取得されます。
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

    これはログイン shell を実行し、不足している想定キーだけをインポートします（上書きはしません）。対応する env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off"
    は env vars が不足しているという意味では**ありません**。OpenClaw がログイン shell を自動的には読み込まない、という意味だけです。

    Gateway がサービス（launchd/systemd）として実行されている場合、shell
    環境は継承されません。次のいずれかで修正します:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効化します。
    3. または設定の `env` ブロックに追加します（存在しない場合のみ適用）。

    その後 Gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（また `GH_TOKEN` / `GITHUB_TOKEN`）から読み込まれます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    スタンドアロンメッセージとして `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルト **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効な場合、アイドル期間後の**次の**
    メッセージで、そのチャットキーの新しい session id が開始されます。
    これは transcript を削除しません。新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1人の CEO と多数の agent）を作る方法はありますか？">
    はい、**マルチ agent ルーティング**と**サブ agent** 経由で可能です。1つの coordinator
    agent と、独自のワークスペースおよびモデルを持つ複数の worker agent を作成できます。

    とはいえ、これは**楽しい実験**として見るのが最適です。token 消費が多く、個別セッションを持つ1つの bot を使うより
    効率が悪いことがよくあります。私たちが想定する典型的なモデルは、会話する bot が1つあり、並行作業には別々のセッションを使う形です。その
    bot は必要に応じてサブ agent を spawn することもできます。

    ドキュメント: [マルチ agent ルーティング](/ja-JP/concepts/multi-agent)、[サブ agent](/ja-JP/tools/subagents)、[Agent CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中で context が切り詰められたのはなぜですか？どう防げますか？">
    セッション context はモデルウィンドウによって制限されます。長いチャット、大きなツール出力、または多数の
    ファイルによって Compaction や切り詰めが発生することがあります。

    役立つこと:

    - bot に現在の状態を要約してファイルに書き込むよう依頼する。
    - 長いタスクの前に `/compact` を使い、トピックを切り替えるときは `/new` を使う。
    - 重要な context はワークスペースに保持し、bot に読み返すよう依頼する。
    - 長い作業や並行作業にはサブ agent を使い、メインチャットを小さく保つ。
    - これが頻繁に起きる場合は、より大きな context window を持つモデルを選ぶ。

  </Accordion>

  <Accordion title="インストール済みのまま OpenClaw を完全にリセットするにはどうすればよいですか？">
    reset コマンドを使います:

    ```bash
    openclaw reset
    ```

    非対話式の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - 既存の設定が見つかった場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - profile（`--profile` / `OPENCLAW_PROFILE`）を使用した場合は、各 state dir をリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発用 config + credentials + sessions + workspace を消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが発生しています。リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使います:

    - **Compact**（会話を保持しつつ、古い turn を要約します）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約をガイドします。

    - **Reset**（同じ chat key に対する新しい session ID）:

      ```
      /new
      /reset
      ```

    継続して発生する場合:

    - **session pruning**（`agents.defaults.contextPruning`）を有効化または調整し、古いツール出力を削減します。
    - より大きな context window を持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    これはプロバイダー検証エラーです。モデルが必須の
    `input` なしで `tool_use` ブロックを出力しました。通常、セッション履歴が古いか破損していることを意味します（長いスレッド
    またはツール/スキーマ変更の後によく起きます）。

    修正: `/new`（スタンドアロンメッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth auth 使用時は **1h**）。調整または無効化できます:

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
    見出しのみ）の場合、OpenClaw は API calls を節約するため heartbeat run をスキップします。
    ファイルがない場合でも heartbeat は実行され、モデルが何をするかを判断します。

    agent ごとの override は `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「bot account」を追加する必要がありますか？'>
    いいえ。OpenClaw は**自分のアカウント**で実行されるため、自分がグループに参加していれば OpenClaw はそれを確認できます。
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

  <Accordion title="WhatsApp グループの JID を取得するにはどうすればよいですか？">
    選択肢 1（最速）: ログを tail し、グループにテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    選択肢 2（すでに設定済み/allowlist 済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は2つです:

    - mention gating がオン（デフォルト）です。bot に @mention する（または `mentionPatterns` に一致する）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist されていません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM と context を共有しますか？">
    直接チャットはデフォルトでメインセッションにまとめられます。グループ/チャンネルは独自のセッションキーを持ち、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な上限はありません。数十個（数百個でも）は問題ありませんが、次に注意してください。

    - **ディスク増加:** セッション + トランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下にあります。
    - **トークンコスト:** エージェントが増えるほど、同時実行されるモデル利用も増えます。
    - **運用負荷:** エージェントごとの認証プロファイル、ワークスペース、チャネルルーティング。

    ヒント:

    - エージェントごとに **active** なワークスペースを 1 つ保持します（`agents.defaults.workspace`）。
    - ディスクが増えた場合は古いセッションを削除します（JSONL またはストアエントリを削除）。
    - 迷子のワークスペースやプロファイルの不一致を見つけるには `openclaw doctor` を使います。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）、またどのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャネル/アカウント/ピアごとにルーティングできます。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザアクセスは強力ですが、「人間ができることは何でもできる」わけではありません。アンチボット、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザ制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザを実行しているマシン上で CDP を使ってください。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - 役割ごとに 1 つのエージェント（バインディング）。
    - それらのエージェントにバインドされた Slack チャネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザ。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、
    [ブラウザ](/ja-JP/tools/browser)、[ノード](/ja-JP/nodes)。

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

  <Accordion title='openclaw gateway status が「Runtime: running」と表示するのに「Connectivity probe: failed」と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**側の見方（launchd/systemd/schtasks）だからです。接続性プローブは、CLI が実際に gateway WebSocket に接続しています。

    `openclaw gateway status` を使い、次の行を信頼してください。

    - `Probe target:`（プローブが実際に使った URL）
    - `Listening:`（ポート上で実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているのにポートが待ち受けていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が異なるのはなぜですか？'>
    サービスが別の設定ファイルで実行されている一方で、あなたは別の設定ファイルを編集しています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたいものと同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は起動時に WebSocket リスナーを即座にバインドすることでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでに待ち受けていることを示す `GatewayLockError` をスローします。

    修正: 他方のインスタンスを停止するか、ポートを空けるか、`openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、リモート WebSocket URL を指定します。必要に応じて共有シークレットのリモート認証情報も設定します。

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
    - macOS アプリは設定ファイルを監視し、これらの値が変わるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報にすぎません。それ自体でローカル gateway 認証を有効にするものではありません。

  </Accordion>

  <Accordion title='Control UI が「unauthorized」と表示する（または再接続を続ける）場合はどうすればよいですか？'>
    gateway の認証パスと UI の認証方法が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザタブセッションと選択された gateway URL 用のトークンを `sessionStorage` に保持します。そのため、同じタブでの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、gateway が再試行ヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返す場合、信頼されたクライアントはキャッシュされたデバイストークンで 1 回だけ制限付き再試行を試せます。
    - そのキャッシュトークン再試行は、デバイストークンとともに保存されたキャッシュ済みの承認済みスコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュされたスコープを継承する代わりに、要求したスコープセットを維持します。
    - その再試行パスの外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップ operator 許可リストは operator リクエストだけを満たします。node やその他の非 operator ロールには、自身のロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力 + コピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale ID ヘッダーを迂回する生の loopback/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の gateway URL ではなく、設定済みの ID 対応プロキシ経由で来ていることを確認します。同一ホストの loopback プロキシでも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の 2 点を確認します:
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自身の**デバイスしかローテーションできません
      - 明示的な `--scope` 値は、呼び出し元の現在の operator スコープを超えられません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが、バインドできず何も待ち受けません">
    `tailnet` バインドはネットワークインターフェースから Tailscale IP を選びます（100.64.0.0/10）。マシンが Tailscale 上にない（またはインターフェースがダウンしている）場合、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動します（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用バインドが必要な場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。冗長性（例: レスキューボット）または強い分離が必要な場合にのみ、複数の Gateway を使ってください。

    可能ですが、分離が必要です。

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル設定で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`、レガシー `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数 Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とは何ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信すると、**コード 1008**
    （ポリシー違反）で接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使った。
    - プロキシまたはトンネルが認証ヘッダーを削除した、または Gateway ではないリクエストを送信した。

    クイック修正:

    1. WS URL を使います: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザタブで WS ポートを開かないでください。
    3. 認証が有効な場合は、`connect` フレームにトークン/パスワードを含めます。

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

    最速のログ追尾:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーのログ（gateway が launchd/systemd 経由で実行されている場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`、プロファイルは `~/.openclaw-<profile>/logs/...` を使用）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    gateway ヘルパーを使います。

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

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

    手動で実行している場合（サービスなし）は、次を使います。

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows（WSL2）](/ja-JP/platforms/windows)、[Gateway サービス runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが返信が届きません。何を確認すべきですか？">
    まず簡単なヘルススイープから始めます。

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - **Gateway ホスト**でモデル認証が読み込まれていません（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしています（チャンネル設定とログを確認）。
    - WebChat/ダッシュボードが正しいトークンなしで開かれています。

    リモートの場合は、トンネル/Tailscale 接続が有効であり、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャンネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway から切断されました: 理由なし" - 次に何をすればよいですか?'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください。

    1. Gateway は実行中ですか? `openclaw gateway status`
    2. Gateway は正常ですか? `openclaw status`
    3. UI に正しいトークンがありますか? `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは有効ですか?

    その後、ログを tail します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [ダッシュボード](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか?">
    ログとチャンネル状態から始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに対応します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限まで削減し、コマンド数を減らして再試行しますが、一部のメニュー項目はまだ削除する必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上またはプロキシの背後にいる場合は、アウトバウンド HTTPS が許可され、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか?">
    まず、Gateway に到達でき、エージェントが実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか?">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視対象サービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は、Ctrl-C で停止してから次を実行します。

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway サービスランブック](/ja-JP/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションの**フォアグラウンド**で Gateway を実行します。

    サービスをインストールしている場合は、gateway コマンドを使用します。一回限りの
    フォアグラウンド実行をしたい場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    より詳細なコンソール情報を得るには、`--verbose` を付けて Gateway を起動します。その後、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="Skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、（単独行で）`MEDIA:<path-or-url>` 行を含める必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください。

    - 対象チャンネルが送信メディアをサポートしており、許可リストでブロックされていないこと。
    - ファイルがプロバイダーのサイズ制限内であること（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックスで検証済みのファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読み取れるホストローカルファイルを `MEDIA:` で送信できるようにしますが、対象はメディアと安全なドキュメント形式（画像、音声、動画、PDF、Office ドキュメント）のみです。プレーンテキストやシークレットらしいファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか?">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを低減するように設計されています。

    - DM 対応チャンネルでのデフォルト動作は**ペアリング**です。
      - 不明な送信者はペアリングコードを受け取り、ボットはそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルあたり 3 件**に制限されます。コードが届かなかった場合は、`openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクのある DM ポリシーを表示するには、`openclaw doctor` を実行します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの懸念ですか?">
    いいえ。プロンプトインジェクションは、ボットに DM できる相手だけでなく、**信頼できないコンテンツ**に関する問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは、**送信者が自分だけ**であっても起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを外部へ流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効のエージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はどちらも、生のファイルテキストを渡す代わりに、
      抽出したテキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リストを使用する

    詳細: [セキュリティ](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="ボットには専用のメール、GitHub アカウント、または電話番号を持たせるべきですか?">
    はい、ほとんどのセットアップではそうです。ボットを別のアカウントや電話番号で分離すると、
    問題が起きた場合の影響範囲を減らせます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントだけにアクセスを付与し、必要になったら
    後から拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing).

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか? それは安全ですか?">
    個人メッセージに対する完全な自律性は推奨**しません**。最も安全なパターンは次のとおりです。

    - DM は**ペアリングモード**または厳格な許可リストに保つ。
    - 代理でメッセージを送信させたい場合は、**別の番号またはアカウント**を使用する。
    - 下書きを作成させ、その後**送信前に承認**する。

    試したい場合は、専用アカウントで行い、分離したままにしてください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使用できますか?">
    はい、エージェントがチャット専用で、入力が信頼できる場合に**限り**可能です。小さいティアは
    指示の乗っ取りの影響を受けやすいため、ツール有効のエージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに入れるか、そのアカウントの
    `dmPolicy: "open"` を設定します。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送信しますか? ペアリングはどのように機能しますか?">
    いいえ。WhatsApp のデフォルト DM ポリシーは**ペアリング**です。不明な送信者はペアリングコードを受け取るだけで、そのメッセージは**処理されません**。OpenClaw は、受信したチャットまたは明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: 自分の DM が許可されるように、**許可リスト/所有者**を設定するために使用されます。自動送信には使用されません。個人の WhatsApp 番号で実行する場合は、その番号を使用し、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか?">
    ほとんどの内部メッセージやツールメッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    まだノイズが多い場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定します。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使用していないことも確認してください。

    ドキュメント: [思考と verbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか?">
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

    バックグラウンドプロセス（exec ツールからのもの）については、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる**単独**メッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は、許可リストに登録された送信者であればインラインでも機能します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送信するにはどうすればよいですか?（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで**プロバイダー間**メッセージングをブロックします。ツール呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。

    エージェントでプロバイダー間メッセージングを有効にします。

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

    設定を編集した後、gateway を再起動します。

  </Accordion>

  <Accordion title='ボットが連続メッセージを「無視」しているように感じるのはなぜですか?'>
    キューモードは、新しいメッセージが実行中の run とどのように相互作用するかを制御します。モードを変更するには `/queue` を使用します。

    - `steer` - 現在の run 内の次のモデル境界に向けて、保留中の steering をすべてキューに入れる
    - `queue` - 従来の一度に 1 つの steering
    - `followup` - メッセージを 1 つずつ実行する
    - `collect` - メッセージをバッチ化し、1 回だけ返信する
    - `steer-backlog` - 今すぐ steer し、その後 backlog を処理する
    - `interrupt` - 現在の run を中止して新しく開始する

    デフォルトモードは `steer` です。フォローアップモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='APIキーを使用するAnthropicのデフォルトモデルは何ですか？'>
    OpenClawでは、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（またはAnthropicのAPIキーをauth profilesに保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです（たとえば、`anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントに対して、Gateway が想定される `auth-profiles.json` 内でAnthropicの認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？[Discord](https://discord.com/invite/clawd) で質問するか、[GitHubディスカッション](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデルFAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、auth profiles
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
