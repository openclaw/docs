---
read_when:
    - Xây dựng hoặc chạy quy trình kiểm thử trực quan trực tiếp cho các lỗi của OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo
    - Thêm các kịch bản truyền tải trực tiếp cho Discord, Slack, WhatsApp hoặc các nền tảng khác
    - Chạy quy trình kiểm chứng trình duyệt tập trung cho Control UI đối với một tham chiếu ứng viên
    - Gỡ lỗi các lượt chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis thu thập bằng chứng trực quan đầu cuối để so sánh các phương thức truyền tải trực tiếp và tạo bằng chứng trình duyệt tập trung chỉ dành cho ứng viên, sau đó đính kèm các hiện vật vào PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-07-12T07:48:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis công bố bằng chứng CI trực quan và một bình luận PR cho hành vi của OpenClaw.
Các kịch bản truyền tải trực tiếp so sánh một đường cơ sở đã biết là lỗi với một tham chiếu ứng viên;
thay vào đó, các luồng trình duyệt tập trung có thể chứng minh một ứng viên dựa trên
phương thức truyền tải mô phỏng có tính xác định. Discord được phát hành đầu tiên với xác thực bot thực, các kênh máy chủ,
phản ứng, luồng thảo luận và một trình duyệt làm nhân chứng. Các luồng trò chuyện Slack, Telegram và Control
UI tập trung cũng đã có; WhatsApp và Matrix chưa được triển khai.

## Quyền sở hữu

- OpenClaw (`extensions/qa-lab/src/mantis/*`): môi trường chạy kịch bản, CLI `pnpm openclaw qa mantis <command>`, lược đồ bằng chứng.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): bộ công cụ truyền tải trực tiếp, bot trình điều khiển/SUT, trình ghi báo cáo/bằng chứng.
- Crabbox (`openclaw/crabbox`): máy Linux đã khởi động sẵn, phiên thuê, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): điểm vào từ xa, thời gian lưu giữ hiện vật.
- ClawSweeper: phân tích cú pháp lệnh PR của người bảo trì, điều phối quy trình làm việc, đăng bình luận PR cuối cùng.

## Lệnh CLI

Tất cả lệnh đều có dạng `pnpm openclaw qa mantis <command>`, được định nghĩa trong
`extensions/qa-lab/src/mantis/cli.ts`. Yêu cầu `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
khi xây dựng/chạy (các quy trình làm việc đi kèm đặt `OPENCLAW_BUILD_PRIVATE_QA=1` và
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` trước khi xây dựng).

| Lệnh                            | Mục đích                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Xác minh bot Mantis Discord có thể thấy máy chủ/kênh, đăng bài và thêm phản ứng.                                                                          |
| `run`                           | Chạy kịch bản trước/sau với các tham chiếu đường cơ sở và ứng viên (chỉ Discord).                                                                          |
| `desktop-browser-smoke`         | Thuê/tái sử dụng máy tính để bàn Crabbox, mở trình duyệt hiển thị được, chụp ảnh màn hình + video.                                                         |
| `slack-desktop-smoke`           | Thuê/tái sử dụng máy tính để bàn Crabbox, chạy QA Slack bên trong, mở Slack Web, thu thập bằng chứng.                                                      |
| `telegram-desktop-builder`      | Thuê/tái sử dụng máy tính để bàn Crabbox, cài đặt Telegram Desktop, tùy chọn cấu hình một Gateway OpenClaw.                                               |
| `visual-task` / `visual-driver` | Thu thập màn hình máy tính để bàn Crabbox tổng quát với các khẳng định hiểu hình ảnh tùy chọn; `visual-driver` là nửa trình điều khiển được khởi chạy trong `crabbox record --while`. |

Mọi lệnh đều chấp nhận `--repo-root <path>` và `--output-dir <path>`; các lệnh Crabbox
cũng chấp nhận `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` và `--keep-lease`. Giá trị mặc định của CLI cục bộ
cho nhà cung cấp/lớp là `hetzner`/`beast` trừ khi có ghi chú khác; các quy trình CI
thường ghi đè cả hai.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Gọi API REST Discord (`https://discord.com/api/v10`) để lấy người dùng bot,
máy chủ, các kênh của máy chủ và kênh đích, xác nhận kênh thuộc về
máy chủ, sau đó (trừ khi có `--skip-post`) đăng một tin nhắn và
thêm phản ứng `👀`. Ghi `mantis-discord-smoke-summary.json` và
`mantis-discord-smoke-report.md`.

