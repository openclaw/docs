---
read_when:
    - モデルのフォールバック動作または選択 UX の変更
    - 「model is not allowed」または古いデフォルトプロバイダーへのフォールバックをデバッグする
    - models.json のマージ/シークレット動作に取り組んでいます
sidebarTitle: Models CLI
summary: OpenClaw がプロバイダー/モデル参照、設定キー、`/model` チャットコマンドを解決する方法
title: Models CLI
x-i18n:
    generated_at: "2026-07-05T11:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ec0558d7b4b97954b0be20e1d17bbc4e1e80695b8ca16db29fcabcbc07a3850
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="モデルフェイルオーバー" href="/ja-JP/concepts/model-failover">
    認証プロファイルのローテーション、クールダウン、それらがフォールバックとどう相互作用するか。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers">
    プロバイダーの簡単な概要と例。
  </Card>
  <Card title="モデル CLI リファレンス" href="/ja-JP/cli/models">
    完全な `openclaw models` コマンドとフラグのリファレンス。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults">
    モデル設定キー、デフォルト、例。
  </Card>
</CardGroup>

モデル参照 (`provider/model`) はプロバイダーとモデルを選択します。通常、低レベルのエージェントランタイムは選択しません。主な例外は OpenAI です。公式 OpenAI プロバイダーでは、`openai/gpt-5.5` はデフォルトで Codex app-server ランタイムを通じて実行されます。サブスクリプション Copilot 参照 (`github-copilot/*`) は外部の GitHub Copilot エージェントランタイム Plugin にオプトインできますが、その経路は常に明示的です (`auto` で選択されることはありません)。ランタイム上書きは、エージェント全体やセッションではなく、プロバイダー/モデルポリシーに属します。Codex ランタイムモードでは、`openai/gpt-*` は API キー課金を意味しません。認証は Codex アカウントまたは `openai` OAuth プロファイルから取得できます。[エージェントランタイム](/ja-JP/concepts/agent-runtimes) と [GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot) を参照してください。

## 選択順序

<Steps>
  <Step title="プライマリモデル">
    `agents.defaults.model.primary` (またはプレーン文字列としての `agents.defaults.model`)。
  </Step>
  <Step title="フォールバック">
    `agents.defaults.model.fallbacks`。順番に試行されます。
  </Step>
  <Step title="認証フェイルオーバー">
    認証プロファイルのローテーションは、OpenClaw が次のフォールバックモデルへ移る前にプロバイダー内で行われます。
  </Step>
</Steps>

関連するモデル設定サーフェス:

- `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト/カタログとエイリアスです。各モデルを列挙せずに、プロバイダーから検出されたすべてのモデルを許可するには `provider/*` エントリを使用します。
- `agents.defaults.utilityModel` は、生成されるダッシュボードセッションタイトルや、対応チャンネルのスレッド/トピックタイトルなど、短い内部タスク用の任意の低コストモデルです。エージェントごとの `agents.list[].utilityModel` はこれを上書きします。未設定の場合、これらのタスクはエージェントのプライマリモデルを使用します。ユーティリティタスクは個別のモデル呼び出しであり、選択されたモデルプロバイダーに限定されたタスク内容を送信する場合があります。
- `agents.defaults.imageModel` は、プライマリモデルが画像を受け付けられない場合にのみ使用されます。
- `agents.defaults.pdfModel` は `pdf` ツールで使用されます。未設定の場合、ツールは `imageModel`、次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel`、`videoGenerationModel` は共有メディア生成ツールを支えます。未設定の場合、各ツールは認証に裏付けられたプロバイダーデフォルトを推論します。現在のデフォルトプロバイダーを最初に使い、次にその機能に登録されている残りのプロバイダーをプロバイダー ID 順に使います。明示的なフォールバックを維持しつつ、そのプロバイダー横断の推論を無効化するには `agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
- エージェントごとの `agents.list[].model` (およびバインディング) は `agents.defaults.model` を上書きします。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) を参照してください。

完全なキーリファレンス、デフォルト、JSON5 例: [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults)。

## 選択元とフォールバックの厳格さ

同じ `provider/model` でも、どこから来たかによって動作が異なります。

| ソース                                                                  | 動作                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定済みデフォルト (`agents.defaults.model.primary`、エージェントごとのプライマリ) | 通常の開始点です。`agents.defaults.model.fallbacks` を使用します。                                                                                                                                                                                                 |
| 自動フォールバック                                                           | 一時的な復旧状態で、`modelOverrideSource: "auto"` として保存されます。OpenClaw は元のプライマリを定期的に再プローブし、復旧時に自動選択をクリアし、フォールバック/復旧の遷移を状態変更ごとに 1 回通知します。                              |
| ユーザーのセッション選択                                                  | 厳密かつ完全一致です。`/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を保存します。そのプロバイダー/モデルに到達できなくなると、別の設定済みモデルへ移るのではなく、実行は目に見える形で失敗します。 |
| Cron `--model` / ペイロード `model`                                        | ジョブごとのプライマリです。ジョブが独自のペイロード `fallbacks` を指定しない限り、設定済みフォールバックを引き続き使用します (`fallbacks: []` は厳格な実行を強制します)。                                                                                                                    |

その他の選択ルール:

- `agents.defaults.model.primary` を変更しても、既存のセッションピンは書き換えられません。ステータスが `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` を報告する場合は、`/model default` を実行してピンをクリアします。
- CLI のデフォルトモデルと許可リストのピッカーは、完全な組み込みカタログではなく `models.providers.*.models` のみを一覧することで `models.mode: "replace"` を尊重します。
- Control UI のモデルピッカーは、設定済みモデルビューを Gateway に問い合わせます。`agents.defaults.models` が設定されている場合はそれ ( `provider/*` ワイルドカードエントリを含む) を使用し、そうでない場合は `models.providers.*.models` と利用可能な認証を持つプロバイダーを使用します。完全な組み込みカタログは、明示的な参照ビュー (`view: "all"` の `models.list`、または `openclaw models list --all`) 用に予約されています。

完全な仕組み: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)。

## 簡易モデルポリシー

- プライマリは、利用可能な最も強力な最新世代モデルに設定します。
- コスト/レイテンシーに敏感なタスクや低リスクのチャットにはフォールバックを使用します。
- ツール有効のエージェントや信頼できない入力では、古い/弱いモデル階層を避けます。

## オンボーディング

```bash
openclaw onboard
```

OpenAI Codex サブスクリプション OAuth や Anthropic (API キーまたは Claude CLI の再利用) を含む一般的なプロバイダーについて、設定を手編集せずにモデルと認証をセットアップします。

## 「Model is not allowed」(および返信が止まる理由)

`agents.defaults.models` が設定されている場合、それは `/model` とセッション上書きの許可リストになります。その許可リスト外のモデルを選択すると、通常の返信が生成される前に次が返されます。

```text
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

修正するには、モデルを `agents.defaults.models` に追加するか、許可リストを完全にクリアする (キーを削除する) か、`/model list` からモデルを選択します。拒否されたコマンドに `/model openai/gpt-5.5 --runtime codex` のようなランタイム上書きが含まれていた場合は、まず許可リストを修正し、その後で同じ `/model ... --runtime ...` コマンドを再試行します。

ローカル/GGUF モデルの場合、許可リストには完全なプロバイダー接頭辞付き参照が必要です。たとえば `ollama/gemma4:26b` や `lmstudio/Gemma4-26b-a4-it-gguf` です。正確な文字列は `openclaw models list --provider <provider>` で確認してください。許可リストが有効になると、裸のファイル名や表示名だけでは不十分です。

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

その後、`/model`、`/models`、モデルピッカーはそれらのプロバイダーについて検出されたカタログのみを表示し、新しいモデルは許可リストを編集せずに表示される場合があります。別のプロバイダーから特定のモデル 1 つを取り込むには、正確な `provider/model` エントリと `provider/*` エントリを組み合わせます。

エイリアス付き許可リストの例:

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

<Accordion title="CLI からの安全な許可リスト編集">
追加変更には `--merge` を使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、既存エントリを削除してしまう場合、`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` へのプレーンオブジェクト割り当てを拒否します。新しい値が完全な対象値になるべき場合にのみ `--replace` を使用してください。対話型プロバイダーセットアップと `openclaw configure --section model` は、プロバイダースコープの選択をすでに許可リストへマージするため、プロバイダーを追加しても無関係なエントリは削除されません。configure は既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` のような明示的コマンドは、引き続きプライマリを置き換えます。
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

- `/model` と `/model list` は、コンパクトな番号付きピッカー (モデルファミリー + 利用可能なプロバイダー) を表示します。`/model <#>` はそこから選択します。Discord では、これは Submit ステップ付きのプロバイダー/モデルドロップダウンを開きます。Telegram では、ピッカー選択はセッションスコープであり、`openclaw.json` 内のエージェントの永続的なデフォルトを書き換えることはありません。`/models add` は非推奨であり、チャットからモデルを登録する代わりにメッセージを返します。
- `/model` は新しいセッション選択を即座に永続化します。エージェントがアイドル状態なら、次の実行ですぐに使用されます。実行がすでにアクティブな場合、切り替えは次のクリーンな再試行ポイント (またはツール活動や返信出力がすでに始まっている場合はさらに後) にキューされます。
- `/model default` はセッション選択をクリアし、設定済みプライマリを再び継承するようにします。
- ユーザーが選択した `/model` 参照は、そのセッションに対して厳格です。到達できなくなった場合、`agents.defaults.model.fallbacks` を通じて暗黙にフォールバックするのではなく、返信は目に見える形で失敗します。設定済みデフォルトと cron ジョブのプライマリは、引き続きフォールバックチェーンを使用します。
- `/model status` は詳細ビューです。プロバイダーごとの認証候補と、設定されている場合はプロバイダーエンドポイントの `baseUrl` と `api` モードを表示します。
- モデル参照は最初の `/` で分割して解析されます。`provider/model` と入力します。モデル ID 自体に `/` が含まれる場合 (OpenRouter 形式など) は、プロバイダー接頭辞を含めます。例: `/model openrouter/moonshotai/kimi-k2`。プロバイダーを省略すると、OpenClaw は次を試行します: (1) エイリアス一致、(2) その正確な接頭辞なしモデル ID に対する一意の設定済みプロバイダー一致、(3) 設定済みデフォルトプロバイダー (非推奨フォールバック)。そのプロバイダーが設定済みデフォルトモデルを公開しなくなっている場合は、削除済みプロバイダーデフォルトを表示しないように、代わりに最初の設定済みプロバイダー/モデルを使用します。
- モデル参照は小文字に正規化されます。プロバイダー ID はそれ以外では完全一致なので、Plugin が示す ID を使用してください。

完全なコマンド動作と設定: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

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

`openclaw models` は、サブコマンドなしの場合 `models status` のショートカットで、auth-store プロファイルの OAuth 有効期限も表示します（デフォルトでは 24 時間以内に警告）。完全なフラグ、JSON 形式、認証プロファイルのサブコマンド: [Models CLI リファレンス](/ja-JP/cli/models)。

<AccordionGroup>
  <Accordion title="スキャン（OpenRouter 無料モデル）">
    `openclaw models scan` は OpenRouter の公開無料モデルカタログを検査し、候補に対してツールと画像のサポートをライブでプローブできます。カタログ自体は公開されているため、メタデータのみのスキャン（`--no-probe`）にはキーは不要です。ライブプローブと `--set-default`/`--set-image` には OpenRouter API キー（認証プロファイルまたは `OPENROUTER_API_KEY`）が必要で、キーがない場合はフェイルクローズしてメタデータのみの出力になります。

    結果は、画像サポート、次にツールのレイテンシ、次にコンテキストサイズ、次にパラメーター数の順でランク付けされます。TTY では、プローブ済みの結果に対して対話式のフォールバック選択が表示されます。非対話モードではデフォルトを受け入れるために `--yes` が必要です。

  </Accordion>
</AccordionGroup>

## モデルレジストリ（`models.json`）

`models.providers` の下に設定されたカスタムプロバイダーは、エージェントディレクトリ配下の `models.json`（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）に書き込まれます。プロバイダー Plugin カタログは、生成された Plugin 所有のカタログシャードとして別に保存され、自動的に読み込まれます。このファイルはデフォルトで設定とマージされます。設定したプロバイダーのみを使うには `models.mode: "replace"` を設定します。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するプロバイダー ID について:

    - エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - `models.json` 内の空でない `apiKey` は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理ではない場合にのみ優先されます。
    - SecretRef 管理の `apiKey` 値は、解決済みシークレットを永続化する代わりにソースマーカーから更新されます。env 参照では env 変数名、file/exec 参照では `secretref-managed` です。
    - SecretRef 管理のヘッダー値も同じ方法で更新され、env 参照では `secretref-env:ENV_VAR_NAME` を使用します。
    - `models.json` 内の空または欠落した `apiKey`/`baseUrl` は、設定の `models.providers` にフォールバックします。
    - その他のプロバイダーフィールドは、設定と正規化されたカタログデータから更新されます。

  </Accordion>
</AccordionGroup>

マーカーの永続化はソースを正とします。OpenClaw は、`models.json` を再生成するたびに、解決済みのランタイムシークレット値ではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。これには `openclaw agent` のようなコマンド駆動のパスも含まれます。

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes) — OpenClaw、Codex、その他のエージェントループランタイム
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [画像生成](/ja-JP/tools/image-generation) — 画像モデル設定
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [モデルプロバイダー](/ja-JP/concepts/model-providers) — プロバイダーのルーティングと認証
- [Models CLI リファレンス](/ja-JP/cli/models) — 完全なコマンドとフラグのリファレンス
- [音楽生成](/ja-JP/tools/music-generation) — 音楽モデル設定
- [動画生成](/ja-JP/tools/video-generation) — 動画モデル設定
