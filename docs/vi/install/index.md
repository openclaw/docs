---
read_when:
    - Bạn cần một phương thức cài đặt khác ngoài hướng dẫn bắt đầu nhanh
    - Bạn muốn triển khai lên một nền tảng đám mây
    - Bạn cần cập nhật, di chuyển hoặc gỡ cài đặt
summary: Cài đặt OpenClaw - tập lệnh cài đặt, npm/pnpm/bun, từ mã nguồn, Docker và các phương thức khác
title: Cài đặt
x-i18n:
    generated_at: "2026-07-12T08:03:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Yêu cầu hệ thống

- **Node 22.19+, 23.11+ hoặc 24+** - Node 24 là phiên bản đích mặc định; tập lệnh cài đặt tự động xử lý việc này.
- **macOS, Linux hoặc Windows** - Người dùng Windows có thể bắt đầu bằng ứng dụng Windows Hub gốc, trình cài đặt CLI PowerShell hoặc Gateway trên WSL2. Xem [Windows](/vi/platforms/windows).
- Chỉ cần `pnpm` nếu bạn biên dịch từ mã nguồn.

## Khuyến nghị: tập lệnh cài đặt

Đây là cách cài đặt nhanh nhất. Tập lệnh phát hiện hệ điều hành, cài đặt Node nếu cần, cài đặt OpenClaw và khởi chạy quy trình thiết lập ban đầu.

<Note>
Người dùng máy tính Windows cũng có thể cài đặt ứng dụng đồng hành [Windows Hub](/vi/platforms/windows#recommended-windows-hub) gốc, bao gồm tính năng thiết lập, trạng thái khay hệ thống, trò chuyện, chế độ Node và chế độ MCP cục bộ.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Để cài đặt mà không chạy quy trình thiết lập ban đầu:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Để biết tất cả các cờ và tùy chọn CI/tự động hóa, hãy xem [Chi tiết nội bộ của trình cài đặt](/vi/install/installer).

## Các phương thức cài đặt thay thế

### Trình cài đặt với tiền tố cục bộ (`install-cli.sh`)

Sử dụng phương thức này khi bạn muốn giữ OpenClaw và Node trong một tiền tố cục bộ như
`~/.openclaw` mà không phụ thuộc vào bản cài đặt Node trên toàn hệ thống:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Theo mặc định, trình cài đặt hỗ trợ cài đặt bằng npm, cùng với cài đặt từ bản sao làm việc git trong cùng
quy trình tiền tố. Tài liệu tham khảo đầy đủ: [Chi tiết nội bộ của trình cài đặt](/vi/install/installer#install-clish).

Đã cài đặt? Chuyển đổi giữa bản cài đặt từ gói và git bằng
`openclaw update --channel dev` và `openclaw update --channel stable`. Xem
[Cập nhật](/vi/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm hoặc bun

Nếu bạn đã tự quản lý Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Trình cài đặt được lưu trữ sẽ xóa các bộ lọc độ mới của npm như `min-release-age`
    khi cài đặt gói OpenClaw. Nếu bạn cài đặt thủ công bằng npm, chính sách npm của riêng bạn
    vẫn được áp dụng.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm yêu cầu phê duyệt rõ ràng đối với các gói có tập lệnh biên dịch. Chạy `pnpm approve-builds -g` sau lần cài đặt đầu tiên.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun được hỗ trợ cho phương thức cài đặt CLI toàn cục. Đối với môi trường chạy Gateway, Node vẫn là môi trường chạy tiến trình nền được khuyến nghị.
    </Note>

  </Tab>
</Tabs>

### Từ mã nguồn

Dành cho người đóng góp hoặc bất kỳ ai muốn chạy từ một bản sao làm việc cục bộ:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua bước liên kết và sử dụng `pnpm openclaw ...` từ bên trong kho lưu trữ. Xem [Thiết lập](/vi/start/setup) để biết đầy đủ các quy trình phát triển.

### Cài đặt từ bản sao làm việc nhánh main trên GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Bộ chứa và trình quản lý gói

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="container">
    Triển khai trong bộ chứa hoặc không giao diện.
  </Card>
  <Card title="Podman" href="/vi/install/podman" icon="container">
    Giải pháp bộ chứa không cần quyền root thay thế cho Docker.
  </Card>
  <Card title="Nix" href="/vi/install/nix" icon="snowflake">
    Cài đặt khai báo thông qua Nix flake.
  </Card>
  <Card title="Ansible" href="/vi/install/ansible" icon="server">
    Cấp phát tự động cho đội máy.
  </Card>
  <Card title="Bun" href="/vi/install/bun" icon="zap">
    Chỉ sử dụng CLI thông qua môi trường chạy Bun.
  </Card>
</CardGroup>

## Xác minh bản cài đặt

```bash
openclaw --version      # xác nhận CLI khả dụng
openclaw doctor         # kiểm tra các vấn đề về cấu hình
openclaw gateway status # xác minh Gateway đang chạy
```

Nếu bạn muốn hệ thống tự quản lý việc khởi động sau khi cài đặt:

- macOS: LaunchAgent thông qua `openclaw onboard --install-daemon` hoặc `openclaw gateway install`
- Linux/WSL2: dịch vụ người dùng systemd thông qua các lệnh tương tự
- Windows gốc: ưu tiên Scheduled Task, với phương án dự phòng là mục đăng nhập trong thư mục Startup của từng người dùng nếu việc tạo tác vụ bị từ chối

## Lưu trữ và triển khai

Triển khai OpenClaw trên máy chủ đám mây hoặc VPS. Xem [Máy chủ Linux](/vi/vps) để dùng công cụ
chọn nhà cung cấp đầy đủ (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi và nhiều lựa chọn khác), hoặc triển khai theo cách khai báo trên
[Render](/vi/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/vi/vps">
    Chọn một nhà cung cấp.
  </Card>
  <Card title="Máy ảo Docker" href="/vi/install/docker-vm-runtime">
    Các bước dùng chung cho Docker.
  </Card>
  <Card title="Kubernetes" href="/vi/install/kubernetes">
    Triển khai K8s.
  </Card>
</CardGroup>

## Cập nhật, di chuyển hoặc gỡ cài đặt

<CardGroup cols={3}>
  <Card title="Cập nhật" href="/vi/install/updating" icon="refresh-cw">
    Luôn cập nhật OpenClaw.
  </Card>
  <Card title="Di chuyển" href="/vi/install/migrating" icon="arrow-right">
    Chuyển sang một máy mới.
  </Card>
  <Card title="Gỡ cài đặt" href="/vi/install/uninstall" icon="trash-2">
    Xóa hoàn toàn OpenClaw.
  </Card>
</CardGroup>

## Khắc phục sự cố: không tìm thấy `openclaw`

Hầu như luôn là vấn đề về PATH: thư mục tệp nhị phân toàn cục của npm không có trong `PATH` của shell. Xem [Khắc phục sự cố Node.js](/vi/install/node#troubleshooting) để biết cách khắc phục đầy đủ, bao gồm cả đường dẫn trên Windows.

```bash
node -v           # Node đã được cài đặt?
npm prefix -g     # Các gói toàn cục nằm ở đâu?
echo "$PATH"      # Thư mục tệp nhị phân toàn cục có trong PATH không?
```
