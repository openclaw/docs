---
read_when:
    - Bạn muốn sử dụng các quy trình làm việc ComfyUI cục bộ với OpenClaw
    - Bạn muốn sử dụng Comfy Cloud với các quy trình làm việc về hình ảnh, video hoặc âm nhạc
    - Bạn cần các khóa cấu hình của Plugin comfy được tích hợp sẵn
summary: Thiết lập tạo hình ảnh, video và âm nhạc bằng quy trình làm việc ComfyUI trong OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-29T23:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw đi kèm Plugin `comfy` được tích hợp sẵn cho các lần chạy ComfyUI theo quy trình làm việc. Plugin này hoàn toàn dựa trên quy trình làm việc, vì vậy OpenClaw không cố ánh xạ các điều khiển chung như `size`, `aspectRatio`, `resolution`, `durationSeconds`, hoặc kiểu TTS vào đồ thị của bạn.

| Thuộc tính      | Chi tiết                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| Nhà cung cấp    | `comfy`                                                                          |
| Mô hình         | `comfy/workflow`                                                                 |
| Bề mặt dùng chung | `image_generate`, `video_generate`, `music_generate`                             |
| Xác thực        | Không cần cho ComfyUI cục bộ; `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` cho Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` và Comfy Cloud `/api/*`                |

## Hỗ trợ những gì

- Tạo hình ảnh từ JSON quy trình làm việc
- Chỉnh sửa hình ảnh với 1 hình ảnh tham chiếu đã tải lên
- Tạo video từ JSON quy trình làm việc
- Tạo video với 1 hình ảnh tham chiếu đã tải lên
- Tạo nhạc hoặc âm thanh thông qua công cụ dùng chung `music_generate`
- Tải xuống đầu ra từ một node đã cấu hình hoặc tất cả các node đầu ra khớp

## Bắt đầu

Chọn giữa việc chạy ComfyUI trên máy của bạn hoặc sử dụng Comfy Cloud.

<Tabs>
  <Tab title="Cục bộ">
    **Phù hợp nhất cho:** chạy phiên bản ComfyUI của riêng bạn trên máy hoặc LAN.

    <Steps>
      <Step title="Khởi động ComfyUI cục bộ">
        Đảm bảo phiên bản ComfyUI cục bộ của bạn đang chạy (mặc định là `http://127.0.0.1:8188`).
      </Step>
      <Step title="Chuẩn bị JSON quy trình làm việc của bạn">
        Xuất hoặc tạo tệp JSON quy trình làm việc ComfyUI. Ghi lại ID node cho node nhập lời nhắc và node đầu ra mà bạn muốn OpenClaw đọc từ đó.
      </Step>
      <Step title="Cấu hình nhà cung cấp">
        Đặt `mode: "local"` và trỏ đến tệp quy trình làm việc của bạn. Đây là ví dụ hình ảnh tối thiểu:

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
      <Step title="Đặt mô hình mặc định">
        Trỏ OpenClaw đến mô hình `comfy/workflow` cho năng lực bạn đã cấu hình:

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
      <Step title="Xác minh">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Phù hợp nhất cho:** chạy quy trình làm việc trên Comfy Cloud mà không cần quản lý tài nguyên GPU cục bộ.

    <Steps>
      <Step title="Lấy khóa API">
        Đăng ký tại [comfy.org](https://comfy.org) và tạo khóa API từ bảng điều khiển tài khoản của bạn.
      </Step>
      <Step title="Đặt khóa API">
        Cung cấp khóa của bạn thông qua một trong các phương thức sau:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Chuẩn bị JSON quy trình làm việc của bạn">
        Xuất hoặc tạo tệp JSON quy trình làm việc ComfyUI. Ghi lại ID node cho node nhập lời nhắc và node đầu ra.
      </Step>
      <Step title="Cấu hình nhà cung cấp">
        Đặt `mode: "cloud"` và trỏ đến tệp quy trình làm việc của bạn:

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
        Chế độ đám mây mặc định `baseUrl` là `https://cloud.comfy.org`. Bạn chỉ cần đặt `baseUrl` nếu sử dụng endpoint đám mây tùy chỉnh.
        </Tip>
      </Step>
      <Step title="Đặt mô hình mặc định">
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
      <Step title="Xác minh">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cấu hình

Comfy hỗ trợ các thiết lập kết nối cấp cao nhất dùng chung cùng với các phần quy trình làm việc theo từng năng lực (`image`, `video`, `music`):

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

### Khóa dùng chung

| Khóa                  | Kiểu                   | Mô tả                                                                                 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` hoặc `"cloud"` | Chế độ kết nối.                                                                      |
| `baseUrl`             | string                 | Mặc định là `http://127.0.0.1:8188` cho cục bộ hoặc `https://cloud.comfy.org` cho đám mây. |
| `apiKey`              | string                 | Khóa nội tuyến tùy chọn, thay thế cho biến môi trường `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Cho phép `baseUrl` riêng tư/LAN trong chế độ đám mây.                                |

### Khóa theo từng năng lực

Các khóa này áp dụng bên trong các phần `image`, `video`, hoặc `music`:

| Khóa                         | Bắt buộc | Mặc định | Mô tả                                                                      |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` hoặc `workflowPath` | Có      | --       | Đường dẫn đến tệp JSON quy trình làm việc ComfyUI.                         |
| `promptNodeId`               | Có      | --       | ID node nhận lời nhắc văn bản.                                             |
| `promptInputName`            | Không   | `"text"` | Tên đầu vào trên node lời nhắc.                                            |
| `outputNodeId`               | Không   | --       | ID node để đọc đầu ra từ đó. Nếu bỏ qua, tất cả node đầu ra khớp sẽ được dùng. |
| `pollIntervalMs`             | Không   | --       | Khoảng thời gian thăm dò tính bằng mili giây để hoàn tất tác vụ.            |
| `timeoutMs`                  | Không   | --       | Thời gian chờ tính bằng mili giây cho lần chạy quy trình làm việc.          |

Các phần `image` và `video` cũng hỗ trợ:

| Khóa                  | Bắt buộc                                      | Mặc định  | Mô tả                                                  |
| --------------------- | --------------------------------------------- | --------- | ------------------------------------------------------ |
| `inputImageNodeId`    | Có (khi truyền một hình ảnh tham chiếu)        | --        | ID node nhận hình ảnh tham chiếu đã tải lên.           |
| `inputImageInputName` | Không                                         | `"image"` | Tên đầu vào trên node hình ảnh.                        |

## Chi tiết quy trình làm việc

<AccordionGroup>
  <Accordion title="Quy trình làm việc hình ảnh">
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

    **Ví dụ chỉnh sửa hình ảnh tham chiếu:**

    Để bật chỉnh sửa hình ảnh với một hình ảnh tham chiếu đã tải lên, hãy thêm `inputImageNodeId` vào cấu hình hình ảnh của bạn:

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

  <Accordion title="Quy trình làm việc video">
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

    Các quy trình làm việc video của Comfy hỗ trợ chuyển văn bản thành video và hình ảnh thành video thông qua đồ thị đã cấu hình.

    <Note>
    OpenClaw không truyền video đầu vào vào quy trình làm việc Comfy. Chỉ hỗ trợ lời nhắc văn bản và một hình ảnh tham chiếu đơn lẻ làm đầu vào.
    </Note>

  </Accordion>

  <Accordion title="Quy trình làm việc nhạc">
    Plugin tích hợp sẵn đăng ký một nhà cung cấp tạo nhạc cho đầu ra âm thanh hoặc nhạc được định nghĩa bằng quy trình làm việc, được hiển thị thông qua công cụ dùng chung `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Sử dụng phần cấu hình `music` để trỏ đến JSON quy trình làm việc âm thanh và node đầu ra của bạn.

  </Accordion>

  <Accordion title="Khả năng tương thích ngược">
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

    OpenClaw coi hình dạng kế thừa đó là cấu hình quy trình làm việc hình ảnh. Bạn không cần di chuyển ngay lập tức, nhưng các phần `image` / `video` / `music` lồng nhau được khuyến nghị cho thiết lập mới.

    <Tip>
    Nếu bạn chỉ sử dụng tạo hình ảnh, cấu hình phẳng kế thừa và phần `image` lồng nhau mới tương đương về mặt chức năng.
    </Tip>

  </Accordion>

  <Accordion title="Kiểm thử trực tiếp">
    Phạm vi kiểm thử trực tiếp tùy chọn có sẵn cho Plugin tích hợp sẵn:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Kiểm thử trực tiếp bỏ qua từng trường hợp hình ảnh, video, hoặc nhạc riêng lẻ trừ khi phần quy trình làm việc Comfy tương ứng được cấu hình.

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
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Thiết lập công cụ tạo nhạc và âm thanh.
  </Card>
  <Card title="Danh mục nhà cung cấp" href="/vi/providers/index" icon="layers">
    Tổng quan về tất cả nhà cung cấp và tham chiếu mô hình.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm mặc định của tác tử.
  </Card>
</CardGroup>
