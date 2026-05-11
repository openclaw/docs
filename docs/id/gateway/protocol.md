---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-05-11T20:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Protokol Gateway WS adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  sebaiknya mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak. Event ini menyimpan
  ukuran, batas, surface, dan kode alasan yang aman. Event ini tidak menyimpan isi pesan,
  konten lampiran, isi frame mentah, token, cookie, atau nilai rahasia.

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

Saat Gateway masih menyelesaikan sidecar startup, permintaan `connect` dapat
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason` diatur ke
`"startup-sidecars"` dan `retryAfterMs`. Klien sebaiknya mencoba ulang respons itu
dalam anggaran koneksi keseluruhan mereka alih-alih menampilkannya sebagai kegagalan
handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
role/scope yang dinegosiasikan. `pluginSurfaceUrls` bersifat opsional dan memetakan nama surface
plugin, seperti `canvas`, ke URL yang di-host dengan scope.

URL surface plugin berscope dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima entri baru
di `pluginSurfaceUrls`. Refaktor Plugin Canvas eksperimental tidak mendukung
jalur kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah tidak digunakan; klien native dan
gateway saat ini harus menggunakan surface plugin.

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan
izin yang dinegosiasikan tanpa field token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Klien backend tepercaya dalam proses yang sama (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung saat
mereka melakukan autentikasi dengan token/kata sandi gateway bersama. Jalur ini dicadangkan
untuk RPC control-plane internal dan mencegah baseline pemasangan CLI/perangkat yang usang
memblokir pekerjaan backend lokal seperti pembaruan sesi subagent. Klien jarak jauh,
klien asal browser, klien node, dan klien token-perangkat/identitas-perangkat eksplisit
tetap menggunakan pemeriksaan pemasangan dan peningkatan scope normal.

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

Selama serah terima bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri role
terbatas tambahan di `deviceTokens`:

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
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berprefiks role: entri operator hanya memenuhi permintaan operator, dan role non-operator
tetap memerlukan scope di bawah prefiks role mereka sendiri.

### Contoh node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## Framing

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **kunci idempotensi** (lihat skema).

## Role + scope

Untuk model scope operator lengkap, pemeriksaan saat persetujuan, dan semantik shared-secret,
lihat [Scope operator](/id/gateway/operator-scopes).

### Role

- `operator` = klien control plane (CLI/UI/otomasi).
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

Metode RPC gateway yang didaftarkan plugin dapat meminta scope operator mereka sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diselesaikan ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, penulisan
`/config set` dan `/config unset` persisten memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat persetujuan di atas
scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat terhubung:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence mencakup `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan ketika perangkat terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi mereka saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipasangkan juga dapat melaporkan
  presence latar belakang yang tahan lama saat event node tepercaya memperbarui metadata pemasangan mereka.

### Event hidup latar belakang node

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang dipasangkan
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
yang terautentikasi; sesi tanpa perangkat atau tidak dipasangkan mengembalikan `handled: false`.

Gateway yang berhasil mengembalikan hasil terstruktur:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway lama mungkin masih mengembalikan `{ "ok": true }` untuk `node.event`; klien sebaiknya memperlakukannya sebagai
RPC yang diakui, bukan sebagai persistensi presence yang tahan lama.

## Penscope-an event broadcast

