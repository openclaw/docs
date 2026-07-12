---
read_when:
    - Thêm/thay đổi các điểm cuối
    - Gỡ lỗi các yêu cầu CLI ↔ registry
summary: Tài liệu tham khảo HTTP API (công khai + các endpoint CLI + xác thực).
x-i18n:
    generated_at: "2026-07-12T07:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL cơ sở: `https://clawhub.ai` (mặc định).

Tất cả đường dẫn v1 đều nằm dưới `/api/v1/...`.
Các đường dẫn cũ `/api/...` và `/api/cli/...` vẫn được duy trì để tương thích (xem `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Tái sử dụng danh mục công khai

Các thư mục của bên thứ ba có thể sử dụng các endpoint đọc công khai để liệt kê hoặc tìm kiếm Skills trên ClawHub. Vui lòng lưu kết quả vào bộ nhớ đệm, tuân thủ `429`/`Retry-After`, liên kết người dùng trở lại trang ClawHub chính thức (`https://clawhub.ai/<owner>/skills/<slug>`) và tránh ngụ ý rằng ClawHub xác nhận hoặc bảo chứng cho trang web của bên thứ ba. Không cố gắng sao chép nội dung bị ẩn, riêng tư hoặc bị kiểm duyệt chặn ra ngoài phạm vi API công khai.

Các đường dẫn tắt dạng slug trên web được phân giải trên nhiều họ registry, nhưng máy khách API nên sử dụng
các URL chính thức do endpoint đọc trả về thay vì tự tái tạo thứ tự
ưu tiên định tuyến.

## Giới hạn tốc độ

Mô hình thực thi:

- Yêu cầu ẩn danh: áp dụng theo từng IP.
- Yêu cầu đã xác thực (token Bearer hợp lệ): áp dụng theo hạn mức của từng người dùng.
- Nếu thiếu token hoặc token không hợp lệ, hành vi sẽ quay về áp dụng theo IP.
- Các endpoint ghi đã xác thực không nên chỉ trả về `Unauthorized` đơn thuần khi
  máy chủ biết nguyên nhân. Token bị thiếu, token không hợp lệ/đã bị thu hồi và
  tài khoản đã bị xóa/cấm/vô hiệu hóa cần nhận được thông báo có hướng xử lý để máy khách CLI
  có thể cho người dùng biết điều gì đã chặn họ.

- Đọc: 3000/phút cho mỗi IP, 12000/phút cho mỗi khóa
- Ghi: 300/phút cho mỗi IP, 3000/phút cho mỗi khóa
- Tải xuống: 1200/phút cho mỗi IP, 6000/phút cho mỗi khóa (các endpoint tải xuống)

Header:

- Tương thích cũ: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Chuẩn hóa: `RateLimit-Limit`, `RateLimit-Reset`
- Khi nhận `429`: `X-RateLimit-Remaining: 0` và `RateLimit-Remaining: 0`
- Khi nhận `429`: `Retry-After`

Ngữ nghĩa của header:

- `X-RateLimit-Reset`: số giây epoch Unix tuyệt đối
- `RateLimit-Reset`: số giây cho đến khi đặt lại (độ trễ)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: hạn mức chính xác còn lại khi có.
  Các yêu cầu phân mảnh thành công sẽ bỏ qua header này thay vì trả về giá trị toàn cục gần đúng.
- `Retry-After`: số giây cần chờ trước khi thử lại (độ trễ) khi nhận `429`

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

Hướng dẫn cho máy khách:

- Nếu có `Retry-After`, hãy chờ số giây đó trước khi thử lại.
- Sử dụng thời gian chờ lùi có độ nhiễu để tránh các lần thử lại đồng bộ.
- Nếu thiếu `Retry-After`, hãy quay về dùng `RateLimit-Reset` (hoặc tính từ `X-RateLimit-Reset`).

Nguồn IP:

- Chỉ sử dụng các header IP máy khách đáng tin cậy, bao gồm `cf-connecting-ip`, khi
  môi trường triển khai bật rõ ràng các header chuyển tiếp đáng tin cậy.
- ClawHub sử dụng các header chuyển tiếp đáng tin cậy để xác định IP máy khách tại biên mạng.
- Nếu không có IP máy khách đáng tin cậy, các yêu cầu ẩn danh sử dụng các nhóm dự phòng
  chỉ được xác định theo loại giới hạn tốc độ. Các nhóm dự phòng này không bao gồm
  đường dẫn, slug, tên gói, phiên bản, chuỗi truy vấn hoặc tham số
  tài nguyên khác do bên gọi cung cấp.

## Phản hồi lỗi

Các phản hồi lỗi v1 công khai là văn bản thuần túy với `content-type: text/plain; charset=utf-8`.
Điều này bao gồm lỗi xác thực dữ liệu (`400`), tài nguyên công khai không tồn tại (`404`), lỗi xác thực và
quyền truy cập (`401`/`403`), giới hạn tốc độ (`429`) và lượt tải xuống bị chặn. Máy khách
nên đọc nội dung phản hồi dưới dạng chuỗi mà con người có thể đọc được. Các tham số truy vấn không xác định được
bỏ qua để đảm bảo tương thích, nhưng các tham số truy vấn đã được nhận diện có giá trị không hợp lệ sẽ trả về
`400`.

## Endpoint công khai (không cần xác thực)

### `GET /api/v1/search`

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên
- `highlightedOnly` (tùy chọn): `true` để chỉ lọc các Skills nổi bật
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các Skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ của `nonSuspiciousOnly`

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

- Kết quả được trả về theo thứ tự liên quan (độ tương đồng embedding + mức tăng hạng khi token slug/tên khớp chính xác + một mức ưu tiên nhỏ cho độ phổ biến).
- Mức độ liên quan quan trọng hơn độ phổ biến. Token slug hoặc tên hiển thị khớp chính xác có thể xếp trên một kết quả khớp lỏng hơn dù kết quả đó có mức độ tương tác cao hơn nhiều.
- Văn bản ASCII được tách token tại ranh giới từ và dấu câu. Ví dụ, `personal-map` chứa token `map` độc lập, còn `amap-jsapi-skill` chứa `amap`, `jsapi` và `skill`; vì vậy, tìm kiếm `map` sẽ cho `personal-map` mức khớp từ vựng mạnh hơn `amap-jsapi-skill`.
- Độ phổ biến được điều chỉnh theo thang logarit và có giới hạn trần. Skills có mức tương tác cao vẫn có thể xếp thấp hơn khi văn bản truy vấn khớp yếu hơn.
- Trạng thái kiểm duyệt đáng ngờ hoặc bị ẩn có thể loại một Skill khỏi tìm kiếm công khai tùy theo bộ lọc của bên gọi và trạng thái kiểm duyệt hiện tại.

Hướng dẫn tăng khả năng tìm thấy cho nhà phát hành:

- Đưa các thuật ngữ mà người dùng thực sự sẽ tìm kiếm vào tên hiển thị, phần tóm tắt và thẻ. Chỉ sử dụng token slug độc lập khi đó cũng là định danh ổn định mà bạn muốn duy trì.
- Không đổi tên slug chỉ để nhắm đến một truy vấn, trừ khi slug mới là tên chính thức dài hạn phù hợp hơn. Slug cũ trở thành bí danh chuyển hướng, nhưng URL chính thức, slug được hiển thị và các bản tổng hợp tìm kiếm trong tương lai sẽ sử dụng slug mới.
- Bí danh đổi tên duy trì khả năng phân giải cho URL cũ và các bản cài đặt phân giải thông qua registry, nhưng thứ hạng tìm kiếm dựa trên siêu dữ liệu chính thức của Skill sau khi việc đổi tên được lập chỉ mục. Số liệu thống kê hiện có vẫn được giữ lại cho Skill.
- Nếu một Skill bất ngờ không hiển thị, trước tiên hãy kiểm tra trạng thái kiểm duyệt bằng `clawhub inspect @owner/slug` trong khi đã đăng nhập, trước khi thay đổi siêu dữ liệu liên quan đến xếp hạng.

### `GET /api/v1/skills`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–200)
- `cursor` (tùy chọn): con trỏ phân trang cho mọi kiểu sắp xếp không phải `trending`
- `sort` (tùy chọn): `updated` (mặc định), `recommended` (bí danh: `default`), `createdAt` (bí danh: `newest`), `downloads`, `stars` (bí danh: `rating`), các bí danh lượt cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ sang `downloads`, `trending`
- `nonSuspiciousOnly` (tùy chọn): `true` để ẩn các Skills đáng ngờ (`flagged.suspicious`)
- `nonSuspicious` (tùy chọn): bí danh cũ của `nonSuspiciousOnly`

Giá trị `sort` không hợp lệ sẽ trả về `400`.

Ghi chú:

- `recommended` sử dụng các tín hiệu về mức độ tương tác và độ mới.
- `trending` xếp hạng theo lượt cài đặt trong 7 ngày gần nhất (dựa trên dữ liệu đo từ xa).
- `createdAt` ổn định khi thu thập Skills mới; `updated` thay đổi khi các Skills hiện có được phát hành lại.
- Khi `nonSuspiciousOnly=true`, các kiểu sắp xếp dựa trên con trỏ có thể trả về ít mục hơn `limit` trên một trang vì các Skills đáng ngờ được lọc sau khi truy xuất trang.
- Sử dụng `nextCursor` để tiếp tục phân trang khi có. Chỉ riêng việc một trang có ít mục không có nghĩa là đã hết kết quả.

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

- Các slug cũ được tạo bởi quy trình đổi tên/hợp nhất của chủ sở hữu sẽ phân giải đến Skill chính thức.
- `metadata.os`: các giới hạn hệ điều hành được khai báo trong frontmatter của Skill (ví dụ: `["macos"]`, `["linux"]`). Là `null` nếu không được khai báo.
- `metadata.systems`: các hệ thống đích của Nix (ví dụ: `["aarch64-darwin", "x86_64-linux"]`). Là `null` nếu không được khai báo.
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

- Chủ sở hữu và người kiểm duyệt có thể truy cập thông tin kiểm duyệt chi tiết của Skills bị ẩn.
- Bên gọi công khai chỉ nhận được `200` đối với các Skills hiển thị đã bị gắn cờ.
- Bằng chứng được biên tập ẩn đối với bên gọi công khai và chỉ bao gồm đoạn trích thô đối với chủ sở hữu/người kiểm duyệt.

### `POST /api/v1/skills/{slug}/report`

Báo cáo một Skill để người kiểm duyệt xem xét. Báo cáo áp dụng ở cấp Skill, có thể tùy chọn liên kết
với một phiên bản và được đưa vào hàng đợi báo cáo Skill.

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

Endpoint dành cho người kiểm duyệt/quản trị viên để tiếp nhận báo cáo Skill.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `confirmed`, `dismissed` hoặc `all`
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

Endpoint dành cho người kiểm duyệt/quản trị viên để xử lý hoặc mở lại báo cáo Skill.

Yêu cầu:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt lại `status` thành `open`. Truyền `finalAction: "hide"` cùng với một báo cáo đã được
phân loại để ẩn Skill trong cùng một quy trình có thể kiểm toán.

### `GET /api/v1/skills/{slug}/versions`

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên
- `cursor` (tùy chọn): con trỏ phân trang

### `GET /api/v1/skills/{slug}/versions/{version}`

Trả về siêu dữ liệu phiên bản + danh sách tệp.

- `version.security` bao gồm trạng thái xác minh quét đã chuẩn hóa và thông tin chi tiết về trình quét
  (VirusTotal + LLM), khi có.

### `GET /api/v1/skills/{slug}/scan`

Trả về thông tin chi tiết về việc xác minh quét bảo mật cho một phiên bản Skill.

Tham số truy vấn:

- `version` (tùy chọn): chuỗi phiên bản cụ thể.
- `tag` (tùy chọn): phân giải một phiên bản được gắn thẻ (ví dụ: `latest`).

Ghi chú:

- Nếu không cung cấp cả `version` lẫn `tag`, phiên bản mới nhất sẽ được sử dụng.
- Bao gồm trạng thái xác minh đã chuẩn hóa cùng các chi tiết dành riêng cho từng trình quét.
- `security.hasScanResult` chỉ là `true` khi một trình quét đưa ra kết luận dứt khoát (`clean`, `suspicious` hoặc `malicious`).
- `moderation` là bản chụp nhanh kiểm duyệt hiện tại ở cấp độ skill, được suy ra từ phiên bản mới nhất.
- Khi truy vấn một phiên bản trong quá khứ, hãy kiểm tra `moderation.matchesRequestedVersion` và `moderation.sourceVersion` trước khi coi `moderation` và `security` là thuộc cùng ngữ cảnh phiên bản.

### `POST /api/v1/skills/-/scan`

Điểm cuối gửi có xác thực dành cho các tác vụ ClawScan mới.

Quét bản tải lên cục bộ không còn được hỗ trợ. Các yêu cầu sử dụng
`multipart/form-data` hoặc `{ "source": { "kind": "upload" } }` sẽ trả về `410`.

Các lượt quét đã phát hành sử dụng JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Lưu ý:

- Tải trọng yêu cầu quét và báo cáo có thể tải xuống sẽ hết hạn trong kho yêu cầu quét sau khoảng thời gian lưu giữ.
- Các lượt quét đã phát hành yêu cầu quyền quản lý của chủ sở hữu/nhà phát hành hoặc thẩm quyền của người kiểm duyệt/quản trị viên nền tảng.
- Các lượt quét đã phát hành chỉ ghi ngược kết quả khi `update: true` và quá trình quét hoàn tất thành công.
- Phản hồi là `202` với `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Các tác vụ quét chạy bất đồng bộ. Yêu cầu quét thủ công được ưu tiên trước công việc phát hành/bổ sung dữ liệu thông thường, nhưng việc hoàn tất vẫn phụ thuộc vào tình trạng sẵn sàng của worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Điểm cuối thăm dò có xác thực dành cho lượt quét đã gửi.

- Trả về trạng thái đang chờ/đang chạy/thành công/thất bại.
- Trả về `queue.queuedAhead` và `queue.position` trong khi đang chờ để ứng dụng khách có thể hiển thị số lượt quét thủ công ưu tiên đang đứng trước yêu cầu. Các hàng đợi rất lớn được giới hạn và báo cáo với `queuedAheadIsEstimate: true`.
- Khi có sẵn, `report` chứa các phần `clawscan`, `skillspector`, `staticAnalysis` và `virustotal`.
- Tác vụ quét thất bại trả về `status: "failed"` cùng `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Điểm cuối kho lưu trữ báo cáo có xác thực.

- Yêu cầu lượt quét đã thành công; các lượt quét chưa ở trạng thái kết thúc sẽ trả về `409`.
- Trả về tệp ZIP gồm `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` và `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Điểm cuối kho lưu trữ báo cáo đã lưu có xác thực dành cho các phiên bản đã gửi.

- Yêu cầu quyền quản lý của chủ sở hữu/nhà phát hành đối với skill hoặc plugin, hoặc thẩm quyền của người kiểm duyệt/quản trị viên nền tảng.
- Trả về kết quả quét đã lưu cho đúng phiên bản đã gửi, bao gồm cả các phiên bản bị chặn hoặc ẩn.
- `kind` mặc định là `skill`; sử dụng `kind=plugin` cho các lượt quét plugin/gói.
- Trả về cấu trúc ZIP giống như bản tải xuống của yêu cầu quét.

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

- `ok` chỉ là `true` khi phiên bản đã chọn có Thẻ Skill được tạo, không bị kiểm duyệt chặn vì phần mềm độc hại và kết quả xác minh ClawScan là sạch.
- Danh tính skill, danh tính nhà phát hành và siêu dữ liệu phiên bản đã chọn là các trường cấp cao nhất trong phong bì (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) để quy trình tự động hóa shell có thể đọc chúng mà không cần giải nén các lớp bọc lồng nhau.
- `security` là kết luận ClawScan/bảo mật cấp cao nhất. Quy trình tự động hóa nên dựa vào `ok`, `decision`, `reasons` và `security.status`.
- `security.signals` chứa bằng chứng hỗ trợ từ trình quét như `staticScan`, `virusTotal` và `skillSpector`.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét kiểm tra sự tồn tại của sổ đăng ký phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- `provenance` chỉ là `server-resolved-github-import` khi ClawHub đã phân giải và lưu kho lưu trữ/tham chiếu/commit/đường dẫn GitHub trong quá trình phát hành hoặc nhập; nếu không, giá trị là `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Trả về các kết luận bảo mật rút gọn hiện tại cho chính xác các phiên bản skill. Điểm cuối
tập hợp này dành cho các ứng dụng khách đã biết cần hiển thị những phiên bản
skill ClawHub nào đã cài đặt, chẳng hạn như giao diện điều khiển OpenClaw.

Yêu cầu:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Lưu ý:

- `items` phải chứa từ 1 đến 100 cặp `{ slug, version }` duy nhất.
- Kết quả được trả về theo từng mục; một skill hoặc phiên bản bị thiếu không làm toàn bộ phản hồi thất bại.
- Phản hồi chỉ chứa thông tin bảo mật. Phản hồi không bao gồm dữ liệu Thẻ Skill, trạng thái tạo thẻ, danh sách tệp hiện vật hoặc tải trọng chi tiết của trình quét.
- `security.signals` chỉ chứa bằng chứng hỗ trợ ở cấp trạng thái; sử dụng `/scan` hoặc trang kiểm tra bảo mật của ClawHub để xem đầy đủ chi tiết trình quét.
- `security.signals.dependencyRegistry` được giữ lại để tương thích với phản hồi v1, nhưng trình quét kiểm tra sự tồn tại của sổ đăng ký phụ thuộc đã ngừng hoạt động và khóa này luôn là `null`.
- Việc thiếu Thẻ Skill không ảnh hưởng đến `ok`, `decision` hoặc `reasons` của điểm cuối này; ứng dụng khách nên đọc `skill-card.md` đã cài đặt tại máy cục bộ khi cần nội dung thẻ.
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
- `version` (không bắt buộc)
- `tag` (không bắt buộc)

Lưu ý:

- Mặc định sử dụng phiên bản mới nhất.
- Giới hạn kích thước tệp: 200KB.

### `GET /api/v1/packages`

Điểm cuối danh mục hợp nhất cho:

- Skills
- Plugin mã
- Plugin gói

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên (1–100)
- `cursor` (không bắt buộc): con trỏ phân trang
- `family` (không bắt buộc): `skill`, `code-plugin` hoặc `bundle-plugin`
- `channel` (không bắt buộc): `official`, `community` hoặc `private`
- `isOfficial` (không bắt buộc): `true` hoặc `false`
- `sort` (không bắt buộc): `updated` (mặc định), `recommended`, `trending`, `downloads`, bí danh cũ `installs`
- `category` (không bắt buộc): bộ lọc danh mục Plugin. Chỉ được hỗ trợ khi
  yêu cầu có phạm vi là các gói Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` hoặc các điểm cuối gói có
  `family=code-plugin`/`family=bundle-plugin`). Các danh mục được kiểm soát và
  bí danh bộ lọc v1 cũ được ghi lại trong phần `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` hoặc `sort` trả về `400`. Các tham số truy vấn không xác định sẽ bị bỏ qua.
- `GET /api/v1/code-plugins` và `GET /api/v1/bundle-plugins` vẫn là các bí danh có họ cố định.
- Các mục Skills vẫn được hỗ trợ bởi sổ đăng ký Skills và chỉ có thể được phát hành thông qua `POST /api/v1/skills`.
- `POST /api/v1/packages` vẫn chỉ dành cho các bản phát hành Plugin mã và Plugin gói.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể thấy các gói riêng tư của những nhà phát hành mà họ thuộc về trong kết quả danh sách/tìm kiếm.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/packages/search`

Tìm kiếm danh mục hợp nhất trên Skills và các gói Plugin.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (không bắt buộc): số nguyên (1–100)
- `family` (không bắt buộc): `skill`, `code-plugin` hoặc `bundle-plugin`
- `channel` (không bắt buộc): `official`, `community` hoặc `private`
- `isOfficial` (không bắt buộc): `true` hoặc `false`
- `category` (không bắt buộc): bộ lọc danh mục Plugin. Chỉ được hỗ trợ khi
  yêu cầu có phạm vi là các gói Plugin. Các danh mục được kiểm soát và bí danh
  bộ lọc v1 cũ được ghi lại trong phần `GET /api/v1/plugins`.

Lưu ý:

- Các giá trị không hợp lệ cho `family`, `channel`, `isOfficial`, `featured` hoặc
  `highlightedOnly` trả về `400`. Các tham số truy vấn không xác định sẽ bị bỏ qua.
- Người gọi ẩn danh chỉ thấy các kênh gói công khai.
- Người gọi đã xác thực có thể tìm kiếm các gói riêng tư của những nhà phát hành mà họ thuộc về.
- `channel=private` chỉ trả về các gói mà người gọi đã xác thực có thể đọc.

### `GET /api/v1/plugins`

Duyệt danh mục chỉ dành cho Plugin trên các gói Plugin mã và Plugin gói.

Tham số truy vấn:

- `limit` (không bắt buộc): số nguyên (1-100)
- `cursor` (không bắt buộc): con trỏ phân trang
- `isOfficial` (không bắt buộc): `true` hoặc `false`
- `sort` (không bắt buộc): `recommended` (mặc định), `trending`, `downloads`, `updated`, bí danh cũ `installs`
- `category` (không bắt buộc): bộ lọc danh mục Plugin. Các giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Các bí danh bộ lọc v1 cũ vẫn được chấp nhận trên các điểm cuối đọc:

- `mcp-tooling`, `data` và `automation` được phân giải thành `tools`.
- `observability` và `deployment` được phân giải thành `gateway`.
- `dev-tools` được phân giải thành `runtime`.

`trending` là bảng xếp hạng lượt cài đặt/tải xuống trong bảy ngày và không sử dụng tổng số của toàn bộ thời gian.
Trên điểm cuối hợp nhất `/api/v1/packages`, tùy chọn này chỉ dành cho Plugin; hãy dùng
`/api/v1/skills?sort=trending` cho danh mục Skills.

Các bí danh cũ không được chấp nhận làm giá trị danh mục được lưu trữ hoặc do tác giả khai báo.

### `GET /api/v1/skills/export`

Xuất hàng loạt các Skills công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Bắt buộc có mã thông báo API.

Tham số truy vấn:

- `startDate` (bắt buộc): cận dưới theo mili giây Unix cho `updatedAt` của Skills.
- `endDate` (bắt buộc): cận trên theo mili giây Unix cho `updatedAt` của Skills.
- `limit` (không bắt buộc): số nguyên (1-250), mặc định `250`.
- `cursor` (không bắt buộc): con trỏ phân trang từ phản hồi trước.

Phản hồi:

- Nội dung: tệp lưu trữ ZIP.
- Mỗi Skills được xuất có thư mục gốc tại `{publisher}/{slug}/`.
- Các Skills được lưu trữ trên máy chủ bao gồm các tệp của phiên bản được lưu mới nhất và được liệt kê trong
  `_manifest.json` với `sourceRef: "public-clawhub"`.
- Các Skills hiện tại được hỗ trợ bởi GitHub với kết quả quét `clean` hoặc `suspicious` bao gồm
  `_source_handoff.json` với `sourceRef: "public-github"`, kho lưu trữ, commit, đường dẫn,
  hàm băm nội dung và URL tệp lưu trữ. Chúng không bao gồm các tệp nguồn được lưu trữ trên ClawHub.
- Mỗi Skills bao gồm `_export_skill_meta.json`.
- `_manifest.json` luôn được bao gồm tại thư mục gốc của tệp ZIP.
- `_errors.json` được bao gồm khi không thể xuất riêng lẻ một số Skills hoặc tệp.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Xuất hàng loạt các bản phát hành Plugin công khai mới nhất để phân tích ngoại tuyến.

Xác thực:

- Bắt buộc có mã thông báo API.

Tham số truy vấn:

- `startDate` (bắt buộc): giới hạn dưới theo mili giây Unix cho `updatedAt` của Plugin.
- `endDate` (bắt buộc): giới hạn trên theo mili giây Unix cho `updatedAt` của Plugin.
- `limit` (tùy chọn): số nguyên (1-250), mặc định là `250`.
- `cursor` (tùy chọn): con trỏ phân trang từ phản hồi trước.
- `family` (tùy chọn): `code-plugin` hoặc `bundle-plugin`. Nếu bỏ qua thì bao gồm cả hai họ Plugin.

Phản hồi:

- Nội dung: kho lưu trữ ZIP.
- Mỗi Plugin được xuất có thư mục gốc tại `{family}/{packageName}/`.
- Mỗi Plugin được xuất bao gồm các tệp đã lưu của bản phát hành mới nhất.
- Siêu dữ liệu xuất của từng Plugin được lưu tại `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` luôn được bao gồm tại thư mục gốc của ZIP.
- `_errors.json` được bao gồm khi không thể xuất một số Plugin hoặc tệp riêng lẻ.

Tiêu đề:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Chỉ tìm kiếm Plugin trong các gói `code-plugin` và `bundle-plugin`.

Tham số truy vấn:

- `q` (bắt buộc): chuỗi truy vấn
- `limit` (tùy chọn): số nguyên (1-100)
- `isOfficial` (tùy chọn): `true` hoặc `false`
- `category` (tùy chọn): bộ lọc danh mục Plugin. Các giá trị hiện tại:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Ghi chú:

- Các bí danh bộ lọc v1 cũ được ghi lại trong `GET /api/v1/plugins` cũng được chấp nhận.
- Lọc theo danh mục là một bộ lọc API thực sự được hỗ trợ bởi các hàng bản tóm lược danh mục Plugin, không phải thao tác viết lại truy vấn tìm kiếm.
- Kết quả được trả về theo thứ tự liên quan và hiện không hỗ trợ phân trang.
- Các điều khiển sắp xếp trên giao diện trình duyệt dành cho tìm kiếm Plugin sẽ sắp xếp lại các kết quả liên quan đã tải, khớp với hành vi duyệt `/skills` hiện tại.

### `GET /api/v1/packages/{name}`

Trả về siêu dữ liệu chi tiết của gói.

Ghi chú:

- Skills cũng có thể được phân giải qua tuyến này trong danh mục hợp nhất.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `DELETE /api/v1/packages/{name}`

Xóa mềm một gói và tất cả các bản phát hành.

Ghi chú:

- Yêu cầu mã thông báo API của chủ sở hữu gói, chủ sở hữu/quản trị viên của tổ chức phát hành, người kiểm duyệt nền tảng hoặc quản trị viên nền tảng.

### `GET /api/v1/packages/{name}/versions`

Trả về lịch sử phiên bản.

Tham số truy vấn:

- `limit` (tùy chọn): số nguyên (1–100)
- `cursor` (tùy chọn): con trỏ phân trang

Ghi chú:

- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}`

Trả về một phiên bản gói, bao gồm siêu dữ liệu tệp, khả năng tương thích, thông tin xác minh, siêu dữ liệu tạo tác và dữ liệu quét.

Ghi chú:

- `version.artifact.kind` là `legacy-zip` đối với các kho lưu trữ gói kiểu cũ hoặc `npm-pack` đối với các bản phát hành dựa trên ClawPack.
- Các bản phát hành ClawPack bao gồm các trường tương thích với npm là `npmIntegrity`, `npmShasum` và `npmTarballName`.
- `version.sha256hash` là siêu dữ liệu tương thích đã lỗi thời dành cho các máy khách cũ. Trường này băm chính xác các byte ZIP được trả về bởi `/api/v1/packages/{name}/download`. Các máy khách hiện đại nên sử dụng `version.artifact.sha256`, trường nhận diện tạo tác bản phát hành chuẩn.
- `version.vtAnalysis`, `version.llmAnalysis` và `version.staticScan` được bao gồm khi có dữ liệu quét.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Trả về bản tóm tắt chính xác về bảo mật và độ tin cậy của bản phát hành gói cho các máy khách cài đặt. Đây là bề mặt sử dụng OpenClaw công khai để quyết định liệu một bản phát hành đã phân giải có thể được cài đặt hay không.

Xác thực:

- Điểm cuối đọc công khai. Không yêu cầu mã thông báo của chủ sở hữu, nhà phát hành, người kiểm duyệt hoặc quản trị viên.

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

Các trường phản hồi:

- `package.name`, `package.displayName` và `package.family` nhận diện gói kho đăng ký đã phân giải.
- `release.releaseId`, `release.version` và `release.createdAt` nhận diện chính xác bản phát hành đã được đánh giá.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`, `release.npmShasum` và `release.npmTarballName` xuất hiện khi có thông tin về tạo tác bản phát hành.
- `trust.scanStatus` là trạng thái tin cậy có hiệu lực được suy ra từ đầu vào của trình quét và hoạt động kiểm duyệt bản phát hành thủ công.
- `trust.moderationState` có thể là null. Giá trị là `null` khi không có hoạt động kiểm duyệt bản phát hành thủ công.
- `trust.blockedFromDownload` là tín hiệu chặn cài đặt. OpenClaw và các máy khách cài đặt khác nên chặn cài đặt khi giá trị này là `true`, thay vì tự suy diễn lại các quy tắc chặn từ trường trình quét hoặc kiểm duyệt.
- `trust.reasons` là danh sách giải thích dành cho người dùng và mục đích kiểm toán. Mã lý do là các chuỗi ngắn gọn, ổn định như `manual:quarantined`, `scan:malicious` và `package:malicious`.
- `trust.pending` có nghĩa là một hoặc nhiều đầu vào về độ tin cậy vẫn đang chờ hoàn tất.
- `trust.stale` có nghĩa là bản tóm tắt độ tin cậy được tính từ các đầu vào lỗi thời và nên được xem là cần làm mới trước khi đưa ra quyết định cho phép với độ tin cậy cao.

