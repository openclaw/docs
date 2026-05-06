---
read_when:
    - Memasangkan node iOS/Android ke Gateway
    - Menggunakan kanvas/kamera Node untuk konteks agen
    - Menambahkan perintah Node atau helper CLI baru
summary: 'Node: penyandingan, kapabilitas, izin, dan alat bantu CLI untuk kanvas/kamera/layar/perangkat/notifikasi/sistem'
title: Node
x-i18n:
    generated_at: "2026-05-06T09:19:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**node** adalah perangkat pendamping (macOS/iOS/Android/headless) yang terhubung ke **WebSocket** Gateway (port yang sama dengan operator) dengan `role: "node"` dan mengekspos permukaan perintah (mis. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Detail protokol: [protokol Gateway](/id/gateway/protocol).

Transport lama: [protokol Bridge](/id/gateway/bridge-protocol) (TCP JSONL;
hanya historis untuk node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi menubar terhubung ke server
WS milik Gateway dan mengekspos perintah canvas/camera lokalnya sebagai node (sehingga
`openclaw nodes …` berfungsi terhadap Mac ini). Dalam mode gateway jarak jauh, automasi
browser ditangani oleh host node CLI (`openclaw node run` atau layanan node
terpasang), bukan oleh node aplikasi native.

Catatan:

- Node adalah **periferal**, bukan gateway. Node tidak menjalankan layanan gateway.
- Pesan Telegram/WhatsApp/dll. masuk ke **gateway**, bukan ke node.
- Runbook pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Pairing + status

**Node WS menggunakan pairing perangkat.** Node menyajikan identitas perangkat saat `connect`; Gateway
membuat permintaan pairing perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI).

CLI cepat:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jika node mencoba ulang dengan detail auth yang berubah (role/scope/public key), permintaan
tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang
`openclaw devices list` sebelum menyetujui.

Catatan:

- `nodes status` menandai node sebagai **paired** ketika role pairing perangkatnya mencakup `node`.
- Catatan pairing perangkat adalah kontrak role yang disetujui dan tahan lama. Rotasi token
  tetap berada di dalam kontrak tersebut; rotasi tidak dapat meningkatkan node yang sudah paired menjadi
  role berbeda yang tidak pernah diberikan oleh persetujuan pairing.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) adalah penyimpanan pairing
  node terpisah yang dimiliki gateway; ini **tidak** mengatur handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` menghapus entri usang dari penyimpanan pairing node
  terpisah yang dimiliki gateway tersebut.
- Cakupan persetujuan mengikuti perintah yang dideklarasikan permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node jarak jauh (system.run)

Gunakan **host node** ketika Gateway Anda berjalan di satu mesin dan Anda ingin perintah
dijalankan di mesin lain. Model tetap berbicara ke **gateway**; gateway
meneruskan panggilan `exec` ke **host node** ketika `host=node` dipilih.

### Apa yang berjalan di mana

- **Host Gateway**: menerima pesan, menjalankan model, merutekan panggilan tool.
- **Host node**: menjalankan `system.run`/`system.which` pada mesin node.
- **Persetujuan**: diberlakukan pada host node melalui `~/.openclaw/exec-approvals.json`.

Catatan persetujuan:

- Eksekusi node berbasis persetujuan mengikat konteks permintaan yang persis.
- Untuk eksekusi file shell/runtime langsung, OpenClaw juga berupaya mengikat satu operand file lokal
  konkret dan menolak eksekusi jika file tersebut berubah sebelum eksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime,
  eksekusi berbasis persetujuan ditolak alih-alih berpura-pura memiliki cakupan runtime penuh. Gunakan sandboxing,
  host terpisah, atau allowlist/workflow penuh tepercaya yang eksplisit untuk semantik interpreter yang lebih luas.

### Memulai host node (foreground)

Pada mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway jarak jauh melalui tunnel SSH (loopback bind)

Jika Gateway melakukan bind ke loopback (`gateway.bind=loopback`, default dalam mode lokal),
host node jarak jauh tidak dapat terhubung langsung. Buat tunnel SSH dan arahkan
host node ke ujung lokal tunnel.

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
- Env vars lebih disarankan: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfigurasi adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode jarak jauh, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat sesuai aturan prioritas jarak jauh.
- Jika SecretRefs `gateway.auth.*` lokal aktif dikonfigurasi tetapi tidak terselesaikan, auth host node gagal tertutup.
- Resolusi auth host node hanya menghormati env vars `OPENCLAW_GATEWAY_*`.

### Memulai host node (layanan)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Pair + beri nama

Pada host gateway:

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

### Masukkan perintah ke allowlist

Persetujuan exec berlaku **per host node**. Tambahkan entri allowlist dari gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada pada host node di `~/.openclaw/exec-approvals.json`.

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

Setelah diatur, setiap panggilan `exec` dengan `host=node` berjalan pada host node (tunduk pada
allowlist/persetujuan node).

`host=auto` tidak akan secara implisit memilih node sendiri, tetapi permintaan eksplisit per panggilan `host=node` diizinkan dari `auto`. Jika Anda ingin exec node menjadi default untuk sesi, atur `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Tool exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

