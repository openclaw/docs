---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền hạn
    - Tìm hiểu cách các lệnh Skills được đăng ký
sidebarTitle: Slash commands
summary: Tất cả lệnh gạch chéo, chỉ thị và phím tắt nội dòng hiện có — cấu hình, định tuyến và hành vi trên từng bề mặt.
title: Lệnh dấu gạch chéo
x-i18n:
    generated_at: "2026-07-12T08:25:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway xử lý các lệnh được gửi dưới dạng tin nhắn độc lập bắt đầu bằng `/`.
Các lệnh bash chỉ dành cho máy chủ sử dụng `! <cmd>` (với `/bash <cmd>` là bí danh).

Khi một cuộc trò chuyện được liên kết với một phiên ACP, văn bản thông thường được chuyển đến
harness ACP. Các lệnh quản lý Gateway vẫn được xử lý cục bộ: `/acp ...` luôn được chuyển đến
trình xử lý lệnh của OpenClaw, còn `/status` và `/unfocus` vẫn được xử lý cục bộ bất cứ khi nào
việc xử lý lệnh được bật cho bề mặt đó.

## Ba loại lệnh

<CardGroup cols={3}>
  <Card title="Lệnh" icon="terminal">
    Các tin nhắn `/...` độc lập do Gateway xử lý. Phải được gửi dưới dạng
    nội dung duy nhất trong tin nhắn.
  </Card>
  <Card title="Chỉ thị" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — được loại khỏi tin nhắn trước khi mô hình
    nhìn thấy. Duy trì cài đặt phiên khi được gửi riêng; đóng vai trò là gợi ý nội dòng
    khi được gửi cùng văn bản khác.
  </Card>
  <Card title="Lối tắt nội dòng" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — chạy ngay lập tức và được
    loại khỏi trước khi mô hình nhìn thấy phần văn bản còn lại. Chỉ dành cho người gửi được ủy quyền.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Chi tiết hành vi của chỉ thị">
    - Các chỉ thị được loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong các tin nhắn **chỉ chứa chỉ thị** (tin nhắn chỉ gồm các chỉ thị), chúng
      được duy trì trong phiên và phản hồi bằng một thông báo xác nhận.
    - Trong các tin nhắn **trò chuyện thông thường** có văn bản khác, chúng đóng vai trò là gợi ý nội dòng và
      **không** duy trì cài đặt phiên.
    - Các chỉ thị chỉ áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom`
      được đặt, đó là danh sách cho phép duy nhất được sử dụng; nếu không, quyền được xác định từ
      danh sách cho phép/ghép nối của kênh cùng với `commands.useAccessGroups`. Các chỉ thị từ
      người gửi không được ủy quyền được coi là văn bản thuần túy.
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
  Bật phân tích cú pháp `/...` trong tin nhắn trò chuyện. Trên các bề mặt không có lệnh gốc
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), các lệnh văn bản
  vẫn hoạt động ngay cả khi được đặt thành `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Đăng ký các lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack;
  bị bỏ qua đối với các nhà cung cấp không hỗ trợ lệnh gốc. Ghi đè theo từng kênh bằng
  `channels.<provider>.commands.native`. Trên Discord, `false` bỏ qua việc đăng ký
  lệnh dấu gạch chéo; các lệnh đã đăng ký trước đó có thể vẫn hiển thị cho đến khi bị xóa.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký nguyên bản các lệnh Skills khi được hỗ trợ. Tự động: bật cho
  Discord/Telegram; tắt cho Slack. Ghi đè bằng
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy các lệnh shell trên máy chủ (bí danh `/bash <cmd>`). Yêu cầu
  danh sách cho phép `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Khoảng thời gian bash chờ trước khi chuyển sang chế độ nền (`0` chuyển sang nền
  ngay lập tức).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý trong `mcp.servers`). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái Plugin cùng với cài đặt + bật/tắt). Chỉ chủ sở hữu mới có quyền ghi.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè cấu hình chỉ trong thời gian chạy). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` và các thao tác công cụ khởi động lại Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Danh sách cho phép chủ sở hữu rõ ràng dành cho các bề mặt lệnh chỉ dành cho chủ sở hữu. Tách biệt với
  `commands.allowFrom` và quyền truy cập ghép nối tin nhắn trực tiếp.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: yêu cầu danh tính chủ sở hữu đối với các lệnh chỉ dành cho chủ sở hữu. Khi là `true`,
  người gửi phải khớp với `commands.ownerAllowFrom` hoặc có phạm vi nội bộ `operator.admin`.
  Mục nhập ký tự đại diện trong `allowFrom` là **không** đủ.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách mã định danh của chủ sở hữu xuất hiện trong lời nhắc hệ thống.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Bí mật HMAC được sử dụng khi `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng nhà cung cấp để phân quyền lệnh. Khi được cấu hình, đây là
  nguồn phân quyền **duy nhất** cho các lệnh và chỉ thị. Sử dụng `"*"` làm
  giá trị mặc định toàn cục; các khóa dành riêng cho từng nhà cung cấp sẽ ghi đè giá trị này.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi danh sách cho phép/chính sách cho các lệnh khi `commands.allowFrom` chưa được thiết lập.
</ParamField>

## Danh sách lệnh

Các lệnh đến từ ba nguồn:

- **Lệnh tích hợp sẵn cốt lõi:** `src/auto-reply/commands-registry.shared.ts`
- **Lệnh dock được tạo:** `src/auto-reply/commands-registry.data.ts`
- **Lệnh Plugin:** các lệnh gọi `registerCommand()` của Plugin

Khả năng sử dụng phụ thuộc vào các cờ cấu hình, bề mặt kênh và các Plugin
đã được cài đặt/bật.

### Lệnh cốt lõi

  <AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/new [model]` | Lưu trữ phiên hiện tại và bắt đầu một phiên mới |
    | `/reset [soft [message]]` | Đặt lại phiên hiện tại tại chỗ. `soft` giữ lại bản ghi hội thoại, loại bỏ các mã định danh phiên backend CLI được tái sử dụng và chạy lại quy trình khởi động |
    | `/name <title>` | Đặt tên hoặc đổi tên phiên hiện tại. Bỏ qua tiêu đề để xem tên hiện tại và một đề xuất |
    | `/compact [instructions]` | Thu gọn ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction) |
    | `/stop` | Hủy lượt chạy hiện tại |
    | `/session idle <duration\|off>` | Quản lý thời hạn hết hiệu lực do không hoạt động của liên kết luồng |
    | `/session max-age <duration\|off>` | Quản lý thời hạn tuổi tối đa của liên kết luồng |
    | `/export-session [path]` | Xuất phiên hiện tại sang HTML. Bí danh: `/export` |
    | `/export-trajectory [path]` | Xuất gói quỹ đạo JSONL cho phiên hiện tại. Bí danh: `/trajectory` |

    <Note>
      Control UI chặn lệnh `/new` được nhập để tạo và chuyển sang một phiên
      bảng điều khiển mới, ngoại trừ khi cấu hình `session.dmScope: "main"`
      và phiên cha hiện tại là phiên chính của tác tử — trong trường hợp đó, `/new`
      đặt lại phiên chính tại chỗ. Lệnh `/reset` được nhập vẫn thực hiện thao tác
      đặt lại tại chỗ của Gateway. Sử dụng `/model default` khi bạn muốn xóa lựa chọn
      mô hình đã ghim cho phiên.
    </Note>

  </Accordion>

  <Accordion title="Điều khiển mô hình và lượt chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/think <level\|default>` | Đặt mức độ suy nghĩ hoặc xóa giá trị ghi đè của phiên. Bí danh: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Bật hoặc tắt đầu ra chi tiết. Bí danh: `/v` |
    | `/trace on\|off` | Bật hoặc tắt đầu ra truy vết Plugin cho phiên hiện tại |
    | `/fast [status\|auto\|on\|off\|default]` | Hiển thị, đặt hoặc xóa chế độ nhanh |
    | `/reasoning [on\|off\|stream]` | Bật hoặc tắt khả năng hiển thị quá trình lập luận. Bí danh: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Bật hoặc tắt chế độ nâng cao. Bí danh: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Hiển thị hoặc đặt các giá trị mặc định cho exec |
    | `/login [codex\|openai\|openai-codex]` | Ghép nối đăng nhập Codex/OpenAI từ cuộc trò chuyện riêng tư hoặc phiên giao diện web. Chỉ dành cho chủ sở hữu/quản trị viên |
    | `/model [name\|#\|status]` | Hiển thị hoặc đặt mô hình |
    | `/models [provider] [page] [limit=<n>\|all]` | Liệt kê các nhà cung cấp hoặc mô hình đã cấu hình/có thông tin xác thực khả dụng |
    | `/queue <mode>` | Quản lý hành vi hàng đợi của lượt chạy đang hoạt động. Xem [Hàng đợi](/vi/concepts/queue) và [Điều hướng hàng đợi](/vi/concepts/queue-steering) |
    | `/steer <message>` | Chèn chỉ dẫn vào lượt chạy đang hoạt động. Bí danh: `/tell`. Xem [Điều hướng](/vi/tools/steer) |

    <AccordionGroup>
      <Accordion title="An toàn khi dùng verbose / trace / fast / reasoning">
        - `/verbose` dùng để gỡ lỗi — hãy giữ ở trạng thái **tắt** khi sử dụng thông thường.
        - `/trace` chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu; nội dung chi tiết thông thường vẫn bị tắt.
        - `/fast auto|on|off` duy trì một giá trị ghi đè cho phiên; sử dụng tùy chọn `inherit` trong giao diện Phiên để xóa giá trị đó.
        - `/fast` phụ thuộc vào nhà cung cấp: OpenAI/Codex ánh xạ chế độ này thành `service_tier=priority`; các yêu cầu Anthropic trực tiếp ánh xạ thành `service_tier=auto` hoặc `standard_only`.
        - `/reasoning`, `/verbose` và `/trace` tiềm ẩn rủi ro trong môi trường nhóm — chúng có thể tiết lộ quá trình lập luận nội bộ hoặc thông tin chẩn đoán của Plugin. Hãy giữ chúng ở trạng thái tắt trong các cuộc trò chuyện nhóm.

      </Accordion>
      <Accordion title="Chi tiết chuyển đổi mô hình">
        - `/model` lưu ngay mô hình mới vào phiên.
        - Nếu tác nhân đang rảnh, lượt chạy tiếp theo sẽ sử dụng mô hình đó ngay lập tức.
        - Nếu đang có một lượt chạy hoạt động, việc chuyển đổi sẽ được đánh dấu là đang chờ và áp dụng tại điểm thử lại an toàn tiếp theo.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Khám phá và trạng thái">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/help` | Hiển thị bản tóm tắt trợ giúp ngắn |
    | `/commands` | Hiển thị danh mục lệnh đã tạo |
    | `/tools [compact\|verbose]` | Hiển thị những gì tác nhân hiện tại có thể sử dụng ngay lúc này |
    | `/status` | Hiển thị trạng thái thực thi/môi trường chạy, thời gian hoạt động của Gateway và hệ thống, tình trạng Plugin, cùng mức sử dụng/hạn ngạch của nhà cung cấp |
    | `/status plugins` | Hiển thị chi tiết tình trạng Plugin: lỗi tải, trạng thái cách ly, lỗi Plugin kênh, sự cố phụ thuộc và thông báo tương thích. Yêu cầu `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Quản lý [mục tiêu](/vi/tools/goal) lâu dài của phiên hiện tại |
    | `/diagnostics [note]` | Quy trình báo cáo hỗ trợ chỉ dành cho chủ sở hữu. Luôn yêu cầu phê duyệt thực thi |
    | `/crestodian <request>` | Chạy trình hỗ trợ thiết lập và sửa chữa Crestodian từ tin nhắn trực tiếp của chủ sở hữu |
    | `/tasks` | Liệt kê các tác vụ nền đang hoạt động/gần đây của phiên hiện tại |
    | `/context [list\|detail\|map\|json]` | Giải thích cách ngữ cảnh được tổng hợp |
    | `/whoami` | Hiển thị mã định danh người gửi của bạn. Bí danh: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kiểm soát phần chân trang về mức sử dụng cho mỗi phản hồi (`reset`/`inherit`/`clear`/`default` xóa giá trị ghi đè của phiên để kế thừa lại giá trị mặc định đã cấu hình) hoặc hiển thị bản tóm tắt chi phí cục bộ |
  </Accordion>

  <Accordion title="Skills, danh sách cho phép và phê duyệt">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/skill <name> [input]` | Chạy một Skills theo tên |
    | `/learn [request]` | Soạn thảo một Skills có thể xem xét từ cuộc trò chuyện hiện tại hoặc các nguồn được chỉ định thông qua [Xưởng Skills](/vi/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Quản lý các mục trong danh sách cho phép. Chỉ văn bản |
    | `/approve <id> <decision>` | Xử lý các yêu cầu phê duyệt thực thi hoặc Plugin |
    | `/btw <question>` | Đặt câu hỏi phụ mà không thay đổi ngữ cảnh phiên. Bí danh: `/side`. Xem [BTW](/vi/tools/btw) |
  </Accordion>

  <Accordion title="Tác nhân phụ và ACP">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/subagents list\|log\|info` | Kiểm tra các lượt chạy tác nhân phụ của phiên hiện tại |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Quản lý các phiên ACP và tùy chọn thời gian chạy. Các thao tác điều khiển thời gian chạy yêu cầu danh tính chủ sở hữu bên ngoài hoặc quản trị viên Gateway nội bộ |
    | `/focus <target>` | Liên kết luồng Discord hoặc chủ đề Telegram hiện tại với một đích phiên |
    | `/unfocus` | Xóa liên kết của luồng hiện tại |
    | `/agents` | Liệt kê các tác nhân được liên kết với luồng cho phiên hiện tại |
  </Accordion>

  <Accordion title="Thao tác ghi và quản trị chỉ dành cho chủ sở hữu">
    | Lệnh | Yêu cầu | Mô tả |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý. Chỉ dành cho chủ sở hữu |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Kiểm tra hoặc thay đổi trạng thái plugin. Thao tác ghi chỉ dành cho chủ sở hữu. Bí danh: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Ghi đè cấu hình chỉ trong thời gian chạy. Chỉ dành cho chủ sở hữu |
    | `/restart` | `commands.restart: true` (mặc định) | Khởi động lại OpenClaw |
    | `/send on\|off\|inherit` | chủ sở hữu | Đặt chính sách gửi |
  </Accordion>

  <Accordion title="Giọng nói, TTS và điều khiển kênh">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Điều khiển TTS. Xem [TTS](/vi/tools/tts) |
    | `/activation mention\|always` | Đặt chế độ kích hoạt nhóm |
    | `/bash <command>` | Chạy lệnh shell trên máy chủ. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` |
    | `!poll [sessionId]` | Kiểm tra tác vụ bash chạy nền |
    | `!stop [sessionId]` | Dừng tác vụ bash chạy nền |
  </Accordion>
</AccordionGroup>

### Lệnh neo kênh

Các lệnh neo kênh chuyển tuyến phản hồi của phiên đang hoạt động sang một kênh được liên kết khác.
Xem [Neo kênh](/vi/concepts/channel-docking) để biết cách thiết lập và khắc phục sự cố.

Được tạo từ các plugin kênh có hỗ trợ lệnh gốc:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Các lệnh neo kênh yêu cầu `session.identityLinks`. Người gửi nguồn và đối tượng đích
phải thuộc cùng một nhóm danh tính.

### Lệnh plugin đi kèm

| Lệnh                                                    | Mô tả                                                                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Bật hoặc tắt Dreaming cho bộ nhớ (chủ sở hữu hoặc quản trị viên Gateway). Xem [Dreaming](/vi/concepts/dreaming)                                                                                                      |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Quản lý ghép nối thiết bị. Xem [Ghép nối](/vi/channels/pairing)                                                                                                                                                      |
| `/phone status\|arm ...\|disarm`                        | Tạm thời cho phép các lệnh Node có rủi ro cao (camera/màn hình/máy tính/thao tác ghi). Xem [Sử dụng máy tính](/vi/nodes/computer-use)                                                                                 |
| `/voice status\|list\|set <voiceId>`                    | Quản lý cấu hình giọng nói Talk. Tên gốc trên Discord: `/talkvoice`                                                                                                                                               |
| `/card ...`                                             | Gửi các mẫu thẻ đa phương tiện LINE. Xem [LINE](/vi/channels/line)                                                                                                                                                   |
| `/codex <action> ...`                                   | Liên kết, điều hướng và kiểm tra bộ khung app-server Codex (trạng thái, luồng, tiếp tục, mô hình, chế độ nhanh, quyền, thu gọn, đánh giá, mcp, skills và nhiều nội dung khác). Xem [Bộ khung Codex](/vi/plugins/codex-harness) |

Chỉ dành cho QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Lệnh Skills

Các Skills mà người dùng có thể gọi được cung cấp dưới dạng lệnh gạch chéo:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- Skills có thể đăng ký dưới dạng lệnh trực tiếp (ví dụ: `/prose` cho OpenProse).
- Việc đăng ký lệnh Skills gốc được kiểm soát bởi `commands.nativeSkills` và
  `channels.<provider>.commands.nativeSkills`.
- Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); các tên trùng nhau sẽ nhận hậu tố số.

