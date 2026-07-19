---
read_when:
    - Chạy hoặc cấu hình quy trình hướng dẫn thiết lập CLI
    - Thiết lập máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Làm quen qua CLI: xác minh suy luận, sau đó giao phần thiết lập còn lại cho OpenClaw'
title: Hướng dẫn thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-07-19T17:10:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c02990a37465578ec8153ffff880455b437fa8cf1e8796b89944289e0543982
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Quy trình làm quen qua CLI là cách thiết lập bằng terminal được khuyến nghị trên macOS, Linux và
Windows (gốc hoặc WSL2). Theo mặc định, quy trình này phát hiện quyền truy cập AI đã có sẵn trên
máy, xác minh bằng một lượt hoàn thành thực tế và khởi động OpenClaw để
cấu hình không gian làm việc, Gateway và các tính năng tùy chọn. `openclaw setup` chạy cùng một quy trình ([Thiết lập](/vi/cli/setup) trình bày
biến thể chỉ cấu hình `--baseline`). Người dùng máy tính Windows cũng có thể bắt đầu
từ [Windows Hub](/vi/platforms/windows).

Quy trình làm quen có hướng dẫn thiết lập khả năng suy luận trước tiên. Quy trình này phát hiện quyền truy cập AI khả dụng,
yêu cầu một lượt hoàn thành thực tế và chỉ sau đó mới khởi động [OpenClaw](/vi/cli/openclaw)
để cấu hình phần còn lại của OpenClaw. Chọn **Bỏ qua lúc này** sẽ thoát quy trình làm quen
mà không khởi động OpenClaw.

Trình hướng dẫn cổ điển vẫn khả dụng cho nhà cung cấp tùy chỉnh, thiết lập Gateway
từ xa, ghép nối kênh, điều khiển daemon, kỹ năng và nhập dữ liệu. Chạy rõ ràng
bằng `openclaw onboard --classic`; trình chọn suy luận có hướng dẫn không chuyển tiếp
sang trình này. Sau khi suy luận vượt qua kiểm tra, OpenClaw có thể dùng `open channel wizard for
<channel>` để chuyển việc thiết lập kênh cần bí mật sang trình hướng dẫn terminal có che thông tin.
Để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp, hãy thoát OpenClaw và chạy
`openclaw onboard`; OpenClaw không mở các quy trình nhà cung cấp có hướng dẫn hoặc cổ điển.

<Info>
Cách nhanh nhất để trò chuyện lần đầu: hoàn tất thiết lập có hướng dẫn, chạy `openclaw dashboard` và trò chuyện trong
trình duyệt thông qua giao diện điều khiển. Tài liệu: [Bảng điều khiển](/vi/web/dashboard).
</Info>

## Ngôn ngữ