Ghi chú:

- Điểm cuối này áp dụng chính xác cho từng phiên bản. Máy khách nên gọi điểm cuối sau khi phân giải phiên bản gói mà chúng định cài đặt, không chỉ sau khi đọc siêu dữ liệu gói mới nhất.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.
- Điểm cuối này được chủ ý thiết kế hẹp hơn các điểm cuối kiểm duyệt dành cho chủ sở hữu/người kiểm duyệt. Điểm cuối cung cấp quyết định cài đặt và giải thích công khai, không cung cấp danh tính người báo cáo, nội dung báo cáo, bằng chứng riêng tư hoặc tiến trình đánh giá nội bộ.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Trả về siêu dữ liệu của trình phân giải tạo tác tường minh cho một phiên bản gói.

Ghi chú:

- Các phiên bản gói cũ trả về tạo tác `legacy-zip` và `downloadUrl` ZIP cũ.
- Các phiên bản ClawPack trả về tạo tác `npm-pack`, các trường toàn vẹn npm, một `tarballUrl` và URL tương thích ZIP cũ.
- Đây là bề mặt trình phân giải OpenClaw; nó tránh việc phỏng đoán định dạng kho lưu trữ từ một URL dùng chung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Tải xuống tạo tác phiên bản thông qua đường dẫn trình phân giải tường minh.

