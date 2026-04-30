---
read_when:
    - Docker を使用してクラウド VM に OpenClaw をデプロイしています。
    - 共有バイナリのベイク、永続化、更新フローが必要です
summary: 長期間稼働する OpenClaw Gateway ホスト向けの共有 Docker VM ランタイム手順
title: Docker VM ランタイム
x-i18n:
    generated_at: "2026-04-30T05:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP、Hetzner、および同様の VPS プロバイダーなど、VM ベースの Docker インストール向けの共通ランタイム手順。

## 必要なバイナリをイメージに焼き込む

実行中のコンテナ内にバイナリをインストールするのは落とし穴です。
実行時にインストールされたものは、再起動時に失われます。

Skills に必要な外部バイナリはすべて、イメージのビルド時にインストールする必要があります。

以下の例では、一般的なバイナリを 3 つだけ示しています。

- Gmail アクセス用の `gog`（`gogcli` 由来）
- Google Places 用の `goplaces`
- WhatsApp 用の `wacli`

これらは例であり、完全な一覧ではありません。
同じパターンを使って、必要な数だけバイナリをインストールできます。

後で追加のバイナリに依存する新しい Skills を追加する場合は、次を行う必要があります。

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
再試行する前に、より大きなマシンクラスを使用してください。

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

OpenClaw は Docker 内で実行されますが、Docker は信頼できる唯一の情報源ではありません。
長期間保持される状態はすべて、再起動、再ビルド、リブート後も維持される必要があります。

| コンポーネント      | 場所                                     | 永続化メカニズム       | 注記                                                          |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway 設定        | `/home/node/.openclaw/`                  | ホストボリュームマウント | `openclaw.json`、`.env` を含む                                |
| モデル認証プロファイル | `/home/node/.openclaw/agents/`           | ホストボリュームマウント | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API キー） |
| Skills 設定         | `/home/node/.openclaw/skills/`           | ホストボリュームマウント | Skills レベルの状態                                           |
| エージェントワークスペース | `/home/node/.openclaw/workspace/`        | ホストボリュームマウント | コードとエージェント成果物                                    |
| WhatsApp セッション | `/home/node/.openclaw/`                  | ホストボリュームマウント | QR ログインを保持                                             |
| Gmail キーリング    | `/home/node/.openclaw/`                  | ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要                                 |
| Plugin ランタイム依存関係 | `/var/lib/openclaw/plugin-runtime-deps/` | Docker 名前付きボリューム | 生成された同梱 Plugin 依存関係とランタイムミラー              |
| 外部バイナリ        | `/usr/local/bin/`                        | Docker イメージ         | ビルド時に焼き込む必要がある                                  |
| Node ランタイム     | コンテナファイルシステム                 | Docker イメージ         | イメージビルドのたびに再ビルドされる                         |
| OS パッケージ       | コンテナファイルシステム                 | Docker イメージ         | 実行時にインストールしない                                    |
| Docker コンテナ     | 一時的                                  | 再起動可能             | 破棄しても安全                                               |

## 更新

VM 上の OpenClaw を更新するには:

```bash
git pull
docker compose build
docker compose up -d
```

## 関連項目

- [Docker](/ja-JP/install/docker)
- [Podman](/ja-JP/install/podman)
- [ClawDock](/ja-JP/install/clawdock)
