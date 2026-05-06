---
read_when:
    - Bạn muốn triển khai máy chủ tự động với gia cố bảo mật
    - Bạn cần một thiết lập được cô lập bằng tường lửa với quyền truy cập VPN
    - Bạn đang triển khai lên các máy chủ Debian/Ubuntu từ xa
summary: Cài đặt OpenClaw tự động, được gia cố bảo mật với Ansible, Tailscale VPN và cách ly bằng tường lửa
title: Ansible
x-i18n:
    generated_at: "2026-05-06T09:16:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

Triển khai OpenClaw lên máy chủ sản xuất với **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- trình cài đặt tự động với kiến trúc đặt bảo mật lên hàng đầu.

<Info>
Kho [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn chân lý cho triển khai Ansible. Trang này là phần tổng quan nhanh.
</Info>

## Điều kiện tiên quyết

| Yêu cầu     | Chi tiết                                                   |
| ----------- | --------------------------------------------------------- |
| **Hệ điều hành** | Debian 11+ hoặc Ubuntu 20.04+                               |
| **Quyền truy cập** | Quyền root hoặc sudo                                   |
| **Mạng** | Kết nối Internet để cài đặt gói              |
| **Ansible** | 2.14+ (được cài đặt tự động bởi script khởi động nhanh) |

## Bạn nhận được gì

- **Bảo mật ưu tiên tường lửa** -- UFW + cô lập Docker (chỉ SSH + Tailscale có thể truy cập)
- **Tailscale VPN** -- truy cập từ xa an toàn mà không công khai dịch vụ
- **Docker** -- container sandbox cô lập, chỉ bind localhost
- **Phòng thủ nhiều lớp** -- kiến trúc bảo mật 4 lớp
- **Tích hợp systemd** -- tự khởi động khi boot với hardening
- **Thiết lập một lệnh** -- triển khai hoàn chỉnh trong vài phút

## Khởi động nhanh

Cài đặt bằng một lệnh:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Những gì được cài đặt

Playbook Ansible cài đặt và cấu hình:

1. **Tailscale** -- VPN mesh để truy cập từ xa an toàn
2. **Tường lửa UFW** -- chỉ các cổng SSH + Tailscale
3. **Docker CE + Compose V2** -- cho backend sandbox tác nhân mặc định
4. **Node.js 24 + pnpm** -- phụ thuộc runtime (Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ)
5. **OpenClaw** -- chạy trên host, không container hóa
6. **Dịch vụ systemd** -- tự khởi động với hardening bảo mật

<Note>
Gateway chạy trực tiếp trên host (không trong Docker). Sandbox cho tác nhân là
tùy chọn; playbook này cài đặt Docker vì đó là backend sandbox mặc định. Xem
[Sandboxing](/vi/gateway/sandboxing) để biết chi tiết và các backend khác.
</Note>

## Thiết lập sau cài đặt

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    Script sau cài đặt hướng dẫn bạn cấu hình thiết lập OpenClaw.
  </Step>
  <Step title="Connect messaging providers">
    Đăng nhập vào WhatsApp, Telegram, Discord hoặc Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
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
4. **Hardening systemd** -- NoNewPrivileges, PrivateTmp, người dùng không đặc quyền

Để xác minh bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả dịch vụ khác (Gateway, Docker) đều bị khóa lại.

Docker được cài đặt cho sandbox tác nhân (thực thi công cụ cô lập), không phải để chạy chính Gateway. Xem [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

## Cài đặt thủ công

Nếu bạn muốn kiểm soát thủ công thay vì dùng tự động hóa:

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    Hoặc chạy trực tiếp rồi sau đó thực thi thủ công script thiết lập:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Updating](/vi/install/updating) để biết quy trình cập nhật chuẩn.

Để chạy lại playbook Ansible (ví dụ, khi thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Thao tác này có tính idempotent và an toàn để chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - Đảm bảo trước tiên bạn có thể truy cập qua Tailscale VPN
    - Quyền truy cập SSH (cổng 22) luôn được cho phép
    - Gateway chỉ truy cập được qua Tailscale theo thiết kế

  </Accordion>
  <Accordion title="Service will not start">
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
  <Accordion title="Docker sandbox issues">
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
  <Accordion title="Provider login fails">
    Đảm bảo bạn đang chạy với tư cách người dùng `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết kiến trúc bảo mật chi tiết và cách khắc phục sự cố, xem kho openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- hướng dẫn triển khai đầy đủ
- [Docker](/vi/install/docker) -- thiết lập Gateway container hóa
- [Sandboxing](/vi/gateway/sandboxing) -- cấu hình sandbox tác nhân
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- cô lập theo từng tác nhân
