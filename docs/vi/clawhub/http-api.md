---
read_when:
    - Thêm/thay đổi endpoint
    - Gỡ lỗi các yêu cầu CLI ↔ registry
summary: Tài liệu tham chiếu API HTTP (các endpoint công khai + CLI + xác thực).
x-i18n:
    generated_at: "2026-07-21T13:39:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9b3e64cbb9dce522b3c112a8082a5df32eb118c1ce0c97a28d2c397d1cdfbe3
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 đều nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được duy trì để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục của bên thứ ba có thể sử dụng các endpoint đọc công khai để liệt kê hoặc tìm kiếm Skills trên ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng trở lại mục niêm yết chính thức trên ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`), và tránh ngụ ý rằng ClawHub chứng thực trang web của bên thứ ba. Không cố gắng sao chép nội dung bị ẩn, riêng tư hoặc bị kiểm duyệt chặn ra ngoài bề mặt API công khai.

Các lối tắt slug trên web được phân giải trên nhiều họ registry, nhưng client API nên sử dụng
các URL chính thức do endpoint đọc trả về thay vì tự dựng lại thứ tự
ưu tiên của route.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: thực thi theo từng IP.
- Yêu cầu đã xác thực (Bearer token hợp lệ): thực thi theo bucket của từng người dùng.
- Nếu token bị thiếu/không hợp lệ, hành vi sẽ chuyển về thực thi theo IP.
- Các endpoint ghi đã xác thực không nên chỉ trả về một `Unauthorized` trống khi
  máy chủ biết nguyên nhân. Token bị thiếu, token không hợp lệ/đã bị thu hồi và
  tài khoản đã bị xóa/cấm/vô hiệu hóa phải nhận được nội dung có thể xử lý tương ứng để client
  CLI có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 3000/phút trên mỗi IP, 12000/phút trên mỗi khóa
- Ghi: 300/phút trên mỗi IP, 3000/phút trên mỗi khóa
- Tải xuống: 1200/phút trên mỗi IP, 6000/phút trên mỗi khóa (các endpoint tải xuống)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Được chuẩn hóa: `RateLimit-Limit`, `RateLimit-Reset`
- Khi `429`: `X-RateLimit-Remaining: 0` và `RateLimit-Remaining: 0`
- Khi `429`: `Retry-After`

Ngữ nghĩa của header:

- `X-RateLimit-Reset`: số giây tuyệt đối tính từ Unix epoch
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: hạn mức còn lại chính xác khi có.
  Các yêu cầu phân mảnh thành công sẽ bỏ qua header này thay vì trả về giá trị toàn cục gần đúng.
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

Đã vượt quá giới hạn tốc độ
```

Hướng dẫn cho client:

- Nếu có `Retry-After`, hãy chờ số giây tương ứng trước khi thử lại.
- Sử dụng thời gian chờ tăng dần có độ dao động để tránh các lần thử lại đồng bộ.
- Nếu thiếu `Retry-After`, hãy chuyển sang `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Chỉ sử dụng các header IP client đáng tin cậy, bao gồm `cf-connecting-ip`, khi
  quá trình triển khai bật rõ ràng các header chuyển tiếp đáng tin cậy.
- ClawHub sử dụng các header chuyển tiếp đáng tin cậy để xác định IP client tại biên.
- Nếu không có IP client đáng tin cậy, các yêu cầu ẩn danh sử dụng các bucket dự phòng
  chỉ được phân phạm vi theo loại giới hạn tốc độ. Các bucket dự phòng này không bao gồm
  đường dẫn, slug, tên gói, phiên bản, chuỗi truy vấn hoặc các tham số
  tạo tác khác do bên gọi cung cấp.

## Phản hồi lỗi

Các phản hồi lỗi v1 công khai là văn bản thuần túy với `content-type: text/plain; charset=utf-8`.
Điều này bao gồm lỗi xác thực dữ liệu (`400`), tài nguyên công khai bị thiếu (`404`), lỗi xác thực và
quyền hạn (`401`/`403`), giới hạn tốc độ (`429`) và lượt tải xuống bị chặn. Client
nên đọc nội dung phản hồi dưới dạng chuỗi mà con người có thể đọc được. Các tham số truy vấn không xác định được
bỏ qua để đảm bảo tương thích, nhưng các tham số truy vấn đã được nhận diện có giá trị không hợp lệ sẽ trả về
`400`.

## Endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (không bắt buộc): số nguyên
- `highlightedOnly` (không bắt buộc): `true` để lọc chỉ lấy các Skills nổi bật
- `nonSuspiciousOnly` (không bắt buộc): `true` để ẩn các Skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (không bắt buộc): bí danh cũ của `nonSuspiciousOnly`

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

- Kết quả được trả về theo thứ tự liên quan (độ tương đồng embedding + mức tăng cho token slug/tên khớp chính xác + một trọng số ưu tiên nhỏ về mức độ phổ biến).
- Độ liên quan có trọng số cao hơn mức độ phổ biến. Một slug hoặc token tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn nhưng có mức tương tác cao hơn nhiều.
- Văn bản ASCII được tách thành token tại ranh giới từ và dấu câu. Ví dụ: `personal-map` chứa một token `map` độc lập, còn `amap-jsapi-skill` chứa `amap`, `jsapi` và `skill`; vì vậy, tìm kiếm `map` giúp `personal-map` có mức khớp từ vựng cao hơn `amap-jsapi-skill`.
- Mức độ phổ biến được chia tỷ lệ logarit và giới hạn. Các Skills có mức tương tác cao có thể xếp thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc bị ẩn có thể loại một Skill khỏi tìm kiếm công khai tùy theo bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn để nhà phát hành dễ được tìm thấy:

- Đặt các thuật ngữ mà người dùng sẽ thực sự tìm kiếm vào tên hiển thị, phần tóm tắt và thẻ. Chỉ sử dụng một token slug độc lập khi đó cũng là danh tính ổn định mà bạn muốn duy trì.
- Không đổi tên slug chỉ để nhắm đến một truy vấn, trừ khi slug mới là tên chính thức dài hạn tốt hơn. Slug cũ trở thành bí danh chuyển hướng, nhưng URL chính thức, slug hiển thị và bản tổng hợp tìm kiếm trong tương lai sử dụng slug mới.
- Bí danh đổi tên duy trì khả năng phân giải cho các URL cũ và lượt cài đặt được phân giải thông qua registry, nhưng thứ hạng tìm kiếm dựa trên siêu dữ liệu chính thức của Skill sau khi việc đổi tên được lập chỉ mục. Số liệu thống kê hiện có vẫn gắn với Skill.
- Nếu một Skill đột nhiên không hiển thị, trước tiên hãy kiểm tra trạng thái kiểm duyệt bằng `clawhub inspect @owner/slug` khi đã đăng nhập, rồi mới thay đổi siêu dữ liệu liên quan đến xếp hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên (1–200)
- `cursor` (không bắt buộc): con trỏ phân trang cho mọi kiểu sắp xếp không phải `trending`
- `sort` (không bắt buộc): `updated` (mặc định), `recommended` (bí danh: `default`), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), các bí danh cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ đến `downloads`, `trending`
- `nonSuspiciousOnly` (không bắt buộc): `true` để ẩn các Skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (không bắt buộc): bí danh cũ của `nonSuspiciousOnly`

Các giá trị `sort` không hợp lệ trả về `400`.

Ghi chú:

- `recommended` sử dụng các tín hiệu tương tác và mức độ gần đây.
- `trending` xếp hạng theo lượt cài đặt trong 7 ngày gần nhất (dựa trên dữ liệu đo từ xa).
- `createdAt` ổn định cho việc thu thập dữ liệu Skill mới; `updated` thay đổi khi các Skills hiện có được phát hành lại.
- Khi `nonSuspiciousOnly=true`, các kiểu sắp xếp dựa trên con trỏ có thể trả về ít hơn `limit` mục trên một trang vì các Skills đáng ngờ được lọc sau khi truy xuất trang.
- Sử dụng `nextCursor` để tiếp tục phân trang khi có. Một trang ngắn tự nó không có nghĩa là đã hết kết quả.

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

- Các slug cũ được tạo bởi luồng đổi tên/hợp nhất của chủ sở hữu sẽ phân giải đến Skill chính thức.
- `metadata.os`: các hạn chế về hệ điều hành được khai báo trong frontmatter của Skill (ví dụ: `["macos"]`, `["linux"]`). `null` nếu không được khai báo.
- `metadata.systems`: các hệ thống đích của Nix (ví dụ: `["aarch64-darwin", "x86_64-linux"]`). `null` nếu không được khai báo.
- `metadata` là `null` nếu Skill không có siêu dữ liệu nền tảng.
- `moderation` chỉ được bao gồm khi Skill bị gắn cờ hoặc chủ sở hữu đang xem Skill đó.

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
    "summary": "Đã phát hiện: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Đã phát hiện thực thi mã động.",
        "evidence": ""
      }
    ]
  }
}
```

