---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - ユーザーから報告された問題を、より深いデバッグの前にトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-07-05T11:26:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ad033bbe300af0c0f769fc2729ee17f0fbab9facdb3c640be23f9e9a5bd01ab
    source_path: help/faq.md
    workflow: 16
---

Quick answers と、実際の環境（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのより深いトラブルシューティング。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れている場合の最初の 60 秒

<Steps>
  <Step title="クイックステータス">
    ```bash
    openclaw status
    ```
    高速なローカル概要: OS + 更新、gateway/サービスの到達性、エージェント/セッション、プロバイダー設定 + ランタイムの問題（gateway に到達できる場合）。
  </Step>
  <Step title="貼り付け可能なレポート（共有しても安全）">
    ```bash
    openclaw status --all
    ```
    ログ末尾付きの読み取り専用診断（トークンは伏せ字）。
  </Step>
  <Step title="デーモン + ポート状態">
    ```bash
    openclaw gateway status
    ```
    スーパーバイザーのランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。
  </Step>
  <Step title="詳細プローブ">
    ```bash
    openclaw status --deep
    ```
    対応している場合はチャネルプローブを含む、ライブ Gateway ヘルスプローブ（到達可能な Gateway が必要）。[ヘルス](/ja-JP/gateway/health)を参照してください。
  </Step>
  <Step title="最新ログを追尾">
    ```bash
    openclaw logs --follow
    ```
    RPC が停止している場合は、次にフォールバックします:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    ファイルログはサービスログとは別です。[ログ](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。
  </Step>
  <Step title="doctor を実行（修復）">
    ```bash
    openclaw doctor
    ```
    設定と状態を修復/移行し、その後ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。
  </Step>
  <Step title="Gateway スナップショット（WS のみ）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
    ```
    実行中の gateway に完全なスナップショットを要求します。[ヘルス](/ja-JP/gateway/health)を参照してください。
  </Step>
</Steps>

## クイックスタートと初回セットアップ

初回実行 Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期障害）は、[初回 FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは、ひとことで言うと何ですか？">
    OpenClaw は、自分のデバイス上で動かす個人用 AI アシスタントです。すでに使っているメッセージング面（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp、QQ Bot などの同梱チャネル Plugin）で返信でき、対応プラットフォームでは音声とライブ Canvas も使えます。**Gateway** は常時稼働の制御プレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは **ローカルファーストの制御プレーン** であり、**自分のハードウェア** 上で高機能なアシスタントを動かし、すでに使っているチャットアプリからアクセスできます。ステートフルなセッション、メモリ、ツールを備え、ワークフローをホスト型 SaaS に渡す必要はありません。

    - **自分のデバイス、自分のデータ**: Gateway を任意の場所（Mac、Linux、VPS）で実行し、ワークスペースとセッション履歴をローカルに保持します。
    - **Web サンドボックスではなく実際のチャネル**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/などに加え、対応プラットフォームではモバイル音声と Canvas。
    - **モデル非依存**: Anthropic、MiniMax、OpenAI、OpenRouter などを、エージェントごとのルーティングとフェイルオーバーで使用できます。
    - **ローカルのみの選択肢**: ローカルモデルを実行すれば、すべてのデータを自分のデバイス上に留められます。
    - **マルチエージェントルーティング**: チャネル、アカウント、タスクごとにエージェントを分け、それぞれに独自のワークスペースとデフォルトを持たせられます。
    - **オープンソースで改造可能**: ベンダーロックインなしで、調査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway), [チャネル](/ja-JP/channels), [マルチエージェント](/ja-JP/concepts/multi-agent), [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトに適しているもの: Web サイトの構築（WordPress、Shopify、または静的サイト）、モバイルアプリのプロトタイプ作成（概要、画面、API 計画）、ファイルとフォルダーの整理、Gmail の接続と要約やフォローアップの自動化。

    大きなタスクも処理できますが、並列作業にはサブエージェントを使い、フェーズに分けると最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    - **個人向けブリーフィング**: 受信箱、カレンダー、関心のあるニュースの要約。
    - **リサーチと下書き**: メールやドキュメント向けの簡単なリサーチ、要約、初稿。
    - **リマインダーとフォローアップ**: cron または heartbeat 駆動の通知やチェックリスト。
    - **ブラウザー自動化**: フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携**: スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取ります。

  </Accordion>

  <Accordion title="OpenClaw は SaaS 向けのリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    はい、**リサーチ、絞り込み、下書き**に役立ちます。サイトのスキャン、候補リストの作成、見込み客の要約、アウトリーチ文や広告コピーの下書き作成などです。

    **アウトリーチや広告配信**では、人間をループに入れてください。スパムを避け、地域の法律やプラットフォームポリシーに従い、送信前に必ずレビューしてください。OpenClaw に下書きさせ、あなたが承認します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人用アシスタント** 兼調整レイヤーであり、IDE の代替ではありません。リポジトリ内で最速の直接コーディングループを行うには Claude Code または Codex を使用してください。OpenClaw は、永続メモリ、デバイス横断アクセス、ツールオーケストレーションに使用します。

    - セッションをまたいだ永続メモリとワークスペース。
    - 複数プラットフォームからのアクセス（Telegram、WhatsApp、TUI、WebChat）。
    - ツールオーケストレーション（ブラウザー、ファイル、スケジューリング、フック）。
    - 常時稼働の Gateway（VPS 上で実行し、どこからでも操作）。
    - ローカルのブラウザー/画面/カメラ/exec 用 Node。

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを dirty に保たずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリのコピーを編集する代わりに、管理されたオーバーライドを使用します。変更を `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> bundled -> `skills.load.extraDirs` なので、管理されたオーバーライドは git に触れずに bundled skills より優先されます。グローバルにインストールしつつ一部のエージェントにだけ表示を制限するには、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` / `agents.list[].skills` で表示を制御します。上流に取り込む価値がある編集だけを、リポジトリコピーに対する PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダから Skills を読み込めますか？">
    はい: `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でディレクトリを追加します（上記の順序では最も低い優先順位）。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。可視性を特定のエージェントに限定するには、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルや設定を使うにはどうすればよいですか？">
    サポートされているパターン:

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **エージェント**: タスクを、異なるデフォルトモデル、思考レベル、ストリームパラメータを持つ別々のエージェントにルーティングします。
    - **オンデマンド切り替え**: `/model` で現在のセッションモデルをいつでも切り替えられます。

    例 - 同じモデル、エージェントごとに異なる設定:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    共有のモデル別デフォルトは `agents.defaults.models["provider/model"].params` に置き、エージェント固有のオーバーライドはフラットな `agents.list[].params` に置きます。同じモデルをネストされた `agents.list[].models["provider/model"].params` の下に重複させないでください。このパスは、エージェントごとのモデルカタログとランタイムオーバーライド用です。

    参照: [Cron ジョブ](/ja-JP/automation/cron-jobs), [マルチエージェントルーティング](/ja-JP/concepts/multi-agent), [設定](/ja-JP/gateway/config-agents), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="重い処理中にボットが固まります。どうやってオフロードできますか？">
    長時間または並列のタスクには **サブエージェント** を使用します。サブエージェントは独自のセッションで実行され、要約を返し、メインのチャットの応答性を保ちます。ボットに「このタスク用にサブエージェントを生成して」と依頼するか、`/subagents` を使用します。Gateway が現在ビジーかどうかを確認するには `/status` を使用します。

    長いタスクとサブエージェントはいずれもトークンを消費します。コストが重要な場合は、`agents.defaults.subagents.model` でサブエージェントにより安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐づくサブエージェントセッションはどのように動作しますか？">
    Discord スレッドをサブエージェントまたはセッションターゲットに紐づけると、その後のメッセージはその紐づけられたセッションに留まります。

    - `thread: true` を指定して `sessions_spawn` で生成します（永続的な後続対応には任意で `mode: "session"`）。
    - または `/focus <target>` で手動で紐づけます。
    - `/agents` は紐づけ状態を検査します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` は自動フォーカス解除を制御します。
    - `/unfocus` はスレッドの紐づけを解除します。

    設定: `session.threadBindings.enabled`（グローバルスイッチ）、`session.threadBindings.idleHours`（デフォルト `24`、`0` で無効）、`session.threadBindings.maxAgeHours`（デフォルト `0` = ハード上限なし）、およびチャンネルごとのオーバーライド `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` は生成時の自動紐づけを制御します（デフォルト `true`）。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [設定リファレンス](/ja-JP/gateway/configuration-reference), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントが完了しましたが、完了更新が誤った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    解決されたリクエスターのルートを確認します。

    - 完了モードのサブエージェント配信は、紐づけられたスレッドまたは会話ルートが存在する場合、それを優先します。
    - 完了の起点がチャンネルしか保持していない場合、OpenClaw はリクエスターセッションの保存済みルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、ダイレクト配信は引き続き成功できます。
    - 紐づけられたルートがなく、使用可能な保存済みルートもない場合: ダイレクト配信は失敗する可能性があり、結果は即時投稿ではなくキューに入れられたセッション配信にフォールバックします。
    - 無効または古いターゲットも、キューフォールバックまたは最終配信失敗を強制することがあります。
    - 子の最後の表示済みアシスタント返信が正確に `NO_REPLY` / `no_reply` または `ANNOUNCE_SKIP` の場合、OpenClaw は古い進捗を投稿する代わりに、意図的に通知を抑制します。

    デバッグ: `<lookup>` がタスク ID、実行 ID、またはセッションキーである場合の `openclaw tasks show <lookup>`。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks), [セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合は発火しません。

    - cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24 時間 365 日実行されていることを確認します（スリープや再起動がない）。
    - ジョブのタイムゾーン（`--tz` とホストタイムゾーン）を確認します。

    デバッグ:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron が起動したのに、チャンネルに何も送信されませんでした。なぜですか？">
    配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"`: ランナーのフォールバック送信は想定されません。
    - 通知先（`channel` / `to`）がない、または無効: ランナーは外向き配信をスキップしました。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）: ランナーは配信を試みましたが、認証情報によりブロックされました。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、キューに入ったフォールバック配信も抑制されます。

    分離 Cron ジョブでは、チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。`--announce` は、エージェントがまだ自分で送信していない最終テキストに対するランナーのフォールバック配信だけを制御します。

    デバッグ:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行がモデルを切り替えたり、一度リトライしたりしたのはなぜですか？">
    これはライブモデル切り替えパスであり、重複スケジューリングではありません。分離 Cron はランタイムモデルの引き継ぎを永続化し、アクティブな実行が `LiveSessionModelSwitchError` を投げた場合に、切り替え後のプロバイダー/モデル（および切り替え後の認証プロファイルオーバーライド）を保持してからリトライします。

    モデル選択の優先順位: Gmail フックのモデルオーバーライド（`hooks.gmail.model`）が最初、次にジョブ単位の `model`、次に保存済みの Cron セッションモデルオーバーライド、その後に通常のエージェント/デフォルトモデル選択です。

    リトライループは初回試行に加えて 2 回の切り替えリトライまでに制限されています。その後 Cron は永久にループせず中止します。

    デバッグ:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[Cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、ワークスペースに Skills を配置してください。macOS の Skills UI は Linux では利用できません。Skills は [https://clawhub.ai](https://clawhub.ai) で参照できます。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    ネイティブの `openclaw skills install` は、デフォルトでアクティブなワークスペースの `skills/` ディレクトリに書き込みます。すべてのローカルエージェント向けの共有管理 Skills ディレクトリにインストールするには、`--global` を追加します。別個の `clawhub` CLI は、自分の Skills を公開または同期する場合にのみインストールしてください。共有 Skills を参照できるエージェントを絞るには、`agents.defaults.skills` または `agents.list[].skills` を使います。

  </Accordion>

  <Accordion title="OpenClaw はタスクをスケジュール実行したり、バックグラウンドで継続実行したりできますか？">
    はい、Gateway スケジューラー経由で可能です。

    - **Cron ジョブ**: スケジュール済みまたは繰り返しタスク用（再起動後も保持されます）。
    - **Heartbeat**: メインセッションの定期チェック用。
    - **分離ジョブ**: 要約を投稿したりチャットへ配信したりする自律エージェント用。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)、[Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必須バイナリによって制限され、**Gateway ホスト**で適格な場合にのみロードされます。Linux では、ゲーティングをオーバーライドしない限り、`darwin` 専用 Skills（`apple-notes`、`apple-reminders`、`things-mac`）はロードされません。

    サポートされるパターンは 3 つあります。

    **オプション A - Mac で Gateway を実行する（最も簡単）**。macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおりロードされます。

    **オプション B - macOS Node を使う（SSH なし）**。Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングし、Mac で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必須バイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を適格として扱います。エージェントは `nodes` ツール経由でそれらを実行します。「Always Ask」で、プロンプト内の「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級者向け）**。Gateway は Linux のままにし、必須 CLI バイナリが Mac 上で実行される SSH ラッパーに解決されるようにしてから、その Skill を Linux 許可にオーバーライドし、適格な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）。
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Linux ホスト上の `PATH` にラッパーを置きます（例: `~/bin/memo`）。
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

  <Accordion title="Notion や HeyGen の連携はありますか？">
    現時点では組み込まれていません。選択肢は次のとおりです。

    - **カスタム Skill / Plugin**: 信頼性の高い API アクセスに最適です（どちらも API があります）。
    - **ブラウザー自動化**: コードなしで動作しますが、遅く、壊れやすくなります。

    代理店型のクライアント別コンテキストでは、クライアントごとに Notion ページを 1 つ（コンテキスト + 設定 + 進行中の作業）用意し、セッション開始時にそのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを作成するか、それらの API に対する Skill を構築してください。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールはアクティブなワークスペースの `skills/` ディレクトリに配置されます。すべてのローカルエージェント向けには `--global` を使うか、可視性を制限するために `agents.defaults.skills` / `agents.list[].skills` を設定してください。一部の Skills は Homebrew でインストールされたバイナリを期待します。Linux では Linuxbrew を意味します。

    [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する組み込みの `user` ブラウザープロファイルを使います。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名の場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    これはローカルホストのブラウザーまたは接続済みブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシンで Node ホストを実行するか、代わりにリモート CDP を使います。

    `existing-session` / `user` プロファイルと管理対象の `openclaw` プロファイルとの現在の制限は次のとおりです。

    - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には CSS セレクターではなくスナップショット参照が必要です。
    - アップロードフックには `ref` または `inputRef` が必要で、1 回に 1 ファイルのみ、CSS `element` は使えません。
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、引き続き管理対象ブラウザーパスが必要です。

    完全な比較については [ブラウザー](/ja-JP/tools/browser#existing-session-via-chrome-devtools-mcp) を参照してください。

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい: [サンドボックス化](/ja-JP/gateway/sandboxing)。Docker 固有のセットアップ（Docker 内のフル Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker が制限されているように感じます。全機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で `node` ユーザーとして実行されるため、システムパッケージ、Homebrew、同梱ブラウザーは含まれません。より完全なセットアップにするには:

    - キャッシュが残るように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_IMAGE_APT_PACKAGES` でシステム依存関係をイメージに組み込みます。
    - 同梱 CLI 経由で Playwright ブラウザーをインストールします: `node /app/node_modules/playwright-core/cli.js install chromium`。
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスを永続化します。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい、プライベートトラフィックが **DM** で、公開トラフィックが **グループ** の場合は可能です。`agents.defaults.sandbox.mode: "non-main"` を設定すると、グループ/チャンネルセッション（非メインキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。サンドボックス化が有効になると、Docker がデフォルトのバックエンドです。サンドボックス化されたセッションで利用できるツールは `tools.sandbox.tools` で制限します。

    セットアップ手順: [グループ: 個人 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)。キーリファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:container:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルバインドとエージェント単位のバインドはマージされます。`scope: "shared"` の場合、エージェント単位のバインドは無視されます。機密性の高いものには `:ro` を使ってください。バインドはサンドボックスのファイルシステム境界を迂回します。

    OpenClaw は、正規化されたパスと、最も深い既存祖先を通じて解決された正規パスの両方に対してバインド元を検証します。そのため、最終パスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出はフェイルクローズします。

    [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。日次ノートは `memory/YYYY-MM-DD.md`、整理された長期ノートは `MEMORY.md`（メイン/プライベートセッションのみ）にあります。

    OpenClaw はまた、Compaction が会話を要約する前にサイレントな **Compaction 前メモリフラッシュ**を実行し、モデルに先に永続ノートを書くよう促します。これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。無効にするには `agents.defaults.compaction.memoryFlush.enabled: false` を使います。[メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md`、短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。モデルにメモリを保存するよう促すと、通常は解決します。それでも忘れ続ける場合は、Gateway が毎回同じワークスペースを使っていることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永続的に残りますか？制限は何ですか？">
    メモリファイルはディスク上にあり、削除されるまで保持されます。制限はモデルではなくストレージです。**セッションコンテキスト**は引き続きモデルのコンテキストウィンドウに制限されるため、長い会話は Compaction されたり切り詰められたりすることがあります。そのため、関連する部分だけをコンテキストに戻すメモリ検索が存在します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。これはデフォルトプロバイダーです。Codex OAuth はチャット/補完を対象とし、embeddings アクセスは付与しません。そのため、Codex（OAuth または Codex CLI ログイン）でサインインしても、セマンティックメモリ検索は有効になりません。OpenAI embeddings には引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    ローカルに保つには、`agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp) を設定します。その他の対応プロバイダー: Bedrock、DeepInfra、Gemini (`GEMINI_API_KEY` または `memorySearch.remote.apiKey`)、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 互換、Voyage。セットアップの詳細は [Memory](/ja-JP/concepts/memory) と [Memory search](/ja-JP/concepts/memory-search) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか？">
    いいえ: **OpenClaw 自体の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル**: セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります (`~/.openclaw` とワークスペースディレクトリ)。
    - **必要に応じてリモート**: モデルプロバイダー (Anthropic/OpenAI など) に送信されるメッセージはそれらの API に送られ、チャットプラットフォーム (Slack/Telegram/WhatsApp など) はメッセージデータをそれぞれのサーバーに保存します。
    - **フットプリントは制御できます**: ローカルモデルはプロンプトを自分のマシン上に保持しますが、チャネルのトラフィックは引き続きチャネルのサーバーを通過します。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべては `$OPENCLAW_STATE_DIR` 配下にあります (デフォルト: `~/.openclaw`):

    | パス                                                             | 目的                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | メイン設定 (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | レガシー OAuth インポート (初回使用時に認証プロファイルへコピー)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 認証プロファイル (OAuth、API キー、任意の `keyRef`/`tokenRef`)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef プロバイダー用の任意のファイルベースのシークレットペイロード   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | レガシー互換ファイル (静的な `api_key` エントリは除去済み)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | プロバイダー状態 (例: `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | エージェントごとの状態 (agentDir + sessions)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 会話履歴と状態 (エージェントごと)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`       | セッションメタデータ (エージェントごと)                                        |

    レガシーの単一エージェントパス `~/.openclaw/agent/*` は `openclaw doctor` によって移行されます。

    **ワークスペース** (AGENTS.md、メモリファイル、Skills など) は別で、`agents.defaults.workspace` 経由で設定されます (デフォルト: `~/.openclaw/workspace`)。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらは `~/.openclaw` ではなく、**エージェントワークスペース**にあります。

    - **ワークスペース (エージェントごと)**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。小文字のルート `memory.md` はレガシー修復入力専用です。両方が存在する場合、`openclaw doctor --fix` はそれを `MEMORY.md` にマージできます。
    - **状態ディレクトリ (`~/.openclaw`)**: 設定、チャネル/プロバイダー状態、認証プロファイル、セッション、ログ、共有 Skills (`~/.openclaw/skills`)。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が毎回同じワークスペースを使って起動していることを確認してください (リモートモードでは、自分のローカルノート PC ではなく、**gateway ホストの**ワークスペースを使います)。

    ヒント: 永続的な動作や好みについては、チャット履歴に頼るのではなく、ボットに **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="SOUL.md を大きくできますか？">
    はい。`SOUL.md` はエージェントコンテキストに注入されるワークスペースブートストラップファイルの 1 つです。デフォルトのファイルごとの注入上限は `20000` 文字です。ファイル全体の合計ブートストラップ予算は `60000` 文字です。

    共有デフォルトを変更します:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    または、`agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 配下で 1 つのエージェントを上書きします。

    `/context` を使って、生のサイズと注入後のサイズ、および切り詰めが発生したかを確認します。`SOUL.md` は話し方、スタンス、人格に絞ってください。運用ルールは `AGENTS.md` に、永続的な事実はメモリに入れます。

    [コンテキスト](/ja-JP/concepts/context) と [エージェント設定](/ja-JP/gateway/config-agents) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**private** git リポジトリに置き、どこか private な場所 (例: GitHub private) にバックアップします。これにより、メモリと AGENTS/SOUL/USER ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの (認証情報、セッション、トークン、暗号化されたシークレットペイロード) は**コミットしないでください**。完全に復元するには、ワークスペースと状態ディレクトリを別々にバックアップしてください。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    [アンインストール](/ja-JP/install/uninstall) を参照してください。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルト cwd**でありメモリアンカーであって、厳格なサンドボックスではありません。相対パスはワークスペース内で解決されます。サンドボックスが有効でない限り、絶対パスはホスト上の他の場所にアクセスできます。分離するには、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使います。リポジトリをデフォルトの作業ディレクトリにするには、そのエージェントの `workspace` をリポジトリルートに向けます。OpenClaw リポジトリ自体は単なるソースコードなので、エージェントにその中で作業させたい意図がある場合を除き、ワークスペースは分けてください。

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
    セッション状態は**gateway ホスト**が所有します。リモートモードでは、重要なセッションストアは自分のローカルノート PC ではなくリモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から任意の **JSON5** 設定を読み取ります (デフォルト: `~/.openclaw/openclaw.json`)。ファイルが存在しない場合、`~/.openclaw/workspace` のデフォルトワークスペースを含む、おおむね安全なデフォルトを使います。
  </Accordion>

  <Accordion title='gateway.bind: "lan" (または "tailnet") を設定したら、何も listen されない / UI が unauthorized と表示します'>
    非ループバックの bind には、**有効な gateway 認証パスが必要**です: 共有シークレット認証 (トークンまたはパスワード)、または正しく設定された ID 認識リバースプロキシの背後にある `gateway.auth.mode: "trusted-proxy"`。

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

    - `gateway.remote.token` / `.password` は、それだけではローカル gateway 認証を有効にしません。ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合に限り、フォールバックとして `gateway.remote.*` を使用できます。
    - パスワード認証では、`gateway.auth.mode: "password"` と `gateway.auth.password` (または `OPENCLAW_GATEWAY_PASSWORD`) を設定します。
    - `gateway.auth.token` / `.password` が SecretRef 経由で明示的に設定されていて解決できない場合、解決は fail closed します (リモートフォールバックによる隠蔽はありません)。
    - 共有シークレットの Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password` (アプリ/UI 設定に保存) で認証します。Tailscale Serve や `trusted-proxy` などの ID を伴うモードは、代わりにリクエストヘッダーを使います。共有シークレットを URL に入れることは避けてください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback リバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="なぜ localhost でもトークンが必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで gateway 認証を強制します。明示的な認証パスが設定されていない場合、起動時に token モードへ解決され、その起動専用のランタイムトークンが生成されます。そのため、ローカル WS クライアントも認証する必要があります。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    クライアントが再起動後も安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。パスワードモードや、ID 認識リバースプロキシ向けの `trusted-proxy` も選択できます。オープンな loopback にするには、`gateway.auth.mode: "none"` を明示的に設定します。`openclaw doctor --generate-gateway-token` はいつでもトークンを生成します。

  </Accordion>

  <Accordion title="設定を変更した後は再起動が必要ですか？">
    Gateway は設定を監視し、ホットリロードをサポートしています: `gateway.reload.mode: "hybrid"` (デフォルト) は安全な変更をホット適用し、重要な変更では再起動します。`hot`、`restart`、`off` もサポートされています。ほとんどの `tools.*`、`agents.*` ポリシー、`session.*`、`messages.*` の変更は、リロード操作なしですぐに適用されます。`gateway.*` の bind/port 変更には再起動が必要です。
  </Accordion>

  <Accordion title="ユーモラスな CLI タグラインを無効にするには？">
    `cli.banner.taglineMode` を設定します:

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
    - `default`: 常に `All your chats, one OpenClaw.` を使います。
    - `random`: ローテーションするユーモラス/季節的なタグライン (デフォルト動作)。
    - バナー自体を表示しない場合は、env `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索 (および Web fetch) を有効にするには？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択したプロバイダーに依存します:

    | プロバイダー | キー不要 | 環境変数 |
    | --- | --- | --- |
    | Brave | いいえ | `BRAVE_API_KEY` |
    | DuckDuckGo | はい (非公式の HTML ベース) | - |
    | Exa | いいえ | `EXA_API_KEY` |
    | Firecrawl | いいえ | `FIRECRAWL_API_KEY` |
    | Gemini | いいえ | `GEMINI_API_KEY` |
    | Grok | いいえ (xAI OAuth またはキー) | `XAI_API_KEY` |
    | Kimi | いいえ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |
    | MiniMax Search | いいえ | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` |
    | Ollama Web Search | はい (`ollama signin` が必要) | - |
    | Perplexity | いいえ | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` |
    | SearXNG | はい (セルフホスト) | `SEARXNG_BASE_URL` |
    | Tavily | いいえ | `TAVILY_API_KEY` |

    Grok はモデル認証の xAI OAuth (`openclaw onboard --auth-choice xai-oauth`) も再利用できます。

    **推奨**: `openclaw configure --section web` を実行し、プロバイダーを選択します。

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
            provider: "firecrawl", // 任意。自動検出する場合は省略
          },
        },
      },
    }
    ```

    プロバイダー固有の Web 検索設定は `plugins.entries.<plugin>.config.webSearch.*` の下にあります。従来の `tools.web.search.*` プロバイダーパスも互換性のために読み込まれますが、新しい設定では使用しないでください。Firecrawl の Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    - 許可リスト: 3 つすべてに対して `web_search`/`web_fetch`/`x_search`、または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から最初に準備できている取得フォールバックプロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で設定が消えました。どう復旧し、これを避けられますか？">
    `config.apply` は **設定全体**を置き換えます。部分的なオブジェクトを渡すと、それ以外はすべて削除されます。

    現在の OpenClaw は、ほとんどの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の設定全体を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 起動またはホットリロードを壊す直接編集があると、Gateway はフェイルクローズするかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担当し、最後に正常だった設定を復元でき、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 最後に正常だった設定や拒否ペイロードがない場合: バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - 予期しない消失: 最後に分かっている設定またはバックアップを添えてバグを報告してください。ローカルのコーディングエージェントなら、多くの場合ログや履歴から動作する設定を再構築できます。

    回避方法: 小さな変更には `openclaw config set`、対話的な編集には `openclaw configure`、不慣れなパスの確認には `config.schema.lookup`（浅いスキーマノードと直下の子要素サマリーを返します）、部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換え用に残してください。エージェント向けの `gateway` ランタイムツールは、従来の `tools.bash.*` エイリアス経由であっても `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。

    ドキュメント: [Config](/ja-JP/cli/config)、[Configure](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいだ専用ワーカーで中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（たとえば Raspberry Pi）に **ノード**と**エージェント**を組み合わせる構成です。

    - **Gateway（中央）**: チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）**: Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）**: 特別な役割（たとえば運用と個人データ）ごとに分かれた頭脳/ワークスペースです。
    - **サブエージェント**: メインエージェントからバックグラウンド作業を生成して並列化します。
    - **TUI**: Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [ノード](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザーはヘッドレスで実行できますか？">
    はい:

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

    デフォルトは `false`（ヘッドあり）です。ヘッドレスは一部のサイトでボット対策チェックを引き起こしやすくなります（X/Twitter はヘッドレスセッションをブロックすることがよくあります）。同じ Chromium エンジンを使用し、ほとんどの自動化で動作します。主な違いは、表示されるブラウザーウィンドウがないことです（視覚確認にはスクリーンショットを使用します）。[Browser](/ja-JP/tools/browser) を参照してください。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。[Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="Telegram、gateway、ノードの間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **gateway** によって処理されます。gateway がエージェントを実行し、ノードツールが必要な場合にのみ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram -> Gateway -> Agent -> `node.*` -> Node -> Gateway -> Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは自分のコンピューターにどうアクセスできますか？">
    コンピューターを**ノード**としてペアリングします。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    1. 常時稼働するホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストとコンピューターを同じ tailnet に入れます。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して、ノードとして登録します。
    5. ノードを承認します:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティの注意: macOS ノードをペアリングすると、そのマシンで `system.run` が可能になります。信頼するデバイスだけをペアリングしてください。[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが、返信がありません。次に何をすればよいですか？">
    基本を確認します。

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    次に認証とルーティングを確認します。Tailscale Serve を使っている場合は `gateway.auth.allowTailscale` が正しく設定されていることを確認します。SSH トンネルで接続している場合は、トンネルが起動していて正しいポートを指していることを確認します。DM/グループ許可リストに自分のアカウントが含まれていることも確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士で通信できますか（ローカル + VPS）？">
    はい。ただし組み込みのボット間ブリッジはありません。

    **最も簡単**: 両方のボットがアクセスできる通常のチャットチャンネル（Slack/Telegram/WhatsApp）を使用します。Bot A から Bot B にメッセージを送り、その後は通常どおり Bot B に返信させます。

    **CLI ブリッジ（汎用）**: `openclaw agent --message ... --deliver` で別の Gateway を呼び出すスクリプトを実行し、相手のボットがリッスンしているチャットを対象にします。片方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote) を参照）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    2 つのボットが無限ループしないようにガードレールを追加します（メンションのみ、チャンネル許可リスト、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに個別の VPS は必要ですか？">
    いいえ。1 つの Gateway が複数のエージェントをホストし、それぞれが独自のワークスペース、モデルデフォルト、ルーティングを持ちます。これは通常のセットアップであり、エージェントごとに 1 つの VPS を用意するよりもはるかに安価でシンプルです。個別の VPS は、強い分離（セキュリティ境界）や共有したくない大きく異なる設定が必要な場合にのみ使用してください。
  </Accordion>

  <Accordion title="VPS から SSH する代わりに個人用ラップトップをノードとして使う利点はありますか？">
    はい。ノードは、リモート Gateway からラップトップに到達し、シェルアクセス以上の機能を解放するための第一級の方法です。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、軽量です（小さな VPS や Raspberry Pi クラスのマシンで十分です。4 GB RAM で足ります）。そのため、常時稼働ホストにラップトップをノードとして追加する構成が一般的です。

    - **インバウンド SSH は不要** - ノードはデバイスペアリングを介して Gateway WebSocket へアウトバウンド接続します。
    - **より安全な実行制御** - `system.run` はそのラップトップ上のノード許可リスト/承認によって制御されます。
    - **より多くのデバイスツール** - ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化** - Gateway は VPS 上に置いたまま、ノードホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でローカル Chrome に接続できます。

    SSH は一時的なシェルアクセスには適しています。継続的なエージェントワークフローとデバイス自動化には、ノードの方がシンプルです。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは gateway サービスを実行しますか？">
    いいえ。分離プロファイルを意図的に実行する場合を除き（[複数 Gateway](/ja-JP/gateway/multiple-gateways) を参照）、ホストごとに実行する **gateway** は 1 つだけにしてください。ノードは gateway に接続する周辺機器です（iOS/Android ノード、またはメニューバーアプリの macOS「ノードモード」）。ヘッドレスノードホストと CLI 制御については、[ノードホスト CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、ホストされる Plugin サーフェスの変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC 方法はありますか？">
    はい:

    - `config.schema.lookup`: 書き込み前に、浅いスキーマノード、一致した UI ヒント、直下の子要素サマリーとともに 1 つの設定サブツリーを調べます。
    - `config.get`: 現在のスナップショットとハッシュを取得します。
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します。
    - `config.apply`: 設定全体を検証して置き換えます。可能な場合はホットリロードし、必要な場合は再起動します。
    - エージェント向けの `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスも同じ保護対象パスに正規化されます。

  </Accordion>

  <Accordion title="初回インストール向けの最小限の妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ワークスペースを設定し、誰がボットを起動できるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale をセットアップし、Mac から接続するにはどうすればよいですか？">
    1. **VPS にインストールしてログイン**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Mac にインストールしてログイン**します。Tailscale アプリを使い、同じ tailnet に入れます。
    3. **MagicDNS を有効化**します。Tailscale 管理コンソールで有効にすると、VPS に安定した名前が付きます。
    4. **tailnet ホスト名を使用**します: SSH は `ssh user@your-vps.tailnet-xxxx.ts.net`、Gateway WS は `ws://your-vps.tailnet-xxxx.ts.net:18789`。

    SSH なしで Control UI を使うには、VPS で Tailscale Serve を使用します。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway はループバックにバインドされたままになり、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway (Tailscale Serve) に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    1. VPS と Mac が同じ tailnet 上にあることを確認します。
    2. Remote モードで macOS アプリを使用します（SSH ターゲットには tailnet ホスト名を使用できます） - これにより Gateway ポートがトンネルされ、ノードとして接続されます。
    3. ノードを承認します:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway プロトコル](/ja-JP/gateway/protocol), [Discovery](/ja-JP/gateway/discovery), [macOS リモートモード](/ja-JP/platforms/mac/remote).

  </Accordion>

  <Accordion title="2 台目のラップトップにインストールすべきですか、それともノードを追加するだけでよいですか？">
    2 台目のラップトップで **ローカルツールのみ**（screen/camera/exec）を使う場合は、**ノード** として追加します - Gateway は 1 つで、設定の重複はありません。ローカルノードツールは現在 macOS のみ対応です。2 つ目の Gateway は、**強い分離** または完全に別々の 2 つのボットが必要な場合にのみインストールします。

    Docs: [ノード](/ja-JP/nodes), [ノード CLI](/ja-JP/cli/nodes), [複数 Gateway](/ja-JP/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から env vars を読み取り、さらに以下を読み込みます:

    - 現在の作業ディレクトリの `.env`。
    - `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`) からのグローバルフォールバック `.env`。

    どちらの `.env` ファイルも既存の env vars を上書きしません。プロバイダー認証情報キーはワークスペース `.env` の例外です。`GEMINI_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY` などのキー（およびその他の同梱プロバイダー認証 env vars）はワークスペース `.env` からは無視され、プロセス環境、`~/.openclaw/.env`、または config `env` に置く必要があります。

    config 内のインライン env vars は、プロセス env に存在しない場合にのみ適用されます:

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

  <Accordion title="service 経由で Gateway を起動したら env vars が消えました。どうすればよいですか？">
    修正方法は 2 つあります:

    1. 不足しているキーを `~/.openclaw/.env` に置くと、service が shell env を継承しない場合でも読み込まれます。
    2. shell import を有効にします（任意の利便機能）:
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
       これは login shell を実行し、不足している想定キーのみをインポートします（上書きはしません）。対応する env var: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off" は env vars が不足しているという意味では**ありません** - OpenClaw が login shell を自動的に読み込まないという意味です。

    Gateway が service（launchd/systemd）として実行されている場合、shell environment は継承されません。token を `~/.openclaw/.env` に置くか、`env.shellEnv.enabled: true` を有効にするか、config `env` に追加して（不足している場合のみ適用）、gateway を再起動してから再確認してください:

    ```bash
    openclaw models status
    ```

    Copilot token は次の順序で解決されます: `OPENCLAW_GITHUB_TOKEN`、次に `COPILOT_GITHUB_TOKEN`、次に `GH_TOKEN`、次に `GITHUB_TOKEN`。

    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    単独のメッセージとして `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送らない場合、セッションは自動的にリセットされますか？">
    はい。デフォルトのリセットポリシーは **毎日** です。セッションは、現在のセッションが開始された時刻を基準に、gateway ホスト上の設定されたローカル時刻（`session.reset.atHour`、デフォルト `4`、0-23）でロールオーバーします。代わりに idle ベースのリセットに切り替えるには、`mode: "idle"` と `session.reset.idleMinutes` を使用します。これは非アクティブな期間後にセッションを期限切れにします（heartbeat/cron/exec system events ではなく、最後の実際の操作に基づきます）。

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` は `direct`（legacy alias `dm`）、`group`、`thread` をサポートします。従来のトップレベル `session.idleMinutes` は、`session.reset`/`resetByType` ブロックが設定されていない場合、idle-mode default の互換エイリアスとして引き続き機能します。active provider-owned CLI session を持つセッションは、暗黙の daily default では切断されません。完全なライフサイクルについては [セッション管理](/ja-JP/concepts/session) を参照してください。

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を作る方法はありますか？">
    はい、**multi-agent routing** と **sub-agents** により可能です。1 つの coordinator agent と、それぞれ独自の workspaces と models を持つ複数の worker agents を使用します。

    これは楽しい実験として見るのが最適です - token を大量に使い、別々の sessions を持つ 1 つの bot より効率が低いことがよくあります。典型的なモデルは、会話する bot が 1 つあり、並列作業には別々の sessions を使い、必要に応じて sub-agents を起動する形です。

    Docs: [Multi-agent routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [Agents CLI](/ja-JP/cli/agents).

  </Accordion>

  <Accordion title="タスクの途中で context が切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    セッション context は model window によって制限されます。長い chats、大きな tool outputs、多数の files により compaction または truncation が発生することがあります。

    - bot に現在の状態を要約して file に書くよう依頼します。
    - 長い tasks の前に `/compact` を使い、topics を切り替えるときは `/new` を使います。
    - 重要な context は workspace に保持し、bot に読み返すよう依頼します。
    - 長い作業や並列作業には sub-agents を使い、main chat を小さく保ちます。
    - これが頻繁に起きる場合は、より大きな context window を持つ model を選びます。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    ```bash
    openclaw reset
    ```

    非対話式の full reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、setup を再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    既存の config が検出された場合、オンボーディングでも **Reset** が提示されます。[オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。profiles（`--profile` / `OPENCLAW_PROFILE`）を使用している場合は、各 state dir（デフォルト `~/.openclaw-<profile>`）をリセットします。Dev-only reset: `openclaw gateway --dev --reset` は dev config、credentials、sessions、workspace を消去します。

  </Accordion>

  <Accordion title='「context too large」エラーが発生しています - リセットまたは compact するにはどうすればよいですか？'>
    - **Compact**（会話を保持し、古い turns を要約します）: `/compact`、または要約を指示する `/compact <instructions>`。
    - **Reset**（同じ chat key の fresh session ID）: `/new` または `/reset`。

    これが続く場合は、**session pruning**（`agents.defaults.contextPruning`）を調整して古い tool output を削減するか、より大きな context window を持つ model を使用してください。

    Docs: [Compaction](/ja-JP/concepts/compaction), [Session pruning](/ja-JP/concepts/session-pruning), [Session management](/ja-JP/concepts/session).

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    Provider validation error: model が必須の `input` なしで `tool_use` ブロックを出力しました。通常は、session history が古いか破損していることを意味します（長い threads や tool/schema change の後によくあります）。

    修正: `/new`（standalone message）で fresh session を開始します。

  </Accordion>

  <Accordion title="30 分ごとに heartbeat messages が届くのはなぜですか？">
    Heartbeats はデフォルトで **30m** ごとに実行されます。resolved auth mode が Anthropic OAuth/token auth（Claude CLI reuse を含む）で `heartbeat.every` が未設定の場合は **1h** ごとです。調整または無効化するには:

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

    `HEARTBEAT.md` が存在していても実質的に空（空行、Markdown/HTML comments、ATX headings、fence markers、または空の list-item stubs のみ）の場合、OpenClaw は API calls を節約するため heartbeat run をスキップします。file が存在しない場合でも heartbeat は実行され、model が何をするかを決定します。

    Per-agent overrides は `agents.list[].heartbeat` を使用します。Docs: [Heartbeat](/ja-JP/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp グループに「bot account」を追加する必要がありますか？'>
    いいえ。OpenClaw は **自分の account** で実行されます - 自分が group に入っていれば、OpenClaw はそれを見ることができます。デフォルトでは、senders を許可するまで group replies はブロックされます（`groupPolicy: "allowlist"`）。

    group replies を自分だけに制限するには:

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
    最速の方法: logs を tail し、group で test message を送信します。

    ```bash
    openclaw logs --follow --json
    ```

    `1234567890-1234567890@g.us` のように `@g.us` で終わる `chatId`（または `from`）を探します。

    すでに設定済み/allowlisted の場合は、config から groups を一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/ja-JP/cli/directory), [Logs](/ja-JP/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw が group で返信しないのはなぜですか？">
    一般的な原因は 2 つあります。mention gating がデフォルトでオンになっている（bot を @mention するか、`mentionPatterns` に一致する必要がある）か、`channels.whatsapp.groups` を `"*"` なしで設定していて、その group が allowlisted ではない場合です。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="groups/threads は DMs と context を共有しますか？">
    Direct chats はデフォルトで main session に集約されます。Groups/channels は独自の session keys を持ち、Telegram topics / Discord threads は別々の sessions です。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="いくつの workspaces と agents を作成できますか？">
    ハードリミットはありません - 数十または数百でも問題ありませんが、以下に注意してください:

    - **Disk growth**: sessions と transcripts は `~/.openclaw/agents/<agentId>/sessions/` 配下にあります。
    - **Token cost**: agents が増えるほど、同時 model usage が増えます。
    - **Ops overhead**: agent ごとの auth profiles、workspaces、channel routing。

    agent ごとに **active** workspace を 1 つ維持し（`agents.defaults.workspace`）、disk が増えたら古い sessions を prune し、`openclaw doctor` を使って stray workspaces と profile mismatches を見つけます。

  </Accordion>

  <Accordion title="複数の bots または chats を同時に実行できますか（Slack）、またどのように設定すべきですか？">
    はい、**Multi-Agent Routing** により可能です。複数の isolated agents を実行し、inbound messages を channel/account/peer によって route します。Slack は channel としてサポートされ、特定の agents に bind できます。

    Browser access は強力ですが、「人間にできることは何でもできる」わけではありません - anti-bot、CAPTCHAs、MFA は automation をブロックすることがあります。最も信頼できる control には、host 上の local Chrome MCP、または実際に browser を実行している machine 上の CDP を使用します。

    Best-practice setup: always-on Gateway host（VPS/Mac mini）、role ごとに 1 つの agent（bindings）、それらの agents に bound された Slack channel(s)、必要に応じて Chrome MCP または node 経由の local browser。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、[Browser](/ja-JP/tools/browser)、[Nodes](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデル Q&A - デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル - は [Models FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。優先順位:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" なのに "Connectivity probe: failed" と表示するのはなぜですか？'>
    "Running" は **スーパーバイザー** の見方（launchd/systemd/schtasks）です。接続プローブは、CLI が実際に Gateway WebSocket に接続しています。`openclaw gateway status` の次の行を信頼してください: `Probe target:`（プローブが使用した URL）、`Listening:`（ポートで実際にバインドされているもの）、`Last gateway error:`（プロセスは生きているがポートが listen していない場合の一般的な根本原因）。
  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    サービスが別の設定ファイルで実行されている一方で、別の設定ファイルを編集しています（多くの場合 `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正するには、サービスに使用させたい同じ `--profile` / 環境から実行します:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='"another gateway instance is already listening" とはどういう意味ですか？'>
    OpenClaw は起動時に WebSocket リスナーを即座にバインドすることでランタイムロックを強制します（デフォルト `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、`GatewayLockError`（"another gateway instance is already listening"）をスローします。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート認証情報を付けて、リモート WebSocket URL を指定します:

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

    - `openclaw gateway` は `gateway.mode` が `local` の場合（または上書きフラグを渡した場合）にのみ起動します。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報のみです。それ自体でローカル Gateway 認証を有効にするものではありません。

  </Accordion>

  <Accordion title='Control UI が "unauthorized" と表示する（または再接続を繰り返す）場合はどうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードから）:

    - Control UI はトークンを `sessionStorage` に保持し、現在のブラウザータブと選択された Gateway URL にスコープします。そのため、同じタブでの更新は長期間保持される localStorage トークン永続化なしで動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway がリトライヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュ済みデバイストークンで 1 回だけの限定リトライを試行できます。
    - そのキャッシュ済みトークンのリトライでは、デバイストークンとともに保存されたキャッシュ済みの承認済みスコープを再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを保持します。
    - そのリトライパス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - 組み込みのセットアップコードブートストラップは、`scopes: []` を持つノードデバイストークンと、信頼済みモバイルオンボーディング用の限定されたオペレーターハンドオフトークンを返します。オペレーターハンドオフはセットアップ時のネイティブ設定を読み取れますが、ペアリング変更スコープや `operator.admin` は付与しません。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモート: まず `ssh -N -L 18789:127.0.0.1:18789 user@host` でトンネルし、その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、Control UI 設定に一致するシークレットを貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale ID ヘッダーを迂回する生のループバック/tailnet URL ではなく、Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 設定済みの ID 対応プロキシ経由でアクセスしていることを確認します。同一ホストのループバックプロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回のリトライ後も不一致が続く場合: ペアリング済みデバイストークンをローテーション/再承認します:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - ローテーションが拒否される場合: ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り **自分自身の** デバイスのみをローテーションできます。また、明示的な `--scope` 値は呼び出し元の現在のオペレータースコープを超えることはできません。
    - まだ詰まっている場合: `openclaw status --all` と [Troubleshooting](/ja-JP/gateway/troubleshooting)。認証の詳細は [Dashboard](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが、バインドできず何も listen しません">
    `tailnet` バインドはネットワークインターフェイスから Tailscale IP を選びます（100.64.0.0/10）。マシンが Tailscale 上にない（またはインターフェイスがダウンしている）場合、バインド先はありません。

    修正: そのホストで Tailscale を起動するか、`gateway.bind: "loopback"` / `"lan"` に切り替えます。

    `tailnet` は明示的です。`auto` はループバックを優先します。tailnet 専用バインドには `gateway.bind: "tailnet"` を使用します。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長性（たとえばレスキューボット）または厳密な分離のためだけに使用し、それぞれを独自の `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace`、一意の `gateway.port` で分離してください。

    推奨: インスタンスごとに `openclaw --profile <name> ...`（`~/.openclaw-<name>` を自動作成）、プロファイル設定ごとに一意の `gateway.port`（または手動実行では `--port`）、および `openclaw --profile <name> gateway install` によるプロファイルごとのサービス。

    プロファイルはサービス名にも接尾辞を付けます: launchd `ai.openclaw.<profile>`、systemd `openclaw-gateway-<profile>.service`、Windows `OpenClaw Gateway (<profile>)`。修飾なしの `openclaw-gateway` systemd ユニットはデフォルトプロファイルにのみ存在します。名前変更前のレガシー systemd ユニット名 `clawdbot-gateway` は自動的に移行されます。

    完全なガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 とは何ですか？'>
    Gateway は **WebSocket サーバー** であり、最初のメッセージとして `connect` フレームを期待します。それ以外はすべて **コード 1008**（ポリシー違反）で接続を閉じます。

    一般的な原因: WS クライアントではなくブラウザーで **HTTP** URL を開いた、ポート/パスが間違っている、またはプロキシ/トンネルが認証ヘッダーを削除した、あるいは Gateway 以外のリクエストを送信した。

    修正: WS URL（`ws://<host>:18789`、または HTTPS 経由では `wss://...`）を使用し、通常のブラウザータブで WS ポートを開かず、認証が有効な場合は `connect` フレームにトークン/パスワードを含めます。CLI/TUI の例:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコル詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ロギングとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。安定したパスは `logging.file` で設定します。ファイルログレベルは `logging.level`、コンソールの詳細度は `--verbose` と `logging.consoleLevel` で設定します。

    最速の tail:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ（Gateway が launchd/systemd 経由で実行される場合）:

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルは `gateway-<profile>.log` を使用します。stderr は抑制されます）。
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    詳細は [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました - OpenClaw を再起動するにはどうすればよいですか？">
    Windows のインストールモードは 3 つあります:

    **1) Windows Hub ローカルセットアップ**: ネイティブアプリが、ローカルのアプリ所有 WSL Gateway を管理します。スタートメニューまたはトレイから **OpenClaw Companion** を開き、**Gateway Setup** または Connections タブを使用します。

    **2) 手動 WSL2 Gateway**: Gateway は Linux 内で実行されます。
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    サービスをインストールしていない場合は、フォアグラウンドで開始します: `openclaw gateway run`。

    **3) ネイティブ Windows CLI/Gateway**: Windows で直接実行されます。
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    手動で実行する場合（サービスなし）: `openclaw gateway run`。

    ドキュメント: [Windows](/ja-JP/platforms/windows)、[Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は稼働していますが返信が届きません。何を確認すべきですか？">
    クイックヘルス確認:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因: モデル認証が **Gateway ホスト** に読み込まれていない（`models status` を確認）、チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定とログを確認）、または WebChat/Dashboard を正しいトークンなしで開いている。リモートの場合は、トンネル/Tailscale 接続が稼働しており、Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels)、[Troubleshooting](/ja-JP/gateway/troubleshooting)、[Remote access](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - どうすればよいですか？'>
    通常は、UI が WebSocket 接続を失ったことを意味します。確認してください: Gateway は実行中ですか（`openclaw gateway status`）？正常ですか（`openclaw status`）？UI は正しいトークンを持っていますか（`openclaw dashboard`）？リモートの場合、トンネル/Tailscale リンクは稼働していますか？

    次にログを tail します:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[Remote access](/ja-JP/gateway/remote)、[Troubleshooting](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューのエントリが多すぎます。OpenClaw はすでに Telegram の上限までトリミングし、より少ないコマンドで再試行しますが、一部のメニューエントリはまだ削除される場合があります。plugin/skill/カスタムコマンドを減らすか、メニューが不要であれば `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上またはプロキシ背後では、アウトバウンド HTTPS が許可され、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[Channel troubleshooting](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すればよいですか？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャットチャネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するには？">
    サービスとしてインストールしている場合（macOS の launchd、Linux の systemd）:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    フォアグラウンドでは、Ctrl-C で停止してから `openclaw gateway run` を実行します。

    ドキュメント: [Gateway サービス運用手順](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="5歳児にも分かる説明: openclaw gateway restart と openclaw gateway">
    `openclaw gateway restart` は**バックグラウンドサービス**（launchd/systemd）を再起動します。`openclaw gateway` は、このターミナルセッションで Gateway を**フォアグラウンド**実行します。サービスをインストールしている場合は Gateway サブコマンドを使い、単発の場合は素のフォアグラウンド実行を使います。
  </Accordion>

  <Accordion title="何かが失敗したときに詳細を最速で得る方法">
    `--verbose` を付けて Gateway を起動してコンソール詳細を増やし、その後ログファイルでチャネル認証、モデルルーティング、RPC エラーを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分のスキルが画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルは、`media`、`mediaUrl`、`path`、`filePath` などの構造化メディアフィールドを使う必要があります。[OpenClaw アシスタント設定](/ja-JP/start/openclaw)と[エージェント送信](/ja-JP/tools/agent-send)を参照してください。

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    併せて確認してください: 対象チャネルが送信メディアをサポートしていて、許可リストでブロックされていないこと。ファイルがプロバイダーのサイズ制限内であること（画像は最大辺 2048px にリサイズされます）。`tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに制限します。`tools.fs.workspaceOnly=false`（デフォルト）では、構造化ローカルメディア送信で、エージェントがすでに読み取れるホストローカルファイルを、メディアと安全なドキュメント種別（画像、音声、動画、PDF、Office ドキュメント、Markdown/MD、TXT、JSON、YAML/YML などの検証済みテキストドキュメント）に使えます。これはシークレットスキャナーではありません。拡張機能とコンテンツ検証が一致する場合、エージェントが読み取れる `secret.txt` や `config.json` を添付できます。機密ファイルはエージェントが読み取れるパスの外に置くか、より厳格なローカルパス送信のために `tools.fs.workspaceOnly=true` を維持してください。

    [画像](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトではリスクが低減されます:

    - DM 対応チャネルのデフォルト動作は**ペアリング**です。不明な送信者はペアリングコードを受け取り、そのメッセージは処理されません。`openclaw pairing approve --channel <channel> [--account <id>] <code>` で承認します。保留中のリクエストは**チャネルごとに 3 件**に制限されます。コードが届かなかった場合は、`openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    `openclaw doctor` を実行して、リスクのある DM ポリシーを表示します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの懸念ですか？">
    いいえ。プロンプトインジェクションは、ボットに DM できる相手だけでなく、**信頼できないコンテンツ**の問題です。アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツにはモデルを乗っ取ろうとする指示が含まれる可能性があります。送信者が自分だけであっても同じです。

    最大のリスクはツールが有効な場合です。モデルがだまされて、コンテキストを外部に流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を小さくしてください:

    - 信頼できないコンテンツを要約するには、読み取り専用またはツール無効の「リーダー」エージェントを使う
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses `input_file` とメディア添付抽出はいずれも、生のファイルテキストを渡すのではなく、抽出テキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化し、厳格なツール許可リストを使う

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw は Rust/WASM ではなく TypeScript/Node を使っているため安全性が低いのですか？">
    言語とランタイムは重要ですが、個人エージェントにとって主なリスクではありません。実際のリスクは、Gateway の公開、ボットにメッセージを送れる相手、プロンプトインジェクション、ツール範囲、認証情報の扱い、ブラウザアクセス、exec アクセス、サードパーティのスキル/Plugin の信頼性です。

    Rust と WASM は一部のコード分類に対してより強い分離を提供できますが、プロンプトインジェクション、不適切な許可リスト、公開 Gateway、過度に広いツール、機密アカウントにすでにログイン済みのブラウザプロファイルは解決しません。主要な制御として、Gateway を非公開または認証付きに保ち、DM/グループにはペアリングと許可リストを使い、信頼できない入力に対してリスクの高いツールを拒否またはサンドボックス化し、信頼できる Plugin とスキルのみをインストールし、設定変更後に `openclaw security audit --deep` を実行してください。

    詳細: [セキュリティ](/ja-JP/gateway/security), [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="公開された OpenClaw インスタンスに関する報告を見ました。何を確認すればよいですか？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    より安全なベースライン: Gateway を `loopback` にバインドする、または認証済みのプライベートアクセス（tailnet、SSH トンネル、トークン/パスワード認証、正しく設定された信頼済みプロキシ）経由でのみ公開する。DM は `pairing` または `allowlist` モードにする。グループは許可リスト化し、全メンバーが信頼されていない限りメンション必須にする。信頼できないコンテンツを読むエージェントでは、高リスクツール（`exec`、`browser`、`gateway`、`cron`）を拒否するか厳しくスコープする。ツール実行の影響範囲を小さくする必要がある場所ではサンドボックス化を有効にする。

    認証なしの公開バインド、ツール付きの公開 DM/グループ、公開されたブラウザ制御は、最初に修正すべき検出事項です。詳細: [openclaw security audit](/ja-JP/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="ClawHub のスキルやサードパーティ Plugin はインストールしても安全ですか？">
    サードパーティのスキルと Plugin は、信頼することを選ぶコードとして扱ってください。ClawHub のスキルページはインストール前にスキャン状態を表示しますが、スキャンは完全なセキュリティ境界ではありません。OpenClaw は Plugin/スキルのインストールや更新時に、組み込みのローカル危険コードブロックを実行しません。ローカルの許可/ブロック判断には、オペレーター所有の `security.installPolicy` を使ってください。

    より安全なパターン: 信頼できる作者と固定バージョンを優先し、有効化前にスキル/Plugin を読み、Plugin/スキルの許可リストを狭く保ち、信頼できない入力のワークフローは最小限のツールを持つサンドボックスで実行し、サードパーティコードに広範なファイルシステム、exec、ブラウザ、シークレットアクセスを与えないようにします。

    詳細: [Skills](/ja-JP/tools/skills), [Plugin](/ja-JP/tools/plugin), [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="自分のボットに専用のメール、GitHub アカウント、電話番号を持たせるべきですか？">
    ほとんどの設定では、はい。ボットを別アカウントや別電話番号で分離すると、問題が起きた場合の影響範囲が小さくなり、個人アカウントに影響を与えずに認証情報のローテーションやアクセス取り消しがしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントだけにアクセスを与え、必要になったら後で拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security), [ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は推奨**しません**。最も安全なパターン: DM は**ペアリングモード**または厳格な許可リストに保ち、あなたの代わりにメッセージを送る必要がある場合は**別の番号またはアカウント**を使い、送信前に**承認**する形で下書きさせます。

    実験する場合は、専用の分離されたアカウントで行ってください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で、入力が信頼できる場合に限ります。小さいティアは指示の乗っ取りを受けやすいため、ツール有効エージェントや信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取れませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、`dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスするには、送信者 ID を許可リストに追加するか、そのアカウントの `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 自分の連絡先にメッセージを送りますか？ペアリングはどう機能しますか？">
    いいえ。デフォルトの WhatsApp DM ポリシーは**ペアリング**です。不明な送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClaw は、受信したチャットまたはあなたが明示的にトリガーした送信にのみ返信します。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプトは、あなた自身の DM が許可されるように**許可リスト/所有者**を設定します。自動送信には使われません。個人の WhatsApp 番号では、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするには？">
    ほとんどの内部/ツールメッセージは、そのセッションで **verbose**、**trace**、**reasoning** が有効な場合にのみ表示されます。

    表示されているチャットで修正します:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    まだうるさい場合: Control UI のセッション設定を確認し、verbose を**継承**に設定します。設定で `verboseDefault: "on"` のボットプロファイルを使っていないことを確認してください。

    ドキュメント: [思考と verbose](/ja-JP/tools/thinking), [セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするには？">
    中止をトリガーするには、次のいずれかを**単独のメッセージ**（スラッシュなし）として送信します: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `wait`, `exit`, `interrupt`, `halt`。一般的な英語以外のトリガー（フランス語、ドイツ語、スペイン語、中国語、日本語、ヒンディー語、アラビア語、ロシア語）も機能します。

    exec ツールで開始されたバックグラウンドプロセスについては、エージェントに次を実行するよう依頼してください:

    ```text
    process action:kill sessionId:XXX
    ```

    ほとんどのスラッシュコマンドは、`/` で始まる**単独の**メッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は、許可リスト済み送信者であればインラインでも機能します。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送信するには？（「Cross-context messaging denied」）'>
    OpenClaw はデフォルトで**プロバイダー間**メッセージングをブロックします。ツール呼び出しが Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。また、これは即時に有効になり、Gateway の再起動は不要です:

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

  </Accordion>

  <Accordion title='ボットが短時間に連続するメッセージを「無視する」ように感じるのはなぜですか？'>
    実行中のプロンプトは、デフォルトでアクティブな実行に誘導されます。`/queue` を使って、アクティブ実行の動作を選択します。

    - `steer` (デフォルト) - 次のモデル境界でアクティブな実行を誘導します。
    - `followup` - メッセージをキューに入れ、現在の実行が終了した後に 1 つずつ実行します。
    - `collect` - 互換性のあるメッセージをキューに入れ、現在の実行が終了した後に 1 回返信します。
    - `interrupt` - 現在の実行を中止し、新しく開始します。

    `debounce:0.5s cap:25 drop:summarize` のようなオプションをキュー済みモードに追加します。[コマンドキュー](/ja-JP/concepts/queue) と [Steering キュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う Anthropic のデフォルトモデルは何ですか？'>
    認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する (または認証プロファイルに Anthropic API キーを保存する) と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです (たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`)。`No credentials found for profile "anthropic:default"` は、Gateway が実行中のエージェントの想定される `auth-profiles.json` 内で Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) - インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) - モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) - 症状優先のトリアージ
