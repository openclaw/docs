---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pemversian'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-30T09:51:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol adalah **bidang kontrol tunggal + transport Node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, Node iOS/Android, Node
headless) terhubung melalui WebSocket dan mendeklarasikan **peran** + **cakupan** mereka saat
handshake.

## Transport

- WebSocket, frame teks dengan muatan JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame sebelum koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  sebaiknya mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat menghasilkan event `payload.large`
  sebelum Gateway menutup atau membuang frame yang terdampak. Event ini menyimpan
  ukuran, batas, permukaan, dan kode alasan aman. Event ini tidak menyimpan isi pesan,
  konten lampiran, isi frame mentah, token, cookie, atau nilai rahasia.

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
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason` diatur ke
`"startup-sidecars"` dan `retryAfterMs`. Klien sebaiknya mencoba ulang respons tersebut
dalam anggaran koneksi keseluruhan mereka, bukan menampilkannya sebagai kegagalan
handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
peran/cakupan yang dinegosiasikan. `canvasHostUrl` bersifat opsional.

Ketika tidak ada token perangkat yang diterbitkan, `hello-ok.auth` melaporkan
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
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung ketika
mereka melakukan autentikasi dengan token/kata sandi Gateway bersama. Jalur ini dicadangkan
untuk RPC bidang kontrol internal dan mencegah baseline pemasangan CLI/perangkat yang usang
memblokir pekerjaan backend lokal seperti pembaruan sesi subagen. Klien jarak jauh,
klien asal browser, klien Node, dan klien token-perangkat/identitas-perangkat eksplisit
tetap menggunakan pemeriksaan pemasangan dan peningkatan cakupan normal.

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

Selama serah-terima bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan
entri peran tambahan yang dibatasi dalam `deviceTokens`:

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

Untuk alur bootstrap Node/operator bawaan, token Node utama tetap
`scopes: []` dan token operator yang diserahkan tetap dibatasi pada allowlist operator
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan cakupan bootstrap tetap
berawalan peran: entri operator hanya memenuhi permintaan operator, dan peran non-operator
tetap memerlukan cakupan di bawah prefiks peran mereka sendiri.

### Contoh Node

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

Metode yang menimbulkan efek samping memerlukan **kunci idempotensi** (lihat skema).

## Peran + cakupan

### Peran

- `operator` = klien bidang kontrol (CLI/UI/otomasi).
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

Metode RPC Gateway yang didaftarkan Plugin dapat meminta cakupan operator mereka sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diselesaikan ke `operator.admin`.

Cakupan metode hanya gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, penulisan persisten
`/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan cakupan tambahan saat persetujuan di atas
cakupan metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah Node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Kapabilitas/perintah/izin (Node)

Node mendeklarasikan klaim kapabilitas saat koneksi:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menerapkan allowlist sisi server.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri kehadiran menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan ketika perangkat terhubung sebagai **operator** dan **Node** sekaligus.
- `node.list` menyertakan field opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi mereka saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; Node yang telah dipasangkan juga dapat melaporkan
  kehadiran latar belakang yang tahan lama ketika event Node tepercaya memperbarui metadata pemasangan mereka.

### Event Node aktif di latar belakang

Node dapat memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa Node yang dipasangkan
aktif selama wake latar belakang tanpa menandainya sebagai terhubung.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, atau `connect`. String trigger yang tidak dikenal dinormalisasi menjadi
`background` oleh Gateway sebelum persistensi. Event ini hanya tahan lama untuk sesi perangkat Node
yang terautentikasi; sesi tanpa perangkat atau belum dipasangkan mengembalikan `handled: false`.

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

## Penentuan Cakupan Event Siaran

Event siaran WebSocket yang didorong server dibatasi cakupan sehingga sesi bercakupan pemasangan atau khusus Node tidak menerima konten sesi secara pasif.

- **Frame chat, agen, dan hasil alat** (termasuk event `agent` yang dialirkan dan hasil pemanggilan alat) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Siaran `plugin.*` yang didefinisikan Plugin** digerbangkan ke `operator.write` atau `operator.admin`, tergantung cara Plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi terautentikasi.
- **Keluarga event siaran yang tidak dikenal** digerbangkan cakupan secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per kliennya sendiri sehingga siaran mempertahankan pengurutan monoton pada soket tersebut bahkan ketika klien yang berbeda melihat subset aliran event yang telah difilter cakupannya secara berbeda.

## Keluarga metode RPC umum

