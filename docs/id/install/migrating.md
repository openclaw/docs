---
read_when:
    - Anda memindahkan OpenClaw ke laptop/server baru
    - Anda ingin mempertahankan sesi, auth, dan login channel (WhatsApp, dll.)
summary: Memindahkan (migrasi) instalasi OpenClaw dari satu mesin ke mesin lain
title: Panduan Migrasi
x-i18n:
    generated_at: "2026-04-05T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Memigrasikan OpenClaw ke Mesin Baru

Panduan ini memindahkan gateway OpenClaw ke mesin baru tanpa mengulang onboarding.

## Apa Saja yang Dimigrasikan

Saat Anda menyalin **direktori state** (`~/.openclaw/` secara default) dan **workspace** Anda, Anda akan mempertahankan:

- **Konfigurasi** -- `openclaw.json` dan semua pengaturan gateway
- **Auth** -- `auth-profiles.json` per agent (kunci API + OAuth), serta state channel/provider apa pun di bawah `credentials/`
- **Sesi** -- riwayat percakapan dan state agent
- **State channel** -- login WhatsApp, sesi Telegram, dll.
- **File workspace** -- `MEMORY.md`, `USER.md`, Skills, dan prompt

<Tip>
Jalankan `openclaw status` di mesin lama untuk mengonfirmasi path direktori state Anda.
Profil kustom menggunakan `~/.openclaw-<profile>/` atau path yang disetel melalui `OPENCLAW_STATE_DIR`.
</Tip>

## Langkah Migrasi

<Steps>
  <Step title="Hentikan gateway dan buat cadangan">
    Di mesin **lama**, hentikan gateway agar file tidak berubah di tengah penyalinan, lalu arsipkan:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jika Anda menggunakan beberapa profil (misalnya `~/.openclaw-work`), arsipkan masing-masing secara terpisah.

  </Step>

  <Step title="Instal OpenClaw di mesin baru">
    [Instal](/install) CLI (dan Node jika diperlukan) di mesin baru.
    Tidak masalah jika onboarding membuat `~/.openclaw/` baru — Anda akan menimpanya setelah ini.
  </Step>

  <Step title="Salin direktori state dan workspace">
    Transfer arsip melalui `scp`, `rsync -a`, atau drive eksternal, lalu ekstrak:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Pastikan direktori tersembunyi ikut disertakan dan kepemilikan file sesuai dengan pengguna yang akan menjalankan gateway.

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

## Kendala Umum

<AccordionGroup>
  <Accordion title="Ketidakcocokan profil atau state-dir">
    Jika gateway lama menggunakan `--profile` atau `OPENCLAW_STATE_DIR` dan yang baru tidak,
    channel akan terlihat logout dan sesi akan kosong.
    Jalankan gateway dengan **profil** atau state-dir yang **sama** seperti yang Anda migrasikan, lalu jalankan ulang `openclaw doctor`.
  </Accordion>

  <Accordion title="Hanya menyalin openclaw.json">
    File konfigurasi saja tidak cukup. Profil auth model berada di bawah
    `agents/<agentId>/agent/auth-profiles.json`, dan state channel/provider masih
    berada di bawah `credentials/`. Selalu migrasikan **seluruh** direktori state.
  </Accordion>

  <Accordion title="Izin dan kepemilikan">
    Jika Anda menyalin sebagai root atau mengganti pengguna, gateway mungkin gagal membaca kredensial.
    Pastikan direktori state dan workspace dimiliki oleh pengguna yang menjalankan gateway.
  </Accordion>

  <Accordion title="Mode remote">
    Jika UI Anda menunjuk ke gateway **remote**, host remote tersebut yang memiliki sesi dan workspace.
    Migrasikan host gateway itu sendiri, bukan laptop lokal Anda. Lihat [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Rahasia dalam cadangan">
    Direktori state berisi profil auth, kredensial channel, dan state provider lainnya.
    Simpan cadangan dalam keadaan terenkripsi, hindari saluran transfer yang tidak aman, dan rotasi kunci jika Anda mencurigai adanya paparan.
  </Accordion>
</AccordionGroup>

## Daftar Periksa Verifikasi

Di mesin baru, konfirmasikan:

- [ ] `openclaw status` menunjukkan gateway sedang berjalan
- [ ] Channel masih terhubung (tidak perlu pairing ulang)
- [ ] Dashboard terbuka dan menampilkan sesi yang ada
- [ ] File workspace (memori, konfigurasi) tersedia
