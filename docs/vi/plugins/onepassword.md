---
read_when:
    - Bạn muốn các agent yêu cầu những bí mật 1Password đã được tuyển chọn
    - Bạn cần chính sách phê duyệt cho từng bí mật và lịch sử kiểm tra.
    - Bạn đang cấu hình tài khoản dịch vụ 1Password cho OpenClaw
summary: Sử dụng Plugin 1Password tùy chọn làm trình môi giới bí mật đã được kiểm tra cho agent
title: Trình môi giới bí mật 1Password
x-i18n:
    generated_at: "2026-07-19T06:14:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 255ab4fd2c63754fef29d3ea87dcedc9ca2bd2f34bec1f81139e2ce5b6acdba2
    source_path: plugins/onepassword.md
    workflow: 16
---

# Trình môi giới bí mật 1Password

Plugin `onepassword` đi kèm cung cấp cho các tác nhân một công cụ duy nhất được kiểm soát bằng chính sách để
đọc một tập hợp trường 1Password đã tuyển chọn. Plugin bị tắt theo mặc định và không
hoạt động cho đến khi có `plugins.entries.onepassword.config`.

Đây là công cụ dành cho tác nhân, không phải nhà cung cấp SecretRef. Công cụ này không chèn biến
môi trường hoặc phân giải bí mật cấu hình OpenClaw.

## Mô hình bảo mật

- Chỉ xác thực bằng tài khoản dịch vụ. Token nằm trong một tệp thông tin xác thực
  cục bộ và không bao giờ được chấp nhận trong `openclaw.json`.
- Chỉ dùng registry đã tuyển chọn. Tác nhân có thể liệt kê các slug đã cấu hình, nhưng plugin không bao giờ
  liệt kê nội dung của vault 1Password.
- Chính sách `auto`, `approve` hoặc `deny` cho từng slug.
- Quyền cấp phê duyệt sẽ hết hạn. Giá trị đã lưu trong bộ nhớ đệm không bao giờ bỏ qua chính sách hiện hành.
- Mọi lần thử truy cập đều được ghi lại trong trạng thái SQLite dùng chung của OpenClaw. Các hàng kiểm tra
  bao gồm lý do được cung cấp; hãy đảm bảo lý do không chứa thông tin nhạy cảm. Trình môi giới
  không bao giờ sao chép giá trị đã truy xuất hoặc token dịch vụ vào hàng kiểm tra.
- Sau khi quá trình thực thi công cụ hiện tại kết thúc, cơ chế lưu giữ bản chép lời do OpenClaw sở hữu
  sẽ thay thế giá trị `get` thành công bằng siêu dữ liệu đã che.
- Giá trị hiển thị với mô hình trong lần thực thi đó. Nếu mô hình sao chép giá trị này vào một
  lệnh gọi công cụ hoặc phản hồi sau đó, bản ghi riêng biệt đó nằm ngoài hook lưu giữ của plugin này.
  Hãy giới hạn chính sách chặt chẽ và không yêu cầu mô hình lặp lại
  giá trị.
- Plugin gọi `op` một lần cho mỗi lần trượt bộ nhớ đệm. Plugin không thử lại khi gặp giới hạn tốc độ hoặc
  lỗi khác.
- Mỗi lệnh gọi `op` chạy với môi trường tối thiểu vô hiệu hóa khả năng tích hợp ứng dụng máy tính
  1Password (`OP_LOAD_DESKTOP_APP_SETTINGS=false`,
  `OP_BIOMETRIC_UNLOCK_ENABLED=false`), để ứng dụng 1Password được cài đặt trên
  máy chủ Gateway không bao giờ kích hoạt hộp thoại sinh trắc học hoặc quyền của macOS.

Chỉ cấp cho tài khoản dịch vụ quyền đọc các vault và mục đã đăng ký trong
cấu hình plugin.

## Trước khi bắt đầu

Bạn cần:

- CLI 1Password (`op`) được cài đặt trên máy chủ Gateway
- một tài khoản dịch vụ 1Password có quyền truy cập các mục đã chọn
- một tệp token chuyên dụng cho tài khoản dịch vụ

Bật plugin đi kèm:

