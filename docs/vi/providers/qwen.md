---
read_when:
    - Bạn muốn sử dụng Qwen với OpenClaw
    - Bạn có gói đăng ký Alibaba Cloud Token Plan
    - Trước đây bạn đã sử dụng Qwen OAuth
summary: Sử dụng Qwen Cloud thông qua plugin OpenClaw của dịch vụ này
title: Qwen
x-i18n:
    generated_at: "2026-07-12T08:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud là Plugin nhà cung cấp OpenClaw bên ngoài chính thức với id chuẩn `qwen`. Plugin này nhắm đến các điểm cuối Qwen Cloud / Alibaba DashScope Standard và Coding Plan, cung cấp Token Plan dưới dạng `qwen-token-plan`, giữ `modelstudio` làm bí danh tương thích, sở hữu độc lập id nhà cung cấp tùy chỉnh `bailian-token-plan` được Alibaba ghi nhận trong tài liệu và cung cấp luồng token Qwen Portal dưới dạng [`qwen-oauth`](/vi/providers/qwen-oauth).

| Thuộc tính                       | Giá trị                                    |
| -------------------------------- | ------------------------------------------ |
| Nhà cung cấp                     | `qwen`                                     |
| Nhà cung cấp Token Plan          | `qwen-token-plan`                          |
| Nhà cung cấp Portal              | [`qwen-oauth`](/vi/providers/qwen-oauth)      |
| Biến môi trường ưu tiên          | `QWEN_API_KEY`                             |
| Biến môi trường Token Plan       | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Cũng được chấp nhận (tương thích) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Kiểu API                         | Tương thích OpenAI                         |

<Tip>
`qwen3.7-plus` và `qwen3.6-plus` hoạt động với các điểm cuối Coding Plan và Standard.
Đối với `qwen3.7-max` hoặc `qwen3.6-flash`, hãy sử dụng điểm cuối **Standard (trả phí theo mức sử dụng)**.
</Tip>

## Cài đặt Plugin

`qwen` được phân phối dưới dạng Plugin bên ngoài chính thức, không được đóng gói kèm lõi. Hãy cài đặt Plugin và khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Bắt đầu

