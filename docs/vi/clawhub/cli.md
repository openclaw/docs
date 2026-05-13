---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi cài đặt, cập nhật, phát hành hoặc đồng bộ hóa
summary: 'Tài liệu tham khảo CLI: lệnh, cờ, cấu hình, tệp khóa, hành vi đồng bộ hóa.'
x-i18n:
    generated_at: "2026-05-13T05:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Gói CLI: `clawhub`, tệp thực thi: `clawhub`.

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

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; dự phòng về không gian làm việc Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL cơ sở để đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở của API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Biến env tương đương:

- `CLAWHUB_SITE` (cũ `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (cũ `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (cũ `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI tôn trọng các biến môi trường proxy HTTP tiêu chuẩn cho các hệ thống nằm sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu đi ra qua
proxy được chỉ định. `HTTPS_PROXY` được dùng cho các yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống chặn kết nối đi ra trực tiếp
(ví dụ: container Docker, VPS Hetzner chỉ có internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không đặt biến proxy nào, hành vi không đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu trữ token API của bạn + URL registry đã lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI sẽ dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback local loopback.
- Không giao diện: `clawhub login --token clh_...`
- Tương tác từ xa/không giao diện: `clawhub login --device` in mã và chờ trong khi bạn ủy quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Thêm/xóa một kỹ năng khỏi phần nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Tìm kiếm ưu tiên các kết quả khớp chính xác token slug/tên trước độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Lượt tải xuống là một tín hiệu độ phổ biến nhỏ, không phải bảo đảm về vị trí hàng đầu.
- Nếu một kỹ năng nên xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect <slug>` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt mà chủ sở hữu nhìn thấy trước khi đổi tên siêu dữ liệu.

### `explore`

- Liệt kê các kỹ năng mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (được sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (mặc định: newest)
  - `--json` (đầu ra máy đọc được)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (tóm tắt được cắt ngắn còn 50 ký tự).

### `inspect <slug>`

- Tải siêu dữ liệu kỹ năng và tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản đã gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-200).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: tải nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `install <slug>`

- Phân giải phiên bản mới nhất qua `/api/v1/skills/<slug>`.
- Tải zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè các kỹ năng đã ghim; chạy `clawhub unpin <slug>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ `.clawdhub`)

### `uninstall <slug>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục nhập lockfile.
- Tương tác: yêu cầu xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (`.clawdhub` kế thừa).
- Hiển thị `pinned` bên cạnh các Skills bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <slug>`

- Đánh dấu một skill đã cài đặt là được ghim trong lockfile.
- `--reason <text>` ghi lại lý do skill bị đóng băng.
- Các skill được ghim sẽ bị `update --all` bỏ qua và bị từ chối khi chạy trực tiếp `update <slug>`.
- Các skill được ghim cũng từ chối `install --force` để các byte cục bộ không bị thay thế ngoài ý muốn.

### `unpin <slug>`

- Xóa ghim trong lockfile khỏi một skill đã cài đặt để các bản cập nhật sau này có thể sửa đổi nó.

### `update [slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không nhắc.
- Nếu fingerprint không khớp:
  - mặc định từ chối
  - ghi đè bằng `--force` (hoặc nhắc, nếu ở chế độ tương tác)
- Các skill được ghim không bao giờ được cập nhật bằng `--force`.
- `update <slug>` thất bại nhanh với các slug được ghim và yêu cầu bạn chạy `clawhub unpin <slug>` trước.
- `update --all` bỏ qua các slug được ghim và in bản tóm tắt những gì vẫn bị đóng băng.

### `skill publish <path>`

- Xuất bản qua `POST /api/v1/skills` (multipart).
- Yêu cầu semver: `--version 1.2.3`.
- `--owner <handle>` xuất bản dưới handle nhà phát hành của tổ chức/người dùng khi
  người thực hiện có quyền truy cập nhà phát hành.
- `--migrate-owner` chuyển một skill hiện có sang `--owner` trong khi xuất bản một
  phiên bản mới. Yêu cầu quyền quản trị/chủ sở hữu trên cả hai nhà phát hành.
- Hành vi về chủ sở hữu và xét duyệt được giải thích trong `docs/publishing.md`.
- Xuất bản một skill nghĩa là nó được phát hành theo `MIT-0` trên ClawHub.
- Các skill đã xuất bản được tự do sử dụng, sửa đổi và phân phối lại mà không cần ghi công.
- ClawHub không hỗ trợ skill trả phí hoặc định giá theo từng skill.
- `--clawscan-note <text>` thêm ghi chú ClawScan. Ghi chú này cung cấp cho ClawScan
  ngữ cảnh về hành vi có thể trông bất thường, chẳng hạn như truy cập mạng,
  truy cập native host, hoặc thông tin xác thực dành riêng cho nhà cung cấp. Ghi chú được lưu trên
  phiên bản đã xuất bản.
- Bí danh kế thừa: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Xóa mềm một skill (chủ sở hữu, điều phối viên, hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh in thời điểm hết hạn.
- `--reason <text>` ghi lại ghi chú điều phối trên skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <slug>`

- Khôi phục một skill bị ẩn (chủ sở hữu, điều phối viên, hoặc quản trị viên).
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú điều phối trên skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <slug>`

- Ẩn một skill (chủ sở hữu, điều phối viên, hoặc quản trị viên).
- Bí danh của `delete`.

### `unhide <slug>`

- Bỏ ẩn một skill (chủ sở hữu, điều phối viên, hoặc quản trị viên).
- Bí danh của `undelete`.

### `skill rename <slug> <new-slug>`

- Đổi tên một skill thuộc sở hữu của bạn và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source-slug> <target-slug>`

- Hợp nhất một skill thuộc sở hữu của bạn vào một skill khác thuộc sở hữu của bạn.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển sang handle người dùng sẽ tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển sang handle tổ chức/nhà phát hành chỉ áp dụng ngay lập tức khi người thực hiện có
  quyền quản trị đối với cả chủ sở hữu hiện tại và nhà phát hành đích.
- Lệnh con:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Duyệt hoặc tìm kiếm danh mục gói hợp nhất qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Dùng lệnh này cho Plugin và các mục họ gói khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm skill.
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
- Dùng lệnh này cho siêu dữ liệu Plugin, khả năng tương thích, xác minh, nguồn, và kiểm tra phiên bản/tệp.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-100).
- `--files`: liệt kê các tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `package download <name>`

- Phân giải một phiên bản gói qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải artifact xuống từ `downloadUrl` của resolver.
- Xác minh ClawHub SHA-256 cho tất cả artifact.
- Với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  npm shasum, và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP kế thừa tải xuống qua route ZIP kế thừa.
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

- Tính ClawHub SHA-256, tính toàn vẹn npm `sha512`, và npm shasum cho một
  artifact cục bộ.
- Với `--package`, phân giải siêu dữ liệu dự kiến từ ClawHub và so sánh
  tệp cục bộ với siêu dữ liệu artifact đã xuất bản.
- Với các cờ digest trực tiếp, xác minh mà không tra cứu qua mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải siêu dữ liệu artifact dự kiến.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói dự kiến.
  - `--sha256 <hex>`: ClawHub SHA-256 dự kiến.
  - `--npm-integrity <sri>`: tính toàn vẹn npm dự kiến.
  - `--npm-shasum <sha1>`: npm shasum dự kiến.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Xóa mềm một gói và tất cả bản phát hành.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành thuộc tổ chức, điều phối viên nền tảng,
  hoặc quản trị viên nền tảng.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Khôi phục một gói đã bị xóa mềm và các bản phát hành.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành thuộc tổ chức, điều phối viên nền tảng,
  hoặc quản trị viên nền tảng.
- Gọi `POST /api/v1/packages/{name}/undelete`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Chuyển một gói sang nhà phát hành khác.
- Yêu cầu quyền truy cập quản trị đối với cả chủ sở hữu gói hiện tại và nhà phát hành
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải được chuyển cho chủ sở hữu phạm vi khớp.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: handle nhà phát hành đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho điều phối viên.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, tùy chọn gắn với một phiên bản, và sẽ hiển thị
  cho điều phối viên xem xét.
- Báo cáo không tự động ẩn gói hoặc tự chặn lượt tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị kiểm duyệt của gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số lượng báo cáo đang mở, trạng thái kiểm duyệt thủ công
  của bản phát hành mới nhất, trạng thái chặn tải xuống và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng cho việc OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, tính sẵn có của ClawPack, digest artifact,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, mục tiêu host, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển hướng tới vận hành cho một gói có thể thay thế một
  Plugin OpenClaw được đóng gói sẵn.
- Gọi cùng endpoint readiness đã tính toán như `package readiness`, nhưng in
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, các kiểm tra và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra cho máy đọc được.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Phát hành một Plugin mã hoặc Plugin bundle qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Kho GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các dấu hiệu bundle OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xem là ClawPack. CLI tải lên đúng byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và
  điền sẵn siêu dữ liệu.
- Thư mục Plugin mã được đóng gói thành một tarball npm ClawPack trước khi tải lên để
  các bản cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục Plugin bundle vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Đối với nguồn GitHub, thông tin quy nguồn được tự động điền từ kho, commit đã phân giải, ref và đường dẫn con.
- Đối với thư mục cục bộ, thông tin quy nguồn được tự động phát hiện từ git cục bộ khi remote origin trỏ tới GitHub.
- Plugin mã bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm giá trị dự phòng cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` xuất đầu ra cho máy đọc được dành cho CI.
- `--owner <handle>` phát hành dưới handle nhà phát hành là người dùng hoặc tổ chức khi tác nhân có quyền truy cập nhà phát hành.
- `--clawscan-note <text>` thêm một ghi chú ClawScan. Ghi chú này cung cấp cho ClawScan
  ngữ cảnh về hành vi có thể trông bất thường, chẳng hạn như truy cập mạng,
  truy cập host native, hoặc thông tin xác thực dành riêng cho nhà cung cấp. Ghi chú được lưu trên
  bản phát hành đã phát hành.
- Tên gói có phạm vi phải khớp với chủ sở hữu đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như các ghi đè.
- Kho GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Luồng cục bộ được khuyến nghị

Trước tiên hãy dùng `--dry-run` để bạn có thể xác nhận siêu dữ liệu gói đã phân giải và
thông tin quy nguồn trước khi tạo bản phát hành live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Đối với Plugin mã, phát hành từ thư mục sẽ xây dựng và tải lên một artifact ClawPack từ
thư mục gói:

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

Trường bắt buộc:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Ghi chú:

- `package.json.version` là phiên bản phát hành gói của bạn, nhưng nó không được dùng làm
  giá trị dự phòng cho xác thực khả năng tương thích/bản dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu khả năng tương thích chi tiết hơn.
- Nếu bạn đang dùng một bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các kiểm tra preflight cục bộ chạy trước khi tải lên.

#### GitHub Actions

ClawHub cũng cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
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

- Workflow tái sử dụng mặc định `source` thành kho caller.
- Đối với monorepo, truyền `source_path` để workflow phát hành thư mục gói
  Plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào một tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành release từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không gây ô nhiễm.
- Các lần phát hành thật nên được giới hạn trong những sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Phát hành đáng tin cậy không có secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` khả dụng cho lần phát hành đầu tiên, các gói không đáng tin cậy, hoặc phát hành khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng artifact và cung cấp nó dưới dạng đầu ra workflow.

### `sync`

- Quét các thư mục skill cục bộ và phát hành những thư mục mới/đã thay đổi.
- Gốc có thể là bất kỳ thư mục nào: một thư mục skills hoặc một thư mục skill đơn lẻ có `SKILL.md`.
- Tự động thêm các gốc skill Clawdbot khi có `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent chính)
  - `routing.agents.*.workspace/skills` (theo từng agent)
  - `~/.clawdbot/skills` (dùng chung)
  - `skills.load.extraDirs` (gói dùng chung)
- Tôn trọng `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` và `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Cờ:
  - `--root <dir...>` gốc quét bổ sung
  - `--all` tải lên mà không hỏi
  - `--dry-run` chỉ hiển thị kế hoạch
  - `--bump patch|minor|major` (mặc định: patch)
  - `--changelog <text>` (không tương tác)
  - `--tags a,b,c` (mặc định: latest)
  - `--concurrency <n>` (mặc định: 4)

Đo từ xa:

- Được gửi trong quá trình `sync` khi đã đăng nhập, trừ khi `CLAWHUB_DISABLE_TELEMETRY=1` (`CLAWDHUB_DISABLE_TELEMETRY=1` cũ).
- Chi tiết: `docs/telemetry.md`.
