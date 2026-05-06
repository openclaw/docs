---
read_when:
    - Xây dựng hoặc chạy kiểm tra chất lượng trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo
    - Thêm các kịch bản truyền tải trực tiếp qua Discord, Slack, WhatsApp hoặc các nền tảng khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh đầu-cuối trực quan để tái hiện lỗi OpenClaw trên các kênh vận chuyển trực tiếp, thu thập bằng chứng trước và sau, đồng thời đính kèm tạo tác vào PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-06T09:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw cho các lỗi cần runtime thật,
transport thật, và bằng chứng nhìn thấy được. Nó chạy một kịch bản trên một ref đã
biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref ứng viên, và
xuất bản phần so sánh dưới dạng tạo phẩm để maintainer có thể kiểm tra từ PR hoặc
từ một lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cho chúng ta một nhánh đầu tiên có giá trị
cao: xác thực bot thật, kênh guild thật, reaction, thread, lệnh gốc, và một giao
diện trình duyệt nơi con người có thể xác nhận trực quan những gì transport đã
hiển thị.

## Mục tiêu

- Tái hiện một lỗi từ issue hoặc PR trên GitHub với cùng hình dạng transport mà
  người dùng thấy.
- Thu thập một tạo phẩm **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập một tạo phẩm **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Dùng một oracle tất định bất cứ khi nào có thể, chẳng hạn như đọc reaction qua
  Discord REST hoặc kiểm tra transcript kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI nhìn thấy được.
- Chạy cục bộ từ một CLI do agent điều khiển và chạy từ xa từ GitHub.
- Giữ đủ trạng thái máy cho cứu hộ qua VNC khi đăng nhập, tự động hóa trình
  duyệt, hoặc xác thực nhà cung cấp bị kẹt.
- Đăng trạng thái ngắn gọn lên một kênh Discord của operator khi lần chạy bị
  chặn, cần trợ giúp VNC thủ công, hoặc hoàn tất.

## Phi mục tiêu

- Mantis không phải là thay thế cho kiểm thử đơn vị. Một lần chạy Mantis thường
  nên trở thành một kiểm thử hồi quy nhỏ hơn sau khi đã hiểu bản sửa.
- Mantis không phải là cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin
  xác thực live, và được dành cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên cần con người trong vận hành bình thường. VNC thủ công là
  đường cứu hộ, không phải đường chạy thuận lợi.
- Mantis không lưu secret thô trong tạo phẩm, log, ảnh chụp màn hình, báo cáo
  Markdown, hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong stack QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, adapter transport, schema bằng chứng, và
  CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness transport live, helper chụp trình duyệt, và
  trình ghi tạo phẩm.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu điểm vào workflow từ xa và việc lưu giữ tạo phẩm.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh maintainer,
  dispatch workflow, và đăng bình luận PR cuối cùng.
- Các agent OpenClaw điều khiển Mantis thông qua Codex khi một kịch bản cần thiết
  lập có tính agent, gỡ lỗi, hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức transport trong OpenClaw, lập lịch máy trong
Crabbox, và phần ghép workflow maintainer trong ClawSweeper.

## Hình dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi
reaction, và đường dẫn tạo phẩm:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Trình chạy cục bộ trước và sau chấp nhận hình dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Trình chạy tạo các worktree baseline và ứng viên tách rời dưới thư mục đầu ra,
cài đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi
`baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md`. Với kịch bản
Discord đầu tiên, xác minh thành công nghĩa là trạng thái baseline là `fail` và
trạng thái ứng viên là `pass`.

Probe trước/sau Discord thứ hai nhắm vào file đính kèm trong thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Kịch bản đó đăng một tin nhắn cha bằng bot driver, tạo một thread Discord thật,
gọi action `message.thread-reply` của OpenClaw với một `filePath` cục bộ trong
repo, rồi poll thread để tìm phản hồi SUT và tên file đính kèm. Ảnh chụp màn
hình baseline hiển thị phản hồi không có file đính kèm; ảnh chụp màn hình ứng
viên hiển thị file đính kèm `mantis-thread-report.md` như mong đợi.

