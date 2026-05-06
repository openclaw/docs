---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルの理解と管理方法
sidebarTitle: Models FAQ
summary: 'よくある質問: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-05-06T05:07:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  Model と認証プロファイルの Q&A。セットアップ、セッション、Gateway、チャンネル、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか?'>
    OpenClaw のデフォルトモデルは、次のように設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照します (例: `openai/gpt-5.5` または `openai-codex/gpt-5.5`)。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、最後に非推奨の互換性パスとして設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示するのではなく、最初に設定された provider/model にフォールバックします。それでも `provider/model` を**明示的に**設定する必要があります。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか?">
    **推奨デフォルト:** プロバイダースタックで利用可能な、最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりモデルの強さを優先してください。
    **日常的または低リスクのチャット:** 安価なフォールバックモデルを使い、エージェントロールでルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクな作業には**手が届く範囲で最良のモデル**を使い、日常的なチャットや要約にはより安価なモデルを使います。エージェントごとにモデルをルーティングでき、サブエージェントを使って長いタスクを並列化できます (各サブエージェントはトークンを消費します)。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプトインジェクションや安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには?">
    **モデルコマンド**を使うか、**model** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャットで `/model` (高速、セッション単位)
    - `openclaw models set ...` (モデル設定だけを更新)
    - `openclaw configure --section model` (対話式)
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換えるつもりがない限り、部分オブジェクトで `config.apply` を使わないでください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードには、正規化済みパス、浅いスキーマドキュメント/制約、直下の子要素の要約が含まれます。
    部分更新向けです。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル (llama.cpp、vLLM、Ollama) は使えますか?">
    はい。ローカルモデルでは Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` などのローカルモデルを pull する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama` を選ぶ
    5. `Local` または `Cloud + Local` を選ぶ

    注意:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルを使えます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカル pull を必要としません
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使います

    セキュリティ上の注意: より小さいモデルや大きく量子化されたモデルは、プロンプトインジェクションに対してより脆弱です。ツールを使える bot には**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はモデルに何を使っていますか?">
    - これらのデプロイは異なる場合があり、時間とともに変わることもあります。固定のプロバイダー推奨はありません。
    - 各 Gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティに敏感な、またはツール有効のエージェントには、利用可能な最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには?">
    `/model` コマンドを単独のメッセージとして使います。

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

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧できます。

    `/model` (および `/model list`) は、コンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の認証プロファイルを強制することもできます (セッション単位)。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの認証プロファイルが試されるかを表示します。
    利用可能な場合は、設定済みプロバイダーエンドポイント (`baseUrl`) と API モード (`api`) も表示します。

    **@profile で設定したプロファイルの固定を解除するには?**

    `@profile` サフィックスなしで `/model` を再実行します。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか、`/model <default provider/model>` を送信します。
    どの認証プロファイルがアクティブか確認するには `/model status` を使ってください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか?">
    はい。モデルの選択とランタイムの選択は別々に扱ってください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に、`agents.defaults.agentRuntime.id` を `"codex"` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインしてください。
    - **PI 経由の直接 OpenAI API タスク:** Codex ランタイム上書きなしで `/model openai/gpt-5.5` を使い、`OPENAI_API_KEY` を設定します。
    - **PI 経由の Codex OAuth:** 通常の PI ランナーを Codex OAuth とともに意図的に使いたい場合にのみ、`/model openai-codex/gpt-5.5` を使います。
    - **サブエージェント:** コーディングタスクを、独自のモデルと `agentRuntime` デフォルトを持つ Codex 専用エージェントへルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するには?">
    セッショントグルまたは設定デフォルトのいずれかを使います。

    - **セッション単位:** セッションが `openai/gpt-5.5` または `openai-codex/gpt-5.5` を使っている間に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` または `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` を `true` に設定します。

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

    OpenAI では、高速モードは対応しているネイティブ Responses リクエストで `service_tier = "priority"` に対応します。セッションの `/fast` 上書きは設定デフォルトより優先されます。

    [Thinking と高速モード](/ja-JP/tools/thinking) と [OpenAI 高速モード](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示された後、返信がないのはなぜですか?'>
    `agents.defaults.models` が設定されている場合、それは `/model` とすべてのセッション上書きの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: モデルを `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選んでください。
    コマンドに `--runtime codex` も含まれていた場合は、先にモデルを追加してから、同じ `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか?'>
    これは、**プロバイダーが設定されていない** (MiniMax プロバイダー設定または認証プロファイルが見つからなかった) ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現在の OpenClaw リリースへアップグレードする (またはソースの `main` から実行する) してから、Gateway を再起動します。
    2. MiniMax が設定されていること (ウィザードまたは JSON)、または一致するプロバイダーを注入できるように MiniMax 認証が env/認証プロファイルに存在することを確認します
       (`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済みの MiniMax OAuth)。
    3. 認証パスに合う正確なモデル ID (大文字小文字を区別) を使います:
       API キー設定では `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth 設定では `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そして一覧から選びます (またはチャットで `/model list`)。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクには OpenAI を使えますか?">
    はい。**MiniMax をデフォルト**として使い、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**のためのものであり、「難しいタスク」のためではありません。そのため `/model` または別のエージェントを使ってください。

    **オプション A: セッション単位で切り替える**

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
    - エージェントでルーティングする、または `/agent` で切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか?">
    はい。OpenClaw にはいくつかのデフォルト短縮形が同梱されています (`agents.defaults.models` にモデルが存在する場合にのみ適用されます)。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API キー設定では `openai/gpt-5.5`、Codex OAuth 向けに設定されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット (エイリアス) を定義/上書きするには?">
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

    その後、`/model sonnet` (または対応している場合は `/<alias>`) はそのモデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するには?">
    OpenRouter (トークン単位課金、多数のモデル):

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

    Z.AI (GLM モデル):

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

    Provider/モデルを参照しているのに必要な Provider キーがない場合、実行時認証エラーが発生します (例: `No API key found for provider "zai"`)。

    **新しいエージェントを追加した後に Provider の API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、
    次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正オプション:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルの場合、独自のアカウントが必要なときは新しいエージェントからサインインします。それ以外の場合、OpenClaw は更新トークンを複製せずに、デフォルト/メインエージェントを読み取り元として利用できます。

    エージェント間で `agentDir` を再利用しないでください。認証/セッションの衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように機能しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じ Provider 内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン (指数バックオフ) が適用されるため、Provider がレート制限中または一時的に失敗している場合でも OpenClaw は応答を続けられます。

    レート制限バケットには、単なる `429` レスポンス以上のものが含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用量ウィンドウの制限 (`weekly/monthly limit reached`) のようなメッセージも、
    フェイルオーバーに値するレート制限として扱います。

    請求関連に見えるレスポンスの中には `402` ではないものがあり、一部の HTTP `402`
    レスポンスもその一時的なバケットに残ります。Provider が
    `401` または `403` で明示的な請求テキストを返す場合、OpenClaw はそれを
    請求レーンに保持できますが、Provider 固有のテキストマッチャーは、それを所有する
    Provider のスコープに限定されます (たとえば OpenRouter の `Key limit exceeded`)。`402`
    メッセージが代わりに再試行可能な使用量ウィンドウや
    組織/ワークスペースの支出上限 (`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`) のように見える場合、OpenClaw はそれを
    長期の請求無効化ではなく `rate_limit` として扱います。

    コンテキスト超過エラーは異なります。
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` などのシグネチャは、モデルフォールバックを進める代わりに、
    Compaction/再試行パスに留まります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものなら何でも」より意図的に狭くしています。OpenClaw は、Provider コンテキストが一致する場合に、
    Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキスト
    (`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`) を含む JSON `api_error` ペイロード、および `ModelNotReadyException` のような
    Provider ビジーエラーを、フェイルオーバーに値するタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ自体ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とは何を意味しますか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストアでその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する** (新しいパスとレガシーパス)
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*` (`openclaw doctor` により移行)
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する可能性があります。
    - **モデル/認証ステータスを簡易確認する**
      - `openclaw models status` を使用して、設定済みモデルと Provider が認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているものの、Gateway が
    認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使いたい場合**
      - **Gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 欠落しているプロファイルを強制する固定順序をすべてクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノート PC ではなく Gateway マシン上に存在します。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試行して失敗したのですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合 (または Gemini の省略記法に切り替えた場合)、OpenClaw はモデルフォールバック中にそれを試行します。Google 認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避して、フォールバックがそこへルーティングされないようにします。

    **LLM リクエストが拒否されました: thinking 署名が必要です (Google Antigravity)**

    原因: セッション履歴に**署名のない thinking ブロック**が含まれています (多くの場合、
    中断された/部分的なストリームが原因です)。Google Antigravity では thinking ブロックに署名が必要です。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名のない thinking ブロックを削除します。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定します。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: それらの概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth) (OAuth フロー、トークン保存、マルチアカウントパターン)

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、プロバイダーに紐づいた名前付きの認証情報レコード (OAuth または API キー) です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを確認するには、`openclaw models auth list` を実行します (必要に応じて `--provider <id>` または `--json` を指定)。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使用します。

    - `anthropic:default` (メール ID が存在しない場合によく使われます)
    - OAuth ID の `anthropic:<email>`
    - 選択したカスタム ID (例: `anthropic:work`)

  </Accordion>

  <Accordion title="どの認証プロファイルを最初に試すか制御できますか？">
    はい。設定では、プロファイルの任意メタデータと、プロバイダーごとの順序 (`auth.order.<provider>`) をサポートしています。これは**シークレットを保存しません**。ID をプロバイダー/モードにマッピングし、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン** (レート制限/タイムアウト/認証失敗) またはより長い**無効**状態 (請求/クレジット不足) にある場合、一時的にそのプロファイルをスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用できる場合があります。一方、請求/無効ウィンドウはプロファイル全体を引き続きブロックします。

    CLI を使用して、**エージェントごとの**順序オーバーライド (そのエージェントの `auth-state.json` に保存) も設定できます。

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

    実際に何が試行されるかを確認するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe はそのプロファイルを黙って試す代わりに
    `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth** は多くの場合、(該当する場合) サブスクリプションアクセスを活用します。
    - **API キー** はトークンごとの従量課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
