---
read_when:
    - Bạn muốn triển khai máy chủ tự động với gia cố bảo mật
    - Bạn cần một thiết lập được cô lập bằng tường lửa với quyền truy cập VPN
    - Bạn đang triển khai lên các máy chủ Debian/Ubuntu từ xa
summary: Cài đặt OpenClaw tự động, được gia cố bảo mật bằng Ansible, Tailscale VPN và cách ly bằng tường lửa
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

Triển khai OpenClaw lên máy chủ production bằng **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- trình cài đặt tự động với kiến trúc ưu tiên bảo mật.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn chuẩn cho triển khai Ansible. Trang này là tổng quan nhanh.
</Info>

## Điều kiện tiên quyết

| Yêu cầu      | Chi tiết                                                  |
| ------------ | --------------------------------------------------------- |
| **OS**       | Debian 11+ hoặc Ubuntu 20.04+                             |
| **Truy cập** | Quyền root hoặc sudo                                      |
| **Mạng**     | Kết nối Internet để cài đặt gói                           |
| **Ansible**  | 2.14+ (được cài tự động bởi script khởi động nhanh)       |

## Bạn nhận được gì

- **Bảo mật ưu tiên tường lửa** -- UFW + cách ly Docker (chỉ SSH + Tailscale có thể truy cập)
- **Tailscale VPN** -- truy cập từ xa an toàn mà không công khai dịch vụ
- **Docker** -- container sandbox cách ly, chỉ bind vào localhost
- **Phòng thủ nhiều lớp** -- kiến trúc bảo mật 4 lớp
- **Tích hợp Systemd** -- tự động khởi động khi boot với hardening
- **Thiết lập bằng một lệnh** -- triển khai hoàn tất trong vài phút

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
4. **Node.js 24 + pnpm** -- các phụ thuộc runtime (Node 22 LTS, hiện là `22.16+`, vẫn được hỗ trợ)
5. **OpenClaw** -- chạy trên host, không container hóa
6. **Dịch vụ Systemd** -- tự động khởi động với hardening bảo mật

<Note>
Gateway chạy trực tiếp trên host (không trong Docker). Cách ly sandbox cho agent là
tùy chọn; playbook này cài Docker vì đó là backend sandbox mặc định.
Xem [Cách ly sandbox](/vi/gateway/sandboxing) để biết chi tiết và các backend khác.
</Note>

## Thiết lập sau cài đặt

<Steps>
  <Step title="Chuyển sang người dùng openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Chạy trình hướng dẫn onboarding">
    Script sau cài đặt hướng dẫn bạn cấu hình các cài đặt OpenClaw.
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
2. **VPN (Tailscale)** -- gateway chỉ truy cập được qua VPN mesh
3. **Cách ly Docker** -- chuỗi iptables DOCKER-USER ngăn lộ cổng ra bên ngoài
4. **Hardening Systemd** -- NoNewPrivileges, PrivateTmp, người dùng không đặc quyền

Để xác minh bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả dịch vụ khác (gateway, Docker) đều bị khóa.

Docker được cài cho sandbox agent (thực thi công cụ cách ly), không phải để chạy chính gateway. Xem [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

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

    Hoặc chạy trực tiếp rồi sau đó tự thực thi script thiết lập:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Cập nhật](/vi/install/updating) để biết quy trình cập nhật chuẩn.

Để chạy lại playbook Ansible (ví dụ, cho các thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Quy trình này có tính idempotent và an toàn khi chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tường lửa chặn kết nối của tôi">
    - Trước tiên hãy đảm bảo bạn có thể truy cập qua Tailscale VPN
    - Truy cập SSH (cổng 22) luôn được cho phép
    - Gateway chỉ truy cập được qua Tailscale theo thiết kế

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
    Đảm bảo bạn đang chạy với người dùng `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết kiến trúc bảo mật chi tiết và cách khắc phục sự cố, hãy xem repo openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- hướng dẫn triển khai đầy đủ
- [Docker](/vi/install/docker) -- thiết lập gateway container hóa
- [Cách ly sandbox](/vi/gateway/sandboxing) -- cấu hình sandbox agent
- [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- cách ly theo từng agent
