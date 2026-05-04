---
read_when:
    - Xây dựng hoặc chạy QA trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo
    - Thêm các kịch bản truyền tải trực tiếp cho Discord, Slack, WhatsApp hoặc các dịch vụ khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh trực quan từ đầu đến cuối để tái hiện lỗi OpenClaw trên các kênh truyền tải trực tiếp, ghi lại bằng chứng trước và sau, đồng thời đính kèm các tạo tác vào các PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-04T02:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw dành cho các lỗi cần môi trường chạy thực, kênh truyền thực và bằng chứng hiển thị được. Nó chạy một kịch bản trên một tham chiếu lỗi đã biết, thu thập bằng chứng, chạy cùng kịch bản đó trên một tham chiếu ứng viên, rồi xuất bản phần so sánh dưới dạng hiện vật để maintainer có thể kiểm tra từ PR hoặc từ lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cho chúng ta một làn đầu tiên có giá trị cao: xác thực bot thật, kênh guild thật, phản ứng, luồng, lệnh native và một giao diện trình duyệt nơi con người có thể xác nhận trực quan những gì kênh truyền đã hiển thị.

## Mục tiêu

- Tái hiện một lỗi từ issue hoặc PR trên GitHub với cùng dạng kênh truyền mà người dùng thấy.
- Thu thập một hiện vật **trước** trên tham chiếu cơ sở trước khi áp dụng bản sửa.
- Thu thập một hiện vật **sau** trên tham chiếu ứng viên sau khi áp dụng bản sửa.
- Dùng oracle xác định được bất cứ khi nào có thể, chẳng hạn như đọc phản ứng qua Discord REST hoặc kiểm tra bản ghi kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI hiển thị được.
- Chạy cục bộ từ CLI do tác tử điều khiển và chạy từ xa qua GitHub.
- Giữ đủ trạng thái máy cho cứu hộ VNC khi đăng nhập, tự động hóa trình duyệt hoặc xác thực nhà cung cấp bị kẹt.
- Đăng trạng thái ngắn gọn lên kênh Discord của vận hành viên khi lượt chạy bị chặn, cần trợ giúp VNC thủ công hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế kiểm thử đơn vị. Một lượt chạy Mantis thường nên được chuyển thành một kiểm thử hồi quy nhỏ hơn sau khi đã hiểu rõ bản sửa.
- Mantis không phải cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin xác thực live và được dành cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên cần con người trong vận hành bình thường. VNC thủ công là đường cứu hộ, không phải đường thành công mặc định.
- Mantis không lưu bí mật thô trong hiện vật, log, ảnh chụp màn hình, báo cáo Markdown hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong ngăn xếp QA của OpenClaw.

- OpenClaw sở hữu môi trường chạy kịch bản, bộ điều hợp kênh truyền, schema bằng chứng và CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness kênh truyền live, trình trợ giúp chụp trình duyệt và bộ ghi hiện vật.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu điểm vào workflow từ xa và thời hạn lưu hiện vật.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh maintainer, dispatch workflow và đăng bình luận PR cuối cùng.
- Các tác tử OpenClaw điều khiển Mantis thông qua Codex khi một kịch bản cần thiết lập agentic, gỡ lỗi hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức kênh truyền trong OpenClaw, lập lịch máy trong Crabbox và phần gắn kết workflow maintainer trong ClawSweeper.

## Dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi phản ứng và đường dẫn hiện vật:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Trình chạy trước và sau cục bộ chấp nhận dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Trình chạy tạo các worktree cơ sở và ứng viên tách rời trong thư mục đầu ra, cài đặt phụ thuộc, build từng tham chiếu, chạy kịch bản với `--allow-failures`, rồi ghi `baseline/`, `candidate/`, `comparison.json` và `mantis-report.md`. Với kịch bản Discord đầu tiên, xác minh thành công nghĩa là trạng thái cơ sở là `fail` và trạng thái ứng viên là `pass`.

