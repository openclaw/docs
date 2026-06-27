---
read_when:
    - Gỡ lỗi lý do một agent đã trả lời, thất bại hoặc gọi công cụ theo một cách nhất định
    - Xuất gói hỗ trợ cho một phiên OpenClaw
    - Điều tra ngữ cảnh prompt, lệnh gọi công cụ, lỗi runtime hoặc siêu dữ liệu sử dụng
    - Tắt hoặc di chuyển tính năng ghi lại quỹ đạo
summary: Xuất các gói quỹ đạo đã biên tập lại để gỡ lỗi phiên agent OpenClaw
title: Gói quỹ đạo
x-i18n:
    generated_at: "2026-06-27T18:19:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Ghi lại quỹ đạo là hộp đen theo từng phiên của OpenClaw. Nó ghi lại một
dòng thời gian có cấu trúc cho mỗi lần chạy tác tử, sau đó `/export-trajectory` đóng gói
phiên hiện tại thành một gói hỗ trợ đã được biên tập lại.

Dùng tính năng này khi bạn cần trả lời các câu hỏi như:

- Prompt, system prompt và công cụ nào đã được gửi tới mô hình?
- Những thông điệp transcript và lệnh gọi công cụ nào đã dẫn tới câu trả lời này?
- Lần chạy có hết thời gian, hủy bỏ, compact, hay gặp lỗi nhà cung cấp không?
- Mô hình, plugin, skills và cài đặt runtime nào đang hoạt động?
- Nhà cung cấp đã trả về metadata về usage và prompt-cache nào?

