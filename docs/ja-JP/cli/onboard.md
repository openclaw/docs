---
read_when:
    - Gateway、ワークスペース、認証、チャンネル、Skills のガイド付きセットアップを行いたい場合
summary: '`openclaw onboard` の CLI リファレンス（インタラクティブなオンボーディング）'
title: オンボード
x-i18n:
    generated_at: "2026-05-10T19:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

ローカルまたはリモート Gateway セットアップのための完全なガイド付きオンボーディング。OpenClaw にモデル認証、ワークスペース、Gateway、チャネル、Skills、ヘルスを1つのフローで案内させたい場合に使用します。

## 関連ガイド

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    インタラクティブな CLI フローのウォークスルー。
  </Card>
  <Card title="オンボーディング概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の構成。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部構造、ステップごとの動作。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非インタラクティブフラグとスクリプト化されたセットアップ。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフロー。
  </Card>
</CardGroup>

## 例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` は Hermes などの Plugin が所有する移行プロバイダーを使用します。これは新規の OpenClaw セットアップに対してのみ実行されます。既存の設定、認証情報、セッション、またはワークスペースのメモリ/ID ファイルが存在する場合は、インポート前にリセットするか新規セットアップを選択してください。

`--modern` は Crestodian の対話型オンボーディングプレビューを開始します。
`--modern` なしの場合、`openclaw onboard` は従来のオンボーディングフローを維持します。

平文のプライベートネットワーク `ws://` ターゲット（信頼済みネットワークのみ）では、オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。
このクライアント側トランスポートの緊急回避策に対応する `openclaw.json` 設定はありません。

非インタラクティブなカスタムプロバイダー:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` は非インタラクティブモードでは任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。
OpenClaw は一般的なビジョンモデル ID を画像対応として自動的にマークします。不明なカスタムビジョン ID には `--custom-image-input` を渡し、テキスト専用メタデータを強制するには `--custom-text-input` を渡します。

LM Studio は非インタラクティブモードでプロバイダー固有のキーフラグにも対応しています。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非インタラクティブ Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` などのクラウドモデル ID もここで使用できます。

プロバイダーキーを平文ではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を指定すると、オンボーディングは平文のキー値ではなく環境変数ベースの参照を書き込みます。
認証プロファイルに基づくプロバイダーでは `keyRef` エントリを書き込みます。カスタムプロバイダーでは `models.providers.<id>.apiKey` を環境変数参照として書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非インタラクティブ `ref` モードの契約:

- オンボーディングプロセス環境にプロバイダーの環境変数を設定します（例: `OPENAI_API_KEY`）。
- その環境変数も設定されていない限り、インラインキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必須の環境変数なしでインラインキーフラグを渡すと、オンボーディングはガイダンス付きで即座に失敗します。

非インタラクティブモードの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境変数 SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境に空でない環境変数が必要です。
- `--install-daemon` とともに使用する場合、トークン認証にトークンが必要なときは、SecretRef 管理の Gateway トークンは検証されますが、解決済みの平文としてスーパーバイザーサービス環境メタデータに永続化されません。
- `--install-daemon` とともに使用する場合、トークンモードにトークンが必要で、設定済みのトークン SecretRef が解決できない場合、オンボーディングは修復ガイダンス付きで閉じた状態で失敗します。
- `--install-daemon` とともに使用する場合、`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、オンボーディングはモードが明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後続の設定ファイルに `gateway.mode` がない場合は、有効なローカルモードのショートカットではなく、設定の破損または不完全な手動編集として扱ってください。
- ローカルオンボーディングは、選択したセットアップパスで必要な場合に、選択されたダウンロード可能な Plugin をインストールします。
- リモートオンボーディングはリモート Gateway の接続情報のみを書き込み、ローカルの Plugin パッケージはインストールしません。
- `--allow-unconfigured` は別個の Gateway ランタイム緊急回避策です。オンボーディングが `gateway.mode` を省略してよいという意味ではありません。

例:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非インタラクティブなローカル Gateway ヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を待ってから正常終了します。
- `--install-daemon` は管理対象 Gateway のインストールパスを先に開始します。指定しない場合は、たとえば `openclaw gateway run` などでローカル Gateway がすでに実行されている必要があります。
- 自動化で設定/ワークスペース/ブートストラップの書き込みだけを行いたい場合は、`--skip-health` を使用します。
- ワークスペースファイルを自分で管理する場合は、`--skip-bootstrap` を渡して `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` は最初に Scheduled Tasks を試し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーのログイン項目にフォールバックします。

参照モードでのインタラクティブオンボーディング動作:

- プロンプトが表示されたら **シークレット参照を使用** を選択します。
- 次に次のいずれかを選択します。
  - 環境変数
  - 設定済みシークレットプロバイダー（`file` または `exec`）
- オンボーディングは参照を保存する前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

### 非インタラクティブ Z.AI エンドポイントの選択

<Note>
`--auth-choice zai-api-key` はキーに最適な Z.AI エンドポイントを自動検出します（`zai/glm-5.1` を使用する汎用 API を優先）。GLM Coding Plan エンドポイントを特に使用したい場合は、`zai-coding-global` または `zai-coding-cn` を選択してください。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非インタラクティブ Mistral の例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## フローの注記

<AccordionGroup>
  <Accordion title="フロータイプ">
    - `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
    - `manual`: ポート、バインド、認証に関する完全なプロンプト（`advanced` のエイリアス）。
    - `import`: 検出された移行プロバイダーを実行し、計画をプレビューしてから、確認後に適用します。

  </Accordion>
  <Accordion title="プロバイダーの事前フィルタリング">
    認証選択が優先プロバイダーを示す場合、オンボーディングはデフォルトモデルと許可リストのピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と BytePlus では、これはコーディングプランのバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。

    優先プロバイダーのフィルターで読み込み済みモデルがまだ見つからない場合、オンボーディングはピッカーを空にするのではなく、未フィルタリングのカタログにフォールバックします。

  </Accordion>
  <Accordion title="Web 検索のフォローアップ">
    一部の Web 検索プロバイダーでは、プロバイダー固有のフォローアッププロンプトが表示されます。

    - **Grok** は、同じ `XAI_API_KEY` と `x_search` モデル選択を使用する任意の `x_search` セットアップを提示できます。
    - **Kimi** は、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルを確認できます。

  </Accordion>
  <Accordion title="その他の動作">
    - ローカルオンボーディングの DM スコープ動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
    - 最速の初回チャット: `openclaw dashboard`（Control UI、チャネルセットアップなし）。
    - カスタムプロバイダー: 一覧にないホスト型プロバイダーを含め、任意の OpenAI または Anthropic 互換エンドポイントに接続します。自動検出には Unknown を使用します。
    - Hermes の状態が検出されると、オンボーディングは移行フローを提示します。ドライラン計画、上書きモード、レポート、正確なマッピングには [移行](/ja-JP/cli/migrate) を使用します。

  </Accordion>
</AccordionGroup>

## 一般的なフォローアップコマンド

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ベースラインの設定/ワークスペースのみが必要な場合は、代わりに `openclaw setup` を使用してください。対象を絞った変更には後で `openclaw configure` を使用し、チャネルのみのセットアップには `openclaw channels add` を使用します。

<Note>
`--json` は非インタラクティブモードを意味しません。スクリプトには `--non-interactive` を使用してください。
</Note>
