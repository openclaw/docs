---
read_when:
    - Cài đặt mới, quy trình hướng dẫn ban đầu bị kẹt, hoặc lỗi khi chạy lần đầu
    - Chọn xác thực và gói đăng ký của nhà cung cấp
    - Không thể truy cập docs.openclaw.ai, không thể mở bảng điều khiển, quá trình cài đặt bị kẹt
sidebarTitle: First-run FAQ
summary: 'Câu hỏi thường gặp: thiết lập bắt đầu nhanh và lần chạy đầu tiên — cài đặt, hướng dẫn ban đầu, xác thực, gói đăng ký, lỗi ban đầu'
title: 'Câu hỏi thường gặp: thiết lập lần chạy đầu tiên'
x-i18n:
    generated_at: "2026-04-29T22:48:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hỏi đáp khởi động nhanh và lần chạy đầu tiên. Đối với các thao tác hằng ngày, mô hình, xác thực, phiên,
  và khắc phục sự cố, xem [Câu hỏi thường gặp](/vi/help/faq) chính.

  ## Khởi động nhanh và thiết lập lần chạy đầu tiên

  <AccordionGroup>
  <Accordion title="Tôi bị kẹt, cách nhanh nhất để xử lý">
    Dùng một tác nhân AI cục bộ có thể **nhìn thấy máy của bạn**. Cách này hiệu quả hơn nhiều so với hỏi
    trên Discord, vì hầu hết các trường hợp "tôi bị kẹt" là **vấn đề cấu hình cục bộ hoặc môi trường** mà
    người hỗ trợ từ xa không thể kiểm tra.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Các công cụ này có thể đọc repo, chạy lệnh, kiểm tra nhật ký, và giúp sửa phần thiết lập ở cấp máy
    của bạn (PATH, dịch vụ, quyền, tệp xác thực). Cung cấp cho chúng **bản checkout mã nguồn đầy đủ** qua
    bản cài đặt có thể tùy biến (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Thao tác này cài OpenClaw **từ một git checkout**, để tác nhân có thể đọc mã + tài liệu và
    suy luận về đúng phiên bản bạn đang chạy. Bạn luôn có thể chuyển lại về bản ổn định sau này
    bằng cách chạy lại trình cài đặt mà không có `--install-method git`.

    Mẹo: yêu cầu tác nhân **lập kế hoạch và giám sát** bản sửa (từng bước), rồi chỉ thực thi
    các lệnh cần thiết. Cách này giữ thay đổi nhỏ và dễ kiểm tra hơn.

    Nếu bạn phát hiện lỗi thật hoặc bản sửa, vui lòng tạo GitHub issue hoặc gửi PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bắt đầu với các lệnh này (chia sẻ đầu ra khi yêu cầu trợ giúp):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Chúng làm gì:

    - `openclaw status`: ảnh chụp nhanh về tình trạng Gateway/tác nhân + cấu hình cơ bản.
    - `openclaw models status`: kiểm tra xác thực nhà cung cấp + khả dụng của mô hình.
    - `openclaw doctor`: xác thực và sửa các vấn đề cấu hình/trạng thái phổ biến.

    Các kiểm tra CLI hữu ích khác: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Vòng lặp gỡ lỗi nhanh: [60 giây đầu tiên nếu có gì đó bị hỏng](#first-60-seconds-if-something-is-broken).
    Tài liệu cài đặt: [Cài đặt](/vi/install), [Cờ trình cài đặt](/vi/install/installer), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Heartbeat liên tục bị bỏ qua. Các lý do bỏ qua có nghĩa là gì?">
    Các lý do bỏ qua heartbeat phổ biến:

    - `quiet-hours`: nằm ngoài khung giờ hoạt động đã cấu hình
    - `empty-heartbeat-file`: `HEARTBEAT.md` tồn tại nhưng chỉ chứa khung trống/chỉ có tiêu đề
    - `no-tasks-due`: chế độ tác vụ `HEARTBEAT.md` đang hoạt động nhưng chưa có khoảng thời gian tác vụ nào đến hạn
    - `alerts-disabled`: toàn bộ hiển thị heartbeat bị tắt (`showOk`, `showAlerts`, và `useIndicator` đều tắt)

    Ở chế độ tác vụ, dấu thời gian đến hạn chỉ được nâng lên sau khi một lần chạy heartbeat thật
    hoàn tất. Các lần chạy bị bỏ qua không đánh dấu tác vụ là đã hoàn tất.

    Tài liệu: [Heartbeat](/vi/gateway/heartbeat), [Tự động hóa & Tác vụ](/vi/automation).

  </Accordion>

  <Accordion title="Cách được khuyến nghị để cài đặt và thiết lập OpenClaw">
    Repo khuyến nghị chạy từ mã nguồn và dùng quy trình onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn cũng có thể tự động build tài nguyên UI. Sau onboarding, bạn thường chạy Gateway trên cổng **18789**.

    Từ mã nguồn (người đóng góp/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Nếu bạn chưa có bản cài đặt toàn cục, hãy chạy qua `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Làm thế nào để mở bảng điều khiển sau onboarding?">
    Trình hướng dẫn mở trình duyệt của bạn bằng URL bảng điều khiển sạch (không token hóa) ngay sau onboarding và cũng in liên kết trong phần tóm tắt. Giữ tab đó mở; nếu nó không khởi chạy, hãy sao chép/dán URL đã in trên cùng máy.
  </Accordion>

  <Accordion title="Làm thế nào để xác thực bảng điều khiển trên localhost so với từ xa?">
    **Localhost (cùng máy):**

    - Mở `http://127.0.0.1:18789/`.
    - Nếu nó yêu cầu xác thực bí mật dùng chung, dán token hoặc mật khẩu đã cấu hình vào phần cài đặt Control UI.
    - Nguồn token: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
    - Nguồn mật khẩu: `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
    - Nếu chưa cấu hình bí mật dùng chung, tạo token bằng `openclaw doctor --generate-gateway-token`.

    **Không ở trên localhost:**

    - **Tailscale Serve** (khuyến nghị): giữ bind loopback, chạy `openclaw gateway --tailscale serve`, mở `https://<magicdns>/`. Nếu `gateway.auth.allowTailscale` là `true`, header danh tính đáp ứng xác thực Control UI/WebSocket (không cần dán bí mật dùng chung, giả định máy chủ gateway đáng tin cậy); HTTP API vẫn yêu cầu xác thực bí mật dùng chung trừ khi bạn cố ý dùng private-ingress `none` hoặc xác thực HTTP trusted-proxy.
      Các lần thử xác thực Serve đồng thời không hợp lệ từ cùng một client được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, nên lần thử lại không hợp lệ thứ hai đã có thể hiển thị `retry later`.
    - **Tailnet bind**: chạy `openclaw gateway --bind tailnet --token "<token>"` (hoặc cấu hình xác thực mật khẩu), mở `http://<tailscale-ip>:18789/`, rồi dán bí mật dùng chung tương ứng trong phần cài đặt bảng điều khiển.
    - **Reverse proxy nhận biết danh tính**: đặt Gateway sau một proxy đáng tin cậy, cấu hình `gateway.auth.mode: "trusted-proxy"`, rồi mở URL proxy. Các proxy loopback cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`. Xác thực bí mật dùng chung vẫn áp dụng qua tunnel; dán token hoặc mật khẩu đã cấu hình nếu được nhắc.

    Xem [Bảng điều khiển](/vi/web/dashboard) và [Bề mặt web](/vi/web) để biết chi tiết về chế độ bind và xác thực.

  </Accordion>

  <Accordion title="Vì sao có hai cấu hình phê duyệt exec cho phê duyệt qua chat?">
    Chúng điều khiển các lớp khác nhau:

    - `approvals.exec`: chuyển tiếp lời nhắc phê duyệt đến các đích chat
    - `channels.<channel>.execApprovals`: khiến kênh đó hoạt động như một client phê duyệt native cho phê duyệt exec

    Chính sách exec của host vẫn là cổng phê duyệt thực sự. Cấu hình chat chỉ điều khiển nơi lời nhắc
    phê duyệt xuất hiện và cách mọi người có thể trả lời.

    Trong hầu hết thiết lập, bạn **không** cần cả hai:

    - Nếu chat đã hỗ trợ lệnh và trả lời, `/approve` trong cùng chat hoạt động qua đường dẫn dùng chung.
    - Nếu một kênh native được hỗ trợ có thể suy ra người phê duyệt một cách an toàn, OpenClaw hiện tự động bật phê duyệt native ưu tiên DM khi `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`.
    - Khi có thẻ/nút phê duyệt native, UI native đó là đường dẫn chính; tác nhân chỉ nên bao gồm lệnh `/approve` thủ công nếu kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    - Chỉ dùng `approvals.exec` khi lời nhắc cũng phải được chuyển tiếp đến các chat khác hoặc phòng vận hành rõ ràng.
    - Chỉ dùng `channels.<channel>.execApprovals.target: "channel"` hoặc `"both"` khi bạn rõ ràng muốn lời nhắc phê duyệt được đăng ngược lại vào phòng/chủ đề khởi tạo.
    - Phê duyệt Plugin lại tách riêng: mặc định dùng `/approve` trong cùng chat, có thể chuyển tiếp bằng `approvals.plugin`, và chỉ một số kênh native giữ xử lý plugin-approval-native ở phía trên.

    Tóm lại: chuyển tiếp dùng để định tuyến, cấu hình client native dùng cho UX phong phú theo từng kênh.
    Xem [Phê duyệt Exec](/vi/tools/exec-approvals).

  </Accordion>

  <Accordion title="Tôi cần runtime nào?">
    Bắt buộc dùng Node **>= 22**. Khuyến nghị dùng `pnpm`. Bun **không được khuyến nghị** cho Gateway.
  </Accordion>

  <Accordion title="Nó có chạy trên Raspberry Pi không?">
    Có. Gateway nhẹ - tài liệu liệt kê **512MB-1GB RAM**, **1 lõi**, và khoảng **500MB**
    dung lượng đĩa là đủ cho mục đích cá nhân, đồng thời ghi chú rằng **Raspberry Pi 4 có thể chạy nó**.

    Nếu bạn muốn thêm dư địa (nhật ký, media, dịch vụ khác), **khuyến nghị 2GB**, nhưng đó
    không phải mức tối thiểu bắt buộc.

    Mẹo: một Pi/VPS nhỏ có thể lưu trữ Gateway, và bạn có thể ghép nối **node** trên laptop/điện thoại để
    dùng màn hình/camera/canvas cục bộ hoặc thực thi lệnh. Xem [Node](/vi/nodes).

  </Accordion>

  <Accordion title="Có mẹo nào cho cài đặt Raspberry Pi không?">
    Tóm tắt: nó chạy được, nhưng hãy dự kiến sẽ có vài điểm chưa trơn tru.

    - Dùng hệ điều hành **64-bit** và giữ Node >= 22.
    - Ưu tiên **bản cài đặt có thể tùy biến (git)** để bạn có thể xem nhật ký và cập nhật nhanh.
    - Bắt đầu không có kênh/Skills, rồi thêm từng cái một.
    - Nếu gặp các vấn đề binary lạ, thường đó là vấn đề **tương thích ARM**.

    Tài liệu: [Linux](/vi/platforms/linux), [Cài đặt](/vi/install).

  </Accordion>

  <Accordion title="Nó bị kẹt ở wake up my friend / onboarding không hatch. Giờ làm gì?">
    Màn hình đó phụ thuộc vào việc Gateway có thể truy cập và đã xác thực. TUI cũng tự động gửi
    "Wake up, my friend!" trong lần hatch đầu tiên. Nếu bạn thấy dòng đó **không có phản hồi**
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

    Nếu Gateway ở xa, bảo đảm tunnel/kết nối Tailscale đang hoạt động và UI
    trỏ đến đúng Gateway. Xem [Truy cập từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi có thể di chuyển thiết lập sang máy mới (Mac mini) mà không làm lại onboarding không?">
    Có. Sao chép **thư mục trạng thái** và **workspace**, rồi chạy Doctor một lần. Cách này
    giữ bot của bạn "y hệt" (bộ nhớ, lịch sử phiên, xác thực, và trạng thái kênh)
    miễn là bạn sao chép **cả hai** vị trí:

    1. Cài OpenClaw trên máy mới.
    2. Sao chép `$OPENCLAW_STATE_DIR` (mặc định: `~/.openclaw`) từ máy cũ.
    3. Sao chép workspace của bạn (mặc định: `~/.openclaw/workspace`).
    4. Chạy `openclaw doctor` và khởi động lại dịch vụ Gateway.

    Việc đó bảo toàn cấu hình, hồ sơ xác thực, thông tin đăng nhập WhatsApp, phiên, và bộ nhớ. Nếu bạn đang ở
    chế độ từ xa, hãy nhớ máy chủ gateway sở hữu kho phiên và workspace.

    **Quan trọng:** nếu bạn chỉ commit/push workspace lên GitHub, bạn đang sao lưu
    **bộ nhớ + tệp bootstrap**, nhưng **không** sao lưu lịch sử phiên hoặc xác thực. Những phần đó nằm
    dưới `~/.openclaw/` (ví dụ `~/.openclaw/agents/<agentId>/sessions/`).

    Liên quan: [Di chuyển](/vi/install/migrating), [Nơi mọi thứ nằm trên đĩa](#where-things-live-on-disk),
    [Workspace của tác nhân](/vi/concepts/agent-workspace), [Doctor](/vi/gateway/doctor),
    [Chế độ từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Tôi xem điểm mới trong phiên bản mới nhất ở đâu?">
    Kiểm tra changelog trên GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Các mục mới nhất nằm ở trên cùng. Nếu phần trên cùng được đánh dấu **Unreleased**, phần có ngày
    tiếp theo là phiên bản mới nhất đã phát hành. Các mục được nhóm theo **Điểm nổi bật**, **Thay đổi**, và
    **Bản sửa** (cộng thêm phần tài liệu/khác khi cần).

  </Accordion>

  <Accordion title="Không thể truy cập docs.openclaw.ai (lỗi SSL)">
    Một số kết nối Comcast/Xfinity chặn sai `docs.openclaw.ai` qua Xfinity
    Advanced Security. Tắt tính năng đó hoặc đưa `docs.openclaw.ai` vào danh sách cho phép, rồi thử lại.
    Vui lòng giúp chúng tôi gỡ chặn bằng cách báo cáo tại đây: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nếu bạn vẫn không truy cập được trang, tài liệu được mirror trên GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Khác biệt giữa stable và beta">
    **Stable** và **beta** là **npm dist-tags**, không phải các dòng mã riêng biệt:

    - `latest` = stable
    - `beta` = bản dựng sớm để kiểm thử

    Thông thường, một bản phát hành stable sẽ lên **beta** trước, sau đó một bước
    thăng cấp rõ ràng sẽ chuyển cùng phiên bản đó sang `latest`. Maintainer cũng có thể
    phát hành thẳng lên `latest` khi cần. Vì vậy beta và stable có thể
    trỏ tới **cùng một phiên bản** sau khi thăng cấp.

    Xem những gì đã thay đổi:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Để xem các lệnh cài đặt một dòng và khác biệt giữa beta và dev, hãy xem accordion bên dưới.

  </Accordion>

  <Accordion title="Tôi cài đặt phiên bản beta như thế nào và khác biệt giữa beta và dev là gì?">
    **Beta** là npm dist-tag `beta` (có thể khớp với `latest` sau khi thăng cấp).
    **Dev** là đầu nhánh đang thay đổi của `main` (git); khi được phát hành, nó dùng npm dist-tag `dev`.

    Các lệnh một dòng (macOS/Linux):

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

  <Accordion title="Tôi dùng thử các phần mới nhất như thế nào?">
    Có hai lựa chọn:

    1. **Kênh dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Lệnh này chuyển sang nhánh `main` và cập nhật từ mã nguồn.

    2. **Cài đặt có thể chỉnh sửa (từ trang trình cài đặt):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Lệnh đó cung cấp cho bạn một repo cục bộ có thể chỉnh sửa, rồi cập nhật qua git.

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
    Hướng dẫn sơ bộ:

    - **Cài đặt:** 2-5 phút
    - **Onboarding:** 5-15 phút tùy vào số lượng kênh/mô hình bạn cấu hình

    Nếu bị treo, hãy dùng [Trình cài đặt bị kẹt](#quick-start-and-first-run-setup)
    và vòng lặp gỡ lỗi nhanh trong [Tôi đang bị kẹt](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Trình cài đặt bị kẹt? Làm sao để nhận thêm phản hồi?">
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

  <Accordion title="Cài đặt Windows báo không tìm thấy git hoặc không nhận diện openclaw">
    Hai vấn đề Windows thường gặp:

    **1) lỗi npm spawn git / không tìm thấy git**

    - Cài đặt **Git for Windows** và đảm bảo `git` nằm trong PATH của bạn.
    - Đóng và mở lại PowerShell, rồi chạy lại trình cài đặt.

    **2) openclaw không được nhận diện sau khi cài đặt**

    - Thư mục bin toàn cục của npm chưa nằm trong PATH.
    - Kiểm tra đường dẫn:

      ```powershell
      npm config get prefix
      ```

    - Thêm thư mục đó vào PATH người dùng của bạn (không cần hậu tố `\bin` trên Windows; trên hầu hết hệ thống, đó là `%AppData%\npm`).
    - Đóng và mở lại PowerShell sau khi cập nhật PATH.

    Nếu bạn muốn thiết lập Windows mượt nhất, hãy dùng **WSL2** thay vì Windows native.
    Tài liệu: [Windows](/vi/platforms/windows).

  </Accordion>

  <Accordion title="Đầu ra exec trên Windows hiển thị chữ Trung Quốc bị lỗi - tôi nên làm gì?">
    Đây thường là lỗi không khớp bảng mã console trên các shell Windows native.

    Triệu chứng:

    - Đầu ra `system.run`/`exec` hiển thị tiếng Trung Quốc thành mojibake
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

  <Accordion title="Tài liệu không trả lời câu hỏi của tôi - làm sao để có câu trả lời tốt hơn?">
    Dùng **cài đặt có thể chỉnh sửa (git)** để bạn có toàn bộ mã nguồn và tài liệu cục bộ, rồi hỏi
    bot của bạn (hoặc Claude/Codex) _từ thư mục đó_ để nó có thể đọc repo và trả lời chính xác.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chi tiết hơn: [Cài đặt](/vi/install) và [Cờ trình cài đặt](/vi/install/installer).

  </Accordion>

  <Accordion title="Tôi cài đặt OpenClaw trên Linux như thế nào?">
    Câu trả lời ngắn: làm theo hướng dẫn Linux, rồi chạy onboarding.

    - Đường dẫn nhanh Linux + cài đặt service: [Linux](/vi/platforms/linux).
    - Hướng dẫn đầy đủ: [Bắt đầu](/vi/start/getting-started).
    - Trình cài đặt + cập nhật: [Cài đặt & cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Tôi cài đặt OpenClaw trên VPS như thế nào?">
    VPS Linux nào cũng dùng được. Cài đặt trên máy chủ, rồi dùng SSH/Tailscale để truy cập Gateway.

    Hướng dẫn: [exe.dev](/vi/install/exe-dev), [Hetzner](/vi/install/hetzner), [Fly.io](/vi/install/fly).
    Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).

  </Accordion>

  <Accordion title="Các hướng dẫn cài đặt cloud/VPS ở đâu?">
    Chúng tôi duy trì một **trung tâm hosting** với các nhà cung cấp phổ biến. Chọn một nhà cung cấp và làm theo hướng dẫn:

    - [Hosting VPS](/vi/vps) (tất cả nhà cung cấp ở một nơi)
    - [Fly.io](/vi/install/fly)
    - [Hetzner](/vi/install/hetzner)
    - [exe.dev](/vi/install/exe-dev)

    Cách hoạt động trên cloud: **Gateway chạy trên máy chủ**, và bạn truy cập nó
    từ laptop/điện thoại qua Control UI (hoặc Tailscale/SSH). Trạng thái + workspace của bạn
    nằm trên máy chủ, vì vậy hãy coi host là nguồn sự thật và sao lưu nó.

    Bạn có thể ghép nối **node** (Mac/iOS/Android/headless) với Gateway cloud đó để truy cập
    màn hình/camera/canvas cục bộ hoặc chạy lệnh trên laptop của bạn trong khi vẫn giữ
    Gateway trên cloud.

    Trung tâm: [Nền tảng](/vi/platforms). Truy cập từ xa: [Gateway từ xa](/vi/gateway/remote).
    Node: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể yêu cầu OpenClaw tự cập nhật không?">
    Câu trả lời ngắn: **có thể, không khuyến nghị**. Luồng cập nhật có thể khởi động lại
    Gateway (làm rớt phiên đang hoạt động), có thể cần một git checkout sạch, và
    có thể yêu cầu xác nhận. An toàn hơn: chạy cập nhật từ shell với tư cách operator.

    Dùng CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Nếu bạn bắt buộc phải tự động hóa từ agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Tài liệu: [Cập nhật](/vi/cli/update), [Đang cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Onboarding thực sự làm gì?">
    `openclaw onboard` là đường dẫn thiết lập được khuyến nghị. Ở **chế độ cục bộ**, nó hướng dẫn bạn qua:

    - **Thiết lập mô hình/xác thực** (OAuth nhà cung cấp, khóa API, Anthropic setup-token, cùng các tùy chọn mô hình cục bộ như LM Studio)
    - Vị trí **workspace** + các tệp bootstrap
    - **Cài đặt Gateway** (bind/port/auth/tailscale)
    - **Kênh** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, cùng các Plugin kênh đi kèm như QQ Bot)
    - **Cài đặt daemon** (LaunchAgent trên macOS; systemd user unit trên Linux/WSL2)
    - **Kiểm tra sức khỏe** và lựa chọn **Skills**

    Nó cũng cảnh báo nếu mô hình đã cấu hình của bạn không xác định hoặc thiếu xác thực.

  </Accordion>

  <Accordion title="Tôi có cần đăng ký Claude hoặc OpenAI để chạy cái này không?">
    Không. Bạn có thể chạy OpenClaw với **khóa API** (Anthropic/OpenAI/nhà cung cấp khác) hoặc với
    **mô hình chỉ cục bộ** để dữ liệu của bạn vẫn nằm trên thiết bị. Đăng ký (Claude
    Pro/Max hoặc OpenAI Codex) là các cách tùy chọn để xác thực những nhà cung cấp đó.

    Với Anthropic trong OpenClaw, phân tách thực tế là:

    - **Khóa API Anthropic**: tính phí API Anthropic thông thường
    - **Claude CLI / xác thực đăng ký Claude trong OpenClaw**: nhân viên Anthropic
      đã nói với chúng tôi rằng cách dùng này lại được cho phép, và OpenClaw đang coi việc dùng `claude -p`
      là được chấp thuận cho tích hợp này trừ khi Anthropic công bố một
      chính sách mới

    Với các host Gateway chạy lâu dài, khóa API Anthropic vẫn là thiết lập
    dễ dự đoán hơn. OpenAI Codex OAuth được hỗ trợ rõ ràng cho các
    công cụ bên ngoài như OpenClaw.

    OpenClaw cũng hỗ trợ các tùy chọn dạng đăng ký được host khác, bao gồm
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, và
    **Z.AI / GLM Coding Plan**.

    Tài liệu: [Anthropic](/vi/providers/anthropic), [OpenAI](/vi/providers/openai),
    [Qwen Cloud](/vi/providers/qwen),
    [MiniMax](/vi/providers/minimax), [Mô hình GLM](/vi/providers/glm),
    [Mô hình cục bộ](/vi/gateway/local-models), [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể dùng đăng ký Claude Max mà không có khóa API không?">
    Có.

    Nhân viên Anthropic đã nói với chúng tôi rằng cách dùng Claude CLI theo kiểu OpenClaw lại được cho phép, nên
    OpenClaw coi xác thực đăng ký Claude và việc dùng `claude -p` là được chấp thuận
    cho tích hợp này trừ khi Anthropic công bố một chính sách mới. Nếu bạn muốn
    thiết lập phía máy chủ dễ dự đoán nhất, hãy dùng khóa API Anthropic thay thế.

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực đăng ký Claude (Claude Pro hoặc Max) không?">
    Có.

    Nhân viên Anthropic đã nói với chúng tôi rằng cách dùng này lại được cho phép, nên OpenClaw coi
    việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này
    trừ khi Anthropic công bố một chính sách mới.

    Anthropic setup-token vẫn có sẵn như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.
    Với khối lượng công việc production hoặc nhiều người dùng, xác thực bằng khóa API Anthropic vẫn là
    lựa chọn an toàn hơn, dễ dự đoán hơn. Nếu bạn muốn các tùy chọn được host
    dạng đăng ký khác trong OpenClaw, hãy xem [OpenAI](/vi/providers/openai), [Qwen / Model
    Cloud](/vi/providers/qwen), [MiniMax](/vi/providers/minimax), và [Mô hình GLM](/vi/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Tại sao tôi thấy HTTP 429 rate_limit_error từ Anthropic?">
    Điều đó nghĩa là **hạn mức/giới hạn tốc độ Anthropic** của bạn đã cạn cho cửa sổ hiện tại. Nếu bạn
    dùng **Claude CLI**, hãy chờ cửa sổ được đặt lại hoặc nâng cấp gói của bạn. Nếu bạn
    dùng **khóa API Anthropic**, hãy kiểm tra Anthropic Console
    về mức sử dụng/thanh toán và nâng giới hạn khi cần.

    Nếu thông báo cụ thể là:
    `Extra usage is required for long context requests`, thì yêu cầu đang cố dùng
    beta ngữ cảnh 1M của Anthropic (`context1m: true`). Điều đó chỉ hoạt động khi
    thông tin xác thực của bạn đủ điều kiện cho tính phí ngữ cảnh dài (tính phí khóa API hoặc đường dẫn
    đăng nhập Claude của OpenClaw với Extra Usage được bật).

    Mẹo: đặt một **mô hình dự phòng** để OpenClaw có thể tiếp tục phản hồi khi một nhà cung cấp bị giới hạn tốc độ.
    Xem [Mô hình](/vi/cli/models), [OAuth](/vi/concepts/oauth), và
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/vi/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock có được hỗ trợ không?">
    Có. OpenClaw có nhà cung cấp **Amazon Bedrock (Converse)** được tích hợp sẵn. Khi có các dấu hiệu env AWS, OpenClaw có thể tự động phát hiện danh mục Bedrock streaming/text và hợp nhất danh mục đó dưới dạng nhà cung cấp `amazon-bedrock` ngầm định; nếu không, bạn có thể bật rõ ràng `plugins.entries.amazon-bedrock.config.discovery.enabled` hoặc thêm một mục nhà cung cấp thủ công. Xem [Amazon Bedrock](/vi/providers/bedrock) và [Nhà cung cấp mô hình](/vi/providers/models). Nếu bạn muốn luồng khóa được quản lý, một proxy tương thích OpenAI đặt trước Bedrock vẫn là một tùy chọn hợp lệ.
  </Accordion>

  <Accordion title="Xác thực Codex hoạt động như thế nào?">
    OpenClaw hỗ trợ **OpenAI Code (Codex)** qua OAuth (đăng nhập ChatGPT). Dùng
    `openai-codex/gpt-5.5` cho Codex OAuth thông qua trình chạy PI mặc định. Dùng
    `openai/gpt-5.5` để truy cập trực tiếp bằng khóa API OpenAI. GPT-5.5 cũng có thể dùng
    subscription/OAuth qua `openai-codex/gpt-5.5` hoặc các lần chạy app-server Codex gốc
    với `openai/gpt-5.5` và `agentRuntime.id: "codex"`.
    Xem [Nhà cung cấp mô hình](/vi/concepts/model-providers) và [Onboarding (CLI)](/vi/start/wizard).
  </Accordion>

  <Accordion title="Tại sao OpenClaw vẫn nhắc đến openai-codex?">
    `openai-codex` là id nhà cung cấp và auth-profile cho ChatGPT/Codex OAuth.
    Đây cũng là tiền tố mô hình PI rõ ràng cho Codex OAuth:

    - `openai/gpt-5.5` = tuyến khóa API OpenAI trực tiếp hiện tại trong PI
    - `openai-codex/gpt-5.5` = tuyến Codex OAuth trong PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = tuyến app-server Codex gốc
    - `openai-codex:...` = id hồ sơ xác thực, không phải tham chiếu mô hình

    Nếu bạn muốn đường dẫn thanh toán/giới hạn trực tiếp của OpenAI Platform, hãy đặt
    `OPENAI_API_KEY`. Nếu bạn muốn xác thực gói đăng ký ChatGPT/Codex, hãy đăng nhập bằng
    `openclaw models auth login --provider openai-codex` và dùng
    tham chiếu mô hình `openai-codex/*` cho các lần chạy PI.

  </Accordion>

  <Accordion title="Tại sao giới hạn Codex OAuth có thể khác ChatGPT web?">
    Codex OAuth dùng các cửa sổ hạn mức do OpenAI quản lý và phụ thuộc vào gói. Trên thực tế,
    các giới hạn đó có thể khác trải nghiệm trên website/ứng dụng ChatGPT, ngay cả khi
    cả hai đều gắn với cùng một tài khoản.

    OpenClaw có thể hiển thị các cửa sổ sử dụng/hạn mức nhà cung cấp hiện đang thấy trong
    `openclaw models status`, nhưng nó không tự tạo hoặc chuẩn hóa quyền lợi ChatGPT-web
    thành quyền truy cập API trực tiếp. Nếu bạn muốn đường dẫn thanh toán/giới hạn trực tiếp của OpenAI Platform, hãy dùng `openai/*` với khóa API.

  </Accordion>

  <Accordion title="Bạn có hỗ trợ xác thực gói đăng ký OpenAI (Codex OAuth) không?">
    Có. OpenClaw hỗ trợ đầy đủ **subscription OAuth của OpenAI Code (Codex)**.
    OpenAI cho phép rõ ràng việc dùng subscription OAuth trong các công cụ/quy trình làm việc bên ngoài
    như OpenClaw. Onboarding có thể chạy luồng OAuth cho bạn.

    Xem [OAuth](/vi/concepts/oauth), [Nhà cung cấp mô hình](/vi/concepts/model-providers), và [Onboarding (CLI)](/vi/start/wizard).

  </Accordion>

  <Accordion title="Tôi thiết lập Gemini CLI OAuth như thế nào?">
    Gemini CLI dùng **luồng xác thực plugin**, không phải client id hay secret trong `openclaw.json`.

    Các bước:

    1. Cài Gemini CLI cục bộ để `gemini` nằm trên `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Bật plugin: `openclaw plugins enable google`
    3. Đăng nhập: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Mô hình mặc định sau khi đăng nhập: `google-gemini-cli/gemini-3-flash-preview`
    5. Nếu yêu cầu thất bại, đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ gateway

    Thao tác này lưu token OAuth trong hồ sơ xác thực trên máy chủ gateway. Chi tiết: [Nhà cung cấp mô hình](/vi/concepts/model-providers).

  </Accordion>

  <Accordion title="Mô hình cục bộ có ổn cho trò chuyện thông thường không?">
    Thường là không. OpenClaw cần ngữ cảnh lớn + độ an toàn mạnh; các card nhỏ sẽ cắt ngắn và rò rỉ. Nếu bắt buộc, hãy chạy bản dựng mô hình **lớn nhất** bạn có thể chạy cục bộ (LM Studio) và xem [/gateway/local-models](/vi/gateway/local-models). Các mô hình nhỏ hơn/lượng tử hóa làm tăng rủi ro prompt-injection - xem [Bảo mật](/vi/gateway/security).
  </Accordion>

  <Accordion title="Làm sao để giữ lưu lượng mô hình được lưu trữ trong một khu vực cụ thể?">
    Chọn endpoint cố định theo khu vực. OpenRouter cung cấp các tùy chọn lưu trữ tại Hoa Kỳ cho MiniMax, Kimi và GLM; hãy chọn biến thể lưu trữ tại Hoa Kỳ để giữ dữ liệu trong khu vực. Bạn vẫn có thể liệt kê Anthropic/OpenAI cùng với các tùy chọn này bằng cách dùng `models.mode: "merge"` để các phương án dự phòng vẫn sẵn có trong khi tôn trọng nhà cung cấp theo khu vực mà bạn chọn.
  </Accordion>

  <Accordion title="Tôi có phải mua Mac Mini để cài đặt không?">
    Không. OpenClaw chạy trên macOS hoặc Linux (Windows qua WSL2). Mac mini là tùy chọn - một số người
    mua nó làm máy chủ luôn bật, nhưng VPS nhỏ, máy chủ tại nhà, hoặc máy cỡ Raspberry Pi cũng dùng được.

    Bạn chỉ cần Mac **cho các công cụ chỉ dành cho macOS**. Với iMessage, dùng [BlueBubbles](/vi/channels/bluebubbles) (khuyến nghị) - máy chủ BlueBubbles chạy trên bất kỳ Mac nào, còn Gateway có thể chạy trên Linux hoặc nơi khác. Nếu bạn muốn các công cụ khác chỉ dành cho macOS, hãy chạy Gateway trên Mac hoặc ghép nối một node macOS.

    Tài liệu: [BlueBubbles](/vi/channels/bluebubbles), [Node](/vi/nodes), [Chế độ từ xa Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Tôi có cần Mac mini để hỗ trợ iMessage không?">
    Bạn cần **một thiết bị macOS nào đó** đã đăng nhập vào Messages. Thiết bị đó **không** nhất thiết phải là Mac mini -
    bất kỳ Mac nào cũng được. **Dùng [BlueBubbles](/vi/channels/bluebubbles)** (khuyến nghị) cho iMessage - máy chủ BlueBubbles chạy trên macOS, còn Gateway có thể chạy trên Linux hoặc nơi khác.

    Các thiết lập phổ biến:

    - Chạy Gateway trên Linux/VPS, và chạy máy chủ BlueBubbles trên bất kỳ Mac nào đã đăng nhập vào Messages.
    - Chạy mọi thứ trên Mac nếu bạn muốn thiết lập một máy đơn giản nhất.

    Tài liệu: [BlueBubbles](/vi/channels/bluebubbles), [Node](/vi/nodes),
    [Chế độ từ xa Mac](/vi/platforms/mac/remote).

  </Accordion>

  <Accordion title="Nếu tôi mua Mac mini để chạy OpenClaw, tôi có thể kết nối nó với MacBook Pro của mình không?">
    Có. **Mac mini có thể chạy Gateway**, và MacBook Pro của bạn có thể kết nối dưới dạng
    **node** (thiết bị đồng hành). Node không chạy Gateway - chúng cung cấp thêm
    khả năng như màn hình/camera/canvas và `system.run` trên thiết bị đó.

    Mẫu phổ biến:

    - Gateway trên Mac mini (luôn bật).
    - MacBook Pro chạy ứng dụng macOS hoặc máy chủ node và ghép nối với Gateway.
    - Dùng `openclaw nodes status` / `openclaw nodes list` để xem nó.

    Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes).

  </Accordion>

  <Accordion title="Tôi có thể dùng Bun không?">
    Bun **không được khuyến nghị**. Chúng tôi thấy lỗi runtime, đặc biệt với WhatsApp và Telegram.
    Dùng **Node** cho các gateway ổn định.

    Nếu bạn vẫn muốn thử nghiệm với Bun, hãy làm trên gateway không dùng cho production
    và không có WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: allowFrom cần điền gì?">
    `channels.telegram.allowFrom` là **ID người dùng Telegram của người gửi là con người** (dạng số). Nó không phải tên người dùng của bot.

    Thiết lập chỉ yêu cầu ID người dùng dạng số. Nếu bạn đã có các mục `@username` cũ trong cấu hình, `openclaw doctor --fix` có thể thử phân giải chúng.

    An toàn hơn (không cần bot bên thứ ba):

    - DM bot của bạn, rồi chạy `openclaw logs --follow` và đọc `from.id`.

    Bot API chính thức:

    - DM bot của bạn, rồi gọi `https://api.telegram.org/bot<bot_token>/getUpdates` và đọc `message.from.id`.

    Bên thứ ba (kém riêng tư hơn):

    - DM `@userinfobot` hoặc `@getidsbot`.

    Xem [/channels/telegram](/vi/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Nhiều người có thể dùng một số WhatsApp với các phiên bản OpenClaw khác nhau không?">
    Có, thông qua **định tuyến đa tác nhân**. Gắn **DM** WhatsApp của từng người gửi (peer `kind: "direct"`, người gửi E.164 như `+15551234567`) với một `agentId` khác nhau, để mỗi người có workspace và kho phiên riêng. Phản hồi vẫn đến từ **cùng một tài khoản WhatsApp**, và kiểm soát truy cập DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) là toàn cục theo từng tài khoản WhatsApp. Xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent) và [WhatsApp](/vi/channels/whatsapp).
  </Accordion>

  <Accordion title='Tôi có thể chạy một tác nhân "trò chuyện nhanh" và một tác nhân "Opus để lập trình" không?'>
    Có. Dùng định tuyến đa tác nhân: đặt mô hình mặc định riêng cho từng tác nhân, rồi gắn các tuyến đầu vào (tài khoản nhà cung cấp hoặc peer cụ thể) với từng tác nhân. Cấu hình ví dụ nằm trong [Định tuyến đa tác nhân](/vi/concepts/multi-agent). Xem thêm [Mô hình](/vi/concepts/models) và [Cấu hình](/vi/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew có hoạt động trên Linux không?">
    Có. Homebrew hỗ trợ Linux (Linuxbrew). Thiết lập nhanh:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Nếu bạn chạy OpenClaw qua systemd, hãy đảm bảo service PATH bao gồm `/home/linuxbrew/.linuxbrew/bin` (hoặc tiền tố brew của bạn) để các công cụ cài bằng `brew` được phân giải trong shell không đăng nhập.
    Các bản dựng gần đây cũng thêm trước các thư mục bin người dùng phổ biến trên dịch vụ systemd Linux (ví dụ `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) và tôn trọng `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, và `FNM_DIR` khi được đặt.

  </Accordion>

  <Accordion title="Khác biệt giữa cài đặt git có thể chỉnh sửa và cài đặt npm">
    - **Cài đặt có thể chỉnh sửa (git):** checkout toàn bộ mã nguồn, có thể chỉnh sửa, phù hợp nhất cho người đóng góp.
      Bạn chạy build cục bộ và có thể vá mã/tài liệu.
    - **Cài đặt npm:** cài CLI toàn cục, không có repo, phù hợp nhất để "chỉ chạy".
      Cập nhật đến từ npm dist-tags.

    Tài liệu: [Bắt đầu](/vi/start/getting-started), [Cập nhật](/vi/install/updating).

  </Accordion>

  <Accordion title="Sau này tôi có thể chuyển đổi giữa cài đặt npm và git không?">
    Có. Dùng `openclaw update --channel ...` khi OpenClaw đã được cài đặt.
    Thao tác này **không xóa dữ liệu của bạn** - nó chỉ thay đổi bản cài mã OpenClaw.
    Trạng thái của bạn (`~/.openclaw`) và workspace (`~/.openclaw/workspace`) vẫn giữ nguyên.

    Từ npm sang git:

    ```bash
    openclaw update --channel dev
    ```

    Từ git sang npm:

    ```bash
    openclaw update --channel stable
    ```

    Thêm `--dry-run` để xem trước việc chuyển chế độ dự kiến. Trình cập nhật chạy
    các bước tiếp theo của Doctor, làm mới nguồn plugin cho kênh đích, và
    khởi động lại gateway trừ khi bạn truyền `--no-restart`.

    Trình cài đặt cũng có thể ép một trong hai chế độ:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Mẹo sao lưu: xem [Chiến lược sao lưu](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Tôi nên chạy Gateway trên laptop hay VPS?">
    Câu trả lời ngắn: **nếu bạn muốn độ tin cậy 24/7, hãy dùng VPS**. Nếu bạn muốn
    ít rắc rối nhất và chấp nhận sleep/khởi động lại, hãy chạy cục bộ.

    **Laptop (Gateway cục bộ)**

    - **Ưu điểm:** không tốn chi phí máy chủ, truy cập trực tiếp tệp cục bộ, cửa sổ trình duyệt trực tiếp.
    - **Nhược điểm:** sleep/mất mạng = ngắt kết nối, cập nhật/khởi động lại OS gây gián đoạn, phải luôn thức.

    **VPS / cloud**

    - **Ưu điểm:** luôn bật, mạng ổn định, không có vấn đề laptop sleep, dễ duy trì chạy liên tục hơn.
    - **Nhược điểm:** thường chạy headless (dùng ảnh chụp màn hình), chỉ truy cập tệp từ xa, bạn phải SSH để cập nhật.

    **Ghi chú riêng cho OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord đều hoạt động tốt từ VPS. Đánh đổi thực sự duy nhất là **trình duyệt headless** so với cửa sổ hiển thị. Xem [Trình duyệt](/vi/tools/browser).

    **Mặc định khuyến nghị:** VPS nếu trước đây bạn từng gặp tình trạng Gateway bị ngắt kết nối. Local rất phù hợp khi bạn đang chủ động dùng Mac và muốn truy cập tệp cục bộ hoặc tự động hóa UI bằng trình duyệt hiển thị.

  </Accordion>

  <Accordion title="Việc chạy OpenClaw trên một máy chuyên dụng quan trọng đến mức nào?">
    Không bắt buộc, nhưng **được khuyến nghị để tăng độ tin cậy và khả năng cách ly**.

    - **Máy chủ chuyên dụng (VPS/Mac mini/Pi):** luôn bật, ít bị gián đoạn do ngủ/khởi động lại hơn, quyền sạch hơn, dễ duy trì chạy liên tục hơn.
    - **Laptop/desktop dùng chung:** hoàn toàn ổn để thử nghiệm và sử dụng chủ động, nhưng hãy dự kiến sẽ có các khoảng tạm dừng khi máy ngủ hoặc cập nhật.

    Nếu bạn muốn có cả hai lợi ích, hãy giữ Gateway trên một máy chủ chuyên dụng và ghép nối laptop của bạn như một **Node** cho các công cụ màn hình/camera/exec cục bộ. Xem [Node](/vi/nodes).
    Để xem hướng dẫn bảo mật, hãy đọc [Bảo mật](/vi/gateway/security).

  </Accordion>

  <Accordion title="Yêu cầu VPS tối thiểu và hệ điều hành được khuyến nghị là gì?">
    OpenClaw rất nhẹ. Với Gateway cơ bản + một kênh chat:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM, ~500MB đĩa.
    - **Khuyến nghị:** 1-2 vCPU, 2GB RAM trở lên để có dư địa (nhật ký, media, nhiều kênh). Các công cụ Node và tự động hóa trình duyệt có thể tiêu tốn tài nguyên.

    Hệ điều hành: dùng **Ubuntu LTS** (hoặc bất kỳ Debian/Ubuntu hiện đại nào). Quy trình cài đặt Linux được kiểm thử tốt nhất trên đó.

    Tài liệu: [Linux](/vi/platforms/linux), [Lưu trữ VPS](/vi/vps).

  </Accordion>

  <Accordion title="Tôi có thể chạy OpenClaw trong VM không và yêu cầu là gì?">
    Có. Hãy xem VM giống như VPS: VM cần luôn bật, có thể truy cập được và có đủ
    RAM cho Gateway cùng bất kỳ kênh nào bạn bật.

    Hướng dẫn cơ bản:

    - **Tối thiểu tuyệt đối:** 1 vCPU, 1GB RAM.
    - **Khuyến nghị:** 2GB RAM trở lên nếu bạn chạy nhiều kênh, tự động hóa trình duyệt hoặc công cụ media.
    - **Hệ điều hành:** Ubuntu LTS hoặc Debian/Ubuntu hiện đại khác.

    Nếu bạn đang dùng Windows, **WSL2 là thiết lập kiểu VM dễ nhất** và có khả năng tương thích công cụ tốt nhất. Xem [Windows](/vi/platforms/windows), [Lưu trữ VPS](/vi/vps).
    Nếu bạn đang chạy macOS trong VM, xem [VM macOS](/vi/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Liên quan

- [FAQ](/vi/help/faq) — FAQ chính (mô hình, phiên, gateway, bảo mật, và hơn thế nữa)
- [Tổng quan cài đặt](/vi/install)
- [Bắt đầu](/vi/start/getting-started)
- [Khắc phục sự cố](/vi/help/troubleshooting)
