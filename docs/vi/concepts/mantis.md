---
read_when:
    - Xây dựng hoặc chạy QA trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo
    - Thêm Discord, Slack, WhatsApp hoặc các kịch bản truyền tải trực tiếp khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh đầu-cuối trực quan để tái hiện lỗi OpenClaw trên các phương thức truyền tải trực tiếp, ghi lại bằng chứng trước và sau, và đính kèm các tạo tác vào PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-11T20:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw dành cho các lỗi cần runtime thật, transport thật và bằng chứng có thể nhìn thấy. Hệ thống chạy một kịch bản trên một ref đã biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref ứng viên, rồi xuất bản phần so sánh dưới dạng artifact để maintainer có thể kiểm tra từ PR hoặc từ một lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cung cấp cho chúng ta lane đầu tiên có giá trị cao: xác thực bot thật, kênh guild thật, reaction, thread, lệnh native, và UI trình duyệt nơi con người có thể xác nhận trực quan những gì transport đã hiển thị.

## Mục tiêu

- Tái hiện lỗi từ một GitHub issue hoặc PR với cùng hình dạng transport mà người dùng thấy.
- Thu thập artifact **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Sử dụng oracle xác định bất cứ khi nào có thể, chẳng hạn như đọc reaction bằng Discord REST hoặc kiểm tra transcript kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI nhìn thấy được.
- Chạy cục bộ từ CLI do agent điều khiển và chạy từ xa từ GitHub.
- Giữ đủ trạng thái máy để cứu hộ qua VNC khi đăng nhập, tự động hóa trình duyệt hoặc xác thực provider bị kẹt.
- Đăng trạng thái ngắn gọn lên một kênh Discord của operator khi lượt chạy bị chặn, cần trợ giúp VNC thủ công, hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế kiểm thử đơn vị. Một lượt chạy Mantis thường nên trở thành một kiểm thử hồi quy nhỏ hơn sau khi bản sửa đã được hiểu rõ.
- Mantis không phải cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin xác thực live, và được dành cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên yêu cầu con người trong vận hành thông thường. VNC thủ công là đường cứu hộ, không phải happy path.
- Mantis không lưu secret thô trong artifact, log, ảnh chụp màn hình, báo cáo Markdown hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong stack QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, adapter transport, schema bằng chứng, và CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness transport live, helper chụp trình duyệt, và trình ghi artifact.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu entrypoint workflow từ xa và thời gian lưu giữ artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh của maintainer, dispatch workflow, và đăng bình luận PR cuối cùng.
- Các agent OpenClaw điều khiển Mantis thông qua Codex khi một kịch bản cần thiết lập agentic, gỡ lỗi, hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức transport trong OpenClaw, điều phối máy trong Crabbox, và phần keo workflow maintainer trong ClawSweeper.

## Dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi reaction, và đường dẫn artifact:

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

Runner tạo các worktree baseline và ứng viên đã tách rời dưới thư mục đầu ra, cài đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi `baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md`. Với kịch bản Discord đầu tiên, xác minh thành công nghĩa là trạng thái baseline là `fail` và trạng thái ứng viên là `pass`.

Probe trước/sau thứ hai của Discord nhắm đến attachment trong thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Kịch bản đó đăng một tin nhắn cha bằng bot driver, tạo một thread Discord thật, gọi action `message.thread-reply` của OpenClaw với `filePath` cục bộ trong repo, rồi poll thread để tìm reply SUT và tên tệp attachment. Ảnh chụp màn hình baseline hiển thị reply không có attachment; ảnh chụp màn hình ứng viên hiển thị attachment `mantis-thread-report.md` như mong đợi.