```bash
openclaw plugins enable onepassword
```

Tạo thư mục và tệp token trong thư mục trạng thái OpenClaw:

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

Khi `OPENCLAW_STATE_DIR` được đặt, hãy thay `~/.openclaw` bằng thư mục đó.
Plugin cảnh báo một lần khi nhóm hoặc
người dùng khác có thể đọc hoặc ghi tệp token.

## Cấu hình bí mật đã đăng ký

Thêm cấu hình plugin vào `openclaw.json`:

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

Slug sử dụng chữ thường, chữ số và dấu gạch nối, bắt đầu bằng chữ cái hoặc
chữ số và có tối đa 64 ký tự. Một registry có thể chứa tối đa 32
slug; phần mô tả có thể chứa tối đa 200 ký tự. `field` chấp nhận một nhãn
hoặc ID trường, không được chứa dấu phẩy và mặc định là `credential`.
`vault` ở cấp mục ghi đè vault mặc định. `opBin` có thể đặt đường dẫn tuyệt đối
đến tệp thực thi `op`; nếu không, plugin phân giải `op` từ `PATH`.
Tiêu đề mục không được bắt đầu bằng dấu gạch nối.

## Sử dụng công cụ tác nhân

Tên công cụ là `onepassword`.

Liệt kê các slug đã đăng ký:

```json
{ "action": "list" }
```

Kết quả chỉ chứa slug, mô tả, chính sách và trạng thái quyền cấp thường trực
có đang hoạt động hay không. Kết quả không bao giờ chứa giá trị bí mật và không truy vấn 1Password.

