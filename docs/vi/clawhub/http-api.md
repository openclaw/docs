---
read_when:
    - Thêm/thay đổi điểm cuối
    - Gỡ lỗi các yêu cầu CLI ↔ registry
summary: Tài liệu tham khảo API HTTP (công khai + điểm cuối CLI + xác thực).
x-i18n:
    generated_at: "2026-05-12T23:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 đều nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được giữ để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục bên thứ ba có thể dùng các endpoint đọc công khai để liệt kê hoặc tìm kiếm skills ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng trở lại danh sách ClawHub chính tắc (`https://clawhub.ai/<owner>/<slug>`), và tránh ngụ ý rằng ClawHub chứng thực trang bên thứ ba. Không cố gắng sao chép nội dung bị ẩn, riêng tư, hoặc bị chặn bởi kiểm duyệt ra ngoài bề mặt API công khai.

Các lối tắt slug web phân giải qua các họ registry, nhưng client API nên dùng
các URL chính tắc do endpoint đọc trả về thay vì tự dựng lại thứ tự ưu tiên
định tuyến.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: thực thi theo từng IP.
- Yêu cầu đã xác thực (Bearer token hợp lệ): thực thi theo bucket người dùng.
- Nếu token bị thiếu/không hợp lệ, hành vi quay về thực thi theo IP.
- Các endpoint ghi đã xác thực không nên trả về một `Unauthorized` trống khi
  máy chủ biết lý do. Token bị thiếu, token không hợp lệ/bị thu hồi, và
  tài khoản bị xóa/cấm/vô hiệu hóa đều nên nhận văn bản có thể hành động để CLI
  client có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 600/phút cho mỗi IP, 2400/phút cho mỗi khóa
- Ghi: 45/phút cho mỗi IP, 180/phút cho mỗi khóa
- Tải xuống: 30/phút cho mỗi IP, 180/phút cho mỗi khóa (`/api/v1/download`)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Đã chuẩn hóa: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Khi `429`: `Retry-After`

Ngữ nghĩa header:

- `X-RateLimit-Reset`: giây Unix epoch tuyệt đối
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `Retry-After`: số giây cần chờ trước khi thử lại (độ trễ) khi `429`

Ví dụ phản hồi `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Hướng dẫn cho client:

- Nếu `Retry-After` tồn tại, hãy chờ số giây đó trước khi thử lại.
- Dùng backoff có jitter để tránh các lần thử lại đồng bộ.
- Nếu thiếu `Retry-After`, quay về `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Dùng `cf-connecting-ip` (Cloudflare) làm IP client theo mặc định.
- ClawHub dùng các header chuyển tiếp tin cậy để nhận diện IP client ở biên.
- Nếu không có IP client tin cậy, các yêu cầu tải xuống ẩn danh dùng một bucket dự phòng theo phạm vi endpoint thay vì một bucket `ip:unknown` toàn cục. Các yêu cầu đọc/ghi ẩn danh vẫn dùng bucket unknown chung để định tuyến thiếu IP vẫn hiển thị và thận trọng.

## Endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên
- `highlightedOnly` (tùy chọn): `true` để lọc chỉ còn skills được làm nổi bật
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ cho `nonSuspiciousOnly`

Phản hồi:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Ghi chú:

- Kết quả được trả về theo thứ tự liên quan (độ tương đồng embedding + điểm tăng cho token slug/tên khớp chính xác + ưu tiên mức độ phổ biến từ lượt tải xuống).
- Độ liên quan mạnh hơn mức độ phổ biến. Một slug hoặc token tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn nhưng có nhiều lượt tải xuống hơn.
- Văn bản ASCII được tách token theo ranh giới từ và dấu câu. Ví dụ, `personal-map` chứa một token `map` độc lập, trong khi `amap-jsapi-skill` chứa `amap`, `jsapi`, và `skill`; vì vậy tìm kiếm `map` sẽ cho `personal-map` một kết quả khớp từ vựng mạnh hơn `amap-jsapi-skill`.
- Lượt tải xuống được dùng làm ưu tiên nhỏ theo thang log và tiêu chí phá hòa, không phải tín hiệu xếp hạng chính. Skills có nhiều lượt tải xuống có thể xếp thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc bị ẩn có thể loại một skill khỏi tìm kiếm công khai tùy theo bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn về khả năng được tìm thấy cho nhà phát hành:

- Đặt các thuật ngữ mà người dùng sẽ tìm kiếm theo nghĩa đen vào tên hiển thị, tóm tắt và thẻ. Chỉ dùng token slug độc lập khi đó cũng là danh tính ổn định mà bạn muốn giữ.
- Không đổi tên slug chỉ để theo đuổi một truy vấn, trừ khi slug mới là tên chính tắc dài hạn tốt hơn. Slug cũ trở thành bí danh chuyển hướng, nhưng URL chính tắc, slug hiển thị và các digest tìm kiếm trong tương lai dùng slug mới.
- Bí danh đổi tên giữ khả năng phân giải cho URL cũ và các lượt cài đặt phân giải qua registry, nhưng xếp hạng tìm kiếm dựa trên metadata skill chính tắc sau khi việc đổi tên đã được lập chỉ mục. Số liệu thống kê hiện có vẫn gắn với skill.
- Nếu một skill bất ngờ không hiển thị, trước tiên hãy kiểm tra trạng thái kiểm duyệt bằng `clawhub inspect <slug>` trong khi đã đăng nhập trước khi thay đổi metadata liên quan đến xếp hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–200)
- `cursor` (tùy chọn): con trỏ phân trang cho mọi cách sắp xếp không phải `trending`
- `sort` (tùy chọn): `updated` (mặc định), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), `installsCurrent` (bí danh: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ cho `nonSuspiciousOnly`

Ghi chú:

- `trending` xếp hạng theo lượt cài đặt trong 7 ngày gần nhất (dựa trên telemetry).
- `createdAt` ổn định cho quá trình thu thập skill mới; `updated` thay đổi khi skills hiện có được phát hành lại.
- Khi `nonSuspiciousOnly=true`, các cách sắp xếp dựa trên con trỏ có thể trả về ít hơn `limit` mục trên một trang vì skills đáng ngờ được lọc sau khi truy xuất trang.
- Dùng `nextCursor` để tiếp tục phân trang khi có. Một trang ngắn tự nó không có nghĩa là đã hết kết quả.

Phản hồi:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Phản hồi:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Ghi chú:

- Slug cũ được tạo bởi luồng đổi tên/hợp nhất owner phân giải đến skill chính tắc.
- `metadata.os`: các hạn chế OS khai báo trong frontmatter của skill (ví dụ `["macos"]`, `["linux"]`). `null` nếu chưa khai báo.
- `metadata.systems`: mục tiêu hệ thống Nix (ví dụ `["aarch64-darwin", "x86_64-linux"]`). `null` nếu chưa khai báo.
- `metadata` là `null` nếu skill không có metadata nền tảng.
- `moderation` chỉ được bao gồm khi skill bị gắn cờ hoặc owner đang xem nó.

### `GET /api/v1/skills/{slug}/moderation`

Trả về trạng thái kiểm duyệt có cấu trúc.

Phản hồi:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Ghi chú:

- Owner và moderator có thể truy cập chi tiết kiểm duyệt cho skills bị ẩn.
- Bên gọi công khai chỉ nhận `200` cho skills hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập lại cho bên gọi công khai và chỉ bao gồm đoạn thô cho owner/moderator.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một skill để moderator xem xét. Báo cáo ở cấp skill, có thể liên kết
với một phiên bản, và đưa vào hàng đợi báo cáo skill.

Xác thực:

- Yêu cầu API token.

Yêu cầu:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Phản hồi:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Endpoint moderator/admin để tiếp nhận báo cáo skill.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `confirmed`, `dismissed`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-200)
- `cursor` (tùy chọn): con trỏ phân trang