Primitive VM/trình duyệt đầu tiên là desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó lease hoặc tái sử dụng một máy desktop Crabbox, khởi động trình duyệt nhìn thấy được bên trong phiên VNC, chụp desktop, kéo artifact về thư mục đầu ra cục bộ, và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng provider Hetzner vì đây là provider đầu tiên có coverage desktop/VNC hoạt động trong lane Mantis. Ghi đè bằng `--provider`, `--crabbox-bin`, hoặc `OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy trên fleet Crabbox khác.

Các flag desktop smoke hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt nhìn thấy được.
- `--html-file <path>` render một artifact HTML cục bộ trong repo bằng trình duyệt nhìn thấy được. Mantis dùng tùy chọn này để chụp timeline Discord status-reaction đã tạo qua desktop Crabbox thật.
- `--browser-profile-dir <remote-path>` tái sử dụng Chrome user-data-dir từ xa để một desktop Mantis bền vững có thể duy trì đăng nhập giữa các lượt chạy. Dùng tùy chọn này cho profile trình xem Discord Web chạy lâu dài.
- `--browser-profile-archive-env <name>` khôi phục archive Chrome user-data-dir `.tgz` base64 từ biến môi trường đã đặt tên trước khi khởi chạy trình duyệt. Dùng tùy chọn này cho các witness đã đăng nhập như Discord Web. Biến env mặc định là `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` kiểm soát độ dài chụp MP4. Dùng thời lượng dài hơn cho các ứng dụng web đã đăng nhập chậm cần thời gian ổn định.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo và đã pass ở trạng thái mở để kiểm tra qua VNC. Lượt chạy thất bại mặc định giữ lease khi lease được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout`, và `--ttl` tinh chỉnh kích thước máy và vòng đời lease.

Đối với bằng chứng Discord Web, Mantis dùng một tài khoản viewer chuyên dụng thay vì bot token. Kịch bản Discord API live vẫn là oracle: nó tạo thread thật, gửi `thread-reply` SUT, và kiểm tra attachment qua Discord REST. Khi đặt `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, kịch bản cũng ghi artifact URL Discord Web. Khi đặt `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, nó giữ thread đó tồn tại đủ lâu để một trình duyệt đã đăng nhập có thể mở và ghi lại.

Workflow GitHub mở URL thread ứng viên trong Discord Web, chụp ảnh màn hình, ghi MP4, và tạo bản xem trước GIF đã cắt theo chuyển động khi tooling media của Crabbox có sẵn. Ưu tiên đường dẫn profile viewer bền vững được cấu hình qua `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, vì archive profile Chrome đầy đủ có thể vượt quá giới hạn kích thước secret của GitHub. Với các profile nhỏ/bootstrap, workflow cũng có thể khôi phục archive `.tgz` base64 từ `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Nếu không cấu hình nguồn profile nào, workflow vẫn xuất bản ảnh chụp màn hình attachment baseline/ứng viên xác định và ghi notice rằng witness Discord Web đã đăng nhập đã bị bỏ qua.

Primitive transport desktop đầy đủ đầu tiên là Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó lease hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt VNC, chụp desktop nhìn thấy được, và sao chép cả artifact Slack QA lẫn ảnh chụp VNC về thư mục đầu ra cục bộ. Đây là hình dạng Mantis đầu tiên mà Gateway OpenClaw SUT và trình duyệt đều nằm trong cùng một VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một home OpenClaw dùng một lần nhưng bền vững tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng `38973`, và giữ Chrome chạy trong phiên VNC. Đây là chế độ “để lại cho tôi một desktop Linux có Slack và một claw đang chạy”; lane Slack QA bot-to-bot vẫn là mặc định khi bỏ qua `--gateway-setup`.