## Menjalankan perintah

Level rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Helper level lebih tinggi tersedia untuk workflow umum "beri agen lampiran MEDIA".

## Kebijakan perintah

Perintah node harus melewati dua gate sebelum dapat dijalankan:

1. Node harus mendeklarasikan perintah dalam daftar WebSocket `connect.commands`.
2. Kebijakan platform gateway harus mengizinkan perintah yang dideklarasikan.

Node pendamping Windows dan macOS mengizinkan perintah yang dideklarasikan dan aman seperti
`canvas.*`, `camera.list`, `location.get`, dan `screen.snapshot` secara default.
Node tepercaya yang mengiklankan kapabilitas `talk` atau mendeklarasikan perintah `talk.*`
juga mengizinkan perintah push-to-talk yang dideklarasikan (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) secara default, terlepas dari label platform.
Perintah berbahaya atau sangat sensitif terhadap privasi seperti `camera.snap`, `camera.clip`, dan
`screen.record` tetap memerlukan opt-in eksplisit dengan
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` selalu menang atas
default dan entri allowlist tambahan.

Perintah node yang dimiliki Plugin dapat menambahkan kebijakan node-invoke Gateway. Kebijakan tersebut
berjalan setelah pemeriksaan allowlist dan sebelum diteruskan ke node, sehingga
`node.invoke` mentah, helper CLI, dan tool agen khusus berbagi batas izin plugin
yang sama. Perintah node plugin yang berbahaya tetap memerlukan opt-in eksplisit
`gateway.nodes.allowCommands`.

Setelah node mengubah daftar perintah yang dideklarasikannya, tolak pairing perangkat lama
dan setujui permintaan baru agar gateway menyimpan snapshot perintah yang diperbarui.

## Screenshot (snapshot canvas)

Jika node menampilkan Canvas (WebView), `canvas.snapshot` mengembalikan `{ format, base64 }`.

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

- `canvas present` menerima URL atau path file lokal (`--target`), ditambah opsional `--x/--y/--width/--height` untuk pemosisian.
- `canvas eval` menerima JS inline (`--js`) atau arg posisi.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Hanya A2UI v0.8 JSONL yang didukung (v0.9/createSurface ditolak).

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

## Perekaman layar (node)

Node yang didukung mengekspos `screen.record` (mp4). Contoh:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Catatan:

- Ketersediaan `screen.record` bergantung pada platform node.
- Perekaman layar dibatasi hingga `<= 60s`.
- `--no-audio` menonaktifkan penangkapan mikrofon pada platform yang didukung.
- Gunakan `--screen <index>` untuk memilih tampilan ketika beberapa layar tersedia.

## Lokasi (node)

Node mengekspos `location.get` ketika Location diaktifkan di pengaturan.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Location **nonaktif secara default**.
- "Always" memerlukan izin sistem; fetch latar belakang dilakukan sebisa mungkin.
- Respons mencakup lat/lon, akurasi (meter), dan timestamp.

## SMS (node Android)

Node Android dapat mengekspos `sms.send` ketika pengguna memberikan izin **SMS** dan perangkat mendukung teleponi.

Invoke level rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- Prompt izin harus diterima pada perangkat Android sebelum kapabilitas diiklankan.
- Perangkat khusus Wi-Fi tanpa teleponi tidak akan mengiklankan `sms.send`.

## Perintah perangkat Android + data pribadi

Node Android dapat mengiklankan keluarga perintah tambahan ketika kapabilitas terkait diaktifkan.

Keluarga yang tersedia:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Contoh pemanggilan:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Catatan:

- Perintah gerakan dibatasi kemampuan berdasarkan sensor yang tersedia.

## Perintah sistem (host node / node Mac)

Node macOS mengekspos `system.run`, `system.notify`, dan `system.execApprovals.get/set`.
Host node headless mengekspos `system.run`, `system.which`, dan `system.execApprovals.get/set`.

Contoh:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Catatan:

- `system.run` mengembalikan stdout/stderr/kode keluar dalam payload.
- Eksekusi shell sekarang melalui alat `exec` dengan `host=node`; `nodes` tetap menjadi permukaan RPC langsung untuk perintah node eksplisit.
- `nodes invoke` tidak mengekspos `system.run` atau `system.run.prepare`; keduanya tetap hanya berada di jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah
  persetujuan diberikan, Gateway meneruskan rencana tersimpan tersebut, bukan kolom
  command/cwd/session yang kemudian diedit pemanggil.
- `system.notify` mematuhi status izin notifikasi pada aplikasi macOS.
- Metadata node `platform` / `deviceFamily` yang tidak dikenali menggunakan allowlist default konservatif yang mengecualikan `system.run` dan `system.which`. Jika Anda sengaja memerlukan perintah tersebut untuk platform yang tidak dikenal, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk pembungkus shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` bercakupan permintaan dikurangi menjadi allowlist eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu izinkan dalam mode allowlist, pembungkus dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan jalur executable internal, bukan jalur pembungkus. Jika pembukaan pembungkus tidak aman, tidak ada entri allowlist yang dipertahankan secara otomatis.
- Pada host node Windows dalam mode allowlist, proses pembungkus shell melalui `cmd.exe /c` memerlukan persetujuan (entri allowlist saja tidak otomatis mengizinkan bentuk pembungkus).
- `system.notify` mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Host node mengabaikan override `PATH` dan menghapus kunci startup/shell berbahaya (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jika Anda memerlukan entri PATH tambahan, konfigurasikan lingkungan layanan host node (atau instal alat di lokasi standar), bukan meneruskan `PATH` melalui `--env`.
- Pada mode node macOS, `system.run` dibatasi oleh persetujuan exec di aplikasi macOS (Settings → Exec approvals).
  Ask/allowlist/full berperilaku sama seperti host node headless; prompt yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host node headless, `system.run` dibatasi oleh persetujuan exec (`~/.openclaw/exec-approvals.json`).

## Pengikatan node exec

Saat beberapa node tersedia, Anda dapat mengikat exec ke node tertentu.
Ini menetapkan node default untuk `exec host=node` (dan dapat dioverride per agen).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agen:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Hapus pengaturan untuk mengizinkan node apa pun:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Peta izin

Node dapat menyertakan peta `permissions` di `node.list` / `node.describe`, dengan kunci berupa nama izin (misalnya `screenRecording`, `accessibility`) dan nilai boolean (`true` = diberikan).

## Host node headless (lintas platform)

OpenClaw dapat menjalankan **host node headless** (tanpa UI) yang terhubung ke WebSocket
Gateway dan mengekspos `system.run` / `system.which`. Ini berguna di Linux/Windows
atau untuk menjalankan node minimal berdampingan dengan server.

Mulai:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pairing tetap diperlukan (Gateway akan menampilkan prompt pairing perangkat).
- Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di `~/.openclaw/node.json`.
- Persetujuan exec diberlakukan secara lokal melalui `~/.openclaw/exec-approvals.json`
  (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Pada macOS, host node headless mengeksekusi `system.run` secara lokal secara default. Setel
  `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan
  `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan gagal tertutup jika tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` saat WS Gateway menggunakan TLS.

## Mode node Mac

- Aplikasi menubar macOS terhubung ke server WS Gateway sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode jarak jauh, aplikasi membuka tunnel SSH untuk port Gateway dan terhubung ke `localhost`.
