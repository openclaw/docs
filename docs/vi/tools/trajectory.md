---
read_when:
    - Gỡ lỗi lý do tác nhân đã trả lời, gặp lỗi hoặc gọi công cụ theo một cách nhất định
    - Xuất gói hỗ trợ cho một phiên OpenClaw
    - Điều tra ngữ cảnh lời nhắc, lệnh gọi công cụ, lỗi thời gian chạy hoặc siêu dữ liệu sử dụng
    - Tắt tính năng thu thập quỹ đạo
summary: Xuất các gói quỹ đạo đã được ẩn thông tin nhạy cảm để gỡ lỗi một phiên tác tử OpenClaw
title: Các gói quỹ đạo
x-i18n:
    generated_at: "2026-07-16T15:55:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Ghi lại quỹ đạo là hộp đen theo từng phiên của OpenClaw. Tính năng này ghi lại
dòng thời gian có cấu trúc cho mỗi lần chạy tác nhân, sau đó `/export-trajectory` đóng gói
phiên hiện tại thành một gói hỗ trợ đã được biên tập, bao gồm:

- Lời nhắc, lời nhắc hệ thống và các công cụ được gửi đến mô hình
- Những thông báo bản ghi và lệnh gọi công cụ nào đã dẫn đến câu trả lời
- Lần chạy có hết thời gian chờ, bị hủy, được Compaction hay gặp lỗi nhà cung cấp hay không
- Mô hình, các plugin, Skills và cài đặt thời gian chạy nào đang hoạt động
- Siêu dữ liệu về mức sử dụng và bộ nhớ đệm lời nhắc do nhà cung cấp trả về