Chọn loại gói của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Coding Plan (gói đăng ký)">
    **Phù hợp nhất cho:** quyền truy cập dựa trên gói đăng ký thông qua Qwen Coding Plan.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        Đối với điểm cuối **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Đối với điểm cuối **Trung Quốc**:

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
    Các id lựa chọn xác thực `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...`
    vẫn hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên
    id lựa chọn xác thực `qwen-*` chuẩn và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa
    chính xác một mục tùy chỉnh `models.providers.modelstudio` với giá trị `api` khác,
    nhà cung cấp tùy chỉnh đó sẽ sở hữu các tham chiếu `modelstudio/...` thay vì bí danh
    tương thích Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (trả phí theo mức sử dụng)">
    **Phù hợp nhất cho:** quyền truy cập trả phí theo mức sử dụng thông qua điểm cuối Standard Model Studio, bao gồm `qwen3.7-max` và `qwen3.6-flash`, vốn không có trong Coding Plan.

    <Steps>
      <Step title="Lấy khóa API">
        Tạo hoặc sao chép khóa API từ [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        Đối với điểm cuối **Toàn cầu**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Đối với điểm cuối **Trung Quốc**:

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
    Các id lựa chọn xác thực `modelstudio-*` cũ và tham chiếu mô hình `modelstudio/...`
    vẫn hoạt động dưới dạng bí danh tương thích, nhưng các luồng thiết lập mới nên ưu tiên
    id lựa chọn xác thực `qwen-*` chuẩn và tham chiếu mô hình `qwen/...`. Nếu bạn định nghĩa
    chính xác một mục tùy chỉnh `models.providers.modelstudio` với giá trị `api` khác,
    nhà cung cấp tùy chỉnh đó sẽ sở hữu các tham chiếu `modelstudio/...` thay vì bí danh
    tương thích Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (Phiên bản dành cho nhóm)">
    **Phù hợp nhất cho:** quyền truy cập bằng gói đăng ký nhóm dựa trên tín dụng vào Qwen và các mô hình bên thứ ba được hỗ trợ thông qua Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Lấy khóa chuyên dụng">
        Chỉ định một suất Token Plan và tạo khóa `sk-sp-...` chuyên dụng cho suất đó. Khóa Token Plan, Coding Plan và khóa trả phí theo mức sử dụng không thể dùng thay thế cho nhau. Xem [tổng quan Token Plan Toàn cầu](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) hoặc [tổng quan Token Plan Trung Quốc](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu">
        Đối với điểm cuối **Toàn cầu / Quốc tế** tại Singapore:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Đối với điểm cuối **Trung Quốc** tại Bắc Kinh:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Xác minh nhà cung cấp">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Hướng dẫn OpenClaw của Alibaba sử dụng `bailian-token-plan` cho một nhà cung cấp
    tùy chỉnh thủ công. Plugin đăng ký id đó với vai trò chủ sở hữu tương thích, nhưng
    cấu hình mới nên sử dụng `qwen-token-plan`. Một mục tùy chỉnh chính xác
    `models.providers.bailian-token-plan` vẫn giữ quyền sở hữu phương thức truyền tải
    và danh mục đã cấu hình; mục này không bao giờ được hợp nhất vào danh mục OpenAI chuẩn.
    </Note>

    <Warning>
    Chỉ sử dụng Token Plan cho các phiên OpenClaw tương tác. Không chọn gói này cho
    tác vụ Cron, tập lệnh không có người giám sát hoặc phần phụ trợ ứng dụng. Alibaba cho biết
    việc sử dụng không tương tác có thể khiến gói đăng ký bị đình chỉ hoặc khóa API bị thu hồi.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Phù hợp nhất cho:** token Qwen Portal dùng với `https://portal.qwen.ai/v1`.

    Xem [Qwen OAuth / Portal](/vi/providers/qwen-oauth) để biết trang dành riêng cho nhà cung cấp
    và các ghi chú di chuyển.

    <Steps>
      <Step title="Cung cấp token Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` sử dụng cùng tên biến môi trường `QWEN_API_KEY` với nhà cung cấp
    Qwen Cloud, nhưng lưu thông tin xác thực dưới id nhà cung cấp `qwen-oauth` khi được
    cấu hình thông qua quy trình thiết lập ban đầu của OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Các loại gói và điểm cuối

| Gói                         | Khu vực    | Lựa chọn xác thực          | Điểm cuối                                                        |
| --------------------------- | ---------- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (gói đăng ký)   | Trung Quốc | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (gói đăng ký)   | Toàn cầu   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                 | Toàn cầu   | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (trả phí theo mức sử dụng) | Trung Quốc | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (trả phí theo mức sử dụng) | Toàn cầu   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Phiên bản dành cho nhóm) | Trung Quốc | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Phiên bản dành cho nhóm) | Toàn cầu   | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Nhà cung cấp tự động chọn điểm cuối dựa trên lựa chọn xác thực của bạn. Các lựa chọn
chuẩn sử dụng họ `qwen-*`; `modelstudio-*` chỉ được giữ lại để tương thích.
Ghi đè bằng `baseUrl` tùy chỉnh trong cấu hình.

<Tip>
**Quản lý khóa:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Tài liệu:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Danh mục tích hợp sẵn

OpenClaw phân phối danh mục Qwen tĩnh này. Danh mục nhận biết điểm cuối: các cấu hình
Coding Plan sẽ bỏ qua những mô hình chỉ hoạt động trên điểm cuối Standard.

| Tham chiếu mô hình           | Đầu vào       | Ngữ cảnh  | Ghi chú                              |
| ---------------------------- | ------------- | --------- | ------------------------------------ |
| `qwen/qwen3.5-plus`          | văn bản, hình ảnh | 1,000,000 | Mô hình mặc định                     |
| `qwen/qwen3.6-flash`         | văn bản, hình ảnh | 1,000,000 | Chỉ các điểm cuối Standard           |
| `qwen/qwen3.6-plus`          | văn bản, hình ảnh | 1,000,000 | Coding Plan + Standard               |
| `qwen/qwen3.7-max`           | văn bản       | 1,000,000 | Chỉ các điểm cuối Standard           |
| `qwen/qwen3.7-plus`          | văn bản, hình ảnh | 1,000,000 | Coding Plan + Standard               |
| `qwen/qwen3-max-2026-01-23`  | văn bản       | 262,144   | Dòng Qwen Max                        |
| `qwen/qwen3-coder-next`      | văn bản       | 262,144   | Lập trình                            |
| `qwen/qwen3-coder-plus`      | văn bản       | 1,000,000 | Lập trình                            |
| `qwen/MiniMax-M2.5`          | văn bản       | 1,000,000 | Đã bật suy luận                      |
| `qwen/glm-5`                 | văn bản       | 202,752   | GLM                                  |
| `qwen/glm-4.7`               | văn bản       | 202,752   | GLM                                  |
| `qwen/kimi-k2.5`             | văn bản, hình ảnh | 262,144   | Moonshot AI thông qua Alibaba        |
| `qwen-oauth/qwen3.5-plus`    | văn bản, hình ảnh | 1,000,000 | Mặc định của Qwen Portal             |

