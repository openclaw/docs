---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multipengguna
    - Anda sedang men-debug pengaturan ulang sesi harian atau saat tidak aktif
summary: Cara OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-07-16T18:01:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw merutekan setiap pesan masuk ke sebuah **sesi** berdasarkan asalnya:
DM, obrolan grup, tugas cron, dan sebagainya. Semua status sesi dimiliki oleh
**Gateway**; klien UI meminta data sesi dari Gateway.

## Cara pesan dirutekan

| Sumber          | Perilaku                         |
| --------------- | -------------------------------- |
| Pesan langsung  | Sesi bersama secara default      |
| Obrolan grup    | Diisolasi per grup               |
| Ruang/saluran   | Diisolasi per ruang              |
| Tugas Cron      | Sesi baru untuk setiap eksekusi  |
| Webhook         | Diisolasi per hook               |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk menjaga kesinambungan, yang sesuai
untuk penyiapan dengan satu pengguna.

<Warning>
Jika beberapa orang dapat mengirim pesan kepada agen Anda, aktifkan isolasi DM.
Tanpa isolasi, semua pengguna berbagi konteks percakapan yang sama, sehingga pesan
pribadi Alice akan terlihat oleh Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolasi berdasarkan saluran + pengirim
  },
}
```

Opsi `session.dmScope`:

| Nilai                      | Perilaku                                         |
| -------------------------- | ------------------------------------------------ |
| `main` (default)           | Semua DM berbagi satu sesi                       |
| `per-peer`                 | Isolasi berdasarkan pengirim, lintas saluran     |
| `per-channel-peer`         | Isolasi berdasarkan saluran + pengirim (disarankan) |
| `per-account-channel-peer` | Isolasi berdasarkan akun + saluran + pengirim    |

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa saluran, gunakan
`session.identityLinks` untuk memetakan identitas mereka ke satu id rekan kanonis agar
mereka berbagi satu sesi.
</Tip>

### Menautkan saluran tertaut

Perintah penautan memindahkan rute balasan sesi obrolan langsung saat ini ke
saluran tertaut lain tanpa memulai sesi baru. Lihat
[Penautan saluran](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali hingga kedaluwarsa berdasarkan `session.reset`:

- **Reset harian** (default `mode: "daily"`) - sesi baru pada jam lokal
  yang dikonfigurasi (`session.reset.atHour`, default `4`, 0-23) di host Gateway. Kesegaran
  harian didasarkan pada waktu `sessionId` saat ini dimulai, bukan pada penulisan
  metadata setelahnya.
- **Reset saat menganggur** (`mode: "idle"`) - sesi baru setelah `session.reset.idleMinutes`
  tanpa aktivitas. Kesegaran saat menganggur didasarkan pada interaksi nyata
  terakhir dari pengguna/saluran, sehingga peristiwa sistem Heartbeat, Cron,
  dan exec tidak mempertahankan sesi tetap aktif.
- **Reset manual** - ketik `/new` atau `/reset` dalam obrolan. `/new <model>` juga
  mengganti model.

Jika reset harian dan reset saat menganggur dikonfigurasi, yang kedaluwarsa lebih
dahulu akan berlaku. Giliran Heartbeat, Cron, exec, dan peristiwa sistem lainnya
dapat menulis metadata sesi, tetapi penulisan tersebut tidak memperpanjang
kesegaran reset harian atau saat menganggur. Saat reset mengganti sesi,
pemberitahuan peristiwa sistem dalam antrean untuk sesi lama akan dibuang agar
pembaruan latar belakang yang usang tidak ditambahkan di awal prompt pertama
dalam sesi baru.

Sesi dengan sesi CLI aktif yang dimiliki penyedia tidak dihentikan oleh default
harian implisit. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit jika
sesi tersebut harus kedaluwarsa berdasarkan pengatur waktu.

Timpa default per jenis obrolan atau per saluran:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` mendukung `direct` (alias lama `dm`), `group`, dan `thread`.
`session.idleMinutes` tingkat atas yang lama tetap berfungsi sebagai alias kompatibilitas untuk
default mode menganggur saat tidak ada blok `session.reset`/`resetByType` yang ditetapkan.

## Lokasi status disimpan

- **Baris sesi runtime:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **File transkrip yang diarsipkan:** `~/.openclaw/agents/<agentId>/sessions/`
- **Sumber migrasi baris lama:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Baris sesi dalam basis data SQLite per agen menyimpan stempel waktu siklus hidup
secara terpisah:

- `sessionStartedAt`: waktu `sessionId` saat ini dimulai; reset harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/saluran terakhir yang memperpanjang masa aktif saat menganggur.
- `updatedAt`: mutasi terakhir pada baris penyimpanan; berguna untuk pencantuman dan pemangkasan, tetapi tidak
  bersifat otoritatif untuk kesegaran reset harian/saat menganggur.

Selama migrasi dari instalasi lama, proses awal Gateway dan `openclaw doctor
--fix` mengimpor baris `sessions.json` lama serta riwayat JSONL transkrip aktif ke
SQLite secara otomatis. Baris tanpa `sessionStartedAt` diselesaikan dari header
sesi JSONL transkrip lama jika tersedia. Jika baris lama juga tidak memiliki
`lastInteractionAt`, kesegaran saat menganggur kembali menggunakan waktu mulai
sesi tersebut, bukan penulisan pembukuan setelahnya. Gunakan `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` dan [urutan migrasi
Doctor](/id/cli/doctor#session-sqlite-migration) jika Anda menginginkan bukti inspeksi
atau validasi eksplisit.

## Pemeliharaan sesi

OpenClaw membatasi penyimpanan sesi dari waktu ke waktu melalui `session.maintenance`,
dengan default yang ditampilkan:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" menerapkan pembersihan; "warn" hanya melaporkan
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Untuk batas `maxEntries` berskala produksi, penulisan runtime Gateway menggunakan
buffer batas atas kecil dan membersihkannya kembali hingga batas yang
dikonfigurasi secara berkelompok. Pembacaan penyimpanan sesi tidak memangkas
atau membatasi entri selama proses awal Gateway, sehingga proses awal dan sesi
Cron terisolasi tidak menanggung pembersihan penuh penyimpanan.
`openclaw sessions cleanup --enforce` langsung menerapkan batas tersebut.

Sesi probe eksekusi model Gateway secara default berumur pendek. Baris yang cocok
dengan `agent:*:explicit:model-run-<uuid>` menggunakan retensi tetap `24h`, tetapi
pembersihannya dipicu oleh tekanan: baris probe usang hanya dihapus ketika
tekanan pemeliharaan/batas entri sesi tercapai, dan proses ini berjalan sebelum
batas usia entri usang yang lebih luas serta batas entri. Sesi langsung, grup,
utas, Cron, hook, Heartbeat, ACP, dan subagen normal tidak mewarisi retensi 24h ini.

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang persisten,
termasuk sesi grup dan sesi obrolan dalam cakupan utas, sekaligus tetap
memungkinkan entri Cron sintetis, hook, Heartbeat, ACP, dan subagen kedaluwarsa.

Jika sebelumnya Anda menggunakan isolasi DM lalu mengembalikan `session.dmScope`
ke `main`, pratinjau baris DM usang berkunci rekan dengan
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Menerapkan flag yang sama akan
menghentikan baris DM langsung lama tersebut dan mempertahankan transkripnya
sebagai arsip yang dihapus.

Pratinjau setiap eksekusi pemeliharaan dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

| Perintah                   | Menampilkan                                      |
| -------------------------- | ------------------------------------------------ |
| `openclaw status`          | Jalur penyimpanan sesi dan aktivitas terbaru     |
| `openclaw sessions --json` | Semua sesi (filter dengan `--active <minutes>`) |
| `/status` dalam obrolan          | Penggunaan konteks, model, dan opsi              |
| `/context list`            | Isi prompt sistem                                |

## Bacaan lebih lanjut

- [Pencarian sesi](/id/concepts/session-search) - pencarian teks lengkap di seluruh transkrip sebelumnya
- [Pemangkasan sesi](/id/concepts/session-pruning) - memangkas hasil alat
- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Alat sesi](/id/concepts/session-tool) - alat agen untuk pekerjaan lintas sesi
- [Pembahasan Mendalam Manajemen Sesi](/id/reference/session-management-compaction) -
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multiagen](/id/concepts/multi-agent) - perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) - cara pekerjaan terpisah membuat catatan tugas dengan referensi sesi
- [Perutean Saluran](/id/channels/channel-routing) - cara pesan masuk dirutekan ke sesi

## Terkait

- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Alat sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
