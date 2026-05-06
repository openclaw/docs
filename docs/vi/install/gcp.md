---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên GCP
    - Bạn muốn một Gateway cấp sản xuất, luôn hoạt động trên VM của riêng mình
    - Bạn muốn toàn quyền kiểm soát việc lưu giữ dữ liệu, các tệp nhị phân và hành vi khởi động lại
summary: Chạy OpenClaw Gateway 24/7 trên máy ảo GCP Compute Engine (Docker) với trạng thái bền vững
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Chạy một OpenClaw Gateway bền bỉ trên VM GCP Compute Engine bằng Docker, với trạng thái lâu bền, các binary được tích hợp sẵn, và hành vi khởi động lại an toàn.

Nếu bạn muốn "OpenClaw 24/7 với ~$5-12/tháng", đây là một thiết lập đáng tin cậy trên Google Cloud.
Giá thay đổi theo loại máy và khu vực; hãy chọn VM nhỏ nhất phù hợp với khối lượng công việc của bạn và tăng quy mô nếu gặp OOM.

## Chúng ta đang làm gì (nói đơn giản)?

- Tạo một dự án GCP và bật thanh toán
- Tạo một VM Compute Engine
- Cài đặt Docker (môi trường chạy ứng dụng cô lập)
- Khởi động OpenClaw Gateway trong Docker
- Lưu bền bỉ `~/.openclaw` + `~/.openclaw/workspace` trên máy chủ (sống sót qua các lần khởi động lại/tạo lại)
- Truy cập Giao diện điều khiển từ máy tính xách tay của bạn qua một SSH tunnel

Trạng thái `~/.openclaw` được mount đó bao gồm `openclaw.json`, từng agent
`agents/<agentId>/agent/auth-profiles.json`, và `.env`.

Gateway có thể được truy cập qua:

- Chuyển tiếp cổng SSH từ máy tính xách tay của bạn
- Mở cổng trực tiếp nếu bạn tự quản lý firewall và token

Hướng dẫn này dùng Debian trên GCP Compute Engine.
Ubuntu cũng hoạt động; ánh xạ các gói tương ứng.
Để xem luồng Docker chung, xem [Docker](/vi/install/docker).

---

## Lộ trình nhanh (người vận hành có kinh nghiệm)

1. Tạo dự án GCP + bật Compute Engine API
2. Tạo VM Compute Engine (e2-small, Debian 12, 20GB)
3. SSH vào VM
4. Cài đặt Docker
5. Clone kho lưu trữ OpenClaw
6. Tạo các thư mục máy chủ bền bỉ
7. Cấu hình `.env` và `docker-compose.yml`
8. Tích hợp các binary cần thiết, build, và khởi chạy

---

## Bạn cần gì