Đầu vào bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho lane model từ xa. Nếu chỉ đặt `OPENAI_API_KEY` cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY` trước khi gọi Crabbox để chuyển tiếp env `OPENCLAW_*` của Crabbox có thể đưa nó vào VM.

Với `--gateway-setup --credential-source convex`, Mantis lease thông tin xác thực Slack SUT từ pool dùng chung trước khi tạo VM và chuyển tiếp id kênh đã lease, app token Socket Mode, và bot token dưới dạng env runtime `OPENCLAW_MANTIS_SLACK_*` bên trong desktop. Điều đó giữ cho workflow GitHub mỏng: chúng chỉ cần secret broker Convex, không cần token bot hoặc app Slack thô.

Các flag Slack desktop hữu ích:

- `--lease-id <cbx_...>` chạy lại trên máy nơi operator đã đăng nhập Slack Web qua VNC.
- `--gateway-setup` khởi động Gateway Slack OpenClaw bền vững trong VM thay vì chỉ chạy lane QA bot-to-bot.
- `--keep-lease` giữ VM Gateway ở trạng thái mở để kiểm tra qua VNC sau khi thành công; `--no-keep-lease` dừng VM sau khi thu thập artifact.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi có sẵn bot token SUT.
- `--slack-channel-id <id>` kiểm soát allowlist kênh Slack được dùng bởi thiết lập Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kiểm soát profile Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, nên một lần đăng nhập Slack Web thủ công sẽ sống sót qua các lượt chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng pool thông tin xác thực dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model`, và `--fast` truyền tiếp sang lane live Slack.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau cho kịch bản thực đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: ref dự kiến tái hiện hành vi chỉ queued.
- `candidate_ref`: ref dự kiến hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree baseline và ứng viên riêng biệt, chạy `discord-status-reactions-tool-only` trên từng worktree, và tải lên `baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md` dưới dạng artifact Actions. Nó cũng render HTML timeline của từng lane trong trình duyệt desktop Crabbox và xuất bản các ảnh chụp màn hình VNC đó cạnh các PNG timeline xác định trong bình luận PR. Cùng bình luận PR đó nhúng các bản xem trước GIF nhẹ đã cắt theo chuyển động được tạo bởi `crabbox media preview`, liên kết tới các clip MP4 đã cắt theo chuyển động tương ứng, và giữ các tệp MP4 desktop đầy đủ để kiểm tra sâu. Ảnh chụp màn hình vẫn hiển thị inline để review nhanh. Workflow build CLI Crabbox từ main của `openclaw/crabbox` để có thể dùng các flag lease desktop/trình duyệt hiện tại trước khi bản phát hành binary Crabbox tiếp theo được cắt.

`Mantis Scenario` là entrypoint thủ công dùng chung. Nó nhận `scenario_id`, `candidate_ref`, `baseline_ref` tùy chọn, và `pr_number` tùy chọn, rồi dispatch workflow do kịch bản sở hữu. Wrapper này cố ý mỏng: các workflow kịch bản vẫn sở hữu thiết lập transport, thông tin xác thực, lớp VM, oracle kỳ vọng, và manifest artifact.

`Mantis Slack Desktop Smoke` là quy trình VM Slack đầu tiên. Quy trình này checkout ref ứng viên đáng tin cậy trong một worktree riêng, thuê một desktop Linux Crabbox, chạy `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` trên ứng viên đó, mở Slack Web trong trình duyệt VNC, ghi lại desktop, tạo bản xem trước đã cắt theo chuyển động bằng `crabbox media preview`, tải lên toàn bộ thư mục artifact, và tùy chọn đăng bình luận bằng chứng nội tuyến trên PR mục tiêu. Mặc định quy trình này dùng AWS cho lease desktop và cung cấp một input provider thủ công để người vận hành có thể chuyển sang Hetzner khi dung lượng AWS chậm hoặc không khả dụng. Dùng lane này khi bạn muốn "một desktop Linux có Slack và một claw đang chạy" thay vì chỉ một transcript Slack bot-đến-bot.

