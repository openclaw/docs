---
read_when:
    - Bạn đang xác minh việc chuyển đổi bộ lưu trữ SQLite theo Đường dẫn 3 trên một Gateway đang hoạt động
    - Bạn cần phân biệt sự sai lệch JSONL cũ dự kiến với các lỗi thời gian chạy
    - Bạn đang xây dựng hoặc đánh giá bộ kiểm thử E2E SQLite trực tiếp do tác tử điều khiển
summary: Thiết kế bằng chứng Gateway trực tiếp cho việc chuyển đổi phiên/bản ghi hội thoại SQLite của Lộ trình 3
title: Bộ khung E2E SQLite trực tiếp cho Đường dẫn 3
x-i18n:
    generated_at: "2026-07-16T15:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Harness E2E SQLite trực tiếp của Path 3 chứng minh Gateway đang sử dụng SQLite làm kho lưu trữ phiên và bản chép lời chuẩn tắc, trong khi các tệp JSONL cũ vẫn là đầu vào di chuyển hoặc dữ liệu lưu trữ. Đây là harness chứng minh dành cho người bảo trì, không phải công cụ chẩn đoán thông thường cho người dùng.

Sau khi Gateway đã xử lý lưu lượng sau di chuyển, tính tương đồng với JSONL cũ không còn là tín hiệu hợp lệ về tình trạng runtime. Một Gateway đã di chuyển và hoạt động bình thường có thể có các hàng bản chép lời SQLite khác với số lượng trong JSONL cũ vì các lượt mới chỉ nên cập nhật SQLite. Do đó, harness trực tiếp phải đo lường hành vi của Gateway, sự thay đổi hàng SQLite, trạng thái không hoạt động của tệp cũ và tình trạng nhật ký ở mỗi bước.

## Dạng lệnh

Lệnh trực tiếp dự kiến là:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Lệnh kết nối với một Gateway đang chạy sẵn. Lệnh không khởi động, dừng, nhập hoặc chạy lại quá trình di chuyển, trừ khi một chế độ di chuyển rõ ràng được bổ sung sau này. Một biến thể CI hoặc cục bộ biệt lập có thể sử dụng
`test/helpers/openclaw-test-instance.ts`, nhưng đường dẫn chứng minh trực tiếp nên kiểm tra
Gateway thực tế của người vận hành và cơ sở dữ liệu SQLite thực theo từng tác nhân.

## Chứng minh CLI đã xây dựng trong môi trường biệt lập

Trình chạy chứng minh CLI đã xây dựng khởi tạo một kho phiên cũ biệt lập, khởi động Gateway đã xây dựng lại và chứng minh rằng khi khởi động, hệ thống nhập các phiên cũ đang hoạt động vào SQLite trước khi runtime bắt đầu đọc. Không được chạy `openclaw doctor --fix`
trước lần khởi động Gateway đầu tiên, vì điều đó sẽ chứng minh đường dẫn di chuyển thủ công thay vì đường dẫn nâng cấp mà người dùng nhận được ở lần khởi động đầu tiên sau khi chuyển đổi.

Sau khi nhập lúc khởi động, quy trình chứng minh biệt lập có thể chạy
`openclaw doctor --session-sqlite inspect` và
`openclaw doctor --session-sqlite validate` làm bằng chứng chẩn đoán. Các lệnh
doctor đó không phải tác nhân điều khiển quá trình di chuyển trong chứng minh nâng cấp lúc khởi động.
Các kịch bản nhập bằng doctor riêng biệt nên khởi tạo các tệp bản chép lời cũ cùng
các tệp phụ quỹ đạo và xác minh doctor lưu trữ các dữ liệu đó trong khi SQLite
vẫn là kho chuẩn tắc.

## Kiểm tra sơ bộ

Kiểm tra sơ bộ thu thập đường cơ sở và dừng với lỗi trước khi gửi một lượt chứng minh nếu
Gateway không thể sử dụng:

- `GET /health` và trạng thái chuyên sâu của Gateway phải báo cáo một
  Gateway đang chạy và có thể truy cập.
