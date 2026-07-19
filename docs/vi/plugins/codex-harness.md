---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex chính thức
    - Bạn cần các ví dụ về cấu hình bộ khung Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex gặp lỗi thay vì chuyển dự phòng sang OpenClaw
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua bộ khung app-server Codex chính thức
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-07-19T17:08:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 791c637e772760a9ff580575f93c84ce4f477e08a08ee8bd29e251b3e0c18091
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` chính thức chạy các lượt tác tử OpenAI nhúng thông qua app-server Codex
thay vì bộ khung OpenClaw tích hợp sẵn. Codex sở hữu phiên tác tử
cấp thấp: tiếp tục luồng gốc, tiếp tục công cụ gốc,
Compaction gốc và thực thi bằng app-server. OpenClaw vẫn sở hữu các kênh
trò chuyện, tệp phiên, lựa chọn mô hình, công cụ động OpenClaw, phê duyệt,
phân phối nội dung đa phương tiện và bản sao transcript hiển thị.

Sử dụng các tham chiếu mô hình OpenAI chuẩn như `openai/gpt-5.6-sol`. Không cấu hình
các tham chiếu GPT Codex cũ; đặt thứ tự xác thực tác tử OpenAI trong `auth.order.openai`.
Các mã định danh hồ sơ xác thực Codex cũ và mục thứ tự xác thực Codex cũ được
`openclaw doctor --fix` sửa chữa.

Khi chính sách runtime của nhà cung cấp/mô hình chưa được đặt hoặc là `auto`, riêng tiền tố `openai/*`
không bao giờ chọn bộ khung này. OpenAI chỉ có thể ngầm chọn Codex cho một
tuyến Platform Responses HTTPS chính thức hoặc ChatGPT Responses khớp chính xác mà không có
ghi đè yêu cầu do người dùng thiết lập. Xem
[Runtime tác tử ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).
Nếu Codex sở hữu xác thực trước khi xác định được định tuyến Platform hay ChatGPT, OpenClaw
vẫn yêu cầu mọi tuyến ứng viên khai báo khả năng tương thích với Codex. Chỉ riêng
quyền sở hữu xác thực gốc không bao giờ bỏ qua bước kiểm tra tuyến đó.

Khi không có sandbox OpenClaw nào đang hoạt động, OpenClaw khởi động các luồng app-server Codex
với chế độ mã gốc của Codex được bật (chế độ chỉ mã vẫn tắt theo mặc định), vì vậy
các khả năng không gian làm việc/mã gốc vẫn khả dụng cùng với các công cụ động
OpenClaw được định tuyến qua cầu nối app-server `item/tool/call`. Một
sandbox OpenClaw đang hoạt động hoặc chính sách công cụ hạn chế sẽ tắt hoàn toàn chế độ mã gốc
trừ khi bạn chọn sử dụng đường dẫn exec-server sandbox thử nghiệm.

Với `tools.exec.host: "auto"` mặc định và không có sandbox OpenClaw đang hoạt động,
Codex cũng nhận các công cụ `node_exec` và `node_process` để chạy lệnh trên các
Node đã ghép nối. Shell gốc vẫn nằm trên máy chủ và không gian làm việc của app-server Codex
(cục bộ trên Gateway đối với triển khai stdio mặc định); `node_exec` chọn một Node theo
tên hoặc mã định danh và tiếp tục áp dụng chính sách phê duyệt Node của OpenClaw. Nếu một danh sách cho phép
runtime hữu hạn tắt Code Mode gốc và khiến lượt không có
môi trường thực thi, OpenClaw thay vào đó vẫn cung cấp các công cụ `exec` và `process`
đã được lọc theo chính sách để thực thi trực tiếp, không qua sandbox.

Tính năng gốc Codex này tách biệt với
[OpenClaw Code Mode](/vi/tools/code-mode), một runtime QuickJS-WASI tùy chọn
dành cho các lượt OpenClaw chung với dạng đầu vào `exec` khác. Để tìm hiểu sự phân tách
rộng hơn giữa mô hình/nhà cung cấp/runtime, hãy bắt đầu với
[Runtime tác tử](/vi/concepts/agent-runtimes): `openai/gpt-5.6-sol` là tham chiếu
mô hình, `codex` là runtime, còn Telegram, Discord, Slack hoặc một
kênh khác là bề mặt giao tiếp.

## Yêu cầu

- Đã cài đặt Plugin `@openclaw/codex` chính thức. Bao gồm `codex` trong
  `plugins.allow` nếu cấu hình của bạn sử dụng danh sách cho phép.
- Một app-server Codex ổn định từ `0.143.0` đến `0.144.6`. Plugin mặc định quản lý một
  tệp nhị phân tương thích, vì vậy lệnh `codex` trên `PATH` không ảnh hưởng đến quá trình
  khởi động thông thường.
- Xác thực Codex thông qua `openclaw models auth login --provider openai`, một
  tài khoản app-server đã có trong thư mục chính Codex của tác tử hoặc một
  hồ sơ xác thực khóa API Codex rõ ràng.

Để biết thứ tự ưu tiên xác thực, cách ly môi trường, lệnh app-server tùy chỉnh,
khám phá mô hình và danh sách đầy đủ các trường cấu hình, hãy xem
[Tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference).

## Bắt đầu nhanh

Cài đặt Plugin chính thức, sau đó đăng nhập bằng Codex OAuth:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Bật Plugin `codex` và chọn một mô hình tác tử OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Nếu cấu hình của bạn sử dụng `plugins.allow`, hãy thêm cả `codex` vào đó:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin. Nếu một cuộc trò chuyện đã có
phiên, trước tiên hãy chạy `/new` hoặc `/reset` để lượt tiếp theo phân giải bộ khung
từ cấu hình hiện tại.

## Chia sẻ luồng với Codex Desktop và CLI

`appServer.homeScope: "agent"` mặc định cách ly từng tác tử OpenClaw khỏi
trạng thái Codex gốc của người vận hành. Để cho phép chủ sở hữu kiểm tra và quản lý
cùng các luồng gốc hiển thị trong Codex Desktop và Codex CLI, hãy chọn sử dụng
thư mục chính Codex của người dùng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Chế độ thư mục chính người dùng hỗ trợ tiến trình stdio được quản lý cục bộ hoặc phương thức truyền qua
Unix socket dùng chung. Chế độ này sử dụng `$CODEX_HOME` khi được đặt và `~/.codex` nếu không, bao gồm
xác thực, cấu hình, Plugin và kho luồng Codex gốc của thư mục chính đó. OpenClaw không
chèn hồ sơ xác thực OpenClaw vào app-server này.

Các lượt của chủ sở hữu có thêm công cụ `codex_threads`: liệt kê, tìm kiếm, đọc, phân nhánh, đổi tên,
lưu trữ và khôi phục các luồng gốc. Phân nhánh một luồng để tiếp tục luồng đó trong
OpenClaw; nhánh được gắn vào phiên OpenClaw hiện tại và vẫn
hiển thị với các máy khách Codex gốc khác. Việc lưu trữ yêu cầu xác nhận rõ ràng
rằng luồng đã được đóng ở nơi khác. Khi giám sát cũng được bật,
các trường transcript và thao tác thay đổi yêu cầu tùy chọn tham gia tương ứng
`supervision.allowRawTranscripts` hoặc `supervision.allowWriteControls`.

Không tiếp tục hoặc ghi đồng thời vào cùng một luồng thông qua các App Server stdio
được quản lý độc lập. Codex điều phối các trình ghi đang hoạt động trong một App Server, không
điều phối giữa các tiến trình riêng biệt. Phân nhánh là đường dẫn cùng tồn tại an toàn cho các
phiên stdio dùng thư mục chính người dùng thông thường.

Riêng `appServer.homeScope: "user"` không kiểm soát danh mục nhóm máy. Tính năng
khám phá phiên gốc được bật khi Plugin hoạt động; đặt
`sessionCatalog.enabled: false` để xóa tính năng này khỏi thanh bên OpenClaw mà không
tắt Codex. Danh mục sử dụng một kết nối giám sát riêng; khi không có
cài đặt kết nối `appServer` rõ ràng, kết nối đó mặc định dùng stdio
thư mục chính người dùng được quản lý, còn bộ khung thông thường vẫn giới hạn theo tác tử. Các cài đặt
`appServer` rõ ràng được cả hai đường dẫn tuân theo. Đặt `homeScope: "user"`
một cách rõ ràng như trên khi bộ khung thông thường cũng cần chia sẻ trạng thái gốc.

## Giám sát các phiên Codex

Cùng Plugin `codex` có thể liệt kê các phiên Codex chưa được lưu trữ từ máy tính
Gateway và các Node đã ghép nối có bật tùy chọn tham gia. Một phiên cục bộ trên Gateway đã lưu hoặc đang rảnh có thể
tạo một cuộc trò chuyện bị khóa theo mô hình, phản chiếu lịch sử người dùng và trợ lý bền vững
có giới hạn của phiên đó. Liên kết riêng tư của cuộc trò chuyện sử dụng kết nối giám sát cho ảnh chụp nhanh
gốc, nhánh chuẩn và các lượt sau này, trong khi các phiên Codex thông thường vẫn
giới hạn theo tác tử. Lần bắt đầu chuẩn đầu tiên sử dụng chính xác mô hình và nhà cung cấp mà
Codex trả về cho nhánh ảnh chụp nhanh. Các lần tiếp tục sau để cấu hình gốc của Codex
quyết định lựa chọn; mô hình OpenClaw bên ngoài và chuỗi dự phòng không bao giờ thay thế
lựa chọn đó. Các hàng đã lưu và đang rảnh có thể được lưu trữ sau khi xác nhận rõ ràng rằng không có trình chạy nào khác.
Các nguồn đang hoạt động không thể tạo nhánh hoặc được lưu trữ; vẫn có thể mở một
cuộc trò chuyện được giám sát hiện có. Các phiên trên Node đã ghép nối chỉ chứa siêu dữ liệu.

Xem [Giám sát các phiên Codex](/vi/plugins/codex-supervision) để biết cách thiết lập, quy tắc phân nhánh,
giới hạn của Node đã ghép nối, mức độ hiển thị siêu dữ liệu và cách khắc phục sự cố.

## Cấu hình

| Nhu cầu                                              | Thiết lập                                                                                         | Vị trí                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Bật bộ khung                                         | `plugins.entries.codex.enabled: true`                                                            | Cấu hình OpenClaw                  |
| Ẩn tính năng khám phá phiên Codex gốc                | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Cấu hình Plugin Codex              |
| Duy trì bản cài đặt Plugin có trong danh sách cho phép | Bao gồm `codex` trong `plugins.allow`                                                               | Cấu hình OpenClaw                  |
| Cho phép các lượt OpenAI đủ điều kiện ngầm sử dụng Codex | Tuyến Responses/ChatGPT HTTPS chính thức khớp chính xác, không có ghi đè yêu cầu do người dùng thiết lập, runtime chưa đặt/`auto` | Cấu hình nhà cung cấp/mô hình OpenAI |
| Đăng nhập bằng ChatGPT/Codex OAuth                   | `openclaw models auth login --provider openai`                                                   | Hồ sơ xác thực CLI                 |
| Thêm khóa API dự phòng cho các lượt Codex            | Hồ sơ khóa API `openai:*` được liệt kê sau xác thực thuê bao trong `auth.order.openai`                 | Hồ sơ xác thực CLI + cấu hình OpenClaw |
| Dừng an toàn khi Codex không khả dụng                | `agentRuntime.id: "codex"` của nhà cung cấp hoặc mô hình                                                     | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Sử dụng lưu lượng API OpenAI trực tiếp               | `agentRuntime.id: "openclaw"` của nhà cung cấp hoặc mô hình với xác thực OpenAI thông thường                          | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Tinh chỉnh hành vi app-server                        | `plugins.entries.codex.config.appServer.*`                                                       | Cấu hình Plugin Codex              |
| Bật các ứng dụng Plugin Codex gốc                    | `plugins.entries.codex.config.codexPlugins.*`                                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                               | `plugins.entries.codex.config.computerUse.*`                                                     | Cấu hình Plugin Codex              |

Ưu tiên `auth.order.openai` cho thứ tự ưu tiên thuê bao trước/khóa API dự phòng.
Các mã định danh hồ sơ xác thực Codex cũ và thứ tự xác thực Codex cũ hiện có là
trạng thái cũ chỉ dành cho doctor; không ghi các tham chiếu GPT Codex cũ mới.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Đối với một tuyến hiệu lực tương thích với Codex, cả hai hồ sơ trên vẫn là ứng viên
cho cùng một lượt Codex. Thứ tự hồ sơ chọn thông tin xác thực, không chọn runtime.
Việc thay đổi thứ tự xác thực không làm cho một tuyến tùy chỉnh, Completions, HTTP hoặc
bị ghi đè yêu cầu trở nên tương thích với Codex.

### Compaction

Không đặt `compaction.model` hoặc `compaction.provider` trên các tác tử
dùng Codex. Codex thực hiện Compaction thông qua trạng thái luồng app-server gốc, vì vậy
OpenClaw bỏ qua các ghi đè bộ tóm tắt cục bộ đó trong runtime, và
`openclaw doctor --fix` xóa chúng khi tác tử sử dụng Codex.

Lossless vẫn được hỗ trợ như một công cụ ngữ cảnh để lắp ráp, nạp và
bảo trì xung quanh các lượt Codex, được cấu hình thông qua
`plugins.slots.contextEngine: "lossless-claw"` và
`plugins.entries.lossless-claw.config.summaryModel`, không phải thông qua
`agents.defaults.compaction.provider`. `openclaw doctor --fix` di chuyển
dạng `compaction.provider: "lossless-claw"` cũ sang vị trí công cụ ngữ cảnh
Lossless khi Codex là runtime đang hoạt động, nhưng Codex gốc vẫn
sở hữu Compaction. Bộ khung app-server gốc hỗ trợ các công cụ ngữ cảnh
cần lắp ráp trước lời nhắc; các backend CLI chung, bao gồm `codex-cli`,
không cung cấp khả năng máy chủ đó.

Đối với các tác tử dùng Codex, `/compact` bắt đầu quá trình Compaction app-server
Codex gốc trên luồng đã liên kết. OpenClaw không chờ hoàn tất,
áp đặt thời gian chờ OpenClaw, khởi động lại app-server dùng chung hoặc chuyển dự phòng sang
công cụ ngữ cảnh hay bộ tóm tắt OpenAI công khai. Nếu liên kết luồng Codex gốc
bị thiếu hoặc lỗi thời, lệnh sẽ dừng an toàn thay vì âm thầm
chuyển đổi backend Compaction.

Phần còn lại của trang này trình bày mô hình triển khai, định tuyến đóng khi lỗi, chính sách phê duyệt của Guardian, các plugin Codex gốc và Computer Use. Để xem đầy đủ danh sách tùy chọn, giá trị mặc định, enum, cơ chế khám phá, cách ly môi trường, thời gian chờ và các trường truyền tải app-server, hãy xem
[Tài liệu tham khảo về Codex harness](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Sử dụng `/status` trong cuộc trò chuyện mà bạn dự kiến dùng Codex. Một lượt agent OpenAI được Codex hỗ trợ sẽ hiển thị:

```text
Runtime: OpenAI Codex
```

Sau đó kiểm tra trạng thái app-server của Codex:

```text
/codex status
/codex models
```

`/codex status` báo cáo khả năng kết nối app-server, tài khoản, giới hạn tốc độ, các máy chủ MCP và skill. `/codex models` liệt kê danh mục app-server Codex đang hoạt động cho harness và tài khoản. Nếu `/status` gây bất ngờ, hãy xem
[Khắc phục sự cố](#troubleshooting).

## Định tuyến và lựa chọn mô hình

Tách biệt tham chiếu nhà cung cấp và chính sách runtime:

- Sử dụng `openai/gpt-*` để lựa chọn mô hình OpenAI chuẩn tắc. Chỉ riêng tiền tố
  không bao giờ chọn Codex.
- Khi runtime chưa được đặt hoặc là `auto`, chỉ một tuyến Platform Responses
  hoặc ChatGPT Responses HTTPS chính thức và chính xác, không có ghi đè yêu cầu do người dùng thiết lập, mới có thể ngầm chọn Codex.
- Không sử dụng các tham chiếu Codex GPT cũ trong cấu hình; chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và ghim tuyến phiên lỗi thời.
- `agentRuntime.id: "codex"` biến Codex thành yêu cầu đóng khi lỗi đối với một
  tuyến tương thích. Nó không làm cho một tuyến hiệu dụng không tương thích trở nên tương thích.
- `agentRuntime.id: "openclaw"` chọn dùng runtime OpenClaw nhúng cho một nhà cung cấp hoặc mô hình khi đó là chủ đích.
- `/codex ...` điều khiển các cuộc hội thoại app-server Codex gốc từ cuộc trò chuyện.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ sử dụng khi người dùng
  yêu cầu ACP/acpx hoặc một bộ điều hợp harness bên ngoài.

| Ý định của người dùng                                      | Sử dụng                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Đính kèm cuộc trò chuyện hiện tại                          | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Tiếp tục một luồng Codex hiện có                           | `/codex resume <thread-id>`                                                                           |
| Liệt kê hoặc lọc các luồng Codex                           | `/codex threads [filter]`                                                                             |
| Đọc hoặc cập nhật mục tiêu gốc của luồng đã liên kết       | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| Liệt kê các plugin Codex gốc                               | `/codex plugins list`                                                                                 |
| Bật hoặc tắt một plugin Codex gốc đã cấu hình              | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Tiếp tục phiên Codex CLI đã lưu dưới dạng lượt node ghép cặp | `/codex sessions --host <node> [filter]`, sau đó `/codex resume <session-id> --host <node> --bind here` |
| Xem các phiên Codex chưa lưu trữ trên nhiều máy tính       | Bật giám sát Codex và mở **Codex Sessions**                                                  |
| Thay đổi mô hình, chế độ nhanh hoặc quyền của luồng đã liên kết | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Dừng hoặc điều hướng lượt đang hoạt động                   | `/codex stop`, `/codex steer <text>`                                                                  |
| Gỡ liên kết hiện tại                                       | `/codex detach` (bí danh `/codex unbind`)                                                               |
| Chỉ gửi phản hồi Codex                                     | `/codex diagnostics [note]`                                                                           |
| Bắt đầu một tác vụ ACP/acpx                                | Các lệnh phiên ACP/acpx, không phải `/codex`                                                               |

| Trường hợp sử dụng                              | Cấu hình                                                                                                    | Xác minh                                | Ghi chú                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Tuyến OpenAI đủ điều kiện với runtime Codex gốc | Tuyến Responses/ChatGPT HTTPS chính thức và chính xác, không có ghi đè yêu cầu do người dùng thiết lập, cùng plugin `codex` đã bật | `/status` hiển thị `Runtime: OpenAI Codex` | Đường dẫn ngầm định khi runtime chưa được đặt/là `auto` |
| Đóng khi lỗi nếu Codex không khả dụng           | `agentRuntime.id: "codex"` của nhà cung cấp hoặc mô hình                                                            | Lượt thất bại thay vì dự phòng nhúng    | Sử dụng cho các triển khai chỉ dùng Codex  |
| Lưu lượng khóa API OpenAI trực tiếp qua OpenClaw | `agentRuntime.id: "openclaw"` của nhà cung cấp hoặc mô hình và xác thực OpenAI thông thường                            | `/status` hiển thị runtime OpenClaw | Chỉ sử dụng khi OpenClaw là chủ đích        |
| Cấu hình cũ                                     | Các tham chiếu Codex GPT cũ                                                                                 | `openclaw doctor --fix` ghi lại cấu hình đó  | Không viết cấu hình mới theo cách này       |
| Bộ điều hợp Codex ACP/acpx                      | ACP `sessions_spawn({ runtime: "acp" })`                                                                                      | Trạng thái tác vụ/phiên ACP             | Tách biệt với Codex harness gốc             |

`agents.defaults.imageModel` tuân theo cùng cách phân tách tiền tố. Sử dụng `openai/gpt-*`
cho tuyến OpenAI thông thường và chỉ sử dụng `codex/gpt-*` khi khả năng hiểu hình ảnh
cần chạy qua một lượt app-server Codex có giới hạn. Doctor ghi lại các tham chiếu
Codex GPT cũ thành `openai/gpt-*`.

## Mô hình triển khai

### Triển khai Codex cơ bản

Sử dụng cấu hình bắt đầu nhanh cho một mô hình OpenAI có tuyến HTTPS chính thức
hiệu dụng đủ điều kiện để ngầm chọn Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Triển khai nhiều nhà cung cấp

Giữ Claude làm agent mặc định và thêm một agent Codex có tên:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Agent `main` sử dụng đường dẫn nhà cung cấp thông thường. Agent `codex` sử dụng app-server
Codex khi tuyến OpenAI hiệu dụng của nó vẫn tương thích; thêm `agentRuntime.id: "codex"`
theo phạm vi mô hình một cách rõ ràng khi đây phải là yêu cầu đóng khi lỗi.

### Triển khai Codex đóng khi lỗi

Một tuyến OpenAI HTTPS chính thức, chính xác và đủ điều kiện có thể phân giải sang Codex khi
plugin đi kèm khả dụng. Thêm chính sách runtime rõ ràng cho một quy tắc
đóng khi lỗi được khai báo:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Khi Codex bị bắt buộc, OpenClaw sẽ thất bại sớm nếu tuyến hiệu dụng không được khai báo
tương thích với Codex, plugin bị tắt, app-server quá cũ hoặc
app-server không thể khởi động.

## Chính sách app-server

Theo mặc định, plugin khởi động cục bộ tệp nhị phân Codex do OpenClaw quản lý bằng
truyền tải stdio. Chỉ đặt `appServer.command` khi chủ đích chạy một
tệp thực thi khác. Codex phân loại truyền tải WebSocket là thử nghiệm
và không được hỗ trợ; chỉ sử dụng cho kiểm thử ngoài môi trường production với một app-server
đã chạy ở nơi khác:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Các phiên app-server stdio cục bộ mặc định sử dụng tư thế dành cho người vận hành cục bộ
đáng tin cậy: `approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Nếu các yêu cầu Codex cục bộ không cho phép
tư thế YOLO ngầm định đó, OpenClaw sẽ chọn các quyền Guardian được phép
thay thế. Khi sandbox OpenClaw đang hoạt động cho phiên, OpenClaw
tắt Code Mode gốc của Codex, các máy chủ MCP của người dùng và việc thực thi plugin
được ứng dụng hỗ trợ cho lượt đó thay vì dựa vào sandbox phía máy chủ Codex.
Thay vào đó, quyền truy cập shell đi qua các công cụ động được sandbox OpenClaw hỗ trợ như
`sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông thường
khả dụng.

Sử dụng chế độ exec OpenClaw đã chuẩn hóa cho auto-review gốc của Codex trước khi
thoát sandbox hoặc cấp thêm quyền:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Đối với các phiên app-server Codex, `tools.exec.mode: "auto"` ánh xạ tới các phê duyệt
được Codex Guardian review: thường là `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` và `sandbox: "workspace-write"` khi
các yêu cầu cục bộ cho phép những giá trị đó. Trong `tools.exec.mode: "auto"`,
OpenClaw không giữ lại các ghi đè Codex không an toàn cũ `approvalPolicy: "never"` hoặc
`sandbox: "danger-full-access"`; sử dụng `tools.exec.mode: "full"` để
chủ đích áp dụng tư thế Codex không cần phê duyệt. Giá trị đặt sẵn cũ
`plugins.entries.codex.config.appServer.mode: "guardian"` vẫn
hoạt động, nhưng `tools.exec.mode: "auto"` là bề mặt OpenClaw đã chuẩn hóa.

Để xem so sánh ở cấp độ chế độ với các phê duyệt exec trên máy chủ và quyền
ACPX, hãy xem [Các chế độ quyền](/vi/tools/permission-modes). Để biết mọi
trường app-server, thứ tự xác thực, cách ly môi trường và hành vi thời gian chờ,
hãy xem [Tài liệu tham khảo về Codex harness](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin `codex` đăng ký `/codex` làm lệnh gạch chéo trên mọi kênh
hỗ trợ lệnh văn bản OpenClaw.

Việc thực thi và điều khiển gốc yêu cầu chủ sở hữu hoặc một client Gateway `operator.admin`:
liên kết hoặc tiếp tục luồng, gửi hoặc dừng lượt,
thay đổi mô hình, chế độ nhanh hoặc trạng thái quyền, thực hiện Compaction hoặc review, và
gỡ liên kết. Những người gửi được ủy quyền khác chỉ có quyền đọc trạng thái, trợ giúp,
tài khoản, mô hình, luồng, mục tiêu gốc, máy chủ MCP, skill và các lệnh kiểm tra
liên kết.

Các dạng thường dùng:

- `/codex status` kiểm tra khả năng kết nối với app-server, các mô hình, tài khoản, giới hạn
  tốc độ, máy chủ MCP và Skills.
- `/codex models` liệt kê các mô hình app-server Codex đang hoạt động.
- `/codex threads [filter]` liệt kê các luồng app-server Codex gần đây.
- `/codex goal` đọc hoặc cập nhật mục tiêu Codex gốc của luồng được đính kèm. Tính năng tự động tiếp tục mục tiêu của Codex vẫn bị tắt; OpenClaw chưa quản lý các lượt tiếp nối tự động.
- `/codex resume <thread-id>` đính kèm phiên OpenClaw hiện tại vào một
  luồng Codex hiện có.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  đính kèm cuộc trò chuyện hiện tại.
- `/codex detach` (hoặc `/codex unbind`) gỡ liên kết hiện tại.
- `/codex binding` mô tả liên kết hiện tại.
- `/codex stop` dừng lượt đang hoạt động; `/codex steer <text>` điều hướng lượt đó.
- `/codex model <model>`, `/codex fast [on|off|status]` và
  `/codex permissions [default|yolo|status]` thay đổi trạng thái theo từng cuộc hội thoại.
- `/codex compact` yêu cầu app-server Codex thu gọn luồng được đính kèm.
- `/codex review` bắt đầu quy trình review gốc của Codex cho luồng được đính kèm.
- `/codex diagnostics [note]` yêu cầu xác nhận trước khi gửi phản hồi Codex cho
  luồng được đính kèm.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của app-server Codex.
- `/codex skills` liệt kê Skills của app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>` và
  `/codex plugins disable <name>` quản lý các plugin Codex gốc đã cấu hình.
- `/codex computer-use [status|install]` quản lý tính năng Codex Computer Use.
- `/codex help` liệt kê toàn bộ cây lệnh.

Đối với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong
cuộc hội thoại nơi lỗi xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway
và đối với các phiên harness Codex, yêu cầu phê duyệt để gửi gói phản hồi
Codex liên quan. Xem
[Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm. Chỉ sử dụng `/codex diagnostics [note]` khi bạn đặc biệt
muốn tải lên phản hồi Codex cho luồng hiện đang được đính kèm mà không kèm
toàn bộ gói chẩn đoán Gateway.

### Kiểm tra cục bộ các luồng Codex

Cách nhanh nhất để kiểm tra một lần chạy Codex gặp lỗi thường là mở trực tiếp
luồng Codex gốc:

```bash
codex resume <thread-id>
```

Lấy mã định danh luồng từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding`
hoặc `/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán ở cấp độ runtime, hãy xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

### Thứ tự xác thực

Trong thư mục chính mặc định theo từng agent, phương thức xác thực được chọn theo thứ tự sau:

1. Các hồ sơ xác thực OpenAI được sắp thứ tự cho agent, ưu tiên nằm trong
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di chuyển các mã định danh hồ sơ xác thực
   Codex cũ và thứ tự xác thực Codex cũ.
2. Tài khoản hiện có của app-server trong thư mục chính Codex của agent đó.
3. Chỉ dành cho các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, sau đó
   `OPENAI_API_KEY`, khi không có tài khoản app-server và vẫn yêu cầu xác thực
   OpenAI.

Khi OpenClaw phát hiện hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, hệ thống
loại bỏ `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được tạo.
Điều này giữ cho các khóa API cấp Gateway vẫn khả dụng cho embedding hoặc
các mô hình OpenAI trực tiếp mà không vô tình khiến các lượt app-server Codex gốc
bị tính phí qua API. Các hồ sơ khóa API Codex rõ ràng và phương án dự phòng
khóa môi trường stdio cục bộ sử dụng thông tin đăng nhập app-server thay vì môi trường
kế thừa của tiến trình con. Các kết nối app-server WebSocket không nhận được phương án
dự phòng khóa API môi trường của Gateway; hãy sử dụng hồ sơ xác thực rõ ràng hoặc tài khoản
riêng của app-server từ xa.

Nếu hồ sơ gói đăng ký đạt giới hạn sử dụng Codex, OpenClaw ghi lại
thời gian đặt lại khi Codex báo cáo thời gian đó và thử hồ sơ xác thực tiếp theo
theo thứ tự cho cùng một lần chạy Codex. Khi thời gian đặt lại đã qua, hồ sơ
gói đăng ký lại đủ điều kiện mà không thay đổi mô hình `openai/gpt-*`
đã chọn hoặc runtime Codex.

Khi các plugin Codex gốc được cấu hình, OpenClaw cài đặt hoặc làm mới
các plugin đó thông qua app-server được kết nối trước khi cung cấp các ứng dụng
do plugin sở hữu cho luồng Codex. `app/list` vẫn là nguồn dữ liệu chuẩn cho mã định danh
ứng dụng, khả năng truy cập và siêu dữ liệu, nhưng OpenClaw quản lý quyết định
bật theo từng luồng: nếu chính sách cho phép một ứng dụng có thể truy cập trong danh sách, OpenClaw
gửi `thread/start.config.apps[appId].enabled = true` ngay cả khi `app/list`
hiện báo cáo ứng dụng đó bị tắt. Luồng này không tự tạo việc
cài đặt ứng dụng cho các mã định danh không xác định; OpenClaw chỉ kích hoạt các plugin trên marketplace
có `plugin/install` rồi làm mới kho mục.

### Cách ly môi trường

Đối với các lần khởi chạy app-server stdio cục bộ, OpenClaw đặt `CODEX_HOME` thành một
thư mục theo từng agent để cấu hình Codex, các tệp xác thực/tài khoản, bộ nhớ đệm/dữ liệu
plugin và trạng thái luồng gốc không đọc hoặc ghi vào thư mục cá nhân
`~/.codex` của người vận hành theo mặc định. OpenClaw giữ nguyên `HOME` thông thường của tiến trình;
các tiến trình con do Codex chạy vẫn có thể tìm thấy cấu hình và token trong thư mục chính của người dùng, đồng thời
Codex có thể phát hiện các mục `$HOME/.agents/skills` và
`$HOME/.agents/plugins/marketplace.json` dùng chung. Với
`appServer.homeScope: "user"`, OpenClaw thay vào đó sử dụng thư mục chính Codex gốc của người dùng
và tài khoản hiện có của thư mục đó mà không chèn hồ sơ xác thực OpenClaw.

Nếu một bản triển khai cần cách ly môi trường bổ sung, hãy thêm các
biến đó vào `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex
được tạo. OpenClaw loại bỏ `CODEX_HOME` và `HOME` khỏi danh sách này trong
quá trình chuẩn hóa khởi chạy cục bộ: `CODEX_HOME` vẫn trỏ đến phạm vi
agent hoặc người dùng đã chọn, còn `HOME` vẫn được kế thừa để các tiến trình con có thể sử dụng
trạng thái thông thường trong thư mục chính của người dùng.

### Công cụ động và tìm kiếm web

Các công cụ động của Codex mặc định sử dụng chế độ tải `searchable`. OpenClaw thường
không cung cấp các công cụ động trùng lặp với những thao tác không gian làm việc gốc của Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`get_goal`, `create_goal`, `update_goal`, `tool_call`, `tool_describe`,
`tool_search` và `tool_search_code`. Các thao tác mục tiêu vẫn thuộc Codex gốc,
vì vậy OpenClaw không chiếu một kho mục tiêu thứ hai vào các lượt Codex. Hầu hết
công cụ tích hợp OpenClaw còn lại, chẳng hạn như nhắn tin, phương tiện, cron,
trình duyệt, các node, Gateway và `heartbeat_respond`, đều khả dụng thông qua
tính năng tìm kiếm công cụ của Codex trong không gian tên `openclaw`, nhờ đó giảm kích thước
ngữ cảnh mô hình ban đầu. Phương án dự phòng shell cho lượt bị hạn chế là ngoại lệ đối với
`exec` và `process` khi danh sách cho phép hữu hạn vô hiệu hóa Code Mode gốc;
danh sách cho phép của runtime và `codexDynamicToolsExclude` vẫn được áp dụng.

Các công cụ được đánh dấu `catalogMode: "direct-only"`, bao gồm công cụ `computer`
của OpenClaw, sử dụng không gian tên `openclaw_direct`. Codex coi không gian tên đó
là `DirectModelOnly`, vì vậy các công cụ này vẫn hiển thị trực tiếp với mô hình trong các luồng
thông thường và chỉ dùng chế độ mã thay vì đi qua các lệnh gọi `tools.*` Code Mode lồng nhau.

Tìm kiếm web mặc định sử dụng công cụ `web_search` được lưu trữ của Codex khi tính năng tìm kiếm
được bật và không có nhà cung cấp được quản lý nào được chọn. Tìm kiếm lưu trữ gốc và
công cụ động `web_search` được quản lý của OpenClaw loại trừ lẫn nhau để
tìm kiếm được quản lý không thể bỏ qua các giới hạn miền gốc. OpenClaw sử dụng
công cụ được quản lý khi tìm kiếm lưu trữ không khả dụng, bị tắt rõ ràng hoặc
được thay thế bởi một nhà cung cấp được quản lý đã chọn. OpenClaw giữ phần mở rộng độc lập
`web.run` của Codex ở trạng thái tắt vì lưu lượng app-server trong môi trường sản xuất từ chối
không gian tên `web` do người dùng xác định của phần mở rộng này. `tools.web.search.enabled: false`
vô hiệu hóa cả hai đường dẫn, cũng như các lần chạy chỉ dùng LLM khi công cụ bị tắt. Codex coi
`"cached"` là một tùy chọn ưu tiên và phân giải nó thành quyền truy cập bên ngoài trực tiếp cho
các lượt app-server không bị hạn chế. Phương án dự phòng được quản lý tự động sẽ đóng khi gặp lỗi nếu
`allowedDomains` gốc được đặt, để không thể bỏ qua danh sách cho phép.
Các thay đổi lâu dài đối với chính sách tìm kiếm có hiệu lực sẽ luân chuyển luồng Codex đã liên kết
trước lượt tiếp theo; các giới hạn tạm thời theo từng lượt sử dụng một luồng
hạn chế tạm thời và giữ nguyên liên kết hiện có để tiếp tục sau đó.

`sessions_yield` và các phản hồi nguồn chỉ dùng công cụ tin nhắn vẫn được gửi trực tiếp vì
đó là các hợp đồng điều khiển lượt. `sessions_spawn` vẫn có thể tìm kiếm để
`spawn_agent` gốc của Codex tiếp tục là bề mặt subagent Codex chính,
trong khi việc ủy quyền rõ ràng qua OpenClaw hoặc ACP vẫn khả dụng thông qua
không gian tên công cụ động `openclaw`. Hướng dẫn cộng tác Heartbeat
yêu cầu Codex tìm kiếm `heartbeat_respond` trước khi kết thúc một lượt Heartbeat
khi công cụ chưa được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một
app-server Codex tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi
gỡ lỗi toàn bộ payload công cụ.

### Các trường cấu hình

Các trường plugin Codex cấp cao nhất được hỗ trợ:

| Trường                      | Mặc định        | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Sử dụng `"direct"` để đặt các công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Các tên công cụ động OpenClaw bổ sung cần loại khỏi các lượt app-server Codex.              |
| `codexPlugins`             | bị tắt       | Hỗ trợ plugin/ứng dụng Codex gốc cho các plugin tuyển chọn đã di chuyển và được cài đặt từ mã nguồn.           |
| `sessionCatalog`           | được bật        | Khám phá trên thanh bên cho các phiên Codex gốc trên Gateway này và các node đã ghép nối đủ điều kiện.   |
| `supervision`              | bị tắt       | Bản chép lời phiên gốc dành cho agent và chính sách kiểm soát ghi.                         |

Các trường `appServer` được hỗ trợ:

| Trường                                         | Mặc định                                                | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"unix"` được chỉ định rõ sẽ kết nối với socket điều khiển cục bộ; `"websocket"` kết nối với `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` cô lập trạng thái harness thông thường theo từng tác tử OpenClaw. `"user"` là tùy chọn tham gia rõ ràng, chia sẻ `$CODEX_HOME` hoặc `~/.codex` gốc, sử dụng xác thực gốc và bật tính năng quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng hỗ trợ stdio cục bộ hoặc phương thức truyền Unix. Đối với kết nối giám sát riêng biệt, giá trị chưa đặt được phân giải thành `"user"` cho stdio hoặc Unix và `"agent"` cho WebSocket.     |
| `command`                                     | tệp nhị phân Codex được quản lý                                   | Tệp thực thi cho phương thức truyền stdio. Để trống để sử dụng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Các đối số cho phương thức truyền stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | chưa đặt                                                  | URL App Server WebSocket hoặc URL `unix://`. Đường dẫn Unix được đặt rõ ràng nhưng để trống sẽ chọn socket điều khiển chính tắc trong thư mục chính của người dùng.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | chưa đặt                                                  | Bearer token cho phương thức truyền WebSocket. Chấp nhận chuỗi ký tự trực tiếp hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Các header WebSocket bổ sung. Giá trị header chấp nhận chuỗi ký tự trực tiếp hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Tên các biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw tạo môi trường kế thừa. OpenClaw giữ lại `CODEX_HOME` đã chọn và `HOME` được kế thừa cho các lần khởi chạy cục bộ.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Chọn sử dụng bề mặt công cụ chỉ dành cho chế độ mã của Codex. Các công cụ động OpenClaw thông thường vẫn khả dụng thông qua các lệnh gọi `tools.*` lồng nhau; các công cụ `openclaw_direct` vẫn hiển thị trực tiếp với mô hình.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | chưa đặt                                                  | Thư mục gốc không gian làm việc của app-server Codex từ xa. Khi được đặt, OpenClaw suy ra thư mục gốc không gian làm việc cục bộ từ không gian làm việc OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại bên dưới thư mục gốc từ xa này và chỉ gửi cwd cuối cùng của app-server tới Codex. Nếu cwd nằm ngoài thư mục gốc không gian làm việc OpenClaw đã phân giải, OpenClaw sẽ từ chối an toàn thay vì gửi đường dẫn cục bộ của Gateway tới app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển của app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng thời gian im lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server trong phạm vi lượt, trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Khoảng thời gian im lặng sau khi một mục trợ lý cuối cùng/không phải bình luận hoặc phần hoàn tất thô của trợ lý trước công cụ kích hoạt việc phát hành đầu ra của trợ lý, trong khi OpenClaw vẫn chờ `turn/completed`. Việc tăng giá trị này cho Codex thêm thời gian phát `turn/completed` trước khi OpenClaw ngắt và giải phóng làn phiên.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Cơ chế bảo vệ trạng thái hoàn tất-không hoạt động và tiến trình được dùng sau khi bàn giao cho công cụ, công cụ gốc hoàn tất, trợ lý thô có tiến trình sau công cụ, quá trình suy luận thô hoàn tất hoặc có tiến trình suy luận, trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho các khối lượng công việc đáng tin cậy hoặc nặng, khi quá trình tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành trợ lý cuối cùng một cách hợp lệ.                                |
| `mode`                                        | `"yolo"` trừ khi các yêu cầu Codex cục bộ không cho phép YOLO | Cấu hình sẵn cho việc thực thi YOLO hoặc thực thi được guardian review. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never` hoặc người review `user` sẽ khiến giá trị mặc định ngầm định là guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép       | Chính sách phê duyệt Codex gốc được gửi khi bắt đầu/tiếp tục luồng hoặc bắt đầu lượt. Các giá trị mặc định của guardian ưu tiên `"on-request"` khi được phép.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được phép  | Chế độ sandbox Codex gốc được gửi khi bắt đầu/tiếp tục luồng. Các giá trị mặc định của guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì dùng `"read-only"`. Khi sandbox OpenClaw đang hoạt động, các lượt `danger-full-access` sử dụng `workspace-write` của Codex với quyền truy cập mạng được suy ra từ cài đặt lưu lượng đi ra của sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` hoặc một người review guardian được phép               | Dùng `"auto_review"` để cho phép Codex review các lời nhắc phê duyệt gốc khi được phép, nếu không thì dùng `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                                                                                                                              |
| `serviceTier`                                 | chưa đặt                                                  | Cấp dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý linh hoạt, `null` xóa giá trị ghi đè và `"fast"` cũ được chấp nhận dưới dạng `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | đã tắt                                               | Chọn sử dụng mạng theo hồ sơ quyền của Codex cho các lệnh app-server. OpenClaw xác định cấu hình `permissions.<profile>.network` đã chọn và chọn cấu hình đó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn tham gia bản xem trước, đăng ký một môi trường Codex dựa trên sandbox OpenClaw với app-server Codex được hỗ trợ để quá trình thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                                            |

`appServer.networkProxy` là tùy chọn tường minh vì nó thay đổi hợp đồng sandbox của Codex. Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled`
và `default_permissions` trong cấu hình luồng Codex để hồ sơ
quyền được tạo có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw
tạo tên hồ sơ `openclaw-network-<fingerprint>` có khả năng chống xung đột
từ nội dung hồ sơ; chỉ sử dụng `profileName` khi cần một tên cục bộ ổn định.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Nếu runtime app-server thông thường là `danger-full-access`, việc bật
`networkProxy` sẽ sử dụng quyền truy cập hệ thống tệp theo kiểu không gian làm việc cho hồ sơ
quyền được tạo: cơ chế thực thi mạng do Codex quản lý là mạng
được sandbox, vì vậy hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi.
Các mục miền sử dụng `allow` hoặc `deny`; các mục socket Unix sử dụng các giá trị
`allow` hoặc `none` của Codex.

### Thời gian chờ của lệnh gọi công cụ động

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu `item/tool/call` của Codex mặc định sử dụng bộ giám sát
90 giây của OpenClaw. Đối số `timeoutMs` dương theo từng lệnh gọi
sẽ kéo dài hoặc rút ngắn ngân sách của công cụ cụ thể đó, với giới hạn tối đa là 600000 ms.
Công cụ `image_generate` sử dụng `agents.defaults.imageGenerationModel.timeoutMs`
khi lệnh gọi công cụ không cung cấp thời gian chờ riêng, nếu không thì sử dụng giá trị mặc định
120 giây cho việc tạo hình ảnh. Công cụ hiểu nội dung phương tiện `image`
sử dụng `tools.media.image.timeoutSeconds` hoặc giá trị mặc định 60 giây cho phương tiện; đối với
việc hiểu hình ảnh, thời gian chờ đó áp dụng cho chính yêu cầu và không bị
giảm bởi công việc chuẩn bị trước đó. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ khi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.
Bộ giám sát này là ngân sách `item/tool/call` động bên ngoài; thời gian chờ
yêu cầu dành riêng cho nhà cung cấp chạy bên trong lệnh gọi đó và giữ nguyên ngữ nghĩa thời gian chờ riêng.

Sau khi Codex chấp nhận một lượt và sau khi OpenClaw phản hồi một yêu cầu
app-server thuộc phạm vi lượt, bộ kiểm thử kỳ vọng Codex tiến hành lượt hiện tại
và cuối cùng kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server không có hoạt động trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
sẽ cố gắng ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ và
giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị
xếp hàng sau một lượt gốc đã lỗi thời. Hầu hết thông báo chưa kết thúc cho
cùng một lượt sẽ vô hiệu hóa bộ giám sát ngắn đó vì Codex đã chứng minh lượt
vẫn đang hoạt động.

Các lần bàn giao công cụ sử dụng ngân sách không hoạt động sau công cụ dài hơn: sau khi OpenClaw trả về một
phản hồi `item/tool/call`, sau khi các mục công cụ gốc như
`commandExecution` hoàn tất, sau các lần hoàn tất `custom_tool_call_output`
thô, cũng như sau tiến trình trợ lý thô sau công cụ, các lần hoàn tất suy luận
thô hoặc tiến trình suy luận. Cơ chế bảo vệ sử dụng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút trong các trường hợp khác; cùng ngân sách đó cũng kéo dài
bộ giám sát tiến trình cho khoảng thời gian tổng hợp im lặng trước khi Codex phát ra
sự kiện tiếp theo của lượt hiện tại. Các thông báo app-server toàn cục, chẳng hạn như
cập nhật giới hạn tốc độ, không đặt lại tiến trình không hoạt động của lượt. Các lần hoàn tất suy luận,
hoàn tất `agentMessage` dạng bình luận và tiến trình trợ lý hoặc suy luận thô
trước công cụ có thể được theo sau bởi phản hồi cuối cùng tự động, vì vậy chúng sử dụng
cơ chế bảo vệ phản hồi sau tiến trình thay vì giải phóng làn phiên
ngay lập tức.

Chỉ các mục `agentMessage` cuối cùng/không phải bình luận đã hoàn tất và các lần hoàn tất
trợ lý thô trước công cụ mới kích hoạt việc giải phóng đầu ra trợ lý: nếu sau đó Codex
không có hoạt động mà không có `turn/completed`, OpenClaw sẽ cố gắng ngắt lượt
gốc và giải phóng làn phiên. Nếu một bộ theo dõi lượt khác thắng cuộc đua
giải phóng đó, OpenClaw vẫn chấp nhận mục trợ lý cuối cùng đã hoàn tất khi không còn
yêu cầu gốc, mục hoặc lần hoàn tất công cụ động nào đang hoạt động và việc
giải phóng đầu ra trợ lý vẫn thuộc về mục hoàn tất gần nhất, mà không có
mục nào hoàn tất sau đó. Điều này có thể bảo toàn câu trả lời cuối cùng sau
công việc công cụ đã hoàn tất mà không phát lại lượt. Các delta trợ lý từng phần,
phản hồi cũ trước đó và các lần hoàn tất trống sau đó không đủ điều kiện.

Các lỗi app-server stdio an toàn khi phát lại, bao gồm thời gian chờ không hoạt động lúc hoàn tất lượt
mà không có bằng chứng về trợ lý, công cụ, mục đang hoạt động hoặc hiệu ứng phụ, sẽ
được thử lại một lần trong một lần thử app-server mới. Các trường hợp hết thời gian chờ không an toàn vẫn loại bỏ
ứng dụng khách app-server bị kẹt và giải phóng làn phiên OpenClaw; chúng cũng
xóa liên kết luồng gốc đã lỗi thời thay vì tự động
phát lại. Thời gian chờ của bộ theo dõi hoàn tất hiển thị văn bản thời gian chờ
dành riêng cho Codex: các trường hợp an toàn khi phát lại cho biết phản hồi có thể chưa hoàn chỉnh, còn các trường hợp không an toàn
yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại. Chẩn đoán thời gian chờ
công khai bao gồm các trường cấu trúc như phương thức thông báo app-server
gần nhất, id/loại/vai trò của mục phản hồi trợ lý thô, số lượng
yêu cầu/mục đang hoạt động và trạng thái bộ theo dõi đang được kích hoạt; khi thông báo gần nhất là một
mục phản hồi trợ lý thô, chúng cũng bao gồm bản xem trước văn bản trợ lý
có giới hạn. Chúng không bao gồm nội dung lời nhắc hoặc công cụ thô.

### Ghi đè môi trường kiểm thử cục bộ

- `OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
  `appServer.command` chưa được đặt.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Hãy sử dụng
`plugins.entries.codex.config.appServer.mode: "guardian"` thay thế, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các lần triển khai có thể lặp lại vì nó giữ hành vi plugin
trong cùng tệp đã được review với phần còn lại của thiết lập bộ kiểm thử Codex.

## Plugin Codex gốc

Khả năng hỗ trợ plugin Codex gốc sử dụng các khả năng ứng dụng và plugin
riêng của app-server Codex trong cùng luồng Codex với lượt của bộ kiểm thử OpenClaw. OpenClaw
không chuyển đổi các plugin Codex thành các công cụ động `codex_plugin_*` tổng hợp của OpenClaw.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn bộ kiểm thử Codex gốc.
Nó không ảnh hưởng đến các lần chạy bộ kiểm thử tích hợp sẵn, các lần chạy nhà cung cấp OpenAI thông thường, các liên kết
cuộc hội thoại ACP hoặc các bộ kiểm thử khác.

Cấu hình tối thiểu đã di chuyển:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Cấu hình ứng dụng luồng được tính khi OpenClaw thiết lập một phiên
bộ kiểm thử Codex hoặc thay thế liên kết luồng Codex đã lỗi thời; cấu hình này không được tính lại trong
mỗi lượt. Sau khi thay đổi `codexPlugins`, hãy sử dụng `/new`, `/reset` hoặc khởi động lại
Gateway để các phiên bộ kiểm thử Codex trong tương lai bắt đầu với tập ứng dụng
đã cập nhật.

Để biết điều kiện đủ để di chuyển, kho ứng dụng, chính sách hành động phá hủy,
các yêu cầu cung cấp thông tin và chẩn đoán plugin gốc, hãy xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

Quyền truy cập ứng dụng và plugin phía OpenAI được kiểm soát bởi tài khoản Codex
đã đăng nhập và, đối với các không gian làm việc Business và Enterprise/Edu, bởi các chế độ kiểm soát ứng dụng
của không gian làm việc. Xem
[Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
để biết tổng quan của OpenAI về tài khoản và chế độ kiểm soát không gian làm việc.

## Sử dụng máy tính

Sử dụng máy tính có hướng dẫn thiết lập riêng:
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use).

Tóm tắt: OpenClaw không đóng gói ứng dụng điều khiển máy tính để bàn hoặc tự thực thi
các hành động trên máy tính để bàn. Nó chuẩn bị app-server Codex, xác minh rằng máy chủ MCP
`computer-use` khả dụng, sau đó để Codex sở hữu các lệnh gọi
công cụ MCP gốc trong các lượt ở chế độ Codex.

## Ranh giới runtime

Bộ kiểm thử Codex chỉ thay đổi trình thực thi tác nhân nhúng cấp thấp.

- Các công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi
  các công cụ đó, vì vậy OpenClaw vẫn nằm trong đường dẫn thực thi.
- Các công cụ shell, bản vá, MCP và ứng dụng gốc của Codex do Codex sở hữu.
  OpenClaw có thể quan sát hoặc chặn các sự kiện gốc được chọn thông qua
  bộ chuyển tiếp được hỗ trợ, nhưng không viết lại các đối số công cụ gốc.
- Codex sở hữu Compaction gốc. OpenClaw duy trì một bản sao bản chép lời cho
  lịch sử kênh, tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc bộ kiểm thử
  trong tương lai, nhưng không thay thế Compaction của Codex bằng trình tóm tắt OpenClaw hoặc
  công cụ ngữ cảnh.
- Việc tạo phương tiện, hiểu nội dung phương tiện, TTS, phê duyệt và đầu ra
  công cụ nhắn tin tiếp tục thông qua các cài đặt nhà cung cấp/mô hình OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ bản chép lời do OpenClaw sở hữu,
  không áp dụng cho các bản ghi kết quả công cụ gốc của Codex.

Để biết các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng
hàng đợi, cơ chế tải phản hồi Codex lên và chi tiết về Compaction, hãy xem
[Runtime bộ kiểm thử Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** đây là hành vi dự kiến đối với
cấu hình mới. Chọn một mô hình `openai/gpt-*`, bật
`plugins.entries.codex.enabled` và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw sử dụng bộ kiểm thử tích hợp sẵn thay vì Codex:** xác nhận tuyến hiệu lực
là tuyến Platform Responses hoặc ChatGPT Responses HTTPS chính thức chính xác,
không có ghi đè yêu cầu do người dùng tạo, đồng thời plugin Codex đã được cài đặt và
bật. Chỉ tiền tố `openai/gpt-*` là chưa đủ. Để có bằng chứng nghiêm ngặt khi
kiểm thử, hãy đặt `agentRuntime.id: "codex"` cho nhà cung cấp hoặc mô hình; Codex bắt buộc sẽ thất bại
thay vì dự phòng khi tuyến hoặc bộ kiểm thử không tương thích.

**Runtime OpenAI Codex dự phòng sang đường dẫn khóa API:** thu thập một đoạn trích
Gateway đã được ẩn thông tin nhạy cảm, trong đó hiển thị mô hình, runtime, nhà cung cấp đã chọn và
lỗi. Yêu cầu các cộng tác viên bị ảnh hưởng chạy lệnh chỉ đọc này trên máy chủ
OpenClaw của họ:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Các đoạn trích hữu ích thường bao gồm `openai/gpt-5.6-sol` hoặc `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` hoặc `harnessRuntime`,
`candidateProvider: "openai"` và kết quả `401`, `Incorrect API key` hoặc
`No API key`. Một lần chạy đã sửa phải hiển thị đường dẫn OAuth OpenAI
thay vì lỗi khóa API OpenAI thuần túy.

**Cấu hình tham chiếu mô hình Codex cũ vẫn còn:** chạy `openclaw doctor --fix`.
Doctor viết lại các tham chiếu mô hình cũ thành `openai/*`, loại bỏ các ghim runtime phiên và
toàn bộ agent đã lỗi thời, đồng thời giữ nguyên các ghi đè hồ sơ xác thực hiện có.

**App-server bị từ chối:** sử dụng app-server Codex ổn định từ `0.143.0`
thông qua `0.144.6` đi kèm. Các bản phát hành trước, phiên bản có hậu tố bản dựng và các bản phát hành
mới hơn chưa được xác thực đều bị từ chối vì OpenClaw xác thực các schema được tạo
dựa trên phiên bản app-server đi kèm.

**`/codex status` không thể kết nối:** kiểm tra xem Plugin `codex`
đã được bật chưa, `plugins.allow` có bao gồm Plugin đó khi danh sách cho phép
được cấu hình hay không, và mọi `appServer.command`, `url`, `authToken` tùy chỉnh hoặc
header có hợp lệ hay không.

**App-server Codex sử dụng quá nhiều bộ nhớ:** trước tiên hãy phân biệt hai tiến trình.
OpenClaw chạy app-server Codex cục bộ dưới dạng một tiến trình con Rust riêng biệt.
`NODE_OPTIONS=--max-old-space-size=...` chỉ thay đổi heap V8 Node.js của Gateway;
nó không giới hạn hoặc mở rộng Codex. Các bản cài đặt Gateway được quản lý đã chọn
heap V8 thích ứng, và việc tăng heap có thể khiến Codex còn ít bộ nhớ máy chủ hơn. Sử dụng
[khắc phục sự cố bộ nhớ Gateway](/vi/gateway/troubleshooting#gateway-exits-during-high-memory-use)
khi Gateway chịu áp lực, đồng thời kiểm tra bộ nhớ máy chủ hoặc container dành cho tiến trình con Codex.

Codex đi kèm không có giới hạn heap hoặc RSS và không có độ trễ dỡ tải khi nhàn rỗi
có thể cấu hình. Sau khi máy khách cuối cùng hủy đăng ký, một luồng không hoạt động có thể vẫn được tải
trong tối đa 30 phút. Trên các máy chủ có tài nguyên hạn chế, hãy giảm mức phân nhánh subagent Codex gốc
trước khi tăng heap Gateway:

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            args: ["-c", "agents.max_threads=3", "app-server", "--listen", "stdio://"],
          },
        },
      },
    },
  },
}
```

Thiết lập đó giới hạn các luồng con gốc cho backend đa agent mặc định
của Codex đi kèm. Nếu bạn bật rõ ràng Codex đa agent v2, hãy sử dụng
`features.multi_agent_v2.max_concurrent_threads_per_session=3` thay thế; giới hạn v2
bao gồm luồng gốc và không thể kết hợp với `agents.max_threads`.
Để tăng dung lượng khả dụng cho Codex, hãy tăng mức phân bổ bộ nhớ của máy chủ, container hoặc cgroup.
Giới hạn cứng của hệ điều hành có thể chấm dứt Codex thay vì tạo áp lực ngược.

**Quá trình khám phá mô hình chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt tính năng khám phá.
Xem [tài liệu tham khảo harness Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, các header và đảm bảo app-server từ xa sử dụng cùng phiên bản giao thức
app-server Codex. Truyền tải WebSocket của Codex vẫn đang trong giai đoạn thử nghiệm
và không được hỗ trợ; ưu tiên stdio được quản lý hoặc socket điều khiển Unix cục bộ.

**Các công cụ shell hoặc bản vá gốc bị chặn với `Native hook relay
unavailable`:** luồng Codex vẫn đang cố sử dụng một id chuyển tiếp hook gốc
mà OpenClaw không còn đăng ký. Đây là sự cố truyền tải hook Codex gốc,
không phải lỗi backend ACP, nhà cung cấp, GitHub hay lệnh shell.
Bắt đầu một phiên mới trong cuộc trò chuyện bị ảnh hưởng bằng `/new` hoặc `/reset`,
sau đó thử lại một lệnh vô hại. Nếu lệnh đó hoạt động một lần nhưng lần gọi công cụ gốc
tiếp theo lại thất bại, chỉ coi `/new` là giải pháp tạm thời: sao chép
lời nhắc vào một phiên mới sau khi khởi động lại app-server Codex hoặc
Gateway OpenClaw để các luồng cũ bị loại bỏ và các đăng ký hook gốc
được tạo lại.

**Các lệnh gọi công cụ Codex tạo quá nhiều tiến trình hook tồn tại trong thời gian ngắn:** đặt
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
và khởi động lại Gateway. Thao tác này chỉ tắt tiến trình con `PreToolUse` của Codex
được dùng để phát hiện vòng lặp OpenClaw và dấu hiệu không có chính sách của tiến trình đó. Các chuyển tiếp
`before_tool_call` bắt buộc và chính sách công cụ đáng tin cậy vẫn được bật.

**Một mô hình không phải Codex sử dụng harness tích hợp:** đây là hành vi dự kiến, trừ khi chính sách runtime
của nhà cung cấp hoặc mô hình định tuyến mô hình đó sang một harness khác. Các tham chiếu nhà cung cấp
không phải OpenAI thuần túy vẫn đi theo đường dẫn nhà cung cấp thông thường trong chế độ `auto`.

**Computer Use đã được cài đặt nhưng các công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu công cụ báo cáo
`Native hook relay unavailable`, hãy sử dụng quy trình khôi phục chuyển tiếp hook gốc ở trên.
Xem [Computer Use của Codex](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tài liệu tham khảo harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Giám sát Codex](/vi/plugins/codex-supervision)
- [Các Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Computer Use của Codex](/vi/plugins/codex-computer-use)
- [Các runtime agent](/vi/concepts/agent-runtimes)
- [Các nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trợ giúp OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Các Plugin harness agent](/vi/plugins/sdk-agent-harness)
- [Các hook Plugin](/vi/plugins/hooks)
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
