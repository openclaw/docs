---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan macOS utama Anda
    - Anda ingin integrasi iMessage (BlueBubbles) dalam lingkungan terisolasi
    - Anda menginginkan lingkungan macOS yang dapat diatur ulang dan dapat Anda kloning
    - Anda ingin membandingkan opsi VM macOS lokal dan yang di-hosting
summary: Jalankan OpenClaw di VM macOS dalam sandbox (lokal atau dihosting) saat Anda memerlukan isolasi atau iMessage
title: Mesin virtual macOS
x-i18n:
    generated_at: "2026-04-30T09:56:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw di VM macOS (Sandboxing)

## Default yang direkomendasikan (sebagian besar pengguna)

- **VPS Linux kecil** untuk Gateway yang selalu aktif dan biaya rendah. Lihat [hosting VPS](/id/vps).
- **Perangkat keras khusus** (Mac mini atau mesin Linux) jika Anda menginginkan kendali penuh dan **IP residensial** untuk otomasi browser. Banyak situs memblokir IP pusat data, jadi penelusuran lokal sering bekerja lebih baik.
- **Hibrida:** pertahankan Gateway di VPS murah, dan hubungkan Mac Anda sebagai **node** saat Anda memerlukan otomasi browser/UI. Lihat [Node](/id/nodes) dan [Gateway jarak jauh](/id/gateway/remote).

Gunakan VM macOS saat Anda secara khusus memerlukan kemampuan khusus macOS (iMessage/BlueBubbles) atau menginginkan isolasi ketat dari Mac harian Anda.

## Opsi VM macOS

### VM lokal di Mac Apple Silicon Anda (Lume)

Jalankan OpenClaw di VM macOS tersandbox pada Mac Apple Silicon Anda yang sudah ada menggunakan [Lume](https://cua.ai/docs/lume).

Ini memberi Anda:

- Lingkungan macOS penuh dalam isolasi (host Anda tetap bersih)
- Dukungan iMessage melalui BlueBubbles (mustahil di Linux/Windows)
- Reset instan dengan mengkloning VM
- Tanpa perangkat keras tambahan atau biaya cloud

### Penyedia Mac ter-hosting (cloud)

Jika Anda menginginkan macOS di cloud, penyedia Mac ter-hosting juga bisa digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac ter-hosting)
- Vendor Mac ter-hosting lain juga bisa digunakan; ikuti dokumentasi VM + SSH mereka

Setelah Anda memiliki akses SSH ke VM macOS, lanjutkan ke langkah 6 di bawah.

---

## Jalur cepat (Lume, pengguna berpengalaman)

1. Instal Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Selesaikan Setup Assistant, aktifkan Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Masuk lewat SSH, instal OpenClaw, konfigurasikan channel
6. Selesai

---

## Yang Anda perlukan (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia atau yang lebih baru di host
- ~60 GB ruang disk kosong per VM
- ~20 menit

---

## 1) Instal Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jika `~/.local/bin` tidak ada di PATH Anda:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifikasi:

```bash
lume --version
```

Dokumentasi: [Instalasi Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Buat VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Ini mengunduh macOS dan membuat VM. Jendela VNC terbuka secara otomatis.

<Note>
Pengunduhan bisa memakan waktu tergantung koneksi Anda.
</Note>

---

## 3) Selesaikan Setup Assistant

Di jendela VNC:

1. Pilih bahasa dan wilayah
2. Lewati Apple ID (atau masuk jika Anda ingin iMessage nanti)
3. Buat akun pengguna (ingat nama pengguna dan kata sandinya)
4. Lewati semua fitur opsional

Setelah penyiapan selesai, aktifkan SSH:

1. Buka System Settings → General → Sharing
2. Aktifkan "Remote Login"

---

## 4) Dapatkan alamat IP VM

```bash
lume get openclaw
```

Cari alamat IP (biasanya `192.168.64.x`).

---

## 5) SSH ke VM

```bash
ssh youruser@192.168.64.X
```

Ganti `youruser` dengan akun yang Anda buat, dan IP dengan IP VM Anda.

---

## 6) Instal OpenClaw

Di dalam VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Ikuti prompt onboarding untuk menyiapkan penyedia model Anda (Anthropic, OpenAI, dll.).

---

## 7) Konfigurasikan channel

Edit file konfigurasi:

```bash
nano ~/.openclaw/openclaw.json
```

Tambahkan channel Anda:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Lalu login ke WhatsApp (pindai QR):

```bash
openclaw channels login
```

---

## 8) Jalankan VM tanpa tampilan

Hentikan VM dan mulai ulang tanpa tampilan:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM berjalan di latar belakang. Daemon OpenClaw menjaga gateway tetap berjalan.

Untuk memeriksa status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrasi iMessage

Ini adalah fitur utama dari menjalankan di macOS. Gunakan [BlueBubbles](https://bluebubbles.app) untuk menambahkan iMessage ke OpenClaw.

Di dalam VM:

1. Unduh BlueBubbles dari bluebubbles.app
2. Masuk dengan Apple ID Anda
3. Aktifkan Web API dan tetapkan kata sandi
4. Arahkan webhook BlueBubbles ke gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Tambahkan ke konfigurasi OpenClaw Anda:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Mulai ulang gateway. Sekarang agen Anda dapat mengirim dan menerima iMessage.

Detail penyiapan lengkap: [channel BlueBubbles](/id/channels/bluebubbles)

---

## Simpan image emas

Sebelum menyesuaikan lebih lanjut, buat snapshot kondisi bersih Anda:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Reset kapan saja:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Berjalan 24/7

Pertahankan VM tetap berjalan dengan:

- Menjaga Mac Anda tetap tersambung ke daya
- Menonaktifkan tidur di System Settings → Energy Saver
- Menggunakan `caffeinate` jika diperlukan

Untuk yang benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/id/vps).

---

## Pemecahan masalah

| Masalah                  | Solusi                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Tidak bisa SSH ke VM        | Pastikan "Remote Login" diaktifkan di System Settings VM                            |
| IP VM tidak muncul        | Tunggu hingga VM selesai booting, jalankan `lume get openclaw` lagi                           |
| Perintah Lume tidak ditemukan   | Tambahkan `~/.local/bin` ke PATH Anda                                                    |
| QR WhatsApp tidak terpindai | Pastikan Anda login ke VM (bukan host) saat menjalankan `openclaw channels login` |

---

## Dokumentasi terkait

- [hosting VPS](/id/vps)
- [Node](/id/nodes)
- [Gateway jarak jauh](/id/gateway/remote)
- [channel BlueBubbles](/id/channels/bluebubbles)
- [Mulai Cepat Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referensi CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Penyiapan VM Tanpa Pengawasan](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (lanjutan)
- [Sandboxing Docker](/id/install/docker) (pendekatan isolasi alternatif)
