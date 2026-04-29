---
read_when:
    - Bạn muốn sử dụng Qwen với OpenClaw
    - Trước đây bạn đã sử dụng Qwen OAuth
summary: Sử dụng Qwen Cloud thông qua nhà cung cấp qwen được tích hợp sẵn của OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-29T23:08:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth đã bị gỡ bỏ.** Tích hợp OAuth tầng miễn phí
(`qwen-portal`) từng dùng các endpoint `portal.qwen.ai` không còn khả dụng.
Xem [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) để biết
bối cảnh.

</Warning>

OpenClaw hiện xem Qwen là một nhà cung cấp tích hợp hạng nhất với id chuẩn
`qwen`. Nhà cung cấp tích hợp này nhắm đến các endpoint Qwen Cloud / Alibaba DashScope và
Coding Plan, đồng thời giữ cho các id `modelstudio` cũ tiếp tục hoạt động dưới dạng
bí danh tương thích.

- Nhà cung cấp: `qwen`
- Biến môi trường ưu tiên: `QWEN_API_KEY`
- Cũng được chấp nhận để tương thích: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Kiểu API: tương thích với OpenAI

<Tip>
Nếu bạn muốn `qwen3.6-plus`, hãy ưu tiên endpoint **Tiêu chuẩn (trả theo mức dùng)**.
Hỗ trợ Coding Plan có thể chậm hơn danh mục công khai.
</Tip>

## Bắt đầu

Chọn loại gói của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Coding Plan (gói đăng ký)">
    **Phù hợp nhất cho:** quyền truy cập dựa trên gói đăng ký thông qua Qwen Coding Plan.

    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Chạy onboarding">
        Đối với endpoint **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Đối với endpoint **Trung Quốc**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Các id auth-choice `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...` vẫn
    hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên
    các id auth-choice chuẩn `qwen-*` và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa một mục
    `models.providers.modelstudio` tùy chỉnh chính xác với một giá trị `api` khác, thì
    nhà cung cấp tùy chỉnh đó sở hữu các tham chiếu `modelstudio/...` thay vì bí danh tương thích
    Qwen.
    </Note>

  </Tab>

  <Tab title="Tiêu chuẩn (trả theo mức dùng)">
    **Phù hợp nhất cho:** quyền truy cập trả theo mức dùng thông qua endpoint Standard Model Studio, bao gồm các mô hình như `qwen3.6-plus` có thể không khả dụng trên Coding Plan.

    <Steps>
      <Step title="Lấy khóa API của bạn">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Chạy onboarding">
        Đối với endpoint **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Đối với endpoint **Trung Quốc**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Các id auth-choice `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...` vẫn
    hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên
    các id auth-choice chuẩn `qwen-*` và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa một mục
    `models.providers.modelstudio` tùy chỉnh chính xác với một giá trị `api` khác, thì
    nhà cung cấp tùy chỉnh đó sở hữu các tham chiếu `modelstudio/...` thay vì bí danh tương thích
    Qwen.
    </Note>

  </Tab>
</Tabs>

## Loại gói và endpoint

| Gói                        | Khu vực | Lựa chọn xác thực        | Endpoint                                         |
| -------------------------- | ------ | ------------------------ | ------------------------------------------------ |
| Tiêu chuẩn (trả theo mức dùng) | Trung Quốc | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Tiêu chuẩn (trả theo mức dùng) | Toàn cầu | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (gói đăng ký) | Trung Quốc | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (gói đăng ký) | Toàn cầu | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Nhà cung cấp tự động chọn endpoint dựa trên lựa chọn xác thực của bạn. Các lựa chọn
chuẩn dùng họ `qwen-*`; `modelstudio-*` chỉ còn để tương thích.
Bạn có thể ghi đè bằng `baseUrl` tùy chỉnh trong cấu hình.

<Tip>
**Quản lý khóa:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Tài liệu:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Danh mục tích hợp sẵn

