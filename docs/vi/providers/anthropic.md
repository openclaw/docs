---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:00:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng họ mô hình **Claude**. OpenClaw hỗ trợ hai tuyến xác thực:

- **Khóa API** — truy cập trực tiếp Anthropic API với tính phí theo mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** — dùng lại thông tin đăng nhập Claude Code hiện có trên cùng máy chủ

<Warning>
Backend Claude CLI của OpenClaw chạy Claude Code CLI đã cài đặt ở chế độ in
không tương tác. Tài liệu Claude Code hiện tại của Anthropic mô tả
`claude -p` là cách dùng Agent SDK/lập trình. Kể từ ngày 15 tháng 6 năm 2026, Anthropic
cho biết mức sử dụng `claude -p` theo gói thuê bao không còn trừ vào giới hạn
gói Claude thông thường; trước tiên nó trừ vào hạn mức Agent SDK hằng tháng riêng, sau đó trừ vào
tín dụng sử dụng theo giá API tiêu chuẩn khi các tín dụng đó được bật.

Claude Code tương tác vẫn trừ vào giới hạn gói Claude đã đăng nhập. Xác thực bằng khóa API
vẫn là tính phí API trả theo mức dùng trực tiếp. Với các máy chủ gateway chạy dài hạn,
tự động hóa dùng chung và chi phí sản xuất có thể dự đoán, hãy dùng khóa API Anthropic.

Tài liệu công khai hiện tại của Anthropic:

