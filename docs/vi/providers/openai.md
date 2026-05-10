---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn sử dụng xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi của tác nhân GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI thông qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng tác nhân lập trình theo gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw giữ các bề mặt đó tách biệt để cấu hình luôn dễ dự đoán.

OpenClaw dùng `openai/*` làm tuyến mô hình OpenAI chuẩn. Các lượt tác nhân nhúng trên mô hình OpenAI mặc định chạy qua runtime máy chủ ứng dụng Codex gốc; xác thực bằng khóa API OpenAI trực tiếp vẫn có sẵn cho các bề mặt OpenAI không phải tác nhân như hình ảnh, embeddings, giọng nói và realtime.

- **Mô hình tác nhân** - các mô hình `openai/*` qua runtime Codex; đăng nhập bằng xác thực `openai-codex` để dùng gói đăng ký ChatGPT/Codex, hoặc cấu hình một hồ sơ khóa API `openai-codex` khi bạn chủ ý muốn xác thực bằng khóa API.
- **API OpenAI không phải tác nhân** - truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng thông qua `OPENAI_API_KEY` hoặc quy trình thiết lập khóa API OpenAI.
- **Cấu hình kế thừa** - các tham chiếu mô hình `openai-codex/*` được `openclaw doctor --fix` sửa thành `openai/*` cộng với runtime Codex.

