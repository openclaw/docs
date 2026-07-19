---
read_when:
    - Sử dụng CLI ClawHub
    - Gỡ lỗi quá trình cài đặt, cập nhật hoặc phát hành
summary: 'Tham chiếu CLI: lệnh, cờ, cấu hình và hành vi của tệp khóa.'
x-i18n:
    generated_at: "2026-07-19T05:37:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa830e77a2fe0639b113b5f3171da138189c3bdf0271f7b729ad0a84404bce72
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Gói CLI: `clawhub`, tệp thực thi: `clawhub`.

Cài đặt toàn cục bằng npm hoặc pnpm:

```bash
npm i -g clawhub
# hoặc
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
- `--dir <dir>`: thư mục cài đặt trong thư mục làm việc (mặc định: `skills`)
- `--site <url>`: URL cơ sở để đăng nhập qua trình duyệt (mặc định: `https://clawhub.ai`)
- `--registry <url>`: URL cơ sở của API (mặc định: được tự động phát hiện, nếu không thì dùng `https://clawhub.ai`)
- `--no-input`: tắt lời nhắc

Các biến môi trường tương đương:

- `CLAWHUB_SITE` (cũ: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (cũ: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (cũ: `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI tuân theo các biến môi trường proxy HTTP tiêu chuẩn cho những hệ thống nằm sau
proxy doanh nghiệp hoặc mạng bị hạn chế:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Khi bất kỳ biến nào trong số này được đặt, CLI định tuyến các yêu cầu gửi đi qua
proxy được chỉ định. `HTTPS_PROXY` được dùng cho các yêu cầu HTTPS, `HTTP_PROXY`
cho HTTP thuần túy. `NO_PROXY` / `no_proxy` được tuân theo để bỏ qua proxy cho
các máy chủ hoặc miền cụ thể.

Điều này là bắt buộc trên những hệ thống chặn kết nối trực tiếp ra ngoài
(ví dụ: container Docker, VPS Hetzner chỉ có Internet qua proxy, tường lửa
doanh nghiệp).

Ví dụ:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "truy vấn của tôi"
```

Khi không đặt biến proxy nào, hành vi không thay đổi (kết nối trực tiếp).

## Tệp cấu hình

Lưu token API và URL registry đã lưu vào bộ nhớ đệm.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` hoặc `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Phương án dự phòng cũ: nếu `clawhub/config.json` chưa tồn tại nhưng `clawdhub/config.json` tồn tại, CLI sẽ sử dụng lại đường dẫn cũ
- ghi đè: `CLAWHUB_CONFIG_PATH` (cũ: `CLAWDHUB_CONFIG_PATH`)

## Lệnh

### `login` / `auth login`

- Mặc định: mở trình duyệt đến `<site>/cli/auth` và hoàn tất qua lệnh gọi lại loopback.
- Không giao diện: `clawhub login --token clh_...`
- Tương tác từ xa/không giao diện: `clawhub login --device` in một mã và chờ trong khi bạn cấp quyền tại `<site>/cli/device`.

### `whoami`

- Xác minh token đã lưu qua `/api/v1/whoami`.

### `token`

- In token API đã lưu ra stdout.
- Hữu ích để chuyển token đăng nhập cục bộ qua pipe vào các lệnh thiết lập bí mật CI.

### `star <skill>` / `unstar <skill>`

- Thêm/xóa một skill khỏi mục nổi bật của bạn.
- Gọi `POST /api/v1/stars/<slug>` và `DELETE /api/v1/stars/<slug>`.
- `--yes` bỏ qua bước xác nhận.

### `search <query...>`

- Gọi `/api/v1/search?q=...`.
- Đầu ra bao gồm slug của skill, tên định danh chủ sở hữu, tên hiển thị và điểm mức độ liên quan.
- Tìm kiếm ưu tiên các kết quả khớp chính xác token slug/tên trước mức độ phổ biến theo lượt tải xuống. Một token slug độc lập như `map` khớp với `personal-map` mạnh hơn chuỗi con bên trong `amap`.
- Mức độ phổ biến chỉ là một yếu tố xếp hạng ban đầu nhỏ, không đảm bảo vị trí hàng đầu.
- Nếu một skill đáng lẽ phải xuất hiện nhưng không có, hãy chạy `clawhub inspect @owner/slug` khi đã đăng nhập để kiểm tra chẩn đoán kiểm duyệt mà chủ sở hữu có thể xem trước khi đổi tên siêu dữ liệu.

### `explore`

- Liệt kê các skill mới nhất qua `/api/v1/skills?limit=...&sort=createdAt` (sắp xếp theo `createdAt` giảm dần).
- Cờ:
  - `--limit <n>` (1-200, mặc định: 25)
  - `--sort newest|updated|rating|downloads|trending` (mặc định: mới nhất). Các bí danh sắp xếp cài đặt cũ vẫn hoạt động để đảm bảo khả năng tương thích.
  - `--json` (đầu ra có thể đọc bằng máy)
- Đầu ra: `<slug>  v<version>  <age>  <summary>` (phần tóm tắt được rút gọn còn 50 ký tự).

### `inspect @owner/slug`

- Tìm nạp siêu dữ liệu skill và các tệp phiên bản mà không cài đặt.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-200).
- `--files`: liệt kê các tệp của phiên bản đã chọn.
- `--file <path>`: tìm nạp nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra có thể đọc bằng máy.

### `install @owner/slug`

- Xác định phiên bản mới nhất cho chủ sở hữu và skill được chỉ định.
- Tải xuống tệp zip qua `/api/v1/download`.
- Giải nén vào `<workdir>/<dir>/<slug>`.
- Từ chối ghi đè các skill đã ghim; trước tiên hãy chạy `clawhub unpin <skill>`.
- Ghi:
  - `<workdir>/.clawhub/lock.json` (cũ: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (cũ: `.clawdhub`)

### `uninstall <skill>`

- Xóa `<workdir>/<dir>/<slug>` và xóa mục nhập trong tệp khóa.
- Gửi dữ liệu đo từ xa theo cơ chế nỗ lực tối đa khi đã đăng nhập để số lượt cài đặt hiện tại có thể
  được hủy kích hoạt.
- Tương tác: yêu cầu xác nhận.
- Không tương tác (`--no-input`): yêu cầu `--yes`.

### `list`

- Đọc `<workdir>/.clawhub/lock.json` (cũ: `.clawdhub`).
- Hiển thị `pinned` bên cạnh các skill được đóng băng bằng `clawhub pin`, bao gồm lý do tùy chọn.

### `pin <skill>`

- Đánh dấu một skill đã cài đặt là được ghim trong tệp khóa.
- `--reason <text>` ghi lại lý do skill bị đóng băng.
- Các skill đã ghim bị `update --all` bỏ qua và bị `update <skill>` trực tiếp từ chối.
- Các skill đã ghim cũng từ chối `install --force` để dữ liệu byte cục bộ không bị thay thế ngoài ý muốn.

### `unpin <skill>`

- Xóa trạng thái ghim trong tệp khóa khỏi một skill đã cài đặt để các bản cập nhật sau này có thể sửa đổi skill đó.

### `update [@owner/slug]` / `update --all`

- Tính dấu vân tay từ các tệp cục bộ.
- Nếu dấu vân tay khớp với một phiên bản đã biết: không hiển thị lời nhắc.
- Nếu dấu vân tay không khớp:
  - mặc định từ chối
  - ghi đè bằng `--force` (hoặc hiển thị lời nhắc nếu ở chế độ tương tác)
- Các skill đã ghim không bao giờ được `--force` cập nhật.
- `update <skill>` thất bại ngay lập tức đối với các skill đã ghim và yêu cầu bạn chạy `clawhub unpin <skill>` trước.
- `update --all` bỏ qua các slug đã ghim và in bản tóm tắt về những skill vẫn được đóng băng.

### `skill publish <path>`

- So sánh dấu vân tay gói cục bộ với ClawHub và thoát thành công khi
  nội dung đã được phát hành.
- Các skill mới mặc định dùng `1.0.0`; các skill đã thay đổi mặc định dùng phiên bản
  vá tiếp theo.
- `--version <version>` chọn phiên bản một cách rõ ràng và phát hành ngay cả khi
  nội dung khớp với phiên bản hiện có.
- `--dry-run` xác định kết quả phát hành mà không tải lên; `--json` in
  kết quả có thể đọc bằng máy.
- `--owner <handle>` phát hành dưới tên định danh nhà phát hành của tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà phát hành.
- `--migrate-owner` di chuyển một skill hiện có sang `--owner` trong khi phát hành phiên bản
  mới. Yêu cầu quyền truy cập quản trị viên/chủ sở hữu trên cả hai nhà phát hành.
- Hành vi của chủ sở hữu và quy trình review được giải thích trong `docs/publishing.md`.
- Phát hành một skill có nghĩa là skill đó được phát hành theo `MIT-0` trên ClawHub.
- Các skill đã phát hành được phép sử dụng, sửa đổi và phân phối lại miễn phí mà không cần ghi công.
- ClawHub không hỗ trợ skill trả phí hoặc định giá theo từng skill.
- Bí danh cũ: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Quy trình làm việc
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
có thể tái sử dụng của ClawHub gọi `skill publish` cho một `skill_path`, hoặc cho từng thư mục skill
trực tiếp bên trong `root` (mặc định: `skills`). Quy trình bỏ qua các skill không thay đổi và sử dụng
cùng hành vi tự động tăng phiên bản vá.

Đặt `dry_run: true` để xem trước mà không cần token. Việc phát hành thực tế yêu cầu
bí mật `clawhub_token`.

### `sync`

- Quét thư mục làm việc hiện tại, thư mục skills đã cấu hình và mọi
  thư mục `--root <dir>` để tìm các thư mục skill cục bộ chứa `SKILL.md` hoặc
  `skill.md`.
- So sánh dấu vân tay của từng skill cục bộ với ClawHub và chỉ phát hành các skill mới hoặc
  đã thay đổi.
- Các skill mới được phát hành dưới dạng `1.0.0`; theo mặc định, các skill đã thay đổi được phát hành với phiên bản vá tiếp theo. Dùng `--bump minor|major` cho các lô cập nhật cần tăng theo
  một bước semver lớn hơn.
- `--dry-run` hiển thị kế hoạch phát hành mà không tải lên; `--json` in
  kế hoạch có thể đọc bằng máy.
- `--all` phát hành mọi skill mới hoặc đã thay đổi mà không cần nhắc. Khi không có
  `--all`, terminal tương tác cho phép bạn chọn các skill cần phát hành.
- `--owner <handle>` phát hành dưới tên định danh nhà phát hành của tổ chức/người dùng khi
  tác nhân có quyền truy cập nhà phát hành.
- `sync` chỉ phát hành một chiều. Nó không cài đặt, cập nhật, tải xuống hoặc
  báo cáo dữ liệu đo từ xa về lượt cài đặt/tải xuống.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Yêu cầu `clawhub login`.
- Chạy ClawHub ClawScan qua `POST /api/v1/skills/-/scan`, sau đó thăm dò cho đến khi quá trình quét đạt trạng thái kết thúc.
- Quá trình quét diễn ra bất đồng bộ và có thể mất thời gian để hoàn tất. Trong khi chờ trong hàng đợi, vòng xoay terminal hiển thị vị trí quét ưu tiên hiện tại và số lượt quét đang ở phía trước.
- Quá trình quét đã phát hành yêu cầu quyền sở hữu hoặc quyền quản lý nhà phát hành. Người kiểm duyệt/quản trị viên có thể dùng cùng backend qua `clawhub-admin`.
- `--update` chỉ hợp lệ với `--slug`; tùy chọn này ghi kết quả quét đã phát hành thành công trở lại phiên bản được chọn.
- `--output <file.zip>` tải xuống toàn bộ kho lưu trữ báo cáo gồm `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.
- `--json` in toàn bộ phản hồi thăm dò để phục vụ tự động hóa.
- Quét đường dẫn cục bộ không còn được hỗ trợ. Hãy tải lên một phiên bản mới, sau đó dùng `scan download` để truy xuất kết quả quét đã lưu cho phiên bản đã gửi đó.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Yêu cầu `clawhub login`.
- Tải xuống tệp ZIP báo cáo quét đã lưu cho phiên bản skill hoặc plugin đã gửi, bao gồm cả các phiên bản bị chặn hoặc ẩn bởi các bước kiểm tra bảo mật của ClawHub.
- Việc tải xuống skill sử dụng slug của skill và mặc định là `--kind skill`.
- Việc tải xuống plugin sử dụng tên gói và yêu cầu `--kind plugin`.
- `--version` là bắt buộc để tác giả kiểm tra chính xác phiên bản đã gửi mà ClawHub đã chặn.
- `--output <file.zip>` chọn đường dẫn đích.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub cung cấp một quy trình làm việc chính thức có thể tái sử dụng tại
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/skill-publish.yml)
cho các kho lưu trữ skill và kho lưu trữ danh mục.

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

Lưu ý:

- `root` mặc định là `skills` đối với các kho lưu trữ danh mục.
- Truyền `skill_path: skills/review-helper` để xử lý một thư mục skill.
- `owner` ánh xạ tới cờ CLI `--owner`; bỏ qua cờ này để xuất bản với tư cách người dùng đã xác thực.
- Việc xuất bản skill V1 sử dụng `clawhub_token`; tính năng xuất bản đáng tin cậy bằng GitHub OIDC hiện chỉ dành cho gói.

### `delete <skill>`

- Khi không có `--version`, xóa mềm một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Gọi `DELETE /api/v1/skills/{slug}`.
- Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày; lệnh sẽ in thời điểm hết hạn.
- `--version <version>` xóa vĩnh viễn một phiên bản cụ thể không phải mới nhất thuộc sở hữu thông qua một tuyến đóng khi có lỗi,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc xuất bản lại các phiên bản đã xóa. Hãy xuất bản phiên bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Nhân viên nền tảng không được bỏ qua quyền sở hữu trong luồng chỉ dành cho phiên bản này.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trong thao tác xóa mềm toàn bộ skill và nhật ký kiểm tra.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua bước xác nhận.

### `undelete <skill>`

- Khôi phục một skill bị ẩn (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Không có chức năng hoàn tác xóa phiên bản; không thể khôi phục các phiên bản đã bị xóa vĩnh viễn.
- Gọi `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` ghi lại ghi chú kiểm duyệt trên skill và trong nhật ký kiểm tra.
- `--note <text>` là bí danh của `--reason`.
- `--yes` bỏ qua bước xác nhận.

### `hide <skill>`

- Ẩn một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Bí danh của `delete`.

### `unhide <skill>`

- Bỏ ẩn một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).
- Bí danh của `undelete`.

### `skill rename <skill> <new-name>`

- Đổi tên một skill thuộc sở hữu và giữ slug trước đó làm bí danh chuyển hướng.
- Gọi `POST /api/v1/skills/{slug}/rename`.
- `--yes` bỏ qua bước xác nhận.

### `skill merge <source> <target>`

- Hợp nhất một skill thuộc sở hữu vào một skill khác cũng thuộc sở hữu.
- Slug nguồn không còn được liệt kê công khai và trở thành bí danh chuyển hướng tới đích.
- Gọi `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` bỏ qua bước xác nhận.

### `transfer`

- Quy trình chuyển quyền sở hữu.
- Việc chuyển cho định danh người dùng tạo một yêu cầu đang chờ để người nhận chấp nhận.
- Việc chuyển cho định danh tổ chức/nhà xuất bản chỉ được áp dụng ngay lập tức khi người thực hiện có
  quyền quản trị đối với cả chủ sở hữu hiện tại và nhà xuất bản đích.
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

- Duyệt hoặc tìm kiếm danh mục gói hợp nhất thông qua `GET /api/v1/packages` và `GET /api/v1/packages/search`.
- Sử dụng chức năng này cho plugin và các mục thuộc họ gói khác; `search` cấp cao nhất vẫn là bề mặt tìm kiếm skill.
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

- Truy xuất siêu dữ liệu gói mà không cài đặt.
- Sử dụng chức năng này để kiểm tra siêu dữ liệu, khả năng tương thích, xác minh, nguồn, phiên bản và tệp của plugin.
- `--version <version>`: kiểm tra một phiên bản cụ thể (mặc định: mới nhất).
- `--tag <tag>`: kiểm tra một phiên bản được gắn thẻ (ví dụ: `latest`).
- `--versions`: liệt kê lịch sử phiên bản (trang đầu tiên).
- `--limit <n>`: số phiên bản tối đa cần liệt kê (1-100).
- `--files`: liệt kê các tệp của phiên bản đã chọn.
- `--file <path>`: truy xuất nội dung tệp thô (chỉ tệp văn bản; giới hạn 200KB).
- `--json`: đầu ra máy có thể đọc được.

### `package download <name>`

- Phân giải một phiên bản gói thông qua
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Tải xuống hiện vật từ `downloadUrl` của trình phân giải.
- Xác minh SHA-256 của ClawHub cho tất cả hiện vật.
- Đối với hiện vật npm-pack của ClawPack, cũng xác minh tính toàn vẹn npm `sha512`,
  shasum npm và tên/phiên bản `package.json` của tarball.
- Các phiên bản ZIP cũ được tải xuống thông qua tuyến ZIP cũ.
- Cờ:
  - `--version <version>`: tải xuống một phiên bản cụ thể.
  - `--tag <tag>`: tải xuống một phiên bản được gắn thẻ (mặc định: `latest`).
  - `-o, --output <path>`: tệp hoặc thư mục đầu ra.
  - `--force`: ghi đè một tệp đầu ra hiện có.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Tính toán SHA-256 của ClawHub, tính toàn vẹn npm `sha512` và shasum npm cho một
  hiện vật cục bộ.
- Khi có `--package`, phân giải siêu dữ liệu dự kiến từ ClawHub và so sánh
  tệp cục bộ với siêu dữ liệu hiện vật đã xuất bản.
- Với các cờ mã băm trực tiếp, thực hiện xác minh mà không cần tra cứu qua mạng.
- Cờ:
  - `--package <name>`: tên gói dùng để phân giải siêu dữ liệu hiện vật dự kiến.
  - `--version <version>` hoặc `--tag <tag>`: phiên bản gói dự kiến.
  - `--sha256 <hex>`: SHA-256 ClawHub dự kiến.
  - `--npm-integrity <sri>`: giá trị toàn vẹn npm dự kiến.
  - `--npm-shasum <sha1>`: shasum npm dự kiến.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Chạy Plugin Inspector đi kèm với CLI ClawHub đối với một thư mục gói plugin
  cục bộ.
- Mặc định thực hiện xác thực ngoại tuyến/tĩnh mà không định vị hoặc nhập một bản sao làm việc OpenClaw
  cục bộ.
- Các lỗi tương thích nghiêm trọng trả về mã thoát khác 0. Các phát hiện chỉ có cảnh báo được in ra nhưng
  trả về mã thoát 0.
- Cờ:
  - `--out <dir>`: ghi báo cáo Plugin Inspector vào thư mục này.
  - `--openclaw <path>`: kiểm tra với một bản sao làm việc OpenClaw cục bộ được chỉ định rõ ràng.
  - `--runtime`: bật thu thập thời gian chạy; nhập mã plugin.
  - `--allow-execute`: cho phép thu thập thời gian chạy trong một không gian làm việc biệt lập.
  - `--no-mock-sdk`: vô hiệu hóa SDK OpenClaw mô phỏng trong quá trình thu thập thời gian chạy.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package validate ./example-plugin
```

Nếu quá trình xác thực báo cáo phát hiện về gói, manifest, lệnh nhập SDK hoặc hiện vật, hãy xem
[Cách khắc phục lỗi xác thực plugin](/clawhub/plugin-validation-fixes), sau đó chạy lại lệnh.

### `package delete <name>`

- Khi không có `--version`, xóa mềm một gói và tất cả bản phát hành.
- `--version <version>` xóa vĩnh viễn một bản phát hành cụ thể không phải mới nhất thuộc sở hữu thông qua một tuyến đóng khi có lỗi,
  dành riêng cho phiên bản.
  Không thể khôi phục hoặc xuất bản lại các phiên bản đã xóa. Hãy xuất bản phiên bản thay thế trước khi xóa
  phiên bản mới nhất hiện tại. Luồng chỉ dành cho phiên bản này yêu cầu chủ sở hữu gói hoặc quản trị viên
  nhà xuất bản của tổ chức; nhân viên nền tảng không được bỏ qua quyền sở hữu gói.
- Việc xóa mềm toàn bộ gói yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản của tổ chức, người
  kiểm duyệt nền tảng hoặc quản trị viên nền tảng.
- Cờ:
  - `--version <version>`: xóa vĩnh viễn một phiên bản không phải mới nhất.
  - `--yes`: bỏ qua bước xác nhận.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Khôi phục một gói đã xóa mềm và các bản phát hành.
- Không có chức năng hoàn tác xóa phiên bản; không thể khôi phục các phiên bản đã bị xóa vĩnh viễn.
- Yêu cầu chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản của tổ chức, người kiểm duyệt nền tảng
  hoặc quản trị viên nền tảng.
- Gọi `POST /api/v1/packages/{name}/undelete`.
- Cờ:
  - `--yes`: bỏ qua bước xác nhận.
  - `--json`: đầu ra máy có thể đọc được.

Ví dụ:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Chuyển một gói cho nhà phát hành khác.
- Yêu cầu quyền quản trị đối với cả chủ sở hữu gói hiện tại và nhà
  phát hành đích, trừ khi do quản trị viên nền tảng thực hiện.
- Tên gói có phạm vi phải được chuyển cho chủ sở hữu phạm vi tương ứng.
- Gọi `POST /api/v1/packages/{name}/transfer`.
- Cờ:
  - `--to <owner>`: định danh của nhà phát hành đích.
  - `--reason <text>`: lý do kiểm tra tùy chọn.
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Lệnh yêu cầu xác thực để báo cáo một gói cho người kiểm duyệt.
- Gọi `POST /api/v1/packages/{name}/report`.
- Báo cáo áp dụng ở cấp gói, có thể được liên kết với một phiên bản và sẽ hiển thị
  cho người kiểm duyệt để review.
- Bản thân báo cáo không tự động ẩn gói hoặc chặn lượt tải xuống.
- Cờ:
  - `--version <version>`: phiên bản gói tùy chọn để đính kèm vào báo cáo.
  - `--reason <text>`: lý do báo cáo bắt buộc.
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Lệnh dành cho chủ sở hữu để kiểm tra khả năng hiển thị trong quá trình kiểm duyệt gói.
- Gọi `GET /api/v1/packages/{name}/moderation`.
- Hiển thị trạng thái quét gói hiện tại, số báo cáo đang mở, trạng thái kiểm duyệt
  thủ công của bản phát hành mới nhất, trạng thái chặn tải xuống và lý do kiểm duyệt.
- Cờ:
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Kiểm tra xem một gói đã sẵn sàng để OpenClaw sử dụng trong tương lai hay chưa.
- Gọi `GET /api/v1/packages/{name}/readiness`.
- Báo cáo các yếu tố cản trở trạng thái chính thức, tính khả dụng của ClawPack, giá trị băm của hiện vật,
  nguồn gốc mã nguồn, khả năng tương thích với OpenClaw, máy chủ đích, siêu dữ liệu môi trường
  và trạng thái quét.
- Cờ:
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Hiển thị trạng thái di chuyển dành cho người vận hành đối với một gói có thể thay thế
  Plugin OpenClaw được đóng gói sẵn.
- Gọi cùng điểm cuối tính toán mức độ sẵn sàng như `package readiness`, nhưng in
  trạng thái tập trung vào việc di chuyển, phiên bản mới nhất, trạng thái gói chính thức, các bước kiểm tra
  và yếu tố cản trở.
- Cờ:
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Tạo một nhà phát hành tổ chức thuộc sở hữu của người dùng đã xác thực.
- Định danh được chuẩn hóa thành chữ thường và có thể được truyền có hoặc không có `@`.
- Nhà phát hành tổ chức mới tạo mặc định không được tin cậy/chính thức.
- Thất bại nếu định danh đã được một nhà phát hành, người dùng hoặc tuyến dành riêng hiện có sử dụng.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Phát hành Plugin mã hoặc Plugin gói thông qua `POST /api/v1/packages`.
- `<source>` chấp nhận:
  - Đường dẫn thư mục cục bộ: `./my-plugin`
  - Tệp tarball ClawPack npm-pack cục bộ: `./my-plugin-1.2.3.tgz`
  - Kho lưu trữ GitHub: `owner/repo` hoặc `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Siêu dữ liệu được tự động phát hiện từ `package.json`, `openclaw.plugin.json` và
  các dấu hiệu gói OpenClaw thực tế như `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` và `.cursor-plugin/plugin.json`.
- Nguồn `.tgz` được coi là ClawPack. CLI tải lên chính xác các byte npm-pack
  và chỉ sử dụng nội dung `package/` đã giải nén để xác thực và
  điền trước siêu dữ liệu.
- Thư mục Plugin mã được đóng gói thành tệp tarball npm ClawPack trước khi tải lên để
  các bản cài đặt OpenClaw có thể xác minh chính xác hiện vật. Thư mục Plugin gói vẫn
  sử dụng đường dẫn phát hành tệp đã giải nén.
- Đối với nguồn GitHub, thông tin nguồn được tự động điền từ kho lưu trữ, commit đã phân giải, ref và đường dẫn con.
- Đối với thư mục cục bộ, thông tin nguồn được tự động phát hiện từ git cục bộ khi remote gốc trỏ đến GitHub.
- Plugin mã bên ngoài phải khai báo rõ ràng `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
  `package.json.version` cấp cao nhất không được dùng làm giá trị dự phòng để xác thực phát hành.
- `--dry-run` xem trước payload phát hành đã phân giải mà không tải lên.
- `--json` xuất đầu ra có thể đọc bằng máy cho CI.
- `--owner <handle>` phát hành dưới định danh nhà phát hành người dùng hoặc tổ chức khi tác nhân có quyền truy cập nhà phát hành.
- Tên gói có phạm vi phải khớp với chủ sở hữu đã chọn. Xem `docs/publishing.md`.
- Các cờ hiện có (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) vẫn hoạt động dưới dạng giá trị ghi đè.
- Kho lưu trữ GitHub riêng tư yêu cầu `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Luồng cục bộ được khuyến nghị

Trước tiên, hãy sử dụng `--dry-run` để có thể xác nhận siêu dữ liệu gói đã phân giải và
thông tin nguồn trước khi tạo bản phát hành trực tiếp:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Luồng thư mục cục bộ

Đối với Plugin mã, việc phát hành thư mục sẽ xây dựng và tải lên một hiện vật ClawPack từ
thư mục gói:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` tối thiểu cho `--family code-plugin`

Plugin mã bên ngoài cần một lượng nhỏ siêu dữ liệu OpenClaw trong
`package.json`. Tệp kê khai tối thiểu này đủ để phát hành thành công:

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

Lưu ý:

- `package.json.version` là phiên bản phát hành gói của bạn, nhưng không được dùng làm
  giá trị dự phòng để xác thực khả năng tương thích/bản dựng OpenClaw.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
  ClawHub có thể hiển thị chúng khi có, nhưng chúng không bắt buộc để phát hành.
- `openclaw.compat.minGatewayVersion` và
  `openclaw.build.pluginSdkVersion` là các phần bổ sung tùy chọn nếu bạn muốn phát hành
  siêu dữ liệu tương thích chi tiết hơn.
- Nếu đang sử dụng phiên bản CLI `clawhub` cũ hơn, hãy nâng cấp trước khi phát hành để
  các bước kiểm tra sơ bộ cục bộ chạy trước khi tải lên.
- Nếu quá trình xác thực báo cáo mã khắc phục, hãy xem
  [Cách khắc phục lỗi xác thực Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub cũng cung cấp một quy trình làm việc có thể tái sử dụng chính thức tại
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/package-publish.yml)
cho các kho lưu trữ Plugin.

Thiết lập trình gọi điển hình:

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

Lưu ý:

- Quy trình làm việc có thể tái sử dụng mặc định đặt `source` thành kho lưu trữ của trình gọi.
- Đối với monorepo, hãy truyền `source_path` để quy trình làm việc phát hành thư mục
  gói Plugin, ví dụ `source_path: extensions/codex`.
- Ghim quy trình làm việc có thể tái sử dụng vào một thẻ ổn định hoặc SHA commit đầy đủ. Không chạy việc phát hành bản phát hành từ `@main`.
- `pull_request` nên sử dụng `dry_run: true` để CI không gây thay đổi ngoài ý muốn.
- Việc phát hành thực tế nên được giới hạn ở các sự kiện đáng tin cậy như `workflow_dispatch` hoặc thao tác đẩy thẻ.
- Phát hành đáng tin cậy không cần bí mật chỉ hoạt động trên `workflow_dispatch`; thao tác đẩy thẻ vẫn cần `clawhub_token`.
- Duy trì `clawhub_token` cho lần phát hành đầu tiên, gói không đáng tin cậy hoặc phát hành khẩn cấp.
- Quy trình làm việc tải kết quả JSON lên dưới dạng hiện vật và cung cấp kết quả đó dưới dạng đầu ra quy trình làm việc.

### `package trusted-publisher get <name>`

- Hiển thị cấu hình nhà phát hành đáng tin cậy của GitHub Actions cho một gói.
- Sử dụng lệnh này sau khi đặt cấu hình để xác nhận kho lưu trữ, tên tệp quy trình làm việc
  và môi trường ghim tùy chọn.
- Cờ:
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Đính kèm hoặc thay thế cấu hình nhà phát hành đáng tin cậy của GitHub Actions cho một
  gói hiện có.
- Trước tiên, gói phải được tạo thông qua `clawhub package publish` thủ công thông thường hoặc
  được xác thực bằng token.
- Sau khi đặt cấu hình, các lần phát hành GitHub Actions được hỗ trợ trong tương lai có thể sử dụng
  OIDC/phát hành đáng tin cậy mà không cần token ClawHub dài hạn.
- `--repository <repo>` phải là `owner/repo`.
- `--workflow-filename <file>` phải khớp với tên tệp quy trình làm việc trong
  `.github/workflows/`.
- `--environment <name>` là tùy chọn. Khi được cấu hình, môi trường GitHub Actions
  trong khai báo OIDC phải khớp chính xác.
- ClawHub xác minh kho lưu trữ GitHub đã cấu hình khi lệnh này chạy.
  Có thể xác minh kho lưu trữ công khai thông qua siêu dữ liệu GitHub công khai. Kho lưu trữ
  riêng tư yêu cầu ClawHub có quyền truy cập GitHub vào kho lưu trữ đó, ví dụ
  thông qua bản cài đặt GitHub App của ClawHub trong tương lai hoặc một tích hợp GitHub
  được cấp phép khác.
- Cờ:
  - `--repository <repo>`: kho lưu trữ GitHub, ví dụ `openclaw/example-plugin`.
  - `--workflow-filename <file>`: tên tệp quy trình làm việc, ví dụ `package-publish.yml`.
  - `--environment <name>`: môi trường GitHub Actions khớp chính xác tùy chọn.
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Xóa cấu hình nhà phát hành đáng tin cậy khỏi một gói.
- Sử dụng lệnh này để khôi phục nếu cần vô hiệu hóa hoặc tạo lại quy trình làm việc, kho lưu trữ
  hoặc môi trường ghim.
- Các lần phát hành thực tế trong tương lai phải sử dụng phương thức phát hành có xác thực thông thường cho đến khi
  cấu hình được đặt lại.
- Cờ:
  - `--json`: đầu ra có thể đọc bằng máy.

Ví dụ:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Dữ liệu đo từ xa về cài đặt

- Được gửi sau `clawhub install <slug>` khi đã đăng nhập, trừ khi
  `CLAWHUB_DISABLE_TELEMETRY=1` được đặt.
- Việc báo cáo được thực hiện theo khả năng tốt nhất. Các lệnh cài đặt không thất bại nếu dữ liệu đo từ xa
  không khả dụng.
- Chi tiết: `docs/telemetry.md`.