Ghi chú:

- Chủ sở hữu và người kiểm duyệt có thể truy cập chi tiết kiểm duyệt của các Skills bị ẩn.
- Bên gọi công khai chỉ nhận được `200` cho các Skills hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập đối với bên gọi công khai và chỉ bao gồm các đoạn mã thô đối với chủ sở hữu/người kiểm duyệt.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một Skill để người kiểm duyệt xem xét. Báo cáo áp dụng ở cấp Skill, có thể được liên kết
với một phiên bản và được đưa vào hàng đợi báo cáo Skill.

Xác thực:

- Yêu cầu token API.

Yêu cầu:

```json
{ "reason": "Bước cài đặt đáng ngờ", "version": "1.2.3" }
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

Endpoint dành cho người kiểm duyệt/quản trị viên để tiếp nhận báo cáo Skill.

Tham số truy vấn:

- `status` (không bắt buộc): `open` (mặc định), `confirmed`, `dismissed` hoặc `all`
- `limit` (không bắt buộc): số nguyên (1-200)
- `cursor` (không bắt buộc): con trỏ phân trang

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
      "reason": "Bước cài đặt đáng ngờ",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Người báo cáo"
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

Điểm cuối dành cho điều hành viên/quản trị viên để xử lý hoặc mở lại báo cáo về skill.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Đã xem xét và ẩn phiên bản bị ảnh hưởng.", "finalAction": "hide" }
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "hide"` cùng một báo cáo đã được phân loại
để ẩn skill trong cùng một quy trình có thể kiểm tra.

### `GET /api/v1/skills/{slug}/versions`

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên
- `cursor` (không bắt buộc): con trỏ phân trang

### `GET /api/v1/skills/{slug}/versions/{version}`

Trả về siêu dữ liệu phiên bản + danh sách tệp.

- `version.security` bao gồm trạng thái xác minh quét đã chuẩn hóa và thông tin chi tiết về trình quét
  (VirusTotal + LLM), khi có.

### `GET /api/v1/skills/{slug}/scan`

Trả về thông tin chi tiết về xác minh quét bảo mật cho một phiên bản skill.

Tham số truy vấn:

- `version` (không bắt buộc): chuỗi phiên bản cụ thể.
- `tag` (không bắt buộc): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Lưu ý:

- Nếu không cung cấp cả `version` lẫn `tag`, sử dụng phiên bản mới nhất.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng thông tin chi tiết dành riêng cho từng trình quét.
- `security.hasScanResult` chỉ là `true` khi một trình quét đưa ra phán quyết xác định (`clean`, `suspicious` hoặc `malicious`).
- `moderation` là ảnh chụp nhanh trạng thái kiểm duyệt hiện tại ở cấp skill, được suy ra từ phiên bản mới nhất.
- Khi truy vấn một phiên bản lịch sử, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi coi `moderation` và `security` là cùng một ngữ cảnh phiên bản.

### `POST /api/v1/skills/-/scan`

Điểm cuối gửi có xác thực dành cho các tác vụ ClawScan mới.

Quét nội dung tải lên cục bộ không còn được hỗ trợ. Các yêu cầu sử dụng
`multipart/form-data` hoặc `{ "source": { "kind": "upload" } }` trả về `410`.

