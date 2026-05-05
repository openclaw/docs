---
read_when:
    - Xây dựng hoặc chạy quy trình đảm bảo chất lượng trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm xác minh trước và sau cho một pull request
    - Thêm Discord, Slack, WhatsApp hoặc các kịch bản truyền tải trực tiếp khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh trực quan từ đầu đến cuối để tái hiện lỗi OpenClaw trên các kênh truyền tải trực tiếp, thu thập bằng chứng trước và sau, và đính kèm tạo tác vào các PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-05T06:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu-cuối của OpenClaw dành cho các lỗi cần runtime
thật, transport thật và bằng chứng có thể nhìn thấy. Nó chạy một kịch bản trên
một ref đã biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref
ứng viên, rồi xuất bản phần so sánh dưới dạng artifact mà maintainer có thể kiểm
tra từ PR hoặc từ một lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cung cấp cho chúng ta một làn đầu tiên có
giá trị cao: xác thực bot thật, kênh guild thật, phản ứng, thread, lệnh native và
giao diện trình duyệt nơi con người có thể xác nhận trực quan những gì transport
đã hiển thị.

## Mục tiêu

- Tái hiện lỗi từ một issue hoặc PR trên GitHub với cùng hình dạng transport mà
  người dùng nhìn thấy.
- Thu thập artifact **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Dùng oracle xác định được bất cứ khi nào có thể, chẳng hạn đọc phản ứng qua
  Discord REST hoặc kiểm tra transcript của kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI nhìn thấy được.
- Chạy cục bộ từ CLI do agent kiểm soát và chạy từ xa từ GitHub.
- Giữ lại đủ trạng thái máy để cứu hộ qua VNC khi đăng nhập, tự động hóa trình
  duyệt hoặc xác thực provider bị kẹt.
- Đăng trạng thái ngắn gọn lên kênh Discord của operator khi lượt chạy bị chặn,
  cần trợ giúp VNC thủ công hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế cho kiểm thử đơn vị. Một lượt chạy Mantis thường nên trở
  thành một kiểm thử hồi quy nhỏ hơn sau khi đã hiểu bản sửa.
- Mantis không phải cổng CI nhanh thông thường. Nó chậm hơn, dùng credential
  live và được dành cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên cần con người trong vận hành thông thường. VNC thủ công là
  đường cứu hộ, không phải luồng lý tưởng.
- Mantis không lưu secret thô trong artifact, log, ảnh chụp màn hình, báo cáo
  Markdown hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong stack QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, adapter transport, schema bằng chứng và CLI
  cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần live transport harness, helper chụp trình duyệt và bộ
  ghi artifact.
- Crabbox sở hữu các máy Linux đã làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu điểm vào workflow từ xa và việc lưu giữ artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh maintainer,
  dispatch workflow và đăng bình luận PR cuối cùng.
- Agent OpenClaw điều khiển Mantis thông qua Codex khi kịch bản cần thiết lập
  kiểu agentic, gỡ lỗi hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức transport trong OpenClaw, lập lịch máy trong
Crabbox, và phần kết nối workflow maintainer trong ClawSweeper.

## Hình dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi phản
ứng và đường dẫn artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner cục bộ trước và sau nhận hình dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tạo các worktree baseline và candidate tách rời dưới thư mục output, cài
đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi
`baseline/`, `candidate/`, `comparison.json` và `mantis-report.md`. Với kịch bản
Discord đầu tiên, xác minh thành công nghĩa là trạng thái baseline là `fail` và
trạng thái candidate là `pass`.

Primitive VM/trình duyệt đầu tiên là desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, khởi động trình duyệt nhìn thấy
được bên trong phiên VNC, chụp desktop, kéo artifact về thư mục output cục bộ và
ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng provider Hetzner vì đây là
provider đầu tiên có coverage desktop/VNC hoạt động trong làn Mantis. Ghi đè nó
bằng `--provider`, `--crabbox-bin` hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy với một fleet Crabbox khác.