<AccordionGroup>
  <Accordion title="Điều phối lệnh Skills">
    Theo mặc định, các lệnh Skills được chuyển đến mô hình như một yêu cầu thông thường.

    Skills có thể khai báo `command-dispatch: tool` để chuyển trực tiếp đến một công cụ
    (có tính xác định, không có sự tham gia của mô hình). Ví dụ: `/prose` (plugin OpenProse)
    — xem [OpenProse](/vi/prose).

  </Accordion>
  <Accordion title="Đối số của lệnh gốc">
    Discord sử dụng tính năng tự động hoàn thành cho các tùy chọn động và trình đơn nút khi
    thiếu đối số bắt buộc. Telegram và Slack hiển thị trình đơn nút cho các lệnh có
    lựa chọn. Các lựa chọn động được phân giải theo mô hình của phiên đích, vì vậy những tùy chọn
    dành riêng cho mô hình như các mức `/think` sẽ tuân theo giá trị ghi đè `/model` của phiên.
  </Accordion>
</AccordionGroup>

## `/tools`: tác nhân có thể sử dụng những gì ngay lúc này

`/tools` trả lời một câu hỏi về thời gian chạy: **tác nhân này có thể sử dụng những gì ngay lúc này trong
cuộc trò chuyện này** — không phải danh mục cấu hình tĩnh.

