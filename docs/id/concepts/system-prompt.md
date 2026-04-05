---
read_when:
    - Mengedit teks system prompt, daftar tool, atau bagian waktu/heartbeat
    - Mengubah perilaku bootstrap workspace atau injeksi Skills
summary: Apa saja yang dikandung system prompt OpenClaw dan bagaimana system prompt tersebut dirakit
title: System Prompt
x-i18n:
    generated_at: "2026-04-05T13:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw membangun system prompt khusus untuk setiap eksekusi agen. Prompt ini **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin provider dapat menambahkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt yang dimiliki OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas prompt cache
- menyuntikkan **sufiks dinamis** di bawah batas prompt cache

Gunakan kontribusi milik provider untuk penyetelan khusus keluarga model. Pertahankan mutasi
prompt `before_prompt_build` lama untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan untuk perilaku provider normal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source-of-truth structured-tool ditambah panduan penggunaan tool saat runtime.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan
  pengguna yang eksplisit. Tool `gateway` yang khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumen OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak lebih tinggi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack.
- **Runtime**: host, OS, node, model, root repo (bila terdeteksi), tingkat thinking (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle `/reasoning`.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat automatic completion wake diaktifkan, mulai perintah satu kali dan andalkan
  jalur wake berbasis push ketika perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugasnya lebih besar, pilih `sessions_spawn`; penyelesaian sub-agent berbasis
  push dan diumumkan kembali secara otomatis kepada peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Ketika tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari mengulang seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam system prompt bersifat anjuran. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist kanal untuk penegakan yang keras; operator dapat menonaktifkannya sesuai desain.

Pada kanal dengan kartu/tombol persetujuan bawaan, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan bawaan tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` ketika hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender system prompt yang lebih kecil untuk sub-agent. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat pengguna):

- `full` (default): mencakup semua bagian di atas.
- `minimal`: digunakan untuk sub-agent; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, **Current Date & Time** (bila diketahui), Runtime, dan
  konteks yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Ketika `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
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
- `MEMORY.md` bila ada, jika tidak `memory.md` sebagai fallback huruf kecil

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran, yang
berarti file-file ini mengonsumsi token. Jaga agar tetap ringkas — terutama `MEMORY.md`, yang dapat
bertambah seiring waktu dan menyebabkan penggunaan konteks yang tidak terduga tinggi serta compaction
yang lebih sering.

> **Catatan:** file harian `memory/*.md` **tidak** disuntikkan secara otomatis. File-file tersebut
> diakses sesuai kebutuhan melalui tool `memory_search` dan `memory_get`, sehingga
> tidak dihitung terhadap jendela konteks kecuali model secara eksplisit membacanya.

File besar dipotong dengan sebuah penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 20000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 150000). File yang hilang menyuntikkan penanda file hilang yang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Project Context; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agent hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lainnya
difilter agar konteks sub-agent tetap kecil).

Internal hook dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat suara agen terdengar kurang generik, mulai dengan
[Panduan Kepribadian SOUL.md](/concepts/soul).

Untuk memeriksa seberapa besar kontribusi tiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/concepts/context).

## Penanganan waktu

System prompt menyertakan bagian **Current Date & Time** khusus ketika zona waktu
pengguna diketahui. Agar prompt cache tetap stabil, sekarang bagian ini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` ketika agen membutuhkan waktu saat ini; kartu status
menyertakan baris stempel waktu. Tool yang sama juga secara opsional dapat menetapkan override
model per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/date-time) untuk detail perilaku lengkap.

## Skills

Ketika ada skill yang memenuhi syarat, OpenClaw menyuntikkan **daftar skill yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt ini
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gerbang metadata skill, pemeriksaan lingkungan/config runtime,
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

Hal ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

## Dokumentasi

Bila tersedia, system prompt menyertakan bagian **Documentation** yang menunjuk ke
direktori dokumen OpenClaw lokal (baik `docs/` di workspace repo atau dokumen paket npm
yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt ini menginstruksikan model untuk terlebih dahulu berkonsultasi dengan dokumen lokal
untuk perilaku, perintah, config, atau arsitektur OpenClaw, serta menjalankan
`openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna jika tidak memiliki akses).