Các flag desktop smoke hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng desktop đã làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt nhìn thấy được.
- `--html-file <path>` render một artifact HTML cục bộ trong repo trong trình duyệt nhìn thấy được. Mantis dùng cách này để chụp timeline phản ứng trạng thái Discord đã tạo thông qua desktop Crabbox thật.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ lease mới tạo đang pass mở để kiểm tra qua VNC. Các lượt chạy thất bại mặc định giữ lease khi lease được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout` và `--ttl` điều chỉnh kích thước máy và thời gian tồn tại của lease.

Primitive desktop transport đầy đủ đầu tiên là Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào
VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt
VNC, chụp desktop nhìn thấy được và sao chép cả artifact Slack QA lẫn ảnh chụp
màn hình VNC về thư mục output cục bộ. Đây là hình dạng Mantis đầu tiên mà SUT
OpenClaw gateway và trình duyệt đều nằm trong cùng một VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một home OpenClaw dùng một lần nhưng bền
vững tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode
cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng `38973` và giữ
Chrome chạy trong phiên VNC. Đây là chế độ "để lại cho tôi một desktop Linux có
Slack và một claw đang chạy"; làn Slack QA bot-to-bot vẫn là mặc định khi bỏ qua
`--gateway-setup`.

Input bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho làn model từ xa. Nếu chỉ
  `OPENAI_API_KEY` được đặt cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY`
  trước khi gọi Crabbox để cơ chế chuyển tiếp env `OPENCLAW_*` của Crabbox có thể
  đưa nó vào VM.

Các flag Slack desktop hữu ích:

- `--lease-id <cbx_...>` chạy lại trên một máy nơi operator đã đăng nhập vào Slack Web qua VNC.
- `--gateway-setup` khởi động một OpenClaw Slack gateway bền vững trong VM thay vì chỉ chạy làn QA bot-to-bot.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi token bot SUT có sẵn.
- `--slack-channel-id <id>` kiểm soát allowlist kênh Slack được dùng bởi thiết lập gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kiểm soát profile Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, nên một phiên đăng nhập Slack Web thủ công vẫn tồn tại qua các lần chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng pool credential dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model` và `--fast` được truyền tiếp sang làn Slack live.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau
cho kịch bản thật đầu tiên là `Mantis Discord Status Reactions`. Nó nhận:

- `baseline_ref`: ref được kỳ vọng tái hiện hành vi chỉ-queued.
- `candidate_ref`: ref được kỳ vọng hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree baseline và candidate riêng
biệt, chạy `discord-status-reactions-tool-only` trên từng worktree và upload
`baseline/`, `candidate/`, `comparison.json` và `mantis-report.md` dưới dạng
artifact Actions. Nó cũng render HTML timeline của từng làn trong trình duyệt
desktop Crabbox và xuất bản các ảnh chụp màn hình VNC đó bên cạnh các PNG
timeline xác định được trong bình luận PR. Cùng bình luận PR đó liên kết tới các
bản ghi MP4 desktop được chụp trong quá trình render trình duyệt VNC, còn ảnh
chụp màn hình vẫn nằm inline để review nhanh. Workflow build Crabbox CLI từ
`openclaw/crabbox` main để có thể dùng các flag lease desktop/trình duyệt hiện
tại trước khi bản phát hành binary Crabbox tiếp theo được cắt.

Bạn cũng có thể kích hoạt lượt chạy status-reactions trực tiếp từ bình luận PR:

```text
@Mantis discord status reactions
```

Trigger qua bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull
request từ người dùng có quyền write, maintain hoặc admin, và chỉ nhận diện các
yêu cầu phản ứng trạng thái Discord. Mặc định, nó dùng ref baseline đã biết là
lỗi và SHA head của PR hiện tại làm candidate. Maintainer có thể ghi đè một
trong hai ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh
xạ một PR hoặc issue sang các kịch bản Mantis được khuyến nghị từ label, file đã
thay đổi và phát hiện review của ClawSweeper.

## Vòng đời chạy

1. Lấy credential.
2. Cấp phát hoặc tái sử dụng VM.
3. Chuẩn bị profile desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị checkout sạch cho ref baseline.
5. Cài đặt dependency và chỉ build những gì kịch bản cần.
6. Khởi động OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình live transport, provider, model và profile trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng baseline.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref candidate trong cùng VM.
11. Chạy cùng kịch bản đó và thu thập bằng chứng candidate.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình và artifact trace tùy chọn.
14. Upload artifact GitHub Actions.
15. Đăng một thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản nên có thể thất bại theo hai cách khác nhau:

- **Đã tái hiện lỗi**: baseline thất bại theo cách được kỳ vọng.
- **Lỗi harness**: thiết lập môi trường, credential, Discord API, trình duyệt
  hoặc provider thất bại trước khi bug oracle có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm
môi trường không ổn định với hành vi sản phẩm.

## MVP Discord

Kịch bản đầu tiên nên nhắm tới phản ứng trạng thái Discord trong kênh guild nơi
chế độ gửi trả lời nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó chạy qua OpenClaw Gateway thật, xác thực bot Discord, dispatch tin nhắn,
  chế độ gửi trả lời nguồn, trạng thái phản ứng trạng thái và vòng đời lượt
  model.
- Nó đủ hẹp để giữ cho phần triển khai đầu tiên trung thực.

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

Bằng chứng baseline nên cho thấy phản ứng xác nhận queued nhưng không có chuyển
tiếp vòng đời trong chế độ tool-only. Bằng chứng candidate nên cho thấy các phản
ứng trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được bật rõ
ràng.

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

Lệnh này cấu hình SUT với xử lý guild luôn bật, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, và các phản ứng trạng thái tường minh. Oracle
thăm dò thông báo kích hoạt Discord thật và mong đợi chuỗi quan sát được
`👀 -> 🤔 -> 👍`. Hiện vật bao gồm `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, và
`discord-status-reactions-tool-only-timeline.png`.

