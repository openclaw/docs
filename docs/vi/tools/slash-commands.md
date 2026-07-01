---
read_when:
    - Sử dụng hoặc cấu hình lệnh chat
    - Gỡ lỗi định tuyến lệnh hoặc quyền truy cập
    - Hiểu cách các lệnh skill được đăng ký
sidebarTitle: Slash commands
summary: Tất cả lệnh slash, chỉ thị và lối tắt nội tuyến có sẵn — cấu hình, định tuyến và hành vi theo từng bề mặt.
title: Lệnh slash
x-i18n:
    generated_at: "2026-07-01T20:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway xử lý các lệnh được gửi dưới dạng tin nhắn độc lập bắt đầu bằng `/`.
Các lệnh bash chỉ dành cho máy chủ dùng `! <cmd>` (với `/bash <cmd>` là bí danh).

Khi một cuộc trò chuyện được liên kết với một phiên ACP, văn bản thông thường sẽ được định tuyến đến harness ACP. Các lệnh quản lý Gateway vẫn ở cục bộ: `/acp ...` luôn đến trình xử lý lệnh OpenClaw, còn `/status` và `/unfocus` vẫn ở cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

## Ba loại lệnh

<CardGroup cols={3}>
  <Card title="Lệnh" icon="terminal">
    Các tin nhắn `/...` độc lập do Gateway xử lý. Phải được gửi dưới dạng nội dung duy nhất trong tin nhắn.
  </Card>
  <Card title="Chỉ thị" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` — bị loại khỏi tin nhắn trước khi mô hình nhìn thấy. Duy trì cài đặt phiên khi được gửi riêng; hoạt động như gợi ý nội tuyến khi được gửi cùng văn bản khác.
  </Card>
  <Card title="Phím tắt nội tuyến" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — chạy ngay lập tức và bị loại trước khi mô hình nhìn thấy phần văn bản còn lại. Chỉ người gửi được ủy quyền.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Chi tiết hành vi chỉ thị">
    - Các chỉ thị bị loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong tin nhắn **chỉ có chỉ thị** (tin nhắn chỉ gồm các chỉ thị), chúng được duy trì vào phiên và trả lời bằng một xác nhận.
    - Trong tin nhắn **trò chuyện bình thường** có văn bản khác, chúng hoạt động như gợi ý nội tuyến và **không** duy trì cài đặt phiên.
    - Chỉ thị chỉ áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đó là danh sách cho phép duy nhất được dùng; nếu không, quyền ủy quyền đến từ danh sách cho phép/ghép đôi của kênh cộng với `commands.useAccessGroups`. Người gửi không được ủy quyền sẽ thấy chỉ thị được xử lý như văn bản thuần.

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
  Bật phân tích cú pháp `/...` trong tin nhắn trò chuyện. Trên các bề mặt không có lệnh gốc (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi được đặt thành `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack; bị bỏ qua với nhà cung cấp không hỗ trợ gốc. Ghi đè theo từng kênh bằng `channels.<provider>.commands.native`. Trên Discord, `false` bỏ qua đăng ký slash-command; các lệnh đã đăng ký trước đó có thể vẫn hiển thị cho đến khi bị xóa.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký lệnh Skills theo cách gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack. Ghi đè bằng `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy lệnh shell trên máy chủ (bí danh `/bash <cmd>`). Yêu cầu danh sách cho phép `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Thời gian bash chờ trước khi chuyển sang chế độ nền (`0` đưa vào nền ngay lập tức).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`). Chỉ chủ sở hữu.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý dưới `mcp.servers`). Chỉ chủ sở hữu.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái Plugin cộng với cài đặt + bật/tắt). Chỉ chủ sở hữu được ghi.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè cấu hình chỉ trong thời gian chạy). Chỉ chủ sở hữu.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` và các hành động công cụ khởi động lại gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Danh sách cho phép chủ sở hữu rõ ràng cho các bề mặt lệnh chỉ dành cho chủ sở hữu. Tách biệt với `commands.allowFrom` và quyền truy cập ghép đôi DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: yêu cầu danh tính chủ sở hữu cho các lệnh chỉ dành cho chủ sở hữu. Khi `true`, người gửi phải khớp với `commands.ownerAllowFrom` hoặc có phạm vi nội bộ `operator.admin`. Một mục ký tự đại diện `allowFrom` là **không** đủ.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách id chủ sở hữu xuất hiện trong prompt hệ thống.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Bí mật HMAC được dùng khi `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng nhà cung cấp cho ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền **duy nhất** cho lệnh và chỉ thị. Dùng `"*"` làm mặc định toàn cục; các khóa dành riêng cho nhà cung cấp sẽ ghi đè nó.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi danh sách cho phép/chính sách cho lệnh khi `commands.allowFrom` không được đặt.
</ParamField>

## Danh sách lệnh

Lệnh đến từ ba nguồn:

- **Tích hợp sẵn trong lõi:** `src/auto-reply/commands-registry.shared.ts`
- **Lệnh dock được tạo:** `src/auto-reply/commands-registry.data.ts`
- **Lệnh Plugin:** các lệnh gọi `registerCommand()` của Plugin

Tính khả dụng phụ thuộc vào cờ cấu hình, bề mặt kênh và các Plugin đã cài đặt/bật.

### Lệnh lõi

<AccordionGroup>
  <Accordion title="Phiên và lần chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/new [model]` | Lưu trữ phiên hiện tại và bắt đầu một phiên mới |
    | `/reset [soft [message]]` | Đặt lại phiên hiện tại tại chỗ. `soft` giữ bản ghi hội thoại, bỏ các id phiên backend CLI được tái sử dụng, rồi chạy lại khởi động |
    | `/name <title>` | Đặt tên hoặc đổi tên phiên hiện tại. Bỏ qua tiêu đề để xem tên hiện tại và một gợi ý |
    | `/compact [instructions]` | Compact ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction) |
    | `/stop` | Hủy lần chạy hiện tại |
    | `/session idle <duration\|off>` | Quản lý thời hạn hết hạn nhàn rỗi của liên kết chuỗi |
    | `/session max-age <duration\|off>` | Quản lý thời hạn hết hạn tuổi tối đa của liên kết chuỗi |
    | `/export-session [path]` | Xuất phiên hiện tại sang HTML. Bí danh: `/export` |
    | `/export-trajectory [path]` | Xuất gói quỹ đạo JSONL cho phiên hiện tại. Bí danh: `/trajectory` |

    <Note>
      UI điều khiển chặn `/new` được nhập để tạo và chuyển sang một phiên bảng điều khiển mới, trừ khi `session.dmScope: "main"` được cấu hình và cha hiện tại là phiên chính của tác nhân — trong trường hợp đó `/new` đặt lại phiên chính tại chỗ. `/reset` được nhập vẫn chạy đặt lại tại chỗ của Gateway. Dùng `/model default` khi bạn muốn xóa lựa chọn mô hình phiên đã ghim.
    </Note>

  </Accordion>

  <Accordion title="Mô hình và điều khiển lần chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/think <level\|default>` | Đặt mức suy nghĩ hoặc xóa ghi đè phiên. Bí danh: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Bật/tắt đầu ra chi tiết. Bí danh: `/v` |
    | `/trace on\|off` | Bật/tắt đầu ra truy vết Plugin cho phiên hiện tại |
    | `/fast [status\|auto\|on\|off\|default]` | Hiển thị, đặt hoặc xóa chế độ nhanh |
    | `/reasoning [on\|off\|stream]` | Bật/tắt khả năng hiển thị reasoning. Bí danh: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Bật/tắt chế độ nâng quyền. Bí danh: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Hiển thị hoặc đặt mặc định exec |
    | `/login [codex\|openai\|openai-codex]` | Ghép đôi đăng nhập Codex/OpenAI từ một cuộc trò chuyện riêng tư hoặc phiên giao diện web. Chỉ chủ sở hữu/quản trị viên |
    | `/model [name\|#\|status]` | Hiển thị hoặc đặt mô hình |
    | `/models [provider] [page] [limit=<n>\|all]` | Liệt kê nhà cung cấp hoặc mô hình đã cấu hình/có sẵn xác thực |
    | `/queue <mode>` | Quản lý hành vi hàng đợi lần chạy đang hoạt động. Xem [Queue](/vi/concepts/queue) và [Queue steering](/vi/concepts/queue-steering) |
    | `/steer <message>` | Chèn hướng dẫn vào lần chạy đang hoạt động. Bí danh: `/tell`. Xem [Steer](/vi/tools/steer) |

    <AccordionGroup>
      <Accordion title="an toàn verbose / trace / fast / reasoning">
        - `/verbose` dùng để gỡ lỗi — giữ nó **tắt** trong sử dụng bình thường.
        - `/trace` chỉ tiết lộ các dòng truy vết/gỡ lỗi do Plugin sở hữu; phần trò chuyện chi tiết bình thường vẫn tắt.
        - `/fast auto|on|off` duy trì một ghi đè phiên; dùng tùy chọn `inherit` trong UI Phiên để xóa nó.
        - `/fast` phụ thuộc vào nhà cung cấp: OpenAI/Codex ánh xạ nó sang `service_tier=priority`; các yêu cầu Anthropic trực tiếp ánh xạ nó sang `service_tier=auto` hoặc `standard_only`.
        - `/reasoning`, `/verbose` và `/trace` có rủi ro trong thiết lập nhóm — chúng có thể tiết lộ reasoning nội bộ hoặc chẩn đoán Plugin. Giữ chúng tắt trong trò chuyện nhóm.

      </Accordion>
      <Accordion title="Chi tiết chuyển đổi mô hình">
        - `/model` duy trì mô hình mới vào phiên ngay lập tức.
        - Nếu tác nhân đang nhàn rỗi, lần chạy tiếp theo dùng nó ngay.
        - Nếu một lần chạy đang hoạt động, việc chuyển đổi được đánh dấu là đang chờ và áp dụng tại điểm thử lại sạch tiếp theo.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Khám phá và trạng thái">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/help` | Hiển thị tóm tắt trợ giúp ngắn |
    | `/commands` | Hiển thị danh mục lệnh được tạo |
    | `/tools [compact\|verbose]` | Hiển thị những gì tác nhân hiện tại có thể dùng ngay bây giờ |
    | `/status` | Hiển thị trạng thái thực thi/thời gian chạy, thời gian hoạt động của Gateway và hệ thống, tình trạng Plugin, cộng với mức sử dụng/hạn mức nhà cung cấp |
    | `/status plugins` | Hiển thị tình trạng Plugin chi tiết: lỗi tải, cách ly, lỗi kênh, vấn đề phụ thuộc, thông báo tương thích |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Quản lý [mục tiêu](/vi/tools/goal) bền vững của phiên hiện tại |
    | `/diagnostics [note]` | Luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu. Luôn yêu cầu phê duyệt exec |
    | `/crestodian <request>` | Chạy trình trợ giúp thiết lập và sửa chữa Crestodian từ DM của chủ sở hữu |
    | `/tasks` | Liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại |
    | `/context [list\|detail\|map\|json]` | Giải thích cách ngữ cảnh được lắp ráp |
    | `/whoami` | Hiển thị id người gửi của bạn. Bí danh: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Điều khiển chân trang mức sử dụng theo từng phản hồi (`reset`/`inherit`/`clear`/`default` xóa ghi đè phiên để kế thừa lại mặc định đã cấu hình) hoặc in tóm tắt chi phí cục bộ |
  </Accordion>

  <Accordion title="Skills, danh sách cho phép, phê duyệt">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/skill <name> [input]` | Chạy một skill theo tên |
    | `/allowlist [list\|add\|remove] ...` | Quản lý các mục danh sách cho phép. Chỉ văn bản |
    | `/approve <id> <decision>` | Giải quyết lời nhắc phê duyệt exec hoặc Plugin |
    | `/btw <question>` | Hỏi một câu hỏi phụ mà không thay đổi ngữ cảnh phiên. Bí danh: `/side`. Xem [BTW](/vi/tools/btw) |
  </Accordion>

  <Accordion title="Subagent và ACP">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/subagents list\|log\|info` | Kiểm tra các lần chạy sub-agent cho phiên hiện tại |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Quản lý phiên ACP và tùy chọn runtime. Điều khiển runtime yêu cầu chủ sở hữu bên ngoài hoặc danh tính quản trị viên Gateway nội bộ |
    | `/focus <target>` | Gắn luồng Discord hiện tại hoặc chủ đề Telegram với một mục tiêu phiên |
    | `/unfocus` | Gỡ liên kết luồng hiện tại |
    | `/agents` | Liệt kê các agent được gắn với luồng cho phiên hiện tại |
  </Accordion>

  <Accordion title="Ghi chỉ dành cho chủ sở hữu và quản trị">
    | Lệnh | Yêu cầu | Mô tả |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý. Chỉ dành cho chủ sở hữu |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Kiểm tra hoặc thay đổi trạng thái plugin. Ghi chỉ dành cho chủ sở hữu. Bí danh: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Ghi đè cấu hình chỉ trong runtime. Chỉ dành cho chủ sở hữu |
    | `/restart` | `commands.restart: true` (mặc định) | Khởi động lại OpenClaw |
    | `/send on\|off\|inherit` | chủ sở hữu | Đặt chính sách gửi |
  </Accordion>

  <Accordion title="Giọng nói, TTS, điều khiển kênh">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Điều khiển TTS. Xem [TTS](/vi/tools/tts) |
    | `/activation mention\|always` | Đặt chế độ kích hoạt nhóm |
    | `/bash <command>` | Chạy lệnh shell trên máy chủ. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` |
    | `!poll [sessionId]` | Kiểm tra một tác vụ bash nền |
    | `!stop [sessionId]` | Dừng một tác vụ bash nền |
  </Accordion>
</AccordionGroup>

### Lệnh dock

Lệnh dock chuyển tuyến trả lời của phiên đang hoạt động sang một kênh đã liên kết khác.
Xem [Gắn kênh](/vi/concepts/channel-docking) để thiết lập và khắc phục sự cố.

Được tạo từ các plugin kênh có hỗ trợ lệnh gốc:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Lệnh dock yêu cầu `session.identityLinks`. Người gửi nguồn và peer đích
phải thuộc cùng một nhóm danh tính.

### Lệnh plugin đi kèm

| Lệnh                                                                                         | Mô tả                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Bật/tắt Dreaming bộ nhớ (chủ sở hữu hoặc quản trị viên Gateway). Xem [Dreaming](/vi/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Quản lý ghép đôi thiết bị. Xem [Ghép đôi](/vi/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | Tạm thời kích hoạt các lệnh nút điện thoại rủi ro cao                                  |
| `/voice status\|list\|set <voiceId>`                                                         | Quản lý cấu hình giọng nói Talk. Tên gốc trên Discord: `/talkvoice`                    |
| `/card ...`                                                                                  | Gửi các mẫu thẻ phong phú LINE. Xem [LINE](/vi/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Điều khiển harness app-server Codex. Xem [Codex harness](/vi/plugins/codex-harness)       |

Chỉ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Lệnh Skills

Skills mà người dùng có thể gọi được hiển thị dưới dạng lệnh slash:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- Skills có thể đăng ký làm lệnh trực tiếp (ví dụ: `/prose` cho OpenProse).
- Đăng ký lệnh kỹ năng gốc được kiểm soát bởi `commands.nativeSkills` và
  `channels.<provider>.commands.nativeSkills`.
- Tên được làm sạch thành `a-z0-9_` (tối đa 32 ký tự); xung đột sẽ nhận hậu tố số.

<AccordionGroup>
  <Accordion title="Điều phối lệnh kỹ năng">
    Theo mặc định, lệnh kỹ năng được định tuyến tới mô hình như một yêu cầu bình thường.

    Skills có thể khai báo `command-dispatch: tool` để định tuyến trực tiếp tới một công cụ
    (xác định, không có mô hình tham gia). Ví dụ: `/prose` (plugin OpenProse)
    — xem [OpenProse](/vi/prose).

  </Accordion>
  <Accordion title="Đối số lệnh gốc">
    Discord dùng tự động hoàn thành cho các tùy chọn động và menu nút khi các đối số bắt buộc
    bị bỏ qua. Telegram và Slack hiển thị menu nút cho các lệnh có lựa chọn.
    Lựa chọn động được phân giải theo mô hình phiên đích, nên các tùy chọn theo
    mô hình cụ thể như mức `/think` sẽ tuân theo ghi đè `/model` của phiên.
  </Accordion>
</AccordionGroup>

## `/tools` — agent có thể dùng gì ngay bây giờ

`/tools` trả lời một câu hỏi runtime: **agent này có thể dùng gì ngay lúc này trong
cuộc hội thoại này** — không phải một danh mục cấu hình tĩnh.

```text
/tools         # chế độ xem gọn
/tools verbose # kèm mô tả ngắn
```

Kết quả nằm trong phạm vi phiên. Việc thay đổi agent, kênh, luồng, quyền
của người gửi hoặc mô hình có thể thay đổi đầu ra. Để chỉnh sửa hồ sơ và ghi đè,
hãy dùng bảng Tools trong Control UI hoặc các bề mặt cấu hình.

## `/model` — chọn mô hình

```text
/model             # hiển thị bộ chọn mô hình
/model list        # tương tự
/model 3           # chọn theo số từ bộ chọn
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # xóa lựa chọn mô hình của phiên
/model status      # chế độ xem chi tiết với endpoint và chế độ API
```

Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với danh sách thả xuống
nhà cung cấp và mô hình. Bộ chọn tôn trọng `agents.defaults.models`, bao gồm
các mục `provider/*`.

## `/config` — ghi cấu hình trên đĩa

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Cấu hình được xác thực trước khi ghi. Các thay đổi không hợp lệ bị từ chối. `/config`
được duy trì qua các lần khởi động lại.

## `/mcp` — cấu hình máy chủ MCP

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải trong cài đặt dự án embedded-agent.

## `/debug` — ghi đè chỉ trong runtime

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.debug: true`.
  Ghi đè áp dụng ngay cho các lần đọc cấu hình mới nhưng **không** ghi ra đĩa.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — quản lý plugin

<Note>
  Ghi chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` cập nhật cấu hình plugin và tải lại nóng runtime plugin Gateway
cho các lượt agent mới. `/plugins install` tự động khởi động lại các Gateway được quản lý
vì module nguồn plugin đã thay đổi.

## `/trace` — đầu ra trace của plugin

```text
/trace          # hiển thị trạng thái trace hiện tại
/trace on
/trace off
```

`/trace` hiển thị các dòng trace/debug plugin trong phạm vi phiên mà không cần bật đầy đủ
chế độ verbose. Nó không thay thế `/debug` (ghi đè runtime) hoặc `/verbose` (đầu ra
công cụ bình thường).

## `/btw` — câu hỏi phụ

`/btw` là một câu hỏi phụ nhanh về ngữ cảnh phiên hiện tại. Bí danh: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Khác với một tin nhắn bình thường:

- Dùng phiên hiện tại làm ngữ cảnh nền.
- Trong các phiên Codex harness, chạy như một luồng phụ Codex tạm thời.
- **Không** thay đổi ngữ cảnh phiên trong tương lai.
- Không được ghi vào lịch sử transcript.

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi.

## Ghi chú bề mặt

<AccordionGroup>
  <Accordion title="Phạm vi phiên theo từng bề mặt">
    - **Lệnh văn bản:** chạy trong phiên chat bình thường (DM dùng chung `main`, nhóm có phiên riêng).
    - **Lệnh gốc Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Lệnh gốc Slack:** `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
    - **Lệnh gốc Telegram:** `telegram:slash:<userId>` (nhắm tới phiên chat qua `CommandTargetSessionKey`)
    - **`/login codex`** chỉ gửi mã ghép đôi thiết bị qua chat riêng hoặc đường dẫn phản hồi Web UI. Lời gọi trong nhóm/chủ đề Telegram yêu cầu chủ sở hữu DM bot thay thế.
    - **`/stop`** nhắm tới phiên chat đang hoạt động để hủy lần chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết riêng của Slack">
    `channels.slack.slashCommand` hỗ trợ một lệnh kiểu `/openclaw` duy nhất.
    Với `commands.native: true`, tạo một lệnh slash Slack cho mỗi lệnh tích hợp sẵn.
    Đăng ký `/agentstatus` (không phải `/status`) vì Slack giữ riêng
    `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.
  </Accordion>
  <Accordion title="Đường nhanh và lối tắt nội dòng">
    - Tin nhắn chỉ gồm lệnh từ người gửi trong allowlist được xử lý ngay (bỏ qua hàng đợi + mô hình).
    - Lối tắt nội dòng (`/help`, `/commands`, `/status`, `/whoami`) cũng hoạt động khi nhúng trong tin nhắn bình thường và được loại bỏ trước khi mô hình nhìn thấy phần văn bản còn lại.
    - Tin nhắn chỉ gồm lệnh từ người không được phép bị bỏ qua âm thầm; các token nội dòng `/...` được xem là văn bản thuần.

  </Accordion>
  <Accordion title="Ghi chú đối số">
    - Lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (`/think: high`, `/send: on`).
    - `/new <model>` chấp nhận bí danh mô hình, `provider/model`, hoặc tên nhà cung cấp (khớp mờ); nếu không khớp, văn bản được xem là nội dung tin nhắn.
    - `/allowlist add|remove` yêu cầu `commands.config: true` và tôn trọng `configWrites` của kênh.

  </Accordion>
</AccordionGroup>

## Mức sử dụng và trạng thái nhà cung cấp

- **Mức sử dụng/hạn mức nhà cung cấp** (ví dụ: "Claude còn 80%") hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi theo dõi mức sử dụng được bật.
- **Dòng token/cache** trong `/status` có thể dùng mục mức sử dụng transcript mới nhất làm dự phòng khi ảnh chụp nhanh phiên trực tiếp còn thưa.
- **Thực thi so với runtime:** `/status` báo cáo `Execution` cho đường dẫn sandbox hiệu lực và `Runtime` cho bên đang chạy phiên: `OpenClaw Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP.
- **Token/chi phí theo từng phản hồi:** được kiểm soát bởi `/usage off|tokens|full`.
- `/model status` nói về mô hình/xác thực/endpoint, không phải mức sử dụng.

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Cách các lệnh slash kỹ năng được đăng ký và kiểm soát.
  </Card>
  <Card title="Tạo kỹ năng" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng một kỹ năng đăng ký lệnh slash riêng.
  </Card>
  <Card title="BTW" href="/vi/tools/btw" icon="comments">
    Câu hỏi phụ mà không thay đổi ngữ cảnh phiên.
  </Card>
  <Card title="Steer" href="/vi/tools/steer" icon="compass">
    Hướng dẫn agent giữa lúc chạy bằng `/steer`.
  </Card>
</CardGroup>