- Phiên bản CLI và Gateway phải khớp với nhánh đang được kiểm thử.
- Harness ghi lại con trỏ nhật ký cho tệp nhật ký đang hoạt động của Gateway.
- Harness ghi lại số lượng bảng SQLite theo từng tác nhân cho `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` và
  `session_routes`.
- Harness ghi lại `mtime`, `size` và trạng thái tồn tại của
  `sessions.json` cũ, các tệp JSONL được tham chiếu và các đường dẫn JSONL
  ứng viên cho phiên chứng minh.
- `lsof -p <gateway-pid>` phải hiển thị các handle DB/WAL/SHM của SQLite và không có
  handle `.jsonl` hoặc `sessions.json` đang hoạt động.

`openclaw doctor --session-sqlite validate` chỉ mang tính cung cấp thông tin trong chế độ trực tiếp.
Sau lưu lượng hậu chuyển đổi, lệnh này có thể báo cáo độ lệch dự kiến so với các tệp cũ. Harness
nên sử dụng đầu ra của doctor để phân loại và kiểm kê di chuyển,
không dùng làm tiêu chí đạt/không đạt của runtime.

## Kịch bản do tác nhân điều khiển

Kịch bản trực tiếp sử dụng một khóa phiên chứng minh chuyên biệt và điều khiển Gateway
thông qua các đường dẫn RPC công khai bất cứ khi nào có thể. Một lượt tác nhân là đủ để
thực thi cơ chế lưu trữ thông thường, nhưng quy trình chứng minh đầy đủ nên bao quát các điểm nối
3.1b trước đây cần được kiểm tra trực tiếp riêng lẻ:

- Lượt trò chuyện thông thường: tạo hoặc tái sử dụng phiên chứng minh, gửi một lời nhắc tác nhân
  thực, chờ kết quả cuối cùng của trợ lý và xác minh `chat.history` hoặc
  phép chiếu Gateway tương đương.
- Danh tính bản chép lời: xác minh cùng một dấu mốc xuất hiện trong lịch sử Gateway và trong
  các hàng bản chép lời SQLite, bao gồm các hàng danh tính sự kiện ổn định khi có.
- Các bộ truy cập siêu dữ liệu phiên: đọc phiên chứng minh và các phiên trực tiếp hiện có
  được chọn thông qua các bộ truy cập Gateway/phiên và so sánh chúng với các hàng SQLite.
- Phép chiếu bản vá phiên: áp dụng một thay đổi có thể hoàn tác đối với siêu dữ liệu mô hình/phiên trên
  phiên chứng minh, sau đó xác minh hàng được chiếu và phản hồi Gateway nhất quán.
- Vòng đời điểm kiểm tra Compaction: liệt kê, phân nhánh và khôi phục một điểm kiểm tra chỉ
  trên phiên chứng minh hoặc một phiên dữ liệu kiểm thử tổng hợp do harness tạo.
- Khôi phục sau khi khởi động lại: chạy đường dẫn dấu mốc khôi phục an toàn đối với một phiên chứng minh
  được kiểm soát hoặc một thực thể kiểm thử biệt lập; chế độ trực tiếp chỉ có thể chạy bước này khi
  tập hợp phiên mục tiêu được chỉ định rõ ràng và có thể hoàn tác.
- Vòng đời dọn dẹp: xóa hoặc đặt lại phiên chứng minh, sau đó xác minh các hàng
  vòng đời SQLite và trạng thái bản chép lời đã lưu trữ.

Các điểm nối dành riêng cho phương thức truyền tải không thể được thực thi an toàn trên Gateway trực tiếp của người vận hành,
chẳng hạn như đầu vào WhatsApp hoặc cuộc gọi thoại, nên sử dụng các phép dò runtime
cấp chủ sở hữu dựa trên cùng hợp đồng SQLite thay vì giả lập phương thức truyền tải bên ngoài.

## Các xác nhận theo từng bước

Mỗi bước chụp lại trạng thái trước và sau rồi ghi một bản ghi xác nhận
có cấu trúc:

- Số lượng hàng SQLite chỉ tăng ở những nơi dự kiến.
- Các hàng runtime quỹ đạo tăng đối với các phiên chứng minh có dấu mốc ghi lại
  các sự kiện runtime.