```text
/tools         # chế độ xem thu gọn
/tools verbose # kèm mô tả ngắn
```

Kết quả có phạm vi theo phiên. Việc thay đổi tác nhân, kênh, luồng, quyền
của người gửi hoặc mô hình có thể làm thay đổi đầu ra. Để chỉnh sửa hồ sơ và giá trị ghi đè,
hãy sử dụng bảng Công cụ trong giao diện điều khiển hoặc các bề mặt cấu hình.

## `/model`: chọn mô hình

```text
/model             # hiển thị bộ chọn mô hình
/model list        # tương tự
/model 3           # chọn theo số từ bộ chọn
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # xóa lựa chọn mô hình của phiên
/model status      # chế độ xem chi tiết với điểm cuối và chế độ API
```

Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với danh sách thả xuống
nhà cung cấp và mô hình. Bộ chọn tuân theo `agents.defaults.models`, bao gồm
các mục `provider/*`.

## `/config`: ghi cấu hình trên đĩa

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

Cấu hình được xác thực trước khi ghi. Các thay đổi không hợp lệ sẽ bị từ chối. Nội dung cập nhật bằng `/config`
được duy trì qua các lần khởi động lại.

## `/mcp`: cấu hình máy chủ MCP

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải trong phần cài đặt dự án của tác nhân nhúng.
`/mcp show` che các trường chứa thông tin xác thực, giá trị cờ thông tin xác thực
đã nhận diện và các đối số đã biết có hình thức giống bí mật. Khi chạy từ một nhóm,
cấu hình được gửi riêng cho chủ sở hữu; nếu không có tuyến riêng tư nào đến chủ sở hữu,
lệnh sẽ dừng an toàn và yêu cầu chủ sở hữu thử lại từ cuộc trò chuyện trực tiếp.

