---
read_when:
    - Memasangkan node iOS/Android ke gateway
    - Menggunakan canvas/camera node untuk konteks agen
    - Menambahkan perintah node baru atau helper CLI♀♀♀്ഞanalysis to=final code  omit? Need translate this last input only. "Adding new node commands or CLI helpers" -> "Menambahkan perintah node baru atau helper CLI". Output only.
summary: 'Node: pairing, kapabilitas, izin, dan helper CLI untuk canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-24T09:15:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Sebuah **node** adalah perangkat pendamping (macOS/iOS/Android/headless) yang terhubung ke **WebSocket** Gateway (port yang sama dengan operator) dengan `role: "node"` dan mengekspos surface perintah (misalnya `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Detail protokol: [Protokol Gateway](/id/gateway/protocol).

Transport lama: [Bridge protocol](/id/gateway/bridge-protocol) (TCP JSONL;
hanya historis untuk node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi menubar terhubung ke server WS Gateway dan mengekspos perintah canvas/camera lokalnya sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).

Catatan:

- Node adalah **periferal**, bukan gateway. Node tidak menjalankan layanan gateway.
- Pesan Telegram/WhatsApp/dll. mendarat di **gateway**, bukan di node.
- Runbook pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Pairing + status

**Node WS menggunakan pairing perangkat.** Node menyajikan identitas perangkat selama `connect`; Gateway
membuat permintaan pairing perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI).

CLI cepat:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jika sebuah node mencoba lagi dengan detail auth yang berubah (role/scope/kunci publik), permintaan tertunda sebelumnya
digantikan dan `requestId` baru dibuat. Jalankan ulang
`openclaw devices list` sebelum menyetujui.

Catatan:

- `nodes status` menandai sebuah node sebagai **paired** saat role pairing perangkatnya mencakup `node`.
- Catatan pairing perangkat adalah kontrak role yang tahan lama dan telah disetujui. Rotasi
  token tetap berada dalam kontrak itu; rotasi tidak dapat menaikkan node yang telah dipasangkan ke
  role berbeda yang tidak pernah diberikan oleh persetujuan pairing.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) adalah store pairing node
  milik gateway yang terpisah; store ini **tidak** membatasi handshake WS `connect`.
- Scope persetujuan mengikuti perintah yang dideklarasikan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node remote (`system.run`)

Gunakan **host node** saat Gateway Anda berjalan di satu mesin dan Anda ingin perintah
dijalankan di mesin lain. Model tetap berbicara dengan **gateway**; gateway
meneruskan panggilan `exec` ke **host node** saat `host=node` dipilih.

### Apa yang berjalan di mana

- **Host gateway**: menerima pesan, menjalankan model, merutekan panggilan tool.
- **Host node**: menjalankan `system.run`/`system.which` di mesin node.
- **Persetujuan**: ditegakkan di host node melalui `~/.openclaw/exec-approvals.json`.

Catatan persetujuan:

- Run node yang didukung persetujuan mengikat konteks permintaan yang tepat.
- Untuk eksekusi shell/runtime file langsung, OpenClaw juga sebisa mungkin mengikat satu operand file lokal konkret
  dan menolak run jika file itu berubah sebelum eksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime,
  eksekusi yang didukung persetujuan akan ditolak alih-alih berpura-pura memiliki cakupan runtime penuh. Gunakan sandboxing,
  host terpisah, atau alur allowlist/full tepercaya yang eksplisit untuk semantik interpreter yang lebih luas.

### Mulai host node (foreground)

Di mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remote melalui tunnel SSH (bind loopback)

Jika Gateway bind ke loopback (`gateway.bind=loopback`, default pada mode lokal),
host node remote tidak dapat terhubung secara langsung. Buat tunnel SSH dan arahkan
host node ke ujung lokal tunnel tersebut.

Contoh (host node -> host gateway):

```bash
# Terminal A (biarkan tetap berjalan): teruskan lokal 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: ekspor token gateway dan hubungkan melalui tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Catatan:

- `openclaw node run` mendukung auth token atau password.
- Env vars lebih disukai: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback config adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode remote, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat menurut aturan prioritas remote.
- Jika SecretRef `gateway.auth.*` lokal yang aktif dikonfigurasi tetapi tidak ter-resolve, auth host-node gagal tertutup.
- Resolusi auth host-node hanya menghormati env vars `OPENCLAW_GATEWAY_*`.

### Mulai host node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pair + beri nama

Di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jika node mencoba lagi dengan detail auth yang berubah, jalankan ulang `openclaw devices list`
dan setujui `requestId` saat ini.

Opsi penamaan:

- `--display-name` pada `openclaw node run` / `openclaw node install` (persisten di `~/.openclaw/node.json` pada node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override gateway).

### Tambahkan ke allowlist perintah

Persetujuan exec bersifat **per host node**. Tambahkan entri allowlist dari gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada di host node di `~/.openclaw/exec-approvals.json`.

### Arahkan exec ke node

Konfigurasikan default (config gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Atau per sesi:

```
/exec host=node security=allowlist node=<id-or-name>
```

Setelah diatur, setiap panggilan `exec` dengan `host=node` akan berjalan di host node (sesuai
allowlist/persetujuan node).

`host=auto` tidak akan secara implisit memilih node dengan sendirinya, tetapi permintaan per-panggilan `host=node` yang eksplisit diizinkan dari `auto`. Jika Anda ingin exec node menjadi default untuk sesi, atur `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Tool exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

## Menjalankan perintah

Level rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Tersedia helper tingkat lebih tinggi untuk alur kerja umum “beri agen lampiran MEDIA”.

## Screenshot (snapshot canvas)

Jika node sedang menampilkan Canvas (WebView), `canvas.snapshot` mengembalikan `{ format, base64 }`.

