---
read_when:
    - Xác nhận quyền sở hữu một tổ chức, thương hiệu, phạm vi gói, tên định danh của chủ sở hữu, slug của skill hoặc không gian tên gói
    - Phân giải một không gian tên đã được xác nhận quyền sở hữu hoặc dành riêng
    - Quyết định nên sử dụng báo cáo, kháng nghị hay yêu cầu xác lập quyền đối với không gian tên
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét các tranh chấp về quyền sở hữu tổ chức, thương hiệu, tên định danh của chủ sở hữu, phạm vi gói, slug của skill hoặc không gian tên.
title: Yêu cầu quyền sở hữu tổ chức và không gian tên
x-i18n:
    generated_at: "2026-07-12T07:43:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Khiếu nại về tổ chức và không gian tên

ClawHub sử dụng định danh chủ sở hữu, định danh tổ chức, slug của skill, tên gói Plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về một
dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức ngoài đời thực nhưng đã bị
chiếm dụng, được dành riêng, gây hiểu nhầm hoặc đang có tranh chấp trên ClawHub, hãy yêu cầu nhân viên xem xét
bằng
[biểu mẫu vấn đề Khiếu nại tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Sử dụng quy trình này để xem xét quyền sở hữu công khai, không nhạy cảm. Không sử dụng báo cáo
trong sản phẩm hoặc biểu mẫu khiếu nại tài khoản cho các khiếu nại về không gian tên.

## Khi nào cần gửi khiếu nại

Gửi khiếu nại về không gian tên khi bạn cho rằng nhân viên ClawHub cần xem xét liệu một
không gian tên có nên được dành riêng, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc thay đổi theo cách khác vì lý do quyền sở hữu ngoài đời thực hay không.

Ví dụ:

- định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- phạm vi gói như `@example-org/*` chỉ nên được phát hành dưới
  chủ sở hữu ClawHub tương ứng
- slug của skill hoặc tên gói Plugin có dấu hiệu mạo danh một dự án
- tranh chấp về thương hiệu, nhãn hiệu, việc đổi tên dự án hoặc lịch sử gói
- chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ, gây cản trở chủ sở hữu hợp pháp của không gian tên

Nếu mục niêm yết không an toàn, độc hại hoặc gây hiểu nhầm ngoài phạm vi tranh chấp quyền sở hữu,
hãy đồng thời làm theo hướng dẫn kiểm duyệt hoặc bảo mật có liên quan. Biểu mẫu khiếu nại
không gian tên dùng để xem xét quyền sở hữu, không dùng để tiết lộ lỗ hổng khẩn cấp.

## Trước khi gửi

Trước tiên, hãy xác nhận rằng bạn đang phát hành bằng chủ sở hữu khớp với không gian tên.
Đối với các gói Plugin, tên có phạm vi như `@example-org/example-plugin` phải được
phát hành dưới chủ sở hữu `example-org` tương ứng.

Nếu có thể quản lý chủ sở hữu hiện tại, hãy trực tiếp khắc phục không gian tên bằng cách phát hành,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Hãy gửi khiếu nại
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi nhân viên cần giải quyết
tranh chấp.

## Bằng chứng cần cung cấp

Sử dụng bằng chứng công khai, không nhạy cảm. Các bằng chứng hữu ích bao gồm:

- lịch sử tổ chức, kho lưu trữ, bản phát hành hoặc người bảo trì trên GitHub
- tài liệu chính thức của dự án có nêu không gian tên
- bằng chứng về tên miền hoặc tên miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc kho đăng ký gói khác
- bằng chứng về quyền sở hữu nhãn hiệu, thương hiệu hoặc dự án có thể được thảo luận
  công khai một cách an toàn
- lịch sử kho mã nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, skill, Plugin, gói hoặc vấn đề đang tranh chấp trên ClawHub

Giải thích nội dung mà từng liên kết chứng minh. Nhân viên phải có thể hiểu
mối quan hệ mà không cần thông tin xác thực hoặc bí mật riêng tư.

## Những nội dung không được cung cấp

Không đưa bí mật hoặc bằng chứng riêng tư vào vấn đề GitHub công khai. Không bao gồm:

- token API, khóa ký hoặc thông tin xác thực
- token thử thách DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ định danh cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu khiếu nại sẽ hỏi liệu bằng chứng nhạy cảm có cần được gửi qua kênh riêng tư của nhân viên hay không.
Hãy sử dụng tùy chọn đó thay vì đăng công khai tài liệu nhạy cảm.

## Các kết quả có thể xảy ra

Tùy thuộc vào bằng chứng và rủi ro, nhân viên ClawHub có thể dành riêng một không gian tên,
chuyển giao quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly mục niêm yết hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên trùng khớp đều sẽ được chuyển giao.
Nhân viên cân nhắc bằng chứng công khai, tình trạng sử dụng hiện tại, rủi ro bảo mật và tác động đến người dùng.

## Tài liệu liên quan

- [Phát hành](/vi/clawhub/publishing)
- [Khắc phục sự cố](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation)
- [Bảo mật](/clawhub/security)
