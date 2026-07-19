---
doc-schema-version: 1
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda sedang memilih antara alat bawaan, Skills, dan plugin
    - Anda memerlukan titik awal dokumentasi yang tepat untuk kebijakan alat, otomatisasi, atau koordinasi agen
summary: 'Ikhtisar alat, Skills, dan Plugin OpenClaw: apa yang dapat dipanggil agen dan cara memperluasnya'
title: Ikhtisar
x-i18n:
    generated_at: "2026-07-19T05:37:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e23f9c2405766feb98db4d34baee41b73df002966a48525ba76c5f4b260f126
    source_path: tools/index.md
    workflow: 16
---

Gunakan halaman ini untuk memilih permukaan Kapabilitas yang tepat. **Alat** adalah
tindakan yang dapat dipanggil, **Skills** mengajarkan cara kerja kepada agen, dan **Plugin** menambahkan
kapabilitas runtime seperti alat, penyedia, saluran, hook, dan Skills
yang dikemas.

Ini adalah halaman ikhtisar dan perutean. Untuk kebijakan alat, nilai default,
keanggotaan grup, pembatasan penyedia, dan bidang konfigurasi yang lengkap, gunakan
[Alat dan penyedia kustom](/id/gateway/config-tools).

## Mulai di sini

Untuk sebagian besar agen, mulailah dengan kategori alat bawaan, lalu sesuaikan kebijakan
hanya jika agen harus melihat lebih sedikit alat atau memerlukan akses host secara eksplisit.

