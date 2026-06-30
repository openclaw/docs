---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi cài đặt, cập nhật hoặc xuất bản
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình và hành vi của lockfile.'
x-i18n:
    generated_at: "2026-06-30T14:08:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Gói CLI: `clawhub`, tệp nhị phân: `clawhub`.

Cài đặt toàn cục bằng npm hoặc pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Sau đó xác minh:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Cờ toàn cục

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; chuyển sang không gian làm việc Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL cơ sở cho đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở của API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Các biến môi trường tương đương:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` cũ)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` cũ)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` cũ)

### Proxy HTTP

CLI tôn trọng các biến môi trường proxy HTTP tiêu chuẩn cho những hệ thống đứng sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu đi ra qua
proxy được chỉ định. `HTTPS_PROXY` được dùng cho các yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thường. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống chặn kết nối đi ra trực tiếp
(ví dụ: container Docker, VPS Hetzner có internet chỉ qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không có biến proxy nào được đặt, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API của bạn + URL registry đã lưu vào bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` cũ)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback loopback.
- Không giao diện: `clawhub login --token clh_...`
- Tương tác từ xa/không giao diện: `clawhub login --device` in ra một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `token`

- In token API đã lưu ra stdout.
- Hữu ích để pipe token đăng nhập cục bộ vào các lệnh thiết lập bí mật CI.

### `star <skill>` / `unstar <skill>`

- Thêm/xóa một kỹ năng khỏi các mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Đầu ra bao gồm slug kỹ năng, handle chủ sở hữu, tên hiển thị và điểm liên quan.
- Tìm kiếm ưu tiên các kết quả khớp token slug/tên chính xác trước độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Độ phổ biến là một yếu tố xếp hạng nhỏ ban đầu, không đảm bảo vị trí cao nhất.
- Nếu một kỹ năng đáng lẽ xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect @owner/slug` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt mà chủ sở hữu nhìn thấy trước khi đổi tên metadata.

### `explore`

- Liệt kê Skills mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|rating|downloads|trending` (mặc định: newest). Các bí danh sắp xếp cài đặt cũ vẫn hoạt động để tương thích.
  - `--json` (đầu ra máy đọc được)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (tóm tắt được cắt còn 50 ký tự).

### `inspect @owner/slug`

- Lấy metadata kỹ năng và các tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-200).
- `--files`: liệt kê các tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `install @owner/slug`

- Phân giải phiên bản mới nhất cho chủ sở hữu và kỹ năng đã đặt tên.
- Tải zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè Skills đã ghim; chạy `clawhub unpin <skill>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` cũ)

### `uninstall <skill>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục nhập trong lockfile.
- Gửi telemetry best-effort khi đã đăng nhập để số lượt cài đặt hiện tại có thể được
  vô hiệu hóa.
