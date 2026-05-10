---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムサポートに関する質問への回答
    - 詳細なデバッグの前にユーザーから報告された問題をトリアージする
summary: OpenClaw のセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-05-10T19:38:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

実運用セットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルフェイルオーバー）向けのクイック回答と、より深いトラブルシューティングです。ランタイム診断については [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。完全な構成リファレンスについては [構成](/ja-JP/gateway/configuration) を参照してください。

## 何かが壊れている場合の最初の 60 秒

1. **クイックステータス（最初に確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、Gateway/サービス到達性、エージェント/セッション、プロバイダー構成 + ランタイム問題（Gateway に到達できる場合）。

2. **貼り付け可能なレポート（共有しても安全）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは伏せ字）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーランタイムと RPC 到達性、プローブ対象 URL、サービスが使用した可能性が高い構成を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   対応している場合はチャネルプローブを含め、ライブ Gateway ヘルスプローブを実行します
   （到達可能な Gateway が必要です）。[ヘルス](/ja-JP/gateway/health) を参照してください。

5. **最新ログを追尾**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、次にフォールバックします:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[ロギング](/ja-JP/logging) と [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   構成/状態を修復/移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS のみ）。[ヘルス](/ja-JP/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

初回実行の Q&A（インストール、オンボーディング、認証ルート、サブスクリプション、初期失敗）は
[初回実行 FAQ](/ja-JP/help/faq-first-run) にあります。

## OpenClaw とは何ですか？

<AccordionGroup>
  <Accordion title="OpenClaw とは何ですか？一段落で説明してください">
    OpenClaw は、自分のデバイスで動かすパーソナル AI アシスタントです。普段使っているメッセージング環境（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、QQ Bot などの同梱チャネル Plugin）で返信でき、対応プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働のコントロールプレーンであり、アシスタントが製品です。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「単なる Claude ラッパー」ではありません。これは **ローカルファーストのコントロールプレーン**であり、
    **自分のハードウェア**上で有能なアシスタントを実行し、普段使っているチャットアプリからアクセスでき、
    状態を保持するセッション、メモリ、ツールを使えます。ホスト型 SaaS にワークフローの制御を渡す必要はありません。

    主な特徴:

    - **自分のデバイス、自分のデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行し、
      ワークスペース + セッション履歴をローカルに保持できます。
    - **Web サンドボックスではなく、実チャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      さらに対応プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティング
      とフェイルオーバーで利用できます。
    - **ローカルのみの選択肢:** 必要ならローカルモデルを実行し、**すべてのデータを自分のデバイス上に保持できます**。
    - **マルチエージェントルーティング:** チャネル、アカウント、タスクごとにエージェントを分け、それぞれに独自の
      ワークスペースと既定値を持たせられます。
    - **オープンソースで改造しやすい:** ベンダーロックインなしで、検査、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway)、[チャネル](/ja-JP/channels)、[マルチエージェント](/ja-JP/concepts/multi-agent)、
    [メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです - 最初に何をすべきですか？">
    最初に試すのに適したプロジェクト:

    - Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリのプロトタイプを作る（アウトライン、画面、API 計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続して、要約やフォローアップを自動化する。

    大きなタスクにも対応できますが、フェーズに分け、
    並列作業にはサブエージェントを使うと最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な上位 5 つのユースケースは何ですか？">
    日常で効果が出やすい例:

    - **パーソナルブリーフィング:** 受信トレイ、カレンダー、関心のあるニュースの要約。
    - **リサーチと下書き:** メールやドキュメント向けの素早いリサーチ、要約、初稿。
    - **リマインダーとフォローアップ:** Cron または Heartbeat 駆動の通知とチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Web タスクの反復。
    - **デバイス間の連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS のリード獲得、アウトリーチ、広告、ブログに役立ちますか？">
    はい、**リサーチ、見込み客の評価、下書き**に使えます。サイトをスキャンし、候補リストを作り、
    見込み客を要約し、アウトリーチや広告コピーの下書きを作成できます。

    **アウトリーチや広告配信**では、人間による確認を入れてください。スパムを避け、地域の法律と
    プラットフォームポリシーに従い、送信前に必ずレビューしてください。最も安全なパターンは、
    OpenClaw に下書きさせ、あなたが承認することです。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発における Claude Code との比較での利点は何ですか？">
    OpenClaw は**パーソナルアシスタント**兼調整レイヤーであり、IDE の置き換えではありません。
    リポジトリ内で最速の直接的なコーディングループには Claude Code や Codex を使います。永続的なメモリ、
    デバイス横断アクセス、ツールオーケストレーションが欲しい場合は OpenClaw を使います。

    利点:

    - **永続的なメモリ + ワークスペース**がセッションをまたいで継続
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（ブラウザー、ファイル、スケジューリング、フック）
    - **常時稼働の Gateway**（VPS で実行し、どこからでも操作）
    - ローカルのブラウザー/画面/カメラ/exec 用の **ノード**

    ショーケース: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを未コミット変更で汚さずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内コピーを編集する代わりに、管理されたオーバーライドを使います。変更は `~/.openclaw/skills/<name>/SKILL.md` に置きます（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` なので、管理されたオーバーライドは git に触れずに同梱 Skills より優先されます。Skills をグローバルにインストールする必要があるが一部のエージェントだけに見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御します。上流に取り込む価値のある編集だけをリポジトリに置き、PR として出してください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを追加します（最も低い優先順位）。既定の優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 → `skills.load.extraDirs` です。`clawhub` は既定で `./skills` にインストールし、OpenClaw は次のセッションでそれを `<workspace>/skills` として扱います。その Skills を特定のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせます。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現時点でサポートされるパターンは次のとおりです:

    - **Cron ジョブ**: 分離されたジョブでは、ジョブごとに `model` オーバーライドを設定できます。
    - **サブエージェント**: 異なる既定モデルを持つ別々のエージェントにタスクをルーティングします。
    - **オンデマンド切り替え**: `/model` を使うと、現在のセッションモデルをいつでも切り替えられます。

    [Cron ジョブ](/ja-JP/automation/cron-jobs)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="ボットが重い作業中に固まります。どうやってオフロードできますか？">
    長時間または並列のタスクには**サブエージェント**を使います。サブエージェントは独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    ボットに「このタスクのためにサブエージェントを起動して」と依頼するか、`/subagents` を使います。
    チャットで `/status` を使うと、Gateway が現在何をしているか（そしてビジーかどうか）を確認できます。

    トークンに関するヒント: 長いタスクとサブエージェントはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` でサブエージェント用に安価なモデルを設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord でスレッドにバインドされたサブエージェントセッションはどのように動作しますか？">
    スレッドバインディングを使います。Discord のスレッドをサブエージェントまたはセッションターゲットにバインドでき、そのスレッド内の後続メッセージはバインドされたセッションに留まります。

    基本フロー:

    - `thread: true` を使って `sessions_spawn` で生成します（永続的なフォローアップ用に、必要なら `mode: "session"` も指定します）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` を使ってバインディング状態を確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` を使って自動フォーカス解除を制御します。
    - `/unfocus` を使ってスレッドを切り離します。

    必要な構成:

    - グローバル既定値: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成時の自動バインド: `channels.discord.threadBindings.spawnSessions` の既定値は `true` です。スレッドにバインドされたセッション生成を無効にするには `false` に設定します。

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[構成リファレンス](/ja-JP/gateway/configuration-reference)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="サブエージェントが終了しましたが、完了更新が間違った場所に送られたか、投稿されませんでした。何を確認すべきですか？">
    まず解決されたリクエスターのルートを確認してください:

    - 完了モードのサブエージェント配信は、バインド済みスレッドまたは会話ルートが存在する場合、それを優先します。
    - 完了元がチャネルしか持たない場合、OpenClaw はリクエスターセッションの保存済みルート（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が成功し得ます。
    - バインド済みルートも利用可能な保存済みルートも存在しない場合、直接配信は失敗し、結果はチャットへ即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでも、キューフォールバックや最終的な配信失敗が強制される場合があります。
    - 子の最後に見えるアシスタント返信が正確なサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` の場合、OpenClaw は古い先行進捗を投稿する代わりに告知を意図的に抑制します。
    - 子がツール呼び出しだけの後にタイムアウトした場合、告知は生のツール出力を再生する代わりに、それを短い部分進捗要約へ圧縮できます。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [サブエージェント](/ja-JP/tools/subagents)、[バックグラウンドタスク](/ja-JP/automation/tasks)、[セッションツール](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron またはリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway プロセス内で実行されます。Gateway が継続的に稼働していない場合、
    スケジュール済みジョブは実行されません。

    チェックリスト:

    - Cron が有効（`cron.enabled`）で、`OPENCLAW_SKIP_CRON` が設定されていないことを確認します。
    - Gateway が 24/7 稼働していることを確認します（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定を確認します（`--tz` とホストのタイムゾーン）。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cron は起動したのに、チャネルに何も送信されませんでした。なぜですか?">
    まず配信モードを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、ランナーのフォールバック送信が期待されないことを意味します。
    - アナウンス先 (`channel` / `to`) がない、または無効な場合、ランナーはアウトバウンド配信をスキップします。
    - チャネル認証の失敗 (`unauthorized`, `Forbidden`) は、ランナーが配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな隔離結果 (`NO_REPLY` / `no_reply` のみ) は、意図的に配信不可として扱われるため、ランナーはキューに入ったフォールバック配信も抑制します。

    隔離された cron ジョブでは、チャットルートが利用可能な場合、エージェントは引き続き `message`
    ツールで直接送信できます。`--announce` は、エージェントがまだ送信していない最終テキストに対するランナーの
    フォールバック経路だけを制御します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[バックグラウンドタスク](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="隔離された cron 実行がモデルを切り替えたり、1 回再試行したりしたのはなぜですか?">
    これは通常、重複スケジューリングではなく、ライブモデル切り替え経路です。

    隔離された cron は、アクティブな実行が `LiveSessionModelSwitchError` をスローしたときに、ランタイムモデルの引き継ぎを永続化して再試行できます。再試行では切り替え後の
    プロバイダー/モデルが維持され、切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合は、cron
    がそれも永続化してから再試行します。

    関連する選択ルール:

    - 該当する場合、Gmail フックのモデルオーバーライドが最優先されます。
    - 次にジョブごとの `model`。
    - 次に保存済みの cron セッションモデルオーバーライド。
    - 次に通常のエージェント/デフォルトモデル選択。

    再試行ループには上限があります。初回試行に加えて 2 回の切り替え再試行後、cron は無限ループせずに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか?">
    ネイティブの `openclaw skills` コマンドを使うか、ワークスペースに Skills を配置してください。macOS の Skills UI は Linux では利用できません。
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
    ディレクトリに書き込みます。自分の Skills を公開または同期したい場合にのみ、別個の `clawhub` CLI をインストールしてください。エージェント間で共有インストールする場合は、Skill を
    `~/.openclaw/skills` の下に置き、どのエージェントから見えるかを絞りたい場合は
    `agents.defaults.skills` または
    `agents.list[].skills` を使います。

  </Accordion>

  <Accordion title="OpenClaw はスケジュールに従って、または継続的にバックグラウンドでタスクを実行できますか?">
    はい。Gateway スケジューラーを使用します。

    - **Cron ジョブ**: スケジュールされたタスクや繰り返しタスク用です (再起動後も保持されます)。
    - **Heartbeat**: 「メインセッション」の定期チェック用です。
    - **隔離ジョブ**: 要約を投稿したりチャットへ配信したりする自律エージェント用です。

    ドキュメント: [Cron ジョブ](/ja-JP/automation/cron-jobs)、[自動化とタスク](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="Linux から Apple macOS 専用 Skills を実行できますか?">
    直接はできません。macOS Skills は `metadata.openclaw.os` と必要なバイナリによって制限され、Skills は **Gateway ホスト** で利用可能な場合にのみシステムプロンプトに表示されます。Linux では、`darwin` 専用 Skills (`apple-notes`、`apple-reminders`、`things-mac` など) は、ゲートをオーバーライドしない限り読み込まれません。

    サポートされているパターンは 3 つあります。

    **オプション A - Mac で Gateway を実行する (最も簡単)。**
    macOS バイナリが存在する場所で Gateway を実行し、Linux から [リモートモード](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway ホストが macOS なので、Skills は通常どおり読み込まれます。

    **オプション B - macOS ノードを使う (SSH なし)。**
    Linux で Gateway を実行し、macOS ノード (メニューバーアプリ) をペアリングし、Mac で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリがノードに存在する場合、OpenClaw は macOS 専用 Skills を利用可能として扱えます。エージェントは `nodes` ツール経由でそれらの Skills を実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプション C - SSH 経由で macOS バイナリをプロキシする (上級者向け)。**
    Gateway は Linux のままにし、必要な CLI バイナリが Mac 上で実行される SSH ラッパーとして解決されるようにします。その後、Skill をオーバーライドして Linux を許可し、利用可能な状態を維持します。

    1. バイナリ用の SSH ラッパーを作成します (例: Apple Notes 用の `memo`)。

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux ホストの `PATH` にラッパーを置きます (例: `~/bin/memo`)。
    3. Skill メタデータ (ワークスペースまたは `~/.openclaw/skills`) をオーバーライドして Linux を許可します。

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills スナップショットが更新されるように、新しいセッションを開始します。

  </Accordion>

  <Accordion title="Notion または HeyGen 連携はありますか?">
    現時点では組み込みではありません。

    選択肢:

    - **カスタム Skill / plugin:** 信頼性の高い API アクセスに最適です (Notion/HeyGen はどちらも API があります)。
    - **ブラウザー自動化:** コードなしで動作しますが、低速で壊れやすくなります。

    クライアントごとにコンテキストを維持したい場合 (代理店ワークフロー)、シンプルなパターンは次のとおりです。

    - クライアントごとに 1 つの Notion ページ (コンテキスト + 設定 + 進行中の作業)。
    - セッション開始時に、そのページを取得するようエージェントに依頼します。

    ネイティブ連携が必要な場合は、機能リクエストを開くか、それらの API を対象とした Skill
    を作成してください。

    Skills をインストールする:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなワークスペースの `skills/` ディレクトリに配置されます。エージェント間で Skills を共有する場合は、`~/.openclaw/skills/<name>/SKILL.md` に配置してください。一部のエージェントだけに共有インストールを見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定します。一部の Skills は Homebrew 経由でインストールされたバイナリを想定しています。Linux では Linuxbrew を意味します (上記の Homebrew Linux FAQ エントリを参照)。[Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか?">
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

    この経路では、ローカルホストのブラウザーまたは接続済みブラウザーノードを使用できます。Gateway が別の場所で実行されている場合は、ブラウザーマシンでノードホストを実行するか、代わりにリモート CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - アクションは ref 駆動であり、CSS セレクター駆動ではありません
    - アップロードには `ref` / `inputRef` が必要で、現時点では一度に 1 ファイルをサポートします
    - `responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションには、引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか?">
    はい。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。Docker 固有のセットアップ (Docker 内の完全な Gateway またはサンドボックスイメージ) については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker は制限が多く感じます。すべての機能を有効にするにはどうすればよいですか?">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、システムパッケージ、Homebrew、バンドルされたブラウザーは含まれていません。より完全なセットアップにするには:

    - キャッシュが保持されるように、`OPENCLAW_HOME_VOLUME` で `/home/node` を永続化します。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でシステム依存関係をイメージに組み込みます。
    - バンドルされた CLI 経由で Playwright ブラウザーをインストールします:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにします。

    ドキュメント: [Docker](/ja-JP/install/docker)、[ブラウザー](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1 つのエージェントで DM は個人用のままにし、グループは公開/サンドボックス化できますか?">
    はい。プライベートなトラフィックが **DM** で、公開トラフィックが **グループ** の場合です。

    `agents.defaults.sandbox.mode: "non-main"` を使うと、グループ/チャネルセッション (非メインキー) は設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。その後、`tools.sandbox.tools` でサンドボックス化されたセッションで利用できるツールを制限します。

    セットアップ手順 + 設定例: [グループ: 個人用 DM + 公開グループ](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにバインドするにはどうすればよいですか?">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定します (例: `"/home/user/src:/src:ro"`)。グローバルバインドとエージェントごとのバインドはマージされます。`scope: "shared"` の場合、エージェントごとのバインドは無視されます。機密性の高いものには `:ro` を使用し、バインドはサンドボックスのファイルシステム壁をバイパスすることを忘れないでください。

    OpenClaw は、正規化されたパスと、最も深い既存の祖先を通じて解決された正準パスの両方に対してバインド元を検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、シンボリックリンクの親経由の脱出は失敗として閉じられ、シンボリックリンク解決後も許可ルートのチェックが適用されます。

    例と安全上の注意については、[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか?">
    OpenClaw のメモリは、エージェントワークスペース内の Markdown ファイルにすぎません。

    - `memory/YYYY-MM-DD.md` の日次ノート
    - `MEMORY.md` の整理された長期ノート (メイン/プライベートセッションのみ)

    OpenClaw は、モデルに自動 Compaction の前に永続的なノートを書き込むよう促すため、**サイレントな Compaction 前メモリフラッシュ** も実行します。これはワークスペースが書き込み可能な場合にのみ実行されます (読み取り専用サンドボックスではスキップされます)。[メモリ](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか?">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入れます。

    これはまだ改善中の領域です。メモリを保存するようモデルに思い出させると役に立ちます。
    モデルは何をすべきか理解します。それでも忘れ続ける場合は、Gateway が毎回同じ
    ワークスペースを使っていることを確認してください。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永久に保持されますか? 制限は何ですか?">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限はモデルではなく
    ストレージです。**セッションコンテキスト** は引き続きモデルのコンテキストウィンドウによって制限されるため、長い会話は Compaction または切り詰められることがあります。そのため
    メモリ検索があります。関連する部分だけをコンテキストに戻します。

    ドキュメント: [メモリ](/ja-JP/concepts/memory)、[コンテキスト](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索には OpenAI API キーが必要ですか？">
    **OpenAI 埋め込み**を使う場合のみ必要です。Codex OAuth はチャット/補完を対象とし、
    埋め込みアクセスは**付与しない**ため、**Codex でサインインしても（OAuth または
    Codex CLI login）**セマンティックメモリ検索には役立ちません。OpenAI 埋め込みには
    実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が
    引き続き必要です。

    プロバイダーを明示的に設定しない場合、OpenClaw は API キーを解決できるときに
    プロバイダーを自動選択します（認証プロファイル、`models.providers.*.apiKey`、または環境変数）。
    OpenAI キーを解決できる場合は OpenAI を優先し、それ以外では Gemini キーを
    解決できる場合は Gemini、次に Voyage、次に Mistral を優先します。リモートキーが
    利用できない場合、設定するまでメモリ検索は無効のままです。ローカルモデルパスが
    設定されていて存在する場合、OpenClaw は
    `local` を優先します。Ollama は `memorySearch.provider = "ollama"` を
    明示的に設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"` を設定します（必要に応じて
    `memorySearch.fallback = "none"` も設定します）。Gemini 埋め込みを使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定します。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の埋め込み
    モデルをサポートしています。設定の詳細は [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使われるすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル**ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、ワークスペースは Gateway ホスト上にあります
      （`~/.openclaw` + ワークスペースディレクトリ）。
    - **必要上リモート:** モデルプロバイダー（Anthropic/OpenAI など）に送信するメッセージは
      それらの API に送られ、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      サーバーに保存します。
    - **フットプリントは制御可能:** ローカルモデルを使うとプロンプトは自分のマシン上に留まりますが、チャンネル
      トラフィックは引き続きそのチャンネルのサーバーを通過します。

    関連: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)、[メモリ](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw はデータをどこに保存しますか？">
    すべて `$OPENCLAW_STATE_DIR` 配下にあります（デフォルト: `~/.openclaw`）。

    | パス                                                            | 目的                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシー OAuth インポート（初回使用時に認証プロファイルへコピー）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、省略可能な `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー用の省略可能なファイルベースのシークレットペイロード |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的な `api_key` エントリは削除済み）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | プロバイダー状態（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + セッション）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（エージェントごと）                                       |

    レガシーの単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **ワークスペース**（AGENTS.md、メモリファイル、Skills など）は別で、`agents.defaults.workspace` を通じて設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**エージェントワークスペース**にあります。

    - **ワークスペース（エージェントごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、省略可能な `HEARTBEAT.md`。
      ルートの小文字 `memory.md` はレガシー修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix` で `MEMORY.md` にマージできます。
    - **状態ディレクトリ（`~/.openclaw`）**: 設定、チャンネル/プロバイダー状態、認証プロファイル、セッション、ログ、
      共有 Skills（`~/.openclaw/skills`）。

    デフォルトのワークスペースは `~/.openclaw/workspace` で、次のように設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gateway が起動のたびに同じ
    ワークスペースを使用していることを確認してください（そして、リモートモードではローカルのノートパソコンではなく
    **gateway ホストの**ワークスペースが使われることを忘れないでください）。

    ヒント: 永続的な動作や設定を残したい場合は、チャット履歴に頼るのではなく、
    **AGENTS.md または MEMORY.md に書き込む**ようボットに依頼してください。

    [エージェントワークスペース](/ja-JP/concepts/agent-workspace) と [メモリ](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **エージェントワークスペース**を**プライベート**な git リポジトリに置き、どこか
    プライベートな場所（たとえば GitHub private）にバックアップします。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後でアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、セッション、トークン、暗号化されたシークレットペイロード）は**コミットしないでください**。
    完全復元が必要な場合は、ワークスペースと状態ディレクトリの両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [アンインストール](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="エージェントはワークスペース外で作業できますか？">
    はい。ワークスペースは**デフォルトの cwd**でありメモリアンカーですが、強制的なサンドボックスではありません。
    相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスでは他の
    ホスト上の場所にアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとのサンドボックス設定を使用してください。リポジトリを
    デフォルトの作業ディレクトリにしたい場合は、そのエージェントの
    `workspace` をリポジトリルートに向けます。OpenClaw リポジトリは単なるソースコードです。
    エージェントをその中で作業させたい場合を除き、ワークスペースは分けてください。

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
    セッション状態は**gateway ホスト**が所有します。リモートモードの場合、重要なセッションストアはローカルのノートパソコンではなくリモートマシン上にあります。[セッション管理](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定の形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH` から省略可能な **JSON5** 設定を読み込みます（デフォルト: `~/.openclaw/openclaw.json`）。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルが存在しない場合は、安全寄りのデフォルト（`~/.openclaw/workspace` のデフォルトワークスペースを含む）を使用します。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら、何も待ち受けない / UI が unauthorized と表示します'>
    非ループバックの bind には**有効な gateway 認証パスが必要**です。実際には次のいずれかを意味します。

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

    注意:

    - `gateway.remote.token` / `.password` は、それだけではローカル gateway 認証を有効にしません。
    - ローカル呼び出しパスでは、`gateway.auth.*` が未設定の場合のみ `gateway.remote.*` をフォールバックとして使用できます。
    - パスワード認証の場合は、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定します。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて解決できない場合、解決は fail closed になります（リモートフォールバックによる隠蔽なし）。
    - 共有シークレットの Control UI セットアップは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI 設定に保存）で認証します。Tailscale Serve や `trusted-proxy` のような ID を持つモードは、代わりにリクエストヘッダーを使用します。共有シークレットを URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一ホストのループバックリバースプロキシに明示的な `gateway.auth.trustedProxy.allowLoopback = true` と `gateway.trustedProxies` 内のループバックエントリが必要です。

  </Accordion>

  <Accordion title="なぜ localhost でもトークンが必要になったのですか？">
    OpenClaw はデフォルトで gateway 認証を強制します。これにはループバックも含まれます。通常のデフォルトパスでは、これはトークン認証を意味します。明示的な認証パスが設定されていない場合、gateway 起動時にトークンモードとして解決され、その起動用の実行時専用トークンが生成されるため、**ローカル WS クライアントは認証が必要**です。クライアントが再起動をまたいで安定したシークレットを必要とする場合は、`gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN`、または `OPENCLAW_GATEWAY_PASSWORD` を明示的に設定してください。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の認証パスを好む場合は、パスワードモード（または ID 対応リバースプロキシの場合は `trusted-proxy`）を明示的に選択できます。**本当に**オープンなループバックにしたい場合は、設定で `gateway.auth.mode: "none"` を明示的に設定してください。Doctor はいつでもトークンを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定を変更した後に再起動する必要がありますか？">
    Gateway は設定を監視し、ホットリロードをサポートしています。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動
    - `hot`、`restart`、`off` もサポートされています

  </Accordion>

  <Accordion title="おもしろい CLI タグラインを無効にするにはどうすればよいですか？">
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

    - `off`: タグラインテキストを非表示にしますが、バナーのタイトル/バージョン行は保持します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使用します。
    - `random`: おもしろい/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナー自体を表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

  </Accordion>

  <Accordion title="Web 検索（および Web 取得）を有効にするにはどうすればよいですか？">
    `web_fetch` は API キーなしで動作します。`web_search` は選択した
    プロバイダーに依存します。

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API バックエンドプロバイダーでは、通常の API キー設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama ホストを使用し、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホストです。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行し、プロバイダーを選択してください。
    環境変数による代替:

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
    従来の `tools.web.search.*` プロバイダーパスは互換性のため一時的にまだ読み込まれますが、新しい設定では使用しないでください。
    Firecrawl の Web 取得フォールバック設定は `plugins.entries.firecrawl.config.webFetch.*` の下にあります。

    注:

    - allowlist を使用する場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加します。
    - `web_fetch` はデフォルトで有効です（明示的に無効化されていない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClaw は利用可能な認証情報から、最初に準備済みの取得フォールバックプロバイダーを自動検出します。現在、同梱プロバイダーは Firecrawl です。
    - デーモンは env vars を `~/.openclaw/.env`（またはサービス環境）から読み取ります。

    ドキュメント: [Web ツール](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.apply が設定を消してしまいました。どう復旧し、回避できますか？">
    `config.apply` は **設定全体** を置き換えます。部分オブジェクトを送信すると、それ以外はすべて
    削除されます。

    現在の OpenClaw は、多くの偶発的な上書きから保護します。

    - OpenClaw が所有する設定書き込みは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的な OpenClaw 所有の書き込みは拒否され、`openclaw.json.rejected.*` として保存されます。
    - 直接編集によって起動またはホットリロードが壊れた場合、Gateway はフェイルクローズするかリロードをスキップします。`openclaw.json` は書き換えません。
    - 修復は `openclaw doctor --fix` が担当し、拒否されたファイルを `openclaw.json.clobbered.*` として保存しながら、直近の正常な設定を復元できます。

    復旧:

    - `openclaw logs --follow` で `Invalid config at`、`Config write rejected:`、または `config reload skipped (invalid config)` を確認します。
    - 有効な設定の横にある最新の `openclaw.json.clobbered.*` または `openclaw.json.rejected.*` を調べます。
    - `openclaw config validate` と `openclaw doctor --fix` を実行します。
    - 意図したキーだけを `openclaw config set` または `config.patch` で戻します。
    - 直近の正常な設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor` を再実行して channels/models を再設定します。
    - これが予期しない動作だった場合は、バグを報告し、最後に分かっている設定またはバックアップを添付してください。
    - ローカルの coding agent は、多くの場合、ログや履歴から動作する設定を再構築できます。

    回避:

    - 小さな変更には `openclaw config set` を使用します。
    - 対話的な編集には `openclaw configure` を使用します。
    - 正確なパスやフィールド形状が不明な場合は、まず `config.schema.lookup` を使用します。ドリルダウン用に、浅いスキーマノードと直下の子要素の要約を返します。
    - 部分的な RPC 編集には `config.patch` を使用します。`config.apply` は完全な設定置換専用にしてください。
    - agent 実行から owner-only の `gateway` ツールを使用している場合でも、`tools.exec.ask` / `tools.exec.security`（同じ保護された exec パスに正規化される従来の `tools.bash.*` エイリアスを含む）への書き込みは拒否されます。

    ドキュメント: [Config](/ja-JP/cli/config)、[Configure](/ja-JP/cli/configure)、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="複数デバイスにまたがる専門ワーカーを備えた中央 Gateway を実行するには？">
    一般的なパターンは、**1 つの Gateway**（例: Raspberry Pi）に **nodes** と **agents** を組み合わせる形です。

    - **Gateway（中央）:** channels（Signal/WhatsApp）、ルーティング、セッションを所有します。
    - **Nodes（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **Agents（ワーカー）:** 特別な役割（例:「Hetzner ops」、「Personal data」）向けの分離された頭脳/ワークスペースです。
    - **Sub-agents:** 並列化したいときに main agent からバックグラウンド作業を起動します。
    - **TUI:** Gateway に接続し、agents/sessions を切り替えます。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Remote access](/ja-JP/gateway/remote)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

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

    デフォルトは `false`（headful）です。Headless は、一部のサイトで anti-bot チェックをトリガーしやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    Headless は **同じ Chromium エンジン** を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

    - 表示されるブラウザーウィンドウがありません（視覚情報が必要な場合はスクリーンショットを使用します）。
    - 一部のサイトは headless モードでの自動化により厳格です（CAPTCHA、anti-bot）。
      たとえば、X/Twitter は headless セッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザー制御に Brave を使うには？">
    `browser.executablePath` を Brave バイナリ（または任意の Chromium ベースのブラウザー）に設定し、Gateway を再起動します。
    完全な設定例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と nodes

<AccordionGroup>
  <Accordion title="Telegram、Gateway、nodes の間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **Gateway** によって処理されます。Gateway は agent を実行し、
    node ツールが必要な場合にのみ **Gateway WebSocket** 経由で nodes を呼び出します。

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes は受信プロバイダートラフィックを見ません。node RPC 呼び出しだけを受信します。

  </Accordion>

  <Accordion title="Gateway がリモートにホストされている場合、agent はどうやって自分のコンピューターにアクセスできますか？">
    短い答え: **コンピューターを node としてペアリングします**。Gateway は別の場所で実行されますが、Gateway WebSocket 経由でローカルマシン上の `node.*` ツール（screen、camera、system）を呼び出せます。

    典型的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）で Gateway を実行します。
    2. Gateway ホストと自分のコンピューターを同じ tailnet に配置します。
    3. Gateway WS に到達可能であることを確認します（tailnet bind または SSH tunnel）。
    4. macOS アプリをローカルで開き、**Remote over SSH** モード（または直接 tailnet）で接続し、
       node として登録できるようにします。
    5. Gateway で node を承認します。

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP bridge は不要です。nodes は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS node をペアリングすると、そのマシンで `system.run` が可能になります。信頼できる
    デバイスだけをペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Gateway protocol](/ja-JP/gateway/protocol)、[macOS リモートモード](/ja-JP/platforms/mac/remote)、[Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale は接続されていますが返信がありません。次に何を確認しますか？">
    基本を確認します。

    - Gateway が実行中: `openclaw gateway status`
    - Gateway ヘルス: `openclaw status`
    - Channel ヘルス: `openclaw channels status`

    次に認証とルーティングを確認します。

    - Tailscale Serve を使用している場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
    - SSH tunnel 経由で接続している場合は、ローカルトンネルが起動しており、正しいポートを指していることを確認します。
    - allowlist（DM または group）に自分のアカウントが含まれていることを確認します。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[Remote access](/ja-JP/gateway/remote)、[Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2 つの OpenClaw インスタンス同士で通信できますか（ローカル + VPS）？">
    はい。組み込みの「bot-to-bot」bridge はありませんが、いくつかの
    信頼できる方法で接続できます。

    **最も簡単:** 両方の bot がアクセスできる通常の chat channel（Telegram/Slack/WhatsApp）を使用します。
    Bot A に Bot B へメッセージを送らせ、その後 Bot B が通常どおり返信するようにします。

    **CLI bridge（汎用）:** 他方の bot が待ち受けている chat を対象に、
    `openclaw agent --message ... --deliver` で他方の Gateway を呼び出すスクリプトを実行します。一方の bot がリモート VPS 上にある場合は、SSH/Tailscale 経由で CLI をそのリモート Gateway に向けます（[Remote access](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象 Gateway に到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2 つの bot が無限ループしないようにガードレールを追加します（mention-only、channel
    allowlist、または「bot メッセージには返信しない」ルール）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数の agents に別々の VPS が必要ですか？">
    いいえ。1 つの Gateway で複数の agents をホストでき、それぞれが独自のワークスペース、モデルデフォルト、
    ルーティングを持てます。これが通常のセットアップで、agent ごとに 1 つの VPS を実行するよりもずっと安価で簡単です。

    別々の VPS を使用するのは、強い分離（セキュリティ境界）が必要な場合、または共有したくない
    大きく異なる設定がある場合だけにしてください。それ以外は、1 つの Gateway を維持し、
    複数の agents または sub-agents を使用します。

  </Accordion>

  <Accordion title="VPS から SSH する代わりに、個人用ラップトップで node を使う利点はありますか？">
    はい。nodes はリモート Gateway からラップトップに到達するための第一級の方法であり、
    シェルアクセス以上の機能を解放します。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小さな VPS や Raspberry Pi クラスの箱で十分です。4 GB RAM で十分です）。そのため、一般的な
    セットアップは常時稼働ホストにラップトップを node として組み合わせる形です。

    - **受信 SSH は不要。** Nodes は Gateway WebSocket に発信接続し、デバイスペアリングを使用します。
    - **より安全な実行制御。** `system.run` はそのラップトップ上の node allowlist/承認によって制御されます。
    - **より多くのデバイスツール。** Nodes は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカルブラウザー自動化。** Gateway は VPS 上に置いたまま、ラップトップ上の node ホスト経由で Chrome をローカル実行するか、Chrome MCP 経由でホスト上のローカル Chrome に接続します。

    SSH は一時的なシェルアクセスには問題ありませんが、継続的な agent ワークフローと
    デバイス自動化には nodes の方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="Nodes は Gateway サービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）を除き、ホストごとに実行すべき **Gateway は 1 つだけ** です。Nodes は Gateway に接続する周辺機器です
    （iOS/Android nodes、または menubar app の macOS「node mode」）。Headless node
    ホストと CLI 制御については、[Node host CLI](/ja-JP/cli/node) を参照してください。

    `gateway`、`discovery`、およびホストされる Plugin surface の変更には、完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC 方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込み前に、1つの config サブツリーについて、その浅い schema ノード、対応する UI ヒント、直下の子要素サマリーを確認する
    - `config.get`: 現在のスナップショット + hash を取得する
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集で推奨）。可能な場合はホットリロードし、必要な場合は再起動する
    - `config.apply`: config 全体を検証して置き換える。可能な場合はホットリロードし、必要な場合は再起動する
    - owner 専用の `gateway` ランタイムツールは、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否する。従来の `tools.bash.*` エイリアスは同じ保護対象の exec パスに正規化される

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これにより workspace が設定され、bot をトリガーできる相手が制限される。

  </Accordion>

  <Accordion title="VPS で Tailscale を設定し、自分の Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストールしてログインする**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログインする**
       - Tailscale アプリを使い、同じ tailnet にサインインする。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を持たせる。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS で Tailscale Serve を使う:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback にバインドされたまま、Tailscale 経由で HTTPS が公開される。詳しくは [Tailscale](/ja-JP/gateway/tailscale) を参照。

  </Accordion>

  <Accordion title="Mac ノードをリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開する。ノードは同じ Gateway WS エンドポイント経由で接続する。

    推奨設定:

    1. **VPS + Mac が同じ tailnet 上にあることを確認する**。
    2. **macOS アプリを Remote モードで使う**（SSH ターゲットには tailnet ホスト名を使える）。
       アプリは Gateway ポートをトンネルし、ノードとして接続する。
    3. gateway で**ノードを承認する**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway プロトコル](/ja-JP/gateway/protocol)、[検出](/ja-JP/gateway/discovery)、[macOS remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目の laptop にインストールすべきですか、それとも node を追加するだけでよいですか？">
    2台目の laptop で **local tools**（screen/camera/exec）だけが必要なら、
    **node** として追加する。それにより Gateway は1つのままになり、config の重複を避けられる。ローカル node ツールは
    現時点では macOS のみ対応だが、他の OS にも拡張する予定。

    2つ目の Gateway をインストールするのは、**強い分離**や完全に別個の bot が2つ必要な場合だけにする。

    ドキュメント: [ノード](/ja-JP/nodes)、[ノード CLI](/ja-JP/cli/nodes)、[複数の gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から env vars を読み取り、さらに次を読み込む:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）からのグローバル fallback `.env`

    どちらの `.env` ファイルも既存の env vars を上書きしない。

    config で inline env vars を定義することもできる（process env に存在しない場合にのみ適用される）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位と source については [/environment](/ja-JP/help/environment) を参照。

  </Accordion>

  <Accordion title="service 経由で Gateway を起動したら env vars が消えました。どうすればよいですか？">
    よくある修正は2つ:

    1. 不足している key を `~/.openclaw/.env` に入れる。これにより service が shell env を継承しない場合でも取得される。
    2. shell import を有効にする（任意の利便機能）:

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

    これは login shell を実行し、不足している想定 key だけを import する（決して上書きしない）。対応する env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定しましたが、models status に「Shell env: off.」と表示されます。なぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告する。「Shell env: off」
    は env vars が不足しているという意味では**ない**。OpenClaw が
    login shell を自動的には読み込まないという意味にすぎない。

    Gateway が service（launchd/systemd）として動作している場合、shell
    environment は継承されない。次のいずれかで修正する:

    1. token を `~/.openclaw/.env` に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効にする。
    3. または config の `env` block に追加する（存在しない場合にのみ適用）。

    その後 gateway を再起動して再確認する:

    ```bash
    openclaw models status
    ```

    Copilot token は `COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN` も）から読み込まれる。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を開始するにはどうすればよいですか？">
    スタンドアロンのメッセージとして `/new` または `/reset` を送信する。詳しくは [セッション管理](/ja-JP/concepts/session) を参照。
  </Accordion>

  <Accordion title="/new を送信しない場合、セッションは自動的にリセットされますか？">
    セッションは `session.idleMinutes` の後に期限切れにできるが、これは**デフォルトでは無効**（default **0**）。
    idle expiry を有効にするには正の値を設定する。有効な場合、idle 期間後の**次の**
    message によって、その chat key の新しい session id が開始される。
    これは transcript を削除せず、新しい session を開始するだけ。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスの team（1人の CEO と多数の agents）を作る方法はありますか？">
    ある。**multi-agent routing** と **sub-agents** を使う。1つの coordinator
    agent と、それぞれ独自の workspace と model を持つ複数の worker agents を作成できる。

    ただし、これは**楽しい実験**として捉えるのがよい。token 消費が大きく、多くの場合、
    separate sessions を持つ1つの bot を使うより効率が落ちる。私たちが想定する典型的な model は、
    話しかける bot が1つあり、並行作業には different sessions を使う形。その
    bot は必要に応じて sub-agents を spawn することもできる。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[Agents CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="作業途中で context が切り詰められたのはなぜですか？防ぐにはどうすればよいですか？">
    session context は model window によって制限される。長い chat、大きな tool output、または多数の
    files により、compaction や truncation が発生することがある。

    役立つこと:

    - 現在の状態を要約して file に書き込むよう bot に依頼する。
    - 長い作業の前に `/compact` を使い、topic を切り替えるときは `/new` を使う。
    - 重要な context は workspace に置き、読み返すよう bot に依頼する。
    - 長い作業や並行作業には sub-agents を使い、main chat を小さく保つ。
    - これが頻繁に起こる場合は、より大きな context window を持つ model を選ぶ。

  </Accordion>

  <Accordion title="OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか？">
    reset コマンドを使う:

    ```bash
    openclaw reset
    ```

    非対話型の full reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、setup を再実行する:

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - 既存 config が見つかった場合、オンボーディングでも **Reset** が提示される。[オンボーディング（CLI）](/ja-JP/start/wizard) を参照。
    - profiles（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir を reset する（デフォルトは `~/.openclaw-<profile>`）。
    - dev reset: `openclaw gateway --dev --reset`（dev 専用。dev config + credentials + sessions + workspace を消去する）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。reset または compact するにはどうすればよいですか？'>
    次のいずれかを使う:

    - **Compact**（会話は保持し、古い turn を要約する）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約を誘導する。

    - **Reset**（同じ chat key の fresh session ID）:

      ```
      /new
      /reset
      ```

    続けて発生する場合:

    - 古い tool output を trim するために **session pruning**（`agents.defaults.contextPruning`）を有効化または調整する。
    - より大きな context window を持つ model を使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[Session pruning](/ja-JP/concepts/session-pruning)、[セッション管理](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」が表示されるのはなぜですか？'>
    これは provider validation error で、model が必須の
    `input` なしで `tool_use` block を生成したことを示す。通常、session history が古いか壊れていることを意味する（長い thread
    や tool/schema の変更後によく起こる）。

    修正: `/new`（スタンドアロンメッセージ）で fresh session を開始する。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30m** ごと（OAuth auth 使用時は **1h**）に実行される。調整または無効化するには:

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

    `HEARTBEAT.md` が存在するものの実質的に空（空行と `# Heading` のような markdown
    header のみ）の場合、OpenClaw は API call を節約するため heartbeat run をスキップする。
    file がない場合でも heartbeat は実行され、model が何をするかを決定する。

    agent ごとの override には `agents.list[].heartbeat` を使う。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp group に「bot account」を追加する必要はありますか？'>
    いいえ。OpenClaw は**自分の account**で動作するため、自分が group に入っていれば OpenClaw もそれを見られる。
    デフォルトでは、sender を許可するまで group reply はブロックされる（`groupPolicy: "allowlist"`）。

    **自分だけ**が group reply をトリガーできるようにしたい場合:

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
    Option 1（最速）: log を tail し、group に test message を送信する:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探す。例:
    `1234567890-1234567890@g.us`。

    Option 2（すでに configured/allowlisted の場合）: config から group を一覧表示する:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[Logs](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="OpenClaw が group で返信しないのはなぜですか？">
    よくある原因は2つ:

    - Mention gating が有効（default）。bot を @mention する（または `mentionPatterns` に一致させる）必要がある。
    - `channels.whatsapp.groups` を `"*"` なしで設定しており、その group が allowlisted されていない。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照。

  </Accordion>

  <Accordion title="groups/threads は DM と context を共有しますか？">
    direct chat はデフォルトで main session にまとめられる。groups/channels はそれぞれ独自の session key を持ち、Telegram topics / Discord threads は separate sessions になる。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照。
  </Accordion>

  <Accordion title="作成できるワークスペースとエージェントの数は？">
    厳密な制限はありません。数十個、場合によっては数百個でも問題ありませんが、次に注意してください。

    - **ディスク増加:** セッションとトランスクリプトは `~/.openclaw/agents/<agentId>/sessions/` に保存されます。
    - **トークンコスト:** エージェントが増えるほど、同時モデル使用量も増えます。
    - **運用負荷:** エージェントごとの認証プロファイル、ワークスペース、チャネルルーティング。

    ヒント:

    - エージェントごとに **アクティブな** ワークスペースを1つ維持します（`agents.defaults.workspace`）。
    - ディスク使用量が増えたら、古いセッションを削除します（JSONL またはストアエントリを削除）。
    - 迷子のワークスペースやプロファイル不一致を見つけるには `openclaw doctor` を使います。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）。また、どのように設定すべきですか？">
    はい。**マルチエージェントルーティング**を使うと、複数の分離されたエージェントを実行し、受信メッセージを
    チャネル/アカウント/ピアごとにルーティングできます。Slack はチャネルとしてサポートされており、特定のエージェントにバインドできます。

    ブラウザアクセスは強力ですが、「人間にできることを何でもできる」わけではありません。ボット対策、CAPTCHA、MFA によって
    自動化がブロックされることがあります。最も信頼性の高いブラウザ制御には、ホスト上のローカル Chrome MCP を使うか、
    実際にブラウザを実行しているマシンで CDP を使います。

    ベストプラクティスの設定:

    - 常時稼働の Gateway ホスト（VPS/Mac mini）。
    - ロールごとに1つのエージェント（バインディング）。
    - それらのエージェントにバインドされた Slack チャネル。
    - 必要に応じて Chrome MCP またはノード経由のローカルブラウザ。

    ドキュメント: [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、
    [ブラウザ](/ja-JP/tools/browser)、[ノード](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルの Q&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は [モデル FAQ](/ja-JP/help/faq-models) にあります。

## Gateway: ポート、「すでに実行中」、リモートモード

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` は WebSocket + HTTP（Control UI、フックなど）用の単一多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status が「Runtime: running」なのに「Connectivity probe: failed」と表示するのはなぜですか？'>
    「running」は**スーパーバイザー**側の見方（launchd/systemd/schtasks）だからです。接続プローブは、CLI が実際に Gateway WebSocket へ接続する確認です。

    `openclaw gateway status` を使い、次の行を信頼してください。

    - `Probe target:`（プローブが実際に使った URL）
    - `Listening:`（ポートに実際にバインドされているもの）
    - `Last gateway error:`（プロセスは生きているがポートがリッスンしていない場合の一般的な根本原因）

  </Accordion>

  <Accordion title='openclaw gateway status で「Config (cli)」と「Config (service)」が違って表示されるのはなぜですか？'>
    サービスが別の設定ファイルで実行されているのに、別の設定ファイルを編集しています（多くの場合、`--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたい同じ `--profile` / 環境からそれを実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClaw は起動直後に WebSocket リスナーをバインドすることでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。バインドが `EADDRINUSE` で失敗すると、別のインスタンスがすでにリッスンしていることを示す `GatewayLockError` をスローします。

    修正: もう一方のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行します。

  </Accordion>

  <Accordion title="OpenClaw をリモートモード（クライアントが別の場所の Gateway に接続）で実行するには？">
    `gateway.mode: "remote"` を設定し、必要に応じて共有シークレットのリモート認証情報とともにリモート WebSocket URL を指定します。

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
    - `gateway.remote.token` / `.password` はクライアント側のリモート認証情報のみです。それだけではローカル Gateway 認証は有効になりません。

  </Accordion>

  <Accordion title='Control UI が「unauthorized」と表示します（または再接続を繰り返します）。どうすればよいですか？'>
    Gateway の認証パスと UI の認証方式が一致していません。

    事実（コードより）:

    - Control UI は現在のブラウザタブセッションと選択された Gateway URL について、トークンを `sessionStorage` に保持します。そのため、同じタブでの更新は、長期的な localStorage トークン永続化を復元しなくても動作し続けます。
    - `AUTH_TOKEN_MISMATCH` では、Gateway が再試行ヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュされたデバイストークンで1回だけ境界付き再試行を試みられます。
    - そのキャッシュトークン再試行では、デバイストークンとともに保存されたキャッシュ済み承認スコープを再利用するようになりました。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、キャッシュされたスコープを継承せず、要求したスコープセットを維持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - ブートストラップトークンのスコープチェックはロール接頭辞付きです。組み込みのブートストラップオペレーター許可リストはオペレーター要求だけを満たします。ノードやその他の非オペレーターロールには、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    修正:

    - 最速: `openclaw dashboard`（ダッシュボード URL を出力してコピーし、開こうとします。ヘッドレスの場合は SSH ヒントを表示します）。
    - まだトークンがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、一致するシークレットを Control UI 設定に貼り付けます。
    - Tailscale Serve モード: `gateway.auth.allowTailscale` が有効であり、Tailscale ID ヘッダーをバイパスする生の loopback/tailnet URL ではなく Serve URL を開いていることを確認してください。
    - 信頼済みプロキシモード: 生の Gateway URL ではなく、設定済みの ID 対応プロキシ経由でアクセスしていることを確認してください。同一ホストの loopback プロキシでも `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
    - 1回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認してください。
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのローテーション呼び出しが拒否されたと表示する場合は、次の2点を確認してください。
      - ペアリング済みデバイスセッションは、`operator.admin` も持っていない限り、**自分自身の**デバイスだけをローテーションできます
      - 明示的な `--scope` 値は、呼び出し元の現在のオペレータースコープを超えられません
    - まだ詰まっていますか？`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。認証の詳細は [ダッシュボード](/ja-JP/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定しましたが、バインドできず何もリッスンしません">
    `tailnet` バインドは、ネットワークインターフェイスから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale 上にない場合（またはインターフェイスがダウンしている場合）、バインド先がありません。

    修正:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用バインドが必要な場合は `gateway.bind: "tailnet"` を使います。

  </Accordion>

  <Accordion title="同じホストで複数の Gateway を実行できますか？">
    通常はできません。1つの Gateway で複数のメッセージングチャネルとエージェントを実行できます。複数の Gateway は、冗長性（例: レスキューボット）または強い分離が必要な場合にのみ使います。

    可能ですが、分離する必要があります。

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（ワークスペース分離）
    - `gateway.port`（一意のポート）

    クイック設定（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使います（`~/.openclaw-<name>` を自動作成します）。
    - 各プロファイル設定で一意の `gateway.port` を設定します（または手動実行時に `--port` を渡します）。
    - プロファイルごとのサービスをインストールします: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にもサフィックスを付けます（`ai.openclaw.<profile>`、レガシーの `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [複数の Gateway](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ コード 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket サーバー**であり、最初のメッセージとして
    `connect` フレームを期待します。それ以外を受け取ると、**コード 1008**（ポリシー違反）で
    接続を閉じます。

    一般的な原因:

    - WS クライアントではなく、ブラウザで **HTTP** URL（`http://...`）を開いた。
    - 間違ったポートまたはパスを使った。
    - プロキシまたはトンネルが認証ヘッダーを除去した、または Gateway ではないリクエストを送信した。

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

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    サービス/スーパーバイザーのログ（Gateway が launchd/systemd 経由で実行されている場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。プロファイルは `~/.openclaw-<profile>/logs/...` を使います）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway サービスを開始/停止/再起動するには？">
    Gateway ヘルパーを使います。

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway を手動で実行している場合、`openclaw gateway --force` でポートを取り戻せます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じました。OpenClaw を再起動するには？">
    **2つの Windows インストールモード**があります。

    **1) WSL2（推奨）:** Gateway は Linux 内で実行されます。

    PowerShell を開き、WSL に入ってから再起動します。

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    サービスを一度もインストールしていない場合は、フォアグラウンドで起動します。

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

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows)、[Gateway サービス運用手順](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は起動していますが、返信がまったく届きません。何を確認すべきですか？">
    まず簡単な健全性チェックから始めます。

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    一般的な原因:

    - **Gateway ホスト**でモデル認証が読み込まれていない（`models status` を確認）。
    - チャンネルのペアリング/許可リストが返信をブロックしている（チャンネル設定とログを確認）。
    - WebChat/ダッシュボードが正しいトークンなしで開かれている。

    リモートの場合は、トンネル/Tailscale 接続が有効で、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [チャンネル](/ja-JP/channels)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)、[リモートアクセス](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Gateway から切断されました: 理由なし" - 次に何をすべきですか?'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。以下を確認してください。

    1. Gateway は実行中ですか? `openclaw gateway status`
    2. Gateway は正常ですか? `openclaw status`
    3. UI には正しいトークンがありますか? `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscale リンクは有効ですか?

    次にログを追跡します。

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [ダッシュボード](/ja-JP/web/dashboard)、[リモートアクセス](/ja-JP/gateway/remote)、[トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands が失敗します。何を確認すべきですか?">
    ログとチャンネルステータスから始めます。

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    次にエラーを照合します。

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目が多すぎます。OpenClaw はすでに Telegram の上限に合わせて切り詰め、コマンド数を減らして再試行しますが、それでも一部のメニュー項目を削除する必要があります。Plugin/スキル/カスタムコマンドを減らすか、メニューが不要な場合は `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上またはプロキシの背後にいる場合は、外向き HTTPS が許可されており、`api.telegram.org` の DNS が機能することを確認してください。

    Gateway がリモートの場合は、Gateway ホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか?">
    まず Gateway に到達でき、エージェントを実行できることを確認します。

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    チャンネルで返信を期待している場合は、配信が有効であることを確認してください（`/deliver on`）。

    ドキュメント: [TUI](/ja-JP/web/tui)、[スラッシュコマンド](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか?">
    サービスをインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは **監視対象サービス**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway がデーモンとしてバックグラウンドで実行されている場合に使用します。

    フォアグラウンドで実行している場合は Ctrl-C で停止してから、次を実行します。

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway サービス Runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="5歳児向け説明: openclaw gateway restart と openclaw gateway">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションで gateway を**フォアグラウンド**実行します。

    サービスをインストールしている場合は gateway コマンドを使用します。単発の
    フォアグラウンド実行をしたい場合は `openclaw gateway` を使用します。

  </Accordion>

  <Accordion title="何かが失敗したときに詳細を得る最速の方法">
    `--verbose` 付きで Gateway を起動すると、コンソールの詳細が増えます。次にログファイルでチャンネル認証、モデルルーティング、RPC エラーを確認します。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="Skill が画像/PDF を生成しましたが、何も送信されませんでした">
    エージェントからの送信添付ファイルには、（独立した行として）`MEDIA:<path-or-url>` 行を含める必要があります。[OpenClaw アシスタント設定](/ja-JP/start/openclaw) と [エージェント送信](/ja-JP/tools/agent-send) を参照してください。

    CLI 送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    併せて確認してください。

    - 対象チャンネルが送信メディアをサポートしており、許可リストでブロックされていない。
    - ファイルがプロバイダーのサイズ上限内にある（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` は、ローカルパス送信をワークスペース、temp/media-store、サンドボックス検証済みファイルに限定します。
    - `tools.fs.workspaceOnly=false` は、エージェントがすでに読めるホストローカルファイルを `MEDIA:` で送信できるようにしますが、メディアと安全なドキュメントタイプ（画像、音声、動画、PDF、Office ドキュメント）のみに限定されます。プレーンテキストやシークレットらしいファイルは引き続きブロックされます。

    [画像](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか?">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスクを減らすように設計されています。

    - DM 対応チャンネルでのデフォルト動作は**ペアリング**です。
      - 未知の送信者はペアリングコードを受け取ります。ボットはそのメッセージを処理しません。
      - 承認するには: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中のリクエストは**チャンネルごとに 3 件**に制限されます。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公開するには明示的なオプトイン（`dmPolicy: "open"` と許可リスト `"*"`）が必要です。

    リスクの高い DM ポリシーを表面化するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの問題ですか?">
    いいえ。プロンプトインジェクションは、誰がボットに DM できるかだけでなく、**信頼できないコンテンツ**に関する問題です。
    アシスタントが外部コンテンツ（Web 検索/取得、ブラウザページ、メール、
    ドキュメント、添付ファイル、貼り付けられたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれる可能性があります。これは**送信者が自分だけ**であっても起こり得ます。

    最大のリスクはツールが有効な場合です。モデルがだまされて、コンテキストを
    流出させたり、あなたの代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の「reader」エージェントを使う
    - ツール有効エージェントでは `web_search` / `web_fetch` / `browser` をオフに保つ
    - デコードされたファイル/ドキュメントのテキストも信頼できないものとして扱う: OpenResponses の
      `input_file` とメディア添付ファイル抽出はどちらも、生ファイルテキストを渡す代わりに、
      抽出テキストを明示的な外部コンテンツ境界マーカーで囲みます
    - サンドボックス化と厳格なツール許可リストを使う

    詳細: [セキュリティ](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボット専用のメール、GitHub アカウント、電話番号を用意すべきですか?">
    ほとんどのセットアップでは、はい。別のアカウントや電話番号でボットを分離すると、
    何か問題が起きた場合の影響範囲を減らせます。また、個人アカウントに影響を与えずに
    認証情報をローテーションしたりアクセスを取り消したりしやすくなります。

    小さく始めてください。実際に必要なツールとアカウントにだけアクセスを付与し、
    必要になったら後で広げます。

    ドキュメント: [セキュリティ](/ja-JP/gateway/security)、[ペアリング](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="テキストメッセージに対する自律性を与えられますか? それは安全ですか?">
    個人メッセージに対する完全な自律性は推奨**しません**。最も安全なパターンは次のとおりです。

    - DM は**ペアリングモード**または厳格な許可リストに保つ。
    - 代理でメッセージを送らせたい場合は、**別の番号またはアカウント**を使う。
    - 下書きを作らせてから、**送信前に承認**する。

    試す場合は専用アカウントで行い、分離したままにしてください。
    [セキュリティ](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人アシスタントタスクに安価なモデルを使えますか?">
    はい、エージェントがチャットのみで、入力が信頼できる**場合**は可能です。小さい階層は
    指示の乗っ取りを受けやすいため、ツール有効エージェントや
    信頼できないコンテンツを読む場合には避けてください。小さいモデルを使う必要がある場合は、
    ツールをロックダウンし、サンドボックス内で実行してください。[セキュリティ](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行しましたが、ペアリングコードを受け取りませんでした">
    ペアリングコードは、未知の送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中のリクエストを確認します。

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、送信者 ID を許可リストに追加するか、そのアカウントで
    `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先にメッセージしますか? ペアリングはどのように機能しますか?">
    いいえ。WhatsApp のデフォルト DM ポリシーは**ペアリング**です。未知の送信者はペアリングコードだけを受け取り、そのメッセージは**処理されません**。OpenClaw は、受信したチャット、またはあなたが明示的にトリガーした送信にのみ返信します。

    ペアリングを承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中のリクエストを一覧表示します。

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは、あなた自身の DM が許可されるように**許可リスト/所有者**を設定するために使われます。自動送信には使われません。個人の WhatsApp 番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

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

    それでも騒がしい場合は、Control UI のセッション設定を確認し、verbose を
    **inherit** に設定してください。また、設定で `verboseDefault` が `on` に設定されたボットプロファイルを使用していないことも確認してください。

    ドキュメント: [思考と verbose](/ja-JP/tools/thinking)、[セキュリティ](/ja-JP/gateway/security/index#reasoning-and-verbose-output-in-groups)。

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

    バックグラウンドプロセス（exec ツールからのもの）の場合は、エージェントに次を実行するよう依頼できます。

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる**単独**メッセージとして送信する必要がありますが、`/status` など一部のショートカットは許可リスト済み送信者であればインラインでも機能します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送信するにはどうすればよいですか?（「クロスコンテキストメッセージングが拒否されました」）'>
    OpenClaw はデフォルトで**クロスプロバイダー**メッセージングをブロックします。ツール呼び出しが
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信しません。

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

    設定を編集した後、gateway を再起動してください。

  </Accordion>

  <Accordion title='ボットが連続メッセージを「無視」しているように感じるのはなぜですか?'>
    キューモードは、新しいメッセージが実行中の run とどう相互作用するかを制御します。モードを変更するには `/queue` を使用します。

    - `steer` - 現在の run の次のモデル境界に向けて、保留中のステアリングをすべてキューに入れる
    - `queue` - 従来の一度に 1 つずつのステアリング
    - `followup` - メッセージを一度に 1 つずつ実行する
    - `collect` - メッセージをまとめて 1 回だけ返信する
    - `steer-backlog` - 今すぐステアリングしてから、バックログを処理する
    - `interrupt` - 現在の run を中止して、新しく開始する

    デフォルトモードは `steer` です。フォローアップモードには `debounce:0.5s cap:25 drop:summarize` のようなオプションを追加できます。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='API キーを使用する Anthropic のデフォルトモデルは何ですか?'>
    OpenClaw では、認証情報とモデル選択は別々です。`ANTHROPIC_API_KEY` を設定するか、認証プロファイルに Anthropic API キーを保存すると認証が有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` で設定したものです。たとえば、`anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6` です。`No credentials found for profile "anthropic:default"` が表示される場合は、実行中のエージェントに対応する想定された `auth-profiles.json` で、Gateway が Anthropic 認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか? [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub ディスカッション](https://github.com/openclaw/openclaw/discussions) を開いてください。

## 関連

- [初回実行 FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期の失敗
- [モデル FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状優先のトリアージ