OpenClaw hiện phát hành kèm danh mục Qwen tích hợp này. Danh mục được cấu hình
nhận biết endpoint: cấu hình Coding Plan bỏ qua các mô hình chỉ được biết là hoạt động trên
endpoint Tiêu chuẩn.

| Tham chiếu mô hình          | Đầu vào     | Ngữ cảnh  | Ghi chú                                            |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | văn bản, hình ảnh | 1,000,000 | Mô hình mặc định                                   |
| `qwen/qwen3.6-plus`         | văn bản, hình ảnh | 1,000,000 | Ưu tiên endpoint Tiêu chuẩn khi bạn cần mô hình này |
| `qwen/qwen3-max-2026-01-23` | văn bản     | 262,144   | Dòng Qwen Max                                      |
| `qwen/qwen3-coder-next`     | văn bản     | 262,144   | Lập trình                                          |
| `qwen/qwen3-coder-plus`     | văn bản     | 1,000,000 | Lập trình                                          |
| `qwen/MiniMax-M2.5`         | văn bản     | 1,000,000 | Đã bật suy luận                                    |
| `qwen/glm-5`                | văn bản     | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | văn bản     | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | văn bản, hình ảnh | 262,144   | Moonshot AI qua Alibaba                            |

<Note>
Tính khả dụng vẫn có thể thay đổi theo endpoint và gói thanh toán ngay cả khi một mô hình
có mặt trong danh mục tích hợp.
</Note>

## Điều khiển Thinking

Đối với các mô hình Qwen Cloud hỗ trợ suy luận, nhà cung cấp tích hợp ánh xạ các mức
thinking của OpenClaw sang cờ yêu cầu cấp cao nhất `enable_thinking` của DashScope. Khi tắt
thinking, hệ thống gửi `enable_thinking: false`; các mức thinking khác gửi
`enable_thinking: true`.

## Tiện ích bổ sung đa phương thức

