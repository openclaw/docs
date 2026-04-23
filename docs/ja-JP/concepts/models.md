---
read_when:
    - Models CLIの追加または変更（`models list`/`set`/`scan`/`aliases`/`fallbacks`）
    - モデルのフォールバック動作または選択UXの変更
    - モデルスキャンプローブの更新（tools/images）
summary: 'Models CLI: list、set、エイリアス、フォールバック、scan、status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-23T14:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

authプロファイルのローテーション、クールダウン、それらがフォールバックとどう相互作用するかについては、[/concepts/model-failover](/ja-JP/concepts/model-failover) を参照してください。
プロバイダーの概要と例については、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。

## モデル選択の仕組み

OpenClawは次の順序でモデルを選択します:

1. **Primary** モデル（`agents.defaults.model.primary` または `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 内の**フォールバック**（順番どおり）。
3. **プロバイダー認証フェイルオーバー** は、次のモデルへ移る前に同一プロバイダー内で発生します。

関連:

- `agents.defaults.models` は、OpenClawが使用できるモデルの許可リスト/カタログです（エイリアスも含む）。
- `agents.defaults.imageModel` は、Primaryモデルが画像を受け付けられない**場合にのみ**使用されます。
- `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略された場合、このツールは `agents.defaults.imageModel`、次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel` は共有画像生成機能で使用されます。省略されていても、`image_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み画像生成プロバイダーをプロバイダーid順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- `agents.defaults.musicGenerationModel` は共有音楽生成機能で使用されます。省略されていても、`music_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み音楽生成プロバイダーをプロバイダーid順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- `agents.defaults.videoGenerationModel` は共有動画生成機能で使用されます。省略されていても、`video_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み動画生成プロバイダーをプロバイダーid順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- エージェントごとのデフォルトは、`agents.list[].model` とバインディングで `agents.defaults.model` を上書きできます（[/concepts/multi-agent](/ja-JP/concepts/multi-agent) を参照）。

## クイックモデルポリシー

- 利用可能な範囲で、最新世代の最も強力なモデルをPrimaryに設定してください。
- コスト/レイテンシ重視のタスクや、重要度の低いチャットにはフォールバックを使ってください。
- ツール有効化エージェントや信頼できない入力に対しては、古い/弱いモデル層は避けてください。

## オンボーディング（推奨）

configを手で編集したくない場合は、オンボーディングを実行してください:

```bash
openclaw onboard
```

一般的なプロバイダー向けにモデル + 認証を設定できます。これには **OpenAI Code (Codex)
subscription**（OAuth）および **Anthropic**（APIキーまたはClaude CLI）が含まれます。

## configキー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメータ）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

モデル参照は小文字へ正規化されます。`z.ai/*` のようなプロバイダーエイリアスは
`zai/*` に正規化されます。

OpenCodeを含むプロバイダー設定例は
[/providers/opencode](/ja-JP/providers/opencode) にあります。

### 安全な許可リスト編集

`agents.defaults.models` を手で更新する場合は、加算的な書き込みを使用してください:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、モデル/プロバイダーマップの誤った上書きを防ぎます。`agents.defaults.models`、`models.providers`、または
`models.providers.<id>.models` への通常のオブジェクト代入で既存エントリが削除される場合、その操作は拒否されます。加算的変更には `--merge` を使用し、指定した値を完全な対象値にしたい場合にのみ `--replace` を使用してください。

対話型プロバイダー設定と `openclaw configure --section model` も、
プロバイダースコープの選択を既存の許可リストへマージするため、Codex、
Ollama、または別のプロバイダーを追加しても、無関係なモデルエントリは削除されません。

## 「Model is not allowed」（そして応答が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` と
セッション上書きに対する**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、
OpenClawは次を返します:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の返信が生成される**前**に発生するため、
メッセージに「応答しなかった」ように感じられることがあります。修正方法は次のいずれかです:

- モデルを `agents.defaults.models` に追加する
- 許可リストをクリアする（`agents.defaults.models` を削除する）
- `/model list` からモデルを選ぶ

許可リストconfigの例:

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

再起動せずに現在のセッションのモデルを切り替えられます:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注意:

- `/model`（および `/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能プロバイダー）。
- Discordでは、`/model` と `/models` は、プロバイダーとモデルのドロップダウン、およびSubmitステップを備えた対話型ピッカーを開きます。
- `/models add` はデフォルトで利用可能で、`commands.modelsWrite=false` で無効化できます。
- 有効な場合、`/models add <provider> <modelId>` が最速ルートです。プレーンな `/models add` は、サポートされている環境ではプロバイダー優先のガイド付きフローを開始します。
- `/models add` の後、新しいモデルはGateway再起動なしで `/models` と `/model` から利用可能になります。
- `/model <#>` はそのピッカーから選択します。
- `/model` は新しいセッション選択を即座に永続化します。
- エージェントがアイドルなら、次回実行で新しいモデルがすぐ使われます。
- 実行がすでに進行中なら、OpenClawはライブ切り替えを保留としてマークし、クリーンなリトライポイントでのみ新しいモデルに切り替えて再開します。
- ツール実行や返信出力がすでに始まっている場合、この保留切り替えは、後のリトライ機会または次のユーザーターンまでキューに残ることがあります。
- `/model status` は詳細表示です（認証候補、および設定されている場合はプロバイダーエンドポイント `baseUrl` + `api` モード）。
- モデル参照は**最初の** `/` で分割して解析されます。`/model <ref>` を入力する場合は `provider/model` を使用してください。
- モデルID自体に `/` が含まれる場合（OpenRouter形式）、プロバイダー接頭辞を含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClawは次の順序で入力を解決します:
  1. エイリアス一致
  2. その正確な接頭辞なしモデルidに対する一意な設定済みプロバイダー一致
  3. 非推奨の、設定済みデフォルトプロバイダーへのフォールバック
     そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、
     OpenClawは古い削除済みプロバイダーデフォルトを表示しないよう、
     代わりに最初の設定済みプロバイダー/モデルへフォールバックします。

