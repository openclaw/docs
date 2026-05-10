---
read_when:
    - Trả lời các câu hỏi hỗ trợ thường gặp về thiết lập, cài đặt, hướng dẫn ban đầu hoặc thời gian chạy
    - Phân loại sự cố do người dùng báo cáo trước khi gỡ lỗi sâu hơn
summary: Các câu hỏi thường gặp về thiết lập, cấu hình và cách sử dụng OpenClaw
title: Câu hỏi thường gặp
x-i18n:
    generated_at: "2026-05-10T19:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

Câu trả lời nhanh cùng hướng dẫn khắc phục sự cố chuyên sâu hơn cho các thiết lập thực tế (phát triển cục bộ, VPS, đa tác nhân, OAuth/API keys, dự phòng model). Để chẩn đoán khi chạy, xem [Khắc phục sự cố](/vi/gateway/troubleshooting). Để xem tài liệu tham chiếu cấu hình đầy đủ, xem [Cấu hình](/vi/gateway/configuration).

## 60 giây đầu tiên nếu có gì đó bị lỗi

1. **Trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt cục bộ nhanh: OS + bản cập nhật, khả năng truy cập gateway/service, agents/sessions, cấu hình provider + vấn đề runtime (khi gateway có thể truy cập được).

2. **Báo cáo có thể dán (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc với phần cuối log (token đã được che).

3. **Trạng thái daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime supervisor so với khả năng truy cập RPC, URL mục tiêu của probe, và cấu hình mà service có khả năng đã dùng.

4. **Probe chuyên sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy một probe sức khỏe Gateway trực tiếp, bao gồm probe kênh khi được hỗ trợ
   (yêu cầu Gateway có thể truy cập được). Xem [Sức khỏe](/vi/gateway/health).

5. **Theo dõi log mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC ngừng hoạt động, dùng phương án dự phòng:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file tách biệt với log service; xem [Ghi log](/vi/logging) và [Khắc phục sự cố](/vi/gateway/troubleshooting).

6. **Chạy doctor (sửa chữa)**

   ```bash
   openclaw doctor
   ```

   Sửa chữa/di trú cấu hình/trạng thái + chạy kiểm tra sức khỏe. Xem [Doctor](/vi/gateway/doctor).

7. **Ảnh chụp trạng thái Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Yêu cầu Gateway đang chạy cung cấp ảnh chụp trạng thái đầy đủ (chỉ WS). Xem [Sức khỏe](/vi/gateway/health).

## Khởi động nhanh và thiết lập lần chạy đầu

Hỏi đáp lần chạy đầu — cài đặt, onboarding, tuyến xác thực, đăng ký, lỗi ban đầu —
nằm trong [FAQ lần chạy đầu](/vi/help/faq-first-run).

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là trợ lý AI cá nhân bạn chạy trên thiết bị của riêng mình. Nó trả lời trên các bề mặt nhắn tin bạn đã dùng (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, và các Plugin kênh đi kèm như QQ Bot) và cũng có thể dùng thoại + Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Đề xuất giá trị">
    OpenClaw không phải "chỉ là một wrapper cho Claude." Đây là một **mặt phẳng điều khiển ưu tiên cục bộ** cho phép bạn chạy một
    trợ lý có năng lực trên **phần cứng của riêng bạn**, có thể truy cập từ các ứng dụng chat bạn đã dùng, với
    phiên có trạng thái, bộ nhớ và công cụ - mà không phải trao quyền kiểm soát quy trình làm việc của bạn cho một
    SaaS lưu trú.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất cứ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử phiên ở cục bộ.
    - **Kênh thật, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/v.v.,
      cùng với thoại di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc model:** dùng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với định tuyến
      và dự phòng theo từng agent.
    - **Tùy chọn chỉ cục bộ:** chạy model cục bộ để **toàn bộ dữ liệu có thể nằm trên thiết bị của bạn** nếu bạn muốn.
    - **Định tuyến đa tác nhân:** tách agent theo kênh, tài khoản hoặc tác vụ, mỗi agent có
      workspace và mặc định riêng.
    - **Mã nguồn mở và dễ tùy biến:** kiểm tra, mở rộng và tự lưu trú mà không bị khóa vào nhà cung cấp.

    Tài liệu: [Gateway](/vi/gateway), [Kênh](/vi/channels), [Đa tác nhân](/vi/concepts/multi-agent),
    [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập xong - nên làm gì trước?">
    Các dự án đầu tiên phù hợp:

    - Xây dựng một website (WordPress, Shopify hoặc một trang tĩnh đơn giản).
    - Tạo mẫu một ứng dụng di động (đề cương, màn hình, kế hoạch API).
    - Sắp xếp file và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa bản tóm tắt hoặc theo dõi tiếp.

    Nó có thể xử lý tác vụ lớn, nhưng hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    dùng tác nhân con cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hằng ngày hàng đầu cho OpenClaw là gì?">
    Lợi ích hằng ngày thường trông như sau:

    - **Bản tin cá nhân:** tóm tắt hộp thư đến, lịch và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt và bản nháp đầu cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi tiếp:** lời nhắc và checklist được điều khiển bởi cron hoặc Heartbeat.
    - **Tự động hóa trình duyệt:** điền biểu mẫu, thu thập dữ liệu và lặp lại tác vụ web.
    - **Điều phối đa thiết bị:** gửi tác vụ từ điện thoại, để Gateway chạy trên server, rồi nhận kết quả lại trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể hỗ trợ tạo lead, tiếp cận, quảng cáo và blog cho SaaS không?">
    Có, cho **nghiên cứu, đánh giá chất lượng và soạn thảo**. Nó có thể quét site, lập danh sách rút gọn,
    tóm tắt khách hàng tiềm năng và viết bản nháp tiếp cận hoặc nội dung quảng cáo.

    Với **chiến dịch tiếp cận hoặc chạy quảng cáo**, hãy giữ con người trong vòng kiểm soát. Tránh spam, tuân thủ luật địa phương và
    chính sách nền tảng, đồng thời rà soát mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn nháp và bạn phê duyệt.

    Tài liệu: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Ưu điểm so với Claude Code cho phát triển web là gì?">
    OpenClaw là một **trợ lý cá nhân** và lớp điều phối, không phải công cụ thay thế IDE. Dùng
    Claude Code hoặc Codex cho vòng lặp viết mã trực tiếp nhanh nhất bên trong repo. Dùng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị và điều phối công cụ.

    Ưu điểm:

    - **Bộ nhớ + workspace liên tục** qua các phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, file, lập lịch, hook)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ mọi nơi)
    - **Nodes** cho trình duyệt/màn hình/camera/exec cục bộ

    Trưng bày: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills và tự động hóa

<AccordionGroup>
  <Accordion title="Làm thế nào để tùy chỉnh skills mà không làm repo bị bẩn?">
    Dùng override được quản lý thay vì chỉnh sửa bản sao trong repo. Đặt thay đổi của bạn trong `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, nên override được quản lý vẫn thắng skills đi kèm mà không chạm vào git. Nếu bạn cần skill được cài toàn cục nhưng chỉ hiển thị với một số agent, giữ bản sao dùng chung trong `~/.openclaw/skills` và kiểm soát khả năng hiển thị bằng `agents.defaults.skills` và `agents.list[].skills`. Chỉ những chỉnh sửa đáng đưa upstream mới nên nằm trong repo và được gửi dưới dạng PR.
  </Accordion>

  <Accordion title="Tôi có thể tải skills từ một thư mục tùy chỉnh không?">
    Có. Thêm thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (ưu tiên thấp nhất). Thứ tự ưu tiên mặc định là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` cài vào `./skills` theo mặc định, nơi OpenClaw coi là `<workspace>/skills` trong phiên tiếp theo. Nếu skill chỉ nên hiển thị với một số agent nhất định, hãy kết hợp với `agents.defaults.skills` hoặc `agents.list[].skills`.
  </Accordion>

  <Accordion title="Làm thế nào để dùng các model khác nhau cho các tác vụ khác nhau?">
    Hiện tại các mẫu được hỗ trợ là:

    - **Cron jobs**: các job biệt lập có thể đặt override `model` theo từng job.
    - **Tác nhân con**: định tuyến tác vụ tới các agent riêng với model mặc định khác nhau.
    - **Chuyển đổi theo nhu cầu**: dùng `/model` để chuyển model của phiên hiện tại bất cứ lúc nào.

    Xem [Cron jobs](/vi/automation/cron-jobs), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị đứng khi làm việc nặng. Làm sao để chuyển tải việc đó?">
    Dùng **tác nhân con** cho tác vụ dài hoặc song song. Tác nhân con chạy trong phiên riêng,
    trả về bản tóm tắt và giữ chat chính của bạn phản hồi nhanh.

    Yêu cầu bot của bạn "spawn a sub-agent for this task" hoặc dùng `/subagents`.
    Dùng `/status` trong chat để xem Gateway đang làm gì ngay lúc này (và có đang bận không).

    Mẹo token: tác vụ dài và tác nhân con đều tiêu thụ token. Nếu lo ngại chi phí, đặt
    model rẻ hơn cho tác nhân con qua `agents.defaults.subagents.model`.

    Tài liệu: [Tác nhân con](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Phiên tác nhân con gắn với thread hoạt động thế nào trên Discord?">
    Dùng liên kết thread. Bạn có thể liên kết một thread Discord với một tác nhân con hoặc mục tiêu phiên để các tin nhắn tiếp theo trong thread đó vẫn ở trên phiên đã liên kết.

    Luồng cơ bản:

    - Spawn bằng `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"` để theo dõi tiếp bền vững).
    - Hoặc liên kết thủ công bằng `/focus <target>`.
    - Dùng `/agents` để kiểm tra trạng thái liên kết.
    - Dùng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát auto-unfocus.
    - Dùng `/unfocus` để tách thread.

    Cấu hình bắt buộc:

    - Mặc định toàn cục: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override cho Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động liên kết khi spawn: `channels.discord.threadBindings.spawnSessions` mặc định là `true`; đặt thành `false` để tắt spawn phiên gắn với thread.

    Tài liệu: [Tác nhân con](/vi/tools/subagents), [Discord](/vi/channels/discord), [Tham chiếu cấu hình](/vi/gateway/configuration-reference), [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Một tác nhân con đã hoàn tất, nhưng cập nhật hoàn tất đi sai chỗ hoặc không bao giờ được đăng. Tôi nên kiểm tra gì?">
    Trước tiên hãy kiểm tra tuyến requester đã phân giải:

    - Việc gửi tác nhân con ở chế độ hoàn tất ưu tiên mọi thread đã liên kết hoặc tuyến hội thoại khi có.
    - Nếu nguồn hoàn tất chỉ mang một kênh, OpenClaw sẽ quay về tuyến đã lưu của phiên requester (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn có thể thành công.
    - Nếu không có tuyến đã liên kết cũng như tuyến đã lưu có thể dùng, gửi trực tiếp có thể thất bại và kết quả sẽ quay về hàng đợi gửi phiên thay vì đăng ngay vào chat.
    - Mục tiêu không hợp lệ hoặc đã lỗi thời vẫn có thể buộc quay về hàng đợi hoặc khiến gửi cuối cùng thất bại.
    - Nếu phản hồi trợ lý hiển thị cuối cùng của child là đúng token im lặng `NO_REPLY` / `no_reply`, hoặc đúng `ANNOUNCE_SKIP`, OpenClaw cố ý chặn thông báo thay vì đăng tiến độ cũ đã lỗi thời.
    - Nếu child hết thời gian sau chỉ các tool call, thông báo có thể gộp phần đó thành một bản tóm tắt tiến độ một phần ngắn thay vì phát lại output công cụ thô.

    Gỡ lỗi:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác nhân con](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks), [Công cụ phiên](/vi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron hoặc nhắc nhở không chạy. Tôi nên kiểm tra gì?">
    Cron chạy bên trong tiến trình Gateway. Nếu Gateway không chạy liên tục,
    các job đã lập lịch sẽ không chạy.

    Checklist:

    - Xác nhận cron đã bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` không được đặt.
    - Kiểm tra Gateway đang chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh cài đặt múi giờ cho job (`--tz` so với múi giờ host).

    Gỡ lỗi:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Cron jobs](/vi/automation/cron-jobs), [Tự động hóa & tác vụ](/vi/automation).

  </Accordion>

  <Accordion title="Cron đã kích hoạt, nhưng không có gì được gửi tới kênh. Vì sao?">
    Trước tiên hãy kiểm tra chế độ gửi:

    - `--no-deliver` / `delivery.mode: "none"` nghĩa là không kỳ vọng có lượt gửi dự phòng từ trình chạy.
    - Thiếu hoặc không hợp lệ mục tiêu thông báo (`channel` / `to`) nghĩa là trình chạy đã bỏ qua việc gửi ra ngoài.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là trình chạy đã cố gửi nhưng thông tin đăng nhập đã chặn việc đó.
    - Kết quả cô lập im lặng (chỉ có `NO_REPLY` / `no_reply`) được xem là cố ý không thể gửi, nên trình chạy cũng chặn việc gửi dự phòng đã xếp hàng.

    Với các tác vụ cron cô lập, tác nhân vẫn có thể gửi trực tiếp bằng công cụ
    `message` khi có tuyến trò chuyện khả dụng. `--announce` chỉ kiểm soát đường
    dự phòng của trình chạy cho văn bản cuối cùng mà tác nhân chưa tự gửi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Vì sao một lần chạy cron cô lập lại chuyển mô hình hoặc thử lại một lần?">
    Đó thường là đường chuyển mô hình trực tiếp, không phải lập lịch trùng lặp.

    Cron cô lập có thể lưu một lần chuyển giao mô hình lúc chạy và thử lại khi lần
    chạy đang hoạt động ném `LiveSessionModelSwitchError`. Lần thử lại giữ nguyên
    nhà cung cấp/mô hình đã chuyển, và nếu lần chuyển đó mang theo một ghi đè hồ sơ
    xác thực mới, cron cũng lưu nó trước khi thử lại.

    Các quy tắc chọn liên quan:

    - Ghi đè mô hình của móc Gmail thắng trước khi áp dụng được.
    - Sau đó là `model` theo từng tác vụ.
    - Sau đó là bất kỳ ghi đè mô hình phiên cron nào đã lưu.
    - Sau đó là lựa chọn mô hình tác nhân/mặc định thông thường.

    Vòng lặp thử lại có giới hạn. Sau lần thử ban đầu cộng với 2 lần thử lại do chuyển đổi,
    cron hủy thay vì lặp mãi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [CLI cron](/vi/cli/cron).

  </Accordion>

  <Accordion title="Tôi cài Skills trên Linux như thế nào?">
    Dùng các lệnh `openclaw skills` gốc hoặc thả skills vào không gian làm việc của bạn. Giao diện Skills trên macOS không có trên Linux.
    Duyệt skills tại [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` gốc ghi vào thư mục `skills/` của không gian làm việc
    đang hoạt động. Chỉ cài CLI `clawhub` riêng nếu bạn muốn xuất bản hoặc đồng bộ
    skills của riêng mình. Với cài đặt dùng chung giữa các tác nhân, đặt skill dưới
    `~/.openclaw/skills` và dùng `agents.defaults.skills` hoặc
    `agents.list[].skills` nếu bạn muốn thu hẹp tác nhân nào có thể thấy nó.

  </Accordion>

  <Accordion title="OpenClaw có thể chạy tác vụ theo lịch hoặc liên tục trong nền không?">
    Có. Dùng bộ lập lịch Gateway:

    - **Tác vụ Cron** cho các tác vụ đã lên lịch hoặc lặp lại (tồn tại qua các lần khởi động lại).
    - **Heartbeat** cho các lần kiểm tra định kỳ của "phiên chính".
    - **Tác vụ cô lập** cho các tác nhân tự chủ đăng bản tóm tắt hoặc gửi tới trò chuyện.

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa & Tác vụ](/vi/automation),
    [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy skills chỉ dành cho Apple macOS từ Linux không?">
    Không trực tiếp. Skills macOS bị kiểm soát bởi `metadata.openclaw.os` cùng các tệp nhị phân bắt buộc, và skills chỉ xuất hiện trong prompt hệ thống khi chúng đủ điều kiện trên **máy chủ Gateway**. Trên Linux, skills chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè cơ chế kiểm soát.

    Bạn có ba mẫu được hỗ trợ:

    **Tùy chọn A - chạy Gateway trên Mac (đơn giản nhất).**
    Chạy Gateway ở nơi có các tệp nhị phân macOS, rồi kết nối từ Linux ở [chế độ từ xa](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Skills tải bình thường vì máy chủ Gateway là macOS.

    **Tùy chọn B - dùng một Node macOS (không cần SSH).**
    Chạy Gateway trên Linux, ghép đôi một Node macOS (ứng dụng thanh menu), và đặt **Lệnh chạy Node** thành "Luôn hỏi" hoặc "Luôn cho phép" trên Mac. OpenClaw có thể xem skills chỉ dành cho macOS là đủ điều kiện khi các tệp nhị phân bắt buộc tồn tại trên Node. Tác nhân chạy các skills đó qua công cụ `nodes`. Nếu bạn chọn "Luôn hỏi", việc phê duyệt "Luôn cho phép" trong prompt sẽ thêm lệnh đó vào danh sách cho phép.

    **Tùy chọn C - proxy tệp nhị phân macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các tệp nhị phân CLI bắt buộc phân giải tới các trình bao bọc SSH chạy trên Mac. Sau đó ghi đè skill để cho phép Linux, nhờ đó skill vẫn đủ điều kiện.

    1. Tạo một trình bao bọc SSH cho tệp nhị phân (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đặt trình bao bọc trên `PATH` trên máy chủ Linux (ví dụ `~/bin/memo`).
    3. Ghi đè siêu dữ liệu skill (không gian làm việc hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu một phiên mới để bản chụp nhanh skills được làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Hiện chưa có tích hợp sẵn.

    Các tùy chọn:

    - **Skill / Plugin tùy chỉnh:** phù hợp nhất để truy cập API đáng tin cậy (Notion/HeyGen đều có API).
    - **Tự động hóa trình duyệt:** hoạt động không cần mã nhưng chậm hơn và mong manh hơn.

    Nếu bạn muốn giữ ngữ cảnh theo từng khách hàng (quy trình làm việc của agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (ngữ cảnh + tùy chọn + công việc đang hoạt động).
    - Yêu cầu tác nhân lấy trang đó khi bắt đầu phiên.

    Nếu bạn muốn tích hợp gốc, hãy mở yêu cầu tính năng hoặc xây dựng một skill
    nhắm tới các API đó.

    Cài đặt skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Các bản cài đặt gốc nằm trong thư mục `skills/` của không gian làm việc đang hoạt động. Với skills dùng chung giữa các tác nhân, đặt chúng trong `~/.openclaw/skills/<name>/SKILL.md`. Nếu chỉ một số tác nhân nên thấy một bản cài đặt dùng chung, hãy cấu hình `agents.defaults.skills` hoặc `agents.list[].skills`. Một số skills yêu cầu tệp nhị phân được cài qua Homebrew; trên Linux điều đó có nghĩa là Linuxbrew (xem mục Hỏi đáp Homebrew Linux ở trên). Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và [ClawHub](/vi/clawhub).

  </Accordion>

  <Accordion title="Tôi dùng Chrome hiện có đã đăng nhập với OpenClaw như thế nào?">
    Dùng hồ sơ trình duyệt `user` tích hợp sẵn, hồ sơ này gắn qua Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Nếu bạn muốn tên tùy chỉnh, hãy tạo một hồ sơ MCP rõ ràng:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Đường này có thể dùng trình duyệt máy chủ cục bộ hoặc một Node trình duyệt đã kết nối. Nếu Gateway chạy ở nơi khác, hãy chạy máy chủ Node trên máy có trình duyệt hoặc dùng CDP từ xa thay thế.

    Các giới hạn hiện tại của `existing-session` / `user`:

    - hành động dựa trên ref, không dựa trên bộ chọn CSS
    - tải lên yêu cầu `ref` / `inputRef` và hiện hỗ trợ mỗi lần một tệp
    - `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn cần trình duyệt được quản lý hoặc hồ sơ CDP thô

  </Accordion>
</AccordionGroup>

## Cách ly và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu riêng về cách ly không?">
    Có. Xem [Cách ly](/vi/gateway/sandboxing). Với thiết lập riêng cho Docker (Gateway đầy đủ trong Docker hoặc ảnh cách ly), xem [Docker](/vi/install/docker).
  </Accordion>

  <Accordion title="Docker có vẻ bị giới hạn - làm sao bật đầy đủ tính năng?">
    Ảnh mặc định ưu tiên bảo mật và chạy với người dùng `node`, nên nó không
    bao gồm các gói hệ thống, Homebrew, hoặc trình duyệt đi kèm. Để thiết lập đầy đủ hơn:

    - Duy trì `/home/node` với `OPENCLAW_HOME_VOLUME` để bộ nhớ đệm còn tồn tại.
    - Nướng các phụ thuộc hệ thống vào ảnh bằng `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Cài trình duyệt Playwright qua CLI đi kèm:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và bảo đảm đường dẫn được duy trì.

    Tài liệu: [Docker](/vi/install/docker), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DM riêng tư nhưng làm cho nhóm công khai/được cách ly bằng một tác nhân không?">
    Có - nếu lưu lượng riêng tư của bạn là **DMs** và lưu lượng công khai của bạn là **nhóm**.

    Dùng `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (khóa không phải chính) chạy trong phần phụ trợ cách ly đã cấu hình, trong khi phiên DM chính vẫn ở trên máy chủ. Docker là phần phụ trợ mặc định nếu bạn không chọn phần nào. Sau đó giới hạn các công cụ khả dụng trong phiên được cách ly qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Nhóm: DM cá nhân + nhóm công khai](/vi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham chiếu cấu hình chính: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Tôi gắn một thư mục máy chủ vào môi trường cách ly như thế nào?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Các gắn kết toàn cục + theo tác nhân được hợp nhất; gắn kết theo tác nhân bị bỏ qua khi `scope: "shared"`. Dùng `:ro` cho mọi thứ nhạy cảm và nhớ rằng các gắn kết bỏ qua tường hệ thống tệp của môi trường cách ly.

    OpenClaw xác thực nguồn gắn kết theo cả đường dẫn đã chuẩn hóa và đường dẫn chính tắc được phân giải qua tổ tiên sâu nhất đang tồn tại. Điều đó nghĩa là việc thoát qua cha là liên kết tượng trưng vẫn thất bại đóng ngay cả khi đoạn đường dẫn cuối chưa tồn tại, và các kiểm tra gốc được phép vẫn áp dụng sau khi phân giải liên kết tượng trưng.

    Xem [Cách ly](/vi/gateway/sandboxing#custom-bind-mounts) và [Cách ly so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để biết ví dụ và ghi chú an toàn.

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong không gian làm việc của tác nhân:

    - Ghi chú hằng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn được tuyển chọn trong `MEMORY.md` (chỉ phiên chính/riêng tư)

    OpenClaw cũng chạy một **lần xả bộ nhớ im lặng trước Compaction** để nhắc mô hình
    ghi các ghi chú bền vững trước khi tự động Compaction. Việc này chỉ chạy khi không gian làm việc
    có thể ghi (môi trường cách ly chỉ đọc sẽ bỏ qua). Xem [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên thông tin. Làm sao để nó ghi nhớ lâu dài?">
    Yêu cầu bot **ghi sự kiện vào bộ nhớ**. Ghi chú dài hạn thuộc về `MEMORY.md`,
    ngữ cảnh ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là một lĩnh vực chúng tôi đang cải thiện. Việc nhắc mô hình lưu ký ức sẽ hữu ích;
    nó sẽ biết phải làm gì. Nếu nó tiếp tục quên, hãy xác minh Gateway đang dùng cùng một
    không gian làm việc trong mọi lần chạy.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Không gian làm việc tác nhân](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi không? Giới hạn là gì?">
    Các tệp bộ nhớ nằm trên đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là
    dung lượng lưu trữ của bạn, không phải mô hình. **Ngữ cảnh phiên** vẫn bị giới hạn bởi cửa sổ
    ngữ cảnh của mô hình, nên các cuộc trò chuyện dài có thể được compact hoặc cắt ngắn. Đó là lý do
    tồn tại tìm kiếm bộ nhớ - nó chỉ kéo các phần liên quan trở lại ngữ cảnh.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Ngữ cảnh](/vi/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có yêu cầu khóa API OpenAI không?">
    Chỉ khi bạn dùng **embedding của OpenAI**. OAuth của Codex bao phủ chat/completions và
    **không** cấp quyền truy cập embedding, vì vậy **đăng nhập bằng Codex (OAuth hoặc
    đăng nhập Codex CLI)** không giúp ích cho tìm kiếm bộ nhớ ngữ nghĩa. Embedding của OpenAI
    vẫn cần một khóa API thật (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt rõ nhà cung cấp, OpenClaw sẽ tự chọn nhà cung cấp khi có thể
    phân giải một khóa API (hồ sơ xác thực, `models.providers.*.apiKey`, hoặc biến môi trường).
    Nó ưu tiên OpenAI nếu phân giải được khóa OpenAI, nếu không thì Gemini nếu phân giải được
    khóa Gemini, rồi Voyage, rồi Mistral. Nếu không có khóa từ xa nào, tìm kiếm bộ nhớ
    vẫn bị tắt cho đến khi bạn cấu hình. Nếu bạn đã cấu hình và có sẵn đường dẫn mô hình cục bộ,
    OpenClaw
    ưu tiên `local`. Ollama được hỗ trợ khi bạn đặt rõ
    `memorySearch.provider = "ollama"`.

    Nếu bạn muốn giữ mọi thứ cục bộ, đặt `memorySearch.provider = "local"` (và tùy chọn
    `memorySearch.fallback = "none"`). Nếu bạn muốn dùng embedding của Gemini, đặt
    `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc
    `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ các mô hình embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, hoặc local** -
    xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Nơi các thành phần nằm trên ổ đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu dùng với OpenClaw có được lưu cục bộ không?">
    Không - **trạng thái của OpenClaw là cục bộ**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho họ**.

    - **Mặc định là cục bộ:** phiên, tệp bộ nhớ, cấu hình, và workspace nằm trên máy chủ Gateway
      (`~/.openclaw` + thư mục workspace của bạn).
    - **Từ xa do bắt buộc:** tin nhắn bạn gửi tới nhà cung cấp mô hình (Anthropic/OpenAI/v.v.) đi tới
      API của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/v.v.) lưu dữ liệu tin nhắn trên
      máy chủ của họ.
    - **Bạn kiểm soát phạm vi dữ liệu:** dùng mô hình cục bộ giữ prompt trên máy của bạn, nhưng lưu lượng
      kênh vẫn đi qua máy chủ của kênh đó.

    Liên quan: [Workspace của agent](/vi/concepts/agent-workspace), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu dữ liệu ở đâu?">
    Mọi thứ nằm dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                       | Mục đích                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (được sao chép vào hồ sơ xác thực khi dùng lần đầu)  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, khóa API, và `keyRef`/`tokenRef` tùy chọn)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload bí mật tùy chọn dựa trên tệp cho nhà cung cấp SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được xóa sạch)       |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái nhà cung cấp (ví dụ `whatsapp/<accountId>/creds.json`)  |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái theo agent (agentDir + phiên)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử hội thoại & trạng thái (theo agent)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Siêu dữ liệu phiên (theo agent)                                    |

    Đường dẫn một agent cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`).

    **Workspace** của bạn (AGENTS.md, tệp bộ nhớ, Skills, v.v.) tách riêng và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên nằm ở đâu?">
    Các tệp này nằm trong **workspace của agent**, không phải `~/.openclaw`.

    - **Workspace (theo agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` tùy chọn.
      Root `memory.md` viết thường chỉ là đầu vào sửa chữa cũ; `openclaw doctor --fix`
      có thể hợp nhất nó vào `MEMORY.md` khi cả hai tệp tồn tại.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, trạng thái kênh/nhà cung cấp, hồ sơ xác thực, phiên, log,
      và Skills dùng chung (`~/.openclaw/skills`).

    Workspace mặc định là `~/.openclaw/workspace`, có thể cấu hình qua:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, hãy xác nhận Gateway đang dùng cùng một
    workspace trong mọi lần khởi chạy (và nhớ rằng: chế độ từ xa dùng workspace của **máy chủ gateway**,
    không phải laptop cục bộ của bạn).

    Mẹo: nếu bạn muốn một hành vi hoặc tùy chọn bền vững, hãy yêu cầu bot **ghi nó vào
    AGENTS.md hoặc MEMORY.md** thay vì dựa vào lịch sử chat.

    Xem [Workspace của agent](/vi/concepts/agent-workspace) và [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **workspace của agent** trong một repo git **riêng tư** và sao lưu nó ở một nơi
    riêng tư (ví dụ GitHub private). Cách này lưu lại bộ nhớ + các tệp AGENTS/SOUL/USER,
    và cho phép bạn khôi phục "tâm trí" của trợ lý về sau.

    **Không** commit bất cứ thứ gì dưới `~/.openclaw` (thông tin xác thực, phiên, token, hoặc payload bí mật được mã hóa).
    Nếu bạn cần khôi phục đầy đủ, hãy sao lưu riêng cả workspace và thư mục trạng thái
    (xem câu hỏi về di chuyển ở trên).

    Tài liệu: [Workspace của agent](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm cách nào để gỡ cài đặt OpenClaw hoàn toàn?">
    Xem hướng dẫn riêng: [Gỡ cài đặt](/vi/install/uninstall).
  </Accordion>

  <Accordion title="Agent có thể làm việc bên ngoài workspace không?">
    Có. Workspace là **cwd mặc định** và neo bộ nhớ, không phải sandbox cứng.
    Đường dẫn tương đối được phân giải bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các
    vị trí khác trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cô lập, hãy dùng
    [`agents.defaults.sandbox`](/vi/gateway/sandboxing) hoặc thiết lập sandbox theo agent. Nếu bạn
    muốn một repo là thư mục làm việc mặc định, hãy trỏ `workspace` của agent đó
    tới root của repo. Repo OpenClaw chỉ là mã nguồn; hãy giữ
    workspace tách riêng trừ khi bạn cố ý muốn agent làm việc bên trong đó.

    Ví dụ (repo làm cwd mặc định):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chế độ từ xa: kho phiên nằm ở đâu?">
    Trạng thái phiên thuộc về **máy chủ gateway**. Nếu bạn ở chế độ từ xa, kho phiên bạn quan tâm nằm trên máy từ xa, không phải laptop cục bộ của bạn. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>
</AccordionGroup>

## Cơ bản về cấu hình

<AccordionGroup>
  <Accordion title="Cấu hình có định dạng gì? Nó nằm ở đâu?">
    OpenClaw đọc cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Nếu thiếu tệp, nó dùng các mặc định tương đối an toàn (bao gồm workspace mặc định là `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Tôi đã đặt gateway.bind: "lan" (hoặc "tailnet") và giờ không có gì lắng nghe / UI báo chưa được ủy quyền'>
    Bind không phải loopback **yêu cầu một đường dẫn xác thực gateway hợp lệ**. Trong thực tế, điều đó nghĩa là:

    - xác thực bằng bí mật dùng chung: token hoặc mật khẩu
    - `gateway.auth.mode: "trusted-proxy"` phía sau một reverse proxy nhận biết danh tính được cấu hình đúng

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Ghi chú:

    - `gateway.remote.token` / `.password` **không** tự chúng bật xác thực gateway cục bộ.
    - Đường dẫn gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
    - Với xác thực bằng mật khẩu, hãy đặt `gateway.auth.mode: "password"` cộng với `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`) thay vào đó.
    - Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ qua SecretRef và không phân giải được, quá trình phân giải sẽ đóng theo hướng an toàn (không có fallback từ xa che giấu).
    - Thiết lập Control UI dùng bí mật dùng chung xác thực qua `connect.params.auth.token` hoặc `connect.params.auth.password` (được lưu trong thiết lập app/UI). Các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy` dùng header yêu cầu thay thế. Tránh đặt bí mật dùng chung trong URL.
    - Với `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback cùng máy chủ yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true` và một mục loopback trong `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Tại sao giờ tôi cần token trên localhost?">
    OpenClaw mặc định thực thi xác thực gateway, bao gồm cả loopback. Trong đường dẫn mặc định thông thường, điều đó nghĩa là xác thực token: nếu không cấu hình rõ đường dẫn xác thực nào, quá trình khởi động gateway phân giải về chế độ token và tạo một token chỉ dùng trong runtime cho lần khởi động đó, vì vậy **client WS cục bộ phải xác thực**. Cấu hình rõ `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, hoặc `OPENCLAW_GATEWAY_PASSWORD` khi client cần một bí mật ổn định qua các lần khởi động lại. Điều này chặn các tiến trình cục bộ khác gọi Gateway.

    Nếu bạn thích một đường dẫn xác thực khác, bạn có thể chọn rõ chế độ mật khẩu (hoặc, với reverse proxy nhận biết danh tính, `trusted-proxy`). Nếu bạn **thực sự** muốn loopback mở, hãy đặt rõ `gateway.auth.mode: "none"` trong cấu hình. Doctor có thể tạo token cho bạn bất cứ lúc nào: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ hot-reload:

    - `gateway.reload.mode: "hybrid"` (mặc định): áp dụng nóng các thay đổi an toàn, khởi động lại với các thay đổi trọng yếu
    - `hot`, `restart`, `off` cũng được hỗ trợ

  </Accordion>

  <Accordion title="Làm cách nào để tắt các tagline CLI hài hước?">
    Đặt `cli.banner.taglineMode` trong cấu hình:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ẩn văn bản tagline nhưng giữ dòng tiêu đề/phiên bản của banner.
    - `default`: luôn dùng `All your chats, one OpenClaw.`.
    - `random`: các tagline hài hước/theo mùa được xoay vòng (hành vi mặc định).
    - Nếu bạn không muốn có banner nào, đặt env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm cách nào để bật tìm kiếm web (và tải web)?">
    `web_fetch` hoạt động mà không cần khóa API. `web_search` phụ thuộc vào
    nhà cung cấp bạn chọn:

    - Các nhà cung cấp dựa trên API như Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, và Tavily yêu cầu thiết lập khóa API thông thường của họ.
    - Ollama Web Search không cần khóa, nhưng nó dùng máy chủ Ollama bạn đã cấu hình và yêu cầu `ollama signin`.
    - DuckDuckGo không cần khóa, nhưng là một tích hợp không chính thức dựa trên HTML.
    - SearXNG không cần khóa/tự host; cấu hình `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Khuyến nghị:** chạy `openclaw configure --section web` và chọn một nhà cung cấp.
    Các lựa chọn thay thế bằng môi trường:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Cấu hình tìm kiếm web theo từng nhà cung cấp hiện nằm trong `plugins.entries.<plugin>.config.webSearch.*`.
    Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn được tải tạm thời để tương thích, nhưng không nên dùng cho cấu hình mới.
    Cấu hình dự phòng tìm nạp web Firecrawl nằm trong `plugins.entries.firecrawl.config.webFetch.*`.

    Ghi chú:

    - Nếu bạn dùng danh sách cho phép, hãy thêm `web_search`/`web_fetch`/`x_search` hoặc `group:web`.
    - `web_fetch` được bật theo mặc định (trừ khi bị tắt rõ ràng).
    - Nếu bỏ qua `tools.web.fetch.provider`, OpenClaw tự động phát hiện nhà cung cấp dự phòng tìm nạp sẵn sàng đầu tiên từ thông tin xác thực có sẵn. Hiện nay nhà cung cấp đi kèm là Firecrawl.
    - Daemon đọc biến môi trường từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Công cụ web](/vi/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa cấu hình của tôi. Làm sao để khôi phục và tránh việc này?">
    `config.apply` thay thế **toàn bộ cấu hình**. Nếu bạn gửi một đối tượng một phần, mọi thứ
    khác sẽ bị xóa.

    OpenClaw hiện tại bảo vệ khỏi nhiều lần ghi đè ngoài ý muốn:

    - Các lượt ghi cấu hình do OpenClaw sở hữu xác thực toàn bộ cấu hình sau thay đổi trước khi ghi.
    - Các lượt ghi không hợp lệ hoặc phá hủy do OpenClaw sở hữu bị từ chối và lưu thành `openclaw.json.rejected.*`.
    - Nếu một chỉnh sửa trực tiếp làm hỏng khởi động hoặc tải lại nóng, Gateway sẽ đóng an toàn hoặc bỏ qua lần tải lại; nó không ghi lại `openclaw.json`.
    - `openclaw doctor --fix` sở hữu việc sửa chữa và có thể khôi phục bản tốt gần nhất trong khi lưu tệp bị từ chối thành `openclaw.json.clobbered.*`.

    Khôi phục:

    - Kiểm tra `openclaw logs --follow` để tìm `Invalid config at`, `Config write rejected:`, hoặc `config reload skipped (invalid config)`.
    - Kiểm tra `openclaw.json.clobbered.*` hoặc `openclaw.json.rejected.*` mới nhất bên cạnh cấu hình đang hoạt động.
    - Chạy `openclaw config validate` và `openclaw doctor --fix`.
    - Chỉ sao chép lại các khóa mong muốn bằng `openclaw config set` hoặc `config.patch`.
    - Nếu bạn không có bản tốt gần nhất hoặc payload bị từ chối, hãy khôi phục từ bản sao lưu, hoặc chạy lại `openclaw doctor` và cấu hình lại kênh/mô hình.
    - Nếu việc này xảy ra ngoài dự kiến, hãy báo lỗi và đính kèm cấu hình gần nhất bạn biết hoặc bất kỳ bản sao lưu nào.
    - Một tác tử lập trình cục bộ thường có thể dựng lại cấu hình hoạt động được từ nhật ký hoặc lịch sử.

    Tránh việc này:

    - Dùng `openclaw config set` cho các thay đổi nhỏ.
    - Dùng `openclaw configure` cho chỉnh sửa tương tác.
    - Dùng `config.schema.lookup` trước khi bạn không chắc về đường dẫn chính xác hoặc hình dạng trường; nó trả về một nút schema nông cùng các tóm tắt con trực tiếp để truy sâu.
    - Dùng `config.patch` cho chỉnh sửa RPC một phần; chỉ dùng `config.apply` để thay thế toàn bộ cấu hình.
    - Nếu bạn đang dùng công cụ `gateway` chỉ dành cho chủ sở hữu từ một lượt chạy tác tử, nó vẫn sẽ từ chối ghi vào `tools.exec.ask` / `tools.exec.security` (bao gồm các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ).

    Tài liệu: [Cấu hình](/vi/cli/config), [Cấu hình tương tác](/vi/cli/configure), [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Làm sao để chạy một Gateway trung tâm với các worker chuyên biệt trên nhiều thiết bị?">
    Mẫu phổ biến là **một Gateway** (ví dụ Raspberry Pi) cộng với **các nút** và **tác tử**:

    - **Gateway (trung tâm):** sở hữu kênh (Signal/WhatsApp), định tuyến và phiên.
    - **Nút (thiết bị):** Mac/iOS/Android kết nối như thiết bị ngoại vi và cung cấp công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Tác tử (worker):** bộ não/không gian làm việc riêng cho các vai trò đặc biệt (ví dụ: "Hetzner ops", "Personal data").
    - **Tác tử con:** tạo tác vụ nền từ một tác tử chính khi bạn muốn chạy song song.
    - **TUI:** kết nối tới Gateway và chuyển đổi tác tử/phiên.

    Tài liệu: [Nút](/vi/nodes), [Truy cập từ xa](/vi/gateway/remote), [Định tuyến đa tác tử](/vi/concepts/multi-agent), [Tác tử con](/vi/tools/subagents), [TUI](/vi/web/tui).

  </Accordion>

  <Accordion title="Trình duyệt OpenClaw có thể chạy headless không?">
    Có. Đây là một tùy chọn cấu hình:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Mặc định là `false` (headful). Headless dễ kích hoạt kiểm tra chống bot hơn trên một số trang. Xem [Trình duyệt](/vi/tools/browser).

    Headless dùng **cùng engine Chromium** và hoạt động với hầu hết tác vụ tự động hóa (biểu mẫu, nhấp chuột, scraping, đăng nhập). Các khác biệt chính:

    - Không có cửa sổ trình duyệt hiển thị (dùng ảnh chụp màn hình nếu bạn cần hình ảnh).
    - Một số trang nghiêm ngặt hơn với tự động hóa ở chế độ headless (CAPTCHA, chống bot).
      Ví dụ, X/Twitter thường chặn phiên headless.

  </Accordion>

  <Accordion title="Làm sao để dùng Brave để điều khiển trình duyệt?">
    Đặt `browser.executablePath` thành tệp nhị phân Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) và khởi động lại Gateway.
    Xem các ví dụ cấu hình đầy đủ trong [Trình duyệt](/vi/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway và nút từ xa

<AccordionGroup>
  <Accordion title="Lệnh được truyền giữa Telegram, gateway và các nút như thế nào?">
    Tin nhắn Telegram được **gateway** xử lý. Gateway chạy tác tử và
    chỉ sau đó mới gọi các nút qua **Gateway WebSocket** khi cần công cụ nút:

    Telegram → Gateway → Tác tử → `node.*` → Nút → Gateway → Telegram

    Nút không thấy lưu lượng nhà cung cấp đi vào; chúng chỉ nhận các lệnh gọi RPC nút.

  </Accordion>

  <Accordion title="Tác tử của tôi có thể truy cập máy tính của tôi như thế nào nếu Gateway được lưu trữ từ xa?">
    Câu trả lời ngắn gọn: **ghép đôi máy tính của bạn làm nút**. Gateway chạy ở nơi khác, nhưng nó có thể
    gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    Thiết lập điển hình:

    1. Chạy Gateway trên máy chủ luôn bật (VPS/máy chủ tại nhà).
    2. Đưa máy chủ Gateway + máy tính của bạn vào cùng tailnet.
    3. Đảm bảo Gateway WS có thể truy cập được (bind tailnet hoặc đường hầm SSH).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Remote over SSH** (hoặc tailnet trực tiếp)
       để nó có thể đăng ký làm nút.
    5. Phê duyệt nút trên Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu nối TCP riêng; các nút kết nối qua Gateway WebSocket.

    Nhắc nhở bảo mật: ghép đôi một nút macOS cho phép `system.run` trên máy đó. Chỉ
    ghép đôi thiết bị bạn tin cậy, và xem [Bảo mật](/vi/gateway/security).

    Tài liệu: [Nút](/vi/nodes), [Giao thức Gateway](/vi/gateway/protocol), [Chế độ từ xa macOS](/vi/platforms/mac/remote), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Giờ làm gì?">
    Kiểm tra các điều cơ bản:

    - Gateway đang chạy: `openclaw gateway status`
    - Tình trạng Gateway: `openclaw status`
    - Tình trạng kênh: `openclaw channels status`

    Sau đó xác minh xác thực và định tuyến:

    - Nếu bạn dùng Tailscale Serve, hãy đảm bảo `gateway.auth.allowTailscale` được đặt đúng.
    - Nếu bạn kết nối qua đường hầm SSH, xác nhận đường hầm cục bộ đang hoạt động và trỏ tới đúng cổng.
    - Xác nhận danh sách cho phép của bạn (DM hoặc nhóm) bao gồm tài khoản của bạn.

    Tài liệu: [Tailscale](/vi/gateway/tailscale), [Truy cập từ xa](/vi/gateway/remote), [Kênh](/vi/channels).

  </Accordion>

  <Accordion title="Hai phiên bản OpenClaw có thể nói chuyện với nhau không (cục bộ + VPS)?">
    Có. Không có cầu nối "bot-to-bot" tích hợp sẵn, nhưng bạn có thể nối chúng theo một vài
    cách đáng tin cậy:

    **Đơn giản nhất:** dùng một kênh trò chuyện thông thường mà cả hai bot đều có thể truy cập (Telegram/Slack/WhatsApp).
    Cho Bot A gửi tin nhắn tới Bot B, rồi để Bot B phản hồi như bình thường.

    **Cầu nối CLI (chung):** chạy một script gọi Gateway kia bằng
    `openclaw agent --message ... --deliver`, nhắm tới một cuộc trò chuyện nơi bot kia
    lắng nghe. Nếu một bot nằm trên VPS từ xa, hãy trỏ CLI của bạn tới Gateway từ xa đó
    qua SSH/Tailscale (xem [Truy cập từ xa](/vi/gateway/remote)).

    Mẫu ví dụ (chạy từ máy có thể truy cập Gateway đích):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Mẹo: thêm lan can bảo vệ để hai bot không lặp vô tận (chỉ khi được nhắc tên, danh sách
    cho phép kênh, hoặc quy tắc "không trả lời tin nhắn bot").

    Tài liệu: [Truy cập từ xa](/vi/gateway/remote), [CLI tác tử](/vi/cli/agent), [Gửi tác tử](/vi/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần các VPS riêng cho nhiều tác tử không?">
    Không. Một Gateway có thể lưu trữ nhiều tác tử, mỗi tác tử có không gian làm việc, mặc định mô hình,
    và định tuyến riêng. Đó là thiết lập bình thường và rẻ hơn, đơn giản hơn nhiều so với việc chạy
    một VPS cho mỗi tác tử.

    Chỉ dùng VPS riêng khi bạn cần cô lập cứng (ranh giới bảo mật) hoặc các
    cấu hình rất khác nhau mà bạn không muốn chia sẻ. Nếu không, hãy giữ một Gateway và
    dùng nhiều tác tử hoặc tác tử con.

  </Accordion>

  <Accordion title="Có lợi ích gì khi dùng một nút trên laptop cá nhân của tôi thay vì SSH từ VPS không?">
    Có - nút là cách hạng nhất để truy cập laptop của bạn từ một Gateway từ xa, và chúng
    mở khóa nhiều khả năng hơn truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và
    nhẹ (một VPS nhỏ hoặc hộp cỡ Raspberry Pi là đủ; 4 GB RAM là dư), nên thiết lập phổ biến
    là một máy chủ luôn bật cộng với laptop của bạn làm nút.

    - **Không cần SSH vào từ bên ngoài.** Nút kết nối ra Gateway WebSocket và dùng ghép đôi thiết bị.
    - **Kiểm soát thực thi an toàn hơn.** `system.run` được chặn bởi danh sách cho phép/phê duyệt nút trên laptop đó.
    - **Nhiều công cụ thiết bị hơn.** Nút cung cấp `canvas`, `camera`, và `screen` ngoài `system.run`.
    - **Tự động hóa trình duyệt cục bộ.** Giữ Gateway trên VPS, nhưng chạy Chrome cục bộ thông qua máy chủ nút trên laptop, hoặc gắn vào Chrome cục bộ trên máy chủ qua Chrome MCP.

    SSH vẫn ổn cho truy cập shell tùy lúc, nhưng nút đơn giản hơn cho các workflow tác tử liên tục và
    tự động hóa thiết bị.

    Tài liệu: [Nút](/vi/nodes), [CLI nút](/vi/cli/nodes), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Nút có chạy dịch vụ gateway không?">
    Không. Chỉ nên chạy **một gateway** trên mỗi máy chủ trừ khi bạn cố ý chạy các hồ sơ cô lập (xem [Nhiều gateway](/vi/gateway/multiple-gateways)). Nút là thiết bị ngoại vi kết nối
    tới gateway (nút iOS/Android, hoặc "chế độ nút" macOS trong ứng dụng thanh menu). Đối với máy chủ nút
    headless và điều khiển CLI, xem [CLI máy chủ nút](/vi/cli/node).

    Cần khởi động lại đầy đủ cho các thay đổi bề mặt `gateway`, `discovery`, và Plugin được lưu trữ.

  </Accordion>

  <Accordion title="Có cách API / RPC để áp dụng cấu hình không?">
    Có.

    - `config.schema.lookup`: kiểm tra một cây con cấu hình với nút schema nông của nó, gợi ý UI khớp, và tóm tắt các con trực tiếp trước khi ghi
    - `config.get`: lấy snapshot hiện tại + hash
    - `config.patch`: cập nhật một phần an toàn (được ưu tiên cho hầu hết chỉnh sửa RPC); hot-reload khi có thể và khởi động lại khi cần
    - `config.apply`: xác thực + thay thế toàn bộ cấu hình; hot-reload khi có thể và khởi động lại khi cần
    - Công cụ runtime `gateway` chỉ dành cho chủ sở hữu vẫn từ chối ghi lại `tools.exec.ask` / `tools.exec.security`; các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ

  </Accordion>

  <Accordion title="Cấu hình tối thiểu hợp lý cho lần cài đặt đầu tiên">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cấu hình này đặt workspace của bạn và giới hạn ai có thể kích hoạt bot.

  </Accordion>

  <Accordion title="Làm cách nào để thiết lập Tailscale trên VPS và kết nối từ máy Mac của tôi?">
    Các bước tối thiểu:

    1. **Cài đặt + đăng nhập trên VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Cài đặt + đăng nhập trên máy Mac của bạn**
       - Dùng ứng dụng Tailscale và đăng nhập vào cùng tailnet.
    3. **Bật MagicDNS (khuyến nghị)**
       - Trong bảng điều khiển quản trị Tailscale, bật MagicDNS để VPS có tên ổn định.
    4. **Dùng hostname của tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Nếu bạn muốn dùng Control UI mà không cần SSH, hãy dùng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cách này giữ gateway bind vào loopback và expose HTTPS qua Tailscale. Xem [Tailscale](/vi/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm cách nào để kết nối một node Mac với Gateway từ xa (Tailscale Serve)?">
    Serve expose **Gateway Control UI + WS**. Các node kết nối qua cùng endpoint Gateway WS.

    Thiết lập khuyến nghị:

    1. **Đảm bảo VPS + Mac nằm trên cùng tailnet**.
    2. **Dùng ứng dụng macOS ở chế độ Remote** (SSH target có thể là hostname của tailnet).
       Ứng dụng sẽ tạo tunnel cho cổng Gateway và kết nối dưới dạng node.
    3. **Phê duyệt node** trên gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Giao thức Gateway](/vi/gateway/protocol), [Khám phá](/vi/gateway/discovery), [chế độ từ xa macOS](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài trên laptop thứ hai hay chỉ thêm một node?">
    Nếu bạn chỉ cần **công cụ cục bộ** (màn hình/camera/exec) trên laptop thứ hai, hãy thêm nó làm
    **node**. Cách này giữ một Gateway duy nhất và tránh cấu hình bị nhân đôi. Công cụ node cục bộ
    hiện chỉ hỗ trợ macOS, nhưng chúng tôi dự định mở rộng sang các hệ điều hành khác.

    Chỉ cài Gateway thứ hai khi bạn cần **cách ly cứng** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Nodes](/vi/nodes), [CLI Nodes](/vi/cli/nodes), [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Biến môi trường và tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải biến môi trường như thế nào?">
    OpenClaw đọc biến môi trường từ tiến trình cha (shell, launchd/systemd, CI, v.v.) và tải thêm:

    - `.env` từ thư mục làm việc hiện tại
    - `.env` dự phòng toàn cục từ `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`)

    Không tệp `.env` nào ghi đè các biến môi trường hiện có.

    Bạn cũng có thể định nghĩa biến môi trường inline trong cấu hình (chỉ áp dụng nếu thiếu trong env của tiến trình):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Xem [/environment](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và nguồn.

  </Accordion>

  <Accordion title="Tôi khởi động Gateway qua service và các biến môi trường của tôi biến mất. Giờ làm gì?">
    Hai cách sửa phổ biến:

    1. Đặt các key bị thiếu vào `~/.openclaw/.env` để chúng được nhận ngay cả khi service không kế thừa env từ shell của bạn.
    2. Bật nhập shell (tiện ích opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Cách này chạy login shell của bạn và chỉ nhập các key dự kiến còn thiếu (không bao giờ ghi đè). Biến môi trường tương đương:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái models hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` báo cáo liệu **nhập env từ shell** có được bật hay không. "Shell env: off"
    **không** có nghĩa là các biến môi trường của bạn bị thiếu - nó chỉ có nghĩa là OpenClaw sẽ không tự động tải
    login shell của bạn.

    Nếu Gateway chạy dưới dạng service (launchd/systemd), nó sẽ không kế thừa môi trường
    shell của bạn. Sửa bằng một trong các cách sau:

    1. Đặt token vào `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Hoặc bật nhập shell (`env.shellEnv.enabled: true`).
    3. Hoặc thêm nó vào block `env` trong cấu hình của bạn (chỉ áp dụng nếu thiếu).

    Sau đó khởi động lại gateway và kiểm tra lại:

    ```bash
    openclaw models status
    ```

    Token Copilot được đọc từ `COPILOT_GITHUB_TOKEN` (cũng như `GH_TOKEN` / `GITHUB_TOKEN`).
    Xem [/concepts/model-providers](/vi/concepts/model-providers) và [/environment](/vi/help/environment).

  </Accordion>
</AccordionGroup>

## Phiên và nhiều cuộc trò chuyện

<AccordionGroup>
  <Accordion title="Làm cách nào để bắt đầu một cuộc trò chuyện mới?">
    Gửi `/new` hoặc `/reset` dưới dạng tin nhắn độc lập. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>

  <Accordion title="Phiên có tự động đặt lại nếu tôi không bao giờ gửi /new không?">
    Phiên có thể hết hạn sau `session.idleMinutes`, nhưng tính năng này **bị tắt theo mặc định** (mặc định **0**).
    Đặt nó thành một giá trị dương để bật hết hạn khi không hoạt động. Khi được bật, tin nhắn **tiếp theo**
    sau khoảng thời gian không hoạt động sẽ bắt đầu một session id mới cho khóa chat đó.
    Điều này không xóa transcript - nó chỉ bắt đầu một phiên mới.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Có cách nào tạo một đội các instance OpenClaw (một CEO và nhiều agent) không?">
    Có, thông qua **định tuyến multi-agent** và **sub-agent**. Bạn có thể tạo một agent điều phối
    và nhiều agent worker với workspace và model riêng.

    Tuy vậy, tốt nhất nên xem đây là một **thử nghiệm vui**. Nó tốn nhiều token và thường
    kém hiệu quả hơn so với dùng một bot với các phiên riêng biệt. Mô hình điển hình mà chúng tôi
    hình dung là một bot để bạn trò chuyện, với các phiên khác nhau cho công việc song song. Bot đó
    cũng có thể spawn sub-agent khi cần.

    Tài liệu: [Định tuyến multi-agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [CLI Agents](/vi/cli/agents).

  </Accordion>

  <Accordion title="Tại sao context bị cắt giữa tác vụ? Làm cách nào để ngăn việc đó?">
    Context của phiên bị giới hạn bởi cửa sổ của model. Chat dài, output công cụ lớn, hoặc nhiều
    tệp có thể kích hoạt compaction hoặc cắt bớt.

    Các cách hữu ích:

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một tệp.
    - Dùng `/compact` trước các tác vụ dài, và `/new` khi đổi chủ đề.
    - Giữ context quan trọng trong workspace và yêu cầu bot đọc lại.
    - Dùng sub-agent cho công việc dài hoặc song song để chat chính nhỏ hơn.
    - Chọn model có cửa sổ context lớn hơn nếu việc này xảy ra thường xuyên.

  </Accordion>

  <Accordion title="Làm cách nào để đặt lại hoàn toàn OpenClaw nhưng vẫn giữ cài đặt?">
    Dùng lệnh reset:

    ```bash
    openclaw reset
    ```

    Reset đầy đủ không tương tác:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sau đó chạy lại thiết lập:

    ```bash
    openclaw onboard --install-daemon
    ```

    Ghi chú:

    - Onboarding cũng cung cấp **Reset** nếu phát hiện cấu hình hiện có. Xem [Onboarding (CLI)](/vi/start/wizard).
    - Nếu bạn dùng profile (`--profile` / `OPENCLAW_PROFILE`), hãy reset từng state dir (mặc định là `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (chỉ dành cho dev; xóa cấu hình dev + credential + phiên + workspace).

  </Accordion>

  <Accordion title='Tôi gặp lỗi "context too large" - làm cách nào để reset hoặc compact?'>
    Dùng một trong các cách sau:

    - **Compact** (giữ cuộc trò chuyện nhưng tóm tắt các lượt cũ):

      ```
      /compact
      ```

      hoặc `/compact <instructions>` để hướng dẫn phần tóm tắt.

    - **Reset** (session ID mới cho cùng khóa chat):

      ```
      /new
      /reset
      ```

    Nếu vẫn tiếp tục xảy ra:

    - Bật hoặc tinh chỉnh **session pruning** (`agents.defaults.contextPruning`) để cắt bớt output công cụ cũ.
    - Dùng model có cửa sổ context lớn hơn.

    Tài liệu: [Compaction](/vi/concepts/compaction), [Session pruning](/vi/concepts/session-pruning), [Quản lý phiên](/vi/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "LLM request rejected: messages.content.tool_use.input field required"?'>
    Đây là lỗi xác thực của provider: model đã phát ra một block `tool_use` không có
    `input` bắt buộc. Lỗi này thường có nghĩa là lịch sử phiên đã cũ hoặc bị hỏng (thường sau các thread dài
    hoặc thay đổi công cụ/schema).

    Cách sửa: bắt đầu một phiên mới bằng `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được tin nhắn heartbeat mỗi 30 phút?">
    Heartbeat chạy mỗi **30m** theo mặc định (**1h** khi dùng OAuth auth). Tinh chỉnh hoặc tắt chúng:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Nếu `HEARTBEAT.md` tồn tại nhưng về cơ bản trống (chỉ có dòng trống và markdown
    header như `# Heading`), OpenClaw bỏ qua lượt chạy heartbeat để tiết kiệm lệnh gọi API.
    Nếu tệp bị thiếu, heartbeat vẫn chạy và model quyết định phải làm gì.

    Ghi đè theo từng agent dùng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm một "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **tài khoản của chính bạn**, nên nếu bạn ở trong nhóm, OpenClaw có thể thấy nhóm đó.
    Theo mặc định, trả lời trong nhóm bị chặn cho đến khi bạn cho phép người gửi (`groupPolicy: "allowlist"`).

    Nếu bạn chỉ muốn **bạn** có thể kích hoạt trả lời trong nhóm:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Làm cách nào để lấy JID của một nhóm WhatsApp?">
    Tùy chọn 1 (nhanh nhất): tail logs và gửi một tin nhắn thử trong nhóm:

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, ví dụ:
    `1234567890-1234567890@g.us`.

    Tùy chọn 2 (nếu đã cấu hình/allowlist): liệt kê nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Directory](/vi/cli/directory), [Logs](/vi/cli/logs).

  </Accordion>

  <Accordion title="Tại sao OpenClaw không trả lời trong nhóm?">
    Hai nguyên nhân phổ biến:

    - Mention gating đang bật (mặc định). Bạn phải @mention bot (hoặc khớp `mentionPatterns`).
    - Bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm không nằm trong allowlist.

    Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).

  </Accordion>

  <Accordion title="Nhóm/thread có chia sẻ context với DM không?">
    Chat trực tiếp mặc định gộp vào phiên chính. Nhóm/kênh có khóa phiên riêng, còn topic Telegram / thread Discord là các phiên riêng. Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu workspace và agent?">
    Không có giới hạn cứng. Hàng chục (thậm chí hàng trăm) đều ổn, nhưng hãy lưu ý:

    - **Dung lượng đĩa tăng:** session + transcript nằm trong `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token:** nhiều agent hơn nghĩa là mức sử dụng mô hình đồng thời cao hơn.
    - **Chi phí vận hành:** hồ sơ xác thực, workspace và định tuyến kênh theo từng agent.

    Mẹo:

    - Giữ một workspace **đang hoạt động** cho mỗi agent (`agents.defaults.workspace`).
    - Dọn các session cũ (xóa JSONL hoặc mục lưu trữ) nếu dung lượng đĩa tăng.
    - Dùng `openclaw doctor` để phát hiện workspace rời rạc và hồ sơ không khớp.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều bot hoặc cuộc trò chuyện cùng lúc (Slack) không, và nên thiết lập như thế nào?">
    Có. Dùng **Định tuyến đa agent** để chạy nhiều agent tách biệt và định tuyến tin nhắn đến theo
    kênh/tài khoản/đối tượng ngang hàng. Slack được hỗ trợ dưới dạng một kênh và có thể được gắn với các agent cụ thể.

    Truy cập trình duyệt rất mạnh nhưng không phải là "làm được mọi thứ con người có thể làm" - cơ chế chống bot, CAPTCHA và MFA vẫn có thể
    chặn tự động hóa. Để điều khiển trình duyệt đáng tin cậy nhất, hãy dùng Chrome MCP cục bộ trên máy chủ,
    hoặc dùng CDP trên máy thực sự chạy trình duyệt.

    Thiết lập khuyến nghị:

    - Máy chủ Gateway luôn bật (VPS/Mac mini).
    - Một agent cho mỗi vai trò (bindings).
    - Các kênh Slack được gắn với các agent đó.
    - Trình duyệt cục bộ qua Chrome MCP hoặc một node khi cần.

    Tài liệu: [Định tuyến đa agent](/vi/concepts/multi-agent), [Slack](/vi/channels/slack),
    [Trình duyệt](/vi/tools/browser), [Node](/vi/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình, failover và hồ sơ xác thực

Hỏi đáp về mô hình — mặc định, lựa chọn, bí danh, chuyển đổi, failover, hồ sơ xác thực —
nằm trong [Câu hỏi thường gặp về mô hình](/vi/help/faq-models).

## Gateway: cổng, "đã chạy" và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway dùng cổng nào?">
    `gateway.port` kiểm soát cổng ghép kênh duy nhất cho WebSocket + HTTP (Control UI, hook, v.v.).

    Thứ tự ưu tiên:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status báo "Runtime: running" nhưng "Connectivity probe: failed"?'>
    Vì "running" là góc nhìn của **supervisor** (launchd/systemd/schtasks). Connectivity probe là CLI thực sự kết nối đến WebSocket của gateway.

    Dùng `openclaw gateway status` và tin các dòng này:

    - `Probe target:` (URL mà probe thực sự đã dùng)
    - `Listening:` (thứ thực sự đang được bind trên cổng)
    - `Last gateway error:` (nguyên nhân gốc phổ biến khi process còn sống nhưng cổng không lắng nghe)

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status hiển thị "Config (cli)" và "Config (service)" khác nhau?'>
    Bạn đang chỉnh một tệp cấu hình trong khi service đang chạy một tệp khác (thường là không khớp `--profile` / `OPENCLAW_STATE_DIR`).

    Cách sửa:

    ```bash
    openclaw gateway install --force
    ```

    Chạy lệnh đó từ cùng `--profile` / môi trường mà bạn muốn service sử dụng.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" nghĩa là gì?'>
    OpenClaw áp đặt khóa runtime bằng cách bind WebSocket listener ngay khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu bind thất bại với `EADDRINUSE`, nó ném `GatewayLockError` cho biết một instance khác đã đang lắng nghe.

    Cách sửa: dừng instance kia, giải phóng cổng, hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm thế nào để chạy OpenClaw ở chế độ từ xa (client kết nối đến Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và trỏ đến một URL WebSocket từ xa, tùy chọn kèm thông tin xác thực từ xa dạng shared-secret:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Ghi chú:

    - `openclaw gateway` chỉ khởi động khi `gateway.mode` là `local` (hoặc bạn truyền cờ ghi đè).
    - Ứng dụng macOS theo dõi tệp cấu hình và chuyển chế độ trực tiếp khi các giá trị này thay đổi.
    - `gateway.remote.token` / `.password` chỉ là thông tin xác thực từ xa phía client; bản thân chúng không bật xác thực gateway cục bộ.

  </Accordion>

  <Accordion title='Control UI báo "unauthorized" (hoặc liên tục kết nối lại). Giờ làm gì?'>
    Đường dẫn xác thực gateway của bạn và phương thức xác thực của UI không khớp.

    Sự thật (từ mã):

    - Control UI giữ token trong `sessionStorage` cho session tab trình duyệt hiện tại và URL gateway đã chọn, nên refresh cùng tab vẫn hoạt động mà không khôi phục cơ chế lưu token dài hạn trong localStorage.
    - Khi có `AUTH_TOKEN_MISMATCH`, client đáng tin cậy có thể thử lại một lần có giới hạn bằng token thiết bị đã cache khi gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Lần thử lại bằng token đã cache đó giờ tái sử dụng các scope đã được phê duyệt và cache cùng token thiết bị. Caller truyền rõ `deviceToken` / `scopes` rõ ràng vẫn giữ tập scope được yêu cầu thay vì kế thừa scope đã cache.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là shared token/password rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi bootstrap token.
    - Kiểm tra scope của bootstrap token có tiền tố vai trò. Danh sách cho phép operator bootstrap tích hợp chỉ đáp ứng yêu cầu operator; node hoặc các vai trò không phải operator khác vẫn cần scope dưới tiền tố vai trò của chính chúng.

    Cách sửa:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL dashboard, cố mở; hiển thị gợi ý SSH nếu headless).
    - Nếu bạn chưa có token: `openclaw doctor --generate-gateway-token`.
    - Nếu từ xa, tạo tunnel trước: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`.
    - Chế độ shared-secret: đặt `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, rồi dán secret khớp vào phần cài đặt Control UI.
    - Chế độ Tailscale Serve: bảo đảm `gateway.auth.allowTailscale` được bật và bạn đang mở URL Serve, không phải URL loopback/tailnet thô bỏ qua header định danh Tailscale.
    - Chế độ trusted-proxy: bảo đảm bạn đi qua proxy nhận biết danh tính đã cấu hình, không phải URL gateway thô. Proxy loopback cùng máy chủ cũng cần `gateway.auth.trustedProxy.allowLoopback = true`.
    - Nếu vẫn không khớp sau một lần thử lại, xoay/phê duyệt lại token thiết bị đã ghép cặp:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Nếu lệnh xoay đó nói bị từ chối, kiểm tra hai điều:
      - session thiết bị đã ghép cặp chỉ có thể xoay thiết bị **của chính nó** trừ khi chúng cũng có `operator.admin`
      - các giá trị `--scope` rõ ràng không được vượt quá scope operator hiện tại của caller
    - Vẫn kẹt? Chạy `openclaw status --all` và làm theo [Khắc phục sự cố](/vi/gateway/troubleshooting). Xem [Dashboard](/vi/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đặt gateway.bind tailnet nhưng không bind được và không có gì lắng nghe">
    Bind `tailnet` chọn một IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không ở trên Tailscale (hoặc giao diện bị tắt), thì không có gì để bind.

    Cách sửa:

    - Khởi động Tailscale trên máy chủ đó (để nó có địa chỉ 100.x), hoặc
    - Chuyển sang `gateway.bind: "loopback"` / `"lan"`.

    Ghi chú: `tailnet` là rõ ràng. `auto` ưu tiên loopback; dùng `gateway.bind: "tailnet"` khi bạn muốn bind chỉ cho tailnet.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng một máy chủ không?">
    Thường là không - một Gateway có thể chạy nhiều kênh nhắn tin và agent. Chỉ dùng nhiều Gateway khi bạn cần dự phòng (ví dụ: bot cứu hộ) hoặc cô lập cứng.

    Có, nhưng bạn phải cô lập:

    - `OPENCLAW_CONFIG_PATH` (cấu hình theo từng instance)
    - `OPENCLAW_STATE_DIR` (trạng thái theo từng instance)
    - `agents.defaults.workspace` (cô lập workspace)
    - `gateway.port` (cổng duy nhất)

    Thiết lập nhanh (khuyến nghị):

    - Dùng `openclaw --profile <name> ...` cho mỗi instance (tự tạo `~/.openclaw-<name>`).
    - Đặt `gateway.port` duy nhất trong cấu hình của từng profile (hoặc truyền `--port` khi chạy thủ công).
    - Cài service theo từng profile: `openclaw --profile <name> gateway install`.

    Profile cũng thêm hậu tố vào tên service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Hướng dẫn đầy đủ: [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / mã 1008 nghĩa là gì?'>
    Gateway là một **máy chủ WebSocket**, và nó kỳ vọng thông điệp đầu tiên
    là một frame `connect`. Nếu nhận bất kỳ thứ gì khác, nó đóng kết nối
    với **mã 1008** (vi phạm chính sách).

    Nguyên nhân phổ biến:

    - Bạn mở URL **HTTP** trong trình duyệt (`http://...`) thay vì client WS.
    - Bạn dùng sai cổng hoặc đường dẫn.
    - Proxy hoặc tunnel đã loại bỏ header xác thực hoặc gửi yêu cầu không phải Gateway.

    Cách sửa nhanh:

    1. Dùng URL WS: `ws://<host>:18789` (hoặc `wss://...` nếu HTTPS).
    2. Đừng mở cổng WS trong tab trình duyệt bình thường.
    3. Nếu xác thực đang bật, hãy đưa token/password vào frame `connect`.

    Nếu bạn đang dùng CLI hoặc TUI, URL nên trông như sau:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Ghi log và gỡ lỗi

<AccordionGroup>
  <Accordion title="Log ở đâu?">
    Log tệp (có cấu trúc):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Bạn có thể đặt đường dẫn ổn định qua `logging.file`. Mức log của tệp được kiểm soát bởi `logging.level`. Độ chi tiết console được kiểm soát bởi `--verbose` và `logging.consoleLevel`.

    Cách tail log nhanh nhất:

    ```bash
    openclaw logs --follow
    ```

    Log service/supervisor (khi gateway chạy qua launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` và `gateway.err.log` (mặc định: `~/.openclaw/logs/...`; profile dùng `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Xem [Khắc phục sự cố](/vi/gateway/troubleshooting) để biết thêm.

  </Accordion>

  <Accordion title="Làm thế nào để khởi động/dừng/khởi động lại service Gateway?">
    Dùng các helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy gateway thủ công, `openclaw gateway --force` có thể giành lại cổng. Xem [Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng terminal trên Windows - làm sao để khởi động lại OpenClaw?">
    Có **hai chế độ cài đặt Windows**:

    **1) WSL2 (khuyến nghị):** Gateway chạy bên trong Linux.

    Mở PowerShell, vào WSL, rồi khởi động lại:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chưa từng cài service, hãy khởi động nó ở foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows gốc (không khuyến nghị):** Gateway chạy trực tiếp trong Windows.

    Mở PowerShell và chạy:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy thủ công (không có service), dùng:

    ```powershell
    openclaw gateway run
    ```

    Tài liệu: [Windows (WSL2)](/vi/platforms/windows), [Runbook service Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Gateway đã bật nhưng phản hồi không bao giờ đến. Tôi nên kiểm tra gì?">
    Bắt đầu bằng một lượt kiểm tra sức khỏe nhanh:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân phổ biến:

    - Xác thực mô hình chưa được tải trên **máy chủ Gateway** (kiểm tra `models status`).
    - Ghép đôi/kênh allowlist đang chặn phản hồi (kiểm tra cấu hình kênh + nhật ký).
    - WebChat/Dashboard đang mở mà không có token đúng.

    Nếu bạn đang truy cập từ xa, hãy xác nhận kết nối tunnel/Tailscale đang hoạt động và
    Gateway WebSocket có thể truy cập được.

    Tài liệu: [Kênh](/vi/channels), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - giờ làm gì?'>
    Điều này thường có nghĩa là UI đã mất kết nối WebSocket. Kiểm tra:

    1. Gateway có đang chạy không? `openclaw gateway status`
    2. Gateway có khỏe mạnh không? `openclaw status`
    3. UI có token đúng không? `openclaw dashboard`
    4. Nếu truy cập từ xa, liên kết tunnel/Tailscale có đang hoạt động không?

    Sau đó theo dõi nhật ký:

    ```bash
    openclaw logs --follow
    ```

    Tài liệu: [Dashboard](/vi/web/dashboard), [Truy cập từ xa](/vi/gateway/remote), [Khắc phục sự cố](/vi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands thất bại. Tôi nên kiểm tra gì?">
    Bắt đầu với nhật ký và trạng thái kênh:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sau đó đối chiếu lỗi:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram có quá nhiều mục. OpenClaw đã cắt giảm theo giới hạn của Telegram và thử lại với ít lệnh hơn, nhưng một số mục menu vẫn cần bị loại bỏ. Giảm lệnh plugin/skill/tùy chỉnh, hoặc tắt `channels.telegram.commands.native` nếu bạn không cần menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, hoặc các lỗi mạng tương tự: nếu bạn đang dùng VPS hoặc đứng sau proxy, hãy xác nhận HTTPS đi ra được cho phép và DNS hoạt động với `api.telegram.org`.

    Nếu Gateway ở từ xa, hãy chắc chắn bạn đang xem nhật ký trên máy chủ Gateway.

    Tài liệu: [Telegram](/vi/channels/telegram), [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Tôi nên kiểm tra gì?">
    Trước tiên hãy xác nhận Gateway có thể truy cập được và tác tử có thể chạy:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, dùng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh chat,
    hãy chắc chắn việc gửi đã được bật (`/deliver on`).

    Tài liệu: [TUI](/vi/web/tui), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để dừng hoàn toàn rồi khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Thao tác này dừng/khởi động **dịch vụ được giám sát** (launchd trên macOS, systemd trên Linux).
    Dùng cách này khi Gateway chạy nền như một daemon.

    Nếu bạn đang chạy ở tiền cảnh, dừng bằng Ctrl-C, rồi:

    ```bash
    openclaw gateway run
    ```

    Tài liệu: [Runbook dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart so với openclaw gateway">
    - `openclaw gateway restart`: khởi động lại **dịch vụ nền** (launchd/systemd).
    - `openclaw gateway`: chạy Gateway **ở tiền cảnh** cho phiên terminal này.

    Nếu bạn đã cài đặt dịch vụ, hãy dùng các lệnh gateway. Dùng `openclaw gateway` khi
    bạn muốn chạy một lần ở tiền cảnh.

  </Accordion>

  <Accordion title="Cách nhanh nhất để lấy thêm chi tiết khi có lỗi">
    Khởi động Gateway với `--verbose` để có thêm chi tiết trên console. Sau đó kiểm tra tệp nhật ký để xem lỗi xác thực kênh, định tuyến mô hình và RPC.
  </Accordion>
</AccordionGroup>

## Phương tiện và tệp đính kèm

<AccordionGroup>
  <Accordion title="Skill của tôi đã tạo ảnh/PDF, nhưng không có gì được gửi">
    Tệp đính kèm đi ra từ tác tử phải bao gồm một dòng `MEDIA:<path-or-url>` (trên dòng riêng). Xem [Thiết lập trợ lý OpenClaw](/vi/start/openclaw) và [Gửi từ tác tử](/vi/tools/agent-send).

    Gửi bằng CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Cũng kiểm tra:

    - Kênh đích hỗ trợ phương tiện đi ra và không bị chặn bởi allowlist.
    - Tệp nằm trong giới hạn kích thước của nhà cung cấp (ảnh được đổi kích thước tối đa 2048px).
    - `tools.fs.workspaceOnly=true` giới hạn việc gửi đường dẫn cục bộ trong workspace, temp/media-store và các tệp đã được sandbox xác thực.
    - `tools.fs.workspaceOnly=false` cho phép `MEDIA:` gửi các tệp cục bộ trên máy chủ mà tác tử đã có thể đọc, nhưng chỉ cho phương tiện và các loại tài liệu an toàn (ảnh, âm thanh, video, PDF và tài liệu Office). Văn bản thuần và các tệp giống bí mật vẫn bị chặn.

    Xem [Ảnh](/vi/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn khi mở OpenClaw cho DM đến không?">
    Hãy xem DM đến là đầu vào không đáng tin cậy. Mặc định được thiết kế để giảm rủi ro:

    - Hành vi mặc định trên các kênh hỗ trợ DM là **ghép đôi**:
      - Người gửi không xác định nhận được mã ghép đôi; bot không xử lý tin nhắn của họ.
      - Phê duyệt bằng: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Yêu cầu đang chờ được giới hạn ở **3 mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu mã không đến.
    - Mở DM công khai yêu cầu chọn tham gia rõ ràng (`dmPolicy: "open"` và allowlist `"*"`).

    Chạy `openclaw doctor` để phát hiện các chính sách DM rủi ro.

  </Accordion>

  <Accordion title="Prompt injection chỉ là mối lo cho bot công khai thôi sao?">
    Không. Prompt injection liên quan đến **nội dung không đáng tin cậy**, không chỉ là ai có thể DM bot.
    Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/tải web, trang trình duyệt, email,
    tài liệu, tệp đính kèm, nhật ký được dán), nội dung đó có thể bao gồm chỉ dẫn cố
    chiếm quyền điều khiển mô hình. Điều này có thể xảy ra ngay cả khi **bạn là người gửi duy nhất**.

    Rủi ro lớn nhất là khi công cụ được bật: mô hình có thể bị lừa
    rò rỉ ngữ cảnh hoặc gọi công cụ thay bạn. Giảm phạm vi ảnh hưởng bằng cách:

    - dùng tác tử "reader" chỉ đọc hoặc tắt công cụ để tóm tắt nội dung không đáng tin cậy
    - tắt `web_search` / `web_fetch` / `browser` cho các tác tử có bật công cụ
    - cũng xem văn bản được giải mã từ tệp/tài liệu là không đáng tin cậy: OpenResponses
      `input_file` và trích xuất tệp đính kèm phương tiện đều bọc văn bản đã trích xuất trong
      các dấu mốc ranh giới nội dung bên ngoài rõ ràng thay vì truyền văn bản tệp thô
    - sandboxing và allowlist công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub hoặc số điện thoại riêng không?">
    Có, với hầu hết thiết lập. Cô lập bot bằng tài khoản và số điện thoại riêng
    làm giảm phạm vi ảnh hưởng nếu có sự cố. Điều này cũng giúp xoay vòng
    thông tin xác thực hoặc thu hồi truy cập dễ hơn mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Bắt đầu nhỏ. Chỉ cấp quyền truy cập cho các công cụ và tài khoản bạn thật sự cần, rồi mở rộng
    sau nếu cần.

    Tài liệu: [Bảo mật](/vi/gateway/security), [Ghép đôi](/vi/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể trao quyền tự chủ với tin nhắn văn bản của mình không, và như vậy có an toàn không?">
    Chúng tôi **không** khuyến nghị trao toàn quyền tự chủ với tin nhắn cá nhân của bạn. Mẫu an toàn nhất là:

    - Giữ DM ở **chế độ ghép đôi** hoặc một allowlist chặt chẽ.
    - Dùng **số hoặc tài khoản riêng** nếu bạn muốn nó nhắn tin thay mặt bạn.
    - Để nó soạn nháp, rồi **phê duyệt trước khi gửi**.

    Nếu bạn muốn thử nghiệm, hãy làm trên một tài khoản chuyên dụng và giữ nó tách biệt. Xem
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình rẻ hơn cho tác vụ trợ lý cá nhân không?">
    Có, **nếu** tác tử chỉ chat và đầu vào đáng tin cậy. Các tầng nhỏ hơn
    dễ bị chiếm quyền chỉ dẫn hơn, vì vậy tránh dùng chúng cho tác tử có bật công cụ
    hoặc khi đọc nội dung không đáng tin cậy. Nếu bạn bắt buộc phải dùng mô hình nhỏ hơn, hãy khóa chặt
    công cụ và chạy trong sandbox. Xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã ghép đôi">
    Mã ghép đôi được gửi **chỉ** khi người gửi không xác định nhắn tin cho bot và
    `dmPolicy: "pairing"` được bật. Riêng `/start` không tạo mã.

    Kiểm tra yêu cầu đang chờ:

    ```bash
    openclaw pairing list telegram
    ```

    Nếu bạn muốn truy cập ngay, hãy thêm id người gửi của bạn vào allowlist hoặc đặt `dmPolicy: "open"`
    cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: nó có nhắn tin cho danh bạ của tôi không? Ghép đôi hoạt động thế nào?">
    Không. Chính sách DM mặc định của WhatsApp là **ghép đôi**. Người gửi không xác định chỉ nhận mã ghép đôi và tin nhắn của họ **không được xử lý**. OpenClaw chỉ trả lời các cuộc chat nó nhận được hoặc các lượt gửi rõ ràng do bạn kích hoạt.

    Phê duyệt ghép đôi bằng:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liệt kê yêu cầu đang chờ:

    ```bash
    openclaw pairing list whatsapp
    ```

    Lời nhắc số điện thoại trong wizard: nó được dùng để đặt **allowlist/chủ sở hữu** của bạn để DM của chính bạn được cho phép. Nó không được dùng để tự động gửi. Nếu bạn chạy trên số WhatsApp cá nhân của mình, hãy dùng số đó và bật `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh chat, hủy tác vụ và "nó không dừng"

<AccordionGroup>
  <Accordion title="Làm thế nào để ngăn thông báo hệ thống nội bộ hiển thị trong chat?">
    Hầu hết thông báo nội bộ hoặc thông báo công cụ chỉ xuất hiện khi **verbose**, **trace** hoặc **reasoning** được bật
    cho phiên đó.

    Sửa trong cuộc chat nơi bạn thấy nó:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Nếu vẫn còn nhiều nhiễu, hãy kiểm tra cài đặt phiên trong Control UI và đặt verbose
    thành **inherit**. Cũng xác nhận bạn không dùng hồ sơ bot có `verboseDefault` được đặt
    thành `on` trong cấu hình.

    Tài liệu: [Suy nghĩ và verbose](/vi/tools/thinking), [Bảo mật](/vi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm thế nào để dừng/hủy một tác vụ đang chạy?">
    Gửi bất kỳ nội dung nào sau đây **dưới dạng một tin nhắn độc lập** (không có dấu gạch chéo):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Đây là các trigger hủy (không phải lệnh gạch chéo).

    Với tiến trình nền (từ công cụ exec), bạn có thể yêu cầu tác tử chạy:

    ```
    process action:kill sessionId:XXX
    ```

    Tổng quan lệnh gạch chéo: xem [Lệnh gạch chéo](/vi/tools/slash-commands).

    Hầu hết lệnh phải được gửi dưới dạng tin nhắn **độc lập** bắt đầu bằng `/`, nhưng một vài lối tắt (như `/status`) cũng hoạt động nội dòng với người gửi trong allowlist.

  </Accordion>

  <Accordion title='Làm thế nào để gửi tin nhắn Discord từ Telegram? ("Cross-context messaging denied")'>
    OpenClaw chặn nhắn tin **chéo nhà cung cấp** theo mặc định. Nếu một lệnh gọi công cụ được ràng buộc
    với Telegram, nó sẽ không gửi đến Discord trừ khi bạn cho phép rõ ràng.

    Bật nhắn tin chéo nhà cung cấp cho tác tử:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Khởi động lại gateway sau khi chỉnh sửa cấu hình.

  </Accordion>

  <Accordion title='Tại sao có cảm giác bot "phớt lờ" các tin nhắn dồn dập?'>
    Chế độ hàng đợi kiểm soát cách tin nhắn mới tương tác với một lượt chạy đang diễn ra. Dùng `/queue` để đổi chế độ:

    - `steer` - xếp hàng tất cả điều hướng đang chờ cho ranh giới mô hình tiếp theo trong lượt chạy hiện tại
    - `queue` - điều hướng từng cái một kiểu cũ
    - `followup` - chạy tin nhắn từng cái một
    - `collect` - gom tin nhắn và trả lời một lần
    - `steer-backlog` - điều hướng ngay, rồi xử lý backlog
    - `interrupt` - hủy lượt chạy hiện tại và bắt đầu mới

    Chế độ mặc định là `steer`. Bạn có thể thêm các tùy chọn như `debounce:0.5s cap:25 drop:summarize` cho các chế độ theo dõi. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Khác

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic với khóa API là gì?'>
    Trong OpenClaw, thông tin xác thực và lựa chọn mô hình là riêng biệt. Việc đặt `ANTHROPIC_API_KEY` (hoặc lưu khóa API Anthropic trong hồ sơ xác thực) bật xác thực, nhưng mô hình mặc định thực tế là bất kỳ mô hình nào bạn cấu hình trong `agents.defaults.model.primary` (ví dụ: `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). Nếu bạn thấy `No credentials found for profile "anthropic:default"`, điều đó có nghĩa là Gateway không thể tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` dự kiến cho tác nhân đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn bị kẹt? Hãy hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [thảo luận trên GitHub](https://github.com/openclaw/openclaw/discussions).

## Liên quan

- [Câu hỏi thường gặp khi chạy lần đầu](/vi/help/faq-first-run) — cài đặt, onboard, xác thực, đăng ký, lỗi ban đầu
- [Câu hỏi thường gặp về mô hình](/vi/help/faq-models) — lựa chọn mô hình, chuyển dự phòng, hồ sơ xác thực
- [Khắc phục sự cố](/vi/help/troubleshooting) — phân loại theo triệu chứng đầu tiên
