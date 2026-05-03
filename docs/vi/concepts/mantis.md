---
read_when:
    - Xây dựng hoặc chạy kiểm thử trực quan trực tiếp cho các lỗi OpenClaw
    - Thêm xác minh trước và sau cho một yêu cầu kéo
    - Thêm các kịch bản truyền tải trực tiếp cho Discord, Slack, WhatsApp hoặc dịch vụ khác
    - Gỡ lỗi các lần chạy QA cần ảnh chụp màn hình, tự động hóa trình duyệt hoặc quyền truy cập VNC
summary: Mantis là hệ thống xác minh đầu-cuối trực quan để tái hiện lỗi OpenClaw trên các kênh truyền tải trực tiếp, ghi lại bằng chứng trước và sau, và đính kèm hiện vật vào các PR.
title: Bọ ngựa
x-i18n:
    generated_at: "2026-05-03T21:29:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis là hệ thống xác minh đầu-cuối của OpenClaw dành cho các lỗi cần môi trường chạy thật, phương thức truyền tải thật và bằng chứng có thể nhìn thấy. Hệ thống chạy một kịch bản trên một ref được biết là lỗi, thu thập bằng chứng, chạy cùng kịch bản đó trên một ref ứng viên, rồi xuất bản phần so sánh dưới dạng artifact để maintainer có thể kiểm tra từ PR hoặc từ lệnh cục bộ.

Mantis bắt đầu với Discord vì Discord cho chúng ta một làn đầu tiên có giá trị cao: xác thực bot thật, kênh máy chủ thật, reaction, luồng, lệnh gốc và giao diện trình duyệt nơi con người có thể xác nhận trực quan những gì phương thức truyền tải hiển thị.

## Mục tiêu

- Tái hiện lỗi từ một issue hoặc PR trên GitHub với cùng hình dạng phương thức truyền tải mà người dùng thấy.
- Thu thập artifact **trước** trên ref cơ sở trước khi áp dụng bản sửa.
- Thu thập artifact **sau** trên ref ứng viên sau khi áp dụng bản sửa.
- Sử dụng oracle xác định bất cứ khi nào có thể, chẳng hạn như đọc reaction bằng Discord REST hoặc kiểm tra bản ghi kênh.
- Chụp ảnh màn hình khi lỗi có bề mặt giao diện nhìn thấy được.
- Chạy cục bộ từ CLI do tác nhân điều khiển và chạy từ xa từ GitHub.
- Lưu đủ trạng thái máy để cứu hộ bằng VNC khi đăng nhập, tự động hóa trình duyệt hoặc xác thực nhà cung cấp bị kẹt.
- Đăng trạng thái ngắn gọn lên kênh Discord của operator khi lượt chạy bị chặn, cần hỗ trợ VNC thủ công hoặc hoàn tất.

## Không phải mục tiêu

- Mantis không thay thế kiểm thử đơn vị. Một lượt chạy Mantis thường nên trở thành một kiểm thử hồi quy nhỏ hơn sau khi bản sửa đã được hiểu rõ.
- Mantis không phải cổng CI nhanh thông thường. Nó chậm hơn, dùng thông tin xác thực thật và chỉ dành cho các lỗi mà môi trường thật có ý nghĩa.
- Mantis không nên yêu cầu con người trong vận hành bình thường. VNC thủ công là đường cứu hộ, không phải luồng chính.
- Mantis không lưu secret thô trong artifact, log, ảnh chụp màn hình, báo cáo Markdown hoặc bình luận PR.

## Quyền sở hữu

Mantis nằm trong ngăn xếp QA của OpenClaw.

- OpenClaw sở hữu môi trường chạy kịch bản, bộ chuyển đổi phương thức truyền tải, lược đồ bằng chứng và CLI cục bộ trong `pnpm openclaw qa mantis`.
- QA Lab sở hữu các phần harness phương thức truyền tải trực tiếp, helper chụp trình duyệt và trình ghi artifact.
- Crabbox sở hữu các máy Linux đã được làm nóng khi cần VM từ xa.
- GitHub Actions sở hữu điểm vào workflow từ xa và thời gian lưu giữ artifact.
- ClawSweeper sở hữu định tuyến bình luận GitHub: phân tích lệnh của maintainer, dispatch workflow và đăng bình luận PR cuối cùng.
- Các tác nhân OpenClaw điều khiển Mantis thông qua Codex khi kịch bản cần thiết lập có tính tác nhân, gỡ lỗi hoặc báo cáo trạng thái bị kẹt.

