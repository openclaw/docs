---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa suatu alat diblokir: runtime sandbox, kebijakan izin/tolak alat, dan gerbang eksekusi dengan hak istimewa yang ditingkatkan'
title: Sandbox vs kebijakan alat vs hak istimewa yang ditingkatkan
x-i18n:
    generated_at: "2026-07-19T04:57:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 572157b184c48f0ac7f97d3151726f8975b16306261c7209c39c2fdd344efef9
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw memiliki tiga kontrol yang saling terkait tetapi berbeda:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **tempat alat dijalankan** (backend sandbox atau host).
2. **Kebijakan alat** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **alat yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalan keluar khusus exec** untuk menjalankan proses di luar sandbox saat berada dalam sandbox (`gateway` secara default, atau `node` saat target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan pemeriksa untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Perintah ini menampilkan:

- mode/cakupan/akses ruang kerja sandbox yang efektif
- apakah sesi saat ini berada dalam sandbox (utama atau non-utama)
- izin/penolakan alat sandbox yang efektif (dan apakah berasal dari agen/global/default)
- gerbang elevated dan jalur kunci perbaikan

## Sandbox: tempat alat dijalankan

Sandbox dikontrol oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan pada host.
- `"non-main"`: hanya sesi non-utama yang berada dalam sandbox ("kejutan" yang umum untuk grup/saluran).
- `"all"`: semuanya berada dalam sandbox.

`agents.defaults.sandbox.workspaceAccess` mengontrol apa yang dapat dilihat sandbox: `"none"`, `"ro"`, atau `"rw"`.

Lihat [Sandbox](/id/gateway/sandboxing) untuk matriks lengkap (cakupan, mount ruang kerja, image).

### Bind mount (pemeriksaan keamanan cepat)

- `docker.binds` _menembus_ sistem berkas sandbox: apa pun yang Anda mount akan terlihat di dalam kontainer dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya adalah baca-tulis jika mode tidak dicantumkan; utamakan `:ro` untuk sumber/rahasia.
- `scope: "shared"` mengabaikan bind per agen (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada jalur sumber yang telah dinormalisasi, lalu sekali lagi setelah menyelesaikannya melalui leluhur terdalam yang ada. Pelolosan melalui induk symlink tidak dapat melewati pemeriksaan jalur yang diblokir atau root yang diizinkan.
- Jalur leaf yang tidak ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` diselesaikan melalui induk symlink ke jalur yang diblokir atau di luar root yang diizinkan dan dikonfigurasi, bind akan ditolak.
- Melakukan bind pada `/var/run/docker.sock` secara efektif menyerahkan kendali host kepada sandbox; lakukan ini hanya secara sengaja.
- Akses ruang kerja (`workspaceAccess`) tidak bergantung pada mode bind.

Untuk konfigurasi per agen dengan beberapa folder host, mode akses, dan persetujuan eksplisit keamanan sumber eksternal, lihat [Beberapa folder untuk satu agen](/id/gateway/sandboxing#multiple-folders-for-one-agent).

## Kebijakan alat: alat yang tersedia/dapat dipanggil

Ada dua lapisan yang perlu diperhatikan:

- **Profil alat**: `tools.profile` dan `agents.list[].tools.profile` (daftar izin dasar)
- **Profil alat penyedia**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan alat global/per agen**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan alat penyedia**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan alat sandbox** (hanya berlaku saat berada dalam sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Pedoman umum:

- `deny` selalu diprioritaskan.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan alat adalah penghentian mutlak: `/exec` tidak dapat mengesampingkan alat `exec` yang ditolak.
- Kebijakan alat memfilter ketersediaan alat berdasarkan nama; kebijakan ini tidak memeriksa efek samping di dalam `exec`. Jika `exec` diizinkan, menolak `write`, `edit`, atau `apply_patch` tidak membuat perintah shell menjadi hanya-baca.
- `/exec` hanya mengubah default sesi untuk pengirim yang diotorisasi; ini tidak memberikan akses alat.
- Kunci alat penyedia menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).
- Log Gateway menyertakan entri audit `agents/tool-policy` ketika suatu langkah kebijakan alat menghapus alat atau kebijakan alat sandbox memblokir panggilan. Gunakan `openclaw logs` untuk melihat label aturan, kunci konfigurasi, dan nama alat yang terdampak.

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

| Grup               | Alat                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | sebagian besar alat bawaan OpenClaw (tidak termasuk primitif sistem berkas dan runtime `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas`, serta plugin penyedia)                                                                                             |
| `group:plugins`    | semua alat milik plugin yang dimuat, termasuk server MCP terkonfigurasi yang diekspos melalui `bundle-mcp`                                                                                                                                                           |

Untuk agen hanya-baca, tolak `group:runtime` serta alat sistem berkas yang melakukan mutasi, kecuali kebijakan sistem berkas sandbox atau batas host terpisah memberlakukan batasan hanya-baca.

Untuk server MCP dalam sandbox, kebijakan alat sandbox merupakan gerbang izin kedua. Jika `mcp.servers` dikonfigurasi tetapi giliran dalam sandbox hanya menampilkan alat bawaan, tambahkan `bundle-mcp`, `group:plugins`, atau nama/glob alat MCP berprefiks server seperti `outlook__send_mail` atau `outlook__*` ke `tools.sandbox.tools.alsoAllow`, lalu mulai ulang/muat ulang Gateway dan ambil kembali daftar alat. Glob server menggunakan prefiks server MCP yang aman bagi penyedia: karakter non-`[A-Za-z0-9_-]` menjadi `-`, nama yang tidak diawali huruf mendapatkan prefiks `mcp-`, dan prefiks yang panjang atau duplikat dapat dipotong atau diberi sufiks.

`openclaw doctor` saat ini memeriksa bentuk ini untuk server yang dikelola OpenClaw dalam `mcp.servers`. Server MCP yang dimuat dari manifes plugin bawaan atau `.mcp.json` Claude menggunakan gerbang sandbox yang sama, tetapi diagnostik ini belum mencantumkan sumber tersebut; gunakan entri daftar izin yang sama jika alatnya menghilang dalam giliran yang berada dalam sandbox.

## Elevated: "jalankan pada host" khusus exec

Elevated **tidak** memberikan alat tambahan; fitur ini hanya memengaruhi `exec`.

- Jika berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (persetujuan mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati persetujuan exec selama sesi.
- Jika sudah berjalan secara langsung, elevated secara efektif tidak melakukan apa pun (tetap dibatasi oleh gerbang).
- Elevated **tidak** dibatasi menurut skill dan **tidak** mengesampingkan izin/penolakan alat.
- Elevated tidak memberikan penggantian lintas-host sewenang-wenang dari `host=auto`; fitur ini mengikuti aturan target exec normal dan hanya mempertahankan `node` ketika target yang dikonfigurasi/target sesi sudah berupa `node`.
- `/exec` terpisah dari elevated. Ini hanya menyesuaikan default exec per sesi untuk pengirim yang diotorisasi.

Gerbang:

- Pengaktifan: `tools.elevated.enabled` (dan secara opsional `agents.list[].tools.elevated.enabled`)
- Daftar izin pengirim: `tools.elevated.allowFrom.<provider>` (dan secara opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Mode Elevated](/id/tools/elevated).

## Perbaikan umum untuk "kurungan sandbox"

### "Alat X diblokir oleh kebijakan alat sandbox"

Kunci perbaikan (pilih salah satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau `agents.list[].sandbox.mode=off` per agen)
- Izinkan alat di dalam sandbox:
  - hapus alat tersebut dari `tools.sandbox.tools.deny` (atau `agents.list[].tools.sandbox.tools.deny` per agen)
  - atau tambahkan alat tersebut ke `tools.sandbox.tools.allow` (atau daftar izin per agen)
- Periksa entri `agents/tool-policy` di `openclaw logs`. Entri tersebut mencatat mode sandbox dan apakah aturan izin atau penolakan memblokir alat.

### "Saya kira ini sesi utama, mengapa dijalankan dalam sandbox?"

Dalam mode `"non-main"`, kunci grup/saluran _bukan_ kunci utama. Gunakan kunci sesi utama (ditampilkan oleh `sandbox explain`) atau ubah mode ke `"off"`.

## Terkait

- [Sandbox](/id/gateway/sandboxing) -- referensi lengkap sandbox (mode, cakupan, backend, image)
- [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) -- penggantian per agen dan urutan prioritas
- [Mode Elevated](/id/tools/elevated)
