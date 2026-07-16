---
read_when:
    - Bạn muốn tự động triển khai máy chủ với các biện pháp tăng cường bảo mật
    - Bạn cần thiết lập cách ly bằng tường lửa với quyền truy cập qua VPN
    - Bạn đang triển khai lên các máy chủ Debian/Ubuntu từ xa
summary: Cài đặt OpenClaw tự động, được tăng cường bảo mật bằng Ansible, VPN Tailscale và cách ly tường lửa
title: Ansible
x-i18n:
    generated_at: "2026-07-16T14:34:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Triển khai OpenClaw lên các máy chủ sản xuất bằng **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, một trình cài đặt tự động có kiến trúc ưu tiên bảo mật.

<Info>
Kho lưu trữ [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) là nguồn thông tin chuẩn cho việc triển khai bằng Ansible. Trang này cung cấp thông tin tổng quan nhanh.
</Info>

## Điều kiện tiên quyết

| Yêu cầu     | Chi tiết                                                   |
| ----------- | ---------------------------------------------------------- |
| Hệ điều hành | Debian 11+ hoặc Ubuntu 20.04+                              |
| Quyền truy cập | Quyền root hoặc sudo                                    |
| Mạng        | Kết nối Internet để cài đặt gói                            |
| Ansible     | 2.14+ (được tập lệnh bắt đầu nhanh tự động cài đặt)        |

## Những gì bạn nhận được

- Bảo mật ưu tiên tường lửa: UFW + cô lập Docker (chỉ có thể truy cập SSH + Tailscale)
- VPN Tailscale để truy cập từ xa mà không công khai các dịch vụ
- Docker dành cho các container sandbox cô lập với liên kết chỉ dành cho localhost
- Tích hợp systemd với cơ chế tăng cường bảo mật, tự động khởi động khi hệ thống khởi động
- Thiết lập bằng một lệnh

## Bắt đầu nhanh

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Những thành phần được cài đặt

1. Tailscale (VPN dạng lưới để truy cập từ xa an toàn)
2. Tường lửa UFW (chỉ các cổng SSH + Tailscale)
3. Docker CE + Compose V2 (phần phụ trợ sandbox mặc định của tác tử)
4. Node.js và pnpm (OpenClaw yêu cầu Node 22.22.3+, 24.15+ hoặc 25.9+; khuyến nghị Node 24)
5. OpenClaw, được cài đặt trực tiếp trên máy chủ, không được container hóa
6. Một dịch vụ systemd có cơ chế tăng cường bảo mật

<Note>
Gateway chạy trực tiếp trên máy chủ, không chạy trong Docker. Việc dùng sandbox cho tác tử là
tùy chọn; playbook này cài đặt Docker vì đây là phần phụ trợ sandbox
mặc định. Xem [Sandbox](/vi/gateway/sandboxing) để biết các phần phụ trợ khác.
</Note>

## Thiết lập sau khi cài đặt

<Steps>
  <Step title="Chuyển sang người dùng openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Chạy trình hướng dẫn làm quen">
    Tập lệnh sau cài đặt sẽ hướng dẫn bạn cấu hình OpenClaw.
  </Step>
  <Step title="Kết nối các kênh nhắn tin">
    Đăng nhập vào WhatsApp, Telegram, Discord hoặc Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Xác minh quá trình cài đặt">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Kết nối với Tailscale">
    Tham gia mạng lưới VPN của bạn để truy cập từ xa an toàn.
  </Step>
</Steps>

### Các lệnh nhanh

```bash
# Kiểm tra trạng thái dịch vụ
sudo systemctl status openclaw

# Xem nhật ký trực tiếp
sudo journalctl -u openclaw -f

# Khởi động lại Gateway
sudo systemctl restart openclaw

# Đăng nhập kênh (chạy với tư cách người dùng openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Kiến trúc bảo mật

Mô hình phòng thủ bốn lớp:

1. Tường lửa (UFW): chỉ công khai SSH (22) và Tailscale (41641/udp)
2. VPN (Tailscale): chỉ có thể truy cập Gateway qua mạng lưới VPN
3. Cô lập Docker: chuỗi iptables `DOCKER-USER` ngăn các cổng bị công khai ra bên ngoài
4. Tăng cường bảo mật systemd: `NoNewPrivileges`, `PrivateTmp`, người dùng không có đặc quyền

Xác minh bề mặt tấn công bên ngoài của bạn:

```bash
nmap -p- YOUR_SERVER_IP
```

Chỉ cổng 22 (SSH) được phép mở. Gateway và Docker vẫn được khóa chặt.

Docker được cài đặt cho các sandbox của tác tử (thực thi công cụ một cách cô lập), không phải để chạy Gateway. Xem [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) để biết cách cấu hình sandbox.

## Cài đặt thủ công

<Steps>
  <Step title="Cài đặt các điều kiện tiên quyết">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Sao chép kho lưu trữ">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Cài đặt các bộ sưu tập Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Chạy playbook">
    ```bash
    ./run-playbook.sh
    ```

    Hoặc chạy trực tiếp playbook rồi chạy tập lệnh thiết lập theo cách thủ công:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Sau đó chạy: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Cập nhật

Trình cài đặt Ansible thiết lập OpenClaw để cập nhật thủ công; xem [Cập nhật](/vi/install/updating) để biết quy trình tiêu chuẩn.

Để chạy lại playbook (ví dụ: sau khi thay đổi cấu hình):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Thao tác này có tính lũy đẳng và có thể chạy nhiều lần một cách an toàn.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tường lửa chặn kết nối của tôi">
    - Trước tiên, hãy kết nối qua VPN Tailscale; theo thiết kế, chỉ có thể truy cập Gateway theo cách đó.
    - SSH (cổng 22) luôn được cho phép.

  </Accordion>
  <Accordion title="Dịch vụ không khởi động">
    ```bash
    # Kiểm tra nhật ký
    sudo journalctl -u openclaw -n 100

    # Xác minh quyền
    sudo ls -la /opt/openclaw

    # Kiểm thử khởi động thủ công
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Sự cố sandbox Docker">
    ```bash
    # Xác minh Docker đang chạy
    sudo systemctl status docker

    # Kiểm tra ảnh sandbox
    sudo docker images | grep openclaw-sandbox

    # Tạo ảnh sandbox nếu còn thiếu (yêu cầu bản sao mã nguồn)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Đối với bản cài đặt npm không có bản sao mã nguồn, xem
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Đăng nhập kênh không thành công">
    Hãy bảo đảm bạn đang chạy với tư cách người dùng `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình nâng cao

Để biết chi tiết về kiến trúc bảo mật và cách khắc phục sự cố, hãy xem kho lưu trữ openclaw-ansible:

- [Kiến trúc bảo mật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Chi tiết kỹ thuật](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Hướng dẫn khắc phục sự cố](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Liên quan

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): hướng dẫn triển khai đầy đủ
- [Docker](/vi/install/docker): thiết lập Gateway được container hóa
- [Sandbox](/vi/gateway/sandboxing): cấu hình sandbox của tác tử
- [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools): cô lập theo từng tác tử
