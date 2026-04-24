---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS gratis untuk OpenClaw
    - Ingin OpenClaw 24/7 di server kecil
summary: Hosting OpenClaw di tier ARM Always Free Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T09:14:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Jalankan Gateway OpenClaw persisten di tier ARM **Always Free** Oracle Cloud (hingga 4 OCPU, 24 GB RAM, 200 GB penyimpanan) tanpa biaya.

## Prasyarat

- Akun Oracle Cloud ([daftar](https://www.oracle.com/cloud/free/)) -- lihat [panduan pendaftaran komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika Anda mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- Sepasang kunci SSH
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Buat instance OCI">
    1. Masuk ke [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Navigasikan ke **Compute > Instances > Create Instance**.
    3. Konfigurasikan:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (atau hingga 4)
       - **Memory:** 12 GB (atau hingga 24 GB)
       - **Boot volume:** 50 GB (hingga 200 GB gratis)
       - **SSH key:** Tambahkan kunci publik Anda
    4. Klik **Create** dan catat alamat IP publik.

    <Tip>
    Jika pembuatan instance gagal dengan "Out of capacity", coba domain ketersediaan lain atau coba lagi nanti. Kapasitas tier gratis terbatas.
    </Tip>

  </Step>

  <Step title="Hubungkan dan perbarui sistem">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` diperlukan untuk kompilasi ARM beberapa dependensi.

  </Step>

  <Step title="Konfigurasikan pengguna dan hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Mengaktifkan linger menjaga layanan pengguna tetap berjalan setelah logout.

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

    Saat ditanya "How do you want to hatch your bot?", pilih **Do this later**.

  </Step>

  <Step title="Konfigurasikan gateway">
    Gunakan auth token dengan Tailscale Serve untuk akses remote yang aman.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/local-client dari proxy Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute penampil diff mempertahankan perilaku fail-closed dalam penyiapan ini: permintaan penampil `127.0.0.1` mentah tanpa header proxy yang diteruskan dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan penampil remote secara sengaja dan setel `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan `baseUrl` proxy) jika Anda memerlukan tautan penampil yang dapat dibagikan.

  </Step>

  <Step title="Kunci keamanan VCN">
    Blokir semua lalu lintas kecuali Tailscale di tepi jaringan:

    1. Buka **Networking > Virtual Cloud Networks** di OCI Console.
    2. Klik VCN Anda, lalu **Security Lists > Default Security List**.
    3. **Hapus** semua aturan ingress kecuali `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Pertahankan aturan egress default (izinkan semua lalu lintas keluar).

    Ini memblokir SSH di port 22, HTTP, HTTPS, dan semua yang lain di tepi jaringan. Anda hanya dapat terhubung melalui Tailscale mulai dari titik ini.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Akses UI Control dari perangkat apa pun di tailnet Anda:

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

**Pembuatan instance gagal ("Out of capacity")** -- Instance ARM tier gratis populer. Coba domain ketersediaan lain atau ulangi saat jam tidak sibuk.

**Tailscale tidak mau terhubung** -- Jalankan `sudo tailscale up --ssh --hostname=openclaw --reset` untuk autentikasi ulang.

**Gateway tidak mau mulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Masalah biner ARM** -- Sebagian besar paket npm berfungsi di ARM64. Untuk biner native, cari rilis `linux-arm64` atau `aarch64`. Verifikasi arsitektur dengan `uname -m`.

## Langkah berikutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Gateway configuration](/id/gateway/configuration) -- semua opsi config
- [Updating](/id/install/updating) -- jaga OpenClaw tetap terbaru

## Terkait

- [Install overview](/id/install)
- [GCP](/id/install/gcp)
- [VPS hosting](/id/vps)