Event broadcast WebSocket yang didorong server diberi gerbang scope sehingga sesi berscope pemasangan atau hanya node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan hasil tool** (termasuk event `agent` yang dialirkan dan hasil pemanggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan plugin** diberi gerbang ke `operator.write` atau `operator.admin`, tergantung cara plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup koneksi/diskoneksi, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** diberi gerbang scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urutan per-kliennya sendiri sehingga broadcast mempertahankan pengurutan monotonik pada socket tersebut bahkan ketika klien yang berbeda melihat subset aliran event yang difilter scope secara berbeda.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` plus ekspor metode
plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi penuh
dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan id sesi. Ini tidak menyimpan teks chat, isi webhook, output tool, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Scope baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator berscope admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pemasangan.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan event heartbeat tersimpan terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat pada gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Teruskan `{ "view": "configured" }` untuk model terkonfigurasi berukuran pemilih (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan penyedia/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor / embedding cache untuk workspace agen default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping penyedia embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM yang terbatas dan hanya baca untuk klien control-plane jarak jauh. Ini dapat menyertakan path workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan pembantu login">
    - `channels.status` mengembalikan ringkasan status channel/plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan akun/channel tertentu ketika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk penyedia channel web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel jika berhasil.
    - `push.test` mengirim push APNs uji ke node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu kata bangun yang tersimpan.
    - `voicewake.set` memperbarui pemicu kata bangun dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail log file Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog penyedia Talk hanya baca untuk ucapan, transkripsi streaming, dan suara realtime. Ini mencakup id penyedia, label, status terkonfigurasi, id model/suara yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan rahasia penyedia atau mengubah konfigurasi global.
    - `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, memancarkan event `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi beserta event Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menggerakkan siklus hidup giliran managed-room dengan penolakan giliran basi sebelum status dibersihkan.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk interupsi yang dijaga VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool penyedia yang dipancarkan oleh sesi relay realtime milik Gateway. Teruskan `options: { willContinue: true }` untuk output tool sementara ketika hasil final akan menyusul, atau `options: { suppressResponse: true }` ketika hasil tool harus memenuhi panggilan penyedia tanpa memulai respons asisten realtime lain.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan memancarkan event Talk terminal.
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi penyedia realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki konfigurasi, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool penyedia ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima id run dan menunggu event siklus hidup chat normal sebelum mengirimkan hasil tool khusus penyedia.
    - `talk.event` adalah satu-satunya channel event Talk untuk realtime, transkripsi, STT/TTS, managed-room, teleponi, dan adaptor rapat.
    - `talk.speak` mensintesis ucapan melalui penyedia ucapan Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, penyedia aktif, penyedia fallback, dan status konfigurasi penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan/menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi teks-ke-ucapan sekali pakai.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wizard">
    - `secrets.reload` menyelesaikan ulang SecretRefs aktif dan menukar status rahasia runtime hanya jika sepenuhnya berhasil.
    - `secrets.resolve` menyelesaikan penetapan rahasia target perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot dan hash konfigurasi saat ini.
    - `config.set` menulis payload konfigurasi yang divalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial.
    - `config.apply` memvalidasi + mengganti payload konfigurasi lengkap.
    - `config.schema` mengembalikan payload skema konfigurasi live yang digunakan oleh tooling Control UI dan CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema plugin + channel ketika runtime dapat memuatnya. Skema mencakup metadata field `title` / `description` yang berasal dari label dan teks bantuan yang sama dengan yang digunakan UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi field yang cocok ada.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan path untuk satu path konfigurasi: path ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan anak langsung untuk drill-down UI/CLI. Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan anak mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, ditambah `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` sehingga startup melanjutkan satu giliran agen lanjutan melalui antrean kelanjutan restart. Pembaruan package manager memaksa restart pembaruan yang tidak ditangguhkan dan tanpa cooldown setelah penukaran paket sehingga proses Gateway lama tidak terus melakukan lazy-loading dari pohon `dist` yang telah diganti.
    - `update.status` mengembalikan sentinel restart pembaruan cache terbaru, termasuk versi berjalan pasca-restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Agen dan pembantu workspace">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola record agen dan penyambungan workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos ledger tugas Gateway ke klien SDK dan operator.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan provenance yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan tidak didukung alih-alih diambil di sisi server.
    - `environments.list` dan `environments.status` mengekspos penemuan environment lokal Gateway dan node yang hanya baca untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan/menonaktifkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan/menonaktifkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk key sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk key sesi yang persis.
    - `sessions.resolve` menyelesaikan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang diselesaikan beserta `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat masih menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag arahan inline dihapus dari teks yang terlihat, payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool terpotong) serta token kontrol model ASCII/lebar penuh yang bocor dihapus, baris asisten token senyap murni seperti persis `NO_REPLY` / `no_reply` dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat berpasangan yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola record pairing perangkat.
    - `device.token.rotate` merotasi token perangkat berpasangan dalam batas peran yang disetujui dan cakupan pemanggil.
    - `device.token.revoke` mencabut token perangkat berpasangan dalam batas peran yang disetujui dan cakupan pemanggil.

  </Accordion>

  <Accordion title="Pairing node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pairing node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status node yang dikenal/terhubung.
    - `node.rename` memperbarui label node berpasangan.
    - `node.invoke` meneruskan perintah ke node terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari node kembali ke gateway.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk node offline/terputus.

  </Accordion>

  <Accordion title="Kelompok persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan serta pencarian/pemutaran ulang persetujuan yang tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec yang tertunda dan mengembalikan keputusan akhir (atau `null` saat waktu habis).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node melalui perintah relay node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan plugin.

  </Accordion>

  <Accordion title="Otomasi, Skills, dan alat">
    - Otomasi: `wake` menjadwalkan injeksi teks wake langsung atau pada heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Kelompok peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat lain yang
  hanya berupa transkrip.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran peristiwa untuk
  sesi yang berlangganan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran peristiwa heartbeat.
