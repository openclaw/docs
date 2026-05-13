---
read_when:
    - Thêm/thay đổi các điểm cuối
    - Gỡ lỗi các yêu cầu CLI ↔ sổ đăng ký
summary: Tài liệu tham khảo API HTTP (điểm cuối công khai + điểm cuối CLI + xác thực).
x-i18n:
    generated_at: "2026-05-13T04:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được giữ để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục của bên thứ ba có thể dùng các endpoint đọc công khai để liệt kê hoặc tìm kiếm các skill trên ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng về mục niêm yết ClawHub chuẩn (`https://clawhub.ai/<owner>/<slug>`), và tránh ngụ ý rằng ClawHub xác nhận trang bên thứ ba đó. Đừng cố gắng sao chép nội dung ẩn, riêng tư, hoặc bị chặn kiểm duyệt ra ngoài bề mặt API công khai.

Các lối tắt slug trên web phân giải trên nhiều họ registry, nhưng client API nên dùng
các URL chuẩn do endpoint đọc trả về thay vì tự dựng lại thứ tự ưu tiên của route.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: áp dụng theo từng IP.
- Yêu cầu đã xác thực (Bearer token hợp lệ): áp dụng theo bucket của từng người dùng.
- Nếu token bị thiếu/không hợp lệ, hành vi quay về áp dụng theo IP.
- Các endpoint ghi đã xác thực không nên trả về `Unauthorized` trần trụi khi
  máy chủ biết lý do. Token bị thiếu, token không hợp lệ/bị thu hồi, và
  tài khoản đã xóa/bị cấm/bị vô hiệu hóa đều nên nhận được văn bản có thể hành động để client
  CLI có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 600/phút mỗi IP, 2400/phút mỗi khóa
- Ghi: 45/phút mỗi IP, 180/phút mỗi khóa
- Tải xuống: 30/phút mỗi IP, 180/phút mỗi khóa (`/api/v1/download`)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Được chuẩn hóa: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Khi gặp `429`: `Retry-After`

Ngữ nghĩa header:

