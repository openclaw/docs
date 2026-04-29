---
read_when:
    - Bắt đầu một phiên tác nhân OpenClaw mới
    - Bật hoặc kiểm tra Skills mặc định
summary: Hướng dẫn mặc định cho tác nhân OpenClaw và danh sách Skills cho thiết lập trợ lý cá nhân
title: AGENTS.md mặc định
x-i18n:
    generated_at: "2026-04-29T23:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - Trợ lý cá nhân OpenClaw (mặc định)

## Lần chạy đầu tiên (khuyến nghị)

OpenClaw sử dụng một thư mục workspace riêng cho tác nhân. Mặc định: `~/.openclaw/workspace` (có thể cấu hình qua `agents.defaults.workspace`).

1. Tạo workspace (nếu chưa tồn tại):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Sao chép các mẫu workspace mặc định vào workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Tùy chọn: nếu bạn muốn danh sách Skills cho trợ lý cá nhân, hãy thay AGENTS.md bằng tệp này:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Tùy chọn: chọn một workspace khác bằng cách đặt `agents.defaults.workspace` (hỗ trợ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Mặc định an toàn

- Đừng đổ thư mục hoặc bí mật vào chat.
- Đừng chạy các lệnh phá hủy trừ khi được yêu cầu rõ ràng.
- Đừng gửi phản hồi từng phần/phát trực tuyến tới các bề mặt nhắn tin bên ngoài (chỉ phản hồi cuối cùng).

## Bắt đầu phiên (bắt buộc)

- Đọc `SOUL.md`, `USER.md`, và hôm nay+hôm qua trong `memory/`.
- Đọc `MEMORY.md` khi có.
- Thực hiện trước khi phản hồi.

## Soul (bắt buộc)

- `SOUL.md` xác định danh tính, giọng điệu và ranh giới. Giữ tệp này luôn cập nhật.
- Nếu bạn thay đổi `SOUL.md`, hãy báo cho người dùng.
- Bạn là một phiên bản mới trong mỗi phiên; tính liên tục nằm trong các tệp này.

## Không gian chung (khuyến nghị)

- Bạn không phải là tiếng nói của người dùng; hãy cẩn thận trong chat nhóm hoặc kênh công khai.
- Đừng chia sẻ dữ liệu riêng tư, thông tin liên hệ hoặc ghi chú nội bộ.

## Hệ thống bộ nhớ (khuyến nghị)

- Nhật ký hằng ngày: `memory/YYYY-MM-DD.md` (tạo `memory/` nếu cần).
- Bộ nhớ dài hạn: `MEMORY.md` cho các sự kiện, tùy chọn và quyết định bền vững.
- `memory.md` viết thường chỉ là đầu vào sửa chữa kế thừa; đừng cố ý giữ cả hai tệp ở root.
- Khi bắt đầu phiên, đọc hôm nay + hôm qua + `MEMORY.md` khi có.
- Ghi lại: quyết định, tùy chọn, ràng buộc, vòng việc còn mở.
- Tránh bí mật trừ khi được yêu cầu rõ ràng.

## Công cụ & Skills

- Công cụ nằm trong Skills; làm theo `SKILL.md` của từng Skill khi bạn cần dùng.
- Giữ ghi chú theo môi trường trong `TOOLS.md` (Ghi chú cho Skills).

## Mẹo sao lưu (khuyến nghị)

Nếu bạn coi workspace này là “bộ nhớ” của Clawd, hãy biến nó thành một repo git (lý tưởng là riêng tư) để `AGENTS.md` và các tệp bộ nhớ của bạn được sao lưu.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw làm gì

- Chạy WhatsApp gateway + tác nhân lập trình Pi để trợ lý có thể đọc/ghi chat, lấy ngữ cảnh và chạy Skills qua máy Mac chủ.
- Ứng dụng macOS quản lý quyền (ghi màn hình, thông báo, micrô) và cung cấp CLI `openclaw` qua binary đi kèm.
- Chat trực tiếp mặc định được gộp vào phiên `main` của tác nhân; nhóm được giữ tách biệt dưới dạng `agent:<agentId>:<channel>:group:<id>` (phòng/kênh: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat giữ cho các tác vụ nền tiếp tục hoạt động.

## Skills cốt lõi (bật trong Cài đặt → Skills)

- **mcporter** — Runtime/CLI máy chủ công cụ để quản lý backend Skill bên ngoài.
- **Peekaboo** — Ảnh chụp màn hình macOS nhanh với phân tích thị giác AI tùy chọn.
- **camsnap** — Chụp khung hình, clip hoặc cảnh báo chuyển động từ camera an ninh RTSP/ONVIF.
- **oracle** — CLI tác nhân sẵn sàng cho OpenAI với phát lại phiên và điều khiển trình duyệt.
- **eightctl** — Điều khiển giấc ngủ của bạn từ terminal.
- **imsg** — Gửi, đọc, phát trực tuyến iMessage & SMS.
- **wacli** — CLI WhatsApp: đồng bộ, tìm kiếm, gửi.
- **discord** — Hành động Discord: phản ứng, nhãn dán, cuộc thăm dò. Dùng mục tiêu `user:<id>` hoặc `channel:<id>` (id số trần là mơ hồ).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Ứng dụng khách Spotify trên terminal để tìm kiếm/xếp hàng/điều khiển phát lại.
- **sag** — Giọng nói ElevenLabs với trải nghiệm say kiểu Mac; mặc định phát trực tuyến ra loa.
- **Sonos CLI** — Điều khiển loa Sonos (khám phá/trạng thái/phát lại/âm lượng/nhóm) từ script.
- **blucli** — Phát, nhóm và tự động hóa trình phát BluOS từ script.
- **OpenHue CLI** — Điều khiển đèn Philips Hue cho cảnh và tự động hóa.
- **OpenAI Whisper** — Chuyển giọng nói thành văn bản cục bộ để đọc chính tả nhanh và chép lời thư thoại.
- **Gemini CLI** — Mô hình Google Gemini từ terminal để hỏi đáp nhanh.
- **agent-tools** — Bộ công cụ tiện ích cho tự động hóa và script trợ giúp.

## Ghi chú sử dụng

- Ưu tiên CLI `openclaw` cho script; ứng dụng Mac xử lý quyền.
- Chạy cài đặt từ tab Skills; tab này ẩn nút nếu binary đã có.
- Giữ Heartbeat bật để trợ lý có thể lên lịch nhắc nhở, giám sát hộp thư đến và kích hoạt chụp camera.
- Canvas UI chạy toàn màn hình với lớp phủ gốc. Tránh đặt điều khiển quan trọng ở mép trên-trái/trên-phải/dưới; thêm khoảng lề rõ ràng trong bố cục và đừng dựa vào safe-area insets.
- Để xác minh bằng trình duyệt, dùng `openclaw browser` (tab/trạng thái/ảnh chụp màn hình) với hồ sơ Chrome do OpenClaw quản lý.
- Để kiểm tra DOM, dùng `openclaw browser eval|query|dom|snapshot` (và `--json`/`--out` khi bạn cần đầu ra cho máy).
- Để tương tác, dùng `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type yêu cầu tham chiếu snapshot; dùng `evaluate` cho bộ chọn CSS).

## Liên quan

- [Workspace tác nhân](/vi/concepts/agent-workspace)
- [Runtime tác nhân](/vi/concepts/agent)
