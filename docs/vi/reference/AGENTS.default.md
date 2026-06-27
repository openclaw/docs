---
read_when:
    - Bắt đầu một phiên agent OpenClaw mới
    - Bật hoặc kiểm tra các Skills mặc định
summary: Hướng dẫn tác nhân OpenClaw mặc định và danh sách Skills cho thiết lập trợ lý cá nhân
title: AGENTS.md mặc định
x-i18n:
    generated_at: "2026-06-27T18:07:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Lần chạy đầu tiên (khuyến nghị)

OpenClaw dùng một thư mục workspace riêng cho agent. Mặc định: `~/.openclaw/workspace` (có thể cấu hình qua `agents.defaults.workspace`).

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

3. Tùy chọn: nếu bạn muốn danh sách kỹ năng của trợ lý cá nhân, hãy thay AGENTS.md bằng tệp này:

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

- Đừng đưa toàn bộ thư mục hoặc bí mật vào cuộc trò chuyện.
- Đừng chạy lệnh phá hủy trừ khi được yêu cầu rõ ràng.
- Trước khi thay đổi cấu hình hoặc bộ lập lịch (ví dụ crontab, systemd units, cấu hình nginx, hoặc tệp shell rc), trước tiên hãy kiểm tra trạng thái hiện có và mặc định là giữ nguyên/hợp nhất.
- Đừng gửi phản hồi một phần/streaming đến các bề mặt nhắn tin bên ngoài (chỉ gửi phản hồi cuối cùng).

## Kiểm tra trước các giải pháp hiện có

Trước khi đề xuất hoặc xây dựng một hệ thống, tính năng, quy trình làm việc, công cụ, tích hợp, hoặc tự động hóa tùy chỉnh, hãy kiểm tra ngắn gọn xem có dự án mã nguồn mở, thư viện được duy trì, Plugin OpenClaw hiện có, hoặc nền tảng miễn phí nào đã giải quyết đủ tốt hay chưa. Ưu tiên những lựa chọn đó khi phù hợp. Chỉ xây dựng tùy chỉnh khi các lựa chọn hiện có không phù hợp, quá đắt, không được duy trì, không an toàn, không tuân thủ, hoặc người dùng yêu cầu rõ ràng tùy chỉnh. Tránh đề xuất dịch vụ trả phí trừ khi người dùng phê duyệt rõ ràng việc chi tiêu. Giữ việc này nhẹ: một cổng kiểm tra trước, không phải một nhiệm vụ nghiên cứu rộng.

## Bắt đầu phiên (bắt buộc)

- Đọc `SOUL.md`, `USER.md`, và hôm nay+hôm qua trong `memory/`.
- Đọc `MEMORY.md` khi có.
- Làm việc đó trước khi phản hồi.

## Soul (bắt buộc)

- `SOUL.md` định nghĩa danh tính, giọng điệu, và ranh giới. Giữ nó luôn cập nhật.
- Nếu bạn thay đổi `SOUL.md`, hãy báo cho người dùng.
- Bạn là một phiên bản mới ở mỗi phiên; tính liên tục nằm trong các tệp này.

## Không gian chia sẻ (khuyến nghị)

- Bạn không phải tiếng nói của người dùng; hãy cẩn trọng trong nhóm chat hoặc kênh công khai.
- Đừng chia sẻ dữ liệu riêng tư, thông tin liên hệ, hoặc ghi chú nội bộ.

## Hệ thống bộ nhớ (khuyến nghị)

- Nhật ký hằng ngày: `memory/YYYY-MM-DD.md` (tạo `memory/` nếu cần).
- Bộ nhớ dài hạn: `MEMORY.md` cho các sự kiện, tùy chọn, và quyết định bền vững.
- `memory.md` chữ thường chỉ là đầu vào sửa chữa legacy; đừng cố ý giữ cả hai tệp gốc.
- Khi bắt đầu phiên, đọc hôm nay + hôm qua + `MEMORY.md` khi có.
- Trước khi ghi tệp bộ nhớ, hãy đọc chúng trước; chỉ ghi các cập nhật cụ thể, không bao giờ ghi placeholder trống.
- Ghi lại: quyết định, tùy chọn, ràng buộc, vòng việc còn mở.
- Tránh bí mật trừ khi được yêu cầu rõ ràng.

## Công cụ và kỹ năng

