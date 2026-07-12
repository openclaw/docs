---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: FAQ：モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル
title: FAQ：モデルと認証
x-i18n:
    generated_at: "2026-07-11T22:17:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルに関する Q&A。セットアップ、セッション、Gateway、チャンネル、および
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル：デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    次の項目で設定します。

    ```text
    agents.defaults.model.primary
    ```

    モデルは `provider/model` 形式の参照です（例：`openai/gpt-5.5`、
    `anthropic/claude-sonnet-4-6`）。常に `provider/model` を明示的に設定してください。
    プロバイダーを省略すると、OpenClaw は最初にエイリアスとの一致を試し、次にそのモデル ID に
    一致する設定済みプロバイダーが一意であるかを確認し、その後、設定済みのデフォルトプロバイダーへ
    フォールバックします（非推奨の互換パス）。そのプロバイダーに設定済みのデフォルトモデルが
    存在しなくなっている場合、OpenClaw は古いデフォルトではなく、最初に設定されている
    プロバイダー／モデルへフォールバックします。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    プロバイダースタックで提供されている最新世代のうち、最も高性能なモデルを使用してください。
    特に、ツールが有効なエージェントや信頼できない入力を扱うエージェントでは重要です。
    性能が低いモデルや過度に量子化されたモデルは、プロンプトインジェクションや安全でない動作の
    影響を受けやすくなります（[セキュリティ](/ja-JP/gateway/security) を参照）。
    日常的または低リスクのチャットには、エージェントの役割に応じて低コストのモデルを割り当ててください。

    エージェントごとにモデルを割り当て、長時間のタスクはサブエージェントで並列化してください
    （各サブエージェントは個別にトークンを消費します）。[モデル](/ja-JP/concepts/models)、
    [サブエージェント](/ja-JP/tools/subagents)、[MiniMax](/ja-JP/providers/minimax)、および
    [ローカルモデル](/ja-JP/gateway/local-models) を参照してください。

  </Accordion>

  <Accordion title="設定を消去せずにモデルを切り替えるにはどうすればよいですか？">
    モデルのフィールドだけを変更し、設定全体の置き換えは避けてください。

    - チャット内の `/model`（セッション単位。[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照）
    - `openclaw models set ...`（モデル設定のみを更新）
    - `openclaw configure --section model`（対話形式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を直接編集

    RPC で編集する場合は、まず `config.schema.lookup` で確認してください（正規化された
    パス、簡潔なスキーマドキュメント、子項目の概要）。その後、部分オブジェクトを使用する
    `config.apply` よりも `config.patch` を優先してください。設定を上書きしてしまった場合は、
    バックアップから復元するか、`openclaw doctor` を実行して修復してください。

    ドキュメント：[モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、
    [構成](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホスト型モデル（llama.cpp、vLLM、Ollama）を使用できますか？">
    はい。Ollama が最も簡単な方法です。クイックセットアップ：

    1. `https://ollama.com/download` から Ollama をインストール
    2. ローカルモデルを取得（例：`ollama pull gemma4`）
    3. クラウドモデルも使用する場合は、`ollama signin` を実行
    4. `openclaw onboard` を実行し、`Ollama`、続いて `Local` または `Cloud + Local` を選択

    `Cloud + Local` では、クラウドモデルとローカルの Ollama モデルの両方を使用できます。
    `kimi-k2.5:cloud` などのクラウドモデルはローカルで取得する必要がありません。手動で
    切り替えるには、`openclaw models list`、続いて `openclaw models set ollama/<model>` を
    実行します。

    小規模なモデルや高度に量子化されたモデルは、プロンプトインジェクションの影響を受けやすくなります。
    ツールにアクセスできるボットには大規模モデルを使用してください。それでも小規模モデルを
    使用する場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント：[Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="再起動せずに、その場でモデルを切り替えるにはどうすればよいですか？">
    `/model <name>` を単独のメッセージとして送信します。番号付き選択機能（`/model`、`/model
    list`、`/model 3`）、セッションのオーバーライドを解除する `/model default`、および
    エンドポイント／API モードの詳細を表示する `/model status` を含む全コマンド一覧については、
    [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

    `@profile` を使用すると、セッションごとに特定の認証プロファイルを強制できます。

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    `@profile` で設定したプロファイルの固定を解除するには、接尾辞なしで `/model` を再実行する
    （例：`/model anthropic/claude-opus-4-6`）か、`/model` からデフォルトを選択します。
    有効な認証プロファイルを確認するには、`/model status` を使用してください。

  </Accordion>

  <Accordion title="2 つのプロバイダーが同じモデル ID を公開している場合、/model はどちらを使用しますか？">
    `/model provider/model` は、指定されたプロバイダールートを厳密に選択します。たとえば、
    `qianfan/deepseek-v4-flash` と `deepseek/deepseek-v4-flash` は、モデル ID が同じでも
    異なる参照です。OpenClaw は、修飾されていない ID の一致だけを理由に、プロバイダーを
    暗黙的に切り替えることはありません。

    ユーザーが選択した `/model` の参照は、フォールバックに関して厳格です。その
    プロバイダー／モデルが利用できなくなった場合、`agents.defaults.model.fallbacks` へ
    フォールバックせず、応答は明示的に失敗します。設定済みのフォールバックチェーンは、
    設定済みのデフォルト、Cron ジョブのプライマリ、および自動選択されたフォールバック状態には
    引き続き適用されます。セッションオーバーライドではない実行でフォールバックが許可されている場合、
    OpenClaw は最初に要求されたプロバイダー／モデル、次に設定済みのフォールバック、最後に
    設定済みのプライマリを試します。そのため、重複する修飾されていないモデル ID が、いきなり
    デフォルトプロバイダーへ戻ることはありません。

    [モデル](/ja-JP/concepts/models) および [モデルのフェイルオーバー](/ja-JP/concepts/model-failover) を
    参照してください。

  </Accordion>

  <Accordion title="日常的なタスクに GPT 5.5、コーディングに Codex 5.5 を使用できますか？">
    はい。モデルの選択とランタイムの選択は別々です。

    - **ネイティブ Codex コーディングエージェント：** `agents.defaults.model.primary` を
      `openai/gpt-5.5` に設定します。ChatGPT/Codex サブスクリプション認証を使用するには、
      `openclaw models auth login --provider openai` でサインインします。
    - **エージェントループ外の直接的な OpenAI API タスク：** 画像、埋め込み、音声、リアルタイム、
      およびその他のエージェント以外の OpenAI API サーフェス向けに `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェントの API キー認証：** 順序付けされた `openai` API キープロファイルと
      `/model openai/gpt-5.5` を使用します。
    - **サブエージェント：** コーディングタスクを、独自の `openai/gpt-5.5` モデルを使用する
      Codex 特化エージェントへ割り当てます。

    [モデル](/ja-JP/concepts/models) および [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するにはどうすればよいですか？">
    - **セッション単位：** `openai/gpt-5.5` の使用中に `/fast on` を送信します。
    - **モデル単位のデフォルト：**
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` を `true` に設定します。
    - **自動カットオフ：** `/fast auto` または `params.fastMode: "auto"` を使用すると、
      カットオフまでは新しいモデル呼び出しを高速で実行し、それ以降の再試行、フォールバック、
      ツール結果、または継続呼び出しは高速モードなしで実行します。カットオフのデフォルトは
      60 秒です。モデルの `params.fastAutoOnSeconds` で上書きできます。

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

    高速モードは、ネイティブ OpenAI Responses リクエストの `service_tier = "priority"` に
    対応します。既存の `service_tier` 値は保持され、高速モードによって `reasoning` や
    `text.verbosity` が書き換えられることはありません。セッションの `/fast` オーバーライドは、
    設定のデフォルトより優先されます。

    [思考と高速モード](/ja-JP/tools/thinking)、および [OpenAI](/ja-JP/providers/openai) プロバイダーページの
    詳細設定にある高速モードのセクションを参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後応答がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それが `/model` とセッションオーバーライドの
    **許可リスト**になります。リスト外のモデルを選択すると、通常の応答ではなく次の内容が返されます。

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    修正方法：正確なモデルを `agents.defaults.models` に追加する、動的カタログ用に
    `"provider/*": {}` のようなプロバイダーワイルドカードを追加する、許可リストを削除する、
    または `/model list` からモデルを選択します。コマンドに `--runtime codex` も含まれていた場合は、
    まず許可リストを更新してから、同じ `/model provider/model --runtime codex` コマンドを
    再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M3」と表示されるのはなぜですか？'>
    古い OpenClaw リリースを使用している場合は、まずアップグレードするか、ソースの `main` から
    実行して Gateway を再起動してください。`MiniMax-M3` が、インストール済みリリースの
    カタログにまだ含まれていない可能性があります。それ以外の場合は、MiniMax プロバイダーが
    設定されていないため（プロバイダーエントリまたは認証プロファイルが見つからない）、
    モデルを解決できません。完全な修正チェックリスト、プロバイダー／モデル ID の表、および
    設定ブロックの例については、[MiniMax](/ja-JP/providers/minimax) プロバイダーページの
    トラブルシューティングセクションを参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクには OpenAI を使用できますか？">
    はい。MiniMax をデフォルトとして使用し、セッションごとにモデルを切り替えます。
    フォールバックはエラー用であり「難しいタスク」用ではないため、`/model` または別の
    エージェントを使用してください。

    **選択肢 A：セッションごとに切り替える**

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

    続いて `/model gpt` を実行します。

    **選択肢 B：別々のエージェント** — エージェント A は MiniMax、エージェント B は
    OpenAI をデフォルトにします。エージェントごとにルーティングするか、`/agent` で切り替えます。

    ドキュメント：[モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、
    [MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みのショートカットですか？">
    はい。これらは組み込みの短縮名であり、対象モデルが `agents.defaults.models` に存在する場合にのみ
    適用されます。

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

    同じ名前の独自エイリアスを設定すると、組み込みのエイリアスより優先されます。

  </Accordion>

  <Accordion title="モデルのショートカット（エイリアス）を定義または上書きするにはどうすればよいですか？">
    エイリアスは `agents.defaults.models.<modelId>.alias` に設定します。

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

    これにより、`/model sonnet`（またはサポートされている場合は `/<alias>`）が、その
    モデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など、他のプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークン単位の従量課金、多数のモデル）：

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

    Z.AI（GLM モデル）：

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

    参照されたプロバイダー／モデルに必要なプロバイダーキーがない場合、実行時に認証エラーが
    発生します（例：`No API key found for provider "zai"`）。

    **新しいエージェントを追加した後にプロバイダーの API キーが見つからない場合**

    新しいエージェントの認証ストアは空です。認証情報はエージェントごとに管理され、次の場所に
    保存されます。

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法: `openclaw agents add <id>` を実行してウィザードで認証を設定するか、メインエージェントのストアから移植可能な静的 `api_key`/`token` プロファイルだけをコピーします。OAuth の場合、新しいエージェントが独自のアカウントを必要とするときに、そのエージェントからサインインします。`agentDir` の再利用と認証情報共有に関する完全なルールは、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。エージェント間で `agentDir` を再利用してはいけません。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「すべてのモデルが失敗しました」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように機能しますか？">
    2 つの段階があります。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に障害を起こしている場合でも、OpenClaw は応答を継続できます。

    レート制限の分類対象は単純な `429` だけではありません。`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`、および定期的な使用期間制限（`weekly/monthly limit reached`）はすべて、フェイルオーバーの対象となるレート制限として扱われます。

    課金に関する応答は常に `402` とは限らず、一部の `402` は課金系ではなく、一時的障害／レート制限の分類に留まります。`401`/`403` に明示的な課金関連テキストが含まれる場合は、課金系に分類されることがあります。プロバイダー固有のテキスト照合（例: OpenRouter の `Key limit exceeded`）は、そのプロバイダー内だけに適用されます。再試行可能な使用期間制限または組織／ワークスペースの支出制限（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）と解釈できる `402` は、長期間の課金無効化ではなく `rate_limit` として扱われます。

    コンテキスト超過エラーは、フォールバック経路の対象外です。`request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` のようなシグネチャは、モデルフォールバックを進める代わりに Compaction／再試行へ送られます。

    一般的なサーバーエラーテキストの対象範囲は、「unknown/error を含むすべてのもの」より限定的です。フェイルオーバーシグナルとして扱われるプロバイダー固有の一時的な形式には、Anthropic の単独の `An unknown error occurred`、OpenRouter の単独の `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキスト（`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`）を含む JSON の `api_error` ペイロード、およびプロバイダーのコンテキストが一致する場合の `ModelNotReadyException` のようなプロバイダー混雑エラーがあります。`LLM request failed
    with an unknown error.` のような一般的な内部フォールバックテキストは慎重に扱われ、それだけではフォールバックを開始しません。

  </Accordion>

  <Accordion title='「プロファイル anthropic:default の認証情報が見つかりません」とはどういう意味ですか？'>
    認証プロファイル ID `anthropic:default` に、想定される認証ストア内の認証情報がありません。

    **修正チェックリスト:**

    - プロファイルの保存場所を確認します。現在:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、旧形式:
      `~/.openclaw/agent/*`（`openclaw doctor` により移行されます）。
    - Gateway が環境変数を読み込んでいることを確認します。シェルだけに設定された `ANTHROPIC_API_KEY` は、systemd/launchd 経由で実行される Gateway には渡されません。`~/.openclaw/.env` に設定するか、`env.shellEnv` を有効にしてください。
    - 正しいエージェントを編集していることを確認します。マルチエージェント構成には複数の `auth-profiles.json` ファイルがあります。
    - `openclaw models status` を実行して、設定済みのモデルとプロバイダーの認証状態を確認します。

    **「プロファイル anthropic の認証情報が見つかりません」（メールアドレス接尾辞なし）の場合:**

    実行が、Gateway で見つけられない Anthropic プロファイルに固定されています。

    - Claude CLI を使用する場合: Gateway ホスト上で `openclaw models auth login --provider anthropic
      --method cli --set-default` を実行します。
    - 代わりに API キーを使用することを推奨します。Gateway ホスト上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を設定し、見つからないプロファイルを強制する固定順序をすべて解除します。

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - リモートモード: 認証プロファイルはノート PC ではなく Gateway マシン上にあります。そこでコマンドを実行していることを確認してください。

  </Accordion>

  <Accordion title="Google Gemini も試行されて失敗したのはなぜですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の短縮名に切り替えた場合）、OpenClaw はフォールバック中にそれを試行します。Google の認証情報が設定されていない場合、`No API key found for provider
    "google"` が発生します。修正方法: Google の認証を追加するか、`agents.defaults.model.fallbacks`／エイリアスから Google モデルを削除します。

    **LLM リクエストが拒否されました: 思考シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴にシグネチャのない思考ブロックがあります（多くの場合、中止または不完全なストリームが原因です）。Google Antigravity では思考ブロックにシグネチャが必要です。OpenClaw は Google Antigravity Claude 向けに署名されていない思考ブロックを除去します。それでも表示される場合は、新しいセッションを開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連項目: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークンの保存、複数アカウントのパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    プロバイダーに関連付けられた名前付きの認証情報レコード（OAuth または API キー）であり、次の場所に保存されます。

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを確認するには、`openclaw models auth
    list`（必要に応じて `--provider <id>` または `--json`）を使用します。[モデル CLI](/ja-JP/cli/models#auth-profiles)を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか？">
    プロバイダー接頭辞付きです。メールアドレスの識別情報が存在しない場合によく使用される `anthropic:default`、OAuth の識別情報用の `anthropic:<email>`、または任意に選択したカスタム ID（例: `anthropic:work`）があります。

  </Accordion>

  <Accordion title="どの認証プロファイルを最初に試すか制御できますか？">
    はい。`auth.order.<provider>` 設定で、プロバイダーごとのローテーション順序を設定できます（メタデータのみで、シークレットは保存されません）。

    OpenClaw は、短い**クールダウン**（レート制限、タイムアウト、認証失敗）または長い**無効化**状態（課金／クレジット不足）にあるプロファイルをスキップする場合があります。`openclaw models status
    --json` で確認し、`auth.unusableProfiles` を調べてください。`auth.cooldowns.billingBackoffHours*` で調整できます。レート制限のクールダウンはモデル単位の場合があります。あるモデルでクールダウン中のプロファイルでも、同じプロバイダーの別のモデルには引き続き使用できます。一方、課金／無効化期間はプロファイル全体をブロックします。

    エージェントごとの順序オーバーライドを設定します（そのエージェントの `auth-state.json` に保存されます）。

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

    実際に何が試行されるかを確認するには、`openclaw models status --probe` を使用します。明示的な順序から除外された保存済みプロファイルは、暗黙に試行されるのではなく `excluded_by_auth_order` として報告されます。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    - **OAuth／CLI ログイン**では、プロバイダーが対応している場合、サブスクリプションアクセスが使用されることがよくあります。Anthropic の場合、OpenClaw の Claude CLI バックエンドは Claude Code の `claude -p` を使用します。Anthropic は現在、これをサブスクリプションの使用量上限から消費される Agent SDK／プログラムによる使用として扱っています。現在の課金一時停止状況と情報源へのリンクについては、[Anthropic](/ja-JP/providers/anthropic)を参照してください。
    - **API キー**では、トークン単位の従量課金が使用されます。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、および API キーに対応しています。

  </Accordion>
</AccordionGroup>

## 関連項目

- [よくある質問](/ja-JP/help/faq) — メインのよくある質問
- [よくある質問 — クイックスタートと初回実行時のセットアップ](/ja-JP/help/faq-first-run)
- [モデルの選択](/ja-JP/concepts/model-providers)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
