---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên GCP
    - Bạn muốn một Gateway đạt chuẩn sản xuất, luôn hoạt động trên VM của riêng bạn
    - Bạn muốn toàn quyền kiểm soát việc lưu trữ bền vững, các tệp nhị phân và hành vi khởi động lại
summary: Chạy OpenClaw Gateway 24/7 trên một máy ảo GCP Compute Engine (Docker) với trạng thái bền vững
title: GCP
x-i18n:
    generated_at: "2026-04-29T22:51:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 16
---

# OpenClaw trên GCP Compute Engine (Docker, Hướng dẫn VPS sản xuất)

## Mục tiêu

Chạy một OpenClaw Gateway ổn định trên VM GCP Compute Engine bằng Docker, với trạng thái bền vững, các binary được tích hợp sẵn và hành vi khởi động lại an toàn.

Nếu bạn muốn "OpenClaw 24/7 với chi phí khoảng ~$5-12/tháng", đây là một thiết lập đáng tin cậy trên Google Cloud.
Giá thay đổi theo loại máy và khu vực; hãy chọn VM nhỏ nhất phù hợp với khối lượng công việc của bạn và nâng cấp nếu gặp OOM.

## Chúng ta đang làm gì (nói đơn giản)?

- Tạo một dự án GCP và bật thanh toán
- Tạo một VM Compute Engine
- Cài đặt Docker (runtime ứng dụng cô lập)
- Khởi động OpenClaw Gateway trong Docker
- Lưu bền vững `~/.openclaw` + `~/.openclaw/workspace` trên máy chủ (tồn tại qua các lần khởi động lại/tạo lại)
- Truy cập Control UI từ laptop của bạn qua SSH tunnel

Trạng thái `~/.openclaw` được mount đó bao gồm `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` theo từng agent, và `.env`.

Có thể truy cập Gateway qua:

- Chuyển tiếp cổng SSH từ laptop của bạn
- Mở cổng trực tiếp nếu bạn tự quản lý firewall và token

Hướng dẫn này dùng Debian trên GCP Compute Engine.
Ubuntu cũng hoạt động; hãy ánh xạ các gói tương ứng.
Với luồng Docker chung, xem [Docker](/vi/install/docker).

---

## Lộ trình nhanh (dành cho người vận hành có kinh nghiệm)

1. Tạo dự án GCP + bật Compute Engine API
2. Tạo VM Compute Engine (e2-small, Debian 12, 20GB)
3. SSH vào VM
4. Cài đặt Docker
5. Clone kho OpenClaw
6. Tạo các thư mục máy chủ bền vững
7. Cấu hình `.env` và `docker-compose.yml`
8. Tích hợp các binary cần thiết, build và khởi chạy

---

## Bạn cần gì

