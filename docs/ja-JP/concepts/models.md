---
read_when:
    - models CLI の追加または変更（models list/set/scan/aliases/fallbacks）
    - モデルのフォールバック動作または選択 UX の変更
    - モデルスキャンの probe（tools/images）を更新する
summary: 'Models CLI: 一覧、設定、エイリアス、フォールバック、スキャン、ステータス'
title: Models CLI
x-i18n:
    generated_at: "2026-04-24T04:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

[/concepts/model-failover](/ja-JP/concepts/model-failover) では、認証プロファイルのローテーション、クールダウン、およびそれらがフォールバックとどう相互作用するかを説明しています。
プロバイダーの概要と例については、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。

## モデル選択の仕組み

OpenClaw は次の順序でモデルを選択します。

1. **Primary** モデル（`agents.defaults.model.primary` または `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 内の**フォールバック**（順番どおり）。
3. **プロバイダー認証フェイルオーバー**は、次のモデルに移る前にプロバイダー内部で発生します。

関連:

- `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト/カタログです（エイリアスを含む）。
- `agents.defaults.imageModel` は、primary モデルが画像を受け付けられない**場合にのみ**使用されます。
- `agents.defaults.pdfModel` は `pdf` tool で使用されます。省略した場合、この tool は `agents.defaults.imageModel`、次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel` は、共通の画像生成機能サーフェスで使用されます。省略した場合でも、`image_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーを provider-id 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API key も設定してください。
- `agents.defaults.musicGenerationModel` は、共通の音楽生成機能サーフェスで使用されます。省略した場合でも、`music_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーを provider-id 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API key も設定してください。
- `agents.defaults.videoGenerationModel` は、共通の動画生成機能サーフェスで使用されます。省略した場合でも、`video_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーを provider-id 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API key も設定してください。
- エージェントごとのデフォルトは、`agents.list[].model` と binding により `agents.defaults.model` を上書きできます（[/concepts/multi-agent](/ja-JP/concepts/multi-agent) を参照）。

## クイックモデルポリシー

- primary には、利用可能な中で最も強力な最新世代モデルを設定してください。
- コスト/レイテンシ重視のタスクや、重要度の低いチャットにはフォールバックを使ってください。
- tool 対応エージェントや信頼できない入力では、古い/弱いモデル階層は避けてください。

## オンボーディング（推奨）

config を手で編集したくない場合は、オンボーディングを実行してください。

```bash
openclaw onboard
```

これにより、**OpenAI Code (Codex) subscription**（OAuth）や **Anthropic**（API key または Claude CLI）を含む一般的なプロバイダーのモデル + 認証を設定できます。

## Config キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

モデル ref は小文字に正規化されます。`z.ai/*` のようなプロバイダーエイリアスは `zai/*` に正規化されます。

プロバイダー設定例（OpenCode を含む）は
[/providers/opencode](/ja-JP/providers/opencode) にあります。

### 安全な allowlist 編集

`agents.defaults.models` を手で更新する場合は、加算的な書き込みを使ってください。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、モデル/プロバイダーマップが意図せず上書きされることを防ぎます。
`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` への通常のオブジェクト代入は、既存のエントリーを削除してしまう場合は拒否されます。加算的変更には `--merge` を使い、指定した値を完全なターゲット値にしたい場合にのみ `--replace` を使ってください。

対話型のプロバイダーセットアップと `openclaw configure --section model` でも、プロバイダー単位の選択を既存の allowlist にマージします。そのため、Codex、Ollama、または別のプロバイダーを追加しても、無関係なモデルエントリーは削除されません。

## 「Model is not allowed」（そしてなぜ返信が止まるのか）

`agents.defaults.models` が設定されている場合、それは `/model` と
セッション上書きの**allowlist**になります。ユーザーがその allowlist にないモデルを選ぶと、
OpenClaw は次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の返信が生成される**前**に発生するため、「応答しなかった」ように感じることがあります。修正方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加する
- allowlist をクリアする（`agents.defaults.models` を削除する）
- `/model list` からモデルを選ぶ

allowlist config の例:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## チャット内でモデルを切り替える（`/model`）

再起動せずに、現在のセッションのモデルを切り替えられます。

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注:

- `/model`（および `/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なプロバイダー）。
- Discord では、`/model` と `/models` はプロバイダーとモデルのドロップダウン、および Submit ステップを持つ対話型ピッカーを開きます。
- `/models add` はデフォルトで利用可能で、`commands.modelsWrite=false` で無効にできます。
- 有効な場合、`/models add <provider> <modelId>` が最速の経路です。単独の `/models add` は、サポートされている場合にプロバイダー優先のガイド付きフローを開始します。
- `/models add` の後、新しいモデルは gateway を再起動せずに `/models` と `/model` で利用可能になります。
- `/model <#>` はそのピッカーから選択します。
- `/model` は新しいセッション選択を即座に永続化します。
- エージェントがアイドル状態なら、次の実行ですぐ新しいモデルが使われます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを pending としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
- すでに tool アクティビティや返信出力が始まっている場合、pending 切り替えは後の再試行機会、または次のユーザーターンまでキューされたままになることがあります。
- `/model status` は詳細ビューです（認証候補、および設定されている場合はプロバイダーエンドポイント `baseUrl` + `api` mode）。
- モデル ref は**最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使ってください。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は次の順序で入力を解決します:
  1. エイリアス一致
  2. その完全なプレフィックスなしモデル id に対する、一意な configured-provider 一致
  3. 設定済みデフォルトプロバイダーへの非推奨フォールバック
     そのプロバイダーがもはや設定済みデフォルトモデルを公開していない場合、OpenClaw は stale な削除済みプロバイダーデフォルトを表に出さないよう、代わりに最初の configured provider/model にフォールバックします。

