---
read_when:
    - OpenClaw を更新する
    - 更新後に何かが壊れた場合
summary: OpenClaw を安全に更新する方法（グローバルインストールまたはソース）とロールバック戦略
title: 更新する
x-i18n:
    generated_at: "2026-04-24T05:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

OpenClaw を最新の状態に保ってください。

## 推奨: `openclaw update`

最も速い更新方法です。インストール方式（npm または git）を検出し、最新バージョンを取得して、`openclaw doctor` を実行し、gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定バージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta` は beta を優先しますが、beta タグが存在しないか、最新 stable リリースより古い場合は、ランタイムは stable/latest にフォールバックします。一度だけ raw npm beta dist-tag を使ってパッケージ更新したい場合は `--tag beta` を使ってください。

チャンネルの意味については [Development channels](/ja-JP/install/development-channels) を参照してください。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。ソースインストールでは、`--install-method git --no-onboard` を渡してください。

## 代替: 手動で npm、pnpm、または bun を使う

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### root 所有のグローバル npm インストール

一部の Linux npm セットアップでは、グローバルパッケージが
`/usr/lib/node_modules/openclaw` のような root 所有ディレクトリにインストールされます。OpenClaw はこのレイアウトをサポートします。インストール済み
パッケージはランタイムでは読み取り専用として扱われ、同梱 Plugin のランタイム
依存関係は、パッケージツリーを変更する代わりに、書き込み可能なランタイムディレクトリに staging されます。

hardened systemd unit では、`ReadWritePaths` に含まれる書き込み可能な stage ディレクトリを設定してください。

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR` が設定されていない場合、OpenClaw は systemd が提供する `$STATE_DIRECTORY` を使い、それもなければ `~/.openclaw/plugin-runtime-deps` にフォールバックします。

## 自動アップデーター

自動アップデーターはデフォルトで無効です。`~/.openclaw/openclaw.json` で有効にします。

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

| Channel | 動作 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` 全体に決定的 jitter を入れて適用します（段階的ロールアウト）。 |
| `beta` | `betaCheckIntervalHours` ごとにチェックし（デフォルト: 毎時）、即時適用します。 |
| `dev` | 自動適用はしません。手動で `openclaw update` を使ってください。 |

gateway は起動時にも更新ヒントをログに出します（無効化するには `update.checkOnStart: false`）。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

config を移行し、DM ポリシーを監査し、gateway の健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### gateway を再起動する

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

ヒント: `npm view openclaw version` で現在公開されているバージョンを確認できます。

### コミットを固定する（source）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`

## 行き詰まった場合

- `openclaw doctor` をもう一度実行し、出力を注意深く読んでください。
- source checkout 上で `openclaw update --channel dev` を使う場合、updater は必要に応じて自動で `pnpm` をブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールするか（または `corepack` を再有効化して）、更新を再実行してください。
- 確認先: [Troubleshooting](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Doctor](/ja-JP/gateway/doctor) — 更新後のヘルスチェック
- [Migrating](/ja-JP/install/migrating) — メジャーバージョン移行ガイド
