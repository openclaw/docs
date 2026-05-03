---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Mendiagnosis ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pemberian versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-05-03T09:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak. Event ini menyimpan
  ukuran, batas, surface, dan kode alasan yang aman. Event ini tidak menyimpan isi pesan,
  isi lampiran, isi frame mentah, token, cookie, atau nilai rahasia.

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
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason` disetel ke
`"startup-sidecars"` dan `retryAfterMs`. Klien harus mencoba ulang respons tersebut
dalam batas koneksi keseluruhan mereka, bukan menampilkannya sebagai kegagalan
handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
role/scope yang dinegosiasikan. `canvasHostUrl` bersifat opsional.

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

Klien backend same-process tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi local loopback langsung saat
mereka mengautentikasi dengan token/kata sandi gateway bersama. Jalur ini dicadangkan
untuk RPC control-plane internal dan mencegah baseline pairing CLI/perangkat yang usang
memblokir pekerjaan backend lokal seperti pembaruan sesi subagent. Klien jarak jauh,
klien asal browser, klien node, dan klien token-perangkat/identitas-perangkat eksplisit
tetap menggunakan pemeriksaan pairing dan peningkatan scope normal.

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
role berbatas tambahan di `deviceTokens`:

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
`scopes: []` dan token operator apa pun yang diserahkan tetap dibatasi pada allowlist
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

## Role + scope

Untuk model scope operator lengkap, pemeriksaan saat persetujuan, dan semantik rahasia bersama,
lihat [Scope operator](/id/gateway/operator-scopes).

### Role

- `operator` = klien control plane (CLI/UI/automasi).
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

Metode RPC gateway yang didaftarkan Plugin dapat meminta scope operator mereka sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu dipetakan ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, penulisan persisten
`/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan saat persetujuan di atas
scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` agar UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** sekaligus **node**.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang dipairing juga dapat melaporkan
  presence latar belakang yang tahan lama saat event node tepercaya memperbarui metadata pairing mereka.

### Event alive latar belakang node

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa node yang dipairing
hidup selama wake latar belakang tanpa menandainya terhubung.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, atau `connect`. String trigger yang tidak dikenal dinormalisasi menjadi
`background` oleh gateway sebelum persistensi. Event ini tahan lama hanya untuk sesi perangkat node
terautentikasi; sesi tanpa perangkat atau belum dipairing mengembalikan `handled: false`.

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

## Cakupan event broadcast

Event broadcast WebSocket yang didorong server digate berdasarkan scope agar sesi dengan scope pairing atau sesi khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan hasil tool** (termasuk event `agent` yang di-stream dan hasil panggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan Plugin** digate ke `operator.write` atau `operator.admin`, tergantung bagaimana plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** digate berdasarkan scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per-kliennya sendiri sehingga broadcast mempertahankan pengurutan monoton pada socket tersebut bahkan saat klien yang berbeda melihat subset event stream yang difilter scope secara berbeda.

## Keluarga metode RPC umum

Surface WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` ditambah ekspor metode
plugin/channel yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi penuh
atas `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbaru yang berbatas. Ini menyimpan metadata operasional seperti nama event, hitungan, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan id sesi. Ini tidak menyimpan teks chat, body webhook, output tool, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Scope baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator dengan scope admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan event Heartbeat terakhir yang dipersisten.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Teruskan `{ "view": "configured" }` untuk model terkonfigurasi berukuran picker (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding cache untuk workspace agent default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping provider embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM terbatas dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat menyertakan jalur workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan timeseries untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan helper login">
    - `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + yang dibundel.
    - `channels.logout` mengeluarkan channel/akun tertentu jika channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web saat ini yang mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel saat berhasil.
    - `push.test` mengirim push APNs percobaan ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang disimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail file-log Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.mode` mengatur/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.speak` menyintesis ucapan melalui provider ucapan Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback, dan status konfigurasi provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS pilihan.
    - `tts.convert` menjalankan konversi teks-ke-ucapan satu kali.

  </Accordion>

  <Accordion title="Secret, konfigurasi, pembaruan, dan wizard">
    - `secrets.reload` me-resolve ulang SecretRef aktif dan menukar status secret runtime hanya saat sepenuhnya berhasil.
    - `secrets.resolve` me-resolve assignment secret target perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot dan hash konfigurasi saat ini.
    - `config.set` menulis payload konfigurasi yang tervalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial.
    - `config.apply` memvalidasi + mengganti payload konfigurasi lengkap.
    - `config.schema` mengembalikan payload skema konfigurasi live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema Plugin + channel saat runtime dapat memuatnya. Skema mencakup metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama yang digunakan oleh UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup dengan cakupan jalur untuk satu jalur konfigurasi: jalur ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan child langsung untuk drill-down UI/CLI. Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child menampilkan `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, ditambah `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil. Pembaruan package-manager memaksa restart pembaruan tanpa defer dan tanpa cooldown setelah pertukaran paket agar proses Gateway lama tidak terus lazy-load dari tree `dist` yang telah diganti.
    - `update.status` mengembalikan sentinel restart pembaruan cache terbaru, termasuk versi yang berjalan setelah restart bila tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Helper agent dan workspace">
    - `agents.list` mengembalikan entri agent terkonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola record agent dan wiring workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agent.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artefak dan unduhan yang diturunkan dari transkrip untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan task me-resolve sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan provenance yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `agent.identity.get` mengembalikan identitas assistant efektif untuk agent atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal bila tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agent dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengalihkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengalihkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi persis.
    - `sessions.resolve` me-resolve atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arah untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` ditambah `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat di-resolve Gateway ke sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang di-resolve plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris assistant token senyap murni seperti persis `NO_REPLY` / `no_reply` dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat paired yang pending dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola record pairing perangkat.
    - `device.token.rotate` merotasi token perangkat paired dalam batas role yang disetujui dan cakupan pemanggil.
    - `device.token.revoke` mencabut token perangkat paired dalam batas role yang disetujui dan cakupan pemanggil.

  </Accordion>

  <Accordion title="Pairing Node, invoke, dan pekerjaan pending">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pairing Node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status Node yang diketahui/terhubung.
    - `node.rename` memperbarui label Node paired.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari Node kembali ke Gateway.
    - `node.canvas.capability.refresh` menyegarkan token capability canvas dengan cakupan tertentu.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan pending tahan lama untuk Node offline/terputus.

  </Accordion>

  <Accordion title="Keluarga approval">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan approval exec satu kali plus lookup/replay approval pending.
    - `exec.approval.waitDecision` menunggu satu approval exec pending dan mengembalikan keputusan akhir (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan approval exec Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan approval exec lokal Node melalui perintah relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur approval yang didefinisikan Plugin.

  </Accordion>

  <Accordion title="Otomasi, Skills, dan alat">
    - Otomasi: `wake` menjadwalkan injeksi teks wake segera atau pada Heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat khusus transkrip
  lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/event-stream untuk sesi
  yang dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: event keepalive / liveness periodik.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan stream event Heartbeat.
- `cron`: event perubahan run/job Cron.
- `shutdown`: notifikasi shutdown Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing Node.
- `node.invoke.request`: broadcast permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat paired.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup approval
  Plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris
  perintah runtime bagi sebuah agen.
  - `agentId` bersifat opsional; abaikan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia
      jika tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan
    perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime bagi
  sebuah agen. Respons mencakup tool yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin saat `source="plugin"`
  - `optional`: apakah tool Plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool
  yang efektif pada runtime bagi sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau konteks pengiriman yang diberikan pemanggil.
  - Respons memiliki cakupan sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, Plugin, dan channel.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu tool yang tersedia melalui
  jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang di-resolve harus cocok dengan
    `agentId`.
  - Respons adalah envelope yang menghadap SDK dengan field `ok`, `toolName`, `output` opsional, dan
    `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload alih-alih
    melewati pipeline kebijakan tool Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat bagi sebuah agen.
  - `agentId` bersifat opsional; abaikan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instal yang disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` memasang sebuah
    folder skill ke direktori `skills/` workspace agen default.
  - Mode penginstal Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host Gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di
    workspace agen default.
  - Mode config menambal nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Diabaikan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan; jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran picker. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang. Jika tidak, respons menggunakan entri eksplisit `models.providers.*.models`, dengan fallback ke katalog lengkap hanya saat tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan picker model normal.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis itu sebagai konteks perintah/cwd/sesi otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara persiapan dan forward `system.run` akhir yang disetujui, Gateway
  menolak run tersebut alih-alih memercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman outbound.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi saat tidak ada rute yang dapat dikirimkan secara eksternal yang dapat di-resolve (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Versioning

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default ini. Nilai-nilai ini
stabil di seluruh protocol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/klien yang dipasangkan) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp retry cepat setelah device-token close | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Masa tenggang force-stop sebelum `terminate()` | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan timeout tick                    | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif dalam `hello-ok`; klien harus mematuhi nilai-nilai tersebut
alih-alih default pra-handshake.

## Auth

- Autentikasi Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode autentikasi yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan autentikasi connect dari
  header permintaan, bukan dari `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati autentikasi connect rahasia bersama
  sepenuhnya; jangan expose mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dibatasi pada role koneksi
  + scope. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  disimpan oleh klien untuk connect berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah connect apa pun
  berhasil.
- Reconnect dengan token perangkat yang **tersimpan** itu juga harus menggunakan kembali
  set scope yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses
  baca/probe/status yang sudah diberikan dan menghindari reconnect diam-diam menyempit
  menjadi scope implisit khusus admin.
- Penyusunan autentikasi connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan ketika disetel.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` hanya dikirim ketika tidak satu pun dari hal di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil ditemukan akan
    menekannya.
  - Promosi otomatis token perangkat yang tersimpan pada percobaan ulang sekali jalan
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Simpan hanya ketika connect menggunakan autentikasi bootstrap pada transport tepercaya
  seperti `wss://` atau pairing loopback/lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set scope
  yang diminta pemanggil tersebut tetap menjadi otoritas; scope cache hanya digunakan
  kembali ketika klien menggunakan ulang token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Ini menggemakan token bearer
  pengganti hanya untuk panggilan dari perangkat yang sama yang sudah diautentikasi dengan
  token perangkat tersebut, sehingga klien khusus token dapat menyimpan penggantinya sebelum
  reconnect. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set role yang disetujui
  yang tercatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas
  atau menargetkan role perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipairing, manajemen perangkat bersifat self-scoped kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set scope token operator target
  terhadap scope sesi pemanggil saat ini. Pemanggil non-admin tidak dapat merotasi atau mencabut
  token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per perangkat yang di-cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pairing berpusat pada connect local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Connect tailnet host yang sama atau LAN tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - autentikasi UI Kontrol operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (darurat, penurunan keamanan berat).
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
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce basi/salah.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.              |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field perangkat/klien/role/scope/token/nonce.
- Tanda tangan lama `v2` tetap diterima untuk kompatibilitas, tetapi pinning metadata perangkat
  yang dipairing tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien secara opsional dapat mengepin fingerprint sertifikat Gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Scope

Protokol ini mengekspos **API Gateway lengkap** (status, channel, model, chat,
agen, sesi, node, persetujuan, dll.). Surface persisnya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
