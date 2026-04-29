---
read_when:
    - Gỡ lỗi lý do một tác nhân đã trả lời, thất bại hoặc gọi công cụ theo một cách nhất định
    - Xuất gói hỗ trợ cho một phiên OpenClaw
    - Điều tra ngữ cảnh lời nhắc, lệnh gọi công cụ, lỗi thời gian chạy hoặc siêu dữ liệu sử dụng
    - Tắt hoặc di chuyển vị trí ghi lại quỹ đạo
summary: Xuất các gói quỹ đạo đã ẩn thông tin nhạy cảm để gỡ lỗi phiên tác nhân OpenClaw
title: Các gói quỹ đạo
x-i18n:
    generated_at: "2026-04-29T23:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Ghi lại quỹ đạo là bộ ghi hành trình theo từng phiên của OpenClaw. Nó ghi lại một
dòng thời gian có cấu trúc cho mỗi lượt chạy của agent, sau đó `/export-trajectory` đóng gói
phiên hiện tại thành một gói hỗ trợ đã được biên tập ẩn thông tin nhạy cảm.

Dùng tính năng này khi bạn cần trả lời các câu hỏi như:

- Prompt, system prompt và công cụ nào đã được gửi tới mô hình?
- Những tin nhắn bản ghi hội thoại và lệnh gọi công cụ nào dẫn tới câu trả lời này?
- Lượt chạy có hết thời gian, bị hủy, compact, hay gặp lỗi nhà cung cấp không?
- Mô hình, plugins, Skills và thiết lập runtime nào đang hoạt động?
- Nhà cung cấp đã trả về metadata sử dụng và prompt-cache nào?

