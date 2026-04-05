---
read_when:
    - Anda ingin memahami tool apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak tool
    - Anda sedang memutuskan antara tool bawaan, Skills, dan plugin
summary: 'Ikhtisar tool dan plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Tool dan Plugin
x-i18n:
    generated_at: "2026-04-05T14:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Tool dan Plugin

Semua yang dilakukan agen di luar menghasilkan teks terjadi melalui **tool**.
Tool adalah cara agen membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Tool, Skills, dan plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Tool adalah yang dipanggil agen">
    Tool adalah fungsi typed yang dapat dipanggil agen (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyediakan sekumpulan **tool bawaan** dan
    plugin dapat mendaftarkan tool tambahan.

    Agen melihat tool sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajarkan agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke system prompt.
    Skills memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan tool secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau dikirim di dalam plugin.

    [Referensi Skills](/tools/skills) | [Membuat Skills](/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya menjadi satu">
    Plugin adalah package yang dapat mendaftarkan kombinasi kapabilitas apa pun:
    channel, provider model, tool, Skills, speech, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    pengambilan web, pencarian web, dan lainnya. Beberapa plugin adalah **core** (dikirim bersama
    OpenClaw), yang lain adalah **external** (dipublikasikan di npm oleh komunitas).

    [Instal dan konfigurasi plugin](/tools/plugin) | [Bangun plugin Anda sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Tool bawaan

Tool ini disertakan dengan OpenClaw dan tersedia tanpa menginstal plugin apa pun:

| Tool                                       | Fungsinya                                                          | Halaman                                 |
| ------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------- |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang        | [Exec](/tools/exec)                     |
| `code_execution`                           | Menjalankan analisis Python jarak jauh dalam sandbox               | [Code Execution](/tools/code-execution) |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, tangkapan layar)      | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari postingan X, mengambil konten halaman      | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | I/O file di workspace                                              |                                         |
| `apply_patch`                              | Patch file multi-hunk                                              | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Mengirim pesan ke semua channel                                    | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Mengendalikan node Canvas (present, eval, snapshot)                |                                         |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang telah dipasangkan         |                                         |
| `cron` / `gateway`                         | Mengelola pekerjaan terjadwal; memeriksa, mem-patch, memulai ulang, atau memperbarui gateway |                                         |
| `image` / `image_generate`                 | Menganalisis atau membuat gambar                                   |                                         |
| `tts`                                      | Konversi text-to-speech satu kali                                  | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agent                   | [Sub-agents](/tools/subagents)          |
| `session_status`                           | Readback bergaya `/status` yang ringan dan override model sesi     | [Session Tools](/id/concepts/session-tool) |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lainnya, konfigurasikan auth/API key provider tersebut terlebih dahulu.

`session_status` adalah tool status/readback ringan dalam grup sessions.
Tool ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, tool ini dapat mengisi kembali penghitung token/cache yang jarang
dan label model runtime aktif dari entri usage transkrip terbaru.

`gateway` adalah tool runtime khusus pemilik untuk operasi gateway:

- `config.schema.lookup` untuk satu subtree config dengan scope path sebelum edit
- `config.get` untuk snapshot config saat ini + hash
- `config.patch` untuk pembaruan config parsial dengan restart
- `config.apply` hanya untuk penggantian config penuh
- `update.run` untuk self-update eksplisit + restart

Untuk perubahan parsial, pilih `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya saat Anda memang sengaja mengganti seluruh config.
Tool ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias legacy `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Tool yang disediakan plugin

Plugin dapat mendaftarkan tool tambahan. Beberapa contoh:

- [Lobster](/tools/lobster) — runtime alur kerja typed dengan persetujuan yang dapat dilanjutkan
- [LLM Task](/tools/llm-task) — langkah LLM hanya-JSON untuk output terstruktur
- [Diffs](/tools/diffs) — penampil dan perender diff
- [OpenProse](/id/prose) — orkestrasi alur kerja markdown-first

## Konfigurasi tool

### Daftar izin dan penolakan

Kontrol tool mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` di
config. Deny selalu menang atas allow.

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

| Profile     | Yang termasuk di dalamnya                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `full`      | Tanpa pembatasan (sama seperti tidak disetel)                                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                  |
| `minimal`   | Hanya `session_status`                                                                                      |

### Grup tool

Gunakan singkatan `group:*` di daftar allow/deny:

| Group              | Tool                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` diterima sebagai alias untuk `exec`)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Semua tool bawaan OpenClaw (tidak termasuk tool plugin)                                                   |

`sessions_history` mengembalikan tampilan recall yang dibatasi dan difilter demi keamanan. Tool ini menghapus
tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call
teks biasa (termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width
yang bocor, dan XML tool-call MiniMax yang malformed dari teks asisten, lalu menerapkan
redaksi/pemotongan serta placeholder kemungkinan baris terlalu besar alih-alih
bertindak sebagai dump transkrip mentah.

### Pembatasan spesifik provider

Gunakan `tools.byProvider` untuk membatasi tool pada provider tertentu tanpa
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