<Note>
Tính khả dụng vẫn có thể khác nhau tùy theo điểm cuối và gói thanh toán, ngay cả khi
một mô hình có trong danh mục tĩnh.
</Note>

### Danh mục Token Plan

Token Plan sử dụng một danh sách cho phép riêng biệt, khớp chính xác theo chuỗi. Các mô hình
của gói chỉ dành cho tạo hình ảnh không được đưa vào đây vì chúng sử dụng API khác.

| Tham chiếu mô hình                   | Đầu vào       | Ngữ cảnh  |
| ------------------------------------ | ------------- | --------- |
| `qwen-token-plan/qwen3.7-max`        | văn bản       | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`       | văn bản, hình ảnh | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`       | văn bản, hình ảnh | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`      | văn bản, hình ảnh | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`    | văn bản       | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`  | văn bản       | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`      | văn bản       | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`     | văn bản, hình ảnh | 262,144   |
| `qwen-token-plan/kimi-k2.6`          | văn bản, hình ảnh | 262,144   |
| `qwen-token-plan/kimi-k2.5`          | văn bản, hình ảnh | 262,144   |
| `qwen-token-plan/glm-5.2`            | văn bản       | 1,000,000 |
| `qwen-token-plan/glm-5.1`            | văn bản       | 202,752   |
| `qwen-token-plan/glm-5`              | văn bản       | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`       | văn bản       | 196,608   |

