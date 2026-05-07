---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルの概要と管理方法
sidebarTitle: Models FAQ
summary: 'よくある質問: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-05-07T13:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルに関する Q&A。セットアップ、セッション、Gateway、チャンネル、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次として設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `anthropic/claude-sonnet-4-6`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後でのみ、非推奨の互換パスとして設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルにフォールバックします。それでも `provider/model` は**明示的に**設定してください。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** 使用しているプロバイダースタックで利用可能な最も強力な最新世代モデルを使用してください。
    **ツールを有効にしたエージェント、または信頼できない入力を扱うエージェント:** コストよりもモデルの強さを優先してください。
    **通常の低リスクなチャット:** より安価なフォールバックモデルを使い、エージェントの役割でルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクな作業には**支払える範囲で最良のモデル**を使い、通常のチャットや要約にはより安価なモデルを使ってください。エージェントごとにモデルをルーティングし、サブエージェントを使って長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプトインジェクションや安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細な背景: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **model commands** を使うか、**model** フィールドだけを編集してください。設定全体の置換は避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早く、セッションごと）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードには、正規化されたパス、浅いスキーマのドキュメント/制約、直下の子要素の概要が含まれます。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストール
    2. `ollama pull gemma4` などのローカルモデルを取得
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行
    4. `openclaw onboard` を実行して `Ollama` を選択
    5. `Local` または `Cloud + Local` を選択

    注記:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルを使えます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカル取得を必要としません
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ注記: 小さいモデルや大幅に量子化されたモデルは、プロンプトインジェクションに対してより脆弱です。ツールを使えるボットには**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定のプロバイダー推奨はありません。
    - 各 gateway で現在のランタイム設定を `openclaw models status` で確認してください。
    - セキュリティに敏感なエージェントやツールを有効にしたエージェントには、利用可能な最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか？">
    `/model` コマンドを単独メッセージとして使います。

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みエイリアスです。カスタムエイリアスは `agents.defaults.models` で追加できます。

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧表示できます。

    `/model`（および `/model list`）は、コンパクトな番号付き選択UIを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の認証プロファイルを強制することもできます（セッションごと）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次に試行される認証プロファイルがどれかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するにはどうすればよいですか？**

    `@profile` サフィックス**なし**で `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか（または `/model <default provider/model>` を送信）してください。
    どの認証プロファイルがアクティブかを確認するには `/model status` を使ってください。

  </Accordion>

  <Accordion title="日常タスクに GPT 5.5、コーディングに Codex 5.5 を使えますか？">
    はい。モデル選択とランタイム選択は別々に扱ってください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインします。
    - **エージェントループ外の直接 OpenAI API タスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェント OpenAI API サーフェスには `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェント API キー認証:** 順序付きの `openai-codex` API キープロファイルで `/model openai/gpt-5.5` を使います。
    - **サブエージェント:** コーディングタスクを、独自のモデルと `agentRuntime` デフォルトを持つ Codex 専用エージェントにルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の fast mode を設定するにはどうすればよいですか？">
    セッショントグルまたは設定デフォルトのいずれかを使います。

    - **セッションごと:** セッションが `openai/gpt-5.5` を使っている間に `/fast on` を送信します。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` を `true` に設定します。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI では、fast mode はサポートされているネイティブ Responses リクエストの `service_tier = "priority"` にマッピングされます。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [Thinking と fast mode](/ja-JP/tools/thinking) および [OpenAI fast mode](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆるセッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: そのモデルを `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選んでください。
    コマンドに `--runtime codex` も含まれていた場合は、まずモデルを追加してから、同じ `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは、**プロバイダーが設定されていない**（MiniMax プロバイダー設定または認証プロファイルが見つからない）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現行の OpenClaw リリースにアップグレードする（またはソースの `main` から実行する）してから、gateway を再起動します。
    2. MiniMax が設定されている（ウィザードまたは JSON）こと、または一致するプロバイダーを注入できるように env/認証プロファイルに MiniMax 認証が存在することを確認します（`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax OAuth）。
    3. 認証パスに対して正確なモデル ID（大文字小文字を区別）を使います:
       API キー設定では `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth 設定では `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そして一覧から選択します（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**として使い、必要に応じて**セッションごと**にモデルを切り替えてください。
    フォールバックは**エラー**用であり、「難しいタスク」用ではありません。そのため `/model` または別のエージェントを使ってください。

    **オプション A: セッションごとに切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    次に:

    ```
    /model gpt
    ```

    **オプション B: 別々のエージェント**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` を使って切り替え

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が同梱されています（モデルが `agents.defaults.models` に存在する場合のみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするにはどうすればよいですか？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から来ます。例:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    その後、`/model sonnet`（またはサポートされている場合は `/<alias>`）はそのモデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークン従量課金、多数のモデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM モデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    プロバイダー/モデルを参照していても必要なプロバイダーキーがない場合、実行時の認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加したあとにプロバイダーのAPIキーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、次の場所に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuthプロファイルでは、そのエージェントに専用アカウントが必要な場合は新しいエージェントからサインインします。それ以外の場合、OpenClaw は更新トークンを複製せずにデフォルト/メインエージェントを読み取れます。

    エージェント間で `agentDir` を再利用しないでください。認証/セッションの衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは2段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を継続できます。

    レート制限バケットには、単純な `429` レスポンス以外も含まれます。OpenClaw は
    `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用期間の上限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバーに値する
    レート制限として扱います。

    課金に見えるレスポンスの一部は `402` ではなく、HTTP `402`
    レスポンスの一部もその一時的なバケットに残ります。プロバイダーが `401` または `403` で
    明示的な課金テキストを返す場合でも、OpenClaw はそれを課金レーンに保持できますが、
    プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲に留まります
    （例: OpenRouter `Key limit exceeded`）。一方で `402`
    メッセージが、再試行可能な使用期間、または
    組織/ワークスペースの支出上限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期の課金無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは異なります。
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` などのシグネチャは、モデルフォールバックへ進む代わりに
    Compaction/再試行パスに残ります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものすべて」よりも意図的に狭くなっています。OpenClaw は、Anthropic の裸の `An unknown error occurred`、OpenRouter の裸の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキスト
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）を含む JSON `api_error` ペイロード、`ModelNotReadyException` のような
    プロバイダー混雑エラーなど、プロバイダー範囲の一時的な形状を、プロバイダーのコンテキストが
    一致する場合にフェイルオーバーに値するタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ単独ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」は何を意味しますか？'>
    これは、システムが認証プロファイルID `anthropic:default` を使用しようとしたが、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルがどこにあるか確認する**（新しいパスとレガシーパス）
      - 現行: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` によって移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合は継承されないことがあります。`~/.openclaw/.env` に置くか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する場合があります。
    - **モデル/認証ステータスを健全性確認する**
      - `openclaw models status` を使用して、設定済みモデルとプロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているが、Gateway が
    その認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLIを使用する**
      - Gatewayホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりにAPIキーを使用したい場合**
      - **Gatewayホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 存在しないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gatewayホストでコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノートPCではなくGatewayマシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の省略形に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google 認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアス内の Google モデルを削除または回避して、フォールバックがそこへルーティングされないようにします。

    **LLMリクエストが拒否されました: thinking signature が必要です（Google Antigravity）**

    原因: セッション履歴に**署名のないthinkingブロック**が含まれています（多くの場合、
    中断された/部分的なストリームが原因です）。Google Antigravity はthinkingブロックに署名を要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名のないthinkingブロックを除去します。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントに `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuthフロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルとは、プロバイダーに紐づく名前付きの認証情報レコード（OAuthまたはAPIキー）です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list`（任意で `--provider <id>` または `--json`）を実行します。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイルIDは何ですか？">
    OpenClaw は次のようなプロバイダープレフィックス付きIDを使用します。

    - `anthropic:default`（メールIDが存在しない場合によく使われます）
    - OAuth ID用の `anthropic:<email>`
    - 自分で選ぶカスタムID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試す認証プロファイルを制御できますか？">
    はい。設定では、プロファイルの任意メタデータとプロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。IDをプロバイダー/モードに対応付け、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）またはより長い**無効**状態（課金/クレジット不足）にある場合、一時的にそのプロファイルをスキップすることがあります。これを確認するには、`openclaw models status --json` を実行して `auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限クールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、
    同じプロバイダー上の兄弟モデルでは引き続き使用可能な場合があります。
    一方、課金/無効ウィンドウは引き続きプロファイル全体をブロックします。

    CLIを使って、**エージェントごと**の順序上書き（そのエージェントの `auth-state.json` に保存）も設定できます。

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるかを確認するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe は
    そのプロファイルを黙って試す代わりに `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth とAPIキーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth** は多くの場合、サブスクリプションアクセスを活用します（該当する場合）。
    - **APIキー** はトークン従量課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、APIキーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メインFAQ
- [FAQ — クイックスタートと初回セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