Quét nội dung đã xuất bản sử dụng JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Lưu ý:

- Tải trọng yêu cầu quét và các báo cáo có thể tải xuống sẽ hết hạn khỏi kho yêu cầu quét sau khoảng thời gian lưu giữ.
- Quét nội dung đã xuất bản yêu cầu quyền quản lý của chủ sở hữu/nhà xuất bản hoặc thẩm quyền điều hành viên/quản trị viên nền tảng.
- Quét nội dung đã xuất bản chỉ ghi ngược khi `update: true` và quá trình quét hoàn tất thành công.
- Phản hồi là `202` với `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Các tác vụ quét hoạt động bất đồng bộ. Yêu cầu quét thủ công được ưu tiên trước công việc xuất bản/điền bù thông thường, nhưng việc hoàn tất vẫn phụ thuộc vào tình trạng sẵn sàng của worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Điểm cuối thăm dò có xác thực dành cho một lượt quét đã gửi.

- Trả về trạng thái đang xếp hàng/đang chạy/thành công/thất bại.
- Trả về `queue.queuedAhead` và `queue.position` trong khi đang xếp hàng để máy khách có thể hiển thị số lượt quét thủ công được ưu tiên đang đứng trước yêu cầu. Hàng đợi rất lớn được giới hạn và báo cáo bằng `queuedAheadIsEstimate: true`.
- Khi có, `report` chứa các phần `clawscan`, `skillspector`, `staticAnalysis` và `virustotal`.
- Các tác vụ quét thất bại trả về `status: "failed"` với `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Điểm cuối kho lưu trữ báo cáo có xác thực.

- Yêu cầu một lượt quét thành công; các lượt quét chưa ở trạng thái kết thúc trả về `409`.
- Trả về một tệp ZIP chứa `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Điểm cuối kho lưu trữ báo cáo đã lưu có xác thực dành cho các phiên bản đã gửi.

- Yêu cầu quyền quản lý của chủ sở hữu/nhà xuất bản đối với skill hoặc plugin, hoặc thẩm quyền điều hành viên/quản trị viên nền tảng.
- Trả về kết quả quét đã lưu cho đúng phiên bản đã gửi, bao gồm các phiên bản bị chặn hoặc bị ẩn.
- `kind` mặc định là `skill`; sử dụng `kind=plugin` cho lượt quét plugin/gói.
- Trả về cùng cấu trúc ZIP như nội dung tải xuống của yêu cầu quét.

### `POST /api/v1/skills/-/scan/batch`

Tuyến quét lại hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Tuyến này chấp nhận cùng cấu trúc tải trọng như `POST /api/v1/skills/-/rescan-batch` cũ.

### `POST /api/v1/skills/-/scan/batch/status`

Tuyến trạng thái hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Tuyến này chấp nhận `{ "jobIds": ["..."] }` và trả về cùng các bộ đếm tổng hợp như `POST /api/v1/skills/-/rescan-batch/status` cũ.

### `GET /api/v1/skills/{slug}/verify`

Trả về phong bì xác minh Thẻ Skill được `clawhub skill verify` sử dụng.

Tham số truy vấn:

- `version` (không bắt buộc): chuỗi phiên bản cụ thể.
- `tag` (không bắt buộc): phân giải một phiên bản được gắn thẻ (ví dụ `latest`).

Lưu ý:

- `ok` chỉ là `true` khi phiên bản được chọn có Thẻ Skill đã được tạo, không bị kiểm duyệt chặn do phần mềm độc hại và kết quả xác minh ClawScan là sạch.
- Danh tính skill, danh tính nhà xuất bản và siêu dữ liệu phiên bản được chọn là các trường cấp cao nhất của phong bì (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) để công cụ tự động hóa shell có thể đọc chúng mà không cần giải nén các trình bao bọc lồng nhau.
- `security` là phán quyết ClawScan/bảo mật cấp cao nhất. Công cụ tự động hóa nên dựa vào `ok`, `decision`, `reasons` và `security.status`.
- `security.signals` chứa bằng chứng hỗ trợ từ trình quét như `staticScan`, `virusTotal` và `skillSpector`.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét kiểm tra sự tồn tại của registry phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- `provenance` chỉ là `server-resolved-github-import` khi ClawHub đã phân giải và lưu repo/ref/commit/đường dẫn GitHub trong quá trình xuất bản hoặc nhập; nếu không, giá trị là `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Trả về các phán quyết bảo mật cô đọng hiện tại cho chính xác các phiên bản skill. Điểm cuối
bộ sưu tập này dành cho các máy khách đã biết những phiên bản skill
ClawHub nào đã cài đặt mà chúng cần hiển thị, chẳng hạn như giao diện điều khiển OpenClaw.

Yêu cầu:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Lưu ý:

- `items` phải chứa 1-100 cặp `{ slug, version }` duy nhất.
- Kết quả được trả về theo từng mục; một skill hoặc phiên bản bị thiếu không làm toàn bộ phản hồi thất bại.
- Phản hồi chỉ chứa dữ liệu bảo mật. Phản hồi không bao gồm dữ liệu Thẻ Skill, trạng thái thẻ đã tạo, danh sách tệp tạo tác hoặc tải trọng chi tiết của trình quét.
- `security.signals` chỉ chứa bằng chứng hỗ trợ ở cấp trạng thái; sử dụng `/scan` hoặc trang kiểm tra bảo mật ClawHub để xem đầy đủ thông tin chi tiết của trình quét.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét kiểm tra sự tồn tại của registry phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- Việc không có Thẻ Skill không ảnh hưởng đến `ok`, `decision` hoặc `reasons` của điểm cuối này; máy khách nên đọc `skill-card.md` đã cài đặt ở cục bộ khi cần nội dung thẻ.
- Sử dụng `/verify` khi cần phong bì xác minh Thẻ Skill cho một skill, `/card` khi cần Markdown của thẻ đã tạo và `/scan` khi cần dữ liệu chi tiết của trình quét.

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
      "error": { "code": "version_not_found", "message": "Không tìm thấy phiên bản" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Trả về chính xác các byte của tệp đã lưu dưới dạng nội dung tải xuống. Thêm `preview=1` để yêu cầu bản xem trước
văn bản được thoát và có giới hạn; mọi tệp có byte UTF-8 hợp lệ đều có thể được xem trước, bất kể phần mở rộng hoặc
siêu dữ liệu MIME của tệp.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (không bắt buộc)
- `tag` (không bắt buộc)
- `preview=1` (không bắt buộc; trả về `text/plain` hoặc `415` khi các byte không phải UTF-8 hợp lệ)

Lưu ý:

- Mặc định sử dụng phiên bản mới nhất.
- Giới hạn tải xuống thô: 10MB.
- Giới hạn xem trước văn bản: 200KB.

### `GET /api/v1/packages`

Điểm cuối danh mục hợp nhất dành cho:

- skill
- plugin mã
- plugin gói

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên (1–100)
- `cursor` (không bắt buộc): con trỏ phân trang
- `family` (không bắt buộc): `skill`, `code-plugin` hoặc `bundle-plugin`
- `channel` (không bắt buộc): `official`, `community` hoặc `private`
- `isOfficial` (không bắt buộc): `true` hoặc `false`
- `sort` (không bắt buộc): `updated` (mặc định), `recommended`, `trending`, `downloads`, bí danh cũ `installs`
- `category` (không bắt buộc): bộ lọc danh mục plugin. Chỉ được hỗ trợ khi
  yêu cầu được giới hạn trong các gói plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` hoặc các điểm cuối gói có
  `family=code-plugin`/`family=bundle-plugin`). Các danh mục được kiểm soát và
  bí danh bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` hoặc `sort` trả về `400`. Các tham số truy vấn không xác định bị bỏ qua.
- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh thuộc họ cố định.
- Các mục skill vẫn dựa trên registry skill và chỉ có thể được xuất bản thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành plugin mã và plugin gói.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể thấy các gói riêng tư của những nhà xuất bản mà họ thuộc về trong kết quả danh sách/tìm kiếm.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/packages/search`

Tìm kiếm danh mục hợp nhất trên các skill + gói plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1–100)
- `family` (tùy chọn): `skill`, `code-plugin`, hoặc `bundle-plugin`
- `channel` (tùy chọn): `official`, `community`, hoặc `private`
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `category` (tùy chọn): bộ lọc danh mục plugin. Chỉ được hỗ trợ khi
  yêu cầu có phạm vi giới hạn ở các gói plugin. Các danh mục được kiểm soát và bí danh
  bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`, hoặc
  `highlightedOnly` trả về `400`. Các tham số truy vấn không xác định bị bỏ qua.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể tìm kiếm các gói riêng tư của những nhà phát hành mà họ thuộc về.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/plugins`

Duyệt danh mục chỉ dành cho plugin trên các gói code-plugin và bundle-plugin.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `sort` (tùy chọn): `recommended` (mặc định), `trending`, `downloads`, `updated`, bí danh cũ `installs`
- `category` (tùy chọn): bộ lọc danh mục plugin. Các giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Các bí danh bộ lọc v1 cũ vẫn được chấp nhận trên các endpoint đọc:

- `mcp-tooling`, `data`, và `automation` phân giải thành `tools`.
- `observability` và `deployment` phân giải thành `gateway`.
- `dev-tools` phân giải thành `runtime`.

`trending` là bảng xếp hạng lượt cài đặt/tải xuống trong bảy ngày và không sử dụng tổng số toàn thời gian.
Trên endpoint `/api/v1/packages` hợp nhất, endpoint này chỉ dành cho plugin; hãy dùng
`/api/v1/skills?sort=trending` cho danh mục skill.

Các bí danh cũ không được chấp nhận làm giá trị danh mục được lưu trữ hoặc do tác giả khai báo.

### `GET /api/v1/skills/export`

Xuất hàng loạt các skill công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Bắt buộc có token API.

Tham số truy vấn:

- `startDate` (bắt buộc): giới hạn dưới theo mili giây Unix cho `updatedAt` của skill.
- `endDate` (bắt buộc): giới hạn trên theo mili giây Unix cho `updatedAt` của skill.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước.

Phản hồi:

- Nội dung: tệp lưu trữ ZIP.
- Mỗi skill được xuất có thư mục gốc tại `{publisher}/{slug}/`.
- Các skill được lưu trữ bao gồm những tệp của phiên bản được lưu mới nhất và được liệt kê trong
  `_manifest.json` với `sourceRef: "public-clawhub"`.
- Các skill hiện tại dựa trên GitHub có lượt quét `clean` hoặc `suspicious` bao gồm
  `_source_handoff.json` với `sourceRef: "public-github"`, kho lưu trữ, commit, đường dẫn,
  hàm băm nội dung và URL tệp lưu trữ. Chúng không bao gồm các tệp nguồn do ClawHub lưu trữ.
- Mỗi skill bao gồm `_export_skill_meta.json`.
- `_manifest.json` luôn được bao gồm tại thư mục gốc của ZIP.
- `_errors.json` được bao gồm khi không thể xuất từng skill hoặc tệp
  riêng lẻ.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Xuất hàng loạt các bản phát hành plugin công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Bắt buộc có token API.

Tham số truy vấn:

- `startDate` (bắt buộc): giới hạn dưới theo mili giây Unix cho `updatedAt` của plugin.
- `endDate` (bắt buộc): giới hạn trên theo mili giây Unix cho `updatedAt` của plugin.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước.
- `family` (tùy chọn): `code-plugin` hoặc `bundle-plugin`. Nếu bỏ qua thì bao gồm cả hai
  họ plugin.

Phản hồi:

- Nội dung: tệp lưu trữ ZIP.
- Mỗi plugin được xuất có thư mục gốc tại `{family}/{packageName}/`.
- Mỗi plugin được xuất bao gồm các tệp được lưu của bản phát hành mới nhất.
- Siêu dữ liệu xuất của từng plugin được lưu tại
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` luôn được bao gồm tại thư mục gốc của ZIP.
- `_errors.json` được bao gồm khi không thể xuất từng plugin hoặc tệp
  riêng lẻ.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Tìm kiếm chỉ dành cho plugin trên các gói code-plugin và bundle-plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1-100)
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `category` (tùy chọn): bộ lọc danh mục plugin. Các giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Lưu ý:

- Các bí danh bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins` cũng
  được chấp nhận.
- Lọc theo danh mục là một bộ lọc API thực sự được hỗ trợ bởi các hàng digest danh mục
  plugin, không phải thao tác viết lại truy vấn tìm kiếm.
- Kết quả được trả về theo thứ tự liên quan và hiện không được phân trang.
- Các điều khiển sắp xếp trên giao diện trình duyệt dành cho tìm kiếm plugin sắp xếp lại các kết quả liên quan đã tải,
  phù hợp với hành vi duyệt `/skills` hiện tại.

### `GET /api/v1/packages/{name}`

Trả về siêu dữ liệu chi tiết của gói.

Lưu ý:

- Các skill cũng có thể được phân giải qua tuyến này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả các bản phát hành.

Lưu ý:

- Yêu cầu token API của chủ sở hữu gói, chủ sở hữu/quản trị viên nhà phát hành thuộc tổ chức,
  kiểm duyệt viên nền tảng hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Lưu ý:

- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm siêu dữ liệu tệp, khả năng tương thích,
xác minh, siêu dữ liệu artifact và dữ liệu quét.

Lưu ý:

- `version.artifact.kind` là `legacy-zip` đối với các tệp lưu trữ gói kiểu cũ hoặc
  `npm-pack` đối với các bản phát hành dựa trên ClawPack.
- Các bản phát hành ClawPack bao gồm các trường `npmIntegrity`, `npmShasum`, và
  `npmTarballName` tương thích với npm.
- `version.sha256hash` là siêu dữ liệu tương thích đã lỗi thời dành cho các client cũ. Nó
  băm chính xác các byte ZIP do `/api/v1/packages/{name}/download` trả về.
  Các client hiện đại nên dùng `version.artifact.sha256`, trường xác định
  artifact bản phát hành chuẩn.
- `version.vtAnalysis`, `version.llmAnalysis`, và `version.staticScan` được
  bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Trả về bản tóm tắt bảo mật và độ tin cậy chính xác của bản phát hành gói dành cho các client
cài đặt. Đây là bề mặt sử dụng công khai của OpenClaw để quyết định liệu một
bản phát hành đã phân giải có thể được cài đặt hay không.

Xác thực:

- Endpoint đọc công khai. Không yêu cầu token của chủ sở hữu, nhà phát hành, kiểm duyệt viên hoặc quản trị viên.

Phản hồi:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin mẫu",
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

Các trường phản hồi:

- `package.name`, `package.displayName`, và `package.family` xác định
  gói registry đã phân giải.
- `release.releaseId`, `release.version`, và `release.createdAt` xác định
  chính xác bản phát hành đã được đánh giá.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, và `release.npmTarballName` xuất hiện khi đã biết đối với
  artifact bản phát hành.
- `trust.scanStatus` là trạng thái tin cậy hiệu lực được suy ra từ đầu vào của trình quét
  và hoạt động kiểm duyệt bản phát hành thủ công.
- `trust.moderationState` có thể null. Giá trị là `null` khi không có hoạt động kiểm duyệt bản phát hành
  thủ công.
- `trust.blockedFromDownload` là tín hiệu chặn cài đặt. OpenClaw và các client
  cài đặt khác phải chặn cài đặt khi giá trị này là `true` thay vì
  tự suy lại các quy tắc chặn từ trường trình quét hoặc kiểm duyệt.
- `trust.reasons` là danh sách giải thích dành cho người dùng và kiểm toán. Các mã lý do
  là những chuỗi ổn định, ngắn gọn như `manual:quarantined`, `scan:malicious`,
  và `package:malicious`.
- `trust.pending` có nghĩa là một hoặc nhiều đầu vào về độ tin cậy vẫn đang chờ hoàn tất.
- `trust.stale` có nghĩa là bản tóm tắt độ tin cậy được tính toán từ các đầu vào lỗi thời và
  phải được xem là cần làm mới trước khi đưa ra quyết định cho phép có độ tin cậy cao.

Lưu ý:

- Endpoint này khớp chính xác theo phiên bản. Các client nên gọi endpoint này sau khi phân giải
  phiên bản gói dự định cài đặt, không chỉ sau khi đọc siêu dữ liệu gói
  mới nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.
- Endpoint này được chủ ý giới hạn hơn các endpoint kiểm duyệt dành cho chủ sở hữu/kiểm duyệt viên.
  Endpoint này cung cấp quyết định cài đặt và phần giải thích công khai, không cung cấp
  danh tính người báo cáo, nội dung báo cáo, bằng chứng riêng tư hoặc mốc thời gian
  review nội bộ.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về siêu dữ liệu bộ phân giải artifact tường minh cho một phiên bản gói.

Lưu ý:

- Các phiên bản gói cũ trả về một artifact `legacy-zip` và một
  `downloadUrl` ZIP cũ.
- Các phiên bản ClawPack trả về một artifact `npm-pack`, các trường toàn vẹn npm, một
  `tarballUrl`, và URL tương thích ZIP cũ.
- Đây là bề mặt bộ phân giải của OpenClaw; nó tránh việc phỏng đoán định dạng tệp lưu trữ từ
  một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống artifact của phiên bản thông qua đường dẫn bộ phân giải tường minh.

Lưu ý:

- Các phiên bản ClawPack truyền phát chính xác các byte npm-pack `.tgz` đã tải lên.
- Các phiên bản ZIP cũ chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng nhóm giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về trạng thái sẵn sàng được tính toán để OpenClaw sử dụng trong tương lai.

Các bước kiểm tra trạng thái sẵn sàng bao gồm:

- trạng thái kênh chính thức
- tính khả dụng của phiên bản mới nhất
- tính khả dụng của tạo tác npm-pack ClawPack
- giá trị băm của tạo tác
- nguồn gốc kho mã nguồn và commit
- siêu dữ liệu tương thích với OpenClaw
- các máy chủ đích
- trạng thái quét

Phản hồi:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ví dụ",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "Tạo tác ClawPack",
      "status": "fail",
      "message": "Phiên bản mới nhất chỉ có định dạng ZIP cũ."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Điểm cuối dành cho người kiểm duyệt để liệt kê các hàng di chuyển Plugin OpenClaw chính thức.

Xác thực:

- Yêu cầu token API của người dùng có vai trò người kiểm duyệt hoặc quản trị viên.

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
      "blockers": ["thiếu ClawPack"],
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

- Yêu cầu token API của người dùng quản trị viên.

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
  "blockers": ["thiếu ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "đang chờ nhà phát hành tải lên"
}
```

