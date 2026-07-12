---
read_when:
    - Chạy hoặc cấu hình quy trình thiết lập ban đầu bằng CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Hướng dẫn thiết lập ban đầu bằng CLI: xác minh quá trình suy luận, sau đó giao phần thiết lập còn lại cho Crestodian'
title: Thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-07-12T08:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Quy trình làm quen qua CLI là cách thiết lập bằng thiết bị đầu cuối được khuyến nghị trên macOS, Linux và Windows (nguyên bản hoặc WSL2). Theo mặc định, quy trình này phát hiện quyền truy cập AI đã có trên máy, xác minh bằng một lượt hoàn thành thực tế, rồi khởi động Crestodian để cấu hình không gian làm việc, Gateway và các tính năng tùy chọn. `openclaw setup` chạy cùng quy trình ([Thiết lập](/vi/cli/setup) trình bày biến thể chỉ cấu hình `--baseline`). Người dùng máy tính Windows cũng có thể bắt đầu từ [Windows Hub](/vi/platforms/windows).

Quy trình làm quen có hướng dẫn thiết lập suy luận trước tiên. Quy trình phát hiện quyền truy cập AI hiện có, yêu cầu một lượt hoàn thành thực tế và chỉ sau đó mới khởi động [Crestodian](/vi/cli/crestodian) để cấu hình phần còn lại của OpenClaw. Trong quy trình có hướng dẫn, không có Crestodian trước bước suy luận hoặc đường dẫn bỏ qua AI.

Trình hướng dẫn cổ điển vẫn khả dụng để đăng nhập nhà cung cấp, thiết lập Gateway từ xa, ghép nối kênh, điều khiển daemon, Skills và nhập dữ liệu. Chạy trình này một cách tường minh bằng `openclaw onboard --classic`; màn hình ứng viên suy luận có hướng dẫn không chuyển tiếp vào trình này. Sau khi suy luận vượt qua kiểm tra, Crestodian có thể dùng `open channel wizard for <channel>` để chuyển phần thiết lập kênh cần thông tin bí mật sang một trình hướng dẫn thiết bị đầu cuối có che nội dung. Để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp, hãy thoát Crestodian và chạy `openclaw onboard`; Crestodian không mở các quy trình nhà cung cấp có hướng dẫn hoặc cổ điển.

<Info>
Cách nhanh nhất để bắt đầu cuộc trò chuyện đầu tiên: hoàn tất thiết lập có hướng dẫn, chạy `openclaw dashboard` và trò chuyện trong trình duyệt qua Giao diện điều khiển. Tài liệu: [Bảng điều khiển](/vi/web/dashboard).
</Info>

## Ngôn ngữ

