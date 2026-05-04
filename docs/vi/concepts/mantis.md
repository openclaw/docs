---
read_when:
    - Xây dựng hoặc chạy QA trực quan trực tiếp cho lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một pull request
    - Thêm Discord, Slack, WhatsApp hoặc các kịch bản truyền tải trực tiếp khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh trực quan đầu cuối để tái hiện lỗi OpenClaw trên các phương thức truyền tải trực tiếp, ghi lại bằng chứng trước và sau, đồng thời đính kèm hiện vật vào PR.
title: Mantis
x-i18n:
    generated_at: "2026-05-04T07:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw dành cho các lỗi cần môi trường
chạy thực, phương thức truyền tải thực và bằng chứng có thể nhìn thấy. Nó chạy một
kịch bản trên một ref đã biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó
trên một ref ứng viên, rồi công bố phần so sánh dưới dạng artifact mà người bảo trì
có thể kiểm tra từ PR hoặc từ một lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cho chúng ta một lane đầu tiên có giá trị cao:
xác thực bot thực, kênh guild thực, reaction, thread, lệnh native và một
UI trình duyệt nơi con người có thể xác nhận trực quan những gì phương thức truyền tải hiển thị.

## Mục tiêu

- Tái hiện một lỗi từ issue hoặc PR trên GitHub với cùng hình dạng phương thức truyền tải mà người dùng
  nhìn thấy.
- Thu thập artifact **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Dùng oracle xác định bất cứ khi nào có thể, chẳng hạn như đọc reaction qua Discord REST
  hoặc kiểm tra transcript kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI có thể nhìn thấy.
- Chạy cục bộ từ CLI do agent điều khiển và chạy từ xa từ GitHub.
- Giữ lại đủ trạng thái máy cho việc cứu hộ qua VNC khi đăng nhập, tự động hóa trình duyệt hoặc
  xác thực nhà cung cấp bị kẹt.
- Đăng trạng thái ngắn gọn lên một kênh Discord của operator khi lượt chạy bị chặn,
  cần trợ giúp VNC thủ công hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế kiểm thử đơn vị. Một lượt chạy Mantis thường nên trở thành
  một kiểm thử hồi quy nhỏ hơn sau khi bản sửa đã được hiểu rõ.
- Mantis không phải là cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin xác thực live và
  được dành riêng cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên yêu cầu con người trong vận hành bình thường. VNC thủ công là đường cứu hộ,
  không phải luồng mong muốn.
- Mantis không lưu bí mật thô trong artifact, log, ảnh chụp màn hình, báo cáo Markdown
  hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong ngăn xếp QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, bộ điều hợp phương thức truyền tải, schema bằng chứng và
  CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness phương thức truyền tải live, helper chụp trình duyệt và
  trình ghi artifact.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu điểm vào workflow từ xa và việc giữ lại artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh của người bảo trì,
  dispatch workflow và đăng bình luận PR cuối cùng.
- Agent OpenClaw điều khiển Mantis thông qua Codex khi một kịch bản cần thiết lập agentic,
  gỡ lỗi hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức về phương thức truyền tải trong OpenClaw, lập lịch máy trong
Crabbox và phần kết nối workflow của người bảo trì trong ClawSweeper.

## Dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn,
gửi reaction và đường dẫn artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner cục bộ trước và sau chấp nhận dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tạo các worktree baseline và ứng viên tách rời trong thư mục đầu ra,
cài đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi `baseline/`, `candidate/`, `comparison.json`,
và `mantis-report.md`. Với kịch bản Discord đầu tiên, xác minh thành công
nghĩa là trạng thái baseline là `fail` và trạng thái ứng viên là `pass`.

Primitive VM/trình duyệt đầu tiên là desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, khởi động một trình duyệt hiển thị bên trong
phiên VNC, chụp desktop, kéo artifact về thư mục đầu ra cục bộ
và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng nhà cung cấp Hetzner
vì đây là nhà cung cấp đầu tiên có coverage desktop/VNC hoạt động trong lane Mantis.
Ghi đè bằng `--provider`, `--crabbox-bin` hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy trên một fleet Crabbox khác.

