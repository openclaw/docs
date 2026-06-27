---
read_when:
    - Xây dựng hoặc chạy QA trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm xác minh trước và sau cho một pull request
    - Thêm các kịch bản truyền tải trực tiếp cho Discord, Slack, WhatsApp hoặc các phương thức truyền tải khác
    - Gỡ lỗi các lượt chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh trực quan đầu cuối để tái hiện lỗi OpenClaw trên các phương tiện truyền tải trực tiếp, thu thập bằng chứng trước và sau, rồi đính kèm artifact vào PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-06-27T17:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw cho các lỗi cần runtime thực,
transport thực, và bằng chứng nhìn thấy được. Nó chạy một kịch bản trên một ref
đã biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref ứng viên,
và xuất bản phần so sánh dưới dạng artifact để maintainer có thể kiểm tra từ PR
hoặc từ lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cho chúng ta một lane đầu tiên có giá trị
cao: xác thực bot thật, kênh guild thật, reaction, thread, lệnh native, và UI
trình duyệt nơi con người có thể xác nhận trực quan những gì transport đã hiển thị.

## Mục tiêu

- Tái hiện lỗi từ một issue hoặc PR trên GitHub với cùng hình dạng transport mà
  người dùng thấy.
- Thu thập artifact **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Dùng oracle xác định bất cứ khi nào có thể, chẳng hạn như đọc reaction qua
  Discord REST hoặc kiểm tra transcript kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI nhìn thấy được.
- Chạy cục bộ từ CLI do agent điều khiển và chạy từ xa từ GitHub.
- Giữ đủ trạng thái máy để cứu hộ qua VNC khi đăng nhập, tự động hóa trình duyệt,
  hoặc xác thực provider bị kẹt.
- Đăng trạng thái ngắn gọn lên kênh Discord của operator khi lượt chạy bị chặn,
  cần hỗ trợ VNC thủ công, hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế unit test. Một lượt chạy Mantis thường nên trở thành
  một regression test nhỏ hơn sau khi đã hiểu bản sửa.
- Mantis không phải là cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin
  xác thực live, và dành riêng cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên cần con người trong vận hành bình thường. VNC thủ công là
  đường cứu hộ, không phải đường vận hành lý tưởng.
- Mantis không lưu secret thô trong artifact, log, ảnh chụp màn hình, báo cáo
  Markdown, hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong stack QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, adapter transport, schema bằng chứng, và
  CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness transport live, helper chụp trình duyệt, và
  writer artifact.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu entrypoint workflow từ xa và thời gian giữ artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh maintainer,
  dispatch workflow, và đăng bình luận PR cuối cùng.
- Các agent OpenClaw điều khiển Mantis qua Codex khi một kịch bản cần thiết lập
  agentic, gỡ lỗi, hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức transport trong OpenClaw, lập lịch máy trong
Crabbox, và phần keo workflow maintainer trong ClawSweeper.

## Hình dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi
reaction, và đường dẫn artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner trước và sau cục bộ chấp nhận hình dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tạo các worktree baseline và candidate tách rời dưới thư mục đầu ra,
cài đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi
ghi `baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md`. Với
kịch bản Discord đầu tiên, xác minh thành công nghĩa là trạng thái baseline là
`fail` và trạng thái candidate là `pass`.

Probe trước/sau thứ hai của Discord nhắm tới attachment trong thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Kịch bản đó đăng một tin nhắn cha bằng driver bot, tạo một thread Discord thật,
gọi action `message.thread-reply` của OpenClaw với `filePath` cục bộ trong repo,
rồi poll thread để tìm phản hồi SUT và tên file attachment. Ảnh chụp baseline
hiển thị phản hồi không có attachment; ảnh chụp candidate hiển thị attachment
`mantis-thread-report.md` như kỳ vọng.

