---
read_when:
    - Thay đổi thời gian chạy của tác nhân, khởi tạo không gian làm việc hoặc hành vi phiên
summary: Môi trường chạy của tác nhân, hợp đồng không gian làm việc và khởi tạo phiên
title: Môi trường thực thi tác tử
x-i18n:
    generated_at: "2026-05-06T09:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw chạy một **runtime tác tử nhúng duy nhất** - một tiến trình tác tử cho mỗi Gateway, với workspace, tệp bootstrap và kho phiên riêng. Trang này trình bày hợp đồng runtime đó: workspace phải chứa gì, những tệp nào được chèn vào, và cách các phiên bootstrap dựa trên nó.

## Workspace (bắt buộc)

OpenClaw dùng một thư mục workspace tác tử duy nhất (`agents.defaults.workspace`) làm thư mục làm việc **duy nhất** (`cwd`) của tác tử cho công cụ và ngữ cảnh.

Khuyến nghị: dùng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu còn thiếu và khởi tạo các tệp workspace.

Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Workspace tác tử](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải main có thể ghi đè điều này bằng workspace theo từng phiên trong `agents.defaults.sandbox.workspaceRoot` (xem [Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp bootstrap (được chèn)

Bên trong `agents.defaults.workspace`, OpenClaw kỳ vọng các tệp người dùng có thể chỉnh sửa sau:

- `AGENTS.md` - hướng dẫn vận hành + "bộ nhớ"
- `SOUL.md` - persona, ranh giới, giọng điệu
- `TOOLS.md` - ghi chú công cụ do người dùng duy trì (ví dụ: `imsg`, `sag`, quy ước)
- `BOOTSTRAP.md` - nghi thức chạy lần đầu một lần (bị xóa sau khi hoàn tất)
- `IDENTITY.md` - tên/phong cách/emoji của tác tử
- `USER.md` - hồ sơ người dùng + cách xưng hô ưu tiên

Ở lượt đầu tiên của phiên mới, OpenClaw chèn nội dung của các tệp này vào Project Context của system prompt.

Các tệp trống sẽ bị bỏ qua. Tệp lớn được rút gọn và cắt bớt kèm một marker để prompt vẫn gọn nhẹ (đọc tệp để xem nội dung đầy đủ).

Nếu thiếu tệp, OpenClaw chèn một dòng marker "tệp bị thiếu" duy nhất (và `openclaw setup` sẽ tạo mẫu mặc định an toàn).

`BOOTSTRAP.md` chỉ được tạo cho một **workspace hoàn toàn mới** (không có tệp bootstrap nào khác). Khi tệp này còn đang chờ xử lý, OpenClaw giữ nó trong Project Context và thêm hướng dẫn bootstrap vào system prompt cho nghi thức ban đầu thay vì sao chép nó vào tin nhắn người dùng. Nếu bạn xóa nó sau khi hoàn tất nghi thức, nó sẽ không được tạo lại trong các lần khởi động sau.

Để tắt hoàn toàn việc tạo tệp bootstrap (cho workspace đã được chuẩn bị sẵn), đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp sẵn

Các công cụ cốt lõi (read/exec/edit/write và các công cụ hệ thống liên quan) luôn khả dụng, tùy theo chính sách công cụ. `apply_patch` là tùy chọn và được kiểm soát bởi `tools.exec.applyPatch`. `TOOLS.md` **không** kiểm soát những công cụ nào tồn tại; đó là hướng dẫn về cách _bạn_ muốn chúng được dùng.

## Skills

OpenClaw tải Skills từ các vị trí sau (độ ưu tiên cao nhất trước):

- Workspace: `<workspace>/skills`
- Skills tác tử dự án: `<workspace>/.agents/skills`
- Skills tác tử cá nhân: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đóng gói kèm (đi cùng bản cài đặt)
- Thư mục Skills bổ sung: `skills.load.extraDirs`

Skills có thể được kiểm soát bằng config/env (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới runtime

Runtime tác tử nhúng được xây dựng trên lõi tác tử Pi (model, công cụ và pipeline prompt). Quản lý phiên, khám phá, nối dây công cụ và phân phối qua kênh là các lớp do OpenClaw sở hữu nằm trên lõi đó.

## Phiên

Transcript phiên được lưu dưới dạng JSONL tại:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID phiên ổn định và do OpenClaw chọn.
Các thư mục phiên legacy từ công cụ khác không được đọc.

## Điều hướng khi streaming

Khi chế độ hàng đợi là `steer`, tin nhắn đến được chèn vào lượt chạy hiện tại. Điều hướng đã xếp hàng được gửi **sau khi lượt trợ lý hiện tại hoàn tất việc thực thi các lời gọi công cụ**, trước lời gọi LLM tiếp theo. Pi xả tất cả tin nhắn điều hướng đang chờ cùng lúc cho `steer`; `queue` legacy xả một tin nhắn cho mỗi ranh giới model. Điều hướng không còn bỏ qua các lời gọi công cụ còn lại từ tin nhắn trợ lý hiện tại.

Khi chế độ hàng đợi là `followup` hoặc `collect`, tin nhắn đến được giữ lại cho đến khi lượt hiện tại kết thúc, rồi một lượt tác tử mới bắt đầu với các payload đã xếp hàng. Xem [Hàng đợi](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering) để biết chế độ và hành vi ranh giới.

Block streaming gửi các khối trợ lý đã hoàn tất ngay khi chúng kết thúc; tính năng này **mặc định tắt** (`agents.defaults.blockStreamingDefault: "off"`).
Tinh chỉnh ranh giới qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là text_end).
Điều khiển chia khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định 800-1200 ký tự; ưu tiên ngắt đoạn, rồi dòng mới; câu là cuối cùng).
Gộp các chunk được stream bằng `agents.defaults.blockStreamingCoalesce` để giảm spam một dòng (gộp dựa trên thời gian rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu bật rõ ràng `*.blockStreaming: true` để bật trả lời dạng khối.
Tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không debounce); Control UI stream đầu ra công cụ qua sự kiện tác tử khi có sẵn.
Chi tiết thêm: [Streaming + chia chunk](/vi/concepts/streaming).

## Tham chiếu model

Tham chiếu model trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách theo dấu `/` **đầu tiên**.

- Dùng `provider/model` khi cấu hình model.
- Nếu ID model tự nó chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ thử alias trước, rồi thử khớp nhà cung cấp đã cấu hình duy nhất cho đúng ID model đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình. Nếu nhà cung cấp đó không còn cung cấp model mặc định đã cấu hình, OpenClaw sẽ quay về provider/model đã cấu hình đầu tiên thay vì hiển thị một mặc định nhà cung cấp đã bị xóa và lỗi thời.

## Cấu hình (tối thiểu)

Tối thiểu, đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (rất khuyến nghị)

---

_Tiếp theo: [Nhóm chat](/vi/channels/group-messages)_ 🦞

## Liên quan

- [Workspace tác tử](/vi/concepts/agent-workspace)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
