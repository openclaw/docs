---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn dùng xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi nghiêm ngặt hơn cho tác tử GPT-5
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp các API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng tác tử lập trình theo gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw giữ các bề mặt đó tách biệt để cấu hình luôn dễ dự đoán.

OpenClaw dùng `openai/*` làm tuyến mô hình OpenAI chuẩn. Các lượt tác tử nhúng trên mô hình OpenAI mặc định chạy qua runtime app-server Codex gốc; xác thực bằng khóa API OpenAI trực tiếp vẫn có sẵn cho các bề mặt OpenAI không phải tác tử như hình ảnh, embedding, giọng nói và realtime.

- **Mô hình tác tử** - các mô hình `openai/*` thông qua runtime Codex; đăng nhập bằng xác thực `openai-codex` để dùng gói đăng ký ChatGPT/Codex, hoặc cấu hình một hồ sơ khóa API `openai-codex` khi bạn chủ đích muốn xác thực bằng khóa API.
- **API OpenAI không phải tác tử** - truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng thông qua `OPENAI_API_KEY` hoặc quy trình thiết lập khóa API OpenAI.
- **Cấu hình cũ** - các tham chiếu mô hình `openai-codex/*` được `openclaw doctor --fix` sửa thành `openai/*` cộng với runtime Codex.

