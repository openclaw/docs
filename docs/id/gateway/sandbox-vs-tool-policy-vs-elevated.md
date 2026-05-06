---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa alat diblokir: runtime sandbox, kebijakan izinkan/tolak alat, dan gerbang exec dengan hak akses yang ditingkatkan'
title: Lingkungan terisolasi vs kebijakan alat vs hak istimewa yang ditingkatkan
x-i18n:
    generated_at: "2026-05-06T09:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw memiliki tiga kontrol yang terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana alat berjalan** (backend sandbox vs host).
2. **Kebijakan alat** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **alat mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalan keluar khusus exec** untuk berjalan di luar sandbox saat Anda berada dalam sandbox (`gateway` secara default, atau `node` saat target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan pemeriksa untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ini mencetak:

- mode/cakupan/akses workspace sandbox yang efektif
- apakah sesi saat ini berada dalam sandbox (main vs non-main)
- allow/deny alat sandbox yang efektif (dan apakah berasal dari agen/global/default)
- gate elevated dan jalur kunci perbaikan

## Sandbox: tempat alat berjalan

Sandboxing dikontrol oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-main yang berada dalam sandbox (sumber "kejutan" umum untuk grup/channel).
- `"all"`: semuanya berada dalam sandbox.

Lihat [Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap (cakupan, mount workspace, image).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount terlihat di dalam container dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya adalah read-write jika Anda menghilangkan mode; lebih baik gunakan `:ro` untuk source/secret.
- `scope: "shared"` mengabaikan bind per agen (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada jalur sumber yang sudah dinormalisasi, lalu sekali lagi setelah me-resolve melalui ancestor terdalam yang sudah ada. Escape melalui symlink-parent tidak melewati pemeriksaan blocked-path atau allowed-root.
- Jalur leaf yang belum ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` di-resolve melalui parent symlink ke jalur yang diblokir atau ke luar allowed root yang dikonfigurasi, bind akan ditolak.
- Mem-bind `/var/run/docker.sock` secara efektif memberikan kontrol host ke sandbox; lakukan ini hanya secara sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) independen dari mode bind.

## Kebijakan alat: alat mana yang ada/dapat dipanggil

Ada dua lapisan yang penting:

- **Profil alat**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil alat penyedia**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan alat global/per agen**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan alat penyedia**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan alat sandbox** (hanya berlaku saat berada dalam sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Aturan praktis:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan alat adalah penghenti keras: `/exec` tidak dapat mengesampingkan alat `exec` yang ditolak.
- `/exec` hanya mengubah default sesi untuk pengirim yang berwenang; ini tidak memberikan akses alat.
  Kunci alat penyedia menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

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
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: semua alat bawaan OpenClaw (tidak termasuk Plugin penyedia)

## Elevated: khusus exec "jalankan di host"

Elevated **tidak** memberikan alat tambahan; ini hanya memengaruhi `exec`.

- Jika Anda berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (approval mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati approval exec untuk sesi tersebut.
- Jika Anda sudah berjalan langsung, elevated secara efektif tidak melakukan apa-apa (tetap melalui gate).
- Elevated **tidak** dibatasi cakupan Skills dan **tidak** mengesampingkan allow/deny alat.
- Elevated tidak memberikan override lintas-host arbitrer dari `host=auto`; ini mengikuti aturan target exec normal dan hanya mempertahankan `node` saat target yang dikonfigurasi/sesi sudah `node`.
- `/exec` terpisah dari elevated. Ini hanya menyesuaikan default exec per sesi untuk pengirim yang berwenang.

Gate:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Mode Elevated](/id/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Alat X diblokir oleh kebijakan alat sandbox"

Kunci perbaikan (pilih salah satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per agen `agents.list[].sandbox.mode=off`)
- Izinkan alat di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per agen `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau allow per agen)

### "Saya kira ini main, mengapa ini berada dalam sandbox?"

Dalam mode `"non-main"`, kunci grup/channel _bukan_ main. Gunakan kunci sesi main (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, cakupan, backend, image)
- [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- override per agen dan presedensi
- [Mode Elevated](/id/tools/elevated)