Ghi chú:

- Các phiên bản ClawPack truyền trực tiếp chính xác các byte `.tgz` npm-pack đã tải lên.
- Các phiên bản ZIP cũ chuyển hướng đến `/api/v1/packages/{name}/download?version=`.
- Sử dụng nhóm giới hạn tốc độ tải xuống.

### `GET /api/v1/packages/{name}/readiness`

Trả về mức độ sẵn sàng được tính toán cho việc sử dụng OpenClaw trong tương lai.

Các kiểm tra mức độ sẵn sàng bao gồm:

- trạng thái kênh chính thức
- tính khả dụng của phiên bản mới nhất
- tính khả dụng của tạo tác npm-pack ClawPack
- bản tóm lược tạo tác
- nguồn gốc kho mã nguồn và commit
- siêu dữ liệu tương thích OpenClaw
- các đích máy chủ
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

Điểm cuối dành cho người kiểm duyệt để liệt kê các hàng di chuyển Plugin OpenClaw chính thức.

Xác thực:

- Yêu cầu mã thông báo API của người dùng kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `phase` (tùy chọn): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` hoặc
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

- `bundledPluginId` được chuẩn hóa thành chữ thường và là khóa cập nhật hoặc chèn ổn định.
- `packageName` được chuẩn hóa theo tên npm; gói có thể chưa tồn tại đối với các đợt di chuyển đã lên kế hoạch.
- Phần này chỉ theo dõi mức độ sẵn sàng di chuyển. Nó không sửa đổi OpenClaw hoặc tạo ClawPack.

### `GET /api/v1/packages/moderation/queue`

Điểm cuối dành cho người kiểm duyệt/quản trị viên để truy cập hàng đợi đánh giá bản phát hành gói.

Xác thực:

- Yêu cầu mã thông báo API của người dùng kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `blocked`, `manual` hoặc `all`
- `limit` (tùy chọn): số nguyên (1-100)
- `cursor` (tùy chọn): con trỏ phân trang

Ý nghĩa trạng thái:

- `open`: các bản phát hành đáng ngờ, độc hại, đang chờ xử lý, bị cách ly, bị thu hồi hoặc bị báo cáo.
- `blocked`: các bản phát hành bị cách ly, bị thu hồi hoặc độc hại.
- `manual`: bất kỳ bản phát hành nào có giá trị ghi đè kiểm duyệt thủ công.
- `all`: bất kỳ bản phát hành nào có giá trị ghi đè thủ công, trạng thái quét không sạch hoặc báo cáo gói.

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

Báo cáo một gói để người kiểm duyệt đánh giá. Báo cáo áp dụng ở cấp gói và có thể được liên kết với một phiên bản. Báo cáo được đưa vào hàng đợi kiểm duyệt nhưng tự chúng không tự động ẩn hoặc chặn lượt tải xuống; người kiểm duyệt nên sử dụng chức năng kiểm duyệt bản phát hành để phê duyệt, cách ly hoặc thu hồi tạo tác.

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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để tiếp nhận báo cáo về gói.

Xác thực:

- Yêu cầu API token của người dùng có vai trò người kiểm duyệt hoặc quản trị viên.

Tham số truy vấn:

- `status` (tùy chọn): `open` (mặc định), `confirmed`, `dismissed` hoặc `all`
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

Điểm cuối dành cho chủ sở hữu/người kiểm duyệt để xem thông tin kiểm duyệt gói.

Xác thực:

- Yêu cầu API token của chủ sở hữu gói, thành viên nhà phát hành, người kiểm duyệt hoặc
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

Điểm cuối dành cho người kiểm duyệt/quản trị viên để xử lý hoặc mở lại báo cáo về gói.

Yêu cầu:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` là bắt buộc đối với `confirmed` và `dismissed`; có thể bỏ qua khi
đặt lại `status` thành `open`. Truyền `finalAction: "quarantine"` hoặc
`finalAction: "revoke"` cùng với báo cáo đã xác nhận để áp dụng việc kiểm duyệt bản phát hành trong
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

