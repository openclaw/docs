---
read_when:
    - Chạy hoặc cấu hình quy trình làm quen qua CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Quy trình làm quen qua CLI: xác minh suy luận, sau đó giao phần thiết lập còn lại cho OpenClaw'
title: Thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-07-16T15:06:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Quy trình thiết lập ban đầu bằng CLI là cách thiết lập qua terminal được khuyến nghị trên macOS, Linux và
Windows (gốc hoặc WSL2). Theo mặc định, quy trình này phát hiện quyền truy cập AI đã có sẵn trên
máy, xác minh bằng một lượt hoàn thành thực tế, rồi khởi động OpenClaw để
cấu hình không gian làm việc, Gateway và các tính năng tùy chọn. `openclaw setup` chạy cùng quy trình ([Thiết lập](/vi/cli/setup) trình bày
biến thể chỉ cấu hình `--baseline`). Người dùng máy tính Windows cũng có thể bắt đầu
từ [Windows Hub](/vi/platforms/windows).

Quy trình thiết lập ban đầu có hướng dẫn sẽ thiết lập suy luận trước tiên. Quy trình này phát hiện quyền truy cập AI hiện có,
yêu cầu một lượt hoàn thành thực tế và chỉ sau đó mới khởi động [OpenClaw](/cli/openclaw)
để cấu hình phần còn lại của OpenClaw. Chọn **Bỏ qua lúc này** sẽ thoát khỏi quy trình thiết lập ban đầu
mà không khởi động OpenClaw.

Trình hướng dẫn cổ điển vẫn có sẵn cho nhà cung cấp tùy chỉnh, thiết lập Gateway
từ xa, ghép nối kênh, điều khiển daemon, Skills và nhập dữ liệu. Chạy trình này một cách tường minh
bằng `openclaw onboard --classic`; trình chọn suy luận có hướng dẫn không chuyển tiếp
sang đó. Sau khi suy luận vượt qua kiểm tra, OpenClaw có thể dùng `open channel wizard for
<channel>` để chuyển phần thiết lập kênh cần bí mật sang một trình hướng dẫn terminal có che thông tin.
Để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp, hãy thoát OpenClaw và chạy
`openclaw onboard`; OpenClaw không mở các quy trình nhà cung cấp có hướng dẫn hoặc cổ điển.

<Info>
Cách nhanh nhất để bắt đầu trò chuyện: hoàn tất thiết lập có hướng dẫn, chạy `openclaw dashboard` và trò chuyện trong
trình duyệt qua Control UI. Tài liệu: [Bảng điều khiển](/vi/web/dashboard).
</Info>

## Ngôn ngữ

Trình hướng dẫn bản địa hóa nội dung cố định của quy trình thiết lập ban đầu. Thứ tự phân giải: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, rồi đến tiếng Anh. Các ngôn ngữ được hỗ trợ: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Tên sản phẩm, lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và
nhãn plugin/kênh luôn giữ nguyên bằng tiếng Anh bất kể ngôn ngữ.

Để cấu hình lại các cài đặt không liên quan đến suy luận sau này:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không đồng nghĩa với chế độ không tương tác. Đối với tập lệnh, hãy dùng `--non-interactive` (xem [Tự động hóa CLI](/vi/start/wizard-cli-automation)).
</Note>

<Tip>
Trình hướng dẫn cổ điển bao gồm một bước tìm kiếm web để bạn có thể chọn nhà cung cấp: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp cần khóa API; số khác
không cần khóa. Cấu hình phần này sau bằng `openclaw configure --section web`. Tài liệu:
[Công cụ web](/vi/tools/web).
</Tip>

## Mặc định có hướng dẫn

Lệnh `openclaw onboard` thuần túy tuân theo quy trình sau:

1. Chấp nhận thông báo bảo mật.
2. Phát hiện các mô hình đã cấu hình, biến môi trường chứa khóa API, CLI AI cục bộ được hỗ trợ
   và các mô hình có khả năng dùng công cụ đã được cài đặt từ các máy chủ Ollama hoặc LM
   Studio có thể truy cập trên máy chủ Gateway. Lượt chỉ đọc này không bao giờ tải xuống
   mô hình. Các bản cài đặt Gemini CLI và Antigravity được báo cáo nhưng không được tự động kiểm tra
   vì chúng không thể bắt buộc một phép thử không dùng công cụ.
3. Kiểm tra ứng viên đầu tiên được phát hiện bằng một lượt hoàn thành thực tế. Khi thất bại, hiển thị
   lý do và tiếp tục với ứng viên khả dụng tiếp theo.
