---
read_when:
    - Memasangkan node iOS/Android ke Gateway
    - Menggunakan kanvas/kamera Node untuk konteks agen
    - Menambahkan perintah node atau pembantu CLI baru
summary: 'Node: pemasangan, kapabilitas, izin, dan pembantu CLI untuk kanvas/kamera/layar/perangkat/notifikasi/sistem'
title: Node
x-i18n:
    generated_at: "2026-06-27T17:40:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**node** adalah perangkat pendamping (macOS/iOS/Android/headless) yang terhubung ke **WebSocket** Gateway (port yang sama dengan operator) dengan `role: "node"` dan mengekspos permukaan perintah (mis. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Detail protokol: [Protokol Gateway](/id/gateway/protocol).

Transport lama: [Protokol Bridge](/id/gateway/bridge-protocol) (TCP JSONL;
hanya historis untuk node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi menubar terhubung ke server
WS Gateway dan mengekspos perintah canvas/kamera lokalnya sebagai node (sehingga
`openclaw nodes …` berfungsi terhadap Mac ini). Dalam mode gateway jarak jauh, otomatisasi
browser ditangani oleh host node CLI (`openclaw node run` atau
layanan node terpasang), bukan oleh node aplikasi native.

Catatan:

- Node adalah **periferal**, bukan gateway. Node tidak menjalankan layanan gateway.
- Pesan Telegram/WhatsApp/dll. masuk ke **gateway**, bukan ke node.
- Runbook pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Penyandingan + status

**Node WS menggunakan penyandingan perangkat.** Node menyajikan identitas perangkat saat `connect`; Gateway
membuat permintaan penyandingan perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI).

CLI cepat:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jika node mencoba ulang dengan detail auth yang berubah (role/scopes/public key), permintaan
tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang
`openclaw devices list` sebelum menyetujui.

Catatan:

- `nodes status` menandai node sebagai **disandingkan** saat role penyandingan perangkatnya mencakup `node`.
- Catatan penyandingan perangkat adalah kontrak role yang disetujui dan tahan lama. Rotasi token
  tetap berada di dalam kontrak itu; rotasi tidak dapat meningkatkan node yang sudah disandingkan menjadi
  role berbeda yang tidak pernah diberikan oleh persetujuan penyandingan.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) adalah penyimpanan penyandingan
  node terpisah yang dimiliki gateway; penyimpanan ini **tidak** mengatur handshake `connect` WS.
- `openclaw nodes remove --node <id|name|ip>` menghapus penyandingan node. Untuk
  node yang didukung perangkat, perintah ini mencabut role `node` perangkat di `devices/paired.json`
  dan memutus sesi role-node perangkat tersebut — perangkat dengan beberapa role tetap menyimpan
  barisnya dan hanya kehilangan role `node`, sedangkan baris perangkat yang hanya node
  dihapus. Perintah ini juga menghapus entri yang cocok dari penyimpanan penyandingan node
  terpisah yang dimiliki gateway. `operator.pairing` dapat menghapus baris node non-operator; pemanggil
  device-token yang mencabut role node miliknya sendiri pada perangkat dengan beberapa role
  juga memerlukan `operator.admin`.
- Cakupan persetujuan mengikuti perintah yang dinyatakan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node jarak jauh (system.run)

Gunakan **host node** saat Gateway Anda berjalan di satu mesin dan Anda ingin perintah
dieksekusi di mesin lain. Model tetap berbicara dengan **gateway**; gateway
meneruskan panggilan `exec` ke **host node** saat `host=node` dipilih.

### Apa yang berjalan di mana

- **Host Gateway**: menerima pesan, menjalankan model, merutekan panggilan tool.
- **Host node**: menjalankan `system.run`/`system.which` di mesin node.
- **Persetujuan**: diberlakukan pada host node melalui `~/.openclaw/exec-approvals.json`.

Catatan persetujuan:

- Eksekusi node yang didukung persetujuan mengikat konteks permintaan yang persis.
- Untuk eksekusi file shell/runtime langsung, OpenClaw juga berupaya sebaik mungkin mengikat satu operand file lokal
  konkret dan menolak eksekusi jika file itu berubah sebelum eksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime,
  eksekusi yang didukung persetujuan ditolak alih-alih berpura-pura memiliki cakupan runtime penuh. Gunakan sandboxing,
  host terpisah, atau allowlist/alur kerja penuh tepercaya yang eksplisit untuk semantik interpreter yang lebih luas.

### Memulai host node (foreground)

Di mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway jarak jauh melalui tunnel SSH (bind loopback)

Jika Gateway bind ke loopback (`gateway.bind=loopback`, default dalam mode lokal),
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
- Env var lebih disarankan: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback config adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode jarak jauh, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat sesuai aturan presedensi jarak jauh.
- Jika SecretRef `gateway.auth.*` lokal yang aktif dikonfigurasi tetapi tidak terselesaikan, auth host node gagal secara tertutup.
- Resolusi auth host node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

### Memulai host node (layanan)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Sandingkan + beri nama

Di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jika node mencoba ulang dengan detail auth yang berubah, jalankan ulang `openclaw devices list`
dan setujui `requestId` saat ini.

Opsi penamaan:

- `--display-name` pada `openclaw node run` / `openclaw node install` (dipertahankan di `~/.openclaw/node.json` pada node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override gateway).

### Allowlist perintah

Persetujuan exec bersifat **per host node**. Tambahkan entri allowlist dari gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada di host node pada `~/.openclaw/exec-approvals.json`.

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

Setelah diatur, panggilan `exec` apa pun dengan `host=node` berjalan di host node (tunduk pada
allowlist/persetujuan node).

`host=auto` tidak akan secara implisit memilih node sendiri, tetapi permintaan eksplisit per panggilan `host=node` diizinkan dari `auto`. Jika Anda ingin exec node menjadi default untuk sesi, tetapkan `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Tool exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

## Memanggil perintah

Level rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Helper level lebih tinggi tersedia untuk alur kerja umum "memberikan lampiran MEDIA kepada agen".

## Kebijakan perintah

Perintah node harus melewati dua gate sebelum dapat dipanggil:

1. Node harus menyatakan perintah dalam daftar `connect.commands` WebSocket-nya.
2. Kebijakan platform gateway harus mengizinkan perintah yang dinyatakan.

Node pendamping Windows dan macOS mengizinkan perintah aman yang dinyatakan seperti
`canvas.*`, `camera.list`, `location.get`, dan `screen.snapshot` secara default.
Node tepercaya yang mengiklankan kapabilitas `talk` atau menyatakan perintah `talk.*`
juga mengizinkan perintah push-to-talk yang dinyatakan (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) secara default, terlepas dari label platform.
Perintah berbahaya atau berat privasi seperti `camera.snap`, `camera.clip`, dan
`screen.record` tetap memerlukan opt-in eksplisit dengan
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` selalu mengalahkan
default dan entri allowlist tambahan.

Perintah node yang dimiliki Plugin dapat menambahkan kebijakan node-invoke Gateway. Kebijakan itu
berjalan setelah pemeriksaan allowlist dan sebelum diteruskan ke node, sehingga `node.invoke`
mentah, helper CLI, dan tool agen khusus berbagi batas izin plugin yang sama.
Perintah node plugin berbahaya tetap memerlukan opt-in eksplisit
`gateway.nodes.allowCommands`.

Setelah node mengubah daftar perintah yang dinyatakan, tolak penyandingan perangkat lama
dan setujui permintaan baru agar gateway menyimpan snapshot perintah yang diperbarui.

## Config (`openclaw.json`)

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

