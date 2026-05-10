---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa sebuah alat diblokir: lingkungan eksekusi sandbox, kebijakan izinkan/tolak alat, dan gerbang eksekusi dengan hak tinggi'
title: Sandbox vs kebijakan alat vs hak istimewa yang ditingkatkan
x-i18n:
    generated_at: "2026-05-10T19:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw memiliki tiga kontrol terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana tool dijalankan** (backend sandbox vs host).
2. **Kebijakan tool** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **tool mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalan keluar khusus `exec`** untuk menjalankan di luar sandbox saat Anda berada dalam sandbox (`gateway` secara default, atau `node` saat target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan inspector untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ini mencetak:

- mode/cakupan sandbox/akses workspace efektif
- apakah sesi saat ini berada dalam sandbox (main vs non-main)
- allow/deny tool sandbox efektif (dan apakah berasal dari agent/global/default)
- gerbang elevated dan path kunci perbaikan

## Sandbox: tempat tool dijalankan

Sandboxing dikontrol oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-main yang berada dalam sandbox ("kejutan" umum untuk grup/channel).
- `"all"`: semuanya berada dalam sandbox.

Lihat [Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap (cakupan, mount workspace, image).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount terlihat di dalam container dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya adalah read-write jika Anda menghilangkan mode; pilih `:ro` untuk source/secret.
- `scope: "shared"` mengabaikan bind per-agent (hanya bind global yang berlaku).
- OpenClaw memvalidasi source bind dua kali: pertama pada path source yang dinormalisasi, lalu lagi setelah resolve melalui ancestor terdalam yang ada. Escape melalui parent symlink tidak melewati pemeriksaan path yang diblokir atau root yang diizinkan.
- Path leaf yang tidak ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` resolve melalui parent symlink ke path yang diblokir atau ke luar root yang diizinkan yang dikonfigurasi, bind ditolak.
- Binding `/var/run/docker.sock` secara efektif menyerahkan kontrol host ke sandbox; lakukan ini hanya dengan sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) independen dari mode bind.

## Kebijakan tool: tool mana yang ada/dapat dipanggil

Dua lapisan penting:

- **Profil tool**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil tool provider**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan tool global/per-agent**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan tool provider**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan tool sandbox** (hanya berlaku saat berada dalam sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Aturan praktis:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain diperlakukan sebagai diblokir.
- Kebijakan tool adalah penghentian keras: `/exec` tidak dapat menimpa tool `exec` yang ditolak.
- Kebijakan tool memfilter ketersediaan tool berdasarkan nama; kebijakan ini tidak memeriksa efek samping di dalam `exec`. Jika `exec` diizinkan, menolak `write`, `edit`, atau `apply_patch` tidak membuat perintah shell menjadi read-only.
- `/exec` hanya mengubah default sesi untuk pengirim yang berwenang; ini tidak memberikan akses tool.
  Kunci tool provider menerima `provider` (mis. `google-antigravity`) atau `provider/model` (mis. `openai/gpt-5.4`).

### Grup tool (singkatan)

Kebijakan tool (global, agent, sandbox) mendukung entri `group:*` yang diekspansi menjadi beberapa tool:

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
  Untuk agent read-only, tolak `group:runtime` serta tool filesystem yang memutasi kecuali kebijakan filesystem sandbox atau batas host terpisah memberlakukan batasan read-only.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: semua tool bawaan OpenClaw (tidak mencakup Plugin provider)

## Elevated: "jalankan di host" khusus exec

Elevated **tidak** memberikan tool tambahan; ini hanya memengaruhi `exec`.

- Jika Anda berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (approval mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati approval exec untuk sesi.
- Jika Anda sudah berjalan langsung, elevated secara efektif tidak melakukan apa pun (tetap melalui gerbang).
- Elevated **tidak** ber-cakupan skill dan **tidak** menimpa allow/deny tool.
- Elevated tidak memberikan override lintas-host arbitrer dari `host=auto`; ini mengikuti aturan target exec normal dan hanya mempertahankan `node` saat target yang dikonfigurasi/sesi sudah `node`.
- `/exec` terpisah dari elevated. Ini hanya menyesuaikan default exec per-sesi untuk pengirim yang berwenang.

Gerbang:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Mode Elevated](/id/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Tool X diblokir oleh kebijakan tool sandbox"

Kunci perbaikan (pilih satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per-agent `agents.list[].sandbox.mode=off`)
- Izinkan tool di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per-agent `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau allow per-agent)

### "Saya kira ini main, mengapa berada dalam sandbox?"

Dalam mode `"non-main"`, kunci grup/channel _bukan_ main. Gunakan kunci sesi main (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, cakupan, backend, image)
- [Sandbox & Tool Multi-Agent](/id/tools/multi-agent-sandbox-tools) -- override per-agent dan presedensi
- [Mode Elevated](/id/tools/elevated)
