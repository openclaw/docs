---
read_when:
    - Anda menginginkan penerapan server otomatis dengan penguatan keamanan
    - Anda memerlukan pengaturan yang terisolasi oleh firewall dengan akses VPN
    - Anda menyebarkan ke server Debian/Ubuntu jarak jauh
summary: Instalasi OpenClaw otomatis dan diperkeras dengan Ansible, VPN Tailscale, dan isolasi firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-30T09:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Instalasi Ansible

Terapkan OpenClaw ke server produksi dengan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- penginstal otomatis dengan arsitektur yang mengutamakan keamanan.

<Info>
Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) adalah sumber kebenaran untuk deployment Ansible. Halaman ini adalah ikhtisar singkat.
</Info>

## Prasyarat

| Persyaratan | Detail                                                    |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ atau Ubuntu 20.04+                             |
| **Akses**   | Hak akses root atau sudo                                  |
| **Jaringan** | Koneksi internet untuk instalasi paket                   |
| **Ansible** | 2.14+ (diinstal otomatis oleh skrip mulai cepat)          |

## Yang Anda dapatkan

- **Keamanan yang mendahulukan firewall** -- isolasi UFW + Docker (hanya SSH + Tailscale yang dapat diakses)
- **VPN Tailscale** -- akses jarak jauh yang aman tanpa mengekspos layanan secara publik
- **Docker** -- kontainer sandbox terisolasi, binding hanya localhost
- **Defense in depth** -- arsitektur keamanan 4 lapis
- **Integrasi systemd** -- mulai otomatis saat boot dengan hardening
- **Penyiapan satu perintah** -- deployment lengkap dalam hitungan menit

## Mulai cepat

Instalasi satu perintah:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Yang diinstal

Playbook Ansible menginstal dan mengonfigurasi:

1. **Tailscale** -- VPN mesh untuk akses jarak jauh yang aman
2. **Firewall UFW** -- hanya port SSH + Tailscale
3. **Docker CE + Compose V2** -- untuk backend sandbox agent bawaan
4. **Node.js 24 + pnpm** -- dependensi runtime (Node 22 LTS, saat ini `22.14+`, tetap didukung)
5. **OpenClaw** -- berbasis host, bukan dalam kontainer
6. **Layanan systemd** -- mulai otomatis dengan hardening keamanan

<Note>
Gateway berjalan langsung di host (bukan di Docker). Sandboxing agent bersifat
opsional; playbook ini menginstal Docker karena itu adalah backend sandbox
bawaan. Lihat [Sandboxing](/id/gateway/sandboxing) untuk detail dan backend lain.
</Note>

## Penyiapan Pasca-Instalasi

<Steps>
  <Step title="Beralih ke pengguna openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Jalankan wizard onboarding">
    Skrip pasca-instalasi memandu Anda mengonfigurasi pengaturan OpenClaw.
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

### Perintah cepat

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

## Arsitektur keamanan

Deployment menggunakan model pertahanan 4 lapis:

1. **Firewall (UFW)** -- hanya SSH (22) + Tailscale (41641/udp) yang terekspos secara publik
2. **VPN (Tailscale)** -- gateway hanya dapat diakses melalui mesh VPN
3. **Isolasi Docker** -- chain iptables DOCKER-USER mencegah eksposur port eksternal
4. **Hardening systemd** -- NoNewPrivileges, PrivateTmp, pengguna tanpa hak istimewa

Untuk memverifikasi permukaan serangan eksternal Anda:

```bash
nmap -p- YOUR_SERVER_IP
```

Hanya port 22 (SSH) yang seharusnya terbuka. Semua layanan lain (gateway, Docker) dikunci.

Docker diinstal untuk sandbox agent (eksekusi alat terisolasi), bukan untuk menjalankan gateway itu sendiri. Lihat [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) untuk konfigurasi sandbox.

## Instalasi manual

Jika Anda lebih suka kontrol manual daripada otomatisasi:

<Steps>
  <Step title="Instal prasyarat">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Kloning repositori">
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

    Atau, jalankan langsung lalu eksekusi skrip penyiapan secara manual setelahnya:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Memperbarui

Penginstal Ansible menyiapkan OpenClaw untuk pembaruan manual. Lihat [Memperbarui](/id/install/updating) untuk alur pembaruan standar.

Untuk menjalankan ulang playbook Ansible (misalnya, untuk perubahan konfigurasi):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Ini idempoten dan aman dijalankan beberapa kali.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Firewall memblokir koneksi saya">
    - Pastikan Anda dapat mengakses melalui VPN Tailscale terlebih dahulu
    - Akses SSH (port 22) selalu diizinkan
    - Gateway hanya dapat diakses melalui Tailscale sesuai desain

  </Accordion>
  <Accordion title="Layanan tidak dapat dimulai">
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
  <Accordion title="Masalah sandbox Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
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

## Konfigurasi lanjutan

Untuk arsitektur keamanan dan pemecahan masalah yang mendetail, lihat repo openclaw-ansible:

- [Arsitektur Keamanan](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detail Teknis](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Panduan Pemecahan Masalah](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Terkait

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- panduan deployment lengkap
- [Docker](/id/install/docker) -- penyiapan gateway dalam kontainer
- [Sandboxing](/id/gateway/sandboxing) -- konfigurasi sandbox agent
- [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) -- isolasi per agent
