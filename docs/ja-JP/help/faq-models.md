---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバーのデバッグ / 「すべてのモデルが失敗しました」
    - 認証プロファイルの理解と管理方法
sidebarTitle: Models FAQ
summary: 'よくある質問: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-05-05T01:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  Model と auth-profile の Q&A。セットアップ、セッション、Gateway、チャンネル、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「default model」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次の値として設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `openai-codex/gpt-5.5`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後でのみ、非推奨の互換パスとして設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。それでも `provider/model` は**明示的に**設定してください。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** 利用しているプロバイダースタックで使える最も強力な最新世代モデルを使用してください。
    **ツール対応または信頼できない入力を扱うエージェント:** コストよりモデルの強さを優先してください。
    **日常的/低リスクのチャット:** 安価なフォールバックモデルを使い、エージェントの役割でルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**予算内で使える最良のモデル**を使用し、日常的なチャットや要約には安価な
    モデルを使用してください。エージェントごとにモデルをルーティングでき、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    さらに詳しく: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには？">
    **モデルコマンド**を使うか、**model** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早く、セッションごと）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で調べ、`config.patch` を優先してください。lookup ペイロードは、正規化されたパス、浅いスキーマドキュメント/制約、直接の子要素の概要を提供します。
    部分更新に使用します。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルには Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールします
    2. `ollama pull gemma4` などのローカルモデルを取得します
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行します
    4. `openclaw onboard` を実行し、`Ollama` を選択します
    5. `Local` または `Cloud + Local` を選びます

    メモ:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルを利用できます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカル取得を必要としません
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使用します

    セキュリティメモ: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには、**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変更されることがあります。固定のプロバイダー推奨はありません。
    - 各 Gateway で `openclaw models status` を使い、現在のランタイム設定を確認してください。
    - セキュリティ上重要なエージェントやツール対応エージェントには、利用可能な最も強力な最新世代モデルを使用してください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには？">
    `/model` コマンドを単独のメッセージとして使用します。

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

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の auth profile を強制することもできます（セッションごと）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの auth profile が試されるかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するには？**

    `@profile` サフィックス**なしで** `/model` を再実行します。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか（または `/model <default provider/model>` を送信します）。
    どの auth profile がアクティブか確認するには、`/model status` を使用してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか？">
    はい。モデルの選択とランタイムの選択は分けて考えてください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に、`agents.defaults.agentRuntime.id` を `"codex"` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインします。
    - **PI 経由の直接 OpenAI API タスク:** Codex ランタイムのオーバーライドなしで `/model openai/gpt-5.5` を使い、`OPENAI_API_KEY` を設定します。
    - **PI 経由の Codex OAuth:** 通常の PI ランナーを Codex OAuth と一緒に意図的に使いたい場合にのみ、`/model openai-codex/gpt-5.5` を使用します。
    - **サブエージェント:** コーディングタスクを、独自のモデルと `agentRuntime` デフォルトを持つ Codex 専用エージェントにルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するには？">
    セッショントグルまたは設定デフォルトのどちらかを使用します。

    - **セッションごと:** セッションが `openai/gpt-5.5` または `openai-codex/gpt-5.5` を使用している間に `/fast on` を送信します。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` または `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` を `true` に設定します。

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

    OpenAI では、高速モードはサポートされるネイティブ Responses リクエストの `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [Thinking と高速モード](/ja-JP/tools/thinking) と [OpenAI 高速モード](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とすべての
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: モデルを
    `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選びます。
    コマンドに `--runtime codex` も含まれていた場合は、先にモデルを追加してから、同じ
    `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは、**プロバイダーが設定されていない**（MiniMax プロバイダー設定または auth
    profile が見つからない）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 最新の OpenClaw リリースへアップグレードする（またはソースの `main` から実行する）し、Gateway を再起動します。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax 認証が
       env/auth profiles に存在し、一致するプロバイダーを注入できることを確認します
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証パスに対して正確なモデル ID（大文字小文字を区別）を使用します:
       API キー
       セットアップには `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth セットアップには `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そして一覧から選びます（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクに OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**として使い、必要に応じて**セッションごと**にモデルを切り替えます。
    フォールバックは「難しいタスク」用ではなく**エラー**用なので、`/model` または別のエージェントを使用してください。

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

    その後:

    ```
    /model gpt
    ```

    **オプション B: エージェントを分ける**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` で切り替えます

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト省略名が含まれています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API キーセットアップでは `openai/gpt-5.5`、Codex OAuth 用に設定されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、あなたの値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするには？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から取得されます。例:

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

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するには？">
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

    Z.AI (GLMモデル):

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

    プロバイダー/モデルを参照しているのに必要なプロバイダーキーがない場合、ランタイム認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後にプロバイダーのAPIキーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、次の場所に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuthプロファイルの場合、そのエージェント固有のアカウントが必要なときは新しいエージェントからサインインします。それ以外の場合、OpenClaw はリフレッシュトークンを複製せずにデフォルト/メインエージェントを読み取りに行けます。

    複数のエージェントで `agentDir` を再利用しないでください。認証/セッションの衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか?">
    フェイルオーバーは2段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単純な `429` 応答以外も含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用量ウィンドウの制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバーに値する
    レート制限として扱います。

    課金に見える応答の一部は `402` ではなく、一部のHTTP `402`
    応答もその一時的なバケットに留まります。プロバイダーが `401` または `403` で
    明示的な課金テキストを返す場合でも、OpenClaw はそれを
    課金レーンに保持できますが、プロバイダー固有のテキストマッチャーは、それを所有する
    プロバイダーの範囲に留まります（たとえば OpenRouter `Key limit exceeded`）。一方で `402`
    メッセージが再試行可能な使用量ウィンドウ、または
    組織/ワークスペースの利用額制限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期の課金無効化ではなく、`rate_limit` として扱います。

    コンテキストオーバーフローエラーは別です。
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` のようなシグネチャは、モデル
    フォールバックへ進まず、Compaction/再試行パスに留まります。

    汎用サーバーエラーテキストは、「unknown/error が含まれるものなら何でも」より意図的に狭くしています。OpenClaw は、Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキストを含むJSON `api_error` ペイロード
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）、および `ModelNotReadyException` のようなプロバイダー混雑エラーを、
    プロバイダーコンテキストが一致する場合にフェイルオーバーに値するタイムアウト/過負荷シグナルとして
    扱います。
    `LLM request failed with an unknown
    error.` のような汎用内部フォールバックテキストは保守的に扱われ、それ単体ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とは何ですか?'>
    これは、システムが認証プロファイルID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新旧のパス）
      - 現行: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` によって移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、それを継承しない可能性があります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する場合があります。
    - **モデル/認証ステータスをサニティチェックする**
      - `openclaw models status` を使用して、設定済みモデルとプロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行がAnthropic認証プロファイルに固定されているものの、Gateway が
    その認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLIを使用する**
      - Gatewayホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりにAPIキーを使用したい場合**
      - **Gatewayホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 欠落したプロファイルを強制する固定順序をすべてクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gatewayホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノートPCではなくGatewayマシン上に存在します。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか?">
    モデル設定にフォールバックとして Google Gemini が含まれている場合（またはGeminiの省略表記に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正: Google認証を提供するか、フォールバックがそこへルーティングされないように `agents.defaults.model.fallbacks` / エイリアスからGoogleモデルを削除または回避します。

    **LLMリクエストが拒否されました: thinking signature required（Google Antigravity）**

    原因: セッション履歴に**署名のないthinkingブロック**が含まれています（多くの場合、
    中断/部分的なストリームが原因）。Google Antigravity はthinkingブロックに署名を要求します。

    修正: OpenClaw は現在、Google Antigravity Claude の未署名thinkingブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuthフロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか?">
    認証プロファイルは、プロバイダーに紐づけられた名前付きの認証情報レコード（OAuthまたはAPIキー）です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list` を実行します（必要に応じて `--provider <id>` または `--json`）。詳細は [Models CLI](/ja-JP/cli/models#openclaw-models-auth-list) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイルIDは何ですか?">
    OpenClaw は次のような、プロバイダー接頭辞付きIDを使用します。

    - `anthropic:default`（メールIDがない場合によく使われます）
    - OAuth ID用の `anthropic:<email>`
    - 選択したカスタムID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試す認証プロファイルを制御できますか?">
    はい。設定では、プロファイルの任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。IDをプロバイダー/モードにマッピングし、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効化**状態（課金/クレジット不足）にある場合、一時的にそのプロファイルをスキップすることがあります。これを確認するには、`openclaw models status --json` を実行して `auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、
    同じプロバイダー上の兄弟モデルには引き続き使用できる場合があります。
    一方、課金/無効化ウィンドウはプロファイル全体を引き続きブロックします。

    CLIから、**エージェントごとの**順序オーバーライド（そのエージェントの `auth-state.json` に保存）も設定できます。

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

    保存済みプロファイルが明示的な順序から省略されている場合、probeは
    それを暗黙に試すのではなく、そのプロファイルに対して
    `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuthとAPIキーの違いは何ですか?">
    OpenClaw は両方をサポートしています。

    - **OAuth** は、多くの場合（該当する場合）サブスクリプションアクセスを利用します。
    - **APIキー** はトークン従量課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、APIキーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メインFAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
