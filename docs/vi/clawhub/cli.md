---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi cài đặt, cập nhật hoặc phát hành
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình và hành vi của tệp khóa.'
x-i18n:
    generated_at: "2026-07-03T17:27:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; dự phòng về workspace Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL gốc để đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL gốc API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Biến môi trường tương đương:

- `CLAWHUB_SITE` (cũ `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (cũ `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (cũ `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI tuân thủ các biến môi trường proxy HTTP tiêu chuẩn cho các hệ thống phía sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu đi ra qua
proxy đã chỉ định. `HTTPS_PROXY` được dùng cho các yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống nơi kết nối đi ra trực tiếp bị chặn
(ví dụ: vùng chứa Docker, VPS Hetzner chỉ có internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không có biến proxy nào được đặt, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API của bạn + URL registry đã lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback loopback.
- Headless: `clawhub login --token clh_...`
- Tương tác từ xa/headless: `clawhub login --device` in một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `token`

- In token API đã lưu ra stdout.
- Hữu ích để truyền token đăng nhập cục bộ vào các lệnh thiết lập secret CI.

### `star <skill>` / `unstar <skill>`

- Thêm/xóa một kỹ năng khỏi các mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Đầu ra bao gồm slug kỹ năng, handle chủ sở hữu, tên hiển thị và điểm liên quan.
- Tìm kiếm ưu tiên các kết quả khớp chính xác token slug/tên trước độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Độ phổ biến là một yếu tố xếp hạng nhỏ ban đầu, không phải bảo đảm vị trí đầu.
- Nếu một kỹ năng lẽ ra xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect @owner/slug` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt hiển thị với chủ sở hữu trước khi đổi tên siêu dữ liệu.

### `explore`

- Liệt kê các kỹ năng mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|rating|downloads|trending` (mặc định: newest). Các bí danh sắp xếp cài đặt cũ vẫn hoạt động để tương thích.
  - `--json` (đầu ra máy đọc được)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (tóm tắt được cắt ngắn còn 50 ký tự).

### `inspect @owner/slug`

- Lấy siêu dữ liệu kỹ năng và tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản đã gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa để liệt kê (1-200).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `install @owner/slug`

- Phân giải phiên bản mới nhất cho chủ sở hữu và kỹ năng đã đặt tên.
- Tải zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè kỹ năng đã ghim; chạy `clawhub unpin <skill>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ `.clawdhub`)

### `uninstall <skill>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục trong lockfile.
- Gửi telemetry nỗ lực tối đa khi đã đăng nhập để số lượt cài đặt hiện tại có thể được
  hủy kích hoạt.
- Tương tác: hỏi xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`).
- Hiển thị `pinned` bên cạnh các kỹ năng bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <skill>`

- Đánh dấu một kỹ năng đã cài đặt là đã ghim trong lockfile.
- `--reason <text>` ghi lại lý do kỹ năng bị đóng băng.
- Kỹ năng đã ghim được bỏ qua bởi `update --all` và bị từ chối bởi `update <skill>` trực tiếp.
- Kỹ năng đã ghim cũng từ chối `install --force` để các byte cục bộ không bị thay thế ngoài ý muốn.

### `unpin <skill>`

- Xóa ghim lockfile khỏi một kỹ năng đã cài đặt để các bản cập nhật sau này có thể sửa đổi nó.

### `update [@owner/slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không nhắc.
- Nếu fingerprint không khớp:
  - mặc định từ chối
  - ghi đè bằng `--force` (hoặc lời nhắc, nếu tương tác)
- Kỹ năng đã ghim không bao giờ được cập nhật bởi `--force`.
- `update <skill>` thất bại nhanh với kỹ năng đã ghim và yêu cầu bạn chạy `clawhub unpin <skill>` trước.
- `update --all` bỏ qua các slug đã ghim và in tóm tắt về những gì vẫn bị đóng băng.

### `skill publish <path>`

- So sánh fingerprint gói cục bộ với ClawHub và thoát thành công khi
  nội dung đã được phát hành.
- Kỹ năng mới mặc định là `1.0.0`; kỹ năng đã thay đổi mặc định là phiên bản
  patch kế tiếp.
- `--version <version>` chọn rõ một phiên bản và phát hành ngay cả khi
  nội dung khớp với một phiên bản hiện có.
- `--dry-run` phân giải việc phát hành mà không tải lên; `--json` in kết quả
  máy đọc được.
- `--owner <handle>` phát hành dưới handle nhà phát hành tổ chức/người dùng khi
  actor có quyền truy cập nhà phát hành.
- `--migrate-owner` di chuyển một kỹ năng hiện có sang `--owner` trong khi phát hành một
  phiên bản mới. Yêu cầu quyền truy cập quản trị/chủ sở hữu trên cả hai nhà phát hành.
- Hành vi chủ sở hữu và đánh giá được giải thích trong `docs/publishing.md`.
- Phát hành một kỹ năng nghĩa là nó được phát hành theo `MIT-0` trên ClawHub.
- Kỹ năng đã phát hành được dùng, sửa đổi và phân phối lại miễn phí mà không cần ghi công.
- ClawHub không hỗ trợ kỹ năng trả phí hoặc định giá theo từng kỹ năng.
- Bí danh cũ: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Workflow tái sử dụng
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
của ClawHub gọi `skill publish` cho một `skill_path`, hoặc cho từng thư mục kỹ năng trực tiếp
bên dưới `root` (mặc định: `skills`). Nó bỏ qua kỹ năng không thay đổi và dùng
cùng hành vi tự động tăng phiên bản patch.

Đặt `dry_run: true` để xem trước mà không cần token. Phát hành thật yêu cầu
secret `clawhub_token`.

### `sync`

- Quét workdir hiện tại, thư mục kỹ năng đã cấu hình và mọi thư mục
  `--root <dir>` để tìm thư mục kỹ năng cục bộ chứa `SKILL.md` hoặc
  `skill.md`.
- So sánh fingerprint từng kỹ năng cục bộ với ClawHub và chỉ phát hành kỹ năng mới hoặc
  đã thay đổi.
- Kỹ năng mới phát hành là `1.0.0`; kỹ năng đã thay đổi mặc định phát hành phiên bản patch
  kế tiếp. Dùng `--bump minor|major` cho các lô cập nhật cần chuyển theo
  bước semver lớn hơn.
- `--dry-run` hiển thị kế hoạch phát hành mà không tải lên; `--json` in kế hoạch
  máy đọc được.
- `--all` phát hành mọi kỹ năng mới hoặc đã thay đổi mà không nhắc. Nếu không có
  `--all`, terminal tương tác cho phép bạn chọn kỹ năng để phát hành.
- `--owner <handle>` phát hành dưới handle nhà phát hành tổ chức/người dùng khi
  actor có quyền truy cập nhà phát hành.
- `sync` chỉ là phát hành một chiều. Nó không cài đặt, cập nhật, tải xuống hoặc
  báo cáo telemetry cài đặt/tải xuống.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Yêu cầu `clawhub login`.
- Chạy ClawHub ClawScan qua `POST /api/v1/skills/-/scan`, sau đó thăm dò cho đến khi lượt quét kết thúc.
- Các lượt quét là bất đồng bộ và có thể mất thời gian để hoàn tất. Khi đang xếp hàng, spinner terminal hiển thị vị trí quét ưu tiên hiện tại và số lượt quét phía trước.
- Lượt quét đã phát hành yêu cầu quyền sở hữu hoặc quyền truy cập quản lý nhà phát hành. Người kiểm duyệt/quản trị viên có thể dùng cùng backend qua `clawhub-admin`.
- `--update` chỉ hợp lệ với `--slug`; nó ghi kết quả quét đã phát hành thành công trở lại phiên bản đã chọn.
- `--output <file.zip>` tải xuống toàn bộ kho lưu trữ báo cáo với `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.
- `--json` in toàn bộ phản hồi thăm dò để tự động hóa.
- Quét đường dẫn cục bộ không còn được hỗ trợ. Tải lên phiên bản mới, sau đó dùng `scan download` để lấy kết quả quét đã lưu cho phiên bản đã gửi đó.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Yêu cầu `clawhub login`.
- Tải xuống ZIP báo cáo quét đã lưu cho một phiên bản kỹ năng hoặc plugin đã gửi, bao gồm các phiên bản bị chặn hoặc bị ẩn bởi kiểm tra bảo mật ClawHub.
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
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
cho repo kỹ năng và repo catalog.

Thiết lập catalog điển hình:

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

- `root` mặc định là `skills` cho repo catalog.
- Truyền `skill_path: skills/review-helper` để xử lý một thư mục kỹ năng.
- `owner` ánh xạ tới cờ CLI `--owner`; bỏ qua để phát hành với tư cách người dùng đã xác thực.
- Phát hành kỹ năng V1 dùng `clawhub_token`; phát hành tin cậy GitHub OIDC hiện chỉ dành cho gói.

### `delete <skill>`

- Không có `--version`, xóa mềm một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh sẽ in thời điểm hết hạn.
- `--version <version>` xóa vĩnh viễn một phiên bản không mới nhất thuộc sở hữu thông qua một route fail-closed,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc phát hành lại các phiên bản đã xóa. Hãy phát hành bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Nhân viên nền tảng không bỏ qua quyền sở hữu cho luồng chỉ theo phiên bản này.
- `--reason <text>` ghi một ghi chú điều phối vào thao tác xóa mềm toàn bộ kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <skill>`

- Khôi phục một kỹ năng đã ẩn (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Không có thao tác khôi phục phiên bản; các phiên bản đã xóa vĩnh viễn không thể khôi phục.
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi một ghi chú điều phối vào kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <skill>`

- Ẩn một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `delete`.

### `unhide <skill>`

- Bỏ ẩn một kỹ năng (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `undelete`.

### `skill rename <skill> <new-name>`

- Đổi tên một kỹ năng thuộc sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source> <target>`

- Gộp một kỹ năng thuộc sở hữu vào một kỹ năng thuộc sở hữu khác.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng tới đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển tới handle người dùng sẽ tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển tới handle tổ chức/nhà phát hành chỉ áp dụng ngay khi tác nhân có
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
- Dùng lệnh này cho plugin và các mục thuộc họ gói khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm kỹ năng.
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
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-100).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy có thể đọc.

### `package download <name>`

- Phân giải một phiên bản gói qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải artifact xuống từ `downloadUrl` của trình phân giải.
- Xác minh SHA-256 của ClawHub cho tất cả artifact.
- Với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  npm shasum và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP cũ tải xuống qua route ZIP cũ.
- Cờ:
  - `--version <version>`: tải xuống một phiên bản cụ thể.
  - `--tag <tag>`: tải xuống một phiên bản được gắn thẻ (mặc định: `latest`).
  - `-o, --output <path>`: tệp hoặc thư mục đầu ra.
  - `--force`: ghi đè một tệp đầu ra hiện có.
  - `--json`: đầu ra máy có thể đọc.

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
- Với các cờ digest trực tiếp, xác minh mà không tra cứu mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải siêu dữ liệu artifact kỳ vọng.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói kỳ vọng.
  - `--sha256 <hex>`: SHA-256 ClawHub kỳ vọng.
  - `--npm-integrity <sri>`: tính toàn vẹn npm kỳ vọng.
  - `--npm-shasum <sha1>`: npm shasum kỳ vọng.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Chạy Plugin Inspector tích hợp của ClawHub CLI trên thư mục gói plugin
  cục bộ.
- Mặc định là xác thực ngoại tuyến/tĩnh, không định vị hoặc nhập một checkout
  OpenClaw cục bộ.
- Lỗi tương thích nghiêm trọng thoát với mã khác không. Các phát hiện chỉ là cảnh báo được in ra nhưng
  thoát với mã không.
- Cờ:
  - `--out <dir>`: ghi báo cáo Plugin Inspector vào thư mục này.
  - `--openclaw <path>`: kiểm tra dựa trên một checkout OpenClaw cục bộ rõ ràng.
  - `--runtime`: bật thu thập runtime; nhập mã plugin.
  - `--allow-execute`: cho phép thu thập runtime trong một workspace cô lập.
  - `--no-mock-sdk`: tắt OpenClaw SDK giả lập trong quá trình thu thập runtime.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package validate ./example-plugin
```

Nếu xác thực báo cáo một phát hiện về gói, manifest, import SDK hoặc artifact, hãy xem
[Khắc phục xác thực Plugin](/clawhub/plugin-validation-fixes), rồi chạy lại lệnh.

### `package delete <name>`

- Không có `--version`, xóa mềm một gói và tất cả bản phát hành.
- `--version <version>` xóa vĩnh viễn một bản phát hành không mới nhất thuộc sở hữu thông qua một route fail-closed,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc phát hành lại các phiên bản đã xóa. Hãy phát hành bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Luồng chỉ theo phiên bản này yêu cầu chủ sở hữu gói hoặc quản trị viên nhà phát hành tổ chức;
  nhân viên nền tảng không bỏ qua quyền sở hữu gói.
- Xóa mềm toàn bộ gói yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, điều phối viên
  nền tảng hoặc quản trị viên nền tảng.
- Cờ:
  - `--version <version>`: xóa vĩnh viễn một phiên bản không mới nhất.
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Khôi phục một gói và các bản phát hành đã bị xóa mềm.
- Không có thao tác khôi phục phiên bản; các phiên bản đã xóa vĩnh viễn không thể khôi phục.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, điều phối viên nền tảng,
  hoặc quản trị viên nền tảng.
- Gọi `POST /api/v1/packages/{name}/undelete`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Chuyển một gói sang nhà phát hành khác.
- Yêu cầu quyền truy cập quản trị vào cả chủ sở hữu gói hiện tại và nhà phát hành
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải chuyển tới chủ sở hữu phạm vi khớp.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: handle nhà phát hành đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho điều phối viên.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, có thể gắn với một phiên bản, và trở nên hiển thị
  với điều phối viên để xem xét.
- Báo cáo tự nó không tự động ẩn gói hoặc chặn tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra máy có thể đọc.

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
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng cho OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, tính sẵn có của ClawPack, digest artifact,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, đích máy chủ, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển hướng tới vận hành cho một gói có thể thay thế một
  plugin OpenClaw tích hợp.
- Gọi cùng endpoint readiness được tính toán như `package readiness`, nhưng in
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, kiểm tra và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Tạo một nhà phát hành tổ chức thuộc sở hữu của người dùng đã xác thực.
- Handle được chuẩn hóa thành chữ thường và có thể được truyền có hoặc không có `@`.
- Các nhà phát hành tổ chức mới tạo không được tin cậy/chính thức theo mặc định.
- Thất bại nếu handle đã được dùng bởi một nhà phát hành, người dùng hoặc route dành riêng hiện có.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Phát hành Plugin mã hoặc Plugin gói qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json` và
  các dấu hiệu gói OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được coi là ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và điền sẵn
  siêu dữ liệu.
- Thư mục Plugin mã được đóng gói thành tarball npm ClawPack trước khi tải lên để
  bản cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục Plugin gói vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Với nguồn GitHub, thông tin quy nguồn được tự động điền từ repo, commit đã phân giải, ref và đường dẫn con.
- Với thư mục cục bộ, thông tin quy nguồn được tự động phát hiện từ git cục bộ khi remote origin trỏ đến GitHub.
- Plugin mã bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm dự phòng cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` xuất đầu ra máy đọc được cho CI.
- `--owner <handle>` phát hành dưới handle nhà phát hành của người dùng hoặc tổ chức khi actor có quyền truy cập nhà phát hành.
- Tên package có scope phải khớp với owner đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như ghi đè.
- Repo GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Quy trình cục bộ được khuyến nghị

Trước tiên hãy dùng `--dry-run` để bạn có thể xác nhận siêu dữ liệu package đã phân giải và
thông tin quy nguồn trước khi tạo bản phát hành thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Quy trình thư mục cục bộ

Với Plugin mã, phát hành từ thư mục sẽ xây dựng và tải lên artifact ClawPack từ
thư mục package:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Plugin mã bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
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

- `package.json.version` là phiên bản phát hành package của bạn, nhưng nó không được dùng làm
  dự phòng cho xác thực tương thích/bản dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các bước kiểm tra trước cục bộ chạy trước khi tải lên.
- Nếu xác thực báo mã khắc phục, xem
  [Các bản sửa lỗi xác thực Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub cũng cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
cho repo Plugin.

Thiết lập bên gọi điển hình:

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

- Workflow tái sử dụng mặc định đặt `source` thành repo bên gọi.
- Với monorepo, truyền `source_path` để workflow phát hành thư mục package
  Plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành release từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không tạo dữ liệu phụ.
- Phát hành thật nên được giới hạn ở các sự kiện tin cậy như `workflow_dispatch` hoặc push tag.
- Phát hành tin cậy không cần secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` khả dụng cho lần phát hành đầu tiên, package không tin cậy hoặc phát hành khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng artifact và hiển thị nó làm đầu ra workflow.

### `package trusted-publisher get <name>`

- Hiển thị cấu hình nhà phát hành tin cậy GitHub Actions cho package.
- Dùng lệnh này sau khi đặt cấu hình để xác nhận repository, tên tệp workflow
  và ghim môi trường tùy chọn.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Gắn hoặc thay thế cấu hình nhà phát hành tin cậy GitHub Actions cho một
  package hiện có.
- Package phải được tạo trước thông qua lệnh
  `clawhub package publish` thủ công bình thường hoặc có xác thực bằng token.
- Sau khi cấu hình được đặt, các lần phát hành GitHub Actions được hỗ trợ trong tương lai có thể dùng
  OIDC/phát hành tin cậy mà không cần token ClawHub dài hạn.
- `--repository <repo>` phải là `owner/repo`.
- `--workflow-filename <file>` phải khớp với tên tệp workflow trong
  `.github/workflows/`.
- `--environment <name>` là tùy chọn. Khi được cấu hình, môi trường GitHub Actions
  trong claim OIDC phải khớp chính xác.
- ClawHub xác minh repository GitHub đã cấu hình khi lệnh này chạy.
  Repository công khai có thể được xác minh qua siêu dữ liệu GitHub công khai. Repository
  riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào repository đó, ví dụ
  thông qua bản cài đặt GitHub App ClawHub trong tương lai hoặc một tích hợp
  GitHub được ủy quyền khác.
- Cờ:
  - `--repository <repo>`: repository GitHub, ví dụ `openclaw/example-plugin`.
  - `--workflow-filename <file>`: tên tệp workflow, ví dụ `package-publish.yml`.
  - `--environment <name>`: môi trường GitHub Actions khớp chính xác tùy chọn.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Xóa cấu hình nhà phát hành tin cậy khỏi package.
- Dùng lệnh này để rollback nếu workflow, repository hoặc ghim môi trường cần
  bị tắt hoặc tạo lại.
- Các lần phát hành thật trong tương lai phải dùng phát hành có xác thực bình thường cho đến khi cấu hình
  được đặt lại.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Đo từ xa khi cài đặt

- Được gửi sau `clawhub install <slug>` khi đã đăng nhập, trừ khi
  `CLAWHUB_DISABLE_TELEMETRY=1` được đặt.
- Việc báo cáo là nỗ lực tối đa. Lệnh cài đặt không thất bại nếu đo từ xa
  không khả dụng.
- Chi tiết: `docs/telemetry.md`.
