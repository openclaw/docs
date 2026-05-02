---
read_when:
    - Bạn muốn triển khai máy chủ tự động kèm gia cố bảo mật
    - Bạn cần một thiết lập được cách ly bằng tường lửa và có quyền truy cập VPN
    - Bạn đang triển khai lên các máy chủ Debian/Ubuntu từ xa
summary: Cài đặt OpenClaw tự động, được tăng cường bảo mật với Ansible, VPN Tailscale và cách ly bằng tường lửa
title: Ansible
x-i18n:
    generated_at: "2026-05-02T10:45:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Cài đặt Ansible

Triển khai OpenClaw lên máy chủ production bằng **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- trình cài đặt tự động với kiến trúc ưu tiên bảo mật.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn tham chiếu chính thức cho triển khai Ansible. Trang này là phần tổng quan nhanh.
</Info>

## Điều kiện tiên quyết

| Yêu cầu      | Chi tiết                                                   |
| ------------ | ---------------------------------------------------------- |
| **HĐH**      | Debian 11+ hoặc Ubuntu 20.04+                              |
| **Truy cập** | Quyền root hoặc sudo                                       |
| **Mạng**     | Kết nối Internet để cài đặt gói                            |
| **Ansible**  | 2.14+ (được cài tự động bởi script khởi động nhanh)        |

## Những gì bạn nhận được

- **Bảo mật ưu tiên tường lửa** -- UFW + cô lập Docker (chỉ SSH + Tailscale có thể truy cập)
- **Tailscale VPN** -- truy cập từ xa an toàn mà không công khai dịch vụ
- **Docker** -- container sandbox cô lập, chỉ bind vào localhost
- **Phòng thủ nhiều lớp** -- kiến trúc bảo mật 4 lớp
- **Tích hợp systemd** -- tự động khởi động khi boot kèm hardening
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
3. **Docker CE + Compose V2** -- cho backend sandbox tác tử mặc định
4. **Node.js 24 + pnpm** -- phụ thuộc runtime (Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ)
5. **OpenClaw** -- chạy trên host, không container hóa
6. **Dịch vụ systemd** -- tự động khởi động kèm hardening bảo mật

<Note>
Gateway chạy trực tiếp trên host (không trong Docker). Sandbox cho tác tử là
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
    Script sau cài đặt sẽ hướng dẫn bạn cấu hình các thiết lập OpenClaw.
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

Quá trình triển khai sử dụng mô hình phòng thủ 4 lớp:

1. **Tường lửa (UFW)** -- chỉ SSH (22) + Tailscale (41641/udp) được công khai
2. **VPN (Tailscale)** -- Gateway chỉ có thể truy cập qua VPN mesh
3. **Cô lập Docker** -- chuỗi iptables DOCKER-USER ngăn lộ cổng ra bên ngoài
4. **Hardening systemd** -- NoNewPrivileges, PrivateTmp, người dùng không đặc quyền

Để xác minh bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) nên mở. Tất cả dịch vụ khác (Gateway, Docker) đều bị khóa.

Docker được cài đặt cho sandbox tác tử (thực thi công cụ cô lập), không phải để chạy chính Gateway. Xem [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) để cấu hình sandbox.

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

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công. Xem [Cập nhật](/vi/install/updating) để biết luồng cập nhật tiêu chuẩn.

Để chạy lại playbook Ansible (ví dụ: cho thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Việc này có tính idempotent và an toàn để chạy nhiều lần.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tường lửa chặn kết nối của tôi">
    - Đảm bảo trước tiên bạn có thể truy cập qua Tailscale VPN
    - Truy cập SSH (cổng 22) luôn được cho phép
    - Theo thiết kế, Gateway chỉ có thể truy cập qua Tailscale

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

Để biết kiến trúc bảo mật chi tiết và khắc phục sự cố, xem repo openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- hướng dẫn triển khai đầy đủ
- [Docker](/vi/install/docker) -- thiết lập Gateway container hóa
- [Sandboxing](/vi/gateway/sandboxing) -- cấu hình sandbox tác tử
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- cô lập theo từng tác tử
