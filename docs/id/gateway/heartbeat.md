---
read_when:
    - Menyesuaikan frekuensi Heartbeat atau pengiriman pesan
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs Cron?** Lihat [Otomatisasi & Tugas](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** dalam sesi utama agar model dapat memunculkan hal apa pun yang perlu diperhatikan tanpa membanjiri Anda.

Heartbeat adalah giliran sesi utama yang terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas digunakan untuk pekerjaan terlepas (run ACP, subagen, pekerjaan Cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih irama">
    Biarkan heartbeat diaktifkan (default adalah `30m`, atau `1h` untuk autentikasi OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau tetapkan irama Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat daftar periksa kecil `HEARTBEAT.md` atau blok `tasks:` di workspace agen.
  </Step>
  <Step title="Tentukan ke mana pesan heartbeat harus dikirim">
    `target: "none"` adalah default; tetapkan `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Penyesuaian opsional">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika run heartbeat hanya memerlukan `HEARTBEAT.md`.
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

- Interval: `30m` (atau `1h` saat autentikasi OAuth/token Anthropic terdeteksi sebagai mode autentikasi, termasuk penggunaan ulang Claude CLI). Tetapkan `agents.defaults.heartbeat.every` atau per agen `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika heartbeat diaktifkan untuk agen default, dan run ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, run normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, heartbeat dilewati hingga tick berikutnya di dalam jendela.
- Heartbeat otomatis ditunda saat pekerjaan Cron aktif atau mengantre. Tetapkan `heartbeat.skipWhenBusy: true` untuk menunda pada lane tambahan yang sibuk (pekerjaan subagen atau perintah bersarang) juga; ini berguna untuk Ollama lokal dan host runtime tunggal lain yang terbatas.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Consider outstanding tasks" mendorong agen untuk meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan antrean) dan memunculkan hal apa pun yang mendesak.
- **Check-in manusia**: "Checkup sometimes on your human during day time" mendorong pesan ringan sesekali seperti "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [Zona Waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi run heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (mis. "check Gmail PubSub stats" atau "verify gateway health"), tetapkan `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Run heartbeat yang mampu menggunakan tool dapat sebagai gantinya memanggil `heartbeat_respond` dengan `notify: false` untuk tanpa pembaruan yang terlihat, atau `notify: true` plus `notificationText` untuk peringatan. Jika ada, respons tool terstruktur lebih diutamakan daripada fallback teks.
- Selama run heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack saat muncul di **awal atau akhir** balasan. Token dihapus dan balasan dibuang jika sisa konten **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, itu tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatan.

Di luar heartbeat, `HEARTBEAT_OK` yang terselip di awal/akhir pesan dihapus dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` dibuang.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` mengganti default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) mengganti pengaturan per channel.

### Heartbeat per agen

Jika entri `agents.list[]` apa pun menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat menetapkan default bersama sekali dan menimpanya per agen).

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

Di luar jendela ini (sebelum pukul 09.00 atau setelah pukul 22.00 Waktu Timur), Heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan seperti biasa.

### Pengaturan 24/7

Jika Anda ingin Heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa batasan jendela waktu; ini adalah perilaku default).
- Tetapkan jendela satu hari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan atur waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Itu diperlakukan sebagai jendela lebar nol, sehingga Heartbeat selalu dilewati.
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

### Catatan bidang

<ParamField path="every" type="string">
  Interval Heartbeat (string durasi; unit default = menit).
</ParamField>
<ParamField path="model" type="string">
  Override model opsional untuk eksekusi Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Saat diaktifkan, juga kirimkan pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Saat true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Saat true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per Heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Saat true, eksekusi Heartbeat ditunda pada lane ekstra sibuk: subagen atau pekerjaan perintah bertingkat. Lane Cron selalu menunda Heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt Cron dan Heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk eksekusi Heartbeat.

