---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-07-20T14:05:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c4d1769eef5af3af9bc81ba8b996e32b79548bf2e2d53bd45db5a24c016123e
    source_path: gateway/protocol.md
    workflow: 16
---

Protokol WS Gateway adalah bidang kontrol tunggal dan transportasi node untuk
OpenClaw. Klien operator dan node (CLI, UI web, aplikasi macOS, node iOS/Android,
node headless) terhubung melalui WebSocket dan mendeklarasikan **peran** serta **cakupan** pada
saat handshake.

## Paket npm

Paket-paket ini disertakan dalam rangkaian rilis OpenClaw. Selama peluncuran awal,
npm mungkin mengembalikan `E404` hingga rilis pertama yang memuat paket dipublikasikan.

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  memublikasikan skema, validator, tipe TypeScript, pembantu frame dan galat yang
  ringan, serta konstanta versi. Tarball-nya mencakup kontrak yang dapat dibaca mesin
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  yang dihasilkan.
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  memublikasikan klien Node referensi dan entri yang aman untuk browser di
  `@openclaw/gateway-client/browser`.

Untuk panduan siklus hidup aplikasi, lihat
[Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients). Untuk aplikasi
yang mengawasi Gateway sebagai proses anak, lihat
[Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding).

## Transportasi dan framing

- WebSocket, frame teks, payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Setelah
  handshake, ikuti `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Saat diagnostik diaktifkan, frame masuk yang terlalu besar
  dan buffer keluar yang lambat memancarkan peristiwa `payload.large` sebelum
  gateway menutup koneksi atau membuang frame. Peristiwa ini membawa `surface`, ukuran
  byte, batas, dan kode alasan yang aman, tetapi tidak pernah membawa isi pesan, konten
  lampiran, byte frame mentah, token, cookie, atau rahasia.

Bentuk frame:

- Permintaan: `{type:"req", id, method, params}`
- Respons: `{type:"res", id, ok, payload|error}`
- Peristiwa: `{type:"event", event, payload, seq?, stateVersion?}`

Galat respons menggunakan `{ code, message, details?, retryable?, retryAfterMs? }`.
Klien harus membuat percabangan berdasarkan `code` dan `details.code`; `message` tetap dapat dibaca manusia
dan dapat berubah kecuali jika catatan kompatibilitas menyatakan sebaliknya. Kegagalan
otorisasi tingkat metode menggunakan `code: "FORBIDDEN"` tingkat atas dengan
detail cakupan yang hilang secara terstruktur:

- Cakupan yang hilang: `{ code: "MISSING_SCOPE", missingScope, requiredScopes }`.
  `requiredScopes` adalah kumpulan lengkap cakupan yang diketahui untuk operasi yang diminta.
  Pesan lama `missing scope: <scope>` dipertahankan untuk klien lama.

Klien harus membaca `details` terlebih dahulu dan menggunakan pesan lama hanya sebagai fallback
kompatibilitas. `readMissingScopeError` dan `readMissingScopeErrorDetails` diekspor dari
`@openclaw/gateway-protocol/gateway-error-details`; klien gateway yang aman untuk browser
mengekspornya kembali dari `@openclaw/gateway-client/browser`.

Skema diekspor sebagai `GatewayErrorDetailsSchema`,
`MissingScopeErrorDetailsSchema` dari `@openclaw/gateway-protocol/schema`.
Kegagalan cakupan HTTP mencerminkan objek `MISSING_SCOPE` di bawah `error.details` dan
menggunakan status HTTP `403`.

Metode yang menimbulkan efek samping memerlukan kunci idempotensi (lihat skema).

## Handshake

Gateway mengirim tantangan pra-koneksi:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klien membalas dengan `connect`:

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

Gateway merespons dengan `hello-ok`:

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

`server`, `features`, `snapshot`, `policy`, dan `auth` semuanya diwajibkan oleh
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
melaporkan peran/cakupan yang dinegosiasikan bahkan saat token perangkat tidak diterbitkan (bentuk
di atas). `pluginSurfaceUrls` bersifat opsional dan memetakan nama permukaan plugin (misalnya
`canvas`) ke URL terhosting dengan cakupan; URL tersebut dapat kedaluwarsa, sehingga node memanggil
`node.pluginSurface.refresh` dengan `{ "surface": "canvas" }` untuk mendapatkan entri baru.
Jalur `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
yang sudah tidak digunakan lagi tidak didukung; gunakan permukaan plugin.
`appliedConfigHash` opsional milik snapshot adalah revisi konfigurasi sumber yang telah diselesaikan
dan diterima oleh runtime Gateway aktif. Klien dapat membandingkannya dengan
`config.get.configRevisionHash` untuk menentukan apakah konfigurasi tersimpan yang lebih baru masih
memerlukan mulai ulang. `config.get.hash` tetap merupakan revisi file root mentah yang digunakan oleh
pelindung konflik penulisan konfigurasi.

Saat gateway masih menyelesaikan sidecar startup, `connect` dapat mengembalikan
galat `UNAVAILABLE` yang dapat dicoba ulang dengan `details.reason: "startup-sidecars"` dan
`retryAfterMs`. Coba ulang dalam anggaran koneksi Anda alih-alih menganggapnya sebagai
kegagalan handshake terminal.

Saat token perangkat diterbitkan, `hello-ok.auth` menambahkannya:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bootstrap kode QR/penyiapan bawaan adalah jalur serah-terima seluler. Koneksi
kode penyiapan dasar yang berhasil mengembalikan satu token node utama beserta satu
token operator terbatas:

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

Serah-terima operator ini sengaja dibatasi: cukup untuk memulai loop
operator seluler dan penyiapan native, termasuk `operator.talk.secrets` untuk pembacaan
konfigurasi Talk, tetapi tanpa cakupan mutasi pemasangan dan tanpa `operator.admin`. Akses
pemasangan/admin yang lebih luas memerlukan alur pemasangan atau token terpisah yang disetujui. Persistenkan
`hello-ok.auth.deviceTokens` hanya ketika autentikasi bootstrap dijalankan melalui transportasi
tepercaya (`wss://` atau pemasangan loopback/lokal).

Klien backend proses yang sama dan tepercaya (`client.id: "gateway-client"`,
`client.mode: "backend"`) dapat menghilangkan `device` pada koneksi loopback langsung saat
melakukan autentikasi dengan token/kata sandi gateway bersama. Jalur ini dikhususkan
untuk RPC bidang kontrol internal (misalnya pembaruan sesi subagen) dan mencegah
baseline pemasangan CLI/perangkat yang usang menghambat pekerjaan backend lokal. Klien jarak jauh,
berasal dari browser, node, serta klien token perangkat/identitas perangkat eksplisit tetap
melewati pemeriksaan pemasangan dan peningkatan cakupan normal.

### Peran worker dan protokol tertutup

Worker cloud menggunakan ingress loopback khusus melalui tunnel SSH yang dimiliki gateway
dan disematkan ke kunci host. Ingress ini hanya menerima identitas worker dan tidak pernah mengirimkan
autentikasi umum, peristiwa node, RPC operator, atau metode plugin. `connect` yang ketat
memverifikasi kredensial berumur pendek dengan hash saat disimpan yang terikat pada lingkungan, hash
bundel, epoch pemilik, versi set RPC, kedaluwarsa, dan satu sesi yang dapat bernilai null; secara
terpisah, ini memeriksa versi dan set fitur saat ini. Keberhasilan mengembalikan
`worker-hello-ok` minimal; negosiasi fitur tidak bergantung pada versi protokol
umum. Frame tetap di bawah 64 KiB, kecuali frame `worker.inference.start` yang dinegosiasikan
dapat berukuran hingga 25 MiB. Daftar izin tertutup berisi `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start`, dan
`worker.inference.cancel`.

Commit transkrip menggunakan fencing epoch pemilik, pengikatan sesi yang dimiliki gateway,
compare-and-swap leaf dasar, dan pemutaran ulang urutan yang tahan lama; gateway menghasilkan
ID entri transkrip dan induk melalui penulis sesi normal. Kepemilikan dan
kedaluwarsa diperiksa ulang pada setiap RPC.

### Kapabilitas klien

Klien operator dapat mengiklankan kapabilitas opsional dalam `connect.params.caps`:

- `tool-events`: menerima peristiwa siklus hidup alat yang terstruktur.
- `inline-widgets`: dapat merender hasil alat widget inline yang dihosting.

Kapabilitas klien mendeskripsikan klien yang terhubung, bukan otorisasi. Alat agen dapat mendeklarasikan kapabilitas yang diperlukan; Gateway menghilangkan alat tersebut kecuali setiap persyaratan muncul dalam `caps` milik klien asal. Eksekusi yang berasal dari kanal tidak memiliki kapabilitas klien Gateway, sehingga alat yang dibatasi berdasarkan kapabilitas tidak tersedia meskipun kebijakan alat secara eksplisit mengizinkannya.

### Contoh koneksi node

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

Node mendeklarasikan klaim kapabilitas pada saat terhubung:

- `caps`: kategori tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: sakelar terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan semuanya sebagai klaim dan memberlakukan daftar izin di sisi server.

## Peran dan cakupan

Untuk model cakupan operator lengkap, pemeriksaan pada waktu persetujuan, dan semantik
rahasia bersama, lihat [Cakupan operator](/id/gateway/operator-scopes).

Peran:

- `operator`: klien bidang kontrol (CLI/UI/otomatisasi).
- `node`: host kapabilitas (kamera/layar/kanvas/system.run).
- `worker`: host eksekusi cloud pada protokol worker khusus yang tertutup.

Cakupan operator (`src/gateway/operator-scopes.ts`), kumpulan tertutup lengkap:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets` (atau
`operator.admin`). Saat rahasia disertakan, baca kredensial penyedia Talk aktif
dari `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
tetap berbentuk sumber dan dapat berupa objek SecretRef atau string yang disunting.