- `cron`: peristiwa perubahan run/job cron.
- `shutdown`: notifikasi penghentian gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: siaran permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode pembantu Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### RPC ledger tugas

Klien operator dapat memeriksa dan membatalkan catatan tugas latar belakang Gateway melalui
RPC ledger tugas. Metode ini mengembalikan ringkasan tugas yang sudah disanitasi, bukan
status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Params: `status` opsional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array status tersebut,
    `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga
    `500`, dan string `cursor` opsional.
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Params: `{ "taskId": string }`.
  - Result: `{ "task": TaskSummary }`.
  - Id tugas yang hilang mengembalikan bentuk error not-found Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled`
    melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` menyertakan `id`, `status`, dan metadata opsional seperti `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progres,
ringkasan terminal, dan teks error yang disanitasi.

### Metode pembantu operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris
  perintah runtime untuk agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - `scope` mengontrol surface yang ditargetkan `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar provider
      saat tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar provider saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta
    ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime untuk
  agent. Respons menyertakan alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah alat plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat
  yang efektif pada runtime untuk sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    konteks auth atau delivery yang disediakan pemanggil.
  - Respons dibatasi pada sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk alat core, plugin, dan channel.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk meng-invoke satu alat yang tersedia melalui
  jalur kebijakan gateway yang sama dengan `/tools/invoke`.
  - `name` wajib. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agent sesi yang di-resolve harus cocok dengan
    `agentId`.
  - Respons adalah envelope yang menghadap SDK dengan `ok`, `toolName`, `output` opsional, dan field
    `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload, bukan
    melewati pipeline kebijakan alat gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat untuk agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - Respons menyertakan kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan
    opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata discovery ClawHub.
