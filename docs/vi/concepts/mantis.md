---
read_when:
    - Xây dựng hoặc chạy QA trực quan trực tiếp cho lỗi OpenClaw
    - Thêm bước xác minh trước và sau cho một yêu cầu kéo
    - Thêm các kịch bản cho Discord, Slack, WhatsApp hoặc các phương thức truyền tải trực tiếp khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh đầu cuối trực quan để tái hiện lỗi OpenClaw trên các phương thức truyền tải đang hoạt động, thu thập bằng chứng trước và sau, rồi đính kèm các tạo tác vào PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-05T08:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu cuối của OpenClaw dành cho các lỗi cần runtime thật, transport thật và bằng chứng trực quan. Hệ thống chạy một kịch bản trên một ref đã biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref ứng viên, rồi xuất bản phần so sánh dưới dạng artifact để maintainer có thể kiểm tra từ PR hoặc từ lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cung cấp cho chúng ta một lane đầu tiên có giá trị cao: xác thực bot thật, kênh guild thật, reaction, thread, lệnh gốc và một UI trình duyệt nơi con người có thể xác nhận trực quan những gì transport đã hiển thị.

## Mục tiêu

- Tái hiện một lỗi từ GitHub issue hoặc PR với cùng hình dạng transport mà người dùng thấy.
- Thu thập artifact **trước** trên ref baseline trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Sử dụng oracle xác định khi có thể, chẳng hạn như đọc reaction qua Discord REST hoặc kiểm tra transcript kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt UI thấy được.
- Chạy cục bộ từ CLI do agent kiểm soát và chạy từ xa từ GitHub.
- Giữ đủ trạng thái máy để cứu hộ qua VNC khi đăng nhập, tự động hóa trình duyệt hoặc xác thực provider bị kẹt.
- Đăng trạng thái ngắn gọn lên kênh Discord của operator khi lượt chạy bị chặn, cần trợ giúp VNC thủ công hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế unit test. Một lượt chạy Mantis thường nên trở thành một regression test nhỏ hơn sau khi đã hiểu bản sửa.
- Mantis không phải cổng CI nhanh thông thường. Nó chậm hơn, dùng credential live và chỉ dành cho các lỗi mà môi trường live có ý nghĩa.
- Mantis không nên cần con người trong vận hành bình thường. VNC thủ công là đường cứu hộ, không phải happy path.
- Mantis không lưu secret thô trong artifact, log, ảnh chụp màn hình, báo cáo Markdown hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong ngăn xếp QA của OpenClaw.