## `/debug`: ghi đè chỉ trong thời gian chạy

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.debug: true`.
  Các giá trị ghi đè được áp dụng ngay lập tức cho những lần đọc cấu hình mới nhưng **không** được ghi vào đĩa.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: quản lý plugin

<Note>
  Thao tác ghi chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` cập nhật cấu hình plugin và tải lại nóng thời gian chạy plugin của Gateway
cho các lượt tác nhân mới. `/plugins install` tự động khởi động lại các Gateway được quản lý
vì các mô-đun nguồn plugin đã thay đổi.

## `/trace`: đầu ra truy vết plugin

```text
/trace          # hiển thị trạng thái truy vết hiện tại
/trace on
/trace off
```

`/trace` hiển thị các dòng truy vết/gỡ lỗi plugin theo phạm vi phiên mà không cần bật toàn bộ chế độ
chi tiết. Lệnh này không thay thế `/debug` (ghi đè thời gian chạy) hoặc `/verbose` (đầu ra
công cụ thông thường).

## `/btw`: câu hỏi bên lề

`/btw` là một câu hỏi nhanh bên lề về ngữ cảnh của phiên hiện tại. Bí danh: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Không giống tin nhắn thông thường:

- Sử dụng phiên hiện tại làm ngữ cảnh nền.
- Trong các phiên bộ khung Codex, chạy dưới dạng một luồng Codex bên lề tạm thời.
- **Không** thay đổi ngữ cảnh phiên trong tương lai.
- Không được ghi vào lịch sử bản chép lời.

