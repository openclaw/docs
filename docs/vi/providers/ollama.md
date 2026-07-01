---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình đám mây hoặc cục bộ thông qua Ollama
    - Bạn cần hướng dẫn thiết lập và cấu hình Ollama
    - Bạn muốn các mô hình thị giác Ollama để hiểu hình ảnh
summary: Chạy OpenClaw với Ollama (mô hình đám mây và cục bộ)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:13:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw tích hợp với API gốc của Ollama (`/api/chat`) cho các mô hình đám mây được lưu trữ và máy chủ Ollama cục bộ/tự lưu trữ. Bạn có thể dùng Ollama ở ba chế độ: `Cloud + Local` thông qua một máy chủ Ollama có thể truy cập, `Cloud only` với `https://ollama.com`, hoặc `Local only` với một máy chủ Ollama có thể truy cập.

OpenClaw cũng đăng ký `ollama-cloud` làm id nhà cung cấp được lưu trữ hạng nhất cho
việc sử dụng trực tiếp Ollama Cloud. Dùng các tham chiếu như `ollama-cloud/kimi-k2.5:cloud` khi bạn
muốn định tuyến chỉ dùng đám mây mà không chia sẻ id nhà cung cấp `ollama` cục bộ.

Để xem trang thiết lập chuyên dụng chỉ dùng đám mây, xem [Ollama Cloud](/vi/providers/ollama-cloud).

<Warning>
**Người dùng Ollama từ xa**: Không dùng URL tương thích OpenAI `/v1` (`http://host:11434/v1`) với OpenClaw. Điều này làm hỏng việc gọi công cụ và mô hình có thể xuất JSON công cụ thô dưới dạng văn bản thuần. Thay vào đó, hãy dùng URL API Ollama gốc: `baseUrl: "http://host:11434"` (không có `/v1`).
</Warning>

Cấu hình nhà cung cấp Ollama dùng `baseUrl` làm khóa chuẩn. OpenClaw cũng chấp nhận `baseURL` để tương thích với các ví dụ kiểu OpenAI SDK, nhưng cấu hình mới nên ưu tiên `baseUrl`.

## Quy tắc xác thực

<AccordionGroup>
  <Accordion title="Máy chủ cục bộ và LAN">
    Máy chủ Ollama cục bộ và LAN không cần mã bearer thật. OpenClaw chỉ dùng dấu hiệu `ollama-local` cục bộ cho các URL cơ sở Ollama local loopback, mạng riêng, `.local`, và tên máy chủ trần.
  </Accordion>
  <Accordion title="Máy chủ từ xa và Ollama Cloud">
    Máy chủ công khai từ xa và Ollama Cloud (`https://ollama.com`) yêu cầu thông tin xác thực thật thông qua `OLLAMA_API_KEY`, hồ sơ xác thực, hoặc `apiKey` của nhà cung cấp. Để sử dụng trực tiếp dịch vụ được lưu trữ, ưu tiên nhà cung cấp `ollama-cloud`.
  </Accordion>
  <Accordion title="Id nhà cung cấp tùy chỉnh">
    Các id nhà cung cấp tùy chỉnh đặt `api: "ollama"` tuân theo cùng quy tắc. Ví dụ, một nhà cung cấp `ollama-remote` trỏ tới máy chủ Ollama LAN riêng có thể dùng `apiKey: "ollama-local"` và các tác nhân phụ sẽ phân giải dấu hiệu đó thông qua hook nhà cung cấp Ollama thay vì xem nó là thông tin xác thực bị thiếu. Tìm kiếm bộ nhớ cũng có thể đặt `agents.defaults.memorySearch.provider` thành id nhà cung cấp tùy chỉnh đó để embedding dùng điểm cuối Ollama tương ứng.
  </Accordion>
  <Accordion title="Hồ sơ xác thực">
    `auth-profiles.json` lưu thông tin xác thực cho một id nhà cung cấp. Đặt thiết lập điểm cuối (`baseUrl`, `api`, id mô hình, header, thời gian chờ) trong `models.providers.<id>`. Các tệp hồ sơ xác thực phẳng cũ hơn như `{ "ollama-windows": { "apiKey": "ollama-local" } }` không phải là định dạng runtime; chạy `openclaw doctor --fix` để viết lại chúng thành hồ sơ khóa API chuẩn `ollama-windows:default` kèm bản sao lưu. `baseUrl` trong tệp đó là nhiễu tương thích và nên được chuyển sang cấu hình nhà cung cấp.
  </Accordion>
  <Accordion title="Phạm vi embedding bộ nhớ">
    Khi Ollama được dùng cho embedding bộ nhớ, xác thực bearer được giới hạn trong máy chủ nơi nó được khai báo:

    - Khóa cấp nhà cung cấp chỉ được gửi tới máy chủ Ollama của nhà cung cấp đó.
    - `agents.*.memorySearch.remote.apiKey` chỉ được gửi tới máy chủ embedding từ xa của nó.
    - Giá trị env `OLLAMA_API_KEY` thuần được xem là quy ước Ollama Cloud, mặc định không gửi tới máy chủ cục bộ hoặc tự lưu trữ.

  </Accordion>
</AccordionGroup>

## Bắt đầu

Chọn phương thức thiết lập và chế độ bạn muốn.

