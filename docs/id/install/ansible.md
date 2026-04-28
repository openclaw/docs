---
read_when:
    - Anda menginginkan deployment server otomatis dengan hardening keamanan
    - Anda memerlukan penyiapan yang diisolasi firewall dengan akses VPN
    - Anda sedang melakukan deployment ke server Debian/Ubuntu remote
summary: Instalasi OpenClaw otomatis dan diperkeras dengan Ansible, VPN Tailscale, dan isolasi firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-21T09:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Instalasi Ansible

Deploy OpenClaw ke server produksi dengan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- installer otomatis dengan arsitektur yang mengutamakan keamanan.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) adalah sumber kebenaran untuk deployment Ansible. Halaman ini adalah gambaran singkat.
</Info>

## Prasyarat

| Requirement | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ atau Ubuntu 20.04+                             |
| **Access**  | Hak akses root atau sudo                                  |
| **Network** | Koneksi internet untuk instalasi paket                    |
| **Ansible** | 2.14+ (diinstal otomatis oleh skrip quick-start)          |

## Yang Anda Dapatkan

- **Keamanan yang mengutamakan firewall** -- isolasi UFW + Docker (hanya SSH + Tailscale yang dapat diakses)
- **VPN Tailscale** -- akses remote aman tanpa mengekspos layanan secara publik
- **Docker** -- container sandbox terisolasi, binding hanya localhost
- **Defense in depth** -- arsitektur keamanan 4 lapis
- **Integrasi Systemd** -- mulai otomatis saat boot dengan hardening
- **Penyiapan satu perintah** -- deployment lengkap dalam hitungan menit

## Quick Start

Instalasi satu perintah:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Yang Akan Diinstal

Playbook Ansible menginstal dan mengonfigurasi:

1. **Tailscale** -- mesh VPN untuk akses remote aman
2. **Firewall UFW** -- hanya port SSH + Tailscale
3. **Docker CE + Compose V2** -- untuk backend sandbox agent default
4. **Node.js 24 + pnpm** -- dependensi runtime (Node 22 LTS, saat ini `22.14+`, tetap didukung)
5. **OpenClaw** -- berbasis host, bukan dalam container
6. **Layanan Systemd** -- mulai otomatis dengan hardening keamanan

<Note>
Gateway berjalan langsung di host (bukan di Docker). Agent sandboxing bersifat
opsional; playbook ini menginstal Docker karena itu adalah backend sandbox
default. Lihat [Sandboxing](/id/gateway/sandboxing) untuk detail dan backend lainnya.
</Note>

## Penyiapan Pasca-Instalasi

<Steps>
  <Step title="Beralih ke pengguna openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Jalankan wizard onboarding">
    Skrip pasca-instalasi memandu Anda untuk mengonfigurasi pengaturan OpenClaw.
  </Step>
  <Step title="Hubungkan provider perpesanan">
    Login ke WhatsApp, Telegram, Discord, atau Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verifikasi instalasi">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Hubungkan ke Tailscale">
    Bergabunglah ke mesh VPN Anda untuk akses remote yang aman.
  </Step>
</Steps>

### Perintah Cepat

```bash
# Periksa status layanan
sudo systemctl status openclaw

# Lihat log langsung
sudo journalctl -u openclaw -f

# Mulai ulang gateway
sudo systemctl restart openclaw

# Login provider (jalankan sebagai pengguna openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Arsitektur Keamanan

Deployment ini menggunakan model pertahanan 4 lapis:

1. **Firewall (UFW)** -- hanya SSH (22) + Tailscale (41641/udp) yang diekspos secara publik
2. **VPN (Tailscale)** -- gateway hanya dapat diakses melalui mesh VPN
3. **Isolasi Docker** -- rantai iptables DOCKER-USER mencegah eksposur port eksternal
4. **Hardening Systemd** -- NoNewPrivileges, PrivateTmp, pengguna tanpa hak istimewa

Untuk memverifikasi permukaan serangan eksternal Anda:

```bash
nmap -p- YOUR_SERVER_IP
```

Hanya port 22 (SSH) yang seharusnya terbuka. Semua layanan lain (gateway, Docker) dikunci.

Docker diinstal untuk sandbox agent (eksekusi tool terisolasi), bukan untuk menjalankan gateway itu sendiri. Lihat [Sandbox dan Tools Multi-Agent](/id/tools/multi-agent-sandbox-tools) untuk konfigurasi sandbox.

## Instalasi Manual

Jika Anda lebih memilih kontrol manual atas otomasi:

<Steps>
  <Step title="Instal prasyarat">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone repositori">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instal koleksi Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Jalankan playbook">
    ```bash
    ./run-playbook.sh
    ```

    Sebagai alternatif, jalankan langsung lalu eksekusi skrip penyiapan secara manual setelahnya:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Lalu jalankan: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Memperbarui

Installer Ansible menyiapkan OpenClaw untuk pembaruan manual. Lihat [Updating](/id/install/updating) untuk alur pembaruan standar.

Untuk menjalankan ulang playbook Ansible (misalnya, untuk perubahan konfigurasi):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Ini idempoten dan aman dijalankan beberapa kali.

## Pemecahan Masalah

<AccordionGroup>
  <Accordion title="Firewall memblokir koneksi saya">
    - Pastikan Anda dapat mengakses melalui VPN Tailscale terlebih dahulu
    - Akses SSH (port 22) selalu diizinkan
    - Gateway hanya dapat diakses melalui Tailscale sesuai desain

  </Accordion>
  <Accordion title="Layanan tidak mau mulai">
    ```bash
    # Periksa log
    sudo journalctl -u openclaw -n 100

    # Verifikasi izin
    sudo ls -la /opt/openclaw

    # Uji start manual
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Masalah sandbox Docker">
    ```bash
    # Verifikasi Docker berjalan
    sudo systemctl status docker

    # Periksa image sandbox
    sudo docker images | grep openclaw-sandbox

    # Build image sandbox jika tidak ada
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Login provider gagal">
    Pastikan Anda menjalankan sebagai pengguna `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Konfigurasi Lanjutan

Untuk arsitektur keamanan dan pemecahan masalah yang lebih rinci, lihat repo openclaw-ansible:

- [Arsitektur Keamanan](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detail Teknis](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Panduan Pemecahan Masalah](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Terkait

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- panduan deployment lengkap
- [Docker](/id/install/docker) -- penyiapan gateway dalam container
- [Sandboxing](/id/gateway/sandboxing) -- konfigurasi sandbox agent
- [Sandbox dan Tools Multi-Agent](/id/tools/multi-agent-sandbox-tools) -- isolasi per-agent
