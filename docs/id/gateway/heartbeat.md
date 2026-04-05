---
read_when:
    - Menyesuaikan cadence atau pesan heartbeat
    - Menentukan antara heartbeat dan cron untuk tugas terjadwal
summary: Pesan polling heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T13:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** Lihat [Otomatisasi & Tugas](/id/automation) untuk panduan kapan menggunakan masing-masing.

Heartbeat menjalankan **giliran agent berkala** di sesi utama agar model dapat
menampilkan apa pun yang perlu diperhatikan tanpa mengirim spam kepada Anda.

Heartbeat adalah giliran sesi utama terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks).
Catatan tugas digunakan untuk pekerjaan yang terlepas (run ACP, subagent, pekerjaan cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Memulai cepat (pemula)

1. Biarkan heartbeat tetap aktif (default adalah `30m`, atau `1h` untuk auth OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau atur cadence Anda sendiri.
2. Buat checklist `HEARTBEAT.md` kecil atau blok `tasks:` di workspace agent (opsional tetapi disarankan).
3. Tentukan ke mana pesan heartbeat harus dikirim (`target: "none"` adalah default; atur `target: "last"` untuk merutekan ke kontak terakhir).
4. Opsional: aktifkan pengiriman reasoning heartbeat untuk transparansi.
5. Opsional: gunakan konteks bootstrap ringan jika run heartbeat hanya memerlukan `HEARTBEAT.md`.
6. Opsional: aktifkan sesi terisolasi agar riwayat percakapan penuh tidak dikirim di setiap heartbeat.
7. Opsional: batasi heartbeat ke jam aktif (waktu lokal).

Contoh config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        directPolicy: "allow", // default: izinkan target langsung/DM; atur "block" untuk menekan
        lightContext: true, // opsional: hanya menyuntikkan HEARTBEAT.md dari file bootstrap
        isolatedSession: true, // opsional: sesi baru di setiap run (tanpa riwayat percakapan)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opsional: kirim juga pesan `Reasoning:` terpisah
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` ketika auth OAuth/token Anthropic adalah mode auth yang terdeteksi, termasuk penggunaan ulang Claude CLI). Atur `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt
  sistem menyertakan bagian “Heartbeat” dan run ditandai secara internal.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi.
  Di luar jendela itu, heartbeat dilewati hingga tick berikutnya di dalam jendela.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: “Consider outstanding tasks” mendorong agent untuk meninjau
  tindak lanjut (inbox, kalender, pengingat, pekerjaan yang tertunda) dan menampilkan hal mendesak.
- **Check-in manusia**: “Checkup sometimes on your human during day time” mendorong
  pesan ringan sesekali seperti “ada yang Anda perlukan?”, tetapi menghindari spam malam hari
  dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [/concepts/timezone](/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi run heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya “periksa statistik
Gmail PubSub” atau “verifikasi kesehatan gateway”), atur `agents.defaults.heartbeat.prompt` (atau
`agents.list[].heartbeat.prompt`) ke isi kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Selama run heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack ketika muncul
  di **awal atau akhir** balasan. Token tersebut dihapus dan balasannya
  dibuang jika sisa kontennya **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, itu tidak diperlakukan
  secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatannya.

Di luar heartbeat, `HEARTBEAT_OK` yang muncul sendiri di awal/akhir pesan dihapus
dan dicatat di log; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m menonaktifkan)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (kirim pesan Reasoning: terpisah saat tersedia)
        lightContext: false, // default: false; true hanya menyimpan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat dalam sesi baru (tanpa riwayat percakapan)
        target: "last", // default: none | opsi: last | none | <id channel> (inti atau plugin, mis. "bluebubbles")
        to: "+15551234567", // override spesifik channel opsional
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
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agent yang memiliki blok `heartbeat`, **hanya agent-agent tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` menimpa default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) menimpa pengaturan per-channel.

### Heartbeat per-agent

Jika entri `agents.list[]` mana pun menyertakan blok `heartbeat`, **hanya agent-agent tersebut**
yang menjalankan heartbeat. Blok per-agent digabungkan di atas `agents.defaults.heartbeat`
(sehingga Anda dapat menetapkan default bersama sekali lalu menimpa per agent).

Contoh: dua agent, hanya agent kedua yang menjalankan heartbeat.

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
          timezone: "America/New_York", // opsional; menggunakan userTimezone Anda jika diatur, jika tidak zona waktu host
        },
      },
    },
  },
}
```

Di luar jendela ini (sebelum pukul 9 pagi atau setelah pukul 10 malam waktu Timur), heartbeat akan dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola ini:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan jendela waktu; ini perilaku default).
- Atur jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