Yêu cầu một bí mật:

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` là bắt buộc, không được để trống và bị giới hạn ở 300 ký tự. Một
`get` thành công trả về giá trị cùng với slug, tiêu đề mục và
nhãn trường đã cấu hình.

Lược đồ công cụ cũng khai báo một tham số `authorizationNonce` nội bộ. Lớp
chính sách chèn tham số này sau khi đánh giá yêu cầu để chuyển quyền
cho lệnh gọi công cụ đang thực thi. Không bao giờ đặt tham số này theo cách thủ công: hook chính sách sẽ ghi đè
mọi giá trị được cung cấp và giá trị không xác định sẽ khiến yêu cầu thất bại.

## Các cấp chính sách và phê duyệt

- `auto`: truy xuất ngay lập tức và kiểm tra yêu cầu.
- `deny`: chặn và kiểm tra yêu cầu.
- `approve`: sử dụng quyền cấp thường trực chưa hết hạn hoặc yêu cầu một người cho phép một lần,
  luôn cho phép hoặc từ chối.

Cho phép một lần chỉ cấp quyền cho lệnh gọi công cụ hiện tại. Luôn cho phép ghi một
quyền cấp thường trực cho tác nhân và slug đó vào SQLite; các tác nhân khác phải được
phê duyệt riêng. OpenClaw chỉ cung cấp tùy chọn luôn cho phép khi bên gọi có danh tính tác nhân
cụ thể. Quyền cấp hết hạn sau `grantTtlHours`, mặc định là 720 giờ.
Yêu cầu phê duyệt chưa được giải quyết hoặc hết thời gian chờ sẽ bị từ chối; thời gian chờ phê duyệt tối đa
là 600 giây. Plugin lưu giữ tối đa 1.024 quyền cấp thường trực; khi đạt
giới hạn này, quyền cấp cũ nhất sẽ bị loại bỏ và tác nhân tương ứng phải phê duyệt lần truy cập tiếp theo.

Mỗi quyền được đánh giá chỉ dùng một lần và được chuyển cho lệnh gọi công cụ
đang thực thi thông qua trạng thái SQLite dùng chung, vì vậy quá trình chuyển giao cũng hoạt động khi có nhiều hơn một
phiên bản plugin đang hoạt động trong tiến trình Gateway. Các quyền không được sử dụng sẽ hết hạn
sau cửa sổ phê duyệt 600 giây.

Bộ nhớ đệm trong bộ nhớ mặc định là 300 giây và bị giới hạn theo registry
slug đã cấu hình. Đặt `cacheTtlSeconds` thành `0` để vô hiệu hóa. Chính sách được đánh giá
trước mỗi lần tra cứu bộ nhớ đệm và các lần trúng bộ nhớ đệm đều được kiểm tra. Việc tải lại cấu hình trong thời gian chạy
có hiệu lực tại mỗi ranh giới chính sách và thực thi; tắt plugin hoặc
xóa, từ chối hay đổi đích một slug sẽ làm mất hiệu lực quyền đang chờ và
các giá trị đã lưu trong bộ nhớ đệm.

## Kiểm tra trạng thái và lịch sử kiểm tra

Hiển thị trạng thái sẵn sàng và số lượng trong registry:

```bash
openclaw onepassword status
```

Lệnh này báo cáo tệp token có tồn tại hay không, `op` có được phân giải hay không cùng đường dẫn của nó,
số lượng mục đã đăng ký và số lượng theo từng chính sách. Lệnh không bao giờ đọc hoặc in
token hay giá trị bí mật.

Hiển thị 50 hàng kiểm tra gần nhất:

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

Các hàng mới nhất được hiển thị trước và cho biết dấu thời gian, tác nhân, slug, kết quả, một `errorCode`
khi lần thử thất bại và lý do đã rút gọn. Lý do được lưu đúng như
đã cung cấp; trình môi giới không bao giờ thêm giá trị đã truy xuất vào nhật ký kiểm tra.

## Hành vi của CLI 1Password

Mỗi lần trượt bộ nhớ đệm sẽ chạy `op item get` với mục, vault và bộ chọn
trường chính xác đã cấu hình, đầu ra JSON, thời gian chờ hữu hạn và `--cache=false`. Tiến trình con
chỉ nhận trường đó thay vì toàn bộ mục. Chỉ
`OP_SERVICE_ACCOUNT_TOKEN` và `HOME` có trong môi trường của tiến trình con.

Plugin chỉ thử một lần. Các lỗi `RATE_LIMITED` nên được xử lý bằng cách chờ
trước khi tác nhân gửi yêu cầu sau; plugin không tạo vòng lặp thử lại
tự động.

## Mã lỗi

Các lần thử thất bại mang một mã lỗi đóng trong kết quả công cụ và hàng
kiểm tra.

Lỗi truy cập 1Password:

| Mã                | Ý nghĩa                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `TOKEN_MISSING`   | Tệp token bị thiếu hoặc trống                                       |
| `OP_NOT_FOUND`    | Không thể phân giải tệp nhị phân `op`                              |
| `ITEM_NOT_FOUND`  | Mục đã cấu hình không có trong vault                                |
| `FIELD_NOT_FOUND` | Trường đã cấu hình không có trong mục; các nhãn khả dụng được liệt kê |
| `RATE_LIMITED`    | Đã đạt giới hạn tốc độ của tài khoản dịch vụ 1Password              |
| `AUTH_FAILED`     | Xác thực tài khoản dịch vụ thất bại                                 |
| `TIMEOUT`         | `op` đã vượt quá `opTimeoutMs`                                    |
| `OP_ERROR`        | Bất kỳ lỗi `op` nào khác hoặc đầu ra không hợp lệ                   |

Lỗi chính sách và xác thực đầu vào:

| Mã                                                 | Ý nghĩa                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `INVALID_ACTION`, `INVALID_REASON`, `INVALID_SLUG` | Yêu cầu không vượt qua bước xác thực đầu vào                                     |
| `UNKNOWN_SLUG`                                     | Slug không có trong registry đã cấu hình                                         |
| `TOOL_CALL_ID_MISSING`                             | Lệnh gọi đến mà không có ID lệnh gọi công cụ                                     |
| `POLICY_NOT_EVALUATED`                             | Không có quyền phù hợp cho lệnh gọi này; yêu cầu chưa được chính sách phê duyệt   |
| `POLICY_CHANGED`                                   | Cấu hình đã thay đổi giữa thời điểm phê duyệt và thực thi                         |
| `GRANT_EXPIRED`                                    | Quyền cấp thường trực đã hết hiệu lực trước khi thực thi                          |
| `APPROVAL_CANCELLED`                               | Lần chạy bị hủy trong khi đang chờ phê duyệt                                      |
