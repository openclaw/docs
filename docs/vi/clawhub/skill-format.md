---
read_when:
    - Phát hành Skills
    - Gỡ lỗi các lỗi xuất bản
summary: Định dạng thư mục Skills, các tệp bắt buộc, loại tệp được phép và các giới hạn.
x-i18n:
    generated_at: "2026-07-16T14:11:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Định dạng skill

## Trên ổ đĩa

Một skill là một thư mục.

Bắt buộc:

- `SKILL.md` (hoặc `skill.md`; định dạng cũ `skills.md` cũng được chấp nhận)

Tùy chọn:

- mọi tệp hỗ trợ _dạng văn bản_ (xem “Tệp được phép”)
- `.clawhubignore` (các mẫu bỏ qua khi xuất bản, định dạng cũ `.clawdhubignore`)
- `.gitignore` (cũng được áp dụng)

## Nhập từ GitHub

Trình nhập GitHub trên web nghiêm ngặt hơn thao tác xuất bản/đồng bộ cục bộ. Trình này chỉ phát hiện
các tệp `SKILL.md` hoặc tệp định dạng cũ `skills.md` trong những kho lưu trữ công khai, không phải bản fork và thuộc sở hữu của
tài khoản GitHub đang đăng nhập. Trình này không nhập kho lưu trữ riêng tư, bản fork,
kho lưu trữ đã lưu trữ/vô hiệu hóa hoặc kho lưu trữ công khai của bên thứ ba.

Siêu dữ liệu cài đặt cục bộ (do CLI ghi):

- `<skill>/.clawhub/origin.json` (định dạng cũ `.clawdhub`)

Trạng thái cài đặt trong thư mục làm việc (do CLI ghi):

- `<workdir>/.clawhub/lock.json` (định dạng cũ `.clawdhub`)

## `SKILL.md`

- Markdown với phần frontmatter YAML tùy chọn.
- Máy chủ trích xuất siêu dữ liệu từ frontmatter trong quá trình xuất bản.
- `description` được dùng làm phần tóm tắt skill trong giao diện người dùng/tìm kiếm.

Đối với Agent Skills có tính di động, `name` phải khớp với thư mục mẹ và sử dụng
1–64 chữ cái thường, chữ số hoặc dấu gạch nối. ClawHub tách biệt slug có thể định tuyến và
tên hiển thị trong danh mục, vì vậy các tên hiện có từ những ứng dụng khách khác vẫn
có thể xuất bản và không bị âm thầm viết lại. Danh sách danh mục có thể rút gọn tên dài
khi hiển thị mà không thay đổi tên được lưu trữ.

## Siêu dữ liệu frontmatter

Siêu dữ liệu skill được khai báo trong frontmatter YAML ở đầu tệp `SKILL.md`. Phần này cho registry (và quy trình phân tích bảo mật) biết skill cần gì để chạy.

### Frontmatter cơ bản

```yaml
---
name: my-skill
description: Tóm tắt ngắn về chức năng của skill này.
version: 1.0.0
---
```

### Siêu dữ liệu runtime (`metadata.openclaw`)