Thứ tự phân giải token: giá trị `--token-file`, sau đó `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(ghi đè bằng `--token-env`), rồi đến tệp được đặt tên bởi `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(ghi đè bằng `--token-file-env`). ID máy chủ/kênh lấy từ
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (ghi đè bằng
`--guild-id` / `--channel-id`) và phải là snowflake Discord gồm 17–20 chữ số. Đặt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` để thay thế ID
và tên bot/máy chủ/kênh/tin nhắn bằng `<redacted>` trong bản tóm tắt và báo cáo được công bố.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` hiện chỉ chấp nhận `discord`. `--scenario` là một trong hai
ID tích hợp sẵn, mỗi ID có tham chiếu đường cơ sở mặc định và nhãn trước/sau
dự kiến riêng (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Kịch bản                                   | Đường cơ sở mặc định                       | Kỳ vọng ở đường cơ sở                    | Kỳ vọng ở ứng viên            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | phản hồi luồng bỏ qua tệp đính kèm `filePath` | phản hồi luồng bao gồm tệp đó |

`--candidate` mặc định là `HEAD`. Các cờ khác: `--credential-source`
(mặc định `convex`), `--credential-role` (mặc định `ci`), `--provider-mode`
(mặc định `live-frontier`), `--fast` (bật mặc định), `--skip-install`, `--skip-build`.

Trình chạy tạo các bản kiểm xuất `git worktree` tách rời cho đường cơ sở và
ứng viên trong `<output-dir>/worktrees/`, chạy `pnpm install`/`pnpm build` trong
từng bản (trừ khi bị bỏ qua), rồi chạy
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
với từng worktree. Mỗi luồng ghi `discord-qa-reaction-timelines.json`
cùng một cặp `<scenario-id>-timeline.html`/`.png`; trình chạy sao chép
bằng chứng này trở lại trong `baseline/`/`candidate/`, ghi `comparison.json`,
`mantis-report.md` và `mantis-evidence.json` vào thư mục đầu ra, đồng thời
thoát với mã khác không nếu phép so sánh không đạt (đường cơ sở `fail` và ứng viên
`pass`).

Kịch bản Discord thứ hai (`discord-thread-reply-filepath-attachment`) đăng
một tin nhắn cha bằng bot trình điều khiển, tạo một luồng thực, gọi hành động
`message.thread-reply` của SUT với `filePath` cục bộ trong kho mã, rồi thăm dò
luồng để tìm phản hồi và tên tệp đính kèm. Kịch bản kỳ vọng một tệp đính kèm
có tên `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Thuê hoặc tái sử dụng máy tính để bàn Crabbox, khởi chạy trình duyệt trong phiên VNC
trỏ đến `--browser-url` (mặc định `https://openclaw.ai`) hoặc một
`--html-file` đã kết xuất, chờ, chụp ảnh màn hình bằng `scrot`, tùy chọn ghi MP4 bằng
`ffmpeg`, rồi đồng bộ ngược `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
về `--output-dir` bằng rsync.

Các cờ:

- `--lease-id <cbx_...>` tái sử dụng máy tính để bàn đã khởi động sẵn thay vì tạo mới.
- `--browser-profile-dir <remote-path>` tái sử dụng thư mục dữ liệu người dùng Chrome từ xa để một máy tính để bàn lâu dài duy trì trạng thái đăng nhập giữa các lần chạy (dùng cho hồ sơ trình xem Discord Web lâu dài).
- `--browser-profile-archive-env <name>` khôi phục kho lưu trữ hồ sơ Chrome `.tgz` mã hóa base64 từ biến môi trường đó trước khi khởi chạy (mặc định `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); dùng cho các trình làm chứng đã đăng nhập như Discord Web.
- `--video-duration <seconds>` kiểm soát thời lượng thu MP4 (mặc định 10 giây).
- `--keep-lease` (hoặc `OPENCLAW_MANTIS_KEEP_VM=1`) giữ mở phiên thuê được tạo trong lần chạy này để kiểm tra qua VNC; theo mặc định, các lần chạy thất bại đã tạo phiên thuê cũng giữ phiên đó.