Metode RPC gateway yang didaftarkan plugin dapat meminta cakupan operatornya sendiri,
tetapi prefiks inti yang dicadangkan ini selalu diresolusikan menjadi `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Cakupan metode hanyalah gerbang pertama. Beberapa perintah garis miring yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat: penulisan `/config set` dan
`/config unset` yang persisten memerlukan `operator.admin` bahkan bagi klien gateway yang
sudah memiliki cakupan operator yang lebih rendah.

`node.pair.approve` memiliki pemeriksaan cakupan tambahan pada waktu persetujuan di atas cakupan
metode dasar (`operator.pairing`), berdasarkan `commands` yang dideklarasikan
oleh permintaan tertunda (`src/infra/node-pairing-authz.ts`):

| Perintah yang dideklarasikan                                                                                                  | Cakupan yang diperlukan                  |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| tidak ada                                                                                                                     | `operator.pairing`                       |
| perintah biasa                                                                                                                | `operator.pairing` + `operator.write` |
| mencakup `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, atau `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Kapabilitas/perintah/izin (node)

Node mendeklarasikan klaim kapabilitas saat terhubung:

- `caps`: kategori kapabilitas tingkat tinggi seperti `camera`, `canvas`, `screen`,
  `location`, `voice`, dan `talk`.
- `commands`: daftar izin perintah untuk pemanggilan.
- `permissions`: sakelar terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan memberlakukan daftar izin di sisi server.
Node yang terhubung dapat memublikasikan deskriptor alat plugin atau MCP opsional yang terlihat oleh agen
dengan `node.pluginTools.update` setelah berhasil terhubung atau
terhubung kembali. Host node tanpa antarmuka memulai ulang untuk menerapkan perubahan inventaris MCP
deklaratif. Metode pembaruan ini adalah satu-satunya jalur publikasi; deskriptor alat plugin tidak diterima dalam
parameter `connect`. Setiap deskriptor harus menggunakan `name` alat yang aman bagi penyedia dan menyebutkan
`command` dalam daftar izin perintah node saat ini. Gateway memercayai metadata deskriptor
dari node yang dipasangkan, menyaring deskriptor di luar permukaan perintah yang disetujui,
menghapusnya saat node terputus, dan menolak upaya operator
untuk mengubah katalog node lain. Atur `gateway.nodes.pluginTools.enabled: false`
untuk mengabaikan deskriptor yang dipublikasikan node.

Host node yang terhubung memublikasikan katalog pengganti skill lengkapnya dengan
`node.skills.update`. Metode peran node ini adalah satu-satunya jalur publikasi skill
node; skill tidak diterima dalam parameter `connect`. Setiap deskriptor berisi
nama yang aman, deskripsi, dan konten `SKILL.md` yang dibatasi. Gateway mengurai
konten tersebut dengan pemuat skill normal, menyertakannya dalam snapshot skill agen
selama node terhubung, dan menghapusnya saat terputus. Atur
`gateway.nodes.skills.enabled: false` untuk mengabaikan skill yang dipublikasikan node.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat, termasuk
  `deviceId`, `roles`, dan `scopes`, sehingga UI dapat menampilkan satu baris per perangkat meskipun
  perangkat tersebut terhubung sebagai operator sekaligus node.
- `node.list` mencakup `lastSeenAtMs` dan `lastSeenReason` opsional. Node yang terhubung
  melaporkan waktu koneksi saat ini dengan alasan `connect`; node yang dipasangkan juga dapat
  melaporkan kehadiran latar belakang yang persisten melalui peristiwa node tepercaya.

Node macOS native juga dapat mengirim peristiwa `node.presence.activity` terautentikasi
dengan waktu idle input yang dibatasi. Gateway memperoleh stempel waktu aktivitas berdasarkan
waktunya sendiri, mengekspos Mac terhubung terbaru melalui `node.list` dan
`node.describe`, serta menyiarkan pembaruan `node.presence` kepada klien dengan cakupan baca.
Lihat [Kehadiran komputer aktif](/id/nodes/presence) untuk perilaku pemilihan, privasi, konteks
model, dan perutean notifikasi.

### Peristiwa node tetap aktif di latar belakang

Node memanggil `node.event` dengan `event: "node.presence.alive"` untuk mencatat bahwa
node yang dipasangkan aktif selama pengaktifan latar belakang, tanpa menandainya sebagai terhubung:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"iPhone milik Peter\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` adalah enum tertutup: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Nilai yang tidak dikenal dinormalisasi menjadi
`background` (`src/shared/node-presence.ts`). Peristiwa hanya dipersistenkan untuk
sesi perangkat node terautentikasi; sesi tanpa perangkat atau yang belum dipasangkan mengembalikan
`handled: false`.

Gateway yang berhasil mengembalikan hasil terstruktur:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway lama mungkin hanya mengembalikan `{ "ok": true }` untuk `node.event`; perlakukan itu
sebagai RPC yang telah diterima, bukan persistensi kehadiran yang tahan lama.

## Penentuan cakupan peristiwa siaran

Peristiwa siaran yang dikirim server dibatasi berdasarkan cakupan agar sesi yang
hanya memiliki cakupan pemasangan atau khusus node tidak menerima konten sesi secara pasif
(`src/gateway/server-broadcast.ts`):

- Frame obrolan, agen, dan hasil alat (peristiwa `agent` yang dialirkan, peristiwa
  hasil alat) memerlukan setidaknya `operator.read`. Sesi tanpanya melewati
  frame ini sepenuhnya.
- Siaran `plugin.*` yang ditentukan plugin secara default dibatasi untuk `operator.write` atau
  `operator.admin`; entri eksplisit seperti
  `plugin.approval.requested` / `plugin.approval.resolved` menggunakan
  `operator.approvals` sebagai gantinya.
- Peristiwa status/transportasi (`heartbeat`, `presence`, `tick`, siklus hidup
  terhubung/terputus) tetap tidak dibatasi agar kesehatan transportasi dapat diamati oleh setiap
  sesi terautentikasi.
- Kelompok peristiwa siaran yang tidak dikenal secara default dibatasi berdasarkan cakupan (gagal-tertutup)
  kecuali penangan terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per kliennya sendiri, sehingga siaran
tetap diurutkan secara monoton pada soket tersebut meskipun klien yang berbeda melihat
subset aliran peristiwa yang berbeda setelah difilter berdasarkan cakupan.