- OpenClaw sở hữu runtime kịch bản, adapter transport, schema bằng chứng và CLI cục bộ dưới `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness transport live, helper chụp trình duyệt và writer artifact.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu entrypoint workflow từ xa và chính sách giữ artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh maintainer, dispatch workflow và đăng bình luận PR cuối cùng.
- OpenClaw agent điều khiển Mantis qua Codex khi một kịch bản cần thiết lập kiểu agentic, gỡ lỗi hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức transport trong OpenClaw, lập lịch máy trong Crabbox và phần keo workflow maintainer trong ClawSweeper.

## Hình dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, guild, kênh, gửi tin nhắn, gửi reaction và đường dẫn artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner cục bộ trước và sau chấp nhận hình dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tạo baseline worktree và candidate worktree tách rời dưới thư mục output, cài dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi `baseline/`, `candidate/`, `comparison.json` và `mantis-report.md`. Với kịch bản Discord đầu tiên, xác minh thành công nghĩa là trạng thái baseline là `fail` và trạng thái candidate là `pass`.

Primitive VM/trình duyệt đầu tiên là desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, khởi động một trình duyệt hiển thị bên trong phiên VNC, chụp desktop, kéo artifact về thư mục output cục bộ và ghi lệnh kết nối lại vào báo cáo. Lệnh mặc định dùng provider Hetzner vì đây là provider đầu tiên có coverage desktop/VNC hoạt động trong lane Mantis. Ghi đè bằng `--provider`, `--crabbox-bin` hoặc `OPENCLAW_MANTIS_CRABBOX_PROVIDER` khi chạy với một fleet Crabbox khác.

Các flag desktop smoke hữu ích:

- `--lease-id <cbx_...>` hoặc `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` tái sử dụng một desktop đã được làm nóng.
- `--browser-url <url>` thay đổi trang được mở trong trình duyệt hiển thị.
- `--html-file <path>` render một artifact HTML cục bộ của repo trong trình duyệt hiển thị. Mantis dùng tùy chọn này để chụp timeline status-reaction Discord đã tạo thông qua một desktop Crabbox thật.
- `--keep-lease` hoặc `OPENCLAW_MANTIS_KEEP_VM=1` giữ một lease mới tạo đã pass mở để kiểm tra qua VNC. Các lượt chạy thất bại mặc định giữ lease khi một lease được tạo để operator có thể kết nối lại.
- `--class`, `--idle-timeout` và `--ttl` điều chỉnh kích thước máy và thời lượng lease.

Primitive transport desktop đầy đủ đầu tiên là Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Nó thuê hoặc tái sử dụng một máy desktop Crabbox, đồng bộ checkout hiện tại vào VM, chạy `pnpm openclaw qa slack` bên trong VM đó, mở Slack Web trong trình duyệt VNC, chụp desktop hiển thị và sao chép cả artifact Slack QA lẫn ảnh chụp VNC về thư mục output cục bộ. Đây là hình dạng Mantis đầu tiên mà Gateway OpenClaw SUT và trình duyệt đều nằm trong cùng một VM desktop Linux.

Với `--gateway-setup`, lệnh chuẩn bị một home OpenClaw dùng một lần nhưng bền vững tại `$HOME/.openclaw-mantis/slack-openclaw`, vá cấu hình Slack Socket Mode cho kênh đã chọn, khởi động `openclaw gateway run` trên cổng `38973` và giữ Chrome chạy trong phiên VNC. Đây là chế độ "để lại cho tôi một desktop Linux có Slack và một claw đang chạy"; lane Slack QA bot-to-bot vẫn là mặc định khi bỏ qua `--gateway-setup`.

Input bắt buộc cho `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` cho lane model từ xa. Nếu chỉ có `OPENAI_API_KEY` được đặt cục bộ, Mantis ánh xạ nó sang `OPENCLAW_LIVE_OPENAI_KEY` trước khi gọi Crabbox để cơ chế chuyển tiếp env `OPENCLAW_*` của Crabbox có thể mang nó vào VM.

Các flag Slack desktop hữu ích:

- `--lease-id <cbx_...>` chạy lại trên một máy mà operator đã đăng nhập vào Slack Web qua VNC.
- `--gateway-setup` khởi động một Gateway Slack OpenClaw bền vững trong VM thay vì chỉ chạy lane QA bot-to-bot.
- `--slack-url <url>` mở một URL Slack Web cụ thể. Nếu không có, Mantis suy ra `https://app.slack.com/client/<team>/<channel>` từ Slack `auth.test` khi token bot SUT có sẵn.
- `--slack-channel-id <id>` kiểm soát allowlist kênh Slack được dùng bởi thiết lập Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kiểm soát profile Chrome bền vững bên trong VM. Mặc định là `$HOME/.config/openclaw-mantis/slack-chrome-profile`, nên đăng nhập Slack Web thủ công sẽ tồn tại qua các lần chạy lại trên cùng lease.
- `--credential-source convex --credential-role ci` dùng pool credential dùng chung thay vì token env Slack trực tiếp.
- `--provider-mode`, `--model`, `--alt-model` và `--fast` được truyền tiếp sang lane live Slack.

