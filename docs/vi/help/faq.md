---
read_when:
    - Trả lời các câu hỏi hỗ trợ thường gặp về thiết lập, cài đặt, onboarding hoặc runtime
    - Phân loại các sự cố do người dùng báo cáo trước khi gỡ lỗi sâu hơn
summary: Câu hỏi thường gặp về thiết lập, cấu hình và cách sử dụng OpenClaw
title: Câu hỏi thường gặp
x-i18n:
    generated_at: "2026-07-03T15:33:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Câu trả lời nhanh cùng phần khắc phục sự cố chuyên sâu hơn cho các thiết lập thực tế (phát triển cục bộ, VPS, đa tác nhân, OAuth/khóa API, chuyển đổi dự phòng mô hình). Để chẩn đoán runtime, xem [Khắc phục sự cố](/vi/gateway/troubleshooting). Để xem tham chiếu cấu hình đầy đủ, xem [Cấu hình](/vi/gateway/configuration).

## 60 giây đầu tiên nếu có gì đó bị hỏng

1. **Trạng thái nhanh (kiểm tra đầu tiên)**

   ```bash
   openclaw status
   ```

   Tóm tắt cục bộ nhanh: OS + bản cập nhật, khả năng truy cập gateway/dịch vụ, tác nhân/phiên, cấu hình nhà cung cấp + vấn đề runtime (khi gateway truy cập được).

2. **Báo cáo có thể dán (an toàn để chia sẻ)**

   ```bash
   openclaw status --all
   ```

   Chẩn đoán chỉ đọc kèm phần đuôi log (token đã được biên tập ẩn).

3. **Trạng thái daemon + cổng**

   ```bash
   openclaw gateway status
   ```

   Hiển thị runtime của supervisor so với khả năng truy cập RPC, URL mục tiêu của phép dò, và cấu hình mà dịch vụ có khả năng đã dùng.

4. **Các phép dò sâu**

   ```bash
   openclaw status --deep
   ```

   Chạy phép dò sức khỏe gateway trực tiếp, bao gồm các phép dò kênh khi được hỗ trợ
   (yêu cầu gateway truy cập được). Xem [Sức khỏe](/vi/gateway/health).

5. **Theo dõi log mới nhất**

   ```bash
   openclaw logs --follow
   ```

   Nếu RPC ngừng hoạt động, chuyển sang:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log tệp tách biệt với log dịch vụ; xem [Ghi log](/vi/logging) và [Khắc phục sự cố](/vi/gateway/troubleshooting).

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

   Yêu cầu gateway đang chạy cung cấp ảnh chụp nhanh đầy đủ (chỉ WS). Xem [Sức khỏe](/vi/gateway/health).

## Bắt đầu nhanh và thiết lập lần chạy đầu tiên

Phần hỏi đáp lần chạy đầu tiên — cài đặt, onboard, tuyến xác thực, đăng ký, lỗi ban đầu —
nằm trong [FAQ lần chạy đầu tiên](/vi/help/faq-first-run).

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là trợ lý AI cá nhân mà bạn chạy trên thiết bị của chính mình. Nó trả lời trên các bề mặt nhắn tin bạn đã dùng (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, và các Plugin kênh đi kèm như QQ Bot) và cũng có thể dùng giọng nói + Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn bật; trợ lý là sản phẩm.
  </Accordion>

  <Accordion title="Đề xuất giá trị">
    OpenClaw không phải là "chỉ một wrapper Claude." Đây là **mặt phẳng điều khiển ưu tiên cục bộ** cho phép bạn chạy một
    trợ lý có năng lực trên **phần cứng của chính bạn**, truy cập được từ các ứng dụng chat bạn đã dùng, với
    phiên có trạng thái, bộ nhớ, và công cụ - mà không trao quyền kiểm soát quy trình làm việc của bạn cho một
    SaaS được lưu trữ.

    Điểm nổi bật:

    - **Thiết bị của bạn, dữ liệu của bạn:** chạy Gateway ở bất cứ đâu bạn muốn (Mac, Linux, VPS) và giữ
      workspace + lịch sử phiên ở cục bộ.
    - **Kênh thật, không phải sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/v.v.,
      cộng với giọng nói di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc mô hình:** dùng Anthropic, OpenAI, MiniMax, OpenRouter, v.v., với định tuyến
      theo từng tác nhân và chuyển đổi dự phòng.
    - **Tùy chọn chỉ cục bộ:** chạy mô hình cục bộ để **toàn bộ dữ liệu có thể ở lại trên thiết bị của bạn** nếu bạn muốn.
    - **Định tuyến đa tác nhân:** tách tác nhân theo kênh, tài khoản, hoặc tác vụ, mỗi tác nhân có
      workspace và mặc định riêng.
    - **Mã nguồn mở và dễ tùy biến:** kiểm tra, mở rộng, và tự lưu trữ mà không bị khóa vào nhà cung cấp.

    Tài liệu: [Gateway](/vi/gateway), [Kênh](/vi/channels), [Đa tác nhân](/vi/concepts/multi-agent),
    [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập xong - tôi nên làm gì trước?">
    Các dự án đầu tiên phù hợp:

    - Xây dựng website (WordPress, Shopify, hoặc một trang tĩnh đơn giản).
    - Tạo nguyên mẫu ứng dụng di động (dàn ý, màn hình, kế hoạch API).
    - Sắp xếp tệp và thư mục (dọn dẹp, đặt tên, gắn thẻ).
    - Kết nối Gmail và tự động hóa tóm tắt hoặc theo dõi tiếp.

    Nó có thể xử lý các tác vụ lớn, nhưng hoạt động tốt nhất khi bạn chia chúng thành các giai đoạn và
    dùng tác nhân phụ cho công việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng hằng ngày hàng đầu cho OpenClaw là gì?">
    Các lợi ích hằng ngày thường trông như sau:

    - **Bản tóm tắt cá nhân:** tóm tắt hộp thư đến, lịch, và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo:** nghiên cứu nhanh, tóm tắt, và bản nháp đầu tiên cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi tiếp:** lời nhắc và danh sách kiểm tra được điều khiển bởi cron hoặc heartbeat.
    - **Tự động hóa trình duyệt:** điền biểu mẫu, thu thập dữ liệu, và lặp lại tác vụ web.
    - **Điều phối đa thiết bị:** gửi một tác vụ từ điện thoại, để Gateway chạy tác vụ đó trên máy chủ, và nhận lại kết quả trong chat.

  </Accordion>

  <Accordion title="OpenClaw có thể hỗ trợ tạo khách hàng tiềm năng, tiếp cận, quảng cáo, và blog cho SaaS không?">
    Có, đối với **nghiên cứu, đánh giá chất lượng, và soạn thảo**. Nó có thể quét trang, tạo danh sách rút gọn,
    tóm tắt khách hàng tiềm năng, và viết bản nháp nội dung tiếp cận hoặc quảng cáo.

    Với **chiến dịch tiếp cận hoặc quảng cáo**, hãy giữ con người trong vòng kiểm duyệt. Tránh spam, tuân thủ luật địa phương và
    chính sách nền tảng, và rà soát mọi thứ trước khi gửi. Mẫu an toàn nhất là để
    OpenClaw soạn nháp và bạn phê duyệt.

    Tài liệu: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Ưu điểm so với Claude Code cho phát triển web là gì?">
    OpenClaw là **trợ lý cá nhân** và lớp điều phối, không phải công cụ thay thế IDE. Dùng
    Claude Code hoặc Codex để có vòng lặp lập trình trực tiếp nhanh nhất bên trong repo. Dùng OpenClaw khi bạn
    muốn bộ nhớ bền vững, truy cập đa thiết bị, và điều phối công cụ.

    Ưu điểm:

    - **Bộ nhớ + workspace liên tục** qua các phiên
    - **Truy cập đa nền tảng** (WhatsApp, Telegram, TUI, WebChat)
    - **Điều phối công cụ** (trình duyệt, tệp, lập lịch, hook)
    - **Gateway luôn bật** (chạy trên VPS, tương tác từ mọi nơi)
    - **Node** cho trình duyệt/màn hình/camera/exec cục bộ

    Giới thiệu: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills và tự động hóa

<AccordionGroup>
  <Accordion title="Làm cách nào để tùy chỉnh skills mà không làm repo bị bẩn?">
    Dùng override được quản lý thay vì chỉnh sửa bản sao trong repo. Đặt thay đổi của bạn trong `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm thư mục qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → đi kèm → `skills.load.extraDirs`, nên các override được quản lý vẫn thắng skills đi kèm mà không chạm vào git. Nếu bạn cần skill được cài toàn cục nhưng chỉ hiển thị với một số tác nhân, giữ bản sao dùng chung trong `~/.openclaw/skills` và kiểm soát khả năng hiển thị bằng `agents.defaults.skills` và `agents.list[].skills`. Chỉ các chỉnh sửa đáng đưa upstream mới nên nằm trong repo và được gửi dưới dạng PR.
  </Accordion>

  <Accordion title="Tôi có thể tải skills từ thư mục tùy chỉnh không?">
    Có. Thêm thư mục bổ sung qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (ưu tiên thấp nhất). Thứ tự ưu tiên mặc định là `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → đi kèm → `skills.load.extraDirs`. `clawhub` mặc định cài vào `./skills`, mà OpenClaw xem là `<workspace>/skills` trong phiên tiếp theo. Nếu skill chỉ nên hiển thị với một số tác nhân nhất định, kết hợp điều đó với `agents.defaults.skills` hoặc `agents.list[].skills`.
  </Accordion>

  <Accordion title="Làm cách nào để dùng các mô hình hoặc thiết lập khác nhau cho các tác vụ khác nhau?">
    Hiện nay các mẫu được hỗ trợ là:

    - **Công việc Cron**: công việc tách biệt có thể đặt override `model` theo từng công việc.
    - **Tác nhân**: định tuyến tác vụ tới các tác nhân riêng với mô hình mặc định, mức suy nghĩ, và tham số stream khác nhau.
    - **Chuyển đổi theo yêu cầu**: dùng `/model` để chuyển mô hình phiên hiện tại bất cứ lúc nào.

    Ví dụ, dùng cùng một mô hình với thiết lập khác nhau theo từng tác nhân:

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

    Đặt mặc định dùng chung theo từng mô hình trong `agents.defaults.models["provider/model"].params`, sau đó đặt override riêng cho tác nhân trong `agents.list[].params` phẳng. Không định nghĩa các mục `agents.list[].models["provider/model"].params` lồng nhau riêng biệt cho cùng một mô hình; `agents.list[].models` dành cho danh mục mô hình theo tác nhân và override runtime.

    Xem [Công việc Cron](/vi/automation/cron-jobs), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [Cấu hình](/vi/gateway/config-agents), và [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị đơ khi làm việc nặng. Làm cách nào để chuyển tải việc đó?">
    Dùng **tác nhân phụ** cho các tác vụ dài hoặc song song. Tác nhân phụ chạy trong phiên riêng,
    trả về bản tóm tắt, và giữ chat chính của bạn phản hồi nhanh.

    Yêu cầu bot của bạn "spawn a sub-agent for this task" hoặc dùng `/subagents`.
    Dùng `/status` trong chat để xem Gateway đang làm gì ngay lúc này (và liệu nó có đang bận không).

    Mẹo token: tác vụ dài và tác nhân phụ đều tiêu thụ token. Nếu chi phí là mối lo, đặt
    mô hình rẻ hơn cho tác nhân phụ qua `agents.defaults.subagents.model`.

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Các phiên subagent ràng buộc theo luồng hoạt động như thế nào trên Discord?">
    Dùng ràng buộc luồng. Bạn có thể ràng buộc một luồng Discord với một subagent hoặc mục tiêu phiên để các tin nhắn theo sau trong luồng đó vẫn ở trên phiên đã ràng buộc.

    Luồng cơ bản:

    - Spawn bằng `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"` cho theo dõi tiếp liên tục).
    - Hoặc ràng buộc thủ công bằng `/focus <target>`.
    - Dùng `/agents` để kiểm tra trạng thái ràng buộc.
    - Dùng `/session idle <duration|off>` và `/session max-age <duration|off>` để kiểm soát tự động bỏ focus.
    - Dùng `/unfocus` để tách luồng.

    Cấu hình bắt buộc:

    - Mặc định toàn cục: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Tự động ràng buộc khi spawn: `channels.discord.threadBindings.spawnSessions` mặc định là `true`; đặt thành `false` để tắt spawn phiên ràng buộc theo luồng.

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Discord](/vi/channels/discord), [Tham chiếu cấu hình](/vi/gateway/configuration-reference), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Một subagent đã hoàn tất, nhưng bản cập nhật hoàn tất được gửi sai nơi hoặc không bao giờ được đăng. Tôi nên kiểm tra gì?">
    Trước tiên hãy kiểm tra tuyến requester đã phân giải:

    - Việc gửi subagent ở chế độ hoàn tất ưu tiên mọi luồng đã ràng buộc hoặc tuyến hội thoại khi tồn tại.
    - Nếu nguồn hoàn tất chỉ mang theo một kênh, OpenClaw chuyển sang tuyến đã lưu của phiên requester (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn có thể thành công.
    - Nếu không có tuyến đã ràng buộc lẫn tuyến đã lưu có thể dùng, gửi trực tiếp có thể thất bại và kết quả chuyển sang gửi phiên đã xếp hàng thay vì đăng ngay vào chat.
    - Mục tiêu không hợp lệ hoặc cũ vẫn có thể buộc chuyển sang hàng đợi hoặc làm lần gửi cuối cùng thất bại.
    - Nếu câu trả lời trợ lý hiển thị cuối cùng của tiến trình con là token im lặng chính xác `NO_REPLY` / `no_reply`, hoặc chính xác `ANNOUNCE_SKIP`, OpenClaw cố ý chặn thông báo thay vì đăng tiến độ cũ trước đó.
    - Đầu ra Tool/toolResult không được nâng lên thành văn bản kết quả của tiến trình con; kết quả là câu trả lời trợ lý hiển thị mới nhất của tiến trình con.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác nhân phụ](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks), [Công cụ phiên](/vi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron hoặc lời nhắc không chạy. Tôi nên kiểm tra gì?">
    Cron chạy bên trong tiến trình Gateway. Nếu Gateway không chạy liên tục,
    các tác vụ đã lên lịch sẽ không chạy.

    Danh sách kiểm tra:

    - Xác nhận cron đã được bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` chưa được đặt.
    - Kiểm tra Gateway đang chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh cài đặt múi giờ cho tác vụ (`--tz` so với múi giờ của máy chủ).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation).

  </Accordion>

  <Accordion title="Cron đã chạy, nhưng không có gì được gửi đến kênh. Vì sao?">
    Trước tiên hãy kiểm tra chế độ gửi:

    - `--no-deliver` / `delivery.mode: "none"` nghĩa là không mong đợi runner gửi dự phòng.
    - Thiếu hoặc mục tiêu thông báo không hợp lệ (`channel` / `to`) nghĩa là runner đã bỏ qua việc gửi ra ngoài.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là runner đã cố gửi nhưng thông tin xác thực đã chặn việc đó.
    - Kết quả cô lập im lặng (chỉ `NO_REPLY` / `no_reply`) được xem là cố ý không thể gửi, vì vậy runner cũng chặn việc gửi dự phòng đã xếp hàng.

    Đối với các tác vụ cron cô lập, tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message`
    khi có tuyến chat. `--announce` chỉ kiểm soát đường dẫn dự phòng của runner
    cho văn bản cuối cùng mà tác nhân chưa tự gửi.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Vì sao một lượt chạy cron cô lập lại đổi mô hình hoặc thử lại một lần?">
    Đó thường là đường dẫn chuyển mô hình trực tiếp, không phải lên lịch trùng lặp.

    Cron cô lập có thể lưu một bàn giao mô hình runtime và thử lại khi lượt chạy
    đang hoạt động ném `LiveSessionModelSwitchError`. Lần thử lại giữ nguyên
    nhà cung cấp/mô hình đã chuyển, và nếu việc chuyển có kèm một ghi đè hồ sơ xác thực mới,
    cron cũng lưu điều đó trước khi thử lại.

    Các quy tắc chọn liên quan:

    - Ghi đè mô hình của hook Gmail thắng trước khi áp dụng được.
    - Sau đó là `model` theo từng tác vụ.
    - Sau đó là mọi ghi đè mô hình cron-session đã lưu.
    - Sau đó là lựa chọn mô hình tác nhân/mặc định thông thường.

    Vòng lặp thử lại có giới hạn. Sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển đổi,
    cron sẽ hủy thay vì lặp mãi.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [CLI cron](/vi/cli/cron).

  </Accordion>

  <Accordion title="Tôi cài đặt Skills trên Linux như thế nào?">
    Dùng các lệnh `openclaw skills` gốc hoặc thả Skills vào workspace của bạn. Giao diện Skills trên macOS không có trên Linux.
    Duyệt Skills tại [https://clawhub.ai](https://clawhub.ai).

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

    Mặc định, `openclaw skills install` gốc ghi vào thư mục `skills/`
    của workspace đang hoạt động. Thêm `--global` để cài vào thư mục
    Skills được quản lý dùng chung cho tất cả tác nhân cục bộ. Chỉ cài CLI `clawhub`
    riêng nếu bạn muốn phát hành hoặc đồng bộ Skills của riêng mình. Dùng
    `agents.defaults.skills` hoặc `agents.list[].skills` nếu bạn muốn thu hẹp
    những tác nhân nào có thể thấy Skills dùng chung.

  </Accordion>

  <Accordion title="OpenClaw có thể chạy tác vụ theo lịch hoặc liên tục trong nền không?">
    Có. Dùng bộ lập lịch Gateway:

    - **Tác vụ Cron** cho các tác vụ đã lên lịch hoặc lặp lại (được giữ qua các lần khởi động lại).
    - **Heartbeat** cho các kiểm tra định kỳ của "phiên chính".
    - **Tác vụ cô lập** cho các tác nhân tự trị đăng bản tóm tắt hoặc gửi đến chat.

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation),
    [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title="Tôi có thể chạy Skills chỉ dành cho Apple macOS từ Linux không?">
    Không trực tiếp. Skills macOS được kiểm soát bởi `metadata.openclaw.os` cùng với các binary bắt buộc, và Skills chỉ xuất hiện trong prompt hệ thống khi đủ điều kiện trên **máy chủ Gateway**. Trên Linux, Skills chỉ dành cho `darwin` (như `apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè cơ chế kiểm soát.

    Bạn có ba mẫu được hỗ trợ:

    **Tùy chọn A - chạy Gateway trên máy Mac (đơn giản nhất).**
    Chạy Gateway ở nơi có các binary macOS, sau đó kết nối từ Linux ở [chế độ từ xa](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Skills tải bình thường vì máy chủ Gateway là macOS.

    **Tùy chọn B - dùng một Node macOS (không SSH).**
    Chạy Gateway trên Linux, ghép nối một Node macOS (ứng dụng thanh menu), và đặt **Lệnh chạy Node** thành "Luôn hỏi" hoặc "Luôn cho phép" trên máy Mac. OpenClaw có thể xem Skills chỉ dành cho macOS là đủ điều kiện khi các binary bắt buộc tồn tại trên Node. Tác nhân chạy các Skills đó qua công cụ `nodes`. Nếu bạn chọn "Luôn hỏi", việc phê duyệt "Luôn cho phép" trong prompt sẽ thêm lệnh đó vào danh sách cho phép.

    **Tùy chọn C - proxy binary macOS qua SSH (nâng cao).**
    Giữ Gateway trên Linux, nhưng làm cho các binary CLI bắt buộc phân giải thành wrapper SSH chạy trên máy Mac. Sau đó ghi đè Skill để cho phép Linux nhằm giữ cho nó đủ điều kiện.

    1. Tạo wrapper SSH cho binary (ví dụ: `memo` cho Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Đưa wrapper vào `PATH` trên máy chủ Linux (ví dụ `~/bin/memo`).
    3. Ghi đè metadata của Skill (workspace hoặc `~/.openclaw/skills`) để cho phép Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Bắt đầu một phiên mới để ảnh chụp nhanh Skills được làm mới.

  </Accordion>

  <Accordion title="Bạn có tích hợp Notion hoặc HeyGen không?">
    Hiện chưa được tích hợp sẵn.

    Tùy chọn:

    - **Skill / Plugin tùy chỉnh:** tốt nhất cho truy cập API đáng tin cậy (Notion/HeyGen đều có API).
    - **Tự động hóa trình duyệt:** hoạt động không cần code nhưng chậm hơn và dễ hỏng hơn.

    Nếu bạn muốn giữ ngữ cảnh theo từng khách hàng (quy trình agency), một mẫu đơn giản là:

    - Một trang Notion cho mỗi khách hàng (ngữ cảnh + tùy chọn + công việc đang hoạt động).
    - Yêu cầu tác nhân lấy trang đó khi bắt đầu phiên.

    Nếu bạn muốn tích hợp gốc, hãy mở yêu cầu tính năng hoặc xây dựng Skill
    nhắm đến các API đó.

    Cài đặt Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Các bản cài đặt gốc được đưa vào thư mục `skills/` của workspace đang hoạt động. Đối với Skills dùng chung trên tất cả tác nhân cục bộ, dùng `openclaw skills install @owner/<skill-slug> --global` (hoặc đặt thủ công vào `~/.openclaw/skills/<name>/SKILL.md`). Nếu chỉ một số tác nhân nên thấy bản cài dùng chung, hãy cấu hình `agents.defaults.skills` hoặc `agents.list[].skills`. Một số Skills yêu cầu binary được cài qua Homebrew; trên Linux, điều đó nghĩa là Linuxbrew (xem mục Câu hỏi thường gặp về Homebrew Linux ở trên). Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và [ClawHub](/vi/clawhub).

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

    Đường dẫn này có thể dùng trình duyệt máy chủ cục bộ hoặc một Node trình duyệt đã kết nối. Nếu Gateway chạy ở nơi khác, hãy chạy một máy chủ Node trên máy có trình duyệt hoặc dùng CDP từ xa.

    Các giới hạn hiện tại trên `existing-session` / `user`:

    - hành động dựa trên ref, không dựa trên CSS-selector
    - tải lên yêu cầu `ref` / `inputRef` và hiện chỉ hỗ trợ một tệp mỗi lần
    - `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn cần trình duyệt được quản lý hoặc hồ sơ CDP thô

  </Accordion>
</AccordionGroup>

## Sandboxing và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu riêng về sandboxing không?">
    Có. Xem [Sandboxing](/vi/gateway/sandboxing). Đối với thiết lập riêng cho Docker (toàn bộ gateway trong Docker hoặc image sandbox), xem [Docker](/vi/install/docker).
  </Accordion>

  <Accordion title="Docker có vẻ bị giới hạn - làm sao bật đầy đủ tính năng?">
    Image mặc định ưu tiên bảo mật và chạy dưới người dùng `node`, nên nó không
    bao gồm các gói hệ thống, Homebrew, hoặc trình duyệt đi kèm. Để thiết lập đầy đủ hơn:

    - Lưu giữ `/home/node` bằng `OPENCLAW_HOME_VOLUME` để cache tồn tại.
    - Đưa dependency hệ thống vào image bằng `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Cài trình duyệt Playwright qua CLI đi kèm:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và đảm bảo đường dẫn được lưu giữ.

    Tài liệu: [Docker](/vi/install/docker), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Tôi có thể giữ DM cá nhân nhưng làm cho nhóm công khai/sandboxed với một tác nhân không?">
    Có - nếu lưu lượng riêng tư của bạn là **DMs** và lưu lượng công khai là **nhóm**.

    Dùng `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (khóa không phải main) chạy trong backend sandbox đã cấu hình, trong khi phiên DM chính vẫn ở trên máy chủ. Docker là backend mặc định nếu bạn không chọn backend nào. Sau đó giới hạn những công cụ có sẵn trong các phiên sandboxed qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập + cấu hình ví dụ: [Nhóm: DM cá nhân + nhóm công khai](/vi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Tham chiếu cấu hình chính: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Tôi gắn một thư mục máy chủ vào sandbox như thế nào?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:path:mode"]` (ví dụ, `"/home/user/src:/src:ro"`). Bind toàn cục + theo từng tác nhân được hợp nhất; bind theo từng tác nhân bị bỏ qua khi `scope: "shared"`. Dùng `:ro` cho mọi thứ nhạy cảm và nhớ rằng bind vượt qua các bức tường hệ thống tệp của sandbox.

    OpenClaw xác thực nguồn bind dựa trên cả đường dẫn đã chuẩn hóa và đường dẫn canonical được phân giải qua tổ tiên sâu nhất hiện có. Điều đó nghĩa là thoát qua symlink-parent vẫn fail closed ngay cả khi đoạn đường dẫn cuối cùng chưa tồn tại, và các kiểm tra gốc được cho phép vẫn áp dụng sau khi phân giải symlink.

    Xem [Sandboxing](/vi/gateway/sandboxing#custom-bind-mounts) và [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) để biết ví dụ và ghi chú an toàn.

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw chỉ là các tệp Markdown trong workspace của tác nhân:

    - Ghi chú hằng ngày trong `memory/YYYY-MM-DD.md`
    - Ghi chú dài hạn được tuyển chọn trong `MEMORY.md` (chỉ phiên chính/riêng tư)

    OpenClaw cũng chạy một **lần xả bộ nhớ im lặng trước Compaction** để nhắc mô hình
    ghi các ghi chú bền vững trước khi tự động Compaction. Việc này chỉ chạy khi workspace
    có thể ghi (sandbox chỉ đọc sẽ bỏ qua). Xem [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên mọi thứ. Làm sao để lưu lại lâu dài?">
    Hãy yêu cầu bot **ghi sự kiện đó vào bộ nhớ**. Ghi chú dài hạn thuộc về `MEMORY.md`,
    ngữ cảnh ngắn hạn đi vào `memory/YYYY-MM-DD.md`.

    Đây vẫn là một lĩnh vực chúng tôi đang cải thiện. Việc nhắc mô hình lưu bộ nhớ sẽ hữu ích;
    nó sẽ biết cần làm gì. Nếu nó vẫn tiếp tục quên, hãy xác minh Gateway đang dùng cùng một
    không gian làm việc trong mọi lần chạy.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có tồn tại mãi mãi không? Giới hạn là gì?">
    Các tệp bộ nhớ nằm trên đĩa và tồn tại cho đến khi bạn xóa chúng. Giới hạn là
    dung lượng lưu trữ của bạn, không phải mô hình. **Ngữ cảnh phiên** vẫn bị giới hạn
    bởi cửa sổ ngữ cảnh của mô hình, vì vậy các cuộc trò chuyện dài có thể bị compact
    hoặc cắt bớt. Đó là lý do tìm kiếm bộ nhớ tồn tại - nó chỉ kéo các phần liên quan
    trở lại ngữ cảnh.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Ngữ cảnh](/vi/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có cần khóa API OpenAI không?">
    Chỉ khi bạn dùng **OpenAI embeddings**. Codex OAuth bao phủ chat/completions và
    **không** cấp quyền truy cập embeddings, vì vậy **đăng nhập bằng Codex (OAuth hoặc
    đăng nhập Codex CLI)** không giúp ích cho tìm kiếm bộ nhớ ngữ nghĩa. OpenAI embeddings
    vẫn cần một khóa API thật (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Nếu bạn không đặt rõ nhà cung cấp, OpenClaw dùng OpenAI embeddings. Các cấu hình cũ
    vẫn ghi `memorySearch.provider = "auto"` cũng phân giải về OpenAI. Nếu không có khóa
    API OpenAI, tìm kiếm bộ nhớ ngữ nghĩa sẽ vẫn không khả dụng cho đến khi bạn cấu hình
    khóa hoặc chọn rõ một nhà cung cấp khác.

    Nếu bạn muốn giữ cục bộ, đặt `memorySearch.provider = "local"` (và tùy chọn
    `memorySearch.fallback = "none"`). Nếu bạn muốn Gemini embeddings, đặt
    `memorySearch.provider = "gemini"` và cung cấp `GEMINI_API_KEY` (hoặc
    `memorySearch.remote.apiKey`). Chúng tôi hỗ trợ các mô hình embedding **OpenAI,
    tương thích OpenAI, Gemini, Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot,
    DeepInfra, hoặc cục bộ** - xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Vị trí của mọi thứ trên đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu dùng với OpenClaw có được lưu cục bộ không?">
    Không - **trạng thái của OpenClaw là cục bộ**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho họ**.

    - **Cục bộ theo mặc định:** phiên, tệp bộ nhớ, cấu hình và không gian làm việc nằm trên máy chủ Gateway
      (`~/.openclaw` + thư mục không gian làm việc của bạn).
    - **Từ xa do cần thiết:** tin nhắn bạn gửi tới nhà cung cấp mô hình (Anthropic/OpenAI/v.v.) đi tới
      API của họ, và các nền tảng chat (WhatsApp/Telegram/Slack/v.v.) lưu dữ liệu tin nhắn trên
      máy chủ của họ.
    - **Bạn kiểm soát phạm vi dữ liệu:** dùng mô hình cục bộ giữ prompt trên máy của bạn, nhưng lưu lượng
      kênh vẫn đi qua máy chủ của kênh.

    Liên quan: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu dữ liệu ở đâu?">
    Mọi thứ nằm dưới `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                       | Mục đích                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Cấu hình chính (JSON5)                                             |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Nhập OAuth cũ (được sao chép vào hồ sơ xác thực trong lần dùng đầu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Hồ sơ xác thực (OAuth, khóa API, và `keyRef`/`tokenRef` tùy chọn)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload bí mật tùy chọn dựa trên tệp cho nhà cung cấp SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Tệp tương thích cũ (các mục `api_key` tĩnh đã được xóa sạch)       |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Trạng thái nhà cung cấp (ví dụ `whatsapp/<accountId>/creds.json`)  |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Trạng thái theo từng tác nhân (agentDir + phiên)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Lịch sử và trạng thái cuộc trò chuyện (theo từng tác nhân)         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Siêu dữ liệu phiên (theo từng tác nhân)                            |

    Đường dẫn một tác nhân cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`).

    **Không gian làm việc** của bạn (AGENTS.md, tệp bộ nhớ, skills, v.v.) tách biệt và được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên nằm ở đâu?">
    Các tệp này nằm trong **không gian làm việc của tác nhân**, không phải `~/.openclaw`.

    - **Không gian làm việc (theo từng tác nhân)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` tùy chọn.
      `memory.md` chữ thường ở thư mục gốc chỉ là đầu vào sửa chữa cũ; `openclaw doctor --fix`
      có thể hợp nhất nó vào `MEMORY.md` khi cả hai tệp tồn tại.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, trạng thái kênh/nhà cung cấp, hồ sơ xác thực, phiên, nhật ký,
      và Skills dùng chung (`~/.openclaw/skills`).

    Không gian làm việc mặc định là `~/.openclaw/workspace`, có thể cấu hình qua:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, hãy xác nhận Gateway đang dùng cùng một
    không gian làm việc trong mọi lần khởi chạy (và nhớ rằng: chế độ từ xa dùng
    không gian làm việc của **máy chủ Gateway**, không phải laptop cục bộ của bạn).

    Mẹo: nếu bạn muốn một hành vi hoặc tùy chọn bền vững, hãy yêu cầu bot **ghi nó vào
    AGENTS.md hoặc MEMORY.md** thay vì dựa vào lịch sử chat.

    Xem [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace) và [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi có thể làm SOUL.md lớn hơn không?">
    Có. `SOUL.md` là một trong các tệp khởi tạo không gian làm việc được chèn vào
    ngữ cảnh tác nhân. Giới hạn chèn mặc định theo từng tệp là `20000` ký tự,
    và ngân sách khởi tạo tổng cộng trên các tệp là `60000` ký tự.

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

    Hoặc ghi đè một tác nhân:

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

    Dùng `/context` để kiểm tra kích thước thô so với kích thước đã chèn và liệu việc cắt bớt có xảy ra hay không.
    Giữ `SOUL.md` tập trung vào giọng nói, lập trường và tính cách; đặt quy tắc vận hành
    trong `AGENTS.md` và các sự kiện bền vững trong bộ nhớ.

    Xem [Ngữ cảnh](/vi/concepts/context) và [Cấu hình tác nhân](/vi/gateway/config-agents).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **không gian làm việc của tác nhân** trong một repo git **riêng tư** và sao lưu nó ở nơi
    riêng tư (ví dụ GitHub riêng tư). Việc này lưu lại bộ nhớ + các tệp AGENTS/SOUL/USER,
    và cho phép bạn khôi phục "tâm trí" của trợ lý sau này.

    **Không** commit bất cứ thứ gì dưới `~/.openclaw` (thông tin đăng nhập, phiên, token, hoặc payload bí mật đã mã hóa).
    Nếu bạn cần khôi phục đầy đủ, hãy sao lưu cả không gian làm việc và thư mục trạng thái
    riêng biệt (xem câu hỏi di chuyển ở trên).

    Tài liệu: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm sao để gỡ cài đặt hoàn toàn OpenClaw?">
    Xem hướng dẫn riêng: [Gỡ cài đặt](/vi/install/uninstall).
  </Accordion>

  <Accordion title="Tác nhân có thể làm việc bên ngoài không gian làm việc không?">
    Có. Không gian làm việc là **cwd mặc định** và neo bộ nhớ, không phải sandbox cứng.
    Đường dẫn tương đối phân giải bên trong không gian làm việc, nhưng đường dẫn tuyệt đối có thể truy cập các
    vị trí khác trên máy chủ trừ khi sandboxing được bật. Nếu bạn cần cô lập, hãy dùng
    [`agents.defaults.sandbox`](/vi/gateway/sandboxing) hoặc thiết lập sandbox theo từng tác nhân. Nếu bạn
    muốn một repo là thư mục làm việc mặc định, hãy trỏ `workspace` của tác nhân đó
    tới gốc repo. Repo OpenClaw chỉ là mã nguồn; hãy giữ không gian làm việc tách biệt
    trừ khi bạn cố ý muốn tác nhân làm việc bên trong đó.

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
    Trạng thái phiên thuộc sở hữu của **máy chủ Gateway**. Nếu bạn đang ở chế độ từ xa, kho phiên bạn quan tâm nằm trên máy từ xa, không phải laptop cục bộ của bạn. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>
</AccordionGroup>

## Cơ bản về cấu hình

<AccordionGroup>
  <Accordion title="Cấu hình có định dạng gì? Nó nằm ở đâu?">
    OpenClaw đọc cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Nếu thiếu tệp, nó dùng các mặc định tương đối an toàn (bao gồm không gian làm việc mặc định là `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Tôi đặt gateway.bind: "lan" (hoặc "tailnet") và giờ không có gì lắng nghe / UI báo không được ủy quyền'>
    Các bind không phải loopback **yêu cầu một đường dẫn xác thực gateway hợp lệ**. Trên thực tế, điều đó nghĩa là:

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
    - Các đường gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm dự phòng khi `gateway.auth.*` chưa được đặt.
    - Với xác thực mật khẩu, hãy đặt `gateway.auth.mode: "password"` cùng với `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`) thay thế.
    - Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ qua SecretRef và không phân giải được, quá trình phân giải sẽ fail closed (không bị dự phòng từ xa che khuất).
    - Thiết lập Control UI shared-secret xác thực qua `connect.params.auth.token` hoặc `connect.params.auth.password` (được lưu trong cài đặt app/UI). Các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy` dùng header yêu cầu thay thế. Tránh đặt shared secret trong URL.
    - Với `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback cùng máy chủ yêu cầu `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng và một mục loopback trong `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Tại sao giờ tôi cần token trên localhost?">
    OpenClaw thực thi xác thực gateway theo mặc định, bao gồm loopback. Trong đường dẫn mặc định thông thường, điều đó nghĩa là xác thực token: nếu không có đường dẫn xác thực rõ ràng nào được cấu hình, khởi động gateway sẽ phân giải sang chế độ token và tạo token chỉ dùng trong runtime cho lần khởi động đó, vì vậy **client WS cục bộ phải xác thực**. Cấu hình rõ `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, hoặc `OPENCLAW_GATEWAY_PASSWORD` khi client cần một bí mật ổn định qua các lần khởi động lại. Điều này chặn các tiến trình cục bộ khác gọi Gateway.

    Nếu bạn muốn dùng một đường dẫn xác thực khác, bạn có thể chọn rõ chế độ mật khẩu (hoặc, với reverse proxy nhận biết danh tính, `trusted-proxy`). Nếu bạn **thực sự** muốn mở loopback, hãy đặt rõ `gateway.auth.mode: "none"` trong cấu hình. Doctor có thể tạo token cho bạn bất cứ lúc nào: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi thay đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ tải lại nóng:

    - `gateway.reload.mode: "hybrid"` (mặc định): áp dụng nóng các thay đổi an toàn, khởi động lại với các thay đổi quan trọng
    - `hot`, `restart`, `off` cũng được hỗ trợ

  </Accordion>

  <Accordion title="Làm thế nào để tắt các khẩu hiệu CLI hài hước?">
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

    - `off`: ẩn văn bản khẩu hiệu nhưng vẫn giữ dòng tiêu đề/phiên bản của banner.
    - `default`: luôn dùng `All your chats, one OpenClaw.`.
    - `random`: xoay vòng các khẩu hiệu hài hước/theo mùa (hành vi mặc định).
    - Nếu bạn không muốn có banner nào, đặt env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm thế nào để bật tìm kiếm web (và tải web)?">
    `web_fetch` hoạt động không cần khóa API. `web_search` phụ thuộc vào nhà cung cấp
    bạn đã chọn:

    - Các nhà cung cấp dựa trên API như Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity và Tavily yêu cầu thiết lập khóa API thông thường của họ.
    - Grok có thể dùng lại OAuth xAI từ xác thực mô hình, hoặc dùng dự phòng `XAI_API_KEY` / cấu hình web-search của Plugin.
    - Ollama Web Search không cần khóa, nhưng dùng máy chủ Ollama đã cấu hình của bạn và yêu cầu `ollama signin`.
    - DuckDuckGo không cần khóa, nhưng là tích hợp không chính thức dựa trên HTML.
    - SearXNG không cần khóa/tự lưu trữ; cấu hình `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Khuyến nghị:** chạy `openclaw configure --section web` và chọn một nhà cung cấp.
    Các lựa chọn thay thế bằng môi trường:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: OAuth xAI, `XAI_API_KEY`
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

    Cấu hình web-search riêng theo nhà cung cấp hiện nằm trong `plugins.entries.<plugin>.config.webSearch.*`.
    Các đường dẫn nhà cung cấp cũ `tools.web.search.*` vẫn được tải tạm thời để tương thích, nhưng không nên dùng cho cấu hình mới.
    Cấu hình dự phòng web-fetch của Firecrawl nằm trong `plugins.entries.firecrawl.config.webFetch.*`.

    Ghi chú:

    - Nếu bạn dùng allowlist, hãy thêm `web_search`/`web_fetch`/`x_search` hoặc `group:web`.
    - `web_fetch` được bật theo mặc định (trừ khi bị tắt rõ ràng).
    - Nếu bỏ qua `tools.web.fetch.provider`, OpenClaw tự động phát hiện nhà cung cấp dự phòng fetch sẵn sàng đầu tiên từ các thông tin xác thực có sẵn. Plugin Firecrawl chính thức cung cấp dự phòng đó.
    - Daemon đọc biến env từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Công cụ web](/vi/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa sạch cấu hình của tôi. Làm thế nào để khôi phục và tránh việc này?">
    `config.apply` thay thế **toàn bộ cấu hình**. Nếu bạn gửi một đối tượng một phần, mọi thứ
    khác sẽ bị xóa.

    OpenClaw hiện tại bảo vệ khỏi nhiều lần ghi đè vô tình:

    - Các lần ghi cấu hình thuộc OpenClaw xác thực toàn bộ cấu hình sau thay đổi trước khi ghi.
    - Các lần ghi không hợp lệ hoặc có tính phá hủy thuộc OpenClaw bị từ chối và được lưu dưới dạng `openclaw.json.rejected.*`.
    - Nếu một chỉnh sửa trực tiếp làm hỏng quá trình khởi động hoặc tải lại nóng, Gateway sẽ đóng an toàn hoặc bỏ qua lần tải lại; nó không ghi lại `openclaw.json`.
    - `openclaw doctor --fix` sở hữu việc sửa chữa và có thể khôi phục bản tốt cuối cùng đã biết, đồng thời lưu tệp bị từ chối dưới dạng `openclaw.json.clobbered.*`.

    Khôi phục:

    - Kiểm tra `openclaw logs --follow` để tìm `Invalid config at`, `Config write rejected:`, hoặc `config reload skipped (invalid config)`.
    - Kiểm tra `openclaw.json.clobbered.*` hoặc `openclaw.json.rejected.*` mới nhất bên cạnh cấu hình đang hoạt động.
    - Chạy `openclaw config validate` và `openclaw doctor --fix`.
    - Chỉ sao chép lại các khóa mong muốn bằng `openclaw config set` hoặc `config.patch`.
    - Nếu bạn không có bản tốt cuối cùng đã biết hoặc payload bị từ chối, hãy khôi phục từ bản sao lưu, hoặc chạy lại `openclaw doctor` và cấu hình lại các kênh/mô hình.
    - Nếu việc này ngoài dự kiến, hãy báo lỗi và đính kèm cấu hình cuối cùng bạn biết hoặc bất kỳ bản sao lưu nào.
    - Một tác nhân lập trình cục bộ thường có thể tái dựng một cấu hình hoạt động từ nhật ký hoặc lịch sử.

    Tránh việc này:

    - Dùng `openclaw config set` cho các thay đổi nhỏ.
    - Dùng `openclaw configure` cho chỉnh sửa tương tác.
    - Dùng `config.schema.lookup` trước khi bạn không chắc về đường dẫn chính xác hoặc hình dạng trường; nó trả về một nút schema nông cùng các tóm tắt con trực tiếp để đào sâu.
    - Dùng `config.patch` cho các chỉnh sửa RPC một phần; chỉ dùng `config.apply` để thay thế toàn bộ cấu hình.
    - Nếu bạn đang dùng công cụ `gateway` hướng tới tác nhân từ một lần chạy tác nhân, nó vẫn sẽ từ chối ghi vào `tools.exec.ask` / `tools.exec.security` (bao gồm các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ).

    Tài liệu: [Cấu hình](/vi/cli/config), [Cấu hình tương tác](/vi/cli/configure), [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Làm thế nào để chạy một Gateway trung tâm với các worker chuyên biệt trên nhiều thiết bị?">
    Mẫu phổ biến là **một Gateway** (ví dụ Raspberry Pi) cộng với **node** và **tác nhân**:

    - **Gateway (trung tâm):** sở hữu các kênh (Signal/WhatsApp), định tuyến và phiên.
    - **Node (thiết bị):** Mac/iOS/Android kết nối như ngoại vi và phơi bày các công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Tác nhân (worker):** các bộ não/không gian làm việc riêng cho vai trò đặc biệt (ví dụ "Hetzner ops", "Personal data").
    - **Tác nhân phụ:** tạo công việc nền từ tác nhân chính khi bạn muốn song song hóa.
    - **TUI:** kết nối tới Gateway và chuyển đổi tác nhân/phiên.

    Tài liệu: [Node](/vi/nodes), [Truy cập từ xa](/vi/gateway/remote), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [Tác nhân phụ](/vi/tools/subagents), [TUI](/vi/web/tui).

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

    Mặc định là `false` (headful). Headless có khả năng kích hoạt kiểm tra chống bot trên một số trang cao hơn. Xem [Trình duyệt](/vi/tools/browser).

    Headless dùng **cùng engine Chromium** và hoạt động cho hầu hết tác vụ tự động hóa (biểu mẫu, nhấp chuột, scraping, đăng nhập). Các khác biệt chính:

    - Không có cửa sổ trình duyệt hiển thị (dùng ảnh chụp màn hình nếu bạn cần hình ảnh).
    - Một số trang nghiêm ngặt hơn với tự động hóa ở chế độ headless (CAPTCHA, chống bot).
      Ví dụ, X/Twitter thường chặn phiên headless.

  </Accordion>

  <Accordion title="Làm thế nào để dùng Brave để điều khiển trình duyệt?">
    Đặt `browser.executablePath` thành binary Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) và khởi động lại Gateway.
    Xem các ví dụ cấu hình đầy đủ trong [Trình duyệt](/vi/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway và node từ xa

<AccordionGroup>
  <Accordion title="Lệnh lan truyền giữa Telegram, gateway và node như thế nào?">
    Tin nhắn Telegram được **gateway** xử lý. Gateway chạy tác nhân và
    chỉ sau đó mới gọi node qua **Gateway WebSocket** khi cần công cụ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node không thấy lưu lượng nhà cung cấp đi vào; chúng chỉ nhận các lệnh gọi RPC node.

  </Accordion>

  <Accordion title="Tác nhân của tôi có thể truy cập máy tính của tôi như thế nào nếu Gateway được lưu trữ từ xa?">
    Trả lời ngắn gọn: **ghép đôi máy tính của bạn như một node**. Gateway chạy ở nơi khác, nhưng nó có thể
    gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    Thiết lập điển hình:

    1. Chạy Gateway trên máy chủ luôn bật (VPS/máy chủ tại nhà).
    2. Đưa máy chủ Gateway + máy tính của bạn vào cùng tailnet.
    3. Đảm bảo Gateway WS có thể truy cập được (bind tailnet hoặc SSH tunnel).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Remote over SSH** (hoặc tailnet trực tiếp)
       để nó có thể đăng ký làm node.
    5. Phê duyệt node trên Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu nối TCP riêng; node kết nối qua Gateway WebSocket.

    Nhắc nhở bảo mật: ghép đôi một node macOS cho phép `system.run` trên máy đó. Chỉ
    ghép đôi thiết bị bạn tin tưởng và xem lại [Bảo mật](/vi/gateway/security).

    Tài liệu: [Node](/vi/nodes), [Giao thức Gateway](/vi/gateway/protocol), [Chế độ từ xa macOS](/vi/platforms/mac/remote), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Làm gì tiếp?">
    Kiểm tra các phần cơ bản:

    - Gateway đang chạy: `openclaw gateway status`
    - Tình trạng Gateway: `openclaw status`
    - Tình trạng kênh: `openclaw channels status`

    Sau đó xác minh xác thực và định tuyến:

    - Nếu bạn dùng Tailscale Serve, hãy chắc rằng `gateway.auth.allowTailscale` được đặt đúng.
    - Nếu bạn kết nối qua SSH tunnel, xác nhận tunnel cục bộ đang hoạt động và trỏ tới đúng cổng.
    - Xác nhận allowlist của bạn (DM hoặc nhóm) bao gồm tài khoản của bạn.

    Tài liệu: [Tailscale](/vi/gateway/tailscale), [Truy cập từ xa](/vi/gateway/remote), [Kênh](/vi/channels).

  </Accordion>

  <Accordion title="Hai phiên bản OpenClaw có thể nói chuyện với nhau không (cục bộ + VPS)?">
    Có. Không có cầu nối "bot-to-bot" tích hợp sẵn, nhưng bạn có thể nối chúng theo vài
    cách đáng tin cậy:

    **Đơn giản nhất:** dùng một kênh chat thông thường mà cả hai bot đều có thể truy cập (Telegram/Slack/WhatsApp).
    Cho Bot A gửi tin nhắn tới Bot B, rồi để Bot B trả lời như bình thường.

    **Cầu nối CLI (chung):** chạy một script gọi Gateway còn lại bằng
    `openclaw agent --message ... --deliver`, nhắm tới một chat nơi bot kia
    lắng nghe. Nếu một bot ở VPS từ xa, trỏ CLI của bạn tới Gateway từ xa đó
    qua SSH/Tailscale (xem [Truy cập từ xa](/vi/gateway/remote)).

    Mẫu ví dụ (chạy từ một máy có thể truy cập Gateway đích):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Mẹo: thêm một rào chắn để hai bot không lặp vô tận (chỉ trả lời khi được nhắc tên, allowlist
    kênh, hoặc quy tắc "không trả lời tin nhắn bot").

    Tài liệu: [Truy cập từ xa](/vi/gateway/remote), [CLI tác nhân](/vi/cli/agent), [Gửi bằng tác nhân](/vi/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần VPS riêng cho nhiều tác nhân không?">
    Không. Một Gateway có thể lưu trữ nhiều tác nhân, mỗi tác nhân có không gian làm việc, mặc định mô hình,
    và định tuyến riêng. Đó là thiết lập bình thường và rẻ hơn, đơn giản hơn nhiều so với việc chạy
    một VPS cho mỗi tác nhân.

    Chỉ dùng VPS riêng khi bạn cần cô lập cứng (ranh giới bảo mật) hoặc các
    cấu hình rất khác nhau mà bạn không muốn chia sẻ. Nếu không, hãy giữ một Gateway và
    dùng nhiều tác nhân hoặc tác nhân phụ.

  </Accordion>

  <Accordion title="Có lợi ích gì khi dùng một node trên laptop cá nhân của tôi thay vì SSH từ VPS không?">
    Có - node là cách hạng nhất để truy cập laptop của bạn từ một Gateway từ xa, và chúng
    mở khóa nhiều thứ hơn quyền truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và
    nhẹ (một VPS nhỏ hoặc máy cỡ Raspberry Pi là ổn; 4 GB RAM là dư dả), vì vậy một thiết lập phổ biến
    là một máy chủ luôn bật cộng với laptop của bạn làm node.

    - **Không cần SSH inbound.** Node kết nối ra Gateway WebSocket và dùng ghép cặp thiết bị.
    - **Kiểm soát thực thi an toàn hơn.** `system.run` được kiểm soát bằng danh sách cho phép/phê duyệt node trên laptop đó.
    - **Nhiều công cụ thiết bị hơn.** Node cung cấp `canvas`, `camera`, và `screen` ngoài `system.run`.
    - **Tự động hóa trình duyệt cục bộ.** Giữ Gateway trên VPS, nhưng chạy Chrome cục bộ qua một máy chủ node trên laptop, hoặc gắn vào Chrome cục bộ trên máy chủ qua Chrome MCP.

    SSH phù hợp cho quyền truy cập shell nhất thời, nhưng node đơn giản hơn cho các workflow agent đang chạy liên tục và
    tự động hóa thiết bị.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Node có chạy dịch vụ gateway không?">
    Không. Chỉ nên chạy **một gateway** trên mỗi máy chủ trừ khi bạn cố ý chạy các hồ sơ tách biệt (xem [Nhiều gateway](/vi/gateway/multiple-gateways)). Node là thiết bị ngoại vi kết nối
    tới gateway (node iOS/Android, hoặc "chế độ node" macOS trong ứng dụng thanh menu). Với máy chủ node
    không có giao diện và điều khiển CLI, xem [CLI máy chủ Node](/vi/cli/node).

    Cần khởi động lại đầy đủ cho các thay đổi về `gateway`, `discovery`, và bề mặt plugin được lưu trữ.

  </Accordion>

  <Accordion title="Có cách API / RPC để áp dụng cấu hình không?">
    Có.

    - `config.schema.lookup`: kiểm tra một cây con cấu hình với node schema nông của nó, gợi ý UI khớp, và tóm tắt con trực tiếp trước khi ghi
    - `config.get`: lấy snapshot hiện tại + hash
    - `config.patch`: cập nhật một phần an toàn (ưu tiên cho hầu hết chỉnh sửa RPC); tải nóng khi có thể và khởi động lại khi cần
    - `config.apply`: xác thực + thay thế toàn bộ cấu hình; tải nóng khi có thể và khởi động lại khi cần
    - Công cụ runtime `gateway` dành cho agent vẫn từ chối ghi lại `tools.exec.ask` / `tools.exec.security`; các alias cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ

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

  <Accordion title="Làm cách nào để thiết lập Tailscale trên VPS và kết nối từ Mac của tôi?">
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

    Nếu bạn muốn Control UI mà không cần SSH, dùng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cách này giữ gateway được bind vào loopback và cung cấp HTTPS qua Tailscale. Xem [Tailscale](/vi/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm cách nào để kết nối node Mac tới Gateway từ xa (Tailscale Serve)?">
    Serve cung cấp **Gateway Control UI + WS**. Node kết nối qua cùng endpoint Gateway WS.

    Thiết lập khuyến nghị:

    1. **Đảm bảo VPS + Mac ở trên cùng tailnet**.
    2. **Dùng ứng dụng macOS ở chế độ Remote** (đích SSH có thể là hostname tailnet).
       Ứng dụng sẽ tạo tunnel cho cổng Gateway và kết nối như một node.
    3. **Phê duyệt node** trên gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Giao thức Gateway](/vi/gateway/protocol), [Khám phá](/vi/gateway/discovery), [Chế độ từ xa macOS](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài đặt trên laptop thứ hai hay chỉ thêm một node?">
    Nếu bạn chỉ cần **công cụ cục bộ** (screen/camera/exec) trên laptop thứ hai, hãy thêm nó làm
    **node**. Cách này giữ một Gateway duy nhất và tránh cấu hình trùng lặp. Các công cụ node cục bộ
    hiện chỉ hỗ trợ macOS, nhưng chúng tôi dự định mở rộng sang các OS khác.

    Chỉ cài đặt Gateway thứ hai khi bạn cần **cách ly cứng** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Biến môi trường và tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải biến môi trường như thế nào?">
    OpenClaw đọc biến môi trường từ tiến trình cha (shell, launchd/systemd, CI, v.v.) và còn tải thêm:

    - `.env` từ thư mục làm việc hiện tại
    - `.env` dự phòng toàn cục từ `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`)

    Không tệp `.env` nào ghi đè các biến môi trường hiện có.
    Biến thông tin xác thực nhà cung cấp là ngoại lệ với `.env` workspace: các khóa như
    `GEMINI_API_KEY`, `XAI_API_KEY`, hoặc `MISTRAL_API_KEY` bị bỏ qua trong `.env`
    workspace và nên nằm trong môi trường tiến trình, `~/.openclaw/.env`, hoặc cấu hình `env`.

    Bạn cũng có thể định nghĩa biến môi trường inline trong cấu hình (chỉ áp dụng nếu thiếu trong môi trường tiến trình):

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
    Hai cách sửa phổ biến:

    1. Đặt các khóa bị thiếu vào `~/.openclaw/.env` để chúng được nhận ngay cả khi dịch vụ không kế thừa môi trường shell của bạn.
    2. Bật nhập từ shell (tiện ích chọn tham gia):

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

    Cách này chạy login shell của bạn và chỉ nhập các khóa dự kiến đang thiếu (không bao giờ ghi đè). Các biến môi trường tương đương:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái model hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` báo cáo liệu **nhập env từ shell** có được bật hay không. "Shell env: off"
    **không** có nghĩa là các biến môi trường của bạn bị thiếu - nó chỉ có nghĩa là OpenClaw sẽ không tự động tải
    login shell của bạn.

    Nếu Gateway chạy như một dịch vụ (launchd/systemd), nó sẽ không kế thừa môi trường
    shell của bạn. Sửa bằng một trong các cách sau:

    1. Đặt token vào `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Hoặc bật nhập từ shell (`env.shellEnv.enabled: true`).
    3. Hoặc thêm nó vào khối `env` trong cấu hình của bạn (chỉ áp dụng nếu thiếu).

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
    Phiên có thể hết hạn sau `session.idleMinutes`, nhưng tính năng này **mặc định bị tắt** (mặc định **0**).
    Đặt nó thành một giá trị dương để bật hết hạn khi nhàn rỗi. Khi được bật, tin nhắn **tiếp theo**
    sau khoảng thời gian nhàn rỗi sẽ bắt đầu một id phiên mới cho khóa chat đó.
    Điều này không xóa transcript - nó chỉ bắt đầu một phiên mới.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Có cách nào để tạo một đội các instance OpenClaw (một CEO và nhiều agent) không?">
    Có, thông qua **định tuyến đa agent** và **sub-agent**. Bạn có thể tạo một agent điều phối
    và nhiều agent worker với workspace và model riêng.

    Dù vậy, tốt nhất nên xem đây là một **thử nghiệm thú vị**. Nó tốn nhiều token và thường
    kém hiệu quả hơn so với dùng một bot với các phiên riêng. Mô hình điển hình mà chúng tôi
    hình dung là một bot mà bạn trò chuyện cùng, với các phiên khác nhau cho công việc song song. Bot đó
    cũng có thể spawn sub-agent khi cần.

    Tài liệu: [Định tuyến đa agent](/vi/concepts/multi-agent), [Sub-agent](/vi/tools/subagents), [CLI Agent](/vi/cli/agents).

  </Accordion>

  <Accordion title="Tại sao ngữ cảnh bị cắt giữa tác vụ? Làm cách nào để ngăn điều đó?">
    Ngữ cảnh phiên bị giới hạn bởi cửa sổ model. Chat dài, output công cụ lớn, hoặc nhiều
    tệp có thể kích hoạt Compaction hoặc cắt bớt.

    Những điều hữu ích:

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một tệp.
    - Dùng `/compact` trước các tác vụ dài, và `/new` khi chuyển chủ đề.
    - Giữ ngữ cảnh quan trọng trong workspace và yêu cầu bot đọc lại.
    - Dùng sub-agent cho công việc dài hoặc song song để chat chính nhỏ hơn.
    - Chọn model có cửa sổ ngữ cảnh lớn hơn nếu điều này xảy ra thường xuyên.

  </Accordion>

  <Accordion title="Làm cách nào để đặt lại OpenClaw hoàn toàn nhưng vẫn giữ cài đặt?">
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

    - Onboarding cũng cung cấp **Reset** nếu thấy cấu hình hiện có. Xem [Onboarding (CLI)](/vi/start/wizard).
    - Nếu bạn đã dùng hồ sơ (`--profile` / `OPENCLAW_PROFILE`), hãy đặt lại từng thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (chỉ dành cho dev; xóa cấu hình dev + thông tin xác thực + phiên + workspace).

  </Accordion>

  <Accordion title='Tôi gặp lỗi "context too large" - làm cách nào để reset hoặc compact?'>
    Dùng một trong các cách sau:

    - **Compact** (giữ cuộc trò chuyện nhưng tóm tắt các lượt cũ hơn):

      ```
      /compact
      ```

      hoặc `/compact <instructions>` để hướng dẫn bản tóm tắt.

    - **Reset** (ID phiên mới cho cùng khóa chat):

      ```
      /new
      /reset
      ```

    Nếu điều này tiếp tục xảy ra:

    - Bật hoặc tinh chỉnh **cắt tỉa phiên** (`agents.defaults.contextPruning`) để cắt bớt output công cụ cũ.
    - Dùng model có cửa sổ ngữ cảnh lớn hơn.

    Tài liệu: [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning), [Quản lý phiên](/vi/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "LLM request rejected: messages.content.tool_use.input field required"?'>
    Đây là lỗi xác thực của nhà cung cấp: model đã phát ra khối `tool_use` mà không có
    `input` bắt buộc. Điều này thường có nghĩa là lịch sử phiên đã cũ hoặc bị hỏng (thường sau các thread dài
    hoặc thay đổi công cụ/schema).

    Cách sửa: bắt đầu một phiên mới bằng `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được thông báo Heartbeat mỗi 30 phút?">
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

    Nếu `HEARTBEAT.md` tồn tại nhưng về thực chất là rỗng (chỉ có dòng trống,
    chú thích Markdown/HTML, tiêu đề Markdown như `# Heading`, dấu đánh dấu khối mã,
    hoặc các mục checklist trống), OpenClaw bỏ qua lượt chạy Heartbeat để tiết kiệm lệnh gọi API.
    Nếu thiếu tệp này, Heartbeat vẫn chạy và mô hình quyết định cần làm gì.

    Ghi đè theo từng agent dùng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm một "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **chính tài khoản của bạn**, nên nếu bạn ở trong nhóm, OpenClaw có thể thấy nhóm đó.
    Theo mặc định, phản hồi trong nhóm bị chặn cho đến khi bạn cho phép người gửi (`groupPolicy: "allowlist"`).

    Nếu bạn chỉ muốn **bạn** có thể kích hoạt phản hồi trong nhóm:

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
    Tùy chọn 1 (nhanh nhất): theo dõi nhật ký và gửi một tin nhắn thử trong nhóm:

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, ví dụ:
    `1234567890-1234567890@g.us`.

    Tùy chọn 2 (nếu đã cấu hình/đưa vào allowlist): liệt kê nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Directory](/vi/cli/directory), [Logs](/vi/cli/logs).

  </Accordion>

  <Accordion title="Vì sao OpenClaw không trả lời trong nhóm?">
    Hai nguyên nhân thường gặp:

    - Chặn theo lượt nhắc đang bật (mặc định). Bạn phải @nhắc bot (hoặc khớp `mentionPatterns`).
    - Bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm chưa được đưa vào allowlist.

    Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).

  </Accordion>

  <Accordion title="Nhóm/luồng có dùng chung ngữ cảnh với DM không?">
    Theo mặc định, cuộc trò chuyện trực tiếp được gộp vào phiên chính. Nhóm/kênh có khóa phiên riêng, còn chủ đề Telegram / luồng Discord là các phiên riêng. Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu workspace và agent?">
    Không có giới hạn cứng. Hàng chục (thậm chí hàng trăm) đều ổn, nhưng hãy chú ý:

    - **Dung lượng đĩa tăng:** phiên + bản ghi nằm trong `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token:** nhiều agent hơn nghĩa là nhiều lượt dùng mô hình đồng thời hơn.
    - **Chi phí vận hành:** hồ sơ xác thực, workspace và định tuyến kênh theo từng agent.

    Mẹo:

    - Giữ một workspace **đang hoạt động** cho mỗi agent (`agents.defaults.workspace`).
    - Dọn các phiên cũ (xóa JSONL hoặc mục lưu trữ) nếu dung lượng đĩa tăng.
    - Dùng `openclaw doctor` để phát hiện workspace lạc và hồ sơ không khớp.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều bot hoặc cuộc trò chuyện cùng lúc (Slack) không, và nên thiết lập như thế nào?">
    Có. Dùng **Định tuyến Đa Agent** để chạy nhiều agent cô lập và định tuyến tin nhắn đến theo
    kênh/tài khoản/peer. Slack được hỗ trợ dưới dạng kênh và có thể được gắn với các agent cụ thể.

    Quyền truy cập trình duyệt rất mạnh, nhưng không phải là "làm được mọi thứ con người có thể làm" - cơ chế chống bot, CAPTCHA và MFA
    vẫn có thể chặn tự động hóa. Để điều khiển trình duyệt đáng tin cậy nhất, hãy dùng Chrome MCP cục bộ trên máy chủ,
    hoặc dùng CDP trên máy thực sự chạy trình duyệt.

    Thiết lập khuyến nghị:

    - Máy chủ Gateway luôn bật (VPS/Mac mini).
    - Một agent cho mỗi vai trò (binding).
    - Kênh Slack được gắn với các agent đó.
    - Trình duyệt cục bộ qua Chrome MCP hoặc một node khi cần.

    Tài liệu: [Định tuyến Đa Agent](/vi/concepts/multi-agent), [Slack](/vi/channels/slack),
    [Trình duyệt](/vi/tools/browser), [Node](/vi/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình, chuyển dự phòng và hồ sơ xác thực

Hỏi đáp về mô hình — mặc định, lựa chọn, bí danh, chuyển đổi, chuyển dự phòng, hồ sơ xác thực —
nằm trong [FAQ về Mô hình](/vi/help/faq-models).

## Gateway: cổng, "đã chạy", và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway dùng cổng nào?">
    `gateway.port` điều khiển cổng ghép kênh duy nhất cho WebSocket + HTTP (Control UI, hook, v.v.).

    Thứ tự ưu tiên:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Vì sao openclaw gateway status báo "Runtime: running" nhưng "Connectivity probe: failed"?'>
    Vì "running" là góc nhìn của **supervisor** (launchd/systemd/schtasks). Kiểm tra kết nối là CLI thực sự kết nối tới WebSocket của Gateway.

    Dùng `openclaw gateway status` và tin các dòng này:

    - `Probe target:` (URL mà phép kiểm tra thực sự đã dùng)
    - `Listening:` (thứ thực sự đang được bind trên cổng)
    - `Last gateway error:` (nguyên nhân gốc thường gặp khi tiến trình còn sống nhưng cổng không lắng nghe)

  </Accordion>

  <Accordion title='Vì sao openclaw gateway status hiển thị "Config (cli)" và "Config (service)" khác nhau?'>
    Bạn đang chỉnh một tệp cấu hình trong khi dịch vụ đang chạy một tệp khác (thường là lệch `--profile` / `OPENCLAW_STATE_DIR`).

    Cách sửa:

    ```bash
    openclaw gateway install --force
    ```

    Chạy lệnh đó từ cùng `--profile` / môi trường mà bạn muốn dịch vụ sử dụng.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" nghĩa là gì?'>
    OpenClaw áp đặt khóa runtime bằng cách bind trình nghe WebSocket ngay khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu bind thất bại với `EADDRINUSE`, nó ném `GatewayLockError` cho biết một phiên bản khác đã đang lắng nghe.

    Cách sửa: dừng phiên bản kia, giải phóng cổng, hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm cách nào để chạy OpenClaw ở chế độ từ xa (client kết nối tới Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và trỏ tới URL WebSocket từ xa, tùy chọn kèm thông tin xác thực từ xa bằng shared secret:

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

  <Accordion title='Control UI báo "unauthorized" (hoặc liên tục kết nối lại). Giờ phải làm gì?'>
    Đường dẫn xác thực Gateway của bạn và phương thức xác thực của UI không khớp.

    Sự thật (từ mã):

    - Control UI giữ token trong `sessionStorage` cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn, nên làm mới cùng tab vẫn hoạt động mà không khôi phục lưu trữ token dài hạn trong localStorage.
    - Khi `AUTH_TOKEN_MISMATCH`, client đáng tin cậy có thể thử lại một lần có giới hạn bằng token thiết bị đã lưu trong cache khi Gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Lần thử lại bằng token trong cache đó hiện tái sử dụng các scope đã phê duyệt trong cache được lưu cùng token thiết bị. Caller dùng `deviceToken` rõ ràng / `scopes` rõ ràng vẫn giữ tập scope đã yêu cầu thay vì kế thừa scope trong cache.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token/password dùng chung rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
    - Bootstrap bằng mã thiết lập tích hợp trả về token thiết bị node với `scopes: []` cộng với token bàn giao operator có giới hạn cho quá trình onboarding di động đáng tin cậy. Bàn giao operator có thể đọc cấu hình gốc tại thời điểm thiết lập nhưng không cấp scope thay đổi ghép đôi hoặc `operator.admin`.

    Cách sửa:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL dashboard, cố mở; hiển thị gợi ý SSH nếu chạy headless).
    - Nếu bạn chưa có token: `openclaw doctor --generate-gateway-token`.
    - Nếu từ xa, tạo tunnel trước: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`.
    - Chế độ shared secret: đặt `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, rồi dán secret khớp vào cài đặt Control UI.
    - Chế độ Tailscale Serve: đảm bảo `gateway.auth.allowTailscale` được bật và bạn đang mở URL Serve, không phải URL loopback/tailnet thô bỏ qua header danh tính Tailscale.
    - Chế độ proxy đáng tin cậy: đảm bảo bạn đi qua proxy nhận biết danh tính đã cấu hình, không phải URL Gateway thô. Proxy loopback cùng máy cũng cần `gateway.auth.trustedProxy.allowLoopback = true`.
    - Nếu không khớp vẫn còn sau một lần thử lại, xoay/phê duyệt lại token thiết bị đã ghép đôi:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Nếu lệnh xoay đó báo bị từ chối, hãy kiểm tra hai điều:
      - phiên thiết bị đã ghép đôi chỉ có thể xoay thiết bị **của chính nó** trừ khi chúng cũng có `operator.admin`
      - giá trị `--scope` rõ ràng không được vượt quá scope operator hiện tại của caller
    - Vẫn kẹt? Chạy `openclaw status --all` và làm theo [Khắc phục sự cố](/vi/gateway/troubleshooting). Xem [Dashboard](/vi/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đặt gateway.bind là tailnet nhưng không thể bind và không có gì lắng nghe">
    Bind `tailnet` chọn một IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không ở trên Tailscale (hoặc giao diện đang tắt), sẽ không có gì để bind.

    Cách sửa:

    - Khởi động Tailscale trên máy chủ đó (để nó có địa chỉ 100.x), hoặc
    - Chuyển sang `gateway.bind: "loopback"` / `"lan"`.

    Lưu ý: `tailnet` là rõ ràng. `auto` ưu tiên loopback; dùng `gateway.bind: "tailnet"` khi bạn muốn bind chỉ dành cho tailnet.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng một máy chủ không?">
    Thường là không - một Gateway có thể chạy nhiều kênh nhắn tin và agent. Chỉ dùng nhiều Gateway khi bạn cần dự phòng (ví dụ: bot cứu hộ) hoặc cô lập cứng.

    Có, nhưng bạn phải cô lập:

    - `OPENCLAW_CONFIG_PATH` (cấu hình theo từng phiên bản)
    - `OPENCLAW_STATE_DIR` (trạng thái theo từng phiên bản)
    - `agents.defaults.workspace` (cô lập workspace)
    - `gateway.port` (cổng duy nhất)

    Thiết lập nhanh (khuyến nghị):

    - Dùng `openclaw --profile <name> ...` cho mỗi phiên bản (tự tạo `~/.openclaw-<name>`).
    - Đặt `gateway.port` duy nhất trong cấu hình của từng hồ sơ (hoặc truyền `--port` cho lượt chạy thủ công).
    - Cài dịch vụ theo từng hồ sơ: `openclaw --profile <name> gateway install`.

    Hồ sơ cũng thêm hậu tố cho tên dịch vụ (`ai.openclaw.<profile>`; cũ: `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Hướng dẫn đầy đủ: [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / mã 1008 nghĩa là gì?'>
    Gateway là một **máy chủ WebSocket**, và nó kỳ vọng tin nhắn đầu tiên
    là một frame `connect`. Nếu nhận bất kỳ thứ gì khác, nó đóng kết nối
    với **mã 1008** (vi phạm chính sách).

    Nguyên nhân thường gặp:

    - Bạn mở URL **HTTP** trong trình duyệt (`http://...`) thay vì một client WS.
    - Bạn dùng sai cổng hoặc đường dẫn.
    - Một proxy hoặc tunnel đã loại bỏ header xác thực hoặc gửi yêu cầu không phải Gateway.

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

## Ghi nhật ký và gỡ lỗi

<AccordionGroup>
  <Accordion title="Nhật ký ở đâu?">
    Nhật ký tệp (có cấu trúc):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Bạn có thể đặt đường dẫn ổn định qua `logging.file`. Cấp độ log tệp được kiểm soát bởi `logging.level`. Độ chi tiết của console được kiểm soát bởi `--verbose` và `logging.consoleLevel`.

    Theo dõi log nhanh nhất:

    ```bash
    openclaw logs --follow
    ```

    Log dịch vụ/supervisor (khi gateway chạy qua launchd/systemd):

    - stdout launchd trên macOS: `~/Library/Logs/openclaw/gateway.log` (profile dùng `gateway-<profile>.log`; stderr bị tắt)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Xem [Khắc phục sự cố](/vi/gateway/troubleshooting) để biết thêm.

  </Accordion>

  <Accordion title="Làm thế nào để khởi động/dừng/khởi động lại dịch vụ Gateway?">
    Dùng các trình trợ giúp gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy gateway thủ công, `openclaw gateway --force` có thể giành lại cổng. Xem [Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng terminal trên Windows - làm thế nào để khởi động lại OpenClaw?">
    Có **ba chế độ cài đặt Windows**:

    **1) Thiết lập cục bộ Windows Hub:** ứng dụng native quản lý một WSL Gateway cục bộ thuộc sở hữu của ứng dụng.

    Mở **OpenClaw Companion** từ menu Start hoặc khay hệ thống, rồi dùng
    **Gateway Setup** hoặc tab Connections.

    **2) WSL2 Gateway thủ công:** Gateway chạy bên trong Linux.

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

    **3) CLI/Gateway native trên Windows:** Gateway chạy trực tiếp trong Windows.

    Mở PowerShell và chạy:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy thủ công (không có dịch vụ), dùng:

    ```powershell
    openclaw gateway run
    ```

    Tài liệu: [Windows](/vi/platforms/windows), [runbook dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Gateway đang chạy nhưng phản hồi không bao giờ đến. Tôi nên kiểm tra gì?">
    Bắt đầu bằng một lượt kiểm tra sức khỏe nhanh:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân thường gặp:

    - Xác thực model chưa được tải trên **máy chủ gateway** (kiểm tra `models status`).
    - Ghép nối/allowlist của kênh đang chặn phản hồi (kiểm tra cấu hình kênh + log).
    - WebChat/Dashboard đang mở mà không có đúng token.

    Nếu bạn truy cập từ xa, xác nhận kết nối tunnel/Tailscale đang hoạt động và
    Gateway WebSocket có thể truy cập được.

    Tài liệu: [Kênh](/vi/channels), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title='"Đã ngắt kết nối khỏi gateway: không có lý do" - giờ làm gì?'>
    Điều này thường có nghĩa là UI đã mất kết nối WebSocket. Kiểm tra:

    1. Gateway có đang chạy không? `openclaw gateway status`
    2. Gateway có khỏe không? `openclaw status`
    3. UI có đúng token không? `openclaw dashboard`
    4. Nếu truy cập từ xa, liên kết tunnel/Tailscale có đang hoạt động không?

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

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram có quá nhiều mục. OpenClaw đã cắt bớt theo giới hạn của Telegram và thử lại với ít lệnh hơn, nhưng một số mục menu vẫn cần bị bỏ. Giảm số lệnh plugin/skill/tùy chỉnh, hoặc tắt `channels.telegram.commands.native` nếu bạn không cần menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, hoặc lỗi mạng tương tự: nếu bạn đang dùng VPS hoặc ở sau proxy, xác nhận HTTPS đi ra được cho phép và DNS hoạt động với `api.telegram.org`.

    Nếu Gateway ở xa, hãy chắc rằng bạn đang xem log trên máy chủ Gateway.

    Tài liệu: [Telegram](/vi/channels/telegram), [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Tôi nên kiểm tra gì?">
    Trước tiên xác nhận Gateway có thể truy cập được và agent có thể chạy:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, dùng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh chat,
    hãy chắc rằng việc gửi đã được bật (`/deliver on`).

    Tài liệu: [TUI](/vi/web/tui), [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để dừng hoàn toàn rồi khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Lệnh này dừng/khởi động **dịch vụ được giám sát** (launchd trên macOS, systemd trên Linux).
    Dùng cách này khi Gateway chạy nền dưới dạng daemon.

    Nếu bạn đang chạy ở foreground, dừng bằng Ctrl-C, rồi:

    ```bash
    openclaw gateway run
    ```

    Tài liệu: [runbook dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Giải thích đơn giản: openclaw gateway restart so với openclaw gateway">
    - `openclaw gateway restart`: khởi động lại **dịch vụ nền** (launchd/systemd).
    - `openclaw gateway`: chạy gateway **ở foreground** cho phiên terminal này.

    Nếu bạn đã cài đặt dịch vụ, hãy dùng các lệnh gateway. Dùng `openclaw gateway` khi
    bạn muốn chạy foreground một lần.

  </Accordion>

  <Accordion title="Cách nhanh nhất để lấy thêm chi tiết khi có lỗi">
    Khởi động Gateway với `--verbose` để có thêm chi tiết trên console. Sau đó kiểm tra tệp log để xem xác thực kênh, định tuyến model và lỗi RPC.
  </Accordion>
</AccordionGroup>

## Media và tệp đính kèm

<AccordionGroup>
  <Accordion title="Skill của tôi đã tạo hình ảnh/PDF, nhưng không có gì được gửi">
    Tệp đính kèm đi ra từ agent phải dùng các trường media có cấu trúc như `media`, `mediaUrl`, `path`, hoặc `filePath`. Xem [thiết lập trợ lý OpenClaw](/vi/start/openclaw) và [Agent send](/vi/tools/agent-send).

    Gửi bằng CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Cũng kiểm tra:

    - Kênh đích hỗ trợ media đi ra và không bị allowlist chặn.
    - Tệp nằm trong giới hạn kích thước của provider (hình ảnh được đổi kích thước tối đa 2048px).
    - `tools.fs.workspaceOnly=true` giới hạn việc gửi đường dẫn cục bộ trong workspace, temp/media-store, và các tệp đã được sandbox xác thực.
    - `tools.fs.workspaceOnly=false` cho phép gửi media cục bộ có cấu trúc bằng các tệp cục bộ trên máy chủ mà agent đã có thể đọc, nhưng chỉ cho media cộng với các loại tài liệu an toàn (hình ảnh, âm thanh, video, PDF, tài liệu Office, và tài liệu văn bản đã xác thực như Markdown/MD, TXT, JSON, YAML, và YML). Đây không phải là trình quét bí mật: một `secret.txt` hoặc `config.json` mà agent đọc được có thể được đính kèm khi phần mở rộng và xác thực nội dung khớp. Giữ tệp nhạy cảm ngoài các đường dẫn agent có thể đọc, hoặc giữ `tools.fs.workspaceOnly=true` để gửi đường dẫn cục bộ chặt chẽ hơn.

    Xem [Hình ảnh](/vi/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn khi để OpenClaw nhận DM đi vào không?">
    Xem DM đi vào là đầu vào không đáng tin cậy. Mặc định được thiết kế để giảm rủi ro:

    - Hành vi mặc định trên các kênh hỗ trợ DM là **ghép nối**:
      - Người gửi không xác định nhận mã ghép nối; bot không xử lý tin nhắn của họ.
      - Phê duyệt bằng: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Yêu cầu đang chờ được giới hạn ở **3 mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu mã không đến.
    - Mở DM công khai yêu cầu bật rõ ràng (`dmPolicy: "open"` và allowlist `"*"`).

    Chạy `openclaw doctor` để hiển thị các chính sách DM rủi ro.

  </Accordion>

  <Accordion title="Prompt injection chỉ là mối lo cho bot công khai phải không?">
    Không. Prompt injection liên quan đến **nội dung không đáng tin cậy**, không chỉ là ai có thể DM bot.
    Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/tải web, trang trình duyệt, email,
    tài liệu, tệp đính kèm, log được dán), nội dung đó có thể bao gồm hướng dẫn cố
    chiếm quyền điều khiển model. Điều này có thể xảy ra ngay cả khi **bạn là người gửi duy nhất**.

    Rủi ro lớn nhất là khi công cụ được bật: model có thể bị lừa để
    rò rỉ ngữ cảnh hoặc gọi công cụ thay mặt bạn. Giảm phạm vi tác động bằng cách:

    - dùng một agent "reader" chỉ đọc hoặc tắt công cụ để tóm tắt nội dung không đáng tin cậy
    - tắt `web_search` / `web_fetch` / `browser` cho các agent có bật công cụ
    - cũng xem văn bản tệp/tài liệu đã giải mã là không đáng tin cậy: OpenResponses
      `input_file` và việc trích xuất tệp đính kèm media đều bọc văn bản được trích xuất trong
      các dấu mốc ranh giới nội dung bên ngoài rõ ràng thay vì truyền văn bản tệp thô
    - sandboxing và allowlist công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw có kém an toàn hơn vì dùng TypeScript/Node thay vì Rust/WASM không?">
    Ngôn ngữ và runtime quan trọng, nhưng chúng không phải rủi ro chính đối với một
    agent cá nhân. Rủi ro thực tế của OpenClaw là việc phơi bày gateway, ai có thể nhắn tin cho
    bot, prompt injection, phạm vi công cụ, xử lý thông tin xác thực, truy cập trình duyệt, truy cập exec,
    và độ tin cậy của skill hoặc plugin bên thứ ba.

    Rust và WASM có thể cung cấp cách ly mạnh hơn cho một số lớp mã, nhưng
    chúng không giải quyết prompt injection, allowlist kém, phơi bày gateway công khai,
    công cụ quá rộng, hoặc profile trình duyệt đã đăng nhập vào các
    tài khoản nhạy cảm. Hãy xem những điểm đó là các kiểm soát chính:

    - giữ Gateway riêng tư hoặc được xác thực
    - dùng ghép nối và allowlist cho DM và nhóm
    - từ chối hoặc sandbox công cụ rủi ro cho đầu vào không đáng tin cậy
    - chỉ cài đặt plugin và Skills đáng tin cậy
    - chạy `openclaw security audit --deep` sau khi thay đổi cấu hình

    Chi tiết: [Bảo mật](/vi/gateway/security), [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="Tôi thấy báo cáo về các phiên bản OpenClaw bị lộ. Tôi nên kiểm tra gì?">
    Trước tiên kiểm tra triển khai thực tế của bạn:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Mức cơ sở an toàn hơn là:

    - Gateway bind vào `loopback`, hoặc chỉ được phơi bày qua truy cập riêng tư có xác thực
      như tailnet, SSH tunnel, xác thực token/mật khẩu, hoặc proxy tin cậy được
      cấu hình đúng
    - DM ở chế độ `pairing` hoặc `allowlist`
    - nhóm được allowlist và chặn bằng mention trừ khi mọi thành viên đều đáng tin cậy
    - công cụ rủi ro cao (`exec`, `browser`, `gateway`, `cron`) bị từ chối hoặc giới hạn
      chặt cho các agent đọc nội dung không đáng tin cậy
    - sandboxing được bật khi việc thực thi công cụ cần phạm vi tác động nhỏ hơn

    Bind công khai không có xác thực, DM/nhóm mở với công cụ, và điều khiển trình duyệt
    bị phơi bày là các phát hiện cần sửa trước. Chi tiết:
    [Danh sách kiểm tra kiểm toán bảo mật](/vi/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Skills ClawHub và plugin bên thứ ba có an toàn để cài đặt không?">
    Xem Skills và plugin bên thứ ba là mã bạn chọn tin tưởng.
    Các trang skill của ClawHub hiển thị trạng thái quét trước khi cài đặt, nhưng quét không phải là
    ranh giới bảo mật hoàn chỉnh. OpenClaw không chạy cơ chế chặn
    mã nguy hiểm cục bộ tích hợp sẵn trong luồng cài đặt/cập nhật plugin hoặc skill; hãy dùng
    `security.installPolicy` do operator sở hữu cho các quyết định cho phép/chặn cục bộ.

    Mẫu an toàn hơn:

    - ưu tiên tác giả đáng tin cậy và phiên bản được ghim
    - đọc skill hoặc plugin trước khi bật
    - giữ allowlist plugin và skill hẹp
    - chạy quy trình làm việc với đầu vào không đáng tin cậy trong sandbox với công cụ tối thiểu
    - tránh cấp cho mã bên thứ ba quyền truy cập rộng vào filesystem, exec, trình duyệt, hoặc bí mật

    Chi tiết: [Skills](/vi/tools/skills), [Plugin](/vi/tools/plugin),
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub hoặc số điện thoại riêng không?">
    Có, với hầu hết thiết lập. Cô lập bot bằng các tài khoản và số điện thoại riêng
    sẽ giảm phạm vi ảnh hưởng nếu có sự cố. Điều này cũng giúp xoay vòng
    thông tin xác thực hoặc thu hồi quyền truy cập dễ hơn mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Bắt đầu nhỏ. Chỉ cấp quyền truy cập vào các công cụ và tài khoản bạn thực sự cần, rồi mở rộng
    sau nếu cần.

    Tài liệu: [Bảo mật](/vi/gateway/security), [Ghép cặp](/vi/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể cho nó quyền tự chủ với tin nhắn văn bản của mình không và như vậy có an toàn không?">
    Chúng tôi **không** khuyến nghị quyền tự chủ hoàn toàn với tin nhắn cá nhân của bạn. Mẫu an toàn nhất là:

    - Giữ tin nhắn trực tiếp ở **chế độ ghép cặp** hoặc một danh sách cho phép chặt chẽ.
    - Dùng **số hoặc tài khoản riêng** nếu bạn muốn nó nhắn tin thay mặt bạn.
    - Để nó soạn nháp, rồi **phê duyệt trước khi gửi**.

    Nếu bạn muốn thử nghiệm, hãy thực hiện trên một tài khoản chuyên dụng và giữ nó cô lập. Xem
    [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể dùng các mô hình rẻ hơn cho tác vụ trợ lý cá nhân không?">
    Có, **nếu** agent chỉ dùng để trò chuyện và đầu vào đáng tin cậy. Các tầng nhỏ hơn
    dễ bị chiếm quyền chỉ dẫn hơn, vì vậy hãy tránh dùng chúng cho agent có bật công cụ
    hoặc khi đọc nội dung không đáng tin cậy. Nếu bạn buộc phải dùng mô hình nhỏ hơn, hãy khóa chặt
    công cụ và chạy bên trong sandbox. Xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã ghép cặp">
    Mã ghép cặp được gửi **chỉ** khi một người gửi chưa biết nhắn tin cho bot và
    `dmPolicy: "pairing"` được bật. Riêng `/start` không tạo mã.

    Kiểm tra các yêu cầu đang chờ:

    ```bash
    openclaw pairing list telegram
    ```

    Nếu bạn muốn truy cập ngay, hãy thêm id người gửi của bạn vào danh sách cho phép hoặc đặt `dmPolicy: "open"`
    cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: nó có nhắn tin cho danh bạ của tôi không? Ghép cặp hoạt động thế nào?">
    Không. Chính sách tin nhắn trực tiếp mặc định của WhatsApp là **ghép cặp**. Người gửi chưa biết chỉ nhận được mã ghép cặp và tin nhắn của họ **không được xử lý**. OpenClaw chỉ trả lời các cuộc trò chuyện mà nó nhận được hoặc các lần gửi rõ ràng do bạn kích hoạt.

    Phê duyệt ghép cặp bằng:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Liệt kê các yêu cầu đang chờ:

    ```bash
    openclaw pairing list whatsapp
    ```

    Lời nhắc số điện thoại của trình hướng dẫn: nó được dùng để đặt **danh sách cho phép/chủ sở hữu** của bạn để tin nhắn trực tiếp của chính bạn được phép. Nó không được dùng để tự động gửi. Nếu bạn chạy trên số WhatsApp cá nhân của mình, hãy dùng số đó và bật `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh trò chuyện, hủy tác vụ và "nó sẽ không dừng"

<AccordionGroup>
  <Accordion title="Làm thế nào để ngăn thông báo hệ thống nội bộ hiển thị trong trò chuyện?">
    Hầu hết thông báo nội bộ hoặc thông báo công cụ chỉ xuất hiện khi **verbose**, **trace** hoặc **reasoning** được bật
    cho phiên đó.

    Sửa trong cuộc trò chuyện nơi bạn thấy nó:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Nếu vẫn còn nhiều nhiễu, hãy kiểm tra thiết lập phiên trong Giao diện điều khiển và đặt verbose
    thành **kế thừa**. Đồng thời xác nhận bạn không dùng hồ sơ bot có `verboseDefault` được đặt
    thành `on` trong cấu hình.

    Tài liệu: [Suy nghĩ và verbose](/vi/tools/thinking), [Bảo mật](/vi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm thế nào để dừng/hủy một tác vụ đang chạy?">
    Gửi bất kỳ câu nào sau đây **dưới dạng một tin nhắn độc lập** (không có dấu gạch chéo):

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

    Với các tiến trình nền (từ công cụ exec), bạn có thể yêu cầu agent chạy:

    ```
    process action:kill sessionId:XXX
    ```

    Tổng quan về lệnh gạch chéo: xem [Lệnh gạch chéo](/vi/tools/slash-commands).

    Hầu hết lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`, nhưng một vài lối tắt (như `/status`) cũng hoạt động nội tuyến với người gửi trong danh sách cho phép.

  </Accordion>

  <Accordion title='Làm thế nào để gửi tin nhắn Discord từ Telegram? ("Nhắn tin xuyên ngữ cảnh bị từ chối")'>
    OpenClaw chặn nhắn tin **xuyên nhà cung cấp** theo mặc định. Nếu một lệnh gọi công cụ được ràng buộc
    với Telegram, nó sẽ không gửi đến Discord trừ khi bạn cho phép rõ ràng.

    Bật nhắn tin xuyên nhà cung cấp cho agent:

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

  <Accordion title='Tại sao có cảm giác bot "bỏ qua" các tin nhắn gửi dồn dập?'>
    Theo mặc định, lời nhắc giữa lượt chạy được điều hướng vào lượt chạy đang hoạt động. Dùng `/queue` để chọn hành vi của lượt chạy đang hoạt động:

    - `steer` - hướng dẫn lượt chạy đang hoạt động tại ranh giới mô hình tiếp theo
    - `followup` - xếp hàng tin nhắn và chạy từng tin một sau khi lượt chạy hiện tại kết thúc
    - `collect` - xếp hàng các tin nhắn tương thích và trả lời một lần sau khi lượt chạy hiện tại kết thúc
    - `interrupt` - hủy lượt chạy hiện tại và bắt đầu mới

    Chế độ mặc định là `steer`. Bạn có thể thêm các tùy chọn như `debounce:0.5s cap:25 drop:summarize` cho các chế độ xếp hàng. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Linh tinh

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic với khóa API là gì?'>
    Trong OpenClaw, thông tin xác thực và lựa chọn mô hình là riêng biệt. Đặt `ANTHROPIC_API_KEY` (hoặc lưu khóa API Anthropic trong hồ sơ xác thực) sẽ bật xác thực, nhưng mô hình mặc định thực tế là bất kỳ mô hình nào bạn cấu hình trong `agents.defaults.model.primary` (ví dụ: `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). Nếu bạn thấy `No credentials found for profile "anthropic:default"`, điều đó nghĩa là Gateway không tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` dự kiến cho agent đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn bị kẹt? Hãy hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [thảo luận GitHub](https://github.com/openclaw/openclaw/discussions).

## Liên quan

- [Câu hỏi thường gặp khi chạy lần đầu](/vi/help/faq-first-run) — cài đặt, khởi tạo, xác thực, gói đăng ký, lỗi sớm
- [Câu hỏi thường gặp về mô hình](/vi/help/faq-models) — lựa chọn mô hình, chuyển dự phòng, hồ sơ xác thực
- [Khắc phục sự cố](/vi/help/troubleshooting) — phân loại theo triệu chứng trước
