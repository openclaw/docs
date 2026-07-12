---
read_when:
    - Mengedit teks prompt sistem, daftar alat, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap ruang kerja atau injeksi Skills
summary: Isi prompt sistem OpenClaw dan cara penyusunannya
title: Prompt sistem
x-i18n:
    generated_at: "2026-07-12T14:11:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw membuat prompt sistemnya sendiri untuk setiap eksekusi agen; tidak ada prompt bawaan saat runtime.

Perakitan memiliki tiga lapisan:

- `buildAgentSystemPrompt` merender prompt dari masukan eksplisit. Fungsi ini tetap menjadi perender murni dan tidak membaca konfigurasi global secara langsung.
- `resolveAgentSystemPromptConfig` menyelesaikan pengaturan prompt berbasis konfigurasi (tampilan pemilik, petunjuk TTS, alias model, mode kutipan memori, mode delegasi subagen) untuk agen tertentu.
- Adaptor runtime (tertanam, CLI, pratinjau perintah/ekspor, compaction) mengumpulkan fakta langsung (alat, status sandbox, kemampuan saluran, berkas konteks, kontribusi prompt penyedia) dan memanggil fasad prompt yang telah dikonfigurasi.

Hal ini menjaga permukaan prompt yang diekspor/debug tetap selaras dengan eksekusi langsung tanpa mengubah setiap detail runtime menjadi satu pembangun monolitik.

Plugin penyedia dapat menyumbangkan panduan yang sadar-cache tanpa mengganti prompt milik OpenClaw. Runtime penyedia dapat:

- mengganti salah satu dari tiga bagian inti bernama: `interaction_style`, `tool_call_style`, `execution_bias`
- menyisipkan **prefiks stabil** di atas batas cache prompt
- menyisipkan **sufiks dinamis** di bawah batas cache prompt

Gunakan kontribusi milik penyedia untuk penyesuaian khusus keluarga model. Gunakan hook lawas `before_prompt_build` hanya untuk kompatibilitas atau perubahan prompt yang benar-benar global.

Lapisan tambahan OpenAI/Codex keluarga GPT-5 bawaan (`resolveGpt5SystemPromptContribution`) menggunakan mekanisme ini: kontrak perilaku `stablePrefix` (kebijakan eksekusi, disiplin alat, kontrak keluaran, kontrak penyelesaian) ditambah penggantian opsional `interaction_style` untuk nada yang lebih ramah. Ini berlaku pada setiap ID model `gpt-5*` yang dirutekan melalui Plugin OpenAI atau Codex, yang dikendalikan oleh `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` atau `"off"`).

## Struktur

Prompt bersifat ringkas, dengan bagian-bagian tetap:

- **Peralatan**: pengingat bahwa alat terstruktur merupakan sumber kebenaran serta panduan penggunaan alat saat runtime. Saat alat eksperimental `update_plan` diaktifkan (`tools.experimental.planTool`), deskripsi alatnya sendiri menambahkan: gunakan hanya untuk pekerjaan multilangkah yang tidak sederhana, pertahankan paling banyak satu langkah `in_progress`, dan lewati untuk pekerjaan satu langkah yang sederhana.
- **Prioritas Eksekusi**: bertindak dalam giliran yang sama terhadap permintaan yang dapat ditindaklanjuti, melanjutkan hingga selesai atau terhalang, pulih dari hasil alat yang lemah, memeriksa status yang dapat berubah secara langsung, dan memverifikasi sebelum menyelesaikan.
- **Keamanan**: pengingat batas pengaman singkat terhadap perilaku mengejar kekuasaan atau melewati pengawasan.
- **Skills** (jika tersedia): memberi tahu model cara memuat instruksi Skills sesuai kebutuhan.
- **Kontrol OpenClaw**: utamakan alat `gateway` untuk pekerjaan konfigurasi/mulai ulang; jangan mengarang perintah CLI.
- **Pembaruan Mandiri OpenClaw**: periksa konfigurasi dengan aman menggunakan `config.schema.lookup`, tambal dengan `config.patch`, ganti konfigurasi lengkap dengan `config.apply`, dan jalankan `update.run` hanya atas permintaan eksplisit pengguna. Alat `gateway` yang tersedia bagi agen menolak menulis ulang `tools.exec.ask` / `tools.exec.security`, termasuk alias lawas `tools.bash.*` yang dinormalisasi ke jalur terlindungi tersebut.
- **Ruang Kerja**: direktori kerja (`agents.defaults.workspace`).
- **Dokumentasi**: jalur dokumentasi/sumber lokal dan kapan harus membacanya.
- **Berkas Ruang Kerja (disisipkan)**: mencatat bahwa berkas bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): runtime dalam sandbox, jalur sandbox, ketersediaan eksekusi dengan hak lebih tinggi.
- **Tanggal & Waktu Saat Ini**: hanya zona waktu (stabil untuk cache; waktu langsung berasal dari `session_status`).
- **Arahan Keluaran Asisten**: sintaks ringkas untuk lampiran, catatan suara, dan tag balasan.
- **Heartbeat**: prompt heartbeat dan perilaku pengakuan, saat heartbeat diaktifkan untuk agen bawaan.
- **Runtime**: host, OS, Node, model, akar repositori (saat terdeteksi), tingkat pemikiran (satu baris).
- **Penalaran**: tingkat visibilitas saat ini beserta petunjuk pengalih `/reasoning`.

