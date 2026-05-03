---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - より深いデバッグの前にユーザー報告の問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-03T21:34:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

実運用の構成（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのクイック回答と、より詳しいトラブルシューティングです。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。設定リファレンス全体については [設定](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル概要: OS + 更新、gateway/サービス到達性、エージェント/セッション、プロバイダー設定 + ランタイム問題（Gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンはマスク済み）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャンネルプローブを含め、ライブ Gateway ヘルスプローブを実行します
   （到達可能な Gateway が必要です）。[ヘルス](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追跡**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL + 設定パスを表示
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回実行の Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期失敗）は
[初回実行 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは、ひとことで言うと何ですか？">
    OpenClaw は、自分のデバイス上で実行する個人向け AI アシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャンネルプラグイン）で返信でき、対応プラットフォームでは音声 + ライブ Canvas も使えます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントがプロダクトです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。すでに使っているチャットアプリから到達できる
    **ローカルファーストのコントロールプレーン**であり、ステートフルなセッション、メモリ、ツールを備えた
    高機能なアシスタントを**自分のハードウェア**で実行できます。ワークフローの制御をホスト型
    SaaS に渡す必要はありません。

    主なポイント:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、
      ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく実チャンネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      加えて対応プラットフォームでのモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを使い、エージェントごとのルーティング
      とフェイルオーバーを設定できます。
    - **ローカルのみの選択肢:** 必要ならローカルモデルを実行し、**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** チャンネル、アカウント、タスクごとに個別のエージェントを分け、
      それぞれ独自のワークスペースとデフォルトを持たせられます。
    - **オープンソースで改造可能:** ベンダーロックインなしで調査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャンネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトに向いているもの:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリのプロトタイプを作る（アウトライン、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分割し、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的なユースケース上位 5 つは何ですか？">
    日常で役立つ例は通常、次のようなものです。

    - **個人向けブリーフィング:** 受信トレイ、カレンダー、関心のあるニュースの要約。
    - **調査と下書き:** メールやドキュメント向けの簡易調査、要約、初稿作成。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の促しとチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス横断の連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログを手伝えますか？">
    **調査、適格性評価、下書き**には使えます。サイトをスキャンし、候補リストを作り、
    見込み客を要約し、アウトリーチ文面や広告コピーの下書きを作成できます。

    **アウトリーチや広告配信**では、人間を確認フローに入れてください。スパムを避け、現地法と
    プラットフォームポリシーに従い、送信前にすべて確認してください。最も安全なパターンは、
    OpenClaw に下書きさせ、自分で承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発において Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人向けアシスタント**かつ調整レイヤーであり、IDE の置き換えではありません。リポジトリ内で最速の直接的なコーディングループには
    Claude Code または Codex を使ってください。永続メモリ、デバイス横断アクセス、ツールオーケストレーションが
    必要な場合に OpenClaw を使います。

    利点:

    - セッションをまたぐ**永続メモリ + ワークスペース**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働 Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用の **Node**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理された上書きを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置いてください（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、管理された上書きは git に触れずに同梱 Skills より優先されます。Skill をグローバルにインストールする必要があるが一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。上流に入れる価値がある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定します（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw は次のセッションでそれを `<workspace>/skills` として扱います。Skill を特定のエージェントだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです。

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` 上書きを設定できます。
    - **サブエージェント**: デフォルトモデルが異なる別エージェントへタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って、現在のセッションモデルをいつでも切り替えます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうやってオフロードできますか？">
    長時間または並列のタスクには**サブエージェント**を使います。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    ボットに「このタスク用にサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    `/status` をチャットで使うと、Gateway が今何をしているか（およびビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクもサブエージェントもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定してください。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッド紐づけサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord スレッドをサブエージェントまたはセッション対象にバインドすると、そのスレッド内の後続メッセージがバインド済みセッションに留まります。

    基本フロー:

    - `sessions_spawn` で `thread: true` を指定して起動します（永続的なフォローアップには任意で `mode: "session"`）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` でバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` で自動フォーカス解除を制御します。
    - `/unfocus` でスレッドを切り離します。

    必須設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 上書き: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSessions` のデフォルトは `true` です。スレッド紐づけセッション起動を無効化するには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[設定リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントは完了しましたが、完了更新が間違った場所に送られた、または投稿されませんでした。何を確認すべきですか？">
    まず解決済みのリクエスター経路を確認してください。

    - 完了モードのサブエージェント配信は、バインド済みスレッドまたは会話経路が存在する場合、それを優先します。
    - 完了元がチャンネルだけを持っている場合、OpenClaw はリクエスターセッションに保存された経路（`lastChannel` / `lastTo` / `lastAccountId`）へフォールバックするため、直接配信が成功し続けることがあります。
    - バインド済み経路も使用可能な保存済み経路も存在しない場合、直接配信は失敗する可能性があり、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古い対象は、それでもキューフォールバックや最終配信失敗を引き起こすことがあります。
    - 子の最後の可視アシスタント返信が正確にサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い以前の進捗を投稿する代わりに、意図的にアナウンスを抑制します。
    - 子がツール呼び出しのみの後にタイムアウトした場合、アナウンスは生のツール出力を再生する代わりに、それを短い部分進捗要約へ畳み込むことがあります。

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

    - cron が有効（`cron.enabled`）であり、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 で稼働していることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストタイムゾーン）を確認します。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は発火したのに、チャンネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が期待されないことを意味します。
    - アナウンス先（`channel` / `to`）がない、または無効な場合、ランナーは外向き配信をスキップします。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、ランナーが配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply` のみ）は、意図的に配信不可として扱われるため、ランナーはキュー済みフォールバック配信も抑制します。

    分離 Cron ジョブでは、チャット経路が利用可能な場合、エージェントは引き続き `message`
    ツールで直接送信できます。`--announce` は、エージェントがまだ送信していない最終テキストに対するランナーの
    フォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="分離 Cron 実行がモデルを切り替えたり、1回リトライしたりしたのはなぜですか？">
    それは通常、重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離 Cron は、アクティブな実行が `LiveSessionModelSwitchError` を投げたときに、実行時のモデル引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイル上書きが含まれていた場合、Cron はリトライ前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデル上書きが最優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの Cron セッションモデル上書き。
    - 次に通常のエージェント/デフォルトモデル選択。

    リトライループには上限があります。初回試行に加えて 2 回の切り替えリトライ後、Cron は永久にループする代わりに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、Skills をワークスペースに配置します。macOS の Skills UI は Linux では利用できません。
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
    エージェント間で共有インストールする場合は、Skill を
    `~/.openclaw/skills` の下に置き、どのエージェントがそれを参照できるかを絞り込みたい場合は
    `agents.defaults.skills` または
    `agents.list[].skills` を使用します。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに従って、またはバックグラウンドで継続的にタスクを実行できますか？">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ** はスケジュール済みまたは繰り返しタスク用です（再起動後も維持されます）。
    - **Heartbeat** は「メインセッション」の定期チェック用です。
    - **分離ジョブ** は、要約を投稿したりチャットに配信したりする自律エージェント用です。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか？">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限され、Skills は **Gateway ホスト** で利用資格がある場合にのみシステムプロンプトに表示されます。Linux では、ゲート制御を上書きしない限り、`apple-notes`、`apple-reminders`、`things-mac` のような `darwin` 専用 Skills は読み込まれません。

    サポートされるパターンは 3 つあります。

    **オプション A - Gateway を Mac で実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、その後 Linux から[リモートモード](#gateway-ports-already-running-and-remote-mode)または Tailscale 経由で接続します。Gateway ホストが macOS であるため、Skills は通常どおり読み込まれます。

    **オプション B - macOS ノードを使用する（SSH なし）。**
    Linux で Gateway を実行し、macOS ノード（メニューバーアプリ）をペアリングして、Mac の **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリがノード上に存在する場合、OpenClaw は macOS 専用 Skills を利用資格ありとして扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする（高度）。**
    Gateway は Linux に置いたまま、必要な CLI バイナリが Mac 上で実行される SSH ラッパーに解決されるようにします。その後、Skill を上書きして Linux を許可し、利用資格を維持します。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホストの `PATH` 上にラッパーを置きます（例: `~/bin/memo`）。
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

  <Accordion title="Notion や HeyGen の連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / Plugin:** 信頼性の高い API アクセスに最適です（Notion/HeyGen はどちらも API があります）。
    - **ブラウザー自動化:** コードなしで動作しますが、遅く、壊れやすくなります。

    クライアントごとにコンテキストを保持したい場合（エージェンシーワークフロー）、単純なパターンは次のとおりです。

    - クライアントごとに Notion ページを 1 つ用意する（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時にそのページを取得するようエージェントに依頼する。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、それらの API を対象にした Skill を構築してください。

    Skills をインストールする:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で共有する Skills は、`~/.openclaw/skills/<name>/SKILL.md` に配置します。共有インストールを一部のエージェントだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew でインストールされたバイナリを想定しています。Linux では Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既にサインイン済みの Chrome を OpenClaw で使うにはどうすればよいですか？">
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

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザーノードを使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシン上でノードホストを実行するか、代わりにリモート CDP を使用します。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に 1 ファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか？">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ（Docker 内の完全な Gateway またはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Docker は制限が多いように感じます。全機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、システムパッケージ、Homebrew、バンドル済みブラウザーは含まれません。より完全なセットアップにするには:

    - キャッシュが維持されるように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに焼き込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用に保ちつつ、グループは公開/サンドボックス化できますか？">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使用すると、グループ/チャンネルセッション（非メインキー）は設定されたサンドボックスバックエンドで実行され、一方メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用可能なツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人用 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスのファイルシステム境界を迂回することを覚えておいてください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正準パスの両方に対してバインドソースを検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンク親による脱出は失敗終了し、許可ルートチェックはシンボリックリンク解決後も適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)と[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルにすぎません。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の整理済み長期ノート（メイン/プライベートセッションのみ）

    OpenClaw は、モデルに自動 Compaction 前に永続ノートを書くよう促すため、**サイレントな Compaction 前メモリフラッシュ** も実行します。
    これはワークスペースが書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md`、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入れます。

    これはまだ改善中の領域です。モデルにメモリを保存するようリマインドすると役立ちます。
    モデルは何をすべきか理解します。忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使用していることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限は何ですか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限になるのはモデルではなくストレージです。**セッションコンテキスト** は引き続きモデルのコンテキストウィンドウによって制限されるため、長い会話は compact または truncate されることがあります。これがメモリ検索が存在する理由です。関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuth はチャット/補完を対象にしており、
    embeddings へのアクセス権は付与**しません**。そのため、**Codex でサインイン（OAuth または
    Codex CLI ログイン）**してもセマンティックメモリ検索には役立ちません。OpenAI embeddings
    には引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    Provider を明示的に設定していない場合、OpenClaw は API キーを解決できるときに
    Provider を自動選択します（認証プロファイル、`models.providers.*.apiKey`、または環境変数）。
    OpenAI キーを解決できる場合は OpenAI を優先し、それ以外では Gemini キーを
    解決できる場合は Gemini、次に Voyage、次に Mistral を使います。リモートキーが利用できない場合、
    メモリ検索は設定されるまで無効のままです。ローカルモデルパスが
    設定済みで存在する場合、OpenClaw は
    `local` を優先します。`memorySearch.provider = "ollama"` を明示的に設定すると、
    Ollama もサポートされます。

    ローカルのまま使いたい場合は、`memorySearch.provider = "local"` を設定します（必要に応じて
    `memorySearch.fallback = "none"` も設定します）。Gemini embeddings を使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の embedding
    モデルをサポートしています。セットアップの詳細は [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の配置場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      （`~/.openclaw` + ワークスペースディレクトリ）。
    - **必要によりリモート:** モデル Provider（Anthropic/OpenAI など）に送信するメッセージは
      それらの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      自社サーバーに保存します。
    - **フットプリントは制御可能:** ローカルモデルを使うとプロンプトは自分のマシン上に留まりますが、チャネル
      トラフィックは引き続きチャネルのサーバーを経由します。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef Provider 用の任意のファイル backed シークレットペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリは削除済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider の状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、skills など）は別で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**に置きます。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意の `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャネル/Provider の状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、以下により設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、起動ごとに Gateway が同じ
    ワークスペースを使っていることを確認してください（また、リモートモードではローカルのノート PC ではなく
    **Gateway ホストの**ワークスペースを使うことも忘れないでください）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、ボットに
    **AGENTS.md または MEMORY.md に書き込む**よう依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**プライベート** git リポジトリに置き、
    プライベートな場所（たとえば GitHub private）にバックアップします。これによりメモリ + AGENTS/SOUL/USER
    ファイルを保存でき、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。
    完全復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    個別にバックアップしてください（上記の移行に関する質問を参照）。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするには？">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルトの cwd** とメモリアンカーであり、強制的なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックスが有効でない限り、絶対パスは他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使ってください。リポジトリを
    デフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。
    意図的にエージェントをその中で作業させたい場合を除き、ワークスペースは分けておいてください。

    例（リポジトリをデフォルト cwd にする）:

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
    セッション状態は**Gateway ホスト**が所有します。リモートモードでは、重要なセッションストアはローカルのノート PC ではなくリモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から任意の **JSON5** 設定を読み取ります（デフォルト: `~/.openclaw/openclaw.json`）。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` のデフォルトワークスペースを含む）を使います。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら何も listen しない / UI が unauthorized と表示する'>
    非 loopback bind には**有効な Gateway 認証パスが必要**です。実際には以下を意味します。

    - shared-secret 認証: トークンまたはパスワード
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

    - `gateway.remote.token` / `.password` だけではローカル Gateway 認証は有効になりません。
    - ローカル呼び出しパスでは、`gateway.auth.*` が未設定の場合に限り `gateway.remote.*` をフォールバックとして使えます。
    - パスワード認証では、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は fail closed します（リモートフォールバックによる隠蔽はありません）。
    - shared-secret の Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` などの identity-bearing モードは代わりにリクエストヘッダーを使います。URL に shared secret を入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストの loopback リバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内の loopback エントリが必要です。

  </Accordion>

  <Accordion title="なぜ今は localhost でもトークンが必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで Gateway 認証を強制します。通常のデフォルトパスではこれはトークン認証を意味します。明示的な認証パスが設定されていない場合、Gateway 起動時にトークンモードへ解決され、トークンが自動生成されて `gateway.auth.token` に保存されるため、**ローカル WS クライアントも認証が必要**です。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを使いたい場合は、パスワードモード（または identity-aware リバースプロキシ向けの `trusted-proxy`）を明示的に選択できます。**本当に** open loopback にしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定変更後に再起動する必要がありますか？">
    Gateway は設定を監視し、ホットリロードをサポートしています。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動します
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="面白い CLI タグラインを無効にするには？">
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

    - `off`: タグラインテキストを非表示にしますが、バナータイトル/バージョン行は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナーをまったく表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web fetch）を有効にするには？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    Provider に依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API backed Provider には、通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使い、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホストです。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行し、Provider を選択します。
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

    プロバイダー固有の Web 検索設定は、現在 `plugins.entries.<plugin>.config.webSearch.*` の下にあります。
    互換性のため、従来の `tools.web.search.*` プロバイダーパスも一時的に読み込まれますが、新しい設定では使用しないでください。
    Firecrawl Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    注記:

    - allowlist を使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` が省略されている場合、OpenClaw は利用可能な認証情報から最初に準備完了の取得フォールバックプロバイダーを自動検出します。現在、バンドルされているプロバイダーは Firecrawl です。
    - デーモンは `~/.openclaw/.env`（またはサービス環境）から env vars を読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消してしまいました。どう復旧し、これを避ければよいですか？">
    `config.apply` は **設定全体**を置き換えます。部分的なオブジェクトを送信すると、それ以外はすべて
    削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway はフェイルクローズするかリロードをスキップします。`openclaw.json` は書き換えません。
    - `openclaw doctor --fix` が修復を担い、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら last-known-good を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - 有効な設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を確認します。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - last-known-good や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行して channels/models を再設定します。
    - これが想定外だった場合は、バグを報告し、最後に確認できている設定またはバックアップを含めてください。
    - ローカルのコーディングエージェントは、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避方法:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。ドリルダウン用に、浅いスキーマノードと直下の子の概要を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は完全な設定置き換えのみに使用します。
    - エージェント実行から owner-only の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護された exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [Config](/ja-JP/cli/config)、[Configure](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="デバイスをまたいで専門化されたワーカーを持つ中央 Gateway を実行するにはどうすればよいですか？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **nodes** と **agents** を組み合わせる構成です。

    - **Gateway（中央）:** channels（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **Nodes（デバイス）:** Macs/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **Agents（ワーカー）:** 特別な役割（例: 「Hetzner ops」、「Personal data」）用の別個の brains/workspaces です。
    - **Sub-agents:** 並列処理が必要なときに、メインエージェントからバックグラウンド作業を生成します。
    - **TUI:** Gateway に接続し、agents/sessions を切り替えます。

    ドキュメント: [Nodes](/ja-JP/nodes)、[リモートアクセス](/ja-JP/gateway/remote)、[Multi-Agent ルーティング](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

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

    デフォルトは `false`（表示あり）です。一部のサイトでは、ヘッドレスのほうがボット対策チェックを誘発しやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    ヘッドレスは **同じ Chromium エンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトは、ヘッドレスモードでの自動化により厳格です（CAPTCHA、ボット対策）。
      たとえば、X/Twitter はヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使用するにはどうすればよいですか？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway とノード

<AccordionGroup>
  <Accordion title="Telegram、Gateway、ノード間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway はエージェントを実行し、
    ノードツールが必要になった場合にのみ **Gateway WebSocket** 経由でノードを呼び出します。

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    ノードは受信プロバイダートラフィックを認識しません。ノード RPC 呼び出しだけを受け取ります。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、エージェントは私のコンピューターにどうアクセスできますか？">
    短い答え: **コンピューターをノードとしてペアリングします**。Gateway は別の場所で実行されますが、
    Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（画面、カメラ、システム）を呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達できることを確認します（tailnet バインドまたは SSH トンネル）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続して、
       ノードとして登録できるようにします。
    5. Gateway でノードを承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP ブリッジは不要です。ノードは Gateway WebSocket 経由で接続します。

    セキュリティの注意: macOS ノードをペアリングすると、そのマシンで `system.run` が可能になります。信頼できる
    デバイスだけをペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Gateway protocol](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが、返信がありません。次に何をすればよいですか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway ヘルス: `openclaw status`
    - Channel ヘルス: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH トンネル経由で接続している場合は、ローカルトンネルが稼働していて正しいポートを指していることを確認します。
    - allowlist（DM またはグループ）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[リモートアクセス](/ja-JP/gateway/remote)、[Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンスは互いに通信できますか（ローカル + VPS）？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼性の高い方法で配線できます。

    **最も簡単:** 両方のボットがアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使用します。
    Bot A から Bot B にメッセージを送信し、その後は通常どおり Bot B に返信させます。

    **CLI ブリッジ（汎用）:** 他方のボットが待ち受けているチャットを対象に、
    `openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行します。
    一方のボットがリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます
    （[リモートアクセス](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つのボットが無限ループしないようにガードレールを追加します（メンション時のみ、channel
    allowlist、または「ボットメッセージには返信しない」ルール）。

    ドキュメント: [リモートアクセス](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数のエージェントに別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数のエージェントをホストできます。それぞれが独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップであり、エージェントごとに 1 つの VPS を実行するよりもはるかに安価で簡単です。

    ハードな分離（セキュリティ境界）が必要な場合、または共有したくない大きく異なる設定がある場合にのみ、別々の VPS を使用します。それ以外の場合は、1 つの Gateway を維持し、
    複数のエージェントまたは sub-agents を使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人用ラップトップでノードを使用する利点はありますか？">
    はい。ノードはリモート Gateway からラップトップに到達するための第一級の方法であり、シェルアクセス以上のことを
    可能にします。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスのボックスで十分です。4 GB RAM で十分です）。そのため、常時稼働ホストにラップトップをノードとして加える構成が一般的です。

    - **受信 SSH は不要です。** ノードは Gateway WebSocket に外向きに接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` は、そのラップトップ上のノード allowlist/承認によって制御されます。
    - **より多くのデバイスツール。** ノードは `system.run` に加えて、`canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ラップトップ上のノードホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH はアドホックなシェルアクセスには問題ありませんが、継続的なエージェントワークフローと
    デバイス自動化にはノードのほうが簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="ノードは Gateway サービスを実行しますか？">
    いいえ。分離されたプロファイルを意図的に実行する場合を除き、ホストごとに実行する **Gateway** は 1 つだけにする必要があります（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）。ノードは Gateway に接続する周辺機器です
    （iOS/Android ノード、または macOS メニューバーアプリの「node mode」）。ヘッドレスノード
    ホストと CLI 制御については、[Node host CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1 つの設定サブツリーを、その浅いスキーマノード、一致した UI ヒント、直下の子の概要とともに検査します
    - `config.get`: 現在のスナップショット + ハッシュを取得します
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動します
    - `config.apply`: 検証 + 完全な設定置き換え。可能な場合はホットリロードし、必要な場合は再起動します
    - owner-only の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは、同じ保護された exec パスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これでワークスペースを設定し、bot を起動できるユーザーを制限します。

  </Accordion>

  <Accordion title="VPS で Tailscale を設定し、Mac から接続するには？">
    最小手順:

    1. **VPS にインストールしてログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログインする**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を持たせます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使います:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより Gateway は loopback にバインドされたまま、Tailscale 経由で HTTPS を公開します。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するには？">
    Serve は **Gateway Control UI + WS** を公開します。ノードは同じ Gateway WS エンドポイント経由で接続します。

    推奨設定:

    1. **VPS と Mac が同じ tailnet 上にあることを確認します**。
    2. **リモートモードで macOS アプリを使います**（SSH ターゲットには tailnet ホスト名を指定できます）。
       アプリは Gateway ポートをトンネルし、ノードとして接続します。
    3. Gateway で**ノードを承認**します:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS リモートモード](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノートPCにインストールすべきですか、それともノードを追加するだけでよいですか？">
    2台目のノートPCで **local tools**（screen/camera/exec）だけが必要な場合は、
    **ノード**として追加します。これにより単一の Gateway を維持し、設定の重複を避けられます。ローカルノードツールは
    現在 macOS のみ対応していますが、他の OS にも拡張する予定です。

    **強い分離**や、完全に分かれた2つの bot が必要な場合にのみ、2つ目の Gateway をインストールしてください。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数 Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに次を読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバル fallback `.env`

    どちらの `.env` ファイルも既存の環境変数を上書きしません。

    設定内でインライン環境変数を定義することもできます（プロセス環境にない場合にのみ適用されます）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    優先順位とソースの詳細は [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="サービス経由で Gateway を起動したら環境変数が消えました。どうすればよいですか？">
    よくある修正は2つあります:

    1. 欠けているキーを `~/.openclaw/.env` に入れると、サービスが shell 環境を継承しない場合でも読み込まれます。
    2. shell import を有効にします（オプトインの便利機能）:

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

    これはログイン shell を実行し、欠けている想定キーだけを import します（上書きはしません）。対応する環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。"Shell env: off"
    は環境変数が欠けているという意味では**ありません**。OpenClaw がログイン shell を自動的に読み込まないという意味だけです。

    Gateway がサービス（launchd/systemd）として実行されている場合、shell
    環境は継承されません。次のいずれかで修正します:

    1. トークンを `~/.openclaw/.env` に入れます:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効にします。
    3. または設定の `env` ブロックに追加します（欠けている場合にのみ適用されます）。

    その後 Gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot トークンは `COPILOT_GITHUB_TOKEN`（また `GH_TOKEN` / `GITHUB_TOKEN`）から読み込まれます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるには？">
    スタンドアロンメッセージとして `/new` または `/reset` を送信します。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送らない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできますが、これは**デフォルトでは無効**です（デフォルトは **0**）。
    アイドル期限切れを有効にするには、正の値に設定します。有効にすると、アイドル期間後の**次の**
    メッセージで、そのチャットキーの新しいセッション ID が開始されます。
    これは transcript を削除するものではありません。新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1人の CEO と多数の agents）を作る方法はありますか？">
    はい、**multi-agent routing** と **sub-agents** で可能です。1つの coordinator
    agent と、それぞれ独自のワークスペースとモデルを持つ複数の worker agents を作成できます。

    ただし、これは**楽しい実験**として捉えるのが最適です。トークン消費が大きく、多くの場合、
    個別セッションを持つ1つの bot を使うより効率が落ちます。私たちが想定する典型的なモデルは、
    話しかける bot は1つで、並行作業には異なるセッションを使う形です。その bot は必要に応じて sub-agents を起動することもできます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[Agents CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスク中にコンテキストが切り詰められたのはなぜですか？どう防げますか？">
    セッションコンテキストはモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、または多数の
    ファイルによって Compaction や切り詰めが発生することがあります。

    役立つ対策:

    - bot に現在の状態を要約してファイルに書き込むよう依頼します。
    - 長いタスクの前に `/compact` を使い、トピックを切り替えるときは `/new` を使います。
    - 重要なコンテキストをワークスペースに保持し、bot に読み返すよう依頼します。
    - 長い作業や並行作業には sub-agents を使い、メインチャットを小さく保ちます。
    - これが頻繁に起きる場合は、より大きなコンテキストウィンドウを持つモデルを選びます。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするには？">
    reset コマンドを使います:

    ```bash
    openclaw reset
    ```

    非対話式の full reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - 既存設定を検出すると、オンボーディングでも **Reset** が提示されます。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っている場合は、各 state dir をリセットします（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発設定 + 認証情報 + セッション + ワークスペースを消去します）。

  </Accordion>

  <Accordion title='"context too large" エラーが出ます。リセットまたは compact するには？'>
    次のいずれかを使います:

    - **Compact**（会話を保持しつつ、古い turn を要約します）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約を誘導します。

    - **Reset**（同じチャットキーに対して新しいセッション ID）:

      ```
      /new
      /reset
      ```

    何度も起きる場合:

    - 古いツール出力を削るため、**session pruning**（`agents.defaults.contextPruning`）を有効化または調整します。
    - より大きなコンテキストウィンドウを持つモデルを使います。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[Session pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これは provider の検証エラーです。モデルが必須の `input` なしで `tool_use` ブロックを出力しました。
    通常、セッション履歴が古いか壊れていることを意味します（長いスレッド
    やツール/スキーマ変更の後によく起きます）。

    修正: `/new`（スタンドアロンメッセージ）で新しいセッションを開始します。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごと（OAuth 認証を使う場合は **1h**）に実行されます。調整または無効化できます:

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
    ヘッダーのみ）の場合、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップします。
    ファイルが存在しない場合でも heartbeat は実行され、モデルが何をするかを判断します。

    agent ごとの上書きには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループに "bot account" を追加する必要はありますか？'>
    いいえ。OpenClaw は**自分のアカウント**で実行されるため、自分がグループにいれば OpenClaw はそれを見られます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    **自分だけ**がグループ返信を起動できるようにしたい場合:

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
    オプション 1（最速）: ログを tail し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探します。例:
    `1234567890-1234567890@g.us`。

    オプション 2（すでに設定済み/allowlist 済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[Logs](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw がグループで返信しないのはなぜですか？">
    よくある原因は2つあります:

    - mention gating が有効です（デフォルト）。bot を @mention する（または `mentionPatterns` に一致する）必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist に含まれていません。

    [グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドは DM とコンテキストを共有しますか？">
    ダイレクトチャットはデフォルトでメインセッションにまとめられます。グループ/チャンネルには独自のセッションキーがあり、Telegram トピック / Discord スレッドは別セッションです。[グループ](/ja-JP/channels/groups) と [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="作成できるワークスペースと agents の数はいくつですか？">
    厳密な制限はありません。数十（数百でも）問題ありませんが、次に注意してください:

    - **ディスク増加:** セッション + transcript は `~/.openclaw/agents/<agentId>/sessions/` 配下にあります。
    - **トークンコスト:** agents が増えるほど、同時モデル使用量が増えます。
    - **運用負荷:** agent ごとの auth profiles、ワークスペース、channel routing。

    ヒント:

    - agent ごとに1つの**アクティブな**ワークスペース（`agents.defaults.workspace`）を維持します。
    - ディスクが増えた場合は、古いセッションを pruning します（JSONL または store entries を削除）。
    - stray workspaces や profile mismatches を見つけるには `openclaw doctor` を使います。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）。また、どのように設定すればよいですか？">
    はい。**マルチエージェントルーティング**を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャネル/アカウント/ピアごとにルーティングできます。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザーアクセスは強力ですが、「人間ができることなら何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザー制御には、ホスト上のローカル Chrome MCP を使用するか、
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

モデル Q&A（デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル）は、
[モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使用しますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が "Runtime: running" と表示する一方で "Connectivity probe: failed" と表示するのはなぜですか？'>
    「running」は **スーパーバイザー**側の見方（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に Gateway WebSocket へ接続する処理です。

    `openclaw gateway status` を使用し、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使用した URL）
    - `Listening:`（ポートで実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートが listen していない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で "Config (cli)" と "Config (service)" が異なるのはなぜですか？'>
    サービスが別の設定ファイルで動作しているのに、別の設定ファイルを編集しています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境からこれを実行してください。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" は何を意味しますか？'>
    OpenClaw は起動直後に WebSocket リスナーをバインドすることでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでに listen していることを示す `GatewayLockError` をスローします。

    修正: 他のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="リモートモード（クライアントが別の場所の Gateway に接続する）で OpenClaw を実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート資格情報とともに、リモート WebSocket URL を指定します:

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
    - macOS アプリは設定ファイルを監視し、これらの値が変更されるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側のリモート資格情報のみです。それ自体ではローカル Gateway 認証を有効にしません。

  </Accordion>

  <Accordion title='Control UI に "unauthorized" と表示される（または再接続を繰り返す）場合はどうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザータブセッションと選択された Gateway URL について、トークンを `sessionStorage` に保持します。そのため、同じタブでの更新は、長期保存される localStorage トークン永続化を復元しなくても引き続き動作します。
    - `AUTH_TOKEN_MISMATCH` では、Gateway がリトライヒント（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返す場合、信頼済みクライアントはキャッシュされたデバイストークンで 1 回だけ制限付きリトライを試行できます。
    - そのキャッシュトークンリトライは、デバイストークンとともに保存されたキャッシュ済み承認済みスコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュされたスコープを継承せず、引き続き要求したスコープセットを保持します。
    - そのリトライ経路の外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップ operator 許可リストは operator 要求のみを満たします。node やその他の非 operator ロールは、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力してコピーし、開こうとします。ヘッドレスの場合は SSH のヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale ID ヘッダーをバイパスする生の loopback/tailnet URL ではなく、Serve URL を開いていることを確認してください。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、設定済みの ID 対応プロキシ経由でアクセスしていることを確認してください。同一ホストの loopback プロキシにも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1 回のリトライ後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認します:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の 2 点を確認してください:
      - ペアリング済みデバイスセッションがローテーションできるのは、`operator.admin` も持っていない限り **自分自身**のデバイスだけです
      - 明示的な `--scope` 値は、呼び出し元の現在の operator スコープを超えることはできません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、バインドできず何も listen しません">
    `tailnet` バインドは、ネットワークインターフェイスから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale 上にない場合（またはインターフェイスが停止している場合）、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用のバインドが必要な場合は `gateway.bind: "tailnet"` を使用してください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1 つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。複数の Gateway は、冗長性（例: レスキューボット）または強い分離が必要な場合にのみ使用してください。

    可能ですが、次を分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイック設定（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使用します（`~/.openclaw-<name>` を自動作成します）。
    - 各プロファイル設定で一意の `gateway.port` を設定します（または手動実行では `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`、レガシーの `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / コード 1008 は何を意味しますか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受信すると、**コード 1008**（ポリシー違反）で
    接続を閉じます。

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

    最速のログ tail:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーログ（Gateway が launchd/systemd 経由で実行される場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`、プロファイルは `~/.openclaw-<profile>/logs/...` を使用）
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

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するにはどうすればよいですか？">
    **Windows のインストールモードは 2 つ**あります:

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入ってから再起動します:

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

    手動で実行している場合（サービスなし）は、次を使用します:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway サービス運用手順](/ja-JP/gateway).

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信が届きません。何を確認すべきですか？">
    簡単なヘルスチェックから始めます:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - モデル認証が **Gateway ホスト**に読み込まれていない（`models status` を確認）。
    - チャネルのペアリング/許可リストが返信をブロックしている（チャネル設定とログを確認）。
    - WebChat/Dashboard が正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が稼働しており、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャネル](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [リモートアクセス](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 次に何をすべきですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。確認してください:

    1. Gateway は実行中ですか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI に正しいトークンがありますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは稼働していますか？

    次にログを tail します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか？">
    ログとチャネルステータスから始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限に合わせて切り詰め、より少ないコマンドで再試行しますが、それでも一部のメニュー項目を削除する必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上にいる、またはプロキシの背後にいる場合は、アウトバウンド HTTPS が許可されており、`api.telegram.org` の DNS が機能していることを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず Gateway に到達でき、エージェントを実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    チャネルで返信を期待している場合は、配信が有効になっていることを確認してください (`/deliver on`)。

    ドキュメント: [TUI](/ja-JP/web/tui)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視対象サービス** (macOS では launchd、Linux では systemd) を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使います。

    フォアグラウンドで実行している場合は、Ctrl-C で停止してから:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway サービス runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス** (launchd/systemd) を再起動します。
    - `openclaw gateway`: このターミナルセッションで gateway を **フォアグラウンド** で実行します。

    サービスをインストールしている場合は、gateway コマンドを使います。
    単発のフォアグラウンド実行をしたい場合は `openclaw gateway` を使います。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    `--verbose` を付けて Gateway を起動すると、コンソールの詳細が増えます。その後、チャネル認証、モデルルーティング、RPC エラーについてログファイルを調べます。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="自分の skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからのアウトバウンド添付ファイルには、(単独行の) `MEDIA:<path-or-url>` 行を含める必要があります。[OpenClaw アシスタント設定](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください。

    - ターゲットチャネルがアウトバウンドメディアをサポートしており、allowlist でブロックされていない。
    - ファイルがプロバイダーのサイズ制限内にある (画像は最大 2048px にリサイズされます)。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、sandbox で検証済みのファイルに制限します。
    - `tools.fs.workspaceOnly=false` にすると、`MEDIA:` はエージェントがすでに読み取れるホストローカルファイルを送信できますが、メディアと安全なドキュメントタイプ (画像、音声、動画、PDF、Office ドキュメント) に限られます。プレーンテキストや秘密情報らしいファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw をインバウンド DM に公開しても安全ですか？">
    インバウンド DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています。

    - DM 対応チャネルのデフォルト動作は **ペアリング** です:
      - 未知の送信者はペアリングコードを受け取り、bot はそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは **チャネルごとに 3 件** に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには、明示的なオプトイン (`dmPolicy: "open"` と allowlist `"*"`) が必要です。

    `openclaw doctor` を実行して、危険な DM ポリシーを表示します。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開 bot だけの問題ですか？">
    いいえ。プロンプトインジェクションは、bot に DM できる相手だけでなく、**信頼できないコンテンツ** に関するものです。
    アシスタントが外部コンテンツ (Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ) を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれている可能性があります。これは **送信者があなただけ** の場合でも起こり得ます。

    最大のリスクはツールが有効になっている場合です。モデルがだまされて、
    コンテキストを外部に漏らしたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効のエージェントでは `web_search` / `web_fetch` / `browser` をオフにしておく
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses
      `input_file` とメディア添付ファイル抽出はどちらも、生のファイルテキストを渡すのではなく、抽出したテキストを
      明示的な外部コンテンツ境界マーカーでラップします
    - sandbox と厳格なツール allowlist を使う

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="自分の bot に専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    ほとんどのセットアップでは、はい。bot を別のアカウントや電話番号で分離すると、
    何か問題が起きた場合の影響範囲を減らせます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントだけにアクセスを付与し、必要になったら
    後で拡張します。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えてもよいですか？それは安全ですか？">
    個人メッセージに対する完全な自律性は **推奨しません**。最も安全なパターンは次のとおりです。

    - DM は **ペアリングモード** または厳格な allowlist に保つ。
    - 自分の代わりにメッセージを送信させたい場合は、**別の番号またはアカウント** を使う。
    - 下書きを作らせてから、**送信前に承認** する。

    試したい場合は、専用アカウントで行い、分離したままにしてください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントのタスクに安価なモデルを使えますか？">
    はい、エージェントがチャット専用で、入力が信頼できる場合は可能です。小さいティアは
    指示の乗っ取りを受けやすいため、ツール有効のエージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、ツールをロックダウンし、
    sandbox 内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードは、未知の送信者が bot にメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合 **のみ** 送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分の送信者 id を allowlist に追加するか、そのアカウントの `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 自分の連絡先にメッセージしますか？ペアリングはどのように機能しますか？">
    いいえ。デフォルトの WhatsApp DM ポリシーは **ペアリング** です。未知の送信者はペアリングコードだけを受け取り、そのメッセージは **処理されません**。OpenClaw は受信したチャット、またはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは、あなた自身の DM が許可されるように **allowlist/owner** を設定するために使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

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
    **inherit** に設定してください。また、config で `verboseDefault` が `on` に設定された bot プロファイルを使っていないことも確認してください。

    ドキュメント: [Thinking と verbose](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを **単独のメッセージ** として送信します (スラッシュなし)。

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

    これらは中止トリガーです (スラッシュコマンドではありません)。

    バックグラウンドプロセス (exec ツール由来) については、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる **単独の** メッセージとして送信する必要がありますが、いくつかのショートカット (`/status` など) は allowlist に入っている送信者であればインラインでも機能します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送信するにはどうすればよいですか？ ("Cross-context messaging denied")'>
    OpenClaw はデフォルトで **プロバイダー間** メッセージングをブロックします。ツール呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。

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

    config を編集した後、gateway を再起動してください。

  </Accordion>

  <Accordion title='bot が連続メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、新しいメッセージが実行中の run とどのように相互作用するかを制御します。`/queue` を使ってモードを変更します。

    - `steer` - 現在の run の次のモデル境界まで、保留中のすべての steering をキューに入れる
    - `queue` - 従来の 1 回ずつの steering
    - `followup` - メッセージを 1 つずつ実行する
    - `collect` - メッセージをバッチ化し、1 回だけ返信する
    - `steer-backlog` - 今すぐ steer し、その後 backlog を処理する
    - `interrupt` - 現在の run を中止し、新しく開始する

    デフォルトモードは `steer` です。followup モードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [Steering キュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キー使用時の Anthropic のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または認証プロファイルに Anthropic API キーを保存する）と認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` が表示される場合、実行中のエージェントの想定される `auth-profiles.json` 内で Gateway が Anthropic の認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ詰まっていますか？[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions)を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
