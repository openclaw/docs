---
read_when:
    - Thêm/thay đổi các điểm cuối
    - Gỡ lỗi các yêu cầu CLI ↔ registry
summary: Tài liệu tham khảo API HTTP (các điểm cuối công khai + CLI + xác thực).
x-i18n:
    generated_at: "2026-07-16T14:58:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 đều nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được duy trì để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục của bên thứ ba có thể sử dụng các endpoint đọc công khai để liệt kê hoặc tìm kiếm Skills trên ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng trở lại danh sách ClawHub chính thức (`https://clawhub.ai/<owner>/skills/<slug>`) và tránh ngụ ý rằng ClawHub chứng thực trang web của bên thứ ba. Không cố gắng sao chép nội dung bị ẩn, riêng tư hoặc bị kiểm duyệt chặn bên ngoài bề mặt API công khai.

Các lối tắt slug trên web được phân giải trên toàn bộ các họ registry, nhưng client API nên sử dụng
các URL chính thức do endpoint đọc trả về thay vì tự dựng lại thứ tự
ưu tiên của tuyến.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: thực thi theo từng IP.
- Yêu cầu đã xác thực (Bearer token hợp lệ): thực thi theo bucket của từng người dùng.
- Nếu token bị thiếu/không hợp lệ, hành vi sẽ quay về thực thi theo IP.
- Các endpoint ghi đã xác thực không nên chỉ trả về `Unauthorized` khi
  máy chủ biết nguyên nhân. Token bị thiếu, token không hợp lệ/đã bị thu hồi và
  tài khoản đã bị xóa/cấm/vô hiệu hóa đều phải nhận được nội dung có thể hành động để các
  client CLI có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 3000/phút cho mỗi IP, 12000/phút cho mỗi khóa
- Ghi: 300/phút cho mỗi IP, 3000/phút cho mỗi khóa
- Tải xuống: 1200/phút cho mỗi IP, 6000/phút cho mỗi khóa (các endpoint tải xuống)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Đã chuẩn hóa: `RateLimit-Limit`, `RateLimit-Reset`
- Khi `429`: `X-RateLimit-Remaining: 0` và `RateLimit-Remaining: 0`
- Khi `429`: `Retry-After`

Ngữ nghĩa của header:

- `X-RateLimit-Reset`: số giây tuyệt đối theo Unix epoch
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: hạn mức chính xác còn lại khi có.
  Các yêu cầu phân mảnh thành công sẽ bỏ qua header này thay vì trả về một giá trị toàn cục gần đúng.
- `Retry-After`: số giây cần chờ trước khi thử lại (độ trễ) khi `429`

Ví dụ về phản hồi `429`:

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

