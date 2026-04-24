---
read_when:
    - Mengimplementasikan atau memperbarui klien WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-24T09:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol Gateway (WebSocket)

Protokol WS Gateway adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan menyatakan **role** + **scope** mereka pada
saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat akan memancarkan peristiwa `payload.large`
  sebelum gateway menutup atau membuang frame yang terdampak. Peristiwa ini menyimpan
  ukuran, batas, surface, dan kode alasan yang aman. Peristiwa ini tidak menyimpan body pesan,
  isi lampiran, body frame mentah, token, cookie, atau nilai secret.

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
melaporkan role/scope yang dinegosiasikan saat tersedia, dan menyertakan `deviceToken`
saat gateway menerbitkannya.

Saat tidak ada device token yang diterbitkan, `hello-ok.auth` tetap dapat melaporkan
izin yang dinegosiasikan:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Saat device token diterbitkan, `hello-ok` juga menyertakan:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama trusted bootstrap handoff, `hello-ok.auth` juga dapat menyertakan entri role
tambahan yang dibatasi di `deviceTokens`:

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
`scopes: []` dan token operator hasil handoff tetap dibatasi pada allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
menggunakan prefiks role: entri operator hanya memenuhi permintaan operator, dan
role non-operator tetap memerlukan scope di bawah prefiks role mereka sendiri.

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **idempotency key** (lihat skema).

## Role + scope

### Role

- `operator` = klien control plane (CLI/UI/otomatisasi).
- `node` = host kapabilitas (camera/screen/canvas/system.run).

### Scope (operator)

Scope umum:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets`
(atau `operator.admin`).

Metode RPC gateway yang didaftarkan Plugin dapat meminta scope operatornya sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu di-resolve ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa slash command yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, penulisan
persisten `/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan pada saat persetujuan di atas
scope metode dasarnya:

- permintaan tanpa command: `operator.pairing`
- permintaan dengan command node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node menyatakan klaim kapabilitas pada saat connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist di sisi server.

## Presence

- `system-presence` mengembalikan entri yang diberi kunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node**.

## Cakupan peristiwa broadcast

Peristiwa broadcast WebSocket yang didorong server dibatasi oleh scope sehingga sesi dengan scope pairing atau sesi khusus node tidak secara pasif menerima konten sesi.

- **Frame chat, agen, dan hasil tool** (termasuk peristiwa `agent` yang di-stream dan hasil pemanggilan tool) memerlukan minimal `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan Plugin** dibatasi ke `operator.write` atau `operator.admin`, bergantung pada cara Plugin mendaftarkannya.
- **Peristiwa status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi yang telah diautentikasi.
- **Keluarga peristiwa broadcast yang tidak dikenal** dibatasi oleh scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urutan per-kliennya sendiri sehingga broadcast mempertahankan urutan monoton pada socket tersebut bahkan ketika klien yang berbeda melihat subset aliran peristiwa yang berbeda karena filter scope.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` plus ekspor metode
Plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi lengkap dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang disimpan di cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama peristiwa, jumlah, ukuran byte, pembacaan memori, state antrean/sesi, nama channel/Plugin, dan id sesi. Ini tidak menyimpan teks chat, body webhook, output tool, body request atau response mentah, token, cookie, atau nilai secret. Scope operator read diperlukan.
    - `status` mengembalikan ringkasan gateway gaya `/status`; field sensitif hanya disertakan untuk klien operator dengan scope admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan peristiwa Heartbeat persisten terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada gateway.
  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya agregat untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk workspace agen default aktif.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan usage timeseries untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.
  </Accordion>

  <Accordion title="Channel dan helper login">
    - `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + Plugin bawaan.
    - `channels.logout` melakukan logout channel/akun tertentu ketika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web aktif yang mendukung QR saat ini.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel jika berhasil.
    - `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
    - `voicewake.get` mengembalikan trigger wake-word yang tersimpan.
    - `voicewake.set` memperbarui trigger wake-word dan menyiarkan perubahannya.
  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar chat runner.
    - `logs.tail` mengembalikan tail file log gateway yang dikonfigurasi dengan kontrol cursor/limit dan max-byte.
  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.config` mengembalikan payload config Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.mode` menetapkan/menyiarkan state mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.speak` mensintesis ucapan melalui provider ucapan Talk aktif.
    - `tts.status` mengembalikan state TTS aktif, provider aktif, provider fallback, dan state config provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan state preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS yang diutamakan.
    - `tts.convert` menjalankan konversi text-to-speech satu kali.
  </Accordion>

  <Accordion title="Secret, config, update, dan wizard">
    - `secrets.reload` me-resolve ulang SecretRef aktif dan menukar state secret runtime hanya jika seluruh proses berhasil.
    - `secrets.resolve` me-resolve penetapan secret target-perintah untuk set perintah/target tertentu.
    - `config.get` mengembalikan snapshot config saat ini dan hash-nya.
    - `config.set` menulis payload config yang telah divalidasi.
    - `config.patch` menggabungkan pembaruan config parsial.
    - `config.apply` memvalidasi + mengganti payload config penuh.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh tooling Control UI dan CLI: schema, `uiHints`, versi, dan metadata generasi, termasuk metadata skema Plugin + channel saat runtime dapat memuatnya. Skema tersebut mencakup metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama yang digunakan UI, termasuk cabang komposisi objek bertingkat, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup yang dicakup path untuk satu path config: path yang dinormalisasi, node schema dangkal, hint yang cocok + `hintPath`, dan ringkasan child langsung untuk drill-down UI/CLI. Node schema lookup mempertahankan dokumentasi yang ditujukan ke pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` yang dinormalisasi, `type`, `required`, `hasChildren`, plus `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya jika pembaruannya sendiri berhasil.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos onboarding wizard melalui WS RPC.
  </Accordion>

  <Accordion title="Helper agen dan workspace">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan wiring workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file bootstrap workspace yang diekspos untuk sebuah agen.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal saat tersedia.
  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interrupt-and-steer untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi.
    - `sessions.patch` memperbarui metadata/override sesi.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi lengkap yang tersimpan.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag directive inline dihapus dari teks yang terlihat, payload XML pemanggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan tool yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token senyap murni seperti `NO_REPLY` / `no_reply` yang persis sama dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat yang dipasangkan dan disetujui yang masih tertunda maupun yang sudah disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pairing perangkat.
    - `device.token.rotate` memutar token perangkat yang dipasangkan dalam batas role dan scope yang telah disetujui.
    - `device.token.revoke` mencabut token perangkat yang dipasangkan.
  </Accordion>

  <Accordion title="Pairing node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan state node yang diketahui/terhubung.
    - `node.rename` memperbarui label node yang dipasangkan.
    - `node.invoke` meneruskan perintah ke node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa peristiwa yang berasal dari node kembali ke gateway.
    - `node.canvas.capability.refresh` menyegarkan token kapabilitas canvas yang dicakup.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean node yang terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk node offline/terputus.
  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan ditambah lookup/replay persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan akhir (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node melalui perintah relay node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan Plugin.
  </Accordion>

  <Accordion title="Otomasi, Skills, dan tool">
    - Otomasi: `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan tool: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Keluarga peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat khusus transkrip
  lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran peristiwa untuk sesi
  yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: peristiwa keepalive / liveness periodik.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran peristiwa Heartbeat.
- `cron`: peristiwa perubahan run/pekerjaan cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: broadcast permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: config trigger wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup
  persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup
  persetujuan Plugin.

### Metode helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris
  perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol surface mana yang ditargetkan `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar provider
      saat tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar provider saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus ketersediaan
    perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah
  agen. Respons mencakup tool yang dikelompokkan dan metadata provenance:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin saat `source="plugin"`
  - `optional`: apakah tool Plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau konteks pengiriman yang diberikan pemanggil.
  - Respons dicakup ke sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, Plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instalasi yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata discovery ClawHub.
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

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator me-resolve dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi yang kanonis). Permintaan tanpa `systemRunPlan` akan ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan final `system.run` yang telah disetujui, gateway
  akan menolak run tersebut alih-alih mempercayai payload yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi khusus sesi saat tidak ada rute pengiriman eksternal yang dapat di-resolve (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Versioning

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Schema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilainya
stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout request (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp fast-retry setelah penutupan device-token | `250` ms                                        | `src/gateway/client.ts`                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Penutupan karena tick-timeout             | kode `4000` saat diam melebihi `tickIntervalMs * 2`   | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus mematuhi nilai-nilai tersebut
alih-alih default pra-handshake.

## Auth

- Auth gateway shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header request alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` sepenuhnya melewati auth connect shared-secret;
  jangan ekspos mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **device token** yang dicakup ke role + scope
  koneksi. Token itu dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  disimpan oleh klien untuk koneksi berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah setiap connect yang berhasil.
- Reconnect dengan **device token tersimpan** tersebut juga harus menggunakan kembali set scope tersimpan
  yang telah disetujui untuk token itu. Ini mempertahankan akses read/probe/status
  yang sudah diberikan dan mencegah reconnect diam-diam menyempit menjadi
  scope implisit khusus admin yang lebih sempit.
- Perakitan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat diatur.
  - `auth.token` diisi menurut urutan prioritas: shared token eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per-perangkat tersimpan (diberi kunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya bila tidak ada hal di atas yang me-resolve
    `auth.token`. Shared token atau device token ter-resolve apa pun akan menekannya.
  - Auto-promotion device token tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri `hello-ok.auth.deviceTokens` tambahan adalah token bootstrap handoff.
  Simpan hanya saat connect menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/local pairing.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, maka
  set scope yang diminta pemanggil itu tetap menjadi otoritas; scope cache hanya
  digunakan kembali saat klien menggunakan kembali token per-perangkat yang tersimpan.
- Device token dapat diputar/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada set role yang disetujui dan tercatat dalam
  entri pairing perangkat tersebut; memutar token tidak dapat memperluas perangkat ke
  role yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipasangkan, pengelolaan perangkat dicakup ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat
  menghapus/mencabut/memutar entri perangkat **miliknya sendiri**.
- `device.token.rotate` juga memeriksa set scope operator yang diminta terhadap
  scope sesi pemanggil saat ini. Pemanggil non-admin tidak dapat memutar token menjadi
  set scope operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth mencakup `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per-perangkat yang di-cache.
  - Jika retry itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk `device.id` baru kecuali auto-approval lokal
  diaktifkan.
- Auto-approval pairing berpusat pada connect loopback lokal langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Connect tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI dapat menghilangkannya hanya dalam mode ini:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan yang parah).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang diberikan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Makna                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien tidak menyertakan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce lama/salah.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Stempel waktu yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.              |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata
  perangkat yang dipasangkan tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional mem-pin fingerprint sertifikat gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway penuh** (status, channel, model, chat,
agen, sesi, node, persetujuan, dll.). Surface pastinya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Bridge protocol](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
