---
read_when:
    - Thêm/thay đổi điểm cuối
    - Gỡ lỗi các yêu cầu CLI ↔ kho đăng ký
summary: Tài liệu tham khảo API HTTP (điểm cuối công khai + điểm cuối CLI + xác thực).
x-i18n:
    generated_at: "2026-07-01T20:25:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 đều nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được giữ để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục bên thứ ba có thể dùng các endpoint đọc công khai để liệt kê hoặc tìm kiếm kỹ năng ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng về mục ClawHub chính tắc (`https://clawhub.ai/<owner>/skills/<slug>`), và tránh ngụ ý rằng ClawHub chứng thực trang bên thứ ba. Không cố gắng sao chép nội dung ẩn, riêng tư, hoặc bị chặn kiểm duyệt ra ngoài bề mặt API công khai.

Các lối tắt slug web phân giải trên nhiều họ registry, nhưng client API nên dùng
các URL chính tắc do endpoint đọc trả về thay vì tự dựng lại thứ tự ưu tiên
của route.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: áp dụng theo IP.
- Yêu cầu đã xác thực (token Bearer hợp lệ): áp dụng theo bucket người dùng.
- Nếu token bị thiếu/không hợp lệ, hành vi quay về áp dụng theo IP.
- Các endpoint ghi đã xác thực không nên trả về `Unauthorized` trần khi
  máy chủ biết lý do. Token bị thiếu, token không hợp lệ/đã bị thu hồi, và
  tài khoản đã bị xóa/cấm/vô hiệu hóa, mỗi trường hợp nên nhận văn bản có thể hành động để
  client CLI có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 3000/phút mỗi IP, 12000/phút mỗi khóa
- Ghi: 300/phút mỗi IP, 3000/phút mỗi khóa
- Tải xuống: 1200/phút mỗi IP, 6000/phút mỗi khóa (endpoint tải xuống)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Đã chuẩn hóa: `RateLimit-Limit`, `RateLimit-Reset`
- Khi `429`: `X-RateLimit-Remaining: 0` và `RateLimit-Remaining: 0`
- Khi `429`: `Retry-After`

Ngữ nghĩa header:

- `X-RateLimit-Reset`: giây Unix epoch tuyệt đối
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: ngân sách còn lại chính xác khi có mặt.
  Các yêu cầu thành công được phân mảnh bỏ qua header này thay vì trả về giá trị toàn cục xấp xỉ.
- `Retry-After`: số giây cần đợi trước khi thử lại (độ trễ) khi `429`

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