- `X-RateLimit-Reset`: giây epoch Unix tuyệt đối
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `Retry-After`: số giây cần chờ trước khi thử lại (độ trễ) khi gặp `429`

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
- Nếu thiếu `Retry-After`, quay về dùng `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Mặc định dùng `cf-connecting-ip` (Cloudflare) làm IP client.
- ClawHub dùng các header chuyển tiếp đáng tin cậy để xác định IP client ở biên.
- Nếu không có IP client đáng tin cậy, các yêu cầu tải xuống ẩn danh dùng một bucket dự phòng theo phạm vi endpoint thay vì một bucket `ip:unknown` toàn cục. Các yêu cầu đọc/ghi ẩn danh vẫn dùng bucket unknown dùng chung để định tuyến thiếu-IP vẫn hiển thị và thận trọng.

## Endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên
- `highlightedOnly` (tùy chọn): `true` để lọc chỉ các skill được làm nổi bật
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các skill đáng ngờ (`flagged.suspicious`)
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

- Kết quả được trả về theo thứ tự liên quan (độ tương đồng embedding + tăng điểm token slug/tên khớp chính xác + độ ưu tiên phổ biến từ lượt tải xuống).
- Độ liên quan mạnh hơn độ phổ biến. Một token slug hoặc tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn nhưng có nhiều lượt tải xuống hơn rất nhiều.
- Văn bản ASCII được tách token theo ranh giới từ và dấu câu. Ví dụ, `personal-map` chứa một token `map` độc lập, trong khi `amap-jsapi-skill` chứa `amap`, `jsapi`, và `skill`; do đó tìm kiếm `map` cho `personal-map` một kết quả khớp từ vựng mạnh hơn `amap-jsapi-skill`.
- Lượt tải xuống được dùng như một độ ưu tiên nhỏ theo thang log và để phân giải hòa điểm, không phải tín hiệu xếp hạng chính. Các skill có nhiều lượt tải xuống có thể xếp thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc ẩn có thể loại bỏ một skill khỏi tìm kiếm công khai tùy theo bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn khả năng được tìm thấy cho nhà phát hành:

- Đặt các thuật ngữ mà người dùng sẽ thật sự tìm kiếm vào tên hiển thị, tóm tắt, và thẻ. Chỉ dùng token slug độc lập khi nó cũng là một danh tính ổn định mà bạn muốn giữ.
- Đừng đổi tên slug chỉ để chạy theo một truy vấn, trừ khi slug mới là tên chuẩn dài hạn tốt hơn. Slug cũ trở thành bí danh chuyển hướng, nhưng URL chuẩn, slug hiển thị, và digest tìm kiếm trong tương lai dùng slug mới.
- Bí danh đổi tên giữ khả năng phân giải cho URL cũ và các lượt cài đặt phân giải qua registry, nhưng xếp hạng tìm kiếm dựa trên siêu dữ liệu skill chuẩn sau khi việc đổi tên đã được lập chỉ mục. Thống kê hiện có vẫn đi cùng skill.
- Nếu một skill bất ngờ không hiển thị, trước tiên hãy kiểm tra trạng thái kiểm duyệt bằng `clawhub inspect <slug>` khi đã đăng nhập trước khi thay đổi siêu dữ liệu liên quan đến xếp hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–200)
- `cursor` (tùy chọn): con trỏ phân trang cho mọi kiểu sắp xếp không phải `trending`
- `sort` (tùy chọn): `updated` (mặc định), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), `installsCurrent` (bí danh: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các skill đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ cho `nonSuspiciousOnly`

Ghi chú:

- `trending` xếp hạng theo lượt cài đặt trong 7 ngày gần nhất (dựa trên telemetry).
- `createdAt` ổn định cho việc crawl skill mới; `updated` thay đổi khi các skill hiện có được phát hành lại.
- Khi `nonSuspiciousOnly=true`, các kiểu sắp xếp dựa trên con trỏ có thể trả về ít hơn `limit` mục trên một trang vì các skill đáng ngờ được lọc sau khi truy xuất trang.
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

- Slug cũ được tạo bởi luồng đổi tên/hợp nhất chủ sở hữu sẽ phân giải về skill chuẩn.
- `metadata.os`: các hạn chế OS được khai báo trong frontmatter của skill (ví dụ `["macos"]`, `["linux"]`). `null` nếu không được khai báo.
- `metadata.systems`: các mục tiêu hệ thống Nix (ví dụ `["aarch64-darwin", "x86_64-linux"]`). `null` nếu không được khai báo.
- `metadata` là `null` nếu skill không có siêu dữ liệu nền tảng.
- `moderation` chỉ được bao gồm khi skill bị gắn cờ hoặc chủ sở hữu đang xem nó.

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

- Chủ sở hữu và điều phối viên có thể truy cập chi tiết kiểm duyệt cho các skill bị ẩn.
- Bên gọi công khai chỉ nhận `200` cho các skill hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập lại cho bên gọi công khai và chỉ bao gồm đoạn trích thô cho chủ sở hữu/điều phối viên.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một skill để điều phối viên xem xét. Báo cáo ở cấp skill, có thể được liên kết tùy chọn
với một phiên bản, và đi vào hàng đợi báo cáo skill.

Xác thực:

- Yêu cầu token API.

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

Endpoint điều phối viên/quản trị viên để tiếp nhận báo cáo skill.

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

Endpoint điều phối viên/quản trị viên để giải quyết hoặc mở lại báo cáo skill.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` là bắt buộc cho `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "hide"` với một báo cáo đã được phân loại
để ẩn skill trong cùng một quy trình có thể kiểm toán.

### `GET /api/v1/skills/{slug}/versions`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên
- `cursor` (tùy chọn): con trỏ phân trang

### `GET /api/v1/skills/{slug}/versions/{version}`

Trả về siêu dữ liệu phiên bản + danh sách tệp.

- `version.security` bao gồm trạng thái xác minh quét đã chuẩn hóa và chi tiết trình quét
  (VirusTotal + LLM), khi có sẵn.

### `GET /api/v1/skills/{slug}/scan`

Trả về chi tiết xác minh quét bảo mật cho một phiên bản skill.

Tham số truy vấn:

- `version` (tùy chọn): chuỗi phiên bản cụ thể.
- `tag` (tùy chọn): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Ghi chú:

- Nếu không cung cấp `version` cũng như `tag`, dùng phiên bản mới nhất.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng chi tiết riêng của từng trình quét.
- `security.capabilityTags` bao gồm các nhãn năng lực/rủi ro xác định tất định như
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, và `posts-externally` khi phát hiện.
- `security.hasScanResult` chỉ là `true` khi một trình quét tạo ra phán quyết dứt khoát (`clean`, `suspicious`, hoặc `malicious`).
- `moderation` là ảnh chụp nhanh kiểm duyệt hiện tại ở cấp skill được suy ra từ phiên bản mới nhất.
- Khi truy vấn một phiên bản lịch sử, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi coi `moderation` và `security` là cùng một ngữ cảnh phiên bản.

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

