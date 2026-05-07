---
read_when:
    - Thêm các tính năng mở rộng quyền truy cập hoặc tự động hóa
summary: Các cân nhắc về bảo mật và mô hình mối đe dọa khi chạy Gateway AI có quyền truy cập shell
title: Bảo mật
x-i18n:
    generated_at: "2026-05-07T13:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8706977504b52a225c08deadeddb60ac6791933297637d41885d0b859ca28406
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Mô hình tin cậy của trợ lý cá nhân.** Hướng dẫn này giả định mỗi gateway có một ranh giới
  người vận hành đáng tin cậy (mô hình một người dùng, trợ lý cá nhân).
  OpenClaw **không** phải là ranh giới bảo mật đa thuê bao đối nghịch cho nhiều
  người dùng đối nghịch cùng chia sẻ một agent hoặc gateway. Nếu bạn cần vận hành với
  mức độ tin cậy hỗn hợp hoặc người dùng đối nghịch, hãy tách các ranh giới tin cậy (gateway +
  thông tin xác thực riêng, lý tưởng là người dùng hệ điều hành hoặc host riêng).
</Warning>

## Phạm vi trước tiên: mô hình bảo mật trợ lý cá nhân

Hướng dẫn bảo mật OpenClaw giả định một triển khai **trợ lý cá nhân**: một ranh giới người vận hành đáng tin cậy, có thể có nhiều agent.

- Tư thế bảo mật được hỗ trợ: một người dùng/ranh giới tin cậy cho mỗi gateway (ưu tiên một người dùng hệ điều hành/host/VPS cho mỗi ranh giới).
- Không phải ranh giới bảo mật được hỗ trợ: một gateway/agent dùng chung bởi những người dùng không tin cậy lẫn nhau hoặc đối nghịch.
- Nếu cần cô lập người dùng đối nghịch, hãy tách theo ranh giới tin cậy (gateway + thông tin xác thực riêng, và lý tưởng là người dùng/host hệ điều hành riêng).
- Nếu nhiều người dùng không tin cậy có thể nhắn tin cho một agent có bật công cụ, hãy coi họ như cùng chia sẻ thẩm quyền công cụ được ủy quyền cho agent đó.

Trang này giải thích cách gia cố **trong mô hình đó**. Trang này không tuyên bố cô lập đa thuê bao đối nghịch trên một gateway dùng chung.

## Kiểm tra nhanh: `openclaw security audit`

Xem thêm: [Xác minh hình thức (Mô hình bảo mật)](/vi/security/formal-verification)

