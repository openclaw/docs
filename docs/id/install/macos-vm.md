---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan macOS utama Anda
    - Anda menginginkan integrasi iMessage (BlueBubbles) di lingkungan terisolasi
    - Anda menginginkan lingkungan macOS yang dapat diatur ulang dan dapat dikloning
    - Anda ingin membandingkan opsi VM macOS lokal dan yang di-host
summary: Jalankan OpenClaw di VM macOS yang terisolasi dalam sandbox (lokal atau dihosting) saat Anda memerlukan isolasi atau iMessage
title: Mesin virtual macOS
x-i18n:
    generated_at: "2026-05-06T09:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Default yang direkomendasikan (sebagian besar pengguna)

- **VPS Linux kecil** untuk Gateway yang selalu aktif dan biaya rendah. Lihat [hosting VPS](/id/vps).
- **Perangkat keras khusus** (Mac mini atau kotak Linux) jika Anda menginginkan kontrol penuh dan **IP residensial** untuk otomatisasi browser. Banyak situs memblokir IP pusat data, jadi penelusuran lokal sering bekerja lebih baik.
- **Hibrida:** tetap jalankan Gateway di VPS murah, dan hubungkan Mac Anda sebagai **Node** saat Anda membutuhkan otomatisasi browser/UI. Lihat [Node](/id/nodes) dan [Gateway jarak jauh](/id/gateway/remote).

Gunakan VM macOS saat Anda secara khusus membutuhkan kemampuan yang hanya tersedia di macOS (iMessage/BlueBubbles) atau menginginkan isolasi ketat dari Mac harian Anda.

## Opsi VM macOS

### VM lokal di Apple Silicon Mac Anda (Lume)

Jalankan OpenClaw dalam VM macOS tersandbox di Apple Silicon Mac yang sudah Anda miliki menggunakan [Lume](https://cua.ai/docs/lume).

Ini memberi Anda:

- Lingkungan macOS penuh dalam isolasi (host Anda tetap bersih)
- Dukungan iMessage melalui BlueBubbles (mustahil di Linux/Windows)
- Reset instan dengan mengkloning VM
- Tanpa perangkat keras tambahan atau biaya cloud

### Penyedia Mac ter-hosting (cloud)

Jika Anda menginginkan macOS di cloud, penyedia Mac ter-hosting juga dapat digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac ter-hosting)
- Vendor Mac ter-hosting lainnya juga dapat digunakan; ikuti dokumentasi VM + SSH mereka

Setelah Anda memiliki akses SSH ke VM macOS, lanjutkan ke langkah 6 di bawah.

---

## Jalur cepat (Lume, pengguna berpengalaman)

1. Instal Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Selesaikan Asisten Pengaturan, aktifkan Login Jarak Jauh (SSH)
4. `lume run openclaw --no-display`
5. Masuk melalui SSH, instal OpenClaw, konfigurasikan channel
6. Selesai

---

## Yang Anda butuhkan (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia atau lebih baru di host
- Ruang disk kosong ~60 GB per VM
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
Pengunduhan dapat memakan waktu tergantung pada koneksi Anda.
</Note>

---

## 3) Selesaikan Asisten Pengaturan

Di jendela VNC:

1. Pilih bahasa dan wilayah
2. Lewati Apple ID (atau masuk jika Anda ingin menggunakan iMessage nanti)
3. Buat akun pengguna (ingat nama pengguna dan kata sandinya)
4. Lewati semua fitur opsional

Setelah penyiapan selesai, aktifkan SSH:

1. Buka Pengaturan Sistem → Umum → Berbagi
2. Aktifkan "Login Jarak Jauh"

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

Lalu masuk ke WhatsApp (pindai QR):

```bash
openclaw channels login
```

---

## 8) Jalankan VM tanpa layar

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

Ini adalah fitur unggulan dari menjalankan di macOS. Gunakan [BlueBubbles](https://bluebubbles.app) untuk menambahkan iMessage ke OpenClaw.

Di dalam VM:

1. Unduh BlueBubbles dari bluebubbles.app
2. Masuk dengan Apple ID Anda
3. Aktifkan Web API dan atur kata sandi
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

## Simpan citra emas

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

## Menjalankan 24/7

Jaga VM tetap berjalan dengan:

- Menjaga Mac Anda tetap tersambung ke daya
- Menonaktifkan tidur di Pengaturan Sistem → Penghemat Energi
- Menggunakan `caffeinate` jika diperlukan

Untuk benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/id/vps).

---

## Pemecahan masalah

| Masalah                  | Solusi                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Tidak bisa SSH ke VM        | Pastikan "Login Jarak Jauh" diaktifkan di Pengaturan Sistem VM                            |
| IP VM tidak muncul        | Tunggu hingga VM selesai booting sepenuhnya, jalankan `lume get openclaw` lagi                           |
| Perintah Lume tidak ditemukan   | Tambahkan `~/.local/bin` ke PATH Anda                                                    |
| QR WhatsApp tidak terpindai | Pastikan Anda masuk ke VM (bukan host) saat menjalankan `openclaw channels login` |

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
