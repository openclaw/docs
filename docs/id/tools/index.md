---
doc-schema-version: 1
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda sedang memilih antara alat bawaan, Skills, dan Plugin
    - Anda memerlukan titik masuk dokumentasi yang tepat untuk kebijakan alat, otomatisasi, atau koordinasi agen
summary: 'Ikhtisar alat, Skills, dan Plugin OpenClaw: apa yang dapat dipanggil agen dan cara memperluasnya'
title: Ikhtisar
x-i18n:
    generated_at: "2026-05-12T00:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Gunakan halaman ini untuk memilih permukaan Capabilities yang tepat. **Alat** adalah
tindakan yang dapat dipanggil, **Skills** mengajari agen cara bekerja, dan **plugin** menambahkan kemampuan
runtime seperti alat, penyedia, channel, hook, dan Skills yang dipaketkan.

Ini adalah halaman ikhtisar dan pengarah. Untuk kebijakan alat, default,
keanggotaan grup, pembatasan penyedia, dan kolom konfigurasi yang lengkap, gunakan
[Alat dan penyedia kustom](/id/gateway/config-tools).

## Mulai di sini

Untuk sebagian besar agen, mulai dengan kategori alat bawaan, lalu sesuaikan kebijakan
hanya ketika agen harus melihat lebih sedikit alat atau memerlukan akses host eksplisit.

