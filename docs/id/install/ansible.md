---
read_when:
    - Anda menginginkan deployment server otomatis dengan hardening keamanan
    - Anda memerlukan setup terisolasi firewall dengan akses VPN
    - Anda melakukan deployment ke server Debian/Ubuntu jarak jauh
summary: Instalasi OpenClaw otomatis yang diperkeras dengan Ansible, VPN Tailscale, dan isolasi firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-05T13:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Instalasi Ansible

Deploy OpenClaw ke server produksi dengan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- installer otomatis dengan arsitektur yang mengutamakan keamanan.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) adalah sumber kebenaran untuk deployment Ansible. Halaman ini adalah ringkasan singkat.
</Info>

## Prasyarat

| Persyaratan | Detail                                                    |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ atau Ubuntu 20.04+                             |
| **Akses**   | Hak akses root atau sudo                                  |
| **Jaringan** | Koneksi internet untuk instalasi paket                   |
| **Ansible** | 2.14+ (diinstal secara otomatis oleh skrip quick-start)   |

## Yang Anda Dapatkan

- **Keamanan yang mengutamakan firewall** -- isolasi UFW + Docker (hanya SSH + Tailscale yang dapat diakses)
- **VPN Tailscale** -- akses jarak jauh aman tanpa mengekspos layanan secara publik
- **Docker** -- container sandbox terisolasi, binding hanya localhost
- **Defense in depth** -- arsitektur keamanan 4 lapis
- **Integrasi systemd** -- auto-start saat boot dengan hardening
- **Setup satu perintah** -- deployment lengkap dalam hitungan menit

## Quick Start

Instalasi satu perintah:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Yang Akan Diinstal

Playbook Ansible menginstal dan mengonfigurasi:

1. **Tailscale** -- mesh VPN untuk akses jarak jauh yang aman
2. **Firewall UFW** -- hanya port SSH + Tailscale
3. **Docker CE + Compose V2** -- untuk sandbox agen
4. **Node.js 24 + pnpm** -- dependensi runtime (Node 22 LTS, saat ini `22.14+`, tetap didukung)
5. **OpenClaw** -- berbasis host, bukan dikontainerkan
6. **Layanan systemd** -- auto-start dengan hardening keamanan

<Note>
Gateway berjalan langsung pada host (bukan di Docker), tetapi sandbox agen menggunakan Docker untuk isolasi. Lihat [Sandboxing](/id/gateway/sandboxing) untuk detail.
</Note>

## Setup Setelah Instalasi

<Steps>
  <Step title="Beralih ke pengguna openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Jalankan wizard onboarding">
    Skrip pascainstalasi memandu Anda dalam mengonfigurasi pengaturan OpenClaw.
  </Step>
  <Step title="Hubungkan penyedia pesan">
    Masuk ke WhatsApp, Telegram, Discord, atau Signal:
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
    Bergabunglah dengan mesh VPN Anda untuk akses jarak jauh yang aman.
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

# Login penyedia (jalankan sebagai pengguna openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Arsitektur Keamanan

Deployment ini menggunakan model pertahanan 4 lapis:

1. **Firewall (UFW)** -- hanya SSH (22) + Tailscale (41641/udp) yang diekspos secara publik
2. **VPN (Tailscale)** -- gateway hanya dapat diakses melalui mesh VPN
3. **Isolasi Docker** -- chain iptables DOCKER-USER mencegah eksposur port eksternal
4. **Hardening systemd** -- NoNewPrivileges, PrivateTmp, pengguna tanpa hak istimewa

Untuk memverifikasi permukaan serangan eksternal Anda:

```bash
nmap -p- YOUR_SERVER_IP
```

Hanya port 22 (SSH) yang seharusnya terbuka. Semua layanan lain (gateway, Docker) dikunci.

Docker diinstal untuk sandbox agen (eksekusi tool terisolasi), bukan untuk menjalankan gateway itu sendiri. Lihat [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) untuk konfigurasi sandbox.

## Instalasi Manual

Jika Anda lebih memilih kontrol manual atas otomatisasi:

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

    Sebagai alternatif, jalankan langsung lalu eksekusi skrip setup secara manual setelahnya:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Lalu jalankan: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Pembaruan

Installer Ansible menyiapkan OpenClaw untuk pembaruan manual. Lihat [Updating](/install/updating) untuk alur pembaruan standar.

Untuk menjalankan ulang playbook Ansible (misalnya, untuk perubahan konfigurasi):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Ini idempotent dan aman untuk dijalankan beberapa kali.

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
    # Verifikasi Docker sedang berjalan
    sudo systemctl status docker

    # Periksa image sandbox
    sudo docker images | grep openclaw-sandbox

    # Bangun image sandbox jika tidak ada
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Login penyedia gagal">
    Pastikan Anda menjalankan sebagai pengguna `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Konfigurasi Lanjutan

Untuk arsitektur keamanan dan pemecahan masalah yang lebih rinci, lihat repo openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Terkait

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- panduan deployment lengkap
- [Docker](/install/docker) -- setup gateway yang dikontainerkan
- [Sandboxing](/id/gateway/sandboxing) -- konfigurasi sandbox agen
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- isolasi per agen