## Kelompok metode RPC

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibuat dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode plugin/saluran
yang dimuat—bukan dump yang dihasilkan dari setiap metode, dan beberapa metode (misalnya
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sengaja dikecualikan dari penemuan meskipun merupakan metode nyata yang dapat
dipanggil. Perlakukan ini sebagai penemuan fitur, bukan enumerasi lengkap
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang disimpan dalam cache atau baru diperiksa.
    - `diagnostics.stability` mengembalikan pencatat stabilitas diagnostik terbaru yang dibatasi: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/plugin, ID sesi. Tidak ada teks obrolan, isi webhook, keluaran alat, isi permintaan/respons mentah, token, cookie, atau rahasia. Memerlukan `operator.read`.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; bidang sensitif hanya untuk klien operator dengan cakupan admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relai dan pemasangan.
    - `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks kehadiran.
    - `last-heartbeat` mengembalikan peristiwa heartbeat terbaru yang dipersistenkan.
    - `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat pada gateway.
    - `gateway.suspend.prepare` membuat sewa penangguhan kooperatif singkat hanya ketika pekerjaan Gateway yang dilacak sedang idle. `gateway.suspend.status` memeriksa sewa tersebut, dan `gateway.suspend.resume` melepaskannya setelah diaktifkan kembali atau operasi host dibatalkan.

  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime. Lihat "tampilan `models.list`" di bawah.
    - `usage.status` mengembalikan ringkasan jendela penggunaan/kuota tersisa penyedia.
    - `usage.cost` mengembalikan ringkasan agregat penggunaan biaya untuk suatu rentang tanggal. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mengagregasi agen yang dikonfigurasi.
    - `doctor.memory.status` mengembalikan kesiapan memori vektor/embedding yang disimpan dalam cache untuk ruang kerja agen default yang aktif. Teruskan `{ "probe": true }` atau `{ "deep": true }` hanya untuk ping penyedia embedding langsung secara eksplisit. Teruskan `{ "agentId": "agent-id" }` untuk membatasi statistik penyimpanan Dreaming pada satu ruang kerja agen; jika dihilangkan, ruang kerja Dreaming yang dikonfigurasi akan diagregasi.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, dan `doctor.memory.dedupeDreamDiary` menerima `{ "agentId": "agent-id" }` opsional; jika dihilangkan, semuanya beroperasi pada ruang kerja agen default yang dikonfigurasi.
    - `doctor.memory.remHarness` mengembalikan pratinjau harness REM hanya-baca yang dibatasi untuk klien bidang kontrol jarak jauh, termasuk jalur ruang kerja, cuplikan memori, markdown berbasis sumber yang dirender, dan kandidat promosi mendalam. Memerlukan `operator.read`.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi. Teruskan `agentId` untuk satu agen, atau `agentScope: "all"` untuk mencantumkan agen yang dikonfigurasi secara bersamaan.
      Kedua metode penggunaan menerima `mode: "specific"` dengan `timeZone` IANA untuk batas dan kelompok hari kalender yang memperhitungkan DST. `utcOffset` tetap didukung untuk klien lama dan sebagai fallback ketika runtime Gateway tidak mengenali zona yang diminta.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

  </Accordion>

  <Accordion title="Saluran dan pembantu login">
    - `channels.status` mengembalikan ringkasan status saluran/plugin bawaan + terbundel.
    - `channels.logout` mengeluarkan akun dari saluran/akun tertentu jika saluran mendukungnya.
    - `web.login.start` memulai alur login QR/web untuk penyedia saluran web berkemampuan QR saat ini.
    - `web.login.wait` menunggu alur tersebut selesai dan memulai saluran jika berhasil.
    - `push.test` mengirim push APNs pengujian ke node iOS yang terdaftar.
    - `voicewake.get` mengembalikan pemicu kata pengaktifan yang tersimpan.
    - `voicewake.set` memperbarui pemicu kata pengaktifan dan menyiarkan perubahan.

  </Accordion>

  <Accordion title="Pengelolaan plugin">
    - `plugins.list` (`operator.read`) mengembalikan inventaris plugin yang terinstal beserta pilihan resmi yang dikurasi secara lokal, diagnostik, dan apakah mode instalasi saat ini mengizinkan perubahan.
    - `plugins.search` (`operator.read`) mencari kelompok plugin kode dan plugin bundel ClawHub yang dapat diinstal. Teruskan `query` yang tidak kosong dan `limit` opsional dari 1 hingga 100.
    - `plugins.install` (`operator.admin`) menginstal entri katalog resmi dengan `{ source: "official", pluginId }` atau paket ClawHub dengan `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Instalasi ClawHub mempertahankan pemeriksaan kepercayaan Gateway, integritas, dan kebijakan instalasi. Instalasi yang berhasil memerlukan Gateway dimulai ulang.
    - `plugins.setEnabled` (`operator.admin`) mengubah kebijakan pengaktifan satu plugin yang terinstal dengan `{ pluginId, enabled }`. Respons mencakup entri katalog yang diperbarui, metadata mulai ulang, dan peringatan pemilihan slot.
    - `plugins.uninstall` (`operator.admin`) menghapus satu plugin yang diinstal secara eksternal dengan `{ pluginId }`: referensi konfigurasi, catatan instalasi, dan file terkelola. Plugin terbundel tidak dapat dihapus instalasinya, hanya dapat dinonaktifkan. Respons mencantumkan tindakan penghapusan dan selalu memerlukan Gateway dimulai ulang.

  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke saluran/akun/utas di luar runner chat.
    - `logs.tail` mengembalikan ekor log berkas Gateway yang dikonfigurasi dengan kontrol kursor/batas dan jumlah maksimum byte.

  </Accordion>

  <Accordion title="Terminal operator">
    - `terminal.open` memulai PTY host untuk `agentId` eksplisit atau agen default dan mengembalikan agen yang dihasilkan, direktori kerja, shell, serta status pembatasan.
    - `terminal.input`, `terminal.resize`, dan `terminal.close` hanya beroperasi pada sesi yang dimiliki oleh koneksi pemanggil.
    - `terminal.upload` menerima satu berkas base64 hingga 16 MiB, menempatkannya di direktori sementara privat selama 24 jam pada host Gateway sesi atau node yang dipasangkan, lalu mengembalikan jalur absolutnya. Pemanggil tetap harus menempelkan atau menggunakan jalur tersebut dengan cara lain; RPC tidak pernah menulis input terminal atau mengeksekusi perintah.
    - Peristiwa `terminal.data` dan `terminal.exit` hanya dialirkan ke koneksi yang memiliki sesi.
    - Sesi yang koneksinya terputus akan dilepas, bukan dihentikan: sesi tetap dapat disambungkan kembali selama `gateway.terminal.detachedSessionTimeoutSeconds` (default 300; `0` memulihkan penghentian saat koneksi terputus), sementara keluaran terbaru terakumulasi dalam buffer sisi server yang dibatasi.
    - `terminal.list` mengembalikan sesi yang dapat disambungkan; `terminal.attach` mengikat ulang sesi aktif atau terlepas ke koneksi pemanggil dan mengembalikan buffer pemutaran ulang (pengambilalihan bergaya tmux — pemilik aktif sebelumnya menerima `terminal.exit` dengan alasan `detached`); `terminal.text` membaca buffer sebagai teks biasa tanpa menyambungkan.
    - Setiap metode terminal memerlukan `operator.admin`; `gateway.terminal.enabled` harus secara eksplisit bernilai true. Agen yang sepenuhnya berada dalam sandbox akan ditolak, dan perubahan kebijakan agen menutup PTY yang ada maupun yang sedang diproses, termasuk yang terlepas.

  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.catalog` mengembalikan katalog penyedia Talk hanya-baca untuk ucapan, transkripsi streaming, dan suara waktu nyata: id penyedia kanonis, alias registri, label, status konfigurasi, hasil `ready` tingkat grup opsional, id model/suara yang diekspos, mode kanonis, transportasi, strategi otak, serta penanda audio/kapabilitas waktu nyata, tanpa mengembalikan rahasia penyedia atau mengubah konfigurasi global. Gateway saat ini menetapkan `ready` setelah menerapkan pemilihan penyedia saat runtime; anggap ketiadaannya sebagai belum terverifikasi pada Gateway lama.
    - `talk.config` mengembalikan payload konfigurasi Talk yang efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.session.create` membuat sesi Talk milik Gateway untuk `realtime/gateway-relay`, `transcription/gateway-relay`, atau `stt-tts/managed-room`. Untuk `stt-tts/managed-room`, pemanggil `operator.write` yang meneruskan `sessionKey` juga harus meneruskan `spawnedBy` untuk visibilitas kunci sesi yang tercakup; pembuatan `sessionKey` tanpa cakupan dan `brain: "direct-tools"` memerlukan `operator.admin`.
    - `talk.session.join` memvalidasi token sesi ruang terkelola, memancarkan `session.ready` atau `session.replaced` sesuai kebutuhan, dan mengembalikan metadata ruang/sesi beserta peristiwa Talk terbaru, tanpa pernah mengembalikan token teks biasa atau hash-nya.
    - `talk.session.appendAudio` menambahkan audio masukan PCM base64 ke sesi relai waktu nyata dan transkripsi milik Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn`, dan `talk.session.cancelTurn` mengendalikan siklus hidup giliran ruang terkelola dengan penolakan giliran usang sebelum status dibersihkan.
    - `talk.session.cancelOutput` menghentikan keluaran audio asisten, terutama untuk interupsi yang dibatasi VAD dalam sesi relai Gateway.
    - `talk.session.submitToolResult` menyelesaikan pemanggilan alat penyedia yang dipancarkan oleh sesi relai waktu nyata milik Gateway. Permintaan menunggu setiap sinyal penyelesaian asinkron yang diekspos oleh jembatan penyedia; pengiriman yang gagal mempertahankan proses tertaut tetap aktif dan tidak memancarkan peristiwa hasil alat yang berhasil. Teruskan `options: { willContinue: true }` untuk keluaran alat sementara atau `options: { suppressResponse: true }` ketika jembatan penyedia mengiklankan dukungan supresi dan hasilnya tidak boleh memulai respons lain.
    - `talk.session.steer` mengirimkan kontrol suara proses aktif ke sesi Talk berbasis agen milik Gateway: `{ sessionId, text, mode? }`, dengan `mode` berupa `status`, `steer`, `cancel`, atau `followup`; mode yang tidak dicantumkan diklasifikasikan dari teks yang diucapkan.
    - `talk.session.close` menutup sesi relai, transkripsi, atau ruang terkelola milik Gateway dan memancarkan peristiwa Talk terminal.
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.client.create` membuat atau melanjutkan sesi penyedia waktu nyata milik klien menggunakan `webrtc` atau `provider-websocket`, sementara Gateway memiliki kredensial, instruksi, kebijakan alat, dan `voiceSessionId` yang dikembalikan. Klien meneruskan `sessionKey` dan menggunakan kembali `voiceSessionId` saat mengganti transportasi penyedia selama satu panggilan.
    - `talk.client.transcript` menambahkan satu item `{ role, text }` yang telah difinalisasi ke sesi agen normal. `entryId` yang diwajibkan bersifat idempoten dalam `voiceSessionId`; percobaan ulang tidak menduplikasi pesan transkrip.
    - `talk.client.close` menutup sesi suara logis setelah penulisan transkrip yang tertunda. Penutupan bersifat idempoten dan dapat mengirimkan ringkasan panggilan khusus mutasi ke saluran non-WebChat terakhir sesi.
    - `talk.client.toolCall` memungkinkan transportasi waktu nyata milik klien meneruskan pemanggilan alat penyedia ke kebijakan Gateway. Alat pertama yang didukung adalah `openclaw_agent_consult`; klien memperoleh id proses dan menunggu peristiwa siklus hidup chat normal sebelum mengirimkan hasil alat khusus penyedia. Tindakan berdampak tinggi yang terikat suara mengembalikan `VOICE_CONFIRMATION_REQUIRED:<id>` hingga ujaran pengguna berikutnya yang telah difinalisasi secara eksplisit mengonfirmasi tindakan tersebut secara tepat dan konsultasi berikutnya menyediakan `confirmationId`.
    - `talk.client.steer` mengirimkan kontrol suara proses aktif untuk transportasi waktu nyata milik klien. Gateway menentukan proses tertanam aktif dari `sessionKey` dan mengembalikan hasil penerimaan/penolakan terstruktur alih-alih mengabaikan pengarahan secara diam-diam.
    - `talk.event` adalah saluran peristiwa Talk tunggal untuk adaptor waktu nyata, transkripsi, STT/TTS, ruang terkelola, telefoni, dan rapat.
    - `talk.speak` menyintesis ucapan melalui penyedia ucapan Talk yang aktif.
    - `tts.status` mengembalikan status pengaktifan TTS, penyedia aktif, penyedia cadangan, dan status konfigurasi penyedia.
    - `tts.providers` mengembalikan inventaris penyedia TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengalihkan status preferensi TTS.
    - `tts.setProvider` memperbarui penyedia TTS pilihan.
    - `tts.convert` menjalankan konversi teks ke ucapan sekali jalan.
    - `tts.speak` (`operator.write`) merender `text` yang tidak kosong dengan rantai penyedia TTS umum yang dikonfigurasi dan mengembalikan satu klip utuh secara inline sebagai `audioBase64`, beserta `provider` dan metadata opsional `outputFormat`, `mimeType`, dan `fileExtension`. Tidak seperti `tts.convert`, metode ini tidak mengembalikan jalur lokal Gateway; tidak seperti `talk.speak`, metode ini tidak memerlukan penyedia Talk. Teks di atas `messages.tts.maxTextLength` mengembalikan `INVALID_REQUEST`; kegagalan sintesis mengembalikan `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Rahasia, konfigurasi, pembaruan, dan wizard">
    - `secrets.reload` menentukan ulang SecretRef aktif dan menerbitkan status runtime yang memahami pemilik secara atomik. Kegagalan pemilik yang memenuhi syarat dapat diterbitkan sebagai degradasi dingin atau usang dengan `warningCount`; kegagalan ketat atau yang tidak dipetakan menolak pemuatan ulang dan mempertahankan snapshot aktif.
    - `secrets.resolve` menyelesaikan penetapan rahasia target perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot konfigurasi pada disk saat ini, `hash` berkas root mentah, `configRevisionHash` yang telah dihasilkan, dan `appliedConfigHash` opsional untuk revisi hasil resolusi yang diterima oleh runtime Gateway aktif.
    - `config.set` menulis payload konfigurasi yang telah divalidasi.
    - `config.patch` menggabungkan pembaruan konfigurasi parsial. Penggantian larik yang destruktif memerlukan jalur yang terdampak di `replacePaths`; larik bertingkat di bawah entri larik menggunakan jalur `[]` seperti `agents.list[].skills`.
    - `config.apply` memvalidasi + mengganti seluruh payload konfigurasi.
    - `config.schema` mengembalikan payload skema konfigurasi aktif yang digunakan oleh Control UI dan alat CLI: skema, `uiHints`, versi, metadata pembuatan, serta metadata skema Plugin + saluran jika dapat dimuat. Payload ini mencakup metadata `title` / `description` dari label/teks bantuan yang sama seperti UI, termasuk cabang komposisi objek bertingkat, karakter pengganti, item larik, dan `anyOf` / `oneOf` / `allOf` jika dokumentasi bidang yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload pencarian yang tercakup jalur untuk satu jalur konfigurasi: jalur yang dinormalisasi, node skema dangkal, petunjuk yang cocok + `hintPath`, `reloadKind` opsional, dan ringkasan turunan langsung untuk penelusuran mendalam UI/CLI. `reloadKind` adalah salah satu dari `restart`, `hot`, atau `none` (`src/config/schema.ts`) dan mencerminkan perencana pemuatan ulang konfigurasi Gateway untuk jalur yang diminta. Node skema pencarian mempertahankan dokumentasi yang terlihat oleh pengguna dan bidang validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/larik/objek, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan turunan mengekspos `key`, `path` yang dinormalisasi, `type`, `required`, `hasChildren`, `reloadKind` opsional, beserta `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan Gateway dan menjadwalkan pemulaian ulang hanya jika pembaruan berhasil; pemanggil yang memiliki sesi dapat menyertakan `continuationMessage` agar proses awal melanjutkan satu giliran agen tindak lanjut melalui antrean kelanjutan pemulaian ulang. Pembaruan pengelola paket dan pembaruan checkout git terawasi dari bidang kontrol menggunakan serah-terima layanan terkelola yang terlepas, alih-alih mengganti pohon paket atau mengubah keluaran checkout/build di dalam Gateway aktif. Serah-terima yang dimulai mengembalikan `ok: true` dengan `result.reason: "managed-service-handoff-started"` dan `handoff.status: "started"`. `update.run` konkuren kedua yang ditangani oleh proses Gateway yang sama mengembalikan `ok: false` dengan `result.reason: "managed-service-handoff-already-running"` dan `handoff.status: "already-running"`; kelanjutannya tidak diterima, sehingga pemanggil dapat mencoba lagi setelah pembaruan aktif selesai. Pembaru CLI mandiri dan proses Gateway pengganti berada di luar pengaman lokal proses ini. Serah-terima yang tidak tersedia atau gagal mengembalikan `ok: false` dengan `managed-service-handoff-unavailable` atau `managed-service-handoff-failed`, beserta `handoff.command` ketika pembaruan shell manual diperlukan. Tidak tersedia berarti OpenClaw tidak memiliki batas supervisor yang aman atau identitas layanan yang persisten, seperti `OPENCLAW_SYSTEMD_UNIT` untuk systemd. Selama serah-terima yang dimulai, sentinel pemulaian ulang dapat melaporkan `stats.reason: "restart-health-pending"` untuk sementara; kelanjutan ditunda hingga CLI memverifikasi Gateway yang dimulai ulang dan menulis sentinel `ok` akhir.
    - `update.status` menyegarkan dan mengembalikan sentinel pemulaian ulang pembaruan terbaru, termasuk versi yang berjalan setelah pemulaian ulang jika tersedia.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard orientasi awal melalui WS RPC.

  </Accordion>

  <Accordion title="Pembantu agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi, termasuk metadata model dan runtime efektif.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan pengkabelan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file ruang kerja bootstrap yang diekspos untuk agen.
    - `audit.activity.list` mengembalikan buku besar aktivitas khusus metadata yang memiliki versi; `audit.list` tetap menjadi RPC eksekusi/alat yang aman untuk kompatibilitas.
    - `agents.workspace.list` dan `agents.workspace.get` (`operator.read`) menyediakan penelusuran direktori ruang kerja agen yang hanya-baca dan berpaginasi bagi klien dalam domain operator tepercaya yang dijelaskan di [Cakupan operator](/id/gateway/operator-scopes). Permintaan hanya menerima jalur relatif terhadap ruang kerja; pembacaan tetap terbatas pada root ruang kerja yang telah di-resolve ke jalur nyata (pelolosan melalui symlink dan hardlink ditolak), dibatasi ukurannya, dan dibatasi pada teks UTF-8 serta jenis gambar umum (base64). Respons tidak mengekspos jalur ruang kerja host. Tidak ada operasi tulis dalam namespace ini.
    - `tasks.list`, `tasks.get`, dan `tasks.cancel` mengekspos buku besar tugas gateway kepada klien SDK dan operator. Lihat [RPC buku besar tugas](#task-ledger-rpcs) di bawah.
    - `artifacts.list`, `artifacts.get`, dan `artifacts.download` mengekspos ringkasan dan unduhan artefak yang berasal dari transkrip untuk cakupan `sessionKey`, `runId`, atau `taskId` yang eksplisit. Kueri eksekusi dan tugas me-resolve sesi pemilik di sisi server dan hanya mengembalikan media transkrip dengan asal-usul yang cocok; sumber URL yang tidak aman atau lokal mengembalikan unduhan yang tidak didukung alih-alih mengambilnya di sisi server.
    - `environments.list` dan `environments.status` mempertahankan penemuan lingkungan lokal gateway dan Node. Worker cloud yang dikonfigurasi dan catatan tahan lama yang ditinggalkan oleh profil sebelumnya menambahkan metadata `worker` dengan `providerId`, `leaseId` opsional, `state`, `ageMs`, `idleMs` opsional, dan `attachedSessionIds`. Status siklus hidup worker adalah `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed`, dan `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) menyediakan worker dari profil penyedia plugin yang dikonfigurasi; percobaan ulang dengan kunci yang sama menggunakan kembali operasi tahan lama tersebut. `environments.destroy` (`{ environmentId }`) meminta penghentian idempoten atas lingkungan worker yang tahan lama. Keduanya memerlukan `operator.admin`, merupakan penulisan bidang kontrol, dan mengembalikan bentuk ringkasan lingkungan yang sama dengan yang digunakan oleh respons status.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu hingga eksekusi selesai dan mengembalikan snapshot terminal jika tersedia.

  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini, termasuk metadata `agentRuntime` per baris ketika backend runtime agen dikonfigurasi. Ketika penempatan worker cloud diaktifkan atau status pemulihan tahan lama tersedia, baris sesi juga menyertakan status `placement` tertutup (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed`, atau `failed`) beserta bidang lingkungan, epoch pemilik, ruang kerja, bundel, kursor ACK, atau pemulihan yang spesifik terhadap status.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa transkrip/pesan untuk satu sesi. Berikan `includeApprovals: true` agar juga menerima peristiwa siklus hidup `session.approval` yang telah disanitasi untuk persetujuan yang audiens tersimpannya mencakup sesi tersebut secara tepat dan yang pengikatan peninjaunya mengotorisasi klien pelanggan. Respons langganan kemudian menyertakan `approvalReplay` tertunda yang dibatasi; nilai tersebut bersifat otoritatif ketika `truncated` bernilai false. Keikutsertaan ini berlaku per panggilan langganan, bukan permanen: berlangganan ulang ke sesi yang sama tanpa `includeApprovals: true` menghapus langganan persetujuan yang ada. Selain otoritas baca sesi normal, keikutsertaan ini memerlukan `operator.admin`, atau `operator.approvals` pada perangkat yang dipasangkan.
    - `sessions.preview` mengembalikan pratinjau transkrip yang dibatasi untuk kunci sesi tertentu.
    - `sessions.describe` mengembalikan satu baris sesi gateway untuk kunci sesi yang persis.
    - `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
    - `sessions.create` membuat entri sesi baru. Nilai `model` dan `thinkingLevel` opsional menyimpan penggantian model dan penalaran awal secara atomik. `worktree: true` menyediakan worktree terkelola; `worktreeBaseRef`/`worktreeName` opsional memilih ref dasar dan nama cabang, dan `execNode` (`operator.admin`) mengikat eksekusi sesi ke host Node. Worktree yang dibuat dicantumkan kembali dalam hasil dan disimpan pada baris sesi (`worktree: { id, branch, repoRoot }`). Ketika entri berhasil dibuat tetapi `chat.send` awal yang bersarang ditolak, hasil yang berhasil menyertakan `runStarted: false` dan `runError`; klien dapat mempertahankan prompt dan mencoba ulang menggunakan kunci sesi yang dikembalikan. Pemanggil yang meneruskan `parentSessionKey` dengan `emitCommandHooks: true` juga harus mendeklarasikan disposisi siklus hidup dari child yang berbeda: `succeedsParent: true` mengakhiri parent dengan `session_end`, sedangkan `false` mempertahankan parent tetap aktif dan hanya memancarkan `session_start` milik child. Menghilangkan `succeedsParent` mempertahankan perilaku rollover parent lama bagi klien yang sudah ada. Disposisi tersebut memerlukan tautan parent dan hook perintah; fork tidak dapat menyukseskan parent-nya. Perilaku reset-di-tempat sesi utama tidak berubah karena tidak ada child berbeda yang dibuat.
    - `sessions.dispatch` (`operator.admin`) memindahkan sesi OpenClaw lokal yang sudah ada dengan worktree terkelola milik sesi ke profil worker cloud yang dikonfigurasi. Berikan `{ key, profileId, agentId? }`. Metode ini tidak tersedia ketika tidak ada profil worker yang dikonfigurasi, menutup penerimaan giliran lokal sebelum menguras pekerjaan aktif, dan baru mengembalikan hasil setelah penempatan mencapai kepemilikan worker `active`. Pengiriman bersifat satu arah; penarikan kembali dari worker ke lokal bukan bagian dari RPC ini.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` mengelola katalog grup sesi khusus milik gateway (nama + urutan tampilan). Keanggotaan tetap berada pada bidang `category` setiap sesi; penggantian nama dan penghapusan memperbarui sesi anggota di sisi server.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk suatu sesi. Berikan `key` beserta `runId` opsional, atau hanya `runId` untuk eksekusi aktif yang dapat di-resolve gateway ke suatu sesi.
    - `sessions.patch` memperbarui metadata/penggantian sesi dan melaporkan model kanonis yang telah di-resolve beserta `agentRuntime` efektif.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan secara lengkap.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif sebaris dihapus dari teks yang terlihat, payload XML panggilan alat dalam teks biasa (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang dipotong) serta token kontrol model ASCII/lebar penuh yang bocor dihapus, baris asisten yang hanya berisi token senyap (`NO_REPLY` / `no_reply` secara persis) dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
    - `chat.message.get` adalah pembaca pesan lengkap terbatas yang bersifat aditif untuk satu entri transkrip yang terlihat. Berikan `sessionKey`, `agentId` opsional ketika pemilihan sesi dicakup per agen, dan `messageId` transkrip yang sebelumnya ditampilkan melalui `chat.history`; gateway mengembalikan proyeksi yang dinormalisasi untuk tampilan yang sama tanpa batas pemotongan riwayat ringan ketika entri tersimpan masih tersedia dan tidak terlalu besar.
    - `chat.toolTitles` mengembalikan judul tujuan singkat untuk panggilan alat yang dirender di Control UI (dalam batch, maksimal 24 item dengan input terbatas). Fitur ini bersifat keikutsertaan melalui `gateway.controlUi.toolTitles` (dinonaktifkan secara default); gateway yang dinonaktifkan menjawab `{ titles: {}, disabled: true }` tanpa panggilan model agar klien berhenti meminta. Ketika diaktifkan, judul menggunakan perutean model utilitas standar: `utilityModel` yang dikonfigurasi secara eksplisit (keputusan operator yang, seperti semua tugas utilitas, dapat mengirim konten tugas terbatas ke penyedia yang dipilih), atau default model kecil yang dideklarasikan penyedia sesi sehingga tidak ada tujuan pengiriman keluar baru yang muncul secara implisit; `utilityModel` kosong menonaktifkannya sepenuhnya. Judul tidak pernah beralih sebagai fallback ke model utama. Hasil disimpan dalam cache di basis data status per agen dengan kunci berupa nama alat + input, sehingga tampilan berulang tidak pernah menagihkan ulang panggilan yang sama.
    - `chat.send` menerima `fastMode: "auto"` satu giliran untuk menggunakan mode cepat bagi panggilan model yang dimulai sebelum batas otomatis, lalu memulai percobaan ulang, fallback, hasil alat, atau panggilan lanjutan berikutnya tanpa mode cepat. Batas tersebut secara default adalah 60 detik (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) dan dapat dikonfigurasi per model dengan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Pemanggil `chat.send` dapat meneruskan `fastAutoOnSeconds` satu giliran untuk mengganti batas bagi permintaan tersebut. Berikan `queueMode` (`steer`, `followup`, `collect`, atau `interrupt`) untuk mengganti mode antrean tersimpan hanya bagi permintaan ini; tindakan pengarahan Control UI yang eksplisit menggunakan `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Pemasangan perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat terpasang yang tertunda dan disetujui.
    - `device.pair.setupCode` membuat kode penyiapan perangkat seluler dan, secara default, URL data QR PNG. Operasi ini memerlukan `operator.admin` dan sengaja tidak disertakan dalam penemuan yang diiklankan. Hasilnya menyertakan `setupCode`, `qrDataUrl` opsional, `gatewayUrl`, label nonrahasia `auth`, dan `urlSource`.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola catatan pemasangan perangkat.
    - `device.pair.rename` menetapkan label operator (`{ deviceId, label }`) yang diprioritaskan daripada nama tampilan yang dilaporkan klien dan tetap bertahan setelah perbaikan atau persetujuan ulang perangkat.
    - `device.token.rotate` merotasi token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.
    - `device.token.revoke` mencabut token perangkat terpasang dalam batas peran yang disetujui dan cakupan pemanggilnya.

    Kode penyiapan menyematkan kredensial bootstrap berumur pendek. Klien tidak boleh
    mencatat atau menyimpannya setelah alur pemasangan selesai.

  </Accordion>

  <Accordion title="Pemasangan Node, pemanggilan, dan pekerjaan tertunda">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject`, dan `node.pair.remove` mencakup persetujuan kemampuan Node. `node.pair.request` dan `node.pair.verify` dihapus pada 2026.7 bersama penyimpanan mandiri untuk pemasangan Node; permintaan tertunda dibuat oleh Gateway saat Node terhubung.
    - `node.list` dan `node.describe` mengembalikan status Node yang diketahui/terhubung.
    - `node.rename` memperbarui label Node yang telah dipasangkan.
    - `node.invoke` meneruskan perintah ke Node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan pemanggilan.
    - `mcp.tools.call.v1` adalah perintah host Node tanpa antarmuka untuk memanggil alat MCP lokal Node yang telah dikonfigurasi. Perintah ini diteruskan melalui `node.invoke`, mengharuskan Node mendeklarasikan perintah tersebut, dan tetap tunduk pada persetujuan pemasangan serta `gateway.nodes.denyCommands`.
    - `node.event` membawa peristiwa yang berasal dari Node kembali ke Gateway.
    - `node.pluginTools.update` adalah satu-satunya jalur publikasi untuk mengganti deskriptor alat plugin/MCP milik Node terhubung yang terlihat oleh agen; parameter `connect` tidak membawanya.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang persisten untuk Node yang luring/terputus.

  </Accordion>

  <Accordion title="Kelompok persetujuan">
    - `approval.history` mengembalikan persetujuan terminal dengan urutan terbaru lebih dahulu yang disimpan selama 30 hari untuk permintaan eksekusi, plugin, dan agen sistem (cakupan `operator.approvals`). Ini mendukung paginasi kursor serta filter jenis opsional; persetujuan tertunda bukan baris riwayat.
    - `approval.get` dan `approval.resolve` adalah metode persetujuan persisten yang tidak bergantung pada jenis (cakupan `operator.approvals`). `approval.get` mengembalikan proyeksi terminal tertunda atau tersimpan yang telah disanitasi dengan `urlPath` yang stabil; `approval.resolve` menerima ID persetujuan kanonis, `kind` eksplisit, dan keputusan, menerapkan resolusi berdasarkan jawaban pertama, serta selalu mengembalikan hasil kanonis yang tercatat.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan eksekusi sekali pakai serta pencarian/pemutaran ulang persetujuan tertunda. Semuanya merupakan adaptor batas protokol di atas registri persetujuan persisten yang sama.
    - `exec.approval.waitDecision` menunggu satu persetujuan eksekusi tertunda dan mengembalikan keputusan akhir (atau `null` saat batas waktu tercapai).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan eksekusi Gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan eksekusi lokal Node melalui perintah relai Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang ditentukan plugin.

  </Accordion>

  <Accordion title="Perintah UI Kontrol">
    - `ui.command` memungkinkan pemanggil `operator.write` mengirim perintah tata letak dan navigasi bertipe ke klien UI Kontrol terhubung yang mengiklankan kemampuan `ui-commands`.
    - Perintah mencakup pemisahan/penutupan/fokus panel, visibilitas bilah sisi, visibilitas dan tambatan panel terminal/peramban, serta navigasi sesi.
    - Protokol v1 secara sengaja menyebarkan perintah ke setiap UI Kontrol berkemampuan yang terhubung. Jika tidak ada yang terhubung, permintaan gagal dengan `UNAVAILABLE`, alih-alih berpura-pura bahwa tata letak telah berubah.

  </Accordion>

  <Accordion title="Otomatisasi, Skills, dan alat">
    - Otomatisasi: `wake` menjadwalkan injeksi teks pengaktifan segera atau pada heartbeat berikutnya; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - `cron.run` tetap menjadi RPC bergaya pengantrean untuk eksekusi manual. Klien yang memerlukan semantik penyelesaian harus membaca `runId` yang dikembalikan dan melakukan polling terhadap `cron.runs`.
    - `cron.runs` menerima filter `runId` opsional yang tidak kosong agar klien dapat mengikuti satu eksekusi manual yang diantrekan tanpa mengalami kondisi balapan dengan entri riwayat lain untuk pekerjaan yang sama.
    - Skills dan alat: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Lihat [Metode pembantu operator](#operator-helper-methods) di bawah.

  </Accordion>
</AccordionGroup>

### Kelompok peristiwa umum

- `chat`: pembaruan obrolan UI seperti `chat.inject` dan peristiwa obrolan lain yang hanya ada dalam transkrip. Dalam protokol v4, muatan delta membawa `deltaText`; `message` tetap menjadi snapshot kumulatif asisten. Penggantian nonprefiks menetapkan `replace=true` dan menggunakan `deltaText` sebagai teks pengganti.
- `session.message`, `session.operation`, `session.tool`: pembaruan transkrip, operasi sesi yang sedang berlangsung, dan aliran peristiwa untuk sesi yang dilanggani.
- `session.approval`: kebenaran persetujuan tertunda dan terminal yang telah disanitasi untuk pelanggan sesi persis yang secara eksplisit memilih ikut serta. Persetujuan turunan menggunakan audiens leluhur yang dipersistenkan; peristiwa tidak pernah mengubah transkrip atau membangunkan agen.
- `sessions.changed`: indeks atau metadata sesi berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive/keaktifan berkala.
- `health`: pembaruan snapshot kesehatan Gateway.
- `heartbeat`: pembaruan aliran peristiwa Heartbeat.
- `cron`: peristiwa perubahan eksekusi/pekerjaan Cron.
- `shutdown`: notifikasi penghentian Gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pemasangan Node.
- `node.invoke.request`: siaran permintaan pemanggilan Node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi pemicu kata pengaktifan berubah.
- `config.changed`: penulisan konfigurasi telah dipersistenkan (muatan membawa jalur konfigurasi, hash snapshot baru, dan stempel waktu—tidak pernah membawa isi konfigurasi). Bercakupan baca-operator; klien menyegarkan melalui `config.get`.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan eksekusi.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode pembantu Node

Node dapat memanggil `skills.bins` untuk mengambil daftar terkini executable Skills guna pemeriksaan izin otomatis.

## RPC buku besar audit

`audit.activity.list` memberi klien operator tampilan stabil dengan urutan terbaru lebih dahulu atas metadata siklus hidup eksekusi agen, tindakan alat, dan pesan yang mengharuskan persetujuan ikut serta. Ini memerlukan `operator.read`. Kueri mengecualikan rekaman yang berusia lebih dari 30 hari, dan buku besar SQLite bersama dibatasi hingga 100,000 rekaman. Baris kedaluwarsa dihapus saat Gateway dimulai, pemeliharaan setiap jam, dan penulisan berikutnya. Lihat [Riwayat audit](/id/gateway/audit) untuk model data dan semantik privasi.

- Parameter: `agentId`, `sessionKey`, atau `runId` persis yang bersifat opsional; `kind` opsional (`"agent_run"`, `"tool_action"`, atau `"message"`); `status` opsional (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`, `"blocked"`, atau `"unknown"`); pesan `direction` opsional (`"inbound"` atau `"outbound"`) dan `channel` persis; batas milidetik Unix inklusif `after` / `before` opsional; `limit` opsional dari `1` hingga `500`; serta string `cursor` opsional dari halaman sebelumnya.
- Hasil: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Union hasil V1 bernama memiliki skema terpisah untuk eksekusi agen, tindakan alat, pesan masuk, dan pesan keluar. Diskriminator `eventType` masing-masing adalah `agent_run`, `tool_action`, `inbound_message`, atau `outbound_message`; `kind` dan pesan `direction` tetap tersedia untuk pemfilteran dan tampilan. Setiap peristiwa memiliki bilangan bulat `schemaVersion: 1`. Referensi identitas pesan menggunakan format `hmac-sha256:v1:<32 hex key id>:<64 hex digest>` persis; ID pelaku pengirim kanal menggunakan format yang sama.