Workflow smoke GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau cho kịch bản thật đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: ref dự kiến tái hiện hành vi chỉ queued.
- `candidate_ref`: ref dự kiến hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree baseline và candidate riêng biệt, chạy `discord-status-reactions-tool-only` trên từng worktree và tải lên `baseline/`, `candidate/`, `comparison.json` và `mantis-report.md` dưới dạng artifact Actions. Nó cũng render HTML timeline của từng lane trong trình duyệt desktop Crabbox và xuất bản các ảnh chụp VNC đó bên cạnh PNG timeline xác định trong bình luận PR. Cùng bình luận PR đó nhúng các preview GIF nhẹ đã cắt theo chuyển động được tạo bởi `crabbox media preview`, liên kết tới các clip MP4 tương ứng đã cắt theo chuyển động và giữ các file MP4 desktop đầy đủ để kiểm tra sâu. Ảnh chụp màn hình vẫn được nhúng inline để review nhanh. Workflow build Crabbox CLI từ `openclaw/crabbox` main để có thể dùng các flag lease desktop/trình duyệt hiện tại trước khi bản phát hành binary Crabbox tiếp theo được cắt.

`Mantis Scenario` là entrypoint thủ công chung. Nó nhận `scenario_id`, `candidate_ref`, `baseline_ref` tùy chọn và `pr_number` tùy chọn, rồi dispatch workflow do kịch bản sở hữu. Wrapper này cố ý mỏng: workflow kịch bản vẫn sở hữu thiết lập transport, credential, lớp VM, oracle kỳ vọng và manifest artifact của nó.

`Mantis Slack Desktop Smoke` là workflow VM Slack đầu tiên. Nó checkout ref ứng viên đáng tin cậy trong một worktree riêng, thuê desktop Linux Crabbox, chạy `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` với ứng viên đó, mở Slack Web trong trình duyệt VNC, ghi lại desktop, tạo preview đã cắt theo chuyển động bằng `crabbox media preview`, tải lên toàn bộ thư mục artifact và tùy chọn đăng bình luận bằng chứng inline trên PR mục tiêu. Dùng lane này khi bạn muốn "một desktop Linux có Slack và một claw đang chạy" thay vì chỉ một transcript Slack bot-to-bot.

Mọi kịch bản xuất bản PR đều ghi `mantis-evidence.json` cạnh báo cáo của nó. Schema này là phần bàn giao giữa code kịch bản và bình luận GitHub:

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

Giá trị `path` của artifact tương đối với thư mục manifest. Giá trị `targetPath` là đường dẫn tương đối dưới thư mục publish nhánh `qa-artifacts`. Publisher từ chối path traversal và bỏ qua các mục được đánh dấu `"required": false` khi preview hoặc video tùy chọn không khả dụng.

Các kind artifact được hỗ trợ:

- `timeline`: ảnh chụp màn hình kịch bản xác định, thường là trước/sau.
- `desktopScreenshot`: ảnh chụp màn hình desktop VNC/trình duyệt.
- `motionPreview`: GIF động inline được tạo từ bản ghi desktop.
- `motionClip`: MP4 đã cắt theo chuyển động, loại bỏ phần tĩnh đầu và cuối.
- `fullVideo`: bản ghi MP4 đầy đủ để kiểm tra sâu.
- `metadata`: sidecar JSON/log.
- `report`: báo cáo Markdown.

Publisher tái sử dụng là `scripts/mantis/publish-pr-evidence.mjs`. Workflow gọi nó với manifest, PR mục tiêu, root mục tiêu `qa-artifacts`, marker bình luận, URL artifact Actions, URL lượt chạy và nguồn yêu cầu. Nó sao chép các artifact đã khai báo sang nhánh `qa-artifacts`, build một bình luận PR đặt tóm tắt lên trước với ảnh/preview inline và video được liên kết, rồi cập nhật bình luận marker hiện có hoặc tạo mới.

Bạn cũng có thể kích hoạt trực tiếp lượt chạy status-reactions từ bình luận PR:

```text
@Mantis discord status reactions
```