OpenAI hỗ trợ rõ ràng việc dùng OAuth theo gói đăng ký trong các công cụ và quy trình bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó đang bị trộn lẫn với nhau, hãy đọc [Runtime tác nhân](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                             | Dùng                                                    | Ghi chú                                                               |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-5.5`                                        | Thiết lập tác nhân OpenAI mặc định. Đăng nhập bằng xác thực `openai-codex`. |
| Tính phí khóa API trực tiếp cho mô hình tác nhân     | `openai/gpt-5.5` cộng với hồ sơ khóa API `openai-codex` | Dùng `auth.order.openai-codex` để ưu tiên hồ sơ đó.                  |
| Tính phí khóa API trực tiếp qua PI rõ ràng           | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `pi` | Chọn một hồ sơ khóa API `openai` thông thường.                    |
| Bí danh API ChatGPT Instant mới nhất                 | `openai/chat-latest`                                    | Chỉ dùng khóa API trực tiếp. Bí danh di động cho thử nghiệm, không phải mặc định. |
| Xác thực gói đăng ký ChatGPT/Codex qua PI rõ ràng    | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `pi` | Chọn hồ sơ xác thực `openai-codex` cho tuyến tương thích.       |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                                    | Hoạt động với `OPENAI_API_KEY` hoặc OpenAI Codex OAuth.              |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                                  | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`. |

## Bản đồ đặt tên

Các tên tương tự nhau nhưng không thể dùng thay thế cho nhau:

| Tên bạn thấy                            | Lớp                 | Ý nghĩa                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Tiền tố nhà cung cấp | Tuyến mô hình OpenAI chuẩn; các lượt tác nhân dùng runtime Codex.                                |
| `openai-codex`                          | Tiền tố xác thực/hồ sơ | Nhà cung cấp hồ sơ xác thực OpenAI Codex OAuth/gói đăng ký.                                  |
| Plugin `codex`                          | Plugin              | Plugin OpenClaw đi kèm, cung cấp runtime máy chủ ứng dụng Codex gốc và điều khiển trò chuyện `/codex`. |
| provider/model `agentRuntime.id: codex` | Runtime tác nhân    | Ép dùng harness máy chủ ứng dụng Codex gốc cho các lượt nhúng khớp.                              |
| `/codex ...`                            | Bộ lệnh trò chuyện  | Liên kết/điều khiển các luồng máy chủ ứng dụng Codex từ một cuộc hội thoại.                      |
| `runtime: "acp", agentId: "codex"`      | Tuyến phiên ACP     | Đường dự phòng rõ ràng chạy Codex qua ACP/acpx.                                                   |

Điều này có nghĩa là một cấu hình có thể chủ ý chứa cả tham chiếu mô hình `openai/*` và hồ sơ xác thực `openai-codex`. `openclaw doctor --fix` viết lại các tham chiếu mô hình `openai-codex/*` kế thừa sang tuyến mô hình OpenAI chuẩn.

<Note>
GPT-5.5 có sẵn qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến gói đăng ký/OAuth. Để dùng gói đăng ký ChatGPT/Codex cùng thực thi Codex gốc, dùng `openai/gpt-5.5`; cấu hình runtime chưa đặt hiện chọn harness Codex cho các lượt tác nhân OpenAI. Chỉ dùng hồ sơ khóa API OpenAI khi bạn muốn xác thực khóa API trực tiếp cho một mô hình tác nhân OpenAI.
</Note>

<Note>
Các lượt mô hình tác nhân OpenAI yêu cầu Plugin máy chủ ứng dụng Codex đi kèm. Cấu hình runtime PI rõ ràng vẫn có sẵn như một tuyến tương thích chọn tham gia. Khi PI được chọn rõ ràng với hồ sơ xác thực `openai-codex`, OpenClaw giữ tham chiếu mô hình công khai là `openai/*` và định tuyến PI nội bộ qua transport xác thực Codex kế thừa. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình `openai-codex/*` cũ hoặc các ghim phiên PI cũ không đến từ cấu hình runtime rõ ràng.
</Note>

## Phạm vi hỗ trợ tính năng OpenClaw

| Khả năng OpenAI         | Bề mặt OpenClaw                                                                 | Trạng thái                                             |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Trò chuyện / Responses  | Nhà cung cấp mô hình `openai/<model>`                                            | Có                                                     |
| Mô hình gói đăng ký Codex | `openai/<model>` với OAuth `openai-codex`                                      | Có                                                     |
| Tham chiếu mô hình Codex kế thừa | `openai-codex/<model>`                                                  | Được doctor sửa thành `openai/<model>`                 |
| Harness máy chủ ứng dụng Codex | `openai/<model>` với runtime bỏ qua hoặc provider/model `agentRuntime.id: codex` | Có                                               |
| Tìm kiếm web phía máy chủ | Công cụ OpenAI Responses gốc                                                   | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp |
| Hình ảnh                | `image_generate`                                                                 | Có                                                     |
| Video                   | `video_generate`                                                                 | Có                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`                               | Có                                                     |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu media                                | Có                                                     |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "openai"`                     | Có                                                     |
| Giọng nói realtime      | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Có                                                     |
| Embeddings              | Nhà cung cấp embedding bộ nhớ                                                    | Có                                                     |

## Embeddings bộ nhớ

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

Đối với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, đặt `queryInputType` và `documentInputType` dưới `memorySearch`. OpenClaw chuyển tiếp chúng dưới dạng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp: embedding truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng `documentInputType`. Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để biết ví dụ đầy đủ.

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
    | `openai/gpt-5.5`      | bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex | Hồ sơ `openai-codex` |
    | `openai/gpt-5.4-mini` | bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex | Hồ sơ `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Runtime nhúng PI       | Hồ sơ `openai` hoặc hồ sơ `openai-codex` đã chọn |

    <Note>
    Các mô hình tác nhân `openai/*` dùng harness máy chủ ứng dụng Codex. Để dùng xác thực khóa API cho một mô hình tác nhân, hãy tạo hồ sơ khóa API `openai-codex` và sắp xếp nó bằng `auth.order.openai-codex`; `OPENAI_API_KEY` vẫn là dự phòng trực tiếp cho các bề mặt API OpenAI không phải tác nhân.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Để thử mô hình Instant hiện tại của ChatGPT từ OpenAI API, đặt mô hình thành `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` là một bí danh di động. OpenAI mô tả nó là mô hình Instant mới nhất được dùng trong ChatGPT và khuyến nghị `gpt-5.5` cho việc dùng API trong sản xuất, vì vậy hãy giữ `openai/gpt-5.5` làm mặc định ổn định trừ khi bạn chủ ý muốn hành vi bí danh đó. Bí danh hiện chỉ chấp nhận độ dài văn bản `medium`, nên OpenClaw chuẩn hóa các ghi đè độ dài văn bản OpenAI không tương thích cho mô hình này.

    <Warning>
    OpenClaw **không** cung cấp `openai/gpt-5.3-codex-spark`. Các yêu cầu OpenAI API trực tiếp từ chối mô hình đó, và catalog Codex hiện tại cũng không cung cấp nó.
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

        Với các thiết lập headless hoặc khó dùng callback, thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Sử dụng route mô hình OpenAI chính tắc">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Không cần cấu hình runtime cho đường dẫn mặc định. Các lượt agent OpenAI
        tự động chọn runtime máy chủ ứng dụng Codex gốc, và OpenClaw
        cài đặt hoặc sửa chữa Plugin Codex đi kèm khi route này được chọn.
      </Step>
      <Step title="Xác minh auth Codex khả dụng">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Sau khi Gateway đang chạy, gửi `/codex status` hoặc `/codex models`
        trong chat để xác minh runtime máy chủ ứng dụng gốc.
      </Step>
    </Steps>

    ### Tóm tắt route

    | Tham chiếu mô hình | Cấu hình runtime | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | bị bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex gốc | Đăng nhập Codex hoặc hồ sơ `openai-codex` đã chọn |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime nhúng PI với transport Codex-auth nội bộ | Hồ sơ `openai-codex` đã chọn |
    | `openai-codex/gpt-5.5` | được doctor sửa chữa | Route cũ được viết lại thành `openai/gpt-5.5` | Hồ sơ `openai-codex` hiện có |

    <Warning>
    Không cấu hình các tham chiếu mô hình `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` hoặc
    `openai-codex/gpt-5.3*` cũ hơn. Tài khoản OAuth ChatGPT/Codex hiện từ chối
    các mô hình đó. Dùng `openai/gpt-5.5`; các lượt agent OpenAI hiện chọn runtime
    Codex theo mặc định.
    </Warning>

    <Note>
    Tiếp tục dùng provider id `openai-codex` cho các lệnh auth/hồ sơ. Tiền tố mô hình
    `openai-codex/*` là cấu hình cũ được doctor sửa chữa. Với thiết lập phổ biến gồm
    gói đăng ký cộng với runtime gốc, hãy đăng nhập bằng `openai-codex`
    nhưng giữ tham chiếu mô hình là `openai/gpt-5.5`.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    Onboarding không còn nhập vật liệu OAuth từ `~/.codex`. Đăng nhập bằng OAuth trình duyệt (mặc định) hoặc luồng device-code ở trên — OpenClaw quản lý thông tin xác thực thu được trong kho auth agent riêng.
    </Note>

    ### Kiểm tra và khôi phục định tuyến OAuth Codex

    Dùng các lệnh này để xem mô hình, runtime và route auth nào mà agent mặc định
    của bạn đang dùng:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Với một agent cụ thể, thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Nếu cấu hình cũ hơn vẫn có `openai-codex/gpt-*` hoặc ghim phiên OpenAI PI
    cũ mà không có cấu hình runtime rõ ràng, hãy sửa chữa:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai-codex` không hiển thị hồ sơ nào dùng được, hãy
    đăng nhập lại:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` vẫn là provider id cho auth/hồ sơ. `openai/*` là
    route mô hình cho các lượt agent OpenAI thông qua Codex.

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị runtime mô hình nào đang hoạt động cho phiên hiện tại.
    Harness máy chủ ứng dụng Codex đi kèm xuất hiện dưới dạng `Runtime: OpenAI Codex` cho
    các lượt mô hình agent OpenAI. Các ghim phiên PI cũ được sửa chữa thành Codex trừ khi
    cấu hình ghim PI một cách rõ ràng.

    ### Cảnh báo doctor

    Nếu các route `openai-codex/*` hoặc ghim OpenAI PI cũ vẫn còn trong cấu hình hoặc
    trạng thái phiên, `openclaw doctor --fix` sẽ viết lại chúng thành `openai/*` với
    runtime Codex trừ khi PI được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xử lý metadata mô hình và giới hạn ngữ cảnh runtime như các giá trị riêng biệt.

    Với `openai/gpt-5.5` thông qua danh mục OAuth Codex:

    - `contextWindow` gốc: `1000000`
    - Giới hạn runtime mặc định `contextTokens`: `272000`

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
    Dùng `contextWindow` để khai báo metadata mô hình gốc. Dùng `contextTokens` để giới hạn ngân sách ngữ cảnh runtime.
    </Note>

    ### Khôi phục danh mục

    OpenClaw dùng siêu dữ liệu danh mục Codex thượng nguồn cho `gpt-5.5` khi có
    sẵn. Nếu quá trình khám phá Codex trực tiếp bỏ qua hàng `gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng mô hình OAuth đó để các
    lượt chạy cron, sub-agent và default-model đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Harness app-server Codex gốc dùng các model ref `openai/*` cùng với cấu hình
runtime bị lược bỏ hoặc provider/model `agentRuntime.id: "codex"`, nhưng xác thực
của nó vẫn dựa trên tài khoản. OpenClaw
chọn xác thực theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw `openai-codex` tường minh được liên kết với tác tử.
2. Tài khoản hiện có của app-server, chẳng hạn như một phiên đăng nhập ChatGPT Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi app-server báo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó có nghĩa là một phiên đăng nhập thuê bao ChatGPT/Codex cục bộ không bị
thay thế chỉ vì tiến trình gateway cũng có `OPENAI_API_KEY` cho các mô hình
OpenAI trực tiếp hoặc embeddings. Dự phòng API-key qua env chỉ là đường dẫn stdio
cục bộ không có tài khoản; nó không được gửi tới các kết nối app-server WebSocket.
Khi một hồ sơ Codex kiểu thuê bao được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và
`OPENAI_API_KEY` bên ngoài tiến trình con app-server stdio được sinh ra và gửi
thông tin xác thực đã chọn qua RPC đăng nhập app-server.

## Tạo ảnh

Plugin `openai` đi kèm đăng ký tạo ảnh thông qua công cụ `image_generate`.
Nó hỗ trợ cả tạo ảnh bằng API-key OpenAI và tạo ảnh bằng Codex OAuth
thông qua cùng model ref `openai/gpt-image-2`.

| Năng lực                 | API key OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
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
Xem [Tạo ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn provider và hành vi chuyển đổi dự phòng.
</Note>

`gpt-image-2` là mặc định cho cả tạo ảnh từ văn bản OpenAI và chỉnh sửa ảnh.
`gpt-image-1.5`, `gpt-image-1` và `gpt-image-1-mini` vẫn dùng được dưới dạng
ghi đè mô hình tường minh. Dùng `openai/gpt-image-1.5` cho đầu ra PNG/WebP
nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Với yêu cầu nền trong suốt, các tác tử nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn provider `openai.background` cũ hơn
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và
OpenAI Codex OAuth bằng cách viết lại các yêu cầu trong suốt mặc định
`openai/gpt-image-2` thành `gpt-image-1.5`; Azure và các endpoint tương thích
OpenAI tùy chỉnh giữ nguyên tên deployment/model đã cấu hình.

Cùng thiết lập đó cũng được cung cấp cho các lượt chạy CLI không giao diện:

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
`--openai-background` vẫn có sẵn như một alias riêng cho OpenAI.

Với các bản cài đặt Codex OAuth, giữ nguyên ref `openai/gpt-image-2`. Khi một
hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw phân giải access token OAuth
đã lưu đó và gửi yêu cầu ảnh qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển về một API key cho yêu cầu
đó. Cấu hình `models.providers.openai` tường minh với API key,
URL cơ sở tùy chỉnh hoặc endpoint Azure khi bạn muốn dùng tuyến OpenAI Images API
trực tiếp.
Nếu endpoint ảnh tùy chỉnh đó nằm trên một địa chỉ LAN/riêng tư đáng tin cậy, hãy đặt thêm
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw vẫn chặn
các endpoint ảnh tương thích OpenAI riêng tư/nội bộ trừ khi có lựa chọn tham gia này.

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

| Năng lực          | Giá trị                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Mô hình mặc định  | `openai/sora-2`                                                                   |
| Chế độ            | Văn bản thành video, ảnh thành video, chỉnh sửa một video                         |
| Đầu vào tham chiếu | 1 ảnh hoặc 1 video                                                               |
| Ghi đè kích thước | Được hỗ trợ                                                                       |
| Ghi đè khác       | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn provider và hành vi chuyển đổi dự phòng.
</Note>

## Đóng góp prompt GPT-5

OpenClaw thêm một phần đóng góp prompt GPT-5 dùng chung cho các lượt chạy thuộc họ GPT-5 trên nhiều provider. Phần này áp dụng theo id mô hình, nên `openai/gpt-5.5`, các ref cũ trước khi sửa như `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` và các ref GPT-5 tương thích khác đều nhận cùng lớp phủ. Các mô hình GPT-4.x cũ hơn thì không.

Harness Codex gốc đi kèm dùng cùng hành vi GPT-5 và lớp phủ heartbeat thông qua chỉ dẫn developer của app-server Codex, nên các phiên `openai/gpt-5.x` được định tuyến qua Codex vẫn giữ cùng hướng dẫn theo sát đến cùng và heartbeat chủ động, dù Codex sở hữu phần còn lại của prompt harness.

Đóng góp GPT-5 thêm một hợp đồng hành vi được gắn thẻ cho việc duy trì nhân cách, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh. Hành vi trả lời theo từng kênh và tin nhắn im lặng vẫn nằm trong prompt hệ thống OpenClaw dùng chung và chính sách gửi đi. Hướng dẫn GPT-5 luôn được bật cho các model khớp. Lớp kiểu tương tác thân thiện tách biệt và có thể cấu hình.

| Giá trị                | Tác dụng                                   |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (mặc định) | Bật lớp kiểu tương tác thân thiện          |
| `"on"`                 | Bí danh cho `"friendly"`                   |
| `"off"`                | Chỉ tắt lớp kiểu thân thiện                |

<Tabs>
  <Tab title="Config">
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
Các giá trị không phân biệt chữ hoa chữ thường khi chạy, nên `"Off"` và `"off"` đều tắt lớp kiểu thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc như một phương án tương thích dự phòng khi thiết lập dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin `openai` đi kèm đăng ký tổng hợp giọng nói cho bề mặt `messages.tts`.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.voice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Nội dung bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các model có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, vì vậy hãy dùng nó cho các endpoint tương thích OpenAI cần khóa bổ sung như `lang`. Các khóa prototype bị bỏ qua.

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
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng đến endpoint API chat. OpenAI TTS vẫn được cấu hình thông qua khóa API; với talk-back trực tiếp chỉ dùng OAuth, hãy dùng đường dẫn giọng nói Realtime thay vì lời nói STT -> TTS ở chế độ agent.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` đi kèm đăng ký chuyển lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Model mặc định: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đầu vào dùng
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
    cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lệnh gọi.

  </Accordion>

  <Accordion title="Realtime transcription">
    Plugin `openai` đi kèm đăng ký phiên âm realtime cho Plugin Voice Call.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai-codex` | Khóa API kết nối trực tiếp; OAuth phát hành client secret Realtime transcription |

    <Note>
    Dùng kết nối WebSocket đến `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Khi chỉ cấu hình OAuth `openai-codex`, Gateway phát hành một client secret Realtime transcription tạm thời trước khi mở WebSocket. Nhà cung cấp streaming này dành cho đường dẫn phiên âm realtime của Voice Call; thoại Discord hiện ghi các đoạn ngắn và dùng đường dẫn phiên âm theo lô `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin `openai` đi kèm đăng ký giọng nói realtime cho Plugin Voice Call.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Giọng | `...openai.voice` | `alloy` |
    | Nhiệt độ (cầu nối triển khai Azure) | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Đệm tiền tố | `...openai.prefixPaddingMs` | `300` |
    | Mức nỗ lực suy luận | `...openai.reasoningEffort` | (chưa đặt) |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai-codex` | Browser Talk và các cầu nối backend không phải Azure có thể dùng OAuth Codex |

    Các giọng Realtime tích hợp sẵn cho `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI khuyến nghị `marin` và `cedar` để có chất lượng Realtime tốt nhất. Đây
    là một tập riêng với các giọng Text-to-speech ở trên; đừng giả định một giọng TTS
    như `fable`, `nova`, hoặc `onyx` hợp lệ cho phiên Realtime.

    <Note>
    Các cầu nối realtime backend OpenAI dùng dạng phiên GA Realtime WebSocket, vốn không chấp nhận `session.temperature`. Các triển khai Azure OpenAI vẫn có sẵn qua `azureEndpoint` và `azureDeployment` và giữ dạng phiên tương thích với triển khai. Hỗ trợ gọi công cụ hai chiều và âm thanh G.711 u-law.
    </Note>

    <Note>
    Giọng realtime được chọn khi phiên được tạo. OpenAI cho phép hầu hết
    trường phiên thay đổi sau đó, nhưng không thể thay đổi giọng sau khi
    model đã phát âm thanh trong phiên đó. OpenClaw hiện phơi bày các
    id giọng Realtime tích hợp sẵn dưới dạng chuỗi.
    </Note>

    <Note>
    Control UI Talk dùng các phiên realtime trên trình duyệt OpenAI với client
    secret tạm thời do Gateway phát hành và trao đổi SDP WebRTC trực tiếp từ trình duyệt với
    OpenAI Realtime API. Khi không cấu hình khóa API OpenAI trực tiếp,
    Gateway có thể phát hành client secret đó bằng hồ sơ OAuth `openai-codex`
    đã chọn. Gateway relay và các cầu nối WebSocket realtime backend Voice Call dùng
    cùng phương án OAuth dự phòng cho các endpoint OpenAI gốc. Xác minh trực tiếp
    cho maintainer có sẵn với
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    các nhánh OpenAI xác minh cả cầu nối WebSocket backend và trao đổi SDP WebRTC
    của trình duyệt mà không ghi log bí mật.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Nhà cung cấp `openai` đi kèm có thể nhắm đến một tài nguyên Azure OpenAI để tạo
ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo ảnh, OpenClaw
phát hiện hostname Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
dạng yêu cầu của Azure.

<Note>
Giọng nói realtime dùng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Realtime
voice** trong [Giọng nói và lời nói](#voice-and-speech) để biết các thiết lập Azure
của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có đăng ký, hạn mức hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần lưu trú dữ liệu theo vùng hoặc các kiểm soát tuân thủ mà Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo ảnh qua Azure bằng nhà cung cấp `openai` đi kèm, trỏ
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

OpenClaw nhận diện các hậu tố host Azure này cho tuyến tạo ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Với các yêu cầu tạo ảnh trên host Azure được nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng đường dẫn theo phạm vi triển khai (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào từng yêu cầu
- Dùng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ dạng yêu cầu ảnh
OpenAI tiêu chuẩn.

<Note>
Định tuyến Azure cho đường dẫn tạo ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xử lý mọi
`openai.baseUrl` tùy chỉnh như endpoint OpenAI công khai và sẽ thất bại với các
triển khai ảnh Azure.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ thể
cho đường dẫn tạo ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Mặc định là `2024-12-01-preview` khi biến chưa được đặt.

### Tên model là tên triển khai

Azure OpenAI gắn model với deployment. Với các yêu cầu tạo ảnh Azure
được định tuyến qua nhà cung cấp `openai` đi kèm, trường `model` trong OpenClaw
phải là **tên triển khai Azure** bạn đã cấu hình trong cổng Azure, không phải
id model OpenAI công khai.

Nếu bạn tạo một deployment tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên triển khai tương tự áp dụng cho các lệnh gọi tạo ảnh được định tuyến qua
nhà cung cấp `openai` đi kèm.

### Tính khả dụng theo vùng

Tạo ảnh Azure hiện chỉ có sẵn ở một số vùng
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Kiểm tra danh sách vùng hiện tại của Microsoft trước khi tạo
deployment, và xác nhận model cụ thể được cung cấp trong vùng của bạn.

### Khác biệt tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
giá trị `background` trên `gpt-image-2`) hoặc chỉ phơi bày chúng trên các phiên bản
model cụ thể. Những khác biệt này đến từ Azure và model bên dưới, không phải
OpenClaw. Nếu một yêu cầu Azure thất bại với lỗi xác thực hợp lệ, hãy kiểm tra
bộ tham số được hỗ trợ bởi deployment và phiên bản API cụ thể của bạn trong
cổng Azure.

<Note>
Azure OpenAI sử dụng transport native và hành vi tương thích nhưng không nhận
các header ghi nhận nguồn ẩn của OpenClaw — xem accordion **Tuyến native so với
tuyến tương thích OpenAI** trong [Cấu hình nâng cao](#advanced-configuration).

Đối với lưu lượng chat hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy dùng
luồng onboarding hoặc cấu hình nhà cung cấp Azure chuyên dụng — chỉ riêng
`openai.baseUrl` không áp dụng hình dạng API/xác thực của Azure. Có một nhà cung cấp
`azure-openai-responses/*` riêng; xem accordion Compaction phía máy chủ bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Transport (WebSocket so với SSE)">
    OpenClaw ưu tiên WebSocket và fallback sang SSE (`"auto"`) cho `openai/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi fallback sang SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian hạ nhiệt
    - Gắn các header định danh phiên và lượt ổn định cho việc thử lại và kết nối lại
    - Chuẩn hóa bộ đếm mức sử dụng (`input_tokens` / `prompt_tokens`) giữa các biến thể transport

    | Giá trị | Hành vi |
    |-------|----------|
    | `"auto"` (mặc định) | WebSocket trước, fallback sang SSE |
    | `"sse"` | Chỉ ép dùng SSE |
    | `"websocket"` | Chỉ ép dùng WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

  <Accordion title="Chế độ nhanh">
    OpenClaw cung cấp một công tắc chế độ nhanh dùng chung cho `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không ghi lại `reasoning` hoặc `text.verbosity`.

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
    Ghi đè phiên thắng cấu hình. Xóa ghi đè phiên trong giao diện Sessions sẽ đưa phiên trở về mặc định đã cấu hình.
    </Note>

  </Accordion>

  <Accordion title="Xử lý ưu tiên (service_tier)">
    API của OpenAI cung cấp xử lý ưu tiên qua `service_tier`. Đặt theo từng model trong OpenClaw:

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
    `serviceTier` chỉ được chuyển tiếp tới endpoint OpenAI native (`api.openai.com`) và endpoint Codex native (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai nhà cung cấp qua proxy, OpenClaw giữ nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Đối với các model OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao stream Pi-harness của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Ép `store: true` (trừ khi khả năng tương thích của model đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không khả dụng)

    Điều này áp dụng cho đường dẫn Pi harness tích hợp sẵn và các hook nhà cung cấp OpenAI được dùng bởi các lần chạy nhúng. Harness máy chủ ứng dụng Codex native tự quản lý ngữ cảnh qua Codex và được cấu hình bởi tuyến agent mặc định của OpenAI hoặc chính sách runtime của nhà cung cấp/model.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các model OpenAI Responses trực tiếp vẫn ép `store: true` trừ khi khả năng tương thích đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT strict-agentic">
    Đối với các lần chạy thuộc họ GPT-5 trên `openai/*`, OpenClaw có thể dùng một hợp đồng thực thi nhúng nghiêm ngặt hơn:

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
    - Không còn coi một lượt chỉ có kế hoạch là tiến triển thành công khi có sẵn hành động công cụ
    - Thử lại lượt với định hướng hành động ngay
    - Tự động bật `update_plan` cho công việc đáng kể
    - Hiển thị trạng thái bị chặn rõ ràng nếu model tiếp tục lập kế hoạch mà không hành động

    <Note>
    Chỉ giới hạn cho các lần chạy họ GPT-5 của OpenAI và Codex. Các nhà cung cấp khác và họ model cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến native so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI, Codex và Azure OpenAI trực tiếp khác với proxy `/v1` tương thích OpenAI chung:

    **Tuyến native** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các model hỗ trợ effort `none` của OpenAI
    - Bỏ qua reasoning bị tắt cho các model hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định schema công cụ ở chế độ strict
    - Chỉ gắn header ghi nhận nguồn ẩn trên các host native đã xác minh
    - Giữ định hình request chỉ dành cho OpenAI (`service_tier`, `store`, tương thích reasoning, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Dùng hành vi tương thích lỏng hơn
    - Loại bỏ Completions `store` khỏi payload `openai-completions` không native
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho proxy Completions tương thích OpenAI như vLLM
    - Không ép schema công cụ strict hoặc header chỉ dành cho native

    Azure OpenAI sử dụng transport native và hành vi tương thích nhưng không nhận các header ghi nhận nguồn ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu model và hành vi failover.
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
