---
read_when:
    - Linux コンパニオンアプリのステータスを探しています
    - プラットフォーム対応範囲またはコントリビューションの計画
    - VPS またはコンテナでの Linux OOM kill や終了コード 137 のデバッグ
summary: Linux サポート + コンパニオンアプリの状態
title: Linux アプリ
x-i18n:
    generated_at: "2026-06-27T12:03:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway は Linux で完全にサポートされています。**Node が推奨ランタイムです**。
Bun は Gateway では推奨されません（WhatsApp/Telegram のバグ）。

ネイティブ Linux コンパニオンアプリは計画中です。開発に協力したい場合は、コントリビューションを歓迎します。

## 初心者向けクイックパス（VPS）

1. Node 24 をインストールします（推奨。Node 22 LTS、現在は `22.19+` も互換性のため引き続き動作します）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ラップトップから: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットで認証します（デフォルトではトークン。`gateway.auth.mode: "password"` を設定した場合はパスワード）

完全な Linux サーバーガイド: [Linux Server](/ja-JP/vps)。ステップごとの VPS 例: [exe.dev](/ja-JP/install/exe-dev)

## インストール

- [はじめに](/ja-JP/start/getting-started)
- [インストールと更新](/ja-JP/install/updating)
- 任意のフロー: [Bun（実験的）](/ja-JP/install/bun), [Nix](/ja-JP/install/nix), [Docker](/ja-JP/install/docker)

## Gateway

- [Gateway ランブック](/ja-JP/gateway)
- [設定](/ja-JP/gateway/configuration)

## Gateway サービスのインストール（CLI）

次のいずれかを使用します。

```
openclaw onboard --install-daemon
```

または:

```
openclaw gateway install
```

または:

```
openclaw configure
```

プロンプトが表示されたら **Gateway service** を選択します。

修復/移行:

```
openclaw doctor
```

## システム制御（systemd ユーザーユニット）

OpenClaw はデフォルトで systemd **ユーザー**サービスをインストールします。共有サーバーや常時稼働サーバーには **system** サービスを使用します。`openclaw gateway install` と
`openclaw onboard --install-daemon` は、すでに現在の標準ユニットをレンダリングします。カスタムのシステム/サービスマネージャー設定が必要な場合にのみ、手動で作成してください。完全なサービスガイダンスは [Gateway ランブック](/ja-JP/gateway) にあります。

最小構成:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` を作成します。

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

有効化します。

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## メモリ圧迫と OOM kill

Linux では、ホスト、VM、またはコンテナー cgroup のメモリが枯渇すると、カーネルが OOM の犠牲プロセスを選択します。Gateway は長寿命のセッションとチャンネル接続を保持するため、犠牲プロセスとしては不適切な場合があります。そのため OpenClaw は、可能な場合に一時的な子プロセスが Gateway より先に kill されるように調整します。

対象となる Linux 子プロセスの起動では、OpenClaw は短い
`/bin/sh` ラッパーを通じて子プロセスを開始し、その子プロセス自身の `oom_score_adj` を `1000` に上げてから、実際のコマンドを
`exec` します。子プロセスが自分自身の OOM kill される可能性だけを高めるため、これは非特権操作です。

対象となる子プロセスのサーフェスは次のとおりです。

- supervisor 管理のコマンド子プロセス、
- PTY シェル子プロセス、
- MCP stdio サーバー子プロセス、
- OpenClaw が起動したブラウザー/Chrome プロセス。

このラッパーは Linux 専用であり、`/bin/sh` が利用できない場合はスキップされます。また、子プロセスの env が `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no`、または `off` を設定している場合もスキップされます。

子プロセスを確認するには:

```bash
cat /proc/<child-pid>/oom_score_adj
```

対象の子プロセスで期待される値は `1000` です。Gateway プロセスは通常のスコア、通常は `0` を維持する必要があります。

推奨される systemd ユニットでは `OOMPolicy=continue` も設定します。これにより、一時的な子プロセスが OOM killer によって選択された場合でも Gateway ユニットは稼働し続けます。子コマンド/セッションは失敗してエラーを報告できますが、systemd が gateway サービス全体を失敗扱いにしてすべてのチャンネルを再起動することはありません。

これは通常のメモリ調整を置き換えるものではありません。VPS やコンテナーが子プロセスを繰り返し kill する場合は、メモリ制限を増やす、並行数を減らす、または systemd `MemoryMax=` やコンテナーレベルのメモリ制限など、より強力なリソース制御を追加してください。

## 関連

- [インストール概要](/ja-JP/install)
- [Linux サーバー](/ja-JP/vps)
- [Raspberry Pi](/ja-JP/install/raspberry-pi)