Nếu bạn đang gửi một báo cáo hỗ trợ rộng cho một sự cố Gateway trực tiếp, hãy bắt đầu với
[`/diagnostics`](/vi/gateway/diagnostics#chat-command). Diagnostics thu thập gói Gateway
đã được làm sạch và, với các phiên harness OpenAI Codex, cũng có thể gửi
phản hồi Codex tới máy chủ OpenAI sau khi được phê duyệt. Dùng `/export-trajectory` khi
bạn cần cụ thể dòng thời gian chi tiết theo từng phiên về prompt, công cụ và transcript.

## Bắt đầu nhanh

Gửi nội dung này trong phiên đang hoạt động:

```text
/export-trajectory
```

Bí danh:

```text
/trajectory
```

OpenClaw ghi gói dưới workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Bạn có thể chọn tên thư mục đầu ra tương đối:

```text
/export-trajectory bug-1234
```

Đường dẫn tùy chỉnh được phân giải bên trong `.openclaw/trajectory-exports/`. Đường dẫn tuyệt đối
và đường dẫn `~` bị từ chối.

Các gói quỹ đạo có thể chứa prompt, thông điệp mô hình, schema công cụ, kết quả công cụ,
sự kiện runtime và đường dẫn cục bộ. Vì vậy, lệnh slash trong chat luôn chạy
qua phê duyệt exec mỗi lần. Hãy phê duyệt bản xuất một lần khi bạn có ý định
tạo gói; không dùng allow-all. Trong chat nhóm, OpenClaw gửi
prompt phê duyệt và kết quả xuất riêng cho chủ sở hữu thay vì đăng chi tiết
quỹ đạo trở lại phòng chung.

Để kiểm tra cục bộ hoặc dùng trong quy trình hỗ trợ, bạn cũng có thể chạy trực tiếp đường dẫn
lệnh đã được phê duyệt:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Quyền truy cập

Xuất quỹ đạo là lệnh của chủ sở hữu. Người gửi phải vượt qua các kiểm tra
ủy quyền lệnh thông thường và kiểm tra chủ sở hữu cho kênh.

## Nội dung được ghi lại

Ghi lại quỹ đạo được bật mặc định cho các lần chạy tác tử OpenClaw.

Sự kiện runtime bao gồm:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, bao gồm mô hình nguồn, mô hình tiếp theo, lý do/chi tiết lỗi, vị trí trong chuỗi, và fallback đã tiến lên, thành công hay dùng hết chuỗi
- `model.completed`
- `trace.artifacts`
- `session.ended`

Sự kiện transcript cũng được tái dựng từ nhánh phiên đang hoạt động:

- thông điệp của người dùng
- thông điệp của trợ lý
- lệnh gọi công cụ
- kết quả công cụ
- compactions
- thay đổi mô hình
- nhãn và mục phiên tùy chỉnh

Sự kiện được ghi dưới dạng JSON Lines với marker schema này:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Tệp trong gói

Một gói đã xuất có thể chứa:

| Tệp                   | Nội dung                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema gói, tệp nguồn, số lượng sự kiện và danh sách tệp được tạo                              |
| `events.jsonl`        | Dòng thời gian runtime và transcript theo thứ tự                                                |
| `session-branch.json` | Nhánh transcript đang hoạt động đã được biên tập lại và header phiên                            |
| `metadata.json`       | Phiên bản OpenClaw, OS/runtime, mô hình, snapshot cấu hình, plugin, skills và metadata prompt   |
| `artifacts.json`      | Trạng thái cuối, lỗi, usage, prompt cache, số lần compaction, văn bản trợ lý và metadata công cụ |
| `prompts.json`        | Prompt đã gửi và các chi tiết xây dựng prompt được chọn                                         |
| `system-prompt.txt`   | System prompt đã biên dịch mới nhất, khi được ghi lại                                           |
| `tools.json`          | Định nghĩa công cụ đã gửi tới mô hình, khi được ghi lại                                         |

`manifest.json` liệt kê các tệp có trong gói đó. Một số tệp bị bỏ qua
khi phiên không ghi lại dữ liệu runtime tương ứng.

## Vị trí ghi lại

Theo mặc định, sự kiện quỹ đạo runtime được ghi bên cạnh tệp phiên:

```text
<session>.trajectory.jsonl
```

OpenClaw cũng ghi một tệp con trỏ best-effort bên cạnh phiên:

```text
<session>.trajectory-path.json
```

Đặt `OPENCLAW_TRAJECTORY_DIR` để lưu sidecar quỹ đạo runtime trong một
thư mục riêng:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Khi biến này được đặt, OpenClaw ghi một tệp JSONL cho mỗi id phiên trong
thư mục đó.

Bảo trì phiên xóa các sidecar quỹ đạo khi mục phiên sở hữu chúng
bị lược bớt, giới hạn hoặc loại bỏ theo ngân sách đĩa của phiên. Tệp runtime bên ngoài
thư mục phiên chỉ bị xóa khi đích con trỏ vẫn chứng minh rằng nó
thuộc về phiên đó.

## Tắt ghi lại

Đặt `OPENCLAW_TRAJECTORY=0` trước khi khởi động OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Thao tác này tắt ghi lại quỹ đạo runtime. `/export-trajectory` vẫn có thể xuất
nhánh transcript, nhưng các tệp chỉ có ở runtime như ngữ cảnh đã biên dịch,
artifact nhà cung cấp và metadata prompt có thể bị thiếu.

## Điều chỉnh thời gian chờ flush

OpenClaw flush các sidecar quỹ đạo runtime trong quá trình dọn dẹp tác tử. Thời gian chờ
dọn dẹp mặc định là 10.000 ms. Trên đĩa chậm hoặc kho lớn, hãy đặt
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` trước khi khởi động OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Thiết lập này kiểm soát thời điểm OpenClaw ghi log timeout `openclaw-trajectory-flush` và tiếp tục.
Nó không thay đổi các giới hạn kích thước quỹ đạo. Để điều chỉnh tất cả bước dọn dẹp tác tử
không truyền timeout rõ ràng, hãy đặt `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Quyền riêng tư và giới hạn

Các gói quỹ đạo được thiết kế cho hỗ trợ và gỡ lỗi, không phải để đăng công khai.
OpenClaw biên tập lại các giá trị nhạy cảm trước khi ghi tệp xuất:

- thông tin xác thực và các trường payload giống bí mật đã biết
- dữ liệu hình ảnh
- đường dẫn trạng thái cục bộ
- đường dẫn workspace, được thay bằng `$WORKSPACE_DIR`
- đường dẫn thư mục home, khi phát hiện được

Trình xuất cũng giới hạn kích thước đầu vào:

- tệp sidecar runtime: ghi trực tiếp dừng ở 10 MiB và ghi lại sự kiện cắt bớt khi còn dung lượng; xuất chấp nhận sidecar runtime hiện có tối đa 50 MiB
- tệp phiên: 50 MiB
- sự kiện runtime: 200.000
- tổng sự kiện đã xuất: 250.000
- từng dòng sự kiện runtime bị cắt bớt khi vượt quá 256 KiB

Hãy xem lại các gói trước khi chia sẻ chúng bên ngoài nhóm của bạn. Việc biên tập lại là best-effort
và không thể biết mọi bí mật riêng của từng ứng dụng.

## Khắc phục sự cố

Nếu bản xuất không có sự kiện runtime:

- xác nhận OpenClaw đã được khởi động mà không có `OPENCLAW_TRAJECTORY=0`
- kiểm tra xem `OPENCLAW_TRAJECTORY_DIR` có trỏ tới một thư mục có thể ghi không
- chạy thêm một thông điệp trong phiên, rồi xuất lại
- kiểm tra `manifest.json` để xem `runtimeEventCount`

Nếu lệnh từ chối đường dẫn đầu ra:

- dùng tên tương đối như `bug-1234`
- không truyền `/tmp/...` hoặc `~/...`
- giữ bản xuất bên trong `.openclaw/trajectory-exports/`

Nếu bản xuất thất bại với lỗi kích thước, phiên hoặc sidecar đã vượt quá
giới hạn an toàn xuất. Hãy bắt đầu một phiên mới hoặc xuất một bản tái hiện nhỏ hơn.

## Liên quan

- [Diffs](/vi/tools/diffs)
- [Quản lý phiên](/vi/concepts/session)
- [Công cụ exec](/vi/tools/exec)
