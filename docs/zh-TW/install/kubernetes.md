---
read_when:
    - 您想要在 Kubernetes 叢集上執行 OpenClaw
    - 您想在 Kubernetes 環境中測試 OpenClaw
summary: 使用 Kustomize 將 OpenClaw Gateway 部署到 Kubernetes 叢集
title: Kubernetes
x-i18n:
    generated_at: "2026-04-30T03:15:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 16
---

# Kubernetes 上的 OpenClaw

這是用於在 Kubernetes 上執行 OpenClaw 的最小起點，並不是可用於生產環境的部署。它涵蓋核心資源，並預期你會依照自己的環境調整。

## 為什麼不用 Helm？

OpenClaw 是單一容器，外加一些設定檔。真正值得客製化的是 agent 內容（markdown 檔案、Skills、設定覆寫），而不是基礎架構範本。Kustomize 可以處理 overlays，而不需要 Helm chart 的額外負擔。如果你的部署變得更複雜，可以在這些 manifests 之上再疊加 Helm chart。

## 你需要什麼

- 正在執行的 Kubernetes 叢集（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已連線到叢集的 `kubectl`
- 至少一個模型提供者的 API 金鑰

## 快速開始

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

取回已設定的 Control UI 共用密鑰。此部署腳本預設會建立 token 驗證：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

若要進行本機除錯，`./scripts/k8s/deploy.sh --show-token` 會在部署後列印 token。

## 使用 Kind 進行本機測試

如果你沒有叢集，可以使用 [Kind](https://kind.sigs.k8s.io/) 在本機建立一個：

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

接著照常使用 `./scripts/k8s/deploy.sh` 部署。

## 逐步說明

### 1) 部署

**選項 A** — 環境中的 API 金鑰（一步完成）：

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

此腳本會使用 API 金鑰和自動產生的 gateway token 建立 Kubernetes Secret，然後進行部署。如果 Secret 已存在，它會保留目前的 gateway token，以及任何未變更的提供者金鑰。

**選項 B** — 另外建立 secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你想為本機測試將 token 列印到 stdout，任一指令都可以搭配 `--show-token` 使用。

### 2) 存取 Gateway

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

## 客製化

### Agent 指示

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然後重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 設定

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整參考請見 [Gateway 設定](/zh-TW/gateway/configuration)。

### 新增提供者

匯出額外金鑰後重新執行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

現有提供者金鑰會留在 Secret 中，除非你覆寫它們。

或直接 patch Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自訂 namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自訂映像檔

編輯 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 欄位：

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### 開放給 port-forward 以外的存取方式

預設 manifests 會將 Gateway 綁定到 pod 內的 loopback。這適用於 `kubectl port-forward`，但不適用於需要連到 pod IP 的 Kubernetes `Service` 或 Ingress 路徑。

如果你想透過 Ingress 或負載平衡器開放 Gateway：

- 將 `scripts/k8s/manifests/configmap.yaml` 中的 Gateway bind 從 `loopback` 改成符合你部署模型的非 loopback bind
- 保持 Gateway 驗證啟用，並使用適當的 TLS 終止進入點
- 使用受支援的網頁安全模型來設定 Control UI 的遠端存取（例如 HTTPS/Tailscale Serve，並在需要時明確設定允許的 origins）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

這會套用所有 manifests，並重新啟動 pod 以載入任何設定或 secret 變更。

## 清除

```bash
./scripts/k8s/deploy.sh --delete
```

這會刪除 namespace 及其中所有資源，包含 PVC。

## 架構備註

- Gateway 預設會綁定到 pod 內的 loopback，因此內含的設定適用於 `kubectl port-forward`
- 沒有叢集範圍資源；所有內容都位於單一 namespace
- 安全性：`readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root 使用者（UID 1000）
- 預設設定會讓 Control UI 維持在較安全的本機存取路徑：loopback bind 加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你要超出 localhost 存取，請使用受支援的遠端模型：HTTPS/Tailscale 加上適當的 Gateway bind 和 Control UI origin 設定
- Secrets 會在暫存目錄中產生並直接套用到叢集；不會將 secret 材料寫入 repo checkout

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

## 相關內容

- [Docker](/zh-TW/install/docker)
- [Docker VM runtime](/zh-TW/install/docker-vm-runtime)
- [安裝概覽](/zh-TW/install)
