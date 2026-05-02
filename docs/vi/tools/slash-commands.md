---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền
sidebarTitle: Slash commands
summary: 'Lệnh gạch chéo: văn bản so với dạng native, cấu hình và các lệnh được hỗ trợ'
title: Lệnh dấu gạch chéo
x-i18n:
    generated_at: "2026-05-02T20:58:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Lệnh được Gateway xử lý. Hầu hết lệnh phải được gửi dưới dạng tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh chat bash chỉ dành cho host dùng `! <cmd>` (với `/bash <cmd>` là bí danh).

Khi một cuộc trò chuyện hoặc luồng được liên kết với một phiên ACP, văn bản theo dõi thông thường sẽ được định tuyến đến harness ACP đó. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh ACP của OpenClaw, còn `/status` cùng `/unfocus` vẫn ở cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

Có hai hệ thống liên quan:

<AccordionGroup>
  <Accordion title="Commands">
    Tin nhắn `/...` độc lập.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Chỉ thị được loại bỏ khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong tin nhắn chat thông thường (không chỉ gồm chỉ thị), chúng được xem là "gợi ý nội tuyến" và **không** duy trì cài đặt phiên.
    - Trong tin nhắn chỉ gồm chỉ thị (tin nhắn chỉ chứa các chỉ thị), chúng được lưu vào phiên và phản hồi bằng một xác nhận.
    - Chỉ thị chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là danh sách cho phép duy nhất được dùng; nếu không, ủy quyền đến từ danh sách cho phép/ghép nối của kênh cộng với `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Chỉ người gửi trong danh sách cho phép/được ủy quyền: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Chúng chạy ngay lập tức, được loại bỏ trước khi mô hình nhìn thấy tin nhắn, và phần văn bản còn lại tiếp tục đi qua luồng bình thường.

  </Accordion>
</AccordionGroup>

## Cấu hình

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Bật phân tích `/...` trong tin nhắn chat. Trên các bề mặt không có lệnh gốc (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này thành `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm lệnh slash); bị bỏ qua với các provider không có hỗ trợ gốc. Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo từng provider (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó trên Discord/Telegram khi khởi động. Lệnh Slack được quản lý trong ứng dụng Slack và không tự động bị xóa.
</ParamField>
Trên Discord, đặc tả lệnh gốc có thể bao gồm `descriptionLocalizations`, được OpenClaw xuất bản dưới dạng `description_localizations` của Discord và đưa vào các so sánh đối chiếu.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh **skill** theo cách gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một lệnh slash cho mỗi skill). Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo từng provider (bool hoặc `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell trên host (`/bash <cmd>` là bí danh; yêu cầu danh sách cho phép `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kiểm soát thời gian bash chờ trước khi chuyển sang chế độ nền (`0` đưa vào nền ngay lập tức).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý trong `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái plugin cộng với cài đặt và điều khiển bật/tắt).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè chỉ trong runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` cộng với các hành động công cụ khởi động lại gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Đặt danh sách cho phép chủ sở hữu rõ ràng cho các bề mặt lệnh/công cụ chỉ dành cho chủ sở hữu. Đây là tài khoản người vận hành có thể phê duyệt hành động nguy hiểm và chạy các lệnh như `/diagnostics`, `/export-trajectory`, và `/config`. Nó tách biệt với `commands.allowFrom` và quyền truy cập ghép nối DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: làm cho các lệnh chỉ dành cho chủ sở hữu yêu cầu **danh tính chủ sở hữu** để chạy trên bề mặt đó. Khi `true`, người gửi phải khớp với một ứng viên chủ sở hữu đã được phân giải (ví dụ một mục trong `commands.ownerAllowFrom` hoặc metadata chủ sở hữu gốc của provider) hoặc có phạm vi nội bộ `operator.admin` trên một kênh tin nhắn nội bộ. Một mục ký tự đại diện trong `allowFrom` của kênh, hoặc danh sách ứng viên chủ sở hữu trống/chưa được phân giải, là **không** đủ — các lệnh chỉ dành cho chủ sở hữu sẽ thất bại theo hướng đóng trên kênh đó. Giữ tùy chọn này tắt nếu bạn muốn các lệnh chỉ dành cho chủ sở hữu chỉ được bảo vệ bởi `ownerAllowFrom` và các danh sách cho phép lệnh tiêu chuẩn.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong prompt hệ thống.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Tùy chọn đặt secret HMAC được dùng khi `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng provider để ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho lệnh và chỉ thị (danh sách cho phép/ghép nối của kênh và `commands.useAccessGroups` bị bỏ qua). Dùng `"*"` làm mặc định toàn cục; các khóa dành riêng cho provider sẽ ghi đè nó.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Áp dụng danh sách cho phép/chính sách cho lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Nguồn sự thật hiện tại:

- lệnh tích hợp sẵn của core đến từ `src/auto-reply/commands-registry.shared.ts`
- lệnh dock được tạo đến từ `src/auto-reply/commands-registry.data.ts`
- lệnh plugin đến từ các lệnh gọi `registerCommand()` của plugin
- khả dụng thực tế trên gateway của bạn vẫn phụ thuộc vào cờ cấu hình, bề mặt kênh, và các plugin đã cài đặt/bật

### Lệnh tích hợp sẵn của core

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` bắt đầu một phiên mới; `/reset` là bí danh đặt lại.
    - Control UI chặn `/new` được nhập để tạo và chuyển sang một phiên dashboard mới; `/reset` được nhập vẫn chạy đặt lại tại chỗ của Gateway.
    - `/reset soft [message]` giữ transcript hiện tại, bỏ các id phiên backend CLI được tái sử dụng, và chạy lại việc tải khởi động/prompt hệ thống tại chỗ.
    - `/compact [instructions]` nén ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction).
    - `/stop` hủy lần chạy hiện tại.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` quản lý hết hạn liên kết luồng.
    - `/export-session [path]` xuất phiên hiện tại ra HTML. Bí danh: `/export`.
    - `/export-trajectory [path]` yêu cầu phê duyệt exec, sau đó xuất một [gói trajectory](/vi/tools/trajectory) JSONL cho phiên hiện tại. Dùng nó khi bạn cần dòng thời gian prompt, công cụ, và transcript cho một phiên OpenClaw. Trong chat nhóm, prompt phê duyệt và kết quả xuất được gửi riêng cho chủ sở hữu. Bí danh: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` đặt mức suy nghĩ. Tùy chọn đến từ hồ sơ provider của mô hình đang hoạt động; các mức phổ biến là `off`, `minimal`, `low`, `medium`, và `high`, với các mức tùy chỉnh như `xhigh`, `adaptive`, `max`, hoặc nhị phân `on` chỉ ở nơi được hỗ trợ. Bí danh: `/thinking`, `/t`.
    - `/verbose on|off|full` bật/tắt đầu ra chi tiết. Bí danh: `/v`.
    - `/trace on|off` bật/tắt đầu ra trace plugin cho phiên hiện tại.
    - `/fast [status|on|off]` hiển thị hoặc đặt chế độ nhanh.
    - `/reasoning [on|off|stream]` bật/tắt khả năng hiển thị reasoning. Bí danh: `/reason`.
    - `/elevated [on|off|ask|full]` bật/tắt chế độ elevated. Bí danh: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` hiển thị hoặc đặt mặc định exec.
    - `/model [name|#|status]` hiển thị hoặc đặt mô hình.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liệt kê các provider đã cấu hình/có auth khả dụng hoặc các mô hình cho một provider; thêm `all` để duyệt toàn bộ catalog của provider đó.
    - `/queue <mode>` quản lý hành vi hàng đợi (`steer`, `queue` cũ, `followup`, `collect`, `steer-backlog`, `interrupt`) cộng với các tùy chọn như `debounce:0.5s cap:25 drop:summarize`; `/queue default` hoặc `/queue reset` xóa ghi đè phiên. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` hiển thị tóm tắt trợ giúp ngắn.
    - `/commands` hiển thị catalog lệnh đã tạo.
    - `/tools [compact|verbose]` hiển thị agent hiện tại có thể dùng gì ngay lúc này.
    - `/status` hiển thị trạng thái thực thi/runtime, bao gồm nhãn `Execution`/`Runtime` và mức sử dụng/hạn ngạch provider khi khả dụng.
    - `/diagnostics [note]` là luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu cho lỗi Gateway và các lần chạy harness Codex. Nó yêu cầu phê duyệt exec rõ ràng mỗi lần trước khi chạy `openclaw gateway diagnostics export --json`; không phê duyệt diagnostics bằng quy tắc cho phép tất cả. Sau khi được phê duyệt, nó gửi một báo cáo có thể dán với đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư, và các id phiên liên quan. Trong chat nhóm, prompt phê duyệt và báo cáo được gửi riêng cho chủ sở hữu. Khi phiên đang hoạt động dùng harness OpenAI Codex, cùng phê duyệt đó cũng gửi phản hồi Codex liên quan đến máy chủ OpenAI và phản hồi hoàn tất liệt kê id phiên OpenClaw, id luồng Codex, và các lệnh `codex resume <thread-id>`. Xem [Xuất Diagnostics](/vi/gateway/diagnostics).
    - `/crestodian <request>` chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu.
    - `/tasks` liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại.
    - `/context [list|detail|json]` giải thích cách ngữ cảnh được lắp ráp.
    - `/whoami` hiển thị id người gửi của bạn. Bí danh: `/id`.
    - `/usage off|tokens|full|cost` kiểm soát phần chân trang mức sử dụng theo từng phản hồi hoặc in tóm tắt chi phí cục bộ.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` chạy một skill theo tên.
    - `/allowlist [list|add|remove] ...` quản lý các mục danh sách cho phép. Chỉ văn bản.
    - `/approve <id> <decision>` giải quyết các prompt phê duyệt exec.
    - `/btw <question>` hỏi một câu hỏi phụ mà không thay đổi ngữ cảnh phiên trong tương lai. Xem [BTW](/vi/tools/btw).

  </Accordion>
  <Accordion title="Sub-agent và ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` quản lý các lượt chạy sub-agent cho phiên hiện tại.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` quản lý các phiên ACP và tùy chọn thời gian chạy.
    - `/focus <target>` liên kết luồng Discord hiện tại hoặc chủ đề/cuộc trò chuyện Telegram với một mục tiêu phiên.
    - `/unfocus` xóa liên kết hiện tại.
    - `/agents` liệt kê các agent gắn với luồng cho phiên hiện tại.
    - `/kill <id|#|all>` hủy một hoặc tất cả sub-agent đang chạy.
    - `/steer <id|#> <message>` gửi chỉ dẫn cho một sub-agent đang chạy. Bí danh: `/tell`.

  </Accordion>
  <Accordion title="Ghi chỉ dành cho chủ sở hữu và quản trị">
    - `/config show|get|set|unset` đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.config: true`.
    - `/mcp show|get|set|unset` đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` kiểm tra hoặc thay đổi trạng thái plugin. `/plugin` là một bí danh. Các thao tác ghi chỉ dành cho chủ sở hữu. Yêu cầu `commands.plugins: true`.
    - `/debug show|set|unset|reset` quản lý các ghi đè cấu hình chỉ trong thời gian chạy. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.debug: true`.
    - `/restart` khởi động lại OpenClaw khi được bật. Mặc định: bật; đặt `commands.restart: false` để tắt.
    - `/send on|off|inherit` đặt chính sách gửi. Chỉ dành cho chủ sở hữu.

  </Accordion>
  <Accordion title="Giọng nói, TTS, điều khiển kênh">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` điều khiển TTS. Xem [TTS](/vi/tools/tts).
    - `/activation mention|always` đặt chế độ kích hoạt nhóm.
    - `/bash <command>` chạy một lệnh shell trên máy chủ. Chỉ văn bản. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` cùng với danh sách cho phép `tools.elevated`.
    - `!poll [sessionId]` kiểm tra một tác vụ bash nền.
    - `!stop [sessionId]` dừng một tác vụ bash nền.

  </Accordion>
</AccordionGroup>

### Các lệnh dock được tạo

Các lệnh dock chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Xem [Docking kênh](/vi/concepts/channel-docking) để biết cách thiết lập, ví dụ và xử lý sự cố.

Các lệnh dock được tạo từ plugin kênh có hỗ trợ lệnh gốc. Bộ tích hợp hiện tại:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Dùng lệnh dock từ cuộc trò chuyện trực tiếp để chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Agent giữ nguyên ngữ cảnh phiên, nhưng các trả lời sau này cho phiên đó được gửi tới đối tác kênh đã chọn.

Các lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và đối tác đích phải ở trong cùng một nhóm danh tính, ví dụ `["telegram:123", "discord:456"]`. Nếu người dùng Telegram có id `123` gửi `/dock_discord`, OpenClaw lưu `lastChannel: "discord"` và `lastTo: "456"` trên phiên đang hoạt động. Nếu người gửi không được liên kết với một đối tác Discord, lệnh sẽ trả lời bằng gợi ý thiết lập thay vì chuyển tiếp sang trò chuyện thông thường.

Docking chỉ thay đổi tuyến phiên đang hoạt động. Nó không tạo tài khoản kênh, cấp quyền truy cập, bỏ qua danh sách cho phép của kênh, hoặc chuyển lịch sử bản ghi sang phiên khác. Dùng `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, hoặc một lệnh dock được tạo khác để chuyển tuyến lần nữa.

### Các lệnh plugin tích hợp

Plugin tích hợp có thể thêm nhiều lệnh gạch chéo hơn. Các lệnh tích hợp hiện tại trong repo này:

- `/dreaming [on|off|status|help]` bật/tắt Dreaming bộ nhớ. Xem [Dreaming](/vi/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` quản lý luồng ghép đôi/thiết lập thiết bị. Xem [Ghép đôi](/vi/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tạm thời kích hoạt các lệnh node điện thoại rủi ro cao.
- `/voice status|list [limit]|set <voiceId|name>` quản lý cấu hình giọng nói Talk. Trên Discord, tên lệnh gốc là `/talkvoice`.
- `/card ...` gửi các mẫu thẻ giàu nội dung LINE. Xem [LINE](/vi/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` kiểm tra và điều khiển harness máy chủ ứng dụng Codex tích hợp. Xem [Harness Codex](/vi/plugins/codex-harness).
- Các lệnh chỉ dành cho QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Lệnh skill động

Các skill người dùng có thể gọi cũng được hiển thị dưới dạng lệnh gạch chéo:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- skill cũng có thể xuất hiện dưới dạng lệnh trực tiếp như `/prose` khi skill/plugin đăng ký chúng.
- đăng ký lệnh skill gốc được điều khiển bởi `commands.nativeSkills` và `channels.<provider>.commands.nativeSkills`.
- đặc tả lệnh có thể cung cấp `descriptionLocalizations` cho các bề mặt gốc hỗ trợ mô tả đã bản địa hóa, bao gồm Discord.

<AccordionGroup>
  <Accordion title="Ghi chú về đối số và bộ phân tích cú pháp">
    - Lệnh chấp nhận một dấu `:` tùy chọn giữa lệnh và đối số (ví dụ `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` chấp nhận bí danh model, `provider/model`, hoặc tên provider (khớp mờ); nếu không khớp, văn bản được xử lý là nội dung tin nhắn.
    - Để xem phân tích đầy đủ về mức sử dụng provider, dùng `openclaw status --usage`.
    - `/allowlist add|remove` yêu cầu `commands.config=true` và tuân thủ `configWrites` của kênh.
    - Trong các kênh nhiều tài khoản, `/allowlist --account <id>` nhắm tới cấu hình và `/config set channels.<provider>.accounts.<id>...` cũng tuân thủ `configWrites` của tài khoản mục tiêu.
    - `/usage` điều khiển phần chân trang mức sử dụng theo từng phản hồi; `/usage cost` in ra bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
    - `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt.
    - `/plugins install <spec>` chấp nhận cùng đặc tả plugin như `openclaw plugins install`: đường dẫn/kho lưu trữ cục bộ, gói npm, `git:<repo>`, hoặc `clawhub:<pkg>`, sau đó yêu cầu khởi động lại Gateway vì các mô-đun nguồn plugin đã thay đổi.
    - `/plugins enable|disable` cập nhật cấu hình plugin và kích hoạt tải lại plugin Gateway cho các lượt agent mới.

  </Accordion>
  <Accordion title="Hành vi theo từng kênh">
    - Lệnh gốc chỉ dành cho Discord: `/vc join|leave|status` điều khiển kênh thoại (không có sẵn dưới dạng văn bản). `join` yêu cầu một guild và kênh thoại/sân khấu đã chọn. Yêu cầu `channels.discord.voice` và lệnh gốc.
    - Các lệnh ràng buộc luồng Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu ràng buộc luồng hiệu dụng được bật (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
    - Tham chiếu lệnh ACP và hành vi thời gian chạy: [Agent ACP](/vi/tools/acp-agents).

  </Accordion>
  <Accordion title="An toàn verbose / trace / fast / reasoning">
    - `/verbose` dùng để gỡ lỗi và tăng khả năng quan sát; hãy giữ nó **tắt** khi sử dụng bình thường.
    - `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng trace/gỡ lỗi do plugin sở hữu và giữ tiếng ồn công cụ verbose thông thường ở trạng thái tắt.
    - `/fast on|off` lưu một ghi đè phiên. Dùng tùy chọn `inherit` trong Sessions UI để xóa ghi đè và quay về mặc định cấu hình.
    - `/fast` phụ thuộc vào provider: OpenAI/OpenAI Codex ánh xạ nó tới `service_tier=priority` trên endpoint Responses gốc, trong khi các yêu cầu Anthropic công khai trực tiếp, bao gồm lưu lượng đã xác thực OAuth gửi tới `api.anthropic.com`, ánh xạ nó tới `service_tier=auto` hoặc `standard_only`. Xem [OpenAI](/vi/providers/openai) và [Anthropic](/vi/providers/anthropic).
    - Tóm tắt lỗi công cụ vẫn được hiển thị khi liên quan, nhưng văn bản lỗi chi tiết chỉ được bao gồm khi `/verbose` là `on` hoặc `full`.
    - `/reasoning`, `/verbose`, và `/trace` có rủi ro trong môi trường nhóm: chúng có thể tiết lộ reasoning nội bộ, đầu ra công cụ, hoặc chẩn đoán plugin mà bạn không định công khai. Nên để chúng tắt, đặc biệt trong trò chuyện nhóm.

  </Accordion>
  <Accordion title="Chuyển model">
    - `/model` lưu model phiên mới ngay lập tức.
    - Nếu agent đang rảnh, lượt chạy tiếp theo dùng nó ngay.
    - Nếu một lượt chạy đã hoạt động, OpenClaw đánh dấu chuyển đổi trực tiếp là đang chờ và chỉ khởi động lại vào model mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra trả lời đã bắt đầu, chuyển đổi đang chờ có thể vẫn nằm trong hàng đợi cho đến cơ hội thử lại sau hoặc lượt người dùng tiếp theo.
    - Trong TUI cục bộ, `/crestodian [request]` quay lại từ TUI agent bình thường về Crestodian. Điều này tách biệt với chế độ cứu hộ kênh tin nhắn và không cấp quyền cấu hình từ xa.

  </Accordion>
  <Accordion title="Đường nhanh và lối tắt nội tuyến">
    - **Đường nhanh:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + model).
    - **Cổng nhắc đến trong nhóm:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép bỏ qua yêu cầu nhắc đến.
    - **Lối tắt nội tuyến (chỉ người gửi trong danh sách cho phép):** một số lệnh cũng hoạt động khi được nhúng trong tin nhắn thông thường và sẽ bị loại bỏ trước khi model nhìn thấy phần văn bản còn lại.
      - Ví dụ: `hey /status` kích hoạt phản hồi trạng thái, và phần văn bản còn lại tiếp tục đi qua luồng bình thường.
    - Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Tin nhắn chỉ chứa lệnh không được phép sẽ bị bỏ qua im lặng, và các token `/...` nội tuyến được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Lệnh skill và đối số gốc">
    - **Lệnh skill:** skill `user-invocable` được hiển thị dưới dạng lệnh gạch chéo. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); xung đột nhận hậu tố số (ví dụ `_2`).
      - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh gốc ngăn lệnh riêng cho từng skill).
      - Theo mặc định, lệnh skill được chuyển tiếp tới model như một yêu cầu bình thường.
      - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp tới một công cụ (xác định, không qua model).
      - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/vi/prose).
    - **Đối số lệnh gốc:** Discord dùng tự động hoàn thành cho các tùy chọn động (và menu nút khi bạn bỏ qua đối số bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua đối số. Các lựa chọn động được phân giải theo model của phiên mục tiêu, vì vậy các tùy chọn theo model như mức `/think` tuân theo ghi đè `/model` của phiên đó.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` trả lời một câu hỏi thời gian chạy, không phải câu hỏi cấu hình: **agent này có thể dùng gì ngay bây giờ trong cuộc trò chuyện này**.

- `/tools` mặc định gọn và được tối ưu để quét nhanh.
- `/tools verbose` thêm các mô tả ngắn.
- Các bề mặt lệnh gốc hỗ trợ đối số hiển thị cùng công tắc chế độ như `compact|verbose`.
- Kết quả có phạm vi theo phiên, nên việc thay đổi agent, kênh, luồng, quyền người gửi, hoặc model có thể thay đổi đầu ra.
- `/tools` bao gồm các công cụ thực sự có thể truy cập trong thời gian chạy, bao gồm công cụ lõi, công cụ plugin đã kết nối, và công cụ do kênh sở hữu.

Để chỉnh sửa hồ sơ và ghi đè, hãy dùng bảng Tools của Control UI hoặc các bề mặt cấu hình/danh mục thay vì coi `/tools` là danh mục tĩnh.

## Bề mặt sử dụng (hiển thị ở đâu)

- **Mức dùng/hạn mức của nhà cung cấp** (ví dụ: "Claude còn 80%") hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi bật theo dõi mức dùng. OpenClaw chuẩn hóa các cửa sổ của nhà cung cấp thành `% còn lại`; với MiniMax, các trường phần trăm chỉ biểu thị phần còn lại được đảo trước khi hiển thị, và phản hồi `model_remains` ưu tiên mục mô hình chat cùng nhãn gói được gắn thẻ mô hình.
- **Dòng token/cache** trong `/status` có thể dự phòng về mục mức dùng transcript mới nhất khi ảnh chụp nhanh phiên trực tiếp còn thưa dữ liệu. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên, và dự phòng transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động cùng tổng lớn hơn theo hướng prompt khi các tổng đã lưu bị thiếu hoặc nhỏ hơn.
- **Thực thi so với runtime:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên thực sự đang chạy phiên: `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP.
- **Token/chi phí theo từng phản hồi** được điều khiển bằng `/usage off|tokens|full` (được nối vào các phản hồi bình thường).
- `/model status` nói về **mô hình/xác thực/endpoint**, không phải mức dùng.

## Chọn mô hình (`/model`)

`/model` được triển khai dưới dạng một directive.

Ví dụ:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Ghi chú:

- `/model` và `/model list` hiển thị bộ chọn nhỏ gọn, có đánh số (họ mô hình + các nhà cung cấp khả dụng).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với menu thả xuống nhà cung cấp và mô hình cùng bước Gửi.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

## Ghi đè debug

`/debug` cho phép bạn đặt các ghi đè cấu hình **chỉ trong runtime** (bộ nhớ, không phải ổ đĩa). Chỉ chủ sở hữu. Mặc định bị tắt; bật bằng `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Các ghi đè áp dụng ngay cho những lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`. Dùng `/debug reset` để xóa tất cả ghi đè và quay lại cấu hình trên ổ đĩa.
</Note>

## Kết quả trace của Plugin

`/trace` cho phép bạn bật/tắt **các dòng trace/debug Plugin theo phạm vi phiên** mà không bật toàn bộ chế độ verbose.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Ghi chú:

- `/trace` không có đối số sẽ hiển thị trạng thái trace của phiên hiện tại.
- `/trace on` bật các dòng trace Plugin cho phiên hiện tại.
- `/trace off` tắt lại các dòng đó.
- Các dòng trace Plugin có thể xuất hiện trong `/status` và dưới dạng thông báo chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.
- `/trace` không thay thế `/debug`; `/debug` vẫn quản lý các ghi đè cấu hình chỉ trong runtime.
- `/trace` không thay thế `/verbose`; kết quả công cụ/trạng thái verbose bình thường vẫn thuộc về `/verbose`.

## Cập nhật cấu hình

`/config` ghi vào cấu hình trên ổ đĩa của bạn (`openclaw.json`). Chỉ chủ sở hữu. Mặc định bị tắt; bật bằng `commands.config: true`.

Ví dụ:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Cấu hình được xác thực trước khi ghi; các thay đổi không hợp lệ bị từ chối. Các cập nhật `/config` được giữ lại qua các lần khởi động lại.
</Note>

## Cập nhật MCP

`/mcp` ghi các định nghĩa máy chủ MCP do OpenClaw quản lý dưới `mcp.servers`. Chỉ chủ sở hữu. Mặc định bị tắt; bật bằng `commands.mcp: true`.

Ví dụ:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải thiết lập dự án do Pi sở hữu. Các adapter runtime quyết định transport nào thực sự có thể thực thi.
</Note>

## Cập nhật Plugin

`/plugins` cho phép operator kiểm tra các Plugin đã phát hiện và bật/tắt chúng trong cấu hình. Các luồng chỉ đọc có thể dùng `/plugin` làm bí danh. Mặc định bị tắt; bật bằng `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` và `/plugins show` dùng khám phá Plugin thực tế dựa trên workspace hiện tại cùng cấu hình trên ổ đĩa.
- `/plugins install` cài đặt từ ClawHub, npm, git, thư mục cục bộ và archive.
- `/plugins enable|disable` chỉ cập nhật cấu hình Plugin; thao tác này không cài đặt hoặc gỡ cài đặt Plugin.
- Các thay đổi bật và tắt hot-reload các bề mặt runtime Plugin của Gateway cho lượt agent mới; cài đặt yêu cầu khởi động lại Gateway vì các module nguồn Plugin đã thay đổi.

</Note>

## Ghi chú bề mặt

<AccordionGroup>
  <Accordion title="Phiên theo từng bề mặt">
    - **Lệnh văn bản** chạy trong phiên chat bình thường (DM dùng chung `main`, nhóm có phiên riêng).
    - **Lệnh native** dùng các phiên cô lập:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (nhắm tới phiên chat qua `CommandTargetSessionKey`)
    - **`/stop`** nhắm tới phiên chat đang hoạt động để có thể hủy lần chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw` duy nhất. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho mỗi lệnh tích hợp sẵn (cùng tên như `/help`). Các menu đối số lệnh cho Slack được gửi dưới dạng nút Block Kit ephemeral.

    Ngoại lệ native của Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

  </Accordion>
</AccordionGroup>

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại.

Khác với chat bình thường:

- nó dùng phiên hiện tại làm ngữ cảnh nền,
- nó chạy như một lời gọi one-shot **không dùng công cụ** riêng biệt,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi dưới dạng kết quả phụ trực tiếp thay vì một tin nhắn trợ lý bình thường.

Điều đó khiến `/btw` hữu ích khi bạn muốn có một làm rõ tạm thời trong lúc tác vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw what are we doing right now?
```

Xem [Câu Hỏi Phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi và chi tiết UX của client.

## Liên quan

- [Tạo skills](/vi/tools/creating-skills)
- [Skills](/vi/tools/skills)
- [Cấu hình Skills](/vi/tools/skills-config)
