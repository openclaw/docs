---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang men-debug reset sesi harian atau tidak aktif
summary: Bagaimana OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-04-30T09:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke
sesi berdasarkan asalnya -- DM, obrolan grup, cron job, dan sebagainya.

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung | Sesi bersama secara default |
| Obrolan grup     | Terisolasi per grup        |
| Ruang/channel  | Terisolasi per ruang         |
| Cron job       | Sesi baru per eksekusi     |
| Webhook        | Terisolasi per hook         |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk kesinambungan. Ini cocok untuk
penyiapan satu pengguna.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agen Anda, aktifkan isolasi DM. Tanpa itu, semua
pengguna berbagi konteks percakapan yang sama -- pesan pribadi Alice akan
terlihat oleh Bob.
</Warning>

**Perbaikannya:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Opsi lain:

- `main` (default) -- semua DM berbagi satu sesi.
- `per-peer` -- isolasi berdasarkan pengirim (lintas channel).
- `per-channel-peer` -- isolasi berdasarkan channel + pengirim (direkomendasikan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + channel + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa channel, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar berbagi satu sesi.
</Tip>

### Dock channel tertaut

Perintah dock memungkinkan pengguna memindahkan rute balasan sesi obrolan langsung saat ini ke
channel tertaut lain tanpa memulai sesi baru. Lihat
[Docking channel](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali hingga kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host gateway. Kesegaran harian didasarkan pada kapan `sessionId` saat ini dimulai, bukan
  pada penulisan metadata berikutnya.
- **Reset idle** (opsional) -- sesi baru setelah periode tanpa aktivitas. Atur
  `session.reset.idleMinutes`. Kesegaran idle didasarkan pada interaksi nyata terakhir
  dari pengguna/channel, sehingga Heartbeat, cron, dan peristiwa sistem exec tidak
  mempertahankan sesi tetap aktif.
- **Reset manual** -- ketik `/new` atau `/reset` dalam obrolan. `/new <model>` juga
  mengganti model.

Ketika reset harian dan idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
Heartbeat, cron, exec, dan giliran peristiwa sistem lainnya dapat menulis metadata sesi,
tetapi penulisan tersebut tidak memperpanjang kesegaran reset harian atau idle. Ketika reset
menggulung sesi, pemberitahuan peristiwa sistem yang mengantre untuk sesi lama akan
dibuang sehingga pembaruan latar belakang yang sudah usang tidak ditambahkan ke prompt pertama dalam
sesi baru.

Sesi dengan sesi CLI aktif milik penyedia tidak dipotong oleh default harian implisit.
Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit ketika sesi tersebut
harus kedaluwarsa berdasarkan timer.

## Tempat state disimpan

Semua state sesi dimiliki oleh **gateway**. Klien UI meminta data sesi ke gateway.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` menyimpan timestamp siklus hidup secara terpisah:

- `sessionStartedAt`: saat `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/channel terakhir yang memperpanjang masa aktif idle.
- `updatedAt`: mutasi baris store terakhir; berguna untuk daftar dan pruning, tetapi tidak
  otoritatif untuk kesegaran reset harian/idle.

Baris lama tanpa `sessionStartedAt` diselesaikan dari header sesi JSONL transkrip
jika tersedia. Jika baris lama juga tidak memiliki `lastInteractionAt`,
kesegaran idle jatuh kembali ke waktu mulai sesi tersebut, bukan ke penulisan pembukuan
berikutnya.

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi seiring waktu. Secara default, ini berjalan
dalam mode `warn` (melaporkan apa yang akan dibersihkan). Atur `session.maintenance.mode`
ke `"enforce"` untuk pembersihan otomatis:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Untuk batas `maxEntries` ukuran produksi, penulisan runtime Gateway menggunakan buffer high-water kecil dan membersihkan kembali ke batas yang dikonfigurasi secara bertahap. Ini menghindari pembersihan store penuh pada setiap sesi cron terisolasi. `openclaw sessions cleanup --enforce` menerapkan batas tersebut segera.

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- jalur store sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` dalam obrolan -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada dalam prompt sistem.

## Bacaan lebih lanjut

- [Pruning Sesi](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- meringkas percakapan panjang
- [Tool Sesi](/id/concepts/session-tool) -- tool agen untuk pekerjaan lintas sesi
- [Pendalaman Manajemen Sesi](/id/reference/session-management-compaction) --
  skema store, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multi-Agen](/id/concepts/multi-agent) — routing dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — cara pekerjaan terpisah membuat catatan tugas dengan referensi sesi
- [Routing Channel](/id/channels/channel-routing) — cara pesan masuk dirutekan ke sesi

## Terkait

- [Pruning sesi](/id/concepts/session-pruning)
- [Tool sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