Primitive VM/trình duyệt đầu tiên là smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, khởi động một trình duyệt nhìn
thấy được bên trong phiên VNC, chụp desktop, kéo tạo phẩm về thư mục đầu ra cục
bộ, và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng nhà cung cấp Hetzner
vì đây là nhà cung cấp đầu tiên có hỗ trợ desktop/VNC hoạt động trong nhánh
Mantis. Ghi đè bằng `--provider`, `--crabbox-bin`, hoặc
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy với một fleet Crabbox khác.

Các cờ smoke desktop hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt nhìn thấy được.
- `--html-file <path>` render một tạo phẩm HTML cục bộ trong repo ở trình duyệt nhìn thấy được. Mantis dùng cờ này để chụp timeline reaction trạng thái Discord đã tạo thông qua một desktop Crabbox thật.
- `--browser-profile-dir <remote-path>` tái sử dụng một Chrome user-data-dir từ xa để một desktop Mantis bền vững có thể giữ đăng nhập giữa các lần chạy. Dùng cờ này cho hồ sơ trình xem Discord Web tồn tại lâu dài.
- `--browser-profile-archive-env <name>` khôi phục một kho lưu trữ Chrome user-data-dir `.tgz` base64 từ biến môi trường được đặt tên trước khi khởi chạy trình duyệt. Dùng cờ này cho witness đã đăng nhập, chẳng hạn Discord Web. Biến môi trường mặc định là `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` điều khiển độ dài capture MP4. Dùng thời lượng dài hơn cho ứng dụng web đã đăng nhập nhưng chậm, cần thời gian ổn định.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo và đã pass mở để kiểm tra qua VNC. Các lần chạy thất bại mặc định giữ lease khi một lease đã được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout`, và `--ttl` tinh chỉnh kích thước máy và thời hạn lease.

Đối với bằng chứng Discord Web, Mantis dùng một tài khoản viewer chuyên dụng
thay vì token bot. Kịch bản Discord API live vẫn là oracle: nó tạo thread thật,
gửi `thread-reply` của SUT, và kiểm tra file đính kèm thông qua Discord REST. Khi
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` được đặt, kịch bản cũng ghi một tạo
phẩm URL Discord Web. Khi `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` được đặt, nó giữ
thread đó đủ lâu để một trình duyệt đã đăng nhập mở và ghi lại nó.

Workflow GitHub mở URL thread ứng viên trong Discord Web, chụp ảnh màn hình, ghi
một MP4, và tạo bản xem trước GIF đã cắt gọn khi công cụ media của Crabbox khả
dụng. Ưu tiên một đường dẫn hồ sơ viewer bền vững được cấu hình thông qua
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, vì kho lưu trữ hồ sơ Chrome đầy đủ có
thể vượt quá giới hạn kích thước secret của GitHub. Với các hồ sơ nhỏ/bootstrap,
workflow cũng có thể khôi phục một kho lưu trữ `.tgz` base64 từ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Nếu không cấu hình nguồn hồ sơ
nào, workflow vẫn xuất bản ảnh chụp màn hình file đính kèm baseline/ứng viên tất
định và ghi notice rằng witness Discord Web đã đăng nhập đã bị bỏ qua.

Primitive transport desktop đầy đủ đầu tiên là smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào
VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt
VNC, chụp desktop nhìn thấy được, và sao chép cả tạo phẩm QA Slack lẫn ảnh chụp
màn hình VNC về thư mục đầu ra cục bộ. Đây là hình dạng Mantis đầu tiên mà
Gateway OpenClaw SUT và trình duyệt đều sống trong cùng một VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một home OpenClaw dùng một lần nhưng bền
vững tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode
cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng `38973`, và giữ
Chrome chạy trong phiên VNC. Đây là chế độ "để lại cho tôi một desktop Linux với
Slack và một claw đang chạy"; nhánh QA Slack bot-đến-bot vẫn là mặc định khi bỏ
qua `--gateway-setup`.

