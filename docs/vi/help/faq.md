---
read_when:
    - Giải đáp các câu hỏi hỗ trợ thường gặp về thiết lập, cài đặt, hướng dẫn ban đầu hoặc thời gian chạy
    - Phân loại các sự cố do người dùng báo cáo trước khi gỡ lỗi sâu hơn
summary: Các câu hỏi thường gặp về thiết lập, cấu hình và cách sử dụng OpenClaw
title: Câu hỏi thường gặp
x-i18n:
    generated_at: "2026-04-30T09:36:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Câu trả lời nhanh cùng phần khắc phục sự cố chuyên sâu hơn cho các thiết lập thực tế (phát triển cục bộ, VPS, đa tác nhân, OAuth/API keys, chuyển đổi dự phòng mô hình). Để chẩn đoán runtime, xem [Khắc phục sự cố](/vi/gateway/troubleshooting). Để xem tham chiếu cấu hình đầy đủ, xem [Cấu hình](/vi/gateway/configuration).

## 60 giây đầu tiên nếu có gì đó bị lỗi

1. **Trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt cục bộ nhanh: OS + bản cập nhật, khả năng truy cập gateway/dịch vụ, tác nhân/phiên, cấu hình provider + vấn đề runtime (khi có thể truy cập Gateway).

2. **Báo cáo có thể dán (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc với phần cuối nhật ký (tokens được che).

3. **Trạng thái daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime supervisor so với khả năng truy cập RPC, URL mục tiêu thăm dò và cấu hình mà dịch vụ có khả năng đã dùng.

4. **Thăm dò sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy thăm dò sức khỏe Gateway trực tiếp, bao gồm thăm dò kênh khi được hỗ trợ
   (yêu cầu Gateway có thể truy cập). Xem [Sức khỏe](/vi/gateway/health).

5. **Theo dõi nhật ký mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC ngừng hoạt động, dùng dự phòng:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Nhật ký tệp tách biệt với nhật ký dịch vụ; xem [Ghi nhật ký](/vi/logging) và [Khắc phục sự cố](/vi/gateway/troubleshooting).

6. **Chạy doctor (sửa chữa)**

   ```bash
   openclaw doctor
   ```

   Sửa chữa/di chuyển cấu hình/trạng thái + chạy kiểm tra sức khỏe. Xem [Doctor](/vi/gateway/doctor).

7. **Ảnh chụp nhanh Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh đầy đủ (chỉ WS). Xem [Sức khỏe](/vi/gateway/health).

## Bắt đầu nhanh và thiết lập lần chạy đầu tiên

Hỏi đáp lần chạy đầu tiên — cài đặt, onboard, tuyến xác thực, đăng ký, lỗi ban đầu —
nằm trong [FAQ lần chạy đầu tiên](/vi/help/faq-first-run).

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn?">
    OpenClaw là trợ lý AI cá nhân bạn chạy trên thiết bị của chính mình. Nó trả lời trên các bề mặt nhắn tin bạn đang dùng (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, và các plugin kênh đi kèm như QQ Bot) và cũng có thể hỗ trợ giọng nói + Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Đề xuất giá trị">
    OpenClaw không phải "chỉ là một wrapper cho Claude." Đây là **mặt phẳng điều khiển ưu tiên cục bộ** cho phép bạn chạy một
    trợ lý mạnh mẽ trên **phần cứng của chính bạn**, có thể truy cập từ các ứng dụng chat bạn đang dùng, với
    phiên có trạng thái, bộ nhớ và công cụ - mà không phải giao quyền kiểm soát workflow của bạn cho một
    SaaS được lưu trữ.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất cứ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử phiên ở cục bộ.
    - **Kênh thật, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/v.v.,
      cùng giọng nói trên di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc mô hình:** dùng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với định tuyến
      theo từng tác nhân và chuyển đổi dự phòng.
    - **Tùy chọn chỉ cục bộ:** chạy mô hình cục bộ để **toàn bộ dữ liệu có thể ở lại trên thiết bị của bạn** nếu bạn muốn.
    - **Định tuyến đa tác nhân:** tách tác nhân theo kênh, tài khoản hoặc tác vụ, mỗi tác nhân có
      workspace và mặc định riêng.
    - **Mã nguồn mở và dễ tùy biến:** kiểm tra, mở rộng và tự lưu trữ mà không bị khóa vào nhà cung cấp.

    Tài liệu: [Gateway](/vi/gateway), [Kênh](/vi/channels), [Đa tác nhân](/vi/concepts/multi-agent),
    [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập xong - tôi nên làm gì trước?">
    Các dự án đầu tiên phù hợp:

    - Xây dựng một website (WordPress, Shopify hoặc một site tĩnh đơn giản).
    - Tạo nguyên mẫu ứng dụng di động (dàn ý, màn hình, kế hoạch API).
    - Sắp xếp tệp và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa tóm tắt hoặc theo dõi.

    Nó có thể xử lý các tác vụ lớn, nhưng hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    dùng tác nhân phụ cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hằng ngày hàng đầu cho OpenClaw là gì?">
    Các lợi ích hằng ngày thường giống như:

    - **Bản tóm tắt cá nhân:** tóm tắt hộp thư, lịch và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt và bản nháp đầu tiên cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi:** lời nhắc và checklist do Cron hoặc Heartbeat điều khiển.
    - **Tự động hóa trình duyệt:** điền biểu mẫu, thu thập dữ liệu và lặp lại tác vụ web.
    - **Phối hợp giữa thiết bị:** gửi tác vụ từ điện thoại, để Gateway chạy trên máy chủ và nhận kết quả lại trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể hỗ trợ tạo khách hàng tiềm năng, tiếp cận, quảng cáo và blog cho SaaS không?">
    Có, với **nghiên cứu, đánh giá đủ điều kiện và soạn thảo**. Nó có thể quét site, tạo danh sách rút gọn,
    tóm tắt khách hàng tiềm năng và viết bản nháp tiếp cận hoặc nội dung quảng cáo.

    Với **chiến dịch tiếp cận hoặc quảng cáo**, hãy giữ con người trong vòng kiểm soát. Tránh spam, tuân thủ luật địa phương và
    chính sách nền tảng, và rà soát mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn nháp và bạn phê duyệt.

    Tài liệu: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Ưu điểm so với Claude Code cho phát triển web là gì?">
    OpenClaw là **trợ lý cá nhân** và lớp phối hợp, không phải công cụ thay thế IDE. Dùng
    Claude Code hoặc Codex để có vòng lặp lập trình trực tiếp nhanh nhất bên trong repo. Dùng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị và điều phối công cụ.

    Ưu điểm:

    - **Bộ nhớ + workspace liên tục** qua các phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, tệp, lập lịch, hooks)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ mọi nơi)
    - **Nodes** cho trình duyệt/màn hình/camera/exec cục bộ

    Trưng bày: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills và tự động hóa

<AccordionGroup>
  <Accordion title="Làm sao tùy chỉnh skills mà không làm repo bị bẩn?">
    Dùng override được quản lý thay vì chỉnh sửa bản sao trong repo. Đặt thay đổi của bạn trong `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bản đi kèm → `skills.load.extraDirs`, nên override được quản lý vẫn thắng các skills đi kèm mà không chạm vào git. Nếu bạn cần cài đặt skill toàn cục nhưng chỉ hiển thị với một số tác nhân, giữ bản sao dùng chung trong `~/.openclaw/skills` và kiểm soát khả năng hiển thị bằng `agents.defaults.skills` và `agents.list[].skills`. Chỉ các chỉnh sửa đáng đưa upstream mới nên nằm trong repo và được gửi dưới dạng PR.
  </Accordion>

  <Accordion title="Tôi có thể tải skills từ một thư mục tùy chỉnh không?">
    Có. Thêm các thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (mức ưu tiên thấp nhất). Thứ tự ưu tiên mặc định là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bản đi kèm → `skills.load.extraDirs`. `clawhub` cài đặt vào `./skills` theo mặc định, OpenClaw xem đó là `<workspace>/skills` trong phiên tiếp theo. Nếu skill chỉ nên hiển thị với một số tác nhân, kết hợp việc đó với `agents.defaults.skills` hoặc `agents.list[].skills`.
  </Accordion>

  <Accordion title="Làm sao dùng các mô hình khác nhau cho các tác vụ khác nhau?">
    Hiện nay các mẫu được hỗ trợ là:

    - **Cron jobs**: tác vụ tách biệt có thể đặt override `model` theo từng tác vụ.
    - **Tác nhân phụ**: định tuyến tác vụ đến các tác nhân riêng với mô hình mặc định khác nhau.
    - **Chuyển đổi theo yêu cầu**: dùng `/model` để chuyển mô hình của phiên hiện tại bất cứ lúc nào.

    Xem [Cron jobs](/vi/automation/cron-jobs), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), và [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị đứng khi làm việc nặng. Làm sao chuyển tải việc đó?">
    Dùng **tác nhân phụ** cho các tác vụ dài hoặc song song. Tác nhân phụ chạy trong phiên riêng,
    trả về tóm tắt và giữ cho chat chính của bạn phản hồi tốt.

    Yêu cầu bot của bạn "spawn a sub-agent for this task" hoặc dùng `/subagents`.
    Dùng `/status` trong chat để xem Gateway đang làm gì ngay lúc này (và liệu nó có đang bận không).

    Mẹo token: tác vụ dài và tác nhân phụ đều tiêu thụ tokens. Nếu lo ngại chi phí, đặt
    mô hình rẻ hơn cho tác nhân phụ qua `agents.defaults.subagents.model`.

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Các phiên subagent gắn với luồng hoạt động trên Discord như thế nào?">
    Dùng liên kết luồng. Bạn có thể liên kết một luồng Discord với mục tiêu subagent hoặc phiên để các tin nhắn tiếp theo trong luồng đó vẫn ở phiên đã liên kết.

    Luồng cơ bản:

    - Tạo bằng `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"` để theo dõi liên tục).
    - Hoặc liên kết thủ công bằng `/focus <target>`.
    - Dùng `/agents` để kiểm tra trạng thái liên kết.
    - Dùng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát tự động bỏ focus.
    - Dùng `/unfocus` để tách luồng.

    Cấu hình bắt buộc:

    - Mặc định toàn cục: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động liên kết khi tạo: đặt `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Discord](/vi/channels/discord), [Tham chiếu cấu hình](/vi/gateway/configuration-reference), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Một subagent đã hoàn tất, nhưng cập nhật hoàn tất đi sai nơi hoặc không bao giờ được đăng. Tôi nên kiểm tra gì?">
    Kiểm tra tuyến requester đã được phân giải trước:

    - Gửi subagent ở chế độ hoàn tất ưu tiên mọi luồng hoặc tuyến hội thoại đã liên kết khi có.
    - Nếu nguồn hoàn tất chỉ mang theo kênh, OpenClaw quay về tuyến đã lưu của phiên requester (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn có thể thành công.
    - Nếu không có tuyến đã liên kết lẫn tuyến đã lưu có thể dùng, gửi trực tiếp có thể thất bại và kết quả rơi về gửi qua hàng đợi phiên thay vì đăng ngay vào chat.
    - Mục tiêu không hợp lệ hoặc cũ vẫn có thể buộc quay về hàng đợi hoặc làm gửi cuối cùng thất bại.
    - Nếu phản hồi assistant hiển thị cuối cùng của tiến trình con là token im lặng chính xác `NO_REPLY` / `no_reply`, hoặc chính xác `ANNOUNCE_SKIP`, OpenClaw cố ý chặn thông báo thay vì đăng tiến trình cũ trước đó.
    - Nếu tiến trình con hết thời gian chờ sau khi chỉ gọi công cụ, thông báo có thể rút gọn việc đó thành một tóm tắt tiến trình một phần ngắn thay vì phát lại đầu ra công cụ thô.

    Gỡ lỗi:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks), [Công cụ phiên](/vi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron hoặc nhắc nhở không chạy. Tôi nên kiểm tra gì?">
    Cron chạy bên trong tiến trình Gateway. Nếu Gateway không chạy liên tục,
    các tác vụ đã lập lịch sẽ không chạy.

    Checklist:

    - Xác nhận cron đã bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` chưa được đặt.
    - Kiểm tra Gateway đang chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh cài đặt múi giờ cho tác vụ (`--tz` so với múi giờ máy chủ).

    Gỡ lỗi:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Cron jobs](/vi/automation/cron-jobs), [Tự động hóa & tác vụ](/vi/automation).

  </Accordion>

  <Accordion title="Cron đã kích hoạt, nhưng không có gì được gửi tới kênh. Vì sao?">
    Trước tiên hãy kiểm tra chế độ gửi:

    - `--no-deliver` / `delivery.mode: "none"` nghĩa là không mong đợi gửi dự phòng từ runner.
    - Thiếu hoặc mục tiêu thông báo không hợp lệ (`channel` / `to`) nghĩa là runner đã bỏ qua việc gửi ra ngoài.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là runner đã cố gửi nhưng thông tin xác thực đã chặn việc đó.
    - Kết quả cô lập im lặng (chỉ `NO_REPLY` / `no_reply`) được xem là cố ý không thể gửi, nên runner cũng chặn gửi dự phòng đã xếp hàng.

    Với các tác vụ Cron cô lập, agent vẫn có thể gửi trực tiếp bằng công cụ `message`
    khi có sẵn tuyến chat. `--announce` chỉ kiểm soát đường dự phòng của runner
    cho văn bản cuối cùng mà agent chưa tự gửi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Vì sao một lần chạy Cron cô lập lại đổi model hoặc thử lại một lần?">
    Đó thường là đường đổi model trực tiếp, không phải lập lịch trùng lặp.

    Cron cô lập có thể lưu một lần chuyển giao model runtime và thử lại khi lượt chạy
    đang hoạt động ném `LiveSessionModelSwitchError`. Lần thử lại giữ nguyên
    provider/model đã chuyển, và nếu lần chuyển mang theo một ghi đè hồ sơ xác thực mới, Cron
    cũng lưu ghi đè đó trước khi thử lại.

    Quy tắc chọn liên quan:

    - Ghi đè model của Gmail hook thắng trước khi áp dụng được.
    - Sau đó là `model` theo từng tác vụ.
    - Sau đó là bất kỳ ghi đè model nào đã lưu của phiên Cron.
    - Sau đó là lựa chọn model agent/mặc định thông thường.

    Vòng lặp thử lại có giới hạn. Sau lần thử ban đầu cộng với 2 lần thử lại do chuyển đổi,
    Cron sẽ hủy thay vì lặp mãi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [CLI Cron](/vi/cli/cron).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt Skills trên Linux?">
    Dùng các lệnh `openclaw skills` gốc hoặc thả Skills vào workspace của bạn. UI Skills trên macOS không có trên Linux.
    Duyệt Skills tại [https://clawhub.ai](https://clawhub.ai).

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

    `openclaw skills install` gốc ghi vào thư mục `skills/` của workspace
    đang hoạt động. Chỉ cài CLI `clawhub` riêng nếu bạn muốn xuất bản hoặc
    đồng bộ Skills của riêng mình. Với cài đặt dùng chung giữa các agent, đặt Skill dưới
    `~/.openclaw/skills` và dùng `agents.defaults.skills` hoặc
    `agents.list[].skills` nếu bạn muốn giới hạn agent nào có thể thấy nó.

  </Accordion>

  <Accordion title="OpenClaw có thể chạy tác vụ theo lịch hoặc liên tục trong nền không?">
    Có. Dùng bộ lập lịch Gateway:

    - **Tác vụ Cron** cho tác vụ theo lịch hoặc định kỳ (tồn tại qua các lần khởi động lại).
    - **Heartbeat** cho các lần kiểm tra định kỳ của "phiên chính".
    - **Tác vụ cô lập** cho agent tự động đăng tóm tắt hoặc gửi tới chat.

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa & tác vụ](/vi/automation),
    [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy Skills chỉ dành cho Apple macOS từ Linux không?">
    Không trực tiếp. Skills macOS bị kiểm soát bởi `metadata.openclaw.os` cùng các binary bắt buộc, và Skills chỉ xuất hiện trong system prompt khi chúng đủ điều kiện trên **máy chủ Gateway**. Trên Linux, Skills chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè cơ chế kiểm soát đó.

    Bạn có ba mẫu được hỗ trợ:

    **Tùy chọn A - chạy Gateway trên Mac (đơn giản nhất).**
    Chạy Gateway ở nơi có các binary macOS, rồi kết nối từ Linux ở [chế độ từ xa](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Skills tải bình thường vì máy chủ Gateway là macOS.

    **Tùy chọn B - dùng một Node macOS (không SSH).**
    Chạy Gateway trên Linux, ghép đôi một Node macOS (ứng dụng thanh menu), và đặt **Lệnh chạy Node** thành "Always Ask" hoặc "Always Allow" trên Mac. OpenClaw có thể xem Skills chỉ dành cho macOS là đủ điều kiện khi các binary bắt buộc tồn tại trên Node. Agent chạy những Skills đó qua công cụ `nodes`. Nếu bạn chọn "Always Ask", việc phê duyệt "Always Allow" trong lời nhắc sẽ thêm lệnh đó vào allowlist.

    **Tùy chọn C - proxy binary macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các binary CLI bắt buộc phân giải tới các wrapper SSH chạy trên Mac. Sau đó ghi đè Skill để cho phép Linux, nhờ vậy nó vẫn đủ điều kiện.

    1. Tạo wrapper SSH cho binary (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đặt wrapper vào `PATH` trên máy chủ Linux (ví dụ `~/bin/memo`).
    3. Ghi đè metadata của Skill (workspace hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu phiên mới để ảnh chụp nhanh Skills được làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Hiện chưa tích hợp sẵn.

    Tùy chọn:

    - **Skill / Plugin tùy chỉnh:** tốt nhất cho truy cập API đáng tin cậy (Notion/HeyGen đều có API).
    - **Tự động hóa trình duyệt:** hoạt động không cần code nhưng chậm hơn và dễ hỏng hơn.

    Nếu bạn muốn giữ ngữ cảnh theo từng khách hàng (quy trình của agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (ngữ cảnh + tùy chọn + công việc đang hoạt động).
    - Yêu cầu agent lấy trang đó ở đầu phiên.

    Nếu bạn muốn tích hợp gốc, hãy mở yêu cầu tính năng hoặc xây dựng một Skill
    nhắm tới các API đó.

    Cài đặt Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Các cài đặt gốc nằm trong thư mục `skills/` của workspace đang hoạt động. Với Skills dùng chung giữa các agent, đặt chúng trong `~/.openclaw/skills/<name>/SKILL.md`. Nếu chỉ một số agent nên thấy một cài đặt dùng chung, hãy cấu hình `agents.defaults.skills` hoặc `agents.list[].skills`. Một số Skills yêu cầu binary được cài qua Homebrew; trên Linux điều đó nghĩa là Linuxbrew (xem mục FAQ Homebrew Linux ở trên). Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và [ClawHub](/vi/tools/clawhub).

  </Accordion>

  <Accordion title="Làm cách nào để dùng Chrome hiện đã đăng nhập của tôi với OpenClaw?">
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

    Đường này có thể dùng trình duyệt máy chủ cục bộ hoặc một Node trình duyệt đã kết nối. Nếu Gateway chạy ở nơi khác, hãy chạy một máy chủ Node trên máy trình duyệt hoặc dùng CDP từ xa.

    Giới hạn hiện tại trên `existing-session` / `user`:

    - thao tác dựa trên ref, không dựa trên CSS selector
    - tải lên yêu cầu `ref` / `inputRef` và hiện chỉ hỗ trợ mỗi lần một tệp
    - `responsebody`, xuất PDF, chặn tải xuống, và thao tác hàng loạt vẫn cần trình duyệt được quản lý hoặc hồ sơ CDP thô

  </Accordion>
</AccordionGroup>

## Sandbox và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu riêng về sandbox không?">
    Có. Xem [Sandbox](/vi/gateway/sandboxing). Với thiết lập dành riêng cho Docker (Gateway đầy đủ trong Docker hoặc image sandbox), xem [Docker](/vi/install/docker).
  </Accordion>

  <Accordion title="Docker có vẻ bị giới hạn - làm cách nào để bật đầy đủ tính năng?">
    Image mặc định ưu tiên bảo mật và chạy với người dùng `node`, nên nó không
    bao gồm gói hệ thống, Homebrew, hoặc trình duyệt đi kèm. Để thiết lập đầy đủ hơn:

    - Duy trì `/home/node` bằng `OPENCLAW_HOME_VOLUME` để cache tồn tại.
    - Đưa deps hệ thống vào image bằng `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Cài trình duyệt Playwright qua CLI đi kèm:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và đảm bảo đường dẫn được duy trì.

    Tài liệu: [Docker](/vi/install/docker), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DM cá nhân nhưng làm cho nhóm công khai/chạy trong sandbox bằng một agent không?">
    Có - nếu lưu lượng riêng tư của bạn là **DM** và lưu lượng công khai là **nhóm**.

    Dùng `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (khóa không phải main) chạy trong backend sandbox đã cấu hình, còn phiên DM chính vẫn ở trên máy chủ. Docker là backend mặc định nếu bạn không chọn cái nào. Sau đó giới hạn các công cụ có sẵn trong phiên sandbox qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Nhóm: DM cá nhân + nhóm công khai](/vi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham khảo cấu hình chính: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Làm cách nào để bind một thư mục máy chủ vào sandbox?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Bind toàn cục + theo agent được gộp; bind theo agent bị bỏ qua khi `scope: "shared"`. Dùng `:ro` cho bất kỳ thứ gì nhạy cảm và nhớ rằng bind bỏ qua các vách ngăn hệ thống tệp của sandbox.

    OpenClaw xác thực nguồn bind dựa trên cả đường dẫn đã chuẩn hóa và đường dẫn canonical được phân giải qua tổ tiên sâu nhất hiện có. Điều đó nghĩa là các lần thoát qua cha symlink vẫn bị đóng lỗi ngay cả khi đoạn đường dẫn cuối chưa tồn tại, và kiểm tra allowed-root vẫn áp dụng sau khi phân giải symlink.

    Xem [Sandbox](/vi/gateway/sandboxing#custom-bind-mounts) và [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để xem ví dụ và ghi chú an toàn.

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong workspace của agent:

    - Ghi chú hằng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn đã tuyển chọn trong `MEMORY.md` (chỉ phiên chính/riêng tư)

    OpenClaw cũng chạy **xả bộ nhớ trước Compaction im lặng** để nhắc model
    ghi các ghi chú bền vững trước auto-compaction. Việc này chỉ chạy khi workspace
    có thể ghi (sandbox chỉ đọc sẽ bỏ qua). Xem [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên mọi thứ. Làm cách nào để giữ lại?">
    Yêu cầu bot **ghi sự kiện vào bộ nhớ**. Ghi chú dài hạn thuộc về `MEMORY.md`,
    ngữ cảnh ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là một lĩnh vực chúng tôi đang cải thiện. Việc nhắc model lưu ký ức sẽ hữu ích;
    nó sẽ biết cần làm gì. Nếu nó vẫn quên, hãy xác minh Gateway đang dùng cùng một
    workspace trong mọi lần chạy.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Workspace của agent](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi không? Giới hạn là gì?">
    Tệp bộ nhớ nằm trên đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là
    dung lượng lưu trữ của bạn, không phải model. **Ngữ cảnh phiên** vẫn bị giới hạn bởi
    cửa sổ ngữ cảnh của model, nên các cuộc trò chuyện dài có thể được compact hoặc cắt bớt. Đó là lý do
    tồn tại tìm kiếm bộ nhớ - nó chỉ kéo các phần liên quan trở lại ngữ cảnh.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Ngữ cảnh](/vi/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có cần khóa API OpenAI không?">
    Chỉ cần nếu bạn dùng **OpenAI embeddings**. Codex OAuth bao gồm chat/completions và
    **không** cấp quyền truy cập embeddings, vì vậy **đăng nhập bằng Codex (OAuth hoặc
    đăng nhập Codex CLI)** không giúp ích cho tìm kiếm bộ nhớ ngữ nghĩa. OpenAI embeddings
    vẫn cần một khóa API thật (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt rõ nhà cung cấp, OpenClaw tự động chọn nhà cung cấp khi nó
    có thể phân giải khóa API (hồ sơ xác thực, `models.providers.*.apiKey`, hoặc biến môi trường).
    Nó ưu tiên OpenAI nếu phân giải được khóa OpenAI, nếu không thì Gemini nếu phân giải được
    khóa Gemini, rồi Voyage, rồi Mistral. Nếu không có khóa từ xa, tìm kiếm bộ nhớ
    vẫn bị tắt cho đến khi bạn cấu hình. Nếu bạn có đường dẫn mô hình cục bộ
    được cấu hình và hiện có, OpenClaw
    ưu tiên `local`. Ollama được hỗ trợ khi bạn đặt rõ
    `memorySearch.provider = "ollama"`.

    Nếu bạn muốn giữ mọi thứ cục bộ, hãy đặt `memorySearch.provider = "local"` (và tùy chọn
    `memorySearch.fallback = "none"`). Nếu bạn muốn dùng Gemini embeddings, hãy đặt
    `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc
    `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ các mô hình embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, hoặc local**
    - xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Nơi các thành phần nằm trên đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu dùng với OpenClaw có được lưu cục bộ không?">
    Không - **trạng thái của OpenClaw là cục bộ**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho họ**.

    - **Mặc định cục bộ:** phiên, tệp bộ nhớ, cấu hình và workspace nằm trên máy chủ Gateway
      (`~/.openclaw` + thư mục workspace của bạn).
    - **Từ xa do cần thiết:** tin nhắn bạn gửi đến nhà cung cấp mô hình (Anthropic/OpenAI/v.v.) đi đến
      API của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/v.v.) lưu dữ liệu tin nhắn trên
      máy chủ của họ.
    - **Bạn kiểm soát phạm vi dữ liệu:** dùng mô hình cục bộ giữ prompt trên máy của bạn, nhưng lưu lượng kênh
      vẫn đi qua máy chủ của kênh đó.

    Liên quan: [Workspace của agent](/vi/concepts/agent-workspace), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu dữ liệu ở đâu?">
    Mọi thứ nằm dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                       | Mục đích                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (được sao chép vào hồ sơ xác thực ở lần dùng đầu tiên) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, khóa API, và `keyRef`/`tokenRef` tùy chọn)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload bí mật tùy chọn dựa trên tệp cho nhà cung cấp SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được loại bỏ)         |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái nhà cung cấp (ví dụ `whatsapp/<accountId>/creds.json`)   |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái theo từng agent (agentDir + phiên)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử hội thoại & trạng thái (theo từng agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Siêu dữ liệu phiên (theo từng agent)                               |

    Đường dẫn một agent cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`).

    **Workspace** của bạn (AGENTS.md, tệp bộ nhớ, skills, v.v.) tách biệt và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên nằm ở đâu?">
    Các tệp này nằm trong **workspace của agent**, không phải `~/.openclaw`.

    - **Workspace (theo từng agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` tùy chọn.
      `memory.md` chữ thường ở gốc chỉ là đầu vào sửa chữa cũ; `openclaw doctor --fix`
      có thể gộp nó vào `MEMORY.md` khi cả hai tệp tồn tại.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, trạng thái kênh/nhà cung cấp, hồ sơ xác thực, phiên, nhật ký,
      và Skills dùng chung (`~/.openclaw/skills`).

    Workspace mặc định là `~/.openclaw/workspace`, có thể cấu hình qua:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, hãy xác nhận Gateway đang dùng cùng
    workspace ở mọi lần khởi chạy (và nhớ rằng: chế độ từ xa dùng workspace của **máy chủ gateway**,
    không phải laptop cục bộ của bạn).

    Mẹo: nếu bạn muốn một hành vi hoặc tùy chọn bền vững, hãy yêu cầu bot **ghi nó vào
    AGENTS.md hoặc MEMORY.md** thay vì dựa vào lịch sử chat.

    Xem [Workspace của agent](/vi/concepts/agent-workspace) và [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **workspace của agent** của bạn trong một kho git **riêng tư** và sao lưu nó ở một nơi
    riêng tư (ví dụ GitHub riêng tư). Việc này lưu lại bộ nhớ + các tệp AGENTS/SOUL/USER,
    và cho phép bạn khôi phục "tâm trí" của trợ lý sau này.

    **Không** commit bất cứ thứ gì dưới `~/.openclaw` (thông tin đăng nhập, phiên, token, hoặc payload bí mật đã mã hóa).
    Nếu bạn cần khôi phục đầy đủ, hãy sao lưu riêng cả workspace và thư mục trạng thái
    (xem câu hỏi về di chuyển ở trên).

    Tài liệu: [Workspace của agent](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm cách nào để gỡ cài đặt hoàn toàn OpenClaw?">
    Xem hướng dẫn riêng: [Gỡ cài đặt](/vi/install/uninstall).
  </Accordion>

  <Accordion title="Agent có thể làm việc bên ngoài workspace không?">
    Có. Workspace là **cwd mặc định** và neo bộ nhớ, không phải sandbox cứng.
    Đường dẫn tương đối phân giải bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các
    vị trí khác trên máy chủ trừ khi bật sandboxing. Nếu bạn cần cách ly, hãy dùng
    [`agents.defaults.sandbox`](/vi/gateway/sandboxing) hoặc thiết lập sandbox theo từng agent. Nếu bạn
    muốn một repo là thư mục làm việc mặc định, hãy trỏ `workspace` của agent đó
    đến gốc repo. Repo OpenClaw chỉ là mã nguồn; hãy giữ
    workspace tách biệt trừ khi bạn cố ý muốn agent làm việc bên trong nó.

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
    Trạng thái phiên thuộc sở hữu của **máy chủ gateway**. Nếu bạn đang ở chế độ từ xa, kho phiên bạn cần quan tâm nằm trên máy từ xa, không phải laptop cục bộ của bạn. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>
</AccordionGroup>

## Cơ bản về cấu hình

<AccordionGroup>
  <Accordion title="Cấu hình có định dạng gì? Nó ở đâu?">
    OpenClaw đọc cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Nếu thiếu tệp, nó dùng các mặc định tương đối an toàn (bao gồm workspace mặc định là `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Tôi đặt gateway.bind: "lan" (hoặc "tailnet") và giờ không có gì lắng nghe / UI báo chưa được ủy quyền'>
    Bind không phải loopback **yêu cầu một đường dẫn xác thực gateway hợp lệ**. Trên thực tế điều đó nghĩa là:

    - xác thực shared-secret: token hoặc mật khẩu
    - `gateway.auth.mode: "trusted-proxy"` phía sau reverse proxy nhận biết danh tính được cấu hình đúng

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

    - `gateway.remote.token` / `.password` tự chúng **không** bật xác thực gateway cục bộ.
    - Đường dẫn gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm dự phòng khi `gateway.auth.*` chưa được đặt.
    - Với xác thực bằng mật khẩu, thay vào đó hãy đặt `gateway.auth.mode: "password"` cùng với `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
    - Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ qua SecretRef và không phân giải được, quá trình phân giải sẽ đóng an toàn (không bị fallback từ xa che lấp).
    - Các thiết lập Control UI dùng shared-secret xác thực qua `connect.params.auth.token` hoặc `connect.params.auth.password` (được lưu trong cài đặt app/UI). Các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy` dùng header yêu cầu thay thế. Tránh đặt shared secret trong URL.
    - Với `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback cùng máy chủ yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true` và một mục loopback trong `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Tại sao giờ tôi cần token trên localhost?">
    OpenClaw thực thi xác thực gateway theo mặc định, bao gồm cả loopback. Trong đường dẫn mặc định thông thường, điều đó nghĩa là xác thực bằng token: nếu không có đường dẫn xác thực rõ ràng nào được cấu hình, khởi động gateway sẽ phân giải sang chế độ token và tự động tạo một token, lưu vào `gateway.auth.token`, vì vậy **client WS cục bộ phải xác thực**. Việc này chặn các tiến trình cục bộ khác gọi Gateway.

    Nếu bạn muốn một đường dẫn xác thực khác, bạn có thể chọn rõ chế độ mật khẩu (hoặc, với reverse proxy nhận biết danh tính, `trusted-proxy`). Nếu bạn **thực sự** muốn mở loopback, hãy đặt rõ `gateway.auth.mode: "none"` trong cấu hình. Doctor có thể tạo token cho bạn bất kỳ lúc nào: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ hot-reload:

    - `gateway.reload.mode: "hybrid"` (mặc định): áp dụng nóng các thay đổi an toàn, khởi động lại cho các thay đổi quan trọng
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
    - `default`: dùng `All your chats, one OpenClaw.` mỗi lần.
    - `random`: xoay vòng các tagline hài hước/theo mùa (hành vi mặc định).
    - Nếu bạn không muốn có banner nào, hãy đặt biến môi trường `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm cách nào để bật tìm kiếm web (và tải nội dung web)?">
    `web_fetch` hoạt động không cần khóa API. `web_search` phụ thuộc vào nhà cung cấp
    bạn chọn:

    - Các nhà cung cấp dựa trên API như Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, và Tavily yêu cầu thiết lập khóa API thông thường của họ.
    - Ollama Web Search không cần khóa, nhưng nó dùng máy chủ Ollama bạn đã cấu hình và yêu cầu `ollama signin`.
    - DuckDuckGo không cần khóa, nhưng đó là tích hợp không chính thức dựa trên HTML.
    - SearXNG không cần khóa/tự lưu trữ; cấu hình `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Khuyến nghị:** chạy `openclaw configure --section web` và chọn một nhà cung cấp.
    Các phương án thay thế bằng môi trường:

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

    Cấu hình tìm kiếm web dành riêng cho nhà cung cấp hiện nằm trong `plugins.entries.<plugin>.config.webSearch.*`.
    Các đường dẫn nhà cung cấp cũ `tools.web.search.*` vẫn tạm thời được tải để tương thích, nhưng không nên dùng cho cấu hình mới.
    Cấu hình dự phòng tìm nạp web của Firecrawl nằm trong `plugins.entries.firecrawl.config.webFetch.*`.

    Ghi chú:

    - Nếu bạn dùng danh sách cho phép, hãy thêm `web_search`/`web_fetch`/`x_search` hoặc `group:web`.
    - `web_fetch` được bật theo mặc định (trừ khi bị tắt rõ ràng).
    - Nếu bỏ qua `tools.web.fetch.provider`, OpenClaw sẽ tự động phát hiện nhà cung cấp dự phòng tìm nạp đầu tiên đã sẵn sàng từ các thông tin xác thực có sẵn. Hiện tại nhà cung cấp đi kèm là Firecrawl.
    - Daemon đọc biến môi trường từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Công cụ web](/vi/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa sạch cấu hình của tôi. Làm thế nào để khôi phục và tránh việc này?">
    `config.apply` thay thế **toàn bộ cấu hình**. Nếu bạn gửi một đối tượng một phần, mọi thứ
    khác sẽ bị xóa.

    OpenClaw hiện tại bảo vệ khỏi nhiều trường hợp ghi đè ngoài ý muốn:

    - Các lần ghi cấu hình do OpenClaw sở hữu xác thực toàn bộ cấu hình sau thay đổi trước khi ghi.
    - Các lần ghi không hợp lệ hoặc có tính phá hủy do OpenClaw sở hữu bị từ chối và được lưu dưới dạng `openclaw.json.rejected.*`.
    - Nếu chỉnh sửa trực tiếp làm hỏng quá trình khởi động hoặc tải lại nóng, Gateway sẽ khôi phục cấu hình tốt gần nhất đã biết và lưu tệp bị từ chối dưới dạng `openclaw.json.clobbered.*`.
    - Agent chính nhận cảnh báo khởi động sau khi khôi phục để không ghi lại cấu hình lỗi một cách mù quáng.

    Khôi phục:

    - Kiểm tra `openclaw logs --follow` để tìm `Config auto-restored from last-known-good`, `Config write rejected:`, hoặc `config reload restored last-known-good config`.
    - Kiểm tra `openclaw.json.clobbered.*` hoặc `openclaw.json.rejected.*` mới nhất bên cạnh cấu hình đang hoạt động.
    - Giữ cấu hình đã khôi phục đang hoạt động nếu nó chạy được, rồi chỉ sao chép lại các khóa mong muốn bằng `openclaw config set` hoặc `config.patch`.
    - Chạy `openclaw config validate` và `openclaw doctor`.
    - Nếu bạn không có cấu hình tốt gần nhất đã biết hoặc payload bị từ chối, hãy khôi phục từ bản sao lưu, hoặc chạy lại `openclaw doctor` và cấu hình lại các kênh/mô hình.
    - Nếu điều này xảy ra ngoài dự kiến, hãy báo lỗi và đính kèm cấu hình gần nhất bạn biết hoặc bất kỳ bản sao lưu nào.
    - Một agent lập trình cục bộ thường có thể dựng lại cấu hình hoạt động được từ nhật ký hoặc lịch sử.

    Tránh việc này:

    - Dùng `openclaw config set` cho các thay đổi nhỏ.
    - Dùng `openclaw configure` cho các chỉnh sửa tương tác.
    - Dùng `config.schema.lookup` trước khi bạn không chắc về đường dẫn chính xác hoặc hình dạng trường; nó trả về một nút schema nông kèm các tóm tắt con trực tiếp để đi sâu.
    - Dùng `config.patch` cho các chỉnh sửa RPC một phần; chỉ dùng `config.apply` để thay thế toàn bộ cấu hình.
    - Nếu bạn đang dùng công cụ `gateway` chỉ dành cho chủ sở hữu từ một lần chạy agent, nó vẫn sẽ từ chối ghi vào `tools.exec.ask` / `tools.exec.security` (bao gồm các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ).

    Tài liệu: [Cấu hình](/vi/cli/config), [Cấu hình tương tác](/vi/cli/configure), [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Làm thế nào để chạy một Gateway trung tâm với các worker chuyên biệt trên nhiều thiết bị?">
    Mẫu phổ biến là **một Gateway** (ví dụ Raspberry Pi) cộng với **node** và **agent**:

    - **Gateway (trung tâm):** sở hữu các kênh (Signal/WhatsApp), định tuyến và phiên.
    - **Node (thiết bị):** Mac/iOS/Android kết nối như thiết bị ngoại vi và cung cấp công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Agent (worker):** các bộ não/không gian làm việc riêng cho vai trò đặc biệt (ví dụ: "vận hành Hetzner", "dữ liệu cá nhân").
    - **Sub-agent:** tạo công việc nền từ agent chính khi bạn muốn xử lý song song.
    - **TUI:** kết nối tới Gateway và chuyển đổi agent/phiên.

    Tài liệu: [Node](/vi/nodes), [Truy cập từ xa](/vi/gateway/remote), [Định tuyến đa agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [TUI](/vi/web/tui).

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

    Mặc định là `false` (có giao diện). Headless dễ kích hoạt kiểm tra chống bot hơn trên một số trang. Xem [Trình duyệt](/vi/tools/browser).

    Headless dùng **cùng engine Chromium** và hoạt động với hầu hết tác vụ tự động hóa (biểu mẫu, nhấp chuột, scraping, đăng nhập). Các khác biệt chính:

    - Không có cửa sổ trình duyệt hiển thị (dùng ảnh chụp màn hình nếu bạn cần hình ảnh).
    - Một số trang nghiêm ngặt hơn với tự động hóa ở chế độ headless (CAPTCHA, chống bot).
      Ví dụ, X/Twitter thường chặn các phiên headless.

  </Accordion>

  <Accordion title="Làm thế nào để dùng Brave cho điều khiển trình duyệt?">
    Đặt `browser.executablePath` thành binary Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) và khởi động lại Gateway.
    Xem đầy đủ ví dụ cấu hình trong [Trình duyệt](/vi/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway và node từ xa

<AccordionGroup>
  <Accordion title="Lệnh truyền giữa Telegram, gateway và node như thế nào?">
    Tin nhắn Telegram được xử lý bởi **gateway**. Gateway chạy agent và
    chỉ sau đó mới gọi node qua **Gateway WebSocket** khi cần công cụ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node không thấy lưu lượng provider đi vào; chúng chỉ nhận các lệnh gọi RPC node.

  </Accordion>

  <Accordion title="Agent của tôi có thể truy cập máy tính của tôi như thế nào nếu Gateway được lưu trữ từ xa?">
    Câu trả lời ngắn: **ghép đôi máy tính của bạn làm node**. Gateway chạy ở nơi khác, nhưng nó có thể
    gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    Thiết lập điển hình:

    1. Chạy Gateway trên máy chủ luôn bật (VPS/máy chủ tại nhà).
    2. Đặt máy chủ Gateway + máy tính của bạn trên cùng tailnet.
    3. Đảm bảo Gateway WS có thể truy cập được (bind tailnet hoặc tunnel SSH).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Từ xa qua SSH** (hoặc tailnet trực tiếp)
       để nó có thể đăng ký làm node.
    5. Phê duyệt node trên Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu nối TCP riêng; node kết nối qua Gateway WebSocket.

    Nhắc nhở bảo mật: ghép đôi một node macOS cho phép `system.run` trên máy đó. Chỉ
    ghép đôi các thiết bị bạn tin tưởng, và xem lại [Bảo mật](/vi/gateway/security).

    Tài liệu: [Node](/vi/nodes), [Giao thức Gateway](/vi/gateway/protocol), [Chế độ từ xa macOS](/vi/platforms/mac/remote), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Bây giờ làm gì?">
    Kiểm tra các điều cơ bản:

    - Gateway đang chạy: `openclaw gateway status`
    - Sức khỏe Gateway: `openclaw status`
    - Sức khỏe kênh: `openclaw channels status`

    Sau đó xác minh xác thực và định tuyến:

    - Nếu bạn dùng Tailscale Serve, hãy đảm bảo `gateway.auth.allowTailscale` được đặt đúng.
    - Nếu bạn kết nối qua tunnel SSH, xác nhận tunnel cục bộ đang hoạt động và trỏ tới đúng cổng.
    - Xác nhận danh sách cho phép của bạn (DM hoặc nhóm) bao gồm tài khoản của bạn.

    Tài liệu: [Tailscale](/vi/gateway/tailscale), [Truy cập từ xa](/vi/gateway/remote), [Kênh](/vi/channels).

  </Accordion>

  <Accordion title="Hai phiên bản OpenClaw có thể nói chuyện với nhau không (cục bộ + VPS)?">
    Có. Không có cầu nối "bot-to-bot" tích hợp sẵn, nhưng bạn có thể nối chúng theo một vài
    cách đáng tin cậy:

    **Đơn giản nhất:** dùng một kênh chat bình thường mà cả hai bot đều có thể truy cập (Telegram/Slack/WhatsApp).
    Cho Bot A gửi tin nhắn tới Bot B, rồi để Bot B trả lời như thường lệ.

    **Cầu nối CLI (chung):** chạy một script gọi Gateway còn lại bằng
    `openclaw agent --message ... --deliver`, nhắm tới một cuộc chat nơi bot còn lại
    đang lắng nghe. Nếu một bot ở trên VPS từ xa, hãy trỏ CLI của bạn tới Gateway từ xa đó
    qua SSH/Tailscale (xem [Truy cập từ xa](/vi/gateway/remote)).

    Mẫu ví dụ (chạy từ máy có thể truy cập Gateway đích):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Mẹo: thêm một rào chắn để hai bot không lặp vô tận (chỉ khi được nhắc đến, danh sách
    cho phép theo kênh, hoặc quy tắc "không trả lời tin nhắn bot").

    Tài liệu: [Truy cập từ xa](/vi/gateway/remote), [CLI agent](/vi/cli/agent), [Gửi agent](/vi/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần VPS riêng cho nhiều agent không?">
    Không. Một Gateway có thể lưu trữ nhiều agent, mỗi agent có không gian làm việc, mặc định mô hình,
    và định tuyến riêng. Đây là thiết lập bình thường và rẻ hơn, đơn giản hơn nhiều so với chạy
    một VPS cho mỗi agent.

    Chỉ dùng VPS riêng khi bạn cần cô lập cứng (ranh giới bảo mật) hoặc các cấu hình rất
    khác nhau mà bạn không muốn chia sẻ. Nếu không, hãy giữ một Gateway và
    dùng nhiều agent hoặc sub-agent.

  </Accordion>

  <Accordion title="Có lợi ích gì khi dùng node trên laptop cá nhân thay vì SSH từ VPS không?">
    Có - node là cách chính thống để truy cập laptop của bạn từ Gateway từ xa, và chúng
    mở khóa nhiều hơn quyền truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và
    nhẹ (một VPS nhỏ hoặc máy cỡ Raspberry Pi là đủ; 4 GB RAM là dư), nên thiết lập phổ biến
    là một máy chủ luôn bật cộng với laptop của bạn làm node.

    - **Không cần SSH đi vào.** Node kết nối ra Gateway WebSocket và dùng ghép đôi thiết bị.
    - **Kiểm soát thực thi an toàn hơn.** `system.run` được kiểm soát bởi danh sách cho phép/phê duyệt node trên laptop đó.
    - **Nhiều công cụ thiết bị hơn.** Node cung cấp `canvas`, `camera`, và `screen` ngoài `system.run`.
    - **Tự động hóa trình duyệt cục bộ.** Giữ Gateway trên VPS, nhưng chạy Chrome cục bộ thông qua máy chủ node trên laptop, hoặc gắn vào Chrome cục bộ trên máy chủ qua Chrome MCP.

    SSH ổn cho truy cập shell ad-hoc, nhưng node đơn giản hơn cho các quy trình agent liên tục và
    tự động hóa thiết bị.

    Tài liệu: [Node](/vi/nodes), [CLI node](/vi/cli/nodes), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Node có chạy dịch vụ gateway không?">
    Không. Chỉ nên chạy **một gateway** trên mỗi máy chủ trừ khi bạn cố ý chạy các profile cô lập (xem [Nhiều gateway](/vi/gateway/multiple-gateways)). Node là thiết bị ngoại vi kết nối
    tới gateway (node iOS/Android, hoặc "chế độ node" macOS trong ứng dụng thanh menu). Với máy chủ node
    headless và điều khiển CLI, xem [CLI máy chủ Node](/vi/cli/node).

    Cần khởi động lại đầy đủ cho các thay đổi `gateway`, `discovery`, và `canvasHost`.

  </Accordion>

  <Accordion title="Có cách API / RPC để áp dụng cấu hình không?">
    Có.

    - `config.schema.lookup`: kiểm tra một cây con cấu hình với nút schema nông, gợi ý UI khớp, và tóm tắt con trực tiếp trước khi ghi
    - `config.get`: lấy snapshot hiện tại + hash
    - `config.patch`: cập nhật một phần an toàn (ưu tiên cho hầu hết chỉnh sửa RPC); tải lại nóng khi có thể và khởi động lại khi cần
    - `config.apply`: xác thực + thay thế toàn bộ cấu hình; tải lại nóng khi có thể và khởi động lại khi cần
    - Công cụ runtime `gateway` chỉ dành cho chủ sở hữu vẫn từ chối ghi lại `tools.exec.ask` / `tools.exec.security`; các bí danh cũ `tools.bash.*` chuẩn hóa về cùng các đường dẫn exec được bảo vệ

  </Accordion>

  <Accordion title="Cấu hình tối thiểu hợp lý cho lần cài đặt đầu tiên">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cấu hình này đặt workspace của bạn và giới hạn những ai có thể kích hoạt bot.

  </Accordion>

  <Accordion title="Làm thế nào để thiết lập Tailscale trên VPS và kết nối từ máy Mac?">
    Các bước tối thiểu:

    1. **Cài đặt + đăng nhập trên VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Cài đặt + đăng nhập trên máy Mac của bạn**
       - Dùng ứng dụng Tailscale và đăng nhập vào cùng tailnet.
    3. **Bật MagicDNS (khuyến nghị)**
       - Trong bảng điều khiển quản trị Tailscale, bật MagicDNS để VPS có một tên ổn định.
    4. **Dùng tên máy chủ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Nếu bạn muốn dùng Control UI mà không cần SSH, hãy dùng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cách này giữ gateway chỉ bind vào loopback và cung cấp HTTPS qua Tailscale. Xem [Tailscale](/vi/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm thế nào để kết nối Node Mac với Gateway từ xa (Tailscale Serve)?">
    Serve cung cấp **Gateway Control UI + WS**. Các Node kết nối qua cùng endpoint Gateway WS.

    Thiết lập khuyến nghị:

    1. **Đảm bảo VPS + Mac nằm trong cùng tailnet**.
    2. **Dùng ứng dụng macOS ở chế độ từ xa** (đích SSH có thể là tên máy chủ tailnet).
       Ứng dụng sẽ tạo tunnel cho cổng Gateway và kết nối như một Node.
    3. **Phê duyệt Node** trên gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Giao thức Gateway](/vi/gateway/protocol), [Khám phá](/vi/gateway/discovery), [Chế độ từ xa của macOS](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài đặt trên laptop thứ hai hay chỉ thêm một Node?">
    Nếu bạn chỉ cần **công cụ cục bộ** (màn hình/camera/exec) trên laptop thứ hai, hãy thêm nó làm
    **Node**. Cách này giữ một Gateway duy nhất và tránh cấu hình bị trùng lặp. Các công cụ Node cục bộ
    hiện chỉ hỗ trợ macOS, nhưng chúng tôi dự định mở rộng sang các hệ điều hành khác.

    Chỉ cài Gateway thứ hai khi bạn cần **cách ly cứng** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Nhiều Gateway](/vi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Biến môi trường và tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải biến môi trường như thế nào?">
    OpenClaw đọc biến môi trường từ tiến trình cha (shell, launchd/systemd, CI, v.v.) và còn tải thêm:

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

  <Accordion title="Tôi khởi động Gateway qua dịch vụ và các biến môi trường của tôi biến mất. Giờ làm gì?">
    Hai cách khắc phục phổ biến:

    1. Đặt các khóa bị thiếu vào `~/.openclaw/.env` để chúng vẫn được lấy ngay cả khi dịch vụ không kế thừa env của shell.
    2. Bật nhập từ shell (tiện ích tùy chọn):

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

    Cách này chạy shell đăng nhập của bạn và chỉ nhập các khóa dự kiến còn thiếu (không bao giờ ghi đè). Các biến môi trường tương đương:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái model hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` báo cáo liệu **nhập env từ shell** có được bật hay không. "Shell env: off"
    **không** có nghĩa là các biến môi trường của bạn bị thiếu - nó chỉ có nghĩa là OpenClaw sẽ không tự động tải
    shell đăng nhập của bạn.

    Nếu Gateway chạy dưới dạng dịch vụ (launchd/systemd), nó sẽ không kế thừa môi trường
    shell của bạn. Khắc phục bằng một trong các cách sau:

    1. Đặt token vào `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Hoặc bật nhập từ shell (`env.shellEnv.enabled: true`).
    3. Hoặc thêm nó vào khối cấu hình `env` của bạn (chỉ áp dụng nếu thiếu).

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
  <Accordion title="Làm thế nào để bắt đầu một cuộc trò chuyện mới?">
    Gửi `/new` hoặc `/reset` như một tin nhắn độc lập. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>

  <Accordion title="Phiên có tự động đặt lại nếu tôi không bao giờ gửi /new không?">
    Phiên có thể hết hạn sau `session.idleMinutes`, nhưng tính năng này **bị tắt theo mặc định** (mặc định **0**).
    Đặt giá trị dương để bật hết hạn khi không hoạt động. Khi được bật, tin nhắn **tiếp theo**
    sau khoảng thời gian không hoạt động sẽ bắt đầu một id phiên mới cho khóa trò chuyện đó.
    Việc này không xóa transcript - nó chỉ bắt đầu một phiên mới.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Có cách nào tạo một đội các phiên bản OpenClaw (một CEO và nhiều agent) không?">
    Có, thông qua **định tuyến đa agent** và **sub-agent**. Bạn có thể tạo một agent điều phối
    và nhiều agent xử lý với workspace và model riêng.

    Dù vậy, cách này nên được xem như một **thử nghiệm thú vị**. Nó tốn nhiều token và thường
    kém hiệu quả hơn việc dùng một bot với các phiên riêng biệt. Mô hình điển hình mà chúng tôi
    hình dung là một bot để bạn trò chuyện, với các phiên khác nhau cho công việc song song. Bot đó
    cũng có thể tạo sub-agent khi cần.

    Tài liệu: [Định tuyến đa agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [CLI agent](/vi/cli/agents).

  </Accordion>

  <Accordion title="Tại sao context bị cắt ngắn giữa tác vụ? Làm thế nào để ngăn điều đó?">
    Context của phiên bị giới hạn bởi cửa sổ của model. Cuộc trò chuyện dài, output công cụ lớn, hoặc nhiều
    tệp có thể kích hoạt Compaction hoặc cắt ngắn.

    Những cách hữu ích:

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một tệp.
    - Dùng `/compact` trước các tác vụ dài, và `/new` khi chuyển chủ đề.
    - Giữ context quan trọng trong workspace và yêu cầu bot đọc lại.
    - Dùng sub-agent cho công việc dài hoặc song song để cuộc trò chuyện chính nhỏ hơn.
    - Chọn model có cửa sổ context lớn hơn nếu việc này xảy ra thường xuyên.

  </Accordion>

  <Accordion title="Làm thế nào để đặt lại hoàn toàn OpenClaw nhưng vẫn giữ cài đặt?">
    Dùng lệnh reset:

    ```bash
    openclaw reset
    ```

    Đặt lại toàn bộ không tương tác:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sau đó chạy lại thiết lập:

    ```bash
    openclaw onboard --install-daemon
    ```

    Ghi chú:

    - Onboarding cũng cung cấp **Reset** nếu phát hiện cấu hình hiện có. Xem [Onboarding (CLI)](/vi/start/wizard).
    - Nếu bạn dùng profile (`--profile` / `OPENCLAW_PROFILE`), hãy đặt lại từng thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
    - Đặt lại cho dev: `openclaw gateway --dev --reset` (chỉ dành cho dev; xóa cấu hình dev + thông tin xác thực + phiên + workspace).

  </Accordion>

  <Accordion title='Tôi gặp lỗi "context too large" - làm thế nào để reset hoặc compact?'>
    Dùng một trong các cách sau:

    - **Compact** (giữ cuộc trò chuyện nhưng tóm tắt các lượt cũ hơn):

      ```
      /compact
      ```

      hoặc `/compact <instructions>` để hướng dẫn phần tóm tắt.

    - **Reset** (id phiên mới cho cùng khóa trò chuyện):

      ```
      /new
      /reset
      ```

    Nếu việc này tiếp tục xảy ra:

    - Bật hoặc tinh chỉnh **cắt tỉa phiên** (`agents.defaults.contextPruning`) để cắt bớt output công cụ cũ.
    - Dùng model có cửa sổ context lớn hơn.

    Tài liệu: [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning), [Quản lý phiên](/vi/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy lỗi "LLM request rejected: messages.content.tool_use.input field required"?'>
    Đây là lỗi xác thực của provider: model đã phát ra một khối `tool_use` nhưng thiếu
    `input` bắt buộc. Điều này thường có nghĩa là lịch sử phiên đã cũ hoặc bị hỏng (thường sau các luồng dài
    hoặc thay đổi công cụ/schema).

    Cách khắc phục: bắt đầu phiên mới bằng `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được tin nhắn heartbeat mỗi 30 phút?">
    Heartbeat chạy mỗi **30m** theo mặc định (**1h** khi dùng xác thực OAuth). Tinh chỉnh hoặc tắt chúng:

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

    Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và header markdown
    như `# Heading`), OpenClaw bỏ qua lượt chạy heartbeat để tiết kiệm API call.
    Nếu tệp bị thiếu, heartbeat vẫn chạy và model quyết định phải làm gì.

    Ghi đè theo từng agent dùng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **tài khoản của chính bạn**, nên nếu bạn ở trong nhóm, OpenClaw có thể thấy nhóm đó.
    Theo mặc định, trả lời trong nhóm bị chặn cho đến khi bạn cho phép người gửi (`groupPolicy: "allowlist"`).

    Nếu bạn muốn chỉ **bạn** có thể kích hoạt trả lời trong nhóm:

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

  <Accordion title="Làm thế nào để lấy JID của một nhóm WhatsApp?">
    Tùy chọn 1 (nhanh nhất): tail log và gửi một tin nhắn thử trong nhóm:

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, ví dụ:
    `1234567890-1234567890@g.us`.

    Tùy chọn 2 (nếu đã cấu hình/allowlist): liệt kê nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Directory](/vi/cli/directory), [Log](/vi/cli/logs).

  </Accordion>

  <Accordion title="Tại sao OpenClaw không trả lời trong nhóm?">
    Hai nguyên nhân phổ biến:

    - Cơ chế yêu cầu nhắc tên đang bật (mặc định). Bạn phải @mention bot (hoặc khớp `mentionPatterns`).
    - Bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm không nằm trong allowlist.

    Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).

  </Accordion>

  <Accordion title="Nhóm/luồng có dùng chung context với DM không?">
    Trò chuyện trực tiếp được gộp vào phiên chính theo mặc định. Nhóm/kênh có khóa phiên riêng, và topic Telegram / thread Discord là các phiên riêng biệt. Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu workspace và agent?">
    Không có giới hạn cứng. Hàng chục (thậm chí hàng trăm) đều ổn, nhưng hãy chú ý:

    - **Dung lượng đĩa tăng:** phiên + transcript nằm dưới `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token:** nhiều agent hơn nghĩa là dùng model đồng thời nhiều hơn.
    - **Chi phí vận hành:** profile xác thực, workspace và định tuyến kênh theo từng agent.

    Mẹo:

    - Giữ một workspace **đang hoạt động** cho mỗi agent (`agents.defaults.workspace`).
    - Cắt tỉa các phiên cũ (xóa JSONL hoặc mục lưu trữ) nếu dung lượng đĩa tăng.
    - Dùng `openclaw doctor` để phát hiện workspace rời rạc và profile không khớp.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều bot hoặc cuộc trò chuyện cùng lúc (Slack) không, và nên thiết lập như thế nào?">
    Có. Sử dụng **Định tuyến đa tác nhân** để chạy nhiều tác nhân tách biệt và định tuyến tin nhắn đến theo
    kênh/tài khoản/đối tượng ngang hàng. Slack được hỗ trợ như một kênh và có thể được liên kết với các tác nhân cụ thể.

    Truy cập trình duyệt rất mạnh nhưng không phải là "làm được mọi thứ con người có thể làm" - chống bot, CAPTCHA và MFA vẫn có thể
    chặn tự động hóa. Để điều khiển trình duyệt đáng tin cậy nhất, hãy dùng Chrome MCP cục bộ trên máy chủ,
    hoặc dùng CDP trên máy thực sự chạy trình duyệt.

    Thiết lập khuyến nghị:

    - Máy chủ Gateway luôn bật (VPS/Mac mini).
    - Mỗi vai trò một tác nhân (liên kết).
    - Kênh Slack được liên kết với các tác nhân đó.
    - Trình duyệt cục bộ qua Chrome MCP hoặc một node khi cần.

    Tài liệu: [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [Slack](/vi/channels/slack),
    [Trình duyệt](/vi/tools/browser), [Nodes](/vi/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình, chuyển đổi dự phòng và hồ sơ xác thực

Hỏi đáp về mô hình — mặc định, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng, hồ sơ xác thực —
nằm trong [Câu hỏi thường gặp về mô hình](/vi/help/faq-models).

## Gateway: cổng, "đã chạy" và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway sử dụng cổng nào?">
    `gateway.port` kiểm soát cổng ghép kênh duy nhất cho WebSocket + HTTP (Control UI, hook, v.v.).

    Thứ tự ưu tiên:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status báo "Runtime: running" nhưng "Connectivity probe: failed"?'>
    Vì "running" là góc nhìn của **supervisor** (launchd/systemd/schtasks). Probe kết nối là CLI thực sự kết nối tới WebSocket của Gateway.

    Dùng `openclaw gateway status` và tin vào các dòng này:

    - `Probe target:` (URL mà probe thực sự dùng)
    - `Listening:` (thứ thực sự đang được bind trên cổng)
    - `Last gateway error:` (nguyên nhân gốc thường gặp khi tiến trình còn sống nhưng cổng không lắng nghe)

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
    OpenClaw thực thi khóa runtime bằng cách bind trình lắng nghe WebSocket ngay khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu bind thất bại với `EADDRINUSE`, nó ném `GatewayLockError` cho biết một instance khác đã đang lắng nghe.

    Cách sửa: dừng instance kia, giải phóng cổng, hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm cách nào chạy OpenClaw ở chế độ từ xa (client kết nối tới Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và trỏ tới URL WebSocket từ xa, tùy chọn kèm thông tin xác thực từ xa bằng shared-secret:

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
    - `gateway.remote.token` / `.password` chỉ là thông tin xác thực từ xa phía client; tự chúng không bật xác thực gateway cục bộ.

  </Accordion>

  <Accordion title='Control UI báo "unauthorized" (hoặc liên tục kết nối lại). Giờ làm gì?'>
    Đường dẫn xác thực gateway của bạn và phương thức xác thực của UI không khớp.

    Sự thật (từ mã):

    - Control UI giữ token trong `sessionStorage` cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, nên làm mới cùng tab vẫn hoạt động mà không khôi phục cơ chế lưu token lâu dài trong localStorage.
    - Khi có `AUTH_TOKEN_MISMATCH`, client tin cậy có thể thử lại một lần có giới hạn bằng token thiết bị đã lưu cache khi gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Lần thử lại bằng token đã lưu cache đó hiện tái sử dụng các phạm vi đã được phê duyệt đang lưu cùng token thiết bị. Caller dùng `deviceToken` tường minh / `scopes` tường minh vẫn giữ tập phạm vi đã yêu cầu thay vì kế thừa phạm vi đã lưu cache.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là shared token/password tường minh trước, rồi `deviceToken` tường minh, rồi token thiết bị đã lưu, rồi bootstrap token.
    - Kiểm tra phạm vi bootstrap token có tiền tố vai trò. Danh sách cho phép toán tử bootstrap tích hợp chỉ đáp ứng yêu cầu operator; node hoặc các vai trò không phải operator khác vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

    Cách sửa:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL dashboard, cố mở; hiển thị gợi ý SSH nếu không có giao diện).
    - Nếu bạn chưa có token: `openclaw doctor --generate-gateway-token`.
    - Nếu từ xa, tạo tunnel trước: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`.
    - Chế độ shared-secret: đặt `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, rồi dán secret khớp vào phần cài đặt Control UI.
    - Chế độ Tailscale Serve: bảo đảm `gateway.auth.allowTailscale` được bật và bạn đang mở URL Serve, không phải URL loopback/tailnet thô bỏ qua header định danh Tailscale.
    - Chế độ trusted-proxy: bảo đảm bạn đi qua proxy nhận biết định danh đã cấu hình, không phải URL gateway thô. Proxy loopback cùng máy chủ cũng cần `gateway.auth.trustedProxy.allowLoopback = true`.
    - Nếu không khớp vẫn còn sau một lần thử lại, hãy xoay/phê duyệt lại token thiết bị đã ghép đôi:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Nếu lệnh xoay đó báo bị từ chối, hãy kiểm tra hai điều:
      - phiên thiết bị đã ghép đôi chỉ có thể xoay thiết bị **của chính nó** trừ khi chúng cũng có `operator.admin`
      - giá trị `--scope` tường minh không thể vượt quá phạm vi operator hiện tại của caller
    - Vẫn bị kẹt? Chạy `openclaw status --all` và làm theo [Khắc phục sự cố](/vi/gateway/troubleshooting). Xem [Dashboard](/vi/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đặt gateway.bind là tailnet nhưng không thể bind và không có gì lắng nghe">
    Bind `tailnet` chọn một IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không ở trên Tailscale (hoặc giao diện bị tắt), không có gì để bind.

    Cách sửa:

    - Khởi động Tailscale trên máy chủ đó (để nó có địa chỉ 100.x), hoặc
    - Chuyển sang `gateway.bind: "loopback"` / `"lan"`.

    Ghi chú: `tailnet` là tường minh. `auto` ưu tiên loopback; dùng `gateway.bind: "tailnet"` khi bạn muốn bind chỉ dành cho tailnet.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng một máy chủ không?">
    Thường là không - một Gateway có thể chạy nhiều kênh nhắn tin và tác nhân. Chỉ dùng nhiều Gateway khi bạn cần dự phòng (ví dụ: bot cứu hộ) hoặc cô lập cứng.

    Có, nhưng bạn phải cô lập:

    - `OPENCLAW_CONFIG_PATH` (cấu hình theo từng instance)
    - `OPENCLAW_STATE_DIR` (trạng thái theo từng instance)
    - `agents.defaults.workspace` (cô lập workspace)
    - `gateway.port` (cổng duy nhất)

    Thiết lập nhanh (khuyến nghị):

    - Dùng `openclaw --profile <name> ...` cho từng instance (tự tạo `~/.openclaw-<name>`).
    - Đặt `gateway.port` duy nhất trong cấu hình của từng profile (hoặc truyền `--port` khi chạy thủ công).
    - Cài service theo từng profile: `openclaw --profile <name> gateway install`.

    Profile cũng thêm hậu tố cho tên service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Hướng dẫn đầy đủ: [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / mã 1008 nghĩa là gì?'>
    Gateway là **máy chủ WebSocket**, và nó kỳ vọng tin nhắn đầu tiên
    là một frame `connect`. Nếu nhận bất kỳ thứ gì khác, nó sẽ đóng kết nối
    với **mã 1008** (vi phạm chính sách).

    Nguyên nhân thường gặp:

    - Bạn đã mở URL **HTTP** trong trình duyệt (`http://...`) thay vì client WS.
    - Bạn dùng sai cổng hoặc đường dẫn.
    - Proxy hoặc tunnel đã loại bỏ header xác thực hoặc gửi một yêu cầu không phải Gateway.

    Cách sửa nhanh:

    1. Dùng URL WS: `ws://<host>:18789` (hoặc `wss://...` nếu HTTPS).
    2. Đừng mở cổng WS trong tab trình duyệt thông thường.
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

    Bạn có thể đặt đường dẫn ổn định qua `logging.file`. Mức log tệp được kiểm soát bởi `logging.level`. Độ chi tiết console được kiểm soát bởi `--verbose` và `logging.consoleLevel`.

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

  <Accordion title="Làm cách nào khởi động/dừng/khởi động lại service Gateway?">
    Dùng các helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy gateway thủ công, `openclaw gateway --force` có thể giành lại cổng. Xem [Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng terminal trên Windows - làm cách nào khởi động lại OpenClaw?">
    Có **hai chế độ cài đặt Windows**:

    **1) WSL2 (khuyến nghị):** Gateway chạy bên trong Linux.

    Mở PowerShell, vào WSL, rồi khởi động lại:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chưa từng cài service, hãy khởi động ở foreground:

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

  <Accordion title="Gateway đã chạy nhưng phản hồi không bao giờ đến. Tôi nên kiểm tra gì?">
    Bắt đầu bằng lượt quét sức khỏe nhanh:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân thường gặp:

    - Xác thực mô hình chưa được nạp trên **máy chủ gateway** (kiểm tra `models status`).
    - Ghép đôi kênh/danh sách cho phép chặn phản hồi (kiểm tra cấu hình kênh + log).
    - WebChat/Dashboard đang mở mà không có token đúng.

    Nếu bạn ở từ xa, hãy xác nhận tunnel/kết nối Tailscale đang hoạt động và
    WebSocket Gateway có thể truy cập được.

    Tài liệu: [Kênh](/vi/channels), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - giờ làm gì?'>
    Điều này thường nghĩa là UI đã mất kết nối WebSocket. Kiểm tra:

    1. Gateway có đang chạy không? `openclaw gateway status`
    2. Gateway có khỏe mạnh không? `openclaw status`
    3. UI có đúng token không? `openclaw dashboard`
    4. Nếu chạy từ xa, liên kết tunnel/Tailscale có hoạt động không?

    Sau đó theo dõi log:

    ```bash
    openclaw logs --follow
    ```

    Tài liệu: [Dashboard](/vi/web/dashboard), [Truy cập từ xa](/vi/gateway/remote), [Khắc phục sự cố](/vi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands thất bại. Tôi nên kiểm tra gì?">
    Bắt đầu với log và trạng thái kênh:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sau đó đối chiếu lỗi:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram có quá nhiều mục. OpenClaw đã cắt giảm tới giới hạn của Telegram và thử lại với ít lệnh hơn, nhưng vẫn cần bỏ bớt một số mục menu. Giảm lệnh Plugin/kỹ năng/tùy chỉnh, hoặc tắt `channels.telegram.commands.native` nếu bạn không cần menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, hoặc các lỗi mạng tương tự: nếu bạn đang dùng VPS hoặc ở sau proxy, hãy xác nhận HTTPS đi ra được cho phép và DNS hoạt động với `api.telegram.org`.

    Nếu Gateway chạy từ xa, hãy chắc chắn bạn đang xem log trên máy chủ Gateway.

    Tài liệu: [Telegram](/vi/channels/telegram), [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Tôi nên kiểm tra gì?">
    Trước tiên xác nhận Gateway có thể truy cập được và agent có thể chạy:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, dùng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh chat
    hãy chắc chắn đã bật gửi đi (`/deliver on`).

    Tài liệu: [TUI](/vi/web/tui), [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để dừng hoàn toàn rồi khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Việc này dừng/khởi động **dịch vụ được giám sát** (launchd trên macOS, systemd trên Linux).
    Dùng cách này khi Gateway chạy nền như một daemon.

    Nếu bạn đang chạy ở foreground, dừng bằng Ctrl-C, rồi:

    ```bash
    openclaw gateway run
    ```

    Tài liệu: [Runbook dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Giải thích đơn giản: openclaw gateway restart so với openclaw gateway">
    - `openclaw gateway restart`: khởi động lại **dịch vụ nền** (launchd/systemd).
    - `openclaw gateway`: chạy gateway **ở foreground** cho phiên terminal này.

    Nếu bạn đã cài đặt dịch vụ, hãy dùng các lệnh gateway. Dùng `openclaw gateway` khi
    bạn muốn chạy foreground một lần.

  </Accordion>

  <Accordion title="Cách nhanh nhất để có thêm chi tiết khi có lỗi">
    Khởi động Gateway với `--verbose` để có thêm chi tiết trên console. Sau đó kiểm tra tệp log để xem lỗi xác thực kênh, định tuyến mô hình và RPC.
  </Accordion>
</AccordionGroup>

## Phương tiện và tệp đính kèm

<AccordionGroup>
  <Accordion title="Kỹ năng của tôi đã tạo ảnh/PDF, nhưng không có gì được gửi">
    Tệp đính kèm gửi ra từ agent phải bao gồm một dòng `MEDIA:<path-or-url>` (trên dòng riêng). Xem [Thiết lập trợ lý OpenClaw](/vi/start/openclaw) và [Agent gửi](/vi/tools/agent-send).

    Gửi bằng CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Cũng hãy kiểm tra:

    - Kênh đích hỗ trợ phương tiện gửi ra và không bị chặn bởi allowlist.
    - Tệp nằm trong giới hạn kích thước của provider (ảnh được đổi kích thước tối đa 2048px).
    - `tools.fs.workspaceOnly=true` giới hạn việc gửi bằng đường dẫn cục bộ trong workspace, temp/media-store và các tệp đã được sandbox xác thực.
    - `tools.fs.workspaceOnly=false` cho phép `MEDIA:` gửi các tệp cục bộ trên máy chủ mà agent đã có thể đọc, nhưng chỉ với phương tiện và các loại tài liệu an toàn (ảnh, âm thanh, video, PDF và tài liệu Office). Tệp văn bản thuần và tệp giống bí mật vẫn bị chặn.

    Xem [Ảnh](/vi/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn không khi cho phép OpenClaw nhận DM đến?">
    Xem DM đến là đầu vào không đáng tin cậy. Mặc định được thiết kế để giảm rủi ro:

    - Hành vi mặc định trên các kênh hỗ trợ DM là **ghép đôi**:
      - Người gửi không xác định nhận mã ghép đôi; bot không xử lý tin nhắn của họ.
      - Phê duyệt bằng: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Yêu cầu đang chờ được giới hạn ở **3 mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu không nhận được mã.
    - Mở DM công khai yêu cầu chọn tham gia rõ ràng (`dmPolicy: "open"` và allowlist `"*"`).

    Chạy `openclaw doctor` để hiển thị các chính sách DM rủi ro.

  </Accordion>

  <Accordion title="Prompt injection có chỉ là vấn đề với bot công khai không?">
    Không. Prompt injection liên quan đến **nội dung không đáng tin cậy**, không chỉ là ai có thể DM bot.
    Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/tải web, trang trình duyệt, email,
    tài liệu, tệp đính kèm, log được dán), nội dung đó có thể bao gồm chỉ dẫn cố
    chiếm quyền điều khiển mô hình. Điều này có thể xảy ra ngay cả khi **bạn là người gửi duy nhất**.

    Rủi ro lớn nhất là khi công cụ được bật: mô hình có thể bị lừa để
    trích xuất ngữ cảnh ra ngoài hoặc gọi công cụ thay bạn. Giảm phạm vi ảnh hưởng bằng cách:

    - dùng một agent "đọc" chỉ đọc hoặc tắt công cụ để tóm tắt nội dung không đáng tin cậy
    - tắt `web_search` / `web_fetch` / `browser` cho agent có bật công cụ
    - cũng xem văn bản tệp/tài liệu đã giải mã là không đáng tin cậy: OpenResponses
      `input_file` và việc trích xuất tệp đính kèm phương tiện đều bọc văn bản được trích xuất trong
      các marker ranh giới nội dung bên ngoài rõ ràng thay vì truyền văn bản tệp thô
    - dùng sandbox và allowlist công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub hoặc số điện thoại riêng không?">
    Có, với hầu hết thiết lập. Cô lập bot bằng tài khoản và số điện thoại riêng
    giúp giảm phạm vi ảnh hưởng nếu có sự cố. Điều này cũng giúp dễ xoay vòng
    thông tin xác thực hoặc thu hồi quyền truy cập mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Bắt đầu nhỏ. Chỉ cấp quyền truy cập vào những công cụ và tài khoản bạn thực sự cần, rồi mở rộng
    sau nếu cần.

    Tài liệu: [Bảo mật](/vi/gateway/security), [Ghép đôi](/vi/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể cho nó quyền tự chủ với tin nhắn văn bản của mình không và điều đó có an toàn không?">
    Chúng tôi **không** khuyến nghị quyền tự chủ hoàn toàn với tin nhắn cá nhân của bạn. Mẫu an toàn nhất là:

    - Giữ DM ở **chế độ ghép đôi** hoặc allowlist chặt chẽ.
    - Dùng **số hoặc tài khoản riêng** nếu bạn muốn nó nhắn tin thay bạn.
    - Để nó soạn nháp, rồi **phê duyệt trước khi gửi**.

    Nếu bạn muốn thử nghiệm, hãy làm trên một tài khoản chuyên dụng và giữ tài khoản đó cô lập. Xem
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình rẻ hơn cho các tác vụ trợ lý cá nhân không?">
    Có, **nếu** agent chỉ chat và đầu vào đáng tin cậy. Các tầng nhỏ hơn
    dễ bị chiếm quyền chỉ dẫn hơn, vì vậy hãy tránh dùng chúng cho agent có bật công cụ
    hoặc khi đọc nội dung không đáng tin cậy. Nếu buộc phải dùng mô hình nhỏ hơn, hãy khóa chặt
    công cụ và chạy trong sandbox. Xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã ghép đôi">
    Mã ghép đôi được gửi **chỉ** khi người gửi không xác định nhắn tin cho bot và
    `dmPolicy: "pairing"` được bật. Bản thân `/start` không tạo mã.

    Kiểm tra các yêu cầu đang chờ:

    ```bash
    openclaw pairing list telegram
    ```

    Nếu bạn muốn truy cập ngay, hãy thêm sender id của bạn vào allowlist hoặc đặt `dmPolicy: "open"`
    cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: nó có nhắn tin cho danh bạ của tôi không? Ghép đôi hoạt động thế nào?">
    Không. Chính sách DM mặc định của WhatsApp là **ghép đôi**. Người gửi không xác định chỉ nhận mã ghép đôi và tin nhắn của họ **không được xử lý**. OpenClaw chỉ trả lời các cuộc chat mà nó nhận được hoặc các lệnh gửi rõ ràng do bạn kích hoạt.

    Phê duyệt ghép đôi bằng:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liệt kê yêu cầu đang chờ:

    ```bash
    openclaw pairing list whatsapp
    ```

    Lời nhắc số điện thoại trong wizard: nó được dùng để đặt **allowlist/chủ sở hữu** của bạn để DM của chính bạn được cho phép. Nó không được dùng để tự động gửi. Nếu bạn chạy trên số WhatsApp cá nhân, hãy dùng số đó và bật `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh chat, hủy tác vụ và "nó không dừng lại"

<AccordionGroup>
  <Accordion title="Làm thế nào để ngăn thông báo hệ thống nội bộ hiển thị trong chat?">
    Hầu hết thông báo nội bộ hoặc thông báo công cụ chỉ xuất hiện khi **verbose**, **trace** hoặc **reasoning** được bật
    cho phiên đó.

    Khắc phục trong cuộc chat nơi bạn thấy nó:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Nếu vẫn còn ồn, hãy kiểm tra cài đặt phiên trong Control UI và đặt verbose
    thành **inherit**. Cũng xác nhận bạn không dùng hồ sơ bot có `verboseDefault` được đặt
    thành `on` trong cấu hình.

    Tài liệu: [Suy nghĩ và verbose](/vi/tools/thinking), [Bảo mật](/vi/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm thế nào để dừng/hủy một tác vụ đang chạy?">
    Gửi bất kỳ nội dung nào sau đây **dưới dạng một tin nhắn độc lập** (không có slash):

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

    Đây là các trigger hủy (không phải lệnh slash).

    Với tiến trình nền (từ công cụ exec), bạn có thể yêu cầu agent chạy:

    ```
    process action:kill sessionId:XXX
    ```

    Tổng quan lệnh slash: xem [Lệnh slash](/vi/tools/slash-commands).

    Hầu hết lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`, nhưng một vài lối tắt (như `/status`) cũng hoạt động nội tuyến với người gửi trong allowlist.

  </Accordion>

  <Accordion title='Làm thế nào để gửi tin nhắn Discord từ Telegram? ("Cross-context messaging denied")'>
    OpenClaw chặn nhắn tin **chéo provider** theo mặc định. Nếu một lệnh gọi công cụ được gắn
    với Telegram, nó sẽ không gửi tới Discord trừ khi bạn cho phép rõ ràng.

    Bật nhắn tin chéo provider cho agent:

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

    - `steer` - xếp hàng tất cả steering đang chờ cho ranh giới mô hình tiếp theo trong lượt chạy hiện tại
    - `queue` - steering từng cái một kiểu cũ
    - `followup` - chạy từng tin nhắn một
    - `collect` - gom nhóm tin nhắn và trả lời một lần
    - `steer-backlog` - steer ngay, rồi xử lý backlog
    - `interrupt` - hủy lượt chạy hiện tại và bắt đầu mới

    Chế độ mặc định là `steer`. Bạn có thể thêm tùy chọn như `debounce:0.5s cap:25 drop:summarize` cho các chế độ followup. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi steering](/vi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Khác

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic khi dùng khóa API là gì?'>
    Trong OpenClaw, thông tin xác thực và lựa chọn mô hình là hai phần riêng biệt. Việc đặt `ANTHROPIC_API_KEY` (hoặc lưu khóa API Anthropic trong hồ sơ xác thực) bật tính năng xác thực, nhưng mô hình mặc định thực tế là bất kỳ mô hình nào bạn cấu hình trong `agents.defaults.model.primary` (ví dụ: `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). Nếu bạn thấy `No credentials found for profile "anthropic:default"`, điều đó nghĩa là Gateway không tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` dự kiến cho tác nhân đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn chưa xử lý được? Hãy hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [thảo luận trên GitHub](https://github.com/openclaw/openclaw/discussions).

## Liên quan

- [Câu hỏi thường gặp về lần chạy đầu tiên](/vi/help/faq-first-run) — cài đặt, hướng dẫn ban đầu, xác thực, gói đăng ký, lỗi ban đầu
- [Câu hỏi thường gặp về mô hình](/vi/help/faq-models) — lựa chọn mô hình, chuyển đổi dự phòng, hồ sơ xác thực
- [Khắc phục sự cố](/vi/help/troubleshooting) — phân loại theo triệu chứng trước
