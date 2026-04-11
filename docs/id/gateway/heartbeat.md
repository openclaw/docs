---
read_when:
    - Menyesuaikan irama heartbeat atau pesannya
    - Menentukan antara heartbeat dan cron untuk tugas terjadwal
summary: Pesan polling heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-04-11T02:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4485072148753076d909867a623696829bf4a82dcd0479b95d5d0cae43100b0
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** Lihat [Automation & Tasks](/id/automation) untuk panduan kapan menggunakan masing-masing.

Heartbeat menjalankan **giliran agen berkala** di sesi utama agar model dapat
menampilkan apa pun yang perlu diperhatikan tanpa membuat Anda kewalahan.

Heartbeat adalah giliran sesi utama yang terjadwal — ini **tidak** membuat catatan [background task](/id/automation/tasks).
Catatan task digunakan untuk pekerjaan yang terlepas (ACP run, subagen, isolated cron job).

Pemecahan masalah: [Scheduled Tasks](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

1. Biarkan heartbeat tetap aktif (default adalah `30m`, atau `1h` untuk autentikasi Anthropic OAuth/token, termasuk penggunaan ulang Claude CLI) atau atur irama Anda sendiri.
2. Buat checklist `HEARTBEAT.md` kecil atau blok `tasks:` di workspace agen (opsional tetapi direkomendasikan).
3. Tentukan ke mana pesan heartbeat harus dikirim (`target: "none"` adalah default; setel `target: "last"` untuk mengarahkan ke kontak terakhir).
4. Opsional: aktifkan pengiriman reasoning heartbeat untuk transparansi.
5. Opsional: gunakan konteks bootstrap ringan jika heartbeat hanya perlu menjalankan `HEARTBEAT.md`.
6. Opsional: aktifkan sesi terisolasi agar riwayat percakapan penuh tidak dikirim pada setiap heartbeat.
7. Opsional: batasi heartbeat ke jam aktif (waktu lokal).

Contoh konfigurasi:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        directPolicy: "allow", // default: izinkan target direct/DM; setel "block" untuk menekan
        lightContext: true, // opsional: hanya menyisipkan HEARTBEAT.md dari file bootstrap
        isolatedSession: true, // opsional: sesi baru setiap run (tanpa riwayat percakapan)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opsional: kirim pesan `Reasoning:` terpisah juga
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` saat autentikasi Anthropic OAuth/token adalah mode autentikasi yang terdeteksi, termasuk penggunaan ulang Claude CLI). Setel `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. System
  prompt hanya menyertakan bagian “Heartbeat” saat heartbeat diaktifkan untuk agen
  default, dan run tersebut ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, run normal juga menghilangkan `HEARTBEAT.md`
  dari konteks bootstrap sehingga model tidak melihat instruksi yang khusus untuk heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi.
  Di luar jendela tersebut, heartbeat dilewati sampai tick berikutnya di dalam jendela.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Background task**: “Consider outstanding tasks” mendorong agen untuk meninjau
  tindak lanjut yang belum selesai (inbox, kalender, pengingat, pekerjaan dalam antrean) dan menampilkan apa pun yang mendesak.
- **Check-in ke manusia**: “Checkup sometimes on your human during day time” mendorong
  pesan ringan sesekali seperti “ada yang Anda butuhkan?”, tetapi menghindari spam di malam hari
  dengan menggunakan zona waktu lokal yang Anda konfigurasikan (lihat [/concepts/timezone](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [background task](/id/automation/tasks) yang selesai, tetapi run heartbeat itu sendiri tidak membuat catatan task.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya “periksa statistik Gmail PubSub”
atau “verifikasi kesehatan gateway”), setel `agents.defaults.heartbeat.prompt` (atau
`agents.list[].heartbeat.prompt`) ke isi khusus (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Selama run heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack saat muncul
  di **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika
  konten yang tersisa **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, token itu tidak diperlakukan
  secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatannya.

Di luar heartbeat, `HEARTBEAT_OK` yang muncul sendiri di awal/akhir pesan akan dihapus
dan dicatat dalam log; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m menonaktifkan)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (kirim pesan Reasoning: terpisah saat tersedia)
        lightContext: false, // default: false; true hanya menyimpan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat di sesi baru (tanpa riwayat percakapan)
        target: "last", // default: none | opsi: last | none | <id channel> (inti atau plugin, mis. "bluebubbles")
        to: "+15551234567", // opsional override khusus channel
        accountId: "ops-bot", // id channel multi-akun opsional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // jumlah karakter maksimum yang diizinkan setelah HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan prioritas

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` menimpa default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) menimpa per-channel.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut**
yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat`
(sehingga Anda dapat menetapkan default bersama sekali lalu menimpa per agen).

Contoh: dua agen, hanya agen kedua yang menjalankan heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Contoh jam aktif

Batasi heartbeat ke jam kerja dalam zona waktu tertentu:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opsional; menggunakan userTimezone Anda jika disetel, jika tidak zona waktu host
        },
      },
    },
  },
}
```

Di luar jendela ini (sebelum jam 9 pagi atau setelah jam 10 malam Eastern), heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan seperti biasa.

### Konfigurasi 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan jendela waktu; ini adalah perilaku default).
- Setel jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

Jangan setel `start` dan `end` ke waktu yang sama (misalnya `08:00` hingga `08:00`).
Itu diperlakukan sebagai jendela dengan lebar nol, sehingga heartbeat selalu dilewati.

### Contoh multi-akun

Gunakan `accountId` untuk menargetkan akun tertentu pada channel multi-akun seperti Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opsional: arahkan ke topic/thread tertentu
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Catatan field

- `every`: interval heartbeat (string durasi; unit default = menit).
- `model`: override model opsional untuk run heartbeat (`provider/model`).
- `includeReasoning`: saat diaktifkan, juga mengirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
- `lightContext`: saat true, run heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap heartbeat berjalan di sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Routing pengiriman tetap menggunakan konteks sesi utama.
- `session`: kunci sesi opsional untuk run heartbeat.
  - `main` (default): sesi utama agen.
  - Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [sessions CLI](/cli/sessions)).
  - Format kunci sesi: lihat [Sessions](/id/concepts/session) dan [Groups](/id/channels/groups).
- `target`:
  - `last`: kirim ke channel eksternal yang terakhir digunakan.
  - channel eksplisit: channel atau id plugin yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
  - `none` (default): jalankan heartbeat tetapi **jangan kirimkan** secara eksternal.
- `directPolicy`: mengontrol perilaku pengiriman direct/DM:
  - `allow` (default): izinkan pengiriman heartbeat direct/DM.
  - `block`: tekan pengiriman direct/DM (`reason=dm-blocked`).
- `to`: override penerima opsional (id khusus channel, misalnya E.164 untuk WhatsApp atau chat id Telegram). Untuk topic/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.
- `accountId`: id akun opsional untuk channel multi-akun. Saat `target: "last"`, id akun diterapkan ke channel terakhir yang telah di-resolve jika channel tersebut mendukung akun; jika tidak, nilai ini diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang telah di-resolve, pengiriman dilewati.
- `prompt`: menimpa isi prompt default (tidak digabungkan).
- `ackMaxChars`: jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan kesalahan tool selama run heartbeat.
- `activeHours`: membatasi run heartbeat ke jendela waktu tertentu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diperbolehkan untuk akhir hari), dan `timezone` opsional.
  - Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika disetel, jika tidak kembali ke zona waktu sistem host.
  - `"local"`: selalu menggunakan zona waktu sistem host.
  - Pengidentifikasi IANA apa pun (mis. `America/New_York`): digunakan secara langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
  - `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
  - Di luar jendela aktif, heartbeat dilewati sampai tick berikutnya di dalam jendela.