- Nếu `Retry-After` tồn tại, hãy đợi bấy nhiêu giây trước khi thử lại.
- Dùng backoff có jitter để tránh các lần thử lại đồng bộ.
- Nếu thiếu `Retry-After`, quay về dùng `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Dùng các header IP client tin cậy, bao gồm `cf-connecting-ip`, chỉ khi
  triển khai bật rõ ràng các header chuyển tiếp tin cậy.
- ClawHub dùng các header chuyển tiếp tin cậy để xác định IP client ở biên.
- Nếu không có IP client tin cậy, các yêu cầu ẩn danh dùng bucket dự phòng
  chỉ giới hạn theo loại giới hạn tốc độ. Các bucket dự phòng này không bao gồm
  đường dẫn, slug, tên gói, phiên bản, chuỗi truy vấn do bên gọi cung cấp, hay các
  tham số artifact khác.

## Phản hồi lỗi

Phản hồi lỗi v1 công khai là văn bản thuần với `content-type: text/plain; charset=utf-8`.
Điều này bao gồm lỗi xác thực dữ liệu (`400`), tài nguyên công khai bị thiếu (`404`), lỗi xác thực và
quyền (`401`/`403`), giới hạn tốc độ (`429`), và tải xuống bị chặn. Client
nên đọc thân phản hồi như một chuỗi con người đọc được. Các tham số truy vấn không xác định được
bỏ qua để tương thích, nhưng các tham số truy vấn được nhận diện có giá trị không hợp lệ sẽ trả về
`400`.

## Endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên
- `highlightedOnly` (tùy chọn): `true` để lọc chỉ còn các kỹ năng được làm nổi bật
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các kỹ năng đáng ngờ (`flagged.suspicious`)
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Ghi chú:

- Kết quả được trả về theo thứ tự liên quan (độ tương đồng embedding + tăng điểm token slug/tên khớp chính xác + một prior độ phổ biến nhỏ).
- Độ liên quan mạnh hơn độ phổ biến. Một token slug hoặc tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn nhưng có mức tương tác mạnh hơn nhiều.
- Văn bản ASCII được tách token theo ranh giới từ và dấu câu. Ví dụ, `personal-map` chứa token `map` độc lập, trong khi `amap-jsapi-skill` chứa `amap`, `jsapi`, và `skill`; vì vậy tìm kiếm `map` cho `personal-map` một kết quả khớp từ vựng mạnh hơn `amap-jsapi-skill`.
- Độ phổ biến được co theo log và có trần. Các kỹ năng có mức tương tác cao có thể xếp hạng thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc ẩn có thể loại một kỹ năng khỏi tìm kiếm công khai tùy theo bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn khả năng được nhà xuất bản khám phá:

- Đặt các thuật ngữ mà người dùng sẽ thực sự tìm kiếm vào tên hiển thị, tóm tắt, và thẻ. Chỉ dùng token slug độc lập khi nó cũng là một danh tính ổn định mà bạn muốn giữ.
- Không đổi tên slug chỉ để chạy theo một truy vấn, trừ khi slug mới là tên chính tắc dài hạn tốt hơn. Slug cũ trở thành bí danh chuyển hướng, nhưng URL chính tắc, slug hiển thị, và các bản tổng hợp tìm kiếm trong tương lai dùng slug mới.
- Bí danh đổi tên giữ khả năng phân giải cho URL cũ và các cài đặt phân giải qua registry, nhưng xếp hạng tìm kiếm dựa trên metadata kỹ năng chính tắc sau khi việc đổi tên đã được lập chỉ mục. Thống kê hiện có vẫn đi cùng kỹ năng.
- Nếu một kỹ năng đột nhiên không hiển thị, hãy kiểm tra trạng thái kiểm duyệt trước bằng `clawhub inspect @owner/slug` khi đã đăng nhập, rồi mới thay đổi metadata liên quan đến xếp hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–200)
- `cursor` (tùy chọn): con trỏ phân trang cho mọi kiểu sắp xếp không phải `trending`
- `sort` (tùy chọn): `updated` (mặc định), `recommended` (bí danh: `default`), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), các bí danh cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ tới `downloads`, `trending`
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các kỹ năng đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ cho `nonSuspiciousOnly`

Giá trị `sort` không hợp lệ trả về `400`.

Ghi chú:

- `recommended` dùng tín hiệu tương tác và độ mới.
- `trending` xếp hạng theo số lượt cài đặt trong 7 ngày gần nhất (dựa trên telemetry).
- `createdAt` ổn định cho việc crawl kỹ năng mới; `updated` thay đổi khi kỹ năng hiện có được xuất bản lại.
- Khi `nonSuspiciousOnly=true`, các kiểu sắp xếp dựa trên con trỏ có thể trả về ít hơn `limit` mục trên một trang vì các kỹ năng đáng ngờ được lọc sau khi truy xuất trang.
- Dùng `nextCursor` để tiếp tục phân trang khi có mặt. Một trang ngắn tự nó không có nghĩa là đã hết kết quả.

Phản hồi:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Slug cũ được tạo bởi các luồng đổi tên/hợp nhất chủ sở hữu sẽ phân giải tới kỹ năng chính tắc.
- `metadata.os`: hạn chế hệ điều hành được khai báo trong frontmatter của kỹ năng (ví dụ `["macos"]`, `["linux"]`). `null` nếu không được khai báo.
- `metadata.systems`: mục tiêu hệ thống Nix (ví dụ `["aarch64-darwin", "x86_64-linux"]`). `null` nếu không được khai báo.
- `metadata` là `null` nếu kỹ năng không có metadata nền tảng.
- `moderation` chỉ được bao gồm khi kỹ năng bị gắn cờ hoặc chủ sở hữu đang xem kỹ năng đó.

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

- Chủ sở hữu và điều phối viên có thể truy cập chi tiết kiểm duyệt cho các kỹ năng bị ẩn.
- Bên gọi công khai chỉ nhận `200` cho các kỹ năng hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập lại cho bên gọi công khai và chỉ bao gồm đoạn trích thô cho chủ sở hữu/điều phối viên.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một kỹ năng để điều phối viên xem xét. Báo cáo ở cấp kỹ năng, có thể liên kết
tùy chọn tới một phiên bản, và đưa vào hàng đợi báo cáo kỹ năng.

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

Endpoint điều phối viên/quản trị viên để tiếp nhận báo cáo kỹ năng.

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

Endpoint điều phối viên/quản trị viên để xử lý hoặc mở lại báo cáo kỹ năng.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` là bắt buộc cho `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "hide"` với một báo cáo đã được phân loại
để ẩn kỹ năng trong cùng một quy trình có thể kiểm toán.

### `GET /api/v1/skills/{slug}/versions`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên
- `cursor` (tùy chọn): con trỏ phân trang

### `GET /api/v1/skills/{slug}/versions/{version}`

Trả về metadata phiên bản + danh sách tệp.

- `version.security` bao gồm trạng thái xác minh quét đã chuẩn hóa và chi tiết trình quét
  (VirusTotal + LLM), khi có sẵn.

### `GET /api/v1/skills/{slug}/scan`

Trả về chi tiết xác minh quét bảo mật cho một phiên bản kỹ năng.

Tham số truy vấn:

- `version` (tùy chọn): chuỗi phiên bản cụ thể.
- `tag` (tùy chọn): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Ghi chú:

- Nếu không cung cấp `version` hoặc `tag`, sẽ dùng phiên bản mới nhất.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng các chi tiết dành riêng cho từng trình quét.
- `security.hasScanResult` chỉ là `true` khi một trình quét tạo ra phán quyết dứt khoát (`clean`, `suspicious`, hoặc `malicious`).
- `moderation` là ảnh chụp nhanh kiểm duyệt hiện tại ở cấp kỹ năng, được dẫn xuất từ phiên bản mới nhất.
- Khi truy vấn một phiên bản lịch sử, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi xem `moderation` và `security` là cùng một ngữ cảnh phiên bản.

### `POST /api/v1/skills/-/scan`

Endpoint gửi có xác thực cho các công việc ClawScan mới.

Tính năng quét tải lên cục bộ không còn được hỗ trợ. Các yêu cầu dùng
`multipart/form-data` hoặc `{ "source": { "kind": "upload" } }` trả về `410`.

