---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn dùng xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi tác nhân GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:28:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng agent lập trình thuộc gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw giữ các bề mặt đó tách biệt để cấu hình luôn dễ dự đoán.

OpenClaw hỗ trợ ba tuyến thuộc họ OpenAI. Hầu hết người đăng ký ChatGPT/Codex muốn hành vi Codex nên dùng runtime máy chủ ứng dụng Codex gốc. Tiền tố mô hình chọn tên nhà cung cấp/mô hình; một thiết lập runtime riêng chọn bên thực thi vòng lặp tác tử nhúng:

- **Khóa API** - truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng (mô hình `openai/*`)
- **Gói đăng ký Codex với runtime Codex gốc** - đăng nhập ChatGPT/Codex cộng với thực thi máy chủ ứng dụng Codex (mô hình `openai/*` cộng với `agents.defaults.agentRuntime.id: "codex"`)
- **Gói đăng ký Codex qua PI** - đăng nhập ChatGPT/Codex với trình chạy OpenClaw PI thông thường (mô hình `openai-codex/*`)

OpenAI hỗ trợ rõ ràng việc dùng OAuth gói đăng ký trong các công cụ và quy trình bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó đang bị trộn lẫn với nhau, hãy đọc [Runtime của tác tử](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                             | Dùng                                             | Ghi chú                                                                   |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-5.5` cộng với `agentRuntime.id: "codex"` | Thiết lập Codex được khuyến nghị cho hầu hết người dùng. Đăng nhập bằng xác thực `openai-codex`. |
| Tính phí trực tiếp bằng khóa API                     | `openai/gpt-5.5`                                 | Đặt `OPENAI_API_KEY` hoặc chạy onboarding khóa API OpenAI.                |
| Xác thực gói đăng ký ChatGPT/Codex qua PI            | `openai-codex/gpt-5.5`                           | Chỉ dùng khi bạn chủ ý muốn trình chạy PI thông thường.                  |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                             | Hoạt động với `OPENAI_API_KEY` hoặc OpenAI Codex OAuth.                  |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                           | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`.  |

## Bản đồ đặt tên

Các tên này tương tự nhau nhưng không thể dùng thay thế cho nhau:

| Tên bạn thấy                         | Lớp               | Ý nghĩa                                                                                           |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                             | Tiền tố nhà cung cấp | Tuyến API OpenAI Platform trực tiếp.                                                              |
| `openai-codex`                       | Tiền tố nhà cung cấp | Tuyến OAuth/gói đăng ký OpenAI Codex qua trình chạy OpenClaw PI thông thường.                    |
| Plugin `codex`                       | Plugin            | Plugin OpenClaw đi kèm cung cấp runtime máy chủ ứng dụng Codex gốc và điều khiển chat `/codex`. |
| `agentRuntime.id: codex`             | Runtime của tác tử | Buộc dùng harness máy chủ ứng dụng Codex gốc cho các lượt nhúng.                                 |
| `/codex ...`                         | Bộ lệnh chat      | Liên kết/điều khiển các luồng máy chủ ứng dụng Codex từ một cuộc trò chuyện.                     |
| `runtime: "acp", agentId: "codex"`   | Tuyến phiên ACP   | Đường dự phòng rõ ràng chạy Codex qua ACP/acpx.                                                   |

Điều này có nghĩa là một cấu hình có thể chủ ý chứa cả `openai-codex/*` và Plugin `codex`. Điều đó hợp lệ khi bạn muốn Codex OAuth qua PI và cũng muốn có các điều khiển chat `/codex` gốc. `openclaw doctor` cảnh báo về tổ hợp đó để bạn có thể xác nhận đây là chủ ý; nó không viết lại tổ hợp này.

<Note>
GPT-5.5 có sẵn qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến gói đăng ký/OAuth. Với gói đăng ký ChatGPT/Codex cộng với thực thi Codex gốc, hãy dùng `openai/gpt-5.5` với `agentRuntime.id: "codex"`. Chỉ dùng `openai-codex/gpt-5.5` cho Codex OAuth qua PI, hoặc `openai/gpt-5.5` không có ghi đè runtime Codex cho lưu lượng `OPENAI_API_KEY` trực tiếp.
</Note>

<Note>
Bật Plugin OpenAI, hoặc chọn mô hình `openai-codex/*`, không bật Plugin máy chủ ứng dụng Codex đi kèm. OpenClaw chỉ bật Plugin đó khi bạn chọn rõ harness Codex gốc bằng `agentRuntime.id: "codex"` hoặc dùng tham chiếu mô hình `codex/*` cũ.
Nếu Plugin `codex` đi kèm được bật nhưng `openai-codex/*` vẫn phân giải qua PI, `openclaw doctor` sẽ cảnh báo và giữ nguyên tuyến.
</Note>

## Phạm vi tính năng OpenClaw

| Khả năng OpenAI        | Bề mặt OpenClaw                                          | Trạng thái                                             |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses       | Nhà cung cấp mô hình `openai/<model>`                    | Có                                                     |
| Mô hình gói đăng ký Codex | `openai-codex/<model>` với OAuth `openai-codex`        | Có                                                     |
| Harness máy chủ ứng dụng Codex | `openai/<model>` với `agentRuntime.id: codex`      | Có                                                     |
| Tìm kiếm web phía máy chủ | Công cụ OpenAI Responses gốc                           | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp |
| Hình ảnh               | `image_generate`                                         | Có                                                     |
| Video                  | `video_generate`                                         | Có                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`        | Có                                                     |
| Chuyển lời nói thành văn bản theo lô | `tools.media.audio` / hiểu phương tiện       | Có                                                     |
| Chuyển lời nói thành văn bản dạng streaming | Voice Call `streaming.provider: "openai"` | Có                                                     |
| Giọng nói realtime     | Voice Call `realtime.provider: "openai"` / Control UI Talk | Có                                                   |
| Embedding              | Nhà cung cấp embedding bộ nhớ                            | Có                                                     |

## Embedding bộ nhớ

OpenClaw có thể dùng OpenAI, hoặc một endpoint embedding tương thích OpenAI, cho việc lập chỉ mục `memory_search` và embedding truy vấn:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, đặt `queryInputType` và `documentInputType` dưới `memorySearch`. OpenClaw chuyển tiếp các giá trị đó thành trường yêu cầu `input_type` riêng theo nhà cung cấp: embedding truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng `documentInputType`. Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để biết ví dụ đầy đủ.

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API (OpenAI Platform)">
    **Phù hợp nhất cho:** truy cập API trực tiếp và tính phí theo mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo hoặc sao chép khóa API từ [bảng điều khiển OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình    | Cấu hình runtime          | Tuyến                       | Xác thực         |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | bỏ qua / `agentRuntime.id: "pi"`    | API OpenAI Platform trực tiếp | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | bỏ qua / `agentRuntime.id: "pi"`    | API OpenAI Platform trực tiếp | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness máy chủ ứng dụng Codex | Máy chủ ứng dụng Codex |

    <Note>
    `openai/*` là tuyến khóa API OpenAI trực tiếp trừ khi bạn buộc dùng rõ harness máy chủ ứng dụng Codex. Dùng `openai-codex/*` cho Codex OAuth qua trình chạy PI mặc định, hoặc dùng `openai/gpt-5.5` với `agentRuntime.id: "codex"` để thực thi máy chủ ứng dụng Codex gốc.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **không** phơi bày `openai/gpt-5.3-codex-spark`. Các yêu cầu OpenAI API trực tiếp từ chối mô hình đó, và danh mục Codex hiện tại cũng không phơi bày nó.
    </Warning>

  </Tab>

  <Tab title="Gói đăng ký Codex">
    **Phù hợp nhất cho:** dùng gói đăng ký ChatGPT/Codex của bạn với thực thi máy chủ ứng dụng Codex gốc thay vì một khóa API riêng. Codex cloud yêu cầu đăng nhập ChatGPT.

    <Steps>
      <Step title="Chạy Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Hoặc chạy OAuth trực tiếp:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Với thiết lập headless hoặc không thuận tiện cho callback, thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Dùng runtime Codex gốc">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Xác minh xác thực Codex có sẵn">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Sau khi gateway đang chạy, gửi `/codex status` hoặc `/codex models` trong chat để xác minh runtime máy chủ ứng dụng gốc.
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình | Cấu hình runtime | Tuyến | Xác thực |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex gốc | Đăng nhập Codex hoặc hồ sơ `openai-codex` đã chọn |
    | `openai-codex/gpt-5.5` | bỏ qua / `runtime: "pi"` | ChatGPT/Codex OAuth qua PI | Đăng nhập Codex |
    | `openai-codex/gpt-5.4-mini` | bỏ qua / `runtime: "pi"` | ChatGPT/Codex OAuth qua PI | Đăng nhập Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Vẫn là PI trừ khi một Plugin tuyên bố rõ `openai-codex` | Đăng nhập Codex |

    <Warning>
    Không cấu hình các tham chiếu mô hình `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` hoặc `openai-codex/gpt-5.3*` cũ hơn. Các tài khoản ChatGPT/Codex OAuth hiện từ chối những mô hình đó. Dùng `openai-codex/gpt-5.5` cho tuyến PI OAuth, hoặc `openai/gpt-5.5` với `agentRuntime.id: "codex"` để thực thi runtime Codex gốc.
    </Warning>

    <Note>
    Tiếp tục sử dụng id nhà cung cấp `openai-codex` cho các lệnh auth/profile. Tiền tố mô hình
    `openai-codex/*` cũng là tuyến PI rõ ràng cho Codex OAuth.
    Nó không chọn hoặc tự động bật bộ khung máy chủ ứng dụng Codex đi kèm. Đối với
    thiết lập phổ biến gồm gói thuê bao và thời gian chạy gốc, hãy đăng nhập bằng
    `openai-codex` nhưng giữ tham chiếu mô hình là `openai/gpt-5.5` và đặt
    `agentRuntime.id: "codex"`.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Để giữ Codex OAuth trên trình chạy PI thông thường, hãy dùng
    `openai-codex/gpt-5.5` và bỏ qua ghi đè thời gian chạy Codex.

    <Note>
    Quy trình onboarding không còn nhập nội dung OAuth từ `~/.codex`. Hãy đăng nhập bằng OAuth trong trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin xác thực thu được trong kho xác thực agent riêng của nó.
    </Note>

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị thời gian chạy mô hình nào đang hoạt động cho phiên hiện tại.
    Bộ khung PI mặc định xuất hiện là `Runtime: OpenClaw Pi Default`. Khi
    bộ khung máy chủ ứng dụng Codex đi kèm được chọn, `/status` hiển thị
    `Runtime: OpenAI Codex`. Các phiên hiện có giữ id bộ khung đã ghi lại, vì vậy hãy dùng
    `/new` hoặc `/reset` sau khi thay đổi `agentRuntime` nếu bạn muốn `/status`
    phản ánh lựa chọn PI/Codex mới.

    ### Cảnh báo doctor

    Nếu Plugin `codex` đi kèm được bật trong khi một tuyến `openai-codex/*`
    được chọn, `openclaw doctor` sẽ cảnh báo rằng mô hình vẫn được phân giải qua PI.
    Chỉ giữ nguyên cấu hình khi tuyến xác thực thuê bao PI đó là chủ ý.
    Chuyển sang `openai/<model>` cùng với `agentRuntime.id: "codex"` khi
    bạn muốn thực thi máy chủ ứng dụng Codex gốc.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xem siêu dữ liệu mô hình và giới hạn ngữ cảnh thời gian chạy là các giá trị riêng biệt.

    Đối với `openai-codex/gpt-5.5` qua Codex OAuth:

    - `contextWindow` gốc: `1000000`
    - Giới hạn `contextTokens` thời gian chạy mặc định: `272000`

    Giới hạn mặc định nhỏ hơn có độ trễ và đặc tính chất lượng tốt hơn trong thực tế. Ghi đè bằng `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Dùng `contextWindow` để khai báo siêu dữ liệu mô hình gốc. Dùng `contextTokens` để giới hạn ngân sách ngữ cảnh thời gian chạy.
    </Note>

    ### Khôi phục catalog

    OpenClaw dùng siêu dữ liệu catalog Codex upstream cho `gpt-5.5` khi dữ liệu đó
    có mặt. Nếu quá trình khám phá Codex trực tiếp bỏ qua hàng `openai-codex/gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng mô hình OAuth đó để
    các lần chạy cron, sub-agent và mô hình mặc định đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực máy chủ ứng dụng Codex gốc

Bộ khung máy chủ ứng dụng Codex gốc dùng tham chiếu mô hình `openai/*` cùng với
`agentRuntime.id: "codex"`, nhưng xác thực của nó vẫn dựa trên tài khoản. OpenClaw
chọn xác thực theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw `openai-codex` rõ ràng được liên kết với agent.
2. Tài khoản hiện có của máy chủ ứng dụng, chẳng hạn như đăng nhập ChatGPT bằng Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi máy chủ ứng dụng báo cáo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó có nghĩa là đăng nhập thuê bao ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình gateway cũng có `OPENAI_API_KEY` cho các mô hình OpenAI trực tiếp
hoặc embeddings. Dự phòng khóa API qua env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi đến các kết nối máy chủ ứng dụng WebSocket. Khi một hồ sơ Codex
kiểu thuê bao được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
khỏi tiến trình con máy chủ ứng dụng stdio được sinh ra và gửi thông tin xác thực đã chọn
qua RPC đăng nhập của máy chủ ứng dụng.

## Tạo hình ảnh

Plugin `openai` đi kèm đăng ký tạo hình ảnh qua công cụ `image_generate`.
Nó hỗ trợ cả tạo hình ảnh bằng khóa API OpenAI và tạo hình ảnh bằng Codex OAuth
qua cùng tham chiếu mô hình `openai/gpt-image-2`.

| Khả năng                  | Khóa API OpenAI                   | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Tham chiếu mô hình        | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                  | `OPENAI_API_KEY`                   | Đăng nhập OpenAI Codex OAuth         |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Số hình ảnh tối đa mỗi yêu cầu | 4                              | 4                                    |
| Chế độ chỉnh sửa          | Đã bật (tối đa 5 hình ảnh tham chiếu) | Đã bật (tối đa 5 hình ảnh tham chiếu) |
| Ghi đè kích thước         | Được hỗ trợ, bao gồm kích thước 2K/4K | Được hỗ trợ, bao gồm kích thước 2K/4K |
| Tỷ lệ khung hình / độ phân giải | Không chuyển tiếp đến OpenAI Images API | Được ánh xạ sang kích thước được hỗ trợ khi an toàn |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

`gpt-image-2` là mặc định cho cả tạo hình ảnh từ văn bản OpenAI và chỉnh sửa hình ảnh.
`gpt-image-1.5`, `gpt-image-1` và `gpt-image-1-mini` vẫn có thể dùng làm
ghi đè mô hình rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra
PNG/WebP có nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Đối với yêu cầu nền trong suốt, agent nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và
OpenAI Codex OAuth bằng cách viết lại các yêu cầu trong suốt mặc định `openai/gpt-image-2`
thành `gpt-image-1.5`; Azure và các endpoint tương thích OpenAI tùy chỉnh giữ
tên deployment/mô hình đã cấu hình của chúng.

Cài đặt tương tự được hiển thị cho các lần chạy CLI không giao diện:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Dùng cùng các cờ `--output-format` và `--background` với
`openclaw infer image edit` khi bắt đầu từ một tệp đầu vào.
`--openai-background` vẫn có sẵn dưới dạng bí danh dành riêng cho OpenAI.

Đối với cài đặt Codex OAuth, giữ cùng tham chiếu `openai/gpt-image-2`. Khi một
hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw phân giải mã truy cập OAuth
đã lưu đó và gửi yêu cầu hình ảnh qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm dự phòng sang khóa API cho
yêu cầu đó. Cấu hình `models.providers.openai` một cách rõ ràng với khóa API,
URL cơ sở tùy chỉnh hoặc endpoint Azure khi bạn muốn tuyến OpenAI Images API
trực tiếp.
Nếu endpoint hình ảnh tùy chỉnh đó nằm trên một địa chỉ LAN/riêng tư đáng tin cậy, cũng đặt
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw vẫn chặn
các endpoint hình ảnh tương thích OpenAI riêng tư/nội bộ trừ khi có lựa chọn tham gia này.

Tạo:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Tạo PNG trong suốt:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Chỉnh sửa:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Tạo video

Plugin `openai` đi kèm đăng ký tạo video qua công cụ `video_generate`.

| Khả năng            | Giá trị                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| Mô hình mặc định    | `openai/sora-2`                                                                   |
| Chế độ              | Văn bản thành video, hình ảnh thành video, chỉnh sửa một video                    |
| Đầu vào tham chiếu  | 1 hình ảnh hoặc 1 video                                                           |
| Ghi đè kích thước   | Được hỗ trợ                                                                       |
| Ghi đè khác         | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Đóng góp lời nhắc GPT-5

OpenClaw thêm một đóng góp lời nhắc GPT-5 dùng chung cho các lần chạy thuộc họ GPT-5 trên các nhà cung cấp. Nó áp dụng theo id mô hình, vì vậy `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` và các tham chiếu GPT-5 tương thích khác nhận cùng lớp phủ. Các mô hình GPT-4.x cũ hơn thì không.

Bộ khung Codex gốc đi kèm dùng cùng hành vi GPT-5 và lớp phủ heartbeat qua hướng dẫn dành cho nhà phát triển của máy chủ ứng dụng Codex, vì vậy các phiên `openai/gpt-5.x` bị buộc đi qua `agentRuntime.id: "codex"` giữ nguyên hướng dẫn theo đến cùng và heartbeat chủ động, dù Codex sở hữu phần còn lại của lời nhắc bộ khung.

Đóng góp GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho việc duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh. Hành vi trả lời theo kênh và tin nhắn im lặng vẫn nằm trong lời nhắc hệ thống OpenClaw dùng chung và chính sách gửi đi. Hướng dẫn GPT-5 luôn được bật cho các mô hình khớp. Lớp phong cách tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị                | Hiệu ứng                                |
| ---------------------- | --------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện |
| `"on"`                 | Bí danh cho `"friendly"`                |
| `"off"`                | Chỉ tắt lớp phong cách thân thiện       |

<Tabs>
  <Tab title="Cấu hình">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Các giá trị không phân biệt chữ hoa chữ thường tại thời gian chạy, vì vậy `"Off"` và `"off"` đều tắt lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc làm dự phòng tương thích khi cài đặt dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp lời nói (TTS)">
    Plugin `openai` đi kèm đăng ký tổng hợp lời nói cho bề mặt `messages.tts`.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng nói | `messages.tts.providers.openai.voice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Thân bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các mô hình có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng nói có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, nên hãy dùng nó cho các điểm cuối tương thích với OpenAI cần các khóa bổ sung như `lang`. Các khóa nguyên mẫu bị bỏ qua.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng đến điểm cuối API trò chuyện.
    </Note>

  </Accordion>

  <Accordion title="Chuyển lời nói thành văn bản">
    Plugin `openai` được đóng gói sẵn đăng ký tính năng chuyển lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu nội dung media của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Điểm cuối: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi mà phiên âm âm thanh đầu vào dùng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và tệp đính kèm
      âm thanh của kênh

    Để buộc dùng OpenAI cho phiên âm âm thanh đầu vào:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Gợi ý ngôn ngữ và prompt được chuyển tiếp đến OpenAI khi được cung cấp bởi
    cấu hình media âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lệnh gọi.

  </Accordion>

  <Accordion title="Phiên âm realtime">
    Plugin `openai` được đóng gói sẵn đăng ký phiên âm realtime cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Dùng kết nối WebSocket tới `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm realtime của Voice Call; thoại Discord hiện ghi các đoạn ngắn và thay vào đó dùng đường dẫn phiên âm theo lô `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói realtime">
    Plugin `openai` được đóng gói sẵn đăng ký giọng nói realtime cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Giọng nói | `...openai.voice` | `alloy` |
    | Nhiệt độ | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Hỗ trợ Azure OpenAI qua các khóa cấu hình `azureEndpoint` và `azureDeployment` cho cầu nối realtime phía backend. Hỗ trợ gọi công cụ hai chiều. Dùng định dạng âm thanh G.711 u-law.
    </Note>

    <Note>
    Control UI Talk dùng phiên realtime trên trình duyệt OpenAI với bí mật client tạm thời
    do Gateway cấp và trao đổi SDP WebRTC trực tiếp trên trình duyệt với
    OpenAI Realtime API. Có thể xác minh live cho maintainer bằng
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    nhánh OpenAI cấp một bí mật client trong Node, tạo một SDP offer trên trình duyệt
    với media microphone giả, đăng nó lên OpenAI và áp dụng SDP answer
    mà không ghi log bí mật.
    </Note>

  </Accordion>
</AccordionGroup>

## Điểm cuối Azure OpenAI

Nhà cung cấp `openai` được đóng gói sẵn có thể nhắm tới tài nguyên Azure OpenAI để tạo
hình ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo hình ảnh, OpenClaw
phát hiện tên máy chủ Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
hình dạng yêu cầu của Azure.

<Note>
Giọng nói realtime dùng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Giọng nói realtime**
trong [Giọng nói và lời nói](#voice-and-speech) để biết các cài đặt Azure
của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có gói đăng ký, hạn mức hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần nơi lưu trú dữ liệu theo khu vực hoặc các kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo hình ảnh Azure thông qua nhà cung cấp `openai` được đóng gói sẵn, trỏ
`models.providers.openai.baseUrl` tới tài nguyên Azure của bạn và đặt `apiKey` thành
khóa Azure OpenAI (không phải khóa OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw nhận diện các hậu tố máy chủ Azure này cho tuyến tạo hình ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Với các yêu cầu tạo hình ảnh trên máy chủ Azure được nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng đường dẫn theo phạm vi deployment (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào mỗi yêu cầu
- Dùng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo hình ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ nguyên
hình dạng yêu cầu hình ảnh chuẩn của OpenAI.

<Note>
Định tuyến Azure cho đường dẫn tạo hình ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản trước đó xử lý mọi
`openai.baseUrl` tùy chỉnh giống như điểm cuối OpenAI công khai và sẽ thất bại với các
deployment hình ảnh Azure.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ thể
cho đường dẫn tạo hình ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Mặc định là `2024-12-01-preview` khi biến chưa được đặt.

### Tên mô hình là tên deployment

Azure OpenAI liên kết mô hình với deployment. Với các yêu cầu tạo hình ảnh Azure
được định tuyến qua nhà cung cấp `openai` được đóng gói sẵn, trường `model` trong OpenClaw
phải là **tên deployment Azure** bạn đã cấu hình trong cổng Azure, không phải
ID mô hình OpenAI công khai.

Nếu bạn tạo một deployment tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên deployment tương tự áp dụng cho các lệnh gọi tạo hình ảnh được định tuyến qua
nhà cung cấp `openai` được đóng gói sẵn.

### Tính khả dụng theo khu vực

Tạo hình ảnh Azure hiện chỉ có sẵn ở một số khu vực
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Hãy kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
deployment, và xác nhận mô hình cụ thể được cung cấp trong khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số hình ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
giá trị `background` trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản mô hình
cụ thể. Những khác biệt này đến từ Azure và mô hình nền tảng, không phải
OpenClaw. Nếu một yêu cầu Azure thất bại với lỗi xác thực, hãy kiểm tra
bộ tham số được deployment cụ thể và phiên bản API của bạn hỗ trợ trong
cổng Azure.

<Note>
Azure OpenAI dùng vận chuyển gốc và hành vi compat nhưng không nhận
các header quy công ẩn của OpenClaw — xem accordion **Tuyến gốc so với tuyến tương thích OpenAI**
trong [Cấu hình nâng cao](#advanced-configuration).

Với lưu lượng trò chuyện hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy dùng
luồng onboarding hoặc cấu hình nhà cung cấp Azure chuyên dụng — chỉ `openai.baseUrl`
không tự chọn hình dạng API/xác thực của Azure. Có một nhà cung cấp
`azure-openai-responses/*` riêng; xem accordion Compaction phía server bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Vận chuyển (WebSocket so với SSE)">
    OpenClaw ưu tiên WebSocket với dự phòng SSE (`"auto"`) cho cả `openai/*` và `openai-codex/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi dự phòng về SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian hạ nhiệt
    - Đính kèm các header danh tính phiên và lượt ổn định cho các lần thử lại và kết nối lại
    - Chuẩn hóa bộ đếm mức sử dụng (`input_tokens` / `prompt_tokens`) giữa các biến thể vận chuyển

    | Giá trị | Hành vi |
    |-------|----------|
    | `"auto"` (mặc định) | WebSocket trước, dự phòng SSE |
    | `"sse"` | Chỉ buộc dùng SSE |
    | `"websocket"` | Chỉ buộc dùng WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Tài liệu OpenAI liên quan:
    - [Realtime API với WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Phản hồi API phát trực tuyến (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Khởi động nóng WebSocket">
    OpenClaw bật khởi động nóng WebSocket theo mặc định cho `openai/*` và `openai-codex/*` để giảm độ trễ lượt đầu.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chế độ nhanh">
    OpenClaw cung cấp một công tắc chế độ nhanh dùng chung cho `openai/*` và `openai-codex/*`:

    - **Trò chuyện/UI:** `/fast status|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi được bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không ghi lại `reasoning` hoặc `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Ghi đè phiên thắng cấu hình. Xóa ghi đè phiên trong UI Sessions sẽ đưa phiên về mặc định đã cấu hình.
    </Note>

  </Accordion>

  <Accordion title="Xử lý ưu tiên (service_tier)">
    API của OpenAI cung cấp xử lý ưu tiên qua `service_tier`. Đặt theo từng mô hình trong OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Các giá trị được hỗ trợ: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` chỉ được chuyển tiếp đến các endpoint OpenAI gốc (`api.openai.com`) và các endpoint Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai nhà cung cấp qua proxy, OpenClaw giữ nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc luồng Pi-harness của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Buộc `store: true` (trừ khi khả năng tương thích của mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không có)

    Điều này áp dụng cho đường dẫn Pi harness tích hợp sẵn và các hook nhà cung cấp OpenAI được dùng bởi các lần chạy nhúng. Harness máy chủ ứng dụng Codex gốc tự quản lý ngữ cảnh của nó thông qua Codex và được cấu hình riêng bằng `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Bật rõ ràng">
        Hữu ích cho các endpoint tương thích như Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Ngưỡng tùy chỉnh">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Tắt">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn buộc `store: true` trừ khi khả năng tương thích đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT agentic nghiêm ngặt">
    Với các lần chạy thuộc họ GPT-5 trên `openai/*`, OpenClaw có thể dùng một hợp đồng thực thi nhúng nghiêm ngặt hơn:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Với `strict-agentic`, OpenClaw:
    - Không còn coi một lượt chỉ lập kế hoạch là tiến triển thành công khi có thể thực hiện hành động công cụ
    - Thử lại lượt đó với chỉ dẫn hành động ngay
    - Tự động bật `update_plan` cho công việc đáng kể
    - Hiển thị trạng thái bị chặn rõ ràng nếu mô hình tiếp tục lập kế hoạch mà không hành động

    <Note>
    Chỉ áp dụng cho các lần chạy thuộc họ GPT-5 của OpenAI và Codex. Các nhà cung cấp khác và họ mô hình cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc và tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI trực tiếp, Codex và Azure OpenAI khác với các proxy `/v1` tương thích OpenAI chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ effort `none` của OpenAI
    - Bỏ qua reasoning đã tắt đối với các mô hình hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định đặt schema công cụ ở chế độ nghiêm ngặt
    - Chỉ đính kèm header ghi nhận ẩn trên các host gốc đã xác minh
    - Giữ định dạng yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`, khả năng tương thích reasoning, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Dùng hành vi tương thích linh hoạt hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không phải gốc
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI như vLLM
    - Không buộc schema công cụ nghiêm ngặt hoặc header chỉ dành cho tuyến gốc

    Azure OpenAI dùng transport gốc và hành vi tương thích nhưng không nhận các header ghi nhận ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và chọn nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