- `approved`: đã được xét duyệt thủ công và cho phép.
- `quarantined`: bị chặn trong khi chờ xử lý tiếp.
- `revoked`: bị chặn sau khi một bản phát hành trước đó đã được tin cậy.

Các bản phát hành bị cách ly và bị thu hồi trả về `403` từ các tuyến tải xuống tạo phẩm.
Mọi thay đổi đều ghi một mục vào nhật ký kiểm toán.

### `GET /api/v1/packages/{name}/file`

Trả về nội dung văn bản thô của một tệp trong gói.

Tham số truy vấn:

- `path` (bắt buộc)
- `version` (tùy chọn)
- `tag` (tùy chọn)

Lưu ý:

- Mặc định dùng bản phát hành mới nhất.
- Sử dụng nhóm giới hạn tốc độ đọc, không phải nhóm tải xuống.
- Tệp nhị phân trả về `415`.
- Giới hạn kích thước tệp: 200KB.
- Các lượt quét VirusTotal đang chờ xử lý không chặn việc đọc; các bản phát hành độc hại vẫn có thể bị giữ lại ở nơi khác.
- Các gói riêng tư trả về `404` trừ khi bên gọi có thể đọc nhà phát hành sở hữu gói.

### `GET /api/v1/packages/{name}/download`

