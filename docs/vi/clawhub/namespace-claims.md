---
read_when:
    - Xác nhận quyền sở hữu một tổ chức, thương hiệu, phạm vi gói, tên định danh chủ sở hữu, slug của skill hoặc không gian tên gói
    - Phân giải một không gian tên đã được đăng ký hoặc dành riêng
    - Quyết định nên sử dụng báo cáo, kháng nghị hay yêu cầu xác nhận không gian tên
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét các tranh chấp về quyền sở hữu tổ chức, thương hiệu, tên định danh của chủ sở hữu, phạm vi gói, slug của skill hoặc không gian tên.
title: Xác nhận quyền sở hữu tổ chức và không gian tên
x-i18n:
    generated_at: "2026-07-16T15:01:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Khiếu nại về tổ chức và không gian tên

ClawHub sử dụng tên định danh của chủ sở hữu, tên định danh của tổ chức, slug của skill, tên gói plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về một
dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức có thật nhưng đã bị
đăng ký, đặt trước, gây hiểu nhầm hoặc đang có tranh chấp trên ClawHub, hãy yêu cầu nhân viên xem xét
thông qua
[biểu mẫu vấn đề Khiếu nại về tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Sử dụng quy trình này để xem xét quyền sở hữu công khai, không nhạy cảm. Không sử dụng báo cáo
trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản để khiếu nại không gian tên.

## Khi nào cần mở khiếu nại

Mở khiếu nại về không gian tên khi bạn cho rằng nhân viên ClawHub cần xem xét liệu một
không gian tên có nên được đặt trước, chuyển giao, đổi tên, ẩn, cách ly, tạo bí danh
hoặc thay đổi theo cách khác do quyền sở hữu trong thực tế hay không.

Ví dụ bao gồm:

- tên định danh của tổ chức trùng với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- phạm vi gói như `@example-org/*` chỉ nên được phát hành dưới
  chủ sở hữu ClawHub tương ứng
- slug của skill hoặc tên gói plugin có dấu hiệu mạo danh một dự án
- tranh chấp về thương hiệu, nhãn hiệu, việc đổi tên dự án hoặc lịch sử gói
- chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ, khiến chủ sở hữu hợp pháp của không gian tên
  bị cản trở

Nếu mục niêm yết không an toàn, độc hại hoặc gây hiểu nhầm ngoài phạm vi tranh chấp quyền sở hữu,
hãy đồng thời làm theo hướng dẫn kiểm duyệt hoặc bảo mật có liên quan. Biểu mẫu khiếu nại về không gian tên
dùng để xem xét quyền sở hữu, không dùng để tiết lộ khẩn cấp lỗ hổng bảo mật.

## Trước khi gửi

Trước tiên, hãy xác nhận rằng bạn đang phát hành bằng chủ sở hữu tương ứng với không gian tên.
Đối với các gói plugin, những tên có phạm vi như `@example-org/example-plugin` phải được
phát hành dưới chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy trực tiếp khắc phục không gian tên bằng cách phát hành,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Hãy gửi khiếu nại
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi nhân viên cần giải quyết
tranh chấp.

## Bằng chứng cần cung cấp

Sử dụng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức, kho lưu trữ, bản phát hành hoặc người bảo trì trên GitHub
- tài liệu chính thức của dự án có nêu không gian tên
- bằng chứng về tên miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc hệ thống đăng ký gói khác
- bằng chứng về quyền sở hữu nhãn hiệu, thương hiệu hoặc dự án có thể được thảo luận
  công khai một cách an toàn
- lịch sử kho lưu trữ mã nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, skill, plugin, gói hoặc vấn đề đang tranh chấp trên ClawHub

Giải thích điều mà mỗi liên kết chứng minh. Nhân viên phải có thể hiểu được
mối quan hệ mà không cần thông tin xác thực hoặc bí mật riêng tư.

## Những nội dung không nên cung cấp

Không đưa bí mật hoặc bằng chứng riêng tư vào một vấn đề GitHub công khai. Không bao gồm:

- token API, khóa ký hoặc thông tin xác thực
- token xác minh DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ tùy thân cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu khiếu nại sẽ hỏi liệu bằng chứng nhạy cảm có cần được gửi qua kênh riêng với nhân viên hay không.
Hãy sử dụng tùy chọn đó thay vì đăng công khai tài liệu nhạy cảm.

## Kết quả có thể xảy ra

Tùy theo bằng chứng và rủi ro, nhân viên ClawHub có thể đặt trước một không gian tên,
chuyển giao quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly mục niêm yết hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên trùng khớp đều sẽ được chuyển giao.
Nhân viên cân nhắc bằng chứng công khai, tình trạng sử dụng hiện tại, rủi ro bảo mật và tác động đến người dùng.

## Tài liệu liên quan

- [Phát hành](/vi/clawhub/publishing)
- [Khắc phục sự cố](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation)
- [Bảo mật](/clawhub/security)