| Jika Anda perlu...                              | Gunakan ini terlebih dahulu                         | Lalu baca                                                               |
| ----------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Membiarkan agen bertindak dengan kemampuan yang ada | [Alat bawaan](#built-in-tool-categories)            | [Kategori alat](#built-in-tool-categories)                              |
| Mengontrol apa yang dapat dipanggil agen        | [Kebijakan alat](#configure-access-and-approvals)   | [Alat dan penyedia kustom](/id/gateway/config-tools)                       |
| Mengajari agen sebuah alur kerja                | [Skills](#choose-tools-skills-or-plugins)           | [Skills](/id/tools/skills) dan [Membuat Skills](/id/tools/creating-skills)    |
| Menambahkan integrasi baru atau permukaan runtime | [Plugin](#extend-capabilities)                      | [Plugin](/id/tools/plugin) dan [Membangun plugin](/id/plugins/building-plugins) |
| Menjalankan pekerjaan nanti atau di latar belakang | [Otomatisasi](/id/automation)                          | [Ikhtisar otomatisasi](/id/automation)                                     |
| Mengoordinasikan beberapa agen atau harness     | [Sub-agen](/id/tools/subagents)                        | [Agen ACP](/id/tools/acp-agents) dan [Kirim agen](/id/tools/agent-send)       |
| Mencari katalog alat PI yang besar              | [Pencarian Alat](/id/tools/tool-search)                | [Pencarian Alat](/id/tools/tool-search)                                    |

## Pilih alat, Skills, atau plugin

<Steps>
  <Step title="Gunakan alat ketika agen perlu bertindak">
    Alat adalah fungsi bertipe yang dapat dipanggil agen, seperti `exec`, `browser`,
    `web_search`, `message`, atau `image_generate`. Gunakan alat ketika agen
    perlu membaca data, mengubah file, mengirim pesan, memanggil penyedia, atau mengoperasikan
    sistem lain. Alat yang terlihat dikirim ke model sebagai definisi fungsi
    terstruktur.

    Model hanya melihat alat yang lolos dari profil aktif, kebijakan allow/deny,
    pembatasan penyedia, status sandbox, izin channel, dan ketersediaan
    plugin.

  </Step>

  <Step title="Gunakan Skills ketika agen memerlukan instruksi">
    Skills adalah paket instruksi `SKILL.md` yang dimuat ke dalam prompt agen. Gunakan
    Skills ketika agen sudah memiliki alat yang dibutuhkan, tetapi memerlukan alur kerja
    berulang, rubrik ulasan, urutan perintah, atau batasan operasi.

    Skills dapat berada di workspace, direktori Skills bersama, root Skills
    OpenClaw terkelola, atau paket plugin.

    [Skills](/id/tools/skills) | [Membuat Skills](/id/tools/creating-skills) | [Konfigurasi Skills](/id/tools/skills-config)

  </Step>

  <Step title="Gunakan plugin ketika OpenClaw memerlukan kemampuan baru">
    Plugin dapat menambahkan alat, Skills, channel, penyedia model, speech, suara realtime,
    pembuatan media, pencarian web, pengambilan web, hook, dan kemampuan runtime
    lainnya. Gunakan plugin ketika kemampuan tersebut memiliki kode, kredensial,
    hook siklus hidup, metadata manifes, atau paket yang dapat diinstal. Plugin yang ada
    dapat diinstal dari ClawHub, npm, git, direktori lokal, atau
    arsip.

    [Instal dan konfigurasikan plugin](/id/tools/plugin) | [Membangun plugin](/id/plugins/building-plugins) | [Plugin SDK](/id/plugins/sdk-overview)

  </Step>
</Steps>

## Kategori alat bawaan

Tabel ini mencantumkan alat representatif agar Anda dapat mengenali permukaannya. Ini
bukan referensi kebijakan lengkap. Untuk grup, default, dan semantik allow/deny
yang tepat, gunakan [Alat dan penyedia kustom](/id/gateway/config-tools).

| Kategori               | Gunakan ketika agen perlu...                                                   | Alat representatif                                                    | Baca selanjutnya                                                       |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime                | Menjalankan perintah, mengelola proses, atau menggunakan analisis Python berbasis penyedia | `exec`, `process`, `code_execution`                                  | [Exec](/id/tools/exec), [Eksekusi kode](/id/tools/code-execution)            |
| File                   | Membaca dan mengubah file workspace                                            | `read`, `write`, `edit`, `apply_patch`                               | [Terapkan patch](/id/tools/apply-patch)                                   |
| Web                    | Mencari di web, mencari posting X, atau mengambil konten halaman yang dapat dibaca | `web_search`, `x_search`, `web_fetch`                                | [Alat web](/id/tools/web), [Pengambilan web](/id/tools/web-fetch)            |
| Browser                | Mengoperasikan sesi browser                                                    | `browser`                                                            | [Browser](/id/tools/browser)                                              |
| Pesan dan channel      | Mengirim balasan atau tindakan channel                                         | `message`                                                            | [Kirim agen](/id/tools/agent-send)                                        |
| Sesi dan agen          | Memeriksa sesi, mendelegasikan pekerjaan, mengarahkan run lain, atau melaporkan status | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Sub-agen](/id/tools/subagents), [Alat sesi](/id/concepts/session-tool)      |
| Otomatisasi            | Menjadwalkan pekerjaan atau merespons peristiwa latar belakang                 | `cron`, `heartbeat_respond`                                          | [Otomatisasi](/id/automation)                                             |
| Gateway dan node       | Memeriksa status Gateway atau perangkat target yang dipasangkan                | `gateway`, `nodes`                                                   | [Konfigurasi Gateway](/id/gateway/configuration), [Node](/id/nodes)          |
| Media                  | Menganalisis, menghasilkan, atau mengucapkan media                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Ikhtisar media](/id/tools/media-overview)                                |
| Katalog PI besar       | Mencari dan memanggil banyak alat yang memenuhi syarat tanpa mengirim setiap skema ke model | `tool_search_code`, `tool_search`, `tool_describe`                   | [Pencarian Alat](/id/tools/tool-search)                                   |

<Note>
Tool Search adalah permukaan agen PI eksperimental. Run harness Codex menggunakan
mode kode native Codex, pencarian alat native, alat dinamis tertunda, dan panggilan
alat bertingkat, bukan `tools.toolSearch`.
</Note>

## Alat yang disediakan plugin

Plugin dapat mendaftarkan alat tambahan. Penulis plugin menghubungkan alat melalui
`api.registerTool(...)` dan `contracts.tools` milik manifes; gunakan
[Plugin SDK](/id/plugins/sdk-overview) dan [Manifes plugin](/id/plugins/manifest)
untuk detail kontrak.

Alat umum yang disediakan plugin meliputi:

- [Diff](/id/tools/diffs) untuk merender diff file dan markdown
- [Tugas LLM](/id/tools/llm-task) untuk langkah alur kerja khusus JSON
- [Lobster](/id/tools/lobster) untuk alur kerja bertipe dengan persetujuan yang dapat dilanjutkan
- [Tokenjuice](/id/tools/tokenjuice) untuk memadatkan output alat `exec` dan `bash` yang berisik
- [Pencarian Alat](/id/tools/tool-search) untuk menemukan dan memanggil katalog alat
  besar tanpa menaruh setiap skema di prompt
- [Canvas](/id/plugins/reference/canvas) untuk kontrol Canvas node dan rendering
  A2UI

## Konfigurasikan akses dan persetujuan

Kebijakan alat diberlakukan sebelum panggilan model. Jika kebijakan menghapus alat, model
tidak menerima skema alat tersebut untuk giliran itu. Sebuah run dapat kehilangan alat
karena konfigurasi global, konfigurasi per agen, kebijakan channel, pembatasan
penyedia, aturan sandbox, gating khusus pemilik, atau ketersediaan plugin.

- [Alat dan penyedia kustom](/id/gateway/config-tools) mendokumentasikan profil alat,
  daftar allow/deny, pembatasan khusus penyedia, deteksi loop, dan
  pengaturan alat berbasis penyedia.
- [Persetujuan exec](/id/tools/exec-approvals) mendokumentasikan kebijakan persetujuan
  perintah host.
- [Exec yang ditingkatkan](/id/tools/elevated) mendokumentasikan eksekusi terkontrol di luar
  sandbox.
- [Sandbox vs kebijakan alat vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) menjelaskan lapisan mana yang mengontrol akses file dan proses.
- [Pembatasan sandbox dan alat per agen](/id/tools/multi-agent-sandbox-tools)
  mendokumentasikan pembatasan khusus agen untuk run yang didelegasikan.

## Perluas kemampuan

Pilih jalur ekstensi berdasarkan pekerjaan yang perlu dilakukan OpenClaw:

- Instal atau kelola plugin yang ada dengan [Plugin](/id/tools/plugin).
- Bangun integrasi, penyedia, channel, alat, atau hook baru dengan
  [Membangun plugin](/id/plugins/building-plugins).
- Tambahkan atau sesuaikan instruksi agen yang dapat digunakan ulang dengan [Skills](/id/tools/skills) dan
  [Membuat Skills](/id/tools/creating-skills).
- Paketkan materi alur kerja yang dapat digunakan ulang dengan
  [Workshop Skills](/id/plugins/skill-workshop) ketika alur kerja termasuk dalam
  bundle Skills yang didistribusikan plugin.
- Gunakan [Plugin SDK](/id/plugins/sdk-overview) dan [Manifes plugin](/id/plugins/manifest) ketika Anda memerlukan kontrak implementasi.

## Pecahkan masalah alat yang hilang

Jika model tidak dapat melihat atau memanggil alat, mulai dengan kebijakan efektif untuk
giliran saat ini:

1. Periksa profil aktif, `tools.allow`, dan `tools.deny` di
   [Alat dan penyedia kustom](/id/gateway/config-tools).
2. Periksa pembatasan khusus penyedia di
   [Alat dan penyedia kustom](/id/gateway/config-tools) dan pastikan
   [penyedia model](/id/concepts/model-providers) yang dipilih mendukung bentuk alat tersebut.
3. Periksa izin channel, status sandbox, dan akses elevated dengan
   [Sandbox vs kebijakan alat vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) dan [Exec yang ditingkatkan](/id/tools/elevated).
4. Periksa apakah plugin pemilik sudah diinstal dan diaktifkan di
   [Plugin](/id/tools/plugin).
5. Untuk run yang didelegasikan, periksa pembatasan per agen di
   [Pembatasan sandbox dan alat per agen](/id/tools/multi-agent-sandbox-tools).
6. Untuk katalog PI besar, pastikan apakah run menggunakan eksposur alat langsung atau
   [Pencarian Alat](/id/tools/tool-search).

## Terkait

- [Otomatisasi](/id/automation) untuk cron, tugas, heartbeat, komitmen, hook, standing order, dan Task Flow
- [Agen](/id/concepts/agent) untuk model agen, sesi, memori, dan koordinasi multi-agen
- [Alat dan penyedia kustom](/id/gateway/config-tools) untuk referensi kebijakan alat kanonis
- [Plugin](/id/tools/plugin) untuk instalasi dan manajemen plugin
- [Plugin SDK](/id/plugins/sdk-overview) untuk referensi penulis plugin
- [Skills](/id/tools/skills) untuk urutan pemuatan, gating, dan konfigurasi Skills
- [Pencarian Alat](/id/tools/tool-search) untuk penemuan katalog alat PI yang ringkas
