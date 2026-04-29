---
read_when:
    - Thay đổi môi trường chạy của tác tử, khởi tạo không gian làm việc hoặc hành vi phiên
summary: Môi trường chạy của tác tử, hợp đồng không gian làm việc và khởi tạo phiên
title: Môi trường thực thi tác tử
x-i18n:
    generated_at: "2026-04-29T22:35:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw chạy một **môi trường thực thi tác nhân nhúng duy nhất** — một tiến trình tác nhân cho mỗi Gateway, với không gian làm việc, tệp khởi động và kho phiên riêng. Trang này trình bày hợp đồng môi trường thực thi đó: không gian làm việc phải chứa gì, những tệp nào được chèn vào và cách các phiên khởi động dựa trên đó.

## Không gian làm việc (bắt buộc)

OpenClaw dùng một thư mục không gian làm việc tác nhân duy nhất (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) của tác nhân cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu còn thiếu và khởi tạo các tệp không gian làm việc.

Bố cục không gian làm việc đầy đủ + hướng dẫn sao lưu: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải phiên chính có thể ghi đè điều này bằng không gian làm việc theo từng phiên dưới `agents.defaults.sandbox.workspaceRoot` (xem [Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp khởi động (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw kỳ vọng các tệp người dùng có thể chỉnh sửa sau:

- `AGENTS.md` — hướng dẫn vận hành + “bộ nhớ”
- `SOUL.md` — tính cách, ranh giới, giọng điệu
- `TOOLS.md` — ghi chú công cụ do người dùng duy trì (ví dụ `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` — nghi thức chạy lần đầu một lần (bị xóa sau khi hoàn tất)
- `IDENTITY.md` — tên/cảm nhận/emoji của tác nhân
- `USER.md` — hồ sơ người dùng + cách xưng hô ưu tiên

Ở lượt đầu tiên của một phiên mới, OpenClaw chèn trực tiếp nội dung của các tệp này vào ngữ cảnh tác nhân.

Các tệp trống được bỏ qua. Các tệp lớn được cắt gọn và rút ngắn bằng một dấu đánh dấu để prompt luôn gọn nhẹ (đọc tệp để xem nội dung đầy đủ).

Nếu một tệp bị thiếu, OpenClaw chèn một dòng đánh dấu “tệp bị thiếu” duy nhất (và `openclaw setup` sẽ tạo một mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho một **không gian làm việc hoàn toàn mới** (không có tệp khởi động nào khác). Nếu bạn xóa tệp này sau khi hoàn tất nghi thức, nó sẽ không được tạo lại trong các lần khởi động lại sau.

Để tắt hoàn toàn việc tạo tệp khởi động (cho các không gian làm việc đã được chuẩn bị sẵn), hãy đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp

Các công cụ lõi (read/exec/edit/write và các công cụ hệ thống liên quan) luôn sẵn có, tùy theo chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi `tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát những công cụ nào tồn tại; đó là hướng dẫn về cách _bạn_ muốn chúng được dùng.

## Skills

OpenClaw tải Skills từ các vị trí này (độ ưu tiên cao nhất trước):

- Không gian làm việc: `<workspace>/skills`
- Skills tác nhân dự án: `<workspace>/.agents/skills`
- Skills tác nhân cá nhân: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đi kèm (được phát hành cùng bản cài đặt)
- Thư mục Skills bổ sung: `skills.load.extraDirs`

Skills có thể được kiểm soát bằng cấu hình/env (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới môi trường thực thi

Môi trường thực thi tác nhân nhúng được xây dựng trên lõi tác nhân Pi (mô hình, công cụ và pipeline prompt). Quản lý phiên, khám phá, nối dây công cụ và phân phối kênh là các lớp do OpenClaw sở hữu nằm trên lõi đó.

## Phiên

Bản ghi phiên được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên ổn định và do OpenClaw chọn.
Các thư mục phiên cũ từ công cụ khác không được đọc.

## Điều hướng trong khi streaming

Khi chế độ hàng đợi là `steer`, tin nhắn đến được chèn vào lượt chạy hiện tại. Điều hướng đã xếp hàng được gửi **sau khi lượt trợ lý hiện tại hoàn tất việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo. Điều hướng không còn bỏ qua các lệnh gọi công cụ còn lại từ tin nhắn trợ lý hiện tại; thay vào đó, nó chèn tin nhắn đã xếp hàng ở ranh giới mô hình tiếp theo.

Khi chế độ hàng đợi là `followup` hoặc `collect`, tin nhắn đến được giữ cho đến khi lượt hiện tại kết thúc, sau đó một lượt tác nhân mới bắt đầu với các payload đã xếp hàng. Xem [Hàng đợi](/vi/concepts/queue) để biết hành vi chế độ + debounce/giới hạn.

Streaming khối gửi các khối trợ lý đã hoàn tất ngay khi chúng kết thúc; tính năng này **tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`).
Điều chỉnh ranh giới qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end).
Kiểm soát việc chia khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định là 800–1200 ký tự; ưu tiên ngắt đoạn, rồi dòng mới; câu là cuối cùng).
Gộp các đoạn được streaming bằng `agents.defaults.blockStreamingCoalesce` để giảm spam một dòng (gộp dựa trên thời gian nhàn rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu `*.blockStreaming: true` rõ ràng để bật trả lời theo khối.
Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Giao diện điều khiển streaming đầu ra công cụ qua sự kiện tác nhân khi có sẵn.
Chi tiết thêm: [Streaming + chia đoạn](/vi/concepts/streaming).

## Tham chiếu mô hình

Tham chiếu mô hình trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách tại dấu `/` **đầu tiên**.

- Dùng `provider/model` khi cấu hình mô hình.
- Nếu chính ID mô hình chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw thử alias trước, rồi thử một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng ID mô hình đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình. Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị mặc định nhà cung cấp đã bị xóa lỗi thời.

## Cấu hình (tối thiểu)

Tối thiểu, hãy đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Trò chuyện nhóm](/vi/channels/group-messages)_ 🦞

## Liên quan

- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
