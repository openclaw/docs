---
read_when:
    - Bạn muốn sử dụng các quy trình làm việc ComfyUI cục bộ với OpenClaw
    - Bạn muốn sử dụng Comfy Cloud với các quy trình làm việc về hình ảnh, video hoặc âm nhạc
    - Bạn cần các khóa cấu hình của Plugin comfy đi kèm
summary: Thiết lập quy trình tạo hình ảnh, video và âm nhạc bằng ComfyUI trong OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T08:17:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw cung cấp kèm Plugin `comfy` để chạy ComfyUI theo quy trình công việc. Plugin
hoàn toàn vận hành theo quy trình công việc: OpenClaw không ánh xạ các tùy chọn chung như `size`,
`aspectRatio`, `resolution`, `durationSeconds` hoặc các tùy chọn kiểu TTS vào
đồ thị của bạn.

| Thuộc tính       | Chi tiết                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Nhà cung cấp     | `comfy`                                                                                    |
| Mô hình          | `comfy/workflow`                                                                           |
| Công cụ dùng chung | `image_generate`, `video_generate`, `music_generate`                                     |
| Xác thực         | Không cần cho ComfyUI cục bộ; `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` cho Comfy Cloud   |
| API              | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                             |

## Các tính năng được hỗ trợ

- Tạo và chỉnh sửa hình ảnh từ JSON quy trình công việc (chỉnh sửa nhận 1 hình ảnh tham chiếu đã tải lên)
- Tạo video từ JSON quy trình công việc, chuyển văn bản thành video hoặc hình ảnh thành video (1 hình ảnh tham chiếu)
- Tạo nhạc/âm thanh thông qua công cụ dùng chung `music_generate`, với 1 hình ảnh tham chiếu tùy chọn
- Tải xuống đầu ra từ Node đã cấu hình hoặc từ tất cả Node đầu ra phù hợp khi không có Node nào được cấu hình

## Bắt đầu

