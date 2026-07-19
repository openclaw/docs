---
read_when:
    - Thay đổi runtime của tác nhân, quá trình khởi tạo không gian làm việc hoặc hành vi phiên làm việc
summary: Thời gian chạy của agent, hợp đồng workspace và khởi tạo phiên làm việc
title: Môi trường thực thi tác tử
x-i18n:
    generated_at: "2026-07-19T05:42:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 731de7000f261180483570f6eb597f9284ab774ebdeffd5f23019a9431e8750e
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw cung cấp một **runtime agent nhúng**: vòng lặp agent tích hợp sẵn, cơ chế kết nối công cụ và lắp ráp prompt, tách biệt với việc ủy quyền các lượt cho một tiến trình harness bên ngoài. Mỗi agent đã cấu hình (xem [Định tuyến đa agent](/vi/concepts/multi-agent) để chạy nhiều agent) có workspace, tệp bootstrap và kho phiên riêng. Trang này trình bày hợp đồng runtime đó: workspace phải chứa những gì, những tệp nào được chèn và cách các phiên bootstrap dựa trên workspace.

## Workspace (bắt buộc)

Mỗi agent sử dụng một thư mục workspace duy nhất (`agents.defaults.workspace`, hoặc
`agents.list[].workspace` cho mỗi agent) làm **thư mục làm việc duy nhất** (`cwd`)
cho công cụ và ngữ cảnh.

Khuyến nghị: sử dụng `openclaw setup` để tạo `~/.openclaw/openclaw.json` nếu chưa có và khởi tạo các tệp workspace.

Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Workspace của agent](/vi/concepts/agent-workspace)

Nếu `agents.defaults.sandbox` được bật, các phiên không phải phiên chính có thể ghi đè thiết lập này bằng
workspace riêng cho từng phiên trong `agents.defaults.sandbox.workspaceRoot` (xem
[Cấu hình Gateway](/vi/gateway/configuration)).

## Tệp bootstrap (được chèn)

Bên trong workspace, OpenClaw yêu cầu các tệp mà người dùng có thể chỉnh sửa sau:

| Tệp            | Mục đích                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Hướng dẫn vận hành + "bộ nhớ"                    |
| `SOUL.md`      | Tính cách, ranh giới, giọng điệu                            |
| `TOOLS.md`     | Ghi chú và quy ước về công cụ do người dùng duy trì           |
| `IDENTITY.md`  | Tên/cảm xúc/emoji của agent                                |
| `USER.md`      | Hồ sơ người dùng + cách xưng hô ưu tiên                     |
| `HEARTBEAT.md` | Hướng dẫn dành riêng cho Heartbeat                      |
| `BOOTSTRAP.md` | Nghi thức chạy lần đầu một lần duy nhất (bị xóa sau khi hoàn tất) |
| `MEMORY.md`    | Tệp bộ nhớ dài hạn gốc, nếu có               |

Ở lượt đầu tiên của một phiên mới, OpenClaw chèn nội dung của các tệp này vào Ngữ cảnh dự án trong prompt hệ thống. `MEMORY.md` chỉ được chèn khi tồn tại tại thư mục gốc của workspace.

Các tệp trống được bỏ qua. Các tệp lớn được rút gọn và cắt bớt kèm một dấu đánh dấu để prompt luôn gọn nhẹ (hãy đọc tệp để xem toàn bộ nội dung). Nếu thiếu tệp (ngoại trừ `MEMORY.md`), hệ thống sẽ chèn một dòng đánh dấu "thiếu tệp"; `openclaw setup` tạo một mẫu mặc định an toàn cho tệp đó.

`BOOTSTRAP.md` chỉ được tạo cho một **workspace hoàn toàn mới** (không có tệp bootstrap nào khác). Trong khi tệp này đang chờ xử lý, OpenClaw giữ nó trong Ngữ cảnh dự án và thêm hướng dẫn bootstrap vào prompt hệ thống cho nghi thức ban đầu thay vì sao chép nó vào thông điệp người dùng. Nếu bạn xóa tệp sau khi hoàn tất nghi thức, tệp sẽ không được tạo lại trong các lần khởi động sau.

Sau khi một workspace đã được ghi nhận, OpenClaw lưu trạng thái thiết lập và
chứng thực của workspace đó trong cơ sở dữ liệu SQLite dùng chung tại
`~/.openclaw/state/openclaw.sqlite`. Nếu một workspace mới được chứng thực gần đây
biến mất hoặc bị xóa sạch, quá trình khởi động sẽ từ chối âm thầm tạo lại `BOOTSTRAP.md`;
hãy khôi phục workspace hoặc sử dụng thao tác đặt lại quy trình onboard đầy đủ để workspace và
trạng thái cơ sở dữ liệu của nó được xóa cùng nhau.

Các bản phát hành cũ sử dụng JSON trong workspace và các tệp sidecar `.attested`. Runtime không
đọc các tệp đó. Chạy `openclaw doctor --fix` để xác thực chúng, nhập
trạng thái của chúng vào SQLite và xóa từng nguồn sau khi xác minh các hàng đã nhập.

Để tắt hoàn toàn việc tạo tệp bootstrap (đối với các workspace đã được điền sẵn), hãy đặt:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Công cụ tích hợp sẵn

Các công cụ cốt lõi (đọc/thực thi/chỉnh sửa/ghi và các công cụ hệ thống liên quan) luôn khả dụng,
tùy thuộc vào chính sách công cụ. `apply_patch` được bật theo mặc định cho các mô hình OpenAI và được kiểm soát bởi
`tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` **không** kiểm soát công cụ nào tồn tại; đó là
hướng dẫn về cách _bạn_ muốn chúng được sử dụng.