Primitive VM/trình duyệt đầu tiên là smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó lease hoặc tái sử dụng một máy desktop Crabbox, khởi động trình duyệt nhìn
thấy được trong phiên VNC, chụp desktop, kéo artifact về thư mục đầu ra cục bộ,
và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng provider Hetzner vì đây
là provider đầu tiên có coverage desktop/VNC hoạt động trong lane Mantis. Ghi đè
bằng `--provider`, `--crabbox-bin`, hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy với một fleet Crabbox khác.

Các flag smoke desktop hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt nhìn thấy được.
- `--html-file <path>` render một artifact HTML cục bộ trong repo trong trình duyệt nhìn thấy được. Mantis dùng lựa chọn này để chụp timeline status-reaction Discord đã tạo thông qua một desktop Crabbox thật.
- `--browser-profile-dir <remote-path>` tái sử dụng Chrome user-data-dir từ xa để một desktop Mantis bền vững có thể duy trì đăng nhập giữa các lượt chạy. Dùng lựa chọn này cho profile viewer Discord Web chạy lâu dài.
- `--browser-profile-archive-env <name>` khôi phục một archive Chrome user-data-dir `.tgz` base64 từ biến môi trường có tên trước khi khởi chạy trình duyệt. Dùng lựa chọn này cho các witness đã đăng nhập như Discord Web. Biến môi trường mặc định là `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` điều khiển độ dài capture MP4. Dùng thời lượng dài hơn cho các ứng dụng web đã đăng nhập chậm cần thời gian ổn định.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo và đã pass mở để kiểm tra qua VNC. Theo mặc định, các lượt chạy thất bại sẽ giữ lease khi lease đó được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout`, và `--ttl` tinh chỉnh kích thước máy và vòng đời lease.

Đối với bằng chứng Discord Web, Mantis dùng một tài khoản viewer chuyên dụng
thay vì bot token. Kịch bản Discord API live vẫn là oracle: nó tạo thread thật,
gửi `thread-reply` của SUT, và kiểm tra attachment thông qua Discord REST. Khi
đặt `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, kịch bản cũng ghi một artifact
URL Discord Web. Khi đặt `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, nó để thread đó
tồn tại đủ lâu để trình duyệt đã đăng nhập mở và ghi lại.

Workflow GitHub mở URL thread candidate trong Discord Web, chụp ảnh màn hình,
ghi MP4, và tạo bản xem trước GIF đã cắt theo chuyển động khi tooling media của
Crabbox có sẵn. Nên dùng đường dẫn profile viewer bền vững được cấu hình qua
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, vì archive profile Chrome đầy đủ có
thể vượt giới hạn kích thước secret của GitHub. Với các profile nhỏ/bootstrap,
workflow cũng có thể khôi phục một archive `.tgz` base64 từ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Nếu không cấu hình nguồn profile
nào, workflow vẫn xuất bản ảnh chụp attachment baseline/candidate xác định và
ghi notice rằng witness Discord Web đã đăng nhập đã bị bỏ qua.

Primitive transport desktop đầy đủ đầu tiên là smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó lease hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào
VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt
VNC, chụp desktop nhìn thấy được, và sao chép cả artifact QA Slack lẫn ảnh chụp
VNC về thư mục đầu ra cục bộ. Đây là hình dạng Mantis đầu tiên trong đó Gateway
OpenClaw SUT và trình duyệt đều sống trong cùng một VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một OpenClaw home dùng một lần nhưng bền
vững tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode
cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng `38973`, và giữ
Chrome chạy trong phiên VNC. Đây là chế độ "để lại cho tôi một desktop Linux với
Slack và một claw đang chạy"; lane QA Slack bot-to-bot vẫn là mặc định khi bỏ qua
`--gateway-setup`.

Đầu vào bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho lane model từ xa. Nếu chỉ đặt
  `OPENAI_API_KEY` cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY`
  trước khi gọi Crabbox để cơ chế chuyển tiếp env `OPENCLAW_*` của Crabbox có thể
  mang nó vào VM.

