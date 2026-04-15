---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/heartbeat
    - Mengubah bootstrap workspace atau perilaku injeksi Skills
summary: Apa saja yang terkandung dalam prompt sistem OpenClaw dan bagaimana prompt itu disusun
title: Prompt Sistem
x-i18n:
    generated_at: "2026-04-15T19:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt Sistem

OpenClaw membuat prompt sistem kustom untuk setiap eksekusi agen. Prompt ini **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disisipkan ke setiap eksekusi agen.

Plugin penyedia dapat menambahkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt yang dimiliki OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyisipkan **prefiks stabil** di atas batas cache prompt
- menyisipkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian spesifik keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global, bukan untuk perilaku penyedia normal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran structured-tool ditambah panduan penggunaan alat saat runtime.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau menghindari pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan
  pengguna yang eksplisit. Alat `gateway` yang khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec yang dilindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak istimewa tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, root repo (bila terdeteksi), tingkat thinking (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan Cron untuk tindak lanjut di masa mendatang (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali lalu andalkan
  jalur wake berbasis push saat perintah menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi ketika Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugasnya lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen bersifat
  berbasis push dan diumumkan kembali secara otomatis kepada peminta
- jangan mem-poll `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, mempertahankan tepat satu langkah
`in_progress`, dan menghindari mengulang seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam prompt sistem bersifat anjuran. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan yang keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan bawaan, prompt runtime kini memberi tahu
agen untuk lebih dulu mengandalkan UI persetujuan bawaan tersebut. Agen hanya boleh menyertakan perintah manual
`/approve` ketika hasil alat menyatakan bahwa persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat oleh pengguna):

- `full` (default): mencakup semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **Pembaruan Mandiri OpenClaw**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (bila diketahui), Runtime, dan konteks yang
  disisipkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disisipkan diberi label **Subagent
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

Semua file ini **disisipkan ke dalam context window** pada setiap giliran kecuali
berlaku gate khusus file. `HEARTBEAT.md` dihilangkan pada eksekusi normal ketika
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang disisipkan tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan penggunaan konteks yang sangat tinggi serta Compaction yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa file tersebut diakses sesuai kebutuhan melalui alat
> `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> context window kecuali model secara eksplisit membacanya. Giliran `/new` dan
> `/reset` tanpa tambahan adalah pengecualian: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 20000). Total konten bootstrap yang disisipkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 150000). File yang hilang menyisipkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyisipkan blok peringatan di Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyisipkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disisipkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat suara agen terdengar kurang generik, mulai dari
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disisipkan (mentah vs disisipkan, pemotongan, serta overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian **Current Date & Time** khusus saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, bagian ini sekarang hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu status
mencakup baris timestamp. Alat yang sama juga dapat secara opsional menetapkan override
model per sesi (`model=default` akan menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/id/date-time) untuk detail lengkap perilakunya.

## Skills

Saat ada skill yang memenuhi syarat, OpenClaw menyisipkan **daftar Skills yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang terdaftar
(workspace, terkelola, atau terbundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/config runtime,
dan allowlist skill agen yang efektif saat `agents.defaults.skills` atau
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

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

Anggaran daftar skill dimiliki oleh subsistem skill:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime generik yang dibatasi menggunakan surface yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran skill tetap terpisah dari ukuran baca/injeksi runtime seperti
`memory_get`, hasil alat langsung, dan penyegaran AGENTS.md pasca-Compaction.

## Documentation

Saat tersedia, prompt sistem mencakup bagian **Documentation** yang menunjuk ke
direktori dokumentasi OpenClaw lokal (baik `docs/` di workspace repo maupun dokumentasi paket npm
yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt menginstruksikan model untuk lebih dulu merujuk dokumentasi lokal
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan
`openclaw status` sendiri bila memungkinkan (hanya meminta pengguna ketika tidak memiliki akses).
