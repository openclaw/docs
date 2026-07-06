---
read_when:
    - 你想在 OpenClaw 中使用腾讯 hy3
    - 你需要完成 TokenHub 或 TokenPlan API 密钥设置
summary: hy3 的腾讯云 TokenHub 和 TokenPlan 设置
title: 腾讯云（TokenHub / TokenPlan）
x-i18n:
    generated_at: "2026-07-06T10:52:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

安装官方 Tencent Cloud provider 插件，通过两个端点访问 Tencent Hy3：TokenHub（`tencent-tokenhub`）和 TokenPlan（`tencent-tokenplan`），使用 OpenAI 兼容 API。

| 属性                      | 值                                                    |
| ------------------------- | ----------------------------------------------------- |
| 提供商 id                 | `tencent-tokenhub`, `tencent-tokenplan`               |
| 包                        | `@openclaw/tencent-provider`                          |
| TokenHub 认证环境变量     | `TOKENHUB_API_KEY`                                    |
| TokenPlan 认证环境变量    | `TOKENPLAN_API_KEY`                                   |
| TokenHub 新手引导标志     | `--auth-choice tokenhub-api-key`                      |
| TokenPlan 新手引导标志    | `--auth-choice tokenplan-api-key`                     |
| TokenHub 直接 CLI 标志    | `--tokenhub-api-key <key>`                            |
| TokenPlan 直接 CLI 标志   | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI 兼容（`openai-completions`）                   |
| TokenHub 基础 URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub 全局基础 URL     | `https://tokenhub-intl.tencentmaas.com/v1`（覆盖）    |
| TokenPlan 基础 URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| 默认模型                  | `tencent-tokenhub/hy3`                                |

## 快速开始

<Steps>
  <Step title="Create a Tencent API key">
    为 Tencent Cloud TokenHub 和 TokenPlan 创建 API key。如果你为该 key 选择了有限访问范围，请在允许的模型中包含 **hy3**（如果计划在 TokenHub 上使用，还要包含 **hy3 preview**）。
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## 非交互式设置

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` 必须与 `--non-interactive` 一起使用。
</Note>

## 内置目录

| 模型引用                       | 名称                   | 输入 | 上下文  | 最大输出   | 备注             |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview（TokenHub） | text  | 256,000 | 64,000     | 已启用推理       |
| `tencent-tokenhub/hy3`         | hy3（TokenHub）         | text  | 256,000 | 64,000     | 已启用推理       |
| `tencent-tokenplan/hy3`        | hy3（TokenPlan）        | text  | 256,000 | 64,000     | 已启用推理       |

hy3 是 Tencent Hunyuan 面向推理、长上下文指令遵循、代码和 agent 工作流的大型 MoE 语言模型。Tencent 的 OpenAI 兼容示例使用 `hy3` 作为模型 id，并支持标准 chat-completions 工具调用以及 `reasoning_effort`。

<Tip>
  模型 id 是 `hy3`。不要将它与 Tencent 的 `HY-3D-*` 模型混淆，后者是 3D 生成 API，并不是此提供商配置的 OpenClaw 聊天模型。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw 的内置目录使用 Tencent Cloud 的 `https://tokenhub.tencentmaas.com/v1` 端点。仅当你的 TokenHub 账户或区域需要其他端点时才覆盖它：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），`TOKENHUB_API_KEY` 和 `TOKENPLAN_API_KEY` 必须对该进程可见。请在 `~/.openclaw/.env` 中设置它们，或通过 `env.shellEnv` 设置，以便 launchd、systemd 或 Docker exec 环境可以读取它们。

    <Warning>
      仅在交互式 shell 中导出的 key 对托管 Gateway 网关进程不可见。请使用 env 文件或配置接口来确保持续可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括提供商设置。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud 的 TokenHub 产品页面。
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview 详情和基准测试。
  </Card>
</CardGroup>
