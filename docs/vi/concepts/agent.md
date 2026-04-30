---
read_when:
    - Thay đổi môi trường chạy của tác tử, quá trình khởi tạo không gian làm việc hoặc hành vi phiên
summary: Môi trường thực thi tác nhân, hợp đồng không gian làm việc và khởi tạo phiên
title: Môi trường chạy của tác tử
x-i18n:
    generated_at: "2026-04-30T09:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw chạy một **môi trường chạy tác tử nhúng duy nhất** — một tiến trình tác tử cho mỗi
Gateway, với không gian làm việc, tệp khởi tạo và kho phiên riêng. Trang này
trình bày hợp đồng của môi trường chạy đó: không gian làm việc phải chứa gì, những tệp nào được
chèn vào, và cách các phiên khởi tạo dựa trên nó.

## Không gian làm việc (bắt buộc)

OpenClaw dùng một thư mục không gian làm việc tác tử duy nhất (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) của tác tử cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu chưa có và khởi tạo các tệp không gian làm việc.

Bố cục không gian làm việc đầy đủ + hướng dẫn sao lưu: [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải phiên chính có thể ghi đè điều này bằng
không gian làm việc theo từng phiên bên dưới `agents.defaults.sandbox.workspaceRoot` (xem
[Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp khởi tạo (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw kỳ vọng các tệp người dùng có thể chỉnh sửa sau:

- `AGENTS.md` — hướng dẫn vận hành + “bộ nhớ”
- `SOUL.md` — chân dung, ranh giới, giọng điệu
- `TOOLS.md` — ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` — nghi thức chạy lần đầu một lần (bị xóa sau khi hoàn tất)
- `IDENTITY.md` — tên/sắc thái/emoji của tác tử
- `USER.md` — hồ sơ người dùng + cách xưng hô ưu tiên

Ở lượt đầu tiên của một phiên mới, OpenClaw chèn trực tiếp nội dung của các tệp này vào ngữ cảnh tác tử.

Các tệp trống sẽ bị bỏ qua. Các tệp lớn được rút gọn và cắt bớt kèm một dấu chỉ báo để lời nhắc luôn gọn nhẹ (hãy đọc tệp để xem nội dung đầy đủ).

Nếu thiếu một tệp, OpenClaw chèn một dòng dấu chỉ báo “thiếu tệp” duy nhất (và `openclaw setup` sẽ tạo một mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho một **không gian làm việc hoàn toàn mới** (không có tệp khởi tạo nào khác). Nếu bạn xóa tệp này sau khi hoàn tất nghi thức, nó không nên được tạo lại trong các lần khởi động lại sau.

Để tắt hoàn toàn việc tạo tệp khởi tạo (cho các không gian làm việc đã được chuẩn bị sẵn), hãy đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp sẵn

Các công cụ lõi (read/exec/edit/write và các công cụ hệ thống liên quan) luôn khả dụng,
tùy theo chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi
`tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát những công cụ nào tồn tại; đó là
hướng dẫn về cách _bạn_ muốn chúng được sử dụng.

## Skills

OpenClaw tải Skills từ các vị trí này (độ ưu tiên cao nhất trước):

- Không gian làm việc: `<workspace>/skills`
- Skills tác tử dự án: `<workspace>/.agents/skills`
- Skills tác tử cá nhân: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đi kèm (được phân phối cùng bản cài đặt)
- Thư mục Skills bổ sung: `skills.load.extraDirs`

Skills có thể được kiểm soát bằng cấu hình/biến môi trường (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới môi trường chạy

Môi trường chạy tác tử nhúng được xây dựng trên lõi tác tử Pi (mô hình, công cụ và
đường ống lời nhắc). Quản lý phiên, khám phá, nối dây công cụ và phân phối qua kênh
là các lớp do OpenClaw sở hữu nằm trên lõi đó.

## Phiên

Bản ghi phiên được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên ổn định và do OpenClaw chọn.
Các thư mục phiên cũ từ những công cụ khác không được đọc.

## Điều hướng khi đang truyền phát

Khi chế độ hàng đợi là `steer`, các tin nhắn đến được chèn vào lượt chạy hiện tại.
Điều hướng đã xếp hàng được gửi **sau khi lượt trợ lý hiện tại hoàn tất
việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo. Pi rút hết tất cả
tin nhắn điều hướng đang chờ cùng nhau cho `steer`; `queue` kiểu cũ rút một tin nhắn cho mỗi
ranh giới mô hình. Điều hướng không còn bỏ qua các lệnh gọi công cụ còn lại từ tin nhắn
trợ lý hiện tại.

Khi chế độ hàng đợi là `followup` hoặc `collect`, các tin nhắn đến được giữ lại cho đến khi
lượt hiện tại kết thúc, rồi một lượt tác tử mới bắt đầu với các tải đã xếp hàng. Xem
[Hàng đợi](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering) để biết hành vi
theo chế độ và ranh giới.

Truyền phát khối gửi các khối trợ lý đã hoàn tất ngay khi chúng kết thúc; tính năng này
**tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`).
Tinh chỉnh ranh giới qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end).
Kiểm soát việc chia khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định là
800–1200 ký tự; ưu tiên ngắt đoạn, rồi dòng mới; cuối cùng là câu).
Gộp các mảnh truyền phát bằng `agents.defaults.blockStreamingCoalesce` để giảm
rác một dòng (gộp dựa trên trạng thái nhàn rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu
`*.blockStreaming: true` rõ ràng để bật phản hồi dạng khối.
Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Control UI
truyền phát đầu ra công cụ qua sự kiện tác tử khi có sẵn.
Chi tiết thêm: [Truyền phát + chia mảnh](/vi/concepts/streaming).

## Tham chiếu mô hình

Tham chiếu mô hình trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách tại dấu `/` **đầu tiên**.

- Dùng `provider/model` khi cấu hình mô hình.
- Nếu chính ID mô hình chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, trước tiên OpenClaw sẽ thử một bí danh, sau đó là một
  kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng ID mô hình đó, và chỉ sau đó mới quay về
  nhà cung cấp mặc định đã cấu hình. Nếu nhà cung cấp đó không còn cung cấp
  mô hình mặc định đã cấu hình, OpenClaw sẽ quay về nhà cung cấp/mô hình đã cấu hình đầu tiên
  thay vì hiển thị một mặc định nhà cung cấp đã bị xóa và lỗi thời.

## Cấu hình (tối thiểu)

Tối thiểu, hãy đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Trò chuyện nhóm](/vi/channels/group-messages)_ 🦞

## Liên quan

- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
