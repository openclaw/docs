---
doc-schema-version: 1
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda sedang memilih antara alat bawaan, Skills, dan plugin
    - Anda memerlukan titik masuk dokumentasi yang tepat untuk kebijakan alat, otomatisasi, atau koordinasi agen
summary: 'Ikhtisar alat, Skills, dan plugin OpenClaw: apa yang dapat dipanggil agen dan cara memperluasnya'
title: Ikhtisar
x-i18n:
    generated_at: "2026-06-27T18:19:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Gunakan halaman ini untuk memilih permukaan Capabilities yang tepat. **Alat** adalah
tindakan yang dapat dipanggil, **Skills** mengajarkan agen cara bekerja, dan **Plugin** menambahkan kemampuan runtime
seperti alat, penyedia, saluran, hook, dan Skills yang dikemas.

Ini adalah halaman ikhtisar dan perutean. Untuk kebijakan alat, default,
keanggotaan grup, pembatasan penyedia, dan bidang konfigurasi yang lengkap, gunakan
[Alat dan penyedia kustom](/id/gateway/config-tools).

## Mulai di sini

Untuk sebagian besar agen, mulai dengan kategori alat bawaan, lalu sesuaikan kebijakan
hanya ketika agen harus melihat lebih sedikit alat atau membutuhkan akses host eksplisit.

