---
read_when:
    - ローカルでパックしたPluginに対するオンボーディングまたはセットアップフローのテスト
    - 公開前にPluginパッケージを検証する
    - 自動 Plugin インストールをテストアーティファクトに置き換える
sidebarTitle: Install overrides
summary: セットアップ時のインストールフローでパッケージ化されたPluginオーバーライドをテストする
title: Plugin インストールのオーバーライド
x-i18n:
    generated_at: "2026-07-05T11:37:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin インストールオーバーライドを使うと、メンテナーはセットアップ時の Plugin インストールで、カタログ、バンドル済み、またはデフォルトの npm ソースではなく、
特定の npm パッケージまたはローカルの npm-pack tarball を指定できます。これは E2E とパッケージ検証
専用です。通常のユーザーは
[`openclaw plugins install`](/ja-JP/cli/plugins) で Plugin をインストールします。

<Warning>
オーバーライドは、指定したソースから Plugin コードを実行します。隔離された状態ディレクトリまたは使い捨てのテストマシンでのみ使用してください。
</Warning>

## 環境

両方の変数が設定されていない限り、オーバーライドは無効です。

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

オーバーライドマップは Plugin id をキーにした JSON です。値は次をサポートします。

| プレフィックス        | ソース                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | レジストリパッケージ、厳密なバージョン、またはタグ                                               |
| `npm-pack:<path.tgz>` | `npm pack` で生成されたローカル tarball。相対パスは現在の作業ディレクトリから解決されます        |

## 動作

セットアップ時のフローが、マップに id が含まれる Plugin をインストールすると、OpenClaw はカタログ、バンドル済み、またはデフォルトの npm
ソースではなくオーバーライドソースを使用します。これは、オンボーディングと、共有の
セットアップ時 Plugin インストーラーを使用するその他すべてのフローに適用されます。

- オーバーライドでも、想定される Plugin id は引き続き強制されます。`codex` にマップされた tarball は、
  manifest id が `codex` の Plugin をインストールする必要があります。
- オーバーライドは、公式の信頼済みソースの状態を継承しません。通常は
  カタログエントリが OpenClaw 所有パッケージを表す場合でも、オーバーライドは
  オペレーター指定のテスト入力として扱われます。
- ワークスペースの `.env` ファイルではインストールオーバーライドを有効化できません。両方の env vars は
  ブロックされたワークスペース dotenv リストに含まれています。OpenClaw を起動する信頼済みシェル、CI ジョブ、または
  リモートテストコマンドで設定してください。

## パッケージ E2E

パッケージインストールとインストール記録が通常の OpenClaw 状態に触れないよう、隔離された状態ディレクトリを使用します。

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

状態ディレクトリ配下でインストール済みパッケージを検証します。

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

ライブプロバイダー E2E では、テストコマンドを起動する前に、信頼済みシェルまたは CI
シークレットから実際の API キーを読み込んでください。キーを出力しないでください。報告するのはソースとキーが存在したかどうかだけにしてください。
