---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、ランタイムのサポートに関する質問への回答
    - 詳細なデバッグを行う前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-07-14T13:45:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

実際の環境（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）向けの簡潔な回答と、より詳細なトラブルシューティングです。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。設定の完全なリファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 問題が発生した場合の最初の 60 秒

<Steps>
  <Step title="クイックステータス">
    ```bash
    openclaw status
    ```
    ローカル環境の簡易サマリー：OS と更新、Gateway/サービスへの到達性、エージェント/セッション、プロバイダー設定とランタイムの問題（Gateway に到達できる場合）。
  </Step>
  <Step title="貼り付け可能なレポート（安全に共有可能）">
    ```bash
    openclaw status --all
    ```
    ログ末尾を含む読み取り専用の診断（トークンはマスキングされます）。
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
    サポートされている場合はチャンネルプローブも含め、稼働中の Gateway の健全性を調査します（到達可能な Gateway が必要です）。[健全性](/ja-JP/gateway/health)を参照してください。
  </Step>
  <Step title="最新ログを追跡">
    ```bash
    openclaw logs --follow
    ```
    RPC が停止している場合は、次の方法に切り替えます。
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    ファイルログはサービスログとは別です。[ログ](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。
  </Step>
  <Step title="Doctor を実行（修復）">
    ```bash
    openclaw doctor
    ```
    設定と状態を修復または移行してから、健全性チェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。
  </Step>
  <Step title="Gateway のスナップショット（WS のみ）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # エラー時に対象 URL と設定パスを表示
    ```
    稼働中の Gateway に完全なスナップショットを要求します。[健全性](/ja-JP/gateway/health)を参照してください。
  </Step>
</Steps>

## クイックスタートと初回セットアップ

初回実行に関する Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期障害）は、[初回実行 FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw とは何ですか？一段落で説明してください">
    OpenClaw は、自分のデバイス上で実行するパーソナル AI アシスタントです。普段使用しているメッセージング環境（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp、および QQ Bot などの同梱チャンネル Plugin）で応答し、サポート対象プラットフォームでは音声機能とライブ Canvas も利用できます。**Gateway** は常時稼働する制御プレーンであり、アシスタントが製品本体です。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude のラッパー」ではありません。**自分のハードウェア**上で高性能なアシスタントを実行し、普段使用しているチャットアプリからアクセスできる、**ローカルファーストの制御プレーン**です。ステートフルなセッション、メモリ、ツールを利用でき、ワークフローをホスト型 SaaS に委ねる必要はありません。

    - **自分のデバイス、自分のデータ**：Gateway を任意の場所（Mac、Linux、VPS）で実行し、ワークスペースとセッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実際のチャンネル**：Discord/iMessage/Signal/Slack/Telegram/WhatsApp などに加え、サポート対象プラットフォームではモバイル音声と Canvas も利用できます。
    - **モデル非依存**：Anthropic、MiniMax、OpenAI、OpenRouter などを、エージェントごとのルーティングとフェイルオーバーで使用できます。
    - **ローカル限定の選択肢**：ローカルモデルを実行し、すべてのデータをデバイス内に保持できます。
    - **マルチエージェントルーティング**：チャンネル、アカウント、タスクごとにエージェントを分け、それぞれ独自のワークスペースとデフォルト設定を使用できます。
    - **オープンソースで改造可能**：ベンダーロックインなしで、調査、拡張、セルフホストできます。

    ドキュメント：[Gateway](/ja-JP/gateway)、[チャンネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりですが、最初に何をすればよいですか？">
    最初のプロジェクトとして適している例：Web サイトの構築（WordPress、Shopify、静的サイト）、モバイルアプリのプロトタイプ作成（概要、画面、API 計画）、ファイルやフォルダーの整理、Gmail との接続および要約やフォローアップの自動化。

    大規模なタスクにも対応できますが、複数のフェーズに分割し、並行作業にはサブエージェントを使用すると最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な用途の上位 5 つは何ですか？">
    - **個人向けブリーフィング**：受信トレイ、カレンダー、関心のあるニュースの要約。
    - **調査と下書き**：簡単な調査、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ**：Cron または Heartbeat による通知やチェックリスト。
    - **ブラウザー自動化**：フォーム入力、データ収集、Web タスクの反復実行。
    - **デバイス間の連携**：スマートフォンからタスクを送信し、Gateway にサーバー上で実行させ、結果をチャットで受け取れます。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログ作成に役立ちますか？">
    はい。**調査、選定、下書き**に使用できます。サイトの調査、候補リストの作成、見込み客の要約、アウトリーチ文や広告コピーの下書き作成などが可能です。

    **アウトリーチや広告配信**では、人間による確認を必須にしてください。スパムを避け、地域の法律とプラットフォームのポリシーに従い、送信前にすべての内容を確認してください。OpenClaw に下書きを作成させ、承認は人間が行います。

    ドキュメント：[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発において Claude Code と比べた利点は何ですか？">
    OpenClaw は**パーソナルアシスタント**および連携レイヤーであり、IDE の代替ではありません。リポジトリ内で最速の直接的なコーディングループを実現するには Claude Code または Codex を使用してください。永続的なメモリ、デバイス間アクセス、ツールのオーケストレーションには OpenClaw を使用してください。

    - セッションをまたいで永続するメモリとワークスペース。
    - 複数プラットフォームからのアクセス（Telegram、WhatsApp、TUI、WebChat）。
    - ツールのオーケストレーション（ブラウザー、ファイル、スケジュール、フック）。
    - 常時稼働する Gateway（VPS 上で実行し、どこからでも操作）。
    - ローカルのブラウザー、画面、カメラ、コマンド実行用の Node。

    活用例：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを変更済み状態にせずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理対象のオーバーライドを使用します。変更を `~/.openclaw/skills/<name>/SKILL.md` に配置します（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` を使用してフォルダーを追加します）。優先順位は `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 同梱版 -> `skills.load.extraDirs` です。そのため、git に変更を加えずに、管理対象のオーバーライドを同梱 Skills より優先できます。グローバルにインストールしつつ一部のエージェントだけに表示するには、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` / `agents.list[].skills` で表示範囲を制御します。アップストリームに取り込む価値のある編集のみ、リポジトリ内のコピーに対する PR として提出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` を使用してディレクトリを追加します（上記の優先順位では最も低い優先度です）。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次回のセッションでこれを `<workspace>/skills` として扱います。特定のエージェントだけに表示するには、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルや設定を使用するにはどうすればよいですか？">
    サポートされるパターン：

    - **Cron ジョブ**：分離されたジョブでは、ジョブごとに `model` のオーバーライドを設定できます。
    - **エージェント**：デフォルトモデル、思考レベル、ストリームパラメーターが異なる個別のエージェントにタスクをルーティングします。
    - **オンデマンド切り替え**：`/model` を使用すると、現在のセッションのモデルをいつでも切り替えられます。

    例 — 同じモデルで、エージェントごとに異なる設定を使用する場合：

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

    モデルごとの共有デフォルトを `agents.defaults.models["provider/model"].params` に配置し、その後、エージェント固有のオーバーライドをフラットな `agents.list[].params` に配置します。ネストされた `agents.list[].models["provider/model"].params` の下に同じモデルを重複して指定しないでください。このパスは、エージェントごとのモデルカタログとランタイムオーバーライド用です。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[設定](/ja-JP/gateway/config-agents)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="負荷の高い処理中にボットが停止します。処理を分離するにはどうすればよいですか？">
    長時間または並行して実行するタスクには**サブエージェント**を使用します。サブエージェントは独自のセッションで実行され、要約を返すため、メインチャットの応答性を維持できます。ボットに「このタスク用のサブエージェントを生成して」と依頼するか、`/subagents` を使用します。Gateway が現在処理中かどうかを確認するには、`/status` を使用します。

    長時間タスクとサブエージェントはいずれもトークンを消費します。コストが重要な場合は、`agents.defaults.subagents.model` を使用してサブエージェントに安価なモデルを設定してください。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐付けられたサブエージェントセッションはどのように動作しますか？">
    Discord スレッドをサブエージェントまたはセッション対象に紐付けると、そのスレッド内の後続メッセージは紐付けられたセッションに送られます。

    - `thread: true` を指定した `sessions_spawn` で生成します（継続的なフォローアップには、必要に応じて `mode: "session"` も指定します）。
    - または、`/focus <target>` で手動で紐付けます。
    - `/agents` で紐付け状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動フォーカス解除を制御します。
    - `/unfocus` でスレッドの紐付けを解除します。

    設定：`session.threadBindings.enabled`（グローバルスイッチ）、`session.threadBindings.idleHours`（デフォルトは `24`、`0` で無効化）、`session.threadBindings.maxAgeHours`（デフォルトは `0` = 上限なし）、チャンネルごとのオーバーライド `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` は生成時の自動紐付けを制御します（デフォルトは `true`）。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントが完了しましたが、完了通知が別の場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    解決された要求元ルートを確認します。

    - 完了モードのサブエージェント配信では、紐付けられたスレッドまたは会話ルートが存在する場合、それを優先します。
    - 完了元にチャンネル情報しかない場合、OpenClaw は要求元セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）を代わりに使用するため、直接配信が引き続き成功する可能性があります。
    - 紐付けられたルートも使用可能な保存済みルートもない場合、直接配信が失敗する可能性があり、結果は即時投稿されず、キューに登録されたセッション配信に切り替わります。
    - 無効または古い対象も、キューへのフォールバックや最終的な配信失敗の原因になることがあります。
    - 子セッションの最後に表示されたアシスタントの応答が `NO_REPLY` / `no_reply` または `ANNOUNCE_SKIP` と完全に一致する場合、OpenClaw は以前の古い進捗を投稿する代わりに、意図的に通知を抑制します。

    デバッグ：`<lookup>` がタスク ID、実行 ID、またはセッションキーである場合は、`openclaw tasks show <lookup>` を使用します。

    ドキュメント：[サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に稼働していない場合は実行されません。

    - cron が有効になっており（`cron.enabled`）、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24 時間年中無休で稼働していることを確認します（スリープや再起動がないこと）。
    - ジョブのタイムゾーン（`--tz` とホストのタイムゾーン）を確認します。

    デバッグ：
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は実行されましたが、チャンネルに何も送信されませんでした。なぜですか？">
    配信モードを確認します：

    - `--no-deliver` / `delivery.mode: "none"`：ランナーによるフォールバック送信は行われません。
    - 通知先（`channel` / `to`）がないか無効です：ランナーは外部への配信をスキップしました。
    - チャンネル認証の失敗（`unauthorized`、`Forbidden`）：ランナーは配信を試みましたが、認証情報によって阻止されました。
    - 無言の分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信対象外と見なされるため、キューに入ったフォールバック配信も抑制されます。

    分離された Cron ジョブでは、チャット経路が利用可能な場合、エージェントは `message` ツールを使用して直接送信できます。`--announce` は、エージェント自身がまだ送信していない最終テキストに対するランナーのフォールバック配信のみを制御します。

    デバッグ：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離された Cron 実行でモデルが切り替わったり、1 回再試行されたりしたのはなぜですか？">
    これは重複スケジューリングではなく、実行中のモデル切り替え処理です。分離された Cron は実行時のモデル引き継ぎを永続化し、アクティブな実行が `LiveSessionModelSwitchError` をスローすると、切り替え後のプロバイダー／モデル（および切り替え後の認証プロファイルのオーバーライド）を維持して再試行します。

    モデル選択の優先順位：最初に Gmail フックのモデルオーバーライド（`hooks.gmail.model`）、次にジョブ単位の `model`、続いて保存済み Cron セッションのモデルオーバーライド、最後に通常のエージェント／デフォルトモデル選択です。

    再試行ループは、最初の試行に加えて 2 回の切り替え再試行に制限されています。その後、Cron は無限ループせずに中止します。

    デバッグ：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux に Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使用するか、ワークスペースに Skills を配置します。macOS の Skills UI は Linux では利用できません。[https://clawhub.ai](https://clawhub.ai) で Skills を参照できます。

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

    ネイティブの `openclaw skills install` は、デフォルトでアクティブなワークスペースの `skills/` ディレクトリに書き込みます。すべてのローカルエージェント用の共有管理 Skills ディレクトリにインストールするには、`--global` を追加します。独自の Skills を公開または同期する場合に限り、別個の `clawhub` CLI をインストールしてください。共有 Skills を参照できるエージェントを絞り込むには、`agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はタスクをスケジュール実行したり、バックグラウンドで継続的に実行したりできますか？">
    はい。Gateway スケジューラーを使用します：

    - スケジュールされたタスクまたは繰り返しタスクには **Cron ジョブ**（再起動後も保持）。
    - メインセッションの定期確認には **Heartbeat**。
    - 概要の投稿やチャットへの配信を行う自律エージェントには **分離ジョブ**。

    ドキュメント：[Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化](/ja-JP/automation)、[Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Apple macOS 専用の Skills を Linux から実行できますか？">
    直接は実行できません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限されており、**Gateway ホスト**で利用条件を満たす場合にのみ読み込まれます。Linux では、制限をオーバーライドしない限り、`darwin` 専用の Skills（`apple-notes`、`apple-reminders`、`things-mac`）は読み込まれません。

    サポートされている方法は 3 つあります：

    **オプション A - Mac 上で Gateway を実行する（最も簡単）**。macOS バイナリが存在する場所で Gateway を実行し、Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS であるため、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使用する（SSH 不要）**。Linux 上で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac 上の **Node Run Commands** を "Always Ask" または "Always Allow" に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を利用可能と見なし、エージェントは `nodes` ツール経由で実行します。"Always Ask" の場合、プロンプトで "Always Allow" を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（上級者向け）**。Gateway は Linux 上で稼働させたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにし、さらに Linux を許可するよう Skill をオーバーライドして利用可能な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例：Apple Notes 用の `memo`）：
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Linux ホストの `PATH` にラッパーを配置します（例：`~/bin/memo`）。
    3. Linux を許可するように Skill メタデータ（ワークスペースまたは `~/.openclaw/skills`）をオーバーライドします：
       ```markdown
       ---
       name: apple-notes
       description: macOS 上の memo CLI を使用して Apple Notes を管理します。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Skills のスナップショットを更新するため、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion または HeyGen との連携はありますか？">
    現在は組み込まれていません。選択肢は次のとおりです：

    - **カスタム Skill／Plugin**：信頼性の高い API アクセスに最適です（どちらにも API があります）。
    - **ブラウザー自動化**：コードなしで動作しますが、より低速で壊れやすくなります。

    代理店のようにクライアントごとのコンテキストを扱う場合は、クライアントごとに Notion ページを 1 つ（コンテキスト、設定、進行中の作業）保持し、セッション開始時にそのページを取得するようエージェントに指示します。

    ネイティブ連携が必要な場合は、機能リクエストを作成するか、それらの API を使用する Skill を構築します。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールでは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。すべてのローカルエージェントで使用するには `--global` を使用し、表示範囲を制限するには `agents.defaults.skills` / `agents.list[].skills` を設定します。一部の Skills は Homebrew でインストールされたバイナリを想定しています。Linux では Linuxbrew が必要です。

    [Skills](/ja-JP/tools/skills)、[Skills の設定](/ja-JP/tools/skills-config)、[ClawHub](/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="既存のログイン済み Chrome を OpenClaw で使用するにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する、組み込みの `user` ブラウザープロファイルを使用します：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使用する場合は、明示的な MCP プロファイルを作成します：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    ローカルホストのブラウザーまたは接続されたブラウザー Node を使用できます。Gateway が別の場所で稼働している場合は、ブラウザーがあるマシンで Node ホストを実行するか、代わりにリモート CDP を使用します。

    管理対象の `openclaw` プロファイルと比較した、`existing-session` / `user` プロファイルの現在の制限：

    - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` では、CSS セレクターではなくスナップショット参照が必要です。
    - アップロードフックでは `ref` または `inputRef` が必要で、一度に 1 ファイルのみ対応し、CSS `element` は使用できません。
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチ操作には、引き続き管理対象ブラウザーの経路が必要です。

    完全な比較については、[ブラウザー](/ja-JP/tools/browser#existing-session-via-chrome-devtools-mcp)を参照してください。

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか？">
    はい：[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker の機能が制限されているように感じます。すべての機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティを優先し、`node` ユーザーとして実行されるため、システムパッケージ、Homebrew、同梱ブラウザーは含まれていません。より完全なセットアップにするには：

    - キャッシュが保持されるよう、`OPENCLAW_HOME_VOLUME` を使用して `/home/node` を永続化します。
    - `OPENCLAW_IMAGE_APT_PACKAGES` を使用して、システム依存関係をイメージに組み込みます。
    - 同梱の CLI から Playwright ブラウザーをインストールします：`node /app/node_modules/playwright-core/cli.js install chromium`。
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスを永続化します。

    ドキュメント：[Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで、DM は個人用のまま、グループは公開／サンドボックス化できますか？">
    はい。プライベートな通信が **DM**、公開通信が **グループ**である場合に可能です。`agents.defaults.sandbox.mode: "non-main"` を設定すると、グループ／チャンネルセッション（メイン以外のキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。サンドボックス化を有効にすると、Docker がデフォルトのバックエンドになります。`tools.sandbox.tools` を使用して、サンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順：[グループ：個人用 DM と公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)。主要リファレンス：[Gateway の設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="ホストのフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:container:mode"]` に設定します（例：`"/home/user/src:/src:ro"`）。グローバルバインドとエージェント単位のバインドはマージされます。`scope: "shared"` の場合、エージェント単位のバインドは無視されます。機密性の高いものには `:ro` を使用してください。バインドはサンドボックスのファイルシステム境界を迂回します。

    OpenClaw は、正規化されたパスと、存在する最深の祖先を通じて解決された正準パスの両方に対してバインド元を検証します。そのため、最終パスセグメントがまだ存在しない場合でも、シンボリックリンクの親を利用した脱出は安全側に失敗します。

    [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)および[サンドボックスとツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントのワークスペース内にある Markdown ファイルです。日次メモは `memory/YYYY-MM-DD.md`、整理された長期メモは `MEMORY.md` に保存されます（メイン／プライベートセッションのみ）。

    OpenClaw は、Compaction が会話を要約する前に、無言の **Compaction 前メモリフラッシュ**も実行し、先に永続的なメモを書き込むようモデルに促します。これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。無効にするには `agents.defaults.compaction.memoryFlush.enabled: false` を使用します。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが内容を忘れ続けます。記憶を定着させるにはどうすればよいですか？">
    ボットに **その事実をメモリへ書き込む**よう依頼します。長期メモは `MEMORY.md`、短期コンテキストは `memory/YYYY-MM-DD.md` に保存されます。メモリを保存するようモデルに念押しすると、通常は解決します。それでも忘れ続ける場合は、Gateway が実行のたびに同じワークスペースを使用していることを確認してください。

    ドキュメント：[メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永続しますか？制限は何ですか？">
    メモリファイルはディスク上に保存され、削除されるまで保持されます。制限となるのはモデルではなくストレージです。ただし、**セッションコンテキスト**はモデルのコンテキストウィンドウによる制限を受けるため、長い会話は圧縮または切り詰められることがあります。これがメモリ検索が存在する理由であり、関連する部分だけをコンテキストに戻します。

    ドキュメント：[メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    デフォルトのプロバイダーである **OpenAI 埋め込み**を使用する場合にのみ必要です。Codex OAuth はチャット/補完を対象とし、埋め込みへのアクセス権は付与しません。そのため、Codex（OAuth または Codex CLI ログイン）でサインインしても、セマンティックメモリ検索は有効になりません。OpenAI 埋め込みには、引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    ローカルで完結させるには、`agents.defaults.memorySearch.provider: "local"`（GGUF/llama.cpp）を設定します。その他のサポート対象プロバイダー：Bedrock、DeepInfra、Gemini（`GEMINI_API_KEY` または `memorySearch.remote.apiKey`）、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 互換、Voyage。セットアップの詳細については、[メモリ](/ja-JP/concepts/memory)および[メモリ検索](/ja-JP/concepts/memory-search)を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使用するすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw 自体の状態はローカルに保存されます**が、**外部サービスには送信した内容が引き続き渡されます**。

    - **デフォルトでローカル**：セッション、メモリファイル、設定、ワークスペースは Gateway ホスト（`~/.openclaw` とワークスペースディレクトリ）に保存されます。
    - **必然的にリモート**：モデルプロバイダー（Anthropic/OpenAI など）に送信されたメッセージは各社の API に渡され、チャットプラットフォーム（Slack/Telegram/WhatsApp など）はメッセージデータを各社のサーバーに保存します。
    - **保存範囲は制御可能**：ローカルモデルを使えばプロンプトはマシン内に留まりますが、チャネルの通信は引き続きそのチャネルのサーバーを経由します。

    関連：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR`（デフォルト：`~/.openclaw`）以下に保存されます。

    | パス                                                               | 用途                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | メイン設定（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef プロバイダー用の任意のファイルベースのシークレットペイロード   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | レガシー互換ファイル（静的な `api_key` エントリは除去済み）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | プロバイダー状態（例：`whatsapp/<accountId>/creds.json`）      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | エージェントごとの状態（agentDir とレガシー/アーカイブセッション成果物）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | セッション行とトランスクリプトを含む、エージェントごとの SQLite 状態      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | レガシーセッションの移行元とアーカイブ/サポート成果物      |

    レガシーの単一エージェント用パス `~/.openclaw/agent/*` は `openclaw doctor` によって移行されます。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別に存在し、`agents.defaults.workspace`（デフォルト：`~/.openclaw/workspace`）で設定します。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに配置すべきですか？">
    これらは `~/.openclaw` ではなく、**エージェントワークスペース**に配置します。

    - **ワークスペース（エージェントごと）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。小文字のルート `memory.md` は、レガシー修復の入力としてのみ使用されます。両方が存在する場合、`openclaw doctor --fix` でこれを `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**：設定、チャネル/プロバイダー状態、認証プロファイル、セッション、ログ、共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れた」場合は、起動のたびに Gateway が同じワークスペースを使用していることを確認してください（リモートモードではローカルのノート PC ではなく、**Gateway ホストの**ワークスペースが使用されます）。

    ヒント：永続的な動作や設定については、チャット履歴に依存するのではなく、ボットに **AGENTS.md または MEMORY.md へ書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace)および[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="SOUL.md を大きくできますか？">
    はい。`SOUL.md` は、エージェントのコンテキストに注入されるワークスペースのブートストラップファイルの 1 つです。デフォルトのファイルごとの注入上限は `20000` 文字で、ファイル全体のブートストラップ予算は合計 `60000` 文字です。

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

    または、`agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 以下で特定のエージェントを上書きします。

    `/context` を使用すると、元のサイズと注入後のサイズ、および切り詰めが発生したかどうかを確認できます。`SOUL.md` には語調、姿勢、人格に関する内容のみを記載し、運用ルールは `AGENTS.md`、永続的な事実はメモリに記載してください。

    [コンテキスト](/ja-JP/concepts/context)および[エージェント設定](/ja-JP/gateway/config-agents)を参照してください。

  </Accordion>

  <Accordion title="推奨されるバックアップ方法">
    **エージェントワークスペース**を**非公開**の git リポジトリに置き、非公開の場所（例：GitHub の非公開リポジトリ）へバックアップしてください。これにより、メモリと AGENTS/SOUL/USER ファイルが保存され、後でアシスタントの「思考」を復元できます。

    `~/.openclaw` 以下の内容（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。完全に復元できるようにするには、ワークスペースと状態ディレクトリを別々にバックアップしてください。

    ドキュメント：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    [アンインストール](/ja-JP/install/uninstall)を参照してください。
  </Accordion>

  <Accordion title="エージェントはワークスペースの外部で作業できますか？">
    はい。ワークスペースは**デフォルトの cwd**およびメモリの基点であり、厳密なサンドボックスではありません。相対パスはワークスペース内で解決されます。サンドボックスが有効でない限り、絶対パスを使ってホスト上の他の場所にアクセスできます。分離するには、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)またはエージェントごとのサンドボックス設定を使用してください。リポジトリをデフォルトの作業ディレクトリにするには、そのエージェントの `workspace` をリポジトリのルートに設定します。OpenClaw リポジトリ自体は単なるソースコードであるため、エージェントを意図的にその中で作業させる場合を除き、ワークスペースは分けておいてください。

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

  <Accordion title="リモートモード：セッションストアはどこにありますか？">
    セッション状態は **Gateway ホスト**が所有します。リモートモードでは、対象となるセッションストアはローカルのノート PC ではなく、リモートマシン上にあります。[セッション管理](/ja-JP/concepts/session)を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は、`$OPENCLAW_CONFIG_PATH`（デフォルト：`~/.openclaw/openclaw.json`）から任意の **JSON5** 設定を読み込みます。ファイルがない場合は、デフォルトワークスペースの `~/.openclaw/workspace` など、比較的安全なデフォルト値を使用します。
  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したところ、何もリッスンしない、または UI に未認証と表示される'>
    loopback 以外へのバインドには、**有効な Gateway 認証経路が必要です**。共有シークレット認証（トークンまたはパスワード）、または正しく設定された ID 対応リバースプロキシの背後にある `gateway.auth.mode: "trusted-proxy"` を使用します。

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

    - `gateway.remote.token` / `.password` だけでは、ローカル Gateway 認証は有効になりません。`gateway.auth.*` が未設定の場合に限り、ローカル呼び出し経路は `gateway.remote.*` をフォールバックとして使用できます。
    - パスワード認証では、`gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `.password` が SecretRef 経由で明示的に設定され、解決できない場合は、解決処理がフェイルクローズします（リモートフォールバックによる隠蔽は行われません）。
    - 共有シークレットを使用する Control UI 構成では、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）を使用して認証します。Tailscale Serve や `trusted-proxy` などの ID を含むモードでは、代わりにリクエストヘッダーを使用します。共有シークレットを URL に含めないでください。
    - `gateway.auth.mode: "trusted-proxy"` を使用する場合、同一ホスト上の loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="localhost でトークンが必要になったのはなぜですか？">
    OpenClaw は、loopback を含め、デフォルトで Gateway 認証を適用します。明示的な認証経路が設定されていない場合、起動時にトークンモードが選択され、その起動時のみ有効なトークンが生成されます。そのため、ローカル WS クライアントも認証する必要があります。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    クライアントが再起動後も安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。パスワードモード、または ID 対応リバースプロキシ用の `trusted-proxy` を選択することもできます。認証なしの loopback を使用するには、`gateway.auth.mode: "none"` を明示的に設定します。`openclaw doctor --generate-gateway-token` はいつでもトークンを生成します。

  </Accordion>

  <Accordion title="設定を変更した後に再起動する必要がありますか？">
    Gateway は設定を監視し、ホットリロードをサポートしています。`gateway.reload.mode: "hybrid"`（デフォルト）は、安全な変更を即時適用し、重要な変更では再起動します。`hot`、`restart`、`off` もサポートされています。ほとんどの `tools.*`、`agents.*` ポリシー、`session.*`、`messages.*` の変更は、リロード操作なしですぐに適用されます。`gateway.*` のバインド/ポート変更には再起動が必要です。
  </Accordion>

  <Accordion title="CLI の面白いタグラインを無効にするにはどうすればよいですか？">
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

    - `off`：タグラインのテキストを非表示にしますが、バナーのタイトル/バージョン行は残します。
    - `default`：常に `All your chats, one OpenClaw.` を使用します。
    - `random`：面白いタグラインや季節のタグラインをローテーション表示します（デフォルト動作）。
    - バナーを完全に非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web 取得）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択したプロバイダーによって異なります。

    | プロバイダー | キー不要 | 環境変数 |
    | --- | --- | --- |
    | Brave | いいえ | `BRAVE_API_KEY` |
    | DuckDuckGo | はい（非公式のHTMLベース） | - |
    | Exa | いいえ | `EXA_API_KEY` |
    | Firecrawl | いいえ | `FIRECRAWL_API_KEY` |
    | Gemini | いいえ | `GEMINI_API_KEY` |
    | Grok | いいえ（xAI OAuthまたはキー） | `XAI_API_KEY` |
    | Kimi | いいえ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |
    | MiniMax Search | いいえ | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` |
    | Ollama Web Search | はい（`ollama signin` が必要） | - |
    | Perplexity | いいえ | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` |
    | SearXNG | はい（セルフホスト） | `SEARXNG_BASE_URL` |
    | Tavily | いいえ | `TAVILY_API_KEY` |

    Grokはモデル認証のxAI OAuthも再利用できます（`openclaw onboard --auth-choice xai-oauth`）。

    **推奨**: `openclaw configure --section web` を実行してプロバイダーを選択します。

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

    プロバイダー固有のWeb検索設定は `plugins.entries.<plugin>.config.webSearch.*` にあります。従来の `tools.web.search.*` プロバイダーパスも互換性のため読み込まれますが、新しい設定では使用しないでください。FirecrawlのWeb取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` にあります。

    - 許可リスト: `web_search`/`web_fetch`/`x_search`、または3つすべてに対して `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です。
    - `tools.web.fetch.provider` を省略すると、OpenClawは利用可能な認証情報から、準備済みの最初の取得フォールバックプロバイダーを自動検出します。公式Firecrawl Pluginがそのフォールバックを提供します。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Webツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.applyによって設定が消去されました。復旧して再発を防ぐにはどうすればよいですか？">
    `config.apply` は**設定全体**を置き換えます。部分的なオブジェクトを指定すると、それ以外はすべて削除されます。

    現在のOpenClawでは、誤操作による上書きの大半を防止します。

    - OpenClawが管理する設定書き込みでは、書き込む前に変更後の設定全体を検証します。
    - 無効または破壊的なOpenClaw管理の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが失敗する場合、Gatewayはフェイルクローズするかリロードをスキップします。`openclaw.json` を書き換えることはありません。
    - `openclaw doctor --fix` が修復を担当し、最後に正常だった設定を復元できます。また、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。

    復旧手順:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - 有効な設定の隣にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認します。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - `openclaw config set` または `config.patch` を使用して、必要なキーだけを書き戻します。
    - 最後に正常だった設定または拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネルとモデルを再設定します。
    - 予期しない消失が発生した場合は、最後に把握している設定またはバックアップを添えてバグを報告してください。ローカルのコーディングエージェントであれば、ログや履歴から動作する設定を再構築できることがあります。

    回避方法: 小さな変更には `openclaw config set`、対話的な編集には `openclaw configure`、不明なパスの確認には `config.schema.lookup`（浅いスキーマノードと直下の子要素の概要を返します）、部分的なRPC編集には `config.patch` を使用し、`config.apply` は設定全体の置換専用にしてください。エージェント向けの `gateway` ランタイムツールは、従来の `tools.bash.*` エイリアス経由であっても `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。

    ドキュメント: [設定](/ja-JP/cli/config)、[構成](/ja-JP/cli/configure)、[Gatewayのトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="複数のデバイスに特化したワーカーを配置し、中央のGatewayを運用するにはどうすればよいですか？">
    一般的な構成は、**1つのGateway**（たとえばRaspberry Pi）に**Node**と**エージェント**を組み合わせるものです。

    - **Gateway（中央）**: チャンネル（Signal/WhatsApp）、ルーティング、セッションを管理します。
    - **Node（デバイス）**: Mac/iOS/Androidが周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）**: 特別な役割（たとえば運用データと個人データ）のために、頭脳とワークスペースを分離します。
    - **サブエージェント**: メインエージェントからバックグラウンド作業を生成し、並列実行します。
    - **TUI**: Gatewayに接続し、エージェントやセッションを切り替えます。

    ドキュメント: [Node](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClawブラウザーをヘッドレスで実行できますか？">
    はい。

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

    デフォルトは `false`（ウィンドウ表示あり）です。一部のサイトでは、ヘッドレスのほうがボット対策のチェックに引っかかりやすくなります（X/Twitterはヘッドレスセッションを頻繁にブロックします）。同じChromiumエンジンを使用し、ほとんどの自動化で動作します。主な違いはブラウザーウィンドウが表示されないことです（画面の確認にはスクリーンショットを使用してください）。[ブラウザー](/ja-JP/tools/browser)を参照してください。

  </Accordion>

  <Accordion title="ブラウザー制御にBraveを使用するにはどうすればよいですか？">
    `browser.executablePath` にBraveのバイナリ（または任意のChromiumベースのブラウザー）を設定し、Gatewayを再起動します。[ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser)を参照してください。
  </Accordion>
</AccordionGroup>

## リモートGatewayとNode

<AccordionGroup>
  <Accordion title="Telegram、Gateway、Nodeの間でコマンドはどのように伝播しますか？">
    Telegramメッセージは**Gateway**によって処理されます。Gatewayがエージェントを実行し、その後、Nodeツールが必要な場合にのみ**Gateway WebSocket**経由でNodeを呼び出します。

    Telegram -> Gateway -> エージェント -> `node.*` -> Node -> Gateway -> Telegram

    Nodeがプロバイダーからの受信トラフィックを参照することはありません。Node RPC呼び出しだけを受信します。

  </Accordion>

  <Accordion title="Gatewayがリモートでホストされている場合、エージェントからコンピューターにアクセスするにはどうすればよいですか？">
    コンピューターを**Node**としてペアリングします。Gatewayは別の場所で動作しますが、Gateway WebSocket経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    1. 常時稼働するホスト（VPS/ホームサーバー）でGatewayを実行します。
    2. Gatewayホストとコンピューターを同じtailnetに配置します。
    3. Gateway WSに到達できることを確認します（tailnetへのバインドまたはSSHトンネル）。
    4. macOSアプリをローカルで開き、**Remote over SSH**モード（またはtailnetへの直接接続）で接続してNodeとして登録します。
    5. Nodeを承認します。
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    個別のTCPブリッジは不要です。NodeはGateway WebSocket経由で接続します。

    セキュリティ上の注意: macOSのNodeをペアリングすると、そのマシン上で `system.run` が許可されます。信頼できるデバイスだけをペアリングしてください。[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [Node](/ja-JP/nodes)、[Gatewayプロトコル](/ja-JP/gateway/protocol)、[macOSリモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscaleは接続されていますが、応答がありません。次に何を確認すればよいですか？">
    基本事項を確認します。

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    次に、認証とルーティングを確認します。Tailscale Serveを使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。SSHトンネル経由で接続している場合は、トンネルが稼働していて正しいポートを指していることを確認してください。また、DM/グループの許可リストに自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2つのOpenClawインスタンスを相互通信させることはできますか（ローカル + VPS）？">
    はい。ただし、組み込みのボット間ブリッジはありません。

    **最も簡単な方法**: 両方のボットがアクセスできる通常のチャットチャンネル（Slack/Telegram/WhatsApp）を使用します。ボットAからボットBへメッセージを送信し、ボットBに通常どおり返信させます。

    **CLIブリッジ（汎用）**: `openclaw agent --message ... --deliver` を使用してもう一方のGatewayを呼び出すスクリプトを実行し、もう一方のボットが待機しているチャットを対象にします。一方のボットがリモートVPS上にある場合は、SSH/Tailscale経由でCLIの接続先をそのリモートGatewayに設定します（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    ```bash
    openclaw agent --message "ローカルボットからこんにちは" --deliver --channel telegram --reply-to <chat-id>
    ```

    2つのボットが無限に応答し合わないよう、ガードレールを追加してください（メンション時のみ、チャンネル許可リスト、または「ボットのメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェントCLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに個別のVPSが必要ですか？">
    いいえ。1つのGatewayで複数のエージェントをホストでき、それぞれが独自のワークスペース、モデルのデフォルト値、ルーティングを持ちます。これは標準的な構成であり、エージェントごとにVPSを用意するよりも大幅に安価で簡単です。個別のVPSを使用するのは、厳格な分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合に限ってください。
  </Accordion>

  <Accordion title="VPSからSSH接続する代わりに、個人用ノートパソコンをNodeとして使用する利点はありますか？">
    はい。NodeはリモートGatewayからノートパソコンへアクセスするための第一級の方法であり、シェルアクセス以外の機能も利用できます。GatewayはmacOS/Linux（WindowsではWSL2経由）で動作し軽量なため（小規模なVPSやRaspberry Piクラスのマシンで十分であり、4 GB RAMで余裕があります）、常時稼働するホストとノートパソコンをNodeとして組み合わせる構成が一般的です。

    - **受信SSHは不要** - Nodeはデバイスのペアリングを通じてGateway WebSocketへ外向きに接続します。
    - **より安全な実行制御** - `system.run` は、そのノートパソコン上のNode許可リストと承認によって制御されます。
    - **より多くのデバイスツール** - Nodeは `system.run` に加えて、`canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化** - GatewayをVPS上で実行したまま、Nodeホスト経由でChromeをローカル実行したり、Chrome MCP経由でローカルのChromeに接続したりできます。

    一時的なシェルアクセスにはSSHでも問題ありませんが、継続的なエージェントワークフローとデバイス自動化にはNodeのほうが簡単です。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="NodeはGatewayサービスを実行しますか？">
    いいえ。分離されたプロファイルを意図的に実行する場合を除き、ホストごとに実行する**Gatewayは1つだけ**にしてください（[複数のGateway](/ja-JP/gateway/multiple-gateways)を参照）。NodeはGatewayに接続する周辺機器です（iOS/AndroidのNode、またはメニューバーアプリのmacOS「Nodeモード」）。ヘッドレスNodeホストとCLI制御については、[NodeホストCLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、およびホストされるPluginサーフェスの変更には、完全な再起動が必要です。

  </Accordion>

  <Accordion title="API / RPC経由で設定を適用する方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込む前に、1 つの設定サブツリーを、その浅いスキーマノード、一致する UI ヒント、直下の子要素の概要とともに検査します。
    - `config.get`: 現在のスナップショットとハッシュを取得します。
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します。
    - `config.apply`: 設定全体を検証して置き換えます。可能な場合はホットリロードし、必要な場合は再起動します。
    - エージェント向けの `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスも同じ保護対象パスに正規化されます。

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ワークスペースを設定し、ボットを起動できるユーザーを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale をセットアップして Mac から接続するには？">
    1. **VPS にインストールしてログイン**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. Tailscale アプリを使用して **Mac にインストールしてログイン**し、同じ tailnet に接続します。
    3. VPS に安定した名前を割り当てるため、Tailscale 管理コンソールで **MagicDNS を有効化**します。
    4. **tailnet のホスト名を使用**します。SSH は `ssh user@your-vps.tailnet-xxxx.ts.net`、Gateway WS は `ws://your-vps.tailnet-xxxx.ts.net:18789` です。

    SSH を使用せずにコントロール UI にアクセスするには、VPS で Tailscale Serve を使用します。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより Gateway は loopback にバインドされたまま、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

  </Accordion>

  <Accordion title="Mac の Node をリモート Gateway（Tailscale Serve）に接続するには？">
    Serve は **Gateway のコントロール UI + WS** を公開します。Node は同じ Gateway WS エンドポイント経由で接続します。

    1. VPS と Mac が同じ tailnet に接続されていることを確認します。
    2. macOS アプリをリモートモードで使用します（SSH ターゲットには tailnet のホスト名を指定できます）。アプリは Gateway ポートをトンネリングし、Node として接続します。
    3. Node を承認します。
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか、それとも Node を追加するだけでよいですか？">
    2 台目のノート PC で **ローカルツールのみ**（画面、カメラ、実行）を使用する場合は、**Node** として追加します。Gateway は 1 つのままで、設定の重複はありません。ローカル Node ツールは現在 macOS でのみ利用できます。2 つ目の Gateway は、**厳密な分離**または完全に独立した 2 つのボットが必要な場合にのみインストールしてください。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（シェル、launchd/systemd、CI など）から環境変数を読み取り、さらに以下を読み込みます。

    - 現在の作業ディレクトリにある `.env`。
    - `~/.openclaw/.env`（`$OPENCLAW_STATE_DIR/.env`）にあるグローバルフォールバック `.env`。

    どちらの `.env` ファイルも既存の環境変数を上書きしません。ワークスペースの `.env` については、プロバイダーの認証情報およびエンドポイントルーティング用キーが例外です。`GEMINI_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、末尾が `_ENDPOINT` のキー（およびその他の同梱プロバイダーの認証またはエンドポイント用環境変数）は、ワークスペースの `.env` からは無視されます。これらはプロセス環境、`~/.openclaw/.env`、または設定の `env` に置いてください。

    設定内のインライン環境変数は、プロセス環境に存在しない場合にのみ適用されます。

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    優先順位と取得元の詳細については、[/environment](/ja-JP/help/environment)を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    2 つの解決方法があります。

    1. 不足しているキーを `~/.openclaw/.env` に置くと、サービスがシェル環境を継承しない場合でも読み込まれます。
    2. シェルインポートを有効にします（任意で使用できる便利な機能）。
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
       これによりログインシェルが実行され、不足している想定済みのキーのみがインポートされます（既存の値は決して上書きされません）。対応する環境変数は `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` です。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、モデルの状態に「Shell env: off.」と表示されます。なぜですか？'>
    `openclaw models status` は、**シェル環境のインポート**が有効かどうかを報告します。「Shell env: off」は環境変数が不足しているという意味ではありません。OpenClaw がログインシェルを自動的に読み込まないという意味にすぎません。

    Gateway がサービス（launchd/systemd）として実行されている場合、シェル環境は継承されません。トークンを `~/.openclaw/.env` に置くか、`env.shellEnv.enabled: true` を有効にするか、設定の `env` に追加して（存在しない場合にのみ適用）、Gateway を再起動してから再確認してください。

    ```bash
    openclaw models status
    ```

    Copilot トークンは、`OPENCLAW_GITHUB_TOKEN`、`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` の順に解決されます。

    [/concepts/model-providers](/ja-JP/concepts/model-providers)および[/environment](/ja-JP/help/environment)を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するには？">
    `/new` または `/reset` を単独のメッセージとして送信します。[セッション管理](/ja-JP/concepts/session)を参照してください。
  </Accordion>

  <Accordion title="/new を送信しなくてもセッションは自動的にリセットされますか？">
    はい。デフォルトのリセットポリシーは **毎日** です。現在のセッションが開始された時刻に基づき、Gateway ホスト上で設定されたローカル時刻（`session.reset.atHour`、デフォルトは `4`、0-23）にセッションが切り替わります。代わりにアイドル時間ベースのリセットを使用するには、`mode: "idle"` と `session.reset.idleMinutes` を設定します。これにより、一定期間操作がないとセッションが期限切れになります（Heartbeat/Cron/実行のシステムイベントではなく、最後の実際の操作に基づきます）。

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

    `resetByType` は、`direct`（従来のエイリアスは `dm`）、`group`、`thread` をサポートします。トップレベルの従来の `session.idleMinutes` は、`session.reset`/`resetByType` ブロックが設定されていない場合、アイドルモードのデフォルトに対する互換エイリアスとして引き続き機能します。プロバイダーが所有するアクティブな CLI セッションがあるセッションは、暗黙の毎日リセットによって終了されません。ライフサイクルの詳細については、[セッション管理](/ja-JP/concepts/session)を参照してください。

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1 人の CEO と多数のエージェント）を構成できますか？">
    はい。**マルチエージェントルーティング**と**サブエージェント**を使用できます。1 つのコーディネーターエージェントと、独自のワークスペースおよびモデルを持つ複数のワーカーエージェントを構成します。

    これは楽しい実験として捉えるのが適切です。大量のトークンを消費し、個別のセッションを持つ 1 つのボットより効率が低い場合が多いためです。一般的な構成では、会話するボットを 1 つ用意し、並行作業には異なるセッションを使用し、必要に応じてサブエージェントを生成します。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    セッションのコンテキストはモデルのウィンドウによって制限されます。長いチャット、大量のツール出力、または多数のファイルによって、Compaction や切り詰めが発生することがあります。

    - ボットに現在の状態を要約し、ファイルに書き込むよう依頼します。
    - 長いタスクの前には `/compact`、話題を切り替えるときには `/new` を使用します。
    - 重要なコンテキストをワークスペースに保存し、ボットに再読み込みを依頼します。
    - 長時間または並行する作業にはサブエージェントを使用し、メインチャットを小さく保ちます。
    - この問題が頻繁に発生する場合は、より大きなコンテキストウィンドウを持つモデルを選択します。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするには？">
    ```bash
    openclaw reset
    ```

    非対話形式での完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します。

    ```bash
    openclaw onboard --install-daemon
    ```

    既存の設定が検出された場合、オンボーディングには **リセット** も表示されます。[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用した場合は、各状態ディレクトリ（デフォルトは `~/.openclaw-<profile>`）をリセットします。開発専用のリセットでは、`openclaw gateway --dev --reset` により開発用設定、認証情報、セッション、ワークスペースが消去されます。

  </Accordion>

  <Accordion title='「context too large」エラーが発生します。リセットまたは Compaction するには？'>
    - **Compaction**（会話を維持し、古いターンを要約）: `/compact`、または要約内容を指定するには `/compact <instructions>`。
    - **リセット**（同じチャットキーに新しいセッション ID を割り当て）: `/new` または `/reset`。

    問題が繰り返し発生する場合は、**セッションの枝刈り**（`agents.defaults.contextPruning`）を調整して古いツール出力を削減するか、より大きなコンテキストウィンドウを持つモデルを使用します。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッションの枝刈り](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    プロバイダーの検証エラーです。モデルが必須の `input` を含まない `tool_use` ブロックを出力しました。通常、セッション履歴が古いか破損していることを意味します（長いスレッドやツール/スキーマの変更後によく発生します）。

    解決方法: `/new` を単独のメッセージとして送信し、新しいセッションを開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます。解決された認証モードが Anthropic OAuth/トークン認証（Claude CLI の再利用を含む）で、`heartbeat.every` が未設定の場合は **1h** ごとです。調整または無効化するには、次のように設定します。

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

    `HEARTBEAT.md` が存在していても実質的に空の場合（空白行、Markdown/HTML コメント、ATX 見出し、フェンスマーカー、または空のリスト項目スタブのみ）、OpenClaw は API 呼び出しを節約するため Heartbeat の実行をスキップします。ファイルが存在しない場合でも Heartbeat は実行され、モデルが処理内容を判断します。

    エージェントごとの上書きには `agents.list[].heartbeat` を使用します。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClaw は **自分のアカウント** で動作します。自分がグループに参加していれば、OpenClaw もそのグループを認識できます。デフォルトでは、送信者を許可するまでグループへの返信はブロックされます（`groupPolicy: "allowlist"`）。

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

  <Accordion title="WhatsApp グループの JID を取得するには？">
    最も速い方法は、ログを追跡しながらグループでテストメッセージを送信することです。

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例: `1234567890-1234567890@g.us`。

    すでに設定済みまたは許可リストに登録済みの場合は、設定からグループを一覧表示します。

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります。メンション制限がデフォルトで有効になっている（ボットを @メンションするか、`mentionPatterns` に一致させる必要があります）、または `"*"` なしで `channels.whatsapp.groups` を設定しており、そのグループが許可リストに含まれていません。

    [グループ](/ja-JP/channels/groups)と[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

  </Accordion>

  <Accordion title="グループやスレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットは、デフォルトではメインセッションにまとめられます。グループやチャンネルにはそれぞれ独自のセッションキーがあり、Telegram のトピックと Discord のスレッドは個別のセッションになります。[グループ](/ja-JP/channels/groups)と[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な上限はありません。数十、さらには数百でも問題ありませんが、以下に注意してください。

    - **ディスク使用量の増加**: アクティブなセッションとトランスクリプトはエージェントごとの SQLite データベースに保存されます。従来のアーティファクトやアーカイブアーティファクトは、引き続き `~/.openclaw/agents/<agentId>/sessions/` 以下に蓄積する可能性があります。
    - **トークンコスト**: エージェントが増えるほど、モデルの同時使用量も増加します。
    - **運用オーバーヘッド**: エージェントごとの認証プロファイル、ワークスペース、チャンネルルーティングが必要になります。

    エージェントごとに **アクティブな** ワークスペースを 1 つ（`agents.defaults.workspace`）に保ち、ディスク使用量が増えた場合は `openclaw sessions cleanup` で古いセッションを削除してください（アクティブな SQLite の状態を手動で編集しないでください）。また、`openclaw doctor` を使用して、不要なワークスペースやプロファイルの不一致を見つけてください。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）？また、どのように設定すればよいですか？">
    はい、**マルチエージェントルーティング**を使用できます。複数の分離されたエージェントを実行し、受信メッセージをチャンネル、アカウント、ピアに基づいてルーティングします。Slack はチャンネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザアクセスは強力ですが、「人間にできることは何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって自動化が妨げられる場合があります。最も確実に制御するには、ホスト上のローカル Chrome MCP、または実際にブラウザを実行しているマシン上の CDP を使用してください。

    推奨設定は、常時稼働する Gateway ホスト（VPS/Mac mini）、役割ごとに 1 つのエージェント（バインディング）、それらのエージェントにバインドされた Slack チャンネル、および必要に応じて Chrome MCP または Node を介したローカルブラウザです。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、[ブラウザ](/ja-JP/tools/browser)、[Node](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルに関する Q&A（デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル）は、[モデル FAQ](/ja-JP/help/faq-models)にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、フックなど）で多重化された単一のポートを制御します。優先順位は次のとおりです。

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > デフォルト 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status で「Runtime: running」と表示されるのに「Connectivity probe: failed」となるのはなぜですか？'>
    「実行中」は **スーパーバイザー側**（launchd/systemd/schtasks）の見解です。一方、接続プローブでは CLI が実際に Gateway WebSocket へ接続します。`openclaw gateway status` の次の行を確認してください。`Probe target:`（プローブが使用した URL）、`Listening:`（実際にそのポートへバインドされているもの）、`Last gateway error:`（プロセスは稼働しているもののポートがリッスンしていない場合によくある根本原因）。
  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が異なるのはなぜですか？'>
    編集している設定ファイルと、サービスが使用している設定ファイルが異なります（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正するには、サービスに使用させたいものと同じ `--profile` / 環境から次を実行します。

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は、起動直後に WebSocket リスナー（デフォルトは `ws://127.0.0.1:18789`）をバインドすることで、ランタイムロックを適用します。`EADDRINUSE` によりバインドに失敗すると、`GatewayLockError`（「別の Gateway インスタンスがすでにリッスンしています」）がスローされます。

    修正するには、もう一方のインスタンスを停止するか、ポートを解放するか、`openclaw gateway --port <port>` を指定して実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続するモード）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定してリモート WebSocket URL を指定します。必要に応じて、共有シークレットによるリモート認証情報も指定できます。

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

    - `openclaw gateway` は、`gateway.mode` が `local` の場合（またはオーバーライドフラグを渡した場合）にのみ起動します。
    - macOS アプリは設定ファイルを監視し、これらの値が変更されると稼働中にモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報にすぎません。これらだけではローカル Gateway の認証は有効になりません。

  </Accordion>

  <Accordion title='Control UI に「unauthorized」と表示されます（または再接続が繰り返されます）。どうすればよいですか？'>
    Gateway の認証経路と UI の認証方式が一致していません。

    コードから確認できる事実:

    - Control UI はトークンを `sessionStorage` に保持し、現在のブラウザタブと選択された Gateway URL にスコープを限定します。そのため、トークンを localStorage に長期間保存しなくても、同じタブでの更新後は引き続き動作します。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行のヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュされたデバイストークンを使用して、上限付きの再試行を 1 回実行できます。
    - このキャッシュ済みトークンによる再試行では、デバイストークンとともに保存された承認済みスコープを再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュされたスコープを継承せず、要求したスコープセットを維持します。
    - この再試行経路以外では、接続認証の優先順位は、明示的な共有トークンまたはパスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - 組み込みのセットアップコードによるブートストラップは、`scopes: []` を持つ Node デバイストークンと、信頼済みモバイルのオンボーディング用の有効範囲が限定されたオペレーターハンドオフトークンを返します。オペレーターハンドオフはセットアップ時のネイティブ設定を読み取れますが、ペアリング変更スコープや `operator.admin` は付与されません。

    修正方法:

    - 最速の方法: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレス環境では SSH のヒントを表示します）。
    - トークンがまだない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合: まず `ssh -N -L 18789:127.0.0.1:18789 user@host` でトンネルを確立し、次に `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、対応するシークレットを Control UI の設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であること、および Tailscale の ID ヘッダーを迂回する未加工の loopback/tailnet URL ではなく、Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 設定済みの ID 対応プロキシを経由していることを確認します。同一ホストの loopback プロキシでは `gateway.auth.trustedProxy.allowLoopback = true` も必要です。
    - 1 回の再試行後も不一致が続く場合: ペアリング済みデバイストークンをローテーションまたは再承認します。
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - ローテーションが拒否される場合: ペアリング済みデバイスのセッションがローテーションできるのは、そのデバイス **自身** のみです。ただし、`operator.admin` も持っている場合を除きます。また、明示的な `--scope` の値が、呼び出し元の現在のオペレータースコープを超えることはできません。
    - それでも解決しない場合: `openclaw status --all` と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。認証の詳細については[ダッシュボード](/ja-JP/web/dashboard)を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、loopback でしかリッスンしません">
    `tailnet` バインドは、ネットワークインターフェースから Tailscale IP（100.64.0.0/10）を選択します。マシンが Tailscale に接続されていない場合（またはインターフェースが停止している場合）、Gateway は別のネットワークインターフェースを公開せず、loopback にフォールバックします。

    修正するには、そのホストで Tailscale を起動して Gateway を再起動するか、明示的に `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    `tailnet` は明示的な指定です。`auto` は loopback を優先します。必須の同一ホスト `127.0.0.1` リスナーを維持しながら、loopback 以外への公開を Tailnet に制限するには、`gateway.bind: "tailnet"` を使用してください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常は必要ありません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長化（レスキューボットなど）または厳密な分離が必要な場合にのみ使用し、それぞれに独自の `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace`、および一意の `gateway.port` を設定して分離してください。

    推奨: インスタンスごとに `openclaw --profile <name> ...`（`~/.openclaw-<name>` を自動作成）、プロファイル設定ごとに一意の `gateway.port`（手動実行の場合は `--port`）、および `openclaw --profile <name> gateway install` を使用したプロファイルごとのサービスを使用します。

    プロファイルはサービス名にもサフィックスを付けます。launchd は `ai.openclaw.<profile>`、systemd は `openclaw-gateway-<profile>.service`、Windows は `OpenClaw Gateway (<profile>)` です。修飾なしの `openclaw-gateway` systemd ユニットは、デフォルトプロファイルにのみ存在します。名前変更前の従来の systemd ユニット名 `clawdbot-gateway` は自動的に移行されます。

    詳細なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして `connect` フレームを想定しています。それ以外の場合、接続は **コード 1008**（ポリシー違反）で閉じられます。

    よくある原因は、WS クライアントではなくブラウザで **HTTP** URL を開いた、誤ったポートやパスを使用した、またはプロキシやトンネルが認証ヘッダーを削除したか、Gateway 以外のリクエストを送信したことです。

    修正するには、WS URL（`ws://<host>:18789`、HTTPS 経由の場合は `wss://...`）を使用し、通常のブラウザタブで WS ポートを開かず、認証が有効な場合は `connect` フレームにトークンまたはパスワードを含めます。CLI/TUI の例:

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

    最速で追跡する方法:

    ```bash
    openclaw logs --follow
    ```

    サービスまたはスーパーバイザーのログ（Gateway を launchd/systemd 経由で実行している場合）:

    - macOS launchd の stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルでは `gateway-<profile>.log` を使用します。stderr は抑制されます）。
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    詳細は[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを起動、停止、再起動するにはどうすればよいですか？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合は、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway)を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するにはどうすればよいですか？">
    Windows には 3 つのインストールモードがあります。

    **1) Windows Hub のローカルセットアップ**: ネイティブアプリが、アプリ所有のローカル WSL Gateway を管理します。スタートメニューまたはトレイから **OpenClaw Companion** を開き、**Gateway Setup** または Connections タブを使用します。

    **2) 手動 WSL2 Gateway**: Gateway は Linux 内で実行されます。
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    サービスをインストールしていない場合は、フォアグラウンドで起動します: `openclaw gateway run`。

    **3) ネイティブ Windows CLI/Gateway**: Windows で直接実行されます。
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    手動で実行する場合（サービスなし）: `openclaw gateway run`。

    ドキュメント: [Windows](/ja-JP/platforms/windows)、[Gateway サービス運用手順書](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は稼働していますが、応答が届きません。何を確認すればよいですか？">
    簡単な健全性チェック:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因: **Gateway ホスト**でモデル認証が読み込まれていない（`models status` を確認）、チャンネルのペアリングまたは許可リストが応答をブロックしている（チャンネル設定とログを確認）、あるいは正しいトークンなしで WebChat/Dashboard を開いていることです。リモートの場合は、トンネル/Tailscale 接続が稼働しており、Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャンネル](/ja-JP/channels)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)、[リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Gateway から切断されました: 理由なし" - 次に何をすればよいですか？'>
    通常は、UI が WebSocket 接続を失ったことを意味します。次を確認してください: Gateway は実行中ですか（`openclaw gateway status`）？正常ですか（`openclaw status`）？UI に正しいトークンが設定されていますか（`openclaw dashboard`）？リモートの場合、トンネル/Tailscale リンクは稼働していますか？

    次に、ログを追跡します:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram の setMyCommands が失敗します。何を確認すればよいですか？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次に、該当するエラーを確認します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限に合わせて項目を削減し、コマンド数を減らして再試行しますが、それでも一部のメニュー項目が除外される場合があります。Plugin/Skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上またはプロキシの背後で実行している場合は、送信 HTTPS が許可され、`api.telegram.org` の DNS 解決が機能することを確認してください。

    Gateway がリモートにある場合は、Gateway ホスト上のログを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すればよいですか？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使用して現在の状態を確認します。チャットチャンネルで応答を受け取る想定の場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合（macOS の launchd、Linux の systemd）:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    フォアグラウンドでは Ctrl-C で停止してから、`openclaw gateway run` を実行します。

    ドキュメント: [Gateway サービス運用手順書](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="初心者向け: openclaw gateway restart と openclaw gateway の違い">
    `openclaw gateway restart` は**バックグラウンドサービス**（launchd/systemd）を再起動します。`openclaw gateway` は、このターミナルセッションで Gateway を**フォアグラウンド**実行します。サービスをインストールしている場合は Gateway のサブコマンドを使用し、一度限りの実行にはサブコマンドなしのフォアグラウンド実行を使用してください。
  </Accordion>

  <Accordion title="問題発生時に詳細情報を得る最速の方法">
    コンソールに詳細を表示するには、`--verbose` で Gateway を起動し、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="Skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントから送信する添付ファイルには、`media`、`mediaUrl`、`path`、`filePath` などの構造化メディアフィールドを使用する必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)と[エージェント送信](/ja-JP/tools/agent-send)を参照してください。

    ```bash
    openclaw message send --target +15555550123 --message "こちらです" --media /path/to/file.png
    ```

    次の点も確認してください: 対象チャンネルが送信メディアをサポートし、許可リストによってブロックされていないこと、ファイルがプロバイダーのサイズ制限内であること（画像は最長辺が 2048px になるようにリサイズされます）、`tools.fs.workspaceOnly=true` がローカルパスからの送信をワークスペース、一時/メディアストア、およびサンドボックスで検証済みのファイルに制限していること、`tools.fs.workspaceOnly=false`（デフォルト）により、構造化されたローカルメディア送信で、エージェントがすでに読み取れるホスト上のローカルファイルを、メディアと安全な文書形式（画像、音声、動画、PDF、Office 文書、および Markdown/MD、TXT、JSON、YAML/YML などの検証済みテキスト文書）に使用できることです。これはシークレットスキャナーではありません。拡張子と内容の検証が一致すれば、エージェントが読み取れる `secret.txt` や `config.json` も添付できます。機密ファイルはエージェントが読み取れるパスの外に置くか、ローカルパスからの送信をより厳格にするために `tools.fs.workspaceOnly=true` を維持してください。

    [画像](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルト設定によってリスクが軽減されます:

    - DM 対応チャンネルのデフォルト動作は**ペアリング**です。不明な送信者にはペアリングコードが送られ、そのメッセージは処理されません。`openclaw pairing approve --channel <channel> [--account <id>] <code>` で承認します。保留中のリクエストは**チャンネルごとに 3 件**に制限されています。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を一般公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクのある DM ポリシーを検出するには、`openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか？">
    いいえ。プロンプトインジェクションは、ボットに DM できる相手だけでなく、**信頼できないコンテンツ**に関する問題です。アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、文書、添付ファイル、貼り付けられたログ）を読み取る場合、そのコンテンツにはモデルを乗っ取ろうとする指示が含まれる可能性があります。送信者が自分だけでも同様です。

    最大のリスクは、ツールが有効な場合です。モデルがだまされ、コンテキストを流出させたり、ユーザーに代わってツールを呼び出したりする可能性があります。影響範囲を縮小してください:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「リーダー」エージェントを使用する
    - ツール有効のエージェントでは、`web_search` / `web_fetch` / `browser` を無効にしておく
    - デコードされたファイル/文書テキストも信頼できないものとして扱う: OpenResponses の `input_file` とメディア添付ファイルの抽出はどちらも、生のファイルテキストを渡す代わりに、抽出されたテキストを明示的な外部コンテンツ境界マーカーで囲む
    - サンドボックス化し、厳格なツール許可リストを使用する

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw は Rust/WASM ではなく TypeScript/Node を使用しているため、安全性が低いのですか？">
    言語とランタイムは重要ですが、個人用エージェントにとって主要なリスクではありません。実際のリスクは、Gateway の公開範囲、ボットにメッセージを送信できる相手、プロンプトインジェクション、ツールの権限範囲、認証情報の取り扱い、ブラウザアクセス、exec アクセス、第三者の Skill/Plugin の信頼性です。

    Rust と WASM は一部のコードクラスに対してより強力な分離を提供できますが、プロンプトインジェクション、不適切な許可リスト、Gateway の一般公開、広すぎるツール権限、機密アカウントにログイン済みのブラウザプロファイルは解決しません。次を主要な制御策として扱ってください: Gateway を非公開または認証済みに保つ、DM/グループにペアリングと許可リストを使用する、信頼できない入力に対してリスクの高いツールを拒否またはサンドボックス化する、信頼できる Plugin と Skill のみをインストールする、設定変更後に `openclaw security audit --deep` を実行する。

    詳細: [セキュリティ](/ja-JP/gateway/security)、[サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="公開された OpenClaw インスタンスに関する報告を見ました。何を確認すればよいですか？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    より安全なベースライン: Gateway が `loopback` にバインドされているか、認証済みのプライベートアクセス（tailnet、SSH トンネル、トークン/パスワード認証、または正しく設定された信頼済みプロキシ）経由でのみ公開されていること、DM が `pairing` または `allowlist` モードであること、全メンバーが信頼できる場合を除き、グループが許可リストに登録され、メンション必須になっていること、信頼できないコンテンツを読み取るエージェントでは高リスクのツール（`exec`、`browser`、`gateway`、`cron`）が拒否されているか、厳密に範囲制限されていること、ツール実行の影響範囲を縮小する必要がある場合にサンドボックス化が有効になっていることです。

    認証なしの公開バインド、ツールが有効な状態での公開 DM/グループ、公開されたブラウザ制御を最初に修正してください。詳細: [openclaw security audit](/ja-JP/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="ClawHub の Skills と第三者 Plugin は安全にインストールできますか？">
    第三者の Skills と Plugin は、信頼することを選択したコードとして扱ってください。ClawHub の Skill ページではインストール前にスキャン状態が表示されますが、スキャンは完全なセキュリティ境界ではありません。OpenClaw は、Plugin/Skill のインストールまたは更新時に、組み込みのローカル危険コードブロックを実行しません。ローカルでの許可/ブロックの判断には、運用者が管理する `security.installPolicy` を使用してください。

    より安全な方法: 信頼できる作者と固定バージョンを優先し、Skill/Plugin を有効にする前に内容を読み、Plugin/Skill の許可リストを必要最小限に保ち、信頼できない入力を扱うワークフローは最小限のツールを備えたサンドボックス内で実行し、第三者コードに広範なファイルシステム、exec、ブラウザ、シークレットへのアクセスを与えないでください。

    詳細: [Skills](/ja-JP/tools/skills)、[Plugin](/ja-JP/tools/plugin)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボットには専用のメール、GitHub アカウント、電話番号を用意すべきですか？">
    ほとんどの構成では、はい。ボットに別のアカウントと電話番号を使用して分離すると、問題が発生した場合の影響範囲が縮小され、個人アカウントに影響を与えずに認証情報をローテーションしたり、アクセスを取り消したりしやすくなります。

    最小構成から始めてください。実際に必要なツールとアカウントにのみアクセスを許可し、必要に応じて後から拡張してください。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージを自律的に操作させてもよいですか？また、それは安全ですか？">
    個人メッセージに対する完全な自律操作は推奨**しません**。最も安全な方法は、DM を**ペアリングモード**または厳格な許可リストに保ち、ユーザーに代わってメッセージを送信させる場合は**別の番号またはアカウント**を使用し、送信前にユーザーが**承認する**形で下書きを作成させることです。

    試す場合は、専用の隔離されたアカウントで行ってください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使用できますか？">
    はい。エージェントがチャット専用で、入力が信頼できる場合に**限ります**。小規模なモデル層は指示の乗っ取りを受けやすいため、ツール有効のエージェントや信頼できないコンテンツを読み取る場合には避けてください。小規模なモデルを使用する必要がある場合は、ツールを厳格に制限し、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取れませんでした">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、`dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスするには、送信者 ID を許可リストに追加するか、そのアカウントに `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送信しますか？ペアリングはどのように機能しますか？">
    いいえ。WhatsApp のデフォルト DM ポリシーは**ペアリング**です。不明な送信者が受け取るのはペアリングコードだけで、そのメッセージは**処理されません**。OpenClaw は、受信したチャット、またはユーザーが明示的に実行した送信に対してのみ応答します。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプトでは、自分自身の DM を許可するための **許可リスト/所有者** を設定します。これは自動送信には使用されません。個人の WhatsApp 番号では、その番号を使用して `channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「停止しない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージやツールメッセージは、そのセッションで **詳細表示**、**トレース**、または **推論** が有効な場合にのみ表示されます。

    表示されているチャットで次を実行して修正します。

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもメッセージが多い場合は、Control UI でセッション設定を確認し、verbose を **継承** に設定してください。また、設定で `verboseDefault: "on"` が指定されたボットプロファイルを使用していないことを確認してください。

    ドキュメント: [思考と詳細表示](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止またはキャンセルするにはどうすればよいですか？">
    中止をトリガーするには、次のいずれかを **単独のメッセージとして**（スラッシュなしで）送信します: `stop`、`stop action`、`stop current action`、`stop run`、`stop current run`、`stop agent`、`stop the agent`、`stop openclaw`、`openclaw stop`、`stop don't do anything`、`stop do not do anything`、`stop doing anything`、`do not do that`、`please stop`、`stop please`、`abort`、`esc`、`exit`、`interrupt`、`halt`。英語以外の一般的なトリガー（フランス語、ドイツ語、スペイン語、中国語、日本語、ヒンディー語、アラビア語、ロシア語）も機能します。

    exec ツールによって開始されたバックグラウンドプロセスについては、エージェントに次を実行するよう依頼してください。

    ```text
    process action:kill sessionId:XXX
    ```

    ほとんどのスラッシュコマンドは、`/` で始まる **単独の** メッセージとして送信する必要がありますが、一部のショートカット（`/status` など）は、許可リストに登録された送信者であればインラインでも機能します。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送信するにはどうすればよいですか？（「クロスコンテキストメッセージングが拒否されました」）'>
    OpenClaw はデフォルトで **プロバイダー間** のメッセージングをブロックします。ツール呼び出しが Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。この設定は即時に反映され、Gateway の再起動は不要です。

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
    デフォルトでは、実行途中のプロンプトはアクティブな実行へ誘導されます。`/queue` を使用して、アクティブな実行中の動作を選択します。

    - `steer`（デフォルト）- 次のモデル境界でアクティブな実行を誘導します。
    - `followup` - メッセージをキューに入れ、現在の実行終了後に 1 件ずつ実行します。
    - `collect` - 互換性のあるメッセージをキューに入れ、現在の実行終了後に 1 回だけ応答します。
    - `interrupt` - 現在の実行を中止し、新しく開始します。

    `debounce:0.5s cap:25 drop:summarize` のように、キューモードへオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)および[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使用する場合の Anthropic のデフォルトモデルは何ですか？'>
    認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または認証プロファイルに Anthropic API キーを保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです（たとえば `anthropic/claude-sonnet-4-6` または `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` は、実行中のエージェントについて想定される `auth-profiles.json` で Anthropic の認証情報を Gateway が見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

それでも解決しない場合は、[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions)を開始してください。

## 関連項目

- [初回実行 FAQ](/ja-JP/help/faq-first-run) - インストール、オンボーディング、認証、サブスクリプション、初期段階の障害
- [モデル FAQ](/ja-JP/help/faq-models) - モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) - 症状を起点としたトリアージ
