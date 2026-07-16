---
read_when:
    - Giải đáp các câu hỏi hỗ trợ thường gặp về thiết lập, cài đặt, quy trình làm quen hoặc môi trường thực thi
    - Phân loại các sự cố do người dùng báo cáo trước khi gỡ lỗi chuyên sâu
summary: Các câu hỏi thường gặp về thiết lập, cấu hình và cách sử dụng OpenClaw
title: Câu hỏi thường gặp
x-i18n:
    generated_at: "2026-07-16T14:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

Câu trả lời nhanh cùng hướng dẫn khắc phục sự cố chuyên sâu cho các thiết lập thực tế (phát triển cục bộ, VPS, đa tác tử, khóa OAuth/API, chuyển đổi dự phòng mô hình). Để chẩn đoán thời gian chạy, xem [Khắc phục sự cố](/vi/gateway/troubleshooting). Để xem tài liệu tham chiếu cấu hình đầy đủ, xem [Cấu hình](/vi/gateway/configuration).

## 60 giây đầu tiên khi có sự cố

<Steps>
  <Step title="Trạng thái nhanh">
    ```bash
    openclaw status
    ```
    Tóm tắt nhanh trên máy cục bộ: hệ điều hành + bản cập nhật, khả năng kết nối đến Gateway/dịch vụ, tác tử/phiên, cấu hình nhà cung cấp + sự cố thời gian chạy (khi có thể kết nối đến Gateway).
  </Step>
  <Step title="Báo cáo có thể dán (an toàn để chia sẻ)">
    ```bash
    openclaw status --all
    ```
    Chẩn đoán chỉ đọc kèm phần cuối nhật ký (token đã được che).
  </Step>
  <Step title="Trạng thái trình nền + cổng">
    ```bash
    openclaw gateway status
    ```
    Hiển thị thời gian chạy của trình giám sát so với khả năng kết nối RPC, URL đích thăm dò và cấu hình mà dịch vụ có thể đã sử dụng.
  </Step>
  <Step title="Thăm dò chuyên sâu">
    ```bash
    openclaw status --deep
    ```
    Thăm dò trực tiếp tình trạng của Gateway, bao gồm thăm dò kênh khi được hỗ trợ (yêu cầu có thể kết nối đến Gateway). Xem [Tình trạng](/vi/gateway/health).
  </Step>
  <Step title="Theo dõi nhật ký mới nhất">
    ```bash
    openclaw logs --follow
    ```
    Nếu RPC không hoạt động, hãy dùng phương án dự phòng:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Nhật ký tệp tách biệt với nhật ký dịch vụ; xem [Ghi nhật ký](/vi/logging) và [Khắc phục sự cố](/vi/gateway/troubleshooting).
  </Step>
  <Step title="Chạy trình kiểm tra (sửa chữa)">
    ```bash
    openclaw doctor
    ```
    Sửa chữa/di chuyển cấu hình và trạng thái, sau đó chạy kiểm tra tình trạng. Xem [Trình kiểm tra](/vi/gateway/doctor).
  </Step>
  <Step title="Ảnh chụp nhanh Gateway (chỉ WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # hiển thị URL đích + đường dẫn cấu hình khi có lỗi
    ```
    Yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh đầy đủ. Xem [Tình trạng](/vi/gateway/health).
  </Step>
</Steps>

## Bắt đầu nhanh và thiết lập lần chạy đầu tiên

Phần hỏi đáp về lần chạy đầu tiên — cài đặt, hướng dẫn ban đầu, tuyến xác thực, gói đăng ký, lỗi ban đầu — nằm trong [Câu hỏi thường gặp về lần chạy đầu tiên](/vi/help/faq-first-run).

## OpenClaw là gì?

<AccordionGroup>
  <Accordion title="OpenClaw là gì, trong một đoạn văn?">
    OpenClaw là trợ lý AI cá nhân mà bạn chạy trên thiết bị của chính mình. Trợ lý phản hồi trên các nền tảng nhắn tin bạn đang sử dụng (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp và các plugin kênh đi kèm như QQ Bot), đồng thời cũng có thể hỗ trợ giọng nói và Canvas trực tiếp trên các nền tảng được hỗ trợ. **Gateway** là mặt phẳng điều khiển luôn hoạt động; trợ lý mới là sản phẩm.
  </Accordion>

  <Accordion title="Giá trị mang lại">
    OpenClaw không phải "chỉ là một lớp bọc Claude". Đây là một **mặt phẳng điều khiển ưu tiên cục bộ** chạy một trợ lý mạnh mẽ trên **phần cứng của chính bạn**, có thể truy cập từ các ứng dụng trò chuyện bạn đang sử dụng, với phiên có trạng thái, bộ nhớ và công cụ — mà không phải giao quy trình làm việc của bạn cho một SaaS được lưu trữ.

    - **Thiết bị của bạn, dữ liệu của bạn**: chạy Gateway ở bất cứ đâu bạn muốn (Mac, Linux, VPS) và giữ không gian làm việc cùng lịch sử phiên trên máy cục bộ.
    - **Kênh thực, không phải hộp cát web**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/v.v., cùng giọng nói trên thiết bị di động và Canvas trên các nền tảng được hỗ trợ.
    - **Không phụ thuộc mô hình**: sử dụng Anthropic, MiniMax, OpenAI, OpenRouter, v.v., với định tuyến và chuyển đổi dự phòng theo từng tác tử.
    - **Tùy chọn chỉ chạy cục bộ**: chạy các mô hình cục bộ để toàn bộ dữ liệu có thể nằm lại trên thiết bị của bạn.
    - **Định tuyến đa tác tử**: tách riêng tác tử theo kênh, tài khoản hoặc tác vụ, mỗi tác tử có không gian làm việc và giá trị mặc định riêng.
    - **Mã nguồn mở và có thể tùy biến**: kiểm tra, mở rộng và tự lưu trữ mà không bị phụ thuộc vào nhà cung cấp.

    Tài liệu: [Gateway](/vi/gateway), [Kênh](/vi/channels), [Đa tác tử](/vi/concepts/multi-agent), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi vừa thiết lập xong — trước tiên nên làm gì?">
    Các dự án khởi đầu phù hợp: xây dựng trang web (WordPress, Shopify hoặc trang tĩnh); tạo nguyên mẫu ứng dụng di động (dàn ý, màn hình, kế hoạch API); sắp xếp tệp và thư mục; kết nối Gmail và tự động hóa bản tóm tắt hoặc nội dung theo dõi.

    Hệ thống có thể xử lý các tác vụ lớn, nhưng hoạt động tốt nhất khi được chia thành nhiều giai đoạn với các tác tử con làm việc song song.

  </Accordion>

  <Accordion title="Năm trường hợp sử dụng OpenClaw hằng ngày hàng đầu là gì?">
    - **Bản tin cá nhân**: tóm tắt hộp thư đến, lịch và tin tức bạn quan tâm.
    - **Nghiên cứu và soạn thảo**: nghiên cứu nhanh, tóm tắt và tạo bản nháp đầu tiên cho email hoặc tài liệu.
    - **Nhắc nhở và theo dõi**: lời nhắc và danh sách kiểm tra được kích hoạt bằng Cron hoặc Heartbeat.
    - **Tự động hóa trình duyệt**: điền biểu mẫu, thu thập dữ liệu, lặp lại các tác vụ web.
    - **Điều phối liên thiết bị**: gửi tác vụ từ điện thoại, để Gateway chạy tác vụ đó trên máy chủ rồi nhận lại kết quả trong cuộc trò chuyện.

  </Accordion>

  <Accordion title="OpenClaw có thể hỗ trợ tìm kiếm khách hàng tiềm năng, tiếp cận, quảng cáo và viết blog cho SaaS không?">
    Có, đối với **nghiên cứu, đánh giá mức độ phù hợp và soạn thảo**: quét các trang web, xây dựng danh sách rút gọn, tóm tắt khách hàng tiềm năng, viết bản nháp nội dung tiếp cận hoặc quảng cáo.

    Đối với **các chiến dịch tiếp cận hoặc quảng cáo**, cần có con người tham gia giám sát. Tránh gửi thư rác, tuân thủ luật pháp địa phương và chính sách nền tảng, đồng thời xem xét mọi nội dung trước khi gửi. Hãy để OpenClaw soạn thảo; bạn phê duyệt.

    Tài liệu: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Có những ưu điểm gì so với Claude Code khi phát triển web?">
    OpenClaw là một **trợ lý cá nhân** và lớp điều phối, không phải công cụ thay thế IDE. Sử dụng Claude Code hoặc Codex để có vòng lặp lập trình trực tiếp nhanh nhất bên trong kho mã. Sử dụng OpenClaw cho bộ nhớ bền vững, khả năng truy cập liên thiết bị và điều phối công cụ.

    - Bộ nhớ và không gian làm việc bền vững giữa các phiên.
    - Truy cập đa nền tảng (Telegram, WhatsApp, TUI, WebChat).
    - Điều phối công cụ (trình duyệt, tệp, lập lịch, hook).
    - Gateway luôn hoạt động (chạy trên VPS, tương tác từ mọi nơi).
    - Các Node dành cho trình duyệt/màn hình/camera/thực thi cục bộ.

    Nội dung giới thiệu: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills và tự động hóa

<AccordionGroup>
  <Accordion title="Làm cách nào để tùy chỉnh Skills mà không làm kho mã ở trạng thái có thay đổi?">
    Sử dụng các giá trị ghi đè được quản lý thay vì chỉnh sửa bản sao trong kho mã. Đặt các thay đổi vào `~/.openclaw/skills/<name>/SKILL.md` (hoặc thêm một thư mục thông qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`). Thứ tự ưu tiên: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> đi kèm -> `skills.load.extraDirs`, vì vậy các giá trị ghi đè được quản lý sẽ được ưu tiên hơn Skills đi kèm mà không cần thay đổi git. Để cài đặt trên toàn hệ thống nhưng giới hạn khả năng hiển thị cho một số tác tử, hãy giữ bản sao dùng chung trong `~/.openclaw/skills` và kiểm soát khả năng hiển thị bằng `agents.defaults.skills` / `agents.list[].skills`. Chỉ những chỉnh sửa phù hợp để đóng góp ngược lên thượng nguồn mới nên được gửi dưới dạng PR cho bản sao trong kho mã.
  </Accordion>

  <Accordion title="Tôi có thể tải Skills từ một thư mục tùy chỉnh không?">
    Có: thêm các thư mục thông qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json` (mức ưu tiên thấp nhất theo thứ tự ở trên). Theo mặc định, `clawhub` cài đặt vào `./skills`, nơi OpenClaw sẽ coi là `<workspace>/skills` trong phiên tiếp theo. Để giới hạn khả năng hiển thị cho một số tác tử nhất định, hãy kết hợp với `agents.defaults.skills` hoặc `agents.list[].skills`.
  </Accordion>

  <Accordion title="Làm cách nào để sử dụng các mô hình hoặc thiết lập khác nhau cho từng tác vụ?">
    Các mẫu được hỗ trợ:

    - **Tác vụ Cron**: các tác vụ biệt lập có thể đặt giá trị ghi đè `model` cho từng tác vụ.
    - **Tác tử**: định tuyến tác vụ đến các tác tử riêng biệt có mô hình mặc định, mức độ suy luận và tham số luồng khác nhau.
    - **Chuyển đổi theo yêu cầu**: `/model` chuyển đổi mô hình của phiên hiện tại vào bất kỳ lúc nào.

    Ví dụ — cùng một mô hình, thiết lập khác nhau theo từng tác tử:

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

    Đặt các giá trị mặc định dùng chung theo từng mô hình trong `agents.defaults.models["provider/model"].params`, sau đó đặt các giá trị ghi đè dành riêng cho từng tác tử trong `agents.list[].params` dạng phẳng. Không sao chép cùng một mô hình trong `agents.list[].models["provider/model"].params` lồng nhau; đường dẫn đó dành cho danh mục mô hình và giá trị ghi đè thời gian chạy theo từng tác tử.

    Xem [Tác vụ Cron](/vi/automation/cron-jobs), [Định tuyến đa tác tử](/vi/concepts/multi-agent), [Cấu hình](/vi/gateway/config-agents), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot bị treo khi thực hiện công việc nặng. Làm cách nào để chuyển công việc đó sang nơi khác?">
    Sử dụng **tác tử con** cho các tác vụ kéo dài hoặc song song: chúng chạy trong phiên riêng, trả về bản tóm tắt và giúp cuộc trò chuyện chính của bạn tiếp tục phản hồi. Yêu cầu bot "tạo một tác tử con cho tác vụ này" hoặc sử dụng `/subagents`. Sử dụng `/status` để xem Gateway hiện có đang bận hay không.

    Cả tác vụ dài và tác tử con đều tiêu thụ token; hãy đặt một mô hình rẻ hơn cho tác tử con thông qua `agents.defaults.subagents.model` nếu chi phí là vấn đề quan trọng.

    Tài liệu: [Tác tử con](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Các phiên tác tử con gắn với luồng hoạt động như thế nào trên Discord?">
    Gắn một luồng Discord với tác tử con hoặc đích phiên để các tin nhắn tiếp theo tại đó vẫn ở trong phiên được gắn này.

    - Tạo bằng `sessions_spawn` sử dụng `thread: true` (tùy chọn `mode: "session"` để duy trì nội dung theo dõi).
    - Hoặc gắn thủ công bằng `/focus <target>`.
    - `/agents` kiểm tra trạng thái gắn.
    - `/session idle <duration|off>` và `/session max-age <duration|off>` kiểm soát việc tự động bỏ tập trung.
    - `/unfocus` tách luồng.

    Cấu hình: `session.threadBindings.enabled` (công tắc toàn cục), `session.threadBindings.idleHours` (mặc định `24`, `0` sẽ vô hiệu hóa), `session.threadBindings.maxAgeHours` (mặc định `0` = không có giới hạn cứng) và các giá trị ghi đè theo từng kênh `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` kiểm soát việc tự động gắn khi tạo (mặc định `true`).

    Tài liệu: [Tác tử con](/vi/tools/subagents), [Discord](/vi/channels/discord), [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Một tác tử con đã hoàn tất, nhưng thông báo hoàn tất được gửi sai chỗ hoặc không bao giờ được đăng. Tôi nên kiểm tra gì?">
    Kiểm tra tuyến người yêu cầu đã được phân giải:

    - Việc gửi tác tử con ở chế độ hoàn tất ưu tiên luồng hoặc tuyến cuộc trò chuyện đã gắn khi tồn tại.
    - Nếu nguồn gốc hoàn tất chỉ mang thông tin kênh, OpenClaw sẽ dùng tuyến được lưu của phiên người yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) làm phương án dự phòng để việc gửi trực tiếp vẫn có thể thành công.
    - Không có tuyến đã gắn và không có tuyến được lưu có thể sử dụng: việc gửi trực tiếp có thể thất bại và kết quả sẽ chuyển sang gửi qua hàng đợi của phiên thay vì đăng ngay lập tức.
    - Đích không hợp lệ hoặc đã cũ cũng có thể buộc hệ thống chuyển sang hàng đợi hoặc khiến lần gửi cuối cùng thất bại.
    - Nếu câu trả lời hiển thị cuối cùng của trợ lý con chính xác là `NO_REPLY` / `no_reply` hoặc `ANNOUNCE_SKIP`, OpenClaw chủ ý ngăn thông báo thay vì đăng tiến độ cũ trước đó.

    Gỡ lỗi: `openclaw tasks show <lookup>`, trong đó `<lookup>` là ID tác vụ, ID lượt chạy hoặc khóa phiên.

    Tài liệu: [Tác tử con](/vi/tools/subagents), [Tác vụ nền](/vi/automation/tasks), [Công cụ phiên](/vi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron hoặc lời nhắc không kích hoạt. Tôi nên kiểm tra gì?">
    Cron chạy bên trong tiến trình Gateway; nó sẽ không kích hoạt nếu Gateway không chạy liên tục.

    - Xác nhận Cron đã được bật (`cron.enabled`) và `OPENCLAW_SKIP_CRON` chưa được đặt.
    - Xác nhận Gateway chạy 24/7 (không ngủ/khởi động lại).
    - Xác minh múi giờ của tác vụ (`--tz` so với múi giờ của máy chủ).

    Gỡ lỗi:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation).

  </Accordion>

  <Accordion title="Cron đã kích hoạt nhưng không có gì được gửi đến kênh. Tại sao?">
    Kiểm tra chế độ gửi:

    - `--no-deliver` / `delivery.mode: "none"`: không có cơ chế gửi dự phòng từ trình chạy.
    - Thiếu hoặc đích thông báo không hợp lệ (`channel` / `to`): trình chạy đã bỏ qua việc gửi ra ngoài.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`): trình chạy đã thử gửi nhưng thông tin xác thực đã ngăn việc đó.
    - Một kết quả cô lập im lặng (chỉ có `NO_REPLY` / `no_reply`) được coi là chủ ý không thể gửi, vì vậy việc gửi dự phòng đã xếp hàng cũng bị chặn.

    Đối với các tác vụ Cron cô lập, tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện. `--announce` chỉ kiểm soát việc gửi dự phòng của trình chạy đối với văn bản cuối cùng mà tác nhân chưa tự gửi.

    Gỡ lỗi:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tác vụ nền](/vi/automation/tasks).

  </Accordion>

  <Accordion title="Tại sao một lần chạy Cron cô lập lại chuyển mô hình hoặc thử lại một lần?">
    Đây là luồng chuyển mô hình trực tiếp, không phải lập lịch trùng lặp. Cron cô lập duy trì việc bàn giao mô hình trong thời gian chạy và thử lại khi lần chạy đang hoạt động phát sinh `LiveSessionModelSwitchError`, đồng thời giữ nguyên nhà cung cấp/mô hình đã chuyển (và mọi ghi đè hồ sơ xác thực đã chuyển) trước khi thử lại.

    Thứ tự ưu tiên chọn mô hình: trước tiên là ghi đè mô hình của hook Gmail (`hooks.gmail.model`), sau đó là `model` theo từng tác vụ, rồi đến mọi ghi đè mô hình đã lưu của phiên Cron, cuối cùng là lựa chọn mô hình mặc định/thông thường của tác nhân.

    Vòng lặp thử lại được giới hạn ở lần thử ban đầu cộng với 2 lần thử lại sau khi chuyển; sau đó Cron sẽ hủy thay vì lặp vô hạn.

    Gỡ lỗi:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [CLI cron](/vi/cli/cron).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt Skills trên Linux?">
    Sử dụng các lệnh `openclaw skills` gốc hoặc đặt Skills vào không gian làm việc; giao diện Skills trên macOS không khả dụng trên Linux. Duyệt Skills tại [https://clawhub.ai](https://clawhub.ai).

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

    Theo mặc định, `openclaw skills install` gốc ghi vào thư mục `skills/` của không gian làm việc đang hoạt động. Thêm `--global` để cài đặt vào thư mục Skills được quản lý dùng chung cho tất cả tác nhân cục bộ. Chỉ cài đặt CLI `clawhub` riêng biệt để xuất bản hoặc đồng bộ Skills của riêng bạn. Sử dụng `agents.defaults.skills` hoặc `agents.list[].skills` để giới hạn những tác nhân nào có thể thấy Skills dùng chung.

  </Accordion>

  <Accordion title="OpenClaw có thể chạy tác vụ theo lịch hoặc liên tục trong nền không?">
    Có, thông qua bộ lập lịch Gateway:

    - **Tác vụ Cron** dành cho tác vụ theo lịch hoặc định kỳ (được duy trì qua các lần khởi động lại).
    - **Heartbeat** dành cho các lượt kiểm tra định kỳ của phiên chính.
    - **Tác vụ cô lập** dành cho các tác nhân tự trị đăng bản tóm tắt hoặc gửi đến cuộc trò chuyện.

    Tài liệu: [Tác vụ Cron](/vi/automation/cron-jobs), [Tự động hóa](/vi/automation), [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title="Có thể chạy Skills chỉ dành cho Apple macOS từ Linux không?">
    Không thể trực tiếp. Skills dành cho macOS được kiểm soát bởi `metadata.openclaw.os` cùng với các tệp nhị phân bắt buộc và chỉ được tải khi đủ điều kiện trên **máy chủ Gateway**. Trên Linux, Skills chỉ dành cho `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) sẽ không tải trừ khi bạn ghi đè cơ chế kiểm soát.

    Có ba mẫu được hỗ trợ:

    **Phương án A - chạy Gateway trên máy Mac (đơn giản nhất)**. Chạy Gateway tại nơi có các tệp nhị phân macOS, sau đó kết nối từ Linux ở [chế độ từ xa](#gateway-ports-already-running-and-remote-mode) hoặc qua Tailscale. Skills tải bình thường vì máy chủ Gateway là macOS.

    **Phương án B - sử dụng một Node macOS (không cần SSH)**. Chạy Gateway trên Linux, ghép đôi một Node macOS (ứng dụng trên thanh menu) và đặt **Node Run Commands** thành "Always Ask" hoặc "Always Allow" trên máy Mac. OpenClaw coi Skills chỉ dành cho macOS là đủ điều kiện khi các tệp nhị phân bắt buộc tồn tại trên Node; tác nhân chạy chúng thông qua công cụ `nodes`. Với "Always Ask", việc phê duyệt "Always Allow" trong lời nhắc sẽ thêm lệnh đó vào danh sách cho phép.

    **Phương án C - ủy nhiệm các tệp nhị phân macOS qua SSH (nâng cao)**. Giữ Gateway trên Linux nhưng để các tệp nhị phân CLI bắt buộc phân giải thành trình bao bọc SSH chạy trên máy Mac, sau đó ghi đè Skill để cho phép Linux nhằm duy trì trạng thái đủ điều kiện.

    1. Tạo trình bao bọc SSH cho tệp nhị phân (ví dụ: `memo` cho Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Đặt trình bao bọc vào `PATH` trên máy chủ Linux (ví dụ: `~/bin/memo`).
    3. Ghi đè siêu dữ liệu của Skill (không gian làm việc hoặc `~/.openclaw/skills`) để cho phép Linux:
       ```markdown
       ---
       name: apple-notes
       description: Quản lý Apple Notes qua CLI memo trên macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Bắt đầu một phiên mới để làm mới ảnh chụp nhanh Skills.

  </Accordion>

  <Accordion title="Có tích hợp Notion hoặc HeyGen không?">
    Hiện chưa được tích hợp sẵn. Các lựa chọn:

    - **Skill / Plugin tùy chỉnh**: phù hợp nhất để truy cập API đáng tin cậy (cả hai đều có API).
    - **Tự động hóa trình duyệt**: hoạt động mà không cần mã nhưng chậm hơn và dễ gặp lỗi hơn.

    Đối với ngữ cảnh theo từng khách hàng kiểu đại lý: duy trì một trang Notion cho mỗi khách hàng (ngữ cảnh + tùy chọn + công việc đang hoạt động) và yêu cầu tác nhân truy xuất trang đó khi bắt đầu phiên.

    Để có tích hợp gốc, hãy mở một yêu cầu tính năng hoặc xây dựng một Skill dựa trên các API đó.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Các bản cài đặt gốc được đặt trong thư mục `skills/` của không gian làm việc đang hoạt động; sử dụng `--global` cho tất cả tác nhân cục bộ hoặc cấu hình `agents.defaults.skills` / `agents.list[].skills` để giới hạn khả năng hiển thị. Một số Skills yêu cầu các tệp nhị phân được cài đặt bằng Homebrew; trên Linux, điều đó có nghĩa là Linuxbrew.

    Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), [ClawHub](/vi/clawhub).

  </Accordion>

  <Accordion title="Làm cách nào để sử dụng Chrome hiện có đã đăng nhập với OpenClaw?">
    Sử dụng hồ sơ trình duyệt `user` tích hợp sẵn, hồ sơ này kết nối thông qua Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Để sử dụng tên tùy chỉnh, hãy tạo một hồ sơ MCP rõ ràng:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Hồ sơ này có thể sử dụng trình duyệt trên máy chủ cục bộ hoặc một Node trình duyệt đã kết nối. Nếu Gateway chạy ở nơi khác, hãy chạy máy chủ Node trên máy có trình duyệt hoặc sử dụng CDP từ xa.

    Các giới hạn hiện tại của hồ sơ `existing-session` / `user` so với hồ sơ `openclaw` được quản lý:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` và `select` yêu cầu tham chiếu ảnh chụp nhanh, không phải bộ chọn CSS.
    - Các hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không có CSS `element`.
    - `responsebody`, xuất PDF, chặn tải xuống và các thao tác hàng loạt vẫn yêu cầu đường dẫn trình duyệt được quản lý.

    Xem [Trình duyệt](/vi/tools/browser#existing-session-via-chrome-devtools-mcp) để biết bảng so sánh đầy đủ.

  </Accordion>
</AccordionGroup>

## Hộp cát và bộ nhớ

<AccordionGroup>
  <Accordion title="Có tài liệu riêng về hộp cát không?">
    Có: [Hộp cát](/vi/gateway/sandboxing). Để thiết lập riêng cho Docker (toàn bộ Gateway trong Docker hoặc các ảnh hộp cát), hãy xem [Docker](/vi/install/docker).
  </Accordion>

  <Accordion title="Docker có vẻ bị hạn chế - làm cách nào để bật đầy đủ tính năng?">
    Ảnh mặc định ưu tiên bảo mật và chạy với người dùng `node`, vì vậy ảnh này không bao gồm các gói hệ thống, Homebrew và các trình duyệt đi kèm. Để thiết lập đầy đủ hơn:

    - Duy trì `/home/node` bằng `OPENCLAW_HOME_VOLUME` để bộ nhớ đệm được giữ lại.
    - Đưa các phần phụ thuộc hệ thống vào ảnh bằng `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Cài đặt trình duyệt Playwright thông qua CLI đi kèm: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Đặt `PLAYWRIGHT_BROWSERS_PATH` và duy trì đường dẫn đó.

    Tài liệu: [Docker](/vi/install/docker), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Có thể giữ DM ở chế độ cá nhân nhưng công khai/chạy nhóm trong hộp cát bằng một tác nhân không?">
    Có, nếu lưu lượng riêng tư là **DM** và lưu lượng công khai là **nhóm**. Đặt `agents.defaults.sandbox.mode: "non-main"` để các phiên nhóm/kênh (khóa không phải khóa chính) chạy trong phần phụ trợ hộp cát đã cấu hình trong khi phiên DM chính vẫn ở trên máy chủ. Docker là phần phụ trợ mặc định sau khi bật hộp cát. Hạn chế các công cụ khả dụng trong phiên chạy trong hộp cát thông qua `tools.sandbox.tools`.

    Hướng dẫn thiết lập: [Nhóm: DM cá nhân + nhóm công khai](/vi/channels/groups#pattern-personal-dms-public-groups-single-agent). Tham khảo chính: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Làm cách nào để gắn một thư mục máy chủ vào hộp cát?">
    Đặt `agents.defaults.sandbox.docker.binds` thành `["host:container:mode"]` (ví dụ: `"/home/user/src:/src:ro"`). Các điểm gắn toàn cục và theo từng tác nhân được hợp nhất; điểm gắn theo từng tác nhân bị bỏ qua khi `scope: "shared"`. Sử dụng `:ro` cho mọi nội dung nhạy cảm; các điểm gắn vượt qua rào chắn hệ thống tệp của hộp cát.

    OpenClaw xác thực nguồn điểm gắn dựa trên cả đường dẫn đã chuẩn hóa và đường dẫn chính tắc được phân giải thông qua tổ tiên sâu nhất đang tồn tại, vì vậy các trường hợp thoát qua thư mục cha là liên kết tượng trưng sẽ bị chặn an toàn ngay cả khi đoạn cuối của đường dẫn chưa tồn tại.

    Xem [Hộp cát](/vi/gateway/sandboxing#custom-bind-mounts) và [Hộp cát so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bộ nhớ hoạt động như thế nào?">
    Bộ nhớ OpenClaw là các tệp Markdown trong không gian làm việc của tác nhân: ghi chú hằng ngày trong `memory/YYYY-MM-DD.md`, ghi chú dài hạn đã tuyển chọn trong `MEMORY.md` (chỉ các phiên chính/riêng tư).

    OpenClaw cũng âm thầm chạy một lần **xả bộ nhớ trước Compaction** trước khi Compaction tóm tắt cuộc trò chuyện, nhắc mô hình ghi lại các ghi chú bền vững trước. Quá trình này chỉ chạy khi không gian làm việc có thể ghi (hộp cát chỉ đọc sẽ bỏ qua); tắt bằng `agents.defaults.compaction.memoryFlush.enabled: false`. Xem [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Bộ nhớ cứ quên thông tin. Làm cách nào để lưu giữ chúng?">
    Yêu cầu bot **ghi thông tin vào bộ nhớ**: ghi chú dài hạn được lưu trong `MEMORY.md`, ngữ cảnh ngắn hạn trong `memory/YYYY-MM-DD.md`. Việc nhắc mô hình lưu bộ nhớ thường sẽ giải quyết được vấn đề. Nếu nó vẫn tiếp tục quên, hãy xác minh rằng Gateway sử dụng cùng một không gian làm việc trong mọi lần chạy.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bộ nhớ có được duy trì mãi mãi không? Có những giới hạn nào?">
    Các tệp bộ nhớ nằm trên đĩa và được duy trì cho đến khi bị xóa; giới hạn là dung lượng lưu trữ của bạn, không phải mô hình. **Ngữ cảnh phiên** vẫn bị giới hạn bởi cửa sổ ngữ cảnh của mô hình, vì vậy các cuộc trò chuyện dài có thể được nén hoặc cắt bớt - đó là lý do tính năng tìm kiếm bộ nhớ tồn tại, chỉ đưa các phần liên quan trở lại ngữ cảnh.

    Tài liệu: [Bộ nhớ](/vi/concepts/memory), [Ngữ cảnh](/vi/concepts/context).

  </Accordion>

  <Accordion title="Tìm kiếm bộ nhớ ngữ nghĩa có yêu cầu khóa API OpenAI không?">
    Chỉ khi bạn sử dụng **embedding OpenAI**, đây là nhà cung cấp mặc định. OAuth của Codex hỗ trợ trò chuyện/hoàn thành và **không** cấp quyền truy cập embedding, vì vậy việc đăng nhập bằng Codex (OAuth hoặc thông tin đăng nhập Codex CLI) không bật tính năng tìm kiếm bộ nhớ ngữ nghĩa. Embedding OpenAI vẫn cần một khóa API thực (`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`).

    Để duy trì cục bộ, hãy đặt `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Các nhà cung cấp khác được hỗ trợ: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` hoặc `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, tương thích OpenAI và Voyage. Xem [Bộ nhớ](/vi/concepts/memory) và [Tìm kiếm bộ nhớ](/vi/concepts/memory-search) để biết chi tiết thiết lập.

  </Accordion>
</AccordionGroup>

## Vị trí lưu trữ trên đĩa

<AccordionGroup>
  <Accordion title="Tất cả dữ liệu được sử dụng với OpenClaw có được lưu cục bộ không?">
    Không: **trạng thái riêng của OpenClaw nằm cục bộ**, nhưng **các dịch vụ bên ngoài vẫn thấy những gì bạn gửi cho họ**.

    - **Cục bộ theo mặc định**: các phiên, tệp bộ nhớ, cấu hình và không gian làm việc nằm trên máy chủ Gateway (`~/.openclaw` cùng với thư mục không gian làm việc của bạn).
    - **Từ xa do cần thiết**: các thông báo được gửi đến nhà cung cấp mô hình (Anthropic/OpenAI/v.v.) sẽ đi tới API của họ, còn các nền tảng trò chuyện (Slack/Telegram/WhatsApp/v.v.) lưu trữ dữ liệu thông báo trên máy chủ của họ.
    - **Bạn kiểm soát phạm vi dữ liệu**: các mô hình cục bộ giữ lời nhắc trên máy của bạn, nhưng lưu lượng kênh vẫn đi qua máy chủ của kênh.

    Liên quan: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace), [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw lưu trữ dữ liệu ở đâu?">
    Mọi thứ nằm trong `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`):

    | Đường dẫn                                                               | Mục đích                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Cấu hình chính (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Dữ liệu nhập OAuth cũ (được sao chép vào hồ sơ xác thực trong lần sử dụng đầu tiên)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Hồ sơ xác thực (OAuth, khóa API, `keyRef`/`tokenRef` tùy chọn)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Dữ liệu bí mật tùy chọn được lưu trong tệp dành cho các nhà cung cấp SecretRef `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Tệp tương thích cũ (các mục `api_key` tĩnh đã được loại bỏ)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Trạng thái nhà cung cấp (ví dụ: `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Trạng thái theo tác nhân (agentDir + các cấu phần phiên cũ/lưu trữ)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Trạng thái SQLite theo tác nhân, bao gồm các hàng phiên và bản chép lời      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Nguồn di chuyển phiên cũ và các cấu phần lưu trữ/hỗ trợ      |

    Đường dẫn một tác nhân cũ `~/.openclaw/agent/*` được di chuyển bởi `openclaw doctor`.

    **Không gian làm việc** của bạn (AGENTS.md, tệp bộ nhớ, Skills, v.v.) nằm riêng biệt, được cấu hình qua `agents.defaults.workspace` (mặc định: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nên nằm ở đâu?">
    Các tệp này nằm trong **không gian làm việc của tác nhân**, không phải `~/.openclaw`.

    - **Không gian làm việc (theo tác nhân)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, tùy chọn `HEARTBEAT.md`. Thư mục gốc viết thường `memory.md` chỉ là dữ liệu đầu vào để sửa chữa phiên bản cũ; `openclaw doctor --fix` có thể hợp nhất nó vào `MEMORY.md` khi cả hai cùng tồn tại.
    - **Thư mục trạng thái (`~/.openclaw`)**: cấu hình, trạng thái kênh/nhà cung cấp, hồ sơ xác thực, phiên, nhật ký, Skills dùng chung (`~/.openclaw/skills`).

    Không gian làm việc mặc định là `~/.openclaw/workspace`, có thể cấu hình:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Nếu bot "quên" sau khi khởi động lại, hãy xác nhận Gateway sử dụng cùng một không gian làm việc trong mọi lần khởi chạy (chế độ từ xa sử dụng không gian làm việc của **máy chủ Gateway**, không phải máy tính xách tay cục bộ của bạn).

    Mẹo: đối với hành vi hoặc tùy chọn cần duy trì lâu dài, hãy yêu cầu bot **ghi nội dung đó vào AGENTS.md hoặc MEMORY.md** thay vì dựa vào lịch sử trò chuyện.

    Xem [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace) và [Bộ nhớ](/vi/concepts/memory).

  </Accordion>

  <Accordion title="Tôi có thể tăng kích thước SOUL.md không?">
    Có. `SOUL.md` là một trong các tệp khởi tạo không gian làm việc được đưa vào ngữ cảnh tác nhân. Giới hạn đưa vào mặc định cho mỗi tệp là `20000` ký tự; tổng ngân sách khởi tạo trên tất cả các tệp là `60000` ký tự.

    Thay đổi giá trị mặc định dùng chung:

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

    Hoặc ghi đè cho một tác nhân trong `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Sử dụng `/context` để kiểm tra kích thước thô so với kích thước được đưa vào và xem có xảy ra cắt bớt hay không. Giữ `SOUL.md` tập trung vào giọng điệu, lập trường và tính cách; đặt các quy tắc vận hành trong `AGENTS.md` và các dữ kiện lâu dài trong bộ nhớ.

    Xem [Ngữ cảnh](/vi/concepts/context) và [Cấu hình tác nhân](/vi/gateway/config-agents).

  </Accordion>

  <Accordion title="Chiến lược sao lưu được khuyến nghị">
    Đặt **không gian làm việc của tác nhân** trong một kho git **riêng tư** và sao lưu ở một nơi riêng tư (ví dụ: GitHub riêng tư). Cách này ghi lại bộ nhớ cùng các tệp AGENTS/SOUL/USER và cho phép bạn khôi phục "tâm trí" của trợ lý sau này.

    **Không** commit bất kỳ nội dung nào trong `~/.openclaw` (thông tin xác thực, phiên, token, dữ liệu bí mật được mã hóa). Để khôi phục đầy đủ, hãy sao lưu riêng không gian làm việc và thư mục trạng thái.

    Tài liệu: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Làm cách nào để gỡ cài đặt hoàn toàn OpenClaw?">
    Xem [Gỡ cài đặt](/vi/install/uninstall).
  </Accordion>

  <Accordion title="Tác nhân có thể làm việc bên ngoài không gian làm việc không?">
    Có. Không gian làm việc là **cwd mặc định** và điểm neo bộ nhớ, không phải sandbox cứng. Các đường dẫn tương đối được phân giải bên trong không gian làm việc; đường dẫn tuyệt đối có thể truy cập các vị trí khác trên máy chủ trừ khi sandbox được bật. Để cách ly, hãy sử dụng [`agents.defaults.sandbox`](/vi/gateway/sandboxing) hoặc cài đặt sandbox theo tác nhân. Để đặt một kho lưu trữ làm thư mục làm việc mặc định, hãy trỏ `workspace` của tác nhân đó đến thư mục gốc của kho lưu trữ - bản thân kho lưu trữ OpenClaw chỉ là mã nguồn, vì vậy hãy giữ không gian làm việc riêng biệt trừ khi bạn chủ đích muốn tác nhân làm việc bên trong đó.

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

  <Accordion title="Chế độ từ xa: kho lưu trữ phiên nằm ở đâu?">
    Trạng thái phiên thuộc quyền quản lý của **máy chủ Gateway**. Trong chế độ từ xa, kho lưu trữ phiên mà bạn quan tâm nằm trên máy từ xa, không phải máy tính xách tay cục bộ của bạn. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>
</AccordionGroup>

## Kiến thức cơ bản về cấu hình

<AccordionGroup>
  <Accordion title="Cấu hình có định dạng gì? Nó nằm ở đâu?">
    OpenClaw đọc cấu hình **JSON5** tùy chọn từ `$OPENCLAW_CONFIG_PATH` (mặc định: `~/.openclaw/openclaw.json`). Nếu thiếu tệp này, nó sử dụng các giá trị mặc định tương đối an toàn, bao gồm không gian làm việc mặc định là `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='Tôi đã đặt gateway.bind: "lan" (hoặc "tailnet") và giờ không có gì lắng nghe / giao diện báo chưa được cấp quyền'>
    Các liên kết không phải loopback **yêu cầu một đường dẫn xác thực Gateway hợp lệ**: xác thực bằng bí mật dùng chung (token hoặc mật khẩu), hoặc `gateway.auth.mode: "trusted-proxy"` phía sau proxy ngược nhận biết danh tính được cấu hình đúng.

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

    - `gateway.remote.token` / `.password` tự thân **không** bật xác thực Gateway cục bộ; các đường dẫn gọi cục bộ chỉ có thể sử dụng `gateway.remote.*` làm phương án dự phòng khi chưa đặt `gateway.auth.*`.
    - Đối với xác thực bằng mật khẩu, hãy đặt `gateway.auth.mode: "password"` cùng với `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
    - Nếu `gateway.auth.token` / `.password` được cấu hình rõ ràng qua SecretRef nhưng không thể phân giải, quá trình phân giải sẽ đóng khi lỗi (không có phương án dự phòng từ xa che giấu lỗi).
    - Các thiết lập giao diện điều khiển dùng bí mật chung xác thực qua `connect.params.auth.token` hoặc `connect.params.auth.password` (được lưu trong cài đặt ứng dụng/giao diện). Các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy` sử dụng tiêu đề yêu cầu thay thế - tránh đưa bí mật dùng chung vào URL.
    - Với `gateway.auth.mode: "trusted-proxy"`, proxy ngược loopback trên cùng máy chủ yêu cầu `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng và một mục loopback trong `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Tại sao giờ đây tôi cần token trên localhost?">
    OpenClaw thực thi xác thực Gateway theo mặc định, bao gồm cả loopback. Nếu không cấu hình đường dẫn xác thực rõ ràng, khi khởi động hệ thống sẽ chuyển sang chế độ token và tạo token chỉ dùng trong thời gian chạy cho lần khởi động đó, vì vậy các máy khách WS cục bộ phải xác thực. Điều này ngăn các tiến trình cục bộ khác gọi Gateway.

    Hãy cấu hình rõ ràng `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` hoặc `OPENCLAW_GATEWAY_PASSWORD` khi máy khách cần một bí mật ổn định qua các lần khởi động lại. Bạn cũng có thể chọn chế độ mật khẩu hoặc `trusted-proxy` cho proxy ngược nhận biết danh tính. Đối với loopback mở, hãy đặt rõ ràng `gateway.auth.mode: "none"`. `openclaw doctor --generate-gateway-token` tạo token bất kỳ lúc nào.

  </Accordion>

  <Accordion title="Tôi có phải khởi động lại sau khi thay đổi cấu hình không?">
    Gateway theo dõi cấu hình và hỗ trợ tải lại nóng: `gateway.reload.mode: "hybrid"` (mặc định) áp dụng nóng các thay đổi an toàn và khởi động lại đối với các thay đổi quan trọng. `hot`, `restart` và `off` cũng được hỗ trợ. Hầu hết thay đổi đối với `tools.*`, chính sách `agents.*`, `session.*` và `messages.*` được áp dụng ngay lập tức mà không cần bất kỳ thao tác tải lại nào; thay đổi liên kết/cổng `gateway.*` yêu cầu khởi động lại.
  </Accordion>

  <Accordion title="Làm cách nào để tắt các khẩu hiệu CLI hài hước?">
    Đặt `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ẩn văn bản khẩu hiệu nhưng giữ lại dòng tiêu đề/phiên bản của biểu ngữ.
    - `default`: luôn sử dụng `All your chats, one OpenClaw.`.
    - `random`: luân phiên các khẩu hiệu hài hước/theo mùa (hành vi mặc định).
    - Để không hiển thị biểu ngữ nào, hãy đặt biến môi trường `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Làm cách nào để bật tìm kiếm web (và tải nội dung web)?">
    `web_fetch` hoạt động mà không cần khóa API. `web_search` phụ thuộc vào nhà cung cấp bạn đã chọn:

    | Nhà cung cấp | Không cần khóa | Biến môi trường |
    | --- | --- | --- |
    | Brave | Không | `BRAVE_API_KEY` |
    | DuckDuckGo | Có (dựa trên HTML không chính thức) | - |
    | Exa | Không | `EXA_API_KEY` |
    | Firecrawl | Không | `FIRECRAWL_API_KEY` |
    | Gemini | Không | `GEMINI_API_KEY` |
    | Grok | Không (xAI OAuth hoặc khóa) | `XAI_API_KEY` |
    | Kimi | Không | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` |
    | MiniMax Search | Không | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` hoặc `MINIMAX_API_KEY` |
    | Ollama Web Search | Có (cần `ollama signin`) | - |
    | Perplexity | Không | `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY` |
    | SearXNG | Có (tự lưu trữ) | `SEARXNG_BASE_URL` |
    | Tavily | Không | `TAVILY_API_KEY` |

    Grok cũng có thể tái sử dụng xAI OAuth từ xác thực mô hình (`openclaw onboard --auth-choice xai-oauth`).

    **Khuyến nghị**: `openclaw configure --section web` và chọn một nhà cung cấp.

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
            provider: "firecrawl", // tùy chọn; bỏ qua để tự động phát hiện
          },
        },
      },
    }
    ```

    Cấu hình tìm kiếm web dành riêng cho từng nhà cung cấp nằm trong `plugins.entries.<plugin>.config.webSearch.*`. Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn được tải để tương thích nhưng không nên dùng trong cấu hình mới. Cấu hình dự phòng truy xuất web của Firecrawl nằm trong `plugins.entries.firecrawl.config.webFetch.*`.

    - Danh sách cho phép: thêm `web_search`/`web_fetch`/`x_search`, hoặc `group:web` cho cả ba.
    - `web_fetch` được bật theo mặc định.
    - Nếu bỏ qua `tools.web.fetch.provider`, OpenClaw sẽ tự động phát hiện nhà cung cấp dự phòng truy xuất khả dụng đầu tiên từ các thông tin xác thực hiện có; Plugin Firecrawl chính thức cung cấp phương án dự phòng đó.
    - Các tiến trình nền đọc biến môi trường từ `~/.openclaw/.env` (hoặc môi trường dịch vụ).

    Tài liệu: [Công cụ web](/vi/tools/web).

  </Accordion>

  <Accordion title="config.apply đã xóa cấu hình của tôi. Làm cách nào để khôi phục và tránh điều này?">
    `config.apply` thay thế **toàn bộ cấu hình**; một đối tượng không đầy đủ sẽ xóa mọi nội dung khác.

    OpenClaw hiện tại ngăn chặn phần lớn trường hợp vô tình ghi đè:

    - Các thao tác ghi cấu hình do OpenClaw thực hiện sẽ xác thực toàn bộ cấu hình sau thay đổi trước khi ghi.
    - Các thao tác ghi không hợp lệ hoặc có tính phá hủy do OpenClaw thực hiện sẽ bị từ chối và được lưu dưới dạng `openclaw.json.rejected.*`.
    - Một chỉnh sửa trực tiếp làm hỏng quá trình khởi động hoặc tải lại nóng sẽ khiến Gateway đóng khi lỗi hoặc bỏ qua lần tải lại; thao tác này không ghi lại `openclaw.json`.
    - `openclaw doctor --fix` chịu trách nhiệm sửa chữa, có thể khôi phục phiên bản tốt gần nhất đã biết và lưu tệp bị từ chối dưới dạng `openclaw.json.clobbered.*`.

    Khôi phục:

    - Kiểm tra `openclaw logs --follow` để tìm `Invalid config at`, `Config write rejected:` hoặc `config reload skipped (invalid config)`.
    - Kiểm tra `openclaw.json.clobbered.*` hoặc `openclaw.json.rejected.*` mới nhất bên cạnh cấu hình đang hoạt động.
    - Chạy `openclaw config validate` và `openclaw doctor --fix`.
    - Chỉ sao chép lại các khóa mong muốn bằng `openclaw config set` hoặc `config.patch`.
    - Nếu không có phiên bản tốt gần nhất đã biết hoặc nội dung bị từ chối: khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` rồi cấu hình lại các kênh/mô hình.
    - Nếu dữ liệu bị mất ngoài dự kiến: hãy gửi báo cáo lỗi kèm cấu hình gần nhất đã biết hoặc bản sao lưu. Một tác nhân lập trình cục bộ thường có thể tái tạo cấu hình hoạt động từ nhật ký hoặc lịch sử.

    Để tránh điều này: dùng `openclaw config set` cho các thay đổi nhỏ, `openclaw configure` để chỉnh sửa tương tác, `config.schema.lookup` để kiểm tra một đường dẫn chưa quen thuộc (trả về một nút lược đồ nông cùng phần tóm tắt các nút con trực tiếp), và `config.patch` cho các chỉnh sửa RPC một phần — chỉ dành `config.apply` cho việc thay thế toàn bộ cấu hình. Công cụ thời gian chạy `gateway` dành cho tác nhân từ chối ghi lại `tools.exec.ask` / `tools.exec.security` ngay cả thông qua các bí danh `tools.bash.*` cũ.

    Tài liệu: [Cấu hình](/vi/cli/config), [Thiết lập cấu hình](/vi/cli/configure), [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Làm cách nào để chạy một Gateway trung tâm với các worker chuyên biệt trên nhiều thiết bị?">
    Mô hình phổ biến: **một Gateway** (ví dụ Raspberry Pi) cùng với **các Node** và **các tác nhân**.

    - **Gateway (trung tâm)**: quản lý các kênh (Signal/WhatsApp), định tuyến và phiên.
    - **Các Node (thiết bị)**: máy Mac/iOS/Android kết nối dưới dạng thiết bị ngoại vi và cung cấp các công cụ cục bộ (`system.run`, `canvas`, `camera`).
    - **Các tác nhân (worker)**: những bộ não/không gian làm việc riêng biệt dành cho các vai trò chuyên biệt (ví dụ vận hành so với dữ liệu cá nhân).
    - **Tác nhân phụ**: tạo công việc nền từ một tác nhân chính để xử lý song song.
    - **TUI**: kết nối với Gateway và chuyển đổi tác nhân/phiên.

    Tài liệu: [Node](/vi/nodes), [Truy cập từ xa](/vi/gateway/remote), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [Tác nhân phụ](/vi/tools/subagents), [TUI](/vi/web/tui).

  </Accordion>

  <Accordion title="Trình duyệt OpenClaw có thể chạy ở chế độ headless không?">
    Có:

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

    Mặc định là `false` (có giao diện). Chế độ headless có nhiều khả năng kích hoạt cơ chế kiểm tra chống bot trên một số trang web (X/Twitter thường chặn các phiên headless). Chế độ này sử dụng cùng công cụ Chromium và hoạt động với hầu hết tác vụ tự động hóa; khác biệt chính là không có cửa sổ trình duyệt hiển thị (hãy dùng ảnh chụp màn hình để xem hình ảnh). Xem [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Làm cách nào để sử dụng Brave để điều khiển trình duyệt?">
    Đặt `browser.executablePath` thành tệp nhị phân Brave của bạn (hoặc bất kỳ trình duyệt dựa trên Chromium nào) rồi khởi động lại Gateway. Xem [Trình duyệt](/vi/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway và Node từ xa

<AccordionGroup>
  <Accordion title="Lệnh được truyền giữa Telegram, Gateway và các Node như thế nào?">
    Tin nhắn Telegram được **Gateway** xử lý; Gateway chạy tác nhân và chỉ sau đó mới gọi các Node qua **Gateway WebSocket** khi cần công cụ của Node:

    Telegram -> Gateway -> Tác nhân -> `node.*` -> Node -> Gateway -> Telegram

    Các Node không thấy lưu lượng đến từ nhà cung cấp; chúng chỉ nhận các lệnh gọi RPC dành cho Node.

  </Accordion>

  <Accordion title="Tác nhân của tôi có thể truy cập máy tính của tôi bằng cách nào nếu Gateway được lưu trữ từ xa?">
    Ghép nối máy tính của bạn dưới dạng một **Node**. Gateway chạy ở nơi khác nhưng có thể gọi các công cụ `node.*` (màn hình, camera, hệ thống) trên máy cục bộ của bạn qua Gateway WebSocket.

    1. Chạy Gateway trên máy chủ luôn bật (VPS/máy chủ gia đình).
    2. Đưa máy chủ Gateway và máy tính của bạn vào cùng một tailnet.
    3. Đảm bảo Gateway WS có thể truy cập được (liên kết tailnet hoặc đường hầm SSH).
    4. Mở ứng dụng macOS cục bộ và kết nối ở chế độ **Remote over SSH** (hoặc tailnet trực tiếp) để ứng dụng đăng ký dưới dạng một Node.
    5. Phê duyệt Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Không cần cầu nối TCP riêng; các Node kết nối qua Gateway WebSocket.

    Nhắc nhở về bảo mật: ghép nối một Node macOS cho phép `system.run` trên máy đó. Chỉ ghép nối các thiết bị mà bạn tin cậy; hãy xem lại [Bảo mật](/vi/gateway/security).

    Tài liệu: [Node](/vi/nodes), [Giao thức Gateway](/vi/gateway/protocol), [Chế độ từ xa trên macOS](/vi/platforms/mac/remote), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale đã kết nối nhưng tôi không nhận được phản hồi. Tiếp theo cần làm gì?">
    Kiểm tra các yếu tố cơ bản:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Sau đó xác minh xác thực và định tuyến: nếu dùng Tailscale Serve, hãy xác nhận `gateway.auth.allowTailscale` được đặt chính xác; nếu kết nối qua đường hầm SSH, hãy xác nhận đường hầm đang hoạt động và trỏ đến đúng cổng; xác nhận danh sách cho phép DM/nhóm có chứa tài khoản của bạn.

    Tài liệu: [Tailscale](/vi/gateway/tailscale), [Truy cập từ xa](/vi/gateway/remote), [Kênh](/vi/channels).

  </Accordion>

  <Accordion title="Hai phiên bản OpenClaw có thể giao tiếp với nhau không (cục bộ + VPS)?">
    Có, mặc dù không có cầu nối bot-với-bot tích hợp sẵn.

    **Đơn giản nhất**: sử dụng một kênh trò chuyện thông thường mà cả hai bot đều có thể truy cập (Slack/Telegram/WhatsApp). Cho Bot A gửi tin nhắn cho Bot B, sau đó để Bot B trả lời như bình thường.

    **Cầu nối CLI (chung)**: chạy một tập lệnh gọi Gateway còn lại bằng `openclaw agent --message ... --deliver`, nhắm đến một cuộc trò chuyện nơi bot kia đang lắng nghe. Nếu một bot nằm trên VPS từ xa, hãy trỏ CLI của bạn đến Gateway từ xa đó qua SSH/Tailscale (xem [Truy cập từ xa](/vi/gateway/remote)):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Thêm một biện pháp bảo vệ để hai bot không lặp vô hạn (chỉ phản hồi khi được đề cập, dùng danh sách cho phép của kênh hoặc quy tắc "không trả lời tin nhắn của bot").

    Tài liệu: [Truy cập từ xa](/vi/gateway/remote), [CLI tác nhân](/vi/cli/agent), [Gửi tác nhân](/vi/tools/agent-send).

  </Accordion>

  <Accordion title="Tôi có cần các VPS riêng biệt cho nhiều tác nhân không?">
    Không. Một Gateway lưu trữ nhiều tác nhân, mỗi tác nhân có không gian làm việc, giá trị mặc định của mô hình và định tuyến riêng — đây là thiết lập thông thường, rẻ và đơn giản hơn nhiều so với việc dùng một VPS cho mỗi tác nhân. Chỉ dùng các VPS riêng biệt khi cần cách ly nghiêm ngặt (ranh giới bảo mật) hoặc có các cấu hình rất khác nhau mà bạn không muốn dùng chung.
  </Accordion>

  <Accordion title="Việc sử dụng một Node trên máy tính xách tay cá nhân thay vì SSH từ VPS có lợi ích gì không?">
    Có: Node là cách chính thức để truy cập máy tính xách tay của bạn từ Gateway từ xa và mở khóa nhiều khả năng hơn quyền truy cập shell. Gateway chạy trên macOS/Linux (Windows qua WSL2) và có dung lượng nhẹ (một VPS nhỏ hoặc máy thuộc phân khúc Raspberry Pi là đủ; RAM 4 GB là dư dả), vì vậy thiết lập phổ biến là một máy chủ luôn bật cùng với máy tính xách tay của bạn làm Node.

    - **Không cần SSH chiều vào** — các Node chủ động kết nối đến Gateway WebSocket thông qua ghép nối thiết bị.
    - **Kiểm soát thực thi an toàn hơn** — `system.run` được kiểm soát bởi danh sách cho phép/phê duyệt của Node trên máy tính xách tay đó.
    - **Nhiều công cụ thiết bị hơn** — ngoài `system.run`, các Node còn cung cấp `canvas`, `camera` và `screen`.
    - **Tự động hóa trình duyệt cục bộ** — giữ Gateway trên VPS nhưng chạy Chrome cục bộ thông qua máy chủ Node, hoặc kết nối với Chrome cục bộ qua Chrome MCP.

    SSH phù hợp cho việc truy cập shell không thường xuyên; Node đơn giản hơn cho các quy trình tác nhân liên tục và tự động hóa thiết bị.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Trình duyệt](/vi/tools/browser).

  </Accordion>

  <Accordion title="Các Node có chạy dịch vụ Gateway không?">
    Không. Chỉ nên chạy **một Gateway** trên mỗi máy chủ, trừ khi bạn chủ ý chạy các hồ sơ tách biệt (xem [Nhiều Gateway](/vi/gateway/multiple-gateways)). Node là các thiết bị ngoại vi kết nối với Gateway (Node iOS/Android hoặc "chế độ Node" macOS trong ứng dụng thanh menu). Đối với máy chủ Node headless và điều khiển bằng CLI, xem [CLI máy chủ Node](/vi/cli/node).

    Cần khởi động lại hoàn toàn đối với `gateway`, `discovery` và các thay đổi trên bề mặt Plugin được lưu trữ.

  </Accordion>

  <Accordion title="Có cách nào áp dụng cấu hình qua API / RPC không?">
    Có:

    - `config.schema.lookup`: kiểm tra một cây con cấu hình cùng với nút lược đồ nông, gợi ý UI khớp và phần tóm tắt các phần tử con trực tiếp trước khi ghi.
    - `config.get`: truy xuất ảnh chụp nhanh hiện tại cùng với hàm băm.
    - `config.patch`: cập nhật một phần an toàn (ưu tiên cho hầu hết thao tác chỉnh sửa RPC); tải lại nóng khi có thể, khởi động lại khi cần.
    - `config.apply`: xác thực và thay thế toàn bộ cấu hình; tải lại nóng khi có thể, khởi động lại khi cần.
    - Công cụ thời gian chạy `gateway` dành cho tác nhân vẫn từ chối ghi lại `tools.exec.ask` / `tools.exec.security`; các bí danh `tools.bash.*` cũ được chuẩn hóa thành cùng các đường dẫn được bảo vệ.

  </Accordion>

  <Accordion title="Cấu hình hợp lý tối thiểu cho lần cài đặt đầu tiên">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Thiết lập không gian làm việc và giới hạn những người có thể kích hoạt bot.

  </Accordion>

  <Accordion title="Làm cách nào để thiết lập Tailscale trên VPS và kết nối từ máy Mac?">
    1. **Cài đặt + đăng nhập trên VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Cài đặt + đăng nhập trên máy Mac** bằng ứng dụng Tailscale, trong cùng tailnet.
    3. **Bật MagicDNS** trong bảng điều khiển quản trị Tailscale để VPS có tên ổn định.
    4. **Sử dụng tên máy chủ tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; Gateway WS `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Để sử dụng UI điều khiển mà không cần SSH, hãy dùng Tailscale Serve trên VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Thao tác này giữ gateway liên kết với loopback và cung cấp HTTPS qua Tailscale. Xem [Tailscale](/vi/gateway/tailscale).

  </Accordion>

  <Accordion title="Làm cách nào để kết nối một Node Mac với Gateway từ xa (Tailscale Serve)?">
    Serve cung cấp **UI điều khiển Gateway + WS**; các Node kết nối qua cùng điểm cuối Gateway WS.

    1. Đảm bảo VPS và máy Mac nằm trên cùng một tailnet.
    2. Sử dụng ứng dụng macOS ở chế độ Từ xa (đích SSH có thể là tên máy chủ tailnet) - ứng dụng sẽ tạo đường hầm cho cổng Gateway và kết nối dưới dạng một Node.
    3. Phê duyệt Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tài liệu: [Giao thức Gateway](/vi/gateway/protocol), [Khám phá](/vi/gateway/discovery), [chế độ từ xa trên macOS](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi nên cài đặt trên máy tính xách tay thứ hai hay chỉ thêm một Node?">
    Nếu chỉ cần **các công cụ cục bộ** (màn hình/camera/exec) trên máy tính xách tay thứ hai, hãy thêm máy đó làm **Node** - một Gateway, không trùng lặp cấu hình. Các công cụ Node cục bộ hiện chỉ hỗ trợ macOS. Chỉ cài đặt Gateway thứ hai khi cần **cách ly nghiêm ngặt** hoặc hai bot hoàn toàn riêng biệt.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes), [Nhiều gateway](/vi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Biến môi trường và cách tải .env

<AccordionGroup>
  <Accordion title="OpenClaw tải các biến môi trường như thế nào?">
    OpenClaw đọc các biến môi trường từ tiến trình cha (shell, launchd/systemd, CI, v.v.) và tải thêm:

    - `.env` từ thư mục làm việc hiện tại.
    - một phương án dự phòng toàn cục `.env` từ `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Cả hai tệp `.env` đều không ghi đè các biến môi trường hiện có. Các khóa thông tin xác thực của nhà cung cấp và định tuyến điểm cuối là ngoại lệ đối với `.env` của không gian làm việc: các khóa như `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, hoặc bất kỳ khóa nào kết thúc bằng `_ENDPOINT` (và các biến môi trường xác thực hoặc điểm cuối khác của nhà cung cấp tích hợp sẵn) sẽ bị bỏ qua trong `.env` của không gian làm việc và nên được đặt trong môi trường tiến trình, `~/.openclaw/.env`, hoặc cấu hình `env`.

    Các biến môi trường nội tuyến trong cấu hình chỉ áp dụng nếu chưa có trong môi trường tiến trình:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Xem [/environment](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và các nguồn.

  </Accordion>

  <Accordion title="Tôi đã khởi động Gateway qua dịch vụ và các biến môi trường của tôi biến mất. Giờ phải làm gì?">
    Có hai cách khắc phục:

    1. Đặt các khóa bị thiếu vào `~/.openclaw/.env` để chúng vẫn được tải ngay cả khi dịch vụ không kế thừa môi trường shell.
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
       Thao tác này chạy shell đăng nhập và chỉ nhập các khóa dự kiến còn thiếu (không bao giờ ghi đè). Các biến môi trường tương đương: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Tôi đã đặt COPILOT_GITHUB_TOKEN, nhưng trạng thái mô hình hiển thị "Shell env: off." Tại sao?'>
    `openclaw models status` cho biết **tính năng nhập môi trường shell** có được bật hay không. "Shell env: off" **không** có nghĩa là các biến môi trường của bạn bị thiếu - nó chỉ có nghĩa là OpenClaw sẽ không tự động tải shell đăng nhập của bạn.

    Nếu Gateway chạy dưới dạng dịch vụ (launchd/systemd), nó sẽ không kế thừa môi trường shell của bạn. Hãy khắc phục bằng cách đặt token vào `~/.openclaw/.env`, bật `env.shellEnv.enabled: true`, hoặc thêm token vào cấu hình `env` (chỉ áp dụng nếu còn thiếu), sau đó khởi động lại gateway và kiểm tra lại:

    ```bash
    openclaw models status
    ```

    Token Copilot được phân giải theo thứ tự sau: `OPENCLAW_GITHUB_TOKEN`, rồi `COPILOT_GITHUB_TOKEN`, tiếp theo `GH_TOKEN`, rồi `GITHUB_TOKEN`.

    Xem [/concepts/model-providers](/vi/concepts/model-providers) và [/environment](/vi/help/environment).

  </Accordion>
</AccordionGroup>

## Phiên và nhiều cuộc trò chuyện

<AccordionGroup>
  <Accordion title="Làm cách nào để bắt đầu một cuộc trò chuyện mới?">
    Gửi `/new` hoặc `/reset` dưới dạng tin nhắn độc lập. Xem [Quản lý phiên](/vi/concepts/session).
  </Accordion>

  <Accordion title="Các phiên có tự động đặt lại nếu tôi không bao giờ gửi /new không?">
    Có. Chính sách đặt lại mặc định là **hằng ngày**: một phiên sẽ chuyển sang phiên mới vào giờ địa phương được cấu hình trên máy chủ gateway (`session.reset.atHour`, mặc định `4`, 0-23), dựa trên thời điểm phiên hiện tại bắt đầu. Thay vào đó, chuyển sang đặt lại dựa trên thời gian nhàn rỗi bằng `mode: "idle"` và `session.reset.idleMinutes`, cơ chế này làm hết hạn phiên sau một khoảng thời gian không hoạt động (dựa trên tương tác thực gần nhất, không phải các sự kiện hệ thống heartbeat/cron/exec).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` hỗ trợ `direct` (bí danh cũ `dm`), `group` và `thread`. `session.idleMinutes` cấp cao nhất cũ vẫn hoạt động như một bí danh tương thích cho giá trị mặc định ở chế độ nhàn rỗi khi không đặt khối `session.reset`/`resetByType`. Các phiên có phiên CLI đang hoạt động do nhà cung cấp sở hữu sẽ không bị ngắt bởi giá trị mặc định hằng ngày ngầm định. Xem [Quản lý phiên](/vi/concepts/session) để biết toàn bộ vòng đời.

  </Accordion>

  <Accordion title="Có cách nào tạo một nhóm các phiên bản OpenClaw (một CEO và nhiều tác nhân) không?">
    Có, thông qua **định tuyến đa tác nhân** và **tác nhân con**: một tác nhân điều phối cùng nhiều tác nhân thực thi có không gian làm việc và mô hình riêng.

    Tốt nhất nên xem đây là một thử nghiệm thú vị - cách này tiêu tốn nhiều token và thường kém hiệu quả hơn một bot có các phiên riêng biệt. Mô hình điển hình là một bot mà bạn tương tác, sử dụng các phiên khác nhau cho công việc song song và tạo tác nhân con khi cần.

    Tài liệu: [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [Tác nhân con](/vi/tools/subagents), [CLI tác nhân](/vi/cli/agents).

  </Accordion>

  <Accordion title="Tại sao ngữ cảnh bị cắt bớt giữa tác vụ? Làm cách nào để ngăn việc này?">
    Ngữ cảnh phiên bị giới hạn bởi cửa sổ ngữ cảnh của mô hình. Các cuộc trò chuyện dài, đầu ra công cụ lớn hoặc nhiều tệp có thể kích hoạt Compaction hoặc cắt bớt.

    - Yêu cầu bot tóm tắt trạng thái hiện tại và ghi vào một tệp.
    - Sử dụng `/compact` trước các tác vụ dài, `/new` khi chuyển chủ đề.
    - Lưu giữ ngữ cảnh quan trọng trong không gian làm việc và yêu cầu bot đọc lại.
    - Sử dụng tác nhân con cho công việc dài hoặc song song để cuộc trò chuyện chính gọn hơn.
    - Chọn mô hình có cửa sổ ngữ cảnh lớn hơn nếu việc này thường xuyên xảy ra.

  </Accordion>

  <Accordion title="Làm cách nào để đặt lại hoàn toàn OpenClaw nhưng vẫn giữ cài đặt?">
    ```bash
    openclaw reset
    ```

    Đặt lại toàn bộ không tương tác:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sau đó chạy lại quy trình thiết lập:

    ```bash
    openclaw onboard --install-daemon
    ```

    Quy trình hướng dẫn thiết lập cũng cung cấp tùy chọn **Đặt lại** nếu phát hiện cấu hình hiện có; xem [Hướng dẫn thiết lập (CLI)](/vi/start/wizard). Nếu bạn đã sử dụng hồ sơ (`--profile` / `OPENCLAW_PROFILE`), hãy đặt lại từng thư mục trạng thái (mặc định `~/.openclaw-<profile>`). Đặt lại chỉ dành cho phát triển: `openclaw gateway --dev --reset` xóa cấu hình phát triển, thông tin xác thực, phiên và không gian làm việc.

  </Accordion>

  <Accordion title='Tôi gặp lỗi "context too large" - làm cách nào để đặt lại hoặc thu gọn?'>
    - **Thu gọn** (giữ nguyên cuộc trò chuyện, tóm tắt các lượt cũ): `/compact` hoặc `/compact <instructions>` để hướng dẫn nội dung tóm tắt.
    - **Đặt lại** (ID phiên mới cho cùng khóa trò chuyện): `/new` hoặc `/reset`.

    Nếu vấn đề tiếp tục xảy ra, hãy điều chỉnh **cắt tỉa phiên** (`agents.defaults.contextPruning`) để loại bớt đầu ra công cụ cũ hoặc sử dụng mô hình có cửa sổ ngữ cảnh lớn hơn.

    Tài liệu: [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning), [Quản lý phiên](/vi/concepts/session).

  </Accordion>

  <Accordion title='Tại sao tôi thấy lỗi "LLM request rejected: messages.content.tool_use.input field required"?'>
    Lỗi xác thực của nhà cung cấp: mô hình đã tạo một khối `tool_use` không có `input` bắt buộc. Điều này thường có nghĩa là lịch sử phiên đã cũ hoặc bị hỏng (thường xảy ra sau các luồng dài hoặc khi công cụ/lược đồ thay đổi).

    Cách khắc phục: bắt đầu một phiên mới bằng `/new` (tin nhắn độc lập).

  </Accordion>

  <Accordion title="Tại sao tôi nhận được tin nhắn Heartbeat mỗi 30 phút?">
    Heartbeat chạy mỗi **30m** theo mặc định hoặc **1h** khi chế độ xác thực được phân giải là xác thực OAuth/token của Anthropic (bao gồm tái sử dụng Claude CLI) và chưa đặt `heartbeat.every`. Điều chỉnh hoặc vô hiệu hóa:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // hoặc "0m" để vô hiệu hóa
          },
        },
      },
    }
    ```

    Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có các dòng trống, chú thích Markdown/HTML, tiêu đề ATX, dấu phân cách khối mã hoặc mục danh sách rỗng), OpenClaw sẽ bỏ qua lần chạy Heartbeat để tiết kiệm lệnh gọi API. Nếu tệp không tồn tại, Heartbeat vẫn chạy và mô hình quyết định việc cần làm.

    Các giá trị ghi đè theo từng tác nhân sử dụng `agents.list[].heartbeat`. Tài liệu: [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>

  <Accordion title='Tôi có cần thêm một "tài khoản bot" vào nhóm WhatsApp không?'>
    Không. OpenClaw chạy trên **tài khoản của chính bạn** - nếu bạn ở trong nhóm, OpenClaw có thể thấy nhóm đó. Theo mặc định, phản hồi trong nhóm bị chặn cho đến khi bạn cho phép người gửi (`groupPolicy: "allowlist"`).

    Để chỉ cho phép phản hồi nhóm đối với bạn:

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
    Cách nhanh nhất: theo dõi nhật ký và gửi một tin nhắn thử nghiệm trong nhóm.

    ```bash
    openclaw logs --follow --json
    ```

    Tìm `chatId` (hoặc `from`) kết thúc bằng `@g.us`, chẳng hạn như `1234567890-1234567890@g.us`.

    Nếu đã được cấu hình/đưa vào danh sách cho phép, hãy liệt kê các nhóm từ cấu hình:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Thư mục](/vi/cli/directory), [Nhật ký](/vi/cli/logs).

  </Accordion>

  <Accordion title="Tại sao OpenClaw không trả lời trong nhóm?">
    Hai nguyên nhân phổ biến: tính năng giới hạn theo lượt đề cập được bật theo mặc định (bạn phải @đề cập bot hoặc khớp với `mentionPatterns`), hoặc bạn đã cấu hình `channels.whatsapp.groups` mà không có `"*"` và nhóm không nằm trong danh sách cho phép.

    Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).

  </Accordion>

  <Accordion title="Nhóm/luồng có dùng chung ngữ cảnh với tin nhắn trực tiếp không?">
    Theo mặc định, các cuộc trò chuyện trực tiếp được hợp nhất vào phiên chính. Nhóm/kênh có khóa phiên riêng, còn chủ đề Telegram / luồng Discord là các phiên riêng biệt. Xem [Nhóm](/vi/channels/groups) và [Tin nhắn nhóm](/vi/channels/group-messages).
  </Accordion>

  <Accordion title="Tôi có thể tạo bao nhiêu không gian làm việc và tác tử?">
    Không có giới hạn cứng — vài chục hoặc thậm chí vài trăm đều không vấn đề, nhưng cần lưu ý:

    - **Dung lượng ổ đĩa tăng**: các phiên đang hoạt động và bản ghi hội thoại nằm trong cơ sở dữ liệu SQLite của từng tác tử; các thành phần cũ/lưu trữ vẫn có thể tích tụ trong `~/.openclaw/agents/<agentId>/sessions/`.
    - **Chi phí token**: nhiều tác tử hơn đồng nghĩa với mức sử dụng mô hình đồng thời cao hơn.
    - **Chi phí vận hành**: hồ sơ xác thực, không gian làm việc và định tuyến kênh cho từng tác tử.

    Chỉ duy trì một không gian làm việc **đang hoạt động** cho mỗi tác tử (`agents.defaults.workspace`), dọn các phiên cũ bằng `openclaw sessions cleanup` nếu dung lượng ổ đĩa tăng (không chỉnh sửa thủ công trạng thái SQLite đang hoạt động), và dùng `openclaw doctor` để phát hiện không gian làm việc thừa và hồ sơ không khớp.

  </Accordion>

  <Accordion title="Tôi có thể chạy đồng thời nhiều bot hoặc cuộc trò chuyện (Slack) không và nên thiết lập như thế nào?">
    Có, thông qua **Định tuyến đa tác tử**: chạy nhiều tác tử biệt lập và định tuyến tin nhắn đến theo kênh/tài khoản/đối tượng ngang hàng. Slack được hỗ trợ dưới dạng một kênh và có thể được liên kết với các tác tử cụ thể.

    Quyền truy cập trình duyệt rất mạnh nhưng không phải là "làm được mọi thứ con người có thể làm" — cơ chế chống bot, CAPTCHA và MFA vẫn có thể chặn tự động hóa. Để kiểm soát đáng tin cậy nhất, hãy dùng Chrome MCP cục bộ trên máy chủ hoặc CDP trên máy thực sự chạy trình duyệt.

    Thiết lập theo phương pháp hay nhất: máy chủ Gateway luôn bật (VPS/Mac mini), một tác tử cho mỗi vai trò (liên kết), các kênh Slack được liên kết với những tác tử đó và trình duyệt cục bộ thông qua Chrome MCP hoặc một Node khi cần.

    Tài liệu: [Định tuyến đa tác tử](/vi/concepts/multi-agent), [Slack](/vi/channels/slack), [Trình duyệt](/vi/tools/browser), [Node](/vi/nodes).

  </Accordion>
</AccordionGroup>

## Mô hình, chuyển đổi dự phòng và hồ sơ xác thực

Các câu hỏi và câu trả lời về mô hình — giá trị mặc định, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng, hồ sơ xác thực — có trong [Câu hỏi thường gặp về mô hình](/vi/help/faq-models).

## Gateway: cổng, "đã chạy" và chế độ từ xa

<AccordionGroup>
  <Accordion title="Gateway sử dụng cổng nào?">
    `gateway.port` kiểm soát cổng ghép kênh duy nhất cho WebSocket + HTTP (Giao diện điều khiển, hook, v.v.). Thứ tự ưu tiên:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Tại sao openclaw gateway status báo "Runtime: running" nhưng "Connectivity probe: failed"?'>
    "Đang chạy" là góc nhìn của **trình giám sát** (launchd/systemd/schtasks); phép thăm dò kết nối là việc CLI thực sự kết nối đến WebSocket của Gateway. Hãy tin các dòng sau từ `openclaw gateway status`: `Probe target:` (URL mà phép thăm dò đã dùng), `Listening:` (thành phần thực sự được liên kết với cổng), `Last gateway error:` (nguyên nhân gốc phổ biến khi tiến trình còn hoạt động nhưng cổng không lắng nghe).
  </Accordion>

  <Accordion title='Tại sao openclaw gateway status hiển thị "Config (cli)" và "Config (service)" khác nhau?'>
    Bạn đang chỉnh sửa một tệp cấu hình trong khi dịch vụ chạy bằng một tệp khác (thường là do `--profile` / `OPENCLAW_STATE_DIR` không khớp).

    Để khắc phục, hãy chạy từ cùng `--profile` / môi trường mà bạn muốn dịch vụ sử dụng:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='"another gateway instance is already listening" có nghĩa là gì?'>
    OpenClaw áp dụng khóa thời gian chạy bằng cách liên kết trình lắng nghe WebSocket ngay khi khởi động (mặc định `ws://127.0.0.1:18789`). Nếu thao tác liên kết thất bại với `EADDRINUSE`, hệ thống sẽ đưa ra `GatewayLockError` ("một phiên bản Gateway khác đang lắng nghe").

    Khắc phục: dừng phiên bản khác, giải phóng cổng hoặc chạy với `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Làm cách nào để chạy OpenClaw ở chế độ từ xa (máy khách kết nối đến Gateway ở nơi khác)?">
    Đặt `gateway.mode: "remote"` và trỏ đến một URL WebSocket từ xa, có thể kèm theo thông tin xác thực từ xa bằng bí mật dùng chung:

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

    - `openclaw gateway` chỉ khởi động khi `gateway.mode` là `local` (hoặc bạn truyền cờ ghi đè).
    - Ứng dụng macOS theo dõi tệp cấu hình và chuyển đổi chế độ trực tiếp khi các giá trị này thay đổi.
    - `gateway.remote.token` / `.password` chỉ là thông tin xác thực từ xa phía máy khách; chúng không tự bật xác thực Gateway cục bộ.

  </Accordion>

  <Accordion title='Giao diện điều khiển báo "unauthorized" (hoặc liên tục kết nối lại). Phải làm gì?'>
    Đường dẫn xác thực Gateway và phương thức xác thực của giao diện không khớp.

    Thông tin thực tế (từ mã nguồn):

    - Giao diện điều khiển lưu token trong `sessionStorage`, giới hạn trong tab trình duyệt hiện tại và URL Gateway đã chọn, vì vậy việc làm mới trong cùng tab vẫn hoạt động mà không cần lưu token lâu dài trong localStorage.
    - Trên `AUTH_TOKEN_MISMATCH`, các máy khách đáng tin cậy có thể thử lại một lần có giới hạn bằng token thiết bị được lưu vào bộ nhớ đệm khi Gateway trả về gợi ý thử lại (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Lần thử lại bằng token lưu đệm đó sử dụng lại các phạm vi đã được phê duyệt và lưu cùng token thiết bị; các bên gọi `deviceToken` rõ ràng / `scopes` rõ ràng giữ nguyên tập hợp phạm vi được yêu cầu thay vì kế thừa phạm vi lưu đệm.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là token/mật khẩu dùng chung được chỉ định rõ trước tiên, sau đó là `deviceToken` được chỉ định rõ, rồi token thiết bị đã lưu và cuối cùng là token khởi tạo.
    - Quá trình khởi tạo bằng mã thiết lập tích hợp trả về token thiết bị Node với `scopes: []` cùng một token chuyển giao cho người vận hành có giới hạn để thực hiện quy trình làm quen trên thiết bị di động đáng tin cậy. Quyền chuyển giao cho người vận hành có thể đọc cấu hình gốc trong thời gian thiết lập nhưng không cấp phạm vi thay đổi ghép nối hoặc `operator.admin`.

    Khắc phục:

    - Nhanh nhất: `openclaw dashboard` (in + sao chép URL bảng điều khiển, thử mở; hiển thị gợi ý SSH nếu không có giao diện đồ họa).
    - Chưa có token: `openclaw doctor --generate-gateway-token`.
    - Từ xa: trước tiên tạo đường hầm bằng `ssh -N -L 18789:127.0.0.1:18789 user@host`, sau đó mở `http://127.0.0.1:18789/`.
    - Chế độ bí mật dùng chung: đặt `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, sau đó dán bí mật tương ứng vào phần cài đặt Giao diện điều khiển.
    - Chế độ Tailscale Serve: xác nhận `gateway.auth.allowTailscale` đã được bật và bạn đang mở URL Serve, không phải URL loopback/tailnet thô bỏ qua các tiêu đề danh tính Tailscale.
    - Chế độ proxy đáng tin cậy: xác nhận bạn đang truy cập thông qua proxy nhận biết danh tính đã cấu hình. Proxy loopback trên cùng máy chủ cũng cần `gateway.auth.trustedProxy.allowLoopback = true`.
    - Nếu vẫn không khớp sau một lần thử lại: luân chuyển/phê duyệt lại token thiết bị đã ghép nối:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Nếu bị từ chối luân chuyển: phiên thiết bị đã ghép nối chỉ có thể luân chuyển thiết bị của **chính mình**, trừ khi phiên đó cũng có `operator.admin`, và các giá trị `--scope` được chỉ định rõ không thể vượt quá phạm vi người vận hành hiện tại của bên gọi.
    - Nếu vẫn bị kẹt: `openclaw status --all` cùng với [Khắc phục sự cố](/vi/gateway/troubleshooting). Xem [Bảng điều khiển](/vi/web/dashboard) để biết chi tiết xác thực.

  </Accordion>

  <Accordion title="Tôi đặt gateway.bind thành tailnet nhưng nó chỉ lắng nghe trên loopback">
    Liên kết `tailnet` chọn một địa chỉ IP Tailscale từ các giao diện mạng của bạn (100.64.0.0/10). Nếu máy không kết nối với Tailscale (hoặc giao diện bị ngắt), Gateway sẽ quay về loopback thay vì để lộ một giao diện mạng khác.

    Khắc phục: khởi động Tailscale trên máy chủ đó và khởi động lại Gateway, hoặc chuyển rõ ràng sang `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` là lựa chọn rõ ràng; `auto` ưu tiên loopback. Dùng `gateway.bind: "tailnet"` để giới hạn việc truy cập không qua loopback trong Tailnet, đồng thời duy trì trình lắng nghe `127.0.0.1` bắt buộc trên cùng máy chủ.

  </Accordion>

  <Accordion title="Tôi có thể chạy nhiều Gateway trên cùng một máy chủ không?">
    Thường là không — một Gateway có thể chạy nhiều kênh nhắn tin và tác tử. Chỉ dùng nhiều Gateway để dự phòng (ví dụ bot cứu hộ) hoặc cách ly nghiêm ngặt, đồng thời cách ly từng Gateway bằng `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` riêng và `gateway.port` duy nhất.

    Khuyến nghị: `openclaw --profile <name> ...` cho mỗi phiên bản (tự động tạo `~/.openclaw-<name>`), một `gateway.port` duy nhất cho mỗi cấu hình hồ sơ (hoặc `--port` cho các lần chạy thủ công) và một dịch vụ cho mỗi hồ sơ với `openclaw --profile <name> gateway install`.

    Hồ sơ cũng thêm hậu tố vào tên dịch vụ: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. Đơn vị systemd `openclaw-gateway` không có định danh chỉ tồn tại cho hồ sơ mặc định; tên đơn vị systemd cũ trước khi đổi tên là `clawdbot-gateway` được di chuyển tự động.

    Hướng dẫn đầy đủ: [Nhiều Gateway](/vi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / mã 1008 có nghĩa là gì?'>
    Gateway là một **máy chủ WebSocket** và yêu cầu tin nhắn đầu tiên phải là khung `connect`. Bất kỳ nội dung nào khác sẽ đóng kết nối với **mã 1008** (vi phạm chính sách).

    Nguyên nhân phổ biến: bạn đã mở URL **HTTP** trong trình duyệt thay vì máy khách WS, sử dụng sai cổng/đường dẫn hoặc proxy/đường hầm đã loại bỏ tiêu đề xác thực hay gửi một yêu cầu không dành cho Gateway.

    Khắc phục: sử dụng URL WS (`ws://<host>:18789` hoặc `wss://...` qua HTTPS), không mở cổng WS trong tab trình duyệt thông thường và thêm token/mật khẩu vào khung `connect` khi xác thực được bật. Ví dụ CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Ghi nhật ký và gỡ lỗi

<AccordionGroup>
  <Accordion title="Nhật ký nằm ở đâu?">
    Nhật ký tệp (có cấu trúc): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Đặt đường dẫn ổn định qua `logging.file`; mức nhật ký tệp qua `logging.level`; độ chi tiết của bảng điều khiển qua `--verbose` và `logging.consoleLevel`.

    Cách theo dõi nhanh nhất:

    ```bash
    openclaw logs --follow
    ```

    Nhật ký dịch vụ/trình giám sát (khi Gateway chạy qua launchd/systemd):

    - stdout của launchd trên macOS: `~/Library/Logs/openclaw/gateway.log` (hồ sơ sử dụng `gateway-<profile>.log`; stderr bị chặn).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Xem [Khắc phục sự cố](/vi/gateway/troubleshooting) để biết thêm thông tin.

  </Accordion>

  <Accordion title="Làm cách nào để khởi động/dừng/khởi động lại dịch vụ Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Nếu bạn chạy Gateway thủ công, `openclaw gateway --force` có thể giành lại cổng. Xem [Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Tôi đã đóng cửa sổ dòng lệnh trên Windows — làm cách nào để khởi động lại OpenClaw?">
    Ba chế độ cài đặt trên Windows:

    **1) Thiết lập Windows Hub cục bộ**: ứng dụng gốc quản lý một Gateway WSL cục bộ thuộc sở hữu của ứng dụng. Mở **OpenClaw Companion** từ menu Start hoặc khay hệ thống, sau đó dùng **Gateway Setup** hoặc thẻ Connections.

    **2) Gateway WSL2 thủ công**: Gateway chạy bên trong Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Nếu bạn chưa từng cài đặt dịch vụ, hãy khởi động nó ở tiền cảnh: `openclaw gateway run`.

    **3) CLI/Gateway Windows gốc**: chạy trực tiếp trong Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Nếu bạn chạy thủ công (không dùng dịch vụ): `openclaw gateway run`.

    Tài liệu: [Windows](/vi/platforms/windows), [Hướng dẫn vận hành dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Gateway đang hoạt động nhưng không bao giờ nhận được phản hồi. Cần kiểm tra gì?">
    Kiểm tra nhanh tình trạng hệ thống:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Nguyên nhân thường gặp: thông tin xác thực mô hình chưa được tải trên **máy chủ gateway** (kiểm tra `models status`), ghép cặp/danh sách cho phép của kênh đang chặn phản hồi (kiểm tra cấu hình và nhật ký kênh), hoặc WebChat/Bảng điều khiển được mở mà không có token phù hợp. Nếu truy cập từ xa, hãy xác nhận đường hầm/kết nối Tailscale đang hoạt động và có thể truy cập WebSocket của Gateway.

    Tài liệu: [Kênh](/vi/channels), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title='"Đã ngắt kết nối khỏi gateway: không có lý do" - giờ phải làm gì?'>
    Thường có nghĩa là giao diện người dùng đã mất kết nối WebSocket. Kiểm tra: Gateway có đang chạy không (`openclaw gateway status`)? Gateway có hoạt động bình thường không (`openclaw status`)? Giao diện người dùng có token phù hợp không (`openclaw dashboard`)? Nếu truy cập từ xa, liên kết đường hầm/Tailscale có đang hoạt động không?

    Sau đó theo dõi nhật ký:

    ```bash
    openclaw logs --follow
    ```

    Tài liệu: [Bảng điều khiển](/vi/web/dashboard), [Truy cập từ xa](/vi/gateway/remote), [Khắc phục sự cố](/vi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands của Telegram thất bại. Cần kiểm tra gì?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sau đó đối chiếu lỗi:

    - `BOT_COMMANDS_TOO_MUCH`: trình đơn Telegram có quá nhiều mục. OpenClaw đã tự động cắt giảm theo giới hạn của Telegram và thử lại với ít lệnh hơn, nhưng một số mục trong trình đơn vẫn có thể bị loại bỏ. Hãy giảm số lượng lệnh của plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native` nếu bạn không cần trình đơn.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` hoặc các lỗi mạng tương tự: trên VPS hoặc khi ở sau proxy, hãy xác nhận HTTPS đi ra được cho phép và DNS hoạt động với `api.telegram.org`.

    Nếu Gateway ở xa, hãy kiểm tra nhật ký trên máy chủ Gateway.

    Tài liệu: [Telegram](/vi/channels/telegram), [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI không hiển thị đầu ra. Cần kiểm tra gì?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Trong TUI, dùng `/status` để xem trạng thái hiện tại. Nếu bạn mong đợi phản hồi trong một kênh trò chuyện, hãy xác nhận tính năng gửi tin đã được bật (`/deliver on`).

    Tài liệu: [TUI](/vi/web/tui), [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm cách nào để dừng hoàn toàn rồi khởi động Gateway?">
    Nếu bạn đã cài đặt dịch vụ (launchd trên macOS, systemd trên Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Khi chạy ở nền trước, dừng bằng Ctrl-C, sau đó `openclaw gateway run`.

    Tài liệu: [Hướng dẫn vận hành dịch vụ Gateway](/vi/gateway).

  </Accordion>

  <Accordion title="Giải thích đơn giản: openclaw gateway restart khác openclaw gateway như thế nào">
    `openclaw gateway restart` khởi động lại **dịch vụ nền** (launchd/systemd). `openclaw gateway` chạy gateway **ở nền trước** trong phiên terminal này. Sử dụng các lệnh con của gateway nếu bạn đã cài đặt dịch vụ; sử dụng lệnh chạy trực tiếp ở nền trước cho một lần chạy riêng lẻ.
  </Accordion>

  <Accordion title="Cách nhanh nhất để xem thêm chi tiết khi xảy ra lỗi">
    Khởi động Gateway với `--verbose` để xem thêm chi tiết trên bảng điều khiển, sau đó kiểm tra tệp nhật ký để tìm lỗi xác thực kênh, định tuyến mô hình và RPC.
  </Accordion>
</AccordionGroup>

## Phương tiện và tệp đính kèm

<AccordionGroup>
  <Accordion title="Skill của tôi đã tạo hình ảnh/PDF nhưng không có gì được gửi">
    Tệp đính kèm gửi đi từ tác nhân phải sử dụng các trường phương tiện có cấu trúc như `media`, `mediaUrl`, `path` hoặc `filePath`. Xem [Thiết lập trợ lý OpenClaw](/vi/start/openclaw) và [Tác nhân gửi](/vi/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Đây nhé" --media /path/to/file.png
    ```

    Đồng thời kiểm tra: kênh đích hỗ trợ phương tiện gửi đi và không bị danh sách cho phép chặn; tệp nằm trong giới hạn kích thước của nhà cung cấp (hình ảnh được đổi kích thước để cạnh dài nhất tối đa là 2048px); `tools.fs.workspaceOnly=true` giới hạn việc gửi bằng đường dẫn cục bộ trong không gian làm việc, kho tạm thời/phương tiện và các tệp đã được sandbox xác thực; `tools.fs.workspaceOnly=false` (mặc định) cho phép việc gửi phương tiện cục bộ có cấu trúc sử dụng các tệp cục bộ trên máy chủ mà tác nhân đã có thể đọc, áp dụng cho phương tiện cùng các loại tài liệu an toàn (hình ảnh, âm thanh, video, PDF, tài liệu Office và tài liệu văn bản đã được xác thực như Markdown/MD, TXT, JSON, YAML/YML). Đây không phải là trình quét bí mật — một tệp `secret.txt` hoặc `config.json` mà tác nhân có thể đọc có thể được đính kèm khi phần mở rộng và quá trình xác thực nội dung khớp nhau. Hãy giữ các tệp nhạy cảm bên ngoài những đường dẫn mà tác nhân có thể đọc hoặc giữ `tools.fs.workspaceOnly=true` để áp dụng quy tắc gửi bằng đường dẫn cục bộ nghiêm ngặt hơn.

    Xem [Hình ảnh](/vi/nodes/images).

  </Accordion>
</AccordionGroup>

## Bảo mật và kiểm soát truy cập

<AccordionGroup>
  <Accordion title="Có an toàn khi cho phép tin nhắn trực tiếp gửi đến OpenClaw không?">
    Hãy coi tin nhắn trực tiếp đến là dữ liệu đầu vào không đáng tin cậy. Các giá trị mặc định giúp giảm rủi ro:

    - Hành vi mặc định trên các kênh hỗ trợ tin nhắn trực tiếp là **ghép cặp**: người gửi không xác định sẽ nhận được mã ghép cặp và tin nhắn của họ không được xử lý. Phê duyệt bằng `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Số yêu cầu đang chờ được giới hạn ở **3 yêu cầu trên mỗi kênh**; kiểm tra `openclaw pairing list --channel <channel> [--account <id>]` nếu không nhận được mã.
    - Việc công khai tin nhắn trực tiếp yêu cầu chủ động bật rõ ràng (`dmPolicy: "open"` và danh sách cho phép `"*"`).

    Chạy `openclaw doctor` để phát hiện các chính sách tin nhắn trực tiếp có rủi ro.

  </Accordion>

  <Accordion title="Chèn lệnh qua prompt có phải chỉ đáng lo ngại đối với bot công khai không?">
    Không. Chèn lệnh qua prompt liên quan đến **nội dung không đáng tin cậy**, không chỉ là ai có thể gửi tin nhắn trực tiếp cho bot. Nếu trợ lý của bạn đọc nội dung bên ngoài (tìm kiếm/truy xuất web, trang trình duyệt, email, tài liệu, tệp đính kèm, nhật ký được dán), nội dung đó có thể chứa các chỉ dẫn nhằm chiếm quyền điều khiển mô hình — ngay cả khi bạn là người gửi duy nhất.

    Rủi ro lớn nhất xuất hiện khi các công cụ được bật: mô hình có thể bị lừa để làm rò rỉ ngữ cảnh hoặc gọi công cụ thay mặt bạn. Giảm phạm vi ảnh hưởng:

    - sử dụng tác nhân "đọc" chỉ có quyền đọc hoặc bị tắt công cụ để tóm tắt nội dung không đáng tin cậy
    - tắt `web_search` / `web_fetch` / `browser` đối với tác nhân được bật công cụ
    - cũng coi văn bản được giải mã từ tệp/tài liệu là không đáng tin cậy: `input_file` của OpenResponses và quá trình trích xuất tệp phương tiện đính kèm đều bao bọc văn bản được trích xuất bằng các dấu mốc ranh giới nội dung bên ngoài rõ ràng thay vì truyền trực tiếp văn bản thô của tệp
    - sử dụng sandbox và danh sách cho phép công cụ nghiêm ngặt

    Chi tiết: [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw có kém an toàn hơn vì sử dụng TypeScript/Node thay vì Rust/WASM không?">
    Ngôn ngữ và môi trường chạy có ảnh hưởng, nhưng không phải là rủi ro chính đối với tác nhân cá nhân. Các rủi ro thực tế gồm việc để lộ gateway, ai có thể nhắn tin cho bot, chèn lệnh qua prompt, phạm vi công cụ, xử lý thông tin xác thực, quyền truy cập trình duyệt, quyền thực thi và mức độ tin cậy của skill/plugin bên thứ ba.

    Rust và WASM có thể cung cấp khả năng cô lập mạnh hơn cho một số lớp mã, nhưng không giải quyết được việc chèn lệnh qua prompt, danh sách cho phép không phù hợp, để lộ gateway công khai, công cụ có phạm vi quá rộng hoặc hồ sơ trình duyệt đã đăng nhập vào các tài khoản nhạy cảm. Hãy coi đây là các biện pháp kiểm soát chính: giữ Gateway ở chế độ riêng tư hoặc được xác thực, sử dụng ghép cặp và danh sách cho phép cho tin nhắn trực tiếp/nhóm, từ chối hoặc chạy trong sandbox các công cụ rủi ro đối với dữ liệu đầu vào không đáng tin cậy, chỉ cài đặt các plugin và skill đáng tin cậy, đồng thời chạy `openclaw security audit --deep` sau khi thay đổi cấu hình.

    Chi tiết: [Bảo mật](/vi/gateway/security), [Chạy trong sandbox](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="Tôi đã thấy báo cáo về các phiên bản OpenClaw bị lộ. Cần kiểm tra gì?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Mức cơ sở an toàn hơn: Gateway được liên kết với `loopback` hoặc chỉ được công khai thông qua quyền truy cập riêng tư có xác thực (tailnet, đường hầm SSH, xác thực bằng token/mật khẩu hoặc proxy đáng tin cậy được cấu hình đúng); tin nhắn trực tiếp ở chế độ `pairing` hoặc `allowlist`; nhóm được đưa vào danh sách cho phép và yêu cầu nhắc tên trừ khi mọi thành viên đều đáng tin cậy; các công cụ rủi ro cao (`exec`, `browser`, `gateway`, `cron`) bị từ chối hoặc giới hạn phạm vi chặt chẽ đối với các tác nhân đọc nội dung không đáng tin cậy; bật sandbox khi việc thực thi công cụ cần phạm vi ảnh hưởng nhỏ hơn.

    Các vấn đề cần khắc phục trước tiên là liên kết công khai không có xác thực, tin nhắn trực tiếp/nhóm mở có công cụ và quyền điều khiển trình duyệt bị lộ. Chi tiết: [openclaw security audit](/vi/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="Cài đặt skill từ ClawHub và plugin bên thứ ba có an toàn không?">
    Hãy coi skill và plugin bên thứ ba là mã mà bạn lựa chọn tin tưởng. Các trang skill trên ClawHub hiển thị trạng thái quét trước khi cài đặt, nhưng quá trình quét không phải là ranh giới bảo mật hoàn chỉnh. OpenClaw không chạy cơ chế chặn mã nguy hiểm cục bộ được tích hợp sẵn trong quá trình cài đặt hoặc cập nhật plugin/skill; hãy sử dụng `security.installPolicy` do người vận hành quản lý để đưa ra quyết định cho phép/chặn cục bộ.

    Mô hình an toàn hơn: ưu tiên tác giả đáng tin cậy và phiên bản được ghim, đọc skill/plugin trước khi bật, giữ danh sách cho phép plugin/skill ở phạm vi hẹp, chạy quy trình xử lý dữ liệu đầu vào không đáng tin cậy trong sandbox với số lượng công cụ tối thiểu và tránh cấp cho mã bên thứ ba quyền truy cập rộng vào hệ thống tệp, quyền thực thi, trình duyệt hoặc bí mật.

    Chi tiết: [Skills](/vi/tools/skills), [Plugin](/vi/tools/plugin), [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Bot của tôi có nên có email, tài khoản GitHub hoặc số điện thoại riêng không?">
    Có, đối với hầu hết cấu hình. Cô lập bot bằng các tài khoản và số điện thoại riêng giúp giảm phạm vi ảnh hưởng nếu xảy ra sự cố, đồng thời giúp việc xoay vòng thông tin xác thực hoặc thu hồi quyền truy cập dễ dàng hơn mà không ảnh hưởng đến tài khoản cá nhân của bạn.

    Hãy bắt đầu ở quy mô nhỏ: chỉ cấp quyền truy cập vào các công cụ và tài khoản thực sự cần thiết, rồi mở rộng sau nếu cần.

    Tài liệu: [Bảo mật](/vi/gateway/security), [Ghép cặp](/vi/channels/pairing).

  </Accordion>

  <Accordion title="Tôi có thể trao cho bot quyền tự chủ đối với tin nhắn văn bản của mình không và điều đó có an toàn không?">
    Chúng tôi **không** khuyến nghị trao toàn quyền tự chủ đối với tin nhắn cá nhân của bạn. Mô hình an toàn nhất: giữ tin nhắn trực tiếp ở **chế độ ghép cặp** hoặc dùng danh sách cho phép nghiêm ngặt, sử dụng **số điện thoại hoặc tài khoản riêng** nếu bot cần nhắn tin thay mặt bạn và để bot soạn bản nháp trong khi bạn **phê duyệt trước khi gửi**.

    Để thử nghiệm, hãy thực hiện trên một tài khoản chuyên dụng, được cô lập. Xem [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng các mô hình rẻ hơn cho tác vụ trợ lý cá nhân không?">
    Có, **nếu** tác nhân chỉ trò chuyện và dữ liệu đầu vào đáng tin cậy. Các phân hạng nhỏ hơn dễ bị chiếm quyền điều khiển bằng chỉ dẫn hơn, vì vậy hãy tránh sử dụng chúng cho tác nhân được bật công cụ hoặc khi đọc nội dung không đáng tin cậy. Nếu buộc phải sử dụng mô hình nhỏ hơn, hãy giới hạn chặt chẽ các công cụ và chạy trong sandbox. Xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Tôi đã chạy /start trong Telegram nhưng không nhận được mã ghép cặp">
    Mã ghép cặp **chỉ** được gửi khi một người gửi không xác định nhắn tin cho bot và `dmPolicy: "pairing"` được bật; riêng `/start` không tạo mã.

    Kiểm tra các yêu cầu đang chờ:

    ```bash
    openclaw pairing list telegram
    ```

    Để truy cập ngay, hãy thêm ID người gửi của bạn vào danh sách cho phép hoặc đặt `dmPolicy: "open"` cho tài khoản đó.

  </Accordion>

  <Accordion title="WhatsApp: bot có nhắn tin cho danh bạ của tôi không? Ghép cặp hoạt động như thế nào?">
    Không. Chính sách tin nhắn trực tiếp mặc định của WhatsApp là **ghép cặp**. Người gửi không xác định chỉ nhận được mã ghép cặp; tin nhắn của họ **không được xử lý**. OpenClaw chỉ phản hồi các cuộc trò chuyện mà OpenClaw nhận được hoặc các lượt gửi rõ ràng do bạn kích hoạt.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    Lời nhắc nhập số điện thoại của trình hướng dẫn sẽ thiết lập **danh sách cho phép/chủ sở hữu** để cho phép tin nhắn trực tiếp của chính bạn - số này không được dùng để tự động gửi. Đối với số WhatsApp cá nhân, hãy dùng số đó và bật `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Lệnh trò chuyện, hủy tác vụ và "không thể dừng"

<AccordionGroup>
  <Accordion title="Làm cách nào để ngăn thông báo hệ thống nội bộ hiển thị trong cuộc trò chuyện?">
    Hầu hết thông báo nội bộ/công cụ chỉ xuất hiện khi **chi tiết**, **theo dõi** hoặc **suy luận** được bật cho phiên đó.

    Khắc phục trong cuộc trò chuyện nơi chúng xuất hiện:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Nếu vẫn còn nhiều thông báo: hãy kiểm tra cài đặt phiên trong giao diện điều khiển và đặt chế độ chi tiết thành **kế thừa**; xác nhận rằng bạn không dùng hồ sơ bot có `verboseDefault: "on"` trong cấu hình.

    Tài liệu: [Suy nghĩ và chế độ chi tiết](/vi/tools/thinking), [Bảo mật](/vi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Làm cách nào để dừng/hủy một tác vụ đang chạy?">
    Gửi bất kỳ mục nào sau đây **dưới dạng một tin nhắn riêng biệt** (không có dấu gạch chéo) để kích hoạt hủy bỏ: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Các từ kích hoạt phổ biến không phải tiếng Anh (tiếng Pháp, Đức, Tây Ban Nha, Trung, Nhật, Hindi, Ả Rập, Nga) cũng hoạt động.

    Đối với các tiến trình nền do công cụ exec khởi chạy, hãy yêu cầu tác nhân chạy:

    ```text
    process action:kill sessionId:XXX
    ```

    Hầu hết lệnh có dấu gạch chéo phải được gửi dưới dạng tin nhắn **riêng biệt** bắt đầu bằng `/`, nhưng một số phím tắt (như `/status`) cũng hoạt động ngay trong dòng đối với người gửi thuộc danh sách cho phép. Xem [Lệnh có dấu gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title='Làm cách nào để gửi tin nhắn Discord từ Telegram? ("Nhắn tin xuyên ngữ cảnh bị từ chối")'>
    Theo mặc định, OpenClaw chặn việc nhắn tin **giữa các nhà cung cấp**. Nếu một lệnh gọi công cụ được liên kết với Telegram, lệnh đó sẽ không gửi đến Discord trừ khi bạn cho phép rõ ràng - và thay đổi này có hiệu lực ngay lập tức, không cần khởi động lại Gateway:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[từ {channel}] " },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title='Tại sao có cảm giác bot "phớt lờ" các tin nhắn gửi liên tiếp rất nhanh?'>
    Theo mặc định, các lời nhắc giữa lượt chạy được chuyển hướng vào lượt chạy đang hoạt động. Dùng `/queue` để chọn hành vi của lượt chạy đang hoạt động:

    - `steer` (mặc định) - hướng dẫn lượt chạy đang hoạt động tại ranh giới mô hình tiếp theo.
    - `followup` - đưa tin nhắn vào hàng đợi và chạy lần lượt sau khi lượt chạy hiện tại kết thúc.
    - `collect` - đưa các tin nhắn tương thích vào hàng đợi và phản hồi một lần sau khi lượt chạy hiện tại kết thúc.
    - `interrupt` - hủy lượt chạy hiện tại và bắt đầu lại.

    Thêm tùy chọn vào các chế độ hàng đợi như `debounce:0.5s cap:25 drop:summarize`. Xem [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Khác

<AccordionGroup>
  <Accordion title='Mô hình mặc định cho Anthropic khi dùng khóa API là gì?'>
    Thông tin xác thực và việc lựa chọn mô hình là hai phần riêng biệt. Việc đặt `ANTHROPIC_API_KEY` (hoặc lưu khóa API Anthropic trong hồ sơ xác thực) sẽ bật xác thực, nhưng mô hình mặc định thực tế là mô hình bạn cấu hình trong `agents.defaults.model.primary` (ví dụ `anthropic/claude-sonnet-4-6` hoặc `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` có nghĩa là Gateway không thể tìm thấy thông tin xác thực Anthropic trong `auth-profiles.json` dự kiến dành cho tác nhân đang chạy.
  </Accordion>
</AccordionGroup>

---

Vẫn chưa giải quyết được? Hãy hỏi trong [Discord](https://discord.com/invite/clawd) hoặc mở một [cuộc thảo luận trên GitHub](https://github.com/openclaw/openclaw/discussions).

## Liên quan

- [Câu hỏi thường gặp về lần chạy đầu tiên](/vi/help/faq-first-run) - cài đặt, thiết lập ban đầu, xác thực, gói đăng ký, lỗi ban đầu
- [Câu hỏi thường gặp về mô hình](/vi/help/faq-models) - lựa chọn mô hình, chuyển đổi dự phòng, hồ sơ xác thực
- [Khắc phục sự cố](/vi/help/troubleshooting) - phân loại ưu tiên theo triệu chứng
