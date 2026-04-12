---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/detak jantung
    - Mengubah bootstrap workspace atau perilaku penyuntikan Skills
summary: Apa yang terkandung dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt Sistem
x-i18n:
    generated_at: "2026-04-12T09:06:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057f01aac51f7737b5223f61f5d55e552d9011232aebb130426e269d8f6c257f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt Sistem

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar-cache tanpa menggantikan seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyetelan spesifik keluarga model. Pertahankan mutasi prompt lama `before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global, bukan perilaku penyedia normal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Peralatan**: pengingat sumber kebenaran alat terstruktur beserta panduan penggunaan alat saat runtime.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku pencarian kekuasaan atau melewati pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai permintaan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna yang eksplisit. Alat `gateway` yang khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec yang dilindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **File Workspace (disuntikkan)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak istimewa tersedia.
- **Tanggal & Waktu Saat Ini**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Detak Jantung**: prompt detak jantung dan perilaku ack, saat detak jantung diaktifkan untuk agen default.
- **Runtime**: host, OS, node, root repo (saat terdeteksi), tingkat pemikiran (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Peralatan juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugasnya lebih besar, utamakan `sessions_spawn`; penyelesaian sub-agen berbasis
  push dan otomatis diumumkan kembali kepada peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, bagian Peralatan juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, mempertahankan tepat satu langkah
`in_progress`, dan menghindari mengulangi seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat anjuran. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist kanal untuk penegakan yang keras; operator dapat menonaktifkannya sesuai desain.

Pada kanal dengan kartu/tombol persetujuan bawaan, prompt runtime kini memberi tahu
agen untuk terlebih dahulu mengandalkan UI persetujuan bawaan tersebut. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat oleh pengguna):

- `full` (default): mencakup semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **Pembaruan Mandiri OpenClaw**, **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Pesan**, **Balasan Senyap**, dan **Detak Jantung**. Peralatan, **Keamanan**,
  Workspace, Sandbox, Tanggal & Waktu Saat Ini (saat diketahui), Runtime, dan konteks yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Konteks
Subagen** alih-alih **Konteks Obrolan Grup**.

## Penyuntikan bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** agar model melihat konteks identitas dan profil tanpa memerlukan pembacaan eksplisit:

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
detak jantung dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat membesar seiring waktu dan menyebabkan penggunaan konteks yang tidak terduga menjadi tinggi serta pemadatan yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Konteks Proyek. Pada giliran biasa file tersebut diakses sesuai permintaan melalui alat
> `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> jendela konteks kecuali model secara eksplisit membacanya. Giliran kosong `/new` dan
> `/reset` adalah pengecualian: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 20000). Total konten bootstrap yang disuntikkan
lintas file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 150000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Konteks Proyek; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter agar konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulailah dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, ditambah overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, kini prompt hanya mencakup
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu status
menyertakan baris cap waktu. Alat yang sama juga dapat secara opsional menetapkan override model
per sesi (`model=default` akan menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat ada skill yang memenuhi syarat, OpenClaw menyuntikkan **daftar skill tersedia**
yang ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
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

## Dokumentasi

Saat tersedia, prompt sistem menyertakan bagian **Dokumentasi** yang menunjuk ke
direktori dokumentasi OpenClaw lokal (baik `docs/` di workspace repo maupun dokumen paket npm
yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt menginstruksikan model untuk terlebih dahulu berkonsultasi dengan dokumen lokal
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, serta menjalankan
`openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna jika tidak memiliki akses).
