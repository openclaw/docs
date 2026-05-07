---
read_when:
    - ソースのチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: 'CLI リファレンス: `openclaw update`（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-07T01:51:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャネルを切り替えます。

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

- `--no-restart`: 更新に成功した後、Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが想定どおりの更新済みバージョンを報告することを確認します。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新だけで使用するパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: 設定の書き込み、インストール、plugins の同期、再起動を行わずに、予定されている更新アクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。これには、コア更新が成功した後に破損または読み込み不能な管理対象 plugins の修復が必要な場合の
  `postUpdate.plugins.warnings` と、更新後の plugin 同期中に npm plugin アーティファクトのドリフトが検出された場合の `postUpdate.plugins.integrityDrifts`
  が含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されている
チャネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、
機械可読な結果には `--json` を、チャネルと利用可能性の詳細だけが必要な場合は
`openclaw update status --json` を使用します。更新前後の Gateway ログをデバッグしている場合、
コンソールの詳細度とファイルログレベルは別々です。Gateway の `--verbose` は
ターミナル/WebSocket 出力に影響し、ファイルログには設定内の `logging.level: "debug"` または
`"trace"` が必要です。[Gateway ロギング](/ja-JP/gateway/logging) を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の利用可能性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです
（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、
作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

明示的にチャネルを切り替える場合（`--channel ...`）、OpenClaw は
インストール方法も揃えます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の stable リリースより古い場合は
  `latest` にフォールバックします。

OpenClaw にはまだ LTS や月次サポートチャネルはありません。月次サポートラインに向けて取り組んでいますが、
現在 `--channel` が受け付けるのは
`stable`、`beta`、`dev` のみです。特定のパッケージアーティファクトが必要な一度限りの
ターゲットには `--tag <version-or-dist-tag>` を使用してください。

Gateway コアの自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外側で
CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新は、
パッケージの差し替え後に、遅延なし、クールダウンなしの更新再起動を強制します。
これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指す
メモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に
ターゲットパッケージバージョンを解決します。npm グローバルインストールではステージングされた
インストールを使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、
そこでパッケージ化された `dist` インベントリを検証した後、そのクリーンなパッケージツリーを
実際のグローバル prefix に差し替えます。検証に失敗した場合、更新後の doctor、plugin 同期、
再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと
一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 plugin 同期、
コアコマンド補完の更新、再起動作業を実行します。これにより、完全な plugin コマンド補完の再構築は
明示的な `openclaw completion --write-state` 実行に任せつつ、パッケージ化されたサイドカーと
チャネル所有の plugin レコードをインストール済みの OpenClaw ビルドと揃えます。

ローカル管理の Gateway サービスがインストールされており、再起動が有効な場合、
パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、
更新済みインストールからサービスメタデータを更新してからサービスを再起動し、
再起動後の Gateway が想定バージョンを報告することを確認してから成功を報告します。
macOS では、更新後チェックでアクティブなプロファイルの LaunchAgent が読み込まれて実行中であること、
および設定済みのループバックポートが正常であることも確認します。plist がインストールされているが
launchd がそれを監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、
その後でヘルス/バージョン/チャネルの準備完了チェックを再実行します。新規ブートストラップでは
RunAtLoad ジョブを直接読み込むため、更新リカバリーでは新しく生成された Gateway に対して
すぐに `kickstart -k` を実行しません。Gateway がそれでも正常にならない場合、コマンドは
非ゼロで終了し、再起動ログのパスと、明示的な再起動、再インストール、パッケージのロールバック手順を
出力します。`--no-restart` を指定した場合、
パッケージ置き換えは引き続き実行されますが、管理対象サービスは停止または再起動されないため、
手動で再起動するまで実行中の Gateway は古いコードを使い続ける可能性があります。

## Git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非 beta タグをチェックアウトしてから、ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトしてから、fetch と rebase を行います。

### 更新ステップ

<Steps>
  <Step title="クリーンな worktree を確認">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャネルを切り替え">
    選択されたチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を取得">
    dev のみ。
  </Step>
  <Step title="プレフライトビルド（dev のみ）">
    一時 worktree で TypeScript ビルドを実行します。先端が失敗した場合は、最大 10 コミットさかのぼって、ビルド可能な最新コミットを探します。このプレフライト中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI runner より小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミット上に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、更新機能は pnpm workspace 内で `npm run build` を実行するのではなく、必要に応じて `pnpm` をブートストラップします（まず `corepack` 経由、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="コントロール UI をビルド">
    Gateway とコントロール UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` が最後の安全な更新チェックとして実行されます。
  </Step>
  <Step title="plugins を同期">
    plugins をアクティブなチャネルに同期します。dev は同梱 plugins を使用し、stable と beta は npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャネルでは、デフォルト/latest ラインに従う追跡対象の npm および ClawHub plugin インストールは、
まず plugin の `@beta` リリースを試します。plugin に beta リリースがない場合、OpenClaw は
記録済みのデフォルト/latest spec にフォールバックします。npm plugins では、beta パッケージが存在しても
インストール検証に失敗した場合にも OpenClaw はフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm plugin 更新が、保存済みのインストールレコードと integrity が異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを確認した後でのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 plugin に限定された更新後の plugin 同期失敗は、コア更新が成功した後に警告として報告されます。JSON 結果ではトップレベルの更新 `status: "ok"` が維持され、`postUpdate.plugins.status: "warning"` とともに `openclaw doctor --fix` および `openclaw plugins inspect <id> --runtime --json` の案内が報告されます。予期しない更新機能または同期の例外は、引き続き更新結果を失敗にします。plugin インストールまたは更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

更新済みの Gateway が起動するとき、plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーの差し替え後に通常のアイドル遅延と再起動クールダウンを回避するため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、更新機能はチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に更新を実行することを提示します）
- [開発チャネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