- Operator dapat memanggil `skills.upload.begin`, `skills.upload.chunk`, dan
  `skills.upload.commit` (`operator.admin`) untuk men-stage arsip skill privat
  sebelum menginstalnya. Ini adalah jalur upload admin terpisah untuk klien tepercaya,
  bukan alur instalasi skill ClawHub normal, dan dinonaktifkan secara default kecuali
  `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    membuat upload yang terikat pada slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada
    offset hasil dekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran akhir dan
    SHA-256. Commit hanya menyelesaikan upload; itu tidak menginstal skill.
  - Arsip skill yang di-upload adalah arsip zip yang berisi root `SKILL.md`. Nama
    direktori internal arsip tidak pernah memilih target instalasi.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder
    skill ke direktori `skills/` workspace agent default.
  - Mode upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    menginstal upload yang sudah di-commit ke direktori `skills/<slug>`
    workspace agent default. Slug dan nilai force harus cocok dengan permintaan
    `skills.upload.begin` asli. Mode ini ditolak kecuali
    `skills.install.allowUploadedArchives` diaktifkan. Pengaturan tersebut tidak
    memengaruhi instalasi ClawHub.
  - Mode installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan tindakan `metadata.openclaw.install` yang dideklarasikan di host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di
    workspace agent default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis untuk entri `provider/*`. Jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran picker. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang, termasuk discovery berbasis provider untuk entri `provider/*`. Tanpa allowlist, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya saat tidak ada baris model terkonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI discovery, bukan picker model normal.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` ditolak.
- Setelah persetujuan, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil memutasi `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan forward `system.run` akhir yang disetujui, gateway
  menolak run alih-alih memercayai payload yang dimutasi.

## Fallback delivery agent

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta delivery keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target delivery yang tidak ter-resolve atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi saat tidak ada rute deliverable eksternal yang dapat di-resolve (misalnya sesi internal/webchat atau konfigurasi multi-channel yang ambigu).
- Hasil akhir `agent` dapat menyertakan `result.deliveryStatus` saat delivery
  diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan `failed`
  yang sama seperti yang didokumentasikan untuk [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Versioning

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang
  tidak menyertakan protokol saat ini. Klien native menggunakan batas bawah v3 agar
  klien v4 aditif tetap dapat menjangkau gateway v3.
- Skema + model dibuat dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilainya
stabil di seluruh protokol v4 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                | Bawaan                                               | Sumber                                                                                     |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                       | `4`                                                  | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`            | `3`                                                  | `src/gateway/protocol/version.ts`                                                          |
| Timeout permintaan (per RPC)             | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / tantangan koneksi      | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/client berpasangan) |
| Backoff koneksi ulang awal               | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff koneksi ulang maks               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Batas retry cepat setelah penutupan token perangkat | `250` ms                                     | `src/gateway/client.ts`                                                                    |
| Tenggang force-stop sebelum `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout bawaan `stopAndWait()`           | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick bawaan (sebelum `hello-ok`) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Penutupan tick-timeout                   | kode `4000` ketika kesenyapan melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; client harus mematuhi nilai tersebut
alih-alih bawaan sebelum handshake.

## Autentikasi

- Autentikasi Gateway dengan shared secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, tergantung mode autentikasi yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan autentikasi koneksi dari
  header permintaan alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati autentikasi koneksi shared secret
  sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah penyandingan, Gateway menerbitkan **token perangkat** yang dicakup ke role koneksi
  + cakupan. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  dipertahankan oleh client untuk koneksi mendatang.
- Client harus mempertahankan `hello-ok.auth.deviceToken` utama setelah setiap
  koneksi yang berhasil.
- Menghubungkan ulang dengan token perangkat yang **tersimpan** tersebut juga harus menggunakan kembali
  set cakupan yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari koneksi ulang yang diam-diam menyusut menjadi
  cakupan implisit khusus admin yang lebih sempit.
- Penyusunan autentikasi koneksi sisi client (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat ditetapkan.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak ada hal di atas yang menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil dihasilkan akan menekannya.
  - Promosi otomatis token perangkat yang tersimpan pada retry sekali jalan
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang disematkan. `wss://` publik
    tanpa penyematan tidak memenuhi syarat.
- Entri `hello-ok.auth.deviceTokens` tambahan adalah token handoff bootstrap.
  Pertahankan hanya ketika koneksi menggunakan autentikasi bootstrap pada transport tepercaya
  seperti `wss://` atau penyandingan loopback/lokal.
- Jika client menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set cakupan
  yang diminta pemanggil tersebut tetap otoritatif; cakupan cache hanya
  digunakan kembali ketika client menggunakan ulang token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Perintah ini menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi dengan
  token perangkat tersebut, sehingga client khusus token dapat mempertahankan penggantinya sebelum
  menghubungkan ulang. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set role yang disetujui
  yang tercatat dalam entri penyandingan perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan role perangkat yang tidak pernah diberikan oleh persetujuan penyandingan.
- Untuk sesi token perangkat tersanding, manajemen perangkat bersifat self-scoped kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set cakupan token operator target
  terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku client untuk `AUTH_TOKEN_MISMATCH`:
  - Client tepercaya dapat mencoba satu retry terbatas dengan token per perangkat yang di-cache.
  - Jika retry tersebut gagal, client harus menghentikan loop koneksi ulang otomatis dan menampilkan panduan tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak mencakup
  role/cakupan yang diminta. Client tidak boleh menampilkannya sebagai token buruk;
  minta operator untuk menyandingkan ulang atau menyetujui kontrak cakupan yang lebih sempit/lebih luas.

## Identitas perangkat + penyandingan

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang berasal dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan penyandingan diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis penyandingan berpusat pada koneksi direct local loopback.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper shared secret tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai jarak jauh untuk penyandingan dan
  memerlukan persetujuan.
- Client WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback yang diautentikasi dengan token/password
    Gateway bersama.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk client lama yang masih menggunakan perilaku penandatanganan sebelum tantangan, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client menandatangani dengan nonce usang/salah.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalisasi public key gagal.            |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan pilihan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field perangkat/client/role/cakupan/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi penyematan metadata
  perangkat tersanding tetap mengontrol kebijakan perintah saat koneksi ulang.

## TLS + penyematan

- TLS didukung untuk koneksi WS.
- Client dapat secara opsional menyematkan fingerprint sertifikat Gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API Gateway lengkap** (status, channel, model, chat,
agent, sesi, node, persetujuan, dll.). Permukaan persisnya didefinisikan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
