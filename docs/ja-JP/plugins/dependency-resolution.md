---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ化された OpenClaw インストール環境またはバンドルされた Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する方法
title: Plugin の依存関係解決
x-i18n:
    generated_at: "2026-05-06T09:08:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 依存関係の解決

OpenClaw は Plugin の依存関係に関する処理をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置く
- SDK/core のインポートは peer、または OpenClaw が提供するインポートにする
- ローカル開発用 Plugin は、すでにインストール済みの依存関係を自分で持ち込む
- npm および git の Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw が所有するのは Plugin ライフサイクルだけです。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリーポイントを読み込む
- 依存関係が欠けている場合は、実行可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使います。

- npm パッケージは `~/.openclaw/npm` 以下にインストールされる
- git パッケージは `~/.openclaw/git` 以下に clone される
- ローカル/パス/アーカイブのインストールは、依存関係を修復せずにコピーまたは参照される

npm インストールは npm ルートで次を実行します。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカル npm-pack tarball に対して同じ管理対象 npm ルートを使います。OpenClaw は tarball の npm メタデータを読み取り、コピーされた `file:` 依存関係として管理対象ルートに追加し、通常の npm install を実行してから、Plugin を信頼する前にインストール済み lockfile メタデータを検証します。これは、ローカル pack アーティファクトが、それが模擬する registry アーティファクトと同じように振る舞うべき package-acceptance および release-candidate の証明を目的としています。

npm は推移的依存関係を Plugin パッケージの隣にある `~/.openclaw/npm/node_modules` へ hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象 npm ルートをスキャンし、アンインストール時には npm を使って npm 管理パッケージを削除するため、hoist されたランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` を peer dependency として宣言します。OpenClaw は、ホストパッケージの別個の registry コピーを npm が管理対象ルートへインストールすることを許可しません。古いホストパッケージが、後続の Plugin インストール時に npm の peer 解決へ影響する可能性があるためです。代わりに、インストール、更新、またはアンインストール中に npm が共有ルートの変更を終えた後、OpenClaw はホスト peer を宣言しているインストール済みパッケージについて、Plugin ローカルの `node_modules/openclaw` リンクを再適用します。

git インストールは repository を clone または refresh してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親の `node_modules` 解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は、開発者が管理するディレクトリとして扱われます。OpenClaw は、それらに対して `npm install`、`pnpm install`、または依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、その Plugin を読み込む前に、その Plugin 内で依存関係をインストールしてください。

サードパーティの TypeScript ローカル Plugin は、緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin と bundled internal Plugin は、Jiti ではなくネイティブの import/require 経由で読み込まれます。

## 起動と再読み込み

Gateway の起動と config の再読み込みでは、Plugin 依存関係をインストールしません。Plugin インストールレコードを読み取り、エントリーポイントを計算し、それを読み込みます。

ランタイムで依存関係が欠けている場合、Plugin は読み込みに失敗し、エラーは operator に明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成した古い依存関係状態をクリーンアップし、config が参照しているにもかかわらずローカルインストールレコードに存在しないダウンロード可能な Plugin を復元できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係を修復しません。

## 同梱 Plugin

軽量または core-critical な同梱 Plugin は OpenClaw の一部として出荷されます。それらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上のダウンロード可能なパッケージへ移動される必要があります。

core パッケージに同梱される、外部インストールされる、または source-only のまま残る Plugin の現在の生成済みリストについては、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

同梱 Plugin の manifest は、依存関係 staging を要求してはいけません。大規模または optional な Plugin 機能は、通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールする必要があります。

source checkout では、OpenClaw は repository を pnpm monorepo として扱います。`pnpm install` の後、同梱 Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用可能になり、編集内容が直接反映されます。source checkout 開発は pnpm のみ対応です。repository ルートでの通常の `npm install` は、同梱 Plugin の依存関係を準備するサポート対象の方法ではありません。

| インストール形態 | 同梱 Plugin の場所 | 依存関係の所有者 |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw` | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージ、および明示的な Plugin install/update/doctor フロー |
| Git checkout と `pnpm install` | `extensions/<id>` workspace パッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace |
| `openclaw plugins install ...` | 管理対象 npm/git/ClawHub Plugin ルート | Plugin install/update フロー |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor repair 中に同梱 Plugin の依存関係ルートを生成していました。現在の doctor cleanup は、`--fix` が使われたときに、それらの古いディレクトリと symlink を削除します。これには、古い `plugin-runtime-deps` ルート、pruned された `plugin-runtime-deps` ターゲットを指す global Node-prefix package symlink、`.openclaw-runtime-deps*` manifest、生成された Plugin `node_modules`、install stage directory、package-local pnpm store が含まれます。パッケージ化された postinstall も、legacy target root を prune する前にそれらの global symlink を削除するため、アップグレード後に dangling ESM package import が残りません。

これらのパスは legacy debris にすぎません。新しいインストールで作成されるべきではありません。
