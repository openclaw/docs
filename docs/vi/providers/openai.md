---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi tác nhân GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI cung cấp API dành cho nhà phát triển cho các mô hình GPT, và Codex cũng có sẵn dưới dạng tác nhân lập trình trong gói ChatGPT thông qua các client Codex của OpenAI. OpenClaw dùng một id nhà cung cấp, `openai`, cho cả hai dạng xác thực.

OpenClaw dùng `openai/*` làm tuyến mô hình OpenAI chính tắc. Các lượt tác nhân nhúng trên mô hình OpenAI chạy qua runtime app-server Codex gốc theo mặc định; xác thực bằng khóa API OpenAI trực tiếp vẫn có sẵn cho các bề mặt OpenAI không phải tác nhân như hình ảnh, embedding, giọng nói và realtime.

- **Mô hình tác nhân** - các mô hình `openai/*` thông qua runtime Codex; đăng nhập bằng xác thực Codex để dùng thuê bao ChatGPT/Codex, hoặc cấu hình một hồ sơ dự phòng khóa API OpenAI tương thích với Codex khi bạn chủ ý muốn xác thực bằng khóa API.
- **API OpenAI không phải tác nhân** - truy cập OpenAI Platform trực tiếp với tính phí theo mức sử dụng thông qua `OPENAI_API_KEY` hoặc quy trình thiết lập khóa API OpenAI.
- **Cấu hình cũ** - các tham chiếu mô hình Codex cũ được `openclaw doctor --fix` sửa thành `openai/*` kèm runtime Codex.

OpenAI hỗ trợ rõ ràng việc dùng OAuth thuê bao trong các công cụ và quy trình làm việc bên ngoài như OpenClaw.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu các nhãn đó đang bị trộn lẫn, hãy đọc [Runtime tác nhân](/vi/concepts/agent-runtimes) trước khi thay đổi cấu hình.

## Chọn nhanh

| Mục tiêu                                             | Dùng                                                     | Ghi chú                                                               |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Thuê bao ChatGPT/Codex với runtime Codex gốc         | `openai/gpt-5.5`                                         | Thiết lập tác nhân OpenAI mặc định. Đăng nhập bằng xác thực Codex.    |
| Bản xem trước giới hạn GPT-5.6                       | `openai/gpt-5.6-sol`, `-terra`, hoặc `-luna`             | Yêu cầu tổ chức API được OpenAI phê duyệt hoặc workspace Codex.       |
| Tính phí khóa API trực tiếp cho mô hình tác nhân     | `openai/gpt-5.5` cộng hồ sơ khóa API tương thích Codex   | Dùng `auth.order.openai` để đặt dự phòng sau xác thực thuê bao.       |
| Tính phí khóa API trực tiếp thông qua OpenClaw rõ ràng | `openai/gpt-5.5` cộng runtime nhà cung cấp/mô hình `openclaw` | Chọn một hồ sơ khóa API `openai` thông thường.                        |
| Bí danh API ChatGPT Instant mới nhất                 | `openai/chat-latest`                                     | Chỉ khóa API trực tiếp. Bí danh di động cho thử nghiệm, không phải mặc định. |
| Xác thực thuê bao ChatGPT/Codex thông qua OpenClaw   | `openai/gpt-5.5` cộng runtime nhà cung cấp/mô hình `openclaw` | Chọn một hồ sơ OAuth `openai` cho tuyến tương thích.                  |
| Tạo hoặc chỉnh sửa hình ảnh                          | `openai/gpt-image-2`                                     | Hoạt động với `OPENAI_API_KEY` hoặc OpenAI Codex OAuth.               |
| Hình ảnh nền trong suốt                              | `openai/gpt-image-1.5`                                   | Dùng `outputFormat=png` hoặc `webp` và `openai.background=transparent`. |

## Bản đồ tên gọi

Các tên tương tự nhau nhưng không thể thay thế cho nhau:

| Tên bạn thấy                            | Lớp               | Ý nghĩa                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Tiền tố nhà cung cấp | Tuyến mô hình OpenAI chính tắc; lượt tác nhân dùng runtime Codex.                                 |
| tiền tố OpenAI Codex cũ                 | Tiền tố cũ        | Không gian tên mô hình/hồ sơ cũ. `openclaw doctor --fix` di chuyển nó sang `openai`.              |
| Plugin `codex`                          | Plugin            | Plugin OpenClaw đi kèm cung cấp runtime app-server Codex gốc và điều khiển trò chuyện `/codex`.  |
| nhà cung cấp/mô hình `agentRuntime.id: codex` | Runtime tác nhân  | Buộc dùng harness app-server Codex gốc cho các lượt nhúng khớp.                                   |
| `/codex ...`                            | Bộ lệnh trò chuyện | Liên kết/điều khiển các luồng app-server Codex từ một cuộc trò chuyện.                            |
| `runtime: "acp", agentId: "codex"`      | Tuyến phiên ACP   | Đường dự phòng rõ ràng chạy Codex thông qua ACP/acpx.                                             |

