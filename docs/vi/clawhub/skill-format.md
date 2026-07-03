---
read_when:
    - Xuất bản Skills
    - Gỡ lỗi lỗi phát hành
summary: Định dạng thư mục Skills, các tệp bắt buộc, loại tệp được phép, giới hạn.
x-i18n:
    generated_at: "2026-07-03T17:28:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Định dạng skill

## Trên đĩa

Một skill là một thư mục.

Bắt buộc:

- `SKILL.md` (hoặc `skill.md`; `skills.md` cũ cũng được chấp nhận)

Tùy chọn:

- mọi tệp hỗ trợ _dạng văn bản_ (xem “Tệp được phép”)
- `.clawhubignore` (các mẫu bỏ qua khi xuất bản, `.clawdhubignore` cũ)
- `.gitignore` (cũng được tôn trọng)

## Nhập từ GitHub

Trình nhập GitHub trên web nghiêm ngặt hơn publish/sync cục bộ. Nó chỉ phát hiện
các tệp `SKILL.md` hoặc `skills.md` cũ trong các kho công khai, không phải fork, thuộc sở hữu của
tài khoản GitHub đã đăng nhập. Nó không nhập kho riêng tư, fork,
kho đã lưu trữ/bị vô hiệu hóa, hoặc kho công khai của bên thứ ba.

Siêu dữ liệu cài đặt cục bộ (do CLI ghi):

- `<skill>/.clawhub/origin.json` (`.clawdhub` cũ)

Trạng thái cài đặt workdir (do CLI ghi):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ)

## `SKILL.md`

- Markdown với YAML frontmatter tùy chọn.
- Máy chủ trích xuất siêu dữ liệu từ frontmatter trong quá trình xuất bản.
- `description` được dùng làm phần tóm tắt skill trong UI/tìm kiếm.

## Siêu dữ liệu frontmatter

Siêu dữ liệu skill được khai báo trong YAML frontmatter ở đầu `SKILL.md` của bạn. Phần này cho registry (và phân tích bảo mật) biết skill của bạn cần gì để chạy.

### Frontmatter cơ bản

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Siêu dữ liệu runtime (`metadata.openclaw`)