Đối với bằng chứng Discord Web, Mantis dùng một tài khoản người xem chuyên dụng, không dùng token
bot. Oracle REST Discord (thông qua `qa discord`) vẫn là nguồn có thẩm quyền; khi
đặt `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, kịch bản cũng ghi một
hiện vật URL Discord Web, và `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` giữ
luồng mở đủ lâu để trình duyệt mở nó.

Quy trình GitHub ưu tiên hồ sơ người xem bền vững thông qua
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (kho lưu trữ hồ sơ đầy đủ có thể vượt quá
giới hạn kích thước bí mật của GitHub); với hồ sơ nhỏ/khởi tạo, quy trình có thể khôi phục một
tệp `.tgz` mã hóa base64 từ `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Nếu
không cấu hình nguồn nào, quy trình vẫn công bố ảnh chụp màn hình xác định
của đường cơ sở/ứng viên và ghi nhật ký rằng trình làm chứng đã đăng nhập bị
bỏ qua.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Thuê hoặc tái sử dụng máy tính để bàn Crabbox, đồng bộ bản kiểm xuất vào máy ảo, chạy
`pnpm openclaw qa slack` bên trong, mở Slack Web trong trình duyệt VNC,
thu thập màn hình máy tính để bàn và sao chép cả hiện vật QA Slack (`slack-qa/`) lẫn
ảnh chụp màn hình/video VNC về máy cục bộ. Đây là hình thức Mantis duy nhất mà
Gateway SUT và trình duyệt đều chạy trong cùng một máy ảo.

Với `--gateway-setup`, lệnh tạo một thư mục chính OpenClaw dùng một lần nhưng bền vững
tại `$HOME/.openclaw-mantis/slack-openclaw` trong máy ảo, vá cấu hình Slack
Socket Mode cho kênh đích, khởi động
`openclaw gateway run --dev --allow-unconfigured --port 38973` và để
Chrome tiếp tục chạy trong phiên VNC; bỏ `--gateway-setup` sẽ chạy luồng
QA Slack bot-với-bot thông thường.

