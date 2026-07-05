---
read_when:
    - Kubernetes クラスターで OpenClaw を実行したい
    - Kubernetes 環境で OpenClaw をテストしたい
summary: KustomizeでOpenClaw GatewayをKubernetesクラスターにデプロイする
title: Kubernetes
x-i18n:
    generated_at: "2026-07-05T11:26:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw を Kubernetes で実行するための最小限の出発点であり、本番環境向けのデプロイではありません。コアリソースを対象としており、利用環境に合わせて調整することを前提としています。

## Helm を使わない理由

OpenClaw は、いくつかの設定ファイルを持つ単一コンテナです。重要なカスタマイズは、インフラのテンプレート化ではなく、エージェントコンテンツ（Markdown ファイル、Skills、設定オーバーライド）にあります。Kustomize は Helm チャートのオーバーヘッドなしでオーバーレイを扱えます。デプロイがより複雑になった場合は、これらのマニフェストの上に Helm チャートを重ねてください。

## 必要なもの

- 稼働中の Kubernetes クラスター（AKS、EKS、GKE、k3s、kind、OpenShift など）
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

`deploy.sh` はデフォルトでトークン認証を作成します。Control UI 用に生成されたゲートウェイトークンを取得します。

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

ローカルデバッグでは、`./scripts/k8s/deploy.sh --show-token` がデプロイ後にトークンを出力します。

## Kind を使ったローカルテスト

クラスターがない場合は、[Kind](https://kind.sigs.k8s.io/) を使ってローカルに作成します。

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

その後、通常どおり `./scripts/k8s/deploy.sh` でデプロイします。

## ステップごと

### 1) デプロイ

**オプション A: 環境変数内の API キー（1 ステップ）**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

このスクリプトは、API キーと自動生成されたゲートウェイトークンを含む Kubernetes Secret を作成し、その後デプロイします。Secret がすでに存在する場合は、現在のゲートウェイトークンと、変更対象ではないプロバイダーキーを保持します。

**オプション B: Secret を別途作成する**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ローカルテスト用にトークンを標準出力へ出力するには、どちらのコマンドにも `--show-token` を追加します。

### 2) ゲートウェイにアクセスする

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## デプロイされるもの

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## カスタマイズ

### エージェント指示

`scripts/k8s/manifests/configmap.yaml` 内の `AGENTS.md` を編集して、再デプロイします。

```bash
./scripts/k8s/deploy.sh
```

### Gateway 設定

`scripts/k8s/manifests/configmap.yaml` 内の `openclaw.json` を編集します。完全なリファレンスは [Gateway 設定](/ja-JP/gateway/configuration) を参照してください。

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

### カスタム名前空間

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### カスタムイメージ

`scripts/k8s/manifests/deployment.yaml` の `image` フィールドを編集します。

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### port-forward を超えて公開する

デフォルトのマニフェストは、Pod 内のループバックにゲートウェイをバインドします。これは `kubectl port-forward` では機能しますが、Pod IP に直接到達する必要がある Kubernetes `Service` や Ingress パスでは機能しません。

Ingress またはロードバランサー経由でゲートウェイを公開するには、次のようにします。

- `scripts/k8s/manifests/configmap.yaml` のゲートウェイバインドを `loopback` から、デプロイモデルに合う非ループバックのバインドに変更します。
- ゲートウェイ認証を有効のままにし、適切な TLS 終端エントリーポイントを使用します。
- サポートされる Web セキュリティモデルを使って、リモートアクセス用に Control UI を設定します（たとえば HTTPS/Tailscale Serve と、必要に応じた明示的な許可オリジン）。

## 再デプロイ

```bash
./scripts/k8s/deploy.sh
```

これにより、すべてのマニフェストが適用され、設定や Secret の変更を反映するために Pod が再起動されます。

## 削除

```bash
./scripts/k8s/deploy.sh --delete
```

これにより、PVC を含め、その名前空間とその中のすべてのリソースが削除されます。

## アーキテクチャメモ

- ゲートウェイはデフォルトで Pod 内のループバックにバインドされるため、同梱のセットアップは `kubectl port-forward` 用です。
- クラスタースコープのリソースはありません。すべて単一の名前空間内にあります。
- セキュリティ強化: `readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root ユーザー（UID 1000）。
- デフォルト設定では、Control UI をより安全なローカルアクセス経路に保ちます。ループバックバインドに加えて、`kubectl port-forward` で `http://127.0.0.1:18789` に接続します。
- localhost アクセスを超える場合は、サポートされるリモートモデルを使用してください。HTTPS/Tailscale に加えて、適切なゲートウェイバインドと Control UI のオリジン設定を使います。
- Secret は一時ディレクトリ内で生成され、クラスターに直接適用されます。Secret の内容がリポジトリのチェックアウトに書き込まれることはありません。

## ファイル構造

```text
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