`Mantis Telegram Live` bọc lane QA live Telegram hiện có trong cùng pipeline bằng chứng PR. Quy trình này checkout ref ứng viên đáng tin cậy trong một worktree riêng, chạy `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, ghi manifest `mantis-evidence.json` từ tóm tắt QA Telegram và artifact tin nhắn đã quan sát, render transcript HTML đã biên tập qua trình duyệt desktop Crabbox, tạo GIF đã cắt theo chuyển động bằng `crabbox media preview`, và đăng bình luận bằng chứng PR nội tuyến khi có số PR. Lane này là hình ảnh transcript chứ không phải bằng chứng Telegram Web đã đăng nhập: Telegram Bot API cung cấp bằng chứng tin nhắn live ổn định, nhưng trạng thái đăng nhập Telegram Web không bắt buộc cho tự động hóa Mantis thông thường.

`Mantis Telegram Desktop Proof` là wrapper agentic trước/sau cho Telegram Desktop native. Maintainer có thể kích hoạt từ bình luận PR bằng `@Mantis telegram desktop proof`, từ Actions UI với hướng dẫn tự do, hoặc qua dispatcher `Mantis Scenario` chung. Workflow giao PR, ref baseline, ref ứng viên, và hướng dẫn của maintainer cho Codex. Agent đọc PR, quyết định hành vi hiển thị trong Telegram nào chứng minh thay đổi, chạy lane bằng chứng Telegram Desktop Crabbox người dùng thật cho baseline và ứng viên, lặp cho đến khi các GIF native hữu ích, ghi các artifact `motionPreview` theo cặp vào `mantis-evidence.json`, tải lên bundle, và đăng bảng bằng chứng PR 2 cột khi có số PR.

Để thiết lập Telegram desktop có con người tham gia, dùng trình tạo scenario:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Trình tạo thuê hoặc tái sử dụng một desktop Crabbox, cài đặt binary Telegram Desktop Linux native, tùy chọn khôi phục archive phiên người dùng, cấu hình OpenClaw bằng token bot SUT Telegram đã thuê, khởi động `openclaw gateway run` trên cổng `38974`, đăng thông báo sẵn sàng của driver-bot vào nhóm riêng đã thuê, rồi chụp ảnh màn hình và MP4 từ desktop VNC đang hiển thị. Token bot không bao giờ đăng nhập vào Telegram Desktop; nó chỉ cấu hình OpenClaw. Trình xem desktop là một phiên người dùng Telegram riêng biệt được khôi phục từ `--telegram-profile-archive-env <name>` hoặc tạo thủ công qua VNC và giữ hoạt động bằng `--keep-lease`.

Các cờ hữu ích của trình tạo Telegram desktop:

- `--lease-id <cbx_...>` chạy lại trên VM nơi người vận hành đã đăng nhập vào Telegram Desktop.
- `--telegram-profile-archive-env <name>` đọc archive hồ sơ Telegram Desktop `.tgz` dạng base64 từ biến môi trường đó và khôi phục trước khi khởi chạy.
- `--telegram-profile-dir <remote-path>` điều khiển thư mục hồ sơ Telegram Desktop từ xa. Mặc định là `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` cài đặt và mở Telegram Desktop mà không cấu hình OpenClaw.
- `--credential-source convex --credential-role ci` dùng broker thông tin xác thực dùng chung thay vì token môi trường Telegram trực tiếp.

Mọi scenario xuất bản PR đều ghi `mantis-evidence.json` cạnh báo cáo của nó. Schema này là điểm bàn giao giữa mã scenario và bình luận GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Giá trị `path` của artifact là tương đối so với thư mục manifest. Giá trị `targetPath` là đường dẫn tương đối bên dưới thư mục xuất bản đích nhánh `qa-artifacts`. Publisher từ chối path traversal và bỏ qua các mục được đánh dấu `"required": false` khi bản xem trước hoặc video tùy chọn không khả dụng.

Các loại artifact được hỗ trợ:

- `timeline`: ảnh chụp màn hình scenario xác định, thường là trước/sau.
- `desktopScreenshot`: ảnh chụp màn hình desktop VNC/trình duyệt.
- `motionPreview`: GIF động nội tuyến được tạo từ bản ghi desktop.
- `motionClip`: MP4 đã cắt theo chuyển động, loại bỏ phần tĩnh đầu và cuối.
- `fullVideo`: bản ghi MP4 đầy đủ để kiểm tra sâu.
- `metadata`: sidecar JSON/log.
- `report`: báo cáo Markdown.

Publisher có thể tái sử dụng là `scripts/mantis/publish-pr-evidence.mjs`. Workflow gọi nó bằng manifest, PR mục tiêu, root đích `qa-artifacts`, marker bình luận, URL artifact Actions, URL run, và nguồn yêu cầu. Nó sao chép các artifact đã khai báo sang nhánh `qa-artifacts`, xây dựng bình luận PR ưu tiên tóm tắt với hình ảnh/bản xem trước nội tuyến và video được liên kết, rồi cập nhật bình luận marker hiện có hoặc tạo bình luận mới.

Bạn cũng có thể kích hoạt lượt chạy status-reactions trực tiếp từ bình luận PR:

```text
@Mantis discord status reactions
```

Trigger bình luận được cố ý thu hẹp. Nó chỉ chạy trên bình luận pull request từ người dùng có quyền write, maintain, hoặc admin, và chỉ nhận diện yêu cầu phản ứng trạng thái Discord. Theo mặc định, nó dùng ref baseline xấu đã biết và SHA head PR hiện tại làm ứng viên. Maintainer có thể ghi đè một trong hai ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA live Telegram cũng có thể được kích hoạt từ bình luận PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Theo mặc định, nó dùng SHA head PR hiện tại làm ứng viên và chạy `telegram-status-command`. Maintainer có thể ghi đè `candidate=...`, `provider=aws|hetzner`, và `lease=<cbx_...>` khi cần một ref cụ thể hoặc một desktop Crabbox đã được làm nóng trước.

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào scenario. Lệnh thứ hai về sau có thể ánh xạ PR hoặc issue tới các scenario Mantis được đề xuất từ label, file đã thay đổi, và phát hiện review của ClawSweeper.

## Vòng đời chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng VM.
3. Chuẩn bị hồ sơ desktop/trình duyệt khi scenario cần bằng chứng UI.
4. Chuẩn bị checkout sạch cho ref baseline.
5. Cài đặt dependency và chỉ build những gì scenario cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình transport live, provider, model, và hồ sơ trình duyệt.
8. Chạy scenario và thu thập bằng chứng baseline.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref ứng viên trong cùng VM.
11. Chạy cùng scenario và thu thập bằng chứng ứng viên.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình, và artifact trace tùy chọn.
14. Tải lên artifact GitHub Actions.
15. Đăng thông báo trạng thái PR hoặc Discord ngắn gọn.

Scenario phải có thể thất bại theo hai cách khác nhau:

- **Đã tái hiện lỗi**: baseline thất bại theo cách mong đợi.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt, hoặc provider thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối phải tách riêng các trường hợp này để maintainer không nhầm lẫn môi trường flaky với hành vi sản phẩm.

## Discord MVP

Scenario đầu tiên nên nhắm tới phản ứng trạng thái Discord trong các kênh guild nơi chế độ gửi trả lời nguồn là `message_tool_only`.

Lý do đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó kiểm tra OpenClaw Gateway thật, xác thực bot Discord, điều phối tin nhắn, chế độ gửi trả lời nguồn, trạng thái phản ứng trạng thái, và vòng đời lượt model.
- Nó đủ hẹp để giữ cho triển khai đầu tiên trung thực.

Hình dạng scenario mong đợi:

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

Bằng chứng baseline nên cho thấy phản ứng xác nhận đã xếp hàng nhưng không có chuyển tiếp vòng đời trong chế độ tool-only. Bằng chứng ứng viên nên cho thấy phản ứng trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được bật rõ ràng.

Lát cắt thực thi đầu tiên là scenario QA live Discord opt-in:

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
"message_tool"`, `ackReaction: "👀"`, và phản ứng trạng thái rõ ràng. Oracle poll tin nhắn kích hoạt Discord thật và mong đợi chuỗi quan sát được `👀 -> 🤔 -> 👍`. Artifact bao gồm `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, và `discord-status-reactions-tool-only-timeline.png`.

## Các phần QA hiện có

Mantis nên xây dựng dựa trên stack QA riêng hiện có thay vì bắt đầu từ số không:

- `pnpm openclaw qa discord` đã chạy một lane Discord live với driver và bot SUT.
- Runner transport live đã ghi báo cáo và artifact tin nhắn đã quan sát dưới `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực transport live dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot, hồ sơ được quản lý headless, và hồ sơ CDP từ xa.
- QA Lab đã có debugger UI và bus cho kiểm thử theo dạng transport.

