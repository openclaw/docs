---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng họ mô hình **Claude**. OpenClaw hỗ trợ hai cách xác thực:

- **Khóa API** — truy cập trực tiếp API Anthropic với tính phí theo mức sử dụng (mô hình `anthropic/*`)
- **Claude CLI** — dùng lại phiên đăng nhập Claude CLI hiện có trên cùng máy chủ

<Warning>
Nhân viên Anthropic đã cho chúng tôi biết rằng cách dùng Claude CLI kiểu OpenClaw đã được cho phép trở lại, vì vậy
OpenClaw xem việc dùng lại Claude CLI và sử dụng `claude -p` là được chấp thuận, trừ khi
Anthropic công bố chính sách mới.

Đối với các máy chủ Gateway chạy lâu dài, khóa API Anthropic vẫn là lộ trình sản xuất rõ ràng
và dễ dự đoán nhất.

Tài liệu công khai hiện tại của Anthropic:

- [Tham chiếu Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Tổng quan Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Sử dụng Claude Code với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Sử dụng Claude Code với gói Team hoặc Enterprise của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Bắt đầu

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** truy cập API tiêu chuẩn và tính phí theo mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo khóa API trong [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
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
    **Phù hợp nhất cho:** dùng lại phiên đăng nhập Claude CLI hiện có mà không cần khóa API riêng.

    <Steps>
      <Step title="Đảm bảo Claude CLI đã được cài đặt và đăng nhập">
        Xác minh bằng:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw phát hiện và dùng lại thông tin xác thực Claude CLI hiện có.
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Chi tiết thiết lập và runtime cho backend Claude CLI nằm trong [Backend CLI](/vi/gateway/cli-backends).
    </Note>

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cùng một ghi đè runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Các tham chiếu mô hình cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để
    tương thích, nhưng cấu hình mới nên giữ phần chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong `agentRuntime.id`.

    <Tip>
    Nếu bạn muốn lộ trình tính phí rõ ràng nhất, hãy dùng khóa API Anthropic. OpenClaw cũng hỗ trợ các tùy chọn kiểu thuê bao từ [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), và [Z.AI / GLM](/vi/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Mặc định suy nghĩ (Claude 4.6)

Các mô hình Claude 4.6 mặc định dùng suy nghĩ `adaptive` trong OpenClaw khi không đặt mức suy nghĩ rõ ràng.

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
- [Suy nghĩ thích ứng](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Suy nghĩ mở rộng](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Lưu bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng lưu bộ nhớ đệm prompt của Anthropic cho xác thực bằng khóa API.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                      |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (mặc định) | 5 phút         | Tự động áp dụng cho xác thực bằng khóa API |
| `"long"`            | 1 giờ          | Bộ nhớ đệm mở rộng                      |
| `"none"`            | Không lưu bộ nhớ đệm | Tắt lưu bộ nhớ đệm prompt              |

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
  <Accordion title="Ghi đè bộ nhớ đệm theo từng agent">
    Dùng tham số cấp mô hình làm đường cơ sở, sau đó ghi đè các agent cụ thể qua `agents.list[].params`:

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

    Điều này cho phép một agent giữ bộ nhớ đệm dài hạn trong khi một agent khác trên cùng mô hình tắt bộ nhớ đệm cho lưu lượng tăng đột biến hoặc ít tái sử dụng.

  </Accordion>

  <Accordion title="Ghi chú về Bedrock Claude">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị ép thành `cacheRetention: "none"` trong runtime.
    - Các mặc định thông minh cho khóa API cũng đặt trước `cacheRetention: "short"` cho tham chiếu Claude-on-Bedrock khi không đặt giá trị rõ ràng.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ nhanh">
    Công tắc `/fast` dùng chung của OpenClaw hỗ trợ lưu lượng Anthropic trực tiếp (khóa API và OAuth đến `api.anthropic.com`).

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
    - Chỉ được chèn cho các yêu cầu trực tiếp đến `api.anthropic.com`. Các tuyến proxy giữ nguyên `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` rõ ràng sẽ ghi đè `/fast` khi cả hai đều được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể được phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu nội dung media (hình ảnh và PDF)">
    Plugin Anthropic được đóng gói đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải năng lực media từ xác thực Anthropic đã cấu hình — không
    cần cấu hình bổ sung.

    | Thuộc tính      | Giá trị                |
    | --------------- | --------------------- |
    | Mô hình mặc định | `claude-opus-4-7`     |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi một hình ảnh hoặc PDF được đính kèm vào cuộc trò chuyện, OpenClaw tự động
    định tuyến nó qua nhà cung cấp hiểu media Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M (beta)">
    Cửa sổ ngữ cảnh 1M của Anthropic đang được kiểm soát bằng beta. Bật theo từng mô hình:

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

    OpenClaw ánh xạ giá trị này thành `anthropic-beta: context-1m-2025-08-07` trên các yêu cầu.

    `params.context1m: true` cũng áp dụng cho backend Claude CLI
    (`claude-cli/*`) đối với các mô hình Opus và Sonnet đủ điều kiện, mở rộng cửa sổ
    ngữ cảnh runtime cho các phiên CLI đó để khớp với hành vi API trực tiếp.

    <Warning>
    Yêu cầu thông tin xác thực Anthropic của bạn có quyền truy cập ngữ cảnh dài. Xác thực token cũ (`sk-ant-oat-*`) bị từ chối cho các yêu cầu ngữ cảnh 1M — OpenClaw ghi cảnh báo và quay về cửa sổ ngữ cảnh tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.7">
    `anthropic/claude-opus-4.7` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / token đột ngột không hợp lệ">
    Xác thực bằng token Anthropic sẽ hết hạn và có thể bị thu hồi. Với các thiết lập mới, hãy dùng khóa API Anthropic thay thế.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho nhà cung cấp "anthropic"'>
    Xác thực Anthropic là **theo từng agent** — các agent mới không kế thừa khóa của agent chính. Chạy lại quy trình thiết lập ban đầu cho agent đó (hoặc cấu hình khóa API trên máy chủ Gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho hồ sơ "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại quy trình thiết lập ban đầu, hoặc cấu hình khóa API cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="Không có hồ sơ xác thực khả dụng (tất cả đang trong thời gian hồi">
    Kiểm tra `openclaw models status --json` để xem `auth.unusableProfiles`. Thời gian hồi do giới hạn tốc độ của Anthropic có thể theo từng mô hình, nên một mô hình Anthropic cùng nhóm có thể vẫn dùng được. Thêm hồ sơ Anthropic khác hoặc chờ hết thời gian hồi.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Chi tiết thiết lập và runtime backend Claude CLI.
  </Card>
  <Card title="Lưu bộ nhớ đệm prompt" href="/vi/reference/prompt-caching" icon="database">
    Cách lưu bộ nhớ đệm prompt hoạt động trên các nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc dùng lại thông tin xác thực.
  </Card>
</CardGroup>
