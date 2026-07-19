---
read_when:
    - Menyesuaikan frekuensi atau pesan Heartbeat
    - Memilih antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-07-19T05:05:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84129f3660ca730698dcda2e8ddf04dce909d3e3a4a9823e886eab53be52f61a
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Lihat [Automasi](/id/automation) untuk panduan kapan harus menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** dalam sesi utama agar model dapat memunculkan apa pun yang memerlukan perhatian tanpa membanjiri Anda dengan pesan.

Heartbeat adalah giliran sesi utama yang dijadwalkan—ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terpisah (proses ACP, subagen, tugas cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih interval">
    Biarkan heartbeat tetap aktif (nilai default adalah `30m`, atau `1h` saat autentikasi OAuth/token Anthropic dikonfigurasi, termasuk penggunaan ulang Claude CLI) atau tetapkan interval Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat daftar periksa `HEARTBEAT.md` singkat atau blok `tasks:` di ruang kerja agen.
  </Step>
  <Step title="Tentukan tujuan pesan heartbeat">
    `target: "none"` adalah nilai default; tetapkan `target: "last"` untuk merutekannya ke kontak terakhir.
  </Step>
  <Step title="Penyesuaian opsional">
    - Aktifkan pengiriman penalaran heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika proses heartbeat hanya memerlukan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi agar tidak mengirim seluruh riwayat percakapan pada setiap heartbeat.
    - Batasi heartbeat ke jam aktif (waktu setempat).

  </Step>
</Steps>

Contoh konfigurasi:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (nilai default adalah "none")
        directPolicy: "allow", // default: izinkan target langsung/DM; tetapkan "block" untuk menekan
        lightContext: true, // opsional: hanya masukkan HEARTBEAT.md dari berkas bootstrap
        isolatedSession: true, // opsional: sesi baru pada setiap proses (tanpa riwayat percakapan)
        skipWhenBusy: true, // opsional: tunda juga saat jalur subagen atau jalur bertingkat agen ini sedang sibuk
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opsional: kirim juga pesan `Thinking` terpisah
      },
    },
  },
}
```

## Nilai default

- Interval: `30m`. Penerapan nilai default penyedia Anthropic menaikkan nilai ini menjadi `1h` saat mode autentikasi yang ditentukan adalah OAuth/token (termasuk penggunaan ulang Claude CLI), tetapi hanya selama `heartbeat.every` belum ditetapkan. Tetapkan `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every` per agen; gunakan `0m` untuk menonaktifkannya.
- Isi prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Batas waktu: giliran heartbeat tanpa nilai yang ditetapkan menggunakan `agents.defaults.timeoutSeconds` jika tersedia. Jika tidak, giliran tersebut menggunakan interval heartbeat yang dibatasi hingga 600 detik. Tetapkan `agents.defaults.heartbeat.timeoutSeconds` atau `agents.list[].heartbeat.timeoutSeconds` per agen untuk pekerjaan heartbeat yang lebih lama.
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya saat heartbeat diaktifkan untuk agen default (dan `includeSystemPromptSection` bukan `false`), serta proses tersebut ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, proses normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap agar model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar rentang tersebut, heartbeat dilewati hingga waktu pemicu berikutnya yang berada dalam rentang.
- Heartbeat secara otomatis ditunda selama pekerjaan cron aktif atau dalam antrean. Tetapkan `heartbeat.skipWhenBusy: true` untuk juga menunda agen saat subagennya sendiri yang berkunci sesi atau jalur perintah bertingkat sedang berjalan; agen lain tidak lagi dijeda hanya karena agen lain memiliki pekerjaan subagen yang sedang berlangsung.

## Kegunaan prompt heartbeat

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Pertimbangkan tugas yang belum selesai" mendorong agen untuk meninjau tindak lanjut (kotak masuk, kalender, pengingat, pekerjaan dalam antrean) dan memunculkan apa pun yang mendesak.
- **Pemeriksaan kondisi pengguna**: "Sesekali periksa kondisi pengguna Anda pada siang hari" mendorong pengiriman pesan ringan "ada yang Anda perlukan?" sesekali, tetapi menghindari pesan berlebihan pada malam hari dengan menggunakan zona waktu setempat yang dikonfigurasi (lihat [Zona waktu](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi proses heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya, "periksa statistik Gmail PubSub" atau "verifikasi kondisi gateway"), tetapkan `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke isi khusus (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang memerlukan perhatian, balas dengan **`HEARTBEAT_OK`**.
- Sebagai gantinya, proses heartbeat dapat memanggil `heartbeat_respond` dengan `notify: false` jika tidak ada pembaruan yang terlihat, atau `notify: true` beserta `notificationText` untuk peringatan. Jika tersedia, respons alat terstruktur lebih diutamakan daripada teks cadangan.
- Hasil `heartbeat_respond` yang bermakna dengan `notify: false` tetap senyap, tetapi diingat sebagai konteks internal terbatas untuk giliran pengguna berikutnya dalam sesi tersebut. Konfirmasi `no_change` dan notifikasi yang terlihat tidak disimpan dengan cara ini.
- Selama proses heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai konfirmasi jika muncul pada **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika konten yang tersisa berjumlah **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, token tersebut tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; hanya kembalikan teks peringatan.

Di luar heartbeat, `HEARTBEAT_OK` yang tidak disengaja pada awal/akhir pesan akan dihapus dan dicatat; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m menonaktifkan)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (kirim pesan Thinking terpisah jika tersedia)
        lightContext: false, // default: false; true hanya mempertahankan HEARTBEAT.md dari berkas bootstrap ruang kerja
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat dalam sesi baru (tanpa riwayat percakapan)
        skipWhenBusy: false, // default: false; true juga menunggu jalur subagen/bertingkat agen ini
        target: "last", // default: none | opsi: last | none | <channel id> (inti atau plugin, misalnya "imessage")
        to: "+15551234567", // penggantian khusus saluran opsional
        accountId: "ops-bot", // id saluran multiakun opsional
        prompt: "Baca HEARTBEAT.md jika tersedia (konteks ruang kerja). Ikuti dengan ketat. Jangan menyimpulkan atau mengulangi tugas lama dari percakapan sebelumnya. Jika tidak ada yang memerlukan perhatian, balas HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false menghilangkan bagian prompt sistem ## Heartbeats untuk agen default
        ackMaxChars: 300, // jumlah karakter maksimum yang diizinkan setelah HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan urutan prioritas