Plugin `qwen` cũng cung cấp các khả năng đa phương thức trên các endpoint DashScope
**Tiêu chuẩn** (không phải endpoint Coding Plan):

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
  <Accordion title="Hiểu hình ảnh và video">
    Plugin Qwen tích hợp đăng ký khả năng hiểu phương tiện cho hình ảnh và video
    trên các endpoint DashScope **Tiêu chuẩn** (không phải endpoint Coding Plan).

    | Thuộc tính       | Giá trị               |
    | ------------- | --------------------- |
    | Mô hình       | `qwen-vl-max-latest`  |
    | Đầu vào được hỗ trợ | Hình ảnh, video       |

    Khả năng hiểu phương tiện được tự động phân giải từ xác thực Qwen đã cấu hình — không
    cần cấu hình bổ sung. Hãy đảm bảo bạn đang dùng endpoint Tiêu chuẩn (trả theo mức dùng)
    để được hỗ trợ hiểu phương tiện.

  </Accordion>

  <Accordion title="Tính khả dụng của Qwen 3.6 Plus">
    `qwen3.6-plus` khả dụng trên các endpoint Model Studio Tiêu chuẩn (trả theo mức dùng):

    - Trung Quốc: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Toàn cầu: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Nếu endpoint Coding Plan trả về lỗi "unsupported model" cho
    `qwen3.6-plus`, hãy chuyển sang Tiêu chuẩn (trả theo mức dùng) thay vì cặp
    endpoint/khóa Coding Plan.

    Danh mục Qwen tích hợp của OpenClaw không quảng bá `qwen3.6-plus` trên các endpoint
    Coding Plan, nhưng các mục `qwen/qwen3.6-plus` được cấu hình rõ ràng trong
    `models.providers.qwen.models` vẫn được tôn trọng trên các baseUrl Coding Plan để bạn
    có thể chọn dùng mô hình đó nếu Aliyun bật nó cho gói đăng ký của bạn. API
    upstream vẫn quyết định liệu lệnh gọi có thành công hay không.

  </Accordion>

  <Accordion title="Kế hoạch năng lực">
    Plugin `qwen` đang được định vị là nơi chính thức của nhà cung cấp cho toàn bộ bề mặt
    Qwen Cloud, không chỉ các mô hình lập trình/văn bản.

    - **Mô hình văn bản/trò chuyện:** đã tích hợp
    - **Gọi công cụ, đầu ra có cấu trúc, thinking:** kế thừa từ lớp vận chuyển tương thích với OpenAI
    - **Tạo hình ảnh:** được lên kế hoạch ở lớp provider-plugin
    - **Hiểu hình ảnh/video:** đã tích hợp trên endpoint Tiêu chuẩn
    - **Giọng nói/âm thanh:** được lên kế hoạch ở lớp provider-plugin
    - **Embedding/reranking bộ nhớ:** được lên kế hoạch thông qua bề mặt bộ chuyển đổi embedding
    - **Tạo video:** đã tích hợp thông qua năng lực tạo video dùng chung

  </Accordion>

  <Accordion title="Chi tiết tạo video">
    Đối với tạo video, OpenClaw ánh xạ khu vực Qwen đã cấu hình sang máy chủ
    DashScope AIGC tương ứng trước khi gửi tác vụ:

    - Toàn cầu/Intl: `https://dashscope-intl.aliyuncs.com`
    - Trung Quốc: `https://dashscope.aliyuncs.com`

    Điều đó nghĩa là một `models.providers.qwen.baseUrl` thông thường trỏ đến máy chủ
    Qwen Coding Plan hoặc Tiêu chuẩn vẫn giữ tạo video trên đúng
    endpoint video DashScope theo khu vực.

    Giới hạn tạo video Qwen tích hợp hiện tại:

    - Tối đa **1** video đầu ra mỗi yêu cầu
    - Tối đa **1** hình ảnh đầu vào
    - Tối đa **4** video đầu vào
    - Tối đa thời lượng **10 giây**
    - Hỗ trợ `size`, `aspectRatio`, `resolution`, `audio` và `watermark`
    - Chế độ hình ảnh/video tham chiếu hiện yêu cầu **URL http(s) từ xa**. Đường dẫn
      tệp cục bộ bị từ chối ngay từ đầu vì endpoint video DashScope không
      chấp nhận buffer cục bộ đã tải lên cho các tham chiếu đó.

  </Accordion>

  <Accordion title="Tương thích sử dụng streaming">
    Các endpoint Model Studio gốc công bố khả năng tương thích sử dụng streaming trên lớp vận chuyển
    `openai-completions` dùng chung. OpenClaw hiện dựa vào năng lực endpoint để xác định điều đó,
    nên các id nhà cung cấp tùy chỉnh tương thích với DashScope nhắm đến cùng các máy chủ gốc
    kế thừa cùng hành vi streaming-usage thay vì yêu cầu riêng id nhà cung cấp `qwen`
    tích hợp.

    Tương thích sử dụng streaming gốc áp dụng cho cả máy chủ Coding Plan và
    máy chủ tương thích DashScope Tiêu chuẩn:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Khu vực endpoint đa phương thức">
    Các bề mặt đa phương thức (hiểu video và tạo video Wan) dùng các endpoint DashScope
    **Tiêu chuẩn**, không phải endpoint Coding Plan:

    - URL cơ sở Tiêu chuẩn Toàn cầu/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL cơ sở Tiêu chuẩn Trung Quốc: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Thiết lập môi trường và daemon">
    Nếu Gateway chạy dưới dạng daemon (`launchd`/`systemd`), hãy bảo đảm `QWEN_API_KEY`
    khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/vi/providers/alibaba" icon="cloud">
    Nhà cung cấp ModelStudio cũ và ghi chú di chuyển.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và Câu hỏi thường gặp.
  </Card>
</CardGroup>