Trình hướng dẫn bản địa hóa nội dung cố định của quy trình làm quen. Thứ tự phân giải: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`, rồi đến tiếng Anh. Các ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Tên sản phẩm, lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và nhãn plugin/kênh vẫn giữ nguyên bằng tiếng Anh bất kể ngôn ngữ.

Để cấu hình lại các thiết lập không liên quan đến suy luận sau này:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không mặc nhiên bật chế độ không tương tác. Đối với tập lệnh, hãy dùng `--non-interactive` (xem [Tự động hóa CLI](/vi/start/wizard-cli-automation)).
</Note>

<Tip>
Trình hướng dẫn cổ điển có một bước tìm kiếm web, tại đó bạn có thể chọn nhà cung cấp: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp cần khóa API; số khác không cần khóa. Cấu hình phần này sau bằng `openclaw configure --section web`. Tài liệu: [Công cụ web](/vi/tools/web).
</Tip>

## Quy trình có hướng dẫn mặc định

Lệnh `openclaw onboard` thuần túy đi theo quy trình sau:

1. Chấp nhận thông báo bảo mật.
2. Phát hiện các mô hình đã cấu hình, biến môi trường chứa khóa API và các CLI AI cục bộ được hỗ trợ.
3. Kiểm tra ứng viên đầu tiên được phát hiện bằng một lượt hoàn thành thực tế. Nếu thất bại, hiển thị lý do và tiếp tục với ứng viên khả dụng tiếp theo.
4. Nếu đã thử hết các kết quả phát hiện, thử lại một ứng viên đã phát hiện hoặc nhập khóa API của nhà cung cấp trong lời nhắc có che nội dung. Quy trình làm quen có hướng dẫn không cung cấp Crestodian hoặc tùy chọn thoát bỏ qua AI trước khi suy luận hoạt động.
5. Chỉ lưu lâu dài tuyến mô hình đã xác minh cùng mọi trạng thái thông tin xác thực/Plugin mà tuyến đó yêu cầu. Các thiết lập không gian làm việc và Gateway không bị thay đổi.
6. Khởi động Crestodian với mô hình đã xác minh để công cụ này có thể cấu hình không gian làm việc, Gateway, các kênh, tác nhân, plugin và phần thiết lập tùy chọn còn lại.

Khi chạy lại lệnh trên một bản cài đặt đã cấu hình, quy trình sẽ kiểm tra mô hình mặc định hiện tại trước, nhờ đó quy trình có hướng dẫn đóng vai trò như một lượt xác minh và sửa chữa. Một lần kiểm tra thất bại không bao giờ tự động thay thế mô hình đã cấu hình; quy trình làm quen dừng lại và hỏi cách tiếp tục. Chạy `openclaw channels add` hoặc `openclaw configure` để bổ sung các mục không liên quan đến suy luận sau này; dùng `openclaw onboard` để thay đổi tuyến nhà cung cấp hoặc tuyến xác thực.

## Trình hướng dẫn cổ điển: Khởi động nhanh và Nâng cao

Chạy `openclaw onboard --classic` để mở trình hướng dẫn đầy đủ. Trình này bắt đầu bằng lựa chọn giữa **Khởi động nhanh** (giá trị mặc định) và **Nâng cao** (toàn quyền kiểm soát). Truyền `--flow quickstart` hoặc `--flow advanced` (bí danh `manual`) để chọn quy trình cổ điển và bỏ qua lời nhắc đó.

<Tabs>
  <Tab title="Khởi động nhanh (giá trị mặc định)">
    - Gateway cục bộ, liên kết local loopback
    - Không gian làm việc mặc định (hoặc không gian làm việc hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway bằng **Token** (tự động tạo, kể cả trên local loopback)
    - Chính sách công cụ: `tools.profile: "coding"` cho thiết lập mới (hồ sơ tường minh hiện có được giữ nguyên)
    - Cô lập tin nhắn trực tiếp: `session.dmScope: "per-channel-peer"` cho thiết lập mới. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Khả năng truy cập qua Tailscale **Tắt**
    - Tin nhắn trực tiếp trên Telegram và WhatsApp mặc định dùng **danh sách cho phép**: Telegram yêu cầu ID người dùng Telegram dạng số, WhatsApp yêu cầu số điện thoại

  </Tab>
  <Tab title="Nâng cao (toàn quyền kiểm soát)">
    - Hiển thị mọi bước: chế độ, không gian làm việc, Gateway, các kênh, daemon, Skills

  </Tab>
</Tabs>

Chế độ từ xa (`--mode remote`) luôn dùng quy trình nâng cao; chế độ này chỉ cấu hình máy hiện tại để kết nối với một Gateway ở nơi khác và không bao giờ cài đặt hoặc thay đổi bất cứ thứ gì trên máy chủ từ xa.

## Những gì quy trình làm quen cổ điển cấu hình

Chế độ cục bộ (mặc định) lần lượt thực hiện các bước sau:

1. **Mô hình/Xác thực** - chọn một quy trình xác thực nhà cung cấp (khóa API, OAuth hoặc xác thực thủ công dành riêng cho nhà cung cấp), bao gồm Nhà cung cấp tùy chỉnh (tương thích với OpenAI, tương thích với OpenAI Responses, tương thích với Anthropic hoặc tự động phát hiện Không xác định). Chọn một mô hình mặc định.
   Thiết lập mới bằng khóa API OpenAI mặc định dùng `openai/gpt-5.6` (ID API trực tiếp không có tiền tố được phân giải thành Sol); thiết lập ChatGPT/Codex mới mặc định dùng `openai/gpt-5.6-sol`. Việc chạy lại thiết lập giữ nguyên mô hình tường minh hiện có, bao gồm `openai/gpt-5.5`. Hãy chọn tường minh `openai/gpt-5.5` nếu tài khoản không cung cấp GPT-5.6.
   Lưu ý bảo mật: nếu tác nhân này sẽ chạy công cụ hoặc xử lý nội dung Webhook/hook, hãy ưu tiên mô hình thế hệ mới nhất và mạnh nhất hiện có, đồng thời duy trì chính sách công cụ nghiêm ngặt - các cấp yếu hơn hoặc cũ hơn dễ bị chèn chỉ thị qua lời nhắc hơn.
   Đối với các lượt chạy không tương tác, `--secret-input-mode ref` lưu tham chiếu dựa trên biến môi trường thay vì giá trị khóa API ở dạng văn bản thuần; biến môi trường được tham chiếu phải được đặt sẵn, nếu không quy trình làm quen sẽ thất bại ngay. Chế độ tham chiếu thông tin bí mật tương tác có thể trỏ đến một biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình (`file` hoặc `exec`), kèm một lượt kiểm tra sơ bộ nhanh trước khi lưu. Sau khi thiết lập mô hình/xác thực, trình hướng dẫn cung cấp một lượt kiểm tra hoàn thành trực tiếp tùy chọn; khi thất bại, bạn có thể quay lại thiết lập mô hình/xác thực một lần hoặc bỏ qua mà không chặn phần còn lại của trình hướng dẫn cổ điển. Việc bỏ qua không mở khóa Crestodian; thiết lập qua hội thoại vẫn yêu cầu kiểm tra suy luận thành công.
2. **Không gian làm việc** - thư mục dành cho các tệp của tác nhân (mặc định `~/.openclaw/workspace`). Khởi tạo các tệp bootstrap.
3. **Gateway** - cổng, địa chỉ liên kết, chế độ xác thực, khả năng truy cập qua Tailscale. Trong chế độ token tương tác, chọn lưu token dưới dạng văn bản thuần (mặc định) hoặc chủ động dùng SecretRef. Đường dẫn SecretRef không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Các kênh** - các kênh trò chuyện tích hợp sẵn và Plugin chính thức, bao gồm Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp và nhiều kênh khác.
5. **Daemon** - cài đặt LaunchAgent (macOS), đơn vị người dùng systemd (Linux/WSL2) hoặc Tác vụ theo lịch nguyên bản của Windows với phương án dự phòng bằng thư mục Khởi động theo từng người dùng.
   Nếu bắt buộc xác thực bằng token và `gateway.auth.token` được quản lý bằng SecretRef, quá trình cài đặt daemon sẽ xác minh token nhưng không lưu lâu dài token đã phân giải vào siêu dữ liệu môi trường dịch vụ của trình giám sát; SecretRef chưa phân giải sẽ chặn cài đặt và cung cấp hướng dẫn. Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được đặt trong khi `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi bạn đặt chế độ một cách tường minh.
