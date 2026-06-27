---
read_when:
    - Bạn muốn triển khai máy chủ tự động với tăng cường bảo mật
    - Bạn cần thiết lập cách ly bằng tường lửa với quyền truy cập VPN
    - Bạn đang triển khai lên các máy chủ Debian/Ubuntu từ xa
summary: Cài đặt OpenClaw tự động, được tăng cường bảo mật bằng Ansible, VPN Tailscale và cách ly tường lửa
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:36:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

Triển khai OpenClaw lên máy chủ production bằng **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- trình cài đặt tự động với kiến trúc ưu tiên bảo mật.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn chuẩn cho triển khai Ansible. Trang này là phần tổng quan nhanh.
</Info>

## Điều kiện tiên quyết

| Yêu cầu      | Chi tiết                                                  |
| ------------ | --------------------------------------------------------- |
| **Hệ điều hành** | Debian 11+ hoặc Ubuntu 20.04+                            |
| **Quyền truy cập** | Quyền root hoặc sudo                                    |
| **Mạng**     | Kết nối Internet để cài đặt gói                           |
| **Ansible**  | 2.14+ (được cài tự động bởi tập lệnh khởi động nhanh)     |

## Bạn nhận được gì

- **Bảo mật ưu tiên tường lửa** -- UFW + cô lập Docker (chỉ SSH + Tailscale có thể truy cập)
- **Tailscale VPN** -- truy cập từ xa an toàn mà không công khai dịch vụ
- **Docker** -- container sandbox cô lập, chỉ bind vào localhost
- **Phòng thủ nhiều lớp** -- kiến trúc bảo mật 4 lớp
- **Tích hợp Systemd** -- tự khởi động khi boot với cơ chế tăng cường bảo mật
- **Thiết lập bằng một lệnh** -- triển khai hoàn chỉnh trong vài phút

## Khởi động nhanh

Cài đặt bằng một lệnh:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Những gì được cài đặt

Playbook Ansible cài đặt và cấu hình:

1. **Tailscale** -- VPN mesh để truy cập từ xa an toàn
2. **Tường lửa UFW** -- chỉ các cổng SSH + Tailscale
3. **Docker CE + Compose V2** -- cho backend sandbox agent mặc định
4. **Node.js 24 + pnpm** -- phụ thuộc runtime (Node 22 LTS, hiện là `22.19+`, vẫn được hỗ trợ)
5. **OpenClaw** -- chạy trên host, không container hóa
6. **Dịch vụ Systemd** -- tự khởi động với tăng cường bảo mật

<Note>
Gateway chạy trực tiếp trên host (không chạy trong Docker). Sandbox cho agent là
tùy chọn; playbook này cài Docker vì đó là backend sandbox mặc định.
Xem [Sandboxing](/vi/gateway/sandboxing) để biết chi tiết và các backend khác.
</Note>

## Thiết lập sau cài đặt

<Steps>
  <Step title="Chuyển sang người dùng openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Chạy trình hướng dẫn onboarding">
    Tập lệnh sau cài đặt hướng dẫn bạn cấu hình các thiết lập OpenClaw.
  </Step>
  <Step title="Kết nối nhà cung cấp nhắn tin">
    Đăng nhập vào WhatsApp, Telegram, Discord hoặc Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Xác minh cài đặt">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Kết nối với Tailscale">
    Tham gia VPN mesh của bạn để truy cập từ xa an toàn.
  </Step>
</Steps>

### Lệnh nhanh

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Kiến trúc bảo mật

Triển khai sử dụng mô hình phòng thủ 4 lớp:

1. **Tường lửa (UFW)** -- chỉ SSH (22) + Tailscale (41641/udp) được công khai
2. **VPN (Tailscale)** -- Gateway chỉ truy cập được qua VPN mesh
3. **Cô lập Docker** -- chuỗi iptables DOCKER-USER ngăn lộ cổng ra bên ngoài
4. **Tăng cường Systemd** -- NoNewPrivileges, PrivateTmp, người dùng không đặc quyền

Để xác minh bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả dịch vụ khác (Gateway, Docker) đều bị khóa.

Docker được cài cho sandbox agent (thực thi công cụ trong môi trường cô lập), không phải để chạy chính Gateway. Xem [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

## Cài đặt thủ công

Nếu bạn muốn kiểm soát thủ công thay vì dùng tự động hóa:

<Steps>
  <Step title="Cài đặt điều kiện tiên quyết">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Cài đặt collection Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Chạy playbook">
    ```bash
    ./run-playbook.sh
    ```

    Hoặc chạy trực tiếp rồi tự thực thi tập lệnh thiết lập sau đó:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Updating](/vi/install/updating) để biết quy trình cập nhật chuẩn.

Để chạy lại playbook Ansible (ví dụ: cho thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Thao tác này có tính idempotent và an toàn để chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tường lửa chặn kết nối của tôi">
    - Đảm bảo trước tiên bạn có thể truy cập qua Tailscale VPN
    - Truy cập SSH (cổng 22) luôn được cho phép
    - Theo thiết kế, Gateway chỉ truy cập được qua Tailscale

  </Accordion>
  <Accordion title="Dịch vụ không khởi động">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Sự cố sandbox Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Đăng nhập nhà cung cấp thất bại">
    Đảm bảo bạn đang chạy với tư cách người dùng `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết kiến trúc bảo mật chi tiết và cách khắc phục sự cố, xem repo openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- hướng dẫn triển khai đầy đủ
- [Docker](/vi/install/docker) -- thiết lập Gateway dạng container
- [Sandboxing](/vi/gateway/sandboxing) -- cấu hình sandbox agent
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- cô lập theo từng agent
