---
read_when:
    - Linux コンパニオンアプリの状況を探している場合
    - プラットフォーム対応範囲やコントリビューションを計画している場合
    - VPS やコンテナーでの Linux OOM kill や exit 137 をデバッグする შემთხვევაში
summary: Linux サポートとコンパニオンアプリの状況
title: Linux アプリ
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway は Linux で完全にサポートされています。**Node が推奨ランタイム**です。
Gateway に Bun は推奨されません（WhatsApp/Telegram のバグがあります）。

ネイティブ Linux コンパニオンアプリは計画中です。構築を手伝いたい場合、コントリビューションを歓迎します。

## 初心者向けクイックパス（VPS）

1. Node 24 をインストールする（推奨。互換性のため Node 22 LTS、現在 `22.14+` も引き続き動作します）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ノート PC から: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開き、設定済み shared secret で認証する（デフォルトは token。`gateway.auth.mode: "password"` を設定した場合は password）

完全な Linux サーバーガイド: [Linux Server](/ja-JP/vps)。ステップごとの VPS 例: [exe.dev](/ja-JP/install/exe-dev)

## インストール

- [Getting Started](/ja-JP/start/getting-started)
- [Install & updates](/ja-JP/install/updating)
- 任意のフロー: [Bun (experimental)](/ja-JP/install/bun), [Nix](/ja-JP/install/nix), [Docker](/ja-JP/install/docker)

## Gateway

- [Gateway runbook](/ja-JP/gateway)
- [Configuration](/ja-JP/gateway/configuration)

## Gateway service インストール（CLI）

次のいずれかを使ってください。

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

プロンプトが出たら **Gateway service** を選択します。

修復/移行:

```
openclaw doctor
```

## システム制御（systemd ユーザー unit）

OpenClaw はデフォルトで systemd **ユーザー** service をインストールします。共有または常時稼働サーバーには **system**
service を使ってください。`openclaw gateway install` と
`openclaw onboard --install-daemon` は、現在の正規 unit
をすでに生成してくれます。手で unit を書くのは、カスタムの system/service-manager
セットアップが必要なときだけにしてください。完全な service ガイダンスは [Gateway runbook](/ja-JP/gateway) にあります。

最小セットアップ:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

有効化します。

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## メモリ圧迫と OOM kill

Linux では、ホスト、VM、またはコンテナー cgroup の
メモリが不足すると、カーネルが OOM victim を選びます。Gateway は長寿命の
セッションとチャンネル接続を所有しているため、不適切な victim になりがちです。OpenClaw はそのため、
可能な場合、Gateway より先に一時的な子プロセスが kill されるようにバイアスをかけています。

対象となる Linux の子プロセス起動では、OpenClaw は短い
`/bin/sh` ラッパーを通して子を起動し、その子自身の `oom_score_adj` を `1000` に上げてから、
実際のコマンドを `exec` します。これは非特権操作です。子が
自分自身の OOM kill されやすさを増やすだけだからです。

対象となる子プロセスサーフェスには次が含まれます。

- supervisor 管理の command 子プロセス、
- PTY シェル子プロセス、
- MCP stdio server 子プロセス、
- OpenClaw が起動した browser/Chrome プロセス。

このラッパーは Linux 専用で、`/bin/sh` が利用できない場合はスキップされます。また、
子プロセス env に `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, `off` のいずれかが設定されている場合もスキップされます。

子プロセスを確認するには:

```bash
cat /proc/<child-pid>/oom_score_adj
```

対象子プロセスの期待値は `1000` です。Gateway プロセスは通常、
通常のスコア、たいてい `0` を維持します。

これは通常のメモリ調整の代わりではありません。VPS やコンテナーで繰り返し
子プロセスが kill される場合は、メモリ上限を増やすか、並列度を下げるか、
systemd の `MemoryMax=` やコンテナーレベルのメモリ制限など、より強い
リソース制御を追加してください。

## 関連

- [Install overview](/ja-JP/install)
- [Linux server](/ja-JP/vps)
- [Raspberry Pi](/ja-JP/install/raspberry-pi)