Để có báo cáo hỗ trợ Gateway tổng quát, trước tiên hãy bắt đầu bằng
[`/diagnostics`](/vi/gateway/diagnostics#chat-command); lệnh này thu thập
gói Gateway đã được làm sạch và, đối với các phiên dùng bộ khung OpenAI Codex, có thể gửi phản hồi về Codex
đến OpenAI sau khi được phê duyệt. Hãy dùng `/export-trajectory` khi bạn cần
dòng thời gian chi tiết theo từng phiên về lời nhắc, công cụ và bản ghi.

## Bắt đầu nhanh

Gửi trong phiên đang hoạt động (bí danh `/trajectory`):

```text
/export-trajectory
```

OpenClaw ghi gói này vào không gian làm việc:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Truyền tên thư mục đầu ra tương đối để ghi đè vị trí đó:

```text
/export-trajectory bug-1234
```

Tên này được phân giải bên trong `.openclaw/trajectory-exports/`. Đường dẫn tuyệt đối và
đường dẫn `~` bị từ chối.

Các gói quỹ đạo có thể chứa lời nhắc, thông báo mô hình, lược đồ công cụ, kết quả công cụ,
sự kiện thời gian chạy và đường dẫn cục bộ, vì vậy lệnh trò chuyện luôn phải
qua bước phê duyệt thực thi. Chỉ phê duyệt việc xuất một lần khi bạn có ý định tạo
gói; không sử dụng chế độ cho phép tất cả. Trong các cuộc trò chuyện nhóm, OpenClaw gửi riêng
lời nhắc phê duyệt và kết quả xuất cho chủ sở hữu thay vì đăng thông tin chi tiết về quỹ đạo
trở lại phòng dùng chung.

Để kiểm tra cục bộ hoặc dùng trong quy trình hỗ trợ, hãy chạy trực tiếp lệnh CLI
nền tảng:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Các cờ khác: `--output <path>` (tên thư mục bên trong
`.openclaw/trajectory-exports`), `--store <path>` (ghi đè kho lưu trữ phiên),
`--agent <id>` (ID tác nhân để phân giải kho lưu trữ), `--json` (đầu ra có cấu trúc).

## Quyền truy cập

Xuất quỹ đạo là lệnh dành cho chủ sở hữu. Người gửi phải vượt qua các bước kiểm tra
ủy quyền lệnh thông thường cùng với bước kiểm tra chủ sở hữu của kênh.

## Nội dung được ghi lại

Ghi lại quỹ đạo được bật mặc định cho các lần chạy tác nhân OpenClaw.

Các sự kiện thời gian chạy bao gồm:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, bao gồm mô hình nguồn, mô hình tiếp theo, lý do/chi tiết lỗi, vị trí trong chuỗi và việc chuỗi đã tiến tiếp, thành công hay cạn kiệt
- `model.completed`
- `trace.artifacts`
- `session.ended`

Các sự kiện bản ghi được tái dựng từ nhánh phiên đang hoạt động: thông báo của người dùng,
thông báo của trợ lý, lệnh gọi công cụ, kết quả công cụ, các lần Compaction, thay đổi mô hình,
nhãn và mục nhập phiên tùy chỉnh.

Các sự kiện được ghi dưới dạng JSON Lines với dấu chỉ lược đồ sau:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Các tệp trong gói

| Tệp                   | Nội dung                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| `manifest.json`       | Lược đồ gói, tệp nguồn, số lượng sự kiện và danh sách tệp được tạo                                        |
| `events.jsonl`        | Dòng thời gian có thứ tự của thời gian chạy và bản ghi                                                    |
| `session-branch.json` | Nhánh bản ghi đang hoạt động đã được biên tập và tiêu đề phiên                                             |
| `metadata.json`       | Phiên bản OpenClaw, hệ điều hành/thời gian chạy, mô hình, ảnh chụp cấu hình, plugin, Skills và siêu dữ liệu lời nhắc |
| `artifacts.json`      | Trạng thái cuối, lỗi, mức sử dụng, bộ nhớ đệm lời nhắc, số lần Compaction, văn bản trợ lý và siêu dữ liệu công cụ |
| `prompts.json`        | Các lời nhắc đã gửi và chi tiết chọn lọc về quá trình tạo lời nhắc                                        |
| `system-prompt.txt`   | Lời nhắc hệ thống đã biên dịch mới nhất, khi được ghi lại                                                  |
| `tools.json`          | Các định nghĩa công cụ được gửi đến mô hình, khi được ghi lại                                             |

`manifest.json` liệt kê các tệp có trong một gói nhất định; một số tệp bị
bỏ qua khi phiên không ghi lại dữ liệu thời gian chạy tương ứng.

## Lưu trữ dữ liệu ghi lại

Các sự kiện quỹ đạo thời gian chạy được lưu cùng với phiên trong cơ sở dữ liệu SQLite
riêng cho từng tác nhân. Việc xuất quỹ đạo tạo ra một gói hỗ trợ JSONL đã được biên tập;
dữ liệu ghi lại trực tiếp trong thời gian chạy không phải là tệp JSONL phụ nằm cạnh phiên.

Các tệp `.trajectory.jsonl` và `.trajectory-path.json` cũ vẫn có thể xuất hiện
từ các bản phát hành trước hoặc các lần xuất tệp cũ được yêu cầu rõ ràng. Hoạt động bảo trì phiên coi
những tệp này là mục tiêu dọn dẹp; quá trình ghi đang hoạt động sẽ ghi các hàng vào cơ sở dữ liệu.

## Tắt ghi lại

```bash
export OPENCLAW_TRAJECTORY=0
```

Lệnh này tắt việc ghi lại quỹ đạo thời gian chạy trước khi khởi động OpenClaw.
`/export-trajectory` vẫn có thể xuất nhánh bản ghi, nhưng dữ liệu chỉ có trong thời gian chạy
như ngữ cảnh đã biên dịch, hiện vật của nhà cung cấp và siêu dữ liệu lời nhắc có thể
bị thiếu.

## Điều chỉnh thời gian chờ xả dữ liệu

OpenClaw xả các hàng quỹ đạo thời gian chạy trong quá trình dọn dẹp tác nhân. Thời gian chờ
dọn dẹp mặc định là 10,000 ms. Trên ổ đĩa chậm hoặc kho lưu trữ lớn, hãy đặt
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` trước khi khởi động OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Thiết lập này kiểm soát thời điểm OpenClaw ghi nhật ký lỗi hết thời gian chờ `openclaw-trajectory-flush` rồi
tiếp tục; nó không thay đổi giới hạn kích thước quỹ đạo. Để điều chỉnh tất cả các bước
dọn dẹp tác nhân không truyền thời gian chờ rõ ràng, hãy đặt
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Quyền riêng tư và giới hạn

Các gói quỹ đạo dành cho hỗ trợ và gỡ lỗi, không phải để đăng công khai. OpenClaw
biên tập các giá trị nhạy cảm trước khi ghi tệp xuất:

- thông tin xác thực và các trường tải trọng đã biết có dạng bí mật
- dữ liệu hình ảnh
- đường dẫn trạng thái cục bộ
- đường dẫn không gian làm việc, được thay bằng `$WORKSPACE_DIR`
- đường dẫn thư mục chính, khi phát hiện được

Trình xuất cũng giới hạn kích thước đầu vào:

- ghi lại thời gian chạy: dữ liệu ghi trực tiếp là một cửa sổ cuộn có giới hạn 10 MiB, loại bỏ các sự kiện cũ nhất để dành chỗ cho sự kiện mới; quá trình xuất chấp nhận các tệp phụ thời gian chạy cũ hiện có có kích thước tối đa 50 MiB
- tệp phiên: 50 MiB
- sự kiện thời gian chạy mỗi lần xuất: 200,000
- tổng số sự kiện được xuất: 250,000
- các dòng sự kiện thời gian chạy riêng lẻ bị cắt bớt khi vượt quá 256 KiB

Hãy xem xét các gói trước khi chia sẻ chúng ra ngoài nhóm của bạn. Việc biên tập được thực hiện theo khả năng tốt nhất
và không thể biết mọi bí mật riêng của từng ứng dụng.

## Khắc phục sự cố

Nếu bản xuất không có sự kiện thời gian chạy:

- xác nhận OpenClaw đã được khởi động mà không có `OPENCLAW_TRAJECTORY=0`
- chạy thêm một thông báo trong phiên, rồi xuất lại
- kiểm tra `manifest.json` để tìm `runtimeEventCount`

Nếu lệnh từ chối đường dẫn đầu ra:

- sử dụng tên tương đối như `bug-1234`
- không truyền `/tmp/...` hoặc `~/...`
- giữ bản xuất bên trong `.openclaw/trajectory-exports/`

Nếu quá trình xuất thất bại do lỗi kích thước, phiên hoặc tệp phụ đã vượt quá
các giới hạn an toàn xuất ở trên. Hãy bắt đầu phiên mới hoặc xuất một trường hợp
tái hiện nhỏ hơn.

## Liên quan

- [Diff](/vi/tools/diffs)
- [Quản lý phiên](/vi/concepts/session)
- [Công cụ thực thi](/vi/tools/exec)
