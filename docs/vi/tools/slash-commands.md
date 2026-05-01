---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền
sidebarTitle: Slash commands
summary: 'Lệnh gạch chéo: dạng văn bản so với dạng nguyên sinh, cấu hình và các lệnh được hỗ trợ'
title: Lệnh gạch chéo
x-i18n:
    generated_at: "2026-05-01T10:53:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfa4c8e294080e824b15f0b54842718f7913cf6d42b7edd4ca9695c3d4113924
    source_path: tools/slash-commands.md
    workflow: 16
---

Các lệnh được Gateway xử lý. Hầu hết lệnh phải được gửi dưới dạng tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh trò chuyện bash chỉ dành cho máy chủ dùng `! <cmd>` (với `/bash <cmd>` là bí danh).

Khi một cuộc trò chuyện hoặc luồng được liên kết với một phiên ACP, văn bản theo dõi thông thường sẽ được định tuyến đến harness ACP đó. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh ACP của OpenClaw, còn `/status` cùng `/unfocus` vẫn ở cục bộ mỗi khi xử lý lệnh được bật cho bề mặt đó.

Có hai hệ thống liên quan:

<AccordionGroup>
  <Accordion title="Lệnh">
    Tin nhắn `/...` độc lập.
  </Accordion>
  <Accordion title="Chỉ thị">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Chỉ thị được loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong tin nhắn trò chuyện thông thường (không phải chỉ gồm chỉ thị), chúng được xử lý như "gợi ý nội tuyến" và **không** duy trì thiết đặt phiên.
    - Trong tin nhắn chỉ gồm chỉ thị (tin nhắn chỉ chứa chỉ thị), chúng được duy trì vào phiên và trả lời bằng một xác nhận.
    - Chỉ thị chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là allowlist duy nhất được dùng; nếu không, ủy quyền đến từ allowlist/ghép cặp của kênh cộng với `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

  </Accordion>
  <Accordion title="Lối tắt nội tuyến">
    Chỉ dành cho người gửi trong allowlist/được ủy quyền: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Bật phân tích cú pháp `/...` trong tin nhắn trò chuyện. Trên các bề mặt không có lệnh gốc (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này thành `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm lệnh slash); bị bỏ qua với nhà cung cấp không hỗ trợ gốc. Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`). `false` xóa các lệnh đã đăng ký trước đó trên Discord/Telegram khi khởi động. Lệnh Slack được quản lý trong ứng dụng Slack và không bị xóa tự động.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh **skill** theo cách gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một lệnh slash cho mỗi skill). Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo từng nhà cung cấp (bool hoặc `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell trên máy chủ (`/bash <cmd>` là bí danh; yêu cầu allowlist `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Kiểm soát thời gian bash chờ trước khi chuyển sang chế độ nền (`0` đưa xuống nền ngay lập tức).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý dưới `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái Plugin cùng các điều khiển cài đặt + bật/tắt).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè chỉ trong runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` cùng các hành động công cụ khởi động lại Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Đặt allowlist chủ sở hữu rõ ràng cho các bề mặt lệnh/công cụ chỉ dành cho chủ sở hữu. Đây là tài khoản người vận hành có thể phê duyệt hành động nguy hiểm và chạy các lệnh như `/diagnostics`, `/export-trajectory`, và `/config`. Nó tách biệt với `commands.allowFrom` và với quyền truy cập ghép cặp DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: buộc lệnh chỉ dành cho chủ sở hữu yêu cầu **danh tính chủ sở hữu** để chạy trên bề mặt đó. Khi `true`, người gửi phải khớp với một ứng viên chủ sở hữu đã được phân giải (ví dụ một mục trong `commands.ownerAllowFrom` hoặc metadata chủ sở hữu gốc của nhà cung cấp) hoặc có phạm vi `operator.admin` nội bộ trên một kênh tin nhắn nội bộ. Một mục ký tự đại diện trong `allowFrom` của kênh, hoặc danh sách ứng viên chủ sở hữu trống/chưa được phân giải, là **không** đủ — lệnh chỉ dành cho chủ sở hữu sẽ đóng theo mặc định trên kênh đó. Tắt tùy chọn này nếu bạn muốn lệnh chỉ dành cho chủ sở hữu chỉ được kiểm soát bởi `ownerAllowFrom` và các allowlist lệnh tiêu chuẩn.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Tùy chọn đặt secret HMAC được dùng khi `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist theo từng nhà cung cấp cho ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho lệnh và chỉ thị (allowlist/ghép cặp kênh và `commands.useAccessGroups` bị bỏ qua). Dùng `"*"` làm mặc định toàn cục; khóa theo nhà cung cấp sẽ ghi đè nó.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi allowlist/chính sách cho lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Nguồn sự thật hiện tại:

- lệnh dựng sẵn lõi đến từ `src/auto-reply/commands-registry.shared.ts`
- lệnh dock được tạo đến từ `src/auto-reply/commands-registry.data.ts`
- lệnh Plugin đến từ các lệnh gọi `registerCommand()` của Plugin
- mức độ khả dụng thực tế trên gateway của bạn vẫn phụ thuộc vào cờ cấu hình, bề mặt kênh, và các Plugin đã cài đặt/bật

### Lệnh dựng sẵn lõi

<AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    - `/new [model]` bắt đầu một phiên mới; `/reset` là bí danh đặt lại.
    - `/reset soft [message]` giữ transcript hiện tại, bỏ các id phiên backend CLI được dùng lại, và chạy lại quá trình tải startup/system-prompt tại chỗ.
    - `/compact [instructions]` nén ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction).
    - `/stop` hủy lượt chạy hiện tại.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` quản lý thời hạn liên kết luồng.
    - `/export-session [path]` xuất phiên hiện tại sang HTML. Bí danh: `/export`.
    - `/export-trajectory [path]` yêu cầu phê duyệt exec, sau đó xuất một [gói trajectory](/vi/tools/trajectory) JSONL cho phiên hiện tại. Dùng khi bạn cần timeline prompt, công cụ, và transcript cho một phiên OpenClaw. Trong trò chuyện nhóm, lời nhắc phê duyệt và kết quả xuất được gửi riêng cho chủ sở hữu. Bí danh: `/trajectory`.

  </Accordion>
  <Accordion title="Mô hình và điều khiển lượt chạy">
    - `/think <level>` đặt mức suy nghĩ. Các tùy chọn đến từ hồ sơ nhà cung cấp của mô hình đang hoạt động; các mức thường gặp là `off`, `minimal`, `low`, `medium`, và `high`, với các mức tùy chỉnh như `xhigh`, `adaptive`, `max`, hoặc nhị phân `on` chỉ ở nơi được hỗ trợ. Bí danh: `/thinking`, `/t`.
    - `/verbose on|off|full` bật/tắt đầu ra verbose. Bí danh: `/v`.
    - `/trace on|off` bật/tắt đầu ra trace của Plugin cho phiên hiện tại.
    - `/fast [status|on|off]` hiển thị hoặc đặt chế độ nhanh.
    - `/reasoning [on|off|stream]` bật/tắt khả năng hiển thị reasoning. Bí danh: `/reason`.
    - `/elevated [on|off|ask|full]` bật/tắt chế độ elevated. Bí danh: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` hiển thị hoặc đặt mặc định exec.
    - `/model [name|#|status]` hiển thị hoặc đặt mô hình.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liệt kê các nhà cung cấp đã cấu hình/có xác thực khả dụng hoặc mô hình cho một nhà cung cấp; thêm `all` để duyệt toàn bộ danh mục của nhà cung cấp đó.
    - `/queue <mode>` quản lý hành vi hàng đợi (`steer`, `queue` kế thừa, `followup`, `collect`, `steer-backlog`, `interrupt`) cùng các tùy chọn như `debounce:0.5s cap:25 drop:summarize`; `/queue default` hoặc `/queue reset` xóa ghi đè phiên. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
  <Accordion title="Khám phá và trạng thái">
    - `/help` hiển thị tóm tắt trợ giúp ngắn.
    - `/commands` hiển thị danh mục lệnh được tạo.
    - `/tools [compact|verbose]` hiển thị những gì tác tử hiện tại có thể dùng ngay bây giờ.
    - `/status` hiển thị trạng thái thực thi/runtime, bao gồm nhãn `Execution`/`Runtime` và mức sử dụng/hạn mức nhà cung cấp khi có.
    - `/diagnostics [note]` là luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu cho lỗi Gateway và các lượt chạy harness Codex. Nó yêu cầu phê duyệt exec rõ ràng mỗi lần trước khi chạy `openclaw gateway diagnostics export --json`; không phê duyệt diagnostics bằng quy tắc cho phép tất cả. Sau khi phê duyệt, nó gửi một báo cáo có thể dán với đường dẫn gói cục bộ, tóm tắt manifest, ghi chú quyền riêng tư, và các id phiên liên quan. Trong trò chuyện nhóm, lời nhắc phê duyệt và báo cáo được gửi riêng cho chủ sở hữu. Khi phiên đang hoạt động dùng harness OpenAI Codex, cùng phê duyệt đó cũng gửi phản hồi Codex liên quan đến máy chủ OpenAI và phản hồi hoàn tất liệt kê id phiên OpenClaw, id luồng Codex, và lệnh `codex resume <thread-id>`. Xem [Xuất Diagnostics](/vi/gateway/diagnostics).
    - `/crestodian <request>` chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu.
    - `/tasks` liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại.
    - `/context [list|detail|json]` giải thích cách ngữ cảnh được lắp ráp.
    - `/whoami` hiển thị id người gửi của bạn. Bí danh: `/id`.
    - `/usage off|tokens|full|cost` kiểm soát chân trang mức sử dụng theo từng phản hồi hoặc in tóm tắt chi phí cục bộ.

  </Accordion>
  <Accordion title="Skills, allowlist, phê duyệt">
    - `/skill <name> [input]` chạy một skill theo tên.
    - `/allowlist [list|add|remove] ...` quản lý các mục allowlist. Chỉ văn bản.
    - `/approve <id> <decision>` giải quyết lời nhắc phê duyệt exec.
    - `/btw <question>` hỏi một câu hỏi phụ mà không thay đổi ngữ cảnh phiên trong tương lai. Xem [BTW](/vi/tools/btw).

  </Accordion>
  <Accordion title="Tác tử con và ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` quản lý các lượt chạy tác tử con cho phiên hiện tại.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` quản lý phiên ACP và tùy chọn runtime.
    - `/focus <target>` liên kết luồng Discord hoặc chủ đề/cuộc trò chuyện Telegram hiện tại với một mục tiêu phiên.
    - `/unfocus` xóa liên kết hiện tại.
    - `/agents` liệt kê các tác tử được liên kết với luồng cho phiên hiện tại.
    - `/kill <id|#|all>` hủy một hoặc tất cả tác tử con đang chạy.
    - `/steer <id|#> <message>` gửi điều hướng đến một tác tử con đang chạy. Bí danh: `/tell`.

  </Accordion>
  <Accordion title="Ghi và quản trị chỉ dành cho chủ sở hữu">
    - `/config show|get|set|unset` đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.config: true`.
    - `/mcp show|get|set|unset` đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` kiểm tra hoặc thay đổi trạng thái plugin. `/plugin` là một bí danh. Ghi chỉ dành cho chủ sở hữu. Yêu cầu `commands.plugins: true`.
    - `/debug show|set|unset|reset` quản lý các ghi đè cấu hình chỉ dành cho thời gian chạy. Chỉ dành cho chủ sở hữu. Yêu cầu `commands.debug: true`.
    - `/restart` khởi động lại OpenClaw khi được bật. Mặc định: bật; đặt `commands.restart: false` để tắt.
    - `/send on|off|inherit` đặt chính sách gửi. Chỉ dành cho chủ sở hữu.

  </Accordion>
  <Accordion title="Giọng nói, TTS, điều khiển kênh">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` điều khiển TTS. Xem [TTS](/vi/tools/tts).
    - `/activation mention|always` đặt chế độ kích hoạt nhóm.
    - `/bash <command>` chạy một lệnh shell trên máy chủ. Chỉ văn bản. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` cộng với danh sách cho phép `tools.elevated`.
    - `!poll [sessionId]` kiểm tra một tác vụ bash chạy nền.
    - `!stop [sessionId]` dừng một tác vụ bash chạy nền.

  </Accordion>
