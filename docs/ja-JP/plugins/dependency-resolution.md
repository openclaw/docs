---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Pluginの起動、doctor、またはパッケージマネージャーによるインストール動作を変更している
    - パッケージ化された OpenClaw インストールまたは同梱プラグインマニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する方法
title: Plugin の依存関係の解決
x-i18n:
    generated_at: "2026-05-02T05:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin の依存関係解決

OpenClaw は Plugin の依存関係に関する処理をインストール時または更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw
パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または
  `optionalDependencies` に置かれる
- SDK/core の import は peer または OpenClaw から提供される import
- ローカル開発 Plugin は、すでにインストール済みの依存関係を自身で持ち込む
- npm および git Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw が所有するのは Plugin ライフサイクルのみです。

- Plugin ソースを検出する
- 明示的に要求された場合にパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin のエントリポイントを読み込む
- 依存関係が欠落している場合は、実行可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` 配下にインストールされる
- git パッケージは `~/.openclaw/git` 配下に clone される
- ローカル/path/archive インストールは、依存関係を修復せずにコピーまたは参照される

npm インストールは npm ルートで次を実行します。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm は推移的依存関係を Plugin パッケージの隣にある `~/.openclaw/npm/node_modules` へ hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象の npm ルートをスキャンし、アンインストール時には npm を使って npm 管理のパッケージを削除します。そのため、hoist されたランタイム依存関係は管理対象のクリーンアップ境界内にとどまります。

git インストールではリポジトリを clone または更新し、その後次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストールされた Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親の `node_modules` 解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin と同梱の内部 Plugin は、Jiti ではなくネイティブの import/require 経由で読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin の依存関係は決してインストールされません。Plugin インストールレコードを読み取り、エントリポイントを計算し、それを読み込みます。

ランタイムで依存関係が欠落している場合、その Plugin は読み込みに失敗し、エラーはオペレーターに明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成した従来の依存関係状態をクリーンアップし、ローカルインストールレコードに存在しない設定済みのダウンロード可能な Plugin をインストールできます。すでにインストール済みのローカル Plugin の依存関係は修復しません。

## 同梱 Plugin

軽量かつコアに重要な同梱 Plugin は OpenClaw の一部として出荷されます。それらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上のダウンロード可能なパッケージへ移動されるべきです。

同梱 Plugin のマニフェストは依存関係ステージングを要求してはいけません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールするべきです。

ソースチェックアウトでは、OpenClaw はリポジトリを pnpm monorepo として扱います。`pnpm install` 後、同梱 Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用可能になり、編集は直接反映されます。ソースチェックアウトでの開発は pnpm 専用です。リポジトリルートでの通常の `npm install` は、同梱 Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態                 | 同梱 Plugin の場所                    | 依存関係の所有者                                                       |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー       |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace                 |
| `openclaw plugins install ...`   | 管理対象の npm/git/ClawHub Plugin root | Plugin install/update フロー                                            |

## 従来のクリーンアップ

古い OpenClaw バージョンは、起動時または doctor repair 中に同梱 Plugin の依存関係ルートを生成していました。現在の doctor cleanup は、`--fix` が使用された場合に、それらの古いディレクトリと symlink を削除します。これには古い `plugin-runtime-deps` ルート、`.openclaw-runtime-deps*` マニフェスト、生成された Plugin `node_modules`、install stage ディレクトリ、パッケージローカルの pnpm store が含まれます。

これらのパスは従来の残骸にすぎません。新規インストールでは作成されるべきではありません。
