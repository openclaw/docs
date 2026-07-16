---
read_when:
    - Sử dụng hoặc cấu hình các lệnh trò chuyện
    - Gỡ lỗi định tuyến lệnh hoặc quyền truy cập
    - Tìm hiểu cách đăng ký các lệnh Skills
sidebarTitle: Slash commands
summary: Tất cả lệnh gạch chéo, chỉ thị và phím tắt nội tuyến hiện có — cấu hình, định tuyến và hành vi trên từng bề mặt.
title: Lệnh dấu gạch chéo
x-i18n:
    generated_at: "2026-07-16T15:20:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway xử lý các lệnh được gửi dưới dạng tin nhắn độc lập bắt đầu bằng `/`.
Các lệnh bash chỉ dành cho máy chủ sử dụng `! <cmd>` (với `/bash <cmd>` làm bí danh).

Khi một cuộc hội thoại được liên kết với một phiên ACP, văn bản thông thường được định tuyến đến bộ điều phối ACP. Các lệnh quản lý Gateway vẫn được xử lý cục bộ: `/acp ...` luôn đến trình xử lý lệnh OpenClaw, còn `/status` và `/unfocus` vẫn được xử lý cục bộ bất cứ khi nào việc xử lý lệnh được bật cho bề mặt đó.

## Ba loại lệnh

<CardGroup cols={3}>
  <Card title="Lệnh" icon="terminal">
    Các tin nhắn `/...` độc lập do Gateway xử lý. Phải được gửi dưới dạng nội dung duy nhất trong tin nhắn.
  </Card>
  <Card title="Chỉ thị" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — bị loại khỏi tin nhắn trước khi mô hình nhìn thấy. Duy trì cài đặt phiên khi được gửi riêng; đóng vai trò là gợi ý nội tuyến khi được gửi cùng văn bản khác.
  </Card>
  <Card title="Phím tắt nội tuyến" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — chạy ngay lập tức và bị loại bỏ trước khi mô hình nhìn thấy phần văn bản còn lại. Chỉ dành cho người gửi được ủy quyền.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Chi tiết về hành vi của chỉ thị">
    - Các chỉ thị bị loại khỏi tin nhắn trước khi mô hình nhìn thấy.
    - Trong các tin nhắn **chỉ chứa chỉ thị** (tin nhắn chỉ có các chỉ thị), chúng được duy trì trong phiên và phản hồi bằng một xác nhận.
    - Trong các tin nhắn **trò chuyện thông thường** có văn bản khác, chúng đóng vai trò là gợi ý nội tuyến và **không** duy trì cài đặt phiên.
    - Các chỉ thị chỉ áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được đặt, đây là danh sách cho phép duy nhất được sử dụng; nếu không, việc ủy quyền đến từ danh sách cho phép/ghép đôi của kênh cùng với `commands.useAccessGroups`. Với người gửi không được ủy quyền, các chỉ thị được coi là văn bản thuần túy.

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
  Đăng ký các lệnh gốc. Tự động: bật cho Discord/Telegram; tắt cho Slack; bị bỏ qua đối với các nhà cung cấp không hỗ trợ lệnh gốc. Ghi đè theo từng kênh bằng `channels.<provider>.commands.native`. Trên Discord, `false` bỏ qua việc đăng ký lệnh gạch chéo; các lệnh đã đăng ký trước đó có thể vẫn hiển thị cho đến khi bị xóa.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Đăng ký các lệnh kỹ năng dưới dạng lệnh gốc khi được hỗ trợ. Tự động: bật cho Discord/Telegram; tắt cho Slack. Ghi đè bằng `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Bật `! <cmd>` để chạy các lệnh shell trên máy chủ (bí danh `/bash <cmd>`). Yêu cầu danh sách cho phép `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Khoảng thời gian bash chờ trước khi chuyển sang chế độ nền (`0` chuyển sang nền ngay lập tức).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Bật `/config` (đọc/ghi `openclaw.json`). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Bật `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý trong `mcp.servers`). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Bật `/plugins` (khám phá/trạng thái plugin cùng với cài đặt + bật/tắt). Các thao tác ghi chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Bật `/debug` (ghi đè cấu hình chỉ trong thời gian chạy). Chỉ dành cho chủ sở hữu.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Bật `/restart` và các yêu cầu khởi động lại `SIGUSR1` từ bên ngoài.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Danh sách cho phép chủ sở hữu tường minh dành cho các bề mặt lệnh chỉ dành cho chủ sở hữu. Tách biệt với `commands.allowFrom` và quyền truy cập ghép đôi DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Theo từng kênh: yêu cầu danh tính chủ sở hữu đối với các lệnh chỉ dành cho chủ sở hữu. Khi `true`, người gửi phải khớp với `commands.ownerAllowFrom` hoặc có phạm vi nội bộ `operator.admin`. Mục ký tự đại diện `allowFrom` là **không** đủ.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Kiểm soát cách mã định danh chủ sở hữu xuất hiện trong lời nhắc hệ thống.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Bí mật HMAC được sử dụng khi `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Danh sách cho phép theo từng nhà cung cấp để ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền **duy nhất** cho lệnh và chỉ thị. Sử dụng `"*"` làm mặc định toàn cục; các khóa dành riêng cho nhà cung cấp sẽ ghi đè lên khóa này.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Thực thi danh sách cho phép/chính sách đối với lệnh khi `commands.allowFrom` chưa được đặt.
