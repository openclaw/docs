---
read_when:
    - Bạn muốn thiết lập Moonshot Kimi K3/K2 (Moonshot Open Platform) hay Kimi Coding
    - Bạn cần hiểu rõ các endpoint, khóa và tham chiếu mô hình riêng biệt
    - Bạn muốn cấu hình có thể sao chép/dán cho một trong hai nhà cung cấp
summary: Cấu hình các mô hình Moonshot Kimi và Kimi Coding (nhà cung cấp + khóa riêng biệt)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-19T05:56:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9c60d2ec13c1de48e037b6cfe7b35b2133328ba852143134521e9d56edbba8e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot cung cấp API Kimi với các endpoint tương thích OpenAI. Chọn
`moonshot/kimi-k3` cho Kimi K3, giữ giá trị mặc định khi thiết lập ban đầu là
`moonshot/kimi-k2.6`, hoặc dùng `kimi/kimi-for-coding` cho Kimi Coding.

<Warning>
Moonshot và Kimi Coding là **các nhà cung cấp riêng biệt**, mỗi nhà cung cấp được phát hành dưới dạng một plugin bên ngoài riêng. Các khóa không thể dùng thay thế cho nhau, các endpoint khác nhau và các tham chiếu mô hình cũng khác nhau (`moonshot/...` so với `kimi/...`).
</Warning>

## Danh mục mô hình tích hợp sẵn

[//]: # "moonshot-kimi-k2-ids:start"

| Tham chiếu mô hình                   | Tên                      | Suy luận      | Đầu vào       | Ngữ cảnh | Đầu ra tối đa |
| ----------------------------------- | ------------------------ | ------------ | ------------- | -------- | ------------ |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | Không        | văn bản, hình ảnh | 262,144   | 262,144    |
| `moonshot/kimi-k3`                  | Kimi K3                  | Luôn tối đa  | văn bản, hình ảnh | 1,048,576 | 1,048,576  |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | Luôn bật     | văn bản, hình ảnh | 262,144   | 262,144    |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | Luôn bật     | văn bản, hình ảnh | 262,144   | 262,144    |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | Không        | văn bản, hình ảnh | 262,144   | 262,144    |

[//]: # "moonshot-kimi-k2-ids:end"

Ước tính chi phí trong danh mục sử dụng mức giá trả theo mức sử dụng do Moonshot công bố. Hãy kiểm tra
các trang trực tiếp của nhà cung cấp cho [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3),
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code),
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) và
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25) trước khi đưa ra quyết định
về chi phí.

Kimi K3 luôn suy luận ở mức `reasoning_effort: "max"`. OpenClaw chỉ cung cấp
`/think max`, bỏ qua trường chỉ dành cho K2 là `thinking` và loại bỏ các thiết lập ghi đè
lấy mẫu (`temperature`, `top_p`, `n`, `presence_penalty` và
`frequency_penalty`) mà K3 cố định theo giá trị mặc định của nhà cung cấp. Kimi K2.7 Code cũng
luôn sử dụng cơ chế suy nghĩ gốc nhưng yêu cầu phải bỏ qua cả `thinking` và
`reasoning_effort`; biến thể HighSpeed sử dụng cùng hợp đồng.
Kimi K2.6 vẫn là giá trị mặc định khi thiết lập ban đầu.
Xem [hướng dẫn bắt đầu nhanh với Kimi K3](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) của Moonshot.

## Bắt đầu

Cả Moonshot và Kimi Coding đều là plugin bên ngoài — hãy cài đặt một plugin trước khi
thiết lập ban đầu.