- Tương tác: hỏi xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ).
- Hiển thị `pinned` bên cạnh Skills đã bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <skill>`

- Đánh dấu một kỹ năng đã cài đặt là đã ghim trong lockfile.
- `--reason <text>` ghi lại lý do kỹ năng bị đóng băng.
- Skills đã ghim bị `update --all` bỏ qua và bị từ chối bởi `update <skill>` trực tiếp.
- Skills đã ghim cũng từ chối `install --force` để các byte cục bộ không bị thay thế ngoài ý muốn.

### `unpin <skill>`

- Xóa ghim trong lockfile khỏi một kỹ năng đã cài đặt để các bản cập nhật trong tương lai có thể sửa đổi nó.

### `update [@owner/slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không có lời nhắc.
- Nếu fingerprint không khớp:
  - mặc định từ chối
  - ghi đè bằng `--force` (hoặc lời nhắc, nếu tương tác)
- Skills đã ghim không bao giờ được cập nhật bằng `--force`.
- `update <skill>` thất bại nhanh với Skills đã ghim và yêu cầu bạn chạy `clawhub unpin <skill>` trước.
- `update --all` bỏ qua các slug đã ghim và in tóm tắt về những mục vẫn bị đóng băng.

### `skill publish <path>`

- So sánh fingerprint của gói cục bộ với ClawHub và thoát thành công khi
  nội dung đã được phát hành.
- Skills mới mặc định là `1.0.0`; Skills đã thay đổi mặc định là phiên bản patch
  tiếp theo.
- `--version <version>` chọn rõ một phiên bản và phát hành ngay cả khi
  nội dung khớp với một phiên bản hiện có.
- `--dry-run` phân giải thao tác phát hành mà không tải lên; `--json` in kết quả
  máy đọc được.
- `--owner <handle>` phát hành dưới handle nhà phát hành tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà phát hành.
- `--migrate-owner` di chuyển một kỹ năng hiện có sang `--owner` trong khi phát hành một
  phiên bản mới. Yêu cầu quyền quản trị/chủ sở hữu trên cả hai nhà phát hành.
- Hành vi chủ sở hữu và xét duyệt được giải thích trong `docs/publishing.md`.
- Phát hành một kỹ năng có nghĩa là nó được phát hành theo `MIT-0` trên ClawHub.
- Skills đã phát hành được tự do sử dụng, sửa đổi và phân phối lại mà không cần ghi công.
- ClawHub không hỗ trợ Skills trả phí hoặc định giá theo từng kỹ năng.
- Bí danh cũ: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Workflow tái sử dụng của ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
gọi `skill publish` cho một `skill_path`, hoặc cho từng thư mục kỹ năng trực tiếp
bên dưới `root` (mặc định: `skills`). Nó bỏ qua Skills không thay đổi và dùng
cùng hành vi tự động tăng phiên bản patch.

Đặt `dry_run: true` để xem trước mà không cần token. Các lần phát hành thật yêu cầu
bí mật `clawhub_token`.

### `sync`

- Quét workdir hiện tại, thư mục Skills đã cấu hình và mọi thư mục
  `--root <dir>` để tìm thư mục kỹ năng cục bộ chứa `SKILL.md` hoặc
  `skill.md`.
- So sánh fingerprint của từng kỹ năng cục bộ với ClawHub và chỉ phát hành Skills mới hoặc
  đã thay đổi.
- Skills mới phát hành dưới dạng `1.0.0`; Skills đã thay đổi phát hành phiên bản patch tiếp theo
  theo mặc định. Dùng `--bump minor|major` cho các lô cập nhật cần tăng theo
  bước semver lớn hơn.
- `--dry-run` hiển thị kế hoạch phát hành mà không tải lên; `--json` in một
  kế hoạch máy đọc được.
- `--all` phát hành mọi kỹ năng mới hoặc đã thay đổi mà không nhắc. Khi không có
  `--all`, terminal tương tác cho phép bạn chọn Skills cần phát hành.
- `--owner <handle>` phát hành dưới handle nhà phát hành tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà phát hành.
- `sync` chỉ là phát hành một chiều. Nó không cài đặt, cập nhật, tải xuống hoặc
  báo cáo telemetry cài đặt/tải xuống.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Yêu cầu `clawhub login`.
- Chạy ClawHub ClawScan qua `POST /api/v1/skills/-/scan`, sau đó poll cho đến khi scan kết thúc.
- Các scan là bất đồng bộ và có thể mất thời gian để hoàn tất. Khi ở hàng đợi, spinner terminal hiển thị vị trí scan ưu tiên hiện tại và có bao nhiêu scan phía trước.
- Scan đã phát hành yêu cầu quyền sở hữu hoặc quyền truy cập quản lý nhà phát hành. Điều phối viên/quản trị viên có thể dùng cùng backend qua `clawhub-admin`.
- `--update` chỉ hợp lệ với `--slug`; nó ghi kết quả scan đã phát hành thành công trở lại phiên bản đã chọn.
- `--output <file.zip>` tải xuống toàn bộ kho lưu trữ báo cáo với `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.
- `--json` in toàn bộ phản hồi poll để tự động hóa.
- Scan đường dẫn cục bộ không còn được hỗ trợ. Tải lên một phiên bản mới, sau đó dùng `scan download` để truy xuất kết quả scan đã lưu cho phiên bản đã gửi đó.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Yêu cầu `clawhub login`.
- Tải xuống ZIP báo cáo scan đã lưu cho một phiên bản kỹ năng hoặc Plugin đã gửi, bao gồm các phiên bản bị chặn hoặc ẩn bởi kiểm tra bảo mật ClawHub.
- Tải xuống kỹ năng dùng slug kỹ năng và mặc định là `--kind skill`.
- Tải xuống Plugin dùng tên gói và yêu cầu `--kind plugin`.
- `--version` là bắt buộc để tác giả kiểm tra đúng phiên bản đã gửi mà ClawHub đã chặn.
- `--output <file.zip>` chọn đường dẫn đích.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
cho repo kỹ năng và repo danh mục.

Thiết lập danh mục điển hình:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Ghi chú:

- `root` mặc định là `skills` cho repo danh mục.
- Truyền `skill_path: skills/review-helper` để xử lý một thư mục kỹ năng.
- `owner` ánh xạ tới cờ CLI `--owner`; bỏ qua để phát hành với tư cách người dùng đã xác thực.
- Phát hành kỹ năng V1 dùng `clawhub_token`; phát hành đáng tin cậy GitHub OIDC hiện chỉ dành cho gói.

### `delete <skill>`

- Không có `--version`, xóa mềm một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các thao tác xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh in thời điểm hết hạn.
- `--version <version>` xóa vĩnh viễn một phiên bản không phải mới nhất do bạn sở hữu thông qua một route fail-closed,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc phát hành lại các phiên bản đã xóa. Hãy phát hành bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Nhân viên nền tảng không bỏ qua quyền sở hữu cho luồng chỉ dành cho phiên bản này.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên thao tác xóa mềm toàn bộ skill và nhật ký kiểm toán.
- `--note <text>` là bí danh cho `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <skill>`

- Khôi phục một skill bị ẩn (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Không có khôi phục phiên bản; các phiên bản đã xóa vĩnh viễn không thể khôi phục.
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên skill và nhật ký kiểm toán.
- `--note <text>` là bí danh cho `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <skill>`

- Ẩn một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Bí danh cho `delete`.

### `unhide <skill>`

- Bỏ ẩn một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Bí danh cho `undelete`.

### `skill rename <skill> <new-name>`

- Đổi tên một skill do bạn sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source> <target>`

- Hợp nhất một skill do bạn sở hữu vào một skill khác do bạn sở hữu.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển cho handle người dùng sẽ tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển cho handle tổ chức/nhà phát hành chỉ áp dụng ngay lập tức khi tác nhân có
  quyền truy cập quản trị vào cả chủ sở hữu hiện tại và nhà phát hành đích.
- Lệnh con:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Duyệt hoặc tìm kiếm danh mục gói hợp nhất qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Dùng lệnh này cho plugin và các mục thuộc họ gói khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm skill.
- Cờ:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, mặc định: 25)
  - `--json`

