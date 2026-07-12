---
read_when:
    - Bạn muốn phân tích tệp PDF từ các tác nhân
    - Bạn cần các tham số và giới hạn chính xác của công cụ PDF
    - Bạn đang gỡ lỗi chế độ PDF gốc so với phương án dự phòng trích xuất
summary: Phân tích một hoặc nhiều tài liệu PDF bằng khả năng hỗ trợ gốc của nhà cung cấp và cơ chế dự phòng trích xuất
title: Công cụ PDF
x-i18n:
    generated_at: "2026-07-12T08:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` phân tích một hoặc nhiều tài liệu PDF và trả về văn bản. Công cụ này sử dụng đầu vào tài liệu gốc trên các mô hình Anthropic và Google, đồng thời chuyển sang phương án trích xuất văn bản/hình ảnh cho mọi nhà cung cấp khác.

## Khả dụng

Công cụ chỉ được đăng ký khi OpenClaw có thể phân giải một mô hình hỗ trợ PDF cho tác nhân. Thứ tự phân giải:

1. `agents.defaults.pdfModel` (mô hình chính/dự phòng được chỉ định rõ)
2. `agents.defaults.imageModel` (mô hình chính/dự phòng được chỉ định rõ)
3. Mô hình phiên/mặc định đã phân giải của tác nhân, nếu nhà cung cấp của mô hình đó hỗ trợ đầu vào PDF gốc (Anthropic, Google) hoặc đã cấu hình mô hình thị giác
4. Các nhà cung cấp hỗ trợ hình ảnh/thị giác được tự động phát hiện và có thông tin xác thực khả dụng, ưu tiên nhà cung cấp hỗ trợ PDF gốc trước

Thông tin xác thực của mọi mô hình dự phòng đều được kiểm tra trước khi sử dụng, vì vậy một `provider/model` đã cấu hình chỉ được tính là khả dụng nếu OpenClaw có thể xác thực nhà cung cấp đó cho tác nhân. Nếu không phân giải được mô hình khả dụng nào, công cụ `pdf` sẽ không được cung cấp.

## Tham chiếu đầu vào

<ParamField path="pdf" type="string">
Một đường dẫn hoặc URL đến PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Nhiều đường dẫn hoặc URL đến PDF, tổng cộng tối đa 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Lời nhắc phân tích.
</ParamField>

<ParamField path="pages" type="string">
Bộ lọc trang như `1-5` hoặc `1,3,7-9`. Không được hỗ trợ trong chế độ nhà cung cấp gốc.
</ParamField>

<ParamField path="password" type="string">
Mật khẩu cho các PDF được mã hóa. Áp dụng cho mọi PDF trong yêu cầu; chỉ được sử dụng trong chế độ trích xuất dự phòng.
</ParamField>

<ParamField path="model" type="string">
Tùy chọn ghi đè mô hình theo dạng `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Giới hạn kích thước cho mỗi PDF tính bằng MB. Mặc định là `agents.defaults.pdfMaxBytesMb`, hoặc `10` nếu chưa đặt.
</ParamField>

Lưu ý:

- `pdf` và `pdfs` được hợp nhất và loại bỏ mục trùng lặp trước khi tải; bắt buộc phải có ít nhất một mục.
- `pages` được phân tích thành số trang bắt đầu từ 1, loại bỏ mục trùng lặp, sắp xếp và giới hạn theo `agents.defaults.pdfMaxPages` (mặc định `20`). Phạm vi không khớp với trang hợp lệ nào sẽ gây lỗi trước khi gọi mô hình.

## Các tham chiếu PDF được hỗ trợ

- Đường dẫn tệp cục bộ (bao gồm mở rộng `~`)
- URL `file://`
- URL `http://` và `https://`
- Tham chiếu đầu vào do OpenClaw quản lý, chẳng hạn như `media://inbound/<id>`

Các lược đồ URI khác (ví dụ `ftp://`) trả về `details.error = "unsupported_pdf_reference"`. URL `http(s)` từ xa bị từ chối khi công cụ chạy trong môi trường hộp cát. Khi bật chính sách tệp chỉ dành cho không gian làm việc, các đường dẫn cục bộ nằm ngoài những thư mục gốc được phép sẽ bị từ chối; các tham chiếu đầu vào được quản lý và đường dẫn được phát lại trong kho phương tiện đầu vào của OpenClaw vẫn được phép.

## Chế độ thực thi

### Chế độ nhà cung cấp gốc

