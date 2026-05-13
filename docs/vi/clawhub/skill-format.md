---
read_when:
    - Xuất bản Skills
    - Gỡ lỗi sự cố xuất bản/đồng bộ hóa
summary: Định dạng thư mục Skill, các tệp bắt buộc, các loại tệp được phép, giới hạn.
x-i18n:
    generated_at: "2026-05-13T04:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Định dạng kỹ năng

## Trên ổ đĩa

Một kỹ năng là một thư mục.

Bắt buộc:

- `SKILL.md` (hoặc `skill.md`)

Tùy chọn:

- bất kỳ tệp hỗ trợ _dạng văn bản_ nào (xem “Tệp được phép”)
- `.clawhubignore` (mẫu bỏ qua cho publish/sync, `.clawdhubignore` cũ)
- `.gitignore` (cũng được tôn trọng)

Siêu dữ liệu cài đặt cục bộ (do CLI ghi):

- `<skill>/.clawhub/origin.json` (`.clawdhub` cũ)

Trạng thái cài đặt workdir (do CLI ghi):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ)

## `SKILL.md`

- Markdown với YAML frontmatter tùy chọn.
- Máy chủ trích xuất siêu dữ liệu từ frontmatter trong quá trình publish.
- `description` được dùng làm tóm tắt kỹ năng trong UI/tìm kiếm.

## Siêu dữ liệu frontmatter

Siêu dữ liệu kỹ năng được khai báo trong YAML frontmatter ở đầu `SKILL.md` của bạn. Phần này cho registry (và phân tích bảo mật) biết kỹ năng của bạn cần gì để chạy.

### Frontmatter cơ bản

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Siêu dữ liệu runtime (`metadata.openclaw`)

Khai báo các yêu cầu runtime của kỹ năng dưới `metadata.openclaw` (bí danh: `metadata.clawdbot`, `metadata.clawdis`).

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

Dùng `requires.env` cho các biến môi trường phải có trước khi kỹ năng có thể chạy. Dùng `envVars` khi bạn cần siêu dữ liệu theo từng biến, bao gồm các biến tùy chọn với `required: false`.

### Tham chiếu đầy đủ các trường

| Trường             | Kiểu       | Mô tả                                                                                                                                       |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Các biến môi trường bắt buộc mà kỹ năng của bạn yêu cầu.                                                                                    |
| `requires.bins`    | `string[]` | Các binary CLI đều phải được cài đặt.                                                                                                       |
| `requires.anyBins` | `string[]` | Các binary CLI trong đó ít nhất một binary phải tồn tại.                                                                                    |
| `requires.config`  | `string[]` | Đường dẫn tệp cấu hình mà kỹ năng của bạn đọc.                                                                                              |
| `primaryEnv`       | `string`   | Biến môi trường thông tin xác thực chính cho kỹ năng của bạn.                                                                               |
| `envVars`          | `array`    | Khai báo biến môi trường với `name`, `required` tùy chọn và `description` tùy chọn. Đặt `required: false` cho các biến môi trường tùy chọn. |
| `always`           | `boolean`  | Nếu là `true`, kỹ năng luôn hoạt động (không cần cài đặt rõ ràng).                                                                          |
| `skillKey`         | `string`   | Ghi đè khóa gọi kỹ năng.                                                                                                                    |
| `emoji`            | `string`   | Emoji hiển thị cho kỹ năng.                                                                                                                 |
| `homepage`         | `string`   | URL tới trang chủ hoặc tài liệu của kỹ năng.                                                                                                |
| `os`               | `string[]` | Giới hạn hệ điều hành (ví dụ `["macos"]`, `["linux"]`).                                                                                     |
| `install`          | `array`    | Đặc tả cài đặt cho các phụ thuộc (xem bên dưới).                                                                                            |
| `nix`              | `object`   | Đặc tả plugin Nix (xem README).                                                                                                             |
| `config`           | `object`   | Đặc tả cấu hình Clawdbot (xem README).                                                                                                      |

### Đặc tả cài đặt

Nếu kỹ năng của bạn cần cài đặt phụ thuộc, hãy khai báo chúng trong mảng `install`:

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

Khai báo các biến môi trường tùy chọn dưới `metadata.openclaw.envVars` và đặt `required: false`. Không thêm các mục tùy chọn vào `requires.env`, vì `requires.env` có nghĩa là kỹ năng không thể chạy nếu thiếu chúng.

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

Phân tích bảo mật của ClawHub kiểm tra xem nội dung kỹ năng khai báo có khớp với những gì nó thực sự làm hay không. Nếu mã của bạn tham chiếu `TODOIST_API_KEY` nhưng frontmatter của bạn không khai báo nó dưới `requires.env`, `primaryEnv`, hoặc `envVars`, phân tích sẽ đánh dấu là siêu dữ liệu không khớp. Việc giữ khai báo chính xác giúp kỹ năng của bạn vượt qua quá trình đánh giá và giúp người dùng hiểu họ đang cài đặt gì.

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

Chỉ các tệp “dạng văn bản” được publish chấp nhận.

- Danh sách phần mở rộng được phép nằm trong `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Tệp script vẫn được quét sau khi tải lên; các tệp PowerShell `.ps1`, `.psm1` và `.psd1` được chấp nhận là văn bản.
- Các loại nội dung bắt đầu bằng `text/` được xem là văn bản; cộng thêm một danh sách nhỏ được phép (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Giới hạn (phía máy chủ):

- Tổng kích thước bundle: 50MB.
- Văn bản embedding bao gồm `SKILL.md` + tối đa khoảng 40 tệp không phải `.md` (giới hạn nỗ lực tối đa).

## Slug

- Mặc định được suy ra từ tên thư mục.
- Phải viết thường và an toàn cho URL: `^[a-z0-9][a-z0-9-]*$`.

## Phiên bản hóa + thẻ

- Mỗi lần publish tạo một phiên bản mới (semver).
- Thẻ là con trỏ dạng chuỗi tới một phiên bản; `latest` thường được dùng.

## Giấy phép

- Tất cả kỹ năng được publish trên ClawHub đều được cấp phép theo `MIT-0`.
- Bất kỳ ai cũng có thể sử dụng, sửa đổi và phân phối lại các kỹ năng đã publish, bao gồm cả mục đích thương mại.
- Không bắt buộc ghi công.
- Không thêm các điều khoản giấy phép xung đột trong `SKILL.md`; ClawHub không hỗ trợ ghi đè giấy phép theo từng kỹ năng.

## Kỹ năng trả phí

- ClawHub không hỗ trợ kỹ năng trả phí, định giá theo từng kỹ năng, paywall hoặc chia sẻ doanh thu.
- Không thêm siêu dữ liệu giá vào `SKILL.md`; đó không phải là một phần của định dạng kỹ năng và sẽ không khiến kỹ năng đã publish trở thành kỹ năng trả phí.
- Nếu kỹ năng của bạn tích hợp với một dịch vụ bên thứ ba có trả phí, hãy ghi rõ chi phí bên ngoài và tài khoản bắt buộc trong hướng dẫn kỹ năng và khai báo env (`requires.env` cho các biến bắt buộc, hoặc `envVars` với `required: false` cho các biến tùy chọn).