Phản hồi:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Endpoint moderator/admin để giải quyết hoặc mở lại báo cáo skill.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` là bắt buộc với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "hide"` cùng một báo cáo đã được phân loại
để ẩn skill trong cùng quy trình có thể kiểm tra.

### `GET /api/v1/skills/{slug}/versions`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên
- `cursor` (tùy chọn): con trỏ phân trang

### `GET /api/v1/skills/{slug}/versions/{version}`

Trả về metadata phiên bản + danh sách tệp.

- `version.security` bao gồm trạng thái xác minh quét đã chuẩn hóa và chi tiết trình quét
  (VirusTotal + LLM), khi có.

### `GET /api/v1/skills/{slug}/scan`

Trả về chi tiết xác minh quét bảo mật cho một phiên bản skill.

Tham số truy vấn:

- `version` (tùy chọn): chuỗi phiên bản cụ thể.
- `tag` (tùy chọn): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Ghi chú:

- Nếu không cung cấp cả `version` lẫn `tag`, dùng phiên bản mới nhất.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng chi tiết riêng của trình quét.
- `security.capabilityTags` bao gồm các nhãn năng lực/rủi ro xác định như
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, và `posts-externally` khi phát hiện.
- `security.hasScanResult` là `true` chỉ khi một trình quét tạo ra kết luận dứt khoát (`clean`, `suspicious`, hoặc `malicious`).
- `moderation` là ảnh chụp trạng thái kiểm duyệt cấp skill hiện tại được suy ra từ phiên bản mới nhất.
- Khi truy vấn một phiên bản lịch sử, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi xem `moderation` và `security` là cùng ngữ cảnh phiên bản.

### `GET /api/v1/skills/{slug}/file`

Trả về nội dung văn bản thô.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định là phiên bản mới nhất.
- Giới hạn kích thước tệp: 200KB.

### `GET /api/v1/packages`

Endpoint danh mục hợp nhất cho:

- skills
- code plugins
- bundle plugins

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `executesCode` (tùy chọn): `true` hoặc `false`
- `capabilityTag` (tùy chọn): bộ lọc năng lực cho các gói Plugin
- `target` / `hostTarget` (tùy chọn): dạng viết tắt cho `host:<target>`
- `os`, `arch`, `libc` (tùy chọn): dạng viết tắt cho bộ lọc năng lực máy chủ
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (tùy chọn): dạng viết tắt `true`/`1` cho thẻ yêu cầu môi trường
- `externalService`, `binary`, `osPermission` (tùy chọn): dạng viết tắt cho các
  thẻ yêu cầu môi trường có tên
- `artifactKind` (tùy chọn): `legacy-zip` hoặc `npm-pack`
- `npmMirror` (tùy chọn): `true`/`1` để hiển thị các phiên bản gói do ClawPack hậu thuẫn
  có sẵn thông qua npm mirror

Ghi chú:

- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh cố định theo family.
- Các mục Skill vẫn được hậu thuẫn bởi skill registry và chỉ có thể được xuất bản thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành code-plugin và bundle-plugin.
- Bên gọi ẩn danh chỉ thấy các kênh gói công khai.
- Bên gọi đã xác thực có thể thấy các gói riêng tư của những publisher mà họ thuộc về trong kết quả liệt kê/tìm kiếm.
- `channel=private` chỉ trả về các gói mà bên gọi đã xác thực có thể đọc.

### `GET /api/v1/packages/search`

