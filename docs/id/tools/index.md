---
read_when:
    - Anda ingin memahami tool apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak tool
    - Anda sedang memutuskan antara tool bawaan, Skills, dan Plugin
summary: 'Ikhtisar tool dan Plugin OpenClaw: apa yang dapat dilakukan agent dan cara memperluasnya'
title: Tool dan Plugin
x-i18n:
    generated_at: "2026-04-26T11:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Semua yang dilakukan agent di luar menghasilkan teks terjadi melalui **tool**.
Tool adalah cara agent membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Tool, Skills, dan Plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Tool adalah yang dipanggil agent">
    Tool adalah fungsi bertipe yang dapat dipanggil agent (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyediakan sekumpulan **tool bawaan** dan
    Plugin dapat mendaftarkan tool tambahan.

    Agent melihat tool sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajarkan agent kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disisipkan ke system prompt.
    Skills memberi agent konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan tool secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau disertakan di dalam Plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat Skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya menjadi satu">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kemampuan apa pun:
    channel, provider model, tool, Skills, suara, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    web fetch, web search, dan lainnya. Beberapa Plugin bersifat **inti** (disertakan dengan
    OpenClaw), yang lain bersifat **eksternal** (diterbitkan di npm oleh komunitas).

    [Instal dan konfigurasi Plugin](/id/tools/plugin) | [Bangun Plugin Anda sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Tool bawaan

Tool ini disertakan dengan OpenClaw dan tersedia tanpa menginstal Plugin apa pun:

| Tool                                       | Fungsinya                                                             | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python remote yang di-sandbox                    | [Code Execution](/id/tools/code-execution)                      |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, tangkapan layar)         | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Menelusuri web, menelusuri postingan X, mengambil konten halaman      | [Web](/id/tools/web), [Web Fetch](/id/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/id/tools/apply-patch)                            |
| `message`                                  | Mengirim pesan ke semua channel                                       | [Agent Send](/id/tools/agent-send)                              |
| `canvas`                                   | Mengendalikan node Canvas (present, eval, snapshot)                   |                                                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipasangkan                  |                                                              |
| `cron` / `gateway`                         | Mengelola pekerjaan terjadwal; memeriksa, mem-patch, memulai ulang, atau memperbarui gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau membuat gambar                                      | [Image Generation](/id/tools/image-generation)                  |
| `music_generate`                           | Membuat trek musik                                                    | [Music Generation](/id/tools/music-generation)                  |
| `video_generate`                           | Membuat video                                                         | [Video Generation](/id/tools/video-generation)                  |
| `tts`                                      | Konversi text-to-speech sekali jalan                                  | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agent                      | [Sub-agents](/id/tools/subagents)                               |
| `session_status`                           | Pembacaan ulang ringan bergaya `/status` dan override model sesi      | [Tool Sesi](/id/concepts/session-tool)                          |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lainnya, konfigurasikan auth/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau provider musik non-default lainnya, konfigurasikan auth/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau provider video non-default lainnya, konfigurasikan auth/kunci API provider tersebut terlebih dahulu.

Untuk pembuatan audio berbasis workflow, gunakan `music_generate` saat sebuah Plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan text-to-speech.

`session_status` adalah tool status/pembacaan ulang ringan dalam grup sesi.
Tool ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, tool ini dapat mengisi balik penghitung token/cache yang jarang ada dan
label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah tool runtime khusus pemilik untuk operasi gateway:

- `config.schema.lookup` untuk satu subtree konfigurasi yang dibatasi path sebelum pengeditan
- `config.get` untuk snapshot konfigurasi saat ini + hash
- `config.patch` untuk pembaruan konfigurasi parsial dengan restart
- `config.apply` hanya untuk penggantian konfigurasi penuh
- `update.run` untuk pembaruan mandiri eksplisit + restart

Untuk perubahan parsial, utamakan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya saat Anda memang berniat mengganti seluruh konfigurasi.
Untuk dokumentasi konfigurasi yang lebih luas, baca [Konfigurasi](/id/gateway/configuration) dan
[Referensi konfigurasi](/id/gateway/configuration-reference).
Tool ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Tool yang disediakan Plugin

Plugin dapat mendaftarkan tool tambahan. Beberapa contohnya:

- [Diffs](/id/tools/diffs) — penampil dan perender diff
- [LLM Task](/id/tools/llm-task) — langkah LLM khusus JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime workflow bertipe dengan persetujuan yang dapat dilanjutkan kembali
- [Music Generation](/id/tools/music-generation) — tool bersama `music_generate` dengan provider berbasis workflow
- [OpenProse](/id/prose) — orkestrasi workflow yang mengutamakan markdown
- [Tokenjuice](/id/tools/tokenjuice) — hasil tool `exec` dan `bash` yang ringkas dan tidak bising

## Konfigurasi tool

### Daftar izinkan dan tolak

Kontrol tool mana yang dapat dipanggil agent melalui `tools.allow` / `tools.deny` di
konfigurasi. Penolakan selalu menang atas izin.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw gagal secara tertutup saat allowlist eksplisit tidak menghasilkan tool yang dapat dipanggil.
Misalnya, `tools.allow: ["query_db"]` hanya berfungsi jika Plugin yang dimuat benar-benar
mendaftarkan `query_db`. Jika tidak ada tool bawaan, Plugin, atau MCP bawaan yang cocok dengan
allowlist, proses berhenti sebelum pemanggilan model alih-alih melanjutkan sebagai proses
hanya-teks yang dapat berhalusinasi hasil tool.

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per-agent: `agents.list[].tools.profile`.

| Profil      | Yang dicakup                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tidak ada pembatasan (sama seperti tidak disetel)                                                                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Hanya `session_status`                                                                                                                            |

`coding` mencakup tool web ringan (`web_search`, `web_fetch`, `x_search`)
tetapi tidak mencakup tool kontrol browser penuh. Otomasi browser dapat mengendalikan sesi nyata
dan profil yang sudah login, jadi tambahkan secara eksplisit dengan
`tools.alsoAllow: ["browser"]` atau
`agents.list[].tools.alsoAllow: ["browser"]` per-agent.

Profil `coding` dan `messaging` juga mengizinkan tool MCP bawaan yang telah dikonfigurasi
di bawah kunci Plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` saat Anda
ingin sebuah profil tetap mempertahankan tool bawaan normalnya tetapi menyembunyikan semua tool MCP yang telah dikonfigurasi.
Profil `minimal` tidak mencakup tool MCP bawaan.

### Grup tool

Gunakan singkatan `group:*` dalam daftar allow/deny:

| Grup               | Tool                                                                                                      |
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
| `group:openclaw`   | Semua tool bawaan OpenClaw (tidak termasuk tool Plugin)                                                   |

`sessions_history` mengembalikan tampilan recall terbatas yang difilter demi keamanan. Tool ini menghapus
thinking tag, scaffolding `<relevant-memories>`, payload XML pemanggilan tool
teks biasa (termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok pemanggilan tool yang terpotong),
scaffolding pemanggilan tool yang diturunkan, token kontrol model ASCII/full-width yang bocor,
serta XML pemanggilan tool MiniMax yang malformed dari teks assistant, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris yang terlalu besar alih-alih bertindak
sebagai dump transkrip mentah.

### Pembatasan khusus provider

Gunakan `tools.byProvider` untuk membatasi tool bagi provider tertentu tanpa
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
