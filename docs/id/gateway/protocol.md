---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-07-01T08:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Protokol Gateway WS adalah **satu-satunya control plane + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame sebelum connect dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  sebaiknya mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak.
  Event ini menyimpan ukuran, batas, permukaan, dan kode alasan yang aman. Event
  ini tidak menyimpan isi pesan, konten lampiran, isi frame mentah, token, cookie,
  atau nilai rahasia.

## Handshake (connect)

Gateway → Klien (tantangan sebelum connect):

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
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason`
diatur ke `"startup-sidecars"` dan `retryAfterMs`. Klien sebaiknya mencoba ulang
respons tersebut dalam keseluruhan anggaran koneksi mereka, alih-alih
menampilkannya sebagai kegagalan handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` juga wajib dan melaporkan
role/scope yang dinegosiasikan. `pluginSurfaceUrls` opsional dan memetakan nama
permukaan plugin, seperti `canvas`, ke URL ter-host yang memiliki scope.

URL permukaan plugin yang memiliki scope dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima entri
baru di `pluginSurfaceUrls`. Refaktor Plugin Canvas eksperimental tidak
mendukung jalur kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah usang; klien native dan gateway saat
ini harus menggunakan permukaan plugin.

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan
izin yang dinegosiasikan tanpa kolom token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Klien backend tepercaya dalam proses yang sama (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback
langsung ketika mereka mengautentikasi dengan token/kata sandi gateway bersama.
Jalur ini dicadangkan untuk RPC control-plane internal dan mencegah baseline
pemasangan CLI/perangkat yang basi memblokir pekerjaan backend lokal seperti
pembaruan sesi subagen. Klien jarak jauh, klien origin browser, klien node, dan
klien token-perangkat/identitas-perangkat eksplisit tetap menggunakan pemeriksaan
pemasangan dan peningkatan scope normal.

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

Bootstrap QR/kode-setup bawaan adalah jalur handoff mobile yang baru. Connect
kode-setup baseline yang berhasil mengembalikan token node utama plus satu token
operator berbatas:

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
mobile tanpa memberikan `operator.admin` atau `operator.pairing`.
Ini memang menyertakan `operator.talk.secrets` agar klien native dapat membaca
konfigurasi Talk yang dibutuhkan setelah bootstrap. Scope admin dan pemasangan
yang lebih luas memerlukan pemasangan operator yang disetujui atau alur token
terpisah. Klien sebaiknya menyimpan `hello-ok.auth.deviceTokens` hanya
ketika connect menggunakan auth bootstrap pada transport tepercaya seperti
`wss://` atau pemasangan loopback/lokal.

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

Metode yang memiliki efek samping memerlukan **kunci idempotensi** (lihat skema).

## Role + scope

Untuk model scope operator lengkap, pemeriksaan saat persetujuan, dan semantik
rahasia bersama, lihat [Scope operator](/id/gateway/operator-scopes).

### Role

- `operator` = klien control plane (CLI/UI/otomasi).
- `node` = host kapabilitas (kamera/layar/canvas/system.run).

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
Saat rahasia disertakan, klien sebaiknya membaca kredensial penyedia Talk aktif
dari `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
tetap berbentuk sumber dan dapat berupa objek SecretRef atau string yang
disamarkan.

Metode RPC gateway yang didaftarkan plugin dapat meminta scope operator mereka
sendiri, tetapi prefiks admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) selalu diselesaikan ke
`operator.admin`.

Scope metode hanya gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya.
Misalnya, penulisan persisten `/config set` dan `/config unset` memerlukan
`operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat persetujuan di
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

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri kehadiran menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan ketika perangkat tersebut terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan kolom opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipasangkan juga dapat melaporkan
  kehadiran latar belakang yang tahan lama ketika event node tepercaya memperbarui metadata pemasangannya.

### Event node hidup di latar belakang

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang dipasangkan
hidup selama wake latar belakang tanpa menandainya sebagai terhubung.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, atau `connect`. String trigger yang tidak dikenal dinormalisasi menjadi
`background` oleh gateway sebelum persistensi. Event ini hanya tahan lama untuk sesi perangkat node
terautentikasi; sesi tanpa perangkat atau belum dipasangkan mengembalikan `handled: false`.

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
RPC yang diakui, bukan sebagai persistensi kehadiran yang tahan lama.

## Cakupan event siaran

Event siaran WebSocket yang didorong server diberi gerbang scope sehingga sesi dengan scope pemasangan atau hanya node tidak menerima konten sesi secara pasif.

- **Frame chat, agen, dan hasil-tool** (termasuk event `agent` yang di-stream dan hasil panggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Siaran `plugin.*` yang didefinisikan plugin** digerbangkan ke `operator.write` atau `operator.admin`, tergantung cara plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event siaran yang tidak dikenal** diberi gerbang scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urutan per-kliennya sendiri sehingga siaran mempertahankan pengurutan monotonik pada socket tersebut bahkan ketika klien berbeda melihat subset terfilter-scope yang berbeda dari aliran event.

## Keluarga metode RPC umum

Permukaan WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar
discovery konservatif yang dibangun dari `src/gateway/server-methods-list.ts`
plus ekspor metode plugin/channel yang dimuat. Perlakukan ini sebagai discovery
fitur, bukan enumerasi lengkap dari `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbaru yang terbatas. Ini menyimpan metadata operasional seperti nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/Plugin, dan id sesi. Ini tidak menyimpan teks chat, body Webhook, output tool, body request atau response mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan Gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat Gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/Node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan peristiwa Heartbeat terbaru yang dipersistenkan.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat di Gateway.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Berikan `{ "view": "configured" }` untuk model terkonfigurasi berukuran picker (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
      Berikan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mengagregasi agen terkonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding yang di-cache untuk workspace agen default aktif. Berikan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping provider embedding langsung. Klien yang sadar Dreaming juga dapat memberikan `{ "agentId": "agent-id" }` untuk membatasi statistik store Dreaming ke workspace agen terpilih; menghilangkan `agentId` mempertahankan fallback agen default dan mengagregasi workspace Dreaming terkonfigurasi.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima parameter opsional `{ "agentId": "agent-id" }` untuk tampilan/tindakan Dreaming agen terpilih. Ketika `agentId` dihilangkan, semuanya beroperasi pada workspace agen default terkonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM terbatas dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat menyertakan path workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Berikan `agentId` untuk satu
      agen, atau `agentScope: "all"` untuk mencantumkan agen terkonfigurasi bersama-sama.
    - `sessions.usage.timeseries` mengembalikan penggunaan timeseries untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + bundel.
    - `channels.logout` mengeluarkan channel/akun tertentu ketika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel saat berhasil.
    - `push.test` mengirim push APNs uji ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` adalah RPC pengiriman outbound langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar chat runner.
    - `logs.tail` mengembalikan tail file-log Gateway terkonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` mengembalikan katalog provider Talk hanya-baca untuk speech, transkripsi streaming, dan suara realtime. Ini menyertakan id provider, label, status terkonfigurasi, id model/suara yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan rahasia provider atau mengubah config global.
    - `talk.config` mengembalikan payload config Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang memberikan `sessionKey` juga harus memberikan `spawnedBy` untuk visibilitas session-key bercakupan; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, menerbitkan peristiwa `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi plus peristiwa Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menggerakkan lifecycle turn managed-room dengan penolakan turn kedaluwarsa sebelum status dibersihkan.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk barge-in berpagar VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool provider yang diterbitkan oleh sesi relay realtime milik Gateway. Berikan `options: { willContinue: true }` untuk output tool sementara ketika hasil akhir akan menyusul, atau `options: { suppressResponse: true }` ketika hasil tool harus memenuhi panggilan provider tanpa memulai response asisten realtime lain.
    - `talk.session.steer` mengirim kontrol suara active-run ke sesi Talk berbasis agen milik Gateway. Ini menerima `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang dihilangkan diklasifikasikan dari teks lisan.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan menerbitkan peristiwa Talk terminal.
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi provider realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki config, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool provider ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima id run dan menunggu peristiwa lifecycle chat normal sebelum mengirimkan hasil tool khusus provider.
    - `talk.client.steer` mengirim kontrol suara active-run untuk transport realtime milik klien. Gateway menyelesaikan run tersemat aktif dari `sessionKey` dan mengembalikan hasil diterima/ditolak terstruktur alih-alih diam-diam mengabaikan steering.
    - `talk.event` adalah satu-satunya channel peristiwa Talk untuk realtime, transkripsi, STT/TTS, managed-room, telephony, dan adapter meeting.
    - `talk.speak` mensintesis speech melalui provider speech Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback, dan status config provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS pilihan.
    - `tts.convert` menjalankan konversi text-to-speech sekali jalan.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` menyelesaikan ulang SecretRef aktif dan menukar status rahasia runtime hanya jika berhasil penuh.
    - `secrets.resolve` menyelesaikan penetapan rahasia target-command untuk kumpulan command/target tertentu.
    - `config.get` mengembalikan snapshot config saat ini dan hash.
    - `config.set` menulis payload config yang tervalidasi.
    - `config.patch` menggabungkan pembaruan config parsial. Penggantian array
      destruktif memerlukan path yang terdampak di `replacePaths`; array bertingkat
      di bawah entri array menggunakan path `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi + mengganti payload config penuh.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk metadata skema Plugin + channel ketika runtime dapat memuatnya. Skema menyertakan metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama dengan yang digunakan UI, termasuk objek bertingkat, wildcard, array-item, dan cabang komposisi `anyOf` / `oneOf` / `allOf` ketika dokumentasi field yang cocok ada.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan path untuk satu path config: path ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, `reloadKind` opsional, dan ringkasan child langsung untuk drill-down UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` dan mencerminkan perencana reload config Gateway untuk path yang diminta. Node skema lookup mempertahankan dokumentasi yang terlihat pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, serta flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, plus `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` agar startup melanjutkan satu turn agen lanjutan melalui antrean kelanjutan restart. Pembaruan package-manager dan pembaruan git-checkout tersupervisi dari bidang kontrol menggunakan handoff managed-service terpisah alih-alih mengganti pohon package atau mengubah output checkout/build di dalam Gateway live. Handoff yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`; handoff yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, plus `handoff.command` ketika pembaruan shell manual diperlukan. Handoff yang tidak tersedia berarti OpenClaw tidak memiliki batas supervisor aman atau identitas layanan tahan lama, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama handoff yang dimulai, sentinel restart dapat sebentar melaporkan `stats.reason: "restart-health-pending"`; kelanjutan ditunda hingga CLI memverifikasi Gateway yang direstart dan menulis sentinel `ok` akhir.
    - `update.status` menyegarkan dan mengembalikan sentinel restart pembaruan terbaru, termasuk versi berjalan pasca-restart ketika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Pembantu agen dan workspace">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan pengabelan workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos ledger tugas Gateway ke klien SDK dan operator.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal-usul yang cocok; sumber URL yang tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mengekspos penemuan lingkungan lokal Gateway dan node yang hanya-baca untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris saat backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip berbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi yang persis.
    - `sessions.resolve` menyelesaikan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sebuah sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang diselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan alat teks polos (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong) serta token kontrol model ASCII/lebar-penuh yang bocor dihapus, baris asisten token-senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan penuh berbatas tambahan untuk satu entri transkrip yang terlihat. Klien meneruskan `sessionKey`, `agentId` opsional saat pemilihan sesi bercakupan agen, plus `messageId` transkrip yang sebelumnya dimunculkan melalui `chat.history`, dan Gateway mengembalikan proyeksi yang sama yang dinormalisasi untuk tampilan tanpa batas pemotongan riwayat ringan saat entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi panggilan model yang dimulai sebelum batas auto, lalu memulai panggilan retry, fallback, hasil alat, atau lanjutan berikutnya tanpa mode cepat. Batas default adalah 60 detik dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk mengganti batas bagi permintaan tersebut.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat terpasang yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pemasangan perangkat.
    - `device.token.rotate` merotasi token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.

  </Accordion>

  <Accordion title="Pemasangan node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pemasangan node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status node yang dikenal/terhubung.
    - `node.rename` memperbarui label node terpasang.
    - `node.invoke` meneruskan perintah ke node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa peristiwa yang berasal dari node kembali ke gateway.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk node offline/terputus.

  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali pakai plus pencarian/pemutaran ulang persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan akhir (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node melalui perintah relai node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan Plugin.

  </Accordion>

  <Accordion title="Otomasi, Skills, dan alat">
    - Otomasi: `wake` menjadwalkan injeksi teks wake langsung atau pada heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya enqueue untuk run manual. Klien yang membutuhkan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong sehingga klien dapat mengikuti satu run manual yang diantrekan tanpa berpacu dengan entri riwayat lain untuk pekerjaan yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Keluarga peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat khusus transkrip
  lainnya. Dalam protokol v4, payload delta membawa `deltaText`; `message` tetap
  menjadi snapshot asisten kumulatif. Penggantian non-prefiks menetapkan `replace=true`
  dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, dan `session.tool`: pembaruan transkrip,
  operasi sesi yang sedang berjalan, dan event-stream untuk sesi yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan event stream Heartbeat.
- `cron`: peristiwa perubahan run/job cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan node.
- `node.invoke.request`: siaran permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat terpasang.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode pembantu node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### RPC ledger tugas

Klien operator dapat memeriksa dan membatalkan catatan tugas latar belakang Gateway melalui
RPC ledger tugas. Metode ini mengembalikan ringkasan tugas yang disanitasi, bukan status
runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Params: `status` opsional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array dari status tersebut,
    `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga
    `500`, dan string `cursor` opsional.
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Params: `{ "taskId": string }`.
  - Result: `{ "task": TaskSummary }`.
  - Id tugas yang hilang mengembalikan bentuk kesalahan not-found Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled`
    melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional seperti `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progres,
ringkasan terminal, dan teks kesalahan yang disanitasi. `agentId` mengidentifikasi agen
yang mengeksekusi tugas; `sessionKey` dan `ownerKey` mempertahankan konteks peminta
dan kontrol.

### Metode pembantu operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia jika tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah agen. Respons mencakup tool yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool yang efektif pada runtime untuk sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server, alih-alih menerima konteks autentikasi atau pengiriman yang dipasok pemanggil.
  - Respons adalah proyeksi yang diturunkan server dan dibatasi sesi dari inventaris aktif, termasuk tool core, plugin, channel, dan server MCP yang sudah ditemukan.
  - `tools.effective` bersifat hanya baca untuk MCP: ini dapat memproyeksikan katalog MCP sesi hangat melalui kebijakan tool final, tetapi tidak membuat runtime MCP, menghubungkan transport, atau menerbitkan `tools/list`. Jika tidak ada katalog hangat yang cocok, respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`, `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri tool efektif menggunakan `source="core"`, `source="plugin"`, `source="channel"`, atau `source="mcp"`.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu tool yang tersedia melalui jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang diselesaikan harus cocok dengan `agentId`.
  - Wrapper core khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan identitas pemilik/admin (`operator.admin`) meskipun metode `tools.invoke` itu sendiri adalah `operator.write`.
  - Respons adalah envelope yang menghadap SDK dengan kolom `ok`, `toolName`, `output` opsional, dan `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload, bukan melewati pipeline kebijakan tool Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris skill yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan opsi instalasi yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit` (`operator.admin`) untuk menyiapkan arsip skill privat sebelum menginstalnya. Ini adalah jalur unggahan admin terpisah untuk klien tepercaya, bukan alur instalasi skill ClawHub normal, dan dinonaktifkan secara default kecuali `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` membuat unggahan yang terikat ke slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada offset terdekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran final dan SHA-256. Commit hanya memfinalisasi unggahan; ini tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi root `SKILL.md`. Nama direktori internal arsip tidak pernah memilih target instalasi.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder skill ke direktori `skills/` workspace agen default.
  - Mode unggahan: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` menginstal unggahan yang sudah di-commit ke direktori `skills/<slug>` workspace agen default. Slug dan nilai force harus cocok dengan permintaan `skills.upload.begin` asli. Mode ini ditolak kecuali `skills.install.allowUploadedArchives` diaktifkan. Pengaturan ini tidak memengaruhi instalasi ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan tindakan `metadata.openclaw.install` yang dideklarasikan pada host Gateway. Klien lama mungkin masih mengirim `dangerouslyForceUnsafeInstall`; kolom ini sudah usang, diterima hanya untuk kompatibilitas protokol, dan diabaikan. Gunakan `security.installPolicy` untuk keputusan instalasi yang dimiliki operator.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di workspace agen default.
  - Mode config menambal nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis untuk entri `provider/*`. Jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku berukuran picker. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang, termasuk penemuan berbatas penyedia untuk entri `provider/*`. Tanpa allowlist, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya saat tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan picker model normal.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah persetujuan, panggilan `node.invoke system.run` yang diteruskan menggunakan ulang `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara persiapan dan forward `system.run` final yang disetujui, Gateway menolak run alih-alih memercayai payload yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi saat tidak ada rute eksternal yang dapat dikirim yang bisa diselesaikan (misalnya sesi internal/webchat atau config multi-channel yang ambigu).
- Hasil final `agent` dapat menyertakan `result.deliveryStatus` saat pengiriman diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan `failed` yang sama seperti yang didokumentasikan untuk [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Versioning

- `PROTOCOL_VERSION` berada di `packages/gateway-protocol/src/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang tidak menyertakan protokol saat ini. Klien dan server saat ini memerlukan protokol v4.
- Schema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default berikut. Nilai stabil di seluruh protokol v4 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/klien berpasangan) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp coba ulang cepat setelah penutupan device-token | `250` ms                                  | `src/gateway/client.ts`                                                                    |
| Masa tenggang force-stop sebelum `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan karena tick-timeout             | code `4000` saat diam melebihi `tickIntervalMs * 2`   | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`, dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus menghormati nilai tersebut, bukan default sebelum handshake.

## Auth

- Auth Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth koneksi dari
  header permintaan, bukan dari `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati auth koneksi rahasia bersama
  sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pemasangan, Gateway menerbitkan **token perangkat** yang dibatasi pada
  peran koneksi + cakupan. Token ini dikembalikan di `hello-ok.auth.deviceToken`
  dan harus dipersistenkan oleh klien untuk koneksi berikutnya.
- Klien harus mempersistenkan `hello-ok.auth.deviceToken` utama setelah koneksi
  berhasil.
- Menghubungkan ulang dengan token perangkat yang **tersimpan** itu juga harus
  menggunakan kembali set cakupan yang disetujui dan tersimpan untuk token tersebut.
  Ini mempertahankan akses baca/probe/status yang sudah diberikan dan menghindari
  penyempitan diam-diam saat koneksi ulang menjadi cakupan implisit khusus admin
  yang lebih sempit.
- Perakitan auth koneksi sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi menurut urutan prioritas: token bersama eksplisit terlebih
    dahulu, lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan
    (dikunci oleh `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya saat tidak satu pun dari nilai di atas
    menghasilkan `auth.token`. Token bersama atau token perangkat apa pun yang
    berhasil ditemukan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada percobaan ulang satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi untuk **endpoint tepercaya saja** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipasangi pin. `wss://`
    publik tanpa pinning tidak memenuhi syarat.
- Bootstrap kode penyiapan bawaan mengembalikan
  `hello-ok.auth.deviceToken` node utama plus token operator terbatas di
  `hello-ok.auth.deviceTokens` untuk handoff seluler tepercaya. Token operator
  mencakup `operator.talk.secrets` untuk pembacaan konfigurasi Talk native dan
  mengecualikan `operator.admin` serta `operator.pairing`.
- Saat bootstrap kode penyiapan non-baseline menunggu persetujuan, detail
  `PAIRING_REQUIRED` menyertakan `recommendedNextStep: "wait_then_retry"`,
  `retryable: true`, dan `pauseReconnect: false`. Klien harus terus
  menghubungkan ulang dengan token bootstrap yang sama sampai permintaan disetujui
  atau token menjadi tidak valid.
- Persistenkan `hello-ok.auth.deviceTokens` hanya saat koneksi menggunakan auth
  bootstrap pada transport tepercaya seperti `wss://` atau loopback/pemasangan lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set
  cakupan yang diminta pemanggil tersebut tetap otoritatif; cakupan cache hanya
  digunakan kembali saat klien menggunakan kembali token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`). Merotasi atau
  mencabut node atau peran non-operator lain juga memerlukan `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Ini menggemakan token
  bearer pengganti hanya untuk panggilan perangkat yang sama yang sudah
  diautentikasi dengan token perangkat tersebut, sehingga klien khusus token
  dapat mempersistenkan penggantinya sebelum menghubungkan ulang. Rotasi
  bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set peran yang
  disetujui dan dicatat dalam entri pemasangan perangkat tersebut; mutasi token
  tidak dapat memperluas atau menargetkan peran perangkat yang tidak pernah
  diberikan oleh persetujuan pemasangan.
- Untuk sesi token perangkat yang dipasangkan, manajemen perangkat bersifat
  self-scoped kecuali pemanggil juga memiliki `operator.admin`: pemanggil non-admin
  hanya dapat mengelola token operator untuk entri perangkat **miliknya sendiri**.
  Manajemen token Node dan non-operator lain hanya untuk admin, bahkan untuk
  perangkat pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set cakupan token
  operator target terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang
  sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per perangkat dari cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop koneksi ulang otomatis dan menampilkan panduan tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak mencakup
  peran/cakupan yang diminta. Klien tidak boleh menampilkannya sebagai token yang
  buruk; minta operator untuk memasangkan ulang atau menyetujui kontrak cakupan
  yang lebih sempit/lebih luas.

## Identitas perangkat + pemasangan

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang berasal dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pemasangan diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pemasangan berpusat pada koneksi direct local loopback.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur pembantu rahasia bersama tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pemasangan dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback pada jalur pembantu internal
    yang dicadangkan.
- Menghilangkan identitas perangkat memiliki konsekuensi cakupan. Saat koneksi
  operator tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw
  tetap menghapus cakupan yang dideklarasikan sendiri menjadi set kosong kecuali
  jalur tersebut memiliki pengecualian pelestarian cakupan bernama. Metode yang
  dibatasi cakupan kemudian gagal dengan `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur pelestarian
  cakupan break-glass Control UI. Ini tidak memberikan cakupan kepada backend
  kustom sembarang atau klien WebSocket berbentuk CLI.
- Jalur pembantu backend `gateway-client` direct-loopback yang dicadangkan
  mempertahankan cakupan hanya untuk RPC control-plane lokal internal; ID backend
  kustom tidak menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Makna                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce usang/salah.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalisasi kunci publik gagal.          |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disukai adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan lama `v2` tetap diterima untuk kompatibilitas, tetapi pinning
  metadata perangkat yang dipasangkan tetap mengontrol kebijakan perintah saat koneksi ulang.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien secara opsional dapat memasang pin pada fingerprint sertifikat Gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API Gateway lengkap** (status, channel, model, chat,
agent, sesi, node, approval, dll.). Permukaan persisnya ditentukan oleh skema
TypeBox di `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