Primitive VM/trình duyệt đầu tiên là kiểm tra smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, khởi động trình duyệt hiển thị được trong phiên VNC, chụp desktop, kéo hiện vật về thư mục đầu ra cục bộ và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng nhà cung cấp Hetzner vì đây là nhà cung cấp đầu tiên có desktop/VNC hoạt động trong làn Mantis. Ghi đè bằng `--provider`, `--crabbox-bin` hoặc `OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy trên một đội máy Crabbox khác.

Các cờ smoke desktop hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt hiển thị được.
- `--html-file <path>` render một hiện vật HTML cục bộ trong repo trong trình duyệt hiển thị được. Mantis dùng điều này để chụp timeline phản ứng trạng thái Discord đã tạo thông qua một desktop Crabbox thật.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo đã pass mở để kiểm tra qua VNC. Các lượt chạy thất bại mặc định giữ lease khi có tạo lease để vận hành viên có thể kết nối lại.
- `--class`, `--idle-timeout` và `--ttl` tinh chỉnh kích thước máy và thời hạn lease.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau cho kịch bản thật đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: tham chiếu được kỳ vọng tái hiện hành vi chỉ queued.
- `candidate_ref`: tham chiếu được kỳ vọng hiển thị `queued -> thinking -> done`.

Nó checkout tham chiếu harness workflow, build các worktree cơ sở và ứng viên riêng biệt, chạy `discord-status-reactions-tool-only` trên từng worktree và tải `baseline/`, `candidate/`, `comparison.json` cùng `mantis-report.md` lên dưới dạng hiện vật Actions. Nó cũng render HTML timeline của từng làn trong trình duyệt desktop Crabbox và xuất bản các ảnh chụp màn hình VNC đó bên cạnh các PNG timeline xác định được trong bình luận PR. Workflow build Crabbox CLI từ main của `openclaw/crabbox` để có thể dùng các cờ lease desktop/trình duyệt hiện tại trước khi bản phát hành nhị phân Crabbox tiếp theo được cắt.

Bạn cũng có thể kích hoạt lượt chạy status-reactions trực tiếp từ bình luận PR:

```text
@Mantis discord status reactions
```

Trigger qua bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull request từ người dùng có quyền write, maintain hoặc admin, và chỉ nhận diện các yêu cầu phản ứng trạng thái Discord. Theo mặc định, nó dùng tham chiếu cơ sở lỗi đã biết và SHA head hiện tại của PR làm ứng viên. Maintainer có thể ghi đè một trong hai tham chiếu:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai sau này có thể ánh xạ một PR hoặc issue tới các kịch bản Mantis được khuyến nghị từ nhãn, tệp đã thay đổi và phát hiện review của ClawSweeper.

## Vòng đời lượt chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng VM.
3. Chuẩn bị hồ sơ desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị một checkout sạch cho tham chiếu cơ sở.
5. Cài đặt phụ thuộc và chỉ build những gì kịch bản cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình kênh truyền live, nhà cung cấp, mô hình và hồ sơ trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng cơ sở.
9. Dừng gateway và giữ log.
10. Chuẩn bị tham chiếu ứng viên trong cùng VM.
11. Chạy cùng kịch bản và thu thập bằng chứng ứng viên.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình và hiện vật trace tùy chọn.
14. Tải hiện vật GitHub Actions lên.
15. Đăng một thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản nên có thể thất bại theo hai cách khác nhau:

- **Đã tái hiện lỗi**: cơ sở thất bại theo cách được kỳ vọng.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt hoặc nhà cung cấp thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm môi trường chập chờn với hành vi sản phẩm.

## MVP Discord

Kịch bản đầu tiên nên nhắm tới phản ứng trạng thái Discord trong kênh guild nơi chế độ gửi phản hồi nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó đi qua một OpenClaw Gateway thật, xác thực bot Discord, dispatch tin nhắn, chế độ gửi phản hồi nguồn, trạng thái phản ứng trạng thái và vòng đời lượt mô hình.
- Nó đủ hẹp để giữ cho triển khai đầu tiên trung thực.

Dạng kịch bản kỳ vọng:

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

Bằng chứng cơ sở nên cho thấy phản ứng xác nhận queued nhưng không có chuyển tiếp vòng đời trong chế độ chỉ tool. Bằng chứng ứng viên nên cho thấy phản ứng trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được đặt rõ ràng là true.

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
"message_tool"`, `ackReaction: "👀"` và phản ứng trạng thái rõ ràng. Oracle poll tin nhắn kích hoạt Discord thật và kỳ vọng chuỗi quan sát được `👀 -> 🤔 -> 👍`. Hiện vật bao gồm `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` và `discord-status-reactions-tool-only-timeline.png`.

