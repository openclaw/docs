---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の挙動を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-07T13:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClawを安全に更新し、stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun**（グローバルインストール、git メタデータなし）でインストールした場合、更新は[更新](/ja-JP/install/updating)のパッケージマネージャーフローで行われます。

## 使い方

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

- `--no-restart`: 更新が成功した後の Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが期待される更新後バージョンを報告していることを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に保存されます）。
- `--tag <dist-tag|version|spec>`: この更新だけに使うパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: 設定の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。コア更新の成功後に破損または読み込み不能な管理対象 Plugin の修復が必要な場合は `postUpdate.plugins.warnings` を含み、更新後の Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合は `postUpdate.plugins.integrityDrifts` を含みます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800s）。
- `--yes`: 確認プロンプトをスキップします（たとえばダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されているチャンネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、機械可読の結果には `--json` を、チャンネルと利用可能性の詳細だけが必要な場合は `openclaw update status --json` を使ってください。更新前後の Gateway ログをデバッグしている場合、コンソールの詳細度とファイルログレベルは別です。Gateway の `--verbose` はターミナル/WebSocket 出力に影響しますが、ファイルログには設定内の `logging.level: "debug"` または `"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` 実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使ってください。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャンネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の利用可能性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読のステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3s）。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうか（デフォルトは再起動）を確認する対話式フローです。git チェックアウトなしで `dev` を選択した場合、作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルトは `1800`）

## 実行内容

チャンネルを明示的に切り替える（`--channel ...`）と、OpenClaw はインストール方法も揃えます。

- `dev` → git チェックアウト（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）を確保し、それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → npm から `latest` を使ってインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コアの自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外側で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新は、パッケージ入れ替え後に遅延なし、クールダウンなしの更新再起動を強制します。これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すメモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールではステージングされたインストールを使います。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、そこでパッケージ済みの `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、Plugin 同期、再起動作業は疑わしいツリーからは実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、完全な Plugin コマンド補完の再構築は明示的な `openclaw completion --write-state` 実行に任せつつ、パッケージ済みのサイドカーとチャンネル所有の Plugin レコードを、インストール済みの OpenClaw ビルドに揃えます。

ローカルの管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、その後、更新されたインストールからサービスメタデータを更新し、サービスを再起動して、再起動された Gateway が期待されるバージョンを報告していることを検証してから成功を報告します。macOS では、更新後チェックは、LaunchAgent が有効なプロファイル向けに読み込まれ/実行中であり、設定されたループバックポートが正常であることも検証します。plist がインストールされているのに launchd が監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後、ヘルス/バージョン/チャンネルの準備完了チェックを再実行します。新規ブートストラップでは RunAtLoad ジョブを直接読み込むため、更新復旧は新しく起動した Gateway に対してすぐに `kickstart -k` を実行しません。Gateway がそれでも正常にならない場合、コマンドはゼロ以外で終了し、再起動ログのパスと、明示的な再起動、再インストール、パッケージロールバック手順を表示します。`--no-restart` を指定した場合、パッケージ置き換えは引き続き実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで実行中の Gateway は古いコードを保持する可能性があります。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドして doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンなワークツリーを検証">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択されたチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="上流を fetch">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミットまでさかのぼって、ビルド可能な最新コミットを探します。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミット上に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使います。pnpm チェックアウトでは、アップデーターは pnpm ワークスペース内で `npm run build` を実行するのではなく、必要に応じて `pnpm` をブートストラップします（まず `corepack`、その後一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="Doctor を実行">
    `openclaw doctor` が最後の安全更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin を有効なチャンネルに同期します。Dev はバンドル Plugin を使い、stable と beta は npm を使います。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、default/latest 系に従う追跡対象の npm と ClawHub Plugin インストールは、まず Plugin `@beta` リリースを試します。Plugin に beta リリースがない場合、OpenClaw は記録済みの default/latest spec にフォールバックします。npm Plugin では、beta パッケージが存在していてもインストール検証に失敗した場合にも OpenClaw はフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確にピン留めされた npm Plugin 更新が、保存済みのインストールレコードと整合性が異なるアーティファクトに解決された場合、`openclaw update` はそれをインストールせず、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後でのみ、その Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 Plugin に範囲が限定される更新後の Plugin 同期失敗は、コア更新の成功後に警告として報告されます。JSON 結果はトップレベルの更新 `status: "ok"` を維持し、`openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` の案内とともに `postUpdate.plugins.status: "warning"` を報告します。予期しないアップデーターまたは同期例外は、引き続き更新結果を失敗にします。Plugin のインストールまたは更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

更新された Gateway が起動するとき、Plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが入れ替えられた後、通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除されたチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトに便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは、先に更新を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