OpenAI hỗ trợ rõ ràng việc dùng OAuth theo gói đăng ký trong các công cụ và workflow bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các tầng riêng biệt. Nếu các nhãn đó đang bị trộn lẫn với nhau, hãy đọc [Runtime tác tử](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                             | Dùng                                                    | Ghi chú                                                               |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-5.5`                                        | Thiết lập tác tử OpenAI mặc định. Đăng nhập bằng xác thực `openai-codex`. |
| Tính phí khóa API trực tiếp cho mô hình tác tử       | `openai/gpt-5.5` cộng với hồ sơ khóa API `openai-codex` | Dùng `auth.order.openai-codex` để ưu tiên hồ sơ đó.                   |
| Tính phí khóa API trực tiếp thông qua PI rõ ràng     | `openai/gpt-5.5` cộng với `agentRuntime.id: "pi"`       | Chọn một hồ sơ khóa API `openai` thông thường.                        |
| Alias API ChatGPT Instant mới nhất                   | `openai/chat-latest`                                    | Chỉ dùng khóa API trực tiếp. Alias thay đổi cho thử nghiệm, không phải mặc định. |
| Xác thực gói đăng ký ChatGPT/Codex qua PI rõ ràng    | `openai/gpt-5.5` cộng với `agentRuntime.id: "pi"`       | Chọn một hồ sơ xác thực `openai-codex` cho tuyến tương thích.         |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                                    | Hoạt động với `OPENAI_API_KEY` hoặc OAuth OpenAI Codex.               |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                                  | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`. |

## Bản đồ tên gọi

Các tên tương tự nhau nhưng không thể dùng thay thế cho nhau:

| Tên bạn thấy                       | Tầng                | Ý nghĩa                                                                                           |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Tiền tố nhà cung cấp | Tuyến mô hình OpenAI chuẩn; các lượt tác tử dùng runtime Codex.                                  |
| `openai-codex`                     | Tiền tố xác thực/hồ sơ | Nhà cung cấp hồ sơ xác thực OAuth/gói đăng ký OpenAI Codex.                                      |
| Plugin `codex`                     | Plugin              | Plugin OpenClaw đi kèm cung cấp runtime app-server Codex gốc và điều khiển chat `/codex`.        |
| `agentRuntime.id: codex`           | Runtime tác tử      | Buộc dùng harness app-server Codex gốc cho các lượt nhúng.                                      |
| `/codex ...`                       | Bộ lệnh chat        | Liên kết/điều khiển các luồng app-server Codex từ một cuộc trò chuyện.                          |
| `runtime: "acp", agentId: "codex"` | Tuyến phiên ACP     | Đường dự phòng rõ ràng chạy Codex thông qua ACP/acpx.                                            |

Điều này có nghĩa là một cấu hình có thể chủ đích chứa cả tham chiếu mô hình `openai/*` và hồ sơ xác thực `openai-codex`. `openclaw doctor --fix` viết lại các tham chiếu mô hình `openai-codex/*` cũ thành tuyến mô hình OpenAI chuẩn.

<Note>
GPT-5.5 có sẵn thông qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến gói đăng ký/OAuth. Với gói đăng ký ChatGPT/Codex cộng với thực thi Codex gốc, hãy dùng `openai/gpt-5.5`; cấu hình runtime chưa đặt giờ sẽ chọn harness Codex cho các lượt tác tử OpenAI. Chỉ dùng hồ sơ khóa API OpenAI khi bạn muốn xác thực bằng khóa API trực tiếp cho một mô hình tác tử OpenAI.
</Note>

<Note>
Các lượt mô hình tác tử OpenAI yêu cầu Plugin app-server Codex đi kèm. Cấu hình runtime PI rõ ràng vẫn có sẵn dưới dạng tuyến tương thích tùy chọn. Khi PI được chọn rõ ràng với một hồ sơ xác thực `openai-codex`, OpenClaw giữ tham chiếu mô hình công khai là `openai/*` và định tuyến PI nội bộ qua transport xác thực Codex cũ. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình `openai-codex/*` đã lỗi thời hoặc các ghim phiên PI cũ không đến từ cấu hình runtime rõ ràng.
</Note>

## Phạm vi tính năng OpenClaw

| Năng lực OpenAI           | Bề mặt OpenClaw                                                  | Trạng thái                                             |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Nhà cung cấp mô hình `openai/<model>`                             | Có                                                     |
| Mô hình gói đăng ký Codex | `openai/<model>` với OAuth `openai-codex`                         | Có                                                     |
| Tham chiếu mô hình Codex cũ | `openai-codex/<model>`                                          | Được doctor sửa thành `openai/<model>`                 |
| Harness app-server Codex  | `openai/<model>` với runtime bị bỏ qua hoặc `agentRuntime.id: codex` | Có                                                  |
| Tìm kiếm web phía máy chủ | Công cụ OpenAI Responses gốc                                      | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp |
| Hình ảnh                  | `image_generate`                                                  | Có                                                     |
| Video                     | `video_generate`                                                  | Có                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`                   | Có                                                     |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu media                  | Có                                                     |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "openai"`        | Có                                                     |
| Giọng nói realtime        | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Có                                                     |
| Embedding                 | Nhà cung cấp embedding bộ nhớ                                     | Có                                                     |

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

Với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, hãy đặt `queryInputType` và `documentInputType` dưới `memorySearch`. OpenClaw chuyển tiếp chúng dưới dạng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp: embedding truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng `documentInputType`. Xem [tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để có ví dụ đầy đủ.

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

    | Tham chiếu mô hình    | Cấu hình runtime           | Tuyến                       | Xác thực          |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | bị bỏ qua / `agentRuntime.id: "codex"` | Harness app-server Codex | hồ sơ `openai-codex` |
    | `openai/gpt-5.4-mini` | bị bỏ qua / `agentRuntime.id: "codex"` | Harness app-server Codex | hồ sơ `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | Runtime nhúng PI         | hồ sơ `openai` hoặc hồ sơ `openai-codex` đã chọn |

    <Note>
    Các mô hình tác tử `openai/*` dùng harness app-server Codex. Để dùng xác thực bằng khóa API cho một mô hình tác tử, hãy tạo hồ sơ khóa API `openai-codex` và sắp xếp thứ tự bằng `auth.order.openai-codex`; `OPENAI_API_KEY` vẫn là dự phòng trực tiếp cho các bề mặt API OpenAI không phải tác tử.
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

    `chat-latest` là một alias thay đổi. OpenAI mô tả nó là mô hình Instant mới nhất được dùng trong ChatGPT và khuyến nghị `gpt-5.5` cho việc dùng API production, vì vậy hãy giữ `openai/gpt-5.5` làm mặc định ổn định trừ khi bạn chủ đích muốn hành vi alias đó. Alias hiện chỉ chấp nhận độ chi tiết văn bản `medium`, vì vậy OpenClaw chuẩn hóa các override độ chi tiết văn bản OpenAI không tương thích cho mô hình này.

    <Warning>
    OpenClaw **không** cung cấp `openai/gpt-5.3-codex-spark`. Các yêu cầu OpenAI API live từ chối mô hình đó, và catalog Codex hiện tại cũng không cung cấp nó.
    </Warning>

  </Tab>

  <Tab title="Gói đăng ký Codex">
    **Phù hợp nhất cho:** dùng gói đăng ký ChatGPT/Codex của bạn với thực thi app-server Codex gốc thay vì một khóa API riêng. Codex cloud yêu cầu đăng nhập ChatGPT.

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
      <Step title="Dùng tuyến mô hình OpenAI chuẩn">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Không cần cấu hình runtime cho tuyến mặc định. Các lượt agent OpenAI
        tự động chọn runtime app-server Codex gốc, và OpenClaw
        cài đặt hoặc sửa Plugin Codex đi kèm khi tuyến này được chọn.
      </Step>
      <Step title="Xác minh xác thực Codex khả dụng">
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
    | `openai/gpt-5.5` | bỏ qua / `agentRuntime.id: "codex"` | Bộ chạy app-server Codex gốc | Đăng nhập Codex hoặc hồ sơ `openai-codex` đã chọn |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Runtime nhúng PI với transport xác thực Codex nội bộ | Hồ sơ `openai-codex` đã chọn |
    | `openai-codex/gpt-5.5` | được doctor sửa | Tuyến cũ được viết lại thành `openai/gpt-5.5` | Hồ sơ `openai-codex` hiện có |

    <Warning>
    Không cấu hình các tham chiếu model cũ hơn `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, hoặc
    `openai-codex/gpt-5.3*`. Tài khoản OAuth ChatGPT/Codex hiện từ chối
    các model đó. Hãy dùng `openai/gpt-5.5`; các lượt agent OpenAI hiện chọn runtime Codex
    theo mặc định.
    </Warning>

    <Note>
    Tiếp tục dùng id provider `openai-codex` cho các lệnh xác thực/hồ sơ. Tiền tố model
    `openai-codex/*` là cấu hình cũ được doctor sửa. Với thiết lập phổ biến gồm gói đăng ký và runtime gốc, hãy đăng nhập bằng `openai-codex`
    nhưng giữ tham chiếu model là `openai/gpt-5.5`.
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

    <Note>
    Onboarding không còn nhập vật liệu OAuth từ `~/.codex`. Đăng nhập bằng OAuth trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin xác thực thu được trong kho xác thực agent riêng.
    </Note>

    ### Kiểm tra và khôi phục định tuyến OAuth Codex

    Dùng các lệnh này để xem model, runtime và tuyến xác thực mà agent mặc định của bạn
    đang dùng:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Với một agent cụ thể, thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Nếu một cấu hình cũ hơn vẫn có `openai-codex/gpt-*` hoặc ghim phiên OpenAI PI
    đã lỗi thời mà không có cấu hình runtime rõ ràng, hãy sửa nó:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai-codex` không hiển thị hồ sơ dùng được, hãy đăng nhập
    lại:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` vẫn là id provider xác thực/hồ sơ. `openai/*` là
    tuyến model cho các lượt agent OpenAI thông qua Codex.

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị runtime model nào đang hoạt động cho phiên hiện tại.
    Bộ chạy app-server Codex đi kèm xuất hiện là `Runtime: OpenAI Codex` cho
    các lượt model agent OpenAI. Các ghim phiên PI đã lỗi thời được sửa sang Codex trừ khi
    cấu hình ghim PI rõ ràng.

    ### Cảnh báo doctor

    Nếu các tuyến `openai-codex/*` hoặc ghim OpenAI PI đã lỗi thời vẫn còn trong cấu hình hoặc
    trạng thái phiên, `openclaw doctor --fix` viết lại chúng thành `openai/*` với
    runtime Codex trừ khi PI được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xem metadata model và giới hạn ngữ cảnh runtime là các giá trị riêng biệt.

    Với `openai/gpt-5.5` thông qua catalog OAuth Codex:

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

    OpenClaw dùng metadata catalog Codex thượng nguồn cho `gpt-5.5` khi nó
    hiện diện. Nếu phát hiện Codex trực tiếp bỏ qua hàng `gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng model OAuth đó để
    các lần chạy cron, sub-agent và model mặc định đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Bộ chạy app-server Codex gốc dùng tham chiếu model `openai/*` cộng với cấu hình
runtime bị bỏ qua hoặc `agentRuntime.id: "codex"`, nhưng xác thực của nó vẫn
dựa trên tài khoản. OpenClaw
chọn xác thực theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw `openai-codex` rõ ràng được gắn với agent.
2. Tài khoản hiện có của app-server, chẳng hạn như đăng nhập ChatGPT bằng Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi app-server báo cáo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó có nghĩa là đăng nhập gói đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình gateway cũng có `OPENAI_API_KEY` cho các model OpenAI trực tiếp
hoặc embeddings. Dự phòng API key trong env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi tới các kết nối app-server WebSocket. Khi một hồ sơ Codex kiểu gói đăng ký
được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
khỏi tiến trình con app-server stdio được sinh ra và gửi thông tin xác thực đã chọn
qua RPC đăng nhập app-server.

## Tạo ảnh

Plugin `openai` đi kèm đăng ký tạo ảnh thông qua công cụ `image_generate`.
Nó hỗ trợ cả tạo ảnh bằng API key OpenAI và tạo ảnh bằng OAuth Codex
thông qua cùng tham chiếu model `openai/gpt-image-2`.

| Khả năng                | API key OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Tham chiếu model                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                      | `OPENAI_API_KEY`                   | Đăng nhập OAuth OpenAI Codex           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Số ảnh tối đa mỗi yêu cầu    | 4                                  | 4                                    |
| Chế độ chỉnh sửa                 | Bật (tối đa 5 ảnh tham chiếu) | Bật (tối đa 5 ảnh tham chiếu)   |
| Ghi đè kích thước            | Được hỗ trợ, bao gồm kích thước 2K/4K   | Được hỗ trợ, bao gồm kích thước 2K/4K     |
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
Xem [Tạo ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung, lựa chọn provider và hành vi failover.
</Note>

`gpt-image-2` là mặc định cho cả tạo ảnh từ văn bản OpenAI và chỉnh sửa ảnh.
`gpt-image-1.5`, `gpt-image-1`, và `gpt-image-1-mini` vẫn dùng được dưới dạng
các ghi đè model rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra
PNG/WebP nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Với yêu cầu nền trong suốt, agent nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn provider `openai.background` cũ hơn
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và
OAuth OpenAI Codex bằng cách viết lại các yêu cầu trong suốt mặc định `openai/gpt-image-2`
thành `gpt-image-1.5`; Azure và các endpoint tương thích OpenAI tùy chỉnh giữ
tên triển khai/model đã cấu hình của chúng.

Cùng thiết lập này được cung cấp cho các lần chạy CLI headless:

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
`--openai-background` vẫn khả dụng dưới dạng bí danh dành riêng cho OpenAI.

Với các cài đặt OAuth Codex, hãy giữ cùng tham chiếu `openai/gpt-image-2`. Khi một
hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw phân giải access token OAuth
đã lưu đó và gửi yêu cầu ảnh thông qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm dự phòng sang API key cho
yêu cầu đó. Cấu hình `models.providers.openai` rõ ràng với API key,
URL cơ sở tùy chỉnh hoặc endpoint Azure khi bạn muốn dùng tuyến OpenAI Images API
trực tiếp thay vào đó.
Nếu endpoint ảnh tùy chỉnh đó nằm trên LAN/địa chỉ riêng đáng tin cậy, cũng đặt
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw vẫn
chặn các endpoint ảnh tương thích OpenAI riêng tư/nội bộ trừ khi có lựa chọn tham gia này.

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

| Khả năng       | Giá trị                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model mặc định    | `openai/sora-2`                                                                   |
| Chế độ            | Văn bản thành video, ảnh thành video, chỉnh sửa một video                                  |
| Đầu vào tham chiếu | 1 ảnh hoặc 1 video                                                                |
| Ghi đè kích thước   | Được hỗ trợ                                                                         |
| Ghi đè khác  | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn provider và hành vi failover.
</Note>

## Đóng góp prompt GPT-5

OpenClaw thêm một đóng góp prompt GPT-5 dùng chung cho các lần chạy họ GPT-5 trên nhiều provider. Nó áp dụng theo id model, vì vậy `openai/gpt-5.5`, các tham chiếu cũ trước khi sửa như `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, và các tham chiếu GPT-5 tương thích khác nhận cùng lớp phủ. Các model GPT-4.x cũ hơn thì không.

Bộ chạy Codex gốc đi kèm dùng cùng hành vi GPT-5 và lớp phủ Heartbeat thông qua hướng dẫn developer của app-server Codex, vì vậy các phiên `openai/gpt-5.x` bị buộc đi qua `agentRuntime.id: "codex"` giữ cùng hướng dẫn theo dõi đến cùng và Heartbeat chủ động, dù Codex sở hữu phần còn lại của prompt bộ chạy.

Phần đóng góp GPT-5 bổ sung một hợp đồng hành vi được gắn thẻ cho việc duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh. Hành vi trả lời theo kênh và tin nhắn im lặng vẫn nằm trong prompt hệ thống OpenClaw dùng chung và chính sách gửi đi. Hướng dẫn GPT-5 luôn được bật cho các mô hình phù hợp. Lớp phong cách tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị                | Hiệu ứng                                    |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện |
| `"on"`                 | Bí danh cho `"friendly"`                    |
| `"off"`                | Chỉ tắt lớp phong cách thân thiện           |

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
Các giá trị không phân biệt chữ hoa chữ thường khi chạy, vì vậy `"Off"` và `"off"` đều tắt lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc như một phương án dự phòng tương thích khi cài đặt dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp giọng nói (TTS)">
    Plugin `openai` đi kèm đăng ký tổng hợp giọng nói cho bề mặt `messages.tts`.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.voice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Hướng dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Thân bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các mô hình có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, vì vậy hãy dùng nó cho các endpoint tương thích OpenAI yêu cầu khóa bổ sung như `lang`. Các khóa prototype bị bỏ qua.

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

  <Accordion title="Chuyển lời nói thành văn bản">
    Plugin `openai` đi kèm đăng ký chuyển lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu nội dung media của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải tệp âm thanh multipart lên
    - Được OpenClaw hỗ trợ ở mọi nơi phiên âm âm thanh đến sử dụng
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
    cấu hình media âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lệnh gọi.

  </Accordion>

  <Accordion title="Phiên âm thời gian thực">
    Plugin `openai` đi kèm đăng ký phiên âm thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Sử dụng kết nối WebSocket tới `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Nhà cung cấp streaming này dành cho đường dẫn phiên âm thời gian thực của Voice Call; thoại Discord hiện ghi các đoạn ngắn và thay vào đó dùng đường dẫn phiên âm theo lô `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói thời gian thực">
    Plugin `openai` đi kèm đăng ký giọng nói thời gian thực cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Giọng | `...openai.voice` | `alloy` |
    | Nhiệt độ | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Khóa API | `...openai.apiKey` | Dự phòng về `OPENAI_API_KEY` |

    <Note>
    Hỗ trợ Azure OpenAI thông qua các khóa cấu hình `azureEndpoint` và `azureDeployment` cho các bridge thời gian thực ở backend. Hỗ trợ gọi công cụ hai chiều. Sử dụng định dạng âm thanh G.711 u-law.
    </Note>

    <Note>
    Control UI Talk sử dụng các phiên thời gian thực trên trình duyệt OpenAI với một
    client secret tạm thời do Gateway tạo và trao đổi SDP WebRTC trực tiếp trên trình duyệt với
    OpenAI Realtime API. Xác minh trực tiếp cho maintainer có sẵn với
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    nhánh OpenAI tạo một client secret trong Node, tạo một SDP offer của trình duyệt
    với media micro giả, gửi nó đến OpenAI và áp dụng SDP answer
    mà không ghi secrets vào log.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Nhà cung cấp `openai` đi kèm có thể trỏ đến một tài nguyên Azure OpenAI để tạo ảnh
bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo ảnh, OpenClaw
phát hiện tên máy chủ Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
dạng yêu cầu của Azure.

<Note>
Giọng nói thời gian thực sử dụng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Giọng nói thời gian thực**
trong [Giọng nói và lời nói](#voice-and-speech) để biết các cài đặt Azure
của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có đăng ký, hạn mức hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần vùng lưu trú dữ liệu theo khu vực hoặc các biện pháp kiểm soát tuân thủ mà Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo ảnh Azure thông qua nhà cung cấp `openai` đi kèm, hãy trỏ
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

OpenClaw nhận diện các hậu tố máy chủ Azure này cho route tạo ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Đối với yêu cầu tạo ảnh trên máy chủ Azure được nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng các đường dẫn theo phạm vi deployment (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào mỗi yêu cầu
- Dùng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ nguyên
dạng yêu cầu ảnh OpenAI tiêu chuẩn.

<Note>
Định tuyến Azure cho đường dẫn tạo ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản trước xử lý mọi
`openai.baseUrl` tùy chỉnh như endpoint OpenAI công khai và sẽ thất bại với Azure
image deployments.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ thể
cho đường dẫn tạo ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Mặc định là `2024-12-01-preview` khi biến chưa được đặt.

### Tên mô hình là tên deployment

Azure OpenAI liên kết mô hình với deployment. Đối với yêu cầu tạo ảnh Azure
được định tuyến qua nhà cung cấp `openai` đi kèm, trường `model` trong OpenClaw
phải là **tên deployment Azure** bạn đã cấu hình trong cổng Azure, không phải
id mô hình OpenAI công khai.

Nếu bạn tạo một deployment tên là `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên deployment tương tự áp dụng cho các lệnh gọi tạo ảnh được định tuyến qua
nhà cung cấp `openai` đi kèm.

### Khả dụng theo khu vực

Tạo ảnh Azure hiện chỉ có sẵn ở một số khu vực
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Hãy kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
deployment, và xác nhận mô hình cụ thể được cung cấp trong khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số giá trị
`background` nhất định trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản mô hình
cụ thể. Các khác biệt này đến từ Azure và mô hình nền tảng, không phải
OpenClaw. Nếu một yêu cầu Azure thất bại với lỗi xác thực, hãy kiểm tra
bộ tham số được deployment và phiên bản API cụ thể của bạn hỗ trợ trong
cổng Azure.

<Note>
Azure OpenAI sử dụng transport gốc và hành vi tương thích nhưng không nhận
các header ghi nhận nguồn ẩn của OpenClaw — xem accordion **Route gốc và route tương thích OpenAI**
trong [Cấu hình nâng cao](#advanced-configuration).

Đối với lưu lượng chat hoặc Responses trên Azure (ngoài tạo ảnh), hãy dùng
luồng onboarding hoặc cấu hình nhà cung cấp Azure chuyên dụng — chỉ riêng `openai.baseUrl`
không áp dụng dạng API/xác thực của Azure. Có một nhà cung cấp
`azure-openai-responses/*` riêng; xem accordion Server-side compaction bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Transport (WebSocket và SSE)">
    OpenClaw ưu tiên WebSocket với SSE dự phòng (`"auto"`) cho `openai/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi dự phòng sang SSE
    - Sau khi xảy ra lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian hạ nhiệt
    - Gắn các header định danh phiên và lượt ổn định cho việc thử lại và kết nối lại
    - Chuẩn hóa bộ đếm mức sử dụng (`input_tokens` / `prompt_tokens`) giữa các biến thể transport

    | Giá trị | Hành vi |
    |-------|----------|
    | `"auto"` (mặc định) | WebSocket trước, SSE dự phòng |
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

  <Accordion title="Khởi động sẵn WebSocket">
    OpenClaw bật khởi động sẵn WebSocket theo mặc định cho `openai/*` để giảm độ trễ ở lượt đầu tiên.

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
    OpenClaw cung cấp một công tắc chế độ nhanh dùng chung cho `openai/*`:

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
    Ghi đè phiên được ưu tiên hơn cấu hình. Xóa ghi đè phiên trong UI Phiên sẽ đưa phiên về mặc định đã cấu hình.
    </Note>

  </Accordion>

  <Accordion title="Xử lý ưu tiên (service_tier)">
    API của OpenAI cung cấp xử lý ưu tiên qua `service_tier`. Thiết lập theo từng mô hình trong OpenClaw:

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
    `serviceTier` chỉ được chuyển tiếp đến các endpoint OpenAI gốc (`api.openai.com`) và endpoint Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai provider qua proxy, OpenClaw sẽ giữ nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc luồng Pi-harness của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Ép buộc `store: true` (trừ khi tương thích mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không có)

    Điều này áp dụng cho đường dẫn Pi harness tích hợp sẵn và cho các hook provider OpenAI được dùng bởi các lần chạy nhúng. Harness máy chủ ứng dụng Codex gốc tự quản lý ngữ cảnh của nó qua Codex và được cấu hình riêng bằng `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn ép buộc `store: true` trừ khi tương thích đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT strict-agentic">
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
    - Không còn xem một lượt chỉ lập kế hoạch là tiến triển thành công khi có hành động công cụ khả dụng
    - Thử lại lượt đó với một điều hướng hành động ngay
    - Tự động bật `update_plan` cho công việc đáng kể
    - Hiển thị trạng thái bị chặn rõ ràng nếu mô hình tiếp tục lập kế hoạch mà không hành động

    <Note>
    Chỉ áp dụng cho các lần chạy thuộc họ GPT-5 của OpenAI và Codex. Các provider khác và các họ mô hình cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI, Codex và Azure OpenAI trực tiếp khác với các proxy `/v1` tương thích OpenAI chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ nỗ lực `none` của OpenAI
    - Bỏ qua reasoning đã tắt đối với các mô hình hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định đặt schema công cụ ở chế độ nghiêm ngặt
    - Chỉ gắn header quy kết ẩn trên các máy chủ gốc đã xác minh
    - Giữ định dạng yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`, tương thích reasoning, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Dùng hành vi tương thích nới lỏng hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không gốc
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI như vLLM
    - Không ép buộc schema công cụ nghiêm ngặt hoặc header chỉ dành cho tuyến gốc

    Azure OpenAI dùng truyền tải gốc và hành vi tương thích nhưng không nhận các header quy kết ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin đăng nhập.
  </Card>
</CardGroup>
