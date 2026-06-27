---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi tác nhân GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:05:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn như một tác nhân lập trình
trong gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw sử dụng một
id nhà cung cấp, `openai`, cho cả hai dạng xác thực.

OpenClaw sử dụng `openai/*` làm tuyến mô hình OpenAI chuẩn. Các lượt tác nhân
nhúng trên mô hình OpenAI mặc định chạy qua runtime app-server Codex gốc;
xác thực khóa API OpenAI trực tiếp vẫn có sẵn cho các bề mặt OpenAI không phải tác nhân
như hình ảnh, embedding, giọng nói và realtime.

- **Mô hình tác nhân** - các mô hình `openai/*` thông qua runtime Codex; đăng nhập bằng
  xác thực Codex để dùng gói đăng ký ChatGPT/Codex, hoặc cấu hình một hồ sơ dự phòng
  khóa API OpenAI tương thích với Codex khi bạn chủ đích muốn xác thực bằng khóa API.
- **API OpenAI không phải tác nhân** - truy cập trực tiếp OpenAI Platform với
  thanh toán theo mức sử dụng thông qua `OPENAI_API_KEY` hoặc quy trình thiết lập khóa API OpenAI.
- **Cấu hình cũ** - các tham chiếu mô hình Codex cũ được
  `openclaw doctor --fix` sửa thành `openai/*` cộng với runtime Codex.

OpenAI hỗ trợ rõ ràng việc sử dụng OAuth theo gói đăng ký trong các công cụ và quy trình bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó
đang bị lẫn với nhau, hãy đọc [Runtime tác nhân](/vi/concepts/agent-runtimes) trước khi
thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                             | Dùng                                                     | Ghi chú                                                               |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-5.5`                                         | Thiết lập tác nhân OpenAI mặc định. Đăng nhập bằng xác thực Codex.    |
| Thanh toán khóa API trực tiếp cho mô hình tác nhân   | `openai/gpt-5.5` cộng với hồ sơ khóa API tương thích Codex | Dùng `auth.order.openai` để đặt dự phòng sau xác thực đăng ký.        |
| Thanh toán khóa API trực tiếp qua OpenClaw rõ ràng   | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `openclaw` | Chọn một hồ sơ khóa API `openai` bình thường.                         |
| Bí danh API ChatGPT Instant mới nhất                 | `openai/chat-latest`                                     | Chỉ khóa API trực tiếp. Bí danh di động cho thử nghiệm, không phải mặc định. |
| Xác thực gói đăng ký ChatGPT/Codex qua OpenClaw      | `openai/gpt-5.5` cộng với runtime nhà cung cấp/mô hình `openclaw` | Chọn một hồ sơ OAuth `openai` cho tuyến tương thích.                  |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                                     | Hoạt động với `OPENAI_API_KEY` hoặc OpenAI Codex OAuth.               |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                                   | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`. |

## Bản đồ tên gọi

Các tên gọi tương tự nhau nhưng không thể thay thế cho nhau:

| Tên bạn thấy                            | Lớp              | Ý nghĩa                                                                                           |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Tiền tố nhà cung cấp | Tuyến mô hình OpenAI chuẩn; các lượt tác nhân dùng runtime Codex.                                |
| tiền tố OpenAI Codex cũ                 | Tiền tố cũ       | Không gian tên mô hình/hồ sơ cũ. `openclaw doctor --fix` di chuyển nó sang `openai`.              |
| Plugin `codex`                          | Plugin           | Plugin OpenClaw đi kèm cung cấp runtime app-server Codex gốc và điều khiển chat `/codex`.        |
| nhà cung cấp/mô hình `agentRuntime.id: codex` | Runtime tác nhân | Buộc dùng harness app-server Codex gốc cho các lượt nhúng khớp.                                  |
| `/codex ...`                            | Bộ lệnh chat     | Gắn/điều khiển các luồng app-server Codex từ một cuộc trò chuyện.                                |
| `runtime: "acp", agentId: "codex"`      | Tuyến phiên ACP  | Đường dự phòng rõ ràng chạy Codex qua ACP/acpx.                                                   |

Điều này có nghĩa là một cấu hình có thể chủ đích chứa các tham chiếu mô hình `openai/*` trong khi
hồ sơ xác thực trỏ tới thông tin đăng nhập khóa API hoặc OAuth ChatGPT/Codex. Dùng
`auth.order.openai` cho cấu hình; `openclaw doctor --fix` viết lại các tham chiếu mô hình
Codex cũ, id hồ sơ xác thực Codex cũ và
thứ tự xác thực Codex cũ sang tuyến OpenAI chuẩn.

