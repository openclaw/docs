---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-06T17:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストール、git メタデータなし）、
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
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。config に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限りパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: config の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。コア更新の成功後に破損またはロード不能な管理対象 Plugin の修復が必要な場合は `postUpdate.plugins.warnings` を含み、更新後 Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合は `postUpdate.plugins.integrityDrifts` を含みます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されているチャンネル/タグ/インストール/再起動アクションのプレビューには `--dry-run` を、機械可読な結果には `--json` を、チャンネルと可用性の詳細だけが必要な場合は `openclaw update status --json` を使用します。更新前後の Gateway ログをデバッグしている場合、コンソールの詳細度とファイルログレベルは別です。Gateway の `--verbose` はターミナル/WebSocket 出力に影響し、ファイルログには config の `logging.level: "debug"` または `"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用します。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

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

更新チャンネルを選び、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

明示的にチャンネルを切り替えると（`--channel ...`）、OpenClaw はインストール方法も整合させます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）、それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コアの自動更新機能（config で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新では、パッケージ交換後に遅延なし、クールダウンなしの更新再起動を強制します。これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すメモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールでは段階的インストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、Plugin 同期、再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、パッケージ化されたサイドカーとチャンネル所有の Plugin レコードをインストール済みの OpenClaw ビルドと整合させつつ、完全な Plugin コマンド補完の再構築は明示的な `openclaw completion --write-state` 実行に残します。

ローカルの管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、更新後のインストールからサービスメタデータを更新し、サービスを再起動して、成功を報告する前に再起動された Gateway が期待されるバージョンを報告することを検証します。macOS では、更新後チェックで、アクティブなプロファイルの LaunchAgent が読み込まれて実行中であり、設定されたループバックポートが正常であることも検証します。plist がインストールされているものの launchd が監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後ヘルス/バージョン/チャンネル準備状況のチェックを再実行します。新しいブートストラップでは RunAtLoad ジョブを直接読み込むため、更新復旧では新しく生成された Gateway に対して直ちに `kickstart -k` を実行しません。それでも Gateway が正常にならない場合、コマンドは非ゼロで終了し、再起動ログパスに加えて、明示的な再起動、再インストール、パッケージロールバック手順を出力します。`--no-restart` を指定すると、パッケージ置換は引き続き実行されますが、管理対象サービスは停止または再起動されないため、実行中の Gateway は手動で再起動するまで古いコードを使い続ける場合があります。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドして doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を行います。

### 更新ステップ

<Steps>
  <Step title="Verify clean worktree">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="Switch channel">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="Fetch upstream">
    Dev のみ。
  </Step>
  <Step title="Preflight build (dev only)">
    一時 worktree で TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミットまでさかのぼって、ビルド可能な最新コミットを見つけます。この事前チェック中に lint も実行するには、`OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択したコミットに rebase します（dev のみ）。
  </Step>
  <Step title="Install dependencies">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、更新機能は pnpm workspace 内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Build Control UI">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` を最後の安全更新チェックとして実行します。
  </Step>
  <Step title="Sync plugins">
    Plugin をアクティブなチャンネルに同期します。dev はバンドルされた Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、デフォルト/latest 系列に従う追跡対象の npm および ClawHub Plugin インストールは、まず Plugin の `@beta` リリースを試します。Plugin に beta リリースがない場合、OpenClaw は記録済みのデフォルト/latest spec にフォールバックします。npm Plugin では、beta パッケージが存在していてもインストール検証に失敗した場合にも OpenClaw はフォールバックします。厳密なバージョンと明示的なタグは書き換えられません。

<Warning>
厳密に固定された npm Plugin 更新が、保存済みインストールレコードと整合性が異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを確認してからのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 Plugin に限定された更新後 Plugin 同期の失敗は、コア更新の成功後に警告として報告されます。JSON 結果はトップレベルの更新 `status: "ok"` を維持し、`postUpdate.plugins.status: "warning"` を `openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` のガイダンス付きで報告します。予期しない更新機能または同期の例外は、引き続き更新結果を失敗させます。Plugin のインストールまたは更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

更新後の Gateway が起動するとき、Plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが入れ替えられた後、通常のアイドル遅延と再起動クールダウンを迂回するため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm のブートストラップがそれでも失敗した場合、更新機能はチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に更新を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