Trigger bình luận này được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull request từ người dùng có quyền write, maintain hoặc admin, và chỉ nhận dạng yêu cầu status-reaction của Discord. Theo mặc định, nó dùng ref baseline lỗi đã biết và SHA head PR hiện tại làm ứng viên. Maintainer có thể ghi đè một trong hai ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh xạ một PR
hoặc issue tới các kịch bản Mantis được khuyến nghị từ nhãn, tệp đã thay đổi và
các phát hiện đánh giá của ClawSweeper.

## Vòng đời chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng một VM.
3. Chuẩn bị hồ sơ desktop/trình duyệt khi kịch bản cần bằng chứng UI.
4. Chuẩn bị một checkout sạch cho ref baseline.
5. Cài đặt dependency và chỉ build những gì kịch bản cần.
6. Khởi động một OpenClaw Gateway con với thư mục trạng thái cô lập.
7. Cấu hình transport trực tiếp, nhà cung cấp, model và hồ sơ trình duyệt.
8. Chạy kịch bản và thu thập bằng chứng baseline.
9. Dừng gateway và giữ lại log.
10. Chuẩn bị ref candidate trong cùng VM.
11. Chạy cùng kịch bản và thu thập bằng chứng candidate.
12. So sánh kết quả oracle và bằng chứng trực quan.
13. Ghi Markdown, JSON, log, ảnh chụp màn hình và các artifact trace tùy chọn.
14. Tải artifact GitHub Actions lên.
15. Đăng một thông báo trạng thái PR hoặc Discord ngắn gọn.

Kịch bản phải có thể thất bại theo hai cách khác nhau:

- **Đã tái hiện lỗi**: baseline thất bại theo cách dự kiến.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt hoặc
  nhà cung cấp thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm lẫn một môi trường
không ổn định với hành vi của sản phẩm.

## MVP Discord

Kịch bản đầu tiên nên nhắm tới phản ứng trạng thái Discord trong các kênh guild nơi
chế độ gửi trả lời nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng phản ứng trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái phản ứng tin nhắn Discord.
- Nó kiểm tra một OpenClaw Gateway thật, xác thực bot Discord, điều phối tin nhắn,
  chế độ gửi trả lời nguồn, trạng thái phản ứng trạng thái và vòng đời lượt model.
- Nó đủ hẹp để giữ cho triển khai đầu tiên trung thực.

Hình dạng kịch bản dự kiến:

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

Bằng chứng baseline phải cho thấy phản ứng xác nhận đã xếp hàng nhưng không có
chuyển tiếp vòng đời trong chế độ chỉ dùng công cụ. Bằng chứng candidate phải cho thấy các phản ứng
trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được đặt rõ ràng là
true.

Lát cắt thực thi đầu tiên là kịch bản QA trực tiếp Discord opt-in:

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
"message_tool"`, `ackReaction: "👀"`, và phản ứng trạng thái rõ ràng. Oracle
poll tin nhắn kích hoạt Discord thật và kỳ vọng chuỗi quan sát được
`👀 -> 🤔 -> 👍`. Artifact bao gồm `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, và
`discord-status-reactions-tool-only-timeline.png`.

## Các phần QA hiện có

Mantis nên xây dựng trên stack QA riêng tư hiện có thay vì bắt đầu từ
con số không:

- `pnpm openclaw qa discord` đã chạy một lane Discord trực tiếp với driver và
  bot SUT.
