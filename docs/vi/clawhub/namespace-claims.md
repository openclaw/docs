---
read_when:
    - Xác nhận quyền sở hữu tổ chức, thương hiệu, phạm vi gói, tên định danh chủ sở hữu, slug kỹ năng hoặc không gian tên gói
    - Giải quyết một không gian tên đã được xác nhận quyền sở hữu hoặc được dành riêng
    - Quyết định nên dùng báo cáo, kháng nghị hay yêu cầu xác nhận namespace
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét tranh chấp quyền sở hữu đối với tổ chức, thương hiệu, định danh chủ sở hữu, phạm vi gói, slug kỹ năng hoặc không gian tên.
title: Tuyên bố quyền sở hữu tổ chức và không gian tên
x-i18n:
    generated_at: "2026-06-28T05:07:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Yêu cầu về tổ chức và không gian tên

ClawHub sử dụng định danh chủ sở hữu, định danh tổ chức, slug kỹ năng, tên gói plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về một
dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức ngoài đời thực nhưng đã được
xác nhận quyền sở hữu, giữ chỗ, gây hiểu lầm hoặc đang bị tranh chấp trên ClawHub, hãy yêu cầu nhân viên xem xét
bằng
[biểu mẫu issue Yêu cầu về tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Sử dụng đường dẫn này cho quy trình xem xét quyền sở hữu công khai, không nhạy cảm. Không dùng các
báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản cho các yêu cầu về không gian tên.

## Khi nào cần mở yêu cầu

Mở yêu cầu về không gian tên khi bạn cho rằng nhân viên ClawHub nên xem xét liệu một
không gian tên có nên được giữ chỗ, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc thay đổi theo cách khác vì quyền sở hữu ngoài đời thực hay không.

Ví dụ bao gồm:

- một định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- một phạm vi gói như `@example-org/*` chỉ nên được phát hành dưới
  chủ sở hữu ClawHub tương ứng
- một slug kỹ năng hoặc tên gói plugin có vẻ mạo danh một dự án
- một tranh chấp về thương hiệu, nhãn hiệu, đổi tên dự án hoặc lịch sử gói
- một chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ đang chặn chủ sở hữu
  không gian tên hợp pháp

Nếu listing không an toàn, độc hại hoặc gây hiểu lầm vượt ngoài tranh chấp quyền sở hữu,
hãy cũng làm theo hướng dẫn kiểm duyệt hoặc bảo mật liên quan. Biểu mẫu yêu cầu về không gian tên
dành cho việc xem xét quyền sở hữu, không phải để tiết lộ lỗ hổng khẩn cấp.

## Trước khi gửi

Trước tiên hãy xác nhận rằng bạn đang phát hành bằng chủ sở hữu khớp với không gian tên.
Đối với các gói plugin, tên có phạm vi như `@example-org/example-plugin` phải được
phát hành dưới chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy sửa không gian tên trực tiếp bằng cách phát hành,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Sử dụng yêu cầu
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi nhân viên cần giải quyết một
tranh chấp.

## Bằng chứng cần đưa vào

Sử dụng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức GitHub, repo, bản phát hành hoặc người bảo trì
- tài liệu dự án chính thức nêu tên không gian tên
- bằng chứng về miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc registry gói khác
- bằng chứng về nhãn hiệu, thương hiệu hoặc quyền sở hữu dự án an toàn để thảo luận
  công khai
- lịch sử kho nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, kỹ năng, plugin, gói hoặc issue ClawHub đang bị tranh chấp

Giải thích mỗi liên kết chứng minh điều gì. Nhân viên nên có thể hiểu
mối quan hệ mà không cần thông tin đăng nhập riêng tư hoặc bí mật.

## Những gì không nên đưa vào

Không đưa bí mật hoặc bằng chứng riêng tư vào một issue GitHub công khai. Không bao gồm:

- token API, khóa ký hoặc thông tin xác thực
- token thử thách DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ định danh cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu yêu cầu sẽ hỏi liệu bằng chứng nhạy cảm có cần kênh nhân viên riêng tư hay không.
Hãy sử dụng tùy chọn đó thay vì đăng tài liệu nhạy cảm công khai.

## Kết quả có thể xảy ra

Tùy thuộc vào bằng chứng và rủi ro, nhân viên ClawHub có thể giữ chỗ một không gian tên,
chuyển giao quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly một listing hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên khớp đều sẽ được chuyển giao.
Nhân viên cân nhắc bằng chứng công khai, mức sử dụng hiện có, rủi ro bảo mật và tác động đến người dùng.

## Tài liệu liên quan

- [Phát hành](/vi/clawhub/publishing)
- [Khắc phục sự cố](/vi/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation)
- [Bảo mật](/vi/clawhub/security)
