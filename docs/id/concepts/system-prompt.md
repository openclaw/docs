---
read_when:
    - Mengedit teks prompt sistem, daftar tools, atau bagian waktu/Heartbeat
    - Mengubah bootstrap workspace atau perilaku injeksi Skills
summary: Apa yang terkandung dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt Sistem
x-i18n:
    generated_at: "2026-04-18T09:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e60705994cebdd9768926168cb1c6d17ab717d7ff02353a5d5e7478ba8191cab
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt Sistem

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt ini **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin provider dapat memberikan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt yang dimiliki OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik provider untuk penyesuaian khusus keluarga model. Simpan
mutasi prompt legacy `before_prompt_build` untuk kompatibilitas atau perubahan
prompt yang benar-benar global, bukan perilaku provider normal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source-of-truth structured-tool ditambah panduan penggunaan tool saat runtime.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mengejar kekuasaan atau mengakali pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai permintaan.
- **OpenClaw Self-Update**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan
  pengguna yang eksplisit. Tool `gateway` yang khusus owner juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias legacy `tools.bash.*`
  yang dinormalisasi ke path exec yang dilindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak istimewa tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), tingkat thinking (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- saat automatic completion wake diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, utamakan `sessions_spawn`; penyelesaian sub-agen berbasis
  push dan otomatis diumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, mempertahankan tepat satu
langkah `in_progress`, dan menghindari mengulang seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam prompt sistem bersifat anjuran. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan yang keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime sekarang memberi tahu
agen untuk mengandalkan UI persetujuan native itu terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat oleh pengguna):

- `full` (default): mencakup semua bagian di atas.
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
- `MEMORY.md` jika ada, jika tidak `memory.md` sebagai fallback huruf kecil

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
berlaku gate khusus file. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file
yang disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat membesar seiring waktu dan menyebabkan
penggunaan konteks yang tak terduga tinggi serta Compaction yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa, file tersebut diakses sesuai permintaan melalui tool
> `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan
> `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan di Project Context; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat suara agen terdengar kurang generik, mulai dengan
[SOUL.md Personality Guide](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian **Current Date & Time** khusus saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, prompt ini sekarang hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris stempel waktu. Tool yang sama juga dapat secara opsional menetapkan override
model per sesi (`model=default` akan menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat tersedia, OpenClaw menyuntikkan **daftar skill yang tersedia**
ringkas (`formatSkillsForPrompt`) yang menyertakan **path file** untuk setiap skill. Prompt ini
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang terdaftar
(workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/runtime dan config,
serta allowlist skill agen efektif saat `agents.defaults.skills` atau
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

Hal ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

Anggaran daftar skill dimiliki oleh subsistem skill:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Cuplikan runtime generik yang dibatasi menggunakan surface yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran skill tetap terpisah dari ukuran baca/injeksi runtime seperti
`memory_get`, hasil tool live, dan penyegaran AGENTS.md pasca-Compaction.

## Documentation

Saat tersedia, prompt sistem menyertakan bagian **Documentation** yang menunjuk ke
direktori dokumentasi OpenClaw lokal (baik `docs/` di workspace repo atau dokumentasi paket npm
yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, serta
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt ini menginstruksikan model untuk berkonsultasi dengan dokumentasi lokal terlebih dahulu
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, serta menjalankan
`openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna saat tidak memiliki akses).
