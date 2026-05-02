---
read_when:
    - Menyesuaikan kadensi Heartbeat atau perpesanan
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Lihat [Automation & Tasks](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** di sesi utama sehingga model dapat memunculkan apa pun yang perlu diperhatikan tanpa mengirim spam kepada Anda.

Heartbeat adalah giliran sesi utama terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terpisah (jalankan ACP, subagen, tugas cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih irama">
    Biarkan Heartbeat aktif (default adalah `30m`, atau `1h` untuk autentikasi OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau atur irama Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat checklist kecil `HEARTBEAT.md` atau blok `tasks:` di workspace agen.
  </Step>
  <Step title="Tentukan ke mana pesan Heartbeat harus dikirim">
    `target: "none"` adalah default; atur `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Penyetelan opsional">
    - Aktifkan pengiriman penalaran Heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika eksekusi Heartbeat hanya memerlukan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi untuk menghindari pengiriman seluruh riwayat percakapan pada setiap Heartbeat.
    - Batasi Heartbeat ke jam aktif (waktu lokal).

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

- Interval: `30m` (atau `1h` ketika autentikasi OAuth/token Anthropic adalah mode autentikasi yang terdeteksi, termasuk penggunaan ulang Claude CLI). Atur `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every` per agen; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt Heartbeat dikirim **verbatim** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika Heartbeat diaktifkan untuk agen default, dan eksekusi ditandai secara internal.
- Ketika Heartbeat dinonaktifkan dengan `0m`, eksekusi normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus Heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, Heartbeat dilewati sampai tick berikutnya di dalam jendela.
- Heartbeat secara otomatis menunda saat pekerjaan cron aktif atau mengantre. Atur `heartbeat.skipWhenBusy: true` untuk menunda juga pada lane tambahan yang sibuk (subagen atau pekerjaan perintah bersarang); ini berguna untuk Ollama lokal dan host runtime tunggal lain yang terbatas.

## Untuk apa prompt Heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Consider outstanding tasks" mendorong agen untuk meninjau tindak lanjut (inbox, kalender, pengingat, pekerjaan mengantre) dan memunculkan hal apa pun yang mendesak.
- **Check-in manusia**: "Checkup sometimes on your human during day time" mendorong pesan ringan sesekali "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [Zona Waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi eksekusi Heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin Heartbeat melakukan sesuatu yang sangat spesifik (mis. "periksa statistik Gmail PubSub" atau "verifikasi kesehatan gateway"), atur `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim verbatim).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Eksekusi Heartbeat yang mampu memakai tool dapat memanggil `heartbeat_respond` dengan `notify: false` untuk tanpa pembaruan terlihat, atau `notify: true` plus `notificationText` untuk peringatan. Jika ada, respons tool terstruktur lebih diprioritaskan daripada fallback teks.
- Selama eksekusi Heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack ketika muncul di **awal atau akhir** balasan. Token dihapus dan balasan dibuang jika konten yang tersisa **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, itu tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatan.

Di luar Heartbeat, `HEARTBEAT_OK` yang tidak sengaja muncul di awal/akhir pesan akan dihapus dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

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

- `agents.defaults.heartbeat` menetapkan perilaku Heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` menimpa default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) menimpa pengaturan per channel.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (jadi Anda dapat menetapkan default bersama sekali dan menimpanya per agen).

Contoh: dua agen, hanya agen kedua yang menjalankan Heartbeat.

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

Batasi Heartbeat ke jam kerja dalam zona waktu tertentu:

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

Di luar jendela ini (sebelum pukul 09.00 atau setelah pukul 22.00 waktu Eastern), Heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin Heartbeat berjalan sepanjang hari, gunakan salah satu pola ini:

- Hilangkan `activeHours` sepenuhnya (tanpa batasan jendela waktu; ini adalah perilaku default).
- Tetapkan jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan tetapkan waktu `start` dan `end` yang sama (misalnya `08:00` sampai `08:00`). Itu diperlakukan sebagai jendela tanpa lebar, sehingga Heartbeat selalu dilewati.
</Warning>

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

### Catatan bidang

<ParamField path="every" type="string">
  Interval Heartbeat (string durasi; unit default = menit).
</ParamField>
<ParamField path="model" type="string">
  Override model opsional untuk eksekusi Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Ketika diaktifkan, juga kirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Ketika true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Ketika true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat secara drastis. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Ketika true, eksekusi Heartbeat ditunda pada lane tambahan yang sibuk: subagen atau pekerjaan perintah bersarang. Lane cron selalu menunda Heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt cron dan Heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk eksekusi Heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke channel eksternal yang terakhir digunakan.
- channel eksplisit: channel atau id Plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan Heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman Heartbeat langsung/DM. `block`: tekan pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id khusus channel, mis. E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk channel multi-akun. Ketika `target: "last"`, id akun berlaku untuk channel terakhir yang diselesaikan jika mendukung akun; jika tidak, akan diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang diselesaikan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Menimpa isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan error tool selama run Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi run Heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` jika ditetapkan, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengidentifikasi IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, Heartbeat dilewati hingga tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Sesi dan perutean target">
    - Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` ketika `session.scope = "global"`. Tetapkan `session` untuk menimpa ke sesi kanal tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks run; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke kanal/penerima tertentu, tetapkan `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan kanal eksternal terakhir untuk sesi tersebut.
    - Pengiriman Heartbeat mengizinkan target langsung/DM secara default. Tetapkan `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran Heartbeat.
    - Jika antrean utama, lane sesi target, lane cron, atau tugas cron aktif sedang sibuk, Heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, lane subagen dan bersarang juga menunda run Heartbeat.
    - Jika `target` tidak menghasilkan tujuan eksternal, run tetap terjadi tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, run dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman alert yang dinonaktifkan, OpenClaw masih dapat menjalankan Heartbeat, memperbarui stempel waktu tugas jatuh tempo, memulihkan stempel waktu idle sesi, dan menekan payload alert keluar.
    - Jika target Heartbeat yang dihasilkan mendukung pengetikan, OpenClaw menampilkan pengetikan saat run Heartbeat aktif. Ini menggunakan target yang sama dengan tujuan output chat Heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus Heartbeat **tidak** menjaga sesi tetap aktif. Metadata Heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/kanal nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat Control UI dan WebChat menyembunyikan prompt Heartbeat dan acknowledgment khusus OK. Transkrip sesi yang mendasarinya masih dapat memuat giliran tersebut untuk audit/replay.
    - [Tugas latar belakang](/id/automation/tasks) terlepas dapat mengantrekan event sistem dan membangunkan Heartbeat ketika sesi utama perlu segera mengetahui sesuatu. Wake tersebut tidak membuat run Heartbeat menjadi tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, acknowledgment `HEARTBEAT_OK` ditekan sementara konten alert dikirim. Anda dapat menyesuaikan ini per kanal atau per akun:

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

Prioritas: per akun → per kanal → default kanal → default bawaan.

### Fungsi setiap flag

- `showOk`: mengirim acknowledgment `HEARTBEAT_OK` ketika model mengembalikan balasan khusus OK.
- `showAlerts`: mengirim konten alert ketika model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati run Heartbeat sepenuhnya (tidak ada panggilan model).

### Contoh per kanal vs per akun

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

| Tujuan                                      | Konfigurasi                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, alert aktif)   | _(tidak perlu konfigurasi)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)               | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu kanal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agen untuk membacanya. Anggap ini sebagai "checklist Heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada run normal, `HEARTBEAT.md` hanya disuntikkan ketika panduan Heartbeat diaktifkan untuk agen default. Menonaktifkan cadence Heartbeat dengan `0m` atau menetapkan `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header markdown seperti `# Heading`), OpenClaw melewati run Heartbeat untuk menghemat panggilan API. Lewatan itu dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file hilang, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga agar tetap sangat kecil (checklist singkat atau pengingat) untuk menghindari pembengkakan prompt.

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
    - OpenClaw mem-parsing blok `tasks:` dan memeriksa setiap tugas terhadap `interval`-nya sendiri.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt Heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, Heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
    - Konten non-tugas dalam `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Stempel waktu terakhir dijalankan tugas disimpan dalam state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Stempel waktu tugas hanya dimajukan setelah run Heartbeat menyelesaikan jalur balasan normalnya. Run `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna ketika Anda ingin satu file Heartbeat menyimpan beberapa pemeriksaan berkala tanpa membayar semuanya pada setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agen, jadi Anda dapat memberi tahu agen (dalam chat normal) sesuatu seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih singkat dan berfokus pada tindak lanjut inbox."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt Heartbeat Anda seperti: "Jika checklist menjadi usang, perbarui HEARTBEAT.md dengan yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — itu menjadi bagian dari konteks prompt.
</Warning>

## Wake manual (sesuai permintaan)

Anda dapat mengantrekan event sistem dan memicu Heartbeat langsung dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, wake manual menjalankan setiap Heartbeat agen tersebut segera.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, Heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Ketika diaktifkan, Heartbeat juga akan mengirim pesan terpisah yang diawali `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna ketika agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk melakukan ping kepada Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` untuk menghindari pengiriman riwayat percakapan penuh (~100K token turun menjadi ~2-5K per run).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Tetapkan `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan state internal.

## Overflow konteks setelah Heartbeat

Jika Heartbeat sebelumnya meninggalkan sesi yang ada pada model lokal yang lebih kecil, misalnya model Ollama dengan jendela 32k, dan giliran sesi utama berikutnya melaporkan overflow konteks, reset model runtime sesi kembali ke model utama yang dikonfigurasi. Pesan reset OpenClaw menyebutkan ini ketika model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Heartbeat saat ini mempertahankan model runtime sesi bersama yang ada setelah run selesai. Anda masih dapat menggunakan `isolatedSession: true` untuk menjalankan Heartbeat dalam sesi baru, menggabungkannya dengan `lightContext: true` untuk prompt terkecil, atau memilih model Heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terlepas dilacak
- [Zona waktu](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan Heartbeat
- [Pemecahan masalah](/id/automation/cron-jobs#troubleshooting) — debugging masalah otomasi
