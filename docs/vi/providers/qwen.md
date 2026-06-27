---
read_when:
    - Bạn muốn dùng Qwen với OpenClaw
    - Trước đây bạn đã dùng Qwen OAuth
summary: Sử dụng Qwen Cloud thông qua Plugin OpenClaw của Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:06:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw hiện coi Qwen là một Plugin nhà cung cấp hạng nhất với id chính thức
`qwen`. Plugin nhà cung cấp này nhắm đến các điểm cuối Qwen Cloud / Alibaba DashScope và
Coding Plan, giữ cho các id `modelstudio` cũ tiếp tục hoạt động dưới dạng bí danh tương thích,
và cũng cung cấp luồng mã thông báo Qwen Portal dưới nhà cung cấp `qwen-oauth`.

- Nhà cung cấp: `qwen`
- Nhà cung cấp Portal: [`qwen-oauth`](/vi/providers/qwen-oauth)
- Biến môi trường ưu tiên: `QWEN_API_KEY`
- Cũng được chấp nhận để tương thích: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Kiểu API: tương thích với OpenAI

<Tip>
Nếu bạn muốn dùng `qwen3.6-plus`, hãy ưu tiên điểm cuối **Tiêu chuẩn (trả theo mức sử dụng)**.
Hỗ trợ Coding Plan có thể chậm hơn danh mục công khai.
</Tip>

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Bắt đầu

