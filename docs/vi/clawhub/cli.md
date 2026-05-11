---
read_when:
    - Sử dụng ClawHub CLI
    - Gỡ lỗi quá trình cài đặt, cập nhật, phát hành hoặc đồng bộ hóa
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình, tệp khóa, hành vi đồng bộ hóa.'
x-i18n:
    generated_at: "2026-05-11T20:23:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; quay về không gian làm việc Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL cơ sở để đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Các biến môi trường tương đương:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` cũ)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` cũ)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` cũ)

### Proxy HTTP

CLI tuân theo các biến môi trường proxy HTTP tiêu chuẩn cho các hệ thống nằm sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu gửi ra ngoài qua
proxy đã chỉ định. `HTTPS_PROXY` được dùng cho yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống nơi các kết nối trực tiếp gửi ra ngoài bị chặn
(ví dụ: container Docker, VPS Hetzner với internet chỉ qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không có biến proxy nào được đặt, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu trữ token API của bạn + URL registry đã lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI sẽ dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` cũ)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback loopback.
- Không giao diện: `clawhub login --token clh_...`
- Tương tác từ xa/không giao diện: `clawhub login --device` in ra một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Thêm/xóa một kỹ năng khỏi các mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Tìm kiếm ưu tiên các kết quả khớp token slug/tên chính xác trước mức độ phổ biến theo lượt tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Lượt tải xuống là một tín hiệu phổ biến nhỏ ban đầu, không phải bảo đảm cho vị trí đầu.
- Nếu một kỹ năng đáng lẽ xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect <slug>` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt hiển thị với chủ sở hữu trước khi đổi tên siêu dữ liệu.

### `explore`

- Liệt kê các kỹ năng mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (mặc định: newest)
  - `--json` (đầu ra máy có thể đọc)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (tóm tắt bị cắt còn 50 ký tự).

### `inspect <slug>`

- Lấy siêu dữ liệu kỹ năng và các tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa để liệt kê (1-200).
- `--files`: liệt kê các tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy có thể đọc.

### `install <slug>`

- Phân giải phiên bản mới nhất qua `/api/v1/skills/<slug>`.
- Tải xuống zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè các kỹ năng đã ghim; hãy chạy `clawhub unpin <slug>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` cũ)

### `uninstall <slug>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục trong lockfile.
- Tương tác: yêu cầu xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (`.clawdhub` cũ).
- Hiển thị `pinned` bên cạnh các skill bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <slug>`

- Đánh dấu một skill đã cài đặt là được ghim trong tệp khóa.
- `--reason <text>` ghi lại lý do skill bị đóng băng.
- Các skill được ghim sẽ bị `update --all` bỏ qua và bị từ chối khi `update <slug>` trực tiếp.
- Các skill được ghim cũng từ chối `install --force` để các byte cục bộ không thể bị thay thế ngoài ý muốn.

### `unpin <slug>`

- Xóa ghim trong tệp khóa khỏi một skill đã cài đặt để các bản cập nhật sau này có thể sửa đổi nó.

### `update [slug]` / `update --all`

- Tính dấu vân tay từ các tệp cục bộ.
- Nếu dấu vân tay khớp với một phiên bản đã biết: không nhắc.
- Nếu dấu vân tay không khớp:
  - từ chối theo mặc định
  - ghi đè bằng `--force` (hoặc nhắc, nếu tương tác)
- Các skill được ghim không bao giờ được cập nhật bằng `--force`.
- `update <slug>` thất bại nhanh đối với các slug được ghim và yêu cầu bạn chạy `clawhub unpin <slug>` trước.
- `update --all` bỏ qua các slug được ghim và in bản tóm tắt về những gì vẫn bị đóng băng.

### `skill publish <path>`

- Xuất bản qua `POST /api/v1/skills` (nhiều phần).
- Yêu cầu semver: `--version 1.2.3`.
- `--owner <handle>` xuất bản dưới định danh nhà xuất bản của tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà xuất bản.
- `--migrate-owner` chuyển một skill hiện có sang `--owner` trong khi xuất bản một
  phiên bản mới. Yêu cầu quyền quản trị/chủ sở hữu trên cả hai nhà xuất bản.
- Hành vi chủ sở hữu và xét duyệt được giải thích trong `docs/publishing.md`.
- Xuất bản một skill nghĩa là skill đó được phát hành theo `MIT-0` trên ClawHub.
- Các skill đã xuất bản được sử dụng, sửa đổi và phân phối lại miễn phí mà không cần ghi công.
- ClawHub không hỗ trợ skill trả phí hoặc định giá theo từng skill.
- Bí danh cũ: `publish <path>`.

### `delete <slug>`

- Xóa mềm một skill (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh in thời gian hết hạn.
- `--reason <text>` ghi lại ghi chú điều phối trên skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <slug>`

