---
read_when:
    - Xây dựng hoặc chạy quy trình QA trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo mã nguồn
    - Thêm các kịch bản truyền tải trực tiếp qua Discord, Slack, WhatsApp hoặc nền tảng khác
    - Chạy kiểm chứng trình duyệt Control UI có trọng tâm cho một ref ứng viên
    - Gỡ lỗi các lượt chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis thu thập bằng chứng trực quan đầu cuối cho các phép so sánh phương thức truyền tải trực tiếp và các bằng chứng trình duyệt tập trung chỉ dành cho ứng viên, sau đó đính kèm các hiện vật vào PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis công bố bằng chứng CI trực quan và một bình luận PR cho hành vi của OpenClaw.
Các kịch bản truyền tải trực tiếp so sánh một đường cơ sở đã biết là lỗi với một ref ứng viên;
thay vào đó, các luồng trình duyệt tập trung có thể chứng minh một ứng viên dựa trên một
phương thức truyền tải mô phỏng có tính xác định. Discord được phát hành đầu tiên với xác thực bot thực, các kênh máy chủ,
phản ứng, luồng và nhân chứng trình duyệt. Slack, Telegram và các luồng trò chuyện Control
UI tập trung cũng đã có; WhatsApp và Matrix chưa được triển khai.

## Quyền sở hữu

- OpenClaw (`extensions/qa-lab/src/mantis/*`): môi trường chạy kịch bản, `pnpm openclaw qa mantis <command>` CLI, lược đồ bằng chứng.
- Phòng kiểm thử QA (`extensions/qa-lab/src/live-transports/*`): bộ kiểm thử truyền tải trực tiếp, bot trình điều khiển/SUT, trình ghi báo cáo/bằng chứng.
- Crabbox (`openclaw/crabbox`): máy Linux đã khởi động sẵn, phiên thuê, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): điểm vào từ xa, lưu giữ artifact.
- ClawSweeper: phân tích lệnh PR của người bảo trì, kích hoạt quy trình làm việc, đăng bình luận PR cuối cùng.

## Lệnh CLI

Tất cả lệnh đều là `pnpm openclaw qa mantis <command>`, được định nghĩa trong
`extensions/qa-lab/src/mantis/cli.ts`. Yêu cầu `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
tại thời điểm xây dựng/chạy (các quy trình làm việc đi kèm đặt `OPENCLAW_BUILD_PRIVATE_QA=1` và
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` trước khi xây dựng).

| Lệnh                            | Mục đích                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Xác minh bot Mantis Discord có thể thấy máy chủ/kênh, đăng bài và thêm phản ứng.                                                                          |
| `run`                           | Chạy kịch bản trước/sau dựa trên các ref đường cơ sở và ứng viên (chỉ Discord).                                                                            |
| `desktop-browser-smoke`         | Thuê/tái sử dụng máy tính Crabbox, mở trình duyệt hiển thị được, chụp ảnh màn hình + video.                                                                |
| `slack-desktop-smoke`           | Thuê/tái sử dụng máy tính Crabbox, chạy QA Slack bên trong, mở Slack Web, thu thập bằng chứng.                                                            |
| `telegram-desktop-builder`      | Thuê/tái sử dụng máy tính Crabbox, cài đặt Telegram Desktop, tùy chọn cấu hình một Gateway OpenClaw.                                                      |
| `visual-task` / `visual-driver` | Chụp máy tính Crabbox tổng quát với các xác nhận hiểu hình ảnh tùy chọn; `visual-driver` là nửa trình điều khiển được khởi chạy trong `crabbox record --while`. |

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

Gọi API REST của Discord (`https://discord.com/api/v10`) để truy xuất người dùng
bot, máy chủ, các kênh của máy chủ và kênh đích, xác nhận rằng
kênh thuộc về máy chủ, rồi (trừ khi `--skip-post`) đăng một tin nhắn và
thêm phản ứng `👀`. Ghi `mantis-discord-smoke-summary.json` và
`mantis-discord-smoke-report.md`.

