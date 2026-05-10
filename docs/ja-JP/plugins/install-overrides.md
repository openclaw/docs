---
read_when:
    - ローカルでパックしたPluginに対するオンボーディングまたはセットアップフローのテスト
    - 公開前のPluginパッケージの検証
    - 自動Pluginインストールをテストアーティファクトに置き換える
sidebarTitle: Install overrides
summary: セットアップ時のインストールフローでパッケージ化されたPluginオーバーライドをテストする
title: Plugin インストールのオーバーライド
x-i18n:
    generated_at: "2026-05-10T19:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin インストールオーバーライドにより、メンテナーはセットアップ時の Plugin インストールを
特定の npm パッケージまたはローカルの `npm pack` tarball に対してテストできます。これは E2E とパッケージ
検証専用です。通常のユーザーは
[`openclaw plugins install`](/ja-JP/cli/plugins) で Plugin をインストールしてください。

<Warning>
オーバーライドは、指定したソースの Plugin コードを実行します。隔離された
状態ディレクトリまたは使い捨てのテストマシンでのみ使用してください。
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

オーバーライドマップは Plugin ID をキーにした JSON です。値は以下をサポートします。

- `npm:<registry-spec>`: レジストリパッケージと、正確なバージョンまたはタグ用
- `npm-pack:<path.tgz>`: `npm pack` で生成されたローカル tarball 用

相対 `npm-pack:` パスは、現在の作業ディレクトリを基準に解決されます。

## 動作

セットアップ時のフローが、マップに含まれる ID の Plugin をインストールしようとすると、
OpenClaw はカタログ、バンドル済み、またはデフォルトの
npm ソースではなく、オーバーライドソースを使用します。これはオンボーディングと、共有の
セットアップ時 Plugin インストーラーを使用するその他のフローに適用されます。

オーバーライドでも、期待される Plugin ID は引き続き強制されます。`codex` にマップされた tarball は、
マニフェスト ID が `codex` の Plugin をインストールする必要があります。

オーバーライドは、公式の信頼済みソースステータスを継承しません。カタログ
エントリが通常 OpenClaw 所有のパッケージを表す場合でも、オーバーライドは
オペレーターが提供したテスト入力として扱われます。

ワークスペースの `.env` ファイルでは、インストールオーバーライドを有効にできません。これらの変数は、
OpenClaw を起動する信頼済みシェル、CI ジョブ、またはリモートテストコマンドで設定してください。

## パッケージ E2E

隔離された状態ディレクトリを使用し、パッケージインストールとインストール記録が
通常の OpenClaw 状態に触れないようにします。

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

状態ディレクトリ配下のインストール済みパッケージを確認します。

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

ライブプロバイダー E2E では、テストコマンドを起動する前に、信頼済みシェルまたは CI シークレットから
実際の API キーを読み込んでください。キーを出力してはいけません。ソースと、
キーが存在したかどうかのみを報告してください。