Semua varian memerlukan `eventType`, `schemaVersion`, `eventId`, `sequence`, `sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`, dan `redaction`. Bidang varian adalah:

| `eventType`        | Bidang wajib                                                      | Bidang opsional                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referensi identitas, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referensi identitas, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Enum pesan tertutup adalah:

- `conversationKind`: `direct`, `group`, `channel`, atau `unknown`.
- `outcome` masuk: `completed`, `skipped`, atau `failed`; `reasonCode` opsional: `duplicate`, `reply_operation_active`, `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`, `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`, `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`, `acp_dispatch_empty`, atau `acp_dispatch_aborted`.
- `outcome` keluar: `sent`, `suppressed`, `failed`, atau `unknown`; `reasonCode` opsional: `cancelled_by_message_sending_hook`, `cancelled_by_reply_payload_sending_hook`, `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`, atau `no_visible_payload`. Adaptor yang tidak mengembalikan identitas platform adalah `unknown`, karena efek samping eksternal tidak dapat disangkal.
- `deliveryKind`: `text`, `media`, atau `other`; `failureStage`: `platform_send`, `queue`, atau `unknown`.

Bidang terminal saling berkorelasi, bukan opsional secara independen:

| Varian           | Pemetaan terminal                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eksekusi agen    | `started` tidak memiliki `errorCode`; setiap status selesai yang bukan berhasil memerlukan kode `run_*` yang sesuai.                                                                 |
| Tindakan alat    | `started` dan berhasil tidak memiliki `errorCode`; setiap status selesai lainnya memerlukan kode `tool_*` yang sesuai.                                                       |
| Pesan masuk      | berhasil = `completed`; diblokir = `skipped`; gagal = `failed` ditambah `message_processing_failed`. `reasonCode`, jika ada, harus termasuk dalam keluarga terminal tersebut. |
| Pesan keluar     | berhasil = `sent`; diblokir = `suppressed` ditambah `reasonCode`; gagal = `failed` ditambah `errorCode` dan `failureStage`; tidak diketahui = `unknown` ditambah `failureStage`.      |

