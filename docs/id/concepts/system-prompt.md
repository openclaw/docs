---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/detak jantung
    - Mengubah bootstrap workspace atau perilaku injeksi Skills
summary: Apa saja yang terkandung dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt Sistem
x-i18n:
    generated_at: "2026-04-08T02:14:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e55fc886bc8ec47584d07c9e60dfacd964dc69c7db976ea373877dc4fe09a79a
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt Sistem

OpenClaw membangun prompt sistem khusus untuk setiap eksekusi agen. Prompt tersebut **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menambahkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Pertahankan
mutasi prompt legacy `before_prompt_build` untuk kompatibilitas atau perubahan prompt
yang benar-benar global, bukan perilaku penyedia normal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian yang tetap:

- **Tooling**: pengingat sumber kebenaran alat terstruktur ditambah panduan penggunaan alat saat runtime.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku yang mengejar kekuasaan atau melewati pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai permintaan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan
  eksplisit pengguna. Alat `gateway` khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias legacy `tools.bash.*`
  yang dinormalisasi ke path exec yang dilindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (disuntikkan)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak lebih tinggi tersedia.
- **Tanggal & Waktu Saat Ini**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, root repo (saat terdeteksi), tingkat thinking (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali saja dan andalkan
  jalur wake berbasis push saat perintah menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, lebih baik gunakan `sessions_spawn`; penyelesaian subagen berbasis
  push dan otomatis diumumkan kembali ke peminta
- jangan mem-poll `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari mengulangi seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat anjuran. Mereka memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan yang keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan bawaan, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan bawaan tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk subagen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat oleh pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk subagen; menghilangkan **Skills**, **Memory Recall**, **Pembaruan Mandiri OpenClaw**, **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Messaging**, **Balasan Senyap**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Tanggal & Waktu Saat Ini (saat diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Konteks
Subagen** alih-alih **Konteks Obrolan Grup**.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` jika ada, atau `memory.md` sebagai fallback huruf kecil

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
ada gate khusus file yang berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang
disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tidak terduga tinggi serta pemadatan yang lebih sering.

> **Catatan:** file harian `memory/*.md` **tidak** disuntikkan secara otomatis. File tersebut
> diakses sesuai permintaan melalui alat `memory_search` dan `memory_get`, sehingga
> tidak dihitung terhadap jendela konteks kecuali model secara eksplisit membacanya.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 20000). Total konten bootstrap
yang disuntikkan di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 150000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan di Konteks Proyek; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks subagen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat suara agen terdengar kurang generik, mulailah dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, prompt kini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris stempel waktu. Alat yang sama juga dapat secara opsional menetapkan override
model per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skill yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi
yang tercantum (workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/config runtime,
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

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

## Dokumentasi

Saat tersedia, prompt sistem menyertakan bagian **Documentation** yang menunjuk ke
direktori dokumentasi OpenClaw lokal (baik `docs/` di workspace repo atau dokumentasi
paket npm yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt menginstruksikan model untuk terlebih dahulu berkonsultasi dengan dokumentasi lokal
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, serta menjalankan
`openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna saat tidak memiliki akses).