- `main` (bawaan): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke kanal eksternal yang terakhir digunakan.
- kanal eksplisit: kanal atau id plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (bawaan): jalankan Heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman Heartbeat langsung/DM. `block`: cegah pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Penggantian penerima opsional (id khusus kanal, misalnya E.164 untuk WhatsApp atau id obrolan Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk kanal multi-akun. Ketika `target: "last"`, id akun diterapkan ke kanal terakhir yang diselesaikan jika kanal tersebut mendukung akun; jika tidak, id tersebut diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk kanal yang diselesaikan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Mengganti isi prompt bawaan (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan kesalahan tool selama Heartbeat berjalan.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi Heartbeat agar berjalan dalam jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Identifier IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, Heartbeat dilewati sampai tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeat berjalan di sesi utama agent secara default (`agent:<id>:<mainKey>`), atau `global` saat `session.scope = "global"`. Atur `session` untuk menimpa ke sesi channel tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks run; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke channel/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi tersebut.
    - Pengiriman Heartbeat mengizinkan target direct/DM secara default. Atur `directPolicy: "block"` untuk menekan pengiriman target direct sambil tetap menjalankan giliran Heartbeat.
    - Jika antrean utama, lane sesi target, lane cron, atau job cron aktif sedang sibuk, Heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, lane subagent dan nested juga menunda Heartbeat berjalan.
    - Jika `target` tidak menghasilkan tujuan eksternal, run tetap terjadi tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, run dilewati di awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman alert yang dinonaktifkan, OpenClaw masih dapat menjalankan Heartbeat, memperbarui timestamp tugas jatuh tempo, memulihkan timestamp idle sesi, dan menekan payload alert keluar.
    - Jika target Heartbeat yang diselesaikan mendukung mengetik, OpenClaw menampilkan status mengetik saat Heartbeat berjalan aktif. Ini menggunakan target yang sama dengan yang akan dikirimi output chat oleh Heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Balasan khusus Heartbeat **tidak** menjaga sesi tetap hidup. Metadata Heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/channel nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - UI kontrol dan riwayat WebChat menyembunyikan prompt Heartbeat dan acknowledgment khusus OK. Transkrip sesi yang mendasari masih dapat memuat giliran tersebut untuk audit/replay.
    - [Background tasks](/id/automation/tasks) terlepas dapat mengantrekan event sistem dan membangunkan Heartbeat saat sesi utama perlu segera memperhatikan sesuatu. Wake tersebut tidak membuat Heartbeat menjalankan background task.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, acknowledgment `HEARTBEAT_OK` ditekan sementara konten alert dikirim. Anda dapat menyesuaikan ini per channel atau per akun:

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

Presedensi: per-akun → per-channel → default channel → default bawaan.

### Fungsi setiap flag

- `showOk`: mengirim acknowledgment `HEARTBEAT_OK` saat model mengembalikan balasan khusus OK.
- `showAlerts`: mengirim konten alert saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk surface status UI.

Jika **ketiganya** false, OpenClaw melewati Heartbeat run sepenuhnya (tidak ada panggilan model).

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

| Tujuan                                   | Konfig                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, alert aktif) | _(tidak perlu konfigurasi)_                                                            |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu channel                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agent untuk membacanya. Anggap ini sebagai "checklist Heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada run normal, `HEARTBEAT.md` hanya disuntikkan saat panduan Heartbeat diaktifkan untuk agent default. Menonaktifkan cadence Heartbeat dengan `0m` atau mengatur `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi efektif kosong (hanya baris kosong dan header markdown seperti `# Heading`), OpenClaw melewati Heartbeat run untuk menghemat panggilan API. Skip tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file hilang, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga agar tetap kecil (checklist singkat atau pengingat) untuk menghindari prompt membengkak.

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
  <Accordion title="Behavior">
    - OpenClaw mem-parse blok `tasks:` dan memeriksa setiap tugas terhadap `interval`-nya sendiri.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt Heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, Heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang terbuang.
    - Konten non-tugas di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Timestamp run terakhir tugas disimpan dalam state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Timestamp tugas hanya dimajukan setelah Heartbeat run menyelesaikan jalur balasan normalnya. Run `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file Heartbeat menampung beberapa pemeriksaan periodik tanpa membayar semuanya di setiap tick.

### Bisakah agent memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agent, jadi Anda dapat memberi tahu agent (dalam chat normal) sesuatu seperti:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt Heartbeat seperti: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token pribadi) ke dalam `HEARTBEAT.md` — itu menjadi bagian dari konteks prompt.
</Warning>

## Manual wake (sesuai permintaan)

Anda dapat mengantrekan event sistem dan memicu Heartbeat langsung dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agent memiliki `heartbeat` yang dikonfigurasi, manual wake langsung menjalankan masing-masing Heartbeat agent tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, Heartbeat hanya mengirim payload "answer" final.

Jika Anda ingin transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, Heartbeat juga akan mengirim pesan terpisah berprefiks `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agent mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk ping Anda — tetapi ini juga dapat membocorkan detail internal lebih banyak dari yang Anda inginkan. Sebaiknya tetap nonaktifkan di group chat.

## Kesadaran biaya

Heartbeat menjalankan giliran agent penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` untuk menghindari pengiriman riwayat percakapan penuh (~100K token turun menjadi ~2-5K per run).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Atur `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan state internal.

## Context overflow setelah Heartbeat

Jika Heartbeat sebelumnya meninggalkan sesi yang ada pada model lokal yang lebih kecil, misalnya model Ollama dengan window 32k, dan giliran sesi utama berikutnya melaporkan context overflow, reset model runtime sesi kembali ke model utama yang dikonfigurasi. Pesan reset OpenClaw menyebutkan ini saat model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Heartbeat saat ini mempertahankan model runtime sesi bersama yang ada setelah run selesai. Anda masih dapat menggunakan `isolatedSession: true` untuk menjalankan Heartbeat dalam sesi baru, menggabungkannya dengan `lightContext: true` untuk prompt terkecil, atau memilih model Heartbeat dengan context window yang cukup besar untuk sesi bersama.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi sekilas
- [Background Tasks](/id/automation/tasks) — bagaimana pekerjaan terlepas dilacak
- [Timezone](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan Heartbeat
- [Troubleshooting](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