Gunakan nama perintah node yang persis. `denyCommands` menghapus perintah bahkan ketika
default platform atau entri `allowCommands` seharusnya mengizinkannya. Lihat
[Referensi konfigurasi Gateway](/id/gateway/configuration-reference#gateway-field-details)
untuk detail field penyandingan node gateway dan kebijakan perintah.

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

- `canvas present` menerima URL atau path file lokal (`--target`), plus `--x/--y/--width/--height` opsional untuk pemosisian.
- `canvas eval` menerima JS inline (`--js`) atau arg posisi.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Node seluler menggunakan halaman A2UI bawaan milik aplikasi untuk rendering yang mendukung aksi.
- Hanya A2UI v0.8 JSONL yang didukung (v0.9/createSurface ditolak).
- iOS dan Android merender halaman Canvas Gateway jarak jauh, tetapi aksi tombol A2UI hanya dikirim dari halaman A2UI bawaan milik aplikasi. Halaman A2UI HTTP/HTTPS yang di-host Gateway bersifat hanya render pada klien seluler tersebut.

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

- Node harus berada di **latar depan** untuk `canvas.*` dan `camera.*` (panggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`).
- Durasi klip dibatasi (saat ini `<= 60s`) untuk menghindari payload base64 yang terlalu besar.
- Android akan meminta izin `CAMERA`/`RECORD_AUDIO` jika memungkinkan; izin yang ditolak akan gagal dengan `*_PERMISSION_REQUIRED`.

## Perekaman layar (node)

Node yang didukung mengekspos `screen.record` (mp4). Contoh:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Catatan:

- Ketersediaan `screen.record` bergantung pada platform node.
- Perekaman layar dibatasi hingga `<= 60s`.
- `--no-audio` menonaktifkan perekaman mikrofon pada platform yang didukung.
- Gunakan `--screen <index>` untuk memilih tampilan saat beberapa layar tersedia.

## Lokasi (node)

Node mengekspos `location.get` saat Lokasi diaktifkan di pengaturan.

Pembantu CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Lokasi **nonaktif secara default**.
- "Always" memerlukan izin sistem; pengambilan di latar belakang bersifat upaya terbaik.
- Respons mencakup lat/lon, akurasi (meter), dan stempel waktu.

## SMS (node Android)

Node Android dapat mengekspos `sms.send` saat pengguna memberikan izin **SMS** dan perangkat mendukung teleponi.

Invoke tingkat rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- Permintaan izin harus diterima di perangkat Android sebelum kapabilitas diiklankan.
- Perangkat khusus Wi-Fi tanpa teleponi tidak akan mengiklankan `sms.send`.

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

- `device.apps` harus diaktifkan secara eksplisit dan secara default mengembalikan aplikasi yang terlihat di launcher.
- Perintah gerak dibatasi oleh kapabilitas berdasarkan sensor yang tersedia.

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
- Eksekusi shell sekarang berjalan melalui alat `exec` dengan `host=node`; `nodes` tetap menjadi permukaan RPC langsung untuk perintah node eksplisit.
- `nodes invoke` tidak mengekspos `system.run` atau `system.run.prepare`; keduanya tetap hanya berada di jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah
  persetujuan diberikan, Gateway meneruskan rencana tersimpan itu, bukan field
  command/cwd/session yang diedit pemanggil kemudian.
- `system.notify` menghormati status izin notifikasi pada aplikasi macOS.
- Metadata node `platform` / `deviceFamily` yang tidak dikenali menggunakan allowlist default konservatif yang mengecualikan `system.run` dan `system.which`. Jika Anda sengaja memerlukan perintah tersebut untuk platform yang tidak dikenal, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` yang dicakup permintaan dikurangi menjadi allowlist eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu-izinkan dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam, bukan path wrapper. Jika membuka wrapper tidak aman, tidak ada entri allowlist yang dipertahankan secara otomatis.
- Pada host node Windows dalam mode allowlist, eksekusi wrapper shell melalui `cmd.exe /c` memerlukan persetujuan (entri allowlist saja tidak otomatis mengizinkan bentuk wrapper).
- `system.notify` mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Host node mengabaikan override `PATH` dan menghapus kunci startup/shell yang berbahaya (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Jika Anda memerlukan entri PATH tambahan, konfigurasikan lingkungan layanan host node (atau instal alat di lokasi standar), bukan meneruskan `PATH` melalui `--env`.
- Pada mode node macOS, `system.run` dibatasi oleh persetujuan exec di aplikasi macOS (Settings → Exec approvals).
  Ask/allowlist/full berperilaku sama seperti host node headless; prompt yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host node headless, `system.run` dibatasi oleh persetujuan exec (`~/.openclaw/exec-approvals.json`).

## Pengikatan node exec

Ketika beberapa node tersedia, Anda dapat mengikat exec ke node tertentu.
Ini menetapkan node default untuk `exec host=node` (dan dapat ditimpa per agent).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agen:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Batalkan pengaturan agar node apa pun dapat digunakan:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Peta izin

Node dapat menyertakan peta `permissions` di `node.list` / `node.describe`, dengan kunci berupa nama izin (misalnya `screenRecording`, `accessibility`) dan nilai boolean (`true` = diberikan).

## Host node headless (lintas platform)

OpenClaw dapat menjalankan **host node headless** (tanpa UI) yang terhubung ke WebSocket Gateway dan mengekspos `system.run` / `system.which`. Ini berguna di Linux/Windows atau untuk menjalankan node minimal berdampingan dengan server.

Mulai:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pemasangan masih diperlukan (Gateway akan menampilkan prompt pemasangan perangkat).
- Host node menyimpan id node, token, nama tampilan, dan info koneksi gateway di `~/.openclaw/node.json`.
- Persetujuan exec diberlakukan secara lokal melalui `~/.openclaw/exec-approvals.json`
  (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Di macOS, host node headless menjalankan `system.run` secara lokal secara default. Atur
  `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan
  `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan gagal tertutup jika tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` saat WS Gateway menggunakan TLS.

## Mode node Mac

- Aplikasi menubar macOS terhubung ke server WS Gateway sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode jarak jauh, aplikasi membuka tunnel SSH untuk port Gateway dan terhubung ke `localhost`.
