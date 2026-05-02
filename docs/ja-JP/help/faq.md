---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - 詳細なデバッグに入る前に、ユーザーから報告された問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-02T22:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

すぐ使える回答と、実際のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）向けのより深いトラブルシューティング。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/サービスの到達性、エージェント/セッション、プロバイダー設定 + ランタイムの問題（gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンはマスク）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーのランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性の高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャンネルプローブを含む、ライブ Gateway ヘルスプローブを実行します
   （到達可能な gateway が必要）。[ヘルス](/ja-JP/gateway/health)を参照してください。

5. **最新ログを追尾**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ログ](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
   ```

   実行中の gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health)を参照してください。

## クイックスタートと初回セットアップ

初回実行の Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期失敗）は
[初回実行 FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw とは、一段落で言うと何ですか？">
    OpenClaw は、自分のデバイス上で実行する個人用 AI アシスタントです。すでに使っているメッセージングサーフェス（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネル Plugin）で返信でき、サポート対象プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンで、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは**ローカルファーストのコントロールプレーン**であり、すでに使っているチャットアプリから到達できる高機能なアシスタントを、**自分のハードウェア**上で実行できます。ステートフルなセッション、メモリ、ツールを備え、ワークフローの制御をホスト型 SaaS に渡す必要がありません。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実際のチャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage などに加え、サポート対象プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティングとフェイルオーバー付きで使用できます。
    - **ローカル専用オプション:** ローカルモデルを実行すれば、必要に応じて**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとにエージェントを分け、それぞれに独自のワークスペースとデフォルトを持たせられます。
    - **オープンソースで改造可能:** ベンダーロックインなしで、調査、拡張、セルフホストができます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャンネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトとして適しているもの:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリをプロトタイプする（概要、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分割し、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    日常的な効果は通常、次のような形になります。

    - **個人向けブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **調査と下書き:** メールやドキュメント向けの素早い調査、要約、初稿。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **クロスデバイス連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS 向けのリード獲得、アウトリーチ、広告、ブログを手伝えますか？">
    **調査、選別、下書き**には使えます。サイトをスキャンし、候補リストを作り、見込み客を要約し、アウトリーチや広告コピーの下書きを作成できます。

    **アウトリーチや広告配信**では、人間をループに入れてください。スパムを避け、地域の法律とプラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、OpenClaw に下書きさせて自分が承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発で Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人用アシスタント**であり調整レイヤーであって、IDE の代替ではありません。リポジトリ内で最速の直接コーディングループが必要なら Claude Code または Codex を使ってください。永続メモリ、クロスデバイスアクセス、ツールオーケストレーションが必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたぐ**永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働 Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用の **Nodes**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに skills をカスタマイズするには？">
    リポジトリ側のコピーを編集する代わりに、管理対象のオーバーライドを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、管理対象オーバーライドは git に触れずに同梱 skills より優先されます。skill をグローバルにインストールする必要があるが一部のエージェントにだけ表示したい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。上流に入れる価値がある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定します（最低優先度）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次回セッションでこれを `<workspace>/skills` として扱います。skill を特定のエージェントにだけ表示したい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うには？">
    現在サポートされているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: デフォルトモデルが異なる別エージェントへタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうすればオフロードできますか？">
    長時間または並列のタスクには**サブエージェント**を使ってください。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    ボットに「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    `/status` をチャットで使うと、Gateway が現在何をしているか（忙しいかどうか）を確認できます。

    トークンのヒント: 長時間タスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント向けに安価なモデルを設定してください。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドに紐づくサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッション対象にバインドすると、そのスレッド内のフォローアップメッセージはバインドされたセッションに留まります。

    基本フロー:

    - `sessions_spawn` で `thread: true` を使って起動します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインド状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動フォーカス解除を制御します。
    - `/unfocus` でスレッドを切り離します。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSessions` のデフォルトは `true` です。スレッドに紐づくセッション起動を無効にするには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了更新が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決済みのリクエスター経路を確認してください。

    - 完了モードのサブエージェント配信は、バインドされたスレッドまたは会話経路が存在する場合、それを優先します。
    - 完了元がチャンネルだけを持つ場合、OpenClaw はリクエスターセッションに保存された経路（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信は引き続き成功できます。
    - バインドされた経路も使用可能な保存済み経路も存在しない場合、直接配信は失敗することがあり、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古い対象は、キューフォールバックや最終配信失敗をなお強制することがあります。
    - 子の最後に表示されたアシスタント返信が正確にサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い以前の進捗を投稿する代わりに、意図的に通知を抑制します。
    - 子がツール呼び出しだけの後にタイムアウトした場合、通知は生のツール出力を再生する代わりに、それを短い部分進捗要約へまとめることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に実行されていない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 実行されていることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストタイムゾーン）を確認します。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron が実行されたのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認します。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が想定されていないことを意味します。
    - アナウンス先（`channel` / `to`）が存在しない、または無効な場合、ランナーはアウトバウンド配信をスキップします。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、ランナーが配信を試みたものの、認証情報によりブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は、意図的に配信不可として扱われるため、ランナーはキュー済みのフォールバック配信も抑制します。

    分離された cron ジョブでは、チャットルートが利用可能な場合、エージェントは `message`
    ツールで直接送信できます。`--announce` は、エージェントがまだ送信していない最終テキストに対するランナーの
    フォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離された cron 実行がモデルを切り替えたり、一度リトライしたりしたのはなぜですか？">
    通常これはライブモデル切り替え経路であり、重複スケジューリングではありません。

    分離された cron は、アクティブな実行が `LiveSessionModelSwitchError` をスローしたときに、ランタイムモデルの引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイルの上書きが含まれていた場合は、cron が
    リトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデル上書きが最初に優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの cron セッションモデル上書き。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の切り替えリトライ後、
    cron は無限ループする代わりに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使用するか、ワークスペースに Skills を配置します。macOS の Skills UI は Linux では利用できません。
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
    ディレクトリに書き込みます。独自の Skills を公開または同期したい場合にのみ、別の `clawhub` CLI をインストールしてください。エージェント間で共有インストールするには、Skill を
    `~/.openclaw/skills` の下に配置し、どのエージェントがそれを参照できるかを絞り込みたい場合は
    `agents.defaults.skills` または `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに沿って、またはバックグラウンドで継続的にタスクを実行できますか？">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ** はスケジュール済みまたは繰り返しタスク用です（再起動後も保持されます）。
    - **Heartbeat** は「メインセッション」の定期チェック用です。
    - **分離ジョブ** は、要約を投稿したりチャットへ配信したりする自律エージェント用です。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限され、Skills は **Gateway ホスト**で適格な場合にのみシステムプロンプトに表示されます。Linux では、ゲーティングを上書きしない限り、`darwin` 専用の Skills（`apple-notes`、`apple-reminders`、`things-mac` など）は読み込まれません。

    サポートされているパターンは 3 つあります。

    **オプション A - Mac で Gateway を実行する（最も簡単）。**
    macOS のバイナリが存在する場所で Gateway を実行し、その後 Linux から [リモートモード](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS であるため、Skills は通常どおり読み込まれます。

    **オプション B - macOS Node を使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS Node（メニューバーアプリ）をペアリングし、Mac で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリが Node 上に存在する場合、OpenClaw は macOS 専用 Skills を適格として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選択した場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（高度）。**
    Gateway は Linux に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill を上書きして Linux を許可し、適格な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホスト上でラッパーを `PATH` に配置します（例: `~/bin/memo`）。
    3. Skill メタデータ（ワークスペースまたは `~/.openclaw/skills`）を上書きして Linux を許可します。

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

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion と HeyGen はどちらも API を提供しています）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（代理店ワークフロー）、単純なパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ（コンテキスト + 設定 + アクティブな作業）。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、それらの API を対象にした Skill を
    構築してください。

    Skills をインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で Skills を共有するには、`~/.openclaw/skills/<name>/SKILL.md` に配置します。一部のエージェントだけが共有インストールを参照できるようにする場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定します。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub) を参照してください。

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

    この経路では、ローカルホストのブラウザーまたは接続済みのブラウザー Node を使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシンで Node ホストを実行するか、代わりにリモート CDP を使用します。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルのみサポートします
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションには、まだ管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 内のフル Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker は制限があるように感じます。すべての機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドル済みブラウザーは含まれていません。より完全なセットアップには、次を行います。

    - キャッシュが残るように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに組み込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されることを確認します。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか？">
    はい。プライベートトラフィックが **DM** で、公開トラフィックが **グループ** であれば可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非メインキー）は設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、サンドボックス化されたセッションで利用できるツールを `tools.sandbox.tools` で制限します。

    セットアップ手順 + 設定例: [グループ: 個人 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性のあるものには `:ro` を使用し、バインドはサンドボックスのファイルシステム境界を迂回することを忘れないでください。

    OpenClaw は、正規化されたパスと、存在する最も深い祖先を通じて解決された正規パスの両方に対してバインドソースを検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出はフェイルクローズになり、シンボリックリンク解決後も許可ルートチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルにすぎません。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` のキュレーション済み長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は、モデルに auto-compaction 前に永続的なノートを書くよう促すために、**サイレントな事前 Compaction メモリフラッシュ** も実行します。これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに **その事実をメモリに書き込む** よう依頼します。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入れます。

    これはまだ改善中の領域です。モデルにメモリを保存するよう促すと役立ちます。
    モデルは何をすべきか理解します。それでも忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく、
    ストレージです。**セッションコンテキスト** は引き続きモデルのコンテキストウィンドウによって制限されるため、
    長い会話は compact または切り詰められることがあります。そのため
    メモリ検索があります。関連部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuth はチャット/補完を対象とし、
    embeddings アクセスは付与しません。そのため、**Codex でサインインしても（OAuth または
    Codex CLI ログイン）** セマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    プロバイダーを自動選択します（認証プロファイル、`models.providers.*.apiKey`、または環境変数）。
    OpenAI キーを解決できる場合は OpenAI を優先し、そうでなければ Gemini キーを
    解決できる場合は Gemini、その後 Voyage、その後 Mistral の順に優先します。リモートキーが
    利用できない場合、設定するまでメモリ検索は無効のままです。ローカルモデルのパスが
    設定され、存在する場合、OpenClaw は
    `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"` を設定します（必要に応じて
    `memorySearch.fallback = "none"` も設定します）。Gemini embeddings を使う場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、またはローカル** の embedding
    モデルをサポートしています。セットアップの詳細は [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上での保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるデータはすべてローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き表示されます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      （`~/.openclaw` + ワークスペースディレクトリ）。
    - **必要に応じてリモート:** モデルプロバイダー（Anthropic/OpenAI など）に送信するメッセージは
      それらの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      それぞれのサーバーに保存します。
    - **フットプリントは自分で制御できます:** ローカルモデルを使うとプロンプトは自分のマシンに残りますが、チャンネル
      トラフィックは引き続きそのチャンネルのサーバーを経由します。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー用の任意のファイルベースシークレットペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換性ファイル（静的な `api_key` エントリはスクラブ済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      小文字ルートの `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、`openclaw doctor --fix`
      で `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャンネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が毎回の起動で同じ
    ワークスペースを使っていることを確認してください（また、リモートモードではローカルのノート PC ではなく
    **gateway ホストの** ワークスペースが使われることを覚えておいてください）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む** ようボットに依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**プライベート**な git リポジトリに置き、どこか
    プライベートな場所（たとえば GitHub private）にバックアップしてください。これにより、メモリ + AGENTS/SOUL/USER
    ファイルを取得でき、後からアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。
    完全復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペースの外で作業できますか？">
    はい。ワークスペースは**デフォルト cwd** でありメモリのアンカーであって、厳格なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックスが有効でない限り、絶対パスで他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。
    リポジトリをデフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。
    エージェントにその中で作業させる意図がある場合を除き、ワークスペースは分けておいてください。

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
    セッション状態は **gateway ホスト**が所有します。リモートモードの場合、重要なセッションストアはローカルのノート PC ではなくリモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
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

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら何も待ち受けない / UI が未認証と表示される'>
    非ループバック bind には**有効な gateway 認証パスが必要**です。実際には次を意味します。

    - 共有シークレット認証: トークンまたはパスワード
    - 正しく設定された ID 対応リバースプロキシの背後での `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` だけではローカル gateway 認証は有効になりません。
    - ローカル呼び出しパスでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
    - パスワード認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は閉じた状態で失敗します（リモートフォールバックで隠されません）。
    - 共有シークレットの Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような ID を持つモードでは、代わりにリクエストヘッダーを使います。共有シークレットを URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback リバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="なぜ今は localhost でトークンが必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで gateway 認証を強制します。通常のデフォルトパスでは、これはトークン認証を意味します。明示的な認証パスが設定されていない場合、gateway 起動時にトークンモードに解決され、トークンを自動生成して `gateway.auth.token` に保存するため、**ローカル WS クライアントは認証が必要**です。これにより、他のローカルプロセスが Gateway を呼び出すことをブロックします。

    別の認証パスを使いたい場合は、パスワードモード（または ID 対応リバースプロキシの場合は `trusted-proxy`）を明示的に選べます。**本当に** open loopback にしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定を変更した後に再起動する必要はありますか？">
    Gateway は設定を監視し、ホットリロードをサポートします。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動します
    - `hot`、`restart`、`off` もサポートされます

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

    - `off`: タグラインのテキストを非表示にしますが、バナーのタイトル/バージョン行は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナーをまったく表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web fetch）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API ベースのプロバイダーでは、通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベースの統合です。
    - SearXNG はキー不要/セルフホストです。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行し、プロバイダーを選択します。
    環境変数の代替:

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

    プロバイダー固有のWeb検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` にあります。
    互換性のため、従来の `tools.web.search.*` プロバイダーパスも一時的に読み込まれますが、新しい設定では使用しないでください。
    FirecrawlのWeb取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` にあります。

    注意:

    - 許可リストを使用している場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化していない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から最初に準備できた取得フォールバックプロバイダーを自動検出します。現在バンドルされているプロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から環境変数を読み込みます。

    ドキュメント: [Webツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消去しました。どう復旧し、どう避ければよいですか？">
    `config.apply` は **設定全体** を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の設定全体を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway は最後に正常だった設定を復元し、拒否されたファイルを `openclaw.json.clobbered.*` として保存します。
    - 復旧後、メインエージェントは起動警告を受け取るため、問題のある設定を盲目的に再書き込みしません。

    復旧:

    - `openclaw logs --follow` で `Config auto-restored from last-known-good`、`Config write rejected:`、または `config reload restored last-known-good config` を確認します。
    - アクティブな設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - 復元されたアクティブな設定が動作する場合はそれを保持し、意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - `openclaw config validate` と `openclaw doctor` を実行します。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行してチャンネル/モデルを再設定します。
    - これが想定外だった場合は、バグを報告し、最後に把握している設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避方法:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールドの形が不明な場合は、まず `config.schema.lookup` を使用します。これは、浅いスキーマノードと、掘り下げ用の直下の子要素の概要を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は設定全体の置換専用にします。
    - エージェント実行からオーナー専用の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは拒否されます（同じ保護された実行パスに正規化される従来の `tools.bash.*` エイリアスを含む）。

    ドキュメント: [設定](/ja-JP/cli/config)、[設定変更](/ja-JP/cli/configure)、[Gatewayトラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいで専用ワーカーを使う中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1つの Gateway**（例: Raspberry Pi）に **Node** と **エージェント** を組み合わせるものです。

    - **Gateway（中央）:** チャンネル（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **Node（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **エージェント（ワーカー）:** 特殊な役割（例: 「Hetzner運用」、「個人データ」）向けの別個の頭脳/ワークスペースです。
    - **サブエージェント:** 並列処理が必要なときに、メインエージェントからバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、エージェント/セッションを切り替えます。

    ドキュメント: [Node](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

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

    デフォルトは `false`（ヘッドフル）です。一部のサイトでは、ヘッドレスのほうがボット対策チェックを誘発しやすくなります。[ブラウザー](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは **同じ Chromium エンジン** を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトはヘッドレスモードでの自動化により厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使用するにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [ブラウザー](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と Node

<AccordionGroup>
  <Accordion title="コマンドは Telegram、gateway、Node の間でどのように伝播しますか？">
    Telegram メッセージは **gateway** によって処理されます。gateway はエージェントを実行し、Node ツールが必要な場合にのみ **Gateway WebSocket** 経由で Node を呼び出します。

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node は受信プロバイダートラフィックを見ません。Node RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは自分のコンピューターにどのようにアクセスできますか？">
    短い答え: **コンピューターを Node としてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に置きます。
    3. Gateway WS に到達可能であることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続し、
       Node として登録できるようにします。
    5. Gateway で Node を承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。Node は Gateway WebSocket 経由で接続します。

    セキュリティの注意: macOS Node をペアリングすると、そのマシン上で `system.run` が許可されます。
    信頼するデバイスだけをペアリングし、[セキュリティ](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [Node](/ja-JP/nodes)、[Gatewayプロトコル](/ja-JP/gateway/protocol)、[macOSリモートモード](/ja-JP/platforms/mac/remote)、[セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが返信がありません。次に何を確認すればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway の健全性: `openclaw status`
    - チャンネルの健全性: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認します。
    - 許可リスト（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[チャンネル](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2つの OpenClaw インスタンスは互いに通信できますか（ローカル + VPS）？">
    はい。組み込みの「ボット間」ブリッジはありませんが、信頼性のある方法で配線できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャンネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A に Bot B へメッセージを送信させ、その後は通常どおり Bot B に返信させます。

    **CLI ブリッジ（汎用）:** 他方のボットが待ち受けているチャットを対象に、`openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行します。片方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[リモートアクセス](/ja-JP/gateway/remote)を参照）。

    パターン例（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つのボットが無限ループしないようにガードレールを追加します（メンションのみ、チャンネル許可リスト、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[エージェントCLI](/ja-JP/cli/agent)、[エージェント送信](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントには個別の VPS が必要ですか？">
    いいえ。1つの Gateway で複数のエージェントをホストでき、それぞれが独自のワークスペース、モデル既定値、ルーティングを持てます。
    これが通常のセットアップであり、エージェントごとに1つの VPS を実行するよりも大幅に安価でシンプルです。

    強い分離（セキュリティ境界）や、共有したくない非常に異なる設定が必要な場合にのみ、個別の VPS を使用します。それ以外の場合は、1つの Gateway を維持し、
    複数のエージェントまたはサブエージェントを使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、自分の個人用ラップトップで Node を使用する利点はありますか？">
    はい。Node はリモート Gateway からラップトップに到達するための第一級の方法であり、シェルアクセス以上の機能を解放します。Gateway は macOS/Linux（Windows は WSL2 経由）で実行され、
    軽量です（小さな VPS や Raspberry Pi クラスの機器で十分です。4 GB RAM で十分です）。そのため、一般的な構成は常時稼働ホストにラップトップを Node として追加する形です。

    - **受信 SSH は不要です。** Node は Gateway WebSocket に発信接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上の Node 許可リスト/承認によって制御されます。
    - **より多くのデバイスツール。** Node は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS に置いたまま、ラップトップ上の Node ホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH はアドホックなシェルアクセスには問題ありませんが、継続的なエージェントワークフローとデバイス自動化には Node のほうがシンプルです。

    ドキュメント: [Node](/ja-JP/nodes)、[Node CLI](/ja-JP/cli/nodes)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Node は gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合（[複数のgateway](/ja-JP/gateway/multiple-gateways)を参照）を除き、ホストごとに実行する **gateway** は1つだけにしてください。Node は gateway に接続する周辺機器です
    （iOS/Android Node、または macOS のメニューバーアプリの「node mode」）。ヘッドレス Node
    ホストと CLI 制御については、[NodeホストCLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、設定サブツリー1つについて、浅いスキーマノード、一致した UI ヒント、直下の子要素の概要を調べます
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 検証して設定全体を置き換えます。可能な場合はホットリロードし、必要な場合は再起動します
    - オーナー専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは同じ保護された実行パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限の妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これにより、ワークスペースを設定し、ボットをトリガーできる相手を制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定して Mac から接続するにはどうすればよいですか？">
    最小限の手順:

    1. **VPS にインストールしてログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログインする**
       - Tailscale アプリを使用し、同じ tailnet にサインインします。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS が安定した名前を持つようにします。
    4. **tailnet ホスト名を使用する**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使用します:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより、gateway は loopback にバインドされたまま、Tailscale 経由で HTTPS を公開します。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨設定:

    1. **VPS + Mac が同じ tailnet 上にあることを確認します**。
    2. **Remote モードで macOS アプリを使用します**（SSH ターゲットには tailnet ホスト名を使用できます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. gateway で**ノードを承認します**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2 台目のノート PC にインストールすべきですか、それともノードを追加するだけでよいですか？">
    2 台目のノート PC で必要なのが **local tools**（画面/カメラ/exec）だけなら、
    **ノード**として追加します。これにより単一の Gateway を維持し、設定の重複を避けられます。ローカルノードツールは
    現在 macOS のみ対応していますが、他の OS にも拡張する予定です。

    2 つの完全に分離されたボットや**強い分離**が必要な場合にのみ、2 つ目の Gateway をインストールしてください。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに次を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも、既存の環境変数を上書きしません。

    設定内でインライン環境変数を定義することもできます（プロセス環境にない場合のみ適用されます）:

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
    よくある修正は 2 つあります:

    1. 不足しているキーを `~/.openclaw/.env` に入れると、サービスが shell 環境を継承しない場合でも読み込まれます。
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

    これはログイン shell を実行し、不足している想定キーのみをインポートします（上書きはしません）。同等の環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off"
    は、環境変数が不足しているという意味では**ありません**。OpenClaw が
    ログイン shell を自動的に読み込まないという意味です。

    Gateway がサービス（launchd/systemd）として実行されている場合、shell
    環境を継承しません。次のいずれかで修正します:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell インポートを有効にします（`env.shellEnv.enabled: true`）。
    3. または設定の `env` ブロックに追加します（不足している場合のみ適用）。

    その後、gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（また `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数のチャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    `/new` または `/reset` を単独のメッセージとして送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは**デフォルトで無効**です（デフォルト **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効な場合、アイドル期間後の**次の**
    メッセージが、そのチャットキーの新しいセッション ID を開始します。
    これは transcript を削除しません。新しいセッションを開始するだけです。

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
    個別のセッションを持つ 1 つのボットを使うより効率が落ちます。私たちが想定する典型的なモデルは、
    1 つのボットと会話し、並列作業には異なるセッションを使う形です。その
    ボットは必要に応じてサブエージェントを起動することもできます。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[サブエージェント](/ja-JP/tools/subagents)、[エージェント CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中でコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルによって、Compaction や切り詰めが発生することがあります。

    役立つこと:

    - ボットに現在の状態を要約してファイルに書くよう依頼します。
    - 長いタスクの前に `/compact` を使用し、トピックを切り替えるときは `/new` を使用します。
    - 重要なコンテキストはワークスペースに保持し、ボットに読み返すよう依頼します。
    - 長い作業や並列作業にはサブエージェントを使用し、メインチャットを小さく保ちます。
    - これが頻繁に起きる場合は、より大きなコンテキストウィンドウを持つモデルを選びます。

  </Accordion>

  <Accordion title="OpenClaw を完全にリセットしつつ、インストールは維持するにはどうすればよいですか？">
    reset コマンドを使用します:

    ```bash
    openclaw reset
    ```

    非対話の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - 既存の設定が見つかった場合、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用していた場合は、各状態ディレクトリをリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発リセット: `openclaw gateway --dev --reset`（開発専用。開発設定 + 資格情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ています。リセットまたは compact するにはどうすればよいですか？'>
    次のいずれかを使用します:

    - **Compact**（会話は保持し、古いターンを要約します）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約を誘導します。

    - **Reset**（同じチャットキーの新しいセッション ID）:

      ```
      /new
      /reset
      ```

    それでも続く場合:

    - **セッション pruning**（`agents.defaults.contextPruning`）を有効化または調整し、古いツール出力を削減します。
    - より大きなコンテキストウィンドウを持つモデルを使用します。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これはプロバイダーの検証エラーです。モデルが必須の
    `input` なしで `tool_use` ブロックを出力しました。通常は、セッション履歴が古いか破損していることを意味します（長いスレッド
    やツール/スキーマ変更の後によく起きます）。

    修正: `/new`（単独メッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30 分ごとに Heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごとに実行されます（OAuth 認証を使用している場合は **1h**）。調整または無効化できます:

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

    `HEARTBEAT.md` が存在しても実質的に空（空行と `# Heading` のような markdown
    ヘッダーのみ）である場合、OpenClaw は API 呼び出しを節約するために heartbeat 実行をスキップします。
    ファイルがない場合でも heartbeat は実行され、モデルが何をするかを決定します。

    エージェントごとの上書きには `agents.list[].heartbeat` を使用します。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClaw は**あなた自身のアカウント**で動作するため、あなたがグループに入っていれば OpenClaw もそれを見ることができます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    **あなた**だけがグループ返信をトリガーできるようにしたい場合:

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
    `1234567890-1234567890@g.us`.

    オプション 2（すでに設定済み/allowlist 済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[ディレクトリ](/ja-JP/cli/directory)、[ログ](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は 2 つあります:

    - メンションゲートがオン（デフォルト）です。ボットを @mention する（または `mentionPatterns` に一致させる）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist されていません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    直接チャットはデフォルトでメインセッションに集約されます。グループ/チャンネルは独自のセッションキーを持ち、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="作成できるワークスペースとエージェントはいくつですか？">
    厳密な上限はありません。数十（場合によっては数百）でも問題ありませんが、次に注意してください:

    - **ディスク増加:** セッション + transcript は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** エージェントが増えるほど、同時モデル使用量が増えます。
    - **運用オーバーヘッド:** エージェントごとの認証プロファイル、ワークスペース、チャンネルルーティング。

    ヒント:

    - エージェントごとに 1 つの**アクティブな**ワークスペース（`agents.defaults.workspace`）を維持します。
    - ディスクが増えたら古いセッション（JSONL またはストアエントリ）を pruning します。
    - `openclaw doctor` を使用して、迷子のワークスペースやプロファイル不一致を見つけます。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）。また、どのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使用して、複数の分離されたエージェントを実行し、受信メッセージを
    チャネル/アカウント/ピアごとにルーティングします。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることを何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって
    自動化がブロックされる場合があります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使用するか、
    実際にブラウザーを実行しているマシンで CDP を使用してください。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに 1 つのエージェント（バインディング）。
    - それらのエージェントにバインドされた Slack チャネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザー。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [ブラウザー](/ja-JP/tools/browser), [ノード](/ja-JP/nodes).

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A（デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル）は、
[モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は、WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status で "Runtime: running" と表示されるのに "Connectivity probe: failed" と表示されるのはなぜですか？'>
    なぜなら、「running」は**スーパーバイザー**の視点（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に gateway WebSocket に接続している状態です。

    `openclaw gateway status` を使用し、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使用した URL）
    - `Listening:`（ポートで実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートがリッスンしていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    ある設定ファイルを編集している一方で、サービスは別の設定ファイルで実行されています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使用させたい同じ `--profile` / 環境から実行してください。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" とはどういう意味ですか？'>
    OpenClaw は、起動時に WebSocket リスナーをすぐにバインドすることでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでにリッスンしていることを示す `GatewayLockError` をスローします。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="リモートモード（クライアントが別の場所の Gateway に接続する）で OpenClaw を実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート認証情報を付けてリモート WebSocket URL を指定します:

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

    - `openclaw gateway` は、`gateway.mode` が `local` の場合（または上書きフラグを渡した場合）にのみ起動します。
    - macOS アプリは設定ファイルを監視し、これらの値が変わるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報のみです。それ自体ではローカル gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI に "unauthorized" と表示されます（または再接続し続けます）。どうすればよいですか？'>
    gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザータブセッションと選択された gateway URL に対して `sessionStorage` にトークンを保持するため、同じタブでの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、gateway が再試行ヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返した場合、信頼されたクライアントはキャッシュされたデバイストークンで 1 回だけ範囲を限定した再試行を試みることができます。
    - そのキャッシュトークン再試行は、デバイストークンとともに保存されたキャッシュ済みの承認済みスコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュされたスコープを継承するのではなく、引き続き要求したスコープセットを保持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップ operator allowlist は operator リクエストのみを満たします。node やその他の非 operator ロールには、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale ID ヘッダーをバイパスする生の loopback/tailnet URL ではなく、Serve URL を開いていることを確認してください。
    - 信頼済みプロキシモード: 生の gateway URL ではなく、設定済みの ID 対応プロキシ経由でアクセスしていることを確認してください。同一ホストの loopback プロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` も必要です。
    - 1 回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと言う場合は、次の 2 点を確認してください:
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自分自身の**デバイスのみローテーションできます
      - 明示的な `--scope` 値は、呼び出し元の現在の operator スコープを超えることはできません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、バインドできず何もリッスンしません">
    `tailnet` バインドは、ネットワークインターフェイスから Tailscale IP を選択します（100.64.0.0/10）。マシンが Tailscale 上にない場合（またはインターフェイスがダウンしている場合）、バインドできるものがありません。

    修正:

    - そのホストで Tailscale を開始します（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替えます。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用のバインドが必要な場合は `gateway.bind: "tailnet"` を使用してください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。複数の Gateway は、冗長性（例: rescue bot）または強い分離が必要な場合にのみ使用してください。

    可能ですが、分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイック設定（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使用します（`~/.openclaw-<name>` を自動作成します）。
    - 各プロファイル設定に一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にも接尾辞を付けます（`ai.openclaw.<profile>`; 従来の `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信した場合、**コード 1008**
    （ポリシー違反）で接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザーで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使用した。
    - プロキシまたはトンネルが認証ヘッダーを取り除いた、または Gateway ではないリクエストを送信した。

    クイック修正:

    1. WS URL を使用します: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かないでください。
    3. 認証が有効な場合は、`connect` フレームにトークン/パスワードを含めます。

    CLI または TUI を使用している場合、URL は次のようになります:

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

    サービス/スーパーバイザーログ（gateway が launchd/systemd 経由で実行される場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`; プロファイルは `~/.openclaw-<profile>/logs/...` を使用）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するにはどうすればよいですか？">
    gateway ヘルパーを使用します:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合、`openclaw gateway --force` でポートを再確保できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するにはどうすればよいですか？">
    **2 つの Windows インストールモード**があります:

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入り、その後再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスをインストールしていない場合は、フォアグラウンドで開始します:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows で直接実行されます。

    PowerShell を開いて実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行する場合（サービスなし）は、次を使用します:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway サービス runbook](/ja-JP/gateway)。

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
    - チャネルのペアリング/allowlist が返信をブロックしている（チャネル設定 + ログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が起動しており、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - どうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください:

    1. Gatewayは実行中ですか？ `openclaw gateway status`
    2. Gatewayは正常ですか？ `openclaw status`
    3. UIには正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscaleリンクは接続されていますか？

    次にログを追尾します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommandsが失敗します。何を確認すべきですか？">
    ログとチャンネルステータスから始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーに合わせて確認します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegramメニューの項目が多すぎます。OpenClawはすでにTelegramの上限に合わせて切り詰め、コマンド数を減らして再試行しますが、それでも一部のメニュー項目を削除する必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要なら`channels.telegram.commands.native`を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS上またはプロキシ背後にいる場合は、送信HTTPSが許可されており、`api.telegram.org`のDNSが機能していることを確認してください。

    Gatewayがリモートの場合は、Gatewayホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUIに出力が表示されません。何を確認すべきですか？">
    まずGatewayに到達でき、エージェントを実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUIでは、`/status`を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gatewayを完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは**監視対象サービス**（macOSではlaunchd、Linuxではsystemd）を停止/起動します。
    Gatewayがデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は、Ctrl-Cで停止してから次を実行します。

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gatewayサービスランブック](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="5歳児向け説明: openclaw gateway restartとopenclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションでGatewayを**フォアグラウンド**実行します。

    サービスをインストールしている場合は、gatewayコマンドを使用します。
    一回限りのフォアグラウンド実行をしたい場合は`openclaw gateway`を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    `--verbose`を付けてGatewayを起動すると、コンソールの詳細情報が増えます。次にログファイルを調べて、チャンネル認証、モデルルーティング、RPCエラーを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分のskillが画像/PDFを生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>`行（その行だけ）を含める必要があります。[OpenClawアシスタントのセットアップ](/ja-JP/start/openclaw)と[エージェント送信](/ja-JP/tools/agent-send)を参照してください。

    CLI送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    併せて確認してください。

    - 対象チャンネルが送信メディアをサポートしており、許可リストでブロックされていないこと。
    - ファイルがプロバイダーのサイズ制限内にあること（画像は最大2048pxにリサイズされます）。
    - `tools.fs.workspaceOnly=true`により、ローカルパス送信はワークスペース、temp/media-store、サンドボックス検証済みファイルに制限されます。
    - `tools.fs.workspaceOnly=false`にすると、`MEDIA:`はエージェントがすでに読めるホストローカルファイルを送信できますが、対象はメディアと安全な文書タイプ（画像、音声、動画、PDF、Officeドキュメント）のみです。プレーンテキストやシークレットらしいファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClawを受信DMに公開しても安全ですか？">
    受信DMは信頼できない入力として扱ってください。既定値はリスクを減らすよう設計されています。

    - DM対応チャンネルでの既定の動作は**ペアリング**です。
      - 不明な送信者にはペアリングコードが届きます。ボットはそのメッセージを処理しません。
      - 次で承認します: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルあたり3件**に制限されます。コードが届かなかった場合は、`openclaw pairing list --channel <channel> [--account <id>]`を確認してください。
    - DMを公開するには、明示的なオプトイン（`dmPolicy: "open"`と許可リスト`"*"`）が必要です。

    `openclaw doctor`を実行して、リスクのあるDMポリシーを表示してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの懸念ですか？">
    いいえ。プロンプトインジェクションは**信頼できないコンテンツ**に関するものであり、誰がボットにDMできるかだけではありません。
    アシスタントが外部コンテンツ（Web検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれている可能性があります。これは**送信者が自分だけ**でも起こり得ます。

    最も大きなリスクはツールが有効な場合です。モデルがだまされて、
    コンテキストを外部送信したり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を小さくするには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効エージェントでは`web_search` / `web_fetch` / `browser`をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponsesの
      `input_file`とメディア添付ファイル抽出はどちらも、生のファイルテキストを渡すのではなく、
      抽出テキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リストを使う

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボット専用のメール、GitHubアカウント、または電話番号を用意すべきですか？">
    はい、ほとんどのセットアップでは推奨されます。ボットを別アカウントや別電話番号で分離すると、
    何か問題が起きた場合の影響範囲を小さくできます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを与え、必要になったら
    後で拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです。

    - DMを**ペアリングモード**または厳格な許可リストのままにする。
    - 代理でメッセージを送らせたい場合は、**別の番号またはアカウント**を使う。
    - 下書きを作らせてから、**送信前に承認**する。

    試す場合は、専用アカウントで行い、分離した状態を保ってください。
    [セキュリティ](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で入力が信頼できる場合は可能です。小さいティアは
    指示の乗っ取りに対してより脆弱なので、ツール有効エージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールを厳しく制限し、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegramで/startを実行しましたが、ペアリングコードが届きません">
    ペアリングコードは、不明な送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"`が有効な場合に**のみ**送信されます。`/start`だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者IDを許可リストに追加するか、そのアカウントの`dmPolicy: "open"`を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージを送りますか？ペアリングはどう機能しますか？">
    いいえ。既定のWhatsApp DMポリシーは**ペアリング**です。不明な送信者にはペアリングコードだけが届き、そのメッセージは**処理されません**。OpenClawは、受信したチャットまたはあなたが明示的にトリガーした送信にだけ返信します。

    次でペアリングを承認します。

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは自分のDMを許可するための**許可リスト/所有者**設定に使われます。自動送信には使われません。個人のWhatsApp番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode`を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスクの中止、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージまたはツールメッセージは、そのセッションで**verbose**、**trace**、または**reasoning**が有効な場合にのみ表示されます。

    表示されているチャットで修正します。

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもうるさい場合は、Control UIのセッション設定を確認し、verboseを
    **inherit**に設定してください。また、設定内で`verboseDefault`が`on`に設定されたボットプロファイルを使っていないことも確認してください。

    ドキュメント: [思考とverbose](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
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

    バックグラウンドプロセス（execツールからのもの）については、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

    ほとんどのコマンドは`/`で始まる**単独の**メッセージとして送信する必要がありますが、一部のショートカット（`/status`など）は許可リスト済み送信者ならインラインでも機能します。

  </Accordion>

  <Accordion title='TelegramからDiscordメッセージを送るにはどうすればよいですか？（"Cross-context messaging denied"）'>
    OpenClawは既定で**プロバイダー横断**メッセージングをブロックします。ツール呼び出しが
    Telegramに紐づいている場合、明示的に許可しない限りDiscordには送信しません。

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

    設定を編集した後、gatewayを再起動します。

  </Accordion>

  <Accordion title='ボットが連続メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、進行中の実行に新しいメッセージがどう作用するかを制御します。`/queue`を使ってモードを変更します。

    - `steer` - 現在の実行内の次のモデル境界まで、保留中のすべての誘導をキューに入れる
    - `queue` - 従来の1件ずつの誘導
    - `followup` - メッセージを1件ずつ実行する
    - `collect` - メッセージをまとめて1回返信する
    - `steer-backlog` - 今すぐ誘導し、その後バックログを処理する
    - `interrupt` - 現在の実行を中止して新しく開始する

    既定のモードは`steer`です。followupモードでは`debounce:0.5s cap:25 drop:summarize`のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue)と[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使う Anthropic のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定する（または Anthropic API キーを認証プロファイルに保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合は、実行中のエージェントに対して期待される `auth-profiles.json` 内で、Gateway が Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期段階の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状を起点にしたトリアージ