- Nếu có `Retry-After`, hãy chờ số giây đó trước khi thử lại.
- Sử dụng cơ chế lùi thời gian có độ nhiễu để tránh các lần thử lại đồng bộ.
- Nếu thiếu `Retry-After`, hãy quay về dùng `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Chỉ sử dụng các header IP client đáng tin cậy, bao gồm `cf-connecting-ip`, khi
  quá trình triển khai bật rõ ràng các header chuyển tiếp đáng tin cậy.
- ClawHub sử dụng các header chuyển tiếp đáng tin cậy để xác định IP của client tại biên.
- Nếu không có IP client đáng tin cậy, các yêu cầu ẩn danh sẽ dùng các bucket dự phòng
  chỉ được phân phạm vi theo loại giới hạn tốc độ. Các bucket dự phòng này không bao gồm
  đường dẫn, slug, tên gói, phiên bản, chuỗi truy vấn hoặc các
  tham số tạo tác khác do bên gọi cung cấp.

## Phản hồi lỗi

Các phản hồi lỗi v1 công khai là văn bản thuần túy với `content-type: text/plain; charset=utf-8`.
Điều này bao gồm lỗi xác thực dữ liệu (`400`), tài nguyên công khai bị thiếu (`404`), lỗi xác thực danh tính và
quyền hạn (`401`/`403`), giới hạn tốc độ (`429`) và lượt tải xuống bị chặn. Client
nên đọc nội dung phản hồi dưới dạng chuỗi mà con người có thể hiểu được. Các tham số truy vấn không xác định được
bỏ qua để tương thích, nhưng các tham số truy vấn đã được nhận dạng có giá trị không hợp lệ sẽ trả về
`400`.

## Các endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (không bắt buộc): số nguyên
- `highlightedOnly` (không bắt buộc): `true` để chỉ lọc các Skills nổi bật
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

Lưu ý:

- Kết quả được trả về theo thứ tự mức độ liên quan (độ tương đồng embedding + mức tăng cho token slug/tên khớp chính xác + một trọng số nhỏ dựa trên độ phổ biến).
- Mức độ liên quan có trọng số cao hơn độ phổ biến. Một token slug hoặc tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn nhưng có mức tương tác cao hơn nhiều.
- Văn bản ASCII được tách token tại ranh giới từ và dấu câu. Ví dụ: `personal-map` chứa một token `map` độc lập, trong khi `amap-jsapi-skill` chứa `amap`, `jsapi` và `skill`; do đó, việc tìm kiếm `map` mang lại cho `personal-map` mức khớp từ vựng cao hơn `amap-jsapi-skill`.
- Độ phổ biến được tính theo thang logarit và có giới hạn trên. Các Skills có mức tương tác cao có thể xếp hạng thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc bị ẩn có thể loại một Skill khỏi kết quả tìm kiếm công khai, tùy thuộc vào bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn giúp nhà phát hành dễ được tìm thấy:

- Đưa các thuật ngữ mà người dùng sẽ thực sự tìm kiếm vào tên hiển thị, phần tóm tắt và thẻ. Chỉ sử dụng token slug độc lập khi đó cũng là một định danh ổn định mà bạn muốn duy trì.
- Không đổi tên slug chỉ để nhắm đến một truy vấn, trừ khi slug mới là tên chính thức dài hạn tốt hơn. Các slug cũ trở thành bí danh chuyển hướng, nhưng URL chính thức, slug được hiển thị và các bản tổng hợp tìm kiếm trong tương lai sẽ sử dụng slug mới.
- Các bí danh đổi tên vẫn duy trì khả năng phân giải cho URL cũ và các lượt cài đặt được phân giải thông qua registry, nhưng thứ hạng tìm kiếm dựa trên siêu dữ liệu chính thức của Skill sau khi việc đổi tên đã được lập chỉ mục. Các số liệu thống kê hiện có vẫn được giữ lại với Skill.
- Nếu một Skill bất ngờ không hiển thị, trước tiên hãy kiểm tra trạng thái kiểm duyệt bằng `clawhub inspect @owner/slug` khi đã đăng nhập, trước khi thay đổi siêu dữ liệu liên quan đến thứ hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên (1–200)
- `cursor` (không bắt buộc): con trỏ phân trang cho mọi kiểu sắp xếp không phải `trending`
- `sort` (không bắt buộc): `updated` (mặc định), `recommended` (bí danh: `default`), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), các bí danh cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ tới `downloads`, `trending`
- `nonSuspiciousOnly` (không bắt buộc): `true` để ẩn các Skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (không bắt buộc): bí danh cũ của `nonSuspiciousOnly`

Giá trị `sort` không hợp lệ sẽ trả về `400`.

Lưu ý:

- `recommended` sử dụng các tín hiệu về mức độ tương tác và độ gần đây.
- `trending` xếp hạng theo số lượt cài đặt trong 7 ngày gần nhất (dựa trên dữ liệu đo từ xa).
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

Lưu ý:

- Các slug cũ được tạo bởi quy trình đổi tên/hợp nhất của chủ sở hữu sẽ phân giải đến Skill chính thức.
- `metadata.os`: các giới hạn hệ điều hành được khai báo trong frontmatter của Skill (ví dụ: `["macos"]`, `["linux"]`). `null` nếu không được khai báo.
- `metadata.systems`: các mục tiêu hệ thống Nix (ví dụ: `["aarch64-darwin", "x86_64-linux"]`). `null` nếu không được khai báo.
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

Lưu ý:

- Chủ sở hữu và người kiểm duyệt có thể truy cập thông tin kiểm duyệt chi tiết của các Skills bị ẩn.
- Bên gọi công khai chỉ nhận được `200` cho các Skills hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập lại đối với bên gọi công khai và chỉ bao gồm các đoạn mã thô đối với chủ sở hữu/người kiểm duyệt.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một Skill để người kiểm duyệt xem xét. Báo cáo được áp dụng ở cấp Skill, có thể tùy chọn liên kết
với một phiên bản và được đưa vào hàng đợi báo cáo Skill.

Xác thực:

- Yêu cầu API token.

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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để giải quyết hoặc mở lại báo cáo về skill.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Đã xem xét và ẩn phiên bản bị ảnh hưởng.", "finalAction": "hide" }
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "hide"` cùng với một báo cáo đã được
phân loại để ẩn skill trong cùng một quy trình có thể kiểm tra.

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
- `tag` (không bắt buộc): phân giải một phiên bản có thẻ (ví dụ `latest`).

Lưu ý:

- Nếu không cung cấp cả `version` lẫn `tag`, phiên bản mới nhất sẽ được sử dụng.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng thông tin chi tiết riêng của từng trình quét.
- `security.hasScanResult` chỉ là `true` khi một trình quét đưa ra kết luận dứt khoát (`clean`, `suspicious` hoặc `malicious`).
- `moderation` là ảnh chụp nhanh kiểm duyệt hiện tại ở cấp skill, được suy ra từ phiên bản mới nhất.
- Khi truy vấn một phiên bản cũ, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi coi `moderation` và `security` là cùng một ngữ cảnh phiên bản.

### `POST /api/v1/skills/-/scan`

Điểm cuối gửi có xác thực dành cho các tác vụ ClawScan mới.

Quét nội dung tải lên cục bộ không còn được hỗ trợ. Các yêu cầu sử dụng
`multipart/form-data` hoặc `{ "source": { "kind": "upload" } }` sẽ trả về `410`.

Quét nội dung đã xuất bản sử dụng JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Lưu ý:

- Tải trọng yêu cầu quét và báo cáo có thể tải xuống sẽ hết hạn khỏi kho yêu cầu quét sau khoảng thời gian lưu giữ.
- Quét nội dung đã xuất bản yêu cầu quyền quản lý của chủ sở hữu/nhà xuất bản hoặc quyền người kiểm duyệt/quản trị viên nền tảng.
- Quét nội dung đã xuất bản chỉ ghi ngược khi `update: true` và quá trình quét hoàn tất thành công.
- Phản hồi là `202` với `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Các tác vụ quét chạy bất đồng bộ. Yêu cầu quét thủ công được ưu tiên trước công việc xuất bản/điền bù thông thường, nhưng thời điểm hoàn tất vẫn phụ thuộc vào khả năng sẵn sàng của worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Điểm cuối thăm dò có xác thực dành cho một lần quét đã gửi.

- Trả về trạng thái đang xếp hàng/đang chạy/thành công/thất bại.
- Trả về `queue.queuedAhead` và `queue.position` trong khi đang xếp hàng để máy khách có thể hiển thị số lượt quét thủ công ưu tiên đang đứng trước yêu cầu. Các hàng đợi rất lớn bị giới hạn và được báo cáo bằng `queuedAheadIsEstimate: true`.
- Khi có, `report` chứa các phần `clawscan`, `skillspector`, `staticAnalysis` và `virustotal`.
- Các tác vụ quét thất bại trả về `status: "failed"` với `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Điểm cuối kho lưu trữ báo cáo có xác thực.

- Yêu cầu một lượt quét thành công; các lượt quét chưa ở trạng thái kết thúc trả về `409`.
- Trả về một tệp ZIP chứa `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Điểm cuối kho lưu trữ báo cáo đã lưu có xác thực dành cho các phiên bản đã gửi.

- Yêu cầu quyền quản lý của chủ sở hữu/nhà xuất bản đối với skill hoặc plugin, hoặc quyền người kiểm duyệt/quản trị viên nền tảng.
- Trả về kết quả quét đã lưu cho chính xác phiên bản đã gửi, bao gồm cả các phiên bản bị chặn hoặc ẩn.
- `kind` mặc định là `skill`; sử dụng `kind=plugin` cho lượt quét plugin/gói.
- Trả về cùng cấu trúc ZIP như các bản tải xuống của yêu cầu quét.

### `POST /api/v1/skills/-/scan/batch`

Tuyến quét lại hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Tuyến này chấp nhận cùng cấu trúc tải trọng như `POST /api/v1/skills/-/rescan-batch` cũ.

### `POST /api/v1/skills/-/scan/batch/status`

Tuyến trạng thái hàng loạt chuẩn tắc chỉ dành cho quản trị viên. Tuyến này chấp nhận `{ "jobIds": ["..."] }` và trả về cùng các bộ đếm tổng hợp như `POST /api/v1/skills/-/rescan-batch/status` cũ.

### `GET /api/v1/skills/{slug}/verify`

Trả về phong bì xác minh Thẻ Skill được `clawhub skill verify` sử dụng.

Tham số truy vấn:

- `version` (không bắt buộc): chuỗi phiên bản cụ thể.
- `tag` (không bắt buộc): phân giải một phiên bản có thẻ (ví dụ `latest`).

Lưu ý:

- `ok` chỉ là `true` khi phiên bản được chọn có Thẻ Skill đã tạo, không bị kiểm duyệt chặn do phần mềm độc hại và xác minh ClawScan cho kết quả sạch.
- Danh tính skill, danh tính nhà xuất bản và siêu dữ liệu phiên bản đã chọn là các trường cấp cao nhất của phong bì (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) để quy trình tự động hóa shell có thể đọc chúng mà không cần giải nén các lớp bọc lồng nhau.
- `security` là kết luận ClawScan/bảo mật cấp cao nhất. Quy trình tự động hóa nên dựa vào `ok`, `decision`, `reasons` và `security.status`.
- `security.signals` chứa bằng chứng hỗ trợ từ trình quét như `staticScan`, `virusTotal` và `skillSpector`.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét sự tồn tại của sổ đăng ký phần phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- `provenance` chỉ là `server-resolved-github-import` khi ClawHub đã phân giải và lưu kho lưu trữ/ref/commit/đường dẫn GitHub trong quá trình xuất bản hoặc nhập; nếu không, giá trị là `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Trả về các kết luận bảo mật rút gọn hiện tại cho chính xác các phiên bản skill. Điểm cuối
tập hợp này dành cho các máy khách đã biết những phiên bản skill
ClawHub đã cài đặt nào cần hiển thị, chẳng hạn như OpenClaw Control UI.

Yêu cầu:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Lưu ý:

- `items` phải chứa 1-100 cặp `{ slug, version }` duy nhất.
- Kết quả được trả về theo từng mục; một skill hoặc phiên bản bị thiếu không làm toàn bộ phản hồi thất bại.
- Phản hồi chỉ chứa thông tin bảo mật. Phản hồi không bao gồm dữ liệu Thẻ Skill, trạng thái thẻ đã tạo, danh sách tệp tạo tác hoặc tải trọng chi tiết của trình quét.
- `security.signals` chỉ chứa bằng chứng hỗ trợ ở cấp trạng thái; hãy sử dụng `/scan` hoặc trang kiểm tra bảo mật ClawHub để xem đầy đủ thông tin chi tiết của trình quét.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét sự tồn tại của sổ đăng ký phần phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- Việc không có Thẻ Skill không ảnh hưởng đến `ok`, `decision` hoặc `reasons` của điểm cuối này; máy khách nên đọc `skill-card.md` đã cài đặt ở cục bộ khi cần nội dung thẻ.
- Sử dụng `/verify` khi cần phong bì xác minh Thẻ Skill cho một skill, `/card` khi cần Markdown của thẻ đã tạo và `/scan` khi cần dữ liệu trình quét chi tiết.

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