Helper CLI (menulis ke file temp dan mencetak `MEDIA:<path>`):

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

- `canvas present` menerima URL atau path file lokal (`--target`), plus `--x/--y/--width/--height` opsional untuk penempatan.
- `canvas eval` menerima JS inline (`--js`) atau argumen posisional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Hanya A2UI v0.8 JSONL yang didukung (v0.9/createSurface ditolak).

## Foto + video (camera node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: kedua arah kamera (2 baris MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Klip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Catatan:

- Node harus berada di **foreground** untuk `canvas.*` dan `camera.*` (panggilan background mengembalikan `NODE_BACKGROUND_UNAVAILABLE`).
- Durasi klip dibatasi (saat ini `<= 60s`) untuk menghindari payload base64 yang terlalu besar.
- Android akan meminta izin `CAMERA`/`RECORD_AUDIO` bila memungkinkan; izin yang ditolak akan gagal dengan `*_PERMISSION_REQUIRED`.

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
- Gunakan `--screen <index>` untuk memilih layar saat tersedia beberapa layar.

## Lokasi (node)

Node mengekspos `location.get` saat Location diaktifkan dalam pengaturan.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Location **nonaktif secara default**.
- “Always” memerlukan izin sistem; pengambilan background bersifat best-effort.
- Respons mencakup lat/lon, akurasi (meter), dan stempel waktu.

## SMS (node Android)

Node Android dapat mengekspos `sms.send` saat pengguna memberikan izin **SMS** dan perangkat mendukung telepon.

Invoke level rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- Prompt izin harus diterima di perangkat Android sebelum kapabilitas diiklankan.
- Perangkat khusus Wi-Fi tanpa telepon tidak akan mengiklankan `sms.send`.

## Perintah perangkat Android + data pribadi

Node Android dapat mengiklankan keluarga perintah tambahan saat kapabilitas terkait diaktifkan.

Keluarga yang tersedia:

- `device.status`, `device.info`, `device.permissions`, `device.health`
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
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Catatan:

- Perintah motion dibatasi oleh kapabilitas sensor yang tersedia.

## Perintah sistem (host node / node mac)

Node macOS mengekspos `system.run`, `system.notify`, dan `system.execApprovals.get/set`.
Host node headless mengekspos `system.run`, `system.which`, dan `system.execApprovals.get/set`.

Contoh:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Catatan:

- `system.run` mengembalikan stdout/stderr/exit code dalam payload.
- Eksekusi shell sekarang melalui tool `exec` dengan `host=node`; `nodes` tetap menjadi surface RPC langsung untuk perintah node eksplisit.
- `nodes invoke` tidak mengekspos `system.run` atau `system.run.prepare`; keduanya hanya tetap berada pada jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah
  persetujuan diberikan, gateway meneruskan rencana tersimpan itu, bukan field
  command/cwd/session yang kemudian diedit oleh pemanggil.
- `system.notify` menghormati state izin notifikasi pada aplikasi macOS.
- Metadata `platform` / `deviceFamily` node yang tidak dikenali menggunakan allowlist default yang konservatif yang mengecualikan `system.run` dan `system.which`. Jika Anda memang membutuhkan perintah tersebut untuk platform yang tidak dikenal, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` yang dicakup ke request dikurangi menjadi allowlist eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable bagian dalam alih-alih path wrapper. Jika unwrapping tidak aman, tidak ada entri allowlist yang dipertahankan secara otomatis.
- Pada host node Windows dalam mode allowlist, run wrapper shell melalui `cmd.exe /c` memerlukan persetujuan (entri allowlist saja tidak otomatis mengizinkan bentuk wrapper tersebut).
- `system.notify` mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Host node mengabaikan override `PATH` dan menghapus kunci startup/shell berbahaya (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jika Anda memerlukan entri PATH tambahan, konfigurasikan environment service host node (atau instal tool di lokasi standar) alih-alih meneruskan `PATH` melalui `--env`.
- Pada mode node macOS, `system.run` dibatasi oleh persetujuan exec di aplikasi macOS (Settings → Exec approvals).
  Ask/allowlist/full berperilaku sama seperti host node headless; prompt yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host node headless, `system.run` dibatasi oleh persetujuan exec (`~/.openclaw/exec-approvals.json`).

## Binding node exec

Saat tersedia beberapa node, Anda dapat mengikat exec ke node tertentu.
Ini menetapkan node default untuk `exec host=node` (dan dapat ditimpa per agen).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agen:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Batalkan pengaturan agar node apa pun diizinkan:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Peta izin

Node dapat menyertakan peta `permissions` dalam `node.list` / `node.describe`, dengan kunci nama izin (misalnya `screenRecording`, `accessibility`) dan nilai boolean (`true` = diberikan).

## Host node headless (lintas platform)

OpenClaw dapat menjalankan **host node headless** (tanpa UI) yang terhubung ke
WebSocket Gateway dan mengekspos `system.run` / `system.which`. Ini berguna di Linux/Windows
atau untuk menjalankan node minimal di samping server.

Mulai:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pairing tetap diperlukan (Gateway akan menampilkan prompt pairing perangkat).
- Host node menyimpan id node, token, display name, dan info koneksi gateway di `~/.openclaw/node.json`.
- Persetujuan exec ditegakkan secara lokal melalui `~/.openclaw/exec-approvals.json`
  (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Di macOS, host node headless menjalankan `system.run` secara lokal secara default. Atur
  `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan
  `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan gagal tertutup jika host itu tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` saat WS Gateway menggunakan TLS.

## Mode node Mac

- Aplikasi menubar macOS terhubung ke server WS Gateway sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode remote, aplikasi membuka tunnel SSH untuk port Gateway dan terhubung ke `localhost`.