Jangan atur `start` dan `end` ke waktu yang sama (misalnya `08:00` hingga `08:00`).
Itu diperlakukan sebagai jendela lebar nol, sehingga heartbeat selalu dilewati.

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
          to: "12345678:topic:42", // opsional: rute ke topik/thread tertentu
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
- `lightContext`: saat true, run heartbeat menggunakan konteks bootstrap ringan dan hanya menyimpan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimal. Routing pengiriman tetap menggunakan konteks sesi utama.
- `session`: kunci sesi opsional untuk run heartbeat.
  - `main` (default): sesi utama agent.
  - Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/cli/sessions)).
  - Format kunci sesi: lihat [Sesi](/concepts/session) dan [Grup](/id/channels/groups).
- `target`:
  - `last`: kirim ke channel eksternal terakhir yang digunakan.
  - channel eksplisit: channel atau id plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
  - `none` (default): jalankan heartbeat tetapi **jangan kirim** ke luar.
- `directPolicy`: mengontrol perilaku pengiriman langsung/DM:
  - `allow` (default): izinkan pengiriman heartbeat langsung/DM.
  - `block`: tekan pengiriman target langsung/DM (`reason=dm-blocked`).
- `to`: override penerima opsional (id spesifik channel, misalnya E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.
- `accountId`: id akun opsional untuk channel multi-akun. Saat `target: "last"`, id akun berlaku untuk channel terakhir yang teresolusikan jika mendukung akun; jika tidak, diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang teresolusikan, pengiriman dilewati.
- `prompt`: menimpa isi prompt default (tidak digabungkan).
- `ackMaxChars`: jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan error tool selama run heartbeat.
- `activeHours`: membatasi run heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM, eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.
  - Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak fallback ke zona waktu sistem host.
  - `"local"`: selalu menggunakan zona waktu sistem host.
  - Pengidentifikasi IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, fallback ke perilaku `"user"` di atas.
  - `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
  - Di luar jendela aktif, heartbeat dilewati hingga tick berikutnya di dalam jendela.

## Perilaku pengiriman

- Heartbeat secara default berjalan di sesi utama agent (`agent:<id>:<mainKey>`),
  atau `global` ketika `session.scope = "global"`. Atur `session` untuk menimpa ke
  sesi channel tertentu (Discord/WhatsApp/dll.).
- `session` hanya memengaruhi konteks run; pengiriman dikendalikan oleh `target` dan `to`.
- Untuk mengirim ke channel/penerima tertentu, atur `target` + `to`. Dengan
  `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi itu.
- Pengiriman heartbeat secara default mengizinkan target langsung/DM. Atur `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran heartbeat.
- Jika antrean utama sibuk, heartbeat dilewati dan dicoba lagi nanti.
- Jika `target` tidak teresolusikan ke tujuan eksternal mana pun, run tetap terjadi tetapi tidak ada
  pesan outbound yang dikirim.
- Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, run dilewati dari awal sebagai `reason=alerts-disabled`.
- Jika hanya pengiriman alert yang dinonaktifkan, OpenClaw masih dapat menjalankan heartbeat, memperbarui timestamp tugas yang jatuh tempo, memulihkan timestamp idle sesi, dan menekan payload alert keluar.
- Balasan khusus heartbeat **tidak** membuat sesi tetap hidup; `updatedAt` terakhir
  dipulihkan agar kedaluwarsa idle tetap berperilaku normal.
- [Tugas latar belakang](/id/automation/tasks) yang terlepas dapat mengantrikan event sistem dan membangunkan heartbeat ketika sesi utama perlu segera menyadari sesuatu. Bangun ini tidak membuat run heartbeat menjadi tugas latar belakang.

## Kontrol visibilitas

Secara default, ack `HEARTBEAT_OK` ditekan sementara konten alert tetap
dikirim. Anda dapat menyesuaikannya per channel atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (default)
      showAlerts: true # Tampilkan pesan alert (default)
      useIndicator: true # Emit event indikator (default)
  telegram:
    heartbeat:
      showOk: true # Tampilkan ack OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Tekan pengiriman alert untuk akun ini
```

Prioritas: per-akun → per-channel → default channel → default bawaan.

### Fungsi setiap flag

- `showOk`: mengirim ack `HEARTBEAT_OK` ketika model mengembalikan balasan yang hanya berisi OK.
- `showAlerts`: mengirim konten alert ketika model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati run heartbeat sepenuhnya (tidak ada panggilan model).

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
          showAlerts: false # tekan alert hanya untuk akun ops
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                   | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, alert aktif) | _(tidak perlu config)_                                                                   |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu channel                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu
agent untuk membacanya. Anggap ini sebagai “checklist heartbeat” Anda: kecil, stabil, dan
aman untuk disertakan setiap 30 menit.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header
markdown seperti `# Heading`), OpenClaw melewati run heartbeat untuk menghemat panggilan API.
Lewatan ini dilaporkan sebagai `reason=empty-heartbeat-file`.
Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga agar tetap kecil (checklist singkat atau pengingat) untuk menghindari prompt yang membengkak.