Đầu vào bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho nhánh model từ xa. Nếu chỉ có
  `OPENAI_API_KEY` được đặt cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY`
  trước khi gọi Crabbox để cơ chế chuyển tiếp env `OPENCLAW_*` của Crabbox có thể
  mang nó vào VM.

Với `--gateway-setup --credential-source convex`, Mantis thuê thông tin xác thực
Slack SUT từ pool dùng chung trước khi tạo VM và chuyển tiếp channel id, token
app Socket Mode, và token bot đã thuê dưới dạng env runtime
`OPENCLAW_MANTIS_SLACK_*` bên trong desktop. Điều đó giữ workflow GitHub gọn
nhẹ: chúng chỉ cần secret broker Convex, không cần token bot hoặc app Slack thô.

Các cờ desktop Slack hữu ích:

- `--lease-id <cbx_...>` chạy lại trên một máy mà operator đã đăng nhập Slack Web qua VNC.
- `--gateway-setup` khởi động một Gateway OpenClaw Slack bền vững trong VM thay vì chỉ chạy nhánh QA bot-đến-bot.
- `--keep-lease` giữ VM Gateway mở để kiểm tra qua VNC sau khi thành công; `--no-keep-lease` dừng nó sau khi thu thập tạo phẩm.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi token bot SUT khả dụng.
- `--slack-channel-id <id>` điều khiển allowlist kênh Slack được dùng bởi thiết lập Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` điều khiển hồ sơ Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, để một lần đăng nhập Slack Web thủ công vẫn tồn tại qua các lần chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng pool thông tin xác thực dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model`, và `--fast` được truyền tiếp sang nhánh live Slack.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau cho
kịch bản thật đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: ref được kỳ vọng tái hiện hành vi chỉ queued.
- `candidate_ref`: ref được kỳ vọng hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree baseline và ứng viên riêng,
chạy `discord-status-reactions-tool-only` trên từng worktree, và upload
`baseline/`, `candidate/`, `comparison.json`, và `mantis-report.md` dưới dạng tạo
phẩm Actions. Nó cũng render HTML timeline của từng nhánh trong một trình duyệt
desktop Crabbox và xuất bản các ảnh chụp màn hình VNC đó bên cạnh các PNG
timeline tất định trong bình luận PR. Cùng bình luận PR đó nhúng các bản xem
trước GIF nhẹ đã cắt theo chuyển động, được tạo bởi `crabbox media preview`, liên
kết tới các clip MP4 đã cắt theo chuyển động tương ứng, và giữ các file MP4
desktop đầy đủ để kiểm tra sâu. Ảnh chụp màn hình vẫn được nhúng inline để rà
soát nhanh. Workflow build CLI Crabbox từ `openclaw/crabbox` main để có thể dùng
các cờ lease desktop/trình duyệt hiện tại trước khi bản phát hành nhị phân
Crabbox tiếp theo được cắt.

`Mantis Scenario` là điểm vào thủ công tổng quát. Nó nhận `scenario_id`,
`candidate_ref`, `baseline_ref` tùy chọn, và `pr_number` tùy chọn, rồi dispatch
workflow do kịch bản sở hữu. Wrapper này cố ý mỏng: các workflow kịch bản vẫn sở
hữu thiết lập transport, thông tin xác thực, lớp VM, oracle mong đợi, và manifest
tạo phẩm.

`Mantis Slack Desktop Smoke` là workflow VM Slack đầu tiên. Nó checkout ref ứng viên đáng tin cậy trong một worktree riêng, thuê một desktop Linux Crabbox, chạy `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` trên ứng viên đó, mở Slack Web trong trình duyệt VNC, ghi lại desktop, tạo bản xem trước đã cắt theo chuyển động bằng `crabbox media preview`, tải lên toàn bộ thư mục artifact, và tùy chọn đăng bình luận bằng chứng inline trên PR mục tiêu. Nó mặc định dùng AWS cho lease desktop và cung cấp một input provider thủ công để người vận hành có thể chuyển sang Hetzner khi dung lượng AWS chậm hoặc không khả dụng. Dùng lane này khi bạn muốn "một desktop Linux có Slack và một claw đang chạy" thay vì chỉ có transcript Slack giữa bot với bot.

Mọi kịch bản xuất bản lên PR đều ghi `mantis-evidence.json` cạnh báo cáo của nó. Schema này là phần bàn giao giữa mã kịch bản và bình luận GitHub:

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

Các giá trị `path` của artifact là đường dẫn tương đối so với thư mục manifest. Các giá trị `targetPath` là đường dẫn tương đối bên dưới thư mục xuất bản của nhánh `qa-artifacts`. Publisher từ chối path traversal và bỏ qua các mục được đánh dấu `"required": false` khi các bản xem trước hoặc video tùy chọn không khả dụng.

Các loại artifact được hỗ trợ:

- `timeline`: ảnh chụp màn hình kịch bản xác định, thường là trước/sau.
- `desktopScreenshot`: ảnh chụp màn hình desktop VNC/trình duyệt.
- `motionPreview`: GIF động inline được tạo từ bản ghi desktop.
- `motionClip`: MP4 đã cắt theo chuyển động, loại bỏ phần tĩnh ở đầu và cuối.
- `fullVideo`: bản ghi MP4 đầy đủ để kiểm tra sâu.
- `metadata`: JSON/log sidecar.
- `report`: báo cáo Markdown.

Publisher tái sử dụng được là `scripts/mantis/publish-pr-evidence.mjs`. Workflow gọi nó với manifest, PR mục tiêu, root mục tiêu `qa-artifacts`, marker bình luận, URL artifact Actions, URL run, và nguồn yêu cầu. Nó sao chép các artifact đã khai báo sang nhánh `qa-artifacts`, dựng bình luận PR đặt tóm tắt lên trước với ảnh/bản xem trước inline và video được liên kết, rồi cập nhật bình luận marker hiện có hoặc tạo bình luận mới.

Bạn cũng có thể kích hoạt trực tiếp run status-reactions từ một bình luận PR:

```text
@Mantis discord status reactions
```

Trigger bằng bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull request từ người dùng có quyền write, maintain, hoặc admin, và chỉ nhận diện các yêu cầu status-reaction của Discord. Theo mặc định, nó dùng ref baseline đã biết là xấu và SHA head hiện tại của PR làm ứng viên. Maintainer có thể ghi đè một trong hai ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên là tường minh và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh xạ một PR hoặc issue tới các kịch bản Mantis được đề xuất từ label, tệp đã thay đổi, và phát hiện review của ClawSweeper.

## Vòng đời run

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng một VM.
3. Chuẩn bị profile desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị một checkout sạch cho ref baseline.
5. Cài đặt phụ thuộc và chỉ build những gì kịch bản cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình live transport, provider, model, và profile trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng baseline.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref ứng viên trong cùng VM.
11. Chạy cùng kịch bản và thu thập bằng chứng ứng viên.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình, và artifact trace tùy chọn.
14. Tải lên artifact GitHub Actions.
15. Đăng một thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản phải có thể thất bại theo hai cách khác nhau:

- **Tái hiện lỗi**: baseline thất bại theo cách mong đợi.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt, hoặc provider thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm lẫn môi trường flaky với hành vi sản phẩm.

## Discord MVP

Kịch bản đầu tiên nên nhắm tới phản ứng trạng thái Discord trong các kênh guild nơi chế độ gửi phản hồi nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó thực thi OpenClaw Gateway thật, xác thực bot Discord, điều phối tin nhắn, chế độ gửi phản hồi nguồn, trạng thái phản ứng trạng thái, và vòng đời lượt model.
- Nó đủ hẹp để giữ triển khai đầu tiên trung thực.

Dạng kịch bản mong đợi:

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

Bằng chứng baseline phải cho thấy phản ứng xác nhận đã xếp hàng nhưng không có chuyển đổi vòng đời trong chế độ tool-only. Bằng chứng ứng viên phải cho thấy phản ứng trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được bật tường minh.

Phần thực thi đầu tiên là kịch bản QA live Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Nó cấu hình SUT với xử lý guild luôn bật, `visibleReplies: "message_tool"`, `ackReaction: "👀"`, và phản ứng trạng thái tường minh. Oracle poll tin nhắn kích hoạt Discord thật và kỳ vọng chuỗi quan sát được `👀 -> 🤔 -> 👍`. Artifact bao gồm `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, và `discord-status-reactions-tool-only-timeline.png`.

