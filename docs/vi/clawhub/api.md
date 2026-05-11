---
read_when:
    - Xây dựng ứng dụng khách API
    - Thêm điểm cuối hoặc lược đồ
summary: Tổng quan và quy ước về REST API công khai (v1).
x-i18n:
    generated_at: "2026-05-11T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Cơ sở: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Tái sử dụng danh mục công khai

Bạn có thể xây dựng danh mục, thư mục hoặc bề mặt tìm kiếm của bên thứ ba dựa trên các API đọc công khai của ClawHub. Siêu dữ liệu Skills công khai và các tệp Skills được phát hành theo quy tắc giấy phép Skills của ClawHub, trong khi bản thân API bị giới hạn tần suất và nên được sử dụng có trách nhiệm.

Hướng dẫn:

- Sử dụng các điểm cuối đọc công khai như `GET /api/v1/skills`, `GET /api/v1/search` và `GET /api/v1/skills/{slug}` cho danh sách danh mục.
- Lưu phản hồi vào bộ nhớ đệm và tôn trọng `429`, `Retry-After` cùng các header giới hạn tần suất thay vì thăm dò quá mức.
- Liên kết ngược về URL Skills ClawHub chính tắc khi hiển thị danh sách để người dùng có thể kiểm tra bản ghi registry nguồn.
- Sử dụng URL trang chính tắc theo dạng `https://clawhub.ai/<owner>/<slug>`.
- Không ngụ ý rằng ClawHub xác nhận, xác minh hoặc vận hành trang web của bên thứ ba.
- Không sao chép nội dung bị ẩn, riêng tư hoặc bị chặn do kiểm duyệt bằng cách vượt qua các bộ lọc API công khai hoặc ranh giới xác thực.

## Xác thực

- Đọc công khai: không cần token.
- Ghi + tài khoản: `Authorization: Bearer clh_...`.

## Giới hạn tần suất

Thực thi có xét đến xác thực:

- Yêu cầu ẩn danh: theo IP.
- Yêu cầu đã xác thực (token Bearer hợp lệ): theo nhóm người dùng.
- Token bị thiếu/không hợp lệ sẽ quay về thực thi theo IP.

- Đọc: 600/phút theo IP, 2400/phút theo khóa
- Ghi: 45/phút theo IP, 180/phút theo khóa

Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (khi gặp 429).

Ngữ nghĩa:

- `X-RateLimit-Reset`: giây Unix epoch (thời điểm đặt lại tuyệt đối)
- `RateLimit-Reset`: số giây trì hoãn cho đến khi đặt lại
- `Retry-After`: số giây trì hoãn cần chờ khi gặp `429`

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

- Ưu tiên `Retry-After` khi có.
- Nếu không, dùng `RateLimit-Reset` hoặc suy ra thời gian trì hoãn từ `X-RateLimit-Reset`.
- Thêm jitter vào các lần thử lại.

## Điểm cuối

Đọc công khai:

- `GET /api/v1/search?q=...`
  - Bộ lọc tùy chọn: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` áp dụng cho các kiểu sắp xếp không phải `trending`
  - Bộ lọc tùy chọn: `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
  - Với `nonSuspiciousOnly=true`, các trang dựa trên con trỏ có thể chứa ít mục hơn `limit`; dùng `nextCursor` để tiếp tục.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Chỉ dành cho quản trị viên:

- `POST /api/v1/users/reserve` giữ trước slug gốc và placeholder gói riêng tư chưa có bản phát hành cho một handle chủ sở hữu.

## Cũ

`/api/*` và `/api/cli/*` cũ vẫn khả dụng. Xem `DEPRECATIONS.md`.
