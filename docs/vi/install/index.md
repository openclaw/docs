---
read_when:
    - Bạn cần một phương thức cài đặt khác ngoài hướng dẫn bắt đầu nhanh
    - Bạn muốn triển khai lên một nền tảng đám mây
    - Bạn cần cập nhật, di chuyển hoặc gỡ cài đặt
summary: Cài đặt OpenClaw - tập lệnh cài đặt, npm/pnpm/bun, từ mã nguồn, Docker và nhiều cách khác
title: Cài đặt
x-i18n:
    generated_at: "2026-05-07T13:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## Yêu cầu hệ thống

- **Node 24** (khuyến nghị) hoặc Node 22.16+ - tập lệnh cài đặt tự động xử lý việc này
- **macOS, Linux, hoặc Windows** - hỗ trợ cả Windows gốc và WSL2; WSL2 ổn định hơn. Xem [Windows](/vi/platforms/windows).
- `pnpm` chỉ cần thiết nếu bạn build từ mã nguồn

## Khuyến nghị: tập lệnh cài đặt

Cách cài đặt nhanh nhất. Nó phát hiện OS của bạn, cài đặt Node nếu cần, cài đặt OpenClaw, và khởi chạy quy trình thiết lập ban đầu.

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

Để biết tất cả cờ và tùy chọn CI/tự động hóa, xem [nội bộ trình cài đặt](/vi/install/installer).

## Phương thức cài đặt thay thế

### Trình cài đặt tiền tố cục bộ (`install-cli.sh`)

Dùng cách này khi bạn muốn giữ OpenClaw và Node dưới một tiền tố cục bộ như
`~/.openclaw`, mà không phụ thuộc vào bản cài đặt Node toàn hệ thống:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Mặc định nó hỗ trợ cài đặt npm, cùng với cài đặt từ git-checkout theo cùng
luồng tiền tố. Tài liệu tham khảo đầy đủ: [nội bộ trình cài đặt](/vi/install/installer#install-clish).

Đã cài đặt rồi? Chuyển đổi giữa bản cài đặt package và git bằng
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
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm yêu cầu phê duyệt rõ ràng cho các package có tập lệnh build. Chạy `pnpm approve-builds -g` sau lần cài đặt đầu tiên.
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

<Accordion title="Troubleshooting: sharp build errors (npm)">
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

Hoặc bỏ qua bước link và dùng `pnpm openclaw ...` từ bên trong repo. Xem [Thiết lập](/vi/start/setup) để biết đầy đủ các quy trình phát triển.

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
    Giải pháp container không root thay thế Docker.
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

## Xác minh cài đặt

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Nếu bạn muốn khởi động được quản lý sau khi cài đặt:

- macOS: LaunchAgent qua `openclaw onboard --install-daemon` hoặc `openclaw gateway install`
- Linux/WSL2: dịch vụ systemd của người dùng qua cùng các lệnh
- Windows gốc: Scheduled Task trước, với mục đăng nhập trong thư mục Startup theo từng người dùng làm phương án dự phòng nếu việc tạo task bị từ chối

## Lưu trữ và triển khai

Triển khai OpenClaw trên máy chủ đám mây hoặc VPS:

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

Sau đó mở terminal mới. Xem [thiết lập Node](/vi/install/node) để biết thêm chi tiết.
