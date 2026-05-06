---
read_when:
    - Bạn cần một phương thức cài đặt khác ngoài hướng dẫn bắt đầu nhanh Bắt đầu
    - Bạn muốn triển khai lên một nền tảng đám mây
    - Bạn cần cập nhật, di chuyển hoặc gỡ cài đặt
summary: Cài đặt OpenClaw - tập lệnh cài đặt, npm/pnpm/bun, từ mã nguồn, Docker và nhiều cách khác
title: Cài đặt
x-i18n:
    generated_at: "2026-05-06T09:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.14+ - script cài đặt tự động xử lý việc này
- **macOS, Linux hoặc Windows** - hỗ trợ cả Windows gốc và WSL2; WSL2 ổn định hơn. Xem [Windows](/vi/platforms/windows).
- Chỉ cần `pnpm` nếu bạn build từ source

## Khuyến nghị: script cài đặt

Cách cài đặt nhanh nhất. Script phát hiện OS của bạn, cài đặt Node nếu cần, cài đặt OpenClaw và khởi chạy onboarding.

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

Để biết tất cả flag và tùy chọn CI/tự động hóa, xem [Thông tin nội bộ của trình cài đặt](/vi/install/installer).

## Các phương thức cài đặt thay thế

### Trình cài đặt prefix cục bộ (`install-cli.sh`)

Dùng cách này khi bạn muốn giữ OpenClaw và Node trong một prefix cục bộ như
`~/.openclaw`, không phụ thuộc vào bản cài đặt Node toàn hệ thống:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Theo mặc định, script hỗ trợ cài đặt qua npm, cùng với cài đặt từ git-checkout trong cùng
luồng prefix. Tham khảo đầy đủ: [Thông tin nội bộ của trình cài đặt](/vi/install/installer#install-clish).

Đã cài đặt rồi? Chuyển đổi giữa bản cài đặt package và git bằng
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
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm yêu cầu phê duyệt rõ ràng cho các package có script build. Chạy `pnpm approve-builds -g` sau lần cài đặt đầu tiên.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun được hỗ trợ cho đường dẫn cài đặt CLI toàn cục. Với runtime của Gateway, Node vẫn là runtime daemon được khuyến nghị.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Khắc phục sự cố: lỗi build sharp (npm)">
  Nếu `sharp` lỗi do libvips được cài đặt toàn cục:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Từ source

Dành cho cộng tác viên hoặc bất kỳ ai muốn chạy từ checkout cục bộ:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua bước link và dùng `pnpm openclaw ...` từ bên trong repo. Xem [Thiết lập](/vi/start/setup) để biết đầy đủ workflow phát triển.

### Cài đặt từ GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container và trình quản lý package

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="container">
    Triển khai dạng container hoặc headless.
  </Card>
  <Card title="Podman" href="/vi/install/podman" icon="container">
    Phương án container không cần root thay thế Docker.
  </Card>
  <Card title="Nix" href="/vi/install/nix" icon="snowflake">
    Cài đặt khai báo qua Nix flake.
  </Card>
  <Card title="Ansible" href="/vi/install/ansible" icon="server">
    Cấp phát fleet tự động.
  </Card>
  <Card title="Bun" href="/vi/install/bun" icon="zap">
    Chỉ sử dụng CLI qua runtime Bun.
  </Card>
</CardGroup>

## Xác minh cài đặt

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Nếu bạn muốn khởi động có quản lý sau khi cài đặt:

- macOS: LaunchAgent qua `openclaw onboard --install-daemon` hoặc `openclaw gateway install`
- Linux/WSL2: dịch vụ systemd người dùng qua cùng các lệnh đó
- Windows gốc: Scheduled Task trước, với mục đăng nhập Startup-folder theo từng người dùng làm dự phòng nếu việc tạo task bị từ chối

## Hosting và triển khai

Triển khai OpenClaw trên server đám mây hoặc VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vi/vps">Bất kỳ VPS Linux nào</Card>
  <Card title="Docker VM" href="/vi/install/docker-vm-runtime">Các bước Docker dùng chung</Card>
  <Card title="Kubernetes" href="/vi/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/vi/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/vi/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/vi/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/vi/install/azure">Azure</Card>
  <Card title="Railway" href="/vi/install/railway">Railway</Card>
  <Card title="Render" href="/vi/install/render">Render</Card>
  <Card title="Northflank" href="/vi/install/northflank">Northflank</Card>
</CardGroup>

## Cập nhật, di chuyển hoặc gỡ cài đặt

<CardGroup cols={3}>
  <Card title="Cập nhật" href="/vi/install/updating" icon="refresh-cw">
    Luôn giữ OpenClaw được cập nhật.
  </Card>
  <Card title="Di chuyển" href="/vi/install/migrating" icon="arrow-right">
    Chuyển sang máy mới.
  </Card>
  <Card title="Gỡ cài đặt" href="/vi/install/uninstall" icon="trash-2">
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

Nếu `$(npm prefix -g)/bin` không có trong `$PATH` của bạn, hãy thêm nó vào file khởi động shell (`~/.zshrc` hoặc `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Sau đó mở terminal mới. Xem [Thiết lập Node](/vi/install/node) để biết thêm chi tiết.
