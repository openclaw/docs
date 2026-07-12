---
read_when:
    - Bạn muốn dùng thử ưu đãi khuyến mãi mô hình miễn phí từ ClawHub
    - Bạn đang cấu hình một nhà cung cấp thông qua chương trình khuyến mãi thay vì quy trình thiết lập ban đầu
summary: Tài liệu tham khảo CLI cho `openclaw promos` (liệt kê và nhận các ưu đãi khuyến mãi về mô hình)
title: Khuyến mãi
x-i18n:
    generated_at: "2026-07-12T07:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Khám phá và nhận các ưu đãi mô hình khuyến mãi được đăng trên ClawHub. Việc nhận
khuyến mãi sẽ cấu hình nhà cung cấp (xác thực và Plugin khi cần) và đăng ký
các mô hình của chương trình khuyến mãi — mà không chạy lại quy trình thiết lập ban đầu và không thay đổi
mô hình mặc định của bạn, trừ khi bạn yêu cầu.

Liên quan:

- Mô hình mặc định và các phương án dự phòng: [Mô hình](/vi/cli/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Lệnh

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Liệt kê các chương trình khuyến mãi hiện đang có hiệu lực, cùng với các mô hình, lựa chọn mặc định được đề xuất,
thời gian còn lại và lệnh nhận chính xác. `--json` in ra tải trọng
thô.

## `openclaw promos claim <slug>`

Nhận một chương trình khuyến mãi đang có hiệu lực:

1. Tải chương trình khuyến mãi từ ClawHub và xác minh rằng chương trình vẫn nằm trong thời hạn hiệu lực.
2. Xác thực nhà cung cấp, lựa chọn xác thực và các gói Plugin được khai báo của chương trình khuyến mãi
   đối với phiên bản OpenClaw đã cài đặt của bạn. Các mã định danh không xác định hoặc gói không khớp sẽ
   bị từ chối — một chương trình khuyến mãi không bao giờ có thể khiến CLI chạy bất kỳ thứ gì mà CLI chưa
   biết cách thực hiện.
3. Tái sử dụng thông tin xác thực nhà cung cấp hiện có của bạn nếu có. Nếu không,
   CLI sẽ hướng dẫn bạn qua quy trình xác thực thông thường của nhà cung cấp (trước tiên in ra URL đăng ký
   của chương trình khuyến mãi để nhận khóa miễn phí). `--api-key <key>` hoàn tất xác thực bằng khóa API mà không
   cần lời nhắc, tương ứng với các cờ không tương tác của `openclaw onboard`; để không đưa
   khóa lên dòng lệnh, hãy xuất biến môi trường của nhà cung cấp
   thay vào đó (ví dụ `OPENROUTER_API_KEY`) — thông tin xác thực hiện có trong môi trường được
   tự động phát hiện và không cần cờ.
4. Đăng ký các mô hình của chương trình khuyến mãi cùng với bí danh của chúng. Các bí danh hiện có
   không bao giờ bị ghi đè.
5. Đề nghị đặt mô hình được chương trình khuyến mãi đề xuất làm mặc định của bạn —
   `--set-default` bỏ qua câu hỏi; nếu không, các thiết lập mặc định của bạn
   không thay đổi.

Khi thời hạn của chương trình khuyến mãi kết thúc, nhà cung cấp sẽ ngừng phục vụ các mô hình miễn phí;
cấu hình và thông tin xác thực của bạn không bị thay đổi. Bạn có thể chuyển lại bất kỳ lúc nào bằng
`openclaw models set <model>`.

## Khám phá thụ động trong `models list`

`openclaw models list` cũng hiển thị các chương trình khuyến mãi mà không cần bạn truy vấn trực tiếp
ClawHub:

- Các ưu đãi đang có hiệu lực có mô hình mà bạn chưa cấu hình sẽ xuất hiện trong nhóm
  "Có sẵn qua chương trình khuyến mãi" bên dưới bảng, mỗi ưu đãi đi kèm lệnh
  nhận tương ứng.
- Các mô hình bạn đã đăng ký qua `promos claim` mang thẻ `promo`, thẻ này
  chuyển thành `promo ended` sau khi thời hạn của ưu đãi kết thúc.
- Lần đầu phát hiện một ưu đãi mới, một thông báo dùng một lần sẽ trỏ đến
  `openclaw promos list`. Các ưu đãi bạn đã liệt kê hoặc nhận sẽ không bao giờ
  được thông báo lại.

Quá trình này đọc bản sao được lưu vào bộ nhớ đệm cục bộ của nguồn cấp chương trình khuyến mãi do ClawHub lưu trữ
(thông thường được làm mới mỗi ngày một lần bằng yêu cầu có điều kiện, hoặc sớm hơn khi
bản chụp lưu trong bộ nhớ đệm hết hạn; các lỗi làm mới được âm thầm bỏ qua). Quá trình làm mới dữ liệu cũ
chỉ chờ tối đa 2,5 giây và không bao giờ làm gián đoạn việc liệt kê. Đầu ra `--json` và
`--plain` vẫn phù hợp để máy xử lý: không có phần hoặc thông báo về chương trình khuyến mãi.
Thao tác nhận luôn xác thực lại với API ClawHub trực tiếp, vì vậy một ưu đãi bị rút
sớm sẽ bị từ chối ngay cả khi bản sao lưu trong bộ nhớ đệm vẫn hiển thị ưu đãi đó.