Setiap peristiwa aktivitas mencakup id peristiwa yang stabil, urutan ledger monotonik,
urutan peristiwa sumber, stempel waktu, pelaku, tindakan, status, bilangan bulat
`schemaVersion: 1`, dan `redaction: "metadata_only"`. Catatan eksekusi dan alat
memerlukan asal-usul agen dan eksekusi serta dapat mencakup asal-usul sesi. Catatan pesan
dapat mencakup id agen dan eksekusi, tetapi sengaja tidak pernah mencakup
`sessionKey` atau `sessionId`; karena itu, filter kueri `sessionKey` hanya berlaku untuk
baris eksekusi dan alat. Peristiwa alat dapat mencakup id panggilan alat dan nama alat.

Catatan pesan menggunakan `message.inbound.processed` atau
`message.outbound.finished` dan menambahkan arah, saluran, jenis percakapan,
hasil yang dinormalisasi, serta jenis pengiriman, tahap kegagalan, durasi,
jumlah hasil, kode alasan, dan pseudonim akun/percakapan/pesan/target
berkunci yang bersifat lokal untuk instalasi. Pseudonim ini membantu
korelasi, tetapi bukan anonimisasi: basis data status memuat kuncinya,
sedangkan ekspor RPC dan CLI tidak. Ledger tidak menyimpan prompt, isi pesan,
argumen alat, hasil alat, keluaran perintah, atau teks kesalahan mentah.
Nilai `sessionKey` eksekusi/alat tetap berupa metadata korelasi mentah dan dapat menyematkan
id akun platform atau rekan; catatan pesan tidak menyertakan kunci sesi.