Các biến môi trường bắt buộc cho `--credential-source env` (mặc định cục bộ là `env`; vai trò
mặc định là `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho luồng mô hình từ xa (nếu chỉ đặt `OPENAI_API_KEY`
  cục bộ, Mantis sao chép nó sang `OPENCLAW_LIVE_OPENAI_KEY` trước khi
  gọi Crabbox)

Với `--credential-source convex`, Mantis thuê thông tin xác thực SUT Slack từ
nhóm dùng chung trước khi tạo máy ảo và chuyển tiếp ID kênh, token ứng dụng và
token bot vào máy ảo dưới dạng các biến môi trường `OPENCLAW_MANTIS_SLACK_*`, vì vậy các quy trình
GitHub chỉ cần bí mật của bộ môi giới Convex, không cần token Slack thô.

Các cờ khác: `--slack-url <url>` mở một URL cụ thể (nếu không, Mantis suy ra
`https://app.slack.com/client/<team>/<channel>` từ `auth.test`);
`--slack-channel-id <id>` đặt kênh trong danh sách cho phép của Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kiểm soát hồ sơ Chrome bền vững
bên trong máy ảo (mặc định `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` chạy các kịch bản phê duyệt Slack gốc
(`slack-approval-exec-native`, `slack-approval-plugin-native`) và kết xuất
ảnh chụp màn hình điểm kiểm tra đang chờ/đã giải quyết thay vì thiết lập Gateway (loại trừ lẫn nhau
với `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` và `--fast` được chuyển tiếp đến
luồng trực tiếp Slack.

Ảnh chụp màn hình điểm kiểm tra phê duyệt được kết xuất từ tin nhắn API Slack mà
kịch bản đã quan sát, không phải giao diện Slack trực tiếp; `slack-desktop-smoke.png` chỉ là
bằng chứng của chính Slack Web khi hồ sơ trình duyệt của phiên thuê đã đăng nhập
từ trước.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Thuê hoặc tái sử dụng một máy tính để bàn Crabbox, cài đặt Telegram Desktop Linux bản gốc,
tùy chọn khôi phục kho lưu trữ phiên người dùng, cấu hình OpenClaw bằng
token bot SUT Telegram đã thuê, khởi động
`openclaw gateway run --dev --allow-unconfigured --port 38974`, đăng thông báo
bot điều khiển đã sẵn sàng vào nhóm riêng đã thuê, sau đó chụp ảnh màn hình
và MP4. Token bot chỉ cấu hình OpenClaw; token này không bao giờ đăng nhập
Telegram Desktop. Trình xem máy tính để bàn là một phiên người dùng Telegram riêng biệt,
được khôi phục từ `--telegram-profile-archive-env <name>` hoặc đăng nhập thủ công
qua VNC và duy trì hoạt động bằng `--keep-lease`.

Cờ: `--lease-id <cbx_...>` chạy lại trên một máy ảo đã đăng nhập vào
Telegram Desktop; `--telegram-profile-archive-env <name>` khôi phục kho lưu trữ hồ sơ
`.tgz` dạng base64 trước khi khởi chạy; `--telegram-profile-dir <remote-path>`
đặt thư mục hồ sơ từ xa (mặc định `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` chỉ cài đặt và mở Telegram Desktop;
`--credential-source`/`--credential-role` mặc định lần lượt là `convex`/`maintainer`.

## Bản kê bằng chứng

Mọi kịch bản xuất bản lên một PR đều ghi `mantis-evidence.json` bên cạnh
báo cáo của kịch bản:

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

`path` của hiện vật là đường dẫn tương đối so với thư mục của bản kê; `targetPath` là
đường dẫn tương đối so với tiền tố hiện vật R2/S3 đã cấu hình. `scripts/mantis/publish-pr-evidence.mjs`
từ chối hành vi duyệt xuyên đường dẫn và bỏ qua các mục có `"required": false` khi
thiếu tệp.

Các loại hiện vật: `timeline` (ảnh chụp màn hình trước/sau có tính xác định),
`desktopScreenshot` (ảnh chụp màn hình VNC/trình duyệt), `motionPreview` (GIF động
nội tuyến từ bản ghi), `motionClip` (MP4 đã cắt theo chuyển động), `fullVideo` (toàn bộ
bản ghi), `metadata` (tệp phụ JSON/nhật ký), `report` (báo cáo Markdown).

Bố cục hiện vật trên đĩa của một lượt chạy:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Ảnh chụp màn hình là bằng chứng, không phải bí mật, nhưng vẫn cần tuân thủ quy tắc
che thông tin: tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Đặt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho các lượt tải hiện vật công khai lên; biến này
được bật theo mặc định trong các quy trình GitHub của Discord/Slack/Telegram.

## Tự động hóa GitHub

`scripts/mantis/publish-pr-evidence.mjs` là trình xuất bản có thể tái sử dụng. Các quy trình
gọi trình này với bản kê, PR đích, thư mục gốc đích của hiện vật, dấu mốc bình luận,
URL hiện vật, URL lượt chạy và nguồn yêu cầu. Trình này tải các hiện vật đã khai báo lên
bucket Mantis R2, tạo bình luận PR ưu tiên phần tóm tắt với hình ảnh/bản xem trước
nội tuyến và video được liên kết, sau đó cập nhật bình luận có dấu mốc hiện có hoặc
tạo bình luận mới. Các biến môi trường bắt buộc:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (các quy trình đặt là `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (các quy trình đặt là `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (các quy trình đặt là `https://artifacts.openclaw.ai`)

Bình luận được đăng qua ứng dụng GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), không phải `github-actions[bot]`, dùng một bình luận
dấu mốc ẩn làm khóa cập nhật hoặc chèn.

| Quy trình                          | Kích hoạt                                                                                    | Chức năng                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | kích hoạt thủ công                                                                            | Chạy `discord-smoke` trên một tham chiếu đã chọn.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | bình luận PR hoặc kích hoạt thủ công                                                              | Tạo các cây làm việc đường cơ sở/ứng viên riêng biệt, chạy `discord-status-reactions-tool-only` trên từng cây, kết xuất dòng thời gian của từng luồng trong trình duyệt máy tính để bàn Crabbox, tạo bản xem trước GIF/MP4 đã cắt theo chuyển động bằng `crabbox media preview`, tải hiện vật lên và đăng bằng chứng PR nội tuyến.                                 |
| `Mantis Scenario`                 | kích hoạt thủ công                                                                            | Bộ điều phối tổng quát: nhận `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` và chuyển tiếp đến quy trình kịch bản tương ứng. |
| `Mantis Slack Desktop Smoke`      | kích hoạt thủ công                                                                            | Thuê một máy tính để bàn Linux Crabbox (mặc định là `aws`, có thể chọn `hetzner`), chạy `slack-desktop-smoke --gateway-setup` trên ứng viên, ghi lại màn hình, tạo bản xem trước chuyển động, tải hiện vật lên và đăng bằng chứng PR khi có số PR.                                                      |
| `Mantis Telegram Live`            | bình luận PR hoặc kích hoạt thủ công                                                              | Chạy luồng QA trực tiếp Telegram qua API bot (`openclaw qa telegram`), ghi `mantis-evidence.json` từ phần tóm tắt QA, kết xuất HTML bằng chứng đã che thông tin qua trình duyệt máy tính để bàn Crabbox, tạo GIF chuyển động và đăng bằng chứng PR. Luồng này không yêu cầu đăng nhập Telegram Web.                               |
| `Mantis Telegram Desktop Proof`   | nhãn PR của người bảo trì (`mantis: telegram-visible-proof`) cùng bình luận PR, hoặc kích hoạt thủ công | Bằng chứng trước/sau mang tính tác tử trên Telegram Desktop bản gốc. Chuyển PR, các tham chiếu đường cơ sở/ứng viên và hướng dẫn của người bảo trì cho Codex; Codex chạy luồng bằng chứng Telegram Desktop Crabbox với người dùng thực cho cả hai tham chiếu và đăng bảng bằng chứng PR gồm 2 cột.                                                              |
| `Mantis Web UI Chat Proof`        | bình luận PR hoặc kích hoạt thủ công                                                              | Chạy bằng chứng Playwright tập trung cho trò chuyện trên giao diện điều khiển OpenClaw đối với ứng viên, xác minh trình duyệt gửi qua Gateway giả lập, ghi lại hiện vật ảnh chụp màn hình/video và đăng bằng chứng PR. Luồng này chỉ chứng minh trò chuyện web, không chứng minh WinUI/ứng dụng gốc hay hình ảnh tùy ý.                           |

Cả `Mantis Discord Status Reactions` và `Mantis Telegram Live` đều chấp nhận
`baseline_ref`/`candidate_ref` (hoặc `baseline=`/`candidate=` trong bình luận PR)
và xác thực rằng SHA đã phân giải là tổ tiên của `origin/main`, một thẻ phát hành
(`v*`) hoặc đầu của một PR đang mở trước khi chạy với thông tin xác thực chứa
bí mật.

Các lệnh kích hoạt bằng bình luận từ một PR có quyền ghi/bảo trì/quản trị:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Các lệnh kích hoạt Telegram bằng bình luận mặc định dùng SHA đầu của PR làm ứng viên và
`telegram-status-command` làm kịch bản; chúng chấp nhận `provider=aws|hetzner` và
`lease=<cbx_...>` để nhắm đến một nhà cung cấp Crabbox cụ thể hoặc một máy tính để bàn
đã khởi động sẵn. `Mantis Telegram Desktop Proof` chỉ phản hồi bình luận PR khi
PR đã có nhãn `mantis: telegram-visible-proof`.

Các lệnh kích hoạt trò chuyện trên giao diện web bằng bình luận mặc định dùng SHA đầu của PR làm ứng viên. Chúng chạy
bằng chứng trò chuyện của giao diện điều khiển với Gateway giả lập và xuất bản hiện vật trình duyệt; hãy dùng
bằng chứng Playwright/trình duyệt thông thường, ảnh chụp màn hình của người bảo trì, Crabbox hoặc hiện vật
cục bộ cho các trang web khác và các bề mặt ứng dụng gốc.

ClawSweeper cũng có thể điều phối trực tiếp một kịch bản:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máy và bí mật

Các giá trị Crabbox mặc định của CLI cục bộ là `--provider hetzner --class beast`; ghi đè
bằng `--provider`, `--class`/`--machine-class` hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Các quy trình GitHub
thường ghi đè cả hai (ví dụ `--class standard` và đầu vào lựa chọn nhà cung cấp
`aws`/`hetzner` của quy trình Slack). Nếu một nhà cung cấp quá chậm hoặc không khả dụng,
hãy thêm nhà cung cấp đó phía sau cùng giao diện Crabbox thay vì mã hóa cứng phương án dự phòng.

Đường cơ sở của máy ảo: Linux có Chrome/Chromium hỗ trợ giao diện máy tính để bàn, quyền truy cập CDP, VNC/
noVNC, Node 22+ và pnpm, một bản thanh toán mã nguồn OpenClaw và quyền truy cập ra ngoài đến
phương thức truyền tải đích, GitHub, các nhà cung cấp mô hình và trình môi giới thông tin xác thực.

Tên các bí mật được dùng trong các quy trình Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho các lượt tải hiện vật công khai lên
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (các quy trình cũng chấp nhận
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` làm phương án dự phòng và ánh xạ
  chúng sang các tên thuần trước khi gọi Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Trình chạy Mantis tuyệt đối không được in token bot Discord/Slack/Telegram,
khóa API của nhà cung cấp, cookie trình duyệt, nội dung hồ sơ xác thực, mật khẩu VNC hoặc
tải trọng thông tin xác thực thô. Nếu token bị rò rỉ vào một vấn đề, PR, cuộc trò chuyện hoặc nhật ký,
hãy xoay vòng token sau khi lưu bí mật thay thế.

## Kết quả lượt chạy

Các kịch bản truyền tải trước/sau phân biệt những kết quả này để môi trường
không ổn định không bị hiểu nhầm là hồi quy sản phẩm:

- **Đã tái hiện lỗi**: đường cơ sở thất bại theo cách mà kịch bản dự kiến.
- **Lỗi bộ kiểm thử**: thiết lập môi trường, thông tin xác thực, API truyền tải, trình duyệt
  hoặc nhà cung cấp thất bại trước khi tiêu chí đánh giá có ý nghĩa.

Bằng chứng trình duyệt chỉ dành cho ứng viên báo cáo liệu ứng viên có vượt qua Gateway giả lập
và các xác nhận giao diện hiển thị hay không; bằng chứng này không khẳng định đã tái hiện trên đường cơ sở.

## Thêm kịch bản

Các kịch bản truyền tải trực tiếp được định nghĩa bằng TypeScript theo từng phương thức truyền tải (xem
`MANTIS_SCENARIO_CONFIGS` trong `extensions/qa-lab/src/mantis/run.runtime.ts` để biết
cấu trúc trước/sau của Discord), không phải một định dạng tệp khai báo độc lập.
Mỗi kịch bản cần có: mã định danh và tiêu đề, phương thức truyền tải, thông tin xác thực bắt buộc, chính sách
tham chiếu đường cơ sở, chính sách tham chiếu ứng viên, bản vá cấu hình OpenClaw, các bước thiết lập/kích thích,
tiêu chí dự kiến cho đường cơ sở và ứng viên, mục tiêu ghi hình trực quan, ngân sách
thời gian chờ và các bước dọn dẹp.

Bằng chứng trình duyệt chỉ tập trung vào ứng viên có thể sử dụng một bài kiểm thử E2E chuyên biệt, có tính tất định
và quy trình làm việc riêng. Hãy nêu rõ phạm vi, xác thực tham chiếu ứng viên trước khi
thực thi, cô lập việc xuất bản dựa trên bí mật và tạo cùng một hợp đồng
tệp kê khai bằng chứng.

Ưu tiên các bộ kiểm chứng nhỏ, có kiểu dữ liệu thay vì kiểm tra bằng thị giác: trạng thái phản ứng trên Discord hoặc
tham chiếu tin nhắn, `ts` của luồng Slack/trạng thái API phản ứng, mã định danh thư điện tử
và tiêu đề. Sử dụng ảnh chụp màn hình trình duyệt khi giao diện người dùng là đối tượng quan sát đáng tin cậy duy nhất,
và giữ các kiểm tra bằng thị giác ở vai trò bổ sung cho bộ kiểm chứng bằng API nền tảng nếu có.

Sau Discord, Slack và Telegram, cùng cấu trúc trình chạy này có thể mở rộng sang WhatsApp
(đăng nhập bằng mã QR, tái định danh, phân phối, nội dung đa phương tiện, phản ứng) và Matrix
(phòng được mã hóa, quan hệ luồng/phản hồi, tiếp tục sau khi khởi động lại); cả hai
đều chưa được triển khai.

## Câu hỏi còn bỏ ngỏ

- Bot Discord nào nên đóng vai trò trình điều khiển và bot nào nên là SUT khi tái sử dụng bot Mantis
  hiện có?
- GitHub nên lưu giữ các tạo phẩm Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất một kịch bản Mantis thay vì
  chờ lệnh của người bảo trì?
- Có nên che thông tin nhạy cảm hoặc cắt ảnh chụp màn hình trước khi tải lên các PR công khai không?
