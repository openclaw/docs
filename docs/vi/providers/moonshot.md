---
read_when:
    - Bạn muốn thiết lập Moonshot K2 (Moonshot Open Platform) hay Kimi Coding
    - Bạn cần hiểu rõ các endpoint, khóa và tham chiếu mô hình riêng biệt
    - Bạn muốn cấu hình có thể sao chép/dán cho một trong hai nhà cung cấp
summary: Cấu hình Moonshot K2 và Kimi Coding (nhà cung cấp và khóa riêng biệt)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T08:21:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot cung cấp API Kimi với các endpoint tương thích OpenAI. Đặt mô hình
mặc định thành `moonshot/kimi-k2.6` cho Moonshot Open Platform hoặc
`kimi/kimi-for-coding` cho Kimi Coding.

<Warning>
Moonshot và Kimi Coding là **hai nhà cung cấp riêng biệt**, mỗi nhà cung cấp được phân phối dưới dạng một plugin bên ngoài riêng. Các khóa không thể dùng thay thế cho nhau, endpoint khác nhau và tham chiếu mô hình cũng khác nhau (`moonshot/...` so với `kimi/...`).
</Warning>

## Danh mục mô hình tích hợp sẵn

[//]: # "moonshot-kimi-k2-ids:start"

| Tham chiếu mô hình                | Tên                    | Suy luận   | Đầu vào      | Ngữ cảnh | Đầu ra tối đa |
| --------------------------------- | ---------------------- | ---------- | ------------ | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Không      | văn bản, ảnh | 262,144  | 262,144       |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Luôn bật   | văn bản, ảnh | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Không      | văn bản, ảnh | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Có         | văn bản      | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Có         | văn bản      | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Không      | văn bản      | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Ước tính chi phí trong danh mục sử dụng mức giá trả theo mức sử dụng do Moonshot công bố: Kimi
K2.7 Code có giá $0.19/MTok khi trúng bộ nhớ đệm, $0.95/MTok đầu vào, $4.00/MTok đầu ra; Kimi
K2.6 có giá $0.16/MTok khi trúng bộ nhớ đệm, $0.95/MTok đầu vào, $4.00/MTok đầu ra; Kimi K2.5
có giá $0.10/MTok khi trúng bộ nhớ đệm, $0.60/MTok đầu vào, $3.00/MTok đầu ra. Các mục khác trong danh mục
giữ giá trị giữ chỗ bằng không, trừ khi bạn ghi đè chúng trong cấu hình.

Kimi K2.7 Code luôn sử dụng chế độ suy luận nguyên bản. OpenClaw chỉ cung cấp trạng thái suy luận `on`
cho mô hình này và loại bỏ các trường `thinking` và
`reasoning_effort` trong yêu cầu gửi đi, theo yêu cầu của Moonshot. OpenClaw cũng loại bỏ các giá trị ghi đè
cho việc lấy mẫu (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`) vì K2.7 cố định chúng theo giá trị mặc định của nhà cung cấp. Kimi K2.6 vẫn là
mô hình mặc định khi thiết lập ban đầu.

## Bắt đầu

Cả Moonshot và Kimi Coding đều là các plugin bên ngoài — hãy cài đặt một plugin trước khi
thiết lập ban đầu.

<Tabs>
  <Tab title="Moonshot API">
    **Phù hợp nhất cho:** Các mô hình Kimi K2 thông qua Moonshot Open Platform.

    <Steps>
      <Step title="Cài đặt plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Chọn khu vực endpoint">
        | Lựa chọn xác thực      | Endpoint                       | Khu vực       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Quốc tế       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Trung Quốc    |
      </Step>
      <Step title="Chạy thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Hoặc với endpoint Trung Quốc:

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
      <Step title="Xác minh các mô hình khả dụng">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Chạy kiểm thử nhanh trực tiếp">
        Sử dụng thư mục trạng thái biệt lập khi bạn muốn xác minh quyền truy cập mô hình và việc theo dõi
        chi phí mà không ảnh hưởng đến các phiên thông thường:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Phản hồi JSON phải báo cáo `provider: "moonshot"` và
        `model: "kimi-k2.6"`. Mục bản ghi hội thoại của trợ lý lưu mức sử dụng
        token đã chuẩn hóa cùng chi phí ước tính trong `usage.cost` khi Moonshot trả về
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
    **Phù hợp nhất cho:** các tác vụ tập trung vào mã nguồn thông qua endpoint Kimi Coding.

    <Note>
    Kimi Coding sử dụng khóa API và tiền tố nhà cung cấp (`kimi/...`) khác với Moonshot (`moonshot/...`). Tham chiếu mô hình ổn định là `kimi/kimi-for-coding`; các tham chiếu cũ `kimi/kimi-code` và `kimi/k2p5` vẫn được chấp nhận và được chuẩn hóa thành mã định danh mô hình đó.
    </Note>

    <Steps>
      <Step title="Cài đặt plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Chạy thiết lập ban đầu">
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
      <Step title="Xác minh mô hình khả dụng">
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

## Tìm kiếm web bằng Kimi

Plugin Moonshot cũng đăng ký **Kimi** làm nhà cung cấp `web_search`, sử dụng dịch vụ tìm kiếm web của Moonshot.

<Steps>
  <Step title="Chạy thiết lập tìm kiếm web tương tác">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Kimi** trong phần tìm kiếm web để lưu
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Cấu hình khu vực và mô hình tìm kiếm web">
    Thiết lập tương tác sẽ yêu cầu:

    | Cài đặt            | Tùy chọn                                                              |
    | ------------------ | --------------------------------------------------------------------- |
    | Khu vực API        | `https://api.moonshot.ai/v1` (quốc tế) hoặc `https://api.moonshot.cn/v1` (Trung Quốc) |
    | Mô hình tìm kiếm web | Mặc định là `kimi-k2.6`                                              |

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
    Kimi K2.7 Code luôn sử dụng chế độ suy luận nguyên bản. Moonshot yêu cầu ứng dụng khách
    loại bỏ trường `thinking` đối với mô hình này, vì vậy OpenClaw chỉ cung cấp `on` và
    bỏ qua các cài đặt `off` đã lỗi thời. K2.7 cũng cố định `temperature`, `top_p`, `n`,
    `presence_penalty` và `frequency_penalty`; OpenClaw loại bỏ các giá trị ghi đè đã cấu hình
    cho những trường đó.

    Các mô hình Moonshot Kimi khác hỗ trợ chế độ suy luận nguyên bản nhị phân:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Cấu hình riêng cho từng mô hình qua `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw ánh xạ các mức `/think` khi chạy cho những mô hình đó:

    | Mức `/think`         | Hành vi của Moonshot       |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Bất kỳ mức nào khác `off` | `thinking.type=enabled` |

    <Warning>
    Khi chế độ suy luận của Moonshot được bật, `tool_choice` phải là `auto` hoặc `none`. Lựa chọn công cụ được cố định (`type: "tool"` hoặc `type: "function"`) sẽ buộc chế độ suy luận trở lại `disabled` để công cụ được yêu cầu vẫn chạy; thay vào đó, `tool_choice: "required"` được chuẩn hóa thành `auto`. Điều này áp dụng cho mọi mô hình Moonshot ngoại trừ Kimi K2.7 Code, vì chế độ suy luận của mô hình này không thể bị tắt — `tool_choice` của mô hình sẽ được chuẩn hóa thành `auto` khi không tương thích.
    </Warning>

    Kimi K2.6 cũng chấp nhận trường `thinking.keep` tùy chọn để kiểm soát
    việc duy trì `reasoning_content` qua nhiều lượt. Đặt thành `"all"` để giữ lại toàn bộ
    quá trình suy luận qua các lượt; bỏ qua trường này (hoặc để là `null`) để sử dụng chiến lược
    mặc định của máy chủ. OpenClaw chỉ chuyển tiếp `thinking.keep` cho
    `moonshot/kimi-k2.6` và loại bỏ trường này khỏi các mô hình khác. Kimi K2.7 Code
    mặc định giữ lại toàn bộ lịch sử suy luận, còn OpenClaw bỏ qua toàn bộ
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

  <Accordion title="Làm sạch mã định danh lệnh gọi công cụ">
    Moonshot Kimi cung cấp các mã định danh tool_call gốc có dạng `functions.<name>:<index>`. OpenClaw giữ nguyên lần xuất hiện đầu tiên của mỗi mã định danh Kimi gốc và viết lại các bản trùng lặp sau đó thành mã định danh `call_*` theo kiểu OpenAI một cách xác định. Các kết quả công cụ tương ứng được ánh xạ lại bằng cùng mã định danh để dữ liệu phát lại vẫn duy nhất mà không loại bỏ mã định danh gốc đầu tiên của Kimi. Hành vi này được tích hợp vào nhà cung cấp Moonshot đi kèm và không phải là cài đặt mà người dùng có thể cấu hình.
  </Accordion>

  <Accordion title="Khả năng tương thích về mức sử dụng khi truyền phát">
    Các điểm cuối Moonshot gốc (`https://api.moonshot.ai/v1` và
    `https://api.moonshot.cn/v1`) công bố khả năng tương thích về mức sử dụng khi truyền phát.
    OpenClaw xác định điều này dựa trên máy chủ của điểm cuối, không phải mã định danh nhà cung cấp, vì vậy một
    mã định danh nhà cung cấp tùy chỉnh trỏ đến cùng máy chủ Moonshot gốc sẽ kế thừa cùng
    hành vi về mức sử dụng khi truyền phát.

    Với mức giá K2.6 trong danh mục, mức sử dụng được truyền phát bao gồm token đầu vào, đầu ra
    và đọc bộ nhớ đệm cũng được chuyển đổi thành chi phí USD ước tính cục bộ cho
    `/status`, `/usage full`, `/usage cost` và việc
    hạch toán phiên dựa trên bản ghi hội thoại.

  </Accordion>

  <Accordion title="Tham chiếu điểm cuối và tham chiếu mô hình">
    | Nhà cung cấp | Tiền tố tham chiếu mô hình | Điểm cuối                      | Biến môi trường xác thực |
    | ------------ | -------------------------- | ------------------------------ | ------------------------ |
    | Moonshot     | `moonshot/`                | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`       |
    | Moonshot CN  | `moonshot/`                | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`       |
    | Kimi Coding  | `kimi/`                    | Điểm cuối Kimi Coding          | `KIMI_API_KEY`           |
    | Tìm kiếm web | Không áp dụng              | Giống khu vực API Moonshot     | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |

    - Tìm kiếm web của Kimi sử dụng `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`, và mặc định dùng `https://api.moonshot.ai/v1` với mô hình `kimi-k2.6`.
    - Ghi đè mức giá và siêu dữ liệu ngữ cảnh trong `models.providers` nếu cần.
    - Nếu Moonshot công bố giới hạn ngữ cảnh khác cho một mô hình, hãy điều chỉnh `contextWindow` tương ứng.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm web" href="/vi/tools/web" icon="magnifying-glass">
    Cấu hình các nhà cung cấp dịch vụ tìm kiếm web, bao gồm Kimi.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ cho nhà cung cấp, mô hình và Plugin.
  </Card>
  <Card title="Nền tảng mở Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Quản lý khóa API và tài liệu của Moonshot.
  </Card>
</CardGroup>
