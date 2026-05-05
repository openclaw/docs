---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ版 OpenClaw インストールまたは同梱 Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw がプラグインパッケージをインストールし、プラグイン依存関係を解決する仕組み
title: Plugin の依存関係解決
x-i18n:
    generated_at: "2026-05-05T01:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 依存関係の解決

OpenClaw は Plugin 依存関係の処理をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置く
- SDK/コアの import は peer、または OpenClaw から提供される import
- ローカル開発用 Plugin は、依存関係がすでにインストールされた状態で持ち込む
- npm および git Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw が所有するのは Plugin ライフサイクルだけです。

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

npm は推移的依存関係を Plugin パッケージの隣の `~/.openclaw/npm/node_modules` に hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象の npm ルートをスキャンし、アンインストール時には npm を使って npm 管理のパッケージを削除するため、hoist されたランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

git インストールはリポジトリを clone または更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストールされた Plugin はその後、そのパッケージディレクトリから読み込まれるため、package-local および親の `node_modules` 解決は通常の Node パッケージと同じように動作します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin とバンドルされた内部 Plugin は、Jiti ではなくネイティブの import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin 依存関係は決してインストールされません。Plugin インストールレコードを読み取り、エントリーポイントを計算し、それを読み込みます。

ランタイムで依存関係が不足している場合、Plugin の読み込みは失敗し、エラーは運用者に明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成したレガシー依存関係状態をクリーンアップし、設定で参照されているもののローカルインストールレコードに存在しないダウンロード可能な Plugin を復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係を修復しません。

## バンドル Plugin

軽量でコアに重要なバンドル Plugin は OpenClaw の一部として同梱されます。それらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上のダウンロード可能なパッケージへ移す必要があります。

コアパッケージに同梱される Plugin、外部インストールされる Plugin、または source-only のままにする Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory) を参照してください。

バンドル Plugin の manifest は依存関係ステージングを要求してはなりません。大きな、または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールする必要があります。

ソース checkout では、OpenClaw はリポジトリを pnpm monorepo として扱います。`pnpm install` 後、バンドル Plugin は `extensions/<id>` から読み込まれるため、package-local な workspace 依存関係が利用可能になり、編集内容が直接反映されます。ソース checkout 開発は pnpm のみ対応です。リポジトリルートでの通常の `npm install` は、バンドル Plugin 依存関係を準備する方法としてサポートされていません。

| インストール形態                 | バンドル Plugin の場所               | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace パッケージ  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace |
| `openclaw plugins install ...`   | 管理対象の npm/git/ClawHub Plugin ルート | Plugin install/update フロー                                       |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor 修復中にバンドル Plugin の依存関係ルートを生成していました。現在の doctor クリーンアップは、`--fix` が使用されたときに、それらの古いディレクトリとシンボリックリンクを削除します。対象には、古い `plugin-runtime-deps` ルート、削除済みの `plugin-runtime-deps` ターゲットを指すグローバル Node-prefix パッケージのシンボリックリンク、`.openclaw-runtime-deps*` manifest、生成された Plugin `node_modules`、インストールステージディレクトリ、package-local な pnpm ストアが含まれます。パッケージ化された postinstall も、レガシーターゲットルートを pruning する前にそれらのグローバルシンボリックリンクを削除するため、アップグレード後に壊れた ESM パッケージ import が残りません。

これらのパスはレガシーな残骸にすぎません。新規インストールで作成されるべきではありません。
