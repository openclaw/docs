---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa isi prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-04T02:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membuat prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
prompt lengkap milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyetelan khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, keluaran ringkas, disiplin tool,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan tool terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran tool terstruktur plus panduan penggunaan tool runtime.
- **Bias Eksekusi**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjut sampai selesai atau terblokir, pulih dari hasil tool
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti konfigurasi lengkap
  dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan eksplisit pengguna.
  Tool khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec yang dilindungi tersebut.
- **Ruang Kerja**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: jalur lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan membacanya.
- **File Ruang Kerja (disuntikkan)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, jalur sandbox, dan apakah exec yang ditinggikan tersedia.
- **Tanggal & Waktu Saat Ini**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeat**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (bila terdeteksi), tingkat berpikir (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menjaga konten stabil besar, termasuk **Konteks Proyek**, di atas
batas cache prompt internal. Bagian kanal/sesi yang volatil seperti
panduan embed UI Kontrol, **Pesan**, **Suara**, **Konteks Chat Grup**,
**Reaksi**, **Heartbeat**, dan **Runtime** ditambahkan di bawah batas itu
sehingga backend lokal dengan cache prefiks dapat menggunakan ulang prefiks ruang kerja stabil
di seluruh giliran kanal. Deskripsi tool juga sebaiknya menghindari penyematan nama
kanal saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan berdurasi panjang:

- gunakan cron untuk tindak lanjut mendatang (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- ketika bangun penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur bangun berbasis push saat perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat nasihat. Guardrail tersebut memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist kanal untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada kanal dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` ketika hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan konfigurasi yang terlihat oleh pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Recall Memori**, **Pembaruan Mandiri OpenClaw**,
  **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Pesan**, **Balasan Senyap**, dan **Heartbeat**. Tooling, **Keamanan**,
  Ruang Kerja, Sandbox, Tanggal & Waktu Saat Ini (bila diketahui), Runtime, dan konteks yang
  disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Konteks Subagen**
alih-alih **Konteks Chat Grup**.

Untuk eksekusi balasan otomatis kanal, OpenClaw dapat menghilangkan bagian umum **Balasan Senyap**
ketika konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` khusus percakapan yang sudah diselesaikan. Ini menghindari pengulangan mekanik token
di prompt sistem global dan konteks kanal.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang dikomit untuk jalur sukses runtime Codex di
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot tersebut merender
parameter thread/giliran app-server terpilih plus stack lapisan prompt terikat model yang direkonstruksi
untuk giliran langsung Telegram, grup Discord, dan heartbeat. Stack itu
mencakup fixture prompt model Codex `gpt-5.5` yang dipin, dibuat dari bentuk
katalog/cache model Codex, teks developer izin jalur sukses Codex,
instruksi developer OpenClaw, instruksi mode kolaborasi berskala giliran
ketika OpenClaw menyediakannya, input giliran pengguna, dan referensi ke spesifikasi tool
dinamis.

Segarkan fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru kemudian kembali ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang dikomit.
Berikan `--catalog <path>` untuk menyegarkan dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini tetap bukan tangkapan permintaan OpenAI mentah byte-demi-byte. Codex
dapat menambahkan konteks ruang kerja milik runtime seperti `AGENTS.md`, konteks
lingkungan, memori, instruksi app/plugin, dan instruksi mode kolaborasi Default
bawaan di dalam runtime Codex setelah OpenClaw mengirim parameter thread
dan giliran.

Regenerasikan dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard batas
tambahan agar perubahan prompt dan pembaruan snapshot tetap melekat pada PR yang sama.

## Injeksi bootstrap ruang kerja

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** sehingga model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada ruang kerja yang benar-benar baru)
- `MEMORY.md` bila ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal ketika
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disuntikkan
tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang sangat tinggi tanpa diduga serta compaction yang lebih sering.

Saat sesi berjalan pada harness Codex native, Codex memuat `AGENTS.md`
melalui penemuan dokumen proyeknya sendiri. OpenClaw tetap menyelesaikan file
bootstrap lainnya dan meneruskannya sebagai instruksi konfigurasi Codex, sehingga `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan
`MEMORY.md` mempertahankan peran konteks ruang kerja yang sama tanpa menduplikasi
`AGENTS.md`.

<Note>
File harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa file tersebut diakses sesuai kebutuhan melalui tool `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama itu.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file-hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan pemberitahuan peringatan prompt sistem yang ringkas; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`). Hitungan mentah/disuntikkan yang terperinci tetap berada dalam diagnostik seperti
`/context`, `/status`, doctor, dan log.

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lainnya
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar tidak terlalu generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** ketika
zona waktu pengguna diketahui. Untuk menjaga prompt tetap stabil-cache, kini prompt hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris stempel waktu. Tool yang sama dapat secara opsional menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menyuntikkan **daftar skills yang tersedia** yang ringkas
(`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang terdaftar
(ruang kerja, terkelola, atau dibundel). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agen efektif ketika `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel Plugin hanya memenuhi syarat ketika Plugin pemiliknya diaktifkan.
Ini memungkinkan Plugin tool mengekspos panduan operasi yang lebih mendalam tanpa menyematkan semua
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

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang ditargetkan.

Anggaran daftar skills dimiliki oleh subsistem skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime generik berbatas menggunakan antarmuka yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga pengukuran Skills tetap terpisah dari pengukuran baca/injeksi runtime seperti `memory_get`, hasil alat langsung, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian ini menunjuk ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini kembali ke [https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root sumber lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana setiap kali dokumentasi tidak lengkap atau sudah usang. Prompt juga mencatat cermin dokumentasi publik, Discord komunitas, dan ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt memberi tahu model untuk berkonsultasi dengan dokumentasi terlebih dahulu terkait perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan `openclaw status` sendiri jika memungkinkan (hanya bertanya kepada pengguna saat tidak memiliki akses). Khusus untuk konfigurasi, prompt mengarahkan agen ke aksi alat `gateway` `config.schema.lookup` untuk dokumentasi dan batasan tingkat bidang yang tepat, lalu ke `docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md` untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