Triển khai Mantis đầu tiên có thể là một runner trước/sau mỏng trên các phần này, cộng thêm một lớp bằng chứng trực quan.

## Mô hình bằng chứng

Mỗi lượt chạy ghi một thư mục artifact ổn định:

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

`mantis-summary.json` nên là nguồn sự thật có thể đọc bằng máy. Báo cáo Markdown dành cho bình luận PR và review của con người.

Tóm tắt phải bao gồm:

- ref và SHA đã kiểm thử
- transport và id scenario
- provider máy và id máy hoặc id lease
- nguồn thông tin xác thực không có giá trị bí mật
- kết quả baseline
- kết quả ứng viên
- lỗi có được tái hiện trên baseline hay không
- ứng viên có sửa lỗi hay không
- đường dẫn artifact
- vấn đề thiết lập hoặc dọn dẹp đã được làm sạch

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Tuy vậy, vẫn cần kỷ luật biên tập che thông tin:
tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Đối với PR công khai,
ưu tiên liên kết hiện vật GitHub Actions hơn hình ảnh nhúng trực tiếp cho đến khi quy trình biên tập che thông tin
chặt chẽ hơn.

## Trình duyệt và VNC

Lane trình duyệt có hai chế độ:

- **Tự động hóa không giao diện**: mặc định cho CI. Chrome chạy với CDP được bật, và
  Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: được bật trên cùng VM khi đăng nhập, MFA, cơ chế chống tự động hóa của Discord,
  hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền vững để tránh