Ranh giới này giữ kiến thức về phương thức truyền tải trong OpenClaw, lập lịch máy trong Crabbox và phần keo workflow maintainer trong ClawSweeper.

## Hình dạng lệnh

Lệnh cục bộ đầu tiên xác minh bot Discord, máy chủ, kênh, gửi tin nhắn, gửi reaction và đường dẫn artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Trình chạy trước và sau cục bộ chấp nhận hình dạng này:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Trình chạy tạo các worktree cơ sở và ứng viên tách rời dưới thư mục đầu ra, cài đặt dependency, build từng ref, chạy kịch bản với `--allow-failures`, rồi ghi `baseline/`, `candidate/`, `comparison.json` và `mantis-report.md`. Với kịch bản Discord đầu tiên, xác minh thành công nghĩa là trạng thái cơ sở là `fail` và trạng thái ứng viên là `pass`.

Workflow smoke của GitHub là `Mantis Discord Smoke`. Workflow GitHub trước và sau cho kịch bản thật đầu tiên là `Mantis Discord Status Reactions`. Nó chấp nhận:

- `baseline_ref`: ref được kỳ vọng tái hiện hành vi chỉ-queued.
- `candidate_ref`: ref được kỳ vọng hiển thị `queued -> thinking -> done`.

Nó checkout ref harness workflow, build các worktree cơ sở và ứng viên riêng, chạy `discord-status-reactions-tool-only` trên từng worktree, rồi tải lên `baseline/`, `candidate/`, `comparison.json` và `mantis-report.md` dưới dạng artifact của Actions.

Bạn cũng có thể kích hoạt lượt chạy status-reactions trực tiếp từ bình luận PR:

```text
@Mantis discord status reactions
```

Bộ kích hoạt bình luận được cố ý giới hạn hẹp. Nó chỉ chạy trên bình luận pull request từ người dùng có quyền write, maintain hoặc admin, và chỉ nhận diện các yêu cầu reaction trạng thái của Discord. Theo mặc định, nó dùng ref cơ sở lỗi đã biết và SHA head của PR hiện tại làm ứng viên. Maintainer có thể ghi đè một trong hai ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ví dụ lệnh ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Lệnh đầu tiên rõ ràng và tập trung vào kịch bản. Lệnh thứ hai về sau có thể ánh xạ PR hoặc issue tới các kịch bản Mantis được khuyến nghị từ nhãn, tệp đã thay đổi và phát hiện review của ClawSweeper.

## Vòng đời chạy

1. Lấy thông tin xác thực.
2. Cấp phát hoặc tái sử dụng VM.
3. Chuẩn bị checkout sạch cho ref cơ sở.
4. Cài đặt dependency và chỉ build những gì kịch bản cần.
5. Khởi động OpenClaw Gateway con với thư mục trạng thái cô lập.
6. Cấu hình phương thức truyền tải trực tiếp, nhà cung cấp, mô hình và hồ sơ trình duyệt.
7. Chạy kịch bản và thu thập bằng chứng cơ sở.
8. Dừng gateway và giữ lại log.
9. Chuẩn bị ref ứng viên trong cùng VM.
10. Chạy cùng kịch bản và thu thập bằng chứng ứng viên.
11. So sánh kết quả oracle và bằng chứng trực quan.
12. Ghi Markdown, JSON, log, ảnh chụp màn hình và artifact trace tùy chọn.
13. Tải lên artifact GitHub Actions.
14. Đăng thông báo trạng thái ngắn gọn lên PR hoặc Discord.

Kịch bản nên có khả năng thất bại theo hai cách khác nhau:

- **Lỗi được tái hiện**: cơ sở thất bại theo cách được kỳ vọng.
- **Lỗi harness**: thiết lập môi trường, thông tin xác thực, Discord API, trình duyệt hoặc nhà cung cấp thất bại trước khi oracle lỗi có ý nghĩa.