完全なコマンド動作/config: [Slash commands](/ja-JP/tools/slash-commands)。

例:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLI コマンド

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（サブコマンドなし）は `models status` のショートカットです。

### `models list`

デフォルトでは設定済みモデルを表示します。便利なフラグ:

- `--all`: 完全なカタログ
- `--local`: ローカルプロバイダーのみ
- `--provider <id>`: プロバイダー id で絞り込み。たとえば `moonshot`。対話型ピッカーの表示ラベルは受け付けません
- `--plain`: 1 行に 1 モデル
- `--json`: 機械可読出力

`--all` には、認証設定前でも同梱のプロバイダー所有 static catalog 行が含まれるため、発見専用ビューで、対応するプロバイダー認証を追加するまで利用できないモデルも表示できます。

### `models status`

解決済みの primary モデル、フォールバック、image モデル、および設定済みプロバイダーの認証概要を表示します。また、auth store にあるプロファイルの OAuth 有効期限状態も表示します（デフォルトでは 24 時間以内に警告）。`--plain` は解決済みの primary モデルだけを表示します。
OAuth status は常に表示され（`--json` 出力にも含まれます）。設定済みプロバイダーに認証情報がない場合、`models status` は **Missing auth** セクションを表示します。
JSON には `auth.oauth`（警告ウィンドウ + プロファイル）と `auth.providers`
（env ベース認証情報を含む、プロバイダーごとの有効な認証）が含まれます。`auth.oauth`
は auth-store のプロファイルヘルスのみであり、env のみのプロバイダーはそこには表示されません。
自動化には `--check` を使用してください（不足/期限切れで終了コード `1`、期限切れ間近で `2`）。
ライブ認証チェックには `--probe` を使用してください。probe 行は auth profile、env
認証情報、または `models.json` から来ることがあります。
明示的な `auth.order.<provider>` が保存済みプロファイルを除外している場合、probe はそれを試さずに `excluded_by_auth_order` を報告します。認証は存在するが、そのプロバイダー向けに probe 可能なモデルを解決できない場合、probe は `status: no_model` を報告します。

認証の選択はプロバイダー/アカウント依存です。常時稼働の gateway ホストでは、通常 API keys が最も予測しやすい方法です。Claude CLI の再利用や既存の Anthropic OAuth/token profile もサポートされています。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter の無料モデル）

`openclaw models scan` は OpenRouter の**無料モデルカタログ**を調べ、必要に応じて tool と画像サポートをモデルに対して probe できます。

主なフラグ:

- `--no-probe`: ライブ probe をスキップする（メタデータのみ）
- `--min-params <b>`: 最小パラメーターサイズ（10億単位）
- `--max-age-days <days>`: 古いモデルをスキップする
- `--provider <name>`: プロバイダープレフィックスフィルター
- `--max-candidates <n>`: フォールバックリストサイズ
- `--set-default`: `agents.defaults.model.primary` を最初の選択に設定する
- `--set-image`: `agents.defaults.imageModel.primary` を最初の画像選択に設定する

probe には OpenRouter API key（auth profile または
`OPENROUTER_API_KEY` から）が必要です。key がない場合は、候補一覧のみを表示するために `--no-probe` を使ってください。

スキャン結果は次の順でランク付けされます。

1. 画像サポート
2. tool レイテンシ
3. コンテキストサイズ
4. パラメーター数

入力

- OpenRouter `/models` 一覧（`:free` をフィルター）
- auth profile または `OPENROUTER_API_KEY` からの OpenRouter API key が必要（[/environment](/ja-JP/help/environment) を参照）
- 任意のフィルター: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- probe 制御: `--timeout`, `--concurrency`

TTY で実行すると、対話的にフォールバックを選択できます。非対話モードでは、デフォルトを受け入れるために `--yes` を渡してください。

## Models レジストリ（`models.json`）

`models.providers` 内のカスタムプロバイダーは、agent ディレクトリ配下の `models.json` に書き込まれます（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは、`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

一致するプロバイダー ID に対するマージモードの優先順位:

- エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
- エージェントの `models.json` にある空でない `apiKey` は、そのプロバイダーが現在の config/auth-profile コンテキストで SecretRef 管理されていない場合にのみ優先されます。
- SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env ref では `ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
- SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー（env ref では `secretref-env:ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
- 空または欠落しているエージェント `apiKey`/`baseUrl` は、config の `models.providers` にフォールバックします。
- その他のプロバイダーフィールドは、config と正規化済みカタログデータから更新されます。

マーカーの永続化はソース権威型です。OpenClaw は、解決済みランタイムシークレット値からではなく、アクティブなソース config スナップショット（解決前）からマーカーを書き込みます。
これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClaw が `models.json` を再生成するときは常に適用されます。

## 関連

- [Model Providers](/ja-JP/concepts/model-providers) — プロバイダールーティングと認証
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [Image Generation](/ja-JP/tools/image-generation) — 画像モデル設定
- [Music Generation](/ja-JP/tools/music-generation) — 音楽モデル設定
- [Video Generation](/ja-JP/tools/video-generation) — 動画モデル設定
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