Nếu bạn đang gửi một báo cáo hỗ trợ rộng cho sự cố Gateway trực tiếp, hãy bắt đầu với
[`/diagnostics`](/vi/gateway/diagnostics#chat-command). Diagnostics thu thập gói Gateway
đã được làm sạch và, đối với các phiên OpenAI Codex harness, cũng có thể gửi
phản hồi Codex tới máy chủ OpenAI sau khi được phê duyệt. Dùng `/export-trajectory` khi
bạn cần cụ thể dòng thời gian chi tiết theo từng phiên về prompt, công cụ và bản ghi hội thoại.

## Bắt đầu nhanh

Gửi nội dung này trong phiên đang hoạt động:

```text
/export-trajectory
```

Bí danh:

```text
/trajectory
```

OpenClaw ghi gói này bên dưới workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Bạn có thể chọn tên thư mục đầu ra tương đối:

```text
/export-trajectory bug-1234
```

Đường dẫn tùy chỉnh được phân giải bên trong `.openclaw/trajectory-exports/`. Đường dẫn
tuyệt đối và đường dẫn `~` bị từ chối.

Các gói quỹ đạo có thể chứa prompt, tin nhắn mô hình, schema công cụ, kết quả công cụ,
sự kiện runtime và đường dẫn cục bộ. Vì vậy, lệnh gạch chéo trong chat luôn chạy
qua phê duyệt exec mỗi lần. Hãy phê duyệt export một lần khi bạn định
tạo gói; không dùng allow-all. Trong chat nhóm, OpenClaw gửi
prompt phê duyệt và kết quả export riêng cho chủ sở hữu thay vì đăng
chi tiết quỹ đạo trở lại phòng chung.

Đối với quy trình kiểm tra cục bộ hoặc hỗ trợ, bạn cũng có thể chạy trực tiếp đường dẫn lệnh
đã được phê duyệt:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Quyền truy cập

Export quỹ đạo là lệnh dành cho chủ sở hữu. Người gửi phải vượt qua các kiểm tra
ủy quyền lệnh thông thường và kiểm tra chủ sở hữu cho kênh.

## Nội dung được ghi lại

Ghi lại quỹ đạo được bật mặc định cho các lượt chạy agent của OpenClaw.

Sự kiện runtime bao gồm:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, bao gồm mô hình nguồn, mô hình tiếp theo, lý do/chi tiết lỗi, vị trí trong chuỗi, và fallback đã tiến tiếp, thành công, hay dùng hết chuỗi
- `model.completed`
- `trace.artifacts`
- `session.ended`

Sự kiện bản ghi hội thoại cũng được tái dựng từ nhánh phiên đang hoạt động:

- tin nhắn người dùng
- tin nhắn assistant
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

Một gói đã export có thể chứa:

| Tệp                   | Nội dung                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema gói, tệp nguồn, số lượng sự kiện và danh sách tệp đã tạo                                |
| `events.jsonl`        | Dòng thời gian runtime và bản ghi hội thoại theo thứ tự                                        |
| `session-branch.json` | Nhánh bản ghi hội thoại đang hoạt động và header phiên đã được biên tập ẩn thông tin nhạy cảm |
| `metadata.json`       | Phiên bản OpenClaw, OS/runtime, mô hình, snapshot cấu hình, plugins, Skills và metadata prompt |
| `artifacts.json`      | Trạng thái cuối, lỗi, mức sử dụng, prompt cache, số lần compaction, văn bản assistant và metadata công cụ |
| `prompts.json`        | Prompt đã gửi và chi tiết tạo prompt đã chọn                                                   |
| `system-prompt.txt`   | System prompt đã biên dịch mới nhất, khi được ghi lại                                          |
| `tools.json`          | Định nghĩa công cụ được gửi tới mô hình, khi được ghi lại                                      |

`manifest.json` liệt kê các tệp có trong gói đó. Một số tệp bị bỏ qua
khi phiên không ghi lại dữ liệu runtime tương ứng.

## Vị trí ghi lại

Theo mặc định, sự kiện quỹ đạo runtime được ghi cạnh tệp phiên:

```text
<session>.trajectory.jsonl
```

OpenClaw cũng ghi một tệp con trỏ theo best-effort cạnh phiên:

```text
<session>.trajectory-path.json
```

Đặt `OPENCLAW_TRAJECTORY_DIR` để lưu sidecar quỹ đạo runtime trong một
thư mục chuyên dụng:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Khi biến này được đặt, OpenClaw ghi một tệp JSONL cho mỗi id phiên trong
thư mục đó.

Bảo trì phiên xóa các sidecar quỹ đạo khi mục phiên sở hữu chúng
bị prune, bị giới hạn, hoặc bị loại bỏ bởi ngân sách đĩa phiên. Các tệp runtime bên ngoài
thư mục phiên chỉ được xóa khi mục tiêu con trỏ vẫn chứng minh rằng nó
thuộc về phiên đó.

## Tắt ghi lại

Đặt `OPENCLAW_TRAJECTORY=0` trước khi khởi động OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Thao tác này tắt ghi lại quỹ đạo runtime. `/export-trajectory` vẫn có thể export
nhánh bản ghi hội thoại, nhưng các tệp chỉ có runtime như context đã biên dịch,
artifact nhà cung cấp và metadata prompt có thể bị thiếu.

## Quyền riêng tư và giới hạn

Các gói quỹ đạo được thiết kế cho hỗ trợ và gỡ lỗi, không phải để đăng công khai.
OpenClaw biên tập ẩn các giá trị nhạy cảm trước khi ghi tệp export:

- thông tin xác thực và các trường payload giống bí mật đã biết
- dữ liệu hình ảnh
- đường dẫn trạng thái cục bộ
- đường dẫn workspace, được thay bằng `$WORKSPACE_DIR`
- đường dẫn thư mục home, khi phát hiện được

Trình export cũng giới hạn kích thước đầu vào:

- tệp sidecar runtime: 50 MiB
- tệp phiên: 50 MiB
- sự kiện runtime: 200,000
- tổng sự kiện đã export: 250,000
- từng dòng sự kiện runtime bị cắt ngắn khi vượt quá 256 KiB

Hãy xem lại các gói trước khi chia sẻ chúng ra ngoài nhóm của bạn. Việc biên tập ẩn thông tin nhạy cảm là best-effort
và không thể biết mọi bí mật riêng cho từng ứng dụng.

## Khắc phục sự cố

Nếu export không có sự kiện runtime:

- xác nhận OpenClaw đã được khởi động mà không có `OPENCLAW_TRAJECTORY=0`
- kiểm tra liệu `OPENCLAW_TRAJECTORY_DIR` có trỏ tới một thư mục có thể ghi không
- chạy một tin nhắn khác trong phiên, rồi export lại
- kiểm tra `manifest.json` để tìm `runtimeEventCount`

Nếu lệnh từ chối đường dẫn đầu ra:

- dùng tên tương đối như `bug-1234`
- không truyền `/tmp/...` hoặc `~/...`
- giữ export bên trong `.openclaw/trajectory-exports/`

Nếu export thất bại với lỗi kích thước, phiên hoặc sidecar đã vượt quá
giới hạn an toàn export. Hãy bắt đầu một phiên mới hoặc export một bản tái hiện nhỏ hơn.

## Liên quan

- [Diffs](/vi/tools/diffs)
- [Quản lý phiên](/vi/concepts/session)
- [Công cụ exec](/vi/tools/exec)
