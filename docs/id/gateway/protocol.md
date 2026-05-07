---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-05-07T13:18:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol adalah **satu control plane + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **peran** + **cakupan** mereka saat
handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame sebelum koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event `payload.large`
  sebelum gateway menutup atau menjatuhkan frame yang terdampak. Event ini menyimpan
  ukuran, batas, surface, dan kode alasan yang aman. Event ini tidak menyimpan isi
  pesan, isi lampiran, isi frame mentah, token, cookie, atau nilai rahasia.

## Handshake (connect)

Gateway → Klien (tantangan sebelum koneksi):

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
    "minProtocol": 4,
    "maxProtocol": 4,
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
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Saat Gateway masih menyelesaikan startup sidecar, permintaan `connect` dapat
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason` diatur ke
`"startup-sidecars"` dan `retryAfterMs`. Klien harus mencoba ulang respons itu
dalam keseluruhan anggaran koneksi mereka, alih-alih menampilkannya sebagai kegagalan
handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
peran/cakupan yang dinegosiasikan. `pluginSurfaceUrls` bersifat opsional dan memetakan nama surface
Plugin, seperti `canvas`, ke URL yang dihosting dengan cakupan.

URL surface Plugin bercakupan dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima entri baru
di `pluginSurfaceUrls`. Refaktor Plugin Canvas eksperimental tidak
mendukung jalur kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah tidak digunakan; klien native dan
gateway saat ini harus menggunakan surface Plugin.

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan izin yang dinegosiasikan
tanpa field token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Klien backend same-process tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung saat
mereka diautentikasi dengan token/kata sandi gateway bersama. Jalur ini dicadangkan
untuk RPC control-plane internal dan mencegah baseline pairing CLI/perangkat yang basi
memblokir pekerjaan backend lokal seperti pembaruan sesi subagen. Klien jarak jauh,
klien origin browser, klien node, serta klien token perangkat/identitas perangkat eksplisit
tetap menggunakan pemeriksaan pairing dan peningkatan cakupan normal.

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
peran terbatas tambahan di `deviceTokens`:

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
`scopes: []` dan token operator apa pun yang diserahkan tetap dibatasi pada allowlist operator
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan cakupan bootstrap tetap
berprefiks peran: entri operator hanya memenuhi permintaan operator, dan peran non-operator
tetap membutuhkan cakupan di bawah prefiks perannya sendiri.

### Contoh Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

## Pembingkaian

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode dengan efek samping memerlukan **kunci idempotensi** (lihat skema).

## Peran + cakupan

Untuk model cakupan operator lengkap, pemeriksaan saat persetujuan, dan semantik
rahasia bersama, lihat [Cakupan operator](/id/gateway/operator-scopes).

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

Metode RPC Gateway yang didaftarkan Plugin dapat meminta cakupan operatornya sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diresolve ke `operator.admin`.

Cakupan metode hanyalah gerbang pertama. Beberapa perintah slash yang dijangkau melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, penulisan
`/config set` dan `/config unset` persisten memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan cakupan tambahan saat persetujuan di atas
cakupan metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat koneksi:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` agar UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node** sekaligus.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi mereka saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang sudah dipairing juga dapat melaporkan
  presence latar belakang yang tahan lama saat event node tepercaya memperbarui metadata pairing mereka.

### Event alive latar belakang Node

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang sudah dipairing
hidup selama wake latar belakang tanpa menandainya terhubung.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, atau `connect`. String trigger yang tidak dikenal dinormalisasi ke
`background` oleh gateway sebelum persistensi. Event ini hanya tahan lama untuk sesi perangkat node
yang terautentikasi; sesi tanpa perangkat atau belum dipairing mengembalikan `handled: false`.

Gateway yang berhasil mengembalikan hasil terstruktur:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway lama mungkin masih mengembalikan `{ "ok": true }` untuk `node.event`; klien harus memperlakukannya sebagai
RPC yang diakui, bukan sebagai persistensi presence yang tahan lama.

## Pencakupan event broadcast

