---
read_when:
    - Bạn cần một phương thức cài đặt khác ngoài hướng dẫn khởi động nhanh trong phần Bắt đầu
    - Bạn muốn triển khai lên một nền tảng đám mây
    - Bạn cần cập nhật, di chuyển hoặc gỡ cài đặt
summary: Cài đặt OpenClaw - tập lệnh cài đặt, npm/pnpm/bun, từ mã nguồn, Docker và hơn thế nữa
title: Cài đặt
x-i18n:
    generated_at: "2026-06-27T17:37:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.19+ - script cài đặt tự động xử lý việc này
- **macOS, Linux, hoặc Windows** - người dùng Windows có thể bắt đầu với ứng dụng Windows Hub gốc, trình cài đặt CLI PowerShell, hoặc WSL2 Gateway. Xem [Windows](/vi/platforms/windows).
- `pnpm` chỉ cần thiết nếu bạn build từ mã nguồn

## Khuyến nghị: script cài đặt

Cách cài đặt nhanh nhất. Script phát hiện hệ điều hành của bạn, cài Node nếu cần, cài OpenClaw và khởi chạy onboarding.

<Note>
Người dùng desktop Windows cũng có thể cài ứng dụng đồng hành [Windows Hub](/vi/platforms/windows#recommended-windows-hub) gốc, bao gồm thiết lập, trạng thái khay hệ thống, chat, chế độ node và chế độ MCP cục bộ.
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

Để cài đặt mà không chạy onboarding:

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

Để xem tất cả flag và tùy chọn CI/tự động hóa, xem [nội bộ trình cài đặt](/vi/install/installer).

## Các phương thức cài đặt thay thế

### Trình cài đặt prefix cục bộ (`install-cli.sh`)

Dùng cách này khi bạn muốn giữ OpenClaw và Node dưới một prefix cục bộ như
`~/.openclaw`, không phụ thuộc vào bản cài Node toàn hệ thống:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Theo mặc định, script hỗ trợ cài đặt npm, cùng với cài đặt git-checkout trong cùng
luồng prefix. Tham khảo đầy đủ: [nội bộ trình cài đặt](/vi/install/installer#install-clish).

Đã cài đặt rồi? Chuyển đổi giữa bản cài package và git bằng
`openclaw update --channel dev` và `openclaw update --channel stable`. Xem
[Cập nhật](/vi/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm, hoặc bun

Nếu bạn đã tự quản lý Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Trình cài đặt được host sẽ bỏ qua các bộ lọc độ mới npm như `min-release-age`
    cho việc cài package OpenClaw. Nếu bạn cài thủ công bằng npm, chính sách npm
    của bạn vẫn được áp dụng.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm yêu cầu phê duyệt rõ ràng cho các package có build scripts. Chạy `pnpm approve-builds -g` sau lần cài đặt đầu tiên.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun được hỗ trợ cho đường dẫn cài đặt CLI toàn cục. Đối với runtime Gateway, Node vẫn là runtime daemon được khuyến nghị.
    </Note>

  </Tab>
</Tabs>

### Từ mã nguồn

Dành cho contributor hoặc bất kỳ ai muốn chạy từ một checkout cục bộ:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua bước link và dùng `pnpm openclaw ...` từ bên trong repo. Xem [Thiết lập](/vi/start/setup) để biết đầy đủ workflow phát triển.

### Cài đặt từ checkout main trên GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container và trình quản lý package

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="container">
    Triển khai dạng container hoặc headless.
  </Card>
  <Card title="Podman" href="/vi/install/podman" icon="container">
    Giải pháp container không cần root thay thế Docker.
  </Card>
  <Card title="Nix" href="/vi/install/nix" icon="snowflake">
    Cài đặt khai báo qua Nix flake.
  </Card>
  <Card title="Ansible" href="/vi/install/ansible" icon="server">
    Cấp phát fleet tự động.
  </Card>
  <Card title="Bun" href="/vi/install/bun" icon="zap">
    Chỉ dùng CLI qua runtime Bun.
  </Card>
</CardGroup>

## Xác minh bản cài đặt

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Nếu bạn muốn startup được quản lý sau khi cài đặt:

- macOS: LaunchAgent qua `openclaw onboard --install-daemon` hoặc `openclaw gateway install`
- Linux/WSL2: dịch vụ người dùng systemd qua các lệnh tương tự
- Windows gốc: ưu tiên Scheduled Task, với mục đăng nhập theo người dùng trong thư mục Startup làm phương án dự phòng nếu việc tạo task bị từ chối

## Hosting và triển khai

Triển khai OpenClaw trên cloud server hoặc VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vi/vps">
    Bất kỳ Linux VPS nào.
  </Card>
  <Card title="Docker VM" href="/vi/install/docker-vm-runtime">
    Các bước Docker dùng chung.
  </Card>
  <Card title="Kubernetes" href="/vi/install/kubernetes">
    Triển khai K8s.
  </Card>
  <Card title="Fly.io" href="/vi/install/fly">
    Triển khai trên Fly.io.
  </Card>
  <Card title="Hetzner" href="/vi/install/hetzner">
    Triển khai Hetzner.
  </Card>
  <Card title="GCP" href="/vi/install/gcp">
    Triển khai Google Cloud.
  </Card>
  <Card title="Azure" href="/vi/install/azure">
    Triển khai Azure.
  </Card>
  <Card title="Railway" href="/vi/install/railway">
    Triển khai Railway.
  </Card>
  <Card title="Render" href="/vi/install/render">
    Triển khai Render.
  </Card>
  <Card title="Northflank" href="/vi/install/northflank">
    Triển khai Northflank.
  </Card>
</CardGroup>

## Cập nhật, di chuyển, hoặc gỡ cài đặt

<CardGroup cols={3}>
  <Card title="Updating" href="/vi/install/updating" icon="refresh-cw">
    Luôn cập nhật OpenClaw.
  </Card>
  <Card title="Migrating" href="/vi/install/migrating" icon="arrow-right">
    Chuyển sang máy mới.
  </Card>
  <Card title="Uninstall" href="/vi/install/uninstall" icon="trash-2">
    Gỡ bỏ OpenClaw hoàn toàn.
  </Card>
</CardGroup>

## Khắc phục sự cố: không tìm thấy `openclaw`

Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong terminal của bạn:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Nếu `$(npm prefix -g)/bin` không có trong `$PATH` của bạn, hãy thêm nó vào file startup của shell (`~/.zshrc` hoặc `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Sau đó mở terminal mới. Xem [thiết lập Node](/vi/install/node) để biết thêm chi tiết.