Tải xuống kho lưu trữ ZIP xác định kiểu cũ cho một bản phát hành gói.

Tham số truy vấn:

- `version` (tùy chọn)
- `tag` (tùy chọn)

Lưu ý:

- Mặc định dùng bản phát hành mới nhất.
- Skills chuyển hướng đến `GET /api/v1/download`.
- Kho lưu trữ Plugin/gói là tệp zip có thư mục gốc `package/` để các ứng dụng OpenClaw
  cũ tiếp tục hoạt động.
- Tuyến này chỉ hỗ trợ ZIP. Tuyến không truyền trực tiếp các tệp ClawPack `.tgz`.
- Phản hồi bao gồm các header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` và
  `X-ClawHub-Artifact-Sha256` để trình phân giải kiểm tra tính toàn vẹn.
- Siêu dữ liệu chỉ dành cho registry không được chèn vào kho lưu trữ đã tải xuống.
- Các lượt quét VirusTotal đang chờ xử lý không chặn việc tải xuống; các bản phát hành độc hại trả về `403`.
- Các gói riêng tư trả về `404` trừ khi bên gọi là chủ sở hữu.

### `GET /api/npm/{package}`

Trả về packument tương thích với npm cho các phiên bản gói dựa trên ClawPack.

Lưu ý:

- Chỉ liệt kê các phiên bản có tarball npm-pack ClawPack đã được tải lên.
- Các phiên bản kiểu cũ chỉ có ZIP được chủ ý bỏ qua.
- `dist.tarball`, `dist.integrity` và `dist.shasum` sử dụng các trường tương thích với npm
  để người dùng có thể trỏ npm đến bản sao nếu muốn.
- Packument của gói có phạm vi hỗ trợ cả `/api/npm/@scope/name` và đường dẫn yêu cầu
  được mã hóa `/api/npm/@scope%2Fname` của npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Truyền trực tiếp chính xác các byte tarball ClawPack đã tải lên cho các ứng dụng bản sao npm.

Lưu ý:

- Sử dụng nhóm giới hạn tốc độ tải xuống.
- Các header tải xuống bao gồm SHA-256 của ClawHub cùng siêu dữ liệu integrity/shasum của npm.
- Các kiểm tra kiểm duyệt và quyền truy cập gói riêng tư vẫn được áp dụng.

### `GET /api/v1/resolve`

Được CLI sử dụng để ánh xạ một dấu vân tay cục bộ đến phiên bản đã biết.

Tham số truy vấn:

- `slug` (bắt buộc)
- `hash` (bắt buộc): sha256 dạng hex 64 ký tự của dấu vân tay bundle

Phản hồi:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Tải xuống tệp ZIP của một phiên bản skill được lưu trữ, hoặc trả về thông tin chuyển giao nguồn GitHub cho một
skill hiện tại dựa trên GitHub có kết quả quét `clean` hoặc `suspicious` và không có phiên bản
được lưu trữ.

Tham số truy vấn:

- `slug` (bắt buộc)
- `version` (tùy chọn): chuỗi semver
- `tag` (tùy chọn): tên thẻ (ví dụ: `latest`)

Lưu ý:

- Nếu không cung cấp cả `version` lẫn `tag`, phiên bản mới nhất sẽ được sử dụng.
- Các phiên bản bị xóa mềm trả về `410`.
- Thông tin chuyển giao của skill dựa trên GitHub không chuyển tiếp hoặc sao chép các byte. Phản hồi JSON
  bao gồm `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  và `archiveUrl`; trạng thái quét/hiện tại đóng vai trò cổng kiểm tra và không được đưa vào dưới dạng siêu dữ liệu
  của tải trọng thành công.