Chạy lệnh này thường xuyên (đặc biệt sau khi thay đổi cấu hình hoặc mở các bề mặt mạng):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` được giữ có chủ đích ở phạm vi hẹp: nó chuyển các chính sách nhóm mở phổ biến
sang allowlist, khôi phục `logging.redactSensitive: "tools"`, siết chặt
quyền đối với state/config/include-file, và dùng đặt lại ACL của Windows thay vì
POSIX `chmod` khi chạy trên Windows.

Nó gắn cờ các lỗi cấu hình phổ biến (phơi lộ xác thực Gateway, phơi lộ điều khiển trình duyệt, allowlist nâng quyền, quyền hệ thống tệp, phê duyệt exec quá rộng, và phơi lộ công cụ qua kênh mở).

OpenClaw vừa là sản phẩm vừa là thử nghiệm: bạn đang nối hành vi của mô hình frontier vào các bề mặt nhắn tin thật và công cụ thật. **Không có thiết lập nào "an toàn tuyệt đối".** Mục tiêu là chủ động cân nhắc:

- ai có thể nói chuyện với bot của bạn
- bot được phép hành động ở đâu
- bot có thể chạm vào những gì

Bắt đầu với mức truy cập nhỏ nhất vẫn hoạt động, rồi mở rộng khi bạn tự tin hơn.

### Triển khai và độ tin cậy của host

OpenClaw giả định ranh giới host và cấu hình là đáng tin cậy:

- Nếu ai đó có thể sửa đổi state/config của host Gateway (`~/.openclaw`, bao gồm `openclaw.json`), hãy coi họ là người vận hành đáng tin cậy.
- Chạy một Gateway cho nhiều người vận hành không tin cậy lẫn nhau/đối nghịch **không phải là thiết lập được khuyến nghị**.
- Với các nhóm có mức độ tin cậy hỗn hợp, hãy tách ranh giới tin cậy bằng các gateway riêng (hoặc tối thiểu là người dùng/host hệ điều hành riêng).
- Mặc định được khuyến nghị: một người dùng trên mỗi máy/host (hoặc VPS), một gateway cho người dùng đó, và một hoặc nhiều agent trong gateway đó.
- Bên trong một phiên bản Gateway, quyền truy cập của người vận hành đã xác thực là vai trò control-plane đáng tin cậy, không phải vai trò tenant theo từng người dùng.
- Định danh phiên (`sessionKey`, ID phiên, nhãn) là bộ chọn định tuyến, không phải token ủy quyền.
- Nếu nhiều người có thể nhắn tin cho một agent có bật công cụ, mỗi người trong số họ có thể điều hướng cùng một tập quyền đó. Cô lập phiên/bộ nhớ theo người dùng giúp bảo vệ quyền riêng tư, nhưng không biến một agent dùng chung thành ủy quyền host theo từng người dùng.

### Thao tác tệp an toàn

OpenClaw dùng `@openclaw/fs-safe` cho truy cập tệp giới hạn theo root, ghi nguyên tử, trích xuất archive, workspace tạm, và helper tệp bí mật. OpenClaw mặc định tắt helper Python POSIX tùy chọn của fs-safe; chỉ đặt `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` hoặc `require` khi bạn muốn tăng cường đột biến fd-relative bổ sung và có thể hỗ trợ runtime Python.

Chi tiết: [Thao tác tệp an toàn](/vi/gateway/security/secure-file-operations).

### Workspace Slack dùng chung: rủi ro thật

Nếu "mọi người trong Slack đều có thể nhắn tin cho bot", rủi ro cốt lõi là thẩm quyền công cụ được ủy quyền:

- bất kỳ người gửi được cho phép nào cũng có thể kích hoạt lệnh gọi công cụ (`exec`, trình duyệt, công cụ mạng/tệp) trong phạm vi chính sách của agent;
- tiêm prompt/nội dung từ một người gửi có thể gây ra hành động ảnh hưởng đến state, thiết bị hoặc đầu ra dùng chung;
- nếu một agent dùng chung có thông tin xác thực/tệp nhạy cảm, bất kỳ người gửi được cho phép nào cũng có thể có khả năng điều khiển việc rò rỉ dữ liệu thông qua sử dụng công cụ.

Dùng agent/gateway riêng với công cụ tối thiểu cho quy trình làm việc nhóm; giữ agent chứa dữ liệu cá nhân ở chế độ riêng tư.

### Agent dùng chung trong công ty: mẫu chấp nhận được

Điều này chấp nhận được khi mọi người dùng agent đó nằm trong cùng một ranh giới tin cậy (ví dụ một nhóm công ty) và agent được giới hạn nghiêm ngặt trong phạm vi công việc.

- chạy nó trên một máy/VM/container chuyên dụng;
- dùng một người dùng hệ điều hành chuyên dụng + trình duyệt/hồ sơ/tài khoản chuyên dụng cho runtime đó;
- không đăng nhập runtime đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình quản lý mật khẩu/trình duyệt cá nhân.

Nếu bạn trộn danh tính cá nhân và công ty trên cùng một runtime, bạn làm sụp đổ sự tách biệt và tăng rủi ro phơi lộ dữ liệu cá nhân.

## Khái niệm tin cậy Gateway và Node

Hãy coi Gateway và Node là một miền tin cậy của người vận hành, với các vai trò khác nhau:

- **Gateway** là control plane và bề mặt chính sách (`gateway.auth`, chính sách công cụ, định tuyến).
- **Node** là bề mặt thực thi từ xa được ghép cặp với Gateway đó (lệnh, hành động thiết bị, khả năng cục bộ của host).
- Một caller đã xác thực với Gateway được tin cậy ở phạm vi Gateway. Sau khi ghép cặp, các hành động của Node là hành động của người vận hành đáng tin cậy trên Node đó.
- Các cấp phạm vi của người vận hành và kiểm tra tại thời điểm phê duyệt được tóm tắt trong
  [Phạm vi người vận hành](/vi/gateway/operator-scopes).
- Các client backend local loopback trực tiếp được xác thực bằng token/mật khẩu gateway
  dùng chung có thể thực hiện RPC control-plane nội bộ mà không cần xuất trình danh tính
  thiết bị người dùng. Đây không phải là cách vượt ghép cặp từ xa hoặc trình duyệt: client mạng,
  client Node, client token thiết bị, và danh tính thiết bị rõ ràng
  vẫn đi qua ghép cặp và thực thi nâng cấp phạm vi.
- `sessionKey` là lựa chọn định tuyến/ngữ cảnh, không phải xác thực theo từng người dùng.
- Phê duyệt exec (allowlist + hỏi) là lan can cho ý định của người vận hành, không phải cô lập đa thuê bao đối nghịch.
- Mặc định sản phẩm của OpenClaw cho thiết lập một người vận hành đáng tin cậy là cho phép host exec trên `gateway`/`node` mà không cần prompt phê duyệt (`security="full"`, `ask="off"` trừ khi bạn siết chặt). Mặc định đó là UX có chủ đích, tự nó không phải là lỗ hổng.
- Phê duyệt exec ràng buộc ngữ cảnh yêu cầu chính xác và các toán hạng tệp cục bộ trực tiếp theo nỗ lực tốt nhất; chúng không mô hình hóa về mặt ngữ nghĩa mọi đường dẫn loader runtime/interpreter. Hãy dùng sandboxing và cô lập host để có ranh giới mạnh.

Nếu bạn cần cô lập người dùng đối nghịch, hãy tách ranh giới tin cậy theo người dùng/host hệ điều hành và chạy các gateway riêng.

## Ma trận ranh giới tin cậy

Dùng bảng này làm mô hình nhanh khi phân loại rủi ro:

| Ranh giới hoặc kiểm soát                                 | Ý nghĩa                                           | Cách hiểu sai phổ biến                                                         |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Xác thực caller tới API gateway                  | "Cần chữ ký theo từng tin nhắn trên mọi frame để bảo mật"                     |
| `sessionKey`                                              | Khóa định tuyến để chọn ngữ cảnh/phiên           | "Khóa phiên là ranh giới xác thực người dùng"                                 |
| Lan can prompt/nội dung                                   | Giảm rủi ro lạm dụng mô hình                     | "Chỉ riêng prompt injection đã chứng minh bypass xác thực"                    |
| `canvas.eval` / browser evaluate                          | Khả năng có chủ đích của người vận hành khi bật  | "Bất kỳ primitive JS eval nào cũng tự động là lỗ hổng trong mô hình tin cậy này" |
| Shell `!` TUI cục bộ                                      | Thực thi cục bộ được người vận hành kích hoạt rõ ràng | "Lệnh tiện ích shell cục bộ là tiêm từ xa"                                |
| Ghép cặp Node và lệnh Node                                | Thực thi từ xa cấp người vận hành trên thiết bị đã ghép cặp | "Điều khiển thiết bị từ xa mặc định nên được coi là truy cập của người dùng không tin cậy" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Chính sách đăng ký Node trên mạng đáng tin cậy do người dùng chọn bật | "Allowlist mặc định tắt là lỗ hổng ghép cặp tự động"       |

## Không phải lỗ hổng theo thiết kế

<Accordion title="Các phát hiện phổ biến nằm ngoài phạm vi">

Các mẫu này thường được báo cáo và thường được đóng mà không cần hành động trừ khi
chứng minh được một bypass ranh giới thật:

- Chuỗi chỉ dựa trên prompt injection mà không có bypass chính sách, xác thực hoặc sandbox.
- Tuyên bố giả định vận hành đa thuê bao đối nghịch trên một host hoặc
  cấu hình dùng chung.
- Tuyên bố phân loại quyền truy cập đọc bình thường của người vận hành (ví dụ
  `sessions.list` / `sessions.preview` / `chat.history`) là IDOR trong một
  thiết lập gateway dùng chung.
- Phát hiện triển khai chỉ trên localhost (ví dụ HSTS trên một gateway
  chỉ local loopback).
- Phát hiện chữ ký Webhook inbound của Discord cho các đường dẫn inbound không
  tồn tại trong repo này.
- Báo cáo coi metadata ghép cặp Node như một lớp phê duyệt thứ hai ẩn theo từng lệnh
  cho `system.run`, trong khi ranh giới thực thi thực tế vẫn là
  chính sách lệnh Node toàn cục của gateway cộng với phê duyệt exec riêng
  của Node.
- Báo cáo coi `gateway.nodes.pairing.autoApproveCidrs` đã cấu hình là một
  lỗ hổng tự thân. Thiết lập này mặc định tắt, yêu cầu
  mục CIDR/IP rõ ràng, chỉ áp dụng cho lần ghép cặp đầu tiên `role: node` với
  không phạm vi được yêu cầu, và không tự động phê duyệt operator/browser/Control UI,
  WebChat, nâng cấp vai trò, nâng cấp phạm vi, thay đổi metadata, thay đổi khóa công khai,
  hoặc đường dẫn header trusted-proxy local loopback cùng host trừ khi xác thực trusted-proxy local loopback đã được bật rõ ràng.
- Phát hiện "thiếu ủy quyền theo từng người dùng" coi `sessionKey` là một
  token xác thực.

</Accordion>

## Baseline gia cố trong 60 giây

Dùng baseline này trước, rồi bật lại có chọn lọc các công cụ cho mỗi agent đáng tin cậy:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Cấu hình này giữ Gateway chỉ cục bộ, cô lập DM, và mặc định tắt các công cụ control-plane/runtime.

## Quy tắc nhanh cho hộp thư đến dùng chung

Nếu nhiều hơn một người có thể DM bot của bạn:

- Đặt `session.dmScope: "per-channel-peer"` (hoặc `"per-account-channel-peer"` cho kênh nhiều tài khoản).
- Giữ `dmPolicy: "pairing"` hoặc allowlist nghiêm ngặt.
- Không bao giờ kết hợp DM dùng chung với quyền truy cập công cụ rộng.
- Điều này gia cố hộp thư đến hợp tác/dùng chung, nhưng không được thiết kế để cô lập đồng thuê bao đối nghịch khi người dùng chia sẻ quyền ghi host/config.

## Mô hình hiển thị ngữ cảnh

OpenClaw tách hai khái niệm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt agent (`dmPolicy`, `groupPolicy`, allowlist, cổng nhắc đến).
- **Hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được chèn vào đầu vào mô hình (nội dung trả lời, văn bản được trích dẫn, lịch sử thread, metadata chuyển tiếp).

Allowlist kiểm soát kích hoạt và ủy quyền lệnh. Thiết lập `contextVisibility` kiểm soát cách lọc ngữ cảnh bổ sung (trả lời được trích dẫn, gốc thread, lịch sử đã fetch):

- `contextVisibility: "all"` (mặc định) giữ ngữ cảnh bổ sung đúng như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung để chỉ gửi từ những người gửi được các kiểm tra allowlist đang hoạt động cho phép.
- `contextVisibility: "allowlist_quote"` hoạt động giống `allowlist`, nhưng vẫn giữ một phản hồi được trích dẫn rõ ràng.

Đặt `contextVisibility` theo từng kênh hoặc từng phòng/cuộc trò chuyện. Xem [Trò chuyện nhóm](/vi/channels/groups#context-visibility-and-allowlists) để biết chi tiết thiết lập.

Hướng dẫn phân loại cảnh báo:

- Các tuyên bố chỉ cho thấy "mô hình có thể thấy văn bản được trích dẫn hoặc văn bản lịch sử từ người gửi không có trong allowlist" là các phát hiện tăng cường có thể xử lý bằng `contextVisibility`, tự thân chúng không phải là vượt qua ranh giới auth hoặc sandbox.
- Để có tác động bảo mật, báo cáo vẫn cần chứng minh việc vượt qua ranh giới tin cậy (auth, chính sách, sandbox, phê duyệt hoặc một ranh giới đã được ghi lại khác).

## Nội dung kiểm tra của bản kiểm tra (mức cao)

- **Truy cập đầu vào** (chính sách DM, chính sách nhóm, allowlist): người lạ có thể kích hoạt bot không?
- **Phạm vi tác động của công cụ** (công cụ có quyền nâng cao + phòng mở): prompt injection có thể biến thành hành động shell/tệp/mạng không?
- **Độ lệch phê duyệt exec** (`security=full`, `autoAllowSkills`, allowlist trình thông dịch không có `strictInlineEval`): các hàng rào host-exec có còn hoạt động như bạn nghĩ không?
  - `security="full"` là cảnh báo tư thế rộng, không phải bằng chứng về lỗi. Đây là mặc định được chọn cho các thiết lập trợ lý cá nhân đáng tin cậy; chỉ siết chặt khi mô hình mối đe dọa của bạn cần hàng rào phê duyệt hoặc allowlist.
- **Phơi bày mạng** (bind/auth của Gateway, Tailscale Serve/Funnel, token auth yếu/ngắn).
- **Phơi bày điều khiển trình duyệt** (node từ xa, cổng relay, endpoint CDP từ xa).
- **Vệ sinh ổ đĩa cục bộ** (quyền, symlink, config includes, đường dẫn "thư mục được đồng bộ").
- **Plugin** (plugin tải mà không có allowlist rõ ràng).
- **Độ lệch chính sách/cấu hình sai** (cài đặt sandbox docker đã được cấu hình nhưng chế độ sandbox đang tắt; mẫu `gateway.nodes.denyCommands` không hiệu lực vì khớp chỉ theo đúng tên lệnh (ví dụ `system.run`) và không kiểm tra văn bản shell; mục `gateway.nodes.allowCommands` nguy hiểm; `tools.profile="minimal"` toàn cục bị ghi đè bởi hồ sơ theo từng agent; công cụ do plugin sở hữu có thể truy cập dưới chính sách công cụ cho phép rộng).
- **Độ lệch kỳ vọng runtime** (ví dụ giả định exec ngầm định vẫn có nghĩa là `sandbox` khi `tools.exec.host` giờ mặc định là `auto`, hoặc đặt rõ `tools.exec.host="sandbox"` trong khi chế độ sandbox đang tắt).
- **Vệ sinh mô hình** (cảnh báo khi mô hình đã cấu hình có vẻ cũ; không phải chặn cứng).

Nếu bạn chạy `--deep`, OpenClaw cũng cố gắng thăm dò Gateway trực tiếp theo nỗ lực tốt nhất.

## Bản đồ lưu trữ thông tin xác thực

Dùng phần này khi kiểm tra quyền truy cập hoặc quyết định cần sao lưu gì:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env hoặc `channels.telegram.tokenFile` (chỉ tệp thường; symlink bị từ chối)
- **Token bot Discord**: config/env hoặc SecretRef (nhà cung cấp env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ auth mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Trạng thái runtime Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Payload bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`

## Danh sách kiểm tra kiểm tra bảo mật

Khi bản kiểm tra in ra phát hiện, hãy xử lý theo thứ tự ưu tiên này:

1. **Bất kỳ thứ gì "mở" + công cụ được bật**: khóa DM/nhóm trước (ghép nối/allowlist), rồi siết chặt chính sách công cụ/sandboxing.
2. **Phơi bày mạng công khai** (bind LAN, Funnel, thiếu auth): sửa ngay.
3. **Phơi bày điều khiển trình duyệt từ xa**: xử lý như quyền truy cập của người vận hành (chỉ tailnet, ghép nối node có chủ ý, tránh phơi bày công khai).
4. **Quyền**: đảm bảo trạng thái/config/thông tin xác thực/auth không thể đọc bởi nhóm/mọi người.
5. **Plugin**: chỉ tải những gì bạn tin cậy rõ ràng.
6. **Lựa chọn mô hình**: ưu tiên các mô hình hiện đại, được gia cố theo chỉ dẫn cho mọi bot có công cụ.

## Thuật ngữ kiểm tra bảo mật

Mỗi phát hiện kiểm tra được khóa bằng một `checkId` có cấu trúc (ví dụ
`gateway.bind_no_auth` hoặc `tools.exec.security_full_configured`). Các lớp
mức độ nghiêm trọng thường gặp:

- `fs.*` - quyền hệ thống tệp trên trạng thái, config, thông tin xác thực, hồ sơ auth.
- `gateway.*` - chế độ bind, auth, Tailscale, Giao diện Điều khiển, thiết lập trusted-proxy.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - tăng cường theo từng bề mặt.
- `plugins.*`, `skills.*` - chuỗi cung ứng plugin/skill và phát hiện quét.
- `security.exposure.*` - kiểm tra xuyên suốt nơi chính sách truy cập gặp phạm vi tác động của công cụ.

Xem danh mục đầy đủ với mức độ nghiêm trọng, khóa sửa lỗi và hỗ trợ tự động sửa tại
[Kiểm tra kiểm tra bảo mật](/vi/gateway/security/audit-checks).

## Giao diện Điều khiển qua HTTP

Giao diện Điều khiển cần một **ngữ cảnh bảo mật** (HTTPS hoặc localhost) để tạo danh tính
thiết bị. `gateway.controlUi.allowInsecureAuth` là một công tắc tương thích cục bộ:

