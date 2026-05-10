---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi cài đặt, cập nhật, xuất bản hoặc đồng bộ hóa
summary: 'Tài liệu tham chiếu CLI: lệnh, cờ, cấu hình, tệp khóa, hành vi đồng bộ hóa.'
x-i18n:
    generated_at: "2026-05-10T19:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
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

- `--workdir <dir>`: thư mục làm việc (mặc định: cwd; chuyển sang workspace Clawdbot nếu đã cấu hình)
- `--dir <dir>`: thư mục cài đặt bên dưới workdir (mặc định: `skills`)
- `--site <url>`: URL cơ sở để đăng nhập bằng trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở của API (mặc định: được phát hiện, nếu không thì `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Biến môi trường tương đương:

- `CLAWHUB_SITE` (cũ `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (cũ `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (cũ `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI tôn trọng các biến môi trường HTTP proxy tiêu chuẩn cho các hệ thống nằm sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu đi qua
proxy đã chỉ định. `HTTPS_PROXY` được dùng cho yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần. `NO_PROXY` / `no_proxy` được tôn trọng để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên các hệ thống mà kết nối đi trực tiếp bị chặn
(ví dụ: vùng chứa Docker, Hetzner VPS chỉ có internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Khi không đặt biến proxy nào, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API của bạn + URL registry đã lưu trong bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` có tồn tại, CLI sẽ dùng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt tới `<site>/cli/auth` và hoàn tất qua callback loopback.
- Headless: `clawhub login --token clh_...`
- Tương tác từ xa/headless: `clawhub login --device` in một mã và chờ trong khi bạn ủy quyền mã đó tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Thêm/xóa một skill khỏi các mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Tìm kiếm ưu tiên các kết quả khớp chính xác token slug/tên trước mức độ phổ biến tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Lượt tải xuống là một tín hiệu phổ biến nhỏ trước đó, không bảo đảm vị trí hàng đầu.
- Nếu một skill đáng lẽ xuất hiện nhưng không xuất hiện, hãy chạy `clawhub inspect <slug>` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt chỉ chủ sở hữu thấy được trước khi đổi tên metadata.

### `explore`

- Liệt kê các skill mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (mặc định: newest)
  - `--json` (đầu ra máy đọc được)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (summary được cắt còn 50 ký tự).

### `inspect <slug>`

- Tải metadata của skill và các tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn tag (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-200).
- `--files`: liệt kê các tệp cho phiên bản đã chọn.
- `--file <path>`: tải nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy đọc được.

### `install <slug>`

- Phân giải phiên bản mới nhất qua `/api/v1/skills/<slug>`.
- Tải zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè các skill đã ghim; chạy `clawhub unpin <slug>` trước.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ `.clawdhub`)

### `uninstall <slug>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục trong lockfile.
- Tương tác: yêu cầu xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (cũ `.clawdhub`).
- Hiển thị `pinned` bên cạnh các skill bị đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <slug>`

- Đánh dấu một kỹ năng đã cài đặt là được ghim trong lockfile.
- `--reason <text>` ghi lại lý do kỹ năng bị đóng băng.
- Các kỹ năng đã ghim được bỏ qua bởi `update --all` và bị từ chối bởi `update <slug>` trực tiếp.
- Các kỹ năng đã ghim cũng từ chối `install --force` để các byte cục bộ không thể bị thay thế ngoài ý muốn.

### `unpin <slug>`

- Gỡ ghim lockfile khỏi một kỹ năng đã cài đặt để các bản cập nhật trong tương lai có thể sửa đổi nó.

### `update [slug]` / `update --all`

- Tính fingerprint từ các tệp cục bộ.
- Nếu fingerprint khớp với một phiên bản đã biết: không nhắc.
- Nếu fingerprint không khớp:
  - từ chối theo mặc định
  - ghi đè bằng `--force` (hoặc nhắc, nếu tương tác)
- Các kỹ năng đã ghim không bao giờ được cập nhật bởi `--force`.
- `update <slug>` thất bại nhanh với các slug đã ghim và yêu cầu bạn chạy `clawhub unpin <slug>` trước.
- `update --all` bỏ qua các slug đã ghim và in bản tóm tắt những gì vẫn bị đóng băng.

### `skill publish <path>`

- Xuất bản qua `POST /api/v1/skills` (multipart).
- Yêu cầu semver: `--version 1.2.3`.
- `--owner <handle>` xuất bản dưới handle nhà xuất bản của tổ chức/người dùng khi
  actor có quyền truy cập nhà xuất bản.
- `--migrate-owner` di chuyển một kỹ năng hiện có sang `--owner` trong khi xuất bản một
  phiên bản mới. Yêu cầu quyền truy cập admin/owner trên cả hai nhà xuất bản.
- Hành vi owner và review được giải thích trong `docs/publishing.md`.
- Xuất bản một kỹ năng nghĩa là kỹ năng đó được phát hành theo `MIT-0` trên ClawHub.
- Các kỹ năng đã xuất bản được tự do sử dụng, sửa đổi và phân phối lại mà không cần ghi công.
- ClawHub không hỗ trợ kỹ năng trả phí hoặc định giá theo từng kỹ năng.
- Bí danh cũ: `publish <path>`.

### `delete <slug>`

- Xóa mềm một kỹ năng (owner, moderator hoặc admin).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do owner khởi tạo giữ slug trong 30 ngày; lệnh in thời điểm hết hạn.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `undelete <slug>`

- Khôi phục một kỹ năng đã bị ẩn (owner, moderator hoặc admin).
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên kỹ năng và nhật ký kiểm toán.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua xác nhận.

### `hide <slug>`

- Ẩn một kỹ năng (owner, moderator hoặc admin).
- Bí danh của `delete`.

### `unhide <slug>`

- Bỏ ẩn một kỹ năng (owner, moderator hoặc admin).
- Bí danh của `undelete`.

### `skill rename <slug> <new-slug>`

- Đổi tên một kỹ năng do bạn sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua xác nhận.

### `skill merge <source-slug> <target-slug>`

- Hợp nhất một kỹ năng do bạn sở hữu vào một kỹ năng khác do bạn sở hữu.
- Slug nguồn ngừng được liệt kê công khai và trở thành bí danh chuyển hướng đến đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua xác nhận.

### `skill rescan <slug>`

- Yêu cầu quét lại bảo mật cho phiên bản kỹ năng đã xuất bản mới nhất.
- Owner và admin nhà xuất bản có thể quét lại kỹ năng của chính họ tối đa đến giới hạn
  khôi phục theo từng phiên bản.
- Moderator và admin nền tảng có thể quét lại bất kỳ kỹ năng nào và không bị chặn bởi
  giới hạn khôi phục của owner, dù mỗi phiên bản chỉ có thể chạy một lần quét lại tại một thời điểm.
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

- Lấy metadata gói mà không cài đặt.
- Dùng lệnh này cho metadata plugin, khả năng tương thích, xác minh, nguồn và kiểm tra phiên bản/tệp.
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
- Tải artifact xuống từ `downloadUrl` của resolver.
- Xác minh SHA-256 của ClawHub cho tất cả artifact.
- Với artifact ClawPack npm-pack, cũng xác minh tính toàn vẹn npm `sha512`,
  npm shasum và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP cũ tải xuống qua tuyến ZIP cũ.
- Cờ:
  - `--version <version>`: tải xuống một phiên bản cụ thể.
  - `--tag <tag>`: tải xuống một phiên bản được gắn thẻ (mặc định: `latest`).
  - `-o, --output <path>`: tệp hoặc thư mục đầu ra.
  - `--force`: ghi đè một tệp đầu ra hiện có.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Tính SHA-256 của ClawHub, tính toàn vẹn npm `sha512` và npm shasum cho một
  artifact cục bộ.
- Với `--package`, phân giải metadata mong đợi từ ClawHub và so sánh
  tệp cục bộ với metadata artifact đã xuất bản.
- Với các cờ digest trực tiếp, xác minh mà không tra cứu mạng.
- Cờ:
  - `--package <name>`: tên gói để phân giải metadata artifact mong đợi.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói mong đợi.
  - `--sha256 <hex>`: SHA-256 ClawHub mong đợi.
  - `--npm-integrity <sri>`: tính toàn vẹn npm mong đợi.
  - `--npm-shasum <sha1>`: npm shasum mong đợi.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Xóa mềm một package và tất cả các release.
- Yêu cầu chủ sở hữu package, chủ sở hữu/quản trị viên org publisher, platform moderator,
  hoặc platform admin.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- Yêu cầu quét lại bảo mật cho release package đã phát hành mới nhất.
- Chủ sở hữu và publisher admin có thể quét lại package của chính họ đến giới hạn
  khôi phục theo từng release.
- Platform moderator và admin có thể quét lại bất kỳ package nào và không bị chặn bởi
  giới hạn khôi phục của chủ sở hữu, mặc dù mỗi release chỉ có thể chạy một lần quét lại tại một thời điểm.
- Gọi `POST /api/v1/packages/{name}/rescan`.
- Cờ:
  - `--yes`: bỏ qua xác nhận.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Lệnh đã xác thực để báo cáo package cho moderator.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo ở cấp package, có thể gắn với một phiên bản, và sẽ hiển thị
  cho moderator xem xét.
- Bản thân báo cáo không tự động ẩn package hoặc chặn lượt tải xuống.
- Cờ:
  - `--version <version>`: phiên bản package tùy chọn để gắn vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Lệnh dành cho chủ sở hữu/publisher để khiếu nại kiểm duyệt release.
- Gọi `POST /api/v1/packages/{name}/appeal`.
- Khiếu nại được chấp nhận cho các release bị cách ly, bị thu hồi, đáng ngờ hoặc độc hại.
- Cờ:
  - `--version <version>`: phiên bản package bắt buộc.
  - `--message <text>`: thông điệp khiếu nại bắt buộc.
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị kiểm duyệt của package.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét package hiện tại, số lượng báo cáo đang mở, trạng thái kiểm duyệt thủ công
  của release mới nhất, trạng thái chặn tải xuống, và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một package đã sẵn sàng cho việc OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố chặn đối với trạng thái chính thức, tính khả dụng của ClawPack, mã băm artifact,
  nguồn gốc source, khả năng tương thích OpenClaw, host target, siêu dữ liệu môi trường,
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển theo hướng vận hành cho một package có thể thay thế
  một OpenClaw Plugin được đóng gói sẵn.
- Gọi cùng endpoint readiness được tính toán như `package readiness`, nhưng in ra
  trạng thái tập trung vào di chuyển, phiên bản mới nhất, trạng thái package chính thức, các kiểm tra, và
  yếu tố chặn.
- Cờ:
  - `--json`: đầu ra máy đọc được.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Phát hành code Plugin hoặc bundle Plugin qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tarball npm-pack ClawPack cục bộ: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json`, và
  các marker bundle OpenClaw thực như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được xử lý như ClawPack. CLI tải lên đúng các byte npm-pack
  và chỉ dùng nội dung `package/` đã trích xuất để xác thực và điền sẵn
  siêu dữ liệu.
- Thư mục code Plugin được đóng gói thành tarball npm ClawPack trước khi tải lên để
  các bản cài đặt OpenClaw có thể xác minh đúng artifact. Thư mục bundle Plugin vẫn
  dùng đường dẫn phát hành tệp đã trích xuất.
- Với nguồn GitHub, attribution nguồn được tự động điền từ repo, commit đã phân giải, ref, và đường dẫn con.
- Với thư mục cục bộ, attribution nguồn được tự động phát hiện từ git cục bộ khi origin remote trỏ đến GitHub.
- Code Plugin bên ngoài phải khai báo rõ `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm fallback cho xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` phát ra đầu ra máy đọc được cho CI.
- `--owner <handle>` phát hành dưới handle publisher của người dùng hoặc org khi tác nhân có quyền truy cập publisher.
- Tên package có scope phải khớp với chủ sở hữu đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động như override.
- Repo GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

#### Luồng cục bộ được khuyến nghị

Dùng `--dry-run` trước để bạn có thể xác nhận siêu dữ liệu package đã phân giải và
attribution nguồn trước khi tạo release thật:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Đối với code Plugin, phát hành thư mục sẽ xây dựng và tải lên artifact ClawPack từ
thư mục package:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Code Plugin bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
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

- `package.json.version` là phiên bản release package của bạn, nhưng nó không được dùng làm
  fallback cho xác thực tương thích/build của OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu bạn đang dùng một release CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các kiểm tra preflight cục bộ chạy trước khi tải lên.

#### GitHub Actions

ClawHub cũng cung cấp một workflow tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
cho các repo Plugin.

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

- Workflow tái sử dụng mặc định đặt `source` thành repo caller.
- Với monorepo, truyền `source_path` để workflow phát hành thư mục package
  Plugin, ví dụ `source_path: extensions/codex`.
- Ghim workflow tái sử dụng vào một tag ổn định hoặc SHA commit đầy đủ. Không chạy phát hành release từ `@main`.
- `pull_request` nên dùng `dry_run: true` để CI không gây tác động ngoài ý muốn.
- Các lần phát hành thật nên được giới hạn ở sự kiện đáng tin cậy như `workflow_dispatch` hoặc push tag.
- Trusted publishing không dùng secret chỉ hoạt động trên `workflow_dispatch`; push tag vẫn cần `clawhub_token`.
- Giữ `clawhub_token` sẵn có cho lần phát hành đầu tiên, package không đáng tin cậy, hoặc các lần phát hành break-glass.
- Workflow tải kết quả JSON lên dưới dạng artifact và hiển thị nó dưới dạng đầu ra workflow.

### `sync`

- Quét các thư mục skill cục bộ và phát hành những thư mục mới/đã thay đổi.
- Root có thể là bất kỳ thư mục nào: một thư mục skills hoặc một thư mục skill đơn có `SKILL.md`.
- Tự động thêm root skill Clawdbot khi có `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent chính)
  - `routing.agents.*.workspace/skills` (theo từng agent)
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