Với `--gateway-setup --credential-source convex`, Mantis lease thông tin xác thực
Slack SUT từ pool dùng chung trước khi tạo VM và chuyển tiếp channel id đã lease,
Socket Mode app token, và bot token dưới dạng env runtime `OPENCLAW_MANTIS_SLACK_*`
bên trong desktop. Điều đó giữ cho workflow GitHub gọn: chúng chỉ cần secret
broker Convex, không cần token bot hoặc app Slack thô.

Các flag desktop Slack hữu ích:

- `--lease-id <cbx_...>` chạy lại trên một máy nơi operator đã đăng nhập Slack Web qua VNC.
- `--gateway-setup` khởi động một Gateway Slack OpenClaw bền vững trong VM thay vì chỉ chạy lane QA bot-to-bot.
- `--keep-lease` giữ VM Gateway mở để kiểm tra qua VNC sau khi thành công; `--no-keep-lease` dừng nó sau khi thu thập artifact.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi có SUT bot token.
- `--slack-channel-id <id>` điều khiển allowlist kênh Slack dùng bởi thiết lập Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` điều khiển profile Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, nên đăng nhập Slack Web thủ công sẽ tồn tại qua các lượt chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng pool thông tin xác thực dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model`, và `--fast` truyền tiếp vào lane live Slack.

Các lượt chạy checkpoint phê duyệt render snapshot tin nhắn Slack API thành PNG
checkpoint để có bằng chứng trực quan an toàn cho CI. `slack-desktop-smoke.png`
chỉ là bằng chứng của Slack Web khi lease dùng một profile trình duyệt đã làm
nóng và đã đăng nhập.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau
cho kịch bản thực đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: ref được kỳ vọng sẽ tái hiện hành vi chỉ queued.
- `candidate_ref`: ref được kỳ vọng sẽ hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree baseline và candidate riêng,
chạy `discord-status-reactions-tool-only` với từng worktree, và tải lên
`baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md` dưới dạng
artifact Actions. Nó cũng render HTML timeline của từng lane trong trình duyệt
desktop Crabbox và xuất bản các ảnh chụp VNC đó bên cạnh các PNG timeline xác
định trong bình luận PR. Cùng bình luận PR đó nhúng các bản xem trước GIF nhẹ đã
cắt theo chuyển động được tạo bởi `crabbox media preview`, liên kết tới các clip
MP4 đã cắt theo chuyển động tương ứng, và giữ các file MP4 desktop đầy đủ để
kiểm tra sâu. Ảnh chụp màn hình vẫn được nhúng inline để review nhanh. Workflow
build CLI Crabbox từ `openclaw/crabbox` main để có thể dùng các flag lease
desktop/trình duyệt hiện tại trước khi bản phát hành binary Crabbox tiếp theo
được cắt.

`Mantis Scenario` là điểm vào thủ công chung. Nó nhận `scenario_id`,
`candidate_ref`, `baseline_ref` tùy chọn và `pr_number` tùy chọn, rồi
điều phối workflow do kịch bản sở hữu. Wrapper này được cố ý giữ mỏng:
các workflow kịch bản vẫn sở hữu phần thiết lập transport, thông tin xác thực,
lớp VM, oracle kỳ vọng và manifest artifact.

`Mantis Slack Desktop Smoke` là workflow VM Slack đầu tiên. Nó checkout ref
ứng viên đáng tin cậy trong một worktree riêng, thuê một desktop Linux Crabbox,
chạy `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` trên ứng
viên đó, mở Slack Web trong trình duyệt VNC, ghi hình desktop, tạo bản xem trước
đã cắt theo chuyển động bằng `crabbox media preview`, tải lên toàn bộ thư mục
artifact, và tùy chọn đăng bình luận bằng chứng nội tuyến trên PR đích.
Mặc định lane này dùng AWS cho lease desktop và cung cấp input provider thủ công
để operator có thể chuyển sang Hetzner khi dung lượng AWS chậm hoặc không khả dụng.
Dùng lane này khi bạn muốn "một desktop Linux có Slack và một claw đang chạy"
thay vì chỉ một transcript Slack bot-với-bot.