| Jika Anda perlu...                           | Gunakan ini terlebih dahulu                                 | Lalu baca                                                                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Membiarkan agen bertindak dengan kemampuan yang ada | [Alat bawaan](#built-in-tool-categories)    | [Kategori alat](#built-in-tool-categories)                                                                    |
| Mengontrol apa yang dapat dipanggil agen              | [Kebijakan alat](#configure-access-and-approvals) | [Alat dan penyedia kustom](/id/gateway/config-tools)                                                             |
| Mengajarkan alur kerja kepada agen                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/id/tools/skills), [Membuat Skills](/id/tools/creating-skills), dan [Lokakarya Skill](/id/tools/skill-workshop) |
| Menambahkan integrasi baru atau permukaan runtime    | [Plugin](#extend-capabilities)                | [Plugin](/id/tools/plugin) dan [Membangun Plugin](/id/plugins/building-plugins)                                         |
| Menjalankan pekerjaan nanti atau di latar belakang         | [Automasi](/id/automation)                      | [Ikhtisar automasi](/id/automation)                                                                              |
| Mengkoordinasikan beberapa agen atau harness     | [Sub-agen](/id/tools/subagents)                 | [Agen ACP](/id/tools/acp-agents) dan [Kirim agen](/id/tools/agent-send)                                             |
| Mencari katalog alat OpenClaw yang besar        | [Pencarian Alat](/id/tools/tool-search)              | [Pencarian Alat](/id/tools/tool-search)                                                                               |

## Pilih alat, Skills, atau Plugin

<Steps>
  <Step title="Use a tool when the agent needs to act">
    Alat adalah fungsi bertipe yang dapat dipanggil agen, seperti `exec`, `browser`,
    `web_search`, `message`, atau `image_generate`. Gunakan alat ketika agen
    perlu membaca data, mengubah file, mengirim pesan, memanggil penyedia, atau mengoperasikan
    sistem lain. Alat yang terlihat dikirim ke model sebagai definisi fungsi
    terstruktur.

    Model hanya melihat alat yang lolos dari profil aktif, kebijakan izinkan/tolak,
    pembatasan penyedia, status sandbox, izin saluran, dan ketersediaan
    Plugin.

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill adalah paket instruksi `SKILL.md` yang dimuat ke dalam prompt agen. Gunakan
    Skill ketika agen sudah memiliki alat yang dibutuhkan, tetapi membutuhkan
    alur kerja berulang, rubrik tinjauan, urutan perintah, atau batasan operasional.

    Skills dapat berada di workspace, direktori Skill bersama, root Skill OpenClaw
    terkelola, atau paket Plugin.

    [Skills](/id/tools/skills) | [Lokakarya Skill](/id/tools/skill-workshop) | [Membuat Skills](/id/tools/creating-skills) | [Konfigurasi Skills](/id/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Plugin dapat menambahkan alat, Skills, saluran, penyedia model, ucapan, suara realtime,
    pembuatan media, pencarian web, pengambilan web, hook, dan kemampuan runtime
    lainnya. Gunakan Plugin ketika kemampuan memiliki kode, kredensial,
    hook siklus hidup, metadata manifes, atau paket yang dapat diinstal. Plugin yang ada
    dapat diinstal dari ClawHub, npm, git, direktori lokal, atau
    arsip.

    [Instal dan konfigurasikan Plugin](/id/tools/plugin) | [Membangun Plugin](/id/plugins/building-plugins) | [SDK Plugin](/id/plugins/sdk-overview)

  </Step>
</Steps>

## Kategori alat bawaan

Tabel ini mencantumkan alat representatif agar Anda dapat mengenali permukaannya. Ini
bukan referensi kebijakan lengkap. Untuk grup, default, dan semantik izinkan/tolak
yang tepat, gunakan [Alat dan penyedia kustom](/id/gateway/config-tools).

| Kategori                | Gunakan ketika agen perlu...                                                | Alat representatif                                                 | Baca selanjutnya                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Runtime                 | Menjalankan perintah, mengelola proses, atau menggunakan analisis Python yang didukung penyedia        | `exec`, `process`, `code_execution`                                  | [Exec](/id/tools/exec), [Eksekusi kode](/id/tools/code-execution)                                |
| File                   | Membaca dan mengubah file workspace                                               | `read`, `write`, `edit`, `apply_patch`                               | [Terapkan patch](/id/tools/apply-patch)                                                           |
| Web                     | Mencari di web, mencari posting X, atau mengambil konten halaman yang dapat dibaca                | `web_search`, `x_search`, `web_fetch`                                | [Alat web](/id/tools/web), [Pengambilan web](/id/tools/web-fetch)                                      |
| Browser                 | Mengoperasikan sesi browser                                                     | `browser`                                                            | [Browser](/id/tools/browser)                                                                   |
| Pesan dan saluran  | Mengirim balasan atau tindakan saluran                                               | `message`                                                            | [Kirim agen](/id/tools/agent-send)                                                             |
| Sesi dan agen     | Memeriksa sesi, mendelegasikan pekerjaan, mengarahkan run lain, atau melaporkan status          | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Goal](/id/tools/goal), [Sub-agen](/id/tools/subagents), [Alat sesi](/id/concepts/session-tool) |
| Automasi              | Menjadwalkan pekerjaan atau merespons event latar belakang                                 | `cron`, `heartbeat_respond`                                          | [Automasi](/id/automation)                                                                   |
| Gateway dan node       | Memeriksa status Gateway atau perangkat target yang dipasangkan                                | `gateway`, `nodes`                                                   | [Konfigurasi Gateway](/id/gateway/configuration), [Node](/id/nodes)                            |
| Media                   | Menganalisis, membuat, atau mengucapkan media                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Ikhtisar media](/id/tools/media-overview)                                                     |
| Katalog OpenClaw besar | Mencari dan memanggil banyak alat yang memenuhi syarat tanpa mengirim setiap skema ke model | `tool_search_code`, `tool_search`, `tool_describe`                   | [Pencarian Alat](/id/tools/tool-search)                                                           |

<Note>
Pencarian Alat adalah permukaan agen OpenClaw eksperimental. Run harness Codex menggunakan
mode kode native Codex, pencarian alat native, alat dinamis tertunda, dan panggilan
alat bersarang, bukan `tools.toolSearch`.
</Note>

## Alat yang disediakan Plugin

Plugin dapat mendaftarkan alat tambahan. Penulis Plugin menghubungkan alat melalui
`api.registerTool(...)` dan `contracts.tools` milik manifes; gunakan
[SDK Plugin](/id/plugins/sdk-overview) dan [Manifes Plugin](/id/plugins/manifest)
untuk detail kontrak.

Alat umum yang disediakan Plugin meliputi:

- [Diff](/id/tools/diffs) untuk merender diff file dan markdown
- [Tugas LLM](/id/tools/llm-task) untuk langkah alur kerja khusus JSON
- [Lobster](/id/tools/lobster) untuk alur kerja bertipe dengan persetujuan yang dapat dilanjutkan
- [Tokenjuice](/id/tools/tokenjuice) untuk memadatkan output alat `exec` dan `bash` yang berisik
- [Pencarian Alat](/id/tools/tool-search) untuk menemukan dan memanggil katalog alat besar
  tanpa memasukkan setiap skema ke dalam prompt
- [Canvas](/id/plugins/reference/canvas) untuk kontrol Canvas node dan rendering A2UI

## Konfigurasikan akses dan persetujuan

Kebijakan alat ditegakkan sebelum panggilan model. Jika kebijakan menghapus alat, model
tidak menerima skema alat tersebut untuk giliran itu. Sebuah run dapat kehilangan alat
karena konfigurasi global, konfigurasi per agen, kebijakan saluran, pembatasan
penyedia, aturan sandbox, kebijakan saluran/runtime, atau ketersediaan Plugin.

- [Alat dan penyedia kustom](/id/gateway/config-tools) mendokumentasikan profil alat,
  daftar izinkan/tolak, pembatasan khusus penyedia, deteksi loop, dan
  pengaturan alat yang didukung penyedia.
- [Persetujuan exec](/id/tools/exec-approvals) mendokumentasikan kebijakan persetujuan
  perintah host.
- [Exec yang ditingkatkan](/id/tools/elevated) mendokumentasikan eksekusi terkontrol di luar
  sandbox.
- [Sandbox vs kebijakan alat vs ditingkatkan](/id/gateway/sandbox-vs-tool-policy-vs-elevated) menjelaskan lapisan mana yang mengontrol akses file dan proses.
- [Sandbox per agen dan pembatasan alat](/id/tools/multi-agent-sandbox-tools)
  mendokumentasikan pembatasan khusus agen untuk run yang didelegasikan.

## Perluas kemampuan

Pilih jalur ekstensi berdasarkan pekerjaan yang Anda butuhkan OpenClaw lakukan:

- Instal atau kelola Plugin yang ada dengan [Plugin](/id/tools/plugin).
- Bangun integrasi, penyedia, saluran, alat, atau hook baru dengan
  [Membangun Plugin](/id/plugins/building-plugins).
- Tambahkan atau sesuaikan instruksi agen yang dapat digunakan ulang dengan [Skills](/id/tools/skills) dan
  [Membuat Skills](/id/tools/creating-skills).
- Gunakan [SDK Plugin](/id/plugins/sdk-overview) dan [Manifes Plugin](/id/plugins/manifest) ketika Anda membutuhkan kontrak implementasi.

## Pecahkan masalah alat yang hilang

Jika model tidak dapat melihat atau memanggil alat, mulai dengan kebijakan efektif untuk
giliran saat ini:

1. Periksa profil aktif, `tools.allow`, dan `tools.deny` di
   [Alat dan penyedia kustom](/id/gateway/config-tools).
2. Periksa pembatasan khusus penyedia di
   [Alat dan penyedia kustom](/id/gateway/config-tools) dan pastikan
   [penyedia model](/id/concepts/model-providers) yang dipilih mendukung bentuk alat tersebut.
3. Periksa izin saluran, status sandbox, dan akses yang ditingkatkan dengan
   [Sandbox vs kebijakan alat vs ditingkatkan](/id/gateway/sandbox-vs-tool-policy-vs-elevated) dan [Exec yang ditingkatkan](/id/tools/elevated).
4. Periksa apakah Plugin pemilik sudah diinstal dan diaktifkan di
   [Plugin](/id/tools/plugin).
5. Untuk run yang didelegasikan, periksa pembatasan per agen di
   [Sandbox per agen dan pembatasan alat](/id/tools/multi-agent-sandbox-tools).
6. Untuk katalog OpenClaw besar, konfirmasi apakah run menggunakan eksposur alat langsung atau
   [Pencarian Alat](/id/tools/tool-search).

## Terkait

- [Automasi](/id/automation) untuk cron, tugas, Heartbeat, komitmen, hook, perintah tetap, dan Task Flow
- [Agen](/id/concepts/agent) untuk model agen, sesi, memori, dan koordinasi multi-agen
- [Alat dan penyedia kustom](/id/gateway/config-tools) untuk referensi kebijakan alat kanonis
- [Plugin](/id/tools/plugin) untuk instalasi dan pengelolaan Plugin
- [SDK Plugin](/id/plugins/sdk-overview) untuk referensi penulis Plugin
- [Skills](/id/tools/skills) untuk urutan pemuatan Skill, gating, dan konfigurasi
- [Lokakarya Skill](/id/tools/skill-workshop) untuk pembuatan Skill yang dihasilkan dan ditinjau
- [Pencarian Alat](/id/tools/tool-search) untuk penemuan katalog alat OpenClaw yang ringkas
