---
read_when:
    - Menghubungkan node iOS/Android ke gateway
    - Menggunakan node canvas/kamera untuk konteks agen
    - Menambahkan perintah node baru atau pembantu CLI
summary: 'Node: pairing, kemampuan, izin, dan pembantu CLI untuk canvas/kamera/layar/perangkat/notifikasi/sistem'
title: Node
x-i18n:
    generated_at: "2026-07-03T10:00:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Sebuah **node** adalah perangkat pendamping (macOS/iOS/Android/headless) yang terhubung ke **WebSocket** Gateway (port yang sama seperti operator) dengan `role: "node"` dan mengekspos permukaan perintah (mis. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Detail protokol: [Protokol Gateway](/id/gateway/protocol).

Transport lama: [Protokol Bridge](/id/gateway/bridge-protocol) (TCP JSONL;
hanya historis untuk node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi menubar terhubung ke server WS Gateway dan mengekspos perintah canvas/camera lokalnya sebagai node (sehingga
`openclaw nodes …` bekerja terhadap Mac ini). Dalam mode gateway jarak jauh, otomasi browser ditangani oleh host node CLI (`openclaw node run` atau layanan node yang terpasang), bukan oleh node aplikasi native.

Catatan:

- Node adalah **periferal**, bukan gateway. Node tidak menjalankan layanan gateway.
- Pesan Telegram/WhatsApp/dll. masuk ke **gateway**, bukan ke node.
- Runbook pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Pairing + status

**Node WS menggunakan pairing perangkat.** Node menampilkan identitas perangkat saat `connect`; Gateway
membuat permintaan pairing perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI).

CLI cepat:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jika node mencoba ulang dengan detail auth yang berubah (role/scope/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang
`openclaw devices list` sebelum menyetujui.

Catatan:

- `nodes status` menandai node sebagai **paired** ketika role pairing perangkatnya mencakup `node`.
- Catatan pairing perangkat adalah kontrak role yang disetujui dan tahan lama. Rotasi token tetap berada di dalam kontrak tersebut; rotasi tidak dapat meningkatkan node yang sudah paired menjadi role berbeda yang tidak pernah diberikan oleh persetujuan pairing.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) adalah penyimpanan pairing node terpisah yang dimiliki gateway; ini **tidak** menjadi gate untuk handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` menghapus pairing node. Untuk node yang didukung perangkat, ini mencabut role `node` perangkat di `devices/paired.json` dan memutus sesi role-node perangkat tersebut — perangkat dengan role campuran mempertahankan barisnya dan hanya kehilangan role `node`, sementara baris perangkat khusus node dihapus. Ini juga menghapus entri yang cocok dari penyimpanan pairing node terpisah yang dimiliki gateway. `operator.pairing` dapat menghapus baris node non-operator; pemanggil token perangkat yang mencabut role node miliknya sendiri pada perangkat role campuran juga memerlukan `operator.admin`.
- Scope persetujuan mengikuti perintah yang dideklarasikan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node jarak jauh (system.run)

Gunakan **host node** ketika Gateway Anda berjalan di satu mesin dan Anda ingin perintah dieksekusi di mesin lain. Model tetap berbicara ke **gateway**; gateway meneruskan panggilan `exec` ke **host node** ketika `host=node` dipilih.

### Apa yang berjalan di mana

- **Host Gateway**: menerima pesan, menjalankan model, merutekan panggilan alat.
- **Host node**: mengeksekusi `system.run`/`system.which` di mesin node.
- **Persetujuan**: diberlakukan pada host node melalui `~/.openclaw/exec-approvals.json`.

Catatan persetujuan:

- Eksekusi node yang didukung persetujuan mengikat konteks permintaan yang tepat.
- Untuk eksekusi file shell/runtime langsung, OpenClaw juga berupaya sebaik mungkin untuk mengikat satu operand file lokal konkret dan menolak eksekusi jika file tersebut berubah sebelum eksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime, eksekusi yang didukung persetujuan ditolak alih-alih berpura-pura memiliki cakupan runtime penuh. Gunakan sandboxing, host terpisah, atau daftar izin tepercaya/alur kerja penuh yang eksplisit untuk semantik interpreter yang lebih luas.

### Memulai host node (foreground)

Di mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway jarak jauh melalui tunnel SSH (bind loopback)

Jika Gateway bind ke loopback (`gateway.bind=loopback`, default dalam mode lokal), host node jarak jauh tidak dapat terhubung langsung. Buat tunnel SSH dan arahkan host node ke ujung lokal tunnel.

Contoh (host node -> host gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Catatan:

- `openclaw node run` mendukung auth token atau kata sandi.
- Variabel env lebih disarankan: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfigurasi adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode jarak jauh, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat sesuai aturan prioritas jarak jauh.
- Jika SecretRefs `gateway.auth.*` lokal aktif dikonfigurasi tetapi tidak terselesaikan, auth host node gagal tertutup.
- Resolusi auth host node hanya menghormati variabel env `OPENCLAW_GATEWAY_*`.

### Memulai host node (layanan)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Pairing + penamaan

Di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jika node mencoba ulang dengan detail auth yang berubah, jalankan ulang `openclaw devices list`
dan setujui `requestId` saat ini.

Opsi penamaan:

- `--display-name` pada `openclaw node run` / `openclaw node install` (bertahan di `~/.openclaw/node.json` pada node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override gateway).

### Izinkan perintah

Persetujuan exec bersifat **per host node**. Tambahkan entri daftar izin dari gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada di host node pada `~/.openclaw/exec-approvals.json`.

### Arahkan exec ke node

Konfigurasikan default (konfigurasi gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Atau per sesi:

```
/exec host=node security=allowlist node=<id-or-name>
```

Setelah diatur, setiap panggilan `exec` dengan `host=node` berjalan di host node (tunduk pada daftar izin/persetujuan node).

`host=auto` tidak akan secara implisit memilih node dengan sendirinya, tetapi permintaan eksplisit per panggilan `host=node` diizinkan dari `auto`. Jika Anda ingin exec node menjadi default untuk sesi, atur `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Alat exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

