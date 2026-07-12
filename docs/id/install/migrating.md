---
read_when:
    - Anda memindahkan OpenClaw ke laptop atau server baru
    - Anda beralih dari sistem agen lain dan ingin mempertahankan status.
    - Anda sedang meningkatkan versi plugin yang sudah terpasang di lokasi yang sama
summary: 'Pusat migrasi: impor lintas sistem, pemindahan antarmesin, dan peningkatan Plugin'
title: Panduan migrasi
x-i18n:
    generated_at: "2026-07-12T14:19:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw mendukung tiga jalur migrasi: mengimpor dari sistem agen lain, memindahkan instalasi yang sudah ada ke mesin baru, dan meningkatkan Plugin di tempat.

## Impor dari sistem agen lain

Penyedia migrasi bawaan memasukkan instruksi, server MCP, Skills, konfigurasi model, dan kunci API (dengan persetujuan) ke OpenClaw. Rencana dipratinjau sebelum perubahan apa pun, rahasia disamarkan dalam laporan, dan penerapan didukung oleh cadangan yang telah diverifikasi.

<CardGroup cols={2}>
  <Card title="Bermigrasi dari Claude" href="/id/install/migrating-claude" icon="brain">
    Impor status Claude Code dan Claude Desktop, termasuk `CLAUDE.md`, server MCP, Skills, dan perintah proyek.
  </Card>
  <Card title="Bermigrasi dari Hermes" href="/id/install/migrating-hermes" icon="feather">
    Impor konfigurasi, penyedia, server MCP, memori, Skills, dan kunci `.env` yang didukung dari Hermes.
  </Card>
</CardGroup>

Titik masuk CLI adalah [`openclaw migrate`](/id/cli/migrate). Orientasi awal juga dapat menawarkan migrasi ketika mendeteksi sumber yang dikenal (`openclaw onboard --flow import`).

## Pindahkan OpenClaw ke mesin baru

Salin **direktori status** (`~/.openclaw/` secara default) dan **ruang kerja** Anda untuk mempertahankan:

- **Konfigurasi** — `openclaw.json` dan semua pengaturan Gateway.
- **Autentikasi** — `auth-profiles.json` per agen (kunci API beserta OAuth), serta status saluran atau penyedia apa pun di bawah `credentials/`.
- **Sesi** — riwayat percakapan dan status agen.
- **Status saluran** — info masuk WhatsApp, sesi Telegram, dan yang serupa.
- **Berkas ruang kerja** — `MEMORY.md`, `USER.md`, Skills, dan prompt.

<Tip>
Jalankan `openclaw status` pada mesin lama untuk mengonfirmasi jalur direktori status Anda. Profil khusus menggunakan `~/.openclaw-<profile>/` atau jalur yang ditetapkan melalui `OPENCLAW_STATE_DIR`.
</Tip>

### Langkah-langkah migrasi

<Steps>
  <Step title="Hentikan Gateway dan buat cadangan">
    Pada mesin **lama**, hentikan Gateway agar berkas tidak berubah saat penyalinan berlangsung, lalu arsipkan:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jika Anda menggunakan beberapa profil (misalnya `~/.openclaw-work`), arsipkan masing-masing secara terpisah.

  </Step>

  <Step title="Instal OpenClaw pada mesin baru">
    [Instal](/id/install) CLI (dan Node jika diperlukan) pada mesin baru. Tidak masalah jika orientasi awal membuat `~/.openclaw/` baru — Anda akan menimpanya pada langkah berikutnya.
  </Step>

  <Step title="Salin direktori status dan ruang kerja">
    Transfer arsip melalui `scp`, `rsync -a`, atau drive eksternal, lalu ekstrak:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Pastikan direktori tersembunyi telah disertakan dan kepemilikan berkas sesuai dengan pengguna yang akan menjalankan Gateway.

  </Step>

  <Step title="Jalankan Doctor dan verifikasi">
    Pada mesin baru, jalankan [Doctor](/id/gateway/doctor) untuk menerapkan migrasi konfigurasi dan memperbaiki layanan:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Jika Telegram atau Discord menggunakan fallback lingkungan default (`TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN`), pastikan `.env` dalam direktori status yang dimigrasikan berisi kunci tersebut tanpa mencetak nilai rahasianya:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` juga memperingatkan ketika akun Telegram atau Discord default yang diaktifkan tidak memiliki token yang dikonfigurasi dan variabel lingkungan yang sesuai tidak tersedia bagi proses Doctor.

### Kendala umum

<AccordionGroup>
  <Accordion title="Ketidakcocokan profil atau direktori status">
    Jika Gateway lama menggunakan `--profile` atau `OPENCLAW_STATE_DIR`, sedangkan yang baru tidak, saluran akan tampak keluar dari akun dan sesi akan kosong. Jalankan Gateway dengan profil atau direktori status yang **sama** dengan yang Anda migrasikan, lalu jalankan kembali `openclaw doctor`.
  </Accordion>

  <Accordion title="Hanya menyalin openclaw.json">
    Berkas konfigurasi saja tidak cukup. Profil autentikasi model berada di bawah `agents/<agentId>/agent/auth-profiles.json`, sedangkan status saluran dan penyedia berada di bawah `credentials/`. Selalu migrasikan **seluruh** direktori status.
  </Accordion>

  <Accordion title="Izin dan kepemilikan">
    Jika Anda menyalin sebagai root atau berganti pengguna, Gateway mungkin gagal membaca kredensial. Pastikan direktori status dan ruang kerja dimiliki oleh pengguna yang menjalankan Gateway.
  </Accordion>

  <Accordion title="Mode jarak jauh">
    Jika UI Anda mengarah ke Gateway **jarak jauh**, host jarak jauh tersebut memiliki sesi dan ruang kerja. Migrasikan host Gateway itu sendiri, bukan laptop lokal Anda. Lihat [Tanya Jawab](/id/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Rahasia dalam cadangan">
    Direktori status berisi profil autentikasi, kredensial saluran, dan status penyedia lainnya. Simpan cadangan dalam keadaan terenkripsi, hindari saluran transfer yang tidak aman, dan rotasi kunci jika Anda mencurigai adanya kebocoran.
  </Accordion>
</AccordionGroup>

### Daftar periksa verifikasi

Pada mesin baru, pastikan:

- [ ] `openclaw status` menunjukkan Gateway sedang berjalan.
- [ ] Saluran masih terhubung (tidak perlu memasangkan ulang).
- [ ] Dasbor terbuka dan menampilkan sesi yang sudah ada.
- [ ] Berkas ruang kerja (memori, konfigurasi) tersedia.

## Tingkatkan Plugin di tempat

Peningkatan Plugin di tempat mempertahankan ID Plugin dan kunci konfigurasi yang sama, tetapi dapat memindahkan status pada disk ke tata letak saat ini. Panduan peningkatan khusus Plugin tersedia bersama salurannya:

- [Migrasi Matrix](/id/channels/matrix-migration): batas pemulihan status terenkripsi, perilaku snapshot otomatis, dan perintah pemulihan manual.

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI untuk impor lintas sistem.
- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kondisi setelah migrasi.
- [Penghapusan instalasi](/id/install/uninstall): menghapus OpenClaw secara bersih.
