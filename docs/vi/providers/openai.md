---
read_when:
    - Bạn muốn sử dụng các mô hình OpenAI trong OpenClaw
    - Bạn muốn sử dụng phương thức xác thực bằng gói đăng ký Codex thay vì khóa API
    - Bạn cần hành vi thực thi agent GPT-5 nghiêm ngặt hơn
summary: Sử dụng OpenAI qua khóa API hoặc gói đăng ký Codex trong OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-19T06:00:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f06ea8a31ac079232090f34232d520677afdf08d5ef5525b908229d2bce90bfd
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw sử dụng một id nhà cung cấp duy nhất, `openai`, cho cả xác thực trực tiếp bằng khóa API và
xác thực bằng gói đăng ký ChatGPT/Codex. `openai/*` là tuyến mô hình chuẩn.
Đối với các lượt tác tử nhúng có chính sách runtime chưa được đặt hoặc là `auto`, các
thông tin tuyến của OpenAI quyết định liệu OpenClaw có thể ngầm chọn runtime
máy chủ ứng dụng Codex đi kèm hay không. Chỉ riêng tiền tố `openai/*` không chọn runtime.

- **Mô hình tác tử** - `openai/*` thông qua runtime được chọn bởi cấu hình
  `agentRuntime` rõ ràng hoặc chính sách tuyến ngầm định của OpenAI. Đăng nhập bằng xác thực Codex
  để sử dụng gói đăng ký ChatGPT/Codex, hoặc cấu hình hồ sơ xác thực
  bằng khóa API khi bạn muốn thanh toán dựa trên khóa.
- **API OpenAI không dành cho tác tử** - truy cập trực tiếp OpenAI Platform, tính phí theo mức sử dụng,
  thông qua `OPENAI_API_KEY` hoặc hồ sơ xác thực bằng khóa API `openai`.
- **Cấu hình cũ** - các tham chiếu `codex/*` và `openai-codex/*` được
  `openclaw doctor --fix` sửa thành `openai/*` cùng với
  `agentRuntime.id: "codex"` có phạm vi theo mô hình.

OpenAI hỗ trợ rõ ràng việc sử dụng OAuth của gói đăng ký trong các công cụ và
quy trình làm việc bên ngoài như OpenClaw.

## Theo dõi mức sử dụng và chi phí

OpenClaw tách biệt hạn ngạch gói đăng ký với việc tính phí API Platform:

- OAuth ChatGPT/Codex hiển thị gói đăng ký, các khoảng hạn ngạch và số dư tín dụng.
- `OPENAI_ADMIN_KEY` hiển thị 30 ngày chi phí tổ chức và mức sử dụng lượt hoàn thành do nhà cung cấp báo cáo trong mục **Mức sử dụng** của Control UI, bao gồm chi tiêu hằng ngày, tổng số yêu cầu/token, các mô hình hàng đầu và các danh mục chi phí.
- `OPENAI_PROJECT_ID` có thể giới hạn lịch sử Admin API trong một dự án.
- OpenClaw không bao giờ gửi `OPENAI_API_KEY` hoặc hồ sơ suy luận `openai` đến các API của tổ chức; những thông tin xác thực đó có thể thuộc về các điểm cuối tùy chỉnh, Azure hoặc cục bộ của tác tử.

Khóa Admin được chỉ định rõ ràng có độ ưu tiên cao hơn OAuth. Lịch sử do nhà cung cấp báo cáo không được hợp nhất với chi phí ước tính mà OpenClaw suy ra từ phiên; lịch sử này có thể bao gồm hoạt động API từ các máy khách khác và các điều chỉnh thanh toán phía nhà cung cấp.

