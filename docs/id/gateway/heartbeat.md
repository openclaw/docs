---
read_when:
    - Menyesuaikan cadence atau pesan Heartbeat
    - Menentukan pilihan antara Heartbeat dan Cron untuk tugas terjadwal
sidebarTitle: Heartbeat
summary: Pesan polling Heartbeat dan aturan notifikasi
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat vs Cron?** Lihat [Automation & Tasks](/id/automation) untuk panduan kapan menggunakan masing-masing.
</Note>

Heartbeat menjalankan **giliran agen berkala** dalam sesi utama agar model dapat menampilkan apa pun yang perlu diperhatikan tanpa mengganggu Anda dengan spam.

Heartbeat adalah giliran sesi utama yang dijadwalkan — ini **tidak** membuat catatan [tugas latar belakang](/id/automation/tasks). Catatan tugas ditujukan untuk pekerjaan terlepas (eksekusi ACP, subagen, tugas Cron terisolasi).

Pemecahan masalah: [Tugas Terjadwal](/id/automation/cron-jobs#troubleshooting)

## Mulai cepat (pemula)

<Steps>
  <Step title="Pilih cadence">
    Biarkan Heartbeat tetap diaktifkan (default adalah `30m`, atau `1h` untuk auth token/OAuth Anthropic, termasuk penggunaan ulang Claude CLI) atau atur cadence Anda sendiri.
  </Step>
  <Step title="Tambahkan HEARTBEAT.md (opsional)">
    Buat checklist `HEARTBEAT.md` kecil atau blok `tasks:` di workspace agen.
  </Step>
  <Step title="Tentukan ke mana pesan heartbeat harus dikirim">
    `target: "none"` adalah default; set `target: "last"` untuk merutekan ke kontak terakhir.
  </Step>
  <Step title="Penyetelan opsional">
    - Aktifkan pengiriman reasoning heartbeat untuk transparansi.
    - Gunakan konteks bootstrap ringan jika eksekusi heartbeat hanya memerlukan `HEARTBEAT.md`.
    - Aktifkan sesi terisolasi agar tidak mengirim riwayat percakapan penuh pada setiap heartbeat.
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
        target: "last", // pengiriman eksplisit ke kontak terakhir (default adalah "none")
        directPolicy: "allow", // default: izinkan target langsung/DM; set "block" untuk menekan
        lightContext: true, // opsional: hanya suntikkan HEARTBEAT.md dari file bootstrap
        isolatedSession: true, // opsional: sesi baru pada setiap eksekusi (tanpa riwayat percakapan)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opsional: kirim juga pesan `Reasoning:` terpisah
      },
    },
  },
}
```

## Default

- Interval: `30m` (atau `1h` ketika mode auth token/OAuth Anthropic terdeteksi, termasuk penggunaan ulang Claude CLI). Set `agents.defaults.heartbeat.every` atau `agents.list[].heartbeat.every`; gunakan `0m` untuk menonaktifkan.
- Body prompt (dapat dikonfigurasi melalui `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat dikirim **apa adanya** sebagai pesan pengguna. Prompt sistem menyertakan bagian "Heartbeat" hanya ketika heartbeat diaktifkan untuk agen default, dan eksekusi ditandai secara internal.
- Saat heartbeat dinonaktifkan dengan `0m`, eksekusi normal juga menghilangkan `HEARTBEAT.md` dari konteks bootstrap sehingga model tidak melihat instruksi khusus heartbeat.
- Jam aktif (`heartbeat.activeHours`) diperiksa dalam zona waktu yang dikonfigurasi. Di luar jendela tersebut, heartbeat dilewati sampai tick berikutnya di dalam jendela.

## Untuk apa prompt heartbeat digunakan

Prompt default sengaja dibuat luas:

- **Tugas latar belakang**: "Consider outstanding tasks" mendorong agen untuk meninjau tindak lanjut (inbox, kalender, pengingat, pekerjaan dalam antrean) dan menampilkan apa pun yang mendesak.
- **Check-in manusia**: "Checkup sometimes on your human during day time" mendorong pesan ringan sesekali seperti "ada yang Anda butuhkan?", tetapi menghindari spam malam hari dengan menggunakan zona waktu lokal yang dikonfigurasi (lihat [Timezone](/id/concepts/timezone)).

