---
read_when:
    - Bạn muốn cấu hình Moonshot K2 (Moonshot Open Platform) so với Kimi Coding
    - Bạn cần hiểu các endpoint, khóa và tham chiếu mô hình riêng biệt
    - Bạn muốn cấu hình có thể sao chép/dán cho một trong hai provider
summary: Định cấu hình Moonshot K2 và Kimi Coding (nhà cung cấp + khóa riêng biệt)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot cung cấp Kimi API với các endpoint tương thích OpenAI. Cấu hình
provider và đặt model mặc định thành `moonshot/kimi-k2.6`, hoặc dùng
Kimi Coding với `kimi/kimi-for-coding`.

<Warning>
Moonshot và Kimi Coding là **các provider riêng biệt**. Khóa không thể dùng thay thế cho nhau, endpoint khác nhau, và model ref cũng khác nhau (`moonshot/...` so với `kimi/...`).
</Warning>

## Danh mục model tích hợp sẵn

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Tên                    | Suy luận    | Đầu vào              | Ngữ cảnh | Đầu ra tối đa |
| --------------------------------- | ---------------------- | ----------- | -------------------- | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Không       | văn bản, hình ảnh    | 262,144  | 262,144       |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Luôn bật    | văn bản, hình ảnh    | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Không       | văn bản, hình ảnh    | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Có          | văn bản              | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Có          | văn bản              | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Không       | văn bản              | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Ước tính chi phí trong danh mục cho các model K2 hiện tại do Moonshot lưu trữ dùng
mức giá trả theo mức sử dụng mà Moonshot đã công bố: Kimi K2.7 Code là $0.19/MTok khi cache hit,
$0.95/MTok đầu vào, và $4.00/MTok đầu ra; Kimi K2.6 là $0.16/MTok khi cache hit,
$0.95/MTok đầu vào, và $4.00/MTok đầu ra; Kimi K2.5 là $0.10/MTok khi cache hit,
$0.60/MTok đầu vào, và $3.00/MTok đầu ra. Các mục danh mục cũ khác giữ
placeholder chi phí bằng không trừ khi bạn ghi đè chúng trong cấu hình.

Kimi K2.7 Code luôn dùng thinking gốc. OpenClaw chỉ hiển thị trạng thái thinking `on`
cho model này và bỏ qua các điều khiển gửi đi `thinking` và
`reasoning_effort`, theo yêu cầu của Moonshot. OpenClaw cũng bỏ qua
các ghi đè sampling mà K2.7 cố định theo mặc định của provider. Kimi K2.6 vẫn là
mặc định khi onboarding.

## Bắt đầu

Chọn provider của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Moonshot API">
    **Phù hợp nhất cho:** các model Kimi K2 qua Moonshot Open Platform.

    <Steps>
      <Step title="Chọn vùng endpoint của bạn">
        | Lựa chọn xác thực      | Endpoint                       | Vùng          |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Quốc tế       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Trung Quốc    |
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Hoặc cho endpoint Trung Quốc:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Đặt model mặc định">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Xác minh model có sẵn">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Chạy smoke test trực tiếp">
        Dùng thư mục trạng thái tách biệt khi bạn muốn xác minh quyền truy cập model và theo dõi
        chi phí mà không chạm vào các phiên thông thường của bạn:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Phản hồi JSON nên báo cáo `provider: "moonshot"` và
        `model: "kimi-k2.6"`. Mục transcript của trợ lý lưu mức sử dụng token đã chuẩn hóa
        cùng chi phí ước tính trong `usage.cost` khi Moonshot trả về
        metadata sử dụng.
      </Step>
    </Steps>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    Cài đặt plugin chính thức, rồi khởi động lại Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Phù hợp nhất cho:** các tác vụ tập trung vào mã qua endpoint Kimi Coding.

    <Note>
    Kimi Coding dùng khóa API và tiền tố provider khác (`kimi/...`) so với Moonshot (`moonshot/...`). Model ref API ổn định là `kimi/kimi-for-coding`; các ref cũ `kimi/kimi-code` và `kimi/k2p5` vẫn được chấp nhận và được chuẩn hóa thành model id API đó.
    </Note>

    <Steps>
      <Step title="Cài đặt plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Đặt model mặc định">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Xác minh model có sẵn">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Ví dụ cấu hình

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Tìm kiếm web Kimi

Plugin Moonshot cũng đăng ký **Kimi** làm provider `web_search`, dựa trên tìm kiếm web Moonshot.

<Steps>
  <Step title="Chạy thiết lập tìm kiếm web tương tác">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Kimi** trong phần tìm kiếm web để lưu
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Cấu hình vùng và model tìm kiếm web">
    Thiết lập tương tác sẽ nhắc nhập:

    | Thiết lập           | Tùy chọn                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Vùng API            | `https://api.moonshot.ai/v1` (quốc tế) hoặc `https://api.moonshot.cn/v1` (Trung Quốc) |
    | Model tìm kiếm web  | Mặc định là `kimi-k2.6`                                              |

  </Step>