## Các Thành Phần QA Hiện Có

Mantis nên xây dựng dựa trên ngăn xếp QA riêng tư hiện có thay vì bắt đầu từ
con số không:

- `pnpm openclaw qa discord` đã chạy một làn Discord trực tiếp với bot điều khiển và
  bot SUT.
- Bộ chạy truyền tải trực tiếp đã ghi báo cáo và hiện vật thông báo quan sát được
  trong `.artifacts/qa-e2e/`.
- Các lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực
  truyền tải trực tiếp dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot,
  hồ sơ headless được quản lý, và hồ sơ CDP từ xa.
- QA Lab đã có giao diện trình gỡ lỗi và bus cho kiểm thử theo dạng truyền tải.

Bản triển khai Mantis đầu tiên có thể là một bộ chạy trước/sau mỏng trên các
thành phần này, cộng thêm một lớp bằng chứng trực quan.

## Mô Hình Bằng Chứng

Mỗi lần chạy ghi một thư mục hiện vật ổn định:

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

`mantis-summary.json` nên là nguồn sự thật máy đọc được. Báo cáo
Markdown dành cho bình luận PR và đánh giá của con người.

Bản tóm tắt phải bao gồm:

- các ref và SHA đã kiểm thử
- truyền tải và id kịch bản
- nhà cung cấp máy và id máy hoặc id lease
- nguồn thông tin xác thực không kèm giá trị bí mật
- kết quả baseline
- kết quả candidate
- lỗi có tái hiện trên baseline hay không
- candidate có sửa được lỗi hay không
- đường dẫn hiện vật
- các vấn đề thiết lập hoặc dọn dẹp đã được làm sạch

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Chúng vẫn cần kỷ luật biên tập:
tên kênh riêng tư, tên người dùng, hoặc nội dung thông báo có thể xuất hiện. Với PR công khai,
ưu tiên liên kết hiện vật GitHub Actions thay vì ảnh nội tuyến cho đến khi câu chuyện biên tập
mạnh hơn.

## Trình Duyệt Và VNC

Làn trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và
  Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: được bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa Discord,
  hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền để tránh phải
đăng nhập cho mỗi lần chạy, nhưng tách biệt khỏi trạng thái trình duyệt cá nhân. Một hồ sơ
thuộc về nhóm máy Mantis, không thuộc về laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng một thông báo trạng thái Discord với:

- id lần chạy
- id kịch bản
- nhà cung cấp máy
- thư mục hiện vật
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- nội dung ngắn về điểm chặn

Bản triển khai riêng tư đầu tiên có thể đăng các thông báo này vào kênh điều hành
hiện có và chuyển sang một kênh Mantis chuyên dụng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho bản triển khai từ xa đầu tiên.
Crabbox cung cấp máy đã làm ấm, theo dõi lease, hydration, nhật ký, kết quả, và
dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, hãy thêm nhà cung cấp Hetzner
phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có cài đặt Chrome hoặc Chromium hỗ trợ desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và bộ nhớ đệm phụ thuộc
- bộ nhớ đệm trình duyệt Chromium của Playwright khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt, và một lần chạy mô hình
- quyền truy cập outbound tới Discord, GitHub, nhà cung cấp mô hình, và broker thông tin xác thực

VM không nên giữ bí mật thô dài hạn bên ngoài các kho thông tin xác thực hoặc
hồ sơ trình duyệt dự kiến.

## Bí Mật

Bí mật nằm trong bí mật cấp tổ chức hoặc kho lưu trữ GitHub cho các lần chạy từ xa, và trong
một tệp bí mật do operator kiểm soát cục bộ cho các lần chạy cục bộ.

