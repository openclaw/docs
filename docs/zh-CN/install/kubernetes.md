---
read_when:
    - 你想在 Kubernetes 集群上运行 OpenClaw
    - 你想在 Kubernetes 环境中测试 OpenClaw
summary: 使用 Kustomize 将 OpenClaw Gateway 网关部署到 Kubernetes 集群
title: Kubernetes
x-i18n:
    generated_at: "2026-07-11T20:35:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

这是在 Kubernetes 上运行 OpenClaw 的最简起点，并非生产就绪的部署方案。它涵盖核心资源，旨在根据你的环境进行调整。

## 为什么不使用 Helm

OpenClaw 是一个带有若干配置文件的单容器。真正需要自定义的是智能体内容（Markdown 文件、Skills、配置覆盖），而非基础设施模板。Kustomize 无需 Helm Chart 的额外开销即可处理覆盖层。如果你的部署变得更加复杂，可以在这些清单之上添加 Helm Chart。

## 所需条件

- 一个正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 已连接到集群的 `kubectl`
- 至少一个模型提供商的 API key

## 快速开始

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

默认情况下，`deploy.sh` 会创建令牌身份验证。获取生成的 Gateway 网关令牌，以用于 Control UI：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

进行本地调试时，`./scripts/k8s/deploy.sh --show-token` 会在部署后输出令牌。

## 使用 Kind 进行本地测试

如果你没有集群，可以使用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 拆除
```

然后照常使用 `./scripts/k8s/deploy.sh` 进行部署。

## 分步操作

### 1）部署

**选项 A：通过环境变量提供 API key（一步完成）**

```bash
# 替换为你的提供商：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

该脚本会创建一个包含 API key 和自动生成的 Gateway 网关令牌的 Kubernetes Secret，然后执行部署。如果 Secret 已存在，它会保留当前的 Gateway 网关令牌以及所有未更改的提供商密钥。

**选项 B：单独创建 Secret**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

在任一命令中添加 `--show-token`，即可将令牌输出到标准输出以供本地测试。

### 2）访问 Gateway 网关

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署的内容

```text
命名空间：openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单个 Pod，初始化容器 + Gateway 网关
├── Service/openclaw           # 端口 18789 上的 ClusterIP
├── PersistentVolumeClaim      # 10Gi，用于智能体状态和配置
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 网关令牌 + API key
```

## 自定义

### 智能体说明

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md`，然后重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整参考请参阅 [Gateway 配置](/zh-CN/gateway/configuration)。

### 添加提供商

导出其他密钥后重新运行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

除非你覆盖现有提供商密钥，否则它们会保留在 Secret 中。

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
image: ghcr.io/openclaw/openclaw:slim # 主镜像；官方 Docker Hub 镜像：openclaw/openclaw
```

### 暴露到端口转发之外

默认清单将 Pod 内的 Gateway 网关绑定到环回地址。这适用于 `kubectl port-forward`，但不适用于需要直接访问 Pod IP 的 Kubernetes `Service` 或 Ingress 路径。

要通过 Ingress 或负载均衡器暴露 Gateway 网关：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 Gateway 网关绑定从 `loopback` 改为符合你部署模型的非环回绑定。
- 保持启用 Gateway 网关身份验证，并使用正确终止 TLS 的入口点。
- 使用受支持的 Web 安全模型配置 Control UI 以便远程访问（例如 HTTPS/Tailscale Serve，并在需要时显式设置允许的来源）。

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有清单并重启 Pod，以载入所有配置或 Secret 更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除命名空间及其中的所有资源，包括 PVC。

## 架构说明

- 默认情况下，Gateway 网关绑定到 Pod 内的环回地址，因此随附的设置适用于 `kubectl port-forward`。
- 不使用集群范围的资源；所有内容都位于单个命名空间中。
- 安全加固：`readOnlyRootFilesystem`、`drop: ALL` 权能、非 root 用户（UID 1000）。
- 默认配置使 Control UI 使用更安全的本地访问路径：环回绑定，并通过 `kubectl port-forward` 转发到 `http://127.0.0.1:18789`。
- 如果需要从本地主机以外访问，请使用受支持的远程模型：HTTPS/Tailscale，以及适当的 Gateway 网关绑定和 Control UI 来源设置。
- Secret 在临时目录中生成并直接应用到集群；不会向仓库检出目录写入任何机密材料。

## 文件结构

```text
scripts/k8s/
├── deploy.sh                   # 创建命名空间和 Secret，通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础配置
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 带安全加固的 Pod 规范
    ├── pvc.yaml                # 10Gi 持久化存储
    └── service.yaml            # 端口 18789 上的 ClusterIP
```

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Docker VM 运行时](/zh-CN/install/docker-vm-runtime)
- [安装概览](/zh-CN/install)