Heartbeat dapat bereaksi terhadap [tugas latar belakang](/id/automation/tasks) yang selesai, tetapi eksekusi heartbeat itu sendiri tidak membuat catatan tugas.

Jika Anda ingin heartbeat melakukan sesuatu yang sangat spesifik (misalnya "periksa statistik Gmail PubSub" atau "verifikasi health gateway"), set `agents.defaults.heartbeat.prompt` (atau `agents.list[].heartbeat.prompt`) ke body kustom (dikirim apa adanya).

## Kontrak respons

- Jika tidak ada yang perlu diperhatikan, balas dengan **`HEARTBEAT_OK`**.
- Selama eksekusi heartbeat, OpenClaw memperlakukan `HEARTBEAT_OK` sebagai ack ketika muncul di **awal atau akhir** balasan. Token tersebut dihapus dan balasan dibuang jika konten yang tersisa **≤ `ackMaxChars`** (default: 300).
- Jika `HEARTBEAT_OK` muncul di **tengah** balasan, token tersebut tidak diperlakukan secara khusus.
- Untuk peringatan, **jangan** sertakan `HEARTBEAT_OK`; kembalikan hanya teks peringatannya.

Di luar heartbeat, `HEARTBEAT_OK` liar di awal/akhir pesan akan dihapus dan dicatat dalam log; pesan yang hanya berisi `HEARTBEAT_OK` akan dibuang.

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m menonaktifkan)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (kirim pesan Reasoning: terpisah saat tersedia)
        lightContext: false, // default: false; true hanya mempertahankan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat dalam sesi baru (tanpa riwayat percakapan)
        target: "last", // default: none | opsi: last | none | <channel id> (inti atau Plugin, mis. "bluebubbles")
        to: "+15551234567", // override spesifik saluran opsional
        accountId: "ops-bot", // id saluran multi-akun opsional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // karakter maksimum yang diizinkan setelah HEARTBEAT_OK
      },
    },
  },
}
```

### Cakupan dan prioritas

- `agents.defaults.heartbeat` menetapkan perilaku Heartbeat global.
- `agents.list[].heartbeat` digabungkan di atasnya; jika ada agen yang memiliki blok `heartbeat`, **hanya agen-agen tersebut** yang menjalankan heartbeat.
- `channels.defaults.heartbeat` menetapkan default visibilitas untuk semua saluran.
- `channels.<channel>.heartbeat` menimpa default saluran.
- `channels.<channel>.accounts.<id>.heartbeat` (saluran multi-akun) menimpa pengaturan per-saluran.

### Heartbeat per-agen

Jika ada entri `agents.list[]` yang menyertakan blok `heartbeat`, **hanya agen-agen tersebut** yang menjalankan heartbeat. Blok per-agen digabungkan di atas `agents.defaults.heartbeat` (jadi Anda dapat menetapkan default bersama sekali lalu menimpa per agen).

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
          timezone: "America/New_York", // opsional; menggunakan userTimezone Anda jika diset, jika tidak zona waktu host
        },
      },
    },
  },
}
```

Di luar jendela ini (sebelum pukul 9 pagi atau setelah pukul 10 malam waktu Eastern), heartbeat dilewati. Tick terjadwal berikutnya di dalam jendela akan berjalan normal.

### Penyiapan 24/7

Jika Anda ingin heartbeat berjalan sepanjang hari, gunakan salah satu pola berikut:

- Hilangkan `activeHours` sepenuhnya (tidak ada pembatasan jendela waktu; ini adalah perilaku default).
- Set jendela sehari penuh: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Jangan set `start` dan `end` ke waktu yang sama (misalnya `08:00` ke `08:00`). Itu diperlakukan sebagai jendela dengan lebar nol, sehingga heartbeat selalu dilewati.
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
          to: "12345678:topic:42", // opsional: rutekan ke topik/thread tertentu
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
  Override model opsional untuk eksekusi heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Saat diaktifkan, juga mengirim pesan `Reasoning:` terpisah saat tersedia (bentuk yang sama seperti `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Saat true, eksekusi heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Saat true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Menggunakan pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Secara drastis mengurangi biaya token per-heartbeat. Gabungkan dengan `lightContext: true` untuk penghematan maksimum. Perutean pengiriman tetap menggunakan konteks sesi utama.
</ParamField>
<ParamField path="session" type="string">
  Key sesi opsional untuk eksekusi heartbeat.

  - `main` (default): sesi utama agen.
  - Key sesi eksplisit (salin dari `openclaw sessions --json` atau [CLI sesi](/id/cli/sessions)).
  - Format key sesi: lihat [Sessions](/id/concepts/session) dan [Groups](/id/channels/groups).
</ParamField>
<ParamField path="target" type="string">
  - `last`: kirim ke saluran eksternal terakhir yang digunakan.
  - saluran eksplisit: saluran atau id Plugin apa pun yang dikonfigurasi, misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`.
  - `none` (default): jalankan heartbeat tetapi **jangan kirim** secara eksternal.
</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Mengontrol perilaku pengiriman langsung/DM. `allow`: izinkan pengiriman heartbeat langsung/DM. `block`: tekan pengiriman langsung/DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Override penerima opsional (id spesifik saluran, mis. E.164 untuk WhatsApp atau id chat Telegram). Untuk topik/thread Telegram, gunakan `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  Id akun opsional untuk saluran multi-akun. Saat `target: "last"`, id akun berlaku ke saluran terakhir yang di-resolve jika saluran tersebut mendukung akun; jika tidak, diabaikan. Jika id akun tidak cocok dengan akun yang dikonfigurasi untuk saluran yang di-resolve, pengiriman dilewati.
</ParamField>
<ParamField path="prompt" type="string">
  Menimpa body prompt default (tidak digabungkan).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Karakter maksimum yang diizinkan setelah `HEARTBEAT_OK` sebelum pengiriman.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Saat true, menekan payload peringatan error tool selama eksekusi heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Membatasi eksekusi heartbeat ke jendela waktu. Objek dengan `start` (HH:MM, inklusif; gunakan `00:00` untuk awal hari), `end` (HH:MM eksklusif; `24:00` diperbolehkan untuk akhir hari), dan `timezone` opsional.

  - Dihilangkan atau `"user"`: menggunakan `agents.defaults.userTimezone` Anda jika diset, jika tidak fallback ke zona waktu sistem host.
  - `"local"`: selalu menggunakan zona waktu sistem host.
  - Pengenal IANA apa pun (mis. `America/New_York`): digunakan secara langsung; jika tidak valid, fallback ke perilaku `"user"` di atas.
  - `start` dan `end` tidak boleh sama untuk jendela aktif; nilai yang sama diperlakukan sebagai lebar nol (selalu di luar jendela).
  - Di luar jendela aktif, heartbeat dilewati sampai tick berikutnya di dalam jendela.
</ParamField>

## Perilaku pengiriman

<AccordionGroup>
  <Accordion title="Perutean sesi dan target">
    - Heartbeat berjalan dalam sesi utama agen secara default (`agent:<id>:<mainKey>`), atau `global` ketika `session.scope = "global"`. Set `session` untuk menimpa ke sesi saluran tertentu (Discord/WhatsApp/dll.).
    - `session` hanya memengaruhi konteks eksekusi; pengiriman dikendalikan oleh `target` dan `to`.
    - Untuk mengirim ke saluran/penerima tertentu, set `target` + `to`. Dengan `target: "last"`, pengiriman menggunakan saluran eksternal terakhir untuk sesi tersebut.
    - Pengiriman heartbeat mengizinkan target langsung/DM secara default. Set `directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap menjalankan giliran heartbeat.
    - Jika antrean utama sibuk, heartbeat dilewati dan dicoba ulang nanti.
    - Jika `target` tidak di-resolve ke tujuan eksternal mana pun, eksekusi tetap terjadi tetapi tidak ada pesan keluar yang dikirim.
  </Accordion>
  <Accordion title="Visibilitas dan perilaku lewati">
    - Jika `showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan, eksekusi dilewati sejak awal sebagai `reason=alerts-disabled`.
    - Jika hanya pengiriman alert yang dinonaktifkan, OpenClaw tetap dapat menjalankan heartbeat, memperbarui timestamp tugas yang jatuh tempo, memulihkan timestamp idle sesi, dan menekan payload alert keluar.
    - Jika target heartbeat yang di-resolve mendukung typing, OpenClaw menampilkan typing saat eksekusi heartbeat aktif. Ini menggunakan target yang sama dengan target pengiriman output obrolan heartbeat, dan dinonaktifkan oleh `typingMode: "never"`.
  </Accordion>
  <Accordion title="Siklus hidup sesi dan audit">
    - Balasan yang hanya berupa heartbeat **tidak** menjaga sesi tetap hidup. Metadata heartbeat dapat memperbarui baris sesi, tetapi kedaluwarsa idle menggunakan `lastInteractionAt` dari pesan pengguna/saluran nyata terakhir, dan kedaluwarsa harian menggunakan `sessionStartedAt`.
    - Riwayat UI Kontrol dan WebChat menyembunyikan prompt heartbeat dan acknowledgment yang hanya berisi OK. Transkrip sesi yang mendasarinya tetap dapat memuat giliran-giliran tersebut untuk audit/replay.
    - [Tugas latar belakang](/id/automation/tasks) yang terlepas dapat mengantrikan event sistem dan membangunkan heartbeat saat sesi utama harus segera menyadari sesuatu. Wake tersebut tidak membuat eksekusi heartbeat menjadi tugas latar belakang.
  </Accordion>
</AccordionGroup>

## Kontrol visibilitas

Secara default, acknowledgment `HEARTBEAT_OK` ditekan sementara konten alert tetap dikirim. Anda dapat menyesuaikannya per saluran atau per akun:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Sembunyikan HEARTBEAT_OK (default)
      showAlerts: true # Tampilkan pesan alert (default)
      useIndicator: true # Emit event indikator (default)
  telegram:
    heartbeat:
      showOk: true # Tampilkan acknowledgment OK di Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Tekan pengiriman alert untuk akun ini
```

Prioritas: per-akun → per-saluran → default saluran → default bawaan.

### Fungsi tiap flag

- `showOk`: mengirim acknowledgment `HEARTBEAT_OK` saat model mengembalikan balasan yang hanya berisi OK.
- `showAlerts`: mengirim konten alert saat model mengembalikan balasan non-OK.
- `useIndicator`: memancarkan event indikator untuk surface status UI.

Jika **ketiganya** bernilai false, OpenClaw melewati eksekusi heartbeat sepenuhnya (tanpa pemanggilan model).

### Contoh per-saluran vs per-akun

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

| Tujuan                                   | Konfigurasi                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Perilaku default (OK senyap, alert aktif) | _(tidak perlu konfigurasi)_                                                                 |
| Sepenuhnya senyap (tanpa pesan, tanpa indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Hanya indikator (tanpa pesan)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`   |
| OK hanya di satu saluran                 | `channels.telegram.heartbeat: { showOk: true }`                                            |

## HEARTBEAT.md (opsional)

Jika file `HEARTBEAT.md` ada di workspace, prompt default memberi tahu agen untuk membacanya. Anggap ini sebagai "checklist heartbeat" Anda: kecil, stabil, dan aman untuk disertakan setiap 30 menit.

Pada eksekusi normal, `HEARTBEAT.md` hanya disuntikkan saat panduan heartbeat diaktifkan untuk agen default. Menonaktifkan cadence heartbeat dengan `0m` atau menyetel `includeSystemPromptSection: false` menghilangkannya dari konteks bootstrap normal.

Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya berisi baris kosong dan heading markdown seperti `# Heading`), OpenClaw melewati eksekusi heartbeat untuk menghemat panggilan API. Skip tersebut dilaporkan sebagai `reason=empty-heartbeat-file`. Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

Jaga agar tetap kecil (checklist singkat atau pengingat) untuk menghindari prompt membengkak.

Contoh `HEARTBEAT.md`:

```md
# Checklist Heartbeat

- Pemindaian cepat: apakah ada hal mendesak di inbox?
- Jika siang hari, lakukan check-in ringan jika tidak ada hal lain yang tertunda.
- Jika sebuah tugas terblokir, tuliskan _apa yang kurang_ dan tanyakan kepada Peter lain kali.
```

### Blok `tasks:`

`HEARTBEAT.md` juga mendukung blok `tasks:` terstruktur kecil untuk pemeriksaan berbasis interval di dalam heartbeat itu sendiri.

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

- Jaga alert tetap singkat.
- Jika tidak ada yang perlu diperhatikan setelah semua tugas jatuh tempo, balas HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Perilaku">
    - OpenClaw mem-parsing blok `tasks:` dan memeriksa setiap tugas terhadap `interval`-nya sendiri.
    - Hanya tugas yang **jatuh tempo** yang disertakan dalam prompt heartbeat untuk tick tersebut.
    - Jika tidak ada tugas yang jatuh tempo, heartbeat dilewati sepenuhnya (`reason=no-tasks-due`) untuk menghindari panggilan model yang sia-sia.
    - Konten non-tugas dalam `HEARTBEAT.md` dipertahankan dan ditambahkan sebagai konteks tambahan setelah daftar tugas jatuh tempo.
    - Timestamp terakhir dijalankan untuk tugas disimpan dalam status sesi (`heartbeatTaskState`), sehingga interval tetap bertahan melewati restart normal.
    - Timestamp tugas hanya dimajukan setelah eksekusi heartbeat menyelesaikan jalur balasan normalnya. Eksekusi `empty-heartbeat-file` / `no-tasks-due` yang dilewati tidak menandai tugas sebagai selesai.
  </Accordion>
</AccordionGroup>

Mode tugas berguna saat Anda ingin satu file heartbeat menyimpan beberapa pemeriksaan berkala tanpa harus membayar semuanya pada setiap tick.

### Apakah agen dapat memperbarui HEARTBEAT.md?

Ya — jika Anda memintanya.

`HEARTBEAT.md` hanyalah file biasa dalam workspace agen, jadi Anda dapat memberi tahu agen (dalam obrolan normal) sesuatu seperti:

- "Perbarui `HEARTBEAT.md` untuk menambahkan pemeriksaan kalender harian."
- "Tulis ulang `HEARTBEAT.md` agar lebih singkat dan fokus pada tindak lanjut inbox."

Jika Anda ingin ini terjadi secara proaktif, Anda juga dapat menyertakan baris eksplisit dalam prompt heartbeat Anda seperti: "Jika checklist menjadi usang, perbarui HEARTBEAT.md dengan versi yang lebih baik."

<Warning>
Jangan masukkan rahasia (API key, nomor telepon, token privat) ke dalam `HEARTBEAT.md` — file ini menjadi bagian dari konteks prompt.
</Warning>

## Wake manual (sesuai permintaan)

Anda dapat mengantrikan event sistem dan memicu heartbeat segera dengan:

```bash
openclaw system event --text "Periksa tindak lanjut yang mendesak" --mode now
```

Jika beberapa agen memiliki `heartbeat` yang dikonfigurasi, wake manual akan segera menjalankan heartbeat masing-masing agen tersebut.

Gunakan `--mode next-heartbeat` untuk menunggu tick terjadwal berikutnya.

## Pengiriman reasoning (opsional)

Secara default, heartbeat hanya mengirim payload "jawaban" final.

Jika Anda menginginkan transparansi, aktifkan:

- `agents.defaults.heartbeat.includeReasoning: true`

Saat diaktifkan, heartbeat juga akan mengirim pesan terpisah berprefiks `Reasoning:` (bentuk yang sama seperti `/reasoning on`). Ini dapat berguna saat agen mengelola beberapa sesi/codex dan Anda ingin melihat mengapa agen memutuskan untuk menghubungi Anda — tetapi ini juga dapat membocorkan lebih banyak detail internal daripada yang Anda inginkan. Sebaiknya tetap nonaktif dalam obrolan grup.

## Kesadaran biaya

Heartbeat menjalankan giliran agen penuh. Interval yang lebih pendek membakar lebih banyak token. Untuk mengurangi biaya:

- Gunakan `isolatedSession: true` agar tidak mengirim riwayat percakapan penuh (~100K token turun menjadi ~2-5K per eksekusi).
- Gunakan `lightContext: true` untuk membatasi file bootstrap hanya ke `HEARTBEAT.md`.
- Tetapkan `model` yang lebih murah (mis. `ollama/llama3.2:1b`).
- Jaga `HEARTBEAT.md` tetap kecil.
- Gunakan `target: "none"` jika Anda hanya menginginkan pembaruan status internal.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan terlepas dilacak
- [Timezone](/id/concepts/timezone) — bagaimana zona waktu memengaruhi penjadwalan heartbeat
- [Pemecahan masalah](/id/automation/cron-jobs#troubleshooting) — men-debug masalah otomatisasi
