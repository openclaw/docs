---
read_when:
    - 你想在 Kubernetes 集群上运行 OpenClaw
    - 你想在 Kubernetes 环境中测试 OpenClaw
summary: 使用 Kustomize 将 OpenClaw Gateway 网关部署到 Kubernetes 集群
title: Kubernetes
x-i18n:
    generated_at: "2026-07-05T11:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw 在 Kubernetes 上运行的最小起点，不是生产就绪部署。它覆盖核心资源，并且应根据你的环境进行调整。

## 为什么不用 Helm

OpenClaw 是一个带有一些配置文件的单容器。真正需要自定义的是 agent 内容（Markdown 文件、skills、配置覆盖），而不是基础设施模板。Kustomize 可以处理覆盖层，而不需要 Helm chart 的额外开销。如果你的部署变得更复杂，可以在这些清单之上叠加 Helm chart。

## 你需要什么

- 一个正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已连接到你的集群的 `kubectl`
- 至少一个模型提供商的 API 密钥

## 快速开始

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` 默认创建令牌认证。为 Control UI 获取生成的 Gateway 网关令牌：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

对于本地调试，`./scripts/k8s/deploy.sh --show-token` 会在部署后打印令牌。

## 使用 Kind 进行本地测试

如果你没有集群，可以用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

然后像往常一样用 `./scripts/k8s/deploy.sh` 部署。

## 分步操作

### 1) 部署

**选项 A：环境中的 API 密钥（一步完成）**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

该脚本会使用 API 密钥和自动生成的 Gateway 网关令牌创建 Kubernetes Secret，然后进行部署。如果 Secret 已存在，它会保留当前 Gateway 网关令牌以及未被更改的所有提供商密钥。

**选项 B：单独创建 secret**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

在任一命令中添加 `--show-token`，即可将令牌打印到 stdout 以便本地测试。

### 2) 访问 Gateway 网关

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署内容

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## 自定义

### Agent 指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md` 并重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整参考见 [Gateway 配置](/zh-CN/gateway/configuration)。

### 添加提供商

导出额外密钥后重新运行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

现有提供商密钥会保留在 Secret 中，除非你覆盖它们。

或者直接修补 Secret：

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
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### 暴露到 port-forward 之外

默认清单会将 Gateway 网关绑定到 pod 内部的环回地址。这适用于 `kubectl port-forward`，但不适用于需要直接访问 pod IP 的 Kubernetes `Service` 或 Ingress 路径。

要通过 Ingress 或负载均衡器暴露 Gateway 网关：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 Gateway 网关绑定从 `loopback` 改为与你的部署模型匹配的非环回绑定。
- 保持 Gateway 网关认证启用，并使用合适的 TLS 终止入口点。
- 使用受支持的 Web 安全模型为 Control UI 配置远程访问（例如 HTTPS/Tailscale Serve，并在需要时显式配置允许的来源）。

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有清单，并重启 pod 以加载任何配置或 secret 变更。

## 清理

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除命名空间及其中的所有资源，包括 PVC。

## 架构说明

- Gateway 网关默认绑定到 pod 内部的环回地址，因此随附设置用于 `kubectl port-forward`。
- 没有集群级资源；所有内容都位于单个命名空间中。
- 安全加固：`readOnlyRootFilesystem`、`drop: ALL` capabilities、非 root 用户（UID 1000）。
- 默认配置让 Control UI 保持在更安全的本地访问路径上：环回绑定加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`。
- 如果你要超出 localhost 访问范围，请使用受支持的远程模型：HTTPS/Tailscale 加上适当的 Gateway 网关绑定和 Control UI 来源设置。
- Secret 会在临时目录中生成并直接应用到集群；不会将任何 secret 材料写入仓库 checkout。

## 文件结构

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

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Docker VM runtime](/zh-CN/install/docker-vm-runtime)
- [安装概览](/zh-CN/install)