Khai báo các yêu cầu runtime của skill trong `metadata.openclaw` (bí danh: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Quản lý tác vụ qua API Todoist.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Dùng `requires.env` cho các biến môi trường bắt buộc phải tồn tại trước khi skill có thể chạy. Dùng `envVars` khi cần siêu dữ liệu cho từng biến, bao gồm các biến tùy chọn với `required: false`.

### Tham chiếu đầy đủ các trường

| Trường              | Kiểu       | Mô tả                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Các biến môi trường bắt buộc mà skill yêu cầu.                                                                                           |
| `requires.bins`    | `string[]` | Các tệp thực thi CLI bắt buộc phải được cài đặt đầy đủ.                                                                                                     |
| `requires.anyBins` | `string[]` | Các tệp thực thi CLI mà ít nhất một tệp phải tồn tại.                                                                                                  |
| `requires.config`  | `string[]` | Các đường dẫn tệp cấu hình mà skill đọc.                                                                                                          |
| `primaryEnv`       | `string`   | Biến môi trường chứa thông tin xác thực chính của skill.                                                                                                  |
| `envVars`          | `array`    | Khai báo biến môi trường với `name`, `required` tùy chọn và `description` tùy chọn. Đặt `required: false` cho các biến môi trường tùy chọn. |
| `always`           | `boolean`  | Nếu `true`, skill luôn hoạt động (không cần cài đặt rõ ràng).                                                                              |
| `skillKey`         | `string`   | Ghi đè khóa gọi của skill.                                                                                                         |
| `emoji`            | `string`   | Emoji hiển thị cho skill.                                                                                                                 |
| `homepage`         | `string`   | URL đến trang chủ hoặc tài liệu của skill.                                                                                                         |
| `os`               | `string[]` | Các giới hạn về hệ điều hành (ví dụ: `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Thông số cài đặt cho các phần phụ thuộc (xem bên dưới).                                                                                                  |
| `nix`              | `object`   | Thông số Plugin Nix (xem README).                                                                                                                |
| `config`           | `object`   | Thông số cấu hình Clawdbot (xem README).                                                                                                           |

### Thông số cài đặt

Nếu skill cần cài đặt các phần phụ thuộc, hãy khai báo chúng trong mảng `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Các loại cài đặt được hỗ trợ: `brew`, `node`, `go`, `uv`.

### Biến môi trường tùy chọn

Khai báo các biến môi trường tùy chọn trong `metadata.openclaw.envVars` và đặt `required: false`. Không thêm các mục tùy chọn vào `requires.env`, vì `requires.env` có nghĩa là skill không thể chạy nếu thiếu chúng.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist dùng cho các yêu cầu đã xác thực.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID dự án mặc định tùy chọn khi người dùng không chỉ định.
```

### Tại sao điều này quan trọng

Quy trình phân tích bảo mật của ClawHub kiểm tra xem những gì skill khai báo có khớp với những gì skill thực sự thực hiện hay không. Nếu mã tham chiếu đến `TODOIST_API_KEY` nhưng frontmatter không khai báo biến đó trong `requires.env`, `primaryEnv` hoặc `envVars`, quy trình phân tích sẽ gắn cờ siêu dữ liệu không khớp. Việc duy trì khai báo chính xác giúp skill vượt qua quá trình xét duyệt và giúp người dùng hiểu những gì họ đang cài đặt.

### Ví dụ: frontmatter hoàn chỉnh

```yaml
---
name: todoist-cli
description: Quản lý tác vụ, dự án và nhãn Todoist từ dòng lệnh.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID dự án mặc định tùy chọn.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Tệp được phép

Chỉ các tệp “dạng văn bản” được chấp nhận khi xuất bản.

- Danh sách phần mở rộng được phép nằm trong `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Các tệp tập lệnh vẫn được quét sau khi tải lên; các tệp PowerShell `.ps1`, `.psm1` và `.psd1` được chấp nhận dưới dạng văn bản.
- Các loại nội dung bắt đầu bằng `text/` được coi là văn bản; ngoài ra còn có một danh sách cho phép nhỏ (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Giới hạn (phía máy chủ):

- Tổng kích thước gói: 50MB.
- Văn bản embedding bao gồm `SKILL.md` + tối đa khoảng 40 tệp không phải `.md` (giới hạn theo khả năng tốt nhất).

## Slug

- Theo mặc định, được tạo từ tên thư mục.
- Phạm vi gói phải khớp chính xác với định danh nhà xuất bản ClawHub. Định danh nhà xuất bản có thể sử dụng chữ cái thường, chữ số, dấu gạch nối, dấu chấm và dấu gạch dưới; phải bắt đầu và kết thúc bằng một chữ cái thường hoặc chữ số.
- Slug của gói phải viết thường và an toàn với npm, ví dụ `@example.tools/demo-plugin` hoặc `demo-plugin`.

## Phiên bản + thẻ

- Mỗi lần xuất bản tạo một phiên bản mới (semver).
- Thẻ là con trỏ chuỗi đến một phiên bản; `latest` thường được sử dụng.

## Giấy phép

- Tất cả skill được xuất bản trên ClawHub đều được cấp phép theo `MIT-0`.
- Bất kỳ ai cũng có thể sử dụng, sửa đổi và phân phối lại các skill đã xuất bản, kể cả cho mục đích thương mại.
- Không bắt buộc ghi công.
- Không thêm các điều khoản cấp phép xung đột trong `SKILL.md`; ClawHub không hỗ trợ ghi đè giấy phép cho từng skill.

## Skill trả phí

- ClawHub không hỗ trợ skill trả phí, định giá theo từng skill, tường phí hoặc chia sẻ doanh thu.
- Không thêm siêu dữ liệu định giá vào `SKILL.md`; đây không phải là một phần của định dạng skill và sẽ không khiến skill đã xuất bản trở thành skill trả phí.
- Nếu skill tích hợp với một dịch vụ trả phí của bên thứ ba, hãy ghi rõ chi phí bên ngoài và tài khoản bắt buộc trong hướng dẫn của skill và phần khai báo biến môi trường (`requires.env` cho các biến bắt buộc hoặc `envVars` với `required: false` cho các biến tùy chọn).
