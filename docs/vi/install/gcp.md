---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên GCP
    - Bạn muốn một Gateway cấp độ sản xuất, luôn hoạt động trên máy ảo của riêng mình
    - Bạn muốn toàn quyền kiểm soát việc lưu trữ lâu dài, các tệp nhị phân và hành vi khởi động lại
summary: Chạy OpenClaw Gateway 24/7 trên máy ảo GCP Compute Engine (Docker) với trạng thái được lưu trữ bền vững
title: GCP
x-i18n:
    generated_at: "2026-07-12T08:02:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Chạy một OpenClaw Gateway thường trực trên máy ảo GCP Compute Engine bằng Docker, với trạng thái bền vững, các tệp nhị phân được tích hợp sẵn và cơ chế khởi động lại an toàn.

Giá thay đổi tùy theo loại máy và khu vực; hãy chọn máy ảo nhỏ nhất đáp ứng khối lượng công việc của bạn và nâng cấp nếu gặp lỗi OOM.

Có thể truy cập Gateway qua chuyển tiếp cổng SSH từ máy tính xách tay của bạn hoặc bằng cách mở cổng trực tiếp nếu bạn tự quản lý tường lửa và token.

Hướng dẫn này sử dụng Debian trên GCP Compute Engine. Ubuntu cũng hoạt động; hãy điều chỉnh các gói tương ứng. Đối với quy trình Docker chung, xem [Docker](/vi/install/docker).

## Những gì bạn cần

