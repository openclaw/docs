---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan macOS utama Anda
    - Anda menginginkan integrasi iMessage di dalam sandbox
    - Anda menginginkan lingkungan macOS yang dapat diatur ulang dan dapat Anda kloning
    - Anda ingin membandingkan opsi VM macOS lokal vs yang dihosting
summary: Jalankan OpenClaw di VM macOS terisolasi (lokal atau di-host) saat Anda memerlukan isolasi atau iMessage
title: Mesin virtual macOS
x-i18n:
    generated_at: "2026-06-27T17:38:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Bawaan yang direkomendasikan (sebagian besar pengguna)

- **VPS Linux kecil** untuk Gateway yang selalu aktif dan biaya rendah. Lihat [hosting VPS](/id/vps).
- **Perangkat keras khusus** (Mac mini atau mesin Linux) jika Anda menginginkan kontrol penuh dan **IP residensial** untuk otomatisasi browser. Banyak situs memblokir IP pusat data, jadi penjelajahan lokal sering kali bekerja lebih baik.
- **Hibrida:** jalankan Gateway di VPS murah, lalu hubungkan Mac Anda sebagai **node** saat memerlukan otomatisasi browser/UI. Lihat [Node](/id/nodes) dan [Gateway jarak jauh](/id/gateway/remote).

Gunakan VM macOS saat Anda secara khusus membutuhkan kemampuan khusus macOS seperti iMessage atau menginginkan isolasi ketat dari Mac harian Anda.

## Opsi VM macOS

### VM lokal di Apple Silicon Mac Anda (Lume)

Jalankan OpenClaw dalam VM macOS tersandbox di Apple Silicon Mac yang sudah Anda miliki menggunakan [Lume](https://cua.ai/docs/lume).

Ini memberi Anda:

- Lingkungan macOS penuh dalam isolasi (host Anda tetap bersih)
- Dukungan iMessage melalui `imsg` (jalur lokal bawaan tidak mungkin di Linux/Windows)
- Reset instan dengan mengkloning VM
- Tanpa perangkat keras tambahan atau biaya cloud

### Penyedia Mac terhosting (cloud)

Jika Anda menginginkan macOS di cloud, penyedia Mac terhosting juga dapat digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac terhosting)
- Vendor Mac terhosting lainnya juga dapat digunakan; ikuti dokumentasi VM + SSH mereka

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

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia atau lebih baru pada host
- Ruang disk kosong ~60 GB per VM
- ~20 menit

---

## 1) Instal Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jika `~/.local/bin` tidak ada dalam PATH Anda:

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
Pengunduhan dapat memakan waktu tergantung koneksi Anda.
</Note>

---

## 3) Selesaikan Setup Assistant

Di jendela VNC:

1. Pilih bahasa dan wilayah
2. Lewati Apple ID (atau masuk jika Anda ingin iMessage nanti)
3. Buat akun pengguna (ingat nama pengguna dan kata sandinya)
4. Lewati semua fitur opsional

Setelah penyiapan selesai:

1. Aktifkan SSH: Buka System Settings -> General -> Sharing dan aktifkan "Remote Login".
2. Untuk penggunaan VM tanpa tampilan, aktifkan masuk otomatis: Buka System Settings -> Users & Groups, pilih "Automatically log in as:", lalu pilih pengguna VM.

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

Ini adalah fitur andalan dari menjalankan di macOS. Gunakan [iMessage](/id/channels/imessage) dengan `imsg` untuk menambahkan Messages ke OpenClaw.

Di dalam VM:

1. Masuk ke Messages.
2. Instal `imsg`.
3. Berikan izin Full Disk Access dan Automation untuk proses yang menjalankan OpenClaw/`imsg`.
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

Mulai ulang gateway. Sekarang agen Anda dapat mengirim dan menerima iMessages.

Detail penyiapan lengkap: [channel iMessage](/id/channels/imessage)

---

## Simpan image emas

Sebelum menyesuaikan lebih lanjut, buat snapshot status bersih Anda:

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

- Menjaga Mac Anda tetap terhubung ke daya
- Menonaktifkan tidur di System Settings → Energy Saver
- Menggunakan `caffeinate` jika perlu

Untuk benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/id/vps).

---

## Pemecahan masalah

| Masalah                         | Solusi                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tidak bisa SSH ke VM            | Periksa bahwa "Remote Login" diaktifkan di System Settings VM                                  |
| IP VM tidak muncul              | Tunggu sampai VM selesai boot, jalankan `lume get openclaw` lagi                               |
| Perintah Lume tidak ditemukan   | Tambahkan `~/.local/bin` ke PATH Anda                                                          |
| QR WhatsApp tidak dapat dipindai | Pastikan Anda masuk ke VM (bukan host) saat menjalankan `openclaw channels login`              |

---

## Dokumentasi terkait

- [hosting VPS](/id/vps)
- [Node](/id/nodes)
- [Gateway jarak jauh](/id/gateway/remote)
- [channel iMessage](/id/channels/imessage)
- [Quickstart Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referensi CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Penyiapan VM tanpa pengawasan](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (lanjutan)
- [Sandboxing Docker](/id/install/docker) (pendekatan isolasi alternatif)
