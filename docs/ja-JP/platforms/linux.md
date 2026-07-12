---
read_when:
    - Linuxコンパニオンアプリの状況を確認する
    - プラットフォーム対応またはコントリビューションの計画
    - VPS またはコンテナでの Linux OOM キルや終了コード 137 のデバッグ
summary: Linux サポート + コンパニオンアプリの状況
title: Linux アプリ
x-i18n:
    generated_at: "2026-07-11T22:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway は Linux で完全にサポートされています。推奨ランタイムは Node です。Bun
は推奨されません（WhatsApp/Telegram に既知の問題があります）。

Linux 用のネイティブコンパニオンアプリはまだありません。コントリビューションを歓迎します。

## クイック手順（VPS）

1. Node 24（推奨）または Node 22.19+（LTS、引き続きサポート）をインストールします。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ノートパソコンから、`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>` を実行します。
5. `http://127.0.0.1:18789/` を開き、設定済みの共有シークレット
   （デフォルトではトークン、`gateway.auth.mode` が `"password"` の場合はパスワード）で認証します。

完全なサーバーガイド：[Linux サーバー](/ja-JP/vps)。VPS の手順別の例：
[exe.dev](/ja-JP/install/exe-dev)。

## インストール

- [はじめに](/ja-JP/start/getting-started)
- [インストールと更新](/ja-JP/install/updating)
- 任意：[Bun（実験的）](/ja-JP/install/bun)、[Nix](/ja-JP/install/nix)、[Docker](/ja-JP/install/docker)

## Gateway サービス（systemd）

次のいずれかでインストールします。

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # プロンプトが表示されたら「Gateway サービス」を選択
```

既存のインストールを修復または移行します。

```bash
openclaw doctor
```

`openclaw gateway install` は、デフォルトで systemd の**ユーザー**ユニットを生成します。共有ホストや
常時稼働ホスト向けの**システム**レベルのユニット形式を含む完全なサービスガイダンスについては、
[Gateway 運用ガイド](/ja-JP/gateway#supervision-and-service-lifecycle)を参照してください。

カスタムセットアップの場合のみ、ユニットを手動で作成してください。最小限のユーザーユニットの例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

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

## メモリ負荷と OOM キル

Linux では、ホスト、VM、またはコンテナの cgroup でメモリが不足すると、カーネルが OOM の対象プロセスを
選択します。Gateway は長時間存続するセッションとチャネル接続を保持しているため、対象として適切ではありません。
そのため OpenClaw は、可能な場合に一時的な子プロセスが先に終了されるよう調整します。

対象となる Linux の子プロセスを起動する際、OpenClaw はコマンドを短い
`/bin/sh` シムでラップし、子プロセス自身の `oom_score_adj` を `1000` に引き上げてから、
実際のコマンドを `exec` します。これに特権は必要ありません。プロセスは常に自身の OOM スコアを
引き上げることができます。

対象となる子プロセスの範囲：

- スーパーバイザーが管理するコマンドの子プロセス
- PTY シェルの子プロセス
- MCP stdio サーバーの子プロセス
- OpenClaw が起動するブラウザー/Chrome プロセス（Plugin SDK のプロセスランタイム経由）

このラッパーは Linux 専用です。`/bin/sh` が利用できない場合、または子プロセスの環境変数
`OPENCLAW_CHILD_OOM_SCORE_ADJ` が `0`、`false`、`no`、`off` のいずれかに設定されている場合は
使用されません。

子プロセスを確認します。

```bash
cat /proc/<child-pid>/oom_score_adj
```

対象となる子プロセスの期待値は `1000` です。Gateway プロセス自体は通常のスコア
（通常は `0`）を維持します。

systemd ユニットの `OOMPolicy=continue` により、一時的な子プロセスが OOM キラーの対象になった場合でも、
ユニット全体を失敗として扱ってすべてのチャネルを再起動するのではなく、Gateway サービスを稼働させ続けます。
失敗した子プロセスまたはセッションは、それ自身のエラーを報告します。

これは通常のメモリ調整に代わるものではありません。VPS またはコンテナで子プロセスが繰り返し終了される場合は、
メモリ上限を引き上げるか、同時実行数を減らすか、より強力なリソース制御
（systemd の `MemoryMax=`、コンテナのメモリ上限）を追加してください。

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [Raspberry Pi](/ja-JP/install/raspberry-pi)
- [Gateway 運用ガイド](/ja-JP/gateway)
- [Gateway の設定](/ja-JP/gateway/configuration)
