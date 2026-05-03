---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: jabat tangan, bingkai, pengelolaan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-05-03T21:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway protocol WS adalah **bidang kontrol tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **peran** + **cakupan**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat memancarkan event
  `payload.large` sebelum gateway menutup atau membuang frame yang terdampak.
  Event ini menyimpan ukuran, batas, permukaan, dan kode alasan aman. Event ini
  tidak menyimpan isi pesan, konten lampiran, isi frame mentah, token, cookie,
  atau nilai rahasia.

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
mengembalikan error `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason`
diatur ke `"startup-sidecars"` dan `retryAfterMs`. Klien harus mencoba ulang
respons tersebut dalam anggaran koneksi keseluruhan mereka, bukan menampilkannya
sebagai kegagalan handshake terminal.

`server`, `features`, `snapshot`, dan `policy` semuanya diwajibkan oleh skema
(`src/gateway/protocol/schema/frames.ts`). `auth` juga diwajibkan dan melaporkan
peran/cakupan yang dinegosiasikan. `canvasHostUrl` bersifat opsional.

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

Klien backend tepercaya dalam proses yang sama (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback
langsung ketika mereka mengautentikasi dengan token/kata sandi gateway bersama.
Jalur ini disediakan untuk RPC bidang kontrol internal dan mencegah baseline
pasangan CLI/perangkat yang usang memblokir pekerjaan backend lokal seperti
pembaruan sesi subagen. Klien jarak jauh, klien asal browser, klien node, dan
klien token-perangkat/identitas-perangkat eksplisit tetap menggunakan pemeriksaan
pasangan dan peningkatan cakupan normal.

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

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri
peran tambahan yang dibatasi dalam `deviceTokens`:

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

Untuk alur bootstrap node/operator bawaan, token node primer tetap
`scopes: []` dan token operator yang diserahkan tetap dibatasi pada allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan cakupan bootstrap tetap
berprefiks peran: entri operator hanya memenuhi permintaan operator, dan peran
non-operator tetap memerlukan cakupan di bawah prefiks peran mereka sendiri.

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

## Peran + cakupan

Untuk model cakupan operator lengkap, pemeriksaan pada waktu persetujuan, dan
semantik rahasia bersama, lihat [Cakupan operator](/id/gateway/operator-scopes).

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

Metode RPC gateway yang didaftarkan Plugin dapat meminta cakupan operatornya
sendiri, tetapi prefiks admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) selalu diselesaikan ke
`operator.admin`.

Cakupan metode hanya gerbang pertama. Beberapa perintah slash yang dicapai
melalui `chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di
atasnya. Misalnya, penulisan persisten `/config set` dan `/config unset`
memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan cakupan tambahan pada waktu
persetujuan di atas cakupan metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau
  `system.which`: `operator.pairing` + `operator.admin`

### Kapabilitas/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: sakelar granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri Presence mencakup `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  meskipun perangkat tersebut terhubung sebagai **operator** dan **node**.
- `node.list` menyertakan kolom opsional `lastSeenAtMs` dan `lastSeenReason`. Node yang terhubung melaporkan
  waktu koneksi mereka saat ini sebagai `lastSeenAtMs` dengan alasan `connect`; node yang sudah dipasangkan juga dapat melaporkan
  Presence latar belakang yang tahan lama ketika event node tepercaya memperbarui metadata pasangan mereka.

### Event node tetap hidup di latar belakang

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
`background` oleh gateway sebelum persistensi. Event hanya tahan lama untuk sesi perangkat node yang diautentikasi;
sesi tanpa perangkat atau belum dipasangkan mengembalikan `handled: false`.

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
RPC yang diakui, bukan sebagai persistensi Presence yang tahan lama.

## Cakupan event siaran

Event siaran WebSocket yang didorong server dibatasi cakupan sehingga sesi yang dicakup pasangan atau hanya-node tidak menerima konten sesi secara pasif.