phải đăng nhập cho mỗi lần chạy, nhưng được cô lập khỏi trạng thái trình duyệt cá nhân. Một hồ sơ
thuộc về nhóm máy Mantis, không thuộc về laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng một thông báo trạng thái Discord với:

- id lần chạy
- id kịch bản
- nhà cung cấp máy
- thư mục hiện vật
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn về điểm chặn

Triển khai riêng tư đầu tiên có thể đăng các thông báo này vào kênh điều hành viên
hiện có và chuyển sang một kênh Mantis chuyên dụng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên.
Crabbox cung cấp máy đã được làm nóng, theo dõi lease, hydration, nhật ký, kết quả và
dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, hãy thêm một nhà cung cấp Hetzner
phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có bản cài đặt Chrome hoặc Chromium hỗ trợ desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và bộ nhớ đệm phụ thuộc
- bộ nhớ đệm trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt và một lần chạy mô hình
- quyền truy cập outbound tới Discord, GitHub, các nhà cung cấp mô hình và broker thông tin xác thực

VM không nên lưu giữ bí mật thô dài hạn bên ngoài các kho thông tin xác thực hoặc
hồ sơ trình duyệt dự kiến.

## Bí mật

Bí mật nằm trong bí mật tổ chức hoặc kho lưu trữ GitHub cho các lần chạy từ xa, và trong
một tệp bí mật cục bộ do điều hành viên kiểm soát cho các lần chạy cục bộ.

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