Konten stabil berukuran besar (termasuk **Konteks Proyek**) tetap berada di atas batas cache prompt internal. Bagian volatil per giliran (panduan penyematan UI Kontrol, **Perpesanan**, **Suara**, **Konteks Obrolan Grup**, **Reaksi**, **Heartbeat**, **Runtime**) ditambahkan di bawah batas tersebut agar backend lokal dengan cache prefiks dapat menggunakan kembali prefiks ruang kerja yang stabil di berbagai giliran saluran. Deskripsi alat sebaiknya tidak menyematkan nama saluran saat ini jika skema yang diterima sudah membawa detail runtime tersebut.

Peralatan juga memuat panduan pekerjaan jangka panjang:

- gunakan Cron untuk tindak lanjut mendatang (`check back later`, pengingat, pekerjaan berulang), bukan perulangan tidur `exec`, trik penundaan `yieldMs`, atau polling `process` berulang
- gunakan `exec` / `process` hanya untuk perintah yang dimulai sekarang dan terus berjalan di latar belakang
- saat aktivasi otomatis setelah penyelesaian diaktifkan, mulai perintah satu kali dan andalkan jalur aktivasi berbasis dorong
- gunakan `process` untuk log, status, masukan, atau intervensi pada perintah yang sedang berjalan
- untuk tugas yang lebih besar, utamakan `sessions_spawn`; penyelesaian subagen berbasis dorong dan diumumkan kembali secara otomatis kepada pemohon
- jangan melakukan polling `subagents list` / `sessions_list` dalam perulangan hanya untuk menunggu penyelesaian

`agents.defaults.subagents.delegationMode` (bawaan `"suggest"`) dapat memperkuat hal ini. `"prefer"` menambahkan bagian khusus **Delegasi Subagen** yang menginstruksikan agen utama agar bertindak sebagai koordinator yang tanggap dan meneruskan segala hal yang lebih rumit daripada balasan langsung melalui `sessions_spawn`. Ini hanya berlaku pada prompt; kebijakan alat tetap mengendalikan apakah `sessions_spawn` tersedia.

Batas pengaman dalam prompt sistem bersifat anjuran, bukan penegakan. Gunakan kebijakan alat, persetujuan eksekusi, sandbox, dan daftar izin saluran untuk penegakan tegas; operator dapat menonaktifkan batas pengaman prompt sesuai desain.

Pada saluran dengan kartu/tombol persetujuan bawaan, prompt menginstruksikan agen untuk terlebih dahulu mengandalkan UI tersebut, dan menyertakan perintah manual `/approve` hanya ketika hasil alat menyatakan bahwa persetujuan melalui obrolan tidak tersedia atau persetujuan manual merupakan satu-satunya jalur.

## Mode prompt

OpenClaw merender prompt sistem yang lebih kecil untuk subagen. Runtime menetapkan `promptMode` per eksekusi (bukan konfigurasi yang ditampilkan kepada pengguna):

