---
read_when:
    - OpenClaw リリースにおける npm shrinkwrap の意味を知りたい
    - package lockfile、依存関係の変更、またはサプライチェーンリスクをレビューしている
    - 公開前にルートまたはPluginの npm パッケージを検証しています
summary: OpenClaw リリースにおける npm shrinkwrap の平易な英語による説明と技術的な説明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T11:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw のソースチェックアウトは `pnpm-lock.yaml` を使用します。公開済みの OpenClaw npm
パッケージは、npm の公開可能な依存関係ロックファイルである `npm-shrinkwrap.json` を使用するため、
パッケージのインストールではリリース時にレビューされた依存関係グラフが使用されます。

## 簡単な説明

シュリンクラップは、npm パッケージと一緒に配布される依存関係ツリーの控えです。
どの推移的パッケージバージョンを正確にインストールするかを npm に伝えます。

OpenClaw リリースでは、これは次を意味します。

- 公開済みパッケージは、インストール時に新しい依存関係グラフを npm に作らせない。
- 依存関係の変更はロックファイルに現れるため、レビューしやすくなる。
- リリース検証では、ユーザーがインストールするものと同じグラフをテストできる。
- パッケージサイズやネイティブ依存関係の予期しない変化を、公開前に見つけやすくなる。

シュリンクラップはサンドボックスではありません。それ自体で依存関係を安全にするものではなく、
ホスト分離、`openclaw security audit`、パッケージの来歴、インストールのスモークテストの代替にもなりません。

短いメンタルモデル:

| ファイル              | 重要になる場所           | 意味                              |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw ソースチェックアウト | メンテナーの依存関係グラフ       |
| `npm-shrinkwrap.json` | 公開済み npm パッケージ  | ユーザー向けの npm インストールグラフ |
| `package-lock.json`   | ローカル npm アプリ      | OpenClaw の公開契約ではない      |

## OpenClaw がこれを使う理由

OpenClaw はゲートウェイ、プラグインホスト、モデルルーター、エージェントランタイムです。デフォルトの
インストールは、起動時間、ディスク使用量、ネイティブパッケージのダウンロード、サプライチェーン露出に影響する可能性があります。

シュリンクラップは、リリースレビューに安定した境界を与えます。

- レビュアーは推移的依存関係の変動を確認できる。
- パッケージ検証は、予期しないロックファイルのずれを拒否できる。
- パッケージ受け入れでは、配布されるグラフでインストールをテストできる。
- プラグインパッケージは、プラグイン専用の依存関係をルートパッケージに所有させるのではなく、
  自身のロック済み依存関係グラフを持てる。

目標は「ロックファイルを増やすこと」ではありません。目標は、所有権が明確な再現可能なリリースインストールです。

## 技術的詳細

ルートの `openclaw` npm パッケージと、OpenClaw所有の npm プラグインパッケージは、
公開時に `npm-shrinkwrap.json` を含みます。適切な OpenClaw所有のプラグイン
パッケージは、明示的な `bundledDependencies` とともに公開することもできるため、ランタイム
依存関係ファイルはインストール時の解決だけに依存せず、プラグイン tarball 内に含められます。

境界は次のように維持します。

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ジェネレーターは npm の公開可能なロック形式を解決しますが、`pnpm-lock.yaml` にまだ存在しない
生成済みパッケージバージョンは拒否します。これにより、pnpm の依存関係の古さ、override、
パッチレビューの境界が保たれます。

プラグインパッケージに触れず、意図的にルートパッケージだけを更新する場合に限り、ルート専用コマンドを使用します。

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

これらのファイルはセキュリティ上重要なものとしてレビューしてください。

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- バンドル済みプラグイン依存関係ペイロード
- すべての `package-lock.json` 差分

OpenClaw パッケージ検証は、新しいルートパッケージ tarball にシュリンクラップを要求します。
プラグインの npm 公開パスは、プラグインローカルのシュリンクラップを確認し、
パッケージローカルのバンドル済み依存関係をインストールしてから、パックまたは公開します。パッケージ
検証は、公開済み OpenClaw パッケージの `package-lock.json` を拒否します。

公開済みルートパッケージを調べるには:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

OpenClaw所有のプラグインパッケージを調べるには:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
