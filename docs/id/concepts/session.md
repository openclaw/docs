---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang men-debug reset sesi harian atau saat idle
summary: Cara OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-04-26T11:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke
sebuah sesi berdasarkan asalnya -- DM, obrolan grup, pekerjaan Cron, dan sebagainya.

## Cara pesan dirutekan

| Source          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung  | Sesi bersama secara default |
| Obrolan grup    | Terisolasi per grup       |
| Room/saluran    | Terisolasi per room       |
| Pekerjaan Cron  | Sesi baru setiap run      |
| Webhook         | Terisolasi per hook       |

## Isolasi DM

Secara default, semua DM berbagi satu sesi demi kontinuitas. Ini cocok untuk
penyiapan satu pengguna.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agent Anda, aktifkan isolasi DM. Tanpa itu, semua
pengguna berbagi konteks percakapan yang sama -- pesan privat Alice akan
terlihat oleh Bob.
</Warning>

**Perbaikannya:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolasi berdasarkan saluran + pengirim
  },
}
```

Opsi lain:

- `main` (default) -- semua DM berbagi satu sesi.
- `per-peer` -- isolasi berdasarkan pengirim (lintas saluran).
- `per-channel-peer` -- isolasi berdasarkan saluran + pengirim (disarankan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + saluran + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa saluran, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host gateway.
  Kesegaran harian didasarkan pada kapan `sessionId` saat ini dimulai, bukan
  pada penulisan metadata berikutnya.
- **Reset saat idle** (opsional) -- sesi baru setelah periode tidak aktif. Setel
  `session.reset.idleMinutes`. Kesegaran idle didasarkan pada interaksi pengguna/saluran nyata terakhir,
  sehingga event sistem Heartbeat, Cron, dan exec tidak menjaga sesi tetap hidup.
- **Reset manual** -- ketik `/new` atau `/reset` di chat. `/new <model>` juga
  mengganti model.

Saat reset harian dan idle sama-sama dikonfigurasi, yang lebih dulu kedaluwarsa akan berlaku.
Giliran event sistem seperti Heartbeat, Cron, exec, dan lainnya dapat menulis metadata sesi,
tetapi penulisan itu tidak memperpanjang kesegaran reset harian atau idle. Saat reset
mengganti sesi, notifikasi event sistem yang mengantre untuk sesi lama akan
dibuang agar pembaruan latar belakang yang usang tidak ditambahkan di awal prompt pertama dalam
sesi baru.

Sesi dengan sesi CLI milik provider yang aktif tidak dipotong oleh default harian implisit.
Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit saat sesi tersebut
harus kedaluwarsa berdasarkan timer.

## Tempat state disimpan

Semua state sesi dimiliki oleh **Gateway**. Klien UI melakukan query ke gateway untuk
data sesi.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` menyimpan stempel waktu siklus hidup yang terpisah:

- `sessionStartedAt`: kapan `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/saluran terakhir yang memperpanjang masa hidup idle.
- `updatedAt`: mutasi baris store terakhir; berguna untuk listing dan pruning, tetapi tidak
  otoritatif untuk kesegaran reset harian/idle.

Baris lama tanpa `sessionStartedAt` di-resolve dari header sesi JSONL transkrip
saat tersedia. Jika baris lama juga tidak memiliki `lastInteractionAt`,
kesegaran idle fallback ke waktu mulai sesi tersebut, bukan ke penulisan pencatatan
berikutnya.

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi dari waktu ke waktu. Secara default, ia berjalan
dalam mode `warn` (melaporkan apa yang akan dibersihkan). Setel `session.maintenance.mode`
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

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- path store sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` di chat -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa saja yang ada di prompt sistem.

## Bacaan lanjutan

- [Session Pruning](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- merangkum percakapan panjang
- [Session Tools](/id/concepts/session-tool) -- alat agent untuk pekerjaan lintas sesi
- [Pendalaman Manajemen Sesi](/id/reference/session-management-compaction) --
  skema store, transkrip, kebijakan kirim, metadata asal, dan config lanjutan
- [Multi-Agent](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agent
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terlepas membuat catatan tugas dengan referensi sesi
- [Perutean Saluran](/id/channels/channel-routing) — bagaimana pesan masuk dirutekan ke sesi

## Terkait

- [Session pruning](/id/concepts/session-pruning)
- [Session tools](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