- Trên localhost, nó cho phép auth Giao diện Điều khiển không cần danh tính thiết bị khi trang
  được tải qua HTTP không bảo mật.
- Nó không vượt qua kiểm tra ghép nối.
- Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

Ưu tiên HTTPS (Tailscale Serve) hoặc mở UI trên `127.0.0.1`.

Chỉ dành cho tình huống khẩn cấp, `gateway.controlUi.dangerouslyDisableDeviceAuth`
tắt hoàn toàn kiểm tra danh tính thiết bị. Đây là một sự hạ cấp bảo mật nghiêm trọng;
hãy tắt nó trừ khi bạn đang chủ động gỡ lỗi và có thể hoàn nguyên nhanh chóng.

Tách biệt với các cờ nguy hiểm đó, `gateway.auth.mode: "trusted-proxy"` thành công
có thể cho phép phiên Giao diện Điều khiển của **người vận hành** mà không cần danh tính thiết bị. Đó là
hành vi auth-mode có chủ ý, không phải lối tắt `allowInsecureAuth`, và nó vẫn
không mở rộng đến phiên Giao diện Điều khiển với vai trò node.

`openclaw security audit` cảnh báo khi cài đặt này được bật.

## Tóm tắt cờ không an toàn hoặc nguy hiểm

`openclaw security audit` phát sinh `config.insecure_or_dangerous_flags` khi
các công tắc gỡ lỗi không an toàn/nguy hiểm đã biết được bật. Không đặt các công tắc này trong
production.

