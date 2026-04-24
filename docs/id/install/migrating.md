---
read_when:
    - Anda sedang memindahkan OpenClaw ke laptop/server baru
    - Anda ingin mempertahankan sesi, autentikasi, dan login channel (WhatsApp, dll.)
summary: Pindahkan (migrasikan) instalasi OpenClaw dari satu mesin ke mesin lain
title: Panduan migrasi
x-i18n:
    generated_at: "2026-04-24T09:14:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# Memigrasikan OpenClaw ke Mesin Baru

Panduan ini memindahkan gateway OpenClaw ke mesin baru tanpa mengulang onboarding.

## Apa yang dimigrasikan

Saat Anda menyalin **direktori status** (`~/.openclaw/` secara default) dan **workspace**, Anda mempertahankan:

- **Config** -- `openclaw.json` dan semua pengaturan gateway
- **Auth** -- `auth-profiles.json` per agen (API key + OAuth), ditambah status channel/provider apa pun di bawah `credentials/`
- **Sesi** -- riwayat percakapan dan status agen
- **Status channel** -- login WhatsApp, sesi Telegram, dll.
- **File workspace** -- `MEMORY.md`, `USER.md`, Skills, dan prompt

<Tip>
Jalankan `openclaw status` di mesin lama untuk memastikan path direktori status Anda.
Profile kustom menggunakan `~/.openclaw-<profile>/` atau path yang diatur melalui `OPENCLAW_STATE_DIR`.
</Tip>

## Langkah migrasi

<Steps>
  <Step title="Hentikan gateway dan buat cadangan">
    Di mesin **lama**, hentikan gateway agar file tidak berubah di tengah penyalinan, lalu arsipkan:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jika Anda menggunakan beberapa profile (misalnya `~/.openclaw-work`), arsipkan masing-masing secara terpisah.

  </Step>

  <Step title="Pasang OpenClaw di mesin baru">
    [Pasang](/id/install) CLI (dan Node jika diperlukan) di mesin baru.
    Tidak masalah jika onboarding membuat `~/.openclaw/` yang baru -- Anda akan menimpanya setelah ini.
  </Step>

  <Step title="Salin direktori status dan workspace">
    Transfer arsip melalui `scp`, `rsync -a`, atau drive eksternal, lalu ekstrak:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Pastikan direktori tersembunyi ikut disertakan dan kepemilikan file cocok dengan pengguna yang akan menjalankan gateway.

  </Step>

  <Step title="Jalankan doctor dan verifikasi">
    Di mesin baru, jalankan [Doctor](/id/gateway/doctor) untuk menerapkan migrasi config dan memperbaiki layanan:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Jebakan umum

<AccordionGroup>
  <Accordion title="Ketidakcocokan profile atau state-dir">
    Jika gateway lama menggunakan `--profile` atau `OPENCLAW_STATE_DIR` dan yang baru tidak,
    channel akan terlihat logout dan sesi akan kosong.
    Luncurkan gateway dengan profile atau state-dir **yang sama** yang Anda migrasikan, lalu jalankan ulang `openclaw doctor`.
  </Accordion>

  <Accordion title="Hanya menyalin openclaw.json">
    File config saja tidak cukup. Auth profile model disimpan di bawah
    `agents/<agentId>/agent/auth-profiles.json`, dan status channel/provider masih
    disimpan di bawah `credentials/`. Selalu migrasikan **seluruh** direktori status.
  </Accordion>

  <Accordion title="Izin dan kepemilikan">
    Jika Anda menyalin sebagai root atau mengganti pengguna, gateway mungkin gagal membaca kredensial.
    Pastikan direktori status dan workspace dimiliki oleh pengguna yang menjalankan gateway.
  </Accordion>

  <Accordion title="Mode remote">
    Jika UI Anda menunjuk ke gateway **remote**, host remote tersebut yang memiliki sesi dan workspace.
    Migrasikan host gateway itu sendiri, bukan laptop lokal Anda. Lihat [FAQ](/id/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets dalam cadangan">
    Direktori status berisi auth profile, kredensial channel, dan status provider lainnya.
    Simpan cadangan dalam bentuk terenkripsi, hindari saluran transfer yang tidak aman, dan rotasi kunci jika Anda mencurigai adanya paparan.
  </Accordion>
</AccordionGroup>

## Checklist verifikasi

Di mesin baru, pastikan:

- [ ] `openclaw status` menunjukkan gateway berjalan
- [ ] Channel masih terhubung (tidak perlu pairing ulang)
- [ ] Dashboard terbuka dan menampilkan sesi yang ada
- [ ] File workspace (memori, config) ada

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Migrasi Matrix](/id/install/migrating-matrix)
- [Uninstall](/id/install/uninstall)