- skill
- code plugin
- bundle plugin

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `executesCode` (tùy chọn): `true` hoặc `false`
- `capabilityTag` (tùy chọn): bộ lọc khả năng cho các gói Plugin
- `target` / `hostTarget` (tùy chọn): cách viết tắt cho `host:<target>`
- `os`, `arch`, `libc` (tùy chọn): cách viết tắt cho các bộ lọc khả năng máy chủ
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (tùy chọn): cách viết tắt `true`/`1` cho các thẻ yêu cầu môi trường
- `externalService`, `binary`, `osPermission` (tùy chọn): cách viết tắt cho các
  thẻ yêu cầu môi trường có tên
- `artifactKind` (tùy chọn): `legacy-zip` hoặc `npm-pack`
- `npmMirror` (tùy chọn): `true`/`1` để hiển thị các phiên bản gói được ClawPack hỗ trợ
  có sẵn thông qua npm mirror

Ghi chú:

- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh họ cố định.
- Các mục Skills vẫn được hỗ trợ bởi sổ đăng ký Skills và vẫn chỉ có thể được phát hành thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành code-plugin và bundle-plugin.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể thấy các gói riêng tư của những nhà phát hành mà họ thuộc về trong kết quả liệt kê/tìm kiếm.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/packages/search`

Tìm kiếm danh mục hợp nhất trên Skills + các gói Plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1–100)
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `executesCode` (tùy chọn): `true` hoặc `false`
- `capabilityTag` (tùy chọn): bộ lọc khả năng cho các gói Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary`, và
  `osPermission` được chấp nhận làm cách viết tắt cho các thẻ khả năng phổ biến
- `artifactKind` (tùy chọn): `legacy-zip` hoặc `npm-pack`
- `npmMirror` (tùy chọn): `true`/`1` để tìm kiếm các phiên bản gói được ClawPack hỗ trợ
  có sẵn thông qua npm mirror

Ghi chú:

- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể tìm kiếm các gói riêng tư của những nhà phát hành mà họ thuộc về.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.
- Các bộ lọc artifact được hỗ trợ bởi các thẻ khả năng đã lập chỉ mục:
  `artifact:legacy-zip`, `artifact:npm-pack`, và `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Trả về metadata chi tiết của gói.

Ghi chú:

- Skills cũng có thể được phân giải qua route này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả bản phát hành.

Ghi chú:

- Yêu cầu API token của chủ sở hữu gói, chủ sở hữu/quản trị viên của nhà phát hành tổ chức,
  điều phối viên nền tảng hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Ghi chú:

- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm metadata tệp, khả năng tương thích,
khả năng, xác minh, metadata artifact và dữ liệu quét.

Ghi chú:

- `version.artifact.kind` là `legacy-zip` cho các kho lưu trữ gói kiểu cũ hoặc
  `npm-pack` cho các bản phát hành được ClawPack hỗ trợ.
- Các bản phát hành ClawPack bao gồm các trường tương thích npm `npmIntegrity`, `npmShasum`, và
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis`, và `version.staticScan` được bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Trả về đúng bản tóm tắt bảo mật và độ tin cậy của bản phát hành gói cho các client
cài đặt. Đây là bề mặt tiêu thụ công khai của OpenClaw để quyết định liệu một
bản phát hành đã phân giải có thể được cài đặt hay không.

Xác thực:

- Endpoint đọc công khai. Không yêu cầu token của chủ sở hữu, nhà phát hành, điều phối viên hoặc quản trị viên.

Phản hồi:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Trường phản hồi:

- `package.name`, `package.displayName`, và `package.family` xác định
  gói registry đã phân giải.
- `release.releaseId`, `release.version`, và `release.createdAt` xác định
  đúng bản phát hành đã được đánh giá.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, và `release.npmTarballName` có mặt khi đã biết cho
  artifact của bản phát hành.
- `trust.scanStatus` là trạng thái tin cậy hiệu lực được suy ra từ đầu vào của bộ quét
  và kiểm duyệt bản phát hành thủ công.
- `trust.moderationState` có thể là null. Nó là `null` khi không có kiểm duyệt bản phát hành
  thủ công.
- `trust.blockedFromDownload` là tín hiệu chặn cài đặt. OpenClaw và các client
  cài đặt khác nên chặn cài đặt khi giá trị này là `true` thay vì
  suy luận lại các quy tắc chặn từ các trường bộ quét hoặc kiểm duyệt.