完全なコマンド動作/config: [Slash commands](/ja-JP/tools/slash-commands)。

例:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLIコマンド

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
- `--provider <id>`: `moonshot` のようなプロバイダーidでフィルタします。対話型ピッカーの表示ラベルは受け付けません
- `--plain`: 1行に1モデル
- `--json`: 機械可読出力

`--all` には、認証がまだ設定されていなくてもバンドル済みのプロバイダー所有静的カタログ行が含まれるため、検出専用ビューで、一致するプロバイダー認証情報を追加するまで利用不可なモデルも表示できます。

### `models status`

解決済みのPrimaryモデル、フォールバック、image model、および
設定済みプロバイダーの認証概要を表示します。また、auth storeで見つかったプロファイルの
OAuth有効期限ステータスも表示します（デフォルトでは24時間以内に警告）。`--plain` は解決済みの
Primaryモデルのみを出力します。
OAuthステータスは常に表示され（`--json` 出力にも含まれます）、設定済み
プロバイダーに認証情報がない場合、`models status` は **Missing auth** セクションを出力します。
JSONには `auth.oauth`（警告ウィンドウ + プロファイル）および `auth.providers`
（env由来認証情報を含む、プロバイダーごとの有効認証）が含まれます。`auth.oauth`
はauth-store内のプロファイル健全性のみです。envのみのプロバイダーはそこには表示されません。
自動化には `--check` を使用してください（不足/期限切れで終了コード `1`、期限切れ間近で `2`）。
ライブ認証チェックには `--probe` を使用してください。プローブ行はauthプロファイル、env
認証情報、または `models.json` から取得されることがあります。
明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、
プローブはそれを試す代わりに `excluded_by_auth_order` を報告します。認証が存在しても
そのプロバイダー向けにプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。

認証の選択はプロバイダー/アカウント依存です。常時稼働のGatewayホストでは、API
キーが通常もっとも予測しやすい選択肢です。Claude CLIの再利用や既存のAnthropic
OAuth/トークンプロファイルもサポートされています。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter無料モデル）

`openclaw models scan` はOpenRouterの**無料モデルカタログ**を調べ、
必要に応じてツール対応と画像対応をモデルへプローブできます。

主要フラグ:

- `--no-probe`: ライブプローブをスキップ（メタデータのみ）
- `--min-params <b>`: 最小パラメータサイズ（十億単位）
- `--max-age-days <days>`: 古いモデルをスキップ
- `--provider <name>`: プロバイダー接頭辞フィルタ
- `--max-candidates <n>`: フォールバックリストサイズ
- `--set-default`: `agents.defaults.model.primary` を最初の選択に設定
- `--set-image`: `agents.defaults.imageModel.primary` を最初の画像選択に設定

プローブにはOpenRouter APIキー（authプロファイルまたは
`OPENROUTER_API_KEY` から）が必要です。キーがない場合は、候補だけを一覧表示するために `--no-probe` を使用してください。

スキャン結果は次の順でランク付けされます:

1. 画像対応
2. ツールレイテンシ
3. コンテキストサイズ
4. パラメータ数

入力

- OpenRouter `/models` リスト（`:free` でフィルタ）
- authプロファイルまたは `OPENROUTER_API_KEY` からのOpenRouter APIキーが必要です（[/environment](/ja-JP/help/environment) を参照）
- 任意のフィルタ: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- プローブ制御: `--timeout`, `--concurrency`

TTYで実行した場合、フォールバックを対話的に選択できます。非対話
モードでは、デフォルトを受け入れるために `--yes` を渡してください。

## Modelsレジストリ（`models.json`）

`models.providers` 内のカスタムプロバイダーは、エージェントディレクトリ配下の
`models.json` に書き込まれます（デフォルト `~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは
`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

一致するプロバイダーIDに対するマージモードの優先順位:

- エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
- エージェントの `models.json` にある空でない `apiKey` は、そのプロバイダーが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
- SecretRef管理されたプロバイダーの `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env参照では `ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
- SecretRef管理されたプロバイダーヘッダー値は、ソースマーカー（env参照では `secretref-env:ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
- 空または欠落しているエージェントの `apiKey`/`baseUrl` は、configの `models.providers` にフォールバックします。
- その他のプロバイダーフィールドは、configおよび正規化済みカタログデータから更新されます。

マーカーの永続化はソース権威型です。OpenClawは、解決済みランタイムシークレット値からではなく、アクティブなソースconfigスナップショット（解決前）からマーカーを書き込みます。
これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClawが `models.json` を再生成するたびに適用されます。

## 関連

- [Model Providers](/ja-JP/concepts/model-providers) — プロバイダールーティングと認証
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [Image Generation](/ja-JP/tools/image-generation) — 画像モデル設定
- [Music Generation](/ja-JP/tools/music-generation) — 音楽モデル設定
- [Video Generation](/ja-JP/tools/video-generation) — 動画モデル設定
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデルconfigキー
