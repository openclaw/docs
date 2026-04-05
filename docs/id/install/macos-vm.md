---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan macOS utama Anda
    - Anda menginginkan integrasi iMessage (BlueBubbles) dalam sandbox
    - Anda menginginkan lingkungan macOS yang dapat di-reset dan dapat Anda clone
    - Anda ingin membandingkan opsi macOS VM lokal vs hosted
summary: Jalankan OpenClaw di macOS VM yang tersandbox (lokal atau hosted) saat Anda memerlukan isolasi atau iMessage
title: macOS VM
x-i18n:
    generated_at: "2026-04-05T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw di macOS VM (Sandboxing)

## Default yang direkomendasikan (sebagian besar pengguna)

- **Linux VPS kecil** untuk Gateway yang selalu aktif dan biaya rendah. Lihat [hosting VPS](/vps).
- **Perangkat keras khusus** (Mac mini atau kotak Linux) jika Anda menginginkan kontrol penuh dan **IP residensial** untuk otomasi browser. Banyak situs memblokir IP pusat data, jadi browsing lokal sering kali bekerja lebih baik.
- **Hybrid:** simpan Gateway di VPS murah, lalu hubungkan Mac Anda sebagai **node** saat Anda memerlukan otomasi browser/UI. Lihat [Nodes](/nodes) dan [Gateway remote](/id/gateway/remote).

Gunakan macOS VM saat Anda secara khusus memerlukan kemampuan khusus macOS (iMessage/BlueBubbles) atau menginginkan isolasi ketat dari Mac harian Anda.

## Opsi macOS VM

### VM lokal di Apple Silicon Mac Anda (Lume)

Jalankan OpenClaw di macOS VM yang tersandbox pada Apple Silicon Mac Anda saat ini menggunakan [Lume](https://cua.ai/docs/lume).

Ini memberi Anda:

- Lingkungan macOS lengkap dalam isolasi (host Anda tetap bersih)
- Dukungan iMessage melalui BlueBubbles (mustahil di Linux/Windows)
- Reset instan dengan melakukan clone VM
- Tanpa biaya perangkat keras tambahan atau cloud

### Provider Mac hosted (cloud)

Jika Anda menginginkan macOS di cloud, provider Mac hosted juga bisa digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac hosted)
- Vendor Mac hosted lain juga bisa digunakan; ikuti dokumentasi VM + SSH mereka

Setelah Anda memiliki akses SSH ke macOS VM, lanjutkan ke langkah 6 di bawah.

---

## Jalur cepat (Lume, pengguna berpengalaman)

1. Pasang Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Selesaikan Setup Assistant, aktifkan Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH masuk, pasang OpenClaw, konfigurasikan channel
6. Selesai

---

## Yang Anda butuhkan (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia atau yang lebih baru di host
- ~60 GB ruang disk kosong per VM
- ~20 menit

---

## 1) Pasang Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jika `~/.local/bin` belum ada di PATH Anda:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifikasi:

```bash
lume --version
```

Dokumentasi: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Buat macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Ini mengunduh macOS dan membuat VM. Jendela VNC akan terbuka secara otomatis.

Catatan: Unduhan dapat memakan waktu cukup lama tergantung koneksi Anda.

---

## 3) Selesaikan Setup Assistant

Di jendela VNC:

1. Pilih bahasa dan region
2. Lewati Apple ID (atau masuk jika Anda menginginkan iMessage nanti)
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

Cari alamat IP-nya (biasanya `192.168.64.x`).

---

## 5) SSH ke VM

```bash
ssh youruser@192.168.64.X
```

Ganti `youruser` dengan akun yang Anda buat, dan IP dengan IP VM Anda.

---

## 6) Pasang OpenClaw

Di dalam VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Ikuti prompt onboarding untuk menyiapkan provider model Anda (Anthropic, OpenAI, dll.).

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

Hentikan VM lalu jalankan ulang tanpa tampilan:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM berjalan di latar belakang. daemon OpenClaw menjaga gateway tetap berjalan.

Untuk memeriksa status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrasi iMessage

Inilah fitur utama menjalankan di macOS. Gunakan [BlueBubbles](https://bluebubbles.app) untuk menambahkan iMessage ke OpenClaw.

Di dalam VM:

1. Unduh BlueBubbles dari bluebubbles.app
2. Masuk dengan Apple ID Anda
3. Aktifkan Web API dan setel kata sandi
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

## Simpan golden image

Sebelum menyesuaikan lebih jauh, ambil snapshot state bersih Anda:

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

## Menjalankan 24/7

Jaga VM tetap berjalan dengan:

- Menjaga Mac Anda tetap terhubung ke daya
- Menonaktifkan mode tidur di System Settings → Energy Saver
- Menggunakan `caffeinate` jika diperlukan

Untuk benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/vps).

---

## Pemecahan masalah

| Masalah                  | Solusi                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| Tidak bisa SSH ke VM     | Periksa bahwa "Remote Login" diaktifkan di System Settings VM          |
| IP VM tidak muncul       | Tunggu sampai VM selesai boot, lalu jalankan `lume get openclaw` lagi  |
| Perintah Lume tidak ditemukan | Tambahkan `~/.local/bin` ke PATH Anda                            |
| QR WhatsApp tidak bisa dipindai | Pastikan Anda login ke VM (bukan host) saat menjalankan `openclaw channels login` |

---

## Dokumentasi terkait

- [hosting VPS](/vps)
- [Nodes](/nodes)
- [Gateway remote](/id/gateway/remote)
- [channel BlueBubbles](/id/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (lanjutan)
- [Docker Sandboxing](/install/docker) (pendekatan isolasi alternatif)
