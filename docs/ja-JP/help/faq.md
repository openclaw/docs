---
read_when:
    - セットアップ、インストール、オンボーディング、またはランタイムサポートに関するよくある質問への回答
    - 詳細なデバッグの前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-07-03T13:17:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

クイック回答に加えて、実際のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのより深いトラブルシューティングをまとめています。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル概要: OS + 更新、gateway/service の到達性、agents/sessions、provider config + runtime issues（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは伏せられます）。

3. **Daemon + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor runtime と RPC 到達性、プローブ対象 URL、service が使った可能性が高い config を表示します。

4. **深いプローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合は channel プローブを含む、ライブ gateway ヘルスプローブを実行します
   （到達可能な gateway が必要です）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追尾する**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックしてください。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログは service ログとは別です。[Logging](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行する（修復）**

   ```bash
   openclaw doctor
   ```

   config/state を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + config path を表示します
   ```

   実行中の gateway に完全なスナップショットを問い合わせます（WS のみ）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回実行の Q&A（インストール、オンボーディング、auth routes、subscriptions、初期エラー）は
[初回実行 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw とは、ひとことで言うと何ですか？">
    OpenClaw は、自分のデバイス上で実行する個人用 AI アシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱 channel plugins）で返信でき、サポートされているプラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。すでに使っているチャットアプリから到達できる、
    **自分のハードウェア**上で高機能なアシスタントを実行できる **local-first コントロールプレーン**です。
    stateful sessions、memory、tools を備え、ワークフローの制御をホスト型
    SaaS に渡さずに使えます。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を任意の場所（Mac、Linux、VPS）で実行し、
      workspace + session history をローカルに保持します。
    - **Web サンドボックスではなく実際のチャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、
      サポートされているプラットフォームでモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェント単位のルーティング
      とフェイルオーバーで利用できます。
    - **ローカルのみの選択肢:** 必要に応じてローカルモデルを実行し、**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** channel、account、task ごとに個別のエージェントを分け、
      それぞれ専用の workspace とデフォルトを持たせられます。
    - **オープンソースでハック可能:** ベンダーロックインなしで、調査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[Channels](/ja-JP/channels)、[Multi-agent](/ja-JP/concepts/multi-agent)、
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトに適した例:

    - Web サイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリをプロトタイプする（アウトライン、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分け、
    並列作業には sub agents を使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    日常的な成果はたいてい次のようなものです。

    - **個人向けブリーフィング:** inbox、calendar、関心のあるニュースの要約。
    - **リサーチと下書き:** メールやドキュメント向けのクイックリサーチ、要約、初稿。
    - **リマインダーとフォローアップ:** cron または heartbeat 駆動の促しとチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携:** phone からタスクを送り、Gateway に server 上で実行させ、結果を chat で受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **リサーチ、選別、下書き**には役立ちます。サイトをスキャンし、候補リストを作成し、
    prospects を要約し、outreach や広告コピーの draft を書けます。

    **outreach や ad runs** では、人間をループに入れてください。スパムを避け、現地法と
    プラットフォームポリシーに従い、送信前に必ずレビューしてください。最も安全なパターンは、
    OpenClaw に下書きさせ、自分が承認することです。

    ドキュメント: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人用アシスタント**であり、調整レイヤーです。IDE の代替ではありません。repo 内で最速の直接コーディングループには
    Claude Code または Codex を使ってください。永続的な memory、デバイス横断アクセス、tool orchestration が必要なときに OpenClaw を使います。

    利点:

    - session をまたぐ **永続 memory + workspace**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **Tool orchestration**（browser、files、scheduling、hooks）
    - **常時稼働 Gateway**（VPS で実行し、どこからでも操作）
    - ローカル browser/screen/camera/exec 用の **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="repo を dirty にせずに skills をカスタマイズするには？">
    repo copy を編集する代わりに managed overrides を使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` で folder を追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` なので、managed overrides は git に触れずに bundled skills より優先されます。skill をグローバルにインストールする必要があるが、一部の agents にだけ表示したい場合は、共有 copy を `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。repo に置いて PR として出すべきなのは、upstream に入れる価値がある編集だけです。
  </Accordion>

  <Accordion title="カスタムフォルダーから skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次の session でそれを `<workspace>/skills` として扱います。skill を特定の agents にだけ表示したい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルや設定を使うには？">
    現在サポートされているパターンは次のとおりです。

    - **Cron jobs**: 隔離された jobs は job ごとに `model` override を設定できます。
    - **Agents**: 異なる default models、thinking levels、stream params を持つ個別の agents にタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使うと、現在の session model をいつでも切り替えられます。

    たとえば、同じモデルを異なるエージェント単位設定で使います。

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

    共有のモデル単位デフォルトは `agents.defaults.models["provider/model"].params` に置き、エージェント固有の overrides はフラットな `agents.list[].params` に置きます。同じモデルに対して個別のネストされた `agents.list[].models["provider/model"].params` entries を定義しないでください。`agents.list[].models` は、エージェント単位の model catalog と runtime overrides 用です。

    [Cron jobs](/ja-JP/automation/cron-jobs)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Configuration](/ja-JP/gateway/config-agents)、[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中に bot が固まります。どうやってオフロードできますか？">
    長いタスクや並列タスクには **sub-agents** を使ってください。Sub-agents は専用の session で実行され、
    summary を返し、メインの chat の応答性を保ちます。

    bot に「spawn a sub-agent for this task」と頼むか、`/subagents` を使います。
    chat で `/status` を使うと、Gateway が現在何をしているか（そして busy かどうか）を確認できます。

    トークンのヒント: 長いタスクと sub-agents はどちらも tokens を消費します。cost が気になる場合は、
    `agents.defaults.subagents.model` で sub-agents 用に安価なモデルを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents)、[Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord で thread-bound subagent sessions はどのように動作しますか？">
    thread bindings を使います。Discord thread を subagent または session target に bind すると、その thread の follow-up messages がその bound session に留まります。

    基本フロー:

    - `thread: true` を使って `sessions_spawn` で spawn します（永続的な follow-up には任意で `mode: "session"`）。
    - または `/focus <target>` で手動 bind します。
    - `/agents` で binding state を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で auto-unfocus を制御します。
    - `/unfocus` で thread を切り離します。

    必須 config:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord overrides: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - spawn 時の auto-bind: `channels.discord.threadBindings.spawnSessions` はデフォルトで `true` です。thread-bound session spawns を無効にするには `false` に設定します。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[Configuration Reference](/ja-JP/gateway/configuration-reference)、[Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagent は完了しましたが、完了 update が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決された requester route を確認してください。

    - Completion-mode subagent delivery は、bound thread または conversation route が存在する場合はそれを優先します。
    - completion origin が channel だけを持つ場合、OpenClaw は requester session の保存済み route（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、direct delivery は引き続き成功できます。
    - bound route も使用可能な stored route も存在しない場合、direct delivery は失敗する可能性があり、結果は chat に即時投稿される代わりに queued session delivery にフォールバックします。
    - 無効または stale な targets は、それでも queue fallback または final delivery failure を強制する場合があります。
    - child の最後に表示された assistant reply が正確に silent token `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` である場合、OpenClaw は古い earlier progress を投稿する代わりに、意図的に announce を抑制します。
    - Tool/toolResult output は child result text に昇格されません。結果は child の latest visible assistant reply です。

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks), [セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cronまたはリマインダーが実行されません。何を確認すべきですか？">
    CronはGatewayプロセス内で実行されます。Gatewayが継続的に稼働していない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cronが有効 (`cron.enabled`) で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gatewayが24時間365日稼働していることを確認します（スリープや再起動がないこと）。
    - ジョブのタイムゾーン設定を確認します（`--tz` とホストのタイムゾーン）。

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cronジョブ](/ja-JP/automation/cron-jobs), [自動化](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cronは実行されましたが、チャネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認します:

    - `--no-deliver` / `delivery.mode: "none"` は、runnerのフォールバック送信が想定されないことを意味します。
    - announceターゲット (`channel` / `to`) がない、または無効な場合、runnerはアウトバウンド配信をスキップします。
    - チャネル認証エラー (`unauthorized`, `Forbidden`) は、runnerが配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は、意図的に配信不可として扱われるため、runnerはキュー済みフォールバック配信も抑制します。

    分離Cronジョブでは、チャットルートが利用可能な場合、エージェントは`message`
    ツールで直接送信できます。`--announce` は、エージェントがすでに送信していない最終テキストに対するrunnerの
    フォールバックパスだけを制御します。

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cronジョブ](/ja-JP/automation/cron-jobs), [バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離Cron実行がモデルを切り替えたり、1回再試行したりしたのはなぜですか？">
    それは通常、重複スケジューリングではなく、ライブモデル切り替えパスです。

    分離Cronは、アクティブな実行が`LiveSessionModelSwitchError`をスローした場合に、ランタイムモデルのハンドオフを永続化し、再試行できます。
    再試行では切り替え後の
    プロバイダー/モデルを維持し、切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合、Cronは
    再試行前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmailフックのモデルオーバーライドが最初に優先されます。
    - 次にジョブごとの`model`。
    - 次に保存済みのCronセッションモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    再試行ループには上限があります。初回試行に加えて2回の切り替え再試行後、
    Cronは無限ループせずに中止します。

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cronジョブ](/ja-JP/automation/cron-jobs), [cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="LinuxでSkillsをインストールするにはどうすればよいですか？">
    ネイティブの`openclaw skills`コマンドを使用するか、ワークスペースにSkillsを配置します。macOSのSkills UIはLinuxでは利用できません。
    Skillsは[https://clawhub.ai](https://clawhub.ai)で閲覧できます。

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

    ネイティブの`openclaw skills install`は、デフォルトでアクティブなワークスペースの`skills/`
    ディレクトリに書き込みます。`--global` を追加すると、すべてのローカルエージェント向けの共有管理
    Skillsディレクトリにインストールします。自分のSkillsを公開または同期したい場合にのみ、別個の`clawhub` CLIを
    インストールしてください。共有Skillsを参照できるエージェントを絞りたい場合は、
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClawはタスクをスケジュール実行したり、バックグラウンドで継続実行したりできますか？">
    はい。Gatewayスケジューラーを使用します:

    - スケジュール済みまたは反復タスクには**Cronジョブ**（再起動後も永続化）。
    - 「メインセッション」の定期チェックには**Heartbeat**。
    - 要約を投稿したりチャットに配信したりする自律エージェントには**分離ジョブ**。

    ドキュメント: [Cronジョブ](/ja-JP/automation/cron-jobs), [自動化](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="LinuxからApple macOS専用Skillsを実行できますか？">
    直接はできません。macOS Skillsは`metadata.openclaw.os`と必要なバイナリで制御され、Skillsは**Gatewayホスト**上で利用可能な場合にのみシステムプロンプトに表示されます。Linuxでは、ゲート制御をオーバーライドしない限り、`darwin`専用Skills（`apple-notes`, `apple-reminders`, `things-mac`など）は読み込まれません。

    サポートされるパターンは3つあります:

    **オプションA - MacでGatewayを実行する（最も簡単）。**
    macOSバイナリが存在する場所でGatewayを実行し、その後Linuxから[リモートモード](#gateway-ports-already-running-and-remote-mode)またはTailscale経由で接続します。GatewayホストがmacOSであるため、Skillsは通常どおり読み込まれます。

    **オプションB - macOSノードを使用する（SSHなし）。**
    LinuxでGatewayを実行し、macOSノード（メニューバーアプリ）をペアリングして、Macで**Node Run Commands**を「Always Ask」または「Always Allow」に設定します。必要なバイナリがノード上に存在する場合、OpenClawはmacOS専用Skillsを利用可能として扱えます。エージェントは`nodes`ツール経由でそれらのSkillsを実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプションC - SSH経由でmacOSバイナリをプロキシする（高度）。**
    GatewayはLinux上に置いたまま、必要なCLIバイナリがMac上で実行されるSSHラッパーとして解決されるようにします。その後、SkillをオーバーライドしてLinuxを許可し、利用可能な状態を保ちます。

    1. バイナリ用のSSHラッパーを作成します（例: Apple Notes向けの`memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linuxホスト上の`PATH`にラッパーを置きます（例: `~/bin/memo`）。
    3. Skillメタデータ（ワークスペースまたは`~/.openclaw/skills`）をオーバーライドしてLinuxを許可します:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skillsスナップショットが更新されるよう、新しいセッションを開始します。

  </Accordion>

  <Accordion title="NotionまたはHeyGen連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタムSkill / Plugin:** 信頼性の高いAPIアクセスに最適です（Notion/HeyGenはいずれもAPIがあります）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（エージェンシーのワークフロー）、単純なパターンは次のとおりです:

    - クライアントごとに1つのNotionページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、それらのAPIを対象にしたSkillを
    作成してください。

    Skillsをインストールする:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの`skills/`ディレクトリに配置されます。すべてのローカルエージェントで共有するSkillsには、`openclaw skills install @owner/<skill-slug> --global`を使用します（または`~/.openclaw/skills/<name>/SKILL.md`に手動で配置します）。一部のエージェントだけに共有インストールを見せたい場合は、`agents.defaults.skills`または`agents.list[].skills`を設定します。一部のSkillsはHomebrew経由でインストールされたバイナリを想定しています。Linuxでは、これはLinuxbrewを意味します（上記のHomebrew Linux FAQ項目を参照）。[Skills](/ja-JP/tools/skills), [Skills設定](/ja-JP/tools/skills-config), [ClawHub](/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済みChromeをOpenClawで使うにはどうすればよいですか？">
    Chrome DevTools MCP経由で接続する組み込みの`user`ブラウザープロファイルを使用します:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使いたい場合は、明示的なMCPプロファイルを作成します:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    このパスでは、ローカルホストのブラウザーまたは接続済みブラウザーノードを使用できます。Gatewayが別の場所で実行されている場合は、ブラウザーマシンでノードホストを実行するか、代わりにリモートCDPを使用します。

    `existing-session` / `user` の現在の制限:

    - アクションはref駆動であり、CSSセレクター駆動ではありません
    - アップロードには`ref` / `inputRef`が必要で、現在は一度に1ファイルをサポートします
    - `responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションには、引き続き管理ブラウザーまたはraw CDPプロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker固有のセットアップ（Docker内の完全なGatewayまたはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Dockerに制限があるように感じます - 完全な機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node`ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドルされたブラウザーは含まれません。より完全なセットアップには:

    - キャッシュが保持されるよう、`OPENCLAW_HOME_VOLUME`で`/home/node`を永続化します。
    - `OPENCLAW_IMAGE_APT_PACKAGES`でシステム依存関係をイメージに組み込みます。
    - バンドルされたCLI経由でPlaywrightブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`を設定し、そのパスが永続化されることを確認します。

    ドキュメント: [Docker](/ja-JP/install/docker), [ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1つのエージェントでDMは個人用のまま、グループを公開/サンドボックス化できますか？">
    はい。プライベートトラフィックが**DM**で、公開トラフィックが**グループ**の場合です。

    `agents.defaults.sandbox.mode: "non-main"`を使用すると、グループ/チャネルセッション（非メインキー）は設定されたサンドボックスバックエンドで実行され、メインDMセッションはホスト上に残ります。バックエンドを選択しない場合、Dockerがデフォルトです。その後、`tools.sandbox.tools`でサンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds`を`["host:path:mode"]`に設定します（例: `"/home/user/src:/src:ro"`）。グローバルとエージェントごとのbindはマージされます。`scope: "shared"`の場合、エージェントごとのbindは無視されます。機密性の高いものには`:ro`を使用し、bindはサンドボックスのファイルシステム境界を迂回することを覚えておいてください。

    OpenClawは、正規化されたパスと、最も深い既存祖先を通じて解決された正規パスの両方に対してbindソースを検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出はフェイルクローズになり、シンボリックリンク解決後も許可ルートのチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)と[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClawのメモリは、エージェントワークスペース内のMarkdownファイルです:

    - `memory/YYYY-MM-DD.md`の日次ノート
    - `MEMORY.md`のキュレーション済み長期ノート（メイン/プライベートセッションのみ）

    OpenClawはまた、**サイレントなCompaction前メモリフラッシュ**を実行し、自動Compactionの前に
    永続的なノートを書くようモデルに促します。これはワークスペースが書き込み可能な場合にのみ実行されます
    （読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="Memory が物事を忘れ続けます。どうすれば定着させられますか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期的なメモは `MEMORY.md` に、
    短期的なコンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。モデルにメモリを保存するよう思い出させると効果があります。
    モデルは何をすべきか理解します。それでも忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory)、[Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、
    ストレージです。**セッションコンテキスト**は引き続きモデルのコンテキストウィンドウによって
    制限されるため、長い会話は compact または切り捨てられることがあります。そのため
    メモリ検索があります。関連する部分だけをコンテキストに戻します。

    ドキュメント: [Memory](/ja-JP/concepts/memory)、[Context](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使用する場合のみ必要です。Codex OAuth はチャット/補完を対象としており、
    embeddings へのアクセスは**付与しません**。そのため、**Codex でサインインしても（OAuth または
    Codex CLI ログイン）**セマンティックメモリ検索には役立ちません。OpenAI embeddings には
    引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は OpenAI embeddings を使用します。まだ
    `memorySearch.provider = "auto"` と記載されているレガシー設定も OpenAI に解決されます。
    OpenAI API キーが利用できない場合、キーを設定するか別のプロバイダーを明示的に選択するまで、
    セマンティックメモリ検索は利用できません。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"` を設定してください（任意で
    `memorySearch.fallback = "none"` も設定できます）。Gemini embeddings を使用したい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。**OpenAI、OpenAI 互換、Gemini、
    Voyage、Mistral、Bedrock、Ollama、LM Studio、GitHub Copilot、DeepInfra、またはローカル**
    の embedding モデルをサポートしています。設定の詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使用されるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き表示されます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上
      （`~/.openclaw` + ワークスペースディレクトリ）にあります。
    - **必要上リモート:** モデルプロバイダー（Anthropic/OpenAI など）に送信するメッセージは
      その API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      それぞれのサーバーに保存します。
    - **フットプリントは制御できます:** ローカルモデルを使用するとプロンプトは自分のマシン上に留まりますが、
      チャネルの通信は引き続きチャネルのサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）:

    | パス                                                            | 目的                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）       |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー向けの任意のファイル backed secret ペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリはスクラブ済み）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                            |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が起動のたびに同じ
    ワークスペースを使用していることを確認してください（そして注意: リモートモードでは
    ローカルのノートPCではなく、**gateway ホストの**ワークスペースを使用します）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、ボットにそれを
    **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="SOUL.md を大きくできますか？">
    はい。`SOUL.md` は、エージェントコンテキストに注入されるワークスペースブートストラップファイルの
    1 つです。デフォルトのファイルごとの注入制限は `20000` 文字で、
    ファイル全体の合計ブートストラップ予算は `60000` 文字です。

    OpenClaw 設定で共有デフォルトを変更します:

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

    または 1 つのエージェントを上書きします:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    raw サイズと注入後サイズ、切り捨てが発生したかどうかを確認するには `/context` を使用してください。
    `SOUL.md` は声、姿勢、人格に絞り、運用ルールは
    `AGENTS.md` に、永続的な事実はメモリに入れてください。

    [Context](/ja-JP/concepts/context) と [Agent config](/ja-JP/gateway/config-agents) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**非公開** git リポジトリに置き、非公開の場所
    （例: GitHub private）にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化された secrets ペイロード）は
    **コミットしないでください**。
    完全な復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上記の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルトの cwd**でありメモリの基点ですが、厳格なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスで他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使用してください。リポジトリをデフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。
    エージェントにその中で作業させる意図がない限り、ワークスペースは分けてください。

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

  <Accordion title="リモートモード: セッションストアはどこですか？">
    セッション状態は**gateway ホスト**が所有します。リモートモードの場合、注目すべきセッションストアはローカルのノートPCではなく、リモートマシン上にあります。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から任意の **JSON5** 設定を読み取ります（デフォルト: `~/.openclaw/openclaw.json`）:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` のデフォルトワークスペースを含む）を使用します。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら何も listen しない / UI が unauthorized と表示します'>
    非ループバック bind には**有効な gateway 認証パスが必要です**。実際には次を意味します:

    - 共有シークレット認証: トークンまたはパスワード
    - 正しく設定された ID 対応リバースプロキシ背後の `gateway.auth.mode: "trusted-proxy"`

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
    - ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合のみ `gateway.remote.*` をフォールバックとして使用できます。
    - パスワード認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は fail closed します（リモートフォールバックによる隠蔽はありません）。
    - 共有シークレットの Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような ID を伴うモードは、代わりにリクエストヘッダーを使用します。共有シークレットを URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストのループバックリバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内のループバックエントリが必要です。

  </Accordion>

  <Accordion title="なぜ今 localhost でトークンが必要なのですか？">
    OpenClaw はループバックを含め、デフォルトで Gateway 認証を強制します。通常のデフォルトパスでは、これはトークン認証を意味します。明示的な認証パスが設定されていない場合、Gateway 起動時にトークンモードへ解決され、その起動用のランタイム限定トークンが生成されるため、**ローカル WS クライアントは認証が必要です**。クライアントが再起動をまたいで安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを使いたい場合は、password モード（または identity-aware なリバースプロキシ向けに `trusted-proxy`）を明示的に選択できます。open loopback が**本当に**必要な場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="設定を変更した後に再起動は必要ですか？">
    Gateway は設定を監視し、ホットリロードに対応しています。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動する
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="CLI の面白いタグラインを無効にするには？">
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

    - `off`: タグラインのテキストを非表示にしますが、バナーのタイトル/バージョン行は残します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使用します。
    - `random`: 面白い/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナーを一切表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="web search（および web fetch）を有効にするには？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します。

    - Brave、Exa、Firecrawl、Gemini、Kimi、MiniMax Search、Perplexity、Tavily などの API ベースのプロバイダーでは、通常の API キー設定が必要です。
    - Grok はモデル認証の xAI OAuth を再利用できます。なければ `XAI_API_KEY` / Plugin の web-search 設定にフォールバックします。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使用し、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定します。

    **推奨:** `openclaw configure --section web` を実行し、プロバイダーを選択します。
    環境変数での代替設定:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth、`XAI_API_KEY`
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

    プロバイダー固有の web-search 設定は現在 `plugins.entries.<plugin>.config.webSearch.*` に置かれます。
    従来の `tools.web.search.*` プロバイダーパスも互換性のため一時的に読み込まれますが、新しい設定では使用しないでください。
    Firecrawl web-fetch フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` に置かれます。

    注記:

    - allowlist を使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` が省略されている場合、OpenClaw は利用可能な認証情報から最初に準備できた fetch フォールバックプロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply で設定が消えました。どう復旧し、どう避ければよいですか？">
    `config.apply` は**設定全体**を置き換えます。部分オブジェクトを送ると、それ以外はすべて
    削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway は fail closed するかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担当し、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、最後に正常だった設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - アクティブな設定の隣にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - 予期しない事象だった場合は、バグを報告し、最後に把握している設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントなら、ログや履歴から動作する設定を再構築できることがよくあります。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。ドリルダウン用に、浅いスキーマノードと直下の子要素サマリーを返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は完全な設定置換のみに使用します。
    - エージェント実行からエージェント向けの `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護対象 exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定ウィザード](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="複数デバイスにまたがる専用ワーカーで中央 Gateway を実行するには？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **ノード** と **エージェント** を組み合わせる構成です。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner ops」、「Personal data」）向けの別々の頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要なときに、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [ノード](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザーは headless で実行できますか？">
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

    デフォルトは `false`（headful）です。Headless は一部のサイトで anti-bot チェックを誘発しやすくなります。[ブラウザー](/ja-JP/tools/browser) を参照してください。

    Headless は**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚確認が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトは headless モードでの自動化により厳格です（CAPTCHA、anti-bot）。
      たとえば、X/Twitter は headless セッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うには？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースブラウザー）に設定し、Gateway を再起動します。
    詳細な設定例は [ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="コマンドは Telegram、gateway、ノードの間でどのように伝播しますか？">
    Telegram メッセージは **gateway** によって処理されます。gateway はエージェントを実行し、
    ノードツールが必要になったときにだけ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → エージェント → `node.*` → ノード → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントはどうやって自分のコンピューターにアクセスできますか？">
    短く言うと、**コンピューターをノードとしてペアリング**します。Gateway は別の場所で実行されますが、
    Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    典型的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達可能であることを確認します（tailnet bind または SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS ノードをペアリングすると、そのマシン上で `system.run` が可能になります。信頼するデバイスだけを
    ペアリングし、[セキュリティ](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが返信がありません。次に何を確認しますか？">
    基本事項を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway のヘルス: `openclaw status`
    - チャンネルのヘルス: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認します。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士（ローカル + VPS）で通信できますか？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます。

    **最も簡単:** 両方の bot がアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送り、Bot B には通常どおり返信させます。

    **CLI ブリッジ（汎用）:** `openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行し、
    もう一方の bot が待ち受けているチャットを対象にします。一方の bot がリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます
    （[リモートアクセス](/ja-JP/gateway/remote) を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つの bot が無限ループしないようにガードレールを追加します（mention-only、チャンネル
    allowlist、または「bot メッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS は必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストできます。各エージェントは独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップであり、エージェントごとに 1 台の VPS を実行するよりはるかに安価で簡単です。

    強い分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定が必要な場合にだけ、別々の VPS を使用してください。それ以外は 1 つの Gateway にまとめ、
    複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="個人用ノートパソコンでノードを使うことには、VPS から SSH する代わりになる利点がありますか？">
    はい - ノードはリモート Gateway からノートパソコンへ到達するための第一級の方法であり、
    シェルアクセス以上のことを可能にします。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスのマシンで十分です。4 GB RAM で十分余裕があります）。そのため、一般的な
    セットアップは常時稼働ホストに加え、ノートパソコンをノードとして使う構成です。

    - **インバウンド SSH は不要です。** ノードは Gateway WebSocket へ外向きに接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run` は、そのノートパソコン上のノード許可リスト/承認で制御されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS に置いたまま、ノートパソコン上のノードホスト経由で Chrome をローカル実行したり、Chrome MCP 経由でホスト上のローカル Chrome に接続したりできます。

    一時的なシェルアクセスには SSH で十分ですが、継続的なエージェントワークフローと
    デバイス自動化にはノードのほうがシンプルです。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き、ホストごとに実行する **gateway** は 1 つだけにしてください（[複数の gateway](/ja-JP/gateway/multiple-gateways) を参照）。ノードは gateway に接続する周辺デバイスです（iOS/Android ノード、またはメニューバーアプリの macOS 「ノードモード」）。ヘッドレスノード
    ホストと CLI 制御については、[ノードホスト CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、ホストされた Plugin サーフェスの変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子要素サマリーとともに確認します
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 設定全体を検証 + 置換します。可能な場合はホットリロードし、必要な場合は再起動します
    - エージェント向けの `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。レガシーの `tools.bash.*` エイリアスは同じ保護された exec パスへ正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これによりワークスペースを設定し、誰がボットを起動できるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定し、Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストール + ログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効化（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効化し、VPS に安定した名前を持たせます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使います。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway はループバックにバインドされたままになり、Tailscale 経由で HTTPS を公開します。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）へ接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **macOS アプリをリモートモードで使います**（SSH ターゲットには tailnet ホスト名を指定できます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. gateway で**ノードを承認**します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノートパソコンにインストールすべきですか、それともノードを追加するだけでよいですか？">
    2 台目のノートパソコンで **ローカルツール**（screen/camera/exec）だけが必要な場合は、
    **ノード**として追加してください。これにより単一の Gateway を維持でき、設定の重複を避けられます。ローカルノードツールは
    現在 macOS のみですが、他の OS にも拡張する予定です。

    2 つ目の Gateway をインストールするのは、**強い分離**または完全に別々の 2 つのボットが必要な場合だけです。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env 読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（シェル、launchd/systemd、CI など）から環境変数を読み取り、さらに次を読み込みます。

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。
    プロバイダー認証情報の変数は、ワークスペース `.env` の例外です。
    `GEMINI_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY` などのキーは、ワークスペース
    `.env` からは無視され、プロセス環境、`~/.openclaw/.env`、または設定の `env` に置く必要があります。

    設定内にインライン環境変数を定義することもできます（プロセス環境にない場合にのみ適用されます）。

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

  <Accordion title="サービス経由で Gateway を開始したところ、環境変数が消えました。どうすればよいですか？">
    よくある修正は 2 つです。

    1. 不足しているキーを `~/.openclaw/.env` に置き、サービスがシェル環境を継承しない場合でも取得されるようにします。
    2. シェルインポートを有効化します（オプトインの利便機能）。

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

    これはログインシェルを実行し、不足している想定キーだけをインポートします（上書きはしません）。環境変数の同等設定:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は、**シェル環境インポート**が有効かどうかを報告します。"Shell env: off"
    は、環境変数が不足しているという意味では**ありません**。OpenClaw がログインシェルを自動で読み込まない、というだけです。

    Gateway がサービス（launchd/systemd）として動作している場合、シェル
    環境は継承されません。次のいずれかで修正してください。

    1. トークンを `~/.openclaw/.env` に置きます。

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または、シェルインポートを有効化します（`env.shellEnv.enabled: true`）。
    3. または、設定の `env` ブロックに追加します（不足している場合にのみ適用されます）。

    その後 gateway を再起動して再確認します。

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み込まれます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    `/new` または `/reset` を単独メッセージとして送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動でリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルト **0**）。
    アイドル期限切れを有効化するには、正の値に設定します。有効な場合、アイドル期間後の**次の**
    メッセージで、そのチャットキーに対して新しいセッション ID が開始されます。
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
    はい、**マルチエージェントルーティング**と**サブエージェント**で可能です。1 つのコーディネーター
    エージェントと、独自のワークスペースおよびモデルを持つ複数のワーカーエージェントを作成できます。

    ただし、これは**楽しい実験**として見るのが最適です。トークン消費が大きく、多くの場合、
    別々のセッションを持つ 1 つのボットを使うより効率が落ちます。私たちが想定している典型的なモデルは、
    会話相手となる 1 つのボットに、並行作業用の異なるセッションを持たせる形です。その
    ボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスク中にコンテキストが切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    セッションコンテキストはモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルにより、Compaction や切り詰めが発生することがあります。

    役立つこと:

    - 現在の状態を要約してファイルに書き込むようボットに依頼します。
    - 長いタスクの前に `/compact` を使い、トピックを切り替えるときは `/new` を使います。
    - 重要なコンテキストはワークスペースに置き、ボットに読み返すよう依頼します。
    - 長い作業や並行作業にはサブエージェントを使い、メインチャットを小さく保ちます。
    - これが頻繁に起きる場合は、より大きなコンテキストウィンドウを持つモデルを選びます。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    reset コマンドを使います。

    ```bash
    openclaw reset
    ```

    非対話型の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します。

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - 既存の設定が見つかった場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各状態ディレクトリをリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発用設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます - リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使います。

    - **Compact**（会話を保持しつつ、古いターンを要約します）:

      ```
      /compact
      ```

      または、要約の方針を指定するために `/compact <instructions>` を使います。

    - **リセット**（同じチャットキーに対する新しいセッション ID）:

      ```
      /new
      /reset
      ```

    これが続く場合:

    - 古いツール出力を削減するため、**セッション pruning**（`agents.defaults.contextPruning`）を有効化または調整します。
    - より大きなコンテキストウィンドウを持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」が表示されるのはなぜですか？'>
    これはプロバイダー検証エラーです。モデルが必須の `input` なしで `tool_use` ブロックを出力しました。
    通常、セッション履歴が古いか破損していることを意味します（長いスレッドや
    ツール/スキーマ変更の後によく起きます）。

    修正: `/new`（単独メッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="Heartbeat メッセージが 30 分ごとに届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth 認証を使う場合は **1h**）。調整または無効化できます。

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

    `HEARTBEAT.md` が存在していても実質的に空の場合（空行のみ、
    Markdown/HTML コメント、`# Heading` のような Markdown 見出し、フェンスマーカー、
    または空のチェックリストスタブのみ）、OpenClaw は API 呼び出しを節約するために Heartbeat 実行をスキップします。
    ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするかを判断します。

    エージェント単位の上書きには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「bot account」を追加する必要がありますか？'>
    いいえ。OpenClaw は **自分のアカウント** で動作するため、あなたがグループに参加していれば OpenClaw もそれを確認できます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    グループ返信をトリガーできるのを **自分だけ** にしたい場合:

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
    オプション 1（最速）: ログを tail し、グループでテストメッセージを送信します。

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに設定済み/allowlist 済みの場合）: config からグループを一覧表示します。

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[Logs](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります。

    - メンション制御がオンです（デフォルト）。bot を @mention する（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist に入っていません。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションにまとめられます。グループ/チャンネルには独自のセッションキーがあり、Telegram トピック / Discord スレッドは別々のセッションです。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="ワークスペースとエージェントはいくつ作成できますか？">
    厳密な制限はありません。数十（場合によっては数百）でも問題ありませんが、次に注意してください。

    - **ディスク増加:** セッション + トランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下にあります。
    - **トークンコスト:** エージェントが増えるほど、同時に使われるモデルも増えます。
    - **運用負荷:** エージェント単位の認証プロファイル、ワークスペース、チャンネルルーティング。

    ヒント:

    - エージェントごとに **アクティブな** ワークスペースを 1 つに保ちます（`agents.defaults.workspace`）。
    - ディスクが増えた場合は古いセッションを削除します（JSONL またはストアエントリを削除）。
    - 迷子のワークスペースやプロファイル不一致を見つけるには `openclaw doctor` を使います。

  </Accordion>

  <Accordion title="複数の bot やチャットを同時に実行できますか（Slack）、またどう設定すればよいですか？">
    はい。**Multi-Agent Routing** を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャンネル/アカウント/ピアごとにルーティングできます。Slack はチャンネルとしてサポートされており、特定のエージェントに紐付けられます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。bot 対策、CAPTCHA、MFA により
    自動化がブロックされることがあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザーを実行しているマシン上で CDP を使います。

    ベストプラクティスのセットアップ:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに 1 つのエージェント（bindings）。
    - Slack チャンネルをそれらのエージェントに紐付ける。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、
    [Browser](/ja-JP/tools/browser)、[Nodes](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A（デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル）は
[Models FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、hooks など）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" なのに "Connectivity probe: failed" と表示するのはなぜですか？'>
    "running" は **supervisor** 側の見方（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に gateway WebSocket に接続するものです。

    `openclaw gateway status` を使い、次の行を信頼してください。

    - `Probe target:`（プローブが実際に使った URL）
    - `Listening:`（ポートで実際に bind されているもの）
    - `Last gateway error:`（プロセスは生きているがポートが listen していない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    ある config ファイルを編集している一方で、サービスは別の config を使って実行されています（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境からこれを実行します。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" は何を意味しますか？'>
    OpenClaw は起動時に WebSocket リスナーを即座に bind することでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。bind が `EADDRINUSE` で失敗すると、別のインスタンスがすでに listen していることを示す `GatewayLockError` を投げます。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するには？">
    `gateway.mode: "remote"` を設定し、共有シークレットのリモート資格情報を必要に応じて付けて、リモート WebSocket URL を指定します。

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

    - `openclaw gateway` は `gateway.mode` が `local` の場合（または上書きフラグを渡した場合）にのみ起動します。
    - macOS アプリは config ファイルを監視し、これらの値が変わると live にモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート資格情報のみです。それ自体ではローカル Gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI が "unauthorized" と表示します（または再接続を繰り返します）。どうすればよいですか？'>
    Gateway の認証パスと UI の認証方法が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザータブセッションと選択された Gateway URL のためにトークンを `sessionStorage` に保持するため、同じタブでの更新は長期永続の localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返した場合、信頼されたクライアントはキャッシュされたデバイストークンで 1 回の限定再試行を試みられます。
    - そのキャッシュ済みトークンの再試行は、デバイストークンと一緒に保存されたキャッシュ済み承認スコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを維持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次に bootstrap トークンです。
    - 組み込みの setup-code bootstrap は、`scopes: []` を持つノードデバイストークンに加え、信頼されたモバイルオンボーディング用の限定 operator handoff トークンを返します。operator handoff はセットアップ時のネイティブ設定を読み取れますが、ペアリング変更スコープや `operator.admin` は付与しません。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示 + コピーし、開こうとします。headless の場合は SSH ヒントを表示）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は先にトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効で、Tailscale ID ヘッダーをバイパスする生の loopback/tailnet URL ではなく Serve URL を開いていることを確認します。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、設定済みの identity-aware プロキシ経由でアクセスしていることを確認します。同一ホストの loopback プロキシでは `gateway.auth.trustedProxy.allowLoopback = true` も必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテート/再承認します。
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - その rotate 呼び出しが拒否されたと表示する場合は、次の 2 点を確認してください。
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り **自分自身の** デバイスしかローテートできません
      - 明示的な `--scope` 値は、呼び出し元の現在の operator スコープを超えられません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[Troubleshooting](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [Dashboard](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが bind できず、何も listen しません">
    `tailnet` bind はネットワークインターフェイスから Tailscale IP（100.64.0.0/10）を選びます。そのマシンが Tailscale 上にない（またはインターフェイスが down している）場合、bind 先がありません。

    修正:

    - そのホストで Tailscale を起動します（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注記: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet のみに bind したい場合は `gateway.bind: "tailnet"` を使います。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。複数の Gateway は、冗長性（例: rescue bot）または強い分離が必要な場合にのみ使います。

    可能ですが、分離する必要があります。

    - `OPENCLAW_CONFIG_PATH`（インスタンス単位の config）
    - `OPENCLAW_STATE_DIR`（インスタンス単位の state）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル config に一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイル単位のサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`、legacy `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 は何を意味しますか？'>
    Gateway は **WebSocket サーバー** であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受け取ると、**code 1008**
    （ポリシー違反）で接続を閉じます。

    よくある原因:

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

    プロトコルの詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

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

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルは `gateway-<profile>.log` を使用します。stderr は抑制されます）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するには？">
    Gateway ヘルパーを使用します。

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました - OpenClaw を再起動するには？">
    **Windows のインストールモードは 3 つ**あります。

    **1) Windows Hub ローカルセットアップ:** ネイティブアプリが、ローカルのアプリ所有 WSL Gateway を管理します。

    スタートメニューまたはトレイから **OpenClaw Companion** を開き、
    **Gateway Setup** または Connections タブを使用します。

    **2) 手動 WSL2 Gateway:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入り、再起動します。

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスをインストールしていない場合は、フォアグラウンドで開始します。

    ```bash
    openclaw gateway run
    ```

    **3) ネイティブ Windows CLI/Gateway:** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します。

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行する場合（サービスなし）は、次を使用します。

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows](/ja-JP/platforms/windows)、[Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信が届きません。何を確認すべきですか？">
    まず簡単なヘルスチェックから始めます。

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - モデル認証が **gateway ホスト** に読み込まれていない（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定とログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が起動しており、
    Gateway WebSocket に到達可能であることを確認します。

    ドキュメント: [チャンネル](/ja-JP/channels)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)、[リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」 - 次はどうする？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください。

    1. Gateway は実行中ですか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI は正しいトークンを持っていますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは起動していますか？

    次にログを追跡します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ログとチャンネル状態から始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューのエントリが多すぎます。OpenClaw はすでに Telegram の上限に合わせて切り詰め、コマンド数を減らして再試行しますが、それでも一部のメニューエントリを削除する必要があります。plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS 上にいる場合やプロキシの背後にいる場合は、アウトバウンド HTTPS が許可されており、`api.telegram.org` の DNS が機能することを確認してください。

    Gateway がリモートにある場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず Gateway に到達可能で、エージェントを実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、現在の状態を確認するために `/status` を使います。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    Docs: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これにより、**監視対象サービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで動作している場合に使います。

    フォアグラウンドで実行している場合は Ctrl-C で停止し、その後:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway サービス runbook](/ja-JP/gateway).

  </Accordion>

  <Accordion title="5歳児にもわかる説明: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで gateway を**フォアグラウンド**実行します。

    サービスをインストールしている場合は、gateway コマンドを使います。単発でフォアグラウンド実行したい場合は、
    `openclaw gateway` を使います。

  </Accordion>

  <Accordion title="何かが失敗したときに、より詳細を最速で得る方法">
    より詳細なコンソール情報を得るには、Gateway を `--verbose` 付きで起動します。その後、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分の skill が画像/PDF を生成したが、何も送信されなかった">
    エージェントからの送信添付ファイルは、`media`、`mediaUrl`、`path`、`filePath` などの構造化メディアフィールドを使う必要があります。[OpenClaw アシスタントのセットアップ](/ja-JP/start/openclaw)と[エージェント送信](/ja-JP/tools/agent-send)を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    以下も確認してください:

    - 対象チャンネルが送信メディアをサポートしており、許可リストでブロックされていないこと。
    - ファイルがプロバイダーのサイズ制限内であること（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに制限します。
    - `tools.fs.workspaceOnly=false` は、構造化されたローカルメディア送信で、エージェントがすでに読み取れるホストローカルファイルを使えるようにします。ただし、メディアと安全なドキュメントタイプ（画像、音声、動画、PDF、Office ドキュメント、および Markdown/MD、TXT、JSON、YAML、YML などの検証済みテキストドキュメント）に限られます。これはシークレットスキャナーではありません。拡張機能とコンテンツ検証が一致する場合、エージェントが読み取れる `secret.txt` や `config.json` を添付できます。機密ファイルはエージェントが読み取れるパスの外に置くか、より厳格なローカルパス送信のために `tools.fs.workspaceOnly=true` を維持してください。

    [画像](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています:

    - DM 対応チャンネルでのデフォルト動作は**ペアリング**です:
      - 不明な送信者はペアリングコードを受け取り、ボットはそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルごとに 3 件**に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクのある DM ポリシーを表示するには `openclaw doctor` を実行します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの懸念ですか？">
    いいえ。プロンプトインジェクションは、ボットに DM できる相手だけでなく、**信頼できないコンテンツ**の問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは**送信者が自分だけ**の場合でも発生し得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを外部に漏えいしたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を小さくするには:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効なエージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付抽出はどちらも、生のファイルテキストを渡す代わりに、
      抽出したテキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リスト

    詳細: [セキュリティ](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw は Rust/WASM ではなく TypeScript/Node を使っているため安全性が低いですか？">
    言語とランタイムは重要ですが、個人用エージェントにとって主なリスクではありません。
    OpenClaw の実際的なリスクは、Gateway の公開、誰がボットにメッセージできるか、
    プロンプトインジェクション、ツールの範囲、認証情報の扱い、ブラウザアクセス、exec
    アクセス、サードパーティの skill または Plugin への信頼です。

    Rust と WASM は一部のコードクラスに対してより強い分離を提供できますが、
    プロンプトインジェクション、不適切な許可リスト、公開 Gateway の公開、
    広すぎるツール、または機密アカウントにすでにログイン済みのブラウザプロファイルは解決しません。
    これらを主要な制御として扱ってください:

    - Gateway を非公開または認証付きに保つ
    - DM とグループにはペアリングと許可リストを使う
    - 信頼できない入力に対してはリスクの高いツールを拒否またはサンドボックス化する
    - 信頼できる Plugin と skill だけをインストールする
    - 設定変更後に `openclaw security audit --deep` を実行する

    詳細: [セキュリティ](/ja-JP/gateway/security), [サンドボックス化](/ja-JP/gateway/sandboxing).

  </Accordion>

  <Accordion title="公開された OpenClaw インスタンスに関する報告を見ました。何を確認すべきですか？">
    まず実際のデプロイを確認します:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    より安全なベースラインは次のとおりです:

    - Gateway が `loopback` にバインドされている、または tailnet、SSH トンネル、トークン/パスワード認証、正しく
      設定された信頼済みプロキシなど、認証済みのプライベート
      アクセス経由でのみ公開されている
    - DM が `pairing` または `allowlist` モードである
    - すべてのメンバーが信頼できる場合を除き、グループが許可リスト化され、メンション必須になっている
    - 信頼できないコンテンツを読むエージェントに対して、高リスクツール（`exec`、`browser`、`gateway`、`cron`）が拒否されている、または厳密に
      スコープされている
    - ツール実行で影響範囲を小さくする必要がある場合にサンドボックス化が有効である

    認証なしの公開バインド、ツール付きで開かれた DM/グループ、公開されたブラウザ
    制御は最初に修正すべき検出事項です。詳細:
    [セキュリティ監査チェックリスト](/ja-JP/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="ClawHub skills とサードパーティ Plugin はインストールしても安全ですか？">
    サードパーティの skill と Plugin は、信頼することを選ぶコードとして扱ってください。
    ClawHub の skill ページはインストール前にスキャン状態を表示しますが、スキャンは
    完全なセキュリティ境界ではありません。OpenClaw は Plugin または skill のインストール/更新フロー中に、組み込みのローカル
    危険コードブロックを実行しません。ローカルの許可/ブロック判断には、オペレーター所有の `security.installPolicy` を使ってください。

    より安全なパターン:

    - 信頼できる作者と固定バージョンを優先する
    - 有効化する前に skill または Plugin を読む
    - Plugin と skill の許可リストを狭く保つ
    - 信頼できない入力のワークフローは、最小限のツールを備えたサンドボックスで実行する
    - サードパーティコードに広範なファイルシステム、exec、ブラウザ、シークレットアクセスを与えない

    詳細: [Skills](/ja-JP/tools/skills)、[Plugin](/ja-JP/tools/plugin)、
    [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボットには専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    ほとんどの構成では、はい。ボットを別アカウントや別電話番号で分離すると、
    何か問題が起きた場合の影響範囲を減らせます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたり、アクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントだけにアクセスを許可し、
    必要になったら後で広げます。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えても安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです。

    - DM は**ペアリングモード**または厳格な許可リストに保ちます。
    - 自分の代わりにメッセージを送らせたい場合は、**別の番号またはアカウント**を使います。
    - 下書きを作らせてから、**送信前に承認**します。

    試したい場合は、専用アカウントで行い、分離した状態を保ってください。詳しくは
    [セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="パーソナルアシスタントのタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で、入力が信頼できる場合に**限ります**。小さいティアは
    命令ハイジャックの影響を受けやすいため、ツールが有効なエージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールを厳しく制限し、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードが届きません">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに入れるか、そのアカウントの
    `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどのように動作しますか？">
    いいえ。WhatsApp DM ポリシーのデフォルトは**ペアリング**です。不明な送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClaw は、受信したチャットまたは明示的にトリガーした送信にのみ返信します。

    次でペアリングを承認します。

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: 自分の DM が許可されるように、**許可リスト/所有者**を設定するために使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするには？">
    ほとんどの内部メッセージまたはツールメッセージは、そのセッションで
    **verbose**、**trace**、または**reasoning**が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    まだ出力が多い場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定された
    ボットプロファイルを使っていないことも確認してください。

    ドキュメント: [思考と verbose](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするには？">
    次のいずれかを**単独のメッセージ**として送信します（スラッシュなし）。

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

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

    ほとんどのコマンドは `/` で始まる**単独**のメッセージとして送信する必要がありますが、いくつかのショートカット（`/status` など）は許可リストに含まれる送信者であればインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るには？（「Cross-context messaging denied」）'>
    OpenClaw はデフォルトで**プロバイダー横断**メッセージングをブロックします。ツール呼び出しが
    Telegram に紐付いている場合、明示的に許可しない限り Discord には送信されません。

    エージェントのプロバイダー横断メッセージングを有効にします。

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

    設定を編集した後、gateway を再起動してください。

  </Accordion>

  <Accordion title='ボットが立て続けのメッセージを「無視している」ように感じるのはなぜですか？'>
    実行中のプロンプトは、デフォルトでアクティブな実行へ誘導されます。`/queue` を使ってアクティブ実行の動作を選択します。

    - `steer` - 次のモデル境界でアクティブな実行を誘導します
    - `followup` - メッセージをキューに入れ、現在の実行が終了した後に 1 件ずつ実行します
    - `collect` - 互換性のあるメッセージをキューに入れ、現在の実行が終了した後に一度だけ返信します
    - `interrupt` - 現在の実行を中止して新しく開始します

    デフォルトモードは `steer` です。キューされるモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)と[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う場合、Anthropic のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または認証プロファイルに Anthropic API キーを保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（例: `anthropic/claude-sonnet-4-6` または `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントに想定される `auth-profiles.json` 内で Gateway が Anthropic の認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？[Discord](https://discord.com/invite/clawd)で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions)を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状から始めるトリアージ