Các flag desktop smoke hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt hiển thị.
- `--html-file <path>` render một artifact HTML cục bộ trong repo trong trình duyệt hiển thị. Mantis dùng tùy chọn này để chụp timeline reaction trạng thái Discord đã tạo thông qua một desktop Crabbox thực.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo đã pass mở để kiểm tra qua VNC. Theo mặc định, các lượt chạy thất bại giữ lease khi có lease được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout` và `--ttl` tinh chỉnh kích thước máy và thời hạn lease.

Primitive phương thức truyền tải desktop đầy đủ đầu tiên là Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào
VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt
VNC, chụp desktop hiển thị và sao chép cả artifact Slack QA lẫn
ảnh chụp màn hình VNC về thư mục đầu ra cục bộ. Đây là hình dạng Mantis đầu tiên
trong đó Gateway OpenClaw SUT và trình duyệt đều sống bên trong cùng một
VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một home OpenClaw dùng một lần nhưng bền vững
tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode
cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng
`38973` và giữ Chrome chạy trong phiên VNC. Đây là chế độ "để lại cho tôi một
desktop Linux có Slack và một claw đang chạy"; lane Slack QA bot-to-bot
vẫn là mặc định khi bỏ qua `--gateway-setup`.

Đầu vào bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho lane mô hình từ xa. Nếu chỉ
  `OPENAI_API_KEY` được đặt cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY`
  trước khi gọi Crabbox để cơ chế chuyển tiếp env `OPENCLAW_*` của Crabbox có thể mang nó
  vào VM.

Các cờ Slack trên máy tính để bàn hữu ích:

- `--lease-id <cbx_...>` chạy lại trên một máy mà operator đã đăng nhập vào Slack Web qua VNC.
- `--gateway-setup` khởi động một OpenClaw Slack gateway bền vững trong VM thay vì chỉ chạy lane QA bot-tới-bot.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi token bot SUT khả dụng.
- `--slack-channel-id <id>` điều khiển allowlist kênh Slack được dùng bởi thiết lập gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` điều khiển hồ sơ Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, nên lần đăng nhập Slack Web thủ công vẫn tồn tại qua các lần chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng nhóm thông tin xác thực dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model`, và `--fast` được chuyển tiếp tới lane live Slack.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau
cho kịch bản thực đầu tiên là `Mantis Discord Status Reactions`. Nó
chấp nhận:

- `baseline_ref`: ref được kỳ vọng tái hiện hành vi chỉ queued.
- `candidate_ref`: ref được kỳ vọng hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, dựng các worktree baseline và candidate riêng,
chạy `discord-status-reactions-tool-only` trên từng worktree, và
tải `baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md` lên làm
artifact Actions. Nó cũng render HTML timeline của từng lane trong trình duyệt
desktop Crabbox và xuất bản các ảnh chụp màn hình VNC đó bên cạnh các PNG timeline
xác định được trong bình luận PR. Workflow dựng Crabbox CLI từ
`openclaw/crabbox` main để có thể dùng các cờ lease desktop/trình duyệt hiện tại
trước khi bản phát hành nhị phân Crabbox tiếp theo được cắt.

Bạn cũng có thể kích hoạt lượt chạy status-reactions trực tiếp từ bình luận PR:

```text
@Mantis discord status reactions
```

Trigger bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull request
từ người dùng có quyền write, maintain, hoặc admin, và nó chỉ nhận diện
các yêu cầu status-reaction Discord. Theo mặc định, nó dùng ref baseline đã biết là lỗi
và SHA head PR hiện tại làm candidate. Maintainer có thể ghi đè một trong hai
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh xạ một PR
hoặc issue tới các kịch bản Mantis được đề xuất từ nhãn, tệp đã thay đổi, và
phát hiện review của ClawSweeper.

## Vòng đời chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng một VM.
3. Chuẩn bị hồ sơ desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị một checkout sạch cho ref baseline.
5. Cài đặt dependency và chỉ build những gì kịch bản cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình transport live, provider, model, và hồ sơ trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng baseline.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref candidate trong cùng VM.
11. Chạy cùng kịch bản và thu thập bằng chứng candidate.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình, và artifact trace tùy chọn.
14. Tải artifact GitHub Actions lên.
15. Đăng một thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản nên có thể thất bại theo hai cách khác nhau:

- **Đã tái hiện lỗi**: baseline thất bại theo cách được kỳ vọng.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt, hoặc
  provider thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm lẫn một môi trường
chập chờn với hành vi sản phẩm.

## Discord MVP

Kịch bản đầu tiên nên nhắm tới status reaction Discord trong các kênh guild nơi
chế độ phân phối phản hồi nguồn là `message_tool_only`.

Vì sao đây là một seed Mantis tốt:

- Nó hiển thị trong Discord dưới dạng reaction trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái reaction của tin nhắn Discord.
- Nó kiểm tra một OpenClaw Gateway thực, auth bot Discord, gửi tin nhắn,
  chế độ phân phối phản hồi nguồn, trạng thái status reaction, và vòng đời lượt model.