Về dài hạn, nhóm thông tin xác thực Convex nên tiếp tục là nguồn thông thường cho thông tin xác thực
transport trực tiếp. Bí mật GitHub khởi tạo broker và các lane dự phòng.
Quy trình phản ứng trạng thái Discord ánh xạ các bí mật Mantis Crabbox trở lại
các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN`
mà Crabbox CLI mong đợi. Tên bí mật GitHub dạng thuần `CRABBOX_*` vẫn
được chấp nhận làm phương án dự phòng tương thích.

Runner Mantis tuyệt đối không được in:

- token bot Discord
- khóa API nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Tải lên hiện vật công khai cũng nên biên tập che siêu dữ liệu mục tiêu Discord như bot,
guild, kênh và id tin nhắn. Quy trình smoke GitHub bật
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu token vô tình bị dán vào issue, PR, chat hoặc nhật ký, hãy xoay vòng nó
sau khi bí mật mới đã được lưu.

## Hiện vật GitHub và bình luận PR

Quy trình Mantis nên tải lên toàn bộ gói bằng chứng dưới dạng một hiện vật Actions
ngắn hạn. Khi quy trình được chạy cho báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên
xuất bản ảnh chụp màn hình PNG đã biên tập che thông tin lên nhánh `qa-artifacts` và upsert một
bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau nhúng trực tiếp. Không đăng
bằng chứng chính chỉ trên một PR tự động hóa QA chung. Nhật ký thô, tin nhắn đã quan sát
và bằng chứng cồng kềnh khác vẫn nằm trong hiện vật Actions.

Quy trình production nên đăng các bình luận đó bằng Mantis GitHub App, không phải
bằng `github-actions[bot]`. Lưu app id và khóa riêng tư dưới dạng bí mật GitHub Actions
`MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Quy trình dùng một marker ẩn làm khóa upsert, cập nhật
bình luận đó khi token có thể chỉnh sửa nó, và tạo một bình luận mới do Mantis sở hữu khi
một marker cũ do bot sở hữu không thể chỉnh sửa.

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
ngụ ý rằng candidate thất bại.

## Ghi chú triển khai riêng tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng
ứng dụng đó thay vì tạo ứng dụng khác khi nó có đúng quyền bot
và có thể được xoay vòng an toàn.

Đặt kênh thông báo điều hành viên ban đầu thông qua bí mật hoặc cấu hình
triển khai. Ban đầu nó có thể trỏ tới một kênh maintainer hoặc vận hành hiện có,
sau đó chuyển sang một kênh Mantis chuyên dụng khi có kênh đó.

Không đưa guild id, channel id, bot token, cookie trình duyệt hoặc mật khẩu VNC
vào tài liệu này. Lưu chúng trong bí mật GitHub, broker thông tin xác thực hoặc kho bí mật cục bộ
của điều hành viên.

## Thêm một kịch bản

Một kịch bản Mantis nên khai báo:

- id và tiêu đề
- transport
- thông tin xác thực bắt buộc
- chính sách baseline ref
- chính sách candidate ref
- bản vá cấu hình OpenClaw
- bước thiết lập
- tác nhân kích thích
- oracle baseline kỳ vọng
- oracle candidate kỳ vọng
- mục tiêu chụp trực quan
- ngân sách timeout
- bước dọn dẹp

Kịch bản nên ưu tiên các oracle nhỏ, có kiểu:

- trạng thái phản ứng Discord cho lỗi phản ứng
- tham chiếu tin nhắn Discord cho lỗi threading
- thread ts Slack và trạng thái API phản ứng cho lỗi Slack
- id tin nhắn email và header cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất

Kiểm tra bằng thị giác nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng
API làm oracle đạt/không đạt và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở rộng nhà cung cấp

Sau Discord, cùng runner có thể thêm:

- Slack: phản ứng, thread, app mention, modal, tải tệp lên.
- Email: xác thực Gmail và threading tin nhắn bằng `gog` khi connector không
  đủ.
- WhatsApp: đăng nhập QR, định danh lại, gửi tin nhắn, phương tiện, phản ứng.
- Telegram: gating mention nhóm, lệnh, phản ứng khi có sẵn.
- Matrix: phòng được mã hóa, quan hệ thread hoặc reply, tiếp tục sau khởi động lại.

Mỗi transport nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi.
Các kịch bản trực quan đắt đỏ nên luôn là tùy chọn bật thủ công.

## Câu hỏi mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi bot Mantis
  hiện có được tái sử dụng?
- Đăng nhập trình duyệt quan sát nên dùng tài khoản Discord của con người, tài khoản thử nghiệm,
  hay chỉ bằng chứng REST mà bot có thể đọc cho giai đoạn đầu?
- GitHub nên giữ hiện vật Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động khuyến nghị Mantis thay vì chờ
  lệnh maintainer?
- Ảnh chụp màn hình có nên được biên tập che thông tin hoặc cắt trước khi tải lên cho PR công khai không?
