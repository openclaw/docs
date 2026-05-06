---
read_when:
    - Bắt đầu một phiên tác nhân OpenClaw mới
    - Bật hoặc kiểm tra các Skills mặc định
summary: Hướng dẫn mặc định cho tác nhân OpenClaw và danh sách Skills cho thiết lập trợ lý cá nhân
title: AGENTS.md mặc định
x-i18n:
    generated_at: "2026-05-06T09:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Lần chạy đầu tiên (khuyến nghị)

OpenClaw dùng một thư mục không gian làm việc chuyên dụng cho tác nhân. Mặc định: `~/.openclaw/workspace` (có thể cấu hình qua `agents.defaults.workspace`).

1. Tạo không gian làm việc (nếu chưa tồn tại):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Sao chép các mẫu không gian làm việc mặc định vào không gian làm việc:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Tùy chọn: nếu bạn muốn danh sách Skills cho trợ lý cá nhân, hãy thay AGENTS.md bằng tệp này:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Tùy chọn: chọn một không gian làm việc khác bằng cách đặt `agents.defaults.workspace` (hỗ trợ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Mặc định an toàn

- Đừng đổ toàn bộ thư mục hoặc bí mật vào cuộc trò chuyện.
- Đừng chạy các lệnh phá hủy trừ khi được yêu cầu rõ ràng.
- Đừng gửi phản hồi một phần/phát trực tuyến tới các bề mặt nhắn tin bên ngoài (chỉ gửi phản hồi cuối cùng).

## Bắt đầu phiên (bắt buộc)

- Đọc `SOUL.md`, `USER.md`, và hôm nay+hôm qua trong `memory/`.
- Đọc `MEMORY.md` khi có.
- Thực hiện trước khi phản hồi.

## Soul (bắt buộc)

- `SOUL.md` định nghĩa danh tính, giọng điệu và ranh giới. Hãy giữ nó luôn cập nhật.
- Nếu bạn thay đổi `SOUL.md`, hãy báo cho người dùng.
- Bạn là một phiên bản mới trong mỗi phiên; tính liên tục nằm trong các tệp này.

## Không gian dùng chung (khuyến nghị)

- Bạn không phải tiếng nói của người dùng; hãy cẩn thận trong nhóm chat hoặc kênh công khai.
- Đừng chia sẻ dữ liệu riêng tư, thông tin liên hệ hoặc ghi chú nội bộ.

## Hệ thống bộ nhớ (khuyến nghị)

- Nhật ký hằng ngày: `memory/YYYY-MM-DD.md` (tạo `memory/` nếu cần).
- Bộ nhớ dài hạn: `MEMORY.md` cho các sự kiện, tùy chọn và quyết định bền vững.
- `memory.md` viết thường chỉ là đầu vào sửa chữa cũ; đừng cố ý giữ cả hai tệp gốc.
- Khi bắt đầu phiên, đọc hôm nay + hôm qua + `MEMORY.md` khi có.
- Ghi lại: quyết định, tùy chọn, ràng buộc, các vòng lặp còn mở.
- Tránh bí mật trừ khi được yêu cầu rõ ràng.

## Công cụ và Skills

- Công cụ nằm trong Skills; tuân theo `SKILL.md` của từng Skill khi bạn cần dùng.
- Giữ ghi chú theo môi trường trong `TOOLS.md` (Ghi chú cho Skills).

## Mẹo sao lưu (khuyến nghị)

Nếu bạn xem không gian làm việc này là "bộ nhớ" của Clawd, hãy biến nó thành một repo git (lý tưởng là riêng tư) để `AGENTS.md` và các tệp bộ nhớ của bạn được sao lưu.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw làm gì

- Chạy WhatsApp Gateway + tác nhân lập trình Pi để trợ lý có thể đọc/ghi cuộc trò chuyện, lấy ngữ cảnh và chạy Skills qua Mac chủ.
- Ứng dụng macOS quản lý quyền (ghi màn hình, thông báo, micro) và cung cấp CLI `openclaw` qua tệp nhị phân đi kèm.
- Các cuộc trò chuyện trực tiếp mặc định được gộp vào phiên `main` của tác nhân; nhóm vẫn được cô lập dưới dạng `agent:<agentId>:<channel>:group:<id>` (phòng/kênh: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat giữ cho các tác vụ nền tiếp tục hoạt động.

## Skills cốt lõi (bật trong Settings → Skills)

- **mcporter** - Runtime/CLI máy chủ công cụ để quản lý các backend Skill bên ngoài.
- **Peekaboo** - Ảnh chụp màn hình macOS nhanh với phân tích thị giác AI tùy chọn.
- **camsnap** - Chụp khung hình, đoạn clip hoặc cảnh báo chuyển động từ camera an ninh RTSP/ONVIF.
- **oracle** - CLI tác nhân sẵn sàng cho OpenAI với phát lại phiên và điều khiển trình duyệt.
- **eightctl** - Kiểm soát giấc ngủ của bạn từ terminal.
- **imsg** - Gửi, đọc, phát trực tuyến iMessage & SMS.
- **wacli** - CLI WhatsApp: đồng bộ, tìm kiếm, gửi.
- **discord** - Hành động Discord: phản ứng, nhãn dán, thăm dò ý kiến. Dùng đích `user:<id>` hoặc `channel:<id>` (id số trần là mơ hồ).
- **gog** - CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Máy khách Spotify trên terminal để tìm kiếm/xếp hàng/điều khiển phát lại.
- **sag** - Giọng nói ElevenLabs với trải nghiệm say kiểu Mac; mặc định phát trực tuyến ra loa.
- **Sonos CLI** - Điều khiển loa Sonos (khám phá/trạng thái/phát lại/âm lượng/nhóm) từ script.
- **blucli** - Phát, nhóm và tự động hóa trình phát BluOS từ script.
- **OpenHue CLI** - Điều khiển đèn Philips Hue cho cảnh và tự động hóa.
- **OpenAI Whisper** - Chuyển giọng nói thành văn bản cục bộ để đọc chính tả nhanh và phiên âm thư thoại.
- **Gemini CLI** - Mô hình Google Gemini từ terminal cho hỏi đáp nhanh.
- **agent-tools** - Bộ công cụ tiện ích cho tự động hóa và script hỗ trợ.

## Ghi chú sử dụng

- Ưu tiên CLI `openclaw` cho scripting; ứng dụng Mac xử lý quyền.
- Chạy cài đặt từ tab Skills; tab này ẩn nút nếu tệp nhị phân đã có.
- Luôn bật Heartbeat để trợ lý có thể lên lịch nhắc nhở, giám sát hộp thư đến và kích hoạt chụp camera.
- Canvas UI chạy toàn màn hình với lớp phủ gốc. Tránh đặt các điều khiển quan trọng ở góc trên trái/trên phải hoặc mép dưới; thêm khoảng đệm rõ ràng trong bố cục và đừng phụ thuộc vào phần đệm vùng an toàn.
- Để xác minh bằng trình duyệt, dùng `openclaw browser` (tabs/status/screenshot) với hồ sơ Chrome do OpenClaw quản lý.
- Để kiểm tra DOM, dùng `openclaw browser eval|query|dom|snapshot` (và `--json`/`--out` khi bạn cần đầu ra cho máy).
- Để tương tác, dùng `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type yêu cầu tham chiếu snapshot; dùng `evaluate` cho bộ chọn CSS).

## Liên quan

- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Runtime của tác nhân](/vi/concepts/agent)