Untuk baris masuk, `durationMs` mengukur pengiriman inti hingga terminalnya dan
`resultCount` menghitung payload alat, pemblokiran, dan balasan dalam antrean yang telah diselesaikan. Untuk
baris keluar, `durationMs` mencakup kepemilikan pengiriman hingga pengakuan,
surat mati, atau rekonsiliasi (termasuk waktu tunggu dalam antrean), dan `resultCount`
menghitung pengiriman fisik platform yang teridentifikasi. `deliveryKind`, jika ada,
menjelaskan payload efektif setelah hook dan rendering; baris yang dibungkam atau
ambigu akibat crash tidak menyertakannya.

Cakupan pesan saat ini mencakup pesan masuk yang diterima dan mencapai
pengiriman inti, termasuk hasil duplikat/terminal inti. Cakupan keluar menulis
satu baris terminal per payload balasan logis asli yang mencapai pengiriman
bersama yang tahan lama; pemotongan menjadi bagian-bagian dan fan-out adaptor diagregasikan dalam `resultCount`. Pengiriman
yang dapat dicoba ulang dalam antrean atau ambigu hanya dicatat setelah pengakuan, surat
mati, atau rekonsiliasi. Jalur lokal Plugin dan pengiriman langsung yang melewati
batas bersama tersebut belum tercakup. Antrean pekerja terbatas bersifat upaya terbaik
dan dapat menghilangkan catatan saat terjadi kegagalan atau kejenuhan, sehingga permukaan ini bukan
arsip kepatuhan nirhilang.

Perekaman aktif secara default dan dikendalikan oleh
[`audit.enabled`](/id/gateway/configuration-reference#audit). Perekaman pesan
dikendalikan secara terpisah oleh `audit.messages` dan nilai defaultnya adalah `"off"`. Ketika
perekaman dinonaktifkan, `audit.activity.list` tetap menyajikan catatan yang ditulis
sebelumnya hingga kedaluwarsa.

Skema permintaan, hasil, dan `AuditEvent` `audit.list` yang dirilis tetap
tidak berubah dan hanya mengembalikan catatan eksekusi agen dan tindakan alat. Klien
operator baru harus memanggil `audit.activity.list` ketika Gateway mengiklankannya. Gateway
lama mungkin melaporkan `unknown method: audit.activity.list` atau, karena
otorisasi mendahului pencarian metode dalam versi yang dirilis, `missing scope:
operator.admin` terhadap permintaan dengan cakupan baca. Perlakukan yang terakhir sebagai ketiadaan metode
hanya ketika metode tersebut tidak diiklankan. Klien kemudian dapat mencoba kembali `audit.list`
hanya ketika filternya tidak memerlukan dukungan jenis pesan, arah, atau saluran.

Gunakan [`openclaw audit`](/id/cli/audit) untuk kueri teks dan ekspor JSON terbatas.

## RPC ledger tugas

Klien operator memeriksa dan membatalkan catatan tugas latar belakang gateway melalui
RPC ledger tugas (`packages/gateway-protocol/src/schema/tasks.ts`). RPC ini
mengembalikan ringkasan tugas yang telah disanitasi, bukan status runtime mentah.

- `tasks.list` memerlukan `operator.read`.
  - Parameter: `status` opsional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, atau `"timed_out"`) atau larik status tersebut,
    `agentId` opsional, `sessionKey` opsional, `limit` opsional dari `1` hingga
    `500`, dan string `cursor` opsional.
  - Hasil: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` memerlukan `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Hasil: `{ "task": TaskSummary }`.
  - Id tugas yang tidak ditemukan mengembalikan bentuk kesalahan tidak ditemukan milik gateway.