Event broadcast WebSocket yang didorong server diberi gerbang cakupan agar sesi bercakupan pairing atau khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agen, dan hasil tool** (termasuk event `agent` yang distream dan hasil pemanggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan Plugin** digerbangkan ke `operator.write` atau `operator.admin`, bergantung pada cara Plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi yang terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** diberi gerbang cakupan secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urutan per kliennya sendiri sehingga broadcast mempertahankan pengurutan monotonik pada socket tersebut bahkan saat klien yang berbeda melihat subset berbeda yang difilter berdasarkan cakupan dari stream event.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` ditambah ekspor metode
Plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi lengkap
dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, hitungan, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/Plugin, dan id sesi. Ini tidak menyimpan teks chat, body webhook, output tool, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan event heartbeat terakhir yang dipersisten.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat pada gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Berikan `{ "view": "configured" }` untuk model terkonfigurasi berukuran pemilih (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor / embedding cache untuk workspace agen default aktif. Berikan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping provider embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM yang terbatas dan hanya baca untuk klien control-plane jarak jauh. Ini dapat menyertakan path workspace, cuplikan memori, markdown berlandasan yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan pembantu login">
    - `channels.status` mengembalikan ringkasan status channel/plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan channel/akun tertentu jika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web berkemampuan QR saat ini.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel jika berhasil.
    - `push.test` mengirim push APNs uji ke node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Perpesanan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail log file Gateway yang dikonfigurasi dengan kontrol cursor/limit dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog provider Talk hanya baca untuk ucapan, transkripsi streaming, dan suara realtime. Ini mencakup ID provider, label, status terkonfigurasi, ID model/suara yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan rahasia provider atau mengubah config global.
    - `talk.config` mengembalikan payload config Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, memancarkan event `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi beserta event Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menggerakkan siklus hidup turn managed-room dengan penolakan turn usang sebelum state dibersihkan.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk interupsi berpagar VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool provider yang dipancarkan oleh sesi relay realtime milik Gateway.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan memancarkan event Talk terminal.
    - `talk.mode` menetapkan/menyiarkan state mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi provider realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki config, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool provider ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima ID run dan menunggu event siklus hidup chat normal sebelum mengirimkan hasil tool spesifik provider.
    - `talk.event` adalah satu-satunya channel event Talk untuk realtime, transkripsi, STT/TTS, managed-room, telephony, dan adaptor meeting.
    - `talk.speak` menyintesis ucapan melalui provider ucapan Talk aktif.
    - `tts.status` mengembalikan state TTS aktif, provider aktif, provider fallback, dan state config provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan/menonaktifkan state preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS pilihan.
    - `tts.convert` menjalankan konversi teks-ke-ucapan satu kali.

  </Accordion>

  <Accordion title="Rahasia, config, pembaruan, dan wizard">
    - `secrets.reload` menyelesaikan ulang SecretRef aktif dan menukar state rahasia runtime hanya jika berhasil sepenuhnya.
    - `secrets.resolve` menyelesaikan penugasan rahasia target-perintah untuk set perintah/target tertentu.
    - `config.get` mengembalikan snapshot dan hash config saat ini.
    - `config.set` menulis payload config yang tervalidasi.
    - `config.patch` menggabungkan pembaruan config parsial.
    - `config.apply` memvalidasi + mengganti payload config lengkap.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema plugin + channel ketika runtime dapat memuatnya. Skema mencakup metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama yang digunakan UI, termasuk cabang komposisi objek bertingkat, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi field yang cocok ada.
    - `config.schema.lookup` mengembalikan payload lookup berbasis path untuk satu path config: path ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan child langsung untuk penelusuran UI/CLI. Node skema lookup mempertahankan dokumentasi yang terlihat pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, beserta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` agar startup melanjutkan satu turn agen lanjutan melalui antrean kelanjutan restart. Pembaruan package-manager memaksa restart pembaruan yang tidak ditunda dan tanpa cooldown setelah pertukaran paket sehingga proses Gateway lama tidak terus lazy-loading dari pohon `dist` yang telah diganti.
    - `update.status` mengembalikan sentinel restart pembaruan cache terbaru, termasuk versi berjalan pasca-restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Pembantu agen dan workspace">
    - `agents.list` mengembalikan entri agen terkonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan wiring workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan provenance yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambil di sisi server.
    - `environments.list` dan `environments.status` mengekspos penemuan environment lokal Gateway dan node yang hanya baca untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan/menonaktifkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan/menonaktifkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi persis.
    - `sessions.resolve` menyelesaikan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat memberikan `key` beserta `runId` opsional, atau hanya memberikan `runId` untuk run aktif yang dapat diselesaikan Gateway ke sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang terselesaikan beserta `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token-senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat tertaut yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pemasangan perangkat.
    - `device.token.rotate` merotasi token perangkat tertaut dalam batas peran yang disetujui dan cakupan pemanggil.
    - `device.token.revoke` mencabut token perangkat tertaut dalam batas peran yang disetujui dan cakupan pemanggil.

  </Accordion>

  <Accordion title="Pemasangan node, pemanggilan, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pemasangan node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan state node yang dikenal/terhubung.
    - `node.rename` memperbarui label node tertaut.
    - `node.invoke` meneruskan perintah ke node terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari node kembali ke gateway.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk node offline/terputus.

  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan eksekusi sekali jalan serta pencarian/pemutaran ulang persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan eksekusi tertunda dan mengembalikan keputusan akhir (atau `null` saat waktu habis).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan eksekusi Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan eksekusi lokal Node melalui perintah relai Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan Plugin.

  </Accordion>

  <Accordion title="Otomasi, Skills, dan alat">
    - Otomasi: `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Keluarga peristiwa umum

- `chat`: pembaruan obrolan UI seperti `chat.inject` dan peristiwa obrolan
  khusus transkrip lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/stream peristiwa untuk
  sesi yang dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan stream peristiwa Heartbeat.
- `cron`: peristiwa perubahan proses/job Cron.
- `shutdown`: notifikasi penghentian Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan Node.
- `node.invoke.request`: siaran permintaan pemanggilan Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat terpasang.
- `voicewake.changed`: konfigurasi pemicu kata bangun berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan eksekusi.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan Plugin.

### Metode pembantu Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar terkini executable Skills
  untuk pemeriksaan izinkan otomatis.

### Metode pembantu operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris
  perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia
      saat tersedia
  - `textAliases` membawa alias garis miring persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus ketersediaan
    perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime untuk
  sebuah agen. Respons menyertakan alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin saat `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat yang efektif runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    konteks autentikasi atau pengiriman yang disediakan pemanggil.
  - Respons bersifat terbatas pada sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk alat inti, Plugin, dan kanal.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk memanggil satu alat yang tersedia melalui
  jalur kebijakan Gateway yang sama dengan `/tools/invoke`.
  - `name` wajib. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang diselesaikan harus cocok dengan
    `agentId`.
  - Respons adalah amplop yang menghadap SDK dengan `ok`, `toolName`, `output` opsional, dan field
    `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload alih-alih
    melewati pipeline kebijakan alat Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  Skills yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons menyertakan kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` memasang
    folder skill ke direktori `skills/` workspace agen default.
  - Mode penginstal Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host Gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak dalam
    workspace agen default.
  - Mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan; jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran pemilih. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang. Jika tidak, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya saat tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan pemilih model normal.

## Persetujuan eksekusi

- Saat permintaan eksekusi membutuhkan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikan dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah persetujuan, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks command/cwd/sesi otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara persiapan dan penerusan `system.run` akhir yang disetujui, Gateway
  menolak proses tersebut alih-alih memercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi khusus sesi saat tidak ada rute eksternal yang dapat dikirim yang bisa diselesaikan (misalnya sesi internal/webchat atau config multi-kanal yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilai
stabil di seluruh protokol v4 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Waktu habis permintaan (per RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Waktu habis praauth / challenge koneksi   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/klien terpasang) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp retry cepat setelah penutupan token perangkat | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Waktu habis default `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan karena waktu habis tick         | kode `4000` saat keheningan melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` yang efektif dalam `hello-ok`; klien sebaiknya menghormati nilai tersebut
alih-alih default sebelum handshake.

## Auth

- Autentikasi Gateway rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode autentikasi yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan autentikasi koneksi dari
  header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` untuk ingress privat melewati autentikasi koneksi
  rahasia bersama sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dicakupkan ke peran
  koneksi + cakupan. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  disimpan oleh klien untuk koneksi berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah setiap
  koneksi yang berhasil.
- Menghubungkan ulang dengan token perangkat yang **tersimpan** tersebut juga harus menggunakan kembali
  kumpulan cakupan tersetujui yang tersimpan untuk token itu. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari koneksi ulang diam-diam menyusut ke
  cakupan implisit yang lebih sempit, hanya admin.
- Penyusunan autentikasi koneksi sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan jika disetel.
  - `auth.token` diisi menurut urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat tersimpan (dikunci berdasarkan
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak satu pun di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang ditemukan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada percobaan ulang sekali pakai
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Simpan hanya ketika koneksi menggunakan autentikasi bootstrap pada transport tepercaya
  seperti `wss://` atau pairing loopback/lokal.
- Jika klien memasok `deviceToken` **eksplisit** atau `scopes` eksplisit, kumpulan
  cakupan yang diminta pemanggil tersebut tetap otoritatif; cakupan yang di-cache hanya
  digunakan kembali ketika klien menggunakan kembali token per perangkat tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Ini menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah terautentikasi dengan
  token perangkat tersebut, sehingga klien token-saja dapat menyimpan penggantinya sebelum
  menghubungkan ulang. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada kumpulan peran tersetujui
  yang tercatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang sudah dipairing, pengelolaan perangkat bersifat tercakup sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa kumpulan cakupan token operator
  target terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` beserta petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per perangkat yang di-cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop koneksi ulang otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pairing berpusat pada koneksi direct local loopback.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan serius).
  - RPC backend `gateway-client` direct-loopback yang diautentikasi dengan token/kata sandi
    Gateway bersama.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang stale/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikisasi kunci publik gagal.            |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan legacy `v2` tetap diterima untuk kompatibilitas, tetapi pinning metadata perangkat yang dipairing
  tetap mengontrol kebijakan perintah saat koneksi ulang.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien secara opsional dapat melakukan pin pada fingerprint sertifikat Gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API Gateway penuh** (status, kanal, model, chat,
agen, sesi, node, persetujuan, dll.). Permukaan tepatnya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
