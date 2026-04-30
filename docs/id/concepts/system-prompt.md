---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Isi prompt sistem OpenClaw dan cara penyusunannya
title: Prompt sistem
x-i18n:
    generated_at: "2026-04-30T09:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem khusus untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyetelan khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk persona latching, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran alat terstruktur ditambah panduan penggunaan alat runtime.
- **Bias Eksekusi**: panduan tindak lanjut yang ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjut sampai selesai atau terblokir, pulih dari hasil alat
  yang lemah, periksa status yang dapat berubah secara live, dan verifikasi sebelum finalisasi.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (jika tersedia): memberi tahu model cara memuat instruksi skill sesuai permintaan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna
  eksplisit. Alat khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: jalur lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan membacanya.
- **File Workspace (disuntikkan)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (jika diaktifkan): menunjukkan runtime tersandbox, jalur sandbox, dan apakah exec dengan elevasi tersedia.
- **Tanggal & Waktu Saat Ini**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeats diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (jika terdeteksi), tingkat berpikir (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menaruh konten stabil besar, termasuk **Konteks Proyek**, di atas
batas cache prompt internal. Bagian kanal/sesi yang volatil seperti
panduan embed Control UI, **Messaging**, **Voice**, **Konteks Obrolan Grup**,
**Reactions**, **Heartbeats**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan ulang prefiks workspace stabil
di seluruh giliran kanal. Deskripsi alat juga sebaiknya tidak menyematkan nama
kanal saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- saat bangun otomatis setelah selesai diaktifkan, mulai perintah sekali dan andalkan
  jalur bangun berbasis push saat ia mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah non-trivial, mempertahankan tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat nasihat. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan daftar izin kanal untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada kanal dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah
`/approve` manual ketika hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan konfigurasi yang terlihat pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **Pembaruan Mandiri OpenClaw**, **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Messaging**, **Balasan Senyap**, dan **Heartbeats**. Tooling, **Keamanan**,
  Workspace, Sandbox, Tanggal & Waktu Saat Ini (jika diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt ekstra yang disuntikkan diberi label **Konteks Subagen**
alih-alih **Konteks Obrolan Grup**.

Untuk eksekusi balasan otomatis kanal, OpenClaw dapat menghilangkan bagian **Balasan Senyap**
generik ketika konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanisme token
di prompt sistem global dan konteks kanal sekaligus.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` jika ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
heartbeats dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disuntikkan
tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tidak terduga tinggi serta Compaction yang lebih sering.

<Note>
File harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai permintaan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` kosong adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan marker. Ukuran maksimum per file dikontrol oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di semua file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan marker file-hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Konteks Proyek; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar tidak terlalu generik, mulailah dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, kini bagian tersebut hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama juga dapat secara opsional menetapkan override model
per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skills yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skills yang tersedia**
ringkas (`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi
yang tercantum (workspace, terkelola, atau bundel). Jika tidak ada skills yang memenuhi syarat,
bagian Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan daftar izin skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skills yang dibundel Plugin hanya memenuhi syarat saat plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih dalam tanpa menyematkan semua
panduan tersebut langsung di setiap deskripsi alat.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

Anggaran daftar skills dimiliki oleh subsistem skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime berbatas generik menggunakan permukaan yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan tersebut menjaga ukuran skills terpisah dari ukuran pembacaan/injeksi runtime seperti
`memory_get`, hasil alat live, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian ini
menunjuk ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm
yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root
sumber lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL
sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana setiap kali dokumentasi tidak lengkap atau
usang. Prompt juga mencatat mirror dokumentasi publik, Discord komunitas, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skills. Ini memberi tahu model untuk
berkonsultasi dengan dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri jika memungkinkan (bertanya kepada pengguna hanya ketika tidak memiliki akses).
Khusus untuk konfigurasi, prompt mengarahkan agen ke aksi alat `gateway`
`config.schema.lookup` untuk dokumentasi dan batasan tingkat-field yang tepat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