- `tasks.cancel` memerlukan `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Hasil: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` melaporkan apakah ledger memiliki tugas yang cocok. `cancelled`
    melaporkan apakah runtime menerima atau mencatat pembatalan.

`TaskSummary` mencakup `id`, `status`, dan metadata opsional: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, stempel waktu, progres,
ringkasan terminal, dan teks kesalahan yang telah disanitasi. `agentId` mengidentifikasi agen
yang menjalankan tugas; `sessionKey` dan `ownerKey` mempertahankan konteks peminta dan kontrol.

## Metode pembantu operator

- `commands.list` (`operator.read`) mengambil inventaris perintah runtime untuk
  sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - `scope` mengontrol permukaan yang ditargetkan oleh `name` utama: `text` mengembalikan
    token perintah teks utama tanpa `/` di awal; `native` dan jalur
    default `both` mengembalikan nama native yang mempertimbangkan penyedia jika tersedia.
  - `textAliases` memuat alias garis miring yang persis seperti `/model` dan `/m`.
  - `nativeName` memuat nama perintah native yang mempertimbangkan penyedia jika
    tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native serta ketersediaan perintah
    Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen berseri dari respons.
- `tools.catalog` (`operator.read`) mengambil katalog alat runtime untuk sebuah
  agen. Respons mencakup alat yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik Plugin ketika `source="plugin"`
  - `optional`: apakah alat Plugin bersifat opsional
- `tools.effective` (`operator.read`) mengambil inventaris alat efektif-runtime
  untuk sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway memperoleh konteks runtime tepercaya dari sesi di sisi server
    alih-alih menerima konteks autentikasi atau pengiriman yang diberikan pemanggil.
  - Respons adalah proyeksi yang berasal dari server dan tercakup pada sesi atas inventaris
    aktif, termasuk alat inti, Plugin, kanal, serta server MCP
    yang telah ditemukan.
  - `tools.effective` bersifat hanya-baca untuk MCP: ini dapat memproyeksikan katalog MCP
    sesi yang sudah aktif melalui kebijakan alat akhir, tetapi tidak membuat runtime MCP,
    menghubungkan transportasi, atau menerbitkan `tools/list`. Jika tidak ada katalog aktif
    yang cocok, respons dapat menyertakan pemberitahuan seperti `mcp-not-yet-connected`,
    `mcp-not-yet-listed`, atau `mcp-stale-catalog`.
  - Entri alat efektif menggunakan `source="core"`, `source="plugin"`,
    `source="channel"`, atau `source="mcp"`.
- `tools.invoke` (`operator.write`) memanggil satu alat yang tersedia melalui
  jalur kebijakan Gateway yang sama dengan `/tools/invoke`.
  - `name` wajib diisi. `args`, `sessionKey`, `agentId`, `confirm`, dan
    `idempotencyKey` bersifat opsional.
  - Jika `sessionKey` dan `agentId` sama-sama tersedia, agen sesi yang diresolusi
    harus cocok dengan `agentId`.
  - Pembungkus inti khusus pemilik seperti `cron`, `gateway`, dan `nodes` memerlukan
    identitas pemilik/admin (`operator.admin`) meskipun `tools.invoke` sendiri
    adalah `operator.write`.
  - Respons adalah amplop yang ditujukan untuk SDK dengan `ok`, `toolName`, `output`
    opsional, dan bidang `error` bertipe. Penolakan persetujuan atau kebijakan mengembalikan
    `ok:false` dalam muatan alih-alih melewati Pipeline
    kebijakan alat Gateway.
- `skills.status` (`operator.read`) mengambil inventaris Skills yang terlihat untuk sebuah
  agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - Respons mencakup kelayakan, persyaratan yang belum terpenuhi, pemeriksaan konfigurasi,
    dan opsi penginstalan yang telah disanitasi tanpa mengekspos nilai rahasia mentah.
- `skills.search` dan `skills.detail` (`operator.read`) mengembalikan metadata
  penemuan ClawHub.