- [Tham chiếu Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
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

    <Warning>
    Việc dùng lại Claude CLI yêu cầu tiến trình OpenClaw chạy trên cùng máy chủ với phiên
    đăng nhập Claude CLI. Bản cài đặt Docker có thể duy trì thư mục home của container và đăng nhập vào
    Claude Code tại đó; xem
    [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).
    Các bản cài đặt container khác như [Podman](/vi/install/podman) không mount
    `~/.claude` của máy chủ vào bước thiết lập hoặc runtime; hãy dùng khóa API Anthropic ở đó, hoặc chọn
    nhà cung cấp có OAuth do OpenClaw quản lý như
    [OpenAI Codex](/vi/providers/openai).
    </Warning>

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cùng một ghi đè runtime CLI:

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

    Các tham chiếu mô hình `claude-cli/claude-opus-4-7` cũ vẫn hoạt động để
    tương thích, nhưng cấu hình mới nên giữ phần chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong chính sách runtime nhà cung cấp/mô hình.

    ### Tính phí và `claude -p`

    OpenClaw dùng đường dẫn `claude -p` không tương tác của Claude Code cho các lần chạy
    Claude CLI. Anthropic hiện xử lý đường dẫn đó như mức sử dụng Agent SDK/lập trình:

    - Cho đến ngày 15 tháng 6 năm 2026, cách xử lý gói thuê bao tuân theo các quy tắc
      Claude Code đang có hiệu lực của Anthropic cho tài khoản đã đăng nhập.
    - Kể từ ngày 15 tháng 6 năm 2026, mức sử dụng `claude -p` theo gói thuê bao trước tiên trừ vào
      hạn mức Agent SDK hằng tháng của người dùng, sau đó trừ vào tín dụng sử dụng theo giá
      API tiêu chuẩn nếu tín dụng sử dụng được bật.
    - Phiên đăng nhập Console/khóa API dùng tính phí API trả theo mức dùng và không nhận
      hạn mức Agent SDK của gói thuê bao.

    Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Code mà không cần
    bản phát hành OpenClaw. Kiểm tra `claude auth status`, `/status` và
    tài liệu Anthropic được liên kết khi khả năng dự đoán chi phí là quan trọng.

    <Tip>
    Với tự động hóa sản xuất dùng chung, hãy dùng khóa API Anthropic thay vì
    Claude CLI. OpenClaw cũng hỗ trợ các tùy chọn kiểu thuê bao từ
    [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax) và [Z.AI / GLM](/vi/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Mặc định thinking (Claude Fable 5, 4.8 và 4.6)

`anthropic/claude-fable-5` luôn dùng adaptive thinking và mặc định ở mức nỗ lực `high`.
Vì Anthropic không cho phép tắt thinking đối với mô hình này,
`/think off` và `/think minimal` dùng mức nỗ lực `low`. OpenClaw cũng bỏ qua các giá trị
temperature tùy chỉnh cho yêu cầu Fable 5.

Claude Opus 4.8 mặc định tắt thinking trong OpenClaw. Khi bạn bật rõ ràng adaptive thinking bằng `/think high|xhigh|max`, OpenClaw gửi các giá trị nỗ lực Opus 4.8 của Anthropic; các mô hình Claude 4.6 mặc định là `adaptive`.

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng bộ nhớ đệm prompt của Anthropic cho xác thực bằng khóa API.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                      |
| ------------------- | --------------------- | ------------------------------------------ |
| `"short"` (mặc định) | 5 phút                | Tự động áp dụng cho xác thực bằng khóa API |
| `"long"`            | 1 giờ                 | Bộ nhớ đệm mở rộng                         |
| `"none"`            | Không có bộ nhớ đệm   | Tắt bộ nhớ đệm prompt                      |

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
    Dùng tham số cấp mô hình làm nền tảng, rồi ghi đè các agent cụ thể qua `agents.list[].params`:

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

    Điều này cho phép một agent giữ bộ nhớ đệm dài hạn trong khi một agent khác trên cùng mô hình tắt bộ nhớ đệm cho lưu lượng bùng phát/ít tái sử dụng.

  </Accordion>

  <Accordion title="Ghi chú về Bedrock Claude">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị buộc thành `cacheRetention: "none"` trong runtime.
    - Các mặc định thông minh cho khóa API cũng đặt sẵn `cacheRetention: "short"` cho tham chiếu Claude-on-Bedrock khi không đặt giá trị rõ ràng.

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
    - Chỉ được chèn cho các yêu cầu trực tiếp tới `api.anthropic.com`. Các tuyến proxy giữ nguyên `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` rõ ràng ghi đè `/fast` khi cả hai cùng được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu nội dung đa phương tiện (hình ảnh và PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải khả năng đa phương tiện từ phương thức xác thực Anthropic đã cấu hình — không cần
    cấu hình bổ sung.

    | Thuộc tính       | Giá trị               |
    | --------------- | --------------------- |
    | Mô hình mặc định | `claude-opus-4-8`     |
    | Đầu vào hỗ trợ   | Hình ảnh, tài liệu PDF |

    Khi hình ảnh hoặc PDF được đính kèm vào một cuộc trò chuyện, OpenClaw tự động
    định tuyến nó qua nhà cung cấp hiểu đa phương tiện Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M">
    Cửa sổ ngữ cảnh 1M của Anthropic có sẵn trên các mô hình Claude 4.x có khả năng GA
    như Opus 4.8, Opus 4.7, Opus 4.6 và Sonnet 4.6. OpenClaw tự động đặt kích thước các mô hình đó ở
    1M:

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

    Cấu hình cũ hơn có thể giữ `params.context1m: true`, nhưng OpenClaw không còn gửi
    header beta `context-1m-2025-08-07` đã ngừng dùng. Các mục cấu hình `anthropicBeta` cũ hơn
    có giá trị đó bị bỏ qua khi phân giải header yêu cầu và
    các mô hình Claude cũ không được hỗ trợ vẫn dùng cửa sổ ngữ cảnh bình thường của chúng.

    `params.context1m: true` cũng áp dụng cho backend Claude CLI
    (`claude-cli/*`) đối với các mô hình Opus và Sonnet đủ điều kiện có khả năng GA, giúp giữ
    cửa sổ ngữ cảnh runtime cho các phiên CLI đó khớp với hành vi API trực tiếp.

    <Warning>
    Yêu cầu quyền truy cập ngữ cảnh dài trên thông tin xác thực Anthropic của bạn. Xác thực token OAuth/thuê bao giữ các header beta Anthropic bắt buộc của nó, nhưng OpenClaw loại bỏ header beta 1M đã ngừng dùng nếu nó vẫn còn trong cấu hình cũ hơn.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.8">
    `anthropic/claude-opus-4-8` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / token đột ngột không hợp lệ">
    Xác thực token Anthropic hết hạn và có thể bị thu hồi. Với thiết lập mới, hãy dùng khóa API Anthropic thay thế.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho nhà cung cấp "anthropic"'>
    Xác thực Anthropic là **theo từng agent** — agent mới không kế thừa khóa của agent chính. Chạy lại quy trình onboarding cho agent đó (hoặc cấu hình khóa API trên máy chủ Gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho hồ sơ "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại quy trình onboarding, hoặc cấu hình khóa API cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="Không có hồ sơ xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `auth.unusableProfiles` trong `openclaw models status --json`. Thời gian chờ do giới hạn tần suất của Anthropic có thể theo từng mô hình, nên một mô hình Anthropic cùng nhóm vẫn có thể dùng được. Thêm một hồ sơ Anthropic khác hoặc chờ hết thời gian chờ.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Backend CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập backend Claude CLI và chi tiết runtime.
  </Card>
  <Card title="Lưu prompt vào bộ nhớ đệm" href="/vi/reference/prompt-caching" icon="database">
    Cách lưu prompt vào bộ nhớ đệm hoạt động trên các nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
