---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa sebuah tool diblokir: runtime sandbox, kebijakan allow/deny tool, dan gate exec elevated'
title: Sandbox vs Kebijakan Tool vs Elevated
x-i18n:
    generated_at: "2026-04-05T13:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Kebijakan Tool vs Elevated

OpenClaw memiliki tiga kontrol yang saling terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana tool dijalankan** (Docker vs host).
2. **Kebijakan tool** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **tool mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalur keluar khusus exec** untuk berjalan di luar sandbox saat Anda berada dalam sandbox (`gateway` secara default, atau `node` ketika target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan inspector untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ini menampilkan:

- mode/cakupan/akses workspace sandbox efektif
- apakah sesi saat ini sedang disandbox (main vs non-main)
- allow/deny tool sandbox efektif (dan apakah itu berasal dari agent/global/default)
- gate elevated dan path kunci fix-it

## Sandbox: tempat tool berjalan

Sandboxing dikendalikan oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-main yang disandbox (sering menjadi “kejutan” untuk grup/channel).
- `"all"`: semuanya disandbox.

Lihat [Sandboxing](/gateway/sandboxing) untuk matriks lengkap (cakupan, mount workspace, image).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount akan terlihat di dalam container dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya adalah read-write jika Anda menghilangkan mode; utamakan `:ro` untuk source/secret.
- `scope: "shared"` mengabaikan bind per-agent (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada path sumber yang dinormalkan, lalu lagi setelah resolve melalui ancestor terdalam yang ada. Escape melalui parent symlink tidak melewati pemeriksaan blocked-path atau allowed-root.
- Path leaf yang tidak ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` di-resolve melalui parent yang bersymlink ke path yang diblokir atau di luar allowed roots yang dikonfigurasi, bind akan ditolak.
- Melakukan bind pada `/var/run/docker.sock` secara efektif menyerahkan kontrol host ke sandbox; lakukan ini hanya dengan sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) independen dari mode bind.

## Kebijakan tool: tool mana yang ada/dapat dipanggil

Dua lapisan penting:

- **Profil tool**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil tool penyedia**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan tool global/per-agent**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan tool penyedia**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan tool sandbox** (hanya berlaku saat disandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Aturan praktis:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan tool adalah penghentian tegas: `/exec` tidak dapat menimpa tool `exec` yang ditolak.
- `/exec` hanya mengubah default sesi untuk pengirim yang berwenang; itu tidak memberikan akses tool.
  Kunci tool penyedia menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

### Grup tool (shorthand)

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
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: semua tool OpenClaw bawaan (tidak termasuk plugin penyedia)

## Elevated: "jalankan di host" khusus exec

Elevated **tidak** memberikan tool tambahan; ini hanya memengaruhi `exec`.

- Jika Anda berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (persetujuan mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati persetujuan exec untuk sesi tersebut.
- Jika Anda sudah berjalan langsung, elevated pada dasarnya tidak melakukan apa-apa (tetap digate).
- Elevated **tidak** dicakup oleh skill dan **tidak** menimpa allow/deny tool.
- Elevated tidak memberikan override arbitrer lintas host dari `host=auto`; ini mengikuti aturan target exec normal dan hanya mempertahankan `node` ketika target yang dikonfigurasi/sesi memang sudah `node`.
- `/exec` terpisah dari elevated. Ini hanya menyesuaikan default exec per sesi untuk pengirim yang berwenang.

Gate:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Elevated Mode](/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Tool X diblokir oleh kebijakan tool sandbox"

Kunci fix-it (pilih satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per-agent `agents.list[].sandbox.mode=off`)
- Izinkan tool di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per-agent `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau allow per-agent)

### "Saya kira ini main, kenapa disandbox?"

Dalam mode `"non-main"`, kunci grup/channel _bukan_ main. Gunakan kunci sesi main (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Lihat juga

- [Sandboxing](/gateway/sandboxing) -- referensi sandbox lengkap (mode, cakupan, backend, image)
- [Sandbox & Tools Multi-Agent](/tools/multi-agent-sandbox-tools) -- override per-agent dan prioritas
- [Elevated Mode](/tools/elevated)