### Inferensi model lokal

Node desktop atau server dapat mengekspos model berkemampuan chat dari server Ollama yang berjalan pada node tersebut. Agen menggunakan alat `node_inference` milik Plugin Ollama untuk menemukan model yang terpasang dan menjalankan prompt terbatas dari jarak jauh; Gateway tidak memerlukan akses jaringan langsung ke Ollama. Lihat [Inferensi node-lokal Ollama](/id/providers/ollama#node-local-inference)
untuk penyiapan, pemfilteran model, dan perintah verifikasi langsung.

## Memanggil perintah

Level rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Helper level lebih tinggi tersedia untuk alur kerja umum "berikan lampiran MEDIA kepada agen".

## Kebijakan perintah

Perintah node harus melewati dua gate sebelum dapat dipanggil:

1. Node harus mendeklarasikan perintah dalam daftar WebSocket `connect.commands`.
2. Kebijakan platform gateway harus mengizinkan perintah yang dideklarasikan.

Node pendamping Windows dan macOS mengizinkan perintah terdeklarasi yang aman seperti
`canvas.*`, `camera.list`, `location.get`, dan `screen.snapshot` secara default.
Node tepercaya yang mengiklankan kapabilitas `talk` atau mendeklarasikan perintah `talk.*`
juga mengizinkan perintah tekan-untuk-berbicara terdeklarasi (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) secara default, terlepas dari label platform.
Perintah berbahaya atau sensitif privasi seperti `camera.snap`, `camera.clip`, dan
`screen.record` tetap memerlukan opt-in eksplisit dengan
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` selalu menang atas
default dan entri daftar izin tambahan.

Perintah node milik Plugin dapat menambahkan kebijakan node-invoke Gateway. Kebijakan tersebut berjalan setelah pemeriksaan daftar izin dan sebelum diteruskan ke node, sehingga
`node.invoke`, helper CLI, dan alat agen khusus berbagi batas izin Plugin yang sama. Perintah node Plugin yang berbahaya tetap memerlukan opt-in eksplisit
`gateway.nodes.allowCommands`.

Setelah node mengubah daftar perintah yang dideklarasikan, tolak pairing perangkat lama
dan setujui permintaan baru agar gateway menyimpan snapshot perintah yang diperbarui.

## Konfigurasi (`openclaw.json`)

Pengaturan terkait node berada di bawah `gateway.nodes` dan `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Gunakan nama perintah node yang tepat. `denyCommands` menghapus perintah bahkan ketika default platform atau entri `allowCommands` seharusnya mengizinkannya. Lihat
[Referensi konfigurasi Gateway](/id/gateway/configuration-reference#gateway-field-details)
untuk detail field pairing node gateway dan kebijakan perintah.

Override node exec per agen:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Tangkapan layar (snapshot canvas)

Jika node menampilkan Canvas (WebView), `canvas.snapshot` mengembalikan `{ format, base64 }`.

Helper CLI (menulis ke file temp dan mencetak path tersimpan):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Kontrol Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Catatan:

- `canvas present` menerima URL atau path file lokal (`--target`), ditambah `--x/--y/--width/--height` opsional untuk pemosisian.
- `canvas eval` menerima JS inline (`--js`) atau argumen posisional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Node seluler menggunakan halaman A2UI bawaan milik aplikasi untuk rendering yang mendukung aksi.
- Hanya A2UI v0.8 JSONL yang didukung (v0.9/createSurface ditolak).
- iOS dan Android merender halaman Gateway Canvas jarak jauh, tetapi aksi tombol A2UI hanya dikirim dari halaman A2UI bawaan milik aplikasi. Halaman A2UI HTTP/HTTPS yang di-host Gateway bersifat render-only pada klien seluler tersebut.

## Foto + video (kamera node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Klip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Catatan:

- Node harus berada di **foreground** untuk `canvas.*` dan `camera.*` (panggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`).
- Durasi klip dibatasi (saat ini `<= 60s`) untuk menghindari payload base64 yang terlalu besar.
- Android akan meminta izin `CAMERA`/`RECORD_AUDIO` jika memungkinkan; izin yang ditolak gagal dengan `*_PERMISSION_REQUIRED`.

## Rekaman layar (node)

Node yang didukung mengekspos `screen.record` (mp4). Contoh:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Catatan:

- Ketersediaan `screen.record` bergantung pada platform node.
- Rekaman layar dibatasi hingga `<= 60s`.
- `--no-audio` menonaktifkan perekaman mikrofon pada platform yang didukung.
- Gunakan `--screen <index>` untuk memilih tampilan saat beberapa layar tersedia.

## Lokasi (node)

Node mengekspos `location.get` saat Lokasi diaktifkan di pengaturan.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Lokasi **nonaktif secara default**.
- "Selalu" memerlukan izin sistem; pengambilan latar belakang bersifat upaya terbaik.
- Respons mencakup lat/lon, akurasi (meter), dan timestamp.

## SMS (node Android)

Node Android dapat mengekspos `sms.send` saat pengguna memberikan izin **SMS** dan perangkat mendukung telefoni.

Invoke tingkat rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- Prompt izin harus diterima di perangkat Android sebelum kapabilitas diiklankan.
- Perangkat Wi-Fi-only tanpa telefoni tidak akan mengiklankan `sms.send`.

## Perintah perangkat Android + data pribadi

Node Android dapat mengiklankan keluarga perintah tambahan saat kapabilitas terkait diaktifkan.

Keluarga yang tersedia:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` saat berbagi Aplikasi Terinstal diaktifkan di Pengaturan Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Contoh invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Catatan:

- `device.apps` bersifat opt-in dan secara default mengembalikan aplikasi yang terlihat di launcher.
- Perintah gerakan dibatasi kapabilitas oleh sensor yang tersedia.

## Perintah sistem (host node / node mac)

Node macOS mengekspos `system.run`, `system.notify`, dan `system.execApprovals.get/set`.
Host node headless mengekspos `system.run`, `system.which`, dan `system.execApprovals.get/set`.

Contoh:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Catatan:

- `system.run` mengembalikan stdout/stderr/kode keluar dalam payload.
- Eksekusi shell sekarang melewati tool `exec` dengan `host=node`; `nodes` tetap menjadi surface RPC langsung untuk perintah node eksplisit.
- `nodes invoke` tidak mengekspos `system.run` atau `system.run.prepare`; keduanya tetap hanya berada di jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah
  persetujuan diberikan, gateway meneruskan rencana tersimpan itu, bukan field
  command/cwd/session yang diedit pemanggil kemudian.
- `system.notify` menghormati status izin notifikasi pada aplikasi macOS.
- Metadata node `platform` / `deviceFamily` yang tidak dikenali menggunakan allowlist default konservatif yang mengecualikan `system.run` dan `system.which`. Jika Anda sengaja membutuhkan perintah tersebut untuk platform yang tidak diketahui, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` berskala permintaan dikurangi menjadi allowlist eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu izinkan dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam alih-alih path wrapper. Jika pembukaan wrapper tidak aman, tidak ada entri allowlist yang dipertahankan secara otomatis.
- Pada host node Windows dalam mode allowlist, eksekusi wrapper shell melalui `cmd.exe /c` memerlukan persetujuan (entri allowlist saja tidak otomatis mengizinkan bentuk wrapper tersebut).
- `system.notify` mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Host node mengabaikan override `PATH` dan menghapus key startup/shell berbahaya (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Jika Anda membutuhkan entri PATH tambahan, konfigurasikan lingkungan layanan host node (atau instal tool di lokasi standar) alih-alih meneruskan `PATH` melalui `--env`.
- Pada mode node macOS, `system.run` dibatasi oleh persetujuan exec di aplikasi macOS (Pengaturan → Persetujuan exec).
  Ask/allowlist/full berperilaku sama seperti host node headless; prompt yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host node headless, `system.run` dibatasi oleh persetujuan exec (`~/.openclaw/exec-approvals.json`).

## Binding node exec

Saat beberapa node tersedia, Anda dapat mengikat exec ke node tertentu.
Ini menetapkan node default untuk `exec host=node` (dan dapat dioverride per agen).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agen:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Unset untuk mengizinkan node apa pun:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Peta izin

Node dapat menyertakan peta `permissions` dalam `node.list` / `node.describe`, dengan key berupa nama izin (mis. `screenRecording`, `accessibility`) dan nilai boolean (`true` = diberikan).

## Host node headless (lintas platform)

OpenClaw dapat menjalankan **host node headless** (tanpa UI) yang terhubung ke WebSocket Gateway
dan mengekspos `system.run` / `system.which`. Ini berguna di Linux/Windows
atau untuk menjalankan node minimal bersama server.

Jalankan:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pairing tetap diperlukan (Gateway akan menampilkan prompt pairing perangkat).
- Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di `~/.openclaw/node.json`.
- Persetujuan exec diberlakukan secara lokal melalui `~/.openclaw/exec-approvals.json`
  (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Pada macOS, host node headless mengeksekusi `system.run` secara lokal secara default. Atur
  `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan
  `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan gagal tertutup jika tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` saat Gateway WS menggunakan TLS.

## Mode node Mac

- Aplikasi menubar macOS terhubung ke server WS Gateway sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode jarak jauh, aplikasi membuka tunnel SSH untuk port Gateway dan terhubung ke `localhost`.
