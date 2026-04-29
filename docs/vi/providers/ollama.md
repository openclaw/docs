---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình đám mây hoặc cục bộ thông qua Ollama
    - Bạn cần hướng dẫn thiết lập và cấu hình Ollama
    - Bạn muốn dùng các mô hình thị giác Ollama để hiểu hình ảnh
summary: Chạy OpenClaw với Ollama (các mô hình đám mây và cục bộ)
title: Ollama
x-i18n:
    generated_at: "2026-04-29T23:07:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw tích hợp với API gốc của Ollama (`/api/chat`) cho các mô hình đám mây được lưu trữ và máy chủ Ollama cục bộ/tự lưu trữ. Bạn có thể dùng Ollama ở ba chế độ: `Cloud + Local` thông qua một máy chủ Ollama có thể truy cập, `Cloud only` với `https://ollama.com`, hoặc `Local only` với một máy chủ Ollama có thể truy cập.

<Warning>
**Người dùng Ollama từ xa**: Không dùng URL tương thích OpenAI `/v1` (`http://host:11434/v1`) với OpenClaw. Điều này làm hỏng việc gọi công cụ và mô hình có thể xuất JSON công cụ thô dưới dạng văn bản thuần. Thay vào đó, hãy dùng URL API gốc của Ollama: `baseUrl: "http://host:11434"` (không có `/v1`).
</Warning>

Cấu hình nhà cung cấp Ollama dùng `baseUrl` làm khóa chuẩn. OpenClaw cũng chấp nhận `baseURL` để tương thích với các ví dụ kiểu OpenAI SDK, nhưng cấu hình mới nên ưu tiên `baseUrl`.

## Quy tắc xác thực

<AccordionGroup>
  <Accordion title="Máy chủ cục bộ và LAN">
    Máy chủ Ollama cục bộ và LAN không cần token bearer thật. OpenClaw chỉ dùng dấu hiệu cục bộ `ollama-local` cho URL cơ sở Ollama loopback, mạng riêng, `.local` và tên máy chủ trần.
  </Accordion>
  <Accordion title="Máy chủ từ xa và Ollama Cloud">
    Máy chủ công khai từ xa và Ollama Cloud (`https://ollama.com`) yêu cầu thông tin xác thực thật thông qua `OLLAMA_API_KEY`, hồ sơ xác thực, hoặc `apiKey` của nhà cung cấp.
  </Accordion>
  <Accordion title="ID nhà cung cấp tùy chỉnh">
    ID nhà cung cấp tùy chỉnh đặt `api: "ollama"` tuân theo cùng các quy tắc. Ví dụ, nhà cung cấp `ollama-remote` trỏ tới máy chủ Ollama trong LAN riêng có thể dùng `apiKey: "ollama-local"` và tác nhân con sẽ phân giải dấu hiệu đó thông qua hook nhà cung cấp Ollama thay vì coi đó là thông tin xác thực bị thiếu. Tìm kiếm bộ nhớ cũng có thể đặt `agents.defaults.memorySearch.provider` thành ID nhà cung cấp tùy chỉnh đó để embedding dùng endpoint Ollama tương ứng.
  </Accordion>
  <Accordion title="Hồ sơ xác thực">
    `auth-profiles.json` lưu thông tin xác thực cho một ID nhà cung cấp. Đặt thiết lập endpoint (`baseUrl`, `api`, ID mô hình, header, timeout) trong `models.providers.<id>`. Các tệp hồ sơ xác thực phẳng cũ hơn như `{ "ollama-windows": { "apiKey": "ollama-local" } }` không phải định dạng runtime; chạy `openclaw doctor --fix` để viết lại chúng thành hồ sơ khóa API chuẩn `ollama-windows:default` kèm bản sao lưu. `baseUrl` trong tệp đó là nhiễu tương thích và nên được chuyển sang cấu hình nhà cung cấp.
  </Accordion>
  <Accordion title="Phạm vi embedding bộ nhớ">
    Khi Ollama được dùng cho embedding bộ nhớ, xác thực bearer được giới hạn trong máy chủ nơi nó được khai báo:

    - Khóa cấp nhà cung cấp chỉ được gửi tới máy chủ Ollama của nhà cung cấp đó.
    - `agents.*.memorySearch.remote.apiKey` chỉ được gửi tới máy chủ embedding từ xa của nó.
    - Giá trị env `OLLAMA_API_KEY` thuần được coi là quy ước Ollama Cloud, mặc định không gửi tới máy chủ cục bộ hoặc tự lưu trữ.

  </Accordion>