Xem [Câu hỏi bên lề BTW](/vi/tools/btw) để biết toàn bộ hành vi.

## Ghi chú về các bề mặt

<AccordionGroup>
  <Accordion title="Phạm vi phiên theo từng bề mặt">
    - **Lệnh văn bản:** chạy trong phiên trò chuyện thông thường (tin nhắn trực tiếp dùng chung `main`, các nhóm có phiên riêng).
    - **Lệnh Discord gốc:** `agent:<agentId>:discord:slash:<userId>`
    - **Lệnh Slack gốc:** `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
    - **Lệnh Telegram gốc:** `telegram:slash:<userId>` (nhắm đến phiên trò chuyện qua `CommandTargetSessionKey`)
    - **`/login codex`** chỉ gửi mã ghép nối thiết bị qua cuộc trò chuyện riêng tư hoặc các đường phản hồi của giao diện web. Khi được gọi trong nhóm/chủ đề Telegram, lệnh yêu cầu chủ sở hữu nhắn tin trực tiếp cho bot.
    - **`/stop`** nhắm đến phiên trò chuyện đang hoạt động để hủy lượt chạy hiện tại.

  </Accordion>
  <Accordion title="Đặc điểm riêng của Slack">
    `channels.slack.slashCommand` hỗ trợ một lệnh duy nhất theo kiểu `/openclaw`.
    Với `commands.native: true`, hãy tạo một lệnh gạch chéo Slack cho mỗi lệnh
    tích hợp sẵn. Đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng
    `/status`. Lệnh văn bản `/status` vẫn hoạt động trong tin nhắn Slack.
  </Accordion>
  <Accordion title="Đường dẫn nhanh và lối tắt nội tuyến">
    - Các tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + mô hình).
    - Các lối tắt nội tuyến (`/help`, `/commands`, `/status`, `/whoami`) cũng hoạt động khi được nhúng trong tin nhắn thông thường và bị loại bỏ trước khi mô hình thấy phần văn bản còn lại.
    - Các tin nhắn chỉ chứa lệnh không được phép sẽ bị bỏ qua âm thầm; các mã `/...` nội tuyến được coi là văn bản thuần túy.

  </Accordion>
  <Accordion title="Ghi chú về đối số">
    - Các lệnh chấp nhận dấu `:` tùy chọn giữa lệnh và đối số (`/think: high`, `/send: on`).
    - `/new <model>` chấp nhận bí danh mô hình, `provider/model` hoặc tên nhà cung cấp (khớp gần đúng); nếu không có kết quả khớp, văn bản được coi là nội dung tin nhắn.
    - `/allowlist add|remove` yêu cầu `commands.config: true` và tuân theo `configWrites` của kênh.

  </Accordion>
</AccordionGroup>

## Mức sử dụng và trạng thái nhà cung cấp

- **Mức sử dụng/hạn mức của nhà cung cấp** (ví dụ: "Claude còn 80%") được hiển thị trong `/status` cho nhà cung cấp mô hình hiện tại khi tính năng theo dõi mức sử dụng được bật.
- **Các dòng token/bộ nhớ đệm** trong `/status` có thể dùng mục mức sử dụng mới nhất trong bản ghi hội thoại làm phương án dự phòng khi ảnh chụp nhanh của phiên trực tiếp không đầy đủ.
- **Thực thi so với môi trường chạy:** `/status` báo cáo `Execution` cho đường dẫn sandbox có hiệu lực và `Runtime` cho thành phần đang chạy phiên: `OpenClaw Default`, `OpenAI Codex`, một backend CLI hoặc một backend ACP.
- **Token/chi phí cho mỗi phản hồi:** được kiểm soát bằng `/usage off|tokens|full`.
- `/model status` cung cấp thông tin về mô hình/xác thực/điểm cuối, không phải mức sử dụng.

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Cách các lệnh gạch chéo của Skills được đăng ký và kiểm soát quyền truy cập.
  </Card>
  <Card title="Tạo Skills" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng một Skill đăng ký lệnh gạch chéo riêng.
  </Card>
  <Card title="BTW" href="/vi/tools/btw" icon="comments">
    Đặt câu hỏi phụ mà không thay đổi ngữ cảnh phiên.
  </Card>
  <Card title="Điều hướng" href="/vi/tools/steer" icon="compass">
    Hướng dẫn tác nhân trong khi đang chạy bằng `/steer`.
  </Card>
</CardGroup>
