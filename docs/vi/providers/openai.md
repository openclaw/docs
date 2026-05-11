---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn dùng xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi tác nhân GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng tác tử lập trình theo gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw giữ các bề mặt này tách biệt để cấu hình luôn dễ dự đoán.

OpenClaw dùng `openai/*` làm tuyến mô hình OpenAI chuẩn. Các lượt tác tử nhúng trên mô hình OpenAI chạy qua runtime app-server Codex gốc theo mặc định; xác thực bằng khóa API OpenAI trực tiếp vẫn có sẵn cho các bề mặt OpenAI không phải tác tử như hình ảnh, embeddings, giọng nói và realtime.

- **Mô hình tác tử** - các mô hình `openai/*` thông qua runtime Codex; đăng nhập bằng xác thực Codex để dùng gói đăng ký ChatGPT/Codex, hoặc cấu hình một bản dự phòng khóa API OpenAI tương thích với Codex khi bạn chủ ý muốn xác thực bằng khóa API.
- **API OpenAI không phải tác tử** - truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng thông qua `OPENAI_API_KEY` hoặc onboarding khóa API OpenAI.
- **Cấu hình cũ** - các tham chiếu mô hình `openai-codex/*` được sửa bởi `openclaw doctor --fix` thành `openai/*` cộng với runtime Codex.

