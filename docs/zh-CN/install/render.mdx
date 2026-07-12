---
read_when:
    - 将 OpenClaw 部署到 Render
    - 你希望使用 Render Blueprints 进行声明式云部署
summary: 使用基础设施即代码在 Render 上部署 OpenClaw
title: 渲染
x-i18n:
    generated_at: "2026-07-11T20:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

在 [Render](https://render.com) 上使用仓库中的 `render.yaml` Blueprint 部署 OpenClaw。它在一个文件中声明服务、磁盘和环境变量。

## 前置条件

- 一个 [Render 账户](https://render.com)（提供免费套餐）
- 来自你首选[模型提供商](/zh-CN/providers)的 API 密钥

## 部署

[部署到 Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

这会根据 `render.yaml` 创建 Render 服务、构建 Docker 镜像并进行部署。你的服务 URL 遵循 `https://<service-name>.onrender.com` 格式。

## Blueprint

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
        generateValue: true # 自动生成安全令牌
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 功能                  | 用途                                                        |
| --------------------- | ----------------------------------------------------------- |
| `runtime: docker`     | 根据仓库中的 Dockerfile 构建                                |
| `healthCheckPath`     | Render 监控 `/health` 并重启不健康的实例                    |
| `generateValue: true` | 自动生成密码学安全值                                        |
| `disk`                | 重新部署后仍保留的持久化存储                                |

## 选择套餐

| 套餐      | 休眠              | 磁盘     | 最适合                     |
| --------- | ----------------- | -------- | -------------------------- |
| 免费      | 空闲 15 分钟后    | 不可用   | 测试、演示                 |
| Starter   | 从不              | 1GB+     | 个人使用、小型团队         |
| Standard+ | 从不              | 1GB+     | 生产环境、多个渠道         |

Blueprint 默认为 `starter`。若要使用免费套餐，请在你的复刻仓库的 `render.yaml` 中改为 `plan: free`——请注意，由于没有持久化磁盘，每次部署时 OpenClaw 状态都会重置。

## 部署后

### 访问 Control UI

Web 仪表板位于 `https://<your-service>.onrender.com/`。使用共享密钥进行连接：自动生成的 `OPENCLAW_GATEWAY_TOKEN`（可在 **Dashboard → your service → Environment** 中找到）；如果你已切换为密码身份验证，则使用你的密码。

### 日志

**Dashboard → your service → Logs** 显示构建日志（创建 Docker 镜像）、部署日志（服务启动）和运行时日志（应用输出）。

### Shell 访问

**Dashboard → your service → Shell** 会打开 Shell 会话。持久化磁盘挂载在 `/data`。

### 环境变量

在 **Dashboard → your service → Environment** 中编辑变量。更改会触发自动重新部署。

### 自动部署

当所连接仓库的分支出现新提交时，Render 会自动重新部署。如果你直接从 `openclaw/openclaw` 而不是自己的复刻仓库进行部署，就没有推送权限来触发重新部署，因此请从 Dashboard 手动运行 Blueprint 同步来更新，或将服务指向你自己的复刻仓库。

## 自定义域名

1. **Dashboard → your service → Settings → Custom Domains**
2. 添加你的域名
3. 按照说明配置 DNS（将 CNAME 指向 `*.onrender.com`）
4. Render 会自动配置 TLS 证书

## 扩缩容

- **纵向扩容**：更改套餐以获得更多 CPU/RAM。通常足以满足 OpenClaw 的需求。
- **横向扩容**：增加实例数量（Standard 套餐及更高版本）。由于 OpenClaw 将运行时状态保存在本地磁盘上，因此需要粘性会话或外部状态管理。

## 备份和迁移

你可以随时从 Render Dashboard Shell 导出状态、配置、身份验证配置文件和工作区：

```bash
openclaw backup create
```

这会创建可移植的备份归档。请参阅[备份](/zh-CN/cli/backup)。

## 故障排查

### 服务无法启动

检查 Render Dashboard 中的部署日志。常见问题：

- 缺少 `OPENCLAW_GATEWAY_TOKEN`——确认已在 **Dashboard → Environment** 中设置
- 端口不匹配——确保设置 `OPENCLAW_GATEWAY_PORT=8080`，以便 Gateway 网关绑定到 Render 预期的端口

### 冷启动缓慢（免费套餐）

免费套餐服务在空闲 15 分钟后会休眠；休眠后的首次请求需要等待容器启动，因此会耗时数秒。升级到 Starter 即可保持持续运行。

### 重新部署后数据丢失

这种情况会发生在免费套餐中（无持久化磁盘）。请升级到付费套餐，或定期从 Render Shell 使用 `openclaw backup create` 导出备份。

### 健康检查失败

如果构建成功但部署失败，可能是服务启动耗时过长，或无法访问 `/health`。请检查：

- 构建日志中是否有错误
- 容器能否使用 `docker build && docker run` 在本地运行

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 使 OpenClaw 保持最新：[更新](/zh-CN/install/updating)