## Các tùy chọn kiểm soát suy luận

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` và `qwen3.6-plus` được
bật khả năng suy luận trong danh mục tích hợp sẵn. Đối với các mô hình suy luận thuộc
họ `qwen`, nhà cung cấp ánh xạ các mức độ tư duy của OpenClaw sang cờ yêu cầu cấp cao nhất
`enable_thinking` của DashScope: khi tắt tư duy, hệ thống gửi `enable_thinking: false`;
với mọi mức độ khác, hệ thống gửi `enable_thinking: true`. Các mô hình tùy chỉnh có thể chọn dùng
tải trọng tư duy theo mẫu trò chuyện thay thế bằng cách đặt
`compat.thinkingFormat: "qwen-chat-template"` trong mục nhập của mô hình.

Các mô hình Token Plan cũng được đánh dấu là có khả năng suy luận. `kimi-k2.7-code` và
`MiniMax-M2.5` chỉ hoạt động khi bật tư duy, vì vậy OpenClaw vẫn bật tư duy ngay cả khi
phiên yêu cầu `/think off`. DeepSeek V4 ánh xạ các mức từ `minimal` đến `high` thành
mức nỗ lực `high` của dịch vụ và ánh xạ `xhigh` hoặc `max` thành `max`. GLM 5.2 chấp nhận
toàn bộ dải từ `minimal` đến `max`; GLM 5.1 và GLM 5 chấp nhận đến
`xhigh`, và cả ba đều mặc định là `high`. Các mô hình lai khác tuân theo
trạng thái bật/tắt được yêu cầu.

## Tiện ích bổ sung đa phương thức

Plugin `qwen` chỉ cung cấp các khả năng đa phương thức trên các điểm cuối DashScope
**Standard**, không cung cấp trên các điểm cuối Coding Plan:

- **Hiểu hình ảnh và video** qua `qwen-vl-max-latest`
- **Tạo video bằng Wan** qua `wan2.6-t2v` (mặc định), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Khả năng hiểu nội dung đa phương tiện được tự động phân giải từ thông tin xác thực Qwen đã cấu hình;
không cần cấu hình bổ sung. Hãy đảm bảo bạn đang sử dụng điểm cuối Standard (trả phí theo mức dùng)
để khả năng hiểu nội dung đa phương tiện hoạt động.

Để đặt Qwen làm nhà cung cấp video mặc định:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Giới hạn tạo video: mỗi yêu cầu tạo 1 video đầu ra, tối đa 1 hình ảnh đầu vào
(chuyển hình ảnh thành video), tối đa 4 video đầu vào (chuyển video thành video), thời lượng
tối đa 10 giây. Hỗ trợ `size`, `aspectRatio`, `resolution`, `audio` và
`watermark`. Đầu vào hình ảnh/video tham chiếu yêu cầu URL http(s) từ xa; đường dẫn
tệp cục bộ bị từ chối ngay từ đầu vì điểm cuối video DashScope không
chấp nhận bộ đệm cục bộ được tải lên cho các nội dung tham chiếu đó.

<Note>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung, cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tính khả dụng của Qwen 3.6 và 3.7">
    `qwen3.7-plus` và `qwen3.6-plus` có trên các điểm cuối Coding Plan và Standard. `qwen3.7-max` và `qwen3.6-flash` chỉ có trên Standard. Các điểm cuối Standard (trả phí theo mức dùng) là:

    - Trung Quốc: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Toàn cầu: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw loại `qwen3.7-max` và `qwen3.6-flash` khỏi các danh mục Coding Plan.
    Nếu điểm cuối Coding Plan trả về lỗi "mô hình không được hỗ trợ" cho một trong hai mô hình,
    hãy chuyển sang điểm cuối Standard và khóa tương ứng.

  </Accordion>

  <Accordion title="Định tuyến khu vực cho việc tạo video">
    OpenClaw ánh xạ khu vực Qwen đã cấu hình sang máy chủ DashScope AIGC tương ứng
    trước khi gửi tác vụ video:

    - Toàn cầu/Quốc tế: `https://dashscope-intl.aliyuncs.com`
    - Trung Quốc: `https://dashscope.aliyuncs.com`

    Một `models.providers.qwen.baseUrl` thông thường trỏ đến máy chủ Qwen của Coding Plan
    hoặc Standard vẫn định tuyến việc tạo video đến điểm cuối video DashScope
    tương ứng với khu vực.

  </Accordion>

  <Accordion title="Khả năng tương thích với mức sử dụng khi truyền phát">
    Các điểm cuối Qwen gốc công bố khả năng tương thích với thông tin mức sử dụng khi truyền phát trên
    phương thức truyền tải `openai-completions` dùng chung, vì vậy các mã định danh nhà cung cấp tùy chỉnh
    tương thích với DashScope và nhắm đến cùng các máy chủ gốc sẽ kế thừa hành vi tương tự mà không cần
    sử dụng riêng mã định danh nhà cung cấp tích hợp sẵn `qwen`. Điều này áp dụng cho các điểm cuối Coding Plan,
    Standard và Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Kế hoạch năng lực">
    Plugin `qwen` đang được định vị là nơi tập trung của nhà cung cấp cho toàn bộ
    bề mặt Qwen Cloud, không chỉ các mô hình lập trình/văn bản.

    - **Mô hình văn bản/trò chuyện:** khả dụng qua Plugin
    - **Gọi công cụ, đầu ra có cấu trúc, tư duy:** kế thừa từ phương thức truyền tải tương thích với OpenAI
    - **Tạo hình ảnh:** được lên kế hoạch ở lớp Plugin của nhà cung cấp
    - **Hiểu hình ảnh/video:** khả dụng qua Plugin trên điểm cuối Standard
    - **Giọng nói/âm thanh:** được lên kế hoạch ở lớp Plugin của nhà cung cấp
    - **Embedding/tái xếp hạng bộ nhớ:** được lên kế hoạch qua bề mặt bộ điều hợp embedding
    - **Tạo video:** khả dụng qua Plugin thông qua khả năng tạo video dùng chung

  </Accordion>

  <Accordion title="Thiết lập môi trường và tiến trình nền">
    Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy đảm bảo `QWEN_API_KEY`
    hoặc `QWEN_TOKEN_PLAN_API_KEY` khả dụng cho tiến trình đó (ví dụ: trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Alibaba Model Studio" href="/vi/providers/alibaba" icon="cloud">
    Nhà cung cấp tạo video Wan được đóng gói sẵn trên cùng nền tảng DashScope.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Hướng dẫn khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
