---
read_when:
    - Menyesuaikan irama Heartbeat atau pengiriman pesan
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T09:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs Cron?** Lihat [Automation & Tasks](/id/automation) untuk panduan tentang kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** di sesi utama agar model dapat memunculkan apa pun yang perlu diperhatikan tanpa membanjiri Anda.

Heartbeat adalah giliran sesi utama terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terpisah (proses ACP, subagen, pekerjaan Cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih irama">
    Biarkan heartbeat aktif (default adalah `30m`, atau `1h` untuk autentikasi OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau atur irama Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat checklist `HEARTBEAT.md` kecil atau blok `tasks:` di ruang kerja agen.
  </Step>
  <Step title="Tentukan ke mana pesan heartbeat harus dikirim">
    `target: "none"` adalah default; atur `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Penyetelan opsional">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika proses heartbeat hanya memerlukan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi untuk menghindari pengiriman seluruh riwayat percakapan pada setiap heartbeat.
    - Batasi heartbeat ke jam aktif (waktu lokal).

  </Step>
</Steps>

Contoh konfigurasi:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` saat autentikasi OAuth/token Anthropic terdeteksi sebagai mode autentikasi, termasuk penggunaan ulang Claude CLI). Atur `agents.defaults.heartbeat.every` atau per agen `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **persis apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya saat heartbeat diaktifkan untuk agen default, dan proses ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, proses normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, heartbeat dilewati sampai tick berikutnya di dalam jendela.
- Heartbeat otomatis ditunda saat pekerjaan Cron aktif atau dalam antrean. Atur `heartbeat.skipWhenBusy: true` untuk menunda juga pada lane yang sangat sibuk (pekerjaan subagen atau perintah bertingkat); ini berguna untuk Ollama lokal dan host runtime tunggal terbatas lainnya.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Pertimbangkan tugas yang masih tertunda" mendorong agen untuk meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan dalam antrean) dan memunculkan apa pun yang mendesak.
- **Check-in manusia**: "Sesekali periksa manusia Anda pada siang hari" mendorong pesan ringan sesekali seperti "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [Zona waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi proses heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya "periksa statistik Gmail PubSub" atau "verifikasi kesehatan Gateway"), atur `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim persis apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Selama proses heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack saat muncul di **awal atau akhir** balasan. Token dihapus dan balasan dibuang jika konten yang tersisa **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, itu tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatan.

Di luar heartbeat, `HEARTBEAT_OK` yang tidak disengaja di awal/akhir pesan dihapus dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` dibuang.

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan prioritas

- `agents.defaults.heartbeat` mengatur perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` mengatur default visibilitas untuk semua saluran.
- `channels.<channel>.heartbeat` menimpa default saluran.
- `channels.<channel>.accounts.<id>.heartbeat` (saluran multi-akun) menimpa pengaturan per saluran.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat mengatur default bersama sekali dan menimpanya per agen).

Contoh: dua agen, hanya agen kedua yang menjalankan heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
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

Batasi heartbeat ke jam kerja di zona waktu tertentu:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Di luar jendela ini (sebelum pukul 09.00 atau setelah pukul 22.00 Waktu Timur), heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan seperti biasa.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola ini:

- Hilangkan `activeHours` sepenuhnya (tidak ada pembatasan jendela waktu; ini adalah perilaku default).
- Atur jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan atur waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Itu diperlakukan sebagai jendela dengan lebar nol, sehingga heartbeat selalu dilewati.
</Warning>

### Contoh multi-akun

Gunakan `accountId` untuk menargetkan akun tertentu pada saluran multi-akun seperti Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
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

<ParamField path="every" type="string">
  Interval Heartbeat (string durasi; unit default = menit).
</ParamField>
<ParamField path="model" type="string">
  Override model opsional untuk proses heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Saat diaktifkan, juga kirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Saat true, proses heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap ruang kerja.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Saat true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Saat true, proses heartbeat ditunda pada lane yang sangat sibuk: pekerjaan subagen atau perintah bertingkat. Lane Cron selalu menunda heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt Cron dan heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk proses heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke saluran eksternal yang terakhir digunakan.
