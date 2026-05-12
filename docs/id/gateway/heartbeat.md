---
read_when:
    - Menyesuaikan frekuensi Heartbeat atau pengiriman pesan
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Lihat [Automasi](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** di sesi utama agar model dapat memunculkan apa pun yang perlu diperhatikan tanpa membanjiri Anda.

Heartbeat adalah giliran sesi utama yang terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terpisah (menjalankan ACP, subagen, pekerjaan cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih irama">
    Biarkan heartbeat tetap aktif (default adalah `30m`, atau `1h` untuk autentikasi OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau tetapkan irama Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat checklist kecil `HEARTBEAT.md` atau blok `tasks:` di ruang kerja agen.
  </Step>
  <Step title="Tentukan ke mana pesan heartbeat harus dikirim">
    `target: "none"` adalah default; setel `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Penyesuaian opsional">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika proses heartbeat hanya membutuhkan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi untuk menghindari pengiriman riwayat percakapan penuh pada setiap heartbeat.
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` ketika autentikasi OAuth/token Anthropic adalah mode autentikasi yang terdeteksi, termasuk penggunaan ulang Claude CLI). Setel `agents.defaults.heartbeat.every` atau per agen `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika heartbeat diaktifkan untuk agen default, dan proses ditandai secara internal.
- Ketika heartbeat dinonaktifkan dengan `0m`, proses normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, heartbeat dilewati hingga tick berikutnya di dalam jendela.
- Heartbeat otomatis ditunda saat pekerjaan cron aktif atau mengantre. Setel `heartbeat.skipWhenBusy: true` untuk juga menunda agen pada subagen berbasis kunci sesinya sendiri atau lane perintah bertingkat; agen saudara tidak lagi dijeda hanya karena agen lain memiliki pekerjaan subagen yang sedang berjalan.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Pertimbangkan tugas yang belum selesai" mendorong agen untuk meninjau tindak lanjut (inbox, kalender, pengingat, pekerjaan antrean) dan memunculkan apa pun yang mendesak.
- **Check-in manusia**: "Sesekali cek manusia Anda pada siang hari" mendorong pesan ringan sesekali seperti "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasikan (lihat [Zona Waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi proses heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya "periksa statistik Gmail PubSub" atau "verifikasi kesehatan gateway"), setel `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Proses heartbeat yang mampu memakai tool dapat sebagai gantinya memanggil `heartbeat_respond` dengan `notify: false` untuk tanpa pembaruan terlihat, atau `notify: true` plus `notificationText` untuk peringatan. Jika ada, respons tool terstruktur didahulukan atas fallback teks.
- Selama proses heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack ketika muncul di **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika konten yang tersisa **≤ `ackMaxChars`** (default: 300).
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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua kanal.
- `channels.<channel>.heartbeat` menimpa default kanal.
- `channels.<channel>.accounts.<id>.heartbeat` (kanal multi-akun) menimpa pengaturan per kanal.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat menetapkan default bersama sekali dan menimpanya per agen).

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

Batasi heartbeat ke jam kerja dalam zona waktu tertentu:

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

Di luar jendela ini (sebelum pukul 9 pagi atau setelah pukul 10 malam Waktu Timur), heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola ini:

- Hilangkan `activeHours` sepenuhnya (tanpa batasan jendela waktu; ini adalah perilaku default).
- Setel jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan setel waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Itu diperlakukan sebagai jendela tanpa lebar, sehingga heartbeat selalu dilewati.
</Warning>

### Contoh multi-akun

Gunakan `accountId` untuk menargetkan akun tertentu pada kanal multi-akun seperti Telegram:

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
  Interval heartbeat (string durasi; unit default = menit).
</ParamField>
<ParamField path="model" type="string">
  Override model opsional untuk proses heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Ketika diaktifkan, juga kirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Ketika true, proses heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap ruang kerja.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Ketika true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Ketika true, proses heartbeat ditunda pada lane sibuk tambahan milik agen tersebut: subagen berbasis kunci sesinya sendiri atau pekerjaan perintah bertingkat. Lane cron selalu menunda heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt cron dan heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk proses heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke kanal eksternal yang terakhir digunakan.
- kanal eksplisit: kanal atau id plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: hentikan pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id khusus kanal, misalnya E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk kanal multi-akun. Ketika `target: "last"`, id akun diterapkan pada kanal terakhir yang diselesaikan jika mendukung akun; jika tidak, id tersebut diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk kanal yang diselesaikan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Mengganti isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan kesalahan alat selama heartbeat berjalan.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi heartbeat agar berjalan hanya dalam jendela waktu tertentu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika disetel, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Identifier IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, heartbeat dilewati hingga tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` ketika `session.scope = "global"`. Setel `session` untuk mengganti ke sesi kanal tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks proses; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke kanal/penerima tertentu, setel `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan kanal eksternal terakhir untuk sesi tersebut.
    - Pengiriman heartbeat mengizinkan target langsung/DM secara default. Setel `directPolicy: "block"` untuk menekan pengiriman ke target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama, lane sesi target, lane cron, atau pekerjaan cron aktif sedang sibuk, heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, subagen berbasis kunci sesi milik agen ini dan lane bersarang juga menunda heartbeat. Lane sibuk milik agen lain tidak menunda agen ini.
    - Jika `target` tidak menghasilkan tujuan eksternal, proses tetap berjalan tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, proses dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw masih dapat menjalankan heartbeat, memperbarui stempel waktu tugas jatuh tempo, memulihkan stempel waktu idle sesi, dan menekan payload peringatan keluar.
    - Jika target heartbeat yang diselesaikan mendukung pengetikan, OpenClaw menampilkan pengetikan saat heartbeat berjalan aktif. Ini menggunakan target yang sama dengan tujuan output chat heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus heartbeat **tidak** menjaga sesi tetap aktif. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/kanal nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - UI Kontrol dan riwayat WebChat menyembunyikan prompt heartbeat dan pengakuan OK saja. Transkrip sesi yang mendasarinya masih dapat berisi giliran tersebut untuk audit/pemutaran ulang.
    - [Tugas latar belakang](/id/automation/tasks) yang dilepas dapat mengantrekan peristiwa sistem dan membangunkan heartbeat ketika sesi utama harus segera memperhatikan sesuatu. Wake tersebut tidak membuat heartbeat menjalankan tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, pengakuan `HEARTBEAT_OK` ditekan sementara konten peringatan dikirim. Anda dapat menyesuaikan ini per kanal atau per akun:

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

### Fungsi tiap flag

- `showOk`: mengirim pengakuan `HEARTBEAT_OK` ketika model mengembalikan balasan OK saja.
- `showAlerts`: mengirim konten peringatan ketika model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan peristiwa indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati proses heartbeat sepenuhnya (tanpa panggilan model).

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
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu konfigurasi)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)               | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu kanal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agen untuk membacanya. Anggap ini sebagai "daftar periksa heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada proses normal, `HEARTBEAT.md` hanya disuntikkan ketika panduan heartbeat diaktifkan untuk agen default. Menonaktifkan cadence heartbeat dengan `0m` atau menyetel `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header markdown seperti `# Heading`), OpenClaw melewati proses heartbeat untuk menghemat panggilan API. Pelewatan itu dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga agar tetap kecil (daftar periksa atau pengingat singkat) untuk menghindari pembengkakan prompt.

