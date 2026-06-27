---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang men-debug reset sesi harian atau menganggur
summary: Bagaimana OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-06-27T17:26:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke
sesi berdasarkan asalnya -- DM, obrolan grup, tugas Cron, dan sebagainya.

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung | Sesi bersama secara default |
| Obrolan grup     | Terisolasi per grup        |
| Ruang/saluran  | Terisolasi per ruang         |
| Tugas Cron       | Sesi baru per eksekusi     |
| Webhook        | Terisolasi per hook         |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk kesinambungan. Ini cocok untuk
pengaturan pengguna tunggal.

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
- `per-peer` -- isolasi berdasarkan pengirim (lintas saluran).
- `per-channel-peer` -- isolasi berdasarkan saluran + pengirim (direkomendasikan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + saluran + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa saluran, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

### Menambatkan saluran tertaut

Perintah dock memungkinkan pengguna memindahkan rute balasan sesi obrolan langsung saat ini ke
saluran tertaut lain tanpa memulai sesi baru. Lihat
[Penambatan saluran](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi pengaturan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host
  Gateway. Kesegaran harian didasarkan pada waktu `sessionId` saat ini dimulai, bukan
  pada penulisan metadata berikutnya.
- **Reset idle** (opsional) -- sesi baru setelah periode tidak aktif. Atur
  `session.reset.idleMinutes`. Kesegaran idle didasarkan pada interaksi nyata
  pengguna/saluran terakhir, sehingga peristiwa sistem Heartbeat, Cron, dan exec tidak
  membuat sesi tetap hidup.
- **Reset manual** -- ketik `/new` atau `/reset` dalam obrolan. `/new <model>` juga
  mengganti model.

Ketika reset harian dan idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
Giliran Heartbeat, Cron, exec, dan peristiwa sistem lain dapat menulis metadata sesi,
tetapi penulisan tersebut tidak memperpanjang kesegaran reset harian atau idle. Ketika reset
menggulung sesi, pemberitahuan peristiwa sistem yang mengantre untuk sesi lama
dibuang agar pembaruan latar belakang yang usang tidak ditambahkan di awal prompt pertama dalam
sesi baru.

Sesi dengan sesi CLI aktif milik penyedia tidak dipotong oleh default harian
implisit. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit ketika sesi tersebut
harus kedaluwarsa berdasarkan timer.

## Tempat state berada

Semua state sesi dimiliki oleh **Gateway**. Klien UI meminta data sesi dari Gateway.

- **Penyimpanan:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` menyimpan timestamp siklus hidup yang terpisah:

- `sessionStartedAt`: waktu `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/saluran terakhir yang memperpanjang masa idle.
- `updatedAt`: mutasi baris penyimpanan terakhir; berguna untuk daftar dan pemangkasan, tetapi tidak
  otoritatif untuk kesegaran reset harian/idle.

Baris lama tanpa `sessionStartedAt` diselesaikan dari header sesi JSONL transkrip
jika tersedia. Jika baris lama juga tidak memiliki `lastInteractionAt`,
kesegaran idle menggunakan waktu mulai sesi tersebut sebagai fallback, bukan penulisan pembukuan
berikutnya.

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi seiring waktu. Secara default, OpenClaw berjalan
dalam mode `enforce` dan menerapkan pembersihan selama pemeliharaan. Atur
`session.maintenance.mode` ke `"warn"` untuk melaporkan apa yang akan dibersihkan tanpa mengubah penyimpanan/file:

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

Untuk batas `maxEntries` berukuran produksi, penulisan runtime Gateway menggunakan buffer high-water kecil dan membersihkan kembali ke batas yang dikonfigurasi secara batch. Pembacaan penyimpanan sesi tidak memangkas atau membatasi entri selama startup Gateway. Ini menghindari pembersihan penyimpanan penuh pada setiap startup atau sesi Cron terisolasi. `openclaw sessions cleanup --enforce` segera menerapkan batas tersebut.

Sesi probe eksekusi model Gateway berumur pendek secara default. Baris yang cocok dengan
kunci eksplisit ketat seperti `agent:*:explicit:model-run-<uuid>` menggunakan retensi tetap `24h`,
tetapi pembersihan dibatasi oleh tekanan: pembersihan hanya menghapus baris probe usang ketika
tekanan pemeliharaan/batas entri sesi tercapai. Ketika pembersihan eksekusi model berjalan,
pembersihan ini berjalan sebelum cutoff umur entri usang yang lebih luas dan batas entri. Sesi langsung normal,
grup, thread, Cron, hook, Heartbeat, ACP, dan sub-agen tidak mewarisi
retensi 24 jam ini.

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang tahan lama, termasuk sesi grup
dan sesi obrolan cakupan thread, sambil tetap memungkinkan entri sintetis Cron,
hook, Heartbeat, ACP, dan sub-agen menua dan dihapus.

Jika sebelumnya Anda menggunakan isolasi pesan langsung lalu mengembalikan
`session.dmScope` ke `main`, pratinjau baris DM lama berbasis peer dengan
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Menerapkan flag yang sama
memensiunkan baris direct-DM lama tersebut dan menyimpan transkripnya sebagai arsip
terhapus.

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- jalur penyimpanan sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` dalam obrolan -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada dalam prompt sistem.

## Bacaan lanjutan

- [Pemangkasan Sesi](/id/concepts/session-pruning) -- memangkas hasil tool
- [Compaction](/id/concepts/compaction) -- meringkas percakapan panjang
- [Tool Sesi](/id/concepts/session-tool) -- tool agen untuk pekerjaan lintas sesi
- [Pendalaman Manajemen Sesi](/id/reference/session-management-compaction) --
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multi-Agen](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — cara pekerjaan terlepas membuat catatan tugas dengan referensi sesi
- [Perutean Saluran](/id/channels/channel-routing) — cara pesan masuk dirutekan ke sesi

## Terkait

- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Tool sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