## Perilaku pengiriman

- Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`),
  atau `global` saat `session.scope = "global"`. Setel `session` untuk menimpa ke
  sesi channel tertentu (Discord/WhatsApp/dll.).
- `session` hanya memengaruhi konteks run; pengiriman dikendalikan oleh `target` dan `to`.
- Untuk mengirim ke channel/penerima tertentu, setel `target` + `to`. Dengan
  `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi tersebut.
- Pengiriman heartbeat mengizinkan target direct/DM secara default. Setel `directPolicy: "block"` untuk menekan pengiriman ke target direct sambil tetap menjalankan giliran heartbeat.
- Jika antrean utama sibuk, heartbeat dilewati dan dicoba lagi nanti.
- Jika `target` tidak di-resolve ke tujuan eksternal mana pun, run tetap terjadi tetapi tidak ada
  pesan keluar yang dikirim.
- Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, run dilewati sejak awal sebagai `reason=alerts-disabled`.
- Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw tetap dapat menjalankan heartbeat, memperbarui stempel waktu due-task, memulihkan stempel waktu idle sesi, dan menekan payload peringatan keluar.
- Balasan yang hanya untuk heartbeat **tidak** menjaga sesi tetap aktif; nilai `updatedAt`
  terakhir dipulihkan agar masa kedaluwarsa idle tetap berperilaku normal.
- [Background task](/id/automation/tasks) yang terlepas dapat mengantrekan system event dan membangunkan heartbeat ketika sesi utama perlu menyadari sesuatu dengan cepat. Bangun ini tidak membuat run heartbeat menjadi background task.

