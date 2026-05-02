---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền
sidebarTitle: Slash commands
summary: 'Lệnh dấu gạch chéo: dạng văn bản so với dạng nguyên bản, cấu hình và các lệnh được hỗ trợ'
title: Lệnh dấu gạch chéo
x-i18n:
    generated_at: "2026-05-02T10:55:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b469c4436dec92eb3712f71e5f54bf2c96b9b0b17d60a1533d8669c127caefee
    source_path: tools/slash-commands.md
    workflow: 16
---

Các lệnh được Gateway xử lý. Hầu hết lệnh phải được gửi dưới dạng tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh trò chuyện bash chỉ dành cho máy chủ dùng `! <cmd>` (với `/bash <cmd>` là bí danh).

Khi một cuộc hội thoại hoặc chuỗi được gắn với một phiên ACP, văn bản theo dõi thông thường sẽ được định tuyến tới harness ACP đó. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh ACP của OpenClaw, còn `/status` cùng `/unfocus` vẫn ở cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

Có hai hệ thống liên quan:

<AccordionGroup>
  <Accordion title="Lệnh">
    Các tin nhắn `/...` độc lập.
  </Accordion>
  <Accordion title="Chỉ thị">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Chỉ thị được loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong tin nhắn trò chuyện thông thường (không phải chỉ có chỉ thị), chúng được xem là "gợi ý nội tuyến" và **không** duy trì cài đặt phiên.
    - Trong tin nhắn chỉ có chỉ thị (tin nhắn chỉ chứa các chỉ thị), chúng được duy trì vào phiên và phản hồi bằng một xác nhận.
    - Chỉ thị chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là allowlist duy nhất được dùng; nếu không, ủy quyền đến từ allowlist/ghép đôi của kênh cộng với `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Phím tắt nội tuyến">
    Chỉ dành cho người gửi trong allowlist/được ủy quyền: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Chúng chạy ngay lập tức, được loại khỏi tin nhắn trước khi mô hình nhìn thấy, và phần văn bản còn lại tiếp tục đi qua luồng thông thường.

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
  Bật phân tích `/...` trong tin nhắn trò chuyện. Trên các bề mặt không có lệnh native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này thành `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh native. Tự động: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm slash command); bị bỏ qua đối với các provider không hỗ trợ native. Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo từng provider (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó trên Discord/Telegram khi khởi động. Các lệnh Slack được quản lý trong ứng dụng Slack và không bị xóa tự động.
</ParamField>
Trên Discord, đặc tả lệnh native có thể bao gồm `descriptionLocalizations`, OpenClaw xuất bản dưới dạng `description_localizations` của Discord và đưa vào các so sánh đối chiếu.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh **skill** dưới dạng native khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một slash command cho mỗi skill). Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo từng provider (bool hoặc `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell của máy chủ (`/bash <cmd>` là bí danh; yêu cầu allowlist `tools.elevated`).
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
  Bật `/plugins` (khám phá/trạng thái Plugin cộng với điều khiển cài đặt + bật/tắt).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè chỉ trong runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` cùng các hành động công cụ khởi động lại gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Đặt allowlist chủ sở hữu rõ ràng cho các bề mặt lệnh/công cụ chỉ dành cho chủ sở hữu. Đây là tài khoản người vận hành có thể phê duyệt các hành động nguy hiểm và chạy các lệnh như `/diagnostics`, `/export-trajectory`, và `/config`. Nó tách biệt với `commands.allowFrom` và với quyền truy cập ghép đôi DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: yêu cầu các lệnh chỉ dành cho chủ sở hữu phải có **danh tính chủ sở hữu** để chạy trên bề mặt đó. Khi `true`, người gửi phải khớp với một ứng viên chủ sở hữu đã phân giải (ví dụ một mục trong `commands.ownerAllowFrom` hoặc metadata chủ sở hữu native của provider) hoặc giữ phạm vi nội bộ `operator.admin` trên một kênh tin nhắn nội bộ. Một mục ký tự đại diện trong `allowFrom` của kênh, hoặc danh sách ứng viên chủ sở hữu trống/chưa phân giải, là **không** đủ — các lệnh chỉ dành cho chủ sở hữu sẽ mặc định bị từ chối trên kênh đó. Để tắt tùy chọn này nếu bạn muốn các lệnh chỉ dành cho chủ sở hữu chỉ được kiểm soát bởi `ownerAllowFrom` và các allowlist lệnh tiêu chuẩn.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Tùy chọn đặt secret HMAC được dùng khi `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist theo từng provider cho ủy quyền lệnh. Khi được cấu hình, nó là nguồn ủy quyền duy nhất cho lệnh và chỉ thị (allowlist/ghép đôi của kênh và `commands.useAccessGroups` bị bỏ qua). Dùng `"*"` cho mặc định toàn cục; các khóa riêng theo provider sẽ ghi đè nó.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi allowlist/chính sách cho lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Nguồn sự thật hiện tại:

- lệnh tích hợp sẵn của core đến từ `src/auto-reply/commands-registry.shared.ts`
- lệnh dock được tạo đến từ `src/auto-reply/commands-registry.data.ts`
- lệnh Plugin đến từ các lệnh gọi `registerCommand()` của Plugin
- tính khả dụng thực tế trên gateway của bạn vẫn phụ thuộc vào cờ cấu hình, bề mặt kênh, và các Plugin đã cài đặt/bật

### Lệnh tích hợp sẵn của core

<AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    - `/new [model]` bắt đầu một phiên mới; `/reset` là bí danh đặt lại.
    - Control UI chặn `/new` được gõ để tạo và chuyển sang một phiên dashboard mới; `/reset` được gõ vẫn chạy thao tác đặt lại tại chỗ của Gateway.
    - `/reset soft [message]` giữ transcript hiện tại, bỏ các id phiên backend CLI được tái sử dụng, và chạy lại việc tải startup/system-prompt tại chỗ.
    - `/compact [instructions]` compact ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction).
    - `/stop` hủy lượt chạy hiện tại.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` quản lý thời hạn gắn kết chuỗi.
    - `/export-session [path]` xuất phiên hiện tại sang HTML. Bí danh: `/export`.
    - `/export-trajectory [path]` yêu cầu phê duyệt exec, rồi xuất một [gói trajectory](/vi/tools/trajectory) JSONL cho phiên hiện tại. Dùng lệnh này khi bạn cần dòng thời gian prompt, công cụ, và transcript cho một phiên OpenClaw. Trong trò chuyện nhóm, prompt phê duyệt và kết quả xuất được gửi riêng cho chủ sở hữu. Bí danh: `/trajectory`.

  </Accordion>
  <Accordion title="Điều khiển mô hình và lượt chạy">
    - `/think <level>` đặt mức suy nghĩ. Các tùy chọn đến từ hồ sơ provider của mô hình đang hoạt động; các mức phổ biến là `off`, `minimal`, `low`, `medium`, và `high`, với các mức tùy chỉnh như `xhigh`, `adaptive`, `max`, hoặc nhị phân `on` chỉ ở nơi được hỗ trợ. Bí danh: `/thinking`, `/t`.
    - `/verbose on|off|full` bật/tắt đầu ra chi tiết. Bí danh: `/v`.
    - `/trace on|off` bật/tắt đầu ra trace Plugin cho phiên hiện tại.
    - `/fast [status|on|off]` hiển thị hoặc đặt chế độ nhanh.
    - `/reasoning [on|off|stream]` bật/tắt khả năng hiển thị reasoning. Bí danh: `/reason`.
    - `/elevated [on|off|ask|full]` bật/tắt chế độ elevated. Bí danh: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` hiển thị hoặc đặt mặc định exec.
    - `/model [name|#|status]` hiển thị hoặc đặt mô hình.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liệt kê các provider hoặc mô hình cho một provider đã được cấu hình/có auth khả dụng; thêm `all` để duyệt toàn bộ catalog của provider đó.
    - `/queue <mode>` quản lý hành vi hàng đợi (`steer`, `queue` cũ, `followup`, `collect`, `steer-backlog`, `interrupt`) cùng các tùy chọn như `debounce:0.5s cap:25 drop:summarize`; `/queue default` hoặc `/queue reset` xóa ghi đè phiên. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi steering](/vi/concepts/queue-steering).

  </Accordion>
  <Accordion title="Khám phá và trạng thái">
    - `/help` hiển thị tóm tắt trợ giúp ngắn.
    - `/commands` hiển thị catalog lệnh được tạo.
    - `/tools [compact|verbose]` hiển thị agent hiện tại có thể dùng gì ngay lúc này.
    - `/status` hiển thị trạng thái thực thi/runtime, bao gồm nhãn `Execution`/`Runtime` và mức sử dụng/hạn ngạch provider khi có.
    - `/diagnostics [note]` là luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu đối với lỗi Gateway và các lượt chạy Codex harness. Nó yêu cầu phê duyệt exec rõ ràng mỗi lần trước khi chạy `openclaw gateway diagnostics export --json`; không phê duyệt diagnostics bằng quy tắc cho phép tất cả. Sau khi phê duyệt, nó gửi một báo cáo có thể dán với đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư, và các id phiên liên quan. Trong trò chuyện nhóm, prompt phê duyệt và báo cáo được gửi riêng cho chủ sở hữu. Khi phiên đang hoạt động dùng OpenAI Codex harness, cùng phê duyệt đó cũng gửi phản hồi Codex liên quan tới máy chủ OpenAI và phản hồi hoàn tất liệt kê các id phiên OpenClaw, id chuỗi Codex, và lệnh `codex resume <thread-id>`. Xem [Xuất Diagnostics](/vi/gateway/diagnostics).
    - `/crestodian <request>` chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu.
    - `/tasks` liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại.
    - `/context [list|detail|json]` giải thích cách ngữ cảnh được lắp ráp.
    - `/whoami` hiển thị id người gửi của bạn. Bí danh: `/id`.
    - `/usage off|tokens|full|cost` kiểm soát phần chân trang mức sử dụng theo từng phản hồi hoặc in một tóm tắt chi phí cục bộ.

  </Accordion>
  <Accordion title="Skills, allowlist, phê duyệt">
    - `/skill <name> [input]` chạy một skill theo tên.
    - `/allowlist [list|add|remove] ...` quản lý các mục allowlist. Chỉ văn bản.
    - `/approve <id> <decision>` giải quyết các prompt phê duyệt exec.
    - `/btw <question>` hỏi một câu hỏi bên lề mà không thay đổi ngữ cảnh phiên trong tương lai. Xem [BTW](/vi/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` quản lý các lượt chạy tác nhân phụ cho phiên hiện tại.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` quản lý các phiên ACP và tùy chọn thời gian chạy.
    - `/focus <target>` liên kết luồng Discord hiện tại hoặc chủ đề/cuộc trò chuyện Telegram với một mục tiêu phiên.
    - `/unfocus` xóa liên kết hiện tại.
    - `/agents` liệt kê các tác nhân gắn với luồng cho phiên hiện tại.
    - `/kill <id|#|all>` hủy một hoặc tất cả các tác nhân phụ đang chạy.
    - `/steer <id|#> <message>` gửi chỉ dẫn tới một tác nhân phụ đang chạy. Bí danh: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` đọc hoặc ghi `openclaw.json`. Chỉ chủ sở hữu. Yêu cầu `commands.config: true`.
    - `/mcp show|get|set|unset` đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Chỉ chủ sở hữu. Yêu cầu `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` kiểm tra hoặc thay đổi trạng thái Plugin. `/plugin` là bí danh. Chỉ chủ sở hữu đối với thao tác ghi. Yêu cầu `commands.plugins: true`.
    - `/debug show|set|unset|reset` quản lý các ghi đè cấu hình chỉ dùng trong thời gian chạy. Chỉ chủ sở hữu. Yêu cầu `commands.debug: true`.
    - `/restart` khởi động lại OpenClaw khi được bật. Mặc định: bật; đặt `commands.restart: false` để tắt.
    - `/send on|off|inherit` đặt chính sách gửi. Chỉ chủ sở hữu.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` điều khiển TTS. Xem [TTS](/vi/tools/tts).
    - `/activation mention|always` đặt chế độ kích hoạt nhóm.
    - `/bash <command>` chạy một lệnh shell trên máy chủ. Chỉ văn bản. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` cùng với danh sách cho phép `tools.elevated`.
    - `!poll [sessionId]` kiểm tra một tác vụ bash nền.
    - `!stop [sessionId]` dừng một tác vụ bash nền.

  </Accordion>
</AccordionGroup>

### Lệnh dock được tạo

Lệnh dock chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Xem [Docking kênh](/vi/concepts/channel-docking) để biết cách thiết lập, ví dụ và khắc phục sự cố.

Lệnh dock được tạo từ các Plugin kênh có hỗ trợ lệnh gốc. Tập hợp đóng gói hiện tại:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Dùng lệnh dock từ cuộc trò chuyện trực tiếp để chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Tác nhân giữ nguyên ngữ cảnh phiên, nhưng các trả lời sau này cho phiên đó được gửi tới đối tượng ngang hàng của kênh đã chọn.

Lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và đối tượng ngang hàng đích phải nằm trong cùng một nhóm danh tính, ví dụ `["telegram:123", "discord:456"]`. Nếu một người dùng Telegram có id `123` gửi `/dock_discord`, OpenClaw lưu `lastChannel: "discord"` và `lastTo: "456"` trên phiên đang hoạt động. Nếu người gửi không được liên kết với một đối tượng ngang hàng Discord, lệnh sẽ trả lời bằng gợi ý thiết lập thay vì chuyển qua trò chuyện bình thường.

Docking chỉ thay đổi tuyến phiên đang hoạt động. Nó không tạo tài khoản kênh, cấp quyền truy cập, bỏ qua danh sách cho phép của kênh, hoặc di chuyển lịch sử bản ghi sang phiên khác. Dùng `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, hoặc một lệnh dock được tạo khác để chuyển tuyến lại.

### Lệnh Plugin đóng gói

Các Plugin đóng gói có thể thêm nhiều lệnh gạch chéo hơn. Các lệnh đóng gói hiện tại trong repo này:

- `/dreaming [on|off|status|help]` bật/tắt Dreaming bộ nhớ. Xem [Dreaming](/vi/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` quản lý luồng ghép nối/thiết lập thiết bị. Xem [Ghép nối](/vi/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tạm thời kích hoạt các lệnh nút điện thoại rủi ro cao.
- `/voice status|list [limit]|set <voiceId|name>` quản lý cấu hình giọng nói Talk. Trên Discord, tên lệnh gốc là `/talkvoice`.
- `/card ...` gửi các mẫu thẻ phong phú LINE. Xem [LINE](/vi/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` kiểm tra và điều khiển bộ khung máy chủ ứng dụng Codex đóng gói. Xem [Bộ khung Codex](/vi/plugins/codex-harness).
- Các lệnh chỉ dành cho QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Lệnh kỹ năng động

Các Skills mà người dùng có thể gọi cũng được hiển thị dưới dạng lệnh gạch chéo:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- Skills cũng có thể xuất hiện dưới dạng lệnh trực tiếp như `/prose` khi Skills/Plugin đăng ký chúng.
- đăng ký lệnh Skills gốc được điều khiển bởi `commands.nativeSkills` và `channels.<provider>.commands.nativeSkills`.
- đặc tả lệnh có thể cung cấp `descriptionLocalizations` cho các bề mặt gốc hỗ trợ mô tả bản địa hóa, bao gồm Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (ví dụ: `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` chấp nhận bí danh mô hình, `provider/model`, hoặc tên nhà cung cấp (khớp mờ); nếu không có kết quả khớp, văn bản được xem là nội dung tin nhắn.
    - Để xem phân tích đầy đủ về mức sử dụng theo nhà cung cấp, dùng `openclaw status --usage`.
    - `/allowlist add|remove` yêu cầu `commands.config=true` và tôn trọng `configWrites` của kênh.
    - Trong các kênh nhiều tài khoản, `/allowlist --account <id>` nhắm tới cấu hình và `/config set channels.<provider>.accounts.<id>...` cũng tôn trọng `configWrites` của tài khoản đích.
    - `/usage` điều khiển phần chân trang mức sử dụng cho mỗi phản hồi; `/usage cost` in bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
    - `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt.
    - `/plugins install <spec>` chấp nhận cùng các đặc tả Plugin như `openclaw plugins install`: đường dẫn/kho lưu trữ cục bộ, gói npm, `git:<repo>`, hoặc `clawhub:<pkg>`.
    - `/plugins enable|disable` cập nhật cấu hình Plugin và có thể nhắc khởi động lại.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Lệnh gốc chỉ dành cho Discord: `/vc join|leave|status` điều khiển kênh thoại (không có dạng văn bản). `join` yêu cầu một guild và kênh thoại/sân khấu đã chọn. Yêu cầu `channels.discord.voice` và lệnh gốc.
    - Các lệnh liên kết luồng Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu liên kết luồng hiệu dụng được bật (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
    - Tham chiếu lệnh ACP và hành vi thời gian chạy: [Tác nhân ACP](/vi/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` dùng để gỡ lỗi và tăng khả năng quan sát; hãy giữ nó **tắt** khi sử dụng bình thường.
    - `/trace` hẹp hơn `/verbose`: nó chỉ tiết lộ các dòng theo dõi/gỡ lỗi do Plugin sở hữu và giữ tắt phần trò chuyện công cụ verbose thông thường.
    - `/fast on|off` lưu một ghi đè phiên. Dùng tùy chọn `inherit` trong Sessions UI để xóa nó và quay về mặc định cấu hình.
    - `/fast` phụ thuộc vào nhà cung cấp: OpenAI/OpenAI Codex ánh xạ nó thành `service_tier=priority` trên các điểm cuối Responses gốc, trong khi các yêu cầu Anthropic công khai trực tiếp, bao gồm lưu lượng được xác thực OAuth gửi tới `api.anthropic.com`, ánh xạ nó thành `service_tier=auto` hoặc `standard_only`. Xem [OpenAI](/vi/providers/openai) và [Anthropic](/vi/providers/anthropic).
    - Tóm tắt lỗi công cụ vẫn được hiển thị khi liên quan, nhưng văn bản lỗi chi tiết chỉ được đưa vào khi `/verbose` là `on` hoặc `full`.
    - `/reasoning`, `/verbose`, và `/trace` có rủi ro trong môi trường nhóm: chúng có thể tiết lộ suy luận nội bộ, đầu ra công cụ, hoặc chẩn đoán Plugin mà bạn không định công khai. Nên để chúng tắt, đặc biệt trong trò chuyện nhóm.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` lưu mô hình phiên mới ngay lập tức.
    - Nếu tác nhân đang rảnh, lượt chạy tiếp theo dùng mô hình đó ngay.
    - Nếu một lượt chạy đã hoạt động, OpenClaw đánh dấu việc chuyển trực tiếp là đang chờ và chỉ khởi động lại vào mô hình mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra trả lời đã bắt đầu, chuyển đổi đang chờ có thể tiếp tục nằm trong hàng đợi cho đến cơ hội thử lại sau hoặc lượt người dùng tiếp theo.
    - Trong TUI cục bộ, `/crestodian [request]` trở về từ TUI tác nhân bình thường sang Crestodian. Điều này tách biệt với chế độ cứu hộ kênh tin nhắn và không cấp quyền cấu hình từ xa.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Đường nhanh:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + mô hình).
    - **Cổng yêu cầu nhắc tên trong nhóm:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép bỏ qua yêu cầu nhắc tên.
    - **Lối tắt nội tuyến (chỉ người gửi trong danh sách cho phép):** một số lệnh cũng hoạt động khi được nhúng trong tin nhắn bình thường và bị loại bỏ trước khi mô hình thấy phần văn bản còn lại.
      - Ví dụ: `hey /status` kích hoạt một trả lời trạng thái, và phần văn bản còn lại tiếp tục qua luồng bình thường.
    - Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Tin nhắn chỉ chứa lệnh không được ủy quyền bị âm thầm bỏ qua, và các token `/...` nội tuyến được xem là văn bản thuần.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Lệnh Skills:** Skills `user-invocable` được hiển thị dưới dạng lệnh gạch chéo. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); xung đột nhận hậu tố số (ví dụ `_2`).
      - `/skill <name> [input]` chạy một Skills theo tên (hữu ích khi giới hạn lệnh gốc ngăn tạo lệnh riêng cho từng Skills).
      - Theo mặc định, lệnh Skills được chuyển tiếp tới mô hình như một yêu cầu bình thường.
      - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp tới một công cụ (xác định, không qua mô hình).
      - Ví dụ: `/prose` (Plugin OpenProse) — xem [OpenProse](/vi/prose).
    - **Đối số lệnh gốc:** Discord dùng tự động hoàn thành cho các tùy chọn động (và menu nút khi bạn bỏ qua đối số bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua đối số. Các lựa chọn động được phân giải theo mô hình phiên đích, vì vậy các tùy chọn theo mô hình như cấp độ `/think` sẽ theo ghi đè `/model` của phiên đó.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` trả lời một câu hỏi về thời gian chạy, không phải câu hỏi về cấu hình: **tác nhân này có thể dùng gì ngay bây giờ trong cuộc trò chuyện này**.

- `/tools` mặc định ngắn gọn và được tối ưu để quét nhanh.
- `/tools verbose` thêm mô tả ngắn.
- Các bề mặt lệnh gốc hỗ trợ đối số hiển thị cùng công tắc chế độ như `compact|verbose`.
- Kết quả có phạm vi theo phiên, vì vậy việc thay đổi tác nhân, kênh, luồng, ủy quyền người gửi, hoặc mô hình có thể thay đổi đầu ra.
- `/tools` bao gồm các công cụ thực sự có thể truy cập trong thời gian chạy, bao gồm công cụ lõi, công cụ Plugin đã kết nối, và công cụ do kênh sở hữu.

Để chỉnh sửa hồ sơ và ghi đè, hãy dùng bảng Tools của Control UI hoặc các bề mặt cấu hình/catalog thay vì xem `/tools` như một catalog tĩnh.

## Bề mặt sử dụng (hiển thị ở đâu)

- **Mức sử dụng/hạn mức của nhà cung cấp** (ví dụ: "Claude còn 80%") hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi tính năng theo dõi mức sử dụng được bật. OpenClaw chuẩn hóa các cửa sổ của nhà cung cấp thành `% còn lại`; với MiniMax, các trường phần trăm chỉ biểu thị phần còn lại được đảo ngược trước khi hiển thị, và phản hồi `model_remains` ưu tiên mục mô hình chat cộng với nhãn gói được gắn thẻ theo mô hình.
- **Các dòng token/cache** trong `/status` có thể dùng dự phòng mục mức sử dụng transcript mới nhất khi snapshot phiên trực tiếp còn thưa. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên, và dự phòng từ transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động cùng tổng lớn hơn theo hướng prompt khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
- **Thực thi so với runtime:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên thực sự đang chạy phiên: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, hoặc backend ACP.
- **Token/chi phí theo từng phản hồi** được kiểm soát bằng `/usage off|tokens|full` (được thêm vào phản hồi thông thường).
- `/model status` nói về **mô hình/xác thực/endpoint**, không phải mức sử dụng.

## Lựa chọn mô hình (`/model`)

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

- `/model` và `/model list` hiển thị bộ chọn nhỏ gọn, được đánh số (họ mô hình + các nhà cung cấp khả dụng).
- Trên Discord, `/model` và `/models` mở bộ chọn tương tác với danh sách thả xuống nhà cung cấp và mô hình, cộng với bước Submit.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

## Ghi đè gỡ lỗi

`/debug` cho phép bạn đặt các ghi đè cấu hình **chỉ trong runtime** (bộ nhớ, không phải đĩa). Chỉ chủ sở hữu. Tắt theo mặc định; bật bằng `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Các ghi đè áp dụng ngay cho các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`. Dùng `/debug reset` để xóa tất cả ghi đè và quay lại cấu hình trên đĩa.
</Note>

## Đầu ra trace của Plugin

`/trace` cho phép bạn bật/tắt **các dòng trace/gỡ lỗi Plugin theo phạm vi phiên** mà không bật toàn bộ chế độ verbose.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Ghi chú:

- `/trace` không có đối số sẽ hiển thị trạng thái trace của phiên hiện tại.
- `/trace on` bật các dòng trace của Plugin cho phiên hiện tại.
- `/trace off` tắt lại chúng.
- Các dòng trace của Plugin có thể xuất hiện trong `/status` và dưới dạng thông báo chẩn đoán tiếp theo sau phản hồi trợ lý thông thường.
- `/trace` không thay thế `/debug`; `/debug` vẫn quản lý các ghi đè cấu hình chỉ trong runtime.
- `/trace` không thay thế `/verbose`; đầu ra verbose thông thường của công cụ/trạng thái vẫn thuộc về `/verbose`.

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
`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải cài đặt dự án do Pi sở hữu. Các bộ điều hợp runtime quyết định transport nào thực sự có thể thực thi.
</Note>

## Cập nhật Plugin

`/plugins` cho phép toán tử kiểm tra các Plugin đã phát hiện và bật/tắt trạng thái kích hoạt trong cấu hình. Các luồng chỉ đọc có thể dùng `/plugin` làm bí danh. Tắt theo mặc định; bật bằng `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` và `/plugins show` dùng cơ chế phát hiện Plugin thật đối với workspace hiện tại cộng với cấu hình trên đĩa.
- `/plugins enable|disable` chỉ cập nhật cấu hình Plugin; nó không cài đặt hoặc gỡ cài đặt Plugin.
- Sau các thay đổi bật/tắt, hãy khởi động lại Gateway để áp dụng chúng.

</Note>

## Ghi chú bề mặt

<AccordionGroup>
  <Accordion title="Số phiên theo từng bề mặt">
    - **Lệnh văn bản** chạy trong phiên chat thông thường (DM dùng chung `main`, nhóm có phiên riêng).
    - **Lệnh native** dùng các phiên cô lập:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (nhắm đến phiên chat qua `CommandTargetSessionKey`)
    - **`/stop`** nhắm đến phiên chat đang hoạt động để nó có thể hủy lượt chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw` duy nhất. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho từng lệnh tích hợp sẵn (cùng tên như `/help`). Menu đối số lệnh cho Slack được gửi dưới dạng các nút Block Kit tạm thời.

    Ngoại lệ native của Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

  </Accordion>
</AccordionGroup>

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại.

Khác với chat thông thường:

- nó dùng phiên hiện tại làm ngữ cảnh nền,
- nó chạy như một lệnh gọi một lần riêng biệt **không có công cụ**,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi dưới dạng kết quả phụ trực tiếp thay vì một tin nhắn trợ lý thông thường.

Điều đó khiến `/btw` hữu ích khi bạn muốn có một phần làm rõ tạm thời trong khi tác vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw what are we doing right now?
```

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi và chi tiết UX của client.

## Liên quan

- [Tạo Skills](/vi/tools/creating-skills)
- [Skills](/vi/tools/skills)
- [Cấu hình Skills](/vi/tools/skills-config)
