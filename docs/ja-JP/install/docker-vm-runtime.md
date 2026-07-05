---
read_when:
    - Docker を使用してクラウド VM に OpenClaw をデプロイしています
    - 共有バイナリのベイク、永続化、更新フローが必要です
summary: 長期稼働する OpenClaw Gateway ホスト向けの共有 Docker VM ランタイム手順
title: Docker VM ランタイム
x-i18n:
    generated_at: "2026-07-05T11:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP、Hetzner、および類似の VPS プロバイダーなど、VM ベースの Docker インストール向けの共有ランタイム手順。

## 必要なバイナリをイメージに組み込む

実行中のコンテナ内でバイナリをインストールするのは罠です。ランタイムでインストールされたものは、再起動時に失われます。スキルが必要とするすべての外部バイナリを、ビルド時にイメージへ組み込んでください。

以下の例では、アルファベット順に3つのバイナリのみを扱います。

- Gmail アクセス用の `gog`（`gogcli` 由来）
- Google Places 用の `goplaces`
- WhatsApp 用の `wacli`

これらは例であり、完全な一覧ではありません。スキルが必要とするバイナリを、同じパターンで必要なだけインストールしてください。後から新しいバイナリを必要とするスキルを追加する場合は、次のようにします。

1. Dockerfile を更新します。
2. イメージを再ビルドします。
3. コンテナを再起動します。

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
上記の URL は例です。ARM ベースの VM では、`arm64` アセットを選択してください。再現可能なビルドにするには、バージョン付きリリース URL に固定してください。
</Note>

## ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 中にビルドが `Killed` または終了コード 137 で失敗する場合、VM のメモリが不足しています。再試行する前に、より大きいマシンクラスを使用してください。

バイナリを確認します。

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

期待される出力:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway が起動していることを確認します。

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz` が 200 レスポンスを返す場合、Gateway プロセスがリッスン中で正常であることを確認できます。組み込みイメージの `HEALTHCHECK` は同じエンドポイントをポーリングします。

## 何がどこに永続化されるか

OpenClaw は Docker 内で実行されますが、Docker は信頼できる情報源ではありません。長期間保持されるすべての状態は、再起動、再ビルド、リブートをまたいで存続する必要があります。

| コンポーネント | 場所 | 永続化メカニズム | 備考 |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gateway 設定 | `/home/node/.openclaw/` | ホストボリュームマウント | `openclaw.json` を含む |
| チャンネル/プロバイダー認証情報 | `/home/node/.openclaw/credentials/` | ホストボリュームマウント | チャンネルおよびプロバイダーの認証情報マテリアル |
| モデル認証プロファイル | `/home/node/.openclaw/agents/` | ホストボリュームマウント | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API キー） |
| レガシー OAuth キーファイル | `/home/node/.config/openclaw/` | ホストボリュームマウント | 移行前 OAuth サイドカー向けの読み取り専用互換性。`openclaw doctor --fix` がこれらを `auth-profiles.json` に移行します |
| スキル設定 | `/home/node/.openclaw/skills/` | ホストボリュームマウント | スキルレベルの状態 |
| エージェントワークスペース | `/home/node/.openclaw/workspace/` | ホストボリュームマウント | コードとエージェント成果物 |
| WhatsApp セッション | `/home/node/.openclaw/` | ホストボリュームマウント | QR ログインを保持 |
| Gmail キーリング | `/home/node/.openclaw/` | ホストボリューム + パスワード | `GOG_KEYRING_PASSWORD` が必要 |
| Plugin パッケージ | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | ホストボリュームマウント | ダウンロード可能な Plugin パッケージのルート |
| 外部バイナリ | `/usr/local/bin/` | Docker イメージ | ビルド時に組み込む必要があります |
| Node ランタイム | コンテナファイルシステム | Docker イメージ | イメージをビルドするたびに再ビルド |
| OS パッケージ | コンテナファイルシステム | Docker イメージ | ランタイムでインストールしないでください |
| Docker コンテナ | 一時的 | 再起動可能 | 破棄しても安全 |

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