Tìm kiếm danh mục hợp nhất trên các Skills + gói Plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1–100)
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `executesCode` (tùy chọn): `true` hoặc `false`
- `capabilityTag` (tùy chọn): bộ lọc năng lực cho các gói Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary`, và
  `osPermission` được chấp nhận làm dạng viết tắt cho các thẻ năng lực phổ biến
- `artifactKind` (tùy chọn): `legacy-zip` hoặc `npm-pack`
- `npmMirror` (tùy chọn): `true`/`1` để tìm kiếm các phiên bản gói do ClawPack hậu thuẫn
  có sẵn thông qua npm mirror

Ghi chú:

- Bên gọi ẩn danh chỉ thấy các kênh gói công khai.
- Bên gọi đã xác thực có thể tìm kiếm các gói riêng tư của những publisher mà họ thuộc về.
- `channel=private` chỉ trả về các gói mà bên gọi đã xác thực có thể đọc.
- Bộ lọc artifact được hậu thuẫn bởi các thẻ năng lực đã lập chỉ mục:
  `artifact:legacy-zip`, `artifact:npm-pack`, và `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Trả về siêu dữ liệu chi tiết của gói.

Ghi chú:

- Skills cũng có thể được phân giải qua tuyến này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc publisher sở hữu.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả bản phát hành.

Ghi chú:

- Yêu cầu API token của chủ sở hữu gói, chủ sở hữu/quản trị viên của org publisher,
  điều phối viên nền tảng, hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Ghi chú:

- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc publisher sở hữu.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm siêu dữ liệu tệp, khả năng tương thích,
năng lực, xác minh, siêu dữ liệu artifact và dữ liệu quét.

Ghi chú:

- `version.artifact.kind` là `legacy-zip` cho kho lưu trữ gói kiểu cũ hoặc
  `npm-pack` cho các bản phát hành do ClawPack hậu thuẫn.
- Các bản phát hành ClawPack bao gồm các trường tương thích với npm là `npmIntegrity`, `npmShasum`, và
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, và `version.staticScan` được bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc publisher sở hữu.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về siêu dữ liệu trình phân giải artifact tường minh cho một phiên bản gói.

Ghi chú:

- Các phiên bản gói legacy trả về artifact `legacy-zip` và một
  `downloadUrl` ZIP legacy.
- Các phiên bản ClawPack trả về artifact `npm-pack`, các trường integrity của npm, một
  `tarballUrl`, và URL tương thích ZIP legacy.
- Đây là bề mặt trình phân giải của OpenClaw; nó tránh việc đoán định dạng kho lưu trữ từ
  một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống artifact của phiên bản thông qua đường dẫn trình phân giải tường minh.

Ghi chú:

- Các phiên bản ClawPack truyền trực tiếp đúng các byte `.tgz` npm-pack đã tải lên.
- Các phiên bản ZIP legacy chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng nhóm giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về mức độ sẵn sàng đã tính toán cho việc OpenClaw tiêu thụ trong tương lai.

Các kiểm tra mức độ sẵn sàng bao gồm:

- trạng thái kênh chính thức
- tính khả dụng của phiên bản mới nhất
- tính khả dụng của artifact ClawPack npm-pack
- digest artifact
- nguồn gốc repo nguồn và commit
- siêu dữ liệu tương thích OpenClaw
- mục tiêu máy chủ
- trạng thái quét

Phản hồi:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Endpoint cho điều phối viên để liệt kê các hàng di chuyển Plugin OpenClaw chính thức.

Xác thực:

- Yêu cầu API token của người dùng điều phối viên hoặc quản trị viên.

Tham số truy vấn:

- `phase` (tùy chọn): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, hoặc
  `all` (mặc định).
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Phản hồi:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Endpoint cho quản trị viên để tạo hoặc cập nhật một hàng di chuyển Plugin chính thức.

Xác thực:

- Yêu cầu API token của người dùng quản trị viên.

Nội dung yêu cầu:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Ghi chú:

- `bundledPluginId` được chuẩn hóa thành chữ thường và là khóa upsert ổn định.
- `packageName` được chuẩn hóa theo tên npm; gói có thể chưa có đối với các di chuyển
  đã lên kế hoạch.
