---
read_when:
    - 你想将腾讯 Hy3 预览版与 OpenClaw 一起使用
    - 你需要完成 TokenHub API 密钥设置
summary: 腾讯云 TokenHub 设置，用于 Hy3 预览版
title: 腾讯云（TokenHub）
x-i18n:
    generated_at: "2026-06-27T03:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

安装官方腾讯云提供商插件，通过 TokenHub 端点（`tencent-tokenhub`）使用 OpenAI 兼容 API 访问 Tencent Hy3 preview。

| 属性             | 值                                                    |
| ---------------- | ----------------------------------------------------- |
| 提供商 id        | `tencent-tokenhub`                                    |
| 包               | `@openclaw/tencent-provider`                          |
| 凭证环境变量     | `TOKENHUB_API_KEY`                                    |
| 新手引导标志     | `--auth-choice tokenhub-api-key`                      |
| 直接 CLI 标志    | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 兼容（`openai-completions`）                   |
| 默认基础 URL     | `https://tokenhub.tencentmaas.com/v1`                 |
| 全局基础 URL     | `https://tokenhub-intl.tencentmaas.com/v1`（覆盖）    |
| 默认模型         | `tencent-tokenhub/hy3-preview`                        |

## 快速开始

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="创建 TokenHub API key">
    在 Tencent Cloud TokenHub 中创建 API key。如果你为该 key 选择了受限访问范围，请在允许的模型中包含 **Hy3 preview**。
  </Step>
  <Step title="运行新手引导">
    <CodeGroup>

```bash 新手引导
openclaw onboard --auth-choice tokenhub-api-key
```

```bash 直接标志
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash 仅环境变量
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                       | 名称                   | 输入 | 上下文  | 最大输出 | 说明                         |
| ------------------------------ | ---------------------- | ---- | ------- | -------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text | 256,000 | 64,000   | 默认；支持推理               |

Hy3 preview 是 Tencent Hunyuan 面向推理、长上下文指令遵循、代码和智能体工作流的大型 MoE 语言模型。Tencent 的 OpenAI 兼容示例使用 `hy3-preview` 作为模型 id，并支持标准 chat-completions 工具调用以及 `reasoning_effort`。

<Tip>
  模型 id 是 `hy3-preview`。不要将它与 Tencent 的 `HY-3D-*` 模型混淆，后者是 3D 生成 API，并不是此提供商配置的 OpenClaw 聊天模型。
</Tip>

## 分层定价

提供商目录内置了随输入窗口长度缩放的分层成本元数据，因此无需手动覆盖即可填充成本估算。

| 输入 token 范围 | 输入费率 | 输出费率 | 缓存读取 |
| ---------------- | -------- | -------- | -------- |
| 0 - 16,000       | 0.176    | 0.587    | 0.059    |
| 16,000 - 32,000  | 0.235    | 0.939    | 0.088    |
| 32,000+          | 0.293    | 1.173    | 0.117    |

费率按 Tencent 公布的美元每百万 token 计算。仅在需要不同计费表面时，才在 `models.providers.tencent-tokenhub` 下覆盖定价。

## 高级配置

<AccordionGroup>
  <Accordion title="端点覆盖">
    OpenClaw 默认使用 Tencent Cloud 的 `https://tokenhub.tencentmaas.com/v1` 端点。Tencent 还记录了一个国际 TokenHub 端点：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    仅当你的 TokenHub 账号或区域要求时，才覆盖端点。

  </Accordion>

  <Accordion title="daemon 的环境可用性">
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），`TOKENHUB_API_KEY` 必须对该进程可见。请在 `~/.openclaw/.env` 中设置，或通过 `env.shellEnv` 设置，以便 launchd、systemd 或 Docker exec 环境可以读取它。

    <Warning>
      仅在交互式 shell 中导出的 key 对托管 Gateway 网关进程不可见。请使用 env 文件或配置接缝来实现持久可用性。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration" icon="gear">
    包含提供商设置的完整配置 schema。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud 的 TokenHub 产品页面。
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview 的详细信息和基准测试。
  </Card>
</CardGroup>