Trả về nội dung văn bản thô.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (không bắt buộc)
- `tag` (không bắt buộc)

Lưu ý:

- Mặc định là phiên bản mới nhất.
- Giới hạn kích thước tệp: 200KB.

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
  yêu cầu giới hạn trong các gói plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` hoặc các điểm cuối gói có
  `family=code-plugin`/`family=bundle-plugin`). Các danh mục được kiểm soát và
  bí danh bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` hoặc `sort` trả về `400`. Các tham số truy vấn không xác định sẽ bị bỏ qua.
- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh họ cố định.
- Các mục skill vẫn dựa trên sổ đăng ký skill và vẫn chỉ có thể được xuất bản thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành plugin mã và plugin gói.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể thấy các gói riêng tư của những nhà xuất bản mà họ trực thuộc trong kết quả danh sách/tìm kiếm.
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
  yêu cầu được giới hạn trong các gói plugin. Các danh mục được kiểm soát và bí danh
  bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`, hoặc
  `highlightedOnly` trả về `400`. Các tham số truy vấn không xác định sẽ bị bỏ qua.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể tìm kiếm các gói riêng tư của những nhà phát hành mà họ là thành viên.
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

Các bí danh bộ lọc v1 cũ vẫn được chấp nhận trên các điểm cuối đọc:

- `mcp-tooling`, `data` và `automation` được phân giải thành `tools`.
- `observability` và `deployment` được phân giải thành `gateway`.
- `dev-tools` được phân giải thành `runtime`.

`trending` là bảng xếp hạng lượt cài đặt/tải xuống trong bảy ngày và không sử dụng tổng số toàn thời gian.
Trên điểm cuối hợp nhất `/api/v1/packages`, mục này chỉ dành cho plugin; hãy dùng
`/api/v1/skills?sort=trending` cho danh mục skill.

Các bí danh cũ không được chấp nhận làm giá trị danh mục được lưu trữ hoặc do tác giả khai báo.

### `GET /api/v1/skills/export`

Xuất hàng loạt các skill công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Yêu cầu token API.

Tham số truy vấn:

- `startDate` (bắt buộc): cận dưới tính bằng mili giây Unix cho `updatedAt` của skill.
- `endDate` (bắt buộc): cận trên tính bằng mili giây Unix cho `updatedAt` của skill.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước.

Phản hồi:

- Nội dung: kho lưu trữ ZIP.
- Mỗi skill được xuất có thư mục gốc tại `{publisher}/{slug}/`.
- Các skill được lưu trữ trên máy chủ bao gồm tệp của phiên bản được lưu trữ mới nhất và được liệt kê trong
  `_manifest.json` với `sourceRef: "public-clawhub"`.
- Các skill hiện tại dựa trên GitHub có lượt quét `clean` hoặc `suspicious` bao gồm
  `_source_handoff.json` với `sourceRef: "public-github"`, kho lưu trữ, commit, đường dẫn,
  hàm băm nội dung và URL kho lưu trữ. Chúng không bao gồm các tệp nguồn do ClawHub lưu trữ.
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

- Yêu cầu token API.

Tham số truy vấn:

- `startDate` (bắt buộc): cận dưới tính bằng mili giây Unix cho `updatedAt` của plugin.
- `endDate` (bắt buộc): cận trên tính bằng mili giây Unix cho `updatedAt` của plugin.
- `limit` (tùy chọn): số nguyên (1-250), mặc định `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước.
- `family` (tùy chọn): `code-plugin` hoặc `bundle-plugin`. Nếu bỏ qua thì bao gồm cả hai
  họ plugin.

Phản hồi:

- Nội dung: kho lưu trữ ZIP.
- Mỗi plugin được xuất có thư mục gốc tại `{family}/{packageName}/`.
- Mỗi plugin được xuất bao gồm các tệp được lưu trữ của bản phát hành mới nhất.
- Siêu dữ liệu xuất cho từng plugin được lưu tại
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
- Lọc theo danh mục là một bộ lọc API thực sự dựa trên các hàng bản tóm lược danh mục
  plugin, không phải thao tác viết lại truy vấn tìm kiếm.
- Kết quả được trả về theo thứ tự mức độ liên quan và hiện không được phân trang.
- Các điều khiển sắp xếp trên giao diện trình duyệt dành cho tìm kiếm plugin sẽ sắp xếp lại các kết quả theo mức độ liên quan đã tải,
  khớp với hành vi duyệt `/skills` hiện tại.

### `GET /api/v1/packages/{name}`

Trả về siêu dữ liệu chi tiết của gói.

Lưu ý:

- Các skill cũng có thể được phân giải thông qua tuyến này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả các bản phát hành.

Lưu ý:

- Yêu cầu token API của chủ sở hữu gói, chủ sở hữu/quản trị viên của tổ chức phát hành,
  người kiểm duyệt nền tảng hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Lưu ý:

- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm siêu dữ liệu tệp, khả năng tương thích,
xác minh, siêu dữ liệu hiện vật và dữ liệu quét.

Lưu ý:

- `version.artifact.kind` là `legacy-zip` đối với kho lưu trữ gói kiểu cũ hoặc
  `npm-pack` đối với các bản phát hành dựa trên ClawPack.
- Các bản phát hành ClawPack bao gồm các trường tương thích với npm là `npmIntegrity`, `npmShasum` và
  `npmTarballName`.
- `version.sha256hash` là siêu dữ liệu tương thích đã lỗi thời dành cho các máy khách cũ. Giá trị này
  băm chính xác các byte ZIP được trả về bởi `/api/v1/packages/{name}/download`.
  Các máy khách hiện đại nên dùng `version.artifact.sha256`, giá trị nhận diện
  hiện vật phát hành chuẩn.
- `version.vtAnalysis`, `version.llmAnalysis` và `version.staticScan` được
  bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Trả về bản tóm tắt bảo mật và độ tin cậy chính xác của bản phát hành gói cho các
máy khách cài đặt. Đây là bề mặt sử dụng OpenClaw công khai để quyết định liệu
một bản phát hành đã phân giải có thể được cài đặt hay không.

Xác thực:

- Điểm cuối đọc công khai. Không yêu cầu token của chủ sở hữu, nhà phát hành,
  người kiểm duyệt hoặc quản trị viên.

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

- `package.name`, `package.displayName` và `package.family` nhận diện
  gói registry đã phân giải.
- `release.releaseId`, `release.version` và `release.createdAt` nhận diện
  chính xác bản phát hành đã được đánh giá.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` và `release.npmTarballName` xuất hiện khi đã biết đối với
  hiện vật phát hành.
- `trust.scanStatus` là trạng thái tin cậy có hiệu lực được suy ra từ đầu vào của trình quét
  và hoạt động kiểm duyệt bản phát hành thủ công.
- `trust.moderationState` có thể là null. Giá trị này là `null` khi không có hoạt động kiểm duyệt bản phát hành
  thủ công.
- `trust.blockedFromDownload` là tín hiệu chặn cài đặt. OpenClaw và các
  máy khách cài đặt khác nên chặn cài đặt khi giá trị này là `true` thay vì
  tự suy lại các quy tắc chặn từ trường trình quét hoặc kiểm duyệt.
- `trust.reasons` là danh sách giải thích dành cho người dùng và kiểm toán. Mã lý do
  là các chuỗi ổn định, ngắn gọn như `manual:quarantined`, `scan:malicious`
  và `package:malicious`.
- `trust.pending` có nghĩa là một hoặc nhiều đầu vào về độ tin cậy vẫn đang chờ hoàn tất.
- `trust.stale` có nghĩa là bản tóm tắt độ tin cậy được tính từ các đầu vào đã lỗi thời và
  cần được làm mới trước khi đưa ra quyết định cho phép với độ tin cậy cao.

Lưu ý:

- Điểm cuối này dành cho phiên bản chính xác. Máy khách nên gọi điểm cuối này sau khi phân giải
  phiên bản gói mà chúng dự định cài đặt, không chỉ sau khi đọc siêu dữ liệu gói
  mới nhất.
- Các gói riêng tư trả về `404` trừ khi người gọi có thể đọc nhà phát hành sở hữu gói.
- Điểm cuối này được chủ ý thiết kế hẹp hơn các điểm cuối kiểm duyệt dành cho
  chủ sở hữu/người kiểm duyệt. Điểm cuối này cung cấp quyết định cài đặt và phần giải thích công khai, không cung cấp
  danh tính người báo cáo, nội dung báo cáo, bằng chứng riêng tư hoặc tiến trình
  xem xét nội bộ.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về siêu dữ liệu trình phân giải hiện vật tường minh cho một phiên bản gói.

Lưu ý:

- Các phiên bản gói cũ trả về một hiện vật `legacy-zip` và một ZIP cũ
  `downloadUrl`.
- Các phiên bản ClawPack trả về một hiện vật `npm-pack`, các trường tính toàn vẹn npm, một
  `tarballUrl` và URL tương thích ZIP cũ.
- Đây là bề mặt trình phân giải của OpenClaw; nó tránh việc đoán định dạng kho lưu trữ từ
  một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống hiện vật phiên bản thông qua đường dẫn trình phân giải tường minh.

Lưu ý:

- Các phiên bản ClawPack truyền trực tiếp chính xác các byte `.tgz` của gói npm đã tải lên.
- Các phiên bản ZIP cũ chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng nhóm giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về trạng thái sẵn sàng được tính toán để OpenClaw sử dụng trong tương lai.

Các bước kiểm tra trạng thái sẵn sàng bao gồm:

- trạng thái kênh chính thức
- tính khả dụng của phiên bản mới nhất
- tính khả dụng của hiện vật npm-pack ClawPack
- mã băm hiện vật
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
      "label": "Hiện vật ClawPack",
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

- Yêu cầu token API của người dùng là người kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `phase` (không bắt buộc): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, hoặc
  `all` (mặc định).
- `limit` (không bắt buộc): số nguyên (1-100)
- `cursor` (không bắt buộc): con trỏ phân trang

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

- Yêu cầu token API của người dùng là quản trị viên.

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

Ghi chú:

- `bundledPluginId` được chuẩn hóa thành chữ thường và là khóa upsert ổn định.
- `packageName` được chuẩn hóa theo tên npm; gói có thể chưa tồn tại đối với các đợt
  di chuyển đã lên kế hoạch.
- Nội dung này chỉ theo dõi trạng thái sẵn sàng di chuyển. Nó không sửa đổi OpenClaw hoặc tạo
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Điểm cuối dành cho người kiểm duyệt/quản trị viên đối với hàng đợi xét duyệt bản phát hành gói.

Xác thực:

- Yêu cầu token API của người dùng là người kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `status` (không bắt buộc): `open` (mặc định), `blocked`, `manual`, hoặc `all`
- `limit` (không bắt buộc): số nguyên (1-100)
- `cursor` (không bắt buộc): con trỏ phân trang

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
      "moderationReason": "xét duyệt thủ công",
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

Báo cáo một gói để người kiểm duyệt xét duyệt. Báo cáo áp dụng ở cấp độ gói và có thể
được liên kết với một phiên bản. Chúng được đưa vào hàng đợi kiểm duyệt nhưng không tự động ẩn hoặc
chặn lượt tải xuống; người kiểm duyệt nên sử dụng chức năng kiểm duyệt bản phát hành để
phê duyệt, cách ly hoặc thu hồi hiện vật.

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

- Yêu cầu token API của người dùng là người kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `status` (không bắt buộc): `open` (mặc định), `confirmed`, `dismissed`, hoặc `all`
- `limit` (không bắt buộc): số nguyên (1-100)
- `cursor` (không bắt buộc): con trỏ phân trang

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
    "moderationReason": "xét duyệt thủ công",
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
  "note": "Đã xét duyệt và cách ly bản phát hành bị ảnh hưởng.",
  "finalAction": "quarantine"
}
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt `status` trở lại `open`. Truyền `finalAction: "quarantine"` hoặc
`finalAction: "revoke"` cùng với báo cáo đã xác nhận để áp dụng biện pháp kiểm duyệt bản phát hành trong
cùng một quy trình có thể kiểm tra.

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
{ "state": "quarantined", "reason": "Tải trọng gốc đáng ngờ." }
```