- Nó đủ hẹp để giữ cho triển khai đầu tiên trung thực.

Hình dạng kịch bản kỳ vọng:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Bằng chứng baseline nên cho thấy reaction xác nhận queued nhưng không có
chuyển tiếp vòng đời trong chế độ chỉ-tool. Bằng chứng candidate nên cho thấy các
status reaction vòng đời chạy khi `messages.statusReactions.enabled` được đặt rõ ràng
là true.

Lát cắt thực thi đầu tiên là kịch bản QA live Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Nó cấu hình SUT với xử lý guild luôn bật, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, và các phản ứng trạng thái tường minh. Oracle
thăm dò thông điệp kích hoạt Discord thật và kỳ vọng chuỗi quan sát được
`👀 -> 🤔 -> 👍`. Hiện vật bao gồm `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, và
`discord-status-reactions-tool-only-timeline.png`.

## Các Thành Phần QA Hiện Có

Mantis nên xây dựng dựa trên ngăn xếp QA riêng tư hiện có thay vì bắt đầu từ
con số không:

- `pnpm openclaw qa discord` đã chạy một lane Discord trực tiếp với bot driver và
  bot SUT.
- Trình chạy transport trực tiếp đã ghi các báo cáo và hiện vật thông điệp quan sát
  trong `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực
  transport trực tiếp dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot,
  hồ sơ được quản lý headless, và hồ sơ CDP từ xa.
- QA Lab đã có UI trình gỡ lỗi và bus cho kiểm thử có hình dạng transport.

Triển khai Mantis đầu tiên có thể là một trình chạy trước/sau mỏng trên các
thành phần này, cộng thêm một lớp bằng chứng trực quan.

## Mô Hình Bằng Chứng

Mỗi lượt chạy ghi một thư mục hiện vật ổn định:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` nên là nguồn chân lý có thể đọc bằng máy. Báo cáo
Markdown dành cho bình luận PR và rà soát của con người.

Bản tóm tắt phải bao gồm:

- các ref và SHA đã kiểm thử
- transport và id kịch bản
- nhà cung cấp máy và id máy hoặc id lease
- nguồn thông tin xác thực không kèm giá trị bí mật
- kết quả baseline
- kết quả candidate
- lỗi có tái hiện trên baseline hay không
- candidate có sửa được lỗi hay không
- đường dẫn hiện vật
- các vấn đề thiết lập hoặc dọn dẹp đã được làm sạch

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Chúng vẫn cần kỷ luật biên tập:
tên kênh riêng tư, tên người dùng, hoặc nội dung thông điệp có thể xuất hiện. Với PR công khai,
ưu tiên liên kết hiện vật GitHub Actions hơn hình ảnh nhúng cho đến khi câu chuyện biên tập
mạnh hơn.

## Trình Duyệt Và VNC

Lane trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và
  Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord,
  hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền vững để tránh phải
đăng nhập cho mỗi lượt chạy, nhưng được cô lập khỏi trạng thái trình duyệt cá nhân. Một hồ sơ
thuộc về nhóm máy Mantis, không thuộc về laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng một thông điệp trạng thái Discord với:

- id lượt chạy
- id kịch bản
- nhà cung cấp máy
- thư mục hiện vật
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn về điểm chặn

Triển khai riêng tư đầu tiên có thể đăng các thông điệp này lên kênh operator
hiện có và chuyển sang một kênh Mantis riêng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên.
Crabbox cung cấp máy đã được làm nóng, theo dõi lease, hydration, log, kết quả, và
dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, thêm nhà cung cấp Hetzner
phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux với bản cài Chrome hoặc Chromium có khả năng desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và cache phụ thuộc
- cache trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt, và một lượt chạy mô hình
- quyền truy cập ra ngoài tới Discord, GitHub, nhà cung cấp mô hình, và broker thông tin xác thực

VM không nên giữ bí mật thô tồn tại lâu ngoài các kho thông tin xác thực hoặc
hồ sơ trình duyệt dự kiến.

## Bí Mật

Bí mật nằm trong bí mật tổ chức hoặc kho lưu trữ GitHub cho lượt chạy từ xa, và trong
một tệp bí mật do operator kiểm soát cục bộ cho lượt chạy cục bộ.

Tên bí mật được khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho tải lên hiện vật GitHub công khai
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Về lâu dài, nhóm thông tin xác thực Convex nên tiếp tục là nguồn thông thường cho thông tin xác thực
transport trực tiếp. Bí mật GitHub bootstrap broker và các lane dự phòng.
Workflow phản ứng trạng thái Discord ánh xạ bí mật Mantis Crabbox trở lại
các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN`
mà Crabbox CLI kỳ vọng. Tên bí mật GitHub `CRABBOX_*` thuần vẫn
được chấp nhận làm dự phòng tương thích.

