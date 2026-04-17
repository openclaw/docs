---
read_when:
    - Mengimplementasikan atau memperbarui klien WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-17T09:14:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol Gateway (WebSocket)

Protokol WS Gateway adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **peran** + **cakupan**
mereka pada saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.

## Handshake (connect)

Gateway → Klien (tantangan pra-koneksi):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klien → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Klien:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, dan `policy` semuanya wajib menurut skema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` bersifat opsional. `auth`
melaporkan peran/cakupan yang dinegosiasikan saat tersedia, dan menyertakan `deviceToken`
saat gateway menerbitkannya.

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` masih dapat melaporkan
izin yang dinegosiasikan:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Saat token perangkat diterbitkan, `hello-ok` juga menyertakan:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri peran
tambahan yang dibatasi dalam `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Untuk alur bootstrap node/operator bawaan, token node utama tetap
`scopes: []` dan token operator yang di-handoff tetap dibatasi pada daftar izin operator bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan cakupan bootstrap tetap
berawalan peran: entri operator hanya memenuhi permintaan operator, dan peran
non-operator tetap memerlukan cakupan di bawah awalan perannya sendiri.

### Contoh node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **kunci idempotensi** (lihat skema).

## Peran + cakupan

### Peran

- `operator` = klien control plane (CLI/UI/otomasi).
- `node` = host kapabilitas (camera/screen/canvas/system.run).

### Cakupan (operator)

Cakupan umum:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets`
(atau `operator.admin`).

Metode RPC gateway yang didaftarkan Plugin dapat meminta cakupan operatornya sendiri, tetapi
awalan admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diresolusikan ke `operator.admin`.

