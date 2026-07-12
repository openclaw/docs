---
read_when:
    - モデルのフォールバック動作または選択 UX の変更
    - 「model is not allowed」または古いデフォルトプロバイダーへのフォールバックのデバッグ
    - models.json のマージおよびシークレットの動作に取り組む
sidebarTitle: Models CLI
summary: OpenClaw がプロバイダー/モデル参照、設定キー、`/model` チャットコマンドを解決する仕組み
title: モデル CLI
x-i18n:
    generated_at: "2026-07-12T14:25:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="モデルのフェイルオーバー" href="/ja-JP/concepts/model-failover">
    認証プロファイルのローテーション、クールダウン、およびフォールバックとの相互作用。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers">
    プロバイダーの概要と例。
  </Card>
  <Card title="モデル CLI リファレンス" href="/ja-JP/cli/models">
    `openclaw models` のコマンドとフラグに関する完全なリファレンス。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults">
    モデル設定キー、デフォルト、および例。
  </Card>
</CardGroup>

モデル参照（`provider/model`）は、低レベルのエージェントランタイムではなく、プロバイダーとモデルを選択します。ランタイムポリシーが未設定または `auto` の場合、OpenAI のプロバイダー所有ルートポリシーが Codex を選択できるのは、作成者によるリクエストのオーバーライドがなく、公式 HTTPS Platform Responses または ChatGPT Responses ルートに完全一致する場合のみです。`openai/*` プレフィックスだけで Codex が選択されることはありません。Completions アダプター、カスタムエンドポイント、および作成者が指定したリクエスト動作は OpenClaw 上に残ります。平文の公式 HTTP エンドポイントは拒否されます。[OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。

サブスクリプション版 Copilot の参照（`github-copilot/*`）では、外部 GitHub Copilot エージェントランタイム Plugin をオプトインできますが、この経路は常に明示的です（`auto` によって選択されることはありません）。ランタイムのオーバーライドは、エージェントまたはセッション全体ではなく、プロバイダー／モデルのポリシーに設定します。ランタイムの選択によって請求方法が決まるわけではありません。OpenAI API キーの認証情報と ChatGPT/Codex サブスクリプションの認証情報は引き続き別物です。[エージェントランタイム](/ja-JP/concepts/agent-runtimes)および[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## 選択順序

<Steps>
  <Step title="プライマリモデル">
    `agents.defaults.model.primary`（または単純な文字列としての `agents.defaults.model`）。
  </Step>
  <Step title="フォールバック">
    `agents.defaults.model.fallbacks` を順番に試します。
  </Step>
  <Step title="認証フェイルオーバー">
    OpenClaw が次のフォールバックモデルへ移る前に、プロバイダー内で認証プロファイルのローテーションが行われます。
  </Step>
</Steps>

関連するモデル設定項目：

- `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト／カタログとエイリアスです。各モデルを個別に列挙せず、プロバイダーから検出されたすべてのモデルを許可するには、`provider/*` エントリを使用します。
- `agents.defaults.utilityModel` は、生成されるダッシュボードのセッションタイトル、対応チャネルのスレッド／トピックタイトル、進捗説明などの短い内部タスクに使用できる、オプションの低コストモデルです。エージェントごとの `agents.list[].utilityModel` がこれをオーバーライドします。未設定の場合、OpenClaw はプライマリプロバイダーに宣言済みの小規模モデルのデフォルトがあればそれを使用し（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）、なければエージェントのプライマリモデルを使用します。ユーティリティルーティングを無効にするには空文字列を設定します。ユーティリティタスクは別個のモデル呼び出しであり、選択されたモデルプロバイダーへ制限された範囲のタスク内容を送信する場合があります。
- `agents.defaults.imageModel` は、プライマリモデルが画像を受け付けられない場合にのみ使用されます。
- `agents.defaults.pdfModel` は `pdf` ツールで使用されます。未設定の場合、ツールは `imageModel`、次に解決済みのセッション／デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel`、`videoGenerationModel` は、共有メディア生成ツールを支えます。未設定の場合、各ツールは認証情報に基づくプロバイダーのデフォルトを推定します。現在のデフォルトプロバイダーを最初に試し、次にその機能について登録されている残りのプロバイダーをプロバイダー ID 順に試します。明示的なフォールバックを維持しつつ、このプロバイダー横断の推定を無効にするには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
- エージェントごとの `agents.list[].model`（およびバインディング）は `agents.defaults.model` をオーバーライドします。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。

キーの完全なリファレンス、デフォルト、および JSON5 の例については、[設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults)を参照してください。

## 選択元とフォールバックの厳格性

同じ `provider/model` でも、その選択元によって動作が異なります。

| 選択元                                                                  | 動作                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定済みのデフォルト（`agents.defaults.model.primary`、エージェントごとのプライマリ） | 通常の開始点です。`agents.defaults.model.fallbacks` を使用します。                                                                                                                                                                                                 |
| 自動フォールバック                                                           | 一時的な復旧状態であり、`modelOverrideSource: "auto"` として保存されます。OpenClaw は元のプライマリを定期的に再プローブし、復旧すると自動選択を解除し、フォールバック／復旧の遷移を状態変化ごとに一度通知します。                              |
| ユーザーによるセッション選択                                                  | 完全一致かつ厳格です。`/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を保存します。そのプロバイダー／モデルに到達できなくなった場合、別の設定済みモデルへ移行せず、実行は明示的に失敗します。 |
| Cron の `--model`／ペイロードの `model`                                        | ジョブごとのプライマリです。ジョブが独自のペイロード `fallbacks` を指定しない限り、設定済みのフォールバックを引き続き使用します（`fallbacks: []` は厳格な実行を強制します）。                                                                                                                    |

その他の選択ルール：

- `agents.defaults.model.primary` を変更しても、既存のセッション固定は書き換えられません。ステータスに `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` と表示された場合は、`/model default` を実行して固定を解除します。
- CLI のデフォルトモデルおよび許可リストのピッカーは、`models.mode: "replace"` を尊重し、組み込みカタログ全体ではなく `models.providers.*.models` のみを一覧表示します。
- Control UI のモデルピッカーは、設定済みのモデルビューを Gateway に問い合わせます。`agents.defaults.models` が設定されている場合はそれを使用し（`provider/*` ワイルドカードエントリを含む）、それ以外の場合は `models.providers.*.models` と、使用可能な認証情報を持つプロバイダーを使用します。組み込みカタログ全体は、明示的な閲覧ビュー（`view: "all"` を指定した `models.list`、または `openclaw models list --all`）にのみ使用されます。
- プロバイダー一覧 UI は、`view: "provider-config"` を指定した `models.list` を使用し、ピッカーの許可リストを適用せずに、ソースで定義された `models.providers.*.models` の行を表示します。

詳細な仕組みについては、[モデルのフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。

## クイックモデルポリシー

- 使用可能な最新世代のモデルのうち、最も高性能なものをプライマリに設定します。
- コストやレイテンシに敏感なタスク、および重要度の低いチャットにはフォールバックを使用します。
- ツールを有効にしたエージェントや信頼できない入力では、古い／性能の低いモデル階層を避けます。

## オンボーディング

```bash
openclaw onboard
```

OpenAI Codex サブスクリプション OAuth と Anthropic（API キーまたは Claude CLI の再利用）を含む一般的なプロバイダーについて、設定を手動編集せずにモデルと認証をセットアップします。

プライマリモデルが設定されていない場合、新規の OpenAI API キーセットアップでは `openai/gpt-5.6` が選択されます。修飾子のない直接 API ID は Sol 階層として解決されます。新規の ChatGPT/Codex OAuth セットアップでは、完全一致する `openai/gpt-5.6-sol` カタログ参照が選択されます。再認証時は、`openai/gpt-5.5` を含む既存の明示的なプライマリモデルが維持されます。アカウントで GPT-5.6 を使用できない場合は、`openai/gpt-5.5` を明示的に選択してください。OpenClaw が暗黙的にダウングレードすることはありません。

## 「Model is not allowed」（および応答が停止する理由）

`agents.defaults.models` が設定されている場合、これは `/model` とセッションオーバーライドの許可リストになります。許可リスト外のモデルを選択すると、通常の応答が生成される前に次の内容が返されます。

```text
モデル「provider/model」は許可されていません。プロバイダーを一覧表示するには /models を、モデルを一覧表示するには /models <provider> を使用してください。
次のコマンドで追加できます: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

修正するには、モデルを `agents.defaults.models` に追加するか、許可リスト全体をクリアする（キーを削除する）か、`/model list` からモデルを選択します。拒否されたコマンドに `/model openai/gpt-5.5 --runtime codex` のようなランタイムオーバーライドが含まれていた場合は、まず許可リストを修正してから、同じ `/model ... --runtime ...` コマンドを再試行します。

ローカル／GGUF モデルの場合、許可リストには、たとえば `ollama/gemma4:26b` や `lmstudio/Gemma4-26b-a4-it-gguf` のような、プロバイダープレフィックス付きの完全な参照が必要です。正確な文字列は `openclaw models list --provider <provider>` で確認してください。許可リストが有効になると、ファイル名のみ、または表示名だけでは不十分です。

すべてのモデルを列挙せずにプロバイダーを制限するには、`provider/*` ワイルドカードエントリを使用します。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

これにより、`/model`、`/models`、およびモデルピッカーには、それらのプロバイダーで検出されたカタログのみが表示され、新しいモデルは許可リストを編集せずに表示されるようになります。正確な `provider/model` エントリと `provider/*` エントリを組み合わせることで、別のプロバイダーから特定のモデルを 1 つだけ取り込めます。

エイリアスを含む許可リストの例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="CLI から許可リストを安全に編集する">
追加的な変更には `--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、既存のエントリが失われる場合、`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` へのプレーンオブジェクトの代入を拒否します。新しい値を対象全体の値にする必要がある場合にのみ、`--replace` を使用してください。対話型のプロバイダーセットアップと `openclaw configure --section model` は、プロバイダー単位の選択を許可リストへすでにマージするため、プロバイダーを追加しても無関係なエントリは削除されません。また、configure は既存の `agents.defaults.model.primary` を維持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` のような明示的なコマンドは、引き続きプライマリを置き換えます。
</Accordion>

## チャット内の `/model`

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` と `/model list` は、コンパクトな番号付き選択画面（モデルファミリー + 利用可能なプロバイダー）を表示します。`/model <#>` でそこから選択します。Discord ではプロバイダーとモデルのドロップダウンが開き、Submit の手順があります。Telegram では選択画面での選択はセッションスコープであり、`openclaw.json` にあるエージェントの永続的なデフォルトを書き換えることはありません。`/models add` は非推奨であり、チャットからモデルを登録する代わりにメッセージを返します。
- `/model` は新しいセッション選択を即座に永続化します。エージェントがアイドル状態なら、次の実行ですぐに使用されます。実行がすでに進行中なら、切り替えは次の安全な再試行ポイントまで保留されます（ツール処理または返信出力がすでに始まっている場合は、さらに後のポイントになります）。
- `/model default` はセッション選択をクリアし、設定済みのプライマリを再び継承するようにします。
- ユーザーが選択した `/model` の参照は、そのセッションでは厳密に適用されます。到達不能になった場合、`agents.defaults.model.fallbacks` を通じて暗黙的にフォールバックするのではなく、返信は明示的に失敗します。設定済みのデフォルトと Cron ジョブのプライマリでは、引き続きフォールバックチェーンが使用されます。
- `/model status` は詳細ビューです。プロバイダーごとの認証候補と、設定されている場合はプロバイダーエンドポイントの `baseUrl` および `api` モードを表示します。
- モデル参照は最初の `/` で分割して解析されます。`provider/model` と入力します。モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）は、プロバイダーのプレフィックスを含めてください。例: `/model openrouter/moonshotai/kimi-k2`。プロバイダーを省略すると、OpenClaw は次の順に試行します。(1) エイリアス一致、(2) プレフィックスなしの正確なモデル ID に対する、設定済みプロバイダー内の一意の一致、(3) 設定済みのデフォルトプロバイダー（非推奨のフォールバック）。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合は、削除済みプロバイダーの古いデフォルトが表面化するのを避けるため、代わりに最初の設定済みプロバイダー/モデルを使用します。
- モデル参照は小文字に正規化されます。それ以外ではプロバイダー ID は完全一致するため、Plugin が公開している ID を使用してください。

コマンドの完全な動作と設定: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

サブコマンドなしの `openclaw models` は `models status` のショートカットです。認証ストアのプロファイルに関する OAuth の有効期限も表示します（デフォルトでは残り 24h 以内になると警告します）。すべてのフラグ、JSON 形式、認証プロファイルのサブコマンドについては、[モデル CLI リファレンス](/ja-JP/cli/models)を参照してください。

<AccordionGroup>
  <Accordion title="スキャン（OpenRouter の無料モデル）">
    `openclaw models scan` は OpenRouter の公開無料モデルカタログを調査し、ツールおよび画像サポートについて候補をライブで検証できます。カタログ自体は公開されているため、メタデータのみのスキャン（`--no-probe`）にはキーは不要です。ライブ検証と `--set-default`/`--set-image` には OpenRouter API キー（認証プロファイルまたは `OPENROUTER_API_KEY`）が必要で、キーがない場合はフェイルクローズでメタデータのみを出力します。

    結果は、画像サポート、ツールのレイテンシ、コンテキストサイズ、パラメーター数の順でランク付けされます。TTY では、検証済みの結果に対して対話式のフォールバック選択が表示されます。非対話モードでデフォルトを受け入れるには `--yes` が必要です。

  </Accordion>
</AccordionGroup>

## モデルレジストリ（`models.json`）

`models.providers` で設定したカスタムプロバイダーは、エージェントディレクトリ内の `models.json`（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）に書き込まれます。プロバイダー Plugin のカタログは、生成された Plugin 所有の個別カタログとして別に保存され、自動的に読み込まれます。このファイルはデフォルトで設定とマージされます。設定したプロバイダーのみを使用するには、`models.mode: "replace"` を設定します。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するプロバイダー ID について:

    - エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - `models.json` の空でない `apiKey` は、そのプロバイダーが現在の設定/認証プロファイルのコンテキストで SecretRef によって管理されていない場合にのみ優先されます。
    - SecretRef によって管理される `apiKey` 値は、解決済みのシークレットを永続化する代わりに、ソースマーカーから更新されます。env 参照では環境変数名、file/exec 参照では `secretref-managed` を使用します。
    - SecretRef によって管理されるヘッダー値も同様に更新され、env 参照には `secretref-env:ENV_VAR_NAME` を使用します。
    - `models.json` 内の空または欠落している `apiKey`/`baseUrl` は、設定の `models.providers` にフォールバックします。
    - その他のプロバイダーフィールドは、設定および正規化済みカタログデータから更新されます。

  </Accordion>
</AccordionGroup>

マーカーの永続化ではソースが正として扱われます。OpenClaw が `models.json` を再生成するたびに（`openclaw agent` のようなコマンド駆動の経路を含む）、解決済みのランタイムシークレット値ではなく、アクティブなソース設定のスナップショット（解決前）からマーカーを書き込みます。

## 関連項目

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes) — OpenClaw、Codex、およびその他のエージェントループランタイム
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [画像生成](/ja-JP/tools/image-generation) — 画像モデルの設定
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [モデルプロバイダー](/ja-JP/concepts/model-providers) — プロバイダーのルーティングと認証
- [モデル CLI リファレンス](/ja-JP/cli/models) — コマンドとフラグの完全なリファレンス
- [音楽生成](/ja-JP/tools/music-generation) — 音楽モデルの設定
- [動画生成](/ja-JP/tools/video-generation) — 動画モデルの設定