Contoh `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

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
    - OpenClaw mengurai blok `tasks:` dan memeriksa setiap tugas terhadap `interval`-nya sendiri.
    - Hanya tugas yang **jatuh tempo** disertakan dalam prompt heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
    - Konten non-tugas di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Stempel waktu terakhir berjalan tugas disimpan dalam state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Stempel waktu tugas hanya dimajukan setelah proses heartbeat menyelesaikan jalur balasan normalnya. Proses `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna ketika Anda ingin satu file heartbeat menampung beberapa pemeriksaan berkala tanpa membayar semuanya di setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agen, jadi Anda dapat memberi tahu agen (dalam chat normal) sesuatu seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih singkat dan berfokus pada tindak lanjut inbox."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat Anda seperti: "Jika daftar periksa menjadi usang, perbarui HEARTBEAT.md dengan yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — itu menjadi bagian dari konteks prompt.
</Warning>

## Wake manual (sesuai permintaan)

Anda dapat mengantrekan peristiwa sistem dan memicu heartbeat langsung dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, wake manual langsung menjalankan setiap heartbeat agen tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Ketika diaktifkan, heartbeat juga akan mengirim pesan terpisah dengan prefiks `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna ketika agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk menghubungi Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` untuk menghindari pengiriman riwayat percakapan penuh (~100K token turun menjadi ~2-5K per proses).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Setel `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan state internal.

## Overflow konteks setelah heartbeat

Jika heartbeat sebelumnya meninggalkan sesi yang ada pada model lokal yang lebih kecil, misalnya model Ollama dengan jendela 32k, dan giliran sesi utama berikutnya melaporkan overflow konteks, reset model runtime sesi kembali ke model primer yang dikonfigurasi. Pesan reset OpenClaw menyebutkan ini ketika model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Heartbeat saat ini mempertahankan model runtime yang ada milik sesi bersama setelah proses selesai. Anda masih dapat menggunakan `isolatedSession: true` untuk menjalankan heartbeat dalam sesi baru, menggabungkannya dengan `lightContext: true` untuk prompt terkecil, atau memilih model heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Otomasi](/id/automation) — semua mekanisme otomasi sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan yang dilepas dilacak
- [Zona Waktu](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan heartbeat
- [Pemecahan Masalah](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomasi
