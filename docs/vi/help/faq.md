---
read_when:
    - Trả lời các câu hỏi hỗ trợ thường gặp về thiết lập, cài đặt, hướng dẫn bắt đầu sử dụng hoặc thời gian chạy
    - Phân loại các sự cố do người dùng báo cáo trước khi gỡ lỗi sâu hơn
summary: Câu hỏi thường gặp về thiết lập, cấu hình và sử dụng OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-06-27T17:34:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Câu trả lời nhanh cùng hướng dẫn khắc phục sự cố chuyên sâu hơn cho các thiết lập thực tế (phát triển cục bộ, VPS, đa tác tử, khóa OAuth/API, chuyển đổi dự phòng mô hình). Với chẩn đoán runtime, xem [Khắc phục sự cố](/vi/gateway/troubleshooting). Với tài liệu tham chiếu cấu hình đầy đủ, xem [Cấu hình](/vi/gateway/configuration).

## 60 giây đầu tiên nếu có gì đó bị lỗi

1. **Trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt cục bộ nhanh: HĐH + cập nhật, khả năng truy cập gateway/dịch vụ, tác tử/phiên, cấu hình nhà cung cấp + vấn đề runtime (khi gateway truy cập được).

2. **Báo cáo có thể dán (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc kèm phần đuôi log (token đã được che).

3. **Trạng thái daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime của supervisor so với khả năng truy cập RPC, URL mục tiêu của probe, và cấu hình mà dịch vụ có khả năng đã dùng.

4. **Probe chuyên sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy probe sức khỏe gateway trực tiếp, bao gồm probe kênh khi được hỗ trợ
   (yêu cầu gateway truy cập được). Xem [Sức khỏe](/vi/gateway/health).

5. **Theo dõi log mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC không hoạt động, dùng phương án dự phòng:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log tệp tách biệt với log dịch vụ; xem [Ghi log](/vi/logging) và [Khắc phục sự cố](/vi/gateway/troubleshooting).

6. **Chạy doctor (sửa chữa)**

   ```bash
   openclaw doctor
   ```

   Sửa chữa/di trú cấu hình/trạng thái + chạy kiểm tra sức khỏe. Xem [Doctor](/vi/gateway/doctor).

7. **Ảnh chụp nhanh Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Yêu cầu gateway đang chạy cung cấp ảnh chụp nhanh đầy đủ (chỉ WS). Xem [Sức khỏe](/vi/gateway/health).

## Bắt đầu nhanh và thiết lập lần chạy đầu

Hỏi đáp lần chạy đầu — cài đặt, onboard, tuyến xác thực, gói đăng ký, lỗi ban đầu —
nằm trong [FAQ lần chạy đầu](/vi/help/faq-first-run).

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là trợ lý AI cá nhân bạn chạy trên thiết bị của chính mình. Nó trả lời trên các bề mặt nhắn tin bạn đã dùng (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, và các Plugin kênh đi kèm như QQ Bot) và cũng có thể hỗ trợ giọng nói + Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Giá trị cốt lõi">
    OpenClaw không phải là "chỉ một lớp bọc Claude." Đây là một **mặt phẳng điều khiển ưu tiên cục bộ** cho phép bạn chạy một
    trợ lý có năng lực trên **phần cứng của chính bạn**, truy cập được từ các ứng dụng chat bạn đã dùng, với
    phiên có trạng thái, bộ nhớ và công cụ - mà không giao quyền kiểm soát quy trình làm việc của bạn cho một
    SaaS được lưu trữ.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất cứ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử phiên ở cục bộ.
    - **Kênh thật, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/v.v.,
      cộng với giọng nói di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc mô hình:** dùng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với định tuyến
      theo từng tác tử và chuyển đổi dự phòng.
    - **Tùy chọn chỉ cục bộ:** chạy mô hình cục bộ để **toàn bộ dữ liệu có thể ở lại trên thiết bị của bạn** nếu bạn muốn.
    - **Định tuyến đa tác tử:** tách tác tử theo kênh, tài khoản hoặc tác vụ, mỗi tác tử có
      workspace và mặc định riêng.
    - **Mã nguồn mở và dễ tùy biến:** kiểm tra, mở rộng và tự lưu trữ mà không bị khóa vào nhà cung cấp.

    Tài liệu: [Gateway](/vi/gateway), [Kênh](/vi/channels), [Đa tác tử](/vi/concepts/multi-agent),
    [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập xong - nên làm gì trước?">
    Các dự án đầu tiên phù hợp:

    - Xây dựng một website (WordPress, Shopify hoặc một site tĩnh đơn giản).
    - Tạo nguyên mẫu ứng dụng di động (dàn ý, màn hình, kế hoạch API).
    - Sắp xếp tệp và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa tóm tắt hoặc theo dõi tiếp.

    Nó có thể xử lý các tác vụ lớn, nhưng hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    dùng tác tử phụ cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hằng ngày hàng đầu của OpenClaw là gì?">
    Lợi ích hằng ngày thường trông như sau:

    - **Bản tin cá nhân:** tóm tắt hộp thư đến, lịch và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt và bản nháp đầu tiên cho email hoặc tài liệu.
    - **Nhắc việc và theo dõi tiếp:** lời nhắc và danh sách kiểm tra dựa trên Cron hoặc Heartbeat.
    - **Tự động hóa trình duyệt:** điền biểu mẫu, thu thập dữ liệu và lặp lại tác vụ web.
    - **Điều phối đa thiết bị:** gửi tác vụ từ điện thoại, để Gateway chạy trên máy chủ, rồi nhận kết quả lại trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể giúp tạo lead, outreach, quảng cáo và blog cho SaaS không?">
    Có, với **nghiên cứu, đánh giá đủ điều kiện và soạn thảo**. Nó có thể quét site, tạo danh sách rút gọn,
    tóm tắt khách hàng tiềm năng, và viết bản nháp outreach hoặc nội dung quảng cáo.

    Với **outreach hoặc chạy quảng cáo**, hãy giữ con người trong vòng kiểm soát. Tránh spam, tuân thủ luật địa phương và
    chính sách nền tảng, và rà soát mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn nháp và bạn phê duyệt.

    Tài liệu: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Lợi thế so với Claude Code cho phát triển web là gì?">
    OpenClaw là một **trợ lý cá nhân** và lớp điều phối, không phải công cụ thay thế IDE. Dùng
    Claude Code hoặc Codex để có vòng lặp lập trình trực tiếp nhanh nhất trong repo. Dùng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị và điều phối công cụ.

    Lợi thế:

    - **Bộ nhớ + workspace bền vững** qua nhiều phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, tệp, lập lịch, hook)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ mọi nơi)
    - **Node** cho trình duyệt/màn hình/camera/exec cục bộ

    Trưng bày: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills và tự động hóa

<AccordionGroup>
  <Accordion title="Làm sao tùy chỉnh skills mà không làm repo bị bẩn?">
    Dùng ghi đè được quản lý thay vì chỉnh sửa bản sao trong repo. Đặt thay đổi của bạn vào `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, nên ghi đè được quản lý vẫn thắng bundled skills mà không chạm vào git. Nếu bạn cần cài skill toàn cục nhưng chỉ hiển thị với một số tác tử, giữ bản sao dùng chung trong `~/.openclaw/skills` và kiểm soát khả năng hiển thị bằng `agents.defaults.skills` và `agents.list[].skills`. Chỉ những chỉnh sửa đáng đưa upstream mới nên nằm trong repo và đi ra dưới dạng PR.
  </Accordion>

  <Accordion title="Tôi có thể tải skills từ một thư mục tùy chỉnh không?">
    Có. Thêm thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (ưu tiên thấp nhất). Thứ tự ưu tiên mặc định là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` mặc định cài vào `./skills`, OpenClaw coi đó là `<workspace>/skills` trong phiên tiếp theo. Nếu skill chỉ nên hiển thị với một số tác tử nhất định, kết hợp với `agents.defaults.skills` hoặc `agents.list[].skills`.
  </Accordion>

  <Accordion title="Làm sao dùng các mô hình hoặc thiết lập khác nhau cho các tác vụ khác nhau?">
    Hiện tại các mẫu được hỗ trợ là:

    - **Công việc Cron**: công việc tách biệt có thể đặt ghi đè `model` theo từng công việc.
    - **Tác tử**: định tuyến tác vụ tới các tác tử riêng với mô hình mặc định, mức suy nghĩ và tham số stream khác nhau.
    - **Chuyển đổi theo yêu cầu**: dùng `/model` để đổi mô hình của phiên hiện tại bất cứ lúc nào.

    Ví dụ, dùng cùng một mô hình với thiết lập theo từng tác tử khác nhau:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Đặt mặc định dùng chung theo từng mô hình trong `agents.defaults.models["provider/model"].params`, rồi đặt ghi đè riêng cho tác tử trong `agents.list[].params` dạng phẳng. Không định nghĩa các mục `agents.list[].models["provider/model"].params` lồng nhau riêng cho cùng một mô hình; `agents.list[].models` dành cho catalog mô hình theo tác tử và ghi đè runtime.

    Xem [Công việc Cron](/vi/automation/cron-jobs), [Định tuyến đa tác tử](/vi/concepts/multi-agent), [Cấu hình](/vi/gateway/config-agents), và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị đứng khi làm việc nặng. Làm sao offload việc đó?">
    Dùng **tác tử phụ** cho các tác vụ dài hoặc song song. Tác tử phụ chạy trong phiên riêng,
    trả về bản tóm tắt, và giữ chat chính của bạn phản hồi nhanh.

    Yêu cầu bot của bạn "spawn a sub-agent for this task" hoặc dùng `/subagents`.
    Dùng `/status` trong chat để xem Gateway đang làm gì ngay lúc này (và có đang bận không).

    Mẹo token: tác vụ dài và tác tử phụ đều tiêu thụ token. Nếu lo ngại chi phí, đặt
    mô hình rẻ hơn cho tác tử phụ qua `agents.defaults.subagents.model`.

    Tài liệu: [Tác tử phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Các phiên tác tử phụ gắn với luồng hoạt động thế nào trên Discord?">
    Dùng liên kết luồng. Bạn có thể liên kết một luồng Discord với một tác tử phụ hoặc mục tiêu phiên để các tin nhắn theo dõi tiếp trong luồng đó vẫn ở trên phiên đã liên kết.

    Luồng cơ bản:

    - Spawn bằng `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"` cho theo dõi tiếp bền vững).
    - Hoặc liên kết thủ công bằng `/focus <target>`.
    - Dùng `/agents` để kiểm tra trạng thái liên kết.
    - Dùng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát tự động bỏ focus.
    - Dùng `/unfocus` để tách luồng.

    Cấu hình bắt buộc:

    - Mặc định toàn cục: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Ghi đè Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động liên kết khi spawn: `channels.discord.threadBindings.spawnSessions` mặc định là `true`; đặt thành `false` để tắt spawn phiên gắn với luồng.

    Tài liệu: [Tác tử phụ](/vi/tools/subagents), [Discord](/vi/channels/discord), [Tham chiếu cấu hình](/vi/gateway/configuration-reference), [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Một tác tử phụ đã hoàn tất, nhưng cập nhật hoàn tất đi sai chỗ hoặc không bao giờ được đăng. Tôi nên kiểm tra gì?">
    Kiểm tra tuyến người yêu cầu đã được phân giải trước:

    - Phân phối tác tử phụ ở chế độ hoàn tất ưu tiên mọi tuyến luồng hoặc hội thoại đã liên kết khi có.
    - Nếu nguồn hoàn tất chỉ mang theo một kênh, OpenClaw dùng tuyến đã lưu của phiên người yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) làm dự phòng để phân phối trực tiếp vẫn có thể thành công.
    - Nếu không có tuyến đã liên kết lẫn tuyến đã lưu có thể dùng, phân phối trực tiếp có thể thất bại và kết quả chuyển sang phân phối phiên đã xếp hàng thay vì đăng ngay vào chat.
    - Mục tiêu không hợp lệ hoặc đã cũ vẫn có thể buộc dùng phương án dự phòng hàng đợi hoặc gây lỗi phân phối cuối cùng.
    - Nếu câu trả lời trợ lý hiển thị cuối cùng của tác tử con là token im lặng chính xác `NO_REPLY` / `no_reply`, hoặc chính xác `ANNOUNCE_SKIP`, OpenClaw cố ý chặn thông báo thay vì đăng tiến trình cũ trước đó.
    - Đầu ra tool/toolResult không được nâng lên thành văn bản kết quả của tác tử con; kết quả là câu trả lời trợ lý hiển thị mới nhất của tác tử con.

    Gỡ lỗi:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks), [Công cụ phiên](/vi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron hoặc lời nhắc không chạy. Tôi nên kiểm tra gì?">
    Cron chạy bên trong tiến trình Gateway. Nếu Gateway không chạy liên tục,
    các công việc đã lên lịch sẽ không chạy.

    Danh sách kiểm tra:

    - Xác nhận cron đã được bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` chưa được đặt.
    - Kiểm tra Gateway đang chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh thiết lập múi giờ cho công việc (`--tz` so với múi giờ của máy chủ).

    Gỡ lỗi:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Công việc Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation).

  </Accordion>

  <Accordion title="Cron đã chạy, nhưng không có gì được gửi tới kênh. Vì sao?">
    Trước tiên hãy kiểm tra chế độ gửi:

    - `--no-deliver` / `delivery.mode: "none"` nghĩa là không kỳ vọng gửi dự phòng từ runner.
    - Thiếu hoặc mục tiêu thông báo không hợp lệ (`channel` / `to`) nghĩa là runner đã bỏ qua việc gửi ra ngoài.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là runner đã cố gửi nhưng thông tin xác thực đã chặn việc đó.
    - Kết quả cô lập im lặng (chỉ `NO_REPLY` / `no_reply`) được xem là chủ ý không thể gửi, nên runner cũng chặn gửi dự phòng đã xếp hàng.

    Với các công việc cron cô lập, tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message`
    khi có tuyến trò chuyện. `--announce` chỉ kiểm soát đường dẫn dự phòng của runner
    cho văn bản cuối cùng mà tác nhân chưa tự gửi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Công việc Cron](/vi/automation/cron-jobs), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Vì sao một lần chạy cron cô lập lại đổi mô hình hoặc thử lại một lần?">
    Thường đó là đường dẫn đổi mô hình trực tiếp, không phải lên lịch trùng lặp.

    Cron cô lập có thể lưu một lần chuyển giao mô hình runtime và thử lại khi lần chạy
    đang hoạt động ném `LiveSessionModelSwitchError`. Lần thử lại giữ nguyên
    provider/mô hình đã chuyển, và nếu lần chuyển mang theo ghi đè hồ sơ xác thực mới, cron
    cũng lưu ghi đè đó trước khi thử lại.

    Các quy tắc chọn liên quan:

    - Ghi đè mô hình của hook Gmail thắng trước khi áp dụng được.
    - Sau đó là `model` theo từng công việc.
    - Sau đó là mọi ghi đè mô hình phiên cron đã lưu.
    - Sau đó là quy trình chọn mô hình tác nhân/mặc định thông thường.

    Vòng lặp thử lại có giới hạn. Sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển đổi,
    cron hủy thay vì lặp mãi.

    Gỡ lỗi:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Công việc Cron](/vi/automation/cron-jobs), [CLI cron](/vi/cli/cron).

  </Accordion>

  <Accordion title="Làm cách nào để cài Skills trên Linux?">
    Dùng các lệnh `openclaw skills` gốc hoặc thả skills vào workspace của bạn. Giao diện Skills trên macOS không có trên Linux.
    Duyệt skills tại [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Theo mặc định, `openclaw skills install` gốc ghi vào thư mục `skills/`
    của workspace đang hoạt động. Thêm `--global` để cài vào thư mục
    skills được quản lý dùng chung cho tất cả tác nhân cục bộ. Chỉ cài CLI `clawhub`
    riêng nếu bạn muốn phát hành hoặc đồng bộ skills của riêng mình. Dùng
    `agents.defaults.skills` hoặc `agents.list[].skills` nếu bạn muốn thu hẹp
    những tác nhân nào có thể thấy skills dùng chung.

  </Accordion>

  <Accordion title="OpenClaw có thể chạy tác vụ theo lịch hoặc liên tục trong nền không?">
    Có. Dùng bộ lập lịch Gateway:

    - **Công việc Cron** cho tác vụ đã lên lịch hoặc định kỳ (tồn tại qua các lần khởi động lại).
    - **Heartbeat** cho các kiểm tra định kỳ của "phiên chính".
    - **Công việc cô lập** cho các tác nhân tự động đăng bản tóm tắt hoặc gửi tới cuộc trò chuyện.

    Tài liệu: [Công việc Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation),
    [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy skills chỉ dành cho Apple macOS từ Linux không?">
    Không trực tiếp. Skills macOS bị chặn bởi `metadata.openclaw.os` cùng các binary bắt buộc, và skills chỉ xuất hiện trong prompt hệ thống khi chúng đủ điều kiện trên **máy chủ Gateway**. Trên Linux, skills chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè điều kiện chặn.

    Bạn có ba mẫu được hỗ trợ:

    **Tùy chọn A - chạy Gateway trên máy Mac (đơn giản nhất).**
    Chạy Gateway ở nơi có các binary macOS, rồi kết nối từ Linux ở [chế độ từ xa](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Skills tải bình thường vì máy chủ Gateway là macOS.

    **Tùy chọn B - dùng một Node macOS (không SSH).**
    Chạy Gateway trên Linux, ghép nối một Node macOS (ứng dụng thanh menu), và đặt **Node Run Commands** thành "Always Ask" hoặc "Always Allow" trên máy Mac. OpenClaw có thể xem skills chỉ dành cho macOS là đủ điều kiện khi các binary bắt buộc tồn tại trên Node. Tác nhân chạy các skills đó qua công cụ `nodes`. Nếu bạn chọn "Always Ask", việc phê duyệt "Always Allow" trong prompt sẽ thêm lệnh đó vào danh sách cho phép.

    **Tùy chọn C - proxy binary macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các binary CLI bắt buộc phân giải tới các wrapper SSH chạy trên máy Mac. Sau đó ghi đè skill để cho phép Linux, nhờ đó skill vẫn đủ điều kiện.

    1. Tạo một wrapper SSH cho binary (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đặt wrapper trên `PATH` trên máy chủ Linux (ví dụ `~/bin/memo`).
    3. Ghi đè metadata của skill (workspace hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu một phiên mới để ảnh chụp skills được làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Hiện chưa có sẵn.

    Tùy chọn:

    - **Skill / plugin tùy chỉnh:** phù hợp nhất để truy cập API đáng tin cậy (Notion/HeyGen đều có API).
    - **Tự động hóa trình duyệt:** hoạt động mà không cần code nhưng chậm hơn và dễ hỏng hơn.

    Nếu bạn muốn giữ ngữ cảnh theo từng khách hàng (quy trình agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (ngữ cảnh + tùy chọn + công việc đang hoạt động).
    - Yêu cầu tác nhân lấy trang đó khi bắt đầu phiên.

    Nếu bạn muốn tích hợp gốc, hãy mở yêu cầu tính năng hoặc xây dựng một skill
    nhắm tới các API đó.

    Cài skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Các cài đặt gốc được đặt trong thư mục `skills/` của workspace đang hoạt động. Với skills dùng chung cho tất cả tác nhân cục bộ, dùng `openclaw skills install @owner/<skill-slug> --global` (hoặc đặt thủ công trong `~/.openclaw/skills/<name>/SKILL.md`). Nếu chỉ một số tác nhân nên thấy bản cài dùng chung, hãy cấu hình `agents.defaults.skills` hoặc `agents.list[].skills`. Một số skills kỳ vọng các binary được cài qua Homebrew; trên Linux, điều đó nghĩa là Linuxbrew (xem mục Câu hỏi thường gặp về Homebrew Linux ở trên). Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và [ClawHub](/vi/clawhub).

  </Accordion>

  <Accordion title="Làm cách nào để dùng Chrome hiện có đã đăng nhập của tôi với OpenClaw?">
    Dùng hồ sơ trình duyệt `user` tích hợp sẵn, hồ sơ này gắn qua Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Nếu bạn muốn một tên tùy chỉnh, hãy tạo một hồ sơ MCP rõ ràng:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Đường dẫn này có thể dùng trình duyệt máy chủ cục bộ hoặc một Node trình duyệt đã kết nối. Nếu Gateway chạy ở nơi khác, hãy chạy một máy chủ Node trên máy có trình duyệt hoặc dùng CDP từ xa thay thế.

    Các giới hạn hiện tại trên `existing-session` / `user`:

    - hành động dựa trên ref, không dựa trên bộ chọn CSS
    - tải lên yêu cầu `ref` / `inputRef` và hiện chỉ hỗ trợ từng tệp một
    - `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn cần trình duyệt được quản lý hoặc hồ sơ CDP thô

  </Accordion>
</AccordionGroup>

## Cô lập và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu riêng về cô lập không?">
    Có. Xem [Cô lập](/vi/gateway/sandboxing). Với thiết lập dành riêng cho Docker (toàn bộ Gateway trong Docker hoặc ảnh cô lập), xem [Docker](/vi/install/docker).
  </Accordion>

  <Accordion title="Docker có vẻ bị giới hạn - làm cách nào để bật đầy đủ tính năng?">
    Ảnh mặc định ưu tiên bảo mật và chạy dưới người dùng `node`, nên nó không
    bao gồm các gói hệ thống, Homebrew, hoặc trình duyệt đi kèm. Để thiết lập đầy đủ hơn:

    - Duy trì `/home/node` bằng `OPENCLAW_HOME_VOLUME` để cache tồn tại.
    - Đóng gói sẵn phụ thuộc hệ thống vào ảnh bằng `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Cài trình duyệt Playwright qua CLI đi kèm:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và đảm bảo đường dẫn được duy trì.

    Tài liệu: [Docker](/vi/install/docker), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DM riêng tư nhưng làm cho nhóm công khai/cô lập với một tác nhân không?">
    Có - nếu lưu lượng riêng tư của bạn là **DM** và lưu lượng công khai của bạn là **nhóm**.

    Dùng `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (khóa không phải main) chạy trong backend cô lập đã cấu hình, trong khi phiên DM chính vẫn ở trên máy chủ. Docker là backend mặc định nếu bạn không chọn backend nào. Sau đó giới hạn những công cụ có sẵn trong các phiên cô lập qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Nhóm: DM cá nhân + nhóm công khai](/vi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham chiếu cấu hình chính: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Làm cách nào để gắn một thư mục máy chủ vào sandbox?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Bind toàn cục + theo tác nhân được hợp nhất; bind theo tác nhân bị bỏ qua khi `scope: "shared"`. Dùng `:ro` cho mọi thứ nhạy cảm và nhớ rằng bind vượt qua các rào chắn hệ thống tệp của sandbox.

    OpenClaw xác thực nguồn bind theo cả đường dẫn đã chuẩn hóa và đường dẫn chính tắc được phân giải qua tổ tiên tồn tại sâu nhất. Điều đó nghĩa là các trường hợp thoát qua cha là symlink vẫn bị đóng an toàn ngay cả khi đoạn đường dẫn cuối chưa tồn tại, và kiểm tra gốc được phép vẫn áp dụng sau khi phân giải symlink.

    Xem [Cô lập](/vi/gateway/sandboxing#custom-bind-mounts) và [Sandbox so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để xem ví dụ và ghi chú an toàn.

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong workspace của tác nhân:

    - Ghi chú hằng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn đã tuyển chọn trong `MEMORY.md` (chỉ phiên chính/riêng tư)

    OpenClaw cũng chạy một **lần xả bộ nhớ im lặng trước Compaction** để nhắc mô hình
    ghi các ghi chú bền vững trước khi tự động Compaction. Việc này chỉ chạy khi workspace
    có thể ghi (sandbox chỉ đọc sẽ bỏ qua). Xem [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên mọi thứ. Làm sao để lưu lại bền vững?">
    Hãy yêu cầu bot **ghi sự kiện đó vào bộ nhớ**. Ghi chú dài hạn nằm trong `MEMORY.md`,
    ngữ cảnh ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là lĩnh vực chúng tôi đang cải thiện. Việc nhắc mô hình lưu bộ nhớ sẽ hữu ích;
    nó sẽ biết phải làm gì. Nếu nó vẫn tiếp tục quên, hãy xác minh Gateway đang dùng cùng một
    workspace trong mọi lần chạy.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Workspace của agent](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi mãi không? Có giới hạn nào?">
    Tệp bộ nhớ nằm trên ổ đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là
    dung lượng lưu trữ của bạn, không phải mô hình. **Ngữ cảnh phiên** vẫn bị giới hạn bởi cửa sổ
    ngữ cảnh của mô hình, nên các cuộc trò chuyện dài có thể được compact hoặc bị cắt bớt. Đó là lý do
    tìm kiếm bộ nhớ tồn tại - nó chỉ kéo các phần liên quan trở lại ngữ cảnh.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Ngữ cảnh](/vi/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có cần khóa OpenAI API không?">
    Chỉ khi bạn dùng **embedding OpenAI**. Codex OAuth bao phủ chat/completions và
    **không** cấp quyền truy cập embedding, nên **đăng nhập bằng Codex (OAuth hoặc
    đăng nhập Codex CLI)** không giúp ích cho tìm kiếm bộ nhớ ngữ nghĩa. Embedding OpenAI
    vẫn cần khóa API thật (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt provider rõ ràng, OpenClaw dùng embedding OpenAI. Cấu hình cũ
    vẫn ghi `memorySearch.provider = "auto"` cũng phân giải sang OpenAI.
    Nếu không có khóa OpenAI API, tìm kiếm bộ nhớ ngữ nghĩa sẽ vẫn không khả dụng
    cho đến khi bạn cấu hình khóa hoặc chọn rõ một provider khác.

    Nếu bạn muốn chạy cục bộ, đặt `memorySearch.provider = "local"` (và tùy chọn
    `memorySearch.fallback = "none"`). Nếu bạn muốn embedding Gemini, đặt
    `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc
    `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ các mô hình embedding **OpenAI, tương thích OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra, hoặc cục bộ**
    - xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Nơi các thứ nằm trên ổ đĩa

<AccordionGroup>
  <Accordion title="Mọi dữ liệu dùng với OpenClaw có được lưu cục bộ không?">
    Không - **trạng thái của OpenClaw là cục bộ**, nhưng **dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho họ**.

    - **Cục bộ theo mặc định:** phiên, tệp bộ nhớ, cấu hình, và workspace nằm trên máy chủ Gateway
      (`~/.openclaw` + thư mục workspace của bạn).
    - **Từ xa do cần thiết:** thông điệp bạn gửi tới provider mô hình (Anthropic/OpenAI/v.v.) đi tới
      API của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/v.v.) lưu dữ liệu thông điệp trên
      máy chủ của họ.
    - **Bạn kiểm soát phạm vi dữ liệu:** dùng mô hình cục bộ giữ prompt trên máy của bạn, nhưng lưu lượng kênh
      vẫn đi qua máy chủ của kênh.

    Liên quan: [Workspace của agent](/vi/concepts/agent-workspace), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu dữ liệu ở đâu?">
    Mọi thứ nằm dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                       | Mục đích                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (được sao chép vào hồ sơ xác thực trong lần dùng đầu tiên) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, khóa API, và `keyRef`/`tokenRef` tùy chọn)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload bí mật tùy chọn dựa trên tệp cho provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được loại bỏ)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái provider (ví dụ `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái theo từng agent (agentDir + phiên)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử và trạng thái hội thoại (theo từng agent)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Siêu dữ liệu phiên (theo từng agent)                               |

    Đường dẫn một agent cũ: `~/.openclaw/agent/*` (được di trú bởi `openclaw doctor`).

    **Workspace** của bạn (AGENTS.md, tệp bộ nhớ, Skills, v.v.) tách biệt và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên nằm ở đâu?">
    Các tệp này nằm trong **workspace của agent**, không phải `~/.openclaw`.

    - **Workspace (theo từng agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` tùy chọn.
      `memory.md` gốc viết thường chỉ là đầu vào sửa chữa cũ; `openclaw doctor --fix`
      có thể hợp nhất nó vào `MEMORY.md` khi cả hai tệp cùng tồn tại.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, trạng thái kênh/provider, hồ sơ xác thực, phiên, log,
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

  <Accordion title="Tôi có thể làm SOUL.md lớn hơn không?">
    Có. `SOUL.md` là một trong các tệp khởi tạo workspace được chèn vào
    ngữ cảnh agent. Giới hạn chèn mặc định cho mỗi tệp là `20000` ký tự,
    và tổng ngân sách khởi tạo trên các tệp là `60000` ký tự.

    Thay đổi mặc định dùng chung trong cấu hình OpenClaw của bạn:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Hoặc ghi đè một agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Dùng `/context` để kiểm tra kích thước thô so với kích thước được chèn và liệu đã có cắt bớt hay chưa.
    Giữ `SOUL.md` tập trung vào giọng điệu, lập trường, và tính cách; đặt quy tắc vận hành
    trong `AGENTS.md` và sự kiện bền vững trong bộ nhớ.

    Xem [Ngữ cảnh](/vi/concepts/context) và [Cấu hình agent](/vi/gateway/config-agents).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **workspace của agent** trong một repo git **riêng tư** và sao lưu nó ở nơi
    riêng tư (ví dụ GitHub private). Cách này ghi lại bộ nhớ + các tệp AGENTS/SOUL/USER,
    và cho phép bạn khôi phục "tâm trí" của trợ lý sau này.

    **Không** commit bất kỳ thứ gì dưới `~/.openclaw` (thông tin đăng nhập, phiên, token, hoặc payload bí mật đã mã hóa).
    Nếu bạn cần khôi phục đầy đủ, hãy sao lưu cả workspace và thư mục trạng thái
    riêng biệt (xem câu hỏi di trú ở trên).

    Tài liệu: [Workspace của agent](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm sao để gỡ cài đặt hoàn toàn OpenClaw?">
    Xem hướng dẫn riêng: [Gỡ cài đặt](/vi/install/uninstall).
  </Accordion>

  <Accordion title="Agent có thể làm việc bên ngoài workspace không?">
    Có. Workspace là **cwd mặc định** và neo bộ nhớ, không phải sandbox cứng.
    Đường dẫn tương đối phân giải bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các vị trí khác
    trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cô lập, hãy dùng
    [`agents.defaults.sandbox`](/vi/gateway/sandboxing) hoặc thiết lập sandbox theo từng agent. Nếu bạn
    muốn một repo là thư mục làm việc mặc định, hãy trỏ `workspace` của agent đó
    tới gốc repo. Repo OpenClaw chỉ là mã nguồn; hãy giữ
    workspace tách biệt trừ khi bạn cố ý muốn agent làm việc bên trong đó.

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
    Trạng thái phiên thuộc về **máy chủ gateway**. Nếu bạn đang ở chế độ từ xa, kho phiên bạn quan tâm nằm trên máy từ xa, không phải laptop cục bộ của bạn. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>
</AccordionGroup>

## Cơ bản về cấu hình

<AccordionGroup>
  <Accordion title="Cấu hình có định dạng gì? Nằm ở đâu?">
    OpenClaw đọc cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Nếu thiếu tệp, nó dùng các mặc định tương đối an toàn (bao gồm workspace mặc định là `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Tôi đặt gateway.bind: "lan" (hoặc "tailnet") và giờ không có gì lắng nghe / UI báo không được ủy quyền'>
    Liên kết không phải loopback **yêu cầu đường dẫn xác thực gateway hợp lệ**. Trong thực tế, điều đó nghĩa là:

    - xác thực bí mật dùng chung: token hoặc mật khẩu
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
    - Đường dẫn gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
    - Với xác thực mật khẩu, hãy đặt `gateway.auth.mode: "password"` cộng với `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`) thay vào đó.
    - Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không phân giải được, quá trình phân giải sẽ thất bại đóng (không có fallback từ xa che lấp).
    - Thiết lập Control UI dùng bí mật chung xác thực qua `connect.params.auth.token` hoặc `connect.params.auth.password` (được lưu trong thiết lập app/UI). Các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy` dùng header yêu cầu thay thế. Tránh đặt bí mật dùng chung trong URL.
    - Với `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback cùng máy chủ yêu cầu `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng và một mục loopback trong `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Tại sao giờ tôi cần token trên localhost?">
    OpenClaw thực thi xác thực gateway theo mặc định, bao gồm cả loopback. Trong đường dẫn mặc định thông thường, điều đó nghĩa là xác thực token: nếu không có đường dẫn xác thực rõ ràng nào được cấu hình, lúc khởi động gateway sẽ phân giải sang chế độ token và tạo một token chỉ dùng trong runtime cho lần khởi động đó, nên **client WS cục bộ phải xác thực**. Cấu hình rõ ràng `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, hoặc `OPENCLAW_GATEWAY_PASSWORD` khi client cần một bí mật ổn định qua các lần khởi động lại. Điều này chặn các tiến trình cục bộ khác gọi Gateway.

    Nếu bạn muốn một đường dẫn xác thực khác, bạn có thể chọn rõ chế độ mật khẩu (hoặc, với reverse proxy nhận biết danh tính, `trusted-proxy`). Nếu bạn **thực sự** muốn mở loopback, hãy đặt rõ `gateway.auth.mode: "none"` trong cấu hình. Doctor có thể tạo token cho bạn bất cứ lúc nào: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ tải lại nóng:

    - `gateway.reload.mode: "hybrid"` (mặc định): áp dụng nóng các thay đổi an toàn, khởi động lại với thay đổi quan trọng
    - `hot`, `restart`, `off` cũng được hỗ trợ

  </Accordion>

  <Accordion title="Làm thế nào để tắt các câu tagline vui của CLI?">
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

    - `off`: ẩn văn bản tagline nhưng vẫn giữ dòng tiêu đề banner/phiên bản.
    - `default`: luôn dùng `All your chats, one OpenClaw.`.
    - `random`: xoay vòng các tagline vui/theo mùa (hành vi mặc định).
    - Nếu bạn không muốn có banner nào, đặt env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm thế nào để bật tìm kiếm web (và fetch web)?">
    `web_fetch` hoạt động mà không cần API key. `web_search` phụ thuộc vào provider bạn chọn:

    - Các provider dựa trên API như Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity và Tavily yêu cầu thiết lập API key thông thường của chúng.
    - Grok có thể tái sử dụng xAI OAuth từ xác thực mô hình, hoặc fallback sang `XAI_API_KEY` / cấu hình web-search của Plugin.
    - Ollama Web Search không cần khóa, nhưng nó dùng host Ollama đã cấu hình của bạn và yêu cầu `ollama signin`.
    - DuckDuckGo không cần khóa, nhưng đây là tích hợp không chính thức dựa trên HTML.
    - SearXNG không cần khóa/tự host; cấu hình `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Khuyến nghị:** chạy `openclaw configure --section web` và chọn một provider.
    Các lựa chọn thay thế bằng môi trường:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
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

    Cấu hình web-search theo từng provider hiện nằm dưới `plugins.entries.<plugin>.config.webSearch.*`.
    Các đường dẫn provider cũ `tools.web.search.*` vẫn tạm thời được tải để tương thích, nhưng không nên dùng cho cấu hình mới.
    Cấu hình fallback web-fetch của Firecrawl nằm dưới `plugins.entries.firecrawl.config.webFetch.*`.

    Ghi chú:

    - Nếu bạn dùng allowlist, hãy thêm `web_search`/`web_fetch`/`x_search` hoặc `group:web`.
    - `web_fetch` được bật theo mặc định (trừ khi bị tắt rõ ràng).
    - Nếu bỏ qua `tools.web.fetch.provider`, OpenClaw tự phát hiện provider fallback fetch sẵn sàng đầu tiên từ thông tin xác thực có sẵn. Plugin Firecrawl chính thức cung cấp fallback đó.
    - Daemon đọc biến env từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Công cụ web](/vi/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa sạch cấu hình của tôi. Làm thế nào để khôi phục và tránh việc này?">
    `config.apply` thay thế **toàn bộ cấu hình**. Nếu bạn gửi một đối tượng một phần, mọi thứ khác sẽ bị xóa.

    OpenClaw hiện tại bảo vệ khỏi nhiều trường hợp ghi đè vô tình:

    - Các lượt ghi cấu hình do OpenClaw sở hữu xác thực toàn bộ cấu hình sau thay đổi trước khi ghi.
    - Các lượt ghi do OpenClaw sở hữu không hợp lệ hoặc có tính phá hủy bị từ chối và lưu dưới dạng `openclaw.json.rejected.*`.
    - Nếu chỉnh sửa trực tiếp làm hỏng khởi động hoặc tải lại nóng, Gateway fail closed hoặc bỏ qua lần tải lại; nó không ghi lại `openclaw.json`.
    - `openclaw doctor --fix` sở hữu việc sửa chữa và có thể khôi phục bản tốt gần nhất, đồng thời lưu tệp bị từ chối dưới dạng `openclaw.json.clobbered.*`.

    Khôi phục:

    - Kiểm tra `openclaw logs --follow` để tìm `Invalid config at`, `Config write rejected:`, hoặc `config reload skipped (invalid config)`.
    - Kiểm tra `openclaw.json.clobbered.*` hoặc `openclaw.json.rejected.*` mới nhất cạnh cấu hình đang hoạt động.
    - Chạy `openclaw config validate` và `openclaw doctor --fix`.
    - Chỉ sao chép lại các khóa mong muốn bằng `openclaw config set` hoặc `config.patch`.
    - Nếu bạn không có bản tốt gần nhất hoặc payload bị từ chối, hãy khôi phục từ bản sao lưu, hoặc chạy lại `openclaw doctor` và cấu hình lại các kênh/mô hình.
    - Nếu điều này ngoài dự kiến, hãy báo lỗi và đính kèm cấu hình cuối cùng bạn biết hoặc bất kỳ bản sao lưu nào.
    - Một agent lập trình cục bộ thường có thể dựng lại cấu hình hoạt động từ log hoặc lịch sử.

    Tránh việc này:

    - Dùng `openclaw config set` cho các thay đổi nhỏ.
    - Dùng `openclaw configure` cho chỉnh sửa tương tác.
    - Dùng `config.schema.lookup` trước khi bạn không chắc về đường dẫn chính xác hoặc hình dạng trường; nó trả về một nút schema nông cùng các tóm tắt con trực tiếp để drill-down.
    - Dùng `config.patch` cho chỉnh sửa RPC một phần; chỉ giữ `config.apply` cho thay thế toàn bộ cấu hình.
    - Nếu bạn đang dùng công cụ `gateway` dành cho agent từ một lần chạy agent, nó vẫn sẽ từ chối ghi vào `tools.exec.ask` / `tools.exec.security` (bao gồm các alias cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ).

    Tài liệu: [Cấu hình](/vi/cli/config), [Cấu hình tương tác](/vi/cli/configure), [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Làm thế nào để chạy Gateway trung tâm với các worker chuyên biệt trên nhiều thiết bị?">
    Mẫu phổ biến là **một Gateway** (ví dụ Raspberry Pi) cộng với **nút** và **agent**:

    - **Gateway (trung tâm):** sở hữu các kênh (Signal/WhatsApp), định tuyến và phiên.
    - **Nút (thiết bị):** Mac/iOS/Android kết nối như thiết bị ngoại vi và phơi bày công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Agent (worker):** các bộ não/không gian làm việc riêng cho vai trò đặc biệt (ví dụ "Hetzner ops", "Personal data").
    - **Sub-agent:** spawn công việc nền từ agent chính khi bạn muốn chạy song song.
    - **TUI:** kết nối tới Gateway và chuyển đổi agent/phiên.

    Tài liệu: [Nút](/vi/nodes), [Truy cập từ xa](/vi/gateway/remote), [Định tuyến đa agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [TUI](/vi/web/tui).

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

    Headless dùng **cùng engine Chromium** và hoạt động cho hầu hết tự động hóa (biểu mẫu, nhấp chuột, scraping, đăng nhập). Các khác biệt chính:

    - Không có cửa sổ trình duyệt hiển thị (dùng ảnh chụp màn hình nếu bạn cần hình ảnh).
    - Một số trang nghiêm ngặt hơn với tự động hóa ở chế độ headless (CAPTCHA, chống bot).
      Ví dụ, X/Twitter thường chặn phiên headless.

  </Accordion>

  <Accordion title="Làm thế nào để dùng Brave cho điều khiển trình duyệt?">
    Đặt `browser.executablePath` thành binary Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) và khởi động lại Gateway.
    Xem các ví dụ cấu hình đầy đủ trong [Trình duyệt](/vi/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway và nút từ xa

<AccordionGroup>
  <Accordion title="Các lệnh lan truyền giữa Telegram, gateway và nút như thế nào?">
    Tin nhắn Telegram được xử lý bởi **gateway**. Gateway chạy agent và chỉ khi đó mới gọi các nút qua **Gateway WebSocket** khi cần công cụ nút:

    Telegram → Gateway → Agent → `node.*` → Nút → Gateway → Telegram

    Nút không thấy lưu lượng provider đi vào; chúng chỉ nhận các lệnh gọi RPC của nút.

  </Accordion>

  <Accordion title="Agent của tôi có thể truy cập máy tính của tôi như thế nào nếu Gateway được host từ xa?">
    Câu trả lời ngắn: **ghép đôi máy tính của bạn như một nút**. Gateway chạy ở nơi khác, nhưng nó có thể gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    Thiết lập điển hình:

    1. Chạy Gateway trên host luôn bật (VPS/máy chủ tại nhà).
    2. Đặt host Gateway + máy tính của bạn vào cùng tailnet.
    3. Đảm bảo Gateway WS có thể truy cập được (bind tailnet hoặc tunnel SSH).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Từ xa qua SSH** (hoặc tailnet trực tiếp)
       để nó có thể đăng ký làm nút.
    5. Phê duyệt nút trên Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu nối TCP riêng; các nút kết nối qua Gateway WebSocket.

    Nhắc nhở bảo mật: ghép đôi một nút macOS cho phép `system.run` trên máy đó. Chỉ
    ghép đôi thiết bị bạn tin tưởng, và xem lại [Bảo mật](/vi/gateway/security).

    Tài liệu: [Nút](/vi/nodes), [Giao thức Gateway](/vi/gateway/protocol), [Chế độ từ xa macOS](/vi/platforms/mac/remote), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Giờ làm gì?">
    Kiểm tra các điều cơ bản:

    - Gateway đang chạy: `openclaw gateway status`
    - Sức khỏe Gateway: `openclaw status`
    - Sức khỏe kênh: `openclaw channels status`

    Sau đó xác minh xác thực và định tuyến:

    - Nếu bạn dùng Tailscale Serve, hãy chắc chắn `gateway.auth.allowTailscale` được đặt đúng.
    - Nếu bạn kết nối qua tunnel SSH, xác nhận tunnel cục bộ đang hoạt động và trỏ tới đúng cổng.
    - Xác nhận allowlist của bạn (DM hoặc nhóm) bao gồm tài khoản của bạn.

    Tài liệu: [Tailscale](/vi/gateway/tailscale), [Truy cập từ xa](/vi/gateway/remote), [Kênh](/vi/channels).

  </Accordion>

  <Accordion title="Hai phiên bản OpenClaw có thể nói chuyện với nhau không (cục bộ + VPS)?">
    Có. Không có cầu nối "bot-to-bot" tích hợp sẵn, nhưng bạn có thể nối nó theo vài cách đáng tin cậy:

    **Đơn giản nhất:** dùng một kênh chat bình thường mà cả hai bot đều có thể truy cập (Telegram/Slack/WhatsApp).
    Để Bot A gửi tin nhắn cho Bot B, rồi để Bot B trả lời như thường lệ.

    **Cầu CLI (chung):** chạy một script gọi Gateway kia bằng
    `openclaw agent --message ... --deliver`, nhắm tới một chat nơi bot kia
    đang lắng nghe. Nếu một bot ở VPS từ xa, trỏ CLI của bạn tới Gateway từ xa đó
    qua SSH/Tailscale (xem [Truy cập từ xa](/vi/gateway/remote)).

    Mẫu ví dụ (chạy từ một máy có thể truy cập Gateway đích):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Mẹo: thêm guardrail để hai bot không lặp vô tận (chỉ khi được nhắc tên, allowlist kênh,
    hoặc quy tắc "không trả lời tin nhắn từ bot").

    Tài liệu: [Truy cập từ xa](/vi/gateway/remote), [CLI agent](/vi/cli/agent), [Gửi agent](/vi/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần VPS riêng cho nhiều agent không?">
    Không. Một Gateway có thể host nhiều agent, mỗi agent có không gian làm việc, mặc định mô hình,
    và định tuyến riêng. Đây là thiết lập bình thường và rẻ hơn, đơn giản hơn nhiều so với chạy
    một VPS cho mỗi agent.

    Chỉ dùng VPS riêng khi bạn cần cô lập cứng (ranh giới bảo mật) hoặc các cấu hình rất
    khác nhau mà bạn không muốn chia sẻ. Nếu không, hãy giữ một Gateway và
    dùng nhiều agent hoặc sub-agent.

  </Accordion>

  <Accordion title="Có lợi ích gì khi dùng một node trên laptop cá nhân thay vì SSH từ VPS không?">
    Có - node là cách chính thức để truy cập laptop của bạn từ Gateway từ xa, và chúng
    mở khóa nhiều khả năng hơn quyền truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và
    nhẹ (một VPS nhỏ hoặc máy cỡ Raspberry Pi là ổn; 4 GB RAM là dư), nên một thiết lập phổ biến
    là một host luôn bật cộng với laptop của bạn làm node.

    - **Không cần SSH inbound.** Node kết nối ra ngoài tới Gateway WebSocket và dùng ghép đôi thiết bị.
    - **Kiểm soát thực thi an toàn hơn.** `system.run` được kiểm soát bằng danh sách cho phép/phê duyệt node trên laptop đó.
    - **Nhiều công cụ thiết bị hơn.** Node cung cấp `canvas`, `camera`, và `screen` ngoài `system.run`.
    - **Tự động hóa trình duyệt cục bộ.** Giữ Gateway trên VPS, nhưng chạy Chrome cục bộ thông qua node host trên laptop, hoặc gắn vào Chrome cục bộ trên host qua Chrome MCP.

    SSH phù hợp cho truy cập shell tạm thời, nhưng node đơn giản hơn cho các quy trình agent liên tục và
    tự động hóa thiết bị.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Node có chạy dịch vụ Gateway không?">
    Không. Chỉ nên chạy **một gateway** trên mỗi host trừ khi bạn cố ý chạy các profile tách biệt (xem [Nhiều gateway](/vi/gateway/multiple-gateways)). Node là thiết bị ngoại vi kết nối
    tới gateway (node iOS/Android, hoặc "chế độ node" macOS trong ứng dụng thanh menu). Với node host
    không giao diện và điều khiển CLI, xem [CLI node host](/vi/cli/node).

    Cần khởi động lại đầy đủ cho các thay đổi về `gateway`, `discovery`, và bề mặt Plugin được host.

  </Accordion>

  <Accordion title="Có cách API / RPC để áp dụng config không?">
    Có.

    - `config.schema.lookup`: kiểm tra một cây con config với node schema nông của nó, gợi ý UI khớp, và tóm tắt con trực tiếp trước khi ghi
    - `config.get`: lấy snapshot hiện tại + hash
    - `config.patch`: cập nhật một phần an toàn (ưu tiên cho hầu hết chỉnh sửa RPC); hot-reload khi có thể và khởi động lại khi cần
    - `config.apply`: xác thực + thay thế toàn bộ config; hot-reload khi có thể và khởi động lại khi cần
    - Công cụ runtime `gateway` hướng agent vẫn từ chối ghi lại `tools.exec.ask` / `tools.exec.security`; các alias cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ

  </Accordion>

  <Accordion title="Config tối thiểu hợp lý cho lần cài đặt đầu tiên">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cấu hình này đặt workspace của bạn và giới hạn ai có thể kích hoạt bot.

  </Accordion>

  <Accordion title="Làm thế nào để thiết lập Tailscale trên VPS và kết nối từ Mac của tôi?">
    Các bước tối thiểu:

    1. **Cài đặt + đăng nhập trên VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Cài đặt + đăng nhập trên Mac của bạn**
       - Dùng ứng dụng Tailscale và đăng nhập vào cùng tailnet.
    3. **Bật MagicDNS (khuyến nghị)**
       - Trong bảng điều khiển quản trị Tailscale, bật MagicDNS để VPS có tên ổn định.
    4. **Dùng hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Nếu bạn muốn dùng Control UI mà không cần SSH, hãy dùng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cách này giữ gateway bind vào loopback và cung cấp HTTPS qua Tailscale. Xem [Tailscale](/vi/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm thế nào để kết nối node Mac tới Gateway từ xa (Tailscale Serve)?">
    Serve cung cấp **Gateway Control UI + WS**. Node kết nối qua cùng endpoint Gateway WS.

    Thiết lập khuyến nghị:

    1. **Đảm bảo VPS + Mac nằm trên cùng tailnet**.
    2. **Dùng ứng dụng macOS ở chế độ Remote** (đích SSH có thể là hostname tailnet).
       Ứng dụng sẽ tunnel cổng Gateway và kết nối như một node.
    3. **Phê duyệt node** trên gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Giao thức Gateway](/vi/gateway/protocol), [Discovery](/vi/gateway/discovery), [Chế độ remote macOS](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài trên laptop thứ hai hay chỉ thêm một node?">
    Nếu bạn chỉ cần **công cụ cục bộ** (screen/camera/exec) trên laptop thứ hai, hãy thêm nó làm
    **node**. Cách này giữ một Gateway duy nhất và tránh config trùng lặp. Các công cụ node cục bộ
    hiện chỉ hỗ trợ macOS, nhưng chúng tôi dự định mở rộng sang các hệ điều hành khác.

    Chỉ cài Gateway thứ hai khi bạn cần **cách ly cứng** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Biến môi trường và tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải biến môi trường như thế nào?">
    OpenClaw đọc biến môi trường từ process cha (shell, launchd/systemd, CI, v.v.) và tải thêm:

    - `.env` từ thư mục làm việc hiện tại
    - `.env` fallback toàn cục từ `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`)

    Không file `.env` nào ghi đè các biến môi trường hiện có.
    Biến thông tin xác thực của provider là ngoại lệ với workspace `.env`: các key như
    `GEMINI_API_KEY`, `XAI_API_KEY`, hoặc `MISTRAL_API_KEY` bị bỏ qua từ workspace
    `.env` và nên nằm trong môi trường process, `~/.openclaw/.env`, hoặc config `env`.

    Bạn cũng có thể định nghĩa biến môi trường inline trong config (chỉ áp dụng nếu thiếu trong process env):

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

  <Accordion title="Tôi khởi động Gateway qua service và biến môi trường của tôi biến mất. Giờ làm gì?">
    Hai cách khắc phục phổ biến:

    1. Đặt các key bị thiếu vào `~/.openclaw/.env` để chúng được nhận ngay cả khi service không kế thừa shell env của bạn.
    2. Bật import shell (tiện ích opt-in):

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

    Cách này chạy login shell của bạn và chỉ import các key mong đợi còn thiếu (không bao giờ ghi đè). Biến môi trường tương đương:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái models hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` báo cáo liệu **import shell env** có được bật hay không. "Shell env: off"
    **không** có nghĩa là biến môi trường của bạn bị thiếu - nó chỉ có nghĩa OpenClaw sẽ không tự động tải
    login shell của bạn.

    Nếu Gateway chạy như một service (launchd/systemd), nó sẽ không kế thừa môi trường
    shell của bạn. Khắc phục bằng một trong các cách sau:

    1. Đặt token trong `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Hoặc bật import shell (`env.shellEnv.enabled: true`).
    3. Hoặc thêm nó vào khối `env` trong config của bạn (chỉ áp dụng nếu thiếu).

    Sau đó khởi động lại gateway và kiểm tra lại:

    ```bash
    openclaw models status
    ```

    Token Copilot được đọc từ `COPILOT_GITHUB_TOKEN` (cũng như `GH_TOKEN` / `GITHUB_TOKEN`).
    Xem [/concepts/model-providers](/vi/concepts/model-providers) và [/environment](/vi/help/environment).

  </Accordion>
</AccordionGroup>

## Session và nhiều cuộc trò chuyện

<AccordionGroup>
  <Accordion title="Làm thế nào để bắt đầu một cuộc trò chuyện mới?">
    Gửi `/new` hoặc `/reset` dưới dạng một tin nhắn độc lập. Xem [Quản lý session](/vi/concepts/session).
  </Accordion>

  <Accordion title="Session có tự động reset nếu tôi không bao giờ gửi /new không?">
    Session có thể hết hạn sau `session.idleMinutes`, nhưng tính năng này **bị tắt theo mặc định** (mặc định **0**).
    Đặt thành giá trị dương để bật hết hạn khi nhàn rỗi. Khi được bật, tin nhắn **tiếp theo**
    sau khoảng thời gian nhàn rỗi sẽ bắt đầu một session id mới cho chat key đó.
    Điều này không xóa transcript - nó chỉ bắt đầu một session mới.

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

    Dù vậy, tốt nhất nên xem đây là một **thử nghiệm thú vị**. Nó tốn nhiều token và thường
    kém hiệu quả hơn so với dùng một bot với các session riêng. Mô hình điển hình mà chúng tôi
    hình dung là một bot mà bạn trò chuyện, với các session khác nhau cho công việc song song. Bot đó
    cũng có thể sinh sub-agent khi cần.

    Tài liệu: [Định tuyến multi-agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [CLI Agent](/vi/cli/agents).

  </Accordion>

  <Accordion title="Tại sao context bị cắt ngắn giữa tác vụ? Làm thế nào để ngăn điều đó?">
    Context của session bị giới hạn bởi cửa sổ model. Chat dài, output công cụ lớn, hoặc nhiều
    file có thể kích hoạt Compaction hoặc cắt ngắn.

    Những điều hữu ích:

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một file.
    - Dùng `/compact` trước các tác vụ dài, và `/new` khi chuyển chủ đề.
    - Giữ context quan trọng trong workspace và yêu cầu bot đọc lại.
    - Dùng sub-agent cho công việc dài hoặc song song để chat chính nhỏ hơn.
    - Chọn model có cửa sổ context lớn hơn nếu điều này thường xuyên xảy ra.

  </Accordion>

  <Accordion title="Làm thế nào để reset hoàn toàn OpenClaw nhưng vẫn giữ cài đặt?">
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

    - Onboarding cũng cung cấp **Reset** nếu phát hiện config hiện có. Xem [Onboarding (CLI)](/vi/start/wizard).
    - Nếu bạn dùng profile (`--profile` / `OPENCLAW_PROFILE`), reset từng state dir (mặc định là `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (chỉ dành cho dev; xóa config dev + thông tin xác thực + session + workspace).

  </Accordion>

  <Accordion title='Tôi gặp lỗi "context too large" - làm thế nào để reset hoặc compact?'>
    Dùng một trong các cách sau:

    - **Compact** (giữ cuộc trò chuyện nhưng tóm tắt các lượt cũ hơn):

      ```
      /compact
      ```

      hoặc `/compact <instructions>` để hướng dẫn bản tóm tắt.

    - **Reset** (session ID mới cho cùng chat key):

      ```
      /new
      /reset
      ```

    Nếu điều này tiếp tục xảy ra:

    - Bật hoặc tinh chỉnh **cắt tỉa session** (`agents.defaults.contextPruning`) để cắt output công cụ cũ.
    - Dùng model có cửa sổ context lớn hơn.

    Tài liệu: [Compaction](/vi/concepts/compaction), [Cắt tỉa session](/vi/concepts/session-pruning), [Quản lý session](/vi/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "LLM request rejected: messages.content.tool_use.input field required"?'>
    Đây là lỗi xác thực provider: model đã phát ra một khối `tool_use` không có `input` bắt buộc.
    Điều này thường có nghĩa lịch sử session đã cũ hoặc bị hỏng (thường sau các thread dài
    hoặc thay đổi công cụ/schema).

    Cách khắc phục: bắt đầu session mới bằng `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được thông báo heartbeat mỗi 30 phút?">
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

    Nếu `HEARTBEAT.md` tồn tại nhưng về cơ bản là rỗng (chỉ có dòng trống,
    chú thích Markdown/HTML, tiêu đề Markdown như `# Heading`, dấu đánh dấu khối mã,
    hoặc các stub danh sách kiểm trống), OpenClaw sẽ bỏ qua lần chạy Heartbeat để tiết kiệm lượt gọi API.
    Nếu tệp bị thiếu, Heartbeat vẫn chạy và mô hình quyết định cần làm gì.

    Ghi đè theo từng agent dùng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm một "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **tài khoản của chính bạn**, nên nếu bạn có trong nhóm, OpenClaw có thể thấy nhóm đó.
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

  <Accordion title="Làm thế nào để lấy JID của nhóm WhatsApp?">
    Tùy chọn 1 (nhanh nhất): theo dõi log và gửi một tin nhắn thử trong nhóm:

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, ví dụ:
    `1234567890-1234567890@g.us`.

    Tùy chọn 2 (nếu đã cấu hình/đưa vào danh sách cho phép): liệt kê nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Directory](/vi/cli/directory), [Logs](/vi/cli/logs).

  </Accordion>

  <Accordion title="Tại sao OpenClaw không trả lời trong nhóm?">
    Hai nguyên nhân phổ biến:

    - Kiểm soát bằng lượt nhắc đang bật (mặc định). Bạn phải @mention bot (hoặc khớp `mentionPatterns`).
    - Bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm không nằm trong danh sách cho phép.

    Xem [Groups](/vi/channels/groups) và [Group messages](/vi/channels/group-messages).

  </Accordion>

  <Accordion title="Nhóm/luồng có chia sẻ ngữ cảnh với DM không?">
    Theo mặc định, trò chuyện trực tiếp được gộp vào phiên chính. Nhóm/kênh có khóa phiên riêng, và các chủ đề Telegram / luồng Discord là các phiên tách biệt. Xem [Groups](/vi/channels/groups) và [Group messages](/vi/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu workspace và agent?">
    Không có giới hạn cứng. Vài chục (thậm chí vài trăm) vẫn ổn, nhưng hãy chú ý:

    - **Dung lượng đĩa tăng:** phiên + bản ghi nằm trong `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token:** nhiều agent hơn nghĩa là nhiều lượt dùng mô hình đồng thời hơn.
    - **Chi phí vận hành:** hồ sơ xác thực, workspace và định tuyến kênh theo từng agent.

    Mẹo:

    - Giữ một workspace **hoạt động** cho mỗi agent (`agents.defaults.workspace`).
    - Dọn các phiên cũ (xóa JSONL hoặc mục lưu trữ) nếu dung lượng đĩa tăng.
    - Dùng `openclaw doctor` để phát hiện workspace thừa và hồ sơ không khớp.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều bot hoặc cuộc trò chuyện cùng lúc (Slack) không, và nên thiết lập như thế nào?">
    Có. Dùng **Định tuyến đa agent** để chạy nhiều agent cô lập và định tuyến tin nhắn đến theo
    kênh/tài khoản/peer. Slack được hỗ trợ như một kênh và có thể được liên kết với các agent cụ thể.

    Quyền truy cập trình duyệt rất mạnh nhưng không phải là "làm được mọi thứ con người làm" - chống bot, CAPTCHA và MFA vẫn có thể
    chặn tự động hóa. Để điều khiển trình duyệt đáng tin cậy nhất, hãy dùng Chrome MCP cục bộ trên máy chủ,
    hoặc dùng CDP trên máy thực sự chạy trình duyệt.

    Thiết lập theo khuyến nghị:

    - Máy chủ Gateway luôn bật (VPS/Mac mini).
    - Một agent cho mỗi vai trò (liên kết).
    - Các kênh Slack được liên kết với các agent đó.
    - Trình duyệt cục bộ qua Chrome MCP hoặc một node khi cần.

    Tài liệu: [Multi-Agent Routing](/vi/concepts/multi-agent), [Slack](/vi/channels/slack),
    [Browser](/vi/tools/browser), [Nodes](/vi/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình, chuyển đổi dự phòng và hồ sơ xác thực

Hỏi đáp về mô hình — mặc định, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng, hồ sơ xác thực —
nằm ở [Câu hỏi thường gặp về mô hình](/vi/help/faq-models).

## Gateway: cổng, "đang chạy rồi", và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway dùng cổng nào?">
    `gateway.port` điều khiển cổng ghép kênh duy nhất cho WebSocket + HTTP (Control UI, hook, v.v.).

    Thứ tự ưu tiên:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status báo "Runtime: running" nhưng "Connectivity probe: failed"?'>
    Vì "running" là góc nhìn của **supervisor** (launchd/systemd/schtasks). Kiểm tra kết nối là CLI thực sự kết nối đến WebSocket của Gateway.

    Dùng `openclaw gateway status` và tin các dòng này:

    - `Probe target:` (URL mà kiểm tra thực sự đã dùng)
    - `Listening:` (thứ thực sự đang được bind trên cổng)
    - `Last gateway error:` (nguyên nhân gốc thường gặp khi tiến trình còn sống nhưng cổng không lắng nghe)

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status hiển thị "Config (cli)" và "Config (service)" khác nhau?'>
    Bạn đang chỉnh một tệp cấu hình trong khi dịch vụ đang chạy một tệp khác (thường là không khớp `--profile` / `OPENCLAW_STATE_DIR`).

    Cách sửa:

    ```bash
    openclaw gateway install --force
    ```

    Chạy lệnh đó từ cùng `--profile` / môi trường mà bạn muốn dịch vụ sử dụng.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" nghĩa là gì?'>
    OpenClaw áp đặt khóa runtime bằng cách bind trình lắng nghe WebSocket ngay khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu bind thất bại với `EADDRINUSE`, nó ném `GatewayLockError` cho biết một instance khác đang lắng nghe.

    Cách sửa: dừng instance kia, giải phóng cổng, hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm thế nào để chạy OpenClaw ở chế độ từ xa (client kết nối đến Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và trỏ tới URL WebSocket từ xa, tùy chọn kèm thông tin xác thực từ xa dùng bí mật chung:

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
    - `gateway.remote.token` / `.password` chỉ là thông tin xác thực từ xa phía client; riêng chúng không bật xác thực Gateway cục bộ.

  </Accordion>

  <Accordion title='Control UI báo "unauthorized" (hoặc cứ kết nối lại). Giờ làm gì?'>
    Đường dẫn xác thực Gateway của bạn và phương thức xác thực của UI không khớp.

    Sự thật (từ mã):

    - Control UI giữ token trong `sessionStorage` cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn, nên làm mới cùng tab vẫn hoạt động mà không khôi phục tính bền vững của token trong localStorage dài hạn.
    - Khi gặp `AUTH_TOKEN_MISMATCH`, client đáng tin cậy có thể thử lại một lần có giới hạn với token thiết bị đã lưu đệm khi Gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Lần thử lại bằng token đã lưu đệm đó giờ tái sử dụng các scope đã phê duyệt được lưu cùng token thiết bị. Các caller dùng `deviceToken` rõ ràng / `scopes` rõ ràng vẫn giữ bộ scope đã yêu cầu thay vì kế thừa scope đã lưu đệm.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là token/mật khẩu bí mật chung rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
    - Bootstrap mã thiết lập tích hợp sẵn chỉ dành cho node. Sau khi phê duyệt, nó trả về token thiết bị node với `scopes: []` và không trả về token operator được bàn giao.

    Cách sửa:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL dashboard, cố mở; hiển thị gợi ý SSH nếu không có màn hình).
    - Nếu bạn chưa có token: `openclaw doctor --generate-gateway-token`.
    - Nếu từ xa, tạo đường hầm trước: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`.
    - Chế độ bí mật chung: đặt `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, rồi dán bí mật khớp vào cài đặt Control UI.
    - Chế độ Tailscale Serve: đảm bảo `gateway.auth.allowTailscale` được bật và bạn đang mở URL Serve, không phải URL loopback/tailnet thô bỏ qua header danh tính Tailscale.
    - Chế độ proxy đáng tin cậy: đảm bảo bạn đi qua proxy nhận biết danh tính đã cấu hình, không phải URL Gateway thô. Proxy loopback cùng host cũng cần `gateway.auth.trustedProxy.allowLoopback = true`.
    - Nếu vẫn không khớp sau một lần thử lại, xoay/phê duyệt lại token thiết bị đã ghép cặp:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Nếu lệnh xoay đó báo bị từ chối, kiểm tra hai điều:
      - phiên thiết bị đã ghép cặp chỉ có thể xoay thiết bị **của chính nó** trừ khi chúng cũng có `operator.admin`
      - giá trị `--scope` rõ ràng không được vượt quá các scope operator hiện tại của caller
    - Vẫn mắc kẹt? Chạy `openclaw status --all` và làm theo [Troubleshooting](/vi/gateway/troubleshooting). Xem [Dashboard](/vi/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đặt gateway.bind là tailnet nhưng nó không thể bind và không có gì lắng nghe">
    Bind `tailnet` chọn một IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không ở trên Tailscale (hoặc giao diện bị tắt), không có gì để bind vào.

    Cách sửa:

    - Khởi động Tailscale trên host đó (để nó có địa chỉ 100.x), hoặc
    - Chuyển sang `gateway.bind: "loopback"` / `"lan"`.

    Lưu ý: `tailnet` là rõ ràng. `auto` ưu tiên loopback; dùng `gateway.bind: "tailnet"` khi bạn muốn bind chỉ tailnet.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng host không?">
    Thường là không - một Gateway có thể chạy nhiều kênh nhắn tin và agent. Chỉ dùng nhiều Gateway khi bạn cần dự phòng (ví dụ: bot cứu hộ) hoặc cô lập cứng.

    Có, nhưng bạn phải cô lập:

    - `OPENCLAW_CONFIG_PATH` (cấu hình theo từng instance)
    - `OPENCLAW_STATE_DIR` (trạng thái theo từng instance)
    - `agents.defaults.workspace` (cô lập workspace)
    - `gateway.port` (cổng duy nhất)

    Thiết lập nhanh (khuyến nghị):

    - Dùng `openclaw --profile <name> ...` cho mỗi instance (tự động tạo `~/.openclaw-<name>`).
    - Đặt `gateway.port` duy nhất trong từng cấu hình hồ sơ (hoặc truyền `--port` cho lần chạy thủ công).
    - Cài đặt dịch vụ theo từng hồ sơ: `openclaw --profile <name> gateway install`.

    Hồ sơ cũng thêm hậu tố vào tên dịch vụ (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Hướng dẫn đầy đủ: [Multiple gateways](/vi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / mã 1008 nghĩa là gì?'>
    Gateway là **máy chủ WebSocket**, và nó kỳ vọng thông điệp đầu tiên
    là một frame `connect`. Nếu nhận bất cứ thứ gì khác, nó đóng kết nối
    với **mã 1008** (vi phạm chính sách).

    Nguyên nhân phổ biến:

    - Bạn đã mở URL **HTTP** trong trình duyệt (`http://...`) thay vì client WS.
    - Bạn dùng sai cổng hoặc đường dẫn.
    - Proxy hoặc tunnel đã loại bỏ header xác thực hoặc gửi một yêu cầu không phải Gateway.

    Cách sửa nhanh:

    1. Dùng URL WS: `ws://<host>:18789` (hoặc `wss://...` nếu là HTTPS).
    2. Đừng mở cổng WS trong tab trình duyệt bình thường.
    3. Nếu xác thực bật, đưa token/mật khẩu vào frame `connect`.

    Nếu bạn đang dùng CLI hoặc TUI, URL nên có dạng:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Chi tiết giao thức: [Gateway protocol](/vi/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Ghi log và gỡ lỗi

<AccordionGroup>
  <Accordion title="Log ở đâu?">
    Log tệp (có cấu trúc):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Bạn có thể đặt một đường dẫn ổn định qua `logging.file`. Cấp độ log tệp được kiểm soát bởi `logging.level`. Độ chi tiết của console được kiểm soát bởi `--verbose` và `logging.consoleLevel`.

    Cách theo dõi log nhanh nhất:

    ```bash
    openclaw logs --follow
    ```

    Log dịch vụ/supervisor (khi gateway chạy qua launchd/systemd):

    - stdout của macOS launchd: `~/Library/Logs/openclaw/gateway.log` (profile dùng `gateway-<profile>.log`; stderr bị tắt)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Xem [Khắc phục sự cố](/vi/gateway/troubleshooting) để biết thêm.

  </Accordion>

  <Accordion title="Làm thế nào để khởi động/dừng/khởi động lại dịch vụ Gateway?">
    Dùng các helper của gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy gateway thủ công, `openclaw gateway --force` có thể lấy lại cổng. Xem [Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng terminal trên Windows - làm thế nào để khởi động lại OpenClaw?">
    Có **ba chế độ cài đặt Windows**:

    **1) Thiết lập cục bộ Windows Hub:** ứng dụng native quản lý một Gateway WSL cục bộ thuộc sở hữu của ứng dụng.

    Mở **OpenClaw Companion** từ menu Start hoặc khay hệ thống, rồi dùng
    **Thiết lập Gateway** hoặc tab Kết nối.

    **2) Gateway WSL2 thủ công:** Gateway chạy bên trong Linux.

    Mở PowerShell, vào WSL, rồi khởi động lại:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chưa từng cài đặt dịch vụ, hãy khởi động ở foreground:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway Windows native:** Gateway chạy trực tiếp trong Windows.

    Mở PowerShell và chạy:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy thủ công (không có dịch vụ), dùng:

    ```powershell
    openclaw gateway run
    ```

    Tài liệu: [Windows](/vi/platforms/windows), [Runbook dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Gateway đã chạy nhưng phản hồi không bao giờ đến. Tôi nên kiểm tra gì?">
    Bắt đầu bằng một lượt kiểm tra sức khỏe nhanh:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân thường gặp:

    - Xác thực model chưa được tải trên **máy chủ gateway** (kiểm tra `models status`).
    - Ghép nối kênh/danh sách cho phép đang chặn phản hồi (kiểm tra cấu hình kênh + log).
    - WebChat/Dashboard đang mở mà không có đúng token.

    Nếu bạn đang ở xa, hãy xác nhận kết nối tunnel/Tailscale đang hoạt động và
    Gateway WebSocket có thể truy cập được.

    Tài liệu: [Kênh](/vi/channels), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title='"Đã ngắt kết nối khỏi gateway: không có lý do" - giờ làm gì?'>
    Điều này thường có nghĩa là UI đã mất kết nối WebSocket. Kiểm tra:

    1. Gateway có đang chạy không? `openclaw gateway status`
    2. Gateway có khỏe mạnh không? `openclaw status`
    3. UI có đúng token không? `openclaw dashboard`
    4. Nếu ở xa, liên kết tunnel/Tailscale có đang hoạt động không?

    Sau đó theo dõi log:

    ```bash
    openclaw logs --follow
    ```

    Tài liệu: [Bảng điều khiển](/vi/web/dashboard), [Truy cập từ xa](/vi/gateway/remote), [Khắc phục sự cố](/vi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands thất bại. Tôi nên kiểm tra gì?">
    Bắt đầu với log và trạng thái kênh:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sau đó đối chiếu lỗi:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram có quá nhiều mục. OpenClaw đã cắt giảm theo giới hạn của Telegram và thử lại với ít lệnh hơn, nhưng một số mục menu vẫn cần bị loại bỏ. Giảm lệnh plugin/skill/tùy chỉnh, hoặc tắt `channels.telegram.commands.native` nếu bạn không cần menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, hoặc các lỗi mạng tương tự: nếu bạn đang dùng VPS hoặc ở sau proxy, hãy xác nhận HTTPS đi ra được phép và DNS hoạt động với `api.telegram.org`.

    Nếu Gateway ở xa, hãy chắc chắn bạn đang xem log trên máy chủ Gateway.

    Tài liệu: [Telegram](/vi/channels/telegram), [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Tôi nên kiểm tra gì?">
    Trước tiên xác nhận Gateway có thể truy cập được và agent có thể chạy:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, dùng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh
    chat, hãy chắc chắn việc gửi đã được bật (`/deliver on`).

    Tài liệu: [TUI](/vi/web/tui), [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để dừng hoàn toàn rồi khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Thao tác này dừng/khởi động **dịch vụ được giám sát** (launchd trên macOS, systemd trên Linux).
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
    bạn muốn chạy một lần ở foreground.

  </Accordion>

  <Accordion title="Cách nhanh nhất để có thêm chi tiết khi có lỗi">
    Khởi động Gateway với `--verbose` để có thêm chi tiết trong console. Sau đó kiểm tra tệp log để xem lỗi xác thực kênh, định tuyến model và RPC.
  </Accordion>
</AccordionGroup>

## Phương tiện và tệp đính kèm

<AccordionGroup>
  <Accordion title="Skill của tôi đã tạo ảnh/PDF, nhưng không có gì được gửi">
    Tệp đính kèm gửi đi từ agent phải dùng các trường phương tiện có cấu trúc như `media`, `mediaUrl`, `path`, hoặc `filePath`. Xem [Thiết lập trợ lý OpenClaw](/vi/start/openclaw) và [Gửi từ agent](/vi/tools/agent-send).

    Gửi bằng CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Cũng hãy kiểm tra:

    - Kênh đích hỗ trợ phương tiện gửi đi và không bị chặn bởi danh sách cho phép.
    - Tệp nằm trong giới hạn kích thước của provider (ảnh được đổi kích thước tối đa 2048px).
    - `tools.fs.workspaceOnly=true` giới hạn việc gửi đường dẫn cục bộ trong workspace, temp/media-store và các tệp đã được sandbox xác thực.
    - `tools.fs.workspaceOnly=false` cho phép các lượt gửi phương tiện cục bộ có cấu trúc dùng tệp cục bộ trên host mà agent đã có thể đọc, nhưng chỉ dành cho phương tiện cộng với các loại tài liệu an toàn (ảnh, âm thanh, video, PDF, tài liệu Office và tài liệu văn bản đã xác thực như Markdown/MD, TXT, JSON, YAML và YML). Đây không phải là trình quét bí mật: một `secret.txt` hoặc `config.json` mà agent đọc được có thể được đính kèm khi extension và xác thực nội dung khớp. Giữ các tệp nhạy cảm bên ngoài những đường dẫn agent có thể đọc, hoặc giữ `tools.fs.workspaceOnly=true` để gửi đường dẫn cục bộ nghiêm ngặt hơn.

    Xem [Hình ảnh](/vi/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn khi cho phép OpenClaw nhận DM đến không?">
    Xem DM đến là đầu vào không đáng tin cậy. Mặc định được thiết kế để giảm rủi ro:

    - Hành vi mặc định trên các kênh hỗ trợ DM là **ghép nối**:
      - Người gửi không xác định nhận một mã ghép nối; bot không xử lý tin nhắn của họ.
      - Phê duyệt bằng: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Yêu cầu đang chờ được giới hạn ở **3 mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu mã không đến.
    - Mở DM công khai yêu cầu chọn tham gia rõ ràng (`dmPolicy: "open"` và danh sách cho phép `"*"`).

    Chạy `openclaw doctor` để phát hiện các chính sách DM rủi ro.

  </Accordion>

  <Accordion title="Prompt injection có chỉ là vấn đề với bot công khai không?">
    Không. Prompt injection liên quan đến **nội dung không đáng tin cậy**, không chỉ là ai có thể DM bot.
    Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/tải web, trang trình duyệt, email,
    tài liệu, tệp đính kèm, log được dán), nội dung đó có thể bao gồm các chỉ dẫn cố
    chiếm quyền model. Điều này có thể xảy ra ngay cả khi **bạn là người gửi duy nhất**.

    Rủi ro lớn nhất là khi công cụ được bật: model có thể bị lừa
    rò rỉ ngữ cảnh hoặc gọi công cụ thay mặt bạn. Giảm phạm vi ảnh hưởng bằng cách:

    - dùng một agent "trình đọc" chỉ đọc hoặc không bật công cụ để tóm tắt nội dung không đáng tin cậy
    - tắt `web_search` / `web_fetch` / `browser` cho các agent có bật công cụ
    - cũng xem văn bản tệp/tài liệu đã giải mã là không đáng tin cậy: OpenResponses
      `input_file` và trích xuất tệp đính kèm phương tiện đều bọc văn bản đã trích xuất trong
      các dấu mốc ranh giới nội dung bên ngoài rõ ràng thay vì truyền văn bản tệp thô
    - sandboxing và dùng danh sách cho phép công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw có kém an toàn hơn vì dùng TypeScript/Node thay vì Rust/WASM không?">
    Ngôn ngữ và runtime có ý nghĩa, nhưng chúng không phải là rủi ro chính đối với một
    agent cá nhân. Các rủi ro thực tế của OpenClaw là việc lộ gateway, ai có thể nhắn tin cho
    bot, prompt injection, phạm vi công cụ, xử lý thông tin xác thực, truy cập trình duyệt, truy cập exec
    và mức độ tin cậy của skill hoặc plugin bên thứ ba.

    Rust và WASM có thể cung cấp cách ly mạnh hơn cho một số lớp mã, nhưng
    chúng không giải quyết prompt injection, danh sách cho phép kém, lộ gateway công khai,
    công cụ quá rộng, hoặc một profile trình duyệt đã đăng nhập vào các
    tài khoản nhạy cảm. Hãy xem những điều đó là các kiểm soát chính:

    - giữ Gateway riêng tư hoặc đã xác thực
    - dùng ghép nối và danh sách cho phép cho DM và nhóm
    - từ chối hoặc sandbox các công cụ rủi ro cho đầu vào không đáng tin cậy
    - chỉ cài đặt plugin và Skills đáng tin cậy
    - chạy `openclaw security audit --deep` sau khi thay đổi cấu hình

    Chi tiết: [Bảo mật](/vi/gateway/security), [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="Tôi thấy các báo cáo về phiên bản OpenClaw bị lộ. Tôi nên kiểm tra gì?">
    Trước tiên kiểm tra triển khai thực tế của bạn:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Đường cơ sở an toàn hơn là:

    - Gateway ràng buộc với `loopback`, hoặc chỉ được lộ qua truy cập riêng tư đã xác thực
      như tailnet, SSH tunnel, xác thực token/mật khẩu, hoặc proxy tin cậy được
      cấu hình đúng
    - DM ở chế độ `pairing` hoặc `allowlist`
    - nhóm nằm trong danh sách cho phép và yêu cầu nhắc đến trừ khi mọi thành viên đều đáng tin cậy
    - công cụ rủi ro cao (`exec`, `browser`, `gateway`, `cron`) bị từ chối hoặc được giới hạn
      chặt chẽ cho các agent đọc nội dung không đáng tin cậy
    - sandboxing được bật ở nơi việc thực thi công cụ cần phạm vi ảnh hưởng nhỏ hơn

    Ràng buộc công khai không có xác thực, DM/nhóm mở kèm công cụ và quyền điều khiển trình duyệt
    bị lộ là những phát hiện cần sửa trước. Chi tiết:
    [Danh sách kiểm tra kiểm toán bảo mật](/vi/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="ClawHub skills và plugin bên thứ ba có an toàn để cài đặt không?">
    Xem skills và plugin bên thứ ba là mã mà bạn chọn tin tưởng.
    Các trang skill ClawHub hiển thị trạng thái quét trước khi cài đặt, nhưng quét không phải là
    một ranh giới bảo mật hoàn chỉnh. OpenClaw không chạy cơ chế chặn
    mã nguy hiểm cục bộ tích hợp trong các luồng cài đặt/cập nhật plugin hoặc skill; hãy dùng
    `security.installPolicy` do người vận hành sở hữu cho các quyết định cho phép/chặn cục bộ.

    Mẫu an toàn hơn:

    - ưu tiên tác giả đáng tin cậy và phiên bản được ghim
    - đọc skill hoặc plugin trước khi bật
    - giữ danh sách cho phép plugin và skill ở phạm vi hẹp
    - chạy các workflow với đầu vào không đáng tin cậy trong sandbox với công cụ tối thiểu
    - tránh cấp cho mã bên thứ ba quyền truy cập rộng vào hệ thống tệp, exec, trình duyệt hoặc bí mật

    Chi tiết: [Skills](/vi/tools/skills), [Plugins](/vi/tools/plugin),
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub hoặc số điện thoại riêng không?">
    Có, với hầu hết thiết lập. Cô lập bot bằng các tài khoản và số điện thoại riêng
    giúp giảm phạm vi ảnh hưởng nếu có sự cố. Việc này cũng giúp xoay vòng
    thông tin xác thực hoặc thu hồi quyền truy cập dễ hơn mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Bắt đầu nhỏ. Chỉ cấp quyền truy cập vào các công cụ và tài khoản bạn thực sự cần, rồi mở rộng
    sau nếu cần.

    Tài liệu: [Bảo mật](/vi/gateway/security), [Ghép nối](/vi/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể trao quyền tự chủ cho nó đối với tin nhắn văn bản của mình không, và điều đó có an toàn không?">
    Chúng tôi **không** khuyến nghị trao toàn quyền tự chủ đối với tin nhắn cá nhân của bạn. Mô hình an toàn nhất là:

    - Giữ tin nhắn trực tiếp ở **chế độ ghép nối** hoặc một danh sách cho phép chặt chẽ.
    - Dùng **số điện thoại hoặc tài khoản riêng** nếu bạn muốn nó nhắn tin thay mặt bạn.
    - Để nó soạn nháp, rồi **phê duyệt trước khi gửi**.

    Nếu bạn muốn thử nghiệm, hãy làm trên một tài khoản chuyên dụng và giữ nó cô lập. Xem
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể dùng các mô hình rẻ hơn cho tác vụ trợ lý cá nhân không?">
    Có, **nếu** agent chỉ dùng để trò chuyện và đầu vào đáng tin cậy. Các tầng nhỏ hơn
    dễ bị chiếm đoạt chỉ thị hơn, vì vậy hãy tránh dùng chúng cho agent có bật công cụ
    hoặc khi đọc nội dung không đáng tin cậy. Nếu bạn bắt buộc phải dùng mô hình nhỏ hơn, hãy khóa chặt
    công cụ và chạy trong sandbox. Xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã ghép nối">
    Mã ghép nối được gửi **chỉ** khi một người gửi chưa biết nhắn tin cho bot và
    `dmPolicy: "pairing"` được bật. Chỉ riêng `/start` không tạo mã.

    Kiểm tra yêu cầu đang chờ:

    ```bash
    openclaw pairing list telegram
    ```

    Nếu bạn muốn truy cập ngay, hãy thêm id người gửi của bạn vào danh sách cho phép hoặc đặt `dmPolicy: "open"`
    cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: nó có nhắn tin cho danh bạ của tôi không? Ghép nối hoạt động thế nào?">
    Không. Chính sách tin nhắn trực tiếp mặc định của WhatsApp là **ghép nối**. Người gửi chưa biết chỉ nhận được mã ghép nối và tin nhắn của họ **không được xử lý**. OpenClaw chỉ trả lời các cuộc trò chuyện mà nó nhận được hoặc các lượt gửi rõ ràng do bạn kích hoạt.

    Phê duyệt ghép nối bằng:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liệt kê các yêu cầu đang chờ:

    ```bash
    openclaw pairing list whatsapp
    ```

    Lời nhắc số điện thoại trong trình hướng dẫn: số này được dùng để đặt **danh sách cho phép/chủ sở hữu** để tin nhắn trực tiếp của chính bạn được phép. Nó không được dùng để tự động gửi. Nếu bạn chạy trên số WhatsApp cá nhân của mình, hãy dùng số đó và bật `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh trò chuyện, hủy tác vụ và "nó sẽ không dừng"

<AccordionGroup>
  <Accordion title="Làm cách nào để ngăn thông báo hệ thống nội bộ hiển thị trong trò chuyện?">
    Hầu hết thông báo nội bộ hoặc thông báo công cụ chỉ xuất hiện khi **verbose**, **trace** hoặc **reasoning** được bật
    cho phiên đó.

    Sửa ngay trong cuộc trò chuyện nơi bạn thấy chúng:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Nếu vẫn còn ồn, hãy kiểm tra cài đặt phiên trong Control UI và đặt verbose
    thành **kế thừa**. Đồng thời xác nhận rằng bạn không dùng hồ sơ bot có `verboseDefault` được đặt
    thành `on` trong cấu hình.

    Tài liệu: [Suy nghĩ và verbose](/vi/tools/thinking), [Bảo mật](/vi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm cách nào để dừng/hủy một tác vụ đang chạy?">
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

    Đây là các trình kích hoạt hủy (không phải lệnh gạch chéo).

    Với tiến trình nền (từ công cụ exec), bạn có thể yêu cầu agent chạy:

    ```
    process action:kill sessionId:XXX
    ```

    Tổng quan về lệnh gạch chéo: xem [Lệnh gạch chéo](/vi/tools/slash-commands).

    Hầu hết lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`, nhưng một vài lối tắt (như `/status`) cũng hoạt động nội tuyến với người gửi trong danh sách cho phép.

  </Accordion>

  <Accordion title='Làm cách nào để gửi tin nhắn Discord từ Telegram? ("Nhắn tin chéo ngữ cảnh bị từ chối")'>
    OpenClaw chặn nhắn tin **chéo nhà cung cấp** theo mặc định. Nếu một lệnh gọi công cụ được ràng buộc
    với Telegram, nó sẽ không gửi đến Discord trừ khi bạn cho phép rõ ràng.

    Bật nhắn tin chéo nhà cung cấp cho agent:

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

    Khởi động lại Gateway sau khi chỉnh sửa cấu hình.

  </Accordion>

  <Accordion title='Tại sao có cảm giác bot "phớt lờ" các tin nhắn gửi dồn dập?'>
    Theo mặc định, lời nhắc giữa lượt chạy được điều hướng vào lượt chạy đang hoạt động. Dùng `/queue` để chọn hành vi của lượt chạy đang hoạt động:

    - `steer` - hướng dẫn lượt chạy đang hoạt động tại ranh giới mô hình tiếp theo
    - `followup` - đưa tin nhắn vào hàng đợi và chạy lần lượt sau khi lượt chạy hiện tại kết thúc
    - `collect` - đưa các tin nhắn tương thích vào hàng đợi và trả lời một lần sau khi lượt chạy hiện tại kết thúc
    - `interrupt` - hủy lượt chạy hiện tại và bắt đầu mới

    Chế độ mặc định là `steer`. Bạn có thể thêm các tùy chọn như `debounce:0.5s cap:25 drop:summarize` cho các chế độ có hàng đợi. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Khác

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic với API key là gì?'>
    Trong OpenClaw, thông tin xác thực và lựa chọn mô hình là hai phần riêng biệt. Việc đặt `ANTHROPIC_API_KEY` (hoặc lưu API key Anthropic trong hồ sơ xác thực) bật xác thực, nhưng mô hình mặc định thực tế là mô hình bạn cấu hình trong `agents.defaults.model.primary` (ví dụ: `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). Nếu bạn thấy `No credentials found for profile "anthropic:default"`, điều đó có nghĩa là Gateway không tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` dự kiến cho agent đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn bị kẹt? Hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [thảo luận GitHub](https://github.com/openclaw/openclaw/discussions).

## Liên quan

- [Câu hỏi thường gặp khi chạy lần đầu](/vi/help/faq-first-run) — cài đặt, onboard, xác thực, đăng ký, lỗi ban đầu
- [Câu hỏi thường gặp về mô hình](/vi/help/faq-models) — lựa chọn mô hình, chuyển đổi dự phòng, hồ sơ xác thực
- [Khắc phục sự cố](/vi/help/troubleshooting) — phân loại theo triệu chứng