Được sử dụng cho nhà cung cấp `anthropic` và `google` (hai nhà cung cấp duy nhất hiện khai báo hỗ trợ tài liệu PDF gốc). Các byte PDF thô được gửi trực tiếp đến API của nhà cung cấp dưới dạng tài liệu gốc/phần PDF nội tuyến cho mỗi tệp.

Giới hạn:

- `pages` không được hỗ trợ; nếu được đặt, công cụ sẽ phát sinh lỗi `pages is not supported with native PDF providers`.
- `password` không được hỗ trợ; nếu được đặt, công cụ sẽ phát sinh lỗi `password is not supported with native PDF providers`. Hãy sử dụng mô hình không gốc cho các PDF được mã hóa.

### Chế độ trích xuất dự phòng

Được sử dụng cho mọi nhà cung cấp khác.

1. Trích xuất văn bản từ các trang đã chọn (tối đa `agents.defaults.pdfMaxPages`, mặc định `20`) thông qua plugin `document-extract` đi kèm, sử dụng gói `clawpdf` (PDFium WebAssembly) để trích xuất văn bản và hình ảnh.
2. Nếu văn bản được trích xuất ngắn hơn `200` ký tự, kết xuất các trang đó thành hình ảnh PNG. Ngân sách kết xuất là tổng cộng `4,000,000` pixel, dùng chung cho tất cả các trang cần hình ảnh (được phân bổ theo tỷ lệ cho mỗi trang còn lại, không phải riêng từng trang), vì vậy các trang đã có đủ văn bản sẽ hoàn toàn bỏ qua bước kết xuất.
3. Gửi văn bản được trích xuất (và mọi hình ảnh đã kết xuất) cùng lời nhắc đến mô hình đã chọn.

Chi tiết:

- Các PDF được mã hóa được mở bằng tham số `password` cấp cao nhất.
- Nếu mô hình không hỗ trợ đầu vào hình ảnh và không có văn bản nào có thể trích xuất, công cụ sẽ báo lỗi.
- Nếu kết xuất hình ảnh thất bại, OpenClaw sẽ loại bỏ hình ảnh và tiếp tục với văn bản được trích xuất.
- Nếu mô hình đích chỉ hỗ trợ văn bản và quá trình trích xuất tạo ra hình ảnh, OpenClaw sẽ loại bỏ hình ảnh và chỉ gửi văn bản.

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

| Khóa                            | Mặc định   | Ý nghĩa                                                                                               |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | chưa đặt   | Các mô hình PDF chính/dự phòng được chỉ định rõ; dự phòng sang `imageModel`, sau đó là mô hình phiên. |
| `agents.defaults.pdfMaxBytesMb` | `10`       | Giới hạn kích thước cho mỗi PDF tính bằng MB.                                                         |
| `agents.defaults.pdfMaxPages`   | `20`       | Số trang tối đa được xử lý cho mỗi PDF.                                                               |

Xem [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) để biết đầy đủ chi tiết về các trường.

## Chi tiết đầu ra

Công cụ trả về văn bản trong `content[0].text` và siêu dữ liệu có cấu trúc trong `details`.

Các trường `details` thường gặp:

- `model`: tham chiếu mô hình đã phân giải (`provider/model`)
- `native`: `true` đối với chế độ nhà cung cấp gốc, `false` đối với chế độ dự phòng
- `attempts`: các lần thử dự phòng đã thất bại trước khi thành công

Các trường đường dẫn:

- Đầu vào một PDF: `details.pdf`
- Đầu vào nhiều PDF: `details.pdfs[]` với các mục `pdf`
- Siêu dữ liệu ghi lại đường dẫn trong hộp cát (khi áp dụng): `rewrittenFrom`

## Hành vi khi có lỗi

| Điều kiện                          | Kết quả                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| Không có đầu vào PDF               | Phát sinh lỗi `pdf required: provide a path or URL to a PDF document` |
| Nhiều hơn 10 PDF                   | `details.error = "too_many_pdfs"`                              |
| Lược đồ tham chiếu không được hỗ trợ | `details.error = "unsupported_pdf_reference"`                  |
| `pages` với nhà cung cấp gốc       | Phát sinh lỗi `pages is not supported with native PDF providers` |
| `password` với nhà cung cấp gốc    | Phát sinh lỗi `password is not supported with native PDF providers` |

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

PDF được mã hóa với phương án trích xuất dự phòng:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ tác nhân hiện có
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - cấu hình pdfMaxBytesMb và pdfMaxPages
