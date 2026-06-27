---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Apa yang terkandung dalam prompt sistem OpenClaw dan bagaimana prompt tersebut disusun
title: Prompt sistem
x-i18n:
    generated_at: "2026-06-27T17:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default runtime.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Perakitan prompt memiliki tiga lapisan:

- `buildAgentSystemPrompt` merender prompt dari input eksplisit. Ini harus
  tetap menjadi renderer murni dan tidak boleh membaca konfigurasi global secara langsung.
- `resolveAgentSystemPromptConfig` menyelesaikan knob prompt berbasis konfigurasi seperti
  tampilan pemilik, petunjuk TTS, alias model, mode sitasi memori, dan mode
  delegasi sub-agen untuk agen tertentu.
- Adapter runtime (tertanam, CLI, pratinjau perintah/ekspor, Compaction) mengumpulkan
  fakta langsung seperti alat, status sandbox, kapabilitas kanal, file konteks,
  dan kontribusi prompt penyedia, lalu memanggil facade prompt yang dikonfigurasi.

Ini menjaga surface prompt ekspor/debug tetap selaras dengan eksekusi langsung tanpa
mengubah setiap detail khusus runtime menjadi satu builder monolitik.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Pertahankan mutasi prompt lama
`before_prompt_build` untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, output ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
higiene alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran alat terstruktur ditambah panduan penggunaan alat runtime.
- **Execution Bias**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjutkan sampai selesai atau terblokir, pulihkan dari hasil alat
  yang lemah, periksa status yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Control**: memberi tahu model untuk lebih memilih alat `gateway` untuk
  pekerjaan konfigurasi/restart dan menghindari mengarang perintah CLI.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna
  eksplisit. Alat `gateway` yang menghadap agen juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke jalur exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: jalur lokal ke docs/source OpenClaw dan kapan membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, jalur sandbox, dan apakah exec terelevasi tersedia.