Chọn loại gói của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Phù hợp nhất cho:** quyền truy cập theo gói đăng ký thông qua Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Với điểm cuối **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Với điểm cuối **Trung Quốc**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Các id lựa chọn xác thực `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...` vẫn
    hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên các id
    lựa chọn xác thực chính thức `qwen-*` và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa một mục
    `models.providers.modelstudio` tùy chỉnh chính xác với một giá trị `api` khác, thì
    nhà cung cấp tùy chỉnh đó sở hữu các tham chiếu `modelstudio/...` thay vì bí danh tương thích
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Phù hợp nhất cho:** quyền truy cập trả theo mức sử dụng thông qua điểm cuối Standard Model Studio, bao gồm các mô hình như `qwen3.6-plus` có thể chưa có trên Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Với điểm cuối **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Với điểm cuối **Trung Quốc**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Các id lựa chọn xác thực `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...` vẫn
    hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên các id
    lựa chọn xác thực chính thức `qwen-*` và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa một mục
    `models.providers.modelstudio` tùy chỉnh chính xác với một giá trị `api` khác, thì
    nhà cung cấp tùy chỉnh đó sở hữu các tham chiếu `modelstudio/...` thay vì bí danh tương thích
    Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Phù hợp nhất cho:** mã thông báo Qwen Portal dùng với `https://portal.qwen.ai/v1`.

    Xem [Qwen OAuth / Portal](/vi/providers/qwen-oauth) để biết trang nhà cung cấp chuyên biệt
    và ghi chú di chuyển.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` dùng cùng tên biến môi trường `QWEN_API_KEY` như nhà cung cấp
    DashScope, nhưng lưu xác thực dưới id nhà cung cấp `qwen-oauth` khi được cấu hình
    thông qua quy trình giới thiệu của OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Loại gói và điểm cuối

| Gói                        | Khu vực | Lựa chọn xác thực         | Điểm cuối                                        |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Tiêu chuẩn (trả theo mức sử dụng) | Trung Quốc | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Tiêu chuẩn (trả theo mức sử dụng) | Toàn cầu | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (gói đăng ký) | Trung Quốc | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (gói đăng ký) | Toàn cầu | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Toàn cầu | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Nhà cung cấp tự động chọn điểm cuối dựa trên lựa chọn xác thực của bạn. Các
lựa chọn chính thức dùng họ `qwen-*`; `modelstudio-*` chỉ còn dành cho tương thích.
Bạn có thể ghi đè bằng `baseUrl` tùy chỉnh trong cấu hình.

<Tip>
**Quản lý khóa:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Tài liệu:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Danh mục tích hợp sẵn

OpenClaw hiện phát hành danh mục tĩnh Qwen này. Danh mục được cấu hình có
nhận biết điểm cuối: cấu hình Coding Plan bỏ qua các mô hình chỉ được biết là hoạt động trên
điểm cuối Tiêu chuẩn.

| Tham chiếu mô hình          | Đầu vào     | Ngữ cảnh  | Ghi chú                                            |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | văn bản, hình ảnh | 1,000,000 | Mô hình mặc định                                   |
| `qwen/qwen3.6-plus`         | văn bản, hình ảnh | 1,000,000 | Ưu tiên điểm cuối Tiêu chuẩn khi bạn cần mô hình này |
| `qwen/qwen3-max-2026-01-23` | văn bản     | 262,144   | Dòng Qwen Max                                      |
| `qwen/qwen3-coder-next`     | văn bản     | 262,144   | Lập trình                                          |
| `qwen/qwen3-coder-plus`     | văn bản     | 1,000,000 | Lập trình                                          |
| `qwen/MiniMax-M2.5`         | văn bản     | 1,000,000 | Đã bật suy luận                                    |
| `qwen/glm-5`                | văn bản     | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | văn bản     | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | văn bản, hình ảnh | 262,144   | Moonshot AI qua Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | văn bản, hình ảnh | 1,000,000 | Mặc định của Qwen Portal                           |

<Note>
Tính khả dụng vẫn có thể thay đổi theo điểm cuối và gói thanh toán ngay cả khi một mô hình
có mặt trong danh mục tĩnh.
</Note>

## Điều khiển suy luận

Với các mô hình Qwen Cloud hỗ trợ suy luận, nhà cung cấp ánh xạ các mức
suy luận của OpenClaw sang cờ yêu cầu cấp cao nhất `enable_thinking` của DashScope. Khi tắt
suy luận, gửi `enable_thinking: false`; các mức suy luận khác gửi
`enable_thinking: true`.

## Tiện ích đa phương thức bổ sung

Plugin `qwen` cũng cung cấp khả năng đa phương thức trên các điểm cuối DashScope **Tiêu chuẩn**
(không phải các điểm cuối Coding Plan):

- **Hiểu video** qua `qwen-vl-max-latest`
- **Tạo video Wan** qua `wan2.6-t2v` (mặc định), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Để dùng Qwen làm nhà cung cấp video mặc định:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi chuyển dự phòng.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Plugin Qwen đăng ký khả năng hiểu phương tiện cho hình ảnh và video
    trên các điểm cuối DashScope **Tiêu chuẩn** (không phải các điểm cuối Coding Plan).

    | Thuộc tính    | Giá trị               |
    | ------------- | --------------------- |
    | Mô hình       | `qwen-vl-max-latest`  |
    | Đầu vào được hỗ trợ | Hình ảnh, video       |

    Khả năng hiểu phương tiện được tự động phân giải từ xác thực Qwen đã cấu hình — không
    cần cấu hình bổ sung. Hãy đảm bảo bạn đang dùng điểm cuối Tiêu chuẩn (trả theo mức sử dụng)
    để được hỗ trợ hiểu phương tiện.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` có sẵn trên các điểm cuối Standard (pay-as-you-go) Model Studio:

    - Trung Quốc: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Toàn cầu: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Nếu các điểm cuối Coding Plan trả về lỗi "unsupported model" cho
    `qwen3.6-plus`, hãy chuyển sang Tiêu chuẩn (trả theo mức sử dụng) thay vì cặp
    điểm cuối/khóa Coding Plan.

    Danh mục tĩnh Qwen của OpenClaw không quảng bá `qwen3.6-plus` trên các điểm cuối Coding
    Plan, nhưng các mục `qwen/qwen3.6-plus` được cấu hình rõ ràng trong
    `models.providers.qwen.models` vẫn được tôn trọng trên các baseUrl Coding Plan để bạn
    có thể chọn dùng mô hình đó nếu Aliyun bật nó trên gói đăng ký của bạn. API
    thượng nguồn vẫn quyết định liệu lệnh gọi có thành công hay không.

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` đang được định vị làm nơi quản lý của nhà cung cấp cho toàn bộ bề mặt
    Qwen Cloud, không chỉ các mô hình lập trình/văn bản.

    - **Mô hình văn bản/chat:** có sẵn thông qua Plugin
    - **Gọi công cụ, đầu ra có cấu trúc, suy luận:** kế thừa từ lớp truyền tải tương thích OpenAI
    - **Tạo hình ảnh:** được lên kế hoạch ở lớp Plugin nhà cung cấp
    - **Hiểu hình ảnh/video:** có sẵn thông qua Plugin trên điểm cuối Tiêu chuẩn
    - **Giọng nói/âm thanh:** được lên kế hoạch ở lớp Plugin nhà cung cấp
    - **Embedding/reranking bộ nhớ:** được lên kế hoạch thông qua bề mặt bộ chuyển đổi embedding
    - **Tạo video:** có sẵn thông qua Plugin qua khả năng tạo video dùng chung

  </Accordion>

  <Accordion title="Video generation details">
    Với tạo video, OpenClaw ánh xạ khu vực Qwen đã cấu hình sang máy chủ
    DashScope AIGC tương ứng trước khi gửi tác vụ:

    - Toàn cầu/Quốc tế: `https://dashscope-intl.aliyuncs.com`
    - Trung Quốc: `https://dashscope.aliyuncs.com`

    Điều đó có nghĩa là một `models.providers.qwen.baseUrl` thông thường trỏ đến một trong hai
    máy chủ Qwen Coding Plan hoặc Tiêu chuẩn vẫn giữ việc tạo video trên đúng
    điểm cuối video DashScope theo khu vực.

    Các giới hạn tạo video Qwen hiện tại:

    - Tối đa **1** video đầu ra cho mỗi yêu cầu
    - Tối đa **1** hình ảnh đầu vào
    - Tối đa **4** video đầu vào
    - Thời lượng tối đa **10 giây**
    - Hỗ trợ `size`, `aspectRatio`, `resolution`, `audio` và `watermark`
    - Chế độ hình ảnh/video tham chiếu hiện yêu cầu **URL http(s) từ xa**. Đường dẫn
      tệp cục bộ bị từ chối ngay từ đầu vì điểm cuối video DashScope không
      chấp nhận bộ đệm cục bộ đã tải lên cho các tham chiếu đó.

  </Accordion>

  <Accordion title="Khả năng tương thích thông tin sử dụng khi streaming">
    Các điểm cuối Model Studio gốc quảng bá khả năng tương thích thông tin sử dụng khi streaming trên
    cơ chế truyền tải `openai-completions` dùng chung. OpenClaw hiện dựa vào
    khả năng của điểm cuối cho việc đó, vì vậy các id nhà cung cấp tùy chỉnh tương thích với DashScope nhắm tới
    cùng các máy chủ gốc sẽ kế thừa cùng hành vi thông tin sử dụng khi streaming thay vì
    yêu cầu riêng id nhà cung cấp `qwen` tích hợp sẵn.

    Khả năng tương thích thông tin sử dụng native-streaming áp dụng cho cả các máy chủ Coding Plan và
    các máy chủ Standard tương thích với DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Khu vực điểm cuối đa phương thức">
    Các bề mặt đa phương thức (hiểu video và tạo video Wan) sử dụng các
    điểm cuối DashScope **Standard**, không phải các điểm cuối Coding Plan:

    - URL cơ sở Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL cơ sở Standard Trung Quốc: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Thiết lập môi trường và daemon">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `QWEN_API_KEY`
    có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/vi/providers/alibaba" icon="cloud">
    Nhà cung cấp ModelStudio cũ và ghi chú di chuyển.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
