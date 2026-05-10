---
read_when:
    - Bạn muốn các tác nhân hiển thị các chỉnh sửa mã hoặc Markdown dưới dạng diff
    - Bạn muốn một URL trình xem sẵn sàng cho khung vẽ hoặc một tệp diff đã kết xuất
    - Bạn cần các tạo tác diff tạm thời, được kiểm soát với các giá trị mặc định an toàn
sidebarTitle: Diffs
summary: Trình xem khác biệt chỉ đọc và trình kết xuất tệp cho tác nhân (công cụ Plugin tùy chọn)
title: Khác biệt
x-i18n:
    generated_at: "2026-05-10T19:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` là một công cụ Plugin tùy chọn có hướng dẫn hệ thống tích hợp ngắn gọn và một Skills đi kèm, chuyển nội dung thay đổi thành một tạo tác diff chỉ đọc cho tác nhân.

Công cụ chấp nhận một trong hai dạng:

- văn bản `before` và `after`
- một `patch` hợp nhất

Công cụ có thể trả về:

- URL trình xem Gateway để trình bày trên canvas
- đường dẫn tệp đã render (PNG hoặc PDF) để gửi qua tin nhắn
- cả hai đầu ra trong một lần gọi

Khi được bật, Plugin sẽ thêm trước hướng dẫn sử dụng ngắn gọn vào không gian system-prompt và cũng cung cấp một Skills chi tiết cho các trường hợp tác nhân cần hướng dẫn đầy đủ hơn.

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Bật Plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Chọn chế độ">
    <Tabs>
      <Tab title="view">
        Luồng ưu tiên canvas: tác nhân gọi `diffs` với `mode: "view"` và mở `details.viewerUrl` bằng `canvas present`.
      </Tab>
      <Tab title="file">
        Gửi tệp trong chat: tác nhân gọi `diffs` với `mode: "file"` và gửi `details.filePath` bằng `message` sử dụng `path` hoặc `filePath`.
      </Tab>
      <Tab title="both">
        Kết hợp: tác nhân gọi `diffs` với `mode: "both"` để nhận cả hai tạo tác trong một lần gọi.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Tắt hướng dẫn hệ thống tích hợp

Nếu bạn muốn giữ công cụ `diffs` được bật nhưng tắt hướng dẫn system-prompt tích hợp của nó, hãy đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Thao tác này chặn hook `before_prompt_build` của Plugin diffs trong khi vẫn giữ Plugin, công cụ và Skills đi kèm khả dụng.

Nếu bạn muốn tắt cả hướng dẫn và công cụ, hãy tắt Plugin thay vào đó.

## Quy trình tác nhân điển hình

<Steps>
  <Step title="Gọi diffs">
    Tác nhân gọi công cụ `diffs` với đầu vào.
  </Step>
  <Step title="Đọc details">
    Tác nhân đọc các trường `details` từ phản hồi.
  </Step>
  <Step title="Trình bày">
    Tác nhân mở `details.viewerUrl` bằng `canvas present`, gửi `details.filePath` bằng `message` sử dụng `path` hoặc `filePath`, hoặc thực hiện cả hai.
  </Step>
</Steps>

## Ví dụ đầu vào

<Tabs>
  <Tab title="Trước và sau">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Tham chiếu đầu vào công cụ

Tất cả các trường đều là tùy chọn trừ khi được nêu rõ.

<ParamField path="before" type="string">
  Văn bản gốc. Bắt buộc cùng với `after` khi bỏ qua `patch`.