- Hàng phiên chứng minh có `session_id`, trạng thái, dấu thời gian,
  siêu dữ liệu và các hàng định tuyến như dự kiến.
- Phép chiếu lịch sử/phiên của Gateway khớp với phần cuối bản chép lời SQLite.
- Không có tệp JSONL nào của phiên chứng minh được tạo hoặc sửa đổi.
- Không có tệp phụ `.trajectory.jsonl`, `.trajectory-path.json` hoặc
  `trajectory/<session>.jsonl` bắt nguồn từ dấu mốc nào của phiên chứng minh được tạo.
- Các tệp JSONL cũ hiện có và `sessions.json` không thay đổi, trừ khi
  bước đó rõ ràng là thao tác di chuyển ngoại tuyến hoặc lưu trữ.
- Tiến trình Gateway không mở các handle `.jsonl` hoặc `sessions.json`.
- Nhật ký kể từ con trỏ trước không chứa `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, thông báo kho phiên không khả dụng, lỗi khôi phục sau khởi động lại hoặc
  cảnh báo đối soát bản chép lời, trừ khi kịch bản cho phép rõ ràng trong danh sách cho phép.

Quét nhật ký là một phần của hợp đồng đạt/không đạt. Một Gateway phản hồi các phép
kiểm tra tình trạng nhưng phát ra lỗi lược đồ SQLite hoặc lỗi đối soát bản chép lời lặp lại
không được coi là đạt đối với Path 3.

## Dữ liệu bằng chứng

Harness nên ghi bằng chứng trong `.artifacts/path3-live-e2e/<timestamp>/`
và không đưa dữ liệu đó vào git:

- `summary.json`: các đối số lệnh, phiên bản Gateway, kết quả, xác nhận thất bại và
  đường dẫn dữ liệu.
- `sqlite-before.json` và `sqlite-after.json`: số lượng hàng và các hàng chứng minh
  được chọn.
- `legacy-files.json`: trạng thái tồn tại của tệp cũ, `mtime`, kích thước và liệu mỗi
  tệp có thay đổi hay không.
- `gateway-log-scan.json`: phạm vi con trỏ, các dòng nhật ký khớp và các quyết định về
  danh sách cho phép.
- `events.jsonl`: các quan sát theo từng bước có thứ tự, phù hợp cho phần bình luận chứng minh của PR.

Phần chứng minh trong PR nên tóm tắt các dữ liệu này thay vì dán toàn bộ
bản chép lời hoặc nội dung tin nhắn riêng tư.

## Quy tắc an toàn

- Chế độ trực tiếp tuyệt đối không được nhập lại JSONL cũ khi Gateway đang chạy.
- Chế độ trực tiếp không được thay đổi các phiên không dùng để chứng minh, ngoại trừ các phép dò sửa chữa
  có thể hoàn tác và được chọn rõ ràng.
- Mọi bước di chuyển có tính phá hủy hoặc phạm vi rộng đều yêu cầu một bản sao lưu mới của
  cơ sở dữ liệu SQLite và thư mục phiên cũ bị ảnh hưởng.
- Các bản sao lưu nên giới hạn trong cơ sở dữ liệu/thư mục phiên của tác nhân bị tác động và được tái sử dụng
  trong một lần chạy chứng minh để tránh tăng dung lượng đĩa không giới hạn.
- Bước dọn dẹp không được để lại phiên chứng minh, JSONL chứng minh hoặc tệp cũ
  đã sửa đổi, trừ khi bên gọi truyền `--keep-artifacts`.

## Kết quả đạt

Một lần chạy trực tiếp đạt nghĩa là Gateway đã chấp nhận một luồng phiên thực do tác nhân điều khiển,
toàn bộ trạng thái chuẩn tắc quan sát được đều nằm trong SQLite, các tệp runtime cũ duy trì
trạng thái không hoạt động và tình trạng nhật ký không có lỗi trong khoảng thời gian đo. Điều đó không có nghĩa là
tính tương đồng với JSONL cũ vẫn nguyên vẹn sau lưu lượng trực tiếp; độ lệch trực tiếp là điều dự kiến
khi SQLite trở thành kho chuẩn tắc.
