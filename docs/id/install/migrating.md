---
read_when:
    - Anda sedang memindahkan OpenClaw ke laptop atau server baru
    - Anda berasal dari sistem agen lain dan ingin mempertahankan status
    - Anda sedang memutakhirkan Plugin di tempat
summary: 'Pusat migrasi: impor lintas sistem, pemindahan antar mesin, dan peningkatan Plugin'
title: Panduan migrasi
x-i18n:
    generated_at: "2026-04-30T09:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw mendukung tiga jalur migrasi: mengimpor dari sistem agen lain, memindahkan instalasi yang sudah ada ke mesin baru, dan memutakhirkan Plugin di tempat.

## Impor dari sistem agen lain

Gunakan penyedia migrasi bawaan untuk membawa instruksi, server MCP, Skills, konfigurasi model, dan kunci API (opsional) ke OpenClaw. Rencana dipratinjau sebelum perubahan apa pun, rahasia disamarkan dalam laporan, dan penerapan didukung oleh cadangan terverifikasi.

<CardGroup cols={2}>
  <Card title="Bermigrasi dari Claude" href="/id/install/migrating-claude" icon="brain">
    Impor status Claude Code dan Claude Desktop, termasuk `CLAUDE.md`, server MCP, Skills, dan perintah proyek.
  </Card>
  <Card title="Bermigrasi dari Hermes" href="/id/install/migrating-hermes" icon="feather">
    Impor konfigurasi Hermes, penyedia, server MCP, memori, Skills, dan kunci `.env` yang didukung.
  </Card>
</CardGroup>

Titik masuk CLI adalah [`openclaw migrate`](/id/cli/migrate). Penyiapan awal juga dapat menawarkan migrasi saat mendeteksi sumber yang dikenal (`openclaw onboard --flow import`).

## Pindahkan OpenClaw ke mesin baru

Salin **direktori status** (`~/.openclaw/` secara default) dan **ruang kerja** Anda untuk mempertahankan:

- **Konfigurasi** — `openclaw.json` dan semua pengaturan Gateway.
- **Autentikasi** — `auth-profiles.json` per agen (kunci API plus OAuth), serta status kanal atau penyedia apa pun di bawah `credentials/`.
- **Sesi** — riwayat percakapan dan status agen.
- **Status kanal** — login WhatsApp, sesi Telegram, dan sejenisnya.
- **File ruang kerja** — `MEMORY.md`, `USER.md`, Skills, dan prompt.

<Tip>
Jalankan `openclaw status` di mesin lama untuk mengonfirmasi jalur direktori status Anda. Profil khusus menggunakan `~/.openclaw-<profile>/` atau jalur yang ditetapkan melalui `OPENCLAW_STATE_DIR`.
</Tip>

### Langkah migrasi

<Steps>
  <Step title="Hentikan gateway dan buat cadangan">
    Di mesin **lama**, hentikan gateway agar file tidak berubah di tengah proses penyalinan, lalu arsipkan:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jika Anda menggunakan beberapa profil (misalnya `~/.openclaw-work`), arsipkan masing-masing secara terpisah.

  </Step>

  <Step title="Instal OpenClaw di mesin baru">
    [Instal](/id/install) CLI (dan Node jika diperlukan) di mesin baru. Tidak masalah jika penyiapan awal membuat `~/.openclaw/` baru. Anda akan menimpanya berikutnya.
  </Step>

  <Step title="Salin direktori status dan ruang kerja">
    Transfer arsip melalui `scp`, `rsync -a`, atau drive eksternal, lalu ekstrak:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Pastikan direktori tersembunyi disertakan dan kepemilikan file cocok dengan pengguna yang akan menjalankan gateway.

  </Step>

  <Step title="Jalankan doctor dan verifikasi">
    Di mesin baru, jalankan [Doctor](/id/gateway/doctor) untuk menerapkan migrasi konfigurasi dan memperbaiki layanan:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Kendala umum

<AccordionGroup>
  <Accordion title="Ketidakcocokan profil atau state-dir">
    Jika Gateway lama menggunakan `--profile` atau `OPENCLAW_STATE_DIR` dan yang baru tidak, kanal akan tampak keluar dan sesi akan kosong. Jalankan Gateway dengan profil atau state-dir yang **sama** dengan yang Anda migrasikan, lalu jalankan ulang `openclaw doctor`.
  </Accordion>

  <Accordion title="Hanya menyalin openclaw.json">
    File konfigurasi saja tidak cukup. Profil autentikasi model berada di bawah `agents/<agentId>/agent/auth-profiles.json`, dan status kanal serta penyedia berada di bawah `credentials/`. Selalu migrasikan **seluruh** direktori status.
  </Accordion>

  <Accordion title="Izin dan kepemilikan">
    Jika Anda menyalin sebagai root atau berganti pengguna, Gateway mungkin gagal membaca kredensial. Pastikan direktori status dan ruang kerja dimiliki oleh pengguna yang menjalankan Gateway.
  </Accordion>

  <Accordion title="Mode jarak jauh">
    Jika UI Anda mengarah ke Gateway **jarak jauh**, host jarak jauh yang memiliki sesi dan ruang kerja. Migrasikan host Gateway itu sendiri, bukan laptop lokal Anda. Lihat [FAQ](/id/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Rahasia dalam cadangan">
    Direktori status berisi profil autentikasi, kredensial kanal, dan status penyedia lainnya. Simpan cadangan secara terenkripsi, hindari kanal transfer yang tidak aman, dan rotasi kunci jika Anda mencurigai adanya paparan.
  </Accordion>
</AccordionGroup>

### Daftar periksa verifikasi

Di mesin baru, konfirmasikan:

- [ ] `openclaw status` menunjukkan Gateway berjalan.
- [ ] Kanal masih terhubung (tidak perlu pemasangan ulang).
- [ ] Dasbor terbuka dan menampilkan sesi yang sudah ada.
- [ ] File ruang kerja (memori, konfigurasi) tersedia.

## Mutakhirkan Plugin di tempat

Pemutakhiran Plugin di tempat mempertahankan id Plugin dan kunci konfigurasi yang sama, tetapi dapat memindahkan status di disk ke tata letak saat ini. Panduan pemutakhiran khusus Plugin berada bersama kanalnya:

- [Migrasi Matrix](/id/channels/matrix-migration): batas pemulihan status terenkripsi, perilaku snapshot otomatis, dan perintah pemulihan manual.

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI untuk impor lintas sistem.
- [Ikhtisar instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Uninstal](/id/install/uninstall): menghapus OpenClaw dengan bersih.
