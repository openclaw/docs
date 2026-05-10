---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku inisialisasi ruang kerja atau injeksi Skills
summary: Isi instruksi sistem OpenClaw dan cara penyusunannya
title: Prompt sistem
x-i18n:
    generated_at: "2026-05-10T19:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membangun prompt sistem kustom untuk setiap eksekusi agen. Prompt tersebut **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap eksekusi agen.

Perakitan prompt memiliki tiga lapisan:

- `buildAgentSystemPrompt` merender prompt dari input eksplisit. Ini harus
  tetap menjadi perender murni dan tidak boleh membaca konfigurasi global secara langsung.
- `resolveAgentSystemPromptConfig` menyelesaikan knob prompt berbasis konfigurasi seperti
  tampilan pemilik, petunjuk TTS, alias model, mode sitasi memori, dan mode
  delegasi sub-agen untuk agen tertentu.
- Adapter runtime (tertanam, CLI, pratinjau perintah/ekspor, compaction) mengumpulkan
  fakta langsung seperti alat, status sandbox, kapabilitas saluran, file konteks,
  dan kontribusi prompt penyedia, lalu memanggil fasad prompt yang dikonfigurasi.

Ini menjaga permukaan prompt ekspor/debug tetap selaras dengan eksekusi langsung tanpa
mengubah setiap detail khusus runtime menjadi satu builder monolitik.

Plugin penyedia dapat menyumbangkan panduan prompt yang sadar cache tanpa menggantikan
seluruh prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **prefiks stabil** di atas batas cache prompt
- menyuntikkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Pertahankan mutasi prompt
`before_prompt_build` lama untuk kompatibilitas atau perubahan prompt yang benar-benar global,
bukan perilaku penyedia normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk penguncian persona, keluaran ringkas, disiplin alat,
pencarian paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan alat terminal.

## Struktur

Prompt sengaja dibuat ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat sumber kebenaran alat terstruktur ditambah panduan penggunaan alat runtime.
- **Bias Eksekusi**: panduan tindak lanjut ringkas: bertindak dalam giliran pada
  permintaan yang dapat ditindaklanjuti, lanjutkan hingga selesai atau terblokir, pulih dari hasil alat
  yang lemah, periksa status yang berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Keamanan**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **Kontrol OpenClaw**: memberi tahu model agar mengutamakan alat `gateway` untuk
  pekerjaan konfigurasi/restart dan menghindari mengarang perintah CLI.
- **Pembaruan Mandiri OpenClaw**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan pengguna
  eksplisit. Alat `gateway` khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: path lokal ke docs/source OpenClaw dan kapan membacanya.
- **File Workspace (disuntikkan)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan elevasi tersedia.
- **Tanggal & Waktu Saat Ini**: hanya zona waktu (stabil-cache; jam langsung berasal dari `session_status`).
- **Direktif Keluaran Asisten**: sintaks ringkas lampiran, catatan suara, dan tag balasan.
- **Heartbeat**: prompt heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), tingkat berpikir (satu baris).
- **Penalaran**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

OpenClaw menempatkan konten besar yang stabil, termasuk **Konteks Proyek**, di atas
batas cache prompt internal. Bagian saluran/sesi yang volatil seperti
panduan embed UI Kontrol, **Pesan**, **Suara**, **Konteks Obrolan Grup**,
**Reaksi**, **Heartbeat**, dan **Runtime** ditambahkan di bawah batas tersebut
agar backend lokal dengan cache prefiks dapat memakai ulang prefiks workspace yang stabil
di seluruh giliran saluran. Deskripsi alat juga sebaiknya menghindari penyematan nama
saluran saat ini ketika skema yang diterima sudah membawa detail runtime tersebut.

Bagian Tooling juga menyertakan panduan runtime untuk pekerjaan berdurasi panjang:

