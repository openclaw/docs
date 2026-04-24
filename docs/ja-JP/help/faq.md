---
read_when:
    - セットアップ、インストール、オンボーディング、またはランタイムサポートに関する一般的な質問に答える
    - より深いデバッグに入る前に、ユーザー報告の問題をトリアージする
summary: OpenClawのセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-24T05:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

実環境のセットアップ（local dev、VPS、multi-agent、OAuth/API key、model failover）向けのクイック回答と、より深いトラブルシューティングです。ランタイム診断は [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。完全なconfigリファレンスは [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 最初の60秒: 何か壊れている場合

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + update、gateway/service到達性、agents/sessions、provider config + ランタイム問題（gateway到達時）。

2. **貼り付け可能なレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   読み取り専用の診断。ログ末尾付き（tokenはredact済み）。

3. **Daemon + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisorランタイムとRPC到達性、probe対象URL、serviceがおそらく使用したconfigを表示します。

4. **詳細probe**

   ```bash
   openclaw status --deep
   ```

   ライブgateway health probeを実行します。サポートされる場合はチャンネルprobeも含みます
   （到達可能なgatewayが必要）。[Health](/ja-JP/gateway/health) を参照してください。

5. **最新ログをtailする**

   ```bash
   openclaw logs --follow
   ```

   RPCが落ちている場合は、代わりに次を使ってください:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはserviceログとは別です。[Logging](/ja-JP/logging) と [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctorを実行する（修復）**

   ```bash
   openclaw doctor
   ```

   config/stateを修復/移行し、health checkを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時にtarget URL + config pathを表示
   ```

   実行中gatewayに完全なsnapshotを問い合わせます（WS専用）。[Health](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回セットアップのQ&A — インストール、オンボーディング、authルート、subscription、初期
failure — は専用ページへ移動しました:
[FAQ — クイックスタートと初回セットアップ](/ja-JP/help/faq-first-run)。

## OpenClawとは何ですか?

<AccordionGroup>
  <Accordion title="OpenClawを一段落で言うと?">
    OpenClawは、自分のデバイス上で動かすパーソナルAIアシスタントです。すでに使っているメッセージングサーフェス（WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat、およびQQ Botのような同梱チャンネルPlugin）で返信でき、対応プラットフォームでは音声 + ライブCanvasにも対応します。**Gateway** は常時稼働のcontrol planeであり、アシスタントこそがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClawは単なる「Claudeラッパー」ではありません。**local-first control plane** であり、
    **自分のハードウェア上で** 高機能なアシスタントを動かし、普段使っているチャットアプリからアクセスでき、
    statefulなセッション、memory、ツールを備えながら、ワークフローの制御を
    ホスト型SaaSに渡さずに済みます。

    主な特徴:

    - **自分のデバイス、自分のデータ:** Gatewayを好きな場所（Mac, Linux, VPS）で動かし、
      workspace + セッション履歴をローカルに保持できます。
    - **Web sandboxではなく実際のチャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessageなどに加え、
      対応プラットフォームではモバイル音声とCanvas。
    - **モデル非依存:** Anthropic, OpenAI, MiniMax, OpenRouter などを、agentごとのルーティング
      とfailover付きで使えます。
    - **ローカル専用オプション:** ローカルモデルを使えば、**すべてのデータを自分のデバイス上に残す** こともできます。
    - **Multi-agent routing:** チャンネル、アカウント、またはタスクごとに別agentを持てて、それぞれ独自の
      workspaceとデフォルト設定を持てます。
    - **オープンソースでハック可能:** vendor lock-inなしで、調べたり、拡張したり、self-hostしたりできます。

    ドキュメント: [Gateway](/ja-JP/gateway), [Channels](/ja-JP/channels), [Multi-agent](/ja-JP/concepts/multi-agent),
    [Memory](/ja-JP/concepts/memory).

  </Accordion>

  <Accordion title="セットアップしたばかりです - 最初に何をすればよいですか?">
    最初のプロジェクトとしておすすめなのは:

    - Webサイトを作る（WordPress, Shopify, またはシンプルな静的サイト）。
    - モバイルアプリを試作する（構成、画面、API計画）。
    - ファイルやフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmailを接続して要約やフォローアップを自動化する。

    大きなタスクにも対応できますが、フェーズに分割して
    sub agentを並列作業に使うと、最もうまく機能します。

  </Accordion>

  <Accordion title="OpenClawの日常的な上位5つのユースケースは何ですか?">
    日常的な効果が出やすい使い方は、たいてい次のようなものです:

    - **パーソナルブリーフィング:** inbox、calendar、気になるニュースの要約。
    - **調査と下書き:** 素早い調査、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ:** CronやHeartbeat駆動の通知やチェックリスト。
    - **browser automation:** フォーム入力、データ収集、Web作業の反復。
    - **クロスデバイス連携:** スマホからタスクを送り、Gatewayにサーバー上で実行させて、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClawはSaaS向けのリード獲得、アウトリーチ、広告、ブログに役立ちますか?">
    **調査、選別、下書き** には役立ちます。サイトをスキャンし、ショートリストを作り、
    prospectを要約し、アウトリーチや広告コピーの下書きを書けます。

    **アウトリーチや広告運用** では、人間をループに残してください。スパムを避け、
    現地法やプラットフォームポリシーに従い、送信前に必ず確認してください。もっとも安全なパターンは、
    OpenClawに下書きさせて、あなたが承認することです。

    ドキュメント: [Security](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="Web開発でClaude Codeと比べた利点は何ですか?">
    OpenClawは**パーソナルアシスタント**兼オーケストレーション層であり、IDEの置き換えではありません。
    repo内で最速の直接コーディングループが欲しいなら、Claude CodeやCodexを使ってください。OpenClawは、
    永続memory、クロスデバイスアクセス、ツールオーケストレーションが欲しいときに使います。

    利点:

    - **永続memory + workspace** をセッション間で保持
    - **マルチプラットフォームアクセス**（WhatsApp, Telegram, TUI, WebChat）
    - **ツールオーケストレーション**（browser, files, scheduling, hooks）
    - **常時稼働Gateway**（VPS上で動かし、どこからでも操作可能）
    - ローカルbrowser/screen/camera/execのための**Node**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skillsとオートメーション

<AccordionGroup>
  <Accordion title="repoをdirtyに保たずにSkillsをカスタマイズするにはどうすればよいですか?">
    repo内コピーを編集する代わりに、managed overrideを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` 経由でフォルダーを追加してください。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、managed overrideはgitに触れずに同梱Skillsより優先されます。skillをグローバルにインストールしつつ一部のagentにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。upstreamに載せるべき編集だけがrepo内にあるべきで、PRとして出すべきです。
  </Accordion>

  <Accordion title="カスタムフォルダーからSkillsを読み込めますか?">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定してください（最下位優先度）。デフォルト優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClawは次のセッションでこれを `<workspace>/skills` として扱います。特定のagentにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか?">
    現在サポートされるパターンは次のとおりです:

    - **Cronジョブ**: 分離されたジョブでは、ジョブごとに `model` overrideを設定できます。
    - **Sub-agent**: 異なるデフォルトmodelを持つ別agentへタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って現在のセッションmodelをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中にbotが固まります。どうやってオフロードすればよいですか?">
    長時間または並列タスクには**sub-agent** を使ってください。sub-agentは独自セッションで動作し、
    要約を返し、メインチャットの応答性を保ちます。

    botに「このタスク用にsub-agentをspawnして」と頼むか、`/subagents` を使ってください。
    Gatewayが今何をしているか（そして忙しいかどうか）を見るには、チャット内で `/status` を使ってください。

    tokenのヒント: 長時間タスクもsub-agentもtokenを消費します。コストが気になるなら、
    `agents.defaults.subagents.model` でsub-agent用に安価な
    modelを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks).

  </Accordion>

  <Accordion title="Discordでthreadに束縛されたsubagent sessionはどう動きますか?">
    thread bindingを使ってください。Discord threadをsubagentまたはsession targetにbindすると、そのthread内の後続メッセージがそのbound sessionに留まります。

    基本フロー:

    - `sessions_spawn` を `thread: true` 付きでspawnします（永続的な後続処理には任意で `mode: "session"` も）。
    - または `/focus <target>` で手動bindします。
    - binding状態は `/agents` で確認します。
    - 自動unfocus制御には `/session idle <duration|off>` と `/session max-age <duration|off>` を使います。
    - threadを切り離すには `/unfocus` を使います。

    必須config:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord override: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - spawn時に自動bind: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定します。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [Configuration Reference](/ja-JP/gateway/configuration-reference), [Slash commands](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="subagentは完了したのに、完了更新が間違った場所に送られたか、まったく投稿されませんでした。何を確認すべきですか?">
    まず、解決されたrequester routeを確認してください:

    - completion-modeのsubagent配信は、boundされたthreadまたは会話routeが存在する場合、それを優先します。
    - completion originがchannelしか持たない場合でも、OpenClawはrequester sessionに保存されたroute（`lastChannel` / `lastTo` / `lastAccountId`）へフォールバックするため、direct配信がまだ成功することがあります。
    - bound routeも使える保存routeも存在しない場合、direct配信は失敗し、結果はチャットに即時投稿される代わりにキューされたsession配信へフォールバックします。
    - 無効または古いtargetでは、やはりqueue fallbackや最終配信failureになることがあります。
    - 子の最後に見えるassistant replyが、無音tokenの `NO_REPLY` / `no_reply` ちょうどそのもの、またはちょうど `ANNOUNCE_SKIP` の場合、OpenClawは古い進捗を投稿せず、announceを意図的に抑止します。
    - 子がtool callだけ行った後にtimeoutした場合、announceは生のtool出力をそのまま再生する代わりに、短い部分進捗要約へ縮約されることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks), [Session Tools](/ja-JP/concepts/session-tool).

  </Accordion>

  <Accordion title="Cronやリマインダーが発火しません。何を確認すべきですか?">
    CronはGateway process内で動作します。Gatewayが継続的に動作していない場合、
    スケジュールされたジョブは実行されません。

    チェックリスト:

    - cronが有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認する。
    - Gatewayが24時間365日動いていることを確認する（sleep/restartなし）。
    - ジョブのtimezone設定（`--tz` とホストtimezone）を確認する。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation).

  </Accordion>

  <Accordion title="Cronは発火したのに、何もチャンネルへ送られませんでした。なぜですか?">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` の場合、runnerによるフォールバック送信は想定されません。
    - announce target（`channel` / `to`）が欠けているか不正な場合、runnerはoutbound配信をスキップします。
    - チャンネルauth failure（`unauthorized`, `Forbidden`）は、runnerが配信を試みたが認証情報によりブロックされたことを意味します。
    - 無音のisolated result（`NO_REPLY` / `no_reply` のみ）は、意図的に配信不可として扱われるため、runnerはキューされたフォールバック配信も抑止します。

    isolated cron jobでは、チャットrouteが利用可能なら、agentが
    `message` ツールで直接送信することもできます。`--announce` が制御するのは、
    agentがまだ送っていない最終テキストに対するrunnerの
    フォールバック経路だけです。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Background Tasks](/ja-JP/automation/tasks).

  </Accordion>

  <Accordion title="なぜisolated cron runがmodelを切り替えたり、一度再試行したりしたのですか?">
    それは通常、重複スケジューリングではなくlive model-switch pathです。

    isolated cronは、アクティブな
    runが `LiveSessionModelSwitchError` を投げたときに、ランタイムのmodel handoffを永続化して再試行できます。その再試行では
    切り替え後のprovider/modelを保持し、切り替えに新しいauth profile overrideが含まれていた場合は、
    cronがそれも永続化してから再試行します。

    関連する選択ルール:

    - 適用可能であれば、まずGmail hook model overrideが優先される。
    - 次にジョブごとの `model`。
    - 次に保存済みcron-session model override。
    - その後で通常のagent/default model選択。

    再試行ループには上限があります。初回試行 + 2回のswitch retryの後は、
    cronは無限ループせず中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [cron CLI](/ja-JP/cli/cron).

  </Accordion>

  <Accordion title="LinuxでSkillsをインストールするにはどうすればよいですか?">
    ネイティブの `openclaw skills` コマンドを使うか、Skillsをworkspaceへ置いてください。macOSのSkills UIはLinuxでは使えません。
    Skillsは [https://clawhub.ai](https://clawhub.ai) で閲覧できます。

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

    ネイティブの `openclaw skills install` は、アクティブworkspaceの `skills/`
    ディレクトリへ書き込みます。自分のSkillsを公開または
    syncしたい場合にのみ、別個の `clawhub` CLIをインストールしてください。agent間で共有するインストールには、skillを
    `~/.openclaw/skills` の下に置き、見せるagentを絞りたい場合は `agents.defaults.skills` または
    `agents.list[].skills` を使ってください。

  </Accordion>

  <Accordion title="OpenClawはスケジュール実行やバックグラウンドで継続実行できますか?">
    はい。Gateway schedulerを使ってください:

    - **Cronジョブ**: スケジュール済みまたは定期タスク向け（restart後も保持）。
    - **Heartbeat**: 「main session」の定期チェック向け。
    - **Isolated job**: 要約を投稿したりチャットへ配信したりする自律agent向け。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat).

  </Accordion>

  <Accordion title="AppleのmacOS専用SkillsをLinuxから実行できますか?">
    直接にはできません。macOS Skillsは `metadata.openclaw.os` と必要バイナリによって制御され、Skillは**Gatewayホスト**上で適格な場合にのみシステムプロンプトへ表示されます。Linuxでは、`darwin` 専用Skill（`apple-notes`, `apple-reminders`, `things-mac` など）は、その制御をoverrideしない限り読み込まれません。

    サポートされるパターンは3つあります:

    **Option A - GatewayをMac上で実行する（最も簡単）。**
    GatewayをmacOSバイナリが存在するMac上で動かし、Linuxからは [remote mode](#gateway-ports-already-running-and-remote-mode) またはTailscale経由で接続します。GatewayホストがmacOSなので、Skillsは通常どおり読み込まれます。

    **Option B - macOS Nodeを使う（SSHなし）。**
    Linux上でGatewayを動かし、macOS Node（menubarアプリ）をペアリングして、Mac側で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要バイナリがNode上に存在すれば、OpenClawはmacOS専用Skillを適格として扱えます。agentは `nodes` ツール経由でそれらのSkillを実行します。「Always Ask」を選んでいる場合、プロンプトで「Always Allow」を承認すると、そのコマンドがallowlistへ追加されます。

    **Option C - macOSバイナリをSSH経由でproxyする（上級）。**
    GatewayはLinux上に置いたまま、必要なCLIバイナリを、Mac上で実行するSSH wrapper経由で解決させます。その後、SkillをoverrideしてLinuxを許可し、適格状態を保ちます。

    1. バイナリ用のSSH wrapperを作成します（例: Apple Notes向け `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapperをLinuxホスト上の `PATH` に置きます（例: `~/bin/memo`）。
    3. Skill metadataをoverrideしてLinuxを許可します（workspaceまたは `~/.openclaw/skills`）:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills snapshotが更新されるよう、新しいセッションを開始します。

  </Accordion>

  <Accordion title="NotionやHeyGenとの連携はありますか?">
    現時点では組み込みではありません。

    選択肢:

    - **カスタムskill / plugin:** 信頼性の高いAPIアクセスに最適です（Notion/HeyGenはどちらもAPIがあります）。
    - **browser automation:** コード不要で動きますが、遅く、壊れやすいです。

    クライアントごとにコンテキストを持たせたい場合（agency workflowなど）のシンプルなパターンは:

    - クライアントごとに1つのNotion pageを作る（コンテキスト + 設定 + 進行中作業）。
    - セッション開始時に、そのpageを取得するようagentへ依頼する。

    ネイティブ統合がほしい場合は、feature requestを出すか、そのAPIを対象にしたskillを作ってください。

    Skillsのインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールはアクティブworkspaceの `skills/` ディレクトリに入ります。agent間で共有するSkillは `~/.openclaw/skills/<name>/SKILL.md` に置いてください。共有インストールを一部のagentだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部のSkillはHomebrew経由でインストールされたバイナリを前提とします。LinuxではこれはLinuxbrewを意味します（上のHomebrew Linux FAQエントリを参照）。[Skills](/ja-JP/tools/skills), [Skills config](/ja-JP/tools/skills-config), [ClawHub](/ja-JP/tools/clawhub) も参照してください。

  </Accordion>

  <Accordion title="既存のログイン済みChromeをOpenClawで使うにはどうすればよいですか?">
    組み込みの `user` browser profileを使ってください。これはChrome DevTools MCP経由で接続します:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使いたい場合は、明示的なMCP profileを作成します:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストbrowserまたは接続済みbrowser Nodeを使えます。Gatewayが別の場所で動作している場合は、browserマシン上でnode hostを動かすか、リモートCDPを使ってください。

    `existing-session` / `user` の現在の制限:

    - アクションはCSS-selector駆動ではなくref駆動
    - uploadは `ref` / `inputRef` が必要で、現在は一度に1ファイルのみサポート
    - `responsebody`, PDF export, download interception, batch action には、依然としてmanaged browserまたはraw CDP profileが必要

  </Accordion>
</AccordionGroup>

## Sandboxingとmemory

<AccordionGroup>
  <Accordion title="sandboxing専用ドキュメントはありますか?">
    はい。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。Docker固有のセットアップ（Docker内の完全なgatewayまたはsandbox image）については [Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Dockerが制限されているように感じます - フル機能を有効にするにはどうすればよいですか?">
    デフォルトimageはsecurity-firstで `node` userとして動作するため、
    system package、Homebrew、同梱browserを含みません。より完全なセットアップにするには:

    - `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化して、cacheを残す。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でsystem依存をimageへ焼き込む。
    - 同梱CLI経由でPlaywright browserをインストールする:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにする。

    ドキュメント: [Docker](/ja-JP/install/docker), [Browser](/ja-JP/tools/browser).

  </Accordion>

  <Accordion title="1つのagentでDMは個人的に保ちつつ、groupは公開/sandbox化できますか?">
    はい。プライベートなトラフィックが**DM**で、公開トラフィックが**group**なら可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使うと、group/channel session（non-main key）は設定されたsandbox backend上で動作し、main DM sessionはホスト上に残ります。バックエンドを選ばない場合、デフォルトはDockerです。その後、sandbox化セッションで利用可能なツールを `tools.sandbox.tools` で制限してください。

    セットアップ手順 + 設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    重要なconfigリファレンス: [Gateway configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをsandboxにbindするにはどうすればよいですか?">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定してください（例: `"/home/user/src:/src:ro"`）。グローバル + agentごとのbindはマージされます。`scope: "shared"` ではagentごとのbindは無視されます。機密性の高いものには `:ro` を使い、bindはsandbox filesystemの壁をバイパスすることを忘れないでください。

    OpenClawは、正規化されたパスと、もっとも深い既存ancestor経由で解決されたcanonical pathの両方に対してbind sourceを検証します。つまり、最後のパスセグメントがまだ存在しなくても、symlink親を使った脱出はフェイルクローズし、allowed-rootチェックもsymlink解決後に引き続き適用されます。

    例と安全性に関する注記は [Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="memoryはどう動作しますか?">
    OpenClawのmemoryは、agent workspace内のMarkdown fileにすぎません:

    - 日次ノートは `memory/YYYY-MM-DD.md`
    - 長期の厳選ノートは `MEMORY.md`（main/private sessionのみ）

    OpenClawはまた、auto-compactionの前にmodelへ
    永続ノートを書かせるための**silent pre-compaction memory flush** を実行します。これはworkspaceが
    書き込み可能な場合にのみ実行されます（read-only sandboxはスキップ）。[Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="memoryが物事を忘れてしまいます。どうすれば定着しますか?">
    botに**その事実をmemoryへ書くよう**依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。modelにmemoryを保存するよう促すと役立ちます。
    何をすべきかは理解しています。それでも忘れ続ける場合は、Gatewayが毎回同じ
    workspaceを使っていることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Agent workspace](/ja-JP/concepts/agent-workspace).

  </Accordion>

  <Accordion title="memoryは永続しますか? 制限はありますか?">
    memory fileはディスク上にあり、削除するまで永続します。制限は
    modelではなくストレージです。ただし**session context** は依然としてmodelの
    context windowに制限されるため、長い会話ではcompactionまたはtruncateが起こりえます。だからこそ
    memory searchが存在します。関連する部分だけをコンテキストへ戻します。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Context](/ja-JP/concepts/context).

  </Accordion>

  <Accordion title="セマンティックmemory searchにはOpenAI API keyが必要ですか?">
    **OpenAI embeddings** を使う場合にのみ必要です。Codex OAuthはchat/completionsをカバーしますが、
    embeddingsアクセスは付与しません。したがって、**Codexでサインインしても（OAuthでも
    Codex CLI loginでも）** セマンティックmemory searchには役立ちません。OpenAI embeddingsには引き続き
    実際のAPI key（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    providerを明示設定しない場合、OpenClawはAPI keyを解決できるときに
    providerを自動選択します（auth profile、`models.providers.*.apiKey`、またはenv var）。
    OpenAI keyが解決できればOpenAIを優先し、そうでなければGemini keyが解決できればGemini、
    次にVoyage、次にMistralを選びます。remote keyが利用できない場合、
    memory searchは設定するまで無効のままです。ローカルmodel pathが
    設定済みかつ存在している場合、OpenClawは
    `local` を優先します。Ollamaは
    `memorySearch.provider = "ollama"` を明示設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"`（必要なら
    `memorySearch.fallback = "none"` も）を設定してください。Gemini embeddingsを使いたいなら、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。embedding
    modelとして **OpenAI, Gemini, Voyage, Mistral, Ollama, local** をサポートしています。セットアップ詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置

<AccordionGroup>
  <Accordion title="OpenClawで使うすべてのデータはローカルに保存されますか?">
    いいえ。**OpenClaw自身の状態はローカル**ですが、**外部サービスは送信されたデータを引き続き見ます**。

    - **デフォルトでローカル:** session、memory file、config、workspaceはGatewayホスト上にあります
      （`~/.openclaw` + workspace directory）。
    - **必然的にリモート:** model provider（Anthropic/OpenAIなど）へ送るメッセージは
      それらのAPIへ送信され、チャットプラットフォーム（WhatsApp/Telegram/Slackなど）はメッセージデータを
      それぞれのサーバーに保存します。
    - **フットプリントは自分で制御できる:** ローカルモデルを使えばプロンプトを自分のマシン上に留められますが、
      チャンネルトラフィックは依然としてそのチャンネルのサーバーを通ります。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace), [Memory](/ja-JP/concepts/memory).

  </Accordion>

  <Accordion title="OpenClawはどこにデータを保存しますか?">
    すべては `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）:

    | Path                                                            | 目的                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メインconfig（JSON5）                                              |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシーOAuth import（初回使用時にauth profileへコピー）          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profile（OAuth, API key, 任意の `keyRef`/`tokenRef` を含む）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider向け任意のfile-backed secret payload      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換file（静的 `api_key` エントリは除去済み）              |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | agentごとのstate（agentDir + sessions）                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴とstate（agentごと）                                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | session metadata（agentごと）                                      |

    レガシーのsingle-agent path: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **workspace**（AGENTS.md, memory file, Skillsなど）は別で、`agents.defaults.workspace` で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか?">
    これらのfileは `~/.openclaw` ではなく、**agent workspace** に置きます。

    - **Workspace（agentごと）**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, 任意の `HEARTBEAT.md`。
      小文字ルートの `memory.md` はレガシー修復入力専用です。`openclaw doctor --fix`
      は両方のfileが存在する場合、これを `MEMORY.md` にマージできます。
    - **State dir（`~/.openclaw`）**: config, channel/provider state, auth profile, session, log,
      共有Skills（`~/.openclaw/skills`）。

    デフォルトworkspaceは `~/.openclaw/workspace` で、次で設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にbotが「忘れる」場合は、毎回同じ
    workspaceでGatewayを起動していることを確認してください（そして、remote modeでは**ローカルlaptopではなくgateway hostの**
    workspaceが使われることを忘れないでください）。

    ヒント: 永続的な動作や好みを持たせたい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む**ようbotに依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace** は**プライベート**なgit repoに置き、どこか
    非公開の場所（たとえばGitHub private）へバックアップしてください。これによりmemory + AGENTS/SOUL/USER
    fileが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（credential, session, token, 暗号化されたsecret payload）は
    コミット**しないでください**。
    完全な復元が必要なら、workspaceとstate directoryの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClawを完全にアンインストールするにはどうすればよいですか?">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="agentはworkspaceの外でも動作できますか?">
    はい。workspaceは**デフォルトcwd** 兼memoryアンカーであり、厳格なsandboxではありません。
    相対パスはworkspace内で解決されますが、絶対パスは
    sandboxingが有効でない限り、ホスト上の他の場所へアクセスできます。分離が必要なら、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはagentごとのsandbox設定を使ってください。repoをデフォルト作業ディレクトリにしたい場合は、そのagentの
    `workspace` をrepo rootへ向けてください。OpenClaw repoは単なるsource codeです。意図的にagentにその中で作業させたい場合を除き、
    workspaceは別に保ってください。

    例（repoをデフォルトcwdにする）:

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

  <Accordion title="remote mode: session storeはどこですか?">
    session stateは**gateway host** が所有します。remote modeでは、重要なのはリモートマシン上のsession storeであり、ローカルlaptop上ではありません。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## Configの基本

<AccordionGroup>
  <Accordion title="configは何形式ですか? どこにありますか?">
    OpenClawは、`$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の**JSON5** configを読みます:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    fileが存在しない場合は、安全寄りのデフォルトを使います（`~/.openclaw/workspace` をデフォルトworkspaceに含む）。

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`（または `"tailnet"`）を設定したら、何もlistenしなくなった / UIがunauthorizedと言う'>
    non-loopback bindには**有効なgateway auth pathが必須**です。実際には次のいずれかを意味します:

    - shared-secret auth: tokenまたはpassword
    - 正しく設定されたnon-loopbackのidentity-aware reverse proxyの背後にある `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` だけではローカルgateway authは有効になりません。
    - ローカルcall pathは、`gateway.auth.*` が未設定の場合に限り `gateway.remote.*` をフォールバックとして使えます。
    - password authでは、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示設定されていて未解決の場合、解決はフェイルクローズします（remote fallbackで隠されません）。
    - shared-secretなControl UI構成では、`connect.params.auth.token` または `connect.params.auth.password`（app/UI設定に保存）を通じて認証します。Tailscale Serveや `trusted-proxy` のようなidentity-bearing modeでは、代わりにrequest headerを使います。shared secretをURLに入れるのは避けてください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストのloopback reverse proxyでも**trusted-proxy authを満たしません**。trusted proxyは設定済みのnon-loopback sourceでなければなりません。

  </Accordion>

  <Accordion title="なぜlocalhostでもtokenが必要になったのですか?">
    OpenClawはloopbackを含め、デフォルトでgateway authを強制します。通常のデフォルト経路ではこれはtoken authを意味します。明示的なauth pathが設定されていない場合、gateway起動時にtoken modeへ解決され、自動生成したtokenを `gateway.auth.token` へ保存するため、**ローカルWSクライアントも認証が必要**になります。これにより、他のローカルprocessがGatewayを呼び出せなくなります。

    別のauth pathがよければ、password mode（またはnon-loopbackのidentity-aware reverse proxy向けに `trusted-proxy`）を明示的に選べます。どうしてもopen loopbackにしたいなら、configで明示的に `gateway.auth.mode: "none"` を設定してください。doctorはいつでもtokenを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="configを変更した後、再起動は必要ですか?">
    Gatewayはconfigを監視しており、hot-reloadをサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はhot-applyし、重要なものはrestart
    - `hot`, `restart`, `off` もサポートされます

  </Accordion>

  <Accordion title="変なCLI taglineを無効にするにはどうすればよいですか?">
    configで `cli.banner.taglineMode` を設定してください:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: banner title/version lineは残しつつ、tagline textを隠します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: おもしろ/季節ものtaglineをローテーションします（デフォルト動作）。
    - banner自体を出したくない場合は、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

  </Accordion>

  <Accordion title="web search（とweb fetch）を有効にするにはどうすればよいですか?">
    `web_fetch` はAPI keyなしで動作します。`web_search` は選択した
    providerに依存します:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily のようなAPIバックドproviderでは、通常のAPI key設定が必要です。
    - Ollama Web Searchはkey不要ですが、設定済みOllama hostを使い、`ollama signin` が必要です。
    - DuckDuckGoはkey不要ですが、非公式のHTMLベース統合です。
    - SearXNGはkey不要/self-hostedです。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行してproviderを選んでください。
    環境変数による代替:

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
              provider: "firecrawl", // 任意; 自動検出にするなら省略
            },
          },
        },
    }
    ```

    provider固有のweb-search configは現在 `plugins.entries.<plugin>.config.webSearch.*` の下にあります。
    レガシーの `tools.web.search.*` provider pathも互換性のため一時的には読み込まれますが、新しいconfigでは使わないでください。
    Firecrawlのweb-fetch fallback configは `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    注:

    - allowlistを使う場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化していない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClawは利用可能な認証情報から最初に準備できたfetch fallback providerを自動検出します。現在の同梱providerはFirecrawlです。
    - daemonは `~/.openclaw/.env`（またはservice environment）からenv varを読みます。

    ドキュメント: [Web tools](/ja-JP/tools/web).

  </Accordion>

  <Accordion title="config.applyでconfigが消えました。どう復旧して、どう防げばよいですか?">
    `config.apply` は**config全体**を置き換えます。部分オブジェクトを送ると、
    それ以外はすべて削除されます。

    現在のOpenClawは多くの偶発的clobberを防御します:

    - OpenClaw所有のconfig書き込みは、書き込む前に変更後の完全なconfig全体を検証します。
    - 不正または破壊的なOpenClaw所有書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集が起動やhot reloadを壊した場合、Gatewayはlast-known-good configを復元し、拒否されたfileを `openclaw.json.clobbered.*` として保存します。
    - main agentは復旧後にboot warningを受け取り、同じ不正configを盲目的に再書き込みしないようになります。

    復旧方法:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`, `Config write rejected:`, `config reload restored last-known-good config` を確認してください。
    - アクティブconfigの隣にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認してください。
    - 復元されたアクティブconfigが機能するなら保持し、意図したキーだけを `openclaw config set` または `config.patch` で戻してください。
    - `openclaw config validate` と `openclaw doctor` を実行してください。
    - last-known-goodもrejected payloadもない場合は、バックアップから復元するか、`openclaw doctor` を再実行して channels/models を再設定してください。
    - 想定外だった場合はbugを報告し、最後に分かっているconfigまたは任意のバックアップを添えてください。
    - ローカルのcoding agentなら、logやhistoryから動くconfigを再構築できることがよくあります。

    防ぐには:

    - 小さな変更には `openclaw config set` を使う。
    - 対話的な編集には `openclaw configure` を使う。
    - 正確なpathやfield shapeに自信がない場合は、先に `config.schema.lookup` を使う。これは浅いschema nodeと直下の子要約を返すので、ドリルダウンできます。
    - 部分的なRPC編集には `config.patch` を使い、`config.apply` は完全なconfig置換専用にしてください。
    - agent runからowner-onlyの `gateway` ツールを使っている場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは引き続き拒否されます（同じ保護されたexec pathに正規化されるレガシー `tools.bash.*` aliasも含む）。

    ドキュメント: [Config](/ja-JP/cli/config), [Configure](/ja-JP/cli/configure), [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ja-JP/gateway/doctor).

  </Accordion>

  <Accordion title="中央Gatewayと、デバイスをまたぐ特化workerをどう運用すればよいですか?">
    一般的なパターンは**1つのGateway**（例: Raspberry Pi）と**Node**および**agent**です:

    - **Gateway（中央）**: channels（Signal/WhatsApp）、routing、sessionを所有。
    - **Node（デバイス）**: Mac/iOS/Androidが周辺機器として接続し、ローカルツール（`system.run`, `canvas`, `camera`）を公開。
    - **Agent（worker）**: 特定の役割（例: 「Hetzner ops」「Personal data」）向けの別々のbrain/workspace。
    - **Sub-agent**: 並列性が欲しいときに、main agentからバックグラウンド作業をspawn。
    - **TUI**: Gatewayへ接続し、agent/sessionを切り替える。

    ドキュメント: [Nodes](/ja-JP/nodes), [Remote access](/ja-JP/gateway/remote), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [TUI](/ja-JP/web/tui).

  </Accordion>

  <Accordion title="OpenClaw browserはheadlessで動かせますか?">
    はい。configオプションです:

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

    デフォルトは `false`（headful）です。headlessは一部サイトでanti-bot checkを誘発しやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    headlessは**同じChromium engine** を使い、ほとんどのautomation（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違い:

    - 目に見えるbrowser windowがない（視覚が必要ならscreenshotを使ってください）。
    - 一部サイトはheadless modeのautomationにより厳しい（CAPTCHA, anti-bot）。
      たとえばX/Twitterはheadless sessionをよくブロックします。

  </Accordion>

  <Accordion title="browser制御にBraveを使うにはどうすればよいですか?">
    `browser.executablePath` をBraveのバイナリ（または任意のChromium系browser）に設定し、Gatewayを再起動してください。
    完全なconfig例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモートgatewayとNode

<AccordionGroup>
  <Accordion title="Telegram、gateway、Nodeの間でコマンドはどう伝播しますか?">
    Telegramメッセージは**gateway** が処理します。gatewayがagentを実行し、
    Nodeツールが必要なときにだけ **Gateway WebSocket** 経由でNodeを呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodeは受信providerトラフィックを見ません。受け取るのはnode RPC呼び出しだけです。

  </Accordion>

  <Accordion title="Gatewayがリモートホスト上にある場合、agentはどうやって自分のコンピューターにアクセスしますか?">
    短く言うと: **自分のコンピューターをNodeとしてペアリング**してください。Gatewayは別の場所で動作していても、
    Gateway WebSocket経由でローカルマシン上の `node.*` ツール（screen, camera, system）を呼び出せます。

    典型的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）でGatewayを動かす。
    2. Gatewayホストと自分のコンピューターを同じtailnetに置く。
    3. Gateway WSに到達可能であることを確認する（tailnet bindまたはSSH tunnel）。
    4. ローカルでmacOS appを開き、**Remote over SSH** mode（またはdirect tailnet）
       で接続して、Nodeとして登録できるようにする。
    5. Gateway上でNodeを承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個のTCP bridgeは不要です。NodeはGateway WebSocket経由で接続します。

    セキュリティ上の注意: macOS Nodeをペアリングすると、そのマシン上で `system.run` が可能になります。信頼できるデバイスだけを
    ペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Gateway protocol](/ja-JP/gateway/protocol), [macOS remote mode](/ja-JP/platforms/mac/remote), [Security](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="Tailscaleは接続済みなのに、返信がありません。次はどうすればよいですか?">
    基本を確認してください:

    - Gatewayが動作中: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - Channel health: `openclaw channels status`

    次にauthとroutingを確認します:

    - Tailscale Serveを使っている場合、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。
    - SSH tunnel経由で接続している場合、ローカルトンネルが起動していて正しいポートを指していることを確認してください。
    - allowlist（DMまたはgroup）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale), [Remote access](/ja-JP/gateway/remote), [Channels](/ja-JP/channels).

  </Accordion>

  <Accordion title="2つのOpenClawインスタンスは互いに通信できますか（local + VPS）?">
    はい。組み込みの「bot-to-bot」bridgeはありませんが、いくつかの
    信頼できる方法で構築できます:

    **もっとも簡単:** 両botがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使います。
    Bot AにBot Bへメッセージを送らせ、その後Bot Bに通常どおり返信させます。

    **CLI bridge（汎用）:** 別のGatewayを
    `openclaw agent --message ... --deliver` で呼び出すscriptを実行し、他方のbotが
    listenしているチャットをtargetにします。一方のbotがリモートVPS上にいる場合は、そのremote Gatewayへ
    SSH/Tailscale経由でCLIを向けてください（[Remote access](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象Gatewayへ到達できるマシン上で実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つのbotが無限ループしないように、mention-only、channel
    allowlist、または「botメッセージには返信しない」ルールのようなガードレールを追加してください。

    ドキュメント: [Remote access](/ja-JP/gateway/remote), [Agent CLI](/ja-JP/cli/agent), [Agent send](/ja-JP/tools/agent-send).

  </Accordion>

  <Accordion title="複数agentに別々のVPSは必要ですか?">
    いいえ。1つのGatewayで複数agentをホストでき、それぞれ独自のworkspace、model default、
    routingを持てます。これが通常のセットアップであり、
    agentごとにVPSを分けるより、ずっと安価で単純です。

    別々のVPSが必要なのは、厳格な分離（security boundary）や、
    共有したくない大きく異なるconfigが必要な場合だけです。そうでなければ、1つのGatewayを維持し、
    複数agentまたはsub-agentを使ってください。

  </Accordion>

  <Accordion title="VPSからSSHする代わりに、個人のlaptop上でNodeを使う利点はありますか?">
    はい。リモートGatewayからlaptopへ到達するにはNodeが第一級の方法であり、
    shell access以上のことが可能になります。GatewayはmacOS/Linux（WindowsはWSL2経由）上で動作し、
    軽量です（小さなVPSやRaspberry Pi級の箱で十分。4 GB RAMで足ります）。一般的な
    セットアップは、常時稼働ホスト + laptopをNodeにする構成です。

    - **受信SSH不要。** NodeはGateway WebSocketへ外向き接続し、device pairingを使います。
    - **より安全な実行制御。** `system.run` はそのlaptop上でnode allowlist/approvalによって制御されます。
    - **より多くのデバイスツール。** Nodeは `system.run` に加えて `canvas`, `camera`, `screen` を公開します。
    - **ローカルbrowser automation。** GatewayはVPS上のままにしつつ、laptop上のnode host経由でChromeをローカル実行するか、Chrome MCP経由でホスト上のローカルChromeへ接続できます。

    SSHはその場限りのshell accessには問題ありませんが、継続的なagent workflowや
    device automationにはNodeのほうが単純です。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/ja-JP/cli/nodes), [Browser](/ja-JP/tools/browser).

  </Accordion>

  <Accordion title="Nodeはgateway serviceを実行しますか?">
    いいえ。意図的に分離profileを動かすのでない限り（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）、ホストごとに**1つのgatewayだけ**を動かすべきです。Nodeはgatewayへ接続する周辺機器です
    （iOS/Android Node、またはmenubar appのmacOS「node mode」）。headless node
    hostとCLI制御については [Node host CLI](/ja-JP/cli/node) を参照してください。

    `gateway`, `discovery`, `canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="configを適用するAPI / RPC方法はありますか?">
    はい。

    - `config.schema.lookup`: 書き込む前に、浅いschema node、一致したUI hint、直下の子要約付きで1つのconfig subtreeを調べる
    - `config.get`: 現在のsnapshot + hashを取得する
    - `config.patch`: 安全な部分更新（ほとんどのRPC編集で推奨）。可能ならhot-reloadし、必要ならrestartする
    - `config.apply`: 完全なconfigを検証して置換する。可能ならhot-reloadし、必要ならrestartする
    - owner-onlyの `gateway` ランタイムツールは依然として `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。レガシーの `tools.bash.*` aliasは同じ保護されたexec pathへ正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で無難なconfigは?">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これでworkspaceを設定し、誰がbotをトリガーできるかを制限します。

  </Accordion>

  <Accordion title="VPSにTailscaleを設定して、Macから接続するにはどうすればよいですか?">
    最小手順:

    1. **VPSでインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Macでインストール + ログイン**
       - Tailscaleアプリを使い、同じtailnetへサインインします。
    3. **MagicDNSを有効化（推奨）**
       - Tailscale admin consoleでMagicDNSを有効にし、VPSが安定した名前を持てるようにします。
    4. **tailnetホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSHなしでControl UIを使いたい場合は、VPSでTailscale Serveを使ってください:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これによりgatewayはloopbackにbindしたまま、Tailscale経由でHTTPSを公開します。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac Nodeをremote Gateway（Tailscale Serve）に接続するにはどうすればよいですか?">
    Serveは**Gateway Control UI + WS** を公開します。Nodeは同じGateway WS endpoint経由で接続します。

    推奨セットアップ:

    1. **VPSとMacが同じtailnet上にあることを確認**します。
    2. **macOS appをRemote modeで使う**（SSH targetにはtailnet hostnameを使えます）。
       appはGateway portをtunnelし、Nodeとして接続します。
    3. Gateway上でNodeを**承認**します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol), [Discovery](/ja-JP/gateway/discovery), [macOS remote mode](/ja-JP/platforms/mac/remote).

  </Accordion>

  <Accordion title="2台目のlaptopにはインストールすべきですか、それともNodeを追加すべきですか?">
    2台目のlaptopで必要なのが**ローカルツール**（screen/camera/exec）だけなら、
    **Node** として追加してください。これならGatewayを1つに保てて、configの重複を避けられます。ローカルNodeツールは
    現在macOS専用ですが、今後ほかのOSにも広げる予定です。

    2つ目のGatewayをインストールするのは、**厳格な分離** または完全に別のbotが必要な場合だけです。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/ja-JP/cli/nodes), [Multiple gateways](/ja-JP/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env varと.envの読み込み

<AccordionGroup>
  <Accordion title="OpenClawは環境変数をどう読み込みますか?">
    OpenClawは、親process（shell, launchd/systemd, CIなど）からenv varを読み取り、さらに次も読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルfallback `.env`

    どちらの `.env` fileも、既存のenv varを上書きしません。

    config内でインラインenv varを定義することもできます（process envにない場合にのみ適用）:

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

  <Accordion title="service経由でGatewayを起動したらenv varが消えました。どうすればよいですか?">
    よくある修正は2つあります:

    1. 不足しているキーを `~/.openclaw/.env` に入れて、serviceがshell envを継承しない場合でも拾えるようにする。
    2. shell importを有効化する（任意の便利機能）:

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

    これはlogin shellを実行し、不足している期待キーだけをimportします（上書きはしません）。対応するenv var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='`COPILOT_GITHUB_TOKEN` を設定したのに、models statusに "Shell env: off." と表示されます。なぜですか?'>
    `openclaw models status` は、**shell env import** が有効かどうかを報告します。"Shell env: off" は、
    env varが不足しているという意味ではなく、OpenClawが
    login shellを自動で読み込まないという意味です。

    Gatewayがserviceとして動作している場合、shell
    environmentを継承しません。次のいずれかで修正してください:

    1. tokenを `~/.openclaw/.env` に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell importを有効化する（`env.shellEnv.enabled: true`）。
    3. または configの `env` ブロックへ追加する（不足時のみ適用）。

    その後、gatewayを再起動して再確認してください:

    ```bash
    openclaw models status
    ```

    Copilot tokenは `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## Sessionと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるにはどうすればよいですか?">
    `/new` または `/reset` を単独メッセージとして送信してください。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="`/new` を一度も送らなければ、sessionは自動でリセットされますか?">
    sessionは `session.idleMinutes` 後に期限切れにできますが、これは**デフォルトで無効**です（デフォルト **0**）。
    正の値を設定するとidle expiryが有効になります。有効時は、idle期間の**次の**
    メッセージで、そのchat keyに対して新しいsession idが開始されます。
    これはtranscriptを削除するのではなく、新しいsessionを始めるだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClawインスタンスのチーム（1人のCEOと多くのagent）を作る方法はありますか?">
    はい。**multi-agent routing** と **sub-agent** で可能です。1つのcoordinator
    agentと、独自workspaceやmodelを持つ複数のworker agentを作れます。

    ただし、これは**楽しい実験** として捉えるのが最適です。token消費が大きく、
    1つのbotを複数sessionで使うより効率が悪いことがよくあります。私たちが
    想定する典型的なモデルは、1つのbotと会話し、並列作業には別sessionを使う形です。その
    botは必要に応じてsub-agentもspawnできます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [Agents CLI](/ja-JP/cli/agents).

  </Accordion>

  <Accordion title="なぜタスク途中でcontextがtruncateされたのですか? どう防げますか?">
    session contextはmodel windowに制限されます。長いチャット、大きなtool出力、または多数の
    fileはcompactionやtruncateを引き起こします。

    助けになること:

    - 現在の状態を要約してfileへ書くようbotに依頼する。
    - 長いタスクの前に `/compact` を使い、話題を変えるときは `/new` を使う。
    - 重要なcontextはworkspaceに置き、botにそれを読み返させる。
    - 長い作業や並列作業にはsub-agentを使い、main chatを小さく保つ。
    - これが頻繁に起きるなら、より大きなcontext windowを持つmodelを選ぶ。

  </Accordion>

  <Accordion title="OpenClawを完全にリセットしつつ、インストールは残すにはどうすればよいですか?">
    resetコマンドを使ってください:

    ```bash
    openclaw reset
    ```

    非対話の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、setupを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - Onboardingは既存configを検出すると**Reset** も提示します。[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
    - profile（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各state dirをリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - Dev reset: `openclaw gateway --dev --reset`（dev専用。dev config + credentials + sessions + workspaceを消去）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ています - resetやcompactはどうすればよいですか?'>
    次のいずれかを使ってください:

    - **Compact**（会話は維持しつつ、古いturnを要約）:

      ```
      /compact
      ```

      または要約を誘導するには `/compact <instructions>`。

    - **Reset**（同じchat keyに対する新しいsession ID）:

      ```
      /new
      /reset
      ```

    それでも起き続ける場合:

    - 古いtool outputを削るため、**session pruning**（`agents.defaults.contextPruning`）を有効化または調整する。
    - より大きなcontext windowを持つmodelを使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction), [Session pruning](/ja-JP/concepts/session-pruning), [Session management](/ja-JP/concepts/session).

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と出ます。なぜですか?'>
    これはprovider validation errorです。modelが必要な
    `input` なしで `tool_use` ブロックを出力しました。通常はsession historyが古いか破損していることを意味します（長いthreadやtool/schema変更の後によくあります）。

    修正: `/new`（単独メッセージ）で新しいsessionを開始してください。

  </Accordion>

  <Accordion title="なぜ30分ごとにheartbeatメッセージが来るのですか?">
    Heartbeatはデフォルトで**30m** ごと（OAuth auth使用時は **1h**）に実行されます。調整または無効化するには:

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

    `HEARTBEAT.md` が存在しても、実質的に空（空行と `# Heading` のようなmarkdown
    headerだけ）の場合、OpenClawはAPI call節約のためheartbeat実行をスキップします。
    fileが存在しない場合、heartbeatは引き続き実行され、modelが何をするか決めます。

    agentごとのoverrideは `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp groupに「bot account」を追加する必要がありますか?'>
    いいえ。OpenClawは**自分自身のアカウント**で動くので、自分がgroupにいれば、OpenClawもそれを見られます。
    デフォルトでは、senderを許可するまでgroup返信はブロックされます（`groupPolicy: "allowlist"`）。

    **自分だけ**がgroup返信をトリガーできるようにしたい場合:

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

  <Accordion title="WhatsApp groupのJIDを取得するにはどうすればよいですか?">
    Option 1（最速）: logをtailしながら、そのgroupにテストメッセージを送ってください:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`.

    Option 2（すでに設定/allowlist済みの場合）: configからgroupを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/ja-JP/cli/directory), [Logs](/ja-JP/cli/logs).

  </Accordion>

  <Accordion title="なぜOpenClawはgroupで返信しないのですか?">
    よくある原因は2つあります:

    - mention gatingがオン（デフォルト）。botを@mentionする必要があります（または `mentionPatterns` に一致させる）。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのgroupがallowlistされていない。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="group/threadはDMとcontextを共有しますか?">
    ダイレクトチャットはデフォルトでmain sessionへ集約されます。group/channelは独自のsession keyを持ち、Telegram topic / Discord threadも別sessionです。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="workspaceとagentはいくつ作れますか?">
    厳密な上限はありません。何十個（何百個でも）問題ありませんが、次には注意してください:

    - **ディスク増加:** session + transcriptは `~/.openclaw/agents/<agentId>/sessions/` に保存されます。
    - **tokenコスト:** agentが増えるほど、同時model使用量が増えます。
    - **運用オーバーヘッド:** agentごとのauth profile、workspace、channel routing。

    ヒント:

    - agentごとに1つの**アクティブな**workspace（`agents.defaults.workspace`）を保つ。
    - ディスクが増えたら古いsession（JSONLまたはstore entry）を削除してpruneする。
    - `openclaw doctor` を使うと、迷子workspaceやprofile mismatchを見つけられます。

  </Accordion>

  <Accordion title="複数のbotやchatを同時に実行できますか（Slack）? どうセットアップすべきですか?">
    はい。**Multi-Agent Routing** を使って複数の分離agentを動かし、受信メッセージを
    channel/account/peerごとにルーティングしてください。Slackはchannelとしてサポートされており、特定のagentにbindできます。

    browser accessは強力ですが、「人間にできることは何でもできる」というわけではありません。anti-bot、CAPTCHA、MFAは
    依然としてautomationを妨げる可能性があります。もっとも信頼性の高いbrowser制御には、ホスト上のローカルChrome MCPを使うか、
    実際にbrowserを動かしているマシン上でCDPを使ってください。

    ベストプラクティスのセットアップ:

    - 常時稼働のGatewayホスト（VPS/Mac mini）。
    - 役割ごとに1つのagent（binding）。
    - それらのagentにbindされたSlack channel。
    - 必要に応じてChrome MCPまたはNode経由のローカルbrowser。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [Browser](/ja-JP/tools/browser), [Nodes](/ja-JP/nodes).

  </Accordion>