Ví dụ:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Lấy siêu dữ liệu gói mà không cài đặt.
- Dùng lệnh này để kiểm tra siêu dữ liệu plugin, khả năng tương thích, xác minh, nguồn và phiên bản/tệp.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa để liệt kê (1-100).
- `--files`: liệt kê các tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `package download <name>`

- Phân giải một phiên bản gói thông qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải xuống artifact từ `downloadUrl` của bộ phân giải.
- Xác minh SHA-256 của ClawHub cho tất cả artifact.
- Đối với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  npm shasum và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP cũ tải xuống thông qua route ZIP cũ.
- Cờ:
  - `--version <version>`: tải xuống một phiên bản cụ thể.
  - `--tag <tag>`: tải xuống một phiên bản được gắn thẻ (mặc định: `latest`).
  - `-o, --output <path>`: tệp hoặc thư mục đầu ra.
  - `--force`: ghi đè tệp đầu ra hiện có.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Tính SHA-256 của ClawHub, tính toàn vẹn npm `sha512` và npm shasum cho một
  artifact cục bộ.
- Với `--package`, phân giải siêu dữ liệu kỳ vọng từ ClawHub và so sánh
  tệp cục bộ với siêu dữ liệu artifact đã phát hành.
- Với các cờ digest trực tiếp, xác minh mà không cần tra cứu mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải siêu dữ liệu artifact kỳ vọng.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói kỳ vọng.
  - `--sha256 <hex>`: SHA-256 ClawHub kỳ vọng.
  - `--npm-integrity <sri>`: tính toàn vẹn npm kỳ vọng.
  - `--npm-shasum <sha1>`: npm shasum kỳ vọng.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Chạy Plugin Inspector đi kèm CLI ClawHub trên thư mục gói plugin cục bộ.
