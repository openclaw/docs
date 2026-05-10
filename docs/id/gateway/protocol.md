---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Mendiagnosis ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, frame, dan pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-05-10T19:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Protocol WS Gateway adalah **control plane + transport node tunggal** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame sebelum koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  sebaiknya mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak.
  Event ini menyimpan ukuran, batas, surface, dan kode alasan yang aman. Event ini
  tidak menyimpan isi pesan, konten lampiran, isi frame mentah, token, cookie,
  atau nilai rahasia.

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

Saat Gateway masih menyelesaikan sidecar startup, permintaan `connect` dapat
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason`
diatur ke `"startup-sidecars"` dan `retryAfterMs`. Klien sebaiknya mencoba ulang
respons tersebut dalam anggaran koneksi keseluruhannya, bukan menampilkannya
sebagai kegagalan handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga wajib dan melaporkan
role/scope yang dinegosiasikan. `pluginSurfaceUrls` bersifat opsional dan
memetakan nama surface plugin, seperti `canvas`, ke URL terhosting berscope.

URL surface plugin berscope dapat kedaluwarsa. Node dapat memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk menerima
entri baru di `pluginSurfaceUrls`. Refaktor eksperimental Plugin Canvas tidak
mendukung jalur kompatibilitas `canvasHostUrl`, `canvasCapability`, atau
`node.canvas.capability.refresh` yang sudah tidak digunakan; klien native dan
gateway saat ini harus menggunakan surface plugin.

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
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback
langsung saat mereka melakukan autentikasi dengan token/kata sandi gateway
bersama. Jalur ini dicadangkan untuk RPC control-plane internal dan menjaga
baseline pemasangan CLI/perangkat yang usang agar tidak memblokir pekerjaan
backend lokal seperti pembaruan sesi subagen. Klien jarak jauh, klien asal
browser, klien node, dan klien token perangkat/identitas perangkat eksplisit
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

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri
role terbatas tambahan di `deviceTokens`:

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
`scopes: []` dan token operator yang di-handoff tetap dibatasi pada allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berprefiks role: entri operator hanya memenuhi permintaan operator, dan role
non-operator tetap memerlukan scope di bawah prefiks role mereka sendiri.

### Contoh node

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

Metode yang menimbulkan efek samping memerlukan **kunci idempotensi** (lihat skema).

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

Metode RPC gateway yang didaftarkan plugin dapat meminta scope operator mereka
sendiri, tetapi prefiks admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) selalu diselesaikan ke
`operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa perintah slash yang dicapai
melalui `chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di
atasnya. Misalnya, penulisan persisten `/config set` dan `/config unset`
memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat persetujuan di
atas scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Kapabilitas/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat koneksi:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  meskipun perangkat tersebut terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipasangkan juga dapat melaporkan
  presence latar belakang yang tahan lama saat event node tepercaya memperbarui metadata pemasangannya.

### Event alive latar belakang node

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang dipasangkan
aktif selama wake latar belakang tanpa menandainya terhubung.

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
RPC yang diakui, bukan sebagai persistensi presence yang tahan lama.

## Penscope-an event broadcast

Event broadcast WebSocket yang didorong server diberi gate scope sehingga sesi berscope pemasangan atau khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agen, dan hasil tool** (termasuk event `agent` yang dialirkan dan hasil panggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan plugin** diberi gate ke `operator.write` atau `operator.admin`, bergantung pada cara plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** diberi gate scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urut per kliennya sendiri sehingga broadcast mempertahankan pengurutan monotonik pada socket tersebut meskipun klien berbeda melihat subset stream event yang difilter scope secara berbeda.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar
penemuan konservatif yang dibangun dari `src/gateway/server-methods-list.ts`
ditambah ekspor metode plugin/channel yang dimuat. Perlakukan sebagai penemuan
fitur, bukan enumerasi lengkap dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan id sesi. Ini tidak menyimpan teks chat, isi webhook, output tool, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Scope baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway gaya `/status`; field sensitif hanya disertakan untuk klien operator berscope admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pemasangan.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan event heartbeat terakhir yang dipersisten.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat di gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Berikan `{ "view": "configured" }` untuk model terkonfigurasi berukuran pemilih (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan penyedia/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / cached embedding untuk workspace agen default aktif. Berikan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping penyedia embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM yang dibatasi dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat menyertakan jalur workspace, cuplikan memori, markdown berlandaskan yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan helper login">
    - `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan channel/akun tertentu ketika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk penyedia channel web berkemampuan QR saat ini.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel jika berhasil.
    - `push.test` mengirim push APNs percobaan ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman outbound langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail file-log Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog penyedia Talk hanya-baca untuk speech, transkripsi streaming, dan suara realtime. Ini mencakup id penyedia, label, status terkonfigurasi, id model/suara yang diekspos, mode kanonis, transport, strategi brain, serta flag audio/kapabilitas realtime tanpa mengembalikan secret penyedia atau memutasi config global.
    - `talk.config` mengembalikan payload config Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi managed-room, memancarkan event `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata room/sesi beserta event Talk terbaru tanpa token plaintext atau hash token tersimpan.
    - `talk.session.appendAudio` menambahkan audio input PCM base64 ke sesi relay realtime dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` menggerakkan lifecycle giliran managed-room dengan penolakan giliran usang sebelum state dibersihkan.
    - `talk.session.cancelOutput` menghentikan output audio asisten, terutama untuk barge-in yang dikendalikan VAD dalam sesi relay Gateway.
    - `talk.session.submitToolResult` menyelesaikan panggilan tool penyedia yang dipancarkan oleh sesi relay realtime milik Gateway. Berikan `options: { willContinue: true }` untuk output tool sementara ketika hasil final akan menyusul, atau `options: { suppressResponse: true }` ketika hasil tool harus memenuhi panggilan penyedia tanpa memulai respons asisten realtime lain.
    - `talk.session.close` menutup sesi relay, transkripsi, atau managed-room milik Gateway dan memancarkan event Talk terminal.
    - `talk.mode` menetapkan/menyiarkan state mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat sesi penyedia realtime milik klien menggunakan `webrtc` atau `provider-websocket` sementara Gateway memiliki config, kredensial, instruksi, dan kebijakan tool.
    - `talk.client.toolCall` memungkinkan transport realtime milik klien meneruskan panggilan tool penyedia ke kebijakan Gateway. Tool pertama yang didukung adalah `openclaw_agent_consult`; klien menerima id run dan menunggu event lifecycle chat normal sebelum mengirimkan hasil tool khusus penyedia.
    - `talk.event` adalah satu-satunya channel event Talk untuk adaptor realtime, transkripsi, STT/TTS, managed-room, telefoni, dan rapat.
    - `talk.speak` menyintesis speech melalui penyedia speech Talk aktif.
    - `tts.status` mengembalikan state TTS diaktifkan, penyedia aktif, penyedia fallback, dan state config penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan state prefs TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi text-to-speech sekali jalan.

  </Accordion>

  <Accordion title="Secret, config, pembaruan, dan wizard">
    - `secrets.reload` menyelesaikan ulang SecretRefs aktif dan menukar state secret runtime hanya jika berhasil penuh.
    - `secrets.resolve` menyelesaikan penetapan secret target-perintah untuk sekumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot config saat ini dan hash.
    - `config.set` menulis payload config yang tervalidasi.
    - `config.patch` menggabungkan pembaruan config parsial.
    - `config.apply` memvalidasi + mengganti payload config lengkap.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk metadata skema Plugin + channel ketika runtime dapat memuatnya. Skema mencakup metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama dengan yang digunakan UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` ketika dokumentasi field yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup berscope jalur untuk satu jalur config: jalur ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan child langsung untuk penelusuran mendalam UI/CLI. Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, plus `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` agar startup melanjutkan satu giliran agen lanjutan melalui antrean kelanjutan restart. Pembaruan package-manager memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah pertukaran package sehingga proses Gateway lama tidak terus melakukan lazy-load dari pohon `dist` yang sudah diganti.
    - `update.status` mengembalikan sentinel restart pembaruan cache terbaru, termasuk versi yang berjalan setelah restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Helper agen dan workspace">
    - `agents.list` mengembalikan entri agen terkonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola record agen dan pengawatan workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos ledger tugas Gateway ke klien SDK dan operator.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak turunan transkrip dan unduhan untuk scope `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan provenance yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mengekspos discovery environment lokal Gateway dan Node yang hanya-baca untuk klien SDK.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengalihkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengalihkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi persis.
    - `sessions.resolve` menyelesaikan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat memberikan `key` plus `runId` opsional, atau hanya memberikan `runId` untuk run aktif yang dapat diselesaikan Gateway ke sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang terselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi tampilan untuk klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan tool plain-text (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris berukuran terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat ter-pairing yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola record pairing perangkat.
    - `device.token.rotate` merotasi token perangkat ter-pairing dalam batas role yang disetujui dan scope pemanggilnya.
    - `device.token.revoke` mencabut token perangkat ter-pairing dalam batas role yang disetujui dan scope pemanggilnya.

  </Accordion>

  <Accordion title="Pairing Node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pairing Node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan state Node yang dikenal/terhubung.
    - `node.rename` memperbarui label Node ter-pairing.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari Node kembali ke gateway.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk Node offline/terputus.

  </Accordion>

  <Accordion title="Kelompok persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan serta pencarian/pemutaran ulang persetujuan yang tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec yang tertunda dan mengembalikan keputusan akhir (atau `null` saat waktu habis).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal Node melalui perintah relai Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan Plugin.

  </Accordion>

  <Accordion title="Otomatisasi, Skills, dan alat">
    - Otomatisasi: `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Kelompok peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat lain yang hanya ada di transkrip.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran peristiwa untuk sesi yang dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan aliran peristiwa Heartbeat.
- `cron`: peristiwa perubahan run/job Cron.
- `shutdown`: notifikasi penghentian Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing Node.
- `node.invoke.request`: broadcast permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi pemicu kata bangun berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan Plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini untuk pemeriksaan auto-allow.

### RPC ledger tugas

Klien operator dapat memeriksa dan membatalkan catatan tugas latar belakang Gateway melalui RPC ledger tugas. Metode ini mengembalikan ringkasan tugas yang disanitasi, bukan status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Param: `status` opsional (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"`, atau `"timed_out"`) atau array dari status tersebut, `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga `500`, dan string `cursor` opsional.
  - Hasil: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Param: `{ "taskId": string }`.
  - Hasil: `{ "task": TaskSummary }`.
  - Id tugas yang tidak ada mengembalikan bentuk error not-found Gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Param: `{ "taskId": string, "reason"?: string }`.
  - Hasil:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled` melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional seperti `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progres, ringkasan terminal, dan teks error yang disanitasi.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol surface yang ditargetkan `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar provider saat tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar provider saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime untuk agen. Respons menyertakan alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin saat `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat yang efektif saat runtime untuk sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server, bukan menerima konteks auth atau delivery yang dipasok pemanggil.
  - Respons bersifat terbatas pada sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini, termasuk alat core, Plugin, dan kanal.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu alat yang tersedia melalui jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib. `args`, `sessionKey`, `agentId`, `confirm`, dan `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang di-resolve harus cocok dengan `agentId`.
  - Respons adalah envelope yang menghadap SDK dengan `ok`, `toolName`, `output` opsional, dan field `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload, bukan melewati pipeline kebijakan alat Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris skill yang terlihat untuk agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons menyertakan kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan opsi instal yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit` (`operator.admin`) untuk menyiapkan arsip skill privat sebelum menginstalnya. Ini adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur instal skill ClawHub normal, dan dinonaktifkan secara default kecuali `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    membuat unggahan yang terikat ke slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada offset hasil decode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran akhir dan SHA-256. Commit hanya memfinalisasi unggahan; tidak menginstal skill.
  - Arsip skill yang diunggah adalah arsip zip yang berisi root `SKILL.md`. Nama direktori internal arsip tidak pernah memilih target instal.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder skill ke direktori `skills/` workspace agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    menginstal unggahan yang sudah di-commit ke direktori `skills/<slug>` workspace agen default. Slug dan nilai force harus cocok dengan permintaan `skills.upload.begin` asli. Mode ini ditolak kecuali `skills.install.allowUploadedArchives` diaktifkan. Pengaturan tersebut tidak memengaruhi instal ClawHub.
  - Mode penginstal Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host Gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instal ClawHub yang dilacak di workspace agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis untuk entri `provider/*`. Jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran picker. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang, termasuk penemuan berbatas provider untuk entri `provider/*`. Tanpa allowlist, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya ketika tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan picker model normal.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah persetujuan, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara prepare dan forward `system.run` akhir yang disetujui, Gateway menolak run tersebut alih-alih memercayai payload yang diubah.

## Fallback delivery agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta delivery keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target delivery yang tidak dapat di-resolve atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi saat tidak ada rute eksternal yang dapat di-deliver yang bisa di-resolve (misalnya sesi internal/webchat atau konfigurasi multi-kanal yang ambigu).
- Hasil akhir `agent` dapat menyertakan `result.deliveryStatus` saat delivery diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan `failed` yang sama seperti yang didokumentasikan untuk [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Versioning

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilai stabil di seluruh protocol v4 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Nilai default                                        | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Batas waktu permintaan (per RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Batas waktu praauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (konfigurasi/env dapat menaikkan anggaran server/client berpasangan) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp fast-retry setelah device-token close | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Masa tenggang force-stop sebelum `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Batas waktu default `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan karena tick-timeout             | kode `4000` ketika senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                  |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif di `hello-ok`; klien harus mematuhi nilai-nilai tersebut
alih-alih default pra-handshake.

## Auth

- Auth Gateway dengan shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` untuk private-ingress melewati auth connect shared-secret
  sepenuhnya; jangan paparkan mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dicakup ke role koneksi
  + scopes. Token ini dikembalikan di `hello-ok.auth.deviceToken` dan harus
  dipersistenkan oleh klien untuk connect berikutnya.
- Klien harus mempersistenkan `hello-ok.auth.deviceToken` primer setelah
  connect berhasil.
- Reconnect dengan token perangkat yang **tersimpan** itu juga harus memakai ulang set scope
  yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari reconnect diam-diam menyusut ke scope implisit
  khusus admin yang lebih sempit.
- Perakitan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` hanya dikirim ketika tidak ada hal di atas yang menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang ditemukan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Persistenkan hanya ketika connect menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau pairing loopback/lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set scope
  yang diminta pemanggil itu tetap otoritatif; scope yang di-cache hanya
  digunakan ulang ketika klien memakai ulang token per perangkat tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Ini menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi dengan
  token perangkat tersebut, sehingga klien token-only dapat mempersistenkan penggantinya sebelum
  reconnect. Rotasi shared/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set role yang disetujui
  yang tercatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan role perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipairing, manajemen perangkat bersifat self-scoped kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set scope token operator target
  terhadap scope sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per perangkat yang di-cache.
  - Jika retry itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali auto-approval lokal
  diaktifkan.
- Auto-approval pairing berpusat pada connect local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper shared-secret tepercaya.
- Connect tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` saat `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback yang diautentikasi dengan token/password
    Gateway bersama.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien legacy yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce kedaluwarsa/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalisasi kunci publik gagal.          |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Tanda tangan legacy `v2` tetap diterima untuk kompatibilitas, tetapi pinning metadata
  perangkat yang dipairing tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional melakukan pin fingerprint sertifikat Gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Scope

Protokol ini mengekspos **API Gateway penuh** (status, channels, models, chat,
agent, sessions, nodes, approvals, dll.). Permukaan pastinya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
