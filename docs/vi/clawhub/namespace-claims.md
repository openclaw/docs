---
read_when:
    - Yêu cầu xác nhận một tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu, slug kỹ năng hoặc không gian tên gói
    - Đang phân giải một không gian tên đã được xác nhận quyền sở hữu hoặc được dành riêng
    - Quyết định nên dùng báo cáo, kháng nghị hay yêu cầu quyền đối với namespace
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét các tranh chấp về quyền sở hữu tổ chức, thương hiệu, định danh chủ sở hữu, phạm vi gói, slug của skill hoặc không gian tên.
title: Xác nhận quyền sở hữu tổ chức và không gian tên
x-i18n:
    generated_at: "2026-07-04T10:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Yêu Cầu Xác Nhận Tổ Chức và Không Gian Tên

ClawHub dùng định danh chủ sở hữu, định danh tổ chức, slug Skills, tên gói Plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về một
dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức trong thực tế nhưng đã được
xác nhận, đặt trước, gây hiểu lầm hoặc đang bị tranh chấp trên ClawHub, hãy yêu cầu đội ngũ phụ trách xem xét
bằng
[biểu mẫu vấn đề Yêu Cầu Xác Nhận Tổ Chức / Không Gian Tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Dùng đường dẫn này cho việc xem xét quyền sở hữu công khai, không nhạy cảm. Không dùng báo cáo trong sản phẩm
hoặc biểu mẫu kháng nghị tài khoản cho các yêu cầu xác nhận không gian tên.

## Khi Nào Cần Mở Yêu Cầu Xác Nhận

Mở yêu cầu xác nhận không gian tên khi bạn tin rằng đội ngũ phụ trách ClawHub nên xem xét liệu một
không gian tên có nên được đặt trước, chuyển nhượng, đổi tên, ẩn, cách ly, thêm bí danh
hoặc thay đổi theo cách khác vì quyền sở hữu trong thực tế hay không.

Ví dụ bao gồm:

- định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- phạm vi gói như `@example-org/*` chỉ nên được xuất bản dưới chủ sở hữu ClawHub
  tương ứng
- slug Skills hoặc tên gói Plugin có vẻ mạo danh một dự án
- tranh chấp về thương hiệu, nhãn hiệu, đổi tên dự án hoặc lịch sử gói
- chủ sở hữu đã bị xóa, không hoạt động hoặc không liên hệ được đang chặn chủ sở hữu
  không gian tên hợp pháp

Nếu mục đăng không an toàn, độc hại hoặc gây hiểu lầm ngoài tranh chấp quyền sở hữu,
cũng hãy làm theo hướng dẫn kiểm duyệt hoặc bảo mật liên quan. Biểu mẫu yêu cầu xác nhận không gian tên
dành cho việc xem xét quyền sở hữu, không phải tiết lộ lỗ hổng khẩn cấp.

## Trước Khi Bạn Gửi

Trước tiên hãy xác nhận rằng bạn đang xuất bản bằng chủ sở hữu khớp với không gian tên.
Đối với các gói Plugin, tên có phạm vi như `@example-org/example-plugin` phải được
xuất bản dưới chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy sửa không gian tên trực tiếp bằng cách xuất bản,
đổi tên, chuyển nhượng, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Dùng yêu cầu xác nhận
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi đội ngũ phụ trách cần giải quyết
tranh chấp.

## Bằng Chứng Cần Bao Gồm

Dùng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức GitHub, kho lưu trữ, bản phát hành hoặc người bảo trì
- tài liệu dự án chính thức nêu tên không gian tên
- bằng chứng về miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc sổ đăng ký gói khác
- bằng chứng về quyền sở hữu nhãn hiệu, thương hiệu hoặc dự án an toàn để thảo luận
  công khai
- lịch sử kho lưu trữ nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, Skills, Plugin, gói hoặc vấn đề ClawHub đang tranh chấp

Giải thích mỗi liên kết chứng minh điều gì. Đội ngũ phụ trách phải có thể hiểu
mối quan hệ mà không cần thông tin đăng nhập riêng tư hoặc bí mật.

## Không Nên Bao Gồm Gì

Không đưa bí mật hoặc bằng chứng riêng tư vào vấn đề GitHub công khai. Không bao gồm:

- mã thông báo API, khóa ký hoặc thông tin đăng nhập
- mã thông báo thử thách DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ định danh cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bảo mật

Biểu mẫu yêu cầu xác nhận sẽ hỏi liệu bằng chứng nhạy cảm có cần kênh riêng với đội ngũ phụ trách hay không.
Hãy dùng tùy chọn đó thay vì đăng tài liệu nhạy cảm công khai.

## Kết Quả Có Thể Xảy Ra

Tùy thuộc vào bằng chứng và rủi ro, đội ngũ phụ trách ClawHub có thể đặt trước một không gian tên,
chuyển nhượng quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly một mục đăng hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên khớp đều sẽ được chuyển nhượng.
Đội ngũ phụ trách cân nhắc bằng chứng công khai, mức sử dụng hiện có, rủi ro bảo mật và tác động đến người dùng.

## Tài Liệu Liên Quan

- [Xuất Bản](/vi/clawhub/publishing)
- [Khắc Phục Sự Cố](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm Duyệt và An Toàn Tài Khoản](/clawhub/moderation)
- [Bảo Mật](/clawhub/security)
