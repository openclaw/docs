---
read_when:
    - Xây dựng ứng dụng khách API
    - Thêm điểm cuối hoặc lược đồ
summary: Tổng quan và quy ước của API REST công khai (v1).
x-i18n:
    generated_at: "2026-07-16T14:09:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Cơ sở: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Tái sử dụng danh mục công khai

Bạn có thể xây dựng danh mục, thư mục hoặc giao diện tìm kiếm của bên thứ ba dựa trên các API đọc công khai của ClawHub. Siêu dữ liệu và tệp Skills công khai được phát hành theo các quy tắc giấy phép Skills của ClawHub, còn bản thân API có giới hạn tốc độ và cần được sử dụng có trách nhiệm.

Hướng dẫn:

- Sử dụng các điểm cuối đọc công khai như `GET /api/v1/skills`, `GET /api/v1/search` và `GET /api/v1/skills/{slug}` cho danh sách trong danh mục.
- Lưu phản hồi vào bộ nhớ đệm và tuân thủ `429`, `Retry-After` cùng các tiêu đề giới hạn tốc độ thay vì liên tục thăm dò.
- Khi hiển thị danh sách, hãy liên kết lại URL Skills chính tắc của ClawHub để người dùng có thể kiểm tra bản ghi đăng ký nguồn.
- Sử dụng URL trang chính tắc theo dạng `https://clawhub.ai/<owner>/skills/<slug>`.
- Không được ngụ ý rằng ClawHub chứng thực, xác minh hoặc vận hành trang web của bên thứ ba.
- Không sao chép nội dung ẩn, riêng tư hoặc bị kiểm duyệt chặn bằng cách bỏ qua các bộ lọc API công khai hay ranh giới xác thực.

## Xác thực

- Đọc công khai: không yêu cầu token.
- Ghi + tài khoản: `Authorization: Bearer clh_...`.

## Giới hạn tốc độ

Thực thi có xét đến trạng thái xác thực:

- Yêu cầu ẩn danh: theo từng IP.
- Yêu cầu đã xác thực (Bearer token hợp lệ): theo nhóm của từng người dùng.
- Token thiếu hoặc không hợp lệ sẽ chuyển sang thực thi theo IP.

- Đọc: 3000/phút cho mỗi IP, 12000/phút cho mỗi khóa
- Ghi: 300/phút cho mỗi IP, 3000/phút cho mỗi khóa
- Tải xuống: 1200/phút cho mỗi IP, 6000/phút cho mỗi khóa

Tiêu đề: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` và `Retry-After` được bao gồm trên `429`.

Ngữ nghĩa:

- `X-RateLimit-Reset`: số giây kể từ Unix epoch (thời điểm đặt lại tuyệt đối)
- `RateLimit-Reset`: số giây trì hoãn cho đến khi đặt lại
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: hạn mức chính xác còn lại khi
  có mặt; các yêu cầu phân mảnh thành công sẽ bỏ qua giá trị này thay vì trả về một giá trị
  toàn cục gần đúng
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
- Nếu không, hãy sử dụng `RateLimit-Reset` hoặc tính thời gian trì hoãn từ `X-RateLimit-Reset`.
- Thêm độ lệch ngẫu nhiên vào các lần thử lại.

## Lỗi

- Lỗi v1 là văn bản thuần túy (`text/plain; charset=utf-8`), bao gồm `400`,
  `401`, `403`, `404`, `429` và các phản hồi tải xuống bị chặn.
- Các tham số truy vấn không xác định được bỏ qua để đảm bảo khả năng tương thích.
- Các tham số truy vấn đã biết nhưng có giá trị không hợp lệ sẽ trả về `400`.

## Điểm cuối

Đọc công khai:

- `GET /api/v1/search?q=...`
  - Bộ lọc tùy chọn: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), các bí danh cài đặt cũ `installsCurrent`/`installs`/`installsAllTime` ánh xạ tới `downloads`, `trending`
  - Các giá trị `sort` không hợp lệ sẽ trả về `400`
  - `cursor` áp dụng cho các kiểu sắp xếp không phải `trending`
  - Bộ lọc tùy chọn: `nonSuspiciousOnly=true`
  - Bí danh cũ: `nonSuspicious=true`
  - Với `nonSuspiciousOnly=true`, các trang dựa trên con trỏ có thể chứa ít hơn `limit` mục; sử dụng `nextCursor` để tiếp tục.
  - `recommended` sử dụng các tín hiệu về mức độ tương tác và tính gần đây.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills được lưu trữ trả về các byte ZIP có tính xác định.
  - Skills hiện tại dựa trên GitHub có lần quét `clean` hoặc `suspicious` sẽ trả về một
    bộ mô tả chuyển giao JSON `public-github` thay vì các byte từ ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills được lưu trữ được xuất dưới dạng các tệp đã lưu.
  - Skills hiện tại dựa trên GitHub có lần quét `clean` hoặc `suspicious` được xuất
    dưới dạng các bộ mô tả chuyển giao `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (mặc định), `recommended`, `downloads`, bí danh cũ `installs`
  - Các giá trị `sort` không hợp lệ sẽ trả về `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (mặc định), `downloads`, `updated`, bí danh cũ `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Yêu cầu xác thực:

- `POST /api/v1/skills` (xuất bản, ưu tiên multipart)
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

- `POST /api/v1/users/reserve` dành riêng các slug gốc và phần giữ chỗ gói riêng tư không có bản phát hành cho một định danh chủ sở hữu.

## Cũ

Các `/api/*` và `/api/cli/*` cũ vẫn khả dụng. Xem `DEPRECATIONS.md`.