Báo cáo cuối cùng phải tách riêng các trường hợp này để maintainer không nhầm lẫn môi trường thiếu ổn định với hành vi sản phẩm.

## MVP Discord

Kịch bản đầu tiên nên nhắm tới reaction trạng thái Discord trong các kênh máy chủ nơi chế độ gửi trả lời nguồn là `message_tool_only`.

Vì sao đây là hạt giống Mantis tốt:

- Nó hiển thị trong Discord dưới dạng reaction trên tin nhắn kích hoạt.
- Nó có oracle REST mạnh thông qua trạng thái reaction của tin nhắn Discord.
- Nó kiểm thử OpenClaw Gateway thật, xác thực bot Discord, điều phối tin nhắn, chế độ gửi trả lời nguồn, trạng thái reaction trạng thái và vòng đời lượt mô hình.
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

Bằng chứng cơ sở nên cho thấy reaction xác nhận queued nhưng không có chuyển tiếp vòng đời trong chế độ chỉ-tool. Bằng chứng ứng viên nên cho thấy reaction trạng thái vòng đời chạy khi `messages.statusReactions.enabled` được bật rõ ràng.

Lát cắt thực thi đầu tiên là kịch bản QA trực tiếp Discord dạng opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Nó cấu hình SUT với xử lý máy chủ luôn bật, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` và reaction trạng thái rõ ràng. Oracle thăm dò tin nhắn kích hoạt Discord thật và kỳ vọng chuỗi quan sát được `👀 -> 🤔 -> 👍`. Artifact bao gồm `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` và `discord-status-reactions-tool-only-timeline.png`.

## Các phần QA hiện có

Mantis nên xây dựng trên ngăn xếp QA riêng tư hiện có thay vì bắt đầu từ con số không:

- `pnpm openclaw qa discord` đã chạy một làn Discord trực tiếp với bot driver và SUT.
- Trình chạy phương thức truyền tải trực tiếp đã ghi báo cáo và artifact tin nhắn quan sát được dưới `.artifacts/qa-e2e/`.
- Lease thông tin xác thực Convex đã cung cấp quyền truy cập độc quyền vào thông tin xác thực phương thức truyền tải trực tiếp dùng chung.
- Dịch vụ điều khiển trình duyệt đã hỗ trợ ảnh chụp màn hình, snapshot, hồ sơ được quản lý headless và hồ sơ CDP từ xa.
- QA Lab đã có giao diện gỡ lỗi và bus cho kiểm thử theo hình dạng phương thức truyền tải.

Triển khai Mantis đầu tiên có thể là một trình chạy trước/sau mỏng trên các phần này, cộng thêm một lớp bằng chứng trực quan.

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

`mantis-summary.json` nên là nguồn sự thật máy đọc được. Báo cáo Markdown dành cho bình luận PR và review của con người.

Tóm tắt phải bao gồm:

- các ref và SHA đã kiểm thử
- phương thức truyền tải và id kịch bản
- nhà cung cấp máy và id máy hoặc id lease
- nguồn thông tin xác thực không kèm giá trị secret
- kết quả cơ sở
- kết quả ứng viên
- lỗi có được tái hiện trên cơ sở hay không
- ứng viên có sửa được lỗi hay không
- đường dẫn artifact
- vấn đề thiết lập hoặc dọn dẹp đã được làm sạch

Ảnh chụp màn hình là bằng chứng, không phải secret. Chúng vẫn cần kỷ luật biên tập lại: tên kênh riêng tư, tên người dùng hoặc nội dung tin nhắn có thể xuất hiện. Với PR công khai, ưu tiên liên kết artifact GitHub Actions thay vì ảnh nhúng cho tới khi câu chuyện biên tập lại mạnh hơn.

## Trình duyệt và VNC

Làn trình duyệt có hai chế độ:

- **Tự động hóa headless**: mặc định cho CI. Chrome chạy với CDP được bật, và Playwright hoặc điều khiển trình duyệt OpenClaw chụp ảnh màn hình.
- **Cứu hộ VNC**: bật trên cùng VM khi đăng nhập, MFA, chống tự động hóa của Discord hoặc gỡ lỗi trực quan cần con người.

Hồ sơ trình duyệt quan sát Discord nên đủ bền để tránh đăng nhập cho mỗi lượt chạy, nhưng được cô lập khỏi trạng thái trình duyệt cá nhân. Một hồ sơ thuộc về nhóm máy Mantis, không thuộc về laptop của nhà phát triển.

Khi Mantis bị kẹt, nó đăng thông báo trạng thái Discord với:

- id lượt chạy
- id kịch bản
- nhà cung cấp máy
- thư mục artifact
- hướng dẫn kết nối VNC hoặc noVNC nếu có
- văn bản ngắn về điểm chặn

Triển khai riêng tư đầu tiên có thể đăng các thông báo này lên kênh operator hiện có và chuyển sang kênh Mantis chuyên dụng sau.

## Máy

Mantis nên ưu tiên AWS thông qua Crabbox cho triển khai từ xa đầu tiên. Crabbox cho chúng ta máy đã được làm nóng, theo dõi lease, hydrate, log, kết quả và dọn dẹp. Nếu dung lượng AWS quá chậm hoặc không khả dụng, hãy thêm nhà cung cấp Hetzner phía sau cùng giao diện máy.

Yêu cầu VM tối thiểu:

- Linux có cài đặt Chrome hoặc Chromium hỗ trợ desktop
- quyền truy cập CDP cho tự động hóa trình duyệt
- VNC hoặc noVNC để cứu hộ
- Node 22 và pnpm
- checkout OpenClaw và cache dependency
- cache trình duyệt Playwright Chromium khi dùng Playwright
- đủ CPU và bộ nhớ cho một OpenClaw Gateway, một trình duyệt và một lượt chạy mô hình
- quyền truy cập outbound tới Discord, GitHub, nhà cung cấp mô hình và broker thông tin xác thực

VM không nên giữ secret thô dài hạn bên ngoài các kho thông tin xác thực hoặc hồ sơ trình duyệt dự kiến.

## Secret

Secret nằm trong secret của tổ chức hoặc repository GitHub cho lượt chạy từ xa, và trong tệp secret do operator kiểm soát cục bộ cho lượt chạy cục bộ.

Tên secret được khuyến nghị:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` cho các lần tải artifact công khai lên GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

