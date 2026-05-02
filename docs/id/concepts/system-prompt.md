---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa yang dimuat dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-02T23:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem khusus untuk setiap proses agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap proses agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
seluruh prompt yang dimiliki OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyetelan khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
higiene alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran structured-tool plus panduan penggunaan alat runtime.
- **Execution Bias**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjutkan sampai selesai atau terblokir, pulih dari hasil alat
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan eksplisit pengguna.
  Alat khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: jalur lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime sandbox, jalur sandbox, dan apakah exec dengan elevasi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeats**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), tingkat berpikir (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menjaga konten stabil besar, termasuk **Project Context**, di atas
batas cache prompt internal. Bagian channel/sesi yang volatil seperti
panduan embed Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan kembali prefiks workspace yang stabil
di seluruh giliran channel. Deskripsi alat juga harus menghindari penyematan nama
channel saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan jangka panjang:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat bangun otomatis saat selesai diaktifkan, mulai perintah sekali dan andalkan
  jalur bangun berbasis push saat ia memancarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, prioritaskan `sessions_spawn`; penyelesaian sub-agen bersifat
  berbasis push dan otomatis mengumumkan kembali kepada peminta
- jangan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat saran. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap proses (bukan konfigurasi yang menghadap pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (saat diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
Context**, bukan **Group Chat Context**.

Untuk proses balasan otomatis channel, OpenClaw dapat menghilangkan bagian **Silent Replies**
generik saat konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanika token
baik di prompt sistem global maupun konteks channel.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang di-commit untuk jalur bahagia runtime Codex di bawah
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot ini merender
parameter thread/giliran app-server terpilih plus stack lapisan prompt terikat model
yang direkonstruksi untuk giliran langsung Telegram, grup Discord, dan heartbeat. Stack tersebut
mencakup fixture prompt model Codex `gpt-5.5` yang dipin dan dihasilkan dari bentuk
katalog/cache model Codex, teks developer izin jalur bahagia Codex,
instruksi developer OpenClaw, input giliran pengguna, dan referensi ke spesifikasi alat
dinamis.

Segarkan fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru kemudian fallback ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang di-commit.
Berikan `--catalog <path>` untuk menyegarkan dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini masih bukan tangkapan permintaan OpenAI mentah byte-demi-byte. Codex
dapat menambahkan konteks workspace milik runtime seperti `AGENTS.md`, konteks
lingkungan, memori, instruksi app/plugin, dan instruksi mode kolaborasi masa depan
di dalam runtime Codex setelah OpenClaw mengirim parameter thread dan giliran.

Regenerasikan dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard batas
tambahan agar perubahan prompt dan pembaruan snapshot tetap melekat pada PR yang sama.

## Penyuntikan bootstrap workspace

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
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada proses normal saat
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file
yang disuntikkan tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang sangat tinggi secara tidak terduga serta Compaction yang lebih sering.

Saat sesi berjalan pada harness Codex native, Codex memuat `AGENTS.md`
melalui penemuan dokumen proyeknya sendiri. OpenClaw tetap menyelesaikan file
bootstrap lainnya dan meneruskannya sebagai instruksi konfigurasi Codex, sehingga `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan
`MEMORY.md` mempertahankan peran konteks workspace yang sama tanpa menduplikasi
`AGENTS.md`.

<Note>
File harian `memory/*.md` **bukan** bagian dari Project Context bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model secara eksplisit membacanya. Giliran `/new` dan `/reset` kosong adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap
yang disuntikkan di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk mengubah atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Current Date & Time** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, kini bagian ini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama dapat secara opsional menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skills tersedia**
yang ringkas (`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel Plugin hanya memenuhi syarat saat Plugin pemiliknya diaktifkan.
Ini memungkinkan Plugin alat mengekspos panduan operasi yang lebih mendalam tanpa menyematkan seluruh
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
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime berbatas generik menggunakan surface yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran Skills tetap terpisah dari ukuran pembacaan/injeksi runtime seperti `memory_get`, hasil tool langsung, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian ini mengarah ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini kembali ke [https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root sumber lokal sehingga agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana kapan pun dokumentasi tidak lengkap atau usang. Prompt ini juga mencatat mirror dokumentasi publik, Discord komunitas, dan ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt ini memberi tahu model untuk berkonsultasi dengan dokumentasi terlebih dahulu terkait perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan `openclaw status` sendiri jika memungkinkan (hanya meminta pengguna saat tidak memiliki akses). Khusus untuk konfigurasi, prompt ini mengarahkan agen ke tindakan tool `gateway` `config.schema.lookup` untuk dokumentasi dan batasan tingkat bidang yang tepat, lalu ke `docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md` untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