<AccordionGroup>
  <Accordion title="Các cờ hiện được bản kiểm tra theo dõi">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Tất cả khóa `dangerous*` / `dangerously*` trong schema config">
    Giao diện Điều khiển và trình duyệt:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Khớp tên kênh (kênh tích hợp sẵn và kênh plugin; cũng có sẵn theo từng
    `accounts.<accountId>` khi áp dụng):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (kênh plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (kênh plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (kênh plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (kênh plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (kênh plugin)

    Phơi bày mạng:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (cũng theo từng tài khoản)

    Sandbox Docker (mặc định + theo từng agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Cấu hình reverse proxy

Nếu bạn chạy Gateway phía sau reverse proxy (nginx, Caddy, Traefik, v.v.), hãy cấu hình
`gateway.trustedProxies` để xử lý IP máy khách được chuyển tiếp đúng cách.

Khi Gateway phát hiện header proxy từ một địa chỉ **không** nằm trong `trustedProxies`, nó sẽ **không** xem các kết nối là máy khách cục bộ. Nếu gateway auth bị tắt, các kết nối đó sẽ bị từ chối. Điều này ngăn việc vượt qua xác thực khi các kết nối qua proxy nếu không sẽ có vẻ đến từ localhost và nhận được tin cậy tự động.

`gateway.trustedProxies` cũng cấp dữ liệu cho `gateway.auth.mode: "trusted-proxy"`, nhưng chế độ auth đó nghiêm ngặt hơn:

- trusted-proxy auth **mặc định thất bại đóng trên proxy có nguồn loopback**
- reverse proxy loopback cùng máy chủ có thể dùng `gateway.trustedProxies` để phát hiện máy khách cục bộ và xử lý IP được chuyển tiếp
- reverse proxy loopback cùng máy chủ chỉ có thể thỏa mãn `gateway.auth.mode: "trusted-proxy"` khi `gateway.auth.trustedProxy.allowLoopback = true`; nếu không hãy dùng auth bằng token/mật khẩu

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Khi `trustedProxies` được cấu hình, Gateway dùng `X-Forwarded-For` để xác định IP máy khách. `X-Real-IP` mặc định bị bỏ qua trừ khi `gateway.allowRealIpFallback: true` được đặt rõ ràng.

Header trusted proxy không tự động làm cho ghép nối thiết bị node trở nên đáng tin cậy.
`gateway.nodes.pairing.autoApproveCidrs` là một chính sách người vận hành riêng, mặc định bị tắt.
Ngay cả khi được bật, các đường dẫn header trusted-proxy có nguồn loopback
bị loại khỏi tự động phê duyệt node vì trình gọi cục bộ có thể giả mạo các
header đó, bao gồm cả khi trusted-proxy auth loopback được bật rõ ràng.

Hành vi reverse proxy tốt (ghi đè header chuyển tiếp đến):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Hành vi reverse proxy xấu (nối/giữ lại header chuyển tiếp không tin cậy):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Ghi chú về HSTS và origin

- OpenClaw gateway ưu tiên cục bộ/local loopback. Nếu bạn kết thúc TLS tại reverse proxy, hãy đặt HSTS trên miền HTTPS hướng proxy ở đó.
- Nếu gateway tự kết thúc HTTPS, bạn có thể đặt `gateway.http.securityHeaders.strictTransportSecurity` để phát header HSTS từ phản hồi OpenClaw.
- Hướng dẫn triển khai chi tiết nằm trong [Trusted Proxy Auth](/vi/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Với các triển khai Giao diện Điều khiển không phải loopback, `gateway.controlUi.allowedOrigins` là bắt buộc theo mặc định.
- `gateway.controlUi.allowedOrigins: ["*"]` là chính sách browser-origin cho phép tất cả rõ ràng, không phải mặc định được gia cố. Tránh dùng nó ngoài kiểm thử cục bộ được kiểm soát chặt chẽ.
- Lỗi auth browser-origin trên loopback vẫn bị giới hạn tốc độ ngay cả khi
  miễn trừ loopback chung được bật, nhưng khóa khóa tạm thời được giới hạn theo từng
  giá trị `Origin` đã chuẩn hóa thay vì một bucket localhost dùng chung.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin theo Host-header; hãy xem nó là một chính sách nguy hiểm do người vận hành chọn.
- Xem DNS rebinding và hành vi header proxy-host là các mối quan tâm tăng cường triển khai; giữ `trustedProxies` chặt chẽ và tránh phơi bày gateway trực tiếp ra internet công cộng.

## Nhật ký phiên cục bộ nằm trên ổ đĩa

OpenClaw lưu bản ghi phiên trên đĩa trong `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Điều này là bắt buộc để duy trì tính liên tục của phiên và (tùy chọn) lập chỉ mục bộ nhớ phiên, nhưng cũng có nghĩa là
**bất kỳ tiến trình/người dùng nào có quyền truy cập hệ thống tệp đều có thể đọc các nhật ký đó**. Hãy xem quyền truy cập đĩa là ranh giới tin cậy
và siết chặt quyền trên `~/.openclaw` (xem phần kiểm tra bên dưới). Nếu bạn cần
cách ly mạnh hơn giữa các tác tử, hãy chạy chúng dưới các người dùng hệ điều hành riêng biệt hoặc trên các máy chủ riêng biệt.

## Thực thi Node (system.run)

Nếu một node macOS được ghép nối, Gateway có thể gọi `system.run` trên node đó. Đây là **thực thi mã từ xa** trên máy Mac:

- Yêu cầu ghép nối node (phê duyệt + token).
- Ghép nối node Gateway không phải là bề mặt phê duyệt theo từng lệnh. Nó thiết lập danh tính/độ tin cậy của node và cấp phát token.
- Gateway áp dụng chính sách lệnh node toàn cục thô thông qua `gateway.nodes.allowCommands` / `denyCommands`.
- Được kiểm soát trên máy Mac thông qua **Settings → Exec approvals** (bảo mật + hỏi + danh sách cho phép).
- Chính sách `system.run` theo từng node là tệp phê duyệt exec riêng của node (`exec.approvals.node.*`), có thể chặt hơn hoặc lỏng hơn chính sách ID lệnh toàn cục của gateway.
- Một node chạy với `security="full"` và `ask="off"` đang tuân theo mô hình người vận hành đáng tin cậy mặc định. Hãy xem đó là hành vi mong đợi trừ khi triển khai của bạn yêu cầu rõ ràng lập trường phê duyệt hoặc danh sách cho phép chặt hơn.
- Chế độ phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác và, khi có thể, một toán hạng tệp/tập lệnh cục bộ cụ thể. Nếu OpenClaw không thể xác định chính xác một tệp cục bộ trực tiếp cho một lệnh interpreter/runtime, việc thực thi dựa trên phê duyệt sẽ bị từ chối thay vì hứa hẹn bao phủ đầy đủ về mặt ngữ nghĩa.
- Với `host=node`, các lần chạy dựa trên phê duyệt cũng lưu một
  `systemRunPlan` chuẩn đã chuẩn bị; các lần chuyển tiếp đã phê duyệt sau đó dùng lại kế hoạch đã lưu đó, và quá trình
  xác thực của gateway từ chối các chỉnh sửa của bên gọi đối với ngữ cảnh lệnh/cwd/phiên sau khi
  yêu cầu phê duyệt đã được tạo.
- Nếu bạn không muốn thực thi từ xa, hãy đặt bảo mật thành **deny** và xóa ghép nối node cho máy Mac đó.

Sự khác biệt này quan trọng khi phân loại sự cố:

- Một node đã ghép nối kết nối lại và quảng bá danh sách lệnh khác, tự thân nó, không phải là lỗ hổng nếu chính sách toàn cục của Gateway và các phê duyệt exec cục bộ của node vẫn thực thi ranh giới thực thi thực tế.
- Các báo cáo xem siêu dữ liệu ghép nối node như một lớp phê duyệt ẩn thứ hai theo từng lệnh thường là nhầm lẫn về chính sách/UX, không phải vượt qua ranh giới bảo mật.

## Skills động (trình theo dõi / node từ xa)

OpenClaw có thể làm mới danh sách Skills giữa phiên:

- **Trình theo dõi Skills**: thay đổi đối với `SKILL.md` có thể cập nhật snapshot Skills ở lượt tác tử tiếp theo.
- **Node từ xa**: kết nối một node macOS có thể khiến các Skills chỉ dành cho macOS đủ điều kiện (dựa trên dò tìm bin).

Hãy xem các thư mục skill là **mã đáng tin cậy** và hạn chế người có thể sửa đổi chúng.

## Mô hình đe dọa

Trợ lý AI của bạn có thể:

- Thực thi các lệnh shell tùy ý
- Đọc/ghi tệp
- Truy cập các dịch vụ mạng
- Gửi tin nhắn cho bất kỳ ai (nếu bạn cấp quyền truy cập WhatsApp cho nó)

Những người nhắn tin cho bạn có thể:

- Cố lừa AI của bạn làm những việc xấu
- Dùng kỹ thuật xã hội để truy cập dữ liệu của bạn
- Dò tìm chi tiết hạ tầng

## Khái niệm cốt lõi: kiểm soát truy cập trước trí thông minh

Hầu hết lỗi ở đây không phải là khai thác tinh vi - mà là "ai đó nhắn cho bot và bot làm theo yêu cầu."

Lập trường của OpenClaw:

- **Danh tính trước:** quyết định ai có thể nói chuyện với bot (ghép nối DM / danh sách cho phép / "open" rõ ràng).
- **Phạm vi tiếp theo:** quyết định nơi bot được phép hành động (danh sách cho phép nhóm + cổng nhắc đến, công cụ, sandboxing, quyền thiết bị).
- **Mô hình sau cùng:** giả định mô hình có thể bị thao túng; thiết kế sao cho việc thao túng có phạm vi tác động hạn chế.

## Mô hình ủy quyền lệnh

Lệnh gạch chéo và chỉ thị chỉ được tuân thủ đối với **người gửi được ủy quyền**. Ủy quyền được suy ra từ
danh sách cho phép/ghép nối của kênh cộng với `commands.useAccessGroups` (xem [Cấu hình](/vi/gateway/configuration)
và [Lệnh gạch chéo](/vi/tools/slash-commands)). Nếu danh sách cho phép của kênh trống hoặc bao gồm `"*"`,
các lệnh về cơ bản được mở cho kênh đó.

`/exec` chỉ là tiện ích trong phiên dành cho người vận hành được ủy quyền. Nó **không** ghi cấu hình hoặc
thay đổi các phiên khác.

## Rủi ro của công cụ mặt phẳng điều khiển

Hai công cụ tích hợp có thể tạo thay đổi mặt phẳng điều khiển lâu dài:

- `gateway` có thể kiểm tra cấu hình bằng `config.schema.lookup` / `config.get`, và có thể tạo thay đổi lâu dài bằng `config.apply`, `config.patch`, và `update.run`.
- `cron` có thể tạo các công việc đã lên lịch tiếp tục chạy sau khi cuộc trò chuyện/tác vụ ban đầu kết thúc.

Công cụ runtime `gateway` chỉ dành cho chủ sở hữu vẫn từ chối ghi lại
`tools.exec.ask` hoặc `tools.exec.security`; các bí danh cũ `tools.bash.*` được
chuẩn hóa về cùng các đường dẫn exec được bảo vệ trước khi ghi.
Các chỉnh sửa `gateway config.apply` và `gateway config.patch` do tác tử điều khiển
mặc định thất bại theo hướng đóng: chỉ một tập hợp hẹp các đường dẫn prompt, mô hình và cổng nhắc đến
có thể được tác tử tinh chỉnh. Do đó, các cây cấu hình nhạy cảm mới được bảo vệ
trừ khi chúng được cố ý thêm vào danh sách cho phép.

Đối với bất kỳ tác tử/bề mặt nào xử lý nội dung không đáng tin cậy, mặc định hãy từ chối các công cụ này:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` chỉ chặn hành động khởi động lại. Nó không vô hiệu hóa các hành động cấu hình/cập nhật của `gateway`.

## Plugins

Plugins chạy **trong cùng tiến trình** với Gateway. Hãy xem chúng là mã đáng tin cậy:

- Chỉ cài đặt plugins từ các nguồn bạn tin tưởng.
- Ưu tiên danh sách cho phép `plugins.allow` rõ ràng.
- Rà soát cấu hình plugin trước khi bật.
- Khởi động lại Gateway sau khi thay đổi plugin.
- Nếu bạn cài đặt hoặc cập nhật plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), hãy xem việc đó như chạy mã không đáng tin cậy:
  - Đường dẫn cài đặt là thư mục theo từng plugin dưới gốc cài đặt plugin đang hoạt động.
  - OpenClaw chạy một lượt quét mã nguy hiểm tích hợp trước khi cài đặt/cập nhật. Các phát hiện `critical` mặc định sẽ chặn.
  - Các cài đặt plugin qua npm và git chỉ chạy hội tụ phụ thuộc của trình quản lý gói trong luồng cài đặt/cập nhật rõ ràng. Đường dẫn cục bộ và kho lưu trữ được xem là các gói plugin tự chứa; OpenClaw sao chép/tham chiếu chúng mà không chạy `npm install`.
  - Ưu tiên phiên bản được ghim, chính xác (`@scope/pkg@1.2.3`), và kiểm tra mã đã giải nén trên đĩa trước khi bật.
  - `--dangerously-force-unsafe-install` chỉ là biện pháp khẩn cấp cho kết quả dương tính giả của lượt quét tích hợp trong các luồng cài đặt/cập nhật plugin. Nó không bỏ qua các chặn chính sách hook `before_install` của plugin và không bỏ qua lỗi quét.
  - Các cài đặt phụ thuộc skill được Gateway hỗ trợ tuân theo cùng phân tách nguy hiểm/nghi vấn: phát hiện `critical` tích hợp sẽ chặn trừ khi bên gọi đặt rõ `dangerouslyForceUnsafeInstall`, trong khi phát hiện nghi vấn vẫn chỉ cảnh báo. `openclaw skills install` vẫn là luồng tải xuống/cài đặt skill ClawHub riêng biệt.

Chi tiết: [Plugins](/vi/tools/plugin)

## Mô hình truy cập DM: ghép nối, danh sách cho phép, mở, vô hiệu hóa

Tất cả các kênh hiện có khả năng DM đều hỗ trợ một chính sách DM (`dmPolicy` hoặc `*.dm.policy`) chặn DM đến **trước khi** tin nhắn được xử lý:

- `pairing` (mặc định): người gửi không xác định nhận một mã ghép nối ngắn và bot bỏ qua tin nhắn của họ cho đến khi được phê duyệt. Mã hết hạn sau 1 giờ; DM lặp lại sẽ không gửi lại mã cho đến khi một yêu cầu mới được tạo. Các yêu cầu đang chờ được giới hạn ở **3 mỗi kênh** theo mặc định.
- `allowlist`: người gửi không xác định bị chặn (không có bắt tay ghép nối).
- `open`: cho phép bất kỳ ai DM (công khai). **Yêu cầu** danh sách cho phép của kênh bao gồm `"*"` (chọn tham gia rõ ràng).
- `disabled`: bỏ qua hoàn toàn DM đến.

Phê duyệt qua CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Chi tiết + tệp trên đĩa: [Ghép nối](/vi/channels/pairing)

## Cách ly phiên DM (chế độ nhiều người dùng)

Theo mặc định, OpenClaw định tuyến **tất cả DM vào phiên chính** để trợ lý của bạn có tính liên tục trên các thiết bị và kênh. Nếu **nhiều người** có thể DM bot (DM mở hoặc danh sách cho phép nhiều người), hãy cân nhắc cách ly các phiên DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Điều này ngăn rò rỉ ngữ cảnh giữa người dùng trong khi vẫn giữ các cuộc trò chuyện nhóm được cách ly.

Đây là ranh giới ngữ cảnh nhắn tin, không phải ranh giới quản trị máy chủ. Nếu người dùng đối địch lẫn nhau và dùng chung cùng máy chủ/cấu hình Gateway, hãy chạy các gateway riêng biệt theo từng ranh giới tin cậy thay vào đó.

### Chế độ DM an toàn (khuyến nghị)

Hãy xem đoạn cấu hình trên là **chế độ DM an toàn**:

- Mặc định: `session.dmScope: "main"` (tất cả DM dùng chung một phiên để duy trì tính liên tục).
- Mặc định khi onboarding CLI cục bộ: ghi `session.dmScope: "per-channel-peer"` khi chưa đặt (giữ các giá trị rõ ràng hiện có).
- Chế độ DM an toàn: `session.dmScope: "per-channel-peer"` (mỗi cặp kênh+người gửi nhận một ngữ cảnh DM cách ly).
- Cách ly peer liên kênh: `session.dmScope: "per-peer"` (mỗi người gửi nhận một phiên trên tất cả các kênh cùng loại).

Nếu bạn chạy nhiều tài khoản trên cùng một kênh, hãy dùng `per-account-channel-peer` thay thế. Nếu cùng một người liên hệ với bạn trên nhiều kênh, hãy dùng `session.identityLinks` để gộp các phiên DM đó thành một danh tính chuẩn. Xem [Quản lý phiên](/vi/concepts/session) và [Cấu hình](/vi/gateway/configuration).

## Danh sách cho phép cho DM và nhóm

OpenClaw có hai lớp "ai có thể kích hoạt tôi?" riêng biệt:

- **Danh sách cho phép DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; cũ: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ai được phép nói chuyện với bot trong tin nhắn trực tiếp.
  - Khi `dmPolicy="pairing"`, các phê duyệt được ghi vào kho danh sách cho phép ghép nối theo phạm vi tài khoản dưới `~/.openclaw/credentials/` (`<channel>-allowFrom.json` cho tài khoản mặc định, `<channel>-<accountId>-allowFrom.json` cho tài khoản không mặc định), được hợp nhất với danh sách cho phép trong cấu hình.
- **Danh sách cho phép nhóm** (theo từng kênh): nhóm/kênh/guild nào bot sẽ chấp nhận tin nhắn.
  - Mẫu phổ biến:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: mặc định theo từng nhóm như `requireMention`; khi được đặt, nó cũng đóng vai trò là danh sách cho phép nhóm (bao gồm `"*"` để giữ hành vi cho phép tất cả).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: hạn chế ai có thể kích hoạt bot _bên trong_ một phiên nhóm (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: danh sách cho phép theo từng bề mặt + mặc định nhắc đến.
  - Kiểm tra nhóm chạy theo thứ tự này: `groupPolicy`/danh sách cho phép nhóm trước, kích hoạt bằng nhắc đến/trả lời sau.
  - Trả lời tin nhắn của bot (nhắc đến ngầm định) **không** bỏ qua danh sách cho phép người gửi như `groupAllowFrom`.
  - **Ghi chú bảo mật:** hãy xem `dmPolicy="open"` và `groupPolicy="open"` là thiết lập cuối cùng bất đắc dĩ. Chúng hầu như không nên được dùng; ưu tiên ghép nối + danh sách cho phép trừ khi bạn hoàn toàn tin tưởng mọi thành viên trong phòng.

Chi tiết: [Cấu hình](/vi/gateway/configuration) và [Nhóm](/vi/channels/groups)

## Prompt injection (nó là gì, vì sao quan trọng)

Prompt injection là khi kẻ tấn công soạn một tin nhắn thao túng mô hình làm điều không an toàn ("bỏ qua hướng dẫn của bạn", "xuất hệ thống tệp của bạn", "theo liên kết này và chạy lệnh", v.v.).

Ngay cả với system prompt mạnh, **prompt injection vẫn chưa được giải quyết**. Các rào chắn system prompt chỉ là hướng dẫn mềm; việc thực thi cứng đến từ chính sách công cụ, phê duyệt exec, sandboxing và danh sách cho phép kênh (và người vận hành có thể vô hiệu hóa các cơ chế này theo thiết kế). Những điều hữu ích trong thực tế:

- Luôn khóa chặt DM đến (ghép nối/danh sách cho phép).
- Ưu tiên cổng kiểm soát bằng lượt nhắc trong nhóm; tránh bot "luôn bật" trong phòng công khai.
- Mặc định coi liên kết, tệp đính kèm và hướng dẫn được dán là thù địch.
- Chạy việc thực thi công cụ nhạy cảm trong sandbox; giữ bí mật nằm ngoài hệ thống tệp mà tác tử có thể truy cập.
- Lưu ý: sandboxing là tùy chọn bật. Nếu chế độ sandbox tắt, `host=auto` ngầm định sẽ phân giải đến máy chủ Gateway. `host=sandbox` tường minh vẫn đóng an toàn vì không có runtime sandbox khả dụng. Đặt `host=gateway` nếu bạn muốn hành vi đó được tường minh trong cấu hình.
- Giới hạn các công cụ rủi ro cao (`exec`, `browser`, `web_fetch`, `web_search`) cho các tác tử đáng tin cậy hoặc danh sách cho phép tường minh.
- Nếu bạn đưa trình thông dịch vào danh sách cho phép (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), hãy bật `tools.exec.strictInlineEval` để các dạng eval nội tuyến vẫn cần phê duyệt tường minh.
- Phân tích phê duyệt shell cũng từ chối các dạng mở rộng tham số POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) bên trong **heredoc không đặt trong dấu nháy**, nên phần thân heredoc đã được đưa vào danh sách cho phép không thể lén đưa mở rộng shell vượt qua bước duyệt danh sách cho phép dưới dạng văn bản thuần. Đặt dấu nháy cho terminator của heredoc (ví dụ `<<'EOF'`) để chọn ngữ nghĩa phần thân literal; heredoc không đặt trong dấu nháy mà lẽ ra sẽ mở rộng biến sẽ bị từ chối.
- **Việc chọn mô hình rất quan trọng:** các mô hình cũ/nhỏ/legacy kém vững chắc hơn đáng kể trước prompt injection và lạm dụng công cụ. Với tác tử có bật công cụ, hãy dùng mô hình thế hệ mới nhất, mạnh nhất, được gia cố bằng chỉ thị mà bạn có.

Các dấu hiệu cảnh báo cần coi là không đáng tin cậy:

- "Đọc tệp/URL này và làm đúng y như nội dung đó nói."
- "Bỏ qua system prompt hoặc quy tắc an toàn của bạn."
- "Tiết lộ hướng dẫn ẩn hoặc đầu ra công cụ của bạn."
- "Dán toàn bộ nội dung của ~/.openclaw hoặc nhật ký của bạn."

## Làm sạch token đặc biệt trong nội dung bên ngoài

OpenClaw loại bỏ các literal token đặc biệt mẫu trò chuyện LLM tự lưu trữ phổ biến khỏi nội dung bên ngoài đã được bọc và siêu dữ liệu trước khi chúng đến mô hình. Các họ marker được bao phủ gồm Qwen/ChatML, Llama, Gemma, Mistral, Phi và token vai trò/lượt GPT-OSS.

Lý do:

- Các backend tương thích OpenAI làm lớp trước cho mô hình tự lưu trữ đôi khi giữ nguyên token đặc biệt xuất hiện trong văn bản người dùng, thay vì che chúng. Nếu không, kẻ tấn công có thể ghi vào nội dung bên ngoài đi vào (một trang được fetch, thân email, đầu ra công cụ nội dung tệp) để chèn ranh giới vai trò `assistant` hoặc `system` giả và thoát khỏi guardrail nội dung đã bọc.
- Việc làm sạch diễn ra ở lớp bọc nội dung bên ngoài, nên áp dụng đồng nhất trên các công cụ fetch/read và nội dung kênh đi vào thay vì theo từng provider.
- Phản hồi mô hình đi ra đã có một bộ làm sạch riêng để loại bỏ các phần dựng nội bộ runtime bị rò rỉ như `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` và tương tự khỏi phản hồi người dùng thấy ở ranh giới phân phối kênh cuối cùng. Bộ làm sạch nội dung bên ngoài là phần đối ứng ở chiều vào.

Điều này không thay thế các cơ chế gia cố khác trên trang này - `dmPolicy`, danh sách cho phép, phê duyệt exec, sandboxing và `contextVisibility` vẫn làm phần việc chính. Nó đóng một đường vòng cụ thể ở lớp tokenizer chống lại các stack tự lưu trữ chuyển tiếp văn bản người dùng với token đặc biệt còn nguyên.

## Cờ bỏ qua nội dung bên ngoài không an toàn

OpenClaw bao gồm các cờ bỏ qua tường minh để tắt bọc an toàn nội dung bên ngoài:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Trường payload Cron `allowUnsafeExternalContent`

Hướng dẫn:

- Giữ các cờ này chưa đặt/false trong production.
- Chỉ bật tạm thời cho việc gỡ lỗi có phạm vi chặt chẽ.
- Nếu bật, hãy cô lập tác tử đó (sandbox + công cụ tối thiểu + namespace phiên riêng).

Lưu ý rủi ro hook:

- Payload hook là nội dung không đáng tin cậy, ngay cả khi việc phân phối đến từ các hệ thống bạn kiểm soát (nội dung mail/docs/web có thể mang prompt injection).
- Các tầng mô hình yếu làm tăng rủi ro này. Với tự động hóa do hook điều khiển, hãy ưu tiên các tầng mô hình hiện đại mạnh và giữ chính sách công cụ chặt (`tools.profile: "messaging"` hoặc nghiêm ngặt hơn), cộng với sandboxing khi có thể.

### Prompt injection không cần DM công khai

Ngay cả khi **chỉ bạn** có thể nhắn cho bot, prompt injection vẫn có thể xảy ra qua
bất kỳ **nội dung không đáng tin cậy** nào mà bot đọc (kết quả web search/fetch, trang trình duyệt,
email, docs, tệp đính kèm, nhật ký/mã được dán). Nói cách khác: người gửi không phải là
bề mặt đe dọa duy nhất; **chính nội dung** có thể mang chỉ thị đối nghịch.

Khi bật công cụ, rủi ro điển hình là trích xuất ngữ cảnh hoặc kích hoạt
lệnh gọi công cụ. Giảm bán kính tác động bằng cách:

- Dùng một **tác tử đọc** chỉ đọc hoặc tắt công cụ để tóm tắt nội dung không đáng tin cậy,
  rồi chuyển bản tóm tắt cho tác tử chính của bạn.
- Tắt `web_search` / `web_fetch` / `browser` với các tác tử có bật công cụ trừ khi cần.
- Với đầu vào URL OpenResponses (`input_file` / `input_image`), đặt chặt
  `gateway.http.endpoints.responses.files.urlAllowlist` và
  `gateway.http.endpoints.responses.images.urlAllowlist`, và giữ `maxUrlParts` thấp.
  Danh sách cho phép rỗng được coi như chưa đặt; dùng `files.allowUrl: false` / `images.allowUrl: false`
  nếu bạn muốn tắt hoàn toàn việc fetch URL.
- Với đầu vào tệp OpenResponses, văn bản `input_file` đã giải mã vẫn được chèn dưới dạng
  **nội dung bên ngoài không đáng tin cậy**. Đừng dựa vào việc văn bản tệp là đáng tin chỉ vì
  Gateway đã giải mã nó cục bộ. Khối được chèn vẫn mang marker ranh giới tường minh
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` cùng siêu dữ liệu `Source: External`,
  dù đường dẫn này bỏ qua banner `SECURITY NOTICE:` dài hơn.
- Cùng cơ chế bọc dựa trên marker được áp dụng khi khả năng hiểu media trích xuất văn bản
  từ tài liệu đính kèm trước khi thêm văn bản đó vào prompt media.
- Bật sandboxing và danh sách cho phép công cụ nghiêm ngặt cho mọi tác tử chạm vào đầu vào không đáng tin cậy.
- Giữ bí mật ngoài prompt; thay vào đó truyền chúng qua env/config trên máy chủ Gateway.

### Backend LLM tự lưu trữ

Các backend tự lưu trữ tương thích OpenAI như vLLM, SGLang, TGI, LM Studio,
hoặc các stack tokenizer Hugging Face tùy chỉnh có thể khác với provider lưu trữ ở cách
xử lý token đặc biệt mẫu trò chuyện. Nếu một backend token hóa các chuỗi literal
như `<|im_start|>`, `<|start_header_id|>` hoặc `<start_of_turn>` thành
token cấu trúc mẫu trò chuyện bên trong nội dung người dùng, văn bản không đáng tin cậy có thể cố
giả mạo ranh giới vai trò ở lớp tokenizer.

OpenClaw loại bỏ các literal token đặc biệt phổ biến theo họ mô hình khỏi
nội dung bên ngoài đã bọc trước khi gửi đến mô hình. Hãy giữ bật bọc nội dung bên ngoài,
và ưu tiên các thiết lập backend có thể tách hoặc escape token đặc biệt
trong nội dung do người dùng cung cấp khi có. Các provider lưu trữ như OpenAI
và Anthropic đã áp dụng cơ chế làm sạch phía request riêng của họ.

### Độ mạnh mô hình (lưu ý bảo mật)

Khả năng chống prompt injection **không** đồng đều giữa các tầng mô hình. Các mô hình nhỏ/rẻ hơn thường dễ bị lạm dụng công cụ và chiếm quyền chỉ thị hơn, đặc biệt dưới prompt đối nghịch.

<Warning>
Với tác tử có bật công cụ hoặc tác tử đọc nội dung không đáng tin cậy, rủi ro prompt injection với mô hình cũ/nhỏ thường quá cao. Đừng chạy các workload đó trên tầng mô hình yếu.
</Warning>

Khuyến nghị:

- **Dùng mô hình thế hệ mới nhất, tầng tốt nhất** cho mọi bot có thể chạy công cụ hoặc chạm vào tệp/mạng.
- **Không dùng các tầng cũ/yếu/nhỏ hơn** cho tác tử có bật công cụ hoặc hộp thư đến không đáng tin cậy; rủi ro prompt injection quá cao.
- Nếu bạn bắt buộc phải dùng mô hình nhỏ hơn, hãy **giảm bán kính tác động** (công cụ chỉ đọc, sandboxing mạnh, quyền truy cập hệ thống tệp tối thiểu, danh sách cho phép nghiêm ngặt).
- Khi chạy mô hình nhỏ, hãy **bật sandboxing cho mọi phiên** và **tắt web_search/web_fetch/browser** trừ khi đầu vào được kiểm soát chặt.
- Với trợ lý cá nhân chỉ trò chuyện có đầu vào đáng tin cậy và không có công cụ, mô hình nhỏ hơn thường ổn.

## Reasoning và đầu ra verbose trong nhóm

`/reasoning`, `/verbose` và `/trace` có thể lộ reasoning nội bộ, đầu ra
công cụ hoặc chẩn đoán Plugin
không dành cho kênh công khai. Trong bối cảnh nhóm, hãy coi chúng là **chỉ để gỡ lỗi**
và giữ tắt trừ khi bạn cần chúng một cách tường minh.

Hướng dẫn:

- Giữ `/reasoning`, `/verbose` và `/trace` bị tắt trong phòng công khai.
- Nếu bạn bật chúng, chỉ làm vậy trong DM đáng tin cậy hoặc phòng được kiểm soát chặt.
- Hãy nhớ: đầu ra verbose và trace có thể bao gồm đối số công cụ, URL, chẩn đoán Plugin và dữ liệu mô hình đã thấy.

## Ví dụ gia cố cấu hình

### Quyền tệp

Giữ cấu hình + trạng thái riêng tư trên máy chủ Gateway:

- `~/.openclaw/openclaw.json`: `600` (chỉ người dùng đọc/ghi)
- `~/.openclaw`: `700` (chỉ người dùng)

`openclaw doctor` có thể cảnh báo và đề nghị siết chặt các quyền này.

### Phơi lộ mạng (bind, cổng, tường lửa)

Gateway ghép kênh **WebSocket + HTTP** trên một cổng duy nhất:

- Mặc định: `18789`
- Cấu hình/cờ/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Bề mặt HTTP này bao gồm Control UI và máy chủ canvas:

- Control UI (asset SPA) (đường dẫn cơ sở mặc định `/`)
- Máy chủ canvas: `/__openclaw__/canvas/` và `/__openclaw__/a2ui/` (HTML/JS tùy ý; coi là nội dung không đáng tin cậy)

Nếu bạn tải nội dung canvas trong trình duyệt thông thường, hãy coi nó như mọi trang web không đáng tin cậy khác:

- Đừng phơi lộ máy chủ canvas cho mạng/người dùng không đáng tin cậy.
- Đừng để nội dung canvas chia sẻ cùng origin với các bề mặt web đặc quyền trừ khi bạn hiểu đầy đủ hệ quả.

Chế độ bind kiểm soát nơi Gateway lắng nghe:

- `gateway.bind: "loopback"` (mặc định): chỉ client cục bộ có thể kết nối.
- Các bind không phải loopback (`"lan"`, `"tailnet"`, `"custom"`) mở rộng bề mặt tấn công. Chỉ dùng chúng với xác thực Gateway (token/mật khẩu dùng chung hoặc proxy đáng tin cậy được cấu hình đúng) và tường lửa thật.

Quy tắc thực hành:

- Ưu tiên Tailscale Serve thay cho bind LAN (Serve giữ Gateway trên loopback, và Tailscale xử lý truy cập).
- Nếu bạn buộc phải bind vào LAN, hãy dùng tường lửa giới hạn cổng vào một danh sách cho phép IP nguồn chặt; đừng port-forward rộng rãi.
- Không bao giờ phơi lộ Gateway không xác thực trên `0.0.0.0`.

### Xuất bản cổng Docker với UFW

Nếu bạn chạy OpenClaw bằng Docker trên VPS, hãy nhớ rằng các cổng container được xuất bản
(`-p HOST:CONTAINER` hoặc Compose `ports:`) được định tuyến qua các chain chuyển tiếp của Docker,
không chỉ qua quy tắc `INPUT` của host.

Để giữ lưu lượng Docker khớp với chính sách tường lửa của bạn, hãy thực thi quy tắc trong
`DOCKER-USER` (chain này được đánh giá trước các quy tắc accept riêng của Docker).
Trên nhiều distro hiện đại, `iptables`/`ip6tables` dùng frontend `iptables-nft`
và vẫn áp dụng các quy tắc này vào backend nftables.

Ví dụ danh sách cho phép tối thiểu (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 có bảng riêng. Thêm chính sách tương ứng trong `/etc/ufw/after6.rules` nếu
Docker IPv6 được bật.

Tránh hardcode tên giao diện như `eth0` trong đoạn tài liệu. Tên giao diện
khác nhau giữa các image VPS (`ens3`, `enp*`, v.v.) và không khớp có thể vô tình
bỏ qua quy tắc deny của bạn.

Xác thực nhanh sau khi reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Các cổng bên ngoài dự kiến chỉ nên là những gì bạn cố ý phơi lộ (với hầu hết
thiết lập: SSH + các cổng reverse proxy của bạn).

### Khám phá mDNS/Bonjour

Khi Plugin `bonjour` đi kèm được bật, Gateway phát sự hiện diện của nó qua mDNS (`_openclaw-gw._tcp` trên cổng 5353) để khám phá thiết bị cục bộ. Ở chế độ đầy đủ, việc này bao gồm các bản ghi TXT có thể phơi lộ chi tiết vận hành:

- `cliPath`: đường dẫn hệ thống tệp đầy đủ tới tệp nhị phân CLI (tiết lộ tên người dùng và vị trí cài đặt)
- `sshPort`: công bố tình trạng SSH khả dụng trên máy chủ
- `displayName`, `lanHost`: thông tin tên máy chủ

**Cân nhắc bảo mật vận hành:** Việc phát rộng thông tin hạ tầng giúp bất kỳ ai trên mạng cục bộ do thám dễ hơn. Ngay cả thông tin có vẻ "vô hại" như đường dẫn hệ thống tệp và tình trạng SSH khả dụng cũng giúp kẻ tấn công lập bản đồ môi trường của bạn.

**Khuyến nghị:**

1. **Giữ Bonjour tắt trừ khi cần phát hiện LAN.** Bonjour tự khởi động trên máy chủ macOS và là tùy chọn bật ở nơi khác; URL Gateway trực tiếp, Tailnet, SSH hoặc DNS-SD diện rộng tránh multicast cục bộ.

2. **Chế độ tối thiểu** (mặc định khi Bonjour được bật, khuyến nghị cho gateway bị phơi bày): bỏ qua các trường nhạy cảm khỏi bản phát mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Tắt chế độ mDNS** nếu bạn muốn giữ Plugin được bật nhưng chặn phát hiện thiết bị cục bộ:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Chế độ đầy đủ** (chọn bật): bao gồm `cliPath` + `sshPort` trong bản ghi TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Biến môi trường** (thay thế): đặt `OPENCLAW_DISABLE_BONJOUR=1` để tắt mDNS mà không cần thay đổi cấu hình.

Khi Bonjour được bật ở chế độ tối thiểu, Gateway phát rộng đủ thông tin để phát hiện thiết bị (`role`, `gatewayPort`, `transport`) nhưng bỏ qua `cliPath` và `sshPort`. Các ứng dụng cần thông tin đường dẫn CLI có thể lấy thông tin đó qua kết nối WebSocket đã xác thực thay vào đó.

### Khóa chặt WebSocket của Gateway (xác thực cục bộ)

Xác thực Gateway là **bắt buộc theo mặc định**. Nếu không có đường dẫn xác thực gateway hợp lệ nào được cấu hình,
Gateway từ chối kết nối WebSocket (đóng khi lỗi).

Onboarding tạo token theo mặc định (ngay cả với loopback) nên
máy khách cục bộ phải xác thực.

Đặt token để **tất cả** máy khách WS đều phải xác thực:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor có thể tạo một token cho bạn: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` và `gateway.remote.password` là nguồn thông tin xác thực máy khách. Chúng **không** tự bảo vệ quyền truy cập WS cục bộ. Các đường gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm dự phòng khi `gateway.auth.*` chưa được đặt. Nếu `gateway.auth.token` hoặc `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không phân giải được, quá trình phân giải sẽ đóng khi lỗi (không có dự phòng từ xa che lấp).
</Note>
Tùy chọn: ghim TLS từ xa bằng `gateway.remote.tlsFingerprint` khi dùng `wss://`.
Văn bản thuần `ws://` mặc định chỉ dành cho loopback. Với các đường dẫn
mạng riêng đáng tin cậy, đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên tiến trình máy khách như
một phương án phá kính khẩn cấp. Điều này cố ý chỉ là môi trường tiến trình, không phải
khóa cấu hình `openclaw.json`.
Ghép đôi di động và các tuyến gateway thủ công hoặc quét trên Android nghiêm ngặt hơn:
cleartext được chấp nhận cho loopback, nhưng private-LAN, link-local, `.local` và
tên máy chủ không dấu chấm phải dùng TLS trừ khi bạn chọn rõ đường dẫn cleartext
mạng riêng đáng tin cậy.

Ghép đôi thiết bị cục bộ:

- Ghép đôi thiết bị được tự động phê duyệt cho các kết nối local loopback trực tiếp để giữ
  trải nghiệm máy khách cùng máy chủ mượt mà.
- OpenClaw cũng có một đường tự kết nối hẹp ở backend/container-local cho
  các luồng trợ giúp shared-secret đáng tin cậy.
- Các kết nối Tailnet và LAN, bao gồm cả liên kết tailnet cùng máy chủ, được coi là
  từ xa cho ghép đôi và vẫn cần phê duyệt.
- Bằng chứng forwarded-header trên yêu cầu loopback làm mất tư cách
  cục bộ loopback. Tự động phê duyệt nâng cấp metadata được giới hạn hẹp. Xem
  [Ghép đôi Gateway](/vi/gateway/pairing) để biết cả hai quy tắc.

Chế độ xác thực:

- `gateway.auth.mode: "token"`: token bearer dùng chung (khuyến nghị cho hầu hết thiết lập).
- `gateway.auth.mode: "password"`: xác thực bằng mật khẩu (ưu tiên đặt qua env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: tin cậy proxy ngược nhận biết danh tính để xác thực người dùng và truyền danh tính qua header (xem [Xác thực Proxy Tin cậy](/vi/gateway/trusted-proxy-auth)).

Danh sách kiểm tra xoay vòng (token/mật khẩu):

1. Tạo/đặt secret mới (`gateway.auth.token` hoặc `OPENCLAW_GATEWAY_PASSWORD`).
2. Khởi động lại Gateway (hoặc khởi động lại ứng dụng macOS nếu ứng dụng đó giám sát Gateway).
3. Cập nhật mọi máy khách từ xa (`gateway.remote.token` / `.password` trên các máy gọi vào Gateway).
4. Xác minh bạn không còn có thể kết nối bằng thông tin xác thực cũ.

### Header danh tính Tailscale Serve

Khi `gateway.auth.allowTailscale` là `true` (mặc định cho Serve), OpenClaw
chấp nhận header danh tính Tailscale Serve (`tailscale-user-login`) cho xác thực Control
UI/WebSocket. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ
`x-forwarded-for` qua daemon Tailscale cục bộ (`tailscale whois`)
và khớp địa chỉ đó với header. Điều này chỉ kích hoạt cho các yêu cầu đi vào loopback
và bao gồm `x-forwarded-for`, `x-forwarded-proto` và `x-forwarded-host` như
được Tailscale chèn vào.
Với đường kiểm tra danh tính bất đồng bộ này, các lần thử thất bại cho cùng `{scope, ip}`
được tuần tự hóa trước khi bộ giới hạn ghi nhận thất bại. Vì vậy, các lần thử lại sai đồng thời
từ một máy khách Serve có thể khóa ngay lần thử thứ hai
thay vì chạy đua qua như hai lần không khớp thông thường.
Các endpoint HTTP API (ví dụ `/v1/*`, `/tools/invoke` và `/api/channels/*`)
**không** dùng xác thực header danh tính Tailscale. Chúng vẫn tuân theo chế độ xác thực HTTP
đã cấu hình của gateway.

Ghi chú ranh giới quan trọng:

- Xác thực bearer HTTP của Gateway thực chất là quyền truy cập operator tất-cả-hoặc-không-gì.
- Xem thông tin xác thực có thể gọi `/v1/chat/completions`, `/v1/responses` hoặc `/api/channels/*` là secret operator toàn quyền cho gateway đó.
- Trên bề mặt HTTP tương thích OpenAI, xác thực bearer shared-secret khôi phục toàn bộ phạm vi operator mặc định (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) và ngữ nghĩa owner cho lượt agent; các giá trị `x-openclaw-scopes` hẹp hơn không làm giảm đường shared-secret đó.
- Ngữ nghĩa phạm vi theo từng yêu cầu trên HTTP chỉ áp dụng khi yêu cầu đến từ chế độ mang danh tính như xác thực trusted proxy hoặc `gateway.auth.mode="none"` trên ingress riêng.
- Trong các chế độ mang danh tính đó, việc bỏ qua `x-openclaw-scopes` sẽ quay về tập phạm vi operator mặc định bình thường; gửi header rõ ràng khi bạn muốn tập phạm vi hẹp hơn.
- `/tools/invoke` tuân theo cùng quy tắc shared-secret: xác thực bearer token/mật khẩu cũng được coi là quyền truy cập operator đầy đủ ở đó, trong khi các chế độ mang danh tính vẫn tôn trọng phạm vi đã khai báo.
- Không chia sẻ các thông tin xác thực này với bên gọi không đáng tin cậy; ưu tiên gateway riêng cho mỗi ranh giới tin cậy.

**Giả định tin cậy:** xác thực Serve không token giả định máy chủ gateway là đáng tin cậy.
Không xem điều này là biện pháp bảo vệ trước các tiến trình cùng máy chủ thù địch. Nếu mã cục bộ
không đáng tin cậy có thể chạy trên máy chủ gateway, hãy tắt `gateway.auth.allowTailscale`
và yêu cầu xác thực shared-secret rõ ràng bằng `gateway.auth.mode: "token"` hoặc
`"password"`.

**Quy tắc bảo mật:** không chuyển tiếp các header này từ proxy ngược của riêng bạn. Nếu
bạn kết thúc TLS hoặc proxy phía trước gateway, hãy tắt
`gateway.auth.allowTailscale` và dùng xác thực shared-secret (`gateway.auth.mode:
"token"` hoặc `"password"`) hoặc [Xác thực Proxy Tin cậy](/vi/gateway/trusted-proxy-auth)
thay vào đó.

Proxy tin cậy:

- Nếu bạn kết thúc TLS phía trước Gateway, đặt `gateway.trustedProxies` thành IP proxy của bạn.
- OpenClaw sẽ tin cậy `x-forwarded-for` (hoặc `x-real-ip`) từ các IP đó để xác định IP máy khách cho kiểm tra ghép đôi cục bộ và kiểm tra xác thực HTTP/cục bộ.
- Đảm bảo proxy của bạn **ghi đè** `x-forwarded-for` và chặn truy cập trực tiếp vào cổng Gateway.

Xem [Tailscale](/vi/gateway/tailscale) và [Tổng quan web](/vi/web).

### Điều khiển trình duyệt qua máy chủ Node (khuyến nghị)

Nếu Gateway của bạn ở xa nhưng trình duyệt chạy trên máy khác, hãy chạy một **máy chủ Node**
trên máy có trình duyệt và để Gateway proxy các thao tác trình duyệt (xem [Công cụ trình duyệt](/vi/tools/browser)).
Xem ghép đôi Node như quyền truy cập quản trị.

Mẫu khuyến nghị:

- Giữ Gateway và máy chủ Node trên cùng tailnet (Tailscale).
- Ghép đôi Node có chủ đích; tắt định tuyến proxy trình duyệt nếu bạn không cần.

Tránh:

- Phơi bày cổng relay/điều khiển qua LAN hoặc Internet công cộng.
- Tailscale Funnel cho các endpoint điều khiển trình duyệt (phơi bày công khai).

### Secret trên đĩa

Giả định mọi thứ dưới `~/.openclaw/` (hoặc `$OPENCLAW_STATE_DIR/`) có thể chứa secret hoặc dữ liệu riêng tư:

- `openclaw.json`: cấu hình có thể bao gồm token (gateway, gateway từ xa), cài đặt provider và allowlist.
- `credentials/**`: thông tin xác thực kênh (ví dụ: thông tin xác thực WhatsApp), allowlist ghép đôi, bản nhập OAuth cũ.
- `agents/<agentId>/agent/auth-profiles.json`: khóa API, hồ sơ token, token OAuth và `keyRef`/`tokenRef` tùy chọn.
- `agents/<agentId>/agent/codex-home/**`: tài khoản app-server Codex theo từng agent, cấu hình, Skills, plugins, trạng thái luồng native và chẩn đoán.
- `secrets.json` (tùy chọn): payload secret dựa trên tệp được các provider SecretRef `file` sử dụng (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: tệp tương thích cũ. Các mục `api_key` tĩnh được xóa sạch khi được phát hiện.
- `agents/<agentId>/sessions/**`: bản ghi phiên (`*.jsonl`) + metadata định tuyến (`sessions.json`) có thể chứa tin nhắn riêng tư và đầu ra công cụ.
- gói Plugin được đóng gói kèm: Plugin đã cài đặt (cùng với `node_modules/` của chúng).
- `sandboxes/**`: không gian làm việc sandbox công cụ; có thể tích lũy bản sao của các tệp bạn đọc/ghi bên trong sandbox.

Mẹo tăng cường bảo vệ:

- Giữ quyền truy cập chặt chẽ (`700` cho thư mục, `600` cho tệp).
- Dùng mã hóa toàn bộ đĩa trên máy chủ gateway.
- Ưu tiên tài khoản người dùng hệ điều hành chuyên dụng cho Gateway nếu máy chủ được dùng chung.

### Tệp `.env` của Workspace

OpenClaw tải các tệp `.env` cục bộ theo workspace cho agent và công cụ, nhưng không bao giờ để các tệp đó âm thầm ghi đè điều khiển runtime của gateway.

- Mọi khóa bắt đầu bằng `OPENCLAW_*` đều bị chặn khỏi các tệp `.env` workspace không đáng tin cậy.
- Cài đặt endpoint kênh cho Matrix, Mattermost, IRC và Synology Chat cũng bị chặn khỏi ghi đè `.env` của workspace, nên workspace được clone không thể chuyển hướng lưu lượng connector đóng gói kèm qua cấu hình endpoint cục bộ. Các khóa env endpoint (như `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) phải đến từ môi trường tiến trình gateway hoặc `env.shellEnv`, không phải từ `.env` được tải từ workspace.
- Chặn theo kiểu đóng khi lỗi: một biến điều khiển runtime mới được thêm trong bản phát hành tương lai không thể được kế thừa từ `.env` được commit hoặc do kẻ tấn công cung cấp; khóa bị bỏ qua và gateway giữ giá trị riêng của nó.
- Các biến môi trường tin cậy của tiến trình/hệ điều hành (shell riêng của gateway, unit launchd/systemd, gói ứng dụng) vẫn áp dụng - điều này chỉ ràng buộc việc tải tệp `.env`.

Lý do: tệp `.env` của workspace thường nằm cạnh mã agent, bị commit do nhầm lẫn hoặc được công cụ ghi ra. Chặn toàn bộ tiền tố `OPENCLAW_*` nghĩa là việc thêm cờ `OPENCLAW_*` mới sau này sẽ không bao giờ thoái lui thành kế thừa âm thầm từ trạng thái workspace.

### Nhật ký và bản ghi phiên (biên tập ẩn và lưu giữ)

Nhật ký và bản ghi phiên có thể rò rỉ thông tin nhạy cảm ngay cả khi kiểm soát truy cập đúng:

- Nhật ký Gateway có thể bao gồm tóm tắt công cụ, lỗi và URL.
- Bản ghi phiên có thể bao gồm secret đã dán, nội dung tệp, đầu ra lệnh và liên kết.

Khuyến nghị:

- Bật biên tập ẩn nhật ký và bản ghi phiên (`logging.redactSensitive: "tools"`; mặc định).
- Thêm mẫu tùy chỉnh cho môi trường của bạn qua `logging.redactPatterns` (token, tên máy chủ, URL nội bộ).
- Khi chia sẻ chẩn đoán, ưu tiên `openclaw status --all` (có thể dán, secret đã được biên tập ẩn) thay vì nhật ký thô.
- Dọn bớt bản ghi phiên và tệp nhật ký cũ nếu bạn không cần lưu giữ lâu.

Chi tiết: [Ghi nhật ký](/vi/gateway/logging)

### DM: ghép đôi theo mặc định

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Nhóm: yêu cầu nhắc đến ở mọi nơi

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

Trong cuộc trò chuyện nhóm, chỉ phản hồi khi được nhắc đến rõ ràng.

### Số riêng biệt (WhatsApp, Signal, Telegram)

Đối với các kênh dựa trên số điện thoại, hãy cân nhắc chạy AI của bạn trên một số điện thoại riêng, khác với số cá nhân:

- Số cá nhân: Các cuộc trò chuyện của bạn vẫn riêng tư
- Số bot: AI xử lý các cuộc trò chuyện này, với ranh giới phù hợp

### Chế độ chỉ đọc (qua sandbox và công cụ)

Bạn có thể xây dựng một hồ sơ chỉ đọc bằng cách kết hợp:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (hoặc `"none"` nếu không cho truy cập workspace)
- danh sách cho phép/từ chối công cụ chặn `write`, `edit`, `apply_patch`, `exec`, `process`, v.v.

Các tùy chọn gia cố bổ sung:

- `tools.exec.applyPatch.workspaceOnly: true` (mặc định): đảm bảo `apply_patch` không thể ghi/xóa bên ngoài thư mục workspace ngay cả khi sandboxing đang tắt. Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` chạm vào các tệp bên ngoài workspace.
- `tools.fs.workspaceOnly: true` (tùy chọn): giới hạn các đường dẫn `read`/`write`/`edit`/`apply_patch` và các đường dẫn tự động tải ảnh prompt gốc vào thư mục workspace (hữu ích nếu hiện nay bạn cho phép đường dẫn tuyệt đối và muốn một rào chắn duy nhất).
- Giữ các gốc hệ thống tệp ở phạm vi hẹp: tránh các gốc rộng như thư mục home của bạn cho workspace/sandbox workspace của agent. Các gốc rộng có thể làm lộ tệp cục bộ nhạy cảm (ví dụ trạng thái/cấu hình trong `~/.openclaw`) cho công cụ hệ thống tệp.

### Đường cơ sở bảo mật (sao chép/dán)

Một cấu hình "mặc định an toàn" giữ Gateway ở chế độ riêng tư, yêu cầu ghép cặp DM và tránh bot nhóm luôn bật:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Nếu bạn cũng muốn thực thi công cụ "an toàn hơn theo mặc định", hãy thêm sandbox và từ chối các công cụ nguy hiểm cho mọi agent không phải chủ sở hữu (ví dụ bên dưới trong "Hồ sơ truy cập theo agent").

Đường cơ sở tích hợp cho lượt agent do chat điều khiển: người gửi không phải chủ sở hữu không thể dùng các công cụ `cron` hoặc `gateway`.

## Sandboxing (khuyến nghị)

Tài liệu riêng: [Sandboxing](/vi/gateway/sandboxing)

Hai cách tiếp cận bổ trợ nhau:

- **Chạy toàn bộ Gateway trong Docker** (ranh giới container): [Docker](/vi/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, gateway máy chủ + công cụ được cách ly bằng sandbox; Docker là backend mặc định): [Sandboxing](/vi/gateway/sandboxing)

<Note>
Để ngăn truy cập chéo giữa các agent, hãy giữ `agents.defaults.sandbox.scope` ở `"agent"` (mặc định) hoặc `"session"` để cách ly nghiêm ngặt hơn theo từng phiên. `scope: "shared"` dùng một container hoặc workspace duy nhất.
</Note>

Cũng nên cân nhắc quyền truy cập workspace của agent bên trong sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (mặc định) giữ workspace của agent ngoài phạm vi truy cập; công cụ chạy với một sandbox workspace trong `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` gắn workspace của agent ở chế độ chỉ đọc tại `/agent` (vô hiệu hóa `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` gắn workspace của agent ở chế độ đọc/ghi tại `/workspace`
- Các `sandbox.docker.binds` bổ sung được xác thực theo đường dẫn nguồn đã chuẩn hóa và chính tắc hóa. Các thủ thuật symlink cha và bí danh home chính tắc vẫn bị chặn an toàn nếu chúng phân giải vào các gốc bị chặn như `/etc`, `/var/run`, hoặc thư mục thông tin xác thực trong home của hệ điều hành.

<Warning>
`tools.elevated` là lối thoát đường cơ sở toàn cục để chạy exec bên ngoài sandbox. Host hiệu lực mặc định là `gateway`, hoặc `node` khi đích exec được cấu hình là `node`. Hãy giữ `tools.elevated.allowFrom` thật chặt và không bật nó cho người lạ. Bạn có thể hạn chế thêm elevated theo từng agent qua `agents.list[].tools.elevated`. Xem [Chế độ Elevated](/vi/tools/elevated).
</Warning>

### Rào chắn ủy quyền sub-agent

Nếu bạn cho phép công cụ phiên, hãy coi các lượt chạy sub-agent được ủy quyền là một quyết định ranh giới khác:

- Từ chối `sessions_spawn` trừ khi agent thật sự cần ủy quyền.
- Giữ `agents.defaults.subagents.allowAgents` và mọi ghi đè `agents.list[].subagents.allowAgents` theo từng agent giới hạn ở các agent đích đã biết là an toàn.
- Với mọi workflow phải tiếp tục được sandbox, gọi `sessions_spawn` với `sandbox: "require"` (mặc định là `inherit`).
- `sandbox: "require"` thất bại nhanh khi runtime con đích không được sandbox.

## Rủi ro điều khiển trình duyệt

Bật điều khiển trình duyệt cho mô hình khả năng điều khiển một trình duyệt thật.
Nếu hồ sơ trình duyệt đó đã chứa các phiên đăng nhập, mô hình có thể
truy cập các tài khoản và dữ liệu đó. Hãy coi hồ sơ trình duyệt là **trạng thái nhạy cảm**:

- Ưu tiên một hồ sơ riêng cho agent (hồ sơ `openclaw` mặc định).
- Tránh trỏ agent vào hồ sơ cá nhân dùng hằng ngày của bạn.
- Giữ điều khiển trình duyệt trên host ở trạng thái tắt cho các agent được sandbox trừ khi bạn tin tưởng chúng.
- API điều khiển trình duyệt loopback độc lập chỉ tôn trọng xác thực bí mật dùng chung
  (xác thực bearer token của gateway hoặc mật khẩu gateway). Nó không sử dụng
  header danh tính trusted-proxy hoặc Tailscale Serve.
- Xem các tệp tải xuống từ trình duyệt là đầu vào không tin cậy; ưu tiên một thư mục tải xuống được cách ly.
- Tắt đồng bộ trình duyệt/trình quản lý mật khẩu trong hồ sơ agent nếu có thể (giảm phạm vi ảnh hưởng).
- Với gateway từ xa, hãy giả định "điều khiển trình duyệt" tương đương với "quyền truy cập của người vận hành" tới bất cứ thứ gì hồ sơ đó có thể truy cập.
- Giữ Gateway và các host node chỉ trong tailnet; tránh phơi cổng điều khiển trình duyệt ra LAN hoặc Internet công cộng.
- Tắt định tuyến proxy trình duyệt khi bạn không cần (`gateway.nodes.browser.mode="off"`).
- Chế độ phiên hiện có của Chrome MCP **không** "an toàn hơn"; nó có thể hành động như bạn trong bất cứ thứ gì hồ sơ Chrome trên host đó có thể truy cập.

### Chính sách SSRF trình duyệt (nghiêm ngặt theo mặc định)

Chính sách điều hướng trình duyệt của OpenClaw nghiêm ngặt theo mặc định: các đích riêng tư/nội bộ vẫn bị chặn trừ khi bạn chọn bật rõ ràng.

- Mặc định: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` chưa được đặt, vì vậy điều hướng trình duyệt tiếp tục chặn các đích riêng tư/nội bộ/dùng đặc biệt.
- Bí danh cũ: `browser.ssrfPolicy.allowPrivateNetwork` vẫn được chấp nhận để tương thích.
- Chế độ chọn bật: đặt `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` để cho phép các đích riêng tư/nội bộ/dùng đặc biệt.
- Ở chế độ nghiêm ngặt, dùng `hostnameAllowlist` (mẫu như `*.example.com`) và `allowedHostnames` (ngoại lệ host chính xác, bao gồm các tên bị chặn như `localhost`) cho các ngoại lệ rõ ràng.
- Điều hướng được kiểm tra trước yêu cầu và được kiểm tra lại theo nỗ lực tốt nhất trên URL `http(s)` cuối cùng sau điều hướng để giảm các hướng chuyển dựa trên redirect.

Ví dụ chính sách nghiêm ngặt:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Hồ sơ truy cập theo agent (đa agent)

Với định tuyến đa agent, mỗi agent có thể có sandbox + chính sách công cụ riêng:
dùng điều này để cấp **quyền truy cập đầy đủ**, **chỉ đọc**, hoặc **không có quyền truy cập** theo từng agent.
Xem [Sandbox & Công cụ Đa Agent](/vi/tools/multi-agent-sandbox-tools) để biết đầy đủ chi tiết
và quy tắc ưu tiên.

Các trường hợp sử dụng phổ biến:

- Agent cá nhân: quyền truy cập đầy đủ, không sandbox
- Agent gia đình/công việc: sandbox + công cụ chỉ đọc
- Agent công khai: sandbox + không có công cụ hệ thống tệp/shell

### Ví dụ: quyền truy cập đầy đủ (không sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Ví dụ: công cụ chỉ đọc + workspace chỉ đọc

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Ví dụ: không có quyền truy cập hệ thống tệp/shell (cho phép nhắn tin qua provider)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Ứng phó sự cố

Nếu AI của bạn làm điều gì đó xấu:

### Ngăn chặn

1. **Dừng nó:** dừng ứng dụng macOS (nếu ứng dụng đó giám sát Gateway) hoặc kết thúc tiến trình `openclaw gateway` của bạn.
2. **Đóng phơi nhiễm:** đặt `gateway.bind: "loopback"` (hoặc tắt Tailscale Funnel/Serve) cho đến khi bạn hiểu chuyện gì đã xảy ra.
3. **Đóng băng quyền truy cập:** chuyển các DM/nhóm rủi ro sang `dmPolicy: "disabled"` / yêu cầu nhắc đến, và xóa các mục cho phép tất cả `"*"` nếu bạn đã có.

### Xoay vòng (giả định bị xâm phạm nếu bí mật bị rò rỉ)

1. Xoay vòng xác thực Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) và khởi động lại.
2. Xoay vòng bí mật client từ xa (`gateway.remote.token` / `.password`) trên mọi máy có thể gọi Gateway.
3. Xoay vòng thông tin xác thực provider/API (thông tin xác thực WhatsApp, token Slack/Discord, khóa model/API trong `auth-profiles.json`, và các giá trị payload bí mật đã mã hóa khi được dùng).

### Kiểm tra

1. Kiểm tra log Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (hoặc `logging.file`).
2. Xem lại transcript liên quan: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Xem lại các thay đổi cấu hình gần đây (bất cứ thứ gì có thể đã mở rộng quyền truy cập: `gateway.bind`, `gateway.auth`, chính sách DM/nhóm, `tools.elevated`, thay đổi Plugin).
4. Chạy lại `openclaw security audit --deep` và xác nhận các phát hiện nghiêm trọng đã được giải quyết.

### Thu thập cho báo cáo

- Dấu thời gian, hệ điều hành host gateway + phiên bản OpenClaw
- Transcript phiên + một đoạn cuối log ngắn (sau khi biên tập thông tin nhạy cảm)
- Kẻ tấn công đã gửi gì + agent đã làm gì
- Gateway có bị phơi ra ngoài loopback hay không (LAN/Tailscale Funnel/Serve)

## Quét bí mật

CI chạy hook pre-commit `detect-private-key` trên kho lưu trữ. Nếu nó
thất bại, hãy xóa hoặc xoay vòng vật liệu khóa đã commit, sau đó tái hiện cục bộ:

```bash
pre-commit run --all-files detect-private-key
```

## Báo cáo vấn đề bảo mật

Bạn tìm thấy lỗ hổng trong OpenClaw? Vui lòng báo cáo có trách nhiệm:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Đừng đăng công khai cho đến khi đã được sửa
3. Chúng tôi sẽ ghi công bạn (trừ khi bạn muốn ẩn danh)
