---
read_when:
    - Anda sedang memindahkan OpenClaw ke laptop atau server baru
    - Anda beralih dari sistem agen lain dan ingin mempertahankan status
    - Anda sedang memutakhirkan Plugin di tempat
summary: 'Pusat migrasi: impor lintas sistem, pemindahan antarmesin, dan peningkatan Plugin'
title: Panduan migrasi
x-i18n:
    generated_at: "2026-05-02T09:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw mendukung tiga jalur migrasi: mengimpor dari sistem agen lain, memindahkan instalasi yang sudah ada ke mesin baru, dan memutakhirkan Plugin di tempat.

## Impor dari sistem agen lain

Gunakan penyedia migrasi bawaan untuk membawa instruksi, server MCP, Skills, konfigurasi model, dan (opsional) kunci API ke OpenClaw. Rencana dipratinjau sebelum perubahan apa pun, rahasia disunting dalam laporan, dan penerapan didukung oleh cadangan terverifikasi.

<CardGroup cols={2}>
  <Card title="Migrasi dari Claude" href="/id/install/migrating-claude" icon="brain">
    Impor status Claude Code dan Claude Desktop, termasuk `CLAUDE.md`, server MCP, Skills, dan perintah proyek.
  </Card>
  <Card title="Migrasi dari Hermes" href="/id/install/migrating-hermes" icon="feather">
    Impor konfigurasi Hermes, penyedia, server MCP, memori, Skills, dan kunci `.env` yang didukung.
  </Card>
</CardGroup>

Titik masuk CLI adalah [`openclaw migrate`](/id/cli/migrate). Onboarding juga dapat menawarkan migrasi saat mendeteksi sumber yang dikenal (`openclaw onboard --flow import`).

## Pindahkan OpenClaw ke mesin baru

Salin **direktori status** (`~/.openclaw/` secara default) dan **workspace** Anda untuk mempertahankan:

- **Konfigurasi** — `openclaw.json` dan semua pengaturan Gateway.
- **Autentikasi** — `auth-profiles.json` per agen (kunci API plus OAuth), serta status channel atau penyedia apa pun di bawah `credentials/`.
- **Sesi** — riwayat percakapan dan status agen.
- **Status channel** — login WhatsApp, sesi Telegram, dan yang serupa.
- **File workspace** — `MEMORY.md`, `USER.md`, Skills, dan prompt.

<Tip>
Jalankan `openclaw status` di mesin lama untuk mengonfirmasi jalur direktori status Anda. Profil kustom menggunakan `~/.openclaw-<profile>/` atau jalur yang ditetapkan melalui `OPENCLAW_STATE_DIR`.
</Tip>

### Langkah migrasi

<Steps>
  <Step title="Hentikan gateway dan buat cadangan">
    Di mesin **lama**, hentikan Gateway agar file tidak berubah saat penyalinan berlangsung, lalu arsipkan:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jika Anda menggunakan beberapa profil (misalnya `~/.openclaw-work`), arsipkan masing-masing secara terpisah.

  </Step>

  <Step title="Instal OpenClaw di mesin baru">
    [Instal](/id/install) CLI (dan Node jika diperlukan) di mesin baru. Tidak masalah jika onboarding membuat `~/.openclaw/` baru. Anda akan menimpanya berikutnya.
  </Step>

  <Step title="Salin direktori status dan workspace">
    Transfer arsip melalui `scp`, `rsync -a`, atau drive eksternal, lalu ekstrak:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Pastikan direktori tersembunyi disertakan dan kepemilikan file sesuai dengan pengguna yang akan menjalankan Gateway.

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

Jika Telegram atau Discord menggunakan fallback env default (`TELEGRAM_BOT_TOKEN` atau `DISCORD_BOT_TOKEN`), verifikasi bahwa `.env` direktori status yang dimigrasikan berisi kunci tersebut tanpa mencetak nilai rahasianya:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` juga memperingatkan saat akun Telegram atau Discord default yang diaktifkan tidak memiliki token yang dikonfigurasi dan variabel env yang cocok tidak tersedia untuk proses doctor.

### Kendala umum

<AccordionGroup>
  <Accordion title="Ketidakcocokan profil atau state-dir">
    Jika Gateway lama menggunakan `--profile` atau `OPENCLAW_STATE_DIR` dan yang baru tidak, channel akan tampak keluar dan sesi akan kosong. Jalankan Gateway dengan profil atau state-dir **yang sama** dengan yang Anda migrasikan, lalu jalankan ulang `openclaw doctor`.
  </Accordion>

  <Accordion title="Hanya menyalin openclaw.json">
    File konfigurasi saja tidak cukup. Profil autentikasi model berada di bawah `agents/<agentId>/agent/auth-profiles.json`, dan status channel serta penyedia berada di bawah `credentials/`. Selalu migrasikan direktori status **secara keseluruhan**.
  </Accordion>

  <Accordion title="Izin dan kepemilikan">
    Jika Anda menyalin sebagai root atau beralih pengguna, Gateway mungkin gagal membaca kredensial. Pastikan direktori status dan workspace dimiliki oleh pengguna yang menjalankan Gateway.
  </Accordion>

  <Accordion title="Mode jarak jauh">
    Jika UI Anda mengarah ke Gateway **jarak jauh**, host jarak jauh memiliki sesi dan workspace. Migrasikan host Gateway itu sendiri, bukan laptop lokal Anda. Lihat [FAQ](/id/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Rahasia dalam cadangan">
    Direktori status berisi profil autentikasi, kredensial channel, dan status penyedia lainnya. Simpan cadangan secara terenkripsi, hindari channel transfer yang tidak aman, dan rotasi kunci jika Anda mencurigai adanya paparan.
  </Accordion>
</AccordionGroup>

### Daftar periksa verifikasi

Di mesin baru, konfirmasikan:

- [ ] `openclaw status` menunjukkan Gateway berjalan.
- [ ] Channel masih tersambung (tidak perlu pairing ulang).
- [ ] Dasbor terbuka dan menampilkan sesi yang sudah ada.
- [ ] File workspace (memori, konfigurasi) tersedia.

## Mutakhirkan Plugin di tempat

Pemutakhiran Plugin di tempat mempertahankan id Plugin dan kunci konfigurasi yang sama, tetapi dapat memindahkan status di disk ke tata letak saat ini. Panduan pemutakhiran khusus Plugin berada bersama channel-nya:

- [Migrasi Matrix](/id/channels/matrix-migration): batas pemulihan status terenkripsi, perilaku snapshot otomatis, dan perintah pemulihan manual.

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI untuk impor lintas sistem.
- [Ringkasan instalasi](/id/install): semua metode instalasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Uninstall](/id/install/uninstall): menghapus OpenClaw dengan bersih.