- **Current Date & Time**: hanya zona waktu (stabil-cache; jam langsung berasal dari `session_status`).
- **Assistant Output Directives**: sintaks lampiran, catatan suara, dan tag balasan yang ringkas.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat Heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, Node, model, root repo (bila terdeteksi), tingkat berpikir (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menyimpan konten stabil besar, termasuk **Project Context**, di atas
batas cache prompt internal. Bagian kanal/sesi yang volatil seperti
panduan embed Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat menggunakan ulang prefiks workspace yang stabil
di seluruh giliran kanal. Deskripsi alat juga sebaiknya menghindari penyematan nama
kanal saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan Cron untuk tindak lanjut di masa mendatang (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat bangun penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur bangun berbasis push saat perintah mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, lebih pilih `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

`agents.defaults.subagents.delegationMode` dapat memperkuat panduan ini. Mode
default `suggest` mempertahankan dorongan dasar. `prefer` menambahkan bagian
**Sub-Agent Delegation** khusus yang memberi tahu agen utama untuk bertindak sebagai koordinator
responsif dan mendorong apa pun yang lebih terlibat daripada balasan langsung melalui
`sessions_spawn`. Ini hanya prompt; kebijakan alat tetap mengontrol apakah
`sessions_spawn` tersedia.

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, mempertahankan tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keselamatan dalam prompt sistem bersifat nasihat. Ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist kanal untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada kanal dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan konfigurasi yang menghadap pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Assistant Output Directives**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  **Skills** saat diberikan, Workspace, Sandbox, Current Date & Time (saat
  diketahui), Runtime, dan konteks yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
Context**, bukan **Group Chat Context**.

Untuk eksekusi balasan otomatis kanal, OpenClaw menghilangkan bagian generik **Silent Replies**
saat konteks langsung, grup, atau hanya alat pesan memiliki kontrak balasan terlihat.
Hanya mode grup/kanal otomatis lama yang harus menampilkan `NO_REPLY`; chat langsung
dan balasan hanya alat pesan tidak menerima panduan token senyap.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang dikomit untuk jalur berhasil runtime Codex di bawah
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot tersebut merender
parameter thread/giliran app-server terpilih ditambah stack lapisan prompt yang direkonstruksi untuk model
untuk giliran langsung Telegram, grup Discord, dan Heartbeat. Stack tersebut
menyertakan fixture prompt model Codex `gpt-5.5` yang dipin yang dihasilkan dari
bentuk katalog/cache model Codex, teks developer izin jalur berhasil Codex,
instruksi developer OpenClaw, instruksi mode kolaborasi berskala giliran
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

Snapshot ini tetap bukan tangkapan permintaan mentah OpenAI byte-demi-byte. Codex
dapat menambahkan konteks workspace milik runtime seperti `AGENTS.md`, konteks
lingkungan, memori, instruksi app/plugin, dan instruksi mode kolaborasi Default
bawaan di dalam runtime Codex setelah OpenClaw mengirim parameter thread dan
giliran.

Regenerasikan dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard boundary
tambahan agar perubahan prompt dan pembaruan snapshot tetap melekat pada PR
yang sama.

## Injeksi bootstrap workspace

File bootstrap diselesaikan dari workspace aktif, lalu diarahkan ke
surface prompt yang cocok dengan masa hidupnya:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` saat ada

Pada harness Codex native, OpenClaw menghindari pengulangan file workspace stabil
di setiap giliran pengguna. Codex memuat `AGENTS.md` melalui penemuan project-doc
miliknya sendiri. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, dan `USER.md` diteruskan sebagai
instruksi developer Codex. Daftar Skills OpenClaw yang ringkas juga diteruskan
sebagai instruksi developer kolaborasi berskala giliran. Konten `HEARTBEAT.md`
tidak disuntikkan; giliran Heartbeat mendapatkan catatan mode kolaborasi yang menunjuk ke file tersebut
saat file ada dan tidak kosong. Konten `MEMORY.md` dari workspace agen yang dikonfigurasi
tidak ditempelkan ke setiap giliran Codex native; saat alat memori
tersedia untuk workspace tersebut, giliran Codex mendapatkan catatan memori-workspace kecil dalam
instruksi developer kolaborasi berskala giliran dan harus menggunakan `memory_search`
atau `memory_get` saat memori tahan lama relevan. Jika alat dinonaktifkan, pencarian memori
tidak tersedia, atau workspace aktif berbeda dari workspace memori agen,
`MEMORY.md` fallback ke jalur konteks-giliran berbatas normal. Konten aktif
`BOOTSTRAP.md` mempertahankan peran konteks-giliran normal untuk saat ini.

Pada harness non-Codex, file bootstrap terus dikomposisikan ke dalam
prompt OpenClaw sesuai gate yang ada. `HEARTBEAT.md` dihilangkan pada
eksekusi normal saat Heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang disuntikkan
tetap ringkas, terutama `MEMORY.md` non-Codex. `MEMORY.md` dimaksudkan untuk tetap
menjadi ringkasan jangka panjang yang dikurasi; catatan harian terperinci seharusnya berada di `memory/*.md` tempat
`memory_search` dan `memory_get` dapat mengambilnya sesuai kebutuhan. File
`MEMORY.md` non-Codex yang terlalu besar meningkatkan penggunaan prompt dan dapat disuntikkan
sebagian karena batas file bootstrap di bawah.

<Note>
File harian `memory/*.md` **bukan** bagian dari Project Context bootstrap normal. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model secara eksplisit membacanya. Giliran `/new` dan `/reset` polos adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks-startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikontrol oleh
`agents.defaults.bootstrapMaxChars` (default: 20000). Total konten bootstrap yang
diinjeksikan di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menginjeksikan penanda file-hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menginjeksikan pemberitahuan peringatan prompt sistem yang ringkas; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `always`). Hitungan mentah/terinjeksi yang detail tetap ada di diagnostik seperti
`/context`, `/status`, doctor, dan log.

Untuk file memori, pemotongan bukan kehilangan data: file tetap utuh di disk.
Pada Codex native, `MEMORY.md` dibaca sesuai kebutuhan melalui alat memori saat
tersedia, dengan fallback prompt terbatas saat alat tidak dapat berjalan. Pada
harness lain, model hanya melihat salinan terinjeksi yang dipendekkan sampai ia membaca atau
mencari memori secara langsung. Jika `MEMORY.md` berulang kali dipotong di sana, ringkas
menjadi ringkasan tahan lama yang lebih pendek dan pindahkan riwayat detail ke `memory/*.md`,
atau sengaja naikkan batas bootstrap.

Sesi sub-agen hanya menginjeksikan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk mengubah atau mengganti
file bootstrap yang diinjeksikan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang diinjeksikan (mentah vs terinjeksi, pemotongan, plus overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** ketika
zona waktu pengguna diketahui. Untuk menjaga prompt tetap stabil untuk cache, kini prompt hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama dapat secara opsional menetapkan override model per sesi
(`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat Skills yang memenuhi syarat tersedia, OpenClaw menginjeksikan **daftar Skills yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang menyertakan **path file** dan penanda
`<version>` turunan konten untuk setiap skill. Prompt menginstruksikan model untuk menggunakan `read`
untuk memuat SKILL.md di lokasi yang tercantum (workspace, terkelola, atau dibundel),
dan membaca ulang skill saat `<version>` berbeda dari giliran sebelumnya. Jika tidak ada
Skills yang memenuhi syarat, bagian Skills dihilangkan.

Giliran Codex native menerima daftar ini sebagai instruksi developer kolaborasi yang berlaku per giliran,
bukan input pengguna per giliran, kecuali giliran cron ringan yang
mempertahankan prompt terjadwal persis. Harness lain mempertahankan bagian prompt
normal.

Lokasi dapat menunjuk ke skill bersarang, seperti
`skills/personal/foo/SKILL.md`. Penyusunan bersarang hanya bersifat organisasional; prompt tetap
menggunakan nama skill datar dari frontmatter `SKILL.md`.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skills yang dibundel Plugin hanya memenuhi syarat saat plugin pemiliknya diaktifkan.
Ini memungkinkan plugin alat mengekspos panduan operasi yang lebih mendalam tanpa menyematkan semua
panduan tersebut langsung di setiap deskripsi alat.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang ditargetkan.

Anggaran daftar Skills dimiliki oleh subsistem Skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Cuplikan runtime generik yang dibatasi menggunakan permukaan berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran Skills tetap terpisah dari ukuran pembacaan/injeksi runtime seperti
`memory_get`, hasil alat live, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat dokumentasi lokal tersedia, bagian ini
menunjuk ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm
yang dibundel). Jika dokumentasi lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root
sumber lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL
sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana setiap kali dokumentasi tidak lengkap atau
usang. Prompt juga mencatat mirror dokumentasi publik, komunitas Discord, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Ini memosisikan dokumentasi sebagai
otoritas untuk pengetahuan diri OpenClaw sebelum model memahami cara kerja OpenClaw,
termasuk memori/catatan harian, sesi, alat, Gateway, konfigurasi, perintah, atau konteks
proyek. Prompt memberi tahu model untuk menggunakan dokumentasi lokal (atau mirror dokumentasi saat dokumentasi lokal
tidak tersedia) terlebih dahulu, dan memperlakukan AGENTS.md, konteks proyek, catatan workspace/profil/memori,
dan `memory_search` sebagai konteks instruksi atau memori pengguna, bukan pengetahuan
desain atau implementasi OpenClaw. Jika dokumentasi tidak membahasnya atau usang, model harus mengatakannya
dan memeriksa sumber. Prompt juga memberi tahu model untuk menjalankan `openclaw status` sendiri saat
memungkinkan, dan hanya bertanya kepada pengguna saat tidak memiliki akses.
Untuk konfigurasi secara khusus, prompt mengarahkan agen ke aksi alat `gateway`
`config.schema.lookup` untuk dokumentasi dan batasan tingkat-field yang tepat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