- `agents.defaults.heartbeat` menetapkan perilaku heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan nilai default visibilitas untuk semua saluran.
- `channels.<channel>.heartbeat` menggantikan nilai default saluran.
- `channels.<channel>.accounts.<id>.heartbeat` (saluran multiakun) menggantikan pengaturan per saluran.

### Heartbeat per agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat. Blok per agen digabungkan di atas `agents.defaults.heartbeat` (sehingga Anda dapat menetapkan nilai default bersama sekali saja dan menggantinya per agen).

Contoh: dua agen, hanya agen kedua yang menjalankan heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // pengiriman eksplisit ke kontak terakhir (nilai default adalah "none")
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
          prompt: "Baca HEARTBEAT.md jika tersedia (konteks ruang kerja). Ikuti dengan ketat. Jangan menyimpulkan atau mengulangi tugas lama dari percakapan sebelumnya. Jika tidak ada yang memerlukan perhatian, balas HEARTBEAT_OK.",
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
        target: "last", // pengiriman eksplisit ke kontak terakhir (nilai default adalah "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opsional; menggunakan userTimezone Anda jika ditetapkan, jika tidak menggunakan zona waktu host
        },
      },
    },
  },
}
```

Di luar rentang ini (sebelum pukul 9 pagi atau setelah pukul 10 malam Waktu Timur), heartbeat dilewati. Waktu pemicu terjadwal berikutnya dalam rentang tersebut akan berjalan seperti biasa.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tanpa pembatasan rentang waktu; ini adalah perilaku default).
- Tetapkan rentang sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan tetapkan waktu `start` dan `end` yang sama (misalnya `08:00` hingga `08:00`). Ini diperlakukan sebagai rentang tanpa durasi, sehingga heartbeat selalu dilewati.
</Warning>

### Contoh multiakun

Gunakan `accountId` untuk menargetkan akun tertentu pada saluran multiakun seperti Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opsional: rutekan ke topik/utas tertentu
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
  Saat diaktifkan, kirim juga pesan `Thinking` terpisah jika tersedia (bentuk yang sama dengan `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Saat bernilai true, proses heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari berkas bootstrap ruang kerja.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Saat bernilai true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama dengan cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimal. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Saat bernilai true, proses heartbeat ditunda pada jalur sibuk tambahan milik agen tersebut: pekerjaan subagennya sendiri yang berkunci sesi atau pekerjaan perintah bertingkat. Jalur cron selalu menunda heartbeat, bahkan tanpa flag ini, sehingga host model lokal tidak menjalankan prompt cron dan heartbeat secara bersamaan.