`Mantis Telegram Live` bọc lane QA live Telegram hiện có trong cùng pipeline
bằng chứng PR. Nó checkout ref ứng viên đáng tin cậy trong một worktree riêng,
chạy `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, ghi manifest `mantis-evidence.json` từ tóm tắt QA
Telegram, `qa-evidence.json` và các artifact báo cáo, render HTML bằng chứng
đã biên tập qua trình duyệt desktop Crabbox, tạo GIF đã cắt theo chuyển động
bằng `crabbox media preview`, và đăng bình luận bằng chứng PR nội tuyến khi có
số PR. Lane này là hình ảnh bằng chứng QA chứ không phải bằng chứng Telegram Web
đã đăng nhập: Telegram Bot API cung cấp bằng chứng tin nhắn live ổn định, nhưng
trạng thái đăng nhập Telegram Web không bắt buộc cho tự động hóa Mantis thông thường.

`Mantis Telegram Desktop Proof` là wrapper agentic before/after cho Telegram
Desktop native. Maintainer có thể kích hoạt từ bình luận PR bằng
`@openclaw-mantis telegram desktop proof`, từ giao diện Actions với hướng dẫn
tự do, hoặc thông qua dispatcher chung `Mantis Scenario`. Workflow chuyển PR,
ref mốc cơ sở, ref ứng viên và hướng dẫn của maintainer cho Codex.
Agent đọc PR, quyết định hành vi hiển thị trên Telegram nào chứng minh thay đổi,
chạy lane bằng chứng Telegram Desktop Crabbox bằng người dùng thật cho mốc cơ sở
và ứng viên, lặp cho đến khi các GIF native hữu ích, ghi các artifact
`motionPreview` theo cặp vào `mantis-evidence.json`, tải bundle lên, và đăng
bảng bằng chứng PR 2 cột khi có số PR.

Để thiết lập Telegram desktop có con người tham gia, dùng trình dựng kịch bản:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Trình dựng thuê hoặc tái sử dụng một desktop Crabbox, cài đặt binary Telegram
Desktop native cho Linux, tùy chọn khôi phục archive phiên người dùng, cấu hình
OpenClaw bằng token bot SUT Telegram đã thuê, khởi động `openclaw gateway run`
trên cổng `38974`, đăng thông báo sẵn sàng từ driver-bot vào nhóm riêng đã thuê,
rồi chụp ảnh màn hình và MP4 từ desktop VNC đang hiển thị. Token bot không bao giờ
đăng nhập vào Telegram Desktop; nó chỉ cấu hình OpenClaw. Trình xem desktop là
một phiên người dùng Telegram riêng được khôi phục từ
`--telegram-profile-archive-env <name>` hoặc được tạo thủ công qua VNC và giữ
sống bằng `--keep-lease`.

Các flag hữu ích cho trình dựng Telegram desktop:

- `--lease-id <cbx_...>` chạy lại trên một VM nơi operator đã đăng nhập vào Telegram Desktop.
- `--telegram-profile-archive-env <name>` đọc archive hồ sơ Telegram Desktop `.tgz` dạng base64 từ biến env đó và khôi phục trước khi khởi chạy.
- `--telegram-profile-dir <remote-path>` điều khiển thư mục hồ sơ Telegram Desktop từ xa. Mặc định là `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` cài đặt và mở Telegram Desktop mà không cấu hình OpenClaw.
- `--credential-source convex --credential-role ci` dùng broker thông tin xác thực dùng chung thay vì token env Telegram trực tiếp.

Mọi kịch bản xuất bản PR đều ghi `mantis-evidence.json` cạnh báo cáo của nó.
Schema này là điểm bàn giao giữa mã kịch bản và bình luận GitHub:

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

Giá trị `path` của artifact là đường dẫn tương đối với thư mục manifest.
Giá trị `targetPath` là đường dẫn tương đối dưới prefix artifact Mantis R2/S3
đã cấu hình. Publisher từ chối path traversal và bỏ qua các mục được đánh dấu
`"required": false` khi bản xem trước hoặc video tùy chọn không khả dụng.

Các loại artifact được hỗ trợ:

- `timeline`: ảnh chụp màn hình kịch bản xác định, thường là before/after.
- `desktopScreenshot`: ảnh chụp màn hình desktop VNC/trình duyệt.
- `motionPreview`: GIF động nội tuyến được tạo từ bản ghi desktop.
- `motionClip`: MP4 đã cắt theo chuyển động, loại bỏ phần tĩnh đầu và cuối.
- `fullVideo`: bản ghi MP4 đầy đủ để kiểm tra sâu.
- `metadata`: sidecar JSON/log.
- `report`: báo cáo Markdown.

Publisher tái sử dụng là `scripts/mantis/publish-pr-evidence.mjs`. Các workflow
gọi nó với manifest, PR đích, gốc đích artifact, marker bình luận, URL artifact
Actions, URL run và nguồn yêu cầu. Nó tải các artifact đã khai báo lên bucket
Mantis R2/S3 đã cấu hình, xây dựng bình luận PR ưu tiên tóm tắt với hình ảnh/bản
xem trước nội tuyến và video được liên kết, rồi cập nhật bình luận marker hiện có
hoặc tạo bình luận mới. Các workflow xuất bản lên `openclaw-crabbox-artifacts`
với URL công khai dưới `https://artifacts.openclaw.ai`. Chúng cung cấp trực tiếp
các giá trị bucket, region và URL công khai. Publisher tái sử dụng yêu cầu:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Bạn cũng có thể kích hoạt trực tiếp lượt chạy status-reactions từ bình luận PR:

