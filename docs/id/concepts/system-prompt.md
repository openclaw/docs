---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa isi prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-06T09:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt ini **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt disusun oleh OpenClaw dan diinjeksi ke setiap eksekusi agen.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
seluruh prompt yang dimiliki OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menginjeksikan **prefiks stabil** di atas batas cache prompt
- menginjeksikan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Pertahankan mutasi prompt legacy
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk persona latching, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Peralatan**: pengingat sumber kebenaran alat terstruktur plus panduan penggunaan alat runtime.
- **Bias Eksekusi**: panduan tindak lanjut ringkas: bertindak dalam giliran untuk
  permintaan yang dapat ditindaklanjuti, lanjutkan sampai selesai atau terblokir, pulih dari hasil alat
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum menyelesaikan.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan eksplisit pengguna.
  Alat khusus pemilik `gateway` juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias legacy `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Ruang Kerja**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: jalur lokal ke dokumen OpenClaw (repo atau paket npm) dan kapan membacanya.
- **File Ruang Kerja (diinjeksikan)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, jalur sandbox, dan apakah exec yang ditinggikan tersedia.
- **Tanggal & Waktu Saat Ini**: zona waktu saja (stabil-cache; jam langsung berasal dari `session_status`).
- **Tag Balasan**: sintaks tag balasan opsional untuk penyedia yang didukung.
- **Heartbeat**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, akar repo (bila terdeteksi), tingkat berpikir (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menempatkan konten stabil besar, termasuk **Konteks Proyek**, di atas
batas cache prompt internal. Bagian channel/sesi yang volatil seperti
panduan embed Control UI, **Pesan**, **Suara**, **Konteks Chat Grup**,
**Reaksi**, **Heartbeat**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan ulang prefiks ruang kerja stabil
di seluruh giliran channel. Deskripsi alat juga sebaiknya menghindari penyematan nama
channel saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Peralatan juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik jeda `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian sub-agen bersifat
  berbasis push dan otomatis diumumkan kembali kepada peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat alat eksperimental `update_plan` diaktifkan, Peralatan juga memberi tahu
model agar menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan di prompt sistem bersifat advisori. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen agar mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan config yang terlihat pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Skills**, **Pemanggilan Memori**, **Pembaruan Mandiri OpenClaw**,
  **Alias Model**, **Identitas Pengguna**, **Tag Balasan**,
  **Pesan**, **Balasan Senyap**, dan **Heartbeat**. Peralatan, **Keamanan**,
  Ruang Kerja, Sandbox, Tanggal & Waktu Saat Ini (bila diketahui), Runtime, dan konteks
  yang diinjeksikan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang diinjeksikan diberi label **Konteks Subagen**
alih-alih **Konteks Chat Grup**.

Untuk eksekusi balasan otomatis channel, OpenClaw dapat menghilangkan bagian generik **Balasan Senyap**
saat konteks chat langsung/grup sudah menyertakan perilaku
`NO_REPLY` khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanika token
di prompt sistem global dan konteks channel sekaligus.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang dikomit untuk jalur sukses runtime Codex di bawah
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot ini merender
parameter thread/giliran app-server terpilih plus tumpukan lapisan prompt terikat-model
yang direkonstruksi untuk giliran Telegram langsung, grup Discord, dan heartbeat. Tumpukan itu
mencakup fixture prompt model Codex `gpt-5.5` yang dipin dan dihasilkan dari bentuk
katalog/cache model Codex, teks developer izin jalur sukses Codex,
instruksi developer OpenClaw, instruksi mode kolaborasi berskup giliran
saat OpenClaw menyediakannya, input giliran pengguna, dan referensi ke spesifikasi alat
dinamis.

Segarkan fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru setelah itu fallback ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang dikomit.
Berikan `--catalog <path>` untuk menyegarkan dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini masih bukan tangkapan permintaan mentah OpenAI byte-demi-byte. Codex
dapat menambahkan konteks ruang kerja milik runtime seperti `AGENTS.md`, konteks
lingkungan, memori, instruksi app/plugin, dan instruksi mode kolaborasi Default
bawaan di dalam runtime Codex setelah OpenClaw mengirim
parameter thread dan giliran.

Buat ulang dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard boundary
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

Semua file ini **diinjeksikan ke jendela konteks** pada setiap giliran kecuali
berlaku gate khusus file. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang diinjeksikan
tetap ringkas — terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tidak terduga tinggi serta compaction yang lebih sering.

Saat sesi berjalan pada harness Codex native, Codex memuat `AGENTS.md`
melalui penemuan dokumen proyeknya sendiri. OpenClaw tetap menyelesaikan file bootstrap
lainnya dan meneruskannya sebagai instruksi config Codex, sehingga `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan
`MEMORY.md` mempertahankan peran konteks ruang kerja yang sama tanpa menduplikasi
`AGENTS.md`.

<Note>
File harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup satu kali untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang diinjeksikan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menginjeksikan penanda singkat file-hilang. Saat pemotongan
terjadi, OpenClaw dapat menginjeksikan pemberitahuan peringatan prompt sistem yang ringkas; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`). Hitungan mentah/terinjeksi yang terperinci tetap berada di diagnostik seperti
`/context`, `/status`, doctor, dan log.

Sesi sub-agen hanya menginjeksikan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mengintersepsi langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang diinjeksikan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar tidak terlalu generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang diinjeksikan (mentah vs terinjeksi, pemotongan, plus overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, kini bagian tersebut hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama secara opsional dapat menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat skill yang memenuhi syarat ada, OpenClaw menginjeksikan **daftar skills yang tersedia** yang ringkas
(`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(ruang kerja, terkelola, atau bundled). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/config runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill yang dibundel plugin hanya memenuhi syarat saat plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih mendalam tanpa menyematkan semua
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

Anggaran daftar Skills dimiliki oleh subsistem Skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime terbatas generik menggunakan permukaan yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran Skills tetap terpisah dari ukuran pembacaan/injeksi runtime seperti
`memory_get`, hasil alat langsung, dan penyegaran AGENTS.md setelah Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian itu
mengarah ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket
npm bawaan). Jika dokumentasi lokal tidak tersedia, bagian itu beralih ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root sumber lokal
agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL sumber GitHub
dan meminta agen meninjau sumber di sana kapan pun dokumentasi tidak lengkap atau
usang. Prompt juga mencatat cermin dokumentasi publik, Discord komunitas, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt memberi tahu model untuk
berkonsultasi dengan dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri saat memungkinkan (hanya meminta pengguna ketika tidak memiliki akses).
Khusus untuk konfigurasi, prompt mengarahkan agen ke tindakan alat `gateway`
`config.schema.lookup` untuk dokumentasi dan batasan tingkat bidang yang tepat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