</AccordionGroup>

## Bắt đầu

Chọn phương thức thiết lập và chế độ bạn muốn.

<Tabs>
  <Tab title="Onboarding (khuyến nghị)">
    **Phù hợp nhất cho:** đường dẫn nhanh nhất để có thiết lập Ollama đám mây hoặc cục bộ hoạt động.

    <Steps>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard
        ```

        Chọn **Ollama** từ danh sách nhà cung cấp.
      </Step>
      <Step title="Chọn chế độ">
        - **Cloud + Local** — máy chủ Ollama cục bộ cộng với mô hình đám mây được định tuyến qua máy chủ đó
        - **Cloud only** — mô hình Ollama được lưu trữ qua `https://ollama.com`
        - **Local only** — chỉ mô hình cục bộ

      </Step>
      <Step title="Chọn mô hình">
        `Cloud only` nhắc nhập `OLLAMA_API_KEY` và đề xuất mặc định đám mây được lưu trữ. `Cloud + Local` và `Local only` yêu cầu URL cơ sở Ollama, phát hiện các mô hình có sẵn, và tự động pull mô hình cục bộ đã chọn nếu chưa có. Khi Ollama báo cáo một thẻ `:latest` đã cài đặt như `gemma4:latest`, thiết lập hiển thị mô hình đã cài đặt đó một lần thay vì hiển thị cả `gemma4` và `gemma4:latest` hoặc pull lại bí danh trần. `Cloud + Local` cũng kiểm tra máy chủ Ollama đó đã đăng nhập để truy cập đám mây hay chưa.
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
      <Step title="Pull mô hình cục bộ (chỉ cục bộ)">
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
    `Cloud + Local` dùng một máy chủ Ollama có thể truy cập làm điểm điều khiển cho cả mô hình cục bộ và mô hình đám mây. Đây là luồng lai được Ollama ưu tiên.

    Dùng **Cloud + Local** trong quá trình thiết lập. OpenClaw nhắc nhập URL cơ sở Ollama, phát hiện mô hình cục bộ từ máy chủ đó, và kiểm tra máy chủ đã đăng nhập để truy cập đám mây bằng `ollama signin` hay chưa. Khi máy chủ đã đăng nhập, OpenClaw cũng đề xuất các mặc định đám mây được lưu trữ như `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, và `glm-5.1:cloud`.

    Nếu máy chủ chưa đăng nhập, OpenClaw giữ thiết lập ở chế độ chỉ cục bộ cho đến khi bạn chạy `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` chạy với API được lưu trữ của Ollama tại `https://ollama.com`.

    Dùng **Cloud only** trong quá trình thiết lập. OpenClaw nhắc nhập `OLLAMA_API_KEY`, đặt `baseUrl: "https://ollama.com"`, và khởi tạo danh sách mô hình đám mây được lưu trữ. Đường dẫn này **không** yêu cầu máy chủ Ollama cục bộ hoặc `ollama signin`.

    Danh sách mô hình đám mây hiển thị trong `openclaw onboard` được lấy trực tiếp từ `https://ollama.com/api/tags`, giới hạn ở 500 mục, nên bộ chọn phản ánh catalog được lưu trữ hiện tại thay vì seed tĩnh. Nếu `ollama.com` không thể truy cập hoặc không trả về mô hình nào tại thời điểm thiết lập, OpenClaw quay về các đề xuất hardcoded trước đó để onboarding vẫn hoàn tất.

  </Tab>

  <Tab title="Local only">
    Ở chế độ chỉ cục bộ, OpenClaw phát hiện mô hình từ phiên bản Ollama đã cấu hình. Đường dẫn này dành cho máy chủ Ollama cục bộ hoặc tự lưu trữ.

    OpenClaw hiện đề xuất `gemma4` làm mặc định cục bộ.

  </Tab>
</Tabs>

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi bạn đặt `OLLAMA_API_KEY` (hoặc hồ sơ xác thực) và **không** định nghĩa `models.providers.ollama` hoặc nhà cung cấp từ xa tùy chỉnh khác với `api: "ollama"`, OpenClaw phát hiện mô hình từ phiên bản Ollama cục bộ tại `http://127.0.0.1:11434`.