| Jika Anda perlu...                            | Gunakan ini terlebih dahulu                                 | Kemudian baca                                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Memungkinkan agen bertindak dengan kapabilitas yang tersedia  | [Alat bawaan](#built-in-tool-categories)    | [Kategori alat](#built-in-tool-categories)                                                                                                           |
| Mengontrol apa yang dapat dipanggil agen               | [Kebijakan alat](#configure-access-and-approvals) | [Alat dan penyedia kustom](/id/gateway/config-tools)                                                                                                    |
| Mengajarkan alur kerja kepada agen                    | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/id/tools/skills), [Membuat Skills](/id/tools/creating-skills), [Lokakarya Skills](/id/tools/skill-workshop), dan [Pembelajaran mandiri](/id/tools/self-learning) |
| Menambahkan integrasi atau permukaan runtime baru     | [Plugin](#extend-capabilities)                | [Plugin](/id/tools/plugin) dan [Membangun Plugin](/id/plugins/building-plugins)                                                                                |
| Menjalankan pekerjaan nanti atau di latar belakang          | [Otomatisasi](/id/automation)                      | [Ikhtisar otomatisasi](/id/automation)                                                                                                                     |
| Mengoordinasikan beberapa agen atau harness      | [Subagen](/id/tools/subagents)                 | [Agen ACP](/id/tools/acp-agents) dan [Pengiriman agen](/id/tools/agent-send)                                                                                    |
| Mencari katalog alat OpenClaw yang besar         | [Pencarian Alat](/id/tools/tool-search)              | [Pencarian Alat](/id/tools/tool-search)                                                                                                                      |
| Menggabungkan beberapa alat dalam satu program ringkas | [Mode Kode](/tools/code-mode)                  | [Mode Kode](/tools/code-mode)                                                                                                                          |

## Memilih alat, Skills, atau Plugin

<Steps>
  <Step title="Gunakan alat saat agen perlu bertindak">
    Alat adalah fungsi bertipe yang dapat dipanggil agen, seperti `exec`, `browser`,
    `web_search`, `message`, atau `image_generate`. Gunakan alat saat agen
    perlu membaca data, mengubah file, mengirim pesan, memanggil penyedia, atau
    mengoperasikan sistem lain. Alat yang terlihat dikirim ke model sebagai definisi
    fungsi terstruktur.

    Model hanya melihat alat yang lolos dari profil aktif, kebijakan
    izinkan/tolak, pembatasan penyedia, status sandbox, izin saluran, dan
    ketersediaan Plugin.

  </Step>

  <Step title="Gunakan Skill saat agen memerlukan petunjuk">
    Skill adalah paket petunjuk `SKILL.md` yang dimuat ke dalam prompt agen. Gunakan
    Skill saat agen sudah memiliki alat yang diperlukan, tetapi memerlukan
    alur kerja yang dapat diulang, rubrik review, urutan perintah, atau batasan
    operasional.

    Skills dapat berada di ruang kerja, direktori Skills bersama, root Skills OpenClaw
    terkelola, atau paket Plugin.

    [Skills](/id/tools/skills) | [Lokakarya Skills](/id/tools/skill-workshop) | [Pembelajaran mandiri](/id/tools/self-learning) | [Membuat Skills](/id/tools/creating-skills) | [Konfigurasi Skills](/id/tools/skills-config)

  </Step>

  <Step title="Gunakan Plugin saat OpenClaw memerlukan kapabilitas baru">
    Plugin dapat menambahkan alat, Skills, saluran, penyedia model, ucapan,
    suara waktu nyata, pembuatan media, pencarian web, pengambilan web, hook, dan
    kapabilitas runtime lainnya. Gunakan Plugin saat kapabilitas memiliki kode,
    kredensial, hook siklus hidup, metadata manifes, atau
    pengemasan yang dapat diinstal. Plugin yang tersedia dapat diinstal dari ClawHub, npm, git,
    direktori lokal, atau arsip.

    [Menginstal dan mengonfigurasi Plugin](/id/tools/plugin) | [Membangun Plugin](/id/plugins/building-plugins) | [SDK Plugin](/id/plugins/sdk-overview)

  </Step>
</Steps>

## Kategori alat bawaan

Tabel ini mencantumkan alat representatif agar Anda dapat mengenali permukaannya. Ini
bukan referensi kebijakan lengkap. Untuk grup, nilai default, dan semantik
izinkan/tolak yang tepat, gunakan [Alat dan penyedia kustom](/id/gateway/config-tools).

| Kategori                | Gunakan saat agen perlu...                                                          | Alat representatif                                                                                 | Baca selanjutnya                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Runtime                 | Menjalankan perintah, mengelola proses, atau menggunakan analisis Python yang didukung penyedia                  | `exec`, `process`, `terminal`, `code_execution`                                                      | [Eksekusi](/id/tools/exec), [Terminal UI Kontrol](/id/web/control-ui#operator-terminal), [Eksekusi kode](/id/tools/code-execution) |
| File                   | Membaca dan mengubah file ruang kerja                                                         | `read`, `write`, `edit`, `apply_patch`                                                               | [Menerapkan patch](/id/tools/apply-patch)                                                                                      |
| Masukan manusia             | Menjeda untuk keputusan terstruktur yang berada di bawah kendali pengguna                                       | `ask_user`                                                                                           | [Bertanya kepada pengguna](/tools/ask-user)                                                                                            |
| Web                     | Mencari di web, mencari postingan X, atau mengambil konten halaman yang dapat dibaca                          | `web_search`, `x_search`, `web_fetch`                                                                | [Alat web](/id/tools/web), [Pengambilan web](/id/tools/web-fetch)                                                                 |
| Peramban                 | Mengoperasikan sesi peramban                                                               | `browser`                                                                                            | [Peramban](/id/tools/browser)                                                                                              |
| UI operator             | Menata panel, bilah panel, dan navigasi UI Kontrol yang terhubung                              | `screen`                                                                                             | [Layar](/tools/screen)                                                                                                |
| Perpesanan dan saluran  | Mengirim balasan atau tindakan saluran                                                         | `message`                                                                                            | [Pengiriman agen](/id/tools/agent-send)                                                                                        |
| Sesi dan agen     | Memeriksa sesi, mendelegasikan pekerjaan, mengarahkan proses lain, atau melaporkan status                    | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Tujuan](/id/tools/goal), [Subagen](/id/tools/subagents), [Alat sesi](/id/concepts/session-tool)                            |
| Otomatisasi              | Menjadwalkan pekerjaan atau merespons peristiwa latar belakang                                           | `cron`, `heartbeat_respond`                                                                          | [Otomatisasi](/id/automation)                                                                                              |
| Gateway dan node       | Memeriksa status Gateway atau perangkat target yang dipasangkan                                          | `gateway`, `nodes`                                                                                   | [Konfigurasi Gateway](/id/gateway/configuration), [Node](/id/nodes)                                                       |
| Media                   | Menganalisis, menghasilkan, atau mengucapkan media                                                       | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Ikhtisar media](/id/tools/media-overview)                                                                                |
| Katalog besar OpenClaw | Mencari, memanggil, dan menggabungkan banyak alat yang memenuhi syarat tanpa mengirimkan setiap skema ke model | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`                                   | [Mode Kode](/tools/code-mode), [Pencarian Alat](/id/tools/tool-search)                                                       |

<Note>
Mode Kode dan Pencarian Alat adalah permukaan agen OpenClaw eksperimental. Proses harness Codex
menggunakan mode kode native Codex, pencarian alat native, alat dinamis yang ditangguhkan,
dan panggilan alat bertingkat sebagai pengganti `tools.codeMode` atau `tools.toolSearch`.
</Note>

## Alat yang disediakan Plugin

Plugin dapat mendaftarkan alat tambahan. Penulis Plugin menghubungkan alat melalui
`api.registerTool(...)` dan `contracts.tools` milik manifes; gunakan
[SDK Plugin](/id/plugins/sdk-overview) dan [Manifes Plugin](/id/plugins/manifest)
untuk detail kontrak.

Alat umum yang disediakan Plugin meliputi:

- [Diff](/id/tools/diffs) untuk merender diff file dan markdown
- [Tampilkan widget](/id/tools/show-widget) untuk SVG dan HTML inline mandiri di klien obrolan yang didukung
- [Layar](/tools/screen) untuk menata UI Kontrol yang terhubung
- [Tugas LLM](/id/tools/llm-task) untuk langkah alur kerja khusus JSON
- [Lobster](/id/tools/lobster) untuk alur kerja bertipe dengan persetujuan yang dapat dilanjutkan
- [Tokenjuice](/id/tools/tokenjuice) untuk memadatkan output alat `exec` dan `bash`
  yang penuh derau
- [Pencarian Alat](/id/tools/tool-search) untuk menemukan dan memanggil katalog alat besar
  tanpa menempatkan setiap skema dalam prompt
- [Kanvas](/id/plugins/reference/canvas) untuk kontrol Kanvas node dan rendering
  A2UI

## Mengonfigurasi akses dan persetujuan

Kebijakan alat diberlakukan sebelum pemanggilan model. Jika kebijakan menghapus suatu alat,
model tidak menerima skema alat tersebut untuk giliran itu. Suatu proses dapat kehilangan alat
karena konfigurasi global, konfigurasi per agen, kebijakan saluran, pembatasan
penyedia, aturan sandbox, kebijakan saluran/runtime, atau ketersediaan Plugin.

- [Alat dan penyedia kustom](/id/gateway/config-tools) mendokumentasikan profil alat,
  daftar izinkan/tolak, pembatasan khusus penyedia, deteksi perulangan, dan
  pengaturan alat yang didukung penyedia.
- [Persetujuan exec](/id/tools/exec-approvals) mendokumentasikan kebijakan
  persetujuan perintah host.
- [Exec dengan hak istimewa](/id/tools/elevated) mendokumentasikan eksekusi terkendali di luar
  sandbox.
- [Sandbox vs kebijakan alat vs hak istimewa](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
  menjelaskan lapisan mana yang mengontrol akses file dan proses.
- [Pembatasan sandbox dan alat per agen](/id/tools/multi-agent-sandbox-tools)
  mendokumentasikan pembatasan khusus agen untuk proses yang didelegasikan.

## Perluas kemampuan

Pilih jalur ekstensi berdasarkan tugas yang perlu dilakukan OpenClaw:

- Instal atau kelola plugin yang sudah ada dengan [Plugin](/id/tools/plugin).
- Bangun integrasi, penyedia, kanal, alat, atau hook baru dengan
  [Membangun plugin](/id/plugins/building-plugins).
- Tambahkan atau sesuaikan instruksi agen yang dapat digunakan kembali dengan [Skills](/id/tools/skills) dan
  [Membuat skill](/id/tools/creating-skills).
- Gunakan [SDK Plugin](/id/plugins/sdk-overview) dan
  [Manifes plugin](/id/plugins/manifest) saat Anda memerlukan kontrak
  implementasi.

## Atasi masalah alat yang tidak tersedia

Jika model tidak dapat melihat atau memanggil alat, mulailah dengan kebijakan efektif untuk
giliran saat ini:

1. Periksa profil aktif, `tools.allow`, dan `tools.deny` di
   [Alat dan penyedia kustom](/id/gateway/config-tools).
2. Periksa pembatasan khusus penyedia di
   [Alat dan penyedia kustom](/id/gateway/config-tools) dan pastikan
   [penyedia model](/id/concepts/model-providers) yang dipilih mendukung bentuk
   alat tersebut.
3. Periksa izin kanal, status sandbox, dan akses dengan hak istimewa melalui
   [Sandbox vs kebijakan alat vs hak istimewa](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
   dan [Exec dengan hak istimewa](/id/tools/elevated).
4. Periksa apakah plugin pemilik telah diinstal dan diaktifkan di
   [Plugin](/id/tools/plugin).
5. Untuk proses yang didelegasikan, periksa pembatasan per agen di
   [Pembatasan sandbox dan alat per agen](/id/tools/multi-agent-sandbox-tools).
6. Untuk katalog OpenClaw yang besar, pastikan apakah proses menggunakan pemaparan alat
   langsung, [Mode Kode](/tools/code-mode), atau [Pencarian Alat](/id/tools/tool-search).

## Terkait

- [Otomatisasi](/id/automation) untuk cron, tugas, heartbeat, komitmen, hook,
  perintah tetap, dan Alur Tugas
- [Agen](/id/concepts/agent) untuk model agen, sesi, memori, dan
  koordinasi multiagen
- [Alat dan penyedia kustom](/id/gateway/config-tools) untuk referensi kanonis
  kebijakan alat
- [Plugin](/id/tools/plugin) untuk instalasi dan pengelolaan plugin
- [SDK Plugin](/id/plugins/sdk-overview) untuk referensi pembuat plugin
- [Skills](/id/tools/skills) untuk urutan pemuatan, gating, dan konfigurasi skill
- [Lokakarya Skill](/id/tools/skill-workshop) untuk pembuatan skill yang
  dihasilkan dan ditinjau
- [Pencarian Alat](/id/tools/tool-search) untuk penemuan katalog alat OpenClaw
  yang ringkas
- [Mode Kode](/tools/code-mode) untuk alur kerja JavaScript atau TypeScript yang ringkas
  melalui katalog alat OpenClaw tersembunyi