## Các phần QA hiện có

Mantis nên xây dựng dựa trên ngăn xếp QA riêng hiện có thay vì bắt đầu từ số không:

- `pnpm openclaw qa discord` đã chạy một làn Discord live với bot driver và SUT.
- Trình chạy kênh truyền live đã ghi báo cáo và hiện vật tin nhắn quan sát được dưới `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền tới thông tin xác thực kênh truyền live dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot, hồ sơ được quản lý headless và hồ sơ CDP từ xa.
- QA Lab đã có UI trình gỡ lỗi và bus cho kiểm thử có dạng kênh truyền.

Triển khai Mantis đầu tiên có thể là một trình chạy trước/sau mỏng trên các phần này, cộng thêm một lớp bằng chứng trực quan.

## Mô hình bằng chứng

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

`mantis-summary.json` nên là nguồn sự thật đọc được bằng máy. Báo cáo Markdown dành cho bình luận PR và review của con người.

Tóm tắt phải bao gồm:

- các tham chiếu và SHA đã kiểm thử
- kênh truyền và id kịch bản
- nhà cung cấp máy và id máy hoặc id lease
- nguồn thông tin xác thực không kèm giá trị bí mật
- kết quả cơ sở
- kết quả ứng viên
- lỗi có được tái hiện trên cơ sở hay không
- ứng viên có sửa được lỗi hay không
- đường dẫn hiện vật
- các vấn đề thiết lập hoặc dọn dẹp đã được khử nhạy cảm

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Tuy vậy vẫn cần kỷ luật biên tập che giấu: tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Với PR công khai, ưu tiên liên kết hiện vật GitHub Actions hơn ảnh nhúng cho đến khi câu chuyện biên tập che giấu mạnh hơn.

## Trình duyệt và VNC

Làn trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: được bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền vững để tránh phải đăng nhập cho mỗi lần chạy, nhưng phải tách biệt khỏi trạng thái trình duyệt cá nhân. Một hồ sơ thuộc về nhóm máy Mantis, không thuộc về laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng một thông báo trạng thái Discord với:

- id lần chạy
- id kịch bản
- nhà cung cấp máy
- thư mục artifact
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn mô tả điểm chặn

Triển khai riêng tư đầu tiên có thể đăng các thông báo này lên kênh điều phối hiện có và chuyển sang một kênh Mantis riêng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho lần triển khai từ xa đầu tiên. Crabbox cung cấp cho chúng ta các máy đã được làm nóng sẵn, theo dõi thuê máy, cấp dữ liệu khởi tạo, nhật ký, kết quả và dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, hãy thêm một nhà cung cấp Hetzner phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có bản cài đặt Chrome hoặc Chromium hỗ trợ desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- bản checkout OpenClaw và cache dependency
- cache trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt và một lần chạy mô hình
- quyền truy cập đi ra tới Discord, GitHub, nhà cung cấp mô hình và broker thông tin xác thực

VM không nên lưu các bí mật thô tồn tại lâu bên ngoài kho thông tin xác thực hoặc kho hồ sơ trình duyệt dự kiến.

## Bí mật

Bí mật nằm trong bí mật GitHub cấp tổ chức hoặc repository cho các lần chạy từ xa, và trong một tệp bí mật cục bộ do operator kiểm soát cho các lần chạy cục bộ.

Tên bí mật được khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho tải lên artifact GitHub công khai
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Về lâu dài, pool thông tin xác thực Convex nên tiếp tục là nguồn thông thường cho thông tin xác thực transport trực tiếp. Bí mật GitHub khởi động broker và các lane dự phòng. Workflow phản ứng trạng thái Discord ánh xạ các bí mật Mantis Crabbox trở lại các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN` mà CLI Crabbox mong đợi. Các tên bí mật GitHub dạng `CRABBOX_*` thuần vẫn được chấp nhận như một phương án tương thích dự phòng.