- `full` (bawaan): semua bagian di atas.
- `minimal`: digunakan untuk subagen; menghilangkan bagian prompt memori (dibundel sebagai **Pemanggilan Kembali Memori**), **Pembaruan Mandiri OpenClaw**, **Alias Model**, **Identitas Pengguna**, **Arahan Keluaran Asisten**, **Perpesanan**, **Balasan Senyap**, dan **Heartbeat**. Peralatan, **Keamanan**, **Skills** (jika disediakan), Ruang Kerja, Sandbox, Tanggal & Waktu Saat Ini (jika diketahui), Runtime, dan konteks yang disisipkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Di bawah `promptMode=minimal`, prompt tambahan yang disisipkan diberi label **Konteks Subagen**, bukan **Konteks Obrolan Grup**.

Untuk eksekusi balasan otomatis saluran, OpenClaw menghilangkan bagian generik **Balasan Senyap** ketika konteks langsung, grup, atau khusus alat pesan sudah memiliki kontrak balasan yang terlihat. Hanya mode grup/saluran otomatis lawas yang menampilkan `NO_REPLY`; obrolan langsung dan balasan khusus alat pesan melewati panduan token senyap.

## Snapshot prompt

OpenClaw menyimpan snapshot prompt yang dikomit untuk jalur ideal runtime Codex di `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Snapshot tersebut merender parameter utas/giliran server aplikasi terpilih serta susunan ulang lapisan prompt yang terikat model untuk giliran langsung Telegram, grup Discord, dan heartbeat: perlengkapan prompt model Codex `gpt-5.5` yang disematkan, teks pengembang izin jalur ideal Codex, instruksi pengembang OpenClaw, instruksi mode kolaborasi dalam cakupan giliran ketika OpenClaw menyediakannya, masukan giliran pengguna, dan referensi ke spesifikasi alat dinamis.

Segarkan perlengkapan prompt model Codex yang disematkan dengan `pnpm prompt:snapshots:sync-codex-model`. Secara bawaan, perintah ini mencari `$CODEX_HOME/models_cache.json`, lalu `~/.codex/models_cache.json`, kemudian konvensi checkout pengelola `~/code/codex/codex-rs/models-manager/models.json`; jika tidak ada satu pun, perintah keluar tanpa mengubah perlengkapan yang dikomit. Berikan `--catalog <path>` untuk menyegarkan dari berkas `models_cache.json` atau `models.json` tertentu.

Snapshot ini bukan tangkapan mentah permintaan OpenAI secara bita demi bita. Codex dapat menambahkan konteks ruang kerja milik runtime (`AGENTS.md`, konteks lingkungan, memori, instruksi aplikasi/Plugin, instruksi mode kolaborasi Default bawaan) setelah OpenClaw mengirim parameter utas dan giliran.

Buat ulang dengan `pnpm prompt:snapshots:gen`; verifikasi penyimpangan dengan `pnpm prompt:snapshots:check`. CI menjalankan pemeriksaan penyimpangan bersama shard batas tambahan, sehingga perubahan prompt dan pembaruan snapshot masuk dalam PR yang sama.

## Penyisipan bootstrap ruang kerja

Berkas bootstrap diselesaikan dari ruang kerja aktif dan dirutekan ke permukaan prompt yang sesuai dengan masa berlakunya:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada ruang kerja yang benar-benar baru)
- `MEMORY.md` jika tersedia

Pada harness Codex bawaan, OpenClaw menghindari pengulangan berkas ruang kerja stabil pada setiap giliran pengguna. Codex memuat `AGENTS.md` melalui penemuan dokumen proyeknya sendiri. `TOOLS.md` diteruskan sebagai instruksi pengembang Codex yang diwariskan. `SOUL.md`, `IDENTITY.md`, dan `USER.md` diteruskan sebagai instruksi pengembang kolaborasi dalam cakupan giliran agar subagen Codex bawaan tidak mewarisinya. Konten `HEARTBEAT.md` tidak disisipkan secara langsung; giliran heartbeat mendapatkan catatan mode kolaborasi yang menunjuk ke berkas tersebut jika tersedia dan tidak kosong. Konten `MEMORY.md` juga tidak ditempelkan ke setiap giliran Codex bawaan: saat alat memori tersedia untuk ruang kerja, giliran Codex mendapatkan catatan kecil tentang memori ruang kerja yang mengarahkan model ke `memory_search` atau `memory_get`. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau ruang kerja aktif berbeda dari ruang kerja memori agen, `MEMORY.md` kembali menggunakan jalur konteks giliran terbatas yang normal. `BOOTSTRAP.md` mempertahankan peran konteks giliran normal.

Pada harness non-Codex, berkas bootstrap disusun ke dalam prompt OpenClaw sesuai pembatas yang sudah ada. `HEARTBEAT.md` dihilangkan pada eksekusi normal ketika heartbeat dinonaktifkan untuk agen bawaan atau `agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga agar berkas yang disisipkan tetap ringkas, terutama `MEMORY.md` non-Codex: berkas tersebut harus tetap menjadi ringkasan jangka panjang yang dikurasi, dengan catatan harian terperinci di `memory/*.md` yang dapat diambil sesuai kebutuhan melalui `memory_search` / `memory_get`. Berkas `MEMORY.md` non-Codex yang terlalu besar meningkatkan penggunaan prompt dan dapat disisipkan sebagian berdasarkan batas berkas bootstrap di bawah.

<Note>
Berkas harian `memory/*.md` **bukan** bagian dari Konteks Proyek bootstrap normal. Pada giliran biasa, berkas tersebut diakses sesuai kebutuhan melalui `memory_search` / `memory_get`, sehingga tidak memakai jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan `/reset` tanpa tambahan merupakan pengecualian: runtime dapat menambahkan memori harian terbaru sebagai blok konteks awal satu kali untuk giliran pertama tersebut.
</Note>

Berkas besar dipotong dengan penanda:

| Batas                                             | Kunci konfigurasi                                  | Bawaan   |
| ------------------------------------------------- | -------------------------------------------------- | -------- |
| Karakter maksimum per berkas                      | `agents.defaults.bootstrapMaxChars`                | 20000    |
| Total seluruh berkas                              | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| Peringatan pemotongan (`off`\|`once`\|`always`)   | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Berkas yang tidak ditemukan menyisipkan penanda singkat bahwa berkas tidak ada. Jumlah mentah/tersisip yang terperinci tetap tersedia dalam diagnostik seperti `/context`, `/status`, doctor, dan log.

Untuk berkas memori, pemotongan bukanlah kehilangan data: berkas tetap utuh di disk. Pada Codex bawaan, `MEMORY.md` dibaca sesuai kebutuhan melalui alat memori jika tersedia, dengan jalur cadangan prompt terbatas jika tidak. Pada harness lain, model hanya melihat salinan tersisip yang dipersingkat hingga model membaca atau mencari memori secara langsung. Jika `MEMORY.md` berulang kali dipotong, ringkas isinya menjadi rangkuman tahan lama yang lebih pendek, pindahkan riwayat terperinci ke `memory/*.md`, atau naikkan batas bootstrap secara sengaja.

Sesi subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (berkas bootstrap lainnya disaring agar konteks subagen tetap kecil).

Hook internal dapat mencegat langkah ini melalui peristiwa `agent:bootstrap` untuk mengubah atau mengganti berkas bootstrap yang disuntikkan (misalnya mengganti `SOUL.md` dengan persona alternatif).

