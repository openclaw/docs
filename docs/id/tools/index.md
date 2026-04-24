---
read_when:
    - Anda ingin memahami tool apa yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak tool
    - Anda sedang memutuskan antara tool bawaan, skill, dan Plugin
summary: 'Ikhtisar tool dan Plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Tools dan Plugin
x-i18n:
    generated_at: "2026-04-24T09:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Semua hal yang dilakukan agen selain menghasilkan teks terjadi melalui **tool**.
Tool adalah cara agen membaca file, menjalankan perintah, menjelajah web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Tool, skill, dan Plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Tool adalah apa yang dipanggil agen">
    Tool adalah fungsi bertipe yang dapat dipanggil agen (mis. `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyertakan sekumpulan **tool bawaan** dan
    Plugin dapat mendaftarkan tool tambahan.

    Agen melihat tool sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skill mengajarkan agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke system prompt.
    Skill memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan tool secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau dikirim di dalam Plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat skill](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya bersama">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kemampuan apa pun:
    channel, provider model, tool, skill, speech, transkripsi realtime,
    voice realtime, pemahaman media, generasi gambar, generasi video,
    web fetch, web search, dan lainnya. Beberapa Plugin bersifat **core** (dikirim bersama
    OpenClaw), lainnya **eksternal** (diterbitkan di npm oleh komunitas).

    [Instal dan konfigurasi Plugin](/id/tools/plugin) | [Bangun milik Anda sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Tool bawaan

Tool ini dikirim bersama OpenClaw dan tersedia tanpa menginstal Plugin apa pun:

| Tool                                       | Fungsinya                                                             | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python remote yang di-sandbox                    | [Code Execution](/id/tools/code-execution)                      |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, screenshot)             | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari post X, mengambil konten halaman             | [Web](/id/tools/web), [Web Fetch](/id/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/id/tools/apply-patch)                            |
| `message`                                  | Mengirim pesan ke semua channel                                       | [Kirim Agen](/id/tools/agent-send)                              |
| `canvas`                                   | Menggerakkan Canvas node (present, eval, snapshot)                    |                                                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipairing                    |                                                              |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, menambal, me-restart, atau memperbarui Gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau menghasilkan gambar                                 | [Generasi Gambar](/id/tools/image-generation)                   |
| `music_generate`                           | Menghasilkan trek musik                                               | [Generasi Musik](/id/tools/music-generation)                    |
| `video_generate`                           | Menghasilkan video                                                    | [Generasi Video](/id/tools/video-generation)                    |
| `tts`                                      | Konversi teks-ke-suara sekali jalan                                   | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agen                       | [Sub-agents](/id/tools/subagents)                               |
| `session_status`                           | Pembacaan ulang ringan ala `/status` dan override model sesi          | [Tool Sesi](/id/concepts/session-tool)                          |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk generasi atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lainnya, konfigurasikan auth/API key provider itu terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau provider musik non-default lainnya, konfigurasikan auth/API key provider itu terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau provider video non-default lainnya, konfigurasikan auth/API key provider itu terlebih dahulu.

Untuk generasi audio berbasis alur kerja, gunakan `music_generate` ketika Plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan text-to-speech.

`session_status` adalah tool status/pembacaan ulang ringan dalam grup sesi.
Tool ini menjawab pertanyaan ala `/status` tentang sesi saat ini dan dapat
secara opsional menyetel override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, tool ini dapat mengisi ulang penghitung token/cache yang jarang dan label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah tool runtime khusus pemilik untuk operasi Gateway:

- `config.schema.lookup` untuk satu subtree konfigurasi bercakupan path sebelum edit
- `config.get` untuk snapshot + hash konfigurasi saat ini
- `config.patch` untuk pembaruan konfigurasi parsial dengan restart
- `config.apply` hanya untuk penggantian konfigurasi penuh
- `update.run` untuk self-update + restart yang eksplisit

Untuk perubahan parsial, pilih `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya ketika Anda memang berniat mengganti seluruh konfigurasi.
Tool ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalkan ke path exec terlindung yang sama.

### Tool yang disediakan Plugin

Plugin dapat mendaftarkan tool tambahan. Beberapa contoh:

- [Diffs](/id/tools/diffs) — penampil dan renderer diff
- [LLM Task](/id/tools/llm-task) — langkah LLM khusus JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime alur kerja bertipe dengan persetujuan yang dapat dilanjutkan
- [Generasi Musik](/id/tools/music-generation) — tool `music_generate` bersama dengan provider berbasis alur kerja
- [OpenProse](/id/prose) — orkestrasi alur kerja markdown-first
- [Tokenjuice](/id/tools/tokenjuice) — hasil tool `exec` dan `bash` yang ringkas dari keluaran berisik

## Konfigurasi tool

### Daftar izin dan tolak

Kontrol tool mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` di
konfigurasi. Tolak selalu menang atas izin.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per agen: `agents.list[].tools.profile`.

| Profile     | Yang termasuk                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tidak ada pembatasan (sama seperti tidak disetel)                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | hanya `session_status`                                                                                                                             |

Profil `coding` dan `messaging` juga mengizinkan tool MCP bundle yang dikonfigurasi
di bawah kunci Plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` saat Anda
ingin profil mempertahankan built-in normalnya tetapi menyembunyikan semua tool MCP yang dikonfigurasi.
Profil `minimal` tidak mencakup tool MCP bundle.

### Grup tool

Gunakan singkatan `group:*` di daftar allow/deny:

| Group              | Tools                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` diterima sebagai alias untuk `exec`)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                           |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                |
| `group:web`        | web_search, x_search, web_fetch                                                                          |
| `group:ui`         | browser, canvas                                                                                          |
| `group:automation` | cron, gateway                                                                                            |
| `group:messaging`  | message                                                                                                  |
| `group:nodes`      | nodes                                                                                                    |
| `group:agents`     | agents_list                                                                                              |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                               |
| `group:openclaw`   | Semua tool bawaan OpenClaw (tidak termasuk tool Plugin)                                                  |

`sessions_history` mengembalikan tampilan recall yang dibatasi dan difilter demi keamanan. Tool ini menghapus
tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model
ASCII/full-width yang bocor, dan XML tool-call MiniMax yang malform dari teks asisten, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris yang terlalu besar alih-alih
bertindak sebagai dump transkrip mentah.

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