Lưu ý:

- `bundledPluginId` được chuẩn hóa thành chữ thường và là khóa upsert ổn định.
- `packageName` được chuẩn hóa theo tên npm; gói có thể chưa tồn tại đối với các lượt di chuyển
  đã lên kế hoạch.
- Phần này chỉ theo dõi trạng thái sẵn sàng di chuyển. Nó không sửa đổi OpenClaw hoặc tạo
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Điểm cuối dành cho người kiểm duyệt/quản trị viên để quản lý hàng đợi review bản phát hành gói.

Xác thực:

- Yêu cầu token API của người dùng có vai trò người kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `blocked`, `manual`, hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Ý nghĩa trạng thái:

- `open`: các bản phát hành đáng ngờ, độc hại, đang chờ xử lý, bị cách ly, bị thu hồi hoặc bị báo cáo.
- `blocked`: các bản phát hành bị cách ly, bị thu hồi hoặc độc hại.
- `manual`: mọi bản phát hành có ghi đè kiểm duyệt thủ công.
- `all`: mọi bản phát hành có ghi đè thủ công, trạng thái quét không sạch hoặc báo cáo về gói.

Phản hồi:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin ví dụ",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "review thủ công",
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

Báo cáo một gói để người kiểm duyệt review. Báo cáo áp dụng ở cấp gói và có thể
được liên kết với một phiên bản. Báo cáo được đưa vào hàng đợi kiểm duyệt nhưng bản thân nó không tự động ẩn hoặc
chặn lượt tải xuống; người kiểm duyệt nên sử dụng tính năng kiểm duyệt bản phát hành để
phê duyệt, cách ly hoặc thu hồi tạo tác.

Xác thực:

- Yêu cầu token API.

Yêu cầu:

```json
{ "reason": "Tệp nhị phân gốc đáng ngờ", "version": "1.2.3" }
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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để tiếp nhận báo cáo về gói.

Xác thực:

- Yêu cầu token API của người dùng có vai trò người kiểm duyệt hoặc quản trị viên.

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
      "displayName": "Plugin ví dụ",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Tệp nhị phân gốc đáng ngờ",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Người báo cáo"
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
  người dùng quản trị viên.

Phản hồi:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ví dụ",
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
    "moderationReason": "review thủ công",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Điểm cuối dành cho người kiểm duyệt/quản trị viên để giải quyết hoặc mở lại báo cáo về gói.

Yêu cầu:

```json
{
  "status": "confirmed",
  "note": "Đã review và cách ly bản phát hành bị ảnh hưởng.",
  "finalAction": "quarantine"
}
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "quarantine"` hoặc
`finalAction: "revoke"` cùng với báo cáo đã xác nhận để áp dụng kiểm duyệt bản phát hành trong
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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để review bản phát hành gói.

Yêu cầu:

```json
{ "state": "quarantined", "reason": "Payload gốc đáng ngờ." }
```

Các trạng thái được hỗ trợ:

- `approved`: đã được review thủ công và cho phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các tuyến tải xuống tạo tác.
Mọi thay đổi đều ghi một mục vào nhật ký kiểm toán.

### `GET /api/v1/packages/{name}/file`

Trả về chính xác các byte tệp gói đã lưu trữ dưới dạng bản tải xuống. Thêm `preview=1` để yêu cầu cùng bản xem trước
văn bản UTF-8 có giới hạn được dùng cho các tệp skill.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)
- `preview=1` (tùy chọn; trả về `text/plain` hoặc `415` khi các byte không phải UTF-8 hợp lệ)

Lưu ý:

- Mặc định là bản phát hành mới nhất.
- Sử dụng nhóm giới hạn tốc độ đọc, không phải nhóm tải xuống.
- Giới hạn tải xuống thô: 10MB.
- Giới hạn bản xem trước văn bản: 200KB; các tệp không trong suốt chỉ trả về `415` đối với yêu cầu xem trước.
- Các lượt quét VirusTotal đang chờ xử lý không chặn thao tác đọc; các bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định kiểu cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (tùy chọn)
- `tag` (tùy chọn)

Lưu ý:

- Mặc định là bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Các kho lưu trữ Plugin/gói là tệp zip có thư mục gốc `package/` để các máy khách OpenClaw cũ
  tiếp tục hoạt động.
- Tuyến này chỉ hỗ trợ ZIP. Nó không truyền phát các tệp ClawPack `.tgz`.
- Phản hồi bao gồm các header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` và
  `X-ClawHub-Artifact-Sha256` để kiểm tra tính toàn vẹn của trình phân giải.
- Siêu dữ liệu chỉ dành cho registry không được chèn vào kho lưu trữ đã tải xuống.
- Các lượt quét VirusTotal đang chờ xử lý không chặn tải xuống; các bản phát hành độc hại trả về `403`.
- Các gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về một packument tương thích với npm cho các phiên bản gói dựa trên ClawPack.

Lưu ý:

- Chỉ liệt kê các phiên bản có tarball npm-pack ClawPack đã tải lên.
- Các phiên bản cũ chỉ có ZIP được chủ ý bỏ qua.
- `dist.tarball`, `dist.integrity` và `dist.shasum` sử dụng các trường tương thích với npm
  để người dùng có thể trỏ npm đến mirror nếu muốn.
- Packument của gói có phạm vi hỗ trợ cả `/api/npm/@scope/name` và đường dẫn yêu cầu
  `/api/npm/@scope%2Fname` được mã hóa của npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Truyền phát chính xác các byte tarball ClawPack đã tải lên cho máy khách mirror npm.

