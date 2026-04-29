---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-29T23:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng dòng mô hình **Claude**. OpenClaw hỗ trợ hai cách xác thực:

- **Khóa API** — truy cập trực tiếp API Anthropic với tính phí theo mức sử dụng (mô hình `anthropic/*`)
- **Claude CLI** — dùng lại phiên đăng nhập Claude CLI hiện có trên cùng máy chủ

<Warning>
Nhân viên Anthropic đã cho chúng tôi biết rằng kiểu sử dụng Claude CLI như OpenClaw được phép trở lại, nên
OpenClaw xem việc dùng lại Claude CLI và sử dụng `claude -p` là được chấp thuận trừ khi
Anthropic công bố chính sách mới.

Với các máy chủ Gateway chạy lâu dài, khóa API Anthropic vẫn là đường dẫn sản xuất rõ ràng và
dễ dự đoán nhất.

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
      <Step title="Chạy onboarding">
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
      <Step title="Đảm bảo Claude CLI đã được cài đặt và đã đăng nhập">
        Xác minh bằng:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Chạy onboarding">
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

    Ưu tiên ref mô hình Anthropic chuẩn cùng với ghi đè runtime CLI:

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

    Ref mô hình `claude-cli/claude-opus-4-7` cũ vẫn hoạt động để
    tương thích, nhưng cấu hình mới nên giữ lựa chọn provider/mô hình dưới dạng
    `anthropic/*` và đặt backend thực thi trong `agentRuntime.id`.

    <Tip>
    Nếu bạn muốn đường dẫn tính phí rõ ràng nhất, hãy dùng khóa API Anthropic. OpenClaw cũng hỗ trợ các tùy chọn kiểu đăng ký từ [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), và [Z.AI / GLM](/vi/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Mặc định thinking (Claude 4.6)

Các mô hình Claude 4.6 mặc định dùng thinking `adaptive` trong OpenClaw khi không đặt cấp thinking rõ ràng.

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Lưu bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng lưu bộ nhớ đệm prompt của Anthropic cho xác thực bằng khóa API.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                      |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (mặc định) | 5 phút         | Tự động áp dụng cho xác thực bằng khóa API |
| `"long"`            | 1 giờ          | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không lưu bộ nhớ đệm | Tắt lưu bộ nhớ đệm prompt                 |

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
    Dùng tham số cấp mô hình làm đường cơ sở, rồi ghi đè các agent cụ thể qua `agents.list[].params`:

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

    Điều này cho phép một agent giữ bộ nhớ đệm dài hạn trong khi agent khác trên cùng mô hình tắt lưu bộ nhớ đệm cho lưu lượng bùng nổ/ít tái sử dụng.

  </Accordion>

  <Accordion title="Ghi chú về Bedrock Claude">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị ép thành `cacheRetention: "none"` tại runtime.
    - Mặc định thông minh cho khóa API cũng khởi tạo `cacheRetention: "short"` cho các ref Claude-on-Bedrock khi không đặt giá trị rõ ràng.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ nhanh">
    Nút bật/tắt `/fast` dùng chung của OpenClaw hỗ trợ lưu lượng Anthropic trực tiếp (khóa API và OAuth tới `api.anthropic.com`).

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
    - Chỉ được chèn cho yêu cầu trực tiếp tới `api.anthropic.com`. Các tuyến proxy giữ nguyên `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` rõ ràng sẽ ghi đè `/fast` khi cả hai được đặt.
    - Trên tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể được phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu media (hình ảnh và PDF)">
    Plugin Anthropic được đóng gói đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải các khả năng media từ xác thực Anthropic đã cấu hình — không
    cần cấu hình bổ sung.

    | Thuộc tính     | Giá trị              |
    | -------------- | -------------------- |
    | Mô hình mặc định | `claude-opus-4-6`    |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi hình ảnh hoặc PDF được đính kèm vào cuộc trò chuyện, OpenClaw tự động
    định tuyến nó qua provider hiểu media Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M (beta)">
    Cửa sổ ngữ cảnh 1M của Anthropic bị giới hạn bởi beta. Bật theo từng mô hình:

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
    ngữ cảnh runtime cho các phiên CLI đó để khớp với hành vi API trực tiếp.

    <Warning>
    Yêu cầu quyền truy cập ngữ cảnh dài trên thông tin xác thực Anthropic của bạn. Xác thực token cũ (`sk-ant-oat-*`) bị từ chối cho các yêu cầu ngữ cảnh 1M — OpenClaw ghi cảnh báo và quay về cửa sổ ngữ cảnh tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.7">
    `anthropic/claude-opus-4.7` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / token đột nhiên không hợp lệ">
    Xác thực token Anthropic hết hạn và có thể bị thu hồi. Với thiết lập mới, hãy dùng khóa API Anthropic thay thế.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho provider "anthropic"'>
    Xác thực Anthropic là **theo từng agent** — agent mới không kế thừa khóa của agent chính. Chạy lại onboarding cho agent đó (hoặc cấu hình khóa API trên máy chủ Gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho profile "anthropic:default"'>
    Chạy `openclaw models status` để xem profile xác thực nào đang hoạt động. Chạy lại onboarding, hoặc cấu hình khóa API cho đường dẫn profile đó.
  </Accordion>

  <Accordion title="Không có profile xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `openclaw models status --json` để xem `auth.unusableProfiles`. Thời gian chờ do giới hạn tốc độ của Anthropic có thể theo phạm vi mô hình, nên một mô hình Anthropic cùng nhóm vẫn có thể dùng được. Thêm một profile Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, ref mô hình và hành vi failover.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và chi tiết runtime.
  </Card>
  <Card title="Lưu bộ nhớ đệm prompt" href="/vi/reference/prompt-caching" icon="database">
    Cách lưu bộ nhớ đệm prompt hoạt động trên các provider.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc dùng lại thông tin xác thực.
  </Card>
</CardGroup>
