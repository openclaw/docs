---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa sebuah alat diblokir: runtime sandbox, kebijakan izinkan/tolak alat, dan gerbang eksekusi dengan elevasi'
title: Sandbox vs kebijakan alat vs akses yang ditingkatkan
x-i18n:
    generated_at: "2026-06-27T17:33:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw memiliki tiga kontrol terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana alat berjalan** (backend sandbox vs host).
2. **Kebijakan alat** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **alat mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalan keluar khusus exec** untuk berjalan di luar sandbox saat Anda berada dalam sandbox (`gateway` secara default, atau `node` saat target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan inspector untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ini mencetak:

- mode/cakupan/akses workspace sandbox efektif
- apakah sesi saat ini berada dalam sandbox (main vs non-main)
- izin/tolak alat sandbox efektif (dan apakah berasal dari agen/global/default)
- gate elevated dan jalur kunci perbaikannya

## Sandbox: tempat alat berjalan

Sandboxing dikendalikan oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-main yang berada dalam sandbox (kejutan umum untuk grup/channel).
- `"all"`: semuanya berada dalam sandbox.

Lihat [Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap (cakupan, mount workspace, image).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount terlihat di dalam container dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya read-write jika Anda menghilangkan mode; lebih baik gunakan `:ro` untuk source/secrets.
- `scope: "shared"` mengabaikan bind per agen (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada jalur sumber yang telah dinormalisasi, lalu sekali lagi setelah menyelesaikan melalui ancestor terdalam yang ada. Escape melalui parent symlink tidak melewati pemeriksaan jalur yang diblokir atau root yang diizinkan.
- Jalur leaf yang tidak ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` diselesaikan melalui parent symlink ke jalur yang diblokir atau di luar root yang diizinkan yang dikonfigurasi, bind ditolak.
- Mengikat `/var/run/docker.sock` secara efektif menyerahkan kontrol host ke sandbox; lakukan ini hanya secara sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) independen dari mode bind.

## Kebijakan alat: alat mana yang ada/dapat dipanggil

Dua lapisan penting:

- **Profil alat**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil alat provider**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan alat global/per agen**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan alat provider**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan alat sandbox** (hanya berlaku saat berada dalam sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Aturan praktis:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan alat adalah penghentian keras: `/exec` tidak dapat menimpa alat `exec` yang ditolak.
- Kebijakan alat memfilter ketersediaan alat berdasarkan nama; ini tidak memeriksa efek samping di dalam `exec`. Jika `exec` diizinkan, menolak `write`, `edit`, atau `apply_patch` tidak membuat perintah shell menjadi read-only.
- `/exec` hanya mengubah default sesi untuk pengirim yang diotorisasi; ini tidak memberikan akses alat.
  Kunci alat provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).
- Log Gateway menyertakan entri audit `agents/tool-policy` saat langkah kebijakan alat menghapus alat atau kebijakan alat sandbox memblokir panggilan. Gunakan `openclaw logs` untuk melihat label aturan, kunci konfigurasi, dan nama alat yang terdampak.

### Grup alat (singkatan)

Kebijakan alat (global, agen, sandbox) mendukung entri `group:*` yang diperluas menjadi beberapa alat:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grup yang tersedia:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` diterima sebagai
  alias untuk `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Untuk agen read-only, tolak `group:runtime` serta alat filesystem yang memutasi kecuali kebijakan filesystem sandbox atau batas host terpisah menegakkan batasan read-only.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: semua alat bawaan OpenClaw (tidak termasuk Plugin provider)
- `group:plugins`: semua alat milik plugin yang dimuat, termasuk server MCP yang dikonfigurasi dan diekspos melalui `bundle-mcp`

Untuk server MCP dalam sandbox, kebijakan alat sandbox adalah gate izin kedua. Jika `mcp.servers` dikonfigurasi tetapi giliran dalam sandbox hanya menampilkan alat bawaan, tambahkan `bundle-mcp`, `group:plugins`, atau nama/glob alat MCP berprefiks server seperti `outlook__send_mail` atau `outlook__*` ke `tools.sandbox.tools.alsoAllow`, lalu mulai ulang/muat ulang gateway dan ambil ulang daftar alat. Glob server menggunakan prefiks server MCP yang aman untuk provider: karakter non-`[A-Za-z0-9_-]` menjadi `-`, nama yang tidak diawali huruf mendapatkan prefiks `mcp-`, dan prefiks yang panjang atau duplikat dapat dipotong atau diberi sufiks.

`openclaw doctor` saat ini memeriksa bentuk ini untuk server yang dikelola OpenClaw di `mcp.servers`. Server MCP yang dimuat dari manifes plugin bawaan atau Claude `.mcp.json` menggunakan gate sandbox yang sama, tetapi diagnostik ini belum menginventarisasi sumber tersebut; gunakan entri allowlist yang sama jika alatnya hilang dalam giliran yang berada dalam sandbox.

## Elevated: "berjalan di host" khusus exec

Elevated **tidak** memberikan alat tambahan; ini hanya memengaruhi `exec`.

- Jika Anda berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (approval mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati approval exec untuk sesi.
- Jika Anda sudah berjalan langsung, elevated secara efektif tidak melakukan apa-apa (tetap melalui gate).
- Elevated **tidak** bercakupan skill dan **tidak** menimpa allow/deny alat.
- Elevated tidak memberikan override lintas-host arbitrer dari `host=auto`; ini mengikuti aturan target exec normal dan hanya mempertahankan `node` saat target yang dikonfigurasi/sesi sudah `node`.
- `/exec` terpisah dari elevated. Ini hanya menyesuaikan default exec per sesi untuk pengirim yang diotorisasi.

Gate:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Mode Elevated](/id/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Alat X diblokir oleh kebijakan alat sandbox"

Kunci perbaikan (pilih satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per agen `agents.list[].sandbox.mode=off`)
- Izinkan alat di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per agen `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau izin per agen)
- Periksa `openclaw logs` untuk entri `agents/tool-policy`. Entri ini mencatat mode sandbox dan apakah aturan allow atau deny memblokir alat.

### "Saya kira ini main, mengapa berada dalam sandbox?"

Dalam mode `"non-main"`, kunci grup/channel _bukan_ main. Gunakan kunci sesi main (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, cakupan, backend, image)
- [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- override dan presedensi per agen
- [Mode Elevated](/id/tools/elevated)
