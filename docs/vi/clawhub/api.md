---
read_when:
    - Xây dựng API client
    - Thêm endpoint hoặc schema
summary: Tổng quan và quy ước của REST API công khai (v1).
x-i18n:
    generated_at: "2026-07-04T20:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Cơ sở: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Tái sử dụng danh mục công khai

Bạn có thể xây dựng danh mục, thư mục hoặc bề mặt tìm kiếm của bên thứ ba dựa trên các API đọc công khai của ClawHub. Siêu dữ liệu kỹ năng công khai và các tệp kỹ năng được phát hành theo quy tắc giấy phép kỹ năng của ClawHub, còn bản thân API bị giới hạn tốc độ và cần được sử dụng có trách nhiệm.

Hướng dẫn:

- Dùng các điểm cuối đọc công khai như `GET /api/v1/skills`, `GET /api/v1/search` và `GET /api/v1/skills/{slug}` cho danh sách danh mục.
- Lưu phản hồi vào bộ nhớ đệm và tôn trọng `429`, `Retry-After` cùng các header giới hạn tốc độ thay vì thăm dò quá dồn dập.
- Liên kết về URL kỹ năng ClawHub chuẩn khi hiển thị danh sách để người dùng có thể kiểm tra bản ghi registry nguồn.
- Dùng URL trang chuẩn theo dạng `https://clawhub.ai/<owner>/skills/<slug>`.
- Không ngụ ý rằng ClawHub chứng thực, xác minh hoặc vận hành trang của bên thứ ba.
- Không sao chép nội dung bị ẩn, riêng tư hoặc bị chặn kiểm duyệt bằng cách vượt qua bộ lọc API công khai hoặc ranh giới xác thực.

## Xác thực

- Đọc công khai: không cần token.
- Ghi + tài khoản: `Authorization: Bearer clh_...`.

## Giới hạn tốc độ

Thực thi có nhận biết xác thực:

- Yêu cầu ẩn danh: theo IP.
- Yêu cầu đã xác thực (token Bearer hợp lệ): theo bucket người dùng.
- Token thiếu/không hợp lệ sẽ quay về thực thi theo IP.

- Đọc: 3000/phút mỗi IP, 12000/phút mỗi khóa
- Ghi: 300/phút mỗi IP, 3000/phút mỗi khóa
- Tải xuống: 1200/phút mỗi IP, 6000/phút mỗi khóa

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` và `Retry-After` được bao gồm trên `429`.

Ngữ nghĩa:

- `X-RateLimit-Reset`: giây Unix epoch (thời điểm đặt lại tuyệt đối)
- `RateLimit-Reset`: số giây trì hoãn cho đến khi đặt lại
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: ngân sách chính xác còn lại khi
  có mặt; các yêu cầu thành công được phân mảnh sẽ bỏ qua giá trị này thay vì trả về một giá trị
  toàn cục gần đúng
- `Retry-After`: số giây trì hoãn cần chờ trên `429`

Ví dụ `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Xử lý phía máy khách:

- Ưu tiên `Retry-After` khi có mặt.
- Nếu không, dùng `RateLimit-Reset` hoặc suy ra độ trễ từ `X-RateLimit-Reset`.
- Thêm jitter vào các lần thử lại.

## Lỗi

- Lỗi v1 là văn bản thuần (`text/plain; charset=utf-8`), bao gồm `400`,
  `401`, `403`, `404`, `429` và phản hồi tải xuống bị chặn.
- Tham số truy vấn không xác định được bỏ qua để tương thích.
- Tham số truy vấn đã biết với giá trị không hợp lệ sẽ trả về `400`.

## Điểm cuối

Đọc công khai:

- `GET /api/v1/search?q=...`
  - Bộ lọc tùy chọn: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), các bí danh cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ tới `downloads`, `trending`
  - Giá trị `sort` không hợp lệ trả về `400`
  - `cursor` áp dụng cho các kiểu sắp xếp không phải `trending`
  - Bộ lọc tùy chọn: `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
  - Với `nonSuspiciousOnly=true`, các trang dựa trên con trỏ có thể chứa ít mục hơn `limit`; dùng `nextCursor` để tiếp tục.
  - `recommended` dùng tín hiệu tương tác và độ mới.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Kỹ năng được lưu trữ trả về các byte ZIP tất định.
  - Kỹ năng hiện tại dựa trên GitHub có bản quét `clean` hoặc `suspicious` trả về một
    bộ mô tả chuyển giao JSON `public-github` thay vì byte từ ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Kỹ năng được lưu trữ được xuất dưới dạng tệp đã lưu.
  - Kỹ năng hiện tại dựa trên GitHub có bản quét `clean` hoặc `suspicious` được xuất
    dưới dạng bộ mô tả chuyển giao `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `recommended`, `downloads`, bí danh cũ `installs`
  - Giá trị `sort` không hợp lệ trả về `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (mặc định), `downloads`, `updated`, bí danh cũ `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Yêu cầu xác thực:

- `POST /api/v1/skills` (phát hành, ưu tiên multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Chỉ quản trị viên:

- `POST /api/v1/users/reserve` giữ trước slug gốc và phần giữ chỗ gói riêng tư chưa phát hành cho một định danh chủ sở hữu.

## Cũ

Các `/api/*` và `/api/cli/*` cũ vẫn khả dụng. Xem `DEPRECATIONS.md`.