Các trạng thái được hỗ trợ:

- `approved`: đã được xét duyệt thủ công và cho phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các tuyến tải xuống hiện vật.
Mỗi thay đổi đều ghi một mục vào nhật ký kiểm tra.

### `GET /api/v1/packages/{name}/file`

Trả về nội dung văn bản thô của một tệp trong gói.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (không bắt buộc)
- `tag` (không bắt buộc)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Sử dụng nhóm giới hạn tốc độ đọc, không phải nhóm tải xuống.
- Các tệp nhị phân trả về `415`.
- Giới hạn kích thước tệp: 200KB.
- Các lượt quét VirusTotal đang chờ xử lý không chặn thao tác đọc; các bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định kiểu cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (không bắt buộc)
- `tag` (không bắt buộc)

Ghi chú:

- Mặc định là bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Kho lưu trữ Plugin/gói là các tệp zip có thư mục gốc `package/` để các ứng dụng khách OpenClaw
  cũ tiếp tục hoạt động.
- Tuyến này chỉ hỗ trợ ZIP. Nó không truyền trực tiếp các tệp ClawPack `.tgz`.
- Phản hồi bao gồm các tiêu đề `ETag`, `Digest`, `X-ClawHub-Artifact-Type` và
  `X-ClawHub-Artifact-Sha256` để kiểm tra tính toàn vẹn của trình phân giải.
- Siêu dữ liệu chỉ dành cho sổ đăng ký không được chèn vào kho lưu trữ đã tải xuống.
- Các lượt quét VirusTotal đang chờ xử lý không chặn tải xuống; các bản phát hành độc hại trả về `403`.
- Các gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về packument tương thích với npm cho các phiên bản gói dựa trên ClawPack.

Ghi chú:

- Chỉ liệt kê các phiên bản có tarball npm-pack ClawPack đã được tải lên.
- Các phiên bản chỉ có ZIP cũ được chủ ý bỏ qua.
- `dist.tarball`, `dist.integrity` và `dist.shasum` sử dụng các trường tương thích
  với npm để người dùng có thể trỏ npm đến bản sao nếu muốn.
- Packument của gói có phạm vi hỗ trợ cả `/api/npm/@scope/name` và đường dẫn yêu cầu
  `/api/npm/@scope%2Fname` đã mã hóa của npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Truyền trực tiếp chính xác các byte tarball ClawPack đã tải lên cho ứng dụng khách bản sao npm.

Ghi chú:

- Sử dụng nhóm giới hạn tốc độ tải xuống.
- Các tiêu đề tải xuống bao gồm SHA-256 của ClawHub cùng với siêu dữ liệu integrity/shasum của npm.
- Các bước kiểm tra quyền truy cập đối với kiểm duyệt và gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI sử dụng để ánh xạ dấu vân tay cục bộ tới một phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 hệ thập lục phân gồm 64 ký tự của dấu vân tay gói

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống tệp ZIP của một phiên bản skill được lưu trữ, hoặc trả về thông tin chuyển giao nguồn GitHub cho một
skill hiện tại dựa trên GitHub có lượt quét `clean` hoặc `suspicious` và không có phiên bản
được lưu trữ.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên thẻ (ví dụ: `latest`)

Ghi chú:

- Nếu không cung cấp cả `version` lẫn `tag`, phiên bản mới nhất sẽ được sử dụng.
- Các phiên bản đã xóa mềm trả về `410`.
- Việc chuyển giao skill dựa trên GitHub không ủy nhiệm hoặc sao chép dữ liệu byte. Phản hồi JSON
  bao gồm `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  và `archiveUrl`; trạng thái quét/hiện tại là một điều kiện kiểm soát và không được đưa vào siêu dữ liệu
  của payload thành công.
- Thống kê lượt tải xuống được tính theo danh tính duy nhất mỗi ngày UTC (`userId` khi mã thông báo API hợp lệ, nếu không thì theo IP).

## Các endpoint xác thực (mã thông báo Bearer)

Tất cả endpoint đều yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực mã thông báo và trả về định danh người dùng.

### `POST /api/v1/skills`

Phát hành phiên bản mới.

- Khuyến nghị: `multipart/form-data` với JSON `payload` + các blob `files[]`.
- Phần thân JSON có `files` (dựa trên storageId) cũng được chấp nhận.
- Trường payload tùy chọn: `ownerHandle`. Khi có trường này, API phân giải
  nhà phát hành đó ở phía máy chủ và yêu cầu tác nhân phải có quyền truy cập nhà phát hành.
- Trường payload tùy chọn: `migrateOwner`. Khi `true` cùng với `ownerHandle`, một
  skill hiện có có thể chuyển sang chủ sở hữu đó nếu tác nhân là quản trị viên/chủ sở hữu của cả
  nhà phát hành hiện tại và nhà phát hành đích. Nếu không chủ động bật tùy chọn này, việc thay đổi chủ sở hữu
  sẽ bị từ chối.

### `POST /api/v1/packages`

Phát hành bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng mã thông báo Bearer.
- Yêu cầu `multipart/form-data`.
- Các trường biểu mẫu được phép là `payload`, các blob `files` lặp lại hoặc một tham chiếu tarball `clawpack`.
  `clawpack` có thể là blob `.tgz` hoặc mã định danh lưu trữ do quy trình URL tải lên trả về.
  Các lần phát hành theo mã định danh lưu trữ đã dàn dựng cũng phải bao gồm
  `clawpackUploadTicket` được trả về cùng URL tải lên đó.
- Chỉ sử dụng `files` hoặc `clawpack`, tuyệt đối không dùng cả hai trong cùng một yêu cầu.
- Phần thân JSON và siêu dữ liệu `payload.files` / `payload.artifact`
  do bên gọi cung cấp sẽ bị từ chối.
- Các yêu cầu phát hành multipart trực tiếp bị giới hạn ở 18MB. Tarball ClawPack có thể
  sử dụng quy trình URL tải lên với giới hạn tarball tối đa 120MB.
- Trường payload tùy chọn: `ownerHandle`. Khi có trường này, chỉ quản trị viên mới có thể phát hành thay mặt chủ sở hữu đó.

Các điểm chính về xác thực:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Các gói Plugin yêu cầu `openclaw.plugin.json`. Bản tải lên ClawPack `.tgz` phải
  chứa mục này tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, siêu dữ liệu kho lưu trữ nguồn, siêu dữ liệu commit
  nguồn, siêu dữ liệu lược đồ cấu hình, `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
- Chỉ nhà phát hành tổ chức `openclaw` và nhà phát hành cá nhân của các thành viên hiện tại
  thuộc tổ chức `openclaw` mới có thể phát hành lên kênh `official`.
- Các lần phát hành thay mặt vẫn xác thực điều kiện sử dụng kênh chính thức theo tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).

Phần thân JSON tùy chọn:

```json
{ "reason": "Tạm giữ để kiểm duyệt trong khi chờ xem xét pháp lý." }
```

Khi có, `reason` được lưu làm ghi chú kiểm duyệt skill và sao chép vào nhật ký kiểm toán.
Các lần xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày, sau đó slug có thể được
nhà phát hành khác xác nhận quyền sở hữu. Phản hồi xóa bao gồm `slugReservedUntil` khi thời hạn này được áp dụng.
Việc ẩn bởi người kiểm duyệt/quản trị viên và việc gỡ bỏ vì lý do bảo mật không hết hạn theo cách này.

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

Chỉ dành cho quản trị viên. Đảm bảo nhà phát hành tổ chức tồn tại cho một định danh. Nếu định danh vẫn trỏ đến
người dùng dùng chung/nhà phát hành cá nhân kiểu cũ, endpoint trước tiên sẽ di chuyển đối tượng đó thành nhà phát hành tổ chức.
Đối với tổ chức mới tạo, hãy cung cấp `memberHandle`; quản trị viên thực hiện thao tác không được thêm làm thành viên.
`memberRole` mặc định là `owner`.