Chọn chạy ComfyUI trên máy của riêng bạn hoặc sử dụng Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Phù hợp nhất cho:** chạy phiên bản ComfyUI của riêng bạn trên máy hoặc mạng LAN.

    <Steps>
      <Step title="Start ComfyUI locally">
        Đảm bảo phiên bản ComfyUI cục bộ của bạn đang chạy (mặc định tại `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare your workflow JSON">
        Xuất hoặc tạo tệp JSON quy trình công việc ComfyUI. Ghi lại ID Node của Node đầu vào lời nhắc và Node đầu ra mà bạn muốn OpenClaw đọc.
      </Step>
      <Step title="Configure the provider">
        Đặt `mode: "local"` và trỏ đến tệp quy trình công việc của bạn. Ví dụ hình ảnh tối thiểu:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Set the default model">
        Trỏ OpenClaw đến mô hình `comfy/workflow` cho khả năng bạn đã cấu hình:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Phù hợp nhất cho:** chạy quy trình công việc trên Comfy Cloud mà không cần quản lý tài nguyên GPU cục bộ.

    <Steps>
      <Step title="Get an API key">
        Đăng ký tại [comfy.org](https://comfy.org) và tạo khóa API từ bảng điều khiển tài khoản của bạn.
      </Step>
      <Step title="Set the API key">
        Cung cấp khóa của bạn bằng bất kỳ phương thức nào sau đây:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare your workflow JSON">
        Xuất hoặc tạo tệp JSON quy trình công việc ComfyUI. Ghi lại ID Node của Node đầu vào lời nhắc và Node đầu ra.
      </Step>
      <Step title="Configure the provider">
        Đặt `mode: "cloud"` và trỏ đến tệp quy trình công việc của bạn:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Chế độ đám mây mặc định đặt `baseUrl` thành `https://cloud.comfy.org`. Chỉ đặt `baseUrl` khi sử dụng điểm cuối đám mây tùy chỉnh.
        </Tip>
      </Step>
      <Step title="Set the default model">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cấu hình

Comfy hỗ trợ các thiết lập kết nối cấp cao nhất dùng chung cùng với các phần quy trình công việc riêng cho từng khả năng (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Các khóa dùng chung

| Khóa                  | Kiểu                   | Mô tả                                                                                           |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` hoặc `"cloud"` | Chế độ kết nối. Mặc định là `"local"`.                                                        |
| `baseUrl`             | chuỗi                  | Mặc định là `http://127.0.0.1:8188` cho cục bộ hoặc `https://cloud.comfy.org` cho đám mây.      |
| `apiKey`              | chuỗi                  | Khóa nội tuyến tùy chọn, thay thế cho các biến môi trường `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Cho phép `baseUrl` riêng tư/LAN trong chế độ đám mây hoặc FQDN DNS riêng cục bộ.                 |

<Note>
Trong chế độ `local`, các địa chỉ IP dạng literal thuộc local loopback/riêng tư và tên dịch vụ một nhãn như `http://comfyui:8188` hoạt động mà không cần `allowPrivateNetwork`. Các FQDN DNS riêng có hình thức công khai như `https://comfy.local.example.com` yêu cầu `allowPrivateNetwork: true`. Mức tin cậy dành cho nguồn riêng tư chỉ giới hạn trong giao thức, tên máy chủ và cổng đã cấu hình; chuyển hướng cục bộ không thể rời khỏi tên máy chủ đã cấu hình, còn các chuyển hướng đám mây đến CDN công khai được kiểm tra bằng chính sách SSRF mặc định.
</Note>

### Các khóa theo từng khả năng

Các khóa này áp dụng bên trong các phần `image`, `video` hoặc `music`:

| Khóa                          | Bắt buộc | Mặc định | Mô tả                                                                            |
| ---------------------------- | -------- | -------- | -------------------------------------------------------------------------------- |
| `workflow` hoặc `workflowPath` | Có     | --       | JSON quy trình công việc nội tuyến hoặc đường dẫn đến tệp JSON quy trình công việc ComfyUI. |
| `promptNodeId`               | Có       | --       | ID Node nhận lời nhắc văn bản.                                                   |
| `promptInputName`            | Không    | `"text"` | Tên đầu vào trên Node lời nhắc.                                                  |
| `outputNodeId`               | Không    | --       | ID Node dùng để đọc đầu ra. Nếu bỏ qua, tất cả Node đầu ra phù hợp đều được sử dụng. |
| `pollIntervalMs`             | Không    | `1500`   | Khoảng thời gian thăm dò tính bằng mili giây để kiểm tra công việc hoàn tất.      |
| `timeoutMs`                  | Không    | `300000` | Thời gian chờ tính bằng mili giây cho lần chạy quy trình công việc.               |

Các phần `image` và `video` cũng hỗ trợ Node đầu vào hình ảnh tham chiếu:

| Khóa                  | Bắt buộc                              | Mặc định | Mô tả                                               |
| --------------------- | ------------------------------------- | -------- | --------------------------------------------------- |
| `inputImageNodeId`    | Có (khi truyền hình ảnh tham chiếu)   | --       | ID Node nhận hình ảnh tham chiếu đã tải lên.        |
| `inputImageInputName` | Không                                 | `"image"` | Tên đầu vào trên Node hình ảnh.                    |

`apiKey` chấp nhận chuỗi literal hoặc đối tượng [tham chiếu bí mật](/vi/gateway/configuration-reference#secrets).

## Chi tiết quy trình công việc

<AccordionGroup>
  <Accordion title="Image workflows">
    Đặt mô hình hình ảnh mặc định thành `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Ví dụ chỉnh sửa bằng hình ảnh tham chiếu:**

    Để bật tính năng chỉnh sửa hình ảnh bằng hình ảnh tham chiếu đã tải lên, hãy thêm `inputImageNodeId` vào cấu hình hình ảnh của bạn:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
    Đặt mô hình video mặc định thành `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Các quy trình công việc video của Comfy hỗ trợ chuyển văn bản thành video và hình ảnh thành video thông qua đồ thị đã cấu hình.

    <Note>
    OpenClaw không truyền video đầu vào vào các quy trình công việc Comfy. Chỉ hỗ trợ lời nhắc văn bản và một hình ảnh tham chiếu làm đầu vào.
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    Plugin đi kèm đăng ký một nhà cung cấp tạo nhạc cho đầu ra âm thanh hoặc nhạc được xác định bởi quy trình công việc, được cung cấp thông qua công cụ dùng chung `music_generate`. Công cụ này chấp nhận một hình ảnh tham chiếu tùy chọn (tối đa 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Sử dụng phần cấu hình `music` để trỏ đến JSON quy trình công việc âm thanh và Node đầu ra của bạn.

  </Accordion>

  <Accordion title="Backward compatibility">
    Cấu hình hình ảnh cấp cao nhất hiện có (không có phần `image` lồng nhau) vẫn hoạt động:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw coi cấu trúc cũ đó là cấu hình quy trình công việc hình ảnh. Bạn không cần di chuyển ngay lập tức, nhưng các phần `image` / `video` / `music` lồng nhau được khuyến nghị cho các thiết lập mới. Nếu bạn chỉ sử dụng tính năng tạo hình ảnh, cấu hình phẳng cũ và phần `image` lồng nhau mới tương đương nhau về chức năng.

  </Accordion>

  <Accordion title="Live tests">
    Có phạm vi kiểm thử trực tiếp tùy chọn cho Plugin đi kèm:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Bài kiểm thử trực tiếp sẽ bỏ qua từng trường hợp hình ảnh, video hoặc âm nhạc, trừ khi phần quy trình làm việc Comfy tương ứng đã được cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Cấu hình và cách sử dụng công cụ tạo hình ảnh.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Cấu hình và cách sử dụng công cụ tạo video.
  </Card>
  <Card title="Tạo âm nhạc" href="/vi/tools/music-generation" icon="music">
    Thiết lập công cụ tạo âm nhạc và âm thanh.
  </Card>
  <Card title="Danh mục nhà cung cấp" href="/vi/providers/index" icon="layers">
    Tổng quan về tất cả nhà cung cấp và tham chiếu mô hình.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm các giá trị mặc định của tác tử.
  </Card>
</CardGroup>
