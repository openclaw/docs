---
read_when:
    - OpenClaw リリースにおける npm shrinkwrap の意味を知りたい場合
    - パッケージのロックファイル、依存関係の変更、またはサプライチェーンのリスクをレビューしている場合
    - 公開前にルートまたは Plugin の npm パッケージを検証しています
summary: OpenClaw リリースにおける npm shrinkwrap の平易な英語および技術的な説明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-11T22:16:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw のソースチェックアウトでは `pnpm-lock.yaml` を使用します。公開される OpenClaw npm パッケージでは、npm の公開可能な依存関係ロックファイルである `npm-shrinkwrap.json` を使用するため、パッケージのインストールにはリリース時にレビューされた依存関係グラフが使用されます。

## 重要な理由

Shrinkwrap は、npm パッケージに同梱される依存関係ツリーの明細です。インストールする推移的依存関係の正確なバージョンを npm に指定します。

| ファイル              | 関係する場所                 | 意味                              |
| --------------------- | ---------------------------- | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw のソースチェックアウト | メンテナー向け依存関係グラフ      |
| `npm-shrinkwrap.json` | 公開された npm パッケージ       | ユーザー向け npm インストールグラフ |
| `package-lock.json`   | ローカルの npm アプリ           | OpenClaw の公開契約ではない        |

OpenClaw のリリースでは、これは次を意味します。

- 公開パッケージは、インストール時に新しい依存関係グラフを生成するよう npm に要求しません。
- 依存関係の変更はロックファイルの差分として反映されるため、レビューできます。
- リリース検証では、ユーザーがインストールするものと同じグラフをテストします。
- パッケージサイズやネイティブ依存関係に関する予期しない問題を、公開前に検出できます。

Shrinkwrap はサンドボックスではありません。それ自体で依存関係を安全にするものではなく、ホストの分離、`openclaw security audit`、パッケージの来歴、インストールのスモークテストを代替するものでもありません。

OpenClaw は Gateway、Plugin ホスト、モデルルーター、エージェントランタイムであるため、デフォルトのインストールは起動時間、ディスク使用量、ネイティブパッケージのダウンロード、サプライチェーンのリスク範囲に影響します。Shrinkwrap はリリースレビューに安定した境界を提供します。レビュー担当者は推移的依存関係の変動を確認でき、検証処理は予期しないロックファイルのずれを拒否し、Plugin パッケージはルートパッケージに依存せず、独自にロックされた依存関係グラフを保持します。

## 生成と確認

ルートの `openclaw` npm パッケージ、OpenClaw が所有する npm Plugin パッケージ（たとえば `@openclaw/discord`）、および [`@openclaw/ai`](/ja-JP/reference/openclaw-ai) などの公開可能なワークスペースパッケージは、公開時に `npm-shrinkwrap.json` を含みます。ワークスペース依存関係はルートパッケージとともに公開されるため、ルートの Shrinkwrap から除外されます。代わりに、公開可能な各ワークスペースパッケージが独自の推移的依存関係ツリーを固定します。適切な Plugin パッケージでは、明示的な `bundledDependencies` を指定して公開することもでき、インストール時の解決だけに依存せず、Plugin の tarball にランタイム依存関係ファイルを同梱できます。

```bash
# Shrinkwrap で管理されるすべてのパッケージ（ルート + 公開可能な Plugin）
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# ルートパッケージのみ
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# 現在の変更セットの影響を受けるパッケージのみ
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

ジェネレーターは npm の公開可能なロック形式を解決しますが、生成されたパッケージバージョンが `pnpm-lock.yaml` にすでに存在しない場合は拒否します。これにより、pnpm の依存関係の経過期間、オーバーライド、パッチレビューの境界が維持されます。

次の項目はセキュリティ上重要なものとしてレビューしてください。

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- バンドルされた Plugin の依存関係ペイロード
- すべての `package-lock.json` の差分

OpenClaw のパッケージ検証処理では、新しいルートパッケージの tarball に Shrinkwrap が必須であり、公開パッケージの `package-lock.json` は拒否されます。Plugin の npm 公開処理では、Plugin ローカルの Shrinkwrap を確認し、パッケージローカルのバンドル依存関係をインストールしてから、パッケージ化または公開します。

## 公開パッケージの確認

ルートパッケージ：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Plugin パッケージ：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景情報：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)。
