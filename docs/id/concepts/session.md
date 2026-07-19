---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
    - Anda sedang men-debug pengaturan ulang sesi harian atau sesi tidak aktif
summary: Cara OpenClaw mengelola sesi percakapan
title: Manajemen sesi
x-i18n:
    generated_at: "2026-07-19T16:32:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f088fe128201a53b10a1b103c9a7be4dd45162e8bbbb174c2a3c4b9663f1eeb6
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw merutekan setiap pesan masuk ke sebuah **sesi** berdasarkan asalnya:
DM, obrolan grup, pekerjaan cron, dan sebagainya. Seluruh status sesi dimiliki oleh
**Gateway**; klien UI meminta data sesi dari Gateway.

Untuk pengaturan default agen pribadi — satu percakapan berkelanjutan yang digunakan bersama oleh semua
saluran DM Anda, dengan aktivitas grup dan pekerjaan latar belakang mengalir ke dalamnya — lihat
[Sesi utama](/concepts/main-session).

## Cara pesan dirutekan

| Sumber          | Perilaku                  |
| --------------- | ------------------------- |
| Pesan langsung | Sesi bersama secara default |
| Obrolan grup     | Diisolasi per grup        |
| Ruang/saluran  | Diisolasi per ruang         |
| Pekerjaan Cron       | Sesi baru per eksekusi     |
| Webhook        | Diisolasi per hook         |

## Isolasi DM

Secara default, semua DM menggunakan satu sesi bersama demi kesinambungan, yang sesuai untuk
pengaturan pengguna tunggal.

