---
read_when:
    - 您想在 Kubernetes 叢集上執行 OpenClaw
    - 你想在 Kubernetes 環境中測試 OpenClaw
summary: 使用 Kustomize 將 OpenClaw 閘道部署至 Kubernetes 叢集
title: Kubernetes
x-i18n:
    generated_at: "2026-07-11T21:25:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

這是在 Kubernetes 上執行 OpenClaw 的最小起始配置，並非可直接用於正式環境的部署。它涵蓋核心資源，並應依你的環境進行調整。

## 為何不使用 Helm

OpenClaw 是一個包含若干設定檔的單一容器。值得自訂的部分在於代理程式內容（Markdown 檔案、Skills、設定覆寫），而非基礎架構範本。Kustomize 無需承擔 Helm 圖表的額外負擔，即可處理覆寫層。如果你的部署變得更加複雜，可以在這些資訊清單之上疊加 Helm 圖表。

## 所需項目

- 一個正在執行的 Kubernetes 叢集（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已連線至叢集的 `kubectl`
- 至少一個模型供應商的 API 金鑰

## 快速開始

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` 預設會建立權杖驗證。取得產生的閘道權杖，以供控制介面使用：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

進行本機偵錯時，`./scripts/k8s/deploy.sh --show-token` 會在部署後印出權杖。

## 使用 Kind 進行本機測試

如果你沒有叢集，請使用 [Kind](https://kind.sigs.k8s.io/) 在本機建立一個：

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

然後照常使用 `./scripts/k8s/deploy.sh` 部署。

## 逐步操作

### 1）部署

**選項 A：在環境中設定 API 金鑰（單一步驟）**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

此指令碼會使用 API 金鑰和自動產生的閘道權杖建立 Kubernetes Secret，然後進行部署。如果 Secret 已存在，則會保留目前的閘道權杖，以及所有未被變更的供應商金鑰。

**選項 B：個別建立 Secret**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

在任一命令中加入 `--show-token`，即可將權杖印至標準輸出，以供本機測試。

### 2）存取閘道

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署的內容

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## 自訂

### 代理程式指示

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然後重新部署：

```bash
./scripts/k8s/deploy.sh
```

### 閘道設定

編輯 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整參考資料請參閱[閘道設定](/zh-TW/gateway/configuration)。

### 新增供應商

匯出其他金鑰後重新執行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

除非你覆寫現有供應商金鑰，否則它們會保留在 Secret 中。

或者直接修補 Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自訂命名空間

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自訂映像檔

編輯 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 欄位：

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### 公開至連接埠轉送以外的範圍

預設資訊清單會將閘道繫結至 Pod 內的 local loopback。這適用於 `kubectl port-forward`，但不適用於需要直接連線至 Pod IP 的 Kubernetes `Service` 或 Ingress 路徑。

若要透過 Ingress 或負載平衡器公開閘道：

- 將 `scripts/k8s/manifests/configmap.yaml` 中的閘道繫結從 `loopback` 變更為符合你部署模型的非迴路繫結。
- 保持啟用閘道驗證，並使用妥善終止 TLS 的進入點。
- 使用支援的網頁安全性模型，設定控制介面以供遠端存取（例如 HTTPS/Tailscale Serve，並在需要時明確設定允許的來源）。

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

這會套用所有資訊清單並重新啟動 Pod，以載入任何設定或 Secret 變更。

## 移除部署

```bash
./scripts/k8s/deploy.sh --delete
```

這會刪除命名空間及其中的所有資源，包括 PVC。

## 架構備註

- 閘道預設繫結至 Pod 內的 local loopback，因此隨附的設定適用於 `kubectl port-forward`。
- 不使用叢集範圍的資源；所有內容均位於單一命名空間中。
- 安全性強化：`readOnlyRootFilesystem`、`drop: ALL` 權限、非 root 使用者（UID 1000）。
- 預設設定會讓控制介面採用較安全的本機存取路徑：迴路繫結，並透過 `kubectl port-forward` 連線至 `http://127.0.0.1:18789`。
- 如果不再僅限於 localhost 存取，請使用支援的遠端模型：HTTPS/Tailscale，並搭配適當的閘道繫結及控制介面來源設定。
- Secret 會在暫存目錄中產生並直接套用至叢集；不會將任何機密資料寫入儲存庫的簽出目錄。

## 檔案結構

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

## 相關內容

- [Docker](/zh-TW/install/docker)
- [Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)
- [安裝概覽](/zh-TW/install)
