---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan macOS utama Anda
    - Anda menginginkan integrasi iMessage dalam sandbox
    - Anda menginginkan lingkungan macOS yang dapat direset dan dikloning
    - Anda ingin membandingkan opsi VM macOS lokal vs terhosting
summary: Jalankan OpenClaw di VM macOS yang berada dalam sandbox (lokal atau dihosting) saat Anda memerlukan isolasi atau iMessage
title: Mesin virtual macOS
x-i18n:
    generated_at: "2026-05-10T19:40:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Default yang direkomendasikan (sebagian besar pengguna)

- **VPS Linux kecil** untuk Gateway yang selalu aktif dan biaya rendah. Lihat [hosting VPS](/id/vps).
- **Perangkat keras khusus** (Mac mini atau mesin Linux) jika Anda menginginkan kontrol penuh dan **IP residensial** untuk otomatisasi browser. Banyak situs memblokir IP pusat data, sehingga penjelajahan lokal sering kali bekerja lebih baik.
- **Hibrida:** pertahankan Gateway di VPS murah, dan hubungkan Mac Anda sebagai **Node** saat Anda memerlukan otomatisasi browser/UI. Lihat [Node](/id/nodes) dan [Gateway jarak jauh](/id/gateway/remote).

Gunakan VM macOS saat Anda secara khusus memerlukan kemampuan khusus macOS seperti iMessage atau menginginkan isolasi ketat dari Mac harian Anda.

## Opsi VM macOS

### VM lokal di Apple Silicon Mac Anda (Lume)

Jalankan OpenClaw di VM macOS tersandbox pada Apple Silicon Mac yang sudah Anda miliki menggunakan [Lume](https://cua.ai/docs/lume).

Ini memberi Anda:

- Lingkungan macOS penuh dalam isolasi (host Anda tetap bersih)
- Dukungan iMessage melalui `imsg` (jalur lokal default tidak mungkin di Linux/Windows)
- Reset instan dengan mengkloning VM
- Tanpa perangkat keras tambahan atau biaya cloud

### Penyedia Mac terhosting (cloud)

Jika Anda menginginkan macOS di cloud, penyedia Mac terhosting juga bisa digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac terhosting)
- Vendor Mac terhosting lainnya juga bisa digunakan; ikuti dokumentasi VM + SSH mereka

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

## Yang Anda perlukan (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia atau yang lebih baru di host
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
Pengunduhan bisa memakan waktu, tergantung koneksi Anda.
</Note>

---

## 3) Selesaikan Asisten Pengaturan

Di jendela VNC:

1. Pilih bahasa dan wilayah
2. Lewati Apple ID (atau masuk jika Anda ingin iMessage nanti)
3. Buat akun pengguna (ingat nama pengguna dan kata sandinya)
4. Lewati semua fitur opsional

Setelah pengaturan selesai, aktifkan SSH:

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

VM berjalan di latar belakang. Daemon OpenClaw menjaga Gateway tetap berjalan.

Untuk memeriksa status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integrasi iMessage

Ini adalah fitur unggulan dari menjalankan di macOS. Gunakan [iMessage](/id/channels/imessage) dengan `imsg` untuk menambahkan Messages ke OpenClaw.

Di dalam VM:

1. Masuk ke Messages.
2. Instal `imsg`.
3. Berikan izin Akses Disk Penuh dan Otomatisasi untuk proses yang menjalankan OpenClaw/`imsg`.
4. Verifikasi dukungan RPC dengan `imsg rpc --help`.

Tambahkan ke konfigurasi OpenClaw Anda:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Mulai ulang Gateway. Kini agen Anda dapat mengirim dan menerima iMessage.

Detail penyiapan lengkap: [channel iMessage](/id/channels/imessage)

---

## Simpan citra emas

Sebelum menyesuaikan lebih lanjut, buat snapshot dari status bersih Anda:

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

Jaga VM tetap berjalan dengan:

- Menjaga Mac Anda tetap tersambung ke daya
- Menonaktifkan tidur di Pengaturan Sistem → Penghemat Energi
- Menggunakan `caffeinate` jika diperlukan

Untuk benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/id/vps).

---

## Pemecahan masalah

| Masalah                  | Solusi                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Tidak dapat SSH ke VM        | Periksa bahwa "Login Jarak Jauh" diaktifkan di Pengaturan Sistem VM                            |
| IP VM tidak muncul        | Tunggu hingga VM selesai boot sepenuhnya, jalankan `lume get openclaw` lagi                           |
| Perintah Lume tidak ditemukan   | Tambahkan `~/.local/bin` ke PATH Anda                                                    |
| QR WhatsApp tidak terpindai | Pastikan Anda login ke VM (bukan host) saat menjalankan `openclaw channels login` |

---

## Dokumentasi terkait

- [hosting VPS](/id/vps)
- [Node](/id/nodes)
- [Gateway jarak jauh](/id/gateway/remote)
- [channel iMessage](/id/channels/imessage)
- [Mulai Cepat Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referensi CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Penyiapan VM Tanpa Pengawasan](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (lanjutan)
- [Sandboxing Docker](/id/install/docker) (pendekatan isolasi alternatif)