| Hành vi              | Chi tiết                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truy vấn catalog     | Truy vấn `/api/tags`                                                                                                                                                 |
| Phát hiện năng lực   | Dùng tra cứu best-effort `/api/show` để đọc `contextWindow`, tham số Modelfile `num_ctx` đã mở rộng, và các năng lực bao gồm thị giác/công cụ                       |
| Mô hình thị giác     | Các mô hình có năng lực `vision` do `/api/show` báo cáo được đánh dấu là hỗ trợ hình ảnh (`input: ["text", "image"]`), nên OpenClaw tự động chèn hình ảnh vào prompt |
| Phát hiện suy luận   | Dùng năng lực `/api/show` khi có, bao gồm `thinking`; quay về heuristic theo tên mô hình (`r1`, `reasoning`, `think`) khi Ollama bỏ qua năng lực                    |
| Giới hạn token       | Đặt `maxTokens` thành mức trần token tối đa mặc định của Ollama mà OpenClaw dùng                                                                                    |
| Chi phí              | Đặt mọi chi phí thành `0`                                                                                                                                            |

Điều này tránh phải nhập mô hình thủ công trong khi vẫn giữ catalog đồng bộ với phiên bản Ollama cục bộ. Bạn có thể dùng ref đầy đủ như `ollama/<pulled-model>:latest` trong `infer model run` cục bộ; OpenClaw phân giải mô hình đã cài đặt đó từ catalog trực tiếp của Ollama mà không cần mục `models.json` viết tay.

Với các máy chủ Ollama đã đăng nhập, một số mô hình `:cloud` có thể dùng được thông qua `/api/chat`
và `/api/show` trước khi chúng xuất hiện trong `/api/tags`. Khi bạn chọn rõ ràng một
ref đầy đủ `ollama/<model>:cloud`, OpenClaw xác thực chính xác mô hình bị thiếu đó bằng
`/api/show` và chỉ thêm nó vào catalog runtime nếu Ollama xác nhận siêu dữ liệu
mô hình. Lỗi chính tả vẫn thất bại dưới dạng mô hình không xác định thay vì được tự động tạo.

```bash
# See what models are available
ollama list
openclaw models list
```

Đối với kiểm tra smoke tạo văn bản hẹp tránh toàn bộ bề mặt công cụ tác nhân,
hãy dùng `infer model run` cục bộ với ref mô hình Ollama đầy đủ:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Đường dẫn đó vẫn dùng nhà cung cấp, xác thực, và transport Ollama gốc
đã cấu hình của OpenClaw, nhưng không khởi động một lượt chat-agent hoặc tải ngữ cảnh MCP/công cụ. Nếu
thao tác này thành công trong khi phản hồi tác nhân bình thường thất bại, hãy tiếp tục khắc phục năng lực
prompt/công cụ tác nhân của mô hình.

Đối với kiểm tra smoke mô hình thị giác hẹp trên cùng đường dẫn gọn nhẹ đó, thêm một hoặc nhiều
tệp hình ảnh vào `infer model run`. Thao tác này gửi prompt và hình ảnh trực tiếp tới
mô hình thị giác Ollama đã chọn mà không tải công cụ chat, bộ nhớ, hoặc ngữ cảnh
phiên trước:

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
JPEG, và WebP phổ biến. Các tệp không phải hình ảnh bị từ chối trước khi gọi Ollama.
Đối với nhận dạng giọng nói, hãy dùng `openclaw infer audio transcribe` thay thế.

Khi bạn chuyển một cuộc trò chuyện bằng `/model ollama/<model>`, OpenClaw coi
đó là lựa chọn chính xác của người dùng. Nếu `baseUrl` Ollama đã cấu hình
không thể truy cập, phản hồi tiếp theo thất bại với lỗi nhà cung cấp thay vì âm thầm
trả lời từ một mô hình fallback đã cấu hình khác.

Các tác vụ cron cô lập thực hiện thêm một bước kiểm tra an toàn cục bộ trước khi bắt đầu lượt của agent. Nếu mô hình đã chọn được phân giải thành nhà cung cấp Ollama cục bộ, mạng riêng hoặc `.local` và không thể truy cập `/api/tags`, OpenClaw ghi nhận lần chạy cron đó là `skipped` với `ollama/<model>` đã chọn trong văn bản lỗi. Bước kiểm tra trước endpoint được lưu vào bộ nhớ đệm trong 5 phút, vì vậy nhiều tác vụ cron trỏ đến cùng một daemon Ollama đã dừng sẽ không cùng khởi chạy các yêu cầu mô hình thất bại.

