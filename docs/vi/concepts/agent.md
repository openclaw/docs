---
read_when:
    - Thay đổi môi trường chạy của tác tử, quá trình khởi tạo không gian làm việc hoặc hành vi phiên
summary: Môi trường chạy của tác tử, hợp đồng không gian làm việc và khởi tạo phiên
title: Môi trường chạy của tác nhân
x-i18n:
    generated_at: "2026-05-04T02:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw chạy một **môi trường runtime tác nhân nhúng duy nhất** — một tiến trình tác nhân cho mỗi
Gateway, với workspace, tệp khởi tạo và kho phiên riêng. Trang này
trình bày hợp đồng runtime đó: workspace phải chứa gì, những tệp nào được
chèn vào, và cách các phiên khởi tạo dựa trên đó.

## Workspace (bắt buộc)

OpenClaw sử dụng một thư mục workspace tác nhân duy nhất (`agents.defaults.workspace`) làm thư mục làm việc (`cwd`) **duy nhất** của tác nhân cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu còn thiếu và khởi tạo các tệp workspace.

Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Workspace tác nhân](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải main có thể ghi đè điều này bằng
workspace theo từng phiên dưới `agents.defaults.sandbox.workspaceRoot` (xem
[Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp khởi tạo (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw kỳ vọng các tệp người dùng có thể chỉnh sửa sau:

- `AGENTS.md` — hướng dẫn vận hành + “bộ nhớ”
- `SOUL.md` — persona, ranh giới, giọng điệu
- `TOOLS.md` — ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` — nghi thức chạy lần đầu một lần (bị xóa sau khi hoàn tất)
- `IDENTITY.md` — tên/cảm giác/emoji của tác nhân
- `USER.md` — hồ sơ người dùng + cách xưng hô ưu tiên

Ở lượt đầu tiên của một phiên mới, OpenClaw chèn nội dung của các tệp này vào Project Context của system prompt.

Các tệp trống được bỏ qua. Các tệp lớn được rút gọn và cắt bớt kèm một marker để prompt luôn gọn (đọc tệp để xem nội dung đầy đủ).

Nếu thiếu tệp, OpenClaw chèn một dòng marker “thiếu tệp” duy nhất (và `openclaw setup` sẽ tạo một mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho **workspace hoàn toàn mới** (không có tệp khởi tạo nào khác). Khi tệp này còn đang chờ xử lý, OpenClaw giữ nó trong Project Context và thêm hướng dẫn khởi tạo trong system-prompt cho nghi thức ban đầu thay vì sao chép nó vào tin nhắn người dùng. Nếu bạn xóa nó sau khi hoàn tất nghi thức, nó sẽ không được tạo lại trong các lần khởi động lại sau.

Để tắt hoàn toàn việc tạo tệp khởi tạo (cho các workspace đã được chuẩn bị sẵn), đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp sẵn

Các công cụ lõi (read/exec/edit/write và các công cụ hệ thống liên quan) luôn có sẵn,
phụ thuộc vào chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi
`tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát những công cụ nào tồn tại; nó là
hướng dẫn về cách _bạn_ muốn chúng được sử dụng.

## Skills

OpenClaw tải Skills từ các vị trí sau (độ ưu tiên cao nhất trước):

- Workspace: `<workspace>/skills`
- Skills tác nhân dự án: `<workspace>/.agents/skills`
- Skills tác nhân cá nhân: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đóng gói sẵn (đi kèm bản cài đặt)
- Thư mục Skills bổ sung: `skills.load.extraDirs`

Skills có thể được kiểm soát bằng config/env (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới runtime

Môi trường runtime tác nhân nhúng được xây dựng trên lõi tác nhân Pi (mô hình, công cụ và
pipeline prompt). Quản lý phiên, khám phá, nối dây công cụ và phân phối qua kênh
là các lớp do OpenClaw sở hữu nằm trên lõi đó.

## Phiên

Bản ghi phiên được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên ổn định và do OpenClaw chọn.
Các thư mục phiên cũ từ công cụ khác không được đọc.

## Điều hướng khi đang streaming

Khi chế độ hàng đợi là `steer`, tin nhắn đến được chèn vào lượt chạy hiện tại.
Điều hướng trong hàng đợi được phân phối **sau khi lượt assistant hiện tại hoàn tất
việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo. Pi rút tất cả
tin nhắn điều hướng đang chờ cùng lúc cho `steer`; `queue` cũ rút một tin nhắn ở mỗi
ranh giới mô hình. Điều hướng không còn bỏ qua các lệnh gọi công cụ còn lại từ
tin nhắn assistant hiện tại.

Khi chế độ hàng đợi là `followup` hoặc `collect`, tin nhắn đến được giữ lại cho đến khi
lượt hiện tại kết thúc, rồi một lượt tác nhân mới bắt đầu với các payload đã xếp hàng. Xem
[Hàng đợi](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering) để biết hành vi về chế độ
và ranh giới.

Streaming theo khối gửi các khối assistant đã hoàn tất ngay khi chúng kết thúc; tính năng này
**tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`).
Tinh chỉnh ranh giới qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end).
Điều khiển việc chia khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định là
800–1200 ký tự; ưu tiên ngắt đoạn, rồi dòng mới; câu là cuối cùng).
Gộp các đoạn được stream bằng `agents.defaults.blockStreamingCoalesce` để giảm
spam một dòng (gộp dựa trên trạng thái nhàn rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu
`*.blockStreaming: true` rõ ràng để bật phản hồi theo khối.
Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Control UI
stream đầu ra công cụ qua sự kiện tác nhân khi có sẵn.
Chi tiết thêm: [Streaming + chia đoạn](/vi/concepts/streaming).

## Tham chiếu mô hình

Tham chiếu mô hình trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách tại dấu `/` **đầu tiên**.

- Dùng `provider/model` khi cấu hình mô hình.
- Nếu ID mô hình tự nó chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố provider (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua provider, OpenClaw thử alias trước, rồi một kết quả khớp provider đã cấu hình duy nhất
  cho đúng ID mô hình đó, và chỉ sau đó mới fallback
  về provider mặc định đã cấu hình. Nếu provider đó không còn cung cấp
  mô hình mặc định đã cấu hình, OpenClaw fallback về provider/model đã cấu hình đầu tiên
  thay vì hiển thị một mặc định provider đã bị gỡ bỏ và lỗi thời.

## Cấu hình (tối thiểu)

Tối thiểu, đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Trò chuyện nhóm](/vi/channels/group-messages)_ 🦞

## Liên quan

- [Workspace tác nhân](/vi/concepts/agent-workspace)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
