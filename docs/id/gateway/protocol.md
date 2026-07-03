---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-07-03T10:00:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Protokol WS Gateway adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-connect dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak.
  Event ini menyimpan ukuran, batas, surface, dan kode alasan aman. Event ini
  tidak menyimpan isi pesan, konten lampiran, isi frame mentah, token, cookie,
  atau nilai rahasia.

## Handshake (connect)

Gateway → Klien (tantangan pra-connect):

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
mengembalikan error retryable `UNAVAILABLE` dengan `details.reason` disetel ke
`"startup-sidecars"` dan `retryAfterMs`. Klien harus mencoba ulang respons itu
dalam batas anggaran koneksi keseluruhan mereka, bukan menampilkannya sebagai
kegagalan handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
role/scope yang dinegosiasikan. `pluginSurfaceUrls` bersifat opsional dan memetakan
nama surface plugin, seperti `canvas`, ke URL ter-hosting yang berscope.

URL surface Plugin yang berscope dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima entri baru
di `pluginSurfaceUrls`. Refactor Plugin Canvas eksperimental tidak
mendukung jalur kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah deprecated; klien native dan
gateway saat ini harus menggunakan surface plugin.

Ketika tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan
izin yang dinegosiasikan tanpa kolom token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Klien backend same-process tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback
langsung ketika mereka mengautentikasi dengan token/kata sandi gateway bersama.
Jalur ini dicadangkan untuk RPC control-plane internal dan menjaga baseline
pemasangan CLI/perangkat yang usang agar tidak memblokir pekerjaan backend lokal
seperti pembaruan sesi subagent. Klien jarak jauh, klien browser-origin, klien
node, dan klien device-token/device-identity eksplisit tetap menggunakan
pemeriksaan pemasangan dan peningkatan scope normal.

Ketika token perangkat diterbitkan, `hello-ok` juga menyertakan:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bootstrap QR/kode setup bawaan adalah jalur handoff seluler baru. Connect
baseline dengan kode setup yang berhasil mengembalikan token node utama ditambah
satu token operator berbatas:

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

Handoff operator sengaja dibatasi agar onboarding QR dapat memulai loop operator
seluler tanpa memberikan `operator.admin` atau `operator.pairing`.
Ini memang menyertakan `operator.talk.secrets` agar klien native dapat membaca
konfigurasi Talk yang dibutuhkannya setelah bootstrap. Scope admin dan
pemasangan yang lebih luas memerlukan pemasangan operator atau alur token
terpisah yang disetujui. Klien harus menyimpan `hello-ok.auth.deviceTokens`
hanya ketika connect menggunakan autentikasi bootstrap pada transport tepercaya
seperti `wss://` atau pemasangan loopback/lokal.

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

## Pembingkaian

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **idempotency key** (lihat skema).

## Role + scope

Untuk model scope operator lengkap, pemeriksaan saat approval, dan semantik
shared-secret, lihat [Scope operator](/id/gateway/operator-scopes).

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
Ketika rahasia disertakan, klien harus membaca kredensial penyedia Talk aktif
dari `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
tetap berbentuk sumber dan dapat berupa objek SecretRef atau string yang
direduksi.

Metode RPC gateway yang didaftarkan Plugin dapat meminta scope operator mereka
sendiri, tetapi prefix admin core yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) selalu resolve ke `operator.admin`.

Scope metode hanyalah gate pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan level perintah yang lebih ketat di atasnya.
Misalnya, penulisan persisten `/config set` dan `/config unset` memerlukan
`operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat approval di
atas scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Kapabilitas/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat connect:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan ketika perangkat itu terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan kolom opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi mereka saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipasangkan juga dapat melaporkan
  presence latar belakang yang tahan lama ketika event node tepercaya memperbarui metadata pemasangan mereka.

### Event node aktif di latar belakang

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang dipasangkan
aktif selama wake latar belakang tanpa menandainya terhubung.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, atau `connect`. String trigger yang tidak dikenal dinormalisasi ke
`background` oleh gateway sebelum persistensi. Event ini tahan lama hanya untuk sesi perangkat node
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

