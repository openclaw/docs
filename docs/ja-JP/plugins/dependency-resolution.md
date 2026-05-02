---
read_when:
    - Plugin パッケージのインストールをデバッグしている
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ化された OpenClaw インストールまたは同梱 Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する仕組み
title: Plugin 依存関係の解決
x-i18n:
    generated_at: "2026-05-02T20:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin の依存関係解決

OpenClaw は Plugin の依存関係処理をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置く
- SDK/コアのインポートは peer、または OpenClaw が提供するインポートにする
- ローカル開発用 Plugin は、すでにインストール済みの依存関係を自分で用意する
- npm と git の Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw は Plugin のライフサイクルのみを所有します。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリーポイントを読み込む
- 依存関係が見つからない場合は、実行可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` 配下にインストールされる
- git パッケージは `~/.openclaw/git` 配下にクローンされる
- ローカル/パス/アーカイブのインストールは、依存関係の修復なしでコピーまたは参照される

npm インストールは npm ルートで次のように実行されます。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm は推移的依存関係を、Plugin パッケージの隣にある `~/.openclaw/npm/node_modules` へ巻き上げる場合があります。OpenClaw はインストールを信頼する前に管理対象の npm ルートをスキャンし、アンインストール時には npm を使って npm 管理のパッケージを削除するため、巻き上げられたランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

git インストールはリポジトリをクローンまたは更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストールされた Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親の `node_modules` 解決は、通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は、緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin とバンドル済み内部 Plugin は、Jiti ではなくネイティブの import/require で読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin の依存関係はインストールされません。Plugin のインストール記録を読み取り、エントリーポイントを計算し、それを読み込みます。

ランタイムで依存関係が見つからない場合、その Plugin の読み込みは失敗し、エラーは運用者に明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成したレガシーな依存関係状態をクリーンアップし、ローカルのインストール記録に存在しない設定済みのダウンロード可能 Plugin をインストールできます。すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル済み Plugin

軽量またはコアに重要なバンドル済み Plugin は、OpenClaw の一部として配布されます。それらは重いランタイム依存関係ツリーを持たないようにするか、ClawHub/npm 上のダウンロード可能パッケージへ移すべきです。

コアパッケージに同梱される Plugin、外部インストールされる Plugin、またはソースのみとして残る Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

バンドル済み Plugin のマニフェストは、依存関係のステージングを要求してはなりません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールするべきです。

ソースチェックアウトでは、OpenClaw はリポジトリを pnpm モノレポとして扱います。`pnpm install` の後、バンドル済み Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルのワークスペース依存関係が利用可能になり、編集内容が直接反映されます。ソースチェックアウト開発は pnpm のみです。リポジトリルートでの通常の `npm install` は、バンドル済み Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態 | バンドル済み Plugin の場所 | 依存関係の所有者 |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw` | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージ、および明示的な Plugin install/update/doctor フロー |
| Git チェックアウトと `pnpm install` | `extensions/<id>` ワークスペースパッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm ワークスペース |
| `openclaw plugins install ...` | 管理対象の npm/git/ClawHub Plugin ルート | Plugin install/update フロー |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor 修復中にバンドル済み Plugin の依存関係ルートを生成していました。現在の doctor クリーンアップは、`--fix` が使われたときに、それらの古いディレクトリとシンボリックリンクを削除します。これには、古い `plugin-runtime-deps` ルート、`.openclaw-runtime-deps*` マニフェスト、生成された Plugin の `node_modules`、インストールステージディレクトリ、パッケージローカルの pnpm ストアが含まれます。

これらのパスはレガシーな残骸にすぎません。新規インストールで作成されるべきではありません。
