---
read_when:
    - 将 OpenClaw 部署到 Render
    - 你想使用 Render Blueprints 进行声明式云部署
summary: 使用基础设施即代码在 Render 上部署 OpenClaw
title: Render
x-i18n:
    generated_at: "2026-04-23T06:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

使用基础设施即代码在 Render 上部署 OpenClaw。随附的 `render.yaml` Blueprint 会以声明式方式定义你的整个技术栈——服务、磁盘、环境变量——因此你可以一键部署，并让基础设施与代码一起进行版本管理。

## 先决条件

- 一个 [Render 账户](https://render.com)（提供免费层）
- 你首选[模型提供商](/zh-CN/providers)的 API 密钥

## 使用 Render Blueprint 部署

[部署到 Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

点击此链接将会：

1. 从此仓库根目录中的 `render.yaml` Blueprint 创建一个新的 Render 服务。
2. 构建 Docker 镜像并部署

部署完成后，你的服务 URL 将遵循 `https://<service-name>.onrender.com` 这样的格式。

## 理解 Blueprint

Render Blueprints 是用于定义基础设施的 YAML 文件。此仓库中的 `render.yaml` 配置了运行 OpenClaw 所需的一切：

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

使用到的 Blueprint 关键特性：

| 特性 | 用途 |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | 从仓库的 Dockerfile 构建 |
| `healthCheckPath`     | Render 监控 `/health`，并在实例不健康时重启 |
| `generateValue: true` | 自动生成加密安全的值 |
| `disk`                | 可在重新部署后保留的持久化存储 |

## 选择套餐

| 套餐 | 休眠 | 磁盘 | 最适合 |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free      | 空闲 15 分钟后 | 不可用 | 测试、演示 |
| Starter   | 永不 | 1GB+          | 个人使用、小型团队 |
| Standard+ | 永不 | 1GB+          | 生产环境、多个渠道 |

Blueprint 默认使用 `starter`。若要使用免费层，请在你 fork 的 `render.yaml` 中将 `plan: starter` 改为 `plan: free`（但请注意：没有持久化磁盘意味着 OpenClaw 状态会在每次部署时重置）。

## 部署之后

### 访问控制 UI

Web 控制面板位于 `https://<your-service>.onrender.com/`。

使用已配置的共享密钥进行连接。此部署模板会自动生成 `OPENCLAW_GATEWAY_TOKEN`（可在 **Dashboard → your service → Environment** 中找到）；如果你将其替换为密码认证，请改用该密码。

## Render 控制面板功能

### 日志

可在 **Dashboard → your service → Logs** 中查看实时日志。可按以下类型筛选：

- 构建日志（Docker 镜像创建）
- 部署日志（服务启动）
- 运行时日志（应用输出）

### Shell 访问

如需调试，可通过 **Dashboard → your service → Shell** 打开一个 shell 会话。持久化磁盘挂载在 `/data`。

### 环境变量

可在 **Dashboard → your service → Environment** 中修改变量。修改后会触发自动重新部署。

### 自动部署

如果你使用的是原始 OpenClaw 仓库，Render 不会自动部署你的 OpenClaw。要更新它，请从控制面板手动执行 Blueprint 同步。

## 自定义域名

1. 前往 **Dashboard → your service → Settings → Custom Domains**
2. 添加你的域名
3. 按照说明配置 DNS（CNAME 指向 `*.onrender.com`）
4. Render 会自动配置 TLS 证书

## 扩缩容

Render 支持水平扩展和垂直扩展：

- **垂直扩展**：更换套餐以获得更多 CPU / RAM
- **水平扩展**：增加实例数量（Standard 套餐及以上）

对于 OpenClaw，通常垂直扩展就足够了。水平扩展则需要粘性会话或外部状态管理。

## 备份与迁移

你可以随时使用 Render 控制面板中的 shell 访问导出状态、配置、认证配置文件和工作区：

```bash
openclaw backup create
```

这会创建一个可移植的备份归档，其中包含 OpenClaw 状态以及所有已配置的工作区。详见[备份](/zh-CN/cli/backup)。

## 故障排除

### 服务无法启动

请检查 Render 控制面板中的部署日志。常见问题包括：

- 缺少 `OPENCLAW_GATEWAY_TOKEN` —— 确认已在 **Dashboard → Environment** 中设置
- 端口不匹配 —— 确保已设置 `OPENCLAW_GATEWAY_PORT=8080`，使 Gateway 网关绑定到 Render 所期望的端口

### 冷启动较慢（免费层）

免费层服务会在空闲 15 分钟后休眠。休眠后的首次请求需要几秒钟，因为容器需要启动。升级到 Starter 套餐即可保持始终在线。

### 重新部署后数据丢失

这会发生在免费层（无持久化磁盘）上。请升级到付费套餐，或定期在 Render shell 中通过 `openclaw backup create` 导出完整备份。

### 健康检查失败

Render 要求 `/health` 在 30 秒内返回 200 响应。如果构建成功但部署失败，可能是服务启动耗时过长。请检查：

- 构建日志中是否有错误
- 容器在本地使用 `docker build && docker run` 是否可以运行

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[更新](/zh-CN/install/updating)
