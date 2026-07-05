---
read_when:
    - OpenClaw リリースにおける npm shrinkwrap の意味を知りたい
    - パッケージロックファイル、依存関係の変更、またはサプライチェーンリスクをレビューしている
    - 公開前にルートまたは Plugin npm パッケージを検証しています
summary: OpenClaw リリースにおける npm shrinkwrap の平易な説明と技術的な説明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-05T11:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw ソースチェックアウトは `pnpm-lock.yaml` を使用します。公開済みの OpenClaw npm パッケージは npm の公開可能な依存関係ロックファイルである `npm-shrinkwrap.json` を使用するため、パッケージインストールではリリース時にレビューされた依存関係グラフが使用されます。

## 重要な理由

shrinkwrap は npm パッケージとともに出荷される依存関係ツリーの受領書です。インストールする正確な推移的バージョンを npm に伝えます。

| ファイル              | 重要になる場所           | 意味                              |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw ソースチェックアウト | メンテナーの依存関係グラフ       |
| `npm-shrinkwrap.json` | 公開済み npm パッケージ  | ユーザー向け npm インストールグラフ |
| `package-lock.json`   | ローカル npm アプリ      | OpenClaw の公開契約ではない      |

OpenClaw リリースでは、これは次を意味します。

- 公開済みパッケージはインストール時に新しい依存関係グラフを npm に作らせない。
- 依存関係の変更はロックファイルの差分に入るためレビュー可能になる。
- リリース検証はユーザーがインストールするものと同じグラフをテストする。
- パッケージサイズやネイティブ依存関係の予期しない問題は公開前に表面化する。

shrinkwrap はサンドボックスではありません。それ自体で依存関係を安全にするものではなく、ホスト分離、`openclaw security audit`、パッケージの来歴、インストールスモークテストを置き換えるものでもありません。

OpenClaw は Gateway、Pluginホスト、モデルルーター、エージェントランタイムであるため、デフォルトインストールは起動時間、ディスク使用量、ネイティブパッケージのダウンロード、サプライチェーン露出に影響します。shrinkwrap はリリースレビューに安定した境界を与えます。レビュアーは推移的依存関係の移動を確認でき、検証は予期しないロックファイルのドリフトを拒否し、Pluginパッケージはルートパッケージに依存するのではなく独自のロック済み依存関係グラフを保持します。

## 生成とチェック

ルートの `openclaw` npm パッケージ、OpenClaw 所有の npm Pluginパッケージ（例: `@openclaw/discord`）、および [`@openclaw/ai`](/reference/openclaw-ai) などの公開可能なワークスペースパッケージは、公開時に `npm-shrinkwrap.json` を含めます。ワークスペース依存関係はルートパッケージと並んで公開されるため、ルート shrinkwrap からは省略されます。各公開可能ワークスペースパッケージが独自の推移的ツリーを固定します。適切な Pluginパッケージは明示的な `bundledDependencies` とともに公開することもでき、インストール時の解決だけに頼るのではなく、Plugin tarball 内にランタイム依存関係ファイルを含めます。

```bash
# All shrinkwrap-managed packages (root + publishable plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Root package only
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Only packages affected by the current changeset
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

ジェネレーターは npm の公開可能なロック形式を解決しますが、`pnpm-lock.yaml` にすでに存在しない生成済みパッケージバージョンは拒否します。これにより、pnpm 依存関係の経過期間、オーバーライド、パッチレビューの境界が維持されます。

これらはセキュリティ上重要なものとしてレビューしてください。

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- バンドル済み Plugin依存関係ペイロード
- すべての `package-lock.json` 差分

OpenClaw パッケージ検証は、新しいルートパッケージ tarball に shrinkwrap を要求し、公開済みパッケージの `package-lock.json` を拒否します。Plugin npm 公開パスは Pluginローカルの shrinkwrap をチェックし、パッケージローカルのバンドル済み依存関係をインストールしてから、パックまたは公開します。

## 公開済みパッケージの検査

ルートパッケージ:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Pluginパッケージ:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
