---
read_when:
    - Sử dụng ClawHub CLI
    - Gỡ lỗi cài đặt, cập nhật, phát hành hoặc đồng bộ hóa
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình, tệp khóa, hành vi đồng bộ.'
x-i18n:
    generated_at: "2026-05-13T04:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
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
- `--site <url>`: URL cơ sở cho đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở của API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Biến môi trường tương đương:

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
proxy đã chỉ định. `HTTPS_PROXY` được dùng cho các yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thường. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống nơi kết nối đi ra trực tiếp bị chặn
(ví dụ: container Docker, VPS Hetzner chỉ có internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không có biến proxy nào được đặt, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API của bạn + URL registry được lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt đến `<site>/cli/auth` và hoàn tất qua callback local loopback.
- Headless: `clawhub login --token clh_...`
- Tương tác từ xa/headless: `clawhub login --device` in một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Thêm/xóa một kỹ năng khỏi phần nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Tìm kiếm ưu tiên các kết quả khớp chính xác token slug/tên trước mức độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Lượt tải xuống chỉ là một tín hiệu phổ biến nhỏ, không đảm bảo vị trí đầu.
- Nếu một kỹ năng đáng lẽ xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect <slug>` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt mà chủ sở hữu có thể thấy trước khi đổi tên metadata.

### `explore`

- Liệt kê các kỹ năng mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (mặc định: newest)
  - `--json` (đầu ra máy có thể đọc)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (summary được cắt còn 50 ký tự).

### `inspect <slug>`

- Lấy metadata kỹ năng và các tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản đã gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-200).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy có thể đọc.

### `install <slug>`

- Phân giải phiên bản mới nhất qua `/api/v1/skills/<slug>`.
- Tải xuống zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè các kỹ năng đã ghim; chạy `clawhub unpin <slug>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ `.clawdhub`)

