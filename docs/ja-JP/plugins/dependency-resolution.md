---
read_when:
    - Pluginパッケージのインストールをデバッグしている
    - Plugin の起動、doctor、または package-manager のインストール動作を変更している
    - パッケージ化された OpenClaw インストール、またはバンドルされた Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin の依存関係を解決する仕組み
title: Plugin の依存関係解決
x-i18n:
    generated_at: "2026-05-03T21:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin の依存関係解決

OpenClaw は Plugin の依存関係に関する処理をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任範囲の分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に配置する
- SDK/core インポートは peer または OpenClaw が提供するインポートとする
- ローカル開発 Plugin は、すでにインストール済みの依存関係を自分で持ち込む
- npm と git の Plugin は OpenClaw が所有するパッケージルートにインストールされる

OpenClaw は Plugin ライフサイクルのみを所有します。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリーポイントを読み込む
- 依存関係が不足している場合は、対処可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` 配下にインストールされる
- git パッケージは `~/.openclaw/git` 配下に clone される
- local/path/archive インストールは、依存関係の修復なしでコピーまたは参照される

npm インストールは、npm ルートで次を実行します。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm は推移的依存関係を、Plugin パッケージの横にある `~/.openclaw/npm/node_modules` へ巻き上げることがあります。OpenClaw はインストールを信頼する前に管理対象の npm ルートをスキャンし、アンインストール時には npm を使って npm 管理のパッケージを削除するため、巻き上げられたランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

git インストールはリポジトリを clone または更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親 `node_modules` の解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は、開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、依存関係修復を実行しません。ローカル Plugin に依存関係がある場合は、その Plugin を読み込む前に、その Plugin 内で依存関係をインストールしてください。

サードパーティの TypeScript ローカル Plugin は緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin とバンドル済み内部 Plugin は、Jiti ではなくネイティブの import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin 依存関係をインストールしません。Plugin インストール記録を読み取り、エントリーポイントを計算し、それを読み込みます。

ランタイムで依存関係が不足している場合、Plugin の読み込みは失敗し、エラーは操作者に明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成したレガシーな依存関係状態をクリーンアップし、ローカルのインストール記録に存在しない設定済みのダウンロード可能 Plugin をインストールできます。すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル済み Plugin

軽量で core-critical なバンドル済み Plugin は OpenClaw の一部として出荷されます。これらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上のダウンロード可能なパッケージへ移動する必要があります。

core パッケージで出荷される、外部インストールされる、またはソース専用に残る Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory) を参照してください。

バンドル済み Plugin のマニフェストは、依存関係のステージングを要求してはなりません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールする必要があります。

ソース checkout では、OpenClaw はリポジトリを pnpm monorepo として扱います。`pnpm install` の後、バンドル済み Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用でき、編集内容が直接反映されます。ソース checkout 開発は pnpm のみ対応です。リポジトリルートで通常の `npm install` を実行することは、バンドル済み Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態                 | バンドル済み Plugin の場所          | 依存関係の所有者                                                     |
| -------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー    |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace パッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace              |
| `openclaw plugins install ...`   | 管理対象の npm/git/ClawHub Plugin ルート | Plugin install/update フロー                                         |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor 修復中にバンドル済み Plugin の依存関係ルートを生成していました。現在の doctor クリーンアップは、`--fix` が使用されたときに、古い `plugin-runtime-deps` ルート、削除済みの `plugin-runtime-deps` ターゲットを指すグローバル Node-prefix パッケージシンボリックリンク、`.openclaw-runtime-deps*` マニフェスト、生成済み Plugin `node_modules`、インストールステージディレクトリ、パッケージローカルの pnpm store などの古いディレクトリとシンボリックリンクを削除します。パッケージ化された postinstall も、レガシーターゲットルートを削除する前にそれらのグローバルシンボリックリンクを削除するため、アップグレード後に壊れた ESM パッケージインポートが残りません。

これらのパスはレガシーな残骸にすぎません。新規インストールで作成されるべきではありません。