4. Nếu đã thử hết các mục phát hiện, hãy chọn OpenAI, Anthropic, xAI (Grok), Google hoặc
   OpenRouter, hoặc chọn **Thêm…** để xem các nhà cung cấp còn lại. Khu vực,
   gói dịch vụ và các phương thức trình duyệt, thiết bị, khóa API hoặc token được hỗ trợ của từng nhà cung cấp
   xuất hiện trong menu thứ hai và được kiểm tra bằng cùng một lượt hoàn thành thực tế.
   Chọn **Bỏ qua lúc này** để thoát mà không khởi động OpenClaw.
5. Chỉ lưu bền vững tuyến mô hình đã xác minh cùng mọi trạng thái thông tin xác thực/plugin mà tuyến đó
   yêu cầu. Các cài đặt không gian làm việc và Gateway vẫn không thay đổi.
6. Khởi động OpenClaw bằng mô hình đã xác minh để OpenClaw có thể cấu hình không gian làm việc,
   Gateway, các kênh, agent, plugin và phần thiết lập tùy chọn còn lại.

Việc chạy lại lệnh trên một bản cài đặt đã cấu hình sẽ kiểm tra mô hình mặc định hiện tại
trước tiên, nhờ đó biến quy trình có hướng dẫn thành một lượt xác minh và sửa chữa. Kiểm tra thất bại
không bao giờ tự động thay thế mô hình đã cấu hình; quy trình thiết lập ban đầu sẽ dừng và
hỏi cách tiếp tục. Chạy `openclaw channels add` hoặc `openclaw configure` để
bổ sung các phần không liên quan đến suy luận sau này; dùng `openclaw onboard` để thay đổi tuyến
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
    - Xác thực Gateway **Token** (được tự động tạo, kể cả trên loopback)
    - Chính sách công cụ: `tools.profile: "coding"` cho thiết lập mới (hồ sơ tường minh hiện có được giữ nguyên)
    - Cô lập DM: `session.dmScope: "per-channel-peer"` cho thiết lập mới. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Khả năng truy cập qua Tailscale **Tắt**
    - DM Telegram và WhatsApp mặc định dùng **danh sách cho phép**: Telegram yêu cầu ID người dùng Telegram dạng số, WhatsApp yêu cầu số điện thoại

  </Tab>
  <Tab title="Advanced (toàn quyền kiểm soát)">
    - Hiển thị mọi bước: chế độ, không gian làm việc, Gateway, kênh, daemon, Skills

  </Tab>
</Tabs>

Chế độ từ xa (`--mode remote`) luôn sử dụng quy trình nâng cao; chế độ này chỉ
cấu hình máy hiện tại để kết nối đến một Gateway ở nơi khác và không bao giờ cài đặt
hoặc thay đổi bất cứ thứ gì trên máy chủ từ xa.

## Những gì quy trình thiết lập ban đầu cổ điển cấu hình

Chế độ cục bộ (mặc định) hướng dẫn qua các bước sau:

1. **Mô hình/Xác thực** - chọn quy trình xác thực của nhà cung cấp (khóa API, OAuth hoặc
   xác thực thủ công riêng của nhà cung cấp), bao gồm Nhà cung cấp tùy chỉnh
   (tương thích OpenAI, tương thích OpenAI Responses, tương thích Anthropic hoặc
   tự động phát hiện không xác định). Chọn một mô hình mặc định.
   Thiết lập mới bằng khóa API OpenAI mặc định dùng `openai/gpt-5.6` (ID API trực tiếp
   thuần túy được phân giải thành Sol); thiết lập ChatGPT/Codex mới mặc định dùng
   `openai/gpt-5.6-sol`. Chạy lại thiết lập sẽ giữ nguyên mô hình tường minh hiện có,
   bao gồm `openai/gpt-5.5`. Chọn tường minh `openai/gpt-5.5` nếu
   tài khoản không cung cấp GPT-5.6.
   Lưu ý bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung
   webhook/hook, hãy ưu tiên mô hình thế hệ mới nhất mạnh nhất hiện có và giữ
   chính sách công cụ nghiêm ngặt - các cấp yếu hơn hoặc cũ hơn dễ bị chèn lệnh nhắc hơn.
   Đối với lượt chạy không tương tác, `--secret-input-mode ref` lưu các tham chiếu dựa trên biến môi trường
   thay vì giá trị khóa API dạng văn bản thuần túy; biến môi trường được tham chiếu phải được đặt sẵn,
   nếu không quy trình thiết lập ban đầu sẽ thất bại ngay. Chế độ tham chiếu bí mật tương tác có thể
   trỏ đến một biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình (`file` hoặc
   `exec`), với bước kiểm tra sơ bộ nhanh trước khi lưu. Sau khi thiết lập mô hình/xác thực,
   trình hướng dẫn cung cấp một phép kiểm tra hoàn thành trực tiếp tùy chọn; khi thất bại, có thể quay lại
   thiết lập mô hình/xác thực một lần hoặc bỏ qua mà không chặn phần còn lại của
   trình hướng dẫn cổ điển. Việc bỏ qua không mở khóa OpenClaw; thiết lập hội thoại
   vẫn yêu cầu kiểm tra suy luận thành công.
