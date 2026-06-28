---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng dòng mô hình **Claude**. OpenClaw hỗ trợ hai tuyến xác thực:

- **Khóa API** — truy cập trực tiếp Anthropic API với tính phí theo mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** — tái sử dụng phiên đăng nhập Claude Code hiện có trên cùng máy chủ

<Warning>
Backend Claude CLI của OpenClaw chạy Claude Code CLI đã cài đặt ở chế độ in không tương tác. Tài liệu Claude Code hiện tại của Anthropic mô tả `claude -p` là cách dùng Agent SDK/lập trình. Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng thay đổi tính phí Agent SDK đã công bố. Hiện tại, Anthropic cho biết việc sử dụng Claude Agent SDK, `claude -p` và ứng dụng bên thứ ba vẫn trừ vào giới hạn sử dụng của gói đăng ký. Tín dụng Agent SDK hằng tháng đã công bố trước đó không khả dụng trong khi Anthropic điều chỉnh kế hoạch đó.

Claude Code tương tác vẫn trừ vào giới hạn của gói Claude đã đăng nhập. Xác thực bằng khóa API vẫn là tính phí API trực tiếp theo mức dùng. Với các máy chủ Gateway chạy lâu dài, tự động hóa dùng chung và chi phí sản xuất dự đoán được, hãy dùng khóa API Anthropic.

Kiểm tra các bài viết hỗ trợ hiện tại của Anthropic trước khi dựa vào hành vi tính phí theo gói đăng ký:

