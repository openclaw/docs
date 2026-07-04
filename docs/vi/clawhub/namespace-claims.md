---
read_when:
    - Yêu cầu quyền sở hữu một tổ chức, thương hiệu, phạm vi gói, tên định danh chủ sở hữu, slug kỹ năng, hoặc không gian tên gói
    - Đang phân giải một namespace đã được xác nhận hoặc đặt trước
    - Quyết định nên dùng báo cáo, kháng nghị hay xác nhận namespace
sidebarTitle: Org and Namespace Claims
summary: Cách yêu cầu ClawHub xem xét các tranh chấp về quyền sở hữu tổ chức, thương hiệu, handle của chủ sở hữu, phạm vi gói, slug của skill hoặc namespace.
title: Tuyên bố quyền sở hữu tổ chức và không gian tên
x-i18n:
    generated_at: "2026-07-04T18:06:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Khiếu nại về tổ chức và không gian tên

ClawHub dùng định danh chủ sở hữu, định danh tổ chức, slug kỹ năng, tên gói Plugin và
phạm vi gói làm không gian tên công khai. Nếu một không gian tên có vẻ thuộc về
một dự án, thương hiệu, hệ sinh thái gói hoặc tổ chức trong thế giới thực nhưng đã
bị khiếu nại, đặt trước, gây hiểu lầm hoặc đang tranh chấp trên ClawHub, hãy yêu cầu nhân viên xem xét
bằng
[biểu mẫu vấn đề Khiếu nại về tổ chức / không gian tên](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Dùng đường dẫn này để xem xét quyền sở hữu công khai, không nhạy cảm. Không dùng báo cáo
trong sản phẩm hoặc biểu mẫu khiếu nại tài khoản cho các khiếu nại về không gian tên.

## Khi nào mở khiếu nại

Mở khiếu nại về không gian tên khi bạn cho rằng nhân viên ClawHub nên xem xét liệu một
không gian tên có nên được đặt trước, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc thay đổi theo cách khác vì quyền sở hữu trong thế giới thực hay không.

Ví dụ bao gồm:

- một định danh tổ chức khớp với tổ chức GitHub, dự án, công ty hoặc cộng đồng của bạn
- một phạm vi gói như `@example-org/*` chỉ nên được xuất bản dưới
  chủ sở hữu ClawHub tương ứng
- một slug kỹ năng hoặc tên gói Plugin có vẻ mạo danh một dự án
- tranh chấp về thương hiệu, nhãn hiệu, việc đổi tên dự án hoặc lịch sử gói
- một chủ sở hữu đã bị xóa, không hoạt động hoặc không thể liên hệ, đang chặn chủ sở hữu
  không gian tên hợp pháp

Nếu mục niêm yết không an toàn, độc hại hoặc gây hiểu lầm ngoài tranh chấp quyền sở hữu,
hãy làm theo hướng dẫn kiểm duyệt hoặc bảo mật liên quan. Biểu mẫu khiếu nại không gian tên
dành cho việc xem xét quyền sở hữu, không phải công bố lỗ hổng khẩn cấp.

## Trước khi bạn gửi

Trước tiên hãy xác nhận rằng bạn đang xuất bản bằng chủ sở hữu khớp với không gian tên.
Đối với các gói Plugin, các tên có phạm vi như `@example-org/example-plugin` phải được
xuất bản dưới chủ sở hữu `example-org` tương ứng.

Nếu bạn có thể quản lý chủ sở hữu hiện tại, hãy trực tiếp sửa không gian tên bằng cách xuất bản,
đổi tên, chuyển giao, ẩn hoặc xóa tài nguyên bị ảnh hưởng. Dùng khiếu nại
khi bạn không thể quản lý chủ sở hữu hiện tại hoặc khi nhân viên cần giải quyết một
tranh chấp.

## Bằng chứng cần đưa vào

Dùng bằng chứng công khai, không nhạy cảm. Bằng chứng hữu ích bao gồm:

- lịch sử tổ chức GitHub, kho lưu trữ, bản phát hành hoặc người bảo trì
- tài liệu dự án chính thức nêu tên không gian tên
- bằng chứng về miền hoặc miền email chính thức
- quyền kiểm soát phạm vi trên npm, PyPI, crates.io hoặc sổ đăng ký gói khác
- bằng chứng về quyền sở hữu nhãn hiệu, thương hiệu hoặc dự án có thể thảo luận
  công khai một cách an toàn
- lịch sử kho lưu trữ nguồn, lịch sử gói hoặc thông báo đổi tên công khai
- liên kết đến chủ sở hữu, kỹ năng, Plugin, gói hoặc vấn đề ClawHub đang tranh chấp

Giải thích mỗi liên kết chứng minh điều gì. Nhân viên cần có thể hiểu
mối quan hệ mà không cần thông tin đăng nhập riêng tư hoặc bí mật.

## Không nên đưa vào

Không đưa bí mật hoặc bằng chứng riêng tư vào một vấn đề GitHub công khai. Không bao gồm:

- token API, khóa ký hoặc thông tin đăng nhập
- token thử thách DNS
- hồ sơ pháp lý hoặc hợp đồng riêng tư
- giấy tờ định danh cá nhân
- email riêng tư, báo cáo bảo mật riêng tư hoặc dữ liệu khách hàng bí mật

Biểu mẫu khiếu nại hỏi liệu bằng chứng nhạy cảm có cần kênh riêng với nhân viên hay không.
Hãy dùng tùy chọn đó thay vì đăng tài liệu nhạy cảm công khai.

## Kết quả có thể xảy ra

Tùy vào bằng chứng và rủi ro, nhân viên ClawHub có thể đặt trước một không gian tên,
chuyển giao quyền sở hữu, đổi tên tài nguyên, ẩn hoặc cách ly một mục niêm yết hiện có,
thêm bí danh hoặc chuyển hướng, yêu cầu thêm bằng chứng hoặc từ chối yêu cầu.

Việc xem xét không gian tên không đảm bảo rằng mọi tên khớp sẽ được chuyển giao.
Nhân viên cân nhắc bằng chứng công khai, mức sử dụng hiện có, rủi ro bảo mật và tác động đến người dùng.

## Tài liệu liên quan

- [Xuất bản](/vi/clawhub/publishing)
- [Khắc phục sự cố](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation)
- [Bảo mật](/clawhub/security)