</ParamField>

## Danh sách lệnh

Các lệnh đến từ ba nguồn:

- **Lệnh tích hợp sẵn của lõi:** `src/auto-reply/commands-registry.shared.ts`
- **Lệnh dock được tạo:** `src/auto-reply/commands-registry.data.ts`
- **Lệnh plugin:** các lệnh gọi `registerCommand()` của plugin

Khả dụng tùy thuộc vào các cờ cấu hình, bề mặt kênh và các plugin đã cài đặt/bật.

### Lệnh lõi

<AccordionGroup>
  <Accordion title="Phiên và lượt chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/new [model]` | Lưu trữ phiên hiện tại và bắt đầu một phiên mới |
    | `/reset [soft [message]]` | Đặt lại phiên hiện tại tại chỗ. `soft` giữ lại bản ghi, loại bỏ các mã định danh phiên backend CLI được tái sử dụng và chạy lại quá trình khởi động |
    | `/name <title>` | Đặt tên hoặc đổi tên phiên hiện tại. Bỏ qua tiêu đề để xem tên hiện tại và một đề xuất |
    | `/compact [instructions]` | Compaction ngữ cảnh phiên. Xem [Compaction](/vi/concepts/compaction) |
    | `/stop` | Hủy lượt chạy hiện tại |
    | `/session idle <duration\|off>` | Quản lý thời điểm hết hạn do không hoạt động của liên kết luồng |
    | `/session max-age <duration\|off>` | Quản lý thời điểm hết hạn theo tuổi tối đa của liên kết luồng |
    | `/export-session [path]` | Chỉ dành cho chủ sở hữu. Xuất phiên hiện tại thành HTML trong không gian làm việc. Bí danh: `/export` |
    | `/export-trajectory [path]` | Xuất một gói quỹ đạo JSONL cho phiên hiện tại. Bí danh: `/trajectory` |

    Các đường dẫn `/export-session` tường minh sẽ thay thế các tệp hiện có trong không gian làm việc. Bỏ qua đường dẫn để tạo tên tệp tránh xung đột.

    <Note>
      Control UI chặn `/new` được nhập để tạo và chuyển sang một phiên bảng điều khiển mới, ngoại trừ khi `session.dmScope: "main"` được cấu hình và phiên cha hiện tại là phiên chính của tác tử — trong trường hợp đó, `/new` đặt lại phiên chính tại chỗ. `/reset` được nhập vẫn chạy thao tác đặt lại tại chỗ của Gateway. Sử dụng `/model default` khi muốn xóa lựa chọn mô hình được ghim của phiên.
    </Note>

  </Accordion>

  <Accordion title="Điều khiển mô hình và lượt chạy">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/think <level\|default>` | Đặt mức suy nghĩ hoặc xóa ghi đè của phiên. Bí danh: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Bật/tắt đầu ra chi tiết. Bí danh: `/v` |
    | `/trace on\|off` | Bật/tắt đầu ra theo dõi plugin cho phiên hiện tại |
    | `/fast [status\|auto\|on\|off\|default]` | Hiển thị, đặt hoặc xóa chế độ nhanh |
    | `/reasoning [on\|off\|stream]` | Bật/tắt khả năng hiển thị suy luận. Bí danh: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Bật/tắt chế độ nâng cao. Bí danh: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Hiển thị hoặc đặt giá trị mặc định của exec |
    | `/login [codex\|openai\|openai-codex]` | Ghép đôi thông tin đăng nhập Codex/OpenAI từ cuộc trò chuyện riêng tư hoặc phiên Web UI. Chỉ dành cho chủ sở hữu/quản trị viên |
    | `/model [name\|#\|status]` | Hiển thị hoặc đặt mô hình |
    | `/models [provider] [page] [limit=<n>\|all]` | Liệt kê các nhà cung cấp hoặc mô hình đã cấu hình/có sẵn thông tin xác thực |
    | `/queue <mode>` | Quản lý hành vi hàng đợi của lượt chạy đang hoạt động. Xem [Hàng đợi](/vi/concepts/queue) và [Điều hướng hàng đợi](/vi/concepts/queue-steering) |
    | `/steer <message>` | Chèn hướng dẫn vào lượt chạy đang hoạt động. Bí danh: `/tell`. Xem [Điều hướng](/vi/tools/steer) |

    <AccordionGroup>
      <Accordion title="An toàn khi dùng chế độ chi tiết / theo dõi / nhanh / suy luận">
        - `/verbose` dành cho việc gỡ lỗi — hãy giữ ở trạng thái **tắt** trong quá trình sử dụng thông thường.
        - `/trace` chỉ hiển thị các dòng theo dõi/gỡ lỗi do plugin sở hữu; nội dung chi tiết thông thường vẫn tắt.
        - `/fast auto|on|off` duy trì một ghi đè cho phiên; sử dụng tùy chọn `inherit` trong giao diện Phiên để xóa ghi đè này.
        - `/fast` phụ thuộc vào nhà cung cấp: OpenAI/Codex ánh xạ nó thành `service_tier=priority`; các yêu cầu Anthropic trực tiếp ánh xạ nó thành `service_tier=auto` hoặc `standard_only`.
        - `/reasoning`, `/verbose` và `/trace` có rủi ro trong bối cảnh nhóm — chúng có thể tiết lộ suy luận nội bộ hoặc thông tin chẩn đoán plugin. Hãy giữ chúng ở trạng thái tắt trong các cuộc trò chuyện nhóm.

      </Accordion>
      <Accordion title="Chi tiết về chuyển đổi mô hình">
        - `/model` duy trì mô hình mới trong phiên ngay lập tức.
        - Nếu tác tử đang rảnh, lượt chạy tiếp theo sẽ sử dụng mô hình đó ngay.
        - Nếu một lượt chạy đang hoạt động, việc chuyển đổi được đánh dấu là đang chờ và được áp dụng tại điểm thử lại sạch tiếp theo.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Khám phá và trạng thái">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/help` | Hiển thị bản tóm tắt trợ giúp ngắn |
    | `/commands` | Hiển thị danh mục lệnh được tạo |
    | `/tools [compact\|verbose]` | Hiển thị những gì tác tử hiện tại có thể sử dụng ngay lúc này |
    | `/status` | Hiển thị trạng thái thực thi/thời gian chạy, thời gian hoạt động của Gateway và hệ thống, tình trạng plugin, cùng với mức sử dụng/hạn ngạch của nhà cung cấp |
    | `/status plugins` | Hiển thị chi tiết tình trạng plugin: lỗi tải, cách ly, lỗi plugin kênh, vấn đề phụ thuộc, thông báo tương thích. Yêu cầu `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Quản lý [mục tiêu](/vi/tools/goal) lâu dài của phiên hiện tại |
    | `/diagnostics [note]` | Luồng báo cáo hỗ trợ chỉ dành cho chủ sở hữu. Luôn yêu cầu phê duyệt thực thi |
    | `/openclaw <request>` | Chạy trình trợ giúp thiết lập và sửa chữa OpenClaw từ DM của chủ sở hữu |
    | `/tasks` | Liệt kê các tác vụ nền đang hoạt động/gần đây của phiên hiện tại |
    | `/context [list\|detail\|map\|json]` | Giải thích cách ngữ cảnh được tập hợp |
    | `/whoami` | Hiển thị mã định danh người gửi của bạn. Bí danh: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kiểm soát phần chân trang mức sử dụng theo từng phản hồi (`reset`/`inherit`/`clear`/`default` xóa ghi đè của phiên để kế thừa lại giá trị mặc định đã cấu hình) hoặc in bản tóm tắt chi phí cục bộ |
  </Accordion>

  <Accordion title="Skills, danh sách cho phép, phê duyệt">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/skill <name> [input]` | Chạy một skill theo tên |
    | `/learn [request]` | Soạn thảo một skill có thể xem xét từ cuộc trò chuyện hiện tại hoặc các nguồn được chỉ định thông qua [Xưởng Skill](/vi/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Quản lý các mục trong danh sách cho phép. Chỉ văn bản |
    | `/approve <id> <decision>` | Xử lý lời nhắc phê duyệt exec hoặc plugin |
    | `/btw <question>` | Đặt câu hỏi phụ mà không thay đổi ngữ cảnh phiên. Bí danh: `/side`. Xem [BTW](/vi/tools/btw) |
  </Accordion>

  <Accordion title="Tác tử phụ và ACP">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/subagents list\|log\|info` | Kiểm tra các lượt chạy của tác tử phụ trong phiên hiện tại |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Quản lý các phiên ACP và tùy chọn runtime. Các điều khiển runtime yêu cầu danh tính chủ sở hữu bên ngoài hoặc quản trị viên Gateway nội bộ |
    | `/focus <target>` | Liên kết luồng Discord hoặc chủ đề Telegram hiện tại với một đích phiên |
    | `/unfocus` | Xóa liên kết luồng hiện tại |
    | `/agents` | Liệt kê các tác tử được liên kết với luồng trong phiên hiện tại |
  </Accordion>

  <Accordion title="Thao tác ghi và quản trị chỉ dành cho chủ sở hữu">
    | Lệnh | Yêu cầu | Mô tả |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Đọc hoặc ghi `openclaw.json`. Chỉ dành cho chủ sở hữu |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Đọc hoặc ghi cấu hình máy chủ MCP do OpenClaw quản lý. Chỉ dành cho chủ sở hữu |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Kiểm tra hoặc thay đổi trạng thái plugin. Thao tác ghi chỉ dành cho chủ sở hữu. Bí danh: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Ghi đè cấu hình chỉ dành cho runtime. Chỉ dành cho chủ sở hữu |
    | `/restart` | `commands.restart: true` (mặc định) | Khởi động lại OpenClaw |
    | `/send on\|off\|inherit` | chủ sở hữu | Đặt chính sách gửi |
  </Accordion>

  <Accordion title="Giọng nói, TTS, điều khiển kênh">
    | Lệnh | Mô tả |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Điều khiển TTS. Xem [TTS](/vi/tools/tts) |
    | `/activation mention\|always` | Đặt chế độ kích hoạt nhóm |
    | `/bash <command>` | Chạy lệnh shell trên máy chủ. Bí danh: `! <command>`. Yêu cầu `commands.bash: true` |
    | `!poll [sessionId]` | Kiểm tra một tác vụ bash chạy nền |
    | `!stop [sessionId]` | Dừng một tác vụ bash chạy nền |
  </Accordion>
</AccordionGroup>

### Lệnh neo kênh

Các lệnh neo kênh chuyển tuyến trả lời của phiên đang hoạt động sang một kênh được liên kết khác.
Xem [Neo kênh](/vi/concepts/channel-docking) để biết cách thiết lập và khắc phục sự cố.

Được tạo từ các plugin kênh hỗ trợ lệnh gốc:

- `/dock-discord` (bí danh: `/dock_discord`)
- `/dock-mattermost` (bí danh: `/dock_mattermost`)
- `/dock-slack` (bí danh: `/dock_slack`)
- `/dock-telegram` (bí danh: `/dock_telegram`)

Các lệnh neo kênh yêu cầu `session.identityLinks`. Người gửi nguồn và đối tượng đích
phải thuộc cùng một nhóm danh tính.

### Lệnh plugin đi kèm

| Lệnh                                                    | Mô tả                                                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                      | Bật/tắt Dreaming cho bộ nhớ (chủ sở hữu hoặc quản trị viên Gateway). Xem [Dreaming](/vi/concepts/dreaming)                                                                                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Quản lý ghép nối thiết bị. Xem [Ghép nối](/vi/channels/pairing)                                                                                                                                   |
| `/phone status\|arm ...\|disarm`                                      | Tạm thời cho phép các lệnh node có rủi ro cao (camera/màn hình/máy tính/thao tác ghi). Xem [Sử dụng máy tính](/vi/nodes/computer-use)                                                             |
| `/voice status\|list\|set <voiceId>`                                      | Quản lý cấu hình giọng nói Talk. Tên gốc trên Discord: `/talkvoice`                                                                                                                     |
| `/card ...`                                      | Gửi các mẫu thẻ đa phương tiện LINE. Xem [LINE](/vi/channels/line)                                                                                                                               |
| `/codex <action> ...`                                      | Liên kết, điều hướng và kiểm tra bộ khung máy chủ ứng dụng Codex (trạng thái, luồng, tiếp tục, mô hình, nhanh, quyền, thu gọn, xem xét, mcp, skills và hơn thế nữa). Xem [Bộ khung Codex](/vi/plugins/codex-harness) |

Chỉ dành cho QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Lệnh skill

Các skill mà người dùng có thể gọi được cung cấp dưới dạng lệnh gạch chéo:

- `/skill <name> [input]` luôn hoạt động như điểm vào chung.
- Skills có thể đăng ký dưới dạng lệnh trực tiếp (ví dụ: `/prose` cho OpenProse).
- Việc đăng ký lệnh skill gốc được kiểm soát bởi `commands.nativeSkills` và
  `channels.<provider>.commands.nativeSkills`.
- Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); tên trùng nhau được thêm hậu tố số.

<AccordionGroup>
  <Accordion title="Điều phối lệnh skill">
    Theo mặc định, các lệnh skill được chuyển đến mô hình như một yêu cầu thông thường.

    Skills có thể khai báo `command-dispatch: tool` để chuyển trực tiếp đến một công cụ
    (có tính xác định, không có sự tham gia của mô hình). Ví dụ: `/prose` (plugin OpenProse)
    — xem [OpenProse](/vi/prose).

  </Accordion>
  <Accordion title="Đối số lệnh gốc">
    Discord sử dụng tính năng tự động hoàn thành cho các tùy chọn động và menu nút khi các đối số
    bắt buộc bị bỏ qua. Telegram và Slack hiển thị menu nút cho các lệnh có
    lựa chọn. Các lựa chọn động được phân giải theo mô hình của phiên đích, vì vậy các tùy chọn
    dành riêng cho mô hình như cấp độ `/think` sẽ tuân theo giá trị ghi đè `/model` của phiên.
  </Accordion>
</AccordionGroup>

## `/tools`: tác tử có thể sử dụng những gì ngay lúc này

`/tools` trả lời một câu hỏi về runtime: **tác tử này có thể sử dụng những gì ngay lúc này trong
cuộc trò chuyện này** — không phải danh mục cấu hình tĩnh.

```text
/tools         # chế độ xem thu gọn
/tools verbose # kèm mô tả ngắn
```

Kết quả có phạm vi theo phiên. Việc thay đổi tác tử, kênh, luồng, quyền
của người gửi hoặc mô hình có thể làm thay đổi đầu ra. Để chỉnh sửa hồ sơ và giá trị ghi đè,
hãy sử dụng bảng Công cụ trong Control UI hoặc các bề mặt cấu hình.

## `/model`: lựa chọn mô hình

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
cho nhà cung cấp và mô hình. Bộ chọn tuân theo `agents.defaults.models`, bao gồm
các mục `provider/*`.

## `/config`: ghi cấu hình trên ổ đĩa

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

Cấu hình được xác thực trước khi ghi. Các thay đổi không hợp lệ sẽ bị từ chối. Các cập nhật `/config`
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

`/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải trong cài đặt dự án của tác tử nhúng.
`/mcp show` che các trường chứa thông tin xác thực, giá trị cờ thông tin xác thực
được nhận diện và các đối số có hình dạng bí mật đã biết. Khi chạy từ một nhóm,
cấu hình được gửi riêng cho chủ sở hữu; nếu không có tuyến riêng tư đến chủ sở hữu,
lệnh sẽ đóng an toàn và yêu cầu chủ sở hữu thử lại từ cuộc trò chuyện
trực tiếp.

## `/debug`: giá trị ghi đè chỉ dành cho runtime

<Note>
  Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định — bật bằng `commands.debug: true`.
  Các giá trị ghi đè được áp dụng ngay cho những lần đọc cấu hình mới nhưng **không** ghi vào ổ đĩa.
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
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` cập nhật cấu hình plugin và tải lại nóng runtime
plugin của Gateway cho các lượt tác tử mới. `/plugins install` tự động khởi động lại các
Gateway được quản lý vì các mô-đun nguồn plugin đã thay đổi. Các bản cài đặt từ ClawHub đáng tin cậy
và danh mục chính thức không cần xác nhận bổ sung. Các nguồn npm, git,
kho lưu trữ, `npm-pack:` và đường dẫn cục bộ tùy ý sẽ hiển thị cảnh báo nguồn gốc và
yêu cầu `--force` ở cuối sau khi bạn xem xét nguồn. Cờ này xác nhận
nguồn và cho phép thay thế một bản cài đặt hiện có; nó không bỏ qua
`security.installPolicy` hoặc các kiểm tra bảo mật của trình cài đặt. Các bản phát hành ClawHub có
cảnh báo rủi ro vẫn yêu cầu cờ riêng biệt chỉ dành cho shell
`--acknowledge-clawhub-risk`. Các bản cài đặt từ marketplace, được liên kết và được ghim cũng
vẫn chỉ khả dụng qua shell.

## `/trace`: đầu ra truy vết plugin

```text
/trace          # hiển thị trạng thái truy vết hiện tại
/trace on
/trace off
```

`/trace` hiển thị các dòng truy vết/gỡ lỗi plugin có phạm vi theo phiên mà không cần chế độ
đầy đủ chi tiết. Nó không thay thế `/debug` (ghi đè runtime) hoặc `/verbose` (đầu ra
công cụ thông thường).

## `/btw`: câu hỏi phụ

`/btw` là một câu hỏi phụ nhanh về ngữ cảnh phiên hiện tại. Bí danh: `/side`.

```text
/btw hiện tại chúng ta đang làm gì?
/side có gì thay đổi trong khi lượt chạy chính tiếp tục?
```

Không giống một tin nhắn thông thường:

- Sử dụng phiên hiện tại làm ngữ cảnh nền.
- Trong các phiên bộ khung Codex, chạy dưới dạng một luồng phụ Codex tạm thời.
- **Không** thay đổi ngữ cảnh phiên trong tương lai.
- Không được ghi vào lịch sử bản chép lời.

Xem [Câu hỏi phụ BTW](/vi/tools/btw) để biết đầy đủ hành vi.

## Ghi chú về bề mặt

<AccordionGroup>
  <Accordion title="Phạm vi phiên theo từng bề mặt">
    - **Lệnh văn bản:** chạy trong phiên trò chuyện thông thường (tin nhắn trực tiếp dùng chung `main`, các nhóm có phiên riêng).
    - **Lệnh Discord gốc:** `agent:<agentId>:discord:slash:<userId>`
    - **Lệnh Slack gốc:** `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
    - **Lệnh Telegram gốc:** `telegram:slash:<userId>` (nhắm đến phiên trò chuyện qua `CommandTargetSessionKey`)
    - **`/login codex`** chỉ gửi mã ghép nối thiết bị qua cuộc trò chuyện riêng tư hoặc các đường dẫn phản hồi Web UI. Khi được gọi trong nhóm/chủ đề Telegram, lệnh sẽ yêu cầu chủ sở hữu nhắn tin trực tiếp cho bot.
    - **`/stop`** nhắm đến phiên trò chuyện đang hoạt động để hủy lượt chạy hiện tại.

  </Accordion>
  <Accordion title="Chi tiết về Slack">
    `channels.slack.slashCommand` hỗ trợ một lệnh duy nhất theo kiểu `/openclaw`.
    Với `commands.native: true`, hãy tạo một lệnh gạch chéo Slack cho mỗi lệnh
    tích hợp sẵn. Đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng
    `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.
  </Accordion>
  <Accordion title="Đường dẫn nhanh và lối tắt nội dòng">
    - Các tin nhắn chỉ chứa lệnh từ người gửi trong danh sách cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + mô hình).
    - Các lối tắt nội dòng (`/help`, `/commands`, `/status`, `/whoami`) cũng hoạt động khi được nhúng trong tin nhắn thông thường và bị loại bỏ trước khi mô hình nhìn thấy phần văn bản còn lại.
    - Các tin nhắn chỉ chứa lệnh nhưng không được ủy quyền sẽ bị bỏ qua mà không có thông báo; các token `/...` nội dòng được coi là văn bản thuần túy.

  </Accordion>
  <Accordion title="Lưu ý về đối số">
    - Các lệnh chấp nhận một `:` tùy chọn giữa lệnh và các đối số (`/think: high`, `/send: on`).
    - `/new <model>` chấp nhận bí danh mô hình, `provider/model` hoặc tên nhà cung cấp (khớp gần đúng); nếu không có kết quả khớp, văn bản được coi là nội dung tin nhắn.
    - `/allowlist add|remove` yêu cầu `commands.config: true` và tuân theo `configWrites` của kênh.

  </Accordion>
</AccordionGroup>

## Mức sử dụng và trạng thái của nhà cung cấp

- **Mức sử dụng/hạn ngạch của nhà cung cấp** (ví dụ: "Claude còn lại 80%") hiển thị trong `/status` đối với nhà cung cấp mô hình hiện tại khi tính năng theo dõi mức sử dụng được bật.
- **Các dòng token/bộ nhớ đệm** trong `/status` có thể dùng mục mức sử dụng mới nhất trong bản ghi hội thoại làm phương án dự phòng khi ảnh chụp nhanh của phiên trực tiếp có ít dữ liệu.
- **Thực thi và môi trường chạy:** `/status` báo cáo `Execution` cho đường dẫn sandbox có hiệu lực và `Runtime` cho thành phần đang chạy phiên: `OpenClaw Default`, `OpenAI Codex`, một backend CLI hoặc một backend ACP.
- **Token/chi phí cho mỗi phản hồi:** được kiểm soát bởi `/usage off|tokens|full`.
- `/model status` liên quan đến mô hình/xác thực/điểm cuối, không phải mức sử dụng.

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Cách các lệnh gạch chéo của skill được đăng ký và kiểm soát quyền truy cập.
  </Card>
  <Card title="Tạo skill" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng một skill đăng ký lệnh gạch chéo riêng.
  </Card>
  <Card title="BTW" href="/vi/tools/btw" icon="comments">
    Đặt câu hỏi phụ mà không thay đổi ngữ cảnh phiên.
  </Card>
  <Card title="Điều hướng" href="/vi/tools/steer" icon="compass">
    Hướng dẫn agent trong khi đang chạy bằng `/steer`.
  </Card>
</CardGroup>
