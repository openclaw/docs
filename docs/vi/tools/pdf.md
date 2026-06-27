---
read_when:
    - Bạn muốn phân tích các tệp PDF từ các tác nhân
    - Bạn cần các tham số và giới hạn chính xác của công cụ pdf
    - Bạn đang gỡ lỗi chế độ PDF gốc so với phương án dự phòng trích xuất
summary: Phân tích một hoặc nhiều tài liệu PDF với hỗ trợ gốc từ provider và cơ chế dự phòng trích xuất
title: Công cụ PDF
x-i18n:
    generated_at: "2026-06-27T18:18:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` phân tích một hoặc nhiều tài liệu PDF và trả về văn bản.

Hành vi nhanh:

- Chế độ nhà cung cấp gốc cho nhà cung cấp mô hình Anthropic và Google.
- Chế độ dự phòng trích xuất cho các nhà cung cấp khác (trích xuất văn bản trước, rồi ảnh trang khi cần).
- Hỗ trợ đầu vào đơn (`pdf`) hoặc nhiều (`pdfs`), tối đa 10 PDF mỗi lần gọi.

## Khả dụng

Công cụ chỉ được đăng ký khi OpenClaw có thể phân giải cấu hình mô hình có khả năng xử lý PDF cho tác nhân:

1. `agents.defaults.pdfModel`
2. dự phòng sang `agents.defaults.imageModel`
3. dự phòng sang mô hình phiên/mặc định đã phân giải của tác nhân
4. nếu các nhà cung cấp PDF gốc được hỗ trợ bằng xác thực, ưu tiên chúng trước các ứng viên dự phòng ảnh chung

Nếu không thể phân giải mô hình dùng được, công cụ `pdf` sẽ không được hiển thị.

Ghi chú về khả dụng:

- Chuỗi dự phòng nhận biết xác thực. Một `provider/model` đã cấu hình chỉ được tính nếu
  OpenClaw thực sự có thể xác thực nhà cung cấp đó cho tác nhân.
- Các nhà cung cấp PDF gốc hiện là **Anthropic** và **Google**.
- Nếu nhà cung cấp phiên/mặc định đã phân giải đã có mô hình thị giác/PDF
  được cấu hình, công cụ PDF sẽ tái sử dụng mô hình đó trước khi dự phòng sang các nhà cung cấp
  được hỗ trợ bằng xác thực khác.

## Tham chiếu đầu vào

<ParamField path="pdf" type="string">
Một đường dẫn PDF hoặc URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Nhiều đường dẫn PDF hoặc URL, tổng cộng tối đa 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Lời nhắc phân tích.
</ParamField>

<ParamField path="pages" type="string">
Bộ lọc trang như `1-5` hoặc `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Mật khẩu cho PDF được mã hóa trong chế độ dự phòng trích xuất.
</ParamField>

<ParamField path="model" type="string">
Ghi đè mô hình tùy chọn ở dạng `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Giới hạn kích thước mỗi PDF tính bằng MB. Mặc định là `agents.defaults.pdfMaxBytesMb` hoặc `10`.
</ParamField>

Ghi chú đầu vào:

- `pdf` và `pdfs` được hợp nhất và loại bỏ trùng lặp trước khi tải.
- Nếu không cung cấp đầu vào PDF, công cụ sẽ báo lỗi.
- `pages` được phân tích dưới dạng số trang bắt đầu từ 1, được loại bỏ trùng lặp, sắp xếp và giới hạn theo số trang tối đa đã cấu hình.
- `password` áp dụng cho mọi PDF trong yêu cầu và chỉ được chế độ dự phòng trích xuất sử dụng.
- `maxBytesMb` mặc định là `agents.defaults.pdfMaxBytesMb` hoặc `10`.

## Tham chiếu PDF được hỗ trợ

- đường dẫn tệp cục bộ (bao gồm mở rộng `~`)
- URL `file://`
- URL `http://` và `https://`
- tham chiếu đầu vào do OpenClaw quản lý như `media://inbound/<id>`

Ghi chú tham chiếu:

