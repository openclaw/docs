---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa isi prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-02T22:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membuat prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirangkai oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa mengganti
prompt lengkap milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian spesifik keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan spesifik model untuk penguncian persona, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang kurang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Peralatan**: pengingat sumber kebenaran alat terstruktur plus panduan penggunaan alat runtime.
- **Bias Eksekusi**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, teruskan hingga selesai atau terblokir, pulih dari hasil alat yang lemah,
  periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (jika tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti config lengkap
  dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna yang eksplisit.
  Alat khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: jalur lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan membacanya.
- **File Workspace (disuntikkan)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (jika diaktifkan): menunjukkan runtime sandbox, jalur sandbox, dan apakah exec dengan elevasi tersedia.
- **Tanggal & Waktu Saat Ini**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeat**: prompt Heartbeat dan perilaku ack, saat Heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (jika terdeteksi), tingkat pemikiran (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menjaga konten stabil besar, termasuk **Konteks Proyek**, di atas
batas cache prompt internal. Bagian channel/sesi yang volatil seperti
panduan sematan Control UI, **Pesan**, **Suara**, **Konteks Chat Grup**,
**Reaksi**, **Heartbeat**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan kembali prefiks workspace yang stabil
di seluruh giliran channel. Deskripsi alat juga sebaiknya menghindari penyematan nama
channel saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Peralatan juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa mendatang (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, lebih baik gunakan `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Peralatan juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat nasihat. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen sebaiknya hanya menyertakan perintah manual
`/approve` saat hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang ditampilkan kepada pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Pemanggilan Memori**, **Pembaruan Mandiri OpenClaw**,
  **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Pesan**, **Balasan Senyap**, dan **Heartbeat**. Peralatan, **Keamanan**,
  Workspace, Sandbox, Tanggal & Waktu Saat Ini (jika diketahui), Runtime, dan konteks yang disuntikkan
  tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Konteks Subagen**
alih-alih **Konteks Chat Grup**.

Untuk eksekusi balasan otomatis channel, OpenClaw dapat menghilangkan bagian **Balasan Senyap**
generik saat konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` spesifik percakapan yang telah di-resolve. Ini menghindari pengulangan mekanika token
di prompt sistem global dan konteks channel sekaligus.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt jalur sukses yang sudah dikomit untuk runtime
Codex/alat pesan di bawah `test/fixtures/agents/prompt-snapshots/happy-path/`. Snapshot tersebut merender
parameter thread/giliran app-server terpilih plus stack lapisan prompt terikat model yang direkonstruksi
untuk giliran Telegram langsung, grup Discord, dan Heartbeat. Stack tersebut
menyertakan fixture prompt model Codex `gpt-5.5` yang dipin dan dihasilkan dari bentuk
katalog/cache model Codex, teks developer izin jalur sukses Codex,
instruksi developer OpenClaw, input giliran pengguna, dan referensi ke spesifikasi
alat dinamis.

Refresh fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru kemudian fallback ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang dikomit.
Berikan `--catalog <path>` untuk me-refresh dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini masih bukan tangkapan request OpenAI mentah byte demi byte. Codex
dapat menambahkan konteks workspace milik runtime seperti `AGENTS.md`, konteks
environment, memori, instruksi app/plugin, dan instruksi mode kolaborasi masa depan
di dalam runtime Codex setelah OpenClaw mengirim parameter thread dan giliran.

Regenerasi dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard
batas tambahan agar perubahan prompt dan pembaruan snapshot tetap melekat pada PR yang sama.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** agar model melihat konteks identitas dan profil tanpa perlu membaca eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace baru)
- `MEMORY.md` jika ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
gate spesifik file berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
Heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disuntikkan
tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang sangat tinggi secara tak terduga serta Compaction yang lebih sering.

<Note>
File harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan marker. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan marker singkat file hilang. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan dalam Konteks Proyek; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mengintersepsi langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar lebih tidak generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Untuk menjaga cache prompt tetap stabil, kini bagian ini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama juga dapat secara opsional menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skills yang tersedia** yang ringkas
(`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, terkelola, atau bundled). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan environment/config runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel Plugin memenuhi syarat hanya saat plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih dalam tanpa menyematkan semua
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

Kutipan runtime terbatas generik menggunakan permukaan berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan tersebut menjaga ukuran skills terpisah dari ukuran pembacaan/injeksi runtime seperti
`memory_get`, hasil alat langsung, dan refresh AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian tersebut mengarah ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian tersebut menggunakan cadangan [https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root sumber lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana kapan pun dokumentasi tidak lengkap atau sudah usang. Prompt tersebut juga mencatat cermin dokumentasi publik, Discord komunitas, dan ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt tersebut memberi tahu model untuk membaca dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan `openclaw status` sendiri bila memungkinkan (meminta pengguna hanya saat tidak memiliki akses). Khusus untuk konfigurasi, prompt tersebut mengarahkan agen ke tindakan alat `gateway` `config.schema.lookup` untuk dokumentasi dan batasan tingkat bidang yang tepat, lalu ke `docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md` untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