</Steps>

Cấu hình nằm trong `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Chế độ thinking gốc">
    Kimi K2.7 Code luôn dùng thinking gốc. Moonshot yêu cầu client
    bỏ qua trường `thinking` cho model này, vì vậy OpenClaw chỉ hiển thị `on` và
    bỏ qua các thiết lập `off` cũ. K2.7 cũng cố định `temperature`, `top_p`, `n`,
    `presence_penalty`, và `frequency_penalty`; OpenClaw bỏ qua các ghi đè đã cấu hình
    cho những trường đó.

    Các model Moonshot Kimi khác hỗ trợ thinking gốc dạng nhị phân:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Cấu hình theo từng model qua `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ánh xạ các mức `/think` khi chạy cho những model đó:

    | Mức `/think`        | Hành vi của Moonshot       |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Bất kỳ mức không-off | `thinking.type=enabled`    |

    <Warning>
    Khi thinking của Moonshot được bật, `tool_choice` phải là `auto` hoặc `none`. OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`. Điều này bao gồm Kimi K2.7 Code, model có chế độ thinking không thể tắt để giữ nguyên một lựa chọn công cụ đã ghim.
    </Warning>

    Kimi K2.6 cũng chấp nhận trường tùy chọn `thinking.keep` để kiểm soát
    việc giữ lại `reasoning_content` qua nhiều lượt. Đặt thành `"all"` để giữ toàn bộ
    reasoning qua các lượt; bỏ qua trường này (hoặc để `null`) để dùng chiến lược
    mặc định của máy chủ. OpenClaw chỉ chuyển tiếp `thinking.keep` cho
    `moonshot/kimi-k2.6` và loại bỏ trường này khỏi các mô hình khác. Kimi K2.7 Code
    mặc định giữ toàn bộ lịch sử reasoning, trong khi OpenClaw bỏ qua toàn bộ
    trường `thinking`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chuẩn hóa id lệnh gọi công cụ">
    Moonshot Kimi cung cấp các id tool_call gốc có dạng `functions.<name>:<index>`. Đối với transport OpenAI-completions, OpenClaw giữ nguyên lần xuất hiện đầu tiên của mỗi id Kimi gốc và viết lại các bản trùng lặp sau đó thành id `call_*` kiểu OpenAI có tính xác định. Các kết quả công cụ tương ứng được ánh xạ lại với cùng id đó để việc phát lại vẫn duy nhất mà không loại bỏ id gốc đầu tiên của Kimi.

    Để buộc chuẩn hóa nghiêm ngặt trên một nhà cung cấp tùy chỉnh tương thích OpenAI, hãy đặt `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tương thích mức sử dụng khi streaming">
    Các endpoint Moonshot gốc (`https://api.moonshot.ai/v1` và
    `https://api.moonshot.cn/v1`) công bố khả năng tương thích mức sử dụng khi streaming trên
    transport `openai-completions` dùng chung. OpenClaw xác định điều đó dựa trên
    khả năng của endpoint, nên các id nhà cung cấp tùy chỉnh tương thích nhắm đến cùng
    các máy chủ Moonshot gốc sẽ kế thừa cùng hành vi streaming-usage.

    Với giá K2.6 trong catalog, mức sử dụng được stream bao gồm token đầu vào, đầu ra
    và đọc từ cache cũng được chuyển đổi thành chi phí USD ước tính cục bộ cho
    `/status`, `/usage full`, `/usage cost`, và hạch toán phiên
    dựa trên bản ghi hội thoại.

  </Accordion>

  <Accordion title="Tham chiếu endpoint và model ref">
    | Nhà cung cấp | Tiền tố model ref | Endpoint                      | Biến môi trường xác thực |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Tìm kiếm web | N/A              | Giống vùng Moonshot API   | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |

    - Tìm kiếm web của Kimi dùng `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`, và mặc định là `https://api.moonshot.ai/v1` với mô hình `kimi-k2.6`.
    - Ghi đè giá và siêu dữ liệu ngữ cảnh trong `models.providers` nếu cần.
    - Nếu Moonshot công bố giới hạn ngữ cảnh khác cho một mô hình, hãy điều chỉnh `contextWindow` tương ứng.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, model ref và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm web" href="/vi/tools/web" icon="magnifying-glass">
    Cấu hình nhà cung cấp tìm kiếm web, bao gồm Kimi.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ cho nhà cung cấp, mô hình và Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Quản lý khóa Moonshot API và tài liệu.
  </Card>
</CardGroup>