2. **Không gian làm việc** - thư mục cho các tệp của agent (mặc định `~/.openclaw/workspace`). Tạo sẵn các tệp bootstrap.
3. **Gateway** - cổng, địa chỉ liên kết, chế độ xác thực, khả năng truy cập qua Tailscale. Trong
   chế độ token tương tác, chọn lưu trữ token dạng văn bản thuần túy (mặc định) hoặc chọn
   dùng SecretRef. Đường dẫn SecretRef không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** - các kênh trò chuyện tích hợp sẵn và plugin chính thức, bao gồm
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp và nhiều kênh khác.
5. **Daemon** - cài đặt LaunchAgent (macOS), đơn vị người dùng systemd
   (Linux/WSL2) hoặc Windows Scheduled Task gốc với phương án dự phòng là thư mục
   Startup theo từng người dùng.
   Nếu xác thực token là bắt buộc và `gateway.auth.token` được SecretRef quản lý,
   quá trình cài đặt daemon sẽ xác thực tham chiếu đó nhưng không lưu token đã phân giải vào
   siêu dữ liệu môi trường dịch vụ của trình giám sát; SecretRef chưa phân giải sẽ chặn
   cài đặt và cung cấp hướng dẫn. Nếu cả `gateway.auth.token` và
   `gateway.auth.password` đều được đặt trong khi `gateway.auth.mode` chưa được đặt, quá trình cài đặt
   sẽ bị chặn cho đến khi bạn đặt chế độ một cách tường minh.
6. **Kiểm tra tình trạng** - khởi động Gateway và xác minh có thể truy cập.
7. **Skills** - cài đặt các skill được khuyến nghị và phần phụ thuộc tùy chọn của chúng.

<Note>
Chạy lại quy trình thiết lập ban đầu **không** xóa bất cứ thứ gì trừ khi bạn chọn tường minh
**Đặt lại** (hoặc truyền `--reset`). Lệnh CLI `--reset` mặc định xóa cấu hình, thông tin xác thực
và phiên; dùng `--reset-scope full` để xóa cả không gian làm việc. Nếu
cấu hình không hợp lệ hoặc chứa khóa cũ, quy trình thiết lập ban đầu sẽ yêu cầu bạn chạy
`openclaw doctor` trước.
</Note>

`--flow import` chạy quy trình di chuyển được phát hiện (ví dụ Hermes) trong
trình hướng dẫn cổ điển thay vì thiết lập mới; xem [Di chuyển](/vi/cli/migrate) và các hướng dẫn di chuyển trong
[Cài đặt](/vi/install/migrating-hermes). `openclaw onboard --modern` là
bí danh tương thích cho [OpenClaw](/cli/openclaw). Lệnh này sử dụng cùng
cổng kiểm tra suy luận như `openclaw setup`: suy luận đã xác minh sẽ khởi động
trợ lý, còn lỗi tương tác sẽ quay lại thiết lập suy luận có hướng dẫn.

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng biệt có
không gian làm việc, phiên và hồ sơ xác thực riêng. Chạy mà không có `--workspace` sẽ bắt đầu
quy trình tương tác cho tên, không gian làm việc, xác thực, kênh và liên kết - đây
không phải là trình hướng dẫn `openclaw onboard` đầy đủ.

Nội dung được thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Lưu ý:

- Không gian làm việc mặc định: `~/.openclaw/workspace-<agentId>` (hoặc nằm dưới
  `agents.defaults.workspace` nếu biến đó được đặt).
- Thêm `bindings` để định tuyến tin nhắn đến cho agent này (quy trình thiết lập ban đầu có thể thực hiện việc này cho bạn).
- Các cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để biết hành vi chi tiết theo từng bước và đầu ra cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem các ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu đầy đủ về các cờ, hãy xem [`openclaw onboard`](/vi/cli/onboard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan về thiết lập ban đầu: [Tổng quan về thiết lập ban đầu](/vi/start/onboarding-overview)
- Thiết lập ban đầu cho ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Nghi thức chạy lần đầu của agent: [Khởi tạo agent](/vi/start/bootstrapping)
