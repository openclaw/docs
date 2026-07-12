---
read_when:
    - Menyesuaikan interval atau pesan Heartbeat
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T14:10:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Lihat [Automasi](/id/automation) untuk panduan tentang kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen secara berkala** dalam sesi utama agar model dapat menampilkan apa pun yang memerlukan perhatian tanpa membanjiri Anda dengan pesan.

Heartbeat adalah giliran sesi utama yang terjadwal—ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terpisah (proses ACP, subagen, tugas cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih interval">
    Biarkan heartbeat diaktifkan (nilai default-nya adalah `30m`, atau `1h` ketika autentikasi OAuth/token Anthropic dikonfigurasi, termasuk penggunaan kembali Claude CLI) atau tetapkan interval Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat daftar periksa kecil `HEARTBEAT.md` atau blok `tasks:` di ruang kerja agen.
  </Step>
  <Step title="Tentukan tujuan pesan heartbeat">
    `target: "none"` adalah nilai default; tetapkan `target: "last"` untuk merutekannya ke kontak terakhir.
  </Step>
  <Step title="Penyesuaian opsional">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika proses heartbeat hanya memerlukan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi agar tidak mengirim seluruh riwayat percakapan pada setiap heartbeat.
    - Batasi heartbeat pada jam aktif (waktu setempat).

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

## Nilai default

- Interval: `30m`. Penerapan nilai default penyedia Anthropic menaikkan interval ini menjadi `1h` ketika mode autentikasi yang ditetapkan adalah OAuth/token (termasuk penggunaan kembali Claude CLI), tetapi hanya selama `heartbeat.every` belum ditetapkan. Tetapkan `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every` per agen; gunakan `0m` untuk menonaktifkannya.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Batas waktu: giliran heartbeat yang batas waktunya tidak ditetapkan menggunakan `agents.defaults.timeoutSeconds` jika tersedia. Jika tidak, giliran tersebut menggunakan interval heartbeat yang dibatasi hingga 600 detik. Tetapkan `agents.defaults.heartbeat.timeoutSeconds` atau `agents.list[].heartbeat.timeoutSeconds` per agen untuk pekerjaan heartbeat yang lebih lama.
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika heartbeat diaktifkan untuk agen default (dan `includeSystemPromptSection` bukan `false`), serta proses tersebut ditandai secara internal.
- Ketika heartbeat dinonaktifkan dengan `0m`, proses normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap agar model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar rentang tersebut, heartbeat dilewati hingga waktu eksekusi berikutnya yang berada dalam rentang.
- Heartbeat ditunda secara otomatis saat pekerjaan cron aktif atau sedang mengantre. Tetapkan `heartbeat.skipWhenBusy: true` untuk juga menunda agen ketika subagen berbasis kunci sesi atau jalur perintah bertingkat miliknya sedang berjalan; agen sejawat tidak lagi dijeda hanya karena agen lain sedang menjalankan pekerjaan subagen.

## Tujuan prompt heartbeat

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Pertimbangkan tugas yang belum selesai" mendorong agen untuk meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan yang mengantre) dan menampilkan apa pun yang mendesak.
- **Menanyakan kabar pengguna**: "Sesekali tanyakan kabar pengguna Anda pada siang hari" mendorong pesan ringan sesekali seperti "ada yang Anda perlukan?", tetapi menghindari banjir pesan pada malam hari dengan menggunakan zona waktu lokal yang Anda konfigurasi (lihat [Zona waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang telah selesai, tetapi proses heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya, "periksa statistik Gmail PubSub" atau "verifikasi kesehatan Gateway"), tetapkan `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi khusus (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang memerlukan perhatian, balas dengan **`HEARTBEAT_OK`**.
- Sebagai alternatif, proses heartbeat dapat memanggil `heartbeat_respond` dengan `notify: false` agar tidak ada pembaruan yang terlihat, atau `notify: true` beserta `notificationText` untuk peringatan. Jika tersedia, respons alat terstruktur lebih diutamakan daripada teks cadangan.
- Selama proses heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai konfirmasi ketika muncul pada **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika konten yang tersisa berjumlah **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, token tersebut tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; hanya kembalikan teks peringatan.

Di luar heartbeat, `HEARTBEAT_OK` yang tidak semestinya pada awal/akhir pesan akan dihapus dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan prioritas

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan nilai default visibilitas untuk semua kanal.
- `channels.<channel>.heartbeat` menggantikan nilai default kanal.
- `channels.<channel>.accounts.<id>.heartbeat` (kanal multiakun) menggantikan pengaturan per kanal.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat menetapkan nilai default bersama satu kali dan menggantinya per agen).

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

Batasi heartbeat pada jam kerja di zona waktu tertentu:

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

Di luar rentang ini (sebelum pukul 09.00 atau setelah pukul 22.00 Waktu Timur), heartbeat dilewati. Waktu eksekusi terjadwal berikutnya yang berada dalam rentang akan berjalan seperti biasa.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan rentang waktu; ini adalah perilaku default).
- Tetapkan rentang sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan tetapkan waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Ini diperlakukan sebagai rentang dengan lebar nol, sehingga heartbeat selalu dilewati.
</Warning>

### Contoh multiakun

Gunakan `accountId` untuk menargetkan akun tertentu pada kanal multiakun seperti Telegram:

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
  Interval heartbeat (string durasi; satuan default = menit).
</ParamField>
<ParamField path="model" type="string">
  Penggantian model opsional untuk proses heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Jika diaktifkan, pesan `Thinking` terpisah juga dikirim jika tersedia (format yang sama dengan `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Jika bernilai true, proses heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari berkas bootstrap ruang kerja.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Jika bernilai true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama dengan `sessionTarget: "isolated"` pada cron. Mengurangi biaya token per heartbeat secara drastis. Gabungkan dengan `lightContext: true` untuk penghematan maksimal. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Jika bernilai true, proses heartbeat ditunda ketika jalur tambahan agen tersebut sedang sibuk: subagen berbasis kunci sesi miliknya atau pekerjaan perintah bertingkat. Jalur cron selalu menunda heartbeat, bahkan tanpa tanda ini, sehingga host model lokal tidak menjalankan prompt cron dan heartbeat secara bersamaan.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk proses heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke kanal eksternal yang terakhir digunakan.
- kanal eksplisit: kanal atau id Plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan heartbeat, tetapi **jangan kirimkan** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: cegah pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Penggantian penerima opsional (id khusus saluran, misalnya E.164 untuk WhatsApp atau id obrolan Telegram). Untuk topik/utas Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk saluran multiakun. Ketika `target: "last"`, id akun diterapkan pada saluran terakhir yang ditentukan jika saluran tersebut mendukung akun; jika tidak, id tersebut diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk saluran yang ditentukan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Mengganti isi prompt bawaan (tidak digabungkan).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Menentukan apakah bagian prompt sistem `## Heartbeats` milik agen bawaan disisipkan. Atur ke `false` untuk mempertahankan perilaku runtime heartbeat (interval, pengiriman, HEARTBEAT.md) sekaligus menghilangkan instruksi heartbeat dari prompt sistem agen.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika bernilai true, menyembunyikan payload peringatan kesalahan alat selama eksekusi heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Jumlah detik maksimum yang diizinkan untuk satu giliran agen heartbeat sebelum dibatalkan. Biarkan tidak diatur untuk menggunakan `agents.defaults.timeoutSeconds` jika tersedia; jika tidak, gunakan interval heartbeat yang dibatasi hingga 600 detik.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi eksekusi heartbeat ke rentang waktu tertentu. Objek berisi `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diatur; jika tidak, kembali menggunakan zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengidentifikasi IANA apa pun (misalnya `America/New_York`): digunakan secara langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk rentang aktif; nilai yang sama diperlakukan sebagai rentang tanpa lebar (selalu berada di luar rentang).
- Di luar rentang aktif, heartbeat dilewati hingga tick berikutnya yang berada di dalam rentang.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat dijalankan di sesi utama agen secara bawaan (`agent:<id>:<mainKey>`), atau `global` ketika `session.scope = "global"`. Atur `session` untuk menggantinya dengan sesi saluran tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks eksekusi; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke saluran/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan saluran eksternal terakhir untuk sesi tersebut.
    - Pengiriman heartbeat mengizinkan target langsung/DM secara bawaan. Atur `directPolicy: "block"` untuk mencegah pengiriman ke target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama, jalur sesi target, jalur cron, atau tugas cron yang aktif sedang sibuk, heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, subagen berbasis kunci sesi dan jalur bertingkat milik agen ini juga menunda eksekusi heartbeat. Jalur sibuk milik agen lain tidak menunda agen ini.
    - Jika `target` tidak menghasilkan tujuan eksternal, eksekusi tetap berlangsung tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku pelewatan">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, eksekusi dilewati sejak awal dengan `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw tetap dapat menjalankan heartbeat, memperbarui stempel waktu tugas yang jatuh tempo, memulihkan stempel waktu sesi menganggur, dan menyembunyikan payload peringatan keluar.
    - Jika target heartbeat yang ditentukan mendukung indikator mengetik, OpenClaw menampilkan indikator mengetik selama eksekusi heartbeat aktif. Ini menggunakan target yang sama dengan tujuan keluaran obrolan heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan khusus heartbeat **tidak** menjaga sesi tetap aktif. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa karena menganggur menggunakan `lastInteractionAt` dari pesan pengguna/saluran nyata terakhir, sedangkan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat UI Kontrol dan WebChat menyembunyikan prompt heartbeat serta pengakuan yang hanya berisi OK. Transkrip sesi yang mendasarinya tetap dapat memuat giliran tersebut untuk audit/pemutaran ulang.
    - [Tugas latar belakang](/id/automation/tasks) yang dilepas dapat mengantrekan peristiwa sistem dan membangunkan heartbeat ketika sesi utama perlu segera mengetahui sesuatu. Pembangkitan tersebut tidak menjadikan eksekusi heartbeat sebagai tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara bawaan, pengakuan `HEARTBEAT_OK` disembunyikan sementara konten peringatan dikirim. Anda dapat menyesuaikannya per saluran atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (bawaan)
      showAlerts: true # Tampilkan pesan peringatan (bawaan)
      useIndicator: true # Pancarkan peristiwa indikator (bawaan)
  telegram:
    heartbeat:
      showOk: true # Tampilkan pengakuan OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Sembunyikan pengiriman peringatan untuk akun ini
```

Prioritas: per akun → per saluran → bawaan saluran → bawaan internal.

### Fungsi setiap flag

- `showOk`: mengirim pengakuan `HEARTBEAT_OK` ketika model mengembalikan balasan yang hanya berisi OK.
- `showAlerts`: mengirim konten peringatan ketika model mengembalikan balasan selain OK.
- `useIndicator`: memancarkan peristiwa indikator untuk permukaan status UI.

Jika **ketiganya** bernilai false, OpenClaw melewati eksekusi heartbeat sepenuhnya (tanpa pemanggilan model).

### Contoh per saluran dan per akun

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
          showAlerts: false # sembunyikan peringatan hanya untuk akun ops
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                           | Konfigurasi                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Perilaku bawaan (OK senyap, peringatan aktif)    | _(tidak memerlukan konfigurasi)_                                                         |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya di satu saluran                         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika terdapat berkas `HEARTBEAT.md` di ruang kerja, prompt bawaan memberi tahu agen untuk membacanya. Anggap ini sebagai "daftar periksa heartbeat" Anda: ringkas, stabil, dan aman untuk dipertimbangkan setiap 30 menit.

Pada eksekusi normal, `HEARTBEAT.md` hanya disisipkan ketika panduan heartbeat diaktifkan untuk agen bawaan. Menonaktifkan interval heartbeat dengan `0m` atau mengatur `includeSystemPromptSection: false` akan menghilangkannya dari konteks bootstrap normal.

Pada harness Codex native, konten `HEARTBEAT.md` tidak disisipkan ke dalam giliran seperti berkas bootstrap lainnya. Jika berkas tersebut ada dan memiliki konten selain spasi kosong, catatan mode kolaborasi heartbeat mengarahkan Codex ke berkas tersebut dan memintanya membacanya sebelum melanjutkan.

Jika `HEARTBEAT.md` ada tetapi pada dasarnya kosong (hanya baris kosong, komentar Markdown/HTML, judul Markdown seperti `# Heading`, penanda pagar, atau kerangka daftar periksa kosong), OpenClaw melewati eksekusi heartbeat untuk menghemat pemanggilan API. Pelewatan tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika berkas tidak ada, heartbeat tetap berjalan dan model memutuskan tindakan yang perlu dilakukan.

Jaga agar tetap ringkas (daftar periksa singkat atau pengingat) untuk menghindari pembengkakan prompt.

Contoh `HEARTBEAT.md`:

```md
# Daftar periksa heartbeat

- Pindai cepat: adakah hal mendesak di kotak masuk?
- Jika masih siang, lakukan pemeriksaan singkat jika tidak ada hal lain yang tertunda.
- Jika suatu tugas terhambat, catat _apa yang kurang_ dan tanyakan kepada Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

Contoh:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Periksa email mendesak yang belum dibaca dan tandai apa pun yang sensitif terhadap waktu."
- name: calendar-scan
  interval: 2h
  prompt: "Periksa rapat mendatang yang memerlukan persiapan atau tindak lanjut."

# Instruksi tambahan

- Buat peringatan tetap singkat.
- Jika tidak ada yang memerlukan perhatian setelah semua tugas yang jatuh tempo, balas HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Perilaku">
    - OpenClaw mengurai blok `tasks:` dan memeriksa setiap tugas berdasarkan `interval` masing-masing.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari pemanggilan model yang sia-sia.
    - Konten non-tugas dalam `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas yang jatuh tempo.
    - Stempel waktu eksekusi terakhir tugas disimpan dalam status sesi (`heartbeatTaskState`), sehingga interval tetap bertahan setelah mulai ulang normal.
    - Stempel waktu tugas hanya diperbarui setelah eksekusi heartbeat menyelesaikan jalur balasan normalnya. Eksekusi `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna ketika Anda ingin satu berkas heartbeat memuat beberapa pemeriksaan berkala tanpa membayar semua pemeriksaan tersebut pada setiap tick.

### Dapatkah agen memperbarui HEARTBEAT.md?

Ya—jika Anda memintanya.

`HEARTBEAT.md` hanyalah berkas biasa di ruang kerja agen, sehingga Anda dapat memberi tahu agen (dalam obrolan normal) seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih singkat dan berfokus pada tindak lanjut kotak masuk."

Jika Anda ingin hal ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat seperti: "Jika daftar periksa sudah usang, perbarui HEARTBEAT.md dengan daftar yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token pribadi) ke dalam `HEARTBEAT.md`—berkas tersebut menjadi bagian dari konteks prompt.
</Warning>

## Pembangkitan manual (sesuai permintaan)

Gunakan `openclaw system event` untuk mengantrekan peristiwa sistem dan secara opsional memicu heartbeat langsung:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Flag                         | Deskripsi                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Teks peristiwa sistem (wajib).                                                                                |
| `--mode <mode>`              | `now` menjalankan heartbeat langsung; `next-heartbeat` (bawaan) menunggu tick terjadwal berikutnya.          |
| `--session-key <sessionKey>` | Menargetkan sesi tertentu untuk peristiwa tersebut; secara bawaan menggunakan sesi utama agen.               |
| `--json`                     | Menghasilkan JSON.                                                                                           |

Jika tidak ada `--session-key` yang diberikan dan beberapa agen memiliki `heartbeat` yang dikonfigurasi, `--mode now` langsung menjalankan heartbeat untuk setiap agen tersebut.

Kontrol heartbeat terkait dalam grup CLI yang sama:

```bash
openclaw system heartbeat last     # tampilkan peristiwa heartbeat terakhir
openclaw system heartbeat enable   # aktifkan heartbeat
openclaw system heartbeat disable  # nonaktifkan heartbeat
```

## Pengiriman penalaran (opsional)

Secara default, heartbeat hanya mengirim payload "jawaban" akhir.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah dengan prefiks `Thinking` (format yang sama seperti `/reasoning on`). Ini dapat berguna ketika agen mengelola beberapa sesi/codex dan Anda ingin mengetahui alasan agen memutuskan untuk menghubungi Anda—tetapi fitur ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktifkan fitur ini dalam obrolan grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen secara penuh. Interval yang lebih pendek menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim seluruh riwayat percakapan (~100 ribu token menjadi ~2–5 ribu per proses).
- Gunakan `lightContext: true` untuk membatasi berkas bootstrap hanya pada `HEARTBEAT.md`.
- Tetapkan `model` yang lebih murah (misalnya `ollama/llama3.2:1b`).
- Jaga agar `HEARTBEAT.md` tetap ringkas.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan status internal.

## Konteks meluap setelah heartbeat

Heartbeat mempertahankan model runtime yang ada pada sesi bersama setelah proses selesai. Karena itu, heartbeat yang mengalihkan sesi ke model lokal yang lebih kecil (misalnya model Ollama dengan jendela 32k) dapat membuat model tersebut tetap digunakan untuk giliran sesi utama berikutnya. Jika giliran berikutnya kemudian melaporkan konteks meluap, dan model runtime terakhir sesi cocok dengan `heartbeat.model` yang dikonfigurasi, pesan pemulihan OpenClaw akan menyebut perembesan model heartbeat sebagai kemungkinan penyebab dan menyarankan perbaikan.

Untuk menghindarinya: gunakan `isolatedSession: true` untuk menjalankan heartbeat dalam sesi baru (secara opsional dikombinasikan dengan `lightContext: true` untuk prompt sekecil mungkin), atau pilih model heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Otomatisasi](/id/automation) - sekilas tentang semua mekanisme otomatisasi
- [Tugas Latar Belakang](/id/automation/tasks) - cara pekerjaan terpisah dilacak
- [Zona Waktu](/id/concepts/timezone) - cara zona waktu memengaruhi penjadwalan heartbeat
- [Pemecahan Masalah](/id/automation/cron-jobs#troubleshooting) - men-debug masalah otomatisasi
