---
read_when:
    - Thay đổi runtime của tác nhân, bootstrap không gian làm việc hoặc hành vi phiên
summary: Thời gian chạy agent, hợp đồng workspace và khởi tạo phiên
title: Thời gian chạy của tác tử
x-i18n:
    generated_at: "2026-06-27T17:22:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw chạy một **runtime tác nhân nhúng duy nhất** - một tiến trình tác nhân cho mỗi
Gateway, với không gian làm việc, tệp bootstrap và kho phiên riêng. Trang này
trình bày hợp đồng runtime đó: không gian làm việc phải chứa gì, tệp nào được
chèn vào, và phiên bootstrap dựa trên đó như thế nào.

## Không gian làm việc (bắt buộc)

OpenClaw dùng một thư mục không gian làm việc tác nhân duy nhất (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) của tác nhân cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu còn thiếu và khởi tạo các tệp không gian làm việc.

Bố cục không gian làm việc đầy đủ + hướng dẫn sao lưu: [Không gian làm việc tác nhân](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải main có thể ghi đè điều này bằng
không gian làm việc theo từng phiên bên dưới `agents.defaults.sandbox.workspaceRoot` (xem
[Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp bootstrap (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw mong đợi các tệp người dùng có thể chỉnh sửa này:

- `AGENTS.md` - chỉ dẫn vận hành + "bộ nhớ"
- `SOUL.md` - persona, ranh giới, giọng điệu
- `TOOLS.md` - ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` - nghi thức chạy lần đầu một lần (bị xóa sau khi hoàn tất)
- `IDENTITY.md` - tên/cảm giác/emoji của tác nhân
- `USER.md` - hồ sơ người dùng + cách xưng hô ưu tiên

Ở lượt đầu tiên của một phiên mới, OpenClaw chèn nội dung của các tệp này vào Project Context của system prompt.

Các tệp trống bị bỏ qua. Tệp lớn được cắt gọn và rút ngắn kèm một marker để prompt luôn gọn nhẹ (đọc tệp để xem nội dung đầy đủ).

Nếu thiếu một tệp, OpenClaw chèn một dòng marker "thiếu tệp" duy nhất (và `openclaw setup` sẽ tạo một mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho một **không gian làm việc hoàn toàn mới** (không có tệp bootstrap nào khác hiện diện). Khi tệp này còn đang chờ, OpenClaw giữ nó trong Project Context và thêm hướng dẫn bootstrap ở system prompt cho nghi thức ban đầu thay vì sao chép nó vào tin nhắn người dùng. Nếu bạn xóa nó sau khi hoàn tất nghi thức, nó sẽ không được tạo lại ở các lần khởi động lại sau.

Sau khi một không gian làm việc đã được quan sát, OpenClaw cũng giữ một marker chứng thực trong thư mục trạng thái cho đường dẫn không gian làm việc. Nếu một không gian làm việc vừa được chứng thực gần đây biến mất hoặc bị xóa sạch, quá trình khởi động sẽ từ chối âm thầm gieo lại `BOOTSTRAP.md`; hãy khôi phục không gian làm việc hoặc dùng đặt lại onboard đầy đủ để không gian làm việc và marker được xóa cùng nhau.

Để tắt hoàn toàn việc tạo tệp bootstrap (cho không gian làm việc đã được tạo sẵn), đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp sẵn

Các công cụ lõi (read/exec/edit/write và công cụ hệ thống liên quan) luôn có sẵn,
tùy theo chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi
`tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát công cụ nào tồn tại; đó là
hướng dẫn về cách _bạn_ muốn chúng được sử dụng.

## Skills

OpenClaw tải Skills từ các vị trí này (độ ưu tiên cao nhất trước):

- Không gian làm việc: `<workspace>/skills`
- Skills tác nhân dự án: `<workspace>/.agents/skills`
- Skills tác nhân cá nhân: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đóng gói kèm (đi cùng bản cài đặt)
- Thư mục Skills bổ sung: `skills.load.extraDirs`

Gốc Skills có thể chứa các thư mục được nhóm như
`<workspace>/skills/personal/foo/SKILL.md`; Skill vẫn được hiển thị bằng tên
frontmatter phẳng của nó, ví dụ `foo`.

Skills có thể được kiểm soát bằng config/env (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới runtime

Runtime tác nhân nhúng thuộc sở hữu của OpenClaw: khám phá model, nối dây công cụ,
lắp ráp prompt, quản lý phiên và phân phối kênh chia sẻ một bề mặt runtime
tích hợp duy nhất.

## Phiên

Bản ghi phiên được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên ổn định và do OpenClaw chọn.
Các thư mục phiên cũ từ công cụ khác không được đọc.

## Điều hướng khi đang streaming

Prompt đến giữa lúc đang chạy mặc định được điều hướng vào lượt chạy hiện tại.
Việc điều hướng được gửi **sau khi lượt trợ lý hiện tại hoàn tất thực thi các
lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo, và không còn bỏ qua các lệnh gọi công cụ còn lại
từ tin nhắn trợ lý hiện tại.

`/queue steer` là hành vi mặc định cho lượt chạy đang hoạt động. `/queue followup` và
`/queue collect` khiến tin nhắn chờ một lượt sau thay vì điều hướng.
`/queue interrupt` thì hủy lượt chạy đang hoạt động. Xem [Hàng đợi](/vi/concepts/queue)
và [Hàng đợi điều hướng](/vi/concepts/queue-steering) để biết hành vi hàng đợi và ranh giới.

Streaming theo khối gửi các khối trợ lý đã hoàn tất ngay khi chúng xong; tính năng này
**tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`).
Tinh chỉnh ranh giới qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end).
Kiểm soát việc chia nhỏ khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định là
800-1200 ký tự; ưu tiên ngắt đoạn, sau đó xuống dòng; câu là cuối cùng).
Gộp các phần được stream bằng `agents.defaults.blockStreamingCoalesce` để giảm
spam một dòng (gộp dựa trên trạng thái nhàn rỗi trước khi gửi). Các kênh không phải Telegram cần
`*.blockStreaming: true` rõ ràng để bật phản hồi theo khối.
Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Control UI
stream đầu ra công cụ qua sự kiện tác nhân khi có sẵn.
Chi tiết thêm: [Streaming + chia nhỏ](/vi/concepts/streaming).

## Tham chiếu model

Tham chiếu model trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách tại dấu `/` **đầu tiên**.

- Dùng `provider/model` khi cấu hình model.
- Nếu chính ID model chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố provider (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua provider, OpenClaw sẽ thử alias trước, rồi một kết quả khớp
  provider đã cấu hình duy nhất cho đúng model id đó, và chỉ sau đó mới quay về
  provider mặc định đã cấu hình. Nếu provider đó không còn cung cấp model mặc định
  đã cấu hình, OpenClaw quay về provider/model đã cấu hình đầu tiên
  thay vì hiển thị một mặc định provider đã bị xóa và lỗi thời.

## Cấu hình (tối thiểu)

Tối thiểu, đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Nhóm trò chuyện](/vi/channels/group-messages)_ 🦞

## Liên quan

- [Không gian làm việc tác nhân](/vi/concepts/agent-workspace)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
