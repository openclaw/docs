---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang memecahkan masalah reset sesi harian atau sesi tidak aktif
summary: Bagaimana OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-05-02T09:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke sebuah
sesi berdasarkan asalnya -- pesan langsung, obrolan grup, tugas cron, dll.

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung | Sesi bersama secara default |
| Obrolan grup     | Terisolasi per grup        |
| Ruang/channel  | Terisolasi per ruang         |
| Tugas Cron       | Sesi baru per eksekusi     |
| Webhook        | Terisolasi per hook         |

## Isolasi pesan langsung

Secara default, semua pesan langsung berbagi satu sesi untuk kesinambungan. Ini cocok untuk
penyiapan satu pengguna.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agen Anda, aktifkan isolasi pesan langsung. Tanpanya, semua
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

- `main` (default) -- semua pesan langsung berbagi satu sesi.
- `per-peer` -- isolasi berdasarkan pengirim (lintas channel).
- `per-channel-peer` -- isolasi berdasarkan channel + pengirim (direkomendasikan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + channel + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa channel, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

### Dock channel tertaut

Perintah dock memungkinkan pengguna memindahkan rute balasan sesi obrolan langsung saat ini ke
channel tertaut lain tanpa memulai sesi baru. Lihat
[Docking channel](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan ulang sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host
  Gateway. Kesegaran harian didasarkan pada waktu `sessionId` saat ini dimulai, bukan
  pada penulisan metadata berikutnya.
- **Reset menganggur** (opsional) -- sesi baru setelah periode tidak aktif. Atur
  `session.reset.idleMinutes`. Kesegaran menganggur didasarkan pada interaksi nyata
  pengguna/channel terakhir, sehingga Heartbeat, cron, dan peristiwa sistem exec tidak
  membuat sesi tetap hidup.
- **Reset manual** -- ketik `/new` atau `/reset` di chat. `/new <model>` juga
  mengganti model.

Ketika reset harian dan menganggur sama-sama dikonfigurasi, mana pun yang kedaluwarsa lebih dulu yang berlaku.
Giliran Heartbeat, cron, exec, dan peristiwa sistem lainnya dapat menulis metadata sesi,
tetapi penulisan tersebut tidak memperpanjang kesegaran reset harian atau menganggur. Ketika reset
menggulung sesi, pemberitahuan peristiwa sistem yang mengantre untuk sesi lama
dibuang agar pembaruan latar belakang yang basi tidak diawali ke prompt pertama di
sesi baru.

Sesi dengan sesi CLI aktif yang dimiliki provider tidak dipotong oleh default harian
implisit. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit ketika
sesi tersebut harus kedaluwarsa berdasarkan timer.

## Lokasi state

Semua state sesi dimiliki oleh **Gateway**. Klien UI mengueri Gateway untuk
data sesi.

- **Penyimpanan:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` menyimpan timestamp siklus hidup terpisah:

- `sessionStartedAt`: saat `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/channel terakhir yang memperpanjang masa hidup menganggur.
- `updatedAt`: mutasi baris penyimpanan terakhir; berguna untuk daftar dan pruning, tetapi bukan
  otoritatif untuk kesegaran reset harian/menganggur.

Baris lama tanpa `sessionStartedAt` diselesaikan dari header sesi JSONL transkrip
jika tersedia. Jika baris lama juga tidak memiliki `lastInteractionAt`,
kesegaran menganggur fallback ke waktu mulai sesi tersebut, bukan ke penulisan pembukuan
berikutnya.

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi dari waktu ke waktu. Secara default, ini berjalan
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

Untuk batas `maxEntries` berukuran produksi, penulisan runtime Gateway menggunakan buffer high-water kecil dan membersihkan kembali ke batas yang dikonfigurasi dalam batch. Pembacaan penyimpanan sesi tidak melakukan pruning atau membatasi entri selama startup Gateway. Ini menghindari pembersihan penyimpanan penuh pada setiap startup atau sesi cron terisolasi. `openclaw sessions cleanup --enforce` menerapkan batas tersebut segera.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama, termasuk sesi grup
dan sesi chat bercakupan thread, sambil tetap mengizinkan entri cron sintetis,
hook, Heartbeat, ACP, dan sub-agen menua keluar.

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- path penyimpanan sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` di chat -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada di prompt sistem.

## Bacaan lanjutan

- [Pruning sesi](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- meringkas percakapan panjang
- [Tool sesi](/id/concepts/session-tool) -- tool agen untuk pekerjaan lintas sesi
- [Pembahasan Mendalam Manajemen Sesi](/id/reference/session-management-compaction) --
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multi-Agen](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — cara pekerjaan terlepas membuat catatan tugas dengan referensi sesi
- [Perutean Channel](/id/channels/channel-routing) — cara pesan masuk dirutekan ke sesi

## Terkait

- [Pruning sesi](/id/concepts/session-pruning)
- [Tool sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