- saluran eksplisit: saluran atau id Plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: tekan pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id khusus saluran, misalnya E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk saluran multi-akun. Saat `target: "last"`, id akun diterapkan ke saluran terakhir yang diselesaikan jika saluran itu mendukung akun; jika tidak, id tersebut diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk saluran yang diselesaikan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Menimpa isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan kesalahan alat selama proses Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi proses Heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengidentifikasi IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, Heartbeat dilewati sampai tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` saat `session.scope = "global"`. Atur `session` untuk mengganti ke sesi channel tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks eksekusi; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke channel/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi tersebut.
    - Pengiriman Heartbeat mengizinkan target langsung/DM secara default. Atur `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran Heartbeat.
    - Jika antrean utama, jalur sesi target, jalur Cron, atau tugas Cron aktif sedang sibuk, Heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, jalur subagen dan bertingkat juga menunda proses Heartbeat.
    - Jika `target` tidak menghasilkan tujuan eksternal, eksekusi tetap terjadi tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Perilaku visibilitas dan lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, proses dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw masih dapat menjalankan Heartbeat, memperbarui timestamp tugas jatuh tempo, memulihkan timestamp idle sesi, dan menekan payload peringatan keluar.
    - Jika target Heartbeat yang diselesaikan mendukung pengetikan, OpenClaw menampilkan pengetikan saat proses Heartbeat aktif. Ini menggunakan target yang sama dengan tujuan output chat Heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus Heartbeat **tidak** membuat sesi tetap hidup. Metadata Heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/channel nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat Control UI dan WebChat menyembunyikan prompt Heartbeat dan pengakuan OK-saja. Transkrip sesi dasarnya masih dapat berisi giliran tersebut untuk audit/pemutaran ulang.
    - [Tugas latar belakang](/id/automation/tasks) yang terlepas dapat memasukkan event sistem ke antrean dan membangunkan Heartbeat saat sesi utama perlu segera mengetahui sesuatu. Wake tersebut tidak membuat proses Heartbeat menjadi tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, pengakuan `HEARTBEAT_OK` ditekan sementara konten peringatan dikirim. Anda dapat menyesuaikan ini per channel atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Prioritas: per akun → per channel → default channel → default bawaan.

### Fungsi tiap flag

- `showOk`: mengirim pengakuan `HEARTBEAT_OK` saat model mengembalikan balasan OK-saja.
- `showAlerts`: mengirim konten peringatan saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati proses Heartbeat sepenuhnya (tanpa panggilan model).

### Contoh per channel vs per akun

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                   | Konfigurasi                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu konfigurasi)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu channel                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agen untuk membacanya. Anggap ini sebagai "daftar periksa Heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada proses normal, `HEARTBEAT.md` hanya diinjeksi saat panduan Heartbeat diaktifkan untuk agen default. Menonaktifkan cadence Heartbeat dengan `0m` atau mengatur `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi efektif kosong (hanya baris kosong dan header markdown seperti `# Heading`), OpenClaw melewati proses Heartbeat untuk menghemat panggilan API. Lewatan tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file tidak ada, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga tetap kecil (daftar periksa singkat atau pengingat) untuk menghindari pembengkakan prompt.

Contoh `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk pemeriksaan berbasis interval di dalam Heartbeat itu sendiri.

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

<AccordionGroup>
  <Accordion title="Perilaku">
    - OpenClaw mem-parse blok `tasks:` dan memeriksa setiap tugas terhadap `interval` miliknya sendiri.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt Heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, Heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
    - Konten non-tugas di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Timestamp terakhir dijalankan tugas disimpan dalam state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Timestamp tugas hanya dimajukan setelah proses Heartbeat menyelesaikan jalur balasan normalnya. Proses `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file Heartbeat menyimpan beberapa pemeriksaan berkala tanpa membayar semuanya pada setiap tick.

### Dapatkah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agen, jadi Anda dapat memberi tahu agen (dalam chat normal) sesuatu seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih singkat dan berfokus pada tindak lanjut inbox."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit di prompt Heartbeat Anda seperti: "Jika daftar periksa menjadi usang, perbarui HEARTBEAT.md dengan yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — itu menjadi bagian dari konteks prompt.
</Warning>

## Wake manual (sesuai permintaan)

Anda dapat memasukkan event sistem ke antrean dan memicu Heartbeat langsung dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, wake manual menjalankan tiap Heartbeat agen tersebut segera.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman penalaran (opsional)

Secara default, Heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, Heartbeat juga akan mengirim pesan terpisah berawalan `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa agen memutuskan untuk melakukan ping kepada Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap matikan di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` untuk menghindari pengiriman riwayat percakapan penuh (~100K token turun menjadi ~2-5K per proses).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Tetapkan `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan state internal.

## Overflow konteks setelah Heartbeat

Jika Heartbeat menggunakan model lokal yang lebih kecil, misalnya model Ollama dengan jendela 32k, dan giliran sesi utama berikutnya melaporkan overflow konteks, periksa apakah Heartbeat sebelumnya meninggalkan sesi pada model Heartbeat. Pesan reset OpenClaw menyebutkan ini saat model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Gunakan `isolatedSession: true` untuk menjalankan Heartbeat dalam sesi baru, gabungkan dengan `lightContext: true` untuk prompt terkecil, atau pilih model Heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — cara kerja terlepas dilacak
- [Zona Waktu](/id/concepts/timezone) — cara zona waktu memengaruhi penjadwalan Heartbeat
- [Pemecahan Masalah](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