- Số liệu thống kê tải xuống được tính theo danh tính duy nhất mỗi ngày UTC (`userId` khi API token hợp lệ, nếu không thì dùng IP).

## Các điểm cuối xác thực (Bearer token)

Tất cả các điểm cuối đều yêu cầu:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Xác thực token và trả về handle của người dùng.

### `POST /api/v1/skills`

Phát hành một phiên bản mới.

- Khuyến nghị: `multipart/form-data` với JSON `payload` + các blob `files[]`.
- Nội dung JSON có `files` (dựa trên storageId) cũng được chấp nhận.
- Trường tải trọng tùy chọn: `ownerHandle`. Khi có, API phân giải
  nhà phát hành đó ở phía máy chủ và yêu cầu tác nhân có quyền truy cập nhà phát hành.
- Trường tải trọng tùy chọn: `migrateOwner`. Khi là `true` cùng với `ownerHandle`, một
  skill hiện có có thể được chuyển sang chủ sở hữu đó nếu tác nhân là quản trị viên/chủ sở hữu của cả
  nhà phát hành hiện tại và nhà phát hành đích. Nếu không chủ động bật tùy chọn này, các thay đổi chủ sở hữu sẽ
  bị từ chối.

### `POST /api/v1/packages`

Phát hành một bản phát hành code-plugin hoặc bundle-plugin.

