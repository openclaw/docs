---
read_when:
    - Nhận quyền sở hữu một tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu, slug kỹ năng hoặc namespace gói
    - Đang phân giải một không gian tên đã được xác nhận hoặc dành riêng
    - Quyết định nên dùng báo cáo, kháng nghị hay yêu cầu quyền đối với namespace
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét các tranh chấp về quyền sở hữu tổ chức, thương hiệu, handle của chủ sở hữu, phạm vi gói, slug của skill hoặc namespace.
title: Yêu cầu xác nhận tổ chức và không gian tên
x-i18n:
    generated_at: "2026-07-05T05:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Yêu Cầu Xác Nhận Tổ Chức Và Không Gian Tên

ClawHub dùng định danh chủ sở hữu, định danh tổ chức, slug kỹ năng, tên gói plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về
một dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức ngoài đời thực nhưng đã bị
xác nhận, giữ trước, gây hiểu nhầm hoặc đang bị tranh chấp trên ClawHub, hãy yêu cầu đội ngũ xem xét
bằng
[biểu mẫu vấn đề Yêu cầu xác nhận Tổ chức / Không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Dùng đường dẫn này cho việc xem xét quyền sở hữu công khai, không nhạy cảm. Không dùng báo cáo
trong sản phẩm hoặc biểu mẫu khiếu nại tài khoản cho các yêu cầu xác nhận không gian tên.

## Khi Nào Cần Mở Yêu Cầu Xác Nhận

Mở yêu cầu xác nhận không gian tên khi bạn cho rằng đội ngũ ClawHub nên xem xét liệu một
không gian tên có nên được giữ trước, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc thay đổi theo cách khác vì quyền sở hữu ngoài đời thực hay không.

Ví dụ bao gồm:

- một định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- một phạm vi gói như `@example-org/*` chỉ nên được phát hành dưới
  chủ sở hữu ClawHub tương ứng
- một slug kỹ năng hoặc tên gói plugin có vẻ mạo danh một dự án
- một tranh chấp về thương hiệu, nhãn hiệu, việc đổi tên dự án hoặc lịch sử gói
- một chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ đang chặn chủ sở hữu
  không gian tên hợp pháp

Nếu mục niêm yết không an toàn, độc hại hoặc gây hiểu nhầm ngoài tranh chấp quyền sở hữu,
hãy làm theo hướng dẫn kiểm duyệt hoặc bảo mật liên quan. Biểu mẫu yêu cầu xác nhận
không gian tên dùng để xem xét quyền sở hữu, không phải để tiết lộ lỗ hổng khẩn cấp.

## Trước Khi Bạn Gửi

Trước tiên hãy xác nhận rằng bạn đang phát hành bằng chủ sở hữu khớp với không gian tên.
Đối với các gói plugin, tên có phạm vi như `@example-org/example-plugin` phải được
phát hành với chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy sửa trực tiếp không gian tên bằng cách phát hành,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Dùng yêu cầu xác nhận
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi đội ngũ cần giải quyết một
tranh chấp.

## Bằng Chứng Cần Bao Gồm

Dùng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức GitHub, kho lưu trữ, bản phát hành hoặc người bảo trì
- tài liệu dự án chính thức có nêu không gian tên
- bằng chứng về miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc sổ đăng ký gói khác
- bằng chứng về nhãn hiệu, thương hiệu hoặc quyền sở hữu dự án an toàn để thảo luận
  công khai
- lịch sử kho lưu trữ nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, kỹ năng, plugin, gói hoặc vấn đề ClawHub đang bị tranh chấp

Giải thích mỗi liên kết chứng minh điều gì. Đội ngũ phải có thể hiểu
mối quan hệ mà không cần thông tin đăng nhập riêng tư hoặc bí mật.

## Những Gì Không Nên Bao Gồm

Không đưa bí mật hoặc bằng chứng riêng tư vào một vấn đề GitHub công khai. Không bao gồm:

- mã token API, khóa ký hoặc thông tin xác thực
- mã token thử thách DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ tùy thân cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu yêu cầu xác nhận sẽ hỏi liệu bằng chứng nhạy cảm có cần một kênh riêng với đội ngũ hay không.
Hãy dùng tùy chọn đó thay vì đăng tài liệu nhạy cảm công khai.

## Kết Quả Có Thể Xảy Ra

Tùy vào bằng chứng và rủi ro, đội ngũ ClawHub có thể giữ trước một không gian tên,
chuyển quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly một mục niêm yết hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên khớp sẽ được chuyển giao.
Đội ngũ cân nhắc bằng chứng công khai, cách sử dụng hiện có, rủi ro bảo mật và tác động đến người dùng.

## Tài Liệu Liên Quan

- [Phát hành](/vi/clawhub/publishing)
- [Khắc phục sự cố](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và An toàn tài khoản](/clawhub/moderation)
- [Bảo mật](/clawhub/security)
