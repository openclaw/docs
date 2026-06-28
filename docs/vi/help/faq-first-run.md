---
read_when:
    - Cài đặt mới, quy trình onboarding bị kẹt, hoặc lỗi trong lần chạy đầu tiên
    - Chọn xác thực và gói đăng ký nhà cung cấp
    - Không thể truy cập docs.openclaw.ai, không thể mở bảng điều khiển, quá trình cài đặt bị kẹt
sidebarTitle: First-run FAQ
summary: 'Câu hỏi thường gặp: thiết lập khởi động nhanh và lần chạy đầu tiên — cài đặt, onboard, xác thực, đăng ký, lỗi ban đầu'
title: 'Câu hỏi thường gặp: thiết lập lần đầu'
x-i18n:
    generated_at: "2026-06-28T20:43:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hỏi đáp khởi động nhanh và thiết lập lần chạy đầu tiên. Đối với vận hành hằng ngày, mô hình, xác thực, phiên,
  và xử lý sự cố, xem [FAQ](/vi/help/faq) chính.

  ## Khởi động nhanh và thiết lập lần chạy đầu tiên

  <AccordionGroup>
  <Accordion title="Tôi đang bị kẹt, cách nhanh nhất để thoát kẹt">
    Hãy dùng một tác nhân AI cục bộ có thể **nhìn thấy máy của bạn**. Cách này hiệu quả hơn nhiều so với việc hỏi
    trên Discord, vì hầu hết các trường hợp "tôi bị kẹt" là **vấn đề cấu hình cục bộ hoặc môi trường** mà
    người hỗ trợ từ xa không thể kiểm tra.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Các công cụ này có thể đọc repo, chạy lệnh, kiểm tra nhật ký, và giúp sửa thiết lập ở cấp máy
    (PATH, dịch vụ, quyền, tệp xác thực). Cung cấp cho chúng **toàn bộ bản checkout mã nguồn** thông qua
    cài đặt có thể chỉnh sửa (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cách này cài OpenClaw **từ một checkout git**, để tác nhân có thể đọc mã + tài liệu và
    suy luận về đúng phiên bản bạn đang chạy. Bạn luôn có thể chuyển lại về bản ổn định sau này
    bằng cách chạy lại trình cài đặt mà không có `--install-method git`.

    Mẹo: yêu cầu tác nhân **lập kế hoạch và giám sát** bản sửa (từng bước), rồi chỉ thực thi
    các lệnh cần thiết. Như vậy các thay đổi sẽ nhỏ và dễ kiểm tra hơn.

    Nếu bạn phát hiện lỗi thật hoặc có bản sửa, vui lòng tạo issue trên GitHub hoặc gửi PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bắt đầu bằng các lệnh này (chia sẻ đầu ra khi yêu cầu trợ giúp):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Chúng làm gì:

    - `openclaw status`: ảnh chụp nhanh tình trạng gateway/tác nhân + cấu hình cơ bản.
    - `openclaw models status`: kiểm tra xác thực provider + khả dụng mô hình.
    - `openclaw doctor`: xác thực và sửa các vấn đề cấu hình/trạng thái thường gặp.

    Các kiểm tra CLI hữu ích khác: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Vòng lặp gỡ lỗi nhanh: [60 giây đầu tiên nếu có gì đó bị hỏng](/vi/help/faq#first-60-seconds-if-something-is-broken).
    Tài liệu cài đặt: [Cài đặt](/vi/install), [Cờ trình cài đặt](/vi/install/installer), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Heartbeat liên tục bị bỏ qua. Các lý do bỏ qua nghĩa là gì?">
    Các lý do bỏ qua heartbeat thường gặp:

    - `quiet-hours`: ngoài khung giờ hoạt động đã cấu hình
    - `empty-heartbeat-file`: `HEARTBEAT.md` tồn tại nhưng chỉ chứa phần khung trống, nhận xét, tiêu đề, fence, hoặc checklist rỗng
    - `no-tasks-due`: chế độ tác vụ `HEARTBEAT.md` đang hoạt động nhưng chưa đến hạn cho bất kỳ khoảng tác vụ nào
    - `alerts-disabled`: toàn bộ khả năng hiển thị heartbeat bị tắt (`showOk`, `showAlerts`, và `useIndicator` đều tắt)

    Trong chế độ tác vụ, dấu thời gian đến hạn chỉ được đẩy tiến sau khi một lần chạy heartbeat thật
    hoàn tất. Các lần chạy bị bỏ qua không đánh dấu tác vụ là đã hoàn thành.

    Tài liệu: [Heartbeat](/vi/gateway/heartbeat), [Tự động hóa](/vi/automation).

  </Accordion>

  <Accordion title="Cách được khuyến nghị để cài đặt và thiết lập OpenClaw">
    Repo khuyến nghị chạy từ mã nguồn và dùng onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn cũng có thể tự động dựng tài nguyên UI. Sau onboarding, bạn thường chạy Gateway trên cổng **18789**.

    Từ mã nguồn (người đóng góp/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Nếu bạn chưa có bản cài toàn cục, hãy chạy qua `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Làm thế nào để mở dashboard sau onboarding?">
    Trình hướng dẫn mở trình duyệt của bạn bằng một URL dashboard sạch (không token hóa) ngay sau onboarding và cũng in liên kết trong phần tóm tắt. Giữ tab đó mở; nếu nó không tự mở, hãy sao chép/dán URL được in trên cùng máy.
  </Accordion>

  <Accordion title="Làm thế nào để xác thực dashboard trên localhost so với từ xa?">
    **Localhost (cùng máy):**

    - Mở `http://127.0.0.1:18789/`.
    - Nếu nó yêu cầu xác thực shared-secret, dán token hoặc mật khẩu đã cấu hình vào phần cài đặt Control UI.
    - Nguồn token: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
    - Nguồn mật khẩu: `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
    - Nếu chưa cấu hình shared secret, tạo token bằng `openclaw doctor --generate-gateway-token`.

    **Không trên localhost:**

    - **Tailscale Serve** (khuyến nghị): giữ bind loopback, chạy `openclaw gateway --tailscale serve`, mở `https://<magicdns>/`. Nếu `gateway.auth.allowTailscale` là `true`, header danh tính đáp ứng xác thực Control UI/WebSocket (không cần dán shared secret, giả định máy chủ gateway đáng tin cậy); HTTP API vẫn yêu cầu xác thực shared-secret trừ khi bạn chủ động dùng private-ingress `none` hoặc xác thực HTTP trusted-proxy.
      Các lần thử xác thực Serve đồng thời không hợp lệ từ cùng một client được tuần tự hóa trước khi bộ giới hạn failed-auth ghi nhận chúng, nên lần thử lại không hợp lệ thứ hai có thể đã hiển thị `retry later`.
    - **Tailnet bind**: chạy `openclaw gateway --bind tailnet --token "<token>"` (hoặc cấu hình xác thực bằng mật khẩu), mở `http://<tailscale-ip>:18789/`, rồi dán shared secret tương ứng trong phần cài đặt dashboard.
    - **Reverse proxy nhận biết danh tính**: đặt Gateway phía sau một proxy đáng tin cậy, cấu hình `gateway.auth.mode: "trusted-proxy"`, rồi mở URL proxy. Proxy loopback cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`. Xác thực shared-secret vẫn áp dụng qua tunnel; dán token hoặc mật khẩu đã cấu hình nếu được nhắc.

    Xem [Dashboard](/vi/web/dashboard) và [Bề mặt web](/vi/web) để biết các chế độ bind và chi tiết xác thực.

  </Accordion>

  <Accordion title="Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua chat?">
    Chúng điều khiển các lớp khác nhau:

    - `approvals.exec`: chuyển tiếp lời nhắc phê duyệt đến các đích chat
    - `channels.<channel>.execApprovals`: khiến kênh đó hoạt động như một client phê duyệt native cho phê duyệt exec

    Chính sách exec của host vẫn là cổng phê duyệt thật. Cấu hình chat chỉ kiểm soát nơi lời nhắc
    phê duyệt xuất hiện và cách mọi người có thể trả lời.

    Trong hầu hết thiết lập, bạn **không** cần cả hai:

    - Nếu chat đã hỗ trợ lệnh và trả lời, `/approve` trong cùng chat hoạt động qua đường dẫn dùng chung.
    - Nếu một kênh native được hỗ trợ có thể suy ra người phê duyệt một cách an toàn, OpenClaw giờ tự động bật phê duyệt native ưu tiên DM khi `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`.
    - Khi có thẻ/nút phê duyệt native, UI native đó là đường dẫn chính; tác nhân chỉ nên đưa vào lệnh `/approve` thủ công nếu kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    - Dùng `approvals.exec` chỉ khi lời nhắc cũng phải được chuyển tiếp đến các chat khác hoặc phòng ops rõ ràng.
    - Dùng `channels.<channel>.execApprovals.target: "channel"` hoặc `"both"` chỉ khi bạn rõ ràng muốn lời nhắc phê duyệt được đăng lại vào phòng/chủ đề gốc.
    - Phê duyệt Plugin lại tách riêng: mặc định dùng `/approve` trong cùng chat, có thể chuyển tiếp bằng `approvals.plugin`, và chỉ một số kênh native giữ thêm xử lý plugin-approval-native phía trên.

    Tóm lại: chuyển tiếp dùng để định tuyến, cấu hình client native dùng cho UX giàu hơn theo từng kênh.
    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>

  <Accordion title="Tôi cần runtime nào?">
    Yêu cầu Node **>= 22**. Khuyến nghị dùng `pnpm`. Bun **không được khuyến nghị** cho Gateway.
  </Accordion>

  <Accordion title="Nó có chạy trên Raspberry Pi không?">
    Có. Gateway nhẹ - tài liệu ghi **512MB-1GB RAM**, **1 core**, và khoảng **500MB**
    dung lượng đĩa là đủ cho sử dụng cá nhân, và lưu ý rằng **Raspberry Pi 4 có thể chạy được**.

    Nếu bạn muốn dư tài nguyên hơn (nhật ký, media, dịch vụ khác), **khuyến nghị 2GB**, nhưng đó
    không phải mức tối thiểu bắt buộc.

    Mẹo: một Raspberry Pi/VPS nhỏ có thể host Gateway, và bạn có thể ghép nối **node** trên laptop/điện thoại để
    thực thi màn hình/camera/canvas hoặc lệnh cục bộ. Xem [Node](/vi/nodes).

  </Accordion>

  <Accordion title="Có mẹo nào cho cài đặt trên Raspberry Pi không?">
    Tóm tắt: chạy được, nhưng hãy chuẩn bị cho một số điểm chưa mượt.

    - Dùng OS **64-bit** và giữ Node >= 22.
    - Ưu tiên **cài đặt có thể chỉnh sửa (git)** để bạn có thể xem nhật ký và cập nhật nhanh.
    - Bắt đầu không có kênh/skills, rồi thêm từng cái một.
    - Nếu gặp vấn đề nhị phân kỳ lạ, thường đó là vấn đề **tương thích ARM**.

    Tài liệu: [Linux](/vi/platforms/linux), [Cài đặt](/vi/install).

  </Accordion>

  <Accordion title="Nó bị kẹt ở wake up my friend / onboarding không hatch. Giờ làm gì?">
    Màn hình đó phụ thuộc vào việc Gateway có thể truy cập được và đã xác thực. TUI cũng tự động gửi
    "Wake up, my friend!" trong lần hatch đầu tiên. Nếu bạn thấy dòng đó mà **không có phản hồi**
    và token vẫn ở 0, tác nhân chưa từng chạy.

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

    3. Nếu vẫn treo, chạy:

    ```bash
    openclaw doctor
    ```

    Nếu Gateway ở xa, hãy bảo đảm tunnel/kết nối Tailscale đang hoạt động và UI
    đang trỏ tới đúng Gateway. Xem [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể di chuyển thiết lập sang máy mới (Mac mini) mà không làm lại onboarding không?">
    Có. Sao chép **thư mục trạng thái** và **workspace**, rồi chạy Doctor một lần. Việc này
    giữ bot của bạn "y hệt" (bộ nhớ, lịch sử phiên, xác thực, và trạng thái kênh)
    miễn là bạn sao chép **cả hai** vị trí:

    1. Cài OpenClaw trên máy mới.
    2. Sao chép `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`) từ máy cũ.
    3. Sao chép workspace của bạn (mặc định: `~/.openclaw/workspace`).
    4. Chạy `openclaw doctor` và khởi động lại dịch vụ Gateway.

    Việc đó giữ nguyên cấu hình, hồ sơ xác thực, thông tin đăng nhập WhatsApp, phiên, và bộ nhớ. Nếu bạn đang ở
    chế độ từ xa, hãy nhớ host gateway sở hữu kho phiên và workspace.

    **Quan trọng:** nếu bạn chỉ commit/push workspace của mình lên GitHub, bạn đang sao lưu
    **bộ nhớ + tệp bootstrap**, nhưng **không** sao lưu lịch sử phiên hoặc xác thực. Chúng nằm
    dưới `~/.openclaw/` (ví dụ `~/.openclaw/agents/<agentId>/sessions/`).

    Liên quan: [Di chuyển](/vi/install/migrating), [Mọi thứ nằm ở đâu trên đĩa](/vi/help/faq#where-things-live-on-disk),
    [Workspace tác nhân](/vi/concepts/agent-workspace), [Doctor](/vi/gateway/doctor),
    [Chế độ từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi xem những điểm mới trong phiên bản mới nhất ở đâu?">
    Kiểm tra changelog trên GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Các mục mới nhất nằm ở trên cùng. Nếu phần trên cùng được đánh dấu **Unreleased**, phần có ngày
    tiếp theo là phiên bản đã phát hành mới nhất. Các mục được nhóm theo **Điểm nổi bật**, **Thay đổi**, và
    **Bản sửa lỗi** (cộng thêm các phần tài liệu/khác khi cần).

  </Accordion>

  <Accordion title="Không thể truy cập docs.openclaw.ai (lỗi SSL)">
    Một số kết nối Comcast/Xfinity chặn nhầm `docs.openclaw.ai` thông qua Xfinity
    Advanced Security. Tắt nó hoặc đưa `docs.openclaw.ai` vào danh sách cho phép, rồi thử lại.
    Vui lòng giúp chúng tôi gỡ chặn bằng cách báo cáo tại đây: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nếu bạn vẫn không truy cập được trang, tài liệu được sao chép trên GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Khác biệt giữa stable và beta">
    **Stable** và **beta** là **npm dist-tags**, không phải các nhánh mã riêng biệt:

    - `latest` = stable
    - `beta` = bản dựng sớm để kiểm thử

    Thông thường, một bản phát hành stable được đưa lên **beta** trước, rồi một bước
    thăng hạng rõ ràng sẽ chuyển cùng phiên bản đó sang `latest`. Maintainer cũng có thể
    phát hành thẳng lên `latest` khi cần. Vì vậy beta và stable có thể
    trỏ tới **cùng một phiên bản** sau khi thăng hạng.

    Xem những gì đã thay đổi:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Để xem các lệnh cài đặt một dòng và khác biệt giữa beta và dev, hãy xem accordion bên dưới.

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt phiên bản beta và beta khác gì dev?">
    **Beta** là npm dist-tag `beta` (có thể khớp với `latest` sau khi thăng hạng).
    **Dev** là đầu nhánh đang thay đổi của `main` (git); khi được phát hành, nó dùng npm dist-tag `dev`.

    Lệnh một dòng (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Trình cài đặt Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Chi tiết hơn: [Kênh phát triển](/vi/install/development-channels) và [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Làm cách nào để thử các phần mới nhất?">
    Hai tùy chọn:

    1. **Kênh dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Lệnh này chuyển sang nhánh `main` và cập nhật từ mã nguồn.

    2. **Cài đặt có thể chỉnh sửa (từ trang trình cài đặt):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cách này cung cấp cho bạn một repo cục bộ để có thể chỉnh sửa, rồi cập nhật qua git.

    Nếu bạn muốn tự clone sạch, hãy dùng:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Tài liệu: [Cập nhật](/vi/cli/update), [Kênh phát triển](/vi/install/development-channels),
    [Cài đặt](/vi/install).

  </Accordion>

  <Accordion title="Cài đặt và onboarding thường mất bao lâu?">
    Hướng dẫn ước lượng:

    - **Cài đặt:** 2-5 phút
    - **Onboarding QuickStart:** thường vài phút
    - **Onboarding đầy đủ:** lâu hơn khi đăng nhập nhà cung cấp, ghép đôi kênh, cài đặt daemon,
      tải xuống qua mạng, Skills, hoặc Plugin tùy chọn cần thiết lập thêm

    Trình hướng dẫn CLI hiển thị dòng thời gian này ngay từ đầu. Bạn có thể bỏ qua các bước tùy chọn và quay lại
    sau bằng `openclaw configure`.

    Nếu quá trình bị treo, hãy dùng [Trình cài đặt bị kẹt](#quick-start-and-first-run-setup)
    và vòng lặp gỡ lỗi nhanh trong [Tôi bị kẹt](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Trình cài đặt bị kẹt? Làm cách nào để nhận thêm phản hồi?">
    Chạy lại trình cài đặt với **đầu ra chi tiết**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Cài đặt beta với đầu ra chi tiết:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Với cài đặt có thể chỉnh sửa (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Tương đương trên Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Thêm tùy chọn: [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Cài đặt Windows báo không tìm thấy git hoặc không nhận ra openclaw">
    Hai vấn đề Windows thường gặp:

    **1) Lỗi npm spawn git / không tìm thấy git**

    - Cài đặt **Git for Windows** và đảm bảo `git` nằm trong PATH của bạn.
    - Đóng và mở lại PowerShell, rồi chạy lại trình cài đặt.

    **2) không nhận ra openclaw sau khi cài đặt**

    - Thư mục bin toàn cục của npm không nằm trong PATH.
    - Kiểm tra đường dẫn:

      ```powershell
      npm config get prefix
      ```

    - Thêm thư mục đó vào PATH người dùng của bạn (không cần hậu tố `\bin` trên Windows; trên hầu hết hệ thống, đó là `%AppData%\npm`).
    - Đóng và mở lại PowerShell sau khi cập nhật PATH.

    Để thiết lập desktop, hãy dùng ứng dụng **Windows Hub** gốc. Với thiết lập chỉ qua terminal,
    trình cài đặt PowerShell và các đường dẫn WSL2 Gateway đều được hỗ trợ.
    Tài liệu: [Windows](/vi/platforms/windows).

  </Accordion>

  <Accordion title="Đầu ra exec trên Windows hiển thị chữ Trung Quốc bị lỗi - tôi nên làm gì?">
    Đây thường là tình trạng không khớp code page của console trên các shell Windows gốc.

    Triệu chứng:

    - Đầu ra `system.run`/`exec` hiển thị chữ Trung Quốc thành mojibake
    - Cùng lệnh đó hiển thị bình thường trong một hồ sơ terminal khác

    Cách khắc phục nhanh trong PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sau đó khởi động lại Gateway và thử lại lệnh của bạn:

    ```powershell
    openclaw gateway restart
    ```

    Nếu bạn vẫn tái hiện được lỗi này trên OpenClaw mới nhất, hãy theo dõi/báo cáo tại:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Tài liệu không trả lời câu hỏi của tôi - làm cách nào để có câu trả lời tốt hơn?">
    Dùng **cài đặt có thể chỉnh sửa (git)** để bạn có toàn bộ mã nguồn và tài liệu cục bộ, rồi hỏi
    bot của bạn (hoặc Claude/Codex) _từ thư mục đó_ để nó có thể đọc repo và trả lời chính xác.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chi tiết hơn: [Cài đặt](/vi/install) và [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt OpenClaw trên Linux?">
    Trả lời ngắn gọn: làm theo hướng dẫn Linux, rồi chạy onboarding.

    - Đường dẫn nhanh cho Linux + cài đặt dịch vụ: [Linux](/vi/platforms/linux).
    - Hướng dẫn đầy đủ: [Bắt đầu](/vi/start/getting-started).
    - Trình cài đặt + cập nhật: [Cài đặt và cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Làm cách nào để cài đặt OpenClaw trên VPS?">
    Bất kỳ VPS Linux nào cũng dùng được. Cài đặt trên máy chủ, rồi dùng SSH/Tailscale để truy cập Gateway.

    Hướng dẫn: [exe.dev](/vi/install/exe-dev), [Hetzner](/vi/install/hetzner), [Fly.io](/vi/install/fly).
    Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Các hướng dẫn cài đặt cloud/VPS ở đâu?">
    Chúng tôi duy trì một **trung tâm lưu trữ** với các nhà cung cấp phổ biến. Chọn một nhà cung cấp và làm theo hướng dẫn:

    - [Lưu trữ VPS](/vi/vps) (tất cả nhà cung cấp ở một nơi)
    - [Fly.io](/vi/install/fly)
    - [Hetzner](/vi/install/hetzner)
    - [exe.dev](/vi/install/exe-dev)

    Cách hoạt động trên cloud: **Gateway chạy trên máy chủ**, và bạn truy cập nó
    từ laptop/điện thoại qua Control UI (hoặc Tailscale/SSH). Trạng thái + workspace của bạn
    nằm trên máy chủ, vì vậy hãy xem host là nguồn sự thật và sao lưu nó.

    Bạn có thể ghép đôi **node** (Mac/iOS/Android/headless) với Gateway trên cloud đó để truy cập
    màn hình/camera/canvas cục bộ hoặc chạy lệnh trên laptop trong khi vẫn giữ
    Gateway trên cloud.

    Trung tâm: [Nền tảng](/vi/platforms). Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).
    Node: [Nodes](/vi/nodes), [CLI Nodes](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể yêu cầu OpenClaw tự cập nhật không?">
    Trả lời ngắn gọn: **có thể, nhưng không khuyến nghị**. Luồng cập nhật có thể khởi động lại
    Gateway (làm mất phiên đang hoạt động), có thể cần một git checkout sạch, và
    có thể yêu cầu xác nhận. An toàn hơn: chạy cập nhật từ shell với vai trò operator.

    Dùng CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Nếu bạn bắt buộc phải tự động hóa từ một agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Tài liệu: [Cập nhật](/vi/cli/update), [Đang cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Onboarding thực sự làm gì?">
    `openclaw onboard` là đường dẫn thiết lập được khuyến nghị. Ở **chế độ cục bộ**, nó hướng dẫn bạn qua:

    - **Thiết lập mô hình/xác thực** (OAuth nhà cung cấp, khóa API, setup-token của Anthropic, cùng các tùy chọn mô hình cục bộ như LM Studio)
    - Vị trí **workspace** + tệp bootstrap
    - **Cài đặt Gateway** (bind/port/auth/tailscale)
    - **Kênh** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, cùng các Plugin kênh đi kèm như QQ Bot)
    - **Cài đặt daemon** (LaunchAgent trên macOS; systemd user unit trên Linux/WSL2)
    - Chọn **kiểm tra sức khỏe** và **Skills**

    Nó cũng đặt kỳ vọng về thời lượng trước khi các lời nhắc chính bắt đầu và cảnh báo nếu
    mô hình đã cấu hình của bạn không xác định hoặc thiếu xác thực.

  </Accordion>

  <Accordion title="Tôi có cần đăng ký Claude hoặc OpenAI để chạy ứng dụng này không?">
    Không. Bạn có thể chạy OpenClaw bằng **khóa API** (Anthropic/OpenAI/nhà cung cấp khác) hoặc bằng
    **mô hình chỉ cục bộ** để dữ liệu của bạn ở lại trên thiết bị. Các gói đăng ký (Claude
    Pro/Max hoặc OpenAI Codex) là cách tùy chọn để xác thực các nhà cung cấp đó.

    Với Anthropic trong OpenClaw, cách phân chia thực tế là:

    - **Khóa API Anthropic**: tính phí Anthropic API thông thường
    - **Claude CLI / xác thực đăng ký Claude trong OpenClaw**: nhân viên Anthropic
      cho chúng tôi biết cách dùng này lại được cho phép, và OpenClaw xem việc dùng `claude -p`
      là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới

    Với các host Gateway chạy lâu dài, khóa API Anthropic vẫn là thiết lập
    dễ dự đoán hơn. OpenAI Codex OAuth được hỗ trợ rõ ràng cho các
    công cụ bên ngoài như OpenClaw.

    OpenClaw cũng hỗ trợ các tùy chọn dạng đăng ký được lưu trữ khác, bao gồm
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, và
    **Z.AI / GLM Coding Plan**.

    Tài liệu: [Anthropic](/vi/providers/anthropic), [OpenAI](/vi/providers/openai),
    [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax), [Z.AI (GLM)](/vi/providers/zai),
    [Mô hình cục bộ](/vi/gateway/local-models), [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể dùng đăng ký Claude Max mà không cần khóa API không?">
    Có.

    Nhân viên Anthropic cho chúng tôi biết cách dùng Claude CLI kiểu OpenClaw lại được cho phép, vì vậy
    OpenClaw xem xác thực đăng ký Claude và việc dùng `claude -p` là được chấp thuận
    cho tích hợp này trừ khi Anthropic công bố chính sách mới. Nếu bạn muốn
    thiết lập phía máy chủ dễ dự đoán nhất, hãy dùng khóa API Anthropic thay thế.

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký Claude (Claude Pro hoặc Max) không?">
    Có.

    Nhân viên Anthropic cho chúng tôi biết cách dùng này lại được cho phép, vì vậy OpenClaw xem
    việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này
    trừ khi Anthropic công bố chính sách mới.

    Anthropic setup-token vẫn có sẵn như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.
    Với workload production hoặc nhiều người dùng, xác thực bằng khóa API Anthropic vẫn là
    lựa chọn an toàn hơn, dễ dự đoán hơn. Nếu bạn muốn các tùy chọn được lưu trữ
    dạng đăng ký khác trong OpenClaw, hãy xem [OpenAI](/vi/providers/openai), [Qwen / Model
    Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), và [GLM
    Models](/vi/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Tại sao tôi thấy HTTP 429 rate_limit_error từ Anthropic?">
    Điều đó có nghĩa là **hạn mức/giới hạn tốc độ Anthropic** của bạn đã cạn cho cửa sổ hiện tại. Nếu bạn
    dùng **Claude CLI**, hãy chờ cửa sổ đặt lại hoặc nâng cấp gói của bạn. Nếu bạn
    dùng **khóa API Anthropic**, hãy kiểm tra Anthropic Console
    để xem mức sử dụng/thanh toán và tăng giới hạn khi cần.

    Nếu thông báo cụ thể là:
    `Extra usage is required for long context requests`, yêu cầu đang cố dùng
    cửa sổ ngữ cảnh 1M của Anthropic (một mô hình Claude 4.x 1M có khả năng GA hoặc cấu hình cũ
    `context1m: true`). Điều đó chỉ hoạt động khi thông tin xác thực của bạn đủ điều kiện
    cho tính phí ngữ cảnh dài (thanh toán khóa API hoặc đường dẫn đăng nhập Claude của OpenClaw
    khi đã bật Extra Usage).

    Mẹo: đặt **mô hình dự phòng** để OpenClaw có thể tiếp tục phản hồi khi một nhà cung cấp bị giới hạn tốc độ.
    Xem [Mô hình](/vi/cli/models), [OAuth](/vi/concepts/oauth), và
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/vi/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock có được hỗ trợ không?">
    Có. OpenClaw có nhà cung cấp **Amazon Bedrock (Converse)** đi kèm. Khi có các dấu hiệu env AWS, OpenClaw có thể tự động khám phá danh mục Bedrock phát trực tuyến/văn bản và hợp nhất danh mục đó như một nhà cung cấp `amazon-bedrock` ngầm định; nếu không, bạn có thể bật rõ ràng `plugins.entries.amazon-bedrock.config.discovery.enabled` hoặc thêm mục nhà cung cấp thủ công. Xem [Amazon Bedrock](/vi/providers/bedrock) và [Nhà cung cấp mô hình](/vi/providers/models). Nếu bạn thích luồng khóa được quản lý, proxy tương thích OpenAI đặt trước Bedrock vẫn là một lựa chọn hợp lệ.
  </Accordion>

  <Accordion title="Xác thực Codex hoạt động như thế nào?">
    OpenClaw hỗ trợ **OpenAI Code (Codex)** qua OAuth (đăng nhập ChatGPT). Dùng
    `openai/gpt-5.5` cho thiết lập phổ biến: xác thực thuê bao ChatGPT/Codex cộng với
    thực thi app-server Codex gốc. Các tham chiếu Codex GPT cũ là
    cấu hình cũ được `openclaw doctor --fix` sửa chữa. Truy cập trực tiếp bằng khóa API OpenAI
    vẫn khả dụng cho các bề mặt API OpenAI không phải agent và cho mô hình
    agent thông qua hồ sơ khóa API `openai` có thứ tự.
    Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) và [Onboarding (CLI)](/vi/start/wizard).
  </Accordion>

  <Accordion title="Tại sao OpenClaw vẫn nhắc đến tiền tố OpenAI Codex cũ?">
    `openai` là id nhà cung cấp và hồ sơ xác thực cho cả khóa API OpenAI và
    OAuth ChatGPT/Codex. Bạn vẫn có thể thấy tiền tố OpenAI Codex cũ trong cấu hình cũ và
    cảnh báo di chuyển.
    Các cấu hình cũ hơn cũng dùng nó làm tiền tố mô hình:

    - `openai/gpt-5.5` = xác thực thuê bao ChatGPT/Codex với runtime Codex gốc cho lượt agent
    - tham chiếu Codex GPT-5.5 cũ = tuyến mô hình cũ được `openclaw doctor --fix` sửa chữa
    - `openai/gpt-5.5` cộng với hồ sơ khóa API `openai` có thứ tự = xác thực khóa API cho mô hình agent OpenAI
    - id hồ sơ xác thực Codex cũ = id hồ sơ xác thực cũ được `openclaw doctor --fix` di chuyển

    Nếu bạn muốn đường dẫn thanh toán/giới hạn trực tiếp của OpenAI Platform, hãy đặt
    `OPENAI_API_KEY`. Nếu bạn muốn xác thực thuê bao ChatGPT/Codex, hãy đăng nhập bằng
    `openclaw models auth login --provider openai`. Giữ tham chiếu mô hình là
    `openai/gpt-5.5`; các tham chiếu mô hình Codex cũ là cấu hình cũ mà
    `openclaw doctor --fix` viết lại.

  </Accordion>

  <Accordion title="Tại sao giới hạn Codex OAuth có thể khác ChatGPT web?">
    Codex OAuth dùng các cửa sổ hạn mức do OpenAI quản lý, phụ thuộc vào gói. Trên thực tế,
    các giới hạn đó có thể khác trải nghiệm trên website/ứng dụng ChatGPT, ngay cả khi
    cả hai gắn với cùng một tài khoản.

    OpenClaw có thể hiển thị các cửa sổ sử dụng/hạn mức hiện đang thấy của nhà cung cấp trong
    `openclaw models status`, nhưng nó không tự tạo hoặc chuẩn hóa quyền lợi ChatGPT-web
    thành truy cập API trực tiếp. Nếu bạn muốn đường dẫn thanh toán/giới hạn trực tiếp của OpenAI Platform, hãy dùng `openai/*` với khóa API.

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực thuê bao OpenAI (Codex OAuth) không?">
    Có. OpenClaw hỗ trợ đầy đủ **OAuth thuê bao OpenAI Code (Codex)**.
    OpenAI cho phép rõ ràng việc dùng OAuth thuê bao trong các công cụ/quy trình làm việc bên ngoài
    như OpenClaw. Onboarding có thể chạy luồng OAuth cho bạn.

    Xem [OAuth](/vi/concepts/oauth), [Nhà cung cấp mô hình](/vi/concepts/model-providers), và [Onboarding (CLI)](/vi/start/wizard).

  </Accordion>

  <Accordion title="Tôi thiết lập Gemini CLI OAuth như thế nào?">
    Gemini CLI dùng **luồng xác thực Plugin**, không phải client id hay secret trong `openclaw.json`.

    Các bước:

    1. Cài Gemini CLI cục bộ để `gemini` nằm trên `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Bật Plugin: `openclaw plugins enable google`
    3. Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Mô hình mặc định sau khi đăng nhập: `google-gemini-cli/gemini-3-flash-preview`
    5. Nếu yêu cầu thất bại, đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway

    Thao tác này lưu token OAuth trong hồ sơ xác thực trên máy chủ Gateway. Chi tiết: [Nhà cung cấp mô hình](/vi/concepts/model-providers).

  </Accordion>

  <Accordion title="Mô hình cục bộ có ổn cho trò chuyện thông thường không?">
    Thường là không. OpenClaw cần ngữ cảnh lớn + an toàn mạnh; các card nhỏ sẽ cắt cụt và rò rỉ. Nếu bắt buộc, hãy chạy bản dựng mô hình **lớn nhất** bạn có thể chạy cục bộ (LM Studio) và xem [/gateway/local-models](/vi/gateway/local-models). Các mô hình nhỏ hơn/lượng tử hóa làm tăng rủi ro prompt-injection - xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Làm thế nào để giữ lưu lượng mô hình hosted trong một khu vực cụ thể?">
    Chọn endpoint ghim theo khu vực. OpenRouter cung cấp các tùy chọn lưu trữ tại Mỹ cho MiniMax, Kimi và GLM; chọn biến thể lưu trữ tại Mỹ để giữ dữ liệu trong khu vực. Bạn vẫn có thể liệt kê Anthropic/OpenAI cùng các tùy chọn này bằng cách dùng `models.mode: "merge"` để các phương án dự phòng vẫn khả dụng trong khi vẫn tôn trọng nhà cung cấp theo khu vực bạn chọn.
  </Accordion>

  <Accordion title="Tôi có phải mua Mac Mini để cài đặt không?">
    Không. OpenClaw chạy trên macOS hoặc Linux (Windows qua WSL2). Mac mini là tùy chọn - một số người
    mua nó làm máy chủ luôn bật, nhưng một VPS nhỏ, máy chủ tại nhà hoặc hộp cỡ Raspberry Pi cũng dùng được.

    Bạn chỉ cần Mac **cho các công cụ chỉ chạy trên macOS**. Với iMessage, dùng [iMessage](/vi/channels/imessage) với `imsg` trên bất kỳ Mac nào đã đăng nhập Messages. Nếu Gateway chạy trên Linux hoặc nơi khác, đặt `channels.imessage.cliPath` thành một SSH wrapper chạy `imsg` trên Mac đó. Nếu bạn muốn các công cụ chỉ chạy trên macOS khác, hãy chạy Gateway trên Mac hoặc ghép nối một node macOS.

    Tài liệu: [iMessage](/vi/channels/imessage), [Node](/vi/nodes), [Chế độ từ xa Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi có cần Mac mini để hỗ trợ iMessage không?">
    Bạn cần **một thiết bị macOS nào đó** đã đăng nhập Messages. Thiết bị đó **không** nhất thiết phải là Mac mini -
    bất kỳ Mac nào cũng được. **Dùng [iMessage](/vi/channels/imessage)** với `imsg`; Gateway có thể chạy trên Mac đó, hoặc có thể chạy ở nơi khác với SSH wrapper `cliPath`.

    Các thiết lập phổ biến:

    - Chạy Gateway trên Linux/VPS, và đặt `channels.imessage.cliPath` thành SSH wrapper chạy `imsg` trên Mac đã đăng nhập Messages.
    - Chạy mọi thứ trên Mac nếu bạn muốn thiết lập một máy đơn giản nhất.

    Tài liệu: [iMessage](/vi/channels/imessage), [Node](/vi/nodes),
    [Chế độ từ xa Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Nếu tôi mua Mac mini để chạy OpenClaw, tôi có thể kết nối nó với MacBook Pro của mình không?">
    Có. **Mac mini có thể chạy Gateway**, và MacBook Pro của bạn có thể kết nối như một
    **node** (thiết bị đồng hành). Node không chạy Gateway - chúng cung cấp các
    khả năng bổ sung như màn hình/camera/canvas và `system.run` trên thiết bị đó.

    Mẫu phổ biến:

    - Gateway trên Mac mini (luôn bật).
    - MacBook Pro chạy ứng dụng macOS hoặc máy chủ node và ghép nối với Gateway.
    - Dùng `openclaw nodes status` / `openclaw nodes list` để xem nó.

    Tài liệu: [Node](/vi/nodes), [Node CLI](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể dùng Bun không?">
    Bun **không được khuyến nghị**. Chúng tôi thấy lỗi runtime, đặc biệt với WhatsApp và Telegram.
    Dùng **Node** cho các Gateway ổn định.

    Nếu bạn vẫn muốn thử nghiệm với Bun, hãy làm trên một Gateway không dùng cho sản xuất
    và không có WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: đặt gì trong allowFrom?">
    `channels.telegram.allowFrom` là **ID người dùng Telegram của người gửi là con người** (dạng số). Nó không phải tên người dùng bot.

    Thiết lập chỉ yêu cầu ID người dùng dạng số. Nếu bạn đã có các mục `@username` cũ trong cấu hình, `openclaw doctor --fix` có thể thử phân giải chúng.

    An toàn hơn (không cần bot bên thứ ba):

    - Nhắn DM cho bot của bạn, rồi chạy `openclaw logs --follow` và đọc `from.id`.

    Bot API chính thức:

    - Nhắn DM cho bot của bạn, rồi gọi `https://api.telegram.org/bot<bot_token>/getUpdates` và đọc `message.from.id`.

    Bên thứ ba (ít riêng tư hơn):

    - Nhắn DM cho `@userinfobot` hoặc `@getidsbot`.

    Xem [/channels/telegram](/vi/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Nhiều người có thể dùng một số WhatsApp với các phiên bản OpenClaw khác nhau không?">
    Có, thông qua **định tuyến đa agent**. Gắn **DM** WhatsApp của từng người gửi (peer `kind: "direct"`, người gửi E.164 như `+15551234567`) với một `agentId` khác nhau, để mỗi người có workspace và kho phiên riêng. Phản hồi vẫn đến từ **cùng tài khoản WhatsApp**, và kiểm soát truy cập DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) là toàn cục cho mỗi tài khoản WhatsApp. Xem [Định tuyến đa agent](/vi/concepts/multi-agent) và [WhatsApp](/vi/channels/whatsapp).
  </Accordion>

  <Accordion title='Tôi có thể chạy một agent "trò chuyện nhanh" và một agent "Opus cho coding" không?'>
    Có. Dùng định tuyến đa agent: cấp cho mỗi agent mô hình mặc định riêng, rồi gắn các tuyến đến (tài khoản nhà cung cấp hoặc peer cụ thể) với từng agent. Cấu hình ví dụ nằm trong [Định tuyến đa agent](/vi/concepts/multi-agent). Xem thêm [Mô hình](/vi/concepts/models) và [Cấu hình](/vi/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew có hoạt động trên Linux không?">
    Có. Homebrew hỗ trợ Linux (Linuxbrew). Thiết lập nhanh:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Nếu bạn chạy OpenClaw qua systemd, hãy đảm bảo PATH của service bao gồm `/home/linuxbrew/.linuxbrew/bin` (hoặc tiền tố brew của bạn) để các công cụ cài bằng `brew` được phân giải trong shell không đăng nhập.
    Các bản dựng gần đây cũng thêm trước các thư mục bin người dùng phổ biến trên dịch vụ systemd Linux (ví dụ `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) và tôn trọng `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, và `FNM_DIR` khi được đặt.

  </Accordion>

  <Accordion title="Khác biệt giữa cài đặt git có thể hack và cài đặt npm">
    - **Cài đặt có thể hack (git):** checkout đầy đủ mã nguồn, có thể chỉnh sửa, phù hợp nhất cho contributor.
      Bạn chạy build cục bộ và có thể vá code/tài liệu.
    - **Cài đặt npm:** cài CLI toàn cục, không có repo, phù hợp nhất để "chỉ chạy nó."
      Bản cập nhật đến từ dist-tag của npm.

    Tài liệu: [Bắt đầu](/vi/start/getting-started), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Tôi có thể chuyển giữa cài đặt npm và git sau này không?">
    Có. Dùng `openclaw update --channel ...` khi OpenClaw đã được cài đặt.
    Thao tác này **không xóa dữ liệu của bạn** - nó chỉ thay đổi bản cài code OpenClaw.
    Trạng thái (`~/.openclaw`) và workspace (`~/.openclaw/workspace`) của bạn vẫn giữ nguyên.

    Từ npm sang git:

    ```bash
    openclaw update --channel dev
    ```

    Từ git sang npm:

    ```bash
    openclaw update --channel stable
    ```

    Thêm `--dry-run` để xem trước lần chuyển chế độ đã lên kế hoạch. Trình cập nhật sẽ chạy
    các bước theo dõi Doctor, làm mới nguồn plugin cho kênh đích, và
    khởi động lại Gateway trừ khi bạn truyền `--no-restart`.

    Trình cài đặt cũng có thể ép buộc một trong hai chế độ:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Mẹo sao lưu: xem [Chiến lược sao lưu](/vi/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Tôi nên chạy Gateway trên laptop hay VPS?">
    Câu trả lời ngắn gọn: **nếu bạn muốn độ tin cậy 24/7, hãy dùng VPS**. Nếu bạn muốn
    ít ma sát nhất và chấp nhận sleep/khởi động lại, hãy chạy cục bộ.

    **Laptop (Gateway cục bộ)**

    - **Ưu điểm:** không tốn chi phí máy chủ, truy cập trực tiếp vào tệp cục bộ, cửa sổ trình duyệt trực tiếp.
    - **Nhược điểm:** sleep/rớt mạng = ngắt kết nối, cập nhật/khởi động lại HĐH gây gián đoạn, phải luôn bật.

    **VPS / cloud**

    - **Ưu điểm:** luôn bật, mạng ổn định, không có vấn đề laptop sleep, dễ giữ cho chạy liên tục.
    - **Nhược điểm:** thường chạy headless (dùng ảnh chụp màn hình), chỉ truy cập tệp từ xa, bạn phải SSH để cập nhật.

    **Ghi chú riêng cho OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord đều hoạt động tốt từ VPS. Đánh đổi thực sự duy nhất là **trình duyệt headless** so với cửa sổ hiển thị được. Xem [Trình duyệt](/vi/tools/browser).

    **Mặc định được khuyến nghị:** VPS nếu trước đây bạn từng gặp Gateway bị ngắt kết nối. Cục bộ rất phù hợp khi bạn đang chủ động dùng Mac và muốn truy cập tệp cục bộ hoặc tự động hóa UI với trình duyệt hiển thị được.

  </Accordion>

  <Accordion title="Việc chạy OpenClaw trên một máy chuyên dụng quan trọng đến mức nào?">
    Không bắt buộc, nhưng **được khuyến nghị để có độ tin cậy và sự cô lập**.

    - **Máy chủ chuyên dụng (VPS/Mac mini/Raspberry Pi):** luôn bật, ít bị gián đoạn do sleep/khởi động lại hơn, quyền sạch hơn, dễ giữ cho chạy liên tục.
    - **Laptop/desktop dùng chung:** hoàn toàn ổn để thử nghiệm và sử dụng chủ động, nhưng hãy dự kiến sẽ có tạm dừng khi máy sleep hoặc cập nhật.

    Nếu bạn muốn điều tốt nhất của cả hai cách, hãy giữ Gateway trên một máy chủ chuyên dụng và ghép nối laptop của bạn làm **node** cho các công cụ màn hình/camera/exec cục bộ. Xem [Node](/vi/nodes).
    Để xem hướng dẫn bảo mật, đọc [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Yêu cầu VPS tối thiểu và HĐH được khuyến nghị là gì?">
    OpenClaw rất nhẹ. Với Gateway cơ bản + một kênh chat:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM, ~500MB ổ đĩa.
    - **Khuyến nghị:** 1-2 vCPU, 2GB RAM trở lên để có dư địa (nhật ký, media, nhiều kênh). Các công cụ Node và tự động hóa trình duyệt có thể tiêu tốn tài nguyên.

    HĐH: dùng **Ubuntu LTS** (hoặc bất kỳ Debian/Ubuntu hiện đại nào). Đường dẫn cài đặt Linux được kiểm thử tốt nhất ở đó.

    Tài liệu: [Linux](/vi/platforms/linux), [Lưu trữ VPS](/vi/vps).

  </Accordion>

  <Accordion title="Tôi có thể chạy OpenClaw trong VM không và yêu cầu là gì?">
    Có. Hãy xem VM giống như VPS: nó cần luôn bật, có thể truy cập được, và có đủ
    RAM cho Gateway cùng mọi kênh bạn bật.

    Hướng dẫn cơ sở:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM.
    - **Khuyến nghị:** 2GB RAM trở lên nếu bạn chạy nhiều kênh, tự động hóa trình duyệt, hoặc công cụ media.
    - **HĐH:** Ubuntu LTS hoặc một Debian/Ubuntu hiện đại khác.

    Nếu bạn đang dùng Windows, hãy dùng **Windows Hub** để thiết lập desktop, hoặc WSL2 khi
    bạn đặc biệt muốn một VM Gateway kiểu Linux với khả năng tương thích công cụ
    rộng. Xem [Windows](/vi/platforms/windows), [Lưu trữ VPS](/vi/vps).
    Nếu bạn đang chạy macOS trong VM, xem [VM macOS](/vi/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Liên quan

- [FAQ](/vi/help/faq) — FAQ chính (mô hình, phiên, gateway, bảo mật, thêm nữa)
- [Tổng quan cài đặt](/vi/install)
- [Bắt đầu](/vi/start/getting-started)
- [Khắc phục sự cố](/vi/help/troubleshooting)