Các bản quét đã xuất bản dùng JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Ghi chú:

- Payload yêu cầu quét và báo cáo có thể tải xuống sẽ hết hạn khỏi kho yêu cầu quét sau khoảng thời gian lưu giữ.
- Các bản quét đã xuất bản yêu cầu quyền truy cập quản lý của chủ sở hữu/nhà xuất bản, hoặc quyền của điều phối viên/quản trị viên nền tảng.
- Các bản quét đã xuất bản chỉ ghi ngược khi `update: true` và quá trình quét hoàn tất thành công.
- Phản hồi là `202` với `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Công việc quét chạy bất đồng bộ. Các yêu cầu quét thủ công được ưu tiên trước công việc xuất bản/chèn bù thông thường, nhưng việc hoàn tất vẫn phụ thuộc vào mức độ sẵn có của worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint thăm dò có xác thực cho một bản quét đã gửi.

- Trả về trạng thái đã xếp hàng/đang chạy/thành công/thất bại.
- Trả về `queue.queuedAhead` và `queue.position` khi đang xếp hàng để client có thể hiển thị số lượng bản quét thủ công ưu tiên đang đứng trước yêu cầu. Các hàng đợi rất lớn được giới hạn và báo cáo với `queuedAheadIsEstimate: true`.
- Khi có sẵn, `report` chứa các phần `clawscan`, `skillspector`, `staticAnalysis`, và `virustotal`.
- Các công việc quét thất bại trả về `status: "failed"` cùng `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint lưu trữ báo cáo có xác thực.

- Yêu cầu bản quét đã thành công; các bản quét chưa kết thúc trả về `409`.
- Trả về một ZIP với `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, và `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint lưu trữ báo cáo đã lưu, có xác thực, cho các phiên bản đã gửi.

- Yêu cầu quyền truy cập quản lý của chủ sở hữu/nhà xuất bản đối với kỹ năng hoặc Plugin, hoặc quyền của điều phối viên/quản trị viên nền tảng.
- Trả về kết quả quét đã lưu cho đúng phiên bản đã gửi, bao gồm cả các phiên bản bị chặn hoặc bị ẩn.
- `kind` mặc định là `skill`; dùng `kind=plugin` cho các bản quét plugin/package.
- Trả về cùng dạng ZIP như các bản tải xuống yêu cầu quét.

### `POST /api/v1/skills/-/scan/batch`

Tuyến quét lại hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Nó chấp nhận cùng dạng payload như `POST /api/v1/skills/-/rescan-batch` cũ.

### `POST /api/v1/skills/-/scan/batch/status`

Tuyến trạng thái hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Nó chấp nhận `{ "jobIds": ["..."] }` và trả về cùng các bộ đếm tổng hợp như `POST /api/v1/skills/-/rescan-batch/status` cũ.

### `GET /api/v1/skills/{slug}/verify`

Trả về phong bì xác minh Skill Card được `clawhub skill verify` sử dụng.

Tham số truy vấn:

- `version` (tùy chọn): chuỗi phiên bản cụ thể.
- `tag` (tùy chọn): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Ghi chú:

- `ok` chỉ là `true` khi phiên bản đã chọn có Skill Card được tạo, không bị kiểm duyệt chặn vì phần mềm độc hại, và xác minh ClawScan sạch.
- Danh tính kỹ năng, danh tính nhà xuất bản, và siêu dữ liệu phiên bản đã chọn là các trường phong bì cấp cao nhất (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) để tự động hóa shell có thể đọc chúng mà không cần mở các wrapper lồng nhau.
- `security` là phán quyết ClawScan/bảo mật cấp cao nhất. Tự động hóa nên dựa vào `ok`, `decision`, `reasons`, và `security.status`.
- `security.signals` chứa bằng chứng hỗ trợ từ trình quét, chẳng hạn như `staticScan`, `virusTotal`, và `skillSpector`.
- `security.signals.dependencyRegistry` được giữ lại để tương thích phản hồi v1, nhưng trình quét sự tồn tại của sổ đăng ký phụ thuộc đã bị ngừng dùng và khóa này luôn là `null`.
- `provenance` chỉ là `server-resolved-github-import` khi ClawHub đã phân giải và lưu trữ repo/ref/commit/path GitHub trong lúc xuất bản hoặc nhập; nếu không thì là `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Trả về các phán quyết bảo mật cô đọng hiện tại cho đúng phiên bản kỹ năng. Endpoint
tập hợp này dành cho các client đã biết những phiên bản kỹ năng ClawHub đã cài đặt
mà chúng cần hiển thị, chẳng hạn như OpenClaw Control UI.

Yêu cầu:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Ghi chú:

- `items` phải chứa 1-100 cặp `{ slug, version }` duy nhất.
- Kết quả theo từng mục; một kỹ năng hoặc phiên bản bị thiếu không làm toàn bộ phản hồi thất bại.
- Phản hồi chỉ dành cho bảo mật. Nó không bao gồm dữ liệu Skill Card, trạng thái thẻ đã tạo, danh sách tệp artifact, hoặc payload trình quét chi tiết.
- `security.signals` chỉ chứa bằng chứng hỗ trợ ở cấp trạng thái; dùng `/scan` hoặc trang kiểm tra bảo mật ClawHub để xem đầy đủ chi tiết trình quét.
- `security.signals.dependencyRegistry` được giữ lại để tương thích phản hồi v1, nhưng trình quét sự tồn tại của sổ đăng ký phụ thuộc đã bị ngừng dùng và khóa này luôn là `null`.
- Việc thiếu Skill Card không ảnh hưởng đến `ok`, `decision`, hoặc `reasons` của endpoint này; client nên đọc `skill-card.md` đã cài đặt cục bộ khi cần nội dung thẻ.
- Dùng `/verify` khi bạn cần phong bì xác minh Skill Card cho một kỹ năng, `/card` khi bạn cần markdown thẻ đã tạo, và `/scan` khi bạn cần dữ liệu trình quét chi tiết.

Phản hồi:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

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

Điểm cuối danh mục hợp nhất cho:

- skills
- code plugins
- bundle plugins

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `sort` (tùy chọn): `updated` (mặc định), `recommended`, `trending`, `downloads`, bí danh cũ `installs`
- `category` (tùy chọn): bộ lọc danh mục plugin. Chỉ được hỗ trợ khi
  yêu cầu được giới hạn trong các gói plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, hoặc các điểm cuối gói với
  `family=code-plugin`/`family=bundle-plugin`). Các danh mục được kiểm soát và
  bí danh bộ lọc v1 cũ được ghi tài liệu trong `GET /api/v1/plugins`.

Ghi chú:

- Giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, hoặc `sort` trả về `400`. Tham số truy vấn không xác định sẽ bị bỏ qua.
- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh theo family cố định.
- Các mục skill vẫn được hỗ trợ bởi registry skill và vẫn chỉ có thể được xuất bản thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành code-plugin và bundle-plugin.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể thấy các gói riêng tư cho những nhà xuất bản mà họ thuộc về trong kết quả danh sách/tìm kiếm.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/packages/search`