</ParamField>
<ParamField path="session" type="string">
  Kunci sesi opsional untuk proses heartbeat.

- `main` (default): sesi utama agen.
- Kunci sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
- Format kunci sesi: lihat [Sesi](/id/concepts/session) dan [Grup](/id/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: kirim ke channel eksternal yang terakhir digunakan.
- channel eksplisit: channel atau id plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
- `none` (default): jalankan heartbeat tetapi **jangan kirim** secara eksternal.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: cegah pengiriman langsung/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Penggantian penerima opsional (id khusus channel, misalnya E.164 untuk WhatsApp atau id obrolan Telegram). Untuk topik/utas Telegram, gunakan `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk channel multiakun. Saat `target: "last"`, id akun berlaku pada channel terakhir yang ditentukan jika channel tersebut mendukung akun; jika tidak, id diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk channel yang ditentukan, pengiriman dilewati.

</ParamField>
<ParamField path="prompt" type="string">
  Menggantikan isi prompt default (tidak digabungkan).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Menentukan apakah bagian prompt sistem `## Heartbeats` milik agen default disisipkan. Atur `false` untuk mempertahankan perilaku runtime heartbeat (irama, pengiriman, HEARTBEAT.md) sekaligus menghilangkan instruksi heartbeat dari prompt sistem agen.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Jumlah karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Jika true, mencegah payload peringatan kesalahan alat selama proses heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Jumlah detik maksimum yang diizinkan untuk satu giliran agen heartbeat sebelum dibatalkan. Biarkan tidak diatur untuk menggunakan `agents.defaults.timeoutSeconds` jika ditetapkan; jika tidak, gunakan irama heartbeat yang dibatasi hingga 600 detik.

</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi proses heartbeat ke suatu rentang waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diizinkan untuk akhir hari), dan `timezone` opsional.

- Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika ditetapkan; jika tidak, kembali ke zona waktu sistem host.
- `"local"`: selalu menggunakan zona waktu sistem host.
- Pengidentifikasi IANA apa pun (misalnya `America/New_York`): digunakan secara langsung; jika tidak valid, kembali ke perilaku `"user"` di atas.
- `start` dan `end` tidak boleh sama untuk rentang aktif; nilai yang sama diperlakukan sebagai rentang selebar nol (selalu berada di luar rentang).
- Di luar rentang aktif, heartbeat dilewati hingga tick berikutnya di dalam rentang.

</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Secara default, heartbeat dijalankan dalam sesi utama agen (`agent:<id>:<mainKey>`), atau `global` saat `session.scope = "global"`. Atur `session` untuk menggantinya dengan sesi channel tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks proses; pengiriman dikontrol oleh `target` dan `to`.
    - Untuk mengirim ke channel/penerima tertentu, atur `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan channel eksternal terakhir untuk sesi tersebut.
    - Secara default, pengiriman heartbeat mengizinkan target langsung/DM. Atur `directPolicy: "block"` untuk mencegah pengiriman ke target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama, jalur sesi target, jalur cron, atau tugas cron aktif sedang sibuk, heartbeat dilewati dan dicoba lagi nanti.
    - Jika `skipWhenBusy: true`, jalur subagen berbasis kunci sesi dan jalur bertingkat milik agen ini juga menunda proses heartbeat. Jalur sibuk milik agen lain tidak menunda agen ini.
    - Jika `target` tidak menghasilkan tujuan eksternal, proses tetap berlangsung tetapi tidak ada pesan keluar yang dikirim.

  </Accordion>
  <Accordion title="Visibilitas dan perilaku pelompatan">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, proses dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman peringatan yang dinonaktifkan, OpenClaw masih dapat menjalankan heartbeat, memperbarui stempel waktu tugas yang jatuh tempo, memulihkan stempel waktu menganggur sesi, dan mencegah payload peringatan dikirim keluar.
    - Jika target heartbeat yang ditentukan mendukung indikator pengetikan, OpenClaw menampilkan indikator pengetikan selama proses heartbeat aktif. Ini menggunakan target yang sama dengan tujuan keluaran obrolan heartbeat dan dinonaktifkan oleh `typingMode: "never"`.

  </Accordion>
  <Accordion title="Siklus hidup dan audit sesi">
    - Balasan khusus heartbeat **tidak** mempertahankan sesi tetap aktif. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa karena menganggur menggunakan `lastInteractionAt` dari pesan pengguna/channel nyata terakhir, sedangkan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat Control UI dan WebChat menyembunyikan prompt heartbeat dan pengakuan yang hanya berisi OK. Transkrip sesi yang mendasarinya tetap dapat memuat giliran tersebut untuk audit/pemutaran ulang.
    - [Tugas latar belakang](/id/automation/tasks) yang dilepas dapat mengantrekan peristiwa sistem dan membangunkan heartbeat saat sesi utama perlu segera mengetahui sesuatu. Pembangkitan tersebut tidak menjadikan proses heartbeat sebagai tugas latar belakang.

  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, pengakuan `HEARTBEAT_OK` dicegah sementara isi peringatan dikirimkan. Anda dapat menyesuaikannya per channel atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (default)
      showAlerts: true # Tampilkan pesan peringatan (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Tampilkan pengakuan OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Cegah pengiriman peringatan untuk akun ini
```