- `trust.reasons` là danh sách giải thích dành cho người dùng và kiểm toán. Mã lý do
  là các chuỗi ổn định, ngắn gọn như `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious`, và `package:malicious`.
- `trust.pending` nghĩa là một hoặc nhiều đầu vào tin cậy vẫn đang chờ hoàn tất.
- `trust.stale` nghĩa là bản tóm tắt tin cậy được tính từ các đầu vào đã lỗi thời và
  nên được xem là cần làm mới trước khi đưa ra quyết định cho phép có độ tin cậy cao.

Ghi chú:

- Endpoint này chính xác theo phiên bản. Client nên gọi nó sau khi phân giải
  phiên bản gói mà họ định cài đặt, không chỉ sau khi đọc metadata gói mới nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.
- Endpoint này được cố ý thu hẹp hơn các endpoint kiểm duyệt của chủ sở hữu/điều phối viên.
  Nó hiển thị quyết định cài đặt và giải thích công khai, không hiển thị
  danh tính người báo cáo, nội dung báo cáo, bằng chứng riêng tư hoặc mốc thời gian đánh giá
  nội bộ.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về metadata trình phân giải artifact rõ ràng cho một phiên bản gói.

Ghi chú:

- Các phiên bản gói cũ trả về artifact `legacy-zip` và `downloadUrl` ZIP
  cũ.
- Các phiên bản ClawPack trả về artifact `npm-pack`, các trường toàn vẹn npm,
  `tarballUrl`, và URL tương thích ZIP cũ.
- Đây là bề mặt trình phân giải của OpenClaw; nó tránh việc đoán định dạng kho lưu trữ từ
  một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống artifact phiên bản thông qua đường dẫn trình phân giải rõ ràng.

Ghi chú:

- Các phiên bản ClawPack truyền trực tiếp đúng các byte `.tgz` npm-pack đã tải lên.
- Các phiên bản ZIP cũ chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng bucket giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về mức độ sẵn sàng đã tính toán cho việc OpenClaw tiêu thụ trong tương lai.

Các kiểm tra mức độ sẵn sàng bao gồm:

- trạng thái kênh chính thức
- tính khả dụng của phiên bản mới nhất
- tính khả dụng của artifact npm-pack ClawPack
- digest artifact
- nguồn gốc repo nguồn và commit
- metadata tương thích OpenClaw
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

Endpoint điều phối viên để liệt kê các hàng di chuyển Plugin OpenClaw chính thức.

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

Endpoint quản trị viên để tạo hoặc cập nhật một hàng di chuyển Plugin chính thức.

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
- `packageName` được chuẩn hóa theo tên npm; gói có thể bị thiếu đối với các kế hoạch
  di chuyển đã lên kế hoạch.
- Mục này chỉ theo dõi mức độ sẵn sàng di chuyển. Nó không sửa đổi OpenClaw hoặc tạo
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint điều phối viên/quản trị viên cho các hàng đợi đánh giá bản phát hành gói.

Xác thực:

- Yêu cầu API token của người dùng điều phối viên hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `blocked`, `manual`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Ý nghĩa trạng thái:

- `open`: các bản phát hành đáng ngờ, độc hại, đang chờ, bị cách ly, bị thu hồi hoặc đã được báo cáo.
- `blocked`: các bản phát hành bị cách ly, bị thu hồi hoặc độc hại.
- `manual`: bất kỳ bản phát hành nào có ghi đè kiểm duyệt thủ công.
- `all`: bất kỳ bản phát hành nào có ghi đè thủ công, trạng thái quét không sạch hoặc báo cáo gói.

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

Báo cáo một gói để người kiểm duyệt xem xét. Báo cáo áp dụng ở cấp gói, có thể
liên kết tùy chọn với một phiên bản. Chúng được đưa vào hàng đợi kiểm duyệt nhưng tự
thân không tự động ẩn hoặc chặn lượt tải xuống; người kiểm duyệt nên dùng kiểm duyệt bản phát hành để
phê duyệt, cách ly hoặc thu hồi artifact.

Xác thực:

- Yêu cầu token API.

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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để tiếp nhận báo cáo gói.

Xác thực:

- Yêu cầu token API của người dùng là người kiểm duyệt hoặc quản trị viên.

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

Điểm cuối dành cho chủ sở hữu/người kiểm duyệt để xem trạng thái kiểm duyệt gói.

