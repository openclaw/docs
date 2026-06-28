---
read_when:
    - 你想在 Kubernetes 叢集上執行 OpenClaw
    - 您想在 Kubernetes 環境中測試 OpenClaw
summary: 使用 Kustomize 將 OpenClaw 閘道部署到 Kubernetes 叢集
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:43:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

在 Kubernetes 上執行 OpenClaw 的最小起點，不是可直接用於生產環境的部署。它涵蓋核心資源，並預期你會依照自己的環境調整。

## 為什麼不用 Helm？

OpenClaw 是一個帶有一些設定檔的單一容器。真正需要自訂的部分在於代理內容（Markdown 檔案、Skills、設定覆寫），而不是基礎架構樣板。Kustomize 可以處理 overlays，且不需要 Helm chart 的額外負擔。如果你的部署變得更複雜，可以在這些 manifests 之上再疊加 Helm chart。

## 你需要什麼

- 一個正在執行的 Kubernetes 叢集（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已連線到你的叢集的 `kubectl`
- 至少一個模型提供者的 API 金鑰

## 快速開始

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

擷取為 Control UI 設定的共用密鑰。這個部署指令碼預設會建立 token 驗證：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

進行本機除錯時，`./scripts/k8s/deploy.sh --show-token` 會在部署後列印 token。

## 使用 Kind 進行本機測試

如果你沒有叢集，請使用 [Kind](https://kind.sigs.k8s.io/) 在本機建立一個：

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

接著照常使用 `./scripts/k8s/deploy.sh` 部署。

## 逐步操作

### 1) 部署

**選項 A** — 環境中的 API 金鑰（一步完成）：

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

此指令碼會使用 API 金鑰和自動產生的閘道 token 建立 Kubernetes Secret，然後進行部署。如果 Secret 已存在，它會保留目前的閘道 token，以及任何未變更的提供者金鑰。

**選項 B** — 分開建立 secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你想在本機測試時將 token 列印到 stdout，任一指令都可搭配 `--show-token`。

### 2) 存取閘道

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 會部署哪些內容

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## 自訂

### 代理指示

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然後重新部署：

```bash
./scripts/k8s/deploy.sh
```

### 閘道設定

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整參考請見[閘道設定](/zh-TW/gateway/configuration)。

### 新增提供者

匯出額外金鑰後重新執行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

除非你覆寫既有提供者金鑰，否則它們會保留在 Secret 中。

或直接修補 Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自訂 namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自訂映像

編輯 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 欄位：

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### 暴露到 port-forward 之外

預設 manifests 會將閘道綁定到 pod 內的回送位址。這可搭配 `kubectl port-forward` 使用，但不適用於需要連到 pod IP 的 Kubernetes `Service` 或 Ingress 路徑。

如果你想透過 Ingress 或負載平衡器暴露閘道：

- 將 `scripts/k8s/manifests/configmap.yaml` 中的閘道綁定從 `loopback` 改為符合你部署模型的非回送綁定
- 保持啟用閘道驗證，並使用適當的 TLS 終止入口點
- 使用受支援的網頁安全模型設定 Control UI 的遠端存取（例如 HTTPS/Tailscale Serve，並在需要時明確設定允許的 origins）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

這會套用所有 manifests，並重新啟動 pod 以載入任何設定或 secret 變更。

## 移除

```bash
./scripts/k8s/deploy.sh --delete
```

這會刪除 namespace 以及其中的所有資源，包含 PVC。

## 架構備註

- 閘道預設會綁定到 pod 內的回送位址，因此內附設定是供 `kubectl port-forward` 使用
- 沒有叢集範圍資源，一切都位於單一 namespace 中
- 安全性：`readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root 使用者（UID 1000）
- 預設設定讓 Control UI 維持在較安全的本機存取路徑：回送綁定加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你要超出 localhost 存取，請使用受支援的遠端模型：HTTPS/Tailscale 加上適當的閘道綁定和 Control UI origin 設定
- Secrets 會在暫存目錄中產生並直接套用到叢集，不會將 secret 材料寫入 repo checkout

## 檔案結構

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

## 相關

- [Docker](/zh-TW/install/docker)
- [Docker VM runtime](/zh-TW/install/docker-vm-runtime)
- [安裝概觀](/zh-TW/install)