Tên bí mật được khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho tải hiện vật GitHub công khai
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Về dài hạn, nhóm thông tin xác thực Convex nên tiếp tục là nguồn thông thường cho thông tin xác thực
truyền tải trực tiếp. Bí mật GitHub khởi động broker và các làn dự phòng.
Workflow phản ứng trạng thái Discord ánh xạ các bí mật Mantis Crabbox trở lại
các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN`
mà Crabbox CLI mong đợi. Tên bí mật GitHub `CRABBOX_*` thuần vẫn
được chấp nhận làm dự phòng tương thích.

Bộ chạy Mantis không bao giờ được in:

- token bot Discord
- khóa API của nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Tải hiện vật công khai cũng nên biên tập siêu dữ liệu mục tiêu Discord như id bot,
guild, kênh, và thông báo. Workflow smoke GitHub bật
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu token vô tình bị dán vào issue, PR, chat, hoặc nhật ký, hãy xoay vòng token đó
sau khi bí mật mới đã được lưu.

## Hiện Vật GitHub Và Bình Luận PR

Các workflow Mantis nên tải toàn bộ gói bằng chứng lên dưới dạng hiện vật Actions
ngắn hạn. Khi workflow được chạy cho báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên
xuất bản ảnh chụp màn hình PNG đã biên tập lên nhánh `qa-artifacts` và upsert một
bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau nội tuyến. Không đăng
bằng chứng chính chỉ trên một PR tự động hóa QA chung. Nhật ký thô, thông báo quan sát được,
và bằng chứng cồng kềnh khác ở lại trong hiện vật Actions.

Workflow production nên đăng các bình luận đó bằng GitHub App Mantis, không phải
bằng `github-actions[bot]`. Lưu app id và khóa riêng tư dưới dạng bí mật GitHub Actions
`MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow dùng một marker ẩn làm khóa upsert, cập nhật
bình luận đó khi token có thể chỉnh sửa nó, và tạo bình luận mới do Mantis sở hữu khi
marker cũ do bot sở hữu không thể chỉnh sửa.

Bình luận PR nên ngắn gọn và trực quan:

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

Khi lần chạy thất bại vì harness thất bại, bình luận phải nói rõ điều đó thay vì
ngụ ý candidate đã thất bại.

## Ghi Chú Triển Khai Riêng Tư

Một bản triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng
ứng dụng đó thay vì tạo app khác khi nó có quyền bot phù hợp
và có thể được xoay vòng an toàn.

Thiết lập kênh thông báo operator ban đầu thông qua bí mật hoặc cấu hình
triển khai. Ban đầu nó có thể trỏ tới một kênh maintainer hoặc vận hành hiện có,
rồi chuyển sang kênh Mantis chuyên dụng khi có kênh đó.

Không đưa guild id, channel id, bot token, cookie trình duyệt, hoặc mật khẩu VNC
vào tài liệu này. Lưu chúng trong bí mật GitHub, broker thông tin xác thực, hoặc
kho bí mật cục bộ của operator.

## Thêm Một Kịch Bản

Một kịch bản Mantis nên khai báo:

- id và tiêu đề
- truyền tải
- thông tin xác thực bắt buộc
- chính sách ref baseline
- chính sách ref candidate
- bản vá cấu hình OpenClaw
- bước thiết lập
- kích thích
- oracle baseline mong đợi
- oracle candidate mong đợi
- mục tiêu chụp trực quan
- ngân sách thời gian chờ
- bước dọn dẹp

Kịch bản nên ưu tiên các oracle nhỏ, có kiểu:

- trạng thái phản ứng Discord cho lỗi phản ứng
- tham chiếu thông báo Discord cho lỗi luồng
- ts luồng Slack và trạng thái API phản ứng cho lỗi Slack
- id thông báo email và header cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất

Kiểm tra bằng thị giác nên có tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng
API làm oracle đạt/không đạt và giữ ảnh chụp màn hình để con người tin tưởng hơn.

## Mở Rộng Nhà Cung Cấp

Sau Discord, cùng bộ chạy có thể thêm:

- Slack: phản ứng, luồng, nhắc đến app, modal, tải tệp lên.
- Email: xác thực Gmail và phân luồng thông báo bằng `gog` khi connector là chưa
  đủ.
- WhatsApp: đăng nhập QR, nhận dạng lại, gửi thông báo, phương tiện, phản ứng.
- Telegram: kiểm soát nhắc đến trong nhóm, lệnh, phản ứng khi khả dụng.
- Matrix: phòng được mã hóa, quan hệ luồng hoặc trả lời, tiếp tục sau khởi động lại.

Mỗi truyền tải nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi.
Các kịch bản trực quan tốn kém nên được giữ ở chế độ opt-in.

## Câu Hỏi Mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi
  bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt quan sát nên dùng tài khoản Discord của con người, tài khoản kiểm thử,
  hay chỉ bằng chứng REST mà bot có thể đọc cho giai đoạn đầu?
- GitHub nên giữ hiện vật Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động khuyến nghị Mantis thay vì chờ
  lệnh từ maintainer?
- Ảnh chụp màn hình có nên được biên tập hoặc cắt trước khi tải lên cho PR công khai không?
