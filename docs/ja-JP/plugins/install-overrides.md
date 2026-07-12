---
read_when:
    - ローカルでパッケージ化したPluginを使用したオンボーディングまたはセットアップフローのテスト
    - 公開前のPluginパッケージの検証
    - 自動 Plugin インストールをテストアーティファクトに置き換える
sidebarTitle: Install overrides
summary: セットアップ時のインストールフローでパッケージ化されたPluginのオーバーライドをテストする
title: Plugin のインストール上書き
x-i18n:
    generated_at: "2026-07-11T22:26:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin インストールのオーバーライドにより、メンテナーはセットアップ時の Plugin インストールで、カタログ、バンドル済み、またはデフォルトの npm ソースの代わりに、特定の npm パッケージまたはローカルの npm-pack tarball を指定できます。これは E2E とパッケージ検証専用です。通常のユーザーは [`openclaw plugins install`](/ja-JP/cli/plugins) を使用して Plugin をインストールします。

<Warning>
オーバーライドは、指定したソースの Plugin コードを実行します。隔離された状態ディレクトリまたは使い捨てのテストマシンでのみ使用してください。
</Warning>

## 環境

次の両方の変数が設定されていない限り、オーバーライドは無効です。

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

オーバーライドマップは、Plugin ID をキーとする JSON です。値では次の形式を使用できます。

| プレフィックス        | ソース                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | レジストリパッケージ、完全に指定されたバージョン、またはタグ                                   |
| `npm-pack:<path.tgz>` | `npm pack` で生成されたローカル tarball。相対パスは現在の作業ディレクトリを基準に解決されます |

## 動作

セットアップ時のフローが、マップに ID が含まれる Plugin をインストールする場合、OpenClaw はカタログ、バンドル済み、またはデフォルトの npm ソースの代わりにオーバーライドソースを使用します。これは、オンボーディング、および共有のセットアップ時 Plugin インストーラーを使用するその他すべてのフローに適用されます。

- オーバーライドでも、想定される Plugin ID は引き続き強制されます。`codex` にマッピングされた tarball は、マニフェスト ID が `codex` の Plugin をインストールする必要があります。
- オーバーライドは、公式の信頼済みソースとしての状態を継承しません。通常はカタログエントリが OpenClaw 所有のパッケージを表す場合でも、オーバーライドは運用者が提供したテスト入力として扱われます。
- ワークスペースの `.env` ファイルでは、インストールのオーバーライドを有効にできません。両方の環境変数は、ブロック対象のワークスペース dotenv リストに含まれています。OpenClaw を起動する信頼済みシェル、CI ジョブ、またはリモートテストコマンドで設定してください。

## パッケージ E2E

パッケージのインストールとインストール記録が通常の OpenClaw の状態に影響しないよう、隔離された状態ディレクトリを使用してください。

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

状態ディレクトリ内にインストールされたパッケージを確認します。

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

実際のプロバイダーを使用する E2E では、テストコマンドを起動する前に、信頼済みシェルまたは CI シークレットから実際の API キーを読み込んでください。キーを出力せず、取得元とキーが存在したかどうかだけを報告してください。