- Yêu cầu xác thực bằng Bearer token.
- Yêu cầu `multipart/form-data`.
- Các trường biểu mẫu được phép là `payload`, các blob `files` lặp lại hoặc một tham chiếu tarball `clawpack`.
  `clawpack` có thể là blob `.tgz` hoặc id lưu trữ do
  luồng upload-url trả về. Việc phát hành bằng id lưu trữ đã chuẩn bị cũng phải bao gồm
  `clawpackUploadTicket` được trả về cùng URL tải lên đó.
- Chỉ sử dụng `files` hoặc `clawpack`, không bao giờ dùng cả hai trong cùng một yêu cầu.
- Nội dung JSON và siêu dữ liệu `payload.files` / `payload.artifact`
  do bên gọi cung cấp sẽ bị từ chối.
- Các yêu cầu phát hành multipart trực tiếp bị giới hạn ở 18MB. Tarball ClawPack có thể
  sử dụng luồng upload-url lên đến giới hạn tarball 120MB.
- Trường tải trọng tùy chọn: `ownerHandle`. Khi có, chỉ quản trị viên mới có thể phát hành thay mặt chủ sở hữu đó.

Các điểm nổi bật về xác thực:

- `family` phải là `code-plugin` hoặc `bundle-plugin`.
- Các gói Plugin yêu cầu `openclaw.plugin.json`. Nội dung tải lên ClawPack `.tgz` phải
  chứa tệp này tại `package/openclaw.plugin.json`.