Về dài hạn, nhóm thông tin đăng nhập Convex nên tiếp tục là nguồn thông thường cho thông tin đăng nhập truyền tải trực tiếp. Secret GitHub khởi tạo broker và các lane dự phòng.

Runner Mantis tuyệt đối không được in:

- mã thông báo bot Discord
- khóa API của nhà cung cấp
- cookie trình duyệt
- nội dung hồ sơ xác thực
- mật khẩu VNC
- payload thông tin đăng nhập thô

Các lần tải artifact công khai cũng nên biên tập siêu dữ liệu mục tiêu Discord như id bot, guild, kênh và tin nhắn. Workflow smoke GitHub bật `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` vì lý do này.

Nếu một mã thông báo vô tình bị dán vào issue, PR, cuộc trò chuyện hoặc log, hãy xoay vòng mã đó sau khi secret mới đã được lưu trữ.

## Artifact GitHub và bình luận PR

Các workflow Mantis nên tải toàn bộ gói bằng chứng lên dưới dạng artifact Actions ngắn hạn. Khi workflow được chạy cho báo cáo lỗi hoặc PR sửa lỗi, workflow cũng nên xuất bản các ảnh chụp màn hình PNG đã biên tập lên nhánh `qa-artifacts` và cập nhật hoặc chèn một bình luận trên lỗi hoặc PR sửa lỗi đó với ảnh chụp màn hình trước/sau nhúng trực tiếp. Không đăng bằng chứng chính chỉ trên một PR tự động hóa QA chung. Log thô, tin nhắn quan sát được và các bằng chứng cồng kềnh khác nằm trong artifact Actions.

