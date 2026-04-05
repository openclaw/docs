---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS gratis untuk OpenClaw
    - Ingin menjalankan OpenClaw 24/7 di server kecil
summary: Host OpenClaw di tier ARM Always Free milik Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Jalankan Gateway OpenClaw yang persisten di tier ARM **Always Free** milik Oracle Cloud (hingga 4 OCPU, RAM 24 GB, penyimpanan 200 GB) tanpa biaya.

## Prasyarat

- Akun Oracle Cloud ([signup](https://www.oracle.com/cloud/free/)) -- lihat [panduan signup komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika Anda mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- Sepasang SSH key
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Buat instance OCI">
    1. Login ke [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Navigasikan ke **Compute > Instances > Create Instance**.
    3. Konfigurasikan:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (atau hingga 4)
       - **Memory:** 12 GB (atau hingga 24 GB)
       - **Boot volume:** 50 GB (hingga 200 GB gratis)
       - **SSH key:** Tambahkan public key Anda
    4. Klik **Create** dan catat alamat IP publiknya.

    <Tip>
    Jika pembuatan instance gagal dengan pesan "Out of capacity", coba availability domain yang berbeda atau coba lagi nanti. Kapasitas tier gratis terbatas.
    </Tip>

  </Step>

  <Step title="Hubungkan dan perbarui sistem">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` diperlukan untuk kompilasi ARM dari beberapa dependensi.

  </Step>

  <Step title="Konfigurasikan pengguna dan hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Mengaktifkan linger membuat layanan pengguna tetap berjalan setelah logout.

  </Step>

  <Step title="Instal Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Mulai sekarang, hubungkan melalui Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Instal OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Saat diminta "How do you want to hatch your bot?", pilih **Do this later**.

  </Step>

  <Step title="Konfigurasikan gateway">
    Gunakan autentikasi token dengan Tailscale Serve untuk akses jarak jauh yang aman.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/klien lokal dari proxy Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute penampil diff tetap berperilaku fail-closed dalam penyiapan ini: permintaan viewer mentah `127.0.0.1` tanpa forwarded proxy header dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan penampil jarak jauh secara sengaja dan tetapkan `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan proxy `baseUrl`) jika Anda memerlukan tautan viewer yang dapat dibagikan.

  </Step>

  <Step title="Kunci keamanan VCN">
    Blokir semua traffic kecuali Tailscale di tepi jaringan:

    1. Buka **Networking > Virtual Cloud Networks** di OCI Console.
    2. Klik VCN Anda, lalu **Security Lists > Default Security List**.
    3. **Hapus** semua aturan ingress kecuali `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Pertahankan aturan egress default (izinkan semua traffic keluar).

    Ini memblokir SSH pada port 22, HTTP, HTTPS, dan semua hal lain di tepi jaringan. Mulai titik ini, Anda hanya dapat terhubung melalui Tailscale.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Akses Control UI dari perangkat mana pun di tailnet Anda:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Ganti `<tailnet-name>` dengan nama tailnet Anda (terlihat di `tailscale status`).

  </Step>
</Steps>

## Fallback: tunnel SSH

Jika Tailscale Serve tidak berfungsi, gunakan tunnel SSH dari mesin lokal Anda:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Lalu buka `http://localhost:18789`.

## Pemecahan masalah

**Pembuatan instance gagal ("Out of capacity")** -- Instance ARM tier gratis populer. Coba availability domain yang berbeda atau coba lagi di jam sepi.

**Tailscale tidak mau terhubung** -- Jalankan `sudo tailscale up --ssh --hostname=openclaw --reset` untuk mengautentikasi ulang.

**Gateway tidak mau start** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Masalah biner ARM** -- Sebagian besar package npm berfungsi di ARM64. Untuk biner native, cari rilis `linux-arm64` atau `aarch64`. Verifikasi arsitektur dengan `uname -m`.

## Langkah berikutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Updating](/install/updating) -- menjaga OpenClaw tetap terbaru