## Kontrol visibilitas

Secara default, ack `HEARTBEAT_OK` ditekan sementara konten peringatan tetap
dikirim. Anda dapat menyesuaikannya per channel atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (default)
      showAlerts: true # Tampilkan pesan peringatan (default)
      useIndicator: true # Pancarkan event indikator (default)
  telegram:
    heartbeat:
      showOk: true # Tampilkan acknowledgment OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Tekan pengiriman peringatan untuk akun ini
```

Prioritas: per-akun → per-channel → default channel → default bawaan.

### Fungsi masing-masing flag

- `showOk`: mengirim acknowledgment `HEARTBEAT_OK` saat model mengembalikan balasan yang hanya berisi OK.
- `showAlerts`: mengirim konten peringatan saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk tampilan status UI.

Jika **ketiganya** false, OpenClaw melewati run heartbeat sepenuhnya (tanpa pemanggilan model).

### Contoh per-channel vs per-akun

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # semua akun Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # tekan peringatan hanya untuk akun ops
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                   | Konfigurasi                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu konfigurasi)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu channel                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu
agen untuk membacanya. Anggap ini sebagai “checklist heartbeat” Anda: kecil, stabil, dan
aman untuk disertakan setiap 30 menit.

Pada run normal, `HEARTBEAT.md` hanya disisipkan saat panduan heartbeat
diaktifkan untuk agen default. Menonaktifkan irama heartbeat dengan `0m` atau
menyetel `includeSystemPromptSection: false` akan menghilangkannya dari konteks bootstrap
normal.

Jika `HEARTBEAT.md` ada tetapi pada dasarnya kosong (hanya baris kosong dan heading
markdown seperti `# Heading`), OpenClaw melewati run heartbeat untuk menghemat pemanggilan API.
Lewatan ini dilaporkan sebagai `reason=empty-heartbeat-file`.
Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Pertahankan ukurannya kecil (checklist pendek atau pengingat) untuk menghindari prompt yang membengkak.

Contoh `HEARTBEAT.md`:

```md
# Checklist heartbeat

- Pindai cepat: adakah hal mendesak di inbox?
- Jika siang hari, lakukan check-in ringan jika tidak ada hal lain yang tertunda.
- Jika sebuah tugas terhambat, tuliskan _apa yang kurang_ dan tanyakan ke Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk
pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

Contoh:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Periksa email belum dibaca yang mendesak dan tandai apa pun yang sensitif terhadap waktu."
- name: calendar-scan
  interval: 2h
  prompt: "Periksa rapat mendatang yang perlu persiapan atau tindak lanjut."

# Instruksi tambahan

- Buat peringatan tetap singkat.
- Jika tidak ada yang perlu diperhatikan setelah semua tugas jatuh tempo, balas HEARTBEAT_OK.
```

Perilaku:

- OpenClaw mengurai blok `tasks:` dan memeriksa setiap tugas terhadap `interval` miliknya sendiri.
- Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
- Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari pemanggilan model yang sia-sia.
- Konten non-task di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas yang jatuh tempo.
- Stempel waktu terakhir dijalankan untuk tugas disimpan di status sesi (`heartbeatTaskState`), sehingga interval tetap bertahan setelah restart normal.
- Stempel waktu tugas hanya dimajukan setelah run heartbeat menyelesaikan jalur balasan normalnya. Run `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

Mode task berguna saat Anda ingin satu file heartbeat menampung beberapa pemeriksaan berkala tanpa harus membayar semua pemeriksaan itu pada setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file biasa di workspace agen, jadi Anda dapat memberi tahu
agen (dalam chat normal) sesuatu seperti:

- “Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian.”
- “Tulis ulang `HEARTBEAT.md` agar lebih singkat dan fokus pada tindak lanjut inbox.”

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam
prompt heartbeat Anda seperti: “Jika checklist mulai usang, perbarui HEARTBEAT.md
dengan versi yang lebih baik.”

Catatan keamanan: jangan menaruh rahasia (API key, nomor telepon, token privat) ke dalam
`HEARTBEAT.md` — file ini menjadi bagian dari konteks prompt.

## Bangun manual (sesuai permintaan)

Anda dapat mengantrekan system event dan memicu heartbeat segera dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, bangun manual akan segera menjalankan heartbeat masing-masing agen tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload “jawaban” final.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah yang diawali
dengan `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna ketika agen
mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk menghubungi
Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya biarkan tetap
nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim riwayat percakapan penuh (~100K token turun menjadi ~2-5K per run).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Setel `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Buat `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya ingin pembaruan status internal.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Background Tasks](/id/automation/tasks) — cara pekerjaan terlepas dilacak
- [Timezone](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan heartbeat
- [Troubleshooting](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