- Mục này chỉ theo dõi mức độ sẵn sàng di chuyển. Nó không thay đổi OpenClaw hoặc tạo
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint cho điều phối viên/quản trị viên cho hàng đợi xem xét bản phát hành gói.

Xác thực:

- Yêu cầu API token của người dùng điều phối viên hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `blocked`, `manual`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Ý nghĩa trạng thái:

- `open`: các bản phát hành đáng ngờ, độc hại, đang chờ xử lý, bị cách ly, bị thu hồi, hoặc đã được báo cáo.
- `blocked`: các bản phát hành bị cách ly, bị thu hồi, hoặc độc hại.
- `manual`: bất kỳ bản phát hành nào có ghi đè điều phối thủ công.
- `all`: bất kỳ bản phát hành nào có ghi đè thủ công, trạng thái quét không sạch, hoặc báo cáo gói.

Phản hồi:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Báo cáo một gói để điều phối viên xem xét. Báo cáo ở cấp gói, tùy chọn
liên kết với một phiên bản. Chúng đưa dữ liệu vào hàng đợi điều phối nhưng không tự động ẩn hoặc
chặn tải xuống; điều phối viên nên dùng điều phối bản phát hành để
phê duyệt, cách ly, hoặc thu hồi artifact.

Xác thực:

- Yêu cầu API token.

Yêu cầu:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Phản hồi:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Endpoint cho điều phối viên/quản trị viên để tiếp nhận báo cáo gói.

Xác thực:

- Yêu cầu API token của người dùng điều phối viên hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `confirmed`, `dismissed`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Phản hồi:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Endpoint cho chủ sở hữu/điều phối viên để xem thông tin điều phối gói.

Xác thực:

- Yêu cầu API token của chủ sở hữu gói, thành viên publisher, điều phối viên, hoặc
  người dùng quản trị viên.

Phản hồi:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Endpoint cho điều phối viên/quản trị viên để giải quyết hoặc mở lại báo cáo gói.

Yêu cầu:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "quarantine"` hoặc
`finalAction: "revoke"` cùng với một báo cáo đã xác nhận để áp dụng kiểm duyệt bản phát hành trong
cùng quy trình có thể kiểm tra.

Phản hồi:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Điểm cuối dành cho moderator/admin để xét duyệt bản phát hành gói.

Yêu cầu:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Các trạng thái được hỗ trợ:

- `approved`: đã được xét duyệt thủ công và cho phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các tuyến tải xuống artifact.
Mỗi thay đổi ghi một mục nhật ký kiểm tra.

### `POST /api/v1/packages/backfill/artifacts`

Điểm cuối bảo trì chỉ dành cho quản trị viên để gắn nhãn các bản phát hành gói cũ hơn bằng
metadata loại artifact rõ ràng.

Nội dung yêu cầu:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Phản hồi:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Ghi chú:

- Mặc định là chạy thử.
- Các bản phát hành không có lưu trữ ClawPack được gắn nhãn `legacy-zip`.
- Các hàng hiện có dựa trên ClawPack nhưng thiếu `artifactKind` được sửa thành
  `npm-pack`.
- Việc này không tạo ClawPack hoặc thay đổi byte artifact.

### `GET /api/v1/packages/{name}/file`

Trả về nội dung văn bản thô cho một tệp gói.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Dùng bucket giới hạn tốc độ đọc, không phải bucket tải xuống.
- Tệp nhị phân trả về `415`.
- Giới hạn kích thước tệp: 200KB.
- Các lượt quét VirusTotal đang chờ xử lý không chặn lượt đọc; các bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Gói riêng tư trả về `404` trừ khi bên gọi có thể đọc publisher sở hữu.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Kho lưu trữ Plugin/gói là các tệp zip có gốc `package/` để các client OpenClaw cũ
  tiếp tục hoạt động.
- Tuyến này chỉ dành cho ZIP. Nó không phát trực tuyến các tệp ClawPack `.tgz`.
- Phản hồi bao gồm các header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` và
  `X-ClawHub-Artifact-Sha256` cho các kiểm tra tính toàn vẹn của resolver.