## Các phần QA hiện có

Mantis nên xây dựng trên private QA stack hiện có thay vì bắt đầu từ con số không:

- `pnpm openclaw qa discord` đã chạy một lane Discord live với driver và bot SUT.
- Live transport runner đã ghi báo cáo và artifact observed-message bên dưới `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực live transport dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot, profile headless được quản lý, và profile CDP từ xa.
- QA Lab đã có debugger UI và bus cho kiểm thử theo dạng transport.

Triển khai Mantis đầu tiên có thể là một runner trước/sau mỏng trên các phần này, cộng thêm một lớp bằng chứng trực quan.

## Mô hình bằng chứng

Mỗi run ghi một thư mục artifact ổn định:

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

`mantis-summary.json` nên là nguồn sự thật máy đọc được. Báo cáo Markdown dành cho bình luận PR và review của con người.

Bản tóm tắt phải bao gồm:

- các ref và SHA đã kiểm thử
- transport và id kịch bản
- provider máy và id máy hoặc id lease
- nguồn thông tin xác thực không có giá trị bí mật
- kết quả baseline
- kết quả ứng viên
- lỗi có được tái hiện trên baseline hay không
- ứng viên có sửa được lỗi hay không
- đường dẫn artifact
- các vấn đề thiết lập hoặc dọn dẹp đã được làm sạch

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Chúng vẫn cần kỷ luật biên tập: tên kênh riêng tư, tên người dùng, hoặc nội dung tin nhắn có thể xuất hiện. Đối với PR công khai, ưu tiên liên kết artifact GitHub Actions thay vì ảnh inline cho đến khi câu chuyện biên tập mạnh hơn.

## Trình duyệt và VNC

Lane trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: được bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord, hoặc gỡ lỗi trực quan cần con người.

Profile trình duyệt quan sát Discord nên đủ bền để tránh phải đăng nhập cho mỗi run, nhưng được cô lập khỏi trạng thái trình duyệt cá nhân. Một profile thuộc về pool máy Mantis, không thuộc về laptop của developer.

Khi Mantis bị kẹt, nó đăng thông báo trạng thái Discord với:

- id run
- id kịch bản
- provider máy
- thư mục artifact
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn về blocker

Triển khai private đầu tiên có thể đăng các thông báo này vào kênh operator hiện có và chuyển sang một kênh Mantis chuyên dụng về sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên. Crabbox cung cấp máy đã được làm nóng, theo dõi lease, hydration, log, kết quả, và dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, thêm provider Hetzner phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có cài đặt Chrome hoặc Chromium đủ khả năng chạy desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và cache phụ thuộc
- cache trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt, và một lần chạy model
- truy cập outbound tới Discord, GitHub, provider model, và broker thông tin xác thực

VM không nên giữ bí mật thô dài hạn bên ngoài các kho thông tin xác thực hoặc profile trình duyệt được kỳ vọng.

## Bí mật

Bí mật nằm trong secret của tổ chức hoặc repository GitHub cho run từ xa, và trong tệp secret do operator kiểm soát cục bộ cho run local.

Tên secret khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho upload artifact GitHub công khai
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Về dài hạn, pool thông tin xác thực Convex nên vẫn là nguồn thông thường cho thông tin xác thực live transport. GitHub secrets bootstrap broker và các lane fallback. Workflow status-reactions Discord ánh xạ các secret Mantis Crabbox trở lại các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN` mà Crabbox CLI kỳ vọng. Tên secret GitHub `CRABBOX_*` dạng thuần vẫn được chấp nhận làm fallback tương thích.

