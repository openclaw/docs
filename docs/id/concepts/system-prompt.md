---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa isi prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-02T20:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem khusus untuk setiap agent run. Prompt tersebut **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan diinjeksi ke setiap agent run.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menginjeksi **prefiks stabil** di atas batas cache prompt
- menginjeksi **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran structured-tool ditambah panduan penggunaan alat runtime.
- **Execution Bias**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjutkan hingga selesai atau terblokir, pulih dari hasil alat yang lemah,
  periksa status yang dapat berubah secara langsung, dan verifikasi sebelum menyelesaikan.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mengejar kuasa atau melewati pengawasan.
- **Skills** (jika tersedia): memberi tahu model cara memuat instruksi skill saat dibutuhkan.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti konfigurasi penuh
  dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna yang eksplisit.
  Alat khusus owner `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: jalur lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (jika diaktifkan): menunjukkan runtime sandbox, jalur sandbox, dan apakah exec yang dinaikkan tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agent default.
- **Runtime**: host, OS, node, model, root repo (jika terdeteksi), tingkat berpikir (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menjaga konten stabil besar, termasuk **Project Context**, di atas
batas cache prompt internal. Bagian channel/sesi yang volatil seperti
panduan embed Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan ulang prefiks workspace stabil
di seluruh giliran channel. Deskripsi alat juga sebaiknya menghindari penyematan nama
channel saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik delay `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- ketika wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push ketika perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi ketika Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian sub-agent bersifat
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Ketika alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam prompt sistem bersifat advisory. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agent untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agent hanya boleh menyertakan perintah manual
`/approve` ketika hasil alat menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agent. Runtime menetapkan
`promptMode` untuk setiap run (bukan konfigurasi yang menghadap pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agent; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (jika diketahui), Runtime, dan konteks
  yang diinjeksi tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Ketika `promptMode=minimal`, prompt tambahan yang diinjeksi diberi label **Subagent
Context** alih-alih **Group Chat Context**.

Untuk run auto-reply channel, OpenClaw dapat menghilangkan bagian **Silent Replies**
generik ketika konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanisme token
baik di prompt sistem global maupun konteks channel.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt happy-path yang dikomit untuk runtime Codex/message-tool
di bawah `test/fixtures/agents/prompt-snapshots/happy-path/`. Snapshot tersebut merender
instruksi developer app-server Codex milik OpenClaw, parameter thread
start/resume terpilih, input pengguna giliran, dan spesifikasi alat dinamis untuk giliran Telegram direct,
grup Discord, dan heartbeat. Prompt sistem Codex dasar yang tersembunyi dan
instruksi mode kolaborasi Codex berskup giliran dimiliki oleh runtime Codex
dan tidak dirender oleh OpenClaw.

Buat ulang dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Project Context** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` jika ada

Semua file ini **diinjeksi ke jendela konteks** pada setiap giliran kecuali
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada run normal ketika
heartbeat dinonaktifkan untuk agent default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang diinjeksi
tetap ringkas — terutama `MEMORY.md`, yang dapat bertumbuh seiring waktu dan menyebabkan
penggunaan konteks yang sangat tinggi tanpa terduga serta Compaction yang lebih sering.

<Note>
File harian `memory/*.md` **bukan** bagian dari Project Context bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai permintaan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model secara eksplisit membacanya. Giliran `/new` dan `/reset` kosong adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan marker. Ukuran maksimum per file dikontrol oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang diinjeksi
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menginjeksi marker file-hilang singkat. Ketika pemotongan
terjadi, OpenClaw dapat menginjeksi blok peringatan di Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agent hanya menginjeksi `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar agar konteks sub-agent tetap kecil).

Hook internal dapat mengintersep langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang diinjeksi (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agent terdengar lebih tidak generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang diinjeksi (mentah vs diinjeksi, pemotongan, ditambah overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian **Current Date & Time** khusus ketika
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, bagian ini kini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` ketika agent memerlukan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama secara opsional dapat menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Ketika skill yang memenuhi syarat ada, OpenClaw menginjeksi **daftar skills tersedia** yang ringkas
(`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi
yang tercantum (workspace, terkelola, atau bundled). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agent efektif ketika `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel Plugin hanya memenuhi syarat ketika plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih mendalam tanpa menyematkan semua
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

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang ditargetkan.

Anggaran daftar skills dimiliki oleh subsistem skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime berbatas generik menggunakan permukaan yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan tersebut menjaga ukuran skills tetap terpisah dari ukuran pembacaan/injeksi runtime seperti
`memory_get`, hasil alat langsung, dan refresh AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Documentation**. Ketika dokumentasi lokal tersedia, bagian ini
menunjuk ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm
yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root
sumber lokal agar agent dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL
sumber GitHub dan memberi tahu agent untuk meninjau sumber di sana setiap kali dokumentasi tidak lengkap atau
usang. Prompt juga mencatat mirror dokumentasi publik, komunitas Discord, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skills. Prompt memberi tahu model untuk
berkonsultasi dengan dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri bila memungkinkan (bertanya kepada pengguna hanya ketika tidak memiliki akses).
Khusus untuk konfigurasi, prompt mengarahkan agent ke aksi alat `gateway`
`config.schema.lookup` untuk dokumentasi dan batasan tingkat field yang tepat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
