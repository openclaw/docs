---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa alat diblokir: runtime sandbox, kebijakan allow/deny alat, dan gerbang exec elevated'
title: Sandbox vs kebijakan alat vs elevated
x-i18n:
    generated_at: "2026-04-24T09:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw memiliki tiga kontrol yang saling terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana alat berjalan** (backend sandbox vs host).
2. **Kebijakan alat** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **alat mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalur keluar khusus exec** untuk berjalan di luar sandbox saat Anda berada di sandbox (`gateway` secara default, atau `node` saat target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan inspector untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Perintah ini mencetak:

- mode/scope/workspace access sandbox efektif
- apakah sesi saat ini sedang tersandbox (main vs non-main)
- allow/deny alat sandbox efektif (dan apakah berasal dari agent/global/default)
- gerbang elevated dan path kunci perbaikan

## Sandbox: tempat alat berjalan

Sandboxing dikendalikan oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-main yang tersandbox (sering menjadi “kejutan” untuk grup/saluran).
- `"all"`: semuanya tersandbox.

Lihat [Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap (scope, mount workspace, gambar).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount akan terlihat di dalam container dengan mode yang Anda setel (`:ro` atau `:rw`).
- Default-nya read-write jika Anda tidak menyebutkan mode; pilih `:ro` untuk source/secret.
- `scope: "shared"` mengabaikan bind per-agen (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada path sumber yang dinormalisasi, lalu lagi setelah menyelesaikannya melalui ancestor terdalam yang ada. Escape parent symlink tidak dapat melewati pemeriksaan path yang diblokir atau root yang diizinkan.
- Path leaf yang tidak ada pun tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` diselesaikan melalui parent bersymlink ke path yang diblokir atau di luar root yang diizinkan yang dikonfigurasi, bind akan ditolak.
- Mengikat `/var/run/docker.sock` secara efektif memberikan kontrol host ke sandbox; lakukan hanya dengan sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) bersifat independen dari mode bind.

## Kebijakan alat: alat mana yang ada/dapat dipanggil

Dua lapisan yang penting:

- **Profil alat**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil alat provider**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan alat global/per-agen**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan alat provider**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan alat sandbox** (hanya berlaku saat tersandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Patokan umum:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan alat adalah penghentian keras: `/exec` tidak dapat meng-override alat `exec` yang ditolak.
- `/exec` hanya mengubah default sesi untuk pengirim yang diotorisasi; perintah ini tidak memberikan akses alat.
  Kunci alat provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

### Grup alat (singkatan)

Kebijakan alat (global, agen, sandbox) mendukung entri `group:*` yang berkembang menjadi beberapa alat:

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
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: semua alat bawaan OpenClaw (tidak termasuk plugin provider)

## Elevated: exec-only "jalan di host"

Elevated **tidak** memberikan alat tambahan; ini hanya memengaruhi `exec`.

- Jika Anda tersandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (persetujuan mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati persetujuan exec untuk sesi tersebut.
- Jika Anda sudah berjalan langsung, elevated pada dasarnya adalah no-op (tetap dibatasi).
- Elevated **bukan** scoped ke skill dan **tidak** meng-override allow/deny alat.
- Elevated tidak memberikan override lintas host sembarang dari `host=auto`; elevated mengikuti aturan target exec normal dan hanya mempertahankan `node` ketika target yang dikonfigurasi/sesi memang sudah `node`.
- `/exec` terpisah dari elevated. Perintah ini hanya menyesuaikan default exec per sesi untuk pengirim yang diotorisasi.

Gerbang:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Mode Elevated](/id/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Alat X diblokir oleh kebijakan alat sandbox"

Kunci perbaikan (pilih satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per-agen `agents.list[].sandbox.mode=off`)
- Izinkan alat di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per-agen `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau allow per-agen)

### "Saya kira ini main, kenapa malah tersandbox?"

Dalam mode `"non-main"`, kunci grup/saluran _bukan_ main. Gunakan kunci sesi main (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, scope, backend, gambar)
- [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agen dan prioritas
- [Mode Elevated](/id/tools/elevated)