Lưu ý:

- Sử dụng nhóm giới hạn tốc độ tải xuống.
- Các header tải xuống bao gồm SHA-256 của ClawHub cùng với siêu dữ liệu integrity/shasum của npm.
- Các bước kiểm tra kiểm duyệt và quyền truy cập gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI sử dụng để ánh xạ dấu vân tay cục bộ đến một phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 dạng hex 64 ký tự của dấu vân tay bundle

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống tệp ZIP của một phiên bản skill được lưu trữ, hoặc trả về thông tin chuyển giao nguồn GitHub cho một
skill hiện tại được hỗ trợ bởi GitHub có kết quả quét `clean` hoặc `suspicious` và không có phiên bản
được lưu trữ.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên thẻ (ví dụ: `latest`)

Lưu ý:

- Nếu không cung cấp cả `version` lẫn `tag`, phiên bản mới nhất sẽ được sử dụng.
- Các phiên bản đã xóa mềm trả về `410`.
- Thông tin chuyển giao skill được hỗ trợ bởi GitHub không ủy quyền hoặc sao chép các byte. Phản hồi JSON
  bao gồm `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  và `archiveUrl`; trạng thái quét/hiện tại là điều kiện kiểm soát và không được đưa vào siêu dữ liệu
  tải trọng thành công.
- Thống kê lượt tải xuống được tính theo danh tính duy nhất mỗi ngày UTC (`userId` khi token API hợp lệ, nếu không thì theo IP).

## Endpoint xác thực (token Bearer)

Tất cả endpoint đều yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực token và trả về định danh người dùng.

### `POST /api/v1/skills`

Phát hành phiên bản mới.

- Ưu tiên: `multipart/form-data` với JSON `payload` + các blob `files[]`.
- Phần thân JSON có `files` (dựa trên storageId) cũng được chấp nhận.
- Trường tải trọng tùy chọn: `ownerHandle`. Khi có, API phân giải
  nhà phát hành đó ở phía máy chủ và yêu cầu tác nhân có quyền truy cập nhà phát hành.
- Trường tải trọng tùy chọn: `migrateOwner`. Khi `true` cùng với `ownerHandle`, một
  skill hiện có có thể được chuyển sang chủ sở hữu đó nếu tác nhân là quản trị viên/chủ sở hữu của cả
  nhà phát hành hiện tại và nhà phát hành đích. Nếu không có lựa chọn tham gia này, thay đổi chủ sở hữu
  sẽ bị từ chối.

### `POST /api/v1/packages`

Phát hành bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng token Bearer.
- Yêu cầu `multipart/form-data`.
- Các trường biểu mẫu được phép là `payload`, các blob `files` lặp lại, hoặc một tham chiếu tarball `clawpack`.
  `clawpack` có thể là blob `.tgz` hoặc mã định danh lưu trữ do luồng URL tải lên trả về.
  Các lần phát hành theo mã định danh lưu trữ đã chuẩn bị cũng phải bao gồm
  `clawpackUploadTicket` được trả về cùng URL tải lên đó.
- Chỉ sử dụng `files` hoặc `clawpack`, tuyệt đối không dùng cả hai trong cùng một yêu cầu.
- Phần thân JSON và siêu dữ liệu `payload.files` / `payload.artifact`
  do bên gọi cung cấp sẽ bị từ chối.
- Các yêu cầu phát hành multipart trực tiếp bị giới hạn ở 18MB. Tarball ClawPack có thể
  sử dụng luồng URL tải lên với giới hạn tarball tối đa 120MB.
- Trường tải trọng tùy chọn: `ownerHandle`. Khi có, chỉ quản trị viên mới có thể phát hành thay cho chủ sở hữu đó.

Các điểm chính về xác thực:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Các gói plugin yêu cầu `openclaw.plugin.json`. Nội dung tải lên ClawPack `.tgz` phải
  chứa trường này tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, siêu dữ liệu kho lưu trữ nguồn, siêu dữ liệu commit
  nguồn, siêu dữ liệu lược đồ cấu hình, `openclaw.compat.pluginApi`, và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
- Chỉ nhà phát hành tổ chức `openclaw` và nhà phát hành cá nhân của các thành viên hiện tại
  thuộc tổ chức `openclaw` mới có thể phát hành lên kênh `official`.
- Các lần phát hành thay mặt vẫn xác thực điều kiện tham gia kênh chính thức dựa trên tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).

Phần thân JSON tùy chọn:

```json
{ "reason": "Tạm giữ để kiểm duyệt trong khi chờ xem xét pháp lý." }
```

Khi có, `reason` được lưu làm ghi chú kiểm duyệt skill và được sao chép vào nhật ký kiểm toán.
Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày, sau đó slug có thể được
nhà phát hành khác nhận. Phản hồi xóa bao gồm `slugReservedUntil` khi thời hạn này được áp dụng.
Việc ẩn bởi người kiểm duyệt/quản trị viên và gỡ bỏ vì lý do bảo mật không hết hạn theo cách này.

Phản hồi xóa:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Mã trạng thái:

- `200`: thành công
- `401`: chưa xác thực
- `403`: bị cấm
- `404`: không tìm thấy skill/người dùng
- `500`: lỗi máy chủ nội bộ

### `POST /api/v1/users/publisher`

Chỉ dành cho quản trị viên. Đảm bảo tồn tại một nhà phát hành tổ chức cho một định danh. Nếu định danh vẫn trỏ đến
người dùng dùng chung/nhà phát hành cá nhân kiểu cũ, trước tiên endpoint sẽ di chuyển đối tượng đó thành nhà phát hành tổ chức.
Đối với tổ chức mới tạo, hãy cung cấp `memberHandle`; quản trị viên thực hiện thao tác không được thêm làm thành viên.
`memberRole` mặc định là `owner`.

- Phần thân: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Tạo nhà phát hành tổ chức tự phục vụ có xác thực. Tạo một nhà phát hành tổ chức mới và thêm
bên gọi làm chủ sở hữu. Endpoint này không di chuyển các định danh người dùng/cá nhân hiện có và không
đánh dấu nhà phát hành là đáng tin cậy/chính thức.

- Phần thân: `{ "handle": "opik", "displayName": "Opik" }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Trả về `409` khi định danh đã được một nhà phát hành, người dùng hoặc nhà phát hành cá nhân sử dụng.