Tài liệu [Bảng điều khiển mức sử dụng API](https://help.openai.com/en/articles/10478918) của OpenAI mô tả các yêu cầu về chủ sở hữu tổ chức và quyền Usage Dashboard rõ ràng để truy cập dữ liệu sử dụng.

Nhà cung cấp, mô hình, runtime và kênh là các lớp riêng biệt. Nếu những nhãn này
bị nhầm lẫn với nhau, hãy đọc [Runtime tác tử](/vi/concepts/agent-runtimes) trước khi
thay đổi cấu hình.

## Lựa chọn nhanh

| Mục tiêu                                           | Sử dụng                                                            | Ghi chú                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Gói đăng ký ChatGPT/Codex, runtime Codex gốc      | `openai/gpt-5.6-sol`                                               | Thiết lập gói đăng ký mới; đăng nhập bằng xác thực Codex.           |
| Thanh toán trực tiếp bằng khóa API cho lượt tác tử | `openai/gpt-5.6` cùng hồ sơ xác thực khóa API có thứ tự            | Thiết lập khóa API mới; id API trực tiếp không định danh phân giải thành Sol. |
| Chọn chính xác một tầng GPT-5.6                   | `openai/gpt-5.6-sol`, `-terra` hoặc `-luna`                         | Kiểm tra `models list` để xem các tầng khả dụng cho tài khoản này. |
| Tài khoản không có quyền truy cập GPT-5.6         | `openai/gpt-5.5`                                                   | Lựa chọn khôi phục rõ ràng; OpenClaw không âm thầm hạ cấp.           |
| Thanh toán trực tiếp bằng khóa API, runtime OpenClaw rõ ràng | `openai/gpt-5.6` cùng `agentRuntime.id: "openclaw"` của nhà cung cấp/mô hình | Chọn hồ sơ khóa API `openai` thông thường.                 |
| Bí danh mô hình ChatGPT Instant mới nhất          | `openai/chat-latest`                                               | Chỉ dùng khóa API trực tiếp; đây là bí danh thay đổi, không phải mặc định ổn định. |
| Tạo hoặc chỉnh sửa hình ảnh                       | `openai/gpt-image-2`                                               | Hoạt động với `OPENAI_API_KEY` hoặc OAuth Codex.                  |
| Hình ảnh có nền trong suốt                        | `openai/gpt-image-1.5`                                             | Đặt `outputFormat` thành `png` hoặc `webp` và `background=transparent`. |

## Bản đồ tên gọi

| Tên bạn thấy                              | Lớp               | Ý nghĩa                                                                                  |
| ----------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                       | Tiền tố nhà cung cấp | Tuyến mô hình OpenAI chuẩn; thông tin tuyến xác định runtime ngầm định.                  |
| Plugin `codex`                | Plugin            | Plugin đi kèm cung cấp runtime máy chủ ứng dụng Codex gốc và các điều khiển trò chuyện `/codex`. |
| `agentRuntime.id: codex` của nhà cung cấp/mô hình | Runtime tác tử  | Buộc sử dụng bộ khung máy chủ ứng dụng Codex gốc cho các lượt nhúng khớp điều kiện.       |
| `/codex ...`                       | Tập lệnh trò chuyện | Liên kết/điều khiển các luồng máy chủ ứng dụng Codex từ một cuộc trò chuyện.             |
| `runtime: "acp", agentId: "codex"`                       | Tuyến phiên ACP   | Đường dự phòng rõ ràng chạy Codex thông qua ACP/acpx.                                    |

## Runtime tác tử ngầm định

Khi chính sách `agentRuntime` của nhà cung cấp/mô hình chưa được đặt hoặc là `auto`, chính sách
tuyến do nhà cung cấp OpenAI sở hữu sẽ chọn runtime ngầm định dựa trên
điểm cuối và bộ điều hợp có hiệu lực:

| Thông tin tuyến có hiệu lực                                                                                                                                             | Runtime ngầm định      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Điểm cuối HTTPS Platform chính thức chính xác với `openai-responses`, hoặc điểm cuối HTTPS ChatGPT chính thức chính xác với `openai-chatgpt-responses`; không có ghi đè yêu cầu do người dùng tạo | Có thể chọn Codex |
| Bộ điều hợp `openai-completions` do người dùng tạo                                                                                                                       | OpenClaw              |
| Điểm cuối tùy chỉnh                                                                                                                                                     | OpenClaw              |
| Điểm cuối chính thức chính xác được chỉ định rõ ràng bằng HTTP                                                                                                          | Bị từ chối            |
| Tuyến có ghi đè yêu cầu nhà cung cấp/mô hình do người dùng tạo                                                                                                          | OpenClaw              |

`agentRuntime.id` không mặc định và được chỉ định rõ ràng của nhà cung cấp/mô hình vẫn có thẩm quyền quyết định.
Ví dụ, `agentRuntime.id: "openclaw"` giữ một tuyến vốn đủ điều kiện dùng Codex
trên OpenClaw, trong khi `agentRuntime.id: "codex"` yêu cầu Codex và từ chối
khi tuyến có hiệu lực không được khai báo là tương thích với Codex.
Việc chọn runtime không thay đổi loại thông tin xác thực hoặc cách tính phí: xác thực
bằng khóa API Platform và xác thực bằng gói đăng ký ChatGPT/Codex vẫn tách biệt.

`openclaw doctor --fix` di chuyển các tham chiếu mô hình `codex/*` và `openai-codex/*`
cũ, id hồ sơ xác thực Codex cũ và các mục thứ tự xác thực Codex cũ sang
tuyến chuẩn `openai`. Các tham chiếu mô hình đã di chuyển nhận
`agentRuntime.id: "codex"` có phạm vi theo mô hình; dùng `auth.order.openai` cho cấu hình thứ tự xác thực mới.

<Note>
Thiết lập OpenAI mới chỉ áp dụng GPT-5.6 làm mô hình chính khi chưa cấu hình
mô hình chính. Việc thêm hoặc làm mới xác thực OpenAI giữ nguyên lựa chọn rõ ràng
hiện có, bao gồm `openai/gpt-5.5`, trừ khi bạn sử dụng rõ ràng
`models auth login --set-default` hoặc `models set`. Chỉ sử dụng hồ sơ xác thực
bằng khóa API khi bạn muốn xác thực bằng khóa API cho một mô hình tác tử.
</Note>

## Bản xem trước giới hạn của GPT-5.6

OpenClaw nhận dạng chính xác các id mô hình `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` và `openai/gpt-5.6-luna`. Cả ba đều cung cấp
khả năng suy luận `xhigh` và `max` trong danh mục hiện tại. OpenAI mô tả Sol là
tầng chủ lực, Terra là tầng cân bằng và Luna là tầng nhanh,
có chi phí thấp hơn. Xem
[thông báo ra mắt GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
và [hướng dẫn truy cập](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Với xác thực trực tiếp bằng khóa API OpenAI, id `openai/gpt-5.6` không định danh là bí danh của
Sol và là mặc định cho thiết lập mới. Danh mục Codex gốc không áp dụng
bí danh API trực tiếp đó ở phía máy khách; tùy theo quyền truy cập không gian làm việc, danh mục có thể hiển thị
chính xác các id Sol, Terra và Luna. Vì vậy, thiết lập OAuth ChatGPT/Codex mới
sử dụng `openai/gpt-5.6-sol`. Kiểm tra tài khoản hiện tại bằng:

```bash
openclaw models list --provider openai
```

Quyền truy cập của tổ chức API và không gian làm việc Codex có thể khác nhau. Nếu GPT-5.6 không
khả dụng, hãy chọn rõ ràng GPT-5.5:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw hiển thị lỗi truy cập từ thượng nguồn và không âm thầm thay thế lựa chọn
GPT-5.6 bằng GPT-5.5.

<Note>
Các tuyến HTTPS chính thức chính xác và đủ điều kiện có thể chọn Plugin máy chủ ứng dụng
Codex đi kèm khi chính sách runtime chưa được đặt hoặc là `auto`; các tuyến Completions do người dùng tạo,
điểm cuối tùy chỉnh và ghi đè truyền tải yêu cầu vẫn chạy trên OpenClaw. Các
điểm cuối HTTP chính thức dạng văn bản thuần bị từ chối. Cấu hình runtime rõ ràng của nhà cung cấp/mô hình vẫn
có thẩm quyền quyết định. Chạy `openclaw doctor --fix` để sửa các tham chiếu mô hình Codex cũ,
tham chiếu `codex-cli/*` hoặc các ghim phiên runtime cũ không được đặt bởi
cấu hình runtime rõ ràng.
</Note>

## Phạm vi hỗ trợ tính năng của OpenClaw

| Khả năng của OpenAI         | Bề mặt OpenClaw                                                                              | Trạng thái                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Trò chuyện / Responses          | Nhà cung cấp mô hình `openai/<model>`                                                               | Có                                                             |
| Các mô hình thuê bao Codex | `openai/<model>` với OpenAI OAuth                                                            | Có                                                             |
| Tham chiếu mô hình Codex cũ   | tham chiếu mô hình Codex cũ, `codex-cli/<model>`                                                     | Được doctor sửa thành `openai/<model>`                          |
| Trình chạy app-server Codex  | Tuyến HTTPS tương thích với Codex khi runtime chưa đặt/`auto`, hoặc `agentRuntime.id: codex` tường minh  | Có                                                             |
| Tìm kiếm web phía máy chủ    | Công cụ OpenAI Responses gốc                                                                  | Có, khi tìm kiếm web được bật và không ghim nhà cung cấp nào khác |
| Hình ảnh                    | `image_generate`                                                                              | Có                                                             |
| Video                    | `video_generate`                                                                              | Có                                                             |
| Chuyển văn bản thành giọng nói            | `messages.tts.provider: "openai"` / `tts`                                                     | Có                                                             |
| Chuyển giọng nói thành văn bản theo lô      | `tools.media.audio` / khả năng hiểu nội dung đa phương tiện                                                     | Có                                                             |
| Chuyển giọng nói thành văn bản dạng luồng  | Voice Call `streaming.provider: "openai"`                                                     | Có                                                             |
| Giọng nói thời gian thực            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Có (khóa API OpenAI Platform)                                   |
| Embedding                | nhà cung cấp embedding bộ nhớ                                                                     | Có                                                             |

<Note>
Giọng nói OpenAI Realtime đi qua **OpenAI Platform Realtime
API** công khai và yêu cầu khóa API Platform. Thay vào đó, token Codex OAuth xác thực
phần phụ trợ ChatGPT Codex; chúng không thể dùng thay thế cho khóa API Platform
trên các endpoint Realtime công khai.

Nếu xác thực bằng khóa API báo thiếu thông tin thanh toán, hãy nạp thêm tín dụng Platform tại
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
cho tổ chức hỗ trợ thông tin xác thực thời gian thực của bạn khi sử dụng phương thức xác thực bằng khóa API.
Giọng nói thời gian thực chấp nhận hồ sơ xác thực bằng khóa API `openai` được tạo bởi
`openclaw onboard --auth-choice openai-api-key`, khóa API Platform được đặt qua
`talk.realtime.providers.openai.apiKey` cho Control UI Talk, hoặc
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` cho Voice
Call, hoặc biến môi trường `OPENAI_API_KEY`.

Trong Control UI Video Talk, OpenAI WebRTC nhận ngữ cảnh camera theo yêu cầu:
khi mô hình gọi `describe_view`, trình duyệt gửi một ảnh JPEG có kích thước giới hạn qua
kênh dữ liệu thời gian thực. OpenClaw không đính kèm luồng camera liên tục
vào phiên OpenAI.
</Note>

## Embedding bộ nhớ

OpenClaw có thể dùng OpenAI hoặc endpoint embedding tương thích với OpenAI để
lập chỉ mục `memory_search` và tạo embedding truy vấn:

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

Đối với các endpoint tương thích với OpenAI yêu cầu nhãn embedding bất đối xứng, hãy đặt
`queryInputType` và `documentInputType` trong `memorySearch`. OpenClaw
chuyển tiếp chúng dưới dạng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp: embedding
truy vấn dùng `queryInputType`; các đoạn bộ nhớ đã lập chỉ mục và quá trình lập chỉ mục theo lô dùng
`documentInputType`. Xem
[Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config)
để biết ví dụ đầy đủ.

## Bắt đầu

<Tabs>
  <Tab title="Khóa API (OpenAI Platform)">
    **Phù hợp nhất cho:** truy cập API trực tiếp và thanh toán theo mức sử dụng.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo hoặc sao chép khóa API từ [bảng điều khiển OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Hoặc truyền trực tiếp khóa:

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

    | Tham chiếu mô hình        | Chính sách runtime hoặc thông tin về tuyến                                 | Tuyến                     | Xác thực                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | chưa đặt/`auto`, tuyến gốc HTTPS chính thức khớp chính xác, không ghi đè yêu cầu | Có thể chọn Codex     | Hồ sơ xác thực bằng khóa API theo thứ tự      |
    | `openai/gpt-5.6` | nhà cung cấp/mô hình `agentRuntime.id: "openclaw"`                  | Runtime nhúng của OpenClaw | Hồ sơ khóa API `openai` đã chọn |
    | `openai/gpt-5.5` | nhà cung cấp/mô hình `agentRuntime.id` tường minh                     | Runtime tác tử đã chọn    | Hồ sơ khóa API OpenAI đã chọn   |
    | `openai/*`       | Completions do người dùng cấu hình, tùy chỉnh hoặc ghi đè yêu cầu | Runtime nhúng của OpenClaw | Loại thông tin xác thực không thay đổi |
    | `openai/*`       | endpoint HTTP chính thức dạng văn bản thuần                  | Bị từ chối                 | Thông tin xác thực không được gửi             |

    <Note>
    Khi runtime chưa được đặt hoặc là `auto`, chỉ tuyến gốc HTTPS chính thức khớp chính xác
    và đủ điều kiện mới có thể ngầm chọn trình chạy app-server Codex. Để xác thực bằng khóa API
    trên mô hình tác tử, hãy tạo hồ sơ xác thực bằng khóa API `openai` và sắp xếp thứ tự bằng
    `auth.order.openai`; `OPENAI_API_KEY` vẫn là phương án dự phòng trực tiếp cho
    các bề mặt API OpenAI không thuộc tác tử. Chạy `openclaw doctor --fix` để di chuyển các
    mục thứ tự xác thực Codex cũ.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    ID `gpt-5.6` của API trực tiếp dạng rút gọn được phân giải thành tầng Sol. Nếu tổ chức API này
    không cung cấp GPT-5.6, hãy đặt mô hình chính thành
    `openai/gpt-5.5` một cách tường minh.

    Để thử mô hình Instant hiện tại của ChatGPT từ OpenAI API, hãy đặt mô hình
    thành `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` là bí danh thay đổi theo thời gian. Thay vào đó, thiết lập mới bằng khóa API OpenAI dùng
    `openai/gpt-5.6`, có ID API trực tiếp dạng rút gọn được phân giải thành Sol. Các mô hình chính
    tường minh hiện có, bao gồm `openai/gpt-5.5`, vẫn không thay đổi. Bí danh
    `chat-latest` chỉ chấp nhận độ chi tiết văn bản `medium`; với mô hình này, OpenClaw buộc
    mọi độ chi tiết được yêu cầu khác thành `medium`.

    <Warning>
    OpenClaw **không** cung cấp `gpt-5.3-codex-spark` trên tuyến dùng khóa API OpenAI
    trực tiếp. Mô hình này chỉ khả dụng qua các mục danh mục thuê bao Codex
    khi tài khoản đã đăng nhập của bạn cung cấp mô hình đó.
    </Warning>

  </Tab>

  <Tab title="Thuê bao Codex">
    **Phù hợp nhất cho:** sử dụng thuê bao ChatGPT/Codex với khả năng thực thi app-server Codex
    gốc thay vì khóa API riêng. Codex cloud yêu cầu
    đăng nhập ChatGPT.

    <Steps>
      <Step title="Chạy Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Hoặc chạy OAuth trực tiếp:

        ```bash
        openclaw models auth login --provider openai
        ```

        Đối với thiết lập không có giao diện hoặc không hỗ trợ callback, hãy thêm `--device-code` để đăng
        nhập bằng luồng mã thiết bị ChatGPT thay cho callback trình duyệt
        localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Dùng tuyến mô hình OpenAI chính tắc">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Tuyến gốc HTTPS chính thức khớp chính xác này không yêu cầu cấu hình runtime.
        Tuyến có thể tự động chọn runtime app-server Codex, đồng thời
        OpenClaw cài đặt hoặc sửa Plugin Codex đi kèm khi runtime đó
        được chọn.
      </Step>
      <Step title="Xác minh xác thực Codex khả dụng">
        ```bash
        openclaw models list --provider openai
        ```

        Sau khi Gateway đang chạy, hãy gửi `/codex status` hoặc `/codex models`
        trong cuộc trò chuyện để xác minh runtime app-server gốc.
      </Step>
    </Steps>

    ### Tóm tắt tuyến

    | Tham chiếu mô hình                | Chính sách runtime hoặc thông tin về tuyến                                 | Tuyến                                                    | Xác thực                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | chưa đặt/`auto`, tuyến gốc HTTPS chính thức khớp chính xác, không ghi đè yêu cầu | Có thể chọn Codex                                    | Đăng nhập Codex hoặc hồ sơ xác thực `openai` được sắp xếp thứ tự |
    | `openai/gpt-5.6-terra`   | chưa đặt/`auto`, tuyến gốc HTTPS chính thức khớp chính xác, không ghi đè yêu cầu | Có thể chọn Codex                                    | Đăng nhập Codex khi danh mục cung cấp Terra       |
    | `openai/gpt-5.6-luna`    | chưa đặt/`auto`, tuyến gốc HTTPS chính thức khớp chính xác, không ghi đè yêu cầu | Có thể chọn Codex                                    | Đăng nhập Codex khi danh mục cung cấp Luna        |
    | `openai/gpt-5.6-sol`     | nhà cung cấp/mô hình `agentRuntime.id: "openclaw"`                  | Runtime nhúng của OpenClaw, cơ chế truyền tải xác thực Codex nội bộ | Hồ sơ OAuth `openai` đã chọn                    |
    | `openai/gpt-5.5`         | nhà cung cấp/mô hình `agentRuntime.id` tường minh                     | Runtime tác tử đã chọn                                   | Hồ sơ xác thực OpenAI đã chọn                       |
    | `openai/*`               | Completions do người dùng cấu hình, tùy chỉnh hoặc ghi đè yêu cầu | Runtime nhúng của OpenClaw                                | Yêu cầu về thông tin xác thực vẫn phụ thuộc vào tuyến      |
    | `openai/*`               | endpoint HTTP chính thức dạng văn bản thuần                  | Bị từ chối                                                 | Thông tin xác thực không được gửi                              |
    | Tham chiếu Codex GPT-5.5 cũ | được doctor sửa                                            | Được viết lại thành `openai/gpt-5.5`                            | Hồ sơ OpenAI OAuth đã di chuyển                      |
    | `codex-cli/gpt-5.5`      | được doctor sửa                                            | Được viết lại thành `openai/gpt-5.5`                            | Xác thực app-server Codex                              |

    <Warning>
    Thiết lập mới dựa trên gói đăng ký sử dụng chính xác `openai/gpt-5.6-sol`; danh mục
    Codex gốc cũng có thể cung cấp chính xác các tham chiếu Terra hoặc Luna. Nếu
    tài khoản không cung cấp GPT-5.6, hãy chọn rõ ràng `openai/gpt-5.5`. Các tham chiếu
    Codex GPT cũ là những tuyến OpenClaw kế thừa, không phải đường dẫn runtime Codex
    gốc; hãy chạy `openclaw doctor --fix` để di chuyển chúng mà không nâng cấp
    lựa chọn GPT-5.5 hiện có đã được chỉ định rõ ràng. `gpt-5.3-codex-spark` vẫn chỉ dành
    cho các tài khoản có danh mục gói đăng ký Codex công bố mô hình này; các tham chiếu
    dùng khóa API OpenAI trực tiếp và Azure cho mô hình này vẫn bị ẩn.
    </Warning>

    <Note>
    Cấu hình mới nên đặt thứ tự xác thực tác tử OpenAI trong `auth.order.openai`;
    doctor di chuyển các mục thứ tự xác thực Codex kế thừa cũ.
    </Note>

    ### Ví dụ cấu hình

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Khi có khóa API dự phòng, hãy giữ mô hình đã chọn trong `openai/*` và đặt
    thứ tự xác thực trong `openai`. OpenClaw thử gói đăng ký trước, sau đó
    thử khóa API, đồng thời vẫn sử dụng bộ khung Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    Quy trình thiết lập ban đầu không còn nhập dữ liệu OAuth từ `~/.codex`. Hãy đăng nhập bằng
    OAuth trên trình duyệt (mặc định) hoặc luồng mã thiết bị ở trên; OpenClaw quản lý
    thông tin xác thực thu được trong kho xác thực tác tử riêng.
    </Note>

    ### Kiểm tra và khôi phục định tuyến OAuth Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Đối với một tác tử cụ thể, hãy thêm `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Nếu cấu hình cũ vẫn có các tham chiếu Codex GPT kế thừa hoặc ghim phiên runtime OpenAI
    lỗi thời mà không có cấu hình runtime rõ ràng, hãy sửa:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Nếu `models auth list --provider openai` không hiển thị hồ sơ nào có thể sử dụng, hãy đăng nhập
    lại:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Sử dụng `--profile-id` cho nhiều lần đăng nhập OAuth Codex trong cùng một tác tử, sau đó
    kiểm soát chúng qua thứ tự xác thực hoặc `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Chạy `openclaw doctor --fix` để di chuyển các ID hồ sơ có tiền tố OpenAI Codex
    kế thừa cũ và các mục thứ tự trước khi dựa vào thứ tự hồ sơ.

    ### Chỉ báo trạng thái

    Lệnh chat `/status` hiển thị runtime mô hình nào đang hoạt động cho phiên
    hiện tại. Bộ khung app-server Codex đi kèm xuất hiện dưới dạng
    `Runtime: OpenAI Codex` khi một tuyến ngầm định đủ điều kiện hoặc chính sách runtime
    nhà cung cấp/mô hình rõ ràng chọn nó.

    ### Cảnh báo của doctor

    Nếu các tham chiếu mô hình Codex kế thừa hoặc ghim runtime OpenAI lỗi thời vẫn còn trong cấu hình
    hoặc trạng thái phiên, `openclaw doctor --fix` sẽ ghi lại chúng thành `openai/*` với
    runtime Codex, trừ khi OpenClaw được cấu hình rõ ràng.

    ### Giới hạn cửa sổ ngữ cảnh

    OpenClaw coi siêu dữ liệu mô hình và giới hạn ngữ cảnh runtime là các
    giá trị riêng biệt. Đối với `openai/gpt-5.5` thông qua danh mục OAuth Codex:

    - `contextWindow` gốc: `400000`
    - Giới hạn `contextTokens` mặc định của runtime: `272000`

    Trên thực tế, giới hạn mặc định nhỏ hơn có đặc tính tốt hơn về độ trễ và chất lượng.
    Ghi đè giới hạn này bằng `contextTokens`:

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
    Sử dụng `contextWindow` để khai báo siêu dữ liệu mô hình gốc. Sử dụng `contextTokens`
    để giới hạn ngân sách ngữ cảnh runtime. Tuyến dùng khóa API OpenAI trực tiếp
    báo cáo `contextWindow` gốc lớn hơn (`1000000`) cho `gpt-5.5`; hai
    tuyến được theo dõi riêng vì các danh mục thượng nguồn khác nhau.
    </Note>

    ### Khôi phục danh mục

    OpenClaw sử dụng siêu dữ liệu danh mục Codex thượng nguồn cho `gpt-5.5` khi
    có dữ liệu này. Nếu quá trình khám phá Codex trực tiếp bỏ sót hàng `gpt-5.5` trong khi tài khoản
    đã được xác thực, OpenClaw sẽ tổng hợp hàng mô hình OAuth đó để các lần chạy cron,
    tác tử phụ và mô hình mặc định đã cấu hình không thất bại với
    `Unknown model`.

  </Tab>
</Tabs>

## Xác thực app-server Codex gốc

Bộ khung app-server Codex gốc sử dụng các tham chiếu mô hình `openai/*` khi một tuyến HTTPS
chính thức chính xác và đủ điều kiện chọn ngầm định bộ khung này, hoặc khi
`agentRuntime.id: "codex"` của nhà cung cấp/mô hình chọn rõ ràng bộ khung này. Cơ chế xác thực vẫn
dựa trên tài khoản. OpenClaw chọn phương thức xác thực theo thứ tự sau:

1. Các hồ sơ xác thực OpenAI đã sắp thứ tự cho tác tử, ưu tiên đặt trong
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di chuyển các ID hồ sơ xác thực
   Codex kế thừa cũ và thứ tự xác thực.
2. Tài khoản hiện có của app-server, chẳng hạn như phiên đăng nhập ChatGPT
   của Codex CLI cục bộ. Đối với thư mục chính tác tử cô lập mặc định, OpenClaw kết nối tài khoản
   CLI gốc đó vào app-server thông qua RPC đăng nhập; OpenClaw không chia sẻ
   cấu hình, plugin hoặc kho luồng của CLI.
3. Chỉ dành cho các lần khởi chạy app-server stdio cục bộ và chỉ khi app-server
   báo cáo không có tài khoản: `CODEX_API_KEY`, sau đó là `OPENAI_API_KEY`.

Phiên đăng nhập gói đăng ký ChatGPT/Codex cục bộ không bị thay thế chỉ vì tiến trình
Gateway cũng có `OPENAI_API_KEY` cho các mô hình OpenAI trực tiếp hoặc
phép nhúng. Phương án dự phòng dùng khóa API từ môi trường chỉ áp dụng cho đường dẫn stdio cục bộ
không có tài khoản; khóa này không bao giờ được gửi qua các kết nối app-server WebSocket. Khi
một hồ sơ Codex kiểu gói đăng ký được chọn, OpenClaw cũng loại
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con app-server stdio được khởi tạo
và thay vào đó gửi thông tin xác thực đã chọn qua RPC đăng nhập của app-server.

Khi hồ sơ gói đăng ký đó bị chặn do giới hạn sử dụng Codex, OpenClaw
đánh dấu hồ sơ là bị chặn cho đến thời điểm đặt lại do Codex công bố và cho phép thứ tự
xác thực chuyển sang hồ sơ `openai:*` tiếp theo mà không thay đổi mô hình đã chọn
hoặc rời khỏi bộ khung Codex. Sau khi thời điểm đặt lại trôi qua,
hồ sơ gói đăng ký sẽ lại đủ điều kiện.

## Tạo hình ảnh

Plugin `openai` đi kèm đăng ký khả năng tạo hình ảnh thông qua
công cụ `image_generate`. Plugin này hỗ trợ cả việc tạo hình ảnh bằng khóa API OpenAI và OAuth Codex
thông qua cùng một tham chiếu mô hình `openai/gpt-image-2`.

| Khả năng                   | Khóa API OpenAI                        | OAuth Codex                                |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Tham chiếu mô hình        | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Xác thực                  | `OPENAI_API_KEY`                   | Đăng nhập OAuth OpenAI Codex               |
| Giao thức truyền tải      | API OpenAI Images                  | Phần phụ trợ Codex Responses                |
| Số hình ảnh tối đa mỗi yêu cầu | 4                                  | 4                                    |
| Chế độ chỉnh sửa          | Đã bật (tối đa 5 hình ảnh tham chiếu) | Đã bật (tối đa 5 hình ảnh tham chiếu)   |
| Ghi đè kích thước         | Được hỗ trợ, bao gồm kích thước 2K/4K | Được hỗ trợ, bao gồm kích thước 2K/4K     |
| Tỷ lệ khung hình / độ phân giải | Không chuyển tiếp tới API OpenAI Images | Ánh xạ tới kích thước được hỗ trợ khi an toàn |

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
Xem [Tạo hình ảnh](/vi/tools/image-generation) để biết các tham số công cụ dùng chung,
cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

`gpt-image-2` là lựa chọn mặc định để tạo hình ảnh từ văn bản và chỉnh sửa hình ảnh
bằng OpenAI. `gpt-image-1.5`, `gpt-image-1` và `gpt-image-1-mini` vẫn có thể dùng
làm các ghi đè mô hình rõ ràng. Sử dụng `openai/gpt-image-1.5` để tạo đầu ra PNG/WebP
có nền trong suốt; API `gpt-image-2` hiện tại từ chối
`background: "transparent"`.

Đối với yêu cầu nền trong suốt, hãy gọi `image_generate` với
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` hoặc `"webp"`, và
`background: "transparent"`; tùy chọn nhà cung cấp `openai.background` cũ
vẫn được chấp nhận. OpenClaw cũng bảo vệ các tuyến OpenAI công khai và OAuth OpenAI Codex
bằng cách ghi lại các yêu cầu trong suốt `openai/gpt-image-2` mặc định thành
`gpt-image-1.5`; Azure và các điểm cuối tùy chỉnh tương thích với OpenAI giữ nguyên
tên triển khai/mô hình đã cấu hình.

Thiết lập tương tự cũng được cung cấp cho các lần chạy CLI không giao diện:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Một nhãn dán hình tròn màu đỏ đơn giản trên nền trong suốt" \
  --json
```

Sử dụng cùng các cờ `--output-format` và `--background` với
`openclaw infer image edit` khi bắt đầu từ một tệp đầu vào.
`--openai-background` vẫn có sẵn dưới dạng bí danh dành riêng cho OpenAI. Sử dụng
`--quality low|medium|high|auto` để kiểm soát chất lượng và chi phí của OpenAI Images.
Sử dụng `--openai-moderation low|auto` để truyền gợi ý kiểm duyệt của OpenAI từ
`image generate` hoặc `image edit`.

Đối với các bản cài đặt dùng OAuth ChatGPT/Codex, hãy giữ nguyên tham chiếu `openai/gpt-image-2`. Khi
một hồ sơ OAuth `openai` được cấu hình, OpenClaw phân giải token truy cập OAuth
đã lưu trữ đó và gửi yêu cầu hình ảnh qua phần phụ trợ Codex Responses; OpenClaw
không thử `OPENAI_API_KEY` trước hoặc âm thầm chuyển sang khóa API.
Hãy cấu hình rõ ràng `models.providers.openai` bằng khóa API, URL cơ sở tùy chỉnh
hoặc điểm cuối Azure khi bạn muốn sử dụng tuyến API OpenAI Images trực tiếp.
Nếu điểm cuối hình ảnh tùy chỉnh đó nằm trên mạng LAN/địa chỉ riêng đáng tin cậy,
hãy đặt thêm `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
vẫn chặn các điểm cuối hình ảnh tương thích với OpenAI riêng tư/nội bộ trừ khi có
tùy chọn tham gia này.

Tạo:

```
/tool image_generate model=openai/gpt-image-2 prompt="Một áp phích ra mắt chỉn chu cho OpenClaw trên macOS" size=3840x2160 count=1
```

Tạo PNG có nền trong suốt:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Một nhãn dán hình tròn màu đỏ đơn giản trên nền trong suốt" outputFormat=png background=transparent
```

Chỉnh sửa:

```
/tool image_generate model=openai/gpt-image-2 prompt="Giữ nguyên hình dạng vật thể, thay đổi vật liệu thành thủy tinh trong mờ" image=/path/to/reference.png size=1024x1536
```

## Tạo video

Plugin `openai` đi kèm đăng ký khả năng tạo video thông qua
công cụ `video_generate`.

| Khả năng            | Giá trị                                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| Mô hình mặc định    | `openai/sora-2`                                                                    |
| Chế độ              | Văn bản thành video, hình ảnh thành video, chỉnh sửa một video                     |
| Đầu vào tham chiếu  | 1 hình ảnh hoặc 1 video                                                            |
| Ghi đè kích thước   | Được hỗ trợ cho văn bản thành video và hình ảnh thành video                        |
| Tỷ lệ khung hình    | Được chuyển đổi thành kích thước được hỗ trợ gần nhất, không chuyển tiếp giá trị thô |
| Ghi đè khác         | `resolution`, `audio`, `watermark` không được hỗ trợ và bị loại bỏ kèm cảnh báo của công cụ |

Các yêu cầu chuyển đổi hình ảnh thành video của OpenAI sử dụng `POST /v1/videos` với một hình ảnh
`input_reference`. Các chỉnh sửa video đơn sử dụng `POST /v1/videos/edits` với video
đã tải lên trong trường `video`.

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung,
cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.

Nhà cung cấp OpenAI khai báo `supportsSize` nhưng không khai báo `supportsAspectRatio` hoặc
`supportsResolution`. Lớp chuẩn hóa dùng chung của OpenClaw chuyển đổi
`aspectRatio` được yêu cầu thành `size` OpenAI khớp gần nhất trước khi
yêu cầu đến nhà cung cấp, vì vậy các yêu cầu về tỷ lệ khung hình nhìn chung vẫn hoạt động.
`resolution` không có phương án dự phòng về kích thước và bị loại bỏ, đồng thời được báo cho bên gọi dưới dạng
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Phần bổ sung cho prompt GPT-5

OpenClaw thêm một phần bổ sung dùng chung cho prompt GPT-5 đối với các mô hình thuộc họ GPT-5 trên
nhà cung cấp `openai` (bao gồm các tham chiếu Codex cũ trước khi sửa chữa được chuẩn hóa
thành `openai/*`). Các nhà cung cấp khác cũng phục vụ id mô hình thuộc họ GPT-5, chẳng hạn
như các tuyến OpenRouter hoặc opencode, không nhận lớp phủ này; lớp phủ được kiểm soát theo
id nhà cung cấp `openai`, không chỉ theo id mô hình. Các mô hình GPT-4.x cũ không bao giờ
nhận lớp phủ này.

Bộ kiểm thử app-server Codex gốc không nhận hợp đồng hành vi về persona/kỷ luật
sử dụng công cụ hoặc lớp phủ phong cách tương tác thân thiện thông qua
chỉ dẫn dành cho nhà phát triển; Codex gốc giữ nguyên hành vi cơ sở, mô hình và
tài liệu dự án do Codex sở hữu, còn OpenClaw vô hiệu hóa tính cách tích hợp sẵn của Codex cho
các luồng gốc để các tệp tính cách trong không gian làm việc của agent tiếp tục có thẩm quyền.
OpenClaw chỉ bổ sung ngữ cảnh thời gian chạy vào các luồng Codex gốc: phân phối qua
kênh, công cụ động của OpenClaw, ủy quyền ACP, ngữ cảnh không gian làm việc và
Skills của OpenClaw. Văn bản hướng dẫn Heartbeat từ cùng phần bổ sung này là
ngoại lệ duy nhất: các lượt Heartbeat của Codex gốc vẫn nhận văn bản này, được chèn dưới dạng
chỉ dẫn cộng tác chuyên biệt thay vì thông qua hook bổ sung prompt
dùng chung.

Phần bổ sung GPT-5 thêm một hợp đồng hành vi có gắn thẻ cho việc duy trì persona,
an toàn thực thi, kỷ luật sử dụng công cụ, hình thức đầu ra, kiểm tra
hoàn thành và xác minh trên các prompt tương ứng do OpenClaw tập hợp. Hành vi trả lời
theo từng kênh và tin nhắn im lặng vẫn nằm trong prompt hệ thống dùng chung của OpenClaw
và chính sách phân phối đi. Lớp phong cách tương tác thân thiện
tách biệt và có thể cấu hình.

| Giá trị                  | Tác dụng                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (mặc định) | Bật lớp phong cách tương tác thân thiện |
| `"on"`                 | Bí danh của `"friendly"`                      |
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
Các giá trị không phân biệt chữ hoa chữ thường trong thời gian chạy, vì vậy cả `"Off"` và `"off"` đều tắt
lớp phong cách thân thiện.
</Tip>

<Note>
`plugins.entries.openai.config.personality` cũ vẫn được đọc làm phương án dự phòng
tương thích khi thiết lập dùng chung
`agents.defaults.promptOverlays.gpt5.personality` chưa được đặt.
</Note>

## Giọng nói và lời nói

<AccordionGroup>
  <Accordion title="Tổng hợp giọng nói (TTS)">
    Plugin `openai` đi kèm đăng ký tính năng tổng hợp giọng nói cho
    bề mặt `messages.tts`.

    | Thiết lập      | Đường dẫn cấu hình                                            | Mặc định                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Mô hình        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Giọng nói        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Tốc độ        | `messages.tts.providers.openai.speed`                  | (chưa đặt)                          |
    | Chỉ dẫn | `messages.tts.providers.openai.instructions`           | (chưa đặt, chỉ `gpt-4o-mini-tts`)  |
    | Định dạng       | `messages.tts.providers.openai.responseFormat`         | `opus` cho ghi chú thoại, `mp3` cho tệp |
    | Khóa API      | `messages.tts.providers.openai.apiKey`                 | Dự phòng sang `OPENAI_API_KEY`   |
    | URL cơ sở     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Nội dung bổ sung   | `messages.tts.providers.openai.extraBody` / `extra_body` | (chưa đặt)                        |

    Các mô hình khả dụng: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Các giọng nói khả dụng:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` được hợp nhất vào JSON yêu cầu `/audio/speech` sau các trường
    do OpenClaw tạo, vì vậy hãy dùng nó cho các điểm cuối tương thích với OpenAI yêu cầu
    các khóa bổ sung như `lang`. Các khóa prototype bị bỏ qua.

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
    Đặt `OPENAI_TTS_BASE_URL` để ghi đè URL cơ sở của TTS mà không ảnh hưởng đến
    điểm cuối API trò chuyện. TTS và giọng nói Realtime của OpenAI đều được cấu hình
    thông qua khóa API OpenAI Platform; các bản cài đặt chỉ dùng OAuth vẫn có thể sử dụng
    các mô hình trò chuyện dựa trên Codex, nhưng không thể dùng tính năng trò chuyện thoại trực tiếp của OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Chuyển giọng nói thành văn bản">
    Plugin `openai` đi kèm đăng ký tính năng chuyển giọng nói thành văn bản theo lô thông qua
    bề mặt phiên âm hiểu nội dung đa phương tiện của OpenClaw.

    - Mô hình mặc định: `gpt-4o-transcribe`
    - Điểm cuối: OpenAI REST `/v1/audio/transcriptions`
    - Đường dẫn đầu vào: tải lên tệp âm thanh multipart
    - Được dùng ở mọi nơi tính năng phiên âm âm thanh đầu vào đọc `tools.media.audio`,
      bao gồm các phân đoạn kênh thoại Discord và tệp đính kèm âm thanh của kênh

    Để buộc sử dụng OpenAI cho việc phiên âm âm thanh đầu vào:

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

    Các gợi ý về ngôn ngữ và prompt được chuyển tiếp đến OpenAI khi được cung cấp bởi
    cấu hình đa phương tiện âm thanh dùng chung hoặc yêu cầu phiên âm riêng cho từng lệnh gọi.

  </Accordion>

  <Accordion title="Phiên âm theo thời gian thực">
    Plugin `openai` đi kèm đăng ký tính năng phiên âm theo thời gian thực cho
    Plugin Cuộc gọi thoại.

    | Thiết lập          | Đường dẫn cấu hình                                                          | Mặc định |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Mô hình            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Ngôn ngữ         | `...openai.language`                                                 | (chưa đặt) |
    | Prompt           | `...openai.prompt`                                                   | (chưa đặt) |
    | Thời lượng im lặng | `...openai.silenceDurationMs`                                        | `800`   |
    | Ngưỡng VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Xác thực             | Hồ sơ khóa API `...openai.apiKey`, `OPENAI_API_KEY` hoặc `openai`    | Yêu cầu khóa API Platform |

    <Note>
    Sử dụng kết nối WebSocket đến `wss://api.openai.com/v1/realtime` với âm thanh
    G.711 u-law (`g711_ulaw` / `audio/pcmu`). Đối với hồ sơ khóa API `openai`,
    Gateway tạo một bí mật ứng dụng khách phiên âm Realtime tạm thời
    trước khi mở WebSocket. Nhà cung cấp truyền trực tuyến này dành cho đường dẫn
    phiên âm theo thời gian thực của Cuộc gọi thoại; tính năng thoại Discord hiện ghi lại các
    phân đoạn ngắn và thay vào đó sử dụng đường dẫn phiên âm theo lô `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Giọng nói theo thời gian thực">
    Plugin `openai` đi kèm đăng ký tính năng giọng nói theo thời gian thực cho Plugin
    Cuộc gọi thoại.

    | Thiết lập                               | Đường dẫn cấu hình                                                              | Mặc định             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Mô hình                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Giọng nói                                  | `...openai.voice`                                                       | `alloy`             |
    | Nhiệt độ (cầu nối triển khai Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Ngưỡng VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Thời lượng im lặng                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Phần đệm tiền tố                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Mức độ suy luận                       | `...openai.reasoningEffort`                                             | (chưa đặt)              |
    | Xác thực                                   | Hồ sơ khóa API `openai`, `...openai.apiKey` hoặc `OPENAI_API_KEY` | Yêu cầu khóa API OpenAI Platform |

    Các giọng nói Realtime tích hợp sẵn khả dụng cho `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI khuyến nghị `marin` và `cedar` để có chất lượng Realtime tốt nhất. Đây
    là một tập hợp riêng biệt với các giọng nói chuyển văn bản thành giọng nói ở trên; một giọng nói chỉ dành cho TTS
    như `fable`, `nova` hoặc `onyx` không hợp lệ cho các phiên Realtime.
    Đặt rõ mô hình thành `gpt-realtime-2.1-mini` khi ưu tiên
    biến thể Realtime 2.1 nhỏ hơn, chi phí thấp hơn.

    <Note>
    **GPT-Live (sắp ra mắt).** Các mô hình song công hoàn toàn `gpt-live-1` và
    `gpt-live-1-mini` của OpenAI đã thay thế chế độ thoại ChatGPT vào tháng 7 năm 2026; API dành cho
    nhà phát triển đang được triển khai cho các tổ chức có quyền truy cập sớm. OpenClaw
    nhận diện họ mô hình này nhưng chưa chạy được: các phiên GPT-Live
    chỉ dùng WebRTC, tự quản lý việc luân phiên lượt nói (không có VAD) và ủy quyền công việc của agent
    thông qua một giao thức sự kiện bàn giao mà các phương thức truyền tải theo thời gian thực của OpenClaw
    chưa triển khai. Việc cấu hình một mô hình `gpt-live-*` sẽ thất bại theo cơ chế đóng
    kèm hướng dẫn cho cả cầu nối WebSocket và các phiên trình duyệt Talk thay vì
    âm thầm kết nối âm thanh mà không có quyền truy cập agent. Quyền truy cập API cũng được giới hạn
    theo từng tổ chức OpenAI trong giai đoạn truy cập sớm. Hãy giữ `gpt-realtime-2.1` (giá trị
    mặc định) cho đến khi OpenClaw hỗ trợ GPT-Live.
    </Note>

    <Note>
    Các cầu nối realtime OpenAI ở backend sử dụng cấu trúc phiên WebSocket Realtime
    GA, vốn không chấp nhận `session.temperature`. Các bản triển khai Azure OpenAI
    vẫn khả dụng thông qua `azureEndpoint` và `azureDeployment`, đồng thời
    giữ cấu trúc phiên tương thích với bản triển khai (bao gồm `temperature`).
    Hỗ trợ gọi công cụ hai chiều và âm thanh G.711 u-law.
    </Note>

    <Note>
    Giọng nói thời gian thực được chọn khi phiên được tạo. OpenAI cho phép thay đổi hầu hết
    các trường của phiên sau đó, nhưng không thể thay đổi giọng nói sau khi
    mô hình đã phát âm thanh trong phiên đó. OpenClaw hiện cung cấp các
    id giọng nói Realtime tích hợp sẵn dưới dạng chuỗi.
    </Note>

    <Note>
    Talk trong Control UI sử dụng các phiên thời gian thực trên trình duyệt của OpenAI với bí mật máy khách tạm thời
    do Gateway cấp và trao đổi SDP WebRTC trực tiếp từ trình duyệt
    với OpenAI Realtime API. Gateway cấp bí mật máy khách đó bằng
    thông tin xác thực `openai` đã chọn. Các khóa đã cấu hình, hồ sơ khóa API và
    `OPENAI_API_KEY` được ưu tiên; hồ sơ OAuth `openai` hoặc thông tin đăng nhập
    Codex bên ngoài được dùng làm phương án dự phòng. Các cầu nối WebSocket thời gian thực của Gateway relay và phần phụ trợ Voice Call
    sử dụng cùng thứ tự thông tin xác thực cho các điểm cuối OpenAI gốc.
    Quy trình xác minh trực tiếp dành cho người bảo trì có sẵn qua
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    các chặng OpenAI xác minh cả cầu nối WebSocket phần phụ trợ lẫn trao đổi
    SDP WebRTC của trình duyệt mà không ghi nhật ký bí mật.
    Truyền `--openai-only` để chạy hai chặng đó mà không cần thông tin xác thực Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Các điểm cuối Azure OpenAI

Nhà cung cấp `openai` đi kèm có thể nhắm đến tài nguyên Azure OpenAI để tạo
hình ảnh bằng cách ghi đè URL cơ sở. Trên đường dẫn tạo hình ảnh, OpenClaw
phát hiện tên máy chủ Azure trong `models.providers.openai.baseUrl` và tự động chuyển sang
cấu trúc yêu cầu của Azure.

<Note>
Giọng nói thời gian thực sử dụng một đường dẫn cấu hình riêng
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
và không bị ảnh hưởng bởi `models.providers.openai.baseUrl`. Xem mục thu gọn **Giọng nói
thời gian thực** trong [Giọng nói và lời nói](#voice-and-speech) để biết các cài đặt Azure
của tính năng này.
</Note>

Sử dụng Azure OpenAI khi:

- Bạn đã có gói đăng ký, hạn ngạch hoặc thỏa thuận
  doanh nghiệp Azure OpenAI
- Bạn cần khả năng lưu trú dữ liệu theo khu vực hoặc các biện pháp kiểm soát tuân thủ do Azure cung cấp
- Bạn muốn giữ lưu lượng bên trong một đối tượng thuê Azure hiện có

### Cấu hình

Để tạo hình ảnh Azure thông qua nhà cung cấp `openai` đi kèm, hãy trỏ
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

OpenClaw nhận dạng các hậu tố máy chủ Azure sau cho tuyến tạo hình ảnh
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Đối với các yêu cầu tạo hình ảnh trên máy chủ Azure được nhận dạng, OpenClaw:

- Gửi tiêu đề `api-key` thay cho `Authorization: Bearer`
- Sử dụng các đường dẫn theo phạm vi triển khai (`/openai/deployments/{deployment}/...`)
- Nối thêm `?api-version=...` vào mỗi yêu cầu
- Sử dụng thời gian chờ yêu cầu mặc định là 600s cho các lệnh gọi tạo hình ảnh Azure.
  Các giá trị `timeoutMs` theo từng lệnh gọi vẫn ghi đè giá trị mặc định này.

Các URL cơ sở khác (OpenAI công khai, proxy tương thích OpenAI) vẫn sử dụng cấu trúc
yêu cầu hình ảnh OpenAI tiêu chuẩn.

<Note>
Việc định tuyến Azure cho đường dẫn tạo hình ảnh của nhà cung cấp `openai` yêu cầu
OpenClaw 2026.4.22 trở lên. Các phiên bản cũ hơn xem mọi
`openai.baseUrl` tùy chỉnh như điểm cuối OpenAI công khai và không hoạt động với các triển khai hình ảnh
Azure.
</Note>

### Phiên bản API

Đặt `AZURE_OPENAI_API_VERSION` để cố định một phiên bản Azure preview hoặc GA cụ thể
cho đường dẫn tạo hình ảnh Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Giá trị mặc định là `2024-12-01-preview` khi biến chưa được đặt.

### Tên mô hình là tên triển khai

Azure OpenAI liên kết mô hình với các triển khai. Đối với các yêu cầu tạo hình ảnh Azure
được định tuyến qua nhà cung cấp `openai` đi kèm, trường `model` trong OpenClaw
phải là **tên triển khai Azure** mà bạn đã cấu hình trong cổng thông tin Azure, không phải
id mô hình OpenAI công khai.

Nếu bạn tạo một triển khai có tên `gpt-image-2-prod` phục vụ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Một áp phích gọn gàng" size=1024x1024 count=1
```

Quy tắc tên triển khai tương tự áp dụng cho mọi lệnh gọi tạo hình ảnh được định tuyến
qua nhà cung cấp `openai` đi kèm.

### Phạm vi cung cấp theo khu vực

Tính năng tạo hình ảnh Azure hiện chỉ có ở một số khu vực
(ví dụ: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Hãy kiểm tra danh sách khu vực hiện tại của Microsoft trước khi tạo
triển khai và xác nhận mô hình cụ thể được cung cấp trong khu vực của bạn.

### Khác biệt về tham số

Azure OpenAI và OpenAI công khai không phải lúc nào cũng chấp nhận cùng các tham số hình ảnh.
Azure có thể từ chối các tùy chọn mà OpenAI công khai cho phép (ví dụ một số
giá trị `background` trên `gpt-image-2`) hoặc chỉ cung cấp chúng trên các phiên bản mô hình
cụ thể. Những khác biệt này bắt nguồn từ Azure và mô hình nền tảng, không phải
OpenClaw. Nếu một yêu cầu Azure thất bại với lỗi xác thực, hãy kiểm tra
tập hợp tham số được phiên bản triển khai và API cụ thể của bạn hỗ trợ trong
cổng thông tin Azure.

<Note>
Azure OpenAI sử dụng cơ chế truyền tải gốc và hành vi tương thích nhưng không nhận
các tiêu đề ghi công ẩn của OpenClaw — xem mục thu gọn **Tuyến gốc và tuyến tương thích
OpenAI** trong [Cấu hình nâng cao](#advanced-configuration).

Đối với lưu lượng trò chuyện hoặc Responses trên Azure (ngoài tạo hình ảnh), hãy sử dụng
luồng thiết lập ban đầu hoặc cấu hình nhà cung cấp Azure chuyên biệt; chỉ riêng `openai.baseUrl`
không áp dụng cấu trúc API/xác thực Azure. Có một nhà cung cấp
`azure-openai-responses/*` riêng; xem mục thu gọn Compaction phía máy chủ
bên dưới.
</Note>

## Cấu hình nâng cao

Các ví dụ `params` theo từng mô hình bên dưới định hình yêu cầu nhà cung cấp nhúng
của OpenClaw. Việc cấu hình chúng là hành vi yêu cầu do người dùng chỉ định, vì vậy một tuyến
`auto` vốn đủ điều kiện vẫn chạy trên OpenClaw thay vì ngầm chọn Codex. Bộ khung
app-server Codex gốc sở hữu cơ chế truyền tải và cài đặt yêu cầu riêng; `agentRuntime.id: "codex"`
tường minh sẽ đóng khi lỗi nếu tuyến hiệu lực không được khai báo là
tương thích Codex.

<AccordionGroup>
  <Accordion title="Cơ chế truyền tải (WebSocket và SSE)">
    OpenClaw ưu tiên WebSocket với SSE làm phương án dự phòng (`"auto"`) cho `openai/*`.

    Trong chế độ `"auto"`, OpenClaw:
    - Thử lại một lần khi WebSocket gặp lỗi sớm trước khi chuyển sang SSE
    - Sau khi gặp lỗi, đánh dấu WebSocket là suy giảm trong 60 giây và sử dụng SSE
      trong thời gian chờ khôi phục
    - Đính kèm các tiêu đề định danh phiên và lượt ổn định cho các lần thử lại và
      kết nối lại
    - Chuẩn hóa các bộ đếm mức sử dụng (`input_tokens` / `prompt_tokens`) giữa
      các biến thể cơ chế truyền tải

    | Giá trị                | Hành vi                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (mặc định)   | Ưu tiên WebSocket, dự phòng bằng SSE     |
    | `"sse"`              | Chỉ bắt buộc dùng SSE                    |
    | `"websocket"`        | Chỉ bắt buộc dùng WebSocket              |

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
    - [Phản hồi API dạng luồng (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Chế độ nhanh">
    OpenClaw cung cấp một nút chuyển chế độ nhanh dùng chung cho `openai/*`:

    - **Trò chuyện/UI:** `/fast status|auto|on|off`
    - **Cấu hình:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Khi được bật, OpenClaw ánh xạ chế độ nhanh sang xử lý ưu tiên của OpenAI
    (`service_tier = "priority"`). Các giá trị `service_tier` hiện có được
    giữ nguyên và chế độ nhanh không ghi lại `reasoning` hoặc
    `text.verbosity`. `fastMode: "auto"` bắt đầu các lệnh gọi mô hình mới ở chế độ nhanh cho đến
    ngưỡng tự động, sau đó bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc
    tiếp tục về sau mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây;
    đặt `params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.

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
    Ghi đè của phiên được ưu tiên hơn cấu hình. Xóa ghi đè phiên trong
    Sessions UI sẽ đưa phiên trở lại giá trị mặc định đã cấu hình.
    </Note>

  </Accordion>

  <Accordion title="Xử lý ưu tiên (service_tier)">
    API của OpenAI cung cấp xử lý ưu tiên qua `service_tier`. Đặt giá trị này theo từng
    mô hình trong OpenClaw:

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
    `serviceTier` chỉ được chuyển tiếp đến các điểm cuối OpenAI gốc
    (`api.openai.com`) và các điểm cuối Codex gốc (`chatgpt.com/backend-api`).
    Nếu bạn định tuyến một trong hai nhà cung cấp qua proxy, OpenClaw giữ nguyên
    `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction phía máy chủ (Responses API)">
    Đối với các mô hình OpenAI Responses trực tiếp (`openai/*` trên `api.openai.com`), trình bao bọc
    luồng OpenClaw của Plugin OpenAI tự động bật Compaction phía máy chủ:

    - Buộc `store: true` (trừ khi khả năng tương thích của mô hình đặt `supportsStore: false`)
    - Chèn `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` mặc định: 70% của `contextWindow` (hoặc `80000` khi
      không khả dụng)

    Điều này áp dụng cho đường dẫn môi trường chạy OpenClaw tích hợp sẵn và các hook nhà cung cấp OpenAI
    được sử dụng bởi các lượt chạy nhúng. Bộ khung app-server Codex gốc quản lý
    ngữ cảnh riêng thông qua Codex và không bị ảnh hưởng bởi cài đặt này.

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
    `responsesServerCompaction` chỉ kiểm soát việc chèn `context_management`.
    Các mô hình OpenAI Responses trực tiếp vẫn buộc `store: true` trừ khi khả năng tương thích
    đặt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Chế độ GPT tác tử nghiêm ngặt">
    Đối với các mô hình thuộc họ GPT-5 của nhà cung cấp `openai` chạy qua môi trường chạy nhúng
    của OpenClaw, OpenClaw đã mặc định sử dụng một hợp đồng thực thi nghiêm ngặt hơn có tên
    `strict-agentic`. Hợp đồng này tự động kích hoạt bất cứ khi nào nhà cung cấp đã phân giải là
    `openai` và id mô hình khớp với họ GPT-5, trừ khi cấu hình
    tường minh chọn không sử dụng:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Việc đặt `"strict-agentic"` một cách tường minh không tạo ra tác động nào trên một tuyến được hỗ trợ (giá trị này
    đã là mặc định) và không có hiệu lực đối với các cặp nhà cung cấp/mô hình không được hỗ trợ.

    Khi `strict-agentic` đang hoạt động, OpenClaw:
    - Tự động bật `update_plan` cho công việc đáng kể
    - Thử lại các lượt không có nội dung về mặt cấu trúc hoặc chỉ có lập luận bằng một lượt tiếp tục
      có câu trả lời hiển thị
    - Sử dụng các sự kiện kế hoạch tường minh của harness khi harness đã chọn cung cấp
      chúng

    OpenClaw không phân loại văn xuôi của trợ lý để quyết định một lượt là
    kế hoạch, bản cập nhật tiến độ hay câu trả lời cuối cùng.

    <Note>
    Hợp đồng này hoàn toàn nằm trong trình chạy agent nhúng của OpenClaw. Hợp đồng này
    không áp dụng cho harness app-server Codex gốc, vốn tự quản lý
    hành vi lượt và kế hoạch; đối với các lần chạy Codex gốc, việc chọn harness quan trọng hơn
    cài đặt hợp đồng thực thi.
    </Note>

  </Accordion>

  <Accordion title="Tuyến gốc so với tuyến tương thích OpenAI">
    OpenClaw xử lý các endpoint trực tiếp của OpenAI, Codex và Azure OpenAI
    khác với các proxy `/v1` tương thích OpenAI dùng chung:

    **Tuyến gốc** (`openai/*`, Azure OpenAI):
    - Chỉ giữ `reasoning: { effort: "none" }` cho các mô hình hỗ trợ
      mức `none` của OpenAI
    - Bỏ qua chế độ lập luận bị tắt đối với các mô hình hoặc proxy từ chối
      `reasoning.effort: "none"`
    - Mặc định dùng chế độ nghiêm ngặt cho các schema công cụ
    - Chỉ đính kèm các header ghi nhận nguồn ẩn trên các máy chủ gốc đã xác minh (Azure
      OpenAI không nhận các header này, dù đây là một tuyến gốc)
    - Giữ định dạng yêu cầu chỉ dành cho OpenAI (`service_tier`, `store`,
      tương thích lập luận, gợi ý bộ nhớ đệm prompt)

    **Tuyến proxy/tương thích:**
    - Sử dụng hành vi tương thích ít nghiêm ngặt hơn
    - Loại bỏ `store` của Completions khỏi các payload `openai-completions` không phải gốc
    - Chấp nhận JSON chuyển tiếp `params.extra_body`/`params.extraBody` nâng cao
      cho các proxy Completions tương thích OpenAI
    - Chấp nhận `params.chat_template_kwargs` cho các proxy Completions tương thích OpenAI
      như vLLM
    - Không bắt buộc dùng schema công cụ nghiêm ngặt hoặc các header chỉ dành cho tuyến gốc

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và việc lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và việc lựa chọn nhà cung cấp.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
</CardGroup>
