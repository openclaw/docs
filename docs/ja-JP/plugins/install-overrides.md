---
read_when:
    - ローカルでパックしたPluginに対してオンボーディングまたはセットアップフローをテストする
    - Plugin パッケージを公開前に検証する
    - 自動 Plugin インストールをテスト成果物に置き換える
sidebarTitle: Install overrides
summary: セットアップ時のインストールフローでパッケージ化された Plugin オーバーライドをテストする
title: Plugin インストールのオーバーライド
x-i18n:
    generated_at: "2026-06-27T12:16:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin インストールオーバーライドにより、メンテナーはセットアップ時の Plugin インストールを、特定の npm パッケージまたはローカルの npm-pack tarball に対してテストできます。これは E2E とパッケージ検証専用です。通常のユーザーは [`openclaw plugins install`](/ja-JP/cli/plugins) で Plugin をインストールしてください。

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

オーバーライドマップは Plugin ID をキーにした JSON です。値は次をサポートします。

- レジストリパッケージと正確なバージョンまたはタグには `npm:<registry-spec>`
- `npm pack` で生成されたローカル tarball には `npm-pack:<path.tgz>`

相対 `npm-pack:` パスは現在の作業ディレクトリから解決されます。

## 動作

セットアップ時フローが、マップに ID が存在する Plugin のインストールを要求すると、OpenClaw はカタログ、バンドル、またはデフォルトの npm ソースではなく、オーバーライドソースを使用します。これはオンボーディングと、共有のセットアップ時 Plugin インストーラーを使用する他のフローに適用されます。

オーバーライドでも、期待される Plugin ID は引き続き強制されます。`codex` にマップされた tarball は、マニフェスト ID が `codex` の Plugin をインストールする必要があります。

オーバーライドは、公式の信頼済みソースステータスを継承しません。カタログエントリが通常 OpenClaw 所有のパッケージを表している場合でも、オーバーライドはオペレーターが提供したテスト入力として扱われます。

ワークスペースの `.env` ファイルではインストールオーバーライドを有効にできません。これらの変数は、OpenClaw を起動する信頼済みシェル、CI ジョブ、またはリモートテストコマンドで設定してください。

## パッケージ E2E

パッケージインストールとインストール記録が通常の OpenClaw 状態に触れないよう、隔離された状態ディレクトリを使用します。

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

状態ディレクトリ配下にインストールされたパッケージを検証します。

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

ライブプロバイダー E2E では、テストコマンドを起動する前に、信頼済みシェルまたは CI シークレットから実際の API キーを読み込んでください。キーは出力せず、ソースとキーが存在していたかどうかのみを報告してください。