Trình chạy Mantis tuyệt đối không được in:

- token bot Discord
- khóa API nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Tải lên hiện vật công khai cũng nên biên tập metadata mục tiêu Discord như id bot,
guild, kênh, và thông điệp. Workflow smoke GitHub bật
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu token vô tình được dán vào issue, PR, chat, hoặc log, hãy xoay vòng nó
sau khi bí mật mới đã được lưu trữ.

## Hiện Vật GitHub Và Bình Luận PR

Workflow Mantis nên tải lên toàn bộ gói bằng chứng dưới dạng hiện vật Actions
tồn tại ngắn hạn. Khi workflow được chạy cho báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên
xuất bản ảnh chụp màn hình PNG đã biên tập lên nhánh `qa-artifacts` và upsert một
bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau nhúng. Không đăng
bằng chứng chính chỉ trên một PR tự động hóa QA chung. Log thô, thông điệp quan sát,
và bằng chứng cồng kềnh khác ở lại trong hiện vật Actions.

Workflow production nên đăng các bình luận đó bằng Mantis GitHub App, không
bằng `github-actions[bot]`. Lưu app id và private key dưới dạng bí mật GitHub Actions
`MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow dùng một marker ẩn làm khóa upsert, cập nhật bình luận đó
khi token có thể chỉnh sửa nó, và tạo một bình luận mới do Mantis sở hữu khi
marker cũ do bot sở hữu không thể được chỉnh sửa.

Bình luận PR nên ngắn và trực quan:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Khi lượt chạy thất bại vì harness thất bại, bình luận phải nói rõ điều đó thay vì
ngụ ý candidate thất bại.

## Ghi Chú Triển Khai Riêng Tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng
ứng dụng đó thay vì tạo app khác khi nó có đúng quyền bot
và có thể được xoay vòng an toàn.

Thiết lập kênh thông báo operator ban đầu qua bí mật hoặc cấu hình triển khai.
Ban đầu nó có thể trỏ tới một kênh maintainer hoặc vận hành hiện có,
sau đó chuyển sang một kênh Mantis riêng khi có.

Không đưa guild id, channel id, token bot, cookie trình duyệt, hoặc mật khẩu VNC
vào tài liệu này. Lưu chúng trong bí mật GitHub, broker thông tin xác thực, hoặc
kho bí mật cục bộ của operator.

## Thêm Một Kịch Bản

Một kịch bản Mantis nên khai báo:

- id và tiêu đề
- transport
- thông tin xác thực bắt buộc
- chính sách ref baseline
- chính sách ref candidate
- bản vá cấu hình OpenClaw
- các bước thiết lập
- kích thích
- oracle baseline kỳ vọng
- oracle candidate kỳ vọng
- mục tiêu chụp trực quan
- ngân sách timeout
- các bước dọn dẹp

Kịch bản nên ưu tiên các oracle nhỏ, có kiểu:

- trạng thái phản ứng Discord cho lỗi phản ứng
- tham chiếu thông điệp Discord cho lỗi threading
- ts luồng Slack và trạng thái API phản ứng cho lỗi Slack
- id thông điệp email và header cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất

Kiểm tra vision nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng
API làm oracle pass/fail và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở Rộng Nhà Cung Cấp

Sau Discord, cùng trình chạy có thể thêm:

- Slack: phản ứng, luồng, nhắc app, modal, tải tệp lên.
- Email: xác thực Gmail và threading thông điệp dùng `gog` khi connector không
  đủ.
- WhatsApp: đăng nhập QR, nhận dạng lại, gửi thông điệp, media, phản ứng.
- Telegram: cổng nhắc trong nhóm, lệnh, phản ứng khi có.
- Matrix: phòng được mã hóa, quan hệ luồng hoặc trả lời, tiếp tục sau khởi động lại.

Mỗi transport nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi.
Kịch bản trực quan tốn kém nên là tùy chọn bật riêng.

## Câu Hỏi Mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi
  bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt quan sát nên dùng tài khoản Discord của con người, tài khoản kiểm thử,
  hay chỉ bằng chứng REST bot có thể đọc trong giai đoạn đầu?
- GitHub nên giữ hiện vật Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động khuyến nghị Mantis thay vì chờ
  lệnh maintainer?
- Ảnh chụp màn hình có nên được biên tập hoặc cắt trước khi tải lên cho PR công khai không?