Trình hướng dẫn bản địa hóa nội dung cố định của quy trình làm quen. Trình này dùng giá trị không trống đầu tiên trong
`OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` và `LANG`, theo thứ tự đó, rồi
chuyển về tiếng Anh nếu không có. Các ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Ghi đè rõ ràng bằng tiếng Anh
```

Tên sản phẩm, lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và
nhãn plugin/kênh vẫn ở tiếng Anh bất kể ngôn ngữ.

Để cấu hình lại các thiết lập không liên quan đến suy luận sau này:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không đồng nghĩa với chế độ không tương tác. Đối với tập lệnh, hãy dùng `--non-interactive` (xem [Tự động hóa CLI](/vi/start/wizard-cli-automation)).
</Note>

<Tip>
Trình hướng dẫn cổ điển bao gồm một bước tìm kiếm web, nơi bạn có thể chọn nhà cung cấp: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG hoặc Tavily. Một số yêu cầu khóa API; số khác
không cần khóa. Cấu hình sau bằng `openclaw configure --section web`. Tài liệu:
[Công cụ web](/vi/tools/web).
</Tip>

## Mặc định có hướng dẫn

Lệnh `openclaw onboard` thuần túy đi theo quy trình này:

1. Chấp nhận thông báo bảo mật.
2. Phát hiện các mô hình đã cấu hình, biến môi trường khóa API, CLI AI cục bộ được hỗ trợ
   và các mô hình có khả năng dùng công cụ đã được cài đặt từ máy chủ Ollama hoặc LM
   Studio có thể truy cập trên máy chủ Gateway. Lượt kiểm tra chỉ đọc này không bao giờ tải xuống
   mô hình. Các bản cài đặt Gemini CLI, Antigravity, Pi và OpenCode cũng được báo cáo
   khi chúng không thể đóng vai trò tuyến suy luận tái sử dụng cho thiết lập có hướng dẫn.
   Gemini và Antigravity không thể bắt buộc phép thăm dò không dùng công cụ; Pi và OpenCode
   là các bộ khung tác tử hoàn chỉnh thay vì các tuyến suy luận thiết lập.
3. Kiểm tra ứng viên đầu tiên được phát hiện bằng một lượt hoàn thành thực tế. Khi thất bại, hiển thị
   lý do và tiếp tục với ứng viên khả dụng tiếp theo.
4. Nếu không còn kết quả phát hiện, hãy chọn OpenAI, Anthropic, xAI (Grok), Google hoặc
   OpenRouter, hoặc chọn **Thêm…** cho các nhà cung cấp còn lại. Khu vực,
   gói dịch vụ và các phương thức trình duyệt, thiết bị, khóa API hoặc token được hỗ trợ của từng nhà cung cấp
   xuất hiện trong menu thứ hai và được kiểm tra bằng cùng một lượt hoàn thành thực tế.
   Chọn **Bỏ qua lúc này** để thoát mà không khởi động OpenClaw.
5. Chỉ lưu bền vững tuyến mô hình đã xác minh và mọi trạng thái thông tin xác thực/plugin mà tuyến đó
   yêu cầu. Các thiết lập không gian làm việc và Gateway không thay đổi.
6. Khởi động OpenClaw bằng mô hình đã xác minh để có thể cấu hình không gian làm việc,
   Gateway, kênh, tác tử, plugin và phần thiết lập tùy chọn còn lại.

Chạy lại lệnh trên một bản cài đặt đã cấu hình sẽ kiểm tra mô hình mặc định hiện tại
trước tiên, biến quy trình có hướng dẫn thành một lượt xác minh và sửa chữa. Một lượt
kiểm tra thất bại không bao giờ tự động thay thế mô hình đã cấu hình; quy trình làm quen dừng lại và
hỏi cách tiếp tục. Chạy `openclaw channels add` hoặc `openclaw configure` để
bổ sung các mục không liên quan đến suy luận sau này; dùng `openclaw onboard` để thay đổi tuyến
nhà cung cấp hoặc xác thực.

## Trình hướng dẫn cổ điển: QuickStart và Advanced

Chạy `openclaw onboard --classic` để mở trình hướng dẫn đầy đủ. Trình này bắt đầu bằng lựa chọn
giữa **QuickStart** (mặc định) và **Advanced** (toàn quyền kiểm soát). Truyền
`--flow quickstart` hoặc `--flow advanced` (bí danh `manual`) để chọn quy trình cổ điển
và bỏ qua lời nhắc đó.

<Tabs>
  <Tab title="QuickStart (mặc định)">
    - Gateway cục bộ, liên kết loopback
    - Không gian làm việc mặc định (hoặc không gian làm việc hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway bằng **Token** (tự động tạo, ngay cả trên loopback)
    - Chính sách công cụ: `tools.profile: "coding"` cho thiết lập mới (hồ sơ rõ ràng hiện có được giữ nguyên)
    - Phiên DM: quy trình làm quen giữ nguyên `session.dmScope` rõ ràng và nếu không thì để trống, vì vậy giá trị mặc định `"main"` giữ tất cả tin nhắn trực tiếp trên các kênh trong phiên chính luân phiên của tác tử—mặc định cho tác tử cá nhân. Đối với hộp thư đến dùng chung hoặc nhiều người dùng, hãy dùng `"per-channel-peer"`; `openclaw security audit` khuyến nghị cô lập khi phát hiện lưu lượng DM nhiều người dùng. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Mức hiển thị Tailscale **Tắt**
    - DM Telegram và WhatsApp mặc định dùng **danh sách cho phép**: Telegram yêu cầu ID người dùng Telegram dạng số, WhatsApp yêu cầu số điện thoại

  </Tab>
  <Tab title="Advanced (toàn quyền kiểm soát)">
    - Hiển thị mọi bước: chế độ, không gian làm việc, Gateway, kênh, daemon, kỹ năng

  </Tab>
</Tabs>

Chế độ từ xa (`--mode remote`) luôn dùng quy trình nâng cao; chế độ này chỉ
cấu hình máy này để kết nối với một Gateway ở nơi khác và không bao giờ cài đặt
hoặc thay đổi bất cứ thứ gì trên máy chủ từ xa.

## Những gì quy trình làm quen cổ điển cấu hình

Chế độ cục bộ (mặc định) lần lượt thực hiện các bước sau:

1. **Mô hình/Xác thực** - chọn quy trình xác thực của nhà cung cấp (khóa API, OAuth hoặc
   xác thực thủ công dành riêng cho nhà cung cấp), bao gồm Nhà cung cấp tùy chỉnh
   (tương thích OpenAI, tương thích OpenAI Responses, tương thích Anthropic hoặc
   tự động phát hiện Không xác định). Chọn mô hình mặc định.
   Thiết lập khóa API OpenAI mới mặc định dùng `openai/gpt-5.6` (ID API trực tiếp
   thuần túy được phân giải thành Sol); thiết lập ChatGPT/Codex mới mặc định dùng
   `openai/gpt-5.6-sol`. Chạy lại thiết lập sẽ giữ nguyên mô hình rõ ràng hiện có,
   bao gồm `openai/gpt-5.5`. Chọn rõ ràng `openai/gpt-5.5` nếu
   tài khoản không cung cấp GPT-5.6.
   Lưu ý bảo mật: nếu tác tử này sẽ chạy công cụ hoặc xử lý nội dung
   webhook/hook, hãy ưu tiên mô hình thế hệ mới nhất, mạnh nhất hiện có và giữ
   chính sách công cụ nghiêm ngặt - các cấp yếu hơn hoặc cũ hơn dễ bị chèn câu lệnh hơn.
   Đối với các lượt chạy không tương tác, `--secret-input-mode ref` lưu các tham chiếu dựa trên biến môi trường
   thay vì giá trị khóa API dạng văn bản thuần; biến môi trường được tham chiếu phải được
   đặt sẵn, nếu không quy trình làm quen sẽ thất bại ngay. Chế độ tham chiếu bí mật tương tác có thể
   trỏ đến một biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình (`file` hoặc
   `exec`), với lượt kiểm tra sơ bộ nhanh trước khi lưu. Sau khi thiết lập mô hình/xác thực,
   trình hướng dẫn cung cấp một lượt kiểm tra hoàn thành trực tiếp tùy chọn; khi thất bại, có thể quay lại
   thiết lập mô hình/xác thực một lần hoặc bỏ qua mà không chặn phần còn lại của
   trình hướng dẫn cổ điển. Việc bỏ qua không mở khóa OpenClaw; thiết lập hội thoại
   vẫn yêu cầu kiểm tra suy luận thành công.
2. **Không gian làm việc** - thư mục dành cho tệp tác tử (mặc định `~/.openclaw/workspace`). Khởi tạo các tệp bootstrap.
3. **Gateway** - cổng, địa chỉ liên kết, chế độ xác thực, mức hiển thị Tailscale. Trong
   chế độ token tương tác, chọn lưu trữ token dạng văn bản thuần (mặc định) hoặc chọn
   dùng SecretRef. Đường dẫn SecretRef không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** - các kênh trò chuyện tích hợp và plugin chính thức, bao gồm
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp và nhiều kênh khác.
5. **Daemon** - cài đặt LaunchAgent (macOS), đơn vị người dùng systemd
   (Linux/WSL2) hoặc Tác vụ theo lịch gốc của Windows với cơ chế dự phòng
   bằng thư mục Khởi động riêng cho từng người dùng.
   Nếu xác thực token là bắt buộc và `gateway.auth.token` được SecretRef quản lý,
   quá trình cài đặt daemon sẽ xác minh nhưng không lưu token đã phân giải vào
   siêu dữ liệu môi trường dịch vụ giám sát; SecretRef chưa phân giải sẽ chặn
   cài đặt và cung cấp hướng dẫn. Nếu cả `gateway.auth.token` và
   `gateway.auth.password` đều được đặt trong khi `gateway.auth.mode` chưa được đặt, quá trình cài đặt
   sẽ bị chặn cho đến khi bạn đặt chế độ rõ ràng.
6. **Kiểm tra tình trạng** - khởi động Gateway và xác minh có thể truy cập.
7. **Skills** - cài đặt các kỹ năng được khuyến nghị và phần phụ thuộc tùy chọn của chúng.

<Note>
Chạy lại quy trình làm quen **không** xóa bất kỳ thứ gì trừ khi bạn chọn rõ ràng
**Đặt lại** (hoặc truyền `--reset`). Lệnh CLI `--reset` mặc định áp dụng cho cấu hình, thông tin xác thực
và phiên; dùng `--reset-scope full` để xóa cả không gian làm việc. Nếu
cấu hình không hợp lệ hoặc chứa khóa cũ, quy trình làm quen yêu cầu bạn chạy
`openclaw doctor` trước.
</Note>

`--flow import` chạy quy trình di chuyển được phát hiện (ví dụ Hermes) trong
trình hướng dẫn cổ điển thay vì thiết lập mới; xem [Di chuyển](/vi/cli/migrate) và các hướng dẫn di chuyển trong
[Cài đặt](/vi/install/migrating-hermes). `openclaw onboard --modern` là
bí danh tương thích cho [OpenClaw](/vi/cli/openclaw). Lệnh này dùng cùng
cổng kiểm tra suy luận như `openclaw setup`: suy luận đã xác minh sẽ khởi động
trợ lý, còn lỗi tương tác sẽ quay về thiết lập suy luận có hướng dẫn.

## Thêm tác tử khác

Dùng `openclaw agents add <name>` để tạo một tác tử riêng biệt có
không gian làm việc, phiên và hồ sơ xác thực riêng. Chạy không có `--workspace` sẽ bắt đầu
quy trình tương tác cho tên, không gian làm việc, xác thực, kênh và liên kết - đây
không phải trình hướng dẫn `openclaw onboard` đầy đủ.

Nội dung được thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Lưu ý:

- Không gian làm việc mặc định: `~/.openclaw/workspace-<agentId>` (hoặc trong
  `agents.defaults.workspace` nếu giá trị đó được đặt).
- Thêm `bindings` để định tuyến tin nhắn đến cho tác tử này (quy trình làm quen có thể thực hiện việc này cho bạn).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để biết chi tiết về hành vi từng bước và đầu ra cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu đầy đủ về cờ, hãy xem [`openclaw onboard`](/vi/cli/onboard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan về quy trình làm quen: [Tổng quan về quy trình làm quen](/vi/start/onboarding-overview)
- Quy trình làm quen với ứng dụng macOS: [Quy trình làm quen](/vi/start/onboarding)
- Nghi thức chạy lần đầu của tác tử: [Khởi tạo tác tử](/vi/start/bootstrapping)
