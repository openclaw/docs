---
read_when:
    - Menyesuaikan kadensi Heartbeat atau pengiriman pesan
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T09:20:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs Cron?** Lihat [Otomatisasi & Tugas](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** di sesi utama agar model dapat memunculkan apa pun yang memerlukan perhatian tanpa mengirim spam kepada Anda.

Heartbeat adalah giliran sesi utama terjadwal — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas digunakan untuk pekerjaan terpisah (proses ACP, subagen, tugas Cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pick a cadence">
    Biarkan Heartbeat aktif (default adalah `30m`, atau `1h` untuk autentikasi OAuth/token Anthropic, termasuk penggunaan ulang Claude CLI) atau tetapkan irama Anda sendiri.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Buat daftar periksa kecil `HEARTBEAT.md` atau blok `tasks:` di workspace agen.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` adalah default; setel `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Optional tuning">
    - Aktifkan pengiriman penalaran Heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika proses Heartbeat hanya memerlukan `HEARTBEAT.md`.
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

- Interval: `30m` (atau `1h` saat autentikasi OAuth/token Anthropic terdeteksi sebagai mode autentikasi, termasuk penggunaan ulang Claude CLI). Setel `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every` per agen; gunakan `0m` untuk menonaktifkan.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt Heartbeat dikirim **verbatim** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya saat Heartbeat diaktifkan untuk agen default, dan proses ditandai secara internal.
- Saat Heartbeat dinonaktifkan dengan `0m`, proses normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus Heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, Heartbeat dilewati hingga tick berikutnya di dalam jendela.
- Heartbeat otomatis ditunda saat pekerjaan Cron aktif atau mengantre. Setel `heartbeat.skipWhenBusy: true` untuk menunda pada lane ekstra sibuk (pekerjaan subagen atau perintah bertingkat) juga; ini berguna untuk Ollama lokal dan host runtime tunggal lain yang terbatas.

## Untuk apa prompt Heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Consider outstanding tasks" mendorong agen meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan antrean) dan memunculkan apa pun yang mendesak.
- **Check-in manusia**: "Checkup sometimes on your human during day time" mendorong pesan ringan sesekali seperti "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang dikonfigurasi (lihat [Zona Waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi proses Heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin Heartbeat melakukan sesuatu yang sangat spesifik (mis. "periksa statistik Gmail PubSub" atau "verifikasi kesehatan gateway"), setel `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi kustom (dikirim verbatim).

## Kontrak respons

- Jika tidak ada yang memerlukan perhatian, balas dengan **`HEARTBEAT_OK`**.
- Proses Heartbeat yang mendukung tool dapat memanggil `heartbeat_respond` dengan `notify: false` untuk tanpa pembaruan terlihat, atau `notify: true` plus `notificationText` untuk peringatan. Jika ada, respons tool terstruktur diprioritaskan dibanding fallback teks.
- Selama proses Heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack saat muncul di **awal atau akhir** balasan. Token dihapus dan balasan dibuang jika sisa kontennya **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, itu tidak diperlakukan khusus.
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

### Cakupan dan presedensi

- `agents.defaults.heartbeat` mengatur perilaku Heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- `channels.defaults.heartbeat` mengatur default visibilitas untuk semua channel.
- `channels.<channel>.heartbeat` menggantikan default channel.
- `channels.<channel>.accounts.<id>.heartbeat` (channel multi-akun) menggantikan pengaturan per channel.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat menetapkan default bersama sekali dan menggantinya per agen).

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

Di luar jendela ini (sebelum pukul 09.00 atau setelah pukul 22.00 Eastern), Heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin Heartbeat berjalan sepanjang hari, gunakan salah satu pola ini:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan jendela waktu; ini adalah perilaku default).
- Tetapkan jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan tetapkan waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Itu diperlakukan sebagai jendela dengan lebar nol, sehingga Heartbeat selalu dilewati.
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
  Override model opsional untuk proses Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Saat diaktifkan, juga kirim pesan `Reasoning:` terpisah jika tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Saat true, proses Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Saat true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per Heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Saat true, proses Heartbeat ditunda pada lane ekstra sibuk: pekerjaan subagen atau perintah bertingkat. Lane Cron selalu menunda Heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt Cron dan Heartbeat pada saat yang sama.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk proses Heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke channel eksternal yang terakhir digunakan.
