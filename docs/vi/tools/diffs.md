---
read_when:
    - Bạn muốn các agent hiển thị những chỉnh sửa mã hoặc Markdown dưới dạng diff
    - Bạn muốn một URL trình xem sẵn sàng cho canvas hoặc một tệp diff đã kết xuất
    - Bạn cần các sản phẩm diff tạm thời, có kiểm soát và thiết lập mặc định an toàn
sidebarTitle: Diffs
summary: Trình xem diff chỉ đọc và trình kết xuất tệp dành cho tác nhân (công cụ plugin tùy chọn)
title: Khác biệt
x-i18n:
    generated_at: "2026-07-16T15:19:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` là một công cụ Plugin tích hợp tùy chọn, biến văn bản trước/sau hoặc một bản vá hợp nhất thành thành phần so sánh khác biệt chỉ đọc. Công cụ cũng thêm phần hướng dẫn ngắn cho tác tử vào đầu lời nhắc hệ thống và đi kèm một Skills bổ trợ để cung cấp hướng dẫn đầy đủ hơn.

Đầu vào: văn bản `before` + `after`, hoặc một `patch` hợp nhất (loại trừ lẫn nhau).

Đầu ra: URL trình xem Gateway để trình bày trên canvas, đường dẫn tệp PNG/PDF đã kết xuất để gửi qua tin nhắn, hoặc cả hai.

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
        Luồng ưu tiên canvas: tác tử gọi `diffs` với `mode: "view"` và mở `details.viewerUrl` bằng `canvas present`.
      </Tab>
      <Tab title="file">
        Gửi tệp qua cuộc trò chuyện: tác tử gọi `diffs` với `mode: "file"` và gửi `details.filePath` cùng `message` bằng `path` hoặc `filePath`.
      </Tab>
      <Tab title="both">
        Kết hợp (mặc định): tác tử gọi `diffs` với `mode: "both"` để nhận cả hai thành phần trong một lần gọi.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Tắt hướng dẫn hệ thống tích hợp

Để giữ công cụ nhưng bỏ phần hướng dẫn được thêm vào đầu lời nhắc hệ thống, hãy đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

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

Cấu hình này chặn hook `before_prompt_build` của Plugin nhưng vẫn duy trì khả dụng của công cụ và Skills. Để tắt cả hướng dẫn lẫn công cụ, hãy tắt Plugin.

## Tham chiếu đầu vào của công cụ

Tất cả các trường đều là tùy chọn, trừ khi có ghi chú khác.

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
  Tên tệp hiển thị cho chế độ trước/sau.
</ParamField>
<ParamField path="lang" type="string">
  Gợi ý ghi đè ngôn ngữ cho chế độ trước/sau. Các giá trị không xác định và ngôn ngữ nằm ngoài tập hợp mặc định của trình xem sẽ quay về văn bản thuần túy, trừ khi đã cài đặt Plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Ghi đè tiêu đề trình xem.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Chế độ đầu ra. Mặc định là giá trị mặc định `defaults.mode` của Plugin (`both`). Bí danh không còn được khuyến nghị: `"image"` hoạt động giống hệt `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Chủ đề trình xem. Mặc định là giá trị mặc định `defaults.theme` của Plugin.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Bố cục diff. Mặc định là giá trị mặc định `defaults.layout` của Plugin.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Mở rộng các phần không thay đổi khi có đầy đủ ngữ cảnh. Chỉ là tùy chọn cho từng lần gọi (không phải khóa mặc định của Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Định dạng tệp đã kết xuất. Mặc định là giá trị mặc định `defaults.fileFormat` của Plugin.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Thiết lập sẵn chất lượng để kết xuất PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Ghi đè tỷ lệ thiết bị (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Chiều rộng kết xuất tối đa tính bằng pixel CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL của thành phần tính bằng giây cho đầu ra trình xem và tệp độc lập. Tối đa `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Ghi đè nguồn URL của trình xem. Ghi đè `viewerBaseUrl` của Plugin. Phải là `http` hoặc `https`, không có truy vấn/hash.
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

Ngôn ngữ tích hợp:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` và `toml`.

Các bí danh phổ biến (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, v.v.) được chuẩn hóa thành các ngôn ngữ đó.

Cài đặt Plugin Diff Viewer Language Pack để có thêm ngôn ngữ (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff và các ngôn ngữ khác):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Khi không có gói này, các ngôn ngữ không được hỗ trợ vẫn được kết xuất dưới dạng văn bản thuần túy dễ đọc. Xem [Plugin Diffs Language Pack](/vi/plugins/reference/diffs-language-pack) và [các ngôn ngữ Shiki](https://shiki.style/languages) để biết danh mục thượng nguồn.

## Hợp đồng chi tiết đầu ra

Tất cả kết quả thành công đều bao gồm `changed`: đầu vào trước/sau giống hệt nhau sẽ trả về `false` mà không tạo thành phần; kết quả đã kết xuất trả về `true`.

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
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` khi có)

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
| `"file"` | Chỉ các trường tệp, không có thành phần trình xem.                                                           |
| `"both"` | Các trường trình xem cộng với các trường tệp. Nếu kết xuất tệp thất bại, trình xem vẫn trả về cùng `fileError`. |