Agar terdengar tidak terlalu generik, mulailah dengan [Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap berkas yang disuntikkan (mentah dibandingkan yang disuntikkan, pemotongan, overhead skema alat), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Penanganan waktu

Bagian **Tanggal & Waktu Saat Ini** hanya muncul ketika zona waktu pengguna diketahui, dan hanya mencantumkan **zona waktu** (tanpa jam dinamis atau format waktu) agar cache prompt tetap stabil.

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu statusnya menyertakan baris stempel waktu. Alat yang sama juga dapat secara opsional menetapkan penggantian model per sesi (`model=default` akan menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Zona waktu](/id/concepts/timezone) dan [Tanggal & Waktu](/id/date-time) untuk detail lengkap tentang perilakunya.

## Skills

Ketika ada Skills yang memenuhi syarat, OpenClaw menyuntikkan daftar ringkas `<available_skills>` (`formatSkillsForPrompt`) dengan **jalur berkas** dan penanda `<version>sha256:...</version>` yang diturunkan dari konten untuk setiap skill. Prompt menginstruksikan model agar menggunakan `read` untuk memuat SKILL.md di lokasi yang tercantum (ruang kerja, terkelola, atau bawaan), serta membaca ulang suatu skill ketika `<version>`-nya berbeda dari giliran sebelumnya. Jika tidak ada Skills yang memenuhi syarat, bagian Skills dihilangkan.

Giliran Codex native menerima daftar ini sebagai instruksi developer kolaborasi yang cakupannya terbatas pada giliran tersebut, bukan sebagai masukan pengguna per giliran, kecuali giliran cron ringan yang mempertahankan prompt terjadwal secara persis. Harness lainnya tetap menggunakan bagian prompt normal.

Lokasi dapat menunjuk ke skill bertingkat, seperti `skills/personal/foo/SKILL.md`. Penyarangan hanya untuk pengorganisasian; prompt menggunakan nama skill datar dari frontmatter `SKILL.md`.

Kelayakan mencakup gerbang metadata skill, pemeriksaan lingkungan/konfigurasi runtime, dan daftar izin skill efektif agen ketika `agents.defaults.skills` atau `agents.list[].skills` dikonfigurasi. Skills bawaan Plugin hanya memenuhi syarat ketika Plugin pemiliknya diaktifkan, sehingga Plugin alat dapat menyediakan panduan operasional yang lebih mendalam tanpa menyematkan seluruh panduan tersebut dalam setiap deskripsi alat.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Hal ini menjaga prompt dasar tetap kecil sekaligus tetap memungkinkan penggunaan skill yang tertarget. Penentuan ukuran dikelola oleh subsistem Skills, terpisah dari penentuan ukuran baca/penyuntikan runtime generik:

| Cakupan   | Anggaran prompt Skills                             | Anggaran kutipan runtime           |
| --------- | ------------------------------------------------- | --------------------------------- |
| Global    | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| Per agen  | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

Anggaran kutipan runtime mencakup `memory_get`, hasil alat langsung, dan pemuatan ulang `AGENTS.md` setelah Compaction.

## Dokumentasi

Bagian **Dokumentasi** mengarah ke dokumentasi lokal jika tersedia (`docs/` dalam checkout Git atau dokumentasi paket npm bawaan), dan jika tidak tersedia akan beralih ke [https://docs.openclaw.ai](https://docs.openclaw.ai). Bagian ini juga mencantumkan lokasi sumber OpenClaw: checkout Git menampilkan root sumber lokal, sedangkan instalasi paket mendapatkan URL sumber GitHub beserta instruksi untuk meninjau sumber di sana ketika dokumentasi tidak lengkap atau usang.

Prompt menetapkan dokumentasi sebagai sumber otoritatif untuk pengetahuan mandiri OpenClaw sebelum model memahami cara kerja OpenClaw (memori/catatan harian, sesi, alat, Gateway, konfigurasi, perintah, konteks proyek), dan menginstruksikan model agar memperlakukan `AGENTS.md`, konteks proyek, catatan ruang kerja/profil/memori, dan `memory_search` sebagai konteks instruksi atau memori pengguna, bukan sebagai pengetahuan desain/implementasi OpenClaw. Jika dokumentasi tidak membahasnya atau sudah usang, model harus menyatakannya dan memeriksa sumber. Prompt juga menginstruksikan model agar menjalankan `openclaw status` sendiri jika memungkinkan, dan hanya bertanya kepada pengguna ketika tidak memiliki akses.

Khusus untuk konfigurasi, prompt mengarahkan agen ke tindakan `config.schema.lookup` pada alat `gateway` untuk dokumentasi dan batasan yang tepat pada tingkat bidang, lalu ke `docs/gateway/configuration.md` dan `docs/gateway/configuration-reference.md` untuk panduan yang lebih luas.

## Terkait

- [Runtime agen](/id/concepts/agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
