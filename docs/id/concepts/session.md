---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang memecahkan masalah reset sesi harian atau reset sesi saat tidak aktif
summary: Cara OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-05-07T13:15:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke
sesi berdasarkan asalnya -- DM, obrolan grup, pekerjaan cron, dll.

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung | Sesi bersama secara default |
| Obrolan grup     | Terisolasi per grup        |
| Ruang/saluran  | Terisolasi per ruang         |
| Pekerjaan Cron       | Sesi baru per eksekusi     |
| Webhook        | Terisolasi per hook         |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk kesinambungan. Ini baik untuk
penyiapan pengguna tunggal.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agen Anda, aktifkan isolasi DM. Tanpanya, semua
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
- `per-peer` -- isolasi berdasarkan pengirim (lintas saluran).
- `per-channel-peer` -- isolasi berdasarkan saluran + pengirim (direkomendasikan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + saluran + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa saluran, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

### Dock saluran tertaut

Perintah dock memungkinkan pengguna memindahkan rute balasan sesi obrolan langsung saat ini ke
saluran tertaut lain tanpa memulai sesi baru. Lihat
[Docking saluran](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 04.00 waktu lokal di host
  Gateway. Kesegaran harian didasarkan pada kapan `sessionId` saat ini dimulai, bukan
  pada penulisan metadata berikutnya.
- **Reset menganggur** (opsional) -- sesi baru setelah periode tanpa aktivitas. Atur
  `session.reset.idleMinutes`. Kesegaran menganggur didasarkan pada interaksi
  pengguna/saluran nyata terakhir, sehingga peristiwa sistem Heartbeat, Cron, dan exec tidak
  menjaga sesi tetap hidup.
- **Reset manual** -- ketik `/new` atau `/reset` di obrolan. `/new <model>` juga
  mengganti model.

Ketika reset harian dan menganggur sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
Giliran peristiwa sistem Heartbeat, Cron, exec, dan lainnya dapat menulis metadata sesi,
tetapi penulisan tersebut tidak memperpanjang kesegaran reset harian atau menganggur. Ketika reset
menggulung sesi, pemberitahuan peristiwa sistem yang diantrekan untuk sesi lama akan
dibuang sehingga pembaruan latar belakang yang basi tidak ditambahkan di awal prompt pertama di
sesi baru.

Sesi dengan sesi CLI aktif yang dimiliki penyedia tidak dipotong oleh default harian
implisit. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit ketika
sesi tersebut harus kedaluwarsa berdasarkan timer.

## Tempat status berada

Semua status sesi dimiliki oleh **Gateway**. Klien UI meminta data sesi dari Gateway.

- **Penyimpanan:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` menyimpan timestamp siklus hidup terpisah:

- `sessionStartedAt`: kapan `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/saluran terakhir yang memperpanjang masa hidup menganggur.
- `updatedAt`: mutasi baris penyimpanan terakhir; berguna untuk daftar dan pruning, tetapi tidak
  otoritatif untuk kesegaran reset harian/menganggur.

Baris lama tanpa `sessionStartedAt` diselesaikan dari header sesi JSONL transkrip
jika tersedia. Jika baris lama juga tidak memiliki `lastInteractionAt`,
kesegaran menganggur fallback ke waktu mulai sesi tersebut, bukan ke penulisan pembukuan
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

Untuk batas `maxEntries` ukuran produksi, penulisan runtime Gateway menggunakan buffer high-water kecil dan membersihkan kembali ke batas yang dikonfigurasi dalam batch. Pembacaan penyimpanan sesi tidak melakukan pruning atau membatasi entri selama startup Gateway. Ini menghindari menjalankan pembersihan penyimpanan penuh pada setiap startup atau sesi Cron terisolasi. `openclaw sessions cleanup --enforce` menerapkan batas tersebut segera.

Pemeliharaan mempertahankan pointer percakapan eksternal yang tahan lama, termasuk sesi grup
dan sesi obrolan berbasis thread, sambil tetap memungkinkan entri Cron sintetis,
hook, Heartbeat, ACP, dan sub-agen menua dan keluar.

Jika sebelumnya Anda menggunakan isolasi pesan langsung dan kemudian mengembalikan
`session.dmScope` ke `main`, pratinjau baris DM lama berbasis peer-key dengan
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Menerapkan flag yang sama
menghentikan baris direct-DM lama tersebut dan menyimpan transkripnya sebagai arsip
yang dihapus.

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- jalur penyimpanan sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` di obrolan -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada di prompt sistem.

## Bacaan lebih lanjut

- [Pruning Sesi](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- meringkas percakapan panjang
- [Tool Sesi](/id/concepts/session-tool) -- tool agen untuk kerja lintas sesi
- [Pendalaman Manajemen Sesi](/id/reference/session-management-compaction) --
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multi-Agen](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — cara kerja terlepas membuat catatan tugas dengan referensi sesi
- [Perutean Saluran](/id/channels/channel-routing) — cara pesan masuk dirutekan ke sesi

## Terkait

- [Pruning sesi](/id/concepts/session-pruning)
- [Tool sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
