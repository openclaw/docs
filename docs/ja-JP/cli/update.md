---
read_when:
    - ソースのチェックアウトを安全に更新したい
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略表記の挙動を理解する必要があります'
summary: 'CLI リファレンス: `openclaw update`（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-11T20:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネルを切り替えます。

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

- `--no-restart`: 更新が成功した後、Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが想定される更新後バージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新だけに対してパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: 設定の書き込み、インストール、プラグイン同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。これには、
  コア更新が成功した後に破損またはロード不能な管理対象プラグインの修復が必要な場合の
  `postUpdate.plugins.warnings`、プラグインに beta リリースがない場合の beta チャンネルプラグインフォールバック詳細、
  および更新後のプラグイン同期中に npm プラグインアーティファクトのドリフトが検出された場合の `postUpdate.plugins.integrityDrifts`
  が含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800s）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されている
チャンネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、機械可読の
結果には `--json` を、チャンネルと
利用可能性の詳細だけが必要な場合は `openclaw update status --json` を使用します。更新周辺の Gateway ログをデバッグしている場合、
コンソールの詳細度とファイルログレベルは別です。Gateway の `--verbose` は
ターミナル/WebSocket 出力に影響しますが、ファイルログには設定内の `logging.level: "debug"` または
`"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用します。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンは設定を壊す可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャンネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の利用可能性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読のステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3s）。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうかを確認する
対話型フローです（デフォルトでは再起動します）。git チェックアウトなしで `dev` を選択した場合、
作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 動作内容

明示的にチャンネルを切り替える（`--channel ...`）と、OpenClaw は
インストール方法も揃えた状態に保ちます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が
  存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コア自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で
CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー
更新では、パッケージ入れ替え後に、遅延なし、クールダウンなしの更新再起動を強制します。
古い Gateway プロセスには、新しいパッケージによって削除されたファイルを指す
インメモリチャンクがまだ残っている可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に
ターゲットパッケージバージョンを解決します。npm グローバルインストールではステージングされた
インストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、
そこでパッケージされた `dist` インベントリを検証してから、そのクリーンなパッケージツリーを
実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、プラグイン同期、
再起動作業は疑わしいツリーから実行されません。インストール済みバージョンが
すでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、
その後にプラグイン同期、コアコマンド補完の更新、再起動作業を実行します。これにより、
明示的な `openclaw completion --write-state` 実行に完全なプラグインコマンド補完の再構築を残しつつ、
パッケージされたサイドカーとチャンネル所有のプラグインレコードを
インストール済みの OpenClaw ビルドと揃えた状態に保ちます。

ローカルの管理対象 Gateway サービスがインストールされ、再起動が有効な場合、
パッケージマネージャー更新は、パッケージツリーを置き換える前に実行中のサービスを停止し、
更新済みインストールからサービスメタデータを更新し、サービスを再起動して、
成功を報告する前に再起動された Gateway が想定バージョンを報告することを検証します。macOS では、更新後チェックで、アクティブプロファイルの LaunchAgent が
ロード済み/実行中であり、設定された loopback ポートが
正常であることも検証します。plist がインストールされているが launchd が監視していない場合、OpenClaw は
LaunchAgent を自動的に再ブートストラップし、その後
ヘルス/バージョン/チャンネル準備完了チェックを再実行します。新しいブートストラップでは RunAtLoad
ジョブを直接ロードするため、更新リカバリは新たに
生成された Gateway に対してすぐに `kickstart -k` を実行しません。Gateway がそれでも正常にならない場合、コマンドは
非ゼロで終了し、再起動ログパスに加えて、明示的な再起動、再インストール、
パッケージロールバック手順を出力します。`--no-restart` を指定すると、
パッケージ置換は引き続き実行されますが、管理対象サービスは停止または
再起動されないため、手動で再起動するまで実行中の Gateway は古いコードを保持する可能性があります。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を行います。

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
    一時ワークツリーで TypeScript ビルドを実行します。先端が失敗した場合、最新のビルド可能なコミットを見つけるため最大 10 コミットまで戻ります。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミットに rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、updater は pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack` 経由、その後一時的な `npm install pnpm@11` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` が最後の安全更新チェックとして実行されます。
  </Step>
  <Step title="プラグインを同期">
    プラグインをアクティブなチャンネルに同期します。Dev は同梱プラグインを使用し、stable と beta は npm を使用します。追跡対象のプラグインインストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、デフォルト/latest ラインに従う追跡対象の npm および ClawHub プラグインインストールは、
最初にプラグインの `@beta` リリースを試します。プラグインに
beta リリースがない場合、OpenClaw は記録されたデフォルト/latest spec にフォールバックし、
それを警告として報告します。npm プラグインでは、beta
パッケージが存在してもインストール検証に失敗した場合も OpenClaw はフォールバックします。これらのプラグインフォールバック警告によって
コア更新が失敗することはありません。厳密なバージョンと明示的なタグは
書き換えられません。

<Warning>
厳密にピン留めされた npm プラグイン更新が、保存済みインストールレコードと integrity が異なるアーティファクトに解決された場合、`openclaw update` はそれをインストールする代わりに、そのプラグインアーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後でのみ、プラグインを明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象プラグインにスコープされた更新後プラグイン同期の失敗は、コア更新が成功した後に警告として報告されます。JSON 結果では、トップレベルの更新 `status: "ok"` を維持し、`openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` の案内とともに `postUpdate.plugins.status: "warning"` を報告します。予期しない updater または同期例外は引き続き更新結果を失敗にします。プラグインインストールまたは更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

更新された Gateway が起動するとき、プラグイン読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが入れ替えられた後、通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗した場合、updater はチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 短縮形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは最初に update を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
