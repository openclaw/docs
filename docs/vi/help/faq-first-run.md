---
read_when:
    - Cài đặt mới, bị kẹt khi thiết lập ban đầu hoặc gặp lỗi trong lần chạy đầu tiên
    - Chọn phương thức xác thực và gói đăng ký nhà cung cấp
    - Không thể truy cập docs.openclaw.ai, không thể mở bảng điều khiển, quá trình cài đặt bị treo
sidebarTitle: First-run FAQ
summary: 'Câu hỏi thường gặp: thiết lập khởi động nhanh và chạy lần đầu — cài đặt, hướng dẫn ban đầu, xác thực, gói đăng ký, các lỗi ban đầu'
title: 'Câu hỏi thường gặp: thiết lập lần chạy đầu tiên'
x-i18n:
    generated_at: "2026-07-16T15:20:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

Hỏi đáp về khởi động nhanh và lần chạy đầu tiên. Đối với các thao tác hằng ngày, mô hình, xác thực, phiên
và khắc phục sự cố, hãy xem [Câu hỏi thường gặp](/vi/help/faq) chính.

## Khởi động nhanh và thiết lập lần chạy đầu tiên

<AccordionGroup>
  <Accordion title="Tôi đang mắc kẹt, cách nhanh nhất để xử lý">
    Sử dụng một tác nhân AI cục bộ có thể **thấy máy của bạn**. Hầu hết các trường hợp "Tôi đang mắc kẹt"
    là **vấn đề về cấu hình hoặc môi trường cục bộ** mà người hỗ trợ từ xa không thể kiểm tra, vì vậy cách này hiệu quả hơn
    việc hỏi trên Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Cung cấp cho tác nhân toàn bộ bản sao mã nguồn thông qua bản cài đặt có thể tùy chỉnh (git) để tác nhân có thể đọc
    mã + tài liệu và suy luận về đúng phiên bản bạn đang chạy:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Yêu cầu tác nhân lập kế hoạch và giám sát cách khắc phục từng bước, sau đó chỉ thực thi các
    lệnh cần thiết - các diff nhỏ hơn dễ kiểm tra hơn.

    Chia sẻ các đầu ra này khi yêu cầu trợ giúp (trên Discord hoặc trong một issue GitHub):

    | Lệnh | Hiển thị |
    | --- | --- |
    | `openclaw status` | Tình trạng Gateway/tác nhân + ảnh chụp cấu hình cơ bản |
    | `openclaw status --all` | Chẩn đoán đầy đủ chỉ đọc, có thể dán |
    | `openclaw models status` | Xác thực nhà cung cấp + tính khả dụng của mô hình |
    | `openclaw doctor` | Xác thực và sửa chữa các vấn đề cấu hình/trạng thái thường gặp |
    | `openclaw logs --follow` | Theo dõi nhật ký trực tiếp |
    | `openclaw gateway status --deep` | Kiểm tra chuyên sâu tình trạng Gateway/cấu hình/plugin |
    | `openclaw health --verbose` | Báo cáo tình trạng chi tiết |

    Tìm thấy lỗi thực sự hoặc cách khắc phục? Hãy tạo issue hoặc gửi PR:
    [Issue](https://github.com/openclaw/openclaw/issues) /
    [Yêu cầu kéo](https://github.com/openclaw/openclaw/pulls).

    Vòng lặp gỡ lỗi nhanh: [60 giây đầu tiên nếu có sự cố](/vi/help/faq#first-60-seconds-if-something-is-broken).
    Tài liệu cài đặt: [Cài đặt](/vi/install), [Cờ trình cài đặt](/vi/install/installer), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Heartbeat liên tục bị bỏ qua. Các lý do bỏ qua có nghĩa là gì?">
    | Lý do bỏ qua | Ý nghĩa |
    | --- | --- |
    | `quiet-hours` | Nằm ngoài khoảng giờ hoạt động đã cấu hình |
    | `empty-heartbeat-file` | `HEARTBEAT.md` tồn tại nhưng chỉ có nội dung khung trống, chú thích, tiêu đề, hàng rào hoặc danh sách kiểm tra trống |
    | `no-tasks-due` | Chế độ tác vụ đang hoạt động nhưng chưa đến hạn cho khoảng tác vụ nào |
    | `alerts-disabled` | Toàn bộ khả năng hiển thị heartbeat đều tắt (`showOk`, `showAlerts` và `useIndicator` đều bị vô hiệu hóa) |

    Trong chế độ tác vụ, dấu thời gian đến hạn chỉ được cập nhật sau khi một lần chạy Heartbeat thực sự hoàn tất.
    Các lần chạy bị bỏ qua không đánh dấu tác vụ là đã hoàn thành.

    Tài liệu: [Heartbeat](/vi/gateway/heartbeat), [Tự động hóa](/vi/automation).

  </Accordion>

  <Accordion title="Cách được khuyến nghị để cài đặt và thiết lập OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Từ mã nguồn (người đóng góp/nhà phát triển):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Chưa cài đặt toàn cục? Thay vào đó hãy chạy `pnpm openclaw onboard`. Nếu thiếu tài nguyên Control UI,
    quy trình tiếp nhận sẽ tự thử dựng chúng, với phương án dự phòng là `pnpm ui:build`.

  </Accordion>

  <Accordion title="Làm cách nào để mở bảng điều khiển sau khi tiếp nhận?">
    Quy trình tiếp nhận mở trình duyệt của bạn đến một URL bảng điều khiển sạch (không chứa token) ngay sau khi
    thiết lập và in liên kết trong phần tóm tắt. Hãy giữ tab đó mở; nếu trình duyệt không khởi chạy,
    hãy sao chép/dán URL được in trên cùng máy.
  </Accordion>

  <Accordion title="Làm cách nào để xác thực bảng điều khiển trên localhost và từ xa?">
    **Localhost (cùng máy):**

    - Mở `http://127.0.0.1:18789/`.
    - Nếu hệ thống yêu cầu xác thực bằng bí mật dùng chung, hãy dán token hoặc mật khẩu đã cấu hình vào phần cài đặt Control UI.
    - Nguồn token: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
    - Nguồn mật khẩu: `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
    - Chưa cấu hình bí mật dùng chung? Hãy chạy `openclaw doctor --generate-gateway-token` (hoặc `openclaw doctor --fix --generate-gateway-token`).

    **Không ở trên localhost:**

    - **Tailscale Serve** (khuyến nghị): giữ liên kết loopback, chạy `openclaw gateway --tailscale serve`, mở `https://<magicdns>/`. Với `gateway.auth.allowTailscale: true`, các tiêu đề danh tính đáp ứng xác thực Control UI/WebSocket (không cần dán bí mật dùng chung, giả định máy chủ Gateway đáng tin cậy); các API HTTP vẫn cần xác thực bằng bí mật dùng chung trừ khi bạn chủ ý sử dụng `none` cho lưu lượng vào riêng tư hoặc xác thực HTTP bằng proxy đáng tin cậy.
      Các lần thử Serve có xác thực sai đồng thời từ cùng một máy khách được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, vì vậy lần thử lại sai thứ hai có thể đã hiển thị `retry later`.
    - **Liên kết Tailnet**: chạy `openclaw gateway --bind tailnet --token "<token>"` (hoặc cấu hình xác thực bằng mật khẩu), mở `http://<tailscale-ip>:18789/`, dán bí mật dùng chung tương ứng vào phần cài đặt bảng điều khiển.
    - **Proxy ngược nhận biết danh tính**: giữ Gateway phía sau một proxy đáng tin cậy, đặt `gateway.auth.mode: "trusted-proxy"`, mở URL proxy. Proxy loopback trên cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback: true` rõ ràng.
    - **Đường hầm SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, sau đó mở `http://127.0.0.1:18789/`. Xác thực bằng bí mật dùng chung vẫn áp dụng qua đường hầm; hãy dán token hoặc mật khẩu đã cấu hình nếu được nhắc.

    Xem [Bảng điều khiển](/vi/web/dashboard) và [Các bề mặt web](/vi/web) để biết chi tiết về chế độ liên kết và xác thực.

  </Accordion>

  <Accordion title="Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua trò chuyện?">
    Chúng kiểm soát các lớp khác nhau:

    - `approvals.exec` - chuyển tiếp lời nhắc phê duyệt đến các đích trò chuyện.
    - `channels.<channel>.execApprovals` - biến kênh đó thành máy khách phê duyệt gốc cho các phê duyệt exec.

    Chính sách exec của máy chủ vẫn là cổng phê duyệt thực sự; cấu hình trò chuyện chỉ kiểm soát nơi
    lời nhắc xuất hiện và cách mọi người trả lời.

    Bạn hiếm khi cần cả hai:

    - Nếu cuộc trò chuyện đã hỗ trợ lệnh và phản hồi, `/approve` trong cùng cuộc trò chuyện hoạt động qua đường dẫn dùng chung.
    - Khi một kênh gốc được hỗ trợ có thể suy ra người phê duyệt một cách an toàn, OpenClaw tự động bật phê duyệt gốc ưu tiên tin nhắn trực tiếp nếu `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`.
    - Khi có thẻ/nút phê duyệt gốc, giao diện người dùng đó là chính; chỉ đề cập đến lệnh `/approve` thủ công nếu kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng.
    - Chỉ sử dụng `approvals.exec` khi lời nhắc cũng phải đến các cuộc trò chuyện khác hoặc phòng vận hành được chỉ định.
    - Chỉ sử dụng `channels.<channel>.execApprovals.target: "channel"` hoặc `"both"` khi bạn muốn lời nhắc phê duyệt được đăng lại vào phòng/chủ đề ban đầu.
    - Phê duyệt Plugin là riêng biệt: mặc định dùng `/approve` trong cùng cuộc trò chuyện, có thể chuyển tiếp bằng `approvals.plugin`, và chỉ một số kênh gốc tiếp tục xử lý chúng theo cách gốc.

    Tóm lại: chuyển tiếp dùng để định tuyến, cấu hình máy khách gốc dùng để cung cấp trải nghiệm người dùng phong phú hơn theo từng kênh.
    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>

  <Accordion title="Tôi cần runtime nào?">
    Yêu cầu Node **22.22.3+**, **24.15+** hoặc **25.9+** (khuyến nghị Node 24). `pnpm` là trình quản lý gói của kho mã.
    Bun có thể cài đặt phần phụ thuộc và chạy tập lệnh gói, nhưng không thể chạy CLI hoặc Gateway của OpenClaw vì thiếu `node:sqlite`.
  </Accordion>

  <Accordion title="OpenClaw có chạy trên Raspberry Pi không?">
    Có, nhưng trước tiên hãy kiểm tra RAM: Pi 5 và Pi 4 (2 GB+) là lựa chọn lý tưởng; Pi 3B+ (1 GB) hoạt động nhưng chậm; không khuyến nghị Pi Zero 2 W (512 MB).

    | Mẫu | RAM | Mức phù hợp |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Tốt nhất |
    | Pi 4 | 4 GB | Tốt |
    | Pi 4 | 2 GB | Ổn, thêm swap |
    | Pi 4 | 1 GB | Hạn chế |
    | Pi 3B+ | 1 GB | Chậm |
    | Pi Zero 2 W | 512 MB | Không khuyến nghị |

    Mức tối thiểu tuyệt đối: RAM 1 GB, 1 lõi, 500 MB dung lượng đĩa trống, hệ điều hành 64-bit. Vì Pi chỉ chạy
    Gateway (các mô hình gọi API đám mây), ngay cả một Pi cấu hình vừa phải cũng xử lý được tải.

    Một Pi/VPS nhỏ cũng có thể chỉ lưu trữ Gateway trong khi bạn ghép nối các **Node** trên
    máy tính xách tay/điện thoại để sử dụng màn hình/camera/canvas cục bộ hoặc thực thi lệnh. Xem [Node](/vi/nodes).

    Hướng dẫn thiết lập đầy đủ: [Raspberry Pi](/vi/install/raspberry-pi).

  </Accordion>

  <Accordion title="Có mẹo nào khi cài đặt trên Raspberry Pi không?">
    - Sử dụng hệ điều hành **64-bit**; không sử dụng Raspberry Pi OS 32-bit.
    - Thêm swap trên bo mạch có RAM 2 GB trở xuống.
    - Ưu tiên **SSD USB** thay vì thẻ SD để có hiệu năng và tuổi thọ tốt hơn.
    - Ưu tiên bản cài đặt có thể tùy chỉnh (git) để bạn có thể xem nhật ký và cập nhật nhanh.
    - Bắt đầu mà không có kênh/Skills, sau đó thêm từng mục một.
    - Các lỗi nhị phân bất thường ("exec format error") thường do công cụ Skills tùy chọn thiếu bản dựng ARM64.

    Hướng dẫn đầy đủ: [Raspberry Pi](/vi/install/raspberry-pi). Xem thêm [Linux](/vi/platforms/linux).

  </Accordion>

  <Accordion title="Hệ thống bị kẹt ở wake up my friend / quy trình tiếp nhận không thể hoàn tất. Phải làm gì?">
    Màn hình đó phụ thuộc vào khả năng truy cập và xác thực Gateway. TUI cũng tự động gửi
    "Wake up, my friend!" trong lần khởi tạo đầu tiên khi đã cấu hình nhà cung cấp mô hình. Nếu
    bạn bỏ qua thiết lập mô hình/xác thực, quy trình tiếp nhận sẽ hiển thị ghi chú "Thiếu xác thực mô hình" và mở
    TUI mà không gửi gì — hãy thêm nhà cung cấp bằng `openclaw configure --section model`.
    Nếu bạn thấy dòng đánh thức nhưng **không có phản hồi** và số token vẫn là 0, tác nhân chưa từng chạy.

    1. Khởi động lại Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Kiểm tra trạng thái + xác thực:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Vẫn bị treo? Chạy:

    ```bash
    openclaw doctor
    ```

    Nếu Gateway ở xa, hãy xác nhận kết nối đường hầm/Tailscale đang hoạt động và giao diện người dùng
    trỏ đến đúng Gateway. Xem [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể di chuyển thiết lập sang máy mới mà không cần thực hiện lại quy trình tiếp nhận không?">
    Có. Sao chép **thư mục trạng thái** và **không gian làm việc**, sau đó chạy Doctor một lần:

    1. Cài đặt OpenClaw trên máy mới.
    2. Sao chép `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`) từ máy cũ.
    3. Sao chép không gian làm việc của bạn (mặc định: `~/.openclaw/workspace`).
    4. Chạy `openclaw doctor` và khởi động lại dịch vụ Gateway.

    Việc này giữ nguyên cấu hình, hồ sơ xác thực, thông tin xác thực WhatsApp, phiên và bộ nhớ - bot của bạn
    sẽ hoàn toàn giống trước, miễn là bạn sao chép **cả hai** vị trí. Trong chế độ từ xa,
    máy chủ Gateway sở hữu kho phiên và không gian làm việc.

    **Quan trọng:** nếu bạn chỉ commit/push không gian làm việc lên GitHub, bạn sẽ sao lưu
    **bộ nhớ + tệp khởi tạo**, nhưng không có lịch sử phiên hoặc xác thực. Các dữ liệu đó nằm trong
    `~/.openclaw/` (ví dụ `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Liên quan: [Di chuyển](/vi/install/migrating), [Vị trí lưu trữ trên đĩa](/vi/help/faq#where-things-live-on-disk),
    [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace), [Doctor](/vi/gateway/doctor),
    [Chế độ từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi xem các điểm mới trong phiên bản mới nhất ở đâu?">
    Xem nhật ký thay đổi trên GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Các mục mới nhất nằm ở đầu. Nếu phần trên cùng là **Chưa phát hành**, phần có ngày
    tiếp theo là phiên bản được phát hành gần nhất. Các mục được nhóm trong **Điểm nổi bật**, **Thay đổi**
    và **Bản sửa lỗi** (cộng thêm tài liệu/các phần khác khi cần).

  </Accordion>

  <Accordion title="Không thể truy cập docs.openclaw.ai (lỗi SSL)">
    Một số kết nối Comcast/Xfinity chặn nhầm `docs.openclaw.ai` thông qua Xfinity
    Advanced Security. Hãy vô hiệu hóa tính năng này hoặc thêm `docs.openclaw.ai` vào danh sách cho phép, rồi thử lại. Hãy giúp chúng tôi
    gỡ chặn địa chỉ này: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Vẫn bị chặn? Tài liệu được sao chép trên GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Sự khác biệt giữa stable và beta">
    **Stable** và **beta** là các **dist-tag của npm**, không phải các dòng mã riêng biệt:

    - `latest` = stable
    - `beta` = bản dựng sớm để kiểm thử (chuyển về `latest` khi không có beta hoặc beta cũ hơn bản phát hành stable hiện tại)

    Một bản phát hành stable thường được đưa lên **beta** trước, sau đó một bước thăng hạng rõ ràng
    sẽ chuyển chính phiên bản đó sang `latest` mà không thay đổi số phiên bản. Người bảo trì
    cũng có thể phát hành thẳng lên `latest`. Vì vậy, beta và stable có thể trỏ đến
    **cùng một phiên bản** sau khi thăng hạng.

    Xem những thay đổi: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Để xem các lệnh cài đặt một dòng và sự khác biệt giữa beta và dev, hãy xem mục xếp tiếp theo.

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt phiên bản beta và beta khác dev như thế nào?">
    **Beta** là dist-tag npm `beta` (có thể trùng với `latest` sau khi thăng hạng).
    **Dev** là đầu nhánh luôn thay đổi của `main` (git); khi được phát hành lên npm, nó sử dụng dist-tag `dev`.

    Các lệnh một dòng (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Trình cài đặt Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Chi tiết thêm: [Kênh phát triển](/vi/install/development-channels) và [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Làm cách nào để dùng thử mã mới nhất?">
    Có hai lựa chọn:

    1. **Kênh dev (bản cài đặt hiện có):**

    ```bash
    openclaw update --channel dev
    ```

    Lệnh này chuyển sang một bản checkout git của `main`, rebase theo upstream, xây dựng và cài đặt
    CLI từ bản checkout đó.

    2. **Bản cài đặt có thể chỉnh sửa (git) (máy mới):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Nên clone thủ công:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Tài liệu: [Cập nhật](/vi/cli/update), [Kênh phát triển](/vi/install/development-channels), [Cài đặt](/vi/install).

  </Accordion>

  <Accordion title="Quá trình cài đặt và thiết lập ban đầu thường mất bao lâu?">
    Ước tính sơ bộ:

    - **Cài đặt:** 2-5 phút.
    - **Thiết lập ban đầu QuickStart:** vài phút (Gateway loopback, token tự động, workspace mặc định).
    - **Thiết lập ban đầu nâng cao/đầy đủ:** lâu hơn khi cần thiết lập thêm cho việc đăng nhập nhà cung cấp, ghép nối kênh, cài đặt daemon, tải xuống qua mạng hoặc Skills.

    Trình hướng dẫn hiển thị trước mốc thời gian này. Bỏ qua các bước tùy chọn và quay lại sau bằng
    `openclaw configure`.

    Bị treo? Xem [Tôi bị kẹt](#quick-start-and-first-run-setup) ở trên.

  </Accordion>

  <Accordion title="Trình cài đặt bị kẹt? Làm cách nào để nhận thêm thông tin phản hồi?">
    Chạy lại với `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` không có tùy chọn chi tiết chuyên biệt; thay vào đó, hãy bọc nó trong `Set-PSDebug -Trace 1` /
    `-Trace 0`. Tham khảo đầy đủ về cờ: [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Trình cài đặt Windows báo không tìm thấy git hoặc không nhận diện được openclaw">
    Hai vấn đề phổ biến trên Windows:

    **1) Lỗi npm spawn git / không tìm thấy git**

    - Cài đặt **Git for Windows**, đảm bảo `git` nằm trên PATH.
    - Đóng rồi mở lại PowerShell, sau đó chạy lại trình cài đặt.

    **2) Không nhận diện được openclaw sau khi cài đặt**

    - Thư mục bin toàn cục của npm chưa có trên PATH.
    - Kiểm tra bằng: `npm config get prefix`.
    - Thêm thư mục đó vào PATH người dùng (không cần hậu tố `\bin`; trên hầu hết hệ thống, thư mục này là `%AppData%\npm`).
    - Đóng rồi mở lại PowerShell.

    Muốn dùng ứng dụng máy tính? Hãy dùng **Windows Hub**. Đối với thiết lập chỉ dùng terminal: cả trình cài đặt
    PowerShell và đường dẫn Gateway WSL2 đều được hỗ trợ. Tài liệu: [Windows](/vi/platforms/windows).

  </Accordion>

  <Accordion title="Đầu ra thực thi trên Windows hiển thị chữ Trung Quốc bị lỗi — tôi nên làm gì?">
    Nguyên nhân thường là trang mã bảng điều khiển không khớp trên các shell Windows gốc.

    Triệu chứng: đầu ra `system.run`/`exec` hiển thị tiếng Trung thành ký tự lỗi; cùng một lệnh
    lại hiển thị bình thường trong hồ sơ terminal khác.

    Cách khắc phục tạm thời trong PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sau đó khởi động lại Gateway và thử lại:

    ```powershell
    openclaw gateway restart
    ```

    Vẫn tái hiện lỗi này trên OpenClaw mới nhất? Theo dõi/báo cáo tại: [Vấn đề #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="Tài liệu không trả lời câu hỏi của tôi — làm cách nào để nhận được câu trả lời tốt hơn?">
    Hãy dùng bản cài đặt có thể chỉnh sửa (git) để có đầy đủ mã nguồn và tài liệu trên máy, sau đó hỏi
    bot của bạn (hoặc Claude/Codex) **từ thư mục đó** để nó có thể đọc repo và trả lời chính xác.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chi tiết thêm: [Cài đặt](/vi/install) và [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt OpenClaw trên Linux?">
    - Quy trình nhanh trên Linux + cài đặt dịch vụ: [Linux](/vi/platforms/linux).
    - Hướng dẫn đầy đủ: [Bắt đầu](/vi/start/getting-started).
    - Trình cài đặt + cập nhật: [Cài đặt và cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt OpenClaw trên VPS?">
    Mọi VPS Linux đều dùng được. Cài đặt trên máy chủ, sau đó truy cập Gateway qua SSH/Tailscale.

    Hướng dẫn: [exe.dev](/vi/install/exe-dev), [Hetzner](/vi/install/hetzner), [Fly.io](/vi/install/fly).
    Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Các hướng dẫn cài đặt trên đám mây/VPS ở đâu?">
    Trung tâm lưu trữ với các nhà cung cấp phổ biến:

    - [Lưu trữ VPS](/vi/vps) (tất cả nhà cung cấp ở cùng một nơi)
    - [Fly.io](/vi/install/fly)
    - [Hetzner](/vi/install/hetzner)
    - [exe.dev](/vi/install/exe-dev)

    Trên đám mây, **Gateway chạy trên máy chủ** và bạn truy cập nó từ máy tính xách tay/điện thoại
    thông qua Control UI (hoặc Tailscale/SSH). Trạng thái + workspace của bạn nằm trên máy chủ, vì vậy
    hãy xem máy chủ là nguồn dữ liệu chuẩn và sao lưu máy chủ.

    Ghép nối các **node** (Mac/iOS/Android/headless) với Gateway trên đám mây đó để sử dụng
    màn hình/camera/canvas cục bộ hoặc thực thi lệnh trên máy tính xách tay trong khi Gateway vẫn ở
    trên đám mây.

    Trung tâm: [Nền tảng](/vi/platforms). Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).
    Node: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể yêu cầu OpenClaw tự cập nhật không?">
    Có thể, nhưng không nên. Luồng cập nhật có thể khởi động lại Gateway (làm gián đoạn
    phiên đang hoạt động), có thể yêu cầu bản checkout git sạch và có thể nhắc xác nhận.
    Sẽ an toàn hơn nếu người vận hành chạy cập nhật từ shell.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Tự động hóa từ một agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Tài liệu: [Cập nhật](/vi/cli/update), [Đang cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Quá trình thiết lập ban đầu thực sự làm gì?">
    `openclaw onboard` là quy trình thiết lập được khuyến nghị. Trong **chế độ cục bộ**, quy trình này hướng dẫn qua:

    1. **Mô hình/Xác thực** - OAuth của nhà cung cấp, khóa API hoặc xác thực thủ công (bao gồm các tùy chọn cục bộ như LM Studio); chọn mô hình mặc định.
    2. **Workspace** - vị trí + tệp khởi tạo.
    3. **Gateway** - cổng, địa chỉ liên kết, chế độ xác thực, mức phơi bày qua Tailscale.
    4. **Kênh** - các kênh trò chuyện tích hợp và Plugin chính thức: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp và nhiều kênh khác.
    5. **Daemon** - LaunchAgent (macOS), đơn vị người dùng systemd (Linux/WSL2) hoặc Windows Scheduled Task gốc.
    6. **Kiểm tra tình trạng** - khởi động Gateway và xác minh rằng nó đang chạy.
    7. **Skills** - cài đặt các kỹ năng được khuyến nghị và phần phụ thuộc tùy chọn.

    Quy trình này nêu trước thời lượng dự kiến và cảnh báo nếu mô hình đã cấu hình không xác định
    hoặc thiếu thông tin xác thực. Phân tích đầy đủ: [Thiết lập ban đầu (CLI)](/vi/start/wizard).

  </Accordion>

  <Accordion title="Tôi có cần đăng ký Claude hoặc OpenAI để chạy ứng dụng này không?">
    Không. Chạy OpenClaw bằng **khóa API** (Anthropic/OpenAI/các nhà cung cấp khác) hoặc **mô hình chỉ chạy cục bộ**
    để dữ liệu luôn nằm trên thiết bị của bạn. Các gói đăng ký (Claude Pro/Max, ChatGPT/Codex) là
    phương thức tùy chọn để xác thực với các nhà cung cấp đó.

    Với Anthropic: **khóa API** sử dụng hình thức thanh toán tiêu chuẩn theo mức dùng; **Claude CLI**
    tái sử dụng phiên đăng nhập Claude Code hiện có trên cùng máy chủ. Hiện tại, Anthropic xem
    đường dẫn `claude -p` không tương tác của Claude CLI là hoạt động sử dụng Agent SDK/lập trình,
    vẫn tính vào giới hạn gói đăng ký của bạn — hãy kiểm tra tài liệu thanh toán hiện hành của Anthropic
    trước khi dựa vào hành vi của gói đăng ký. Đối với các máy chủ Gateway hoạt động lâu dài và tác vụ
    tự động hóa dùng chung, khóa API Anthropic là lựa chọn dễ dự đoán hơn.

    OpenAI Codex OAuth (gói đăng ký ChatGPT/Codex) được hỗ trợ đầy đủ cho các mô hình agent.
    OpenClaw cũng hỗ trợ các tùy chọn dạng đăng ký được lưu trữ, bao gồm **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** và **Z.AI / GLM Coding Plan**.

    Tài liệu: [Anthropic](/vi/providers/anthropic), [OpenAI](/vi/providers/openai),
    [Qwen Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), [Z.AI (GLM)](/vi/providers/zai),
    [Mô hình cục bộ](/vi/gateway/local-models), [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng gói đăng ký Claude Max mà không cần khóa API không?">
    Có. OpenClaw hỗ trợ tái sử dụng Claude CLI cho các gói Pro/Max/Team/Enterprise. Hiện tại, Anthropic
    xem đường dẫn `claude -p` mà OpenClaw sử dụng là hoạt động sử dụng theo gói đăng ký, chịu
    giới hạn của gói, chứ không phải một hạn mức miễn phí riêng — xem
    [Anthropic](/vi/providers/anthropic) để biết thông tin thanh toán hiện hành và các liên kết đến
    bài viết hỗ trợ của chính Anthropic. Để có thiết lập phía máy chủ dễ dự đoán nhất, hãy dùng
    khóa API Anthropic.
  </Accordion>

  <Accordion title="Có hỗ trợ xác thực bằng gói đăng ký Claude (Claude Pro hoặc Max) không?">
    Có, thông qua việc tái sử dụng Claude CLI. Cách Anthropic tính phí hoạt động sử dụng `claude -p`/Agent SDK
    đã thay đổi theo thời gian; xem [Anthropic](/vi/providers/anthropic) để biết trạng thái hiện tại và
    các liên kết có ghi ngày đến bài viết hỗ trợ của Anthropic trước khi dựa vào một cơ chế thanh toán
    cụ thể.

    Anthropic setup-token auth cũng vẫn là một phương thức token được hỗ trợ, nhưng OpenClaw ưu tiên
    tái sử dụng Claude CLI và `claude -p` khi có thể. Đối với khối lượng công việc production hoặc
    nhiều người dùng, khóa API Anthropic vẫn là lựa chọn an toàn và dễ dự đoán hơn. Các tùy chọn
    lưu trữ dạng thuê bao khác: [OpenAI](/vi/providers/openai), [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax), [Z.AI (GLM)](/vi/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Tại sao tôi thấy HTTP 429 rate_limit_error từ Anthropic?">
    **Hạn ngạch/giới hạn tốc độ Anthropic** của bạn đã cạn trong khoảng thời gian hiện tại. Trên **Claude
    CLI**, hãy chờ khoảng thời gian được đặt lại hoặc nâng cấp gói của bạn. Với **khóa API Anthropic**,
    hãy kiểm tra mức sử dụng/thanh toán trong Anthropic Console và tăng giới hạn khi cần.

    Nếu thông báo cụ thể là `Extra usage is required for long context requests`,
    yêu cầu đang cố sử dụng cửa sổ ngữ cảnh 1M của Anthropic (một mô hình Claude 4.x 1M
    hỗ trợ GA hoặc cấu hình `params.context1m: true` cũ), và thông tin xác thực hiện tại của bạn không
    đủ điều kiện để tính phí ngữ cảnh dài.

    Đặt một **mô hình dự phòng** để OpenClaw tiếp tục phản hồi khi một nhà cung cấp bị giới hạn tốc độ.
    Xem [Mô hình](/vi/cli/models), [OAuth](/vi/concepts/oauth) và
    [Anthropic 429 yêu cầu mức sử dụng bổ sung cho ngữ cảnh dài](/vi/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock có được hỗ trợ không?">
    Có. OpenClaw tích hợp sẵn nhà cung cấp **Amazon Bedrock (Converse)**. Khi có các dấu hiệu môi trường
    AWS (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw tự động bật nhà cung cấp Bedrock ngầm định để khám phá mô hình; nếu không,
    hãy đặt `plugins.entries.amazon-bedrock.config.discovery.enabled: true` hoặc thêm thủ công một
    mục nhà cung cấp. Xem [Amazon Bedrock](/vi/providers/bedrock) và [Nhà cung cấp mô hình](/vi/providers/models).
    Proxy tương thích với OpenAI đặt trước Bedrock vẫn là một tùy chọn hợp lệ nếu bạn muốn dùng luồng khóa được quản lý.
  </Accordion>

  <Accordion title="Xác thực Codex hoạt động như thế nào?">
    OpenClaw hỗ trợ **OpenAI Codex** qua OAuth (đăng nhập ChatGPT). Một quy trình
    thiết lập mới không có mô hình chính sẽ dùng chính xác `openai/gpt-5.6-sol` cho
    xác thực thuê bao ChatGPT/Codex cùng khả năng thực thi app-server Codex gốc.
    Việc xác thực lại giữ nguyên mô hình tường minh hiện có, bao gồm
    `openai/gpt-5.5`. Nếu không gian làm việc Codex không cung cấp GPT-5.6, hãy chọn
    tường minh `openai/gpt-5.5`; OpenClaw không âm thầm hạ cấp. Các tham chiếu
    mô hình có tiền tố Codex cũ là cấu hình cũ được `openclaw doctor
    --fix` sửa chữa. Quyền truy cập trực tiếp bằng khóa API OpenAI vẫn khả dụng cho các
    bề mặt API OpenAI không dành cho agent và, thông qua hồ sơ khóa API `openai` có thứ tự, cũng dành cho các
    mô hình agent. Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) và
    [Hướng dẫn thiết lập (CLI)](/vi/start/wizard).
  </Accordion>

  <Accordion title="Tại sao OpenClaw vẫn đề cập đến tiền tố OpenAI Codex cũ?">
    `openai` là mã định danh nhà cung cấp và hồ sơ xác thực hiện tại cho cả khóa API OpenAI lẫn
    OAuth ChatGPT/Codex - OpenAI Codex đã được hợp nhất vào đó. Bạn vẫn có thể thấy tiền tố
    `openai-codex` cũ trong cấu hình cũ hơn và các cảnh báo di chuyển:

    - `openai/gpt-5.6-sol` = thiết lập thuê bao ChatGPT/Codex mới với runtime Codex gốc cho các lượt agent.
    - `openai/gpt-5.5` = lựa chọn tường minh được hỗ trợ cho cấu hình hiện có hoặc tài khoản không có quyền truy cập GPT-5.6.
    - Các tham chiếu mô hình `openai-codex/*` cũ = tuyến cũ được `openclaw doctor --fix` sửa chữa.
    - `openai/gpt-5.5` cùng hồ sơ khóa API `openai` có thứ tự = xác thực bằng khóa API cho mô hình agent OpenAI.
    - Các mã định danh hồ sơ xác thực `openai-codex` cũ = các mã định danh cũ được `openclaw doctor --fix` di chuyển.

    Muốn thanh toán trực tiếp qua OpenAI Platform? Hãy đặt `OPENAI_API_KEY`. Muốn xác thực
    thuê bao ChatGPT/Codex? Hãy chạy `openclaw models auth login --provider openai`. Giữ
    các tham chiếu mô hình dưới nhà cung cấp `openai/*` chuẩn. Thiết lập thuê bao
    mới dùng chính xác `openai/gpt-5.6-sol`; doctor sửa chữa các tham chiếu có tiền tố Codex cũ
    mà không nâng cấp lựa chọn `openai/gpt-5.5` tường minh.

  </Accordion>

  <Accordion title="Tại sao giới hạn OAuth Codex có thể khác với ChatGPT web?">
    OAuth Codex sử dụng các khoảng hạn ngạch do OpenAI quản lý và phụ thuộc vào gói, có thể khác với
    trải nghiệm trên trang web/ứng dụng ChatGPT, ngay cả trên cùng một tài khoản.

    `openclaw models status` hiển thị các khoảng sử dụng/hạn ngạch hiện thấy của nhà cung cấp, nhưng
    không tự tạo hoặc chuẩn hóa quyền lợi ChatGPT web thành quyền truy cập API trực tiếp. Đối với
    phương thức thanh toán/giới hạn trực tiếp của OpenAI Platform, hãy dùng `openai/*` với khóa API.

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực thuê bao OpenAI (OAuth Codex) không?">
    Có, hỗ trợ đầy đủ. OpenAI cho phép rõ ràng việc sử dụng OAuth thuê bao trong các
    công cụ/quy trình làm việc bên ngoài như OpenClaw. Quy trình thiết lập ban đầu có thể chạy luồng OAuth cho bạn.

    Xem [OAuth](/vi/concepts/oauth), [Nhà cung cấp mô hình](/vi/concepts/model-providers) và [Hướng dẫn thiết lập (CLI)](/vi/start/wizard).

  </Accordion>

  <Accordion title="Làm cách nào để thiết lập OAuth Gemini CLI?">
    Gemini CLI sử dụng **luồng xác thực Plugin**, không phải mã định danh máy khách hoặc bí mật trong `openclaw.json`.

    1. Cài đặt Gemini CLI cục bộ để `gemini` nằm trên `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Bật Plugin: `openclaw plugins enable google`
    3. Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Mô hình mặc định sau khi đăng nhập: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. Yêu cầu thất bại sau khi đăng nhập? Đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway rồi thử lại.

    Token OAuth được lưu trong các hồ sơ xác thực trên máy chủ Gateway. Chi tiết: [Google](/vi/providers/google), [Nhà cung cấp mô hình](/vi/concepts/model-providers).

  </Accordion>

  <Accordion title="Mô hình cục bộ có phù hợp cho trò chuyện thông thường không?">
    Thường là không. OpenClaw cần ngữ cảnh lớn và khả năng an toàn mạnh; các card nhỏ cắt ngắn ngữ cảnh
    và bỏ qua bộ lọc an toàn phía nhà cung cấp. Nếu bắt buộc, hãy chạy bản dựng mô hình **lớn nhất** mà bạn
    có thể chạy cục bộ (LM Studio) - xem [Mô hình cục bộ](/vi/gateway/local-models). Các mô hình nhỏ hơn/được lượng tử hóa
    làm tăng rủi ro chèn prompt - xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Làm cách nào để giữ lưu lượng mô hình được lưu trữ trong một khu vực cụ thể?">
    Chọn các endpoint được cố định theo khu vực. OpenRouter cung cấp các tùy chọn được lưu trữ tại Hoa Kỳ cho MiniMax, Kimi
    và GLM; hãy chọn biến thể được lưu trữ tại Hoa Kỳ để giữ dữ liệu trong khu vực. Bạn vẫn có thể liệt kê
    Anthropic/OpenAI cùng với chúng bằng `models.mode: "merge"` để các phương án dự phòng vẫn
    khả dụng trong khi tôn trọng nhà cung cấp theo khu vực mà bạn chọn.
  </Accordion>

  <Accordion title="Tôi có phải mua Mac Mini để cài đặt ứng dụng này không?">
    Không. OpenClaw chạy trên macOS hoặc Linux (Windows qua WSL2). Mac mini là lựa chọn máy chủ
    luôn bật phổ biến, nhưng VPS nhỏ, máy chủ gia đình hoặc thiết bị cấp Raspberry Pi cũng dùng được.

    Bạn chỉ cần máy Mac **cho các công cụ chỉ dành cho macOS**. Với iMessage, hãy dùng [iMessage](/vi/channels/imessage)
    cùng `imsg` trên bất kỳ máy Mac nào đã đăng nhập vào Messages - nếu Gateway chạy trên Linux hoặc nơi khác,
    hãy đặt `channels.imessage.cliPath` thành trình bao bọc SSH chạy `imsg` trên máy Mac đó. Với các
    công cụ chỉ dành cho macOS khác, hãy chạy Gateway trên máy Mac hoặc ghép nối một Node macOS.

    Tài liệu: [iMessage](/vi/channels/imessage), [Node](/vi/nodes), [Chế độ từ xa trên Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi có cần Mac mini để hỗ trợ iMessage không?">
    Bạn cần **một thiết bị macOS nào đó** đã đăng nhập vào Messages - không nhất thiết là Mac mini, bất kỳ
    máy Mac nào cũng được. Dùng [iMessage](/vi/channels/imessage) cùng `imsg`; Gateway có thể chạy trên
    máy Mac đó hoặc ở nơi khác với trình bao bọc SSH `cliPath`.

    Các cách thiết lập phổ biến:

    - Gateway trên Linux/VPS, `channels.imessage.cliPath` được đặt thành trình bao bọc SSH chạy `imsg` trên máy Mac đã đăng nhập vào Messages.
    - Mọi thứ trên một máy Mac để có thiết lập một máy đơn giản nhất.

    Tài liệu: [iMessage](/vi/channels/imessage), [Node](/vi/nodes), [Chế độ từ xa trên Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Nếu mua Mac mini để chạy OpenClaw, tôi có thể kết nối nó với MacBook Pro không?">
    Có. **Mac mini có thể chạy Gateway**, còn MacBook Pro của bạn kết nối dưới dạng **Node**
    (thiết bị đồng hành). Node không chạy Gateway - chúng bổ sung các khả năng như
    màn hình/camera/canvas và `system.run` trên thiết bị đó.

    Mô hình phổ biến: Gateway trên Mac mini luôn bật; MacBook Pro chạy ứng dụng macOS hoặc
    máy chủ Node và ghép nối với Gateway. Kiểm tra bằng `openclaw nodes status` / `openclaw nodes list`.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể sử dụng Bun không?">
    Bạn có thể dùng Bun để cài đặt các phần phụ thuộc hoặc chạy các tập lệnh gói. CLI OpenClaw và
    Gateway yêu cầu **Node** vì kho trạng thái chuẩn sử dụng `node:sqlite`; Bun không
    cung cấp API đó.
  </Accordion>

  <Accordion title="Telegram: cần điền gì vào allowFrom?">
    `channels.telegram.allowFrom` là **mã định danh người dùng Telegram của người gửi** (dạng số),
    không phải tên người dùng bot. Quá trình thiết lập chỉ yêu cầu mã định danh người dùng dạng số; `openclaw doctor --fix`
    có thể thử phân giải các mục `@username` cũ.

    An toàn hơn (không dùng bot bên thứ ba): nhắn tin riêng cho bot của bạn, chạy `openclaw logs --follow`, đọc `from.id`.

    Bot API chính thức: nhắn tin riêng cho bot của bạn, gọi `https://api.telegram.org/bot<bot_token>/getUpdates`, đọc `message.from.id`.

    Bên thứ ba (ít riêng tư hơn): nhắn tin riêng cho `@userinfobot` hoặc `@getidsbot`.

    Xem [Kiểm soát truy cập Telegram](/vi/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Nhiều người có thể dùng một số WhatsApp với các phiên bản OpenClaw khác nhau không?">
    Có, thông qua **định tuyến đa agent**. Liên kết tin nhắn riêng WhatsApp của từng người gửi (`peer: { kind: "direct", id: "+15551234567" }`) với một `agentId` khác nhau để mỗi người có không gian làm việc và kho phiên riêng. Các phản hồi vẫn đến từ **cùng một tài khoản WhatsApp**; kiểm soát truy cập tin nhắn riêng (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) áp dụng toàn cục cho từng tài khoản. Xem [Định tuyến đa agent](/vi/concepts/multi-agent) và [WhatsApp](/vi/channels/whatsapp).
  </Accordion>

  <Accordion title='Tôi có thể chạy một agent "trò chuyện nhanh" và một agent "Opus để lập trình" không?'>
    Có. Dùng định tuyến đa agent: đặt mô hình mặc định riêng cho từng agent, sau đó liên kết các
    tuyến gửi đến (tài khoản nhà cung cấp hoặc các đối tác cụ thể) với từng agent. Cấu hình mẫu:
    [Định tuyến đa agent](/vi/concepts/multi-agent). Xem thêm [Mô hình](/vi/concepts/models) và
    [Cấu hình](/vi/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew có hoạt động trên Linux không?">
    Có, thông qua Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Khi chạy OpenClaw qua systemd: hãy đảm bảo PATH của dịch vụ bao gồm
    `/home/linuxbrew/.linuxbrew/bin` (hoặc tiền tố brew của bạn) để các công cụ được cài bằng `brew`
    có thể được phân giải trong shell không đăng nhập. Các bản dựng gần đây cũng thêm trước các thư mục bin người dùng phổ biến trên
    dịch vụ systemd Linux (ví dụ `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) và tuân theo `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` và `FNM_DIR` khi được đặt.

  </Accordion>

  <Accordion title="Khác biệt giữa cài đặt git có thể chỉnh sửa và cài đặt npm">
    - **Cài đặt có thể chỉnh sửa (git):** bản sao mã nguồn đầy đủ, có thể chỉnh sửa, phù hợp nhất cho người đóng góp. Bạn xây dựng cục bộ và có thể sửa mã/tài liệu.
    - **Cài đặt npm:** cài đặt CLI toàn cục, không có repo, phù hợp nhất khi muốn "chỉ cần chạy". Các bản cập nhật đến từ dist-tag npm.

    Tài liệu: [Bắt đầu](/vi/start/getting-started), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Sau này tôi có thể chuyển đổi giữa bản cài đặt npm và git không?">
    Có, bằng `openclaw update --channel ...` trên bản cài đặt hiện có. Thao tác này **không
    xóa dữ liệu của bạn** — chỉ thay đổi bản cài đặt mã nguồn OpenClaw. Trạng thái (`~/.openclaw`) và
    không gian làm việc (`~/.openclaw/workspace`) vẫn không bị ảnh hưởng.

    Từ npm sang git:

    ```bash
    openclaw update --channel dev
    ```

    Từ git sang npm:

    ```bash
    openclaw update --channel stable
    ```

    Thêm `--dry-run` để xem trước việc chuyển đổi chế độ dự kiến. Trình cập nhật chạy các bước
    tiếp theo của Doctor, làm mới nguồn plugin cho kênh đích và khởi động lại Gateway
    trừ khi bạn truyền `--no-restart`.

    Trình cài đặt cũng có thể buộc sử dụng một trong hai chế độ:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Mẹo sao lưu: [Vị trí lưu trữ trên ổ đĩa](/vi/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Tôi nên chạy Gateway trên máy tính xách tay hay VPS?">
    Muốn độ tin cậy 24/7? Hãy dùng **VPS**. Muốn ít trở ngại nhất và chấp nhận
    chế độ ngủ/khởi động lại? Hãy chạy cục bộ.

    **Máy tính xách tay (Gateway cục bộ)**

    - **Ưu điểm:** không tốn chi phí máy chủ, truy cập trực tiếp vào tệp cục bộ, có cửa sổ trình duyệt trực tiếp.
    - **Nhược điểm:** chế độ ngủ/mất mạng sẽ làm mất kết nối, các bản cập nhật/khởi động lại hệ điều hành sẽ gây gián đoạn, máy phải luôn hoạt động.

    **VPS / đám mây**

    - **Ưu điểm:** luôn hoạt động, mạng ổn định, không gặp vấn đề máy tính xách tay chuyển sang chế độ ngủ, dễ duy trì hoạt động hơn.
    - **Nhược điểm:** thường không có giao diện đồ họa (dùng ảnh chụp màn hình), chỉ truy cập tệp từ xa, cần SSH để cập nhật.

    WhatsApp/Telegram/Slack/Mattermost/Discord đều hoạt động tốt trên VPS — điểm
    đánh đổi thực sự là trình duyệt không có giao diện so với cửa sổ hiển thị. Xem [Trình duyệt](/vi/tools/browser).

    Khuyến nghị mặc định: dùng VPS nếu trước đây Gateway từng bị mất kết nối; chạy cục bộ rất phù hợp
    khi bạn đang chủ động sử dụng máy Mac và muốn truy cập tệp cục bộ hoặc tự động hóa giao diện
    trong trình duyệt hiển thị.

  </Accordion>

  <Accordion title="Việc chạy OpenClaw trên một máy chuyên dụng quan trọng đến mức nào?">
    Không bắt buộc, nhưng được khuyến nghị để tăng độ tin cậy và khả năng cô lập.

    - **Máy chủ chuyên dụng (VPS/Mac mini/Raspberry Pi):** luôn hoạt động, ít bị gián đoạn do chế độ ngủ/khởi động lại hơn, quyền hạn gọn gàng hơn, dễ duy trì hoạt động hơn.
    - **Máy tính xách tay/máy tính để bàn dùng chung:** phù hợp để thử nghiệm và sử dụng chủ động, nhưng sẽ có thời gian tạm dừng khi máy chuyển sang chế độ ngủ hoặc cập nhật.

    Giải pháp kết hợp ưu điểm của cả hai: giữ Gateway trên một máy chủ chuyên dụng và ghép nối máy tính xách tay của bạn dưới dạng
    **node** để dùng các công cụ màn hình/camera/exec cục bộ. Xem [Các Node](/vi/nodes) và [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Yêu cầu VPS tối thiểu và hệ điều hành được khuyến nghị là gì?">
    - **Mức tối thiểu tuyệt đối:** 1 vCPU, 1 GB RAM, ~500 MB ổ đĩa.
    - **Khuyến nghị:** 1-2 vCPU, RAM 2 GB trở lên để có dung lượng dự phòng (nhật ký, nội dung đa phương tiện, nhiều kênh). Các công cụ Node và tự động hóa trình duyệt có thể tiêu tốn nhiều tài nguyên.

    Hệ điều hành: **Ubuntu LTS** (hoặc bất kỳ Debian/Ubuntu hiện đại nào) — quy trình cài đặt Linux được kiểm thử kỹ nhất.

    Tài liệu: [Linux](/vi/platforms/linux), [Lưu trữ trên VPS](/vi/vps).

  </Accordion>

  <Accordion title="Tôi có thể chạy OpenClaw trong máy ảo không và có những yêu cầu gì?">
    Có. Hãy coi máy ảo như VPS: máy cần luôn hoạt động, có thể truy cập được và có đủ RAM
    cho Gateway cùng mọi kênh bạn bật.

    - **Mức tối thiểu tuyệt đối:** 1 vCPU, 1 GB RAM.
    - **Khuyến nghị:** RAM 2 GB trở lên cho nhiều kênh, tự động hóa trình duyệt hoặc công cụ đa phương tiện.
    - **Hệ điều hành:** Ubuntu LTS hoặc một Debian/Ubuntu hiện đại khác.

    Trên Windows, hãy dùng **Windows Hub** để thiết lập môi trường máy tính để bàn hoặc WSL2 cho máy ảo Gateway kiểu Linux
    với khả năng tương thích rộng với các công cụ. Xem [Windows](/vi/platforms/windows), [Lưu trữ trên VPS](/vi/vps).
    Để chạy macOS trong máy ảo, xem [Máy ảo macOS](/vi/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Câu hỏi thường gặp](/vi/help/faq) — phần câu hỏi thường gặp chính (mô hình, phiên, Gateway, bảo mật và nội dung khác)
- [Tổng quan về cài đặt](/vi/install)
- [Bắt đầu sử dụng](/vi/start/getting-started)
- [Khắc phục sự cố](/vi/help/troubleshooting)
