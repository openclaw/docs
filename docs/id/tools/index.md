---
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak alat
    - Anda sedang memilih antara alat bawaan, Skills, dan plugin
summary: 'Ikhtisar alat dan Plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Alat dan Plugin
x-i18n:
    generated_at: "2026-05-07T13:26:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Semua yang dilakukan agen selain menghasilkan teks terjadi melalui **alat**.
Alat adalah cara agen membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Alat, Skills, dan Plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Alat adalah yang dipanggil agen">
    Alat adalah fungsi bertipe yang dapat dipanggil agen (mis. `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyertakan satu set **alat bawaan** dan
    Plugin dapat mendaftarkan alat tambahan.

    Agen melihat alat sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajari agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke prompt sistem.
    Skills memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan alat secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau disertakan di dalam Plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat Skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya bersama">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kapabilitas apa pun:
    channel, penyedia model, alat, Skills, ucapan, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    pengambilan web, pencarian web, dan lainnya. Beberapa Plugin bersifat **core** (disertakan bersama
    OpenClaw), yang lain bersifat **eksternal** (dipublikasikan di npm oleh komunitas).

    [Instal dan konfigurasikan Plugin](/id/tools/plugin) | [Bangun milik Anda sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Alat bawaan

Alat ini disertakan bersama OpenClaw dan tersedia tanpa menginstal Plugin apa pun:

| Alat                                       | Yang dilakukannya                                                      | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang            | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python jarak jauh dalam sandbox                   | [Eksekusi Kode](/id/tools/code-execution)                       |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, tangkapan layar)         | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari posting X, mengambil konten halaman            | [Web](/id/tools/web), [Pengambilan Web](/id/tools/web-fetch)       |
| `read` / `write` / `edit`                  | I/O file di workspace                                                  |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                  | [Terapkan Patch](/id/tools/apply-patch)                         |
| `message`                                  | Mengirim pesan di semua channel                                        | [Kirim Agen](/id/tools/agent-send)                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipasangkan                   |                                                              |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, menambal, memulai ulang, atau memperbarui gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau menghasilkan gambar                                  | [Pembuatan Gambar](/id/tools/image-generation)                  |
| `music_generate`                           | Menghasilkan trek musik                                                | [Pembuatan Musik](/id/tools/music-generation)                   |
| `video_generate`                           | Menghasilkan video                                                     | [Pembuatan Video](/id/tools/video-generation)                   |
| `tts`                                      | Konversi teks-ke-ucapan sekali jalan                                   | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agen                        | [Sub-agen](/id/tools/subagents)                                 |
| `session_status`                           | Pembacaan balik ringan bergaya `/status` dan override model sesi      | [Alat Sesi](/id/concepts/session-tool)                          |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau penyedia gambar non-default lain, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau penyedia musik non-default lain, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau penyedia video non-default lain, konfigurasikan auth/kunci API penyedia tersebut terlebih dahulu.

Untuk pembuatan audio berbasis workflow, gunakan `music_generate` ketika Plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan teks-ke-ucapan.

`session_status` adalah alat status/pembacaan balik ringan dalam grup sesi.
Alat ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, alat ini dapat mengisi balik penghitung token/cache yang jarang dan
label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah alat runtime khusus pemilik untuk operasi Gateway:

- `config.schema.lookup` untuk satu subtree konfigurasi berbatas cakupan path sebelum pengeditan
- `config.get` untuk snapshot konfigurasi saat ini + hash
- `config.patch` untuk pembaruan konfigurasi parsial dengan mulai ulang
- `config.apply` hanya untuk penggantian konfigurasi penuh
- `update.run` untuk pembaruan mandiri eksplisit + mulai ulang

Untuk perubahan parsial, prioritaskan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya ketika Anda sengaja mengganti seluruh konfigurasi.
Untuk dokumentasi konfigurasi yang lebih luas, baca [Konfigurasi](/id/gateway/configuration) dan
[Referensi konfigurasi](/id/gateway/configuration-reference).
Alat ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Alat yang disediakan Plugin

Plugin dapat mendaftarkan alat tambahan. Beberapa contoh:

- [Canvas](/id/plugins/reference/canvas) — Plugin bawaan eksperimental untuk kontrol Canvas node dan rendering A2UI
- [Diffs](/id/tools/diffs) — penampil dan perender diff
- [LLM Task](/id/tools/llm-task) — langkah LLM khusus JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime workflow bertipe dengan persetujuan yang dapat dilanjutkan
- [Pembuatan Musik](/id/tools/music-generation) — alat `music_generate` bersama dengan penyedia berbasis workflow
- [OpenProse](/id/prose) — orkestrasi workflow yang mengutamakan markdown
- [Tokenjuice](/id/tools/tokenjuice) — memadatkan hasil alat `exec` dan `bash` yang berisik

Alat Plugin tetap dibuat dengan `api.registerTool(...)` dan dideklarasikan dalam
daftar `contracts.tools` pada manifes Plugin. OpenClaw menangkap deskriptor
alat yang tervalidasi selama penemuan dan men-cache-nya berdasarkan sumber dan kontrak Plugin, sehingga
perencanaan alat berikutnya dapat melewati pemuatan runtime Plugin. Eksekusi alat tetap memuat
Plugin pemilik dan memanggil implementasi terdaftar yang aktif.

## Konfigurasi alat

### Daftar izinkan dan tolak

Kontrol alat mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` dalam
konfigurasi. Tolak selalu menang atas izinkan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw gagal tertutup ketika allowlist eksplisit tidak menghasilkan alat yang dapat dipanggil.
Misalnya, `tools.allow: ["query_db"]` hanya berfungsi jika Plugin yang dimuat benar-benar
mendaftarkan `query_db`. Jika tidak ada alat bawaan, Plugin, atau MCP terbundel yang cocok dengan
allowlist, run berhenti sebelum panggilan model alih-alih melanjutkan sebagai
run hanya teks yang dapat berhalusinasi tentang hasil alat.

### Profil alat

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per agen: `agents.list[].tools.profile`.

| Profil      | Yang disertakan                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Semua alat Plugin core dan opsional; baseline tidak dibatasi untuk akses perintah/kontrol yang lebih luas                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Hanya `session_status`                                                                                                                            |

<Note>
`tools.profile: "messaging"` sengaja dibuat sempit untuk agen yang berfokus pada channel.
Profil ini mengecualikan alat perintah/kontrol yang lebih luas seperti filesystem, runtime,
browser, canvas, nodes, cron, dan kontrol Gateway. Gunakan `tools.profile: "full"`
sebagai baseline tidak dibatasi untuk akses perintah/kontrol yang lebih luas, lalu pangkas
akses dengan `tools.allow` / `tools.deny` saat diperlukan.
</Note>

`coding` menyertakan alat web ringan (`web_search`, `web_fetch`, `x_search`)
tetapi bukan alat kontrol browser penuh. Otomasi browser dapat mengendalikan
sesi nyata dan profil yang sudah login, jadi tambahkan secara eksplisit dengan
`tools.alsoAllow: ["browser"]` atau per agen
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Mengonfigurasi `tools.exec` atau `tools.fs` di bawah profil restriktif (`messaging`, `minimal`) tidak secara implisit memperluas allowlist profil tersebut. Tambahkan entri `tools.alsoAllow` eksplisit (misalnya `["exec", "process"]` untuk exec, atau `["read", "write", "edit"]` untuk fs) ketika Anda ingin profil restriktif menggunakan bagian yang dikonfigurasi tersebut. OpenClaw mencatat peringatan startup ketika bagian konfigurasi ada tanpa pemberian `alsoAllow` yang cocok.
</Note>

Profil `coding` dan `messaging` juga mengizinkan alat MCP bundle yang dikonfigurasi
di bawah kunci Plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` ketika Anda
ingin profil mempertahankan bawaan normalnya tetapi menyembunyikan semua alat MCP yang dikonfigurasi.
Profil `minimal` tidak menyertakan alat MCP bundle.

Contoh (permukaan alat terluas secara default):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grup alat

Gunakan singkatan `group:*` dalam daftar izinkan/tolak:

| Grup               | Alat                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` diterima sebagai alias untuk `exec`)                                |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas saat Plugin Canvas bawaan diaktifkan                                                      |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Semua alat bawaan OpenClaw (tidak termasuk alat Plugin)                                                   |

`sessions_history` mengembalikan tampilan ingatan yang dibatasi dan disaring demi keamanan. Ini menghapus
tag pemikiran, kerangka `<relevant-memories>`, muatan XML pemanggilan alat teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong),
kerangka pemanggilan alat yang diturunkan, token kontrol model ASCII/lebar-penuh yang bocor,
serta XML pemanggilan alat MiniMax yang salah bentuk dari teks asisten, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris berukuran terlalu besar alih-alih bertindak
sebagai dump transkrip mentah.

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
