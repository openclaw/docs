---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi cài đặt, cập nhật hoặc phát hành
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình và hành vi của tệp khóa.'
x-i18n:
    generated_at: "2026-06-27T17:13:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c6c152cbe121f55969aeda0b990b444325e49ce6613745ef094a78d2d2cfce4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Gói CLI: `clawhub`, bin: `clawhub`.

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

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; quay về workspace Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL cơ sở cho đăng nhập trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Biến môi trường tương đương:

- `CLAWHUB_SITE` (cũ `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (cũ `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (cũ `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI tôn trọng các biến môi trường proxy HTTP chuẩn cho những hệ thống nằm sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu gửi ra
thông qua proxy đã chỉ định. `HTTPS_PROXY` được dùng cho yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống nơi kết nối trực tiếp ra ngoài bị chặn
(ví dụ: container Docker, Hetzner VPS chỉ có internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không có biến proxy nào được đặt, hành vi không đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API của bạn + URL registry được lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback loopback.
- Không giao diện: `clawhub login --token clh_...`
- Tương tác từ xa/không giao diện: `clawhub login --device` in một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `token`

- In token API đã lưu ra stdout.
- Hữu ích để truyền token đăng nhập cục bộ vào các lệnh thiết lập secret CI.

### `star <skill>` / `unstar <skill>`

- Thêm/xóa một kỹ năng khỏi mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Đầu ra bao gồm slug kỹ năng, handle của chủ sở hữu, tên hiển thị và điểm liên quan.
- Tìm kiếm ưu tiên khớp token slug/tên chính xác trước độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Độ phổ biến là một ưu tiên xếp hạng nhỏ, không đảm bảo vị trí đầu.
- Nếu một kỹ năng đáng lẽ xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect @owner/slug` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt mà chủ sở hữu thấy được trước khi đổi tên metadata.

### `explore`

- Liệt kê kỹ năng mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|rating|downloads|trending` (mặc định: newest). Các alias sắp xếp cài đặt cũ vẫn hoạt động để tương thích.
  - `--json` (đầu ra máy đọc được)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (tóm tắt được cắt còn 50 ký tự).

### `inspect @owner/slug`

- Lấy metadata kỹ năng và tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa để liệt kê (1-200).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `install @owner/slug`

- Phân giải phiên bản mới nhất cho chủ sở hữu và kỹ năng đã nêu.
- Tải zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè kỹ năng đã ghim; chạy `clawhub unpin <skill>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ `.clawdhub`)

### `uninstall <skill>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục trong lockfile.
- Gửi telemetry theo khả năng tốt nhất khi đã đăng nhập để số lượt cài đặt hiện tại có thể
  được hủy kích hoạt.
- Tương tác: hỏi xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`).
- Hiển thị `pinned` bên cạnh các kỹ năng bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <skill>`

- Đánh dấu một kỹ năng đã cài đặt là đã ghim trong lockfile.
- `--reason <text>` ghi lại lý do kỹ năng bị đóng băng.
- Kỹ năng đã ghim bị bỏ qua bởi `update --all` và bị từ chối bởi `update <skill>` trực tiếp.
- Kỹ năng đã ghim cũng từ chối `install --force` để byte cục bộ không thể bị thay thế ngoài ý muốn.

### `unpin <skill>`

- Xóa ghim lockfile khỏi một kỹ năng đã cài đặt để các bản cập nhật sau này có thể sửa đổi nó.

### `update [@owner/slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không nhắc.
- Nếu fingerprint không khớp:
  - mặc định từ chối
  - ghi đè bằng `--force` (hoặc nhắc, nếu tương tác)
- Kỹ năng đã ghim không bao giờ được cập nhật bằng `--force`.
- `update <skill>` thất bại nhanh với kỹ năng đã ghim và yêu cầu bạn chạy `clawhub unpin <skill>` trước.
- `update --all` bỏ qua các slug đã ghim và in tóm tắt về những gì vẫn bị đóng băng.

### `skill publish <path>`

- So sánh fingerprint bundle cục bộ với ClawHub và thoát thành công khi
  nội dung đã được phát hành.
- Kỹ năng mới mặc định là `1.0.0`; kỹ năng đã thay đổi mặc định là phiên bản
  patch tiếp theo.
- `--version <version>` chọn rõ một phiên bản và phát hành ngay cả khi
  nội dung khớp với một phiên bản hiện có.
- `--dry-run` phân giải lần phát hành mà không tải lên; `--json` in một
  kết quả máy đọc được.
- `--owner <handle>` phát hành dưới handle nhà phát hành của tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà phát hành.
- `--migrate-owner` di chuyển một kỹ năng hiện có sang `--owner` trong khi phát hành một
  phiên bản mới. Yêu cầu quyền truy cập admin/owner trên cả hai nhà phát hành.
- Hành vi chủ sở hữu và xét duyệt được giải thích trong `docs/publishing.md`.
- Phát hành một kỹ năng nghĩa là kỹ năng đó được phát hành theo `MIT-0` trên ClawHub.
- Kỹ năng đã phát hành được dùng, sửa đổi và phân phối lại tự do mà không cần ghi công.
- ClawHub không hỗ trợ kỹ năng trả phí hoặc định giá theo từng kỹ năng.
- Alias cũ: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Workflow tái sử dụng của ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
gọi `skill publish` cho một `skill_path`, hoặc cho từng thư mục kỹ năng trực tiếp
bên dưới `root` (mặc định: `skills`). Nó bỏ qua kỹ năng không thay đổi và dùng
cùng hành vi tự động tăng phiên bản patch.

Đặt `dry_run: true` để xem trước mà không cần token. Phát hành thật yêu cầu
secret `clawhub_token`.

### `sync`

- Quét workdir hiện tại, thư mục kỹ năng đã cấu hình và mọi thư mục
  `--root <dir>` để tìm thư mục kỹ năng cục bộ chứa `SKILL.md` hoặc
  `skill.md`.
- So sánh fingerprint của từng kỹ năng cục bộ với ClawHub và chỉ phát hành kỹ năng mới hoặc
  đã thay đổi.
- Kỹ năng mới phát hành dưới dạng `1.0.0`; kỹ năng đã thay đổi mặc định phát hành phiên bản patch
  tiếp theo. Dùng `--bump minor|major` cho các lô cập nhật cần dịch chuyển bằng
  bước semver lớn hơn.
- `--dry-run` hiển thị kế hoạch phát hành mà không tải lên; `--json` in một
  kế hoạch máy đọc được.
- `--all` phát hành mọi kỹ năng mới hoặc đã thay đổi mà không nhắc. Khi không có
  `--all`, terminal tương tác cho phép bạn chọn các kỹ năng để phát hành.
- `--owner <handle>` phát hành dưới handle nhà phát hành của tổ chức/người dùng khi
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
- Chạy ClawScan của ClawHub thông qua `POST /api/v1/skills/-/scan`, rồi poll cho đến khi lần quét ở trạng thái kết thúc.
- Các lần quét là bất đồng bộ và có thể mất thời gian để hoàn tất. Trong khi xếp hàng, spinner terminal hiển thị vị trí quét được ưu tiên hiện tại và số lần quét đang ở phía trước.
- Lần quét đã phát hành yêu cầu quyền sở hữu hoặc quyền truy cập quản lý nhà phát hành. Moderator/admin có thể dùng cùng backend thông qua `clawhub-admin`.
- `--update` chỉ hợp lệ với `--slug`; nó ghi kết quả quét đã phát hành thành công trở lại phiên bản đã chọn.
- `--output <file.zip>` tải xuống toàn bộ kho lưu trữ báo cáo với `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.
- `--json` in toàn bộ phản hồi poll cho tự động hóa.
- Quét đường dẫn cục bộ không còn được hỗ trợ. Tải lên một phiên bản mới, rồi dùng `scan download` để lấy kết quả quét đã lưu cho phiên bản đã gửi đó.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Yêu cầu `clawhub login`.
- Tải xuống ZIP báo cáo quét đã lưu cho một phiên bản kỹ năng hoặc plugin đã gửi, bao gồm các phiên bản bị chặn hoặc ẩn bởi kiểm tra bảo mật của ClawHub.
- Tải xuống kỹ năng dùng slug kỹ năng và mặc định là `--kind skill`.
- Tải xuống plugin dùng tên gói và yêu cầu `--kind plugin`.
- `--version` là bắt buộc để tác giả kiểm tra đúng phiên bản đã gửi mà ClawHub đã chặn.
- `--output <file.zip>` chọn đường dẫn đích.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/skill-publish.yml)
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
- Phát hành kỹ năng V1 dùng `clawhub_token`; phát hành tin cậy GitHub OIDC hiện chỉ dành cho gói.

### `delete <skill>`

- Không có `--version`, xóa mềm một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh sẽ in thời điểm hết hạn.
- `--version <version>` xóa vĩnh viễn một phiên bản không phải mới nhất do bạn sở hữu thông qua một tuyến
  dành riêng cho phiên bản, đóng khi lỗi.
  Các phiên bản đã xóa không thể được khôi phục hoặc xuất bản lại. Hãy xuất bản bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Nhân viên nền tảng không bỏ qua quyền sở hữu trong luồng chỉ dành cho phiên bản này.
- `--reason <text>` ghi lại ghi chú điều phối trên lần xóa mềm toàn bộ kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <skill>`

- Khôi phục một kỹ năng bị ẩn (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Không có thao tác khôi phục phiên bản; các phiên bản đã bị xóa vĩnh viễn không thể được khôi phục.
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú điều phối trên kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <skill>`

- Ẩn một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `delete`.

### `unhide <skill>`

- Bỏ ẩn một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `undelete`.

### `skill rename <skill> <new-name>`

- Đổi tên một kỹ năng do bạn sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source> <target>`

- Hợp nhất một kỹ năng do bạn sở hữu vào một kỹ năng khác do bạn sở hữu.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển đến handle người dùng sẽ tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển đến handle tổ chức/nhà xuất bản chỉ áp dụng ngay khi tác nhân có
  quyền truy cập quản trị đối với cả chủ sở hữu hiện tại và nhà xuất bản đích.
- Lệnh con:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Điểm cuối:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Duyệt hoặc tìm kiếm danh mục gói hợp nhất qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Dùng lệnh này cho Plugin và các mục thuộc họ gói khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm kỹ năng.
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
- Dùng lệnh này cho siêu dữ liệu Plugin, khả năng tương thích, xác minh, nguồn và kiểm tra phiên bản/tệp.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-100).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `package download <name>`

- Phân giải một phiên bản gói thông qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải artifact từ `downloadUrl` của trình phân giải.
- Xác minh SHA-256 của ClawHub cho tất cả artifact.
- Đối với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  shasum npm và tên/phiên bản trong `package.json` của tarball.
- Các phiên bản ZIP cũ tải xuống thông qua tuyến ZIP cũ.
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

- Tính SHA-256 của ClawHub, tính toàn vẹn npm `sha512` và shasum npm cho một
  artifact cục bộ.
- Với `--package`, phân giải siêu dữ liệu kỳ vọng từ ClawHub và so sánh
  tệp cục bộ với siêu dữ liệu artifact đã xuất bản.
- Với cờ digest trực tiếp, xác minh mà không tra cứu qua mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải siêu dữ liệu artifact kỳ vọng.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói kỳ vọng.
  - `--sha256 <hex>`: SHA-256 ClawHub kỳ vọng.
  - `--npm-integrity <sri>`: tính toàn vẹn npm kỳ vọng.
  - `--npm-shasum <sha1>`: shasum npm kỳ vọng.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Chạy Plugin Inspector đi kèm CLI ClawHub trên thư mục gói Plugin cục bộ.
- Mặc định là xác thực ngoại tuyến/tĩnh, không định vị hoặc nhập một checkout
  OpenClaw cục bộ.
- Lỗi tương thích nghiêm trọng thoát với mã khác 0. Các phát hiện chỉ là cảnh báo được in ra nhưng
  thoát với mã 0.
- Cờ:
  - `--out <dir>`: ghi báo cáo Plugin Inspector vào thư mục này.
  - `--openclaw <path>`: kiểm tra dựa trên một checkout OpenClaw cục bộ rõ ràng.
  - `--runtime`: bật ghi nhận runtime; nhập mã Plugin.
  - `--allow-execute`: cho phép ghi nhận runtime trong một workspace cô lập.
  - `--no-mock-sdk`: tắt SDK OpenClaw giả lập trong khi ghi nhận runtime.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package validate ./example-plugin
```

Nếu xác thực báo cáo một phát hiện về gói, manifest, import SDK hoặc artifact, hãy xem
[Plugin validation fixes](/vi/clawhub/plugin-validation-fixes), rồi chạy lại lệnh.

### `package delete <name>`

- Không có `--version`, xóa mềm một gói và tất cả bản phát hành.
- `--version <version>` xóa vĩnh viễn một bản phát hành không phải mới nhất do bạn sở hữu thông qua một tuyến
  dành riêng cho phiên bản, đóng khi lỗi.
  Các phiên bản đã xóa không thể được khôi phục hoặc xuất bản lại. Hãy xuất bản bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Luồng chỉ dành cho phiên bản này yêu cầu chủ sở hữu gói hoặc quản trị viên
  nhà xuất bản tổ chức; nhân viên nền tảng không bỏ qua quyền sở hữu gói.
- Xóa mềm toàn bộ gói yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản tổ chức, điều phối viên
  nền tảng hoặc quản trị viên nền tảng.
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

- Khôi phục một gói và các bản phát hành đã bị xóa mềm.
- Không có thao tác khôi phục phiên bản; các phiên bản đã bị xóa vĩnh viễn không thể được khôi phục.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản tổ chức, điều phối viên nền tảng,
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

- Chuyển một gói sang nhà xuất bản khác.
- Yêu cầu quyền truy cập quản trị đối với cả chủ sở hữu gói hiện tại và nhà xuất bản
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải chuyển đến chủ sở hữu phạm vi khớp.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: handle nhà xuất bản đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho điều phối viên.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, có thể gắn với một phiên bản, và trở nên hiển thị
  để điều phối viên xem xét.
- Báo cáo không tự động ẩn gói hoặc tự chặn tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị điều phối của gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số lượng báo cáo đang mở, trạng thái điều phối thủ công
  của bản phát hành mới nhất, trạng thái chặn tải xuống và lý do điều phối.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng cho việc OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, tính sẵn có của ClawPack, digest artifact,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, đích host, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển hướng tới người vận hành cho một gói có thể thay thế một
  Plugin OpenClaw đi kèm.
- Gọi cùng điểm cuối readiness được tính toán như `package readiness`, nhưng in
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, các kiểm tra và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Tạo một nhà xuất bản tổ chức do người dùng đã xác thực sở hữu.
- Handle được chuẩn hóa thành chữ thường và có thể được truyền có hoặc không có `@`.
- Nhà xuất bản tổ chức mới tạo không được tin cậy/chính thức theo mặc định.
- Thất bại nếu handle đã được dùng bởi một nhà xuất bản, người dùng hoặc tuyến dành riêng hiện có.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Phát hành một Plugin mã hoặc Plugin gói qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Kho GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các dấu hiệu gói OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xử lý như ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và điền trước
  siêu dữ liệu.
- Thư mục Plugin mã được đóng gói thành tarball npm ClawPack trước khi tải lên để
  các bản cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục Plugin gói vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Với nguồn GitHub, thông tin nguồn gốc được tự động điền từ kho, commit đã phân giải, ref và đường dẫn con.
- Với thư mục cục bộ, thông tin nguồn gốc được tự động phát hiện từ git cục bộ khi remote origin trỏ đến GitHub.
- Các Plugin mã bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm fallback cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` xuất đầu ra máy có thể đọc được cho CI.
- `--owner <handle>` phát hành dưới handle nhà phát hành của người dùng hoặc tổ chức khi actor có quyền truy cập nhà phát hành.
- Tên package có scope phải khớp với owner đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động dưới dạng ghi đè.
- Kho GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Luồng cục bộ được khuyến nghị

Trước tiên hãy dùng `--dry-run` để bạn có thể xác nhận siêu dữ liệu package đã phân giải và
thông tin nguồn gốc trước khi tạo bản phát hành thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Với Plugin mã, phát hành từ thư mục sẽ tạo và tải lên một artifact ClawPack từ
thư mục package:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Các Plugin mã bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
`package.json`. Manifest tối thiểu này đủ để phát hành thành công:

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

Các trường bắt buộc:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Ghi chú:

- `package.json.version` là phiên bản phát hành package của bạn, nhưng không được dùng làm
  fallback cho xác thực tương thích/bản dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là các phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các bước kiểm tra trước cục bộ chạy trước khi tải lên.
- Nếu xác thực báo cáo mã khắc phục, xem
  [Bản sửa lỗi xác thực Plugin](/vi/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub cũng cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/package-publish.yml)
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
- Ghim workflow tái sử dụng vào một tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành release từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không gây ô nhiễm.
- Phát hành thật nên được giới hạn ở các sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Phát hành tin cậy không dùng secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` khả dụng cho lần phát hành đầu tiên, package không đáng tin cậy, hoặc phát hành khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng artifact và hiển thị nó dưới dạng đầu ra workflow.

### `package trusted-publisher get <name>`

- Hiển thị cấu hình nhà phát hành tin cậy GitHub Actions cho một package.
- Dùng lệnh này sau khi đặt cấu hình để xác nhận kho lưu trữ, tên tệp workflow,
  và ghim môi trường tùy chọn.
- Cờ:
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Gắn hoặc thay thế cấu hình nhà phát hành tin cậy GitHub Actions cho một
  package hiện có.
- Package phải được tạo trước thông qua lệnh `clawhub package publish`
  thủ công thông thường hoặc đã xác thực bằng token.
- Sau khi cấu hình được đặt, các lần phát hành GitHub Actions được hỗ trợ trong tương lai có thể dùng
  OIDC/phát hành tin cậy mà không cần token ClawHub sống lâu.
- `--repository <repo>` phải là `owner/repo`.
- `--workflow-filename <file>` phải khớp với tên tệp workflow trong
  `.github/workflows/`.
- `--environment <name>` là tùy chọn. Khi được cấu hình, môi trường GitHub Actions
  trong claim OIDC phải khớp chính xác.
- ClawHub xác minh kho GitHub đã cấu hình khi lệnh này chạy.
  Kho công khai có thể được xác minh thông qua siêu dữ liệu GitHub công khai. Kho
  riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào kho đó, ví dụ
  thông qua một bản cài đặt GitHub App ClawHub trong tương lai hoặc một tích hợp
  GitHub được ủy quyền khác.
- Cờ:
  - `--repository <repo>`: kho GitHub, ví dụ `openclaw/example-plugin`.
  - `--workflow-filename <file>`: tên tệp workflow, ví dụ `package-publish.yml`.
  - `--environment <name>`: môi trường GitHub Actions khớp chính xác tùy chọn.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Xóa cấu hình nhà phát hành tin cậy khỏi một package.
- Dùng lệnh này để rollback nếu workflow, kho, hoặc ghim môi trường cần được
  tắt hoặc tạo lại.
- Các lần phát hành thật trong tương lai phải dùng phát hành đã xác thực thông thường cho đến khi cấu hình được
  đặt lại.
- Cờ:
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Đo từ xa cài đặt

- Được gửi sau `clawhub install <slug>` khi đã đăng nhập, trừ khi
  `CLAWHUB_DISABLE_TELEMETRY=1` được đặt.
- Báo cáo là best-effort. Các lệnh cài đặt không thất bại nếu đo từ xa
  không khả dụng.
- Chi tiết: `docs/telemetry.md`.
