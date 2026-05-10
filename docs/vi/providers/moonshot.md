---
read_when:
    - Bạn muốn thiết lập Moonshot K2 (Moonshot Open Platform) thay vì Kimi Coding
    - Bạn cần hiểu các điểm cuối, khóa và tham chiếu mô hình tách biệt
    - Bạn muốn cấu hình có thể sao chép/dán cho một trong hai nhà cung cấp
summary: Cấu hình Moonshot K2 so với Kimi Coding (nhà cung cấp và khóa riêng biệt)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot cung cấp API Kimi với các điểm cuối tương thích với OpenAI. Cấu hình
provider và đặt mô hình mặc định thành `moonshot/kimi-k2.6`, hoặc sử dụng
Kimi Coding với `kimi/kimi-for-coding`.

<Warning>
Moonshot và Kimi Coding là **các provider riêng biệt**. Khóa không thể dùng thay thế cho nhau, điểm cuối khác nhau, và tham chiếu mô hình cũng khác nhau (`moonshot/...` so với `kimi/...`).
</Warning>

## Danh mục mô hình tích hợp sẵn

[//]: # "moonshot-kimi-k2-ids:start"

| Tham chiếu mô hình                | Tên                    | Lập luận | Đầu vào            | Ngữ cảnh | Đầu ra tối đa |
| --------------------------------- | ---------------------- | -------- | ------------------ | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Không    | văn bản, hình ảnh  | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Không    | văn bản, hình ảnh  | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Có       | văn bản            | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Có       | văn bản            | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Không    | văn bản            | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Ước tính chi phí đi kèm cho các mô hình K2 hiện tại được lưu trữ trên Moonshot sử dụng
mức giá trả theo mức dùng do Moonshot công bố: Kimi K2.6 là $0.16/MTok cho lượt trúng bộ nhớ đệm,
$0.95/MTok đầu vào, và $4.00/MTok đầu ra; Kimi K2.5 là $0.10/MTok cho lượt trúng bộ nhớ đệm,
$0.60/MTok đầu vào, và $3.00/MTok đầu ra. Các mục danh mục cũ khác giữ
placeholder chi phí bằng không trừ khi bạn ghi đè chúng trong cấu hình.

## Bắt đầu

Chọn provider của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Moonshot API">
    **Phù hợp nhất cho:** các mô hình Kimi K2 qua Moonshot Open Platform.

    <Steps>
      <Step title="Chọn vùng điểm cuối của bạn">
        | Lựa chọn xác thực     | Điểm cuối                     | Vùng          |
        | ---------------------- | ----------------------------- | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | Quốc tế       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | Trung Quốc    |
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Hoặc cho điểm cuối Trung Quốc:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh các mô hình có sẵn">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Chạy kiểm thử khói trực tiếp">
        Sử dụng thư mục trạng thái cô lập khi bạn muốn xác minh quyền truy cập mô hình và theo dõi chi phí
        mà không chạm vào các phiên thông thường của bạn:

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
        token đã chuẩn hóa cùng với chi phí ước tính trong `usage.cost` khi Moonshot trả về
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
    **Phù hợp nhất cho:** các tác vụ tập trung vào mã qua điểm cuối Kimi Coding.

    <Note>
    Kimi Coding sử dụng khóa API và tiền tố provider khác (`kimi/...`) so với Moonshot (`moonshot/...`). Tham chiếu mô hình API ổn định là `kimi/kimi-for-coding`; các tham chiếu cũ `kimi/kimi-code` và `kimi/k2p5` vẫn được chấp nhận và chuẩn hóa về id mô hình API đó.
    </Note>

    <Steps>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh mô hình có sẵn">
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

OpenClaw cũng cung cấp **Kimi** dưới dạng nhà cung cấp `web_search`, được hỗ trợ bởi tìm kiếm web của Moonshot.

<Steps>
  <Step title="Chạy thiết lập tìm kiếm web tương tác">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Kimi** trong phần tìm kiếm web để lưu
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Cấu hình vùng và mô hình tìm kiếm web">
    Thiết lập tương tác sẽ nhắc nhập:

    | Cài đặt             | Tùy chọn                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Vùng API          | `https://api.moonshot.ai/v1` (quốc tế) hoặc `https://api.moonshot.cn/v1` (Trung Quốc) |
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
  <Accordion title="Chế độ suy nghĩ gốc">
    Moonshot Kimi hỗ trợ chế độ suy nghĩ gốc nhị phân:

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

    | Mức `/think`         | Hành vi của Moonshot       |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Bất kỳ mức nào không phải off | `thinking.type=enabled`    |

    <Warning>
    Khi chế độ suy nghĩ của Moonshot được bật, `tool_choice` phải là `auto` hoặc `none`. OpenClaw chuẩn hóa các giá trị `tool_choice` không tương thích thành `auto` để đảm bảo tương thích.
    </Warning>

    Kimi K2.6 cũng chấp nhận trường `thinking.keep` tùy chọn, trường này kiểm soát
    việc giữ lại `reasoning_content` qua nhiều lượt. Đặt thành `"all"` để giữ toàn bộ
    phần lập luận qua các lượt; bỏ qua trường này (hoặc để là `null`) để dùng chiến lược
    mặc định của máy chủ. OpenClaw chỉ chuyển tiếp `thinking.keep` cho
    `moonshot/kimi-k2.6` và loại bỏ nó khỏi các mô hình khác.

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

  <Accordion title="Tool call id sanitization">
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

  <Accordion title="Streaming usage compatibility">
    Các endpoint Moonshot gốc (`https://api.moonshot.ai/v1` và
    `https://api.moonshot.cn/v1`) công bố khả năng tương thích sử dụng khi truyền trực tuyến trên
    phương thức truyền tải `openai-completions` dùng chung. OpenClaw xác định điều đó dựa trên
    năng lực của endpoint, vì vậy các id nhà cung cấp tùy chỉnh tương thích nhắm tới cùng
    các máy chủ Moonshot gốc sẽ kế thừa cùng hành vi sử dụng khi truyền trực tuyến.

    Với mức giá K2.6 được tích hợp sẵn, dữ liệu sử dụng được truyền trực tuyến bao gồm token đầu vào,
    đầu ra và đọc từ bộ nhớ đệm cũng được chuyển đổi thành chi phí USD ước tính cục bộ cho
    `/status`, `/usage full`, `/usage cost` và kế toán phiên dựa trên bản ghi hội thoại.

  </Accordion>

  <Accordion title="Tham chiếu điểm cuối và tham chiếu mô hình">
    | Nhà cung cấp | Tiền tố tham chiếu mô hình | Điểm cuối                     | Biến môi trường xác thực |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Điểm cuối Kimi Coding         | `KIMI_API_KEY`      |
    | Tìm kiếm web | N/A              | Giống vùng Moonshot API       | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |

    - Tìm kiếm web Kimi sử dụng `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`, và mặc định là `https://api.moonshot.ai/v1` với mô hình `kimi-k2.6`.
    - Ghi đè giá và siêu dữ liệu ngữ cảnh trong `models.providers` nếu cần.
    - Nếu Moonshot công bố giới hạn ngữ cảnh khác cho một mô hình, hãy điều chỉnh `contextWindow` cho phù hợp.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm web" href="/vi/tools/web" icon="magnifying-glass">
    Cấu hình nhà cung cấp tìm kiếm web, bao gồm Kimi.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ cho nhà cung cấp, mô hình và Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Quản lý khóa Moonshot API và tài liệu.
  </Card>
</CardGroup>