<Tabs>
  <Tab title="API Moonshot">
    **Phù hợp nhất cho:** các mô hình Kimi K3 và K2 thông qua Moonshot Open Platform.

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

        Hoặc đối với endpoint Trung Quốc:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Đặt Kimi K3 làm mô hình mặc định">
        Quy trình thiết lập ban đầu giữ Kimi K2.6 làm giá trị mặc định ban đầu. Hãy chuyển đổi rõ ràng
        khi bạn muốn dùng Kimi K3:

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="Xác minh các mô hình khả dụng">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Chạy kiểm thử nhanh trực tiếp">
        Sử dụng thư mục trạng thái tách biệt khi bạn muốn xác minh quyền truy cập mô hình và khả năng theo dõi
        chi phí mà không ảnh hưởng đến các phiên thông thường:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        Phản hồi JSON phải báo cáo `provider: "moonshot"` và
        `model: "kimi-k3"`. Mục bản ghi hội thoại của trợ lý lưu mức sử dụng
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
                compat: {
                  supportsReasoningEffort: true,
                  supportedReasoningEfforts: ["max"],
                },
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
    Kimi Coding sử dụng khóa API và tiền tố nhà cung cấp (`kimi/...`) khác với Moonshot (`moonshot/...`). Các tham chiếu hiện tại là `kimi/k3` cho ngữ cảnh 256K, `kimi/k3[1m]` cho cấp 1M, `kimi/kimi-for-coding` và `kimi/kimi-for-coding-highspeed`. Các tham chiếu cũ `kimi/kimi-code` và `kimi/k2p5` vẫn được chấp nhận và được chuẩn hóa thành `kimi/kimi-for-coding`.
    </Note>

    Dịch vụ lập trình chấp nhận cả máy khách tương thích OpenAI
    `https://api.kimi.com/coding/v1` và máy khách tương thích Anthropic
    `https://api.kimi.com/coding/`. Plugin này sử dụng Anthropic Messages.
    Tạo khóa thành viên trong
    [Kimi Code Console](https://www.kimi.com/code/console); mức giá thành viên hiện tại
    có trên [trang giá của Kimi](https://www.kimi.com/membership/pricing).

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

    Kimi Code K3 mặc định sử dụng chế độ suy nghĩ sâu ở mức `max`. `/think off` gửi
    `thinking.type: "disabled"`; `/think max` gửi yêu cầu suy nghĩ thích ứng
    của K3 với mức nỗ lực tối đa. Các mức suy nghĩ thấp hơn đã lỗi thời được quy về
    mức được hỗ trợ là `max`. Mô hình 1M yêu cầu gói thành viên Kimi
    Allegretto trở lên; hãy dùng `kimi/k3` với Moderato.

    Xem [bảng mô hình Kimi Code](https://www.kimi.com/code/docs/en/kimi-code/models.html) chính thức để biết khả năng cung cấp hiện tại theo từng gói.

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

Plugin Moonshot cũng đăng ký **Kimi** làm nhà cung cấp `web_search`, được hỗ trợ bởi tính năng tìm kiếm web của Moonshot.

<Steps>
  <Step title="Chạy thiết lập tìm kiếm web tương tác">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Kimi** trong phần tìm kiếm web để lưu
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Cấu hình khu vực và mô hình tìm kiếm web">
    Quy trình thiết lập tương tác yêu cầu:

    | Cài đặt             | Tùy chọn                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Khu vực API         | `https://api.moonshot.ai/v1` (quốc tế) hoặc `https://api.moonshot.cn/v1` (Trung Quốc) |
    | Mô hình tìm kiếm web | Mặc định là `kimi-k2.6`                                             |

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
    Kimi K3 của API Moonshot luôn suy luận với mức nỗ lực tối đa. OpenClaw chỉ cung cấp
    `/think max`, gửi `reasoning_effort: "max"` và bỏ qua các thiết lập thấp hơn đã lỗi thời hoặc
    `off`.

    Kimi Code K3 cung cấp `/think off|max`. Điểm cuối tương thích với Anthropic của nó
    nhận `thinking.type: "disabled"` để tắt hoặc chế độ suy luận thích ứng với
    `output_config.effort: "max"` ở mức tối đa. Điều này áp dụng cho cả `kimi/k3` và
    `kimi/k3[1m]`.
    Moonshot API K3 hỗ trợ `auto`, `none`, `required` và các lựa chọn công cụ được cố định,
    vì vậy OpenClaw giữ nguyên `tool_choice` được yêu cầu. Khi sử dụng công cụ qua nhiều lượt,
    OpenClaw giữ nguyên nội dung suy luận của trợ lý mà hợp đồng
    phát lại của Moonshot yêu cầu.

    Kimi K2.7 Code luôn sử dụng chế độ suy luận gốc. Moonshot yêu cầu máy khách
    bỏ qua trường `thinking` đối với mô hình này, vì vậy OpenClaw chỉ cung cấp `on` và
    bỏ qua các cài đặt `off` cũ. K2.7 cũng cố định `temperature`, `top_p`, `n`,
    `presence_penalty` và `frequency_penalty`; OpenClaw bỏ qua các giá trị ghi đè đã cấu hình
    cho những trường đó.

    Các mô hình Moonshot Kimi khác hỗ trợ chế độ suy luận gốc nhị phân:

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

    | Mức `/think`       | Hành vi của Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Bất kỳ mức nào không phải tắt    | `thinking.type=enabled`    |

    <Warning>
    Khi chế độ suy luận của Moonshot K2 được bật, `tool_choice` phải là `auto` hoặc `none`. Một lựa chọn công cụ được cố định (`type: "tool"` hoặc `type: "function"`) sẽ buộc chế độ suy luận trở lại `disabled`, nhờ đó công cụ được yêu cầu vẫn chạy; thay vào đó, `tool_choice: "required"` được chuẩn hóa thành `auto`. Kimi K2.7 Code không thể tắt chế độ suy luận, vì vậy `tool_choice` không tương thích của nó được chuẩn hóa thành `auto`. Kimi K3 sử dụng hợp đồng mức độ suy luận riêng và giữ nguyên các lựa chọn công cụ được hỗ trợ.
    </Warning>

    Kimi K2.6 cũng chấp nhận một trường `thinking.keep` tùy chọn để kiểm soát
    việc lưu giữ `reasoning_content` qua nhiều lượt. Đặt thành `"all"` để giữ toàn bộ
    nội dung suy luận qua các lượt; bỏ qua trường này (hoặc để là `null`) nhằm sử dụng chiến lược
    mặc định của máy chủ. OpenClaw chỉ chuyển tiếp `thinking.keep` cho
    `moonshot/kimi-k2.6` và loại bỏ trường này khỏi các mô hình khác. Kimi K2.7 Code
    mặc định giữ toàn bộ lịch sử suy luận, còn OpenClaw bỏ qua toàn bộ
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
    Moonshot Kimi cung cấp các mã định danh tool_call gốc có dạng `functions.<name>:<index>`. OpenClaw giữ nguyên lần xuất hiện đầu tiên của mỗi mã định danh Kimi gốc và viết lại các bản trùng lặp sau đó thành mã định danh `call_*` kiểu OpenAI, có tính xác định. Các kết quả công cụ tương ứng được ánh xạ lại bằng cùng mã định danh để bản phát lại vẫn duy nhất mà không loại bỏ mã định danh gốc đầu tiên của Kimi. Hành vi này được tích hợp vào nhà cung cấp Moonshot đi kèm và không phải là cài đặt người dùng có thể cấu hình.
  </Accordion>

  <Accordion title="Khả năng tương thích của mức sử dụng khi truyền phát">
    Các điểm cuối Moonshot gốc (`https://api.moonshot.ai/v1` và
    `https://api.moonshot.cn/v1`) công bố khả năng tương thích với mức sử dụng khi truyền phát.
    OpenClaw xác định điều này dựa trên máy chủ của điểm cuối, không phải mã định danh nhà cung cấp, vì vậy một mã định danh
    nhà cung cấp tùy chỉnh trỏ đến cùng máy chủ Moonshot gốc sẽ kế thừa cùng
    hành vi mức sử dụng khi truyền phát.

    Với mức giá K2.6 trong danh mục, mức sử dụng được truyền phát bao gồm token đầu vào, đầu ra
    và token đọc từ bộ nhớ đệm cũng được chuyển đổi thành chi phí USD ước tính cục bộ cho
    `/status`, `/usage full`, `/usage cost` và hoạt động hạch toán phiên
    dựa trên bản chép lời.

  </Accordion>

  <Accordion title="Tham chiếu điểm cuối và tham chiếu mô hình">
    | Nhà cung cấp   | Tiền tố tham chiếu mô hình | Điểm cuối                      | Biến môi trường xác thực        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Điểm cuối Kimi Coding           | `KIMI_API_KEY`      |
    | Tìm kiếm web | Không áp dụng              | Giống vùng Moonshot API    | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |

    - Tính năng tìm kiếm web của Kimi sử dụng `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`, và mặc định là `https://api.moonshot.ai/v1` với mô hình `kimi-k2.6`.
    - Ghi đè mức giá và siêu dữ liệu ngữ cảnh trong `models.providers` nếu cần.
    - Nếu Moonshot công bố các giới hạn ngữ cảnh khác cho một mô hình, hãy điều chỉnh `contextWindow` cho phù hợp.

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
    Lược đồ cấu hình đầy đủ cho nhà cung cấp, mô hình và plugin.
  </Card>
  <Card title="Nền tảng mở Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Quản lý khóa Moonshot API và tài liệu.
  </Card>
</CardGroup>