Contoh `HEARTBEAT.md`:

```md
# Checklist heartbeat

- Pemindaian cepat: ada yang mendesak di inbox?
- Jika siang hari, lakukan check-in ringan jika tidak ada hal lain yang tertunda.
- Jika suatu tugas terblokir, tuliskan _apa yang kurang_ dan tanyakan ke Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk
pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

Contoh:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Perilaku:

- OpenClaw mem-parse blok `tasks:` dan memeriksa setiap tugas terhadap `interval`-nya sendiri.
- Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
- Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
- Konten non-task di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas yang jatuh tempo.
- Timestamp terakhir-jalan tugas disimpan di state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
- Timestamp tugas hanya dimajukan setelah run heartbeat menyelesaikan jalur balasan normalnya. Run `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

Mode tugas berguna ketika Anda ingin satu file heartbeat memuat beberapa pemeriksaan berkala tanpa harus membayar semuanya di setiap tick.

### Apakah agent dapat memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file biasa di workspace agent, jadi Anda dapat memberi tahu
agent (dalam chat normal) sesuatu seperti:

- “Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian.”
- “Tulis ulang `HEARTBEAT.md` agar lebih singkat dan fokus pada tindak lanjut inbox.”

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit di
prompt heartbeat Anda seperti: “Jika checklist mulai usang, perbarui HEARTBEAT.md
dengan versi yang lebih baik.”

Catatan keamanan: jangan masukkan rahasia (API key, nomor telepon, token privat) ke
`HEARTBEAT.md` — file ini menjadi bagian dari konteks prompt.

## Bangun manual (sesuai permintaan)

Anda dapat mengantrikan event sistem dan memicu heartbeat segera dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agent memiliki `heartbeat` yang dikonfigurasi, bangun manual akan menjalankan setiap heartbeat
agent tersebut segera.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload “jawaban” final.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah berawalan
`Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna ketika agent
mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk menghubungi
Anda — tetapi ini juga dapat membocorkan detail internal lebih banyak daripada yang Anda inginkan. Sebaiknya tetap nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agent penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar riwayat percakapan penuh tidak dikirim (~100K token turun menjadi ~2-5K per run).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Atur `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya ingin pembaruan state internal.

## Terkait

- [Otomatisasi & Tugas](/id/automation) — semua mekanisme otomatisasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terlepas dilacak
- [Zona waktu](/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan heartbeat
- [Pemecahan masalah](/id/automation/cron-jobs#troubleshooting) — debugging masalah otomatisasi