- Trình chạy transport trực tiếp đã ghi báo cáo và artifact tin nhắn quan sát được
  trong `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực
  transport trực tiếp dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot,
  hồ sơ được quản lý không giao diện và hồ sơ CDP từ xa.
- QA Lab đã có UI trình gỡ lỗi và bus cho kiểm thử theo hình dạng transport.

Triển khai Mantis đầu tiên có thể là một trình chạy trước/sau mỏng trên các phần
này, cộng thêm một lớp bằng chứng trực quan.

## Mô hình bằng chứng

Mỗi lần chạy ghi một thư mục artifact ổn định:

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

`mantis-summary.json` phải là nguồn sự thật máy đọc được. Báo cáo
Markdown dành cho bình luận PR và đánh giá của con người.

Tóm tắt phải bao gồm:

- ref và SHA đã kiểm thử
- transport và id kịch bản
- nhà cung cấp máy và id máy hoặc id lease
- nguồn thông tin xác thực không có giá trị bí mật
- kết quả baseline
- kết quả candidate
- lỗi có được tái hiện trên baseline hay không
- candidate có sửa được lỗi hay không
- đường dẫn artifact
- vấn đề thiết lập hoặc dọn dẹp đã được lọc thông tin nhạy cảm

Ảnh chụp màn hình là bằng chứng, không phải bí mật. Chúng vẫn cần kỷ luật biên tập:
tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Với PR công khai,
ưu tiên liên kết artifact GitHub Actions hơn ảnh inline cho đến khi câu chuyện biên tập
mạnh hơn.

## Trình duyệt và VNC

Lane trình duyệt có hai chế độ:

- **Tự động hóa không giao diện**: mặc định cho CI. Chrome chạy với CDP được bật, và
  Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord,
  hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền để tránh
đăng nhập cho mỗi lần chạy, nhưng tách biệt khỏi trạng thái trình duyệt cá nhân. Một hồ sơ
thuộc về nhóm máy Mantis, không thuộc về laptop của developer.

Khi Mantis bị kẹt, nó đăng một thông báo trạng thái Discord với:

- id lần chạy
- id kịch bản
- nhà cung cấp máy
- thư mục artifact
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản chặn ngắn

Triển khai riêng tư đầu tiên có thể đăng các thông báo này vào kênh operator
hiện có và chuyển sang kênh Mantis chuyên dụng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên.
Crabbox cung cấp máy đã được làm nóng, theo dõi lease, hydration, log, kết quả và
dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, thêm một nhà cung cấp Hetzner
đằng sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có Chrome hoặc Chromium có thể chạy desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và cache dependency
- cache trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt và một lần chạy model
- quyền truy cập outbound tới Discord, GitHub, nhà cung cấp model và broker thông tin xác thực

VM không nên giữ bí mật thô tồn tại lâu ngoài các kho thông tin xác thực hoặc
hồ sơ trình duyệt dự kiến.

## Bí mật

Bí mật nằm trong secret của tổ chức hoặc repository GitHub cho các lần chạy từ xa, và trong
một tệp bí mật cục bộ do operator kiểm soát cho các lần chạy cục bộ.

Tên secret được khuyến nghị:

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

Về lâu dài, nhóm thông tin xác thực Convex nên vẫn là nguồn bình thường cho thông tin xác thực
transport trực tiếp. GitHub secrets bootstrap broker và các lane fallback.
Workflow Discord status-reactions ánh xạ secret Mantis Crabbox trở lại
các biến môi trường `CRABBOX_COORDINATOR` và `CRABBOX_COORDINATOR_TOKEN`
mà Crabbox CLI kỳ vọng. Tên GitHub secret `CRABBOX_*` thuần vẫn
được chấp nhận làm fallback tương thích.

Trình chạy Mantis không bao giờ được in:

- token bot Discord
- khóa API của nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin xác thực thô

Tải artifact công khai lên cũng nên biên tập metadata mục tiêu Discord như bot,
guild, kênh và id tin nhắn. Workflow smoke GitHub bật
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu một token vô tình bị dán vào issue, PR, chat hoặc log, hãy xoay vòng nó
sau khi secret mới đã được lưu.

## Artifact GitHub và bình luận PR

Workflow Mantis nên tải toàn bộ gói bằng chứng lên dưới dạng artifact Actions
ngắn hạn. Khi workflow được chạy cho một báo cáo lỗi hoặc PR sửa lỗi, nó cũng nên
xuất bản ảnh chụp màn hình PNG đã biên tập lên nhánh `qa-artifacts` và upsert một
bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau inline. Không đăng
bằng chứng chính chỉ trên một PR tự động hóa QA chung. Log thô, tin nhắn quan sát được
và bằng chứng cồng kềnh khác ở lại trong artifact Actions.

Workflow production nên đăng các bình luận đó bằng Mantis GitHub App, không phải
bằng `github-actions[bot]`. Lưu app id và khóa riêng tư dưới dạng
secret GitHub Actions `MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow dùng một marker ẩn làm khóa upsert, cập nhật bình luận đó
khi token có thể sửa nó, và tạo một bình luận mới thuộc sở hữu Mantis khi
một marker cũ thuộc sở hữu bot không thể sửa được.

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
ngụ ý candidate thất bại.