## Skills

OpenClaw tải Skills từ các vị trí sau (theo thứ tự ưu tiên từ cao xuống thấp):

- Workspace: `<workspace>/skills`
- Skills của agent trong dự án: `<workspace>/.agents/skills`
- Skills cá nhân của agent: `~/.agents/skills`
- Được quản lý/cục bộ: `~/.openclaw/skills`
- Đi kèm (được phân phối cùng bản cài đặt)
- Các thư mục skill bổ sung: `skills.load.extraDirs`

Thư mục gốc của skill có thể chứa các thư mục được nhóm như
`<workspace>/skills/personal/foo/SKILL.md`; skill vẫn được cung cấp bằng tên frontmatter phẳng,
ví dụ `foo`.

Skills có thể được kiểm soát bằng cấu hình/biến môi trường (xem `skills` trong [Cấu hình Gateway](/vi/gateway/configuration)).

## Ranh giới runtime

Runtime agent nhúng thuộc quyền sở hữu của OpenClaw: khám phá mô hình, kết nối công cụ,
lắp ráp prompt, quản lý phiên và phân phối qua kênh dùng chung một
bề mặt runtime tích hợp.

## Phiên

Các hàng phiên được lưu trữ trong cơ sở dữ liệu SQLite riêng cho từng agent:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Các tệp bản ghi JSONL vẫn có thể nằm trong
`~/.openclaw/agents/<agentId>/sessions/` dưới dạng đầu vào di chuyển cũ, kho lưu trữ đã xóa hoặc
đặt lại, dữ liệu nhập, dữ liệu xuất và tạo tác hỗ trợ. Lịch sử agent đang hoạt động được
lưu trong SQLite cùng các hàng phiên. ID phiên ổn định và do
OpenClaw chọn. OpenClaw không đọc thư mục phiên từ các công cụ khác.

## Điều hướng trong khi phát trực tuyến

Các prompt đầu vào đến giữa lúc đang chạy mặc định được điều hướng vào lượt chạy hiện tại.
Việc điều hướng được chuyển đến **sau khi lượt hiện tại của trợ lý hoàn tất thực thi các
lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo, và không còn bỏ qua các lệnh gọi công cụ
còn lại từ thông điệp hiện tại của trợ lý.

`/queue steer` là hành vi mặc định khi lượt chạy đang hoạt động. `/queue followup` và
`/queue collect` khiến thông điệp chờ đến một lượt sau thay vì điều hướng.
`/queue interrupt` hủy lượt chạy đang hoạt động. Xem [Hàng đợi](/vi/concepts/queue)
và [Hàng đợi điều hướng](/vi/concepts/queue-steering) để biết hành vi của hàng đợi và ranh giới.

Phát trực tuyến theo khối gửi các khối hoàn chỉnh của trợ lý ngay khi chúng hoàn tất; tính năng này
**tắt theo mặc định** (`agents.defaults.blockStreamingDefault: "off"`).
Điều chỉnh ranh giới thông qua `agents.defaults.blockStreamingBreak` (`text_end` so với `message_end`; mặc định là `text_end`).
Kiểm soát việc chia khối mềm bằng `agents.defaults.blockStreamingChunk` (mặc định
800-1200 ký tự; ưu tiên ngắt đoạn, sau đó ngắt dòng; cuối cùng là câu).
Gộp các đoạn được phát trực tuyến bằng `agents.defaults.blockStreamingCoalesce` để giảm
tình trạng gửi dồn dập từng dòng (gộp dựa trên thời gian nhàn rỗi trước khi gửi). Các kênh không phải Telegram yêu cầu
`*.streaming.block.enabled: true` rõ ràng để bật phản hồi theo khối (thay vào đó, QQ Bot
phát trực tuyến phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`).
Các bản tóm tắt công cụ chi tiết được phát ra khi công cụ bắt đầu (không trì hoãn chống dội); Control UI
phát trực tuyến đầu ra công cụ qua các sự kiện agent khi khả dụng.
Chi tiết thêm: [Phát trực tuyến + chia khối](/vi/concepts/streaming).

## Tham chiếu mô hình

Các tham chiếu mô hình trong cấu hình (ví dụ `agents.defaults.model` và `agents.defaults.models`) được phân tích bằng cách tách tại `/` **đầu tiên**.

- Sử dụng `provider/model` khi cấu hình mô hình.
- Nếu chính ID mô hình chứa `/` (theo kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bỏ qua nhà cung cấp, trước tiên OpenClaw thử một bí danh, sau đó thử một kết quả khớp duy nhất
  từ nhà cung cấp đã cấu hình cho chính xác ID mô hình đó, và chỉ khi đó mới dự phòng
  về nhà cung cấp mặc định đã cấu hình. Nếu nhà cung cấp đó không còn cung cấp
  mô hình mặc định đã cấu hình, OpenClaw sẽ dự phòng về cặp nhà cung cấp/mô hình
  được cấu hình đầu tiên thay vì hiển thị một mặc định cũ của nhà cung cấp đã bị xóa.

## Cấu hình (tối thiểu)

Tối thiểu, hãy đặt:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (đặc biệt khuyến nghị)

## Liên quan

- [Workspace của agent](/vi/concepts/agent-workspace)
- [Định tuyến đa agent](/vi/concepts/multi-agent)
- [Quản lý phiên](/vi/concepts/session)
- [Trò chuyện nhóm](/vi/channels/group-messages)
