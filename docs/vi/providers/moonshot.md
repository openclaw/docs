---
read_when:
    - Bạn muốn thiết lập Moonshot K2 (Moonshot Open Platform) so với Kimi Coding
    - Bạn cần hiểu các endpoint, khóa và tham chiếu model riêng biệt
    - Bạn muốn cấu hình có thể sao chép/dán cho một trong hai nhà cung cấp
summary: Cấu hình Moonshot K2 so với Kimi Coding (nhà cung cấp + khóa riêng biệt)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-29T23:07:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot cung cấp Kimi API với các endpoint tương thích với OpenAI. Cấu hình
nhà cung cấp và đặt mô hình mặc định thành `moonshot/kimi-k2.6`, hoặc dùng
Kimi Coding với `kimi/kimi-code`.

<Warning>
Moonshot và Kimi Coding là **các nhà cung cấp riêng biệt**. Khóa không thể dùng thay thế cho nhau, endpoint khác nhau, và tham chiếu mô hình cũng khác nhau (`moonshot/...` so với `kimi/...`).
</Warning>

## Danh mục mô hình tích hợp sẵn

[//]: # "moonshot-kimi-k2-ids:start"

| Tham chiếu mô hình                | Tên                    | Suy luận  | Đầu vào            | Ngữ cảnh | Đầu ra tối đa |
| --------------------------------- | ---------------------- | --------- | ------------------ | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Không     | văn bản, hình ảnh  | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Không     | văn bản, hình ảnh  | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Có        | văn bản            | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Có        | văn bản            | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Không     | văn bản            | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Các ước tính chi phí đi kèm cho các mô hình K2 hiện tại được Moonshot lưu trữ sử dụng
mức giá trả theo mức dùng do Moonshot công bố: Kimi K2.6 là $0.16/MTok khi trúng bộ nhớ đệm,
$0.95/MTok đầu vào và $4.00/MTok đầu ra; Kimi K2.5 là $0.10/MTok khi trúng bộ nhớ đệm,
$0.60/MTok đầu vào và $3.00/MTok đầu ra. Các mục danh mục cũ khác giữ
placeholder chi phí bằng không trừ khi bạn ghi đè chúng trong cấu hình.

## Bắt đầu

Chọn nhà cung cấp của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Moonshot API">
    **Phù hợp nhất cho:** các mô hình Kimi K2 thông qua Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Lựa chọn xác thực     | Endpoint                       | Khu vực       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Quốc tế       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Trung Quốc    |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Hoặc cho endpoint Trung Quốc:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Dùng thư mục trạng thái tách biệt khi bạn muốn xác minh quyền truy cập mô hình và theo dõi
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
        `model: "kimi-k2.6"`. Mục bản ghi hội thoại của trợ lý lưu mức sử dụng
        token đã chuẩn hóa cùng chi phí ước tính dưới `usage.cost` khi Moonshot trả về
        siêu dữ liệu sử dụng.
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
    **Phù hợp nhất cho:** các tác vụ tập trung vào mã thông qua endpoint Kimi Coding.

    <Note>
    Kimi Coding sử dụng khóa API và tiền tố nhà cung cấp (`kimi/...`) khác với Moonshot (`moonshot/...`). Tham chiếu mô hình cũ `kimi/k2p5` vẫn được chấp nhận làm id tương thích.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
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
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Tìm kiếm web Kimi

OpenClaw cũng cung cấp **Kimi** dưới dạng nhà cung cấp `web_search`, được hỗ trợ bởi tìm kiếm web của Moonshot.

<Steps>
  <Step title="Chạy thiết lập tìm kiếm web tương tác">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Kimi** trong mục tìm kiếm web để lưu
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Cấu hình khu vực và mô hình tìm kiếm web">
    Thiết lập tương tác sẽ nhắc nhập:

    | Cài đặt             | Tùy chọn                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Khu vực API          | `https://api.moonshot.ai/v1` (quốc tế) hoặc `https://api.moonshot.cn/v1` (Trung Quốc) |
    | Mô hình tìm kiếm web    | Mặc định là `kimi-k2.6`                                             |

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
  <Accordion title="Chế độ suy luận nguyên bản">
    Moonshot Kimi hỗ trợ suy luận nguyên bản nhị phân:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Cấu hình theo từng mô hình qua `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw cũng ánh xạ các mức `/think` trong thời gian chạy cho Moonshot:

    | Mức `/think`       | Hành vi của Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Bất kỳ mức nào không phải off    | `thinking.type=enabled`    |

    <Warning>
    Khi suy luận của Moonshot được bật, `tool_choice` phải là `auto` hoặc `none`. OpenClaw chuẩn hóa các giá trị `tool_choice` không tương thích thành `auto` để đảm bảo tương thích.
    </Warning>

    Kimi K2.6 cũng chấp nhận trường tùy chọn `thinking.keep` để kiểm soát
    việc giữ lại `reasoning_content` qua nhiều lượt. Đặt thành `"all"` để giữ toàn bộ
    phần suy luận qua các lượt; bỏ qua trường này (hoặc để là `null`) để dùng chiến lược
    mặc định của máy chủ. OpenClaw chỉ chuyển tiếp `thinking.keep` cho
    `moonshot/kimi-k2.6` và loại bỏ trường này khỏi các mô hình khác.

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

  <Accordion title="Làm sạch id lệnh gọi công cụ">
    Moonshot Kimi cung cấp các id tool_call có dạng `functions.<name>:<index>`. OpenClaw giữ nguyên chúng không thay đổi để các lệnh gọi công cụ nhiều lượt tiếp tục hoạt động.

    Để buộc làm sạch nghiêm ngặt trên một nhà cung cấp tùy chỉnh tương thích với OpenAI, hãy đặt `sanitizeToolCallIds: true`:

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

  <Accordion title="Tương thích mức sử dụng khi phát trực tuyến">
    Các điểm cuối Moonshot gốc (`https://api.moonshot.ai/v1` và
    `https://api.moonshot.cn/v1`) công bố khả năng tương thích về mức sử dụng khi phát trực tuyến trên
    phương thức truyền tải `openai-completions` dùng chung. OpenClaw xác định điều đó dựa trên
    năng lực của điểm cuối, vì vậy các id nhà cung cấp tùy chỉnh tương thích trỏ tới cùng các máy chủ
    Moonshot gốc sẽ kế thừa cùng hành vi mức sử dụng khi phát trực tuyến.

    Với giá K2.6 đi kèm, mức sử dụng được phát trực tuyến bao gồm token đầu vào, đầu ra
    và đọc từ bộ nhớ đệm cũng được chuyển đổi thành chi phí USD ước tính cục bộ cho
    `/status`, `/usage full`, `/usage cost`, và phần hạch toán phiên dựa trên bản ghi hội thoại.

  </Accordion>

  <Accordion title="Tham chiếu endpoint và model ref">
    | Nhà cung cấp | Tiền tố model ref | Endpoint                      | Biến môi trường xác thực |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Tìm kiếm web | N/A              | Giống vùng Moonshot API       | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |

    - Tìm kiếm web Kimi dùng `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`, và mặc định là `https://api.moonshot.ai/v1` với model `kimi-k2.6`.
    - Ghi đè siêu dữ liệu về giá và ngữ cảnh trong `models.providers` nếu cần.
    - Nếu Moonshot công bố giới hạn ngữ cảnh khác cho một model, hãy điều chỉnh `contextWindow` tương ứng.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, model ref và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm web" href="/vi/tools/web" icon="magnifying-glass">
    Cấu hình nhà cung cấp tìm kiếm web, bao gồm Kimi.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ cho nhà cung cấp, model và Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Quản lý khóa Moonshot API và tài liệu.
  </Card>
</CardGroup>
