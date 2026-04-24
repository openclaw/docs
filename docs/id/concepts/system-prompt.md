---
read_when:
    - Mengedit teks system prompt, daftar tool, atau bagian waktu/Heartbeat
    - Mengubah bootstrap workspace atau perilaku injeksi Skills
summary: Apa saja isi system prompt OpenClaw dan bagaimana prompt tersebut dirakit
title: System prompt
x-i18n:
    generated_at: "2026-04-24T09:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw membangun system prompt kustom untuk setiap proses agen. Prompt ini **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap proses agen.

Plugin provider dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas prompt cache
- menyuntikkan **sufiks dinamis** di bawah batas prompt cache

Gunakan kontribusi milik provider untuk penyesuaian spesifik keluarga model. Pertahankan mutasi
prompt lama `before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global, bukan perilaku provider normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan spesifik model untuk persona latching, output ringkas, disiplin tool,
lookup paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan terminal-tool.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source-of-truth structured-tool ditambah panduan penggunaan tool saat runtime.
- **Execution Bias**: panduan tindak lanjut yang ringkas: bertindak dalam giliran
  pada permintaan yang dapat ditindaklanjuti, lanjutkan sampai selesai atau terblokir, pulihkan dari hasil tool
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau mengakali pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai permintaan.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas
  permintaan pengguna yang eksplisit. Tool `gateway` yang hanya untuk owner juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak lebih tinggi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat Heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), level thinking (satu baris).
- **Reasoning**: level visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan Cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali lalu andalkan
  jalur wake berbasis push saat perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, utamakan `sessions_spawn`; penyelesaian subagen berbasis
  push dan diumumkan otomatis kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu model
untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari mengulangi seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam system prompt bersifat anjuran. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk lebih dulu mengandalkan UI persetujuan native tersebut. Agen hanya boleh menyertakan perintah
manual `/approve` ketika hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender system prompt yang lebih kecil untuk subagen. Runtime menetapkan
`promptMode` untuk setiap proses (bukan konfigurasi yang terlihat pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk subagen; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
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
- `MEMORY.md` jika ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
ada gate khusus file yang berlaku. `HEARTBEAT.md` dihilangkan pada proses normal saat
Heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang
disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tidak terduga tinggi serta Compaction yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa file tersebut diakses sesuai permintaan melalui tool
> `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> jendela konteks kecuali model secara eksplisit membacanya. Giliran `/new` dan
> `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan di Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks subagen tetap kecil).

Hooks internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulai dari
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

System prompt menyertakan bagian khusus **Current Date & Time** saat
zona waktu pengguna diketahui. Agar prompt tetap stabil untuk cache, bagian ini sekarang hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Tool yang sama juga dapat secara opsional menetapkan override model
per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat ada skill yang memenuhi syarat, OpenClaw menyuntikkan **daftar Skills yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
mengarahkan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, terkelola, atau bawaan). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Ini menjaga prompt dasar tetap kecil sekaligus tetap memungkinkan penggunaan skill yang terarah.

Anggaran daftar Skills dimiliki oleh subsistem skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Cuplikan runtime terbatas generik menggunakan surface yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran Skills tetap terpisah dari ukuran baca/injeksi runtime seperti
`memory_get`, hasil tool langsung, dan refresh AGENTS.md pasca-Compaction.

## Documentation

Saat tersedia, system prompt menyertakan bagian **Documentation** yang menunjuk ke
direktori dokumen OpenClaw lokal (baik `docs/` di workspace repo atau dokumen paket npm
bawaan) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt mengarahkan model untuk berkonsultasi dengan dokumen lokal terlebih dahulu
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, serta menjalankan
`openclaw status` sendiri saat memungkinkan (hanya bertanya kepada pengguna bila tidak memiliki akses).

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