</AccordionGroup>

## モデル、failover、auth profile

モデルQ&A — デフォルト、選択、alias、切り替え、failover、auth profile —
は専用ページへ移動しました:
[FAQ — モデルとauth profile](/ja-JP/help/faq-models).

## Gateway: ポート、「already running」、remote mode

<AccordionGroup>
  <Accordion title="Gatewayはどのポートを使いますか?">
    `gateway.port` は、WebSocket + HTTP（Control UI, hooksなど）用の単一多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='なぜ `openclaw gateway status` は "Runtime: running" なのに "Connectivity probe: failed" と言うのですか?'>
    「running」は**supervisor** の見方（launchd/systemd/schtasks）だからです。connectivity probeはCLIが実際にgateway WebSocketへ接続している結果です。

    `openclaw gateway status` を使い、次の行を信頼してください:

    - `Probe target:`（probeが実際に使ったURL）
    - `Listening:`（そのポートに実際に何がbindされているか）
    - `Last gateway error:`（processは生きているがポートがlistenしていないときによくある根本原因）

  </Accordion>

  <Accordion title='なぜ `openclaw gateway status` に "Config (cli)" と "Config (service)" の違いが出るのですか?'>
    編集しているconfig fileと、serviceが実行しているconfig fileが異なっています（よくあるのは `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    serviceに使わせたいのと同じ `--profile` / environment から実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか?'>
    OpenClawは起動時にWebSocket listenerを即座にbindすることで、ランタイムロックを強制します（デフォルト `ws://127.0.0.1:18789`）。bindが `EADDRINUSE` で失敗すると、別インスタンスがすでにlistenしていることを示す `GatewayLockError` を投げます。

    修正: もう一方のインスタンスを止める、ポートを解放する、または `openclaw gateway --port <port>` で別ポートを使ってください。

  </Accordion>

  <Accordion title="OpenClawをremote mode（別の場所のGatewayへ接続するクライアント）で実行するにはどうすればよいですか?">
    `gateway.mode: "remote"` を設定し、shared-secretなremote credentialを必要に応じて付けて、remote WebSocket URLを指定します:

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

    - `openclaw gateway` は、`gateway.mode` が `local` のときだけ起動します（またはoverride flagを渡したとき）。
    - macOS appはconfig fileを監視し、これらの値が変わるとliveでmodeを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のremote credentialにすぎず、それ自体ではローカルgateway authを有効にしません。

  </Accordion>

  <Accordion title='Control UIが "unauthorized" と言う（または再接続を繰り返す）のですが、どうすればよいですか?'>
    gateway auth pathとUIのauth methodが一致していません。

    事実（コード由来）:

    - Control UIはtokenを現在のbrowser tab sessionと選択したgateway URLごとに `sessionStorage` に保持するため、同一tabでのrefreshは、長期的なlocalStorage token永続化を復元しなくても引き続き動作します。
    - `AUTH_TOKEN_MISMATCH` の場合、trusted clientは、gatewayがretry hint（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返したとき、キャッシュされたdevice tokenで1回だけ再試行できます。
    - このcached-token retryは、現在、device tokenと一緒に保存されたキャッシュ済み承認scopeを再利用します。明示的な `deviceToken` / 明示的な `scopes` を使うcallerは、cached scopeを継承せず、要求したscope setを維持します。
    - そのretry path以外では、connect authの優先順位は、明示的shared token/password、次に明示的 `deviceToken`、次に保存済みdevice token、最後にbootstrap tokenです。
    - bootstrap tokenのscope checkはrole prefix単位です。組み込みのbootstrap operator allowlistはoperator requestだけを満たし、nodeやその他のnon-operator roleでは自分自身のrole prefix下のscopeが引き続き必要です。

    修正:

    - 最速: `openclaw dashboard`（dashboard URLを表示 + コピーし、開こうとします。headlessならSSH hintを表示）。
    - tokenがまだない場合: `openclaw doctor --generate-gateway-token`。
    - remoteなら、まずtunnelします: `ssh -N -L 18789:127.0.0.1:18789 user@host` してから `http://127.0.0.1:18789/` を開く。
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、その一致するsecretをControl UI設定へ貼り付ける。
    - Tailscale Serve mode: `gateway.auth.allowTailscale` が有効であることと、Tailscale identity headerを回避してしまうraw loopback/tailnet URLではなく、Serve URLを開いていることを確認する。
    - trusted-proxy mode: 同一ホストloopback proxyやraw gateway URLではなく、設定済みのnon-loopback identity-aware proxy経由で来ていることを確認する。
    - 1回のretry後も不一致が続く場合は、paired device tokenをrotate/re-approveする:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのrotate callが拒否された場合は、2点確認してください:
      - paired-device sessionは、自分自身のdeviceしかrotateできません。ただし `operator.admin` がある場合は別です
      - 明示的な `--scope` 値は、callerの現在のoperator scopeを超えられません
    - まだ解決しない? `openclaw status --all` を実行し、[Troubleshooting](/ja-JP/gateway/troubleshooting) に従ってください。auth詳細は [Dashboard](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="`gateway.bind tailnet` を設定したのにbindできず、何もlistenしません">
    `tailnet` bindは、ネットワークinterfaceからTailscale IP（100.64.0.0/10）を選びます。マシンがTailscale上にいない（またはinterfaceがdownしている）場合、bindする先がありません。

    修正:

    - そのホストでTailscaleを起動する（100.x addressを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注: `tailnet` は明示指定です。`auto` はloopbackを優先します。tailnet専用bindが欲しい場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホスト上で複数Gatewayを実行できますか?">
    通常は不要です。1つのGatewayで複数のメッセージングchannelとagentを実行できます。複数Gatewayは、冗長性（例: rescue bot）または厳格な分離が必要な場合にのみ使ってください。

    とはいえ可能ですが、次を分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとのconfig）
    - `OPENCLAW_STATE_DIR`（インスタンスごとのstate）
    - `agents.defaults.workspace`（workspace分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使う（自動で `~/.openclaw-<name>` を作成）。
    - 各profile configで一意の `gateway.port` を設定する（または手動実行時に `--port` を渡す）。
    - profileごとのserviceをインストールする: `openclaw --profile <name> gateway install`。

    profileはservice名にもsuffixを付けます（`ai.openclaw.<profile>`。レガシーでは `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`）。
    完全ガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 とはどういう意味ですか?'>
    Gatewayは**WebSocket server** であり、最初のメッセージとして
    `connect` frameを期待します。それ以外を受け取ると、接続を
    **code 1008**（policy violation）で閉じます。

    よくある原因:

    - **HTTP** URLをbrowserで開いた（`http://...`）が、WS clientではなかった。
    - 間違ったportまたはpathを使った。
    - proxyやtunnelがauth headerを剥がした、またはGateway以外のrequestを送った。

    クイック修正:

    1. WS URLを使う: `ws://<host>:18789`（HTTPSなら `wss://...`）。
    2. WS portを通常のbrowser tabで開かない。
    3. authが有効なら、`connect` frameにtoken/passwordを含める。

    CLIやTUIを使う場合、URLは次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコル詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか?">
    file log（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で固定パスを設定できます。file log levelは `logging.level` で制御します。consoleの詳細度は `--verbose` と `logging.consoleLevel` で制御します。

    最速のlog tail:

    ```bash
    openclaw logs --follow
    ```

    service/supervisor log（gatewayがlaunchd/systemd経由で動作している場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`; profileでは `~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳しくは [Troubleshooting](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway serviceを開始/停止/再起動するにはどうすればよいですか?">
    gateway helperを使ってください:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gatewayを手動実行している場合は、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windowsでterminalを閉じてしまいました - OpenClawをどう再起動すればよいですか?">
    Windowsには**2つのインストールモード**があります:

    **1) WSL2（推奨）:** GatewayはLinux内で動作します。

    PowerShellを開き、WSLへ入ってから再起動してください:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    まだserviceをインストールしていない場合は、foregroundで起動します:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows（非推奨）:** GatewayはWindows上で直接動作します。

    PowerShellを開いて次を実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動実行（serviceなし）の場合は次を使います:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gatewayは起動しているのに、返信がまったく届きません。何を確認すべきですか?">
    まずはhealthの確認を一通り実行してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - **gateway host** 上でmodel authが読み込まれていない（`models status` を確認）。
    - channel pairing/allowlistが返信をブロックしている（channel config + logを確認）。
    - WebChat/Dashboardが正しいtokenなしで開かれている。

    remoteなら、tunnel/Tailscale接続が生きていて、
    Gateway WebSocketに到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels), [Troubleshooting](/ja-JP/gateway/troubleshooting), [Remote access](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - どうすればよいですか?'>
    これは通常、UIがWebSocket接続を失ったことを意味します。次を確認してください:

    1. Gatewayは動作中ですか? `openclaw gateway status`
    2. Gatewayは健全ですか? `openclaw status`
    3. UIに正しいtokenがありますか? `openclaw dashboard`
    4. remoteなら、tunnel/Tailscaleリンクは生きていますか?

    その後、logをtailしてください:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard), [Remote access](/ja-JP/gateway/remote), [Troubleshooting](/ja-JP/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegramの `setMyCommands` が失敗します。何を確認すべきですか?">
    まずはlogとchannel statusから始めてください:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに応じて確認します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegramメニューのエントリが多すぎます。OpenClawはすでにTelegram上限まで切り詰めて、少ないコマンドで再試行しますが、それでも一部メニューエントリを落とす必要があります。plugin/skill/custom commandを減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`、または類似のnetwork error: VPS上やproxy背後なら、`api.telegram.org` へのoutbound HTTPSが許可され、DNSが機能していることを確認してください。

    Gatewayがremoteなら、Gatewayホスト上のlogを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [Channel troubleshooting](/ja-JP/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUIに何も出ません。何を確認すべきですか?">
    まずGatewayに到達可能で、agentが実行できることを確認してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI内では、`/status` を使って現在の状態を確認します。chat
    channelへ返信が来ることを期待しているなら、配信が有効か確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [Slash commands](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="Gatewayを完全に停止してから起動するにはどうすればよいですか?">
    serviceをインストール済みなら:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは**監視されたservice**（macOSではlaunchd、Linuxではsystemd）を停止/開始します。
    Gatewayがdaemonとしてバックグラウンド動作している場合に使ってください。

    foregroundで動かしている場合は、Ctrl-Cで止めてから次を実行します:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway service runbook](/ja-JP/gateway).

  </Accordion>

  <Accordion title="ELI5: `openclaw gateway restart` と `openclaw gateway` の違いは?">
    - `openclaw gateway restart`: **バックグラウンドservice**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このterminal session用に、gatewayを**foreground**で実行します。

    serviceをインストールしているならgatewayコマンドを使ってください。一度きりのforeground実行がしたいときは `openclaw gateway` を使ってください。

  </Accordion>

  <Accordion title="何か失敗したとき、最速で詳細を得る方法は?">
    console detailを増やすには、Gatewayを `--verbose` 付きで起動してください。その後、channel auth, model routing, RPC errorについてlog fileを確認してください。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="skillが画像/PDFを生成したのに、何も送信されませんでした">
    agentからのoutbound attachmentには、自身の行に `MEDIA:<path-or-url>` 行が必要です。[OpenClaw assistant setup](/ja-JP/start/openclaw) と [Agent send](/ja-JP/tools/agent-send) を参照してください。

    CLI送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    あわせて確認してください:

    - 対象channelがoutbound mediaをサポートし、allowlistによりブロックされていない。
    - fileがproviderのサイズ上限内である（画像は最大2048pxにリサイズされます）。
    - `tools.fs.workspaceOnly=true` の場合、ローカルパス送信はworkspace、temp/media-store、sandbox検証済みfileに限定されます。
    - `tools.fs.workspaceOnly=false` の場合、agentがすでに読めるホストローカルfileを `MEDIA:` で送れますが、許可されるのはmediaと安全なdocument type（画像、音声、動画、PDF、Office doc）のみです。プレーンテキストやsecret風fileは引き続きブロックされます。

    [Images](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClawを受信DMに公開しても安全ですか?">
    受信DMは信頼されていない入力として扱ってください。デフォルトはリスク低減を意図しています:

    - DM対応channelのデフォルト動作は**pairing**:
      - 未知のsenderにはpairing codeが送られ、botはそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中requestは**channelごとに3件**まで。codeが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DMを公開するには、明示的なオプトイン（`dmPolicy: "open"` と allowlist `"*"`）が必要です。

    リスクの高いDM policyを検出するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="prompt injectionはpublic botだけの問題ですか?">
    いいえ。prompt injectionは**信頼されていないコンテンツ**の問題であり、誰がbotへDMできるかだけの話ではありません。
    assistantが外部コンテンツ（web search/fetch、browser page、email、
    doc、attachment、貼り付けられたlog）を読むなら、
    そのコンテンツにmodelを乗っ取ろうとするinstructionが含まれている可能性があります。これは
    **自分だけがsenderであっても** 起こりえます。

    最大のリスクは、ツールが有効な場合です。modelが
    contextを流出させたり、自分の代わりにツールを呼んだりするよう誘導される可能性があります。影響範囲を減らすには:

    - 信頼されていないコンテンツを要約するために、read-onlyまたはtool無効の「reader」agentを使う
    - ツール有効agentでは `web_search` / `web_fetch` / `browser` をオフに保つ
    - デコード済みfile/document textも信頼しないこと: OpenResponses
      `input_file` とmedia attachment抽出は、どちらも抽出テキストを
      生のfile textとして渡すのではなく、明示的なexternal-content boundary markerでラップします
    - sandboxingと厳密なtool allowlistを使う

    詳細: [Security](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="botには専用のemail、GitHub account、phone numberを持たせるべきですか?">
    はい。ほとんどの構成ではそうすべきです。botを別アカウントや別番号で分離すると、
    問題発生時の影響範囲を減らせます。また、
    個人アカウントに影響を与えずにcredentialをローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを与え、
    必要になったら後から拡張してください。

    ドキュメント: [Security](/ja-JP/gateway/security), [Pairing](/ja-JP/channels/pairing).

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えても大丈夫ですか? 安全ですか?">
    個人メッセージに対する完全な自律性は**推奨しません**。もっとも安全なパターンは次です:

    - DMは**pairing mode** か厳しいallowlistのままにする。
    - 自分の代わりにメッセージさせたいなら、**別の番号またはaccount** を使う。
    - 下書きさせて、**送信前に承認**する。

    試す場合でも、専用accountで行い、分離を保ってください。[Security](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="パーソナルアシスタント用途に、より安いmodelを使えますか?">
    はい。**ただし** agentがchat専用で、入力が信頼できる場合に限ります。小さいtierは
    instruction hijackingの影響を受けやすいため、tool有効agentや
    信頼されていないコンテンツを読む場合には避けてください。小さいmodelを使う必要があるなら、
    ツールを厳しく制限し、sandbox内で実行してください。[Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegramで /start を実行したのにpairing codeが届きませんでした">
    pairing codeは、未知のsenderがbotにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` 単体ではcodeは生成されません。

    保留中requestを確認してください:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分のsender idをallowlistするか、そのaccountで `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先に勝手にメッセージしますか? pairingはどう動きますか?">
    いいえ。デフォルトのWhatsApp DM policyは**pairing**です。未知のsenderにはpairing codeだけが送られ、そのメッセージは**処理されません**。OpenClawが返信するのは、自分が受け取ったchatか、自分が明示的にトリガーした送信だけです。

    pairingの承認方法:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中requestの一覧:

    ```bash
    openclaw pairing list whatsapp
    ```

    wizardのphone numberプロンプト: これは自分自身の**allowlist/owner** を設定して、自分のDMを許可するために使われます。自動送信には使われません。個人のWhatsApp番号で運用する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスク中止、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがchatに表示されないようにするにはどうすればよいですか?">
    ほとんどの内部またはtoolメッセージは、そのsessionで**verbose**、**trace**、**reasoning** が有効なときにだけ表示されます。

    表示されているchatで修正してください:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもうるさい場合は、Control UIでsession設定を確認し、verbose
    を**inherit** に設定してください。また、configで `verboseDefault` が
    `on` に設定されたbot profileを使っていないことも確認してください。

    ドキュメント: [Thinking and verbose](/ja-JP/tools/thinking), [Security](/ja-JP/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="実行中タスクを止める/キャンセルするにはどうすればよいですか?">
    次のいずれかを**単独メッセージ**として送ってください（slashなし）:

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

    これらはabort triggerであり（slash commandではありません）。

    background process（exec tool由来）の場合、agentに次を実行させてください:

    ```
    process action:kill sessionId:XXX
    ```

    slash commandの概要: [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのcommandは、`/` で始まる**単独**メッセージとして送る必要がありますが、一部のshortcut（`/status` など）はallowlist済みsenderならinlineでも機能します。

  </Accordion>

  <Accordion title='TelegramからDiscordへメッセージを送るにはどうすればよいですか?（"Cross-context messaging denied"）'>
    OpenClawはデフォルトで**cross-provider** メッセージングをブロックします。Telegramにbindされたtool callは、
    明示的に許可しない限りDiscordへ送信しません。

    agent向けにcross-provider messagingを有効化します:

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

    config編集後にgatewayを再起動してください。

  </Accordion>

  <Accordion title='なぜbotが高速連投メッセージを「無視」しているように感じるのですか?'>
    queue modeが、in-flight run中に新しいメッセージをどう扱うかを制御します。mode変更には `/queue` を使ってください:

    - `steer` - 新しいメッセージが現在のタスクを方向転換する
    - `followup` - メッセージを1件ずつ順番に実行する
    - `collect` - メッセージをまとめて一度だけ返信する（デフォルト）
    - `steer-backlog` - まず方向転換し、その後backlogを処理する
    - `interrupt` - 現在のrunを中断して新しく開始する

    followup modeでは `debounce:2s cap:25 drop:summarize` のようなoptionも追加できます。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='AnthropicでAPI keyを使う場合のデフォルトmodelは何ですか?'>
    OpenClawでは、credentialとmodel選択は別です。`ANTHROPIC_API_KEY` を設定する（またはAnthropic API keyをauth profileに保存する）と認証は有効になりますが、実際のデフォルトmodelは `agents.defaults.model.primary` に設定したものです（例: `anthropic/claude-sonnet-4-6` または `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` と表示される場合、それはGatewayが実行中agent向けの期待された `auth-profiles.json` からAnthropic credentialを見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか? [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [FAQ — quick start and first-run setup](/ja-JP/help/faq-first-run)
- [FAQ — models and auth profiles](/ja-JP/help/faq-models)
- [Troubleshooting](/ja-JP/help/troubleshooting)