Xác minh trực tiếp đường dẫn văn bản cục bộ, đường dẫn luồng gốc và embeddings với Ollama cục bộ bằng:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Để thêm một mô hình mới, chỉ cần kéo mô hình đó bằng Ollama:

```bash
ollama pull mistral
```

Mô hình mới sẽ được tự động phát hiện và có sẵn để sử dụng.

<Note>
Nếu bạn đặt `models.providers.ollama` một cách tường minh, hoặc cấu hình một nhà cung cấp từ xa tùy chỉnh như `models.providers.ollama-cloud` với `api: "ollama"`, tự động phát hiện sẽ bị bỏ qua và bạn phải định nghĩa mô hình thủ công. Các nhà cung cấp tùy chỉnh loopback như `http://127.0.0.2:11434` vẫn được xem là cục bộ. Xem phần cấu hình tường minh bên dưới.
</Note>

## Thị giác và mô tả hình ảnh

Plugin Ollama đi kèm đăng ký Ollama làm nhà cung cấp hiểu phương tiện có khả năng xử lý hình ảnh. Điều này cho phép OpenClaw định tuyến các yêu cầu mô tả hình ảnh tường minh và các mặc định mô hình hình ảnh đã cấu hình thông qua mô hình thị giác Ollama cục bộ hoặc được lưu trữ.