- Phần thân: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Tạo nhà phát hành tổ chức theo hình thức tự phục vụ có xác thực. Tạo một nhà phát hành tổ chức mới và thêm
bên gọi làm chủ sở hữu. Endpoint này không di chuyển các định danh người dùng/cá nhân hiện có và không
đánh dấu nhà phát hành là đáng tin cậy/chính thức.

- Phần thân: `{ "handle": "opik", "displayName": "Opik" }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Trả về `409` khi định danh đã được một nhà phát hành, người dùng hoặc nhà phát hành cá nhân sử dụng.

### `POST /api/v1/users/reserve`

Chỉ dành cho quản trị viên. Giữ trước các slug gốc và tên gói cho chủ sở hữu hợp pháp mà không phát hành
bản phát hành. Tên gói trở thành các gói giữ chỗ riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu có thể phát hành bản code-plugin hoặc bundle-plugin thực tế vào tên đó sau này.

- Phần thân: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Phản hồi: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Chỉ dành cho quản trị viên. Khôi phục nhà phát hành cá nhân cho một chủ thể GitHub OAuth thay thế đã xác minh
mà không chỉnh sửa các hàng tài khoản Convex Auth. Yêu cầu phải nêu cả hai mã định danh tài khoản nhà cung cấp GitHub
bất biến; các định danh có thể thay đổi chỉ được dùng làm điều kiện kiểm tra dành cho người vận hành.

Endpoint mặc định chạy thử. Việc áp dụng khôi phục yêu cầu `dryRun: false` và
`confirmIdentityVerified: true` sau khi nhân viên xác minh độc lập tính liên tục giữa cả hai
chủ thể GitHub. Quá trình khôi phục sẽ từ chối an toàn khi nhà phát hành cá nhân hiện tại của người dùng đích
có skill, gói hoặc nguồn skill GitHub.
Quá trình khôi phục cũng di chuyển các trường `ownerUserId` kiểu cũ cho các skill của nhà phát hành được khôi phục,
bí danh slug của skill, gói, cảnh báo trình kiểm tra gói và các hàng bản tóm lược tìm kiếm dẫn xuất để
các đường dẫn chủ sở hữu trực tiếp nhất quán với quyền hạn nhà phát hành mới. Một mục giữ chỗ định danh được bảo vệ
đang hoạt động cho định danh được khôi phục cũng được chuyển cho người dùng thay thế để quá trình
đồng bộ hóa hồ sơ sau này không thể khôi phục quyền hạn cạnh tranh của người dùng trước đây. Mỗi bảng chính bị giới hạn ở
100 hàng cho mỗi giao dịch áp dụng; các lần khôi phục lớn hơn trước tiên phải sử dụng quy trình di chuyển chủ sở hữu có thể tiếp tục.
Nguồn skill GitHub có phạm vi theo nhà phát hành và được báo cáo là đã kiểm tra thay vì được ghi lại.

- Phần thân: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Phản hồi: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Các endpoint quản lý slug của chủ sở hữu

- `POST /api/v1/skills/{slug}/rename`
  - Phần thân: `{ "newSlug": "new-canonical-slug" }`
  - Phản hồi: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Phần thân: `{ "targetSlug": "canonical-target-slug" }`
  - Phản hồi: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Ghi chú:

- Cả hai endpoint đều yêu cầu xác thực bằng mã thông báo API và chỉ hoạt động đối với chủ sở hữu skill.
- `rename` giữ slug trước đó làm bí danh chuyển hướng.
- `merge` ẩn mục nguồn và chuyển hướng slug nguồn đến mục đích.

### Các endpoint chuyển quyền sở hữu

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

Bỏ cấm người dùng và khôi phục các skill đủ điều kiện (chỉ quản trị viên).

Phần thân:

```json
{ "handle": "user_handle", "reason": "lý do bỏ cấm tùy chọn" }
```

hoặc

```json
{ "userId": "users_...", "reason": "lý do bỏ cấm tùy chọn" }
```

Phản hồi:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Thay đổi lý do đã lưu của một lệnh cấm hiện có mà không bỏ cấm hoặc khôi phục
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

Thêm/xóa dấu sao (điểm nổi bật). Cả hai endpoint đều có tính lũy đẳng.

Phản hồi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Các endpoint CLI kiểu cũ (không còn được khuyến nghị)

Vẫn được hỗ trợ cho các phiên bản CLI cũ hơn:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch loại bỏ.

`POST /api/cli/upload-url` trả về `uploadUrl` và `uploadTicket`. Các lần
phát hành gói dàn dựng tarball ClawPack phải gửi mã định danh lưu trữ thu được dưới dạng
`clawpack` và vé được trả về dưới dạng `clawpackUploadTicket`.

## Khám phá registry (`/.well-known/clawhub.json`)

CLI có thể khám phá các cài đặt registry/xác thực từ trang web:

- `/.well-known/clawhub.json` (JSON, khuyến nghị)
- `/.well-known/clawdhub.json` (kiểu cũ)

Lược đồ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu bạn tự lưu trữ, hãy phục vụ tệp này (hoặc đặt `CLAWHUB_REGISTRY` một cách tường minh; `CLAWDHUB_REGISTRY` kiểu cũ).