Điều này có nghĩa là một cấu hình có thể chủ ý chứa tham chiếu mô hình `openai/*` trong khi các hồ sơ xác thực trỏ tới thông tin đăng nhập khóa API hoặc OAuth ChatGPT/Codex. Dùng `auth.order.openai` cho cấu hình; `openclaw doctor --fix` ghi lại các tham chiếu mô hình Codex cũ, id hồ sơ xác thực Codex cũ và thứ tự xác thực Codex cũ sang tuyến OpenAI chính tắc.

<Note>
GPT-5.5 có sẵn thông qua cả truy cập khóa API OpenAI Platform trực tiếp và các tuyến thuê bao/OAuth. Với thuê bao ChatGPT/Codex cộng thực thi Codex gốc, dùng `openai/gpt-5.5`; cấu hình runtime chưa đặt hiện chọn harness Codex cho lượt tác nhân OpenAI. Chỉ dùng hồ sơ khóa API OpenAI khi bạn muốn xác thực khóa API trực tiếp cho một mô hình tác nhân OpenAI.
</Note>

## Bản xem trước giới hạn GPT-5.6

OpenClaw nhận diện ba id mô hình GPT-5.6 công khai:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Cả ba đều cung cấp suy luận `max` trong catalog app-server Codex hiện tại. Thông báo ra mắt của OpenAI mô tả Sol là tầng chủ lực, Terra là tầng cân bằng và Luna là tầng nhanh, chi phí thấp hơn. Xem [thông báo ra mắt GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) và [hướng dẫn truy cập bản xem trước](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Quyền truy cập được đưa vào danh sách cho phép trong thời gian xem trước và có thể được cấp riêng cho API và Codex. Chỉ một gói ChatGPT trả phí không cấp quyền truy cập. OpenClaw giữ `openai/gpt-5.5` làm mặc định; chọn một tham chiếu GPT-5.6 khi không có quyền truy cập sẽ trả về lỗi truy cập từ upstream thay vì âm thầm chuyển dự phòng.

<Note>
Các lượt mô hình tác nhân OpenAI yêu cầu Plugin app-server Codex đi kèm. Cấu hình runtime OpenClaw rõ ràng vẫn có sẵn như một tuyến tương thích chọn tham gia. Khi OpenClaw được chọn rõ ràng với một hồ sơ OAuth `openai`, OpenClaw giữ tham chiếu mô hình công khai là `openai/*` và định tuyến nội bộ qua transport xác thực Codex. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình Codex cũ, `codex-cli/*`, hoặc các ghim phiên runtime cũ không đến từ cấu hình runtime rõ ràng.
</Note>

## Phạm vi tính năng OpenClaw

| Khả năng OpenAI          | Bề mặt OpenClaw                                                                               | Trạng thái                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | nhà cung cấp mô hình `openai/<model>`                                                         | Có                                                                     |
| Mô hình thuê bao Codex    | `openai/<model>` với OpenAI OAuth                                                             | Có                                                                     |
| Tham chiếu mô hình Codex cũ | tham chiếu mô hình Codex cũ hoặc `codex-cli/<model>`                                          | Được doctor sửa thành `openai/<model>`                                 |
| Harness app-server Codex  | `openai/<model>` với runtime bị bỏ qua hoặc nhà cung cấp/mô hình `agentRuntime.id: codex`     | Có                                                                     |
| Tìm kiếm web phía máy chủ | Công cụ OpenAI Responses gốc                                                                  | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp               |
| Hình ảnh                  | `image_generate`                                                                              | Có                                                                     |
| Video                     | `video_generate`                                                                              | Có                                                                     |
| Chuyển văn bản thành giọng nói | `messages.tts.provider: "openai"` / `tts`                                                     | Có                                                                     |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio` / hiểu phương tiện                                                        | Có                                                                     |
| Chuyển giọng nói thành văn bản streaming | Voice Call `streaming.provider: "openai"`                                                     | Có                                                                     |
| Giọng nói realtime        | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Có (yêu cầu credit OpenAI Platform, không phải thuê bao Codex/ChatGPT) |
| Embedding                 | nhà cung cấp embedding bộ nhớ                                                                 | Có                                                                     |

<Note>
  Giọng nói OpenAI Realtime (được Voice Call dùng với `realtime.provider: "openai"` và
  Control UI Talk với `talk.realtime.provider: "openai"`) đi qua
  **OpenAI Platform Realtime API** công khai, được tính phí vào credit OpenAI
  Platform thay vì hạn mức thuê bao Codex/ChatGPT. Một tài khoản
  có OpenAI OAuth hoạt động tốt để chạy các mô hình chat dựa trên Codex không gặp lỗi
  vẫn cần hồ sơ xác thực khóa API OpenAI hoặc khóa API Platform có
  thanh toán Platform đủ tiền cho giọng nói Realtime.

Cách sửa: nạp credit Platform tại
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
cho tổ chức đứng sau thông tin đăng nhập realtime của bạn. Giọng nói Realtime chấp nhận
hồ sơ xác thực khóa API `openai` được tạo bởi `openclaw onboard --auth-choice openai-api-key`,
một `OPENAI_API_KEY` Platform được cấu hình qua `talk.realtime.providers.openai.apiKey`
cho Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
cho Voice Call, hoặc biến môi trường `OPENAI_API_KEY`. Các hồ sơ OpenAI OAuth
vẫn có thể chạy mô hình chat `openai/*` dựa trên Codex trong cùng bản cài đặt
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

Đối với các endpoint tương thích OpenAI yêu cầu nhãn embedding bất đối xứng, hãy đặt
`queryInputType` và `documentInputType` dưới `memorySearch`. OpenClaw chuyển tiếp
chúng dưới dạng các trường yêu cầu `input_type` riêng theo nhà cung cấp: embedding truy vấn dùng
`queryInputType`; các đoạn bộ nhớ được lập chỉ mục và lập chỉ mục theo lô dùng
`documentInputType`. Xem [tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config) để có ví dụ đầy đủ.

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
      <Step title="Xác minh mô hình khả dụng">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình       | Cấu hình runtime           | Tuyến                       | Xác thực         |
    | ------------------------ | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | bỏ qua / provider/model `agentRuntime.id: "codex"` | Bộ harness app-server Codex | Hồ sơ OpenAI tương thích với Codex |
    | `openai/gpt-5.4-mini` | bỏ qua / provider/model `agentRuntime.id: "codex"` | Bộ harness app-server Codex | Hồ sơ OpenAI tương thích với Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | Runtime nhúng OpenClaw      | Hồ sơ `openai` đã chọn |

    <Note>
    Các mô hình tác tử `openai/*` dùng bộ harness app-server Codex. Để dùng xác thực
    bằng khóa API cho một mô hình tác tử, hãy tạo hồ sơ khóa API tương thích với Codex và sắp xếp
    hồ sơ đó bằng `auth.order.openai`; `OPENAI_API_KEY` vẫn là phương án dự phòng trực tiếp cho
    các bề mặt API OpenAI không phải tác tử. Chạy `openclaw doctor --fix` để di chuyển các
    mục thứ tự xác thực Codex kế thừa cũ hơn.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Để thử mô hình Instant hiện tại của ChatGPT từ API OpenAI, hãy đặt mô hình
    thành `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` là một bí danh thay đổi theo thời gian. OpenAI ghi nhận đây là mô hình Instant mới nhất
    dùng trong ChatGPT và khuyến nghị `gpt-5.5` cho việc dùng API trong môi trường sản xuất, vì vậy
    hãy giữ `openai/gpt-5.5` làm mặc định ổn định trừ khi bạn thực sự muốn hành vi
    bí danh đó. Bí danh này hiện chỉ chấp nhận độ chi tiết văn bản `medium`, vì vậy
    OpenClaw chuẩn hóa các ghi đè độ chi tiết văn bản OpenAI không tương thích cho
    mô hình này.

    <Warning>
    OpenClaw **không** hiển thị `gpt-5.3-codex-spark` trên tuyến khóa API OpenAI trực tiếp. Mô hình này chỉ khả dụng qua các mục danh mục gói đăng ký Codex khi tài khoản đã đăng nhập của bạn hiển thị mô hình đó.
    </Warning>

  </Tab>

  <Tab title="Gói đăng ký Codex">
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

        Với thiết lập không giao diện hoặc không thuận lợi cho callback, hãy thêm `--device-code` để đăng nhập bằng luồng mã thiết bị ChatGPT thay vì callback trình duyệt localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Dùng tuyến mô hình OpenAI chuẩn">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Đường dẫn mặc định không yêu cầu cấu hình runtime. Các lượt tác tử OpenAI
        tự động chọn runtime app-server Codex gốc, và OpenClaw
        cài đặt hoặc sửa Plugin Codex đóng gói khi tuyến này được chọn.
      </Step>
      <Step title="Xác minh xác thực Codex khả dụng">
        ```bash
        openclaw models list --provider openai
        ```

        Sau khi Gateway đang chạy, gửi `/codex status` hoặc `/codex models`
        trong cuộc trò chuyện để xác minh runtime app-server gốc.
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình | Cấu hình runtime | Tuyến | Xác thực |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | bỏ qua / provider/model `agentRuntime.id: "codex"` | Bộ harness app-server Codex gốc | Đăng nhập Codex hoặc hồ sơ xác thực `openai` đã sắp xếp |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Runtime nhúng OpenClaw với kênh vận chuyển xác thực Codex nội bộ | Hồ sơ OAuth `openai` đã chọn |
    | tham chiếu Codex GPT-5.5 kế thừa | được doctor sửa | Tuyến kế thừa được viết lại thành `openai/gpt-5.5` | Hồ sơ OAuth OpenAI đã di chuyển |
    | `codex-cli/gpt-5.5` | được doctor sửa | Tuyến CLI kế thừa được viết lại thành `openai/gpt-5.5` | Xác thực app-server Codex |

    <Warning>
    Ưu tiên `openai/gpt-5.5` cho cấu hình tác tử mới có gói đăng ký hỗ trợ. Các
    tham chiếu GPT Codex kế thừa cũ hơn là tuyến OpenClaw kế thừa, không phải đường dẫn
    runtime Codex gốc; chạy `openclaw doctor --fix` khi bạn muốn di chuyển chúng sang các
    tham chiếu `openai/*` chuẩn. `gpt-5.3-codex-spark` vẫn giới hạn ở các tài khoản có
    danh mục gói đăng ký Codex quảng bá mô hình đó; các tham chiếu khóa API OpenAI trực tiếp và
    Azure cho mô hình này vẫn bị ẩn.
    </Warning>

    <Note>
    Tiền tố mô hình Codex kế thừa là cấu hình kế thừa được doctor sửa. Với
    thiết lập phổ biến gồm gói đăng ký cộng với runtime gốc, hãy đăng nhập bằng xác thực Codex
    nhưng giữ tham chiếu mô hình là `openai/gpt-5.5`. Cấu hình mới nên đặt thứ tự
    xác thực tác tử OpenAI dưới `auth.order.openai`; doctor di chuyển các
    mục thứ tự xác thực Codex kế thừa cũ hơn.
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

    Với bản sao lưu bằng khóa API, hãy giữ mô hình ở `openai/gpt-5.5` và đặt
    thứ tự xác thực dưới `openai`. OpenClaw sẽ thử gói đăng ký trước, rồi
    khóa API, trong khi vẫn ở trên bộ harness Codex:

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
    Onboarding không còn nhập vật liệu OAuth từ `~/.codex`. Đăng nhập bằng OAuth trên trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên — OpenClaw quản lý thông tin xác thực thu được trong kho xác thực tác tử riêng của nó.
    </Note>

    ### Kiểm tra và khôi phục định tuyến OAuth Codex

    Dùng các lệnh này để xem mô hình, runtime và tuyến xác thực mà tác tử
    mặc định của bạn đang dùng:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Với một tác tử cụ thể, thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Nếu cấu hình cũ hơn vẫn có tham chiếu GPT Codex kế thừa hoặc ghim phiên runtime OpenAI
    lỗi thời mà không có cấu hình runtime rõ ràng, hãy sửa:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai` không hiển thị hồ sơ dùng được, hãy đăng
    nhập lại:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Dùng `--profile-id` khi bạn muốn có nhiều lượt đăng nhập OAuth Codex trong cùng
    một tác tử và sau đó muốn kiểm soát chúng qua thứ tự xác thực hoặc `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` là tuyến mô hình cho các lượt tác tử OpenAI thông qua Codex. Chạy
    `openclaw doctor --fix` để di chuyển các id hồ sơ tiền tố OpenAI Codex kế thừa cũ hơn và
    các mục thứ tự trước khi dựa vào thứ tự hồ sơ.

    ### Chỉ báo trạng thái

    Cuộc trò chuyện `/status` hiển thị runtime mô hình nào đang hoạt động cho phiên hiện tại.
    Bộ harness app-server Codex đóng gói xuất hiện dưới dạng `Runtime: OpenAI Codex` cho
    các lượt mô hình tác tử OpenAI. Các ghim phiên runtime OpenAI lỗi thời được sửa thành Codex trừ khi
    cấu hình ghim OpenClaw rõ ràng.

    ### Cảnh báo doctor

    Nếu các tham chiếu mô hình Codex kế thừa hoặc ghim runtime OpenAI lỗi thời vẫn còn trong cấu hình hoặc
    trạng thái phiên, `openclaw doctor --fix` viết lại chúng thành `openai/*` với
    runtime Codex trừ khi OpenClaw được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw xử lý siêu dữ liệu mô hình và giới hạn ngữ cảnh runtime như các giá trị riêng biệt.

    Với `openai/gpt-5.5` qua danh mục OAuth Codex:

    - `contextWindow` gốc: `1000000`
    - Giới hạn `contextTokens` runtime mặc định: `272000`

    Giới hạn mặc định nhỏ hơn có đặc tính độ trễ và chất lượng tốt hơn trong thực tế. Ghi đè bằng `contextTokens`:

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
    Dùng `contextWindow` để khai báo siêu dữ liệu mô hình gốc. Dùng `contextTokens` để giới hạn ngân sách ngữ cảnh runtime.
    </Note>

    ### Khôi phục danh mục

    OpenClaw dùng siêu dữ liệu danh mục Codex thượng nguồn cho `gpt-5.5` khi dữ liệu đó
    hiện diện. Nếu phát hiện Codex trực tiếp bỏ qua hàng `gpt-5.5` trong khi
    tài khoản đã được xác thực, OpenClaw tổng hợp hàng mô hình OAuth đó để
    các lần chạy cron, tác tử phụ và mô hình mặc định đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Bộ harness app-server Codex gốc dùng các tham chiếu mô hình `openai/*` cộng với cấu hình
runtime bị bỏ qua hoặc provider/model `agentRuntime.id: "codex"`, nhưng xác thực của nó
vẫn dựa trên tài khoản. OpenClaw chọn xác thực theo thứ tự này:

1. Các hồ sơ xác thực OpenAI đã sắp xếp cho tác tử, tốt nhất là dưới
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di chuyển các id hồ sơ
   xác thực Codex kế thừa cũ hơn và thứ tự xác thực Codex kế thừa.
2. Tài khoản hiện có của app-server, chẳng hạn như một lượt đăng nhập ChatGPT bằng Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi app-server báo cáo không có tài khoản và vẫn yêu cầu
   xác thực OpenAI.

Điều đó có nghĩa là một lượt đăng nhập gói đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ
vì tiến trình Gateway cũng có `OPENAI_API_KEY` cho các mô hình OpenAI trực tiếp
hoặc embedding. Phương án dự phòng khóa API qua env chỉ là đường dẫn stdio cục bộ không có tài khoản; nó
không được gửi tới các kết nối app-server WebSocket. Khi một hồ sơ Codex kiểu gói đăng ký
được chọn, OpenClaw cũng giữ `CODEX_API_KEY` và `OPENAI_API_KEY`
khỏi tiến trình con app-server stdio được sinh ra và gửi thông tin xác thực đã chọn
qua RPC đăng nhập app-server. Khi hồ sơ gói đăng ký đó bị chặn bởi
giới hạn sử dụng Codex, OpenClaw có thể xoay sang hồ sơ khóa API `openai:*` đã sắp xếp
tiếp theo mà không thay đổi mô hình đã chọn hoặc rời khỏi bộ harness
Codex. Khi thời điểm đặt lại gói đăng ký trôi qua, hồ sơ gói đăng ký sẽ
đủ điều kiện trở lại.

## Tạo hình ảnh

Plugin `openai` đóng gói đăng ký tạo hình ảnh thông qua công cụ `image_generate`.
Plugin này hỗ trợ cả tạo hình ảnh bằng khóa API OpenAI và tạo hình ảnh bằng OAuth Codex
thông qua cùng tham chiếu mô hình `openai/gpt-image-2`.

| Khả năng                 | Khóa API OpenAI                   | Codex OAuth                                |
| ------------------------ | --------------------------------- | ------------------------------------------ |
| Tham chiếu mô hình       | `openai/gpt-image-2`              | `openai/gpt-image-2`                       |
| Xác thực                 | `OPENAI_API_KEY`                  | Đăng nhập OpenAI Codex OAuth               |
| Truyền tải               | OpenAI Images API                 | Backend Codex Responses                    |
| Số ảnh tối đa mỗi yêu cầu | 4                                 | 4                                          |
| Chế độ chỉnh sửa         | Đã bật (tối đa 5 ảnh tham chiếu)  | Đã bật (tối đa 5 ảnh tham chiếu)           |
| Ghi đè kích thước        | Được hỗ trợ, bao gồm kích thước 2K/4K | Được hỗ trợ, bao gồm kích thước 2K/4K  |
| Tỷ lệ khung hình / độ phân giải | Không được chuyển tiếp tới OpenAI Images API | Được ánh xạ sang một kích thước được hỗ trợ khi an toàn |

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

`gpt-image-2` là mặc định cho cả tạo ảnh từ văn bản bằng OpenAI và chỉnh sửa
ảnh. `gpt-image-1.5`, `gpt-image-1` và `gpt-image-1-mini` vẫn có thể dùng làm
ghi đè mô hình rõ ràng. Dùng `openai/gpt-image-1.5` cho đầu ra PNG/WebP có nền
trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Đối với yêu cầu nền trong suốt, agent nên gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ hơn
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và
OpenAI Codex OAuth bằng cách viết lại các yêu cầu trong suốt mặc định
`openai/gpt-image-2` thành `gpt-image-1.5`; Azure và các endpoint tương thích
OpenAI tùy chỉnh giữ nguyên tên triển khai/mô hình đã cấu hình của chúng.

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
`--openai-background` vẫn có sẵn như một bí danh dành riêng cho OpenAI.
Dùng `--quality low|medium|high|auto` khi bạn cần kiểm soát chất lượng và chi phí
OpenAI Images. Dùng `--openai-moderation low|auto` để truyền gợi ý kiểm duyệt
dành riêng cho nhà cung cấp của OpenAI từ `image generate` hoặc `image edit`.

Đối với các bản cài đặt ChatGPT/Codex OAuth, giữ nguyên tham chiếu
`openai/gpt-image-2`. Khi hồ sơ OAuth `openai` được cấu hình, OpenClaw phân giải
mã thông báo truy cập OAuth đã lưu đó và gửi yêu cầu ảnh qua backend Codex Responses. Nó
không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển về khóa API cho yêu cầu đó.
Cấu hình rõ ràng `models.providers.openai` với khóa API, URL cơ sở tùy chỉnh,
hoặc endpoint Azure khi bạn muốn dùng tuyến OpenAI Images API trực tiếp thay thế.
Nếu endpoint ảnh tùy chỉnh đó nằm trên một địa chỉ LAN/riêng tư đáng tin cậy,
cũng đặt `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tiếp tục
chặn các endpoint ảnh tương thích OpenAI riêng tư/nội bộ trừ khi có tùy chọn tham gia này.

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

Plugin `openai` đi kèm đăng ký tính năng tạo video thông qua công cụ `video_generate`.

| Khả năng        | Giá trị                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Mô hình mặc định | `openai/sora-2`                                                                  |
| Chế độ          | Văn bản thành video, ảnh thành video, chỉnh sửa một video                         |
| Đầu vào tham chiếu | 1 ảnh hoặc 1 video                                                             |
| Ghi đè kích thước | Được hỗ trợ cho văn bản thành video và ảnh thành video                         |
| Ghi đè khác     | `aspectRatio`, `resolution`, `audio`, `watermark` bị bỏ qua kèm cảnh báo công cụ |

Yêu cầu ảnh thành video của OpenAI dùng `POST /v1/videos` với một
`input_reference` ảnh. Chỉnh sửa một video dùng `POST /v1/videos/edits` với
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

OpenClaw thêm một đóng góp prompt GPT-5 dùng chung cho các lần chạy thuộc họ GPT-5 trên các bề mặt prompt do OpenClaw lắp ráp. Nó áp dụng theo id mô hình, vì vậy các tuyến OpenClaw/nhà cung cấp như tham chiếu cũ trước sửa chữa (tham chiếu Codex GPT-5.5 cũ), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` và các tham chiếu GPT-5 tương thích khác đều nhận cùng lớp phủ. Các mô hình GPT-4.x cũ hơn thì không.

Bộ khai thác Codex gốc đi kèm không nhận lớp phủ GPT-5 OpenClaw này thông qua chỉ dẫn nhà phát triển của app-server Codex. Codex gốc giữ hành vi cơ sở, mô hình và tài liệu dự án do Codex sở hữu, trong khi OpenClaw tắt tính cách tích hợp của Codex cho các luồng gốc để các tệp tính cách workspace của agent vẫn có thẩm quyền. OpenClaw chỉ đóng góp ngữ cảnh runtime như phân phối kênh, công cụ động OpenClaw, ủy quyền ACP, ngữ cảnh workspace và Skills OpenClaw.

Đóng góp GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho duy trì persona, an toàn thực thi, kỷ luật công cụ, hình dạng đầu ra, kiểm tra hoàn tất và xác minh trên các prompt do OpenClaw lắp ráp phù hợp. Hành vi trả lời theo kênh và tin nhắn im lặng vẫn nằm trong prompt hệ thống OpenClaw dùng chung và chính sách phân phối gửi đi. Lớp phong cách tương tác thân thiện là riêng biệt và có thể cấu hình.

| Giá trị                | Hiệu lực                                  |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện   |
| `"on"`                 | Bí danh cho `"friendly"`                  |
| `"off"`                | Chỉ tắt lớp phong cách thân thiện         |

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
Giá trị không phân biệt chữ hoa chữ thường ở runtime, vì vậy `"Off"` và `"off"` đều tắt lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc như một dự phòng tương thích khi thiết lập dùng chung `agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp giọng nói (TTS)">
    Plugin `openai` đi kèm đăng ký tổng hợp giọng nói cho bề mặt `messages.tts`.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Giọng | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Tốc độ | `messages.tts.providers.openai.speed` | (chưa đặt) |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions` | (chưa đặt, chỉ `gpt-4o-mini-tts`) |
    | Định dạng | `messages.tts.providers.openai.responseFormat` | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API | `messages.tts.providers.openai.apiKey` | Chuyển về `OPENAI_API_KEY` |
    | URL cơ sở | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Phần thân bổ sung | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt) |

    Các mô hình có sẵn: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng có sẵn: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường do OpenClaw tạo, vì vậy hãy dùng nó cho các endpoint tương thích OpenAI yêu cầu khóa bổ sung như `lang`. Các khóa nguyên mẫu bị bỏ qua.

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
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở TTS mà không ảnh hưởng tới endpoint API chat. OpenAI TTS và giọng nói Realtime đều được cấu hình thông qua khóa API OpenAI Platform; các bản cài đặt chỉ OAuth vẫn có thể dùng các mô hình chat dựa trên Codex, nhưng không dùng được phản hồi thoại trực tiếp của OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Lời nói thành văn bản">
    Plugin `openai` đi kèm đăng ký lời nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu phương tiện của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được OpenClaw hỗ trợ ở bất cứ nơi nào phiên âm âm thanh đến dùng
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

    Gợi ý ngôn ngữ và prompt được chuyển tiếp tới OpenAI khi được cung cấp bởi
    cấu hình phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm theo từng lần gọi.

  </Accordion>

  <Accordion title="Phiên âm Realtime">
    Plugin `openai` đi kèm đăng ký phiên âm realtime cho Plugin Voice Call.

    | Thiết lập | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ | `...openai.language` | (chưa đặt) |
    | Prompt | `...openai.prompt` | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `800` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Xác thực | `...openai.apiKey`, `OPENAI_API_KEY`, hoặc OAuth `openai` | Khóa API kết nối trực tiếp; OAuth cấp một bí mật khách phiên âm Realtime |

    <Note>
    Dùng kết nối WebSocket tới `wss://api.openai.com/v1/realtime` với âm thanh G.711 u-law (`g711_ulaw` / `audio/pcmu`). Khi chỉ OAuth `openai` được cấu hình, Gateway cấp một bí mật khách phiên âm Realtime tạm thời trước khi mở WebSocket. Nhà cung cấp phát trực tuyến này dành cho đường dẫn phiên âm realtime của Voice Call; giọng nói Discord hiện ghi lại các đoạn ngắn và dùng đường dẫn phiên âm theo lô `tools.media.audio` thay thế.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói Realtime">
    Plugin `openai` đi kèm đăng ký giọng nói realtime cho Plugin Voice Call.

    | Cài đặt | Đường dẫn cấu hình | Mặc định |
    |---------|------------|---------|
    | Mô hình | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Giọng nói | `...openai.voice` | `alloy` |
    | Nhiệt độ (cầu nối triển khai Azure) | `...openai.temperature` | `0.8` |
    | Ngưỡng VAD | `...openai.vadThreshold` | `0.5` |
    | Thời lượng im lặng | `...openai.silenceDurationMs` | `500` |
    | Phần đệm tiền tố | `...openai.prefixPaddingMs` | `300` |
    | Mức nỗ lực suy luận | `...openai.reasoningEffort` | (chưa đặt) |
    | Xác thực | Hồ sơ xác thực khóa API `openai`, `...openai.apiKey`, hoặc `OPENAI_API_KEY` | Yêu cầu khóa API OpenAI Platform; OpenAI OAuth không cấu hình giọng nói Realtime |

    Các giọng nói Realtime tích hợp sẵn có cho `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI khuyến nghị `marin` và `cedar` để có chất lượng Realtime tốt nhất. Đây
    là một tập riêng với các giọng Text-to-speech ở trên; đừng giả định một giọng TTS
    như `fable`, `nova`, hoặc `onyx` là hợp lệ cho phiên Realtime.

    <Note>
    Các cầu nối realtime OpenAI backend dùng hình dạng phiên Realtime WebSocket GA, vốn không chấp nhận `session.temperature`. Các triển khai Azure OpenAI vẫn khả dụng qua `azureEndpoint` và `azureDeployment` và giữ hình dạng phiên tương thích với triển khai. Hỗ trợ gọi công cụ hai chiều và âm thanh G.711 u-law.
    </Note>

    <Note>
    Giọng nói Realtime được chọn khi phiên được tạo. OpenAI cho phép hầu hết
    các trường phiên thay đổi về sau, nhưng không thể thay đổi giọng nói sau khi
    mô hình đã phát âm thanh trong phiên đó. OpenClaw hiện hiển thị các
    id giọng nói Realtime tích hợp sẵn dưới dạng chuỗi.
    </Note>

    <Note>
    Control UI Talk dùng các phiên realtime trên trình duyệt của OpenAI với một
    bí mật máy khách tạm thời do Gateway phát hành và trao đổi WebRTC SDP trực tiếp trên trình duyệt với
    OpenAI Realtime API. Gateway phát hành bí mật máy khách đó bằng hồ sơ xác thực khóa API
    `openai` đã chọn hoặc khóa API OpenAI Platform đã cấu hình. Cầu nối Gateway
    relay và Voice Call backend realtime WebSocket dùng cùng
    đường dẫn xác thực chỉ khóa API cho các endpoint OpenAI gốc. Có thể xác minh trực tiếp dành cho maintainer bằng
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    các nhánh OpenAI xác minh cả cầu nối WebSocket backend và trao đổi
    WebRTC SDP trên trình duyệt mà không ghi log bí mật.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Provider `openai` đi kèm có thể nhắm đến một tài nguyên Azure OpenAI để tạo
ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo ảnh, OpenClaw
phát hiện tên máy chủ Azure trên `models.providers.openai.baseUrl` và tự động chuyển sang
hình dạng yêu cầu của Azure.

<Note>
Giọng nói Realtime dùng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem accordion **Giọng nói
Realtime** trong [Giọng nói và lời nói](#voice-and-speech) để biết các cài đặt Azure
của nó.
</Note>

Dùng Azure OpenAI khi:

- Bạn đã có gói đăng ký, quota, hoặc thỏa thuận doanh nghiệp Azure OpenAI
- Bạn cần lưu trú dữ liệu theo khu vực hoặc các kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng trong một tenancy Azure hiện có

### Cấu hình

Để tạo ảnh qua Azure bằng provider `openai` đi kèm, trỏ
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

OpenClaw nhận diện các hậu tố máy chủ Azure này cho tuyến tạo ảnh Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Với các yêu cầu tạo ảnh trên máy chủ Azure được nhận diện, OpenClaw:

- Gửi header `api-key` thay vì `Authorization: Bearer`
- Dùng các đường dẫn theo phạm vi triển khai (`/openai/deployments/{deployment}/...`)
- Gắn `?api-version=...` vào mỗi yêu cầu
- Dùng thời gian chờ yêu cầu mặc định 600 giây cho các lệnh gọi tạo ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) giữ hình dạng
yêu cầu ảnh OpenAI chuẩn.

<Note>
Định tuyến Azure cho đường dẫn tạo ảnh của provider `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xử lý mọi
`openai.baseUrl` tùy chỉnh như endpoint OpenAI công khai và sẽ lỗi với các
triển khai ảnh Azure.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để ghim một phiên bản Azure preview hoặc GA cụ thể
cho đường dẫn tạo ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Mặc định là `2024-12-01-preview` khi biến này chưa được đặt.

### Tên mô hình là tên triển khai

Azure OpenAI liên kết mô hình với các triển khai. Đối với yêu cầu tạo ảnh Azure
được định tuyến qua provider `openai` đi kèm, trường `model` trong OpenClaw
phải là **tên triển khai Azure** mà bạn đã cấu hình trong cổng Azure, không phải
id mô hình OpenAI công khai.

Nếu bạn tạo một triển khai tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Quy tắc tên triển khai tương tự áp dụng cho các lệnh gọi tạo ảnh được định tuyến qua
provider `openai` đi kèm.

### Tính khả dụng theo khu vực

Tạo ảnh Azure hiện chỉ khả dụng ở một số khu vực
(ví dụ `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
triển khai, và xác nhận mô hình cụ thể được cung cấp ở khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng tham số ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
giá trị `background` trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản
mô hình cụ thể. Những khác biệt này đến từ Azure và mô hình nền tảng, không phải
OpenClaw. Nếu một yêu cầu Azure lỗi với lỗi xác thực hợp lệ, hãy kiểm tra
tập tham số được hỗ trợ bởi triển khai và phiên bản API cụ thể của bạn trong
cổng Azure.

<Note>
Azure OpenAI dùng transport gốc và hành vi tương thích nhưng không nhận
các header ghi công ẩn của OpenClaw — xem accordion **Tuyến gốc và tương thích OpenAI**
trong [Cấu hình nâng cao](#advanced-configuration).

Đối với lưu lượng chat hoặc Responses trên Azure (ngoài tạo ảnh), hãy dùng
luồng onboarding hoặc một cấu hình provider Azure chuyên dụng — chỉ riêng `openai.baseUrl`
không nhận hình dạng API/xác thực Azure. Có một provider
`azure-openai-responses/*` riêng; xem accordion Compaction phía máy chủ bên dưới.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Transport (WebSocket và SSE)">
    OpenClaw ưu tiên WebSocket với phương án dự phòng SSE (`"auto"`) cho `openai/*`.

    Ở chế độ `"auto"`, OpenClaw:
    - Thử lại một lỗi WebSocket sớm trước khi chuyển sang SSE
    - Sau một lỗi, đánh dấu WebSocket là suy giảm trong khoảng 60 giây và dùng SSE trong thời gian chờ nguội
    - Gắn các header định danh phiên và lượt ổn định cho các lần thử lại và kết nối lại
    - Chuẩn hóa bộ đếm sử dụng (`input_tokens` / `prompt_tokens`) giữa các biến thể transport

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
    - [Phản hồi API streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Chế độ nhanh">
    OpenClaw cung cấp một công tắc chế độ nhanh dùng chung cho `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được giữ nguyên, và chế độ nhanh không viết lại `reasoning` hoặc `text.verbosity`. `fastMode: "auto"` bắt đầu các lệnh gọi mô hình mới ở chế độ nhanh cho đến ngưỡng tự động, rồi bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ, hoặc tiếp tục sau đó mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây; đặt `params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.

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
    `serviceTier` chỉ được chuyển tiếp đến các endpoint OpenAI gốc (`api.openai.com`) và endpoint Codex gốc (`chatgpt.com/backend-api`). Nếu bạn định tuyến một trong hai provider qua proxy, OpenClaw giữ nguyên `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc stream OpenClaw của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Buộc `store: true` (trừ khi tương thích mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi không khả dụng)

    Điều này áp dụng cho đường dẫn runtime OpenClaw tích hợp sẵn và cho các hook provider OpenAI được dùng bởi các lần chạy nhúng. Harness app-server Codex gốc quản lý ngữ cảnh riêng thông qua Codex và được cấu hình bởi tuyến agent mặc định của OpenAI hoặc chính sách runtime provider/mô hình.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`. Các mô hình OpenAI Responses trực tiếp vẫn buộc `store: true` trừ khi tương thích đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT tác tử nghiêm ngặt">
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
    - Thử lại các lượt trống về mặt cấu trúc hoặc chỉ có lập luận bằng phần tiếp nối có câu trả lời hiển thị
    - Dùng các sự kiện kế hoạch rõ ràng của harness khi harness được chọn cung cấp chúng

    OpenClaw không phân loại văn xuôi của trợ lý để quyết định một lượt là kế hoạch, cập nhật tiến độ hay câu trả lời cuối cùng.

    <Note>
    Chỉ áp dụng cho các lượt chạy họ GPT-5 của OpenAI và Codex. Các nhà cung cấp khác và họ mô hình cũ hơn giữ hành vi mặc định.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint OpenAI trực tiếp, Codex và Azure OpenAI khác với các proxy `/v1` tương thích OpenAI chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ mức nỗ lực `none` của OpenAI
    - Bỏ qua reasoning bị tắt cho các mô hình hoặc proxy từ chối `reasoning.effort: "none"`
    - Mặc định đặt schema công cụ ở chế độ nghiêm ngặt
    - Chỉ gắn header phân bổ ẩn trên các host gốc đã xác minh
    - Giữ định dạng yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`, tương thích reasoning, gợi ý prompt-cache)

    **Tuyến proxy/tương thích:**
    - Dùng hành vi tương thích lỏng hơn
    - Loại bỏ `store` của Completions khỏi payload `openai-completions` không phải gốc
    - Chấp nhận JSON truyền qua nâng cao `params.extra_body`/`params.extraBody` cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI như vLLM
    - Không ép buộc schema công cụ nghiêm ngặt hoặc header chỉ dành cho tuyến gốc

    Azure OpenAI dùng transport gốc và hành vi tương thích nhưng không nhận các header phân bổ ẩn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
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