- Các lược đồ URI khác (ví dụ `ftp://`) bị từ chối với `unsupported_pdf_reference`.
- Trong chế độ hộp cát, URL `http(s)` từ xa bị từ chối.
- Khi bật chính sách tệp chỉ trong không gian làm việc, các đường dẫn tệp cục bộ bên ngoài gốc được phép sẽ bị từ chối.
- Tham chiếu đầu vào được quản lý và đường dẫn được phát lại trong kho phương tiện đầu vào của OpenClaw được cho phép với chính sách tệp chỉ trong không gian làm việc.

## Chế độ thực thi

### Chế độ nhà cung cấp gốc

Chế độ gốc được dùng cho nhà cung cấp `anthropic` và `google`.
Công cụ gửi byte PDF thô trực tiếp đến API của nhà cung cấp.

Giới hạn chế độ gốc:

- `pages` không được hỗ trợ. Nếu đặt, công cụ sẽ trả về lỗi.
- `password` không được hỗ trợ. Dùng mô hình không gốc để phân tích PDF được mã hóa.
- Đầu vào nhiều PDF được hỗ trợ; mỗi PDF được gửi dưới dạng khối tài liệu gốc /
  phần PDF nội tuyến trước lời nhắc.

### Chế độ dự phòng trích xuất

Chế độ dự phòng được dùng cho các nhà cung cấp không gốc.

Luồng:

1. Trích xuất văn bản từ các trang đã chọn (tối đa `agents.defaults.pdfMaxPages`, mặc định `20`).
2. Nếu độ dài văn bản đã trích xuất dưới `200` ký tự, kết xuất các trang đã chọn thành ảnh PNG và đưa chúng vào.
3. Gửi nội dung đã trích xuất cùng lời nhắc đến mô hình đã chọn.

Chi tiết dự phòng:

- Trích xuất ảnh trang dùng ngân sách pixel là `4,000,000`.
- PDF được mã hóa có thể được mở bằng tham số cấp cao nhất `password`.
- Nếu mô hình đích không hỗ trợ đầu vào ảnh và không có văn bản có thể trích xuất, công cụ sẽ báo lỗi.
- Nếu trích xuất văn bản thành công nhưng trích xuất ảnh sẽ yêu cầu thị giác trên một
  mô hình chỉ văn bản, OpenClaw sẽ bỏ ảnh đã kết xuất và tiếp tục với
  văn bản đã trích xuất.
- Dự phòng trích xuất dùng Plugin `document-extract` được đóng gói. Plugin sở hữu
  `clawpdf`, cung cấp trích xuất văn bản và kết xuất ảnh thông qua PDFium
  WebAssembly.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) để biết đầy đủ chi tiết trường.

## Chi tiết đầu ra

Công cụ trả về văn bản trong `content[0].text` và siêu dữ liệu có cấu trúc trong `details`.

Các trường `details` phổ biến:

- `model`: tham chiếu mô hình đã phân giải (`provider/model`)
- `native`: `true` cho chế độ nhà cung cấp gốc, `false` cho dự phòng
- `attempts`: các lần thử dự phòng thất bại trước khi thành công

Trường đường dẫn:

- đầu vào một PDF: `details.pdf`
- đầu vào nhiều PDF: `details.pdfs[]` với các mục `pdf`
- siêu dữ liệu ghi lại đường dẫn hộp cát (khi áp dụng): `rewrittenFrom`

## Hành vi lỗi

- Thiếu đầu vào PDF: ném `pdf required: provide a path or URL to a PDF document`
- Quá nhiều PDF: trả về lỗi có cấu trúc trong `details.error = "too_many_pdfs"`
- Lược đồ tham chiếu không được hỗ trợ: trả về `details.error = "unsupported_pdf_reference"`
- Chế độ gốc với `pages`: ném lỗi rõ ràng `pages is not supported with native PDF providers`

## Ví dụ

Một PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Nhiều PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Mô hình dự phòng có lọc trang:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF được mã hóa với dự phòng trích xuất:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Liên quan

- [Tổng quan công cụ](/vi/tools) - tất cả công cụ tác nhân hiện có
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - cấu hình pdfMaxBytesMb và pdfMaxPages