- Code plugin yêu cầu `package.json`, siêu dữ liệu kho mã nguồn, siêu dữ liệu commit
  nguồn, siêu dữ liệu schema cấu hình, `openclaw.compat.pluginApi` và
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` và `openclaw.environment` là siêu dữ liệu tùy chọn.
- Chỉ nhà phát hành của tổ chức `openclaw` và nhà phát hành cá nhân của các thành viên hiện tại thuộc
  tổ chức `openclaw` mới có thể phát hành lên kênh `official`.
- Các lượt phát hành thay mặt người khác vẫn xác thực điều kiện sử dụng kênh chính thức dựa trên tài khoản chủ sở hữu đích.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Xóa mềm / khôi phục một skill (chủ sở hữu, người kiểm duyệt hoặc quản trị viên).

Nội dung JSON tùy chọn:

```json
{ "reason": "Held for moderation pending legal review." }
```

Khi có, `reason` được lưu làm ghi chú kiểm duyệt skill và sao chép vào nhật ký kiểm toán.
Các lượt xóa mềm do chủ sở hữu khởi tạo sẽ giữ slug trong 30 ngày, sau đó slug có thể được
nhà phát hành khác nhận quyền sở hữu. Phản hồi xóa bao gồm `slugReservedUntil` khi thời hạn này được áp dụng.
Các lượt ẩn của người kiểm duyệt/quản trị viên và xóa vì lý do bảo mật không hết hạn theo cách này.

Phản hồi xóa:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Mã trạng thái:

- `200`: thành công
- `401`: chưa được xác thực
- `403`: bị cấm
- `404`: không tìm thấy skill/người dùng
- `500`: lỗi máy chủ nội bộ

### `POST /api/v1/users/publisher`

Chỉ dành cho quản trị viên. Đảm bảo tồn tại một nhà phát hành tổ chức cho handle. Nếu handle vẫn trỏ đến một
người dùng dùng chung cũ/nhà phát hành cá nhân, điểm cuối trước tiên sẽ di chuyển nó sang một nhà phát hành tổ chức.
Đối với tổ chức mới tạo, hãy cung cấp `memberHandle`; quản trị viên thực hiện thao tác không được thêm làm thành viên.
`memberRole` mặc định là `owner`.

- Nội dung: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Tạo nhà phát hành tổ chức theo hình thức tự phục vụ có xác thực. Tạo một nhà phát hành tổ chức mới và thêm
bên gọi làm chủ sở hữu. Điểm cuối này không di chuyển các handle người dùng/cá nhân hiện có và
không đánh dấu nhà phát hành là đáng tin cậy/chính thức.

- Nội dung: `{ "handle": "opik", "displayName": "Opik" }`
- Phản hồi: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Trả về `409` khi handle đã được một nhà phát hành, người dùng hoặc nhà phát hành cá nhân sử dụng.

### `POST /api/v1/users/reserve`

Chỉ dành cho quản trị viên. Giữ trước các slug gốc và tên gói cho chủ sở hữu hợp pháp mà không phát hành
bản phát hành. Tên gói trở thành các gói giữ chỗ riêng tư không có hàng bản phát hành, để cùng
chủ sở hữu đó sau này có thể phát hành bản phát hành code-plugin hoặc bundle-plugin thực vào tên đó.

- Nội dung: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Phản hồi: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Chỉ dành cho quản trị viên. Khôi phục nhà phát hành cá nhân cho một danh tính GitHub OAuth thay thế đã được xác minh
mà không chỉnh sửa các hàng tài khoản Convex Auth. Yêu cầu phải nêu cả hai id tài khoản nhà cung cấp GitHub
bất biến; các handle có thể thay đổi chỉ được dùng làm biện pháp bảo vệ dành cho người vận hành.

Điểm cuối mặc định ở chế độ chạy thử. Việc áp dụng khôi phục yêu cầu `dryRun: false` và
`confirmIdentityVerified: true` sau khi nhân viên xác minh độc lập tính liên tục giữa cả hai
chủ thể GitHub. Quá trình khôi phục sẽ dừng an toàn khi nhà phát hành cá nhân hiện tại
của người dùng đích có Skills, gói hoặc nguồn Skills GitHub.
Quá trình khôi phục cũng di chuyển các trường `ownerUserId` cũ cho Skills của nhà phát hành được khôi phục,
các bí danh slug của Skills, gói, cảnh báo của trình kiểm tra gói và các hàng bản tóm lược tìm kiếm dẫn xuất để
các đường dẫn chủ sở hữu trực tiếp nhất quán với thẩm quyền mới của nhà phát hành. Một mục giữ chỗ tên định danh được bảo vệ đang hoạt động
cho tên định danh được khôi phục cũng được gán lại cho người dùng thay thế để quá trình
đồng bộ hóa hồ sơ sau này không thể khôi phục thẩm quyền cạnh tranh của người dùng cũ. Mỗi bảng chính được giới hạn ở
100 hàng cho mỗi giao dịch áp dụng; các lần khôi phục lớn hơn trước tiên phải sử dụng quy trình di chuyển chủ sở hữu có thể tiếp tục.
Các nguồn Skills GitHub có phạm vi theo nhà phát hành và được báo cáo là đã kiểm tra thay vì được ghi lại.

- Nội dung: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Phản hồi: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Các điểm cuối quản lý slug của chủ sở hữu

- `POST /api/v1/skills/{slug}/rename`
  - Nội dung: `{ "newSlug": "new-canonical-slug" }`
  - Phản hồi: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Nội dung: `{ "targetSlug": "canonical-target-slug" }`
  - Phản hồi: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Lưu ý:

- Cả hai điểm cuối đều yêu cầu xác thực bằng mã thông báo API và chỉ hoạt động đối với chủ sở hữu Skills.
- `rename` giữ nguyên slug trước đó làm bí danh chuyển hướng.
- `merge` ẩn mục nguồn và chuyển hướng slug nguồn đến mục đích.

### Các điểm cuối chuyển quyền sở hữu

- `POST /api/v1/skills/{slug}/transfer`
  - Nội dung: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Phản hồi: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Phản hồi (chấp nhận/từ chối/hủy): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Cấu trúc phản hồi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Cấm một người dùng và xóa vĩnh viễn Skills thuộc sở hữu của họ (chỉ người kiểm duyệt/quản trị viên).

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

Bỏ cấm một người dùng và khôi phục Skills đủ điều kiện (chỉ quản trị viên).

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

### `POST /api/v1/users/reclassify-ban`

Thay đổi lý do đã lưu của một lệnh cấm hiện có mà không bỏ cấm hoặc khôi phục
nội dung (chỉ quản trị viên). Mặc định chạy thử trừ khi `dryRun` là `false`.

Nội dung:

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

Thay đổi vai trò của người dùng (chỉ quản trị viên).

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

Liệt kê hoặc tìm kiếm người dùng (chỉ quản trị viên).

Tham số truy vấn:

- `q` (tùy chọn): truy vấn tìm kiếm
- `query` (tùy chọn): bí danh của `q`
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

Thêm/xóa dấu sao (điểm nổi bật). Cả hai điểm cuối đều có tính lũy đẳng.

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
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Xem `DEPRECATIONS.md` để biết kế hoạch loại bỏ.

`POST /api/cli/upload-url` trả về `uploadUrl` và `uploadTicket`. Các lần
phát hành gói có lưu tạm một tệp tar ClawPack phải gửi mã định danh lưu trữ thu được dưới dạng
`clawpack` và phiếu được trả về dưới dạng `clawpackUploadTicket`.

## Khám phá kho đăng ký (`/.well-known/clawhub.json`)

CLI có thể khám phá các thiết lập kho đăng ký/xác thực từ trang web:

- `/.well-known/clawhub.json` (JSON, ưu tiên)
- `/.well-known/clawdhub.json` (cũ)

Lược đồ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Nếu tự lưu trữ, hãy phục vụ tệp này (hoặc đặt `CLAWHUB_REGISTRY` một cách rõ ràng; `CLAWDHUB_REGISTRY` là biến cũ).