### Các phần không thay đổi được thu gọn

Trình xem hiển thị các hàng như `N unmodified lines`. Các điều khiển mở rộng chỉ xuất hiện khi diff đã kết xuất có dữ liệu ngữ cảnh có thể mở rộng (thường có đối với đầu vào trước/sau). Nhiều bản vá hợp nhất bỏ qua phần nội dung ngữ cảnh trong các hunk, vì vậy hàng có thể xuất hiện mà không có điều khiển mở rộng -- đây là hành vi dự kiến, không phải lỗi. `expandUnchanged` chỉ áp dụng khi tồn tại ngữ cảnh có thể mở rộng.

### Điều hướng nhiều tệp

Các bản vá tác động đến nhiều hơn một tệp bắt đầu bằng thẻ tóm tắt tệp đã thay đổi: tổng số `+N` / `-N`, số lượng theo từng tệp, huy hiệu đã thêm/đã xóa/đã đổi tên và các liên kết neo để chuyển đến từng tệp. Các tệp PNG/PDF đã kết xuất vẫn giữ số lượng trong tiêu đề của từng tệp nhưng loại bỏ các nút chuyển đổi chế độ xem tương tác vì những điều khiển đó không hoạt động trong tệp tĩnh.

## Giá trị mặc định của Plugin

Đặt các giá trị mặc định áp dụng trên toàn Plugin trong `~/.openclaw/openclaw.json`:

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

Các khóa `defaults` được hỗ trợ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Các tham số gọi công cụ được chỉ định rõ ràng sẽ ghi đè các giá trị này.

### Cấu hình URL trình xem cố định

<ParamField path="viewerBaseUrl" type="string">
  Giá trị dự phòng do Plugin sở hữu cho các liên kết trình xem được trả về khi lệnh gọi công cụ không truyền `baseUrl`. Phải là `http` hoặc `https`, không có truy vấn/hash.
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
  `false`: các yêu cầu không phải loopback đến tuyến trình xem sẽ bị từ chối. `true`: trình xem từ xa được cho phép nếu đường dẫn có token hợp lệ.
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

## Vòng đời và lưu trữ thành phần

- Các thành phần nằm trong `$TMPDIR/openclaw-diffs`.
- Siêu dữ liệu trình xem lưu một ID thành phần ngẫu nhiên gồm 20 ký tự hex, một token ngẫu nhiên gồm 48 ký tự hex, `createdAt`/`expiresAt` và đường dẫn `viewer.html` đã lưu.
- TTL mặc định của thành phần: 30 phút. TTL tối đa được chấp nhận: 6 giờ.
- Việc dọn dẹp chạy theo cơ hội sau mỗi lần gọi tạo thành phần; các thành phần hết hạn sẽ bị xóa.
- Quá trình quét dự phòng loại bỏ các thư mục cũ hơn 24 giờ khi thiếu siêu dữ liệu.

## URL trình xem và hành vi mạng

Tuyến trình xem: `/plugins/diffs/view/{artifactId}/{token}`

Tài nguyên trình xem:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (chỉ khi phần diff sử dụng ngôn ngữ của gói ngôn ngữ)

Tài liệu trình xem phân giải các tài nguyên này tương đối theo URL của trình xem, vì vậy tiền tố đường dẫn `baseUrl` tùy chọn cũng được áp dụng cho các yêu cầu tài nguyên.

Thứ tự phân giải URL: `baseUrl` của lệnh gọi công cụ (sau khi xác thực nghiêm ngặt) -> `viewerBaseUrl` của plugin -> `127.0.0.1` loopback mặc định. Nếu chế độ liên kết Gateway là `custom` và `gateway.customBindHost` được đặt, máy chủ đó sẽ được sử dụng thay cho loopback.

Quy tắc `baseUrl`: phải là `http://` hoặc `https://`; truy vấn và hash bị từ chối; cho phép origin cùng đường dẫn cơ sở tùy chọn.

## Mô hình bảo mật

