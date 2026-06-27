---
read_when:
    - Bạn muốn agent hiển thị các chỉnh sửa code hoặc markdown dưới dạng diff
    - Bạn muốn một URL trình xem sẵn sàng cho canvas hoặc một tệp diff đã render
    - Bạn cần các tạo phẩm diff tạm thời, có kiểm soát với các mặc định an toàn
sidebarTitle: Diffs
summary: Trình xem diff chỉ đọc và trình kết xuất tệp cho agent (công cụ Plugin tùy chọn)
title: Các khác biệt
x-i18n:
    generated_at: "2026-06-27T18:14:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` là một công cụ Plugin tùy chọn với hướng dẫn hệ thống tích hợp ngắn gọn và một Skills đi kèm, dùng để chuyển nội dung thay đổi thành một tạo tác diff chỉ đọc cho tác nhân.

Nó chấp nhận một trong hai dạng:

- văn bản `before` và `after`
- một `patch` hợp nhất

Nó có thể trả về:

- URL trình xem Gateway để trình bày trên canvas
- đường dẫn tệp đã render (PNG hoặc PDF) để gửi qua tin nhắn
- cả hai đầu ra trong một lần gọi

Khi được bật, Plugin sẽ thêm hướng dẫn sử dụng ngắn gọn vào không gian system-prompt và cũng cung cấp một Skills chi tiết cho các trường hợp tác nhân cần hướng dẫn đầy đủ hơn.

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
  <Step title="Chọn một chế độ">
    <Tabs>
      <Tab title="view">
        Luồng ưu tiên canvas: tác nhân gọi `diffs` với `mode: "view"` và mở `details.viewerUrl` bằng `canvas present`.
      </Tab>
      <Tab title="file">
        Gửi tệp qua chat: tác nhân gọi `diffs` với `mode: "file"` và gửi `details.filePath` bằng `message` sử dụng `path` hoặc `filePath`.
      </Tab>
      <Tab title="both">
        Kết hợp: tác nhân gọi `diffs` với `mode: "both"` để nhận cả hai tạo tác trong một lần gọi.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Tắt hướng dẫn hệ thống tích hợp

Nếu bạn muốn giữ công cụ `diffs` được bật nhưng tắt hướng dẫn system-prompt tích hợp của nó, đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

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

Điều này chặn hook `before_prompt_build` của Plugin diffs trong khi vẫn giữ Plugin, công cụ và Skills đi kèm khả dụng.

Nếu bạn muốn tắt cả hướng dẫn lẫn công cụ, hãy tắt Plugin thay vào đó.

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

Tất cả các trường đều là tùy chọn trừ khi được ghi chú.

<ParamField path="before" type="string">
  Văn bản gốc. Bắt buộc cùng với `after` khi bỏ qua `patch`.
</ParamField>
<ParamField path="after" type="string">
  Văn bản đã cập nhật. Bắt buộc cùng với `before` khi bỏ qua `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Văn bản diff hợp nhất. Loại trừ lẫn nhau với `before` và `after`.
</ParamField>
<ParamField path="path" type="string">
  Tên tệp hiển thị cho chế độ trước và sau.
</ParamField>
<ParamField path="lang" type="string">
  Gợi ý ghi đè ngôn ngữ cho chế độ trước và sau. Các giá trị không xác định và ngôn ngữ nằm ngoài bộ trình xem mặc định sẽ quay về văn bản thuần trừ khi
  Plugin Diff Viewer Language Pack được cài đặt.
</ParamField>

<ParamField path="title" type="string">
  Ghi đè tiêu đề trình xem.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Chế độ đầu ra. Mặc định là giá trị mặc định của Plugin `defaults.mode`. Bí danh không còn được khuyến nghị: `"image"` hoạt động như `"file"` và vẫn được chấp nhận để tương thích ngược.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Chủ đề trình xem. Mặc định là giá trị mặc định của Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Bố cục diff. Mặc định là giá trị mặc định của Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Mở rộng các phần không thay đổi khi có ngữ cảnh đầy đủ. Chỉ là tùy chọn cho từng lần gọi (không phải khóa mặc định của Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Định dạng tệp đã render. Mặc định là giá trị mặc định của Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Thiết lập sẵn chất lượng cho việc render PNG hoặc PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Ghi đè tỷ lệ thiết bị (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Chiều rộng render tối đa tính bằng pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL của tạo tác tính bằng giây cho đầu ra trình xem và tệp độc lập. Tối đa 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Ghi đè origin URL trình xem. Ghi đè Plugin `viewerBaseUrl`. Phải là `http` hoặc `https`, không có query/hash.
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
      - PDF cũng có giới hạn tối đa 50 trang.

  </Accordion>
</AccordionGroup>

## Tô sáng cú pháp

OpenClaw bao gồm tô sáng cú pháp cho các ngôn ngữ mã nguồn, cấu hình và tài liệu phổ biến:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, và `toml`.

Các bí danh phổ biến như `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, và `ps1` được chuẩn hóa thành các ngôn ngữ mặc định đó.

