---
read_when:
    - Docker を使ってクラウド VM に OpenClaw をデプロイする場合
    - 共有バイナリの bake、永続化、更新フローが必要な場合
summary: 長期間稼働する OpenClaw Gateway ホスト向けの共有 Docker VM ランタイム手順
title: Docker VM ランタイム
x-i18n:
    generated_at: "2026-04-24T05:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

GCP、Hetzner、および同様の VPS プロバイダーなど、VM ベースの Docker インストール向けの共有ランタイム手順です。

## 必要なバイナリをイメージに bake する

実行中のコンテナー内でバイナリをインストールするのは罠です。
ランタイムでインストールされたものは、再起動時に失われます。

skills が必要とするすべての外部バイナリは、イメージビルド時にインストールしなければなりません。

以下の例では、一般的な 3 つのバイナリのみを示しています。

- Gmail アクセス用の `gog`
- Google Places 用の `goplaces`
- WhatsApp 用の `wacli`

これらは例であり、完全な一覧ではありません。
同じパターンで必要なだけバイナリをインストールできます。

後から追加のバイナリに依存する新しい skills を追加した場合、次を行う必要があります。

1. Dockerfile を更新する
2. イメージを rebuild する
3. コンテナーを再起動する

**Dockerfile の例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 例のバイナリ 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 例のバイナリ 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 例のバイナリ 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 以下に同じパターンでさらにバイナリを追加

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
上記のダウンロード URL は x86_64（amd64）向けです。ARM ベースの VM（例: Hetzner ARM、GCP Tau T2A）では、各ツールのリリースページにある適切な ARM64 版 URL に置き換えてください。
</Note>

## ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 中に `Killed` または `exit code 137` で build が失敗する場合、その VM はメモリ不足です。
再試行する前に、より大きなマシンクラスを使ってください。

バイナリ確認:

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

Gateway 確認:

```bash
docker compose logs -f openclaw-gateway
```

期待される出力:

```
[gateway] listening on ws://0.0.0.0:18789
```

## 何がどこに永続化されるか

OpenClaw は Docker 内で動作しますが、Docker 自体が正本ではありません。
すべての長寿命状態は、再起動、rebuild、再起動後も生き残らなければなりません。

| コンポーネント | 場所 | 永続化メカニズム | 注記 |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway config | `/home/node/.openclaw/` | ホスト volume mount | `openclaw.json`, `.env` を含む |
| モデル auth profile | `/home/node/.openclaw/agents/` | ホスト volume mount | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API keys） |
| Skill config | `/home/node/.openclaw/skills/` | ホスト volume mount | Skill レベル状態 |
| エージェント workspace | `/home/node/.openclaw/workspace/` | ホスト volume mount | コードとエージェント成果物 |
| WhatsApp セッション | `/home/node/.openclaw/` | ホスト volume mount | QR ログインを保持 |
| Gmail keyring | `/home/node/.openclaw/` | ホスト volume + password | `GOG_KEYRING_PASSWORD` が必要 |
| 外部バイナリ | `/usr/local/bin/` | Docker イメージ | ビルド時に bake する必要あり |
| Node ランタイム | コンテナー filesystem | Docker イメージ | イメージ build ごとに rebuild される |
| OS パッケージ | コンテナー filesystem | Docker イメージ | ランタイムでインストールしないこと |
| Docker コンテナー | 一時的 | 再起動可能 | 破棄しても安全 |

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