- `skills.upload.begin`, `skills.upload.chunk`, dan `skills.upload.commit`
  (`operator.admin`) menyiapkan arsip Skills privat sebelum menginstalnya. Ini
  adalah jalur unggah admin terpisah untuk klien tepercaya, bukan alur
  penginstalan Skills ClawHub normal, dan dinonaktifkan secara default kecuali
  `skills.install.allowUploadedArchives` diaktifkan.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    membuat unggahan yang terikat pada slug dan nilai force tersebut.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` menambahkan byte pada
    offset terdekode yang persis.
  - `skills.upload.commit({ uploadId, sha256? })` memverifikasi ukuran akhir dan
    SHA-256. Commit hanya menyelesaikan unggahan; tindakan ini tidak menginstal Skills.
  - Arsip Skills yang diunggah adalah arsip zip yang memuat akar `SKILL.md`. Nama
    direktori internal arsip tidak pernah menentukan target penginstalan.
- `skills.install` (`operator.admin`) memiliki tiga mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal sebuah
    folder Skills ke direktori `skills/` ruang kerja agen default.
  - Mode unggah: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    menginstal unggahan yang telah di-commit ke direktori `skills/<slug>`
    ruang kerja agen default. Slug dan nilai force harus cocok dengan
    permintaan `skills.upload.begin` asli. Ditolak kecuali
    `skills.install.allowUploadedArchives` diaktifkan; pengaturan ini tidak
    memengaruhi penginstalan ClawHub.
  - Mode penginstal Gateway: `{ name, installId, timeoutMs? }` menjalankan tindakan
    `metadata.openclaw.install` yang dideklarasikan pada host Gateway. Klien lama mungkin
    masih mengirim `dangerouslyForceUnsafeInstall`; bidang ini sudah tidak digunakan,
    hanya diterima untuk kompatibilitas protokol, dan diabaikan. Gunakan
    `security.installPolicy` untuk keputusan penginstalan yang dimiliki operator.
- `skills.update` (`operator.admin`) memiliki dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua penginstalan ClawHub yang terlacak di
    ruang kerja agen default.
  - Mode konfigurasi menambal nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

### Tampilan `models.list`

`models.list` menerima parameter `view` opsional
(`src/agents/model-catalog-visibility.ts`):

- Dihilangkan atau `"default"`: jika `agents.defaults.modelPolicy.allow` dikonfigurasi,
  responsnya adalah katalog yang diizinkan, termasuk model yang ditemukan secara dinamis
  untuk entri `provider/*`. Jika tidak, responsnya adalah katalog Gateway
  lengkap.
- `"configured"`: perilaku berukuran pemilih. Jika `agents.defaults.modelPolicy.allow`
  dikonfigurasi, nilai tersebut tetap diprioritaskan, termasuk penemuan yang tercakup pada penyedia untuk
  entri `provider/*`. Tanpa daftar izin, respons menggunakan entri
  `models.providers.<provider>.models` eksplisit, dan hanya kembali ke katalog
  lengkap jika tidak ada baris model yang dikonfigurasi.
- `"provider-config"`: inventaris `models.providers.*.models` yang dibuat oleh sumber,
  terlepas dari daftar izin pemilih. Baris mencakup kemampuan model publik dan
  ketersediaan yang mempertimbangkan rute, tetapi tidak menyertakan titik akhir penyedia, materi autentikasi, dan
  konfigurasi permintaan runtime.
- `"all"`: katalog Gateway lengkap, melewati `agents.defaults.modelPolicy.allow`. Gunakan untuk
  UI diagnostik/penemuan, bukan pemilih model normal.

## Persetujuan eksekusi

- Ketika permintaan eksekusi memerlukan persetujuan, Gateway menyiarkan
  `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan
  `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan`
  (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan tanpa
  `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara persiapan dan penerusan `system.run` akhir yang disetujui,
  Gateway menolak eksekusi alih-alih memercayai muatan yang diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` (default) mempertahankan perilaku ketat: target pengiriman yang
  tidak dapat diresolusi atau hanya-internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi khusus sesi ketika tidak ada
  rute eksternal yang dapat dikirim yang bisa diresolusi (misalnya sesi
  internal/webchat atau konfigurasi multikanal yang ambigu).
- Hasil akhir `agent` dapat menyertakan `result.deliveryStatus` ketika pengiriman
  diminta, menggunakan status `sent`, `suppressed`, `partial_failed`, dan
  `failed` yang sama seperti didokumentasikan untuk
  [`openclaw agent --json --deliver`](/id/cli/agent#json-delivery-status).

## Pembuatan versi

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION`, dan `MIN_PROBE_PROTOCOL_VERSION` berada di
  `packages/gateway-protocol/src/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`. Klien operator dan UI harus
  menyertakan protokol saat ini dalam rentang tersebut; klien dan server saat ini menjalankan
  protokol v4.
- Klien terautentikasi yang memiliki `role: "node"` dan `client.mode: "node"`
  dapat menggunakan protokol Node N-1 (saat ini v3). Probe mulai ulang ringan menggunakan
  jendela N-1 yang sama. Autentikasi perangkat, pemasangan, cakupan, kebijakan perintah, dan persetujuan
  eksekusi tidak berubah oleh jendela kompatibilitas ini. Kemampuan dan
  perintah Node yang dimiliki Plugin ditahan hingga Node ditingkatkan ke protokol
  saat ini karena permukaan yang di-host bukan bagian dari kontrak N-1.
- Skema dan model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Implementasi klien referensi berada di `packages/gateway-client/src/`
(OpenClaw membungkusnya melalui fasad tipis `src/gateway/client.ts`). Nilai
default ini stabil di seluruh protokol v4 dan merupakan garis dasar yang diharapkan untuk
klien pihak ketiga.

| Konstanta                                  | Nilai bawaan                                               | Sumber                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Batas waktu permintaan (per RPC)                 | `30_000` md                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Batas waktu praautentikasi / tantangan koneksi       | `15_000` md                                           | `packages/gateway-client/src/timeouts.ts` (env `OPENCLAW_HANDSHAKE_TIMEOUT_MS` dapat menaikkan anggaran server/klien yang dipasangkan) |
| Penundaan awal koneksi ulang                 | `1_000` md                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Penundaan maksimum koneksi ulang                     | `30_000` md                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Batas percobaan ulang cepat setelah penutupan token perangkat | `250` md                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Masa tenggang penghentian paksa sebelum `terminate()`     | `250` md                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Batas waktu bawaan `stopAndWait()`           | `1_000` md                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Interval tick bawaan (sebelum `hello-ok`)    | `30_000` md                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Penutupan karena batas waktu tick                        | kode `4000` saat keheningan melebihi `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Server mengumumkan `policy.tickIntervalMs`,
`policy.maxPayload`, dan `policy.maxBufferedBytes` yang berlaku dalam `hello-ok`; klien
harus mematuhi nilai tersebut, bukan nilai bawaan sebelum handshake.

Klien referensi memungkinkan permintaan terbatas memiliki tenggat yang dikonfigurasikan ketika
setiap permintaan tertunda memilikinya. Permintaan `expectFinal` tanpa
`timeoutMs` terbatas, permintaan apa pun dengan `timeoutMs: null`, atau campuran permintaan terbatas dan
tanpa batas membuat watchdog tick tetap aktif. Jika peristiwa masuk dan
respons tetap hening melewati ambang batas waktu tick, klien menutup
soket dengan kode `4000`, menolak setiap permintaan tertunda, dan terhubung kembali. Klien
tidak memutar ulang permintaan yang ditolak setelah terhubung kembali.

## Autentikasi

- Autentikasi Gateway dengan rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada
  `gateway.auth.mode` yang dikonfigurasikan (`"none" | "token" | "password" | "trusted-proxy"`).
- Mode yang membawa identitas seperti Tailscale Serve (`gateway.auth.allowTailscale: true`)
  atau `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan
  autentikasi koneksi dari header permintaan, bukan dari `connect.params.auth.*`.
- `gateway.auth.mode: "none"` ingress privat melewati autentikasi koneksi dengan rahasia bersama
  sepenuhnya; jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pemasangan, Gateway menerbitkan token perangkat yang dibatasi untuk peran +
  cakupan koneksi, yang dikembalikan dalam `hello-ok.auth.deviceToken`. Klien harus
  menyimpannya setelah setiap koneksi yang berhasil.
- Koneksi ulang dengan token perangkat yang tersimpan tersebut juga harus menggunakan kembali
  kumpulan cakupan yang disetujui dan tersimpan untuk token tersebut. Ini mempertahankan akses baca/probe/status
  yang telah diberikan dan mencegah koneksi ulang diam-diam menyusut menjadi
  cakupan implisit khusus admin yang lebih sempit.
- Perakitan autentikasi koneksi sisi klien (`selectConnectAuth` dalam
  `packages/gateway-client/src/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan jika ditetapkan.
  - `auth.token` diisi menurut urutan prioritas: token bersama eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, kemudian token per perangkat yang tersimpan (dikunci berdasarkan
    `deviceId` + `role`).
  - `auth.bootstrapToken` hanya dikirim ketika tidak satu pun hal di atas menghasilkan
    `auth.token`. Token bersama atau token perangkat apa pun yang berhasil ditentukan akan menekannya.
  - Promosi otomatis token perangkat tersimpan pada percobaan ulang satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk endpoint tepercaya: loopback,
    atau `wss://` dengan `tlsFingerprint` yang disematkan. `wss://` publik tanpa penyematan
    tidak memenuhi syarat.
- Bootstrap kode penyiapan bawaan mengembalikan
  `hello-ok.auth.deviceToken` Node utama beserta token operator terbatas dalam
  `hello-ok.auth.deviceTokens` untuk penyerahan seluler tepercaya. Token operator
  menyertakan `operator.talk.secrets` untuk pembacaan konfigurasi Talk native, tetapi
  tidak menyertakan cakupan mutasi pemasangan dan `operator.admin`.
- Saat bootstrap kode penyiapan non-dasar menunggu persetujuan,
  detail `PAIRING_REQUIRED` menyertakan `recommendedNextStep: "wait_then_retry"`,
  `retryable: true`, dan `pauseReconnect: false`. Terus hubungkan ulang dengan
  token bootstrap yang sama sampai permintaan disetujui atau token menjadi
  tidak valid.
- Simpan `hello-ok.auth.deviceTokens` hanya jika koneksi menggunakan autentikasi bootstrap
  pada transport tepercaya seperti `wss://` atau pemasangan loopback/lokal.
- Jika klien memberikan `deviceToken` eksplisit atau `scopes` eksplisit, kumpulan
  cakupan yang diminta pemanggil tersebut tetap menjadi sumber otoritatif; cakupan dalam cache hanya
  digunakan kembali ketika klien menggunakan kembali token per perangkat yang tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan `operator.pairing`). Merotasi atau mencabut
  Node atau peran non-operator lainnya juga memerlukan `operator.admin`.
- `device.token.rotate` mengembalikan metadata rotasi. Nilai ini mengembalikan token
  bearer pengganti hanya untuk panggilan dari perangkat yang sama yang telah diautentikasi dengan
  token perangkat tersebut, sehingga klien yang hanya menggunakan token dapat menyimpan penggantinya sebelum
  terhubung kembali. Rotasi bersama/admin tidak mengembalikan token bearer.
- Penerbitan, rotasi, dan pencabutan token tetap dibatasi pada kumpulan peran
  yang disetujui dan tercatat dalam entri pemasangan perangkat tersebut; mutasi token tidak dapat memperluas atau
  menargetkan peran perangkat yang tidak pernah diberikan oleh persetujuan pemasangan.
- Untuk sesi token perangkat yang dipasangkan, pengelolaan perangkat dibatasi pada perangkat sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat mengelola
  token operator untuk entri perangkatnya sendiri. Pengelolaan token Node dan token
  non-operator lainnya hanya untuk admin, bahkan untuk perangkat pemanggil sendiri.
- `device.token.rotate` dan `device.token.revoke` juga memeriksa kumpulan cakupan
  token operator target terhadap cakupan sesi pemanggil saat ini.
  Pemanggil non-admin tidak dapat merotasi atau mencabut token operator yang cakupannya lebih luas daripada yang
  telah mereka miliki.
- Kegagalan autentikasi menyertakan `error.details.code` beserta petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: salah satu dari `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu kali percobaan ulang terbatas dengan token per perangkat
    dalam cache.
  - Jika percobaan ulang tersebut gagal, hentikan loop koneksi ulang otomatis dan tampilkan panduan
    tindakan operator.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak
  mencakup peran/cakupan yang diminta. Jangan tampilkan ini sebagai token yang salah; minta
  operator memasangkan ulang atau menyetujui kontrak cakupan yang lebih sempit/luas.

## Identitas dan pemasangan perangkat

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang berasal dari
  sidik jari pasangan kunci.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pemasangan diperlukan untuk ID perangkat baru kecuali
  persetujuan otomatis lokal diaktifkan.
- Persetujuan otomatis pemasangan berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur koneksi mandiri lokal backend/kontainer yang terbatas untuk
  alur pembantu dengan rahasia bersama tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai koneksi jarak jauh untuk pemasangan
  dan memerlukan persetujuan.
- Klien WS biasanya menyertakan identitas `device` selama `connect` (operator +
  Node). Satu-satunya pengecualian operator tanpa perangkat adalah jalur kepercayaan eksplisit:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman
    khusus localhost.
  - autentikasi UI Kontrol operator `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (darurat, penurunan
    keamanan parah).
  - RPC backend `gateway-client` loopback langsung pada jalur pembantu internal
    yang dicadangkan.
- Tidak menyertakan identitas perangkat memiliki konsekuensi terhadap cakupan. Ketika koneksi
  operator tanpa perangkat diizinkan melalui jalur kepercayaan eksplisit, OpenClaw
  tetap menghapus cakupan yang dideklarasikan sendiri menjadi kumpulan kosong kecuali jalur tersebut memiliki
  pengecualian pelestarian cakupan yang disebutkan. Metode yang dibatasi cakupan kemudian gagal dengan
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` adalah jalur pelestarian cakupan
  darurat UI Kontrol. Jalur ini tidak memberikan cakupan kepada klien WebSocket
  backend kustom atau berbentuk CLI sembarang.
- Jalur pembantu backend `gateway-client` loopback langsung yang dicadangkan mempertahankan
  cakupan hanya untuk RPC bidang kontrol lokal internal; ID backend kustom tidak
  menerima pengecualian ini.
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi autentikasi perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan sebelum tantangan, `connect`
mengembalikan kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan
`error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                     | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien tidak menyertakan `device.nonce` (atau mengirimkannya kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang kedaluwarsa/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Stempel waktu yang ditandatangani berada di luar penyimpangan yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan sidik jari kunci publik. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi kunci publik gagal.              |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Payload tanda tangan yang diutamakan adalah `v3`
  (`buildDeviceAuthPayloadV3` dalam `packages/gateway-client/src/device-auth.ts`),
  yang mengikat `platform` dan `deviceFamily` selain
  bidang perangkat/klien/peran/cakupan/token/nonce.
- Tanda tangan `v2` lama tetap diterima untuk kompatibilitas, tetapi penyematan
  metadata perangkat yang dipasangkan tetap mengendalikan kebijakan perintah saat tersambung kembali.

## TLS dan penyematan

- TLS didukung untuk koneksi WS (konfigurasi `gateway.tls`).
- Klien dapat secara opsional menyematkan sidik jari sertifikat Gateway melalui
  `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`.

## Cakupan

Protokol ini menyediakan API Gateway lengkap: status, saluran, model, obrolan,
agen, sesi, node, persetujuan, dan lainnya. Permukaan yang tepat ditentukan oleh
skema TypeBox yang diekspor ulang dari `packages/gateway-protocol/src/schema.ts`.

## Terkait

- [Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients)
- [Menyematkan OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Protokol bridge](/id/gateway/bridge-protocol)
- [Panduan operasional Gateway](/id/gateway)