- **Frame chat, agen, dan hasil alat** (termasuk event `agent` streaming dan hasil panggilan alat) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Siaran `plugin.*` yang ditentukan Plugin** dibatasi ke `operator.write` atau `operator.admin`, tergantung bagaimana Plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi yang diautentikasi.
- **Keluarga event siaran yang tidak dikenal** secara default dibatasi cakupan (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien mempertahankan nomor urut per-kliennya sendiri sehingga siaran mempertahankan urutan monoton pada soket tersebut meskipun klien yang berbeda melihat subset aliran event yang berbeda karena difilter cakupan.

## Keluarga metode RPC umum

Permukaan WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar
discovery konservatif yang dibangun dari `src/gateway/server-methods-list.ts`
ditambah ekspor metode plugin/channel yang dimuat. Perlakukan ini sebagai
discovery fitur, bukan enumerasi lengkap dari `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diperiksa.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/Plugin, dan id sesi. Ini tidak menyimpan teks chat, isi webhook, keluaran alat, isi permintaan atau respons mentah, token, cookie, atau nilai rahasia. Cakupan baca operator diperlukan.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; kolom sensitif hanya disertakan untuk klien operator bercakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pasangan.
    - `system-presence` mengembalikan snapshot Presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks Presence.
    - `last-heartbeat` mengembalikan event heartbeat terakhir yang dipersisten.
    - `set-heartbeats` mengalihkan pemrosesan heartbeat di gateway.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Teruskan `{ "view": "configured" }` untuk model terkonfigurasi berukuran pemilih (`agents.defaults.models` terlebih dahulu, lalu `models.providers.*.models`), atau `{ "view": "all" }` untuk katalog lengkap.
    - `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / cached embedding untuk workspace agen default aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya saat pemanggil secara eksplisit menginginkan ping provider embedding langsung.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM yang terbatas dan hanya-baca untuk klien control-plane jarak jauh. Ini dapat mencakup jalur workspace, cuplikan memori, markdown grounded yang dirender, dan kandidat promosi mendalam, sehingga pemanggil memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Channel dan pembantu login">
    - `channels.status` mengembalikan ringkasan status channel/plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan channel/akun tertentu saat channel mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider channel web yang saat ini mendukung QR.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai channel saat berhasil.
    - `push.test` mengirim push APNs uji ke Node iOS terdaftar.
    - `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
    - `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman outbound langsung untuk pengiriman yang ditargetkan ke channel/akun/thread di luar chat runner.
    - `logs.tail` mengembalikan tail file-log Gateway terkonfigurasi dengan kontrol kursor/batas dan byte maksimum.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.config` mengembalikan payload konfigurasi Talk efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.speak` menyintesis ucapan melalui provider ucapan Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback, dan status konfigurasi provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS yang disukai.
    - `tts.convert` menjalankan konversi teks-ke-ucapan satu kali.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wizard">
    - `secrets.reload` menyelesaikan ulang SecretRefs aktif dan menukar status rahasia runtime hanya jika sepenuhnya berhasil.
    - `secrets.resolve` menyelesaikan penetapan rahasia target-perintah untuk set perintah/target tertentu.
    - `config.get` mengembalikan snapshot dan hash konfigurasi saat ini.
    - `config.set` menulis payload konfigurasi yang tervalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial.
    - `config.apply` memvalidasi + mengganti payload konfigurasi lengkap.
    - `config.schema` mengembalikan payload skema konfigurasi langsung yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata pembuatan, termasuk metadata skema plugin + channel saat runtime dapat memuatnya. Skema mencakup metadata bidang `title` / `description` yang berasal dari label dan teks bantuan yang sama yang digunakan oleh UI, termasuk cabang komposisi objek bersarang, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi bidang yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan jalur untuk satu jalur konfigurasi: jalur ternormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan anak langsung untuk drill-down UI/CLI. Node skema lookup mempertahankan dokumentasi yang terlihat pengguna dan bidang validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan anak mengekspos `key`, `path` ternormalisasi, `type`, `required`, `hasChildren`, serta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan restart hanya saat pembaruan itu sendiri berhasil; pemanggil dengan sesi dapat menyertakan `continuationMessage` agar startup melanjutkan satu giliran agen tindak lanjut melalui antrean kelanjutan restart. Pembaruan package-manager memaksa restart pembaruan tanpa penundaan dan tanpa cooldown setelah penukaran paket agar proses Gateway lama tidak terus melakukan lazy-loading dari pohon `dist` yang telah diganti.
    - `update.status` mengembalikan sentinel restart pembaruan cache terbaru, termasuk versi yang berjalan setelah restart jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui RPC WS.

  </Accordion>

  <Accordion title="Pembantu agen dan workspace">
    - `agents.list` mengembalikan entri agen terkonfigurasi, termasuk model efektif dan metadata runtime.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan wiring workspace.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file workspace bootstrap yang diekspos untuk agen.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan artifact turunan transkrip dan unduhan untuk cakupan `sessionKey`, `runId`, atau `taskId` eksplisit. Kueri run dan tugas menyelesaikan sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan provenance yang cocok; sumber URL tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris saat backend runtime agen dikonfigurasi.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengalihkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengalihkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi Gateway untuk kunci sesi yang persis.
    - `sessions.resolve` menyelesaikan atau mengkanonikalisasi target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi. Pemanggil dapat meneruskan `key` plus `runId` opsional, atau meneruskan `runId` saja untuk run aktif yang dapat diselesaikan Gateway ke sebuah sesi.
    - `sessions.patch` memperbarui metadata/override sesi dan melaporkan model kanonis yang terselesaikan plus `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi tampilan untuk klien UI: tag direktif inline dihapus dari teks terlihat, payload XML panggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong) dan token kontrol model ASCII/lebar-penuh yang bocor dihapus, baris asisten token senyap murni seperti persis `NO_REPLY` / `no_reply` dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat yang dipasangkan dengan status tertunda dan disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pairing perangkat.
    - `device.token.rotate` merotasi token perangkat yang dipasangkan dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat yang dipasangkan dalam batas peran yang disetujui dan cakupan pemanggilnya.

  </Accordion>

  <Accordion title="Pairing Node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, dan `node.pair.verify` mencakup pairing Node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status Node yang dikenal/terhubung.
    - `node.rename` memperbarui label Node yang dipasangkan.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari Node kembali ke gateway.
    - `node.canvas.capability.refresh` menyegarkan token kapabilitas canvas bercakupan.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk Node offline/terputus.

  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec satu kali plus lookup/replay persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan akhir (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal Node melalui perintah relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan plugin.

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
  yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: event keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan stream event Heartbeat.
- `cron`: event perubahan run/job Cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing Node.
- `node.invoke.request`: broadcast permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode pembantu Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar eksekutabel skill saat ini
  untuk pemeriksaan auto-allow.

### Metode pembantu operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol surface mana yang ditargetkan oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar penyedia jika tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar penyedia jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen berseri dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah agen. Respons menyertakan tool yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool yang efektif saat runtime untuk sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway memperoleh konteks runtime tepercaya dari sesi di sisi server, alih-alih menerima konteks autentikasi atau pengiriman yang diberikan pemanggil.
  - Respons dicakup untuk sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini, termasuk tool inti, plugin, dan kanal.
- Operator dapat memanggil `tools.invoke` (`operator.write`) untuk menjalankan satu tool yang tersedia melalui jalur kebijakan Gateway yang sama seperti `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama ada, agen sesi yang di-resolve harus cocok dengan `agentId`.
  - Respons berupa envelope yang menghadap SDK dengan bidang `ok`, `toolName`, `output` opsional, dan `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan `ok:false` dalam payload, bukan melewati pipeline kebijakan tool Gateway.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris keterampilan yang terlihat untuk sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons menyertakan kelayakan, kebutuhan yang belum terpenuhi, pemeriksaan konfigurasi, dan opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` memasang folder keterampilan ke direktori `skills/` workspace agen default.
  - Mode pemasang Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host Gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di workspace agen default.
  - Mode konfigurasi mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`, `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional:

- Dihilangkan atau `"default"`: perilaku runtime saat ini. Jika `agents.defaults.models` dikonfigurasi, respons adalah katalog yang diizinkan; jika tidak, respons adalah katalog Gateway lengkap.
- `"configured"`: perilaku seukuran pemilih. Jika `agents.defaults.models` dikonfigurasi, itu tetap menang. Jika tidak, respons menggunakan entri `models.providers.*.models` eksplisit, dengan fallback ke katalog lengkap hanya saat tidak ada baris model yang dikonfigurasi.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.models`. Gunakan ini untuk diagnostik dan UI penemuan, bukan pemilih model normal.

## Persetujuan eksekusi

- Saat permintaan eksekusi membutuhkan persetujuan, Gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi otoritatif.
- Jika pemanggil memutasi `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` antara persiapan dan penerusan `system.run` final yang disetujui, Gateway menolak run tersebut alih-alih memercayai payload yang dimutasi.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau hanya internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi hanya sesi saat tidak ada rute eksternal yang dapat dikirim yang bisa di-resolve (misalnya sesi internal/webchat atau konfigurasi multi-kanal yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dibuat dari definisi TypeBox:
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
| Backoff koneksi ulang awal                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff koneksi ulang maks                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp coba ulang cepat setelah device-token close | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Interval tick default (sebelum `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Penutupan tick-timeout                    | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`, dan `policy.maxBufferedBytes` yang efektif dalam `hello-ok`; klien harus mematuhi nilai tersebut alih-alih default sebelum handshake.

## Autentikasi

- Autentikasi Gateway berbasis rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, tergantung pada mode autentikasi yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan autentikasi connect dari
  header permintaan, bukan dari `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati autentikasi connect
  berbasis rahasia bersama sepenuhnya; jangan mengekspos mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dicakup ke peran
  koneksi + cakupan. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  disimpan oleh klien untuk koneksi berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah setiap
  connect yang berhasil.
- Menghubungkan ulang dengan token perangkat yang **tersimpan** itu juga harus menggunakan kembali
  set cakupan yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari reconnect yang diam-diam menyempit menjadi
  cakupan implisit hanya-admin.
- Penyusunan autentikasi connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi berdasarkan urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per perangkat yang tersimpan (dikunci berdasarkan
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya ketika tidak ada hal di atas yang menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil diselesaikan akan menekannya.
  - Promosi otomatis token perangkat yang tersimpan pada percobaan ulang sekali jalan
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token serah-terima bootstrap.
  Simpan hanya ketika connect menggunakan autentikasi bootstrap pada transport tepercaya
  seperti `wss://` atau pairing loopback/lokal.
- Jika klien menyediakan `deviceToken` **eksplisit** atau `scopes` eksplisit, set
  cakupan yang diminta pemanggil itu tetap otoritatif; cakupan cache hanya
  digunakan kembali ketika klien menggunakan kembali token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- `device.token.rotate` mengembalikan metadata rotasi. Ia menggemakan token bearer
  pengganti hanya untuk panggilan perangkat yang sama yang sudah diautentikasi dengan
  token perangkat tersebut, sehingga klien hanya-token dapat menyimpan penggantinya sebelum
  menghubungkan ulang. Rotasi bersama/admin tidak menggemakan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada set peran yang disetujui
  yang tercatat dalam entri pairing perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang sudah dipairing, manajemen perangkat bersifat tercakup sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin dapat menghapus/mencabut/merotasi
  hanya entri perangkat **miliknya sendiri**.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa set cakupan token operator
  target terhadap cakupan sesi pemanggil saat ini. Pemanggil non-admin
  tidak dapat merotasi atau mencabut token operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token per perangkat yang di-cache.
  - Jika percobaan ulang itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali persetujuan otomatis lokal
  diaktifkan.
- Persetujuan otomatis pairing berpusat pada connect local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur pembantu rahasia bersama tepercaya.
- Connect tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - autentikasi Control UI operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
  - RPC backend `gateway-client` direct-loopback yang diautentikasi dengan token/kata sandi
    gateway bersama.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang usang/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.             |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain bidang perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata
  perangkat yang sudah dipairing tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional melakukan pin pada fingerprint sertifikat gateway (lihat konfigurasi `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway lengkap** (status, channel, model, chat,
agen, sesi, node, persetujuan, dll.). Permukaan persisnya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
