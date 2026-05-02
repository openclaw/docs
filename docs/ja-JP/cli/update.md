---
read_when:
    - ソースチェックアウトを安全に更新したい
    - '`--update` の短縮記法の挙動を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-02T20:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClawを安全に更新し、stable/beta/devチャンネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストールで、gitメタデータなし）、
更新は[更新](/ja-JP/install/updating)のパッケージマネージャーフローで行われます。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## オプション

- `--no-restart`: 更新が成功したあと、Gatewayサービスの再起動をスキップします。Gatewayを再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが想定される更新後バージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新でのみパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: 設定の書き込み、インストール、Pluginの同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。更新後のPlugin同期中にnpm Pluginアーティファクトのドリフトが検出された場合は、
  `postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは1800秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャンネル + gitタグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読のステータスJSONを出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは3秒）。

## `update wizard`

更新チャンネルを選択し、更新後にGatewayを再起動するかどうかを確認するインタラクティブフローです（デフォルトは再起動）。gitチェックアウトなしで `dev` を選択した場合は、作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

チャンネルを明示的に切り替えると（`--channel ...`）、OpenClawはインストール方法も整合するように保ちます。

- `dev` → gitチェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）、それを更新して、そのチェックアウトからグローバルCLIをインストールします。
- `stable` → npmから `latest` を使ってインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、betaが存在しない、または現在の安定版リリースより古い場合は `latest` にフォールバックします。

Gatewayコア自動更新機能（設定で有効な場合）は、稼働中のGatewayリクエストハンドラーの外側でCLI更新パスを起動します。制御プレーンの `update.run` パッケージマネージャー更新は、パッケージの入れ替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これは、古いGatewayプロセスが、新しいパッケージで削除されたファイルを指すメモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npmグローバルインストールでは段階的インストールを使用します。OpenClawは新しいパッケージを一時的なnpmプレフィックスにインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバルプレフィックスに入れ替えます。検証に失敗した場合、更新後のdoctor、Plugin同期、再起動作業は疑わしいツリーからは実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後Plugin同期、コアコマンド補完の更新、再起動作業を実行します。これにより、パッケージ化されたサイドカーとチャンネル所有のPluginレコードを、インストール済みOpenClawビルドと整合させたまま、完全なPluginコマンド補完の再構築は明示的な `openclaw completion --write-state` 実行に任せます。

ローカルの管理対象Gatewayサービスがインストールされ、再起動が有効な場合、パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、更新済みインストールからサービスメタデータを更新し、サービスを再起動して、再起動されたGatewayが想定バージョンを報告することを検証します。`--no-restart` を指定すると、パッケージ置換は引き続き実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで実行中のGatewayが古いコードを保持する可能性があります。

## Gitチェックアウトフロー

### チャンネル選択

- `stable`: 最新の非betaタグをチェックアウトし、ビルドとdoctorを実行します。
- `beta`: 最新の `-beta` タグを優先しますが、betaが存在しない、または古い場合は最新の安定版タグにフォールバックします。
- `dev`: `main` をチェックアウトしてから、fetchとrebaseを行います。

### 更新ステップ

<Steps>
  <Step title="クリーンなworktreeを検証">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstreamをfetch">
    devのみ。
  </Step>
  <Step title="事前ビルド（devのみ）">
    一時worktreeでlintとTypeScriptビルドを実行します。tipが失敗した場合は、最新のクリーンなビルドを見つけるために最大10コミットまでさかのぼります。
  </Step>
  <Step title="Rebase">
    選択したコミットにrebaseします（devのみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpmチェックアウトでは、updaterはpnpmワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、その後一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UIをビルド">
    gatewayとControl UIをビルドします。
  </Step>
  <Step title="doctorを実行">
    `openclaw doctor` は最後の安全更新チェックとして実行されます。
  </Step>
  <Step title="Pluginを同期">
    Pluginをアクティブなチャンネルに同期します。devは同梱Pluginを使用し、stableとbetaはnpmを使用します。追跡対象のPluginインストールを更新します。
  </Step>
</Steps>

beta更新チャンネルでは、デフォルト/latestラインに従う追跡対象のnpmおよびClawHub Pluginインストールは、まずPluginの `@beta` リリースを試します。Pluginにbetaリリースがない場合、OpenClawは記録済みのデフォルト/latest specにフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定されたnpm Plugin更新が、保存済みインストールレコードと整合性が異なるアーティファクトに解決された場合、`openclaw update` はそのPluginアーティファクト更新をインストールせずに中止します。新しいアーティファクトを信頼できることを検証したあとにのみ、Pluginを明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後のPlugin同期に失敗すると、更新結果は失敗となり、後続の再起動作業は停止します。Pluginインストールまたは更新エラーを修正してから、`openclaw update` を再実行してください。

更新されたGatewayが起動するとき、Plugin読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが入れ替えられたあと、通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpmブートストラップがそれでも失敗した場合、updaterはチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（shellやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（gitチェックアウトでは先に更新を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLIリファレンス](/ja-JP/cli)
