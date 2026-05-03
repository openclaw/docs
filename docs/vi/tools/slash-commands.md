---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền
sidebarTitle: Slash commands
summary: 'Lệnh dấu gạch chéo: dạng văn bản so với dạng gốc, cấu hình và các lệnh được hỗ trợ'
title: Lệnh dấu gạch chéo
x-i18n:
    generated_at: "2026-05-03T21:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Các lệnh được Gateway xử lý. Hầu hết các lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh trò chuyện bash chỉ dành cho máy chủ dùng `! <cmd>` (với `/bash <cmd>` làm bí danh).

Khi một cuộc trò chuyện hoặc luồng được gắn với một phiên ACP, văn bản theo dõi thông thường sẽ được định tuyến đến harness ACP đó. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh ACP của OpenClaw, và `/status` cùng `/unfocus` vẫn ở cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

Có hai hệ thống liên quan:

<AccordionGroup>
  <Accordion title="Lệnh">
    Các tin nhắn `/...` độc lập.
  </Accordion>
  <Accordion title="Chỉ thị">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Chỉ thị được loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong các tin nhắn trò chuyện thông thường (không phải chỉ có chỉ thị), chúng được xử lý như "gợi ý nội tuyến" và **không** duy trì thiết lập phiên.
    - Trong các tin nhắn chỉ có chỉ thị (tin nhắn chỉ chứa chỉ thị), chúng được duy trì vào phiên và trả lời bằng một xác nhận.
    - Chỉ thị chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là danh sách cho phép duy nhất được dùng; nếu không, ủy quyền đến từ danh sách cho phép/ghép đôi của kênh cộng với `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Lối tắt nội tuyến">
    Chỉ dành cho người gửi trong danh sách cho phép/được ủy quyền: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Chúng chạy ngay lập tức, được loại bỏ trước khi mô hình nhìn thấy tin nhắn, và phần văn bản còn lại tiếp tục qua luồng thông thường.

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
  Bật phân tích `/...` trong tin nhắn trò chuyện. Trên các bề mặt không có lệnh gốc (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này là `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm slash commands); bị bỏ qua với nhà cung cấp không hỗ trợ gốc. Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`). Trên Discord, `false` bỏ qua việc đăng ký slash-command và dọn dẹp trong lúc khởi động; các lệnh đã đăng ký trước đó có thể vẫn hiển thị cho đến khi bạn xóa chúng khỏi ứng dụng Discord. Các lệnh Slack được quản lý trong ứng dụng Slack và không bị xóa tự động.
</ParamField>
Trên Discord, đặc tả lệnh gốc có thể bao gồm `descriptionLocalizations`, mà OpenClaw xuất bản dưới dạng `description_localizations` của Discord và đưa vào các phép so sánh đối chiếu.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh **skill** theo cơ chế gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một slash command cho từng skill). Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell trên máy chủ (`/bash <cmd>` là bí danh; yêu cầu danh sách cho phép `tools.elevated`).
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
  Bật `/plugins` (khám phá/trạng thái plugin cùng các điều khiển cài đặt và bật/tắt).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (các ghi đè chỉ trong thời gian chạy).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` cùng các hành động công cụ khởi động lại gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Đặt danh sách cho phép chủ sở hữu rõ ràng cho các bề mặt lệnh/công cụ chỉ dành cho chủ sở hữu. Đây là tài khoản người vận hành là con người có thể phê duyệt các hành động nguy hiểm và chạy các lệnh như `/diagnostics`, `/export-trajectory`, và `/config`. Nó tách biệt với `commands.allowFrom` và với quyền truy cập ghép đôi DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: khiến các lệnh chỉ dành cho chủ sở hữu yêu cầu **danh tính chủ sở hữu** để chạy trên bề mặt đó. Khi là `true`, người gửi phải khớp với một ứng viên chủ sở hữu đã được phân giải (ví dụ một mục trong `commands.ownerAllowFrom` hoặc siêu dữ liệu chủ sở hữu gốc của nhà cung cấp) hoặc có phạm vi nội bộ `operator.admin` trên một kênh tin nhắn nội bộ. Một mục ký tự đại diện trong `allowFrom` của kênh, hoặc danh sách ứng viên chủ sở hữu trống/chưa được phân giải, là **không** đủ — các lệnh chỉ dành cho chủ sở hữu sẽ đóng khi lỗi trên kênh đó. Tắt tùy chọn này nếu bạn muốn các lệnh chỉ dành cho chủ sở hữu chỉ được chặn bởi `ownerAllowFrom` và các danh sách cho phép lệnh tiêu chuẩn.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Tùy chọn đặt bí mật HMAC được dùng khi `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng nhà cung cấp để ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho lệnh và chỉ thị (danh sách cho phép/ghép đôi của kênh và `commands.useAccessGroups` bị bỏ qua). Dùng `"*"` làm mặc định toàn cục; các khóa dành riêng cho nhà cung cấp sẽ ghi đè nó.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Áp dụng danh sách cho phép/chính sách cho lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Nguồn sự thật hiện tại:

- các lệnh tích hợp lõi đến từ `src/auto-reply/commands-registry.shared.ts`
- các lệnh dock được tạo đến từ `src/auto-reply/commands-registry.data.ts`
- các lệnh plugin đến từ các lời gọi `registerCommand()` của plugin
- khả năng dùng thực tế trên gateway của bạn vẫn phụ thuộc vào cờ cấu hình, bề mặt kênh, và các plugin đã cài đặt/bật

### Các lệnh tích hợp lõi

<AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    - `/new [model]` bắt đầu một phiên mới; `/reset` là bí danh đặt lại.
    - Control UI chặn `/new` được nhập để tạo và chuyển sang một phiên dashboard mới; `/reset` được nhập vẫn chạy thao tác đặt lại tại chỗ của Gateway.
    - `/reset soft [message]` giữ transcript hiện tại, loại bỏ các id phiên backend CLI đã dùng lại, và chạy lại việc tải startup/system-prompt tại chỗ.
    - `/compact [instructions]` nén ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction).
    - `/stop` hủy lượt chạy hiện tại.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` quản lý hết hạn gắn kết luồng.
    - `/export-session [path]` xuất phiên hiện tại sang HTML. Bí danh: `/export`.
    - `/export-trajectory [path]` yêu cầu phê duyệt exec, rồi xuất một [gói trajectory](/vi/tools/trajectory) JSONL cho phiên hiện tại. Dùng nó khi bạn cần dòng thời gian prompt, công cụ, và transcript cho một phiên OpenClaw. Trong trò chuyện nhóm, prompt phê duyệt và kết quả xuất được gửi riêng cho chủ sở hữu. Bí danh: `/trajectory`.

  </Accordion>
  <Accordion title="Điều khiển mô hình và lượt chạy">
    - `/think <level>` đặt mức suy nghĩ. Tùy chọn đến từ hồ sơ nhà cung cấp của mô hình đang hoạt động; các mức phổ biến là `off`, `minimal`, `low`, `medium`, và `high`, với các mức tùy chỉnh như `xhigh`, `adaptive`, `max`, hoặc nhị phân `on` chỉ ở nơi được hỗ trợ. Bí danh: `/thinking`, `/t`.
    - `/verbose on|off|full` bật/tắt đầu ra chi tiết. Bí danh: `/v`.
    - `/trace on|off` bật/tắt đầu ra trace plugin cho phiên hiện tại.
    - `/fast [status|on|off]` hiển thị hoặc đặt chế độ nhanh.
    - `/reasoning [on|off|stream]` bật/tắt khả năng hiển thị reasoning. Bí danh: `/reason`.
    - `/elevated [on|off|ask|full]` bật/tắt chế độ elevated. Bí danh: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` hiển thị hoặc đặt mặc định exec.
    - `/model [name|#|status]` hiển thị hoặc đặt mô hình.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liệt kê các nhà cung cấp hoặc mô hình đã cấu hình/có auth khả dụng cho một nhà cung cấp; thêm `all` để duyệt toàn bộ catalog của nhà cung cấp đó.
    - `/queue <mode>` quản lý hành vi hàng đợi (`steer`, `queue` cũ, `followup`, `collect`, `steer-backlog`, `interrupt`) cùng các tùy chọn như `debounce:0.5s cap:25 drop:summarize`; `/queue default` hoặc `/queue reset` xóa ghi đè phiên. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi steering](/vi/concepts/queue-steering).

  </Accordion>
  <Accordion title="Khám phá và trạng thái">
    - `/help` hiển thị tóm tắt trợ giúp ngắn.
    - `/commands` hiển thị catalog lệnh được tạo.
    - `/tools [compact|verbose]` hiển thị những gì tác tử hiện tại có thể dùng ngay bây giờ.
    - `/status` hiển thị trạng thái thực thi/thời gian chạy, bao gồm các nhãn `Execution`/`Runtime` và mức sử dụng/hạn mức nhà cung cấp khi có.
    - `/diagnostics [note]` là luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu cho lỗi Gateway và các lượt chạy harness Codex. Nó yêu cầu phê duyệt exec rõ ràng mỗi lần trước khi chạy `openclaw gateway diagnostics export --json`; không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi được phê duyệt, nó gửi một báo cáo có thể dán với đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư, và các id phiên liên quan. Trong trò chuyện nhóm, prompt phê duyệt và báo cáo được gửi riêng cho chủ sở hữu. Khi phiên hoạt động dùng harness OpenAI Codex, cùng phê duyệt đó cũng gửi phản hồi Codex liên quan đến máy chủ OpenAI và phản hồi hoàn tất liệt kê các id phiên OpenClaw, id luồng Codex, và lệnh `codex resume <thread-id>`. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics).
    - `/crestodian <request>` chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu.
    - `/tasks` liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại.
    - `/context [list|detail|json]` giải thích cách ngữ cảnh được lắp ghép.
    - `/whoami` hiển thị id người gửi của bạn. Bí danh: `/id`.
    - `/usage off|tokens|full|cost` kiểm soát chân trang mức sử dụng theo từng phản hồi hoặc in tóm tắt chi phí cục bộ.

  </Accordion>
  <Accordion title="Skills, danh sách cho phép, phê duyệt">
    - `/skill <name> [input]` chạy một skill theo tên.
    - `/allowlist [list|add|remove] ...` quản lý các mục danh sách cho phép. Chỉ văn bản.
    - `/approve <id> <decision>` giải quyết prompt phê duyệt exec.
    - `/btw <question>` hỏi một câu hỏi phụ mà không thay đổi ngữ cảnh phiên trong tương lai. Bí danh: `/side`. Xem [BTW](/vi/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` quản lý các lượt chạy tác nhân con cho phiên hiện tại.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` quản lý các phiên ACP và tùy chọn runtime.
    - `/focus <target>` liên kết luồng Discord hiện tại hoặc chủ đề/cuộc trò chuyện Telegram với một đích phiên.
    - `/unfocus` gỡ liên kết hiện tại.
    - `/agents` liệt kê các tác nhân gắn với luồng cho phiên hiện tại.
    - `/kill <id|#|all>` hủy một hoặc tất cả tác nhân con đang chạy.
    - `/steer <id|#> <message>` gửi chỉ dẫn đến một tác nhân con đang chạy. Bí danh: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` đọc hoặc ghi `openclaw.json`. Chỉ chủ sở hữu. Yêu cầu `commands.config: true`.
    - `/mcp show|get|set|unset` đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Chỉ chủ sở hữu. Yêu cầu `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` kiểm tra hoặc thay đổi trạng thái plugin. `/plugin` là bí danh. Việc ghi chỉ dành cho chủ sở hữu. Yêu cầu `commands.plugins: true`.
    - `/debug show|set|unset|reset` quản lý các ghi đè cấu hình chỉ dành cho runtime. Chỉ chủ sở hữu. Yêu cầu `commands.debug: true`.
    - `/restart` khởi động lại OpenClaw khi được bật. Mặc định: bật; đặt `commands.restart: false` để tắt.
    - `/send on|off|inherit` đặt chính sách gửi. Chỉ chủ sở hữu.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` điều khiển TTS. Xem [TTS](/vi/tools/tts).
    - `/activation mention|always` đặt chế độ kích hoạt nhóm.
    - `/bash <command>` chạy một lệnh shell trên máy chủ. Chỉ văn bản. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` cùng danh sách cho phép `tools.elevated`.
    - `!poll [sessionId]` kiểm tra một tác vụ bash chạy nền.
    - `!stop [sessionId]` dừng một tác vụ bash chạy nền.

  </Accordion>
</AccordionGroup>

### Các lệnh dock được tạo

Các lệnh dock chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Xem [Gắn kênh](/vi/concepts/channel-docking) để biết cách thiết lập, ví dụ và khắc phục sự cố.

Các lệnh dock được tạo từ plugin kênh có hỗ trợ lệnh native. Bộ tích hợp hiện tại:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Dùng lệnh dock từ một cuộc trò chuyện trực tiếp để chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Tác nhân giữ nguyên ngữ cảnh phiên, nhưng các phản hồi sau này cho phiên đó sẽ được gửi đến peer kênh đã chọn.

Các lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và peer đích phải nằm trong cùng một nhóm định danh, ví dụ `["telegram:123", "discord:456"]`. Nếu người dùng Telegram có id `123` gửi `/dock_discord`, OpenClaw lưu `lastChannel: "discord"` và `lastTo: "456"` trên phiên đang hoạt động. Nếu người gửi chưa được liên kết với một peer Discord, lệnh sẽ trả lời bằng gợi ý thiết lập thay vì chuyển tiếp sang trò chuyện thông thường.

Docking chỉ thay đổi tuyến phiên đang hoạt động. Nó không tạo tài khoản kênh, cấp quyền truy cập, bỏ qua danh sách cho phép của kênh, hoặc chuyển lịch sử transcript sang phiên khác. Dùng `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, hoặc một lệnh dock được tạo khác để chuyển tuyến lần nữa.

### Các lệnh plugin tích hợp

Plugin tích hợp có thể thêm nhiều lệnh slash hơn. Các lệnh tích hợp hiện tại trong repo này:

- `/dreaming [on|off|status|help]` bật/tắt Dreaming bộ nhớ. Xem [Dreaming](/vi/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` quản lý luồng ghép nối/thiết lập thiết bị. Xem [Ghép nối](/vi/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tạm thời kích hoạt các lệnh node điện thoại rủi ro cao.
- `/voice status|list [limit]|set <voiceId|name>` quản lý cấu hình giọng nói Talk. Trên Discord, tên lệnh native là `/talkvoice`.
- `/card ...` gửi các preset thẻ giàu nội dung của LINE. Xem [LINE](/vi/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` kiểm tra và điều khiển bộ khung app-server Codex tích hợp. Xem [bộ khung Codex](/vi/plugins/codex-harness).
- Các lệnh chỉ dành cho QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Các lệnh Skills động

Skills mà người dùng có thể gọi cũng được hiển thị dưới dạng lệnh slash:

- `/skill <name> [input]` luôn hoạt động như entrypoint chung.
- Skills cũng có thể xuất hiện dưới dạng lệnh trực tiếp như `/prose` khi skill/plugin đăng ký chúng.
- việc đăng ký lệnh skill native được điều khiển bởi `commands.nativeSkills` và `channels.<provider>.commands.nativeSkills`.
- thông số kỹ thuật của lệnh có thể cung cấp `descriptionLocalizations` cho các bề mặt native hỗ trợ mô tả đã bản địa hóa, bao gồm Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (ví dụ `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` chấp nhận bí danh model, `provider/model`, hoặc tên provider (khớp mờ); nếu không khớp, văn bản được xem là phần thân tin nhắn.
    - Để xem phân tích đầy đủ về mức dùng provider, dùng `openclaw status --usage`.
    - `/allowlist add|remove` yêu cầu `commands.config=true` và tuân thủ `configWrites` của kênh.
    - Trong các kênh nhiều tài khoản, `/allowlist --account <id>` nhắm vào cấu hình và `/config set channels.<provider>.accounts.<id>...` cũng tuân thủ `configWrites` của tài khoản đích.
    - `/usage` điều khiển chân trang mức dùng theo từng phản hồi; `/usage cost` in bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
    - `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt.
    - `/plugins install <spec>` chấp nhận cùng thông số plugin như `openclaw plugins install`: đường dẫn/kho lưu trữ cục bộ, gói npm, `git:<repo>`, hoặc `clawhub:<pkg>`, rồi yêu cầu khởi động lại Gateway vì các module nguồn plugin đã thay đổi.
    - `/plugins enable|disable` cập nhật cấu hình plugin và kích hoạt tải lại plugin Gateway cho các lượt tác nhân mới.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Lệnh native chỉ dành cho Discord: `/vc join|leave|status` điều khiển kênh thoại (không khả dụng dưới dạng văn bản). `join` yêu cầu một guild và kênh thoại/stage đã chọn. Yêu cầu `channels.discord.voice` và lệnh native.
    - Các lệnh gắn luồng Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu liên kết luồng hiệu dụng được bật (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
    - Tham chiếu lệnh ACP và hành vi runtime: [tác nhân ACP](/vi/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` dành cho gỡ lỗi và tăng khả năng quan sát; hãy để **tắt** trong sử dụng thông thường.
    - `/trace` hẹp hơn `/verbose`: nó chỉ tiết lộ các dòng trace/gỡ lỗi do plugin sở hữu và giữ phần trao đổi công cụ verbose thông thường ở trạng thái tắt.
    - `/fast on|off` lưu một ghi đè phiên. Dùng tùy chọn `inherit` trong UI Sessions để xóa nó và quay về mặc định cấu hình.
    - `/fast` phụ thuộc vào provider: OpenAI/OpenAI Codex ánh xạ nó thành `service_tier=priority` trên các endpoint Responses native, trong khi các yêu cầu Anthropic công khai trực tiếp, bao gồm lưu lượng được xác thực bằng OAuth gửi đến `api.anthropic.com`, ánh xạ nó thành `service_tier=auto` hoặc `standard_only`. Xem [OpenAI](/vi/providers/openai) và [Anthropic](/vi/providers/anthropic).
    - Tóm tắt lỗi công cụ vẫn được hiển thị khi có liên quan, nhưng văn bản lỗi chi tiết chỉ được đưa vào khi `/verbose` là `on` hoặc `full`.
    - `/reasoning`, `/verbose`, và `/trace` có rủi ro trong bối cảnh nhóm: chúng có thể tiết lộ reasoning nội bộ, đầu ra công cụ, hoặc chẩn đoán plugin mà bạn không định công khai. Nên để chúng tắt, đặc biệt trong trò chuyện nhóm.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` lưu model phiên mới ngay lập tức.
    - Nếu tác nhân đang rảnh, lượt chạy tiếp theo dùng nó ngay.
    - Nếu một lượt chạy đã hoạt động, OpenClaw đánh dấu việc chuyển live là đang chờ và chỉ khởi động lại vào model mới tại một điểm retry sạch.
    - Nếu hoạt động công cụ hoặc đầu ra phản hồi đã bắt đầu, chuyển đổi đang chờ có thể tiếp tục xếp hàng đến một cơ hội retry sau hoặc lượt người dùng kế tiếp.
    - Trong TUI cục bộ, `/crestodian [request]` quay lại từ TUI tác nhân thông thường về Crestodian. Điều này tách biệt với chế độ cứu hộ kênh tin nhắn và không cấp quyền cấu hình từ xa.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Đường nhanh:** các tin nhắn chỉ gồm lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + model).
    - **Cổng yêu cầu nhắc đến trong nhóm:** các tin nhắn chỉ gồm lệnh từ người gửi trong danh sách cho phép bỏ qua yêu cầu nhắc đến.
    - **Lối tắt inline (chỉ người gửi trong danh sách cho phép):** một số lệnh cũng hoạt động khi được nhúng trong tin nhắn thông thường và được loại bỏ trước khi model thấy phần văn bản còn lại.
      - Ví dụ: `hey /status` kích hoạt phản hồi trạng thái, và phần văn bản còn lại tiếp tục đi qua luồng thông thường.
    - Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Các tin nhắn chỉ gồm lệnh không được ủy quyền sẽ bị bỏ qua im lặng, và token `/...` inline được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Lệnh Skill:** Skills `user-invocable` được hiển thị dưới dạng lệnh slash. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); xung đột nhận hậu tố số (ví dụ `_2`).
      - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh native ngăn tạo lệnh riêng cho từng skill).
      - Theo mặc định, các lệnh skill được chuyển tiếp đến model như một yêu cầu thông thường.
      - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp đến một công cụ (xác định, không dùng model).
      - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/vi/prose).
    - **Đối số lệnh native:** Discord dùng tự động hoàn thành cho tùy chọn động (và menu nút khi bạn bỏ qua đối số bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua đối số. Các lựa chọn động được phân giải theo model phiên đích, nên các tùy chọn theo model như cấp độ `/think` tuân theo ghi đè `/model` của phiên đó.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` trả lời một câu hỏi runtime, không phải câu hỏi cấu hình: **tác nhân này có thể dùng gì ngay bây giờ trong cuộc trò chuyện này**.

- `/tools` mặc định ngắn gọn và được tối ưu để quét nhanh.
- `/tools verbose` thêm mô tả ngắn.
- Các bề mặt lệnh native hỗ trợ đối số hiển thị cùng công tắc chế độ như `compact|verbose`.
- Kết quả có phạm vi theo phiên, nên việc thay đổi tác nhân, kênh, luồng, ủy quyền người gửi, hoặc model có thể thay đổi đầu ra.
- `/tools` bao gồm các công cụ thật sự có thể truy cập ở runtime, bao gồm công cụ lõi, công cụ plugin đã kết nối, và công cụ do kênh sở hữu.

Để chỉnh sửa hồ sơ và ghi đè, dùng bảng Tools của Control UI hoặc các bề mặt cấu hình/catalog thay vì xem `/tools` như một catalog tĩnh.

## Các bề mặt mức dùng (hiển thị ở đâu)

- **Mức dùng/hạn mức của nhà cung cấp** (ví dụ: "Claude còn 80%") hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi bật theo dõi mức dùng. OpenClaw chuẩn hóa các cửa sổ của nhà cung cấp thành `% còn lại`; với MiniMax, các trường phần trăm chỉ-báo-còn-lại được đảo trước khi hiển thị, và phản hồi `model_remains` ưu tiên mục mô hình trò chuyện kèm nhãn gói được gắn thẻ mô hình.
- **Các dòng token/bộ nhớ đệm** trong `/status` có thể dự phòng về mục mức dùng transcript mới nhất khi snapshot phiên trực tiếp còn thưa. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên, và dự phòng transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động cùng tổng lớn hơn thiên về prompt khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
- **Thực thi so với runtime:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên đang thực sự chạy phiên: `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP.
- **Token/chi phí theo từng phản hồi** được điều khiển bằng `/usage off|tokens|full` (được thêm vào các phản hồi bình thường).
- `/model status` nói về **mô hình/xác thực/endpoint**, không phải mức dùng.

## Chọn mô hình (`/model`)

`/model` được triển khai như một chỉ thị.

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

- `/model` và `/model list` hiển thị một bộ chọn nhỏ gọn, có đánh số (họ mô hình + các nhà cung cấp có sẵn).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với menu thả xuống nhà cung cấp và mô hình, kèm bước Gửi.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

## Ghi đè gỡ lỗi

`/debug` cho phép bạn đặt các ghi đè cấu hình **chỉ runtime** (bộ nhớ, không phải đĩa). Chỉ chủ sở hữu. Tắt theo mặc định; bật bằng `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Ghi đè áp dụng ngay cho các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`. Dùng `/debug reset` để xóa tất cả ghi đè và trở về cấu hình trên đĩa.
</Note>

## Đầu ra trace Plugin

`/trace` cho phép bạn bật/tắt **các dòng trace/gỡ lỗi Plugin theo phạm vi phiên** mà không cần bật toàn bộ chế độ verbose.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Ghi chú:

- `/trace` không có đối số sẽ hiển thị trạng thái trace phiên hiện tại.
- `/trace on` bật các dòng trace Plugin cho phiên hiện tại.
- `/trace off` tắt lại chúng.
- Các dòng trace Plugin có thể xuất hiện trong `/status` và dưới dạng một tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.
- `/trace` không thay thế `/debug`; `/debug` vẫn quản lý các ghi đè cấu hình chỉ runtime.
- `/trace` không thay thế `/verbose`; đầu ra công cụ/trạng thái verbose bình thường vẫn thuộc về `/verbose`.

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
Cấu hình được xác thực trước khi ghi; các thay đổi không hợp lệ sẽ bị từ chối. Các cập nhật `/config` được duy trì qua các lần khởi động lại.
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
`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải thiết lập dự án do Pi sở hữu. Các bộ điều hợp runtime quyết định transport nào thực sự có thể thực thi.
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
- `/plugins list` và `/plugins show` dùng cơ chế phát hiện Plugin thật trên workspace hiện tại cộng với cấu hình trên đĩa.
- `/plugins install` cài đặt từ ClawHub, npm, git, thư mục cục bộ và archive.
- `/plugins enable|disable` chỉ cập nhật cấu hình Plugin; nó không cài đặt hoặc gỡ cài đặt Plugin.
- Các thay đổi bật và tắt sẽ hot-reload các bề mặt runtime Plugin của Gateway cho các lượt agent mới; cài đặt yêu cầu khởi động lại Gateway vì các mô-đun nguồn Plugin đã thay đổi.

</Note>

## Ghi chú bề mặt

<AccordionGroup>
  <Accordion title="Phiên theo từng bề mặt">
    - **Lệnh văn bản** chạy trong phiên trò chuyện bình thường (DM chia sẻ `main`, nhóm có phiên riêng).
    - **Lệnh gốc** dùng các phiên tách biệt:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (nhắm tới phiên trò chuyện qua `CommandTargetSessionKey`)
    - **`/stop`** nhắm tới phiên trò chuyện đang hoạt động để có thể hủy lượt chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw` duy nhất. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho mỗi lệnh tích hợp sẵn (cùng tên như `/help`). Menu đối số lệnh cho Slack được gửi dưới dạng các nút Block Kit tạm thời.

    Ngoại lệ gốc của Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack giữ riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

  </Accordion>
</AccordionGroup>

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại. `/side` là bí danh.

Khác với trò chuyện bình thường:

- nó dùng phiên hiện tại làm ngữ cảnh nền,
- nó chạy như một lệnh gọi một lần **không dùng công cụ** riêng biệt,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi như một kết quả phụ trực tiếp thay vì một tin nhắn trợ lý bình thường.

Điều đó khiến `/btw` hữu ích khi bạn muốn một phần làm rõ tạm thời trong lúc tác vụ chính tiếp tục chạy.

Ví dụ:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi và chi tiết UX của máy khách.

## Liên quan

- [Tạo Skills](/vi/tools/creating-skills)
- [Skills](/vi/tools/skills)
- [Cấu hình Skills](/vi/tools/skills-config)
