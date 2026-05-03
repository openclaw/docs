---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku inisialisasi awal ruang kerja atau injeksi Skills
summary: Apa isi prompt sistem OpenClaw dan bagaimana prompt itu disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-03T21:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa menggantikan
prompt penuh yang dimiliki OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyetelan khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang kurang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran alat terstruktur plus panduan penggunaan alat runtime.
- **Execution Bias**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjutkan hingga selesai atau terblokir, pulih dari hasil alat yang lemah,
  periksa status yang dapat berubah secara live, dan verifikasi sebelum memfinalkan.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (jika tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, mem-patch config dengan `config.patch`, mengganti config penuh
  dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna
  eksplisit. Alat khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (jika diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec terelevasi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (jika terdeteksi), level thinking (satu baris).
- **Reasoning**: level visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menjaga konten stabil besar, termasuk **Project Context**, di atas
batas cache prompt internal. Bagian channel/sesi volatil seperti
panduan embed Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, dan **Runtime** ditambahkan di bawah batas tersebut
sehingga backend lokal dengan cache prefiks dapat memakai ulang prefiks workspace yang stabil
di seluruh giliran channel. Deskripsi alat juga sebaiknya menghindari penyematan nama
channel saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik jeda `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push ketika menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah non-sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keselamatan dalam prompt sistem bersifat anjuran. Guardrail memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkan ini sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime sekarang memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah
`/approve` manual ketika hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang ditampilkan kepada pengguna):

- `full` (default): mencakup semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (jika diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
Context** alih-alih **Group Chat Context**.

Untuk eksekusi auto-reply channel, OpenClaw dapat menghilangkan bagian generik **Silent Replies**
ketika konteks chat langsung/grup sudah mencakup perilaku `NO_REPLY`
khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanik token
di prompt sistem global dan konteks channel sekaligus.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang sudah dikomit untuk happy path runtime Codex di bawah
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot tersebut merender
parameter thread/giliran app-server terpilih plus stack lapisan prompt terikat model yang direkonstruksi
untuk giliran langsung Telegram, grup Discord, dan heartbeat. Stack tersebut
mencakup fixture prompt model Codex `gpt-5.5` yang dipin dan dihasilkan dari bentuk
katalog/cache model Codex, teks developer izin happy-path Codex,
instruksi developer OpenClaw, instruksi collaboration-mode dengan cakupan giliran
saat OpenClaw menyediakannya, input giliran pengguna, dan referensi ke spesifikasi alat
dinamis.

Segarkan fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru kemudian fallback ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang dikomit.
Berikan `--catalog <path>` untuk menyegarkan dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini masih bukan tangkapan permintaan OpenAI mentah byte demi byte. Codex
dapat menambahkan konteks workspace milik runtime seperti `AGENTS.md`, konteks
environment, memory, instruksi app/plugin, dan instruksi Default
collaboration-mode bawaan di dalam runtime Codex setelah OpenClaw mengirim
parameter thread dan giliran.

Regenerasi dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard boundary
tambahan sehingga perubahan prompt dan pembaruan snapshot tetap terikat ke PR
yang sama.

## Penyuntikan bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Project Context** sehingga model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` jika ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal ketika
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disuntikkan
tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang sangat tinggi secara tak terduga dan Compaction yang lebih sering.

Saat sesi berjalan pada harness Codex native, Codex memuat `AGENTS.md`
melalui discovery dokumen proyeknya sendiri. OpenClaw tetap menyelesaikan file
bootstrap yang tersisa dan meneruskannya sebagai instruksi config Codex, sehingga `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan
`MEMORY.md` mempertahankan peran konteks workspace yang sama tanpa menduplikasi
`AGENTS.md`.

<Note>
File harian `memory/*.md` **bukan** bagian dari Project Context bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` kosong adalah pengecualian: runtime dapat menambahkan memory harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda singkat file-hilang. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mengintersep langkah ini melalui `agent:bootstrap` untuk mengubah atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar tidak terlalu generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi tiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem mencakup bagian khusus **Current Date & Time** ketika
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, kini bagian tersebut hanya mencakup
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
mencakup baris timestamp. Alat yang sama dapat secara opsional menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat tersedia, OpenClaw menyuntikkan **daftar Skills yang tersedia**
ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi
tercantum (workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan environment/config runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel plugin hanya memenuhi syarat saat plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih dalam tanpa menyematkan semua
panduan tersebut langsung ke setiap deskripsi alat.

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

Anggaran daftar Skills dimiliki oleh subsistem Skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime generik berbatas menggunakan permukaan yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran Skills tetap terpisah dari ukuran baca/injeksi runtime seperti `memory_get`, hasil alat live, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Ketika dokumentasi lokal tersedia, bagian ini mengarah ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini menggunakan fallback ke [https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root sumber lokal sehingga agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana setiap kali dokumentasi tidak lengkap atau usang. Prompt juga mencatat mirror dokumentasi publik, komunitas Discord, dan ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt memberi tahu model untuk berkonsultasi dengan dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan `openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna ketika tidak memiliki akses). Khusus untuk konfigurasi, prompt mengarahkan agen ke tindakan alat `gateway` `config.schema.lookup` untuk dokumentasi dan batasan tingkat bidang yang tepat, lalu ke `docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md` untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
