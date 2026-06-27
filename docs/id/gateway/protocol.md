---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol adalah **bidang kontrol tunggal + transport node** untuk
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
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason`
disetel ke `"startup-sidecars"` dan `retryAfterMs`. Klien harus mencoba ulang
respons tersebut dalam batas anggaran koneksi keseluruhan, bukan menampilkannya
sebagai kegagalan handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` juga wajib dan melaporkan
role/scope yang dinegosiasikan. `pluginSurfaceUrls` bersifat opsional dan memetakan nama
surface plugin, seperti `canvas`, ke URL hosted berscope.

URL surface plugin berscope dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima entri baru
di `pluginSurfaceUrls`. Refactor Plugin Canvas eksperimental tidak mendukung jalur
kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah deprecated; klien native dan gateway saat ini
harus menggunakan surface plugin.

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan izin
yang dinegosiasikan tanpa field token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Klien backend tepercaya dalam proses yang sama (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung
saat mereka melakukan autentikasi dengan token/kata sandi gateway bersama. Jalur ini
dicadangkan untuk RPC bidang kontrol internal dan mencegah baseline pemasangan CLI/perangkat
yang usang memblokir pekerjaan backend lokal seperti pembaruan sesi subagent. Klien jarak jauh,
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

Bootstrap QR/kode-setup bawaan adalah jalur handoff mobile baru. Connect baseline
dengan kode-setup yang berhasil mengembalikan token node utama plus satu token
operator terbatas:

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
konfigurasi Talk yang dibutuhkannya setelah bootstrap. Scope admin dan pemasangan
yang lebih luas memerlukan pemasangan operator atau alur token terpisah yang disetujui.
Klien harus menyimpan `hello-ok.auth.deviceTokens` hanya
saat connect menggunakan autentikasi bootstrap pada transport tepercaya seperti `wss://` atau
loopback/pemasangan lokal.

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

Untuk model scope operator lengkap, pemeriksaan saat persetujuan, dan semantik
shared-secret, lihat [Scope operator](/id/gateway/operator-scopes).

### Role

- `operator` = klien bidang kontrol (CLI/UI/otomasi).
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
prefiks admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu dipetakan ke `operator.admin`.

Scope metode hanya gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya,
penulisan persisten `/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat persetujuan di atas
scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat connect:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipasangkan juga dapat melaporkan
  presence latar belakang yang tahan lama saat event node tepercaya memperbarui metadata pemasangannya.

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

Event broadcast WebSocket yang didorong server dibatasi oleh scope sehingga sesi berscope pemasangan atau khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan tool-result** (termasuk event `agent` yang di-stream dan hasil pemanggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan Plugin** dibatasi ke `operator.write` atau `operator.admin`, bergantung pada cara plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dan sebagainya) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** secara default dibatasi oleh scope (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urut per-kliennya sendiri sehingga broadcast mempertahankan urutan monotonik pada socket tersebut bahkan saat klien berbeda melihat subset event stream yang berbeda setelah difilter scope.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` plus ekspor metode
plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi lengkap
atas `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang tersimpan di cache atau baru saja diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama kanal/plugin, dan id sesi. Ini tidak menyimpan teks chat, isi webhook, keluaran tool, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; bidang sensitif hanya disertakan untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks kehadiran.
    - `last-heartbeat` mengembalikan peristiwa heartbeat tersimpan terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat di gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Berikan `{ "view": "configured" }` untuk model terkonfigurasi berukuran picker (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
      Berikan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mengagregasi agen yang terkonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor / embedding cache untuk workspace agen default aktif. Berikan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping provider embedding langsung. Klien yang sadar Dreaming juga dapat memberikan `{ "agentId": "agent-id" }` untuk membatasi statistik penyimpanan Dreaming ke workspace agen yang dipilih; menghilangkan `agentId` mempertahankan fallback agen default dan mengagregasi workspace Dreaming yang terkonfigurasi.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima parameter opsional `{ "agentId": "agent-id" }` untuk tampilan/tindakan Dreaming pada agen yang dipilih. Ketika `agentId` dihilangkan, semuanya beroperasi pada workspace agen default yang terkonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM terbatas dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat menyertakan path workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Berikan `agentId` untuk satu
      agen, atau `agentScope: "all"` untuk mencantumkan agen yang terkonfigurasi bersama-sama.
    - `sessions.usage.timeseries` mengembalikan penggunaan timeseries untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Kanal dan helper login">
    - `channels.status` mengembalikan ringkasan status kanal/plugin bawaan + bundled.
    - `channels.logout` mengeluarkan akun/kanal tertentu saat kanal mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider kanal web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai kanal saat berhasil.
    - `push.test` mengirim push APNs pengujian ke node iOS yang terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke kanal/akun/thread di luar chat runner.
    - `logs.tail` mengembalikan tail log file gateway yang terkonfigurasi dengan kontrol cursor/limit dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog provider Talk hanya-baca untuk speech, transkripsi streaming, dan suara realtime. Ini menyertakan id provider, label, status terkonfigurasi, id model/suara yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan rahasia provider atau mengubah konfigurasi global.
    - `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang memberikan `sessionKey` juga harus memberikan `spawnedBy` untuk visibilitas session-key tercakup; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, memancarkan peristiwa `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi beserta peristiwa Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menggerakkan siklus hidup giliran managed-room dengan penolakan stale-turn sebelum status dibersihkan.
    - `talk.session.cancelOutput` menghentikan keluaran audio asisten, terutama untuk barge-in berpagar VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool provider yang dipancarkan oleh sesi relay realtime milik Gateway. Berikan `options: { willContinue: true }` untuk keluaran tool sementara ketika hasil akhir akan menyusul, atau `options: { suppressResponse: true }` ketika hasil tool harus memenuhi panggilan provider tanpa memulai respons asisten realtime lain.
    - `talk.session.steer` mengirim kontrol suara active-run ke sesi Talk berbasis agen milik Gateway. Ini menerima `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang dihilangkan diklasifikasikan dari teks lisan.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan memancarkan peristiwa Talk terminal.
    - `talk.mode` mengatur/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi provider realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki konfigurasi, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool provider ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima id run dan menunggu peristiwa siklus hidup chat normal sebelum mengirim hasil tool spesifik provider.
    - `talk.client.steer` mengirim kontrol suara active-run untuk transport realtime milik klien. Gateway menyelesaikan run tertanam aktif dari `sessionKey` dan mengembalikan hasil diterima/ditolak yang terstruktur alih-alih membuang steering secara diam-diam.
    - `talk.event` adalah kanal peristiwa Talk tunggal untuk realtime, transkripsi, STT/TTS, managed-room, telephony, dan adapter meeting.
    - `talk.speak` menyintesis speech melalui provider speech Talk aktif.
    - `tts.status` mengembalikan status aktif TTS, provider aktif, provider fallback, dan status konfigurasi provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS pilihan.
    - `tts.convert` menjalankan konversi text-to-speech sekali jalan.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wizard">
    - `secrets.reload` menyelesaikan ulang SecretRefs aktif dan mengganti status rahasia runtime hanya jika berhasil penuh.
    - `secrets.resolve` menyelesaikan penetapan rahasia target perintah untuk set perintah/target tertentu.
    - `config.get` mengembalikan snapshot dan hash konfigurasi saat ini.
    - `config.set` menulis payload konfigurasi yang tervalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial. Penggantian array yang destruktif
      memerlukan path terdampak di `replacePaths`; array bertingkat
      di bawah entri array menggunakan path `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi + mengganti payload konfigurasi penuh.
    - `config.schema` mengembalikan payload skema konfigurasi live yang digunakan oleh tooling Control UI dan CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk metadata skema plugin + kanal ketika runtime dapat memuatnya. Skema menyertakan metadata bidang `title` / `description` yang diturunkan dari label dan teks bantuan yang sama dengan yang digunakan UI, termasuk cabang komposisi objek bertingkat, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi bidang yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan path untuk satu path konfigurasi: path ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, `reloadKind` opsional, dan ringkasan child langsung untuk drill-down UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` dan mencerminkan perencana reload konfigurasi Gateway untuk path yang diminta. Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan bidang validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, ditambah `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` sehingga startup melanjutkan satu giliran agen follow-up melalui antrean kelanjutan restart. Pembaruan package-manager dan pembaruan git-checkout tersupervisi dari control plane menggunakan handoff managed-service terpisah alih-alih mengganti pohon paket atau mengubah keluaran checkout/build di dalam Gateway live. Handoff yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`; handoff yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, ditambah `handoff.command` ketika pembaruan shell manual diperlukan. Handoff yang tidak tersedia berarti OpenClaw tidak memiliki batas supervisor yang aman atau identitas layanan yang tahan lama, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama handoff yang dimulai, sentinel restart dapat secara singkat melaporkan `stats.reason: "restart-health-pending"`; kelanjutan ditunda hingga CLI memverifikasi Gateway yang telah direstart dan menulis sentinel `ok` final.
    - `update.status` menyegarkan dan mengembalikan sentinel restart pembaruan terbaru, termasuk versi yang berjalan setelah restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Helper agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan penyambungan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file ruang kerja bootstrap yang diekspos untuk agen.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos ledger tugas Gateway kepada klien SDK dan operator.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan yang tidak didukung, bukan mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mengekspos penemuan lingkungan lokal Gateway dan node yang bersifat baca-saja untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal saat tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris saat backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengalihkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengalihkan langganan peristiwa transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi yang persis.
    - `sessions.resolve` menyelesaikan atau mengkanonikalisasi target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke dalam sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sebuah sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang terselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong) serta token kontrol model ASCII/lebar-penuh yang bocor dihapus, baris asisten token senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan penuh terbatas yang aditif untuk satu entri transkrip terlihat. Klien meneruskan `sessionKey`, `agentId` opsional saat pemilihan sesi bercakupan agen, plus `messageId` transkrip yang sebelumnya dimunculkan melalui `chat.history`, dan Gateway mengembalikan proyeksi ternormalisasi tampilan yang sama tanpa batas pemotongan riwayat ringan saat entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi pemanggilan model yang dimulai sebelum batas otomatis, lalu memulai pemanggilan retry, fallback, hasil alat, atau lanjutan berikutnya tanpa mode cepat. Batas default adalah 60 detik dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk menimpa batas bagi permintaan tersebut.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat terpasang yang menunggu persetujuan dan yang disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pemasangan perangkat.
    - `device.token.rotate` merotasi token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.

  </Accordion>

  <Accordion title="Pemasangan Node, invoke, dan pekerjaan tertunda">
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
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node melalui perintah relay node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan plugin.

  </Accordion>

  <Accordion title="Automasi, skills, dan alat">
    - Automasi: `wake` menjadwalkan injeksi teks wake segera atau pada heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya enqueue untuk run manual. Klien yang membutuhkan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong sehingga klien dapat mengikuti satu run manual yang diantrekan tanpa berpacu dengan entri riwayat lain untuk pekerjaan yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Keluarga peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat khusus transkrip lainnya. Dalam protokol v4, payload delta membawa `deltaText`; `message` tetap menjadi snapshot asisten kumulatif. Penggantian non-prefiks menetapkan `replace=true` dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, dan `session.tool`: pembaruan transkrip, operasi sesi yang sedang berjalan, dan aliran peristiwa untuk sesi yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran peristiwa heartbeat.
- `cron`: peristiwa perubahan run/pekerjaan cron.
- `shutdown`: pemberitahuan penghentian gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan node.
- `node.invoke.request`: broadcast permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat terpasang.
- `voicewake.changed`: konfigurasi pemicu kata wake berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini untuk pemeriksaan auto-allow.

### RPC ledger tugas

Klien operator dapat memeriksa dan membatalkan catatan tugas latar belakang Gateway melalui RPC ledger tugas. Metode ini mengembalikan ringkasan tugas yang disanitasi, bukan status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Parameter: `status` opsional (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array status tersebut, `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga `500`, dan string `cursor` opsional.
  - Hasil: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Hasil: `{ "task": TaskSummary }`.
  - Id tugas yang hilang mengembalikan bentuk galat tidak ditemukan Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Hasil:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled` melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional seperti `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progres, ringkasan terminal, dan teks galat yang disanitasi. `agentId` mengidentifikasi agen yang mengeksekusi tugas; `sessionKey` dan `ownerKey` mempertahankan konteks peminta dan kontrol.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime bagi sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia jika tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime bagi sebuah agen. Respons mencakup alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah alat plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat yang efektif pada runtime untuk sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima konteks auth atau pengiriman yang disediakan pemanggil.
  - Respons adalah proyeksi turunan server yang dibatasi sesi dari inventaris aktif, termasuk alat core, plugin, channel, dan server MCP yang sudah ditemukan.
  - `tools.effective` bersifat hanya baca untuk MCP: metode ini dapat memproyeksikan katalog MCP sesi hangat melalui kebijakan alat final, tetapi tidak membuat runtime MCP, menghubungkan transport, atau menerbitkan `tools/list`. Jika tidak ada katalog hangat yang cocok, respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`, `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri alat efektif menggunakan `source="core"`, `source="plugin"`, `source="channel"`, atau `source="mcp"`.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu alat yang tersedia melalui jalur kebijakan gateway yang sama dengan `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang diselesaikan harus cocok dengan `agentId`.
  - Wrapper core khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan identitas pemilik/admin (`operator.admin`) meskipun metode `tools.invoke` itu sendiri adalah `operator.write`.
  - Respons adalah envelope untuk SDK dengan bidang `ok`, `toolName`, `output` opsional, dan `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload, bukan melewati pipeline kebijakan alat gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris skill yang terlihat bagi sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit` (`operator.admin`) untuk menyiapkan arsip skill privat sebelum menginstalnya. Ini adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur instalasi skill ClawHub normal, dan dinonaktifkan secara default kecuali `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` membuat unggahan yang terikat ke slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada offset terdekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran final dan SHA-256. Commit hanya memfinalisasi unggahan; ini tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi root `SKILL.md`. Nama direktori internal arsip tidak pernah memilih target instalasi.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder skill ke direktori `skills/` workspace agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` menginstal unggahan yang sudah di-commit ke direktori `skills/<slug>` workspace agen default. Slug dan nilai force harus cocok dengan permintaan `skills.upload.begin` asli. Mode ini ditolak kecuali `skills.install.allowUploadedArchives` diaktifkan. Pengaturan ini tidak memengaruhi instalasi ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway. Klien lama mungkin masih mengirim `dangerouslyForceUnsafeInstall`; bidang ini sudah usang, diterima hanya untuk kompatibilitas protokol, dan diabaikan. Gunakan `security.installPolicy` untuk keputusan instalasi yang dimiliki operator.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di workspace agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis untuk entri `provider/*`. Jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran picker. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang, termasuk penemuan yang dibatasi penyedia untuk entri `provider/*`. Tanpa allowlist, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya ketika tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan picker model normal.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan cakupan `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks command/cwd/session yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara persiapan dan forward `system.run` final yang disetujui, gateway menolak run tersebut alih-alih memercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi hanya sesi ketika tidak ada rute yang dapat dikirim secara eksternal yang dapat diselesaikan (misalnya sesi internal/webchat atau konfigurasi multi-channel yang ambigu).
- Hasil final `agent` dapat menyertakan `result.deliveryStatus` saat pengiriman diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan `failed` yang sama seperti yang didokumentasikan untuk [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Versioning

- `PROTOCOL_VERSION` berada di `packages/gateway-protocol/src/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang tidak mencakup protokol saat ini. Klien dan server saat ini memerlukan protokol v4.
- Skema + model dihasilkan dari definisi TypeBox:
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
| Clamp fast-retry setelah device-token close | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Masa tenggang force-stop sebelum `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan tick-timeout                    | kode `4000` saat diam melebihi `tickIntervalMs * 2`   | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`, dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus mematuhi nilai tersebut alih-alih default pra-handshake.

## Auth

- Auth Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang memuat identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header permintaan, bukan dari `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati auth connect rahasia bersama
  sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dicakup ke peran
  koneksi + cakupan. Token ini dikembalikan di `hello-ok.auth.deviceToken` dan harus
  disimpan oleh klien untuk connect berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah connect berhasil.
- Menghubungkan ulang dengan token perangkat yang **tersimpan** tersebut juga harus menggunakan ulang
  kumpulan cakupan yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses
  baca/probe/status yang sudah diberikan dan menghindari penyempitan reconnect secara diam-diam ke
  cakupan implisit khusus admin yang lebih sempit.
- Penyusunan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan jika disetel.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit lebih dulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya jika tidak ada yang di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil diselesaikan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada retry sekali jalan
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Bootstrap kode penyiapan bawaan mengembalikan Node utama
  `hello-ok.auth.deviceToken` plus token operator terbatas di
  `hello-ok.auth.deviceTokens` untuk handoff seluler tepercaya. Token operator
  mencakup `operator.talk.secrets` untuk pembacaan konfigurasi Talk native dan
  mengecualikan `operator.admin` serta `operator.pairing`.
- Saat bootstrap kode penyiapan non-baseline menunggu persetujuan, detail `PAIRING_REQUIRED`
  mencakup `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  dan `pauseReconnect: false`. Klien harus terus reconnect dengan token
  bootstrap yang sama hingga permintaan disetujui atau token menjadi tidak valid.
- Simpan `hello-ok.auth.deviceTokens` hanya ketika connect menggunakan auth bootstrap
  pada transport tepercaya seperti `wss://` atau loopback/pairing lokal.
- Jika klien memasok `deviceToken` **eksplisit** atau `scopes` eksplisit, kumpulan
  cakupan yang diminta pemanggil tersebut tetap otoritatif; cakupan cache hanya
  digunakan ulang saat klien menggunakan ulang token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`). Merotasi atau
  mencabut token Node atau peran non-operator lain juga memerlukan `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Ia menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi dengan
  token perangkat tersebut, sehingga klien khusus token dapat menyimpan penggantinya sebelum
  reconnect. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada kumpulan peran yang disetujui
  dan dicatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang sudah dipairing, manajemen perangkat dibatasi ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat mengelola
  token operator untuk entri perangkat **miliknya sendiri**. Manajemen token Node dan
  non-operator lain hanya untuk admin, bahkan untuk perangkat pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa kumpulan cakupan token operator
  target terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth mencakup `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per perangkat yang dicache.
  - Jika retry tersebut gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak mencakup
  peran/cakupan yang diminta. Klien tidak boleh menampilkannya sebagai token buruk;
  minta operator melakukan pairing ulang atau menyetujui kontrak cakupan yang lebih sempit/luas.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pairing berpusat pada connect local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Connect tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` saat `connect` (operator +
  Node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback pada jalur helper internal
    yang dicadangkan.
- Menghilangkan identitas perangkat memiliki konsekuensi cakupan. Saat koneksi operator
  tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw tetap mengosongkan
  cakupan yang dideklarasikan sendiri menjadi kumpulan kosong kecuali jalur tersebut memiliki
  pengecualian pelestarian cakupan bernama. Metode yang dibatasi cakupan kemudian gagal dengan
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur pelestarian cakupan
  break-glass Control UI. Ini tidak memberikan cakupan kepada klien WebSocket backend kustom
  atau berbentuk CLI sembarang.
- Jalur helper backend `gateway-client` direct-loopback yang dicadangkan mempertahankan
  cakupan hanya untuk RPC control-plane lokal internal; ID backend kustom tidak
  menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce usang/salah.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.              |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang mencakup nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disukai adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain kolom perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan lama `v2` tetap diterima untuk kompatibilitas, tetapi pinning metadata perangkat
  yang sudah dipairing tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional melakukan pin pada fingerprint sertifikat Gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API Gateway lengkap** (status, channel, model, chat,
agen, sesi, Node, persetujuan, dll.). Permukaan persisnya ditentukan oleh
skema TypeBox di `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