</ParamField>
<ParamField path="after" type="string">
  Văn bản đã cập nhật. Bắt buộc cùng với `before` khi bỏ qua `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Văn bản unified diff. Loại trừ lẫn nhau với `before` và `after`.
</ParamField>
<ParamField path="path" type="string">
  Tên tệp hiển thị cho chế độ trước và sau.
</ParamField>
<ParamField path="lang" type="string">
  Gợi ý ghi đè ngôn ngữ cho chế độ trước và sau. Giá trị không xác định sẽ quay về văn bản thuần.
</ParamField>
<ParamField path="title" type="string">
  Ghi đè tiêu đề trình xem.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Chế độ đầu ra. Mặc định là mặc định của Plugin `defaults.mode`. Bí danh đã lỗi thời: `"image"` hoạt động như `"file"` và vẫn được chấp nhận để tương thích ngược.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Chủ đề trình xem. Mặc định là mặc định của Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Bố cục diff. Mặc định là mặc định của Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Mở rộng các phần không thay đổi khi có ngữ cảnh đầy đủ. Chỉ là tùy chọn cho từng lần gọi (không phải khóa mặc định của Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Định dạng tệp đã render. Mặc định là mặc định của Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset chất lượng cho render PNG hoặc PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Ghi đè tỷ lệ thiết bị (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Chiều rộng render tối đa theo pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL của tạo tác tính bằng giây cho đầu ra trình xem và tệp độc lập. Tối đa 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Ghi đè origin URL trình xem. Ghi đè `viewerBaseUrl` của Plugin. Phải là `http` hoặc `https`, không có query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Bí danh đầu vào cũ">
    Vẫn được chấp nhận để tương thích ngược:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Xác thực và giới hạn">
    - `before` và `after` mỗi trường tối đa 512 KiB.
    - `patch` tối đa 2 MiB.
    - `path` tối đa 2048 byte.
    - `lang` tối đa 128 byte.
    - `title` tối đa 1024 byte.
    - Giới hạn độ phức tạp của patch: tối đa 128 tệp và tổng cộng 120000 dòng.
    - `patch` cùng với `before` hoặc `after` sẽ bị từ chối.
    - Giới hạn an toàn cho tệp đã render (áp dụng cho PNG và PDF):
      - `fileQuality: "standard"`: tối đa 8 MP (8.000.000 pixel đã render).
      - `fileQuality: "hq"`: tối đa 14 MP (14.000.000 pixel đã render).
      - `fileQuality: "print"`: tối đa 24 MP (24.000.000 pixel đã render).
      - PDF cũng có tối đa 50 trang.

  </Accordion>
</AccordionGroup>

## Hợp đồng chi tiết đầu ra

Công cụ trả về siêu dữ liệu có cấu trúc trong `details`.

<AccordionGroup>
  <Accordion title="Trường trình xem">
    Các trường dùng chung cho những chế độ tạo trình xem:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` khi có)

  </Accordion>
  <Accordion title="Trường tệp">
    Các trường tệp khi PNG hoặc PDF được render:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (cùng giá trị với `filePath`, để tương thích với công cụ tin nhắn)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Bí danh tương thích">
    Cũng được trả về cho các bên gọi hiện có:

    - `format` (cùng giá trị với `fileFormat`)
    - `imagePath` (cùng giá trị với `filePath`)
    - `imageBytes` (cùng giá trị với `fileBytes`)
    - `imageQuality` (cùng giá trị với `fileQuality`)
    - `imageScale` (cùng giá trị với `fileScale`)
    - `imageMaxWidth` (cùng giá trị với `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Tóm tắt hành vi theo chế độ:

| Chế độ   | Nội dung được trả về                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Chỉ các trường trình xem.                                                                                              |
| `"file"` | Chỉ các trường tệp, không có tạo tác trình xem.                                                                        |
| `"both"` | Các trường trình xem cộng với các trường tệp. Nếu render tệp thất bại, trình xem vẫn được trả về với `fileError` và bí danh `imageError`. |

## Các phần không thay đổi được thu gọn

- Trình xem có thể hiển thị các hàng như `N unmodified lines`.
- Các điều khiển mở rộng trên những hàng đó là có điều kiện và không được bảo đảm cho mọi loại đầu vào.
- Các điều khiển mở rộng xuất hiện khi diff đã render có dữ liệu ngữ cảnh có thể mở rộng, điều này thường gặp với đầu vào trước và sau.
- Với nhiều đầu vào unified patch, phần thân ngữ cảnh bị bỏ qua không có sẵn trong các hunk patch đã phân tích, vì vậy hàng có thể xuất hiện mà không có điều khiển mở rộng. Đây là hành vi dự kiến.
- `expandUnchanged` chỉ áp dụng khi tồn tại ngữ cảnh có thể mở rộng.

## Mặc định của Plugin

Đặt mặc định trên toàn Plugin trong `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Các mặc định được hỗ trợ:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Tham số công cụ được chỉ định tường minh sẽ ghi đè các mặc định này.

### Cấu hình URL trình xem bền vững

<ParamField path="viewerBaseUrl" type="string">
  Phương án dự phòng do Plugin sở hữu cho các liên kết trình xem được trả về khi một lần gọi công cụ không truyền `baseUrl`. Phải là `http` hoặc `https`, không có query/hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Cấu hình bảo mật

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: các yêu cầu không phải loopback tới tuyến trình xem sẽ bị từ chối. `true`: trình xem từ xa được cho phép nếu đường dẫn có token hợp lệ.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Vòng đời và lưu trữ tạo tác

- Tạo tác được lưu trong thư mục con tạm: `$TMPDIR/openclaw-diffs`.
- Siêu dữ liệu tạo tác trình xem chứa:
  - ID tạo tác ngẫu nhiên (20 ký tự hex)
  - token ngẫu nhiên (48 ký tự hex)
  - `createdAt` và `expiresAt`
  - đường dẫn `viewer.html` đã lưu
- TTL tạo tác mặc định là 30 phút khi không được chỉ định.
- TTL trình xem tối đa được chấp nhận là 6 giờ.
- Dọn dẹp chạy theo cơ hội sau khi tạo tạo tác.
- Tạo tác hết hạn sẽ bị xóa.
- Dọn dẹp dự phòng sẽ xóa các thư mục cũ hơn 24 giờ khi thiếu siêu dữ liệu.

## Hành vi URL trình xem và mạng

Tuyến trình xem:

- `/plugins/diffs/view/{artifactId}/{token}`

Tài nguyên trình xem:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Tài liệu trình xem phân giải các tài nguyên đó tương đối với URL trình xem, vì vậy tiền tố đường dẫn `baseUrl` tùy chọn cũng được giữ cho cả các yêu cầu tài nguyên.

Hành vi xây dựng URL:

- Nếu `baseUrl` của lần gọi công cụ được cung cấp, nó sẽ được sử dụng sau khi xác thực nghiêm ngặt.
- Nếu không, nếu `viewerBaseUrl` của Plugin được cấu hình, nó sẽ được sử dụng.
- Nếu không có ghi đè nào, URL trình xem mặc định là loopback `127.0.0.1`.
- Nếu chế độ bind Gateway là `custom` và `gateway.customBindHost` được đặt, host đó sẽ được sử dụng.

Quy tắc `baseUrl`:

- Phải là `http://` hoặc `https://`.
- Query và hash sẽ bị từ chối.
- Origin cộng với đường dẫn cơ sở tùy chọn được cho phép.

## Mô hình bảo mật

<AccordionGroup>
  <Accordion title="Gia cố trình xem">
    - Theo mặc định chỉ cho phép loopback.
    - Đường dẫn trình xem được mã hóa token với kiểm thực ID và token nghiêm ngặt.
    - CSP phản hồi của trình xem:
      - `default-src 'none'`
      - script và tài nguyên chỉ từ chính nguồn
      - không có `connect-src` đi ra ngoài
    - Điều tiết lỗi truy cập từ xa khi quyền truy cập từ xa được bật:
      - 40 lỗi mỗi 60 giây
      - khóa 60 giây (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Gia cố kết xuất tệp">
    - Định tuyến yêu cầu trình duyệt chụp màn hình mặc định là từ chối.
    - Chỉ cho phép tài nguyên trình xem cục bộ từ `http://127.0.0.1/plugins/diffs/assets/*`.
    - Yêu cầu mạng bên ngoài bị chặn.

  </Accordion>
</AccordionGroup>

## Yêu cầu trình duyệt cho chế độ tệp

`mode: "file"` và `mode: "both"` cần trình duyệt tương thích với Chromium.

Thứ tự phân giải:

<Steps>
  <Step title="Cấu hình">
    `browser.executablePath` trong cấu hình OpenClaw.
  </Step>
  <Step title="Biến môi trường">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Dự phòng nền tảng">
    Cơ chế dự phòng khám phá lệnh/đường dẫn của nền tảng.
  </Step>
</Steps>

Văn bản lỗi thường gặp:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Khắc phục bằng cách cài đặt Chrome, Chromium, Edge hoặc Brave, hoặc đặt một trong các tùy chọn đường dẫn tệp thực thi ở trên.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi kiểm thực đầu vào">
    - `Provide patch or both before and after text.` — bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
    - `Provide either patch or before/after input, not both.` — không trộn các chế độ đầu vào.
    - `Invalid baseUrl: ...` — dùng origin `http(s)` với đường dẫn tùy chọn, không có query/hash.
    - `{field} exceeds maximum size (...)` — giảm kích thước payload.
    - Từ chối bản vá lớn — giảm số lượng tệp bản vá hoặc tổng số dòng.

  </Accordion>
  <Accordion title="Khả năng truy cập trình xem">
    - Theo mặc định, URL trình xem phân giải thành `127.0.0.1`.
    - Đối với các kịch bản truy cập từ xa, hãy:
      - đặt `viewerBaseUrl` của plugin, hoặc
      - truyền `baseUrl` cho từng lần gọi công cụ, hoặc
      - dùng `gateway.bind=custom` và `gateway.customBindHost`
    - Nếu `gateway.trustedProxies` bao gồm loopback cho proxy cùng máy chủ (ví dụ Tailscale Serve), các yêu cầu trình xem loopback thô không có header IP máy khách được chuyển tiếp sẽ bị đóng theo thiết kế.
    - Với cấu trúc proxy đó:
      - ưu tiên `mode: "file"` hoặc `mode: "both"` khi bạn chỉ cần tệp đính kèm, hoặc
      - chủ ý bật `security.allowRemoteViewer` và đặt `viewerBaseUrl` của plugin hoặc truyền `baseUrl` proxy/công khai khi bạn cần URL trình xem có thể chia sẻ
    - Chỉ bật `security.allowRemoteViewer` khi bạn có ý định cho phép truy cập trình xem từ bên ngoài.

  </Accordion>
  <Accordion title="Hàng dòng chưa sửa đổi không có nút mở rộng">
    Điều này có thể xảy ra với đầu vào bản vá khi bản vá không mang theo ngữ cảnh có thể mở rộng. Đây là hành vi dự kiến và không cho thấy trình xem bị lỗi.
  </Accordion>
  <Accordion title="Không tìm thấy artifact">
    - Artifact đã hết hạn do TTL.
    - Token hoặc đường dẫn đã thay đổi.
    - Tác vụ dọn dẹp đã xóa dữ liệu cũ.

  </Accordion>
</AccordionGroup>

## Hướng dẫn vận hành

- Ưu tiên `mode: "view"` cho các phiên đánh giá tương tác cục bộ trong canvas.
- Ưu tiên `mode: "file"` cho các kênh chat đi ra ngoài cần tệp đính kèm.
- Giữ `allowRemoteViewer` ở trạng thái tắt trừ khi triển khai của bạn yêu cầu URL trình xem từ xa.
- Đặt `ttlSeconds` ngắn và rõ ràng cho các diff nhạy cảm.
- Tránh gửi bí mật trong đầu vào diff khi không bắt buộc.
- Nếu kênh của bạn nén ảnh mạnh (ví dụ Telegram hoặc WhatsApp), hãy ưu tiên đầu ra PDF (`fileFormat: "pdf"`).

<Note>
Công cụ kết xuất diff được vận hành bởi [Diffs](https://diffs.com).
</Note>

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Plugins](/vi/tools/plugin)
- [Tổng quan công cụ](/vi/tools)