<Warning>
Jika beberapa orang dapat mengirim pesan kepada agen Anda, aktifkan isolasi DM. Tanpanya, semua
pengguna berbagi konteks percakapan yang sama, sehingga pesan pribadi Alice akan
terlihat oleh Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolasi berdasarkan saluran + pengirim
  },
}
```

Opsi `session.dmScope`:

| Nilai                      | Perilaku                                                 |
| -------------------------- | -------------------------------------------------------- |
| `main` (default)           | Semua DM berbagi [sesi utama](/concepts/main-session) |
| `per-peer`                 | Isolasi berdasarkan pengirim, lintas saluran                       |
| `per-channel-peer`         | Isolasi berdasarkan saluran + pengirim (disarankan)                |
| `per-account-channel-peer` | Isolasi berdasarkan akun + saluran + pengirim                    |

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa saluran, gunakan
`session.identityLinks` untuk memetakan identitas mereka ke satu id rekan kanonis agar
mereka berbagi satu sesi.
</Tip>

### Menambatkan saluran tertaut

Perintah penambatan memindahkan rute balasan sesi obrolan langsung saat ini ke
saluran tertaut lain tanpa memulai sesi baru. Lihat
[Penambatan saluran](/id/concepts/channel-docking) untuk contoh, konfigurasi, dan
pemecahan masalah.

Verifikasi pengaturan Anda dengan `openclaw security audit`.

## Mengingat lintas percakapan

Transkrip terpisah mengendalikan riwayat lokal setiap percakapan. Untuk agen pribadi
atau agen yang sepenuhnya tepercaya, `memorySearch.rememberAcrossConversations: true`
menambahkan langkah pengambilan opsional dari percakapan pribadi lain milik agen
tersebut; pengaturan ini tidak menggabungkan transkripnya.

Percakapan langsung pribadi dan percakapan UI eksplisit yang persisten dapat saling
menyediakan konteks yang relevan. Grup dan saluran tetap terpisah dalam kedua arah:
transkripnya bukan sumber pengingatan pribadi, dan balasan dalam
percakapan tersebut tidak menerima konteks transkrip pribadi. Percakapan saat ini
juga dikecualikan karena riwayatnya sudah dimuat.

Pengaturan ini tidak mengubah kunci sesi, cakupan DM, perutean, pengiriman, atau
`tools.sessions.visibility`. Memori ruang kerja bersama dalam `MEMORY.md` dan
`memory/*.md` juga mempertahankan perilakunya yang ada. Penyedia memori saat ini
harus mendukung pengingatan transkrip pribadi yang dilindungi; mesin konteks seperti
Lossless Claw tetap independen dan dapat berjalan bersamanya. Lihat
[Active Memory](/id/concepts/active-memory#remember-across-conversations) untuk detail
pengaturan dan runtime.

## Siklus hidup sesi

Sesi digunakan kembali hingga Anda mengatur ulangnya secara manual atau memilih kebijakan pengaturan ulang otomatis:

- **Tanpa pengaturan ulang otomatis** (default `mode: "none"`) - sesi mempertahankan
  `sessionId` yang sama; Compaction mengelola konteks aktif saat percakapan berkembang.
- **Pengaturan ulang harian** (`mode: "daily"`) - pilih sesi baru pada jam lokal yang
  dikonfigurasi (`session.reset.atHour`, default `4`, 0-23) di host Gateway. Kesegaran
  harian didasarkan pada waktu `sessionId` saat ini dimulai, bukan pada penulisan
  metadata berikutnya.
- **Pengaturan ulang saat menganggur** (`mode: "idle"`) - pilih sesi baru setelah `session.reset.idleMinutes`
  tanpa aktivitas. Kesegaran masa menganggur didasarkan pada interaksi pengguna/saluran nyata
  terakhir, sehingga peristiwa sistem Heartbeat, Cron, dan exec tidak mempertahankan
  sesi tetap aktif.
- **Pengaturan ulang manual** - ketik `/new` atau `/reset` dalam obrolan. `/new <model>` juga
  mengganti model.

Saat pengaturan ulang harian dan saat menganggur sama-sama dikonfigurasi, yang kedaluwarsa lebih dahulu akan berlaku.
Giliran Heartbeat, Cron, exec, dan peristiwa sistem lainnya dapat menulis metadata sesi,
tetapi penulisan tersebut tidak memperpanjang kesegaran pengaturan ulang harian atau saat menganggur. Saat pengaturan ulang
mengganti sesi, pemberitahuan peristiwa sistem dalam antrean untuk sesi lama akan
dibuang agar pembaruan latar belakang yang sudah usang tidak ditambahkan di awal prompt pertama dalam
sesi baru.

Sesi dengan sesi CLI aktif yang dimiliki penyedia mengikuti default tanpa pengaturan ulang otomatis
yang sama. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit saat sesi tersebut
harus kedaluwarsa berdasarkan pengatur waktu.

Aktifkan pengaturan ulang otomatis secara global, lalu timpa per jenis obrolan atau saluran:

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
`session.idleMinutes` tingkat atas lama tetap berfungsi sebagai alias kompatibilitas untuk
default mode menganggur saat tidak ada blok `session.reset`/`resetByType` yang ditetapkan.

## Lokasi status disimpan

- **Baris sesi runtime:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **File transkrip yang diarsipkan:** `~/.openclaw/agents/<agentId>/sessions/`
- **Sumber migrasi baris lama:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Baris sesi dalam basis data SQLite per agen menyimpan stempel waktu siklus hidup
secara terpisah:

- `sessionStartedAt`: waktu `sessionId` saat ini dimulai; pengaturan ulang harian menggunakan ini.
- `lastInteractionAt`: interaksi pengguna/saluran terakhir yang memperpanjang masa aktif saat menganggur.
- `updatedAt`: mutasi baris penyimpanan terakhir; berguna untuk pencantuman dan pemangkasan, tetapi bukan
  sumber otoritatif untuk kesegaran pengaturan ulang harian/saat menganggur.

Selama migrasi dari instalasi lama, proses mulai Gateway dan `openclaw doctor
--fix` mengimpor baris `sessions.json` lama serta riwayat JSONL transkrip aktif ke
SQLite secara otomatis. Baris tanpa `sessionStartedAt` diselesaikan dari
header sesi JSONL transkrip lama jika tersedia. Jika baris lama juga
tidak memiliki `lastInteractionAt`, kesegaran saat menganggur menggunakan waktu mulai sesi tersebut sebagai cadangan,
bukan penulisan pembukuan berikutnya. Gunakan `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` dan [Urutan migrasi
Doctor](/id/cli/doctor#session-sqlite-migration) saat Anda menginginkan bukti
pemeriksaan atau validasi secara eksplisit.

## Pemeliharaan sesi

OpenClaw membatasi penyimpanan sesi seiring waktu melalui `session.maintenance`, dengan default
yang ditampilkan:

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

Untuk batas `maxEntries` skala produksi, penulisan runtime Gateway menggunakan buffer
batas atas kecil dan membersihkannya kembali hingga batas yang dikonfigurasi secara bertahap.
Pembacaan penyimpanan sesi tidak memangkas atau membatasi entri saat Gateway dimulai, sehingga
proses mulai dan sesi Cron terisolasi tidak menanggung biaya pembersihan seluruh penyimpanan.
`openclaw sessions cleanup --enforce` langsung menerapkan batas tersebut.

Sesi pemeriksaan eksekusi model Gateway bersifat singkat secara default. Baris yang cocok dengan
`agent:*:explicit:model-run-<uuid>` menggunakan retensi tetap `24h`, tetapi pembersihan
dipicu oleh tekanan: pembersihan hanya menghapus baris pemeriksaan usang saat tekanan
pemeliharaan/batas entri sesi tercapai, dan berjalan sebelum batas usia entri usang
yang lebih luas serta batas entri. Sesi langsung, grup, utas, Cron, hook, Heartbeat,
ACP, dan subagen normal tidak mewarisi retensi 24h ini.

Pemeliharaan mempertahankan penunjuk percakapan eksternal yang tahan lama, termasuk sesi
grup dan sesi obrolan dengan cakupan utas, sambil tetap memungkinkan entri Cron sintetis,
hook, Heartbeat, ACP, dan subagen kedaluwarsa seiring waktu.

Jika sebelumnya Anda menggunakan isolasi DM lalu mengembalikan `session.dmScope` ke
`main`, pratinjau baris DM lama berkunci rekan dengan
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Penerapan flag yang sama
menghentikan baris DM langsung lama tersebut dan mempertahankan transkripnya sebagai
arsip yang dihapus.

Pratinjau setiap eksekusi pemeliharaan dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

| Perintah                    | Menampilkan                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | Jalur penyimpanan sesi dan aktivitas terbaru          |
| `openclaw sessions --json` | Semua sesi (filter dengan `--active <minutes>`) |
| `/status` dalam obrolan          | Penggunaan konteks, model, dan pengalih               |
| `/context list`            | Isi prompt sistem                    |

## Bacaan lebih lanjut

- [Pencarian sesi](/id/concepts/session-search) - pengingatan teks lengkap dari transkrip sebelumnya
- [Pemangkasan sesi](/id/concepts/session-pruning) - memangkas hasil alat
- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Alat sesi](/id/concepts/session-tool) - alat agen untuk pekerjaan lintas sesi
- [Pembahasan mendalam tentang pengelolaan sesi](/id/reference/session-management-compaction) -
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan konfigurasi lanjutan
- [Multiagen](/id/concepts/multi-agent) - perutean dan isolasi sesi antaragen
- [Tugas latar belakang](/id/automation/tasks) - cara pekerjaan terpisah membuat catatan tugas dengan referensi sesi
- [Perutean saluran](/id/channels/channel-routing) - cara pesan masuk dirutekan ke sesi

## Terkait

- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Alat sesi](/id/concepts/session-tool)
- [Antrean perintah](/id/concepts/queue)
