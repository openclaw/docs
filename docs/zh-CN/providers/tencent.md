---
read_when:
    - 你想在 OpenClaw 中使用腾讯 hy3
    - 你需要设置 TokenHub 或 TokenPlan API key
summary: hy3 的腾讯云 TokenHub 和 TokenPlan 设置
title: 腾讯云（TokenHub / TokenPlan）
x-i18n:
    generated_at: "2026-07-11T20:53:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

安装官方腾讯云提供商插件，通过两个端点——TokenHub（`tencent-tokenhub`）和 TokenPlan（`tencent-tokenplan`）——使用 OpenAI 兼容 API 访问腾讯 Hy3。

| 属性                      | 值                                                    |
| ------------------------- | ----------------------------------------------------- |
| 提供商 ID                 | `tencent-tokenhub`、`tencent-tokenplan`               |
| 软件包                    | `@openclaw/tencent-provider`                          |
| TokenHub 身份验证环境变量 | `TOKENHUB_API_KEY`                                    |
| TokenPlan 身份验证环境变量 | `TOKENPLAN_API_KEY`                                  |
| TokenHub 新手引导标志     | `--auth-choice tokenhub-api-key`                      |
| TokenPlan 新手引导标志    | `--auth-choice tokenplan-api-key`                     |
| TokenHub 直接 CLI 标志    | `--tokenhub-api-key <key>`                            |
| TokenPlan 直接 CLI 标志   | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI 兼容（`openai-completions`）                   |
| TokenHub 基础 URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub 全球基础 URL     | `https://tokenhub-intl.tencentmaas.com/v1`（覆盖）    |
| TokenPlan 基础 URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| 默认模型                  | `tencent-tokenhub/hy3`                                |

## 快速开始

<Steps>
  <Step title="创建腾讯 API 密钥">
    为腾讯云 TokenHub 和 TokenPlan 创建 API 密钥。如果为密钥选择受限的访问范围，请在允许的模型中包含 **hy3**；如果计划在 TokenHub 上使用 **hy3 preview**，也请将其包含在内。
  </Step>
  <Step title="运行新手引导">
    <CodeGroup>

```bash TokenHub 新手引导
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub 直接标志
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan 新手引导
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan 直接标志
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash 仅使用环境变量
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型">
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
使用 `--non-interactive` 时必须同时使用 `--accept-risk`。
</Note>

## 内置目录

| 模型引用                       | 名称                  | 输入 | 上下文  | 最大输出 | 备注       |
| ------------------------------ | --------------------- | ---- | ------- | -------- | ---------- |
| `tencent-tokenhub/hy3-preview` | hy3 预览版（TokenHub） | 文本 | 256,000 | 64,000   | 支持推理   |
| `tencent-tokenhub/hy3`         | hy3（TokenHub）        | 文本 | 256,000 | 64,000   | 支持推理   |
| `tencent-tokenplan/hy3`        | hy3（TokenPlan）       | 文本 | 256,000 | 64,000   | 支持推理   |

hy3 是腾讯混元的大型 MoE 语言模型，适用于推理、长上下文指令遵循、代码和智能体工作流。腾讯的 OpenAI 兼容示例使用 `hy3` 作为模型 ID，并支持标准聊天补全工具调用和 `reasoning_effort`。

<Tip>
  模型 ID 是 `hy3`。不要将其与腾讯的 `HY-3D-*` 模型混淆；后者是 3D 生成 API，并非此提供商所配置的 OpenClaw 聊天模型。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="端点覆盖">
    OpenClaw 的内置目录使用腾讯云的 `https://tokenhub.tencentmaas.com/v1` 端点。仅当你的 TokenHub 账户或区域需要其他端点时才覆盖它：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="守护进程的环境变量可用性">
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），`TOKENHUB_API_KEY` 和 `TOKENPLAN_API_KEY` 必须对该进程可见。请在 `~/.openclaw/.env` 中设置它们，或通过 `env.shellEnv` 设置，以便 launchd、systemd 或 Docker 的执行环境能够读取它们。

    <Warning>
      仅在交互式 shell 中导出的密钥对托管的 Gateway 网关进程不可见。请使用环境变量文件或配置接口来确保其持久可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包含提供商设置的完整配置架构。
  </Card>
  <Card title="腾讯 TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    腾讯云的 TokenHub 产品页面。
  </Card>
  <Card title="Hy3 预览版模型卡" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    腾讯混元 Hy3 预览版的详细信息和基准测试。
  </Card>
</CardGroup>
