---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートの質問への回答
    - より深いデバッグの前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-06-27T11:42:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

実運用のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのクイック回答と、より深いトラブルシューティングです。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れている場合の最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/service の到達性、エージェント/セッション、プロバイダー設定 + ランタイム問題（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾を含む読み取り専用診断（トークンは伏せ字）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャンネルプローブも含め、ライブ Gateway ヘルスプローブを実行します
   （到達可能な Gateway が必要です）。[ヘルス](/ja-JP/gateway/health)を参照してください。

5. **最新ログを追尾**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health)を参照してください。

## クイックスタートと初回セットアップ

初回実行のQ&A — インストール、オンボーディング、認証ルート、サブスクリプション、初期障害 —
は[初回実行FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは、一段落で言うと何ですか？">
    OpenClaw は、自分のデバイス上で実行するパーソナル AI アシスタントです。すでに使っているメッセージング画面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネル Plugin）で返信でき、サポート対象プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは **ローカルファーストのコントロールプレーン** であり、すでに使っているチャットアプリから到達できる高機能なアシスタントを **自分のハードウェア** 上で実行できます。ステートフルなセッション、メモリー、ツールを備え、ワークフローの制御をホスト型 SaaS に渡す必要はありません。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実際のチャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、サポート対象プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティングとフェイルオーバーで使用できます。
    - **ローカル専用オプション:** 必要に応じてローカルモデルを実行し、**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとにエージェントを分け、それぞれ独自のワークスペースとデフォルトを持たせられます。
    - **オープンソースで拡張可能:** ベンダーロックインなしで、調査、拡張、セルフホストができます。

    Docs: [Gateway](/ja-JP/gateway), [チャンネル](/ja-JP/channels), [マルチエージェント](/ja-JP/concepts/multi-agent),
    [メモリー](/ja-JP/concepts/memory).

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトとして適しているもの:

    - Web サイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリのプロトタイプを作る（概要、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも処理できますが、フェーズに分割し、並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な上位5つのユースケースは何ですか？">
    日常的な効果は通常、次のような形で現れます:

    - **個人向けブリーフィング:** 受信トレイ、カレンダー、関心のあるニュースの要約。
    - **リサーチと下書き:** 簡単なリサーチ、要約、メールやドキュメントの初稿。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の通知やチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携:** スマートフォンからタスクを送信し、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    **リサーチ、評価、下書き**には役立ちます。サイトをスキャンし、候補リストを作成し、見込み客を要約し、アウトリーチや広告コピーの下書きを書けます。

    **アウトリーチや広告配信**では、人間の確認を挟んでください。スパムを避け、地域の法律とプラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、OpenClaw に下書きさせ、自分が承認することです。

    Docs: [セキュリティ](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **パーソナルアシスタント** かつ連携レイヤーであり、IDE の置き換えではありません。リポジトリ内で最速の直接コーディングループを回すには Claude Code や Codex を使ってください。永続的なメモリー、デバイス横断アクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたぐ **永続メモリー + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働の Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/実行用の **ノード**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを dirty に保たずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ側のコピーを編集する代わりに、管理対象のオーバーライドを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置いてください（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` なので、管理対象オーバーライドは git に触れずに同梱 Skills より優先されます。Skill をグローバルにインストールする必要があるが一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。上流に送る価値のある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次回セッションでそれを `<workspace>/skills` として扱います。Skill を特定のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルや設定を使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです:

    - **Cron ジョブ**: 分離されたジョブは、ジョブごとに `model` オーバーライドを設定できます。
    - **エージェント**: タスクを、異なるデフォルトモデル、思考レベル、ストリームパラメーターを持つ別々のエージェントにルーティングします。
    - **オンデマンド切り替え**: `/model` を使うと、現在のセッションモデルをいつでも切り替えられます。

    たとえば、同じモデルを異なるエージェントごとの設定で使います:

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

    共有のモデルごとのデフォルトは `agents.defaults.models["provider/model"].params` に置き、エージェント固有のオーバーライドはフラットな `agents.list[].params` に置きます。同じモデルに対して、別々のネストした `agents.list[].models["provider/model"].params` エントリを定義しないでください。`agents.list[].models` は、エージェントごとのモデルカタログとランタイムオーバーライド用です。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[設定](/ja-JP/gateway/config-agents)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうオフロードすればよいですか？">
    長いタスクや並列タスクには **サブエージェント** を使います。サブエージェントは独自のセッションで実行され、要約を返し、メインのチャットを応答可能なままにします。

    ボットに「このタスクのためにサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が現在何をしているか（およびビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、`agents.defaults.subagents.model` でサブエージェント用の安価なモデルを設定します。

    Docs: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks).

  </Accordion>

  <Accordion title="Discord でスレッドに紐づくサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッションターゲットにバインドでき、そのスレッド内のフォローアップメッセージはバインドされたセッションに留まります。

    基本フロー:

    - `thread: true` を指定して `sessions_spawn` で起動します（永続的なフォローアップには必要に応じて `mode: "session"` も指定）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動アンフォーカスを制御します。
    - `/unfocus` でスレッドを切り離します。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSessions` はデフォルトで `true` です。スレッドに紐づくセッション起動を無効にするには `false` に設定します。

    Docs: [サブエージェント](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [設定リファレンス](/ja-JP/gateway/configuration-reference), [スラッシュコマンド](/ja-JP/tools/slash-commands).

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了更新が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決済みの要求元ルートを確認します:

    - 完了モードのサブエージェント配信は、存在する場合、バインドされたスレッドまたは会話ルートを優先します。
    - 完了の発生元がチャンネルしか保持していない場合、OpenClaw は要求元セッションに保存されたルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が引き続き成功する可能性があります。
    - バインドされたルートも使用可能な保存済みルートも存在しない場合、直接配信は失敗する可能性があり、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューフォールバックや最終配信失敗が強制されることがあります。
    - 子の最後の可視アシスタント返信が正確にサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` である場合、OpenClaw は古い以前の進捗を投稿する代わりに、意図的にアナウンスを抑制します。
    - tool/toolResult 出力は子の結果テキストに昇格されません。結果は子の最新の可視アシスタント返信です。

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents), [バックグラウンドタスク](/ja-JP/automation/tasks), [セッションツール](/ja-JP/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron またはリマインダーが実行されません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効 (`cron.enabled`) で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認する。
    - Gateway が 24/7 稼働していることを確認する（スリープや再起動がないこと）。
    - ジョブのタイムゾーン設定を確認する（`--tz` とホストのタイムゾーン）。

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化](/ja-JP/automation).

  </Accordion>

  <Accordion title="Cron は実行されましたが、チャネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が想定されていないことを意味します。
    - 通知先 (`channel` / `to`) がない、または無効な場合、ランナーは外向き配信をスキップしたことを意味します。
    - チャネル認証エラー (`unauthorized`, `Forbidden`) は、ランナーが配信を試みたものの認証情報によりブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、ランナーはキュー済みフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャットルートが利用可能な場合、エージェントは引き続き `message`
    ツールで直接送信できます。`--announce` は、エージェントがすでに送信していない最終テキストに対するランナーの
    フォールバック経路だけを制御します。

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [バックグラウンドタスク](/ja-JP/automation/tasks).

  </Accordion>

  <Accordion title="分離 Cron 実行でモデルが切り替わったり、一度リトライされたりしたのはなぜですか？">
    それは通常、重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離 Cron は、アクティブな
    実行が `LiveSessionModelSwitchError` を投げたときに、ランタイムモデルの引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイルの上書きが含まれていた場合、Cron は
    リトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデル上書きが最初に優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの Cron セッションモデル上書き。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。最初の試行に加えて 2 回の切り替えリトライ後、
    Cron は無限ループせず中止します。

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [cron CLI](/ja-JP/cli/cron).

  </Accordion>

  <Accordion title="Linux に Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、Skills をワークスペースに配置します。macOS の Skills UI は Linux では利用できません。
    Skills は [https://clawhub.ai](https://clawhub.ai) で閲覧できます。

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

    ネイティブの `openclaw skills install` は、デフォルトでアクティブなワークスペースの `skills/`
    ディレクトリに書き込みます。すべてのローカルエージェントで共有される管理対象
    Skills ディレクトリにインストールするには、`--global` を追加します。独自の Skills を公開または同期したい場合にのみ、
    別個の `clawhub` CLI をインストールしてください。共有 Skills を表示できるエージェントを絞り込みたい場合は、
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに従って、またはバックグラウンドで継続的にタスクを実行できますか？">
    はい。Gateway スケジューラーを使用します:

    - **Cron ジョブ**: スケジュール済みまたは繰り返しタスク用（再起動後も保持）。
    - **Heartbeat**: 「メインセッション」の定期チェック用。
    - **分離ジョブ**: サマリーを投稿したりチャットへ配信したりする自律エージェント用。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs), [自動化](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限され、Skills は **Gateway ホスト** 上で対象条件を満たす場合にのみシステムプロンプトに表示されます。Linux では、ゲーティングを上書きしない限り、`darwin` 専用 Skills（`apple-notes`, `apple-reminders`, `things-mac` など）は読み込まれません。

    サポートされるパターンは 3 つあります:

    **Option A - Mac で Gateway を実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から [リモートモード](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **Option B - macOS Node を使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac 上の **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node に存在する場合、OpenClaw は macOS 専用 Skills を対象として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選択した場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **Option C - macOS バイナリを SSH 経由でプロキシする（上級者向け）。**
    Gateway は Linux 上に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill を上書きして Linux を許可し、対象条件を満たす状態に保ちます。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホスト上の `PATH` にラッパーを配置します（例: `~/bin/memo`）。
    3. Skill メタデータ（ワークスペースまたは `~/.openclaw/skills`）を上書きして Linux を許可します:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットが更新されるように、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion または HeyGen の統合はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API を提供しています）。
    - **ブラウザー自動化:** コードなしで機能しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、単純なパターンは次のとおりです:

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼する。

    ネイティブ統合が必要な場合は、機能リクエストを開くか、それらの API を対象にした Skill を
    構築してください。

    Skills をインストールする:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。すべてのローカルエージェントで Skills を共有するには、`openclaw skills install @owner/<skill-slug> --global` を使用します（または `~/.openclaw/skills/<name>/SKILL.md` に手動で配置します）。一部のエージェントだけが共有インストールを表示すべき場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定します。Linux では Linuxbrew を意味します（上の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    Chrome DevTools MCP 経由で接続する組み込みの `user` ブラウザープロファイルを使用します:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名が必要な場合は、明示的な MCP プロファイルを作成します:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシン上で Node ホストを実行するか、代わりにリモート CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker は制限が多く感じます。全機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、またはバンドルされたブラウザーは含まれていません。より完全なセットアップには:

    - キャッシュが残るように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_IMAGE_APT_PACKAGES` でシステム依存関係をイメージに組み込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker), [ブラウザー](/ja-JP/tools/browser).

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャネルセッション（非 main キー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人用 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスのファイルシステム壁を迂回することを覚えておいてください。

    OpenClaw は、正規化されたパスと、存在する最も深い祖先を通じて解決された canonical パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は fail closed し、シンボリックリンク解決後も許可ルートチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルです:

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の整理済み長期ノート（main/プライベートセッションのみ）

    OpenClaw は、auto-compaction の前に永続的なノートを書くようモデルに促すため、
    **サイレントな Compaction 前メモリフラッシュ** も実行します。これはワークスペースが
    書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。どうすれば定着させられますか？">
    ボットに**その事実をメモリへ書き込む**よう依頼してください。長期メモは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。モデルにメモリを保存するよう促すと役立ちます。
    何をすべきかはモデルが理解しています。忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使っていることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上にあり、削除するまで保持されます。制限になるのは
    モデルではなくストレージです。**セッションコンテキスト**は引き続きモデルの
    コンテキストウィンドウによって制限されるため、長い会話は compact または truncate されることがあります。
    そのためメモリ検索があります - 関連する部分だけをコンテキストへ戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI 埋め込み**を使う場合のみ必要です。Codex OAuth はチャット/補完を対象としており、
    埋め込みアクセスは付与**しません**。そのため、**Codex でサインイン（OAuth または
    Codex CLI ログイン）**しても、セマンティックメモリ検索には役立ちません。OpenAI 埋め込みには
    実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が引き続き必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は OpenAI 埋め込みを使います。まだ
    `memorySearch.provider = "auto"` と記載されているレガシー設定も OpenAI に解決されます。
    OpenAI API キーが利用できない場合、キーを設定するか別のプロバイダーを明示的に選択するまで、
    セマンティックメモリ検索は利用不可のままです。

    ローカルに留めたい場合は、`memorySearch.provider = "local"`（必要に応じて
    `memorySearch.fallback = "none"`）を設定してください。Gemini 埋め込みを使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。**OpenAI、OpenAI 互換、Gemini、
    Voyage、Mistral、Bedrock、Ollama、LM Studio、GitHub Copilot、DeepInfra、または local**
    埋め込みモデルをサポートしています - セットアップ詳細は [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使うすべてのデータはローカルに保存されますか？">
    いいえ - **OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上
      （`~/.openclaw` + ワークスペースディレクトリ）にあります。
    - **必要上リモート:** モデルプロバイダー（Anthropic/OpenAI など）へ送るメッセージは
      それらの API に送信され、チャットプラットフォーム（WhatsApp/Telegram/Slack など）は
      メッセージデータを各社サーバーに保存します。
    - **フットプリントは自分で制御:** ローカルモデルを使うとプロンプトは自分のマシンに留まりますが、
      チャンネルのトラフィックは引き続きチャンネルのサーバーを経由します。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー向けの任意のファイルバック secret ペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリは削除済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシー単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace`（デフォルト: `~/.openclaw/workspace`）で設定されます。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      小文字ルートの `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャンネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が起動のたびに同じ
    ワークスペースを使っていることを確認してください（また、リモートモードではローカルのノート PC ではなく
    **gateway ホストの**ワークスペースを使う点に注意してください）。

    ヒント: 持続的な挙動や設定を残したい場合は、チャット履歴に頼るのではなく、
    ボットに**AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="SOUL.md を大きくできますか？">
    はい。`SOUL.md` は、エージェントコンテキストへ注入されるワークスペースブートストラップファイルの 1 つです。
    デフォルトのファイル単位の注入上限は `20000` 文字で、
    ファイル全体にまたがる合計ブートストラップ予算は `60000` 文字です。

    OpenClaw 設定で共有デフォルトを変更してください。

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

    または、1 つのエージェントを上書きします。

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

    `/context` を使って、生のサイズと注入後のサイズ、切り詰めが発生したかを確認してください。
    `SOUL.md` は声、スタンス、人格に集中させ、運用ルールは
    `AGENTS.md` に、持続的な事実はメモリに入れてください。

    [コンテキスト](/ja-JP/concepts/context) と [エージェント設定](/ja-JP/gateway/config-agents) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**private**な git リポジトリに置き、どこか
    private な場所（たとえば GitHub private）にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化された secret ペイロード）は
    **コミットしないでください**。
    完全に復元する必要がある場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルト cwd**かつメモリの基点であり、強いサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックスが有効でない限り、絶対パスでは他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。
    あるリポジトリをデフォルト作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けてください。OpenClaw リポジトリは単なるソースコードです。
    エージェントにその中で作業させたい意図がない限り、ワークスペースは分けておいてください。

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
    セッション状態は**gateway ホスト**が所有します。リモートモードの場合、関係するセッションストアはローカルのノート PC ではなく、リモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** 設定を読み込みます。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、そこそこ安全なデフォルト（`~/.openclaw/workspace` のデフォルトワークスペースを含む）を使います。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら何も listen しない / UI が unauthorized と表示します'>
    非ループバック bind には**有効な gateway 認証パスが必要です**。実際には次のいずれかを意味します。

    - 共有 secret 認証: token または password
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

    注:

    - `gateway.remote.token` / `.password` は、それだけではローカル gateway 認証を有効に**しません**。
    - ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合のみ `gateway.remote.*` を fallback として使えます。
    - password 認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は fail closed します（リモート fallback による隠蔽はありません）。
    - 共有 secret の Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような ID を持つモードは、代わりにリクエストヘッダーを使います。共有 secret を URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストのループバックリバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内のループバックエントリが必要です。

  </Accordion>

  <Accordion title="なぜ localhost でも token が必要になったのですか？">
    OpenClaw は、ループバックを含め、デフォルトで gateway 認証を強制します。通常のデフォルトパスでは token 認証を意味します。明示的な認証パスが設定されていない場合、gateway 起動時に token モードへ解決され、その起動専用の runtime-only token が生成されるため、**ローカル WS クライアントは認証する必要があります**。クライアントが再起動をまたいで安定した secret を必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを使いたい場合は、パスワードモード（または、ID 対応のリバースプロキシ向けには `trusted-proxy`）を明示的に選択できます。open loopback を**本当に**使いたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定変更後に再起動は必要ですか？">
    Gateway は設定を監視し、ホットリロードをサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動する
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="CLI の面白いタグラインを無効にするには？">
    設定で `cli.banner.taglineMode` を設定します:

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
    - `random`: 面白い/季節限定のタグラインをローテーションします（デフォルト動作）。
    - バナーをまったく表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web フェッチ）を有効にするには？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します:

    - Brave、Exa、Firecrawl、Gemini、Kimi、MiniMax Search、Perplexity、Tavily などの API バックエンドのプロバイダーには、通常の API キー設定が必要です。
    - Grok はモデル認証の xAI OAuth を再利用できます。または `XAI_API_KEY` / Plugin の Web 検索設定にフォールバックできます。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使用し、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベースの統合です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行し、プロバイダーを選択してください。
    環境変数の代替手段:

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

    プロバイダー固有の Web 検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。
    レガシーの `tools.web.search.*` プロバイダーパスは互換性のため一時的にまだ読み込まれますが、新しい設定では使用しないでください。
    Firecrawl の Web フェッチフォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` 配下にあります。

    注記:

    - allowlist を使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` が省略された場合、OpenClaw は利用可能な認証情報から、最初に準備済みのフェッチフォールバックプロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消してしまいました。復旧し、回避するには？">
    `config.apply` は**設定全体**を置き換えます。部分オブジェクトを送信すると、それ以外はすべて
    削除されます。

    現在の OpenClaw は、多くの偶発的な上書きを防ぎます:

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動やホットリロードが壊れた場合、Gateway は fail closed するかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担い、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、最後に正常だった設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - 有効な設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャネル/モデルを再設定します。
    - これが想定外だった場合は、バグを報告し、最後に確認できている設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。これは浅いスキーマノードと、ドリルダウン用の直下の子要素サマリーを返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置き換え専用にしてください。
    - エージェント実行からエージェント向けの `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは拒否されます（同じ保護された exec パスへ正規化されるレガシー `tools.bash.*` エイリアスを含む）。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定変更](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいだ専門ワーカー付きの中央 Gateway を実行するには？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に**ノード**と**エージェント**を組み合わせる形です:

    - **Gateway（中央）:** チャネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **ノード（デバイス）:** Macs/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特別な役割（例: 「Hetzner 運用」、「個人データ」）向けの独立した頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要なときに、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [ノード](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw ブラウザーはヘッドレスで実行できますか？">
    はい。これは設定オプションです:

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

    デフォルトは `false`（ヘッドフル）です。ヘッドレスは、一部のサイトでボット対策チェックを誘発しやすくなります。[ブラウザー](/ja-JP/tools/browser) を参照してください。

    ヘッドレスは**同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです:

    - 表示されるブラウザーウィンドウがありません（表示が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトはヘッドレスモードでの自動化に対してより厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使用するには？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    詳細な設定例は [ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="Telegram、Gateway、ノード間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway がエージェントを実行し、
    ノードツールが必要な場合にのみ **Gateway WebSocket** 経由でノードを呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    ノードは受信プロバイダートラフィックを見ません。ノード RPC 呼び出しだけを受信します。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは自分のコンピューターにどうアクセスできますか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、
    Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的な設定:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**SSH 経由のリモート**モード（または直接 tailnet）で接続して、
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティリマインダー: macOS ノードをペアリングすると、そのマシン上で `system.run` が許可されます。信頼できる
    デバイスだけをペアリングし、[セキュリティ](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [ノード](/ja-JP/nodes)、[Gateway プロトコル](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続済みですが返信がありません。次に何をすればよいですか？">
    基本を確認します:

    - Gateway が実行中: `openclaw gateway status`
    - Gateway のヘルス: `openclaw status`
    - チャネルのヘルス: `openclaw channels status`

    次に認証とルーティングを確認します:

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認します。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス（ローカル + VPS）を相互に通信させられますか？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます:

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送信し、Bot B に通常どおり返信させます。

    **CLI ブリッジ（汎用）:** `openclaw agent --message ... --deliver` で別の Gateway を呼び出すスクリプトを実行し、別のボットが
    待ち受けているチャットを対象にします。一方のボットがリモート VPS 上にある場合は、
    SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote) を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないようにガードレールを追加してください（メンションのみ、チャネル
    allowlist、または「ボットメッセージに返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェント CLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストでき、それぞれが独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これは通常の構成であり、エージェントごとに 1 つの VPS を実行するよりもはるかに安価で簡単です。

    ハードな分離（セキュリティ境界）や、共有したくない非常に
    異なる設定が必要な場合にのみ、別々の VPS を使用してください。それ以外の場合は、1 つの Gateway を維持し、
    複数のエージェントまたはサブエージェントを使用してください。

  </Accordion>

  <Accordion title="個人用ラップトップにノードを使うと、VPS から SSH する場合より利点がありますか？">
    はい。ノードはリモート Gateway からラップトップへ到達するための第一級の方法であり、
    シェルアクセス以上の機能を有効にします。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスの機器で十分です。RAM は 4 GB あれば十分です）。そのため、
    常時稼働ホストに加えてラップトップをノードとして使う構成が一般的です。

    - **インバウンド SSH は不要です。** ノードは Gateway WebSocket へ外向きに接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run` はそのラップトップ上のノード許可リスト/承認によって制限されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザ自動化。** Gateway は VPS 上に置いたまま、ラップトップ上のノードホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続できます。

    SSH はその場限りのシェルアクセスには問題ありませんが、継続的なエージェントワークフローや
    デバイス自動化にはノードのほうが単純です。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[ブラウザ](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合を除き、ホストごとに実行する **gateway** は 1 つだけにしてください（[複数の gateway](/ja-JP/gateway/multiple-gateways) を参照）。ノードは gateway に接続する周辺機器です
    （iOS/Android ノード、またはメニューバーアプリの macOS「ノードモード」）。ヘッドレスのノード
    ホストと CLI 制御については、[ノードホスト CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、ホストされる Plugin サーフェスの変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子の要約とともに調べます
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 完全な設定を検証して置き換えます。可能な場合はホットリロードし、必要な場合は再起動します
    - エージェント向けの `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは同じ保護対象の exec パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これによりワークスペースを設定し、ボットをトリガーできる相手を制限します。

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
    3. **MagicDNS を有効化（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を持たせます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS 上で Tailscale Serve を使います。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway はループバックにバインドされたまま、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨構成:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **macOS アプリをリモートモードで使います**（SSH ターゲットには tailnet ホスト名を使えます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. gateway で **ノードを承認** します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のラップトップにインストールすべきですか、それともノードを追加するだけでよいですか？">
    2 台目のラップトップで **ローカルツール**（screen/camera/exec）だけが必要な場合は、
    **ノード** として追加してください。これにより Gateway を 1 つに保ち、設定の重複を避けられます。ローカルノードツールは
    現在 macOS のみですが、他の OS にも拡張する予定です。

    **強い分離** または完全に別々の 2 つのボットが必要な場合にのみ、2 つ目の Gateway をインストールしてください。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに次も読み込みます。

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。
    プロバイダー認証情報の変数はワークスペース `.env` の例外です。
    `GEMINI_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY` などのキーはワークスペース
    `.env` からは無視され、プロセス環境、`~/.openclaw/.env`、または設定の `env` に置く必要があります。

    設定内でインライン環境変数を定義することもできます（プロセス環境に存在しない場合のみ適用されます）。

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
    一般的な修正は 2 つあります。

    1. 不足しているキーを `~/.openclaw/.env` に入れると、サービスがシェル環境を継承しない場合でも取得されます。
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

    これはログインシェルを実行し、不足している想定キーだけをインポートします（上書きはしません）。対応する環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **シェル環境インポート** が有効かどうかを報告します。"Shell env: off"
    は環境変数が不足しているという意味では **ありません**。OpenClaw がログインシェルを
    自動的には読み込まないという意味だけです。

    Gateway がサービス（launchd/systemd）として実行されている場合、シェル
    環境は継承されません。次のいずれかで修正してください。

    1. トークンを `~/.openclaw/.env` に入れます。

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. またはシェルインポートを有効化します（`env.shellEnv.enabled: true`）。
    3. または設定の `env` ブロックに追加します（存在しない場合のみ適用）。

    その後 gateway を再起動し、再確認します。

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN` も可）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    `/new` または `/reset` を単独のメッセージとして送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは **デフォルトでは無効** です（デフォルトは **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効な場合、アイドル期間後の **次の**
    メッセージがそのチャットキーの新しいセッション ID を開始します。
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
    はい、**マルチエージェントルーティング** と **サブエージェント** 経由で可能です。1 つのコーディネーター
    エージェントと、独自のワークスペースとモデルを持つ複数のワーカーエージェントを作成できます。

    とはいえ、これは **楽しい実験** として見るのが最適です。トークン消費が大きく、多くの場合、
    別々のセッションを持つ 1 つのボットを使うより効率が落ちます。私たちが想定する典型的なモデルは、
    会話相手となる 1 つのボットがあり、並行作業には異なるセッションを使うというものです。その
    ボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルによって Compaction または切り詰めが発生することがあります。

    役立つこと:

    - 現在の状態を要約してファイルに書き出すようボットに依頼します。
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

    非対話の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します。

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - オンボーディングは既存設定を検出した場合にも **リセット** を提示します。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir をリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ます。リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使います。

    - **Compact**（会話は保持し、古いターンを要約します）:

      ```
      /compact
      ```

      または要約を誘導するために `/compact <instructions>` を使います。

    - **リセット**（同じチャットキーに新しいセッション ID）:

      ```
      /new
      /reset
      ```

    繰り返し発生する場合:

    - **セッションプルーニング**（`agents.defaults.contextPruning`）を有効化または調整し、古いツール出力を削ります。
    - より大きなコンテキストウィンドウを持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッションプルーニング](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これはプロバイダーの検証エラーです。モデルが必須の `input` なしで `tool_use` ブロックを出力しました。
    通常はセッション履歴が古いか破損していることを意味します（長いスレッドやツール/スキーマ変更後に多く発生します）。

    修正: `/new`（単独メッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
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

    `HEARTBEAT.md` が存在していても実質的に空（空行のみ、
    Markdown/HTML コメント、`# Heading` のような Markdown 見出し、フェンスマーカー、
    または空のチェックリストスタブ）の場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。
    ファイルがない場合でも、Heartbeat は実行され、モデルが何をするかを判断します。

    エージェントごとのオーバーライドには `agents.list[].heartbeat` を使用します。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClaw は**自分のアカウント**で実行されるため、自分がグループに参加していれば OpenClaw はそれを見ることができます。
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
    オプション 1（最速）: ログを追尾し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに構成済み/許可リスト済みの場合）: 構成からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/ja-JP/cli/directory), [Logs](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります:

    - メンションゲーティングがオンになっている（デフォルト）。ボットを @mention する（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで構成しており、そのグループが許可リストにありません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションにまとめられます。グループ/チャンネルには独自のセッションキーがあり、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="いくつのワークスペースとエージェントを作成できますか？">
    厳密な上限はありません。数十（数百でも）問題ありませんが、次に注意してください:

    - **ディスク増加:** セッション + トランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** エージェントが増えるほど、同時モデル使用量が増えます。
    - **運用オーバーヘッド:** エージェントごとの認証プロファイル、ワークスペース、チャンネルルーティング。

    ヒント:

    - エージェントごとに**アクティブな**ワークスペースを 1 つに保ちます（`agents.defaults.workspace`）。
    - ディスクが増えた場合は、古いセッションを削除します（JSONL またはストアエントリを削除）。
    - `openclaw doctor` を使用して、不要なワークスペースやプロファイル不一致を見つけます。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）、またどのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使用して、複数の分離されたエージェントを実行し、受信メッセージを
    チャンネル/アカウント/ピアごとにルーティングします。Slack はチャンネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。アンチボット、CAPTCHA、MFA は
    依然として自動化をブロックする可能性があります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使用するか、
    実際にブラウザーを実行するマシンで CDP を使用します。

    ベストプラクティス設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに 1 エージェント（バインディング）。
    - それらのエージェントにバインドされた Slack チャンネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [ブラウザー](/ja-JP/tools/browser), [ノード](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデル Q&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は [モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が「Runtime: running」と表示するのに「Connectivity probe: failed」と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**の視点（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に Gateway WebSocket に接続するものです。

    `openclaw gateway status` を使用し、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使用した URL）
    - `Listening:`（ポートに実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートがリッスンしていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が異なるのはなぜですか？'>
    サービスが別の構成ファイルで実行されている間に、別の構成ファイルを編集しています（多くの場合 `--profile` / `OPENCLAW_STATE_DIR` の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使用させたい同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は起動時に WebSocket リスナーを即座にバインドすることでランタイムロックを適用します（デフォルト `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗した場合、別のインスタンスがすでにリッスンしていることを示す `GatewayLockError` をスローします。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート資格情報を指定してリモート WebSocket URL を指します:

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

    - `openclaw gateway` は `gateway.mode` が `local` の場合（またはオーバーライドフラグを渡した場合）にのみ起動します。
    - macOS アプリは構成ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート資格情報のみです。それ自体でローカル Gateway 認証を有効にするものではありません。

  </Accordion>

  <Accordion title='Control UI が「unauthorized」と表示する（または再接続を続ける）場合はどうすればよいですか？'>
    Gateway の認証パスと UI の認証方法が一致していません。

    事実（コードから）:

    - Control UI は現在のブラウザータブセッションと選択された Gateway URL 用のトークンを `sessionStorage` に保持するため、同じタブの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返す場合、信頼済みクライアントはキャッシュ済みデバイストークンで 1 回だけ制限付き再試行を試みることができます。
    - そのキャッシュトークン再試行は、デバイストークンとともに保存されたキャッシュ済み承認スコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、キャッシュ済みスコープを継承せず、要求したスコープセットを維持します。
    - その再試行パス以外では、接続認証の優先順位は明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンです。
    - 組み込みのセットアップコードブートストラップはノード専用です。承認後、`scopes: []` のノードデバイストークンを返し、引き渡されたオペレータートークンは返しません。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力 + コピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効になっており、Tailscale ID ヘッダーを迂回する生のループバック/tailnet URL ではなく Serve URL を開いていることを確認してください。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、構成済みの ID 対応プロキシ経由で来ていることを確認してください。同一ホストのループバックプロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリングされたデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の 2 点を確認してください:
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自分自身の**デバイスのみローテーションできます
      - 明示的な `--scope` 値は、呼び出し元の現在のオペレータースコープを超えることはできません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind tailnet を設定しましたが、バインドできず何もリッスンしません">
    `tailnet` バインドはネットワークインターフェイスから Tailscale IP を選びます（100.64.0.0/10）。マシンが Tailscale 上にない（またはインターフェイスがダウンしている）場合、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動します（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` はループバックを優先します。tailnet 専用バインドが必要な場合は `gateway.bind: "tailnet"` を使用してください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャンネルとエージェントを実行できます。冗長性（例: レスキューボット）または強い分離が必要な場合にのみ、複数の Gateway を使用してください。

    可能ですが、分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの構成）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイック設定（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使用します（`~/.openclaw-<name>` を自動作成）。
    - 各プロファイル構成で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`; レガシー `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`）。
    完全ガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージが
    `connect` フレームであることを期待します。それ以外を受信すると、接続を
    **コード 1008**（ポリシー違反）で閉じます。

    よくある原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使用した。
    - プロキシまたはトンネルが認証ヘッダーを取り除いた、または Gateway ではないリクエストを送信した。

    クイック修正:

    1. WS URL を使用します: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証がオンの場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使用している場合、URL は次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコル詳細: [Gateway プロトコル](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` で安定したパスを設定できます。ファイルログレベルは `logging.level` で制御します。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御します。

    最速のログ追尾:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ（Gateway が launchd/systemd 経由で実行されている場合）:

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log`（プロファイルは `gateway-<profile>.log` を使用します。stderr は抑制されます）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    Gateway ヘルパーを使用します:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました - OpenClaw を再起動するにはどうすればよいですか？">
    **Windows のインストールモードは 3 つ**あります:

    **1) Windows Hub ローカルセットアップ:** ネイティブアプリが、ローカルのアプリ所有 WSL Gateway を管理します。

    スタートメニューまたはトレイから **OpenClaw Companion** を開き、
    **Gateway Setup** または接続タブを使用します。

    **2) 手動 WSL2 Gateway:** Gateway は Linux 内で実行されます。

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

    **3) ネイティブ Windows CLI/Gateway:** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行している場合（サービスなし）は、次を使用します:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows](/ja-JP/platforms/windows), [Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが返信が届きません。何を確認すべきですか？">
    まず簡単なヘルスチェックから始めます:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - モデル認証が **gateway host** に読み込まれていない（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定 + ログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が起動しており、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 次にどうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください:

    1. Gateway は実行中ですか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI に正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは起動していますか？

    次にログを追尾します:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard), [リモートアクセス](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ログとチャンネルステータスから始めます:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限まで切り詰め、コマンド数を減らして再試行しますが、一部のメニュー項目はまだ削除する必要があります。plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上またはプロキシ背後にいる場合は、アウトバウンド HTTPS が許可されており、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず Gateway に到達でき、エージェントが実行できることを確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI で `/status` を使用して現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui), [スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから開始するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視対象サービス**（macOS の launchd、Linux の systemd）を停止/開始します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は Ctrl-C で停止し、次を実行します:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway サービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッション用に Gateway を **フォアグラウンド** で実行します。

    サービスをインストールしている場合は、Gateway コマンドを使用します。一度限りの
    フォアグラウンド実行が必要な場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    コンソールの詳細を増やすには `--verbose` 付きで Gateway を起動します。次に、チャンネル認証、モデルルーティング、RPC エラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分の skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルでは、`media`、`mediaUrl`、`path`、`filePath` などの構造化メディアフィールドを使用する必要があります。[OpenClaw アシスタントセットアップ](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    あわせて確認してください:

    - 対象チャンネルが送信メディアをサポートしており、許可リストでブロックされていない。
    - ファイルがプロバイダーのサイズ制限内にある（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに限定します。
    - `tools.fs.workspaceOnly=false` は、構造化ローカルメディア送信で、エージェントがすでに読み取れるホストローカルファイルを使用できるようにします。ただし、メディアと安全なドキュメントタイプ（画像、音声、動画、PDF、Office ドキュメント、および Markdown/MD、TXT、JSON、YAML、YML などの検証済みテキストドキュメント）のみに限られます。これはシークレットスキャナーではありません。拡張子と内容検証が一致する場合、エージェントが読める `secret.txt` や `config.json` は添付できます。機密ファイルはエージェントが読めるパスの外に置くか、より厳格なローカルパス送信のために `tools.fs.workspaceOnly=true` を維持してください。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています:

    - DM 対応チャンネルのデフォルト動作は **ペアリング** です:
      - 不明な送信者はペアリングコードを受け取ります。ボットはそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは **チャンネルごとに 3 件** に制限されます。コードが届かない場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクの高い DM ポリシーを表示するには `openclaw doctor` を実行します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか？">
    いいえ。プロンプトインジェクションは、誰がボットに DM できるかだけでなく、**信頼できないコンテンツ** に関する問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは **送信者が自分だけ** の場合でも起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを外部へ流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」エージェントを使用する
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はどちらも、抽出テキストを生のファイルテキストとして渡すのではなく、
      明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リストを使用する

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw は Rust/WASM ではなく TypeScript/Node を使っているため安全性が低いですか？">
    言語とランタイムは重要ですが、個人用
    エージェントにとって主なリスクではありません。OpenClaw の実際的なリスクは、Gateway の露出、誰が
    ボットにメッセージを送れるか、プロンプトインジェクション、ツール範囲、認証情報の扱い、ブラウザアクセス、exec
    アクセス、サードパーティの skill または plugin の信頼性です。

    Rust と WASM は一部のコード種別に対してより強い分離を提供できますが、
    プロンプトインジェクション、不適切な許可リスト、公開 Gateway の露出、
    広すぎるツール、または機密
    アカウントにすでにログインしているブラウザプロファイルは解決しません。これらを主要な制御として扱ってください:

    - Gateway を非公開または認証付きに保つ
    - DM とグループにはペアリングと許可リストを使用する
    - 信頼できない入力に対してはリスクの高いツールを拒否またはサンドボックス化する
    - 信頼できる plugin と Skills のみをインストールする
    - 設定変更後に `openclaw security audit --deep` を実行する

    詳細: [セキュリティ](/ja-JP/gateway/security), [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="公開された OpenClaw インスタンスに関する報告を見ました。何を確認すべきですか？">
    まず実際のデプロイを確認します:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    より安全なベースラインは次のとおりです:

    - Gateway が `loopback` にバインドされている、または tailnet、SSH トンネル、トークン/パスワード認証、正しく
      構成された信頼済みプロキシなどの認証付きプライベートアクセス経由でのみ公開されている
    - DM が `pairing` または `allowlist` モードである
    - すべてのメンバーが信頼できる場合を除き、グループが許可リスト化され、メンションでゲートされている
    - 信頼できないコンテンツを読むエージェントでは、高リスクツール（`exec`、`browser`、`gateway`、`cron`）が拒否されている、または厳密に
      スコープ設定されている
    - ツール実行により小さい影響範囲が必要な場所でサンドボックス化が有効になっている

    認証なしの公開バインド、ツール付きのオープンな DM/グループ、公開されたブラウザ
    制御が、最初に修正すべき findings です。詳細:
    [セキュリティ監査チェックリスト](/ja-JP/gateway/security#security-audit-checklist)。

  </Accordion>

  <Accordion title="ClawHub の Skills とサードパーティ plugin はインストールしても安全ですか？">
    サードパーティの Skills と plugin は、信頼することを選ぶコードとして扱ってください。
    ClawHub の skill ページはインストール前にスキャン状態を表示しますが、スキャンは
    完全なセキュリティ境界ではありません。OpenClaw は plugin または skill のインストール/更新フロー中に、組み込みのローカル
    危険コードブロックを実行しません。ローカルの許可/ブロック判断には
    オペレーター所有の `security.installPolicy` を使用してください。

    より安全なパターン:

    - 信頼できる作者と固定バージョンを優先する
    - 有効化する前に skill または plugin を読む
    - plugin と skill の許可リストを狭く保つ
    - 最小限のツールを持つサンドボックスで信頼できない入力のワークフローを実行する
    - サードパーティコードに広範なファイルシステム、exec、ブラウザ、またはシークレットアクセスを与えない

    詳細: [Skills](/ja-JP/tools/skills)、[Plugin](/ja-JP/tools/plugin)、
    [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボットには専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    ほとんどのセットアップでは、はい。ボットを別のアカウントや電話番号で分離すると、
    問題が起きた場合の影響範囲を小さくできます。また、個人アカウントに影響を与えずに、
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを付与し、
    必要になったら後で広げます。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えても安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです。

    - DM は**ペアリングモード**または厳格な許可リストに保つ。
    - 代理でメッセージを送らせたい場合は、**別の番号またはアカウント**を使う。
    - 下書きを作らせてから、**送信前に承認**する。

    試したい場合は、専用アカウントで実施し、分離した状態を保ってください。
    [セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="パーソナルアシスタントのタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で、入力が信頼できる場合**に限ります**。小さいティアは
    指示の乗っ取りに対してより脆弱なため、ツールが有効なエージェントや、
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールを厳しく制限し、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードが届きません">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに追加するか、そのアカウントの
    `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどのように動作しますか？">
    いいえ。WhatsApp DM のデフォルトポリシーは**ペアリング**です。不明な送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClaw は、受信したチャット、または明示的にトリガーした送信に対してのみ返信します。

    ペアリングを承認します。

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは、自分の DM を許可するために**許可リスト/所有者**を設定する目的で使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」場合

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするには？">
    ほとんどの内部メッセージやツールメッセージは、そのセッションで **verbose**、**trace**、または **reasoning** が有効になっている場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもノイズが多い場合は、Control UI でセッション設定を確認し、verbose を
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使っていないことも確認してください。

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

    ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要がありますが、`/status` のようないくつかのショートカットは、許可リストにある送信者であればインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るには？（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで**クロスプロバイダー**のメッセージングをブロックします。ツール呼び出しが
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

  <Accordion title='ボットが連続したメッセージを「無視する」ように感じるのはなぜですか？'>
    実行中のプロンプトは、デフォルトでアクティブな実行に誘導されます。`/queue` を使ってアクティブ実行時の動作を選択します。

    - `steer` - 次のモデル境界でアクティブな実行を導く
    - `followup` - メッセージをキューに入れ、現在の実行が終了した後に 1 つずつ実行する
    - `collect` - 互換性のあるメッセージをキューに入れ、現在の実行が終了した後に 1 回返信する
    - `interrupt` - 現在の実行を中止して新しく開始する

    デフォルトモードは `steer` です。キューモードでは `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)と[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う Anthropic のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを認証プロファイルに保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです（例: `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントについて、Gateway が期待される `auth-profiles.json` 内で Anthropic の認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ詰まっていますか？[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions)を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期エラー
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