- [Tài liệu tham chiếu Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Dùng Claude Agent SDK với gói Claude của bạn](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Dùng Claude Code với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Dùng Claude Code với gói Team hoặc Enterprise của bạn](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Quản lý chi phí Claude Code](https://code.claude.com/docs/en/costs)

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

        Hoặc truyền trực tiếp khóa:

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Phù hợp nhất cho:** tái sử dụng phiên đăng nhập Claude CLI hiện có mà không cần khóa API riêng.

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

        OpenClaw phát hiện và tái sử dụng thông tin đăng nhập Claude CLI hiện có.
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

    <Warning>
    Việc tái sử dụng Claude CLI yêu cầu tiến trình OpenClaw chạy trên cùng máy chủ với phiên đăng nhập Claude CLI. Các bản cài đặt Docker có thể duy trì thư mục home của container và đăng nhập vào Claude Code tại đó; xem
    [backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).
    Các bản cài đặt container khác như [Podman](/vi/install/podman) không gắn kết `~/.claude` của máy chủ vào thiết lập hoặc runtime; hãy dùng khóa API Anthropic ở đó, hoặc chọn nhà cung cấp có OAuth do OpenClaw quản lý như
    [OpenAI Codex](/vi/providers/openai).
    </Warning>

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn kèm ghi đè runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Các tham chiếu mô hình cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình là `anthropic/*` và đặt backend thực thi trong chính sách runtime của nhà cung cấp/mô hình.

    ### Tính phí và `claude -p`

    OpenClaw dùng đường dẫn `claude -p` không tương tác của Claude Code cho các lần chạy Claude CLI. Hiện Anthropic xem đường dẫn đó là cách dùng Agent SDK/lập trình:

    - Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng kế hoạch tín dụng Agent SDK riêng đã công bố trước đó.
    - Hiện tại, việc sử dụng Claude Agent SDK theo gói đăng ký, `claude -p` và ứng dụng bên thứ ba vẫn trừ vào giới hạn sử dụng của gói đăng ký đã đăng nhập.
    - Tín dụng Agent SDK hằng tháng đã công bố trước đó không khả dụng trong khi Anthropic điều chỉnh kế hoạch đó.
    - Đăng nhập Console/khóa API dùng tính phí API theo mức dùng và không nhận tín dụng Agent SDK của gói đăng ký.

    Xem [bài viết về gói Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    của Anthropic để biết thông báo tạm dừng, và các bài viết về gói Claude Code cho hành vi gói đăng ký
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    và
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Code mà không cần bản phát hành OpenClaw. Kiểm tra `claude auth status`, `/status` và tài liệu được liên kết của Anthropic khi cần dự đoán chi phí.

    <Tip>
    Với tự động hóa sản xuất dùng chung, hãy dùng khóa API Anthropic thay vì Claude CLI. OpenClaw cũng hỗ trợ các tùy chọn kiểu gói đăng ký từ
    [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax) và [Z.AI / GLM](/vi/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Mặc định suy luận (Claude Fable 5, 4.8 và 4.6)

`anthropic/claude-fable-5` luôn dùng suy luận thích ứng và mặc định ở mức nỗ lực `high`. Vì Anthropic không cho phép tắt suy luận cho mô hình này, `/think off` và `/think minimal` dùng mức nỗ lực `low`. OpenClaw cũng bỏ qua các giá trị temperature tùy chỉnh cho yêu cầu Fable 5.

Claude Opus 4.8 mặc định tắt suy luận trong OpenClaw. Khi bạn bật rõ ràng suy luận thích ứng bằng `/think high|xhigh|max`, OpenClaw gửi các giá trị nỗ lực Opus 4.8 của Anthropic; các mô hình Claude 4.6 mặc định là `adaptive`.

Ghi đè theo từng tin nhắn bằng `/think:<level>` hoặc trong tham số mô hình:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
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

## Bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng bộ nhớ đệm prompt của Anthropic cho xác thực bằng khóa API.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                      |
| ------------------- | --------------------- | ------------------------------------------ |
| `"short"` (mặc định) | 5 phút               | Tự động áp dụng cho xác thực bằng khóa API |
| `"long"`            | 1 giờ                 | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không lưu bộ nhớ đệm  | Tắt bộ nhớ đệm prompt                      |

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

    Thứ tự gộp cấu hình:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (khớp `id`, ghi đè theo khóa)

    Điều này cho phép một agent giữ bộ nhớ đệm dài hạn trong khi agent khác trên cùng mô hình tắt bộ nhớ đệm cho lưu lượng bùng phát/tái sử dụng thấp.

  </Accordion>

  <Accordion title="Ghi chú Claude trên Bedrock">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị ép thành `cacheRetention: "none"` ở runtime.
    - Mặc định thông minh cho khóa API cũng đặt sẵn `cacheRetention: "short"` cho tham chiếu Claude-on-Bedrock khi chưa đặt giá trị rõ ràng.

  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ nhanh">
    Công tắc `/fast` dùng chung của OpenClaw hỗ trợ lưu lượng Anthropic trực tiếp (khóa API và OAuth tới `api.anthropic.com`).

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
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu phương tiện (hình ảnh và PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw tự động phân giải khả năng phương tiện từ xác thực Anthropic đã cấu hình — không cần cấu hình bổ sung.

    | Thuộc tính      | Giá trị               |
    | --------------- | --------------------- |
    | Mô hình mặc định | `claude-opus-4-8`    |
    | Đầu vào hỗ trợ  | Hình ảnh, tài liệu PDF |

    Khi một hình ảnh hoặc PDF được đính kèm vào cuộc trò chuyện, OpenClaw tự động định tuyến nó qua nhà cung cấp hiểu phương tiện Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M">
    Cửa sổ ngữ cảnh 1M của Anthropic có sẵn trên các mô hình Claude 4.x hỗ trợ GA như Opus 4.8, Opus 4.7, Opus 4.6 và Sonnet 4.6. OpenClaw tự động đặt kích thước những mô hình đó ở 1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Cấu hình cũ hơn có thể giữ `params.context1m: true`, nhưng OpenClaw không còn gửi beta header `context-1m-2025-08-07` đã ngừng sử dụng. Các mục cấu hình `anthropicBeta` cũ hơn có giá trị đó bị bỏ qua trong quá trình phân giải header yêu cầu, và các mô hình Claude cũ hơn không được hỗ trợ vẫn dùng cửa sổ ngữ cảnh bình thường của chúng.

    `params.context1m: true` cũng áp dụng cho backend Claude CLI
    (`claude-cli/*`) đối với các mô hình Opus và Sonnet đủ điều kiện, hỗ trợ GA, giữ nguyên cửa sổ ngữ cảnh runtime cho các phiên CLI đó để khớp với hành vi API trực tiếp.

    <Warning>
    Yêu cầu quyền truy cập ngữ cảnh dài trên thông tin xác thực Anthropic của bạn. Xác thực token OAuth/gói đăng ký giữ các beta header Anthropic bắt buộc, nhưng OpenClaw loại bỏ beta header 1M đã ngừng sử dụng nếu nó còn trong cấu hình cũ hơn.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 ngữ cảnh 1M">
    `anthropic/claude-opus-4-8` và biến thể `claude-cli` của nó mặc định có cửa sổ ngữ cảnh 1M — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / token đột nhiên không hợp lệ">
    Xác thực token Anthropic hết hạn và có thể bị thu hồi. Với thiết lập mới, hãy dùng khóa API Anthropic thay thế.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho provider "anthropic"'>
    Xác thực Anthropic là **theo từng agent** — agent mới không kế thừa khóa của agent chính. Chạy lại onboarding cho agent đó (hoặc cấu hình khóa API trên máy chủ gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho profile "anthropic:default"'>
    Chạy `openclaw models status` để xem profile xác thực nào đang hoạt động. Chạy lại onboarding, hoặc cấu hình khóa API cho đường dẫn profile đó.
  </Accordion>

  <Accordion title="Không có profile xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `openclaw models status --json` để xem `auth.unusableProfiles`. Thời gian chờ do giới hạn tốc độ của Anthropic có thể áp dụng theo từng model, nên một model Anthropic cùng nhóm vẫn có thể dùng được. Thêm một profile Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu model và hành vi failover.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và chi tiết runtime.
  </Card>
  <Card title="Bộ nhớ đệm prompt" href="/vi/reference/prompt-caching" icon="database">
    Cách bộ nhớ đệm prompt hoạt động trên các provider.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
