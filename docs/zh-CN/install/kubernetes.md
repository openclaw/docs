---
read_when:
    - 你想在 Kubernetes 集群上运行 OpenClaw
    - 你想在 Kubernetes 环境中测试 OpenClaw
summary: 使用 Kustomize 将 OpenClaw Gateway 网关部署到 Kubernetes 集群
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T08:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# 在 Kubernetes 上运行 OpenClaw

这是一个在 Kubernetes 上运行 OpenClaw 的最小起点——并非生产就绪部署。它覆盖核心资源，并且旨在根据你的环境进行调整。

## 为什么不用 Helm？

OpenClaw 是一个单容器应用，外加一些配置文件。真正有趣的定制点在于智能体内容（markdown 文件、Skills、配置覆盖），而不是基础设施模板。Kustomize 可以在没有 Helm chart 额外开销的情况下处理 overlay。如果你的部署变得更复杂，仍然可以在这些 manifest 之上再叠加 Helm chart。

## 你需要准备的内容

- 一个正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已连接到集群的 `kubectl`
- 至少一个模型提供商的 API 密钥

## 快速开始

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

获取为 Control UI 配置的共享密钥。该部署脚本
默认会创建 token 鉴权：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

对于本地调试，`./scripts/k8s/deploy.sh --show-token` 会在部署后打印 token。

## 使用 Kind 进行本地测试

如果你还没有集群，可以用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 销毁集群
```

然后像平常一样使用 `./scripts/k8s/deploy.sh` 进行部署。

## 分步说明

### 1）部署

**选项 A** —— 使用环境变量中的 API 密钥（一步完成）：

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

该脚本会创建一个包含 API 密钥和自动生成 Gateway 网关 token 的 Kubernetes Secret，然后进行部署。如果 Secret 已存在，它会保留当前的 Gateway 网关 token，以及所有未被修改的提供商密钥。

**选项 B** —— 单独创建 Secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你希望将 token 打印到 stdout 以便本地测试，可在任一命令中使用 `--show-token`。

### 2）访问 Gateway 网关

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 会部署哪些内容

```
Namespace: openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单 Pod，含 init container + Gateway 网关
├── Service/openclaw           # 18789 端口上的 ClusterIP
├── PersistentVolumeClaim      # 10Gi，用于智能体状态和配置
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 网关 token + API 密钥
```

## 自定义

### 智能体指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然后重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 网关配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整参考请参见 [Gateway 网关配置](/gateway/configuration)。

### 添加提供商

在导出更多密钥后重新运行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

除非你显式覆盖，否则现有提供商密钥会保留在 Secret 中。

或者直接 patch Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自定义命名空间

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自定义镜像

编辑 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 字段：

```yaml
image: ghcr.io/openclaw/openclaw:latest # 或固定到 https://github.com/openclaw/openclaw/releases 中的特定版本
```

### 暴露到 port-forward 之外

默认 manifest 会让 Gateway 网关在 Pod 内绑定到 loopback。这适用于 `kubectl port-forward`，但不适用于需要访问 Pod IP 的 Kubernetes `Service` 或 Ingress 路径。

如果你想通过 Ingress 或负载均衡器暴露 Gateway 网关：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 Gateway 网关绑定从 `loopback` 改为与你部署模型匹配的非 loopback 绑定
- 保持 Gateway 网关鉴权启用，并使用合适的 TLS 终止入口点
- 使用受支持的 Web 安全模型为远程访问配置 Control UI（例如 HTTPS/Tailscale Serve，并在需要时显式设置允许的来源）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有 manifest，并重启 Pod，以便加载任何配置或密钥更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除该命名空间及其中所有资源，包括 PVC。

## 架构说明

- Gateway 网关默认在 Pod 内绑定到 loopback，因此附带的设置是面向 `kubectl port-forward` 的
- 没有集群级资源——所有内容都位于单一命名空间中
- 安全性：`readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root 用户（UID 1000）
- 默认配置让 Control UI 保持在更安全的本地访问路径：loopback 绑定 + `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你要超越 localhost 访问，请使用受支持的远程模型：HTTPS/Tailscale 加上合适的 Gateway 网关绑定和 Control UI 来源设置
- 密钥会在临时目录中生成并直接应用到集群——不会将任何密钥材料写入仓库检出目录

## 文件结构

```
scripts/k8s/
├── deploy.sh                   # 创建命名空间 + Secret，并通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础层
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 带安全加固的 Pod 规格
    ├── pvc.yaml                # 10Gi 持久化存储
    └── service.yaml            # 18789 端口上的 ClusterIP
```