<Tabs>
  <Tab title="Onboarding (khuyến nghị)">
    **Phù hợp nhất cho:** đường nhanh nhất để có thiết lập Ollama đám mây hoặc cục bộ hoạt động.

    <Steps>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard
        ```

        Chọn **Ollama** từ danh sách nhà cung cấp.
      </Step>
      <Step title="Chọn chế độ của bạn">
        - **Cloud + Local** — máy chủ Ollama cục bộ cộng với các mô hình đám mây được định tuyến qua máy chủ đó
        - **Cloud only** — các mô hình Ollama được lưu trữ qua `https://ollama.com`
        - **Local only** — chỉ các mô hình cục bộ

      </Step>
      <Step title="Chọn một mô hình">
        `Cloud only` nhắc nhập `OLLAMA_API_KEY` và gợi ý các mặc định đám mây được lưu trữ. `Cloud + Local` và `Local only` yêu cầu URL cơ sở Ollama, phát hiện các mô hình có sẵn, và tự động pull mô hình cục bộ đã chọn nếu mô hình đó chưa có. Khi Ollama báo cáo một thẻ `:latest` đã cài đặt như `gemma4:latest`, thiết lập hiển thị mô hình đã cài đặt đó một lần thay vì hiển thị cả `gemma4` và `gemma4:latest` hoặc pull lại alias trần. `Cloud + Local` cũng kiểm tra liệu máy chủ Ollama đó đã đăng nhập để truy cập đám mây hay chưa.
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Chế độ không tương tác

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Tùy chọn chỉ định URL cơ sở hoặc mô hình tùy chỉnh:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Thiết lập thủ công">
    **Phù hợp nhất cho:** toàn quyền kiểm soát thiết lập đám mây hoặc cục bộ.

    <Steps>
      <Step title="Chọn đám mây hoặc cục bộ">
        - **Cloud + Local**: cài đặt Ollama, đăng nhập bằng `ollama signin`, và định tuyến yêu cầu đám mây qua máy chủ đó
        - **Cloud only**: dùng `https://ollama.com` với `OLLAMA_API_KEY`
        - **Local only**: cài đặt Ollama từ [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull một mô hình cục bộ (chỉ cục bộ)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Bật Ollama cho OpenClaw">
        Với `Cloud only`, dùng `OLLAMA_API_KEY` thật của bạn. Với các thiết lập dựa trên máy chủ, bất kỳ giá trị placeholder nào cũng hoạt động:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Kiểm tra và đặt mô hình của bạn">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Hoặc đặt mặc định trong cấu hình:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Mô hình đám mây

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` dùng một máy chủ Ollama có thể truy cập làm điểm điều khiển cho cả mô hình cục bộ và đám mây. Đây là luồng lai mà Ollama ưu tiên.

    Dùng **Cloud + Local** trong quá trình thiết lập. OpenClaw nhắc nhập URL cơ sở Ollama, phát hiện mô hình cục bộ từ máy chủ đó, và kiểm tra liệu máy chủ đã đăng nhập để truy cập đám mây bằng `ollama signin` hay chưa. Khi máy chủ đã đăng nhập, OpenClaw cũng gợi ý các mặc định đám mây được lưu trữ như `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, và `glm-5.1:cloud`.

    Nếu máy chủ chưa đăng nhập, OpenClaw giữ thiết lập ở chế độ chỉ cục bộ cho đến khi bạn chạy `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` chạy với API được lưu trữ của Ollama tại `https://ollama.com`.

    Dùng **Cloud only** trong quá trình thiết lập. OpenClaw nhắc nhập `OLLAMA_API_KEY`, đặt `baseUrl: "https://ollama.com"`, và khởi tạo danh sách mô hình đám mây được lưu trữ. Đường dẫn này **không** yêu cầu máy chủ Ollama cục bộ hoặc `ollama signin`.

    Danh sách mô hình đám mây hiển thị trong `openclaw onboard` được điền trực tiếp từ `https://ollama.com/api/tags`, giới hạn 500 mục, nên bộ chọn phản ánh danh mục được lưu trữ hiện tại thay vì seed tĩnh. Nếu `ollama.com` không thể truy cập hoặc không trả về mô hình nào tại thời điểm thiết lập, OpenClaw quay về các gợi ý hardcode trước đó để onboarding vẫn hoàn tất.

    Bạn cũng có thể cấu hình trực tiếp nhà cung cấp đám mây hạng nhất:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Ở chế độ chỉ cục bộ, OpenClaw phát hiện mô hình từ phiên bản Ollama đã cấu hình. Đường dẫn này dành cho máy chủ Ollama cục bộ hoặc tự lưu trữ.

    OpenClaw hiện gợi ý `gemma4` làm mặc định cục bộ.

  </Tab>
</Tabs>

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi bạn đặt `OLLAMA_API_KEY` (hoặc hồ sơ xác thực) và **không** định nghĩa `models.providers.ollama` hoặc một nhà cung cấp từ xa tùy chỉnh khác với `api: "ollama"`, OpenClaw phát hiện mô hình từ phiên bản Ollama cục bộ tại `http://127.0.0.1:11434`.

| Hành vi              | Chi tiết                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truy vấn danh mục    | Truy vấn `/api/tags`                                                                                                                                                 |
| Phát hiện khả năng   | Dùng các lần tra cứu `/api/show` theo nỗ lực tốt nhất để đọc `contextWindow`, các tham số Modelfile `num_ctx` mở rộng, và các khả năng bao gồm thị giác/công cụ      |
| Mô hình thị giác     | Các mô hình có khả năng `vision` được `/api/show` báo cáo được đánh dấu là có khả năng hình ảnh (`input: ["text", "image"]`), nên OpenClaw tự động chèn hình ảnh vào prompt |
| Phát hiện suy luận   | Dùng các khả năng `/api/show` khi có, bao gồm `thinking`; quay về heuristic theo tên mô hình (`r1`, `reasoning`, `think`) khi Ollama bỏ qua khả năng                 |
| Giới hạn token       | Đặt `maxTokens` thành mức trần token tối đa mặc định của Ollama do OpenClaw dùng                                                                                     |
| Chi phí              | Đặt mọi chi phí thành `0`                                                                                                                                            |

Điều này tránh các mục mô hình thủ công trong khi vẫn giữ danh mục khớp với phiên bản Ollama cục bộ. Bạn có thể dùng tham chiếu đầy đủ như `ollama/<pulled-model>:latest` trong `infer model run` cục bộ; OpenClaw phân giải mô hình đã cài đặt đó từ danh mục trực tiếp của Ollama mà không cần mục `models.json` viết tay.

Với các máy chủ Ollama đã đăng nhập, một số mô hình `:cloud` có thể dùng được thông qua `/api/chat`
và `/api/show` trước khi chúng xuất hiện trong `/api/tags`. Khi bạn chọn rõ ràng một
tham chiếu đầy đủ `ollama/<model>:cloud`, OpenClaw xác thực đúng mô hình còn thiếu đó bằng
`/api/show` và chỉ thêm nó vào danh mục runtime nếu Ollama xác nhận
metadata mô hình. Lỗi chính tả vẫn thất bại dưới dạng mô hình không xác định thay vì được tự động tạo.

```bash
# See what models are available
ollama list
openclaw models list
```

Để kiểm thử khói tạo văn bản hẹp, tránh toàn bộ bề mặt công cụ của tác nhân,
hãy dùng `infer model run` cục bộ với tham chiếu mô hình Ollama đầy đủ:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Đường dẫn đó vẫn dùng nhà cung cấp, xác thực, và transport Ollama gốc đã cấu hình của OpenClaw,
nhưng không bắt đầu lượt chat-agent hoặc tải ngữ cảnh MCP/công cụ. Nếu
đường dẫn này thành công trong khi phản hồi tác nhân thông thường thất bại, tiếp theo hãy khắc phục sự cố về
dung lượng prompt/công cụ của tác nhân trong mô hình.

Để kiểm thử khói mô hình thị giác hẹp trên cùng đường dẫn gọn nhẹ, thêm một hoặc nhiều
tệp hình ảnh vào `infer model run`. Thao tác này gửi trực tiếp prompt và hình ảnh tới
mô hình thị giác Ollama đã chọn mà không tải công cụ chat, bộ nhớ, hoặc ngữ cảnh phiên
trước đó:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` chấp nhận các tệp được phát hiện là `image/*`, bao gồm các đầu vào PNG,
JPEG và WebP phổ biến. Các tệp không phải hình ảnh bị từ chối trước khi gọi Ollama.
Để nhận dạng giọng nói, hãy dùng `openclaw infer audio transcribe` thay thế.

Khi bạn chuyển một cuộc trò chuyện bằng `/model ollama/<model>`, OpenClaw xem
đó là lựa chọn chính xác của người dùng. Nếu `baseUrl` Ollama đã cấu hình
không truy cập được, lượt trả lời tiếp theo sẽ thất bại với lỗi nhà cung cấp thay vì âm thầm
trả lời từ một mô hình dự phòng đã cấu hình khác.

Các cron job cô lập thực hiện thêm một kiểm tra an toàn cục bộ trước khi bắt đầu lượt
agent. Nếu mô hình đã chọn phân giải tới một nhà cung cấp Ollama cục bộ, mạng riêng, hoặc `.local`
và `/api/tags` không truy cập được, OpenClaw ghi nhận lần chạy Cron đó
là `skipped` với `ollama/<model>` đã chọn trong nội dung lỗi. Bước kiểm tra trước endpoint
được lưu cache trong 5 phút, vì vậy nhiều Cron job trỏ tới cùng một daemon Ollama
đã dừng sẽ không cùng khởi chạy các yêu cầu mô hình thất bại.

Xác minh trực tiếp đường dẫn văn bản cục bộ, đường dẫn stream gốc, và embeddings với
Ollama cục bộ bằng:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Đối với kiểm thử smoke API key Ollama Cloud, trỏ live test tới `https://ollama.com`
và chọn một mô hình được lưu trữ từ catalog hiện tại:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Kiểm thử smoke trên đám mây chạy văn bản, stream gốc, và tìm kiếm web. Mặc định nó bỏ qua embeddings
cho `https://ollama.com` vì API key Ollama Cloud có thể không được ủy quyền
`/api/embed`. Đặt `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` khi bạn chủ động muốn
live test thất bại nếu khóa đám mây đã cấu hình không thể dùng endpoint embed.

Để thêm một mô hình mới, chỉ cần pull bằng Ollama:

```bash
ollama pull mistral
```

Mô hình mới sẽ được tự động phát hiện và sẵn sàng để sử dụng.

<Note>
Nếu bạn đặt `models.providers.ollama` một cách tường minh, hoặc cấu hình một nhà cung cấp từ xa tùy chỉnh như `models.providers.ollama-cloud` với `api: "ollama"`, tự động phát hiện sẽ bị bỏ qua và bạn phải định nghĩa mô hình thủ công. Các nhà cung cấp tùy chỉnh loopback như `http://127.0.0.2:11434` vẫn được xem là cục bộ. Xem phần cấu hình tường minh bên dưới.
</Note>

## Vision và mô tả hình ảnh

Plugin Ollama đi kèm đăng ký Ollama làm nhà cung cấp hiểu nội dung media có khả năng xử lý hình ảnh. Điều này cho phép OpenClaw định tuyến các yêu cầu mô tả hình ảnh tường minh và các mặc định mô hình hình ảnh đã cấu hình qua các mô hình vision Ollama cục bộ hoặc được lưu trữ.

Đối với vision cục bộ, pull một mô hình hỗ trợ hình ảnh:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Sau đó xác minh bằng infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` phải là một ref `<provider/model>` đầy đủ. Khi được đặt, `openclaw infer image describe` sẽ thử mô hình đó trước thay vì bỏ qua mô tả vì mô hình hỗ trợ vision gốc. Nếu lệnh gọi mô hình thất bại, OpenClaw có thể tiếp tục qua `agents.defaults.imageModel.fallbacks` đã cấu hình; lỗi chuẩn bị tệp hoặc URL vẫn thất bại trước các lần thử dự phòng.

Dùng `infer image describe` khi bạn muốn luồng nhà cung cấp hiểu hình ảnh của OpenClaw, `agents.defaults.imageModel` đã cấu hình, và định dạng đầu ra mô tả hình ảnh. Dùng `infer model run --file` khi bạn muốn thăm dò mô hình đa phương thức thô với prompt tùy chỉnh và một hoặc nhiều hình ảnh.

Để đặt Ollama làm mô hình hiểu hình ảnh mặc định cho media đến, hãy cấu hình `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Ưu tiên ref đầy đủ `ollama/<model>`. Nếu cùng mô hình được liệt kê dưới `models.providers.ollama.models` với `input: ["text", "image"]` và không có nhà cung cấp hình ảnh đã cấu hình nào khác công bố ID mô hình trần đó, OpenClaw cũng chuẩn hóa một ref `imageModel` trần như `qwen2.5vl:7b` thành `ollama/qwen2.5vl:7b`. Nếu nhiều hơn một nhà cung cấp hình ảnh đã cấu hình có cùng ID trần, hãy dùng tiền tố nhà cung cấp một cách tường minh.

Các mô hình vision cục bộ chậm có thể cần timeout hiểu hình ảnh dài hơn so với mô hình đám mây. Chúng cũng có thể crash hoặc dừng khi Ollama cố cấp phát toàn bộ ngữ cảnh vision được công bố trên phần cứng hạn chế. Đặt timeout theo capability, và giới hạn `num_ctx` trên mục mô hình khi bạn chỉ cần một lượt mô tả hình ảnh thông thường:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Timeout này áp dụng cho việc hiểu hình ảnh đến và cho công cụ `image` tường minh mà agent có thể gọi trong một lượt. `models.providers.ollama.timeoutSeconds` cấp nhà cung cấp vẫn kiểm soát bộ chặn yêu cầu HTTP Ollama bên dưới cho các lệnh gọi mô hình thông thường.

Xác minh trực tiếp công cụ hình ảnh tường minh với Ollama cục bộ bằng:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Nếu bạn định nghĩa thủ công `models.providers.ollama.models`, hãy đánh dấu các mô hình vision bằng hỗ trợ đầu vào hình ảnh:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw từ chối các yêu cầu mô tả hình ảnh cho những mô hình không được đánh dấu là có khả năng xử lý hình ảnh. Với phát hiện ngầm định, OpenClaw đọc thông tin này từ Ollama khi `/api/show` báo cáo capability vision.

## Cấu hình

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Đường dẫn bật tính năng đơn giản nhất chỉ cho cục bộ là qua biến môi trường:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Nếu `OLLAMA_API_KEY` được đặt, bạn có thể bỏ qua `apiKey` trong mục nhà cung cấp và OpenClaw sẽ điền nó cho các kiểm tra tính khả dụng.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Dùng cấu hình tường minh khi bạn muốn thiết lập đám mây được lưu trữ, Ollama chạy trên host/cổng khác, bạn muốn ép buộc các cửa sổ ngữ cảnh hoặc danh sách mô hình cụ thể, hoặc bạn muốn định nghĩa mô hình hoàn toàn thủ công.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Nếu Ollama đang chạy trên host hoặc cổng khác (cấu hình tường minh tắt tự động phát hiện, vì vậy hãy định nghĩa mô hình thủ công):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Không thêm `/v1` vào URL. Đường dẫn `/v1` dùng chế độ tương thích OpenAI, trong đó gọi công cụ không đáng tin cậy. Dùng URL Ollama cơ sở không có hậu tố đường dẫn.
    </Warning>

  </Tab>
</Tabs>

## Công thức phổ biến

Dùng các mục này làm điểm bắt đầu và thay ID mô hình bằng tên chính xác từ `ollama list` hoặc `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Dùng cách này khi Ollama chạy trên cùng máy với Gateway và bạn muốn OpenClaw tự động phát hiện các mô hình đã cài đặt.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Đường dẫn này giữ cấu hình ở mức tối thiểu. Không thêm khối `models.providers.ollama` trừ khi bạn muốn định nghĩa mô hình thủ công.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Dùng URL Ollama gốc cho host LAN. Không thêm `/v1`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` là ngân sách ngữ cảnh phía OpenClaw. `params.num_ctx` được gửi tới Ollama cho yêu cầu. Giữ chúng đồng bộ khi phần cứng của bạn không thể chạy toàn bộ ngữ cảnh mà mô hình công bố.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Dùng cách này khi bạn không chạy daemon cục bộ và muốn dùng trực tiếp các mô hình Ollama được lưu trữ.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    Dùng cách này khi daemon Ollama cục bộ hoặc LAN đã đăng nhập bằng `ollama signin` và cần phục vụ cả mô hình cục bộ lẫn mô hình `:cloud`.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Nhiều máy chủ Ollama">
    Dùng ID nhà cung cấp tùy chỉnh khi bạn có nhiều hơn một máy chủ Ollama. Mỗi nhà cung cấp có máy chủ, mô hình, xác thực, thời gian chờ và tham chiếu mô hình riêng.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Khi OpenClaw gửi yêu cầu, tiền tố nhà cung cấp đang hoạt động sẽ bị loại bỏ để `ollama-large/qwen3.5:27b` đến Ollama dưới dạng `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Hồ sơ mô hình cục bộ tinh gọn">
    Một số mô hình cục bộ có thể trả lời các lời nhắc đơn giản nhưng gặp khó khăn với toàn bộ bề mặt công cụ của tác tử. Hãy bắt đầu bằng cách giới hạn công cụ và ngữ cảnh trước khi thay đổi cài đặt runtime toàn cục.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Chỉ dùng `compat.supportsTools: false` khi mô hình hoặc máy chủ thường xuyên lỗi với schema công cụ. Điều này đánh đổi năng lực tác tử để lấy độ ổn định.
    `localModelLean` loại bỏ trình duyệt, cron và công cụ tin nhắn khỏi bề mặt tác tử trực tiếp, đồng thời mặc định đặt các danh mục lớn hơn phía sau các điều khiển Tìm kiếm công cụ có cấu trúc, trừ khi một lần chạy phải giữ ngữ nghĩa gửi tin nhắn trực tiếp; tuy nhiên, nó không thay đổi ngữ cảnh runtime hoặc chế độ suy nghĩ của Ollama. Kết hợp nó với `params.num_ctx` rõ ràng và `params.thinking: false` cho các mô hình suy nghĩ nhỏ kiểu Qwen thường lặp vòng hoặc tiêu tốn ngân sách phản hồi cho lập luận ẩn.

  </Accordion>
</AccordionGroup>

### Chọn mô hình

Sau khi cấu hình, tất cả mô hình Ollama của bạn đều khả dụng:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

ID nhà cung cấp Ollama tùy chỉnh cũng được hỗ trợ. Khi một tham chiếu mô hình dùng tiền tố
nhà cung cấp đang hoạt động, chẳng hạn như `ollama-spark/qwen3:32b`, OpenClaw chỉ loại bỏ
tiền tố đó trước khi gọi Ollama để máy chủ nhận được `qwen3:32b`.

Với các mô hình cục bộ chậm, ưu tiên tinh chỉnh yêu cầu theo phạm vi nhà cung cấp trước khi tăng
thời gian chờ runtime của toàn bộ tác tử:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` áp dụng cho yêu cầu HTTP của mô hình, bao gồm thiết lập kết nối,
header, truyền luồng phần thân và toàn bộ lệnh hủy guarded-fetch. `params.keep_alive`
được chuyển tiếp đến Ollama dưới dạng `keep_alive` cấp cao nhất trên các yêu cầu `/api/chat` gốc;
hãy đặt theo từng mô hình khi thời gian tải lượt đầu là nút thắt.

### Xác minh nhanh

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Với máy chủ từ xa, thay `127.0.0.1` bằng máy chủ được dùng trong `baseUrl`. Nếu `curl` hoạt động nhưng OpenClaw thì không, hãy kiểm tra xem Gateway có đang chạy trên một máy, container hoặc tài khoản dịch vụ khác hay không.

## Tìm kiếm web Ollama

OpenClaw hỗ trợ **Tìm kiếm web Ollama** dưới dạng nhà cung cấp `web_search` được đóng gói sẵn.

| Thuộc tính  | Chi tiết                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Máy chủ     | Dùng máy chủ Ollama đã cấu hình của bạn (`models.providers.ollama.baseUrl` khi được đặt, nếu không là `http://127.0.0.1:11434`); `https://ollama.com` dùng trực tiếp API được lưu trữ |
| Xác thực    | Không cần khóa cho máy chủ Ollama cục bộ đã đăng nhập; `OLLAMA_API_KEY` hoặc xác thực nhà cung cấp đã cấu hình cho tìm kiếm trực tiếp qua `https://ollama.com` hoặc máy chủ được bảo vệ bằng xác thực |
| Yêu cầu     | Máy chủ cục bộ/tự lưu trữ phải đang chạy và đã đăng nhập bằng `ollama signin`; tìm kiếm trực tiếp được lưu trữ yêu cầu `baseUrl: "https://ollama.com"` cùng một khóa API Ollama thật |

Chọn **Tìm kiếm web Ollama** trong `openclaw onboard` hoặc `openclaw configure --section web`, hoặc đặt:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Để tìm kiếm trực tiếp được lưu trữ qua Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Với daemon cục bộ đã đăng nhập, OpenClaw dùng proxy `/api/experimental/web_search` của daemon. Với `https://ollama.com`, nó gọi trực tiếp endpoint `/api/web_search` được lưu trữ.

<Note>
Để xem đầy đủ chi tiết thiết lập và hành vi, hãy xem [Tìm kiếm web Ollama](/vi/tools/ollama-search).
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ tương thích OpenAI cũ">
    <Warning>
    **Gọi công cụ không đáng tin cậy trong chế độ tương thích OpenAI.** Chỉ dùng chế độ này nếu bạn cần định dạng OpenAI cho một proxy và không phụ thuộc vào hành vi gọi công cụ gốc.
    </Warning>

    Nếu bạn cần dùng endpoint tương thích OpenAI thay thế (ví dụ, phía sau một proxy chỉ hỗ trợ định dạng OpenAI), hãy đặt rõ `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Chế độ này có thể không hỗ trợ đồng thời truyền luồng và gọi công cụ. Bạn có thể cần tắt truyền luồng bằng `params: { streaming: false }` trong cấu hình mô hình.

    Khi `api: "openai-completions"` được dùng với Ollama, OpenClaw mặc định chèn `options.num_ctx` để Ollama không âm thầm quay về cửa sổ ngữ cảnh 4096. Nếu proxy/upstream của bạn từ chối các trường `options` không xác định, hãy tắt hành vi này:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Cửa sổ ngữ cảnh">
    Với các mô hình được tự động phát hiện, OpenClaw dùng cửa sổ ngữ cảnh do Ollama báo cáo khi có, bao gồm các giá trị `PARAMETER num_ctx` lớn hơn từ Modelfile tùy chỉnh. Nếu không, nó quay về cửa sổ ngữ cảnh Ollama mặc định mà OpenClaw dùng.

    Bạn có thể đặt mặc định `contextWindow`, `contextTokens` và `maxTokens` ở cấp nhà cung cấp cho mọi mô hình trong nhà cung cấp Ollama đó, rồi ghi đè theo từng mô hình khi cần. `contextWindow` là ngân sách lời nhắc và Compaction của OpenClaw. Các yêu cầu Ollama gốc để `options.num_ctx` chưa đặt, trừ khi bạn cấu hình rõ `params.num_ctx`, để Ollama có thể áp dụng mặc định riêng theo mô hình, `OLLAMA_CONTEXT_LENGTH` hoặc VRAM. Để giới hạn hoặc ép ngữ cảnh runtime theo từng yêu cầu của Ollama mà không cần xây dựng lại Modelfile, hãy đặt `params.num_ctx`; các giá trị không hợp lệ, bằng không, âm và không hữu hạn sẽ bị bỏ qua. Nếu bạn đã nâng cấp một cấu hình cũ chỉ dùng `contextWindow` hoặc `maxTokens` để ép ngữ cảnh yêu cầu Ollama gốc, hãy chạy `openclaw doctor --fix` để sao chép các ngân sách rõ ràng ở cấp nhà cung cấp hoặc mô hình đó vào `params.num_ctx`. Bộ chuyển đổi Ollama tương thích OpenAI vẫn mặc định chèn `options.num_ctx` từ `params.num_ctx` hoặc `contextWindow` đã cấu hình; hãy tắt bằng `injectNumCtxForOpenAICompat: false` nếu upstream của bạn từ chối `options`.

    Các mục mô hình Ollama gốc cũng chấp nhận những tùy chọn runtime Ollama phổ biến trong `params`, bao gồm `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` và `use_mmap`. OpenClaw chỉ chuyển tiếp các khóa yêu cầu Ollama, nên các tham số runtime OpenClaw như `streaming` không bị rò rỉ sang Ollama. Dùng `params.think` hoặc `params.thinking` để gửi `think` cấp cao nhất của Ollama; `false` tắt suy nghĩ cấp API cho các mô hình suy nghĩ kiểu Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` theo từng mô hình cũng hoạt động. Nếu cả hai đều được cấu hình, mục mô hình nhà cung cấp rõ ràng sẽ thắng mặc định tác tử.

  </Accordion>

  <Accordion title="Điều khiển suy nghĩ">
    Với các mô hình Ollama gốc, OpenClaw chuyển tiếp điều khiển suy nghĩ đúng như Ollama mong đợi: `think` cấp cao nhất, không phải `options.think`. Các mô hình được tự động phát hiện có phản hồi `/api/show` bao gồm capability `thinking` sẽ hiển thị `/think low`, `/think medium`, `/think high` và `/think max`; các mô hình không suy nghĩ chỉ hiển thị `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Bạn cũng có thể đặt mặc định cho mô hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think` hoặc `params.thinking` theo từng mô hình có thể tắt hoặc ép suy nghĩ API Ollama cho một mô hình đã cấu hình cụ thể. OpenClaw giữ nguyên các tham số mô hình rõ ràng đó khi lần chạy đang hoạt động chỉ có mặc định ngầm định `off`; các lệnh runtime không phải off như `/think medium` vẫn ghi đè lần chạy đang hoạt động.

  </Accordion>

  <Accordion title="Mô hình lập luận">
    OpenClaw mặc định xem các mô hình có tên như `deepseek-r1`, `reasoning` hoặc `think` là có khả năng lập luận.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Không cần cấu hình bổ sung. OpenClaw tự động đánh dấu chúng.

  </Accordion>

  <Accordion title="Chi phí mô hình">
    Ollama miễn phí và chạy cục bộ, nên mọi chi phí mô hình đều được đặt thành $0. Điều này áp dụng cho cả mô hình được tự động phát hiện và mô hình được định nghĩa thủ công.
  </Accordion>

  <Accordion title="Embedding bộ nhớ">
    Plugin Ollama đi kèm đăng ký một nhà cung cấp embedding bộ nhớ cho
    [tìm kiếm bộ nhớ](/vi/concepts/memory). Nó dùng URL cơ sở Ollama
    và khóa API đã cấu hình, gọi endpoint `/api/embed` hiện tại của Ollama, và gom
    nhiều đoạn bộ nhớ vào một yêu cầu `input` khi có thể.

    Khi `proxy.enabled=true`, các yêu cầu embedding bộ nhớ Ollama tới đúng
    origin host-local loopback được suy ra từ `baseUrl` đã cấu hình sẽ dùng
    đường dẫn trực tiếp được bảo vệ của OpenClaw thay vì proxy chuyển tiếp được quản lý. Tên máy chủ
    đã cấu hình phải chính là `localhost` hoặc một literal IP loopback;
    các tên DNS chỉ phân giải về loopback vẫn dùng đường dẫn proxy được quản lý.
    Các máy chủ Ollama trên LAN, tailnet, mạng riêng và công khai cũng vẫn đi qua
    đường dẫn proxy được quản lý. Chuyển hướng sang máy chủ hoặc cổng khác không kế thừa độ tin cậy.
    Người vận hành vẫn có thể đặt thiết lập toàn cục `proxy.loopbackMode: "proxy"` để
    gửi lưu lượng loopback qua proxy, hoặc `proxy.loopbackMode: "block"`
    để từ chối kết nối loopback trước khi mở kết nối; xem
    [Proxy được quản lý](/vi/security/network-proxy#gateway-loopback-mode) để biết
    tác động trên toàn tiến trình của thiết lập này.

    | Thuộc tính    | Giá trị             |
    | ------------- | ------------------- |
    | Mô hình mặc định | `nomic-embed-text`  |
    | Tự động kéo     | Có — mô hình embedding được kéo tự động nếu chưa có cục bộ |

    Embedding tại thời điểm truy vấn dùng tiền tố truy xuất cho các mô hình yêu cầu hoặc khuyến nghị chúng, bao gồm `nomic-embed-text`, `qwen3-embedding`, và `mxbai-embed-large`. Các lô tài liệu bộ nhớ giữ nguyên dạng thô để các chỉ mục hiện có không cần di chuyển định dạng.

    Để chọn Ollama làm nhà cung cấp embedding cho tìm kiếm bộ nhớ:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Với máy chủ embedding từ xa, hãy giới hạn xác thực trong phạm vi máy chủ đó:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cấu hình streaming">
    Tích hợp Ollama của OpenClaw mặc định dùng **API Ollama gốc** (`/api/chat`), hỗ trợ đầy đủ streaming và gọi công cụ cùng lúc. Không cần cấu hình đặc biệt.

    Với các yêu cầu `/api/chat` gốc, OpenClaw cũng chuyển tiếp điều khiển suy nghĩ trực tiếp tới Ollama: `/think off` và `openclaw agent --thinking off` gửi `think: false` ở cấp cao nhất, trừ khi đã cấu hình giá trị mô hình `params.think`/`params.thinking` rõ ràng, còn `/think low|medium|high` gửi chuỗi mức `think` cấp cao nhất tương ứng. `/think max` ánh xạ tới mức gốc cao nhất của Ollama, `think: "high"`.

    <Tip>
    Nếu bạn cần dùng endpoint tương thích OpenAI, hãy xem phần "Chế độ tương thích OpenAI cũ" ở trên. Streaming và gọi công cụ có thể không hoạt động đồng thời trong chế độ đó.
    </Tip>

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Vòng lặp sự cố WSL2 (khởi động lại lặp lại)">
    Trên WSL2 với NVIDIA/CUDA, trình cài đặt Ollama Linux chính thức tạo một unit systemd `ollama.service` với `Restart=always`. Nếu dịch vụ đó tự khởi động và tải một mô hình dùng GPU trong lúc WSL2 khởi động, Ollama có thể ghim bộ nhớ máy chủ khi mô hình tải. Cơ chế thu hồi bộ nhớ Hyper-V không phải lúc nào cũng thu hồi được các trang đã ghim đó, nên Windows có thể chấm dứt VM WSL2, systemd lại khởi động Ollama, và vòng lặp lặp lại.

    Bằng chứng thường gặp:

    - WSL2 khởi động lại hoặc bị chấm dứt lặp lại từ phía Windows
    - CPU cao trong `app.slice` hoặc `ollama.service` ngay sau khi WSL2 khởi động
    - SIGTERM từ systemd thay vì sự kiện OOM-killer của Linux

    OpenClaw ghi cảnh báo khởi động khi phát hiện WSL2, `ollama.service` được bật với `Restart=always`, và có các dấu hiệu CUDA thấy được.

    Cách giảm thiểu:

    ```bash
    sudo systemctl disable ollama
    ```

    Thêm phần này vào `%USERPROFILE%\.wslconfig` ở phía Windows, rồi chạy `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Đặt thời gian keep-alive ngắn hơn trong môi trường dịch vụ Ollama, hoặc chỉ khởi động Ollama thủ công khi bạn cần:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Xem [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Không phát hiện Ollama">
    Đảm bảo Ollama đang chạy, bạn đã đặt `OLLAMA_API_KEY` (hoặc một hồ sơ xác thực), và bạn **không** định nghĩa mục `models.providers.ollama` rõ ràng:

    ```bash
    ollama serve
    ```

    Xác minh API có thể truy cập được:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Không có mô hình khả dụng">
    Nếu mô hình của bạn không được liệt kê, hãy kéo mô hình cục bộ hoặc định nghĩa rõ trong `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Kết nối bị từ chối">
    Kiểm tra Ollama đang chạy trên đúng cổng:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Máy chủ từ xa hoạt động với curl nhưng không hoạt động với OpenClaw">
    Xác minh từ cùng máy và runtime đang chạy Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Nguyên nhân thường gặp:

    - `baseUrl` trỏ tới `localhost`, nhưng Gateway chạy trong Docker hoặc trên máy chủ khác.
    - URL dùng `/v1`, chọn hành vi tương thích OpenAI thay vì Ollama gốc.
    - Máy chủ từ xa cần thay đổi tường lửa hoặc binding LAN ở phía Ollama.
    - Mô hình có trên daemon của laptop bạn nhưng không có trên daemon từ xa.

  </Accordion>

  <Accordion title="Mô hình xuất JSON công cụ dưới dạng văn bản">
    Điều này thường có nghĩa là nhà cung cấp đang dùng chế độ tương thích OpenAI hoặc mô hình không xử lý được schema công cụ.

    Ưu tiên chế độ Ollama gốc:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Nếu một mô hình cục bộ nhỏ vẫn thất bại với schema công cụ, hãy đặt `compat.supportsTools: false` trên mục mô hình đó và kiểm thử lại.

  </Accordion>

  <Accordion title="Kimi hoặc GLM trả về ký hiệu lỗi">
    Các phản hồi Kimi/GLM được lưu trữ có dạng chuỗi ký hiệu dài, phi ngôn ngữ được xử lý như đầu ra nhà cung cấp thất bại thay vì câu trả lời trợ lý thành công. Điều đó cho phép cơ chế thử lại, fallback, hoặc xử lý lỗi thông thường tiếp quản mà không lưu văn bản hỏng vào phiên.

    Nếu việc này xảy ra lặp lại, hãy ghi lại tên mô hình thô, tệp phiên hiện tại, và lần chạy đã dùng `Cloud + Local` hay `Cloud only`, rồi thử một phiên mới và một mô hình fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Mô hình cục bộ nguội bị hết thời gian chờ">
    Các mô hình cục bộ lớn có thể cần thời gian tải đầu tiên dài trước khi streaming bắt đầu. Giữ thời gian chờ trong phạm vi nhà cung cấp Ollama, và tùy chọn yêu cầu Ollama giữ mô hình đã tải giữa các lượt:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Nếu chính máy chủ chậm chấp nhận kết nối, `timeoutSeconds` cũng kéo dài thời gian chờ kết nối Undici được bảo vệ cho nhà cung cấp này.

  </Accordion>

  <Accordion title="Mô hình ngữ cảnh lớn quá chậm hoặc hết bộ nhớ">
    Nhiều mô hình Ollama quảng bá ngữ cảnh lớn hơn mức phần cứng của bạn có thể chạy thoải mái. Ollama gốc dùng mặc định ngữ cảnh runtime riêng của Ollama, trừ khi bạn đặt `params.num_ctx`. Giới hạn cả ngân sách của OpenClaw và ngữ cảnh yêu cầu của Ollama khi bạn muốn độ trễ token đầu tiên dự đoán được:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Trước tiên hãy giảm `contextWindow` nếu OpenClaw đang gửi quá nhiều prompt. Giảm `params.num_ctx` nếu Ollama đang tải ngữ cảnh runtime quá lớn đối với máy. Giảm `maxTokens` nếu quá trình sinh kéo dài quá lâu.

  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
  <Card title="Tìm kiếm web Ollama" href="/vi/tools/ollama-search" icon="magnifying-glass">
    Thiết lập đầy đủ và chi tiết hành vi cho tìm kiếm web dùng Ollama.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
