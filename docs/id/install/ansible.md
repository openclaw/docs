---
read_when:
    - Anda menginginkan penerapan server otomatis dengan penguatan keamanan
    - Anda memerlukan penyiapan yang diisolasi firewall dengan akses VPN
    - Anda melakukan deployment ke server Debian/Ubuntu jarak jauh
summary: Instalasi OpenClaw otomatis dan diperkuat dengan Ansible, VPN Tailscale, serta isolasi firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-16T18:11:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Deploy OpenClaw ke server produksi dengan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, penginstal otomatis dengan arsitektur yang mengutamakan keamanan.

<Info>
Repositori [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) adalah sumber kebenaran untuk deployment Ansible. Halaman ini memberikan ikhtisar singkat.
</Info>

## Prasyarat

| Persyaratan | Detail                                                    |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ atau Ubuntu 20.04+                             |
| Akses       | Hak akses root atau sudo                                  |
| Jaringan    | Koneksi internet untuk penginstalan paket                 |
| Ansible     | 2.14+ (diinstal otomatis oleh skrip mulai cepat)          |

## Yang Anda dapatkan

- Keamanan yang mengutamakan firewall: UFW + isolasi Docker (hanya SSH + Tailscale yang dapat dijangkau)
- VPN Tailscale untuk akses jarak jauh tanpa mengekspos layanan secara publik
- Docker untuk kontainer sandbox terisolasi dengan pengikatan khusus localhost
- Integrasi systemd dengan penguatan keamanan, dimulai otomatis saat boot
- Penyiapan dengan satu perintah

## Mulai cepat

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Yang diinstal

1. Tailscale (VPN mesh untuk akses jarak jauh yang aman)
2. Firewall UFW (hanya port SSH + Tailscale)
3. Docker CE + Compose V2 (backend sandbox agen default)
4. Node.js dan pnpm (OpenClaw memerlukan Node 22.22.3+, 24.15+, atau 25.9+; Node 24 direkomendasikan)
5. OpenClaw, diinstal langsung pada host, bukan dalam kontainer
6. Layanan systemd dengan penguatan keamanan

<Note>
Gateway berjalan langsung pada host, bukan di Docker. Sandbox agen bersifat
opsional; playbook ini menginstal Docker karena merupakan backend sandbox
default. Lihat [Sandbox](/id/gateway/sandboxing) untuk backend lainnya.
</Note>

## Penyiapan setelah penginstalan

<Steps>
  <Step title="Beralih ke pengguna openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Jalankan wisaya orientasi">
    Skrip pascapenginstalan memandu Anda mengonfigurasi OpenClaw.
  </Step>
  <Step title="Hubungkan saluran perpesanan">
    Masuk ke WhatsApp, Telegram, Discord, atau Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verifikasi penginstalan">
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
# Periksa status layanan
sudo systemctl status openclaw

# Lihat log langsung
sudo journalctl -u openclaw -f

# Mulai ulang gateway
sudo systemctl restart openclaw

# Masuk ke saluran (jalankan sebagai pengguna openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Arsitektur keamanan

Model pertahanan empat lapis:

1. Firewall (UFW): hanya SSH (22) dan Tailscale (41641/udp) yang diekspos secara publik
2. VPN (Tailscale): Gateway hanya dapat dijangkau melalui mesh VPN
3. Isolasi Docker: rantai iptables `DOCKER-USER` mencegah eksposur port eksternal
4. Penguatan systemd: `NoNewPrivileges`, `PrivateTmp`, pengguna tanpa hak istimewa

Verifikasi permukaan serangan eksternal Anda:

```bash
nmap -p- YOUR_SERVER_IP
```

Hanya port 22 (SSH) yang seharusnya terbuka. Gateway dan Docker tetap terkunci.

Docker diinstal untuk sandbox agen (eksekusi alat yang terisolasi), bukan untuk menjalankan Gateway. Lihat [Sandbox dan Alat Multiagen](/id/tools/multi-agent-sandbox-tools) untuk konfigurasi sandbox.

## Penginstalan manual

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

    Atau jalankan playbook secara langsung, lalu jalankan skrip penyiapan secara manual:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Kemudian jalankan: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Memperbarui

Penginstal Ansible menyiapkan OpenClaw untuk pembaruan manual; lihat [Memperbarui](/id/install/updating) untuk alur standar.

Untuk menjalankan ulang playbook (misalnya, setelah perubahan konfigurasi):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Proses ini idempoten dan aman dijalankan beberapa kali.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Firewall memblokir koneksi saya">
    - Hubungkan melalui VPN Tailscale terlebih dahulu; Gateway dirancang agar hanya dapat dijangkau dengan cara tersebut.
    - SSH (port 22) selalu diizinkan.

  </Accordion>
  <Accordion title="Layanan tidak dapat dimulai">
    ```bash
    # Periksa log
    sudo journalctl -u openclaw -n 100

    # Verifikasi izin
    sudo ls -la /opt/openclaw

    # Uji pemulaian manual
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

    # Bangun image sandbox jika tidak ada (memerlukan checkout sumber)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Untuk penginstalan npm tanpa checkout sumber, lihat
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Gagal masuk ke saluran">
    Pastikan Anda menjalankannya sebagai pengguna `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

Untuk arsitektur keamanan dan pemecahan masalah yang terperinci, lihat repositori openclaw-ansible:

- [Arsitektur Keamanan](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detail Teknis](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Panduan Pemecahan Masalah](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Terkait

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): panduan deployment lengkap
- [Docker](/id/install/docker): penyiapan Gateway dalam kontainer
- [Sandbox](/id/gateway/sandboxing): konfigurasi sandbox agen
- [Sandbox dan Alat Multiagen](/id/tools/multi-agent-sandbox-tools): isolasi per agen