```text
@openclaw-mantis discord status reactions
```

Trigger bằng bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull
request từ người dùng có quyền write, maintain hoặc admin, và chỉ nhận diện các
yêu cầu phản ứng trạng thái Discord. Mặc định nó dùng ref mốc cơ sở đã biết là
xấu và SHA head hiện tại của PR làm ứng viên. Maintainer có thể ghi đè một trong
hai ref:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA live Telegram cũng có thể được kích hoạt từ bình luận PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Mặc định nó dùng SHA head hiện tại của PR làm ứng viên và chạy
`telegram-status-command`. Maintainer có thể ghi đè `candidate=...`,
`provider=aws|hetzner` và `lease=<cbx_...>` khi cần một ref cụ thể hoặc một
desktop Crabbox đã được làm nóng trước.

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh
xạ một PR hoặc issue tới các kịch bản Mantis được đề xuất từ nhãn, tệp đã thay
đổi và phát hiện review của ClawSweeper.

## Vòng đời chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng một VM.
3. Chuẩn bị hồ sơ desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị một checkout sạch cho ref mốc cơ sở.
5. Cài đặt dependency và chỉ build những gì kịch bản cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình transport live, provider, model và hồ sơ trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng mốc cơ sở.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref ứng viên trong cùng VM.
11. Chạy cùng kịch bản đó và thu thập bằng chứng ứng viên.
12. So sánh kết quả oracle và bằng chứng hình ảnh.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình và artifact trace tùy chọn.
14. Tải lên artifact GitHub Actions.
15. Đăng thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản nên có thể thất bại theo hai cách khác nhau:

- **Tái hiện lỗi**: mốc cơ sở thất bại theo cách kỳ vọng.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt hoặc
  provider thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách biệt các trường hợp này để maintainer không nhầm lẫn
một môi trường chập chờn với hành vi sản phẩm.

## MVP Discord

Kịch bản đầu tiên nên nhắm tới phản ứng trạng thái Discord trong các kênh guild
nơi chế độ gửi phản hồi nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó kiểm tra một OpenClaw Gateway thật, xác thực bot Discord, điều phối tin nhắn,
  chế độ gửi phản hồi nguồn, trạng thái phản ứng trạng thái và vòng đời lượt model.
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

Bằng chứng mốc cơ sở nên cho thấy phản ứng xác nhận đã xếp hàng nhưng không có
chuyển tiếp vòng đời ở chế độ tool-only. Bằng chứng ứng viên nên cho thấy phản ứng
trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được bật rõ ràng.

