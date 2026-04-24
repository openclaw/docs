---
read_when:
    - Kubernetesクラスター上でOpenClawを実行したい場合
    - Kubernetes環境でOpenClawをテストしたい場合
summary: Kustomizeを使ってOpenClaw GatewayをKubernetesクラスターへデプロイする
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T05:04:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# Kubernetes上のOpenClaw

Kubernetes上でOpenClawを実行するための最小限の出発点です。これは本番対応デプロイではありません。コアリソースを扱い、各自の環境に合わせて調整することを前提としています。

## なぜHelmではないのか？

OpenClawは、いくつかの設定ファイルを持つ単一コンテナです。本当に興味深いカスタマイズは、インフラテンプレートではなく、エージェント内容（markdownファイル、Skills、設定上書き）にあります。Kustomizeは、Helm chartのオーバーヘッドなしでoverlayを扱えます。デプロイがより複雑になった場合は、これらのmanifestの上にHelm chartを重ねることもできます。

## 必要なもの

- 稼働中のKubernetesクラスター（AKS、EKS、GKE、k3s、kind、OpenShiftなど）
- クラスターに接続された`kubectl`
- 少なくとも1つのモデルプロバイダー用のAPI key

## クイックスタート

```bash
# プロバイダーに置き換えてください: ANTHROPIC、GEMINI、OPENAI、または OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI用に設定された共有シークレットを取得します。このdeployスクリプトは
デフォルトでtoken認証を作成します。

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

ローカルデバッグ用に、`./scripts/k8s/deploy.sh --show-token`はデプロイ後にtokenを表示します。

## Kindによるローカルテスト

クラスターがない場合は、[Kind](https://kind.sigs.k8s.io/)でローカル作成できます。

```bash
./scripts/k8s/create-kind.sh           # dockerまたはpodmanを自動検出
./scripts/k8s/create-kind.sh --delete  # 削除
```

その後、通常どおり`./scripts/k8s/deploy.sh`でデプロイしてください。

## 手順ごとの説明

### 1) デプロイ

**オプションA** — 環境変数にAPI keyを置く（1ステップ）:

```bash
# プロバイダーに置き換えてください: ANTHROPIC、GEMINI、OPENAI、または OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

このスクリプトは、API keyと自動生成されたgateway tokenを含むKubernetes Secretを作成し、その後デプロイします。Secretがすでに存在する場合、現在のgateway tokenと、変更対象でないプロバイダーkeyは保持されます。

**オプションB** — Secretを別途作成する:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ローカルテスト用にtokenをstdoutへ表示したい場合は、どちらのコマンドでも`--show-token`を使ってください。

### 2) gatewayへアクセスする

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## デプロイされるもの

```
Namespace: openclaw (OPENCLAW_NAMESPACEで変更可能)
├── Deployment/openclaw        # 単一Pod、init container + gateway
├── Service/openclaw           # 18789番ポートのClusterIP
├── PersistentVolumeClaim      # エージェント状態と設定用の10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## カスタマイズ

### エージェント指示

`scripts/k8s/manifests/configmap.yaml`内の`AGENTS.md`を編集して再デプロイします。

```bash
./scripts/k8s/deploy.sh
```

### Gateway設定

`scripts/k8s/manifests/configmap.yaml`内の`openclaw.json`を編集します。完全なリファレンスは[Gateway configuration](/ja-JP/gateway/configuration)を参照してください。

### プロバイダーを追加する

追加のkeyをexportして再実行します。

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

既存のプロバイダーkeyは、上書きしない限りSecret内に残ります。

または、Secretを直接patchします。

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### カスタムnamespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### カスタムイメージ

`scripts/k8s/manifests/deployment.yaml`内の`image`フィールドを編集します。

```yaml
image: ghcr.io/openclaw/openclaw:latest # または https://github.com/openclaw/openclaw/releases の特定バージョンに固定
```

### port-forward以外で公開する

デフォルトのmanifestでは、gatewayはpod内でloopbackにbindします。これは`kubectl port-forward`では動作しますが、pod IPへ到達する必要があるKubernetes `Service`やIngress経由では動作しません。

Ingressまたはロードバランサー経由でgatewayを公開したい場合:

- `scripts/k8s/manifests/configmap.yaml`内のgateway bindを`loopback`から、デプロイモデルに合ったloopbackではないbindへ変更する
- gateway認証は有効なままにし、適切なTLS終端エントリーポイントを使う
- サポートされるWebセキュリティモデルに従ってControl UIのリモートアクセスを設定する（たとえばHTTPS/Tailscale Serveや、必要に応じた明示的allowed origins）

## 再デプロイ

```bash
./scripts/k8s/deploy.sh
```

これによりすべてのmanifestが適用され、設定またはsecretの変更を反映するためにpodが再起動されます。

## 削除

```bash
./scripts/k8s/deploy.sh --delete
```

これによりnamespaceと、その中のすべてのリソース（PVCを含む）が削除されます。

## アーキテクチャに関する注意

- gatewayはデフォルトでpod内のloopbackにbindするため、付属セットアップは`kubectl port-forward`用です
- クラスタースコープのリソースはありません。すべて1つのnamespace内にあります
- セキュリティ: `readOnlyRootFilesystem`、`drop: ALL` capabilities、非rootユーザー（UID 1000）
- デフォルト設定は、Control UIをより安全なローカルアクセス経路に保ちます。つまり、loopback bind + `kubectl port-forward`で`http://127.0.0.1:18789`へ接続します
- localhostアクセスを超える場合は、サポートされるリモートモデルを使用してください。HTTPS/Tailscaleと、適切なgateway bindおよびControl UI origin設定です
- Secretは一時ディレクトリで生成され、クラスターへ直接適用されます。secret素材がリポジトリチェックアウトへ書き込まれることはありません

## ファイル構成

```
scripts/k8s/
├── deploy.sh                   # namespace + secretを作成し、kustomizeでデプロイ
├── create-kind.sh              # ローカルKindクラスター（docker/podmanを自動検出）
└── manifests/
    ├── kustomization.yaml      # Kustomizeベース
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # セキュリティハードニング付きPod仕様
    ├── pvc.yaml                # 10Gi永続ストレージ
    └── service.yaml            # 18789番ポートのClusterIP
```

## 関連

- [Docker](/ja-JP/install/docker)
- [Docker VM runtime](/ja-JP/install/docker-vm-runtime)
- [Install overview](/ja-JP/install)
