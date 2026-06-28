---
read_when:
    - Xác nhận quyền sở hữu tổ chức, thương hiệu, phạm vi package, handle chủ sở hữu, slug kỹ năng hoặc namespace package
    - Đang phân giải một namespace đã được xác nhận quyền sở hữu hoặc được đặt trước
    - Quyết định nên dùng báo cáo, khiếu nại hay yêu cầu xác nhận namespace
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub đánh giá các tranh chấp về quyền sở hữu tổ chức, thương hiệu, định danh chủ sở hữu, phạm vi gói, slug kỹ năng hoặc không gian tên.
title: Yêu cầu xác nhận tổ chức và không gian tên
x-i18n:
    generated_at: "2026-06-28T20:41:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Yêu cầu về tổ chức và không gian tên

ClawHub sử dụng định danh chủ sở hữu, định danh tổ chức, slug Skills, tên gói Plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về một
dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức trong đời thực nhưng đã được
xác nhận quyền, được giữ riêng, gây hiểu lầm hoặc đang bị tranh chấp trên ClawHub, hãy yêu cầu đội ngũ xem xét không gian tên đó
bằng
[biểu mẫu issue Yêu cầu về tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Sử dụng đường dẫn này cho việc xem xét quyền sở hữu công khai, không nhạy cảm. Không sử dụng báo cáo trong sản phẩm
hoặc biểu mẫu kháng nghị tài khoản cho các yêu cầu về không gian tên.

## Khi nào cần mở một yêu cầu

Mở yêu cầu về không gian tên khi bạn cho rằng đội ngũ ClawHub nên xem xét liệu một
không gian tên có nên được giữ riêng, chuyển giao, đổi tên, ẩn, cách ly, tạo bí danh
hoặc thay đổi theo cách khác vì quyền sở hữu trong đời thực hay không.

Ví dụ bao gồm:

- định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- phạm vi gói như `@example-org/*` chỉ nên được phát hành dưới
  chủ sở hữu ClawHub tương ứng
- slug Skills hoặc tên gói Plugin có vẻ mạo danh một dự án
- tranh chấp về thương hiệu, nhãn hiệu, đổi tên dự án hoặc lịch sử gói
- chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ, khiến chủ sở hữu hợp pháp của không gian tên
  bị chặn

Nếu mục niêm yết không an toàn, độc hại hoặc gây hiểu lầm ngoài tranh chấp quyền sở hữu,
hãy làm theo hướng dẫn kiểm duyệt hoặc bảo mật có liên quan. Biểu mẫu yêu cầu về không gian tên
dành cho việc xem xét quyền sở hữu, không phải tiết lộ lỗ hổng khẩn cấp.

## Trước khi bạn gửi

Trước tiên hãy xác nhận rằng bạn đang phát hành bằng chủ sở hữu khớp với không gian tên.
Đối với các gói Plugin, tên có phạm vi như `@example-org/example-plugin` phải được
phát hành dưới chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy trực tiếp sửa không gian tên bằng cách phát hành,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Sử dụng yêu cầu
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi đội ngũ cần giải quyết một
tranh chấp.

## Bằng chứng cần đưa vào

Sử dụng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức GitHub, repo, bản phát hành hoặc người bảo trì
- tài liệu dự án chính thức có nêu tên không gian tên
- bằng chứng về miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc sổ đăng ký gói khác
- bằng chứng về nhãn hiệu, thương hiệu hoặc quyền sở hữu dự án có thể thảo luận an toàn
  công khai
- lịch sử kho nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, Skills, Plugin, gói hoặc issue ClawHub đang bị tranh chấp

Giải thích mỗi liên kết chứng minh điều gì. Đội ngũ phải có thể hiểu
mối quan hệ mà không cần thông tin xác thực riêng tư hoặc bí mật.

## Không nên đưa vào

Không đưa bí mật hoặc bằng chứng riêng tư vào issue GitHub công khai. Không bao gồm:

- mã thông báo API, khóa ký hoặc thông tin xác thực
- mã thông báo thử thách DNS
- tệp pháp lý hoặc hợp đồng riêng tư
- giấy tờ định danh cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu yêu cầu sẽ hỏi liệu bằng chứng nhạy cảm có cần kênh riêng với đội ngũ hay không.
Hãy sử dụng tùy chọn đó thay vì đăng tài liệu nhạy cảm công khai.

## Kết quả có thể xảy ra

Tùy thuộc vào bằng chứng và rủi ro, đội ngũ ClawHub có thể giữ riêng một không gian tên,
chuyển giao quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly một mục niêm yết hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không bảo đảm rằng mọi tên khớp đều sẽ được chuyển giao.
Đội ngũ cân nhắc bằng chứng công khai, mức sử dụng hiện tại, rủi ro bảo mật và tác động tới người dùng.

## Tài liệu liên quan

- [Phát hành](/vi/clawhub/publishing)
- [Khắc phục sự cố](/vi/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation)
- [Bảo mật](/vi/clawhub/security)