Xác thực:

- Yêu cầu token API của chủ sở hữu gói, thành viên nhà phát hành, người kiểm duyệt hoặc
  quản trị viên.

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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để xử lý hoặc mở lại báo cáo gói.

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
`finalAction: "revoke"` với một báo cáo đã xác nhận để áp dụng kiểm duyệt bản phát hành trong
cùng một quy trình có thể kiểm toán.

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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để xét duyệt bản phát hành gói.

Yêu cầu:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Các trạng thái được hỗ trợ:

- `approved`: đã được xem xét thủ công và cho phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các tuyến tải xuống artifact.
Mọi thay đổi đều ghi một mục nhật ký kiểm toán.

### `POST /api/v1/packages/backfill/artifacts`

Điểm cuối bảo trì chỉ dành cho quản trị viên để gắn nhãn các bản phát hành gói cũ hơn bằng
siêu dữ liệu loại artifact rõ ràng.

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
- Các hàng hiện có được ClawPack hỗ trợ nhưng thiếu `artifactKind` được sửa thành
  `npm-pack`.
- Thao tác này không tạo ClawPack hoặc thay đổi byte artifact.

### `GET /api/v1/packages/{name}/file`

Trả về nội dung văn bản thô cho một tệp trong gói.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Dùng bucket giới hạn tốc độ đọc, không phải bucket tải xuống.
- Tệp nhị phân trả về `415`.
- Giới hạn kích thước tệp: 200KB.
- Các lần quét VirusTotal đang chờ không chặn thao tác đọc; bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định kiểu cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Kho lưu trữ Plugin/gói là tệp zip với thư mục gốc `package/` để các client OpenClaw
  cũ tiếp tục hoạt động.
- Tuyến này chỉ dành cho ZIP. Nó không truyền phát tệp ClawPack `.tgz`.
- Phản hồi bao gồm các header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` và
  `X-ClawHub-Artifact-Sha256` cho kiểm tra tính toàn vẹn của trình phân giải.
- Siêu dữ liệu chỉ có trong registry không được chèn vào kho lưu trữ đã tải xuống.
- Các lần quét VirusTotal đang chờ không chặn lượt tải xuống; bản phát hành độc hại trả về `403`.
- Gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về packument tương thích npm cho các phiên bản gói được ClawPack hỗ trợ.

Ghi chú:

- Chỉ liệt kê các phiên bản có tarball ClawPack npm-pack đã tải lên.
- Các phiên bản kiểu cũ chỉ có ZIP được cố ý bỏ qua.
- `dist.tarball`, `dist.integrity` và `dist.shasum` dùng các
  trường tương thích npm để người dùng có thể trỏ npm tới mirror nếu muốn.
- Packument của gói có scope hỗ trợ cả đường dẫn yêu cầu `/api/npm/@scope/name` và đường dẫn
  được mã hóa của npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Truyền phát chính xác các byte tarball ClawPack đã tải lên cho client mirror npm.

Ghi chú:

- Dùng bucket giới hạn tốc độ tải xuống.
- Header tải xuống bao gồm SHA-256 của ClawHub cùng siêu dữ liệu integrity/shasum của npm.
- Kiểm duyệt và kiểm tra quyền truy cập gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI dùng để ánh xạ dấu vân tay cục bộ tới một phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 hệ thập lục phân 64 ký tự của dấu vân tay bundle

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống tệp zip của một phiên bản skill.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên thẻ (ví dụ `latest`)

Ghi chú:

- Nếu không cung cấp `version` hoặc `tag`, phiên bản mới nhất sẽ được dùng.
- Phiên bản đã bị xóa mềm trả về `410`.
- Thống kê tải xuống được tính theo danh tính duy nhất mỗi giờ (`userId` khi token API hợp lệ, nếu không thì theo IP).

## Điểm cuối xác thực (token Bearer)

Tất cả điểm cuối yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực token và trả về handle của người dùng.

### `POST /api/v1/skills`

Phát hành một phiên bản mới.

- Ưu tiên: `multipart/form-data` với JSON `payload` + blob `files[]`.
- Nội dung JSON với `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có mặt, API phân giải
  nhà phát hành đó ở phía máy chủ và yêu cầu tác nhân có quyền truy cập nhà phát hành.
- Trường payload tùy chọn: `migrateOwner`. Khi là `true` cùng với `ownerHandle`, một
  skill hiện có có thể chuyển sang chủ sở hữu đó nếu tác nhân là quản trị viên/chủ sở hữu trên cả
  nhà phát hành hiện tại và nhà phát hành đích. Nếu không chọn tham gia bằng tùy chọn này, thay đổi chủ sở hữu sẽ
  bị từ chối.