OpenAI hỗ trợ rõ ràng việc dùng OAuth theo gói đăng ký trong các công cụ và workflow bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó đang bị trộn lẫn với nhau, hãy đọc [Runtime tác tử](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                             | Dùng                                                     | Ghi chú                                                               |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-5.5`                                         | Thiết lập tác tử OpenAI mặc định. Đăng nhập bằng xác thực Codex.      |
| Tính phí khóa API trực tiếp cho mô hình tác tử       | `openai/gpt-5.5` cộng với hồ sơ khóa API tương thích Codex | Dùng `auth.order.openai` để đặt bản dự phòng sau xác thực gói đăng ký. |
| Tính phí khóa API trực tiếp qua PI rõ ràng           | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `pi` | Chọn một hồ sơ khóa API `openai` thông thường.                        |
| Bí danh API ChatGPT Instant mới nhất                 | `openai/chat-latest`                                     | Chỉ dùng khóa API trực tiếp. Bí danh di động cho thử nghiệm, không phải mặc định. |
| Xác thực gói đăng ký ChatGPT/Codex qua PI rõ ràng    | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `pi` | Chọn một hồ sơ xác thực `openai-codex` cho tuyến tương thích.         |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                                     | Hoạt động với `OPENAI_API_KEY` hoặc OAuth OpenAI Codex.               |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                                   | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`. |

## Bản đồ tên gọi

Các tên tương tự nhau nhưng không thể thay thế cho nhau:

| Tên bạn thấy                            | Lớp                        | Ý nghĩa                                                                                                              |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Tiền tố nhà cung cấp       | Tuyến mô hình OpenAI chuẩn; các lượt tác tử dùng runtime Codex.                                                      |
| `openai-codex`                          | Tiền tố xác thực/hồ sơ cũ  | Namespace hồ sơ OAuth/gói đăng ký OpenAI Codex cũ hơn. Các hồ sơ hiện có và `auth.order.openai-codex` vẫn hoạt động. |
| Plugin `codex`                          | Plugin                     | Plugin OpenClaw đi kèm cung cấp runtime app-server Codex gốc và điều khiển chat `/codex`.                           |
| provider/model `agentRuntime.id: codex` | Runtime tác tử             | Buộc dùng harness app-server Codex gốc cho các lượt nhúng khớp.                                                      |
| `/codex ...`                            | Bộ lệnh chat               | Ràng buộc/điều khiển các luồng app-server Codex từ một cuộc hội thoại.                                               |
| `runtime: "acp", agentId: "codex"`      | Tuyến phiên ACP            | Đường dự phòng rõ ràng chạy Codex thông qua ACP/acpx.                                                                |

Điều này có nghĩa là một cấu hình có thể chủ ý chứa các tham chiếu mô hình `openai/*` trong khi các hồ sơ xác thực vẫn trỏ đến thông tin xác thực tương thích với Codex. Ưu tiên `auth.order.openai` cho cấu hình mới; các hồ sơ `openai-codex:*` hiện có và `auth.order.openai-codex` vẫn được hỗ trợ. `openclaw doctor --fix` ghi lại các tham chiếu mô hình cũ `openai-codex/*` sang tuyến mô hình OpenAI chuẩn.

<Note>
GPT-5.5 có sẵn thông qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến gói đăng ký/OAuth. Với gói đăng ký ChatGPT/Codex cộng với thực thi Codex gốc, dùng `openai/gpt-5.5`; cấu hình runtime không đặt giờ sẽ chọn harness Codex cho các lượt tác tử OpenAI. Chỉ dùng hồ sơ khóa API OpenAI khi bạn muốn xác thực bằng khóa API trực tiếp cho một mô hình tác tử OpenAI.
</Note>

<Note>
Các lượt mô hình tác tử OpenAI yêu cầu Plugin app-server Codex đi kèm. Cấu hình runtime PI rõ ràng vẫn có sẵn như một tuyến tương thích tùy chọn. Khi PI được chọn rõ ràng với một hồ sơ xác thực `openai-codex`, OpenClaw giữ tham chiếu mô hình công khai là `openai/*` và định tuyến PI nội bộ thông qua transport xác thực Codex cũ. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình `openai-codex/*` lỗi thời hoặc các ghim phiên PI cũ không đến từ cấu hình runtime rõ ràng.
</Note>

## Phạm vi tính năng OpenClaw

| Năng lực OpenAI          | Bề mặt OpenClaw                                                                 | Trạng thái                                              |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses          | Nhà cung cấp mô hình `openai/<model>`                                            | Có                                                     |
| Mô hình gói đăng ký Codex | `openai/<model>` với OAuth `openai-codex`                                        | Có                                                     |
| Tham chiếu mô hình Codex cũ | `openai-codex/<model>`                                                         | Được doctor sửa thành `openai/<model>`                 |
| Harness app-server Codex  | `openai/<model>` với runtime bị bỏ qua hoặc provider/model `agentRuntime.id: codex` | Có                                                  |
| Tìm kiếm web phía server  | Công cụ OpenAI Responses gốc                                                     | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp |
| Hình ảnh                  | `image_generate`                                                                 | Có                                                     |
| Video                     | `video_generate`                                                                 | Có                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`                                  | Có                                                     |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu media                                  | Có                                                     |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "openai"`                       | Có                                                     |
| Giọng nói realtime        | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Có                                                     |
| Embeddings                | Nhà cung cấp embedding bộ nhớ                                                    | Có                                                     |

## Embeddings bộ nhớ

OpenClaw có thể dùng OpenAI, hoặc một endpoint embedding tương thích OpenAI, cho việc lập chỉ mục `memory_search` và embeddings truy vấn:

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

Với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, đặt `queryInputType` và `documentInputType` bên dưới `memorySearch`. OpenClaw chuyển tiếp chúng dưới dạng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp: embeddings truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng `documentInputType`. Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để biết ví dụ đầy đủ.

## Bắt đầu

Chọn phương thức xác thực bạn ưu tiên và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API (OpenAI Platform)">
    **Phù hợp nhất cho:** truy cập API trực tiếp và tính phí theo mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo hoặc sao chép một khóa API từ [bảng điều khiển OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Tham chiếu mô hình     | Cấu hình runtime           | Tuyến                       | Xác thực         |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | bị bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | Hồ sơ OpenAI tương thích Codex |
    | `openai/gpt-5.4-mini` | bị bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | Hồ sơ OpenAI tương thích Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Runtime nhúng PI         | Hồ sơ `openai` hoặc hồ sơ `openai-codex` đã chọn |

    <Note>
    Các mô hình tác tử `openai/*` dùng harness app-server Codex. Để dùng xác thực khóa API cho một mô hình tác tử, tạo một hồ sơ khóa API tương thích Codex và sắp thứ tự nó bằng `auth.order.openai`; `OPENAI_API_KEY` vẫn là dự phòng trực tiếp cho các bề mặt API OpenAI không phải tác tử. Các mục `auth.order.openai-codex` cũ hơn vẫn hoạt động.
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

    `chat-latest` là một bí danh di động. OpenAI mô tả nó là mô hình Instant mới nhất được dùng trong ChatGPT và khuyến nghị `gpt-5.5` cho việc dùng API sản xuất, vì vậy hãy giữ `openai/gpt-5.5` làm mặc định ổn định trừ khi bạn chủ ý muốn hành vi của bí danh đó. Bí danh hiện chỉ chấp nhận độ dài văn bản `medium`, nên OpenClaw chuẩn hóa các override độ dài văn bản OpenAI không tương thích cho mô hình này.

    <Warning>
    OpenClaw **không** cung cấp `openai/gpt-5.3-codex-spark`. Các yêu cầu OpenAI API trực tiếp từ chối mô hình đó, và catalog Codex hiện tại cũng không cung cấp nó.
    </Warning>

  </Tab>

  <Tab title="Đăng ký Codex">
    **Phù hợp nhất cho:** sử dụng gói đăng ký ChatGPT/Codex của bạn với cách thực thi app-server Codex gốc thay vì một API key riêng. Đám mây Codex yêu cầu đăng nhập ChatGPT.

    <Steps>
      <Step title="Chạy Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Hoặc chạy OAuth trực tiếp:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Với các thiết lập headless hoặc không thuận lợi cho callback, hãy thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Dùng tuyến model OpenAI chuẩn">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Đường dẫn mặc định không yêu cầu cấu hình runtime. Các lượt tác nhân OpenAI
        tự động chọn runtime app-server Codex gốc, và OpenClaw
        cài đặt hoặc sửa chữa plugin Codex đi kèm khi tuyến này được chọn.
      </Step>
      <Step title="Xác minh Codex auth khả dụng">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Sau khi gateway đang chạy, hãy gửi `/codex status` hoặc `/codex models`
        trong chat để xác minh runtime app-server gốc.
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu model | Cấu hình runtime | Tuyến | Xác thực |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | bỏ qua / provider/model `agentRuntime.id: "codex"` | Bộ harness app-server Codex gốc | Đăng nhập Codex hoặc hồ sơ xác thực `openai` theo thứ tự |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime nhúng PI với transport Codex-auth nội bộ | Hồ sơ `openai-codex` đã chọn |
    | `openai-codex/gpt-5.5` | được doctor sửa chữa | Tuyến cũ được viết lại thành `openai/gpt-5.5` | Hồ sơ `openai-codex` hiện có |

    <Warning>
    Không cấu hình các tham chiếu model `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` hoặc
    `openai-codex/gpt-5.3*` cũ hơn. Tài khoản ChatGPT/Codex OAuth hiện từ chối
    các model đó. Hãy dùng `openai/gpt-5.5`; các lượt tác nhân OpenAI hiện chọn
    runtime Codex theo mặc định.
    </Warning>

    <Note>
    Tiền tố model `openai-codex/*` là cấu hình cũ được doctor sửa chữa. Với
    thiết lập đăng ký phổ biến kèm runtime gốc, hãy đăng nhập bằng Codex auth
    nhưng giữ tham chiếu model là `openai/gpt-5.5`. Cấu hình mới nên đặt thứ tự
    auth của tác nhân OpenAI dưới `auth.order.openai`; các mục
    `auth.order.openai-codex` cũ hơn vẫn hợp lệ.
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

    Với API-key dự phòng, hãy giữ model ở `openai/gpt-5.5` và đặt thứ tự
    auth dưới `openai`. OpenClaw sẽ thử gói đăng ký trước, sau đó
    API key, đồng thời vẫn ở trên harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding không còn nhập vật liệu OAuth từ `~/.codex`. Hãy đăng nhập bằng OAuth trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin đăng nhập thu được trong kho auth tác nhân riêng của nó.
    </Note>

    ### Kiểm tra và khôi phục định tuyến Codex OAuth

    Dùng các lệnh này để xem model, runtime và tuyến auth nào mà tác nhân mặc định
    của bạn đang sử dụng:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Với một tác nhân cụ thể, hãy thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Nếu cấu hình cũ hơn vẫn có `openai-codex/gpt-*` hoặc một ghim phiên OpenAI PI
    lỗi thời mà không có cấu hình runtime rõ ràng, hãy sửa chữa nó:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai-codex` không hiển thị hồ sơ khả dụng nào, hãy
    đăng nhập lại:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` là tuyến model cho các lượt tác nhân OpenAI thông qua Codex. Id
    nhà cung cấp auth/hồ sơ `openai-codex` vẫn được chấp nhận cho các
    hồ sơ hiện có và danh sách CLI.

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị runtime model nào đang hoạt động cho phiên hiện tại.
    Harness app-server Codex đi kèm xuất hiện dưới dạng `Runtime: OpenAI Codex` cho
    các lượt model tác nhân OpenAI. Các ghim phiên PI lỗi thời được sửa chữa thành Codex trừ khi
    cấu hình ghim PI rõ ràng.

    ### Cảnh báo doctor

    Nếu các tuyến `openai-codex/*` hoặc ghim OpenAI PI lỗi thời vẫn còn trong cấu hình hoặc
    trạng thái phiên, `openclaw doctor --fix` sẽ viết lại chúng thành `openai/*` với
    runtime Codex trừ khi PI được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xử lý metadata model và giới hạn ngữ cảnh runtime như các giá trị riêng biệt.

    Với `openai/gpt-5.5` thông qua catalog Codex OAuth:

    - `contextWindow` gốc: `1000000`
    - Giới hạn `contextTokens` runtime mặc định: `272000`

    Giới hạn mặc định nhỏ hơn có đặc tính độ trễ và chất lượng tốt hơn trong thực tế. Ghi đè nó bằng `contextTokens`:

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
    Dùng `contextWindow` để khai báo metadata model gốc. Dùng `contextTokens` để giới hạn ngân sách ngữ cảnh runtime.
    </Note>

    ### Khôi phục catalog

    OpenClaw dùng metadata catalog Codex upstream cho `gpt-5.5` khi nó
    có mặt. Nếu quá trình khám phá Codex trực tiếp bỏ qua hàng `gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng model OAuth đó để
    cron, tác nhân phụ và các lượt chạy default-model đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Harness app-server Codex gốc dùng các tham chiếu model `openai/*` kèm cấu hình
runtime bị bỏ qua hoặc provider/model `agentRuntime.id: "codex"`, nhưng auth của nó
vẫn dựa trên tài khoản. OpenClaw chọn auth theo thứ tự này:

1. Các hồ sơ auth OpenAI theo thứ tự cho tác nhân, ưu tiên dưới
   `auth.order.openai`. Các hồ sơ `openai-codex:*` hiện có và
   `auth.order.openai-codex` vẫn hợp lệ cho bản cài đặt cũ hơn.
2. Tài khoản hiện có của app-server, chẳng hạn như đăng nhập ChatGPT bằng Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, sau đó
   `OPENAI_API_KEY`, khi app-server báo cáo không có tài khoản và vẫn yêu cầu
   OpenAI auth.

Điều đó có nghĩa là đăng nhập đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình gateway cũng có `OPENAI_API_KEY` cho các model OpenAI trực tiếp
hoặc embeddings. Dự phòng API-key qua env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi đến các kết nối app-server WebSocket. Khi một hồ sơ Codex
kiểu đăng ký được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
khỏi tiến trình con app-server stdio được tạo và gửi thông tin đăng nhập đã chọn
thông qua RPC đăng nhập app-server. Khi hồ sơ đăng ký đó bị chặn bởi một
giới hạn sử dụng Codex, OpenClaw có thể xoay sang hồ sơ API-key `openai:*`
theo thứ tự tiếp theo mà không thay đổi model đã chọn hoặc rời khỏi
harness Codex. Sau khi thời gian đặt lại đăng ký trôi qua, hồ sơ đăng ký
lại đủ điều kiện.

## Tạo hình ảnh

Plugin `openai` đi kèm đăng ký tạo hình ảnh thông qua công cụ `image_generate`.
Nó hỗ trợ cả tạo hình ảnh bằng OpenAI API-key và tạo hình ảnh bằng Codex OAuth
thông qua cùng tham chiếu model `openai/gpt-image-2`.

| Khả năng                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Tham chiếu model                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                      | `OPENAI_API_KEY`                   | Đăng nhập OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Số hình ảnh tối đa mỗi yêu cầu    | 4                                  | 4                                    |
| Chế độ chỉnh sửa                 | Đã bật (tối đa 5 hình ảnh tham chiếu) | Đã bật (tối đa 5 hình ảnh tham chiếu)   |
| Ghi đè kích thước            | Được hỗ trợ, bao gồm kích thước 2K/4K   | Được hỗ trợ, bao gồm kích thước 2K/4K     |
| Tỷ lệ khung hình / độ phân giải | Không chuyển tiếp đến OpenAI Images API | Được ánh xạ tới kích thước được hỗ trợ khi an toàn |

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
`gpt-image-1.5`, `gpt-image-1` và `gpt-image-1-mini` vẫn có thể dùng như
các ghi đè model rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra
PNG/WebP nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Với yêu cầu nền trong suốt, tác nhân nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ hơn
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và
OpenAI Codex OAuth bằng cách viết lại các yêu cầu trong suốt mặc định
`openai/gpt-image-2` thành `gpt-image-1.5`; Azure và các endpoint tương thích OpenAI
tùy chỉnh giữ nguyên tên deployment/model đã cấu hình của chúng.

Thiết lập tương tự được cung cấp cho các lượt chạy CLI headless:

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
`--openai-background` vẫn khả dụng dưới dạng alias riêng cho OpenAI.

Với các bản cài đặt Codex OAuth, hãy giữ cùng tham chiếu `openai/gpt-image-2`. Khi một
hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw phân giải OAuth
access token đã lưu đó và gửi yêu cầu hình ảnh qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển về một API key cho
yêu cầu đó. Hãy cấu hình `models.providers.openai` rõ ràng bằng API key,
URL cơ sở tùy chỉnh hoặc endpoint Azure khi bạn muốn tuyến OpenAI Images API
trực tiếp thay thế.
Nếu endpoint hình ảnh tùy chỉnh đó nằm trên LAN/địa chỉ riêng đáng tin cậy, cũng đặt
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw giữ
các endpoint hình ảnh tương thích OpenAI riêng tư/nội bộ bị chặn trừ khi lựa chọn tham gia này
có mặt.

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

Plugin `openai` được đóng gói kèm đăng ký tạo video thông qua công cụ `video_generate`.

| Khả năng         | Giá trị                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Mô hình mặc định | `openai/sora-2`                                                                   |
| Chế độ           | Văn bản-thành-video, hình ảnh-thành-video, chỉnh sửa một video                    |
| Đầu vào tham chiếu | 1 hình ảnh hoặc 1 video                                                         |
| Ghi đè kích thước | Được hỗ trợ                                                                      |
| Ghi đè khác      | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Đóng góp lời nhắc GPT-5

OpenClaw thêm một đóng góp lời nhắc GPT-5 dùng chung cho các lượt chạy thuộc họ GPT-5 trên nhiều nhà cung cấp. Nó áp dụng theo mã định danh mô hình, nên `openai/gpt-5.5`, các tham chiếu cũ trước khi sửa chữa như `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, và các tham chiếu GPT-5 tương thích khác đều nhận cùng một lớp phủ. Các mô hình GPT-4.x cũ hơn thì không.

Bộ khai thác Codex gốc được đóng gói kèm sử dụng cùng hành vi GPT-5 và lớp phủ Heartbeat thông qua chỉ dẫn dành cho nhà phát triển của máy chủ ứng dụng Codex, nên các phiên `openai/gpt-5.x` được định tuyến qua Codex vẫn giữ cùng hướng dẫn theo đến cùng và Heartbeat chủ động, dù Codex sở hữu phần còn lại của lời nhắc bộ khai thác.

Đóng góp GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho việc duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh. Hành vi trả lời theo kênh và tin nhắn im lặng vẫn nằm trong lời nhắc hệ thống OpenClaw dùng chung và chính sách gửi đi. Hướng dẫn GPT-5 luôn được bật cho các mô hình khớp. Lớp kiểu tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị                | Hiệu ứng                                  |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp kiểu tương tác thân thiện         |
| `"on"`                 | Bí danh cho `"friendly"`                  |
| `"off"`                | Chỉ tắt lớp kiểu thân thiện               |

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
Giá trị không phân biệt chữ hoa chữ thường khi chạy, nên cả `"Off"` và `"off"` đều tắt lớp kiểu thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` kế thừa vẫn được đọc như một phương án dự phòng tương thích khi thiết lập dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin `openai` được đóng gói kèm đăng ký tổng hợp lời nói cho bề mặt `messages.tts`.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.voice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Phần thân bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các mô hình có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, vì vậy hãy dùng nó cho các điểm cuối tương thích OpenAI cần khóa bổ sung như `lang`. Các khóa prototype bị bỏ qua.

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
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng đến điểm cuối API trò chuyện. OpenAI TTS vẫn được cấu hình thông qua khóa API; để phản hồi thoại trực tiếp chỉ dùng OAuth, hãy dùng đường dẫn giọng nói Realtime thay vì lời nói STT -> TTS ở chế độ agent.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` được đóng gói kèm đăng ký chuyển lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu nội dung đa phương tiện của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Điểm cuối: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đầu vào sử dụng
      `tools.media.audio`, bao gồm các đoạn kênh thoại Discord và tệp đính kèm
      âm thanh của kênh

    Để ép dùng OpenAI cho phiên âm âm thanh đầu vào:

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

    Gợi ý ngôn ngữ và lời nhắc được chuyển tiếp đến OpenAI khi được cung cấp bởi
    cấu hình đa phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lệnh gọi.

  </Accordion>

  <Accordion title="Phiên âm thời gian thực">
    Plugin `openai` đi kèm đăng ký tính năng phiên âm thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Lời nhắc | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai-codex` | Khóa API kết nối trực tiếp; OAuth phát hành bí mật máy khách phiên âm Realtime |

    <Note>
    Sử dụng kết nối WebSocket tới `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Khi chỉ cấu hình OAuth `openai-codex`, Gateway phát hành một bí mật máy khách phiên âm Realtime tạm thời trước khi mở WebSocket. Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm thời gian thực của Voice Call; giọng nói Discord hiện ghi các đoạn ngắn rồi dùng đường dẫn phiên âm hàng loạt `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói thời gian thực">
    Plugin `openai` đi kèm đăng ký giọng nói thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Giọng nói | `...openai.voice` | `alloy` |
    | Nhiệt độ (cầu nối triển khai Azure) | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Phần đệm tiền tố | `...openai.prefixPaddingMs` | `300` |
    | Mức nỗ lực suy luận | `...openai.reasoningEffort` | (chưa đặt) |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai-codex` | Browser Talk và các cầu nối backend không phải Azure có thể dùng OAuth Codex |

    Các giọng Realtime tích hợp sẵn có cho `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI khuyến nghị `marin` và `cedar` để có chất lượng Realtime tốt nhất. Đây
    là một tập riêng biệt với các giọng Chuyển văn bản thành giọng nói ở trên; đừng giả định một giọng TTS
    như `fable`, `nova`, hoặc `onyx` là hợp lệ cho các phiên Realtime.

    <Note>
    Các cầu nối realtime backend OpenAI dùng dạng phiên WebSocket Realtime GA, vốn không chấp nhận `session.temperature`. Các triển khai Azure OpenAI vẫn khả dụng qua `azureEndpoint` và `azureDeployment` và giữ dạng phiên tương thích với triển khai. Hỗ trợ gọi công cụ hai chiều và âm thanh G.711 u-law.
    </Note>

    <Note>
    Giọng nói Realtime được chọn khi phiên được tạo. OpenAI cho phép hầu hết
    các trường phiên thay đổi sau đó, nhưng không thể thay đổi giọng nói sau khi
    mô hình đã phát ra âm thanh trong phiên đó. OpenClaw hiện để lộ các
    mã định danh giọng Realtime tích hợp sẵn dưới dạng chuỗi.
    </Note>

    <Note>
    Control UI Talk dùng các phiên realtime trình duyệt OpenAI với một bí mật
    máy khách tạm thời do Gateway phát hành và trao đổi SDP WebRTC trực tiếp từ trình duyệt với
    OpenAI Realtime API. Khi không cấu hình khóa API OpenAI trực tiếp,
    Gateway có thể phát hành bí mật máy khách đó bằng hồ sơ OAuth `openai-codex`
    đã chọn. Chuyển tiếp Gateway và các cầu nối WebSocket realtime backend Voice Call dùng
    cùng phương án dự phòng OAuth cho các endpoint OpenAI gốc. Có thể xác minh trực tiếp bởi maintainer với
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    các nhánh OpenAI xác minh cả cầu nối WebSocket backend và trao đổi SDP WebRTC
    của trình duyệt mà không ghi nhật ký bí mật.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Nhà cung cấp `openai` đi kèm có thể nhắm tới một tài nguyên Azure OpenAI để tạo
hình ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo hình ảnh, OpenClaw
phát hiện tên máy chủ Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
dạng yêu cầu của Azure.

<Note>
Giọng nói thời gian thực dùng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Giọng nói
thời gian thực** trong [Giọng nói và lời nói](#voice-and-speech) để biết các
cài đặt Azure của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có gói đăng ký, hạn mức, hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần vùng lưu trú dữ liệu theo khu vực hoặc các kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo hình ảnh Azure thông qua nhà cung cấp `openai` đi kèm, trỏ
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

OpenClaw nhận dạng các hậu tố máy chủ Azure này cho tuyến tạo hình ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Đối với các yêu cầu tạo hình ảnh trên một máy chủ Azure được nhận dạng, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng các đường dẫn theo phạm vi triển khai (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào mỗi yêu cầu
- Dùng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo hình ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ dạng
yêu cầu hình ảnh OpenAI tiêu chuẩn.

<Note>
Định tuyến Azure cho đường dẫn tạo hình ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xử lý mọi
`openai.baseUrl` tùy chỉnh giống endpoint OpenAI công khai và sẽ thất bại với các
triển khai hình ảnh Azure.
</Note>

  ### Phiên bản API

  Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ thể
  cho đường dẫn tạo hình ảnh của Azure:

  ```bash
  export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
  ```

  Mặc định là `2024-12-01-preview` khi biến này chưa được đặt.

  ### Tên model là tên triển khai

  Azure OpenAI liên kết model với các triển khai. Đối với các yêu cầu tạo hình ảnh Azure
  được định tuyến qua nhà cung cấp `openai` đi kèm, trường `model` trong OpenClaw
  phải là **tên triển khai Azure** mà bạn đã cấu hình trong cổng Azure, không phải
  id model OpenAI công khai.

  Nếu bạn tạo một triển khai tên là `gpt-image-2-prod` phục vụ `gpt-image-2`:

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  Quy tắc dùng tên triển khai tương tự cũng áp dụng cho các lệnh gọi tạo hình ảnh được định tuyến qua
  nhà cung cấp `openai` đi kèm.

  ### Tình trạng khả dụng theo khu vực

  Tạo hình ảnh Azure hiện chỉ khả dụng ở một số khu vực
  (ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
  `uaenorth`). Hãy kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
  triển khai, và xác nhận model cụ thể được cung cấp trong khu vực của bạn.

  ### Khác biệt về tham số

  Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số hình ảnh.
  Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
  giá trị `background` nhất định trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản model
  cụ thể. Những khác biệt này đến từ Azure và model nền tảng, không phải
  OpenClaw. Nếu một yêu cầu Azure thất bại với lỗi xác thực, hãy kiểm tra
  tập tham số được hỗ trợ bởi triển khai và phiên bản API cụ thể của bạn trong
  cổng Azure.

  <Note>
  Azure OpenAI sử dụng transport gốc và hành vi tương thích nhưng không nhận
  các tiêu đề ghi nhận ẩn của OpenClaw — xem accordion **Tuyến gốc so với tuyến tương thích OpenAI**
  trong [Cấu hình nâng cao](#advanced-configuration).

  Đối với lưu lượng chat hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy dùng
  luồng onboarding hoặc một cấu hình nhà cung cấp Azure chuyên dụng — chỉ riêng `openai.baseUrl`
  không lấy được dạng API/auth của Azure. Có một nhà cung cấp
  `azure-openai-responses/*` riêng; xem accordion Compaction phía máy chủ bên dưới.
  </Note>

  ## Cấu hình nâng cao

  <AccordionGroup>
  <Accordion title="Transport (WebSocket so với SSE)">
    OpenClaw ưu tiên WebSocket và dự phòng SSE (`"auto"`) cho `openai/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm một lần trước khi chuyển sang SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian chờ nguội
    - Gắn các tiêu đề định danh phiên và lượt ổn định cho các lần thử lại và kết nối lại
    - Chuẩn hóa bộ đếm sử dụng (`input_tokens` / `prompt_tokens`) trên các biến thể transport

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
    OpenClaw cung cấp một nút bật/tắt chế độ nhanh dùng chung cho `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi được bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không viết lại `reasoning` hoặc `text.verbosity`.

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
    Ghi đè phiên được ưu tiên hơn cấu hình. Xóa ghi đè phiên trong giao diện Phiên sẽ đưa phiên về mặc định đã cấu hình.
    </Note>

  </Accordion>

  <Accordion title="Xử lý ưu tiên (service_tier)">
    API của OpenAI cung cấp xử lý ưu tiên qua `service_tier`. Đặt giá trị này cho từng mô hình trong OpenClaw:

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
    `serviceTier` chỉ được chuyển tiếp đến các endpoint OpenAI gốc (`api.openai.com`) và các endpoint Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai nhà cung cấp qua proxy, OpenClaw sẽ giữ nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc luồng Pi-harness của OpenAI plugin tự động bật Compaction phía máy chủ:

    - Bắt buộc `store: true` (trừ khi tương thích mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không có)

    Điều này áp dụng cho đường dẫn Pi harness tích hợp sẵn và các hook của nhà cung cấp OpenAI được dùng bởi các lần chạy nhúng. Harness máy chủ ứng dụng Codex gốc tự quản lý ngữ cảnh của nó thông qua Codex và được cấu hình bằng tuyến tác nhân mặc định của OpenAI hoặc chính sách runtime của nhà cung cấp/mô hình.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn bắt buộc `store: true` trừ khi tương thích đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT strict-agentic">
    Với các lần chạy họ GPT-5 trên `openai/*`, OpenClaw có thể dùng một hợp đồng thực thi nhúng nghiêm ngặt hơn:

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
    - Không còn xem một lượt chỉ lập kế hoạch là tiến triển thành công khi có sẵn hành động công cụ
    - Thử lại lượt đó với điều hướng hành động ngay
    - Tự động bật `update_plan` cho công việc đáng kể
    - Hiển thị trạng thái bị chặn rõ ràng nếu mô hình tiếp tục lập kế hoạch mà không hành động

    <Note>
    Chỉ áp dụng cho các lần chạy họ GPT-5 của OpenAI và Codex. Các nhà cung cấp khác và các họ mô hình cũ hơn vẫn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI trực tiếp, Codex và Azure OpenAI khác với các proxy `/v1` tương thích OpenAI chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ mức nỗ lực `none` của OpenAI
    - Bỏ qua suy luận đã tắt đối với các mô hình hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định dùng chế độ nghiêm ngặt cho lược đồ công cụ
    - Chỉ đính kèm các header ghi công ẩn trên các máy chủ gốc đã xác minh
    - Giữ định hình yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`, tương thích suy luận, gợi ý cache prompt)

    **Tuyến proxy/tương thích:**
    - Dùng hành vi tương thích thoáng hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không gốc
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI như vLLM
    - Không bắt buộc lược đồ công cụ nghiêm ngặt hoặc header chỉ dành cho tuyến gốc

    Azure OpenAI dùng truyền tải gốc và hành vi tương thích nhưng không nhận các header ghi công ẩn.

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
    Chi tiết xác thực và quy tắc tái sử dụng thông tin đăng nhập.
  </Card>
</CardGroup>