### `uninstall <slug>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục trong lockfile.
- Tương tác: hỏi xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (di sản `.clawdhub`).
- Hiển thị `pinned` bên cạnh các Skills bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <slug>`

- Đánh dấu một Skill đã cài đặt là đã ghim trong lockfile.
- `--reason <text>` ghi lại lý do Skill bị đóng băng.
- Các Skills đã ghim được `update --all` bỏ qua và bị từ chối khi chạy trực tiếp `update <slug>`.
- Các Skills đã ghim cũng từ chối `install --force` để dữ liệu cục bộ không thể bị thay thế vô tình.

### `unpin <slug>`

- Gỡ ghim trong lockfile khỏi một Skill đã cài đặt để các bản cập nhật sau này có thể sửa đổi Skill đó.

### `update [slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không nhắc.
- Nếu fingerprint không khớp:
  - từ chối theo mặc định
  - ghi đè bằng `--force` (hoặc nhắc, nếu tương tác)
- Các Skills đã ghim không bao giờ được cập nhật bằng `--force`.
- `update <slug>` thất bại nhanh với các slug đã ghim và yêu cầu bạn chạy `clawhub unpin <slug>` trước.
- `update --all` bỏ qua các slug đã ghim và in bản tóm tắt những gì vẫn được đóng băng.

### `skill publish <path>`

- Xuất bản qua `POST /api/v1/skills` (multipart).
- Yêu cầu semver: `--version 1.2.3`.
- `--owner <handle>` xuất bản dưới handle của nhà xuất bản là tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà xuất bản.
- `--migrate-owner` chuyển một Skill hiện có sang `--owner` trong khi xuất bản một
  phiên bản mới. Yêu cầu quyền truy cập admin/owner trên cả hai nhà xuất bản.
- Hành vi owner và review được giải thích trong `docs/publishing.md`.
- Xuất bản một Skill nghĩa là Skill đó được phát hành theo `MIT-0` trên ClawHub.
- Các Skills đã xuất bản được tự do sử dụng, sửa đổi và phân phối lại mà không cần ghi công.
- ClawHub không hỗ trợ Skills trả phí hoặc định giá theo từng Skill.
- `--clawscan-note <text>` thêm ghi chú ClawScan. Ghi chú này cung cấp cho ClawScan
  ngữ cảnh về hành vi có thể trông bất thường, chẳng hạn như truy cập mạng,
  truy cập native host, hoặc thông tin xác thực dành riêng cho provider. Ghi chú được lưu trên
  phiên bản đã xuất bản.
- Bí danh di sản: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Xóa mềm một Skill (owner, moderator, hoặc admin).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các thao tác xóa mềm do owner khởi tạo giữ trước slug trong 30 ngày; lệnh in thời điểm hết hạn.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên Skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <slug>`

- Khôi phục một Skill đã ẩn (owner, moderator, hoặc admin).
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên Skill và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <slug>`

- Ẩn một Skill (owner, moderator, hoặc admin).
- Bí danh của `delete`.

### `unhide <slug>`

- Bỏ ẩn một Skill (owner, moderator, hoặc admin).
- Bí danh của `undelete`.

### `skill rename <slug> <new-slug>`

- Đổi tên một Skill thuộc sở hữu của bạn và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source-slug> <target-slug>`

- Hợp nhất một Skill thuộc sở hữu của bạn vào một Skill khác thuộc sở hữu của bạn.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Chuyển đến handle người dùng tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Chuyển đến handle tổ chức/nhà xuất bản chỉ được áp dụng ngay khi tác nhân có
  quyền admin đối với cả owner hiện tại và nhà xuất bản đích.
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

- Duyệt hoặc tìm kiếm catalog package hợp nhất qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Dùng lệnh này cho plugins và các mục thuộc họ package khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm Skill.
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

- Lấy metadata package mà không cài đặt.
- Dùng lệnh này cho metadata, khả năng tương thích, xác minh, nguồn và kiểm tra phiên bản/tệp của plugin.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản có tag (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa để liệt kê (1-100).
- `--files`: liệt kê tệp cho phiên bản đã chọn.
- `--file <path>`: lấy nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `package download <name>`

- Phân giải một phiên bản package thông qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải artifact từ `downloadUrl` của resolver.
- Xác minh SHA-256 của ClawHub cho tất cả artifact.
- Với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  npm shasum và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP di sản tải xuống qua route ZIP di sản.
- Cờ:
  - `--version <version>`: tải xuống một phiên bản cụ thể.
  - `--tag <tag>`: tải xuống một phiên bản có tag (mặc định: `latest`).
  - `-o, --output <path>`: tệp hoặc thư mục đầu ra.
  - `--force`: ghi đè tệp đầu ra hiện có.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Tính SHA-256 của ClawHub, tính toàn vẹn npm `sha512`, và npm shasum cho một
  artifact cục bộ.
- Với `--package`, phân giải metadata dự kiến từ ClawHub và so sánh
  tệp cục bộ với metadata artifact đã xuất bản.
- Với các cờ digest trực tiếp, xác minh mà không cần tra cứu mạng.
- Cờ:
  - `--package <name>`: tên package để phân giải metadata artifact dự kiến.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản package dự kiến.
  - `--sha256 <hex>`: SHA-256 ClawHub dự kiến.
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
- Yêu cầu là chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, người điều hành nền tảng,
  hoặc quản trị viên nền tảng.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Khôi phục một gói đã xóa mềm và các bản phát hành.
- Yêu cầu là chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành tổ chức, người điều hành nền tảng,
  hoặc quản trị viên nền tảng.
- Gọi `POST /api/v1/packages/{name}/undelete`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Chuyển một gói sang nhà phát hành khác.
- Yêu cầu quyền truy cập quản trị vào cả chủ sở hữu gói hiện tại và nhà phát hành
  đích, trừ khi được thực hiện bởi quản trị viên nền tảng.
- Tên gói có phạm vi phải chuyển sang chủ sở hữu phạm vi tương ứng.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: handle nhà phát hành đích.
  - `--reason <text>`: lý do kiểm toán tùy chọn.
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh đã xác thực để báo cáo một gói cho người điều hành.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp gói, có thể gắn với một phiên bản, và sẽ hiển thị
  cho người điều hành để xem xét.
- Báo cáo không tự động ẩn gói hoặc tự chặn tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị kiểm duyệt của gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số báo cáo đang mở, trạng thái kiểm duyệt thủ công
  của bản phát hành mới nhất, trạng thái chặn tải xuống và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra liệu một gói đã sẵn sàng để OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, khả dụng của ClawPack, digest hiện vật,
  nguồn gốc mã nguồn, khả năng tương thích OpenClaw, mục tiêu máy chủ, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển hướng đến người vận hành cho một gói có thể thay thế một
  plugin OpenClaw đi kèm.
- Gọi cùng endpoint readiness được tính toán như `package readiness`, nhưng in
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái gói chính thức, kiểm tra và
  các yếu tố chặn.
- Cờ:
  - `--json`: đầu ra đọc được bằng máy.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Phát hành plugin mã hoặc plugin bundle qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Kho GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các marker bundle OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xem là ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và điền trước
  siêu dữ liệu.
- Thư mục plugin mã được đóng gói thành tarball npm ClawPack trước khi tải lên để
  bản cài đặt OpenClaw có thể xác minh đúng hiện vật. Thư mục plugin bundle vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Với nguồn GitHub, thông tin ghi nhận nguồn được tự động điền từ kho, commit đã phân giải, ref và đường dẫn con.
- Với thư mục cục bộ, thông tin ghi nhận nguồn được tự động phát hiện từ git cục bộ khi remote origin trỏ tới GitHub.
- Plugin mã bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm fallback cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` phát ra đầu ra đọc được bằng máy cho CI.
- `--owner <handle>` phát hành dưới handle nhà phát hành người dùng hoặc tổ chức khi tác nhân có quyền truy cập nhà phát hành.
- `--clawscan-note <text>` thêm ghi chú ClawScan. Ghi chú này cung cấp cho ClawScan
  ngữ cảnh về hành vi có thể trông bất thường, chẳng hạn như truy cập mạng,
  truy cập máy chủ native, hoặc thông tin xác thực riêng của nhà cung cấp. Ghi chú được lưu trên
  bản phát hành đã phát hành.
- Tên gói có phạm vi phải khớp với chủ sở hữu đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như phần ghi đè.
- Kho GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Luồng cục bộ được khuyến nghị

Dùng `--dry-run` trước để bạn có thể xác nhận siêu dữ liệu gói đã phân giải và
thông tin ghi nhận nguồn trước khi tạo một bản phát hành thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Đối với plugin mã, phát hành thư mục sẽ xây dựng và tải lên một hiện vật ClawPack từ
thư mục gói:

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

- `package.json.version` là phiên bản phát hành gói của bạn, nhưng không được dùng làm
  fallback cho xác thực khả năng tương thích/bản dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng bản phát hành CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các kiểm tra preflight cục bộ chạy trước khi tải lên.

#### GitHub Actions

ClawHub cũng cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
cho các kho plugin.

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

- Workflow tái sử dụng mặc định `source` là kho caller.
- Đối với monorepo, truyền `source_path` để workflow phát hành thư mục gói
  plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành bản phát hành từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không gây nhiễu.
- Phát hành thật nên được giới hạn ở các sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Phát hành đáng tin cậy không cần secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` sẵn có cho lần phát hành đầu tiên, gói không đáng tin cậy hoặc phát hành khẩn cấp.
- Workflow tải kết quả JSON lên dưới dạng hiện vật và hiển thị nó dưới dạng đầu ra workflow.

### `sync`

- Quét các thư mục skill cục bộ và phát hành những thư mục mới/đã thay đổi.
- Root có thể là bất kỳ thư mục nào: thư mục skills hoặc một thư mục skill đơn lẻ có `SKILL.md`.
- Tự động thêm root skill Clawdbot khi có `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (tác nhân chính)
  - `routing.agents.*.workspace/skills` (theo từng tác nhân)
  - `~/.clawdbot/skills` (dùng chung)
  - `skills.load.extraDirs` (gói dùng chung)
- Tôn trọng `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` và `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Cờ:
  - `--root <dir...>` root quét bổ sung
  - `--all` tải lên mà không nhắc
  - `--dry-run` chỉ hiển thị kế hoạch
  - `--bump patch|minor|major` (mặc định: patch)
  - `--changelog <text>` (không tương tác)
  - `--tags a,b,c` (mặc định: latest)
  - `--concurrency <n>` (mặc định: 4)

Telemetry:

- Được gửi trong `sync` khi đã đăng nhập, trừ khi `CLAWHUB_DISABLE_TELEMETRY=1` (cũ `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Chi tiết: `docs/telemetry.md`.