- Metadata chỉ thuộc registry không được chèn vào kho lưu trữ đã tải xuống.
- Các lượt quét VirusTotal đang chờ xử lý không chặn tải xuống; bản phát hành độc hại trả về `403`.
- Gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về packument tương thích với npm cho các phiên bản gói dựa trên ClawPack.

Ghi chú:

- Chỉ liệt kê các phiên bản có tarball npm-pack ClawPack đã tải lên.
- Các phiên bản cũ chỉ có ZIP được cố ý bỏ qua.
- `dist.tarball`, `dist.integrity` và `dist.shasum` dùng các trường tương thích với npm
  để người dùng có thể trỏ npm đến mirror nếu họ chọn.
- Packument của gói có scope hỗ trợ cả `/api/npm/@scope/name` và đường dẫn yêu cầu
  được mã hóa của npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Phát trực tuyến chính xác các byte tarball ClawPack đã tải lên cho client mirror npm.

Ghi chú:

- Dùng bucket giới hạn tốc độ tải xuống.
- Header tải xuống bao gồm SHA-256 của ClawHub cùng metadata integrity/shasum của npm.
- Kiểm duyệt và kiểm tra quyền truy cập gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI dùng để ánh xạ fingerprint cục bộ đến một phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 hex 64 ký tự của fingerprint bundle

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống tệp zip của một phiên bản skill.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên tag (ví dụ `latest`)

Ghi chú:

- Nếu không cung cấp `version` hoặc `tag`, phiên bản mới nhất sẽ được dùng.
- Phiên bản đã xóa mềm trả về `410`.
- Thống kê tải xuống được tính là các danh tính duy nhất mỗi giờ (`userId` khi API token hợp lệ, nếu không thì IP).

## Điểm cuối xác thực (mã thông báo Bearer)

Tất cả điểm cuối yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực token và trả về handle người dùng.

### `POST /api/v1/skills`

Xuất bản một phiên bản mới.

- Ưu tiên: `multipart/form-data` với JSON `payload` + blob `files[]`.
- Nội dung JSON với `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có, API phân giải
  publisher đó ở phía máy chủ và yêu cầu actor có quyền truy cập publisher.
- Trường payload tùy chọn: `migrateOwner`. Khi là `true` với `ownerHandle`, một
  skill hiện có có thể chuyển sang chủ sở hữu đó nếu actor là admin/chủ sở hữu trên cả
  publisher hiện tại và publisher đích. Nếu không chọn rõ tùy chọn này, các thay đổi chủ sở hữu sẽ
  bị từ chối.

### `POST /api/v1/packages`

Xuất bản một bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng Bearer token.
- Ưu tiên: `multipart/form-data` với JSON `payload` + blob `files[]`.
- Nội dung JSON với `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có, chỉ admin mới có thể xuất bản thay mặt chủ sở hữu đó.