Runner Mantis không bao giờ được in:

- token bot Discord
- khóa API nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Tải lên artifact công khai cũng nên biên tập ẩn siêu dữ liệu mục tiêu Discord như id bot, guild, kênh và tin nhắn. Workflow smoke GitHub bật `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu một token bị dán nhầm vào issue, PR, chat hoặc nhật ký, hãy xoay vòng token đó sau khi bí mật mới đã được lưu.

## Artifact GitHub Và Bình Luận PR

Các workflow Mantis nên tải lên toàn bộ gói bằng chứng dưới dạng artifact Actions tồn tại ngắn hạn. Khi workflow được chạy cho một báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên phát hành các ảnh chụp màn hình PNG đã biên tập ẩn lên nhánh `qa-artifacts` và upsert một bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp trước/sau hiển thị trực tiếp. Không đăng bằng chứng chính chỉ trên một PR tự động hóa QA chung. Nhật ký thô, tin nhắn đã quan sát và bằng chứng cồng kềnh khác nằm trong artifact Actions.

Các workflow production nên đăng những bình luận đó bằng Mantis GitHub App, không dùng `github-actions[bot]`. Lưu app id và khóa riêng dưới dạng bí mật GitHub Actions `MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow dùng một marker ẩn làm khóa upsert, cập nhật bình luận đó khi token có thể chỉnh sửa nó, và tạo một bình luận mới thuộc sở hữu của Mantis khi một marker cũ thuộc sở hữu của bot không thể chỉnh sửa được.

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

Khi lần chạy thất bại vì harness thất bại, bình luận phải nói rõ điều đó thay vì ngụ ý rằng candidate thất bại.

## Ghi Chú Triển Khai Riêng Tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng ứng dụng đó thay vì tạo app khác khi nó có đúng quyền bot và có thể xoay vòng an toàn.

Đặt kênh thông báo operator ban đầu thông qua bí mật hoặc cấu hình triển khai. Ban đầu nó có thể trỏ tới kênh maintainer hoặc vận hành hiện có, rồi chuyển sang một kênh Mantis riêng khi kênh đó tồn tại.

Không đưa guild id, channel id, token bot, cookie trình duyệt hoặc mật khẩu VNC vào tài liệu này. Lưu chúng trong bí mật GitHub, broker thông tin xác thực hoặc kho bí mật cục bộ của operator.

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
- oracle baseline dự kiến
- oracle candidate dự kiến
- mục tiêu chụp hình ảnh
- ngân sách timeout
- các bước dọn dẹp

Các kịch bản nên ưu tiên oracle nhỏ, có kiểu:

- trạng thái phản ứng Discord cho lỗi phản ứng
- tham chiếu tin nhắn Discord cho lỗi phân luồng
- thread ts Slack và trạng thái API phản ứng cho lỗi Slack
- id và header tin nhắn email cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất

Kiểm tra bằng thị giác nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng API làm oracle đạt/trượt và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở Rộng Nhà Cung Cấp

Sau Discord, cùng runner đó có thể thêm:

- Slack: phản ứng, luồng, nhắc đến app, modal, tải tệp lên.
- Email: xác thực Gmail và phân luồng tin nhắn bằng `gog` khi connector chưa đủ.
- WhatsApp: đăng nhập QR, nhận diện lại, gửi tin nhắn, phương tiện, phản ứng.
- Telegram: chặn theo nhắc đến nhóm, lệnh, phản ứng khi có.
- Matrix: phòng mã hóa, quan hệ luồng hoặc trả lời, tiếp tục sau khởi động lại.

Mỗi transport nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi. Các kịch bản trực quan tốn kém nên giữ ở chế độ chọn bật.

## Câu Hỏi Mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt quan sát nên dùng tài khoản Discord của con người, tài khoản kiểm thử, hay chỉ bằng chứng REST mà bot có thể đọc cho giai đoạn đầu?
- GitHub nên giữ artifact Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất Mantis thay vì chờ lệnh từ maintainer?
- Ảnh chụp màn hình có nên được biên tập ẩn hoặc cắt trước khi tải lên cho PR công khai không?
