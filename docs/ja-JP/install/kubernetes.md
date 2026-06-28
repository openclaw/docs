---
read_when:
    - Kubernetes クラスターで OpenClaw を実行したい
    - Kubernetes 環境で OpenClaw をテストしたい場合
summary: Kustomize で OpenClaw Gateway を Kubernetes クラスターにデプロイする
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw を Kubernetes 上で実行するための最小限の出発点です。本番対応のデプロイではありません。中核となるリソースを扱い、環境に合わせて調整することを前提としています。

## なぜ Helm ではないのか？

OpenClaw は、いくつかの設定ファイルを持つ単一コンテナです。重要なカスタマイズ対象はインフラのテンプレート化ではなく、エージェントのコンテンツ（Markdown ファイル、Skills、設定の上書き）です。Kustomize は Helm チャートのオーバーヘッドなしにオーバーレイを扱えます。デプロイがより複雑になった場合は、これらのマニフェストの上に Helm チャートを重ねることもできます。

## 必要なもの

- 実行中の Kubernetes クラスター（AKS、EKS、GKE、k3s、kind、OpenShift など）
- クラスターに接続済みの `kubectl`
- 少なくとも 1 つのモデルプロバイダーの API キー

## クイックスタート

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI 用に設定された共有シークレットを取得します。このデプロイスクリプトは
デフォルトでトークン認証を作成します。

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

ローカルデバッグでは、`./scripts/k8s/deploy.sh --show-token` がデプロイ後にトークンを出力します。

## Kind によるローカルテスト

クラスターがない場合は、[Kind](https://kind.sigs.k8s.io/) でローカルに作成します。

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

その後、通常どおり `./scripts/k8s/deploy.sh` でデプロイします。

## 手順

### 1) デプロイ

**オプション A** — 環境内の API キー（1 ステップ）:

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

スクリプトは、API キーと自動生成された Gateway トークンを含む Kubernetes Secret を作成してからデプロイします。Secret がすでに存在する場合は、現在の Gateway トークンと、変更対象ではないプロバイダーキーを保持します。

**オプション B** — シークレットを別途作成する:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ローカルテスト用にトークンを標準出力へ出力したい場合は、どちらのコマンドでも `--show-token` を使用します。

### 2) Gateway にアクセスする

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## デプロイされるもの

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## カスタマイズ

### エージェント指示

`scripts/k8s/manifests/configmap.yaml` の `AGENTS.md` を編集して再デプロイします。

```bash
./scripts/k8s/deploy.sh
```

### Gateway 設定

`scripts/k8s/manifests/configmap.yaml` の `openclaw.json` を編集します。完全なリファレンスについては、[Gateway 設定](/ja-JP/gateway/configuration) を参照してください。

### プロバイダーを追加する

追加のキーをエクスポートして再実行します。

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

既存のプロバイダーキーは、上書きしない限り Secret に残ります。

または、Secret に直接パッチを適用します。

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### カスタム namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### カスタムイメージ

`scripts/k8s/manifests/deployment.yaml` の `image` フィールドを編集します。

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### port-forward を越えて公開する

デフォルトのマニフェストは、Pod 内部で Gateway をループバックにバインドします。これは `kubectl port-forward` では機能しますが、Pod IP に到達する必要がある Kubernetes `Service` や Ingress パスでは機能しません。

Ingress またはロードバランサー経由で Gateway を公開したい場合:

- `scripts/k8s/manifests/configmap.yaml` の Gateway バインドを `loopback` から、デプロイモデルに合う非ループバックのバインドに変更する
- Gateway 認証を有効にしたままにし、適切な TLS 終端済みエントリーポイントを使用する
- サポートされている Web セキュリティモデルを使用して、リモートアクセス用に Control UI を設定する（たとえば HTTPS/Tailscale Serve と、必要に応じた明示的な許可済みオリジン）

## 再デプロイ

```bash
./scripts/k8s/deploy.sh
```

これにより、すべてのマニフェストが適用され、設定やシークレットの変更を反映するために Pod が再起動されます。

## 削除

```bash
./scripts/k8s/deploy.sh --delete
```

これにより、namespace とその中のすべてのリソース（PVC を含む）が削除されます。

## アーキテクチャメモ

- Gateway はデフォルトで Pod 内部のループバックにバインドされるため、含まれているセットアップは `kubectl port-forward` 用です
- クラスタースコープのリソースはありません。すべて単一の namespace 内にあります
- セキュリティ: `readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root ユーザー（UID 1000）
- デフォルト設定では、Control UI はより安全なローカルアクセスパスに維持されます: ループバックバインドと `kubectl port-forward` による `http://127.0.0.1:18789`
- localhost アクセスを越えて使用する場合は、サポートされているリモートモデルを使用してください: HTTPS/Tailscale と、適切な Gateway バインドおよび Control UI オリジン設定
- シークレットは一時ディレクトリに生成され、クラスターへ直接適用されます。シークレット情報がリポジトリのチェックアウトに書き込まれることはありません

## ファイル構造

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## 関連

- [Docker](/ja-JP/install/docker)
- [Docker VM ランタイム](/ja-JP/install/docker-vm-runtime)
- [インストール概要](/ja-JP/install)