Điểm nổi bật về xác thực:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Gói Plugin yêu cầu `openclaw.plugin.json`. Các lượt tải lên ClawPack `.tgz` phải
  chứa tệp đó tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, metadata repo nguồn, metadata commit nguồn,
  metadata schema cấu hình, `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là metadata tùy chọn.
- Chỉ publisher đáng tin cậy mới có thể xuất bản lên kênh `official`.
- Các lượt xuất bản thay mặt vẫn xác thực điều kiện đủ tư cách kênh chính thức dựa trên tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, moderator hoặc admin).

Nội dung JSON tùy chọn:

```json
{ "reason": "Held for moderation pending legal review." }
```

Khi có, `reason` được lưu làm ghi chú kiểm duyệt skill và được sao chép vào nhật ký kiểm tra.
Các lượt xóa mềm do chủ sở hữu khởi tạo giữ slug trong 30 ngày, sau đó slug có thể được
publisher khác nhận. Phản hồi xóa bao gồm `slugReservedUntil` khi thời hạn này áp dụng.
Các lượt ẩn của moderator/admin và gỡ bỏ vì bảo mật không hết hạn theo cách này.

Phản hồi xóa:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Mã trạng thái:

- `200`: ok
- `401`: chưa xác thực
- `403`: bị cấm
- `404`: không tìm thấy skill/người dùng
- `500`: lỗi máy chủ nội bộ

### `POST /api/v1/users/publisher`

Chỉ dành cho admin. Đảm bảo publisher tổ chức tồn tại cho một handle. Nếu handle vẫn trỏ đến
publisher người dùng cá nhân/chia sẻ cũ, điểm cuối sẽ di chuyển nó vào publisher tổ chức trước.

- Nội dung: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Chỉ dành cho admin. Dành trước slug gốc và tên gói cho chủ sở hữu hợp pháp mà không xuất bản
bản phát hành. Tên gói trở thành các gói placeholder riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu sau này có thể xuất bản bản phát hành code-plugin hoặc bundle-plugin thật vào tên đó.

- Nội dung: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Phản hồi: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Điểm cuối quản lý slug của chủ sở hữu

- `POST /api/v1/skills/{slug}/rename`
  - Nội dung: `{ "newSlug": "new-canonical-slug" }`
  - Phản hồi: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Nội dung: `{ "targetSlug": "canonical-target-slug" }`
  - Phản hồi: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Ghi chú:

- Cả hai điểm cuối yêu cầu xác thực bằng API token và chỉ hoạt động cho chủ sở hữu skill.
- `rename` giữ slug trước đó làm bí danh chuyển hướng.
- `merge` ẩn listing nguồn và chuyển hướng slug nguồn đến listing đích.

### Điểm cuối chuyển quyền sở hữu

- `POST /api/v1/skills/{slug}/transfer`
  - Nội dung: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Phản hồi: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Phản hồi (chấp nhận/từ chối/hủy): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Dạng phản hồi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Cấm một người dùng và xóa cứng Skills thuộc sở hữu (chỉ moderator/admin).

Nội dung:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

hoặc

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Phản hồi:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Bỏ cấm một người dùng và khôi phục Skills đủ điều kiện (chỉ admin).

Nội dung:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

hoặc

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Phản hồi:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Thay đổi vai trò người dùng (chỉ admin).

Nội dung:

```json
{ "handle": "user_handle", "role": "moderator" }
```

hoặc

```json
{ "userId": "users_...", "role": "admin" }
```

Phản hồi:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Liệt kê hoặc tìm kiếm người dùng (chỉ admin).

Tham số truy vấn:

- `q` (tùy chọn): truy vấn tìm kiếm
- `query` (tùy chọn): bí danh cho `q`
- `limit` (tùy chọn): số kết quả tối đa (mặc định 20, tối đa 200)

Phản hồi:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Thêm/xóa một sao (điểm nổi bật). Cả hai điểm cuối đều idempotent.

Phản hồi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Điểm cuối CLI cũ (không còn khuyến nghị)

Vẫn được hỗ trợ cho các phiên bản CLI cũ hơn:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch gỡ bỏ.

## Khám phá registry (`/.well-known/clawhub.json`)

CLI có thể khám phá thiết lập registry/xác thực từ trang web:

- `/.well-known/clawhub.json` (JSON, ưu tiên)
- `/.well-known/clawdhub.json` (cũ)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu bạn tự host, hãy phục vụ tệp này (hoặc đặt rõ `CLAWHUB_REGISTRY`; `CLAWDHUB_REGISTRY` cũ).
