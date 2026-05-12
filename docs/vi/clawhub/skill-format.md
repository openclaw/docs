---
read_when:
    - Xuất bản Skills
    - Gỡ lỗi các lỗi xuất bản/đồng bộ hóa
summary: Định dạng thư mục Skill, các tệp bắt buộc, loại tệp được phép, giới hạn.
x-i18n:
    generated_at: "2026-05-12T15:43:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Định dạng skill

## Trên ổ đĩa

Một skill là một thư mục.

Bắt buộc:

- `SKILL.md` (hoặc `skill.md`)

Tùy chọn:

- bất kỳ tệp hỗ trợ _dựa trên văn bản_ nào (xem “Tệp được phép”)
- `.clawhubignore` (mẫu bỏ qua cho publish/sync, `.clawdhubignore` cũ)
- `.gitignore` (cũng được tuân thủ)

Siêu dữ liệu cài đặt cục bộ (do CLI ghi):

- `<skill>/.clawhub/origin.json` (`.clawdhub` cũ)

Trạng thái cài đặt workdir (do CLI ghi):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ)

## `SKILL.md`

- Markdown với YAML frontmatter tùy chọn.
- Server trích xuất siêu dữ liệu từ frontmatter trong quá trình publish.
- `description` được dùng làm tóm tắt skill trong UI/tìm kiếm.

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

Khai báo yêu cầu runtime của skill trong `metadata.openclaw` (bí danh: `metadata.clawdbot`, `metadata.clawdis`).

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

| Trường             | Kiểu       | Mô tả                                                                                                                                                  |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Các biến môi trường bắt buộc mà skill của bạn yêu cầu.                                                                                                 |
| `requires.bins`    | `string[]` | Các binary CLI mà tất cả đều phải được cài đặt.                                                                                                        |
| `requires.anyBins` | `string[]` | Các binary CLI mà ít nhất một cái phải tồn tại.                                                                                                        |
| `requires.config`  | `string[]` | Đường dẫn tệp cấu hình mà skill của bạn đọc.                                                                                                           |
| `primaryEnv`       | `string`   | Biến môi trường thông tin xác thực chính cho skill của bạn.                                                                                            |
| `envVars`          | `array`    | Khai báo biến môi trường với `name`, `required` tùy chọn và `description` tùy chọn. Đặt `required: false` cho các biến môi trường tùy chọn.            |
| `always`           | `boolean`  | Nếu là `true`, skill luôn hoạt động (không cần cài đặt rõ ràng).                                                                                       |
| `skillKey`         | `string`   | Ghi đè khóa gọi skill.                                                                                                                                 |
| `emoji`            | `string`   | Emoji hiển thị cho skill.                                                                                                                              |
| `homepage`         | `string`   | URL tới trang chủ hoặc tài liệu của skill.                                                                                                             |
| `os`               | `string[]` | Hạn chế hệ điều hành (ví dụ: `["macos"]`, `["linux"]`).                                                                                                |
| `install`          | `array`    | Đặc tả cài đặt cho các phụ thuộc (xem bên dưới).                                                                                                      |
| `nix`              | `object`   | Đặc tả Plugin Nix (xem README).                                                                                                                       |
| `config`           | `object`   | Đặc tả cấu hình Clawdbot (xem README).                                                                                                                |

### Đặc tả cài đặt

Nếu skill của bạn cần cài đặt các phụ thuộc, hãy khai báo chúng trong mảng `install`:

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
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Vì sao điều này quan trọng

Phân tích bảo mật của ClawHub kiểm tra rằng những gì skill của bạn khai báo khớp với những gì nó thực sự làm. Nếu mã của bạn tham chiếu `TODOIST_API_KEY` nhưng frontmatter không khai báo biến đó trong `requires.env`, `primaryEnv`, hoặc `envVars`, quá trình phân tích sẽ gắn cờ lỗi không khớp siêu dữ liệu. Giữ khai báo chính xác giúp skill của bạn vượt qua xét duyệt và giúp người dùng hiểu họ đang cài đặt gì.

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

Chỉ các tệp “dựa trên văn bản” được chấp nhận khi publish.

- Allowlist phần mở rộng nằm trong `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Các tệp script vẫn được quét sau khi tải lên; các tệp PowerShell `.ps1`, `.psm1`, và `.psd1` được chấp nhận dưới dạng văn bản.
- Content type bắt đầu bằng `text/` được xem là văn bản; cộng thêm một allowlist nhỏ (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Giới hạn (phía server):

- Tổng kích thước bundle: 50MB.
- Văn bản embedding bao gồm `SKILL.md` + tối đa khoảng 40 tệp không phải `.md` (giới hạn theo nỗ lực tốt nhất).

## Slug

- Mặc định được suy ra từ tên thư mục.
- Phải viết thường và an toàn cho URL: `^[a-z0-9][a-z0-9-]*$`.

## Phiên bản hóa + thẻ

- Mỗi lần publish tạo một phiên bản mới (semver).
- Thẻ là con trỏ chuỗi tới một phiên bản; `latest` thường được dùng.

## Giấy phép

- Tất cả skill được publish trên ClawHub đều được cấp phép theo `MIT-0`.
- Bất kỳ ai cũng có thể dùng, sửa đổi và phân phối lại các skill đã publish, bao gồm cả mục đích thương mại.
- Không yêu cầu ghi công.
- Không thêm điều khoản giấy phép xung đột trong `SKILL.md`; ClawHub không hỗ trợ ghi đè giấy phép theo từng skill.

## Skill trả phí

- ClawHub không hỗ trợ skill trả phí, định giá theo từng skill, paywall, hoặc chia sẻ doanh thu.
- Không thêm siêu dữ liệu giá vào `SKILL.md`; đó không phải là một phần của định dạng skill và sẽ không biến một skill đã publish thành skill trả phí.
- Nếu skill của bạn tích hợp với một dịch vụ bên thứ ba trả phí, hãy ghi rõ chi phí bên ngoài và tài khoản bắt buộc trong hướng dẫn skill và khai báo env (`requires.env` cho các biến bắt buộc, hoặc `envVars` với `required: false` cho các biến tùy chọn).
