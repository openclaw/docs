---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình đám mây hoặc cục bộ thông qua Ollama
    - Bạn cần hướng dẫn thiết lập và cấu hình Ollama
    - Bạn muốn sử dụng các mô hình thị giác Ollama để hiểu hình ảnh
summary: Chạy OpenClaw với Ollama (mô hình đám mây và mô hình cục bộ)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T08:18:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw giao tiếp với API gốc của Ollama (`/api/chat`), không phải điểm cuối
`/v1` tương thích với OpenAI. Ba chế độ được hỗ trợ:

| Chế độ          | Thành phần sử dụng                                                                     |
| --------------- | -------------------------------------------------------------------------------------- |
| Đám mây + Cục bộ | Một máy chủ Ollama có thể truy cập, phục vụ các mô hình cục bộ và (nếu đã đăng nhập) các mô hình `:cloud` |
| Chỉ đám mây     | Trực tiếp `https://ollama.com`, không có tiến trình nền cục bộ                          |
| Chỉ cục bộ      | Một máy chủ Ollama có thể truy cập, chỉ dùng các mô hình cục bộ                         |

Để thiết lập chỉ dùng đám mây với mã nhà cung cấp chuyên biệt `ollama-cloud`, hãy xem
[Ollama Cloud](/vi/providers/ollama-cloud). Sử dụng tham chiếu `ollama-cloud/<model>` khi
bạn muốn định tuyến đám mây tách biệt với nhà cung cấp `ollama` cục bộ.

<Warning>
Không sử dụng URL `/v1` tương thích với OpenAI (`http://host:11434/v1`). URL này làm hỏng việc gọi công cụ và mô hình có thể xuất JSON lời gọi công cụ thô dưới dạng văn bản thuần túy. Hãy sử dụng URL gốc: `baseUrl: "http://host:11434"` (không có `/v1`).
</Warning>

Khóa cấu hình chuẩn là `baseUrl`. `baseURL` cũng được chấp nhận cho
các ví dụ theo kiểu OpenAI SDK, nhưng cấu hình mới nên sử dụng `baseUrl`.

## Quy tắc xác thực

<AccordionGroup>
  <Accordion title="Máy chủ cục bộ và LAN">
    Các URL Ollama dùng local loopback, mạng riêng, `.local` và tên máy chủ thuần túy không cần mã thông báo bearer thực. OpenClaw sử dụng dấu hiệu `ollama-local` cho các URL này.
  </Accordion>
  <Accordion title="Máy chủ từ xa và Ollama Cloud">
    Các máy chủ từ xa công khai và `https://ollama.com` yêu cầu thông tin xác thực thực: `OLLAMA_API_KEY`, hồ sơ xác thực hoặc `apiKey` của nhà cung cấp. Để sử dụng trực tiếp dịch vụ lưu trữ, nên dùng nhà cung cấp `ollama-cloud`.
  </Accordion>
  <Accordion title="Mã nhà cung cấp tùy chỉnh">
    Nhà cung cấp tùy chỉnh có `api: "ollama"` tuân theo cùng các quy tắc. Ví dụ: nhà cung cấp `ollama-remote` trỏ đến máy chủ LAN riêng có thể sử dụng `apiKey: "ollama-local"`; các tác nhân phụ phân giải dấu hiệu đó thông qua hook của nhà cung cấp Ollama thay vì coi đó là thông tin xác thực bị thiếu. `agents.defaults.memorySearch.provider` cũng có thể trỏ đến mã nhà cung cấp tùy chỉnh để các embedding sử dụng điểm cuối Ollama đó.
  </Accordion>
  <Accordion title="Hồ sơ xác thực">
    `auth-profiles.json` lưu trữ thông tin xác thực cho một mã nhà cung cấp; hãy đặt các thiết lập điểm cuối (`baseUrl`, `api`, mô hình, tiêu đề, thời gian chờ) trong `models.providers.<id>`. Các tệp phẳng cũ như `{ "ollama-windows": { "apiKey": "ollama-local" } }` không phải là định dạng thời gian chạy; `openclaw doctor --fix` ghi lại chúng thành hồ sơ khóa API chuẩn `ollama-windows:default` kèm bản sao lưu. Giá trị `baseUrl` trong tệp cũ đó là dữ liệu thừa và nên được chuyển sang cấu hình nhà cung cấp.
  </Accordion>
  <Accordion title="Phạm vi embedding bộ nhớ">
    Xác thực bearer cho embedding bộ nhớ Ollama được giới hạn trong máy chủ mà xác thực đó được khai báo:

    - Khóa cấp nhà cung cấp chỉ được gửi đến máy chủ của nhà cung cấp đó.
    - `agents.*.memorySearch.remote.apiKey` chỉ được gửi đến máy chủ embedding từ xa tương ứng.
    - Giá trị biến môi trường `OLLAMA_API_KEY` độc lập được coi là quy ước của Ollama Cloud và theo mặc định không được gửi đến các máy chủ cục bộ/tự lưu trữ.

  </Accordion>
</AccordionGroup>

## Bắt đầu

