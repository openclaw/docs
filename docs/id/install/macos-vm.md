---
read_when:
    - Anda ingin OpenClaw terisolasi dari lingkungan utama macOS Anda
    - Anda menginginkan integrasi iMessage dalam sandbox
    - Anda menginginkan lingkungan macOS yang dapat diatur ulang dan dikloning
    - Anda ingin membandingkan opsi VM macOS lokal dengan yang dihosting
summary: Jalankan OpenClaw di VM macOS yang di-sandbox (lokal atau dihosting) saat Anda memerlukan isolasi atau iMessage
title: VM macOS
x-i18n:
    generated_at: "2026-07-12T14:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Default yang disarankan (sebagian besar pengguna)

- **VPS Linux kecil** untuk Gateway yang selalu aktif dengan biaya rendah. Lihat [hosting VPS](/id/vps).
- **Perangkat keras khusus** (Mac mini atau mesin Linux) jika Anda menginginkan kendali penuh dan **IP residensial** untuk otomatisasi peramban. Banyak situs memblokir IP pusat data, sehingga penelusuran lokal sering kali bekerja lebih baik.
- **Hibrida**: jalankan Gateway di VPS murah, lalu hubungkan Mac Anda sebagai **node** saat memerlukan otomatisasi peramban/UI. Lihat [Node](/id/nodes) dan [Gateway jarak jauh](/id/gateway/remote).

Gunakan VM macOS hanya jika Anda secara khusus memerlukan kemampuan yang hanya tersedia di macOS seperti iMessage, atau menginginkan isolasi ketat dari Mac yang Anda gunakan sehari-hari.

## Opsi VM macOS

### VM lokal di Mac Apple Silicon Anda (Lume)

Jalankan OpenClaw dalam VM macOS yang terisolasi di Mac Apple Silicon Anda menggunakan [Lume](https://cua.ai/docs/lume). Ini memberi Anda:

- Lingkungan macOS lengkap yang terisolasi (host Anda tetap bersih)
- Dukungan iMessage melalui `imsg`; jalur lokal default tidak dapat digunakan di Linux/Windows
- Pengaturan ulang instan dengan mengkloning VM
- Tanpa biaya perangkat keras atau cloud tambahan

### Penyedia Mac terkelola (cloud)

Jika Anda menginginkan macOS di cloud, penyedia Mac terkelola juga dapat digunakan:

- [MacStadium](https://www.macstadium.com/) (Mac terkelola)
- Penyedia Mac terkelola lainnya juga dapat digunakan; ikuti dokumentasi VM + SSH mereka

Setelah memiliki akses SSH ke VM macOS, lanjutkan ke [Instal OpenClaw](#6-install-openclaw) di bawah.

## Jalur cepat (Lume, pengguna berpengalaman)

1. Instal Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Selesaikan Setup Assistant, lalu aktifkan Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Masuk melalui SSH, instal OpenClaw, lalu konfigurasikan kanal.
6. Selesai.

## Yang Anda perlukan (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia atau versi lebih baru pada host
- Ruang disk kosong sekitar 60 GB per VM
- Sekitar 20 menit

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

## 2) Buat VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Perintah ini mengunduh macOS dan membuat VM. Jendela VNC akan terbuka secara otomatis.

<Note>
Pengunduhan mungkin memerlukan waktu, tergantung pada koneksi Anda.
</Note>

## 3) Selesaikan Setup Assistant

Di jendela VNC:

1. Pilih bahasa dan wilayah.
2. Lewati Apple ID (atau masuk jika Anda ingin menggunakan iMessage nanti).
3. Buat akun pengguna (ingat nama pengguna dan kata sandinya).
4. Lewati semua fitur opsional.

Setelah penyiapan selesai:

1. Aktifkan SSH: System Settings -> General -> Sharing, lalu aktifkan "Remote Login".
2. Untuk menggunakan VM tanpa tampilan, aktifkan masuk otomatis: System Settings -> Users & Groups, pilih "Automatically log in as:", lalu pilih pengguna VM.

## 4) Dapatkan alamat IP VM

```bash
lume get openclaw
```

Cari alamat IP (biasanya `192.168.64.x`).

## 5) Masuk ke VM melalui SSH

```bash
ssh youruser@192.168.64.X
```

Ganti `youruser` dengan akun yang Anda buat dan IP tersebut dengan IP VM Anda.

## 6) Instal OpenClaw

Di dalam VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Ikuti petunjuk orientasi untuk menyiapkan penyedia model Anda (Anthropic, OpenAI, dan lainnya).

## 7) Konfigurasikan kanal

Edit file konfigurasi:

```bash
nano ~/.openclaw/openclaw.json
```

Tambahkan kanal Anda:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Kemudian masuk ke WhatsApp (pindai kode QR):

```bash
openclaw channels login
```

## 8) Jalankan VM tanpa tampilan

Hentikan VM dan mulai ulang tanpa tampilan:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM berjalan di latar belakang; daemon OpenClaw menjaga Gateway tetap berjalan. Untuk memeriksa status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Bonus: integrasi iMessage

Ini adalah fitur unggulan menjalankan OpenClaw di macOS. Gunakan [iMessage](/id/channels/imessage) dengan `imsg` untuk menambahkan Messages ke OpenClaw.

Di dalam VM:

1. Masuk ke Messages.
2. Instal `imsg`.
3. Berikan izin Full Disk Access dan Automation kepada proses yang menjalankan OpenClaw/`imsg`.
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

Mulai ulang Gateway. Agen Anda kini dapat mengirim dan menerima iMessage. Detail penyiapan lengkap: [kanal iMessage](/id/channels/imessage).

## Simpan citra induk

Sebelum melakukan penyesuaian lebih lanjut, buat snapshot dari kondisi bersih Anda:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Atur ulang kapan saja:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Menjalankan 24/7

Jaga agar VM tetap berjalan dengan:

- Menjaga Mac Anda tetap terhubung ke daya
- Menonaktifkan mode tidur di System Settings -> Energy Saver
- Menggunakan `caffeinate` jika diperlukan

Agar benar-benar selalu aktif, pertimbangkan Mac mini khusus atau VPS kecil. Lihat [hosting VPS](/id/vps).

## Pemecahan masalah

| Masalah                       | Solusi                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tidak dapat masuk ke VM via SSH | Pastikan "Remote Login" diaktifkan di System Settings VM                                                    |
| IP VM tidak muncul            | Tunggu hingga VM selesai melakukan boot, lalu jalankan kembali `lume get openclaw`                           |
| Perintah Lume tidak ditemukan | Tambahkan `~/.local/bin` ke PATH Anda                                                                        |
| QR WhatsApp tidak dapat dipindai | Pastikan Anda masuk ke VM (bukan host) saat menjalankan `openclaw channels login`                            |

## Dokumentasi terkait

- [Hosting VPS](/id/vps)
- [Node](/id/nodes)
- [Gateway jarak jauh](/id/gateway/remote)
- [Kanal iMessage](/id/channels/imessage)
- [Panduan mulai cepat Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referensi CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Penyiapan VM tanpa pengawasan](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (lanjutan)
- [Sandboxing Docker](/id/install/docker) (pendekatan isolasi alternatif)