Permukaan WS publik lebih luas daripada contoh handshake/autentikasi di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar penemuan
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` ditambah ekspor metode
Plugin/saluran yang dimuat. Perlakukan ini sebagai penemuan fitur, bukan enumerasi lengkap
dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan Gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/Plugin, dan id sesi. Ini tidak menyimpan teks chat, isi Webhook, output alat, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan Gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat Gateway yang digunakan oleh alur relay dan pemasangan.
    - `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat operator/Node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks kehadiran.
    - `last-heartbeat` mengembalikan event Heartbeat tersimpan terbaru.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat pada Gateway.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Teruskan `{ "view": "configured" }` untuk model terkonfigurasi berukuran pemilih (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan penyedia/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor / embedding yang di-cache untuk workspace agen default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya ketika pemanggil secara eksplisit menginginkan ping penyedia embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM terbatas dan baca-saja untuk klien control-plane jarak jauh. Ini dapat menyertakan jalur workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + yang dibundel.
    - `channels.logout` mengeluarkan channel/akun tertentu saat channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk penyedia channel web berkemampuan QR saat ini.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel saat berhasil.
    - `push.test` mengirim push APNs uji ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman bertarget channel/akun/thread di luar runner chat.
    - `logs.tail` mengembalikan tail log-file Gateway yang dikonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.speak` menyintesis ucapan melalui penyedia ucapan Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, penyedia aktif, penyedia fallback, dan status konfigurasi penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan status preferensi TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi text-to-speech sekali jalan.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` menyelesaikan ulang SecretRef aktif dan menukar status rahasia runtime hanya jika seluruhnya berhasil.
    - `secrets.resolve` menyelesaikan penetapan rahasia bertarget perintah untuk set perintah/target tertentu.
    - `config.get` mengembalikan snapshot konfigurasi dan hash saat ini.
    - `config.set` menulis payload konfigurasi yang telah divalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial.
    - `config.apply` memvalidasi + mengganti payload konfigurasi penuh.
    - `config.schema` mengembalikan payload skema konfigurasi live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema Plugin + channel saat runtime dapat memuatnya. Skema ini menyertakan metadata bidang `title` / `description` yang diturunkan dari label dan teks bantuan yang sama yang digunakan oleh UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi bidang yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup dengan cakupan jalur untuk satu jalur konfigurasi: jalur ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan turunan langsung untuk drill-down UI/CLI. Node skema lookup mempertahankan dokumen yang menghadap pengguna dan bidang validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, serta flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan turunan mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, serta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya ketika pembaruan itu sendiri berhasil.
    - `update.status` mengembalikan sentinel restart pembaruan yang di-cache terbaru, termasuk versi yang berjalan setelah restart bila tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.

  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan wiring workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal bila tersedia.

  </Accordion>

  <Accordion title="Session control">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris saat backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengalihkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengalihkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.resolve` menyelesaikan atau mengkanoniskan target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sebuah sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang diselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi lengkap yang tersimpan.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline dihapus dari teks yang terlihat, payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - `device.pair.list` mengembalikan perangkat tersanding yang tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan penyandingan perangkat.
    - `device.token.rotate` merotasi token perangkat tersanding dalam batas peran yang disetujui dan cakupan pemanggil.
    - `device.token.revoke` mencabut token perangkat tersanding dalam batas peran yang disetujui dan cakupan pemanggil.

  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup penyandingan Node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status Node yang dikenal/terhubung.
    - `node.rename` memperbarui label Node tersanding.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari Node kembali ke Gateway.
    - `node.canvas.capability.refresh` menyegarkan token kemampuan canvas bercakupan.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk Node offline/terputus.

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan plus lookup/replay persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan akhir (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal Node melalui perintah relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan Plugin.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Otomasi: `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat khusus transkrip lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/event-stream untuk sesi yang dilanggan.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: event keepalive / liveness periodik.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan stream event Heartbeat.
- `cron`: event perubahan run/job Cron.
- `shutdown`: notifikasi shutdown Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup penyandingan Node.
- `node.invoke.request`: siaran permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat tersanding.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan Plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia jika tersedia
  - `textAliases` memuat alias slash persis seperti `/model` dan `/m`.
  - `nativeName` memuat nama perintah native yang sadar penyedia jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog alat runtime untuk sebuah agen. Respons menyertakan alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin ketika `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris alat yang efektif saat runtime untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sisi server sesi, alih-alih menerima konteks autentikasi atau pengiriman yang disediakan pemanggil.
  - Respons dibatasi untuk sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini, termasuk alat inti, Plugin, dan kanal.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris Skills yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons menyertakan kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan opsi instalasi yang telah disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` memasang folder skill ke direktori `skills/` workspace agen default.
  - Mode pemasang Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` menjalankan tindakan `metadata.openclaw.install` yang dideklarasikan pada host Gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di workspace agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan; jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku berukuran pemilih. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang. Jika tidak, respons menggunakan entri `models.providers.*.models` eksplisit, kembali ke katalog lengkap hanya ketika tidak ada baris model terkonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan pemilih model normal.

## Persetujuan exec

- Ketika permintaan exec memerlukan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan cakupan `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara persiapan dan penerusan akhir `system.run` yang disetujui, Gateway menolak eksekusi tersebut alih-alih memercayai payload yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi hanya sesi ketika tidak ada rute eksternal yang dapat dikirim yang dapat diselesaikan (misalnya sesi internal/webchat atau konfigurasi multi-kanal yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default berikut. Nilai stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env dapat menaikkan anggaran server/klien berpasangan) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp percobaan ulang cepat setelah penutupan device-token | `250` ms                              | `src/gateway/client.ts`                                                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (pra `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Penutupan tick-timeout                    | kode `4000` ketika senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                  |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`, dan `policy.maxBufferedBytes` efektif di `hello-ok`; klien harus menghormati nilai tersebut alih-alih default pra-handshake.

## Autentikasi

- Autentikasi Gateway rahasia bersama menggunakan `connect.params.auth.token` atau `connect.params.auth.password`, bergantung pada mode autentikasi yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve (`gateway.auth.allowTailscale: true`) atau `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan autentikasi connect dari header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` untuk private-ingress melewati autentikasi connect rahasia bersama sepenuhnya; jangan paparkan mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dibatasi ke peran + cakupan koneksi. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus dipersistenkan oleh klien untuk connect berikutnya.
- Klien harus mempersistenkan `hello-ok.auth.deviceToken` utama setelah setiap connect yang berhasil.
- Reconnect dengan token perangkat yang **tersimpan** tersebut juga harus menggunakan kembali set cakupan yang disetujui dan tersimpan untuk token itu. Ini mempertahankan akses baca/probe/status yang sudah diberikan dan menghindari reconnect diam-diam menyempit ke cakupan implisit hanya admin.
- Penyusunan autentikasi connect sisi klien (`selectConnectAuth` di `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan ketika disetel.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (di-key oleh `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak ada satu pun di atas yang menghasilkan `auth.token`. Token bersama atau token perangkat apa pun yang terselesaikan akan menekannya.
  - Promosi otomatis token perangkat yang tersimpan pada percobaan ulang sekali jalan `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** — loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik tanpa pinning tidak memenuhi syarat.
- Entri `hello-ok.auth.deviceTokens` tambahan adalah token serah-terima bootstrap. Persistenkan hanya ketika connect menggunakan autentikasi bootstrap pada transport tepercaya seperti `wss://` atau pairing loopback/lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set cakupan yang diminta pemanggil tersebut tetap otoritatif; cakupan cache hanya digunakan kembali ketika klien menggunakan ulang token per perangkat yang tersimpan.
- Token perangkat dapat diputar/dicabut melalui `device.token.rotate` dan `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Ini menggemakan token bearer pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi dengan token perangkat tersebut, sehingga klien hanya-token dapat mempersistenkan penggantinya sebelum reconnect. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi ke set peran yang disetujui yang tercatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas atau menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipasangkan, pengelolaan perangkat dibatasi pada diri sendiri kecuali pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/memutar entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set cakupan token operator target terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin tidak dapat memutar atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per perangkat yang di-cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang berasal dari
  sidik jari keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pemasangan diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pemasangan berpusat pada koneksi langsung local loopback.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai jarak jauh untuk pemasangan dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback yang diautentikasi dengan token/password
    Gateway bersama.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien legacy yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce usang/salah.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp bertanda tangan berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan sidik jari kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisisasi kunci publik gagal.            |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disukai adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain bidang device/client/role/scopes/token/nonce.
- Tanda tangan legacy `v2` tetap diterima untuk kompatibilitas, tetapi pinning
  metadata perangkat yang dipasangkan tetap mengontrol kebijakan perintah saat terhubung ulang.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional melakukan pinning sidik jari sertifikat gateway (lihat konfigurasi `gateway.tls`
  ditambah `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway penuh** (status, channel, model, chat,
agent, sesi, node, persetujuan, dll.). Permukaan pastinya didefinisikan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol Bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
