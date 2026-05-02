---
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak alat
    - Anda sedang memilih antara alat bawaan, Skills, dan Plugin
summary: 'Ikhtisar alat dan Plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Alat dan Plugin
x-i18n:
    generated_at: "2026-05-02T21:01:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Semua yang dilakukan agen selain menghasilkan teks terjadi melalui **alat**.
Alat adalah cara agen membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Alat, Skills, dan plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Alat adalah yang dipanggil oleh agen">
    Alat adalah fungsi bertipe yang dapat dipanggil agen (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyertakan sekumpulan **alat bawaan** dan
    plugin dapat mendaftarkan alat tambahan.

    Agen melihat alat sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajari agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke prompt sistem.
    Skills memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan alat secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau disertakan di dalam plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya bersama">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kemampuan apa pun:
    channel, penyedia model, alat, skills, ucapan, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    pengambilan web, pencarian web, dan lainnya. Beberapa plugin bersifat **core** (disertakan bersama
    OpenClaw), lainnya bersifat **eksternal** (dipublikasikan di npm oleh komunitas).

    [Instal dan konfigurasikan plugin](/id/tools/plugin) | [Bangun sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Alat bawaan

Alat ini disertakan bersama OpenClaw dan tersedia tanpa memasang plugin apa pun:

| Alat                                       | Fungsinya                                                              | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python jarak jauh dalam sandbox                  | [Eksekusi Kode](/id/tools/code-execution)                       |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, tangkapan layar)         | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari posting X, mengambil konten halaman           | [Web](/id/tools/web), [Pengambilan Web](/id/tools/web-fetch)       |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Terapkan Patch](/id/tools/apply-patch)                         |
| `message`                                  | Mengirim pesan ke semua channel                                       | [Pengiriman Agen](/id/tools/agent-send)                         |
| `canvas`                                   | Menggerakkan Canvas node (present, eval, snapshot)                    |                                                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipasangkan                  |                                                              |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, menambal, memulai ulang, atau memperbarui gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau membuat gambar                                      | [Pembuatan Gambar](/id/tools/image-generation)                  |
| `music_generate`                           | Membuat trek musik                                                    | [Pembuatan Musik](/id/tools/music-generation)                   |
| `video_generate`                           | Membuat video                                                         | [Pembuatan Video](/id/tools/video-generation)                   |
| `tts`                                      | Konversi teks-ke-ucapan sekali jalan                                  | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agen                       | [Sub-agen](/id/tools/subagents)                                 |
| `session_status`                           | Pembacaan balik ringan bergaya `/status` dan override model sesi      | [Alat Sesi](/id/concepts/session-tool)                          |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau penyedia gambar non-default lainnya, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau penyedia musik non-default lainnya, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau penyedia video non-default lainnya, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pembuatan audio berbasis workflow, gunakan `music_generate` saat plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan teks-ke-ucapan.

`session_status` adalah alat status/pembacaan balik ringan dalam grup sesi.
Alat ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, alat ini dapat mengisi balik penghitung token/cache yang jarang dan
label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah alat runtime khusus pemilik untuk operasi gateway:

- `config.schema.lookup` untuk satu subtree konfigurasi berskala path sebelum pengeditan
- `config.get` untuk snapshot konfigurasi saat ini + hash
- `config.patch` untuk pembaruan konfigurasi parsial dengan mulai ulang
- `config.apply` hanya untuk penggantian konfigurasi penuh
- `update.run` untuk pembaruan mandiri eksplisit + mulai ulang

Untuk perubahan parsial, prioritaskan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya saat Anda sengaja mengganti seluruh konfigurasi.
Untuk dokumentasi konfigurasi yang lebih luas, baca [Konfigurasi](/id/gateway/configuration) dan
[Referensi konfigurasi](/id/gateway/configuration-reference).
Alat ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Alat yang disediakan plugin

Plugin dapat mendaftarkan alat tambahan. Beberapa contoh:

- [Diff](/id/tools/diffs) — penampil dan perender diff
- [Tugas LLM](/id/tools/llm-task) — langkah LLM hanya-JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime workflow bertipe dengan persetujuan yang dapat dilanjutkan
- [Pembuatan Musik](/id/tools/music-generation) — alat `music_generate` bersama dengan penyedia berbasis workflow
- [OpenProse](/id/prose) — orkestrasi workflow yang mengutamakan markdown
- [Tokenjuice](/id/tools/tokenjuice) — memadatkan hasil alat `exec` dan `bash` yang berisik