- channel eksplisit: channel atau id plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan Heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman Heartbeat langsung/DM. `block`: tekan pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id khusus channel, mis. E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk channel multi-akun. Saat `target: "last"`, id akun diterapkan ke channel terakhir yang di-resolve jika channel itu mendukung akun; jika tidak, akan diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang di-resolve, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Menggantikan isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, menekan payload peringatan kesalahan alat selama heartbeat dijalankan.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi heartbeat agar hanya berjalan dalam jendela waktu tertentu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur, jika tidak kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengenal IANA apa pun (misalnya `America/New_York`): digunakan langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
- Di luar jendela aktif, heartbeat dilewati hingga tick berikutnya di dalam jendela.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat berjalan di sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` saat `session.scope = "global"`. Atur `session` untuk mengganti ke sesi kanal tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks proses; pengiriman dikontrol oleh `target` dan `to`.
    - Untuk mengirim ke kanal/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan kanal eksternal terakhir untuk sesi tersebut.
    - Pengiriman heartbeat mengizinkan target langsung/DM secara default. Atur `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama, lane sesi target, lane Cron, atau tugas Cron aktif sedang sibuk, heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, lane subagen dan bertingkat juga menunda heartbeat.
    - Jika `target` tidak menghasilkan tujuan eksternal, proses tetap berjalan tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, proses dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw masih dapat menjalankan heartbeat, memperbarui stempel waktu tugas jatuh tempo, memulihkan stempel waktu idle sesi, dan menekan payload peringatan keluar.
    - Jika target heartbeat yang diselesaikan mendukung pengetikan, OpenClaw menampilkan pengetikan saat heartbeat berjalan aktif. Ini menggunakan target yang sama dengan tujuan output chat heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus heartbeat **tidak** menjaga sesi tetap aktif. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/kanal nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat Control UI dan WebChat menyembunyikan prompt heartbeat dan pengakuan hanya-OK. Transkrip sesi yang mendasarinya masih dapat berisi giliran tersebut untuk audit/pemutaran ulang.
    - [tugas latar belakang](/id/automation/tasks) terlepas dapat mengantrekan peristiwa sistem dan membangunkan heartbeat saat sesi utama perlu segera memperhatikan sesuatu. Bangun tersebut tidak membuat heartbeat menjalankan tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, pengakuan `HEARTBEAT_OK` ditekan sementara konten peringatan dikirim. Anda dapat menyesuaikannya per kanal atau per akun:

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

Prioritas: per-akun → per-kanal → default kanal → default bawaan.

### Fungsi tiap flag

- `showOk`: mengirim pengakuan `HEARTBEAT_OK` saat model mengembalikan balasan hanya-OK.
- `showAlerts`: mengirim konten peringatan saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan peristiwa indikator untuk permukaan status UI.

Jika **ketiganya** false, OpenClaw melewati heartbeat sepenuhnya (tanpa panggilan model).

### Contoh per-kanal vs per-akun

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
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif) | _(tidak perlu konfigurasi)_                                                       |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu kanal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default meminta agen untuk membacanya. Anggap sebagai "daftar periksa heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada proses normal, `HEARTBEAT.md` hanya disuntikkan saat panduan heartbeat diaktifkan untuk agen default. Menonaktifkan irama heartbeat dengan `0m` atau mengatur `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header markdown seperti `# Heading`), OpenClaw melewati heartbeat untuk menghemat panggilan API. Lewatan tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file hilang, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga tetap sangat kecil (daftar periksa singkat atau pengingat) untuk menghindari prompt yang membengkak.

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
    - Konten non-tugas di `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Stempel waktu terakhir dijalankan tugas disimpan dalam status sesi (`heartbeatTaskState`), sehingga interval bertahan melewati restart normal.
    - Stempel waktu tugas hanya dimajukan setelah heartbeat selesai menjalani jalur balasan normalnya. Proses `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file heartbeat menampung beberapa pemeriksaan berkala tanpa membayar semuanya di setiap tick.

### Bisakah agen memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file normal di workspace agen, jadi Anda dapat memberi tahu agen (dalam chat normal) sesuatu seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih pendek dan berfokus pada tindak lanjut kotak masuk."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat Anda seperti: "Jika daftar periksa menjadi usang, perbarui HEARTBEAT.md dengan yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — file ini menjadi bagian dari konteks prompt.
</Warning>

## Bangun manual (sesuai permintaan)

Anda dapat mengantrekan peristiwa sistem dan memicu heartbeat langsung dengan:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, bangun manual segera menjalankan heartbeat dari masing-masing agen tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman penalaran (opsional)

Secara default, heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah yang diawali `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa ia memutuskan untuk menghubungi Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktif di chat grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` untuk menghindari pengiriman riwayat percakapan penuh (~100K token turun menjadi ~2-5K per proses).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Atur `model` yang lebih murah (misalnya `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan status internal.

## Luapan konteks setelah heartbeat

Jika heartbeat menggunakan model lokal yang lebih kecil, misalnya model Ollama dengan jendela 32k, dan giliran sesi utama berikutnya melaporkan luapan konteks, periksa apakah heartbeat sebelumnya meninggalkan sesi pada model heartbeat. Pesan reset OpenClaw menyebutkan ini saat model runtime terakhir cocok dengan `heartbeat.model` yang dikonfigurasi.

Gunakan `isolatedSession: true` untuk menjalankan heartbeat dalam sesi baru, gabungkan dengan `lightContext: true` untuk prompt terkecil, atau pilih model heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi secara sekilas
- [Background Tasks](/id/automation/tasks) — cara pekerjaan terlepas dilacak
- [Timezone](/id/concepts/timezone) — cara zona waktu memengaruhi penjadwalan heartbeat
- [Troubleshooting](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
