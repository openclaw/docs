---
read_when:
    - Docker を使用してクラウド VM に OpenClaw をデプロイしています
    - 共有バイナリのビルド、永続化、更新フローが必要です
summary: 長期間稼働する OpenClaw Gateway ホスト向けの共有 Docker VM ランタイム手順
title: Docker VM ランタイム
x-i18n:
    generated_at: "2026-07-11T22:18:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP、Hetzner、および同様のVPSプロバイダーなど、VMベースのDockerインストールに共通するランタイム手順です。

## 必要なバイナリをイメージに組み込む

実行中のコンテナ内にバイナリをインストールする方法は避けてください。ランタイムにインストールしたものは、再起動すると失われます。スキルが必要とするすべての外部バイナリを、ビルド時にイメージへ組み込んでください。

以下の例では、アルファベット順に3つのバイナリのみを扱います。

- Gmailへのアクセス用の`gog`（`gogcli`から提供）
- Google Places用の`goplaces`
- WhatsApp用の`wacli`

これらは例であり、完全な一覧ではありません。同じパターンを使用して、スキルが必要とする数だけバイナリをインストールしてください。後から新しいバイナリを必要とするスキルを追加する場合は、次の手順を実行します。

1. Dockerfileを更新します。
2. イメージを再ビルドします。
3. コンテナを再起動します。

**Dockerfileの例**

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
上記のURLは例です。ARMベースのVMでは、`arm64`アセットを選択してください。再現可能なビルドにするには、バージョンを指定したリリースURLに固定してください。
</Note>

## ビルドと起動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile`の実行中に`Killed`または終了コード137でビルドが失敗した場合、VMのメモリが不足しています。再試行する前に、より大きなマシンクラスを使用してください。

バイナリを確認します。

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

期待される出力：

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gatewayが起動していることを確認します。

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz`が200レスポンスを返せば、Gatewayプロセスがリッスン中で正常であることを確認できます。組み込みイメージの`HEALTHCHECK`も同じエンドポイントをポーリングします。

## 保存場所と永続化対象

OpenClawはDocker内で動作しますが、Dockerは信頼できる唯一の情報源ではありません。長期間保持するすべての状態は、再起動、再ビルド、およびリブート後も維持される必要があります。

| コンポーネント         | 場所                                                   | 永続化の仕組み           | 注記                                                                                                                |
| ---------------------- | ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Gateway設定            | `/home/node/.openclaw/`                                | ホストボリュームマウント | `openclaw.json`を含む                                                                                               |
| チャネル/プロバイダーの認証情報 | `/home/node/.openclaw/credentials/`                    | ホストボリュームマウント | チャネルおよびプロバイダーの認証情報                                                                                |
| モデル認証プロファイル | `/home/node/.openclaw/agents/`                         | ホストボリュームマウント | `agents/<agentId>/agent/auth-profiles.json`（OAuth、APIキー）                                                       |
| 旧OAuthキーファイル    | `/home/node/.config/openclaw/`                         | ホストボリュームマウント | 移行前のOAuthサイドカー用の読み取り専用互換機能。`openclaw doctor --fix`はこれらを`auth-profiles.json`に移行する     |
| スキル設定             | `/home/node/.openclaw/skills/`                         | ホストボリュームマウント | スキルレベルの状態                                                                                                  |
| エージェントワークスペース | `/home/node/.openclaw/workspace/`                      | ホストボリュームマウント | コードおよびエージェントの成果物                                                                                    |
| WhatsAppセッション     | `/home/node/.openclaw/`                                | ホストボリュームマウント | QRログインを維持                                                                                                    |
| Gmailキーリング        | `/home/node/.openclaw/`                                | ホストボリューム＋パスワード | `GOG_KEYRING_PASSWORD`が必要                                                                                        |
| Pluginパッケージ       | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | ホストボリュームマウント | ダウンロード可能なPluginパッケージのルート                                                                          |
| 外部バイナリ           | `/usr/local/bin/`                                      | Dockerイメージ           | ビルド時に組み込む必要がある                                                                                        |
| Nodeランタイム         | コンテナファイルシステム                               | Dockerイメージ           | イメージのビルドごとに再構築される                                                                                  |
| OSパッケージ           | コンテナファイルシステム                               | Dockerイメージ           | ランタイムにはインストールしない                                                                                    |
| Dockerコンテナ         | 一時的                                                 | 再起動可能               | 破棄しても安全                                                                                                      |

## 更新

VM上のOpenClawを更新するには、次を実行します。

```bash
git pull
docker compose build
docker compose up -d
```

## 関連項目

- [Docker](/ja-JP/install/docker)
- [Podman](/ja-JP/install/podman)
- [ClawDock](/ja-JP/install/clawdock)