Cài đặt Plugin Gói ngôn ngữ của Trình xem Diff để tô sáng các ngôn ngữ khác:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Khi có gói ngôn ngữ, OpenClaw có thể tô sáng nhiều ngôn ngữ hơn. Nếu gói chưa được cài đặt, các tệp nằm ngoài danh sách mặc định vẫn được hiển thị dưới dạng văn bản thuần dễ đọc. Ví dụ bao gồm Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI và các tệp diff.

Xem [Plugin Gói ngôn ngữ Diffs](/vi/plugins/reference/diffs-language-pack) để biết chi tiết và [ngôn ngữ Shiki](https://shiki.style/languages) để xem danh mục ngôn ngữ thượng nguồn và bí danh của Shiki.

## Hợp đồng chi tiết đầu ra

Công cụ trả về siêu dữ liệu có cấu trúc trong `details`.

<AccordionGroup>
  <Accordion title="Trường của trình xem">
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
  <Accordion title="Trường của tệp">
    Các trường tệp khi PNG hoặc PDF được kết xuất:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (cùng giá trị với `filePath`, để tương thích với công cụ nhắn tin)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Bí danh tương thích">
    Cũng được trả về cho các trình gọi hiện có:

    - `format` (cùng giá trị với `fileFormat`)
    - `imagePath` (cùng giá trị với `filePath`)
    - `imageBytes` (cùng giá trị với `fileBytes`)
    - `imageQuality` (cùng giá trị với `fileQuality`)
    - `imageScale` (cùng giá trị với `fileScale`)
    - `imageMaxWidth` (cùng giá trị với `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Tóm tắt hành vi chế độ:

| Chế độ   | Nội dung được trả về                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Chỉ các trường của trình xem.                                                                                          |
| `"file"` | Chỉ các trường của tệp, không có artifact trình xem.                                                                    |
| `"both"` | Các trường của trình xem cộng với các trường của tệp. Nếu kết xuất tệp thất bại, trình xem vẫn được trả về với bí danh `fileError` và `imageError`. |

## Các phần không đổi đã thu gọn

- Trình xem có thể hiển thị các hàng như `N unmodified lines`.
- Điều khiển mở rộng trên các hàng đó là có điều kiện và không được bảo đảm cho mọi loại đầu vào.
- Điều khiển mở rộng xuất hiện khi diff đã kết xuất có dữ liệu ngữ cảnh có thể mở rộng, điều này thường gặp với đầu vào trước và sau.
- Với nhiều đầu vào bản vá hợp nhất, phần thân ngữ cảnh bị bỏ qua không có sẵn trong các hunk bản vá đã phân tích, vì vậy hàng có thể xuất hiện mà không có điều khiển mở rộng. Đây là hành vi dự kiến.
- `expandUnchanged` chỉ áp dụng khi ngữ cảnh có thể mở rộng tồn tại.

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

Các tham số công cụ tường minh sẽ ghi đè các mặc định này.

### Cấu hình URL trình xem bền vững

<ParamField path="viewerBaseUrl" type="string">
  Dự phòng do Plugin sở hữu cho các liên kết trình xem được trả về khi một lệnh gọi công cụ không truyền `baseUrl`. Phải là `http` hoặc `https`, không có truy vấn/hash.
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
  `false`: các yêu cầu không phải loopback đến các tuyến trình xem bị từ chối. `true`: trình xem từ xa được cho phép nếu đường dẫn đã mã hóa token hợp lệ.
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

## Vòng đời artifact và lưu trữ

- Các artifact được lưu trong thư mục con tạm thời: `$TMPDIR/openclaw-diffs`.
- Siêu dữ liệu artifact của trình xem chứa:
  - ID artifact ngẫu nhiên (20 ký tự hex)
  - token ngẫu nhiên (48 ký tự hex)
  - `createdAt` và `expiresAt`
  - đường dẫn `viewer.html` đã lưu
- TTL artifact mặc định là 30 phút khi không được chỉ định.
- TTL trình xem tối đa được chấp nhận là 6 giờ.
- Dọn dẹp chạy theo cơ hội sau khi tạo artifact.
- Artifact hết hạn sẽ bị xóa.
- Dọn dẹp dự phòng loại bỏ các thư mục cũ hơn 24 giờ khi thiếu siêu dữ liệu.

## URL trình xem và hành vi mạng

Tuyến trình xem:

- `/plugins/diffs/view/{artifactId}/{token}`

Tài nguyên trình xem:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` khi diff dùng một ngôn ngữ từ Diff Viewer Language Pack

Tài liệu trình xem phân giải các tài nguyên đó tương đối với URL trình xem, nên tiền tố đường dẫn `baseUrl` tùy chọn cũng được giữ nguyên cho cả các yêu cầu tài nguyên.

Hành vi dựng URL:

- Nếu `baseUrl` của lệnh gọi công cụ được cung cấp, nó sẽ được dùng sau khi xác thực nghiêm ngặt.
- Nếu không, nếu Plugin `viewerBaseUrl` được cấu hình, nó sẽ được dùng.
- Khi không có ghi đè nào, URL trình xem mặc định là loopback `127.0.0.1`.
- Nếu chế độ bind của Gateway là `custom` và `gateway.customBindHost` được đặt, host đó sẽ được dùng.

Quy tắc `baseUrl`:

- Phải là `http://` hoặc `https://`.
- Query và hash bị từ chối.
- Origin cộng với đường dẫn cơ sở tùy chọn được cho phép.

## Mô hình bảo mật

<AccordionGroup>
  <Accordion title="Tăng cường bảo vệ trình xem">
    - Mặc định chỉ dùng loopback.
    - Đường dẫn trình xem có token với xác thực ID và token nghiêm ngặt.
    - CSP phản hồi trình xem:
      - `default-src 'none'`
      - script và tài nguyên chỉ từ self
      - không có `connect-src` ra ngoài
    - Giới hạn tốc độ khi truy cập từ xa bị miss nếu truy cập từ xa được bật:
      - 40 lỗi trong mỗi 60 giây
      - khóa 60 giây (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Tăng cường bảo vệ kết xuất tệp">
    - Định tuyến yêu cầu trình duyệt chụp màn hình mặc định là từ chối.
    - Chỉ cho phép tài nguyên trình xem cục bộ từ `http://127.0.0.1/plugins/diffs/assets/*`.
    - Các yêu cầu mạng bên ngoài bị chặn.

  </Accordion>
</AccordionGroup>

## Yêu cầu trình duyệt cho chế độ tệp

`mode: "file"` và `mode: "both"` cần trình duyệt tương thích Chromium.

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
  <Step title="Dự phòng theo nền tảng">
    Dự phòng khám phá lệnh/đường dẫn theo nền tảng.
  </Step>
</Steps>

Văn bản lỗi thường gặp:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Khắc phục bằng cách cài đặt Chrome, Chromium, Edge hoặc Brave, hoặc đặt một trong các tùy chọn đường dẫn tệp thực thi ở trên.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi xác thực đầu vào">
    - `Provide patch or both before and after text.` — bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
    - `Provide either patch or before/after input, not both.` — không trộn lẫn các chế độ đầu vào.
    - `Invalid baseUrl: ...` — dùng origin `http(s)` với đường dẫn tùy chọn, không có query/hash.
    - `{field} exceeds maximum size (...)` — giảm kích thước payload.
    - Từ chối patch lớn — giảm số lượng tệp patch hoặc tổng số dòng.

  </Accordion>
  <Accordion title="Khả năng truy cập trình xem">
    - URL trình xem mặc định phân giải tới `127.0.0.1`.
    - Với các kịch bản truy cập từ xa, hãy:
      - đặt Plugin `viewerBaseUrl`, hoặc
      - truyền `baseUrl` cho mỗi lệnh gọi công cụ, hoặc
      - dùng `gateway.bind=custom` và `gateway.customBindHost`
    - Nếu `gateway.trustedProxies` bao gồm loopback cho proxy cùng host (ví dụ Tailscale Serve), các yêu cầu trình xem loopback thô không có header client-IP được chuyển tiếp sẽ thất bại đóng theo thiết kế.
    - Với topology proxy đó:
      - ưu tiên `mode: "file"` hoặc `mode: "both"` khi bạn chỉ cần tệp đính kèm, hoặc
      - chủ ý bật `security.allowRemoteViewer` và đặt Plugin `viewerBaseUrl` hoặc truyền `baseUrl` proxy/công khai khi bạn cần URL trình xem có thể chia sẻ
    - Chỉ bật `security.allowRemoteViewer` khi bạn có ý định cho phép truy cập trình xem bên ngoài.

  </Accordion>
  <Accordion title="Hàng dòng chưa sửa đổi không có nút mở rộng">
    Điều này có thể xảy ra với đầu vào patch khi patch không mang ngữ cảnh có thể mở rộng. Đây là điều dự kiến và không cho thấy trình xem bị lỗi.
  </Accordion>
  <Accordion title="Không tìm thấy artifact">
    - Artifact hết hạn do TTL.
    - Token hoặc đường dẫn đã thay đổi.
    - Dọn dẹp đã xóa dữ liệu cũ.

  </Accordion>
</AccordionGroup>

## Hướng dẫn vận hành

- Ưu tiên `mode: "view"` cho các phiên review tương tác cục bộ trong canvas.
- Ưu tiên `mode: "file"` cho các kênh chat gửi ra ngoài cần tệp đính kèm.
- Giữ `allowRemoteViewer` ở trạng thái tắt trừ khi triển khai của bạn yêu cầu URL trình xem từ xa.
- Đặt `ttlSeconds` ngắn, rõ ràng cho các diff nhạy cảm.
- Tránh gửi bí mật trong đầu vào diff khi không cần thiết.
- Nếu kênh của bạn nén hình ảnh mạnh (ví dụ Telegram hoặc WhatsApp), hãy ưu tiên đầu ra PDF (`fileFormat: "pdf"`).

<Note>
Công cụ kết xuất diff được cung cấp bởi [Diffs](https://diffs.com).
</Note>

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Plugin](/vi/tools/plugin)
- [Tổng quan về công cụ](/vi/tools)