- Tài khoản GCP (`e2-micro` đủ điều kiện hưởng gói miễn phí)
- CLI `gcloud` hoặc [Cloud Console](https://console.cloud.google.com)
- Quyền truy cập SSH từ máy tính xách tay của bạn
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực nhà cung cấp tùy chọn (mã QR WhatsApp, token bot Telegram, OAuth Gmail)
- Khoảng 20-30 phút

## Quy trình nhanh

1. Tạo một dự án GCP, bật tính năng thanh toán và Compute Engine API
2. Tạo máy ảo Compute Engine (`e2-small`, Debian 12, 20GB)
3. SSH vào máy ảo, cài đặt Docker
4. Sao chép kho lưu trữ OpenClaw
5. Tạo các thư mục bền vững trên máy chủ
6. Cấu hình `.env` và `docker-compose.yml`
7. Tích hợp các tệp nhị phân cần thiết, xây dựng và khởi chạy

<Steps>
  <Step title="Cài đặt CLI gcloud (hoặc sử dụng Console)">
    Cài đặt từ [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), sau đó:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Hoặc thay vào đó, thực hiện mọi bước bên dưới qua giao diện web [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Tạo một dự án GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Bật tính năng thanh toán tại [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (bắt buộc đối với Compute Engine).

    Thao tác tương đương trong Console: IAM & Admin > Create Project, bật tính năng thanh toán, sau đó chọn APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Tạo máy ảo">
    | Loại      | Thông số kỹ thuật        | Chi phí                 | Ghi chú                                                |
    | --------- | ------------------------ | ----------------------- | ------------------------------------------------------ |
    | e2-medium | 2 vCPU, RAM 4GB          | Khoảng 25 USD/tháng     | Đáng tin cậy nhất khi xây dựng Docker cục bộ            |
    | e2-small  | 2 vCPU, RAM 2GB          | Khoảng 12 USD/tháng     | Mức tối thiểu được khuyến nghị để xây dựng Docker       |
    | e2-micro  | 2 vCPU (dùng chung), RAM 1GB | Đủ điều kiện dùng gói miễn phí | Thường không thành công do OOM khi xây dựng Docker (mã thoát 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH vào máy ảo">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: nhấp vào "SSH" bên cạnh máy ảo trong bảng điều khiển Compute Engine.

    Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo máy ảo; hãy chờ rồi thử lại nếu kết nối bị từ chối.

  </Step>

  <Step title="Cài đặt Docker (trên máy ảo)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Đăng xuất rồi đăng nhập lại để thay đổi nhóm có hiệu lực, sau đó SSH vào lại:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Xác minh:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Sao chép kho lưu trữ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này xây dựng một image tùy chỉnh để mọi tệp nhị phân bạn tích hợp vào đều tồn tại sau khi khởi động lại.

  </Step>

  <Step title="Tạo các thư mục bền vững trên máy chủ">
    Các container Docker chỉ tồn tại tạm thời; mọi trạng thái dài hạn phải nằm trên máy chủ.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` tại thư mục gốc của kho lưu trữ:

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

    Đặt `OPENCLAW_GATEWAY_TOKEN` để quản lý token Gateway ổn định thông qua
    `.env`; nếu không, hãy cấu hình `gateway.auth.token` trước khi dựa vào các máy khách
    qua những lần khởi động lại. Nếu cả hai đều chưa được đặt, OpenClaw sử dụng một token chỉ dành cho thời gian chạy
    trong lần khởi động đó. Tạo mật khẩu chuỗi khóa cho `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Không đưa tệp này vào commit.** Tệp này chứa các biến môi trường của container/thời gian chạy như
    `OPENCLAW_GATEWAY_TOKEN`. Thông tin xác thực OAuth/khóa API của nhà cung cấp đã lưu nằm trong
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` được gắn kết.

  </Step>

  <Step title="Cấu hình Docker Compose">
    Tạo hoặc cập nhật `docker-compose.yml`:

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
          # Khuyến nghị: chỉ cho phép truy cập Gateway qua loopback trên máy ảo; truy cập qua đường hầm SSH.
          # Để mở công khai, hãy xóa tiền tố `127.0.0.1:` và cấu hình tường lửa phù hợp.
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

    `--allow-unconfigured` chỉ nhằm tạo thuận tiện khi khởi tạo, không thay thế cho cấu hình Gateway thực sự. Bạn vẫn phải thiết lập xác thực (`gateway.auth.token` hoặc mật khẩu) và chế độ liên kết an toàn cho môi trường triển khai.

  </Step>

  <Step title="Các bước thời gian chạy dùng chung cho máy ảo Docker">
    Làm theo hướng dẫn thời gian chạy dùng chung dành cho quy trình máy chủ Docker phổ biến:

    - [Tích hợp các tệp nhị phân cần thiết vào image](/vi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Xây dựng và khởi chạy](/vi/install/docker-vm-runtime#build-and-launch)
    - [Dữ liệu nào được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/vi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Lưu ý khởi chạy dành riêng cho GCP">
    Nếu quá trình xây dựng không thành công với `Killed` hoặc `exit code 137` trong khi chạy `pnpm install --frozen-lockfile`, máy ảo đã hết bộ nhớ. Tối thiểu hãy sử dụng `e2-small`, hoặc dùng `e2-medium` để lần xây dựng đầu tiên đáng tin cậy hơn.

    Khi liên kết với mạng LAN (`OPENCLAW_GATEWAY_BIND=lan`), hãy cấu hình một nguồn gốc trình duyệt đáng tin cậy trước khi tiếp tục:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Thay `18789` bằng cổng đã cấu hình nếu bạn đã thay đổi cổng đó.

  </Step>

  <Step title="Truy cập từ máy tính xách tay">
    Tạo một đường hầm SSH để chuyển tiếp cổng Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Mở `http://127.0.0.1:18789/` trong trình duyệt của bạn.

    In lại một liên kết bảng điều khiển sạch:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Nếu giao diện yêu cầu xác thực bằng bí mật dùng chung, hãy dán token hoặc
    mật khẩu đã cấu hình vào phần cài đặt Control UI (quy trình Docker này ghi token theo
    mặc định; nếu bạn đã chuyển sang xác thực bằng mật khẩu, hãy sử dụng mật khẩu đã cấu hình
    thay thế).

    Nếu Control UI hiển thị `unauthorized` hoặc `disconnected (1008): pairing required`, hãy phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Xem [Thời gian chạy máy ảo Docker](/vi/install/docker-vm-runtime#what-persists-where) để biết sơ đồ lưu trữ bền vững dùng chung và [quy trình cập nhật](/vi/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Khắc phục sự cố

**Kết nối SSH bị từ chối**

Việc truyền khóa SSH có thể mất 1-2 phút sau khi tạo máy ảo. Hãy chờ rồi thử lại.

**Sự cố OS Login**

Kiểm tra hồ sơ OS Login của bạn:

```bash
gcloud compute os-login describe-profile
```

Đảm bảo tài khoản của bạn có các quyền IAM cần thiết (Compute OS Login hoặc Compute OS Admin Login).

**Hết bộ nhớ (OOM)**

Nếu quá trình xây dựng Docker không thành công với `Killed` và `exit code 137`, máy ảo đã bị hệ thống dừng do OOM:

```bash
# Trước tiên hãy dừng máy ảo
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Thay đổi loại máy
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Khởi động máy ảo
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Tài khoản dịch vụ (biện pháp bảo mật tốt nhất)

Đối với mục đích sử dụng cá nhân, tài khoản người dùng mặc định của bạn hoạt động tốt. Đối với tự động hóa hoặc CI/CD, hãy tạo một tài khoản dịch vụ chuyên dụng với quyền tối thiểu:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Tránh dùng vai trò Owner cho hoạt động tự động hóa; hãy sử dụng vai trò hẹp nhất vẫn đáp ứng yêu cầu. Xem [Tìm hiểu về vai trò](https://cloud.google.com/iam/docs/understanding-roles).

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Ghép nối thiết bị cục bộ làm Node: [Node](/vi/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Azure](/vi/install/azure)
- [Lưu trữ trên VPS](/vi/vps)
