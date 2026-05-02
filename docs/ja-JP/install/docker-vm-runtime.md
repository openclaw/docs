---
read_when:
    - Docker を使用してクラウド VM に OpenClaw をデプロイしています
    - 共有バイナリのベイク、永続化、更新フローが必要です
summary: 長期稼働する OpenClaw Gateway ホスト向けの共有 Docker VM ランタイム手順
title: Docker VM ランタイム
x-i18n:
    generated_at: "2026-05-02T04:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP、Hetzner、および同様の VPS プロバイダーなど、VM ベースの Docker インストールで共有されるランタイム手順。

## 必要なバイナリをイメージに組み込む

実行中のコンテナ内にバイナリをインストールするのは落とし穴です。
ランタイムにインストールしたものは、再起動すると失われます。

スキルに必要な外部バイナリはすべて、イメージのビルド時にインストールする必要があります。

以下の例では、一般的なバイナリを 3 つだけ示しています。

- Gmail アクセス用の `gog`（`gogcli` 由来）
- Google Places 用の `goplaces`
- WhatsApp 用の `wacli`

これらは例であり、完全な一覧ではありません。
同じパターンを使って、必要な数だけバイナリをインストールできます。

追加のバイナリに依存する新しいスキルを後で追加する場合は、次を行う必要があります。

1. Dockerfile を更新する
2. イメージを再ビルドする
3. コンテナを再起動する

**Dockerfile の例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
上記の URL は例です。ARM ベースの VM では、`arm64` アセットを選択してください。再現可能なビルドには、バージョン付きリリース URL を固定してください。
</Note>

## ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 中に `Killed` または `exit code 137` でビルドが失敗する場合、VM のメモリが不足しています。
再試行する前に、より大きいマシンクラスを使用してください。

バイナリを確認します。

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

期待される出力:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway を確認します。

```bash
docker compose logs -f openclaw-gateway
```

期待される出力:

```
[gateway] listening on ws://0.0.0.0:18789
```

## 何がどこに永続化されるか

OpenClaw は Docker で動作しますが、Docker は信頼できる情報源ではありません。
長期的に保持される状態はすべて、再起動、再ビルド、リブート後も残る必要があります。

| コンポーネント      | 場所                                                   | 永続化メカニズム        | 注記                                                          |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Gateway 設定        | `/home/node/.openclaw/`                                | ホストボリュームマウント | `openclaw.json`、`.env` を含む                                |
| モデル認証プロファイル | `/home/node/.openclaw/agents/`                         | ホストボリュームマウント | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API キー） |
| スキル設定          | `/home/node/.openclaw/skills/`                         | ホストボリュームマウント | スキルレベルの状態                                            |
| エージェントワークスペース | `/home/node/.openclaw/workspace/`                      | ホストボリュームマウント | コードとエージェント成果物                                    |
| WhatsApp セッション | `/home/node/.openclaw/`                                | ホストボリュームマウント | QR ログインを保持                                             |
| Gmail キーリング    | `/home/node/.openclaw/`                                | ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要                                 |
| Plugin パッケージ   | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | ホストボリュームマウント | ダウンロード可能な Plugin パッケージルート                    |
| 外部バイナリ        | `/usr/local/bin/`                                      | Docker イメージ         | ビルド時に組み込む必要がある                                  |
| Node ランタイム     | コンテナファイルシステム                               | Docker イメージ         | イメージのビルドごとに再ビルドされる                          |
| OS パッケージ       | コンテナファイルシステム                               | Docker イメージ         | ランタイムにインストールしない                                |
| Docker コンテナ     | 一時的                                                | 再起動可能              | 破棄しても安全                                                |

## 更新

VM 上の OpenClaw を更新するには:

```bash
git pull
docker compose build
docker compose up -d
```

## 関連

- [Docker](/ja-JP/install/docker)
- [Podman](/ja-JP/install/podman)
- [ClawDock](/ja-JP/install/clawdock)
