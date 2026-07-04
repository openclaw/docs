---
read_when:
    - Bạn muốn sử dụng các mô hình Anthropic trong OpenClaw
summary: Sử dụng Anthropic Claude qua khóa API hoặc Claude CLI trong OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:24:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic xây dựng dòng mô hình **Claude**. OpenClaw hỗ trợ hai tuyến xác thực:

- **Khóa API** — truy cập trực tiếp Anthropic API với thanh toán theo mức sử dụng (các mô hình `anthropic/*`)
- **Claude CLI** — tái sử dụng đăng nhập Claude Code hiện có trên cùng máy chủ

<Warning>
Backend Claude CLI của OpenClaw chạy Claude Code CLI đã cài đặt ở chế độ in
không tương tác. Tài liệu Claude Code hiện tại của Anthropic mô tả
`claude -p` là cách dùng Agent SDK/lập trình. Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic
đã tạm dừng thay đổi thanh toán Agent SDK đã công bố. Hiện tại, Anthropic cho biết
Claude Agent SDK, `claude -p`, và việc sử dụng ứng dụng bên thứ ba vẫn tính vào
giới hạn sử dụng của gói đăng ký. Khoản tín dụng Agent SDK hằng tháng đã công bố trước đó
không khả dụng trong khi Anthropic điều chỉnh lại kế hoạch đó.

Claude Code tương tác vẫn tính vào giới hạn của gói Claude đã đăng nhập. Xác thực bằng khóa API
vẫn là thanh toán API trực tiếp theo mức sử dụng. Với các máy chủ Gateway chạy lâu dài,
tự động hóa dùng chung, và chi phí sản xuất dễ dự đoán, hãy dùng khóa API Anthropic.

Kiểm tra các bài viết hỗ trợ hiện tại của Anthropic trước khi dựa vào hành vi
thanh toán theo gói đăng ký:

- [Tham chiếu Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Dùng Claude Agent SDK với gói Claude của bạn](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Dùng Claude Code với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Dùng Claude Code với gói Team hoặc Enterprise của bạn](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Quản lý chi phí Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Bắt đầu

<Tabs>
  <Tab title="Khóa API">
    **Phù hợp nhất cho:** truy cập API tiêu chuẩn và thanh toán theo mức sử dụng.

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
      <Step title="Xác minh mô hình khả dụng">
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
    **Phù hợp nhất cho:** tái sử dụng đăng nhập Claude CLI hiện có mà không cần khóa API riêng.

    <Steps>
      <Step title="Đảm bảo Claude CLI đã được cài đặt và đăng nhập">
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

        OpenClaw phát hiện và tái sử dụng thông tin xác thực Claude CLI hiện có.
      </Step>
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Chi tiết thiết lập và runtime cho backend Claude CLI nằm trong [Backend CLI](/vi/gateway/cli-backends).
    </Note>

    <Warning>
    Việc tái sử dụng Claude CLI yêu cầu tiến trình OpenClaw chạy trên cùng máy chủ với
    đăng nhập Claude CLI. Các cài đặt Docker có thể lưu home của container và đăng nhập vào
    Claude Code ở đó; xem
    [backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).
    Các cài đặt container khác như [Podman](/vi/install/podman) không mount
    `~/.claude` của máy chủ vào thiết lập hoặc runtime; hãy dùng khóa API Anthropic ở đó, hoặc chọn
    một nhà cung cấp có OAuth do OpenClaw quản lý như
    [OpenAI Codex](/vi/providers/openai).
    </Warning>

    ### Ví dụ cấu hình

    Ưu tiên tham chiếu mô hình Anthropic chuẩn cộng với ghi đè runtime CLI:

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
    tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình là
    `anthropic/*` và đặt backend thực thi trong chính sách runtime của nhà cung cấp/mô hình.

    ### Thanh toán và `claude -p`

    OpenClaw dùng đường dẫn `claude -p` không tương tác của Claude Code cho các lượt chạy Claude CLI.
    Anthropic hiện xem đường dẫn đó là cách dùng Agent SDK/lập trình:

    - Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng kế hoạch
      tín dụng Agent SDK riêng đã công bố trước đó.
    - Hiện tại, Claude Agent SDK theo gói đăng ký, `claude -p`, và việc sử dụng
      ứng dụng bên thứ ba vẫn tính vào giới hạn sử dụng của gói đăng ký đã đăng nhập.
    - Khoản tín dụng Agent SDK hằng tháng đã công bố trước đó không khả dụng trong khi
      Anthropic điều chỉnh lại kế hoạch đó.
    - Đăng nhập Console/khóa API dùng thanh toán API theo mức sử dụng và không nhận
      tín dụng Agent SDK của gói đăng ký.

    Xem [bài viết về gói Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    của Anthropic để biết thông báo tạm dừng, và các bài viết về gói Claude Code cho
    hành vi gói đăng ký
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    và
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic có thể thay đổi hành vi thanh toán và giới hạn tốc độ của Claude Code mà không cần
    bản phát hành OpenClaw. Kiểm tra `claude auth status`, `/status`, và
    tài liệu được liên kết của Anthropic khi khả năng dự đoán chi phí là quan trọng.

    <Tip>
    Với tự động hóa sản xuất dùng chung, hãy dùng khóa API Anthropic thay vì
    Claude CLI. OpenClaw cũng hỗ trợ các tùy chọn kiểu gói đăng ký từ
    [OpenAI Codex](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax), và [Z.AI / GLM](/vi/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Mặc định suy luận (Claude Fable 5, 4.8 và 4.6)

`anthropic/claude-fable-5` luôn dùng suy luận thích ứng và mặc định là nỗ lực `high`.
Vì Anthropic không cho phép tắt suy luận cho mô hình này,
`/think off` và `/think minimal` dùng nỗ lực `low`. OpenClaw cũng bỏ qua các giá trị
temperature tùy chỉnh cho yêu cầu Fable 5.

Claude Opus 4.8 giữ suy luận tắt theo mặc định trong OpenClaw. Khi bạn bật rõ ràng suy luận thích ứng bằng `/think high|xhigh|max`, OpenClaw gửi các giá trị nỗ lực Opus 4.8 của Anthropic; các mô hình Claude 4.6 mặc định là `adaptive`.

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

## Phương án dự phòng khi từ chối vì an toàn (Claude Fable 5)

<Warning>
Dùng Claude Fable 5 cũng có nghĩa là dùng Claude Opus 4.8. Fable 5 đi kèm
các bộ phân loại an toàn có thể từ chối một yêu cầu, và cách khôi phục được Anthropic chấp thuận
là để `claude-opus-4-8` phục vụ lượt đó. OpenClaw tự động chọn tham gia cơ chế này
cho các yêu cầu khóa API trực tiếp, vì vậy một số lượt Fable được trả lời
và tính phí như Claude Opus 4.8. Nếu chính sách hoặc ngân sách của bạn không thể chấp nhận
các lượt do Opus phục vụ, đừng chọn `anthropic/claude-fable-5`.
</Warning>

### Vì sao cơ chế này tồn tại

Các bộ phân loại Fable 5 trả về `stop_reason: "refusal"` với yêu cầu trong các
miền bị hạn chế, và cũng nhận diện nhầm một số công việc gần với nội dung lành tính (công cụ
bảo mật, khoa học sự sống, hoặc thậm chí yêu cầu mô hình tái tạo suy luận thô
của nó). Nếu không có phương án dự phòng, lượt sẽ kết thúc bằng lỗi dù
một mô hình Claude khác có thể phục vụ nó bình thường — thông báo từ chối của chính Anthropic
yêu cầu các bên tích hợp API cấu hình mô hình dự phòng.

### Cách hoạt động

1. Với mọi yêu cầu khóa API trực tiếp tới `anthropic/claude-fable-5`, OpenClaw
   gửi tùy chọn tham gia dự phòng phía máy chủ của Anthropic: header beta
   `server-side-fallback-2026-06-01` cộng với
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 là mục tiêu
   dự phòng duy nhất Anthropic cho phép với Fable 5.
2. Chỉ từ chối của bộ phân loại an toàn mới kích hoạt dự phòng. Giới hạn tốc độ,
   quá tải, và lỗi máy chủ hoạt động đúng như trước và đi qua
   [chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) bình thường của OpenClaw.
3. Việc cứu lượt diễn ra bên trong cùng một lệnh gọi. Một từ chối trước khi có bất kỳ đầu ra nào là
   vô hình ngoài độ trễ; toàn bộ câu trả lời đến từ Opus 4.8. Khi
   từ chối giữa luồng, phần văn bản một phần được giữ làm tiền tố để mô hình dự phòng
   tiếp tục từ đó, trong khi suy luận và các lệnh gọi công cụ của mô hình đã từ chối
   bị loại bỏ theo quy tắc phát lại của Anthropic (chúng không được vọng lại hoặc
   thực thi).
4. Nếu Claude Opus 4.8 cũng từ chối, lượt hiển thị từ chối dưới dạng
   lỗi, đúng như trước khi có tính năng này.

Dự phòng diễn ra ở cấp Anthropic API, vì vậy `claude-opus-4-8` không
cần nằm trong danh sách mô hình đã cấu hình hoặc chuỗi dự phòng của bạn — khóa API
có khả năng dùng Fable luôn có thể phục vụ Opus.

### Quan sát và thanh toán

- Một lượt được phục vụ bằng dự phòng ghi lại chẩn đoán `provider_fallback` trên
  tin nhắn trợ lý, nêu `fromModel` và `toModel`, và
  `responseModel` của tin nhắn báo cáo `claude-opus-4-8`.
- Anthropic tính phí theo từng lần thử: từ chối trước đầu ra là miễn phí, và lượt cứu
  được tính theo giá Claude Opus 4.8 (hiện bằng một nửa giá Fable 5). Ước tính chi phí
  theo lượt của OpenClaw định giá các lượt được phục vụ bằng dự phòng theo giá Opus cho khớp.
- Từ chối giữa luồng còn tính phí phần Fable một phần đã stream
  ở phía Anthropic; phần đó được báo cáo trong mức sử dụng theo lần thử của API
  nhưng không được gộp vào ước tính theo lượt của OpenClaw.

### Phạm vi

Áp dụng cho `anthropic/claude-fable-5` với xác thực khóa API tới
`api.anthropic.com`. OAuth (tái sử dụng gói đăng ký Claude CLI), URL cơ sở proxy,
các yêu cầu Bedrock, Vertex, và Foundry không thay đổi và vẫn hiển thị
từ chối dưới dạng lỗi ở đó.

Đã xác minh trực tiếp: một prompt lành tính yêu cầu Fable 5 tái tạo chuỗi suy nghĩ
thô của nó bị từ chối với `category: "reasoning_extraction"` khi gửi mà không có
dự phòng, và cùng prompt đó qua OpenClaw trả về một câu trả lời bình thường do Opus phục vụ
với chẩn đoán `provider_fallback` được đính kèm.

Xem [hướng dẫn về từ chối và dự phòng](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
của Anthropic để biết hành vi nền tảng.

## Bộ nhớ đệm prompt

OpenClaw hỗ trợ tính năng bộ nhớ đệm prompt của Anthropic cho xác thực khóa API.

| Giá trị             | Thời lượng bộ nhớ đệm | Mô tả                                  |
| ------------------- | --------------------- | -------------------------------------- |
| `"short"` (mặc định) | 5 phút               | Tự động áp dụng cho xác thực khóa API |
| `"long"`            | 1 giờ                 | Bộ nhớ đệm mở rộng                     |
| `"none"`            | Không dùng bộ nhớ đệm | Tắt bộ nhớ đệm prompt                  |

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
  <Accordion title="Ghi đè bộ nhớ đệm theo tác tử">
    Dùng tham số cấp mô hình làm đường cơ sở, rồi ghi đè các tác tử cụ thể qua `agents.list[].params`:

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

    Điều này cho phép một agent giữ bộ nhớ đệm tồn tại lâu trong khi một agent khác trên cùng mô hình tắt bộ nhớ đệm cho lưu lượng bùng phát/tái sử dụng thấp.

  </Accordion>

  <Accordion title="Ghi chú về Bedrock Claude">
    - Các mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
    - Các mô hình Bedrock không phải Anthropic bị buộc thành `cacheRetention: "none"` lúc chạy.
    - Mặc định thông minh cho khóa API cũng đặt sẵn `cacheRetention: "short"` cho các tham chiếu Claude-on-Bedrock khi chưa đặt giá trị rõ ràng.

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
    - Chỉ được chèn cho các yêu cầu trực tiếp tới `api.anthropic.com`. Các tuyến proxy giữ nguyên `service_tier`.
    - Tham số `serviceTier` hoặc `service_tier` rõ ràng sẽ ghi đè `/fast` khi cả hai đều được đặt.
    - Trên các tài khoản không có dung lượng Priority Tier, `service_tier: "auto"` có thể phân giải thành `standard`.

    </Note>

  </Accordion>

  <Accordion title="Hiểu phương tiện (hình ảnh và PDF)">
    Plugin Anthropic đi kèm đăng ký khả năng hiểu hình ảnh và PDF. OpenClaw
    tự động phân giải các khả năng phương tiện từ xác thực Anthropic đã cấu hình — không
    cần cấu hình bổ sung.

    | Thuộc tính        | Giá trị                 |
    | --------------- | --------------------- |
    | Mô hình mặc định   | `claude-opus-4-8`     |
    | Đầu vào được hỗ trợ | Hình ảnh, tài liệu PDF |

    Khi một hình ảnh hoặc PDF được đính kèm vào cuộc trò chuyện, OpenClaw tự động
    định tuyến nó qua nhà cung cấp hiểu phương tiện Anthropic.

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh 1M">
    Cửa sổ ngữ cảnh 1M của Anthropic có sẵn trên các mô hình Claude 4.x hỗ trợ GA
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

    Các cấu hình cũ hơn có thể giữ `params.context1m: true`, nhưng OpenClaw không còn gửi
    tiêu đề beta `context-1m-2025-08-07` đã ngừng sử dụng. Các mục cấu hình `anthropicBeta` cũ hơn
    có giá trị đó bị bỏ qua trong quá trình phân giải tiêu đề yêu cầu và
    các mô hình Claude cũ hơn không được hỗ trợ vẫn dùng cửa sổ ngữ cảnh bình thường của chúng.

    `params.context1m: true` cũng áp dụng cho phần phụ trợ Claude CLI
    (`claude-cli/*`) đối với các mô hình Opus và Sonnet đủ điều kiện hỗ trợ GA, giữ nguyên
    cửa sổ ngữ cảnh lúc chạy cho các phiên CLI đó để khớp với hành vi API trực tiếp.

    <Warning>
    Yêu cầu quyền truy cập ngữ cảnh dài trên thông tin xác thực Anthropic của bạn. Xác thực bằng OAuth/mã thông báo đăng ký giữ các tiêu đề beta Anthropic bắt buộc của nó, nhưng OpenClaw loại bỏ tiêu đề beta 1M đã ngừng sử dụng nếu tiêu đề đó vẫn còn trong cấu hình cũ hơn.
    </Warning>

  </Accordion>

  <Accordion title="Ngữ cảnh 1M của Claude Opus 4.8">
    `anthropic/claude-opus-4-8` và biến thể `claude-cli` của nó có cửa sổ ngữ cảnh 1M
    theo mặc định — không cần `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi 401 / mã thông báo đột ngột không hợp lệ">
    Xác thực bằng mã thông báo Anthropic hết hạn và có thể bị thu hồi. Với thiết lập mới, hãy dùng khóa API Anthropic thay thế.
  </Accordion>

  <Accordion title='Không tìm thấy khóa API cho nhà cung cấp "anthropic"'>
    Xác thực Anthropic là **theo từng agent** — các agent mới không kế thừa khóa của agent chính. Chạy lại quy trình onboarding cho agent đó (hoặc cấu hình khóa API trên máy chủ gateway), rồi xác minh bằng `openclaw models status`.
  </Accordion>

  <Accordion title='Không tìm thấy thông tin xác thực cho hồ sơ "anthropic:default"'>
    Chạy `openclaw models status` để xem hồ sơ xác thực nào đang hoạt động. Chạy lại quy trình onboarding, hoặc cấu hình khóa API cho đường dẫn hồ sơ đó.
  </Accordion>

  <Accordion title="Không có hồ sơ xác thực khả dụng (tất cả đang trong thời gian chờ)">
    Kiểm tra `openclaw models status --json` để xem `auth.unusableProfiles`. Thời gian chờ do giới hạn tốc độ Anthropic có thể theo phạm vi mô hình, nên một mô hình Anthropic cùng nhóm vẫn có thể dùng được. Thêm hồ sơ Anthropic khác hoặc chờ hết thời gian chờ.
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
  <Card title="Phần phụ trợ CLI" href="/vi/gateway/cli-backends" icon="terminal">
    Thiết lập phần phụ trợ Claude CLI và chi tiết lúc chạy.
  </Card>
  <Card title="Bộ nhớ đệm lời nhắc" href="/vi/reference/prompt-caching" icon="database">
    Cách bộ nhớ đệm lời nhắc hoạt động trên các nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
