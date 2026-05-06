---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS gratis untuk OpenClaw
    - Ingin OpenClaw 24/7 di server kecil
summary: Jalankan OpenClaw di tingkat ARM Always Free Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Jalankan OpenClaw Gateway persisten di tier ARM **Always Free** Oracle Cloud (hingga 4 OCPU, RAM 24 GB, penyimpanan 200 GB) tanpa biaya.

## Prasyarat

- Akun Oracle Cloud ([daftar](https://www.oracle.com/cloud/free/)) -- lihat [panduan pendaftaran komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- Sepasang kunci SSH
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Buat instance OCI">
    1. Masuk ke [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Buka **Compute > Instances > Create Instance**.
    3. Konfigurasikan:
       - **Nama:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (atau hingga 4)
       - **Memori:** 12 GB (atau hingga 24 GB)
       - **Volume boot:** 50 GB (gratis hingga 200 GB)
       - **Kunci SSH:** Tambahkan kunci publik Anda
    4. Klik **Create** dan catat alamat IP publiknya.

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

    `build-essential` diperlukan untuk kompilasi ARM pada beberapa dependensi.

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

    Saat diminta "How do you want to hatch your bot?", pilih **Lakukan nanti**.

  </Step>

  <Step title="Konfigurasikan Gateway">
    Gunakan autentikasi token dengan Tailscale Serve untuk akses jarak jauh yang aman.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/klien-lokal dari proksi Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute penampil diff tetap mempertahankan perilaku fail-closed dalam penyiapan ini: permintaan penampil `127.0.0.1` mentah tanpa header proksi terusan dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan penampil jarak jauh secara sengaja dan tetapkan `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan `baseUrl` proksi) jika Anda memerlukan tautan penampil yang dapat dibagikan.

  </Step>

  <Step title="Kunci keamanan VCN">
    Blokir semua lalu lintas kecuali Tailscale di tepi jaringan:

    1. Buka **Networking > Virtual Cloud Networks** di OCI Console.
    2. Klik VCN Anda, lalu **Security Lists > Default Security List**.
    3. **Hapus** semua aturan ingress kecuali `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Pertahankan aturan egress default (izinkan semua lalu lintas keluar).

    Ini memblokir SSH pada port 22, HTTP, HTTPS, dan semua yang lain di tepi jaringan. Mulai titik ini, Anda hanya dapat terhubung melalui Tailscale.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Akses UI Kontrol dari perangkat apa pun di tailnet Anda:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Ganti `<tailnet-name>` dengan nama tailnet Anda (terlihat di `tailscale status`).

  </Step>
</Steps>

## Verifikasi postur keamanan

Dengan VCN terkunci (hanya UDP 41641 terbuka) dan Gateway terikat ke loopback, lalu lintas publik diblokir di tepi jaringan dan akses admin hanya melalui tailnet. Ini menghilangkan kebutuhan atas beberapa langkah hardening VPS tradisional:

| Langkah tradisional     | Diperlukan?       | Alasan                                                                     |
| ----------------------- | ----------------- | -------------------------------------------------------------------------- |
| Firewall UFW            | Tidak             | VCN memblokir lalu lintas sebelum mencapai instance.                       |
| fail2ban                | Tidak             | Port 22 diblokir di VCN; tidak ada permukaan brute-force.                  |
| Hardening sshd          | Tidak             | SSH Tailscale tidak menggunakan sshd.                                      |
| Nonaktifkan login root  | Tidak             | Tailscale mengautentikasi berdasarkan identitas tailnet, bukan pengguna sistem. |
| Autentikasi khusus kunci SSH | Tidak        | Sama — identitas tailnet menggantikan kunci SSH sistem.                    |
| Hardening IPv6          | Biasanya tidak    | Bergantung pada pengaturan VCN/subnet; verifikasi apa yang benar-benar ditetapkan/terekspos. |

Tetap direkomendasikan:

- `chmod 700 ~/.openclaw` untuk membatasi izin file kredensial.
- `openclaw security audit` untuk pemeriksaan postur khusus OpenClaw.
- `sudo apt update && sudo apt upgrade` secara berkala untuk patch OS.
- Tinjau perangkat di [konsol admin Tailscale](https://login.tailscale.com/admin) secara berkala.

Perintah verifikasi cepat:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Catatan ARM

Tier Always Free menggunakan ARM (`aarch64`). Sebagian besar fitur OpenClaw berfungsi dengan baik; sejumlah kecil biner native memerlukan build ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript murni, tidak ada masalah.
- Sebagian besar paket npm dengan kode native: artefak `linux-arm64` pre-built tersedia.
- Pembantu CLI opsional (mis. biner Go/Rust yang dikirim oleh Skills): periksa apakah ada rilis `aarch64` / `linux-arm64` sebelum menginstal.

Verifikasi arsitektur dengan `uname -m` (seharusnya mencetak `aarch64`). Untuk biner tanpa build ARM, instal dari sumber atau lewati.

## Persistensi dan cadangan

State OpenClaw berada di bawah:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state saluran/penyedia, dan data sesi.
- `~/.openclaw/workspace/` — workspace agen (SOUL.md, memori, artefak).

Ini tetap ada setelah reboot. Untuk mengambil snapshot portabel:

```bash
openclaw backup create
```

## Fallback: tunnel SSH

Jika Tailscale Serve tidak berfungsi, gunakan tunnel SSH dari mesin lokal Anda:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Lalu buka `http://localhost:18789`.

## Pemecahan masalah

**Pembuatan instance gagal ("Out of capacity")** -- Instance ARM tier gratis populer. Coba domain ketersediaan lain atau coba lagi saat jam sepi.

**Tailscale tidak mau terhubung** -- Jalankan `sudo tailscale up --ssh --hostname=openclaw --reset` untuk mengautentikasi ulang.

**Gateway tidak mau mulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Masalah biner ARM** -- Sebagian besar paket npm berfungsi di ARM64. Untuk biner native, cari rilis `linux-arm64` atau `aarch64`. Verifikasi arsitektur dengan `uname -m`.

## Langkah berikutnya

- [Saluran](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Memperbarui](/id/install/updating) -- jaga OpenClaw tetap mutakhir

## Terkait

- [Ikhtisar instalasi](/id/install)
- [GCP](/id/install/gcp)
- [Hosting VPS](/id/vps)