Gateway lama mungkin masih mengembalikan `{ "ok": true }` untuk `node.event`; klien harus memperlakukannya sebagai
RPC yang diakui, bukan sebagai persistensi presence yang tahan lama.

## Pembatasan scope event broadcast

Event broadcast WebSocket yang didorong server dibatasi scope agar sesi yang berscope pemasangan atau khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan hasil tool** (termasuk event `agent` yang distream dan hasil panggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang ditentukan Plugin** dibatasi ke `operator.write` atau `operator.admin`, tergantung bagaimana plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi yang terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** dibatasi scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urutan per kliennya sendiri sehingga broadcast mempertahankan pengurutan monotonik pada socket tersebut bahkan ketika klien berbeda melihat subset yang difilter berdasarkan scope dari stream event yang berbeda.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar
discovery konservatif yang dibangun dari `src/gateway/server-methods-list.ts` plus ekspor metode
plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan
enumerasi penuh dari `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan id sesi. Ini tidak menyimpan teks chat, isi webhook, output tool, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif disertakan hanya untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan peristiwa heartbeat tersimpan terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat di gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Berikan `{ "view": "configured" }` untuk model terkonfigurasi seukuran picker (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
      Berikan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mengagregasi agen terkonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding ter-cache untuk workspace agen default aktif. Berikan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping provider embedding langsung. Klien yang sadar Dreaming juga dapat memberikan `{ "agentId": "agent-id" }` untuk membatasi statistik penyimpanan Dreaming ke workspace agen yang dipilih; jika `agentId` dihilangkan, fallback agen default tetap digunakan dan workspace Dreaming terkonfigurasi diagregasi.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima parameter opsional `{ "agentId": "agent-id" }` untuk tampilan/tindakan Dreaming agen terpilih. Ketika `agentId` dihilangkan, semuanya beroperasi pada workspace agen default terkonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM terbatas dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat menyertakan path workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil membutuhkan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Berikan `agentId` untuk satu
      agen, atau `agentScope: "all"` untuk mencantumkan agen terkonfigurasi bersama-sama.
    - `sessions.usage.timeseries` mengembalikan penggunaan timeseries untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan pembantu login">
    - `channels.status` mengembalikan ringkasan status channel/plugin bawaan + terbundel.
    - `channels.logout` melakukan logout dari channel/akun tertentu saat channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel jika berhasil.
    - `push.test` mengirim push APNs uji ke node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Perpesanan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail log file gateway terkonfigurasi dengan kontrol cursor/limit dan max-byte.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog provider Talk hanya-baca untuk speech, transkripsi streaming, dan suara realtime. Ini menyertakan id provider kanonis, alias registry, label, status terkonfigurasi, hasil `ready` tingkat grup opsional, id model/voice yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan rahasia provider atau memutasi config global. Gateway saat ini menetapkan `ready` setelah menerapkan pemilihan provider runtime; klien harus memperlakukan ketidakhadirannya sebagai belum diverifikasi demi kompatibilitas dengan Gateway lama.
    - `talk.config` mengembalikan payload config Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang memberikan `sessionKey` juga harus memberikan `spawnedBy` untuk visibilitas session-key bercakupan; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, memancarkan peristiwa `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi plus peristiwa Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menjalankan lifecycle giliran managed-room dengan penolakan giliran usang sebelum status dibersihkan.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk barge-in yang dikendalikan VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool provider yang dipancarkan oleh sesi relay realtime milik Gateway. Berikan `options: { willContinue: true }` untuk output tool sementara ketika hasil final akan menyusul, atau `options: { suppressResponse: true }` ketika hasil tool harus memenuhi panggilan provider tanpa memulai respons asisten realtime lain.
    - `talk.session.steer` mengirim kontrol suara active-run ke sesi Talk berbasis agen milik Gateway. Ini menerima `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang dihilangkan diklasifikasikan dari teks lisan.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan memancarkan peristiwa Talk terminal.
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi provider realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki config, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool provider ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima id run dan menunggu peristiwa lifecycle chat normal sebelum mengirim hasil tool khusus provider.
    - `talk.client.steer` mengirim kontrol suara active-run untuk transport realtime milik klien. Gateway menyelesaikan run tertanam aktif dari `sessionKey` dan mengembalikan hasil diterima/ditolak terstruktur alih-alih membuang steering secara diam-diam.
    - `talk.event` adalah satu-satunya channel peristiwa Talk untuk adapter realtime, transkripsi, STT/TTS, managed-room, telepon, dan rapat.
    - `talk.speak` mensintesis speech melalui provider speech Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback, dan status config provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS pilihan.
    - `tts.convert` menjalankan konversi text-to-speech sekali jalan.

  </Accordion>

  <Accordion title="Rahasia, config, pembaruan, dan wizard">
    - `secrets.reload` me-resolve ulang SecretRefs aktif dan menukar status rahasia runtime hanya jika berhasil sepenuhnya.
    - `secrets.resolve` me-resolve penetapan rahasia target-perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot config saat ini dan hash.
    - `config.set` menulis payload config yang tervalidasi.
    - `config.patch` menggabungkan pembaruan config parsial. Penggantian array yang destruktif
      memerlukan path yang terdampak di `replacePaths`; array bertingkat
      di bawah entri array menggunakan path `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi + mengganti payload config penuh.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema plugin + channel saat runtime dapat memuatnya. Skema menyertakan metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama yang digunakan UI, termasuk cabang komposisi objek bertingkat, wildcard, item-array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi field yang cocok ada.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan path untuk satu path config: path ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, `reloadKind` opsional, dan ringkasan child langsung untuk drill-down UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` dan mencerminkan perencana reload config Gateway untuk path yang diminta. Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, plus `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` agar startup melanjutkan satu giliran agen follow-up melalui antrean kelanjutan restart. Pembaruan package-manager dan pembaruan git-checkout tersupervisi dari control plane menggunakan handoff managed-service terpisah alih-alih mengganti pohon package atau memutasi output checkout/build di dalam Gateway live. Handoff yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`; handoff yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, plus `handoff.command` ketika pembaruan shell manual diperlukan. Handoff yang tidak tersedia berarti OpenClaw tidak memiliki batas supervisor yang aman atau identitas layanan yang tahan lama, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama handoff yang dimulai, sentinel restart dapat melaporkan `stats.reason: "restart-health-pending"` sebentar; kelanjutan ditunda sampai CLI memverifikasi Gateway yang direstart dan menulis sentinel `ok` final.
    - `update.status` menyegarkan dan mengembalikan sentinel restart pembaruan terbaru, termasuk versi yang berjalan setelah restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Helper agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola rekaman agen dan pengkabelan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file ruang kerja bootstrap yang diekspos untuk agen.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos ledger tugas Gateway ke klien SDK dan operator.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mengekspos penemuan lingkungan khusus Gateway lokal dan Node yang hanya baca untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal saat tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris saat backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip berbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi persis.
    - `sessions.resolve` menyelesaikan atau mengkanonikalisasi target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang terselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong) serta token kontrol model ASCII/lebar penuh yang bocor dihapus, baris asisten token senyap murni seperti persis `NO_REPLY` / `no_reply` dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan penuh berbatas yang bersifat aditif untuk satu entri transkrip yang terlihat. Klien meneruskan `sessionKey`, `agentId` opsional saat pemilihan sesi bercakupan agen, plus `messageId` transkrip yang sebelumnya dimunculkan melalui `chat.history`, dan Gateway mengembalikan proyeksi ternormalisasi tampilan yang sama tanpa batas pemotongan riwayat ringan saat entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi panggilan model yang dimulai sebelum cutoff otomatis, lalu memulai retry, fallback, hasil alat, atau panggilan kelanjutan berikutnya tanpa mode cepat. Cutoff default adalah 60 detik dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk menimpa cutoff bagi permintaan tersebut.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat terpasang yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola rekaman pemasangan perangkat.
    - `device.token.rotate` merotasi token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.

  </Accordion>

  <Accordion title="Pemasangan Node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pemasangan Node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status Node yang diketahui/terhubung.
    - `node.rename` memperbarui label Node terpasang.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa peristiwa yang berasal dari Node kembali ke gateway.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk Node offline/terputus.

  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali pakai plus pencarian/pemutaran ulang persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan akhir (atau `null` saat waktu habis).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal Node melalui perintah relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan plugin.

  </Accordion>

  <Accordion title="Automasi, Skills, dan alat">
    - Automasi: `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya enqueue untuk run manual. Klien yang memerlukan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong sehingga klien dapat mengikuti satu run manual yang diantrekan tanpa berpacu dengan entri riwayat lain untuk pekerjaan yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Keluarga peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat lain yang hanya transkrip. Dalam protokol v4, payload delta membawa `deltaText`; `message` tetap menjadi snapshot asisten kumulatif. Penggantian non-prefiks menetapkan `replace=true` dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, dan `session.tool`: pembaruan transkrip, operasi sesi yang sedang berjalan, dan stream peristiwa untuk sesi yang dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan stream peristiwa Heartbeat.
- `cron`: peristiwa perubahan run/pekerjaan Cron.
- `shutdown`: notifikasi pemadaman gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan Node.
- `node.invoke.request`: siaran permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat terpasang.
- `voicewake.changed`: konfigurasi pemicu kata bangun berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini untuk pemeriksaan auto-allow.

### RPC ledger tugas

Klien operator dapat memeriksa dan membatalkan rekaman tugas latar belakang Gateway melalui RPC ledger tugas. Metode ini mengembalikan ringkasan tugas yang disanitasi, bukan status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Parameter: `status` opsional (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array status tersebut, `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga `500`, dan string `cursor` opsional.
  - Hasil: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Hasil: `{ "task": TaskSummary }`.
  - ID tugas yang hilang mengembalikan bentuk kesalahan tidak-ditemukan Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Hasil:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled` melaporkan apakah runtime menerima atau merekam pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional seperti `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progres, ringkasan terminal, dan teks kesalahan yang disanitasi. `agentId` mengidentifikasi agen yang mengeksekusi tugas; `sessionKey` dan `ownerKey` mempertahankan konteks pemohon dan kontrol.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia jika tersedia
  - `textAliases` membawa alias garis miring persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime untuk sebuah agen. Respons mencakup alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah alat plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat yang efektif pada runtime untuk sebuah sesi.
  - `sessionKey` wajib ada.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima konteks auth atau pengiriman yang disediakan pemanggil.
  - Respons adalah proyeksi yang diturunkan server dan tercakup sesi dari inventaris aktif, termasuk alat server core, plugin, channel, dan MCP yang sudah ditemukan.
  - `tools.effective` bersifat hanya-baca untuk MCP: metode ini dapat memproyeksikan katalog MCP sesi hangat melalui kebijakan alat final, tetapi tidak membuat runtime MCP, menghubungkan transport, atau menerbitkan `tools/list`. Jika tidak ada katalog hangat yang cocok, respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`, `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri alat efektif menggunakan `source="core"`, `source="plugin"`, `source="channel"`, atau `source="mcp"`.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu alat yang tersedia melalui jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib ada. `args`, `sessionKey`, `agentId`, `confirm`, dan `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` keduanya ada, agen sesi yang diresolusikan harus cocok dengan `agentId`.
  - Wrapper core khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan identitas pemilik/admin (`operator.admin`) meskipun metode `tools.invoke` sendiri adalah `operator.write`.
  - Respons adalah amplop yang menghadap SDK dengan bidang `ok`, `toolName`, `output` opsional, dan `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload alih-alih melewati pipeline kebijakan alat Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris skill yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit` (`operator.admin`) untuk menyiapkan arsip skill pribadi sebelum menginstalnya. Ini adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur instal skill ClawHub normal, dan dinonaktifkan secara default kecuali `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` membuat unggahan yang terikat ke slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada offset terdekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran final dan SHA-256. Commit hanya memfinalkan unggahan; tindakan ini tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi root `SKILL.md`. Nama direktori internal arsip tidak pernah memilih target instalasi.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder skill ke direktori `skills/` workspace agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` menginstal unggahan yang sudah di-commit ke direktori `skills/<slug>` workspace agen default. Slug dan nilai force harus cocok dengan permintaan `skills.upload.begin` asli. Mode ini ditolak kecuali `skills.install.allowUploadedArchives` diaktifkan. Pengaturan tersebut tidak memengaruhi instalasi ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan tindakan `metadata.openclaw.install` yang dideklarasikan pada host Gateway. Klien lama mungkin masih mengirim `dangerouslyForceUnsafeInstall`; bidang ini sudah tidak digunakan, diterima hanya untuk kompatibilitas protokol, dan diabaikan. Gunakan `security.installPolicy` untuk keputusan instalasi yang dimiliki operator.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di workspace agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis untuk entri `provider/*`. Jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran pemilih. Jika `agents.defaults.models` dikonfigurasi, pengaturan itu tetap menang, termasuk penemuan tercakup penyedia untuk entri `provider/*`. Tanpa allowlist, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya ketika tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan pemilih model normal.

## Persetujuan exec

- Ketika permintaan exec memerlukan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara persiapan dan penerusan `system.run` final yang disetujui, Gateway menolak eksekusi alih-alih memercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi ketika tidak ada rute eksternal yang dapat dikirim yang bisa diresolusikan (misalnya sesi internal/webchat atau konfigurasi multi-channel yang ambigu).
- Hasil final `agent` dapat menyertakan `result.deliveryStatus` ketika pengiriman diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan `failed` yang sama seperti didokumentasikan untuk [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `packages/gateway-protocol/src/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang tidak mencakup protokol saat ini. Klien dan server saat ini memerlukan protokol v4.
- Skema + model dibuat dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilai stabil di seluruh protokol v4 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/klien berpasangan) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maks                    | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp retry cepat setelah device-token close | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Masa tenggang force-stop sebelum `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan tick-timeout                    | kode `4000` ketika senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                 |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`, dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus mematuhi nilai tersebut alih-alih default pra-handshake.

## Auth

- Auth Gateway rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header permintaan, bukan dari `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati auth connect rahasia bersama
  sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dibatasi pada
  peran koneksi + scope. Token ini dikembalikan di
  `hello-ok.auth.deviceToken` dan sebaiknya dipersistenkan oleh klien untuk
  connect berikutnya.
- Klien sebaiknya mempersistenkan `hello-ok.auth.deviceToken` utama setelah
  setiap connect yang berhasil.
- Reconnect dengan token perangkat **tersimpan** tersebut juga sebaiknya
  menggunakan kembali set scope tersimpan yang telah disetujui untuk token itu.
  Ini mempertahankan akses baca/probe/status yang sudah diberikan dan
  menghindari reconnect diam-diam menyempit menjadi scope implisit khusus admin.
- Penyusunan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi menurut urutan prioritas: token bersama eksplisit lebih
    dulu, lalu `deviceToken` eksplisit, lalu token per-perangkat tersimpan
    (dikunci oleh `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak satu pun dari yang di atas
    menghasilkan `auth.token`. Token bersama atau token perangkat apa pun yang
    berhasil ditentukan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada percobaan ulang sekali pakai
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang disematkan. `wss://`
    publik tanpa penyematan tidak memenuhi syarat.
- Bootstrap kode setup bawaan mengembalikan
  `hello-ok.auth.deviceToken` node utama ditambah token operator berbatas di
  `hello-ok.auth.deviceTokens` untuk handoff seluler tepercaya. Token operator
  menyertakan `operator.talk.secrets` untuk pembacaan konfigurasi Talk native dan
  mengecualikan `operator.admin` serta `operator.pairing`.
- Saat bootstrap kode setup non-baseline menunggu persetujuan, detail `PAIRING_REQUIRED`
  menyertakan `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  dan `pauseReconnect: false`. Klien sebaiknya terus melakukan reconnect dengan
  token bootstrap yang sama sampai permintaan disetujui atau token menjadi tidak valid.
- Persistenkan `hello-ok.auth.deviceTokens` hanya ketika connect menggunakan auth
  bootstrap pada transport tepercaya seperti `wss://` atau pairing loopback/lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set
  scope yang diminta pemanggil tersebut tetap otoritatif; scope cache hanya
  digunakan kembali saat klien menggunakan ulang token per-perangkat tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`). Merotasi atau
  mencabut token node atau peran non-operator lainnya juga memerlukan
  `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Ia menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi
  dengan token perangkat tersebut, sehingga klien khusus token dapat
  mempersistenkan penggantinya sebelum reconnect. Rotasi bersama/admin tidak
  menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set peran yang
  disetujui dan tercatat dalam entri pairing perangkat tersebut; mutasi token
  tidak dapat memperluas atau menargetkan peran perangkat yang tidak pernah
  diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang sudah dipairing, manajemen perangkat bersifat
  self-scoped kecuali pemanggil juga memiliki `operator.admin`: pemanggil non-admin
  hanya dapat mengelola token operator untuk entri perangkat **miliknya sendiri**.
  Manajemen token node dan non-operator lainnya hanya untuk admin, bahkan untuk
  perangkat milik pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set scope token
  operator target terhadap scope sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang
  sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang berbatas dengan token
    per-perangkat yang di-cache.
  - Jika percobaan ulang itu gagal, klien sebaiknya menghentikan loop reconnect
    otomatis dan menampilkan panduan tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak mencakup
  peran/scope yang diminta. Klien tidak boleh menampilkannya sebagai token buruk;
  minta operator melakukan re-pair atau menyetujui kontrak scope yang lebih
  sempit/luas.

## Identitas perangkat + pairing

- Node sebaiknya menyertakan identitas perangkat stabil (`device.id`) yang
  diturunkan dari fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali persetujuan
  otomatis lokal diaktifkan.
- Persetujuan otomatis pairing berpusat pada connect local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit
  untuk alur helper rahasia bersama tepercaya.
- Connect tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote
  untuk pairing dan memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur
  kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback pada jalur helper internal
    yang dicadangkan.
- Menghilangkan identitas perangkat memiliki konsekuensi scope. Ketika koneksi
  operator tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw
  tetap mengosongkan scope yang dideklarasikan sendiri menjadi set kosong kecuali
  jalur tersebut memiliki pengecualian pelestarian scope bernama. Metode yang
  digate oleh scope kemudian gagal dengan `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur pelestarian
  scope break-glass Control UI. Ini tidak memberikan scope kepada backend kustom
  sembarang atau klien WebSocket berbentuk CLI.
- Jalur helper backend `gateway-client` direct-loopback yang dicadangkan
  mempertahankan scope hanya untuk RPC control-plane lokal internal; ID backend
  kustom tidak menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien legacy yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang usang/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalisasi kunci publik gagal.          |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disukai adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field perangkat/klien/peran/scope/token/nonce.
- Tanda tangan legacy `v2` tetap diterima untuk kompatibilitas, tetapi penyematan
  metadata perangkat yang sudah dipairing tetap mengontrol kebijakan perintah
  saat reconnect.

## TLS + penyematan

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional menyematkan fingerprint sertifikat Gateway (lihat
  konfigurasi `gateway.tls` plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Scope

Protokol ini mengekspos **API Gateway lengkap** (status, channel, model, chat,
agent, sesi, node, persetujuan, dll.). Surface persisnya ditentukan oleh skema
TypeBox di `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