<Note>
GPT-5.5 có sẵn qua cả truy cập khóa API OpenAI Platform trực tiếp và
các tuyến đăng ký/OAuth. Với gói đăng ký ChatGPT/Codex cộng với thực thi Codex
gốc, dùng `openai/gpt-5.5`; cấu hình runtime chưa đặt hiện chọn harness Codex
cho các lượt tác nhân OpenAI. Chỉ dùng hồ sơ khóa API OpenAI khi bạn muốn
xác thực khóa API trực tiếp cho một mô hình tác nhân OpenAI.
</Note>

<Note>
Các lượt mô hình tác nhân OpenAI yêu cầu Plugin app-server Codex đi kèm. Cấu hình runtime
OpenClaw rõ ràng vẫn có sẵn như một tuyến tương thích chọn tham gia. Khi OpenClaw được
chọn rõ ràng với một hồ sơ OAuth `openai`, OpenClaw giữ
tham chiếu mô hình công khai là `openai/*` và định tuyến nội bộ qua transport
xác thực Codex. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình
Codex cũ, `codex-cli/*`, hoặc các ghim phiên runtime cũ không đến từ
cấu hình runtime rõ ràng.
</Note>

## Phạm vi tính năng OpenClaw

| Năng lực OpenAI          | Bề mặt OpenClaw                                                                                | Trạng thái                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | Nhà cung cấp mô hình `openai/<model>`                                                         | Có                                                                     |
| Mô hình đăng ký Codex     | `openai/<model>` với OpenAI OAuth                                                             | Có                                                                     |
| Tham chiếu mô hình Codex cũ | tham chiếu mô hình Codex cũ hoặc `codex-cli/<model>`                                        | Được doctor sửa thành `openai/<model>`                                 |
| Harness app-server Codex  | `openai/<model>` với runtime bỏ trống hoặc nhà cung cấp/mô hình `agentRuntime.id: codex`      | Có                                                                     |
| Tìm kiếm web phía server  | Công cụ OpenAI Responses gốc                                                                  | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp               |
| Hình ảnh                  | `image_generate`                                                                              | Có                                                                     |
| Video                     | `video_generate`                                                                              | Có                                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`                                                | Có                                                                     |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu nội dung media                                      | Có                                                                     |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "openai"`                                     | Có                                                                     |
| Giọng nói realtime        | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Có (yêu cầu tín dụng OpenAI Platform, không phải gói đăng ký Codex/ChatGPT) |
| Embedding                 | nhà cung cấp embedding bộ nhớ                                                                 | Có                                                                     |

<Note>
  Giọng nói OpenAI Realtime (được Voice Call dùng với `realtime.provider: "openai"` và
  Control UI Talk với `talk.realtime.provider: "openai"`) đi qua
  **OpenAI Platform Realtime API** công khai, được tính phí vào tín dụng OpenAI
  Platform thay vì hạn mức gói đăng ký Codex/ChatGPT. Một tài khoản
  có OpenAI OAuth hoạt động tốt và chạy các mô hình chat dựa trên Codex không gặp vấn đề
  vẫn cần một hồ sơ xác thực khóa API OpenAI hoặc khóa API Platform với thanh toán
  Platform đã nạp tiền cho giọng nói Realtime.

Cách sửa: nạp tín dụng Platform tại
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
cho tổ chức đứng sau thông tin đăng nhập realtime của bạn. Giọng nói Realtime chấp nhận
hồ sơ xác thực khóa API `openai` do `openclaw onboard --auth-choice openai-api-key` tạo,
một Platform `OPENAI_API_KEY` được cấu hình qua `talk.realtime.providers.openai.apiKey`
cho Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
cho Voice Call, hoặc biến môi trường `OPENAI_API_KEY`. Các hồ sơ OAuth OpenAI
vẫn có thể chạy mô hình chat `openai/*` dựa trên Codex trong cùng bản cài
OpenClaw, nhưng chúng không cấu hình giọng nói Realtime.
</Note>

## Embedding bộ nhớ

OpenClaw có thể dùng OpenAI, hoặc một endpoint embedding tương thích OpenAI, cho
lập chỉ mục `memory_search` và embedding truy vấn:

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