<Tabs>
  <Tab title="Thiết lập ban đầu (khuyên dùng)">
    <Steps>
      <Step title="Chạy thiết lập ban đầu">
        ```bash
        openclaw onboard
        ```

        Chọn **Ollama**, sau đó chọn một chế độ: **Đám mây + Cục bộ**, **Chỉ đám mây** hoặc **Chỉ cục bộ**.
      </Step>
      <Step title="Chọn mô hình">
        `Cloud only` yêu cầu `OLLAMA_API_KEY` và đề xuất các giá trị mặc định của dịch vụ đám mây được lưu trữ. `Cloud + Local` và `Local only` yêu cầu URL cơ sở của Ollama, khám phá các mô hình hiện có và tự động kéo mô hình cục bộ đã chọn nếu còn thiếu. Thẻ `:latest` đã cài đặt, chẳng hạn như `gemma4:latest`, chỉ được hiển thị một lần thay vì lặp lại `gemma4`. `Cloud + Local` cũng kiểm tra xem máy chủ đã đăng nhập để truy cập đám mây hay chưa.
      </Step>
      <Step title="Xác minh">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Không tương tác:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` và `--custom-model-id` là tùy chọn; nếu bỏ qua, hệ thống sử dụng máy chủ cục bộ mặc định và mô hình được đề xuất `gemma4`.

  </Tab>

  <Tab title="Thiết lập thủ công">
    <Steps>
      <Step title="Cài đặt và khởi động Ollama">
        Tải từ [ollama.com/download](https://ollama.com/download), sau đó kéo một mô hình:

        ```bash
        ollama pull gemma4
        ```

        Để truy cập đám mây kết hợp, hãy chạy `ollama signin` trên cùng máy chủ.
      </Step>
      <Step title="Đặt thông tin xác thực">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # máy chủ cục bộ/LAN, giá trị bất kỳ đều dùng được
        export OLLAMA_API_KEY="your-real-key"   # chỉ dành cho https://ollama.com
        ```

        Hoặc trong cấu hình: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Chọn mô hình">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Hoặc trong cấu hình:

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

## Mô hình đám mây thông qua máy chủ cục bộ

`Cloud + Local` định tuyến cả mô hình cục bộ và mô hình `:cloud` thông qua một
máy chủ Ollama có thể truy cập — đây là luồng kết hợp của Ollama và là chế độ nên chọn trong quá trình thiết lập
khi bạn muốn sử dụng cả hai.

OpenClaw yêu cầu URL cơ sở, khám phá các mô hình cục bộ và kiểm tra
trạng thái `ollama signin`. Khi đã đăng nhập, hệ thống đề xuất các giá trị mặc định được lưu trữ
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Nếu
chưa đăng nhập, quá trình thiết lập chỉ dùng cục bộ cho đến khi bạn chạy `ollama signin`.

Để chỉ truy cập đám mây mà không có tiến trình nền cục bộ, hãy dùng `openclaw onboard --auth-choice ollama-cloud` và xem [Ollama Cloud](/vi/providers/ollama-cloud) — đường dẫn đó không cần `ollama signin` hoặc máy chủ đang chạy:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Danh sách mô hình đám mây hiển thị trong `openclaw onboard` được lấy trực tiếp từ
`https://ollama.com/api/tags`, giới hạn ở 500 mục, vì vậy bộ chọn phản ánh
danh mục lưu trữ hiện tại. Nếu không thể truy cập `ollama.com` hoặc dịch vụ không trả về
mô hình nào tại thời điểm thiết lập, OpenClaw sẽ dùng danh sách đề xuất được mã hóa sẵn để
quá trình thiết lập ban đầu vẫn hoàn tất.

## Khám phá mô hình (nhà cung cấp ngầm định)

Khi `OLLAMA_API_KEY` (hoặc hồ sơ xác thực) được thiết lập và cả
`models.providers.ollama` lẫn nhà cung cấp tùy chỉnh khác có `api: "ollama"` đều chưa được
định nghĩa, OpenClaw khám phá mô hình từ `http://127.0.0.1:11434`:

| Hành vi                | Chi tiết                                                                                                                                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truy vấn danh mục      | `/api/tags`                                                                                                                                                                                                                                                                                     |
| Phát hiện khả năng     | Lệnh đọc `/api/show` theo nguyên tắc nỗ lực tối đa lấy `contextWindow`, tham số Modelfile `num_ctx` và các khả năng (thị giác/công cụ/suy luận)                                                                                                                                                  |
| Mô hình thị giác       | Khả năng `vision` từ `/api/show` đánh dấu mô hình có thể xử lý hình ảnh (`input: ["text", "image"]`)                                                                                                                                                                                            |
| Phát hiện suy luận     | Sử dụng khả năng `thinking` từ `/api/show` khi có; nếu Ollama bỏ qua các khả năng, hệ thống dùng phương pháp suy đoán theo tên (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` và `deepseek-v4-flash\|pro:cloud` luôn được coi là mô hình suy luận bất kể khả năng được báo cáo. |
| Giới hạn mã thông báo  | `maxTokens` mặc định là mức trần mã thông báo tối đa của Ollama trong OpenClaw                                                                                                                                                                                                                  |
| Chi phí                | Tất cả chi phí đều là `0`                                                                                                                                                                                                                                                                       |

```bash
ollama list
openclaw models list
```

Việc đặt `models.providers.ollama` với mảng `models` rõ ràng hoặc một
nhà cung cấp tùy chỉnh có `api: "ollama"` và `baseUrl` không phải local loopback sẽ tắt
tính năng tự động khám phá; khi đó, các mô hình phải được định nghĩa thủ công (xem
[Cấu hình](#configuration)). Mục `models.providers.ollama` trỏ đến
`https://ollama.com` được lưu trữ cũng bỏ qua việc khám phá vì các mô hình Ollama Cloud
do nhà cung cấp quản lý. Các nhà cung cấp tùy chỉnh dùng local loopback như
`http://127.0.0.2:11434` vẫn được coi là cục bộ và tiếp tục tự động khám phá.

Bạn có thể sử dụng tham chiếu đầy đủ như `ollama/<pulled-model>:latest` mà không cần
mục `models.json` viết thủ công; OpenClaw phân giải trực tiếp. Đối với các máy chủ đã đăng nhập,
việc chọn tham chiếu `ollama/<model>:cloud` không có trong danh sách sẽ xác thực chính xác
mô hình đó bằng `/api/show` và chỉ thêm mô hình vào danh mục thời gian chạy nếu Ollama
xác nhận siêu dữ liệu — lỗi chính tả vẫn khiến mô hình bị báo là không xác định.

### Kiểm thử nhanh

Để thăm dò văn bản trong phạm vi hẹp mà bỏ qua toàn bộ bề mặt công cụ của tác nhân:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Thêm `--file` với một hình ảnh để thăm dò gọn nhẹ mô hình thị giác (chấp nhận PNG/JPEG/WebP;
các tệp không phải hình ảnh bị từ chối trước khi gọi Ollama — hãy dùng
`openclaw infer audio transcribe` cho âm thanh):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Cả hai đường dẫn đều không tải công cụ trò chuyện, bộ nhớ hoặc ngữ cảnh phiên. Nếu chúng thành công
trong khi phản hồi thông thường của tác nhân thất bại, vấn đề có thể nằm ở khả năng xử lý công cụ/tác nhân
của mô hình chứ không phải điểm cuối.

Việc chọn mô hình bằng `/model ollama/<model>` là lựa chọn chính xác của người dùng: nếu
`baseUrl` đã cấu hình không thể truy cập, phản hồi tiếp theo sẽ thất bại với lỗi của nhà cung cấp
thay vì âm thầm chuyển sang mô hình đã cấu hình khác.

Các tác vụ Cron biệt lập bổ sung một bước kiểm tra an toàn cục bộ trước khi bắt đầu lượt của tác nhân:
nếu mô hình được chọn phân giải thành nhà cung cấp Ollama cục bộ/mạng riêng/`.local`
và không thể truy cập `/api/tags`, OpenClaw ghi nhận lần chạy đó là
`skipped`, với mô hình trong nội dung lỗi. Bước kiểm tra điểm cuối này được lưu vào bộ nhớ đệm trong
5 phút cho mỗi máy chủ, vì vậy các tác vụ Cron lặp lại nhắm đến một tiến trình nền đã dừng sẽ không đồng loạt
khởi chạy các yêu cầu thất bại.

Xác minh trực tiếp:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Đối với Ollama Cloud, hãy trỏ cùng phép kiểm thử trực tiếp đó đến điểm cuối được lưu trữ (mặc định bỏ qua embedding; buộc bật bằng `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` vì khóa đám mây có thể không được cấp quyền truy cập `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Để thêm một mô hình, hãy kéo mô hình đó về và hệ thống sẽ tự động phát hiện:

```bash
ollama pull mistral
```

## Suy luận cục bộ trên Node

Các tác nhân có thể giao một tác vụ ngắn cho mô hình Ollama trên máy tính để bàn hoặc Node máy chủ đã ghép nối. Lời nhắc và phản hồi đi qua kết nối Gateway/Node đã xác thực hiện có; yêu cầu chạy trên điểm cuối Ollama local loopback của chính Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Khởi động Ollama trên Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Kết nối máy chủ Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Phê duyệt thiết bị và các lệnh Node của thiết bị đó trên máy chủ Gateway, sau đó xác minh:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Lần kết nối đầu tiên hoặc một bản nâng cấp bổ sung các lệnh Ollama có thể kích hoạt yêu cầu phê duyệt lệnh Node. Nếu Node kết nối nhưng không công bố `ollama.models` và `ollama.chat`, hãy kiểm tra lại `openclaw nodes pending`.

  </Step>
  <Step title="Sử dụng từ một tác nhân">
    Plugin Ollama đi kèm cung cấp công cụ `node_inference`. Trước tiên, tác nhân gọi `action: "discover"`, sau đó gọi `action: "run"` với một Node và mô hình từ kết quả đó (`run` có thể bỏ qua Node khi chỉ có đúng một Node đủ khả năng đang kết nối). Ví dụ: "Hãy khám phá các mô hình Ollama trên các Node của tôi, sau đó dùng mô hình nhanh nhất đang được tải để tóm tắt văn bản này."
  </Step>
</Steps>

Quá trình khám phá đọc `/api/tags`, kiểm tra các khả năng qua `/api/show` và dùng `/api/ps` khi có thể để ưu tiên xếp hạng các mô hình đã được tải. Quá trình này chỉ trả về các mô hình cục bộ mà Ollama báo cáo là có khả năng trò chuyện (khả năng `completion`) — các mục Ollama Cloud và mô hình chỉ hỗ trợ embedding đều bị loại trừ. Mỗi lần chạy đều tắt chế độ suy nghĩ của mô hình và mặc định giới hạn đầu ra ở 512 token (giới hạn cứng là 8192), trừ khi lệnh gọi công cụ yêu cầu `maxTokens` khác; một số mô hình (ví dụ GPT-OSS) không hỗ trợ tắt chế độ suy nghĩ và vẫn có thể tạo token lập luận.

Để giữ Ollama chạy trên một Node mà không cung cấp nó cho các tác nhân:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Khởi động lại Node (`openclaw node restart`, hoặc dừng rồi chạy lại `openclaw node run` đối với phiên chạy ở tiền cảnh). Node sẽ ngừng công bố `ollama.models` và `ollama.chat`; bản thân Ollama và nhà cung cấp Ollama của Gateway không bị ảnh hưởng. Đặt lại giá trị thành `true` rồi khởi động lại để bật lại; bề mặt lệnh đã thay đổi có thể cần được phê duyệt lại bằng `openclaw nodes pending` sau khi kết nối lại.

Xác minh trực tiếp các lệnh Node mà không cần lượt chạy của tác nhân:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` giới hạn thời gian Node được phép chạy lệnh; `--timeout` giới hạn toàn bộ lệnh gọi Gateway và nên có giá trị lớn hơn.

Suy luận cục bộ trên Node luôn dùng điểm cuối local loopback của chính Node — không tái sử dụng `models.providers.ollama.baseUrl` từ xa/đám mây đã cấu hình. Theo mặc định, các lệnh Node có sẵn trên máy chủ Node macOS, Linux và Windows, đồng thời vẫn tuân theo chính sách ghép nối/lệnh Node thông thường.

## Thị giác và mô tả hình ảnh

Plugin Ollama đi kèm đăng ký Ollama làm nhà cung cấp hiểu nội dung đa phương tiện có khả năng xử lý hình ảnh, vì vậy OpenClaw có thể định tuyến các yêu cầu mô tả hình ảnh rõ ràng và các mô hình hình ảnh mặc định đã cấu hình qua mô hình thị giác Ollama cục bộ hoặc được lưu trữ.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` phải là tham chiếu `<provider/model>` đầy đủ; khi được đặt, `infer image describe` sẽ thử mô hình đó trước thay vì bỏ qua việc mô tả đối với các mô hình vốn đã hỗ trợ thị giác gốc. Nếu lệnh gọi thất bại, OpenClaw có thể tiếp tục qua `agents.defaults.imageModel.fallbacks`; lỗi chuẩn bị tệp/URL sẽ khiến quá trình thất bại trước khi thử phương án dự phòng. Hãy dùng `infer image describe` cho luồng hiểu hình ảnh và `imageModel` đã cấu hình của OpenClaw; dùng `infer model run --file` cho một phép thăm dò đa phương thức thô với lời nhắc tùy chỉnh.

Để đặt Ollama làm nhà cung cấp hiểu hình ảnh mặc định cho nội dung đa phương tiện đến:

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

Nên dùng tham chiếu `ollama/<model>` đầy đủ. Một tham chiếu `imageModel` trần như `qwen2.5vl:7b` chỉ được chuẩn hóa thành `ollama/qwen2.5vl:7b` khi chính xác mô hình đó được liệt kê trong `models.providers.ollama.models` với `input: ["text", "image"]` và không có nhà cung cấp hình ảnh nào khác đã cấu hình cung cấp cùng mã định danh trần; nếu không, hãy chỉ định rõ tiền tố nhà cung cấp.

Các mô hình thị giác cục bộ chậm có thể cần thời gian chờ hiểu hình ảnh dài hơn mô hình đám mây và có thể gặp sự cố trên phần cứng hạn chế nếu Ollama cố gắng cấp phát toàn bộ ngữ cảnh thị giác mà mô hình công bố. Hãy đặt thời gian chờ cho khả năng và giới hạn `num_ctx`:

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

Thời gian chờ này áp dụng cho việc hiểu hình ảnh đến và công cụ `image` rõ ràng. `models.providers.ollama.timeoutSeconds` vẫn kiểm soát giới hạn bảo vệ yêu cầu HTTP Ollama bên dưới cho các lệnh gọi mô hình thông thường.

Xác minh trực tiếp:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Nếu bạn tự xác định `models.providers.ollama.models`, hãy đánh dấu rõ các mô hình thị giác:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw từ chối các yêu cầu mô tả hình ảnh đối với mô hình không được đánh dấu là có khả năng xử lý hình ảnh. Với khám phá ngầm định, thông tin này đến từ khả năng thị giác của `/api/show`.

## Cấu hình

<Tabs>
  <Tab title="Cơ bản (khám phá ngầm định)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Nếu `OLLAMA_API_KEY` được đặt, bạn có thể bỏ qua `apiKey` trong mục nhà cung cấp; OpenClaw sẽ điền giá trị đó khi kiểm tra tính khả dụng.
    </Tip>

  </Tab>

  <Tab title="Tường minh (mô hình thủ công)">
    Hãy dùng cấu hình tường minh cho thiết lập đám mây được lưu trữ, máy chủ/cổng không mặc định, cửa sổ ngữ cảnh bắt buộc hoặc danh sách mô hình hoàn toàn thủ công:

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
    Cấu hình tường minh sẽ tắt tính năng tự động khám phá, vì vậy phải liệt kê các mô hình:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
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
    Không thêm `/v1`. Đường dẫn đó chọn chế độ tương thích với OpenAI, trong đó việc gọi công cụ không đáng tin cậy.
    </Warning>

  </Tab>
</Tabs>

## Công thức phổ biến

Thay các mã định danh mô hình bằng tên chính xác từ `ollama list` hoặc `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Mô hình cục bộ với tính năng tự động khám phá">
    Ollama trên cùng máy với Gateway, được tự động phát hiện:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Không thêm khối `models.providers.ollama` trừ khi bạn cần các mô hình thủ công.

  </Accordion>

  <Accordion title="Máy chủ Ollama trong mạng LAN với mô hình thủ công">
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

    `contextWindow` là ngân sách ngữ cảnh của OpenClaw; `params.num_ctx` được gửi đến Ollama. Hãy giữ chúng đồng bộ khi phần cứng không thể chạy toàn bộ ngữ cảnh mà mô hình công bố.

  </Accordion>

  <Accordion title="Chỉ Ollama Cloud">
    Không có trình nền cục bộ, dùng trực tiếp các mô hình được lưu trữ:

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

    Để dùng mã định danh nhà cung cấp chuyên biệt `ollama-cloud` thay cho cấu trúc này, hãy xem [Ollama Cloud](/vi/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Đám mây kết hợp cục bộ qua trình nền đã đăng nhập">
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

  <Accordion title="Multiple Ollama hosts">
    Dùng ID nhà cung cấp tùy chỉnh khi chạy nhiều máy chủ Ollama; mỗi máy chủ có
    máy chủ lưu trữ, mô hình, thông tin xác thực và thời gian chờ riêng.

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

    OpenClaw loại bỏ tiền tố nhà cung cấp đang hoạt động (nếu không có thì dùng
    tiền tố thuần `ollama/`) trước khi gọi Ollama, vì vậy
    `ollama-large/qwen3.5:27b` được gửi đến Ollama dưới dạng `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Một số mô hình cục bộ xử lý tốt các lời nhắc đơn giản nhưng gặp khó khăn với
    toàn bộ bề mặt công cụ của tác tử. Hãy giới hạn công cụ và ngữ cảnh trước khi
    thay đổi các thiết lập thời gian chạy toàn cục:

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

    Chỉ dùng `compat.supportsTools: false` khi mô hình hoặc máy chủ thường xuyên
    gặp lỗi với lược đồ công cụ — tùy chọn này đánh đổi khả năng của tác tử để
    lấy tính ổn định. `localModelLean` loại bỏ các công cụ nặng về trình duyệt,
    cron, tin nhắn, tạo phương tiện, giọng nói và PDF khỏi bề mặt trực tiếp của
    tác tử trừ khi được yêu cầu rõ ràng, đồng thời đặt các danh mục lớn hơn phía
    sau Tìm kiếm công cụ. Tùy chọn này không thay đổi ngữ cảnh thời gian chạy
    hoặc chế độ suy nghĩ của Ollama. Hãy kết hợp với `params.num_ctx` và
    `params.thinking: false` cho các mô hình suy nghĩ nhỏ kiểu Qwen thường lặp
    vòng hoặc tiêu tốn ngân sách vào suy luận ẩn.

  </Accordion>
</AccordionGroup>

### Chọn mô hình

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

ID nhà cung cấp tùy chỉnh hoạt động theo cách tương tự: đối với một tham chiếu
sử dụng tiền tố nhà cung cấp đang hoạt động, chẳng hạn
`ollama-spark/qwen3:32b`, OpenClaw loại bỏ tiền tố đó trước khi gọi Ollama và
gửi `qwen3:32b`.

Đối với các mô hình cục bộ chậm, hãy ưu tiên tinh chỉnh theo phạm vi nhà cung
cấp trước khi tăng thời gian chờ của toàn bộ thời gian chạy tác tử:

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

`timeoutSeconds` bao quát yêu cầu HTTP của mô hình: thiết lập kết nối, tiêu đề,
truyền trực tuyến nội dung và thao tác hủy tổng thể của lệnh tìm nạp có bảo vệ.
`params.keep_alive` được chuyển tiếp dưới dạng `keep_alive` cấp cao nhất trong
các yêu cầu `/api/chat` gốc; hãy đặt riêng cho từng mô hình khi thời gian tải ở
lượt đầu tiên là nút thắt cổ chai.

### Xác minh nhanh

```bash
# Tiến trình nền Ollama hiển thị với máy này
curl http://127.0.0.1:11434/api/tags

# Danh mục OpenClaw và mô hình đã chọn
openclaw models list --provider ollama
openclaw models status

# Kiểm tra nhanh trực tiếp mô hình
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Đối với máy chủ từ xa, hãy thay `127.0.0.1` bằng máy chủ lưu trữ trong
`baseUrl`. Nếu `curl` hoạt động nhưng OpenClaw không hoạt động, hãy kiểm tra xem
Gateway có đang chạy trên một máy, vùng chứa hoặc tài khoản dịch vụ khác hay
không.

## Tìm kiếm web bằng Ollama

OpenClaw tích hợp sẵn **Tìm kiếm web bằng Ollama** dưới dạng nhà cung cấp
`web_search`.

| Thuộc tính  | Chi tiết                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Máy chủ     | `models.providers.ollama.baseUrl` khi được đặt, nếu không thì dùng `http://127.0.0.1:11434`; `https://ollama.com` sử dụng trực tiếp API được lưu trữ                                                      |
| Xác thực    | Không cần khóa đối với máy chủ cục bộ đã đăng nhập; dùng `OLLAMA_API_KEY` hoặc thông tin xác thực nhà cung cấp đã cấu hình để tìm kiếm trực tiếp qua `https://ollama.com` hoặc các máy chủ được bảo vệ bằng xác thực |
| Yêu cầu     | Máy chủ cục bộ/tự lưu trữ phải đang chạy và đã đăng nhập bằng `ollama signin`; tìm kiếm trực tiếp qua dịch vụ lưu trữ cần `baseUrl: "https://ollama.com"` cùng một khóa API thực                          |

Chọn tùy chọn này trong `openclaw onboard` hoặc
`openclaw configure --section web`, hoặc đặt:

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

Để tìm kiếm trực tiếp qua dịch vụ lưu trữ bằng Ollama Cloud:

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

Đối với máy chủ tự lưu trữ, OpenClaw trước tiên thử proxy
`/api/experimental/web_search` cục bộ, sau đó chuyển sang đường dẫn
`/api/web_search` được lưu trữ trên cùng máy chủ; tiến trình nền cục bộ đã đăng
nhập thường phản hồi qua proxy cục bộ. Các lệnh gọi trực tiếp đến
`https://ollama.com` luôn sử dụng điểm cuối `/api/web_search` được lưu trữ.

<Note>
Để biết đầy đủ cách thiết lập và hoạt động, hãy xem [Tìm kiếm web bằng Ollama](/vi/tools/ollama-search).
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Chức năng gọi công cụ không đáng tin cậy trong chế độ này.** Chỉ sử dụng khi proxy cần định dạng OpenAI và bạn không phụ thuộc vào chức năng gọi công cụ gốc.
    </Warning>

    Đặt rõ `api: "openai-completions"` cho proxy phía sau
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // mặc định: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Chế độ này có thể không hỗ trợ đồng thời truyền trực tuyến và gọi công cụ;
    bạn có thể cần đặt `params: { streaming: false }` trên mô hình.

    Theo mặc định, OpenClaw chèn `options.num_ctx` trong chế độ này để Ollama
    không âm thầm quay về ngữ cảnh 4096 token. Nếu proxy của bạn từ chối các
    trường `options` không xác định, hãy tắt tính năng này:

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

  <Accordion title="Context windows">
    Đối với các mô hình được tự động phát hiện, OpenClaw sử dụng cửa sổ ngữ cảnh
    do `/api/show` báo cáo, bao gồm các giá trị `PARAMETER num_ctx` lớn hơn từ
    Modelfile tùy chỉnh; nếu không, hệ thống quay về cửa sổ ngữ cảnh Ollama mặc
    định của OpenClaw.

    `contextWindow`, `contextTokens` và `maxTokens` ở cấp nhà cung cấp đặt giá
    trị mặc định cho mọi mô hình thuộc nhà cung cấp đó và có thể được ghi đè
    theo từng mô hình. `contextWindow` là ngân sách lời nhắc/Compaction riêng
    của OpenClaw. Các yêu cầu `/api/chat` gốc không đặt `options.num_ctx` trừ
    khi bạn đặt rõ `params.num_ctx`, vì vậy Ollama áp dụng giá trị mặc định của
    chính mô hình, `OLLAMA_CONTEXT_LENGTH` hoặc giá trị dựa trên VRAM; các giá
    trị `params.num_ctx` không hợp lệ, bằng không, âm hoặc không hữu hạn sẽ bị
    bỏ qua. Nếu một cấu hình cũ chỉ dùng `contextWindow`/`maxTokens` để ép ngữ
    cảnh yêu cầu gốc, hãy chạy `openclaw doctor --fix` để sao chép các giá trị
    đó vào `params.num_ctx`. Bộ điều hợp tương thích OpenAI vẫn mặc định chèn
    `options.num_ctx` từ `params.num_ctx` hoặc `contextWindow` đã cấu hình; hãy
    tắt bằng `injectNumCtxForOpenAICompat: false` nếu hệ thống thượng nguồn từ
    chối `options`.

    Các mục mô hình gốc cũng chấp nhận các tùy chọn thời gian chạy Ollama phổ
    biến trong `params`, được chuyển tiếp dưới dạng `options` của `/api/chat`
    gốc: `num_keep`, `seed`, `num_predict`, `top_k`, `top_p`, `min_p`,
    `typical_p`, `repeat_last_n`, `temperature`, `repeat_penalty`,
    `presence_penalty`, `frequency_penalty`, `stop`, `num_batch`, `num_gpu`,
    `main_gpu`, `use_mmap` và `num_thread`. Một số khóa (`format`,
    `keep_alive`, `truncate`, `shift`) được chuyển tiếp dưới dạng trường yêu cầu
    cấp cao nhất thay vì nằm trong `options`. OpenClaw chỉ chuyển tiếp các khóa
    yêu cầu Ollama này, vì vậy các tham số chỉ dành cho thời gian chạy như
    `streaming` không bao giờ được gửi đến Ollama. Dùng `params.think` (hoặc
    `params.thinking`) để đặt `think` cấp cao nhất; `false` tắt chức năng suy
    nghĩ ở cấp API cho các mô hình suy nghĩ kiểu Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` theo từng mô hình
    cũng hoạt động; mục mô hình nhà cung cấp được khai báo rõ sẽ được ưu tiên
    nếu cả hai đều được đặt.

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw chuyển tiếp chế độ suy nghĩ theo cách Ollama yêu cầu: `think` cấp
    cao nhất, không phải `options.think`. Các mô hình được tự động phát hiện mà
    `/api/show` báo cáo có khả năng `thinking` sẽ cung cấp `/think low`,
    `/think medium`, `/think high` và `/think max`; các mô hình không có khả
    năng suy nghĩ chỉ cung cấp `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Hoặc đặt giá trị mặc định cho mô hình:

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

    `params.think`/`params.thinking` theo từng mô hình có thể tắt hoặc buộc API
    sử dụng chế độ suy luận cho một mô hình cụ thể. OpenClaw giữ nguyên cấu hình
    tường minh đó khi lượt chạy hiện tại chỉ có giá trị mặc định ngầm định `off`;
    một lệnh thời gian chạy khác `off`, chẳng hạn `/think medium`, vẫn ghi đè cấu
    hình này. Yêu cầu suy luận có giá trị đúng không bao giờ được gửi đến mô hình
    được đánh dấu rõ ràng là `reasoning: false`; yêu cầu `think: false` luôn được
    gửi bất kể trường hợp nào.

  </Accordion>

  <Accordion title="Mô hình suy luận">
    Các mô hình có tên `deepseek-r1`, `reasoning`, `reason` hoặc `think` mặc định
    được xem là có khả năng suy luận — không cần cấu hình bổ sung:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Chi phí mô hình">
    Ollama chạy cục bộ và miễn phí, vì vậy mọi chi phí mô hình đều là `0` cho cả
    mô hình được tự động phát hiện và mô hình được định nghĩa thủ công.
  </Accordion>

  <Accordion title="Embedding bộ nhớ">
    Plugin Ollama đi kèm đăng ký một nhà cung cấp embedding bộ nhớ cho
    [tìm kiếm bộ nhớ](/vi/concepts/memory). Plugin sử dụng URL cơ sở và khóa API
    Ollama đã cấu hình, gọi `/api/embed`, đồng thời gộp nhiều đoạn bộ nhớ vào một
    yêu cầu `input` khi có thể.

    Khi `proxy.enabled=true`, các yêu cầu embedding đến chính xác origin local loopback
    của máy chủ được suy ra từ `baseUrl` đã cấu hình sẽ sử dụng đường dẫn trực tiếp
    có bảo vệ của OpenClaw thay vì proxy chuyển tiếp được quản lý. Bản thân tên máy
    chủ đã cấu hình phải là `localhost` hoặc một địa chỉ IP loopback dạng chữ — các
    tên DNS chỉ phân giải thành loopback vẫn sử dụng đường dẫn proxy được quản lý.
    Các máy chủ Ollama trên LAN, tailnet, mạng riêng và mạng công cộng luôn sử dụng
    đường dẫn proxy được quản lý; các lượt chuyển hướng đến máy chủ/cổng khác không
    kế thừa độ tin cậy. `proxy.loopbackMode: "proxy"` vẫn định tuyến lưu lượng
    loopback qua proxy; `proxy.loopbackMode: "block"` từ chối lưu lượng này trước
    khi kết nối — xem [Proxy được quản lý](/vi/security/network-proxy#gateway-loopback-mode).

    | Thuộc tính | Giá trị |
    | --- | --- |
    | Mô hình mặc định | `nomic-embed-text` |
    | Tự động tải xuống | Có, nếu chưa có cục bộ |
    | Số tác vụ nội tuyến đồng thời mặc định | 1 (các nhà cung cấp khác có giá trị mặc định cao hơn; tăng bằng `nonBatchConcurrency` nếu máy chủ có thể đáp ứng) |

    Các embedding tại thời điểm truy vấn sử dụng tiền tố truy xuất đối với những
    mô hình yêu cầu hoặc khuyến nghị chúng: `nomic-embed-text`, `qwen3-embedding`
    và `mxbai-embed-large`. Các lô tài liệu vẫn giữ nguyên dữ liệu thô, vì vậy các
    chỉ mục hiện có không cần di chuyển định dạng.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Mặc định cho Ollama. Tăng trên các máy chủ lớn hơn nếu việc lập lại chỉ mục quá chậm.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Đối với máy chủ embedding từ xa, chỉ cấp phạm vi xác thực cho máy chủ đó:

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

  <Accordion title="Cấu hình truyền trực tiếp">
    Ollama mặc định sử dụng **API gốc** (`/api/chat`), hỗ trợ đồng thời truyền
    trực tiếp và gọi công cụ — không cần cấu hình đặc biệt.

    Đối với yêu cầu gốc, điều khiển suy luận được chuyển tiếp trực tiếp:
    `/think off` và `openclaw agent --thinking off` gửi `think: false` ở cấp cao
    nhất, trừ khi `params.think`/`params.thinking` được cấu hình tường minh;
    `/think low|medium|high` gửi chuỗi mức độ tương ứng; `/think max` ánh xạ
    thành mức độ cao nhất của Ollama, `think: "high"`.

    <Tip>
    Để dùng điểm cuối tương thích OpenAI, hãy xem phần "Chế độ tương thích OpenAI cũ" ở trên — truyền trực tiếp và gọi công cụ có thể không hoạt động cùng nhau trong chế độ đó.
    </Tip>

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Vòng lặp sự cố WSL2 (khởi động lại liên tục)">
    Trên WSL2 với NVIDIA/CUDA, trình cài đặt Ollama Linux chính thức tạo một
    đơn vị systemd `ollama.service` với `Restart=always`. Nếu dịch vụ đó tự động
    khởi động và tải một mô hình dùng GPU trong quá trình WSL2 khởi động, Ollama
    có thể ghim bộ nhớ máy chủ trong lúc tải; cơ chế thu hồi bộ nhớ của Hyper-V
    không phải lúc nào cũng thu hồi được các trang đó, nên Windows có thể chấm
    dứt máy ảo WSL2, systemd khởi động lại Ollama và vòng lặp tiếp diễn.

    Dấu hiệu: WSL2 liên tục khởi động lại/bị chấm dứt, mức sử dụng CPU cao trong
    `app.slice` hoặc `ollama.service` ngay sau khi WSL2 khởi động, và SIGTERM từ
    systemd thay vì trình xử lý hết bộ nhớ của Linux.

    OpenClaw ghi cảnh báo khi khởi động nếu phát hiện WSL2, `ollama.service`
    được bật với `Restart=always` và có các dấu hiệu CUDA hiển thị.

    Cách giảm thiểu:

    ```bash
    sudo systemctl disable ollama
    ```

    Ở phía Windows, thêm nội dung này vào `%USERPROFILE%\.wslconfig`, rồi chạy
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Hoặc rút ngắn thời gian duy trì hoạt động / chỉ khởi động Ollama thủ công
    khi cần:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Xem [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Không phát hiện Ollama">
    Xác nhận Ollama đang chạy, `OLLAMA_API_KEY` (hoặc một hồ sơ xác thực) đã
    được thiết lập và `models.providers.ollama` **không** được định nghĩa tường
    minh:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Không có mô hình khả dụng">
    Tải mô hình xuống cục bộ hoặc định nghĩa mô hình đó một cách tường minh
    trong `models.providers.ollama`:

    ```bash
    ollama list  # Xem những gì đã được cài đặt
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Hoặc một mô hình khác
    ```

  </Accordion>

  <Accordion title="Kết nối bị từ chối">
    ```bash
    # Kiểm tra xem Ollama có đang chạy không
    ps aux | grep ollama

    # Hoặc khởi động lại Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Máy chủ từ xa hoạt động với curl nhưng không hoạt động với OpenClaw">
    Xác minh từ cùng máy và môi trường thời gian chạy đang chạy Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Các nguyên nhân phổ biến:

    - `baseUrl` trỏ đến `localhost`, nhưng Gateway chạy trong Docker hoặc trên một máy chủ khác.
    - URL sử dụng `/v1`, chọn hành vi tương thích OpenAI thay vì Ollama gốc.
    - Máy chủ từ xa cần thay đổi tường lửa hoặc liên kết LAN.
    - Mô hình nằm trên daemon của máy tính xách tay nhưng không có trên daemon từ xa.

  </Accordion>

  <Accordion title="Mô hình xuất JSON công cụ dưới dạng văn bản">
    Thông thường, nhà cung cấp đang ở chế độ tương thích OpenAI hoặc mô hình
    không thể xử lý lược đồ công cụ. Nên ưu tiên chế độ gốc:

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

    Nếu một mô hình cục bộ nhỏ vẫn không xử lý được lược đồ công cụ, hãy đặt
    `compat.supportsTools: false` cho mục mô hình đó và kiểm tra lại.

  </Accordion>

  <Accordion title="Kimi hoặc GLM trả về các ký hiệu bị lỗi">
    Các phản hồi Kimi/GLM được lưu trữ có những chuỗi ký hiệu dài, không mang
    tính ngôn ngữ sẽ được xử lý như một lệnh gọi nhà cung cấp thất bại thay vì
    một phản hồi thành công, để cơ chế thử lại/chuyển đổi dự phòng/xử lý lỗi
    thông thường tiếp quản thay vì lưu văn bản hỏng vào phiên.

    Nếu sự cố tái diễn, hãy ghi lại tên mô hình, tệp phiên hiện tại và lượt chạy
    đã sử dụng `Cloud + Local` hay `Cloud only`, sau đó thử một phiên mới và
    một mô hình dự phòng:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Mô hình cục bộ chưa tải bị hết thời gian chờ">
    Các mô hình cục bộ lớn có thể cần nhiều thời gian cho lần tải đầu tiên. Hãy
    giới hạn phạm vi thời gian chờ cho nhà cung cấp Ollama và tùy chọn giữ mô
    hình ở trạng thái đã tải giữa các lượt:

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

    Nếu bản thân máy chủ phản hồi kết nối chậm, `timeoutSeconds` cũng kéo dài
    thời gian chờ kết nối có bảo vệ cho nhà cung cấp này.

  </Accordion>

  <Accordion title="Mô hình ngữ cảnh lớn quá chậm hoặc hết bộ nhớ">
    Nhiều mô hình công bố kích thước ngữ cảnh lớn hơn mức phần cứng của bạn có
    thể vận hành thoải mái. Ollama gốc sử dụng giá trị mặc định của môi trường
    thời gian chạy riêng, trừ khi `params.num_ctx` được đặt. Hãy giới hạn cả
    ngân sách của OpenClaw và ngữ cảnh yêu cầu của Ollama để có độ trễ đến token
    đầu tiên ổn định:

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

    Giảm `contextWindow` nếu OpenClaw gửi quá nhiều prompt. Giảm
    `params.num_ctx` nếu ngữ cảnh thời gian chạy của Ollama quá lớn đối với máy.
    Giảm `maxTokens` nếu quá trình tạo nội dung kéo dài quá lâu.

  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/vi/providers/ollama-cloud" icon="cloud">
    Thiết lập chỉ dùng đám mây với nhà cung cấp `ollama-cloud` chuyên dụng.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
  <Card title="Tìm kiếm web bằng Ollama" href="/vi/tools/ollama-search" icon="magnifying-glass">
    Chi tiết đầy đủ về thiết lập và hành vi của tính năng tìm kiếm web do Ollama hỗ trợ.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ.
  </Card>
</CardGroup>
