---
read_when:
    - Menyesuaikan irama Heartbeat atau pengiriman pesan
    - Memutuskan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:30:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat atau Cron?** Lihat [Automation](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** dalam sesi utama agar model dapat memunculkan apa pun yang perlu diperhatikan tanpa membanjiri Anda.

Heartbeat adalah giliran sesi utama terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas digunakan untuk pekerjaan terpisah (jalankan ACP, subagen, pekerjaan Cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pick a cadence">
    Biarkan heartbeat aktif (default-nya `30m`, atau `1h` untuk autentikasi Anthropic OAuth/token, termasuk penggunaan ulang Claude CLI) atau tetapkan irama Anda sendiri.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Buat daftar periksa kecil `HEARTBEAT.md` atau blok `tasks:` di ruang kerja agen.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` adalah default; setel `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Optional tuning">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika jalankan heartbeat hanya memerlukan `HEARTBEAT.md`.
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` ketika autentikasi Anthropic OAuth/token adalah mode autentikasi yang terdeteksi, termasuk penggunaan ulang Claude CLI). Setel `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every` per agen; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: giliran heartbeat yang tidak disetel menggunakan `agents.defaults.timeoutSeconds` jika disetel. Jika tidak, giliran tersebut menggunakan irama heartbeat yang dibatasi hingga 600 detik. Setel `agents.defaults.heartbeat.timeoutSeconds` atau `agents.list[].heartbeat.timeoutSeconds` per agen untuk pekerjaan heartbeat yang lebih lama.
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika heartbeat diaktifkan untuk agen default, dan jalankan tersebut ditandai secara internal.
- Ketika heartbeat dinonaktifkan dengan `0m`, jalankan normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa di zona waktu yang dikonfigurasi. Di luar rentang tersebut, heartbeat dilewati sampai tick berikutnya di dalam rentang.
- Heartbeat otomatis ditunda saat pekerjaan Cron aktif atau mengantre. Setel `heartbeat.skipWhenBusy: true` untuk juga menunda agen pada subagen berbasis kunci sesi miliknya sendiri atau lane perintah bertingkat; agen saudara tidak lagi berhenti hanya karena agen lain memiliki pekerjaan subagen yang sedang berjalan.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Consider outstanding tasks" mendorong agen untuk meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan antrean) dan memunculkan apa pun yang mendesak.
- **Sapaan ke manusia**: "Checkup sometimes on your human during day time" mendorong pesan ringan sesekali "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [Zona Waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi jalankan heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya "check Gmail PubSub stats" atau "verify gateway health"), setel `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Jalankan heartbeat yang mampu menggunakan alat dapat sebagai gantinya memanggil `heartbeat_respond` dengan `notify: false` untuk tanpa pembaruan yang terlihat, atau `notify: true` plus `notificationText` untuk peringatan. Jika ada, respons alat terstruktur lebih diutamakan daripada fallback teks.
- Selama jalankan heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack ketika muncul di **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika konten yang tersisa **≤ `ackMaxChars`** (default: 300).
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
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

### Cakupan dan presedensi

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` menimpa default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) menimpa pengaturan per channel.

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

Di luar rentang ini (sebelum 09.00 atau setelah 22.00 Eastern), heartbeat dilewati. Tick terjadwal berikutnya di dalam rentang akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa batasan rentang waktu; ini adalah perilaku default).
- Setel rentang sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan setel waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Itu diperlakukan sebagai rentang tanpa lebar, sehingga heartbeat selalu dilewati.
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

### Catatan field

<ParamField path="every" type="string">
  Interval Heartbeat (string durasi; unit default = menit).
</ParamField>
<ParamField path="model" type="string">
  Override model opsional untuk jalankan heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Ketika diaktifkan, juga kirim pesan `Thinking` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Ketika true, jalankan heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap ruang kerja.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Ketika true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Mengurangi biaya token per heartbeat secara drastis. Gabungkan dengan `lightContext: true` untuk penghematan maksimal. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Ketika true, jalankan heartbeat ditunda pada lane sibuk tambahan agen tersebut: subagen berbasis kunci sesi miliknya sendiri atau pekerjaan perintah bertingkat. Lane Cron selalu menunda heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt Cron dan heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk jalankan heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke channel eksternal yang terakhir digunakan.
- channel eksplisit: id channel atau Plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: tekan pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id khusus channel, misalnya E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk channel multi-akun. Saat `target: "last"`, id akun berlaku pada channel terakhir yang terselesaikan jika channel tersebut mendukung akun; jika tidak, id akun diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang terselesaikan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Mengganti isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan kesalahan tool selama proses heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Detik maksimum yang diizinkan untuk satu giliran agen heartbeat sebelum dibatalkan. Biarkan tidak diatur untuk menggunakan `agents.defaults.timeoutSeconds` jika diatur, jika tidak menggunakan kadensi heartbeat yang dibatasi pada 600 detik.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi proses heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengidentifikasi IANA apa pun (mis. `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, heartbeat dilewati hingga tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` saat `session.scope = "global"`. Atur `session` untuk mengganti ke sesi channel tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks proses; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke channel/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi tersebut.
    - Pengiriman heartbeat mengizinkan target langsung/DM secara default. Atur `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama, lane sesi target, lane cron, atau job cron aktif sedang sibuk, heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, subagen berbasis kunci sesi agen ini dan lane bertingkat juga menunda proses heartbeat. Lane sibuk milik agen lain tidak menunda agen ini.
    - Jika `target` tidak terselesaikan ke tujuan eksternal apa pun, proses tetap terjadi tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, proses dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw masih dapat menjalankan heartbeat, memperbarui timestamp tugas jatuh tempo, memulihkan timestamp idle sesi, dan menekan payload peringatan keluar.
    - Jika target heartbeat yang terselesaikan mendukung pengetikan, OpenClaw menampilkan pengetikan saat proses heartbeat aktif. Ini menggunakan target yang sama dengan tujuan output chat heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus heartbeat **tidak** menjaga sesi tetap hidup. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/channel nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat Control UI dan WebChat menyembunyikan prompt heartbeat dan acknowledgement khusus OK. Transkrip sesi yang mendasarinya tetap dapat berisi giliran tersebut untuk audit/replay.
    - [Tugas latar belakang](/id/automation/tasks) yang dilepaskan dapat mengantrekan event sistem dan membangunkan heartbeat saat sesi utama perlu segera mengetahui sesuatu. Wake tersebut tidak membuat proses heartbeat menjadi tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, acknowledgement `HEARTBEAT_OK` ditekan sementara konten peringatan dikirim. Anda dapat menyesuaikan ini per channel atau per akun:

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

Prioritas: per-akun → per-channel → default channel → default bawaan.

### Apa fungsi setiap flag

- `showOk`: mengirim acknowledgement `HEARTBEAT_OK` saat model mengembalikan balasan khusus OK.
- `showAlerts`: mengirim konten peringatan saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati proses heartbeat sepenuhnya (tidak ada panggilan model).

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

| Tujuan                                      | Konfigurasi                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu konfigurasi)_                                                              |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)              | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu channel                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agen untuk membacanya. Anggap ini sebagai "checklist heartbeat" Anda: kecil, stabil, dan aman untuk dipertimbangkan setiap 30 menit.

