---
read_when:
    - Linux コンパニオンアプリのステータスを確認しています
    - プラットフォーム対応範囲やコントリビューションの計画
    - VPS またはコンテナでの Linux OOM kill または終了コード 137 のデバッグ
summary: Linuxサポート + コンパニオンアプリのステータス
title: Linux アプリ
x-i18n:
    generated_at: "2026-07-05T11:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway は Linux で完全にサポートされています。Node が推奨ランタイムです。Bun
は推奨されません（WhatsApp/Telegram の既知の問題があります）。

Linux ネイティブのコンパニオンアプリはまだありません。コントリビューションを歓迎します。

## クイックパス (VPS)

1. Node 24（推奨）または Node 22.19+（LTS、引き続きサポート）をインストールします。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ラップトップから: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットで認証します
   （デフォルトはトークン、`gateway.auth.mode` が `"password"` の場合はパスワード）。

完全なサーバーガイド: [Linux サーバー](/ja-JP/vps)。ステップごとの VPS 例:
[exe.dev](/ja-JP/install/exe-dev)。

## インストール

- [はじめに](/ja-JP/start/getting-started)
- [インストールと更新](/ja-JP/install/updating)
- 任意: [Bun（実験的）](/ja-JP/install/bun)、[Nix](/ja-JP/install/nix)、[Docker](/ja-JP/install/docker)

## Gateway サービス (systemd)

次のいずれかでインストールします。

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

既存のインストールを修復または移行します。

```bash
openclaw doctor
```

`openclaw gateway install` はデフォルトで systemd **user** ユニットを生成します。共有ホストや
常時稼働ホスト向けの **system** レベルのユニットバリアントを含む完全な
サービスガイダンスは、[Gateway ランブック](/ja-JP/gateway#supervision-and-service-lifecycle)にあります。

カスタムセットアップの場合のみ、手動でユニットを作成してください。最小限の user ユニット例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）:

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

有効化します。

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## メモリ圧迫と OOM kill

Linux では、ホスト、VM、またはコンテナ cgroup のメモリが不足すると、カーネルが OOM の対象プロセスを選択します。Gateway は長時間存続する
セッションとチャンネル接続を所有するため、対象として適していません。そのため OpenClaw は、可能な場合に一時的な子
プロセスが先に kill されるようにします。

対象となる Linux の子プロセス起動では、OpenClaw は短い
`/bin/sh` shim でコマンドをラップし、子自身の `oom_score_adj` を `1000` に上げてから、
実際のコマンドを `exec` します。これは権限不要です。プロセスは常に
自身の OOM スコアを上げることができます。

対象となる子プロセスの範囲:

- スーパーバイザー管理のコマンド子プロセス
- PTY シェル子プロセス
- MCP stdio サーバー子プロセス
- OpenClaw が起動したブラウザー/Chrome プロセス（Plugin SDK プロセスランタイム経由）

このラッパーは Linux 専用で、`/bin/sh` が利用できない場合、または
子プロセスの env で `OPENCLAW_CHILD_OOM_SCORE_ADJ` が `0`、`false`、`no`、または
`off` に設定されている場合はスキップされます。

子プロセスを確認します。

```bash
cat /proc/<child-pid>/oom_score_adj
```

対象となる子プロセスの期待値は `1000` です。Gateway プロセス自体は
通常のスコア（一般的には `0`）を維持します。

systemd ユニットの `OOMPolicy=continue` により、一時的な子プロセスが OOM killer に選択された場合でも、
ユニット全体を失敗としてマークしてすべてのチャンネルを再起動するのではなく、Gateway サービスを稼働させ続けます。失敗した子プロセス/セッションは
自身のエラーを報告します。

これは通常のメモリチューニングを置き換えるものではありません。VPS やコンテナが繰り返し
子プロセスを kill する場合は、メモリ制限を引き上げるか、並行数を減らすか、より強い
リソース制御（systemd `MemoryMax=`、コンテナのメモリ制限）を追加してください。

## 関連

- [インストール概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [Raspberry Pi](/ja-JP/install/raspberry-pi)
- [Gateway ランブック](/ja-JP/gateway)
- [Gateway 設定](/ja-JP/gateway/configuration)
