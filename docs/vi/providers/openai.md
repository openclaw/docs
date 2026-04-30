---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi tác tử GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng tác nhân lập trình theo gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw giữ các bề mặt đó tách biệt để cấu hình luôn dễ dự đoán.

OpenClaw hỗ trợ ba tuyến thuộc họ OpenAI. Tiền tố mô hình chọn tuyến provider/xác thực; một thiết lập runtime riêng chọn bên thực thi vòng lặp tác nhân nhúng:

- **Khóa API** — truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng (mô hình `openai/*`)
- **Đăng ký Codex thông qua PI** — đăng nhập ChatGPT/Codex với quyền truy cập theo đăng ký (mô hình `openai-codex/*`)
- **Bộ chạy app-server Codex** — thực thi app-server Codex gốc (mô hình `openai/*` cộng với `agents.defaults.agentRuntime.id: "codex"`)

OpenAI hỗ trợ rõ ràng việc dùng OAuth theo đăng ký trong các công cụ và quy trình làm việc bên ngoài như OpenClaw.

Provider, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó đang bị trộn lẫn, hãy đọc [Runtime tác nhân](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                      | Dùng                                             | Ghi chú                                                                      |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Tính phí trực tiếp bằng khóa API              | `openai/gpt-5.5`                                 | Đặt `OPENAI_API_KEY` hoặc chạy onboarding khóa API OpenAI.                  |
| GPT-5.5 với xác thực đăng ký ChatGPT/Codex    | `openai-codex/gpt-5.5`                           | Tuyến PI mặc định cho OAuth Codex. Lựa chọn đầu tiên tốt nhất cho thiết lập đăng ký. |
| GPT-5.5 với hành vi app-server Codex gốc      | `openai/gpt-5.5` cộng với `agentRuntime.id: "codex"` | Ép dùng bộ chạy app-server Codex cho tham chiếu mô hình đó.                 |
| Tạo hoặc chỉnh sửa hình ảnh                   | `openai/gpt-image-2`                             | Hoạt động với `OPENAI_API_KEY` hoặc OAuth OpenAI Codex.                     |
| Hình ảnh nền trong suốt                       | `openai/gpt-image-1.5`                           | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`.     |

## Bản đồ tên gọi

Các tên tương tự nhau nhưng không thể thay thế cho nhau:

| Tên bạn thấy                       | Lớp              | Ý nghĩa                                                                                           |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Tiền tố provider | Tuyến API OpenAI Platform trực tiếp.                                                              |
| `openai-codex`                     | Tiền tố provider | Tuyến OAuth/đăng ký OpenAI Codex thông qua runner PI thông thường của OpenClaw.                  |
| Plugin `codex`                     | Plugin           | Plugin OpenClaw đi kèm cung cấp runtime app-server Codex gốc và điều khiển trò chuyện `/codex`. |
| `agentRuntime.id: codex`           | Runtime tác nhân | Ép dùng bộ chạy app-server Codex gốc cho các lượt nhúng.                                         |
| `/codex ...`                       | Bộ lệnh trò chuyện | Gắn/điều khiển các luồng app-server Codex từ một cuộc trò chuyện.                              |
| `runtime: "acp", agentId: "codex"` | Tuyến phiên ACP  | Đường dự phòng tường minh chạy Codex thông qua ACP/acpx.                                         |

Điều này có nghĩa là một cấu hình có thể chủ ý chứa cả `openai-codex/*` và Plugin `codex`. Điều đó hợp lệ khi bạn muốn OAuth Codex thông qua PI và cũng muốn có sẵn điều khiển trò chuyện `/codex` gốc. `openclaw doctor` cảnh báo về tổ hợp đó để bạn có thể xác nhận đây là chủ ý; nó không viết lại tổ hợp này.

<Note>
GPT-5.5 có sẵn thông qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến đăng ký/OAuth. Dùng `openai/gpt-5.5` cho lưu lượng `OPENAI_API_KEY` trực tiếp, `openai-codex/gpt-5.5` cho OAuth Codex thông qua PI, hoặc `openai/gpt-5.5` với `agentRuntime.id: "codex"` cho bộ chạy app-server Codex gốc.
</Note>

<Note>
Bật Plugin OpenAI, hoặc chọn mô hình `openai-codex/*`, không bật Plugin app-server Codex đi kèm. OpenClaw chỉ bật Plugin đó khi bạn chọn rõ bộ chạy Codex gốc bằng `agentRuntime.id: "codex"` hoặc dùng tham chiếu mô hình `codex/*` cũ.
Nếu Plugin `codex` đi kèm được bật nhưng `openai-codex/*` vẫn phân giải thông qua PI, `openclaw doctor` sẽ cảnh báo và giữ nguyên tuyến.
</Note>

## Mức độ hỗ trợ tính năng OpenClaw

| Khả năng của OpenAI      | Bề mặt OpenClaw                                           | Trạng thái                                             |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Trò chuyện / Responses   | Provider mô hình `openai/<model>`                         | Có                                                    |
| Mô hình đăng ký Codex    | `openai-codex/<model>` với OAuth `openai-codex`           | Có                                                    |
| Bộ chạy app-server Codex | `openai/<model>` với `agentRuntime.id: codex`             | Có                                                    |
| Tìm kiếm web phía server | Công cụ OpenAI Responses gốc                              | Có, khi tìm kiếm web được bật và không ghim provider  |
| Hình ảnh                 | `image_generate`                                           | Có                                                    |
| Video                    | `video_generate`                                           | Có                                                    |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`          | Có                                                    |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu phương tiện     | Có                                                    |
| Chuyển giọng nói thành văn bản dạng phát trực tiếp | Voice Call `streaming.provider: "openai"` | Có                                      |
| Giọng nói thời gian thực | Voice Call `realtime.provider: "openai"` / Control UI Talk | Có                                                    |
| Embeddings               | provider embedding bộ nhớ                                 | Có                                                    |

## Embedding bộ nhớ

OpenClaw có thể dùng OpenAI, hoặc một endpoint embedding tương thích OpenAI, cho việc lập chỉ mục và embedding truy vấn `memory_search`:

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

Đối với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, hãy đặt `queryInputType` và `documentInputType` trong `memorySearch`. OpenClaw chuyển tiếp các giá trị đó dưới dạng trường yêu cầu `input_type` dành riêng cho provider: embedding truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng `documentInputType`. Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để biết ví dụ đầy đủ.

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

    | Tham chiếu mô hình    | Cấu hình runtime          | Tuyến                       | Xác thực          |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | bỏ qua / `agentRuntime.id: "pi"`    | API OpenAI Platform trực tiếp | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | bỏ qua / `agentRuntime.id: "pi"`    | API OpenAI Platform trực tiếp | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Bộ chạy app-server Codex    | app-server Codex |

    <Note>
    `openai/*` là tuyến khóa API OpenAI trực tiếp trừ khi bạn ép dùng rõ bộ chạy app-server Codex. Dùng `openai-codex/*` cho OAuth Codex thông qua runner PI mặc định, hoặc dùng `openai/gpt-5.5` với `agentRuntime.id: "codex"` để thực thi app-server Codex gốc.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw không hiển thị `openai/gpt-5.3-codex-spark`. Các yêu cầu API OpenAI trực tiếp từ chối mô hình đó, và danh mục Codex hiện tại cũng không hiển thị nó.
    </Warning>

  </Tab>

  <Tab title="Đăng ký Codex">
    **Phù hợp nhất cho:** dùng đăng ký ChatGPT/Codex của bạn thay vì khóa API riêng. Codex cloud yêu cầu đăng nhập ChatGPT.

    <Steps>
      <Step title="Chạy OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Hoặc chạy OAuth trực tiếp:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Với các thiết lập headless hoặc khó dùng callback, thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình | Cấu hình runtime | Tuyến | Xác thực |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | bỏ qua / `runtime: "pi"` | OAuth ChatGPT/Codex thông qua PI | Đăng nhập Codex |
    | `openai-codex/gpt-5.4-mini` | bỏ qua / `runtime: "pi"` | OAuth ChatGPT/Codex thông qua PI | Đăng nhập Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Vẫn là PI trừ khi một Plugin tuyên bố rõ `openai-codex` | Đăng nhập Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Bộ chạy app-server Codex | Xác thực app-server Codex |

    <Note>
    Tiếp tục dùng id provider `openai-codex` cho các lệnh xác thực/hồ sơ. Tiền tố mô hình `openai-codex/*` cũng là tuyến PI tường minh cho OAuth Codex. Nó không chọn hoặc tự động bật bộ chạy app-server Codex đi kèm.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding không còn nhập dữ liệu OAuth từ `~/.codex`. Đăng nhập bằng OAuth trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin xác thực thu được trong kho xác thực tác nhân riêng của nó.
    </Note>

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị runtime mô hình nào đang hoạt động cho phiên hiện tại.
    Harness PI mặc định xuất hiện dưới dạng `Runtime: OpenClaw Pi Default`. Khi
    harness app-server Codex đi kèm được chọn, `/status` hiển thị
    `Runtime: OpenAI Codex`. Các phiên hiện có giữ id harness đã ghi lại, vì vậy hãy dùng
    `/new` hoặc `/reset` sau khi thay đổi `agentRuntime` nếu bạn muốn `/status`
    phản ánh lựa chọn PI/Codex mới.

    ### Cảnh báo Doctor

    Nếu Plugin `codex` đi kèm được bật trong khi route
    `openai-codex/*` của tab này được chọn, `openclaw doctor` sẽ cảnh báo rằng mô hình
    vẫn được phân giải qua PI. Giữ nguyên cấu hình khi đó là route xác thực bằng gói đăng ký
    chủ đích. Chỉ chuyển sang `openai/<model>` cộng với
    `agentRuntime.id: "codex"` khi bạn muốn thực thi app-server Codex
    gốc.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xử lý siêu dữ liệu mô hình và giới hạn ngữ cảnh runtime như các giá trị riêng biệt.

    Với `openai-codex/gpt-5.5` qua Codex OAuth:

    - `contextWindow` gốc: `1000000`
    - Giới hạn `contextTokens` runtime mặc định: `272000`

    Giới hạn mặc định nhỏ hơn có đặc tính độ trễ và chất lượng tốt hơn trong thực tế. Ghi đè bằng `contextTokens`:

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
    Dùng `contextWindow` để khai báo siêu dữ liệu mô hình gốc. Dùng `contextTokens` để giới hạn ngân sách ngữ cảnh runtime.
    </Note>

    ### Khôi phục danh mục

    OpenClaw dùng siêu dữ liệu danh mục Codex thượng nguồn cho `gpt-5.5` khi có
    sẵn. Nếu quá trình khám phá Codex trực tiếp bỏ qua hàng `openai-codex/gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw sẽ tổng hợp hàng mô hình OAuth đó để
    các lần chạy cron, sub-agent và mô hình mặc định đã cấu hình không lỗi với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Harness app-server Codex gốc dùng refs mô hình `openai/*` cộng với
`agentRuntime.id: "codex"`, nhưng xác thực của nó vẫn dựa trên tài khoản. OpenClaw
chọn xác thực theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw `openai-codex` rõ ràng được liên kết với tác nhân.
2. Tài khoản hiện có của app-server, chẳng hạn như đăng nhập ChatGPT bằng Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi app-server báo cáo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó nghĩa là một lần đăng nhập gói đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình gateway cũng có `OPENAI_API_KEY` cho các mô hình OpenAI trực tiếp
hoặc embeddings. Phương án dự phòng khóa API env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi tới các kết nối app-server WebSocket. Khi một hồ sơ Codex kiểu gói đăng ký
được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
không đưa vào tiến trình con app-server stdio được sinh ra và gửi thông tin xác thực đã chọn
qua RPC đăng nhập app-server.

## Tạo ảnh

Plugin `openai` đi kèm đăng ký tạo ảnh thông qua công cụ `image_generate`.
Nó hỗ trợ cả tạo ảnh bằng khóa API OpenAI và tạo ảnh bằng Codex OAuth
thông qua cùng ref mô hình `openai/gpt-image-2`.

| Khả năng                  | Khóa API OpenAI                   | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref mô hình               | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                  | `OPENAI_API_KEY`                   | Đăng nhập OpenAI Codex OAuth         |
| Truyền tải                | OpenAI Images API                  | Backend Codex Responses              |
| Số ảnh tối đa mỗi yêu cầu | 4                                  | 4                                    |
| Chế độ chỉnh sửa          | Đã bật (tối đa 5 ảnh tham chiếu)   | Đã bật (tối đa 5 ảnh tham chiếu)     |
| Ghi đè kích thước         | Được hỗ trợ, gồm kích thước 2K/4K  | Được hỗ trợ, gồm kích thước 2K/4K    |
| Tỷ lệ khung hình / độ phân giải | Không chuyển tiếp tới OpenAI Images API | Được ánh xạ sang kích thước được hỗ trợ khi an toàn |

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
Xem [Tạo ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

`gpt-image-2` là mặc định cho cả tạo ảnh từ văn bản OpenAI và chỉnh sửa ảnh.
`gpt-image-1.5`, `gpt-image-1`, và `gpt-image-1-mini` vẫn dùng được dưới dạng
ghi đè mô hình rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra PNG/WebP
nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Với yêu cầu nền trong suốt, tác nhân nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ
vẫn được chấp nhận. OpenClaw cũng bảo vệ các route OpenAI công khai và
OpenAI Codex OAuth bằng cách ghi lại các yêu cầu trong suốt mặc định `openai/gpt-image-2`
thành `gpt-image-1.5`; Azure và các endpoint tương thích OpenAI tùy chỉnh giữ
nguyên tên triển khai/mô hình đã cấu hình.

Cùng thiết lập này được cung cấp cho các lần chạy CLI không giao diện:

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

Với các bản cài đặt Codex OAuth, giữ nguyên ref `openai/gpt-image-2`. Khi một
hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw phân giải mã truy cập OAuth
đã lưu đó và gửi yêu cầu ảnh qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển sang khóa API cho yêu cầu đó.
Cấu hình rõ ràng `models.providers.openai` với khóa API,
URL cơ sở tùy chỉnh hoặc endpoint Azure khi bạn muốn route OpenAI Images API
trực tiếp.
Nếu endpoint ảnh tùy chỉnh đó nằm trên địa chỉ LAN riêng/đáng tin cậy, hãy đặt thêm
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw giữ
các endpoint ảnh tương thích OpenAI riêng/nội bộ bị chặn trừ khi có lựa chọn tham gia này.

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

Plugin `openai` đi kèm đăng ký tạo video thông qua công cụ `video_generate`.

| Khả năng           | Giá trị                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Mô hình mặc định   | `openai/sora-2`                                                                   |
| Chế độ             | Văn bản thành video, ảnh thành video, chỉnh sửa một video                         |
| Đầu vào tham chiếu | 1 ảnh hoặc 1 video                                                                |
| Ghi đè kích thước  | Được hỗ trợ                                                                       |
| Ghi đè khác        | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ  |

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

## Đóng góp prompt GPT-5

OpenClaw thêm một đóng góp prompt GPT-5 dùng chung cho các lần chạy thuộc họ GPT-5 trên nhiều nhà cung cấp. Nó áp dụng theo id mô hình, vì vậy `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, và các ref GPT-5 tương thích khác nhận cùng lớp phủ. Các mô hình GPT-4.x cũ hơn thì không.

Harness Codex gốc đi kèm dùng cùng hành vi GPT-5 và lớp phủ Heartbeat thông qua hướng dẫn dành cho nhà phát triển của app-server Codex, vì vậy các phiên `openai/gpt-5.x` bị buộc qua `agentRuntime.id: "codex"` vẫn giữ cùng hướng dẫn theo sát công việc và Heartbeat chủ động dù Codex sở hữu phần còn lại của prompt harness.

Đóng góp GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh. Hành vi trả lời theo kênh và tin nhắn im lặng vẫn nằm trong prompt hệ thống OpenClaw dùng chung và chính sách phân phối đi. Hướng dẫn GPT-5 luôn được bật cho các mô hình khớp. Lớp phong cách tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị                | Tác dụng                                      |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện       |
| `"on"`                 | Bí danh cho `"friendly"`                      |
| `"off"`                | Chỉ tắt lớp phong cách thân thiện             |

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
Các giá trị không phân biệt chữ hoa chữ thường ở runtime, vì vậy cả `"Off"` và `"off"` đều tắt lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc làm phương án dự phòng tương thích khi thiết lập `agents.defaults.promptOverlays.gpt5.personality` dùng chung chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp giọng nói (TTS)">
    Plugin `openai` đi kèm đăng ký tổng hợp giọng nói cho bề mặt `messages.tts`.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.voice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Hướng dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Các mô hình có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng đến endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Lời nói thành văn bản">
    Plugin `openai` đi kèm đăng ký lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi mà phiên âm âm thanh đầu vào dùng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và tệp đính kèm
      âm thanh của kênh

    Để buộc dùng OpenAI cho phiên âm âm thanh đến:

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
    cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lệnh gọi.

  </Accordion>

  <Accordion title="Phiên âm thời gian thực">
    Plugin `openai` được tích hợp đăng ký phiên âm thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Sử dụng kết nối WebSocket đến `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm thời gian thực của Voice Call; thoại Discord hiện ghi lại các đoạn ngắn và dùng đường dẫn phiên âm hàng loạt `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói thời gian thực">
    Plugin `openai` được tích hợp đăng ký giọng nói thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Giọng nói | `...openai.voice` | `alloy` |
    | Nhiệt độ | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Hỗ trợ Azure OpenAI thông qua các khóa cấu hình `azureEndpoint` và `azureDeployment` cho các cầu nối thời gian thực phía backend. Hỗ trợ gọi công cụ hai chiều. Sử dụng định dạng âm thanh G.711 u-law.
    </Note>

    <Note>
    Talk trong Control UI sử dụng phiên thời gian thực trên trình duyệt OpenAI với
    mã bí mật máy khách tạm thời do Gateway cấp và trao đổi WebRTC SDP trực tiếp trên trình duyệt với
    OpenAI Realtime API. Có thể xác minh trực tiếp dành cho người bảo trì bằng
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    nhánh OpenAI tạo mã bí mật máy khách trong Node, tạo SDP offer trên trình duyệt
    với phương tiện micro giả, gửi nó đến OpenAI và áp dụng SDP answer
    mà không ghi nhật ký bí mật.
    </Note>

  </Accordion>
</AccordionGroup>

## Điểm cuối Azure OpenAI

Nhà cung cấp `openai` được tích hợp có thể nhắm đến tài nguyên Azure OpenAI để tạo
hình ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo hình ảnh, OpenClaw
phát hiện tên máy chủ Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
dạng yêu cầu của Azure.

<Note>
Giọng nói thời gian thực sử dụng đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Giọng nói thời gian thực**
trong [Giọng nói và lời nói](#voice-and-speech) để biết các cài đặt Azure
của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có gói đăng ký Azure OpenAI, hạn mức hoặc thỏa thuận doanh nghiệp
- Bạn cần lưu trú dữ liệu theo khu vực hoặc các kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo hình ảnh qua Azure bằng nhà cung cấp `openai` được tích hợp, trỏ
`models.providers.openai.baseUrl` đến tài nguyên Azure của bạn và đặt `apiKey` thành
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

Đối với yêu cầu tạo hình ảnh trên máy chủ Azure được nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Sử dụng đường dẫn theo phạm vi deployment (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào mỗi yêu cầu
- Sử dụng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo hình ảnh Azure.
  Giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ nguyên
dạng yêu cầu hình ảnh OpenAI tiêu chuẩn.

<Note>
Định tuyến Azure cho đường dẫn tạo hình ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xử lý mọi
`openai.baseUrl` tùy chỉnh như điểm cuối OpenAI công khai và sẽ thất bại với các
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

Azure OpenAI liên kết mô hình với deployment. Đối với các yêu cầu tạo hình ảnh Azure
được định tuyến qua nhà cung cấp `openai` được tích hợp, trường `model` trong OpenClaw
phải là **tên deployment Azure** bạn đã cấu hình trong cổng Azure, không phải
id mô hình OpenAI công khai.

Nếu bạn tạo một deployment tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên deployment tương tự áp dụng cho các lệnh gọi tạo hình ảnh được định tuyến qua
nhà cung cấp `openai` được tích hợp.

### Tính khả dụng theo khu vực

Tạo hình ảnh Azure hiện chỉ khả dụng ở một số khu vực
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
deployment, và xác nhận mô hình cụ thể được cung cấp trong khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số hình ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
giá trị `background` trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản mô hình
cụ thể. Những khác biệt này đến từ Azure và mô hình nền tảng, không phải
OpenClaw. Nếu yêu cầu Azure thất bại với lỗi xác thực, hãy kiểm tra
bộ tham số được deployment và phiên bản API cụ thể của bạn hỗ trợ trong
cổng Azure.

<Note>
Azure OpenAI sử dụng truyền tải gốc và hành vi tương thích nhưng không nhận
các header quy công ẩn của OpenClaw — xem accordion **Tuyến gốc so với tuyến tương thích OpenAI**
trong [Cấu hình nâng cao](#advanced-configuration).

Đối với lưu lượng chat hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy dùng
luồng onboarding hoặc cấu hình nhà cung cấp Azure chuyên dụng — chỉ riêng `openai.baseUrl`
không chọn dạng API/xác thực Azure. Có một nhà cung cấp
`azure-openai-responses/*` riêng; xem accordion Compaction phía máy chủ bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Truyền tải (WebSocket so với SSE)">
    OpenClaw ưu tiên WebSocket với dự phòng SSE (`"auto"`) cho cả `openai/*` và `openai-codex/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi dự phòng sang SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian hạ nhiệt
    - Gắn các header định danh phiên và lượt ổn định cho các lần thử lại và kết nối lại
    - Chuẩn hóa bộ đếm sử dụng (`input_tokens` / `prompt_tokens`) trên các biến thể truyền tải

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
    - [Phản hồi Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Khởi động trước WebSocket">
    OpenClaw bật khởi động trước WebSocket theo mặc định cho `openai/*` và `openai-codex/*` để giảm độ trễ lượt đầu.

    ```json5
    // Tắt khởi động trước
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

    - **Chat/UI:** `/fast status|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không viết lại `reasoning` hoặc `text.verbosity`.

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
    Ghi đè phiên thắng cấu hình. Xóa ghi đè phiên trong UI Sessions sẽ đưa phiên trở lại mặc định đã cấu hình.
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

    Giá trị được hỗ trợ: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` chỉ được chuyển tiếp đến các điểm cuối OpenAI gốc (`api.openai.com`) và điểm cuối Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai nhà cung cấp qua proxy, OpenClaw để nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Đối với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc luồng Pi-harness của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Buộc `store: true` (trừ khi tương thích mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không khả dụng)

    Điều này áp dụng cho đường dẫn Pi harness tích hợp sẵn và cho các hook nhà cung cấp OpenAI được dùng bởi các lần chạy nhúng. Harness máy chủ ứng dụng Codex gốc tự quản lý ngữ cảnh của nó thông qua Codex và được cấu hình riêng với `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Bật rõ ràng">
        Hữu ích cho các điểm cuối tương thích như Azure OpenAI Responses:

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn buộc `store: true` trừ khi compat đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT strict-agentic">
    Với các lượt chạy thuộc họ GPT-5 trên `openai/*`, OpenClaw có thể sử dụng một hợp đồng thực thi nhúng nghiêm ngặt hơn:

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
    - Không còn xem một lượt chỉ lập kế hoạch là tiến triển thành công khi có sẵn một hành động công cụ
    - Thử lại lượt đó với chỉ dẫn hành động ngay
    - Tự động bật `update_plan` cho công việc đáng kể
    - Hiển thị trạng thái bị chặn rõ ràng nếu mô hình tiếp tục lập kế hoạch mà không hành động

    <Note>
    Chỉ áp dụng cho các lượt chạy thuộc họ OpenAI và Codex GPT-5. Các nhà cung cấp khác và các họ mô hình cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI trực tiếp, Codex và Azure OpenAI khác với các proxy `/v1` tương thích OpenAI chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ mức effort `none` của OpenAI
    - Bỏ qua reasoning đã tắt đối với các mô hình hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định schema công cụ sang chế độ nghiêm ngặt
    - Chỉ gắn các header ghi nhận ẩn trên các host gốc đã xác minh
    - Giữ định hình yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`, reasoning-compat, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Sử dụng hành vi compat lỏng hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không phải gốc
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI như vLLM
    - Không ép schema công cụ nghiêm ngặt hoặc header chỉ dành cho tuyến gốc

    Azure OpenAI sử dụng transport gốc và hành vi compat nhưng không nhận các header ghi nhận ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