## Ghi chú triển khai riêng tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng ứng dụng đó
thay vì tạo app khác khi nó có quyền bot phù hợp
và có thể được xoay vòng an toàn.

Đặt kênh thông báo operator ban đầu thông qua secret hoặc cấu hình triển khai.
Nó có thể trỏ tới một kênh maintainer hoặc vận hành hiện có
trước, rồi chuyển sang kênh Mantis chuyên dụng khi có.

Không đưa guild id, channel id, bot token, cookie trình duyệt hoặc mật khẩu VNC
vào tài liệu này. Lưu chúng trong GitHub secrets, broker thông tin xác thực hoặc kho bí mật
cục bộ của operator.

## Thêm một kịch bản

Một kịch bản Mantis nên khai báo:

- id và tiêu đề
- transport
- thông tin xác thực bắt buộc
- chính sách ref baseline
- chính sách ref candidate
- bản vá cấu hình OpenClaw
- bước thiết lập
- kích thích
- oracle baseline dự kiến
- oracle candidate dự kiến
- mục tiêu chụp trực quan
- ngân sách thời gian chờ
- bước dọn dẹp

Kịch bản nên ưu tiên các oracle nhỏ, có kiểu:

- trạng thái phản ứng Discord cho lỗi phản ứng
- tham chiếu tin nhắn Discord cho lỗi threading
- thread ts Slack và trạng thái API phản ứng cho lỗi Slack
- id và header tin nhắn email cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là quan sát đáng tin cậy duy nhất

Kiểm tra vision nên có tính bổ sung. Nếu một API nền tảng có thể chứng minh lỗi, hãy dùng
API làm oracle đạt/không đạt và giữ ảnh chụp màn hình để tăng độ tin cậy cho con người.

## Mở rộng nhà cung cấp

Sau Discord, cùng trình chạy có thể thêm:

- Slack: phản ứng, luồng, lượt nhắc đến ứng dụng, modal, tải tệp lên.
- Email: xác thực Gmail và luồng thư bằng `gog` khi các trình kết nối không
  đủ.
- WhatsApp: đăng nhập bằng QR, nhận dạng lại, gửi tin nhắn, phương tiện, phản ứng.
- Telegram: kiểm soát lượt nhắc trong nhóm, lệnh, phản ứng khi có sẵn.
- Matrix: phòng được mã hóa, quan hệ luồng hoặc trả lời, khôi phục sau khi khởi động lại.

Mỗi kênh truyền tải nên có một kịch bản smoke nhẹ và một hoặc nhiều kịch bản
theo lớp lỗi. Các kịch bản trực quan tốn kém nên tiếp tục là tùy chọn tham gia.

## Câu hỏi mở

- Bot Discord nào nên là trình điều khiển và bot nào nên là SUT khi bot Mantis
  hiện có được dùng lại?
- Phiên đăng nhập trình duyệt của quan sát viên nên dùng tài khoản Discord của người dùng thật, tài khoản kiểm thử,
  hay chỉ bằng chứng REST mà bot có thể đọc được trong giai đoạn đầu?
- GitHub nên lưu giữ các artifact Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động đề xuất Mantis thay vì chờ lệnh của
  maintainer?
- Có nên biên tập hoặc cắt ảnh chụp màn hình trước khi tải lên cho các PR công khai không?
