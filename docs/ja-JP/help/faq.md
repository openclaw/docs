---
read_when:
    - セットアップ、インストール、オンボーディング、またはランタイムに関する一般的なサポート質問への回答
    - 詳細なデバッグ前のユーザー報告問題のトリアージ
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-07-12T14:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

現実の環境（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）に関する簡潔な回答と詳細なトラブルシューティングです。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れたときの最初の 60 秒

<Steps>
  <Step title="クイックステータス">
    ```bash
    openclaw status
    ```
    ローカル環境の簡潔な概要：OS とアップデート、Gateway/サービスへの到達性、エージェント/セッション、プロバイダー設定とランタイムの問題（Gateway に到達できる場合）。
  </Step>
  <Step title="貼り付け可能なレポート（安全に共有可能）">
    ```bash
    openclaw status --all
    ```
    ログ末尾を含む読み取り専用の診断（トークンはマスクされます）。
  </Step>
  <Step title="デーモンとポートの状態">
    ```bash
    openclaw gateway status
    ```
    スーパーバイザーのランタイムと RPC の到達性、プローブ対象 URL、サービスが使用した可能性の高い設定を表示します。
  </Step>
  <Step title="詳細プローブ">
    ```bash
    openclaw status --deep
    ```
    サポートされている場合はチャンネルプローブも含め、稼働中の Gateway の健全性を調査します（到達可能な Gateway が必要です）。[ヘルス](/ja-JP/gateway/health)を参照してください。
  </Step>
  <Step title="最新ログを追跡">
    ```bash
    openclaw logs --follow
    ```
    RPC が停止している場合は、次の方法にフォールバックします。
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging)および[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。
  </Step>
  <Step title="Doctor を実行（修復）">
    ```bash
    openclaw doctor
    ```
    設定と状態を修復または移行した後、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。
  </Step>
  <Step title="Gateway のスナップショット（WS のみ）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # エラー時に対象 URL と設定パスを表示
    ```
    稼働中の Gateway に完全なスナップショットを要求します。[ヘルス](/ja-JP/gateway/health)を参照してください。
  </Step>
</Steps>

## クイックスタートと初回セットアップ

インストール、オンボーディング、認証ルート、サブスクリプション、初期エラーに関する初回利用時の Q&A は、[初回利用 FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw とは何ですか？一段落で説明してください">
    OpenClaw は、自分のデバイスで実行するパーソナル AI アシスタントです。普段使用しているメッセージング環境（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp、および QQ Bot などの同梱チャンネル Plugin）で応答し、サポートされているプラットフォームでは音声機能やライブ Canvas も使用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタント自体が製品です。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude のラッパー」ではありません。**自分のハードウェア**上で高性能なアシスタントを実行し、普段使用しているチャットアプリからアクセスできる**ローカルファーストのコントロールプレーン**です。ステートフルなセッション、メモリ、ツールを備え、ワークフローをホスト型 SaaS に委ねる必要はありません。

    - **自分のデバイス、自分のデータ**：Gateway を任意の場所（Mac、Linux、VPS）で実行し、ワークスペースとセッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく、実際のチャンネル**：Discord/iMessage/Signal/Slack/Telegram/WhatsApp などに加え、サポートされているプラットフォームではモバイル音声と Canvas を利用できます。
    - **モデル非依存**：Anthropic、MiniMax、OpenAI、OpenRouter などを、エージェントごとのルーティングとフェイルオーバーとともに使用できます。
    - **ローカル専用オプション**：ローカルモデルを実行し、すべてのデータを自分のデバイス内に保持できます。
    - **マルチエージェントルーティング**：チャンネル、アカウント、タスクごとにエージェントを分離し、それぞれに独自のワークスペースとデフォルト設定を持たせられます。
    - **オープンソースで変更可能**：ベンダーロックインなしで、調査、拡張、セルフホストできます。

    ドキュメント：[Gateway](/ja-JP/gateway)、[チャンネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。まず何をすればよいですか？">
    最初のプロジェクトとして適しているのは、Web サイトの構築（WordPress、Shopify、静的サイト）、モバイルアプリのプロトタイプ作成（概要、画面、API 計画）、ファイルとフォルダーの整理、Gmail への接続と要約やフォローアップの自動化です。

    大規模なタスクも処理できますが、フェーズに分割し、並列作業にサブエージェントを使用すると最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    - **個人向けブリーフィング**：受信トレイ、カレンダー、関心のあるニュースの要約。
    - **調査と下書き**：簡単な調査、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ**：Cron または Heartbeat で実行する通知とチェックリスト。
    - **ブラウザー自動化**：フォーム入力、データ収集、Web タスクの反復実行。
    - **デバイス間の連携**：スマートフォンからタスクを送信し、サーバー上の Gateway に実行させ、結果をチャットで受け取ります。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログ作成に役立ちますか？">
    はい、**調査、見込み客の評価、下書き**に利用できます。サイトのスキャン、候補リストの作成、見込み客の要約、アウトリーチ文面や広告コピーの下書きなどが可能です。

    **アウトリーチや広告の実施**では、人間が関与する体制を維持してください。スパムを避け、地域の法律とプラットフォームのポリシーに従い、送信前にすべて確認してください。OpenClaw が下書きを作成し、ユーザーが承認します。

    ドキュメント：[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発における Claude Code と比較した利点は何ですか？">
    OpenClaw は**パーソナルアシスタント**兼コーディネーションレイヤーであり、IDE を置き換えるものではありません。リポジトリ内で最速の直接的なコーディングループを実現するには、Claude Code または Codex を使用してください。永続的なメモリ、デバイス間アクセス、ツールのオーケストレーションには OpenClaw を使用してください。

    - セッションをまたいで維持される永続的なメモリとワークスペース。
    - マルチプラットフォームアクセス（Telegram、WhatsApp、TUI、WebChat）。
    - ツールのオーケストレーション（ブラウザー、ファイル、スケジュール、フック）。
    - 常時稼働する Gateway（VPS で実行し、どこからでも操作可能）。
    - ローカルのブラウザー、画面、カメラ、コマンド実行用の Node。

    ショーケース：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを未変更の状態に保ちながら Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理対象のオーバーライドを使用します。変更は `~/.openclaw/skills/<name>/SKILL.md` に配置します（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 同梱版 -> `skills.load.extraDirs` です。そのため、git に触れることなく、管理対象のオーバーライドが同梱 Skills より優先されます。グローバルにインストールしつつ、一部のエージェントだけに表示を制限するには、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` / `agents.list[].skills` で表示範囲を制御します。リポジトリ内のコピーに対して PR を作成するのは、アップストリームに取り込む価値がある編集のみとしてください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でディレクトリを追加します（前述の順序では最も低い優先順位です）。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。特定のエージェントだけに表示を制限するには、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルや設定を使用するにはどうすればよいですか？">
    サポートされているパターン：

    - **Cron ジョブ**：分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **エージェント**：デフォルトモデル、思考レベル、ストリームパラメーターが異なる個別のエージェントにタスクをルーティングします。
    - **オンデマンド切り替え**：`/model` を使用すると、現在のセッションモデルをいつでも切り替えられます。

    例 - 同じモデルで、エージェントごとに異なる設定を使用する場合：

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

    モデルごとに共有するデフォルト値は `agents.defaults.models["provider/model"].params` に配置し、エージェント固有のオーバーライドはフラットな `agents.list[].params` に配置します。ネストされた `agents.list[].models["provider/model"].params` に同じモデルを重複して配置しないでください。このパスは、エージェントごとのモデルカタログとランタイムオーバーライド用です。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[設定](/ja-JP/gateway/config-agents)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="負荷の高い処理中にボットが応答しなくなります。処理をオフロードするにはどうすればよいですか？">
    長時間または並列のタスクには**サブエージェント**を使用します。サブエージェントは独自のセッションで実行され、要約を返すため、メインチャットの応答性を維持できます。ボットに「このタスク用のサブエージェントを起動して」と依頼するか、`/subagents` を使用します。Gateway が現在ビジー状態かどうかを確認するには、`/status` を使用します。

    長時間のタスクとサブエージェントはいずれもトークンを消費します。コストが重要な場合は、`agents.defaults.subagents.model` でサブエージェントに低コストのモデルを設定してください。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐づくサブエージェントセッションはどのように機能しますか？">
    Discord のスレッドをサブエージェントまたはセッションターゲットに紐づけると、そのスレッド内の後続メッセージは紐づけられたセッションに送られます。

    - `thread: true` を指定して `sessions_spawn` で起動します（継続的なフォローアップには、必要に応じて `mode: "session"` も指定します）。
    - または `/focus <target>` で手動で紐づけます。
    - `/agents` で紐づけ状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動フォーカス解除を制御します。
    - `/unfocus` でスレッドの紐づけを解除します。

    設定：`session.threadBindings.enabled`（グローバルスイッチ）、`session.threadBindings.idleHours`（デフォルト `24`、`0` で無効化）、`session.threadBindings.maxAgeHours`（デフォルト `0` = 上限なし）、チャンネルごとのオーバーライド `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` は、起動時の自動紐づけを制御します（デフォルト `true`）。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了通知が誤った場所に送られたか、まったく投稿されませんでした。何を確認すればよいですか？">
    解決されたリクエスターのルートを確認してください。

    - 完了モードのサブエージェント配信では、紐づけられたスレッドまたは会話ルートが存在する場合、それが優先されます。
    - 完了処理の起点にチャンネルしか含まれていない場合、OpenClaw はリクエスターセッションに保存されているルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信を引き続き成功させることができます。
    - 紐づけられたルートがなく、使用可能な保存済みルートもない場合、直接配信は失敗する可能性があり、結果は即座に投稿されず、キューに入れられたセッション配信にフォールバックします。
    - 無効または古くなったターゲットによって、キューへのフォールバックや最終的な配信失敗が発生する場合もあります。
    - 子セッションで最後に表示されたアシスタントの応答が正確に `NO_REPLY` / `no_reply` または `ANNOUNCE_SKIP` である場合、OpenClaw は古い進捗を投稿せず、意図的に通知を抑制します。

    デバッグ：`openclaw tasks show <lookup>`。`<lookup>` にはタスク ID、実行 ID、またはセッションキーを指定します。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すればよいですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に稼働していない場合、Cron は実行されません。

    - Cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 稼働していることを確認します（スリープや再起動がないこと）。
    - ジョブのタイムゾーン（`--tz` とホストのタイムゾーン）を確認します。

    デバッグ：
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は実行されましたが、チャンネルに何も送信されませんでした。なぜですか？">
    配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"`：ランナーによるフォールバック送信は行われません。
    - 通知先（`channel` / `to`）がない、または無効：ランナーは外部への配信をスキップしました。
    - チャンネル認証の失敗（`unauthorized`、`Forbidden`）：ランナーは配信を試みましたが、認証情報によって拒否されました。
    - 無言の分離実行結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可と見なされるため、キューに入れたフォールバック配信も抑止されます。

    分離 Cron ジョブでは、チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。`--announce` が制御するのは、エージェント自身がまだ送信していない最終テキストに対するランナーのフォールバック配信のみです。

    デバッグ：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行でモデルが切り替わったり、1 回再試行されたりしたのはなぜですか？">
    これはスケジュールの重複ではなく、ライブモデル切り替えの経路です。分離 Cron は実行時のモデル引き継ぎを永続化し、アクティブな実行が `LiveSessionModelSwitchError` をスローすると、切り替え後のプロバイダー／モデル（および切り替え後の認証プロファイルのオーバーライド）を維持したまま再試行します。

    モデル選択の優先順位：最初に Gmail フックのモデルオーバーライド（`hooks.gmail.model`）、次にジョブごとの `model`、次に保存済みの Cron セッションのモデルオーバーライド、最後に通常のエージェント／デフォルトのモデル選択です。

    再試行ループは、初回試行と 2 回の切り替え再試行までに制限されています。その後は無限ループせず、Cron が中止されます。

    デバッグ：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[Cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux に Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使用するか、ワークスペースに Skills を配置してください。macOS の Skills UI は Linux では利用できません。[https://clawhub.ai](https://clawhub.ai) で Skills を閲覧できます。

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

    ネイティブの `openclaw skills install` は、デフォルトでアクティブなワークスペースの `skills/` ディレクトリに書き込みます。すべてのローカルエージェント向けの共有管理 Skills ディレクトリにインストールするには、`--global` を追加します。独立した `clawhub` CLI は、自分の Skills を公開または同期する場合にのみインストールしてください。共有 Skills を表示できるエージェントを限定するには、`agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はタスクをスケジュール実行したり、バックグラウンドで継続的に実行したりできますか？">
    はい、Gateway スケジューラーを介して実行できます。

    - スケジュール済みまたは繰り返し実行するタスクには **Cron ジョブ**（再起動後も保持されます）。
    - メインセッションの定期チェックには **Heartbeat**。
    - 概要を投稿したりチャットに配信したりする自律エージェントには **分離ジョブ**。

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)、[Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Apple macOS 専用の Skills を Linux から実行できますか？">
    直接は実行できません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限され、**Gateway ホスト**上で利用条件を満たす場合にのみ読み込まれます。Linux では、制限をオーバーライドしない限り、`darwin` 専用 Skills（`apple-notes`、`apple-reminders`、`things-mac`）は読み込まれません。

    サポートされるパターンは 3 つあります。

    **オプション A - Mac 上で Gateway を実行する（最も簡単）**。macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使用する（SSH 不要）**。Linux 上で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac 上の **Node Run Commands** を "Always Ask" または "Always Allow" に設定します。Node に必要なバイナリが存在する場合、OpenClaw は macOS 専用 Skills を利用可能と見なし、エージェントは `nodes` ツールを介して実行します。"Always Ask" の場合、プロンプトで "Always Allow" を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級者向け）**。Gateway は Linux 上で維持しつつ、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにしてから、Skills が利用可能な状態を保てるよう Linux を許可するオーバーライドを設定します。

    1. バイナリ用の SSH ラッパーを作成します（例：Apple Notes 用の `memo`）。
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Linux ホスト上の `PATH` にラッパーを配置します（例：`~/bin/memo`）。
    3. Linux を許可するように Skills メタデータ（ワークスペースまたは `~/.openclaw/skills`）をオーバーライドします。
       ```markdown
       ---
       name: apple-notes
       description: macOS 上で memo CLI を使用して Apple Notes を管理します。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Skills のスナップショットを更新するため、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion または HeyGen との連携機能はありますか？">
    現在は組み込まれていません。選択肢は次のとおりです。

    - **カスタム Skills／Plugin**：信頼性の高い API アクセスに最適です（どちらにも API があります）。
    - **ブラウザー自動化**：コードなしで動作しますが、速度が遅く、壊れやすくなります。

    エージェンシー形式でクライアントごとのコンテキストを管理する場合は、クライアントごとに 1 つの Notion ページ（コンテキスト、設定、進行中の作業）を用意し、セッション開始時にそのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを作成するか、それらの API を利用する Skills を構築してください。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールでは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。すべてのローカルエージェント向けには `--global` を使用し、表示範囲を制限するには `agents.defaults.skills`／`agents.list[].skills` を設定します。一部の Skills は Homebrew でインストールされたバイナリを前提としています。Linux の場合は Linuxbrew を意味します。

    [Skills](/ja-JP/tools/skills)、[Skills の設定](/ja-JP/tools/skills-config)、[ClawHub](/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="ログイン済みの既存の Chrome を OpenClaw で使用するにはどうすればよいですか？">
    Chrome DevTools MCP を介して接続する組み込みの `user` ブラウザープロファイルを使用します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使用する場合は、明示的な MCP プロファイルを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    ローカルホストのブラウザーまたは接続済みのブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーがあるマシン上で Node ホストを実行するか、代わりにリモート CDP を使用します。

    管理対象の `openclaw` プロファイルと比較した、`existing-session`／`user` プロファイルの現在の制限は次のとおりです。

    - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には CSS セレクターではなく、スナップショット参照が必要です。
    - アップロードフックには `ref` または `inputRef` が必要で、一度に 1 ファイルのみ対応し、CSS の `element` は使用できません。
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションには、引き続き管理対象ブラウザーの経路が必要です。

    完全な比較については、[ブラウザー](/ja-JP/tools/browser#existing-session-via-chrome-devtools-mcp)を参照してください。

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか？">
    はい：[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker の機能が制限されているように感じます。すべての機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティを優先し、`node` ユーザーとして実行されるため、システムパッケージ、Homebrew、同梱ブラウザーは含まれていません。より充実したセットアップにするには、次のようにします。

    - キャッシュが保持されるように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_IMAGE_APT_PACKAGES` を使用して、システム依存関係をイメージに組み込みます。
    - 同梱 CLI を介して Playwright ブラウザーをインストールします：`node /app/node_modules/playwright-core/cli.js install chromium`。
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスを永続化します。

    ドキュメント：[Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで、DM は個人用のままにし、グループは公開／サンドボックス化できますか？">
    はい、プライベートなトラフィックが **DM**、公開トラフィックが **グループ**の場合に可能です。`agents.defaults.sandbox.mode: "non-main"` を設定すると、グループ／チャンネルセッション（メイン以外のキー）は設定済みのサンドボックスバックエンドで実行される一方、メインの DM セッションはホスト上に残ります。サンドボックス化を有効にすると、デフォルトのバックエンドは Docker です。`tools.sandbox.tools` を使用して、サンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順：[グループ：個人用 DM と公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)。主要リファレンス：[Gateway の設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:container:mode"]` に設定します（例：`"/home/user/src:/src:ro"`）。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性のあるものには `:ro` を使用してください。バインドはサンドボックスのファイルシステム境界を迂回します。

    OpenClaw は、正規化されたパスと、存在する最深の祖先を介して解決された正規パスの両方に対してバインド元を検証します。そのため、最終パスセグメントがまだ存在しない場合でも、シンボリックリンクの親を使った脱出は安全側に失敗します。

    [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)および[サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです。日次メモは `memory/YYYY-MM-DD.md`、整理された長期メモは `MEMORY.md`（メイン／プライベートセッションのみ）に保存されます。

    OpenClaw は、Compaction が会話を要約する前に、無言の **Compaction 前メモリフラッシュ**も実行し、最初に永続的なメモを書き込むようモデルに促します。これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。無効にするには `agents.defaults.compaction.memoryFlush.enabled: false` を設定します。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが何度も忘れてしまいます。記憶を定着させるにはどうすればよいですか？">
    ボットに **事実をメモリへ書き込む**よう依頼してください。長期メモは `MEMORY.md`、短期コンテキストは `memory/YYYY-MM-DD.md` に保存されます。記憶を保存するようモデルに促すことで、通常は解決します。それでも忘れ続ける場合は、Gateway が実行のたびに同じワークスペースを使用していることを確認してください。

    ドキュメント：[メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に保存され、削除されるまで保持されます。制限となるのはモデルではなくストレージです。ただし、**セッションコンテキスト**は引き続きモデルのコンテキストウィンドウに制限されるため、長い会話は圧縮または切り捨てられる可能性があります。そのためにメモリ検索があり、関連部分だけをコンテキストへ戻します。

    ドキュメント：[メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    デフォルトプロバイダーである **OpenAI 埋め込み**を使用する場合にのみ必要です。Codex OAuth はチャット／補完には対応しますが、埋め込みへのアクセスは許可しません。そのため、Codex（OAuth または Codex CLI ログイン）でサインインしても、セマンティックメモリ検索は有効になりません。OpenAI 埋め込みには、引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    ローカルに留めるには、`agents.defaults.memorySearch.provider: "local"`（GGUF/llama.cpp）を設定します。その他の対応プロバイダー: Bedrock、DeepInfra、Gemini（`GEMINI_API_KEY` または `memorySearch.remote.apiKey`）、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 互換、Voyage。設定の詳細については、[メモリ](/ja-JP/concepts/memory)と[メモリ検索](/ja-JP/concepts/memory-search)を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使用するすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw 自体の状態はローカルにあります**が、**外部サービスには送信した内容が引き続き渡ります**。

    - **デフォルトではローカル**: セッション、メモリファイル、設定、ワークスペースは Gateway ホスト（`~/.openclaw` とワークスペースディレクトリ）にあります。
    - **必要上リモート**: モデルプロバイダー（Anthropic/OpenAI など）に送信されたメッセージはその API に渡り、チャットプラットフォーム（Slack/Telegram/WhatsApp など）はメッセージデータを各自のサーバーに保存します。
    - **保存範囲は制御可能**: ローカルモデルを使用すればプロンプトは自分のマシン内に留まりますが、チャネルのトラフィックは引き続きそのチャネルのサーバーを経由します。

    関連項目: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべてが `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）の下にあります。

    | パス                                                               | 用途                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | メイン設定（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | 従来の OAuth インポート（初回使用時に認証プロファイルへコピー）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef プロバイダー向けの任意のファイルベースシークレットペイロード   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | 従来の互換性ファイル（静的な `api_key` エントリは消去済み）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | プロバイダーの状態（例: `whatsapp/<accountId>/creds.json`）      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | エージェントごとの状態（agentDir と従来のセッション／アーカイブ成果物）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | セッション行とトランスクリプトを含む、エージェントごとの SQLite 状態      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 従来のセッション移行元とアーカイブ／サポート成果物      |

    従来の単一エージェント用パス `~/.openclaw/agent/*` は `openclaw doctor` によって移行されます。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別にあり、`agents.defaults.workspace`（デフォルト: `~/.openclaw/workspace`）で設定します。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。ルートにある小文字の `memory.md` は、従来形式の修復入力としてのみ使用されます。両方が存在する場合、`openclaw doctor --fix` でこれを `MEMORY.md` に統合できます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャネル／プロバイダーの状態、認証プロファイル、セッション、ログ、共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が起動のたびに同じワークスペースを使用していることを確認してください（リモートモードでは、ローカルのノート PC ではなく、**Gateway ホストの**ワークスペースが使用されます）。

    ヒント: 動作や設定を永続化するには、チャット履歴に頼るのではなく、ボットに **AGENTS.md または MEMORY.md へ書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)と[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="SOUL.md を大きくできますか？">
    はい。`SOUL.md` は、エージェントのコンテキストに注入されるワークスペースのブートストラップファイルの 1 つです。デフォルトのファイルごとの注入上限は `20000` 文字で、ファイル全体のブートストラップ予算は `60000` 文字です。

    共有デフォルトを変更します。

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

    または、`agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` で 1 つのエージェントを上書きします。

    `/context` を使用して、元のサイズと注入後のサイズ、および切り捨てが発生したかどうかを確認します。`SOUL.md` には口調、姿勢、人格のみを記載し、運用ルールは `AGENTS.md`、永続的な事実はメモリに記載してください。

    [コンテキスト](/ja-JP/concepts/context)と[エージェント設定](/ja-JP/gateway/config-agents)を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**非公開**の git リポジトリに置き、非公開の場所（たとえば GitHub のプライベートリポジトリ）へバックアップします。これにより、メモリと AGENTS/SOUL/USER ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` の下にあるもの（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。完全に復元するには、ワークスペースと状態ディレクトリを別々にバックアップします。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    [アンインストール](/ja-JP/install/uninstall)を参照してください。
  </Accordion>

  <Accordion title="エージェントはワークスペースの外部で作業できますか？">
    はい。ワークスペースは**デフォルトの cwd** およびメモリの基点であり、厳密なサンドボックスではありません。相対パスはワークスペース内で解決されます。サンドボックスが有効でない限り、絶対パスを使用してホスト上の他の場所へアクセスできます。分離するには、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使用します。リポジトリをデフォルトの作業ディレクトリにするには、そのエージェントの `workspace` をリポジトリのルートに設定します。OpenClaw リポジトリ自体は単なるソースコードなので、エージェントにその内部で意図的に作業させる場合を除き、ワークスペースとは分けてください。

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
    セッション状態は **Gateway ホスト**が所有します。リモートモードでは、対象となるセッションストアはローカルのノート PC ではなく、リモートマシン上にあります。[セッション管理](/ja-JP/concepts/session)を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** 設定を読み取ります。ファイルがない場合は、デフォルトのワークスペース `~/.openclaw/workspace` など、比較的安全なデフォルト値を使用します。
  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定した後、何もリッスンしない／UI に unauthorized と表示される'>
    loopback 以外へのバインドには、**有効な Gateway 認証経路が必要です**。共有シークレット認証（トークンまたはパスワード）、あるいは正しく構成された ID 対応リバースプロキシの背後での `gateway.auth.mode: "trusted-proxy"` を使用します。

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

    - `gateway.remote.token` / `.password` だけでは、ローカル Gateway 認証は有効になりません。ローカル呼び出し経路では、`gateway.auth.*` が未設定の場合に限り、`gateway.remote.*` をフォールバックとして使用できます。
    - パスワード認証では、`gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `.password` が SecretRef 経由で明示的に設定されているものの解決できない場合、解決処理はフェイルクローズになります（リモートフォールバックで隠蔽されません）。
    - 共有シークレットを使用する Control UI の構成では、`connect.params.auth.token` または `connect.params.auth.password`（アプリ／UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` などの ID を含むモードでは、代わりにリクエストヘッダーを使用します。共有シークレットを URL に含めないでください。
    - `gateway.auth.mode: "trusted-proxy"` を使用する場合、同一ホスト上の loopback リバースプロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` の明示的な設定と、`gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="localhost でトークンが必要になったのはなぜですか？">
    OpenClaw は、loopback を含めてデフォルトで Gateway 認証を適用します。明示的な認証経路が設定されていない場合、起動時にトークンモードへ解決され、その起動時のみ有効なトークンが生成されるため、ローカル WS クライアントも認証する必要があります。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    再起動後もクライアントが安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。パスワードモード、または ID 対応リバースプロキシ向けの `trusted-proxy` も選択できます。認証なしの loopback を使用するには、`gateway.auth.mode: "none"` を明示的に設定します。`openclaw doctor --generate-gateway-token` を使用すると、いつでもトークンを生成できます。

  </Accordion>

  <Accordion title="設定を変更した後、再起動する必要がありますか？">
    Gateway は設定を監視し、ホットリロードに対応しています。`gateway.reload.mode: "hybrid"`（デフォルト）は、安全な変更をホット適用し、重要な変更では再起動します。`hot`、`restart`、`off` にも対応しています。ほとんどの `tools.*`、`agents.*` ポリシー、`session.*`、`messages.*` の変更は、リロード操作なしですぐに適用されます。`gateway.*` のバインド／ポート変更には再起動が必要です。
  </Accordion>

  <Accordion title="CLI のおもしろいタグラインを無効にするにはどうすればよいですか？">
    `cli.banner.taglineMode` を設定します。

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグラインのテキストを非表示にしますが、バナーのタイトル／バージョン行は残します。
    - `default`: 常に `All your chats, one OpenClaw.` を使用します。
    - `random`: おもしろい／季節ごとのタグラインを順番に表示します（デフォルトの動作）。
    - バナー全体を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web 取得）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択したプロバイダーによって異なります。

    | プロバイダー | キー不要 | 環境変数 |
    | --- | --- | --- |
    | Brave | いいえ | `BRAVE_API_KEY` |
    | DuckDuckGo | はい（非公式の HTML ベース） | - |
    | Exa | いいえ | `EXA_API_KEY` |
    | Firecrawl | いいえ | `FIRECRAWL_API_KEY` |
    | Gemini | いいえ | `GEMINI_API_KEY` |
    | Grok | いいえ（xAI OAuth またはキー） | `XAI_API_KEY` |
    | Kimi | いいえ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |
    | MiniMax Search | いいえ | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` |
    | Ollama Web Search | はい（`ollama signin` が必要） | - |
    | Perplexity | いいえ | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` |
    | SearXNG | はい（セルフホスト） | `SEARXNG_BASE_URL` |
    | Tavily | いいえ | `TAVILY_API_KEY` |

    Grok は、モデル認証の xAI OAuth（`openclaw onboard --auth-choice xai-oauth`）を再利用することもできます。

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // 任意。自動検出する場合は省略
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    プロバイダー固有のウェブ検索設定は `plugins.entries.<plugin>.config.webSearch.*` にあります。従来の `tools.web.search.*` プロバイダーパスも互換性のため引き続き読み込まれますが、新しい設定では使用しないでください。Firecrawl のウェブ取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` にあります。

    - 許可リスト: `web_search`/`web_fetch`/`x_search` を追加するか、3 つすべてを対象にする場合は `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、使用可能な最初のフェッチフォールバックプロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で設定が消去されました。復旧し、再発を防ぐにはどうすればよいですか？">
    `config.apply` は**設定全体**を置き換えます。一部だけを含むオブジェクトを適用すると、それ以外はすべて削除されます。

    現在の OpenClaw では、偶発的な上書きの大半を防止します。

    - OpenClaw が管理する設定の書き込みでは、書き込む前に変更後の設定全体を検証します。
    - 無効または破壊的な、OpenClaw が管理する書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 起動またはホットリロードを壊す直接編集が行われた場合、Gateway は安全側に停止するか、リロードをスキップします。`openclaw.json` が書き換えられることはありません。
    - 修復は `openclaw doctor --fix` が担い、最後に正常だった設定を復元できます。また、拒否されたファイルは `openclaw.json.clobbered.*` として保存されます。

    復旧手順:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーのみを `openclaw config set` または `config.patch` でコピーして戻します。
    - 最後に正常だった設定や拒否されたペイロードがない場合: バックアップから復元するか、`openclaw doctor` を再実行してチャンネルとモデルを再設定します。
    - 予期しない消失が発生した場合: 最後に確認できた設定またはバックアップを添えてバグを報告してください。多くの場合、ローカルのコーディングエージェントはログや履歴から動作する設定を再構築できます。

    回避方法: 小さな変更には `openclaw config set`、対話形式の編集には `openclaw configure`、不明なパスの調査には `config.schema.lookup`（浅いスキーマノードと直下の子要素の概要を返します）、部分的な RPC 編集には `config.patch` を使用し、`config.apply` は設定全体の置き換えにのみ使用してください。エージェント向けの `gateway` ランタイムツールは、従来の `tools.bash.*` エイリアス経由であっても、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定ウィザード](/ja-JP/cli/configure)、[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="専用ワーカーを複数のデバイスに配置し、中央の Gateway で実行するにはどうすればよいですか？">
    一般的な構成は、**1 つの Gateway**（たとえば Raspberry Pi）と、**Node**および**エージェント**です。

    - **Gateway（中央）**: チャンネル（Signal/WhatsApp）、ルーティング、セッションを管理します。
    - **Node（デバイス）**: Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）**: 特殊な役割（たとえば運用データと個人データ）ごとに分離された頭脳とワークスペースです。
    - **サブエージェント**: 並列処理のために、メインエージェントからバックグラウンド作業を起動します。
    - **TUI**: Gateway に接続し、エージェントやセッションを切り替えます。

    ドキュメント: [Node](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザはヘッドレスで実行できますか？">
    はい、できます。

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

    デフォルトは `false`（GUI あり）です。ヘッドレスでは、一部のサイトでボット対策チェックが作動しやすくなります（X/Twitter はヘッドレスセッションを頻繁にブロックします）。同じ Chromium エンジンを使用し、ほとんどの自動化で動作します。主な違いは、ブラウザウィンドウが表示されないことです（画面を確認するにはスクリーンショットを使用してください）。[ブラウザ](/ja-JP/tools/browser)を参照してください。

  </Accordion>

  <Accordion title="ブラウザ制御に Brave を使用するにはどうすればよいですか？">
    `browser.executablePath` を Brave のバイナリ（または任意の Chromium ベースのブラウザ）に設定し、Gateway を再起動します。[ブラウザ](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser)を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と Node

<AccordionGroup>
  <Accordion title="Telegram、Gateway、Node の間でコマンドはどのように伝播しますか？">
    Telegram のメッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、その後、Node ツールが必要な場合にのみ **Gateway WebSocket** 経由で Node を呼び出します。

    Telegram -> Gateway -> エージェント -> `node.*` -> Node -> Gateway -> Telegram

    Node は受信したプロバイダートラフィックを認識せず、Node RPC 呼び出しのみを受信します。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントから自分のコンピューターにアクセスするにはどうすればよいですか？">
    コンピューターを **Node** としてペアリングします。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    1. 常時稼働するホスト（VPS／ホームサーバー）で Gateway を実行します。
    2. Gateway ホストとコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達可能であることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または tailnet への直接接続）で接続して、Node として登録します。
    5. Node を承認します。
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別途 TCP ブリッジは必要ありません。Node は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意：macOS Node をペアリングすると、そのマシンで `system.run` が許可されます。信頼できるデバイスのみをペアリングし、[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント：[Node](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが、返信がありません。どうすればよいですか？">
    まず基本事項を確認します。

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    次に、認証とルーティングを確認します。Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。SSH トンネル経由で接続している場合は、トンネルが稼働しており、正しいポートを指していることを確認してください。また、DM／グループの許可リストに自分のアカウントが含まれていることも確認してください。

    ドキュメント：[Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士（ローカル + VPS）で通信できますか？">
    はい。ただし、組み込みのボット間ブリッジはありません。

    **最も簡単な方法**：両方のボットがアクセスできる通常のチャットチャンネル（Slack／Telegram／WhatsApp）を使用します。ボット A からボット B にメッセージを送り、ボット B は通常どおり返信します。

    **CLI ブリッジ（汎用）**：`openclaw agent --message ... --deliver` で相手の Gateway を呼び出すスクリプトを実行し、相手のボットが待ち受けているチャットを指定します。一方のボットがリモート VPS 上にある場合は、SSH／Tailscale 経由で CLI をそのリモート Gateway に接続します（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    ```bash
    openclaw agent --message "ローカルボットからこんにちは" --deliver --channel telegram --reply-to <chat-id>
    ```

    2 つのボットが無限ループしないように、ガードレールを追加してください（メンションされた場合のみ応答する、チャンネルの許可リストを使用する、または「ボットのメッセージには返信しない」ルールを設けるなど）。

    ドキュメント：[リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントには個別の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、各エージェントは独自のワークスペース、モデルのデフォルト設定、ルーティングを持ちます。これが通常の構成であり、エージェントごとに VPS を用意するよりもはるかに安価でシンプルです。個別の VPS は、厳密な分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合にのみ使用してください。
  </Accordion>

  <Accordion title="VPS から SSH 接続する代わりに、自分のノート PC で Node を使用する利点はありますか？">
    はい。Node は、リモート Gateway からノート PC にアクセスするための第一級の方法であり、シェルアクセス以上の機能を利用できます。Gateway は macOS／Linux（Windows では WSL2 経由）で動作し、軽量です（小規模な VPS や Raspberry Pi クラスのマシンで十分です。RAM は 4 GB あれば余裕があります）。そのため、常時稼働するホストと、Node として使用するノート PC を組み合わせる構成が一般的です。

    - **受信用 SSH は不要** - Node はデバイスペアリングを介して Gateway WebSocket に外向き接続します。
    - **より安全な実行制御** - `system.run` は、そのノート PC 上の Node の許可リスト／承認によって制限されます。
    - **より多くのデバイスツール** - Node は `system.run` に加えて、`canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザの自動化** - Gateway を VPS 上で稼働させたまま、Node ホストを通じて Chrome をローカルで実行したり、Chrome MCP を介してローカルの Chrome に接続したりできます。

    一時的なシェルアクセスには SSH でも問題ありませんが、継続的なエージェントワークフローやデバイス自動化には Node の方がシンプルです。

    ドキュメント：[Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[ブラウザ](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Node は Gateway サービスを実行しますか？">
    いいえ。意図的に分離されたプロファイルを実行する場合を除き、ホストごとに実行する **Gateway は 1 つだけ** にしてください（[複数の Gateway](/ja-JP/gateway/multiple-gateways)を参照）。Node は Gateway に接続する周辺機器です（iOS／Android の Node、またはメニューバーアプリの macOS「Node モード」）。ヘッドレス Node ホストと CLI による制御については、[Node ホスト CLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、およびホストされる Plugin サーフェスを変更した場合は、完全な再起動が必要です。

  </Accordion>

  <Accordion title="API／RPC で設定を適用する方法はありますか？">
    はい。

    - `config.schema.lookup`：書き込み前に、浅いスキーマノード、一致する UI ヒント、および直下の子要素の概要とともに、1 つの設定サブツリーを調べます。
    - `config.get`：現在のスナップショットとハッシュを取得します。
    - `config.patch`：安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します。
    - `config.apply`：設定全体を検証して置き換えます。可能な場合はホットリロードし、必要な場合は再起動します。
    - エージェント向けの `gateway` ランタイムツールは、引き続き `tools.exec.ask`／`tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスも、同じ保護対象パスに正規化されます。

  </Accordion>

  <Accordion title="初回インストール向けの最小限かつ妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ワークスペースを設定し、ボットを起動できるユーザーを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定し、Mac から接続するにはどうすればよいですか？">
    1. **VPS にインストールしてログイン**：
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Mac にインストールしてログイン**：同じ tailnet で Tailscale アプリを使用します。
    3. **MagicDNS を有効化**：Tailscale 管理コンソールで有効にし、VPS に安定した名前を割り当てます。
    4. **tailnet ホスト名を使用**：SSH は `ssh user@your-vps.tailnet-xxxx.ts.net`、Gateway WS は `ws://your-vps.tailnet-xxxx.ts.net:18789` を使用します。

    SSH を使用せずに Control UI にアクセスするには、VPS で Tailscale Serve を使用します。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより、Gateway は local loopback にバインドされたまま、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

  </Accordion>

  <Accordion title="Mac の Node をリモート Gateway に接続するにはどうすればよいですか（Tailscale Serve）？">
    Serve は **Gateway Control UI + WS** を公開します。Node は同じ Gateway WS エンドポイント経由で接続します。

    1. VPS と Mac が同じ tailnet 上にあることを確認します。
    2. macOS アプリをリモートモードで使用します（SSH ターゲットには tailnet のホスト名を指定できます）。これにより Gateway ポートがトンネリングされ、Node として接続されます。
    3. Node を承認します。
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント：[Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか、それとも Node を追加するだけでよいですか？">
    2 台目のノート PC で **ローカルツールのみ**（画面、カメラ、コマンド実行）を使用する場合は、**Node** として追加してください。Gateway は 1 つのままで、設定も重複しません。現在、ローカル Node ツールは macOS のみをサポートしています。2 つ目の Gateway をインストールするのは、**完全な分離**が必要な場合、または完全に独立した 2 つのボットを運用する場合だけにしてください。

    ドキュメント：[Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（シェル、launchd/systemd、CI など）から環境変数を読み込み、さらに以下も読み込みます。

    - 現在の作業ディレクトリにある `.env`。
    - `~/.openclaw/.env`（`$OPENCLAW_STATE_DIR/.env`）にあるグローバルフォールバック `.env`。

    どちらの `.env` ファイルも、既存の環境変数を上書きしません。プロバイダーの認証情報キーは、ワークスペースの `.env` に関しては例外です。`GEMINI_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY` などのキー（およびその他の同梱プロバイダー認証用環境変数）はワークスペースの `.env` では無視されるため、プロセス環境、`~/.openclaw/.env`、または設定の `env` に置く必要があります。

    設定内のインライン環境変数は、プロセス環境に存在しない場合にのみ適用されます。

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    優先順位と読み込み元の詳細については、[/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    2 つの解決策があります。

    1. 不足しているキーを `~/.openclaw/.env` に置きます。これにより、サービスがシェル環境を継承しない場合でも読み込まれます。
    2. シェルインポートを有効にします（オプトインの便利機能）。
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
       これによりログインシェルが実行され、不足している想定キーのみがインポートされます（上書きはされません）。対応する環境変数は `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` です。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、モデルのステータスに "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は、**シェル環境のインポート**が有効かどうかを報告します。"Shell env: off" は環境変数が不足していることを意味するのではなく、OpenClaw がログインシェルを自動的に読み込まないことだけを意味します。

    Gateway がサービス（launchd/systemd）として実行されている場合、シェル環境は継承されません。トークンを `~/.openclaw/.env` に置くか、`env.shellEnv.enabled: true` を有効にするか、設定の `env` に追加して（存在しない場合にのみ適用されます）、Gateway を再起動してから再確認します。

    ```bash
    openclaw models status
    ```

    Copilot トークンは、`OPENCLAW_GITHUB_TOKEN`、`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` の順に解決されます。

    [/concepts/model-providers](/ja-JP/concepts/model-providers) および [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    `/new` または `/reset` を単独のメッセージとして送信します。[セッション管理](/ja-JP/concepts/session)を参照してください。
  </Accordion>

  <Accordion title="/new を送信しなくてもセッションは自動的にリセットされますか？">
    はい。デフォルトのリセットポリシーは **毎日** です。現在のセッションが開始された時刻を基準として、Gateway ホスト上で設定されたローカル時刻（`session.reset.atHour`、デフォルトは `4`、範囲は 0～23）にセッションが切り替わります。代わりにアイドル時間ベースのリセットを使用するには、`mode: "idle"` と `session.reset.idleMinutes` を設定します。これにより、一定期間操作がないとセッションが期限切れになります（Heartbeat、Cron、コマンド実行のシステムイベントではなく、最後の実際の操作を基準とします）。

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

    `resetByType` は `direct`（従来のエイリアスは `dm`）、`group`、`thread` をサポートします。従来のトップレベル設定 `session.idleMinutes` も、`session.reset` または `resetByType` ブロックが設定されていない場合、アイドルモードのデフォルトに対する互換エイリアスとして引き続き機能します。プロバイダーが所有するアクティブな CLI セッションを持つセッションは、暗黙の毎日リセットでは終了されません。ライフサイクル全体については、[セッション管理](/ja-JP/concepts/session)を参照してください。

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を作成できますか？">
    はい。**マルチエージェントルーティング**と**サブエージェント**を使用できます。1 つのコーディネーターエージェントと、それぞれ独自のワークスペースおよびモデルを持つ複数のワーカーエージェントで構成します。

    これは楽しい実験として捉えるのが最適です。多くのトークンを消費し、セッションを分けた 1 つのボットより効率が悪いことも少なくありません。一般的なモデルでは、会話するボットは 1 つで、並行作業には別々のセッションを使用し、必要に応じてサブエージェントを生成します。

    ドキュメント：[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    セッションのコンテキストはモデルのウィンドウによって制限されます。長いチャット、大量のツール出力、または多数のファイルによって Compaction や切り詰めが発生することがあります。

    - ボットに現在の状態を要約し、ファイルへ書き込むよう依頼します。
    - 長いタスクの前には `/compact` を使用し、トピックを切り替えるときは `/new` を使用します。
    - 重要なコンテキストをワークスペースに保存し、ボットに再度読み込むよう依頼します。
    - 長時間または並行する作業にはサブエージェントを使用し、メインチャットを小さく保ちます。
    - この問題が頻繁に発生する場合は、コンテキストウィンドウがより大きいモデルを選択します。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    ```bash
    openclaw reset
    ```

    非対話型の完全リセット：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します。

    ```bash
    openclaw onboard --install-daemon
    ```

    既存の設定が検出された場合、オンボーディングでも **リセット**を選択できます。[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用していた場合は、各状態ディレクトリ（デフォルトは `~/.openclaw-<profile>`）をリセットしてください。開発専用のリセットでは、`openclaw gateway --dev --reset` によって開発用の設定、認証情報、セッション、ワークスペースが消去されます。

  </Accordion>

  <Accordion title='"context too large" エラーが発生しています。リセットまたは Compaction するにはどうすればよいですか？'>
    - **Compaction**（会話を維持し、古いターンを要約）：`/compact`、または要約方法を指定する場合は `/compact <instructions>`。
    - **リセット**（同じチャットキーに対して新しいセッション ID を作成）：`/new` または `/reset`。

    引き続き発生する場合は、**セッションプルーニング**（`agents.defaults.contextPruning`）を調整して古いツール出力を削減するか、より大きなコンテキストウィンドウを持つモデルを使用してください。

    ドキュメント：[Compaction](/ja-JP/concepts/compaction)、[セッションプルーニング](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    プロバイダーの検証エラーです。モデルが必須の `input` を含まない `tool_use` ブロックを出力しました。通常、セッション履歴が古いか破損していることを意味します（長いスレッドの後や、ツールまたはスキーマの変更後によく発生します）。

    解決策：`/new` を単独のメッセージとして送信し、新しいセッションを開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます。解決された認証モードが Anthropic OAuth/トークン認証（Claude CLI の再利用を含む）で、`heartbeat.every` が未設定の場合は **1h** ごとです。間隔を調整するか無効にするには、次のように設定します。

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 無効にする場合は "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在していても実質的に空の場合（空行、Markdown/HTML コメント、ATX 見出し、フェンスマーカー、または空のリスト項目スタブのみ）、OpenClaw は API 呼び出しを節約するため Heartbeat の実行をスキップします。ファイルが存在しない場合でも Heartbeat は実行され、モデルが実行内容を判断します。

    エージェントごとのオーバーライドには `agents.list[].heartbeat` を使用します。ドキュメント：[Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClaw は**自分自身のアカウント**で動作します。自分がグループに参加していれば、OpenClaw からもそのグループを確認できます。デフォルトでは、送信者を許可するまでグループへの返信はブロックされます（`groupPolicy: "allowlist"`）。

    グループへの返信を自分だけに制限するには、次のように設定します。

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
    最も速い方法は、ログを追跡しながらグループ内でテストメッセージを送信することです。

    ```bash
    openclaw logs --follow --json
    ```

    `1234567890-1234567890@g.us` のように、`@g.us` で終わる `chatId`（または `from`）を探します。

    すでに設定済み、または許可リストに登録済みの場合は、設定からグループを一覧表示できます。

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント：[WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    一般的な原因は 2 つあります。メンションゲートがデフォルトで有効になっている（ボットを @メンションするか、`mentionPatterns` に一致させる必要があります）、または `"*"` を含めずに `channels.whatsapp.groups` を設定していて、そのグループが許可リストに登録されていないことです。

    [グループ](/ja-JP/channels/groups)および[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

  </Accordion>

  <Accordion title="グループやスレッドは DM とコンテキストを共有しますか？">
    デフォルトでは、ダイレクトチャットはメインセッションに統合されます。グループやチャンネルは独自のセッションキーを持ち、Telegram のトピックや Discord のスレッドは別のセッションになります。[グループ](/ja-JP/channels/groups)および[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な上限はありません。数十、さらには数百でも問題ありませんが、次の点に注意してください。

    - **ディスク使用量の増加**：アクティブなセッションとトランスクリプトはエージェントごとの SQLite データベースに保存されます。従来のアーティファクトやアーカイブアーティファクトは、引き続き `~/.openclaw/agents/<agentId>/sessions/` 以下に蓄積されることがあります。
    - **トークンコスト**：エージェントが増えるほど、モデルの同時使用量が増えます。
    - **運用負荷**：エージェントごとの認証プロファイル、ワークスペース、チャンネルルーティングが必要になります。

    エージェントごとに **アクティブな** ワークスペースを 1 つ（`agents.defaults.workspace`）に保ち、ディスク使用量が増えた場合は `openclaw sessions cleanup` で古いセッションを整理してください（アクティブな SQLite の状態を手動で編集しないでください）。また、`openclaw doctor` を使用して不要なワークスペースやプロファイルの不一致を検出してください。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）？また、どのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使用すると、分離された複数のエージェントを実行し、チャンネル、アカウント、ピアに基づいて受信メッセージをルーティングできます。Slack はチャンネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間にできることは何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって自動化が妨げられることがあります。最も信頼性の高い制御には、ホスト上のローカル Chrome MCP、または実際にブラウザーを実行しているマシン上の CDP を使用してください。

    ベストプラクティスの構成: 常時稼働する Gateway ホスト（VPS/Mac mini）、役割ごとに 1 つのエージェント（バインディング）、それらのエージェントにバインドされた Slack チャンネル、必要に応じて Chrome MCP または Node 経由のローカルブラウザ。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、[ブラウザ](/ja-JP/tools/browser)、[Node](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイルに関するモデルの Q&A は、[モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、フックなど）に使用する単一の多重化ポートを制御します。優先順位:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > デフォルト 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status で「Runtime: running」と表示されるのに「Connectivity probe: failed」となるのはなぜですか？'>
    「Running」は**スーパーバイザー**（launchd/systemd/schtasks）から見た状態です。接続プローブでは、CLI が実際に Gateway の WebSocket へ接続します。`openclaw gateway status` の次の行を確認してください: `Probe target:`（プローブが使用した URL）、`Listening:`（実際にポートへバインドされているもの）、`Last gateway error:`（プロセスは稼働しているのにポートがリッスンしていない場合によくある根本原因）。
  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が異なるのはなぜですか？'>
    編集している設定ファイルと、サービスが使用している設定ファイルが異なります（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正するには、サービスで使用したいものと同じ `--profile` / 環境から次を実行します:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は起動直後に WebSocket リスナー（デフォルトでは `ws://127.0.0.1:18789`）をバインドすることで、ランタイムロックを適用します。バインドが `EADDRINUSE` で失敗すると、`GatewayLockError`（「another gateway instance is already listening」）をスローします。

    修正方法: もう一方のインスタンスを停止するか、ポートを解放するか、`openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所にある Gateway へ接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定してリモート WebSocket URL を指定し、必要に応じて共有シークレットのリモート認証情報を設定します:

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

    - `openclaw gateway` は、`gateway.mode` が `local` の場合（または上書きフラグを渡した場合）にのみ起動します。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されると実行中にモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報にすぎません。それら自体でローカル Gateway の認証が有効になることはありません。

  </Accordion>

  <Accordion title='Control UI に「unauthorized」と表示される（または再接続を繰り返す）場合はどうすればよいですか？'>
    Gateway の認証経路と UI の認証方式が一致していません。

    事実（コードに基づく）:

    - Control UI は、現在のブラウザタブと選択中の Gateway URL にスコープされた `sessionStorage` にトークンを保持します。そのため、同じタブでの再読み込みは、長期間の localStorage トークン永続化なしで引き続き機能します。
    - `AUTH_TOKEN_MISMATCH` の場合、Gateway が再試行のヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返すと、信頼されたクライアントはキャッシュ済みデバイストークンを使用して、制限された 1 回の再試行を行えます。
    - このキャッシュ済みトークンによる再試行では、デバイストークンとともに保存された承認済みスコープが再利用されます。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを維持します。
    - その再試行経路以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - 組み込みのセットアップコードによるブートストラップは、`scopes: []` の Node デバイストークンと、信頼されたモバイルオンボーディング用の期限付きオペレーターハンドオフトークンを返します。オペレーターハンドオフはセットアップ時のネイティブ設定を読み取れますが、ペアリング変更スコープや `operator.admin` は付与しません。

    修正方法:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開くことを試みます。ヘッドレスの場合は SSH のヒントを表示します）。
    - トークンがまだない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合: まず `ssh -N -L 18789:127.0.0.1:18789 user@host` でトンネルを確立し、その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI の設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale の ID ヘッダーを迂回する未加工のループバック/tailnet URL ではなく、Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 設定済みの ID 対応プロキシを経由していることを確認します。同一ホストのループバックプロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` も必要です。
    - 1 回の再試行後も不一致が続く場合: ペアリング済みデバイストークンをローテーション/再承認します:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - ローテーションが拒否される場合: ペアリング済みデバイスのセッションは、`operator.admin` も持っていない限り、**自身の**デバイスのみローテーションできます。また、明示的な `--scope` 値は、呼び出し元が現在持つオペレータースコープを超えることはできません。
    - それでも解決しない場合: `openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。認証の詳細については[ダッシュボード](/ja-JP/web/dashboard)を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、loopback のみでリッスンします">
    `tailnet` バインドは、ネットワークインターフェースから Tailscale IP（100.64.0.0/10）を選択します。マシンが Tailscale に接続されていない場合（またはインターフェースが停止している場合）、Gateway は別のネットワークインターフェースを公開せず、loopback にフォールバックします。

    修正方法: そのホストで Tailscale を起動して Gateway を再起動するか、明示的に `gateway.bind: "loopback"` / `"lan"` へ切り替えます。

    `tailnet` は明示的な設定です。`auto` は loopback を優先します。必要な同一ホストの `127.0.0.1` リスナーを維持しながら、非 loopback への公開を Tailnet に限定するには、`gateway.bind: "tailnet"` を使用します。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長性（たとえばレスキューボット）または厳密な分離が必要な場合にのみ使用し、それぞれを固有の `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace`、`gateway.port` で分離してください。

    推奨: インスタンスごとに `openclaw --profile <name> ...`（`~/.openclaw-<name>` を自動作成）、プロファイル設定ごとに固有の `gateway.port`（手動実行では `--port`）、および `openclaw --profile <name> gateway install` によるプロファイル別サービスを使用します。

    プロファイルはサービス名にもサフィックスを付けます: launchd は `ai.openclaw.<profile>`、systemd は `openclaw-gateway-<profile>.service`、Windows は `OpenClaw Gateway (<profile>)`。修飾されていない `openclaw-gateway` systemd ユニットはデフォルトプロファイルにのみ存在します。名称変更前の従来の systemd ユニット名 `clawdbot-gateway` は自動的に移行されます。

    完全なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして `connect` フレームを期待します。それ以外の場合、接続は**コード 1008**（ポリシー違反）で閉じられます。

    一般的な原因: WS クライアントではなくブラウザで **HTTP** URL を開いた、誤ったポート/パスを使用した、またはプロキシ/トンネルが認証ヘッダーを削除したか Gateway 以外のリクエストを送信した。

    修正方法: WS URL（`ws://<host>:18789`、または HTTPS 経由では `wss://...`）を使用し、通常のブラウザタブで WS ポートを開かず、認証が有効な場合は `connect` フレームにトークン/パスワードを含めます。CLI/TUI の例:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログ記録とデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。安定したパスは `logging.file`、ファイルログレベルは `logging.level`、コンソールの詳細度は `--verbose` と `logging.consoleLevel` で設定します。

    最速で追跡するには:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーのログ（Gateway が launchd/systemd 経由で実行されている場合）:

    - macOS launchd の stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用し、stderr は抑制されます）。
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    詳細は[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway)を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するにはどうすればよいですか？">
    Windows には 3 つのインストールモードがあります:

    **1) Windows Hub のローカルセットアップ**: ネイティブアプリが、アプリ所有のローカル WSL Gateway を管理します。スタートメニューまたはトレイから **OpenClaw Companion** を開き、**Gateway Setup** または Connections タブを使用します。

    **2) 手動 WSL2 Gateway**: Gateway は Linux 内で実行されます。
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    サービスをインストールしていない場合は、フォアグラウンドで起動します: `openclaw gateway run`。

    **3) ネイティブ Windows CLI/Gateway**: Windows 上で直接実行されます。
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    手動で実行する場合（サービスなし）: `openclaw gateway run`。

    ドキュメント: [Windows](/ja-JP/platforms/windows)、[Gateway サービス運用ガイド](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信が届きません。何を確認すればよいですか？">
    簡易ヘルスチェック:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因: **Gateway ホスト**にモデル認証が読み込まれていない（`models status` を確認）、チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定とログを確認）、または適切なトークンなしで WebChat/ダッシュボードを開いている。リモートの場合は、トンネル/Tailscale 接続が有効で、Gateway WebSocket に到達できることを確認します。

    ドキュメント: [チャンネル](/ja-JP/channels)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)、[リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」と表示される場合はどうすればよいですか？'>
    通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください: Gateway は実行中ですか（`openclaw gateway status`）？正常ですか（`openclaw status`）？UI に正しいトークンがありますか（`openclaw dashboard`）？リモートの場合、トンネル/Tailscale リンクは有効ですか？

    その後、ログを追跡します:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [ダッシュボード](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram の setMyCommands が失敗します。何を確認すればよいですか？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次に、エラーと照合します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目数が多すぎます。OpenClaw はすでに Telegram の上限に合わせて項目を削減し、コマンド数を減らして再試行しますが、一部のメニュー項目は引き続き削除される場合があります。プラグイン、Skill、カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上またはプロキシの背後で実行している場合は、外向き HTTPS が許可され、`api.telegram.org` の DNS 解決が機能することを確認してください。

    Gateway がリモートにある場合は、Gateway ホスト上のログを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すればよいですか？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使用して現在の状態を確認します。チャットチャンネルでの返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールした場合（macOS では launchd、Linux では systemd）:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    フォアグラウンドでは Ctrl-C で停止してから、`openclaw gateway run` を実行します。

    ドキュメント: [Gateway サービス運用手順書](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="初心者向け: openclaw gateway restart と openclaw gateway の違い">
    `openclaw gateway restart` は**バックグラウンドサービス**（launchd/systemd）を再起動します。`openclaw gateway` は、このターミナルセッションで Gateway を**フォアグラウンド**実行します。サービスをインストールした場合は Gateway のサブコマンドを使用し、一度限りの実行にはサブコマンドなしのフォアグラウンド実行を使用してください。
  </Accordion>

  <Accordion title="問題発生時に詳細情報を得る最速の方法">
    コンソールに詳細情報を表示するには、`--verbose` を付けて Gateway を起動し、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="Skill が画像や PDF を生成しましたが、何も送信されませんでした">
    エージェントから送信する添付ファイルでは、`media`、`mediaUrl`、`path`、`filePath` などの構造化メディアフィールドを使用する必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)と[エージェント送信](/ja-JP/tools/agent-send)を参照してください。

    ```bash
    openclaw message send --target +15555550123 --message "こちらです" --media /path/to/file.png
    ```

    次の点も確認してください。対象チャンネルが外向きメディアをサポートしており、許可リストによってブロックされていないこと。ファイルがプロバイダーのサイズ制限内であること（画像は最大辺が 2048px になるようにリサイズされます）。`tools.fs.workspaceOnly=true` は、ローカルパスからの送信をワークスペース、一時ファイル/メディアストア、サンドボックスで検証済みのファイルに制限します。`tools.fs.workspaceOnly=false`（デフォルト）では、構造化されたローカルメディア送信で、エージェントがすでに読み取れるホストローカルファイルを、メディアおよび安全な文書形式（画像、音声、動画、PDF、Office 文書、Markdown/MD、TXT、JSON、YAML/YML などの検証済みテキスト文書）について使用できます。これはシークレットスキャナーではありません。エージェントが読み取り可能な `secret.txt` や `config.json` は、拡張子と内容の検証に合格すれば添付できます。機密ファイルはエージェントが読み取れるパスの外に置くか、ローカルパスからの送信をより厳格に制限するために `tools.fs.workspaceOnly=true` を維持してください。

    [画像](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルト設定によりリスクが軽減されます。

    - DM 対応チャンネルのデフォルト動作は**ペアリング**です。不明な送信者にはペアリングコードが送られ、そのメッセージは処理されません。`openclaw pairing approve --channel <channel> [--account <id>] <code>` で承認します。保留中のリクエストは**チャンネルあたり 3 件**に制限されます。コードが届かなかった場合は、`openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を一般公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    `openclaw doctor` を実行して、リスクのある DM ポリシーを検出してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか？">
    いいえ。プロンプトインジェクションは、ボットに DM を送信できる人物だけでなく、**信頼できないコンテンツ**に関する問題です。アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、文書、添付ファイル、貼り付けられたログ）を読み取る場合、そのコンテンツにはモデルを乗っ取ろうとする指示が含まれている可能性があります。送信者が自分だけの場合でも同様です。

    ツールが有効な場合に最も大きなリスクが生じます。モデルがだまされ、コンテキストを流出させたり、ユーザーに代わってツールを呼び出したりする可能性があります。影響範囲を縮小するには:

    - 読み取り専用またはツール無効の「リーダー」エージェントを使用して、信頼できないコンテンツを要約する
    - ツールが有効なエージェントでは `web_search` / `web_fetch` / `browser` を無効にする
    - デコードされたファイルや文書のテキストも信頼できないものとして扱う。OpenResponses の `input_file` とメディア添付ファイルの抽出では、ファイルの生テキストをそのまま渡すのではなく、抽出したテキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックスを使用し、厳格なツール許可リストを適用する

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw は Rust/WASM ではなく TypeScript/Node を使用しているため、安全性が低いのですか？">
    言語とランタイムは重要ですが、個人用エージェントにおける主要なリスクではありません。実際のリスクは、Gateway の公開範囲、ボットにメッセージを送信できる人物、プロンプトインジェクション、ツールのスコープ、認証情報の取り扱い、ブラウザアクセス、exec アクセス、サードパーティ製 Skill/プラグインへの信頼です。

    Rust と WASM は一部のコード分類に対してより強力な分離を提供できますが、プロンプトインジェクション、不適切な許可リスト、Gateway の一般公開、過度に広範なツール、機密アカウントにログイン済みのブラウザプロファイルを解決するものではありません。主要な制御策として、Gateway を非公開または認証必須にし、DM/グループにはペアリングと許可リストを使用し、信頼できない入力に対してリスクの高いツールを拒否またはサンドボックス化し、信頼できるプラグインと Skill のみをインストールし、設定変更後に `openclaw security audit --deep` を実行してください。

    詳細: [セキュリティ](/ja-JP/gateway/security)、[サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="公開された OpenClaw インスタンスに関する報告を見ました。何を確認すればよいですか？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    より安全な基準は次のとおりです。Gateway を `loopback` にバインドするか、認証済みのプライベートアクセス（tailnet、SSH トンネル、トークン/パスワード認証、または正しく設定された信頼済みプロキシ）経由でのみ公開する。DM を `pairing` または `allowlist` モードにする。全メンバーが信頼できる場合を除き、グループを許可リストに登録し、メンションを必須にする。信頼できないコンテンツを読み取るエージェントでは、高リスクのツール（`exec`、`browser`、`gateway`、`cron`）を拒否するか、厳密にスコープを限定する。ツール実行の影響範囲を小さくする必要がある場合は、サンドボックス化を有効にする。

    認証なしの公開バインド、ツールが有効な状態で公開された DM/グループ、公開されたブラウザ制御を最優先で修正してください。詳細: [openclaw security audit](/ja-JP/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="ClawHub の Skill やサードパーティ製プラグインをインストールしても安全ですか？">
    サードパーティ製の Skill とプラグインは、信頼することを自ら選択したコードとして扱ってください。ClawHub の Skill ページではインストール前にスキャン状態が表示されますが、スキャンは完全なセキュリティ境界ではありません。OpenClaw はプラグイン/Skill のインストールまたは更新時に、組み込みのローカル危険コードブロックを実行しません。ローカルでの許可/ブロック判断には、運用者が管理する `security.installPolicy` を使用してください。

    より安全な方法は、信頼できる作者と固定バージョンを優先し、Skill/プラグインを有効化する前に内容を確認し、プラグイン/Skill の許可リストを限定し、信頼できない入力を扱うワークフローを最小限のツールを備えたサンドボックスで実行し、サードパーティ製コードに広範なファイルシステム、exec、ブラウザ、シークレットへのアクセスを与えないことです。

    詳細: [Skills](/ja-JP/tools/skills)、[プラグイン](/ja-JP/tools/plugin)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボット専用のメール、GitHub アカウント、電話番号を用意すべきですか？">
    はい、ほとんどの構成で推奨されます。ボットを別のアカウントや電話番号に分離すると、問題が発生した場合の影響範囲が縮小され、個人アカウントに影響を与えずに認証情報のローテーションやアクセスの取り消しを行いやすくなります。

    まずは小さく始めてください。実際に必要なツールとアカウントにのみアクセスを許可し、必要に応じて後から拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージを自律的に処理させても安全ですか？">
    個人メッセージに対する完全な自律動作は**推奨しません**。最も安全な方法は、DM を**ペアリングモード**または厳格な許可リストで保護し、ユーザーに代わってメッセージを送信する場合は**別の電話番号またはアカウント**を使用し、送信前にユーザーが**承認**できるよう下書きのみを作成させることです。

    試す場合は、専用の分離されたアカウントで行ってください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使用できますか？">
    はい、エージェントがチャット専用で、入力が信頼できる場合に**限り**使用できます。小規模なモデル階層は指示の乗っ取りを受けやすいため、ツールが有効なエージェントや信頼できないコンテンツを読み取る場合には使用を避けてください。小規模なモデルを使用する必要がある場合は、ツールを厳しく制限し、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを取得できませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、`dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスするには、送信者 ID を許可リストに登録するか、そのアカウントの `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送信しますか？ペアリングはどのように機能しますか？">
    いいえ。WhatsApp のデフォルト DM ポリシーは**ペアリング**です。不明な送信者にはペアリングコードだけが送られ、そのメッセージは**処理されません**。OpenClaw は受信したチャット、またはユーザーが明示的に実行した送信にのみ返信します。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプトでは、自分からの DM を許可するための**許可リスト/所有者**を設定します。これは自動送信には使用されません。個人の WhatsApp 番号では、その番号を使用して `channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「停止しない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージやツールメッセージは、そのセッションで**詳細表示**、**トレース**、または**推論**が有効な場合にのみ表示されます。

    表示されているチャットで修正します:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    それでも表示が多い場合は、Control UI のセッション設定を確認し、詳細表示を**継承**に設定してください。また、設定内で `verboseDefault: "on"` が指定されたボットプロファイルを使用していないことを確認してください。

    ドキュメント: [思考と詳細表示](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止またはキャンセルするにはどうすればよいですか？">
    中止をトリガーするには、次のいずれかを**単独のメッセージ**（スラッシュなし）として送信します: `stop`、`stop action`、`stop current action`、`stop run`、`stop current run`、`stop agent`、`stop the agent`、`stop openclaw`、`openclaw stop`、`stop don't do anything`、`stop do not do anything`、`stop doing anything`、`do not do that`、`please stop`、`stop please`、`abort`、`esc`、`exit`、`interrupt`、`halt`。英語以外の一般的なトリガー（フランス語、ドイツ語、スペイン語、中国語、日本語、ヒンディー語、アラビア語、ロシア語）も機能します。

    exec ツールによって開始されたバックグラウンドプロセスについては、エージェントに次を実行するよう依頼してください:

    ```text
    process action:kill sessionId:XXX
    ```

    ほとんどのスラッシュコマンドは、`/` で始まる**単独の**メッセージとして送信する必要がありますが、一部のショートカット（`/status` など）は、許可リストに登録された送信者であれば文中でも機能します。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title='Telegram から Discord にメッセージを送信するにはどうすればよいですか？（「Cross-context messaging denied」）'>
    OpenClaw はデフォルトで**プロバイダーをまたぐ**メッセージングをブロックします。ツール呼び出しが Telegram に紐付けられている場合、明示的に許可しない限り Discord には送信されません。設定は即時に反映され、Gateway の再起動は不要です。

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

  <Accordion title='ボットが立て続けのメッセージを「無視」しているように感じるのはなぜですか？'>
    実行中に届いたプロンプトは、デフォルトでアクティブな実行に反映されます。`/queue` を使用して、アクティブな実行での動作を選択します。

    - `steer`（デフォルト）- 次のモデル境界でアクティブな実行に指示を反映します。
    - `followup` - メッセージをキューに入れ、現在の実行終了後に一度に 1 件ずつ実行します。
    - `collect` - 互換性のあるメッセージをキューに入れ、現在の実行終了後に 1 回だけ応答します。
    - `interrupt` - 現在の実行を中止し、新たに開始します。

    キューモードには、`debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)と[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使用する場合、Anthropic のデフォルトモデルは何ですか？'>
    認証情報とモデルの選択は別々です。`ANTHROPIC_API_KEY` を設定する（または認証プロファイルに Anthropic API キーを保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（例：`anthropic/claude-sonnet-4-6` または `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` は、実行中のエージェントに対応する `auth-profiles.json` 内の所定の場所で、Gateway が Anthropic の認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しない場合は、[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions)を開始してください。

## 関連項目

- [初回実行 FAQ](/ja-JP/help/faq-first-run) - インストール、オンボーディング、認証、サブスクリプション、初期段階の障害
- [モデル FAQ](/ja-JP/help/faq-models) - モデルの選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) - 症状を起点としたトリアージ