- Mặc định là xác thực ngoại tuyến/tĩnh, không định vị hoặc nhập một checkout
  OpenClaw cục bộ.
- Lỗi tương thích nghiêm trọng thoát với mã khác không. Các phát hiện chỉ là cảnh báo được in ra nhưng
  thoát với mã không.
- Cờ:
  - `--out <dir>`: ghi báo cáo Plugin Inspector vào thư mục này.
  - `--openclaw <path>`: kiểm tra theo một checkout OpenClaw cục bộ rõ ràng.
  - `--runtime`: bật ghi nhận runtime; nhập mã plugin.
  - `--allow-execute`: cho phép ghi nhận runtime trong không gian làm việc cô lập.
  - `--no-mock-sdk`: tắt OpenClaw SDK được mô phỏng trong quá trình ghi nhận runtime.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package validate ./example-plugin
```

Nếu xác thực báo cáo phát hiện về gói, manifest, nhập SDK hoặc artifact, hãy xem
[Cách sửa lỗi xác thực Plugin](/clawhub/plugin-validation-fixes), rồi chạy lại lệnh.

### `package delete <name>`

- Không có `--version`, xóa mềm một gói và tất cả bản phát hành.
- `--version <version>` xóa vĩnh viễn một bản phát hành không phải mới nhất do bạn sở hữu thông qua một route fail-closed,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc phát hành lại các phiên bản đã xóa. Hãy phát hành bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Luồng chỉ dành cho phiên bản này yêu cầu chủ sở hữu gói hoặc quản trị viên
  nhà phát hành tổ chức; nhân viên nền tảng không bỏ qua quyền sở hữu gói.
- Xóa mềm toàn bộ gói yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, người kiểm duyệt nền tảng hoặc quản trị viên nền tảng.
- Cờ:
  - `--version <version>`: xóa vĩnh viễn một phiên bản không phải mới nhất.
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Khôi phục một gói đã bị xóa mềm và các bản phát hành.
- Không có khôi phục phiên bản; các phiên bản đã xóa vĩnh viễn không thể khôi phục.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, người kiểm duyệt nền tảng,
  hoặc quản trị viên nền tảng.
- Gọi `POST /api/v1/packages/{name}/undelete`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Chuyển một gói sang nhà phát hành khác.
- Yêu cầu quyền truy cập quản trị vào cả chủ sở hữu gói hiện tại và nhà phát hành
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải chuyển sang chủ sở hữu phạm vi khớp.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: handle nhà phát hành đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho người kiểm duyệt.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, tùy chọn gắn với một phiên bản, và sẽ hiển thị
  cho người kiểm duyệt xem xét.
- Báo cáo tự nó không tự động ẩn gói hoặc chặn tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị kiểm duyệt của gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số lượng báo cáo mở, trạng thái kiểm duyệt thủ công của bản phát hành mới nhất,
  trạng thái chặn tải xuống và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng để OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, tính sẵn có của ClawPack, digest artifact,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, mục tiêu máy chủ, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển theo hướng vận hành cho một gói có thể thay thế
  một plugin OpenClaw đi kèm.
- Gọi cùng endpoint readiness được tính toán như `package readiness`, nhưng in ra
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, các kiểm tra và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Tạo một nhà phát hành tổ chức do người dùng đã xác thực sở hữu.
- Handle được chuẩn hóa thành chữ thường và có thể được truyền kèm hoặc không kèm `@`.
- Các nhà phát hành tổ chức mới tạo không được tin cậy/chính thức theo mặc định.
- Thất bại nếu handle đã được dùng bởi nhà phát hành, người dùng hoặc route dành riêng hiện có.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Phát hành Plugin mã hoặc Plugin dạng bundle qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Kho GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các dấu hiệu bundle OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xử lý như ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và
  điền sẵn siêu dữ liệu.
- Thư mục Plugin mã được đóng gói thành tarball npm ClawPack trước khi tải lên để
  các bản cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục Plugin dạng bundle vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Với nguồn GitHub, thông tin ghi nhận nguồn được tự động điền từ kho, commit đã phân giải, ref và đường dẫn con.
- Với thư mục cục bộ, thông tin ghi nhận nguồn được tự động phát hiện từ git cục bộ khi remote origin trỏ tới GitHub.
- Plugin mã bên ngoài phải khai báo `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion` một cách tường minh.
  `package.json.version` cấp cao nhất không được dùng làm fallback cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` xuất đầu ra máy đọc được cho CI.
