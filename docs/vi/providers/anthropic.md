---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude thông qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:47:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng họ mô hình **Claude**. OpenClaw hỗ trợ hai tuyến xác thực:

- **API key** — truy cập trực tiếp API Anthropic với tính phí theo mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** — tái sử dụng phiên đăng nhập Claude CLI hiện có trên cùng máy chủ

<Warning>
Nhân viên Anthropic đã cho chúng tôi biết rằng việc dùng Claude CLI theo kiểu OpenClaw đã được cho phép trở lại, nên
OpenClaw coi việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận trừ khi
Anthropic công bố chính sách mới.

Với các máy chủ gateway chạy lâu dài, API key của Anthropic vẫn là đường dẫn sản xuất rõ ràng và
dễ dự đoán nhất.

Tài liệu công khai hiện tại của Anthropic:

- [Tham chiếu Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Tổng quan Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Dùng Claude Code với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Dùng Claude Code với gói Team hoặc Enterprise của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Bắt đầu

<Tabs>
  <Tab title="API key">
    **Phù hợp nhất cho:** truy cập API tiêu chuẩn và tính phí theo mức sử dụng.

    <Steps>
      <Step title="Get your API key">
        Tạo API key trong [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Phù hợp nhất cho:** tái sử dụng phiên đăng nhập Claude CLI hiện có mà không cần API key riêng.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Xác minh bằng:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw phát hiện và tái sử dụng thông tin đăng nhập Claude CLI hiện có.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Chi tiết thiết lập và runtime cho backend Claude CLI có trong [Backend CLI](/vi/gateway/cli-backends).
    </Note>

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cùng với ghi đè runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Các tham chiếu mô hình cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để
    tương thích, nhưng cấu hình mới nên giữ phần chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong chính sách runtime của nhà cung cấp/mô hình.

    <Tip>
    Nếu bạn muốn đường dẫn tính phí rõ ràng nhất, hãy dùng API key của Anthropic. OpenClaw cũng hỗ trợ các tùy chọn kiểu đăng ký từ [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), và [Z.AI / GLM](/vi/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Mặc định suy luận (Claude 4.6)

Các mô hình Claude 4.6 mặc định dùng suy luận `adaptive` trong OpenClaw khi chưa đặt mức suy luận rõ ràng.

Ghi đè theo từng tin nhắn bằng `/think:<level>` hoặc trong tham số mô hình:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Tài liệu Anthropic liên quan:
- [Suy luận thích ứng](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Suy luận mở rộng](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Lưu bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng lưu bộ nhớ đệm prompt của Anthropic cho xác thực bằng API key.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                      |
| ------------------- | --------------------- | ------------------------------------------ |
| `"short"` (mặc định) | 5 phút               | Tự động áp dụng cho xác thực bằng API key  |
| `"long"`            | 1 giờ                 | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không lưu bộ nhớ đệm  | Tắt lưu bộ nhớ đệm prompt                  |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Dùng tham số cấp mô hình làm đường cơ sở, rồi ghi đè các tác nhân cụ thể qua `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Thứ tự hợp nhất cấu hình:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (khớp `id`, ghi đè theo khóa)

    Điều này cho phép một tác nhân giữ bộ nhớ đệm dài hạn trong khi một tác nhân khác trên cùng mô hình tắt lưu bộ nhớ đệm cho lưu lượng đột biến/tái sử dụng thấp.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị buộc dùng `cacheRetention: "none"` trong runtime.
    - Mặc định thông minh cho API key cũng đặt sẵn `cacheRetention: "short"` cho các tham chiếu Claude-on-Bedrock khi chưa đặt giá trị rõ ràng.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Fast mode">
    Công tắc `/fast` dùng chung của OpenClaw hỗ trợ lưu lượng Anthropic trực tiếp (API key và OAuth tới `api.anthropic.com`).

    | Lệnh | Ánh xạ tới |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Chỉ được chèn cho các yêu cầu trực tiếp tới `api.anthropic.com`. Các tuyến proxy giữ nguyên `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` rõ ràng sẽ ghi đè `/fast` khi cả hai được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể được phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải năng lực media từ xác thực Anthropic đã cấu hình — không
    cần cấu hình bổ sung.

    | Thuộc tính       | Giá trị               |
    | --------------- | --------------------- |
    | Mô hình mặc định | `claude-opus-4-7`     |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi hình ảnh hoặc PDF được đính kèm vào một cuộc trò chuyện, OpenClaw tự động
    định tuyến nó qua nhà cung cấp hiểu media của Anthropic.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Cửa sổ ngữ cảnh 1M của Anthropic được kiểm soát bằng beta. Bật theo từng mô hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw ánh xạ điều này thành `anthropic-beta: context-1m-2025-08-07` trên các yêu cầu.

    `params.context1m: true` cũng áp dụng cho backend Claude CLI
    (`claude-cli/*`) với các mô hình Opus và Sonnet đủ điều kiện, mở rộng cửa sổ
    ngữ cảnh runtime cho các phiên CLI đó để khớp hành vi API trực tiếp.

    <Warning>
    Yêu cầu quyền truy cập ngữ cảnh dài trên thông tin đăng nhập Anthropic của bạn. Xác thực token cũ (`sk-ant-oat-*`) bị từ chối cho các yêu cầu ngữ cảnh 1M — OpenClaw ghi cảnh báo và quay về cửa sổ ngữ cảnh tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Xác thực token Anthropic sẽ hết hạn và có thể bị thu hồi. Với các thiết lập mới, hãy dùng API key của Anthropic thay thế.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Xác thực Anthropic là **theo từng tác nhân** — tác nhân mới không kế thừa khóa của tác nhân chính. Chạy lại onboarding cho tác nhân đó (hoặc cấu hình API key trên máy chủ gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại onboarding, hoặc cấu hình API key cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Kiểm tra `openclaw models status --json` để xem `auth.unusableProfiles`. Các thời gian chờ do giới hạn tốc độ của Anthropic có thể được phạm vi hóa theo mô hình, nên một mô hình Anthropic cùng cấp vẫn có thể dùng được. Thêm hồ sơ Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [FAQ](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="CLI backends" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và chi tiết runtime.
  </Card>
  <Card title="Prompt caching" href="/vi/reference/prompt-caching" icon="database">
    Cách lưu bộ nhớ đệm prompt hoạt động trên các nhà cung cấp.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin đăng nhập.
  </Card>
</CardGroup>
