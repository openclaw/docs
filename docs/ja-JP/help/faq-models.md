---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルのフェイルオーバーのデバッグ / 「すべてのモデルが失敗しました」
    - 認証プロファイルの理解と管理方法
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-07-05T11:24:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルのQ&A。セットアップ、セッション、gateway、チャネル、トラブルシューティングについては、メインの[FAQ](/ja-JP/help/faq)を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか?'>
    次で設定します:

    ```text
    agents.defaults.model.primary
    ```

    モデルは `provider/model` 参照です (例: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`)。常に `provider/model` を明示的に設定してください。
    プロバイダーを省略すると、OpenClaw はまずエイリアス一致を試し、次にそのモデルidについて一意の
    設定済みプロバイダー一致を試し、その後、設定済みデフォルトプロバイダーにフォールバックします
    (非推奨の互換パス)。そのプロバイダーに設定済みデフォルトモデルがなくなっている場合、
    OpenClaw は古いデフォルトではなく、最初の設定済みプロバイダー/モデルにフォールバックします。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか?">
    プロバイダースタックが提供する最新世代の最も強力なモデルを使用してください。
    特にツール有効エージェントや信頼できない入力を扱うエージェントでは重要です。弱いモデルや
    過度に量子化されたモデルは、プロンプトインジェクションや安全でない動作に対して脆弱です
    ([Security](/ja-JP/gateway/security) を参照)。日常的/低リスクのチャットには、エージェントロールごとに
    より安価なモデルをルーティングしてください。

    エージェントごとにモデルをルーティングし、長いタスクはサブエージェントで並列化します
    (各サブエージェントは独自のトークンを消費します)。[Models](/ja-JP/concepts/models)、
    [Sub-agents](/ja-JP/tools/subagents)、[MiniMax](/ja-JP/providers/minimax)、
    [Local models](/ja-JP/gateway/local-models) を参照してください。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか?">
    モデルフィールドだけを変更してください。設定全体の置き換えは避けてください。

    - チャット内の `/model` (セッション単位、[Slash commands](/ja-JP/tools/slash-commands) を参照)
    - `openclaw models set ...` (モデル設定のみを更新)
    - `openclaw configure --section model` (対話式)
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を直接編集

    RPC編集では、まず `config.schema.lookup` で確認し (正規化済みパス、浅いスキーマドキュメント、
    子要素の要約)、部分オブジェクトを使う `config.apply` より `config.patch` を優先してください。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を実行して修復します。

    ドキュメント: [Models](/ja-JP/concepts/models)、[Configure](/ja-JP/cli/configure)、
    [Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル (llama.cpp、vLLM、Ollama) は使えますか?">
    はい。Ollama が最も簡単な方法です。クイックセットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. ローカルモデルを取得します。例: `ollama pull gemma4`
    3. クラウドモデルも使う場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama`、次に `Local` または `Cloud + Local` を選択する

    `Cloud + Local` では、クラウドモデルに加えてローカルのOllamaモデルを利用できます。
    `kimi-k2.5:cloud` などのクラウドモデルにはローカル取得は不要です。手動で切り替えるには:
    `openclaw models list`、次に `openclaw models set ollama/<model>`。

    小さいモデルや大幅に量子化されたモデルは、プロンプトインジェクションに対してより脆弱です。
    ツールアクセスを持つボットには大規模モデルを使用してください。それでも小さいモデルを使う場合は、
    サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[Local models](/ja-JP/gateway/local-models)、
    [Model providers](/ja-JP/concepts/model-providers)、[Security](/ja-JP/gateway/security)、
    [Sandboxing](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか?">
    `/model <name>` を単独のメッセージとして送信します。番号付きピッカー (`/model`、`/model
    list`、`/model 3`)、セッションオーバーライドをクリアする `/model default`、endpoint/APIモードの詳細を表示する
    `/model status` を含む完全なコマンド一覧については、
    [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

    セッションごとに特定の認証プロファイルを強制するには、`@profile` を使用します:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    `@profile` で設定したプロファイルの固定を解除するには、サフィックスなしで `/model` を再実行する
    (例: `/model anthropic/claude-opus-4-6`) か、`/model` からデフォルトを選択します。
    アクティブな認証プロファイルを確認するには `/model status` を使用します。

  </Accordion>

  <Accordion title="2つのプロバイダーが同じモデルidを公開している場合、/model はどちらを使いますか?">
    `/model provider/model` は、その正確なプロバイダールートを選択します。たとえば、
    `qianfan/deepseek-v4-flash` と `deepseek/deepseek-v4-flash` は、モデルidが一致していても異なる
    参照です。OpenClaw は裸のid一致でプロバイダーを暗黙に切り替えません。

    ユーザーが選択した `/model` 参照は、フォールバックに対して厳密です。その
    provider/model が利用できなくなると、`agents.defaults.model.fallbacks` に
    フォールバックするのではなく、返信は見える形で失敗します。設定済みのフォールバックチェーンは、
    設定済みデフォルト、cronジョブのプライマリ、自動選択されたフォールバック状態には引き続き適用されます。
    セッションオーバーライドではない実行でフォールバックの使用が許可されている場合、OpenClaw はまず
    要求された provider/model を試し、次に設定済みフォールバック、最後に設定済みプライマリを試します。
    そのため、重複する裸のモデルidがデフォルトプロバイダーへ直接戻ることはありません。

    [Models](/ja-JP/concepts/models) と [Model failover](/ja-JP/concepts/model-failover) を参照してください。

  </Accordion>

  <Accordion title="日常タスクに GPT 5.5、コーディングに Codex 5.5 を使えますか?">
    はい。モデルの選択とランタイムの選択は別です:

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を
      `openai/gpt-5.5` に設定します。ChatGPT/Codexサブスクリプション認証には、
      `openclaw models auth login --provider openai` でサインインします。
    - **エージェントループ外の直接 OpenAI API タスク:** 画像、埋め込み、音声、リアルタイム、その他の
      非エージェント OpenAI API サーフェスには `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェントAPIキー認証:** 順序付きの `openai` APIキープロファイルで
      `/model openai/gpt-5.5` を使用します。
    - **サブエージェント:** コーディングタスクを、独自の `openai/gpt-5.5` モデルを持つ
      Codex向けエージェントへルーティングします。

    [Models](/ja-JP/concepts/models) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するにはどうすればよいですか?">
    - **セッション単位:** `openai/gpt-5.5` を使用中に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` を
      `true` に設定します。
    - **自動カットオフ:** `/fast auto` または `params.fastMode: "auto"` は、カットオフまでは新しい
      モデル呼び出しを高速で実行し、その後のリトライ、フォールバック、ツール結果、継続呼び出しは
      高速モードなしで実行します。カットオフのデフォルトは60秒です。モデルの
      `params.fastAutoOnSeconds` で上書きします。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    高速モードは、ネイティブ OpenAI Responses リクエストの `service_tier = "priority"` に対応します。
    既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。
    セッションの `/fast` オーバーライドは設定のデフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) と、[OpenAI](/ja-JP/providers/openai) プロバイダーページの
    高度な設定にある高速モードセクションを参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか?'>
    `agents.defaults.models` が設定されている場合、それは `/model` とセッションオーバーライドの
    **許可リスト** になります。そのリスト外のモデルを選択すると、通常の返信ではなく次が返されます:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    修正: 正確なモデルを `agents.defaults.models` に追加する、動的カタログ用に `"provider/*": {}` のような
    プロバイダーワイルドカードを追加する、許可リストを削除する、または `/model list` からモデルを選択します。
    コマンドに `--runtime codex` も含まれていた場合は、まず許可リストを更新し、その後同じ
    `/model provider/model --runtime codex` コマンドを再試行します。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M3」と表示されるのはなぜですか?'>
    古い OpenClaw リリースを使っている場合は、まずアップグレードする (またはソースの
    `main` から実行する) うえで gateway を再起動してください。`MiniMax-M3` は、まだインストール済みリリースの
    カタログに含まれていない可能性があります。それ以外の場合は、MiniMaxプロバイダーが
    設定されていません (プロバイダーエントリまたは認証プロファイルが見つかりません)。そのためモデルを解決できません。
    完全な修正チェックリスト、provider/model id表、設定ブロック例については、
    [MiniMax](/ja-JP/providers/minimax) プロバイダーページのトラブルシューティングセクションを参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクに OpenAI を使えますか?">
    はい。MiniMax をデフォルトとして使用し、セッションごとにモデルを切り替えます。フォールバックは
    「難しいタスク」用ではなくエラー用なので、`/model` または別のエージェントを使用してください。

    **オプションA: セッションごとに切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    その後 `/model gpt`。

    **オプションB: 別々のエージェント** — エージェントAはデフォルトでMiniMax、エージェントBは
    デフォルトでOpenAIにします。エージェントでルーティングするか、`/agent` で切り替えます。

    ドキュメント: [Models](/ja-JP/concepts/models)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、
    [MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか?">
    はい。組み込みの短縮名で、対象モデルが `agents.defaults.models` に存在する場合のみ適用されます:

    | エイリアス | 解決先 |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    同じ名前の独自エイリアスは、組み込みのものを上書きします。

  </Accordion>

  <Accordion title="モデルショートカット (エイリアス) を定義/上書きするにはどうすればよいですか?">
    エイリアスは `agents.defaults.models.<modelId>.alias` にあります:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    その後 `/model sonnet` (またはサポートされている場合は `/<alias>`) は、そのモデルidに解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など、他のプロバイダーのモデルを追加するにはどうすればよいですか?">
    OpenRouter (トークンごとの従量課金、多数のモデル):

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    参照された provider/model に対応するプロバイダーキーがない場合、ランタイム認証エラーが発生します
    (例: `No API key found for provider "zai"`)。

    **新しいエージェントを追加した後にプロバイダーのAPIキーが見つからない**

    新しいエージェントの認証ストアは空です。認証はエージェントごとで、次に保存されます:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正: `openclaw agents add <id>` を実行してウィザードで認証を設定するか、
    メインエージェントのストアから移植可能な静的 `api_key`/`token`
    プロファイルだけをコピーします。OAuth の場合は、新しいエージェントが
    自分専用のアカウントを必要とするときに、そのエージェントからサインインします。
    `agentDir` の再利用と認証情報共有の完全なルールは
    [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) を参照してください。
    エージェント間で `agentDir` を再利用してはいけません。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか?">
    2 つの段階があります。

    1. 同じプロバイダー内での **認証プロファイルローテーション**。
    2. `agents.defaults.model.fallbacks` の次のモデルへの **モデルフォールバック**。

    失敗したプロファイルにはクールダウン (指数バックオフ) が適用されるため、
    プロバイダーがレート制限中または一時的に失敗している場合でも、
    OpenClaw は応答を続けます。

    レート制限バケットは単純な `429` だけではありません。`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用ウィンドウ制限 (`weekly/monthly limit reached`) はすべて、
    フェイルオーバー対象のレート制限として扱われます。

    課金レスポンスは常に `402` とは限らず、一部の `402` は課金レーンではなく
    一時的/レート制限バケットに残ります。`401`/`403` に明示的な課金テキストが
    ある場合は、課金にルーティングされることがあります。プロバイダー固有の
    テキストマッチャー (例: OpenRouter `Key limit exceeded`) は、その
    プロバイダー内にスコープされます。再試行可能な使用ウィンドウや
    組織/ワークスペースの支出制限 (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) のように読める `402` は、
    長期の課金無効化ではなく `rate_limit` として扱われます。

    コンテキストオーバーフローエラーはフォールバック経路から完全に外れます。
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、`input is
    too long for the model`、`ollama error: context length exceeded` のような
    シグネチャは、モデルフォールバックを進めるのではなく、Compaction/再試行へ
    送られます。

    汎用サーバーエラーテキストは、「unknown/error を含むものすべて」よりも
    狭く扱われます。フェイルオーバーシグナルとして数えられる、
    プロバイダーにスコープされた一時的な形は次のとおりです。Anthropic の
    裸の `An unknown error occurred`、OpenRouter の裸の
    `Provider returned error`、`Unhandled stop reason: error` のような
    stop-reason エラー、一時的なサーバーテキスト (`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`) を
    含む JSON `api_error` ペイロード、およびプロバイダーコンテキストが一致する
    場合の `ModelNotReadyException` のようなプロバイダー混雑エラーです。
    `LLM request failed with an unknown error.` のような汎用の内部フォールバック
    テキストは保守的に扱われ、それ単体ではフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とはどういう意味ですか?'>
    認証プロファイル ID `anthropic:default` に、想定される認証ストア内の
    認証情報がありません。

    **修正チェックリスト:**

    - プロファイルが存在する場所を確認します。現在:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; レガシー:
      `~/.openclaw/agent/*` (`openclaw doctor` によって移行されます)。
    - Gateway が環境変数を読み込んでいることを確認します。シェルだけで設定した
      `ANTHROPIC_API_KEY` は、systemd/launchd 経由で実行される Gateway には
      届きません。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にします。
    - 正しいエージェントを編集していることを確認します。マルチエージェント構成には
      複数の `auth-profiles.json` ファイルがあります。
    - `openclaw models status` を実行して、設定済みモデルとプロバイダー認証の
      状態を確認します。

    **「No credentials found for profile anthropic」(メールサフィックスなし) の場合:**

    実行が、Gateway から見つけられない Anthropic プロファイルに固定されています。

    - Claude CLI を使う: Gateway ホストで `openclaw models auth login --provider anthropic
      --method cli --set-default` を実行します。
    - 代わりに API キーを使う: Gateway ホストの `~/.openclaw/.env` に
      `ANTHROPIC_API_KEY` を入れてから、見つからないプロファイルを強制する
      固定順序をクリアします。

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - リモートモード: 認証プロファイルはノート PC ではなく Gateway マシン上に
      あります。そこでコマンドを実行していることを確認してください。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか?">
    モデル設定にフォールバックとして Google Gemini が含まれている場合
    (または Gemini の省略形に切り替えた場合)、OpenClaw はフォールバック中に
    それを試します。Google の認証情報が設定されていないと、
    `No API key found for provider "google"` になります。修正: Google 認証を
    追加するか、`agents.defaults.model.fallbacks`/エイリアスから Google モデルを
    削除します。

    **LLM request rejected: thinking signature required (Google Antigravity)**

    原因: セッション履歴に署名のない thinking ブロックがあります
    (多くの場合、中断または部分的なストリームが原因です)。Google Antigravity は
    thinking ブロックに署名を要求します。OpenClaw は Google Antigravity Claude
    向けに署名のない thinking ブロックを取り除きます。それでも表示される場合は、
    新しいセッションを開始するか、そのエージェントで `/thinking off` を設定します。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth) (OAuth フロー、トークン保存、マルチアカウントパターン)

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか?">
    プロバイダーに紐づく、名前付きの認証情報レコード (OAuth または API キー) で、
    次の場所に保存されます。

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを確認するには、
    `openclaw models auth list` を使います (任意で `--provider <id>` または
    `--json`)。[Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか?">
    プロバイダー接頭辞付きです。`anthropic:default` (メール ID が存在しない場合に
    一般的)、OAuth ID 用の `anthropic:<email>`、または選択したカスタム ID
    (例: `anthropic:work`) です。

  </Accordion>

  <Accordion title="最初に試す認証プロファイルを制御できますか?">
    はい。`auth.order.<provider>` 設定は、プロバイダーごとのローテーション順序を
    設定します (メタデータのみ。シークレットは保存されません)。

    OpenClaw は、短い **クールダウン** (レート制限、タイムアウト、認証失敗) または
    より長い **無効** 状態 (課金/クレジット不足) にあるプロファイルを
    スキップすることがあります。`openclaw models status --json` で確認し、
    `auth.unusableProfiles` をチェックしてください。
    `auth.cooldowns.billingBackoffHours*` で調整します。レート制限クールダウンは
    モデルスコープの場合があります。あるモデルでクールダウン中のプロファイルでも、
    同じプロバイダー上の兄弟モデルには引き続き使えることがあります。
    課金/無効ウィンドウはプロファイル全体をブロックします。

    エージェントごとの順序上書きを設定します (そのエージェントの `auth-state.json`
    に保存されます)。

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるかを確認するには、`openclaw models status --probe` を
    使います。明示的な順序から除外された保存済みプロファイルは、黙って試されるのではなく
    `excluded_by_auth_order` と報告されます。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか?">
    - **OAuth / CLI ログイン** は、プロバイダーが対応している場合、
      多くの場合サブスクリプションアクセスを使います。Anthropic の場合、
      OpenClaw の Claude CLI バックエンドは Claude Code `claude -p` を使います。
      Anthropic は現在これを、サブスクリプション使用量上限から消費される
      Agent SDK/プログラム的使用として扱っています。現在の課金一時停止ステータスと
      ソースリンクについては [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - **API キー** はトークンごとの従量課金を使います。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、API キーに対応しています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
