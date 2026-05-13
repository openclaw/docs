---
read_when:
    - Xây dựng ứng dụng khách API
    - Thêm endpoint hoặc schema
summary: Tổng quan và quy ước về REST API công khai (v1).
x-i18n:
    generated_at: "2026-05-13T04:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Cơ sở: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Tái sử dụng danh mục công khai

Bạn có thể xây dựng danh mục, thư mục hoặc bề mặt tìm kiếm của bên thứ ba dựa trên các API đọc công khai của ClawHub. Siêu dữ liệu skill công khai và tệp skill được phát hành theo quy tắc giấy phép skill của ClawHub, trong khi bản thân API có giới hạn tốc độ và nên được sử dụng một cách có trách nhiệm.

Hướng dẫn:

- Sử dụng các điểm cuối đọc công khai như `GET /api/v1/skills`, `GET /api/v1/search` và `GET /api/v1/skills/{slug}` cho danh sách danh mục.
- Lưu phản hồi vào bộ nhớ đệm và tôn trọng `429`, `Retry-After` và các header giới hạn tốc độ thay vì thăm dò quá dày.
- Liên kết ngược về URL skill ClawHub chính tắc khi hiển thị danh sách để người dùng có thể kiểm tra bản ghi nguồn trong registry.
- Sử dụng URL trang chính tắc theo dạng `https://clawhub.ai/<owner>/<slug>`.
- Không ngụ ý rằng ClawHub xác nhận, xác minh hoặc vận hành trang của bên thứ ba.
- Không sao chép nội dung bị ẩn, riêng tư hoặc bị chặn kiểm duyệt bằng cách vượt qua bộ lọc API công khai hoặc ranh giới xác thực.

## Xác thực

- Đọc công khai: không cần token.
- Ghi + tài khoản: `Authorization: Bearer clh_...`.

## Giới hạn tốc độ

Thực thi có nhận biết xác thực:

- Yêu cầu ẩn danh: theo IP.
- Yêu cầu đã xác thực (token Bearer hợp lệ): theo bucket người dùng.
- Token thiếu/không hợp lệ sẽ quay về thực thi theo IP.

- Đọc: 600/phút mỗi IP, 2400/phút mỗi khóa
- Ghi: 45/phút mỗi IP, 180/phút mỗi khóa

Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (khi có 429).

Ngữ nghĩa:

- `X-RateLimit-Reset`: giây Unix epoch (thời điểm reset tuyệt đối)
- `RateLimit-Reset`: số giây trì hoãn cho đến khi reset
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

Xử lý phía client:

- Ưu tiên `Retry-After` khi có.
- Nếu không, dùng `RateLimit-Reset` hoặc suy ra độ trễ từ `X-RateLimit-Reset`.
- Thêm jitter vào các lần thử lại.

## Điểm cuối

Đọc công khai:

- `GET /api/v1/search?q=...`
  - Bộ lọc tùy chọn: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias cũ: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` áp dụng cho các kiểu sắp xếp không phải `trending`
  - Bộ lọc tùy chọn: `nonSuspiciousOnly=true`
  - Alias cũ: `nonSuspicious=true`
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Chỉ quản trị viên:

- `POST /api/v1/users/reserve` giữ trước các slug gốc và placeholder gói riêng tư chưa phát hành cho một định danh chủ sở hữu.

## Cũ

Các `/api/*` và `/api/cli/*` cũ vẫn khả dụng. Xem `DEPRECATIONS.md`.