Đối với thị giác cục bộ, kéo một mô hình hỗ trợ hình ảnh:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Sau đó xác minh bằng CLI suy luận:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` phải là tham chiếu `<provider/model>` đầy đủ. Khi được đặt, `openclaw infer image describe` chạy trực tiếp mô hình đó thay vì bỏ qua mô tả vì mô hình hỗ trợ thị giác gốc.

Dùng `infer image describe` khi bạn muốn luồng nhà cung cấp hiểu hình ảnh của OpenClaw, `agents.defaults.imageModel` đã cấu hình, và dạng đầu ra mô tả hình ảnh. Dùng `infer model run --file` khi bạn muốn thăm dò mô hình đa phương thức thô với lời nhắc tùy chỉnh và một hoặc nhiều hình ảnh.

Để đặt Ollama làm mô hình hiểu hình ảnh mặc định cho phương tiện đến, cấu hình `agents.defaults.imageModel`:

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

Ưu tiên tham chiếu `ollama/<model>` đầy đủ. Nếu cùng mô hình được liệt kê trong `models.providers.ollama.models` với `input: ["text", "image"]` và không có nhà cung cấp hình ảnh nào khác đã cấu hình phơi bày ID mô hình trần đó, OpenClaw cũng chuẩn hóa một tham chiếu `imageModel` trần như `qwen2.5vl:7b` thành `ollama/qwen2.5vl:7b`. Nếu nhiều hơn một nhà cung cấp hình ảnh đã cấu hình có cùng ID trần, hãy dùng tiền tố nhà cung cấp một cách tường minh.

Các mô hình thị giác cục bộ chậm có thể cần thời gian chờ hiểu hình ảnh dài hơn so với mô hình đám mây. Chúng cũng có thể bị sập hoặc dừng khi Ollama cố cấp phát toàn bộ ngữ cảnh thị giác được quảng bá trên phần cứng hạn chế. Đặt thời gian chờ capability, và giới hạn `num_ctx` trên mục mô hình khi bạn chỉ cần một lượt mô tả hình ảnh bình thường:

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

Thời gian chờ này áp dụng cho hiểu hình ảnh đến và cho công cụ `image` tường minh mà agent có thể gọi trong một lượt. `models.providers.ollama.timeoutSeconds` ở cấp nhà cung cấp vẫn kiểm soát bộ bảo vệ yêu cầu HTTP Ollama bên dưới cho các lệnh gọi mô hình thông thường.

Xác minh trực tiếp công cụ hình ảnh tường minh với Ollama cục bộ bằng:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Nếu bạn định nghĩa `models.providers.ollama.models` thủ công, hãy đánh dấu các mô hình thị giác có hỗ trợ đầu vào hình ảnh:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw từ chối các yêu cầu mô tả hình ảnh cho những mô hình không được đánh dấu là có khả năng xử lý hình ảnh. Với phát hiện ngầm định, OpenClaw đọc thông tin này từ Ollama khi `/api/show` báo cáo một capability thị giác.

## Cấu hình

<Tabs>
  <Tab title="Cơ bản (phát hiện ngầm định)">
    Đường dẫn bật chỉ cục bộ đơn giản nhất là qua biến môi trường:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Nếu `OLLAMA_API_KEY` được đặt, bạn có thể bỏ qua `apiKey` trong mục nhà cung cấp và OpenClaw sẽ điền giá trị đó cho các kiểm tra tính khả dụng.
    </Tip>

  </Tab>

  <Tab title="Tường minh (mô hình thủ công)">
    Dùng cấu hình tường minh khi bạn muốn thiết lập đám mây được lưu trữ, Ollama chạy trên host/cổng khác, bạn muốn ép các cửa sổ ngữ cảnh hoặc danh sách mô hình cụ thể, hoặc bạn muốn định nghĩa mô hình hoàn toàn thủ công.

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

  <Tab title="URL cơ sở tùy chỉnh">
    Nếu Ollama đang chạy trên host hoặc cổng khác (cấu hình tường minh vô hiệu hóa tự động phát hiện, vì vậy hãy định nghĩa mô hình thủ công):

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
    Không thêm `/v1` vào URL. Đường dẫn `/v1` sử dụng chế độ tương thích OpenAI, trong đó việc gọi công cụ không đáng tin cậy. Dùng URL Ollama cơ sở không có hậu tố đường dẫn.
    </Warning>

  </Tab>
</Tabs>

## Công thức phổ biến

Dùng các mục này làm điểm bắt đầu và thay ID mô hình bằng tên chính xác từ `ollama list` hoặc `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Mô hình cục bộ với tự động phát hiện">
    Dùng mục này khi Ollama chạy trên cùng máy với Gateway và bạn muốn OpenClaw tự động phát hiện các mô hình đã cài đặt.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Đường dẫn này giữ cấu hình ở mức tối thiểu. Không thêm khối `models.providers.ollama` trừ khi bạn muốn định nghĩa mô hình thủ công.

  </Accordion>

  <Accordion title="Host Ollama LAN với mô hình thủ công">
    Dùng URL Ollama gốc cho các host LAN. Không thêm `/v1`.

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

    `contextWindow` là ngân sách ngữ cảnh phía OpenClaw. `params.num_ctx` được gửi đến Ollama cho yêu cầu. Giữ chúng đồng bộ khi phần cứng của bạn không thể chạy toàn bộ ngữ cảnh được mô hình quảng bá.

  </Accordion>

  <Accordion title="Chỉ Ollama Cloud">
    Dùng mục này khi bạn không chạy daemon cục bộ và muốn dùng trực tiếp các mô hình Ollama được lưu trữ.

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

  <Accordion title="Đám mây cộng cục bộ qua daemon đã đăng nhập">
    Dùng mục này khi một daemon Ollama cục bộ hoặc LAN đã đăng nhập bằng `ollama signin` và cần phục vụ cả mô hình cục bộ lẫn mô hình `:cloud`.

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

  <Accordion title="Nhiều host Ollama">
    Dùng ID nhà cung cấp tùy chỉnh khi bạn có nhiều hơn một máy chủ Ollama. Mỗi nhà cung cấp có host, mô hình, xác thực, thời gian chờ và tham chiếu mô hình riêng.

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

    Khi OpenClaw gửi yêu cầu, tiền tố nhà cung cấp đang hoạt động sẽ bị bỏ đi để `ollama-large/qwen3.5:27b` đến Ollama dưới dạng `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Hồ sơ mô hình cục bộ gọn nhẹ">
    Một số mô hình cục bộ có thể trả lời các lời nhắc đơn giản nhưng gặp khó khăn với toàn bộ bề mặt công cụ agent. Hãy bắt đầu bằng cách giới hạn công cụ và ngữ cảnh trước khi thay đổi thiết lập runtime toàn cục.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    Chỉ dùng `compat.supportsTools: false` khi mô hình hoặc máy chủ thường xuyên lỗi với schema công cụ. Thiết lập này đánh đổi năng lực của agent để lấy độ ổn định.
    `localModelLean` loại bỏ trình duyệt, Cron và công cụ nhắn tin khỏi bề mặt agent, nhưng không thay đổi ngữ cảnh runtime hoặc chế độ thinking của Ollama. Ghép nó với `params.num_ctx` rõ ràng và `params.thinking: false` cho các mô hình thinking nhỏ kiểu Qwen hay bị lặp hoặc tiêu tốn ngân sách phản hồi cho suy luận ẩn.

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

Các id provider Ollama tùy chỉnh cũng được hỗ trợ. Khi một tham chiếu mô hình dùng tiền tố
provider đang hoạt động, chẳng hạn `ollama-spark/qwen3:32b`, OpenClaw chỉ loại bỏ
tiền tố đó trước khi gọi Ollama để máy chủ nhận được `qwen3:32b`.

Với các mô hình cục bộ chậm, hãy ưu tiên tinh chỉnh yêu cầu theo phạm vi provider trước khi tăng
thời gian chờ runtime của toàn bộ agent:

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
header, truyền luồng body và toàn bộ lần hủy guarded-fetch. `params.keep_alive`
được chuyển tiếp đến Ollama dưới dạng `keep_alive` cấp cao nhất trên các yêu cầu `/api/chat` gốc;
đặt theo từng mô hình khi thời gian tải lượt đầu là điểm nghẽn.

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

Với máy chủ từ xa, thay `127.0.0.1` bằng host được dùng trong `baseUrl`. Nếu `curl` hoạt động nhưng OpenClaw thì không, hãy kiểm tra Gateway có đang chạy trên một máy, container hoặc tài khoản dịch vụ khác hay không.

## Tìm kiếm web Ollama

OpenClaw hỗ trợ **Tìm kiếm web Ollama** dưới dạng provider `web_search` đi kèm.

| Thuộc tính  | Chi tiết                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Dùng host Ollama đã cấu hình của bạn (`models.providers.ollama.baseUrl` khi được đặt, nếu không là `http://127.0.0.1:11434`); `https://ollama.com` dùng trực tiếp API được lưu trữ |
| Xác thực    | Không cần khóa với host Ollama cục bộ đã đăng nhập; `OLLAMA_API_KEY` hoặc xác thực provider đã cấu hình cho tìm kiếm trực tiếp qua `https://ollama.com` hoặc host được bảo vệ bằng xác thực |
| Yêu cầu     | Host cục bộ/tự lưu trữ phải đang chạy và đã đăng nhập bằng `ollama signin`; tìm kiếm trực tiếp được lưu trữ yêu cầu `baseUrl: "https://ollama.com"` cùng khóa API Ollama thật |

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