Khai báo các yêu cầu runtime của skill dưới `metadata.openclaw` (bí danh: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
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

Dùng `requires.env` cho các biến môi trường phải có trước khi skill có thể chạy. Dùng `envVars` khi bạn cần siêu dữ liệu theo từng biến, bao gồm các biến tùy chọn với `required: false`.

### Tham chiếu đầy đủ các trường

| Trường             | Kiểu       | Mô tả                                                                                                                                         |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Các biến môi trường bắt buộc mà skill của bạn cần.                                                                                            |
| `requires.bins`    | `string[]` | Các binary CLI đều phải được cài đặt.                                                                                                          |
| `requires.anyBins` | `string[]` | Các binary CLI mà ít nhất một cái phải tồn tại.                                                                                               |
| `requires.config`  | `string[]` | Đường dẫn tệp cấu hình mà skill của bạn đọc.                                                                                                  |
| `primaryEnv`       | `string`   | Biến môi trường thông tin xác thực chính cho skill của bạn.                                                                                   |
| `envVars`          | `array`    | Khai báo biến môi trường với `name`, `required` tùy chọn, và `description` tùy chọn. Đặt `required: false` cho các biến môi trường tùy chọn. |
| `always`           | `boolean`  | Nếu là `true`, skill luôn hoạt động (không cần cài đặt rõ ràng).                                                                              |
| `skillKey`         | `string`   | Ghi đè khóa gọi skill.                                                                                                                        |
| `emoji`            | `string`   | Emoji hiển thị cho skill.                                                                                                                     |
| `homepage`         | `string`   | URL tới trang chủ hoặc tài liệu của skill.                                                                                                    |
| `os`               | `string[]` | Hạn chế hệ điều hành (ví dụ `["macos"]`, `["linux"]`).                                                                                        |
| `install`          | `array`    | Đặc tả cài đặt cho các phụ thuộc (xem bên dưới).                                                                                              |
| `nix`              | `object`   | Đặc tả Nix plugin (xem README).                                                                                                               |
| `config`           | `object`   | Đặc tả cấu hình Clawdbot (xem README).                                                                                                        |

### Đặc tả cài đặt

Nếu skill của bạn cần cài đặt phụ thuộc, hãy khai báo chúng trong mảng `install`:

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

Khai báo các biến môi trường tùy chọn dưới `metadata.openclaw.envVars` và đặt `required: false`. Không thêm các mục tùy chọn vào `requires.env`, vì `requires.env` nghĩa là skill không thể chạy nếu thiếu chúng.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Vì sao điều này quan trọng

Phân tích bảo mật của ClawHub kiểm tra xem những gì skill của bạn khai báo có khớp với những gì nó thực sự làm hay không. Nếu mã của bạn tham chiếu `TODOIST_API_KEY` nhưng frontmatter không khai báo nó dưới `requires.env`, `primaryEnv`, hoặc `envVars`, phân tích sẽ gắn cờ không khớp siêu dữ liệu. Giữ khai báo chính xác giúp skill của bạn vượt qua quá trình xét duyệt và giúp người dùng hiểu họ đang cài đặt gì.

### Ví dụ: frontmatter hoàn chỉnh

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
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
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Tệp được phép

Chỉ các tệp “dạng văn bản” mới được publish chấp nhận.

- Danh sách phần mở rộng cho phép nằm trong `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Các tệp script vẫn được quét sau khi tải lên; các tệp PowerShell `.ps1`, `.psm1`, và `.psd1` được chấp nhận là văn bản.
- Các kiểu nội dung bắt đầu bằng `text/` được coi là văn bản; cộng thêm một danh sách nhỏ được phép (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Giới hạn (phía máy chủ):

- Tổng kích thước gói: 50MB.
- Văn bản embedding bao gồm `SKILL.md` + tối đa khoảng 40 tệp không phải `.md` (giới hạn theo nỗ lực tốt nhất).

## Slug

- Mặc định được suy ra từ tên thư mục.
- Scope gói phải khớp chính xác với handle nhà xuất bản ClawHub. Handle nhà xuất bản có thể dùng chữ cái thường, số, dấu gạch nối, dấu chấm và dấu gạch dưới; chúng phải bắt đầu và kết thúc bằng chữ cái thường hoặc số.
- Slug gói phải là chữ thường và an toàn cho npm, ví dụ `@example.tools/demo-plugin` hoặc `demo-plugin`.

## Phiên bản + thẻ

- Mỗi lần publish tạo một phiên bản mới (semver).
- Thẻ là con trỏ chuỗi tới một phiên bản; `latest` thường được dùng.

## Giấy phép

- Tất cả skills được xuất bản trên ClawHub đều được cấp phép theo `MIT-0`.
- Bất kỳ ai cũng có thể sử dụng, sửa đổi và phân phối lại skills đã xuất bản, bao gồm cả mục đích thương mại.
- Không bắt buộc ghi nhận tác giả.
- Không thêm điều khoản giấy phép xung đột trong `SKILL.md`; ClawHub không hỗ trợ ghi đè giấy phép theo từng skill.

## Skill trả phí

- ClawHub không hỗ trợ skills trả phí, định giá theo từng skill, paywall, hoặc chia sẻ doanh thu.
- Không thêm siêu dữ liệu giá vào `SKILL.md`; nó không phải là một phần của định dạng skill và sẽ không biến một skill đã xuất bản thành trả phí.
- Nếu skill của bạn tích hợp với một dịch vụ bên thứ ba trả phí, hãy ghi rõ chi phí bên ngoài và tài khoản bắt buộc trong hướng dẫn skill và khai báo env (`requires.env` cho biến bắt buộc, hoặc `envVars` với `required: false` cho biến tùy chọn).