</AccordionGroup>

### Lệnh dock được tạo

Lệnh dock chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Xem [Gắn kênh](/vi/concepts/channel-docking) để biết cách thiết lập, ví dụ và khắc phục sự cố.

Lệnh dock được tạo từ các plugin kênh có hỗ trợ lệnh gốc. Bộ đi kèm hiện tại:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Dùng lệnh dock từ một cuộc trò chuyện trực tiếp để chuyển tuyến trả lời của phiên hiện tại sang một kênh đã liên kết khác. Agent giữ nguyên ngữ cảnh phiên, nhưng các trả lời sau này cho phiên đó sẽ được gửi tới đối tác kênh đã chọn.

Lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và đối tác đích phải nằm trong cùng nhóm định danh, ví dụ `["telegram:123", "discord:456"]`. Nếu một người dùng Telegram có id `123` gửi `/dock_discord`, OpenClaw lưu `lastChannel: "discord"` và `lastTo: "456"` trên phiên đang hoạt động. Nếu người gửi chưa được liên kết với đối tác Discord, lệnh sẽ trả lời bằng gợi ý thiết lập thay vì rơi qua trò chuyện thông thường.

Docking chỉ thay đổi tuyến phiên đang hoạt động. Nó không tạo tài khoản kênh, cấp quyền truy cập, bỏ qua danh sách cho phép của kênh, hoặc chuyển lịch sử bản ghi sang phiên khác. Dùng `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, hoặc một lệnh dock được tạo khác để chuyển tuyến lại.

### Lệnh plugin đi kèm

Các plugin đi kèm có thể thêm nhiều lệnh gạch chéo hơn. Các lệnh đi kèm hiện tại trong repo này:

- `/dreaming [on|off|status|help]` bật/tắt memory dreaming. Xem [Dreaming](/vi/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` quản lý luồng ghép nối/thiết lập thiết bị. Xem [Ghép nối](/vi/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` tạm thời kích hoạt các lệnh node điện thoại có rủi ro cao.
- `/voice status|list [limit]|set <voiceId|name>` quản lý cấu hình giọng Talk. Trên Discord, tên lệnh gốc là `/talkvoice`.
- `/card ...` gửi các mẫu thẻ phong phú LINE. Xem [LINE](/vi/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` kiểm tra và điều khiển harness app-server Codex đi kèm. Xem [Harness Codex](/vi/plugins/codex-harness).
- Lệnh chỉ dành cho QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Lệnh skill động

Các skill người dùng có thể gọi cũng được hiển thị dưới dạng lệnh gạch chéo:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- skills cũng có thể xuất hiện dưới dạng lệnh trực tiếp như `/prose` khi skill/plugin đăng ký chúng.
- việc đăng ký lệnh skill gốc được điều khiển bởi `commands.nativeSkills` và `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Ghi chú về đối số và bộ phân tích">
    - Lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (ví dụ `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` chấp nhận một bí danh model, `provider/model`, hoặc tên nhà cung cấp (khớp mờ); nếu không khớp, văn bản được xem là nội dung tin nhắn.
    - Để xem phân tích đầy đủ về mức sử dụng theo nhà cung cấp, dùng `openclaw status --usage`.
    - `/allowlist add|remove` yêu cầu `commands.config=true` và tuân theo `configWrites` của kênh.
    - Trong các kênh nhiều tài khoản, `/allowlist --account <id>` nhắm tới cấu hình và `/config set channels.<provider>.accounts.<id>...` cũng tuân theo `configWrites` của tài khoản đích.
    - `/usage` điều khiển chân trang mức sử dụng theo từng phản hồi; `/usage cost` in bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
    - `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt.
    - `/plugins install <spec>` chấp nhận cùng thông số plugin như `openclaw plugins install`: đường dẫn/kho lưu trữ cục bộ, gói npm, `git:<repo>`, hoặc `clawhub:<pkg>`.
    - `/plugins enable|disable` cập nhật cấu hình plugin và có thể nhắc khởi động lại.

  </Accordion>
  <Accordion title="Hành vi theo kênh">
    - Lệnh gốc chỉ dành cho Discord: `/vc join|leave|status` điều khiển kênh thoại (không khả dụng dưới dạng văn bản). `join` yêu cầu một guild và kênh thoại/sân khấu đã chọn. Yêu cầu `channels.discord.voice` và lệnh gốc.
    - Các lệnh gắn luồng Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu bật ràng buộc luồng hiệu lực (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
    - Tham chiếu lệnh ACP và hành vi thời gian chạy: [agent ACP](/vi/tools/acp-agents).

  </Accordion>
  <Accordion title="An toàn với verbose / trace / fast / reasoning">
    - `/verbose` dành cho gỡ lỗi và tăng khả năng quan sát; giữ **tắt** trong sử dụng thông thường.
    - `/trace` hẹp hơn `/verbose`: nó chỉ tiết lộ các dòng trace/debug do plugin sở hữu và giữ tắt tiếng ồn công cụ verbose thông thường.
    - `/fast on|off` lưu một ghi đè phiên. Dùng tùy chọn `inherit` trong UI Sessions để xóa nó và quay về mặc định cấu hình.
    - `/fast` phụ thuộc vào nhà cung cấp: OpenAI/OpenAI Codex ánh xạ nó tới `service_tier=priority` trên các endpoint Responses gốc, trong khi các yêu cầu Anthropic công khai trực tiếp, bao gồm lưu lượng đã xác thực OAuth gửi tới `api.anthropic.com`, ánh xạ nó tới `service_tier=auto` hoặc `standard_only`. Xem [OpenAI](/vi/providers/openai) và [Anthropic](/vi/providers/anthropic).
    - Tóm tắt lỗi công cụ vẫn được hiển thị khi phù hợp, nhưng văn bản lỗi chi tiết chỉ được đưa vào khi `/verbose` là `on` hoặc `full`.
    - `/reasoning`, `/verbose`, và `/trace` có rủi ro trong bối cảnh nhóm: chúng có thể tiết lộ suy luận nội bộ, đầu ra công cụ, hoặc chẩn đoán plugin mà bạn không định công khai. Nên để chúng tắt, đặc biệt trong trò chuyện nhóm.

  </Accordion>
  <Accordion title="Chuyển đổi model">
    - `/model` lưu model phiên mới ngay lập tức.
    - Nếu agent đang rảnh, lượt chạy tiếp theo dùng nó ngay.
    - Nếu một lượt chạy đã hoạt động, OpenClaw đánh dấu một chuyển đổi trực tiếp là đang chờ và chỉ khởi động lại vào model mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra trả lời đã bắt đầu, chuyển đổi đang chờ có thể tiếp tục được xếp hàng cho tới một cơ hội thử lại sau hoặc lượt người dùng tiếp theo.
    - Trong TUI cục bộ, `/crestodian [request]` quay lại từ TUI agent thông thường về Crestodian. Điều này tách biệt với chế độ cứu hộ kênh tin nhắn và không cấp quyền cấu hình từ xa.

  </Accordion>
  <Accordion title="Đường nhanh và phím tắt nội tuyến">
    - **Đường nhanh:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + model).
    - **Cổng nhắc đến trong nhóm:** tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép bỏ qua yêu cầu nhắc đến.
    - **Phím tắt nội tuyến (chỉ người gửi trong danh sách cho phép):** một số lệnh cũng hoạt động khi được nhúng trong tin nhắn thông thường và bị loại bỏ trước khi model nhìn thấy phần văn bản còn lại.
      - Ví dụ: `hey /status` kích hoạt một phản hồi trạng thái, và phần văn bản còn lại tiếp tục qua luồng thông thường.
    - Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Tin nhắn chỉ chứa lệnh không được ủy quyền bị bỏ qua im lặng, và các token `/...` nội tuyến được xem là văn bản thuần.

  </Accordion>
  <Accordion title="Lệnh skill và đối số gốc">
    - **Lệnh skill:** các skill `user-invocable` được hiển thị dưới dạng lệnh gạch chéo. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); va chạm nhận hậu tố số (ví dụ `_2`).
      - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh gốc ngăn tạo lệnh riêng cho từng skill).
      - Theo mặc định, lệnh skill được chuyển tiếp tới model như một yêu cầu thông thường.
      - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp tới một công cụ (xác định được, không qua model).
      - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/vi/prose).
    - **Đối số lệnh gốc:** Discord dùng tự động hoàn thành cho các tùy chọn động (và menu nút khi bạn bỏ qua đối số bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua đối số. Các lựa chọn động được phân giải theo model phiên đích, vì vậy các tùy chọn riêng theo model như mức `/think` tuân theo ghi đè `/model` của phiên đó.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` trả lời một câu hỏi thời gian chạy, không phải câu hỏi cấu hình: **agent này có thể dùng gì ngay bây giờ trong cuộc trò chuyện này**.

- `/tools` mặc định ngắn gọn và tối ưu cho việc quét nhanh.
- `/tools verbose` thêm mô tả ngắn.
- Các bề mặt lệnh gốc hỗ trợ đối số hiển thị cùng công tắc chế độ như `compact|verbose`.
- Kết quả có phạm vi theo phiên, vì vậy việc đổi agent, kênh, luồng, quyền của người gửi, hoặc model có thể thay đổi đầu ra.
- `/tools` bao gồm các công cụ thực sự có thể truy cập lúc chạy, bao gồm công cụ lõi, công cụ plugin đã kết nối, và công cụ do kênh sở hữu.

Để chỉnh sửa hồ sơ và ghi đè, dùng bảng Tools trong Control UI hoặc các bề mặt cấu hình/danh mục thay vì xem `/tools` như một danh mục tĩnh.

## Bề mặt mức sử dụng (hiển thị ở đâu)

- **Mức sử dụng/hạn mức nhà cung cấp** (ví dụ: "Claude còn 80%") xuất hiện trong `/status` cho nhà cung cấp model hiện tại khi bật theo dõi mức sử dụng. OpenClaw chuẩn hóa cửa sổ nhà cung cấp thành `% left`; với MiniMax, các trường phần trăm chỉ còn lại được đảo trước khi hiển thị, và phản hồi `model_remains` ưu tiên mục model trò chuyện cộng với nhãn gói có gắn thẻ model.
- **Dòng token/cache** trong `/status` có thể quay về mục mức sử dụng bản ghi mới nhất khi ảnh chụp phiên trực tiếp còn thưa. Các giá trị trực tiếp khác không hiện có vẫn thắng, và phần dự phòng từ bản ghi cũng có thể khôi phục nhãn model thời gian chạy đang hoạt động cộng với tổng lớn hơn theo hướng prompt khi các tổng đã lưu bị thiếu hoặc nhỏ hơn.
- **Thực thi so với thời gian chạy:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên thực sự đang chạy phiên: `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP.
- **Token/chi phí theo phản hồi** được điều khiển bởi `/usage off|tokens|full` (được thêm vào trả lời thông thường).
- `/model status` nói về **model/xác thực/endpoint**, không phải mức sử dụng.

## Chọn model (`/model`)

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

- `/model` và `/model list` hiển thị một bộ chọn được đánh số, ngắn gọn (họ model + các nhà cung cấp khả dụng).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với danh sách thả xuống nhà cung cấp và model cộng với bước Submit.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

## Ghi đè gỡ lỗi

`/debug` cho phép bạn đặt các ghi đè cấu hình **chỉ trong runtime** (trong bộ nhớ, không phải trên đĩa). Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật bằng `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Các ghi đè áp dụng ngay lập tức cho các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`. Dùng `/debug reset` để xóa tất cả ghi đè và quay lại cấu hình trên đĩa.
</Note>

## Đầu ra truy vết Plugin

`/trace` cho phép bạn bật/tắt **các dòng truy vết/gỡ lỗi Plugin theo phạm vi phiên** mà không bật chế độ chi tiết đầy đủ.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Ghi chú:

- `/trace` không có đối số sẽ hiển thị trạng thái truy vết phiên hiện tại.
- `/trace on` bật các dòng truy vết Plugin cho phiên hiện tại.
- `/trace off` tắt lại các dòng đó.
- Các dòng truy vết Plugin có thể xuất hiện trong `/status` và dưới dạng thông báo chẩn đoán tiếp theo sau phản hồi trợ lý thông thường.
- `/trace` không thay thế `/debug`; `/debug` vẫn quản lý các ghi đè cấu hình chỉ trong runtime.
- `/trace` không thay thế `/verbose`; đầu ra công cụ/trạng thái chi tiết thông thường vẫn thuộc về `/verbose`.

## Cập nhật cấu hình

`/config` ghi vào cấu hình trên đĩa của bạn (`openclaw.json`). Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật bằng `commands.config: true`.

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

`/mcp` ghi các định nghĩa máy chủ MCP do OpenClaw quản lý bên dưới `mcp.servers`. Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật bằng `commands.mcp: true`.

Ví dụ:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải thiết lập dự án do Pi sở hữu. Các bộ chuyển đổi runtime quyết định transport nào thực sự có thể thực thi.
</Note>

## Cập nhật Plugin

`/plugins` cho phép người vận hành kiểm tra các Plugin đã được phát hiện và bật/tắt chúng trong cấu hình. Các luồng chỉ đọc có thể dùng `/plugin` làm bí danh. Bị tắt theo mặc định; bật bằng `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` và `/plugins show` dùng quá trình phát hiện Plugin thực đối với workspace hiện tại cùng cấu hình trên đĩa.
- `/plugins enable|disable` chỉ cập nhật cấu hình Plugin; nó không cài đặt hoặc gỡ cài đặt Plugin.
- Sau các thay đổi bật/tắt, hãy khởi động lại Gateway để áp dụng chúng.

</Note>

## Ghi chú về bề mặt

<AccordionGroup>
  <Accordion title="Phiên theo từng bề mặt">
    - **Lệnh văn bản** chạy trong phiên trò chuyện thông thường (DM dùng chung `main`, nhóm có phiên riêng).
    - **Lệnh gốc** dùng các phiên tách biệt:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (nhắm tới phiên trò chuyện qua `CommandTargetSessionKey`)
    - **`/stop`** nhắm tới phiên trò chuyện đang hoạt động để có thể hủy lần chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw` duy nhất. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho mỗi lệnh tích hợp sẵn (cùng tên như `/help`). Menu đối số lệnh cho Slack được gửi dưới dạng các nút Block Kit tạm thời.

    Ngoại lệ lệnh gốc của Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

  </Accordion>
</AccordionGroup>

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại.

Khác với trò chuyện thông thường:

- nó dùng phiên hiện tại làm ngữ cảnh nền,
- nó chạy như một lệnh gọi một lần **không có công cụ** riêng biệt,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi dưới dạng kết quả phụ trực tiếp thay vì một tin nhắn trợ lý thông thường.

Điều đó khiến `/btw` hữu ích khi bạn muốn làm rõ tạm thời trong khi tác vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw what are we doing right now?
```

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi và chi tiết UX của client.

## Liên quan

- [Tạo Skills](/vi/tools/creating-skills)
- [Skills](/vi/tools/skills)
- [Cấu hình Skills](/vi/tools/skills-config)