### `POST /api/v1/users/reserve`

Chỉ dành cho quản trị viên. Giữ trước các slug gốc và tên gói cho chủ sở hữu hợp pháp mà không phát hành
bản phát hành. Tên gói trở thành các gói giữ chỗ riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu sau này có thể phát hành bản code-plugin hoặc bundle-plugin thực vào tên đó.

- Phần thân: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Phản hồi: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Chỉ dành cho quản trị viên. Khôi phục nhà phát hành cá nhân cho một danh tính GitHub OAuth thay thế đã xác minh
mà không chỉnh sửa các hàng tài khoản Convex Auth. Yêu cầu phải nêu cả hai mã định danh tài khoản nhà cung cấp GitHub
bất biến; các định danh có thể thay đổi chỉ được dùng làm điều kiện bảo vệ dành cho người vận hành.

Endpoint mặc định ở chế độ chạy thử. Việc áp dụng khôi phục yêu cầu `dryRun: false` và
`confirmIdentityVerified: true` sau khi nhân viên xác minh độc lập tính liên tục giữa cả hai
danh tính GitHub. Khôi phục sẽ từ chối an toàn khi nhà phát hành cá nhân hiện tại của người dùng đích
có skill, gói hoặc nguồn skill GitHub.
Quá trình khôi phục cũng di chuyển các trường `ownerUserId` kiểu cũ cho các skill của nhà phát hành được khôi phục,
bí danh slug skill, gói, cảnh báo trình kiểm tra gói và các hàng bản tóm lược tìm kiếm phái sinh để
các đường dẫn chủ sở hữu trực tiếp nhất quán với quyền hạn nhà phát hành mới. Một mục giữ trước định danh được bảo vệ
đang hoạt động cho định danh được khôi phục cũng được chuyển cho người dùng thay thế để quá trình
đồng bộ hồ sơ sau này không thể khôi phục quyền hạn cạnh tranh của người dùng cũ. Mỗi bảng chính được giới hạn ở
100 hàng cho mỗi giao dịch áp dụng; các lần khôi phục lớn hơn trước tiên phải sử dụng quá trình di chuyển chủ sở hữu có thể tiếp tục.
Nguồn skill GitHub có phạm vi theo nhà phát hành và được báo cáo là đã kiểm tra thay vì được ghi lại.

- Phần thân: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Phản hồi: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoint quản lý slug của chủ sở hữu

- `POST /api/v1/skills/{slug}/rename`
  - Phần thân: `{ "newSlug": "new-canonical-slug" }`
  - Phản hồi: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Phần thân: `{ "targetSlug": "canonical-target-slug" }`
  - Phản hồi: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Lưu ý:

- Cả hai endpoint đều yêu cầu xác thực bằng token API và chỉ hoạt động với chủ sở hữu skill.
- `rename` giữ slug trước đó làm bí danh chuyển hướng.
- `merge` ẩn mục nguồn và chuyển hướng slug nguồn đến mục đích.

### Endpoint chuyển quyền sở hữu

- `POST /api/v1/skills/{slug}/transfer`
  - Phần thân: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Phản hồi: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Phản hồi (chấp nhận/từ chối/hủy): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Cấu trúc phản hồi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Cấm người dùng và xóa vĩnh viễn các skill thuộc sở hữu (chỉ người kiểm duyệt/quản trị viên).

Phần thân:

```json
{ "handle": "user_handle", "reason": "lý do cấm tùy chọn" }
```

hoặc

```json
{ "userId": "users_...", "reason": "lý do cấm tùy chọn" }
```

Phản hồi:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Gỡ cấm người dùng và khôi phục các skill đủ điều kiện (chỉ quản trị viên).

Phần thân:

```json
{ "handle": "user_handle", "reason": "lý do gỡ cấm tùy chọn" }
```

hoặc

```json
{ "userId": "users_...", "reason": "lý do gỡ cấm tùy chọn" }
```

Phản hồi:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Thay đổi lý do đã lưu cho một lệnh cấm hiện có mà không gỡ cấm hoặc khôi phục
nội dung (chỉ quản trị viên). Mặc định chạy thử trừ khi `dryRun` là `false`.

Phần thân:

```json
{ "handle": "user_handle", "reason": "spam phát hành hàng loạt", "dryRun": true }
```

hoặc

```json
{ "userId": "users_...", "reason": "spam phát hành hàng loạt", "dryRun": false }
```

Phản hồi:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "tự động cấm do phần mềm độc hại",
  "nextReason": "spam phát hành hàng loạt",
  "changed": true
}
```

### `POST /api/v1/users/role`

Thay đổi vai trò người dùng (chỉ quản trị viên).

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
      "displayName": "Người dùng",
      "name": "Người dùng",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Thêm/xóa dấu sao (đánh dấu nổi bật). Cả hai endpoint đều có tính lũy đẳng.

Phản hồi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI cũ (không còn được khuyến nghị)

Vẫn được hỗ trợ cho các phiên bản CLI cũ hơn:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch loại bỏ.

`POST /api/cli/upload-url` trả về `uploadUrl` và `uploadTicket`. Các lần
phát hành gói chuẩn bị tarball ClawPack phải gửi mã định danh lưu trữ nhận được dưới dạng
`clawpack` và phiếu được trả về dưới dạng `clawpackUploadTicket`.

## Khám phá registry (`/.well-known/clawhub.json`)

CLI có thể khám phá cài đặt registry/xác thực từ trang web:

- `/.well-known/clawhub.json` (JSON, ưu tiên)
- `/.well-known/clawdhub.json` (kiểu cũ)

Lược đồ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu tự lưu trữ, hãy phục vụ tệp này (hoặc đặt `CLAWHUB_REGISTRY` một cách tường minh; `CLAWDHUB_REGISTRY` kiểu cũ).
