---
read_when:
    - OpenClaw の更新
    - 更新後に何かが壊れる
summary: OpenClaw を安全に更新する方法（グローバルインストールまたはソース）、およびロールバック戦略
title: 更新പ്പെടുത്തියെന്ന്
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

OpenClaw を最新の状態に保ってください。

## 推奨: `openclaw update`

これが最も速い更新方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gatewayを再起動します。

```bash
openclaw update
```

チャネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta` はbetaを優先しますが、betaタグが存在しない、または最新のstableリリースより古い場合、ランタイムはstable/latestにフォールバックします。単発のパッケージ更新で生のnpm beta dist-tagを使いたい場合は `--tag beta` を使用してください。

チャネルの意味については [Development channels](/ja-JP/install/development-channels) を参照してください。

## npmインストールとgitインストールを切り替える

インストール種別を変更したい場合はチャネルを使ってください。updater は `~/.openclaw` 内の
state、config、credentials、workspace を保持し、CLIとgatewayが使う
OpenClawコードのインストール先だけを変更します。

```bash
# npm package install -> 編集可能なgit checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

インストールモードの切り替え内容を事前確認するには、まず `--dry-run` を実行してください。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャネルは git checkout を確保し、ビルドし、そのcheckoutからグローバルCLIをインストールします。`stable` と `beta` チャネルはパッケージインストールを使います。gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または
`--install-method npm --no-onboard` を渡してください。

## 代替: 手動の npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

`openclaw update` がグローバルnpmインストールを管理する場合、まず通常の
グローバルインストールコマンドを実行します。そのコマンドが失敗した場合、OpenClaw は
`--omit=optional` を付けて1回だけ再試行します。この再試行は、ネイティブのoptional dependencies を
コンパイルできないホストで役立ちつつ、フォールバックも失敗した場合は元の失敗を見えるままに保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### グローバルnpmインストールとランタイム依存関係

OpenClaw は、現在のユーザーがグローバルパッケージディレクトリに書き込み可能な場合でも、
パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。バンドル済みPlugin の
ランタイム依存関係は、パッケージツリーを変更する代わりに、書き込み可能なランタイムディレクトリへ
ステージされます。これにより、`openclaw update` が、同じインストール中に
Plugin 依存関係を修復している稼働中のgatewayやローカルagentと競合するのを防ぎます。

一部のLinuxのnpmセットアップでは、グローバルパッケージは `/usr/lib/node_modules/openclaw` のような
root所有ディレクトリ配下にインストールされます。OpenClaw は同じ外部ステージングパスにより、
そのレイアウトをサポートします。

hardened なsystemd unit では、`ReadWritePaths` に含まれる書き込み可能な
ステージディレクトリを設定してください。

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` が設定されていない場合、OpenClaw はsystemdが提供する `$STATE_DIRECTORY` を使い、
それがなければ `~/.openclaw/plugin-runtime-deps` にフォールバックします。
修復ステップでは、そのステージを OpenClaw 所有のローカルパッケージroot として扱い、
ユーザーのnpm prefix/global設定は無視するため、グローバルインストールのnpm config によって
バンドル済みPlugin 依存関係が `~/node_modules` やグローバルパッケージツリーへ
リダイレクトされることはありません。

パッケージ更新およびバンドル済みランタイム依存関係の修復前に、OpenClaw は
対象volume に対してベストエフォートのディスク空き容量チェックを試みます。空き容量不足では
確認したパス付きの警告が出ますが、filesystem quotas、
snapshots、network volumes はチェック後に変わる可能性があるため、更新はブロックされません。実際のnpm
install、コピー、post-install 検証が最終的な判定になります。

### バンドル済みPlugin ランタイム依存関係

パッケージインストールでは、バンドル済みPlugin ランタイム依存関係は読み取り専用の
パッケージツリーの外に保持されます。起動時および `openclaw doctor --fix` の間、OpenClaw は
configで有効、従来のchannel config 経由で有効、またはバンドル済みmanifestのデフォルトで有効な
バンドル済みPlugins に対してのみランタイム依存関係を修復します。永続化された
channel auth state だけでは、Gateway起動時のランタイム依存関係修復はトリガーされません。

明示的な無効化が優先されます。無効なPlugin またはchannelは、単にパッケージ内に存在するという理由だけで
ランタイム依存関係を修復されることはありません。外部Plugins やカスタムload path は引き続き
`openclaw plugins install` または `openclaw plugins update` を使います。

## 自動updater

自動updater はデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にしてください。

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| チャネル | 動作 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機してから、`stableJitterHours` 全体に決定的ジッターをかけて適用します（段階的ロールアウト）。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 毎時）に確認し、即時適用します。 |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用してください。 |

gateway は起動時にも更新ヒントをログ出力します（`update.checkOnStart: false` で無効化）。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

config を移行し、DM policies を監査し、gatewayの健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### gatewayを再起動する

```bash
openclaw gateway restart
```

### 確認する

```bash
openclaw health
```

</Steps>

## ロールバック

### バージョンを固定する（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

ヒント: `npm view openclaw version` で現在公開されているバージョンを表示できます。

### コミットを固定する（source）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- もう一度 `openclaw doctor` を実行し、出力を注意深く読んでください。
- source checkout に対する `openclaw update --channel dev` では、必要に応じて updater が `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが出た場合は、`pnpm` を手動でインストールするか（または `corepack` を再有効化して）、更新を再実行してください。
- 確認先: [Troubleshooting](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Doctor](/ja-JP/gateway/doctor) — 更新後のヘルスチェック
- [Migrating](/ja-JP/install/migrating) — メジャーバージョン移行ガイド