6. **Kiểm tra tình trạng** - khởi động Gateway và xác minh có thể kết nối tới Gateway.
7. **Skills** - cài đặt các Skills được khuyến nghị và những phần phụ thuộc tùy chọn của chúng.

<Note>
Việc chạy lại quy trình làm quen **không** xóa bất cứ thứ gì trừ khi bạn chọn tường minh **Đặt lại** (hoặc truyền `--reset`). Tùy chọn `--reset` của CLI mặc định đặt lại cấu hình, thông tin xác thực và phiên; dùng `--reset-scope full` để xóa cả không gian làm việc. Nếu cấu hình không hợp lệ hoặc chứa các khóa cũ, quy trình làm quen sẽ yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

`--flow import` chạy một quy trình di chuyển được phát hiện (ví dụ Hermes) trong trình hướng dẫn cổ điển thay vì thiết lập mới; xem [Di chuyển](/vi/cli/migrate) và các hướng dẫn di chuyển trong [Cài đặt](/vi/install/migrating-hermes). `openclaw onboard --modern` là một bí danh tương thích cho [Crestodian](/vi/cli/crestodian). Lệnh này dùng cùng cổng kiểm tra suy luận như `openclaw crestodian`: suy luận đã xác minh sẽ khởi động trợ lý, còn thất bại trong chế độ tương tác sẽ quay lại thiết lập suy luận có hướng dẫn.

## Thêm một tác nhân khác

Dùng `openclaw agents add <name>` để tạo một tác nhân riêng biệt có không gian làm việc, phiên và hồ sơ xác thực riêng. Chạy mà không có `--workspace` sẽ khởi động quy trình tương tác để thiết lập tên, không gian làm việc, xác thực, các kênh và liên kết - đây không phải là trình hướng dẫn `openclaw onboard` đầy đủ.

Các giá trị được thiết lập:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Lưu ý:

- Không gian làm việc mặc định: `~/.openclaw/workspace-<agentId>` (hoặc nằm dưới `agents.defaults.workspace` nếu giá trị đó đã được đặt).
- Thêm `bindings` để định tuyến tin nhắn đến cho tác nhân này (quy trình làm quen có thể thực hiện việc này cho bạn).
- Các cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để biết hành vi chi tiết theo từng bước và đầu ra cấu hình, xem [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem các ví dụ không tương tác, xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu đầy đủ về các cờ, xem [`openclaw onboard`](/vi/cli/onboard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan về quy trình làm quen: [Tổng quan về quy trình làm quen](/vi/start/onboarding-overview)
- Quy trình làm quen trong ứng dụng macOS: [Quy trình làm quen](/vi/start/onboarding)
- Nghi thức chạy lần đầu của tác nhân: [Khởi tạo tác nhân](/vi/start/bootstrapping)