Tìm kiếm danh mục hợp nhất trên skills + gói plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1–100)
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `category` (tùy chọn): bộ lọc danh mục plugin. Chỉ được hỗ trợ khi
  yêu cầu được giới hạn trong các gói plugin. Các danh mục được kiểm soát và
  bí danh bộ lọc v1 cũ được ghi tài liệu trong `GET /api/v1/plugins`.

Ghi chú:

- Giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`, hoặc
  `highlightedOnly` trả về `400`. Tham số truy vấn không xác định sẽ bị bỏ qua.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể tìm kiếm các gói riêng tư cho những nhà xuất bản mà họ thuộc về.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/plugins`

Duyệt danh mục chỉ dành cho Plugin trên các gói code-plugin và bundle-plugin.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `sort` (tùy chọn): `recommended` (mặc định), `trending`, `downloads`, `updated`, bí danh cũ `installs`
- `category` (tùy chọn): bộ lọc danh mục plugin. Giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Các bí danh bộ lọc v1 cũ vẫn được chấp nhận trên các điểm cuối đọc:

- `mcp-tooling`, `data`, và `automation` phân giải thành `tools`.
- `observability` và `deployment` phân giải thành `gateway`.
- `dev-tools` phân giải thành `runtime`.

`trending` là bảng xếp hạng lượt cài đặt/tải xuống trong bảy ngày và không dùng tổng số mọi thời điểm.
Trên điểm cuối hợp nhất `/api/v1/packages`, nó chỉ dành cho plugin; dùng
`/api/v1/skills?sort=trending` cho danh mục skill.

Các bí danh cũ không được chấp nhận làm giá trị danh mục được lưu trữ hoặc do tác giả khai báo.

### `GET /api/v1/skills/export`

Xuất hàng loạt các skill công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Cần có token API.

Tham số truy vấn:

- `startDate` (bắt buộc): cận dưới tính bằng mili giây Unix cho `updatedAt` của skill.
- `endDate` (bắt buộc): cận trên tính bằng mili giây Unix cho `updatedAt` của skill.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước đó.

Phản hồi:

- Phần thân: kho lưu trữ ZIP.
- Mỗi skill được đặt gốc tại `{publisher}/{slug}/`.
- Skill được lưu trữ bao gồm các tệp của phiên bản được lưu trữ mới nhất và được liệt kê trong
  `_manifest.json` với `sourceRef: "public-clawhub"`.
- Skill hiện tại được hỗ trợ bởi GitHub với lần quét `clean` hoặc `suspicious` bao gồm
  `_source_handoff.json` với `sourceRef: "public-github"`, repo, commit, path,
  hàm băm nội dung, và URL kho lưu trữ. Chúng không bao gồm các tệp nguồn do ClawHub lưu trữ.
- Mỗi skill bao gồm `_export_skill_meta.json`.
- `_manifest.json` luôn được bao gồm ở gốc ZIP.
- `_errors.json` được bao gồm khi từng skill hoặc tệp không thể được
  xuất.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Xuất hàng loạt các bản phát hành Plugin công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Yêu cầu mã thông báo API.

Tham số truy vấn:

- `startDate` (bắt buộc): cận dưới theo mili giây Unix cho `updatedAt` của Plugin.
- `endDate` (bắt buộc): cận trên theo mili giây Unix cho `updatedAt` của Plugin.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước đó.
- `family` (tùy chọn): `code-plugin` hoặc `bundle-plugin`. Bỏ qua nghĩa là cả hai
  họ Plugin.

Phản hồi:

- Nội dung: kho lưu trữ ZIP.
- Mỗi Plugin được xuất có gốc tại `{family}/{packageName}/`.
- Mỗi Plugin được xuất bao gồm các tệp đã lưu của bản phát hành mới nhất.
- Siêu dữ liệu xuất theo từng Plugin được lưu tại
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` luôn được bao gồm ở gốc ZIP.
- `_errors.json` được bao gồm khi không thể xuất từng Plugin hoặc tệp riêng lẻ.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Tìm kiếm chỉ Plugin trên các gói code-plugin và bundle-plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1-100)
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `category` (tùy chọn): bộ lọc danh mục Plugin. Các giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Ghi chú:

- Các bí danh bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins` cũng được
  chấp nhận.
- Lọc danh mục là một bộ lọc API thực sự, được hỗ trợ bởi các hàng tóm tắt danh mục Plugin,
  không phải là thao tác viết lại truy vấn tìm kiếm.
- Kết quả được trả về theo thứ tự mức độ liên quan và hiện không phân trang.
- Các điều khiển sắp xếp giao diện trình duyệt cho tìm kiếm Plugin sắp xếp lại các kết quả liên quan đã tải,
  khớp với hành vi duyệt `/skills` hiện tại.

### `GET /api/v1/packages/{name}`

Trả về siêu dữ liệu chi tiết của gói.

Ghi chú:

- Skills cũng có thể phân giải qua tuyến này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà xuất bản sở hữu.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả bản phát hành.

Ghi chú:

- Yêu cầu mã thông báo API của chủ sở hữu gói, chủ sở hữu/quản trị viên nhà xuất bản tổ chức,
  điều phối viên nền tảng hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Ghi chú:

- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà xuất bản sở hữu.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm siêu dữ liệu tệp, khả năng tương thích,
xác minh, siêu dữ liệu hiện vật và dữ liệu quét.

Ghi chú:

- `version.artifact.kind` là `legacy-zip` cho kho lưu trữ gói kiểu cũ hoặc
  `npm-pack` cho các bản phát hành dựa trên ClawPack.
- Bản phát hành ClawPack bao gồm các trường tương thích npm `npmIntegrity`, `npmShasum` và
  `npmTarballName`.
- `version.sha256hash` là siêu dữ liệu tương thích đã lỗi thời dành cho máy khách cũ. Nó
  băm đúng các byte ZIP được trả về bởi `/api/v1/packages/{name}/download`.
  Máy khách hiện đại nên dùng `version.artifact.sha256`, trường này định danh
  hiện vật phát hành chuẩn tắc.
- `version.vtAnalysis`, `version.llmAnalysis` và `version.staticScan` được
  bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà xuất bản sở hữu.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Trả về bản tóm tắt bảo mật và độ tin cậy chính xác của bản phát hành gói cho
máy khách cài đặt. Đây là bề mặt tiêu thụ công khai của OpenClaw để quyết định liệu
một bản phát hành đã phân giải có thể được cài đặt hay không.

Xác thực:

- Điểm cuối đọc công khai. Không yêu cầu mã thông báo của chủ sở hữu, nhà xuất bản, điều phối viên hoặc quản trị viên.

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

- `package.name`, `package.displayName` và `package.family` định danh
  gói registry đã phân giải.