Cakupan metode hanyalah gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Sebagai
contoh, penulisan persisten `/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan cakupan tambahan pada saat persetujuan di atas
cakupan metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat waktu connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: daftar izin perintah untuk invoke.
- `permissions`: toggle terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan daftar izin di sisi server.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci oleh identitas perangkat.
- Entri kehadiran mencakup `deviceId`, `roles`, dan `scopes` agar UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node**.

## Keluarga metode RPC umum

Halaman ini bukan dump penuh yang dihasilkan, tetapi permukaan WS publik lebih luas
daripada contoh handshake/auth di atas. Ini adalah keluarga metode utama yang
diekspose Gateway saat ini.

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode Plugin/channel yang dimuat.
Perlakukan ini sebagai penemuan fitur, bukan sebagai dump yang dihasilkan dari setiap helper yang dapat dipanggil
yang diimplementasikan di `src/gateway/server-methods/*.ts`.

### Sistem dan identitas

- `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
- `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif
  disertakan hanya untuk klien operator dengan cakupan admin.
- `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan
  pairing.
- `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat
  operator/node yang terhubung.
- `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks
  kehadiran.
- `last-heartbeat` mengembalikan event Heartbeat persisten terbaru.
- `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada gateway.

### Model dan penggunaan

- `models.list` mengembalikan katalog model yang diizinkan saat runtime.
- `usage.status` mengembalikan ringkasan jendela penggunaan/kuota tersisa penyedia.
- `usage.cost` mengembalikan ringkasan penggunaan biaya agregat untuk rentang tanggal.
- `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk
  workspace agen default yang aktif.
- `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
- `sessions.usage.timeseries` mengembalikan deret waktu penggunaan untuk satu sesi.
- `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

### Channel dan helper login

- `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + bundled.
- `channels.logout` logout dari channel/akun tertentu jika channel tersebut
  mendukung logout.
- `web.login.start` memulai alur login QR/web untuk penyedia channel web
  saat ini yang mendukung QR.
- `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai
  channel jika berhasil.
- `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
- `voicewake.get` mengembalikan pemicu wake word yang tersimpan.
- `voicewake.set` memperbarui pemicu wake word dan menyiarkan perubahannya.

### Pesan dan log

- `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke
  channel/akun/thread di luar chat runner.
- `logs.tail` mengembalikan tail file-log gateway yang dikonfigurasi dengan cursor/limit dan
  kontrol byte maksimum.

### Talk dan TTS

- `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets`
  memerlukan `operator.talk.secrets` (atau `operator.admin`).
- `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien
  WebChat/Control UI.
- `talk.speak` mensintesis ucapan melalui penyedia speech Talk yang aktif.
- `tts.status` mengembalikan status TTS aktif, penyedia aktif, penyedia fallback,
  dan status konfigurasi penyedia.
- `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
- `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
- `tts.setProvider` memperbarui penyedia TTS pilihan.
- `tts.convert` menjalankan konversi text-to-speech sekali jalan.

### Secret, config, update, dan wizard

- `secrets.reload` me-resolve ulang SecretRef aktif dan menukar state secret runtime
  hanya jika sepenuhnya berhasil.
- `secrets.resolve` me-resolve penetapan secret target perintah untuk
  kumpulan perintah/target tertentu.
- `config.get` mengembalikan snapshot config saat ini dan hash-nya.
- `config.set` menulis payload config yang tervalidasi.
- `config.patch` menggabungkan pembaruan config parsial.
- `config.apply` memvalidasi + mengganti seluruh payload config.
- `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan
  tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk
  metadata skema Plugin + channel saat runtime dapat memuatnya. Skema ini
  mencakup metadata field `title` / `description` yang diturunkan dari label yang sama
  dan teks bantuan yang digunakan oleh UI, termasuk object bertingkat, wildcard, item array,
  dan cabang komposisi `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok
  tersedia.
- `config.schema.lookup` mengembalikan payload lookup berbatas path untuk satu path config:
  path yang dinormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan
  ringkasan child langsung untuk drill-down UI/CLI.
  - Node skema lookup mempertahankan dokumen yang menghadap pengguna dan field validasi umum:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    batas numerik/string/array/object, dan flag boolean seperti
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Ringkasan child mengekspose `key`, `path` yang dinormalisasi, `type`, `required`,
    `hasChildren`, ditambah `hint` / `hintPath` yang cocok.
- `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya jika
  pembaruan itu sendiri berhasil.
- `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspose
  wizard onboarding melalui WS RPC.

### Keluarga utama yang sudah ada

#### Helper agen dan workspace

- `agents.list` mengembalikan entri agen yang dikonfigurasi.
- `agents.create`, `agents.update`, dan `agents.delete` mengelola rekaman agen dan
  wiring workspace.
- `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace
  bootstrap yang diekspose untuk sebuah agen.
- `agent.identity.get` mengembalikan identitas asisten efektif untuk sebuah agen atau
  sesi.
- `agent.wait` menunggu sebuah run selesai dan mengembalikan snapshot terminal saat
  tersedia.

#### Kontrol sesi

- `sessions.list` mengembalikan indeks sesi saat ini.
- `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan
  event perubahan sesi untuk klien WS saat ini.
- `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan
  langganan event transkrip/pesan untuk satu sesi.
- `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk key sesi
  tertentu.
- `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
- `sessions.create` membuat entri sesi baru.
- `sessions.send` mengirim pesan ke sesi yang sudah ada.
- `sessions.steer` adalah varian interrupt-and-steer untuk sesi aktif.
- `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi.
- `sessions.patch` memperbarui metadata/override sesi.
- `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan
  pemeliharaan sesi.
- `sessions.get` mengembalikan baris sesi tersimpan lengkap.
- eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan
  `chat.inject`.
- `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline
  dihapus dari teks yang terlihat, payload XML panggilan tool dalam plain-text (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok panggilan tool yang terpotong) serta token kontrol model ASCII/full-width yang bocor
  dihapus, baris asisten token senyap murni seperti `NO_REPLY` /
  `no_reply` yang persis cocok dihilangkan, dan baris yang terlalu besar dapat diganti
  dengan placeholder.

#### Pairing perangkat dan token perangkat

- `device.pair.list` mengembalikan perangkat berpasangan yang tertunda dan yang disetujui.
- `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola
  rekaman pairing perangkat.
- `device.token.rotate` merotasi token perangkat berpasangan dalam batas peran
  dan cakupan yang telah disetujui.
- `device.token.revoke` mencabut token perangkat berpasangan.

#### Pairing node, invoke, dan pekerjaan tertunda

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan
  verifikasi bootstrap.
- `node.list` dan `node.describe` mengembalikan status node yang diketahui/terhubung.
- `node.rename` memperbarui label node berpasangan.
- `node.invoke` meneruskan perintah ke node yang terhubung.
- `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
- `node.event` membawa event yang berasal dari node kembali ke gateway.
- `node.canvas.capability.refresh` me-refresh token kapabilitas canvas yang dibatasi cakupan.
- `node.pending.pull` dan `node.pending.ack` adalah API antrean node yang terhubung.
- `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama
  untuk node offline/tidak terhubung.

#### Keluarga approval

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan
  `exec.approval.resolve` mencakup permintaan approval exec sekali jalan plus
  lookup/replay approval tertunda.
- `exec.approval.waitDecision` menunggu satu approval exec yang tertunda dan mengembalikan
  keputusan final (atau `null` saat timeout).
- `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan approval exec
  gateway.
- `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan approval exec lokal node
  melalui perintah relay node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup
  alur approval yang didefinisikan Plugin.

#### Keluarga utama lainnya

- otomasi:
  - `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat lain yang hanya untuk transkrip.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran event untuk sesi yang
  dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: event keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran event Heartbeat.
- `cron`: event perubahan job/run Cron.
- `shutdown`: notifikasi gateway shutdown.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: siaran permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat berpasangan.
- `voicewake.changed`: config pemicu wake word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup
  approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup approval Plugin.

### Metode helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia
      saat tersedia
  - `textAliases` membawa alias slash yang persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia saat tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native ditambah ketersediaan
    perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah
  agen. Respons mencakup tool yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server, bukan menerima
    auth atau konteks pengiriman yang disuplai pemanggil.
  - Respons dibatasi pada sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang belum terpenuhi, pemeriksaan config, dan
    opsi install yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` memasang folder
    skill ke direktori `skills/` workspace agen default.
  - Mode installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di
    workspace agen default.
  - Mode config menambal nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Approval exec

- Saat permintaan exec memerlukan approval, gateway menyiarkan `exec.approval.requested`.
- Klien operator me-resolve dengan memanggil `exec.approval.resolve` (memerlukan cakupan `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (metadata `argv`/`cwd`/`rawCommand`/sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` akan ditolak.
- Setelah approval, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan `system.run` final yang disetujui, gateway
  menolak eksekusi alih-alih memercayai payload yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi hanya-sesi saat tidak ada rute pengiriman eksternal yang dapat di-resolve (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilai-nilai ini
stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp retry cepat setelah penutupan device-token | `250` ms                                      | `src/gateway/client.ts`                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Interval tick default (pra `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Penutupan karena timeout tick             | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus mematuhi nilai tersebut
alih-alih default pra-handshake.

## Auth

- Autentikasi gateway dengan shared secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau `gateway.auth.mode: "trusted-proxy"`
  non-loopback memenuhi pemeriksaan auth connect dari header permintaan,
  bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` untuk private-ingress sepenuhnya melewati auth connect berbasis shared secret;
  jangan ekspose mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dibatasi ke peran + cakupan
  koneksi. Token ini dikembalikan di `hello-ok.auth.deviceToken` dan harus
  dipersistenkan oleh klien untuk koneksi berikutnya.
- Klien harus mempersistenkan `hello-ok.auth.deviceToken` utama setelah setiap
  koneksi berhasil.
- Saat terhubung ulang dengan token perangkat yang **tersimpan** itu, klien juga harus
  menggunakan kembali kumpulan cakupan tersetujui yang tersimpan untuk token tersebut. Ini mempertahankan
  akses baca/probe/status yang sudah diberikan dan mencegah reconnect diam-diam menyusut ke
  cakupan implicit admin-only yang lebih sempit.
- Perakitan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi dalam urutan prioritas: shared token eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya saat tidak satu pun dari yang di atas menghasilkan
    `auth.token`. Shared token atau token perangkat apa pun yang berhasil di-resolve akan menekannya.
  - Auto-promotion token perangkat tersimpan pada retry sekali jalan
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Persistenkan hanya jika koneksi menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/local pairing.
- Jika klien menyuplai `deviceToken` **eksplisit** atau `scopes` eksplisit, kumpulan cakupan
  yang diminta pemanggil tersebut tetap menjadi otoritatif; cakupan cache hanya
  digunakan kembali saat klien menggunakan ulang token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada kumpulan peran tersetujui yang tercatat dalam
  entri pairing perangkat tersebut; merotasi token tidak dapat memperluas perangkat ke
  peran yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat berpasangan, manajemen perangkat dibatasi ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat
  menghapus/mencabut/merotasi entri perangkat **miliknya sendiri**.
- `device.token.rotate` juga memeriksa kumpulan cakupan operator yang diminta terhadap
  cakupan sesi pemanggil saat ini. Pemanggil non-admin tidak dapat merotasi token ke
  kumpulan cakupan operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per perangkat yang di-cache.
  - Jika retry itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali auto-approval lokal
  diaktifkan.
- Auto-approval pairing berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur self-connect backend/kontainer-lokal yang sempit untuk
  alur helper shared secret tepercaya.
- Koneksi tailnet atau LAN host yang sama tetap diperlakukan sebagai koneksi remote untuk pairing dan
  memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI hanya dapat menghilangkannya dalam mode ini:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan yang parah).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang diberikan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                                |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien tidak menyertakan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang basi/salah.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.               |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata perangkat berpasangan
  tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional mem-pin fingerprint sertifikat gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway lengkap** (status, channel, model, chat,
agent, sesi, node, approval, dll.). Permukaan tepatnya didefinisikan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.