Prioritas: per akun → per channel → default channel → default bawaan.

### Fungsi setiap flag

- `showOk`: mengirim pengakuan `HEARTBEAT_OK` saat model mengembalikan balasan yang hanya berisi OK.
- `showAlerts`: mengirim isi peringatan saat model mengembalikan balasan selain OK.
- `useIndicator`: memancarkan peristiwa indikator untuk permukaan status UI.

Jika **ketiganya** bernilai false, OpenClaw melewati proses heartbeat sepenuhnya (tanpa pemanggilan model).

### Contoh per channel dan per akun

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
          showAlerts: false # cegah peringatan hanya untuk akun ops
  telegram:
    heartbeat:
      showOk: true
```

### Pola umum

| Tujuan                                           | Konfigurasi                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, peringatan aktif)   | _(tidak memerlukan konfigurasi)_                                                         |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK hanya pada satu channel                       | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` tersedia di ruang kerja, prompt default meminta agen membacanya. Anggap file ini sebagai "daftar periksa heartbeat" Anda: ringkas, stabil, dan aman untuk diperiksa setiap 30 menit.

Pada proses normal, `HEARTBEAT.md` hanya disisipkan jika panduan heartbeat diaktifkan untuk agen default. Menonaktifkan irama heartbeat dengan `0m` atau menetapkan `includeSystemPromptSection: false` akan menghilangkannya dari konteks bootstrap normal.

Pada harness Codex native, isi `HEARTBEAT.md` tidak disisipkan ke dalam giliran seperti file bootstrap lainnya. Jika file tersebut tersedia dan memiliki isi selain spasi kosong, catatan mode kolaborasi heartbeat mengarahkan Codex ke file tersebut dan memintanya membaca file sebelum melanjutkan.

Jika `HEARTBEAT.md` tersedia tetapi secara efektif kosong (hanya baris kosong, komentar Markdown/HTML, heading Markdown seperti `# Heading`, penanda fence, atau stub daftar periksa kosong), OpenClaw melewati proses heartbeat untuk menghemat pemanggilan API. Pelompatan tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file tidak ada, heartbeat tetap berjalan dan model menentukan tindakan yang harus dilakukan.

Pertahankan agar tetap ringkas (daftar periksa atau pengingat singkat) untuk menghindari pembengkakan prompt.

Contoh `HEARTBEAT.md`:

```md
# Daftar periksa heartbeat

- Pindai cepat: adakah sesuatu yang mendesak di kotak masuk?
- Jika masih siang, lakukan pemeriksaan singkat jika tidak ada hal lain yang tertunda.
- Jika suatu tugas terhambat, catat _apa yang kurang_ dan tanyakan kepada Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur berukuran kecil untuk pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

Contoh:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Periksa email belum dibaca yang mendesak dan tandai apa pun yang sensitif terhadap waktu."
- name: calendar-scan
  interval: 2h
  prompt: "Periksa rapat mendatang yang memerlukan persiapan atau tindak lanjut."

# Instruksi tambahan

- Buat peringatan tetap ringkas.
- Jika tidak ada yang perlu diperhatikan setelah semua tugas yang jatuh tempo, balas HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Perilaku">
    - OpenClaw mengurai blok `tasks:` dan memeriksa setiap tugas berdasarkan `interval` masing-masing.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari pemanggilan model yang sia-sia.
    - Isi nontugas dalam `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas yang jatuh tempo.
    - Stempel waktu terakhir dijalankannya tugas disimpan dalam status sesi (`heartbeatTaskState`), sehingga interval tetap bertahan setelah mulai ulang normal.
    - Stempel waktu tugas hanya dimajukan setelah proses heartbeat menyelesaikan jalur balasan normalnya. Proses `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.

  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file heartbeat memuat beberapa pemeriksaan berkala tanpa membayar semuanya pada setiap tick.

### Dapatkah agen memperbarui HEARTBEAT.md?

Ya, jika Anda memintanya.

`HEARTBEAT.md` hanyalah file biasa di ruang kerja agen, sehingga Anda dapat memberi tahu agen (dalam obrolan normal), misalnya:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih ringkas dan berfokus pada tindak lanjut kotak masuk."

Jika ingin hal ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat, seperti: "Jika daftar periksa menjadi usang, perbarui HEARTBEAT.md dengan daftar yang lebih baik."

<Warning>
Jangan masukkan rahasia (kunci API, nomor telepon, token privat) ke dalam `HEARTBEAT.md` karena file tersebut menjadi bagian dari konteks prompt.
</Warning>

## Pembangkitan manual (sesuai permintaan)

Gunakan `openclaw system event` untuk mengantrekan peristiwa sistem dan secara opsional memicu heartbeat langsung:

```bash
openclaw system event --text "Periksa tindak lanjut mendesak" --mode now
```

| Flag                         | Deskripsi                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Teks peristiwa sistem (wajib).                                                                    |
| `--mode <mode>`              | `now` menjalankan heartbeat langsung; `next-heartbeat` (default) menunggu siklus terjadwal berikutnya. |
| `--session-key <sessionKey>` | Menargetkan sesi tertentu untuk peristiwa; secara default menggunakan sesi utama agen.                   |
| `--json`                     | Menghasilkan JSON.                                                                                     |

Jika `--session-key` tidak diberikan dan beberapa agen telah mengonfigurasi `heartbeat`, `--mode now` segera menjalankan heartbeat setiap agen tersebut.

Kontrol heartbeat terkait dalam grup CLI yang sama:

```bash
openclaw system heartbeat last     # tampilkan peristiwa heartbeat terakhir
openclaw system heartbeat enable   # aktifkan heartbeat
openclaw system heartbeat disable  # nonaktifkan heartbeat
```

## Penyampaian penalaran (opsional)

Secara default, heartbeat hanya menyampaikan payload "jawaban" akhir.

Jika menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan menyampaikan pesan terpisah dengan awalan `Thinking` (dengan format yang sama seperti `/reasoning on`). Ini dapat berguna saat agen mengelola beberapa sesi/codex dan Anda ingin mengetahui alasan agen memutuskan untuk menghubungi Anda—tetapi hal ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktifkan fitur ini dalam obrolan grup.

## Pertimbangan biaya

Heartbeat menjalankan giliran agen secara penuh. Interval yang lebih singkat menghabiskan lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim seluruh riwayat percakapan (~100K token menjadi ~2-5K per proses).
- Gunakan `lightContext: true` untuk membatasi berkas bootstrap hanya pada `HEARTBEAT.md`.
- Tetapkan `model` yang lebih murah (misalnya `ollama/llama3.2:1b`).
- Jaga agar `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika hanya menginginkan pembaruan status internal.

## Luapan konteks setelah heartbeat

Heartbeat mempertahankan model runtime yang sudah ada pada sesi bersama setelah proses selesai, sehingga heartbeat yang mengalihkan sesi ke model lokal yang lebih kecil (misalnya model Ollama dengan jendela 32k) dapat membuat model tersebut tetap digunakan pada giliran sesi utama berikutnya. Jika giliran berikutnya kemudian melaporkan luapan konteks, dan model runtime terakhir sesi cocok dengan `heartbeat.model` yang dikonfigurasi, pesan pemulihan OpenClaw menyebut kebocoran model heartbeat sebagai kemungkinan penyebab dan menyarankan perbaikan.

Untuk menghindarinya: gunakan `isolatedSession: true` untuk menjalankan heartbeat dalam sesi baru (secara opsional digabungkan dengan `lightContext: true` untuk prompt terkecil), atau pilih model heartbeat dengan jendela konteks yang cukup besar untuk sesi bersama.

## Terkait

- [Otomatisasi](/id/automation) - ikhtisar semua mekanisme otomatisasi
- [Tugas Latar Belakang](/id/automation/tasks) - cara pekerjaan terpisah dilacak
- [Zona Waktu](/id/concepts/timezone) - pengaruh zona waktu terhadap penjadwalan heartbeat
- [Pemecahan Masalah](/id/automation/cron-jobs#troubleshooting) - men-debug masalah otomatisasi
