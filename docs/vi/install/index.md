---
read_when:
    - Bạn cần một phương thức cài đặt khác ngoài hướng dẫn bắt đầu nhanh Bắt đầu
    - Bạn muốn triển khai lên một nền tảng đám mây
    - Bạn cần cập nhật, di chuyển hoặc gỡ cài đặt
summary: Cài đặt OpenClaw — tập lệnh cài đặt, npm/pnpm/bun, từ mã nguồn, Docker và hơn thế nữa
title: Cài đặt
x-i18n:
    generated_at: "2026-04-29T22:52:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 16
---

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.14+ — script cài đặt tự động xử lý việc này
- **macOS, Linux hoặc Windows** — hỗ trợ cả Windows gốc và WSL2; WSL2 ổn định hơn. Xem [Windows](/vi/platforms/windows).
- `pnpm` chỉ cần thiết nếu bạn build từ mã nguồn

## Khuyến nghị: script cài đặt

Cách cài đặt nhanh nhất. Script phát hiện hệ điều hành, cài Node nếu cần, cài OpenClaw và khởi chạy onboarding.

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

Để xem tất cả cờ và tùy chọn CI/tự động hóa, xem [Nội bộ trình cài đặt](/vi/install/installer).

## Các phương thức cài đặt thay thế

### Trình cài đặt tiền tố cục bộ (`install-cli.sh`)

Dùng cách này khi bạn muốn giữ OpenClaw và Node trong một tiền tố cục bộ như
`~/.openclaw`, mà không phụ thuộc vào bản cài Node toàn hệ thống:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Theo mặc định, script hỗ trợ cài đặt npm, cùng với cài đặt từ git-checkout trong cùng
luồng tiền tố. Tham khảo đầy đủ: [Nội bộ trình cài đặt](/vi/install/installer#install-clish).

Đã cài đặt rồi? Chuyển giữa bản cài từ package và git bằng
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

### Từ mã nguồn

Dành cho người đóng góp hoặc bất kỳ ai muốn chạy từ một checkout cục bộ:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Hoặc bỏ qua bước link và dùng `pnpm openclaw ...` từ bên trong repo. Xem [Thiết lập](/vi/start/setup) để biết đầy đủ quy trình phát triển.

### Cài đặt từ GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container và trình quản lý package

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="container">
    Triển khai trong container hoặc không giao diện.
  </Card>
  <Card title="Podman" href="/vi/install/podman" icon="container">
    Phương án container không root thay cho Docker.
  </Card>
  <Card title="Nix" href="/vi/install/nix" icon="snowflake">
    Cài đặt khai báo qua Nix flake.
  </Card>
  <Card title="Ansible" href="/vi/install/ansible" icon="server">
    Cấp phát đội máy tự động.
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

Nếu bạn muốn khởi động được quản lý sau khi cài đặt:

- macOS: LaunchAgent qua `openclaw onboard --install-daemon` hoặc `openclaw gateway install`
- Linux/WSL2: dịch vụ người dùng systemd qua cùng các lệnh đó
- Windows gốc: Scheduled Task trước, với mục đăng nhập trong thư mục Startup theo từng người dùng làm phương án dự phòng nếu việc tạo tác vụ bị từ chối

## Hosting và triển khai

Triển khai OpenClaw trên máy chủ cloud hoặc VPS:

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
    Giữ OpenClaw luôn được cập nhật.
  </Card>
  <Card title="Di chuyển" href="/vi/install/migrating" icon="arrow-right">
    Chuyển sang máy mới.
  </Card>
  <Card title="Gỡ cài đặt" href="/vi/install/uninstall" icon="trash-2">
    Gỡ bỏ OpenClaw hoàn toàn.
  </Card>
</CardGroup>

## Khắc phục sự cố: không tìm thấy `openclaw`

Nếu cài đặt thành công nhưng terminal của bạn không tìm thấy `openclaw`:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Nếu `$(npm prefix -g)/bin` không nằm trong `$PATH`, hãy thêm nó vào tệp khởi động shell của bạn (`~/.zshrc` hoặc `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Sau đó mở terminal mới. Xem [Thiết lập Node](/vi/install/node) để biết thêm chi tiết.