- Tài khoản GCP (đủ điều kiện free tier cho e2-micro)
- Đã cài gcloud CLI (hoặc dùng Cloud Console)
- Quyền truy cập SSH từ máy tính xách tay của bạn
- Quen cơ bản với SSH + sao chép/dán
- ~20-30 phút
- Docker và Docker Compose
- Thông tin xác thực auth mô hình
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

    Tất cả các bước có thể được thực hiện qua giao diện web tại [https://console.cloud.google.com](https://console.cloud.google.com)

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

    1. Đi tới IAM & Admin > Create Project
    2. Đặt tên và tạo
    3. Bật thanh toán cho dự án
    4. Điều hướng tới APIs & Services > Enable APIs > tìm "Compute Engine API" > Enable

  </Step>

  <Step title="Tạo VM">
    **Loại máy:**

    | Loại      | Thông số                    | Chi phí               | Ghi chú                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/tháng            | Đáng tin cậy nhất cho các bản build Docker cục bộ        |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/tháng            | Tối thiểu được khuyến nghị cho build Docker         |
    | e2-micro  | 2 vCPU (dùng chung), 1GB RAM | Đủ điều kiện free tier | Thường lỗi với Docker build OOM (exit 137) |

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

    1. Đi tới Compute Engine > VM instances > Create instance
    2. Tên: `openclaw-gateway`
    3. Khu vực: `us-central1`, Vùng: `us-central1-a`
    4. Loại máy: `e2-small`
    5. Đĩa khởi động: Debian 12, 20GB
    6. Tạo

  </Step>

  <Step title="SSH vào VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Nhấp vào nút "SSH" cạnh VM của bạn trong bảng điều khiển Compute Engine.

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

  <Step title="Clone kho lưu trữ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này giả định rằng bạn sẽ build một image tùy chỉnh để đảm bảo binary được lưu bền bỉ.

  </Step>

  <Step title="Tạo các thư mục máy chủ bền bỉ">
    Container Docker là tạm thời.
    Mọi trạng thái dài hạn phải nằm trên máy chủ.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` trong gốc kho lưu trữ.

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
    quản lý nó thông qua `.env`; OpenClaw ghi một gateway token ngẫu nhiên vào
    cấu hình trong lần khởi động đầu tiên. Tạo một mật khẩu keyring và dán vào
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Không commit tệp này.**

    Tệp `.env` này dành cho env container/runtime như `OPENCLAW_GATEWAY_TOKEN`.
    OAuth/API-key auth của provider được lưu trữ nằm trong
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` đã được mount.

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

    `--allow-unconfigured` chỉ để tiện bootstrap, nó không thay thế cho cấu hình gateway đúng cách. Vẫn đặt auth (`gateway.auth.token` hoặc mật khẩu) và dùng các thiết lập bind an toàn cho triển khai của bạn.

  </Step>

  <Step title="Các bước runtime VM Docker dùng chung">
    Dùng hướng dẫn runtime dùng chung cho luồng máy chủ Docker phổ biến:

    - [Tích hợp các binary cần thiết vào image](/vi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build và khởi chạy](/vi/install/docker-vm-runtime#build-and-launch)
    - [Những gì được lưu bền bỉ ở đâu](/vi/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/vi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Ghi chú khởi chạy riêng cho GCP">
    Trên GCP, nếu build lỗi với `Killed` hoặc `exit code 137` trong khi chạy `pnpm install --frozen-lockfile`, VM đã hết bộ nhớ. Dùng tối thiểu `e2-small`, hoặc `e2-medium` để các bản build đầu tiên đáng tin cậy hơn.

    Khi bind vào LAN (`OPENCLAW_GATEWAY_BIND=lan`), hãy cấu hình một origin trình duyệt đáng tin cậy trước khi tiếp tục:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Nếu bạn đã thay đổi cổng gateway, thay `18789` bằng cổng đã cấu hình của bạn.

  </Step>

  <Step title="Truy cập từ máy tính xách tay của bạn">
    Tạo một SSH tunnel để chuyển tiếp cổng Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Mở trong trình duyệt của bạn:

    `http://127.0.0.1:18789/`

    In lại một liên kết bảng điều khiển sạch:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Nếu UI nhắc auth shared-secret, hãy dán token hoặc
    mật khẩu đã cấu hình vào phần cài đặt Giao diện điều khiển. Luồng Docker này ghi một token theo
    mặc định; nếu bạn chuyển cấu hình container sang auth bằng mật khẩu, hãy dùng
    mật khẩu đó thay thế.

    Nếu Giao diện điều khiển hiển thị `unauthorized` hoặc `disconnected (1008): pairing required`, hãy phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Cần lại tài liệu tham khảo về lưu bền bỉ và cập nhật dùng chung?
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

Nếu Docker build lỗi với `Killed` và `exit code 137`, VM đã bị OOM-killed. Nâng cấp lên e2-small (tối thiểu) hoặc e2-medium (khuyến nghị để build cục bộ đáng tin cậy):

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

## Service account (thực hành bảo mật tốt nhất)

Để dùng cá nhân, tài khoản người dùng mặc định của bạn hoạt động ổn.

Đối với tự động hóa hoặc pipeline CI/CD, hãy tạo một service account chuyên dụng với quyền tối thiểu:

1. Tạo một service account:

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

Tránh dùng vai trò Owner cho tự động hóa. Áp dụng nguyên tắc đặc quyền tối thiểu.

Xem [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) để biết chi tiết về vai trò IAM.

---

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Ghép nối thiết bị cục bộ dưới dạng nút: [Nút](/vi/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Azure](/vi/install/azure)
- [Lưu trữ VPS](/vi/vps)