Với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, đặt
`queryInputType` và `documentInputType` dưới `memorySearch`. OpenClaw chuyển tiếp
chúng dưới dạng các trường yêu cầu `input_type` riêng cho nhà cung cấp: embedding truy vấn dùng
`queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và lập chỉ mục theo lô dùng
`documentInputType`. Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để biết ví dụ đầy đủ.

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa API (OpenAI Platform)">
    **Phù hợp nhất cho:** truy cập API trực tiếp và thanh toán theo mức sử dụng.

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

    | Tham chiếu mô hình    | Cấu hình runtime            | Tuyến                       | Xác thực         |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | bỏ trống / nhà cung cấp/mô hình `agentRuntime.id: "codex"` | Harness app-server Codex | Hồ sơ OpenAI tương thích Codex |
    | `openai/gpt-5.4-mini` | bỏ trống / nhà cung cấp/mô hình `agentRuntime.id: "codex"` | Harness app-server Codex | Hồ sơ OpenAI tương thích Codex |
    | `openai/gpt-5.5`      | nhà cung cấp/mô hình `agentRuntime.id: "openclaw"`              | Runtime nhúng OpenClaw      | Hồ sơ `openai` đã chọn |

    <Note>
    Các mô hình agent `openai/*` sử dụng harness app-server Codex. Để dùng xác thực
    bằng khóa API cho một mô hình agent, hãy tạo một hồ sơ khóa API tương thích
    với Codex và sắp xếp nó bằng `auth.order.openai`; `OPENAI_API_KEY` vẫn là
    phương án dự phòng trực tiếp cho các bề mặt API OpenAI không phải agent. Chạy
    `openclaw doctor --fix` để di chuyển các mục thứ tự xác thực Codex cũ.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Để thử mô hình Instant hiện tại của ChatGPT từ OpenAI API, đặt mô hình
    thành `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` là một bí danh thay đổi theo thời gian. OpenAI ghi tài liệu rằng đó là mô hình Instant mới nhất
    được dùng trong ChatGPT và khuyến nghị `gpt-5.5` cho việc dùng API trong production, vì vậy
    hãy giữ `openai/gpt-5.5` làm mặc định ổn định trừ khi bạn muốn rõ ràng
    hành vi bí danh đó. Bí danh này hiện chỉ chấp nhận độ dài văn bản `medium`, nên
    OpenClaw chuẩn hóa các ghi đè độ dài văn bản OpenAI không tương thích cho
    mô hình này.

    <Warning>
    OpenClaw **không** cung cấp `gpt-5.3-codex-spark` trên tuyến khóa API OpenAI trực tiếp. Nó chỉ có sẵn thông qua các mục danh mục đăng ký Codex khi tài khoản đã đăng nhập của bạn cung cấp nó.
    </Warning>

  </Tab>

  <Tab title="Đăng ký Codex">
    **Phù hợp nhất cho:** dùng gói đăng ký ChatGPT/Codex của bạn với thực thi app-server Codex gốc thay vì một khóa API riêng. Đám mây Codex yêu cầu đăng nhập ChatGPT.

    <Steps>
      <Step title="Chạy OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Hoặc chạy OAuth trực tiếp:

        ```bash
        openclaw models auth login --provider openai
        ```

        Với các thiết lập headless hoặc khó dùng callback, thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Dùng tuyến mô hình OpenAI chuẩn">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Không cần cấu hình runtime cho đường dẫn mặc định. Các lượt agent OpenAI
        tự động chọn runtime app-server Codex gốc, và OpenClaw
        cài đặt hoặc sửa Plugin Codex đi kèm khi tuyến này được chọn.
      </Step>
      <Step title="Xác minh xác thực Codex có sẵn">
        ```bash
        openclaw models list --provider openai
        ```

        Sau khi Gateway đang chạy, gửi `/codex status` hoặc `/codex models`
        trong chat để xác minh runtime app-server gốc.
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình | Cấu hình runtime | Tuyến | Xác thực |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | bỏ qua / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex gốc | Đăng nhập Codex hoặc hồ sơ xác thực `openai` đã sắp xếp |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Runtime nhúng OpenClaw với transport xác thực Codex nội bộ | Hồ sơ OAuth `openai` đã chọn |
    | tham chiếu Codex GPT-5.5 cũ | được doctor sửa | Tuyến cũ được viết lại thành `openai/gpt-5.5` | Hồ sơ OAuth OpenAI đã di chuyển |
    | `codex-cli/gpt-5.5` | được doctor sửa | Tuyến CLI cũ được viết lại thành `openai/gpt-5.5` | Xác thực app-server Codex |

    <Warning>
    Ưu tiên `openai/gpt-5.5` cho cấu hình agent mới dựa trên đăng ký. Các
    tham chiếu Codex GPT cũ là tuyến OpenClaw cũ, không phải đường dẫn runtime
    Codex gốc; chạy `openclaw doctor --fix` khi bạn muốn di chuyển chúng sang
    các tham chiếu `openai/*` chuẩn. `gpt-5.3-codex-spark` vẫn bị giới hạn cho các tài khoản có
    danh mục đăng ký Codex quảng bá mô hình đó; các tham chiếu khóa API OpenAI trực tiếp và
    Azure cho nó vẫn bị ẩn.
    </Warning>

    <Note>
    Tiền tố mô hình Codex cũ là cấu hình cũ được doctor sửa. Với
    thiết lập phổ biến gồm đăng ký cộng với runtime gốc, hãy đăng nhập bằng xác thực Codex
    nhưng giữ tham chiếu mô hình là `openai/gpt-5.5`. Cấu hình mới nên đặt thứ tự
    xác thực agent OpenAI dưới `auth.order.openai`; doctor di chuyển các mục
    thứ tự xác thực Codex cũ.
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

    Với một khóa API dự phòng, hãy giữ mô hình ở `openai/gpt-5.5` và đặt
    thứ tự xác thực dưới `openai`. OpenClaw sẽ thử đăng ký trước, rồi
    khóa API, trong khi vẫn ở trên harness Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding không còn nhập dữ liệu OAuth từ `~/.codex`. Đăng nhập bằng OAuth trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin đăng nhập kết quả trong kho xác thực agent riêng của nó.
    </Note>

    ### Kiểm tra và khôi phục định tuyến OAuth Codex

    Dùng các lệnh này để xem mô hình, runtime và tuyến xác thực nào mà agent mặc định
    của bạn đang sử dụng:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Với một agent cụ thể, thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Nếu một cấu hình cũ vẫn có tham chiếu Codex GPT cũ hoặc ghim phiên runtime OpenAI
    lỗi thời mà không có cấu hình runtime rõ ràng, hãy sửa nó:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai` không hiển thị hồ sơ dùng được nào, hãy đăng
    nhập lại:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Dùng `--profile-id` khi bạn muốn nhiều lần đăng nhập OAuth Codex trong cùng
    một agent và sau đó muốn kiểm soát chúng qua thứ tự xác thực hoặc `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` là tuyến mô hình cho các lượt agent OpenAI thông qua Codex. Chạy
    `openclaw doctor --fix` để di chuyển các id hồ sơ tiền tố OpenAI Codex cũ và
    các mục thứ tự trước khi dựa vào thứ tự hồ sơ.

    ### Chỉ báo trạng thái

    Chat `/status` hiển thị runtime mô hình nào đang hoạt động cho phiên hiện tại.
    Harness app-server Codex đi kèm xuất hiện là `Runtime: OpenAI Codex` cho
    các lượt mô hình agent OpenAI. Các ghim phiên runtime OpenAI lỗi thời được sửa thành Codex trừ khi
    cấu hình ghim rõ ràng OpenClaw.

    ### Cảnh báo doctor

    Nếu tham chiếu mô hình Codex cũ hoặc ghim runtime OpenAI lỗi thời vẫn còn trong cấu hình hoặc
    trạng thái phiên, `openclaw doctor --fix` viết lại chúng thành `openai/*` với
    runtime Codex trừ khi OpenClaw được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xem metadata mô hình và giới hạn ngữ cảnh runtime là các giá trị riêng biệt.

    Với `openai/gpt-5.5` thông qua danh mục OAuth Codex:

    - `contextWindow` gốc: `1000000`
    - Giới hạn `contextTokens` runtime mặc định: `272000`

    Giới hạn mặc định nhỏ hơn có đặc tính độ trễ và chất lượng tốt hơn trong thực tế. Ghi đè nó bằng `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    OpenClaw dùng metadata danh mục Codex upstream cho `gpt-5.5` khi nó
    có mặt. Nếu khám phá Codex trực tiếp bỏ qua hàng `gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng mô hình OAuth đó để
    các lần chạy cron, sub-agent và mô hình mặc định đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Harness app-server Codex gốc dùng các tham chiếu mô hình `openai/*` cộng với cấu hình
runtime bị bỏ qua hoặc provider/model `agentRuntime.id: "codex"`, nhưng xác thực của nó
vẫn dựa trên tài khoản. OpenClaw chọn xác thực theo thứ tự này:

1. Các hồ sơ xác thực OpenAI đã sắp xếp cho agent, ưu tiên dưới
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di chuyển các id
   hồ sơ xác thực Codex cũ và thứ tự xác thực Codex cũ.
2. Tài khoản hiện có của app-server, chẳng hạn như đăng nhập ChatGPT cục bộ của Codex CLI.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi app-server báo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó có nghĩa là một đăng nhập đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình Gateway cũng có `OPENAI_API_KEY` cho các mô hình OpenAI trực tiếp
hoặc embedding. Dự phòng khóa API env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi tới các kết nối app-server WebSocket. Khi một hồ sơ Codex kiểu đăng ký
được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
ngoài tiến trình con app-server stdio được sinh ra và gửi thông tin đăng nhập đã chọn
qua RPC đăng nhập app-server. Khi hồ sơ đăng ký đó bị chặn bởi
giới hạn sử dụng Codex, OpenClaw có thể xoay sang hồ sơ khóa API `openai:*` tiếp theo
đã sắp xếp mà không thay đổi mô hình đã chọn hoặc rời khỏi harness Codex.
Sau khi thời gian đặt lại đăng ký qua đi, hồ sơ đăng ký lại đủ điều kiện.

## Tạo ảnh

Plugin `openai` đi kèm đăng ký tạo ảnh thông qua công cụ `image_generate`.
Nó hỗ trợ cả tạo ảnh bằng khóa API OpenAI và tạo ảnh bằng OAuth Codex
thông qua cùng tham chiếu mô hình `openai/gpt-image-2`.

| Khả năng                | Khóa API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Tham chiếu mô hình                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                      | `OPENAI_API_KEY`                   | Đăng nhập OAuth OpenAI Codex           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Số ảnh tối đa mỗi yêu cầu    | 4                                  | 4                                    |
| Chế độ chỉnh sửa                 | Bật (tối đa 5 ảnh tham chiếu) | Bật (tối đa 5 ảnh tham chiếu)   |
| Ghi đè kích thước            | Được hỗ trợ, gồm cả kích thước 2K/4K   | Được hỗ trợ, gồm cả kích thước 2K/4K     |
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
ghi đè mô hình rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra PNG/WebP
nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Đối với yêu cầu nền trong suốt, agent nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ hơn
vẫn được chấp nhận. OpenClaw cũng bảo vệ các route OAuth công khai của OpenAI và
OpenAI Codex bằng cách viết lại các yêu cầu trong suốt mặc định
`openai/gpt-image-2` thành `gpt-image-1.5`; Azure và các endpoint tùy chỉnh
tương thích với OpenAI vẫn giữ tên deployment/model đã cấu hình của chúng.

Cùng thiết lập này cũng được cung cấp cho các lần chạy CLI không giao diện:

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
`--openai-background` vẫn có sẵn như một bí danh dành riêng cho OpenAI.
Dùng `--quality low|medium|high|auto` khi bạn cần kiểm soát chất lượng và chi phí
OpenAI Images. Dùng `--openai-moderation low|auto` để truyền gợi ý kiểm duyệt
riêng theo nhà cung cấp của OpenAI từ `image generate` hoặc `image edit`.

Đối với các bản cài đặt OAuth ChatGPT/Codex, hãy giữ cùng ref
`openai/gpt-image-2`. Khi một hồ sơ OAuth `openai` được cấu hình, OpenClaw phân
giải access token OAuth đã lưu đó và gửi yêu cầu hình ảnh qua backend Codex
Responses. OpenClaw không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển về API
key cho yêu cầu đó. Cấu hình rõ ràng `models.providers.openai` với API key,
URL cơ sở tùy chỉnh, hoặc endpoint Azure khi bạn muốn dùng route OpenAI Images API
trực tiếp.
Nếu endpoint hình ảnh tùy chỉnh đó nằm trên một địa chỉ LAN/riêng đáng tin cậy,
cũng đặt `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw vẫn
chặn các endpoint hình ảnh riêng/nội bộ tương thích với OpenAI trừ khi có tùy chọn
chủ động này.

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

Plugin `openai` được đóng gói đăng ký tính năng tạo video thông qua công cụ `video_generate`.

| Khả năng | Giá trị |
| ---------------- | --------------------------------------------------------------------------------- |
| Model mặc định | `openai/sora-2` |
| Chế độ | Văn bản thành video, hình ảnh thành video, chỉnh sửa một video |
| Đầu vào tham chiếu | 1 hình ảnh hoặc 1 video |
| Ghi đè kích thước | Được hỗ trợ cho văn bản thành video và hình ảnh thành video |
| Ghi đè khác | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

Các yêu cầu hình ảnh thành video của OpenAI dùng `POST /v1/videos` với
`input_reference` là hình ảnh. Chỉnh sửa một video dùng `POST /v1/videos/edits` với
video đã tải lên trong trường `video`.

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

OpenClaw thêm một đóng góp prompt GPT-5 dùng chung cho các lần chạy thuộc họ GPT-5 trên các bề mặt prompt do OpenClaw lắp ráp. Nó áp dụng theo id model, nên các route OpenClaw/nhà cung cấp như ref cũ trước sửa chữa legacy (ref legacy Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, và các ref GPT-5 tương thích khác nhận cùng overlay. Các model GPT-4.x cũ hơn thì không.

Bộ harness Codex gốc được đóng gói không nhận overlay GPT-5 này của OpenClaw thông qua chỉ dẫn developer của app-server Codex. Codex gốc giữ hành vi cơ sở, model và tài liệu dự án do Codex sở hữu, trong khi OpenClaw tắt cá tính tích hợp sẵn của Codex cho các luồng gốc để các tệp cá tính trong workspace của agent vẫn là nguồn có thẩm quyền. OpenClaw chỉ đóng góp ngữ cảnh runtime như phân phối kênh, công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh workspace và Skills của OpenClaw.

Đóng góp GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho việc duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh trên các prompt phù hợp do OpenClaw lắp ráp. Hành vi trả lời theo kênh và thông điệp im lặng vẫn nằm trong prompt hệ thống OpenClaw dùng chung và chính sách phân phối đầu ra. Lớp phong cách tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị | Hiệu ứng |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện |
| `"on"` | Bí danh của `"friendly"` |
| `"off"` | Chỉ tắt lớp phong cách thân thiện |

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
Giá trị không phân biệt chữ hoa chữ thường tại runtime, nên `"Off"` và `"off"` đều tắt lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` legacy vẫn được đọc như một phương án tương thích dự phòng khi thiết lập dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp giọng nói (TTS)">
    Plugin `openai` được đóng gói đăng ký tổng hợp giọng nói cho bề mặt `messages.tts`.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | API key | `messages.tts.providers.openai.apiKey` | Chuyển về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Phần thân bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các model có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, vì vậy hãy dùng nó cho các endpoint tương thích với OpenAI yêu cầu các khóa bổ sung như `lang`. Các khóa prototype bị bỏ qua.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng đến endpoint API chat. OpenAI TTS và giọng nói thời gian thực đều được cấu hình thông qua API key OpenAI Platform; các bản cài đặt chỉ dùng OAuth vẫn có thể dùng các model chat dựa trên Codex, nhưng không dùng được tính năng nói đáp trực tiếp của OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Lời nói thành văn bản">
    Plugin `openai` được đóng gói đăng ký lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Model mặc định: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở mọi nơi việc phiên âm âm thanh đầu vào dùng
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

    Các gợi ý ngôn ngữ và prompt được chuyển tiếp đến OpenAI khi được cung cấp bởi
    cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lần gọi.

  </Accordion>

  <Accordion title="Phiên âm thời gian thực">
    Plugin `openai` được đóng gói đăng ký phiên âm thời gian thực cho Plugin Voice Call.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai` | API key kết nối trực tiếp; OAuth cấp một secret client phiên âm thời gian thực |

    <Note>
    Dùng kết nối WebSocket tới `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Khi chỉ cấu hình OAuth `openai`, Gateway cấp một secret client phiên âm thời gian thực tạm thời trước khi mở WebSocket. Nhà cung cấp streaming này dành cho đường dẫn phiên âm thời gian thực của Voice Call; thoại Discord hiện ghi lại các đoạn ngắn và dùng đường dẫn phiên âm theo lô `tools.media.audio` thay vào đó.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói thời gian thực">
    Plugin `openai` được đóng gói đăng ký giọng nói thời gian thực cho Plugin Voice Call.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Giọng | `...openai.voice` | `alloy` |
    | Nhiệt độ (cầu nối deployment Azure) | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Phần đệm tiền tố | `...openai.prefixPaddingMs` | `300` |
    | Mức nỗ lực suy luận | `...openai.reasoningEffort` | (chưa đặt) |
    | Xác thực | hồ sơ xác thực API-key `openai`, `...openai.apiKey`, hoặc `OPENAI_API_KEY` | Bắt buộc có API key OpenAI Platform; OpenAI OAuth không cấu hình giọng nói thời gian thực |

    Các giọng thời gian thực tích hợp sẵn có cho `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI khuyến nghị `marin` và `cedar` để có chất lượng thời gian thực tốt nhất. Đây
    là một tập riêng so với các giọng chuyển văn bản thành lời nói ở trên; đừng giả định một giọng TTS
    như `fable`, `nova`, hoặc `onyx` là hợp lệ cho các phiên thời gian thực.

    <Note>
    Các cầu nối realtime backend OpenAI dùng hình dạng phiên WebSocket Realtime GA, vốn không chấp nhận `session.temperature`. Các deployment Azure OpenAI vẫn có sẵn qua `azureEndpoint` và `azureDeployment` và giữ hình dạng phiên tương thích với deployment. Hỗ trợ gọi công cụ hai chiều và âm thanh G.711 u-law.
    </Note>

    <Note>
    Giọng nói thời gian thực được chọn khi phiên được tạo. OpenAI cho phép hầu hết
    các trường phiên thay đổi sau đó, nhưng giọng không thể thay đổi sau khi
    model đã phát âm thanh trong phiên đó. OpenClaw hiện cung cấp các id giọng thời gian thực tích hợp sẵn dưới dạng chuỗi.
    </Note>

    <Note>
    Control UI Talk sử dụng các phiên realtime trên trình duyệt của OpenAI với
    client secret tạm thời do Gateway cấp và trao đổi WebRTC SDP trực tiếp trên
    trình duyệt với OpenAI Realtime API. Gateway cấp client secret đó bằng hồ sơ
    xác thực khóa API `openai` đã chọn hoặc khóa API OpenAI Platform đã cấu hình.
    Các cầu nối realtime WebSocket của backend Gateway relay và Voice Call dùng
    cùng đường dẫn xác thực chỉ dùng khóa API cho các endpoint OpenAI gốc. Có thể
    xác minh live cho maintainer bằng
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    các nhánh OpenAI xác minh cả cầu nối WebSocket backend và trao đổi WebRTC SDP
    trên trình duyệt mà không ghi log secret.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Provider `openai` được đóng gói sẵn có thể nhắm đến một tài nguyên Azure OpenAI
để tạo hình ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo hình ảnh,
OpenClaw phát hiện hostname Azure trong `models.providers.openai.baseUrl` và tự
động chuyển sang dạng request của Azure.

<Note>
Giọng nói realtime dùng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion
**Giọng nói realtime** trong [Giọng nói và lời nói](#voice-and-speech) để biết
các cài đặt Azure của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có đăng ký, hạn mức hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần lưu trú dữ liệu theo khu vực hoặc các kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một tenancy Azure hiện có

### Cấu hình

Để tạo hình ảnh Azure qua provider `openai` được đóng gói sẵn, trỏ
`models.providers.openai.baseUrl` đến tài nguyên Azure của bạn và đặt `apiKey`
thành khóa Azure OpenAI (không phải khóa OpenAI Platform):

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

OpenClaw nhận diện các hậu tố host Azure này cho route tạo hình ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Với các request tạo hình ảnh trên host Azure đã nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng các đường dẫn theo phạm vi deployment (`/openai/deployments/{deployment}/...`)
- Thêm `?api-version=...` vào từng request
- Dùng timeout request mặc định 600 giây cho các lệnh gọi tạo hình ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ nguyên dạng
request hình ảnh chuẩn của OpenAI.

<Note>
Định tuyến Azure cho đường dẫn tạo hình ảnh của provider `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xử lý mọi
`openai.baseUrl` tùy chỉnh như endpoint OpenAI công khai và sẽ thất bại với các
deployment hình ảnh Azure.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ
thể cho đường dẫn tạo hình ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Mặc định là `2024-12-01-preview` khi biến chưa được đặt.

### Tên model là tên deployment

Azure OpenAI liên kết model với deployment. Với các request tạo hình ảnh Azure
được định tuyến qua provider `openai` được đóng gói sẵn, trường `model` trong
OpenClaw phải là **tên deployment Azure** bạn đã cấu hình trong cổng Azure,
không phải id model OpenAI công khai.

Nếu bạn tạo một deployment tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên deployment tương tự áp dụng cho các lệnh gọi tạo hình ảnh được định
tuyến qua provider `openai` được đóng gói sẵn.

### Tính khả dụng theo khu vực

Tạo hình ảnh Azure hiện chỉ khả dụng ở một số khu vực
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
deployment, và xác nhận model cụ thể được cung cấp trong khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các
tham số hình ảnh. Azure có thể từ chối các tùy chọn mà OpenAI công khai cho
phép (ví dụ một số giá trị `background` trên `gpt-image-2`) hoặc chỉ cung cấp
chúng trên các phiên bản model cụ thể. Những khác biệt này đến từ Azure và
model nền tảng, không phải OpenClaw. Nếu một request Azure thất bại với lỗi xác
thực hợp lệ, hãy kiểm tra bộ tham số được hỗ trợ bởi deployment và phiên bản API
cụ thể của bạn trong cổng Azure.

<Note>
Azure OpenAI dùng transport gốc và hành vi tương thích nhưng không nhận các
header ghi công ẩn của OpenClaw — xem accordion **Route gốc so với route tương
thích OpenAI** trong [Cấu hình nâng cao](#advanced-configuration).

Với lưu lượng chat hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy dùng
luồng onboarding hoặc cấu hình provider Azure chuyên dụng — chỉ riêng
`openai.baseUrl` không áp dụng dạng API/xác thực Azure. Có một provider
`azure-openai-responses/*` riêng; xem accordion Compaction phía máy chủ bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Transport (WebSocket so với SSE)">
    OpenClaw ưu tiên WebSocket với phương án dự phòng SSE (`"auto"`) cho `openai/*`.

    Trong chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi chuyển về SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian hạ nhiệt
    - Gắn các header định danh phiên và lượt ổn định cho các lần thử lại và kết nối lại
    - Chuẩn hóa bộ đếm mức sử dụng (`input_tokens` / `prompt_tokens`) giữa các biến thể transport

    | Giá trị | Hành vi |
    |-------|----------|
    | `"auto"` (mặc định) | WebSocket trước, SSE dự phòng |
    | `"sse"` | Chỉ bắt buộc dùng SSE |
    | `"websocket"` | Chỉ bắt buộc dùng WebSocket |

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
    - [Phản hồi API streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Chế độ nhanh">
    OpenClaw cung cấp một công tắc chế độ nhanh dùng chung cho `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không ghi lại `reasoning` hoặc `text.verbosity`. `fastMode: "auto"` bắt đầu các lệnh gọi model mới ở chế độ nhanh cho đến ngưỡng cắt tự động, rồi bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục về sau mà không dùng chế độ nhanh. Ngưỡng cắt mặc định là 60 giây; đặt `params.fastAutoOnSeconds` trên model đang hoạt động để thay đổi.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Ghi đè phiên thắng cấu hình. Xóa ghi đè phiên trong Sessions UI sẽ đưa phiên về mặc định đã cấu hình.
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
    `serviceTier` chỉ được chuyển tiếp đến các endpoint OpenAI gốc (`api.openai.com`) và endpoint Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai provider qua proxy, OpenClaw để nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Với các model OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), wrapper luồng OpenClaw của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Bắt buộc `store: true` (trừ khi compat model đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không có)

    Điều này áp dụng cho đường dẫn runtime OpenClaw tích hợp sẵn và cho các hook provider OpenAI được dùng bởi các lượt chạy nhúng. Harness app-server Codex gốc tự quản lý ngữ cảnh của nó thông qua Codex và được cấu hình bởi route agent mặc định của OpenAI hoặc chính sách runtime provider/model.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các model OpenAI Responses trực tiếp vẫn bắt buộc `store: true` trừ khi compat đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT strict-agentic">
    Với các lượt chạy họ GPT-5 trên `openai/*`, OpenClaw có thể dùng một hợp đồng thực thi nhúng chặt chẽ hơn:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Với `strict-agentic`, OpenClaw:
    - Tự động bật `update_plan` cho công việc đáng kể
    - Thử lại các lượt trống về cấu trúc hoặc chỉ có reasoning bằng một lượt tiếp tục có câu trả lời hiển thị
    - Dùng các sự kiện kế hoạch harness rõ ràng khi harness đã chọn cung cấp chúng

    OpenClaw không phân loại văn xuôi của assistant để quyết định một lượt là kế hoạch, cập nhật tiến độ hay câu trả lời cuối cùng.

    <Note>
    Chỉ giới hạn cho các lượt chạy họ GPT-5 của OpenAI và Codex. Các provider khác và họ model cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Route gốc so với route tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI, Codex và Azure OpenAI trực tiếp khác với các proxy `/v1` tương thích OpenAI chung:

    **Route gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các model hỗ trợ effort `none` của OpenAI
    - Bỏ qua reasoning bị tắt cho các model hoặc proxy từ chối `reasoning.effort: "none"`
    - Đặt schema công cụ mặc định ở chế độ strict
    - Chỉ gắn header ghi công ẩn trên các host gốc đã xác minh
    - Giữ định dạng request chỉ dành cho OpenAI (`service_tier`, `store`, reasoning-compat, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Sử dụng hành vi tương thích linh hoạt hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không nguyên bản
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích với OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích với OpenAI như vLLM
    - Không bắt buộc schema công cụ nghiêm ngặt hoặc header chỉ dành cho bản nguyên gốc

    Azure OpenAI sử dụng truyền tải nguyên bản và hành vi tương thích nhưng không nhận các header ghi nhận ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu model và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Image generation" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn provider.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