Các workflow production nên đăng các bình luận đó bằng GitHub App Mantis, không phải bằng `github-actions[bot]`. Lưu id ứng dụng và khóa riêng tư dưới dạng secret GitHub Actions `MANTIS_GITHUB_APP_ID` và `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow sử dụng một marker ẩn làm khóa cập nhật hoặc chèn, cập nhật bình luận đó khi mã thông báo có thể chỉnh sửa bình luận, và tạo một bình luận mới do Mantis sở hữu khi không thể chỉnh sửa marker cũ do bot sở hữu.

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

Khi lần chạy thất bại vì harness thất bại, bình luận phải nói như vậy thay vì ngụ ý rằng ứng viên thất bại.

## Ghi chú triển khai riêng tư

Một triển khai riêng tư có thể đã có ứng dụng Discord Mantis. Tái sử dụng ứng dụng đó thay vì tạo ứng dụng khác khi ứng dụng có quyền bot phù hợp và có thể được xoay vòng an toàn.

Đặt kênh thông báo người vận hành ban đầu thông qua secret hoặc cấu hình triển khai. Ban đầu kênh đó có thể trỏ tới một kênh maintainer hoặc vận hành hiện có, rồi chuyển sang kênh Mantis chuyên dụng sau khi kênh đó tồn tại.

Không đặt id guild, id kênh, mã thông báo bot, cookie trình duyệt hoặc mật khẩu VNC trong tài liệu này. Lưu chúng trong secret GitHub, broker thông tin đăng nhập hoặc kho secret cục bộ của người vận hành.

## Thêm một kịch bản

Một kịch bản Mantis nên khai báo:

- id và tiêu đề
- phương thức truyền tải
- thông tin đăng nhập bắt buộc
- chính sách ref baseline
- chính sách ref ứng viên
- bản vá cấu hình OpenClaw
- các bước thiết lập
- tác nhân kích thích
- oracle baseline kỳ vọng
- oracle ứng viên kỳ vọng
- mục tiêu chụp trực quan
- ngân sách thời gian chờ
- các bước dọn dẹp

Các kịch bản nên ưu tiên các oracle nhỏ, có kiểu:

- trạng thái reaction Discord cho lỗi reaction
- tham chiếu tin nhắn Discord cho lỗi phân luồng
- ts thread Slack và trạng thái API reaction cho lỗi Slack
- id tin nhắn email và header cho lỗi email
- ảnh chụp màn hình trình duyệt khi UI là đối tượng quan sát đáng tin cậy duy nhất

Kiểm tra thị giác nên mang tính bổ sung. Nếu API nền tảng có thể chứng minh lỗi, hãy dùng API làm oracle đạt/không đạt và giữ ảnh chụp màn hình để con người thêm tin tưởng.

## Mở rộng nhà cung cấp

Sau Discord, cùng runner đó có thể thêm:

- Slack: reaction, thread, đề cập ứng dụng, modal, tải tệp lên.
- Email: xác thực Gmail và phân luồng tin nhắn bằng `gog` khi connector là chưa đủ.
- WhatsApp: đăng nhập QR, nhận dạng lại, gửi tin nhắn, phương tiện, reaction.
- Telegram: kiểm soát đề cập trong nhóm, lệnh, reaction nơi có sẵn.
- Matrix: phòng mã hóa, quan hệ thread hoặc trả lời, tiếp tục sau khởi động lại.

Mỗi phương thức truyền tải nên có một kịch bản smoke rẻ và một hoặc nhiều kịch bản theo lớp lỗi. Các kịch bản trực quan tốn kém nên luôn là tùy chọn bật rõ ràng.

## Câu hỏi mở

- Bot Discord nào nên là driver, và bot nào nên là SUT, khi bot Mantis hiện có được tái sử dụng?
- Đăng nhập trình duyệt quan sát nên dùng tài khoản Discord của con người, tài khoản kiểm thử, hay chỉ bằng chứng REST mà bot có thể đọc cho giai đoạn đầu?
- GitHub nên lưu giữ artifact Mantis cho PR trong bao lâu?
- Khi nào ClawSweeper nên tự động khuyến nghị Mantis thay vì chờ lệnh maintainer?
- Ảnh chụp màn hình có nên được biên tập hoặc cắt trước khi tải lên cho các PR công khai không?