Thứ tự phân giải token: giá trị `--token-file`, sau đó là `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(ghi đè bằng `--token-env`), rồi đến tệp được đặt tên bởi `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(ghi đè bằng `--token-file-env`). ID máy chủ/kênh lấy từ
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (ghi đè bằng
`--guild-id` / `--channel-id`) và phải là snowflake Discord gồm 17-20 chữ số. Đặt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` để thay thế ID và tên bot/máy chủ/kênh/tin nhắn
bằng `<redacted>` trong bản tóm tắt và báo cáo được công bố.

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
ID tích hợp sẵn, mỗi ID có ref đường cơ sở mặc định và nhãn trước/sau dự kiến
riêng (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Kịch bản                                   | Đường cơ sở mặc định                       | Đường cơ sở dự kiến                      | Ứng viên dự kiến             |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | câu trả lời trong luồng bỏ qua tệp đính kèm `filePath` | câu trả lời trong luồng bao gồm tệp đó |

`--candidate` mặc định là `HEAD`. Các cờ khác: `--credential-source`
(mặc định `convex`), `--credential-role` (mặc định `ci`), `--provider-mode`
(mặc định `live-frontier`), `--fast` (bật theo mặc định), `--skip-install`, `--skip-build`.

Trình chạy tạo các bản checkout `git worktree` tách rời cho đường cơ sở và
ứng viên trong `<output-dir>/worktrees/`, chạy `pnpm install`/`pnpm build` trong
từng bản (trừ khi bị bỏ qua), rồi chạy
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
với từng cây làm việc. Mỗi luồng ghi `discord-qa-reaction-timelines.json`
cùng một cặp `<scenario-id>-timeline.html`/`.png`; trình chạy sao chép
bằng chứng này trở lại dưới `baseline/`/`candidate/`, ghi `comparison.json`,
`mantis-report.md` và `mantis-evidence.json` vào thư mục đầu ra, đồng thời
thoát với mã khác 0 nếu phép so sánh không đạt (đường cơ sở `fail` và ứng viên
`pass`).

Kịch bản Discord thứ hai (`discord-thread-reply-filepath-attachment`) đăng
một tin nhắn mẹ bằng bot trình điều khiển, tạo một luồng thực, gọi hành động
`message.thread-reply` của SUT với một `filePath` cục bộ trong kho mã, rồi thăm dò
luồng để tìm câu trả lời và tên tệp đính kèm. Kịch bản mong đợi một tệp đính kèm
có tên `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Thuê hoặc tái sử dụng một máy tính Crabbox, khởi chạy trình duyệt trong phiên VNC
trỏ đến `--browser-url` (mặc định `https://openclaw.ai`) hoặc một
`--html-file` đã kết xuất, chờ, chụp ảnh màn hình bằng `scrot`, tùy chọn quay MP4 bằng
`ffmpeg` và đồng bộ rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
trở lại `--output-dir`.

Các cờ:

- `--lease-id <cbx_...>` tái sử dụng một máy tính đã khởi động sẵn thay vì tạo máy mới.
- `--browser-profile-dir <remote-path>` tái sử dụng thư mục dữ liệu người dùng Chrome từ xa để một máy tính lâu dài duy trì trạng thái đăng nhập giữa các lần chạy (dùng cho hồ sơ người xem Discord Web lâu dài).
- `--browser-profile-archive-env <name>` khôi phục kho lưu trữ hồ sơ Chrome `.tgz` dạng base64 từ biến môi trường đó trước khi khởi chạy (mặc định `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); dùng cho các nhân chứng đã đăng nhập như Discord Web.
- `--video-duration <seconds>` kiểm soát thời lượng quay MP4 (mặc định 10s).
- `--keep-lease` (hoặc `OPENCLAW_MANTIS_KEEP_VM=1`) giữ mở phiên thuê được tạo trong lần chạy này để kiểm tra qua VNC; theo mặc định, các lần chạy thất bại đã tạo phiên thuê cũng giữ phiên đó.

Đối với bằng chứng Discord Web, Mantis dùng một tài khoản người xem chuyên dụng, không dùng token
bot. Nguồn xác thực REST Discord (qua `qa discord`) vẫn là nguồn có thẩm quyền; khi
đặt `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, kịch bản cũng ghi một
artifact URL Discord Web, và `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` giữ
luồng mở đủ lâu để trình duyệt mở luồng đó.

Quy trình làm việc GitHub ưu tiên hồ sơ người xem lâu dài qua
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (kho lưu trữ hồ sơ đầy đủ có thể vượt quá
giới hạn kích thước secret của GitHub); đối với các hồ sơ nhỏ/khởi tạo, quy trình có thể khôi phục một
`.tgz` dạng base64 từ `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` thay thế. Khi
không cấu hình nguồn nào, quy trình vẫn công bố ảnh chụp màn hình đường cơ sở/ứng viên
có tính xác định và ghi nhật ký rằng nhân chứng đã đăng nhập đã bị
bỏ qua.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Thuê hoặc tái sử dụng một máy tính Crabbox, đồng bộ bản checkout vào VM, chạy
`pnpm openclaw qa slack` bên trong, mở Slack Web trong trình duyệt VNC,
chụp máy tính và sao chép cả artifact QA Slack (`slack-qa/`) lẫn
ảnh chụp màn hình/video VNC trở lại máy cục bộ. Đây là cấu hình Mantis duy nhất mà
cả Gateway SUT và trình duyệt đều chạy trong cùng một VM.

Với `--gateway-setup`, lệnh tạo một thư mục chính OpenClaw dùng một lần nhưng lâu dài
tại `$HOME/.openclaw-mantis/slack-openclaw` trong VM, vá cấu hình Slack
Socket Mode cho kênh đích, khởi động
`openclaw gateway run --dev --allow-unconfigured --port 38973` và giữ
Chrome chạy trong phiên VNC; bỏ `--gateway-setup` sẽ chạy luồng QA Slack
bot-với-bot thông thường thay thế.

Biến môi trường bắt buộc cho `--credential-source env` (mặc định cục bộ là `env`; vai trò
mặc định là `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho luồng mô hình từ xa (nếu chỉ đặt `OPENAI_API_KEY`
  cục bộ, Mantis sao chép giá trị đó vào `OPENCLAW_LIVE_OPENAI_KEY` trước khi
  gọi Crabbox)

Với `--credential-source convex`, Mantis thuê thông tin xác thực SUT Slack từ
nhóm dùng chung trước khi tạo VM và chuyển tiếp ID kênh, token ứng dụng và
token bot vào VM dưới dạng các biến môi trường `OPENCLAW_MANTIS_SLACK_*`, nhờ đó các quy trình làm việc GitHub
chỉ cần secret của trình môi giới Convex, không cần token Slack thô.

Các cờ khác: `--slack-url <url>` mở một URL cụ thể (nếu không, Mantis suy ra
`https://app.slack.com/client/<team>/<channel>` từ `auth.test`);
`--slack-channel-id <id>` đặt kênh trong danh sách cho phép của Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kiểm soát hồ sơ Chrome lâu dài
trong VM (mặc định `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` chạy các kịch bản phê duyệt Slack gốc
(`slack-approval-exec-native`, `slack-approval-plugin-native`) và kết xuất
ảnh chụp màn hình điểm kiểm tra đang chờ/đã giải quyết thay vì thiết lập Gateway (loại trừ
lẫn nhau với `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` và `--fast` được chuyển tiếp đến
luồng Slack trực tiếp.

Ảnh chụp màn hình điểm kiểm tra phê duyệt được kết xuất từ tin nhắn API Slack mà
kịch bản quan sát được, không phải giao diện Slack trực tiếp; `slack-desktop-smoke.png` chỉ là
bằng chứng của chính Slack Web khi hồ sơ trình duyệt của phiên thuê đã đăng
nhập.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Thuê hoặc tái sử dụng một máy tính Crabbox, cài đặt Telegram Desktop gốc cho Linux,
tùy chọn khôi phục kho lưu trữ phiên người dùng, cấu hình OpenClaw bằng
token bot SUT Telegram đã thuê, khởi động
`openclaw gateway run --dev --allow-unconfigured --port 38974`, đăng một
tin nhắn sẵn sàng của bot trình điều khiển vào nhóm riêng đã thuê, rồi chụp
ảnh màn hình và MP4. Token bot chỉ cấu hình OpenClaw; nó không bao giờ đăng nhập
Telegram Desktop. Trình xem trên máy tính là một phiên người dùng Telegram riêng biệt
được khôi phục từ `--telegram-profile-archive-env <name>` hoặc đăng nhập thủ công
qua VNC và được duy trì bằng `--keep-lease`.

Các cờ: `--lease-id <cbx_...>` chạy lại trên một VM đã đăng nhập vào
Telegram Desktop; `--telegram-profile-archive-env <name>` khôi phục một kho lưu trữ hồ sơ
`.tgz` dạng base64 trước khi khởi chạy; `--telegram-profile-dir <remote-path>`
đặt thư mục hồ sơ từ xa (mặc định `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` chỉ cài đặt và mở Telegram Desktop;
`--credential-source`/`--credential-role` mặc định là `convex`/`maintainer`.

## Manifest bằng chứng

Mọi kịch bản xuất bản lên PR đều ghi `mantis-evidence.json` bên cạnh
báo cáo của kịch bản:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA phản ứng trạng thái Discord của Mantis",
  "summary": "Bản tóm tắt đầu tiên mà con người có thể đọc được cho bình luận PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "chỉ xếp hàng" },
    "candidate": { "sha": "...", "status": "pass", "expected": "đã xếp hàng -> đang suy nghĩ -> hoàn tất" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Đường cơ sở chỉ xếp hàng",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Dòng thời gian Discord đường cơ sở",
      "width": 420
    }
  ]
}
```

`path` của hiện vật là tương đối so với thư mục của tệp kê khai; `targetPath` là
tương đối so với tiền tố hiện vật R2/S3 đã cấu hình. `scripts/mantis/publish-pr-evidence.mjs`
từ chối việc duyệt xuyên đường dẫn và bỏ qua các mục có `"required": false` khi
tệp bị thiếu.

Các loại hiện vật: `timeline` (ảnh chụp màn hình trước/sau có tính xác định),
`desktopScreenshot` (ảnh chụp màn hình VNC/trình duyệt), `motionPreview` (GIF động nội tuyến
từ bản ghi), `motionClip` (MP4 được cắt theo chuyển động), `fullVideo` (toàn bộ
bản ghi), `metadata` (tệp phụ JSON/nhật ký), `report` (báo cáo Markdown).

Bố cục hiện vật trên đĩa của một lần chạy:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Ảnh chụp màn hình là bằng chứng, không phải bí mật, nhưng vẫn cần tuân thủ quy tắc biên tập:
tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Đặt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho các lượt tải hiện vật công khai lên; tùy chọn này
được bật theo mặc định trong các quy trình GitHub Discord/Slack/Telegram.

## Tự động hóa GitHub

`scripts/mantis/publish-pr-evidence.mjs` là trình xuất bản có thể tái sử dụng. Các quy trình
gọi trình này với tệp kê khai, PR đích, thư mục gốc đích của hiện vật, dấu mốc bình luận,
URL hiện vật, URL lần chạy và nguồn yêu cầu. Trình này tải các hiện vật đã khai báo lên
bucket Mantis R2, tạo một bình luận PR ưu tiên phần tóm tắt với hình ảnh/bản xem trước
nội tuyến và video được liên kết, sau đó cập nhật bình luận có dấu mốc hiện có hoặc
tạo bình luận mới. Các biến môi trường bắt buộc:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (các quy trình đặt `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (các quy trình đặt `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (các quy trình đặt `https://artifacts.openclaw.ai`)

Bình luận được đăng thông qua Ứng dụng GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), không phải `github-actions[bot]`, sử dụng một
bình luận dấu mốc ẩn làm khóa upsert.

| Quy trình                          | Kích hoạt                                                                                    | Chức năng                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | kích hoạt thủ công                                                                            | Chạy `discord-smoke` đối với một ref đã chọn.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | bình luận PR hoặc kích hoạt thủ công                                                              | Tạo các worktree đường cơ sở/ứng viên riêng biệt, chạy `discord-status-reactions-tool-only` trên từng worktree, kết xuất dòng thời gian của mỗi luồng trong trình duyệt máy tính Crabbox, tạo bản xem trước GIF/MP4 được cắt theo chuyển động bằng `crabbox media preview`, tải hiện vật lên và đăng bằng chứng PR nội tuyến.                                 |
| `Mantis Scenario`                 | kích hoạt thủ công                                                                            | Trình điều phối tổng quát: nhận `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` và chuyển tiếp đến quy trình kịch bản tương ứng. |
| `Mantis Slack Desktop Smoke`      | kích hoạt thủ công                                                                            | Thuê một máy tính Linux Crabbox (mặc định là `aws`, có thể chọn `hetzner`), chạy `slack-desktop-smoke --gateway-setup` đối với ứng viên, ghi lại màn hình máy tính, tạo bản xem trước chuyển động, tải hiện vật lên và đăng bằng chứng PR khi có số PR.                                                      |
| `Mantis Telegram Live`            | bình luận PR hoặc kích hoạt thủ công                                                              | Chạy luồng QA trực tiếp Telegram dùng API bot (`openclaw qa telegram`), ghi `mantis-evidence.json` từ bản tóm tắt QA, kết xuất HTML bằng chứng đã biên tập thông qua trình duyệt máy tính Crabbox, tạo GIF chuyển động và đăng bằng chứng PR. Luồng này không yêu cầu đăng nhập Telegram Web.                               |
| `Mantis Telegram Desktop Proof`   | nhãn PR của người bảo trì (`mantis: telegram-visible-proof`) cùng với bình luận PR, hoặc kích hoạt thủ công | Bằng chứng trước/sau có tác nhân trên Telegram Desktop gốc. Chuyển PR, các ref đường cơ sở/ứng viên và hướng dẫn của người bảo trì cho Codex; Codex chạy luồng bằng chứng Telegram Desktop Crabbox dành cho người dùng thực trên cả hai ref và đăng bảng bằng chứng PR gồm 2 cột.                                                              |
| `Mantis Web UI Chat Proof`        | bình luận PR hoặc kích hoạt thủ công                                                              | Chạy bằng chứng Playwright tập trung cho cuộc trò chuyện trong Control UI của OpenClaw đối với ứng viên, xác minh trình duyệt gửi thông qua Gateway mô phỏng, thu thập hiện vật ảnh chụp màn hình/video và đăng bằng chứng PR. Luồng này chỉ là bằng chứng trò chuyện web, không phải bằng chứng WinUI/ứng dụng gốc hoặc bằng chứng hình ảnh tùy ý.                           |

Cả `Mantis Discord Status Reactions` và `Mantis Telegram Live` đều chấp nhận
`baseline_ref`/`candidate_ref` (hoặc `baseline=`/`candidate=` trong bình luận PR)
và xác thực rằng SHA đã phân giải là tổ tiên của `origin/main`, một
thẻ phát hành (`v*`) hoặc head của một PR đang mở trước khi chạy
với thông tin xác thực chứa bí mật.

Các lệnh kích hoạt bằng bình luận từ một PR có quyền write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Các lệnh kích hoạt Telegram bằng bình luận mặc định dùng SHA head của PR làm ứng viên và
`telegram-status-command` làm kịch bản; chúng chấp nhận `provider=aws|hetzner` và
`lease=<cbx_...>` để nhắm đến một nhà cung cấp Crabbox cụ thể hoặc một
máy tính đã được làm nóng trước. `Mantis Telegram Desktop Proof` chỉ phản hồi bình luận PR khi
PR đã có nhãn `mantis: telegram-visible-proof`.

Các lệnh kích hoạt cuộc trò chuyện Web UI bằng bình luận mặc định dùng SHA head của PR làm ứng viên. Chúng chạy
bằng chứng trò chuyện Control UI với Gateway mô phỏng và xuất bản hiện vật trình duyệt; hãy dùng
bằng chứng Playwright/trình duyệt thông thường, ảnh chụp màn hình của người bảo trì, Crabbox hoặc hiện vật
cục bộ cho các trang web và bề mặt ứng dụng gốc khác.

ClawSweeper cũng có thể điều phối trực tiếp một kịch bản:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máy và bí mật

Các giá trị mặc định Crabbox của CLI cục bộ là `--provider hetzner --class beast`; ghi đè
bằng `--provider`, `--class`/`--machine-class` hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Các quy trình GitHub
thường ghi đè cả hai (ví dụ `--class standard` và dữ liệu đầu vào lựa chọn nhà cung cấp
`aws`/`hetzner` của quy trình Slack). Nếu một nhà cung cấp quá
chậm hoặc không khả dụng, hãy thêm nhà cung cấp đó phía sau cùng giao diện Crabbox thay vì
mã hóa cứng phương án dự phòng.

Đường cơ sở máy ảo: Linux với Chrome/Chromium có khả năng chạy giao diện máy tính, quyền truy cập CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ hoặc 25.9+ và pnpm, một checkout OpenClaw và
quyền truy cập ra ngoài đến phương tiện vận chuyển đích, GitHub, các nhà cung cấp mô hình và
trình môi giới thông tin xác thực.

Tên thông tin xác thực và biến môi trường được sử dụng trong các lệnh và quy trình Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `qa mantis run --credential-source env` cục bộ cũng yêu cầu
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  và `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Các quy trình GitHub thường sử dụng
  `--credential-source convex` và thông tin xác thực của trình môi giới bên dưới thay cho
  token bot Discord thô.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho các lượt tải hiện vật công khai lên
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (hoặc biến dành riêng cho bằng chứng Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (các quy trình cũng chấp nhận
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` làm phương án dự phòng và ánh xạ
  chúng sang các tên thuần túy trước khi gọi Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Trình chạy Mantis tuyệt đối không được in token bot Discord/Slack/Telegram,
khóa API của nhà cung cấp, cookie trình duyệt, nội dung hồ sơ xác thực, mật khẩu VNC hoặc
tải trọng thông tin xác thực thô. Nếu token bị rò rỉ vào issue, PR, cuộc trò chuyện hoặc nhật ký,
hãy xoay vòng token đó sau khi bí mật thay thế được lưu trữ.

## Kết quả chạy

Các kịch bản phương tiện vận chuyển trước/sau phân biệt những kết quả này để môi trường
không ổn định không bị hiểu là hồi quy sản phẩm:

- **Đã tái hiện lỗi**: đường cơ sở thất bại theo cách mà kịch bản dự kiến.
- **Lỗi bộ thử nghiệm**: thiết lập môi trường, thông tin xác thực, API phương tiện vận chuyển, trình duyệt
  hoặc nhà cung cấp thất bại trước khi bộ tiên tri có ý nghĩa.

Bằng chứng trình duyệt chỉ dành cho ứng viên báo cáo liệu ứng viên có vượt qua các xác nhận
Gateway mô phỏng và UI hiển thị hay không; bằng chứng này không tuyên bố đã tái hiện trên đường cơ sở.

## Thêm một kịch bản

Các kịch bản phương tiện vận chuyển trực tiếp được định nghĩa bằng TypeScript cho từng phương tiện (xem
`MANTIS_SCENARIO_CONFIGS` trong `extensions/qa-lab/src/mantis/run.runtime.ts` để biết
cấu trúc trước/sau của Discord), không phải một định dạng tệp khai báo độc lập.
Mỗi kịch bản cần có: id và tiêu đề, phương tiện vận chuyển, thông tin xác thực bắt buộc, chính sách
ref đường cơ sở, chính sách ref ứng viên, bản vá cấu hình OpenClaw, các bước thiết lập/kích thích,
bộ tiên tri dự kiến cho đường cơ sở và ứng viên, mục tiêu chụp hình ảnh, ngân sách
thời gian chờ và các bước dọn dẹp.

Bằng chứng trình duyệt tập trung chỉ dành cho ứng viên có thể sử dụng một bài kiểm thử E2E chuyên dụng
có tính xác định và quy trình riêng. Hãy nêu rõ phạm vi, xác thực ref ứng viên trước khi
thực thi, cô lập việc xuất bản dùng bí mật và phát ra cùng hợp đồng tệp kê khai
bằng chứng.

Ưu tiên các bộ tiên tri nhỏ, có kiểu thay vì kiểm tra bằng thị giác: trạng thái phản ứng Discord hoặc
tham chiếu tin nhắn, trạng thái API `ts`/phản ứng của luồng Slack, id
và tiêu đề thư email. Dùng ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất
và giữ các kiểm tra bằng thị giác ở dạng bổ sung cho bộ tiên tri API nền tảng nếu có.

Sau Discord, Slack và Telegram, cùng cấu trúc trình chạy này có thể mở rộng sang WhatsApp
(đăng nhập bằng QR, nhận dạng lại, phân phối, phương tiện, phản ứng) và Matrix
(phòng được mã hóa, quan hệ luồng/trả lời, tiếp tục sau khi khởi động lại); cả hai
đều chưa được triển khai.

## Câu hỏi chưa giải đáp

- Bot Discord nào nên đóng vai trò trình điều khiển và bot nào nên là SUT khi tái sử dụng bot Mantis
  hiện có?
- GitHub nên lưu giữ các artifact Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất một kịch bản Mantis thay vì
  chờ lệnh của người bảo trì?
- Có nên che thông tin nhạy cảm hoặc cắt ảnh chụp màn hình trước khi tải lên các PR công khai không?