- gunakan cron untuk tindak lanjut mendatang (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop tidur `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat mengeluarkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, utamakan `sessions_spawn`; penyelesaian sub-agen
  berbasis push dan otomatis mengumumkan kembali ke peminta
- jangan melakukan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

`agents.defaults.subagents.delegationMode` dapat memperkuat panduan ini. Mode default
`suggest` mempertahankan dorongan dasar. `prefer` menambahkan bagian khusus
**Delegasi Sub-Agen** yang memberi tahu agen utama untuk bertindak sebagai koordinator
responsif dan mendorong apa pun yang lebih rumit daripada balasan langsung melalui
`sessions_spawn`. Ini hanya prompt; kebijakan alat tetap mengontrol apakah
`sessions_spawn` tersedia.

Saat alat eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari pengulangan seluruh rencana setelah setiap pembaruan.

Guardrail keamanan dalam prompt sistem bersifat advisory. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan alat, persetujuan exec, sandboxing, dan allowlist saluran untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada saluran dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agen untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` saat hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender prompt sistem yang lebih kecil untuk sub-agen. Runtime menetapkan
`promptMode` untuk setiap eksekusi (bukan konfigurasi yang terlihat oleh pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agen; menghilangkan **Pemanggilan Memori**, **Pembaruan Mandiri OpenClaw**,
  **Alias Model**, **Identitas Pengguna**, **Direktif Keluaran Asisten**,
  **Pesan**, **Balasan Senyap**, dan **Heartbeat**. Tooling, **Keamanan**,
  **Skills** saat disediakan, Workspace, Sandbox, Tanggal & Waktu Saat Ini (saat
  diketahui), Runtime, dan konteks yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Konteks Subagen**
alih-alih **Konteks Obrolan Grup**.

Untuk eksekusi balasan otomatis saluran, OpenClaw dapat menghilangkan bagian generik **Balasan Senyap**
ketika konteks chat langsung/grup sudah menyertakan perilaku `NO_REPLY`
khusus percakapan yang telah diselesaikan. Ini menghindari pengulangan mekanik token
di prompt sistem global dan konteks saluran.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang di-commit untuk jalur sukses runtime Codex di bawah
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot tersebut merender
parameter thread/giliran app-server terpilih ditambah stack lapisan prompt terikat model
yang direkonstruksi untuk giliran Telegram langsung, grup Discord, dan heartbeat. Stack tersebut
menyertakan fixture prompt model Codex `gpt-5.5` yang dipin dan dihasilkan dari bentuk
katalog/cache model Codex, teks developer izin jalur sukses Codex,
instruksi developer OpenClaw, instruksi mode kolaborasi berskala giliran
saat OpenClaw menyediakannya, input giliran pengguna, dan referensi ke spesifikasi alat
dinamis.

Segarkan fixture prompt model Codex yang dipin dengan
`pnpm prompt:snapshots:sync-codex-model`. Secara default, skrip mencari
cache runtime Codex di `$CODEX_HOME/models_cache.json`, lalu
`~/.codex/models_cache.json`, dan baru setelah itu fallback ke konvensi checkout Codex
maintainer di `~/code/codex/codex-rs/models-manager/models.json`. Jika
tidak ada sumber tersebut, perintah keluar tanpa mengubah fixture yang di-commit.
Berikan `--catalog <path>` untuk menyegarkan dari file `models_cache.json`
atau `models.json` tertentu.

Snapshot ini tetap bukan tangkapan permintaan OpenAI mentah byte-demi-byte. Codex
dapat menambahkan konteks workspace milik runtime seperti `AGENTS.md`, konteks
lingkungan, memori, instruksi app/plugin, dan instruksi mode kolaborasi Default
bawaan di dalam runtime Codex setelah OpenClaw mengirim parameter thread dan giliran.

Buat ulang dengan `pnpm prompt:snapshots:gen` dan verifikasi drift dengan
`pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan drift di shard batas
tambahan agar perubahan prompt dan pembaruan snapshot tetap melekat pada PR yang sama.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Konteks Proyek** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` saat ada

Semua file ini **disuntikkan ke jendela konteks** pada setiap giliran kecuali
gate khusus file berlaku. `HEARTBEAT.md` dihilangkan pada eksekusi normal saat
heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar file yang disuntikkan
tetap ringkas, terutama `MEMORY.md`. `MEMORY.md` dimaksudkan untuk tetap menjadi
ringkasan jangka panjang yang dikurasi; catatan harian mendetail berada di `memory/*.md` tempat
`memory_search` dan `memory_get` dapat mengambilnya sesuai kebutuhan. File
`MEMORY.md` yang terlalu besar meningkatkan penggunaan prompt dan dapat disuntikkan sebagian karena
batas file bootstrap di bawah.

Saat sesi berjalan pada harness Codex native, Codex memuat `AGENTS.md`
melalui penemuan dokumen proyeknya sendiri. OpenClaw tetap menyelesaikan file bootstrap
lainnya dan meneruskannya sebagai instruksi konfigurasi Codex, sehingga `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan
`MEMORY.md` mempertahankan peran konteks workspace yang sama tanpa menduplikasi
`AGENTS.md`.

<Note>
File harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa file tersebut diakses sesuai kebutuhan melalui alat `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` kosong adalah pengecualian: runtime dapat menambahkan memori harian terbaru di awal sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.
</Note>

File besar dipotong dengan penanda. Ukuran maksimum per file dikontrol oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyuntikkan pemberitahuan peringatan prompt sistem yang ringkas; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`). Jumlah mentah/disuntikkan yang mendetail tetap ada dalam diagnostik seperti
`/context`, `/status`, doctor, dan log.

Untuk file memori, pemotongan bukan kehilangan data: file tetap utuh di disk,
tetapi model hanya melihat salinan singkat yang disuntikkan sampai ia membaca atau mencari
memori secara langsung. Jika `MEMORY.md` berulang kali dipotong, suling menjadi
ringkasan tahan lama yang lebih pendek dan pindahkan riwayat mendetail ke `memory/*.md`, atau
naikkan batas bootstrap secara sengaja.

Sesi sub-agen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter keluar untuk menjaga konteks sub-agen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk mengubah atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulai dengan
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disisipkan (mentah vs disisipkan, pemotongan, ditambah overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Prompt sistem menyertakan bagian khusus **Tanggal & Waktu Saat Ini** saat
zona waktu pengguna diketahui. Agar cache prompt tetap stabil, sekarang bagian ini hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu status
menyertakan baris timestamp. Alat yang sama juga dapat menetapkan override model per sesi
secara opsional (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Tanggal & Waktu](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat ada Skills yang memenuhi syarat, OpenClaw menyisipkan **daftar Skills yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang menyertakan **jalur file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi
yang tercantum (workspace, terkelola, atau dibundel). Jika tidak ada Skills yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan runtime/konfigurasi,
dan allowlist skill agen efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skills yang dibundel Plugin hanya memenuhi syarat saat Plugin pemiliknya diaktifkan.
Ini memungkinkan Plugin alat mengekspos panduan operasional yang lebih mendalam tanpa menyematkan semua
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

Kutipan runtime generik yang dibatasi menggunakan permukaan berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan tersebut menjaga ukuran Skills terpisah dari ukuran pembacaan/penyisipan runtime seperti
`memory_get`, hasil alat live, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Prompt sistem menyertakan bagian **Dokumentasi**. Saat docs lokal tersedia, bagian ini
mengarah ke direktori docs OpenClaw lokal (`docs/` dalam checkout Git atau docs paket npm
yang dibundel). Jika docs lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi sumber OpenClaw. Checkout Git mengekspos root
sumber lokal agar agen dapat memeriksa kode secara langsung. Instalasi paket menyertakan URL
sumber GitHub dan memberi tahu agen untuk meninjau sumber di sana kapan pun docs tidak lengkap atau
usang. Prompt juga mencatat mirror docs publik, Discord komunitas, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan Skills. Prompt memberi tahu model untuk
berkonsultasi dengan docs terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri saat memungkinkan (hanya bertanya kepada pengguna saat tidak memiliki akses).
Khusus untuk konfigurasi, prompt mengarahkan agen ke aksi alat `gateway`
`config.schema.lookup` untuk docs dan batasan tingkat-field yang tepat, lalu ke
`docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md`
untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