Lát cắt có thể thực thi đầu tiên là kịch bản QA live Discord opt-in:

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
"message_tool"`, `ackReaction: "👀"` và phản ứng trạng thái rõ ràng. Oracle
poll tin nhắn kích hoạt Discord thật và kỳ vọng chuỗi quan sát được
`👀 -> 🤔 -> 👍`. Artifact bao gồm `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` và
`discord-status-reactions-tool-only-timeline.png`.

## Các thành phần QA hiện có

Mantis nên xây dựng trên stack QA riêng hiện có thay vì bắt đầu từ số không:

- `pnpm openclaw qa discord` đã chạy một lane Discord live với driver và bot SUT.
- Runner transport live đã ghi báo cáo, bằng chứng QA và artifact theo transport
  dưới `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông
  tin xác thực transport live dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot,
  hồ sơ được quản lý headless và hồ sơ CDP từ xa.
- QA Lab đã có UI debugger và bus cho kiểm thử theo dạng transport.

Triển khai Mantis đầu tiên có thể là một runner before/after mỏng trên các thành
phần này, cộng thêm một lớp bằng chứng hình ảnh.

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

`mantis-summary.json` phải là nguồn sự thật có thể đọc bằng máy. Báo cáo
Markdown dùng cho bình luận PR và rà soát của con người.

Bản tóm tắt phải bao gồm:

- refs và SHA đã kiểm thử
- transport và scenario id
- nhà cung cấp máy và machine id hoặc lease id
- nguồn thông tin xác thực không kèm giá trị bí mật
- kết quả baseline
- kết quả candidate
- lỗi có tái hiện trên baseline hay không
- candidate có sửa được lỗi hay không
- đường dẫn artifact
- sự cố thiết lập hoặc dọn dẹp đã được làm sạch dữ liệu nhạy cảm

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Chúng vẫn cần kỷ luật biên tập:
tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Với PR công khai,
ưu tiên liên kết artifact của GitHub Actions thay vì ảnh nội tuyến cho đến khi quy trình biên tập
mạnh hơn.

## Trình duyệt và VNC

Lane trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và
  Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: được bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord
  hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền để tránh
đăng nhập cho mỗi lần chạy, nhưng được cô lập khỏi trạng thái trình duyệt cá nhân. Một hồ sơ
thuộc về nhóm máy Mantis, không thuộc laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng một tin nhắn trạng thái Discord với:

- run id
- scenario id
- nhà cung cấp máy
- thư mục artifact
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn mô tả điểm chặn

Triển khai riêng tư đầu tiên có thể đăng các tin nhắn này vào kênh operator
hiện có rồi chuyển sang một kênh Mantis chuyên dụng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên.
Crabbox cung cấp máy đã được làm nóng, theo dõi lease, hydration, nhật ký, kết quả và
dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, thêm một nhà cung cấp Hetzner
phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có cài đặt Chrome hoặc Chromium hỗ trợ desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và bộ nhớ đệm phụ thuộc
- bộ nhớ đệm trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt và một lần chạy mô hình
- quyền truy cập outbound tới Discord, GitHub, nhà cung cấp mô hình và credential broker

VM không nên giữ bí mật thô dài hạn bên ngoài các kho thông tin xác thực hoặc
hồ sơ trình duyệt dự kiến.

## Bí mật

Bí mật nằm trong GitHub organization hoặc repository secrets cho các lần chạy từ xa, và trong
một tệp bí mật cục bộ do operator kiểm soát cho các lần chạy cục bộ.