Cho tìm kiếm trực tiếp được lưu trữ qua Ollama Cloud:

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
Để xem toàn bộ chi tiết thiết lập và hành vi, hãy xem [Tìm kiếm web Ollama](/vi/tools/ollama-search).
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

    Chế độ này có thể không hỗ trợ đồng thời streaming và gọi công cụ. Bạn có thể cần tắt streaming bằng `params: { streaming: false }` trong cấu hình mô hình.

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
    Với các mô hình tự động phát hiện, OpenClaw dùng cửa sổ ngữ cảnh do Ollama báo cáo khi có, bao gồm các giá trị `PARAMETER num_ctx` lớn hơn từ Modelfile tùy chỉnh. Nếu không, nó quay về cửa sổ ngữ cảnh Ollama mặc định được OpenClaw dùng.

    Bạn có thể đặt mặc định `contextWindow`, `contextTokens` và `maxTokens` cấp provider cho mọi mô hình dưới provider Ollama đó, rồi ghi đè theo từng mô hình khi cần. `contextWindow` là ngân sách prompt và Compaction của OpenClaw. Các yêu cầu Ollama gốc để `options.num_ctx` không đặt trừ khi bạn cấu hình rõ `params.num_ctx`, để Ollama có thể áp dụng mặc định riêng theo mô hình, `OLLAMA_CONTEXT_LENGTH` hoặc VRAM. Để giới hạn hoặc ép buộc ngữ cảnh runtime theo từng yêu cầu của Ollama mà không cần dựng lại Modelfile, hãy đặt `params.num_ctx`; các giá trị không hợp lệ, bằng 0, âm và không hữu hạn sẽ bị bỏ qua. Adapter Ollama tương thích OpenAI vẫn mặc định chèn `options.num_ctx` từ `params.num_ctx` hoặc `contextWindow` đã cấu hình; tắt bằng `injectNumCtxForOpenAICompat: false` nếu upstream của bạn từ chối `options`.

    Các mục mô hình Ollama gốc cũng chấp nhận các tùy chọn runtime Ollama phổ biến trong `params`, bao gồm `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` và `use_mmap`. OpenClaw chỉ chuyển tiếp các khóa yêu cầu Ollama, vì vậy các tham số runtime OpenClaw như `streaming` không bị rò rỉ sang Ollama. Dùng `params.think` hoặc `params.thinking` để gửi `think` Ollama cấp cao nhất; `false` tắt thinking cấp API cho các mô hình thinking kiểu Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` theo từng mô hình cũng hoạt động. Nếu cả hai đều được cấu hình, mục mô hình provider rõ ràng sẽ thắng mặc định agent.

  </Accordion>

  <Accordion title="Điều khiển thinking">
    Với các mô hình Ollama gốc, OpenClaw chuyển tiếp điều khiển thinking đúng như Ollama kỳ vọng: `think` cấp cao nhất, không phải `options.think`. Các mô hình tự động phát hiện có phản hồi `/api/show` bao gồm năng lực `thinking` sẽ hiển thị `/think low`, `/think medium`, `/think high` và `/think max`; các mô hình không thinking chỉ hiển thị `/think off`.

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

    `params.think` hoặc `params.thinking` theo từng mô hình có thể tắt hoặc ép buộc thinking API Ollama cho một mô hình đã cấu hình cụ thể. OpenClaw giữ nguyên các tham số mô hình rõ ràng đó khi lượt chạy hiện tại chỉ có mặc định ngầm định `off`; các lệnh runtime khác `off` như `/think medium` vẫn ghi đè lượt chạy hiện tại.

  </Accordion>

  <Accordion title="Mô hình reasoning">
    OpenClaw mặc định xem các mô hình có tên như `deepseek-r1`, `reasoning` hoặc `think` là có khả năng reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Không cần cấu hình bổ sung. OpenClaw tự động đánh dấu chúng.

  </Accordion>

  <Accordion title="Chi phí mô hình">
    Ollama miễn phí và chạy cục bộ, nên mọi chi phí mô hình đều được đặt thành $0. Điều này áp dụng cho cả mô hình tự động phát hiện và mô hình được định nghĩa thủ công.
  </Accordion>

  <Accordion title="Memory embeddings">
    Plugin Ollama đi kèm đăng ký một provider memory embedding cho
    [tìm kiếm memory](/vi/concepts/memory). Nó dùng URL cơ sở Ollama
    và khóa API đã cấu hình, gọi endpoint `/api/embed` hiện tại của Ollama và gom
    nhiều đoạn memory vào một yêu cầu `input` khi có thể.

    | Thuộc tính       | Giá trị             |
    | ---------------- | ------------------- |
    | Mô hình mặc định | `nomic-embed-text`  |
    | Tự động pull     | Có — mô hình embedding được tự động pull nếu chưa có cục bộ |

    Embedding lúc truy vấn dùng tiền tố truy xuất cho các mô hình yêu cầu hoặc khuyến nghị chúng, bao gồm `nomic-embed-text`, `qwen3-embedding` và `mxbai-embed-large`. Các lô tài liệu memory giữ nguyên thô để các chỉ mục hiện có không cần di chuyển định dạng.

    Để chọn Ollama làm provider embedding cho tìm kiếm memory:

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

    Với host embedding từ xa, giữ xác thực trong phạm vi host đó:

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

  <Accordion title="Cấu hình phát trực tuyến">
    Tích hợp Ollama của OpenClaw mặc định sử dụng **API Ollama gốc** (`/api/chat`), hỗ trợ đầy đủ phát trực tuyến và gọi công cụ đồng thời. Không cần cấu hình đặc biệt.

    Với các yêu cầu `/api/chat` gốc, OpenClaw cũng chuyển tiếp điều khiển suy nghĩ trực tiếp đến Ollama: `/think off` và `openclaw agent --thinking off` gửi `think: false` ở cấp cao nhất, trừ khi đã cấu hình rõ giá trị `params.think`/`params.thinking` của mô hình, còn `/think low|medium|high` gửi chuỗi mức nỗ lực `think` cấp cao nhất tương ứng. `/think max` ánh xạ tới mức nỗ lực gốc cao nhất của Ollama, `think: "high"`.

    <Tip>
    Nếu bạn cần dùng điểm cuối tương thích OpenAI, hãy xem phần "Chế độ tương thích OpenAI cũ" ở trên. Phát trực tuyến và gọi công cụ có thể không hoạt động đồng thời trong chế độ đó.
    </Tip>

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Vòng lặp sập WSL2 (khởi động lại lặp lại)">
    Trên WSL2 với NVIDIA/CUDA, trình cài đặt Ollama Linux chính thức tạo một đơn vị systemd `ollama.service` với `Restart=always`. Nếu dịch vụ đó tự động khởi động và tải mô hình dùng GPU trong lúc WSL2 khởi động, Ollama có thể ghim bộ nhớ máy chủ trong khi mô hình tải. Thu hồi bộ nhớ Hyper-V không phải lúc nào cũng có thể thu hồi các trang đã ghim đó, nên Windows có thể chấm dứt VM WSL2, systemd khởi động lại Ollama, và vòng lặp tiếp diễn.

    Dấu hiệu thường gặp:

    - WSL2 khởi động lại hoặc bị chấm dứt lặp lại từ phía Windows
    - CPU cao trong `app.slice` hoặc `ollama.service` ngay sau khi WSL2 khởi động
    - SIGTERM từ systemd thay vì một sự kiện OOM-killer của Linux

    OpenClaw ghi cảnh báo khởi động khi phát hiện WSL2, `ollama.service` được bật với `Restart=always`, và có các dấu hiệu CUDA hiển thị.

    Cách giảm thiểu:

    ```bash
    sudo systemctl disable ollama
    ```

    Thêm phần này vào `%USERPROFILE%\.wslconfig` ở phía Windows, rồi chạy `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Đặt keep-alive ngắn hơn trong môi trường dịch vụ Ollama, hoặc chỉ khởi động Ollama thủ công khi bạn cần:

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
    Nếu mô hình của bạn không được liệt kê, hãy kéo mô hình về máy cục bộ hoặc định nghĩa rõ nó trong `models.providers.ollama`.

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

    - `baseUrl` trỏ tới `localhost`, nhưng Gateway chạy trong Docker hoặc trên một máy chủ khác.
    - URL dùng `/v1`, chọn hành vi tương thích OpenAI thay vì Ollama gốc.
    - Máy chủ từ xa cần thay đổi tường lửa hoặc binding LAN ở phía Ollama.
    - Mô hình có trên daemon của máy tính xách tay của bạn nhưng không có trên daemon từ xa.

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

    Nếu một mô hình cục bộ nhỏ vẫn lỗi với schema công cụ, hãy đặt `compat.supportsTools: false` trên mục mô hình đó và kiểm thử lại.

  </Accordion>

  <Accordion title="Kimi hoặc GLM trả về ký hiệu lộn xộn">
    Phản hồi Kimi/GLM được lưu trữ mà dài và gồm các chuỗi ký hiệu phi ngôn ngữ được xem là đầu ra nhà cung cấp thất bại thay vì câu trả lời trợ lý thành công. Điều đó cho phép cơ chế thử lại, dự phòng hoặc xử lý lỗi bình thường tiếp quản mà không lưu văn bản hỏng vào phiên.

    Nếu việc này xảy ra lặp lại, hãy ghi lại tên mô hình thô, tệp phiên hiện tại, và lượt chạy đã dùng `Cloud + Local` hay `Cloud only`, rồi thử một phiên mới và một mô hình dự phòng:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Mô hình cục bộ nguội bị hết thời gian chờ">
    Các mô hình cục bộ lớn có thể cần lần tải đầu tiên lâu trước khi phát trực tuyến bắt đầu. Giữ thời gian chờ trong phạm vi nhà cung cấp Ollama, và tùy chọn yêu cầu Ollama giữ mô hình đã tải giữa các lượt:

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
    Nhiều mô hình Ollama quảng bá ngữ cảnh lớn hơn mức phần cứng của bạn có thể chạy thoải mái. Ollama gốc dùng mặc định ngữ cảnh runtime riêng của Ollama trừ khi bạn đặt `params.num_ctx`. Giới hạn cả ngân sách của OpenClaw và ngữ cảnh yêu cầu của Ollama khi bạn muốn độ trễ token đầu tiên có thể dự đoán:

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

    Trước tiên hãy giảm `contextWindow` nếu OpenClaw đang gửi quá nhiều prompt. Giảm `params.num_ctx` nếu Ollama đang tải một ngữ cảnh runtime quá lớn cho máy. Giảm `maxTokens` nếu quá trình sinh chạy quá lâu.

  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [FAQ](/vi/help/faq).
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
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
