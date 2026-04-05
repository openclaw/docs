---
read_when:
    - Mengimplementasikan atau memperbarui klien WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-05T13:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol gateway (WebSocket)

Protokol WS Gateway adalah **control plane + transport node tunggal** untuk
OpenClaw. Semua klien (CLI, UI web, app macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope** mereka saat
handshake.

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
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

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri
role tambahan yang dibatasi dalam `deviceTokens`:

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
`scopes: []` dan token operator yang di-handoff tetap dibatasi pada allowlist operator bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berawalan role: entri operator hanya memenuhi permintaan operator, dan role non-operator
tetap memerlukan scope di bawah prefiks role mereka sendiri.

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

Metode yang memiliki efek samping memerlukan **idempotency keys** (lihat skema).

## Roles + scopes

### Roles

- `operator` = klien control plane (CLI/UI/otomatisasi).
- `node` = host kapabilitas (camera/screen/canvas/system.run).

### Scopes (operator)

Scope umum:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets`
(atau `operator.admin`).

Metode RPC gateway yang didaftarkan plugin dapat meminta scope operatornya sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diresolusikan ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa slash command yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya,
penulisan persisten `/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan pada saat persetujuan di atas
scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat waktu connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist di sisi server.

## Presence

- `system-presence` mengembalikan entri yang diberi key oleh identitas perangkat.
- Entri presence mencakup `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat itu terhubung sebagai **operator** dan **node**.

## Keluarga metode RPC umum

Halaman ini bukan dump penuh yang dihasilkan, tetapi permukaan WS publik lebih luas
daripada contoh handshake/auth di atas. Ini adalah keluarga metode utama yang
diekspose Gateway saat ini.

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode plugin/channel yang dimuat.
Perlakukan ini sebagai penemuan fitur, bukan sebagai dump hasil generate dari setiap helper yang dapat dipanggil
yang diimplementasikan di `src/gateway/server-methods/*.ts`.

### Sistem dan identitas

- `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
- `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya
  disertakan untuk klien operator dengan scope admin.
- `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan
  pairing.
- `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
- `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan context
  presence.
- `last-heartbeat` mengembalikan event heartbeat tersimpan terbaru.
- `set-heartbeats` mengaktifkan/menonaktifkan pemrosesan heartbeat pada gateway.

### Model dan penggunaan

- `models.list` mengembalikan katalog model yang diizinkan runtime.
- `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
- `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
- `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk
  workspace agen default aktif.
- `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
- `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
- `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

### Channel dan helper login

- `channels.status` mengembalikan ringkasan status channel/plugin bawaan + terbundel.
- `channels.logout` melakukan logout dari channel/akun tertentu jika channel
  mendukung logout.
- `web.login.start` memulai alur login QR/web untuk provider channel web yang mampu menampilkan QR saat ini.
- `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai
  channel saat berhasil.
- `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
- `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
- `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

### Pesan dan log

- `send` adalah RPC pengiriman keluar langsung untuk
  pengiriman yang ditargetkan ke channel/akun/thread di luar chat runner.
- `logs.tail` mengembalikan tail log file gateway yang dikonfigurasi dengan kontrol cursor/limit dan
  byte maksimum.

### Talk dan TTS

- `talk.config` mengembalikan payload config Talk yang efektif; `includeSecrets`
  memerlukan `operator.talk.secrets` (atau `operator.admin`).
- `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien
  WebChat/Control UI.
- `talk.speak` mensintesis ucapan melalui provider speech Talk yang aktif.
- `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback,
  dan status config provider.
- `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
- `tts.enable` dan `tts.disable` mengubah status preferensi TTS.
- `tts.setProvider` memperbarui provider TTS yang diutamakan.
- `tts.convert` menjalankan konversi text-to-speech sekali jalan.

### Secrets, config, update, dan wizard

- `secrets.reload` meresolusikan ulang SecretRef aktif dan menukar status secret runtime
  hanya saat seluruh proses berhasil.
- `secrets.resolve` meresolusikan penetapan secret target-perintah untuk sekumpulan
  perintah/target tertentu.
- `config.get` mengembalikan snapshot dan hash config saat ini.
- `config.set` menulis payload config yang tervalidasi.
- `config.patch` menggabungkan pembaruan config parsial.
- `config.apply` memvalidasi + mengganti seluruh payload config.
- `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan
  tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk
  metadata skema plugin + channel saat runtime dapat memuatnya. Skema
  ini mencakup metadata field `title` / `description` yang diturunkan dari label yang sama
  dan teks bantuan yang digunakan UI, termasuk object bertingkat, wildcard, item array,
  dan cabang komposisi `anyOf` / `oneOf` / `allOf` saat dokumentasi
  field yang cocok tersedia.
- `config.schema.lookup` mengembalikan payload lookup yang dicakup path untuk satu path
  config: path yang dinormalisasi, node skema dangkal, petunjuk yang cocok + `hintPath`, dan
  ringkasan child langsung untuk drill-down UI/CLI.
  - Node skema lookup mempertahankan dokumentasi yang terlihat pengguna dan field validasi umum:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    batas numerik/string/array/object, dan flag boolean seperti
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Ringkasan child mengekspos `key`, `path` yang dinormalisasi, `type`, `required`,
    `hasChildren`, plus `hint` / `hintPath` yang cocok.
- `update.run` menjalankan alur pembaruan gateway dan menjadwalkan mulai ulang hanya saat
  pembaruan itu sendiri berhasil.
- `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos
  wizard onboarding melalui WS RPC.

### Keluarga utama yang sudah ada

#### Helper agen dan workspace

- `agents.list` mengembalikan entri agen yang dikonfigurasi.
- `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan
  pengkabelan workspace.
- `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file
  bootstrap workspace yang diekspos untuk sebuah agen.
- `agent.identity.get` mengembalikan identitas asisten yang efektif untuk agen atau
  sesi.
- `agent.wait` menunggu sebuah eksekusi selesai dan mengembalikan snapshot terminal saat
  tersedia.

#### Kontrol sesi

- `sessions.list` mengembalikan indeks sesi saat ini.
- `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan/menonaktifkan langganan event perubahan sesi untuk klien WS saat ini.
- `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan/menonaktifkan
  langganan event transkrip/pesan untuk satu sesi.
- `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk session key tertentu.
- `sessions.resolve` meresolusikan atau mengkanonisasi target sesi.
- `sessions.create` membuat entri sesi baru.
- `sessions.send` mengirim pesan ke sesi yang ada.
- `sessions.steer` adalah varian interrupt-and-steer untuk sesi yang aktif.
- `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi.
- `sessions.patch` memperbarui metadata/override sesi.
- `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
- `sessions.get` mengembalikan baris sesi tersimpan lengkap.
- eksekusi chat masih menggunakan `chat.history`, `chat.send`, `chat.abort`, dan
  `chat.inject`.
- `chat.history` dinormalisasi untuk tampilan pada klien UI: tag directive inline dihapus dari teks yang terlihat, payload XML pemanggilan tool teks biasa (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok pemanggilan tool yang terpotong) serta token kontrol model ASCII/lebar penuh yang bocor
  dihapus, baris asisten token-senyap murni seperti `NO_REPLY` /
  `no_reply` yang persis sama dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

#### Pairing perangkat dan token perangkat

- `device.pair.list` mengembalikan perangkat berpasangan yang tertunda dan disetujui.
- `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola
  catatan pairing perangkat.
- `device.token.rotate` merotasi token perangkat yang berpasangan di dalam batas role
  dan scope yang disetujui.
- `device.token.revoke` mencabut token perangkat yang berpasangan.

#### Pairing node, invoke, dan pekerjaan tertunda

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan verifikasi
  bootstrap.
- `node.list` dan `node.describe` mengembalikan status node yang diketahui/terhubung.
- `node.rename` memperbarui label node yang berpasangan.
- `node.invoke` meneruskan perintah ke node yang terhubung.
- `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
- `node.event` membawa event yang berasal dari node kembali ke gateway.
- `node.canvas.capability.refresh` menyegarkan token kapabilitas canvas yang dicakup.
- `node.pending.pull` dan `node.pending.ack` adalah API antrean node terhubung.
- `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama
  untuk node offline/terputus.

#### Keluarga persetujuan

- `exec.approval.request` dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan.
- `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan
  keputusan akhir (atau `null` saat timeout).
- `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
- `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node
  melalui perintah relay node.
- `plugin.approval.request`, `plugin.approval.waitDecision`, dan
  `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan plugin.

#### Keluarga utama lainnya

- otomatisasi:
  - `wake` menjadwalkan injeksi teks wake segera atau pada heartbeat berikutnya
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat lain yang hanya untuk transkrip.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran event untuk sesi yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: event keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran event heartbeat.
- `cron`: event perubahan eksekusi/pekerjaan cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: siaran permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat berpasangan.
- `voicewake.changed`: config pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah
  agen. Responsnya mencakup tool yang dikelompokkan dan metadata provenance:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan context runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau context pengiriman yang disediakan pemanggil.
  - Responsnya dicakup per sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool inti, plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat bagi sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Responsnya mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instalasi yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder
    skill ke direktori `skills/` workspace agen default.
  - Mode installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di
    workspace agen default.
  - Mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` ditolak.
- Setelah persetujuan, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai context perintah/cwd/sesi yang otoritatif.
- Jika pemanggil memodifikasi `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan akhir `system.run` yang disetujui, gateway menolak eksekusi tersebut alih-alih mempercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak teresolusikan atau hanya-internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi khusus-sesi saat tidak ada rute eksternal yang dapat dikirim yang dapat diresolusikan (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Auth gateway dengan shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, tergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau `gateway.auth.mode: "trusted-proxy"` non-loopback
  memenuhi pemeriksaan auth connect dari header permintaan alih-alih
  `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` sepenuhnya melewati auth connect shared-secret; jangan ekspos mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dicakup ke role + scope koneksi.
  Token itu dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  dipertahankan oleh klien untuk koneksi berikutnya.
- Klien harus mempertahankan `hello-ok.auth.deviceToken` utama setelah connect berhasil mana pun.
- Menyambung kembali dengan token perangkat **tersimpan** itu juga harus menggunakan kembali kumpulan scope tersimpan yang telah disetujui untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari runtuhnya penyambungan ulang secara diam-diam ke
  scope implicit admin-only yang lebih sempit.
- Prioritas auth connect normal adalah token/password bersama eksplisit terlebih dahulu, lalu
  `deviceToken` eksplisit, lalu token per-perangkat tersimpan, lalu token bootstrap.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Pertahankan token itu hanya saat connect menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau pairing loopback/lokal.
- Jika klien memasok **`deviceToken` eksplisit** atau `scopes` eksplisit, kumpulan
  scope yang diminta pemanggil itu tetap otoritatif; scope cache hanya digunakan kembali saat klien menggunakan kembali token per-perangkat tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada kumpulan role yang disetujui yang dicatat di
  entri pairing perangkat tersebut; merotasi token tidak dapat memperluas perangkat ke
  role yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat berpasangan, manajemen perangkat dicakup ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi entri perangkat **mereka sendiri**.
- `device.token.rotate` juga memeriksa kumpulan scope operator yang diminta terhadap
  scope sesi pemanggil saat ini. Pemanggil non-admin tidak dapat merotasi token ke kumpulan scope operator yang lebih luas daripada yang sudah mereka pegang.
- Kegagalan auth mencakup `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per-perangkat cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop penyambungan ulang otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk `device.id` baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pairing berpusat pada koneksi direct local loopback.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet atau LAN host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI hanya dapat menghilangkannya dalam mode berikut:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator `gateway.auth.mode: "trusted-proxy"` Control UI yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang basi/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Stempel waktu yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi public key gagal.                |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang mencakup nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata perangkat berpasangan tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien secara opsional dapat mem-pin fingerprint sertifikat gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway penuh** (status, channel, model, chat,
agen, sesi, node, persetujuan, dll.). Permukaan pastinya didefinisikan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.
