---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền
sidebarTitle: Slash commands
summary: 'Lệnh slash: văn bản so với gốc, cấu hình và các lệnh được hỗ trợ'
title: Lệnh gạch chéo
x-i18n:
    generated_at: "2026-05-05T06:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Các lệnh được xử lý bởi Gateway. Hầu hết lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh chat bash chỉ dành cho máy chủ dùng `! <cmd>` (với `/bash <cmd>` làm bí danh).

Khi một cuộc trò chuyện hoặc luồng được ràng buộc với một phiên ACP, văn bản theo dõi thông thường sẽ được định tuyến tới harness ACP đó. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh ACP của OpenClaw, còn `/status` cùng `/unfocus` vẫn ở cục bộ bất cứ khi nào việc xử lý lệnh được bật cho bề mặt đó.

Có hai hệ thống liên quan:

<AccordionGroup>
  <Accordion title="Lệnh">
    Các tin nhắn `/...` độc lập.
  </Accordion>
  <Accordion title="Chỉ thị">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Các chỉ thị bị loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong các tin nhắn chat thông thường (không phải chỉ gồm chỉ thị), chúng được xem là "gợi ý nội tuyến" và **không** lưu giữ cài đặt phiên.
    - Trong các tin nhắn chỉ gồm chỉ thị (tin nhắn chỉ chứa chỉ thị), chúng được lưu vào phiên và phản hồi bằng một xác nhận.
    - Chỉ thị chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là danh sách cho phép duy nhất được dùng; nếu không, quyền ủy quyền đến từ danh sách cho phép/ghép cặp của kênh cùng `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Lối tắt nội tuyến">
    Chỉ dành cho người gửi trong danh sách cho phép/được ủy quyền: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Chúng chạy ngay lập tức, bị loại khỏi tin nhắn trước khi mô hình nhìn thấy, và phần văn bản còn lại tiếp tục đi qua luồng thông thường.

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
  Bật phân tích cú pháp `/...` trong tin nhắn chat. Trên các bề mặt không có lệnh gốc (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này thành `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm slash command); bị bỏ qua với các nhà cung cấp không hỗ trợ gốc. Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`). Trên Discord, `false` bỏ qua việc đăng ký và dọn dẹp slash-command khi khởi động; các lệnh đã đăng ký trước đó có thể vẫn hiển thị cho đến khi bạn xóa chúng khỏi ứng dụng Discord. Lệnh Slack được quản lý trong ứng dụng Slack và không bị xóa tự động.
</ParamField>
Trên Discord, đặc tả lệnh gốc có thể bao gồm `descriptionLocalizations`, được OpenClaw xuất bản dưới dạng `description_localizations` của Discord và đưa vào các so sánh đối soát.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký các lệnh **skill** theo cách gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một slash command cho mỗi skill). Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell máy chủ (`/bash <cmd>` là bí danh; yêu cầu danh sách cho phép `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kiểm soát thời gian bash chờ trước khi chuyển sang chế độ nền (`0` chạy nền ngay lập tức).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý trong `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái plugin cùng các điều khiển cài đặt + bật/tắt).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè chỉ trong thời gian chạy).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` cùng các hành động công cụ khởi động lại gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Đặt danh sách cho phép chủ sở hữu rõ ràng cho các bề mặt lệnh/công cụ chỉ dành cho chủ sở hữu. Đây là tài khoản người vận hành có thể phê duyệt các hành động nguy hiểm và chạy các lệnh như `/diagnostics`, `/export-trajectory`, và `/config`. Nó tách biệt với `commands.allowFrom` và với quyền truy cập ghép cặp DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: khiến các lệnh chỉ dành cho chủ sở hữu yêu cầu **danh tính chủ sở hữu** để chạy trên bề mặt đó. Khi `true`, người gửi phải khớp với một ứng viên chủ sở hữu đã được phân giải (ví dụ một mục trong `commands.ownerAllowFrom` hoặc siêu dữ liệu chủ sở hữu gốc của nhà cung cấp) hoặc có phạm vi nội bộ `operator.admin` trên một kênh tin nhắn nội bộ. Một mục ký tự đại diện trong `allowFrom` của kênh, hoặc một danh sách ứng viên chủ sở hữu trống/chưa phân giải, là **không** đủ — các lệnh chỉ dành cho chủ sở hữu sẽ đóng khi lỗi trên kênh đó. Tắt tùy chọn này nếu bạn muốn các lệnh chỉ dành cho chủ sở hữu chỉ được chặn bởi `ownerAllowFrom` và các danh sách cho phép lệnh tiêu chuẩn.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong lời nhắc hệ thống.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Tùy chọn đặt bí mật HMAC được dùng khi `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng nhà cung cấp để ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho lệnh và chỉ thị (danh sách cho phép/ghép cặp của kênh và `commands.useAccessGroups` bị bỏ qua). Dùng `"*"` làm mặc định toàn cục; khóa dành riêng cho nhà cung cấp sẽ ghi đè nó.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi danh sách cho phép/chính sách cho lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Nguồn sự thật hiện tại:

- các lệnh tích hợp lõi đến từ `src/auto-reply/commands-registry.shared.ts`
- các lệnh dock được tạo đến từ `src/auto-reply/commands-registry.data.ts`
- lệnh plugin đến từ các lệnh gọi `registerCommand()` của plugin
- tính khả dụng thực tế trên gateway của bạn vẫn phụ thuộc vào cờ cấu hình, bề mặt kênh, và các plugin đã cài đặt/bật

### Các lệnh tích hợp lõi

<AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    - `/new [model]` bắt đầu một phiên mới; `/reset` là bí danh đặt lại.
    - Control UI chặn `/new` được nhập để tạo và chuyển sang một phiên dashboard mới; `/reset` được nhập vẫn chạy thao tác đặt lại tại chỗ của Gateway.
    - `/reset soft [message]` giữ transcript hiện tại, bỏ các id phiên backend CLI được tái sử dụng, và chạy lại việc tải khởi động/lời nhắc hệ thống tại chỗ.
    - `/compact [instructions]` nén ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction).
    - `/stop` hủy lượt chạy hiện tại.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` quản lý thời hạn ràng buộc luồng.
    - `/export-session [path]` xuất phiên hiện tại sang HTML. Bí danh: `/export`.
    - `/export-trajectory [path]` yêu cầu phê duyệt exec, sau đó xuất một [gói trajectory](/vi/tools/trajectory) JSONL cho phiên hiện tại. Dùng nó khi bạn cần dòng thời gian lời nhắc, công cụ, và transcript cho một phiên OpenClaw. Trong chat nhóm, lời nhắc phê duyệt và kết quả xuất sẽ được gửi riêng cho chủ sở hữu. Bí danh: `/trajectory`.

  </Accordion>
  <Accordion title="Mô hình và điều khiển lượt chạy">
    - `/think <level>` đặt mức suy nghĩ. Các tùy chọn đến từ hồ sơ nhà cung cấp của mô hình đang hoạt động; các mức phổ biến là `off`, `minimal`, `low`, `medium`, và `high`, với các mức tùy chỉnh như `xhigh`, `adaptive`, `max`, hoặc nhị phân `on` chỉ ở nơi được hỗ trợ. Bí danh: `/thinking`, `/t`.
    - `/verbose on|off|full` bật/tắt đầu ra chi tiết. Bí danh: `/v`.
    - `/trace on|off` bật/tắt đầu ra theo dõi plugin cho phiên hiện tại.
    - `/fast [status|on|off]` hiển thị hoặc đặt chế độ nhanh.
    - `/reasoning [on|off|stream]` bật/tắt khả năng hiển thị suy luận. Bí danh: `/reason`.
    - `/elevated [on|off|ask|full]` bật/tắt chế độ elevated. Bí danh: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` hiển thị hoặc đặt mặc định exec.
    - `/model [name|#|status]` hiển thị hoặc đặt mô hình.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liệt kê các nhà cung cấp đã cấu hình/có xác thực khả dụng hoặc các mô hình cho một nhà cung cấp; thêm `all` để duyệt toàn bộ danh mục của nhà cung cấp đó.
    - `/queue <mode>` quản lý hành vi hàng đợi (`steer`, `queue` kế thừa, `followup`, `collect`, `steer-backlog`, `interrupt`) cùng các tùy chọn như `debounce:0.5s cap:25 drop:summarize`; `/queue default` hoặc `/queue reset` xóa ghi đè phiên. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).
    - `/steer <message>` chèn hướng dẫn vào lượt chạy đang hoạt động cho phiên hiện tại, độc lập với chế độ `/queue`. Nó không bắt đầu lượt chạy mới khi phiên đang rảnh. Bí danh: `/tell`. Xem [Steer](/vi/tools/steer).

  </Accordion>
  <Accordion title="Khám phá và trạng thái">
    - `/help` hiển thị tóm tắt trợ giúp ngắn.
    - `/commands` hiển thị danh mục lệnh được tạo.
    - `/tools [compact|verbose]` hiển thị những gì tác tử hiện tại có thể dùng ngay lúc này.
    - `/status` hiển thị trạng thái thực thi/thời gian chạy, thời gian hoạt động của Gateway và hệ thống, cùng mức sử dụng/hạn ngạch nhà cung cấp khi có.
    - `/diagnostics [note]` là luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu đối với lỗi Gateway và các lượt chạy harness Codex. Nó yêu cầu phê duyệt exec rõ ràng mỗi lần trước khi chạy `openclaw gateway diagnostics export --json`; không phê duyệt diagnostics bằng quy tắc cho phép tất cả. Sau khi phê duyệt, nó gửi một báo cáo có thể dán được với đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư, và các id phiên liên quan. Trong chat nhóm, lời nhắc phê duyệt và báo cáo sẽ được gửi riêng cho chủ sở hữu. Khi phiên đang hoạt động dùng harness OpenAI Codex, cùng phê duyệt đó cũng gửi phản hồi Codex liên quan đến máy chủ OpenAI và phản hồi hoàn tất liệt kê id phiên OpenClaw, id luồng Codex, và các lệnh `codex resume <thread-id>`. Xem [Xuất diagnostics](/vi/gateway/diagnostics).
    - `/crestodian <request>` chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu.
    - `/tasks` liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại.
    - `/context [list|detail|json]` giải thích cách ngữ cảnh được lắp ráp.
    - `/whoami` hiển thị id người gửi của bạn. Bí danh: `/id`.
    - `/usage off|tokens|full|cost` kiểm soát chân trang mức sử dụng trên mỗi phản hồi hoặc in tóm tắt chi phí cục bộ.

  </Accordion>
  <Accordion title="Skills, danh sách cho phép, phê duyệt">
    - `/skill <name> [input]` chạy một skill theo tên.
    - `/allowlist [list|add|remove] ...` quản lý các mục danh sách cho phép. Chỉ văn bản.
    - `/approve <id> <decision>` xử lý lời nhắc phê duyệt exec.
    - `/btw <question>` hỏi một câu hỏi phụ mà không thay đổi ngữ cảnh phiên trong tương lai. Bí danh: `/side`. Xem [BTW](/vi/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` quản lý các lượt chạy sub-agent cho phiên hiện tại.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` quản lý phiên ACP và tùy chọn runtime.
    - `/focus <target>` liên kết thread Discord hiện tại hoặc chủ đề/cuộc trò chuyện Telegram với một mục tiêu phiên.
    - `/unfocus` xóa liên kết hiện tại.
    - `/agents` liệt kê các agent gắn với thread cho phiên hiện tại.
    - `/kill <id|#|all>` hủy một hoặc tất cả sub-agent đang chạy.
    - `/subagents steer <id|#> <message>` gửi chỉ đạo đến một sub-agent đang chạy. Xem [Chỉ đạo](/vi/tools/steer).

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.config: true`.
    - `/mcp show|get|set|unset` đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` kiểm tra hoặc thay đổi trạng thái plugin. `/plugin` là bí danh. Các thao tác ghi chỉ dành cho chủ sở hữu. Yêu cầu `commands.plugins: true`.
    - `/debug show|set|unset|reset` quản lý các ghi đè cấu hình chỉ trong runtime. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.debug: true`.
    - `/restart` khởi động lại OpenClaw khi được bật. Mặc định: được bật; đặt `commands.restart: false` để tắt.
    - `/send on|off|inherit` đặt chính sách gửi. Chỉ dành cho chủ sở hữu.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
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

Dùng các lệnh dock từ cuộc trò chuyện trực tiếp để chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Agent giữ nguyên ngữ cảnh phiên, nhưng các câu trả lời sau này cho phiên đó được gửi đến peer kênh đã chọn.

Các lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và peer đích phải nằm trong cùng một nhóm danh tính, ví dụ `["telegram:123", "discord:456"]`. Nếu một người dùng Telegram có id `123` gửi `/dock_discord`, OpenClaw lưu `lastChannel: "discord"` và `lastTo: "456"` trên phiên đang hoạt động. Nếu người gửi chưa được liên kết với một peer Discord, lệnh sẽ trả lời bằng gợi ý thiết lập thay vì chuyển tiếp sang trò chuyện thông thường.

Docking chỉ thay đổi tuyến phiên đang hoạt động. Nó không tạo tài khoản kênh, cấp quyền truy cập, bỏ qua danh sách cho phép kênh, hoặc chuyển lịch sử bản ghi sang phiên khác. Dùng `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, hoặc một lệnh dock được tạo khác để chuyển tuyến lần nữa.

### Lệnh plugin tích hợp

Các plugin tích hợp có thể thêm nhiều lệnh slash hơn. Các lệnh tích hợp hiện tại trong repo này:

- `/dreaming [on|off|status|help]` bật/tắt Dreaming bộ nhớ. Xem [Dreaming](/vi/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` quản lý luồng ghép nối/thiết lập thiết bị. Xem [Ghép nối](/vi/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tạm thời trang bị các lệnh node điện thoại rủi ro cao.
- `/voice status|list [limit]|set <voiceId|name>` quản lý cấu hình giọng nói Talk. Trên Discord, tên lệnh gốc là `/talkvoice`.
- `/card ...` gửi preset thẻ rich LINE. Xem [LINE](/vi/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` kiểm tra và điều khiển harness app-server Codex tích hợp. Xem [Harness Codex](/vi/plugins/codex-harness).
- Các lệnh chỉ dành cho QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Lệnh skill động

Các skill mà người dùng có thể gọi cũng được hiển thị dưới dạng lệnh slash:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- skills cũng có thể xuất hiện dưới dạng lệnh trực tiếp như `/prose` khi skill/plugin đăng ký chúng.
- việc đăng ký lệnh skill gốc được điều khiển bởi `commands.nativeSkills` và `channels.<provider>.commands.nativeSkills`.
- thông số lệnh có thể cung cấp `descriptionLocalizations` cho các bề mặt gốc hỗ trợ mô tả bản địa hóa, bao gồm Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Các lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (ví dụ `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` chấp nhận bí danh mô hình, `provider/model`, hoặc tên provider (khớp mờ); nếu không có khớp, văn bản được xử lý như nội dung tin nhắn.
    - Để xem phân tích đầy đủ về mức sử dụng provider, dùng `openclaw status --usage`.
    - `/allowlist add|remove` yêu cầu `commands.config=true` và tuân theo `configWrites` của kênh.
    - Trong các kênh nhiều tài khoản, `/allowlist --account <id>` nhắm tới cấu hình và `/config set channels.<provider>.accounts.<id>...` cũng tuân theo `configWrites` của tài khoản đích.
    - `/usage` điều khiển phần chân trang mức sử dụng theo từng phản hồi; `/usage cost` in bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
    - `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt.
    - `/plugins install <spec>` chấp nhận cùng thông số plugin như `openclaw plugins install`: đường dẫn/kho lưu trữ cục bộ, gói npm, `git:<repo>`, hoặc `clawhub:<pkg>`, rồi yêu cầu khởi động lại Gateway vì các module nguồn plugin đã thay đổi.
    - `/plugins enable|disable` cập nhật cấu hình plugin và kích hoạt tải lại plugin Gateway cho các lượt agent mới.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Lệnh gốc chỉ dành cho Discord: `/vc join|leave|status` điều khiển kênh thoại (không có dưới dạng văn bản). `join` yêu cầu một guild và kênh thoại/stage đã chọn. Yêu cầu `channels.discord.voice` và lệnh gốc.
    - Các lệnh gắn thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu bật hiệu lực liên kết thread (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
    - Tham chiếu lệnh ACP và hành vi runtime: [agent ACP](/vi/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` dành cho gỡ lỗi và tăng khả năng quan sát; hãy giữ nó **tắt** khi sử dụng bình thường.
    - `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng trace/gỡ lỗi do plugin sở hữu và giữ tắt phần thông báo công cụ verbose thông thường.
    - `/fast on|off` lưu ghi đè phiên. Dùng tùy chọn `inherit` trong UI Sessions để xóa nó và quay về mặc định cấu hình.
    - `/fast` phụ thuộc vào provider: OpenAI/OpenAI Codex ánh xạ nó thành `service_tier=priority` trên endpoint Responses gốc, trong khi các yêu cầu Anthropic công khai trực tiếp, bao gồm lưu lượng được xác thực bằng OAuth gửi tới `api.anthropic.com`, ánh xạ nó thành `service_tier=auto` hoặc `standard_only`. Xem [OpenAI](/vi/providers/openai) và [Anthropic](/vi/providers/anthropic).
    - Tóm tắt lỗi công cụ vẫn được hiển thị khi liên quan, nhưng văn bản lỗi chi tiết chỉ được đưa vào khi `/verbose` là `on` hoặc `full`.
    - `/reasoning`, `/verbose`, và `/trace` có rủi ro trong bối cảnh nhóm: chúng có thể tiết lộ suy luận nội bộ, đầu ra công cụ, hoặc chẩn đoán plugin mà bạn không định công khai. Nên để chúng tắt, đặc biệt trong trò chuyện nhóm.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` lưu ngay mô hình phiên mới.
    - Nếu agent đang rảnh, lượt chạy tiếp theo dùng nó ngay lập tức.
    - Nếu một lượt chạy đã hoạt động, OpenClaw đánh dấu một chuyển đổi trực tiếp là đang chờ và chỉ khởi động lại vào mô hình mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra trả lời đã bắt đầu, chuyển đổi đang chờ có thể vẫn nằm trong hàng đợi cho đến cơ hội thử lại sau hoặc lượt người dùng tiếp theo.
    - Trong TUI cục bộ, `/crestodian [request]` quay lại từ TUI agent thông thường về Crestodian. Chế độ này tách biệt với chế độ cứu hộ kênh tin nhắn và không cấp quyền cấu hình từ xa.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Đường nhanh:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + mô hình).
    - **Cổng nhắc đến trong nhóm:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép bỏ qua yêu cầu nhắc đến.
    - **Lối tắt nội tuyến (chỉ người gửi trong danh sách cho phép):** một số lệnh cũng hoạt động khi được nhúng trong tin nhắn thông thường và bị loại bỏ trước khi mô hình thấy phần văn bản còn lại.
      - Ví dụ: `hey /status` kích hoạt một phản hồi trạng thái, và phần văn bản còn lại tiếp tục đi qua luồng thông thường.
    - Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Tin nhắn chỉ chứa lệnh không được phép sẽ bị bỏ qua im lặng, và các token `/...` nội tuyến được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Lệnh Skill:** Skills `user-invocable` được hiển thị dưới dạng lệnh slash. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); va chạm nhận hậu tố số (ví dụ `_2`).
      - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh gốc ngăn tạo lệnh riêng cho từng skill).
      - Theo mặc định, lệnh skill được chuyển tiếp đến mô hình như một yêu cầu thông thường.
      - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp đến công cụ (xác định, không dùng mô hình).
      - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/vi/prose).
    - **Đối số lệnh gốc:** Discord dùng tự động hoàn thành cho các tùy chọn động (và menu nút khi bạn bỏ qua đối số bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua đối số. Các lựa chọn động được giải quyết theo mô hình phiên đích, vì vậy các tùy chọn phụ thuộc mô hình như cấp độ `/think` tuân theo ghi đè `/model` của phiên đó.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` trả lời một câu hỏi runtime, không phải câu hỏi cấu hình: **agent này có thể dùng gì ngay bây giờ trong cuộc trò chuyện này**.

- `/tools` mặc định ngắn gọn và được tối ưu để quét nhanh.
- `/tools verbose` thêm mô tả ngắn.
- Các bề mặt lệnh gốc hỗ trợ đối số hiển thị cùng chuyển đổi chế độ như `compact|verbose`.
- Kết quả được giới hạn theo phiên, vì vậy việc thay đổi agent, kênh, thread, quyền của người gửi, hoặc mô hình có thể thay đổi đầu ra.
- `/tools` bao gồm các công cụ thực sự có thể truy cập trong runtime, bao gồm công cụ lõi, công cụ plugin đã kết nối, và công cụ do kênh sở hữu.

Để chỉnh sửa hồ sơ và ghi đè, hãy dùng bảng Tools của Control UI hoặc các bề mặt cấu hình/catalog thay vì xem `/tools` như một catalog tĩnh.

## Bề mặt mức sử dụng (hiển thị ở đâu)

- **Mức sử dụng/hạn mức của nhà cung cấp** (ví dụ: "Claude còn 80%") hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi bật theo dõi mức sử dụng. OpenClaw chuẩn hóa các cửa sổ của nhà cung cấp thành `% còn lại`; với MiniMax, các trường phần trăm chỉ báo phần còn lại được đảo trước khi hiển thị, và phản hồi `model_remains` ưu tiên mục mô hình chat cộng với nhãn gói có gắn thẻ mô hình.
- **Dòng token/bộ nhớ đệm** trong `/status` có thể quay về mục mức sử dụng transcript mới nhất khi ảnh chụp nhanh phiên trực tiếp quá ít dữ liệu. Các giá trị trực tiếp khác không hiện có vẫn được ưu tiên, và phương án dự phòng từ transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động cùng với tổng lớn hơn theo hướng prompt khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
- **Thực thi so với runtime:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên thực sự đang chạy phiên: `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP.
- **Token/chi phí theo từng phản hồi** được điều khiển bằng `/usage off|tokens|full` (được nối vào các phản hồi thông thường).
- `/model status` nói về **mô hình/xác thực/endpoint**, không phải mức sử dụng.

## Chọn mô hình (`/model`)

`/model` được triển khai dưới dạng một chỉ thị.

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

- `/model` và `/model list` hiển thị một bộ chọn nhỏ gọn, có đánh số (họ mô hình + các nhà cung cấp khả dụng).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với menu thả xuống cho nhà cung cấp và mô hình, cộng với bước Gửi.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

## Ghi đè gỡ lỗi

`/debug` cho phép bạn đặt các ghi đè cấu hình **chỉ ở runtime** (trong bộ nhớ, không ghi ra đĩa). Chỉ chủ sở hữu. Tắt theo mặc định; bật bằng `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Ghi đè có hiệu lực ngay với các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`. Dùng `/debug reset` để xóa mọi ghi đè và quay lại cấu hình trên đĩa.
</Note>

## Đầu ra trace của Plugin

`/trace` cho phép bạn bật/tắt **các dòng trace/gỡ lỗi Plugin theo phạm vi phiên** mà không bật toàn bộ chế độ chi tiết.

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
- Các dòng trace Plugin có thể xuất hiện trong `/status` và dưới dạng thông báo chẩn đoán tiếp theo sau phản hồi trợ lý thông thường.
- `/trace` không thay thế `/debug`; `/debug` vẫn quản lý các ghi đè cấu hình chỉ ở runtime.
- `/trace` không thay thế `/verbose`; đầu ra công cụ/trạng thái chi tiết thông thường vẫn thuộc về `/verbose`.

## Cập nhật cấu hình

`/config` ghi vào cấu hình trên đĩa của bạn (`openclaw.json`). Chỉ chủ sở hữu. Tắt theo mặc định; bật bằng `commands.config: true`.

Ví dụ:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Cấu hình được xác thực trước khi ghi; các thay đổi không hợp lệ bị từ chối. Các cập nhật `/config` được duy trì qua các lần khởi động lại.
</Note>

## Cập nhật MCP

`/mcp` ghi các định nghĩa máy chủ MCP do OpenClaw quản lý dưới `mcp.servers`. Chỉ chủ sở hữu. Tắt theo mặc định; bật bằng `commands.mcp: true`.

Ví dụ:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải cài đặt dự án do Pi sở hữu. Các bộ điều hợp runtime quyết định transport nào thực sự có thể thực thi.
</Note>

## Cập nhật Plugin

`/plugins` cho phép người vận hành kiểm tra các Plugin đã phát hiện và bật/tắt chúng trong cấu hình. Các luồng chỉ đọc có thể dùng `/plugin` làm bí danh. Tắt theo mặc định; bật bằng `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` và `/plugins show` dùng cơ chế phát hiện Plugin thực tế trên workspace hiện tại cùng với cấu hình trên đĩa.
- `/plugins install` cài đặt từ ClawHub, npm, git, thư mục cục bộ và kho lưu trữ.
- `/plugins enable|disable` chỉ cập nhật cấu hình Plugin; không cài đặt hoặc gỡ cài đặt Plugin.
- Các thay đổi bật và tắt sẽ hot-reload các bề mặt runtime Plugin của Gateway cho các lượt agent mới; yêu cầu cài đặt cần khởi động lại Gateway vì module nguồn Plugin đã thay đổi.

</Note>

## Ghi chú bề mặt

<AccordionGroup>
  <Accordion title="Phiên theo từng bề mặt">
    - **Lệnh văn bản** chạy trong phiên chat thông thường (DM dùng chung `main`, nhóm có phiên riêng).
    - **Lệnh gốc** dùng các phiên cô lập:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (nhắm tới phiên chat qua `CommandTargetSessionKey`)
    - **`/stop`** nhắm tới phiên chat đang hoạt động để có thể hủy lần chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw` duy nhất. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho từng lệnh tích hợp sẵn (cùng tên như `/help`). Menu đối số lệnh cho Slack được gửi dưới dạng các nút Block Kit tạm thời.

    Ngoại lệ gốc của Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

  </Accordion>
</AccordionGroup>

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại. `/side` là bí danh.

Khác với chat thông thường:

- nó dùng phiên hiện tại làm ngữ cảnh nền,
- nó chạy dưới dạng một lệnh gọi một lần **không có công cụ** riêng biệt,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi dưới dạng kết quả phụ trực tiếp thay vì thông báo trợ lý thông thường.

Điều đó khiến `/btw` hữu ích khi bạn muốn làm rõ tạm thời trong khi tác vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi và chi tiết UX của client.

## Liên quan

- [Tạo Skills](/vi/tools/creating-skills)
- [Skills](/vi/tools/skills)
- [Cấu hình Skills](/vi/tools/skills-config)
