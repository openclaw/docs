---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-02T04:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネル間を切り替えます。

**npm/pnpm/bun**（グローバルインストール、git メタデータなし）でインストールした場合、
更新は [更新](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

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

- `--no-restart`: 更新が成功した後に Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが期待される更新後バージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新のみ、パッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: 設定の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。更新後の Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合は、
  `postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャンネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

明示的にチャンネルを切り替える場合（`--channel ...`）、OpenClaw はインストール方法も整合させます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コア自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新は、パッケージ差し替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すメモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールでは段階的インストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に差し替えます。検証に失敗した場合、更新後の doctor、Plugin 同期、再起動作業は疑わしいツリーからは実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、パッケージ化されたサイドカーとチャンネル所有の Plugin レコードを、インストール済みの OpenClaw ビルドと整合させつつ、完全な Plugin コマンド補完の再ビルドは明示的な `openclaw completion --write-state` 実行に委ねます。

ローカル管理の Gateway サービスがインストールされ、再起動が有効な場合、パッケージマネージャー更新は、パッケージツリーを置き換える前に実行中のサービスを停止し、その後、更新されたインストールからサービスメタデータを更新し、サービスを再起動し、再起動された Gateway が期待されるバージョンを報告することを検証します。`--no-restart` では、パッケージ置換は実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで実行中の Gateway は古いコードを保持する可能性があります。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドして doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を行います。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを検証">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択されたチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="アップストリームを取得">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで lint と TypeScript ビルドを実行します。先端が失敗した場合は、最大 10 コミットまでさかのぼって最新のクリーンビルドを見つけます。
  </Step>
  <Step title="Rebase">
    選択されたコミット上に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、更新機能は pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` が最終的な安全更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin を有効なチャンネルに同期します。Dev はバンドルされた Plugin を使用し、stable と beta は npm を使用します。npm でインストールされた Plugin を更新します。
  </Step>
</Steps>

<Warning>
正確にピン留めされた npm Plugin 更新が、保存されているインストールレコードと整合性の異なるアーティファクトに解決された場合、`openclaw update` はその Plugin アーティファクト更新をインストールせずに中止します。新しいアーティファクトを信頼できることを検証した後でのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後の Plugin 同期に失敗すると、更新結果は失敗となり、再起動の後続作業は停止します。Plugin のインストールまたは更新エラーを修正してから、`openclaw update` を再実行してください。

更新された Gateway が起動するとき、Plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが差し替えられた後、通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、更新機能はチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止します。
</Note>

## `--update` 短縮形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に更新を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