<AccordionGroup>
  <Accordion title="Tăng cường bảo mật trình xem">
    - Theo mặc định chỉ cho phép loopback.
    - Đường dẫn trình xem được mã hóa bằng token, với việc xác thực nghiêm ngặt mẫu ID và token.
    - CSP của phản hồi trình xem: `default-src 'none'`; tập lệnh/tài nguyên chỉ từ chính nguồn; không có `connect-src` đi ra ngoài.
    - Giới hạn tốc độ khi không tìm thấy từ xa nếu quyền truy cập từ xa được bật: 40 lần thất bại trong 60 giây sẽ kích hoạt khóa trong 60 giây (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Tăng cường bảo mật kết xuất tệp">
    - Định tuyến yêu cầu của trình duyệt chụp ảnh màn hình mặc định từ chối mọi yêu cầu.
    - Chỉ cho phép tài nguyên trình xem cục bộ từ `http://127.0.0.1/plugins/diffs/assets/*`.
    - Các yêu cầu mạng bên ngoài bị chặn.

  </Accordion>
</AccordionGroup>

## Yêu cầu trình duyệt cho chế độ tệp

`mode: "file"` và `mode: "both"` cần một trình duyệt tương thích với Chromium.

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
    Các đường dẫn cài đặt phổ biến và phép tra cứu `PATH` cho Chrome, Chromium, Edge và Brave.
  </Step>
</Steps>

Thông báo lỗi thường gặp: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Khắc phục bằng cách cài đặt Chrome, Chromium, Edge hoặc Brave, hoặc đặt một trong các tùy chọn đường dẫn tệp thực thi ở trên.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Lỗi xác thực đầu vào">
    - `Provide patch or both before and after text.` -- bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
    - `Provide either patch or before/after input, not both.` -- không kết hợp các chế độ đầu vào.
    - `Invalid baseUrl: ...` -- sử dụng origin `http(s)` với đường dẫn tùy chọn, không có truy vấn/hash.
    - `{field} exceeds maximum size (...)` -- giảm kích thước tải trọng.
    - Bản vá lớn bị từ chối -- giảm số lượng tệp bản vá hoặc tổng số dòng.

  </Accordion>
  <Accordion title="Khả năng truy cập trình xem">
    - Theo mặc định, URL trình xem phân giải thành `127.0.0.1`.
    - Để truy cập từ xa, hãy đặt `viewerBaseUrl` của plugin, truyền `baseUrl` cho mỗi lệnh gọi hoặc sử dụng `gateway.bind=custom` cùng `gateway.customBindHost`.
    - Nếu `gateway.trustedProxies` bao gồm loopback cho proxy trên cùng máy chủ (ví dụ Tailscale Serve), các yêu cầu trình xem loopback thô không có tiêu đề IP máy khách được chuyển tiếp sẽ chủ động thất bại theo thiết kế.
    - Đối với cấu trúc liên kết proxy đó, nên dùng `mode: "file"`/`"both"` cho tệp đính kèm, hoặc chủ động bật `security.allowRemoteViewer` cùng `viewerBaseUrl` của plugin/`baseUrl` của proxy để có liên kết trình xem có thể chia sẻ.
    - Chỉ bật `security.allowRemoteViewer` khi chủ đích cho phép truy cập trình xem từ bên ngoài.

  </Accordion>
  <Accordion title="Hàng dòng không sửa đổi không có nút mở rộng">
    Đây là hành vi dự kiến đối với đầu vào bản vá không có ngữ cảnh có thể mở rộng; không phải lỗi trình xem.
  </Accordion>
  <Accordion title="Không tìm thấy hiện vật">
    - Hiện vật đã hết hạn do TTL.
    - Token hoặc đường dẫn đã thay đổi.
    - Quá trình dọn dẹp đã xóa dữ liệu cũ.

  </Accordion>
</AccordionGroup>

## Hướng dẫn vận hành

- Nên dùng `mode: "view"` để đánh giá tương tác cục bộ trong canvas.
- Nên dùng `mode: "file"` cho các kênh trò chuyện gửi đi cần tệp đính kèm.
- Giữ `allowRemoteViewer` ở trạng thái tắt trừ khi môi trường triển khai cần URL trình xem từ xa.
- Đặt `ttlSeconds` ngắn và rõ ràng cho các phần diff nhạy cảm.
- Tránh gửi bí mật trong đầu vào diff khi không cần thiết.
- Nếu kênh nén hình ảnh mạnh (ví dụ Telegram hoặc WhatsApp), nên dùng đầu ra PDF (`fileFormat: "pdf"`).

<Note>
Công cụ kết xuất diff được hỗ trợ bởi [Diffs](https://diffs.com).
</Note>

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Plugin](/vi/tools/plugin)
- [Tổng quan về công cụ](/vi/tools)
