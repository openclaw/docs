---
read_when:
    - Mengedit teks prompt sistem, daftar tool, atau bagian waktu/Heartbeat
    - Mengubah bootstrap workspace atau perilaku injeksi Skills
summary: Apa saja yang terdapat dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-04-26T11:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt ini **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin provider dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik provider untuk penyesuaian khusus keluarga model. Pertahankan mutasi
prompt `before_prompt_build` lama untuk kompatibilitas atau perubahan prompt yang benar-benar
global, bukan untuk perilaku provider normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, output ringkas, disiplin tool,
pencarian paralel, cakupan hasil kiriman, verifikasi, konteks yang hilang, dan
kebersihan tool terminal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source-of-truth structured-tool plus panduan penggunaan tool runtime.
- **Execution Bias**: panduan tindak lanjut yang ringkas: bertindak dalam giliran
  yang sama atas permintaan yang dapat ditindaklanjuti, lanjutkan sampai selesai atau terblokir, pulihkan dari hasil tool
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas
  permintaan eksplisit pengguna. Tool `gateway` yang hanya untuk owner juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumen OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime sandbox, path sandbox, dan apakah exec dengan elevasi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat Heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), level thinking (satu baris).
- **Reasoning**: level visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan Cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah itu menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi ketika Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugasnya lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen bersifat
  berbasis push dan diumumkan otomatis kembali ke peminta
- jangan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari mengulangi seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam prompt sistem bersifat anjuran. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, approval exec, sandboxing, dan allowlist saluran untuk penegakan keras; operator dapat menonaktifkannya secara sengaja.

Pada saluran dengan kartu/tombol approval native, prompt runtime sekarang memberi tahu
agen untuk mengandalkan UI approval native tersebut terlebih dahulu. Agen seharusnya hanya menyertakan
perintah manual `/approve` saat hasil tool mengatakan approval obrolan tidak tersedia atau
approval manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan konfigurasi yang terlihat oleh pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (saat diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
Context** alih-alih **Group Chat Context**.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Project Context** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` saat ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
berlaku gerbang khusus file. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
Heartbeats dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file
yang disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tak terduga tinggi serta Compaction yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa, file-file tersebut diakses sesuai kebutuhan melalui
> tool `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> jendela konteks kecuali model secara eksplisit membacanya. Giliran `/new` dan
> `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama itu.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat suara agen terdengar kurang generik, mulailah dari
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian **Current Date & Time** khusus saat
zona waktu pengguna diketahui. Untuk menjaga cache prompt tetap stabil, sekarang bagian ini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Tool yang sama juga dapat secara opsional menetapkan override model per-sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skill yang tersedia**
ringkas (`formatSkillsForPrompt`) yang menyertakan **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang terdaftar
(workspace, dikelola, atau bawaan). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gerbang metadata skill, pemeriksaan runtime environment/config,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill bawaan Plugin hanya memenuhi syarat saat Plugin pemiliknya diaktifkan.
Ini memungkinkan tool Plugin mengekspos panduan operasional yang lebih mendalam tanpa menanamkan semua
panduan tersebut langsung ke setiap deskripsi tool.

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

Anggaran daftar skill dimiliki oleh subsistem skill:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per-agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Cuplikan runtime berbatas generik menggunakan surface yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran skill tetap terpisah dari ukuran baca/injeksi runtime seperti
`memory_get`, hasil tool langsung, dan penyegaran AGENTS.md pasca-Compaction.

## Documentation

Prompt sistem menyertakan bagian **Documentation**. Saat dokumen lokal tersedia, bagian ini
menunjuk ke direktori dokumen OpenClaw lokal (`docs/` dalam checkout Git atau dokumen bawaan paket
npm). Jika dokumen lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi source OpenClaw. Checkout Git mengekspos root
source lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan
URL source GitHub dan memberi tahu agen untuk meninjau source di sana ketika dokumen tidak lengkap atau
usang. Prompt juga menyebut mirror dokumen publik, Discord komunitas, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt ini memberi tahu model untuk
berkonsultasi dengan dokumen terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri bila memungkinkan (hanya meminta pengguna saat tidak memiliki akses).
Khusus untuk konfigurasi, prompt ini mengarahkan agen ke aksi tool `gateway`
`config.schema.lookup` untuk dokumen dan batasan tingkat field yang akurat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