Alat plugin tetap dibuat dengan `api.registerTool(...)` dan dideklarasikan dalam
daftar `contracts.tools` pada manifest plugin. OpenClaw menangkap deskriptor
alat yang tervalidasi selama discovery dan menyimpannya dalam cache berdasarkan sumber dan kontrak plugin, sehingga
perencanaan alat berikutnya dapat melewati pemuatan runtime plugin. Eksekusi alat tetap memuat
plugin pemilik dan memanggil implementasi terdaftar yang live.

## Konfigurasi alat

### Daftar izin dan tolak

Kontrol alat mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` dalam
konfigurasi. Tolak selalu menang atas izin.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw gagal tertutup saat allowlist eksplisit tidak menghasilkan alat yang dapat dipanggil.
Misalnya, `tools.allow: ["query_db"]` hanya berfungsi jika plugin yang dimuat benar-benar
mendaftarkan `query_db`. Jika tidak ada alat bawaan, plugin, atau MCP bundel yang cocok dengan
allowlist, run berhenti sebelum panggilan model alih-alih berlanjut sebagai
run hanya-teks yang dapat mengarang hasil alat.

### Profil alat

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per-agen: `agents.list[].tools.profile`.

| Profil      | Yang disertakan                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Baseline tanpa batasan untuk akses perintah/kontrol yang lebih luas; sama seperti membiarkan `tools.profile` tidak disetel                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Hanya `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` sengaja sempit untuk agen yang berfokus pada channel.
Profil ini mengecualikan alat perintah/kontrol yang lebih luas seperti filesystem, runtime,
browser, canvas, nodes, cron, dan kontrol gateway. Gunakan `tools.profile: "full"`
sebagai baseline tanpa batasan untuk akses perintah/kontrol yang lebih luas, lalu pangkas
akses dengan `tools.allow` / `tools.deny` saat diperlukan.
</Note>

`coding` menyertakan alat web ringan (`web_search`, `web_fetch`, `x_search`)
tetapi tidak menyertakan alat kontrol browser penuh. Otomasi browser dapat menggerakkan
sesi nyata dan profil yang sudah masuk, jadi tambahkan secara eksplisit dengan
`tools.alsoAllow: ["browser"]` atau per-agen
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Mengonfigurasi `tools.exec` atau `tools.fs` di bawah profil restriktif (`messaging`, `minimal`) tidak secara implisit memperluas allowlist profil tersebut. Tambahkan entri `tools.alsoAllow` eksplisit (misalnya `["exec", "process"]` untuk exec, atau `["read", "write", "edit"]` untuk fs) saat Anda ingin profil restriktif menggunakan bagian yang dikonfigurasi tersebut. OpenClaw mencatat peringatan startup saat bagian konfigurasi ada tanpa grant `alsoAllow` yang cocok.
</Note>

Profil `coding` dan `messaging` juga mengizinkan alat MCP bundel yang dikonfigurasi
di bawah kunci plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` saat Anda
ingin profil mempertahankan bawaan normalnya tetapi menyembunyikan semua alat MCP yang dikonfigurasi.
Profil `minimal` tidak menyertakan alat MCP bundel.

Contoh (permukaan alat paling luas secara default):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grup alat

Gunakan singkatan `group:*` dalam daftar izin/tolak:

| Grup               | Alat                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` diterima sebagai alias untuk `exec`)                                |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Semua alat bawaan OpenClaw (tidak termasuk alat Plugin)                                                   |

`sessions_history` mengembalikan tampilan ingatan ulang yang dibatasi dan
difilter demi keamanan. Ini menghapus tag pemikiran, kerangka
`<relevant-memories>`, payload XML pemanggilan alat teks biasa (termasuk
`<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
`<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
blok pemanggilan alat yang terpotong), kerangka pemanggilan alat yang
diturunkan tingkatnya, token kontrol model ASCII/lebar penuh yang bocor, dan
XML pemanggilan alat MiniMax yang tidak valid dari teks asisten, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris yang terlalu besar alih-alih
bertindak sebagai dump transkrip mentah.

### Pembatasan khusus penyedia

Gunakan `tools.byProvider` untuk membatasi alat bagi penyedia tertentu tanpa
mengubah default global:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