- Tài khoản GCP (có thể đủ điều kiện dùng free tier cho e2-micro)
- Đã cài gcloud CLI (hoặc dùng Cloud Console)
- Quyền truy cập SSH từ laptop của bạn
- Quen cơ bản với SSH + sao chép/dán
- Khoảng 20-30 phút
- Docker và Docker Compose
- Thông tin xác thực model
- Thông tin xác thực provider tùy chọn
  - Mã QR WhatsApp
  - Token bot Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Cài đặt gcloud CLI (hoặc dùng Console)">
    **Tùy chọn A: gcloud CLI** (khuyến nghị cho tự động hóa)

    Cài đặt từ [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Khởi tạo và xác thực:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Tùy chọn B: Cloud Console**

    Tất cả các bước có thể thực hiện qua giao diện web tại [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Tạo một dự án GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Bật thanh toán tại [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (bắt buộc cho Compute Engine).

    Bật Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vào IAM & Admin > Create Project
    2. Đặt tên và tạo
    3. Bật thanh toán cho dự án
    4. Chuyển đến APIs & Services > Enable APIs > tìm "Compute Engine API" > Enable

  </Step>

  <Step title="Tạo VM">
    **Loại máy:**

    | Loại      | Thông số                 | Chi phí            | Ghi chú                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/tháng         | Đáng tin cậy nhất cho các bản build Docker cục bộ |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/tháng         | Tối thiểu được khuyến nghị cho build Docker  |
    | e2-micro  | 2 vCPU (chia sẻ), 1GB RAM | Đủ điều kiện free tier | Thường lỗi khi Docker build do OOM (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Vào Compute Engine > VM instances > Create instance
    2. Tên: `openclaw-gateway`
    3. Khu vực: `us-central1`, Vùng: `us-central1-a`
    4. Loại máy: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Tạo

  </Step>

  <Step title="SSH vào VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Nhấp nút "SSH" bên cạnh VM của bạn trong bảng điều khiển Compute Engine.

    Lưu ý: Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo VM. Nếu kết nối bị từ chối, hãy chờ rồi thử lại.

  </Step>

  <Step title="Cài đặt Docker (trên VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Đăng xuất rồi đăng nhập lại để thay đổi nhóm có hiệu lực:

    ```bash
    exit
    ```

    Sau đó SSH lại vào:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Xác minh:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone kho OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này giả định bạn sẽ build một image tùy chỉnh để đảm bảo binary được lưu bền vững.

  </Step>

  <Step title="Tạo các thư mục máy chủ bền vững">
    Docker container là tạm thời.
    Mọi trạng thái tồn tại lâu dài phải nằm trên máy chủ.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` ở thư mục gốc của kho.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Để trống `OPENCLAW_GATEWAY_TOKEN` trừ khi bạn rõ ràng muốn
    quản lý nó qua `.env`; OpenClaw ghi một gateway token ngẫu nhiên vào
    cấu hình trong lần khởi động đầu tiên. Tạo mật khẩu keyring và dán vào
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Không commit tệp này.**

    Tệp `.env` này dành cho env container/runtime như `OPENCLAW_GATEWAY_TOKEN`.
    Auth OAuth/API-key của provider đã lưu nằm trong
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` được mount.

  </Step>

  <Step title="Cấu hình Docker Compose">
    Tạo hoặc cập nhật `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` chỉ để tiện bootstrap, không thay thế cho cấu hình gateway đúng cách. Vẫn hãy đặt auth (`gateway.auth.token` hoặc mật khẩu) và dùng thiết lập bind an toàn cho triển khai của bạn.

  </Step>

  <Step title="Các bước runtime Docker VM dùng chung">
    Dùng hướng dẫn runtime dùng chung cho luồng máy chủ Docker phổ biến:

    - [Tích hợp các binary cần thiết vào image](/vi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build và khởi chạy](/vi/install/docker-vm-runtime#build-and-launch)
    - [Nội dung nào được lưu bền vững ở đâu](/vi/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/vi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Ghi chú khởi chạy riêng cho GCP">
    Trên GCP, nếu build lỗi với `Killed` hoặc `exit code 137` trong `pnpm install --frozen-lockfile`, VM đã hết bộ nhớ. Dùng tối thiểu `e2-small`, hoặc `e2-medium` để các bản build đầu tiên đáng tin cậy hơn.

    Khi bind vào LAN (`OPENCLAW_GATEWAY_BIND=lan`), hãy cấu hình nguồn gốc trình duyệt tin cậy trước khi tiếp tục:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Nếu bạn đã đổi cổng gateway, hãy thay `18789` bằng cổng đã cấu hình.

  </Step>

  <Step title="Truy cập từ laptop của bạn">
    Tạo SSH tunnel để chuyển tiếp cổng Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Mở trong trình duyệt của bạn:

    `http://127.0.0.1:18789/`

    In lại một liên kết dashboard sạch:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Nếu UI yêu cầu auth shared-secret, hãy dán token hoặc mật khẩu đã cấu hình
    vào phần thiết lập Control UI. Luồng Docker này mặc định ghi một token;
    nếu bạn chuyển cấu hình container sang auth bằng mật khẩu, hãy dùng
    mật khẩu đó thay thế.

    Nếu Control UI hiển thị `unauthorized` hoặc `disconnected (1008): pairing required`, hãy phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Cần lại tài liệu tham chiếu về lưu bền vững và cập nhật dùng chung?
    Xem [Docker VM Runtime](/vi/install/docker-vm-runtime#what-persists-where) và [cập nhật Docker VM Runtime](/vi/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Khắc phục sự cố

**Kết nối SSH bị từ chối**

Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo VM. Hãy chờ rồi thử lại.

**Sự cố OS Login**

Kiểm tra hồ sơ OS Login của bạn:

```bash
gcloud compute os-login describe-profile
```

Đảm bảo tài khoản của bạn có các quyền IAM bắt buộc (Compute OS Login hoặc Compute OS Admin Login).

**Hết bộ nhớ (OOM)**

Nếu Docker build lỗi với `Killed` và `exit code 137`, VM đã bị OOM-killed. Nâng cấp lên e2-small (tối thiểu) hoặc e2-medium (khuyến nghị để các bản build cục bộ đáng tin cậy):

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Tài khoản dịch vụ (thực hành bảo mật tốt nhất)

Với mục đích cá nhân, tài khoản người dùng mặc định của bạn hoạt động ổn.

Với tự động hóa hoặc pipeline CI/CD, hãy tạo một tài khoản dịch vụ riêng với quyền tối thiểu:

1. Tạo tài khoản dịch vụ:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Cấp vai trò Compute Instance Admin (hoặc vai trò tùy chỉnh hẹp hơn):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Tránh dùng vai trò Owner cho tự động hóa. Hãy áp dụng nguyên tắc đặc quyền tối thiểu.

Xem [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) để biết chi tiết về vai trò IAM.

---

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Ghép nối thiết bị cục bộ dưới dạng node: [Node](/vi/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Azure](/vi/install/azure)
- [Dịch vụ lưu trữ VPS](/vi/vps)