Mantis runner không bao giờ được in:

- token bot Discord
- khóa API provider
- cookie trình duyệt
- nội dung auth profile
- mật khẩu VNC
- payload thông tin xác thực thô

Upload artifact công khai cũng nên biên tập metadata mục tiêu Discord như id bot, guild, kênh, và tin nhắn. Workflow smoke GitHub bật `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu token vô tình bị dán vào issue, PR, chat, hoặc log, hãy xoay vòng token đó sau khi secret mới đã được lưu.

## Artifact GitHub và bình luận PR

Quy trình làm việc Mantis nên tải lên toàn bộ gói bằng chứng dưới dạng một tạo tác Actions ngắn hạn. Khi quy trình làm việc được chạy cho một báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên xuất bản các ảnh chụp màn hình PNG đã được biên tập lên nhánh `qa-artifacts` và upsert một bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau hiển thị inline. Không đăng bằng chứng chính chỉ trên một PR tự động hóa QA chung. Nhật ký thô, các thông điệp quan sát được và bằng chứng cồng kềnh khác sẽ ở trong tạo tác Actions.

Các quy trình làm việc production nên đăng các bình luận đó bằng Mantis GitHub App, không phải bằng `github-actions[bot]`. Lưu app id và khóa riêng tư dưới dạng GitHub Actions secrets `MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`. Quy trình làm việc sử dụng một marker ẩn làm khóa upsert, cập nhật bình luận đó khi token có thể chỉnh sửa nó, và tạo một bình luận mới do Mantis sở hữu khi không thể chỉnh sửa marker cũ do bot sở hữu.

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

## Ghi chú triển khai riêng tư

Một bản triển khai riêng tư có thể đã có một ứng dụng Mantis Discord. Tái sử dụng ứng dụng đó thay vì tạo một app khác khi nó có quyền bot phù hợp và có thể được xoay vòng an toàn.

Đặt kênh thông báo operator ban đầu thông qua secrets hoặc cấu hình triển khai. Ban đầu, kênh này có thể trỏ đến một kênh maintainer hoặc vận hành hiện có, rồi chuyển sang một kênh Mantis chuyên dụng sau khi kênh đó tồn tại.

Không đưa guild ids, channel ids, bot tokens, browser cookies hoặc VNC passwords vào tài liệu này. Lưu chúng trong GitHub secrets, credential broker hoặc kho bí mật cục bộ của operator.

## Thêm một scenario

Một scenario Mantis nên khai báo:

- id và tiêu đề
- phương thức truyền tải
- thông tin xác thực bắt buộc
- chính sách baseline ref
- chính sách candidate ref
- bản vá cấu hình OpenClaw
- các bước thiết lập
- kích thích
- oracle baseline dự kiến
- oracle candidate dự kiến
- mục tiêu chụp hình ảnh
- ngân sách timeout
- các bước dọn dẹp

Các scenario nên ưu tiên oracle nhỏ, có kiểu:

- trạng thái reaction Discord cho lỗi reaction
- tham chiếu thông điệp Discord cho lỗi threading
- thread ts của Slack và trạng thái reaction API cho lỗi Slack
- ids và headers của email message cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là yếu tố quan sát đáng tin cậy duy nhất

Kiểm tra bằng thị giác nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng API làm oracle pass/fail và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở rộng provider

Sau Discord, cùng runner có thể thêm:

- Slack: reactions, threads, app mentions, modals, file uploads.
- Email: xác thực Gmail và message threading bằng `gog` khi connectors là chưa đủ.
- WhatsApp: đăng nhập QR, tái định danh, gửi tin nhắn, media, reactions.
- Telegram: group mention gating, commands, reactions khi có sẵn.
- Matrix: phòng mã hóa, quan hệ thread hoặc reply, khôi phục sau restart.

Mỗi phương thức truyền tải nên có một smoke scenario rẻ và một hoặc nhiều scenario theo lớp lỗi. Các scenario trực quan tốn kém nên duy trì ở dạng opt-in.

## Câu hỏi mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt observer nên dùng tài khoản Discord của con người, tài khoản kiểm thử, hay chỉ bằng chứng REST mà bot có thể đọc được cho giai đoạn đầu?
- GitHub nên lưu giữ các tạo tác Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất Mantis thay vì chờ lệnh maintainer?
- Có nên biên tập hoặc cắt ảnh chụp màn hình trước khi tải lên cho PR công khai không?