### `POST /api/v1/packages`

Phát hành bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng token Bearer.
- Ưu tiên: `multipart/form-data` với JSON `payload` + blob `files[]`.
- Nội dung JSON với `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có mặt, chỉ quản trị viên mới có thể phát hành thay mặt chủ sở hữu đó.

Điểm chính về xác thực:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Gói Plugin yêu cầu `openclaw.plugin.json`. Các bản tải lên ClawPack `.tgz` phải
  chứa tệp này tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, siêu dữ liệu repo nguồn, siêu dữ liệu commit nguồn,
  siêu dữ liệu schema cấu hình, `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
- Chỉ nhà phát hành được tin cậy mới có thể phát hành lên kênh `official`.
- Các lần phát hành thay mặt vẫn xác thực điều kiện đủ để dùng kênh chính thức đối với tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).

Nội dung JSON tùy chọn:

```json
{ "reason": "Held for moderation pending legal review." }
```

Khi có mặt, `reason` được lưu làm ghi chú kiểm duyệt skill và được sao chép vào nhật ký kiểm toán.
Các lần xóa mềm do chủ sở hữu khởi tạo giữ slug trong 30 ngày, sau đó slug có thể được
nhà phát hành khác nhận. Phản hồi xóa bao gồm `slugReservedUntil` khi thời điểm hết hạn này áp dụng.
Các lần ẩn của người kiểm duyệt/quản trị viên và gỡ bỏ vì bảo mật không hết hạn theo cách này.

Phản hồi xóa:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Mã trạng thái:

- `200`: ok
- `401`: chưa được xác thực
- `403`: bị cấm
- `404`: không tìm thấy skill/người dùng
- `500`: lỗi máy chủ nội bộ

### `POST /api/v1/users/publisher`

Chỉ dành cho quản trị viên. Đảm bảo một nhà phát hành tổ chức tồn tại cho một handle. Nếu handle vẫn trỏ tới một
nhà phát hành người dùng/cá nhân dùng chung kiểu cũ, điểm cuối sẽ di chuyển nó vào một nhà phát hành tổ chức trước.

- Nội dung: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Chỉ dành cho quản trị viên. Giữ trước slug gốc và tên gói cho chủ sở hữu hợp pháp mà không phát hành
bản phát hành. Tên gói trở thành gói placeholder riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu sau này có thể phát hành bản phát hành code-plugin hoặc bundle-plugin thật vào tên đó.

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

- Cả hai điểm cuối đều yêu cầu xác thực bằng token API và chỉ hoạt động cho chủ sở hữu skill.
- `rename` giữ slug trước đó làm alias chuyển hướng.
- `merge` ẩn danh sách nguồn và chuyển hướng slug nguồn tới danh sách đích.

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
  - Hình dạng phản hồi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Cấm một người dùng và xóa cứng Skills thuộc sở hữu (chỉ người điều hành/quản trị viên).

Phần thân:

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

Bỏ cấm một người dùng và khôi phục Skills đủ điều kiện (chỉ quản trị viên).

Phần thân:

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

Thay đổi vai trò của người dùng (chỉ quản trị viên).

Phần thân:

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

Liệt kê hoặc tìm kiếm người dùng (chỉ quản trị viên).

Tham số truy vấn:

- `q` (không bắt buộc): truy vấn tìm kiếm
- `query` (không bắt buộc): bí danh cho `q`
- `limit` (không bắt buộc): số kết quả tối đa (mặc định 20, tối đa 200)

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

Thêm/xóa một dấu sao (mục nổi bật). Cả hai điểm cuối đều có tính lũy đẳng.

Phản hồi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Các điểm cuối CLI cũ (không còn được khuyến nghị)

Vẫn được hỗ trợ cho các phiên bản CLI cũ hơn:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch gỡ bỏ.

## Khám phá sổ đăng ký (`/.well-known/clawhub.json`)

CLI có thể khám phá cài đặt sổ đăng ký/xác thực từ trang web:

- `/.well-known/clawhub.json` (JSON, được ưu tiên)
- `/.well-known/clawdhub.json` (cũ)

Lược đồ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu bạn tự lưu trữ, hãy phục vụ tệp này (hoặc đặt rõ `CLAWHUB_REGISTRY`; `CLAWDHUB_REGISTRY` cũ).