- `--owner <handle>` phát hành dưới handle nhà phát hành của người dùng hoặc tổ chức khi actor có quyền truy cập nhà phát hành.
- Tên package có scope phải khớp với owner đã chọn. Xem `docs/publishing.md`.
- Các flag hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như override.
- Kho GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Luồng cục bộ được khuyến nghị

Dùng `--dry-run` trước để bạn có thể xác nhận siêu dữ liệu package đã phân giải và
thông tin ghi nhận nguồn trước khi tạo bản phát hành thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Với Plugin mã, phát hành thư mục sẽ build và tải lên một artifact ClawPack từ
thư mục package:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Plugin mã bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
`package.json`. Manifest tối thiểu này là đủ để phát hành thành công:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Trường bắt buộc:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Ghi chú:

- `package.json.version` là phiên bản phát hành package của bạn, nhưng không được dùng làm
  fallback cho xác thực tương thích/build OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là các phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng một bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các kiểm tra preflight cục bộ chạy trước khi tải lên.
- Nếu xác thực báo mã khắc phục, xem
  [Bản sửa lỗi xác thực Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub cũng cung cấp workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)
cho các kho Plugin.

Thiết lập caller điển hình:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Ghi chú:

- Workflow tái sử dụng mặc định đặt `source` thành kho caller.
- Với monorepo, truyền `source_path` để workflow phát hành thư mục package
  Plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành release từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không gây nhiễu.
- Các lần phát hành thật nên được giới hạn ở sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Phát hành tin cậy không dùng secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` sẵn có cho lần phát hành đầu tiên, package không đáng tin cậy, hoặc phát hành khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng artifact và hiển thị nó dưới dạng output của workflow.

### `package trusted-publisher get <name>`

- Hiển thị cấu hình nhà phát hành tin cậy GitHub Actions cho một package.
- Dùng lệnh này sau khi đặt cấu hình để xác nhận kho, tên tệp workflow,
  và ghim môi trường tùy chọn.
- Flag:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Gắn hoặc thay thế cấu hình nhà phát hành tin cậy GitHub Actions cho một
  package hiện có.
- Package phải được tạo trước thông qua
  `clawhub package publish` thủ công thông thường hoặc đã xác thực bằng token.
- Sau khi cấu hình được đặt, các lần phát hành GitHub Actions được hỗ trợ trong tương lai có thể dùng
  OIDC/phát hành tin cậy mà không cần token ClawHub dài hạn.
- `--repository <repo>` phải là `owner/repo`.
- `--workflow-filename <file>` phải khớp với tên tệp workflow trong
  `.github/workflows/`.
- `--environment <name>` là tùy chọn. Khi được cấu hình, môi trường GitHub Actions
  trong claim OIDC phải khớp chính xác.
- ClawHub xác minh kho GitHub đã cấu hình khi lệnh này chạy.
  Kho công khai có thể được xác minh thông qua siêu dữ liệu GitHub công khai. Kho
  riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào kho đó, ví dụ
  thông qua một cài đặt GitHub App ClawHub trong tương lai hoặc một tích hợp
  GitHub được ủy quyền khác.
- Flag:
  - `--repository <repo>`: kho GitHub, ví dụ `openclaw/example-plugin`.
  - `--workflow-filename <file>`: tên tệp workflow, ví dụ `package-publish.yml`.
  - `--environment <name>`: môi trường GitHub Actions tùy chọn, khớp chính xác.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Xóa cấu hình nhà phát hành tin cậy khỏi một package.
- Dùng lệnh này làm rollback nếu workflow, kho, hoặc ghim môi trường cần được
  vô hiệu hóa hoặc tạo lại.
- Các lần phát hành thật trong tương lai phải dùng phát hành đã xác thực thông thường cho đến khi cấu hình được
  đặt lại.
- Flag:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Cài đặt telemetry

- Được gửi sau `clawhub install <slug>` khi đã đăng nhập, trừ khi
  `CLAWHUB_DISABLE_TELEMETRY=1` được đặt.
- Việc báo cáo là best-effort. Lệnh cài đặt không thất bại nếu telemetry
  không khả dụng.
- Chi tiết: `docs/telemetry.md`.