- `release.releaseId`, `release.version` và `release.createdAt` định danh
  bản phát hành chính xác đã được đánh giá.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` và `release.npmTarballName` có mặt khi biết được
  hiện vật phát hành.
- `trust.scanStatus` là trạng thái tin cậy hiệu lực được suy ra từ dữ liệu đầu vào của trình quét
  và điều phối bản phát hành thủ công.
- `trust.moderationState` có thể null. Nó là `null` khi không có điều phối bản phát hành
  thủ công.
- `trust.blockedFromDownload` là tín hiệu chặn cài đặt. OpenClaw và các máy khách
  cài đặt khác nên chặn cài đặt khi giá trị này là `true` thay vì
  tự suy lại quy tắc chặn từ các trường trình quét hoặc điều phối.
- `trust.reasons` là danh sách giải thích dành cho người dùng và kiểm toán. Mã lý do
  là các chuỗi ổn định, ngắn gọn như `manual:quarantined`, `scan:malicious`,
  và `package:malicious`.
- `trust.pending` nghĩa là một hoặc nhiều dữ liệu đầu vào về độ tin cậy vẫn đang chờ hoàn tất.
- `trust.stale` nghĩa là bản tóm tắt độ tin cậy được tính từ dữ liệu đầu vào đã lỗi thời và
  nên được xem là cần làm mới trước khi đưa ra quyết định cho phép có độ tin cậy cao.

Ghi chú:

- Điểm cuối này khớp chính xác theo phiên bản. Máy khách nên gọi nó sau khi phân giải
  phiên bản gói mà họ định cài đặt, không chỉ sau khi đọc siêu dữ liệu gói
  mới nhất.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà xuất bản sở hữu.
- Điểm cuối này cố ý hẹp hơn các điểm cuối điều phối của chủ sở hữu/điều phối viên.
  Nó phơi bày quyết định cài đặt và giải thích công khai, không phơi bày
  danh tính người báo cáo, nội dung báo cáo, bằng chứng riêng tư hoặc mốc thời gian
  đánh giá nội bộ.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về siêu dữ liệu trình phân giải hiện vật rõ ràng cho một phiên bản gói.

Ghi chú:

- Các phiên bản gói cũ trả về hiện vật `legacy-zip` và `downloadUrl` ZIP
  cũ.
- Các phiên bản ClawPack trả về hiện vật `npm-pack`, các trường toàn vẹn npm, một
  `tarballUrl` và URL tương thích ZIP cũ.
- Đây là bề mặt trình phân giải của OpenClaw; nó tránh việc đoán định dạng kho lưu trữ từ
  một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống hiện vật phiên bản qua đường dẫn trình phân giải rõ ràng.

Ghi chú:

- Các phiên bản ClawPack truyền trực tiếp đúng các byte `.tgz` npm-pack đã tải lên.
- Các phiên bản ZIP cũ chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng nhóm giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về trạng thái sẵn sàng đã tính toán cho việc OpenClaw tiêu thụ trong tương lai.

Các kiểm tra trạng thái sẵn sàng bao gồm:

- trạng thái kênh chính thức
- khả dụng của phiên bản mới nhất
- khả dụng của hiện vật ClawPack npm-pack
- tóm tắt hiện vật
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

Điểm cuối dành cho điều phối viên để liệt kê các hàng di chuyển Plugin OpenClaw chính thức.

Xác thực:

- Yêu cầu mã thông báo API của người dùng điều phối viên hoặc quản trị viên.

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

Điểm cuối dành cho quản trị viên để tạo hoặc cập nhật một hàng di chuyển Plugin chính thức.

Xác thực:

- Yêu cầu mã thông báo API của người dùng quản trị viên.

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
- `packageName` được chuẩn hóa theo tên npm; gói có thể bị thiếu đối với các di chuyển
  đã lên kế hoạch.
- Nội dung này chỉ theo dõi trạng thái sẵn sàng di chuyển. Nó không thay đổi OpenClaw hoặc tạo
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Điểm cuối dành cho điều phối viên/quản trị viên cho hàng đợi đánh giá bản phát hành gói.

Xác thực:

- Yêu cầu mã thông báo API của người dùng điều phối viên hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `blocked`, `manual`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Ý nghĩa trạng thái:

- `open`: các bản phát hành đáng ngờ, độc hại, đang chờ, bị cách ly, bị thu hồi hoặc đã được báo cáo.
- `blocked`: các bản phát hành bị cách ly, bị thu hồi hoặc độc hại.
- `manual`: bất kỳ bản phát hành nào có ghi đè điều phối thủ công.
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

Báo cáo một gói để điều phối viên đánh giá. Báo cáo ở cấp gói, tùy chọn
liên kết với một phiên bản. Chúng đưa dữ liệu vào hàng đợi điều phối nhưng tự bản thân không tự động ẩn hoặc
chặn tải xuống; điều phối viên nên dùng điều phối bản phát hành để
phê duyệt, cách ly hoặc thu hồi hiện vật.

Xác thực:

- Yêu cầu mã thông báo API.

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

Endpoint dành cho moderator/admin để tiếp nhận báo cáo gói.

Xác thực:

- Yêu cầu token API cho người dùng là moderator hoặc admin.

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

Endpoint dành cho chủ sở hữu/moderator để xem trạng thái kiểm duyệt gói.

Xác thực:

- Yêu cầu token API cho chủ sở hữu gói, thành viên nhà xuất bản, moderator, hoặc
  người dùng admin.

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

Endpoint dành cho moderator/admin để giải quyết hoặc mở lại báo cáo gói.

Yêu cầu:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` là bắt buộc với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "quarantine"` hoặc
`finalAction: "revoke"` cùng một báo cáo đã xác nhận để áp dụng kiểm duyệt bản phát hành trong
cùng quy trình có thể kiểm toán.

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

Endpoint dành cho moderator/admin để đánh giá bản phát hành gói.

Yêu cầu:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Các trạng thái được hỗ trợ:

- `approved`: đã được đánh giá thủ công và được phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các route tải xuống artifact.
Mọi thay đổi đều ghi một mục nhật ký kiểm toán.

### `GET /api/v1/packages/{name}/file`

Trả về nội dung văn bản thô cho một tệp gói.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định dùng bản phát hành mới nhất.
- Sử dụng bucket giới hạn tốc độ đọc, không phải bucket tải xuống.
- Tệp nhị phân trả về `415`.
- Giới hạn kích thước tệp: 200KB.
- Các lượt quét VirusTotal đang chờ không chặn lượt đọc; các bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà xuất bản sở hữu gói đó.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định kiểu cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (tùy chọn)
- `tag` (tùy chọn)

Ghi chú:

- Mặc định dùng bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Kho lưu trữ Plugin/gói là tệp zip có gốc `package/` để các client OpenClaw cũ
  tiếp tục hoạt động.
- Route này chỉ duy trì ZIP. Nó không stream các tệp ClawPack `.tgz`.
- Phản hồi bao gồm các header `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, và
  `X-ClawHub-Artifact-Sha256` để kiểm tra tính toàn vẹn của resolver.
- Siêu dữ liệu chỉ dành cho registry không được chèn vào kho lưu trữ đã tải xuống.
- Các lượt quét VirusTotal đang chờ không chặn tải xuống; các bản phát hành độc hại trả về `403`.
- Gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về packument tương thích npm cho các phiên bản gói dựa trên ClawPack.

Ghi chú:

- Chỉ liệt kê các phiên bản có tarball npm-pack ClawPack đã tải lên.
- Các phiên bản cũ chỉ có ZIP được chủ ý bỏ qua.
- `dist.tarball`, `dist.integrity`, và `dist.shasum` sử dụng các trường tương thích npm
  để người dùng có thể trỏ npm tới mirror nếu muốn.
- Packument của gói có scope hỗ trợ cả `/api/npm/@scope/name` và đường dẫn yêu cầu
  đã mã hóa `/api/npm/@scope%2Fname` của npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Stream đúng các byte tarball ClawPack đã tải lên cho client mirror npm.

Ghi chú:

- Sử dụng bucket giới hạn tốc độ tải xuống.
- Header tải xuống bao gồm SHA-256 của ClawHub cộng với siêu dữ liệu integrity/shasum của npm.
- Kiểm tra kiểm duyệt và quyền truy cập gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI dùng để ánh xạ fingerprint cục bộ sang một phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 hex 64 ký tự của fingerprint bundle

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống ZIP phiên bản skill được lưu trữ, hoặc trả về một bàn giao nguồn GitHub cho một
skill hiện tại dựa trên GitHub có lượt quét `clean` hoặc `suspicious` và không có phiên bản
được lưu trữ.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên tag (ví dụ `latest`)

Ghi chú:

- Nếu không cung cấp `version` hoặc `tag`, phiên bản mới nhất sẽ được dùng.
- Các phiên bản đã bị xóa mềm trả về `410`.
- Bàn giao skill dựa trên GitHub không proxy hoặc mirror byte. Phản hồi JSON
  bao gồm `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  và `archiveUrl`; trạng thái quét/hiện tại là một cổng kiểm soát và không được bao gồm làm siêu dữ liệu
  payload thành công.
- Thống kê tải xuống được tính theo danh tính duy nhất mỗi ngày UTC (`userId` khi token API hợp lệ, nếu không thì IP).

## Endpoint xác thực (token Bearer)

Tất cả endpoint yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực token và trả về handle người dùng.

### `POST /api/v1/skills`

Xuất bản phiên bản mới.

- Ưu tiên: `multipart/form-data` với JSON `payload` + blob `files[]`.
- Body JSON với `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có, API sẽ phân giải nhà xuất bản đó
  ở phía máy chủ và yêu cầu tác nhân có quyền truy cập nhà xuất bản.
- Trường payload tùy chọn: `migrateOwner`. Khi là `true` cùng `ownerHandle`, một
  skill hiện có có thể chuyển sang chủ sở hữu đó nếu tác nhân là admin/chủ sở hữu trên cả
  nhà xuất bản hiện tại và nhà xuất bản đích. Nếu không chọn rõ tùy chọn này, thay đổi chủ sở hữu
  sẽ bị từ chối.

### `POST /api/v1/packages`

Xuất bản bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng token Bearer.
- Yêu cầu `multipart/form-data`.
- Các trường form được phép là `payload`, blob `files` lặp lại, hoặc một tham chiếu tarball `clawpack`.
  `clawpack` có thể là blob `.tgz` hoặc id lưu trữ được trả về bởi
  luồng upload-url. Các lượt xuất bản storage-id đã stage cũng phải bao gồm
  `clawpackUploadTicket` được trả về cùng URL tải lên đó.
- Dùng `files` hoặc `clawpack`, không bao giờ dùng cả hai trong cùng một yêu cầu.
- Body JSON và siêu dữ liệu `payload.files` / `payload.artifact` do bên gọi cung cấp
  đều bị từ chối.
- Yêu cầu xuất bản multipart trực tiếp bị giới hạn ở 18MB. Tarball ClawPack có thể
  dùng luồng upload-url lên tới giới hạn tarball 120MB.
- Trường payload tùy chọn: `ownerHandle`. Khi có, chỉ admin mới có thể xuất bản thay mặt chủ sở hữu đó.

Các điểm chính về xác thực dữ liệu:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Gói Plugin yêu cầu `openclaw.plugin.json`. Tải lên ClawPack `.tgz` phải
  chứa tệp đó tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, siêu dữ liệu repo nguồn, siêu dữ liệu commit nguồn,
  siêu dữ liệu schema cấu hình, `openclaw.compat.pluginApi`, và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
- Chỉ nhà xuất bản tổ chức `openclaw` và nhà xuất bản cá nhân của các thành viên hiện tại thuộc tổ chức `openclaw`
  mới có thể xuất bản lên kênh `official`.
- Lượt xuất bản thay mặt vẫn xác thực điều kiện kênh official theo tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, moderator, hoặc admin).

Body JSON tùy chọn:

```json
{ "reason": "Held for moderation pending legal review." }
```

Khi có, `reason` được lưu làm ghi chú kiểm duyệt skill và được sao chép vào nhật ký kiểm toán.
Các lượt xóa mềm do chủ sở hữu khởi tạo giữ trước slug trong 30 ngày, sau đó slug có thể được
một nhà xuất bản khác xác nhận. Phản hồi xóa bao gồm `slugReservedUntil` khi thời hạn này được áp dụng.
Việc ẩn bởi moderator/admin và gỡ bỏ vì bảo mật không hết hạn theo cách này.

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

