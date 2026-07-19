---
read_when:
    - Bạn muốn các agent hiển thị những chỉnh sửa mã hoặc Markdown dưới dạng diff
    - Bạn muốn một URL trình xem sẵn sàng cho canvas hoặc một tệp diff đã kết xuất
    - Bạn cần các tạo tác diff tạm thời, được kiểm soát, với các giá trị mặc định an toàn
sidebarTitle: Diffs
summary: Trình xem diff chỉ đọc và trình kết xuất tệp dành cho agent (công cụ plugin tùy chọn)
title: Khác biệt
x-i18n:
    generated_at: "2026-07-19T06:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baeb5dd1277120e57178f092e3ae1616edd3389a54721c929d8711301535d302
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` là một công cụ plugin đi kèm tùy chọn, chuyển văn bản trước/sau hoặc một bản vá hợp nhất thành phần tạo tác diff chỉ đọc. Công cụ này cũng thêm hướng dẫn ngắn cho agent vào đầu lời nhắc hệ thống và cung cấp một skill đi kèm với hướng dẫn đầy đủ hơn.

Đầu vào: văn bản `before` + `after`, hoặc một `patch` hợp nhất (loại trừ lẫn nhau).

Đầu ra: URL trình xem của Gateway để trình bày trên canvas, đường dẫn tệp PNG/PDF đã kết xuất để gửi qua tin nhắn, hoặc cả hai.

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Bật plugin">
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
        Luồng ưu tiên canvas: agent gọi `diffs` với `mode: "view"` và mở `details.viewerUrl` bằng `canvas present`.
      </Tab>
      <Tab title="file">
        Gửi tệp qua cuộc trò chuyện: agent gọi `diffs` với `mode: "file"` và gửi `details.filePath` cùng `message` bằng `path` hoặc `filePath`.
      </Tab>
      <Tab title="both">
        Kết hợp (mặc định): agent gọi `diffs` với `mode: "both"` để nhận cả hai phần tạo tác trong một lần gọi.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Tắt hướng dẫn hệ thống tích hợp sẵn

Để giữ công cụ nhưng loại bỏ hướng dẫn được thêm vào đầu lời nhắc hệ thống, hãy đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

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

Thao tác này chặn hook `before_prompt_build` của plugin nhưng vẫn giữ công cụ và skill khả dụng. Để tắt cả hướng dẫn lẫn công cụ, hãy tắt plugin.

## Tham chiếu đầu vào của công cụ

Tất cả các trường đều là tùy chọn, trừ khi có ghi chú khác.

<ParamField path="before" type="string">
  Văn bản gốc. Bắt buộc cùng với `after` khi `patch` bị bỏ qua.
</ParamField>
<ParamField path="after" type="string">
  Văn bản đã cập nhật. Bắt buộc cùng với `before` khi `patch` bị bỏ qua.
</ParamField>
<ParamField path="patch" type="string">
  Văn bản diff hợp nhất. Loại trừ lẫn nhau với `before` và `after`.
</ParamField>
<ParamField path="path" type="string">
  Tên tệp hiển thị cho chế độ trước/sau.
</ParamField>
<ParamField path="lang" type="string">
  Gợi ý ghi đè ngôn ngữ cho chế độ trước/sau. Các giá trị không xác định và ngôn ngữ nằm ngoài tập hợp mặc định của trình xem sẽ quay về văn bản thuần túy, trừ khi đã cài đặt plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Ghi đè tiêu đề trình xem.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Chế độ đầu ra. Mặc định là giá trị mặc định `defaults.mode` của plugin (`both`). Bí danh không còn được khuyến nghị: `"image"` hoạt động giống hệt `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Chủ đề của trình xem. Mặc định là giá trị mặc định `defaults.theme` của plugin.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Bố cục diff. Mặc định là giá trị mặc định `defaults.layout` của plugin.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Mở rộng các phần không thay đổi khi có đầy đủ ngữ cảnh. Chỉ là tùy chọn cho từng lần gọi (không phải khóa mặc định của plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Định dạng tệp đã kết xuất. Mặc định là giá trị mặc định `defaults.fileFormat` của plugin.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Cấu hình chất lượng đặt trước cho việc kết xuất PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Ghi đè tỷ lệ thiết bị (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Chiều rộng kết xuất tối đa tính bằng pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL của phần tạo tác tính bằng giây cho đầu ra trình xem và tệp độc lập. Tối đa `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Ghi đè nguồn gốc URL của trình xem. Ghi đè `viewerBaseUrl` của plugin. Phải là `http` hoặc `https`, không có truy vấn/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Xác thực và giới hạn">
    - `before`/`after`: tối đa 512 KiB mỗi trường.
    - `patch`: tối đa 2 MiB.
    - `path`: tối đa 2048 byte.
    - `lang`: tối đa 128 byte.
    - `title`: tối đa 1024 byte.
    - Giới hạn độ phức tạp của bản vá: tối đa 128 tệp và tổng cộng 120000 dòng.
    - `patch` cùng với `before`/`after` sẽ bị từ chối.
    - Giới hạn an toàn cho tệp đã kết xuất (PNG và PDF):
      - `fileQuality: "standard"`: tối đa 8 MP (8,000,000 pixel đã kết xuất).
      - `fileQuality: "hq"`: tối đa 14 MP.
      - `fileQuality: "print"`: tối đa 24 MP.
      - PDF cũng bị giới hạn ở 50 trang.

  </Accordion>
</AccordionGroup>

## Tô sáng cú pháp

Các ngôn ngữ tích hợp sẵn:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` và `toml`.

Các bí danh phổ biến (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, v.v.) được chuẩn hóa thành các ngôn ngữ đó.

Cài đặt plugin Diff Viewer Language Pack để có thêm ngôn ngữ (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff và nhiều ngôn ngữ khác):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Khi không có gói này, các ngôn ngữ không được hỗ trợ vẫn được kết xuất dưới dạng văn bản thuần túy dễ đọc. Xem [plugin Diffs Language Pack](/vi/plugins/reference/diffs-language-pack) và [các ngôn ngữ Shiki](https://shiki.style/languages) để biết danh mục từ dự án thượng nguồn.

## Hợp đồng chi tiết đầu ra

Tất cả kết quả thành công đều bao gồm `changed`: đầu vào trước/sau giống hệt nhau trả về `false` mà không tạo phần tạo tác; kết quả đã kết xuất trả về `true`.

<AccordionGroup>
  <Accordion title="Các trường trình xem (chế độ view và both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` khi khả dụng)

  </Accordion>
  <Accordion title="Các trường tệp (chế độ file và both)">
    - `changed`
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
</AccordionGroup>

| Chế độ     | Trả về                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Chỉ các trường trình xem.                                                                             |
| `"file"` | Chỉ các trường tệp, không có phần tạo tác trình xem.                                                           |
| `"both"` | Các trường trình xem cộng với các trường tệp. Nếu kết xuất tệp thất bại, trình xem vẫn trả về cùng `fileError`. |

### Các phần không thay đổi được thu gọn

Trình xem hiển thị các hàng như `N unmodified lines`. Các nút điều khiển mở rộng chỉ xuất hiện khi diff đã kết xuất có dữ liệu ngữ cảnh có thể mở rộng (thường gặp với đầu vào trước/sau). Nhiều bản vá hợp nhất bỏ qua phần thân ngữ cảnh trong các hunk, vì vậy hàng có thể xuất hiện mà không có nút điều khiển mở rộng -- đây là hành vi dự kiến, không phải lỗi. `expandUnchanged` chỉ áp dụng khi có ngữ cảnh có thể mở rộng.

### Điều hướng nhiều tệp

Các bản vá tác động đến nhiều hơn một tệp bắt đầu bằng một thẻ tóm tắt tệp đã thay đổi: tổng số `+N` / `-N`, số lượng theo từng tệp, huy hiệu đã thêm/đã xóa/đã đổi tên và các liên kết neo để chuyển đến từng tệp. Các tệp PNG/PDF đã kết xuất giữ lại số lượng trong tiêu đề của từng tệp nhưng loại bỏ các nút chuyển đổi chế độ xem tương tác, vì chúng là các nút điều khiển không hoạt động trong tệp tĩnh.

## Giá trị mặc định của plugin

Đặt các giá trị mặc định trên toàn plugin trong `~/.openclaw/openclaw.json`:

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

Các khóa `defaults` được hỗ trợ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Các tham số gọi công cụ được chỉ định rõ ràng sẽ ghi đè những giá trị này.

### Cấu hình URL trình xem cố định

<ParamField path="viewerBaseUrl" type="string">
  Giá trị dự phòng do plugin sở hữu cho các liên kết trình xem được trả về khi một lần gọi công cụ không truyền `baseUrl`. Phải là `http` hoặc `https`, không có truy vấn/hash.
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
  `false`: các yêu cầu không phải loopback đến các tuyến trình xem bị từ chối. `true`: trình xem từ xa được cho phép nếu đường dẫn có token là hợp lệ.
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

## Vòng đời và lưu trữ phần tạo tác

- HTML của trình xem và siêu dữ liệu nằm trong cơ sở dữ liệu `state/openclaw.sqlite` dùng chung, thuộc không gian tên blob của plugin Diffs. HTML được nén bằng gzip; SQLite chỉ lưu hàm băm SHA-256 của token URL ngẫu nhiên, không lưu chính token đó.
- Các tệp PNG/PDF đã kết xuất vẫn là các bản hiện thực hóa tạm thời trong `$TMPDIR/openclaw-diffs` vì việc phân phối qua kênh yêu cầu đường dẫn tệp. SQLite quản lý siêu dữ liệu hết hạn của chúng; không ghi tệp JSON phụ trợ nào.
- TTL mặc định của tạo phẩm: 30 phút. TTL tối đa được chấp nhận: 6 giờ.
- Quá trình dọn dẹp chạy theo cơ hội sau mỗi lệnh gọi tạo tạo phẩm. Các hàng SQLite đã hết hạn được xóa trước, sau đó là mọi thư mục PNG/PDF tương ứng.
- Một lượt quét dự phòng xóa các thư mục tạm thời không có hàng tương ứng và cũ hơn 24 giờ. Các bộ nhớ đệm cũ `meta.json`, `file-meta.json` và `viewer.html` không được nhập hoặc đọc.

## URL của trình xem và hành vi mạng

Tuyến trình xem: `/plugins/diffs/view/{artifactId}/{token}`

Tài nguyên của trình xem:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (chỉ khi diff sử dụng ngôn ngữ của gói ngôn ngữ)

Tài liệu trình xem phân giải các tài nguyên này tương đối theo URL của trình xem, vì vậy tiền tố đường dẫn `baseUrl` tùy chọn cũng được áp dụng cho các yêu cầu tài nguyên.

Thứ tự phân giải URL: `baseUrl` của lệnh gọi công cụ (sau khi xác thực nghiêm ngặt) -> `viewerBaseUrl` của plugin -> mặc định loopback `127.0.0.1`. Nếu chế độ liên kết Gateway là `custom` và `gateway.customBindHost` được đặt, máy chủ đó sẽ được dùng thay cho loopback.

Quy tắc `baseUrl`: phải là `http://` hoặc `https://`; truy vấn và hàm băm bị từ chối; cho phép origin cùng đường dẫn cơ sở tùy chọn.

## Mô hình bảo mật

<AccordionGroup>
  <Accordion title="Tăng cường bảo mật trình xem">
    - Theo mặc định chỉ dùng loopback.
    - Đường dẫn trình xem có token với quy trình xác thực nghiêm ngặt mẫu ID và token.
    - CSP của phản hồi trình xem: `default-src 'none'`; tập lệnh/tài nguyên chỉ từ chính nguồn; không có `connect-src` gửi ra ngoài.
    - Điều tiết các lần truy cập trượt từ xa khi bật truy cập từ xa: 40 lần thất bại trong 60 giây sẽ kích hoạt khóa trong 60 giây (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Tăng cường bảo mật kết xuất tệp">
    - Định tuyến yêu cầu trình duyệt chụp ảnh màn hình mặc định là từ chối.
    - Chỉ cho phép tài nguyên trình xem cục bộ từ `http://127.0.0.1/plugins/diffs/assets/*`.
    - Các yêu cầu mạng bên ngoài bị chặn.

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
  <Step title="Phương án dự phòng theo nền tảng">
    Các đường dẫn cài đặt phổ biến và tra cứu `PATH` cho Chrome, Chromium, Edge và Brave.
  </Step>
</Steps>

Thông báo lỗi thường gặp: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Khắc phục bằng cách cài đặt Chrome, Chromium, Edge hoặc Brave, hoặc đặt một trong các tùy chọn đường dẫn tệp thực thi ở trên.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi xác thực đầu vào">
    - `Provide patch or both before and after text.` -- bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
    - `Provide either patch or before/after input, not both.` -- không kết hợp các chế độ đầu vào.
    - `Invalid baseUrl: ...` -- sử dụng origin `http(s)` với đường dẫn tùy chọn, không có truy vấn/hàm băm.
    - `{field} exceeds maximum size (...)` -- giảm kích thước tải trọng.
    - Bản vá lớn bị từ chối -- giảm số lượng tệp bản vá hoặc tổng số dòng.

  </Accordion>
  <Accordion title="Khả năng truy cập trình xem">
    - Theo mặc định, URL của trình xem phân giải thành `127.0.0.1`.
    - Để truy cập từ xa, hãy đặt `viewerBaseUrl` của plugin, truyền `baseUrl` cho mỗi lệnh gọi hoặc dùng `gateway.bind=custom` với `gateway.customBindHost`.
    - Nếu `gateway.trustedProxies` bao gồm loopback cho proxy trên cùng máy chủ (ví dụ: Tailscale Serve), các yêu cầu trình xem loopback thô không có tiêu đề IP máy khách được chuyển tiếp sẽ chủ động thất bại theo thiết kế.
    - Đối với cấu trúc liên kết proxy đó, ưu tiên `mode: "file"`/`"both"` cho tệp đính kèm, hoặc chủ động bật `security.allowRemoteViewer` cùng `viewerBaseUrl` của plugin/`baseUrl` của proxy để tạo liên kết trình xem có thể chia sẻ.
    - Chỉ bật `security.allowRemoteViewer` khi có chủ đích cho phép truy cập trình xem từ bên ngoài.

  </Accordion>
  <Accordion title="Hàng các dòng không sửa đổi không có nút mở rộng">
    Đây là hành vi dự kiến đối với đầu vào bản vá thiếu ngữ cảnh có thể mở rộng; không phải lỗi trình xem.
  </Accordion>
  <Accordion title="Không tìm thấy tạo phẩm">
    - Tạo phẩm đã hết hạn do TTL.
    - Token hoặc đường dẫn đã thay đổi.
    - Quá trình dọn dẹp đã xóa dữ liệu cũ.

  </Accordion>
</AccordionGroup>

## Hướng dẫn vận hành

- Ưu tiên `mode: "view"` để review tương tác cục bộ trong canvas.
- Ưu tiên `mode: "file"` cho các kênh trò chuyện gửi ra ngoài cần tệp đính kèm.
- Giữ `allowRemoteViewer` ở trạng thái tắt trừ khi bản triển khai yêu cầu URL trình xem từ xa.
- Đặt `ttlSeconds` ngắn một cách tường minh cho các diff nhạy cảm.
- Tránh gửi bí mật trong đầu vào diff khi không cần thiết.
- Nếu kênh nén hình ảnh mạnh (ví dụ: Telegram hoặc WhatsApp), hãy ưu tiên đầu ra PDF (`fileFormat: "pdf"`).

<Note>
Công cụ kết xuất diff được hỗ trợ bởi [Diffs](https://diffs.com).
</Note>

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Plugin](/vi/tools/plugin)
- [Tổng quan về công cụ](/vi/tools)