Pada proses normal, `HEARTBEAT.md` hanya disisipkan saat panduan heartbeat diaktifkan untuk agen default. Menonaktifkan kadensi heartbeat dengan `0m` atau mengatur `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Pada harness Codex native, konten `HEARTBEAT.md` tidak disisipkan ke dalam giliran. Jika file ada dan memiliki konten non-whitespace, instruksi mode kolaborasi heartbeat mengarahkan Codex ke file tersebut dan memintanya membaca sebelum melanjutkan.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong, komentar Markdown/HTML, heading Markdown seperti `# Heading`, penanda fence, atau stub checklist kosong), OpenClaw melewati proses heartbeat untuk menghemat panggilan API. Lewatan tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga tetap kecil (checklist singkat atau pengingat) untuk menghindari prompt yang membengkak.

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
    - OpenClaw mengurai blok `tasks:` dan memeriksa setiap tugas terhadap `interval` miliknya.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
    - Konten non-tugas dalam `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Timestamp terakhir dijalankan tugas disimpan dalam state sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Timestamp tugas hanya dimajukan setelah proses heartbeat menyelesaikan jalur balasan normalnya. Proses `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file heartbeat memuat beberapa pemeriksaan berkala tanpa membayar semuanya pada setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agen, jadi Anda dapat memberi tahu agen (dalam chat normal) sesuatu seperti:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat Anda seperti: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — file tersebut menjadi bagian dari konteks prompt.
</Warning>

## Wake manual (sesuai permintaan)

Anda dapat mengantrekan event sistem dan memicu heartbeat segera dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, wake manual menjalankan masing-masing heartbeat agen tersebut segera.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah yang diawali `Thinking` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa agen memutuskan untuk menghubungi Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap matikan di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim riwayat percakapan penuh (~100K token turun menjadi ~2-5K per proses).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Atur `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan state internal.

## Overflow konteks setelah heartbeat

Jika heartbeat sebelumnya meninggalkan sesi yang ada pada model lokal yang lebih kecil, misalnya model Ollama dengan window 32k, dan giliran sesi utama berikutnya melaporkan overflow konteks, reset model runtime sesi kembali ke model utama yang dikonfigurasi. Pesan reset OpenClaw menyoroti ini saat model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Heartbeat saat ini mempertahankan model runtime sesi bersama yang sudah ada setelah proses selesai. Anda tetap dapat menggunakan `isolatedSession: true` untuk menjalankan heartbeat dalam sesi baru, menggabungkannya dengan `lightContext: true` untuk prompt terkecil, atau memilih model heartbeat dengan window konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Otomatisasi](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terpisah dilacak
- [Zona Waktu](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan Heartbeat
- [Pemecahan Masalah](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