Chỉ dành cho admin. Đảm bảo tồn tại một nhà xuất bản tổ chức cho một handle. Nếu handle vẫn trỏ tới một
người dùng dùng chung/nhà xuất bản cá nhân kiểu cũ, endpoint sẽ di chuyển nó thành nhà xuất bản tổ chức trước.
Với tổ chức mới tạo, cung cấp `memberHandle`; admin đang thực hiện không được thêm làm thành viên.
`memberRole` mặc định là `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Tạo nhà xuất bản tổ chức tự phục vụ có xác thực. Tạo một nhà xuất bản tổ chức mới và thêm
bên gọi làm chủ sở hữu. Endpoint này không di chuyển các handle người dùng/cá nhân hiện có và
không đánh dấu nhà xuất bản là trusted/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Trả về `409` khi handle đã được dùng bởi một nhà xuất bản, người dùng, hoặc nhà xuất bản cá nhân.

### `POST /api/v1/users/reserve`

Chỉ dành cho admin. Giữ trước slug gốc và tên gói cho chủ sở hữu hợp pháp mà không xuất bản
bản phát hành. Tên gói trở thành gói placeholder riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu có thể xuất bản bản phát hành code-plugin hoặc bundle-plugin thật vào tên đó sau này.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Phản hồi: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Chỉ dành cho admin. Khôi phục một nhà xuất bản cá nhân cho principal GitHub OAuth thay thế đã được xác minh
mà không chỉnh sửa các hàng tài khoản Convex Auth. Yêu cầu phải nêu cả hai id tài khoản
provider GitHub bất biến; các handle có thể thay đổi chỉ được dùng làm chốt kiểm tra hướng tới operator.

Endpoint mặc định ở chế độ chạy thử. Việc áp dụng khôi phục yêu cầu `dryRun: false` và
`confirmIdentityVerified: true` sau khi nhân viên xác minh độc lập tính liên tục giữa cả hai
GitHub principal. Khôi phục sẽ thất bại theo hướng đóng an toàn khi publisher cá nhân hiện tại
của người dùng đích có skills, packages hoặc nguồn GitHub skill.
Khôi phục cũng di chuyển các trường `ownerUserId` cũ cho skills của publisher được khôi phục,
bí danh slug skill, packages, cảnh báo trình kiểm tra package và các hàng digest tìm kiếm dẫn xuất để
các đường dẫn chủ sở hữu trực tiếp khớp với thẩm quyền publisher mới. Một đặt chỗ protected-handle
đang hoạt động cho handle được khôi phục cũng được gán lại cho người dùng thay thế để lần
đồng bộ hóa hồ sơ sau đó không thể khôi phục thẩm quyền cạnh tranh của người dùng trước đó. Mỗi bảng chính được giới hạn ở
100 hàng cho mỗi giao dịch áp dụng; các khôi phục lớn hơn trước tiên phải dùng một quá trình di chuyển chủ sở hữu có thể tiếp tục.
Các nguồn GitHub skill nằm trong phạm vi publisher và được báo cáo là đã kiểm tra thay vì được ghi lại.

- Thân yêu cầu: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Phản hồi: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoint quản lý slug của chủ sở hữu

- `POST /api/v1/skills/{slug}/rename`
  - Thân yêu cầu: `{ "newSlug": "new-canonical-slug" }`
  - Phản hồi: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Thân yêu cầu: `{ "targetSlug": "canonical-target-slug" }`
  - Phản hồi: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Ghi chú:

- Cả hai endpoint đều yêu cầu xác thực bằng API token và chỉ hoạt động cho chủ sở hữu skill.
- `rename` giữ slug trước đó làm bí danh chuyển hướng.
- `merge` ẩn mục liệt kê nguồn và chuyển hướng slug nguồn đến mục liệt kê đích.

### Endpoint chuyển quyền sở hữu

- `POST /api/v1/skills/{slug}/transfer`
  - Thân yêu cầu: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Phản hồi: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Phản hồi (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Dạng phản hồi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Cấm một người dùng và xóa vĩnh viễn skills thuộc sở hữu của họ (chỉ moderator/admin).

Thân yêu cầu:

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

Bỏ cấm một người dùng và khôi phục skills đủ điều kiện (chỉ admin).

Thân yêu cầu:

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

### `POST /api/v1/users/reclassify-ban`

Thay đổi lý do đã lưu cho một lệnh cấm hiện có mà không bỏ cấm hoặc khôi phục
nội dung (chỉ admin). Mặc định ở chế độ chạy thử trừ khi `dryRun` là `false`.

Thân yêu cầu:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

hoặc

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Phản hồi:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Thay đổi vai trò người dùng (chỉ admin).

Thân yêu cầu:

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

Thêm/xóa một sao (đánh dấu nổi bật). Cả hai endpoint đều có tính idempotent.

Phản hồi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI cũ (không còn khuyến nghị)

Vẫn được hỗ trợ cho các phiên bản CLI cũ hơn:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch gỡ bỏ.

`POST /api/cli/upload-url` trả về `uploadUrl` và `uploadTicket`. Các lượt publish package
chuẩn bị một tarball ClawPack phải gửi id lưu trữ kết quả dưới dạng
`clawpack` và ticket được trả về dưới dạng `clawpackUploadTicket`.

## Khám phá registry (`/.well-known/clawhub.json`)

CLI có thể khám phá thiết lập registry/auth từ trang web:

- `/.well-known/clawhub.json` (JSON, ưu tiên)
- `/.well-known/clawdhub.json` (cũ)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu bạn tự host, hãy phục vụ tệp này (hoặc đặt `CLAWHUB_REGISTRY` rõ ràng; `CLAWDHUB_REGISTRY` cũ).