- Khôi phục một skill đã ẩn (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú điều phối trên skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <slug>`

- Ẩn một skill (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `delete`.

### `unhide <slug>`

- Bỏ ẩn một skill (chủ sở hữu, điều phối viên hoặc quản trị viên).
- Bí danh của `undelete`.

### `skill rename <slug> <new-slug>`

- Đổi tên một skill thuộc sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source-slug> <target-slug>`

- Hợp nhất một skill thuộc sở hữu vào một skill thuộc sở hữu khác.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `skill rescan <slug>`

- Yêu cầu quét lại bảo mật cho phiên bản skill đã xuất bản mới nhất.
- Chủ sở hữu và quản trị viên nhà xuất bản có thể quét lại skill của họ đến giới hạn
  khôi phục theo từng phiên bản.
- Điều phối viên và quản trị viên nền tảng có thể quét lại bất kỳ skill nào và không bị chặn bởi
  giới hạn khôi phục của chủ sở hữu, mặc dù mỗi phiên bản chỉ có thể chạy một lần quét lại tại một thời điểm.
- Gọi `POST /api/v1/skills/{slug}/rescan`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển đến định danh người dùng sẽ tạo yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển đến định danh tổ chức/nhà xuất bản chỉ áp dụng ngay khi tác nhân có
  quyền quản trị đối với cả chủ sở hữu hiện tại và nhà xuất bản đích.
- Lệnh con:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Điểm cuối:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Duyệt hoặc tìm kiếm danh mục gói hợp nhất qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Dùng lệnh này cho plugin và các mục khác thuộc họ gói; `search` cấp cao nhất vẫn là bề mặt tìm kiếm skill.
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
- `--json`: đầu ra máy đọc được.

### `package download <name>`

- Phân giải một phiên bản gói thông qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải xuống hiện vật từ `downloadUrl` của bộ phân giải.
- Xác minh SHA-256 của ClawHub cho tất cả hiện vật.
- Đối với hiện vật npm-pack ClawPack, cũng xác minh tính toàn vẹn npm `sha512`,
  shasum npm và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP cũ tải xuống qua tuyến ZIP cũ.
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
  hiện vật cục bộ.
- Với `--package`, phân giải siêu dữ liệu kỳ vọng từ ClawHub và so sánh
  tệp cục bộ với siêu dữ liệu hiện vật đã xuất bản.
- Với các cờ digest trực tiếp, xác minh mà không cần tra cứu qua mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải siêu dữ liệu hiện vật kỳ vọng.
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

### `package delete <name>`

- Xóa mềm một gói và tất cả bản phát hành.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản tổ chức, điều phối viên nền tảng,
  hoặc quản trị viên nền tảng.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Khôi phục một gói và các bản phát hành đã bị xóa mềm.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản tổ chức, điều phối viên nền tảng,
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

- Chuyển một gói sang nhà xuất bản khác.
- Yêu cầu quyền truy cập quản trị đối với cả chủ sở hữu gói hiện tại và nhà xuất bản
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải chuyển đến chủ sở hữu phạm vi tương ứng.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: định danh nhà xuất bản đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- Yêu cầu quét lại bảo mật cho bản phát hành gói mới nhất đã xuất bản.
- Chủ sở hữu và quản trị viên nhà xuất bản có thể quét lại gói của chính họ đến giới hạn khôi phục
  theo từng bản phát hành.
- Điều phối viên và quản trị viên nền tảng có thể quét lại bất kỳ gói nào và không bị chặn bởi
  giới hạn khôi phục của chủ sở hữu, mặc dù mỗi bản phát hành chỉ có thể chạy một lần quét lại tại một thời điểm.
- Gọi `POST /api/v1/packages/{name}/rescan`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho điều phối viên.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, có thể gắn với một phiên bản, và sẽ hiển thị
  cho điều phối viên xem xét.
- Bản thân báo cáo không tự động ẩn gói hoặc chặn tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Lệnh dành cho chủ sở hữu/nhà xuất bản để khiếu nại kiểm duyệt bản phát hành.
- Gọi `POST /api/v1/packages/{name}/appeal`.
- Khiếu nại được chấp nhận cho các bản phát hành bị cách ly, thu hồi, đáng ngờ hoặc độc hại.
- Cờ:
  - `--version <version>`: phiên bản gói bắt buộc.
  - `--message <text>`: thông điệp khiếu nại bắt buộc.
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị kiểm duyệt của gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số báo cáo đang mở, trạng thái kiểm duyệt thủ công
  của bản phát hành mới nhất, trạng thái chặn tải xuống và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng để OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, khả dụng ClawPack, digest artifact,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, mục tiêu máy chủ, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển theo hướng vận hành cho một gói có thể thay thế
  một plugin OpenClaw đi kèm.
- Gọi cùng endpoint mức độ sẵn sàng được tính toán như `package readiness`, nhưng in
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, các kiểm tra và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra máy có thể đọc.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Xuất bản một code plugin hoặc bundle plugin qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các dấu hiệu bundle OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xử lý như ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và điền sẵn
  siêu dữ liệu.
- Thư mục code-plugin được đóng gói thành tarball npm ClawPack trước khi tải lên để
  các cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục bundle-plugin vẫn
  dùng đường dẫn xuất bản tệp đã trích xuất.
- Với nguồn GitHub, thuộc tính nguồn được tự động điền từ repo, commit đã phân giải, ref và đường dẫn con.
- Với thư mục cục bộ, thuộc tính nguồn được tự động phát hiện từ git cục bộ khi remote origin trỏ tới GitHub.
- Code plugin bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm dự phòng cho xác thực xuất bản.
- `--dry-run` xem trước payload xuất bản đã phân giải mà không tải lên.
- `--json` phát ra đầu ra máy có thể đọc cho CI.
- `--owner <handle>` xuất bản dưới định danh nhà xuất bản người dùng hoặc tổ chức khi tác nhân có quyền truy cập nhà xuất bản.
- Tên gói có phạm vi phải khớp với chủ sở hữu đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như ghi đè.
- Repo GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

#### Luồng cục bộ được khuyến nghị

Dùng `--dry-run` trước để bạn có thể xác nhận siêu dữ liệu gói đã phân giải và
thuộc tính nguồn trước khi tạo bản phát hành thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Đối với code plugin, xuất bản thư mục sẽ xây dựng và tải lên artifact ClawPack từ
thư mục gói:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Code plugin bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
`package.json`. Manifest tối thiểu này là đủ để xuất bản thành công:

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

- `package.json.version` là phiên bản phát hành gói của bạn, nhưng không được dùng làm
  dự phòng cho xác thực tương thích/xây dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng không bắt buộc để xuất bản.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là các phần bổ sung tùy chọn nếu bạn muốn xuất bản
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi xuất bản để
  các kiểm tra tiền kiểm cục bộ chạy trước khi tải lên.

#### GitHub Actions

ClawHub cũng cung cấp workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
cho các repo plugin.

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

- Workflow tái sử dụng mặc định `source` là repo caller.
- Với monorepo, truyền `source_path` để workflow xuất bản thư mục gói
  plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào một tag ổn định hoặc SHA commit đầy đủ. Không chạy xuất bản bản phát hành từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không tạo dữ liệu phát hành.
- Xuất bản thật nên được giới hạn ở các sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Xuất bản đáng tin cậy không cần secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` khả dụng cho lần xuất bản đầu tiên, gói không đáng tin cậy hoặc xuất bản khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng artifact và công bố nó làm đầu ra workflow.

### `sync`

- Quét các thư mục skill cục bộ và xuất bản các mục mới/đã thay đổi.
- Gốc có thể là bất kỳ thư mục nào: thư mục skills hoặc một thư mục skill duy nhất có `SKILL.md`.
- Tự động thêm các gốc skill Clawdbot khi có `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (tác nhân chính)
  - `routing.agents.*.workspace/skills` (theo từng tác nhân)
  - `~/.clawdbot/skills` (dùng chung)
  - `skills.load.extraDirs` (gói dùng chung)
- Tôn trọng `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` và `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Cờ:
  - `--root <dir...>` gốc quét bổ sung
  - `--all` tải lên mà không nhắc
  - `--dry-run` chỉ hiển thị kế hoạch
  - `--bump patch|minor|major` (mặc định: patch)
  - `--changelog <text>` (không tương tác)
  - `--tags a,b,c` (mặc định: latest)
  - `--concurrency <n>` (mặc định: 4)

Dữ liệu đo từ xa:

- Được gửi trong quá trình `sync` khi đã đăng nhập, trừ khi `CLAWHUB_DISABLE_TELEMETRY=1` (`CLAWDHUB_DISABLE_TELEMETRY=1` kế thừa).
- Chi tiết: `docs/telemetry.md`.