- Công cụ nằm trong Skills; làm theo `SKILL.md` của từng Skills khi bạn cần.
- Giữ ghi chú dành riêng cho môi trường trong `TOOLS.md` (Ghi chú cho Skills).

## Mẹo sao lưu (khuyến nghị)

Nếu bạn xem workspace này là "bộ nhớ" của Clawd, hãy biến nó thành một repo git (lý tưởng là riêng tư) để `AGENTS.md` và các tệp bộ nhớ của bạn được sao lưu.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw làm gì

- Chạy WhatsApp gateway + agent OpenClaw nhúng để trợ lý có thể đọc/ghi chat, lấy ngữ cảnh, và chạy kỹ năng qua máy Mac chủ.
- Ứng dụng macOS quản lý quyền (ghi màn hình, thông báo, micro) và cung cấp CLI `openclaw` qua binary đi kèm.
- Chat trực tiếp mặc định gộp vào phiên `main` của agent; nhóm được cô lập dưới dạng `agent:<agentId>:<channel>:group:<id>` (phòng/kênh: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat giữ các tác vụ nền tiếp tục hoạt động.

## Skills cốt lõi (bật trong Cài đặt → Skills)

- **mcporter** - Runtime/CLI máy chủ công cụ để quản lý backend kỹ năng bên ngoài.
- **Peekaboo** - Ảnh chụp màn hình macOS nhanh với phân tích thị giác AI tùy chọn.
- **camsnap** - Chụp khung hình, clip, hoặc cảnh báo chuyển động từ camera an ninh RTSP/ONVIF.
- **oracle** - CLI agent sẵn sàng cho OpenAI với phát lại phiên và điều khiển trình duyệt.
- **eightctl** - Điều khiển giấc ngủ của bạn từ terminal.
- **imsg** - Gửi, đọc, stream iMessage & SMS.
- **wacli** - CLI WhatsApp: đồng bộ, tìm kiếm, gửi.
- **discord** - Hành động Discord: thả phản ứng, nhãn dán, khảo sát. Dùng đích `user:<id>` hoặc `channel:<id>` (id số trần là mơ hồ).
- **gog** - CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Client Spotify trên terminal để tìm kiếm/xếp hàng/điều khiển phát.
- **sag** - Giọng nói ElevenLabs với trải nghiệm say kiểu mac; mặc định stream ra loa.
- **Sonos CLI** - Điều khiển loa Sonos (khám phá/trạng thái/phát/âm lượng/nhóm) từ script.
- **blucli** - Phát, nhóm, và tự động hóa trình phát BluOS từ script.
- **OpenHue CLI** - Điều khiển đèn Philips Hue cho cảnh và tự động hóa.
- **OpenAI Whisper** - Chuyển giọng nói thành văn bản cục bộ để đọc chính tả nhanh và chép lời thư thoại.
- **Gemini CLI** - Các mô hình Google Gemini từ terminal để hỏi đáp nhanh.
- **agent-tools** - Bộ công cụ tiện ích cho tự động hóa và script hỗ trợ.

## Ghi chú sử dụng

- Ưu tiên CLI `openclaw` cho scripting; ứng dụng Mac xử lý quyền.
- Chạy cài đặt từ thẻ Skills; thẻ này ẩn nút nếu binary đã có.
- Giữ Heartbeat được bật để trợ lý có thể lập lịch nhắc nhở, theo dõi hộp thư đến, và kích hoạt chụp camera.
- UI Canvas chạy toàn màn hình với overlay native. Tránh đặt điều khiển quan trọng ở mép trên-trái/trên-phải/dưới; thêm khoảng đệm rõ ràng trong bố cục và đừng phụ thuộc vào safe-area insets.
- Để xác minh bằng trình duyệt, dùng `openclaw browser` (tab/trạng thái/ảnh chụp màn hình) với hồ sơ Chrome do OpenClaw quản lý.
- Để kiểm tra DOM, dùng `openclaw browser eval|query|dom|snapshot` (và `--json`/`--out` khi bạn cần đầu ra máy đọc được).
- Để tương tác, dùng `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type yêu cầu snapshot refs; dùng `evaluate` cho CSS selectors).

## Liên quan

- [Workspace của agent](/vi/concepts/agent-workspace)
- [Runtime của agent](/vi/concepts/agent)