Tên bí mật được khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho tải artifact GitHub công khai lên
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Về dài hạn, nhóm thông tin xác thực Convex nên vẫn là nguồn thông thường cho thông tin xác thực
transport trực tiếp. GitHub secrets khởi động broker và các lane fallback.
Quy trình status-reactions của Discord ánh xạ các bí mật Mantis Crabbox trở lại
các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN`
mà Crabbox CLI mong đợi. Tên GitHub secret `CRABBOX_*` thuần vẫn được
chấp nhận làm fallback tương thích.

Mantis runner không bao giờ được in:

- token bot Discord
- khóa API nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Các bản tải lên hiện vật công khai cũng phải biên tập lại siêu dữ liệu đích của Discord như bot,
guild, channel và message ids. Workflow smoke của GitHub bật
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu một token bị dán nhầm vào issue, PR, chat hoặc log, hãy xoay vòng token đó
sau khi secret mới đã được lưu trữ.

## Hiện vật GitHub và bình luận PR

Các workflow Mantis phải tải lên toàn bộ gói bằng chứng dưới dạng hiện vật Actions
có thời hạn ngắn. Khi workflow được chạy cho một báo cáo lỗi hoặc PR sửa lỗi, nó cũng phải
xuất bản media nội tuyến đã được biên tập lại lên bucket Mantis R2/S3 đã cấu hình và upsert một
bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau nội tuyến. Không đăng
bằng chứng chính chỉ trên một PR tự động hóa QA chung. Log thô, thông báo quan sát được
và các bằng chứng cồng kềnh khác nằm trong hiện vật Actions.

Các workflow production phải đăng các bình luận đó bằng Mantis GitHub App, không phải
bằng `github-actions[bot]`. Lưu app id và private key dưới dạng
secret GitHub Actions `MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow dùng một marker ẩn làm khóa upsert, cập nhật
bình luận đó khi token có thể chỉnh sửa nó, và tạo một bình luận mới do Mantis sở hữu khi
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
hàm ý rằng candidate đã thất bại.

## Ghi chú triển khai riêng tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Hãy tái sử dụng
ứng dụng đó thay vì tạo app khác khi nó có đúng quyền bot
và có thể được xoay vòng an toàn.

Thiết lập kênh thông báo ban đầu cho operator thông qua secret hoặc cấu hình
triển khai. Trước tiên, kênh này có thể trỏ tới một kênh maintainer hoặc vận hành hiện có,
rồi chuyển sang một kênh Mantis chuyên dụng sau khi kênh đó tồn tại.

Không đặt guild ids, channel ids, bot tokens, browser cookies hoặc VNC passwords
trong tài liệu này. Lưu chúng trong GitHub secrets, credential broker hoặc kho secret cục bộ
của operator.

## Thêm một kịch bản

Một kịch bản Mantis phải khai báo:

- id và tiêu đề
- transport
- thông tin xác thực bắt buộc
- chính sách baseline ref
- chính sách candidate ref
- bản vá cấu hình OpenClaw
- các bước thiết lập
- stimulus
- oracle baseline kỳ vọng
- oracle candidate kỳ vọng
- mục tiêu chụp trực quan
- ngân sách timeout
- các bước cleanup

Các kịch bản nên ưu tiên oracle nhỏ, có kiểu:

- Trạng thái reaction Discord cho lỗi reaction
- Tham chiếu message Discord cho lỗi threading
- thread ts và trạng thái API reaction của Slack cho lỗi Slack
- message ids và headers của email cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là quan sát đáng tin cậy duy nhất

Kiểm tra bằng thị giác nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng
API làm oracle pass/fail và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở rộng provider

Sau Discord, cùng runner đó có thể thêm:

- Slack: reactions, threads, app mentions, modals, file uploads.
- Email: xác thực Gmail và threading message bằng `gog` khi connector không
  đủ.
- WhatsApp: đăng nhập QR, tái định danh, gửi message, media, reactions.
- Telegram: chặn group mention, commands, reactions khi có sẵn.
- Matrix: phòng được mã hóa, quan hệ thread hoặc reply, resume sau restart.

Mỗi transport nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi.
Các kịch bản trực quan tốn kém nên để opt-in.

## Câu hỏi mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi
  bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt observer nên dùng tài khoản Discord của con người, tài khoản test,
  hay chỉ bằng chứng REST mà bot đọc được cho giai đoạn đầu?
- GitHub nên lưu giữ hiện vật Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất Mantis thay vì chờ
  lệnh maintainer?
- Ảnh chụp màn hình nên được biên tập lại hay cắt trước khi tải lên cho PR công khai?
